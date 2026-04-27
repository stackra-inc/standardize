/**
 * @fileoverview Init command — Laravel-style asset publishing for @stackra/* packages.
 *
 * Each @stackra/* package can declare publishable assets in its package.json
 * under the "stackra.publish" field. When a consumer runs `init`, the tool
 * discovers all installed packages, reads their publish declarations, and
 * copies the assets into the consumer's project.
 *
 * This is the npm equivalent of Laravel's `php artisan vendor:publish`.
 *
 * ## How packages declare publishable assets
 *
 * In the package's package.json:
 * ```json
 * {
 *   "stackra": {
 *     "publish": {
 *       "config": {
 *         "source": "config/container.config.ts",
 *         "destination": "src/config/container.config.ts",
 *         "description": "Container bootstrap configuration"
 *       },
 *       "steering": {
 *         "source": ".kiro/steering/",
 *         "destination": ".kiro/steering/",
 *         "description": "Kiro AI steering files for DI patterns"
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * ## Usage
 *
 *   npx @stackra/standardize init                    # publish all from all packages
 *   npx @stackra/standardize init --pkg ts-container  # single package
 *   npx @stackra/standardize init --tag config        # only config assets
 *   npx @stackra/standardize init --tag steering      # only steering assets
 *   npx @stackra/standardize init --list              # list what would be published
 *
 * @module @stackra/standardize
 */

import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { NPM_SCOPE } from "../config.js";

// ─── Types ──────────────────────────────────────────────────────────────────

/** A single publishable asset declared by a package. */
interface PublishableAsset {
  /** Tag name (e.g., 'config', 'steering', 'migrations') */
  tag: string;
  /** Source path relative to the package root */
  source: string;
  /** Destination path relative to the consumer project root */
  destination: string;
  /** Human-readable description */
  description: string;
}

/** A discovered package with its publishable assets. */
interface DiscoveredPackage {
  /** Full npm name (e.g., '@stackra/ts-container') */
  name: string;
  /** Absolute path to the package in node_modules */
  dir: string;
  /** Declared publishable assets */
  assets: PublishableAsset[];
}

// ─── Core ───────────────────────────────────────────────────────────────────

/**
 * Copies a file to a destination, creating directories as needed.
 * Never overwrites existing files — returns false if skipped.
 */
function copyIfMissing(src: string, dest: string): boolean {
  if (existsSync(dest)) return false;
  const dir = dirname(dest);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(dest, readFileSync(src, "utf-8"), "utf-8");
  return true;
}

/**
 * Copies a directory of files to a destination, prefixing filenames
 * with the package short name to avoid collisions.
 *
 * @returns Number of files copied
 */
function copyDirIfMissing(
  srcDir: string,
  destDir: string,
  prefix: string,
): { copied: number; skipped: number; details: string[] } {
  const details: string[] = [];
  let copied = 0;
  let skipped = 0;

  if (!existsSync(srcDir)) return { copied, skipped, details };

  const files = readdirSync(srcDir).filter((f) => {
    const full = join(srcDir, f);
    return statSync(full).isFile();
  });

  for (const file of files) {
    const src = join(srcDir, file);
    const destName = prefix ? `${prefix}--${file}` : file;
    const dest = join(destDir, destName);

    if (copyIfMissing(src, dest)) {
      details.push(`    ✅ ${destName} — created`);
      copied++;
    } else {
      details.push(`    ⏭️  ${destName} — already exists`);
      skipped++;
    }
  }

  return { copied, skipped, details };
}

/**
 * Discovers all installed @stackra/* packages and reads their
 * publish declarations from package.json.
 *
 * If a package doesn't have a "stackra.publish" field, the tool
 * falls back to auto-detection: checks for config/ and .kiro/steering/.
 */
function discoverPackages(projectRoot: string): DiscoveredPackage[] {
  const scopeDir = join(projectRoot, "node_modules", NPM_SCOPE);
  if (!existsSync(scopeDir)) return [];

  const packages: DiscoveredPackage[] = [];

  for (const entry of readdirSync(scopeDir)) {
    const pkgDir = join(scopeDir, entry);
    const pkgJsonPath = join(pkgDir, "package.json");
    if (!existsSync(pkgJsonPath)) continue;

    const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf-8"));
    const assets: PublishableAsset[] = [];

    // ── Read declared publish assets ──────────────────────────────────
    const declared = pkg.stackra?.publish;
    if (declared && typeof declared === "object") {
      for (const [tag, asset] of Object.entries(declared)) {
        const a = asset as {
          source?: string;
          destination?: string;
          description?: string;
        };
        if (a.source && a.destination) {
          assets.push({
            tag,
            source: a.source,
            destination: a.destination,
            description: a.description || "",
          });
        }
      }
    }

    // ── Auto-detect if no declarations ────────────────────────────────
    if (assets.length === 0) {
      const configDir = join(pkgDir, "config");
      if (existsSync(configDir)) {
        assets.push({
          tag: "config",
          source: "config/",
          destination: "src/config/",
          description: "Configuration templates",
        });
      }

      const steeringDir = join(pkgDir, ".kiro", "steering");
      if (existsSync(steeringDir)) {
        assets.push({
          tag: "steering",
          source: ".kiro/steering/",
          destination: ".kiro/steering/",
          description: "Kiro AI steering files",
        });
      }
    }

    if (assets.length > 0) {
      packages.push({ name: pkg.name, dir: pkgDir, assets });
    }
  }

  return packages;
}

// ─── Command ────────────────────────────────────────────────────────────────

/**
 * Runs the init command — discovers and publishes assets from @stackra/* packages.
 *
 * @param projectRoot - The consumer project root
 * @param options - Filtering options
 */
export function init(
  projectRoot: string,
  options: { pkg?: string; noSteering?: boolean; noConfig?: boolean } = {},
): void {
  console.log("\n🚀 Publishing @stackra/* package assets...\n");

  const packages = discoverPackages(projectRoot);

  if (packages.length === 0) {
    console.log("  No @stackra/* packages with publishable assets found.");
    console.log("  Install a package first: pnpm add @stackra/ts-container\n");
    console.log("  Packages can declare assets in package.json:");
    console.log("  {");
    console.log('    "stackra": {');
    console.log('      "publish": {');
    console.log('        "config": {');
    console.log('          "source": "config/app.config.ts",');
    console.log('          "destination": "src/config/app.config.ts",');
    console.log('          "description": "Application configuration"');
    console.log("        }");
    console.log("      }");
    console.log("    }");
    console.log("  }");
    return;
  }

  /** Filter by package name if --pkg provided */
  const filtered = options.pkg
    ? packages.filter((p) => p.name.includes(options.pkg!))
    : packages;

  if (filtered.length === 0) {
    console.log(`  No matching package for "${options.pkg}".`);
    console.log(`  Available: ${packages.map((p) => p.name).join(", ")}`);
    return;
  }

  /** Filter by tag based on --no-steering / --no-config flags */
  const skipTags = new Set<string>();
  if (options.noSteering) skipTags.add("steering");
  if (options.noConfig) skipTags.add("config");

  let totalCopied = 0;
  let totalSkipped = 0;

  for (const pkg of filtered) {
    const shortName = pkg.name.replace(`${NPM_SCOPE}/`, "");
    console.log(`  📦 ${pkg.name}`);

    const relevantAssets = pkg.assets.filter((a) => !skipTags.has(a.tag));

    if (relevantAssets.length === 0) {
      console.log("    (all asset tags skipped)\n");
      continue;
    }

    for (const asset of relevantAssets) {
      console.log(`    📋 [${asset.tag}] ${asset.description}`);

      const srcPath = join(pkg.dir, asset.source);

      if (!existsSync(srcPath)) {
        continue;
      }

      /** Resolve {module} placeholder in destination path */
      const resolvedDest = asset.destination.replace("{module}", shortName);

      const isDir = statSync(srcPath).isDirectory();

      if (isDir) {
        /** For directories: copy all files into the resolved destination */
        const destDir = join(projectRoot, resolvedDest);
        const result = copyDirIfMissing(srcPath, destDir, "");
        totalCopied += result.copied;
        totalSkipped += result.skipped;
        for (const d of result.details) console.log(d);
      } else {
        /** For single files, copy directly */
        const dest = join(projectRoot, resolvedDest);
        if (copyIfMissing(srcPath, dest)) {
          console.log(`    ✅ ${resolvedDest} — created`);
          totalCopied++;
        } else {
          console.log(`    ⏭️  ${resolvedDest} — already exists`);
          totalSkipped++;
        }
      }
    }

    console.log("");
  }

  // ── Summary ─────────────────────────────────────────────────────────────

  console.log("─".repeat(50));
  console.log(
    `  Published: ${totalCopied} files created, ${totalSkipped} skipped`,
  );

  if (totalCopied > 0) {
    console.log(
      "\n  💡 Review the published files and adjust for your project.",
    );
    console.log(
      "  Config files are templates — customize them for your environment.",
    );
  }
}
