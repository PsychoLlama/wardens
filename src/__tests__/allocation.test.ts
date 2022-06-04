import Resource from '../resource';
import { create, destroy } from '../allocation';

describe('allocation', () => {
  describe('create', () => {
    it('allocates the resource', async () => {
      const config = { test: 'init-args' };
      const spy = jest.fn((config: { test: string }) => {
        config;
      });

      class Test extends Resource<{ test: boolean }> {
        exports = () => ({ test: true });
        create = spy;
      }

      await expect(create(Test, config)).resolves.toEqual({ test: true });
      expect(spy).toHaveBeenCalledWith(config);
    });
  });

  describe('destroy', () => {
    it('deallocates the resource', async () => {
      const spy = jest.fn<void, []>();

      class Test extends Resource<Array<string>> {
        exports = () => [];
        destroy = spy;
      }

      const test = await create(Test);

      expect(spy).not.toHaveBeenCalled();
      await expect(destroy(test)).resolves.not.toThrow();
      expect(spy).toHaveBeenCalled();
    });

    it('survives if the resource is already deallocated', async () => {
      class Test extends Resource<Array<number>> {
        exports = () => [];
      }

      const test = await create(Test);
      await destroy(test);

      await expect(destroy(test)).resolves.not.toThrow();
    });

    it('automatically unmounts all children', async () => {
      const spy = jest.fn();
      class Child extends Resource<number[]> {
        exports = () => [];
        destroy = spy;
      }

      class Parent extends Resource<string[]> {
        exports = () => [];
        async create() {
          await this.allocate(Child);
        }
      }

      const parent = await create(Parent);
      await destroy(parent);

      expect(spy).toHaveBeenCalled();
    });

    it('throws an error if any of the children fail to close', async () => {
      const error = new Error('Testing resource destruction errors');
      class Child extends Resource<number[]> {
        exports = () => [];
        async destroy() {
          throw error;
        }
      }

      class Parent extends Resource<string[]> {
        exports = () => [];
        async create() {
          await this.allocate(Child);
        }
      }

      const parent = await create(Parent);
      await expect(destroy(parent)).rejects.toThrow(error);
    });
  });
});
