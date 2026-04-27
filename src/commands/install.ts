/**
 * @fileoverview Install command — runs pnpm install across all packages.
 *
 * Handles the chicken-and-egg problem with husky by installing with
 * --ignore-scripts first, then running husky init separately.
 *
 * @module @stackra/tools-standardize
 */

import { execSync } from "node:child_process";
import { basename } from "node:path";
import { join, resolve } from "node:path";
import { readFileSync } from "node:fs";

/**
 * Runs pnpm install in each package directory.
 *
 * Uses --ignore-scripts on first pass to avoid the husky chicken-and-egg
 * problem, then runs `npx husky` to initialize git hooks.
 *
 * @param packageDirs - Array of absolute paths to package directories
 */
export function install(packageDirs: string[]): void {
  console.log("\n📦 Installing dependencies...\n");

  for (const dir of packageDirs) {
    const dirName = basename(dir);
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
    process.stdout.write(`  ${pkg.name.padEnd(35)}`);

    try {
      /** Install deps without running lifecycle scripts (avoids husky not-found error). */
      execSync("pnpm install --ignore-scripts", {
        cwd: dir,
        stdio: "pipe",
        timeout: 120_000,
        encoding: "utf-8",
      });

      /** Initialize husky git hooks. */
      execSync("npx husky", {
        cwd: dir,
        stdio: "pipe",
        timeout: 10_000,
        encoding: "utf-8",
      });

      console.log("✅");
    } catch (err: unknown) {
      const error = err as { stderr?: string };
      console.log("❌");
      const lines = (error.stderr || "Unknown error")
        .trim()
        .split("\n")
        .slice(-3);
      for (const line of lines) console.log(`    ${line}`);
    }
  }

  console.log("\n✅ Install complete.");
}
