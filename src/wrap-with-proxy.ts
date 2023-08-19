/**
 * Wrap objects in a revocable proxy. Revocation offers guarantees about
 * use-after-free and avoids memory leaks. Perhaps more importantly, it
 * provides a unique identity for each API exposed by a resource, which allows
 * us to map an API back to the resource that created it. The consequence of
 * object identity is important.
 *
 * Consider: If a resource provisions and re-exports another resource, when
 * you go to deallocate the parent, the API maps back to the child and
 * completely misses the parent.
 *
 * We magically skirt that issue by wrapping everything in a proxy and thus
 * assigning a new identity every time. Of course, all magic comes at a price.
 * The penalty here is `this` binding. Private fields and exotic objects
 * (`Map`, `Set`, some Node tools) strictly depend on the `this` context being
 * itself, not a proxy. Methods can throw very confusing errors because they
 * can't get at private state.
 *
 * The bind-context utility is exposed as a workaround. Alternatively, you can
 * export a wrapping object instead: `{ value: T }`.
 */
export default function wrapWithProxy<T extends object>(value: T) {
  return Proxy.revocable(value, {});
}
