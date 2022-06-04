import Resource from '../resource';
import { mount, unmount } from '../allocation';

describe('allocation', () => {
  describe('mount', () => {
    it('allocates the resource', async () => {
      const config = { test: 'init-args' };
      const create = jest.fn((config: { test: string }) => {
        config;
      });

      class Test extends Resource<{ test: boolean }> {
        exports = () => ({ test: true });
        create = create;
      }

      await expect(mount(Test, config)).resolves.toEqual({ test: true });
      expect(create).toHaveBeenCalledWith(config);
    });
  });

  describe('unmount', () => {
    it('deallocates the resource', async () => {
      const destroy = jest.fn<void, []>();

      class Test extends Resource<Array<string>> {
        exports = () => [];
        destroy = destroy;
      }

      const test = await mount(Test);

      expect(destroy).not.toHaveBeenCalled();
      await expect(unmount(test)).resolves.not.toThrow();
      expect(destroy).toHaveBeenCalled();
    });

    it('survives if the resource is already deallocated', async () => {
      class Test extends Resource<Array<number>> {
        exports = () => [];
      }

      const test = await mount(Test);
      await unmount(test);

      await expect(unmount(test)).resolves.not.toThrow();
    });

    it('automatically unmounts all children', async () => {
      const destroy = jest.fn();
      class Child extends Resource<number[]> {
        exports = () => [];
        destroy = destroy;
      }

      class Parent extends Resource<string[]> {
        exports = () => [];
        async create() {
          await this.allocate(Child);
        }
      }

      const parent = await mount(Parent);
      await unmount(parent);

      expect(destroy).toHaveBeenCalled();
    });

    it('throws an error if any of the children fail to unmount', async () => {
      const error = new Error('Testing unmount errors');
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

      const parent = await mount(Parent);
      await expect(unmount(parent)).rejects.toThrow(error);
    });
  });
});
