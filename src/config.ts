/**
 * @fileoverview Stackra Standardization Configuration
 *
 * The single source of truth for all organization-wide constants.
 * Every template, script, and check in the standardize tool reads from here.
 *
 * When something changes (pnpm version, Node version, org name, etc.),
 * update it here and re-run the tool — all packages get updated.
 *
 * @module @stackra/tools-standardize
 * @author Stackra L.L.C
 * @license MIT
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

// ═══════════════════════════════════════════════════════════════════════════
// Organization
// ═══════════════════════════════════════════════════════════════════════════

/** The npm scope for all packages (e.g., @stackra/ts-http). */
export const NPM_SCOPE = "@stackra";

/** The organization display name used in banners and docs. */
export const ORG_NAME = "Stackra L.L.C";

/** The organization email for package.json author field. */
export const ORG_EMAIL = "dev@stackra.com";

/** The GitHub organization URL. */
export const ORG_GITHUB = "https://github.com/stackra-inc";

/** The license used across all packages. */
export const LICENSE = "MIT";

/** The GitHub username assigned to Dependabot PRs. */
export const DEPENDABOT_ASSIGNEE = "akouta";

// ═══════════════════════════════════════════════════════════════════════════
// Runtime Versions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The exact pnpm version pinned via corepack / packageManager field.
 * All packages must use the same version for reproducible installs.
 */
export const PNPM_VERSION = "10.33.2";

/**
 * The minimum Node.js version required.
 * Node 22 is the current LTS — we target it for stability.
 * Node 24 (current) also works but isn't LTS yet.
 */
export const NODE_MIN_VERSION = "22";

/** The minimum pnpm version required (engines field). */
export const PNPM_MIN_VERSION = "9.0.0";

/** The TypeScript target for tsup output. */
export const TS_TARGET = "es2022";

// ═══════════════════════════════════════════════════════════════════════════
// Derived Constants (computed from the above)
// ═══════════════════════════════════════════════════════════════════════════

/** The packageManager field value for package.json. */
export const PACKAGE_MANAGER = `pnpm@${PNPM_VERSION}`;

/** The engines field for package.json. */
export const ENGINES: Record<string, string> = {
  node: `>=${NODE_MIN_VERSION}`,
  pnpm: `>=${PNPM_MIN_VERSION}`,
};

/** The current year for copyright banners. */
export const COPYRIGHT_YEAR = new Date().getFullYear();

// ═══════════════════════════════════════════════════════════════════════════
// pnpm Overrides — pin transitive deps to prevent breaking major bumps
// ═══════════════════════════════════════════════════════════════════════════

/**
 * pnpm overrides to enforce across all packages.
 *
 * These prevent transitive dependencies from pulling in incompatible
 * major versions. For example, vitest 4.x declares `vite@^7.0.0 || ^8.0.0`
 * as a peer dep — without an override, pnpm resolves to vite 8 which
 * breaks path resolution in tests.
 *
 * Update these when you're ready to adopt a new major version across
 * the entire ecosystem. Then re-run the tool to propagate.
 *
 * @see https://pnpm.io/package_json#pnpmoverrides
 */
export const PNPM_OVERRIDES: Record<string, string> = {
  /** Pin ESLint to v9 — v10 breaks eslint-plugin-react and other plugins. */
  eslint: "^9.28.0",

  /** Pin Vite to v7 — v8 breaks vitest path resolution with @ aliases. */
  vite: "^7.2.6",
};

/**
 * Generates a copyright banner string for build output files.
 *
 * This banner is injected at the top of every compiled JS file by tsup.
 * It includes the package name, version, copyright, and license.
 *
 * @param packageName - The full npm package name (e.g., '@stackra/ts-http')
 * @param version - The package version (e.g., '2.0.10')
 * @returns A JSDoc-style banner comment
 *
 * @example
 * ```
 * /**
 *  * @stackra/ts-http v1.0.0
 *  * Copyright (c) 2026 Stackra L.L.C
 *  * @license MIT
 *  * @see https://github.com/stackra-inc
 *  *\/
 * ```
 */
export function generateBanner(packageName: string, version: string): string {
  return [
    "/**",
    ` * ${packageName} v${version}`,
    ` * Copyright (c) ${COPYRIGHT_YEAR} ${ORG_NAME}`,
    ` * @license ${LICENSE}`,
    ` * @see ${ORG_GITHUB}`,
    " */",
  ].join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════
// Package Exports — standardized exports/main/module/types fields
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generates a single export condition block for a given entry name.
 *
 * tsup outputs: .js (ESM), .cjs (CJS), .d.ts, .d.cts
 * The exports map must reference all four for full compatibility.
 *
 * @param name - The entry name (e.g., 'index', 'react')
 * @returns The export conditions object
 */
export function makeExportEntry(name: string): Record<string, string> {
  return {
    types: `./dist/${name}.d.ts`,
    import: `./dist/${name}.js`,
    require: `./dist/${name}.cjs`,
  };
}

/**
 * Detects tsup entry points from a tsup.config.ts file.
 *
 * Reads the file as text and extracts entry patterns.
 * Falls back to ['src/index.ts'] if no entry is found.
 *
 * @param tsupConfigPath - Absolute path to tsup.config.ts
 * @returns Array of entry basenames (e.g., ['index'] or ['index', 'react'])
 */
export function detectEntries(tsupConfigPath: string): string[] {
  if (!existsSync(tsupConfigPath)) return ["index"];

  const content = readFileSync(tsupConfigPath, "utf-8");

  // Match entry: ['src/index.ts', 'src/react.ts']
  const arrayMatch = content.match(/entry\s*:\s*\[([^\]]+)\]/);
  if (arrayMatch) {
    const entries = arrayMatch[1]
      .split(",")
      .map((e) => e.trim().replace(/['"]/g, ""))
      .map((e) => e.replace(/^src\//, "").replace(/\.tsx?$/, ""));
    return entries.length > 0 ? entries : ["index"];
  }

  // Match entry: { main: 'src/index.ts' }
  const objMatch = content.match(/entry\s*:\s*\{([^}]+)\}/);
  if (objMatch) {
    const entries = objMatch[1]
      .split(",")
      .map((e) => {
        const valMatch = e.match(/['"]([^'"]+)['"]/g);
        return valMatch
          ? valMatch[valMatch.length - 1].replace(/['"]/g, "")
          : null;
      })
      .filter(Boolean)
      .map((e) => (e as string).replace(/^src\//, "").replace(/\.tsx?$/, ""));
    return entries.length > 0 ? entries : ["index"];
  }

  // Uses preset default
  return ["index"];
}

/**
 * Builds the standardized exports, main, module, and types fields
 * for a package.json based on its tsup entry points.
 *
 * @param entries - Array of entry basenames (e.g., ['index'] or ['index', 'react'])
 * @returns Object with exports, main, module, types fields
 */
export function buildExportsFields(entries: string[]): {
  exports: Record<string, Record<string, string>>;
  main: string;
  module: string;
  types: string;
} {
  const exportsMap: Record<string, Record<string, string>> = {};

  for (const entry of entries) {
    const key = entry === "index" ? "." : `./${entry}`;
    exportsMap[key] = makeExportEntry(entry);
  }

  return {
    exports: exportsMap,
    main: "./dist/index.cjs",
    module: "./dist/index.js",
    types: "./dist/index.d.ts",
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Package Discovery
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Directories to skip when scanning the workspace root for packages.
 * These are never @stackra packages — skipping them avoids false positives
 * and speeds up discovery.
 */
export const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  ".github",
  ".kiro",
  ".ref",
  ".husky",
  "tools",
  "dist",
  "coverage",
]);

/**
 * Auto-discovers all @stackra/* packages in the workspace.
 *
 * Scans every top-level directory in the workspace root for a package.json
 * whose `name` starts with the configured NPM_SCOPE. This means you never
 * have to manually register new packages — just create the directory and
 * the tool picks it up.
 *
 * Results are sorted so config packages come first (dependency order):
 *   1. typescript-config (no internal deps)
 *   2. *-config packages (depend on typescript-config)
 *   3. Everything else (libraries that depend on config packages)
 *
 * @param workspaceRoot - Absolute path to the workspace root directory
 * @returns Array of directory names sorted in dependency order
 *
 * @example
 * ```ts
 * const packages = discoverPackages('/Users/dev/stackra');
 * // → ['typescript-config', 'tsup-config', 'prettier-config', 'eslint-config',
 * //    'container', 'http', 'redis', 'support', ...]
 * ```
 */
export function discoverPackages(workspaceRoot: string): string[] {
  /** Read all entries in the workspace root. */
  const entries = readdirSync(workspaceRoot);

  const packages: Array<{ dir: string; name: string }> = [];

  for (const entry of entries) {
    /** Skip hidden dirs, ignored dirs, and files. */
    if (entry.startsWith(".") || IGNORED_DIRS.has(entry)) continue;

    const fullPath = join(workspaceRoot, entry);

    /** Must be a directory. */
    if (!statSync(fullPath).isDirectory()) continue;

    /** Must have a package.json. */
    const pkgPath = join(fullPath, "package.json");
    if (!existsSync(pkgPath)) continue;

    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

      /** Must be in our npm scope. */
      if (
        typeof pkg.name === "string" &&
        pkg.name.startsWith(`${NPM_SCOPE}/`)
      ) {
        packages.push({ dir: entry, name: pkg.name });
      }
    } catch {
      /** Skip directories with invalid package.json. */
    }
  }

  /**
   * Sort in dependency order:
   *   - typescript-config first (foundation — no internal deps)
   *   - Other *-config packages next (they depend on typescript-config)
   *   - Libraries last (they depend on config packages)
   */
  return packages
    .sort((a, b) => {
      const aOrder = sortOrder(a.dir);
      const bOrder = sortOrder(b.dir);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.dir.localeCompare(b.dir);
    })
    .map((p) => p.dir);
}

/**
 * Returns a numeric sort priority for dependency ordering.
 *
 * @param dirName - The package directory name
 * @returns 0 for typescript-config, 1 for other configs, 2 for libraries
 */
function sortOrder(dirName: string): number {
  if (dirName === "typescript-config") return 0;
  if (dirName.endsWith("-config")) return 1;
  return 2;
}
