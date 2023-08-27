import {
  create,
  ResourceScope,
  ResourceHandle,
  createContext,
  ContextType,
} from '../';

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
      async function Test(_ctx: ResourceScope, value: { count: number }) {
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

  describe('ContextType', () => {
    it('returns the type contained in context', async () => {
      const Context = createContext(() => ({
        hello: 'world',
      }));

      async function Test({ getContext }: ResourceScope) {
        return { value: getContext(Context) };
      }

      const value = await create(Test);

      expectTypeOf(value).toEqualTypeOf<ContextType<typeof Context>>({
        hello: 'any string, really',
      });
    });
  });
});
