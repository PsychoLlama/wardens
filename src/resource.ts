import { mount, unmount } from './allocation';
import { ownership } from './state';

/**
 * Represents an arbitrary stateful resource that is asynchronously provisioned
 * and destroyed. Resources can own other resources, and destroying a parent
 * first tears down the children.
 */
export default abstract class Resource<
  Controls extends object,
  Args extends Array<unknown> = [],
> {
  #resources = new WeakSet<object>();
  #children: Array<object> = [];

  constructor() {
    ownership.set(this, this.#children);
  }

  /** A hook that gets called when the resource is created. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async enter(..._args: Args) {
    return;
  }

  /** A hook that gets called when the resource is destroyed. */
  async leave() {
    return;
  }

  /** Provision an owned resource and make sure it doesn't outlive us. */
  async allocate<
    ChildControls extends object,
    ChildArgs extends Array<unknown> = [],
  >(
    Child: new () => Resource<ChildControls, ChildArgs>,
    ...args: ChildArgs
  ): Promise<ChildControls> {
    const controls = await mount(Child, ...args);
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
