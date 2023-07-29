import { resources } from './state';
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
 *
 * @todo Add type marker to catch cases where the wrong object is unmounted.
 */
export const destroy = async (controls: object) => {
  const entry = resources.get(controls);

  if (entry) {
    // Instantly delete to prevent race conditions.
    resources.delete(controls);

    // Free all references.
    entry.revoke();

    // Recursively close out the children first...
    const recursiveUnmounts = Array.from(entry.children).reverse().map(destroy);
    const deallocations = await Promise.allSettled(recursiveUnmounts);
    const failures = deallocations.filter(
      (result): result is PromiseRejectedResult => result.status === 'rejected',
    );

    // Fail loudly if any of the children couldn't be deallocated.
    if (failures.length) {
      throw reduceToSingleError(failures.map((failure) => failure.reason));
    }

    // Then close the parent.
    if (entry.resource.destroy) {
      await entry.resource.destroy();
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
  constructor(
    public failures: Array<unknown>,
    options?: ErrorOptions,
  ) {
    super(
      'Some resources could not be destroyed. See the `failures` property for details.',
      options,
    );
  }
}
