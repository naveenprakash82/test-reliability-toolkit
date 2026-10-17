#!/usr/bin/env node
const fs = require('node:fs');
const { comparePriorities } = require('./comparePriorities');
function run(args = process.argv.slice(2)) {
  if (args.length < 2 || args.length > 3) {
    throw new Error('Usage: node src/reliability/comparePrioritiesCli.js <runs.json> <dependencies.json> [changes.json]');
  }
  const [recordsFile, mapFile, changedFile] = args;
  const records = JSON.parse(fs.readFileSync(recordsFile, 'utf8'));
  const dependencies = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
  const changedComponents = changedFile ? JSON.parse(fs.readFileSync(changedFile, 'utf8')) : [];
  process.stdout.write(JSON.stringify(comparePriorities(records, dependencies, { changedComponents }), null, 2) + '\n');
}
if (require.main === module) {
  try { run(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { run };
