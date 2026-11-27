const V = 'ora-v471', DATA = 'ora-data-v1';
const FILES = ['./', 'index.html', 'app.js', 'liturgy-schedule.js', 'epub-reader.js', 'roman-missal.js', 'liturgical-format.js', 'liturgy-reader.js', 'liturgy-document.js', 'liturgy-reader-ui.js', 'source-reader.js', 'vendor/pdfjs/pdf.mjs', 'vendor/pdfjs/pdf.worker.mjs', 'edmonton-2026.js', 'edmonton.js', 'calendar.js', 'melkite.js', 'melkite-2026.js', 'sarummass.js', 'sarum.js', 'data.js', 'content.js', 'byzantine-office.js', 'sacred-art.js', 'liturgical-colors.js', 'byzlect.js', 'justice.js', 'justice-readings.js', 'felire.js', 'oor.js', 'roman-office-texts-data.js', 'roman-office-texts.js', 'roman-office.js', 'roman-short-readings.js', 'hours.js', 'oortext.json', 'ukrainian-propers.json', 'melkite-propers-2026.json', 'manifest.webmanifest', 'icon.svg', 'icon-180.png'];
const JSON_FILES = new Set(['readings.json', 'fathers.json', 'matins.json', 'oortext.json', 'office_audio.json', 'angelus.json', 'ukrainian-propers.json', 'melkite-propers-2026.json']);
const VERSIONED_JSON = new Set(['oortext.json', 'ukrainian-propers.json', 'melkite-propers-2026.json']);

// Read-only build handshake: a background-activated worker can already
// control an old open page before the user presses "Update now".
self.addEventListener('message', event => {
  if (event.data?.type !== 'ORA_VERSION_QUERY') return;
  event.ports?.[0]?.postMessage({ type: 'ORA_VERSION', version: V });
});

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const data = await caches.open(DATA);
    // Retain downloaded texts from the previous version before removing its shell.
    for (const key of await caches.keys()) {
      if (!/^ora-v\d+$/.test(key) || key === V) continue;
      const old = await caches.open(key);
      let migrated = true;
      for (const request of await old.keys()) {
        if (!JSON_FILES.has(new URL(request.url).pathname.split('/').pop()) || await data.match(request)) continue;
        const response = await old.match(request);
        if (response && response.ok) {
          try { await response.clone().json(); } catch (_) { continue; }
          try { await data.put(request, response); } catch (_) { migrated = false; }
        }
      }
      if (migrated) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== self.location.origin) return;
  const file = u.pathname.split('/').pop();
  // Published-version probes use a fresh query string. Never store them in
  // the offline shell: each check would otherwise consume a new cache entry.
  if (file === 'sw.js') {
    e.respondWith((async () => {
      try { return await fetch(e.request, { cache: 'no-store' }); }
      catch (_) { return new Response('Update check unavailable offline.', { status: 503 }); }
    })());
    return;
  }
  if (JSON_FILES.has(file)) {
    e.respondWith((async () => {
      // Bundled reading and hymn libraries belong to this shell version, so
      // older persistent downloads cannot hide the current offline bundle.
      const data = await caches.open(VERSIONED_JSON.has(file) ? V : DATA);
      try {
        const response = await fetch(e.request, { cache: 'no-store' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const parsed = await response.clone().json();
        // A syntactically valid but empty feed is not a successful update.
        // Keep the last usable offline readings when the publisher job
        // temporarily produces an empty or incomplete payload.
        if (file === 'readings.json' &&
            (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) ||
             !Object.keys(parsed).some(day => /^\d{4}-\d{2}-\d{2}$/.test(day) &&
               Array.isArray(parsed[day]?.sections) && parsed[day].sections.length > 0))) {
          throw new Error('Readings update contains no dated reading sections');
        }
        try { await data.put(e.request, response.clone()); } catch (_) { /* storage full: keep serving online */ }
        return response;
      } catch (_) {
        return await data.match(e.request) || await caches.match(e.request) || new Response('Offline: this content has not been downloaded yet.', { status: 503 });
      }
    })());
    return;
  }
  e.respondWith((async () => {
    const shell = await caches.open(V);
    if (e.request.mode === 'navigate') {
      try {
        const fresh = await fetch(e.request, { cache: 'no-store' });
        if (fresh.ok) return fresh;
      } catch (_) { /* offline: use installed shell */ }
      return await shell.match('index.html') || new Response('Ora is unavailable offline.', { status: 503 });
    }
    // Fetch updated application scripts/styles when online; retain cached
    // copies for offline use. Avoid a new HTML shell loading stale app.js.
    try {
      const fresh = await fetch(e.request, { cache: 'no-store' });
      if (fresh.ok) {
        try { await shell.put(e.request, fresh.clone()); } catch (_) { /* storage full */ }
        return fresh;
      }
    } catch (_) { /* offline */ }
    return await shell.match(e.request) || new Response('Offline: app resource unavailable.', { status: 503 });
  })());
});




