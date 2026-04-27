/**
 * @fileoverview Setup command — full pipeline for new or existing packages.
 *
 * Runs all standardization steps in the correct order:
 *   1. fix      — standardize configs, scripts, hooks, steering
 *   2. update   — ncu -u + pin overrides
 *   3. deps     — install missing devDependencies
 *   4. install  — pnpm install + husky init
 *   5. verify   — build, format, typecheck, lint, test
 *
 * This is the one command to run for a new package or after major changes.
 *
 * Usage:
 *   npx @stackra/standardize setup
 *   npx @stackra/standardize setup --pkg cache
 *
 * @module @stackra/standardize
 */

import { runFixOrAudit } from "./fix.js";
import { update } from "./update.js";
import { deps } from "./deps.js";
import { install } from "./install.js";
import { verify } from "./verify.js";

/**
 * Runs the full setup pipeline.
 */
export function setup(packageDirs: string[]): void {
  console.log("\n🚀 Running full setup pipeline...");
  console.log("═".repeat(60));

  console.log("\n📋 Step 1/5: Fix (standardize configs)");
  console.log("─".repeat(40));
  runFixOrAudit(packageDirs, false);

  console.log("\n📋 Step 2/5: Update (ncu -u + pin overrides)");
  console.log("─".repeat(40));
  update(packageDirs);

  console.log("\n📋 Step 3/5: Deps (install missing devDependencies)");
  console.log("─".repeat(40));
  deps(packageDirs, false);

  console.log("\n📋 Step 4/5: Install (pnpm install + husky)");
  console.log("─".repeat(40));
  install(packageDirs);

  console.log("\n📋 Step 5/5: Verify (build, format, typecheck, lint, test)");
  console.log("─".repeat(40));
  verify(packageDirs);

  console.log("\n═".repeat(60));
  console.log("🏁 Setup complete.");
}
