import bind from '../bind-context';

describe('Method rebinding', () => {
  it('redirects getters to the correct `this` value', () => {
    class PrivateStore {
      #hidden = 'hidden';

      get value() {
        return this.#hidden;
      }

      set value(value: string) {
        this.#hidden = value;
      }
    }

    const store = bind(new PrivateStore());
    expect(store.value).toBe('hidden');
    store.value = 'new value';
    expect(store.value).toBe('new value');

    const set = bind(new Set());
    expect(set.size).toBe(0);
  });

  it('rebinds methods to provide correct context', () => {
    const proxy = bind(new Set<number>());
    expect(() => proxy.add(5)).not.toThrow();
    expect(proxy.has(5)).toBe(true);
  });

  it('maintains function identity for bound methods', () => {
    const proxy = bind(new Set());

    expect(proxy.add).toBe(proxy.add);
  });

  it('copies extended function properties', () => {
    const proxy = bind({ mock: vi.fn() });

    // Mocks use state held on the function itself. This must be added to the
    // bound functions as well.
    expect(proxy.mock).not.toHaveBeenCalled();
    proxy.mock();
    expect(proxy.mock).toHaveBeenCalledTimes(1);
  });
});
