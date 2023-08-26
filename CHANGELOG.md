# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- New context API carries state down the tree without plumbing through arguments.

### Changed

- Renamed public type `ResourceContext` to `ResourceScope`.
- `destroy(...)` is no longer allowed to destroy child resources, only roots.

## [0.5.1] - 2023-08-12

### Fixed

- Added support for parametrized resources in `ResourceHandle<T>`.

## [0.5.0] - 2023-08-12

### Changed

- Wardens is now published with ESM (`type=module`). It should be backwards compatible.
- Now `destroy(...)` throws if you pass an object that wasn't constructed with `create(...)`.

### Fixed

- If a resource fails while initializing, now all intermediate child resources are destroyed as well.
- If a resource fails while being destroyed, now its child resources are destroyed as well.
- Resources can no longer provision child resources after teardown. This closes a loophole where resources could escape destruction.

### Added

- New `ResourceHandle<T>` utility type represents the value returned when creating a resource.

## [0.4.1] - 2023-01-14

### Fixed

- Newer versions of TypeScript complained about signatures in `bindContext(...)`.

## [0.4.0] - 2022-06-19

### Added

- Support for provisioning resources through async functions instead of `Resource` subclasses. This offers better type safety around null conditions.
- A new `Resource` utility type is exported. The new functional API expects you to return this interface.

### Removed

- The `Resource` abstract class was removed. Use async functions instead.
- The `Controls<...>` utility type was removed. Import the type you need from the module instead.

## [0.3.0] - 2022-06-04

### Changed

- Prevent use of `allocate(...)`/`deallocate(...)` outside a resource subclass.
- Renamed `enter()` and `leave()` to `create()` and `destroy()`.
- Renamed `mount()` and `unmount()` to `create()` and `destroy()`.

### Removed

- Second type parameter to `Resource` is gone. Arguments to `enter(...)` are now inferred.
- No more default implementations for `enter(...)`/`leave(...)` on resources.

## [0.2.0] - 2022-05-24

### Fixed

- `mount(...)` and `allocate(...)` no longer require a config argument if the resource doesn't explicitly define one.

### Added

- `enter(...)` now supports variable arguments.

### Changed

- The second generic parameter of `Resource` was a config parameter, but now it's an argument tuple.
- The `ExternalControls` utility type was renamed to `Controls`.

## [0.1.0] - 2022-05-22

### Added

- Resource class for modeling asynchronously provisioned resources
- `mount`/`unmount` hooks to provision resources
- `allocate`/`deallocate` for creating hierarchies of resources

[Unreleased]: https://github.com/PsychoLlama/wardens/compare/v0.5.1...HEAD
[0.5.1]: https://github.com/PsychoLlama/wardens/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/PsychoLlama/wardens/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/PsychoLlama/wardens/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/PsychoLlama/wardens/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/PsychoLlama/wardens/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/PsychoLlama/wardens/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/PsychoLlama/wardens/releases/tag/v0.1.0
