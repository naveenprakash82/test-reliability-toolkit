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
