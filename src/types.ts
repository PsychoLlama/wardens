import type Resource from './resource';

/** The `exports` type for a resource. */
export type Controls<
  ArbitraryResource extends Resource<object, Array<unknown>>,
> = ArbitraryResource extends Resource<infer Controls, Array<unknown>>
  ? Controls
  : never;

export interface MountableResource<
  Controls extends object,
  InitArgs extends Array<unknown>,
> extends Resource<Controls> {
  /** A hook that gets called when the resource is created. */
  enter(...args: InitArgs): Promise<void>;
}

export interface UnmountableResource<Controls extends object>
  extends Resource<Controls> {
  /** A hook that gets called when the resource is destroyed. */
  leave(): Promise<void>;
}
