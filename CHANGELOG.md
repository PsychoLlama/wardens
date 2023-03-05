# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Wardens is now published with ESM (`type=module`). It should be backwards compatible.

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

[Unreleased]: https://github.com/PsychoLlama/wardens/compare/v0.4.1...HEAD
[0.4.1]: https://github.com/PsychoLlama/wardens/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/PsychoLlama/wardens/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/PsychoLlama/wardens/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/PsychoLlama/wardens/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/PsychoLlama/wardens/releases/tag/v0.1.0
