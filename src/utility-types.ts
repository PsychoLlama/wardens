/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ContextHandle } from './inherited-context';
import type ResourceScope from './resource-scope';

/**
 * Represents an arbitrary stateful resource that is asynchronously provisioned
 * and destroyed. Resources can own other resources, and destroying a parent
 * first tears down the children.
 */
export interface ResourceFactory<Value extends object> {
  (resource: ResourceScope): Promise<Resource<Value>>;
}

export interface ParametrizedResourceFactory<
  Value extends object,
  Args extends Array<unknown>,
> {
  (resource: ResourceScope, ...args: Args): Promise<Resource<Value>>;
}

export interface Resource<Value extends object> {
  /** The resource value returned by `create(...)`. */
  value: Value;

  /** A hook that gets called when the resource is destroyed. */
  destroy?(): Promise<unknown> | unknown;
}

/** The `value` type returned when creating a resource. */
export type ResourceHandle<
  Factory extends ParametrizedResourceFactory<object, Array<any>>,
> = Awaited<ReturnType<Factory>>['value'];

/** The type returned when you call `getContext`. */
export type ContextType<Handle extends ContextHandle<unknown>> =
  Handle extends ContextHandle<infer Value> ? Value : never;
