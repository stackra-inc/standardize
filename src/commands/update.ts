/**
 * @fileoverview Update command — runs ncu -u then pins overrides back.
 *
 * Updates all dependencies to latest versions, then re-applies pnpm
 * overrides to prevent breaking major bumps (eslint 10, vite 8, etc.).
 *
 * @module @stackra/standardize
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { PNPM_OVERRIDES } from "../config.js";

/**
 * Runs ncu -u in each package, then pins overrides back in devDependencies.
 */
export function update(packageDirs: string[]): void {
  console.log("\n⬆️  Updating dependencies...\n");

  for (const dir of packageDirs) {
    const pkgPath = join(dir, "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const dirName = basename(dir);

    process.stdout.write(`  📦 ${pkg.name.padEnd(35)}`);

    // Run ncu -u
    try {
      const output = execSync("ncu -u", {
        cwd: dir,
        stdio: "pipe",
        timeout: 60_000,
        encoding: "utf-8",
      });

      const upgraded = output.match(/→/g)?.length || 0;
      if (upgraded > 0) {
        process.stdout.write(`⬆️  ${upgraded} upgraded`);
      } else {
        process.stdout.write("✅ up to date");
      }
    } catch {
      process.stdout.write("⚠️  ncu failed (is it installed?)");
      console.log("");
      continue;
    }

    // Pin overrides back in devDependencies
    const updated = JSON.parse(readFileSync(pkgPath, "utf-8"));
    let pinned = 0;

    for (const [dep, ver] of Object.entries(PNPM_OVERRIDES)) {
      if (updated.devDependencies?.[dep]) {
        const current = updated.devDependencies[dep];
        // Check if ncu bumped it beyond our override
        if (current !== ver) {
          updated.devDependencies[dep] = ver;
          pinned++;
        }
      }
    }

    if (pinned > 0) {
      writeFileSync(pkgPath, JSON.stringify(updated, null, 2) + "\n", "utf-8");
      process.stdout.write(` (pinned ${pinned} overrides)`);
    }

    console.log("");
  }

  console.log('\n✅ Update complete. Run "install" to apply.');
}
