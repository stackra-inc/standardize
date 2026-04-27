# @stackra/standardize

CLI tool to audit and standardize all `@stackra/*` packages — configs, scripts, hooks, steering, and CI.

## Install

```bash
pnpm add -D @stackra/standardize
```

Or run directly:

```bash
npx @stackra/standardize fix
```

## Commands

| Command   | Description                                            |
| --------- | ------------------------------------------------------ |
| `fix`     | Standardize all config files, scripts, hooks (default) |
| `audit`   | Same as fix but read-only — reports issues, no writes  |
| `verify`  | Run build, format:check, typecheck, lint, test         |
| `install` | Run pnpm install + husky init across all packages      |
| `deps`    | Check and install missing devDependencies              |
| `help`    | Show usage                                             |

### Flags

- `--pkg <name>` — Only process a single package (by directory name)
- `--dry-run` — For `deps`: report but don't install

## Usage

```bash
# From the workspace root (where all package dirs live)

# Audit all packages (read-only)
npx @stackra/standardize audit

# Fix all packages
npx @stackra/standardize fix

# Run quality pipeline
npx @stackra/standardize verify

# Install deps + husky in all packages
npx @stackra/standardize install

# Check/install missing devDeps
npx @stackra/standardize deps

# Single package only
npx @stackra/standardize fix --pkg http
```

## What It Standardizes

- **package.json** — scripts, engines, packageManager, pnpm.overrides
- **Config files** — .prettierrc.mjs, vitest.config.ts, tsup.config.ts
- **Git hooks** — .husky/pre-commit (lint-staged), .husky/commit-msg (commitlint)
- **Commit linting** — commitlint.config.ts (conventional commits)
- **Staged linting** — .lintstagedrc.mjs (eslint + prettier on staged files)
- **Scaffolding** — .gitignore, .prettierignore, \_\_tests\_\_/ setup
- **CI** — dependabot.yml, dependabot-auto-merge.yml
- **Kiro steering** — .kiro/steering/ documentation files

## Configuration

All constants live in `src/config.ts`. Update there and re-run to propagate:

- `NPM_SCOPE` — npm scope (`@stackra`)
- `ORG_NAME` — organization name
- `PNPM_VERSION` — pinned pnpm version
- `NODE_MIN_VERSION` — minimum Node.js version
- `PNPM_OVERRIDES` — pinned transitive deps (eslint, vite)

## Auto-Discovery

The tool scans the workspace root for directories with a `package.json` whose name starts with the configured npm scope. No hardcoded list — add a new package directory and it's picked up automatically.

## Package Types

| Type          | Examples                                    | lint | vitest | tsup |
| ------------- | ------------------------------------------- | ---- | ------ | ---- |
| `library`     | container, http, redis, support             | ✅   | ✅     | ✅   |
| `config`      | eslint-config, prettier-config, tsup-config | ❌   | ✅     | ✅   |
| `json-config` | typescript-config                           | ❌   | ❌     | ❌   |

## License

MIT © [Stackra L.L.C](https://github.com/stackra-inc)
