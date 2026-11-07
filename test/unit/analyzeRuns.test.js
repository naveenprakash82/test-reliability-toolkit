const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeRuns } = require('../../src/reliability/analyzeRuns');

test('detects mixed outcomes across distinct runs', () => {
  const result = analyzeRuns([
    { testId: 'login', runId: '1', outcome: 'passed', durationMs: 100 },
    { testId: 'login', runId: '2', outcome: 'failed', durationMs: 200 },
    { testId: 'login', runId: '3', outcome: 'passed', durationMs: 150 }
  ])[0];
  assert.equal(result.classification, 'mixed-outcomes');
  assert.equal(result.failureRate, 1 / 3);
  assert.equal(result.averageDurationMs, 150);
  assert.equal(result.insufficientEvidence, false);
});

test('does not count skipped runs as failures or executions', () => {
  const result = analyzeRuns([
    { testId: 'checkout', runId: '1', outcome: 'skipped' },
    { testId: 'checkout', runId: '2', outcome: 'failed' }
  ])[0];
  assert.equal(result.executed, 1);
  assert.equal(result.skipped, 1);
  assert.equal(result.failureRate, 1);
  assert.equal(result.classification, 'consistently-failing');
  assert.equal(result.insufficientEvidence, true);
});

test('returns no-executions when everything was skipped', () => {
  const result = analyzeRuns([{ testId: 'search', runId: '1', outcome: 'skipped' }])[0];
  assert.equal(result.failureRate, null);
  assert.equal(result.classification, 'no-executions');
});

test('uses a stable order and reports passing results', () => {
  const result = analyzeRuns([
    { testId: 'z', runId: '1', outcome: 'passed' },
    { testId: 'a', runId: '1', outcome: 'passed' }
  ]);
  assert.deepEqual(result.map(item => item.testId), ['a', 'z']);
  assert.equal(result[0].classification, 'consistently-passing');
});

test('rejects duplicate results rather than overstating sample size', () => {
  assert.throws(() => analyzeRuns([
    { testId: 'a', runId: '1', outcome: 'passed' },
    { testId: 'a', runId: '1', outcome: 'failed' }
  ]), /Duplicate/);
});

test('rejects invalid outcomes and durations', () => {
  assert.throws(() => analyzeRuns([{ testId: 'a', runId: '1', outcome: 'unknown' }]), /Unknown/);
  assert.throws(() => analyzeRuns([{ testId: 'a', runId: '1', outcome: 'passed', durationMs: -5 }]), /durationMs/);
  assert.throws(() => analyzeRuns([{ testId: '', runId: '1', outcome: 'passed' }]), /nonempty/);
});

test('handles an empty input without inventing results', () => {
  assert.deepEqual(analyzeRuns([]), []);
});

test('reports complete duration coverage', () => {
  const result = analyzeRuns([
    { testId: 'login', runId: '1', outcome: 'passed', durationMs: 100 },
    { testId: 'login', runId: '2', outcome: 'failed', durationMs: 200 },
    { testId: 'login', runId: '3', outcome: 'passed', durationMs: 150 }
  ])[0];
  assert.equal(result.durationSampleCount, 3);
  assert.equal(result.durationCoverage, 1);
});

test('makes partial duration coverage explicit', () => {
  const result = analyzeRuns([
    { testId: 'login', runId: '1', outcome: 'passed', durationMs: 100 },
    { testId: 'login', runId: '2', outcome: 'failed' },
    { testId: 'login', runId: '3', outcome: 'passed' }
  ])[0];
  assert.equal(result.durationSampleCount, 1);
  assert.equal(result.durationCoverage, 1 / 3);
  assert.equal(result.averageDurationMs, 100);
});

test('skipped runs do not reduce duration coverage', () => {
  const result = analyzeRuns([
    { testId: 'login', runId: '1', outcome: 'passed', durationMs: 100 },
    { testId: 'login', runId: '2', outcome: 'skipped', durationMs: 500 }
  ])[0];
  assert.equal(result.durationSampleCount, 1);
  assert.equal(result.durationCoverage, 1);
});

test('reports no duration coverage when there are no executions', () => {
  const result = analyzeRuns([
    { testId: 'login', runId: '1', outcome: 'skipped' }
  ])[0];
  assert.equal(result.durationSampleCount, 0);
  assert.equal(result.durationCoverage, null);
  assert.equal(result.averageDurationMs, null);
});

test('counts retry-flaky passes as observed instability', () => {
  const result = analyzeRuns([
    { testId: 'login', runId: '1', outcome: 'passed', flaky: true, attemptCount: 2, retryCount: 1 },
    { testId: 'login', runId: '2', outcome: 'passed', flaky: false, attemptCount: 1, retryCount: 0 }
  ])[0];
  assert.equal(result.classification, 'consistently-passing');
  assert.equal(result.flakyPasses, 1);
  assert.equal(result.retryCount, 1);
  assert.equal(result.observedInstability, true);
  assert.equal(result.failureRate, 0);
});
test('rejects invalid retry metadata', () => {
  assert.throws(() => analyzeRuns([{ testId: 'a', runId: '1', outcome: 'failed', flaky: true }]), /flaky requires/);
  assert.throws(() => analyzeRuns([{ testId: 'a', runId: '1', outcome: 'passed', retryCount: -1 }]), /retryCount/);
  assert.throws(() => analyzeRuns([{ testId: 'a', runId: '1', outcome: 'passed', attemptCount: 2, retryCount: 0 }]), /Inconsistent/);
});
