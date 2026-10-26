# Reviewing repeated test results

The included analysis utility groups repeated test results by test name and records how often each test passed, failed or was skipped. It makes no network requests and does not collect logs, screenshots or personal data.

## Run the example

```bash
npm run analyze -- examples/sample-runs.json
```

The sample contains synthetic demonstration results and does not describe any live production system.

## Input format

Use a JSON array. Each entry must identify one test and one distinct execution:

```json
[
  { "testId": "sample login", "runId": "run-001", "outcome": "passed", "durationMs": 120 },
  { "testId": "sample login", "runId": "run-002", "outcome": "failed", "durationMs": 160 }
]
```

Accepted outcomes are `passed`, `failed` and `skipped`. Duration is optional and measured in milliseconds. A repeated test and run pair produces an error rather than being counted twice.

## Interpretation

* `mixed-outcomes` means that both passing and failing results were observed. It does not establish the cause.
* `consistently-failing` means that all observed executions failed.
* `consistently-passing` means that all observed executions passed.
* `no-executions` means there were no passed or failed executions to assess.
* `insufficientEvidence` marks cases with fewer than three executed runs. Three is a reporting convention for this example, not a validated statistical threshold.

Failure rate is the number of failed runs divided by passed plus failed runs. Skipped runs are reported separately. An average duration is provided only when at least one executed result includes a duration. The report also includes `durationSampleCount`, the number of executed runs with recorded durations, and `durationCoverage`, that count divided by all executed runs. If there are no executed runs, duration coverage is `null`. Skipped runs do not affect coverage, even if their records include a duration. An average based on incomplete timing data should not be interpreted as representative of all executions.

## Limitations and next steps

This utility is a basic, transparent summary rather than a predictive model, a root cause analyzer or a novel statistical method. Mixed outcomes can result from test defects, application changes, infrastructure, data dependencies or other causes. It does not distinguish these sources.

Useful further work would include a documented adapter for a widely used public test result format, benchmark comparisons on publicly available data and feedback from independent maintainers. Any study should record its dataset, methods, limitations and reproducible results before making claims about accuracy or utility.

## Privacy

Only use results that are public or that you have permission to publish. For company data, remove sensitive identifiers and confirm that the resulting information is approved for external disclosure. Synthetic records are safest for examples.
