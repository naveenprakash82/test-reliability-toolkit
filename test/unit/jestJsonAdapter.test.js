const test = require('node:test');
const assert = require('node:assert/strict');
const { jestJsonToRecords } = require('../../src/reliability/jestJsonAdapter');

const sample = {
  testResults: [
    { name: 'specs/login.test.js', assertionResults: [
      { fullName: 'login accepts valid credentials', status: 'passed', duration: 0 },
      { fullName: 'login rejects invalid credentials', status: 'failed', duration: 45 },
      { fullName: 'login requires setup', status: 'pending', duration: null }
    ] },
    { name: 'specs/cart.test.js', assertionResults: [
      { fullName: 'cart shows totals', status: 'passed' }
    ] }
  ]
};

test('maps Jest JSON assertion outcomes and timing', () => {
  assert.deepEqual(jestJsonToRecords(sample, 'run-001'), [
    { testId: 'specs/login.test.js :: login accepts valid credentials', runId: 'run-001', outcome: 'passed', durationMs: 0 },
    { testId: 'specs/login.test.js :: login rejects invalid credentials', runId: 'run-001', outcome: 'failed', durationMs: 45 },
    { testId: 'specs/login.test.js :: login requires setup', runId: 'run-001', outcome: 'skipped' },
    { testId: 'specs/cart.test.js :: cart shows totals', runId: 'run-001', outcome: 'passed' }
  ]);
});

test('treats todo, disabled and skipped as skipped', () => {
  const report = { testResults: [{ name: 'spec', assertionResults: ['todo', 'disabled', 'skipped'].map(status => ({ fullName: status, status, duration: 5 })) }] };
  const records = jestJsonToRecords(report, 'r');
  assert.deepEqual(records.map(r => r.outcome), ['skipped', 'skipped', 'skipped']);
  assert.ok(records.every(r => !Object.hasOwn(r, 'durationMs')));
});

test('rejects malformed reports, unknown statuses and invalid durations', () => {
  assert.throws(() => jestJsonToRecords({}, 'r'), /testResults/);
  assert.throws(() => jestJsonToRecords(sample, ''), /runId/);
  assert.throws(() => jestJsonToRecords({ testResults: [{ name: 'spec', assertionResults: [{ fullName: 'x', status: 'unexpected' }] }] }, 'r'), /Unsupported/);
  assert.throws(() => jestJsonToRecords({ testResults: [{ name: 'spec', assertionResults: [{ fullName: 'x', status: 'passed', duration: -1 }] }] }, 'r'), /duration/);
});

test('rejects duplicate identifiers in one run', () => {
  const report = { testResults: [{ name: 'spec', assertionResults: [
    { fullName: 'same', status: 'passed' }, { fullName: 'same', status: 'failed' }
  ] }] };
  assert.throws(() => jestJsonToRecords(report, 'r'), /Duplicate/);
});

test('empty suites return an empty list', () => {
  assert.deepEqual(jestJsonToRecords({ testResults: [] }, 'r'), []);
});

test('converted results are accepted by the existing reliability analyzer', () => {
  const { analyzeRuns } = require('../../src/reliability/analyzeRuns');
  const records = jestJsonToRecords(sample, 'run-001');
  const summary = analyzeRuns(records);
  assert.equal(summary.length, 4);
  const failed = summary.find(item => item.testId.endsWith('login rejects invalid credentials'));
  assert.equal(failed.failed, 1);
  assert.equal(failed.failureRate, 1);
});

test('rejects retry evidence rather than treating a retried Jest pass as clean', () => {
  const base = { testResults: [{ name: 'spec', assertionResults: [
    { fullName: 'retried', status: 'passed', invocations: 2, retryReasons: ['initial failure'] }
  ] }] };
  assert.throws(() => jestJsonToRecords(base, 'r'), /retry evidence/);
  const reasonsOnly = structuredClone(base);
  delete reasonsOnly.testResults[0].assertionResults[0].invocations;
  assert.throws(() => jestJsonToRecords(reasonsOnly, 'r'), /retry evidence/);
  const invocationsOnly = structuredClone(base);
  delete invocationsOnly.testResults[0].assertionResults[0].retryReasons;
  assert.throws(() => jestJsonToRecords(invocationsOnly, 'r'), /retry evidence/);
});

test('accepts single Jest invocation and empty retry reasons', () => {
  const report = { testResults: [{ name: 'spec', assertionResults: [
    { fullName: 'clean', status: 'passed', invocations: 1, retryReasons: [] }
  ] }] };
  assert.equal(jestJsonToRecords(report, 'r')[0].outcome, 'passed');
});

test('rejects malformed Jest retry metadata', () => {
  for (const invocations of [-1, 1.5, '2']) {
    const report = { testResults: [{ name: 'spec', assertionResults: [
      { fullName: 'x', status: 'passed', invocations }
    ] }] };
    assert.throws(() => jestJsonToRecords(report, 'r'), /invocations/);
  }
  const report = { testResults: [{ name: 'spec', assertionResults: [
    { fullName: 'x', status: 'passed', retryReasons: 'error' }
  ] }] };
  assert.throws(() => jestJsonToRecords(report, 'r'), /retryReasons/);
});
