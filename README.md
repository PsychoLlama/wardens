<div align="center">
  <h1>Wardens</h1>
  <p>A tiny framework for managing resources.</p>
  <img alt="Build status" src="https://img.shields.io/github/workflow/status/PsychoLlama/wardens/Test/main" />
  <img alt="TypeScript" src="https://img.shields.io/npm/types/wardens" />
  <img alt="npm version" src="https://img.shields.io/npm/v/wardens" />
</div>

## Overview

This library is designed for applications that dynamically provision and deallocate hierarchical resources over time.

Here's an example: let's say you've got a thread pool, one per CPU. Each thread gets a `Resource`, a small wrapper that hooks into setup and teardown controls.

```typescript
class Worker extends Resource<Thread> {
  thread!: Thread;

  // Called when the resource is created
  async enter() {
    this.thread = await spawn()
  }

  // Called when the resource is destroyed
  async leave() {
    this.thread.close()
  }

  // The value returned after initialization completes
  exports = () => this.thread
}
```

Now define a pool that creates and manages workers:

```typescript
class WorkerPool extends Resource<Controls, Config> {
  threads!: Array<Thread> = [];

  async enter({ poolSize }: Config) {
    const promises = Array(poolSize).fill().map(() => {
      return this.allocate(Worker)
    })

    this.threads = await Promise.all(promises)
  }

  // ... External API goes here ...
  exports = (): Controls => ({
    doSomeWork() {},
    doSomethingElse() {},
  })
}
```

Finally, mount it:

```typescript
const pool = await mount(WorkerPool, {
  poolSize: cpus().length,
})

// Provisioned and ready to go!
pool.doSomeWork()
pool.doSomethingElse()
```

The magic of this framework is that resources never outlive their owners. If you tear down the pool, it will deallocate everything beneath it first:

```typescript
await unmount(pool)

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
