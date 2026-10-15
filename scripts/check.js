#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const files = ['wdio.conf.js'];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) files.push(path.relative(root, full));
  }
}
for (const dir of ['src', 'test', 'scripts']) {
  if (fs.existsSync(path.join(root, dir))) walk(path.join(root, dir));
}
let failed = false;
for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(file + '\n' + result.stderr);
  }
}
if (failed) process.exitCode = 1;
else console.log('Syntax OK: ' + files.length + ' files');
