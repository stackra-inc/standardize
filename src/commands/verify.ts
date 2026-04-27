/**
 * @fileoverview Verify command — runs the full quality pipeline across packages.
 *
 * Executes build, format:check, typecheck, lint, and test in each discovered
 * package. Reports pass/fail per step per package with a final summary.
 *
 * @module @stackra/tools-standardize
 */

import { execSync } from "node:child_process";
import { join, basename } from "node:path";
import { existsSync, readFileSync } from "node:fs";

/** Result of running a single command in a single package. */
interface StepResult {
  package: string;
  step: string;
  passed: boolean;
  output: string;
}

/**
 * The ordered list of quality steps to run per package.
 *
 * Each step maps to a script name in package.json.
 * Steps are skipped if the script doesn't exist in that package.
 */
const STEPS = ["build", "format:check", "typecheck", "lint", "test"] as const;

/**
 * Runs a single npm script in a package directory.
 *
 * @param packageDir - Absolute path to the package
 * @param script - The npm script name to run
 * @returns The step result with pass/fail and output
 */
function runStep(packageDir: string, script: string): StepResult {
  const dirName = basename(packageDir);

  /** Check if the script exists in package.json. */
  const pkg = JSON.parse(
    readFileSync(join(packageDir, "package.json"), "utf-8"),
  );
  if (!pkg.scripts?.[script]) {
    return {
      package: dirName,
      step: script,
      passed: true,
      output: "skipped (no script)",
    };
  }

  try {
    const output = execSync(`pnpm ${script}`, {
      cwd: packageDir,
      stdio: "pipe",
      timeout: 120_000,
      encoding: "utf-8",
    });
    return {
      package: dirName,
      step: script,
      passed: true,
      output: output.slice(-200),
    };
  } catch (err: unknown) {
    const error = err as { stderr?: string; stdout?: string };
    const output = (error.stderr || error.stdout || "Unknown error").slice(
      -500,
    );
    return { package: dirName, step: script, passed: false, output };
  }
}

/**
 * Runs the full quality pipeline across all given package directories.
 *
 * @param packageDirs - Array of absolute paths to package directories
 */
export function verify(packageDirs: string[]): void {
  console.log("\n🔍 Running quality pipeline...\n");

  const allResults: StepResult[] = [];
  const failures: StepResult[] = [];

  for (const dir of packageDirs) {
    const dirName = basename(dir);
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
    console.log(`📦 ${pkg.name} (${dirName})`);

    for (const step of STEPS) {
      process.stdout.write(`  ${step.padEnd(16)}`);
      const result = runStep(dir, step);
      allResults.push(result);

      if (result.output === "skipped (no script)") {
        console.log("⏭️  skipped");
      } else if (result.passed) {
        console.log("✅ pass");
      } else {
        console.log("❌ FAIL");
        failures.push(result);
      }
    }
    console.log("");
  }

  // ── Summary ─────────────────────────────────────────────────────────────

  const passed = allResults.filter((r) => r.passed).length;
  const failed = failures.length;

  console.log(
    "╔══════════════════════════════════════════════════════════════╗",
  );
  console.log("║                   🔍 Verify Summary                        ║");
  console.log(
    "╚══════════════════════════════════════════════════════════════╝",
  );
  console.log(`  Total: ${allResults.length}  ✅ ${passed}  ❌ ${failed}`);

  if (failed > 0) {
    console.log("\nFailures:\n");
    for (const f of failures) {
      console.log(`  📦 ${f.package} → ${f.step}`);
      /** Show last few lines of error output, indented. */
      const lines = f.output.trim().split("\n").slice(-8);
      for (const line of lines) {
        console.log(`     ${line}`);
      }
      console.log("");
    }
    process.exitCode = 1;
  } else {
    console.log("\n🎉 All packages pass the quality pipeline!");
  }
}
