import type ResourceScope from '../resource-scope';
import { create, destroy } from '../';
import bindContext from '../bind-context';

describe('roots', () => {
  describe('create', () => {
    it('allocates the resource', async () => {
      const config = { test: 'init-args' };
      const Test = vi.fn(
        async (_resource: ResourceScope, config: { test: string }) => ({
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

        const Parent = async (resource: ResourceScope) => {
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

        const Parent = async (resource: ResourceScope) => {
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
      async function Parent(resource: ResourceScope) {
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

      const Parent = async (resource: ResourceScope) => {
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

      const Parent = async (resource: ResourceScope) => {
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

      const Parent = async (resource: ResourceScope) => {
        await resource.create(Child);
        await resource.create(Child);
        return { value: [] };
      };

      const parent = await create(Parent);
      await expect(destroy(parent)).rejects.toMatchObject({
        failures: [childError, childError],
      });
    });

    it('ensures child resources outlive their consumers', async () => {
      const Child = async () => ({ value: [1] });
      const Parent = async (resource: ResourceScope) => {
        const child = await resource.create(Child);
        return {
          value: [],
          destroy() {
            // The `child` resource must still be usable here.
            expect(child).toHaveLength(1);
          },
        };
      };

      const parent = await create(Parent);
      await destroy(parent);
    });

    it('destroys child resources even if the parent fails to close', async () => {
      const spy = vi.fn();
      const Child = async () => ({ value: [], destroy: spy });
      const Parent = async (resource: ResourceScope) => {
        await resource.create(Child);
        return {
          value: [],
          destroy() {
            throw new Error('Testing parent teardown errors');
          },
        };
      };

      const parent = await create(Parent);
      await expect(destroy(parent)).rejects.toThrow();
      expect(spy).toHaveBeenCalled();
    });

    it('aggregates errors if the child resource fails to close', async () => {
      const parentError = new Error('Testing parent resource aborts');
      const childError = new Error('Testing child resource aborts');

      const Child = async () => ({
        value: [],
        destroy() {
          throw childError;
        },
      });

      const Parent = async (resource: ResourceScope) => {
        await resource.create(Child);
        return {
          value: [],
          destroy() {
            throw parentError;
          },
        };
      };

      const parent = await create(Parent);
      await expect(destroy(parent)).rejects.toMatchObject({
        failures: [parentError, childError],
      });
    });

    it('guards against creating new resources after teardown', async () => {
      const Child = async () => ({ value: [] });
      const Parent = async (resource: ResourceScope) => ({
        value: bindContext(resource),
      });

      const parent = await create(Parent);
      const { create: resourceCreate } = parent;
      await destroy(parent);

      await expect(resourceCreate(Child)).rejects.toThrow(
        /cannot create.*after teardown/i,
      );
    });

    it('refuses to destroy non-root resources', async () => {
      const Child = async () => ({ value: [] });
      const Parent = async ({ create }: ResourceScope) => ({
        value: { child: await create(Child) },
      });

      const { child } = await create(Parent);

      await expect(destroy(child)).rejects.toThrow(
        /cannot destroy child resource/i,
      );
    });
  });
});
