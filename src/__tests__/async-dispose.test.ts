import type ResourceScope from '../resource-scope';
import { create, destroy } from '../';

describe('explicit resource management', () => {
  it('exposes a Symbol.asyncDispose method on the handle', async () => {
    const Test = async () => ({ value: { hello: 'world' } });
    const test = await create(Test);

    expect(typeof test[Symbol.asyncDispose]).toBe('function');
  });

  it('destroys a root when the block exits via `await using`', async () => {
    const spy = vi.fn();
    const Test = async () => ({ value: { hello: 'world' }, destroy: spy });

    {
      await using test = await create(Test);
      expect(test.hello).toBe('world');
      expect(spy).not.toHaveBeenCalled();
    }

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('tears down children when the owner is disposed', async () => {
    const childSpy = vi.fn();
    const Child = async () => ({ value: {}, destroy: childSpy });
    const Parent = async (resource: ResourceScope) => {
      await resource.create(Child);
      return { value: {} };
    };

    {
      await using parent = await create(Parent);
      expect(parent).toBeDefined();
    }

    expect(childSpy).toHaveBeenCalledTimes(1);
  });

  it('scopes a child to the block it was created in', async () => {
    const childSpy = vi.fn();
    const Child = async () => ({ value: {}, destroy: childSpy });

    const Parent = async (resource: ResourceScope) => {
      {
        await using child = await resource.create(Child);
        expect(child).toBeDefined();
        expect(childSpy).not.toHaveBeenCalled();
      }

      // The child was disposed at the end of its block, before the parent
      // ever finishes provisioning.
      expect(childSpy).toHaveBeenCalledTimes(1);
      return { value: {} };
    };

    await create(Parent);
    expect(childSpy).toHaveBeenCalledTimes(1);
  });

  it('does not double-destroy a child already disposed by its block', async () => {
    const childSpy = vi.fn();
    const Child = async () => ({ value: {}, destroy: childSpy });

    const Parent = async (resource: ResourceScope) => {
      {
        await using child = await resource.create(Child);
        expect(child).toBeDefined();
      }

      return { value: {}, destroy() {} };
    };

    const parent = await create(Parent);
    await destroy(parent);

    // Once for the block exit, never again when the parent tears down.
    expect(childSpy).toHaveBeenCalledTimes(1);
  });

  it('propagates teardown errors out of the disposal', async () => {
    const error = new Error('Testing async disposal errors');
    const Test = async () => ({
      value: {},
      destroy() {
        throw error;
      },
    });

    await expect(
      (async () => {
        await using test = await create(Test);
        expect(test).toBeDefined();
      })(),
    ).rejects.toThrow(error);
  });
});
