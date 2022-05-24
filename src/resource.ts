import { mount, unmount } from './allocation';
import { ownership } from './state';

/**
 * Represents an arbitrary stateful resource that is asynchronously provisioned
 * and destroyed. Resources can own other resources, and destroying a parent
 * first tears down the children.
 */
export default abstract class Resource<Controls extends object, Config = void> {
  #resources = new WeakSet<object>();
  #children: Array<object> = [];

  constructor() {
    ownership.set(this, this.#children);
  }

  /** A hook that gets called when the resource is created. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async enter(_config: Config) {
    return;
  }

  /** A hook that gets called when the resource is destroyed. */
  async leave() {
    return;
  }

  /** Provision an owned resource and make sure it doesn't outlive us. */
  async allocate<ChildControls extends object, ChildConfig>(
    Child: new () => Resource<ChildControls, ChildConfig>,
    config: ChildConfig,
  ): Promise<ChildControls> {
    const controls = await mount(Child, config);
    this.#resources.add(controls);
    this.#children.push(controls);

    return controls;
  }

  /**
   * Tear down a resource. Happens automatically when resource owners are
   * deallocated.
   */
  async deallocate(resource: object) {
    if (!this.#resources.has(resource)) {
      throw new Error('You do not own this resource.');
    }

    return unmount(resource);
  }

  /** Returns an external API to the parent resource. */
  abstract exports(): Controls;
}

/** The `exports` type for a resource. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExternalControls<ArbitraryResource extends Resource<any, any>> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ArbitraryResource extends Resource<infer Controls, any> ? Controls : never;
