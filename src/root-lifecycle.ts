import { createWithContext } from './resource-lifecycle';
import { ParametrizedResourceFactory } from './utility-types';
import { ResourceFactory } from './utility-types';

/** Provision a resource and return its external API. */
export const create = async <
  Controls extends object,
  Args extends Array<unknown>,
>(
  /** An async function that resolves to a resource. */
  factory:
    | ParametrizedResourceFactory<Controls, Args>
    | ResourceFactory<Controls>,
  ...args: Args
): Promise<Controls> => {
  const rootContext = Object.create(null);
  return createWithContext(rootContext, factory, ...args);
};

// Destroying a root resource is the same process as destroying a child
// resource. No need to change the implementation.
export { destroy } from './resource-lifecycle';
