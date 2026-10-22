# Evaluate the Test Reliability Toolkit: a 15-minute hands-on review

CI jobs do not always produce the same set of test results. A test might pass in one run, fail in another, or be absent from a later report. Looking only at a single red or green build can hide that history.

This experimental JavaScript utility summarizes repeated runs from supported Jest or Playwright JSON reports. It also demonstrates a separate, manually mapped component-impact ranking. We are looking for engineers to **run it, challenge its assumptions, and report what does not work**.

**Repository:** https://github.com/naveenprakash82/Boilerplate-WebDriverio

## 1. Run the example (about 5 minutes)

Requires Node.js 18+ and npm. Chrome is **not** required for this review.

```bash
git clone https://github.com/naveenprakash82/Boilerplate-WebDriverio.git
cd Boilerplate-WebDriverio
npm install
npm run test:unit
npm run analyze:batch -- jest ci-001 examples/sample-jest-results.json ci-002 examples/sample-jest-results-run2.json
```

The two synthetic Jest reports contain these outcomes:

| Test | Run ci-001 | Run ci-002 | Interpretation |
| --- | --- | --- | --- |
| example signs in | passed | failed | Both outcomes observed |
| example handles invalid input | failed | passed | Both outcomes observed |
| example optional feature | pending | pending | Skipped, not a failure |

The analyzer reports a **50% observed failure rate** for each mixed-outcome test because each was executed twice, not a 50% probability that it will fail in the future. Both are marked `insufficientEvidence` because fewer than three executions were observed. The optional feature has no executed observations and a null failure rate.

The example does not contain an absent test. If you want to examine missing-run behavior, remove one `assertionResults` entry from a **copy** of one report and rerun the command. The corresponding `missingRuns` entry should name that run; absence must not be silently counted as skipped. Keep the original fixtures unchanged.

## 2. Explore the dependency ranking (about 3 minutes)

```bash
npm run prioritize -- examples/sample-runs.json examples/sample-dependencies.json examples/sample-changed-components.json
```

In this separate synthetic example, `sample login` has mixed outcomes and maps to the changed `authentication` component. The score is a fixed heuristic, not a learned or calibrated prediction. Its dependency map is entered **manually** and may be impractical for large systems.

## 3. Tell us what would stop you from using it (about 7 minutes)

Choose any of these questions that match your experience:

1. **Accuracy:** Does it distinguish failed, skipped and absent tests clearly? What does it misrepresent?
2. **Compatibility:** Does a permitted Jest/Playwright JSON report from a specific version convert correctly? If not, share an invented minimal reproduction.
3. **CI interoperability:** Would JUnit XML support, a GitHub Action, or a history store actually help your team? Which exact workflow needs it?
4. **Dependency mapping:** How would your team derive test-to-component relationships from existing approved coverage or build metadata?
5. **Baseline comparison:** Would simply sorting by observed failure frequency be more useful than the current weighted prioritizer? Show a counterexample if possible.
6. **Usability:** Which install, configuration, output or documentation detail would prevent a trial?

## 4. Share findings

Use the [independent pilot feedback issue form](../.github/ISSUE_TEMPLATE/pilot-feedback.md) or open a [GitHub issue](https://github.com/naveenprakash82/Boilerplate-WebDriverio/issues/new). Include your tool versions, commands, expected/actual outcome and an invented reproduction. Please say whether you **read the code**, **ran the examples**, or **integrated it into an approved project**; these are different levels of evaluation.

If a technical fix is useful, see [CONTRIBUTING.md](../CONTRIBUTING.md). Critical feedback is welcome. No stars, endorsements, or testimonials are requested.

## Present limitations

- Supported ingestion is limited to documented subsets of Jest and Playwright JSON. No JUnit XML adapter yet.
- There is no automatically inferred dependency map, persistent CI history, packaged GitHub Action or hosted dashboard.
- The scoring weights have not been validated against a simple baseline or real-world outcomes.
- This is not a probabilistic flaky-test detector; ranking weights have not been calibrated against future test failures.
- All committed examples are synthetic. Do not share employer data, customer reports, credentials, private logs or confidential architecture.

For supported functionality and known limitations, see the [README](../README.md) and [getting started guide](GETTING_STARTED.md).
