# Hands-on test reliability evaluation

This experimental toolkit summarizes observed test outcomes across repeated local reports. The examples use synthetic data. Results describe the supplied executions; they do not establish future failure probabilities or identify root causes.

## Requirements

Node.js 22.19.0 or later and npm. Chrome is only required for browser-spec execution.

```bash
git clone https://github.com/naveenprakash82/Boilerplate-WebDriverio.git
cd Boilerplate-WebDriverio
npm ci
npm run check
npm run test:unit
```

## Analyze repeated reporter outputs

```bash
npm run analyze:batch -- jest ci-001 examples/sample-jest-results.json ci-002 examples/sample-jest-results-run2.json
npm run analyze:manifest -- examples/report-manifest.json
npm run analyze:manifest -- examples/junit-report-manifest.json
```

The manifest reads local Jest JSON, Playwright JSON, or the documented restricted JUnit XML subset. It does not retrieve artifacts from a CI service, retain history, or validate the provenance of run identifiers. Missing tests are counted separately from skipped tests. See [manifest details](ci-report-manifest.md) and [JUnit restrictions](junit-xml-adapter.md).

## Compare prioritization with a baseline

```bash
npm run compare:priorities -- examples/sample-runs.json examples/sample-dependencies.json examples/sample-changed-components.json
```

The dependency-aware ranking uses explicit test-to-component mappings and heuristic weights. Compare it against observed failure-frequency sorting on held-out executions before drawing conclusions about usefulness. The supplied synthetic examples do not demonstrate predictive superiority.

## Reproduction information

A useful defect report includes the Node version, operating system, reporter name and version, exact command, expected behavior, observed behavior, and a minimal synthetic reproduction. Do not attach employer-owned code, private CI logs, customer data, credentials, or internal architecture.

For supported input schemas, installation instructions, and known limitations, see the [README](../README.md), [getting started guide](GETTING_STARTED.md), and [contributor guide](../CONTRIBUTING.md).
