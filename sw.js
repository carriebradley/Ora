const V = 'ora-v274', DATA = 'ora-data-v1';
const FILES = ['./', 'index.html', 'app.js', 'liturgy-schedule.js', 'epub-reader.js', 'roman-missal.js', 'liturgical-format.js', 'liturgy-reader.js', 'liturgy-reader-ui.js', 'source-reader.js', 'vendor/pdfjs/pdf.mjs', 'vendor/pdfjs/pdf.worker.mjs', 'edmonton-2026.js', 'edmonton.js', 'calendar.js', 'melkite.js', 'melkite-2026.js', 'sarummass.js', 'sarum.js', 'data.js', 'content.js', 'byzantine-office.js', 'sacred-art.js', 'liturgical-colors.js', 'byzlect.js', 'justice.js', 'justice-readings.js', 'felire.js', 'oor.js', 'roman-office-texts-data.js', 'roman-office-texts.js', 'roman-office.js', 'roman-short-readings.js', 'hours.js', 'oortext.json', 'manifest.webmanifest', 'icon.svg', 'icon-180.png'];
const JSON_FILES = new Set(['readings.json', 'fathers.json', 'matins.json', 'oortext.json', 'office_audio.json', 'angelus.json']);

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
  if (JSON_FILES.has(file)) {
    e.respondWith((async () => {
      // The bundled reading library belongs to this shell version, so an older
      // persistent copy cannot hide new readings when an upgrade is offline.
      const data = await caches.open(file === 'oortext.json' ? V : DATA);
      try {
        const response = await fetch(e.request);
        if (!response.ok) throw new Error('HTTP ' + response.status);
        await response.clone().json();
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



