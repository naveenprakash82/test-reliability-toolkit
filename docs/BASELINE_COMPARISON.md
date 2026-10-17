# Compare the priority heuristic with a minimal baseline

The dependency-aware score is a transparent **investigation ordering**, not a validated predictor. This command compares its ranking with a simpler one that sorts observed tests by their historical failure rate.

```bash
npm run compare:priorities -- examples/sample-runs.json examples/sample-dependencies.json examples/sample-changed-components.json
```

The output includes the baseline order, heuristic ranks, observed failure rates, execution counts, and rank differences. A positive rank difference means the heuristic placed the test **earlier** than the baseline, not that it performed better.

The sample data only contains invented login and checkout results. Sorting by observed failure rate places the mixed-outcome login test ahead of the passing checkout test; the change-aware heuristic also prioritizes login because the example changed component is `authentication`. **Agreement in this synthetic case does not validate the weights**.

An unobserved test is placed last by the failure-rate baseline; the heuristic may rank it earlier if its dependency map matches a changed component. This makes the difference visible, but neither strategy can be called more accurate without independently labelled future outcomes.

## What a future evaluation needs

1. Clearly specified CI runs with fixed time ordering; use only history available **before** a target run to rank tests.
2. A reproducible, permitted dataset and documented missing/skip behavior.
3. Ground-truth outcomes on held-out runs, comparable investigation budget (such as first 5 or 10 tests), and meaningful top-k retrieval or effort measures.
4. Baselines beyond failure frequency where justified, including random or changed-component-only sorting.
5. Cases where the heuristic loses, plus uncertainty from small histories, mapping errors and dataset selection.

Do not derive predictive-accuracy claims from this diagnostic comparison.
