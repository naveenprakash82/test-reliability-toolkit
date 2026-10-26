# Test Reliability Analysis Toolkit

An experimental JavaScript toolkit for reviewing repeated test results from supported Jest and Playwright JSON reports, with WebdriverIO browser examples and a transparent dependency-based investigation heuristic.

The project helps answer two practical questions:
- Which tests have shown inconsistent results across repeated runs?
- Which tests may deserve attention when a particular application component changes?

It supports a simple JSON test-history format and limited conversions from Jest, Playwright JSON, and selected JUnit XML reports. WebdriverIO browser tests include login and a synthetic shopping-cart/checkout workflow.

> **Note:** Dependency-based priority scores are heuristic investigation aids, not calibrated failure probabilities.

## Quick start

Requires Node.js 22.19.0 or later and npm. Chrome or Chromium is needed only for the browser examples.

```bash
git clone https://github.com/naveenprakash82/Boilerplate-WebDriverio.git
cd Boilerplate-WebDriverio
npm ci
npm run test:unit
npm run analyze -- examples/sample-runs.json
```

This command reads local synthetic results and prints a JSON summary of passes, failures, skipped executions, failure rates, duration coverage and mixed outcomes.

**[See sample output and interpretation](docs/EXAMPLE_OUTPUT.md)**

## Synthetic store and API contract checks

Browser automation includes a local shopping-cart scenario: add products, calculate totals, remove items, and complete a sample checkout. No real payments or external services are involved.

A separate consumer-side order contract validator checks required fields and compatible status values. It demonstrates how an additive field can remain compatible while changes to identifiers, item quantities or supported statuses can break a consumer. Run `npm run test:unit` to exercise the contract regressions.

## Prioritize investigations after a change

```bash
npm run prioritize -- examples/sample-runs.json examples/sample-dependencies.json examples/sample-changed-components.json
```

The dependency map and changed-component list are explicit JSON inputs. The tool does not discover source-code dependencies. See [method, weights, and limitations](docs/dependency-prioritization.md).

## Import test results

Playwright JSON reporter:

```bash
npm run playwright:convert -- run-001 examples/sample-playwright-report.json > converted.json
npm run analyze -- converted.json
```

Jest JSON reporter:

```bash
npm run jest:convert -- run-001 examples/sample-jest-results.json > converted.json
npm run analyze -- converted.json
```

JUnit XML (restricted subset):

```bash
npm run junit:convert -- run-001 examples/sample-junit-report.xml > converted.json
npm run analyze -- converted.json
```

See the [JUnit XML format and safety guide](docs/junit-xml-adapter.md), [Playwright format guide](docs/playwright-json-adapter.md) and [Jest format guide](docs/jest-json-adapter.md). Conversions support only the documented fields and reporter structures. Do not assume compatibility with every version of either tool.

To compare multiple runs, use `npm run analyze:batch -- jest ci-001 examples/sample-jest-results.json ci-002 examples/sample-jest-results-run2.json`. For Playwright, use `playwright` and Playwright JSON reports. See [batch analysis](docs/batch-analysis.md) for missing-run coverage and duplicate-report warnings.

## Tests

```bash
npm run check
npm run test:unit
npm test
```

The browser tests use a local generated sign-in page and do not require any external account.

## Implementation

| Component | Purpose |
| --- | --- |
| [analyzeRuns.js](src/reliability/analyzeRuns.js) | Descriptive test-run statistics |
| [priorityFromDependencies.js](src/reliability/priorityFromDependencies.js) | Dependency-aware investigation ordering |
| [playwrightJsonAdapter.js](src/reliability/playwrightJsonAdapter.js) | Convert selected Playwright JSON test results |
| [jestJsonAdapter.js](src/reliability/jestJsonAdapter.js) | Convert selected Jest JSON assertion results |
| [junitXmlAdapter.js](src/reliability/junitXmlAdapter.js) | Convert a restricted subset of JUnit XML testcases |
| [Order contract validator](src/contracts/orderContract.js) | Validate a synthetic consumer response contract |
| [Checkout browser tests](test/specs/store.e2e.js) | Cart totals, removal, and checkout |
| [Unit tests](test/unit) | Verify supported behaviors and invalid inputs |
| [WebdriverIO examples](test/specs/login.e2e.js) | Runnable browser tests |

## Compare separate CI runs

```bash
npm run analyze:batch -- jest ci-001 examples/sample-jest-results.json ci-002 examples/sample-jest-results-run2.json
```

The batch output identifies runs where each test was observed or missing. Distinct files with identical bytes trigger a warning, not an automatic rejection. See the [batch analysis guide](docs/batch-analysis.md).

## Compare multiple CI reports

Create a manifest listing local Jest or Playwright JSON reports, or the documented restricted JUnit XML subset, from separate runs. The analyzer tracks missing tests separately from skipped tests and reports observed failure rates.

```bash
npm run analyze:manifest -- examples/report-manifest.json
npm run analyze:manifest -- examples/junit-report-manifest.json
```

See the [manifest guide](docs/ci-report-manifest.md) for input limits, run identifiers, artifact collection, and limitations. This command reads local files; it does not download CI artifacts or verify their provenance.

## Compare rankings with a simple baseline

Run `npm run compare:priorities -- examples/sample-runs.json examples/sample-dependencies.json examples/sample-changed-components.json` to compare the dependency-aware ordering with sorting by observed failure frequency. The output identifies rank differences, **not** evidence of improved predictive performance. See the [baseline comparison method](docs/BASELINE_COMPARISON.md).


## Roadmap and limitations

The next interoperability priorities are broader reporter compatibility, easier ingestion of repeated CI runs, and validation against future outcomes on a held-out dataset. Automated dependency discovery and historical storage are research/development tasks, not existing capabilities.

The GitHub repository retains its original `Boilerplate-WebDriverio` name for now. Its current technical focus is test reliability analysis; a repository rename and package identity change need a separate compatibility review.

## Usage walkthrough

See the [getting started walkthrough](docs/GETTING_STARTED.md) for additional examples and troubleshooting.

## Contributing and releases

Feedback, reproducible bug reports and focused test improvements are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing changes.
 **No npm distribution is published by this work.** The project is available under the [MIT License](LICENSE). Third-party dependencies remain subject to their own licenses.

## Responsible use

All committed sample data is synthetic. Do not upload employer-owned source code, internal dependency maps, private incident reports, personal information, credentials or customer data. AI-assisted code and documentation must be reviewed by their human contributors, with disclosures as required by receiving projects.
