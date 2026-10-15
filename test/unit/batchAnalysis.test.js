const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeReportBatch } = require('../../src/reliability/batchAnalysis');

const jestReport = status => ({
  testResults: [{ name: 'cart.test.js', assertionResults: [
    { fullName: 'calculates total', status, duration: 10 }
  ] }]
});
const playwrightReport = status => ({
  suites: [{ title: 'cart.spec.ts', file: 'cart.spec.ts', specs: [
    { title: 'calculates total', tests: [{ projectName: 'chromium', results: [{ status, duration: 20 }] }] }
  ], suites: [] }]
});

test('compares distinct Jest CI executions', () => {
  const summary = analyzeReportBatch('jest', [
    { runId: 'ci-101', report: jestReport('passed') },
    { runId: 'ci-102', report: jestReport('failed') },
    { runId: 'ci-103', report: jestReport('passed') }
  ]);
  assert.equal(summary.length, 1);
  assert.equal(summary[0].classification, 'mixed-outcomes');
  assert.equal(summary[0].executed, 3);
  assert.equal(summary[0].failureRate, 1 / 3);
});

test('compares distinct Playwright executions', () => {
  const summary = analyzeReportBatch('playwright', [
    { runId: 'ci-101', report: playwrightReport('passed') },
    { runId: 'ci-102', report: playwrightReport('failed') }
  ]);
  assert.equal(summary[0].classification, 'mixed-outcomes');
  assert.equal(summary[0].durationSampleCount, 2);
});

test('rejects duplicate run IDs before inflating sample counts', () => {
  assert.throws(() => analyzeReportBatch('jest', [
    { runId: 'same', report: jestReport('passed') },
    { runId: 'same', report: jestReport('failed') }
  ]), /Duplicate runId/);
});

test('rejects invalid input and unsupported reporter formats', () => {
  assert.throws(() => analyzeReportBatch('junit', []), /format/);
  assert.throws(() => analyzeReportBatch('jest', []), /nonempty/);
  assert.throws(() => analyzeReportBatch('jest', [{runId:'',report:jestReport('passed')}]), /runId/);
  assert.throws(() => analyzeReportBatch('jest', [{runId:'one',report:{}}]), /Jest JSON/);
});

test('a missing test in one report is not automatically treated as skipped', () => {
  const summary = analyzeReportBatch('jest', [
    { runId: 'ci-101', report: jestReport('passed') },
    { runId: 'ci-102', report: {testResults:[]} }
  ]);
  assert.equal(summary[0].executed, 1);
  assert.equal(summary[0].skipped, 0);
});
