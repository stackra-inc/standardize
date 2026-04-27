#!/usr/bin/env tsx
/**
 * @fileoverview Stackra Package Standardization Tool — CLI entry point.
 *
 * Can be run from anywhere:
 *   - From workspace root: npx tsx tools/standardize/src/index.ts verify
 *   - From tools/standardize: pnpm start verify
 *   - Via npx: npx @stackra/standardize verify
 *   - With explicit root: npx @stackra/standardize verify --root /path/to/workspace
 *
 * @module @stackra/standardize
 * @author Stackra L.L.C
 * @license MIT
 */

import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { NPM_SCOPE, ORG_NAME, discoverPackages } from "./config.js";
import { runFixOrAudit } from "./commands/fix.js";
import { verify } from "./commands/verify.js";
import { install } from "./commands/install.js";
import { deps } from "./commands/deps.js";
import { update } from "./commands/update.js";
import { setup } from "./commands/setup.js";
import { init } from "./commands/init.js";
import { bump } from "./commands/bump.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Detects the workspace root by checking:
 *   1. --root flag if provided
 *   2. Current working directory if it has multiple @stackra/* packages
 *   3. Walk up from cwd looking for a directory with multiple packages
 *   4. Walk up from __dirname (for when run from tools/standardize/)
 *   5. Fallback to cwd
 */
function findWorkspaceRoot(args: string[]): string {
  const rootIdx = args.indexOf("--root");
  if (rootIdx !== -1 && args[rootIdx + 1]) return resolve(args[rootIdx + 1]);

  /** A real workspace has multiple @stackra/* packages, not just one */
  const isWorkspace = (dir: string) => discoverPackages(dir).length >= 2;

  const cwd = process.cwd();
  if (isWorkspace(cwd)) return cwd;

  // Walk up from cwd
  let dir = cwd;
  for (let i = 0; i < 6; i++) {
    dir = dirname(dir);
    if (isWorkspace(dir)) return dir;
  }

  // Walk up from __dirname (for when run from tools/standardize/src/)
  dir = __dirname;
  for (let i = 0; i < 8; i++) {
    dir = dirname(dir);
    if (isWorkspace(dir)) return dir;
  }

  return cwd;
}

const HELP = `
  ${ORG_NAME} — Package Standardization Tool

  Usage: stackra-std [command] [flags]

  Commands:
    setup      Full pipeline: fix → update → deps → install → verify (recommended)
    fix        Standardize all config files, scripts, hooks
    audit      Same as fix but read-only — reports issues without writing
    update     Run ncu -u then pin overrides back (eslint, vite)
    deps       Check and install missing devDependencies
    install    Run pnpm install + husky init across packages
    verify     Run build, format:check, typecheck, lint, test
    bump       Bump version, commit, tag, push (triggers publish workflow)
    init       Copy config templates + steering files into a consumer project
    help       Show this help

  Flags:
    --pkg <name>     Only process a single package (directory name)
    --root <path>    Explicit workspace root path
    --dry-run        For deps/bump: report but don't apply
    --minor          For bump: minor version bump (default: patch)
    --major          For bump: major version bump
    --no-steering    For init: skip steering files
    --no-config      For init: skip config templates

  Examples:
    stackra-std setup                  # full pipeline for all packages
    stackra-std setup --pkg cache      # full pipeline for one package
    stackra-std audit                  # check what needs fixing
    stackra-std verify                 # run quality checks only
`;

function main(): void {
  const args = process.argv.slice(2);
  const command = args.find((a) => !a.startsWith("-")) || "setup";
  const pkgIdx = args.indexOf("--pkg");
  const singlePkg = pkgIdx !== -1 ? args[pkgIdx + 1] : null;
  const dryRun = args.includes("--dry-run");

  const root = findWorkspaceRoot(args);

  console.log(
    "╔══════════════════════════════════════════════════════════════╗",
  );
  console.log(
    `║  🔧 ${ORG_NAME} — Package Standardization Tool              ║`,
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════╝",
  );
  console.log(`  Command:   ${command}`);
  console.log(`  Scope:     ${NPM_SCOPE}/*`);
  console.log(`  Workspace: ${root}`);

  if (command === "help") {
    console.log(HELP);
    return;
  }

  const packageNames = singlePkg ? [singlePkg] : discoverPackages(root);
  const packageDirs = packageNames.map((p) => join(root, p));
  console.log(
    `  Packages:  ${packageNames.length} discovered (${packageNames.join(", ")})`,
  );

  switch (command) {
    case "setup":
      setup(packageDirs);
      break;
    case "fix":
      runFixOrAudit(packageDirs, false);
      break;
    case "audit":
      runFixOrAudit(packageDirs, true);
      break;
    case "update":
      update(packageDirs);
      break;
    case "deps":
      deps(packageDirs, dryRun);
      break;
    case "install":
      install(packageDirs);
      break;
    case "verify":
      verify(packageDirs);
      break;
    case "bump":
      bump(packageDirs, args);
      break;
    case "init":
      init(root, {
        pkg: singlePkg || undefined,
        noSteering: args.includes("--no-steering"),
        noConfig: args.includes("--no-config"),
      });
      break;
    default:
      console.log(`\n❌ Unknown command: ${command}`);
      console.log(HELP);
      process.exitCode = 1;
  }
}

main();
