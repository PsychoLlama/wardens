import type ResourceContext from './resource-context';

/**
 * Represents an arbitrary stateful resource that is asynchronously provisioned
 * and destroyed. Resources can own other resources, and destroying a parent
 * first tears down the children.
 */
export interface ResourceFactory<Controls extends object> {
  (resource: ResourceContext): Promise<Resource<Controls>>;
}

export interface ParametrizedResourceFactory<Controls extends object, Config> {
  (resource: ResourceContext, config: Config): Promise<Resource<Controls>>;
}

export interface Resource<Value extends object> {
  /** The resource value returned by `create(...)`. */
  value: Value;

  /** A hook that gets called when the resource is destroyed. */
  destroy?(): Promise<unknown> | unknown;
}

/** The exported `value` type for a resource. */
export type Controls<ArbitraryResource extends ResourceFactory<object>> =
  ArbitraryResource extends ResourceFactory<infer Controls> ? Controls : never;
