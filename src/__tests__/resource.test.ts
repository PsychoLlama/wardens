import Resource from '../resource';
import { create } from '../allocation';
import { Controls } from '../types';

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

    await expect(create(Parent)).resolves.toEqual({ child: true });
  });

  it('can deallocate child resources on demand', async () => {
    const spy = jest.fn();

    class Child extends Resource<{ child: boolean }> {
      exports = () => ({ child: true });
      destroy = spy;
    }

    class Parent extends Resource<{ parent: boolean }> {
      exports = () => ({ parent: true });
      child!: Controls<Child>;

      async create() {
        const child = await this.allocate(Child);
        await this.deallocate(child);
      }
    }

    await expect(create(Parent)).resolves.toEqual({ parent: true });
    expect(spy).toHaveBeenCalled();
  });

  it('fails to destroy resources owned by someone else', async () => {
    const test = await create(Test);

    class Sneaky extends Resource<string[]> {
      exports = () => [];
      async create() {
        await this.deallocate(test);
      }
    }

    await expect(create(Sneaky)).rejects.toThrow(/do not own/i);
  });
});
