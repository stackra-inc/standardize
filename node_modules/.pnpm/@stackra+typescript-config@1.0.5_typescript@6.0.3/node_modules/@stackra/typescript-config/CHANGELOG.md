# Changelog

All notable changes to `@stackra/typescript-config` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.5

### Added

- `react-native-app` preset — extends `expo/tsconfig.base` with strict checks for Expo apps
- `react-native-lib` preset — bundler-compatible config for publishable React Native libraries

## 1.0.4

### Changed

- Migrated from `@nesvel` to `@stackra` scope
- Updated repository URLs to GitHub (stackra-inc)

## 0.1.0

### Added

- Initial release
- `base` preset — strict TypeScript with NodeNext module resolution
- `bundler` preset — ESNext modules with bundler resolution
- `next` preset — Next.js optimized config
- `react-lib` preset — React library with JSX support
- `nest-lib` preset — NestJS library with decorators
- `nest-app` preset — NestJS application config
