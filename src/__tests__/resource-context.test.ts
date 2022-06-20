import ResourceContext from '../resource-context';
import { create } from '../allocation';

describe('ResourceContext', () => {
  async function Test() {
    return { value: {} };
  }

  it('can spawn children of its own', async () => {
    const Child = async () => ({
      value: { child: true },
    });

    const Parent = async (resource: ResourceContext) => {
      return { value: await resource.create(Child) };
    };

    await expect(create(Parent)).resolves.toEqual({ child: true });
  });

  it('can deallocate child resources on demand', async () => {
    const spy = jest.fn();

    const Child = async () => ({
      value: { child: true },
      destroy: spy,
    });

    const Parent = async (resource: ResourceContext) => {
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

    const Sneaky = async (resource: ResourceContext) => {
      await resource.destroy(test);
      return { value: {} };
    };

    await expect(create(Sneaky)).rejects.toThrow(/do not own/i);
  });
});
