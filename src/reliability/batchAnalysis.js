const { analyzeRuns } = require('./analyzeRuns');
const { jestJsonToRecords } = require('./jestJsonAdapter');
const { playwrightJsonToRecords } = require('./playwrightJsonAdapter');
const { junitXmlToRecords } = require('./junitXmlAdapter');

function analyzeReportBatch(format, runs) {
  const adapters = { jest: jestJsonToRecords, playwright: playwrightJsonToRecords, junit: junitXmlToRecords };
  if (!Object.prototype.hasOwnProperty.call(adapters, format)) throw new TypeError('format must be jest, playwright, or junit');
  if (!Array.isArray(runs) || runs.length === 0) throw new TypeError('runs must be a nonempty array');
  const seen = new Set();
  const records = [];
  const runsByTest = new Map();
  for (const run of runs) {
    if (!run || typeof run !== 'object' || Array.isArray(run) ||
      typeof run.runId !== 'string' || !run.runId.trim()) {
      throw new TypeError('Each run needs a nonempty runId and report');
    }
    const runId = run.runId.trim();
    if (seen.has(runId)) throw new Error('Duplicate runId: ' + runId);
    seen.add(runId);
    for (const record of adapters[format](run.report, runId)) {
      records.push(record);
      if (!runsByTest.has(record.testId)) runsByTest.set(record.testId, new Set());
      runsByTest.get(record.testId).add(runId);
    }
  }
  const runIds = Array.from(seen);
  return analyzeRuns(records).map(summary => {
    const observed = runsByTest.get(summary.testId);
    return {
      ...summary,
      totalRuns: runIds.length,
      observedRuns: observed.size,
      missingRuns: runIds.filter(id => !observed.has(id)),
      runsSeen: runIds.filter(id => observed.has(id))
    };
  });
}
module.exports = { analyzeReportBatch };
