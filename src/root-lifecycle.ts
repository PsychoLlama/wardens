import { createWithContext, destroy } from './resource-lifecycle';
import { ParametrizedResourceFactory } from './utility-types';
import { ResourceFactory } from './utility-types';
import { resources, roots } from './global-weakrefs';

/** Provision a resource and return its external API. */
export const createRoot = async <
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
  const root = await createWithContext(rootContext, factory, ...args);
  roots.add(root);

  return root;
};

/**
 * Tear down the resource and all its children, permanently destroying the
 * reference. This cannot be used to destroy child resources, only roots.
 */
export const destroyRoot = async (resource: object): Promise<void> => {
  if (resources.has(resource) && !roots.has(resource)) {
    throw new Error(
      'Cannot destroy child resource. It is owned by another scope.',
    );
  }

  return destroy(resource);
};
