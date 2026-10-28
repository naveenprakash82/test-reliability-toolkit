# Compare separate Jest or Playwright CI reports

Use `npm run analyze:batch -- jest <runId> <report.json> [<runId> <report.json> ...]`, replacing `jest` with `playwright` for Playwright JSON output.

Run IDs are trimmed and must be unique. The CLI rejects repeated report file paths, including symlinks to the same file. The CLI warns when distinct files have byte-identical content; this warning is not proof that the reports came from the same execution. Use independently generated CI artifacts. Do not mix reporter formats in one invocation.

The batch CLI accepts at most 100 runs, requires regular report files, and limits each report to 20 MiB and the combined input to 32 MiB. It checks file sizes before reading them. For a local manifest with path containment, use [multi-run report manifest](ci-report-manifest.md). These limits reduce accidental memory exhaustion; they do not make untrusted reports safe to share or prove CI run provenance.

Each test summary includes `totalRuns`, `observedRuns`, `runsSeen`, and `missingRuns`. Missing tests are not counted as skipped. Failure rates use executed outcomes only, so compare rates together with observation coverage and `insufficientEvidence`. The Playwright adapter uses the final retry outcome per run; retries do not count as independent executions.

This analysis is descriptive, not predictive. Only use synthetic or authorized test reports.
