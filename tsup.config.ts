/**
 * @fileoverview tsup build configuration for @stackra/standardize
 *
 * Builds the CLI as a single executable bundle.
 * Includes all commands (fix, audit, verify, install, deps).
 *
 * @module @stackra/standardize
 */

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: "es2022",
  outDir: "dist",
  banner: {
    js: `/**\n * @stackra/standardize v1.0.0\n * Copyright (c) ${new Date().getFullYear()} Stackra L.L.C\n * @license MIT\n */`,
  },
});
