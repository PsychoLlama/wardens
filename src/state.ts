import type Resource from './resource';

interface RevokableResource {
  resource: Resource<object, unknown>;

  /**
   * Destroys outer references to the API and frees the object for garbage
   * collection.
   */
  revoke(): void;
}

/** Maps an external API back to the resource that created it. */
export const resources = new WeakMap<object, RevokableResource>();

/** Maps a resource to all the other resources it provisioned. */
export const ownership = new WeakMap<
  Resource<object, unknown>,
  Array<object>
>();
