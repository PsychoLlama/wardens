import { create, ResourceControls, ResourceHandle } from '../';

describe('Utility types', () => {
  describe('ResourceHandle', () => {
    it('infers the correct type', async () => {
      async function Test() {
        return {
          value: { hello: 'world' },
        };
      }

      const test = await create(Test);

      expectTypeOf(test).toEqualTypeOf<ResourceHandle<typeof Test>>({
        hello: 'world',
      });
    });

    it('infers the type when the value comes from a parameter', async () => {
      async function Test(_ctx: ResourceControls, value: { count: number }) {
        return {
          value,
        };
      }

      const test = await create(Test, { count: 2 });
      expectTypeOf(test).toEqualTypeOf<ResourceHandle<typeof Test>>({
        count: 2,
      });
    });
  });
});
