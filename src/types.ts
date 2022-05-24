import type Resource from './resource';

/** The `exports` type for a resource. */
export type Controls<
  ArbitraryResource extends Resource<object, Array<unknown>>,
> = ArbitraryResource extends Resource<infer Controls, Array<unknown>>
  ? Controls
  : never;
