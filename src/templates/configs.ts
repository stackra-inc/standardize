/**
 * @fileoverview Config file templates — .prettierrc, vitest.config, tsup.config
 * @module @stackra/standardize
 */

import { NPM_SCOPE, ORG_NAME } from "../config.js";

export function tplPrettierConfig(pkg: string): string {
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

export function tplVitestConfig(pkg: string): string {
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

export function tplTsupConfig(pkg: string): string {
  return `/**
 * @fileoverview tsup build configuration for ${pkg}
 * @module ${pkg}
 * @see https://tsup.egoist.dev/
 */

import { basePreset as preset } from '${NPM_SCOPE}/tsup-config';

export default preset;
`;
}
