/**
 * @fileoverview CI templates — dependabot, auto-merge workflow
 * @module @stackra/standardize
 */

import { NPM_SCOPE, DEPENDABOT_ASSIGNEE } from "../config.js";

export const TPL_DEPENDABOT = `version: 2

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

export const TPL_AUTO_MERGE = `name: Dependabot Updates

on: pull_request

permissions:
  contents: write
  pull-requests: write

jobs:
  auto-merge:
    name: 🤖 Auto-merge ${NPM_SCOPE}/* updates
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - name: 📋 Fetch Dependabot metadata
        id: metadata
        uses: dependabot/fetch-metadata@v2
        with:
          github-token: \${{ secrets.GITHUB_TOKEN }}

      - name: ✅ Approve & auto-merge
        if: contains(steps.metadata.outputs.dependency-names, '${NPM_SCOPE}/')
        run: |
          gh pr review "\$PR_URL" --approve
          gh pr merge "\$PR_URL" --auto --squash
        env:
          PR_URL: \${{ github.event.pull_request.html_url }}
          GH_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;
