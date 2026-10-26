# Getting started with test reliability analysis

Use these examples to explore repeated test outcomes and component-based investigation priority.

## Supported workflows

QA engineers, test infrastructure maintainers and CI owners with a small suite of repeated Jest or Playwright runs. WebdriverIO users can also evaluate the synthetic checkout cases. Public or permission-cleared reports only.

## Walkthrough

1. Clone the repository and install dependencies with `npm ci` using Node.js 22.19.0 or later.
2. Run `npm run test:unit` and `npm run analyze -- examples/sample-runs.json`.
3. Run `npm run prioritize -- examples/sample-runs.json examples/sample-dependencies.json examples/sample-changed-components.json`.
4. Compare two synthetic Jest reports with `npm run analyze:batch -- jest ci-001 examples/sample-jest-results.json ci-002 examples/sample-jest-results-run2.json` and inspect missing-run coverage.\n5. Read [sample output](EXAMPLE_OUTPUT.md) and [dependency scoring limits](dependency-prioritization.md).
6. If you have a permitted Jest or Playwright JSON report, use the relevant adapter and evaluate the output. Do not post sensitive reports to public issues.
7. Note any incorrect classifications, unsupported fields, inconsistent test identities, or confusing outputs.

## Troubleshooting and feature requests

- Which runner and reporter version did you use?
- Did the CLI run as documented? If not, what command and error did you see?
- Were skipped tests, retries and mixed outcomes interpreted correctly?
- Was the manually maintained component mapping practical?
- What would stop you using this in a real CI pipeline?
- Would a stable command-line package or JUnit XML input make evaluation easier?

Please file a [GitHub issue](https://github.com/naveenprakash82/Boilerplate-WebDriverio/issues/new) describing the behavior and a **synthetic reproduction**. Never attach employer-owned reports, screenshots, URLs, configuration or customer data.

## Known limitations

- The scores are heuristic and are not calibrated failure probabilities.
- The dependency map is manually authored.
- The JSON adapters implement documented subsets, not every reporter version.
- Compatibility varies by runner and reporter version; check supported fields before integrating.
- The original project code is available under the [MIT License](../LICENSE); third-party dependencies have their own licenses.
