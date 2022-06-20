import type ResourceContext from '../resource-context';
import { create, destroy } from '../allocation';

describe('allocation', () => {
  describe('create', () => {
    it('allocates the resource', async () => {
      const config = { test: 'init-args' };
      const Test = jest.fn(
        async (_resource: ResourceContext, config: { test: string }) => ({
          value: config,
        }),
      );

      await expect(create(Test, config)).resolves.toEqual(config);
      expect(Test).toHaveBeenCalledWith(expect.anything(), config);
    });
  });

  describe('destroy', () => {
    it('deallocates the resource', async () => {
      const spy = jest.fn<void, []>();
      const Test = async () => ({
        value: {},
        destroy: spy,
      });

      const test = await create(Test, null);

      expect(spy).not.toHaveBeenCalled();
      await expect(destroy(test)).resolves.not.toThrow();
      expect(spy).toHaveBeenCalled();
    });

    it('survives if the resource is already deallocated', async () => {
      const Test = async () => ({ value: [] });

      const test = await create(Test, null);
      await destroy(test);

      await expect(destroy(test)).resolves.not.toThrow();
    });

    it('automatically unmounts all children', async () => {
      const spy = jest.fn();
      const Child = async () => ({ value: [], destroy: spy });
      async function Parent(resource: ResourceContext) {
        await resource.create(Child, null);
        return { value: [] };
      }

      const parent = await create(Parent, null);
      await destroy(parent);

      expect(spy).toHaveBeenCalled();
    });

    it('throws an error if any of the children fail to close', async () => {
      const error = new Error('Testing resource destruction errors');
      const Child = async () => ({
        value: [],
        destroy() {
          throw error;
        },
      });

      const Parent = async (resource: ResourceContext) => {
        await resource.create(Child, null);
        return { value: [] };
      };

      const parent = await create(Parent, null);
      await expect(destroy(parent)).rejects.toThrow(error);
    });
  });
});
