const test = require('node:test');
const assert = require('node:assert/strict');
const { jestJsonToRecords } = require('../../src/reliability/jestJsonAdapter');

const assertion = (status = 'passed') => ({ fullName: 'works', status });
const suite = (overrides = {}) => ({ name: 'example.test.js', assertionResults: [assertion()], ...overrides });

test('rejects Jest suite execution errors instead of silently omitting failures', () => {
  assert.throws(() => jestJsonToRecords({ testResults: [suite({
    assertionResults: [], testExecError: { message: 'module failed to load' }
  })] }, 'run-1'), /suite failed outside recorded assertions/i);
});

test('rejects failed suite without a failed assertion', () => {
  assert.throws(() => jestJsonToRecords({ testResults: [suite({ status: 'failed' })] }, 'run-1'), /suite failed outside recorded assertions/i);
});

test('rejects report-level runtime errors even when other suites have assertions', () => {
  assert.throws(() => jestJsonToRecords({ numRuntimeErrorTestSuites: 1, testResults: [suite()] }, 'run-1'), /runtime errors/i);
});

test('rejects failed report with no assertion outcomes', () => {
  assert.throws(() => jestJsonToRecords({ success: false, testResults: [] }, 'run-1'), /no failed assertion outcomes/i);
});

test('preserves ordinary passing, failing and empty successful suites', () => {
  assert.deepEqual(jestJsonToRecords({ testResults: [suite()] }, 'run-1').map(r => r.outcome), ['passed']);
  assert.deepEqual(jestJsonToRecords({ testResults: [suite({ status: 'failed', assertionResults: [assertion('failed')] })] }, 'run-1').map(r => r.outcome), ['failed']);
  assert.deepEqual(jestJsonToRecords({ testResults: [] }, 'run-1'), []);
});

test('rejects report-level failure even if all recorded assertions passed', () => {
  assert.throws(() => jestJsonToRecords({ success: false, testResults: [suite()] }, 'run-1'), /no failed assertion outcomes/i);
});


test('rejects report summary totals that disagree with parsed assertions', () => {
  const report = { testResults: [suite()] };
  assert.throws(() => jestJsonToRecords({ ...report, numFailedTests: 1 }, 'r'), /numFailedTests count/);
  assert.throws(() => jestJsonToRecords({ ...report, numPassedTests: 2 }, 'r'), /numPassedTests count/);
  assert.throws(() => jestJsonToRecords({ ...report, numTotalTests: 2 }, 'r'), /numTotalTests count/);
});

test('accepts consistent Jest summary totals and optional missing fields', () => {
  const report = { testResults: [suite({ assertionResults: [assertion('passed'),
    { fullName: 'fails', status: 'failed' }, { fullName: 'pending', status: 'pending' }] })],
    numTotalTests: 3, numPassedTests: 1, numFailedTests: 1 };
  assert.deepEqual(jestJsonToRecords(report, 'r').map(record => record.outcome),
    ['passed', 'failed', 'skipped']);
});

test('rejects malformed Jest summary totals', () => {
  for (const value of [-1, 1.5, '1', null, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => jestJsonToRecords({ testResults: [suite()], numTotalTests: value }, 'r'),
      /Invalid Jest numTotalTests/);
  }
});
