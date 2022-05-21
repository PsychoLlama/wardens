import type Resource from './resource';
import { resources, ownership } from './state';
import wrap from './proxy';

/** Provision a resource and return its external API. */
export async function mount<Api extends object, InitArgs>(
  Subtype: new () => Resource<Api, InitArgs>,
  params: InitArgs,
): Promise<Api> {
  const resource = new Subtype();
  await resource.enter(params);

  const api = resource.exports();
  const { proxy, revoke } = wrap(api);

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
export async function unmount(api: object) {
  const entry = resources.get(api);

  if (entry) {
    // Instantly delete to prevent race conditions.
    resources.delete(api);

    // Free all references.
    entry.revoke();

    const children = ownership.get(entry.resource)!;
    ownership.delete(entry.resource);

    // Recursively close out the children first...
    const recursiveUnmounts = children.map((api) => unmount(api));
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
