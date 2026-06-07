# Wardens

A tiny framework for managing resources.

## Purpose

I built this while working with [mediasoup](https://mediasoup.org/), a library for creating video conferencing apps. It uses a lot of **very** nested resource handles, and if you forget to release one of them, it'll eventually crash your server and kill active calls.

This library manages resource hierarchies in a [RAII](https://en.wikipedia.org/wiki/Resource_acquisition_is_initialization)-inspired harness. Prune one branch and everything it allocated is released in the correct order. No resource leaks, no crashed servers, no unhappy callers.

## Caveats

It works by wrapping objects in [Proxy.revocable(...)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/revocable) with destructor hooks. While great for guaranteeing resources are deconstructed and garbage collected, you might get opaque use-after-free errors. Basically: null pointer exceptions.

Easier to handle than resource exhaustion, but the abstraction isn't free.

## Overview

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
  { create }: ResourceScope,
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
