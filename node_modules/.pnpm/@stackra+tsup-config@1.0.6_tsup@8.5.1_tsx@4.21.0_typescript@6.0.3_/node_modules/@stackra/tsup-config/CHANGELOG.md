# Changelog

All notable changes to `@stackra/tsup-config` will be documented in this file.

The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2025-07-14

### Changed

- Migrated npm scope from `@nesvel/tsup-config` to `@stackra/tsup-config`
- Updated repository to `stackra-inc/tsup-config` on GitHub
- Updated author to Stackra L.L.C
- Updated CI/CD workflows for the new scope and repository
- Updated `packageManager` to `pnpm@10.33.2`
- Updated `engines` to require `pnpm >= 9.0.0`
- Added `publishConfig` for public npm access
- Added `sideEffects: false`

## [1.0.3] - 2025-06-01

### Changed

- Dependency updates

## [1.0.0] - 2025-11-09

### Added

- Initial package setup
- Base, NestJS lib, NestJS app, CLI lib, and React lib presets
- Utility functions (loadPackageJson, computeExternals, buildBanner)
- Vite adapter
- Full TypeScript support
- ESM + CJS dual output
