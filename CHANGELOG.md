# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `mount(...)` and `allocate(...)` no longer require a config argument if the resource doesn't explicitly define one.

### Added

- `enter(...)` now supports variable arguments.

### Changed

- The second generic parameter of `Resource` was a config parameter, but now it's an argument tuple.

## [0.1.0]

### Added

- Resource class for modeling asynchronously provisioned resources
- `mount`/`unmount` hooks to provision resources
- `allocate`/`deallocate` for creating hierarchies of resources

[Unreleased]: https://github.com/PsychoLlama/wardens/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/PsychoLlama/wardens/releases/tag/v0.1.0
