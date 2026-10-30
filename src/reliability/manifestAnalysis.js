const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { analyzeReportBatch } = require('./batchAnalysis');

function analyzeManifest(file, warn = () => {}) {
  const manifestPath = fs.realpathSync(path.resolve(file));
  const base = path.dirname(manifestPath);
  const manifestStat = fs.statSync(manifestPath);
  if (!manifestStat.isFile()) throw new Error('Manifest must be a regular file');
  if (manifestStat.size > 1024 * 1024) throw new Error('Manifest exceeds 1 MiB');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest) ||
      !['jest','playwright','junit'].includes(manifest.format) ||
      !Array.isArray(manifest.runs) || !manifest.runs.length || manifest.runs.length > 100) {
    throw new TypeError('Expected format jest/playwright/junit and 1–100 runs');
  }
  const MAX_TOTAL_REPORT_BYTES = 32 * 1024 * 1024;
  let totalReportBytes = 0;
  const seenIds = new Set(), seenPaths = new Set(), seenHashes = new Map();
  const runs = manifest.runs.map((entry, i) => {
    if (!entry || typeof entry.runId !== 'string' || !entry.runId.trim() ||
        typeof entry.file !== 'string' || !entry.file.trim() || path.isAbsolute(entry.file)) {
      throw new TypeError('Run '+i+' requires a runId and relative file path');
    }
    const runId = entry.runId.trim();
    if (seenIds.has(runId)) throw new Error('Duplicate runId: '+runId);
    seenIds.add(runId);
    const reportPath = fs.realpathSync(path.resolve(base,entry.file));
    const relative = path.relative(base,reportPath);
    if (relative === '..' || relative.startsWith('..'+path.sep) || path.isAbsolute(relative)) {
      throw new Error('Report escapes manifest directory: '+entry.file);
    }
    if (seenPaths.has(reportPath)) throw new Error('Duplicate report path: '+entry.file);
    seenPaths.add(reportPath);
    const stat = fs.statSync(reportPath);
    if (!stat.isFile() || stat.size > 20*1024*1024) throw new Error('Invalid report size or type: '+entry.file);
    if (manifest.format === 'junit' && stat.size > 1024 * 1024) {
      throw new Error('JUnit report exceeds 1 MiB limit: ' + entry.file);
    }
    totalReportBytes += stat.size;
    if (totalReportBytes > MAX_TOTAL_REPORT_BYTES) {
      throw new Error('Manifest reports exceed 32 MiB aggregate limit');
    }
    const bytes = fs.readFileSync(reportPath);
    const hash = crypto.createHash('sha256').update(bytes).digest('hex');
    if (seenHashes.has(hash)) warn('Byte-identical reports: '+seenHashes.get(hash)+' and '+runId);
    else seenHashes.set(hash,runId);
    return {runId,report:manifest.format === 'junit' ? bytes.toString('utf8') : JSON.parse(bytes.toString('utf8'))};
  });
  return { format: manifest.format, runCount: runs.length,
    tests: analyzeReportBatch(manifest.format, runs) };
}
module.exports = { analyzeManifest };
