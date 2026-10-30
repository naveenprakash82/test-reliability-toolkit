const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildSummary } = require('../../src/reliability/batchCli');
const report = status => ({ testResults: [{name:'cart.test.js', assertionResults:[{fullName:'calculates total',status,duration:10}]}] });
function withFiles(contents, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'batch-cli-'));
  try {
    const files = contents.map((content, i) => {
      const file = path.join(dir, 'report' + i + '.json');
      fs.writeFileSync(file, typeof content === 'string' ? content : JSON.stringify(content));
      return file;
    });
    return fn(files);
  } finally { fs.rmSync(dir, { recursive:true, force:true }); }
}
test('summarizes two distinct reports', () => {
  withFiles([report('passed'),report('failed')], ([a,b]) => {
    const summary = buildSummary(['jest','ci-1',a,'ci-2',b], () => assert.fail('unexpected warning'));
    assert.equal(summary[0].classification,'mixed-outcomes');
    assert.deepEqual(summary[0].missingRuns,[]);
  });
});
test('rejects invalid CLI argument counts', () => {
  assert.throws(() => buildSummary([]), /Usage/);
  assert.throws(() => buildSummary(['jest','ci-1']), /Usage/);
  assert.throws(() => buildSummary(['jest','ci-1','a.json','ci-2']), /Usage/);
});
test('rejects repeated file paths', () => {
  withFiles([report('passed')], ([a]) => {
    assert.throws(() => buildSummary(['jest','ci-1',a,'ci-2',a]), /each run needs its own report/);
  });
});
test('rejects a symlink alias of the same report', () => {
  withFiles([report('passed')], ([a]) => {
    const alias = path.join(path.dirname(a),'alias.json');
    fs.symlinkSync(a,alias);
    assert.throws(() => buildSummary(['jest','ci-1',a,'ci-2',alias]), /each run needs its own report/);
  });
});
test('warns about byte-identical distinct files', () => {
  withFiles([report('passed'),report('passed')], ([a,b]) => {
    const warnings=[];
    const summary=buildSummary(['jest','ci-1',a,'ci-2',b], m=>warnings.push(m));
    assert.equal(summary[0].executed,2);
    assert.equal(warnings.length,1);
    assert.match(warnings[0],/byte-identical/);
  });
});
test('read and parse errors identify the file', () => {
  withFiles(['{ not json'], ([bad]) => {
    assert.throws(() => buildSummary(['jest','ci-1',bad]), /Invalid JSON in .*report0\.json/);
  });
  assert.throws(() => buildSummary(['jest','ci-1','/nonexistent/report.json']), /Cannot read report \/nonexistent\/report\.json/);
});

test('rejects more than 100 runs before reading reports', () => {
  const pairs = Array.from({ length: 101 }, (_, i) => ['ci-' + i, 'unused-' + i + '.json']).flat();
  assert.throws(() => buildSummary(['jest', ...pairs]), /at most 100 runs/);
});

test('rejects non-file inputs and reports larger than 20 MiB', () => {
  withFiles([report('passed')], ([a]) => {
    assert.throws(() => buildSummary(['jest', 'ci-1', path.dirname(a)]), /not a regular file/);
    fs.truncateSync(a, 20 * 1024 * 1024 + 1);
    assert.throws(() => buildSummary(['jest', 'ci-1', a]), /20 MiB limit/);
  });
});

test('rejects batches exceeding 32 MiB before reading the final report', () => {
  withFiles([report('passed'), report('failed')], ([a, b]) => {
    const padding = ' '.repeat(17 * 1024 * 1024);
    fs.appendFileSync(a, padding);
    fs.appendFileSync(b, padding);
    assert.throws(() => buildSummary(['jest', 'ci-1', a, 'ci-2', b]), /32 MiB aggregate limit/);
  });
});

test('compares restricted JUnit XML reports across two runs', () => {
  const xml = failed => '<testsuite name="cart" tests="1" failures="' + (failed ? 1 : 0) + '">' +
    '<testcase classname="cart.spec" name="total">' + (failed ? '<failure/>' : '') +
    '</testcase></testsuite>';
  withFiles([xml(false), xml(true)], ([a, b]) => {
    const summary = buildSummary(['junit', 'ci-1', a, 'ci-2', b]);
    assert.equal(summary.length, 1);
    assert.equal(summary[0].classification, 'mixed-outcomes');
    assert.equal(summary[0].failureRate, 0.5);
    assert.deepEqual(summary[0].missingRuns, []);
  });
});

test('rejects unsafe JUnit XML and limits JUnit input before reading', () => {
  withFiles(['<!DOCTYPE testsuite SYSTEM "file:///etc/passwd"><testsuite name="s"/>'], ([file]) => {
    assert.throws(() => buildSummary(['junit', 'ci-1', file]), /DOCTYPE/);
  });
  withFiles(['<testsuite name="s"/>'], ([file]) => {
    fs.truncateSync(file, 1024 * 1024 + 1);
    assert.throws(() => buildSummary(['junit', 'ci-1', file]), /JUnit report exceeds 1 MiB limit/);
  });
});

test('rejects unknown batch report formats before opening files', () => {
  assert.throws(() => buildSummary(['unknown', 'ci-1', 'missing-file']), /Unsupported report format/);
});
