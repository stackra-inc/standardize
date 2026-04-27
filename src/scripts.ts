/**
 * @fileoverview Standard scripts per package type.
 * @module @stackra/standardize
 */

/** Full toolchain scripts for library packages. */
export const SCRIPTS_LIBRARY: Record<string, string> = {
  build: "tsup",
  dev: "tsup --watch",
  clean: "rm -rf dist node_modules/.cache",
  typecheck: "tsc --noEmit",
  lint: "eslint . --max-warnings 0",
  "lint:fix": "eslint . --fix",
  format: "prettier --write .",
  "format:check": "prettier --check .",
  test: "vitest run --passWithNoTests",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  prepare: "husky",
  prepublishOnly: "pnpm run build",
  release: "pnpm publish --access public --no-git-checks",
};

/** Config package scripts — no eslint (they ARE the config). */
export const SCRIPTS_CONFIG: Record<string, string> = {
  build: "tsup",
  dev: "tsup --watch",
  clean: "rm -rf dist node_modules/.cache",
  typecheck: "tsc --noEmit",
  format: "prettier --write .",
  "format:check": "prettier --check .",
  test: "vitest run --passWithNoTests",
  prepare: "husky",
  prepublishOnly: "pnpm run build",
  release: "pnpm publish --access public --no-git-checks",
};

/** JSON-config scripts — no build tooling. */
export const SCRIPTS_JSON_CONFIG: Record<string, string> = {
  format: "prettier --write .",
  "format:check": "prettier --check .",
  prepare: "husky",
  release: "pnpm publish --access public --no-git-checks",
};
