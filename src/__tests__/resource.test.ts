import Resource, { type ExternalControls } from '../resource';
import { mount } from '../roots';

describe('Resource', () => {
  class Test extends Resource<Record<string, never>> {
    exports = () => ({});
  }

  it('implements default enter/leave methods', async () => {
    const test = new Test();

    await expect(test.enter()).resolves.not.toThrow();
    await expect(test.leave()).resolves.not.toThrow();
  });

  it('can spawn children of its own', async () => {
    class Child extends Resource<{ child: boolean }> {
      exports = () => ({ child: true });
    }

    class Parent extends Resource<ExternalControls<Child>> {
      exports = () => this.child;
      child!: ExternalControls<Child>;

      async enter() {
        this.child = await this.allocate(Child, null);
      }
    }

    await expect(mount(Parent, null)).resolves.toEqual({ child: true });
  });

  it('can deallocate child resources on demand', async () => {
    const leave = jest.fn();

    class Child extends Resource<{ child: boolean }> {
      exports = () => ({ child: true });
      leave = leave;
    }

    class Parent extends Resource<{ parent: boolean }> {
      exports = () => ({ parent: true });
      child!: ExternalControls<Child>;

      async enter() {
        const child = await this.allocate(Child, null);
        await this.deallocate(child);
      }
    }

    await expect(mount(Parent, null)).resolves.toEqual({ parent: true });
    expect(leave).toHaveBeenCalled();
  });

  it('fails to destroy resources owned by someone else', async () => {
    const test = await mount(Test, null);

    class Sneaky extends Resource<string[]> {
      exports = () => [];
      async enter() {
        await this.deallocate(test);
      }
    }

    await expect(mount(Sneaky, null)).rejects.toThrow(/do not own/i);
  });
});
