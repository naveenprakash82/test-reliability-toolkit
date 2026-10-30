/**
 * Convert Jest JSON assertion results into records accepted by analyzeRuns.
 * This deliberately supports a limited part of the Jest report format.
 */
function jestJsonToRecords(report, runId) {
  if (typeof runId !== 'string' || !runId.trim()) {
    throw new TypeError('runId must be a nonempty string');
  }
  if (!report || typeof report !== 'object' || Array.isArray(report)
    || !Array.isArray(report.testResults)) {
    throw new TypeError('Expected a Jest JSON report with testResults');
  }

  // Suite-level execution errors cannot be represented as ordinary assertions.
  // Reject these reports rather than silently undercounting failures.
  if (Number.isFinite(report.numRuntimeErrorTestSuites) && report.numRuntimeErrorTestSuites > 0) {
    throw new Error('Jest report contains suite runtime errors; assertion-only analysis would be incomplete');
  }

  const records = [];
  const seen = new Set();
  const skippedStatuses = new Set(['pending', 'todo', 'disabled', 'skipped']);
  for (const suite of report.testResults) {
    if (!suite || typeof suite.name !== 'string' || !suite.name.trim()
      || !Array.isArray(suite.assertionResults)) {
      throw new TypeError('Each test result needs a suite name and assertionResults');
    }
    if (suite.testExecError != null ||
        (suite.status === 'failed' && !suite.assertionResults.some(assertion => assertion && assertion.status === 'failed'))) {
      throw new Error('Jest suite failed outside recorded assertions: ' + suite.name);
    }
    for (const assertion of suite.assertionResults) {
      if (!assertion || typeof assertion.fullName !== 'string' || !assertion.fullName.trim()) {
        throw new TypeError('Each assertion needs a nonempty fullName');
      }
      const { status, duration } = assertion;
      const outcome = status === 'passed' || status === 'failed'
        ? status : skippedStatuses.has(status) ? 'skipped' : null;
      if (!outcome) throw new TypeError('Unsupported assertion status: ' + String(status));
      if (duration != null && (!Number.isFinite(duration) || duration < 0)) {
        throw new TypeError('Assertion duration must be a nonnegative number');
      }
      const testId = suite.name + ' :: ' + assertion.fullName;
      if (seen.has(testId)) throw new Error('Duplicate test identifier in report: ' + testId);
      seen.add(testId);
      const record = { testId, runId, outcome };
      if (duration != null && outcome !== 'skipped') record.durationMs = duration;
      records.push(record);
    }
  }
  if (report.success === false && !records.some(record => record.outcome === 'failed')) {
    throw new Error('Failed Jest report contains no failed assertion outcomes');
  }
  return records;
}

module.exports = { jestJsonToRecords };
