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
