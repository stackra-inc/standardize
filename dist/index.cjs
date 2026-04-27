#!/usr/bin/env tsx
'use strict';

var path = require('path');
var url = require('url');
var fs = require('fs');
var child_process = require('child_process');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
/**
 * @stackra/standardize v1.0.0
 * Copyright (c) 2026 Stackra L.L.C
 * @license MIT
 */

var NPM_SCOPE = "@stackra";
var ORG_NAME = "Stackra L.L.C";
var DEPENDABOT_ASSIGNEE = "akouta";
var PNPM_VERSION = "10.33.2";
var NODE_MIN_VERSION = "22";
var PNPM_MIN_VERSION = "9.0.0";
var PACKAGE_MANAGER = `pnpm@${PNPM_VERSION}`;
var ENGINES = {
  node: `>=${NODE_MIN_VERSION}`,
  pnpm: `>=${PNPM_MIN_VERSION}`
};
(/* @__PURE__ */ new Date()).getFullYear();
var PNPM_OVERRIDES = {
  /** Pin ESLint to v9 — v10 breaks eslint-plugin-react and other plugins. */
  eslint: "^9.28.0",
  /** Pin Vite to v7 — v8 breaks vitest path resolution with @ aliases. */
  vite: "^7.2.6"
};
function makeExportEntry(name) {
  return {
    types: `./dist/${name}.d.ts`,
    import: `./dist/${name}.js`,
    require: `./dist/${name}.cjs`
  };
}
function detectEntries(tsupConfigPath) {
  if (!fs.existsSync(tsupConfigPath)) return ["index"];
  const content = fs.readFileSync(tsupConfigPath, "utf-8");
  const arrayMatch = content.match(/entry\s*:\s*\[([^\]]+)\]/);
  if (arrayMatch) {
    const entries = arrayMatch[1].split(",").map((e) => e.trim().replace(/['"]/g, "")).map((e) => e.replace(/^src\//, "").replace(/\.tsx?$/, ""));
    return entries.length > 0 ? entries : ["index"];
  }
  const objMatch = content.match(/entry\s*:\s*\{([^}]+)\}/);
  if (objMatch) {
    const entries = objMatch[1].split(",").map((e) => {
      const valMatch = e.match(/['"]([^'"]+)['"]/g);
      return valMatch ? valMatch[valMatch.length - 1].replace(/['"]/g, "") : null;
    }).filter(Boolean).map((e) => e.replace(/^src\//, "").replace(/\.tsx?$/, ""));
    return entries.length > 0 ? entries : ["index"];
  }
  return ["index"];
}
function buildExportsFields(entries) {
  const exportsMap = {};
  for (const entry of entries) {
    const key = entry === "index" ? "." : `./${entry}`;
    exportsMap[key] = makeExportEntry(entry);
  }
  return {
    exports: exportsMap,
    main: "./dist/index.cjs",
    module: "./dist/index.js",
    types: "./dist/index.d.ts"
  };
}
var IGNORED_DIRS = /* @__PURE__ */ new Set([
  "node_modules",
  ".git",
  ".github",
  ".kiro",
  ".ref",
  ".husky",
  "tools",
  "dist",
  "coverage"
]);
function discoverPackages(workspaceRoot) {
  const entries = fs.readdirSync(workspaceRoot);
  const packages = [];
  for (const entry of entries) {
    if (entry.startsWith(".") || IGNORED_DIRS.has(entry)) continue;
    const fullPath = path.join(workspaceRoot, entry);
    if (!fs.statSync(fullPath).isDirectory()) continue;
    const pkgPath = path.join(fullPath, "package.json");
    if (!fs.existsSync(pkgPath)) continue;
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (typeof pkg.name === "string" && pkg.name.startsWith(`${NPM_SCOPE}/`)) {
        packages.push({ dir: entry, name: pkg.name });
      }
    } catch {
    }
  }
  return packages.sort((a, b) => {
    const aOrder = sortOrder(a.dir);
    const bOrder = sortOrder(b.dir);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.dir.localeCompare(b.dir);
  }).map((p) => p.dir);
}
function sortOrder(dirName) {
  if (dirName === "typescript-config") return 0;
  if (dirName.endsWith("-config")) return 1;
  return 2;
}
function classifyPackage(dirName) {
  if (dirName === "typescript-config") return "json-config";
  if (dirName.endsWith("-config")) return "config";
  return "library";
}
function readPkg(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf-8"));
}
function writePkg(dir, pkg) {
  fs.writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify(pkg, null, 2) + "\n",
    "utf-8"
  );
}
function ensureFile(filePath, content, results, pkgDir, checkName, auditOnly, executable = false, createOnly = false) {
  const label = auditOnly ? "would" : "";
  if (!fs.existsSync(filePath)) {
    results.push({
      package: pkgDir,
      check: checkName,
      passed: false,
      message: `Missing \u2014 ${label || "created"}`.trim()
    });
    if (!auditOnly) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, content, "utf-8");
      if (executable) fs.chmodSync(filePath, 493);
    }
    return false;
  }
  if (createOnly) {
    results.push({
      package: pkgDir,
      check: checkName,
      passed: true,
      message: "OK"
    });
    return true;
  }
  const current = fs.readFileSync(filePath, "utf-8");
  if (current.trim() !== content.trim()) {
    results.push({
      package: pkgDir,
      check: checkName,
      passed: false,
      message: `Differs \u2014 ${label || "updated"}`.trim()
    });
    if (!auditOnly) {
      fs.writeFileSync(filePath, content, "utf-8");
      if (executable) fs.chmodSync(filePath, 493);
    }
    return false;
  }
  results.push({
    package: pkgDir,
    check: checkName,
    passed: true,
    message: "OK"
  });
  return true;
}

// src/scripts.ts
var SCRIPTS_LIBRARY = {
  build: "tsup",
  dev: "tsup --watch",
  clean: "rm -rf dist node_modules/.cache",
  typecheck: "tsc --noEmit",
  lint: "eslint . --max-warnings 0",
  "lint:fix": "eslint . --fix",
  format: "prettier --write .",
  "format:check": "prettier --check .",
  test: "vitest run --passWithNoTests",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  prepare: "husky",
  prepublishOnly: "pnpm run build",
  release: "pnpm publish --access public --no-git-checks"
};
var SCRIPTS_CONFIG = {
  build: "tsup",
  dev: "tsup --watch",
  clean: "rm -rf dist node_modules/.cache",
  typecheck: "tsc --noEmit",
  format: "prettier --write .",
  "format:check": "prettier --check .",
  test: "vitest run --passWithNoTests",
  prepare: "husky",
  prepublishOnly: "pnpm run build",
  release: "pnpm publish --access public --no-git-checks"
};
var SCRIPTS_JSON_CONFIG = {
  format: "prettier --write .",
  "format:check": "prettier --check .",
  prepare: "husky",
  release: "pnpm publish --access public --no-git-checks"
};

// src/templates/configs.ts
function tplPrettierConfig(pkg) {
  return `/**
 * @fileoverview Prettier configuration for ${pkg}
 * @module ${pkg}
 * @see https://prettier.io/docs/en/configuration
 */

/** @type {string} */
const config = '${NPM_SCOPE}/prettier-config';

export default config;
`;
}
function tplVitestConfig(pkg) {
  return `/**
 * @fileoverview Vitest configuration for ${pkg}
 * @module ${pkg}
 * @see https://vitest.dev/config/
 */

import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./__tests__/vitest.setup.ts'],
    include: ['__tests__/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.test.tsx', '**/*.config.ts'],
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
`;
}
function tplTsupConfig(pkg) {
  return `/**
 * @fileoverview tsup build configuration for ${pkg}
 * @module ${pkg}
 * @see https://tsup.egoist.dev/
 */

import { basePreset as preset } from '${NPM_SCOPE}/tsup-config';

export default preset;
`;
}

// src/templates/hooks.ts
var TPL_HUSKY_PRE_COMMIT = `#!/usr/bin/env sh
npx lint-staged
`;
var TPL_HUSKY_COMMIT_MSG = `#!/usr/bin/env sh
npx commitlint --edit $1
`;
var TPL_COMMITLINT = `/**
 * @fileoverview Commitlint \u2014 conventional commit enforcement
 * @see https://commitlint.js.org/
 */

import type { UserConfig } from '@commitlint/types';

const config: UserConfig = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'subject-full-stop': [2, 'never', '.'],
    'subject-empty': [2, 'never'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100],
    'footer-max-line-length': [2, 'always', 100],
  },
};

export default config;
`;
var TPL_LINTSTAGED = `/**
 * @fileoverview lint-staged \u2014 runs linters on staged files only
 * @see https://github.com/lint-staged/lint-staged
 */

export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix --no-error-on-unmatched-pattern', 'prettier --write'],
  '*.{json,md,mdx,css,html,yml,yaml,scss}': ['prettier --write'],
};
`;
var TPL_LINTSTAGED_JSON_CONFIG = `/**
 * @fileoverview lint-staged \u2014 runs prettier on staged files only
 * @see https://github.com/lint-staged/lint-staged
 */

export default {
  '*.{json,md,mdx,css,html,yml,yaml,ts}': ['prettier --write'],
};
`;

// src/templates/scaffolding.ts
var TPL_GITIGNORE = `dist/
*.tsbuildinfo
node_modules/
.idea/
.vscode/
*.swp
*.swo
.DS_Store
Thumbs.db
coverage/
*.log
npm-debug.log*
`;
var TPL_PRETTIERIGNORE = `dist/
node_modules/
coverage/
pnpm-lock.yaml
CHANGELOG.md
`;
var TPL_VITEST_SETUP = `/**
 * @fileoverview Vitest global setup \u2014 runs before every test file.
 * @see https://vitest.dev/config/#setupfiles
 */
`;
var TPL_VITEST_SETUP_DTS = `/// <reference types="vitest/globals" />
`;

// src/templates/ci.ts
var TPL_DEPENDABOT = `version: 2

updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: daily
    open-pull-requests-limit: 10
    assignees:
      - ${DEPENDABOT_ASSIGNEE}
    groups:
      stackra:
        patterns:
          - "${NPM_SCOPE}/*"
      dev-dependencies:
        dependency-type: development
        exclude-patterns:
          - "${NPM_SCOPE}/*"
      production-dependencies:
        dependency-type: production
        exclude-patterns:
          - "${NPM_SCOPE}/*"

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 5
    groups:
      github-actions:
        patterns:
          - "*"
`;
var TPL_AUTO_MERGE = `name: Dependabot Updates

on: pull_request

permissions:
  contents: write
  pull-requests: write

jobs:
  auto-merge:
    name: \u{1F916} Auto-merge ${NPM_SCOPE}/* updates
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - name: \u{1F4CB} Fetch Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v2
        with:
          github-token: \${{ secrets.GITHUB_TOKEN }}

      - name: \u2705 Approve & auto-merge
        if: contains(steps.metadata.outputs.dependency-names, '${NPM_SCOPE}/')
        run: |
          gh pr review "$PR_URL" --approve
          gh pr merge "$PR_URL" --auto --squash
        env:
          PR_URL: \${{ github.event.pull_request.html_url }}
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;

// src/templates/workflows.ts
var TPL_SETUP_ACTION = `name: Setup
description: Setup Node.js, pnpm, and install dependencies

inputs:
  node-version:
    description: Node.js version to use
    required: false
    default: "22"

runs:
  using: composite
  steps:
    - name: \u{1F4E6} Setup pnpm
      uses: pnpm/action-setup@v5

    - name: \u{1F7E2} Setup Node.js \${{ inputs.node-version }}
      uses: actions/setup-node@v5
      with:
        node-version: \${{ inputs.node-version }}
        cache: pnpm
        cache-dependency-path: pnpm-lock.yaml

    - name: \u{1F4E5} Install dependencies
      shell: bash
      run: pnpm install --no-frozen-lockfile
`;
function tplCiWorkflow(packageName, hasLint, hasTypecheck, hasTest) {
  const jobs = [];
  jobs.push(`  build:
    name: \u{1F528} Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: ./.github/actions/setup
      - run: pnpm build
      - uses: actions/upload-artifact@v7
        with:
          name: dist-\${{ github.sha }}
          path: dist/
          retention-days: 3`);
  if (hasTypecheck) {
    jobs.push(`  typecheck:
    name: \u{1F537} Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: ./.github/actions/setup
      - run: pnpm typecheck`);
  }
  jobs.push(`  format:
    name: \u{1F3A8} Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: ./.github/actions/setup
      - run: pnpm format:check`);
  if (hasLint) {
    jobs.push(`  lint:
    name: \u{1F50D} Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: ./.github/actions/setup
      - run: pnpm lint`);
  }
  if (hasTest) {
    jobs.push(`  test:
    name: \u{1F9EA} Test
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v5
      - uses: ./.github/actions/setup
      - run: pnpm test`);
  }
  return `name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

concurrency:
  group: ci-\${{ github.ref }}
  cancel-in-progress: true

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
${jobs.join("\n\n")}
`;
}
function tplPublishWorkflow(packageName, repoSlug) {
  return `name: Publish

on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'
      - 'v[0-9]+.[0-9]+.[0-9]+-*'
  workflow_dispatch:
    inputs:
      dry_run:
        description: 'Dry run \u2014 skip npm publish and GitHub Release'
        required: false
        default: 'false'
        type: choice
        options: ['false', 'true']

concurrency:
  group: publish-\${{ github.ref }}
  cancel-in-progress: false

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
  validate:
    name: \u2705 Validate
    runs-on: ubuntu-latest
    outputs:
      version: \${{ steps.pkg.outputs.version }}
      tag: \${{ steps.tag.outputs.tag }}
      is_prerelease: \${{ steps.tag.outputs.is_prerelease }}
    steps:
      - uses: actions/checkout@v5

      - name: \u{1F4CB} Read package version
        id: pkg
        run: echo "version=$(node -p \\"require('./package.json').version\\")" >> $GITHUB_OUTPUT

      - name: \u{1F3F7}\uFE0F Parse tag
        id: tag
        run: |
          TAG="\${GITHUB_REF_NAME:-v\${{ steps.pkg.outputs.version }}}"
          echo "tag=\${TAG}" >> $GITHUB_OUTPUT
          if [[ "$TAG" =~ ^v[0-9]+\\.[0-9]+\\.[0-9]+-.+ ]]; then
            echo "is_prerelease=true" >> $GITHUB_OUTPUT
          else
            echo "is_prerelease=false" >> $GITHUB_OUTPUT
          fi

      - name: \u{1F50D} Verify tag matches package version
        if: startsWith(github.ref, 'refs/tags/')
        run: |
          PKG_VERSION="\${{ steps.pkg.outputs.version }}"
          TAG_VERSION="\${{ steps.tag.outputs.tag }}"
          EXPECTED="v\${PKG_VERSION}"
          if [ "$TAG_VERSION" != "$EXPECTED" ]; then
            echo "\u274C Tag '$TAG_VERSION' does not match package.json version '$EXPECTED'"
            exit 1
          fi

  quality:
    name: \u{1F52C} Quality Gate
    runs-on: ubuntu-latest
    needs: validate
    steps:
      - uses: actions/checkout@v5
      - uses: ./.github/actions/setup
      - run: pnpm build
      - run: pnpm format:check
      - uses: actions/upload-artifact@v7
        with:
          name: dist-publish-\${{ github.sha }}
          path: dist/
          retention-days: 7

  publish:
    name: \u{1F680} Publish to npm
    runs-on: ubuntu-latest
    needs: [validate, quality]
    if: \${{ github.event.inputs.dry_run != 'true' }}
    permissions:
      contents: read
      id-token: write
    environment:
      name: npm
      url: https://www.npmjs.com/package/${packageName}
    steps:
      - uses: actions/checkout@v5
      - uses: ./.github/actions/setup

      - uses: actions/download-artifact@v4
        with:
          name: dist-publish-\${{ github.sha }}
          path: dist/

      - uses: actions/setup-node@v5
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'

      - name: \u{1F50D} Check if version already published
        id: check_version
        run: |
          PKG_NAME=$(node -p "require('./package.json').name")
          PKG_VERSION=$(node -p "require('./package.json').version")
          if npm view "\${PKG_NAME}@\${PKG_VERSION}" version 2>/dev/null; then
            echo "exists=true" >> $GITHUB_OUTPUT
          else
            echo "exists=false" >> $GITHUB_OUTPUT
          fi
        env:
          NODE_AUTH_TOKEN: \${{ secrets.STACKRA_NPM_TOKEN }}

      - name: \u{1F680} Publish
        if: steps.check_version.outputs.exists == 'false'
        run: pnpm publish --access public --no-git-checks --provenance
        env:
          NODE_AUTH_TOKEN: \${{ secrets.STACKRA_NPM_TOKEN }}

  release:
    name: \u{1F4E6} GitHub Release
    runs-on: ubuntu-latest
    needs: [validate, publish]
    if: \${{ github.event.inputs.dry_run != 'true' && startsWith(github.ref, 'refs/tags/') }}
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0

      - name: \u{1F4DD} Extract changelog
        id: changelog
        run: |
          VERSION="\${{ needs.validate.outputs.version }}"
          awk "/^## \${VERSION}|^## \\\\[\${VERSION}\\\\]/{found=1; next} found && /^## /{exit} found{print}" CHANGELOG.md \\
            | sed '/^[[:space:]]*$/d' > release_body.md
          if [ ! -s release_body.md ]; then echo "Release v\${VERSION}" > release_body.md; fi

      - uses: softprops/action-gh-release@v3
        with:
          tag_name: \${{ needs.validate.outputs.tag }}
          name: '\${{ needs.validate.outputs.tag }}'
          body_path: release_body.md
          draft: false
          prerelease: \${{ needs.validate.outputs.is_prerelease == 'true' }}
          make_latest: \${{ needs.validate.outputs.is_prerelease == 'false' }}
`;
}

// src/templates/banner.ts
function generateBannerSvg(packageName, description) {
  const shortName = packageName.replace(`${NPM_SCOPE}/`, "");
  const desc = description.length > 80 ? description.slice(0, 77) + "..." : description;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="280" viewBox="0 0 900 280">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3178c6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#818cf8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#c084fc;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#38bdf8;stop-opacity:1" />
      <stop offset="60%" style="stop-color:#818cf8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#c084fc;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#3178c6;stop-opacity:0.15" />
      <stop offset="100%" style="stop-color:#3178c6;stop-opacity:0" />
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="900" height="280" fill="url(#bg)" rx="12" />

  <!-- Grid pattern -->
  <g opacity="0.04" stroke="#94a3b8" stroke-width="0.5">
    <line x1="0" y1="70" x2="900" y2="70" />
    <line x1="0" y1="140" x2="900" y2="140" />
    <line x1="0" y1="210" x2="900" y2="210" />
    <line x1="225" y1="0" x2="225" y2="280" />
    <line x1="450" y1="0" x2="450" y2="280" />
    <line x1="675" y1="0" x2="675" y2="280" />
  </g>

  <!-- Top accent line -->
  <rect x="0" y="0" width="900" height="3" fill="url(#accent)" rx="2" />
  <!-- Bottom accent line -->
  <rect x="0" y="277" width="900" height="3" fill="url(#accent)" rx="2" />

  <!-- Glow -->
  <circle cx="450" cy="140" r="200" fill="url(#glow)" />

  <!-- Scope -->
  <text x="450" y="100" text-anchor="middle" font-family="'Courier New', monospace" font-size="16" fill="#60a5fa" opacity="0.8" letter-spacing="3">${NPM_SCOPE}</text>

  <!-- Package name -->
  <text x="450" y="150" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="48" font-weight="700" fill="url(#textGrad)">${shortName}</text>

  <!-- Underline -->
  <rect x="300" y="162" width="300" height="3" rx="2" fill="url(#accent)" opacity="0.6" />

  <!-- Description -->
  <text x="450" y="200" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="14" fill="#94a3b8">${desc}</text>

  <!-- Footer -->
  <text x="450" y="250" text-anchor="middle" font-family="'Courier New', monospace" font-size="11" fill="#475569" letter-spacing="1">${ORG_NAME}</text>
</svg>`;
}

// src/commands/fix.ts
var __filename$1 = url.fileURLToPath((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('index.cjs', document.baseURI).href)));
var __dirname$1 = path.dirname(__filename$1);
function standardize(packageDir, auditOnly) {
  const results = [];
  const dirName = path.basename(packageDir);
  const pkgType = classifyPackage(dirName);
  const pkg = readPkg(packageDir);
  const name = pkg.name;
  console.log(`
\u{1F4E6} ${name} (${dirName}) \u2014 ${pkgType}`);
  console.log("\u2500".repeat(60));
  let changed = false;
  const stdScripts = pkgType === "library" ? SCRIPTS_LIBRARY : pkgType === "config" ? SCRIPTS_CONFIG : SCRIPTS_JSON_CONFIG;
  if (!pkg.scripts) pkg.scripts = {};
  for (const [key, val] of Object.entries(stdScripts)) {
    if (pkg.scripts[key] !== val) {
      const was = pkg.scripts[key] ?? "(missing)";
      results.push({
        package: dirName,
        check: `scripts.${key}`,
        passed: false,
        message: auditOnly ? `Expected "${val}", got "${was}"` : `"${was}" \u2192 "${val}"`
      });
      if (!auditOnly) {
        pkg.scripts[key] = val;
        changed = true;
      }
    }
  }
  if (!pkg.engines) pkg.engines = {};
  for (const [key, val] of Object.entries(ENGINES)) {
    if (pkg.engines[key] !== val) {
      results.push({
        package: dirName,
        check: `engines.${key}`,
        passed: false,
        message: auditOnly ? `Expected "${val}"` : `\u2192 "${val}"`
      });
      if (!auditOnly) {
        pkg.engines[key] = val;
        changed = true;
      }
    }
  }
  if (pkg.packageManager !== PACKAGE_MANAGER) {
    results.push({
      package: dirName,
      check: "packageManager",
      passed: false,
      message: auditOnly ? `Expected "${PACKAGE_MANAGER}"` : `\u2192 "${PACKAGE_MANAGER}"`
    });
    if (!auditOnly) {
      pkg.packageManager = PACKAGE_MANAGER;
      changed = true;
    }
  }
  const currentOverrides = pkg.pnpm?.overrides ?? {};
  for (const [dep, ver] of Object.entries(PNPM_OVERRIDES)) {
    if (currentOverrides[dep] !== ver) {
      results.push({
        package: dirName,
        check: `pnpm.overrides.${dep}`,
        passed: false,
        message: auditOnly ? `Expected "${ver}"` : `\u2192 "${ver}"`
      });
      if (!auditOnly) {
        if (!pkg.pnpm) pkg.pnpm = {};
        if (!pkg.pnpm.overrides) pkg.pnpm.overrides = {};
        pkg.pnpm.overrides[dep] = ver;
        changed = true;
      }
    }
  }
  if (pkgType !== "json-config") {
    const entries = detectEntries(path.join(packageDir, "tsup.config.ts"));
    const std = buildExportsFields(entries);
    if (JSON.stringify(pkg.exports || {}) !== JSON.stringify(std.exports)) {
      results.push({
        package: dirName,
        check: "exports",
        passed: false,
        message: auditOnly ? "Exports mismatch" : "Fixed exports"
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
        message: auditOnly ? `Expected "${std.main}"` : `\u2192 "${std.main}"`
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
        message: auditOnly ? `Expected "${std.module}"` : `\u2192 "${std.module}"`
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
        message: auditOnly ? `Expected "${std.types}"` : `\u2192 "${std.types}"`
      });
      if (!auditOnly) {
        pkg.types = std.types;
        changed = true;
      }
    }
  }
  if (changed && !auditOnly) writePkg(packageDir, pkg);
  if (pkgType !== "json-config") {
    ensureFile(
      path.join(packageDir, ".prettierrc.mjs"),
      tplPrettierConfig(name),
      results,
      dirName,
      ".prettierrc.mjs",
      auditOnly
    );
    ensureFile(
      path.join(packageDir, "vitest.config.ts"),
      tplVitestConfig(name),
      results,
      dirName,
      "vitest.config.ts",
      auditOnly
    );
  }
  if (pkgType === "library") {
    ensureFile(
      path.join(packageDir, "tsup.config.ts"),
      tplTsupConfig(name),
      results,
      dirName,
      "tsup.config.ts",
      auditOnly
    );
  }
  ensureFile(
    path.join(packageDir, ".husky", "pre-commit"),
    TPL_HUSKY_PRE_COMMIT,
    results,
    dirName,
    ".husky/pre-commit",
    auditOnly,
    true
  );
  ensureFile(
    path.join(packageDir, ".husky", "commit-msg"),
    TPL_HUSKY_COMMIT_MSG,
    results,
    dirName,
    ".husky/commit-msg",
    auditOnly,
    true
  );
  ensureFile(
    path.join(packageDir, "commitlint.config.ts"),
    TPL_COMMITLINT,
    results,
    dirName,
    "commitlint.config.ts",
    auditOnly
  );
  ensureFile(
    path.join(packageDir, ".lintstagedrc.mjs"),
    pkgType === "json-config" ? TPL_LINTSTAGED_JSON_CONFIG : TPL_LINTSTAGED,
    results,
    dirName,
    ".lintstagedrc.mjs",
    auditOnly
  );
  ensureFile(
    path.join(packageDir, ".gitignore"),
    TPL_GITIGNORE,
    results,
    dirName,
    ".gitignore",
    auditOnly
  );
  ensureFile(
    path.join(packageDir, ".prettierignore"),
    TPL_PRETTIERIGNORE,
    results,
    dirName,
    ".prettierignore",
    auditOnly
  );
  if (pkgType !== "json-config") {
    ensureFile(
      path.join(packageDir, "__tests__", "vitest.setup.ts"),
      TPL_VITEST_SETUP,
      results,
      dirName,
      "__tests__/vitest.setup.ts",
      auditOnly
    );
    ensureFile(
      path.join(packageDir, "__tests__", "setup.d.ts"),
      TPL_VITEST_SETUP_DTS,
      results,
      dirName,
      "__tests__/setup.d.ts",
      auditOnly
    );
  }
  ensureFile(
    path.join(packageDir, ".github", "dependabot.yml"),
    TPL_DEPENDABOT,
    results,
    dirName,
    ".github/dependabot.yml",
    auditOnly
  );
  ensureFile(
    path.join(packageDir, ".github", "workflows", "dependabot-auto-merge.yml"),
    TPL_AUTO_MERGE,
    results,
    dirName,
    ".github/workflows/dependabot-auto-merge.yml",
    auditOnly
  );
  ensureFile(
    path.join(packageDir, ".github", "actions", "setup", "action.yml"),
    TPL_SETUP_ACTION,
    results,
    dirName,
    ".github/actions/setup/action.yml",
    auditOnly
  );
  const bannerPath = path.join(packageDir, ".github", "assets", "banner.svg");
  if (!fs.existsSync(bannerPath)) {
    const desc = pkg.description || "";
    const bannerContent = generateBannerSvg(name, desc);
    ensureFile(
      bannerPath,
      bannerContent,
      results,
      dirName,
      ".github/assets/banner.svg",
      auditOnly
    );
  }
  const ciPath = path.join(packageDir, ".github", "workflows", "ci.yml");
  if (!fs.existsSync(ciPath)) {
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
      auditOnly
    );
  }
  const publishPath = path.join(packageDir, ".github", "workflows", "publish.yml");
  if (!fs.existsSync(publishPath)) {
    const publishContent = tplPublishWorkflow(name);
    ensureFile(
      publishPath,
      publishContent,
      results,
      dirName,
      ".github/workflows/publish.yml",
      auditOnly
    );
  }
  const steeringSource = path.resolve(__dirname$1, "..", "..", "steering");
  if (fs.existsSync(steeringSource)) {
    const steeringFiles = fs.readdirSync(steeringSource).filter(
      (f) => f.endsWith(".md")
    );
    for (const file of steeringFiles) {
      const content = fs.readFileSync(path.join(steeringSource, file), "utf-8");
      ensureFile(
        path.join(packageDir, ".kiro", "steering", file),
        content,
        results,
        dirName,
        `.kiro/steering/${file}`,
        auditOnly,
        false,
        true
        // createOnly — don't overwrite if prettier reformatted
      );
    }
  }
  return results;
}
function runFixOrAudit(packageDirs, auditOnly) {
  const allResults = [];
  for (const dir of packageDirs) {
    if (!fs.existsSync(path.join(dir, "package.json"))) {
      console.log(`
\u26A0\uFE0F  Skipping ${path.basename(dir)}`);
      continue;
    }
    allResults.push(...standardize(dir, auditOnly));
  }
  const passed = allResults.filter((r) => r.passed).length;
  const failed = allResults.filter((r) => !r.passed).length;
  console.log("\n");
  console.log(
    "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557"
  );
  console.log("\u2551                        \u{1F4CA} Summary                          \u2551");
  console.log(
    "\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D"
  );
  console.log(`  Total: ${allResults.length}  \u2705 ${passed}  \u274C ${failed}`);
  if (failed > 0) {
    const grouped = /* @__PURE__ */ new Map();
    for (const r of allResults.filter((r2) => !r2.passed)) {
      if (!grouped.has(r.package)) grouped.set(r.package, []);
      grouped.get(r.package).push(r);
    }
    for (const [pkg, checks] of grouped) {
      console.log(`
  \u{1F4E6} ${pkg}:`);
      for (const c of checks) console.log(`    \u274C ${c.check}: ${c.message}`);
    }
  }
  if (auditOnly && failed > 0)
    console.log('\n\u{1F4A1} Run "fix" to apply automatically.');
  if (!auditOnly && failed > 0) {
    console.log("\n\u{1F3A8} Formatting fixed files...");
    for (const dir of packageDirs) {
      if (!fs.existsSync(path.join(dir, "package.json"))) continue;
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf-8"));
      if (pkg.scripts?.format) {
        try {
          child_process.execSync("pnpm format", { cwd: dir, stdio: "pipe", timeout: 3e4 });
        } catch {
        }
      }
    }
    console.log("\u2705 All issues fixed and formatted.");
  }
  if (failed === 0) console.log("\n\u{1F389} All packages are standardized!");
}
var STEPS = ["build", "format:check", "typecheck", "lint", "test"];
function runStep(packageDir, script) {
  const dirName = path.basename(packageDir);
  const pkg = JSON.parse(
    fs.readFileSync(path.join(packageDir, "package.json"), "utf-8")
  );
  if (!pkg.scripts?.[script]) {
    return {
      package: dirName,
      step: script,
      passed: true,
      output: "skipped (no script)"
    };
  }
  try {
    const output = child_process.execSync(`pnpm ${script}`, {
      cwd: packageDir,
      stdio: "pipe",
      timeout: 12e4,
      encoding: "utf-8"
    });
    return {
      package: dirName,
      step: script,
      passed: true,
      output: output.slice(-200)
    };
  } catch (err) {
    const error = err;
    const output = (error.stderr || error.stdout || "Unknown error").slice(
      -500
    );
    return { package: dirName, step: script, passed: false, output };
  }
}
function verify(packageDirs) {
  console.log("\n\u{1F50D} Running quality pipeline...\n");
  const allResults = [];
  const failures = [];
  for (const dir of packageDirs) {
    const dirName = path.basename(dir);
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf-8"));
    console.log(`\u{1F4E6} ${pkg.name} (${dirName})`);
    for (const step of STEPS) {
      process.stdout.write(`  ${step.padEnd(16)}`);
      const result = runStep(dir, step);
      allResults.push(result);
      if (result.output === "skipped (no script)") {
        console.log("\u23ED\uFE0F  skipped");
      } else if (result.passed) {
        console.log("\u2705 pass");
      } else {
        console.log("\u274C FAIL");
        failures.push(result);
      }
    }
    console.log("");
  }
  const passed = allResults.filter((r) => r.passed).length;
  const failed = failures.length;
  console.log(
    "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557"
  );
  console.log("\u2551                   \u{1F50D} Verify Summary                        \u2551");
  console.log(
    "\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D"
  );
  console.log(`  Total: ${allResults.length}  \u2705 ${passed}  \u274C ${failed}`);
  if (failed > 0) {
    console.log("\nFailures:\n");
    for (const f of failures) {
      console.log(`  \u{1F4E6} ${f.package} \u2192 ${f.step}`);
      const lines = f.output.trim().split("\n").slice(-8);
      for (const line of lines) {
        console.log(`     ${line}`);
      }
      console.log("");
    }
    process.exitCode = 1;
  } else {
    console.log("\n\u{1F389} All packages pass the quality pipeline!");
  }
}
function install(packageDirs) {
  console.log("\n\u{1F4E6} Installing dependencies...\n");
  for (const dir of packageDirs) {
    path.basename(dir);
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf-8"));
    process.stdout.write(`  ${pkg.name.padEnd(35)}`);
    try {
      child_process.execSync("pnpm install --ignore-scripts", {
        cwd: dir,
        stdio: "pipe",
        timeout: 12e4,
        encoding: "utf-8"
      });
      child_process.execSync("npx husky", {
        cwd: dir,
        stdio: "pipe",
        timeout: 1e4,
        encoding: "utf-8"
      });
      console.log("\u2705");
    } catch (err) {
      const error = err;
      console.log("\u274C");
      const lines = (error.stderr || "Unknown error").trim().split("\n").slice(-3);
      for (const line of lines) console.log(`    ${line}`);
    }
  }
  console.log("\n\u2705 Install complete.");
}
var REQUIRED_DEV_DEPS = {
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
    "@commitlint/types"
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
    "@commitlint/types"
  ],
  /** JSON-config only needs prettier + hooks tooling (no build/test). */
  "json-config": [
    "prettier",
    "husky",
    "lint-staged",
    "@commitlint/cli",
    "@commitlint/config-conventional",
    "@commitlint/types"
  ]
};
function classify(dirName) {
  if (dirName === "typescript-config") return "json-config";
  if (dirName.endsWith("-config")) return "config";
  return "library";
}
function deps(packageDirs, dryRun = false) {
  console.log(
    `
\u{1F4CB} Checking required devDependencies... ${dryRun ? "(dry run)" : ""}
`
  );
  let totalMissing = 0;
  for (const dir of packageDirs) {
    const dirName = path.basename(dir);
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf-8"));
    const pkgType = classify(dirName);
    const required = REQUIRED_DEV_DEPS[pkgType] || [];
    const devDeps = {
      ...pkg.dependencies || {},
      ...pkg.devDependencies || {}
    };
    const missing = required.filter((dep) => !devDeps[dep]);
    if (missing.length === 0) {
      console.log(`  \u{1F4E6} ${pkg.name.padEnd(35)} \u2705 all deps present`);
      continue;
    }
    totalMissing += missing.length;
    console.log(`  \u{1F4E6} ${pkg.name.padEnd(35)} \u274C missing ${missing.length}:`);
    for (const dep of missing) {
      console.log(`      + ${dep}`);
    }
    if (!dryRun) {
      try {
        const depList = missing.join(" ");
        child_process.execSync(`pnpm add -D ${depList} --ignore-scripts`, {
          cwd: dir,
          stdio: "pipe",
          timeout: 12e4,
          encoding: "utf-8"
        });
        console.log(`      \u2705 installed`);
      } catch (err) {
        const error = err;
        console.log(`      \u274C install failed`);
        const lines = (error.stderr || "").trim().split("\n").slice(-3);
        for (const line of lines) console.log(`      ${line}`);
      }
    }
    console.log("");
  }
  if (totalMissing === 0) {
    console.log("\n\u{1F389} All packages have their required devDependencies!");
  } else if (dryRun) {
    console.log(
      `
\u{1F4A1} ${totalMissing} missing deps found. Run without --dry-run to install.`
    );
  } else {
    console.log(`
\u2705 Installed ${totalMissing} missing dependencies.`);
  }
}
function update(packageDirs) {
  console.log("\n\u2B06\uFE0F  Updating dependencies...\n");
  for (const dir of packageDirs) {
    const pkgPath = path.join(dir, "package.json");
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    path.basename(dir);
    process.stdout.write(`  \u{1F4E6} ${pkg.name.padEnd(35)}`);
    try {
      const output = child_process.execSync("ncu -u", {
        cwd: dir,
        stdio: "pipe",
        timeout: 6e4,
        encoding: "utf-8"
      });
      const upgraded = output.match(/→/g)?.length || 0;
      if (upgraded > 0) {
        process.stdout.write(`\u2B06\uFE0F  ${upgraded} upgraded`);
      } else {
        process.stdout.write("\u2705 up to date");
      }
    } catch {
      process.stdout.write("\u26A0\uFE0F  ncu failed (is it installed?)");
      console.log("");
      continue;
    }
    const updated = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    let pinned = 0;
    for (const [dep, ver] of Object.entries(PNPM_OVERRIDES)) {
      if (updated.devDependencies?.[dep]) {
        const current = updated.devDependencies[dep];
        if (current !== ver) {
          updated.devDependencies[dep] = ver;
          pinned++;
        }
      }
    }
    if (pinned > 0) {
      fs.writeFileSync(pkgPath, JSON.stringify(updated, null, 2) + "\n", "utf-8");
      process.stdout.write(` (pinned ${pinned} overrides)`);
    }
    console.log("");
  }
  console.log('\n\u2705 Update complete. Run "install" to apply.');
}

// src/commands/setup.ts
function setup(packageDirs) {
  console.log("\n\u{1F680} Running full setup pipeline...");
  console.log("\u2550".repeat(60));
  console.log("\n\u{1F4CB} Step 1/5: Fix (standardize configs)");
  console.log("\u2500".repeat(40));
  runFixOrAudit(packageDirs, false);
  console.log("\n\u{1F4CB} Step 2/5: Update (ncu -u + pin overrides)");
  console.log("\u2500".repeat(40));
  update(packageDirs);
  console.log("\n\u{1F4CB} Step 3/5: Deps (install missing devDependencies)");
  console.log("\u2500".repeat(40));
  deps(packageDirs, false);
  console.log("\n\u{1F4CB} Step 4/5: Install (pnpm install + husky)");
  console.log("\u2500".repeat(40));
  install(packageDirs);
  console.log("\n\u{1F4CB} Step 5/5: Verify (build, format, typecheck, lint, test)");
  console.log("\u2500".repeat(40));
  verify(packageDirs);
  console.log("\n\u2550".repeat(60));
  console.log("\u{1F3C1} Setup complete.");
}
function copyIfMissing(src, dest) {
  if (fs.existsSync(dest)) return false;
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dest, fs.readFileSync(src, "utf-8"), "utf-8");
  return true;
}
function copyDirIfMissing(srcDir, destDir, prefix) {
  const details = [];
  let copied = 0;
  let skipped = 0;
  if (!fs.existsSync(srcDir)) return { copied, skipped, details };
  const files = fs.readdirSync(srcDir).filter((f) => {
    const full = path.join(srcDir, f);
    return fs.statSync(full).isFile();
  });
  for (const file of files) {
    const src = path.join(srcDir, file);
    const destName = file;
    const dest = path.join(destDir, destName);
    if (copyIfMissing(src, dest)) {
      details.push(`    \u2705 ${destName} \u2014 created`);
      copied++;
    } else {
      details.push(`    \u23ED\uFE0F  ${destName} \u2014 already exists`);
      skipped++;
    }
  }
  return { copied, skipped, details };
}
function discoverPackages2(projectRoot) {
  const scopeDir = path.join(projectRoot, "node_modules", NPM_SCOPE);
  if (!fs.existsSync(scopeDir)) return [];
  const packages = [];
  for (const entry of fs.readdirSync(scopeDir)) {
    const pkgDir = path.join(scopeDir, entry);
    const pkgJsonPath = path.join(pkgDir, "package.json");
    if (!fs.existsSync(pkgJsonPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    const assets = [];
    const declared = pkg.stackra?.publish;
    if (declared && typeof declared === "object") {
      for (const [tag, asset] of Object.entries(declared)) {
        const a = asset;
        if (a.source && a.destination) {
          assets.push({
            tag,
            source: a.source,
            destination: a.destination,
            description: a.description || ""
          });
        }
      }
    }
    if (assets.length === 0) {
      const configDir = path.join(pkgDir, "config");
      if (fs.existsSync(configDir)) {
        assets.push({
          tag: "config",
          source: "config/",
          destination: "src/config/",
          description: "Configuration templates"
        });
      }
      const steeringDir = path.join(pkgDir, ".kiro", "steering");
      if (fs.existsSync(steeringDir)) {
        assets.push({
          tag: "steering",
          source: ".kiro/steering/",
          destination: ".kiro/steering/",
          description: "Kiro AI steering files"
        });
      }
    }
    if (assets.length > 0) {
      packages.push({ name: pkg.name, dir: pkgDir, assets });
    }
  }
  return packages;
}
function init(projectRoot, options = {}) {
  console.log("\n\u{1F680} Publishing @stackra/* package assets...\n");
  const packages = discoverPackages2(projectRoot);
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
  const filtered = options.pkg ? packages.filter((p) => p.name.includes(options.pkg)) : packages;
  if (filtered.length === 0) {
    console.log(`  No matching package for "${options.pkg}".`);
    console.log(`  Available: ${packages.map((p) => p.name).join(", ")}`);
    return;
  }
  const skipTags = /* @__PURE__ */ new Set();
  if (options.noSteering) skipTags.add("steering");
  if (options.noConfig) skipTags.add("config");
  let totalCopied = 0;
  let totalSkipped = 0;
  for (const pkg of filtered) {
    const shortName = pkg.name.replace(`${NPM_SCOPE}/`, "");
    console.log(`  \u{1F4E6} ${pkg.name}`);
    const relevantAssets = pkg.assets.filter((a) => !skipTags.has(a.tag));
    if (relevantAssets.length === 0) {
      console.log("    (all asset tags skipped)\n");
      continue;
    }
    for (const asset of relevantAssets) {
      console.log(`    \u{1F4CB} [${asset.tag}] ${asset.description}`);
      const srcPath = path.join(pkg.dir, asset.source);
      if (!fs.existsSync(srcPath)) {
        continue;
      }
      const resolvedDest = asset.destination.replace("{module}", shortName);
      const isDir = fs.statSync(srcPath).isDirectory();
      if (isDir) {
        const destDir = path.join(projectRoot, resolvedDest);
        const result = copyDirIfMissing(srcPath, destDir);
        totalCopied += result.copied;
        totalSkipped += result.skipped;
        for (const d of result.details) console.log(d);
      } else {
        const dest = path.join(projectRoot, resolvedDest);
        if (copyIfMissing(srcPath, dest)) {
          console.log(`    \u2705 ${resolvedDest} \u2014 created`);
          totalCopied++;
        } else {
          console.log(`    \u23ED\uFE0F  ${resolvedDest} \u2014 already exists`);
          totalSkipped++;
        }
      }
    }
    console.log("");
  }
  console.log("\u2500".repeat(50));
  console.log(
    `  Published: ${totalCopied} files created, ${totalSkipped} skipped`
  );
  if (totalCopied > 0) {
    console.log(
      "\n  \u{1F4A1} Review the published files and adjust for your project."
    );
    console.log(
      "  Config files are templates \u2014 customize them for your environment."
    );
  }
}

// src/index.ts
var __filename2 = url.fileURLToPath((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('index.cjs', document.baseURI).href)));
var __dirname2 = path.dirname(__filename2);
function findWorkspaceRoot(args) {
  const rootIdx = args.indexOf("--root");
  if (rootIdx !== -1 && args[rootIdx + 1]) return path.resolve(args[rootIdx + 1]);
  const isWorkspace = (dir2) => discoverPackages(dir2).length >= 2;
  const cwd = process.cwd();
  if (isWorkspace(cwd)) return cwd;
  let dir = cwd;
  for (let i = 0; i < 6; i++) {
    dir = path.dirname(dir);
    if (isWorkspace(dir)) return dir;
  }
  dir = __dirname2;
  for (let i = 0; i < 8; i++) {
    dir = path.dirname(dir);
    if (isWorkspace(dir)) return dir;
  }
  return cwd;
}
var HELP = `
  ${ORG_NAME} \u2014 Package Standardization Tool

  Usage: stackra-std [command] [flags]

  Commands:
    setup      Full pipeline: fix \u2192 update \u2192 deps \u2192 install \u2192 verify (recommended)
    fix        Standardize all config files, scripts, hooks
    audit      Same as fix but read-only \u2014 reports issues without writing
    update     Run ncu -u then pin overrides back (eslint, vite)
    deps       Check and install missing devDependencies
    install    Run pnpm install + husky init across packages
    verify     Run build, format:check, typecheck, lint, test
    init       Copy config templates + steering files into a consumer project
    help       Show this help

  Flags:
    --pkg <name>     Only process a single package (directory name)
    --root <path>    Explicit workspace root path
    --dry-run        For deps: report but don't install
    --no-steering    For init: skip steering files
    --no-config      For init: skip config templates

  Examples:
    stackra-std setup                  # full pipeline for all packages
    stackra-std setup --pkg cache      # full pipeline for one package
    stackra-std audit                  # check what needs fixing
    stackra-std verify                 # run quality checks only
`;
function main() {
  const args = process.argv.slice(2);
  const command = args.find((a) => !a.startsWith("-")) || "setup";
  const pkgIdx = args.indexOf("--pkg");
  const singlePkg = pkgIdx !== -1 ? args[pkgIdx + 1] : null;
  const dryRun = args.includes("--dry-run");
  const root = findWorkspaceRoot(args);
  console.log(
    "\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557"
  );
  console.log(
    `\u2551  \u{1F527} ${ORG_NAME} \u2014 Package Standardization Tool              \u2551`
  );
  console.log(
    "\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D"
  );
  console.log(`  Command:   ${command}`);
  console.log(`  Scope:     ${NPM_SCOPE}/*`);
  console.log(`  Workspace: ${root}`);
  if (command === "help") {
    console.log(HELP);
    return;
  }
  const packageNames = singlePkg ? [singlePkg] : discoverPackages(root);
  const packageDirs = packageNames.map((p) => path.join(root, p));
  console.log(
    `  Packages:  ${packageNames.length} discovered (${packageNames.join(", ")})`
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
    case "init":
      init(root, {
        pkg: singlePkg || void 0,
        noSteering: args.includes("--no-steering"),
        noConfig: args.includes("--no-config")
      });
      break;
    default:
      console.log(`
\u274C Unknown command: ${command}`);
      console.log(HELP);
      process.exitCode = 1;
  }
}
main();
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
