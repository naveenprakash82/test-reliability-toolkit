const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { analyzeReportBatch } = require('./batchAnalysis');

const USAGE = 'Usage: npm run analyze:batch -- <jest|playwright> <runId> <report.json> [<runId> <report.json> ...]';

function buildSummary(args, warn = message => console.error(message)) {
  if (!Array.isArray(args) || args.length < 3 || args.length % 2 !== 1) throw new Error(USAGE);
  const [format, ...pairs] = args;
  const runs = [];
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
      content = fs.readFileSync(canonicalPath, 'utf8');
    } catch (error) {
      if (error.message.includes('each run needs its own report')) throw error;
      throw new Error('Cannot read report ' + file + ': ' + error.message);
    }
    filesSeen.set(canonicalPath, runId);
    let report;
    try { report = JSON.parse(content); }
    catch (error) { throw new Error('Invalid JSON in ' + file + ': ' + error.message); }
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
