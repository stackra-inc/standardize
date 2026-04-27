/**
 * @fileoverview Deps command — ensures required devDependencies are present.
 *
 * Each package type (library, config, json-config) has a set of required
 * devDependencies for its toolchain. This command checks and installs
 * any that are missing.
 *
 * @module @stackra/tools-standardize
 */

import { execSync } from "node:child_process";
import { basename, join } from "node:path";
import { readFileSync } from "node:fs";
import { NPM_SCOPE } from "../config.js";

/**
 * Required devDependencies by package type.
 *
 * These are the minimum deps each package needs for its scripts to work.
 * Peer deps (eslint, prettier, tsup, typescript) are resolved automatically
 * by pnpm 10 from the config packages — no need to install them directly
 * in consumer packages.
 */
const REQUIRED_DEV_DEPS: Record<string, string[]> = {
  /** Libraries need the full toolchain. */
  library: [
    `${NPM_SCOPE}/tsup-config`,
    `${NPM_SCOPE}/typescript-config`,
    `${NPM_SCOPE}/prettier-config`,
    `${NPM_SCOPE}/eslint-config`,
    "@types/node",
    "vitest",
    "jsdom",
    "husky",
    "lint-staged",
    "@commitlint/cli",
    "@commitlint/config-conventional",
    "@commitlint/types",
  ],

  /** Config packages need build + test + hooks tooling. */
  config: [
    `${NPM_SCOPE}/typescript-config`,
    `${NPM_SCOPE}/prettier-config`,
    "@types/node",
    "vitest",
    "jsdom",
    "husky",
    "lint-staged",
    "@commitlint/cli",
    "@commitlint/config-conventional",
    "@commitlint/types",
  ],

  /** JSON-config only needs prettier + hooks tooling (no build/test). */
  "json-config": [
    "prettier",
    "husky",
    "lint-staged",
    "@commitlint/cli",
    "@commitlint/config-conventional",
    "@commitlint/types",
  ],
};

/** Classify a package by its directory name. */
function classify(dirName: string): string {
  if (dirName === "typescript-config") return "json-config";
  if (dirName.endsWith("-config")) return "config";
  return "library";
}

/**
 * Checks and installs missing devDependencies across all packages.
 *
 * @param packageDirs - Array of absolute paths to package directories
 * @param dryRun - If true, report but don't install
 */
export function deps(packageDirs: string[], dryRun = false): void {
  console.log(
    `\n📋 Checking required devDependencies... ${dryRun ? "(dry run)" : ""}\n`,
  );

  let totalMissing = 0;

  for (const dir of packageDirs) {
    const dirName = basename(dir);
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
    const pkgType = classify(dirName);
    const required = REQUIRED_DEV_DEPS[pkgType] || [];
    const devDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };

    /** Find deps that are required but not present. */
    const missing = required.filter((dep) => !devDeps[dep]);

    if (missing.length === 0) {
      console.log(`  📦 ${pkg.name.padEnd(35)} ✅ all deps present`);
      continue;
    }

    totalMissing += missing.length;
    console.log(`  📦 ${pkg.name.padEnd(35)} ❌ missing ${missing.length}:`);
    for (const dep of missing) {
      console.log(`      + ${dep}`);
    }

    if (!dryRun) {
      try {
        const depList = missing.join(" ");
        execSync(`pnpm add -D ${depList} --ignore-scripts`, {
          cwd: dir,
          stdio: "pipe",
          timeout: 120_000,
          encoding: "utf-8",
        });
        console.log(`      ✅ installed`);
      } catch (err: unknown) {
        const error = err as { stderr?: string };
        console.log(`      ❌ install failed`);
        const lines = (error.stderr || "").trim().split("\n").slice(-3);
        for (const line of lines) console.log(`      ${line}`);
      }
    }
    console.log("");
  }

  if (totalMissing === 0) {
    console.log("\n🎉 All packages have their required devDependencies!");
  } else if (dryRun) {
    console.log(
      `\n💡 ${totalMissing} missing deps found. Run without --dry-run to install.`,
    );
  } else {
    console.log(`\n✅ Installed ${totalMissing} missing dependencies.`);
  }
}
