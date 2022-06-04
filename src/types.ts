import type Resource from './resource';

/** The `exports` type for a resource. */
export type Controls<ArbitraryResource extends Resource<object>> =
  ArbitraryResource extends Resource<infer Controls> ? Controls : never;

export interface MountableResource<
  Controls extends object,
  InitArgs extends Array<unknown>,
> extends Resource<Controls> {
  /** A hook that gets called when the resource is created. */
  create(...args: InitArgs): Promise<void>;
}

export interface UnmountableResource<Controls extends object>
  extends Resource<Controls> {
  /** A hook that gets called when the resource is destroyed. */
  destroy(): Promise<void>;
}
