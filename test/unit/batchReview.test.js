const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeReportBatch } = require('../../src/reliability/batchAnalysis');
const jestReport = status => ({testResults:[{name:'cart.test.js',assertionResults:[{fullName:'calculates total',status,duration:10}]}]});
test('missing runs are reported without being counted as skipped', () => {
 const result=analyzeReportBatch('jest',[{runId:'ci-1',report:jestReport('passed')},{runId:'ci-2',report:{testResults:[]}},{runId:'ci-3',report:jestReport('failed')}])[0];
 assert.equal(result.observedRuns,2);
 assert.deepEqual(result.missingRuns,['ci-2']);
 assert.equal(result.totalRuns,3);
 assert.equal(result.skipped,0);
});
test('run identifiers are normalized before duplicate detection', () => {
 assert.throws(()=>analyzeReportBatch('jest',[{runId:'ci-1',report:jestReport('passed')},{runId:' ci-1 ',report:jestReport('failed')}]),/Duplicate runId/);
});
test('invalid run objects and whitespace-only IDs are rejected', () => {
 for(const run of [null,[],{runId:'  ',report:jestReport('passed')}]) assert.throws(()=>analyzeReportBatch('jest',[run]),/runId/);
});
test('250000 assertions do not exceed argument limits', () => {
 const assertionResults=Array.from({length:250000},(_,i)=>({fullName:'test '+i,status:'passed',duration:1}));
 const summary=analyzeReportBatch('jest',[{runId:'large',report:{testResults:[{name:'large.test.js',assertionResults}]}}]);
 assert.equal(summary.length,250000);
});
