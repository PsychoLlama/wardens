import ResourceControls from '../resource-controls';
import { create } from '../';
import { createContext } from '../inherited-context';

describe('ResourceControls', () => {
  async function Test() {
    return { value: {} };
  }

  it('can spawn children of its own', async () => {
    const Child = async () => ({
      value: { child: true },
    });

    const Parent = async (resource: ResourceControls) => {
      return { value: await resource.create(Child) };
    };

    await expect(create(Parent)).resolves.toEqual({ child: true });
  });

  it('can deallocate child resources on demand', async () => {
    const spy = vi.fn();

    const Child = async () => ({
      value: { child: true },
      destroy: spy,
    });

    const Parent = async (resource: ResourceControls) => {
      const child = await resource.create(Child);
      await resource.destroy(child);

      return {
        value: { parent: true },
      };
    };

    await expect(create(Parent)).resolves.toEqual({ parent: true });
    expect(spy).toHaveBeenCalled();
  });

  it('fails to destroy resources owned by someone else', async () => {
    const test = await create(Test);

    const Sneaky = async (resource: ResourceControls) => {
      await resource.destroy(test);
      return { value: {} };
    };

    await expect(create(Sneaky)).rejects.toThrow(/do not own/i);
  });

  it('binds create/destroy handlers to the class instance', async () => {
    async function Allocator({ create, destroy }: ResourceControls) {
      const test = await create(Test);
      await destroy(test);

      return { value: [] };
    }

    await expect(create(Allocator)).resolves.not.toThrow();
  });

  it('indicates if a resource was already destroyed', async () => {
    async function Allocator(resource: ResourceControls) {
      const test = await resource.create(Test);
      await resource.destroy(test);
      await resource.destroy(test);

      return { value: [] };
    }

    await expect(create(Allocator)).rejects.toThrow(/already destroyed/i);
  });

  it('can set and retrieve context', async () => {
    const SharedValue = createContext(() => 'none');

    const Test = async (resource: ResourceControls) => {
      expect(resource.getContext(SharedValue)).toBe('none');

      resource.setContext(SharedValue, 'saved');
      expect(resource.getContext(SharedValue)).toBe('saved');

      resource.setContext(SharedValue, 'updated');
      expect(resource.getContext(SharedValue)).toBe('updated');

      return { value: [] };
    };

    await expect(create(Test)).resolves.toEqual([]);
  });

  it('returns the new context value', async () => {
    const SharedValue = createContext(() => 'none');

    const Test = async (resource: ResourceControls) => {
      return {
        value: { value: resource.setContext(SharedValue, 'returned') },
      };
    };

    await expect(create(Test)).resolves.toEqual({ value: 'returned' });
  });

  it('passes context to child resources', async () => {
    const SharedValue = createContext<null | string>(() => null);

    const Child = async (ctx: ResourceControls) => ({
      value: { content: ctx.getContext(SharedValue) },
    });

    const Parent = async (resource: ResourceControls) => {
      resource.setContext(SharedValue, 'inherited');
      return { value: await resource.create(Child) };
    };

    await expect(create(Parent)).resolves.toEqual({ content: 'inherited' });
  });

  it('can override context without affecting the parent', async () => {
    const Message = createContext<null | string>(() => null);
    const Child = async (resource: ResourceControls) => {
      // This should *NOT* affect the parent context.
      resource.setContext(Message, 'child context');

      return {
        value: { content: resource.getContext(Message) },
      };
    };

    const Parent = async (resource: ResourceControls) => {
      resource.setContext(Message, 'parent context');
      const child = await resource.create(Child);

      expect(resource.getContext(Message)).toBe('parent context');

      return {
        value: {
          content: resource.getContext(Message),
          child,
        },
      };
    };

    await expect(create(Parent)).resolves.toEqual({
      content: 'parent context',
      child: { content: 'child context' },
    });
  });

  it('allows two siblings to have different context values', async () => {
    const Message = createContext<null | string>(() => null);
    const Child = async (resource: ResourceControls, msg: string) => {
      resource.setContext(Message, msg);

      return {
        value: { getMessage: () => resource.getContext(Message) },
      };
    };

    const Parent = async (resource: ResourceControls) => {
      resource.setContext(Message, 'parent context');

      return {
        value: await Promise.all([
          resource.create(Child, 'child context 1'),
          resource.create(Child, 'child context 2'),
        ]),
      };
    };

    const [child1, child2] = await create(Parent);
    expect(child1.getMessage()).toBe('child context 1');
    expect(child2.getMessage()).toBe('child context 2');
  });

  it('provides a live view of the current value, not just a snapshot', async () => {
    const Message = createContext(() => 'default');
    const Child = async (resource: ResourceControls) => ({
      value: { getMessage: () => resource.getContext(Message) },
    });

    const Parent = async (resource: ResourceControls) => ({
      value: {
        setMessage: (msg: string) => resource.setContext(Message, msg),
        child: await resource.create(Child),
      },
    });

    const { setMessage, child } = await create(Parent);
    expect(child.getMessage()).toBe('default');

    setMessage('updated');
    expect(child.getMessage()).toBe('updated');
  });
});
