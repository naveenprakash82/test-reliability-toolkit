# Changelog

## Unreleased

- Added a restricted JUnit XML converter with explicit size, testcase, suite, namespace, and count validation, plus synthetic regression fixtures.
- Added local manifest analysis for multiple Jest JSON, Playwright JSON, or restricted JUnit XML reports. It distinguishes missing tests from skipped tests and enforces relative-path containment, duplicate detection, and aggregate input limits.
- Rejects incomplete Jest reports containing suite execution errors or report-level failures not represented by failed assertions.
- Committed an npm dependency lockfile and changed CI installation to `npm ci` using Node.js 22.19.0 or later and WebdriverIO 10.
- Added a synthetic JUnit manifest command check and a dependency advisory audit to GitHub Actions.
- Expanded documentation of supported reporter subsets, local CI report collection, heuristic ranking limitations, and reproducible testing.

The manifest reads local reports only. It does not retrieve CI artifacts, validate execution provenance, or store a persistent history. JUnit XML support does not cover all reporter variants.
