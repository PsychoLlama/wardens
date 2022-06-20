import ResourceContext from '../resource-context';
import { create } from '../allocation';
import type { Controls, Resource } from '../types';

describe('ResourceContext', () => {
  async function Test() {
    return { value: {} };
  }

  it('can spawn children of its own', async () => {
    const Child = async () => ({
      value: { child: true },
    });

    const Parent = async (
      resource: ResourceContext,
    ): Promise<Resource<Controls<typeof Child>>> => {
      return { value: await resource.create(Child, null) };
    };

    await expect(create(Parent, null)).resolves.toEqual({ child: true });
  });

  it('can deallocate child resources on demand', async () => {
    const spy = jest.fn();

    const Child = async () => ({
      value: { child: true },
      destroy: spy,
    });

    const Parent = async (resource: ResourceContext) => {
      const child = await resource.create(Child, null);
      await resource.destroy(child);

      return {
        value: { parent: true },
      };
    };

    await expect(create(Parent, null)).resolves.toEqual({ parent: true });
    expect(spy).toHaveBeenCalled();
  });

  it('fails to destroy resources owned by someone else', async () => {
    const test = await create(Test, null);

    const Sneaky = async (resource: ResourceContext) => {
      await resource.destroy(test);
      return { value: {} };
    };

    await expect(create(Sneaky, null)).rejects.toThrow(/do not own/i);
  });
});
