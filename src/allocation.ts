import type Resource from './resource';
import { resources, ownership } from './state';
import wrap from './proxy';
import { MountableResource, UnmountableResource } from './types';

/** Provision a resource and return its external API. */
export async function mount<
  Controls extends object,
  Args extends Array<unknown>,
>(
  Entity: new () =>
    | MountableResource<Controls, Args>
    | Resource<Controls, Args>,
  ...args: Args
): Promise<Controls> {
  const resource = new Entity();

  if (mountable(resource)) {
    await resource.enter(...args);
  }

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
    if (unmountable(entry.resource)) {
      await entry.resource.leave();
    }

    // Fail loudly if any of the children couldn't be deallocated.
    results.forEach((result) => {
      if (result.status === 'rejected') {
        throw result.reason;
      }
    });
  }
}

function mountable(
  resource: MountableResource<object, Array<unknown>> | Resource<object>,
): resource is MountableResource<object, Array<unknown>> {
  return 'enter' in resource;
}

function unmountable(
  resource: UnmountableResource<object> | Resource<object>,
): resource is UnmountableResource<object> {
  return 'leave' in resource;
}
