import { resources } from './state';
import wrap from './proxy';
import ResourceContext from './resource-context';
import { ResourceFactory, ParametrizedResourceFactory } from './types';

/** Provision a resource and return its external API. */
export async function create<
  Controls extends object,
  Args extends Array<unknown>,
>(
  provision:
    | ParametrizedResourceFactory<Controls, Args>
    | ResourceFactory<Controls>,
  ...args: Args
): Promise<Controls> {
  const children: Set<object> = new Set();
  const context = new ResourceContext(children);
  const resource = await provision(context, ...args);

  const controls = resource.value;
  const { proxy, revoke } = wrap(controls);

  resources.set(proxy, {
    resource,
    children,
    revoke,
  });

  return proxy;
}

/**
 * Tear down the resource and all its children, permanently destroying the
 * reference.
 *
 * @todo Add type marker to catch cases where the wrong object is unmounted.
 */
export async function destroy(controls: object) {
  const entry = resources.get(controls);

  if (entry) {
    // Instantly delete to prevent race conditions.
    resources.delete(controls);

    // Free all references.
    entry.revoke();

    // Recursively close out the children first...
    const recursiveUnmounts = Array.from(entry.children).map(destroy);
    const results = await Promise.allSettled(recursiveUnmounts);

    // Then close the parent.
    if (entry.resource.destroy) {
      await entry.resource.destroy();
    }

    // Fail loudly if any of the children couldn't be deallocated.
    results.forEach((result) => {
      if (result.status === 'rejected') {
        throw result.reason;
      }
    });
  }
}
