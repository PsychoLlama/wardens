import type Resource from './resource';
import { resources } from './state';

/** Provision a resource and return its external API. */
export async function mount<Api extends object, InitArgs>(
  Subtype: new () => Resource<Api, InitArgs>,
  params: InitArgs,
): Promise<Api> {
  const resource = new Subtype();
  await resource.enter(params);

  const api = resource.exports();

  // The API proxy is the weirdest part of the framework. It prevents objects
  // from being used after they're deallocated, guarantees against memory
  // leaks (all references are freed), and provides a unique index identity
  // for internal state.
  const { proxy, revoke } = Proxy.revocable(api, {});

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
 * @todo Recursively unmount children.
 */
export async function unmount(api: object) {
  const entry = resources.get(api);

  if (entry) {
    resources.delete(api);
    entry.revoke(); // Free all references.

    await entry.resource.leave();
  }
}
