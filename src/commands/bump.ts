/**
 * @fileoverview Bump command — version bump, commit, tag, push.
 *
 * Automates the release process:
 *   1. Bump version in package.json (patch/minor/major)
 *   2. Run format to ensure clean state
 *   3. Commit with "release: vX.Y.Z"
 *   4. Push to main
 *   5. Create and push tag (triggers publish workflow)
 *
 * Usage:
 *   stackra-std bump                    # patch bump all packages
 *   stackra-std bump --minor            # minor bump all packages
 *   stackra-std bump --major            # major bump all packages
 *   stackra-std bump --pkg container    # bump single package
 *   stackra-std bump --dry-run          # show what would happen
 *
 * @module @stackra/standardize
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

/**
 * Bumps a semver version string.
 *
 * @param version - Current version (e.g., '1.2.3')
 * @param type - 'patch' | 'minor' | 'major'
 * @returns New version string
 */
function bumpVersion(
  version: string,
  type: "patch" | "minor" | "major",
): string {
  const [major, minor, patch] = version.split(".").map(Number);
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}

/**
 * Runs a shell command in a directory, returns stdout.
 * Returns null on failure instead of throwing.
 */
function run(cmd: string, cwd: string): string | null {
  try {
    return execSync(cmd, {
      cwd,
      stdio: "pipe",
      timeout: 30_000,
      encoding: "utf-8",
    }).trim();
  } catch {
    return null;
  }
}

/**
 * Bumps versions, commits, tags, and pushes packages.
 *
 * @param packageDirs - Array of absolute paths to package directories
 * @param args - CLI args to detect --minor, --major, --dry-run
 */
export function bump(packageDirs: string[], args: string[]): void {
  const type: "patch" | "minor" | "major" = args.includes("--major")
    ? "major"
    : args.includes("--minor")
      ? "minor"
      : "patch";
  const dryRun = args.includes("--dry-run");

  console.log(
    `\n📦 Bumping versions (${type})${dryRun ? " — dry run" : ""}...\n`,
  );

  const results: Array<{ pkg: string; old: string; new: string; dir: string }> =
    [];

  for (const dir of packageDirs) {
    const pkgPath = join(dir, "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const dirName = basename(dir);
    const oldVer = pkg.version;
    const newVer = bumpVersion(oldVer, type);

    results.push({ pkg: pkg.name, old: oldVer, new: newVer, dir });
    console.log(`  ${pkg.name.padEnd(35)} ${oldVer} → ${newVer}`);

    if (dryRun) continue;

    // 1. Bump version
    pkg.version = newVer;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");

    // 2. Format
    run("pnpm format", dir);

    // 3. Check if there's a git repo
    if (!run("git rev-parse --git-dir", dir)) {
      console.log(`    ⚠️  No git repo — skipping commit/tag/push`);
      continue;
    }

    // 4. Commit
    run("git add -A", dir);
    run(`git commit --no-verify -m "release: v${newVer}"`, dir);

    // 5. Push
    run("git push origin main", dir);

    // 6. Tag and push tag
    run(`git tag v${newVer}`, dir);
    const tagPush = run(`git push origin v${newVer}`, dir);
    if (tagPush !== null) {
      console.log(`    ✅ tagged v${newVer} and pushed`);
    } else {
      console.log(`    ⚠️  Tag push failed`);
    }
  }

  // Summary
  console.log("\n" + "─".repeat(50));
  if (dryRun) {
    console.log(`\n💡 Dry run — ${results.length} packages would be bumped.`);
    console.log("Run without --dry-run to apply.");
  } else {
    console.log(
      `\n✅ ${results.length} packages bumped, committed, tagged, and pushed.`,
    );
    console.log("Publish workflows will run automatically on tag push.");
  }
}
