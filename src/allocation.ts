import type Resource from './resource';
import { resources, ownership } from './state';
import wrap from './proxy';

/** Provision a resource and return its external API. */
export async function mount<
  Controls extends object,
  Args extends Array<unknown>,
>(
  Entity: new () => Resource<Controls, Args>,
  ...args: Args
): Promise<Controls> {
  const resource = new Entity();
  await resource.enter(...args);

  const controls = resource.exports();
  const { proxy, revoke } = wrap(controls);

  resources.set(proxy, {
    resource,
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
export async function unmount(controls: object) {
  const entry = resources.get(controls);

  if (entry) {
    // Instantly delete to prevent race conditions.
    resources.delete(controls);

    // Free all references.
    entry.revoke();

    const children = ownership.get(entry.resource)!;
    ownership.delete(entry.resource);

    // Recursively close out the children first...
    const recursiveUnmounts = children.map((controls) => unmount(controls));
    const results = await Promise.allSettled(recursiveUnmounts);

    // Then close the parent.
    await entry.resource.leave();

    // Fail loudly if any of the children couldn't be deallocated.
    results.forEach((result) => {
      if (result.status === 'rejected') {
        throw result.reason;
      }
    });
  }
}
