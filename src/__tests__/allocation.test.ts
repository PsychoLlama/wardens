import type ResourceContext from '../resource-context';
import { create, destroy } from '../allocation';

describe('allocation', () => {
  describe('create', () => {
    it('allocates the resource', async () => {
      const config = { test: 'init-args' };
      const Test = vi.fn(
        async (_resource: ResourceContext, config: { test: string }) => ({
          value: config,
        }),
      );

      await expect(create(Test, config)).resolves.toEqual(config);
      expect(Test).toHaveBeenCalledWith(expect.anything(), config);
    });

    describe('after initialization failure', () => {
      it('destroys child resources in reverse order', async () => {
        const spy = vi.fn();
        const First = async () => ({ value: [], destroy: () => spy('1st') });
        const Second = async () => ({ value: [], destroy: () => spy('2nd') });

        const Parent = async (resource: ResourceContext) => {
          await resource.create(First);
          await resource.create(Second);
          throw new Error('Testing resource initialization errors');
        };

        await expect(create(Parent)).rejects.toThrow();
        expect(spy.mock.calls).toEqual([['2nd'], ['1st']]);
      });

      it('continues even if the children cannot be destroyed', async () => {
        const parentError = new Error('Testing parent resource aborts');
        const childError = new Error('Testing child resource aborts');
        const Child = async () => ({
          value: [],
          destroy() {
            throw childError;
          },
        });

        const Parent = async (resource: ResourceContext) => {
          await resource.create(Child);
          await resource.create(Child);
          throw parentError;
        };

        await expect(create(Parent)).rejects.toMatchObject({
          cause: parentError,
          failures: [childError, childError],
        });
      });
    });
  });

  describe('destroy', () => {
    it('deallocates the resource', async () => {
      const spy = vi.fn<[], void>();
      const Test = async () => ({
        value: {},
        destroy: spy,
      });

      const test = await create(Test);

      expect(spy).not.toHaveBeenCalled();
      await expect(destroy(test)).resolves.not.toThrow();
      expect(spy).toHaveBeenCalled();
    });

    it('throws an error if the object is not a resource', async () => {
      await expect(destroy({})).rejects.toThrow(
        'Cannot destroy object. It is not a resource.',
      );
    });

    it('survives if the resource is already deallocated', async () => {
      const Test = async () => ({ value: [] });

      const test = await create(Test);
      await destroy(test);

      await expect(destroy(test)).resolves.not.toThrow();
    });

    it('automatically unmounts all children', async () => {
      const spy = vi.fn();
      const Child = async () => ({ value: [], destroy: spy });
      async function Parent(resource: ResourceContext) {
        await resource.create(Child);
        return { value: [] };
      }

      const parent = await create(Parent);
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
        await resource.create(Child);
        return { value: [] };
      };

      const parent = await create(Parent);
      await expect(destroy(parent)).rejects.toThrow(error);
    });

    it('destroys child resources in reverse order', async () => {
      const spy = vi.fn();
      const First = async () => ({ value: [], destroy: () => spy('1st') });
      const Second = async () => ({ value: [], destroy: () => spy('2nd') });

      const Parent = async (resource: ResourceContext) => {
        await resource.create(First);
        await resource.create(Second);
        return { value: [] };
      };

      const parent = await create(Parent);
      await destroy(parent);

      expect(spy.mock.calls).toEqual([['2nd'], ['1st']]);
    });

    it('reports if multiple resources could not be destroyed', async () => {
      const childError = new Error('Testing child resource aborts');
      const Child = async () => ({
        value: [],
        destroy() {
          throw childError;
        },
      });

      const Parent = async (resource: ResourceContext) => {
        await resource.create(Child);
        await resource.create(Child);
        return { value: [] };
      };

      const parent = await create(Parent);
      await expect(destroy(parent)).rejects.toMatchObject({
        failures: [childError, childError],
      });
    });
  });
});
