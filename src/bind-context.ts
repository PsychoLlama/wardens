/**
 * The framework's usage of proxies can cause havoc on classes that depend on
 * true private fields, such as Map, Set, and some networking classes in Node's
 * core library, among others. If you run into those challenges, `bindContext`
 * can dynamically correct the errors by retargeting the `this` context to the
 * original value.
 *
 * Contexts aren't rebound by default because it has a noticeable side-effect:
 * method identity is no longer the same. This can be very irritating in unit
 * tests that assert a stable function identity.
 *
 * Example:
 *
 *   exports = () => bindContext(new Set())
 *
 */
export default function bindContext<T extends object>(value: T) {
  const methodBindings = new WeakMap<Fn, Fn>();

  return new Proxy(value, {
    get(target, property) {
      const value = Reflect.get(target, property, target);

      // Bind methods to the real `this` context while maintaining
      // a consistent function identity.
      if (typeof value === 'function') {
        if (methodBindings.has(value) === false) {
          const methodBinding = value.bind(target);

          // Copy static function properties.
          Object.defineProperties(
            methodBinding,
            Object.getOwnPropertyDescriptors(value),
          );

          methodBindings.set(value, methodBinding);
        }

        return methodBindings.get(value);
      }

      return value;
    },

    set(target, property, newValue) {
      return Reflect.set(target, property, newValue, target);
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Fn = (...args: any) => any;
