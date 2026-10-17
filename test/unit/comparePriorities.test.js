const test = require('node:test');
const assert = require('node:assert/strict');
const { comparePriorities } = require('../../src/reliability/comparePriorities');
const record = (testId, runId, outcome) => ({ testId, runId, outcome });
test('compares ordering and reveals changed mapping influence rather than claiming accuracy', () => {
  const input = [
    record('a', '1', 'failed'), record('a', '2', 'passed'), record('a', '3', 'failed'),
    record('b', '1', 'passed'), record('b', '2', 'passed'), record('b', '3', 'passed')
  ];
  const result = comparePriorities(input, [
    { testId: 'a', components: ['other'] },
    { testId: 'b', components: ['changed'] }
  ], { changedComponents: ['changed'] });
  assert.deepEqual(result.baselineOrder, ['a', 'b']);
  assert.deepEqual(result.ranking.map(x => x.testId), ['a', 'b']);
  assert.equal(result.ranking[0].observedFailureRate, 2 / 3);
  assert.match(result.methodology.limitation, /not establish predictive/);
});
test('distinguishes historical failures from a changed never-observed test', () => {
  const result = comparePriorities([
    record('known', '1', 'failed'), record('known', '2', 'passed')
  ], [
    { testId: 'known', components: [] },
    { testId: 'unobserved', components: ['change'] }
  ], { changedComponents: ['change'] });
  assert.deepEqual(result.baselineOrder, ['known', 'unobserved']);
  assert.equal(result.ranking[0].testId, 'unobserved');
  assert.equal(result.ranking[0].observedFailureRate, null);
  assert.equal(result.ranking[0].insufficientEvidence, true);
  assert.equal(result.ranking[0].rankDifference, 1);
});
test('stable tie breaking when there is no execution data', () => {
  const result = comparePriorities([], [
    { testId: 'b', components: [] }, { testId: 'a', components: [] }
  ]);
  assert.deepEqual(result.baselineOrder, ['a', 'b']);
  assert.deepEqual(result.ranking.map(x => x.testId), ['a', 'b']);
});
test('does not hide skipped-only tests behind a false zero failure rate', () => {
  const result = comparePriorities([record('skipped', '1', 'skipped'), record('passed','1','passed')], []);
  assert.deepEqual(result.baselineOrder, ['passed', 'skipped']);
  assert.equal(result.ranking.find(x => x.testId === 'skipped').observedFailureRate, null);
});
