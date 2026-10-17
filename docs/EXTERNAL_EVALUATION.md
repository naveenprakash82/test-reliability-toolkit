# External engineering evaluation: test reliability utilities

This is an invitation to **evaluate**, not a claim of production adoption or predictive accuracy. The code is an experimental reference tool that summarizes repeated test runs and ranks investigations using a manually maintained dependency map.

## Fifteen-minute review

Requirements: Node.js 18 or later and npm. Browser tests are optional and require Chrome/Chromium.

```bash
git clone https://github.com/naveenprakash82/Boilerplate-WebDriverio.git
cd Boilerplate-WebDriverio
npm install
npm run test:unit
npm run analyze -- examples/sample-runs.json
npm run analyze:batch -- jest ci-001 examples/sample-jest-results.json ci-002 examples/sample-jest-results-run2.json
npm run prioritize -- examples/sample-runs.json examples/sample-dependencies.json examples/sample-changed-components.json
```

Use synthetic or public/authorized test data only. No company code, private logs or internal CI history is needed.

## Questions for reviewers

1. Does the run summary make missing tests, skipped results, and observed failures understandable? What might mislead a user?
2. Are the Jest/Playwright adapters usable for the exact reporter versions your team uses? If not, provide a **sanitized** or synthetic reproduction.
3. Would JUnit XML support make this more useful in your CI pipeline? Which format variations matter?
4. Is the manual component dependency map realistic for your team? What existing public or approved metadata would support automated mapping?
5. Does the current priority heuristic improve on sorting by past failure rate, or is it less useful? Please include an example where it fails.
6. What installation or integration step would prevent your team from trying this?

## How to report findings

Open a GitHub issue with:
- Your test framework, version, OS/CI platform, and Node version
- Command attempted, synthetic input, actual result, and expected result
- Whether you ran the code, only reviewed it, or integrated it into an approved project
- An optional link to a public implementation or permitted reproduction

Critical feedback is welcome. You are not being asked to star or fork the project. Please avoid testimonials without hands-on evaluation.

## What this does not do

- No JUnit XML import yet
- No automatic dependency discovery, persistent CI history, or packaged GitHub Action
- No probabilistic flakiness prediction, remediation, or proven performance gain
- No third-party production adoption currently established

## Research directions, not released features

A reproducible JavaScript/Playwright flaky-test benchmark could be useful if a prior-art review identifies a genuine gap. It would require licensed public datasets, reproducible environments, ground-truth labels and simple baseline comparisons.

A separate CI test-resource lifecycle proof of concept may explore pipeline namespacing, cleanup safety, retention windows and fault injection. It must be independently designed and must not use or reconstruct employer-owned systems or confidential information.

External evaluators can contribute improvements after reviewing the [contributor guidance](../CONTRIBUTING.md).
