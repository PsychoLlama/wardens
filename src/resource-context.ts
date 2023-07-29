import { create, destroy } from './allocation';
import { ResourceFactory, ParametrizedResourceFactory } from './types';

/**
 * An instance of this class is passed to resources as they're being
 * provisioned. It allows them to provision other resources while keeping
 * track of ownership and lifetimes.
 */
export default class ResourceContext {
  #destroyed = new WeakSet<object>();
  #resources: Set<object>;

  constructor(ownedResources: Set<object>) {
    this.#resources = ownedResources;
  }

  /** Provision an owned resource and make sure it doesn't outlive us. */
  public create = async <Controls extends object, Args extends Array<unknown>>(
    factory:
      | ParametrizedResourceFactory<Controls, Args>
      | ResourceFactory<Controls>,
    ...args: Args
  ): Promise<Controls> => {
    const controls = await create(factory, ...args);
    this.#resources.add(controls);

    return controls;
  };

  /**
   * Tear down a resource. Happens automatically when resource owners are
   * deallocated.
   */
  public destroy = async (resource: object) => {
    if (this.#destroyed.has(resource)) {
      throw new Error('Resource already destroyed.');
    }

    if (!this.#resources.has(resource)) {
      throw new Error('You do not own this resource.');
    }

    this.#resources.delete(resource);
    this.#destroyed.add(resource);
    await destroy(resource);
  };
}
