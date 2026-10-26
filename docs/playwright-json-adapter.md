# Importing Playwright JSON reporter results

This adapter converts part of Playwright's built-in JSON reporter output into records that can be analyzed by the repository's reliability utility. It uses local JSON files and does not call an external service.

## Generate a report

Configure the built-in Playwright JSON reporter or run:

```bash
PLAYWRIGHT_JSON_OUTPUT_NAME=results.json npx playwright test --reporter=json
```

Playwright may exit with a nonzero status when tests fail. That does not necessarily prevent its JSON report from being written.

## Convert and analyze

```bash
node src/reliability/playwrightJsonCli.js run-001 examples/sample-playwright-report.json > converted.json
npm run analyze -- converted.json
```

A unique run identifier must be provided for each execution. To compare repeated runs, combine the arrays of converted records from separate executions into one JSON array.

## Supported structure

The adapter walks nested `suites`, `specs` and `tests` in the Playwright JSON report. Test identifiers include the file or suite name, test title and project name. It maps `passed` to passed, `failed`, `timedOut` and `interrupted` to failed, and `skipped` to skipped.

If a test has retries, only its **last attempt** is included. An earlier failed attempt followed by a successful retry therefore appears as a pass. This tool does not measure retry-level flakiness or infer why a test failed.

This example intentionally excludes attachments, screenshots, errors, stdout and stderr. It does not count suite-level failures with no test results. The test fixtures are invented and do not represent a production system.

## Privacy and validation

Playwright reports can contain internal file names and error details. Use only synthetic or authorized data. Review reports before public sharing; do not publish company test results or customer information.

The adapter supports only the documented reporter structure and does not validate compatibility with every Playwright version.
