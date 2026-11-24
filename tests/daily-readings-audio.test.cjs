const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const app = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const source = app.slice(app.indexOf('  function romanReadingsAudioHTML('), app.indexOf('  function romanReadingsHTML('));
const urlSource = app.slice(app.indexOf('  const MONTHS ='), app.indexOf('  let feed = null;'));
const context = {};
vm.runInNewContext(urlSource, context);
vm.runInNewContext(source, context);
const audio = context.romanReadingsAudioHTML;
test('official player and fallback appear for a verified recording', () => {
  const html = audio('2026-11-24', '2418304374');
  assert.match(html, /<iframe/);
  assert.match(html, /tracks%2F2418304374/);
  assert.match(html, /Open official recording/);
  assert.match(html, /podcasts\/audio\/daily-mass-reading-podcast-november-24-2026/);
});
test('missing or malformed IDs always retain official date-specific link', () => {
  for (const id of [undefined, '', 'invalid']) {
    const html = audio('2026-11-24', id);
    assert.doesNotMatch(html, /<iframe/);
    assert.match(html, /Listen to daily Mass readings/);
    assert.match(html, /podcasts\/audio\/daily-mass-reading-podcast-november-24-2026/);
  }
});
