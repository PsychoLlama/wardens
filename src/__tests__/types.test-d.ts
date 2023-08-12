import { create, ResourceHandle } from '../';

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
  });
});
