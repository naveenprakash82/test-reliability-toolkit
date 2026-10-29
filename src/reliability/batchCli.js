const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { analyzeReportBatch } = require('./batchAnalysis');
const { MAX_BYTES: MAX_JUNIT_BYTES } = require('./junitXmlAdapter');

const USAGE = 'Usage: npm run analyze:batch -- <jest|playwright|junit> <runId> <report> [<runId> <report> ...]';
const MAX_RUNS = 100;
const MAX_REPORT_BYTES = 20 * 1024 * 1024;
const MAX_TOTAL_REPORT_BYTES = 32 * 1024 * 1024;

function buildSummary(args, warn = message => console.error(message)) {
  if (!Array.isArray(args) || args.length < 3 || args.length % 2 !== 1) throw new Error(USAGE);
  const [format, ...pairs] = args;
  if (!['jest', 'playwright', 'junit'].includes(format)) throw new TypeError('Unsupported report format: ' + format);
  if (pairs.length / 2 > MAX_RUNS) throw new Error('Batch supports at most 100 runs');
  const runs = [];
  let totalReportBytes = 0;
  const filesSeen = new Map();
  const digestsSeen = new Map();
  for (let i = 0; i < pairs.length; i += 2) {
    const runId = pairs[i];
    const file = pairs[i + 1];
    let canonicalPath;
    let content;
    try {
      canonicalPath = fs.realpathSync(path.resolve(file));
      if (filesSeen.has(canonicalPath)) {
        throw new Error('Report file ' + file + ' was supplied for both runs "' +
          filesSeen.get(canonicalPath) + '" and "' + runId + '"; each run needs its own report');
      }
      const stat = fs.statSync(canonicalPath);
      if (!stat.isFile()) throw new Error('Report is not a regular file');
      if (format === 'junit' && stat.size > MAX_JUNIT_BYTES) throw new Error('JUnit report exceeds 1 MiB limit');
      if (stat.size > MAX_REPORT_BYTES) throw new Error('Report exceeds 20 MiB limit');
      totalReportBytes += stat.size;
      if (totalReportBytes > MAX_TOTAL_REPORT_BYTES) throw new Error('Batch reports exceed 32 MiB aggregate limit');
      content = fs.readFileSync(canonicalPath, 'utf8');
    } catch (error) {
      if (error.message.includes('each run needs its own report')) throw error;
      throw new Error('Cannot read report ' + file + ': ' + error.message);
    }
    filesSeen.set(canonicalPath, runId);
    let report;
    if (format === 'junit') {
      report = content;
    } else {
      try { report = JSON.parse(content); }
      catch (error) { throw new Error('Invalid JSON in ' + file + ': ' + error.message); }
    }
    const digest = crypto.createHash('sha256').update(content).digest('hex');
    if (digestsSeen.has(digest)) {
      warn('Warning: reports for runs "' + digestsSeen.get(digest) + '" and "' + runId +
        '" are byte-identical; confirm they are separate executions.');
    } else digestsSeen.set(digest, runId);
    runs.push({ runId, report });
  }
  return analyzeReportBatch(format, runs);
}
function run(args = process.argv.slice(2)) {
  process.stdout.write(JSON.stringify(buildSummary(args), null, 2) + '\n');
}
if (require.main === module) {
  try { run(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { run, buildSummary };
