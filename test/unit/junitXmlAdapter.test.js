const test = require('node:test');
const assert = require('node:assert/strict');
const { junitXmlToRecords } = require('../../src/reliability/junitXmlAdapter');
const { analyzeRuns } = require('../../src/reliability/analyzeRuns');
const sample = '<testsuites><testsuite name="cart" tests="3" failures="1" errors="0" skipped="1">' +
  '<testcase classname="cart.spec" name="adds &amp; totals" time="0.025"/>' +
  '<testcase classname="cart.spec" name="rejects bad item"><failure message="invalid">expected</failure></testcase>' +
  '<testcase name="optional"><skipped/></testcase></testsuite></testsuites>';
test('maps passing, failing and skipped cases and escaped attributes', () => {
  assert.deepEqual(junitXmlToRecords(sample, 'ci-01'), [
    { testId: 'cart :: cart.spec :: adds & totals', runId: 'ci-01', outcome: 'passed', durationMs: 25 },
    { testId: 'cart :: cart.spec :: rejects bad item', runId: 'ci-01', outcome: 'failed' },
    { testId: 'cart :: cart :: optional', runId: 'ci-01', outcome: 'skipped' }
  ]);
});
test('accepts single suite root and error outcome', () => {
  const xml = '<testsuite name="build" tests="1" errors="1"><testcase name="setup"><error/></testcase></testsuite>';
  assert.equal(junitXmlToRecords(xml, 'ci')[0].outcome, 'failed');
  assert.equal(analyzeRuns(junitXmlToRecords(xml, 'ci'))[0].failureRate, 1);
});
test('rejects entity declarations and external DTDs', () => {
  assert.throws(() => junitXmlToRecords('<!DOCTYPE testsuite [<!ENTITY x "a">]><testsuite name="s"/>', 'r'), /DOCTYPE/);
  assert.throws(() => junitXmlToRecords('<!DOCTYPE testsuite SYSTEM "file:///etc/passwd"><testsuite name="s"/>', 'r'), /DOCTYPE/);
});
test('rejects malformed XML and unsupported structure', () => {
  assert.throws(() => junitXmlToRecords('<testsuite name="s"><testcase name="a"></testsuite>', 'r'));
  assert.throws(() => junitXmlToRecords('<testsuite name="s"><testsuite name="nested"/></testsuite>', 'r'), /Unsupported/);
  assert.throws(() => junitXmlToRecords('<testsuite name="s"><custom/></testsuite>', 'r'), /Unsupported/);
  assert.throws(() => junitXmlToRecords('<testsuite xmlns:x="urn:test" name="s"><x:testcase name="a"/></testsuite>', 'r'), /namespaces/);
});
test('rejects conflicting outcomes and duplicate IDs', () => {
  assert.throws(() => junitXmlToRecords('<testsuite name="s"><testcase name="a"><failure/><skipped/></testcase></testsuite>', 'r'), /Conflicting/);
  assert.throws(() => junitXmlToRecords('<testsuite name="s"><testcase name="a"/><testcase name="a"/></testsuite>', 'r'), /Duplicate/);
});
test('rejects inconsistent suite totals', () => {
  assert.throws(() => junitXmlToRecords('<testsuite name="s" tests="1" errors="1"><testcase name="a"/></testsuite>', 'r'), /errors count/);
  assert.throws(() => junitXmlToRecords('<testsuite name="s" tests="2"><testcase name="a"/></testsuite>', 'r'), /tests count/);
});
test('rejects invalid durations and missing identity', () => {
  assert.throws(() => junitXmlToRecords('<testsuite name="s"><testcase name="a" time="-1"/></testsuite>', 'r'), /time/);
  assert.throws(() => junitXmlToRecords('<testsuite name="s"><testcase name="a" time="NaN"/></testsuite>', 'r'), /time/);
  assert.throws(() => junitXmlToRecords('<testsuite name="s"><testcase/></testsuite>', 'r'), /testcase name/);
  assert.throws(() => junitXmlToRecords(sample, ''), /runId/);
});
test('rejects oversized input and excessive testcase count', () => {
  assert.throws(() => junitXmlToRecords(' '.repeat(1024 * 1024 + 1), 'r'), /1 MiB/);
  const many = '<testsuite name="s">' + Array.from({ length: 5001 }, (_, i) => '<testcase name="' + i + '"/>').join('') + '</testsuite>';
  assert.throws(() => junitXmlToRecords(many, 'r'), /Too many/);
});
test('skipped duration is not counted', () => {
  const records = junitXmlToRecords('<testsuite name="s"><testcase name="a" time="10"><skipped/></testcase></testsuite>', 'r');
  assert.equal(records[0].outcome, 'skipped');
  assert.equal(Object.hasOwn(records[0], 'durationMs'), false);
});


test('validates aggregate counts across multiple JUnit suites', () => {
  const xml = '<testsuites tests="3" failures="1" errors="1" skipped="0">' +
    '<testsuite name="a" tests="2" failures="1"><testcase name="ok"/>' +
    '<testcase name="bad"><failure/></testcase></testsuite>' +
    '<testsuite name="b" tests="1" errors="1"><testcase name="broken"><error/></testcase></testsuite>' +
    '</testsuites>';
  assert.deepEqual(junitXmlToRecords(xml, 'ci').map(record => record.outcome),
    ['passed', 'failed', 'failed']);
});

test('rejects incorrect root totals rather than silently accepting missing results', () => {
  const xml = '<testsuites tests="2" failures="0">' +
    '<testsuite name="a"><testcase name="only"><failure/></testcase></testsuite>' +
    '</testsuites>';
  assert.throws(() => junitXmlToRecords(xml, 'ci'), /testsuites tests count/);
  const xmlFailure = '<testsuites failures="0"><testsuite name="a">' +
    '<testcase name="failed"><failure/></testcase></testsuite></testsuites>';
  assert.throws(() => junitXmlToRecords(xmlFailure, 'ci'), /testsuites failures count/);
});


test('rejects default and unused prefixed namespace declarations', () => {
  assert.throws(() => junitXmlToRecords('<testsuite xmlns="urn:custom" name="s"><testcase name="a"/></testsuite>', 'r'), /namespaces/);
  assert.throws(() => junitXmlToRecords('<testsuite xmlns:unused="urn:custom" name="s"><testcase name="a"/></testsuite>', 'r'), /namespaces/);
});

test('rejects prefixed XML attributes even without namespace declarations', () => {
  assert.throws(() => junitXmlToRecords('<testsuite name="s" xml:lang="en"><testcase name="a"/></testsuite>', 'r'), /namespaces/);
  assert.throws(() => junitXmlToRecords('<testsuite name="s"><testcase name="a" x:meta="value"/></testsuite>', 'r'), /namespaces/);
});

test('normalizes run IDs for consistent multi-run analysis', () => {
  const records = junitXmlToRecords('<testsuite name="s"><testcase name="a"/></testsuite>', '  ci-42  ');
  assert.equal(records[0].runId, 'ci-42');
});

test('validates testcase duration even when the testcase is skipped', () => {
  assert.throws(() => junitXmlToRecords('<testsuite name="s"><testcase name="a" time="NaN"><skipped/></testcase></testsuite>', 'r'), /time/);
  assert.throws(() => junitXmlToRecords('<testsuite name="s"><testcase name="a" time="-1"><skipped/></testcase></testsuite>', 'r'), /time/);
});

test('rejects unexpected text and CDATA in structural JUnit nodes', () => {
  assert.throws(() => junitXmlToRecords(
    '<testsuites>unexpected<testsuite name="s"/></testsuites>', 'r'), /text inside testsuites/);
  assert.throws(() => junitXmlToRecords(
    '<testsuite name="s">unexpected<testcase name="a"/></testsuite>', 'r'), /text inside testsuite/);
  assert.throws(() => junitXmlToRecords(
    '<testsuite name="s"><testcase name="a"><![CDATA[unexpected]]></testcase></testsuite>', 'r'),
    /text inside testcase/);
  assert.throws(() => junitXmlToRecords(
    '<testsuite name="s"><properties>unexpected</properties></testsuite>', 'r'), /text inside properties/);
});

test('permits formatting whitespace and diagnostic text inside supported JUnit nodes', () => {
  const xml = '<testsuite name="s" tests="2" failures="1">\n' +
    '  <properties><property name="owner" value="qa"/></properties>\n' +
    '  <testcase name="a"><system-out><![CDATA[diagnostic output]]></system-out></testcase>\n' +
    '  <testcase name="b"><failure><![CDATA[expected failure details]]></failure></testcase>\n' +
    '</testsuite>';
  assert.deepEqual(junitXmlToRecords(xml, 'r').map(record => record.outcome), ['passed', 'failed']);
});


test('preserves Surefire flakyFailure attempts as a single flaky pass', () => {
  const xml = '<testsuite name="checkout" tests="1" failures="0">' +
    '<testcase name="payment"><flakyFailure message="first attempt"/>' +
    '<flakyFailure message="second attempt"/></testcase></testsuite>';
  const records = junitXmlToRecords(xml, 'ci-1');
  assert.deepEqual(records, [{
    testId: 'checkout :: checkout :: payment', runId: 'ci-1',
    outcome: 'passed', flaky: true, attemptCount: 3, retryCount: 2
  }]);
  const summary = analyzeRuns(records)[0];
  assert.equal(summary.flakyPasses, 1);
  assert.equal(summary.retryCount, 2);
  assert.equal(summary.executed, 1);
  assert.equal(summary.observedInstability, true);
});

test('rejects conflicting Surefire retry and terminal markers', () => {
  assert.throws(() => junitXmlToRecords(
    '<testsuite name="s"><testcase name="a"><flakyFailure/><failure/></testcase></testsuite>', 'r'),
  /Conflicting/);
  assert.throws(() => junitXmlToRecords(
    '<testsuite name="s"><testcase name="a"><skipped/><flakyFailure/></testcase></testsuite>', 'r'),
  /Conflicting/);
});

test('does not silently accept unsupported Surefire rerunFailure elements', () => {
  assert.throws(() => junitXmlToRecords(
    '<testsuite name="s"><testcase name="a"><rerunFailure/></testcase></testsuite>', 'r'),
  /Unsupported/);
});
