# Test Reliability Analysis Examples

A small, framework-independent set of JavaScript tools for reviewing repeated test results and prioritizing investigations after component changes.

The project helps answer two practical questions:
- Which tests have shown inconsistent results across repeated runs?
- Which tests may deserve attention when a particular application component changes?

It supports a simple JSON test-history format and limited conversions from Jest and Playwright JSON reports. WebdriverIO browser tests include login and a synthetic shopping-cart/checkout workflow.

> **Status:** Experimental engineering examples. The dependency-based score is a transparent heuristic, not a validated prediction of failure. No independent adoption or performance improvement has been established.

## Quick start

Requires Node.js 22 and npm. Chrome or Chromium is needed only for the browser examples.

```bash
git clone https://github.com/naveenprakash82/Boilerplate-WebDriverio.git
cd Boilerplate-WebDriverio
npm install
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

See the [Playwright format guide](docs/playwright-json-adapter.md) and [Jest format guide](docs/jest-json-adapter.md). Conversions support only the documented fields and reporter structures. Do not assume compatibility with every version of either tool.

To compare multiple runs, combine converted record arrays from distinct run IDs into one JSON array. Do not concatenate JSON documents as text.

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
| [Order contract validator](src/contracts/orderContract.js) | Validate a synthetic consumer response contract |
| [Checkout browser tests](test/specs/store.e2e.js) | Cart totals, removal, and checkout |
| [Unit tests](test/unit) | Verify supported behaviors and invalid inputs |
| [WebdriverIO examples](test/specs/login.e2e.js) | Runnable browser tests |

## Contributing and releases

Feedback, reproducible bug reports and focused test improvements are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing changes.

The [release plan](docs/RELEASE_PLAN.md) records what remains before a stable release. **No npm distribution is published by this work.** The MIT license has been prepared for ownership review, but it is not active on the default branch until approved and merged. Please do not assume permission to reuse or redistribute the code until the license is published.

## Responsible use

All committed sample data is synthetic. Do not upload employer-owned source code, internal dependency maps, private incident reports, personal information, credentials or customer data. AI-assisted code and documentation must be reviewed by their human contributors, with disclosures as required by receiving projects.
