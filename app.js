/* Ora — app logic. Three calendars (Roman, Byzantine, Sarum), daily readings, prayer flows, art, saints, audio. */
(() => {
  'use strict';
  const L = LitCal, SA = Sarum, C = CONTENT;
  L.setData(LITDATA); SA.setData(LITDATA);

  /* ---------- helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ }
    }
  };
  const todayISO = () => { const t = new Date(); return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`; };
  const P = s => L.D(+s.slice(0, 4), +s.slice(5, 7), +s.slice(8, 10));
  const addISO = (s, n) => L.iso(L.add(P(s), n));
  const fmtShort = s => { const d = P(s); return `${L.DN[d.getUTCDay()].slice(0, 3)}, ${L.MN[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
  const fmtLong = s => { const d = P(s); return `${L.DN[d.getUTCDay()]}, ${L.MN[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
  const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const COLORS = { y: '#d4a017', w: '#f4efe0', r: '#a8232a', g: '#3d7a4a', v: '#6a3f9a', rose: '#d9899e', k: '#1c1c1c', gold: '#c9a227' };
  const col = c => COLORS[c] || COLORS.g;
  const MAJOR = /Solemnity|Principal|Great Feast|Triduum|Holy Week|Class I$/;
  const RITES = { roman: 'Roman (modern)', byz: 'Byzantine', sarum: 'Sarum (traditional)' };

  /* ---------- settings & state ---------- */
  const S = Object.assign({}, L.DEFAULTS, { ladyDayTransfer: true, rite: 'roman', rate: 0.95, voice: '' }, store.get('ora.settings', {}));
  const save = () => store.set('ora.settings', S);
  const st = { tab: 'today', date: todayISO(), month: null, sel: null, layers: { roman: true, byz: true, sarum: true }, readRite: S.rite || 'roman',
    kind: new Date().getHours() < 14 ? 'morning' : 'evening', artShift: 0, quoteShift: 0, active: -1, readings: {}, art: {} };

  { const q = new URLSearchParams(location.search); if (q.get('tab')) st.tab = q.get('tab'); if (/^\d{4}-\d\d-\d\d$/.test(q.get('date') || '')) st.date = q.get('date'); if (q.get('kind')) st.kind = q.get('kind'); if (q.get('rite')) S.rite = q.get('rite'); }

  /* ---------- calendar data ---------- */
  const infoCache = new Map();
  const cacheKey = iso => iso + JSON.stringify([S.ascension, S.corpus, S.epiphany, S.byzPascha, S.byzOldCal, S.ladyDayTransfer]);
  function dayInfo(iso) {
    const k = cacheKey(iso); if (infoCache.has(k)) return infoCache.get(k);
    const d = P(iso), v = { iso, roman: L.roman(d, S), byz: L.byzantine(d, S), sarum: SA.sarum(d, S), ugcc: userEvents(LITDATA.ugcc, iso) };
    infoCache.set(k, v); return v;
  }
  function userEvents(list, iso) {
    const day = [], span = [], d0 = P(iso);
    for (const [a, b, n] of list) {
      if (iso < a || iso >= b) continue;
      (Math.round((P(b) - P(a)) / 864e5) <= 1 ? day : span).push({ n, a, b });
    }
    return { day, span };
  }
  function tagsFor(v) {
    const t = new Set(['general']), r = v.roman, b = v.byz, s = (r.season || '').toLowerCase(), title = (r.title + ' ' + b.title).toLowerCase();
    if (/advent/.test(s)) t.add('advent'); if (/christmas/.test(s)) t.add('christmas');
    if (/holy week|triduum/.test(s)) t.add('holyweek'); else if (/lent/.test(s)) t.add('lent');
    if (/easter/.test(s)) t.add('easter'); if (/pentecost/.test(title) && !/after pentecost|sunday after/.test(title)) t.add('pentecost');
    if (/great and holy|holy week|palm/.test(b.title.toLowerCase())) t.add('holyweek');
    if (/triodion/.test((b.season || '').toLowerCase()) && !t.has('holyweek')) t.add('lent');
    if (/pentecostarion/.test((b.season || '').toLowerCase())) t.add('easter');
    if (/epiphany|theophany|baptism/.test(title)) t.add('epiphany');
    if (/transfiguration/.test(title)) t.add('transfiguration'); if (/assumption|dormition/.test(title)) t.add('dormition');
    if (/michael|michaelmas/.test(title)) t.add('michaelmas'); if (/nicholas/.test(title)) t.add('nicholas');
    if (/virgin mary|mother of god|theotokos|lady day|annunciation|immaculate|our lady|nativity of the virgin/.test(title)) t.add('marian');
    return t;
  }
  function pick(list, key, shift, tags, rite) {
    let pool = list.filter(x => x.tags && x.tags.some(g => g !== 'general' && tags.has(g)));
    if (!pool.length || hash(key) % 3 === 0) pool = list.filter(x => !x.tags || x.tags.includes('general') || x.tags.some(g => tags.has(g)));
    if (rite) { const pref = rite === 'byz' ? 'East' : null; if (pref) { const e = pool.filter(x => x.tr === pref); if (e.length && hash(key + 'x') % 3 !== 0) pool = e; } }
    return pool[(hash(key) + shift) % pool.length];
  }
  const quoteFor = (v, rite) => pick(C.QUOTES.filter(q => !q.tags || q.tags.some(g => tagsFor(v).has(g))), v.iso + rite, st.quoteShift, tagsFor(v), rite);
  const artFor = (v, rite) => pick(C.ART.map(a => a), v.iso + 'art' + rite, st.artShift, tagsFor(v), rite);

  /* ---------- readings ---------- */
  /* Roman readings come from readings.json, built daily from the official USCCB RSS feed by tools/fetch_readings.py.
     Fallbacks: the public citations API, then plain links. */
  const READINGS_API = 'https://cpbjr.github.io/catholic-readings-api/readings';
  const usccb = iso => `https://bible.usccb.org/bible/readings/${iso.slice(5, 7)}${iso.slice(8, 10)}${iso.slice(2, 4)}.cfm`;
  const MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const usccbAudio = iso => {
    const d = new Date(iso + 'T12:00:00');
    let u = `https://bible.usccb.org/podcasts/audio/daily-mass-reading-podcast-${MONTHS[d.getMonth()]}-${d.getDate()}-${d.getFullYear()}`;
    return u;
  };
  let feed = null;
  const feedP = fetch('readings.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : {}).catch(() => store.get('ora.feed', {})).then(j => { feed = j || {}; if (Object.keys(feed).length > 1) store.set('ora.feed', feed); return feed; });
  feedP.then(() => { if (st.tab === 'justice') render(); });
  function loadReadings(iso) {
    if (st.readings[iso] !== undefined) return;
    st.readings[iso] = 'loading';
    feedP.then(f => {
      if (f[iso] && f[iso].sections && f[iso].sections.length) { st.readings[iso] = { full: f[iso], copyright: f._copyright }; if (st.date === iso) render(); return; }
      const cached = store.get('ora.readings.' + iso, null);
      if (cached) { st.readings[iso] = cached; if (st.date === iso) render(); return; }
      return fetch(`${READINGS_API}/${iso.slice(0, 4)}/${iso.slice(5)}.json`).then(r => r.ok ? r.json() : Promise.reject(r.status)).then(j => {
        const x = j.readings || {}; const out = { first: x.firstReading, psalm: x.psalm, second: x.secondReading, gospel: x.gospel };
        st.readings[iso] = out; store.set('ora.readings.' + iso, out); if (st.date === iso) render();
      });
    }).catch(() => { st.readings[iso] = null; if (st.date === iso) render(); });
  }
  const readingsSpeech = r => r.full
    ? r.full.sections.map(s => `${s.label}. ${s.cite}. ${s.text.replace(/\bR\.\s*/g, '')}`).join('\n\n')
    : `The Mass readings. First reading, ${r.first || ''}. Psalm, ${r.psalm || ''}. ${r.second ? 'Second reading, ' + r.second + '. ' : ''}Gospel, ${r.gospel || ''}.`;
  function romanReadingsHTML(iso) {
    const r = st.readings[iso];
    let h = '';
    if (r === 'loading') h += '<p class="muted">Loading readings…</p>';
    else if (r && r.full) {
      if (r.full.title) h += `<p class="muted">${esc(r.full.title)}</p>`;
      if (/^\d+$/.test(String(r.full.audio || ''))) h += `<iframe title="USCCB audio of the readings" width="100%" height="120" scrolling="no" frameborder="0" loading="lazy" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F${r.full.audio}&visual=false&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false"></iframe>`;
      for (const s of r.full.sections) {
        h += `<div class="step" style="margin-top:10px"><div class="t">${esc(s.label)}${s.cite ? ' · ' + esc(s.cite) : ''}</div><div class="tx">${esc(s.text)}</div>${speakBtn(`${s.label}. ${s.cite}. ${s.text.replace(/\bR\.\s*/g, '')}`)}</div>`;
      }
      h += `<div class="row">${speakBtn(readingsSpeech(r))}</div>`;
      const gs = r.full.sections.find(s => /gospel/i.test(s.label) && s.cite); if (gs) h += fathersBlock(gs.cite);
    } else if (r) {
      for (const [k, n] of [['first', 'First Reading'], ['psalm', 'Psalm'], ['second', 'Second Reading'], ['gospel', 'Gospel']]) if (r[k]) h += `<div class="cite"><span>${n}</span><span>${esc(r[k])}</span></div>`;
    } else h += '<p class="muted">Readings aren’t available offline or for this date yet — use the links below.</p>';
    h += `<div class="row"><a class="btn fill" target="_blank" rel="noopener" href="${usccb(iso)}">USCCB page</a><a class="btn" target="_blank" rel="noopener" href="${usccbAudio(iso)}">USCCB audio</a><a class="btn" target="_blank" rel="noopener" href="https://universalis.com/">Universalis</a></div>`;
    if (r && r.full) h += `<p class="muted" style="font-size:.75rem">${esc(r.copyright || '')} Lectionary for Mass for Use in the Dioceses of the United States, second typical edition, © 2001, 1998, 1997, 1986, 1970 Confraternity of Christian Doctrine, Inc., Washington, DC. Used with permission via the USCCB daily readings feed. All rights reserved.</p>`;
    return h;
  }
  /* OCA lists the same Pascha-based Epistle/Gospel cycle by Orthodox date. For the movable season, map this day to the
     OCA date with the same distance from Pascha, so the cycle lines up even when Pascha differs from the Orthodox one. */
  function ocaDate(iso) {
    const d = P(iso), y = d.getUTCFullYear(), pg = L.westernEaster(y), pj = L.julianEaster(y);
    const k = Math.round((d - pg) / 864e5);
    const e = (k >= -70 && k <= 56) ? L.add(pj, k) : d;
    return `${e.getUTCFullYear()}/${pad(e.getUTCMonth() + 1)}/${pad(e.getUTCDate())}`;
  }
  const bible = c => `https://www.biblegateway.com/passage/?search=${encodeURIComponent(c.replace(/\s*\([^)]*\)/g, '').trim())}&version=RSVCE`;
  const citeLinks = txt => String(txt).split(' · ').map(c => `<a href="${bible(c)}" target="_blank" rel="noopener">${esc(c)}</a>`).join(' · ');
  const byzDay = iso => ByzLect.read(P(iso), S.byzOldCal ? 13 : 0, y => S.byzPascha === 'julian' ? L.julianEaster(y) : L.westernEaster(y));
  const byzSpeech = iso => { try { return byzDay(iso).sets.map(s => s.t + '. ' + s.r.map(x => x[0] + ', ' + x[1]).join('. ')).join(' ') } catch (e) { return ''; } };
  function byzReadingsHTML(v) {
    const t = v.byz;
    let h = `<p>${esc(t.title)}${t.tone ? ` · Tone ${t.tone}` : ''}</p>`, day = null;
    try { day = byzDay(v.iso); } catch (e) { day = null; }
    if (day && day.sets.length) {
      for (const s of day.sets) {
        h += `<div class="step" style="margin-top:10px"><div class="t">${esc(s.t)}</div>`;
        for (const [lab, cs] of s.r) h += `<div class="cite"><span>${esc(lab)}</span><span style="text-align:right">${citeLinks(cs)}</span></div>` + String(cs).split(' · ').map(c => `<div class="asv" data-ref="${esc(c.replace(/\s*\([^)]*\)/g, '').trim())}"></div>`).join('');
        for (const [lab, cs] of (s.a || [])) h += `<div class="cite muted"><span>${esc(lab)}</span><span style="text-align:right">${citeLinks(cs)}</span></div>`;
        if (s.chk) h += `<p class="note">Check this one: ${esc(s.chk)}</p>`;
        h += '</div>';
      }
      for (const n of day.notes) h += `<p class="muted">${esc(n)}</p>`;
      for (const s of day.sets) { const gr = s.r.find(x => /gospel/i.test(x[0]) && !/matins/i.test(x[0])); if (gr) { h += fathersBlock(String(gr[1]).split(' · ')[0].replace(/\s*\([^)]*\)/g, '')); break; } }
    } else h += '<p class="muted">No reading found in the table for this day.</p>';
    h += `<p class="muted" style="font-size:.8rem">Citations from the Byzantine lectionary table on byzcath.org (2013, unofficial, Slavic usage). Tap a reference to read it in the RSV-CE. It is built from a table, so check it against your parish book or ECPubs; the Pentecost-to-Triodion stretch around Christmas varies by church.</p>`;
    h += `<div class="row"><a class="btn" target="_blank" rel="noopener" href="https://ecpubs.gumroad.com/l/jTBr">ECPubs Daily Office</a><a class="btn" target="_blank" rel="noopener" href="https://www.stamforddio.org/liturgical-propers">Stamford propers</a><a class="btn" target="_blank" rel="noopener" href="https://www.oca.org/readings/daily/${ocaDate(v.iso)}">OCA (Orthodox) check</a></div>`;
    return h;
  }


  /* ---------- Church Fathers on the Gospel (public-domain translations, from the open Commentaries Database) ---------- */
  const GBOOK = { mt: 'Matthew', matthew: 'Matthew', mk: 'Mark', mark: 'Mark', lk: 'Luke', luke: 'Luke', jn: 'John', john: 'John' };
  function gospelRef(cite) {
    const m = String(cite || '').match(/^\s*(Mt|Mk|Lk|Jn|Matthew|Mark|Luke|John)\.?\s*(\d+):(\d+)(?:\s*[-–]\s*(?:(\d+):)?(\d+))?(.*)$/i);
    if (!m) return null;
    const book = GBOOK[m[1].toLowerCase()], ch = +m[2], v1 = +m[3], ch2 = m[4] ? +m[4] : ch, v2 = m[5] ? +m[5] : v1, out = [];
    if (ch2 === ch) for (let v = v1; v <= v2; v++) out.push([ch, v]); else out.push([ch, v1]);
    const rest = m[6] || '', more = rest.match(/^\s*,\s*(\d+)(?:\s*[-–]\s*(\d+))?/);
    if (more) { const a = +more[1], b = more[2] ? +more[2] : a; for (let v = a; v <= b; v++) out.push([ch, v]); }
    return { book, verses: out, label: `${book} ${ch}:${v1}${v2 !== v1 && ch2 === ch ? '-' + v2 : ''}` };
  }
  let fathersP = null;
  const loadFathers = () => fathersP || (fathersP = fetch('fathers.json').then(r => { if (!r.ok) throw new Error('x'); return r.json(); }));
  const AUTH = { 'John Chrysostom': 'St. John Chrysostom', 'Augustine of Hippo': 'St. Augustine', 'Ambrose of Milan': 'St. Ambrose', 'Jerome': 'St. Jerome', 'Gregory the Dialogist': 'St. Gregory the Great', 'Basil of Caesarea': 'St. Basil', 'Hilary of Poitiers': 'St. Hilary', 'Cyril of Alexandria': 'St. Cyril of Alexandria', 'Athanasius of Alexandria': 'St. Athanasius', 'Bede': 'St. Bede', 'Theophylact of Ohrid': 'Theophylact of Ohrid', 'Origen of Alexandria': 'Origen' };
  function fathersBlock(cite) {
    const g = gospelRef(cite); if (!g) return '';
    return `<details class="fathers" data-cite="${esc(cite)}" style="margin-top:12px"><summary><b>Church Fathers on this Gospel</b></summary><div class="fbody muted">Tap to load…</div></details>`;
  }
  document.addEventListener('toggle', async e => {
    const d = e.target; if (!d.classList || !d.classList.contains('fathers') || !d.open || d.dataset.done) return;
    d.dataset.done = '1'; const body = d.querySelector('.fbody'), g = gospelRef(d.dataset.cite);
    try {
      const data = await loadFathers(), bk = data[g.book] || {}, have = g.verses.filter(([c, v]) => bk[c] && bk[c][v]);
      const pick = have.length <= 4 ? have : [0, 1, 2, 3].map(i => have[Math.round(i * (have.length - 1) / 3)]);
      if (!pick.length) { body.textContent = 'No commentary found for this passage.'; return; }
      body.className = 'fbody';
      body.innerHTML = pick.map(([c, v]) => { const [a, t, q] = bk[c][v]; return `<div class="fq"><div class="muted" style="font-size:.78rem">${esc(g.book)} ${c}:${v}</div><p style="font-family:var(--serif);line-height:1.55;margin:2px 0">“${esc(q)}”</p><div class="muted" style="font-size:.78rem">${esc(AUTH[a] || a)} — ${esc(t)}</div></div>`; }).join('') + '<p class="muted" style="font-size:.74rem">Public-domain translations (Newman’s Catena Aurea; Schaff for Chrysostom and Augustine) from the open Commentaries Database. Excerpts are shortened.</p>';
    } catch (err) { d.dataset.done = ''; body.textContent = 'Could not load the commentary. Check your connection and try again.'; }
  }, true);

  /* ---------- art (live from Wikipedia, cached) ---------- */
  function loadArt(a) {   // exact Wikipedia article for the work; the image is used only if its file name matches the work (a.fm)
    const k = 'ora.art2.' + a.q; if (st.art[a.q] !== undefined) return;
    const c = store.get(k, null); if (c) { st.art[a.q] = c; return; }
    st.art[a.q] = 'loading';
    const u = 'https://en.wikipedia.org/w/api.php?action=query&redirects=1&titles=' + encodeURIComponent(a.wt || a.t) + '&prop=pageimages|info&piprop=thumbnail|name&pithumbsize=1100&inprop=url&format=json&origin=*';
    fetch(u).then(r => r.json()).then(j => {
      const p = j.query && j.query.pages && Object.values(j.query.pages)[0];
      const ok = p && !p.missing && p.pageimage && p.thumbnail && (!a.fm || new RegExp(a.fm, 'i').test(decodeURIComponent(p.pageimage).replace(/_/g, ' ')));
      const out = p && !p.missing ? { img: ok ? p.thumbnail.source : '', url: p.fullurl } : { img: '', url: 'https://en.wikipedia.org/w/index.php?search=' + encodeURIComponent(a.q) };
      st.art[a.q] = out; store.set(k, out); render();
    }).catch(() => { st.art[a.q] = null; render(); });
  }
  function artHTML(a, big) {
    loadArt(a); const m = st.art[a.q];
    let h = '<div class="art">';
    h += m && m.img ? `<img src="${esc(m.img)}" alt="${esc(a.t)}" loading="lazy">` : `<div class="ph">${m === 'loading' ? 'Loading image…' : m ? 'No verified image of this work — use “About this work”' : 'Image unavailable offline'}</div>`;
    h += `<h3 style="margin-top:10px">${esc(a.t)}</h3><div class="muted">${esc(a.a)} · ${a.tr === 'East' ? 'Eastern' : 'Western'} tradition</div><p class="quote" style="font-size:1rem">${esc(a.p)}</p>`;
    h += `<div class="row"><button class="btn sm" data-act="artnext">Another</button>${m && m.url ? `<a class="btn sm" target="_blank" rel="noopener" href="${esc(m.url)}">About this work</a>` : ''}${speakBtn(`${a.t}. ${a.a}. ${a.p}`)}</div></div>`;
    return h;
  }

  /* ---------- UI pieces ---------- */
  const hasTTS = false; // computer-voice read-aloud switched off (set to typeof speechSynthesis !== 'undefined' to bring it back)
  const speakBtn = text => hasTTS ? `<button class="listen" data-act="say" data-say="${encodeURIComponent(text)}">🔊 Listen</button>` : '';
  const chip = (t, cls = '') => t ? `<span class="chip ${cls}">${esc(t)}</span>` : '';
  const chipsFor = r => chip(r.rank, MAJOR.test(r.rank || '') ? 'major' : '') + (r.season && r.season !== r.rank ? chip(r.season) : '');
  function alsoHTML(a) { return a && a.length ? `<ul class="also">${a.slice(0, 5).map(x => `<li>${esc(x.title)} <i>— ${esc(x.note)}</i></li>`).join('')}</ul>` : ''; }
  function spokenCard(r, extra) { return `${r.title}. ${r.rank || ''}. ${r.season || ''}. ${r.fast || ''} ${extra || ''}`; }

  function cardRoman(v) {
    const r = v.roman;
    return `<section class="card"><div class="lab"><span class="sw" style="--c:${col(r.color)}"></span><span class="grow">Roman · modern</span>${speakBtn(spokenCard(r))}</div>
      <h2>${esc(r.title)}</h2><div class="chips">${chipsFor(r)}${r.fast ? chip(r.fast, 'fast') : ''}</div>
      <p class="muted">Sunday cycle ${r.sundayCycle} · Weekday cycle ${r.weekdayCycle}</p>${alsoHTML(r.also)}</section>`;
  }
  function cardByz(v) {
    const r = v.byz, u = v.ugcc;
    const words = t => new Set(t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 4));
    const known = [r.title, ...r.also.map(x => x.title)].map(words);
    const ev = u.day.filter(e => { const w = words(e.n); return !known.some(k => [...w].filter(x => k.has(x)).length >= Math.min(2, w.size)); });
    return `<section class="card"><div class="lab"><span class="sw" style="--c:${col(r.color)}"></span><span class="grow">Byzantine</span>${speakBtn(spokenCard(r))}</div>
      <h2>${esc(r.title)}</h2><div class="chips">${chipsFor(r)}${r.tone ? chip('Tone ' + r.tone) : ''}${r.fast ? chip(r.fast, 'fast') : ''}</div>
      ${alsoHTML(r.also)}${ev.length ? `<ul class="also">${ev.map(e => `<li>${esc(e.n)} <i>— your UGCC calendar</i></li>`).join('')}</ul>` : ''}
      <p class="muted">Pascha ${fmtLong(r.pascha)} (${S.byzPascha === 'julian' ? 'Julian reckoning' : 'Gregorian reckoning'})</p></section>`;
  }
  function cardSarum(v) {
    const r = v.sarum;
    return `<section class="card"><div class="lab"><span class="sw" style="--c:${col(r.color)}"></span><span class="grow">Sarum · traditional</span>${speakBtn(spokenCard(r, r.notes))}</div>
      <h2>${esc(r.title)}</h2><div class="chips">${chipsFor(r)}${r.fast ? chip(r.fast, 'fast') : ''}${chip(r.srcText, r.src === 'I' ? 'fast' : '')}</div>
      ${r.srcNote ? `<p class="muted">${esc(r.srcNote)}</p>` : ''}${r.rankNote ? `<p class="muted" style="font-size:.78rem">${esc(r.rankNote)}</p>` : ''}${r.colorNote ? `<p class="muted" style="font-size:.78rem">${esc(r.colorNote)}</p>` : ''}${r.notes ? `<p class="muted">${esc(r.notes)}</p>` : ''}${keptHTML(r.kept)}${alsoHTML(r.also)}</section>`;
  }
  function keptHTML(k) {
    if (!k || !k.length) return '';
    const TAG = { I: ['Ireland · documented', ''], E: ['Sarum / England · documented', ''], F: ['Later folklore', 'fast'], U: ['Uncertain', 'fast'] };
    return `<details style="margin-top:8px" open><summary><b>How it was kept</b></summary>${k.map(e => `<div style="margin:8px 0">${chip(TAG[e.tag][0], TAG[e.tag][1])}<p style="margin:4px 0">${esc(e.text)}</p>${e.src.length ? `<p class="muted" style="font-size:.74rem;margin:0">${esc(e.src.join(' · '))}</p>` : ''}</div>`).join('')}</details>`;
  }
  /* Sarum Mass propers (Warren's Sarum Missal in English). Scripture is hydrated live from the Douay text; prayers not yet transcribed are shown as summaries only. */
  function sarumMassHTML(v) {
    const m = v.sarum.mass;
    if (!m) return `<p style="margin-top:10px"><b>${esc(v.sarum.title)}</b></p><p class="muted">The Sarum Mass for this day has not been added to the app yet. So far the app has the Sundays and weekdays after Trinity, St Patrick and St Bridget; feasts and the other seasons are still to come.</p>`;
    let h = `<h3 style="font-family:var(--serif);margin:10px 0 4px">${esc(m.title)}</h3><p class="muted">${esc(m.note)}</p>`;
    for (const p of m.parts) {
      if (p.ref) h += `<div class="cite"><span><b>${esc(p.k)}</b></span><span class="muted" style="text-align:right;font-size:.74rem">${esc(p.pr)}</span></div>${p.inc ? `<p class="muted"><i>${esc(p.inc)}</i></p>` : ''}<div class="asv" data-tr="dra" data-ref="${esc(p.ref)}"></div>`;
      else h += `<div class="cite"><span><b>${esc(p.k)}</b></span></div><p style="white-space:pre-line">${esc(p.tx)}</p>`;
    }
    return h + `<p class="muted" style="font-size:.74rem">Source: ${esc(m.source)}. Epistle and Gospel in full: Douay-Rheims (public domain).</p>`;
  }

  /* ---------- at-a-glance: feast or fast? ---------- */
  const FEASTRANK = /Solemnity|Feast|Holy Day|Great Feast|Triduum|Principal|Double/;
  function status(r, rite) {
    const rk = r.rank || '';
    const alsoFeast = (r.also || []).find(x => FEASTRANK.test(x.note || ''));
    const major = /Solemnity|Principal|Great Feast|Feast of the Lord|Holy Day/.test(rk);
    const feast = (FEASTRANK.test(rk) && !/Holy Week/.test(rk)) || !!alsoFeast;
    let fast = r.fast || (r.ember ? 'Ember Day — fast and abstinence' : '');
    if (fast && major && /day of abstinence|traditional day|Friday of Lent|abstinence from meat$/.test(fast) && !/strict|Great Fast/.test(fast)) fast = '';  // ordinary weekly fast is lifted on a great feast
    const minor = /Memorial|Saint|Commemoration|Octave/.test(rk);
    const kind = feast && fast ? 'both' : feast ? 'feast' : fast ? 'fast' : 'plain';
    const badge = kind === 'both' ? 'Feast + fast' : kind === 'feast' ? 'Feast day' : kind === 'fast' ? 'Fast day' : minor ? (/Octave/.test(rk) ? 'Octave' : 'Memorial') : rk === 'Sunday' ? 'Sunday' : 'Ordinary day';
    const name = alsoFeast && !FEASTRANK.test(rk) ? alsoFeast.title : (feast || minor ? r.title : '');
    return { kind, badge, detail: [name, fast].filter(Boolean).join(' · ') };
  }
  function glanceHTML(v) {
    const rows = [['Roman', v.roman, 'roman'], ['Byzantine', v.byz, 'byz'], ['Sarum', v.sarum, 'sarum']];
    return `<section class="card glance"><div class="lab"><span class="grow">Today: feast or fast?</span></div>` + rows.map(([n, r, k]) => {
      const x = status(r, k);
      return `<div class="gl ${x.kind}"><span class="gn">${n}</span><span class="gb">${esc(x.badge)}</span><span class="gd">${esc(x.detail)}</span></div>`;
    }).join('') + '</section>';
  }

  /* ---------- tabs ---------- */
  const POPE = { '2026-01': ['For prayer with the word of God', 'Scripture as nourishment and hope, helping to build a more fraternal, missionary Church.'], '2026-02': ['For children with incurable diseases', 'Medical care and support for sick children and their families.'], '2026-03': ['For disarmament and peace', 'Progress on disarmament, especially nuclear, and dialogue in place of violence.'], '2026-04': ['For priests in crisis', 'That priests facing a crisis of vocation are accompanied and understood by their communities.'], '2026-05': ['That everyone might have food', 'Less food waste and fair access to good food for all.'], '2026-06': ['For the values of sports', 'Sport as a way to peace, encounter and dialogue, building respect and solidarity.'], '2026-07': ['For respect for human life', 'Protecting human life at every stage as a gift from God.'], '2026-08': ['For evangelization in the city', 'New ways to proclaim the Gospel and build community in large, lonely cities.'], '2026-09': ['For the care of water', 'Just, sustainable management of water so that everyone has equal access.'], '2026-10': ['For mental health ministry', 'Mental health ministry across the Church, countering stigma and discrimination.'], '2026-11': ['For the proper use of wealth', 'That wealth be used for the common good and for those with less, and never selfishly.'], '2026-12': ['For single-parent families', 'Support in the Church, and strength in faith, for families missing a mother or father.'] };
  function popeCard(iso) {
    const p = POPE[iso.slice(0, 7)], mo = L.MN[+iso.slice(5, 7) - 1];
    return `<section class="card"><div class="lab"><span class="grow">Pope’s prayer intention · ${esc(mo)}</span></div>${p ? `<p style="font-family:var(--serif);font-size:1.05rem;margin:4px 0"><b>${esc(p[0])}</b></p><p class="muted" style="margin-top:0">${esc(p[1])}</p>` : '<p class="muted">This month’s intention is on the official site.</p>'}<div class="row"><a class="btn sm" target="_blank" rel="noopener" href="https://www.popesprayer.va/praywiththepope/">Pray with the Pope</a></div></section>`;
  }
  const HIST = [[1, 1, 1968, "Pope Paul VI keeps the first World Day of Peace."], [1, 4, 1821, "St Elizabeth Ann Seton, foundress of the Sisters of Charity in the United States, dies."], [1, 5, 1860, "St John Neumann, bishop of Philadelphia, dies."], [1, 10, 236, "Fabian is elected Bishop of Rome."], [1, 13, 367, "St Hilary of Poitiers, defender of the Nicene faith, dies (traditional date)."], [1, 17, 356, "St Antony the Great, father of monks, dies in the Egyptian desert (traditional date)."], [1, 20, 250, "Pope St Fabian is martyred in the Decian persecution."], [1, 21, 304, "St Agnes is martyred in Rome (traditional date)."], [1, 25, 1959, "John XXIII announces the Second Vatican Council at St Paul Outside the Walls."], [1, 28, 814, "Charlemagne, crowned emperor by Leo III in 800, dies."], [1, 31, 1888, "St John Bosco, apostle of young people, dies in Turin."], [2, 1, 525, "St Brigid of Kildare dies, traditionally about this year."], [2, 3, 316, "St Blaise, bishop of Sebaste, is martyred (traditional date)."], [2, 5, 1597, "Twenty-six Christians, including St Paul Miki, are crucified at Nagasaki."], [2, 7, 1878, "Pope Pius IX dies after the longest reign of any pope since St Peter."], [2, 8, 1587, "Mary, Queen of Scots, is executed at Fotheringhay."], [2, 10, 543, "St Scholastica, sister of St Benedict, dies (traditional date)."], [2, 11, 1858, "Our Lady first appears to St Bernadette at Lourdes. In 1929 the Lateran Treaty is also signed on this date."], [2, 14, 869, "St Cyril, apostle of the Slavs, dies in Rome."], [2, 22, 1072, "St Peter Damian, reformer and Doctor of the Church, dies at Faenza."], [2, 23, 155, "St Polycarp, bishop of Smyrna and disciple of St John, is martyred (traditional date; some scholars say 156)."], [2, 25, 1570, "Pius V issues Regnans in Excelsis, excommunicating Elizabeth I."], [2, 28, 2013, "The resignation of Pope Benedict XVI takes effect."], [3, 3, 1955, "St Katharine Drexel, foundress of the Sisters of the Blessed Sacrament, dies."], [3, 7, 1274, "St Thomas Aquinas dies at Fossanova on his way to the Council of Lyons."], [3, 8, 1550, "St John of God, founder of the Brothers Hospitallers, dies in Granada."], [3, 9, 1440, "St Frances of Rome, foundress of the Oblates of Tor de' Specchi, dies."], [3, 12, 604, "Pope St Gregory the Great dies."], [3, 13, 2013, "Jorge Bergoglio is elected pope and takes the name Francis."], [3, 17, 461, "St Patrick dies, according to one traditional dating (others say 493)."], [3, 18, 386, "St Cyril of Jerusalem, bishop and Doctor of the Church, dies."], [3, 23, 1606, "St Turibius of Mogrovejo, archbishop of Lima, dies."], [3, 24, 1980, "Archbishop Óscar Romero is shot while celebrating Mass in San Salvador."], [4, 2, 2005, "Pope St John Paul II dies."], [4, 4, 397, "St Ambrose, bishop of Milan, dies."], [4, 7, 1719, "St John Baptist de la Salle, founder of the Christian Brothers, dies."], [4, 11, 1963, "John XXIII issues the encyclical Pacem in Terris."], [4, 15, 1889, "St Damien of Molokai dies among the lepers of Hawaii."], [4, 16, 1879, "St Bernadette Soubirous dies at Nevers."], [4, 19, 2005, "Cardinal Joseph Ratzinger is elected pope as Benedict XVI."], [4, 21, 1109, "St Anselm, archbishop of Canterbury, dies."], [4, 24, 1622, "St Fidelis of Sigmaringen is killed while preaching in Switzerland."], [4, 29, 1380, "St Catherine of Siena dies in Rome."], [5, 1, 1572, "Pope St Pius V dies."], [5, 2, 373, "St Athanasius, bishop of Alexandria, dies."], [5, 8, 1429, "Joan of Arc lifts the siege of Orléans."], [5, 13, 1917, "Our Lady first appears to the children at Fátima. In 1981 John Paul II is shot in St Peter's Square on the same date."], [5, 15, 1891, "Leo XIII issues Rerum Novarum, the first great modern social encyclical."], [5, 16, 577, "St Brendan the Navigator dies, traditionally in this year."], [5, 22, 337, "Constantine the Great dies after being baptized."], [5, 25, 735, "The Venerable Bede dies at Jarrow (usually dated 25 or 26 May)."], [5, 26, 1595, "St Philip Neri dies in Rome."], [5, 27, 604, "St Augustine of Canterbury dies (about this date)."], [5, 29, 1453, "Constantinople falls to the Ottoman Turks."], [5, 30, 1431, "Joan of Arc is burned at the stake in Rouen."], [6, 1, 165, "St Justin Martyr is put to death in Rome (about this year)."], [6, 3, 1886, "The Uganda Martyrs are burned at Namugongo. Pope St John XXIII also dies on this date in 1963."], [6, 5, 754, "St Boniface, apostle of Germany, is martyred in Frisia."], [6, 9, 597, "St Columba dies at Iona."], [6, 13, 1231, "St Anthony of Padua dies near Padua."], [6, 19, 1027, "St Romuald, founder of the Camaldolese, dies."], [6, 22, 1535, "St John Fisher, bishop of Rochester, is beheaded."], [6, 27, 444, "St Cyril of Alexandria, defender of the title Theotokos, dies."], [6, 29, 67, "Tradition says SS Peter and Paul are martyred in Rome in the reign of Nero."], [7, 6, 1535, "St Thomas More is beheaded on Tower Hill."], [7, 13, 1024, "Emperor St Henry II dies."], [7, 15, 1274, "St Bonaventure dies during the Council of Lyons."], [7, 16, 1054, "Cardinal Humbert lays the bull of excommunication on the altar of Hagia Sophia, the traditional date of the East–West Schism."], [7, 17, 1794, "The sixteen Carmelite martyrs of Compiègne are guillotined in Paris."], [7, 30, 450, "St Peter Chrysologus, bishop of Ravenna, dies (about this year)."], [7, 31, 1556, "St Ignatius of Loyola dies in Rome."], [8, 4, 1859, "St John Vianney, the Curé of Ars, dies."], [8, 6, 1978, "Pope Paul VI dies at Castel Gandolfo."], [8, 9, 1942, "St Teresa Benedicta of the Cross (Edith Stein) is killed at Auschwitz."], [8, 10, 258, "St Laurence, deacon of Rome, is martyred."], [8, 11, 1253, "St Clare of Assisi dies."], [8, 14, 1941, "St Maximilian Kolbe gives his life at Auschwitz."], [8, 15, 1534, "Ignatius of Loyola and his companions take vows at Montmartre."], [8, 20, 1153, "St Bernard of Clairvaux dies. Pius X also dies on this date in 1914."], [8, 23, 1617, "St Rose of Lima dies."], [8, 27, 387, "St Monica dies at Ostia (about this year)."], [8, 28, 430, "St Augustine, bishop of Hippo, dies during the Vandal siege."], [9, 3, 590, "Gregory the Great is consecrated Bishop of Rome."], [9, 5, 1997, "St Teresa of Calcutta dies."], [9, 9, 549, "St Ciarán of Clonmacnoise dies, traditionally in this year."], [9, 12, 1683, "The Battle of Vienna ends the Ottoman siege."], [9, 14, 407, "St John Chrysostom dies in exile. The Church of the Holy Sepulchre was also dedicated about 335."], [9, 17, 1179, "St Hildegard of Bingen dies."], [9, 27, 1660, "St Vincent de Paul dies in Paris."], [9, 30, 420, "St Jerome dies at Bethlehem."], [10, 3, 1226, "St Francis of Assisi dies at the Portiuncula."], [10, 7, 1571, "The Christian fleet wins the Battle of Lepanto."], [10, 11, 1962, "The Second Vatican Council opens."], [10, 13, 1307, "Philip IV of France has the Knights Templar arrested."], [10, 15, 1582, "St Teresa of Ávila dies; in many countries this date follows 4 October when the Gregorian calendar begins."], [10, 16, 1978, "Karol Wojtyła is elected pope as John Paul II."], [10, 17, 107, "St Ignatius of Antioch is martyred in Rome (traditional date, about this year)."], [10, 28, 312, "Constantine wins the Battle of the Milvian Bridge."], [11, 1, 1950, "Pius XII defines the dogma of the Assumption in Munificentissimus Deus."], [11, 3, 1639, "St Martin de Porres dies in Lima."], [11, 4, 1584, "St Charles Borromeo, archbishop of Milan, dies."], [11, 9, 324, "The Lateran Basilica, mother church of Rome, is dedicated (traditional date)."], [11, 10, 461, "Pope St Leo the Great dies."], [11, 11, 397, "St Martin of Tours dies."], [11, 12, 1623, "St Josaphat Kuntsevych is martyred in Vitebsk."], [11, 14, 1180, "St Laurence O'Toole, archbishop of Dublin, dies at Eu in Normandy."], [11, 15, 1280, "St Albert the Great dies at Cologne."], [11, 17, 1231, "St Elizabeth of Hungary dies."], [11, 18, 1626, "The new St Peter's Basilica is consecrated by Urban VIII."], [12, 1, 1581, "St Edmund Campion is executed at Tyburn."], [12, 3, 1552, "St Francis Xavier dies on Shangchuan Island, off China."], [12, 7, 374, "Ambrose is chosen and consecrated bishop of Milan."], [12, 8, 1854, "Pius IX defines the Immaculate Conception in Ineffabilis Deus. The Second Vatican Council closes on this date in 1965."], [12, 12, 549, "St Finnian of Clonard dies, traditionally in this year."], [12, 14, 1591, "St John of the Cross dies at Úbeda."], [12, 25, 800, "Pope Leo III crowns Charlemagne emperor in St Peter's."], [12, 29, 1170, "St Thomas Becket is murdered in Canterbury Cathedral."], [12, 31, 335, "Pope St Sylvester I dies."]];
  function histCard(iso) {
    const m = +iso.slice(5, 7), d = +iso.slice(8, 10), y = +iso.slice(0, 4), key = (a, b) => a * 100 + b, today = key(m, d);
    let best = null, bestGap = 99;
    for (const e of HIST) {
      // distance in days, wrapping the year
      const t = Date.UTC(2001, e[0] - 1, e[1]), n = Date.UTC(2001, m - 1, d), gap = Math.round(Math.abs(t - n) / 864e5), g = Math.min(gap, 365 - gap);
      if (g < bestGap || (g === bestGap && key(e[0], e[1]) <= today)) { best = e; bestGap = g; }
    }
    if (!best || bestGap > 3) return '';
    const when = bestGap === 0 ? '' : `${L.MN[best[0] - 1]} ${best[1]} · `;
    const yr = best[2] < 300 ? `AD ${best[2]}` : String(best[2]);
    return `<section class="card"><div class="lab"><span class="grow">This day in Church history${bestGap ? ' (nearby)' : ''}</span></div><p style="margin:6px 0 2px"><b>${esc(when)}${esc(yr)}</b></p><p style="margin:0">${esc(best[3])}</p><p class="muted" style="font-size:.78rem;margin:6px 0 0">Early dates are traditional and some sources differ.</p></section>`;
  }
  function viewToday() {
    const v = dayInfo(st.date); loadReadings(st.date);
    const q = quoteFor(v, S.rite), a = artFor(v, S.rite);
    let h = `<section class="card"><div class="lab"><span class="grow">Sacred art</span></div>${artHTML(a)}</section>` + glanceHTML(v) + popeCard(v.iso) + histCard(v.iso);
    h += `<section class="card"><div class="lab"><span class="grow">From the saints</span></div><div class="quote">“${esc(q.t)}”<small>${esc(q.s)} · ${esc(q.w)} · ${q.tr === 'East' ? 'Eastern' : 'Western'} Father/Saint</small></div>
      <div class="row">${speakBtn(`${q.t} — ${q.s}, ${q.w}`)}<button class="btn sm" data-act="qnext">Another</button></div></section>`;
    return h;
  }

  function stepsFor(rite, kind, v) {
    const tpl = C.FLOWS[rite][kind], r = v[rite === 'sarum' ? 'sarum' : rite === 'byz' ? 'byz' : 'roman'];
    const out = [];
    for (const s of tpl) {
      const x = Object.assign({}, s);
      if (s.type === 'calendar') { x.text = `${r.title}. ${r.season}.${r.fast ? ' ' + r.fast + '.' : ''}${rite === 'sarum' && r.notes ? ' ' + r.notes : ''}`; x.head = r.title; x.sub = [r.rank, r.season, r.fast].filter(Boolean).join(' · '); }
      if (s.type === 'quote') { const q = quoteFor(v, rite); x.q = q; x.text = `${q.t} — ${q.s}, ${q.w}.`; }
      if (s.type === 'art') { const a = artFor(v, rite); x.a = a; x.text = `${a.t}. ${a.a}. ${a.p}`; }
      if (s.type === 'readings') {
        if (rite === 'byz') x.text = byzSpeech(v.iso) || 'The Epistle and Gospel of the day. Open the daily propers to read them.';
        else if (rite === 'sarum' && r.mass) x.text = `${r.mass.title}. Open the Mass to read the Epistle and Gospel.`;
        else { const rd = st.readings[v.iso]; x.text = rd && rd !== 'loading' ? readingsSpeech(rd) : 'The Mass readings of the day. Open the readings to read or listen.'; }
      }
      if (s.type === 'silence') x.text = `${s.title}. ${s.text || 'Be still.'}`;
      if (s.type === 'office') x.text = s.title;
      if (s.type === 'hourlink') x.text = `${s.title}. Open the full office to pray the psalms.`;
      if (s.type === 'prayer') { x.body = s.text; x.text = `${s.title}. ${s.text}`; }
      out.push(x);
    }
    return out;
  }
  const HOURLINKS = {
    roman: { lauds: ['Universalis', 'https://universalis.com/'], vespers: ['Universalis', 'https://universalis.com/'], daytime: ['Universalis', 'https://universalis.com/'], compline: ['Universalis', 'https://universalis.com/'], any: ['Divine Office (audio & text)', 'https://divineoffice.org/'] },
    byz: { orthros: ['Horologion · MCI', 'https://mci.archpitt.org/liturgy/Horologion.html'], vespers: ['Horologion · MCI', 'https://mci.archpitt.org/liturgy/Horologion.html'], hours: ['Horologion · MCI', 'https://mci.archpitt.org/liturgy/Horologion.html'], compline: ['Horologion · MCI', 'https://mci.archpitt.org/liturgy/Horologion.html'], midnight: ['Horologion · MCI', 'https://mci.archpitt.org/liturgy/Horologion.html'], any: ['Divine Praises', 'https://divinepraises.github.io/'] },
    sarum: { any: ['Breviary Offices — Sarum hours in English (1880)', 'https://commons.ptsem.edu/id/breviaryofficesf00cath'], more: [['Sarum Office with chant, English edition', 'https://www.sarum-chant.ca/'], ['Lesser Hours of the Sarum Breviary', 'https://archive.org/details/lesserhoursofsar00cathuoft']] }
  };
  function linksHTML(rite, hour) {
    const m = HOURLINKS[rite], a = m[hour] || m.any, b = m.any;
    let h = `<a class="btn sm" target="_blank" rel="noopener" href="${a[1]}">${esc(a[0])}</a>`;
    if (b[1] !== a[1]) h += `<a class="btn sm" target="_blank" rel="noopener" href="${b[1]}">${esc(b[0])}</a>`;
    if (rite === 'byz') h += '<a class="btn sm" target="_blank" rel="noopener" href="https://www.stamforddio.org/liturgical-propers">Propers</a>';
    for (const [t, u] of (m.more || [])) h += `<a class="btn sm" target="_blank" rel="noopener" href="${u}">${esc(t)}</a>`;
    return h;
  }

  function viewReadings() {
    const v = dayInfo(st.date); loadReadings(st.date);
    const rr = st.readRite === 'byz' ? 'byz' : 'roman';
    const b = (k, t) => `<button data-act="rr" data-v="${k}" class="${rr === k ? 'on' : ''}">${t}</button>`;
    const body = rr === 'byz' ? byzReadingsHTML(v) : rr === 'sarum' ? sarumMassHTML(v) : romanReadingsHTML(st.date);
    return `<h2 style="font-family:var(--serif)">Readings of the day</h2><section class="card"><div class="seg">${b('roman', 'Roman')}${b('byz', 'Byzantine')}</div>${body}</section>`;
  }
  function viewPray() {
    const v = dayInfo(st.date); loadReadings(st.date);
    const rite = S.rite, steps = stepsFor(rite, st.kind, v);
    let h = `<div class="seg">${Object.keys(RITES).map(k => `<button data-act="rite" data-v="${k}" class="${rite === k ? 'on' : ''}">${k === 'roman' ? 'Roman' : k === 'byz' ? 'Byzantine' : 'Sarum'}</button>`).join('')}</div>
      <div class="seg"><button data-act="kind" data-v="morning" class="${st.kind === 'morning' ? 'on' : ''}">☀ Morning</button><button data-act="kind" data-v="evening" class="${st.kind === 'evening' ? 'on' : ''}">☾ Evening</button></div>`;
    h += `<div class="row" style="margin:0 0 14px">${hasTTS ? '<button class="btn fill" data-act="play">▶ Play session aloud</button>' : ''}<span class="muted" style="align-self:center">${steps.length} steps · ${esc(fmtLong(st.date))}</span></div>`;
    steps.forEach((s, i) => {
      h += `<div class="step ${st.active === i ? 'on' : ''}" id="st${i}"><div class="t">${esc(s.title)}</div>`;
      if (s.type === 'prayer') h += `<div class="tx">${esc(s.body)}</div>${speakBtn(s.text)}`;
      else if (s.type === 'calendar') h += `<div class="tx">${esc(s.head)}</div><div class="muted">${esc(s.sub)}</div>`;
      else if (s.type === 'quote') h += `<div class="quote">“${esc(s.q.t)}”<small>${esc(s.q.s)} · ${esc(s.q.w)}</small></div>`;
      else if (s.type === 'art') h += artHTML(s.a);
      else if (s.type === 'readings') h += (rite === 'byz' ? byzReadingsHTML(v) : rite === 'sarum' ? sarumMassHTML(v) : romanReadingsHTML(st.date));
      else if (s.type === 'office') h += (window.Hours ? `<details open><summary class="muted">Show or hide</summary>${rite === 'roman' ? Hours.modern(L, P(st.date), s.which) : rite === 'sarum' ? (Hours.sarum && Hours.sarum(L, P(st.date), s.which, window.Sarum) || '<p class="muted" style="font-size:.82rem">The Sarum office for this part of the year has not been added yet (so far the Trinity season, from the end of the Octave of Corpus Christi, and Advent up to 23 December). Nothing is shown in its place, so as not to repeat the Roman office.</p>') : Hours.hour(L, P(st.date), s.which)}</details>${rite === 'roman' ? `<div class="row">${linksHTML('roman', s.hour)}</div><p class="muted" style="font-size:.78rem">For the full modern text with the official antiphons, readings and intercessions, use the buttons above.</p>` : rite === 'sarum' ? `<p class="muted" style="font-size:.78rem;margin-top:8px">Not in the app yet — Matins, Prime, Terce, Sext, None, Compline, saints\u2019 offices and the other seasons. Read them in English here:</p><div class="row">${linksHTML('sarum', 'any')}</div>` : ''}` : '');
      else if (s.type === 'hourlink') h += `<div class="row">${linksHTML(rite, s.hour)}</div>`;
      else if (s.type === 'silence') h += `<div class="tx">${esc(s.text || 'Be still before God.')}</div><div class="timer" id="tm${i}">${Math.floor(s.seconds / 60)}:${pad(s.seconds % 60)}</div><button class="btn sm" data-act="timer" data-i="${i}" data-s="${s.seconds}">Start timer</button>`;
      h += '</div>';
    });
    return h;
  }

  function justiceCard(j) {
    return `<section class="card"><div class="lab"><span class="grow">${esc(j.tag)}</span></div><p style="font-family:var(--serif);font-size:1.05rem;line-height:1.55">“${esc(j.text)}”</p><p class="muted">${esc(j.who)} — ${esc(j.note)}</p><div class="row"><a class="btn" target="_blank" rel="noopener" href="${esc(j.url)}">Read the full text</a></div></section>`;
  }
  function viewJustice() {
    const J = window.JUSTICE || [];
    if (!J.length) return '<p class="muted">No excerpts loaded.</p>';
    const d = P(st.date), n = Math.floor(d.getTime() / 864e5), f = J[((n % J.length) + J.length) % J.length];
    const items = (feed && feed._justice && feed._justice.items) || [];
    let daily = '';
    if (items.length) {
      const it = items[((n % items.length) + items.length) % items.length], mins = Math.max(1, Math.round(it.words / 200));
      daily = `<h3>Today’s reading · about ${mins} min</h3><section class="card"><div class="lab"><span class="grow">${esc(it.author)}</span></div><p class="muted" style="margin-top:0">${esc(it.work)} — part ${esc(it.part)}</p>${it.paras.map(p => `<p style="font-family:var(--serif);font-size:1.05rem;line-height:1.65">${esc(p)}</p>`).join('')}<div class="row"><a class="btn" target="_blank" rel="noopener" href="${esc(it.url)}">Full text</a></div><p class="muted" style="font-size:.78rem">Public-domain translation. A new passage each day; the series repeats when it ends.</p></section>`;
    } else daily = '<p class="muted">The daily reading appears after the next refresh of your readings (the GitHub job runs a few times a day). Short quotations are below.</p>';
    return `<h2 style="font-family:var(--serif)">Justice and the poor</h2><p class="muted">The Fathers, saints, councils, popes and the Catechism on wealth, work, the poor and creation.</p>${daily}<h3>A short quotation</h3>${justiceCard(f)}<h3>More quotations</h3>${J.map(justiceCard).join('')}`;
  }

  function viewCalendar() {
    if (!st.month) { const d = P(st.date); st.month = { y: d.getUTCFullYear(), m: d.getUTCMonth() }; }
    const { y, m } = st.month, first = L.D(y, m + 1, 1), start = L.add(first, -first.getUTCDay()), today = todayISO();
    let h = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><button class="ib" data-act="mprev">‹</button><h2 style="flex:1;text-align:center;margin:0">${L.MN[m]} ${y}</h2><button class="ib" data-act="mnext">›</button></div>
      <div class="legend">${['roman', 'byz', 'sarum'].map(k => `<button data-act="layer" data-v="${k}" class="${st.layers[k] ? 'on' : ''}">${k === 'roman' ? 'Roman' : k === 'byz' ? 'Byzantine' : 'Sarum'}</button>`).join('')}</div><div class="grid">`;
    for (const d of L.DN) h += `<div class="dow">${d.slice(0, 3)}</div>`;
    for (let i = 0; i < 42; i++) {
      const d = L.add(start, i), iso = L.iso(d), v = dayInfo(iso), out = d.getUTCMonth() !== m;
      const dots = ['roman', 'byz', 'sarum'].filter(k => st.layers[k]).map(k => `<span class="dot ${MAJOR.test(v[k].rank || '') ? 'maj' : ''}" style="--c:${col(v[k].color)}"></span>`).join('');
      const f = (st.layers.sarum && v.sarum.fast && !/^Friday/.test(v.sarum.fast)) || (st.layers.byz && v.byz.fast && !/^(Wednesday|Friday)/.test(v.byz.fast));
      h += `<button class="cell ${out ? 'out' : ''} ${iso === today ? 'today' : ''} ${iso === st.date ? 'sel' : ''}" data-act="pick" data-d="${iso}"><span>${d.getUTCDate()}</span>${f ? '<span class="f">ƒ</span>' : ''}<span class="dots">${dots}</span></button>`;
    }
    h += '</div><p class="muted">Dot colours are each calendar’s liturgical colour; a gold ring marks a solemnity, principal or great feast; ƒ marks a fast day beyond ordinary Friday/Wednesday abstinence.</p>';
    const v = dayInfo(st.date);
    h += `<h3 style="margin-top:14px">${esc(fmtLong(st.date))}</h3>${st.layers.roman ? cardRoman(v) : ''}${st.layers.byz ? cardByz(v) : ''}${st.layers.sarum ? cardSarum(v) : ''}`;
    return h;
  }

  function viewMore() {
    return `<section class="card"><h3>Settings</h3><div class="row"><button class="btn fill" data-act="settings">Open settings</button></div></section>
    <section class="card"><h3>Hours of the day</h3>${hoursHTML()}</section>
    <section class="card"><h3>About the calendars</h3>
      <p><b>Roman (modern)</b> — General Roman Calendar with cycles; Ascension, Corpus Christi and Epiphany follow your settings.</p>
      <p><b>Byzantine</b> — Byzantine cycle computed from Pascha (Gregorian or Julian reckoning), Menaion feasts on Gregorian dates by default, plus entries from your own UGCC calendar (2026–27).</p>
      <p><b>Sarum (traditional)</b> — Sarum temporal cycle with Ember Days, Rogation, vigils, octaves, Lenten and St Martin’s fasts, and the feasts from your Gaelic Sarum calendars (valid for any year).</p></section>
    <section class="card"><h3>Credits &amp; sources</h3>
      <p class="muted">Roman readings: USCCB daily readings feed (bible.usccb.org); fallback citations from the <a href="https://cpbjr.github.io/catholic-readings-api/">Catholic Readings API</a>. Art images: Wikipedia / Wikimedia Commons. Prayer texts: public domain (Douay-Rheims–Challoner wording, Keble’s Phos Hilaron). Official links: USCCB, Universalis, Divine Office, Metropolitan Cantor Institute, Stamford Eparchy, Divine Praises.</p>
      <p class="muted">Quotations are modern renderings of public-domain translations; check the cited work before quoting in print.</p></section>`;
  }
  function hoursHTML() {
    const rite = S.rite, hrs = C.HOURS[rite], now = new Date().getHours() + new Date().getMinutes() / 60;
    let cur = -1; hrs.forEach((x, i) => { if (x.start != null && x.start <= now) cur = i; });
    if (rite === 'byz' && now >= 0 && cur < 0) cur = 0;
    let h = `<div class="seg">${Object.keys(RITES).map(k => `<button data-act="rite" data-v="${k}" class="${rite === k ? 'on' : ''}">${k === 'roman' ? 'Roman' : k === 'byz' ? 'Byzantine' : 'Sarum'}</button>`).join('')}</div>`;
    hrs.forEach((x, i) => { h += `<div class="cite" style="${i === cur ? 'background:var(--line);border-radius:8px;padding:7px 8px' : ''}"><span><b>${esc(x.n)}</b> <span class="muted">· ${esc(x.alt)}</span><br><span class="muted">${esc(x.d)}</span></span><span>${esc(x.at)}${i === cur ? '<br><b>now</b>' : ''}</span></div>`; });
    h += `<div class="row">${linksHTML(rite, 'any')}</div>`;
    return h;
  }

  /* ---------- render ---------- */

  /* ---------- ASV text for Byzantine readings (public domain, fetched once, cached) ---------- */
  const asvCache = {};
  async function asvText(ref, tr) {
    const k = `ora.${tr}.` + ref;
    if (asvCache[k]) return asvCache[k];
    const c = store.get(k, null); if (c) return (asvCache[k] = c);
    const r = await fetch('https://bible-api.com/' + encodeURIComponent(ref) + '?translation=' + tr);
    if (!r.ok) throw new Error('http ' + r.status);
    const j = await r.json();
    const html = (j.verses || []).map(v => `<sup>${v.verse}</sup>${esc(String(v.text).replace(/\s+/g, ' ').trim())}`).join(' ');
    if (!html) throw new Error('empty');
    store.set(k, html); return (asvCache[k] = html);
  }
  async function hydrateAsv() {
    for (const el of document.querySelectorAll('.asv[data-ref]:not([data-done])')) {
      el.dataset.done = '1'; el.textContent = 'Loading text…';
      const tr = el.dataset.tr || 'asv';
      try {
        const parts = [];
        for (const r of el.dataset.ref.split('|')) parts.push(await asvText(r, tr));
        el.innerHTML = parts.join(' ') + `<div class="muted" style="font-size:.74rem;margin-top:4px">${tr === 'dra' ? 'Douay-Rheims (public domain). Verse numbers can differ slightly from the Liturgy of the Hours.' : 'American Standard Version (1901, public domain) — close to the RSV but not identical.'}</div>`;
      } catch (e) { el.innerHTML = '<span class="muted">Text unavailable offline — it loads and is saved the first time you open this day online.</span>'; }
    }
  }
  new MutationObserver(() => hydrateAsv()).observe(document.getElementById('app'), { childList: true, subtree: true });

  function renderHeader() {
    $('#hdr').innerHTML = `<button class="ib" data-act="prev" aria-label="Previous day">‹</button><button class="date" data-act="datepick" style="flex:1;text-align:center"><b>${esc(fmtShort(st.date))}</b><span class="muted" style="font-size:.74rem">${st.date === todayISO() ? 'Today' : 'Tap to choose date'}</span></button><input type="date" id="dp" value="${st.date}"><button class="ib" data-act="next" aria-label="Next day">›</button><button class="ib" data-act="today" title="Today">⌂</button>`;
  }
  function render() {
    renderHeader();
    document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === st.tab));
    $('#app').innerHTML = st.tab === 'today' ? viewToday() : st.tab === 'pray' ? viewPray() : st.tab === 'readings' ? viewReadings() : st.tab === 'calendar' ? viewCalendar() : st.tab === 'justice' ? viewJustice() : viewMore();
  }

  /* ---------- audio (Web Speech API) ---------- */
  const A = { token: 0, paused: false, playing: false };
  function pickVoice() {
    if (!hasTTS) return null; const vs = speechSynthesis.getVoices();
    return vs.find(v => v.voiceURI === S.voice) || vs.find(v => /^en[-_]/i.test(v.lang) && /natural|enhanced|premium|samantha|daniel|serena|google uk/i.test(v.name)) || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  const chunk = t => { const out = []; let cur = ''; for (const s of t.replace(/\s+/g, ' ').match(/[^.!?;:]+[.!?;:]*\s*/g) || [t]) { if ((cur + s).length > 180) { if (cur) out.push(cur); cur = s; } else cur += s; } if (cur) out.push(cur); return out; };
  function say(text) {
    return new Promise(res => {
      if (!hasTTS) return res();
      const my = A.token, parts = chunk(text); let i = 0;
      const next = () => { if (my !== A.token || i >= parts.length) return res(); const u = new SpeechSynthesisUtterance(parts[i++]); u.rate = S.rate; const v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; } u.onend = next; u.onerror = () => res(); speechSynthesis.speak(u); };
      next();
    });
  }
  function stopAudio() { A.token++; A.playing = false; A.paused = false; if (hasTTS) speechSynthesis.cancel(); $('#player').classList.remove('show'); st.active = -1; }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  async function countdown(i, secs) {
    const my = A.token; let left = secs;
    while (left > 0 && my === A.token) { const e = $('#tm' + i); if (e) e.textContent = `${Math.floor(left / 60)}:${pad(left % 60)}`; await wait(1000); if (!A.paused) left--; }
    const e = $('#tm' + i); if (e) e.textContent = `${Math.floor(secs / 60)}:${pad(secs % 60)}`;
  }
  async function playSession() {
    stopAudio(); const my = ++A.token; A.playing = true;
    const steps = stepsFor(S.rite, st.kind, dayInfo(st.date));
    $('#player').classList.add('show'); $('#ppbtn').textContent = '❚❚';
    for (let i = 0; i < steps.length && my === A.token; i++) {
      st.active = i; $('#pname').textContent = steps[i].title;
      document.querySelectorAll('.step').forEach((e, j) => e.classList.toggle('on', j === i));
      const el = $('#st' + i); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await say(steps[i].text);
      if (steps[i].type === 'silence') await countdown(i, steps[i].seconds);
      else if (steps[i].type === 'quote' || steps[i].type === 'art') await wait(1500);
    }
    if (my === A.token) stopAudio();
  }

  /* ---------- settings dialog ---------- */
  function openSettings() {
    const d = $('#dlg'), vs = hasTTS ? speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)) : [];
    const sel = (id, label, opts, cur) => `<label for="${id}">${label}</label><select id="${id}">${opts.map(([v, t]) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
    d.innerHTML = `<h3>Settings</h3>
      ${sel('s_rite', 'Primary rite (prayer, quotes, hours)', Object.entries(RITES), S.rite)}
      ${sel('s_asc', 'Roman: Ascension', [['thursday', 'Thursday (universal)'], ['sunday', 'Sunday (most US provinces)']], S.ascension)}
      ${sel('s_corp', 'Roman: Corpus Christi', [['thursday', 'Thursday (universal)'], ['sunday', 'Sunday']], S.corpus)}
      ${sel('s_epi', 'Roman: Epiphany', [['jan6', 'January 6 (universal)'], ['sunday', 'Sunday (USA)']], S.epiphany)}
      ${sel('s_pas', 'Byzantine: Pascha reckoning', [['gregorian', 'Gregorian (same as Western Easter)'], ['julian', 'Julian (Orthodox date)']], S.byzPascha)}
      <div class="check"><input type="checkbox" id="s_old" ${S.byzOldCal ? 'checked' : ''}><label for="s_old" style="margin:0;color:var(--ink)">Byzantine: fixed feasts on the Old (Julian) calendar</label></div>
      <div class="check"><input type="checkbox" id="s_lady" ${S.ladyDayTransfer ? 'checked' : ''}><label for="s_lady" style="margin:0;color:var(--ink)">Sarum: move Lady Day out of Holy Week/Easter Octave</label></div>
      ${hasTTS ? `${sel('s_voice', 'Voice', [['', 'Automatic'], ...vs.map(v => [v.voiceURI, v.name + ' (' + v.lang + ')'])], S.voice)}<label for="s_rate">Speech speed: <span id="s_rv">${S.rate}</span></label><input type="range" id="s_rate" min="0.6" max="1.3" step="0.05" value="${S.rate}">` : ''}
      <div class="row" style="margin-top:14px"><button class="btn fill" data-act="savesettings">Save</button><button class="btn" data-act="closedlg">Cancel</button></div>`;
    d.showModal();
    const r = $('#s_rate', d); if (r) r.oninput = () => $('#s_rv', d).textContent = r.value;
  }
  function saveSettings() {
    const g = id => { const e = $('#' + id); return e ? e.value : null; };
    Object.assign(S, { rite: g('s_rite'), ascension: g('s_asc'), corpus: g('s_corp'), epiphany: g('s_epi'), byzPascha: g('s_pas'), byzOldCal: $('#s_old').checked, ladyDayTransfer: $('#s_lady').checked });
    if ($('#s_voice')) { S.voice = g('s_voice'); S.rate = +g('s_rate'); }
    save(); infoCache.clear(); $('#dlg').close(); render();
  }

  /* ---------- events ---------- */
  let timer = null;
  document.addEventListener('click', e => {
    const tb = e.target.closest('[data-tab]'); if (tb) { st.tab = tb.dataset.tab; render(); window.scrollTo(0, 0); return; }
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act, v = b.dataset.v;
    switch (a) {
      case 'prev': st.date = addISO(st.date, -1); st.month = null; break;
      case 'next': st.date = addISO(st.date, 1); st.month = null; break;
      case 'today': st.date = todayISO(); st.month = null; break;
      case 'datepick': { const dp = $('#dp'); if (dp.showPicker) dp.showPicker(); else dp.click(); return; }
      case 'rr': st.readRite = v; break;
      case 'rite': S.rite = v; save(); break;
      case 'kind': st.kind = v; break;
      case 'goPray': st.kind = b.dataset.k; st.tab = 'pray'; window.scrollTo(0, 0); break;
      case 'qnext': st.quoteShift++; break;
      case 'artnext': st.artShift++; break;
      case 'mprev': st.month.m--; if (st.month.m < 0) { st.month.m = 11; st.month.y--; } break;
      case 'mnext': st.month.m++; if (st.month.m > 11) { st.month.m = 0; st.month.y++; } break;
      case 'layer': st.layers[v] = !st.layers[v]; break;
      case 'pick': st.date = b.dataset.d; break;
      case 'settings': openSettings(); return;
      case 'savesettings': saveSettings(); return;
      case 'closedlg': $('#dlg').close(); return;
      case 'say': { stopAudio(); const my = ++A.token; say(decodeURIComponent(b.dataset.say)); return; }
      case 'play': playSession(); return;
      case 'stop': stopAudio(); return;
      case 'pp': if (!hasTTS) return; if (A.paused) { speechSynthesis.resume(); A.paused = false; $('#ppbtn').textContent = '❚❚'; } else { speechSynthesis.pause(); A.paused = true; $('#ppbtn').textContent = '▶'; } return;
      case 'timer': { const i = +b.dataset.i; A.token++; countdown(i, +b.dataset.s); return; }
    }
    render();
  });
  document.addEventListener('change', e => { if (e.target.id === 'dp' && e.target.value) { st.date = e.target.value; st.month = null; render(); } });
  if (hasTTS) speechSynthesis.onvoiceschanged = () => { };

  render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
})();
