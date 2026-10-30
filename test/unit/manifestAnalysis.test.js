const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { analyzeManifest } = require('../../src/reliability/manifestAnalysis');

function setup(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (name, body) => fs.writeFileSync(path.join(root, name), JSON.stringify(body));
  const report = status => ({testResults:[{name:'x.test.js', assertionResults:[{fullName:'x',status}]}]});
  write('first.json', report('passed'));
  write('second.json', report('failed'));
  return {root,write,manifest:runs=>{write('manifest.json',{format:'jest',runs});return path.join(root,'manifest.json');}};
}
test('ingests two reports and identifies mixed outcomes', t => {
  const f=setup(t); const result=analyzeManifest(f.manifest([{runId:'one',file:'first.json'},{runId:'two',file:'second.json'}]));
  assert.equal(result.runCount,2); assert.equal(result.tests[0].failureRate,0.5);
  assert.deepEqual(result.tests[0].missingRuns,[]);
});
test('distinguishes missing tests from skipped executions', t => {
  const f=setup(t); f.write('second.json',{testResults:[]});
  const result=analyzeManifest(f.manifest([{runId:'one',file:'first.json'},{runId:'two',file:'second.json'}]));
  assert.deepEqual(result.tests[0].missingRuns,['two']);assert.equal(result.tests[0].skipped,0);
});
test('rejects duplicate IDs and repeated report paths', t => {
  const f=setup(t);
  assert.throws(()=>analyzeManifest(f.manifest([{runId:'one',file:'first.json'},{runId:'one',file:'second.json'}])),/Duplicate runId/);
  assert.throws(()=>analyzeManifest(f.manifest([{runId:'one',file:'first.json'},{runId:'two',file:'first.json'}])),/Duplicate report path/);
});
test('warns when separate files have identical bytes', t => {
  const f=setup(t);f.write('copy.json',{testResults:[{name:'x.test.js',assertionResults:[{fullName:'x',status:'passed'}]}]});
  const warnings=[];analyzeManifest(f.manifest([{runId:'one',file:'first.json'},{runId:'two',file:'copy.json'}]),w=>warnings.push(w));
  assert.equal(warnings.length,1);
});
test('rejects absolute and traversing paths', t => {
  const f=setup(t);
  assert.throws(()=>analyzeManifest(f.manifest([{runId:'one',file:'/tmp/anything.json'}])),/relative file path/);
  const outside=path.join(path.dirname(f.root),'outside-'+path.basename(f.root)+'.json');
  fs.writeFileSync(outside,'{}');
  t.after(()=>fs.rmSync(outside,{force:true}));
  assert.throws(()=>analyzeManifest(f.manifest([{runId:'one',file:'../'+path.basename(outside)}])),/escapes manifest directory/);
});
test('rejects unsupported format and empty runs',t=>{
  const f=setup(t);f.write('manifest.json',{format:'xml',runs:[]});
  assert.throws(()=>analyzeManifest(path.join(f.root,'manifest.json')),/Expected format/);
});

test('rejects collections exceeding the aggregate report byte limit', t => {
  const f = setup(t);
  const padding = ' '.repeat(17 * 1024 * 1024);
  fs.appendFileSync(path.join(f.root, 'first.json'), padding);
  fs.appendFileSync(path.join(f.root, 'second.json'), padding);
  assert.throws(() => analyzeManifest(f.manifest([
    { runId: 'one', file: 'first.json' },
    { runId: 'two', file: 'second.json' }
  ])), /32 MiB aggregate limit/);
});


test('ingests JUnit XML from two separate runs with stable testcase identifiers', t => {
  const f = setup(t);
  const xml = marker => '<testsuite name="checkout" tests="1" failures="' + (marker ? 1 : 0) + '">' +
    '<testcase classname="checkout.spec" name="total">' + (marker ? '<failure/>' : '') + '</testcase></testsuite>';
  fs.writeFileSync(path.join(f.root, 'one.xml'), xml(false));
  fs.writeFileSync(path.join(f.root, 'two.xml'), xml(true));
  f.write('manifest.json', { format: 'junit', runs: [
    { runId: 'ci-01', file: 'one.xml' }, { runId: 'ci-02', file: 'two.xml' }
  ] });
  const result = analyzeManifest(path.join(f.root, 'manifest.json'));
  assert.equal(result.format, 'junit');
  assert.equal(result.runCount, 2);
  assert.equal(result.tests.length, 1);
  assert.equal(result.tests[0].failureRate, 0.5);
  assert.deepEqual(result.tests[0].missingRuns, []);
});

test('rejects unsupported or unsafe JUnit XML in a manifest', t => {
  const f = setup(t);
  fs.writeFileSync(path.join(f.root, 'unsafe.xml'), '<!DOCTYPE testsuite SYSTEM "file:///etc/passwd"><testsuite name="s"/>');
  f.write('manifest.json', { format: 'junit', runs: [{ runId: 'ci-01', file: 'unsafe.xml' }] });
  assert.throws(() => analyzeManifest(path.join(f.root, 'manifest.json')), /DOCTYPE/);
});

test('rejects a Jest manifest with a suite execution error rather than undercounting failures', t => {
  const f = setup(t);
  f.write('first.json', { testResults: [{
    name: 'setup.test.js', status: 'failed', assertionResults: [],
    testExecError: { message: 'module initialization failed' }
  }] });
  assert.throws(() => analyzeManifest(f.manifest([
    { runId: 'ci-01', file: 'first.json' },
    { runId: 'ci-02', file: 'second.json' }
  ])), /suite failed outside recorded assertions/);
});

test('rejects a non-regular manifest before attempting to read it', t => {
  const f = setup(t);
  assert.throws(() => analyzeManifest(f.root), /Manifest must be a regular file/);
});

test('rejects oversized JUnit XML reports before reading their contents', t => {
  const f = setup(t);
  fs.writeFileSync(path.join(f.root, 'large.xml'), ' '.repeat(1024 * 1024 + 1));
  f.write('manifest.json', { format: 'junit', runs: [
    { runId: 'ci-01', file: 'large.xml' }
  ] });
  assert.throws(() => analyzeManifest(path.join(f.root, 'manifest.json')),
    /JUnit report exceeds 1 MiB limit/);
});
