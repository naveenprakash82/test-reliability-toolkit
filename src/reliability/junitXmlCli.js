#!/usr/bin/env node
const fs = require('node:fs');
const { junitXmlToRecords, MAX_BYTES } = require('./junitXmlAdapter');
function main(args = process.argv.slice(2)) {
  if (args.length !== 2) throw new Error('Usage: npm run junit:convert -- <run-id> <report.xml>');
  const [runId, file] = args;
  if (fs.statSync(file).size > MAX_BYTES) throw new Error('JUnit XML exceeds 1 MiB limit');
  process.stdout.write(JSON.stringify(junitXmlToRecords(fs.readFileSync(file, 'utf8'), runId), null, 2) + '\n');
}
if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { main };
