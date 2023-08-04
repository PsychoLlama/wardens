import { resources, constructed } from './state';
import wrap from './proxy';
import ResourceContext from './resource-context';
import { ResourceFactory, ParametrizedResourceFactory } from './types';

/** Provision a resource and return its external API. */
export const create = async <
  Controls extends object,
  Args extends Array<unknown>,
>(
  provision:
    | ParametrizedResourceFactory<Controls, Args>
    | ResourceFactory<Controls>,
  ...args: Args
): Promise<Controls> => {
  const children: Set<object> = new Set();
  const context = new ResourceContext(children);
  let resource: Awaited<ReturnType<typeof provision>>;

  try {
    resource = await provision(context, ...args);
  } catch (error) {
    // Resource could not be created. Clean up the intermediate resources.
    const orphans = Array.from(children).reverse();
    const deallocations = await Promise.allSettled(
      orphans.map((orphan) => context.destroy(orphan)),
    );

    const failures = deallocations.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    // The intermediate resources could not be destroyed.
    if (failures.length) {
      throw reduceToSingleError(
        failures.map((failure) => failure.reason),
        { cause: error },
      );
    }

    throw error;
  }

  const controls = resource.value;
  const { proxy, revoke } = wrap(controls);

  constructed.add(proxy);
  resources.set(proxy, {
    resource,
    children,
    revoke,
  });

  return proxy;
};

/**
 * Tear down the resource and all its children, permanently destroying the
 * reference.
 */
export const destroy = async (controls: object) => {
  if (!constructed.has(controls)) {
    throw new Error('Cannot destroy object. It is not a resource.');
  }

  const entry = resources.get(controls);

  if (entry) {
    // Instantly delete to prevent race conditions.
    resources.delete(controls);

    // Free all references.
    entry.revoke();

    let parentDeallocation: PromiseSettledResult<void> = {
      status: 'fulfilled',
      value: undefined,
    };

    // Try to close the parent resource...
    if (entry.resource.destroy) {
      try {
        await entry.resource.destroy();
      } catch (error) {
        parentDeallocation = { status: 'rejected', reason: error };
      }
    }

    // Then recursively close out the children...
    const recursiveUnmounts = Array.from(entry.children).reverse().map(destroy);
    const deallocations = await Promise.allSettled(recursiveUnmounts);
    const failures = [parentDeallocation]
      .concat(deallocations)
      .filter(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected',
      );

    // Fail loudly if any of the children couldn't be deallocated.
    if (failures.length) {
      throw reduceToSingleError(failures.map((failure) => failure.reason));
    }
  }
};

const reduceToSingleError = (errors: Array<Error>, options?: ErrorOptions) => {
  return errors.length === 1
    ? errors[0]
    : new BulkDestroyError(errors, options);
};

/** Happens when 2 or more child resources cannot be destroyed. */
class BulkDestroyError extends Error {
  constructor(public failures: Array<unknown>, options?: ErrorOptions) {
    super(
      'Some resources could not be destroyed. See the `failures` property for details.',
      options,
    );
  }
}
