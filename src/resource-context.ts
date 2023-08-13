import { createWithContext, destroy } from './allocation';
import { ContextHandle, InheritedContext } from './inherited-context';
import { RevokableResource } from './state';
import { ResourceFactory, ParametrizedResourceFactory } from './types';

/**
 * An instance of this class is passed to resources as they're being
 * provisioned. It allows them to provision other resources while keeping
 * track of ownership and lifetimes.
 */
export default class ResourceContext {
  #destroyed = new WeakSet<object>();
  #resources: Set<object>;
  #curfew: RevokableResource['curfew'];
  #state: InheritedContext;

  constructor(
    state: InheritedContext,
    ownedResources: Set<object>,
    freeze: RevokableResource['curfew'],
  ) {
    this.#state = state;
    this.#resources = ownedResources;
    this.#curfew = freeze;
  }

  /** Provision an owned resource and make sure it doesn't outlive us. */
  public create = async <Controls extends object, Args extends Array<unknown>>(
    factory:
      | ParametrizedResourceFactory<Controls, Args>
      | ResourceFactory<Controls>,
    ...args: Args
  ): Promise<Controls> => {
    if (this.#curfew.enforced) {
      throw new Error('Cannot create new resources after teardown.');
    }

    const context = Object.create(this.#state);
    const controls = await createWithContext(context, factory, ...args);
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

  /** Store a value in context. Anything down the chain can read it. */
  public setContext = <Value>(
    context: ContextHandle<Value>,
    value: Value,
  ): void => {
    this.#state[ContextHandle.getId(context)] = value;
  };

  /** Retrieve a value from context, or a default if it is unset. */
  public getContext = <Value>(context: ContextHandle<Value>): Value => {
    const id = ContextHandle.getId(context);

    if (id in this.#state) {
      return this.#state[id] as Value;
    }

    return ContextHandle.getDefaultValue(context);
  };
}
