import Resource from '../resource';
import { mount, unmount } from '../roots';

describe('roots', () => {
  describe('mount', () => {
    it('allocates the resource', async () => {
      const params = { test: 'init-args' };
      const enter = jest.fn();

      class Test extends Resource<{ test: boolean }, { test: string }> {
        exports = () => ({ test: true });
        enter = enter;
      }

      await expect(mount(Test, params)).resolves.toEqual({ test: true });
      expect(enter).toHaveBeenCalledWith(params);
    });
  });

  describe('unmount', () => {
    it('deallocates the resource', async () => {
      const leave = jest.fn();

      class Test extends Resource<Array<string>> {
        exports = () => [];
        leave = leave;
      }

      const api = await mount(Test, null);

      expect(leave).not.toHaveBeenCalled();
      await expect(unmount(api)).resolves.not.toThrow();
      expect(leave).toHaveBeenCalled();
    });

    it('survives if the resource is already deallocated', async () => {
      class Test extends Resource<Array<number>> {
        exports = () => [];
      }

      const api = await mount(Test, null);
      await unmount(api);

      await expect(unmount(api)).resolves.not.toThrow();
    });
  });
});
