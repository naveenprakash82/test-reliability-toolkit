# Importing a subset of Jest JSON results

This adapter converts Jest JSON `testResults[].assertionResults[]` into the input format used by `analyzeRuns`. It has no Jest dependency. The example report contains invented data.

## Convert a report

```bash
node src/reliability/jestJsonCli.js run-001 examples/sample-jest-results.json > jest-records.json
npm run analyze -- jest-records.json
```

Use a different run ID for each actual execution. Combine the JSON arrays from separate executions before analyzing repeated results.

## Supported fields

Each suite must have a nonempty `name` and `assertionResults` array. Each assertion requires `fullName` and `status`. The adapter preserves `passed` and `failed`, and converts `pending`, `todo`, `disabled`, and `skipped` to `skipped`. Optional `duration` values are milliseconds. Suite names and assertion names together form the test identifier.

## Limitations and privacy

This adapter imports assertion outcomes only. It rejects reports that indicate suite runtime errors, failed suites without failed assertions, or failed reports with no assertion outcomes, rather than silently counting those executions as missing. It does not convert suite-level errors, stack traces, attachments, retries, or reporter metadata into individual test records. Reports with incomplete or unsupported failure information must be investigated using the original reporter output.

Test names can contain internal file paths. Only publish synthetic or approved data. Do not commit confidential test reports, company source code, credentials, or customer information.

