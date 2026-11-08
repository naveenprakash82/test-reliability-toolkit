/**
 * Summarize repeated test outcomes without needing a test platform or external data.
 * A test is unstable when both passing and failing outcomes are observed.
 *
 * Input is a list of { testId, runId, outcome, durationMs } records.
 * Outcomes are "passed", "failed" or "skipped". Each (testId, runId)
 * pair must occur once. Skipped runs are reported, but excluded from
 * the measured failure rate.
 */
function analyzeRuns(records) {
  if (!Array.isArray(records)) throw new TypeError('Expected an array of test results');
  const groups = new Map();
  const seen = new Set();

  for (const record of records) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      throw new TypeError('Each test result must be an object');
    }
    const { testId, runId, outcome, durationMs, flaky, attemptCount, retryCount } = record;
    if (typeof testId !== 'string' || !testId.trim()
      || typeof runId !== 'string' || !runId.trim()) {
      throw new TypeError('Each result requires a nonempty testId and runId');
    }
    if (!['passed', 'failed', 'skipped'].includes(outcome)) {
      throw new TypeError('Unknown test outcome: ' + String(outcome));
    }
    if (durationMs !== undefined && (!Number.isFinite(durationMs) || durationMs < 0)) {
      throw new TypeError('durationMs must be a nonnegative finite number');
    }

    if (flaky !== undefined && typeof flaky !== 'boolean') throw new TypeError('flaky must be a boolean');
    if (attemptCount !== undefined && (!Number.isSafeInteger(attemptCount) || attemptCount < 0)) throw new TypeError('attemptCount must be a nonnegative integer');
    if (retryCount !== undefined && (!Number.isSafeInteger(retryCount) || retryCount < 0)) throw new TypeError('retryCount must be a nonnegative integer');
    if (attemptCount !== undefined && retryCount !== undefined && retryCount !== Math.max(0, attemptCount - 1)) throw new TypeError('Inconsistent attemptCount and retryCount');
    if (flaky === true && (outcome !== 'passed' || (attemptCount !== undefined && attemptCount < 2))) throw new TypeError('flaky requires a passing execution with retries');

    const key = JSON.stringify([testId, runId]);
    if (seen.has(key)) throw new Error('Duplicate testId and runId: ' + key);
    seen.add(key);
    if (!groups.has(testId)) {
      groups.set(testId, { testId, passed: 0, failed: 0, skipped: 0, durations: [], flakyPasses: 0, retryCount: 0 });
    }
    const group = groups.get(testId);
    group[outcome]++;
    if (flaky === true) group.flakyPasses++;
    if (retryCount !== undefined) group.retryCount += retryCount;
    if (outcome !== 'skipped' && durationMs !== undefined) group.durations.push(durationMs);
  }

  return Array.from(groups.values()).map(group => {
    const executed = group.passed + group.failed;
    const failureRate = executed ? group.failed / executed : null;
    // An observed change of outcome is evidence of instability, not its cause.
    const classification = executed === 0 ? 'no-executions'
      : group.passed > 0 && group.failed > 0 ? 'mixed-outcomes'
      : group.failed > 0 ? 'consistently-failing'
      : 'consistently-passing';
    const durationSampleCount = group.durations.length;
    const durationCoverage = executed ? durationSampleCount / executed : null;
    const averageDurationMs = group.durations.length
      ? Math.round(group.durations.reduce((sum, duration) => sum + duration, 0) / group.durations.length)
      : null;
    return {
      testId: group.testId,
      passed: group.passed,
      failed: group.failed,
      skipped: group.skipped,
      executed,
      failureRate,
      flakyPasses: group.flakyPasses,
      retryCount: group.retryCount,
      observedInstability: classification === 'mixed-outcomes' || group.flakyPasses > 0,
      classification,
      averageDurationMs,
      durationSampleCount,
      durationCoverage,
      insufficientEvidence: executed < 3
    };
  }).sort((a, b) => a.testId.localeCompare(b.testId));
}

module.exports = { analyzeRuns };
