# Example results

The repository includes invented examples. No examples originate from an employer, a customer, or a production system.

## Run-history summary

```bash
npm run analyze -- examples/sample-runs.json
```

The output includes two test summaries:

| Test | Passed | Failed | Executed | Failure rate | Classification | Average duration | Duration coverage |
| --- | ---: | ---: | ---: | ---: | --- | ---: | ---: |
| sample checkout | 3 | 0 | 3 | 0 | consistently-passing | 90 ms | 100% |
| sample login | 2 | 1 | 3 | 33.3% | mixed-outcomes | 140 ms | 100% |

The utility emits JSON with additional fields, including `skipped`, `durationSampleCount`, and `insufficientEvidence`. The failure rate is a summary of the observed sample, not a forecast.

## Dependency-based priority

```bash
npm run prioritize -- examples/sample-runs.json examples/sample-dependencies.json examples/sample-changed-components.json
```

The synthetic component change list contains `authentication`. The `sample login` test maps to that component and has mixed pass/fail outcomes, so the current heuristic ranks it above `sample checkout`. The score is an ordering aid only.

The component dependencies are entered manually. The tool neither scans source code nor confirms that a component change caused a failure.

## Useful next validation

Use one known public or synthetic set of repeated test runs to compare a simple failure-frequency ordering with the dependency-aware ordering. Record the dataset, exact scoring configuration, results, and cases where either approach performs worse. Do not describe the ranking as predictive or statistically validated before completing that evaluation.
