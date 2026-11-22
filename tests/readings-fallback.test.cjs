'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

function runFeedFetch(payload, saved) {
  const start = app.indexOf('  let feed = null;');
  const end = app.indexOf('  function loadReadings(', start);
  assert.ok(start >= 0 && end > start, 'readings initializer exists');
  const writes = [];
  const store = {
    get: key => key === 'ora.feed' ? saved : {},
    set: (key, value) => writes.push({key, value})
  };
  const fetch = async () => ({ok: true, json: async () => payload});
  const execute = new Function('fetch', 'store', 'st', 'render',
    app.slice(start, end) + '\nreturn feedP;');
  return execute(fetch, store, {tab: 'today'}, () => {}).then(feed => ({feed, writes}));
}

test('empty or malformed successful readings responses use last known complete feed', async () => {
  const saved = {'2026-11-21': {sections: [{label: 'Reading 1', text: 'Previous text'}]}};
  for (const payload of [{}, [], null, {updated: '2026-11-22'},
    {'2026-11-22': {sections: []}}]) {
    const {feed, writes} = await runFeedFetch(payload, saved);
    assert.deepEqual(feed, saved, 'preserve saved readings: ' + JSON.stringify(payload));
    assert.deepEqual(writes, [], 'do not overwrite saved readings with bad response');
  }
});

test('a valid one-day feed is usable and replaces a stale saved feed', async () => {
  const saved = {'2026-11-21': {sections: [{text: 'Previous text'}]}};
  const fresh = {'2026-11-22': {sections: [{text: 'New text'}]}};
  const {feed, writes} = await runFeedFetch(fresh, saved);
  assert.deepEqual(feed, fresh);
  assert.deepEqual(writes, [{key: 'ora.feed', value: fresh}]);
});
