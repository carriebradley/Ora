const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

function worker() {
  const origin = 'https://example.test/Ora/';
  const handlers = {}, stores = new Map();
  const key = r => new URL(typeof r === 'string' ? r : r.url, origin).href;
  const cache = () => {
    const entries = new Map();
    return {
      match: async r => entries.get(key(r))?.clone(),
      put: async (r, value) => entries.set(key(r), value.clone()),
      keys: async () => [...entries.keys()].map(url => ({ url })),
      addAll: async list => { for (const path of list) entries.set(key(path), new Response(path === 'oortext.json' ? fs.readFileSync(require.resolve('../oortext.json')) : '<html>Ora</html>')); }
    };
  };
  const caches = {
    open: async name => { if (!stores.has(name)) stores.set(name, cache()); return stores.get(name); },
    keys: async () => [...stores.keys()],
    delete: async name => stores.delete(name),
    match: async request => { for (const c of stores.values()) { const found = await c.match(request); if (found) return found; } }
  };
  const context = {
    URL, Response, caches,
    fetch: async () => { throw new Error('offline'); },
    self: { location: new URL(origin), addEventListener: (name, fn) => { handlers[name] = fn; }, skipWaiting: async () => {}, clients: { claim: async () => {} } }
  };
  vm.createContext(context); vm.runInContext(fs.readFileSync(require.resolve('../sw.js'), 'utf8'), context);
  const lifecycle = name => { let done; handlers[name]({ waitUntil: promise => { done = promise; } }); return done; };
  const request = (path, mode = 'cors', method = 'GET') => {
    let result;
    handlers.fetch({ request: { url: key(path), mode, method }, respondWith: promise => { result = promise; } });
    return result;
  };
  return { context, caches, lifecycle, request };
}

test('First installation bundles all 84 Office readings for offline use', async () => {
  const w = worker(); await w.lifecycle('install'); await w.lifecycle('activate');
  const response = await w.request('oortext.json');
  assert.equal(response.status, 200);
  assert.equal(Object.keys(await response.json()).length, 84);
});

test('Upgrade migrates downloaded texts and leaves unrelated application caches intact', async () => {
  const w = worker(), old = await w.caches.open('ora-v108');
  await old.put('matins.json', Response.json({ saved: 'Matins' }));
  await old.put('fathers.json', new Response('<html>server error</html>', { status: 500 }));
  await w.caches.open('another-app');
  await w.lifecycle('install'); await w.lifecycle('activate');
  assert.deepEqual(await (await w.request('matins.json')).json(), { saved: 'Matins' });
  assert.ok((await w.caches.keys()).includes('another-app'));
  assert.ok(!(await w.caches.keys()).includes('ora-v108'));
  assert.equal((await w.request('fathers.json')).status, 503);
});

test('An old persistent Office library cannot hide the newly bundled reading', async () => {
  const w = worker(), data = await w.caches.open('ora-data-v1');
  await data.put('oortext.json', Response.json({ old: 'library' }));
  await w.lifecycle('install'); await w.lifecycle('activate');
  assert.equal(Object.keys(await (await w.request('oortext.json')).json()).length, 84);
});

test('If migration runs out of storage, previously downloaded texts remain available', async () => {
  const w = worker(), old = await w.caches.open('ora-v108'), data = await w.caches.open('ora-data-v1');
  await old.put('matins.json', Response.json({ saved: 'Matins' }));
  data.put = async () => { throw new Error('quota exceeded'); };
  await w.lifecycle('install'); await w.lifecycle('activate');
  assert.ok((await w.caches.keys()).includes('ora-v108'));
  assert.deepEqual(await (await w.request('matins.json')).json(), { saved: 'Matins' });
});

test('HTTP errors and invalid JSON cannot replace the last successful readings', async () => {
  const w = worker(); await w.lifecycle('install'); await w.lifecycle('activate');
  w.context.fetch = async () => Response.json({ readings: 'good' });
  assert.deepEqual(await (await w.request('readings.json')).json(), { readings: 'good' });
  for (const response of [new Response('error', { status: 500 }), new Response('<html>not JSON</html>')]) {
    w.context.fetch = async () => response.clone();
    assert.deepEqual(await (await w.request('readings.json')).json(), { readings: 'good' });
  }
  w.context.fetch = async () => { throw new Error('offline'); };
  assert.deepEqual(await (await w.request('readings.json')).json(), { readings: 'good' });
});

test('Fresh online JSON updates cached text, and quota failures still serve the online copy', async () => {
  const w = worker(); await w.lifecycle('install'); await w.lifecycle('activate');
  const data = await w.caches.open('ora-data-v1');
  await data.put('matins.json', Response.json({ version: 1 }));
  w.context.fetch = async () => Response.json({ version: 2 });
  assert.deepEqual(await (await w.request('matins.json')).json(), { version: 2 });
  assert.deepEqual(await (await data.match('matins.json')).json(), { version: 2 });
  data.put = async () => { throw new Error('quota exceeded'); };
  w.context.fetch = async () => Response.json({ version: 3 });
  assert.deepEqual(await (await w.request('matins.json')).json(), { version: 3 });
});

test('Offline deep links fall back to the cached app; missing downloads return a defined failure', async () => {
  const w = worker(); await w.lifecycle('install'); await w.lifecycle('activate');
  const response = await w.request('index.html?tab=pray&date=2026-11-15', 'navigate');
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Ora/);
  assert.equal((await w.request('matins.json')).status, 503);
  assert.equal(w.request('https://external.test/text.json'), undefined);
  assert.equal(w.request('readings.json', 'cors', 'POST'), undefined);
});

// Updating one without the other causes a perpetual false update notice.
test('App build and installed worker version agree', () => {
  const app = fs.readFileSync(require.resolve('../app.js'), 'utf8');
  const sw = fs.readFileSync(require.resolve('../sw.js'), 'utf8');
  assert.equal(app.match(/const APP_BUILD = '(ora-v\d+)'/)[1], sw.match(/const V = '(ora-v\d+)'/)[1]);
});
