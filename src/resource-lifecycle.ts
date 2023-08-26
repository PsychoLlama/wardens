import { resources, constructed } from './global-weakrefs';
import wrap from './wrap-with-proxy';
import ResourceScope from './resource-scope';
import type { InheritedContext } from './inherited-context';
import { ResourceFactory, ParametrizedResourceFactory } from './utility-types';

/** Provision a resource and return its external API. */
export const createWithContext = async <
  Controls extends object,
  Args extends Array<unknown>,
>(
  state: InheritedContext,
  factory:
    | ParametrizedResourceFactory<Controls, Args>
    | ResourceFactory<Controls>,
  ...args: Args
): Promise<Controls> => {
  const curfew = { enforced: false };
  const children: Set<object> = new Set();
  const context = new ResourceScope(state, children, curfew);
  let resource: Awaited<ReturnType<typeof factory>>;

  try {
    resource = await factory(context, ...args);
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
    curfew,
    resource,
    children,
    revoke,
  });

  return proxy;
};

/**
 * Tear down the resource and all its children, permanently destroying the
 * reference. This works on both root resources and child resources.
 */
export const destroy = async (handle: object) => {
  if (!constructed.has(handle)) {
    throw new Error('Cannot destroy object. It is not a resource.');
  }

  const entry = resources.get(handle);

  if (entry) {
    // Instantly delete to prevent race conditions.
    resources.delete(handle);

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

    // The resource is closed. Prevent new child resources before we start
    // closing down the children.
    entry.curfew.enforced = true;

    // Recursively close out the children...
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
