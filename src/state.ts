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

/**
 * Identifies if an object is a Wardens resource. Carries no metadata and
 * objects are never deleted. This is separate from `resources` to avoid
 * retaining associated objects in memory.
 */
export const constructed = new WeakSet<object>();
