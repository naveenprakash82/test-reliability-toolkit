'use strict';
const { SaxesParser } = require('saxes');
const MAX_BYTES = 1024 * 1024;
const MAX_TESTS = 5000;
const MAX_SUITES = 100;

function required(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError('JUnit XML requires ' + field);
  return value.trim();
}
function countAttribute(value, field) {
  if (value === undefined) return null;
  if (!/^(0|[1-9][0-9]*)$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new TypeError('Invalid JUnit ' + field + ' count');
  }
  return Number(value);
}
function junitXmlToRecords(xml, runId) {
  const normalizedRunId = required(runId, 'runId');
  if (typeof xml !== 'string') throw new TypeError('Expected JUnit XML text');
  if (Buffer.byteLength(xml, 'utf8') > MAX_BYTES) throw new Error('JUnit XML exceeds 1 MiB limit');
  if (!xml.trim()) throw new TypeError('Expected nonempty JUnit XML text');
  const parser = new SaxesParser({ xmlns: false });
  const stack = [];
  const records = [];
  const seen = new Set();
  let rootSeen = false;
  let suiteCount = 0;

  parser.on('doctype', () => { throw new Error('JUnit XML DOCTYPE is not supported'); });
  parser.on('processinginstruction', () => { throw new Error('JUnit XML processing instructions are not supported'); });
  parser.on('opentag', tag => {
    const name = tag.name;
    const attrs = tag.attributes;
    const parent = stack[stack.length - 1];
    if (name.includes(':') || Object.keys(attrs).some(key => key === 'xmlns' || key.includes(':'))) {
      throw new Error('JUnit XML namespaces are not supported');
    }
    if (!parent) {
      if (rootSeen || (name !== 'testsuites' && name !== 'testsuite')) {
        throw new Error('JUnit XML root must be testsuite or testsuites');
      }
      rootSeen = true;
    } else {
      const allowed = {
        testsuites: ['testsuite'],
        testsuite: ['testcase', 'properties', 'system-out', 'system-err'],
        testcase: ['failure', 'error', 'skipped', 'system-out', 'system-err'],
        properties: ['property']
      };
      if (!(allowed[parent.name] || []).includes(name)) {
        throw new Error('Unsupported JUnit XML element ' + name + ' inside ' + parent.name);
      }
    }
    const entry = { name, attrs };
    if (name === 'testsuites') {
      entry.counts = { tests: 0, failures: 0, errors: 0, skipped: 0 };
    }
    if (name === 'testsuite') {
      required(attrs.name, 'testsuite name');
      if (++suiteCount > MAX_SUITES) throw new Error('Too many JUnit XML suites');
      entry.counts = { tests: 0, failures: 0, errors: 0, skipped: 0 };
    }
    if (name === 'testcase') {
      required(attrs.name, 'testcase name');
      if (attrs.classname !== undefined) required(attrs.classname, 'testcase classname');
      entry.marker = null;
      entry.suite = parent;
    }
    if (['failure', 'error', 'skipped'].includes(name)) {
      if (parent.marker !== null) throw new Error('Conflicting JUnit testcase outcome markers');
      parent.marker = name;
    }
    stack.push(entry);
  });
  parser.on('closetag', tag => {
    const entry = stack.pop();
    if (!entry || entry.name !== tag.name) throw new Error('Malformed JUnit XML nesting');
    if (entry.name === 'testcase') {
      const suite = entry.suite;
      const id = suite.attrs.name.trim() + ' :: ' +
        (entry.attrs.classname ? entry.attrs.classname.trim() : suite.attrs.name.trim()) +
        ' :: ' + entry.attrs.name.trim();
      if (seen.has(id)) throw new Error('Duplicate JUnit test identifier: ' + id);
      seen.add(id);
      if (records.length >= MAX_TESTS) throw new Error('Too many JUnit XML testcases');
      const outcome = entry.marker === 'failure' || entry.marker === 'error' ? 'failed'
        : entry.marker === 'skipped' ? 'skipped' : 'passed';
      const record = { testId: id, runId: normalizedRunId, outcome };
      if (entry.attrs.time !== undefined) {
        const raw = entry.attrs.time;
        if (!/^[0-9]+(?:\.[0-9]+)?$/.test(raw)) throw new TypeError('Invalid JUnit testcase time');
        const durationMs = Math.round(Number(raw) * 1000);
        if (!Number.isSafeInteger(durationMs)) throw new TypeError('JUnit testcase time exceeds supported range');
        if (outcome !== 'skipped') record.durationMs = durationMs;
      }
      records.push(record);
      suite.counts.tests++;
      if (entry.marker) {
        const key = entry.marker === 'failure' ? 'failures' : entry.marker === 'error' ? 'errors' : 'skipped';
        suite.counts[key]++;
      }
    }
    if (entry.name === 'testsuite' || entry.name === 'testsuites') {
      for (const field of Object.keys(entry.counts)) {
        const declared = countAttribute(entry.attrs[field], field);
        if (declared !== null && declared !== entry.counts[field]) {
          throw new Error('JUnit ' + entry.name + ' ' +
            (entry.name === 'testsuite' ? entry.attrs.name + ' ' : '') + field +
            ' count ' + declared + ' disagrees with testcase records ' + entry.counts[field]);
        }
      }
      if (entry.name === 'testsuite') {
        const parent = stack[stack.length - 1];
        if (parent && parent.name === 'testsuites') {
          for (const field of Object.keys(entry.counts)) parent.counts[field] += entry.counts[field];
        }
      }
    }
  });
  parser.write(xml).close();
  if (!rootSeen || stack.length) throw new Error('Invalid JUnit XML document');
  return records;
}
module.exports = { junitXmlToRecords, MAX_BYTES };
