# Independent pilot: evaluating test reliability summaries

This is an invitation to evaluate an early-stage engineering example, not a claim of production readiness.

## Who this is for

QA engineers, test infrastructure maintainers and CI owners with a small suite of repeated Jest or Playwright runs. WebdriverIO users can also evaluate the synthetic checkout cases. Public or permission-cleared reports only.

## Fifteen-minute evaluation

1. Clone the repository and install dependencies with `npm install` using Node.js 18 or later.
2. Run `npm run test:unit` and `npm run analyze -- examples/sample-runs.json`.
3. Run `npm run prioritize -- examples/sample-runs.json examples/sample-dependencies.json examples/sample-changed-components.json`.
4. Compare two synthetic Jest reports with `npm run analyze:batch -- jest ci-001 examples/sample-jest-results.json ci-002 examples/sample-jest-results-run2.json` and inspect missing-run coverage.\n5. Read [sample output](EXAMPLE_OUTPUT.md) and [dependency scoring limits](dependency-prioritization.md).
6. If you have a permitted Jest or Playwright JSON report, use the relevant adapter and evaluate the output. Do not post sensitive reports to public issues.
7. Note any incorrect classifications, unsupported fields, inconsistent test identities, or confusing outputs.

## What feedback would be useful?

- Which runner and reporter version did you use?
- Did the CLI run as documented? If not, what command and error did you see?
- Were skipped tests, retries and mixed outcomes interpreted correctly?
- Was the manually maintained component mapping practical?
- What would stop you using this in a real CI pipeline?
- Would a stable command-line package or JUnit XML input make evaluation easier?

Please file a [GitHub issue](https://github.com/naveenprakash82/Boilerplate-WebDriverio/issues/new) describing the behavior and a **synthetic reproduction**. Never attach employer-owned reports, screenshots, URLs, configuration or customer data.

## Evidence and attribution

The project does not currently claim real-world adoption. Independent testing may lead to issue reports, suggested changes, accepted pull requests, or permission-based case studies. We will record only feedback and integrations that can be independently verified. There is no expectation of a star, endorsement, testimonial or citation in exchange for a review.

## Known limitations

- The scores are heuristic and are not calibrated failure probabilities.
- The dependency map is manually authored.
- The JSON adapters implement documented subsets, not every reporter version.
- This project has not completed a broad, independent compatibility review.
- The original project code is available under the [MIT License](../LICENSE); third-party dependencies have their own licenses.
