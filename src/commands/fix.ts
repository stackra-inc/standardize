/**
 * @fileoverview Fix/Audit command — standardize all package configs.
 * @module @stackra/standardize
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  PACKAGE_MANAGER,
  ENGINES,
  PNPM_OVERRIDES,
  detectEntries,
  buildExportsFields,
} from "../config.js";
import type { CheckResult, PackageType } from "../types.js";
import { classifyPackage, readPkg, writePkg, ensureFile } from "../utils.js";
import {
  SCRIPTS_LIBRARY,
  SCRIPTS_CONFIG,
  SCRIPTS_JSON_CONFIG,
} from "../scripts.js";
import {
  tplPrettierConfig,
  tplVitestConfig,
  tplTsupConfig,
} from "../templates/configs.js";
import {
  TPL_HUSKY_PRE_COMMIT,
  TPL_HUSKY_COMMIT_MSG,
  TPL_COMMITLINT,
  TPL_LINTSTAGED,
  TPL_LINTSTAGED_JSON_CONFIG,
} from "../templates/hooks.js";
import {
  TPL_GITIGNORE,
  TPL_PRETTIERIGNORE,
  TPL_VITEST_SETUP,
  TPL_VITEST_SETUP_DTS,
} from "../templates/scaffolding.js";
import { TPL_DEPENDABOT, TPL_AUTO_MERGE } from "../templates/ci.js";
import {
  TPL_SETUP_ACTION,
  tplCiWorkflow,
  tplPublishWorkflow,
} from "../templates/workflows.js";
import { generateBannerSvg } from "../templates/banner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Standardize a single package — checks and fixes all config files.
 */
function standardize(packageDir: string, auditOnly: boolean): CheckResult[] {
  const results: CheckResult[] = [];
  const dirName = basename(packageDir);
  const pkgType = classifyPackage(dirName);
  const pkg = readPkg(packageDir);
  const name = pkg.name;

  console.log(`\n📦 ${name} (${dirName}) — ${pkgType}`);
  console.log("─".repeat(60));

  let changed = false;

  // ── Scripts ─────────────────────────────────────────────────────────
  const stdScripts =
    pkgType === "library"
      ? SCRIPTS_LIBRARY
      : pkgType === "config"
        ? SCRIPTS_CONFIG
        : SCRIPTS_JSON_CONFIG;
  if (!pkg.scripts) pkg.scripts = {};
  for (const [key, val] of Object.entries(stdScripts)) {
    if (pkg.scripts[key] !== val) {
      const was = pkg.scripts[key] ?? "(missing)";
      results.push({
        package: dirName,
        check: `scripts.${key}`,
        passed: false,
        message: auditOnly
          ? `Expected "${val}", got "${was}"`
          : `"${was}" → "${val}"`,
      });
      if (!auditOnly) {
        pkg.scripts[key] = val;
        changed = true;
      }
    }
  }

  // ── Engines ─────────────────────────────────────────────────────────
  if (!pkg.engines) pkg.engines = {};
  for (const [key, val] of Object.entries(ENGINES)) {
    if (pkg.engines[key] !== val) {
      results.push({
        package: dirName,
        check: `engines.${key}`,
        passed: false,
        message: auditOnly ? `Expected "${val}"` : `→ "${val}"`,
      });
      if (!auditOnly) {
        pkg.engines[key] = val;
        changed = true;
      }
    }
  }

  // ── packageManager ──────────────────────────────────────────────────
  if (pkg.packageManager !== PACKAGE_MANAGER) {
    results.push({
      package: dirName,
      check: "packageManager",
      passed: false,
      message: auditOnly
        ? `Expected "${PACKAGE_MANAGER}"`
        : `→ "${PACKAGE_MANAGER}"`,
    });
    if (!auditOnly) {
      pkg.packageManager = PACKAGE_MANAGER;
      changed = true;
    }
  }

  // ── pnpm overrides ─────────────────────────────────────────────────
  const currentOverrides = (pkg.pnpm?.overrides ?? {}) as Record<
    string,
    string
  >;
  for (const [dep, ver] of Object.entries(PNPM_OVERRIDES)) {
    if (currentOverrides[dep] !== ver) {
      results.push({
        package: dirName,
        check: `pnpm.overrides.${dep}`,
        passed: false,
        message: auditOnly ? `Expected "${ver}"` : `→ "${ver}"`,
      });
      if (!auditOnly) {
        if (!pkg.pnpm) pkg.pnpm = {};
        if (!pkg.pnpm.overrides) pkg.pnpm.overrides = {};
        pkg.pnpm.overrides[dep] = ver;
        changed = true;
      }
    }
  }

  // ── Exports ─────────────────────────────────────────────────────────
  if (pkgType !== "json-config") {
    const entries = detectEntries(join(packageDir, "tsup.config.ts"));
    const std = buildExportsFields(entries);

    if (JSON.stringify(pkg.exports || {}) !== JSON.stringify(std.exports)) {
      results.push({
        package: dirName,
        check: "exports",
        passed: false,
        message: auditOnly ? "Exports mismatch" : "Fixed exports",
      });
      if (!auditOnly) {
        pkg.exports = std.exports;
        changed = true;
      }
    }
    if (pkg.main !== std.main) {
      results.push({
        package: dirName,
        check: "main",
        passed: false,
        message: auditOnly ? `Expected "${std.main}"` : `→ "${std.main}"`,
      });
      if (!auditOnly) {
        pkg.main = std.main;
        changed = true;
      }
    }
    if (pkg.module !== std.module) {
      results.push({
        package: dirName,
        check: "module",
        passed: false,
        message: auditOnly ? `Expected "${std.module}"` : `→ "${std.module}"`,
      });
      if (!auditOnly) {
        pkg.module = std.module;
        changed = true;
      }
    }
    if (pkg.types !== std.types) {
      results.push({
        package: dirName,
        check: "types",
        passed: false,
        message: auditOnly ? `Expected "${std.types}"` : `→ "${std.types}"`,
      });
      if (!auditOnly) {
        pkg.types = std.types;
        changed = true;
      }
    }
  }

  if (changed && !auditOnly) writePkg(packageDir, pkg);

  // ── Config files ────────────────────────────────────────────────────
  if (pkgType !== "json-config") {
    ensureFile(
      join(packageDir, ".prettierrc.mjs"),
      tplPrettierConfig(name),
      results,
      dirName,
      ".prettierrc.mjs",
      auditOnly,
    );
    ensureFile(
      join(packageDir, "vitest.config.ts"),
      tplVitestConfig(name),
      results,
      dirName,
      "vitest.config.ts",
      auditOnly,
    );
  }
  if (pkgType === "library") {
    ensureFile(
      join(packageDir, "tsup.config.ts"),
      tplTsupConfig(name),
      results,
      dirName,
      "tsup.config.ts",
      auditOnly,
    );
  }

  // ── Husky ───────────────────────────────────────────────────────────
  ensureFile(
    join(packageDir, ".husky", "pre-commit"),
    TPL_HUSKY_PRE_COMMIT,
    results,
    dirName,
    ".husky/pre-commit",
    auditOnly,
    true,
  );
  ensureFile(
    join(packageDir, ".husky", "commit-msg"),
    TPL_HUSKY_COMMIT_MSG,
    results,
    dirName,
    ".husky/commit-msg",
    auditOnly,
    true,
  );

  // ── Commitlint + lint-staged ────────────────────────────────────────
  ensureFile(
    join(packageDir, "commitlint.config.ts"),
    TPL_COMMITLINT,
    results,
    dirName,
    "commitlint.config.ts",
    auditOnly,
  );
  ensureFile(
    join(packageDir, ".lintstagedrc.mjs"),
    pkgType === "json-config" ? TPL_LINTSTAGED_JSON_CONFIG : TPL_LINTSTAGED,
    results,
    dirName,
    ".lintstagedrc.mjs",
    auditOnly,
  );

  // ── Scaffolding ─────────────────────────────────────────────────────
  ensureFile(
    join(packageDir, ".gitignore"),
    TPL_GITIGNORE,
    results,
    dirName,
    ".gitignore",
    auditOnly,
  );
  ensureFile(
    join(packageDir, ".prettierignore"),
    TPL_PRETTIERIGNORE,
    results,
    dirName,
    ".prettierignore",
    auditOnly,
  );
  if (pkgType !== "json-config") {
    ensureFile(
      join(packageDir, "__tests__", "vitest.setup.ts"),
      TPL_VITEST_SETUP,
      results,
      dirName,
      "__tests__/vitest.setup.ts",
      auditOnly,
    );
    ensureFile(
      join(packageDir, "__tests__", "setup.d.ts"),
      TPL_VITEST_SETUP_DTS,
      results,
      dirName,
      "__tests__/setup.d.ts",
      auditOnly,
    );
  }

  // ── CI ──────────────────────────────────────────────────────────────
  ensureFile(
    join(packageDir, ".github", "dependabot.yml"),
    TPL_DEPENDABOT,
    results,
    dirName,
    ".github/dependabot.yml",
    auditOnly,
  );
  ensureFile(
    join(packageDir, ".github", "workflows", "dependabot-auto-merge.yml"),
    TPL_AUTO_MERGE,
    results,
    dirName,
    ".github/workflows/dependabot-auto-merge.yml",
    auditOnly,
  );

  // Setup action is always enforced (standardized pnpm + node setup)
  ensureFile(
    join(packageDir, ".github", "actions", "setup", "action.yml"),
    TPL_SETUP_ACTION,
    results,
    dirName,
    ".github/actions/setup/action.yml",
    auditOnly,
  );

  // Banner — create placeholder only if missing (never overwrite custom banners)
  const bannerPath = join(packageDir, ".github", "assets", "banner.svg");
  if (!existsSync(bannerPath)) {
    const desc = ((pkg as Record<string, unknown>).description as string) || "";
    const bannerContent = generateBannerSvg(name, desc);
    ensureFile(
      bannerPath,
      bannerContent,
      results,
      dirName,
      ".github/assets/banner.svg",
      auditOnly,
    );
  }

  // CI and publish workflows — create only if missing (don't override custom flows)
  const ciPath = join(packageDir, ".github", "workflows", "ci.yml");
  if (!existsSync(ciPath)) {
    const hasLint = pkgType === "library";
    const hasTypecheck = pkgType !== "json-config";
    const hasTest = pkgType !== "json-config";
    const ciContent = tplCiWorkflow(name, hasLint, hasTypecheck, hasTest);
    ensureFile(
      ciPath,
      ciContent,
      results,
      dirName,
      ".github/workflows/ci.yml",
      auditOnly,
    );
  }

  const publishPath = join(packageDir, ".github", "workflows", "publish.yml");
  if (!existsSync(publishPath)) {
    const repoSlug = `stackra-inc/${dirName}`;
    const publishContent = tplPublishWorkflow(name, repoSlug);
    ensureFile(
      publishPath,
      publishContent,
      results,
      dirName,
      ".github/workflows/publish.yml",
      auditOnly,
    );
  }

  // ── Steering ────────────────────────────────────────────────────────
  const steeringSource = resolve(__dirname, "..", "..", "steering");
  if (existsSync(steeringSource)) {
    const steeringFiles = readdirSync(steeringSource).filter((f) =>
      f.endsWith(".md"),
    );
    for (const file of steeringFiles) {
      const content = readFileSync(join(steeringSource, file), "utf-8");
      ensureFile(
        join(packageDir, ".kiro", "steering", file),
        content,
        results,
        dirName,
        `.kiro/steering/${file}`,
        auditOnly,
        false,
        true, // createOnly — don't overwrite if prettier reformatted
      );
    }
  }

  return results;
}

/**
 * Run fix or audit across all packages and print summary.
 */
export function runFixOrAudit(packageDirs: string[], auditOnly: boolean): void {
  const allResults: CheckResult[] = [];
  for (const dir of packageDirs) {
    if (!existsSync(join(dir, "package.json"))) {
      console.log(`\n⚠️  Skipping ${basename(dir)}`);
      continue;
    }
    allResults.push(...standardize(dir, auditOnly));
  }

  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed).length;

  console.log("\n");
  console.log(
    "╔══════════════════════════════════════════════════════════════╗",
  );
  console.log("║                        📊 Summary                          ║");
  console.log(
    "╚══════════════════════════════════════════════════════════════╝",
  );
  console.log(`  Total: ${allResults.length}  ✅ ${passed}  ❌ ${failed}`);

  if (failed > 0) {
    const grouped = new Map<string, CheckResult[]>();
    for (const r of allResults.filter((r) => !r.passed)) {
      if (!grouped.has(r.package)) grouped.set(r.package, []);
      grouped.get(r.package)!.push(r);
    }
    for (const [pkg, checks] of grouped) {
      console.log(`\n  📦 ${pkg}:`);
      for (const c of checks) console.log(`    ❌ ${c.check}: ${c.message}`);
    }
  }

  if (auditOnly && failed > 0)
    console.log('\n💡 Run "fix" to apply automatically.');
  if (!auditOnly && failed > 0) {
    // Run prettier on all fixed packages to ensure format:check passes
    console.log("\n🎨 Formatting fixed files...");
    for (const dir of packageDirs) {
      if (!existsSync(join(dir, "package.json"))) continue;
      const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
      if (pkg.scripts?.format) {
        try {
          execSync("pnpm format", { cwd: dir, stdio: "pipe", timeout: 30_000 });
        } catch {
          // Format may fail if prettier-config isn't installed — that's OK
        }
      }
    }
    console.log("✅ All issues fixed and formatted.");
  }
  if (failed === 0) console.log("\n🎉 All packages are standardized!");
}
