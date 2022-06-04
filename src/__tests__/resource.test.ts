import Resource from '../resource';
import { mount } from '../allocation';
import { type Controls } from '../types';

describe('Resource', () => {
  class Test extends Resource<Record<string, never>> {
    exports = () => ({});
  }

  it('can spawn children of its own', async () => {
    class Child extends Resource<{ child: boolean }> {
      exports = () => ({ child: true });
    }

    class Parent extends Resource<Controls<Child>> {
      exports = () => this.child;
      child!: Controls<Child>;

      async create() {
        this.child = await this.allocate(Child);
      }
    }

    await expect(mount(Parent)).resolves.toEqual({ child: true });
  });

  it('can deallocate child resources on demand', async () => {
    const destroy = jest.fn();

    class Child extends Resource<{ child: boolean }> {
      exports = () => ({ child: true });
      destroy = destroy;
    }

    class Parent extends Resource<{ parent: boolean }> {
      exports = () => ({ parent: true });
      child!: Controls<Child>;

      async create() {
        const child = await this.allocate(Child);
        await this.deallocate(child);
      }
    }

    await expect(mount(Parent)).resolves.toEqual({ parent: true });
    expect(destroy).toHaveBeenCalled();
  });

  it('fails to destroy resources owned by someone else', async () => {
    const test = await mount(Test);

    class Sneaky extends Resource<string[]> {
      exports = () => [];
      async create() {
        await this.deallocate(test);
      }
    }

    await expect(mount(Sneaky)).rejects.toThrow(/do not own/i);
  });
});
