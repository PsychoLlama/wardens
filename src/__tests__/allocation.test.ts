import Resource from '../resource';
import { mount, unmount } from '../allocation';

describe('allocation', () => {
  describe('mount', () => {
    it('allocates the resource', async () => {
      const config = { test: 'init-args' };
      const enter = jest.fn();

      class Test extends Resource<{ test: boolean }, [{ test: string }]> {
        exports = () => ({ test: true });
        enter = enter;
      }

      await expect(mount(Test, config)).resolves.toEqual({ test: true });
      expect(enter).toHaveBeenCalledWith(config);
    });
  });

  describe('unmount', () => {
    it('deallocates the resource', async () => {
      const leave = jest.fn();

      class Test extends Resource<Array<string>> {
        exports = () => [];
        leave = leave;
      }

      const test = await mount(Test);

      expect(leave).not.toHaveBeenCalled();
      await expect(unmount(test)).resolves.not.toThrow();
      expect(leave).toHaveBeenCalled();
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
      const leave = jest.fn();
      class Child extends Resource<number[]> {
        exports = () => [];
        leave = leave;
      }

      class Parent extends Resource<string[]> {
        exports = () => [];
        async enter() {
          await this.allocate(Child);
        }
      }

      const parent = await mount(Parent);
      await unmount(parent);

      expect(leave).toHaveBeenCalled();
    });

    it('throws an error if any of the children fail to unmount', async () => {
      const error = new Error('Testing unmount errors');
      class Child extends Resource<number[]> {
        exports = () => [];
        async leave() {
          throw error;
        }
      }

      class Parent extends Resource<string[]> {
        exports = () => [];
        async enter() {
          await this.allocate(Child);
        }
      }

      const parent = await mount(Parent);
      await expect(unmount(parent)).rejects.toThrow(error);
    });
  });
});
