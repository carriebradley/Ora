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
  const html = audio('2026-11-24', {audio:'2418304374'});
  assert.match(html, /<iframe/);
  assert.match(html, /tracks%2F2418304374/);
  assert.match(html, /Open official recording/);
  assert.match(html, /podcasts\/audio\/daily-mass-reading-podcast-november-24-2026/);
});
test('missing or malformed IDs always retain official date-specific link', () => {
  for (const id of [undefined, '', 'invalid']) {
    const html = audio('2026-11-24', {audio:id});
    assert.doesNotMatch(html, /<iframe/);
    assert.match(html, /Listen to daily Mass readings/);
    assert.match(html, /podcasts\/audio\/daily-mass-reading-podcast-november-24-2026/);
  }
});
test('Christmas always links to the daytime recording and embeds only a verified daytime track', () => {
  for (const recording of [undefined, {audio:'111'}, {audio:'222', audio_suffix:'night'}, {audio:'333', audio_suffix:'day'}]) {
    const html = audio('2026-12-25', recording);
    assert.match(html, /podcasts\/audio\/daily-mass-reading-podcast-december-25-2026-day"/);
    assert.match(html, /Christmas Mass during the Day recording/);
    assert.equal(html.includes('<iframe'), recording?.audio_suffix === 'day');
  }
});
test('an imported alternate podcast uses the matching official page', () => {
  const html = audio('2026-11-26', {audio:'456', audio_suffix:'thanksgiving'});
  assert.match(html, /tracks%2F456/);
  assert.match(html, /podcasts\/audio\/daily-mass-reading-podcast-november-26-2026-thanksgiving"/);
  assert.match(audio('2026-11-26', {audio:'456', audio_suffix:'../../example'}), /november-26-2026"/);
});
