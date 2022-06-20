import { create, destroy } from './allocation';
import { ResourceFactory, ParametrizedResourceFactory } from './types';

/**
 * An instance of this class is passed to resources as they're being
 * provisioned. It allows them to provision other resources while keeping
 * track of ownership and lifetimes.
 */
export default class ResourceContext {
  #resources: Set<object>;

  constructor(ownedResources: Set<object>) {
    this.#resources = ownedResources;
  }

  /** Provision an owned resource and make sure it doesn't outlive us. */
  public async create<Controls extends object, Config>(
    factory:
      | ParametrizedResourceFactory<Controls, Config>
      | ResourceFactory<Controls>,
    config: Config,
  ): Promise<Controls> {
    const controls = await create(factory, config);
    this.#resources.add(controls);

    return controls;
  }

  /**
   * Tear down a resource. Happens automatically when resource owners are
   * deallocated.
   */
  async destroy(resource: object) {
    if (!this.#resources.has(resource)) {
      throw new Error('You do not own this resource.');
    }

    try {
      await destroy(resource);
    } finally {
      this.#resources.delete(resource);
    }
  }
}
