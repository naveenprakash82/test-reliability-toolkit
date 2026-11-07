/**
 * Convert Playwright's built-in JSON reporter output to analyzeRuns records.
 * The final attempt determines the outcome. Retry attempts remain within
 * one execution, with explicit metadata for failed-then-passed tests.
 */
function playwrightJsonToRecords(report, runId) {
  if (typeof runId !== 'string' || !runId.trim()) throw new TypeError('runId must be a nonempty string');
  if (!report || !Array.isArray(report.suites)) throw new TypeError('Expected a Playwright JSON report with suites');
  const records = [];
  const seen = new Set();

  function visit(suite, titles = []) {
    if (!suite || typeof suite !== 'object' || Array.isArray(suite)) throw new TypeError('Invalid suite');
    if (!Array.isArray(suite.specs) || !Array.isArray(suite.suites)) {
      throw new TypeError('Each suite needs specs and suites arrays');
    }
    const nextTitles = suite.title ? [...titles, suite.title] : titles;
    for (const spec of suite.specs) {
      if (!spec || typeof spec.title !== 'string' || !spec.title.trim() || !Array.isArray(spec.tests)) {
        throw new TypeError('Each spec needs a title and tests array');
      }
      for (const test of spec.tests) {
        if (!test || typeof test.projectName !== 'string' || !Array.isArray(test.results)) {
          throw new TypeError('Each test needs projectName and results array');
        }
        const id = [spec.file || suite.file || '', ...nextTitles, spec.title, test.projectName].join(' :: ');
        if (seen.has(id)) throw new Error('Duplicate test identifier in report: ' + id);
        seen.add(id);
        for (const attempt of test.results) {
          if (!attempt || !['passed', 'failed', 'timedOut', 'interrupted', 'skipped'].includes(attempt.status)) {
            throw new TypeError('Unsupported Playwright attempt status: ' + String(attempt?.status));
          }
        }
        const final = test.results.at(-1);
        const status = final ? final.status : test.status;
        const outcome = status === 'passed' ? 'passed'
          : ['failed', 'timedOut', 'interrupted'].includes(status) ? 'failed'
          : status === 'skipped' ? 'skipped' : null;
        if (!outcome) throw new TypeError('Unsupported Playwright status: ' + String(status));
        const failedAttempt = test.results.some(attempt => ['failed', 'timedOut', 'interrupted'].includes(attempt.status));
        const flaky = outcome === 'passed' && failedAttempt;
        if (test.status === 'flaky' && !flaky) {
          throw new TypeError('Playwright flaky status requires a failed attempt followed by a pass');
        }
        const record = { testId: id, runId, outcome, attemptCount: test.results.length, retryCount: Math.max(0, test.results.length - 1), flaky };
        if (outcome !== 'skipped' && final && final.duration != null) {
          if (!Number.isFinite(final.duration) || final.duration < 0) throw new TypeError('Invalid test duration');
          record.durationMs = final.duration;
        }
        records.push(record);
      }
    }
    for (const child of suite.suites) visit(child, nextTitles);
  }
  for (const suite of report.suites) visit(suite);
  return records;
}
module.exports = { playwrightJsonToRecords };
