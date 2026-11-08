const test = require('node:test');
const assert = require('node:assert/strict');
const { playwrightJsonToRecords } = require('../../src/reliability/playwrightJsonAdapter');
const report = {
  suites: [{ title: 'account.spec.ts', file: 'account.spec.ts', specs: [], suites: [{
    title: 'sign in', specs: [
      { title: 'accepts user', file: 'account.spec.ts', tests: [
        { projectName: 'chromium', status: 'expected', results: [{ status: 'passed', duration: 40 }] },
        { projectName: 'firefox', status: 'unexpected', results: [{ status: 'failed', duration: 70 }] }
      ] },
      { title: 'handles retries', tests: [{ projectName: 'chromium', results: [
        { status: 'failed', duration: 21 }, { status: 'passed', duration: 32 }
      ] }] },
      { title: 'is skipped', tests: [{ projectName: 'chromium', status: 'skipped', results: [] }] }
    ], suites: []
  }] }]
};
test('converts nested suites and distinguishes projects', () => {
  const rows = playwrightJsonToRecords(report, 'run-1');
  assert.equal(rows.length, 4);
  assert.equal(rows[0].outcome, 'passed');
  assert.equal(rows[1].outcome, 'failed');
  assert.notEqual(rows[0].testId, rows[1].testId);
});
test('counts final retry once rather than treating retries as runs', () => {
  const rows = playwrightJsonToRecords(report, 'run-1');
  const row = rows.find(r => r.testId.includes('handles retries'));
  assert.equal(row.outcome, 'passed');
  assert.equal(row.durationMs, 32);
});
test('represents skipped tests without timing data', () => {
  const row = playwrightJsonToRecords(report, 'r').find(r => r.outcome === 'skipped');
  assert.equal(Object.hasOwn(row, 'durationMs'), false);
});
test('rejects missing runId and malformed suites', () => {
  assert.throws(() => playwrightJsonToRecords(report, ''), /runId/);
  assert.throws(() => playwrightJsonToRecords({}, 'r'), /suites/);
  assert.throws(() => playwrightJsonToRecords({ suites: [{ title: 'bad' }] }, 'r'), /arrays/);
});
test('rejects duplicate names for same project', () => {
  const duplicate = structuredClone(report);
  duplicate.suites[0].suites[0].specs.push(structuredClone(duplicate.suites[0].suites[0].specs[0]));
  assert.throws(() => playwrightJsonToRecords(duplicate, 'r'), /Duplicate/);
});
test('rejects unknown statuses and invalid duration', () => {
  const broken = structuredClone(report);
  broken.suites[0].suites[0].specs[0].tests[0].results[0].status = 'unknown';
  assert.throws(() => playwrightJsonToRecords(broken, 'r'), /Unsupported/);
  broken.suites[0].suites[0].specs[0].tests[0].results[0] = {status:'passed',duration:-3};
  assert.throws(() => playwrightJsonToRecords(broken, 'r'), /duration/);
});
test('returns empty input without synthetic test results', () => {
  assert.deepEqual(playwrightJsonToRecords({suites:[]}, 'r'), []);
});

test('preserves retry-aware instability without inflating run count', () => {
  const rows = playwrightJsonToRecords(report, 'r');
  const retry = rows.find(row => row.testId.includes('handles retries'));
  assert.equal(retry.flaky, true);
  assert.equal(retry.attemptCount, 2);
  assert.equal(retry.retryCount, 1);
  assert.equal(rows.find(row => row.testId.includes('accepts user') && row.testId.includes('chromium')).flaky, false);
});
test('rejects malformed earlier attempts and inconsistent flaky status', () => {
  const broken = structuredClone(report);
  broken.suites[0].suites[0].specs[1].tests[0].results[0].status = 'unknown';
  assert.throws(() => playwrightJsonToRecords(broken, 'r'), /attempt status/);
  const mismatch = structuredClone(report);
  mismatch.suites[0].suites[0].specs[0].tests[0].status = 'flaky';
  assert.throws(() => playwrightJsonToRecords(mismatch, 'r'), /flaky status/);
});
