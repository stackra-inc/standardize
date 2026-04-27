/**
 * @fileoverview Shared types for the standardize tool.
 * @module @stackra/standardize
 */

/** Result of a single standardization check. */
export interface CheckResult {
  package: string;
  check: string;
  passed: boolean;
  message: string;
}

/** Parsed package.json with the fields we inspect. */
export interface PackageJson {
  name: string;
  version: string;
  scripts?: Record<string, string>;
  engines?: Record<string, string>;
  packageManager?: string;
  main?: string;
  module?: string;
  types?: string;
  exports?: Record<string, Record<string, string>>;
  pnpm?: { overrides?: Record<string, string> };
  [key: string]: unknown;
}

/**
 * Package classification — determines which standards apply.
 *
 * - 'library'     → full toolchain (container, http, redis, support)
 * - 'config'      → simpler setup (eslint-config, prettier-config, tsup-config)
 * - 'json-config' → JSON-only, no tsup/vitest (typescript-config)
 */
export type PackageType = "library" | "config" | "json-config";
