#!/usr/bin/env node
const { analyzeManifest } = require('./manifestAnalysis');
function main(args = process.argv.slice(2)) {
  if (args.length !== 1) throw new Error('Usage: npm run analyze:manifest -- <manifest.json>');
  console.log(JSON.stringify(analyzeManifest(args[0], message => console.error('Warning: '+message)), null, 2));
}
if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { main };
