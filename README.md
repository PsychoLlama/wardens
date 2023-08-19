<div align="center">
  <h1>Wardens</h1>
  <p>A tiny framework for managing resources.</p>
  <img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/PsychoLlama/wardens/test.yml?branch=main" />
  <img alt="TypeScript" src="https://img.shields.io/npm/types/wardens" />
  <img alt="npm version" src="https://img.shields.io/npm/v/wardens" />
</div>

## Overview

This library is designed for applications that dynamically provision and deallocate hierarchical resources over time.

Here's an example: let's say you've got a thread pool, one per CPU. Each thread gets a `Resource`, a small wrapper that hooks into setup and teardown controls.

```typescript
async function Worker() {
  const thread = await spawn();

  return {
    // The value returned after initialization completes
    value: thread,

    // Called when the resource is destroyed
    destroy: () => thread.close(),
  };
}
```

Now define a pool that creates and manages workers:

```typescript
async function WorkerPool(
  { create }: ResourceControls,
  config: { poolSize: number },
) {
  const promises = Array(config.poolSize).fill(Worker).map(create);
  const threads = await Promise.all(promises);

  return {
    // ... External API goes here ...
    value: {
      doSomeWork() {},
      doSomethingElse() {},
    },
  };
}
```

Finally, create the pool:

```typescript
const pool = await create(WorkerPool, {
  poolSize: cpus().length,
});

// Provisioned and ready to go!
pool.doSomeWork();
pool.doSomethingElse();
```

The magic of this framework is that resources never outlive their owners. If you tear down the pool, it will deallocate everything beneath it first:

```typescript
await destroy(pool);

// [info] closing worker
// [info] closing worker
// [info] closing worker
// [info] closing worker
// [info] closing pool
```

No more forgotten resources.

## Summary

The framework can be used to manage small pieces of stateful logic in your application, or it can scale to manage your entire server. Use the paradigm as much or as little as you like.

I built this for my own projects. Documentation is a bit sparse, but enough GitHub stars could change that. This is a bribe.
