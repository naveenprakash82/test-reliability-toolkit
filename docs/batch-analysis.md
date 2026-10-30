# Compare separate CI reports

Use `npm run analyze:batch -- jest <runId> <report.json> [<runId> <report.json> ...]`, replacing `jest` with `playwright` for Playwright JSON output or `junit` for the restricted JUnit XML subset. Each invocation accepts one reporter format.

For example, compare two synthetic JUnit XML reports:

```bash
npm run analyze:batch -- junit ci-001 examples/sample-junit-report.xml ci-002 examples/sample-junit-report-run2.xml
```

JUnit XML reports are restricted to 1 MiB each and must conform to the [supported XML subset](junit-xml-adapter.md). Other report formats retain the 20 MiB per-file limit.

Run IDs are trimmed and must be unique. The CLI rejects repeated report file paths, including symlinks to the same file. The CLI warns when distinct files have byte-identical content; this warning is not proof that the reports came from the same execution. Use independently generated CI artifacts. Do not mix reporter formats in one invocation.

The batch CLI accepts at most 100 runs, requires regular report files, limits JSON reports to 20 MiB each (JUnit XML to 1 MiB each), and limits the combined input to 32 MiB. It checks file sizes before reading them. For a local manifest with path containment, use [multi-run report manifest](ci-report-manifest.md). These limits reduce accidental memory exhaustion; they do not make untrusted reports safe to share or prove CI run provenance.

Each test summary includes `totalRuns`, `observedRuns`, `runsSeen`, and `missingRuns`. Missing tests are not counted as skipped. Failure rates use executed outcomes only, so compare rates together with observation coverage and `insufficientEvidence`. The Playwright adapter uses the final retry outcome per run; retries do not count as independent executions.

This analysis is descriptive, not predictive. Only use synthetic or authorized test reports.
