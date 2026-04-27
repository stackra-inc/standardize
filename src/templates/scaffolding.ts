/**
 * @fileoverview Scaffolding templates — .gitignore, .prettierignore, test setup
 * @module @stackra/standardize
 */

export const TPL_GITIGNORE = `dist/
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

export const TPL_PRETTIERIGNORE = `dist/
node_modules/
coverage/
pnpm-lock.yaml
CHANGELOG.md
`;

export const TPL_VITEST_SETUP = `/**
 * @fileoverview Vitest global setup — runs before every test file.
 * @see https://vitest.dev/config/#setupfiles
 */
`;

export const TPL_VITEST_SETUP_DTS = `/// <reference types="vitest/globals" />
`;
