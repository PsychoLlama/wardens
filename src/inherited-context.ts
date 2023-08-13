/**
 * A prototype chain that matches the resource hierarchy. This is used to
 * pass state down the tree without plumbing through every function.
 */
export type InheritedContext = Record<symbol, unknown>;

/** An opaque handle used to get/set values in a prototype chain. */
export class ContextHandle<Value> {
  static getId(handle: ContextHandle<unknown>): symbol {
    return handle.#id;
  }

  static getDefaultValue<Value>(handle: ContextHandle<Value>): Value {
    return handle.#getDefaultContext();
  }

  #id = Symbol('Context ID');
  #getDefaultContext: () => Value;

  constructor(getDefaultContext: () => Value) {
    this.#getDefaultContext = getDefaultContext;
  }
}

/**
 * Create a context object that is used to get and set context values in the
 * resource hierarchy.
 */
export const createContext = <Value>(
  /** Returns a default value if the context could not be found. */
  getDefaultContext: () => Value,
): ContextHandle<Value> => new ContextHandle(getDefaultContext);
