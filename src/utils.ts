/**
 * @fileoverview Shared utilities — file helpers, package classification.
 * @module @stackra/standardize
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  chmodSync,
} from "node:fs";
import { join, dirname } from "node:path";
import type { CheckResult, PackageJson, PackageType } from "./types.js";

/** Classify a package by its directory name. */
export function classifyPackage(dirName: string): PackageType {
  if (dirName === "typescript-config") return "json-config";
  if (dirName.endsWith("-config")) return "config";
  return "library";
}

/** Read and parse a package.json file. */
export function readPkg(dir: string): PackageJson {
  return JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
}

/** Write a package.json with 2-space indent and trailing newline. */
export function writePkg(dir: string, pkg: PackageJson): void {
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify(pkg, null, 2) + "\n",
    "utf-8",
  );
}

/**
 * Ensures a file exists with the expected content.
 * Creates parent directories as needed. Makes hook files executable.
 *
 * @param createOnly - If true, only create if missing (don't update existing files)
 */
export function ensureFile(
  filePath: string,
  content: string,
  results: CheckResult[],
  pkgDir: string,
  checkName: string,
  auditOnly: boolean,
  executable = false,
  createOnly = false,
): boolean {
  const label = auditOnly ? "would" : "";

  if (!existsSync(filePath)) {
    results.push({
      package: pkgDir,
      check: checkName,
      passed: false,
      message: `Missing — ${label || "created"}`.trim(),
    });
    if (!auditOnly) {
      const dir = dirname(filePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(filePath, content, "utf-8");
      if (executable) chmodSync(filePath, 0o755);
    }
    return false;
  }

  /** In createOnly mode, existing files are always considered OK */
  if (createOnly) {
    results.push({
      package: pkgDir,
      check: checkName,
      passed: true,
      message: "OK",
    });
    return true;
  }

  const current = readFileSync(filePath, "utf-8");
  if (current.trim() !== content.trim()) {
    results.push({
      package: pkgDir,
      check: checkName,
      passed: false,
      message: `Differs — ${label || "updated"}`.trim(),
    });
    if (!auditOnly) {
      writeFileSync(filePath, content, "utf-8");
      if (executable) chmodSync(filePath, 0o755);
    }
    return false;
  }

  results.push({
    package: pkgDir,
    check: checkName,
    passed: true,
    message: "OK",
  });
  return true;
}
