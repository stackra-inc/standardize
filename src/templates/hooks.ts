/**
 * @fileoverview Git hook templates — husky, commitlint, lint-staged
 * @module @stackra/standardize
 */

export const TPL_HUSKY_PRE_COMMIT = `#!/usr/bin/env sh
npx lint-staged
`;

export const TPL_HUSKY_COMMIT_MSG = `#!/usr/bin/env sh
npx commitlint --edit $1
`;

export const TPL_COMMITLINT = `/**
 * @fileoverview Commitlint — conventional commit enforcement
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

export const TPL_LINTSTAGED = `/**
 * @fileoverview lint-staged — runs linters on staged files only
 * @see https://github.com/lint-staged/lint-staged
 */

export default {
  '*.{js,jsx,ts,tsx}': ['eslint --fix --no-error-on-unmatched-pattern', 'prettier --write'],
  '*.{json,md,mdx,css,html,yml,yaml,scss}': ['prettier --write'],
};
`;

export const TPL_LINTSTAGED_JSON_CONFIG = `/**
 * @fileoverview lint-staged — runs prettier on staged files only
 * @see https://github.com/lint-staged/lint-staged
 */

export default {
  '*.{json,md,mdx,css,html,yml,yaml,ts}': ['prettier --write'],
};
`;
