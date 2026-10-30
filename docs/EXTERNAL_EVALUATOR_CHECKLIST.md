# Independent evaluation checklist

This experimental toolkit can be evaluated with synthetic data without access to employer systems or CI credentials. It summarizes supplied test executions and offers heuristic investigation rankings; it does not predict future failures with validated accuracy.

## Environment and clean setup

- Node.js 22.19.0 or later and npm.
- Chrome or Chromium only if running the WebdriverIO browser examples.
- Start from a fresh clone rather than an existing local workspace.

```bash
git clone https://github.com/naveenprakash82/test-reliability-toolkit.git
cd test-reliability-toolkit
node --version
npm ci
npm run check
npm run test:unit
```

For optional browser checks, run `npm test`. Report your OS, Node version, browser version, and any errors.

## Reproduce the documented examples

Run each command independently and inspect its JSON output and any warnings:

```bash
npm run analyze -- examples/sample-runs.json
npm run prioritize -- examples/sample-runs.json examples/sample-dependencies.json examples/sample-changed-components.json
npm run analyze:batch -- jest ci-001 examples/sample-jest-results.json ci-002 examples/sample-jest-results-run2.json
npm run analyze:batch -- junit ci-001 examples/sample-junit-report.xml ci-002 examples/sample-junit-report-run2.xml
npm run analyze:manifest -- examples/report-manifest.json
npm run analyze:manifest -- examples/junit-report-manifest.json
npm run compare:priorities -- examples/sample-runs.json examples/sample-dependencies.json examples/sample-changed-components.json
```

See [sample output](EXAMPLE_OUTPUT.md), [supported formats](GETTING_STARTED.md), and [baseline interpretation](BASELINE_COMPARISON.md). The included data is synthetic, so results are demonstrations, not measured benefits in real CI environments.

## What to assess

1. Can a new evaluator install and run the examples using only the public documentation?
2. Are pass, fail, skip, missing-run coverage, and mixed-outcome classifications understandable?
3. Does the documented reporter subset match the evaluator's permitted sample format?
4. Are the required manually authored dependency mappings and changed-component lists practical?
5. Are warnings, unsupported inputs, and limitations clearly communicated?
6. Does the output help decide what to investigate, without implying predictive accuracy?

## Share feedback safely

Open an [independent evaluation issue](https://github.com/naveenprakash82/test-reliability-toolkit/issues/new?template=pilot-feedback.md) with the command, expected and observed behavior, environment, and a minimal **invented** reproduction. If the issue template is unavailable, use a standard issue.

Do not publish employer-owned test reports, internal architecture, credentials, customer information, private CI logs, or other sensitive materials.

## Scope and limits

- Jest and Playwright JSON converters and JUnit XML conversion support documented subsets only.
- Manifest processing reads local report files; it does not fetch CI artifacts, verify run provenance, or maintain historical storage.
- Dependency mappings are manually supplied. Rankings are heuristic, not calibrated probabilities.
- No npm package is published, and no production readiness, independent adoption, or predictive improvement is claimed.

See [CONTRIBUTING.md](../CONTRIBUTING.md) and [SECURITY.md](../SECURITY.md) before sharing findings.
