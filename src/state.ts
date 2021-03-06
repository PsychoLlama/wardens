import type { Resource } from './types';

interface RevokableResource {
  resource: Resource<object>;

  /** All the resources this resource personally allocated. */
  children: Set<object>;

  /**
   * Destroys outer references to the API and frees the object for garbage
   * collection.
   */
  revoke(): void;
}

/** Maps an external API back to the resource that created it. */
export const resources = new WeakMap<object, RevokableResource>();
