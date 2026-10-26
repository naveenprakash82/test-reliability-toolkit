# Multi-run report manifest

The manifest command analyzes local Jest/Playwright JSON reports or the documented restricted JUnit XML subset collected from separate test executions. It does not download CI artifacts, run tests, or maintain a persistent history database.

## Example

```bash
npm install
npm run analyze:manifest -- examples/report-manifest.json
```

The example manifest references two synthetic Jest reports:

```json
{
  "format": "jest",
  "runs": [
    { "runId": "ci-001", "file": "sample-jest-results.json" },
    { "runId": "ci-002", "file": "sample-jest-results-run2.json" }
  ]
}
```

## Collecting repeated CI runs

1. Configure the test runner to emit its supported JSON reporter output on each CI execution.
2. Retain each report as a CI artifact and record the workflow run identifier, commit SHA, and runner version outside the report.
3. Download reports from distinct executions into a local directory. Give each report a unique filename.
4. Create a manifest in that directory. Set `format` to `jest`, `playwright`, or `junit` and assign a distinct `runId` to each report.
5. Run `npm run analyze:manifest -- path/to/manifest.json` and retain the manifest, source reports, and analysis output together.

The command reads files only. It does not verify that run IDs correspond to actual CI executions. Reports with identical bytes produce a warning, not proof of accidental reuse. Do not treat repeated copies of one execution as independent observations.

## Input validation and limitations

- Supports one reporter format per manifest, with 1 to 100 runs.
- Each report path must be relative to the manifest directory and resolve within that directory. Duplicate resolved paths and run IDs are rejected.
- The manifest is limited to 1 MiB, each report to 20 MiB, and the total report input to 32 MiB. JUnit XML additionally has a stricter 1 MiB per-report limit enforced by its parser. Malformed input and unsupported reporter records are rejected.
- A missing test in a particular run is tracked separately from a test explicitly marked skipped.
- The analyzer reports observed outcomes and failure rates. It does not estimate causal dependencies, predict future failures, or prove ranking effectiveness.
- JUnit XML support is restricted to the documented subset in `docs/junit-xml-adapter.md`; reporter-specific extensions and nested suites are rejected.
- The command does not automatically discover CI artifacts, store history, or compare unrelated test suites.

Only use public or synthetic sample data when reporting issues. Review CI artifacts before sharing them; test output can contain credentials, URLs, user information, and internal system details.

## JUnit XML example

```bash
npm run analyze:manifest -- examples/junit-report-manifest.json
```

The example uses two synthetic JUnit XML reports. Each report is parsed separately and test identifiers are matched across run IDs. A matching test that is absent in a report is recorded as missing, not skipped. The command does not infer that the reports came from independent CI executions.
