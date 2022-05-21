import { mount, unmount } from './allocation';
import { ownership } from './state';

/**
 * Represents an arbitrary stateful resource that is asynchronously provisioned
 * and destroyed. Resources can own other resources, and destroying a parent
 * first tears down the children.
 */
export default abstract class Resource<
  ExternalApi extends object,
  InitArgs = void,
> {
  #resources = new WeakSet<object>();
  #children: Array<object> = [];

  constructor() {
    ownership.set(this, this.#children);
  }

  /** A hook that gets called when the resource is created. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async enter(_params: InitArgs) {
    return;
  }

  /** A hook that gets called when the resource is destroyed. */
  async leave() {
    return;
  }

  /** Provision an owned resource and make sure it doesn't outlive us. */
  async allocate<Api extends object, Params>(
    Child: new () => Resource<Api, Params>,
    params: Params,
  ): Promise<Api> {
    const api = await mount(Child, params);
    this.#resources.add(api);
    this.#children.push(api);

    return api;
  }

  /**
   * Tear down a resource. Happens automatically when resource owners are
   * deallocated.
   */
  async deallocate(api: object) {
    if (!this.#resources.has(api)) {
      throw new Error('You do not own this resource.');
    }

    return unmount(api);
  }

  /** Returns an external API to the parent resource. */
  abstract exports(): ExternalApi;
}

/** The `exports` type for a resource. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExternalControls<ArbitraryResource extends Resource<any, any>> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ArbitraryResource extends Resource<infer Api, any> ? Api : never;
