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
  const COLORS = { y: '#d4a017', w: '#f0e8da', r: '#a8232a', g: '#3d7a4a', v: '#6a3f9a', rose: '#d9899e', k: '#1c1c1c', gold: '#c9a227' };
  const col = c => COLORS[c] || COLORS.g;
  const MAJOR = /Solemnity|Principal|Great Feast|Triduum|Holy Week|Class I$/;
  const RITES = { roman: 'Roman (modern)', byz: 'Byzantine', sarum: 'Traditional' };

  /* ---------- settings & state ---------- */
  const S = Object.assign({}, L.DEFAULTS, { ladyDayTransfer: true, rite: 'roman', rate: 0.95, voice: '', readingSize: 'comfortable' }, store.get('ora.settings', {}));
  S.byzPascha = 'gregorian'; S.byzOldCal = false;   // Byzantine calendar on the Gregorian reckoning, matching the Roman
  if (!Object.hasOwn(RITES, S.rite)) S.rite = 'roman';
  S.byzChurch = 'ruthenian';
  S.byzLiturgyChurch = 'ruthenian';
  S.byzAnna = 'default'; // Pittsburgh observes the Maternity of Holy Anna on December 8.
  if (!['compact', 'comfortable', 'large'].includes(S.readingSize)) S.readingSize = 'comfortable';
  const applyReadingSize = () => document.documentElement.style.setProperty('--reading-scale', { compact: .94, comfortable: 1, large: 1.18 }[S.readingSize]);
  applyReadingSize();
  const save = () => store.set('ora.settings', S);
  // User-requested migration keeps every Byzantine view in the Pittsburgh tradition.
  if (!S.ruthenian2026) { S.ruthenian2026 = true; save(); }
  const st = { tab: 'today', date: todayISO(), month: null, sel: null, layers: { roman: true, byz: true, sarum: true }, readRite: S.rite || 'roman',
    prayView: 'office', liturgyView: 'byz', kind: new Date().getHours() < 14 ? 'morning' : 'evening', artShift: 0, quoteShift: 0, popeShift: 0, shour: (h => h < 4 ? 'C' : h < 6 ? 'M' : h < 9 ? 'L' : h < 16 ? 'LH' : h < 20 ? 'V' : 'C')(new Date().getHours()), active: -1, readings: {}, art: {} };

  {
    // Restore the current navigation after a refresh, without persisting the
    // selected calendar date or overriding explicit links to a tab.
    const remembered = store.get('ora.navigation', {});
    const validTabs = ['today', 'pray', 'readings', 'liturgy', 'justice', 'calendar', 'more'];
    if (validTabs.includes(remembered.tab)) st.tab = remembered.tab;
    if (['roman', 'byz', 'sarum'].includes(remembered.readRite)) st.readRite = remembered.readRite;
    if (['mass', 'byz'].includes(remembered.liturgyView)) st.liturgyView = remembered.liturgyView;
    const q = new URLSearchParams(location.search), date = q.get('date');
    if (['today', 'pray', 'readings', 'liturgy', 'justice', 'calendar', 'more'].includes(q.get('tab'))) st.tab = q.get('tab');
    if (/^\d{4}-\d\d-\d\d$/.test(date || '') && +date.slice(0, 4) >= 1000 && L.iso(P(date)) === date) st.date = date;
    if (['morning', 'evening', 'night'].includes(q.get('kind'))) st.kind = q.get('kind');
    if (Object.hasOwn(RITES, q.get('rite'))) S.rite = q.get('rite');
    if (Object.hasOwn(RITES, q.get('rite'))) st.readRite = S.rite;
  }

  /* ---------- calendar data ---------- */
  const infoCache = new Map();
  const cacheKey = iso => iso + JSON.stringify([S.ascension, S.corpus, S.epiphany, S.byzPascha, S.byzOldCal, S.byzChurch, S.byzAnna, S.ladyDayTransfer]);
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
  /* day-by-day rotation: key starts with the ISO date, so each day moves one step through the list (no repeats until it wraps) */
  const mix = s => { let h = hash(s); h ^= h >>> 16; h = Math.imul(h, 0x45d9f3b) >>> 0; h ^= h >>> 16; return h >>> 0; };
  function pick(list, key, shift, tags, rite) {
    const day = Math.round(P(key.slice(0, 10)).getTime() / 864e5), salt = mix(key.slice(10));
    let pool = list.filter(x => x.tags && x.tags.some(g => g !== 'general' && tags.has(g)));
    if (!pool.length || mix(key) % 3 === 0) pool = list.filter(x => !x.tags || x.tags.includes('general') || x.tags.some(g => tags.has(g)));
    if (rite) { const pref = rite === 'byz' ? 'East' : null; if (pref) { const e = pool.filter(x => x.tr === pref); if (e.length && mix(key + 'x') % 3 !== 0) pool = e; } }
    return pool[(((day + salt + shift) % pool.length) + pool.length) % pool.length];
  }
  // Restrict saint quotations to the chosen tradition; seasonal tags rank within that pool.
  // Roman includes the full Catholic collection; Byzantine uses early Eastern Fathers;
  // Traditional uses Western saints whose lives ended before AD 1500.
  const EARLY_WEST = new Set([
    'St. Augustine of Hippo', 'St. Thomas Aquinas', 'St. Benedict of Nursia',
    'St. Bernard of Clairvaux', 'St. Jerome', 'St. Irenaeus of Lyons',
    'St. Francis of Assisi', 'St. Clare of Assisi'
  ]);
  const quoteEligible = (q, rite) => rite === 'byz' ? q.tr === 'East'
    : rite === 'sarum' ? q.tr === 'West' && EARLY_WEST.has(q.s)
    : q.tr === 'West' || q.tr === 'East';
  const quoteFor = (v, rite) => {
    const eligible = C.QUOTES.filter(q => quoteEligible(q, rite));
    return pick(eligible, v.iso + rite, st.quoteShift, tagsFor(v), null);
  };
  // Select art by tradition and period, retaining seasonal rotation.
  const PRE1500_WEST_ART = new Set([
    'The Last Supper', 'Pietà', 'The Annunciation', 'Ghent Altarpiece',
    'Adoration of the Magi', 'The Baptism of Christ',
    'The Descent from the Cross', 'The Resurrection', 'Holy Trinity'
  ]);
  const artEligible = (a, rite) => rite === 'byz' ? a.tr === 'East'
    : rite === 'sarum' ? a.tr === 'West' && PRE1500_WEST_ART.has(a.t)
    : a.tr === 'West';
  const artFor = (v, rite) => {
    const eligible = C.ART.filter(a => artEligible(a, rite));
    const selected = pick(eligible, v.iso + 'art' + rite, st.artShift, tagsFor(v), null);
    if (!selected) return null;
    const known = st.art[selected.q];
    if (!known || known === 'loading' || known.img) return selected;
    // If the selected work has no verified image, try another within the same tradition.
    const alternates = eligible.filter(x => x.q !== selected.q && !(st.art[x.q] && st.art[x.q] !== 'loading' && !st.art[x.q].img));
    return alternates.length ? pick(alternates, v.iso + 'art-fallback' + rite, st.artShift, tagsFor(v), null) : selected;
  };

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
  function romanReadingsHTML(iso, showAudio = true) {
    const r = st.readings[iso];
    let h = '';
    if (r === 'loading') h += '<p class="muted">Loading readings…</p>';
    else if (r && r.full) {
      if (r.full.title) h += `<h3 class="reading-main-title">${esc(r.full.title)}</h3>`;
      if (showAudio && /^\d+$/.test(String(r.full.audio || ''))) h += `<iframe title="USCCB audio of the readings" width="100%" height="120" scrolling="no" frameborder="0" loading="lazy" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F${r.full.audio}&visual=false&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false"></iframe>`;
      for (const s of r.full.sections) {
        h += `<div class="step reading-group" style="margin-top:10px"><div class="reading-heading"><div class="reading-label">${esc(s.label)}</div>${s.cite ? `<div class="reading-reference">${esc(s.cite)}</div>` : ''}</div><div class="tx">${esc(s.text)}</div>${speakBtn(`${s.label}. ${s.cite}. ${s.text.replace(/\bR\.\s*/g, '')}`)}</div>`;
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
  const byzDay = (iso, church = S.byzChurch) => {
    const day = ByzLect.read(P(iso), 0, L.westernEaster, church, L.byzAnnaDay(S));
    day.notes = day.notes.map(note => note.startsWith('Saint Anna’s feast') ? 'Pittsburgh observes the Maternity of Holy Anna on December 8.' : note);
    return day;
  };
  const byzSpeech = iso => { try { return byzDay(iso).sets.map(s => s.t + '. ' + s.r.map(x => x[0] + ', ' + x[1]).join('. ')).join(' ') } catch (e) { return ''; } };
  function byzReadingsHTML(v, church = S.byzChurch, showDay = true) {
    const t = church === S.byzChurch ? v.byz : L.byzantine(P(v.iso), {...S,byzChurch:church});
    let h = `${showDay ? `<h3 class="reading-main-title">${esc(t.title)}</h3>` : ''}${t.tone ? `<p class="muted">Tone ${t.tone}</p>` : ''}`, day = null;
    try { day = byzDay(v.iso, church); } catch (e) { day = null; }
    if (day && day.sets.length) {
      for (const s of day.sets) {
        h += `<div class="step reading-group" style="margin-top:10px">${day.sets.length > 1 ? `<div class="reading-day-title">${esc(s.t)}</div>` : ''}`;
        for (const [lab, cs] of s.r) h += `<div class="reading-heading"><div class="reading-label">${esc(lab)}</div><div class="reading-reference">${esc(cs)}</div></div>` + String(cs).split(' · ').map(c => `<div class="asv" data-ref="${esc(c.replace(/\s*\([^)]*\)/g, '').trim())}"></div>`).join('');
        for (const [lab, cs] of (s.a || [])) h += `<div class="reading-heading"><div class="reading-label">${esc(lab)}</div><div class="reading-reference">${esc(cs)}</div></div>`;
        if (s.chk) h += `<p class="note">Check this one: ${esc(s.chk)}</p>`;
        h += '</div>';
      }
      for (const n of day.notes) h += `<p class="muted">${esc(n)}</p>`;
      for (const s of day.sets) { const gr = s.r.find(x => /gospel/i.test(x[0]) && !/matins/i.test(x[0])); if (gr) { h += fathersBlock(String(gr[1]).split(' · ')[0].replace(/\s*\([^)]*\)/g, '')); break; } }
    } else h += '<p class="muted">No reading found in the table for this day.</p>';
    h += `<p class="muted" style="font-size:.8rem">Scripture passages are shown above in the public-domain American Standard Version when available. For a Catholic translation or when the text cannot load, use the reference links below.</p>`;
    h += `<details><summary class="muted">Reading references and backup links</summary>${day && day.sets.length ? day.sets.map(s => `<div class="step">${day.sets.length > 1 ? `<b>${esc(s.t)}</b>` : ''}${s.r.map(([lab,cs]) => `<div class="cite"><span>${esc(lab)}</span><span>${citeLinks(cs)}</span></div>`).join('')}</div>`).join('') : ''}</details>`;
    h += `<p class="muted" style="font-size:.8rem">Ruthenian Byzantine Catholic practice of Pittsburgh. Reading references use the Slavic lectionary, with selected corrections checked against the <a href="https://mci.archpitt.org/Lectionary.html" target="_blank" rel="noopener">Metropolitan Cantor Institute</a>. This is a computed cycle; consult the parish Typikon for feast combinations.</p>`;
    h += `<div class="row"><a class="btn" href="https://mci.archpitt.org/Lectionary.html" target="_blank" rel="noopener">Ruthenian lectionary</a><a class="btn" href="https://mci.archpitt.org/sheetmusic/general/Menaion_${L.MN[P(v.iso).getUTCMonth()]}.pdf" target="_blank" rel="noopener">${L.MN[P(v.iso).getUTCMonth()]} hymns and saints</a>${v.iso.startsWith('2026-') ? '<a class="btn" href="https://mci.archpitt.org/LiturgicalCalendar2026.html" target="_blank" rel="noopener">2026 Pittsburgh calendar</a>' : ''}</div>`;
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
  const loadFathers = () => fathersP || (fathersP = fetch('fathers.json').then(r => { if (!r.ok) throw new Error('x'); return r.json(); }).catch(e => { fathersP = null; throw e; }));
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
  /* Multi-source sacred art lookup. Never display a different work under the selected metadata. */
  const artMatch = (a, name) => {
    const title = String(name || '').replace(/[_–—-]/g, ' ').toLowerCase();
    const pattern = a.fm ? new RegExp(a.fm, 'i') : null;
    return pattern ? pattern.test(title) : title.includes(a.t.toLowerCase());
  };
  async function wikipediaArt(a) {
    const u = 'https://en.wikipedia.org/w/api.php?action=query&redirects=1&titles=' + encodeURIComponent(a.wt || a.t) + '&prop=pageimages|info&piprop=thumbnail|name&pithumbsize=1100&inprop=url&format=json&origin=*';
    const r = await fetch(u); if (!r.ok) return null;
    const j = await r.json(), p = j.query && j.query.pages && Object.values(j.query.pages)[0];
    return p && !p.missing && p.thumbnail && artMatch(a, decodeURIComponent(p.pageimage || '')) ? {img:p.thumbnail.source,url:p.fullurl,source:'Wikipedia'} : null;
  }
  async function commonsArt(a) {
    const query = a.q || a.t;
    const u = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=15&gsrsearch=' + encodeURIComponent(query) + '&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1100&format=json&origin=*';
    const r = await fetch(u); if (!r.ok) return null;
    const j = await r.json(), pages = Object.values(j.query?.pages || {});
    for (const p of pages) {
      const info = p.imageinfo?.[0], meta = info?.extmetadata || {};
      if (!info || !artMatch(a, p.title)) continue;
      const license = (meta.LicenseShortName?.value || '').toLowerCase();
      if (!(/public domain|^pd|cc0|cc by/.test(license))) continue;
      return {img:info.thumburl || info.url,url:info.descriptionurl,source:'Wikimedia Commons',license:meta.LicenseShortName?.value || ''};
    }
    return null;
  }
  async function metArt(a) {
    const search = await fetch('https://collectionapi.metmuseum.org/public/collection/v1/search?hasImages=true&q='+encodeURIComponent(a.t));
    if (!search.ok) return null;
    const ids = (await search.json()).objectIDs || [];
    for (const id of ids.slice(0,8)) {
      const r = await fetch('https://collectionapi.metmuseum.org/public/collection/v1/objects/'+id);
      if (!r.ok) continue;
      const o = await r.json();
      if (!o.isPublicDomain || !o.primaryImageSmall || !artMatch(a,o.title)) continue;
      return {img:o.primaryImageSmall,url:o.objectURL,source:'The Metropolitan Museum of Art',license:'Public domain'};
    }
    return null;
  }
  async function chicagoArt(a) {
    const u='https://api.artic.edu/api/v1/artworks/search?q='+encodeURIComponent(a.t)+'&limit=10&fields=id,title,artist_title,is_public_domain,image_id';
    const r=await fetch(u);if(!r.ok)return null;
    const j=await r.json();
    for(const o of j.data || []){
      if(!o.is_public_domain || !o.image_id || !artMatch(a,o.title))continue;
      return {img:'https://www.artic.edu/iiif/2/'+encodeURIComponent(o.image_id)+'/full/843,/0/default.jpg',url:'https://www.artic.edu/artworks/'+o.id,source:'Art Institute of Chicago',license:'Public domain'};
    }
    return null;
  }
  async function loadArt(a) {
    if (!a || st.art[a.q] !== undefined) return;
    const k='ora.art3.'+a.q, cached=store.get(k,null);
    if(cached && (cached.img || (cached.at && Date.now()-cached.at<864e5))){st.art[a.q]=cached;return;}
    st.art[a.q]='loading';
    let result=null;
    for(const lookup of [wikipediaArt,commonsArt,metArt,chicagoArt]){
      try{result=await lookup(a);if(result?.img)break;}catch(_){}
    }
    const out=result || {img:'',url:'https://commons.wikimedia.org/w/index.php?search='+encodeURIComponent(a.q),source:'No verified image'};
    out.at=Date.now();st.art[a.q]=out;store.set(k,out);render();
  }
  function artHTML(a,big){
    if(!a)return '<p class="muted">Artwork unavailable.</p>';
    loadArt(a);const m=st.art[a.q];
    let h='<div class="art">';
    h+=m?.img ? `<img src="${esc(m.img)}" alt="${esc(a.t)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.hidden=false"><div class="ph" hidden>Image unavailable. Choose Another to view a different work.</div>` : `<div class="ph">${m==='loading'?'Finding a verified artwork…':'No verified image available. Choose Another.'}</div>`;
    h+=`<h3 class="artwork-title">${esc(a.t)}</h3><div class="muted">${esc(a.a)} · ${a.tr==='East'?'Eastern':'Western'} tradition</div><p class="muted" style="font-size:.92rem;line-height:1.55;margin:12px 0">${esc(a.p)}</p>`;
    if(m?.source && m.img)h+=`<p class="muted" style="font-size:.73rem;margin:3px 0">Image: ${esc(m.source)}${m.license?' · '+esc(m.license):''}</p>`;
    h+=`<div class="row"><button class="btn sm" data-act="artnext">Another</button>${m?.url?`<a class="btn sm" target="_blank" rel="noopener noreferrer" href="${esc(m.url)}">About this work</a>`:''}${speakBtn(`${a.t}. ${a.a}. ${a.p}`)}</div></div>`;
    return h;
  }

  /* ---------- UI pieces ---------- */
  const hasTTS = false; // computer-voice read-aloud switched off (set to typeof speechSynthesis !== 'undefined' to bring it back)
  const speakBtn = text => hasTTS ? `<button class="listen" data-act="say" data-say="${encodeURIComponent(text)}">🔊 Listen</button>` : '';
  const chip = (t, cls = '') => t ? `<span class="chip ${cls}">${esc(t)}</span>` : '';
  const chipsFor = r => chip(r.rank, MAJOR.test(r.rank || '') ? 'major' : '') + (r.season && r.season !== r.rank ? chip(r.season) : '');
  function alsoHTML(a) { return a && a.length ? `<ul class="also">${a.slice(0, 5).map(x => `<li>${esc(x.title)} <i>— ${esc(x.note)}</i></li>`).join('')}</ul>` : ''; }
  function spokenCard(r, extra) { return `${r.title}. ${r.rank || ''}. ${r.season || ''}. ${r.fast || ''} ${extra || ''}`; }

  // Compact fasting markers describe the calendar's stated observance; see More for discipline distinctions.
  function fastingIcons(r, rite) {
    const fast = String(r.fast || ''), note = String(r.fastingNote || ''), full = fast + ' ' + note;
    if (!fast || /no fast|fast[- ]free|dispens|fast is lifted/i.test(full)) return '';
    const kinds = [];
    if (/abstinen|no meat|without meat|strict fast|great fast|fast and abstinence/i.test(full)) kinds.push('meat');
    if (rite === 'byz' && /strict fast|no dairy|without dairy|dairy and eggs|meat, dairy/i.test(full)) kinds.push('dairy','eggs');
    if (/no oil|without oil|abstain from oil/i.test(full)) kinds.push('oil');
    if (!kinds.length) return '';
    const paths = {
      meat:'<path d="M6 14c-2-2-1-5 1-7s5-3 7-1 3 5 1 7-5 3-7 3l-2 3-2-2 2-3z"/>',
      dairy:'<path d="M9 3h6v4l2 3v11H7V10l2-3V3zM9 7h6M7 13h10"/>',
      eggs:'<path d="M12 3c-4 0-7 8-7 12a7 7 0 0 0 14 0c0-4-3-12-7-12z"/>',
      oil:'<path d="M12 3c-3 5-6 9-6 12a6 6 0 0 0 12 0c0-3-3-7-6-12z"/>'
    };
    const labels = {meat:'No meat',dairy:'No dairy',eggs:'No eggs',oil:'No oil'};
    return '<div class="fasting-icons" aria-label="Fasting guidance">'+kinds.map(k=>'<span class="fasting-symbol" title="'+labels[k]+'"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+paths[k]+'<path d="M3 21L21 3" stroke-width="1.8"/></svg><span>'+labels[k]+'</span></span>').join('')+'</div>';
  }
  function romanSeasonBadges(r, iso) {
    const d = P(iso), E = L.westernEaster ? L.westernEaster(d.getUTCFullYear()) : null;
    const day = E ? Math.round((d-E)/864e5) : -1;
    const christmasOctave = (d.getUTCMonth() === 11 && d.getUTCDate() >= 25) || (d.getUTCMonth() === 0 && d.getUTCDate() === 1);
    let rank = r.rank || '';
    if (day >= 1 && day <= 6 && r.temporal) rank = 'Easter Octave · Solemnity';
    else if (day === 7 && r.temporal) rank = 'Easter Octave · Sunday';
    else if (christmasOctave && r.temporal && !/Solemnity|Feast/.test(rank)) rank = 'Christmas Octave';
    else if (rank === 'Weekday' && r.season === 'Ordinary Time' && r.color === 'g') rank = 'Ordinary';
    else if (rank === 'Weekday' && r.season === 'Advent') rank = 'Advent Weekday';
    else if (rank === 'Weekday' && r.season === 'Lent') rank = 'Lenten Weekday';
    else if (rank === 'Weekday' && r.season === 'Christmas Time') rank = 'Christmas Season';
    else if (rank === 'Weekday' && r.season === 'Easter Time') rank = 'Easter Season';
    return chip(rank, /Solemnity|Octave|Feast/.test(rank) ? 'major' : '') + (r.season && r.season !== rank ? chip(r.season) : '');
  }
  function cardRoman(v) {
    const r = v.roman;
    return `<section class="card"><div class="lab"><span class="sw" style="--c:${col(r.color)}"></span><span class="grow">Roman · modern</span>${speakBtn(spokenCard(r))}</div>
      <h2>${esc(r.title)}</h2><div class="chips">${romanSeasonBadges(r,v.iso)}${r.fast ? chip(r.fast, 'fast') : ''}</div>
      <p class="muted">Sunday cycle ${r.sundayCycle} · Weekday cycle ${r.weekdayCycle}</p>${fastingIcons(r,'roman')}${alsoHTML(r.also)}</section>`;
  }
  function byzSaintHTML(iso, r) {
    if (S.byzChurch !== 'ukrainian') return ''; // This supplemental dataset is Ukrainian, not a Ruthenian ordo.
    const B = LITDATA.byzSaints; if (!B) return '';
    const d = L.add(P(iso), S.byzOldCal ? -13 : 0), t = B[(d.getUTCMonth() + 1) + '/' + d.getUTCDate()];
    if (L.byzAnnaDay(S) === 8 && d.getUTCMonth() === 11 && d.getUTCDate() === 9) return ''; // Supplemental Ukrainian list uses December 9.
    if (!t) return '';
    const wk = x => new Set(x.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(w => w.length > 4 && !/^(saint|great|feast|which|their|those|father|mother|venerable|martyr|martyrs|after|sunday|monday|tuesday|wednesday|thursday|friday|saturday|week)$/.test(w)));
    const tw = wk(r.title), sw = wk(t);
    if ([...sw].filter(x => tw.has(x)).length >= 2) return '';
    return `<div style="margin:10px 0 4px;padding:8px 10px;border-left:3px solid var(--lit);background:var(--line);border-radius:6px"><div class="muted" style="font-size:.74rem;text-transform:uppercase;letter-spacing:.04em">Saints of the day</div><div style="font-family:var(--serif);font-size:1.02rem;margin-top:2px">${esc(t)}</div><div class="muted" style="font-size:.7rem;margin-top:3px">Ukrainian Catholic calendar (Archeparchy of Winnipeg)</div></div>`;
  }
  function cardByz(v) {
    const r = v.byz, u = v.ugcc;
    const words = t => new Set(t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 4));
    const known = [r.title, ...r.also.map(x => x.title)].map(words);
    const ev = S.byzChurch !== 'ukrainian' ? [] : u.day.filter(e => { if (L.byzAnnaDay(S) === 8 && v.iso.endsWith('-12-09') && /anna|anne|conception/i.test(e.n)) return false; const w = words(e.n); return !known.some(k => [...w].filter(x => k.has(x)).length >= Math.min(2, w.size)); });
    return `<section class="card"><div class="lab"><span class="sw" style="--c:${col(r.color)}"></span><span class="grow">Byzantine</span>${speakBtn(spokenCard(r))}</div>
      <h2>${esc(r.title)}</h2><div class="chips">${chipsFor(r)}${r.tone ? chip('Tone ' + r.tone) : ''}${chip(r.fastSeason)}${r.fast ? chip(r.fast, 'fast') : ''}</div><p class="muted">${esc(r.fastingNote)}</p>${fastingIcons(r,'byz')}
      ${byzSaintHTML(v.iso, r)}${alsoHTML(r.also)}${ev.length ? `<ul class="also">${ev.map(e => `<li>${esc(e.n)} <i>— your UGCC calendar</i></li>`).join('')}</ul>` : ''}
      <p class="muted">Pascha ${fmtLong(r.pascha)}</p></section>`;
  }
  const FMON = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  function felireHTML(iso, card) {
    const F = window.FELIRE; if (!F || !iso) return '';
    const [, m, d] = iso.split('-').map(Number), t = F[m + '-' + d];
    if (!t) return '';
    return `<div class="felire" style="${card ? '' : 'margin-top:12px;border-top:1px solid var(--line);padding-top:10px'}"><div class="lab"><span class="grow">Félire Óengusso · ${d} ${FMON[m - 1]}</span></div><p class="quote" style="font-style:italic;margin:6px 0 4px">${esc(t)}</p><p class="muted" style="font-size:.74rem;margin:0">Tr. Whitley Stokes (1905) · more under More → Félire Óengusso</p></div>`;
  }
  function cardSarum(v) {
    const r = v.sarum;
    return `<section class="card"><div class="lab"><span class="sw" style="--c:${col(r.color)}"></span><span class="grow">Traditional</span>${speakBtn(spokenCard(r, r.notes))}</div>
      <h2>${esc(r.title)}</h2><div class="chips">${chipsFor(r)}${r.fast ? chip(r.fast, 'fast') : ''}${chip(r.historicalObservance && r.historicalObservance.name)}</div>
      ${r.historicalObservance ? `<p>${esc(r.historicalObservance.day)}</p><p class="muted">${esc(r.historicalObservance.note)}</p>` : ''}
      ${fastingIcons(r,'sarum')}${r.notes ? `<p style="font-family:var(--serif);font-size:1rem;line-height:1.5">${esc(r.notes)}</p>` : ''}${r.srcText || r.srcNote || r.rankNote || r.colorNote ? `<details class="srcd"><summary>Sources</summary>${r.srcText ? `<p>${esc(r.srcText)}</p>` : ''}${[r.srcNote, r.rankNote, r.colorNote].filter(Boolean).map(t => `<p>${esc(t)}</p>`).join('')}</details>` : ''}${keptHTML(r.kept)}${alsoHTML(r.also)}</section>`;
  }
  function keptHTML(k) {
    if (!k || !k.length) return '';
    const TAG = { I: ['Ireland · documented', ''], E: ['Sarum / England · documented', ''], F: ['Later folklore', 'fast'], U: ['Uncertain', 'fast'], N: ['When it entered the calendar', ''], O: ['Older Gaelic custom · before Sarum', 'fast'] };
    return `<details class="kept-summary" style="margin-top:10px"><summary><b>How it was kept</b></summary>${k.map(e => { const full = String(e.text || '').trim(); const first = full.match(/^.*?[.!?](?=\\s|$)/)?.[0] || full; const brief = first.length > 190 ? first.slice(0,187).replace(/\\s+\\S*$/, '') + '…' : first; return `<div class="kept-entry">${chip(TAG[e.tag][0], TAG[e.tag][1])}<p>${esc(brief)}</p>${full !== brief || e.src.length ? `<details class="kept-source"><summary>Details &amp; sources</summary>${full !== brief ? `<p>${esc(full)}</p>` : ''}${e.src.length ? `<p class="muted">${esc(e.src.join(' · '))}</p>` : ''}</details>` : ''}</div>`; }).join('')}</details>`;
  }
  /* Sarum Mass propers (Warren's Sarum Missal in English). Scripture is hydrated live from the Douay text; prayers not yet transcribed are shown as summaries only. */
  /* ---------- Office of Readings (modern Liturgy of the Hours): the table of readings, with the Scripture in the Douay-Rheims ---------- */
  const NAMEW = n => String(n).replace(/^(Saint|Saints|Our|The|Blessed|Dedication of the|Conversion of|Chair of|Nativity of|Passion of)\s+/i, '').split(/[ ,]/).find(w => w.length > 3) || n;
  function oorSaint(iso, title) {
    const md = (+iso.slice(5, 7)) + '/' + (+iso.slice(8, 10)), A = (self.OOR_SAINTS || {})[md] || [];
    const hit = A.find(e => title.includes(NAMEW(e.n)));
    if (hit) return hit;
    for (const k in (self.OOR_SAINTS || {})) for (const e of self.OOR_SAINTS[k]) if (e.r && title.includes(NAMEW(e.n))) return e;
    return null;
  }
  function oorHTML(iso) {
    if (!self.OOR || !L.oorKey) return '';
    const d = P(iso), r = L.roman(d, S), k = L.oorKey(d, S), md = (+iso.slice(5, 7)) + '/' + (+iso.slice(8, 10));
    let sea = self.OOR[k] || null, sa = null, opt = null;
    if (k === 'saint') sa = ((self.OOR_SAINTS || {})[md] || [])[0] || null;
    else if (!r.temporal) sa = oorSaint(iso, r.title) || (((self.OOR_SAINTS || {})[md] || []).length === 1 ? self.OOR_SAINTS[md][0] : null);
    else opt = ((self.OOR_SAINTS || {})[md] || []).find(e => (r.also || []).some(a => /Optional/.test(a.note) && a.title.includes(NAMEW(e.n)))) || null;
    const big = sa && (k === 'saint' || /^(S|F|FL)$/.test(r.kind || ''));
    const first = big && sa.r ? sa : sea, second = sa || sea;
    const cite = (lab, val) => `<div style="margin:8px 0 2px"><div class="muted" style="font-size:.78rem;text-transform:uppercase;letter-spacing:.04em">${lab}</div><div>${val}</div></div>`;
    const textDetails = entry => entry && entry.a && entry.w ? `<details class="oortx" open style="margin:10px 0 16px"><summary class="muted" style="font-size:.88rem">Second reading text</summary><div class="oortx-slot" data-k="${esc(entry.a + '|' + entry.w)}"><p class="muted" style="font-size:.8rem">Loading…</p></div></details>` : '';
    let h = `<p class="muted" style="margin:.2em 0 .6em">${esc(r.title)}</p>`;
    if (first && first.r) {
      h += cite('First reading', `<a href="${bible(first.r)}" target="_blank" rel="noopener">${esc(first.r)}</a>`);
      h += `<details open style="margin:10px 0 16px"><summary class="muted" style="font-size:.88rem">First reading text</summary><div class="asv" data-tr="dra" data-ref="${esc(first.q)}" style="font-family:var(--serif);font-size:1.02rem;line-height:1.55"></div></details>`;
    }
    if (second && second.a) {
      h += cite('Second reading', `<span style="font-family:var(--serif);font-size:1.02rem">${esc(second.a)}</span> <span class="muted">· <i>${esc(second.w)}</i></span>`);
      h += textDetails(second);
    }
    if (opt) h += `<p class="muted" style="font-size:.78rem;margin:2px 0">If ${esc(opt.n)} is kept today, the second reading is from ${esc(opt.a)}, <i>${esc(opt.w)}</i>.</p>` + textDetails(opt);
    if (!(first && first.r) && !(second && second.a)) h += `<p class="muted">This day is not in the table of readings Ora uses${k === 'asc-thu' ? ' (Thursday of the 6th week of Easter, where the Ascension is kept on Sunday)' : ''}. Universalis has the full office.</p>`;
    else if (!(second && second.a)) h += `<p class="muted" style="font-size:.78rem">The second reading for this day is not in the table Ora uses; Universalis has it.</p>`;
    h += `<div class="row"><a class="btn sm fill" target="_blank" rel="noopener" href="https://universalis.com/${iso.replace(/-/g, '')}/readings.htm">Full office (Universalis)</a></div>`;
    h += `<p class="muted" style="font-size:.74rem">From the <i>Liturgy of the Hours</i> (index by Felix Just, S.J.). Scripture in the Douay-Rheims. Bundled second readings use public-domain translations; the complete official office is on Universalis.</p>`;
    return h;
  }
  function sarumMassHTML(v) {
    const m = v.sarum.mass;
    if (!m) return `<p style="margin-top:10px"><b>${esc(v.sarum.title)}</b></p><p class="muted">No traditional Mass is given for this day. Warren’s Sarum Missal has no Mass that matches this day’s feast, and no Irish proper has been found.</p>`;
    let h = `<h3 class="reading-main-title">${esc(m.title)}</h3>${m.note ? `<details class="srcd"><summary>About this text</summary><p>${esc(m.note)}</p></details>` : ''}`;
    for (const p of m.parts) {
      if (p.ref) h += `<div class="reading-heading"><div class="reading-label">${esc(p.k)}</div><div class="reading-reference">${esc(p.pr)}</div></div>${p.inc ? `<p class="muted"><i>${esc(p.inc)}</i></p>` : ''}<div class="asv" data-tr="dra" data-ref="${esc(p.ref)}"></div>`;
      else h += `<div class="reading-heading"><div class="reading-label">${esc(p.k)}</div></div><p style="white-space:pre-line;font-family:var(--serif);font-size:1.02rem;line-height:1.55">${esc(p.tx)}</p>`;
    }
    return h + `<p class="muted" style="font-size:.74rem">Source: ${esc(m.source)}. Epistle and Gospel in full: Douay-Rheims (public domain).</p>`;
  }

  /* ---------- at-a-glance: today ---------- */
  const FEASTRANK = /Solemnity|Feast|Holy Day|Great Feast|Triduum|Principal|Double/;
  function status(r, rite) {
    const rk = r.rank || '';
    const alsoFeast = (r.also || []).find(x => FEASTRANK.test(x.note || ''));
    const major = /Solemnity|Principal|Great Feast|Feast of the Lord|Holy Day/.test(rk);
    const feast = r.isFeast || (FEASTRANK.test(rk) && !/Holy Week/.test(rk)) || !!alsoFeast;
    let fast = r.fast || (r.ember ? 'Ember Day — fast and abstinence' : '');
    if (fast && major && /day of abstinence|traditional day|Friday of Lent|abstinence from meat$/.test(fast) && !/strict|Great Fast/.test(fast)) fast = '';  // ordinary weekly fast is lifted on a great feast
    const minor = /Memorial|Saint|Commemoration|Octave|lessons|Memory/.test(rk);
    const martin = rite === 'sarum' && r.historicalObservance && r.historicalObservance.name === "St. Martin's Lent";
    // A Byzantine fasting season is visible even on days without a specific abstinence rule.
    const seasonalFast = rite === 'byz' && !!r.fastSeason;
    const kind = feast && fast ? 'both' : feast ? 'feast' : fast ? 'fast' : seasonalFast ? 'season' : 'plain';
    const badge = kind === 'both' ? 'Feast + fast' : kind === 'feast' ? 'Feast day' : kind === 'fast' ? 'Fast day' : kind === 'season' ? 'Fasting season' : martin ? "St. Martin's Lent" : minor ? (/Octave/.test(rk) ? 'Octave' : /lessons/.test(rk) ? 'Feast day' : 'Memorial') : rk === 'Sunday' ? 'Sunday' : rite === 'byz' ? 'Weekday' : 'Ordinary day';
    const name = alsoFeast && !FEASTRANK.test(rk) ? alsoFeast.title : (feast || minor ? r.title : '');
    const observance = r.historicalObservance;
    const historical = rite === 'sarum' && observance && observance.name === "St. Martin's Lent";
    const shortName = historical ? name.replace(/\s*\/\s*Saint Martin's Lent/i, '') : name;
    const summary = historical ? [shortName, fast, observance.name].filter(Boolean) : [name, fast, r.fastSeason, observance && observance.name, observance && observance.day].filter(Boolean);
    return { kind, badge, detail: [...new Set(summary)].join(' · ') };
  }
  function observanceColor(r, rite) {
    const x = status(r, rite);
    const martyr = /martyr|hieromartyr|protomartyr|passion of (?:the lord|christ)|good friday/i.test(r.title || '');
    return martyr ? 'r' : x.kind === 'fast' || x.kind === 'both' || x.kind === 'season' ? 'v' : x.kind === 'feast' ? 'gold' : x.badge === 'Ordinary day' || x.badge === 'Weekday' || x.badge === 'Sunday' ? 'g' : 'w';
  }
  function glanceSeason(r, rite, iso) {
    if (rite === 'byz') return [r.title, r.fastSeason, r.fast].filter(Boolean).join(' · ');
    if (rite === 'sarum') return [r.title, r.historicalObservance?.name, r.historicalObservance?.day, r.fast].filter(Boolean).join(' · ');
    // Memorials and feasts can hide the underlying Ordinary Time week.
    // Find the nearest ordinary weekday in the same calendar week.
    if (r.season === 'Ordinary Time' && !/Ordinary Time/i.test(r.title)) {
      const d = P(iso), wd = d.getUTCDay();
      for (let offset = -((wd + 6) % 7); offset <= 6 - ((wd + 6) % 7); offset++) {
        const candidate = L.roman(L.add(d, offset), S);
        const match = candidate.title.match(/(?:of the |the )(\d+(?:st|nd|rd|th)) Week in Ordinary Time/i);
        if (match) return match[1] + ' Week in Ordinary Time';
      }
    }
    return r.title;
  }
  function glanceHTML(v) {
    const rows = [['Roman', v.roman, 'roman'], ['Byzantine', v.byz, 'byz'], ['Traditional', v.sarum, 'sarum']];
    return `<section class="card glance"><div class="lab liturgical-day-heading">${todayAccent("calendar")}<span class="grow">The Liturgical Day</span></div>` + rows.map(([n, r, k]) => {
      const x = status(r, k);
      const seasonLine = glanceSeason(r, k, v.iso);
      const cycles = '';
      const lit = observanceColor(r, k);
      const ink = ['w', 'gold', 'y', 'rose'].includes(lit) ? '#201700' : '#fff';
      return `<div class="gl ${x.kind}${S.rite === k ? ' selected' : ''}" role="button" tabindex="0" data-act="rite" data-v="${k}" aria-pressed="${S.rite === k}" aria-label="Use ${n} for prayers and readings"><span class="gn">${n}</span><span class="gb" style="--badge-color:${col(lit)};background:${col(lit)};color:${ink}">${esc(x.badge)}</span>${seasonLine || x.detail || cycles ? `<div class="gd">${esc(x.detail)}<div class="muted" style="margin-top:5px">${esc(seasonLine)}</div>${cycles}</div>` : ''}</div>`;
    }).join('') + '</section>';
  }

  /* ---------- tabs ---------- */
  const POPE = { '2026-01': ['For prayer with the word of God', 'Scripture as nourishment and hope, helping to build a more fraternal, missionary Church.'], '2026-02': ['For children with incurable diseases', 'Medical care and support for sick children and their families.'], '2026-03': ['For disarmament and peace', 'Progress on disarmament, especially nuclear, and dialogue in place of violence.'], '2026-04': ['For priests in crisis', 'That priests facing a crisis of vocation are accompanied and understood by their communities.'], '2026-05': ['That everyone might have food', 'Less food waste and fair access to good food for all.'], '2026-06': ['For the values of sports', 'Sport as a way to peace, encounter and dialogue, building respect and solidarity.'], '2026-07': ['For respect for human life', 'Protecting human life at every stage as a gift from God.'], '2026-08': ['For evangelization in the city', 'New ways to proclaim the Gospel and build community in large, lonely cities.'], '2026-09': ['For the care of water', 'Just, sustainable management of water so that everyone has equal access.'], '2026-10': ['For mental health ministry', 'Mental health ministry across the Church, countering stigma and discrimination.'], '2026-11': ['For the proper use of wealth', 'That wealth be used for the common good and for those with less, and never selfishly.'], '2026-12': ['For single-parent families', 'Support in the Church, and strength in faith, for families missing a mother or father.'] };
  /* weekly Angelus prayer requests: angelus.json, written by fetch_angelus.py in the daily GitHub Action */
  let angelus = store.get('ora.angelus', null);
  fetch('angelus.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(j => { if (j && j.date) { const ch = !angelus || angelus.date !== j.date; angelus = j; store.set('ora.angelus', j); if (ch && st.tab === 'today') render(); } }).catch(() => {});
  function popeCard(iso) {
    const p = POPE[iso.slice(0, 7)], mo = L.MN[+iso.slice(5, 7) - 1], Q = C.POPEQ || [];
    const n = Math.round(P(iso).getTime() / 864e5), q = Q.length ? Q[(((n + st.popeShift) % Q.length) + Q.length) % Q.length] : null;
    let h = `<section class="card pope-card"><div class="lab"><svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true" style="flex:none;display:block;margin:0"><g fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><g stroke="#a9aeb6" transform='matrix(-1 0 0 1 32 0)'><path d="M9.6 22.4 25.5 6.5"/><circle cx="7.2" cy="24.8" r="3.3"/><circle cx="7.2" cy="24.8" r=".9" fill="#a9aeb6" stroke="none"/><path d="M22.3 9.7l3 3 1.6-1.6-1.4-1.4 1.2-1.2-1.6-1.6" /><path d="M10.6 21.4l1.4 1.4M12 20l1 1"/></g><g stroke="#c9a227"><path d="M9.6 22.4 25.5 6.5"/><circle cx="7.2" cy="24.8" r="3.3"/><circle cx="7.2" cy="24.8" r=".9" fill="#c9a227" stroke="none"/><path d="M22.3 9.7l3 3 1.6-1.6-1.4-1.4 1.2-1.2-1.6-1.6" /><path d="M10.6 21.4l1.4 1.4M12 20l1 1"/></g></g></svg><span class="grow">From the Holy Father</span></div>`;
    if (q) h += `<div class="pope-reflection-heading">Papal reflection</div><div class="quote">“${esc(q.t)}”<small>${esc(q.s)} · <a target="_blank" rel="noopener" href="${esc(q.u)}">${esc(q.w)}</a></small></div><div class="row">${speakBtn(`${q.t} — ${q.s}, ${q.w}`)}<button class="btn sm" data-act="pnext">Another</button></div>`;
    h += `<div class="pope-subsection"><div class="pope-subheading">Monthly prayer intention <span class="muted">· ${esc(mo)}</span></div>${p ? `<p class="pope-intention-title">${esc(p[0])}</p><p class="muted pope-intention-text">${esc(p[1])}</p>` : '<p class="muted">This month’s intention is available from the official source.</p>'}<a class="pope-source-link" target="_blank" rel="noopener" href="https://www.popesprayer.va/praywiththepope/">Pray with the Pope</a></div>`;
    const ag = angelus, agAge = ag && ag.date ? (P(iso) - P(ag.date)) / 864e5 : 99;
    if (ag && Array.isArray(ag.pray) && ag.pray.length && agAge >= 0 && agAge < 14) {
      h += `<div class="pope-subsection"><div class="pope-subheading">Weekly Angelus prayers <span class="muted">· ${esc(fmtShort(ag.date))}</span></div><p class="pope-angelus-preview">${esc(ag.pray[0])}</p><details class="pope-angelus-details"><summary>Read all ${ag.pray.length} prayer requests</summary><ul>${ag.pray.map(t => `<li>${esc(t)}</li>`).join('')}</ul></details>${ag.url ? `<a class="pope-source-link" target="_blank" rel="noopener" href="${esc(ag.url)}">Read the full Angelus on vatican.va</a>` : ''}</div>`;
    }
    h += '</section>';
    return h;
  }
  const HIST = [
[1, 1, 1968, "Pope Paul VI keeps the first World Day of Peace. St Basil the Great also dies on this date in 379."],
[1, 2, 1873, "St Thérèse of Lisieux is born at Alençon."],
[1, 3, 512, "St Genevieve, patroness of Paris, dies (traditional date)."],
[1, 4, 1821, "St Elizabeth Ann Seton, foundress of the Sisters of Charity in the United States, dies."],
[1, 5, 1860, "St John Neumann, bishop of Philadelphia, dies."],
[1, 6, 1937, "St André Bessette, the porter of Montreal's Oratory of St Joseph, dies."],
[1, 7, 1536, "Catherine of Aragon, who refused to accept the annulment of her marriage, dies at Kimbolton."],
[1, 8, 1198, "Lotario de' Segni is elected pope and takes the name Innocent III."],
[1, 9, 1431, "The trial of Joan of Arc opens at Rouen."],
[1, 10, 236, "Fabian is elected Bishop of Rome."],
[1, 11, 529, "St Theodosius the Cenobiarch, father of the monks of Palestine, dies (traditional date)."],
[1, 12, 690, "St Benedict Biscop, founder of Wearmouth and Jarrow, dies (about this year)."],
[1, 13, 367, "St Hilary of Poitiers, defender of the Nicene faith, dies (traditional date)."],
[1, 14, 1752, "St Devasahayam Pillai, a convert from Hinduism, is martyred in Travancore."],
[1, 15, 570, "St Ita of Killeedy, 'foster-mother of the saints of Ireland', dies (traditional date)."],
[1, 16, 1220, "St Berard and his companions, the first Franciscan martyrs, are killed in Morocco."],
[1, 17, 356, "St Antony the Great, father of monks, dies in the Egyptian desert (traditional date)."],
[1, 18, 1562, "The Council of Trent reassembles for its third and final period."],
[1, 19, 1095, "St Wulfstan, bishop of Worcester, dies (on the 19th or 20th; his feast is kept today)."],
[1, 20, 250, "Pope St Fabian is martyred in the Decian persecution."],
[1, 21, 304, "St Agnes is martyred in Rome (traditional date)."],
[1, 22, 1922, "Pope Benedict XV dies."],
[1, 23, 667, "St Ildephonsus, archbishop of Toledo, dies (traditional date)."],
[1, 24, 2002, "John Paul II gathers religious leaders at Assisi for a Day of Prayer for Peace in the World."],
[1, 25, 1959, "John XXIII announces the Second Vatican Council at St Paul Outside the Walls."],
[1, 26, 1564, "Pius IV confirms the decrees of the Council of Trent in the bull Benedictus Deus."],
[1, 27, 1540, "St Angela Merici, foundress of the Ursulines, dies at Brescia."],
[1, 28, 814, "Charlemagne, crowned emperor by Leo III in 800, dies."],
[1, 30, 1923, "Blessed Columba Marmion, the Dublin-born abbot of Maredsous, dies."],
[1, 31, 1888, "St John Bosco, apostle of young people, dies in Turin."],
[2, 1, 525, "St Brigid of Kildare dies, traditionally about this year."],
[2, 2, 1594, "Giovanni Pierluigi da Palestrina, master of Catholic church music, dies in Rome."],
[2, 3, 316, "St Blaise, bishop of Sebaste, is martyred (traditional date)."],
[2, 4, 1693, "St John de Britto, Jesuit missionary, is martyred in southern India."],
[2, 5, 1597, "Twenty-six Christians, including St Paul Miki, are crucified at Nagasaki."],
[2, 6, 1922, "Achille Ratti is elected pope as Pius XI."],
[2, 7, 1878, "Pope Pius IX dies after the longest reign of any pope since St Peter."],
[2, 8, 1587, "Mary, Queen of Scots, is executed at Fotheringhay."],
[2, 9, 249, "St Apollonia is martyred at Alexandria (traditional date)."],
[2, 10, 543, "St Scholastica, sister of St Benedict, dies (traditional date)."],
[2, 11, 1858, "Our Lady first appears to St Bernadette at Lourdes. In 1929 the Lateran Treaty is also signed on this date."],
[2, 14, 869, "St Cyril, apostle of the Slavs, dies in Rome."],
[2, 15, 1145, "Eugene III, a Cistercian and disciple of St Bernard, is elected pope."],
[2, 17, 1600, "Giordano Bruno, a Dominican friar condemned for heresy, is burned in the Campo de' Fiori in Rome."],
[2, 18, 1455, "Fra Angelico, Dominican friar and painter, dies in Rome."],
[2, 19, 1933, "Blessed John Sullivan, Jesuit of Clongowes, dies in Dublin."],
[2, 20, 1878, "Gioacchino Pecci is elected pope as Leo XIII."],
[2, 21, 1595, "St Robert Southwell, Jesuit priest and poet, is executed at Tyburn."],
[2, 22, 1072, "St Peter Damian, reformer and Doctor of the Church, dies at Faenza."],
[2, 23, 155, "St Polycarp, bishop of Smyrna and disciple of St John, is martyred (traditional date; some scholars say 156)."],
[2, 24, 1582, "Gregory XIII reforms the calendar in the bull Inter gravissimas."],
[2, 25, 1570, "Pius V issues Regnans in Excelsis, excommunicating Elizabeth I."],
[2, 27, 1862, "St Gabriel of Our Lady of Sorrows, Passionist, dies."],
[2, 28, 2013, "The resignation of Pope Benedict XVI takes effect."],
[3, 1, 589, "St David of Wales dies (traditional date)."],
[3, 2, 1939, "Eugenio Pacelli is elected pope as Pius XII. St Nicholas Owen, builder of priest-holes, also dies under torture in the Tower of London on this date in 1606."],
[3, 3, 1955, "St Katharine Drexel, foundress of the Sisters of the Blessed Sacrament, dies."],
[3, 4, 1484, "St Casimir, prince of Poland, dies."],
[3, 5, 1616, "The Congregation of the Index suspends Copernicus's De revolutionibus 'until corrected'."],
[3, 6, 1447, "Nicholas V, founder of the Vatican Library, is elected pope."],
[3, 7, 1274, "St Thomas Aquinas dies at Fossanova on his way to the Council of Lyons."],
[3, 8, 1550, "St John of God, founder of the Brothers Hospitallers, dies in Granada."],
[3, 9, 1440, "St Frances of Rome, foundress of the Oblates of Tor de' Specchi, dies."],
[3, 10, 1615, "St John Ogilvie, Jesuit, is hanged at Glasgow."],
[3, 11, 1653, "Blessed John Kearney, Franciscan, is hanged at Clonmel."],
[3, 12, 604, "Pope St Gregory the Great dies."],
[3, 13, 2013, "Jorge Bergoglio is elected pope and takes the name Francis."],
[3, 14, 1800, "Pius VII is elected pope at Venice. Pius XI's encyclical against Nazism, Mit brennender Sorge, also bears this date in 1937."],
[3, 15, 1660, "St Louise de Marillac, co-foundress of the Daughters of Charity, dies in Paris."],
[3, 16, 1649, "St Jean de Brébeuf is martyred in Huronia."],
[3, 17, 461, "St Patrick dies, according to one traditional dating (others say 493)."],
[3, 18, 386, "St Cyril of Jerusalem, bishop and Doctor of the Church, dies."],
[3, 19, 1937, "Pius XI issues Divini Redemptoris against atheistic communism. Pope Francis's exhortation Amoris laetitia also bears this date in 2016."],
[3, 20, 687, "St Cuthbert dies on Inner Farne."],
[3, 21, 547, "St Benedict dies at Monte Cassino (traditional date)."],
[3, 22, 1312, "Clement V suppresses the Knights Templar at the Council of Vienne."],
[3, 23, 1606, "St Turibius of Mogrovejo, archbishop of Lima, dies."],
[3, 24, 1980, "Archbishop Óscar Romero is shot while celebrating Mass in San Salvador."],
[3, 25, 1586, "St Margaret Clitherow is pressed to death at York for harbouring priests."],
[3, 26, 1967, "Paul VI issues the encyclical Populorum progressio."],
[3, 28, 1515, "St Teresa of Ávila is born."],
[3, 29, 1882, "The Knights of Columbus, founded by Blessed Michael McGivney, are incorporated in Connecticut."],
[3, 31, 1146, "St Bernard of Clairvaux preaches the Second Crusade at Vézelay."],
[4, 1, 1132, "St Hugh, bishop of Grenoble and friend of St Bruno, dies."],
[4, 2, 2005, "Pope St John Paul II dies."],
[4, 3, 1253, "St Richard, bishop of Chichester, dies."],
[4, 4, 397, "St Ambrose, bishop of Milan, dies."],
[4, 5, 1419, "St Vincent Ferrer, Dominican preacher, dies at Vannes."],
[4, 6, 885, "St Methodius, apostle of the Slavs with his brother Cyril, dies."],
[4, 7, 1719, "St John Baptist de la Salle, founder of the Christian Brothers, dies."],
[4, 8, 1546, "The Council of Trent issues its decree on Scripture and Tradition."],
[4, 9, 1555, "Marcellus II is elected pope; Palestrina's Missa Papae Marcelli bears his name."],
[4, 10, 1838, "Fr Theobald Mathew founds his Total Abstinence Society in Cork."],
[4, 11, 1963, "John XXIII issues the encyclical Pacem in Terris."],
[4, 12, 1204, "Crusaders of the Fourth Crusade sack Constantinople, deepening the breach between the Churches of East and West."],
[4, 13, 1829, "The Catholic Emancipation Act receives royal assent."],
[4, 15, 1889, "St Damien of Molokai dies among the lepers of Hawaii."],
[4, 16, 1879, "St Bernadette Soubirous dies at Nevers."],
[4, 17, 1680, "St Kateri Tekakwitha dies at Kahnawake."],
[4, 18, 1506, "Julius II lays the foundation stone of the new St Peter's."],
[4, 19, 2005, "Cardinal Joseph Ratzinger is elected pope as Benedict XVI."],
[4, 20, 1314, "Pope Clement V dies."],
[4, 21, 1109, "St Anselm, archbishop of Canterbury, dies. Pope Francis dies on this date in 2025."],
[4, 22, 1418, "The Council of Constance, which ended the Great Western Schism, closes."],
[4, 23, 997, "St Adalbert, bishop of Prague, is martyred in Prussia."],
[4, 24, 1622, "St Fidelis of Sigmaringen is killed while preaching in Switzerland. On this date in 1646 the Union of Uzhhorod brings Ruthenian clergy into communion with Rome."],
[4, 25, 387, "St Augustine is baptized by St Ambrose at Milan, at the Easter Vigil of 24–25 April."],
[4, 26, 1784, "Venerable Nano Nagle, foundress of the Presentation Sisters, dies in Cork."],
[4, 27, 2014, "Popes John XXIII and John Paul II are canonized together in St Peter's Square."],
[4, 28, 1841, "St Peter Chanel is martyred on the island of Futuna."],
[4, 29, 1380, "St Catherine of Siena dies in Rome."],
[4, 30, 2000, "John Paul II canonizes St Faustina Kowalska. St Marie of the Incarnation, Ursuline of Quebec, also dies on this date in 1672."],
[5, 1, 1572, "Pope St Pius V dies."],
[5, 2, 373, "St Athanasius, bishop of Alexandria, dies."],
[5, 3, 1512, "The Fifth Lateran Council opens."],
[5, 4, 1535, "The Carthusian martyrs of the London Charterhouse are executed at Tyburn."],
[5, 5, 553, "The Second Council of Constantinople opens."],
[5, 6, 1527, "Imperial troops sack Rome; the Swiss Guard dies defending Clement VII."],
[5, 7, 1274, "The Second Council of Lyons opens."],
[5, 8, 1429, "Joan of Arc lifts the siege of Orléans. In 2025 Robert Prevost is elected pope on this date and takes the name Leo XIV."],
[5, 9, 348, "St Pachomius, father of communal monasticism, dies (traditional date)."],
[5, 10, 1569, "St John of Ávila, 'apostle of Andalusia', dies."],
[5, 11, 1610, "Matteo Ricci, Jesuit missionary to China, dies in Beijing."],
[5, 12, 1944, "Venerable Edel Quinn, Legion of Mary envoy to Africa, dies in Nairobi."],
[5, 13, 1917, "Our Lady first appears to the children at Fátima. In 1981 John Paul II is shot in St Peter's Square on the same date."],
[5, 14, 1856, "St Théodore Guérin, foundress of the Sisters of Providence of Saint Mary-of-the-Woods, dies."],
[5, 15, 1891, "Leo XIII issues Rerum Novarum, the first great modern social encyclical."],
[5, 16, 577, "St Brendan the Navigator dies, traditionally in this year."],
[5, 18, 1920, "Karol Wojtyła, the future Pope John Paul II, is born at Wadowice."],
[5, 19, 1296, "Pope St Celestine V dies, two years after resigning the papacy."],
[5, 20, 325, "The Council of Nicaea opens (traditional date). St Bernardine of Siena also dies on this date in 1444."],
[5, 21, 2000, "John Paul II canonizes St Cristóbal Magallanes and his companions, martyrs of the Mexican persecution."],
[5, 22, 337, "Constantine the Great dies after being baptized."],
[5, 23, 1498, "Girolamo Savonarola, Dominican preacher, is executed in Florence."],
[5, 24, 1814, "Pius VII returns to Rome after his captivity under Napoleon; the feast of Mary Help of Christians is later fixed on this day. Pope Francis's encyclical Laudato si' also bears this date in 2015."],
[5, 25, 735, "The Venerable Bede dies at Jarrow (usually dated 25 or 26 May)."],
[5, 26, 1595, "St Philip Neri dies in Rome."],
[5, 27, 604, "St Augustine of Canterbury dies (about this date)."],
[5, 29, 1453, "Constantinople falls to the Ottoman Turks."],
[5, 30, 1431, "Joan of Arc is burned at the stake in Rouen."],
[5, 31, 1653, "Innocent X condemns five propositions of Jansenism in Cum occasione. Pius XI is also born on this date in 1857."],
[6, 1, 165, "St Justin Martyr is put to death in Rome (about this year)."],
[6, 2, 1537, "Paul III's bull Sublimis Deus declares that the peoples of the Americas may not be deprived of liberty or property. John Paul II also begins his first pilgrimage to Poland on this date in 1979."],
[6, 3, 1886, "The Uganda Martyrs are burned at Namugongo. Pope St John XXIII also dies on this date in 1963."],
[6, 5, 754, "St Boniface, apostle of Germany, is martyred in Frisia."],
[6, 6, 1134, "St Norbert, founder of the Premonstratensians, dies at Magdeburg."],
[6, 7, 1925, "Venerable Matt Talbot dies on a Dublin street on his way to Mass."],
[6, 8, 1889, "Gerard Manley Hopkins, Jesuit poet, dies in Dublin. Pius IX also canonizes the martyrs of Japan on this date in 1862."],
[6, 9, 597, "St Columba dies at Iona. St Ephrem the Syrian also dies on this date, traditionally in 373."],
[6, 11, 1915, "Blessed Ignatius Maloyan, Armenian Catholic archbishop of Mardin, is martyred."],
[6, 13, 1231, "St Anthony of Padua dies near Padua."],
[6, 14, 1936, "G. K. Chesterton dies at Beaconsfield."],
[6, 15, 1520, "Leo X issues the bull Exsurge Domine against Luther's teachings."],
[6, 16, 1846, "Giovanni Mastai-Ferretti is elected pope as Pius IX. John Paul II also canonizes St Pio of Pietrelcina on this date in 2002."],
[6, 19, 1027, "St Romuald, founder of the Camaldolese, dies."],
[6, 20, 1584, "Dermot O'Hurley, archbishop of Cashel, is hanged at Hoggen Green in Dublin."],
[6, 21, 1591, "St Aloysius Gonzaga dies in Rome. Giovanni Battista Montini is elected pope as Paul VI on this date in 1963."],
[6, 22, 1535, "St John Fisher, bishop of Rochester, is beheaded."],
[6, 23, 1608, "St Thomas Garnet, Jesuit, is executed at Tyburn."],
[6, 26, 1932, "The Statio Mass of the Eucharistic Congress is celebrated in Phoenix Park, Dublin. St Josemaría Escrivá also dies in Rome on this date in 1975."],
[6, 27, 444, "St Cyril of Alexandria, defender of the title Theotokos, dies."],
[6, 28, 1654, "St John Southworth is executed at Tyburn."],
[6, 29, 67, "Tradition says SS Peter and Paul are martyred in Rome in the reign of Nero."],
[6, 30, 1853, "Venerable Pierre Toussaint, born into slavery in Haiti, dies in New York."],
[7, 1, 1681, "St Oliver Plunkett, archbishop of Armagh, is hanged, drawn and quartered at Tyburn."],
[7, 2, 1988, "John Paul II issues the motu proprio Ecclesia Dei."],
[7, 3, 1907, "The Holy Office issues the decree Lamentabili against Modernism."],
[7, 4, 1925, "St Pier Giorgio Frassati dies in Turin. William Byrd, Catholic composer, also dies on this date in 1623."],
[7, 5, 1539, "St Anthony Zaccaria, founder of the Barnabites, dies."],
[7, 6, 1535, "St Thomas More is beheaded on Tower Hill."],
[7, 7, 2007, "Benedict XVI issues the motu proprio Summorum Pontificum."],
[7, 8, 689, "St Kilian, the Irish apostle of Franconia, is martyred at Würzburg (traditional date)."],
[7, 9, 1572, "The Martyrs of Gorkum are hanged at Brielle."],
[7, 12, 1598, "St John Jones, Franciscan, is executed at Southwark. Henry II also does penance at Becket's tomb on this date in 1174."],
[7, 13, 1024, "Emperor St Henry II dies."],
[7, 14, 1614, "St Camillus de Lellis, founder of the Ministers of the Sick, dies. Pius V's bull Quo primum, promulgating the Roman Missal, also bears this date in 1570."],
[7, 15, 1274, "St Bonaventure dies during the Council of Lyons."],
[7, 16, 1054, "Cardinal Humbert lays the bull of excommunication on the altar of Hagia Sophia, the traditional date of the East–West Schism."],
[7, 17, 1794, "The sixteen Carmelite martyrs of Compiègne are guillotined in Paris."],
[7, 18, 1870, "The First Vatican Council defines papal infallibility in Pastor aeternus."],
[7, 19, 1679, "St John Plessington is executed at Chester."],
[7, 20, 1903, "Pope Leo XIII dies."],
[7, 21, 1773, "Clement XIV suppresses the Society of Jesus in the brief Dominus ac Redemptor."],
[7, 22, 1858, "Venerable Mary Aikenhead, foundress of the Irish Sisters of Charity, dies in Dublin. Sts John Lloyd and Philip Evans are also executed at Cardiff on this date in 1679."],
[7, 23, 1373, "St Bridget of Sweden dies in Rome."],
[7, 24, 1594, "St John Boste is executed at Durham."],
[7, 25, 1968, "Paul VI issues the encyclical Humanae Vitae."],
[7, 26, 1942, "St Titus Brandsma, Carmelite, dies at Dachau."],
[7, 28, 1946, "St Alphonsa, the first canonized saint of the Syro-Malabar Church, dies."],
[7, 29, 1030, "St Olaf, king of Norway, falls at the Battle of Stiklestad."],
[7, 30, 450, "St Peter Chrysologus, bishop of Ravenna, dies (about this year)."],
[7, 31, 1556, "St Ignatius of Loyola dies in Rome."],
[8, 1, 1787, "St Alphonsus Liguori, founder of the Redemptorists, dies."],
[8, 3, 1941, "Blessed Clemens von Galen preaches against the Nazi killing of the sick and disabled."],
[8, 4, 1859, "St John Vianney, the Curé of Ars, dies."],
[8, 5, 358, "The legendary August snowfall on the Esquiline, remembered as the origin of St Mary Major (traditional date)."],
[8, 6, 1978, "Pope Paul VI dies at Castel Gandolfo."],
[8, 7, 1814, "Pius VII restores the Society of Jesus."],
[8, 8, 1570, "Blessed John Felton is executed for posting Regnans in excelsis. St Mary MacKillop also dies in Sydney on this date in 1909."],
[8, 9, 1942, "St Teresa Benedicta of the Cross (Edith Stein) is killed at Auschwitz."],
[8, 10, 258, "St Laurence, deacon of Rome, is martyred."],
[8, 11, 1253, "St Clare of Assisi dies."],
[8, 12, 1950, "Pius XII issues the encyclical Humani generis."],
[8, 13, 662, "St Maximus the Confessor dies in exile in Georgia."],
[8, 14, 1941, "St Maximilian Kolbe gives his life at Auschwitz."],
[8, 15, 1534, "Ignatius of Loyola and his companions take vows at Montmartre."],
[8, 17, 1740, "Prospero Lambertini is elected pope as Benedict XIV."],
[8, 19, 1680, "St John Eudes dies at Caen."],
[8, 20, 1153, "St Bernard of Clairvaux dies. Pius X also dies on this date in 1914."],
[8, 21, 1879, "Our Lady, St Joseph and St John are seen at the gable of the church at Knock, Co. Mayo."],
[8, 22, 1679, "St John Wall is executed at Worcester and St John Kemble at Hereford."],
[8, 23, 1617, "St Rose of Lima dies."],
[8, 24, 410, "Alaric's Goths sack Rome."],
[8, 25, 1270, "St Louis IX, king of France, dies near Tunis."],
[8, 26, 1978, "Albino Luciani is elected pope as John Paul I."],
[8, 27, 387, "St Monica dies at Ostia (about this year)."],
[8, 28, 430, "St Augustine, bishop of Hippo, dies during the Vandal siege."],
[8, 29, 1799, "Pius VI dies a prisoner of the French at Valence. Blessed Edmund Rice, founder of the Christian Brothers, also dies in Waterford on this date in 1844."],
[8, 30, 1588, "St Margaret Ward is executed at Tyburn for helping a priest escape."],
[8, 31, 651, "St Aidan, apostle of Northumbria, dies."],
[9, 1, 1159, "Adrian IV, the only English pope, dies at Anagni."],
[9, 2, 1792, "The September Massacres begin in Paris; many priests later beatified as martyrs are killed at the Carmes."],
[9, 3, 590, "Gregory the Great is consecrated Bishop of Rome."],
[9, 4, 2016, "Pope Francis canonizes St Teresa of Calcutta."],
[9, 5, 1997, "St Teresa of Calcutta dies."],
[9, 7, 1921, "Frank Duff founds the Legion of Mary in Dublin. Sts Carlo Acutis and Pier Giorgio Frassati are also canonized on this date in 2025."],
[9, 8, 1654, "St Peter Claver dies at Cartagena. The first parish Mass at St Augustine, Florida, is also celebrated on this date in 1565."],
[9, 9, 549, "St Ciarán of Clonmacnoise dies, traditionally in this year."],
[9, 10, 1641, "St Ambrose Barlow is executed at Lancaster."],
[9, 11, 910, "William of Aquitaine founds the abbey of Cluny (traditional date)."],
[9, 12, 1683, "The Battle of Vienna ends the Ottoman siege."],
[9, 13, 1896, "Leo XIII issues Apostolicae curae on Anglican orders."],
[9, 14, 407, "St John Chrysostom dies in exile. The Church of the Holy Sepulchre was also dedicated about 335."],
[9, 15, 1510, "St Catherine of Genoa dies."],
[9, 16, 655, "Pope St Martin I dies in exile in the Crimea."],
[9, 17, 1179, "St Hildegard of Bingen dies."],
[9, 18, 1663, "St Joseph of Cupertino dies at Osimo."],
[9, 19, 1846, "Our Lady appears to two children at La Salette."],
[9, 20, 1870, "Italian troops enter Rome at the Porta Pia, ending the Papal States."],
[9, 22, 1839, "St Paul Chong Hasang is martyred in Seoul."],
[9, 23, 1968, "St Pio of Pietrelcina dies at San Giovanni Rotondo."],
[9, 24, 787, "The Second Council of Nicaea opens."],
[9, 26, 1897, "Giovanni Battista Montini, the future Paul VI, is born."],
[9, 27, 1660, "St Vincent de Paul dies in Paris."],
[9, 28, 1978, "Pope John Paul I dies after thirty-three days as pope."],
[9, 29, 1850, "Pius IX restores the Catholic hierarchy of England and Wales. John Paul II also arrives in Ireland on this date in 1979."],
[9, 30, 420, "St Jerome dies at Bethlehem. St Thérèse of Lisieux also dies on this date in 1897."],
[10, 1, 2000, "John Paul II canonizes 120 martyrs of China."],
[10, 2, 1928, "St Josemaría Escrivá founds Opus Dei."],
[10, 3, 1226, "St Francis of Assisi dies at the Portiuncula."],
[10, 4, 1582, "St Teresa of Ávila dies at Alba de Tormes, on the night the Gregorian calendar begins."],
[10, 5, 1938, "St Faustina Kowalska dies in Kraków."],
[10, 6, 1101, "St Bruno, founder of the Carthusians, dies in Calabria."],
[10, 7, 1571, "The Christian fleet wins the Battle of Lepanto."],
[10, 8, 451, "The Council of Chalcedon opens."],
[10, 9, 1958, "Pope Pius XII dies at Castel Gandolfo."],
[10, 10, 1982, "John Paul II canonizes St Maximilian Kolbe."],
[10, 11, 1962, "The Second Vatican Council opens."],
[10, 12, 1975, "Paul VI canonizes St Oliver Plunkett."],
[10, 13, 1307, "Philip IV of France has the Knights Templar arrested."],
[10, 14, 2018, "Pope Francis canonizes Paul VI and Óscar Romero."],
[10, 15, 1582, "St Teresa of Ávila dies; in many countries this date follows 4 October when the Gregorian calendar begins."],
[10, 16, 1978, "Karol Wojtyła is elected pope as John Paul II."],
[10, 17, 107, "St Ignatius of Antioch is martyred in Rome (traditional date, about this year)."],
[10, 18, 1646, "St Isaac Jogues is killed at Ossernenon."],
[10, 19, 1595, "St Philip Howard dies in the Tower of London. Blessed Jerzy Popiełuszko is also murdered on this date in 1984, and Thérèse of Lisieux is declared a Doctor of the Church on this date in 1997."],
[10, 21, 2012, "Benedict XVI canonizes St Kateri Tekakwitha."],
[10, 22, 1978, "John Paul II's pontificate is inaugurated: 'Be not afraid!'"],
[10, 23, 1456, "St John of Capistrano dies, weeks after the relief of Belgrade."],
[10, 24, 2024, "Pope Francis issues Dilexit nos on the Sacred Heart."],
[10, 25, 1970, "Paul VI canonizes the Forty Martyrs of England and Wales."],
[10, 27, 1986, "John Paul II hosts the World Day of Prayer for Peace at Assisi."],
[10, 28, 312, "Constantine wins the Battle of the Milvian Bridge."],
[10, 30, 1651, "Blessed Terence Albert O'Brien, bishop of Emly, is hanged at Limerick."],
[10, 31, 1999, "The Catholic Church and the Lutheran World Federation sign the Joint Declaration on Justification. John Paul II also addresses the Galileo case on this date in 1992."],
[11, 1, 1950, "Pius XII defines the dogma of the Assumption in Munificentissimus Deus."],
[11, 2, 1148, "St Malachy of Armagh dies at Clairvaux in the arms of St Bernard."],
[11, 3, 1639, "St Martin de Porres dies in Lima."],
[11, 4, 1584, "St Charles Borromeo, archbishop of Milan, dies."],
[11, 5, 1943, "Blessed Bernhard Lichtenberg, provost of Berlin, dies on his way to Dachau."],
[11, 6, 1789, "Pius VI names John Carroll the first bishop of Baltimore."],
[11, 7, 739, "St Willibrord, apostle of the Frisians, dies at Echternach."],
[11, 8, 1308, "Blessed John Duns Scotus dies at Cologne."],
[11, 9, 324, "The Lateran Basilica, mother church of Rome, is dedicated (traditional date)."],
[11, 10, 461, "Pope St Leo the Great dies."],
[11, 11, 397, "St Martin of Tours dies."],
[11, 12, 1623, "St Josaphat Kuntsevych is martyred in Vitebsk."],
[11, 13, 354, "St Augustine is born at Thagaste."],
[11, 14, 1180, "St Laurence O'Toole, archbishop of Dublin, dies at Eu in Normandy."],
[11, 15, 1280, "St Albert the Great dies at Cologne."],
[11, 16, 1093, "St Margaret, queen of Scotland, dies in Edinburgh."],
[11, 17, 1231, "St Elizabeth of Hungary dies."],
[11, 18, 1626, "The new St Peter's Basilica is consecrated by Urban VIII."],
[11, 20, 1947, "Pius XII issues the encyclical Mediator Dei on the liturgy."],
[11, 21, 1964, "Vatican II promulgates Lumen gentium, and the decrees on ecumenism and on the Eastern Catholic Churches."],
[11, 22, 1439, "The Council of Florence proclaims union with the Armenians in Exultate Deo."],
[11, 23, 615, "St Columbanus dies at Bobbio."],
[11, 24, 2013, "Pope Francis issues Evangelii gaudium."],
[11, 25, 1881, "Angelo Roncalli, the future John XXIII, is born."],
[11, 26, 1751, "St Leonard of Port Maurice, preacher of the Stations of the Cross, dies."],
[11, 27, 1095, "Pope Urban II preaches at the Council of Clermont."],
[11, 28, 1981, "The Marian apparitions at Kibeho, Rwanda, begin."],
[11, 29, 1577, "St Cuthbert Mayne, the first seminary priest martyred in England, is executed at Launceston."],
[11, 30, 1215, "The Fourth Lateran Council holds its final session. Benedict XVI's encyclical Spe salvi also bears this date in 2007."],
[12, 1, 1581, "St Edmund Campion is executed at Tyburn."],
[12, 2, 1381, "Blessed John of Ruusbroec, Flemish mystic and prior of Groenendaal, dies."],
[12, 3, 1552, "St Francis Xavier dies on Shangchuan Island, off China."],
[12, 4, 1563, "The Council of Trent closes. St John Damascene also dies on this date, traditionally in 749."],
[12, 5, 1612, "St John Almond is executed at Tyburn."],
[12, 6, 343, "St Nicholas of Myra dies (traditional date)."],
[12, 7, 374, "Ambrose is chosen and consecrated bishop of Milan."],
[12, 8, 1854, "Pius IX defines the Immaculate Conception in Ineffabilis Deus. The Second Vatican Council closes on this date in 1965."],
[12, 9, 1531, "Our Lady appears to St Juan Diego on the hill of Tepeyac."],
[12, 10, 1591, "Sts Edmund Gennings and Swithun Wells are executed in London. Thomas Merton also dies on this date in 1968."],
[12, 11, 1925, "Pius XI establishes the feast of Christ the King in Quas primas."],
[12, 12, 549, "St Finnian of Clonard dies, traditionally in this year."],
[12, 13, 1545, "The Council of Trent opens."],
[12, 14, 1591, "St John of the Cross dies at Úbeda."],
[12, 17, 1936, "Jorge Mario Bergoglio, the future Pope Francis, is born in Buenos Aires."],
[12, 20, 1905, "Pius X encourages frequent Communion in Sacra Tridentina Synodus."],
[12, 21, 1597, "St Peter Canisius dies at Fribourg."],
[12, 22, 1917, "St Frances Xavier Cabrini dies in Chicago. Honorius III also approves the Order of Preachers on this date in 1216."],
[12, 23, 1595, "In Rome, Clement VIII receives the bishops of Kyiv into union: the Union of Brest."],
[12, 24, 1898, "St Charbel Makhlouf, Maronite monk and hermit, dies at Annaya."],
[12, 25, 800, "Pope Leo III crowns Charlemagne emperor in St Peter's."],
[12, 26, 1948, "Cardinal Mindszenty is arrested in Budapest."],
[12, 28, 1622, "St Francis de Sales dies at Lyons."],
[12, 29, 1170, "St Thomas Becket is murdered in Canterbury Cathedral."],
[12, 31, 335, "Pope St Sylvester I dies. Pope Benedict XVI dies on this date in 2022."],
    [1, 29, 1119, 'Pope Gelasius II dies in exile at the abbey of Cluny, driven from Rome during the struggle with Emperor Henry V.'],
    [2, 12, 2016, 'Pope Francis and Patriarch Kirill of Moscow meet in Havana: the first meeting of a pope and a Russian Orthodox patriarch.'],
    [2, 13, 1130, 'Pope Honorius II dies; the double election that follows begins the schism of the antipope Anacletus II against Innocent II.'],
    [2, 16, 1699, 'The First Leopoldine Diploma gives the Greek Catholic clergy of Transylvania the same privileges as the Latin clergy.'],
    [2, 26, 420, 'St Porphyry, Bishop of Gaza, dies.'],
    [2, 29, 468, 'Pope St Hilarius dies.'],
    [3, 27, 1378, 'Pope Gregory XI dies in Rome, the papacy having just returned from Avignon; the disputed election that follows begins the Great Western Schism.'],
    [3, 30, 1984, 'The Jesuit theologian Karl Rahner dies at Innsbruck.'],
    [4, 14, 1433, 'St Lydwina of Schiedam dies.'],
    [5, 17, 1925, 'Pope Pius XI canonises St Thérèse of Lisieux.'],
    [5, 28, 576, 'St Germanus (Germain), Bishop of Paris, dies.'],
    [6, 4, 1608, 'St Francis Caracciolo, founder of the Minor Clerks Regular, dies.'],
    [6, 10, 2001, 'Pope John Paul II canonises St Rafqa (Rebecca), a Maronite nun and the first woman saint of Lebanon.'],
    [6, 12, 816, 'Pope St Leo III, who crowned Charlemagne emperor, dies.'],
    [6, 17, 653, 'Pope St Martin I is arrested in Rome by imperial troops for opposing Monothelitism and taken to Constantinople.'],
    [6, 18, 1155, 'Pope Adrian IV, the only English pope, crowns Frederick Barbarossa Holy Roman Emperor.'],
    [6, 24, 1386, 'St John of Capistrano is born at Capestrano in the Abruzzi.'],
    [6, 25, 1394, 'Bl. Dorothea of Montau, anchoress at Marienwerder, dies.'],
    [7, 10, 983, 'Pope Benedict VII dies.'],
    [7, 11, 1276, 'Pope Adrian V is elected; he dies five weeks later, before being ordained priest.'],
    [7, 27, 1061, 'Pope Nicholas II dies; his decree of 1059 had placed the election of popes in the hands of the cardinals.'],
    [8, 2, 257, 'Pope St Stephen I dies.'],
    [8, 16, 1815, "St John Bosco is born near Castelnuovo d'Asti in Piedmont."],
    [8, 18, 1503, 'Pope Alexander VI (Rodrigo Borgia) dies.'],
    [9, 6, 972, 'Pope John XIII dies.'],
    [9, 21, 687, 'Pope Conon dies.'],
    [9, 25, 1534, "Pope Clement VII dies, in the year after Henry VIII's break with Rome."],
    [10, 20, 1187, 'Pope Urban III dies at Ferrara, reportedly on hearing of the fall of Jerusalem.'],
    [10, 26, 664, 'St Cedd, Bishop of the East Saxons, dies of the plague at Lastingham, soon after the Synod of Whitby.'],
    [10, 29, 1832, 'St Narcisa de Jesús Martillo Morán, the Ecuadorian laywoman and mystic, is born at Nobol.'],
    [11, 19, 496, 'Pope St Gelasius I dies.'],
    [12, 15, 687, 'Sergius I is elected pope as a compromise between two rival claimants.'],
    [12, 16, 882, 'Pope John VIII dies, said to be the first pope murdered.'],
    [12, 18, 1442, 'Pierre Cauchon, the bishop who presided at the trial of St Joan of Arc, dies.'],
    [12, 19, 1370, 'Bl. Urban V, the Avignon pope who briefly brought the papacy back to Rome, dies.'],
    [12, 27, 537, "Justinian's new church of Hagia Sophia in Constantinople is consecrated."],
    [12, 30, 1591, 'Pope Innocent IX dies after two months as pope.']
  ];
  // Curated Eastern Christian events; dates refer to the historical event, not necessarily a liturgical feast.
  const EAST_HIST = [
    [1,1,379,"St Basil the Great, archbishop of Caesarea and father of Eastern monasticism, dies (traditional date)."],
    [1,11,529,"St Theodosius the Cenobiarch, a founder of Palestinian communal monasticism, dies (traditional date)."],
    [1,17,356,"St Antony the Great, pioneer of Egyptian monasticism, dies (traditional date)."],
    [1,25,379,"St Gregory the Theologian begins his ministry in Constantinople around this period (approximate date)."],
    [2,14,869,"St Cyril, missionary to the Slavs and co-creator of their literary tradition, dies in Rome."],
    [2,23,155,"St Polycarp, bishop of Smyrna, is martyred (traditional date)."],
    [3,18,386,"St Cyril of Jerusalem, known for his catechetical lectures, dies (traditional date)."],
    [4,6,885,"St Methodius, archbishop and missionary to the Slavs, dies."],
    [4,12,1204,"The Fourth Crusade sacks Constantinople, a devastating event in Eastern Christian history."],
    [4,24,1646,"The Union of Uzhhorod brings a group of Ruthenian clergy into communion with Rome."],
    [5,2,373,"St Athanasius, patriarch of Alexandria and defender of Nicaea, dies."],
    [5,5,553,"The Second Council of Constantinople opens."],
    [5,9,348,"St Pachomius, a pioneer of communal monasticism in Egypt, dies (traditional date)."],
    [5,20,325,"The First Council of Nicaea opens (traditional date)."],
    [6,9,373,"St Ephrem the Syrian, hymnographer and theologian, dies (traditional date)."],
    [6,27,2001,"Pope John Paul II beatifies Ukrainian Greek Catholic martyrs during his visit to Lviv."],
    [7,15,1015,"St Vladimir of Kyiv, associated with the Christianization of Rus', dies."],
    [8,6,843,"The Transfiguration becomes a major feast in the Byzantine tradition (historical development; date is the feast)."],
    [9,14,407,"St John Chrysostom dies in exile at Comana (traditional date)."],
    [10,11,787,"The Second Council of Nicaea concludes, affirming the veneration of icons."],
    [10,31,1947,"Blessed Theodore Romzha, Ruthenian Greek Catholic bishop, dies after persecution."],
    [11,12,1623,"St Josaphat Kuntsevych, Eastern Catholic archbishop of Polotsk, is killed at Vitebsk."],
    [11,14,565,"Emperor Justinian I, patron of Hagia Sophia and Byzantine church building, dies."],
    [11,25,311,"St Peter of Alexandria is martyred (traditional date)."],
    [12,6,343,"St Nicholas, bishop of Myra, dies according to traditional accounts."],
    [12,27,537,"Justinian's church of Hagia Sophia is consecrated in Constantinople."]
  ];
  function histCard(iso, rite) {
    const m = +iso.slice(5, 7), d = +iso.slice(8, 10), y = +iso.slice(0, 4), key = (a, b) => a * 100 + b, today = key(m, d);
    let best = null, bestGap = 99;
    const source = rite === 'byz' ? EAST_HIST : rite === 'sarum' ? HIST.filter(e => e[2] < 1500) : HIST;
    for (const e of source) {
      // distance in days, wrapping the year
      const t = Date.UTC(2001, e[0] - 1, e[1]), n = Date.UTC(2001, m - 1, d), gap = Math.round(Math.abs(t - n) / 864e5), g = Math.min(gap, 365 - gap);
      if (g < bestGap || (g === bestGap && key(e[0], e[1]) <= today)) { best = e; bestGap = g; }
    }
    if (!best || bestGap > (rite === 'byz' ? 12 : 3)) return '';
    const when = bestGap === 0 ? '' : `${L.MN[best[0] - 1]} ${best[1]} · `;
    const yr = best[2] < 300 ? `AD ${best[2]}` : String(best[2]);
    return `<section class="card"><div class="lab">${todayAccent("history")}<span class="grow">This day in Church history</span></div><p style="margin:12px 0 0;font-family:var(--serif);font-size:1.08rem;line-height:1.5">${esc(best[3])}</p><p class="muted" style="font-size:.78rem;margin:10px 0 0">${esc(when)}${esc(yr)}${bestGap ? " · A nearby date in Church history" : ""}</p><p class="muted" style="font-size:.75rem;margin:4px 0 0">Some historical dates are traditional or approximate.</p></section>`;
  }
  // Small original Catholic-inspired line icons; decorative, with labels retained.
  function todayAccent(kind) {
    const shapes = {
      calendar: '<rect x="3" y="5" width="18" height="16" rx="2" stroke="#c9a227"/><path d="M7 3v4M17 3v4M3 10h18" stroke="#c9a227"/><path d="M12 12v6M9 15h6" stroke="#9d6b72"/>',
      saint: '<circle cx="12" cy="6.5" r="4.5" stroke="#c9a227"/><circle cx="12" cy="11" r="2.7"/><path d="M6 20c.5-3.5 2.5-5 6-5s5.5 1.5 6 5"/>',
      art: '<rect x="3" y="4" width="18" height="16" rx="1.5" stroke="#c9a227"/><rect x="5.5" y="6.5" width="13" height="11" stroke="#7393a5"/><circle cx="9" cy="10" r="1.5" fill="#c9a227" stroke="none"/><path d="m6 16 4-4 3 2 2-3 3 5" stroke="#7393a5"/>',
      history: '<path d="M3 21h18M5 21V11l7-5 7 5v10M9 21v-6h6v6M12 6V2M9.5 4h5" stroke="#c9a227"/><path d="M7 12h2m6 0h2" stroke="#c9a227"/>'
    };
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block;flex:none;margin:0">'+shapes[kind]+'</svg>';
  }
  function viewToday() {
    const v = dayInfo(st.date); loadReadings(st.date);
    const q = quoteFor(v, S.rite), a = artFor(v, S.rite);
    const saints = `<section class="card"><div class="lab">${todayAccent("saint")}<span class="grow">From the saints</span></div><div class="quote">“${esc(q.t)}”<small>${esc(q.s)} · ${esc(q.w)}</small></div>
      <div class="row">${speakBtn(`${q.t} — ${q.s}, ${q.w}`)}<button class="btn sm" data-act="qnext">Another</button></div></section>`;
    return glanceHTML(v) + saints + `<section class="card"><div class="lab"><span class="art-heading-icon">${todayAccent("art")}</span><span class="grow">Sacred art</span></div>${artHTML(a)}</section>` + histCard(v.iso, S.rite) + popeCard(v.iso);
  }


  const SHOURS = [['M', 'Matins'], ['L', 'Lauds'], ['LH', 'Little Hrs'], ['V', 'Vespers'], ['C', 'Compline']];
  const kindOf = rite => rite === 'sarum' ? st.shour : rite === 'byz' && st.kind === 'readings' ? 'morning' : st.kind;
  function stepsFor(rite, kind, v) {
    const tpl = C.FLOWS[rite][kind], r = v[rite === 'sarum' ? 'sarum' : rite === 'byz' ? 'byz' : 'roman'];
    const out = [];
    const sat = P(v.iso).getUTCDay() === 6;
    for (const s0 of tpl) {
      if (s0.type === 'silence' && !s0.text) continue;
      if (s0.type === 'bvm' && !(sat && window.Hours && Hours.sarumBVM)) continue;   // Our Lady's office: Saturdays
      if ((s0.type === 'matins' || s0.type === 'little') && !window.Hours) continue;  // silence timers removed
      const s = s0.type === 'silence' ? { type: 'prayer', title: s0.title, text: s0.text } : s0;
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
      if (s.type === 'oor') x.text = '';
      if (s.type === 'office') x.text = s.title;
      if (s.type === 'bvm') x.text = 'The Commemoration of Our Lady.';
      if (s.type === 'matins' || s.type === 'little') x.text = s.title + '.';
      if (s.type === 'hourlink') x.text = `${s.title}. Open the full office to pray the psalms.`;
      if (s.type === 'prayer') { x.body = s.text; x.text = `${s.title}. ${s.text}`; }
      out.push(x);
    }
    return out;
  }
  const HOURLINKS = {
    roman: { lauds: ['Universalis', 'https://universalis.com/'], vespers: ['Universalis', 'https://universalis.com/'], daytime: ['Universalis', 'https://universalis.com/'], compline: ['Universalis', 'https://universalis.com/'], any: ['Divine Office (audio & text)', 'https://divineoffice.org/'] },
    byz: { orthros: ['Horologion · MCI', 'https://mci.archpitt.org/liturgy/Horologion.html'], vespers: ['Horologion · MCI', 'https://mci.archpitt.org/liturgy/Horologion.html'], hours: ['Horologion · MCI', 'https://mci.archpitt.org/liturgy/Horologion.html'], compline: ['Horologion · MCI', 'https://mci.archpitt.org/liturgy/Horologion.html'], midnight: ['Horologion · MCI', 'https://mci.archpitt.org/liturgy/Horologion.html'], any: ['Horologion · MCI', 'https://mci.archpitt.org/liturgy/Horologion.html'] },
    sarum: { any: ['Breviary Offices — Sarum hours in English (1880)', 'https://commons.ptsem.edu/id/breviaryofficesf00cath'], more: [['Sarum Office with chant, English edition', 'https://www.sarum-chant.ca/'], ['Lesser Hours of the Sarum Breviary', 'https://archive.org/details/lesserhoursofsar00cathuoft']] }
  };
  function linksHTML(rite, hour) {
    const m = HOURLINKS[rite], a = m[hour] || m.any, b = m.any;
    let h = `<a class="btn sm" target="_blank" rel="noopener" href="${a[1]}">${esc(a[0])}</a>`;
    if (b[1] !== a[1]) h += `<a class="btn sm" target="_blank" rel="noopener" href="${b[1]}">${esc(b[0])}</a>`;
    if (rite === 'byz') h += '<a class="btn sm" target="_blank" rel="noopener" href="https://mci.archpitt.org/Publications.html">Ruthenian prayer books</a>';
    for (const [t, u] of (m.more || [])) h += `<a class="btn sm" target="_blank" rel="noopener" href="${u}">${esc(t)}</a>`;
    return h;
  }

  function viewReadings() {
    const v = dayInfo(st.date); loadReadings(st.date);
    const rr = st.readRite === 'byz' ? 'byz' : st.readRite === 'sarum' ? 'sarum' : 'roman';
    const b = (k, t) => `<button data-act="rr" data-v="${k}" class="${rr === k ? 'on' : ''}">${t}</button>`;
    const body = rr === 'byz' ? byzReadingsHTML(v) : rr === 'sarum' ? sarumMassHTML(v) : romanReadingsHTML(st.date);
    return `<section class="card"><div class="office-card-eyebrow"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.5C9 4.5 6 4.5 3 5v13c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-3-.5-6-.5-9 1.5zM12 6.5v13"/></svg><span>Today’s Readings</span></div><div class="seg">${b('roman', 'Roman')}${b('byz', 'Byzantine')}${b('sarum', 'Traditional')}</div>${body}</section>`;
  }
  function viewLiturgy() {
    const v = dayInfo(st.date); loadReadings(st.date);
    const byzantine = st.liturgyView === 'byz';
    const litRite = byzantine ? 'byz' : 'roman';
    const service = LiturgySchedule.service(st.date);
    const name = byzantine ? service.title : 'Roman Mass';
    const body = byzantine ? byzReadingsHTML(v, S.byzLiturgyChurch, false) : romanReadingsHTML(st.date, false);
    const day = byzantine ? L.byzantine(P(st.date), {...S, byzChurch:S.byzLiturgyChurch}) : v[litRite];
    const note = byzantine ? `<p class="muted">${esc(service.note)} Ruthenian Byzantine Catholic tradition of Pittsburgh; parish schedules may differ.</p>` : '';
    const reader = LiturgicalText.card(byzantine ? service.id : 'roman');
    return `<div class="seg" aria-label="Liturgy type"><button data-act="liturgyview" data-v="mass" class="${byzantine ? '' : 'on'}">Mass</button><button data-act="liturgyview" data-v="byz" class="${byzantine ? 'on' : ''}">Divine Liturgy</button></div>
      <section class="card"><h2 style="font-family:var(--serif)">${esc(name)}</h2>
      <div class="step"><div class="t">Liturgical day</div><div class="tx">${esc(day.title)}</div><p class="muted">${esc(day.season)}</p></div>
      <p class="muted">${byzantine ? 'Ruthenian readings and resources for the selected date appear below. Open a saved service book in Liturgical Text.' : 'Daily readings follow the current Roman Catholic lectionary. The complete Roman Missal prayers have not yet been incorporated.'}</p>
      ${note}${reader}${body}${!byzantine && litRite === 'roman' ? '<details class="srcd"><summary>Order of Mass · prayers and responses</summary><p class="muted">The Order of Mass contains the fixed parts of the celebration. The Collect, Prayer over the Offerings and Prayer after Communion vary with the day.</p><div class="row"><a class="btn" href="https://www.usccb.org/committees/divine-worship/policies/mass-settings-texts" target="_blank" rel="noopener">Read the fixed prayers and responses · USCCB</a><a class="btn" href="https://www.usccb.org/prayer-and-worship/the-mass/order-of-mass" target="_blank" rel="noopener">Follow the Order of Mass · USCCB</a></div><p class="muted">The first resource includes the Kyrie, Gloria, Nicene Creed, Sanctus, Memorial Acclamations and Lamb of God. It is a selection of official texts, rather than the complete Missal.</p></details>' : ''}</section>`;
  }
  function romanNightHTML() {
    // Modern Roman Night Prayer's ordinary weekday psalm assignments (Vulgate numbering).
    // Text remains the public-domain Douay translation, not the official ICEL edition.
    const days = [
      {refs:['90'],note:'Sunday night after Evening Prayer II'},
      {refs:['85'],note:'Monday'},
      {refs:['142'],note:'Tuesday'},
      {refs:['30','129'],note:'Wednesday'},
      {refs:['15'],note:'Thursday'},
      {refs:['87'],note:'Friday'},
      {refs:['4','133'],note:'Saturday night after Evening Prayer I'}
    ];
    const dow=P(st.date).getUTCDay(), chosen=days[dow];
    const psalms=chosen.refs.map(num=>{
      const verses=Hours.H.ps[num];
      if(!verses)return `<div class="sec"><b>Psalm ${esc(num)} (Vulgate)</b><p class="muted">Text not available in Ora's current psalter.</p></div>`;
      const label=+num+1;
      return `<div class="sec"><b>Psalm ${esc(num)} (Vulgate; approximately Psalm ${label} in modern numbering)</b><p class="tx">${verses.map(row=>esc(row[2]).replace(/\\s*\\*\\s*/g,' ')).join('<br>')}</p></div>`;
    }).join('');
    return `<p class="muted" style="font-size:.8rem">Night Prayer · ${chosen.note}. Weekday psalm selection follows the modern Roman pattern; Douay-Rheims wording is used for personal prayer. Proper antiphons, readings, responsories and concluding prayers still require verification against the approved edition.</p>
      <div class="sec"><b>Introduction and examination of conscience</b><p>O God, come to my assistance. O Lord, make haste to help me.</p><p class="muted">Review the day in silence, giving thanks and asking forgiveness.</p></div>
      <div class="sec"><b>Hymn</b><p class="muted">Use the appointed hymn from the authorized daily office.</p></div>
      ${psalms}
      <div class="sec"><b>Short reading and responsory</b><p class="muted">Consult the authorized text linked below for the appointed reading and responsory.</p></div>
      <div class="sec"><b>Canticle of Simeon (Nunc Dimittis)</b><p>${esc(C.TEXTS.nunc)}</p></div>
      <div class="sec"><b>Concluding prayer and blessing</b><p class="muted">Use the appointed concluding prayer from the authorized office.</p><p>May the all-powerful Lord grant us a restful night and a peaceful death. Amen.</p></div>`;
  }
  function viewPray() {
    const v = dayInfo(st.date); loadReadings(st.date);
    const rite = S.rite, steps = stepsFor(rite, kindOf(rite), v);
    let h = `<section class="card divine-office-card"><div class="office-card-eyebrow"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 21V11l2-5c.5-1.2 2-1 2 .4V14M16 21V11l-2-5c-.5-1.2-2-1-2 .4V14M8 15l-2-3c-.7-1.1-2.3-.4-1.8.8L8 21M16 15l2-3c.7-1.1 2.3-.4 1.8.8L16 21M12 14v7"/></svg><span>Today’s Prayers</span></div><div class="seg prayer-major" role="group" aria-label="Prayer tradition">${Object.keys(RITES).map(k => `<button data-act="rite" data-v="${k}" class="${rite === k ? 'on' : ''}">${k === 'roman' ? 'Roman' : k === 'byz' ? 'Byzantine' : 'Traditional'}</button>`).join('')}</div>
      ${rite === 'sarum' ? `<div class="seg hrs prayer-minor" role="group" aria-label="Prayer hour">${SHOURS.map(([k, n]) => `<button data-act="shour" data-v="${k}" class="${st.shour === k ? 'on' : ''}">${n}</button>`).join('')}</div>` : `<div class="seg prayer-minor" role="group" aria-label="Prayer hour"><button data-act="kind" data-v="morning" class="${st.kind === 'morning' ? 'on' : ''}">${rite === 'byz' ? 'Orthros' : 'Lauds'}</button> ${rite === 'roman' ? `<button data-act="kind" data-v="readings" class="${st.kind === 'readings' ? 'on' : ''}">Office of Readings</button>` : ''}<button data-act="kind" data-v="evening" class="${st.kind === 'evening' ? 'on' : ''}">${rite === 'byz' ? 'Vespers' : 'Vespers'}</button><button data-act="kind" data-v="night" class="${st.kind === 'night' ? 'on' : ''}">${rite === 'byz' ? 'Compline' : 'Compline'}</button></div>`}`;
    if (rite === 'roman') {
      const officeName = {morning:'Lauds',readings:'Office of Readings',evening:'Vespers',night:'Compline'}[st.kind] || 'Lauds';
      const audioName = {morning:'Morning Prayer',readings:'Office of Readings',evening:'Evening Prayer',night:'Night Prayer'}[st.kind] || 'Morning Prayer';
      h += `<div class="roman-office-player"><h3>${esc(officeName)}</h3>${doSlot(st.date,audioName)}</div>`;
    }
    if (rite === 'byz') h += '<h3 class="prayer-rite-title">'+esc(({morning:'Orthros',evening:'Vespers',night:'Compline'}[st.kind] || 'Orthros'))+'</h3>';
    if (rite === 'sarum') h += '<h3 class="prayer-rite-title">'+esc((SHOURS.find(([k]) => k === st.shour) || SHOURS[0])[1])+'</h3>';
    if (hasTTS) h += '<div class="row" style="margin:0 0 14px"><button class="btn fill" data-act="play">▶ Play session aloud</button></div>';
    steps.forEach((s, i) => {
      h += `<div class="step ${st.active === i ? 'on' : ''}" id="st${i}">${rite === "roman" && (s.type === "office" || s.type === "oor") ? "" : `<div class="t">${esc(s.title)}</div>`}`;
      if (s.type === 'prayer') h += `<div class="tx">${esc(s.body)}</div>${speakBtn(s.text)}`;
      else if (s.type === 'calendar') h += `<div class="tx">${esc(s.head)}</div><div class="muted">${esc(s.sub)}</div>`;
      else if (s.type === 'quote') h += `<div class="quote">“${esc(s.q.t)}”<small>${esc(s.q.s)} · ${esc(s.q.w)}</small></div>`;
      else if (s.type === 'art') h += artHTML(s.a);
      else if (s.type === 'readings') h += (rite === 'byz' ? byzReadingsHTML(v) : rite === 'sarum' ? sarumMassHTML(v) : romanReadingsHTML(st.date));
      else if (s.type === 'office') h += (window.Hours ? `<details open><summary class="muted">Show or hide</summary>${rite === 'roman' ? (s.which === 'C' ? romanNightHTML() : Hours.modern(L, P(st.date), s.which)) : rite === 'sarum' ? (Hours.sarum && Hours.sarum(L, P(st.date), s.which, window.Sarum) || '<p class="muted" style="font-size:.82rem">The Sarum office for this part of the year has not been added yet (the Sarum office now covers the whole year of seasons; this may be a day the app cannot place). Nothing is shown in its place, so as not to repeat the Roman office.</p>') : Hours.hour(L, P(st.date), s.which)}</details>${rite === 'roman' ? `<div class="row">${linksHTML('roman', s.hour)}</div><p class="muted" style="font-size:.78rem">For the full modern text with the official antiphons, readings and intercessions, use the buttons above.</p>` : rite === 'sarum' ? `<p class="muted" style="font-size:.78rem;margin-top:8px">Other English resources for this office:</p><div class="row">${linksHTML('sarum', 'any')}</div>` : ''}` : '');
      else if (s.type === 'matins') h += Hours.sarumMatins ? `<details class="matins-d" open><summary class="muted">Show or hide</summary><div class="matins-slot" data-d="${esc(st.date)}"><p class="muted" style="font-size:.8rem">Loading Matins… (the first time, Ora downloads the Matins texts, about 3.6 MB; after that they work offline).</p></div></details>` : '';
      else if (s.type === 'little') h += `<div class="muted" style="font-size:.82rem">Prime at about 6, Terce at 9, Sext at noon, None at 3. Open each hour to pray it.</div>${[['P', 'Prime'], ['T', 'Terce'], ['S', 'Sext'], ['N', 'None']].map(([w, n]) => `<details style="margin:4px 0"><summary class="muted">${n}</summary>${Hours.sarum(L, P(st.date), w, window.Sarum) || ''}</details>`).join('')}`;
      else if (s.type === 'sarumhours') h += `<div class="muted" style="font-size:.82rem">Matins at night; Prime, Terce, Sext and None at about 6, 9, noon and 3.</div>${Hours.sarumMatins ? `<details class="matins-d" style="margin:4px 0"><summary class="muted">Matins</summary><div class="matins-slot" data-d="${esc(st.date)}"><p class="muted" style="font-size:.8rem">Loading Matins… (the first time, Ora downloads the Matins texts, about 3.6 MB; after that they work offline).</p></div></details>` : ''}${[['P', 'Prime'], ['T', 'Terce'], ['S', 'Sext'], ['N', 'None']].map(([w, n]) => `<details style="margin:4px 0"><summary class="muted">${n}</summary>${Hours.sarum(L, P(st.date), w, window.Sarum) || ''}</details>`).join('')}`;
      else if (s.type === 'bvm') h += `<div class="muted" style="font-size:.82rem">A short office of Mary, said on free days, chiefly Saturdays. Optional.</div>${s.hrs.map(([w, n]) => `<details style="margin:4px 0"><summary class="muted">${n}</summary>${Hours.sarumBVM(L, P(st.date), w, window.Sarum) || ''}</details>`).join('')}`;
      else if (s.type === 'oor') h += `<div class="office-readings-text">${oorHTML(st.date)}</div>`;
      else if (s.type === 'hourlink') h += `<div class="row">${linksHTML(rite, s.hour)}</div>`;
      else if (s.type === 'silence') h += `<div class="tx">${esc(s.text || 'Be still before God.')}</div><div class="timer" id="tm${i}">${Math.floor(s.seconds / 60)}:${pad(s.seconds % 60)}</div><button class="btn sm" data-act="timer" data-i="${i}" data-s="${s.seconds}">Start timer</button>`;
      h += '</div>';
    });
    return h + '</section>';
  }

  const QS = 'font-family:var(--serif);font-size:1.05rem;line-height:1.55;margin:.3em 0';
  function justiceIcon(kind) {
    const paths = {
      scales:'<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7h6L5 7zm14 0-3 7h6l-3-7z"/>',
      leaf:'<path d="M20 4C10 4 4 8 4 15c0 3 2 5 5 5 7 0 11-6 11-16zM5 19c3-5 7-8 12-10"/>',
      book:'<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1zM12 6v14"/>',
      hands:'<path d="M3 14l4-4 4 4M21 14l-4-4-4 4M7 10V6m10 4V6M7 17c2 2 4 3 5 3s3-1 5-3M9 13l3 3 3-3"/>',
      flame:'<path d="M12 22c4.4 0 7-3.1 7-7.2 0-3.5-2.1-6.1-4.1-8.2.2 3-1 4.5-2 5.1C13 8.3 11.4 5.5 9 2c.2 4.3-4 7.5-4 12.8C5 18.9 7.7 22 12 22z"/>',
      heart:'<path d="M12 20s-9-5.7-9-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.3-9 11-9 11z"/>'
    };
    return '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;color:var(--gold)">'+(paths[kind]||paths.book)+'</svg>';
  }
  function justiceCard(j) {
    return `<section class="card"><div class="lab">${justiceIcon(j.tag === "Creation" ? "leaf" : /catechism/i.test(j.tag) ? "book" : "scales")}<span class="grow">${esc(j.tag === "Creation" ? "Care for creation" : j.tag)}</span></div><p style="${QS}">“${esc(j.text)}”</p><p class="muted" style="margin:.2em 0">${esc(j.who)}${j.note ? ' — ' + esc(j.note) : ''}${j.url ? ` · <a target="_blank" rel="noopener" href="${esc(j.url)}">full text</a>` : ''}</p></section>`;
  }
  function jRow(text, who, extra, url) {
    return `<div style="padding:10px 0;border-top:1px solid var(--line)"><p style="${QS}">“${esc(text)}”</p><p class="muted" style="margin:.2em 0;font-size:.85rem">${esc(who)}${url ? ` · <a target="_blank" rel="noopener" href="${esc(url)}">source</a>` : ''}</p>${extra ? `<p class="muted" style="margin:.2em 0;font-size:.76rem">${esc(extra)}</p>` : ''}</div>`;
  }
  function charitySaints(d) {
    const S = window.JUSTICE_SAINTS || []; if (!S.length) return '';
    const m = d.getUTCMonth() + 1, dd = d.getUTCDate(), today = S.filter(x => x.m === m && x.d === dd);
    return today.map(x => `<section class="card justice-charity"><div class="lab">${justiceIcon("heart")}<span class="grow">Saint of charity · today</span></div><p style="font-family:var(--serif);font-size:1.1rem;margin:6px 0 2px"><b>${esc(x.name)}</b></p><p style="margin:0;font-family:var(--serif);font-size:1.05rem;line-height:1.5">${esc(x.why)}</p>${x.cal ? `<p class="muted" style="font-size:.76rem;margin:0">${esc(x.cal)}</p>` : ''}</section>`).join('');
  }
  /* typographic quotes in text (not inside tags): "x" -> “x”, it's -> it’s */
  const curly = html => html.replace(/(^|>)([^<]+)/g, (m, a, t) => a + t
    .replace(/&quot;|"/g, '\u0001').replace(/&#39;|'/g, '\u0002')
    .replace(/(^|[\s(\[—–\-\/])\u0001/g, '$1“').replace(/\u0001/g, '”')
    .replace(/(^|[\s(\[—–\-\/“])\u0002/g, '$1‘').replace(/\u0002/g, '’'));
  function viewJustice() {
    const J = window.JUSTICE || [];
    if (!J.length) return '<p class="muted">No excerpts loaded.</p>';
    const d = P(st.date), n = Math.floor(d.getTime() / 864e5), f = J[((n % J.length) + J.length) % J.length];
    const items = (feed && feed._justice && feed._justice.items) || [];
    const R = window.JUSTICE_RADICAL || [], T = window.JUSTICE_TEACH || [], S = window.JUSTICE_SAINTS || [];
    let h = '';
    // Today: one quotation and one short piece, so the material lasts across many days
    h += `<div class="justice-daily">${justiceCard(f)}</div>`;
    const creation = J.filter(j => j.tag === 'Creation');
    if (creation.length) {
      const e = creation[((n % creation.length) + creation.length) % creation.length];
      h += `<section class="card justice-ecology"><div class="lab">${justiceIcon("leaf")}<span class="grow">Care for Creation</span></div><p style="${QS}">“${esc(e.text)}”</p><p class="muted" style="font-size:.85rem">${esc(e.who)}${e.note ? ' · '+esc(e.note) : ''}${e.url ? ` · <a target="_blank" rel="noopener noreferrer" href="${esc(e.url)}">source</a>` : ''}</p></section>`;
    }
    const economic = J.filter(j => j.tag !== 'Creation' && /poor|poverty|wealth|rich|wages|workers|labor|labour|property|goods|economic|money|possess|common good|distribution|destitute|hungry|hunger|deprive them|share in our/i.test(j.text));
    if (economic.length) {
      const e = economic[((n % economic.length) + economic.length) % economic.length];
      h += `<section class="card justice-economic"><div class="lab">${justiceIcon("scales")}<span class="grow">Economic Justice</span></div><p style="${QS}">“${esc(e.text)}”</p><p class="muted" style="font-size:.85rem">${esc(e.who)}${e.note ? ' · '+esc(e.note) : ''}${e.url ? ` · <a target="_blank" rel="noopener noreferrer" href="${esc(e.url)}">source</a>` : ''}</p></section>`;
    }

    if (R.length) {
      const x = R[((n % R.length) + R.length) % R.length];
      h += `<section class="card justice-voice"><div class="lab">${justiceIcon("flame")}<span class="grow">A radical voice · ${esc(x.who)}</span></div><p style="${QS}">“${esc(x.text)}”</p><p class="muted" style="margin:.2em 0;font-size:.85rem">${esc(x.src)}${x.url ? ` · <a target="_blank" rel="noopener" href="${esc(x.url)}">source</a>` : ''}</p><p class="muted" style="font-size:.78rem;margin:.3em 0 0">${esc(x.bio)}</p></section>`;
    }
    h += charitySaints(d);
    const tch = []; T.forEach(t => { const ps = t.h.split(/<\/p>\s*/).map(x => x.trim()).filter(Boolean).map(x => x + '</p>'); ps.forEach((p, k) => tch.push({ t: t.t, p, k: k + 1, of: ps.length })); });
    const rch = []; items.forEach(it => { let cur = [], w = 0; const flush = () => { if (cur.length) rch.push({ it, paras: cur }); cur = []; w = 0; }; it.paras.forEach(p => { const pw = p.split(/\s+/).length; if (w && w + pw > 230) flush(); cur.push(p); w += pw; }); flush(); });
    const kinds = [rch.length ? 'r' : 't', 't'], kind = kinds[((n % kinds.length) + kinds.length) % kinds.length], m3 = Math.floor(n / kinds.length);
    if (kind === 'r') {
      const c = rch[((m3 % rch.length) + rch.length) % rch.length], parts = rch.filter(x => x.it === c.it), at = parts.indexOf(c) + 1;
      h += `<section class="card justice-reading"><div class="lab">${justiceIcon("book")}<span class="grow">Reading · ${esc(c.it.author)}</span></div>${c.paras.map(p => `<p style="font-family:var(--serif);font-size:1.05rem;line-height:1.6">${esc(p)}</p>`).join('')}<p class="muted" style="font-size:.78rem;margin:0">${esc(c.it.work)}${parts.length > 1 ? ` · ${at} of ${parts.length}, continued on later days` : ''} · <a target="_blank" rel="noopener" href="${esc(c.it.url)}">full text</a></p></section>`;
    } else if (kind === 't' && tch.length) {
      const c = tch[((m3 % tch.length) + tch.length) % tch.length];
      h += `<section class="card justice-teaching"><div class="lab">${justiceIcon("book")}<span class="grow">Teaching · ${esc(c.t)}${c.of > 1 ? ` · ${c.k} of ${c.of}` : ''}</span></div><div style="font-family:var(--serif);font-size:1.02rem;line-height:1.55">${c.p}</div></section>`;
    }

    // Library: one card, four tabs
    const tabs = [['teach', 'Teaching'], ['saints', 'Saints'], ['quotes', 'Quotations'], ['voices', 'Voices']];
    const jt = st.jtab || 'teach';
    let body = '';
    if (jt === 'teach') body = T.map(t => `<details style="border-top:1px solid var(--line);padding:10px 0"><summary style="font-weight:600;cursor:pointer">${esc(t.t)}</summary><div style="margin-top:8px;font-family:var(--serif);font-size:1.02rem;line-height:1.55">${t.h}</div></details>`).join('');
    else if (jt === 'saints') body = `<p class="muted" style="font-size:.82rem">${S.length} saints who gave their lives to the poor, through the year.</p>` + S.slice().sort((a, b) => a.m * 100 + a.d - b.m * 100 - b.d).map(x => `<div style="padding:9px 0;border-top:1px solid var(--line)"><b>${esc(x.name)}</b> <span class="muted" style="font-size:.8rem">· ${esc(L.MN[x.m - 1].slice(0, 3))} ${x.d}</span><br><span style="font-size:.92rem">${esc(x.why)}</span></div>`).join('');
    else if (jt === 'quotes') {
      const order = ['Scripture', 'Church Father', 'Doctor of the Church', 'Saint', 'Council', 'Pope', 'Encyclical', 'Catechism', 'Creation'], groups = {};
      J.forEach(j => (groups[j.tag] = groups[j.tag] || []).push(j));
      const label = { 'Church Father': 'The Fathers', 'Doctor of the Church': 'Doctors of the Church', Saint: 'Saints', Council: 'Councils', Pope: 'Popes', Encyclical: 'Encyclicals', Catechism: 'The Catechism', Scripture: 'Scripture', Creation: 'Care for creation' };
      body = Object.keys(groups).sort((a, b) => (order.indexOf(a) + 99) % 99 - (order.indexOf(b) + 99) % 99).map(t => `<details style="border-top:1px solid var(--line);padding:10px 0"><summary style="font-weight:600;cursor:pointer">${esc(label[t] || t)} <span class="muted" style="font-weight:400">· ${groups[t].length}</span></summary>${groups[t].map(j => jRow(j.text, j.who + (j.note ? ' — ' + j.note : ''), '', j.url)).join('')}</details>`).join('');
    } else body = `<p class="muted" style="font-size:.82rem">Catholic Workers, liberation theologians, Catholic socialists, labour leaders and peacemakers, in their own words. Some of their views were debated in the Church in their time.</p>` + R.map(x => jRow(x.text, x.who + ' · ' + x.src, x.bio, x.url)).join('');
    h += `<details class="card justice-library" ${st.jtab ? 'open' : ''}><summary style="font-weight:600;cursor:pointer">Library <span class="muted" style="font-weight:400;font-size:.85rem">· everything, to browse at your own pace</span></summary><div class="seg" style="margin-top:10px">${tabs.map(([k, t]) => `<button data-act="jtab" data-v="${k}" class="${jt === k ? 'on' : ''}">${t}</button>`).join('')}</div>${body}</details>`;
    return curly(h);
  }

  // Ukrainian Catholic commemorations: curated, not a fabricated daily sanctoral.
  const UKRAINIAN_SAINTS = {
    '11-12': { name: 'Saint Josaphat Kuntsevych', bio: 'A seventeenth-century archbishop of Polotsk, born in the lands of present-day Ukraine. He worked for communion between Eastern Christians and Rome and was killed in Vitebsk in 1623. His feast is observed on November 12 in the Roman calendar; Byzantine commemorations may differ.' },
    '06-27': { name: 'Blessed Mykola Charnetsky and Companions', bio: 'Bishop Mykola Charnetsky and fellow Ukrainian Greek Catholic martyrs suffered persecution under Soviet rule. They were beatified by Pope John Paul II in Lviv in 2001.' },
    '09-17': { name: 'Saint Sophia of Kyiv: Ukrainian Christian heritage', bio: 'The cathedral of Holy Wisdom in Kyiv was built in the eleventh century and preserves the artistic and spiritual heritage of Kyivan Christianity. This is a heritage feature, not a feast of a canonized person.' }
  };
  function ukrainianSaintCard(iso) {
    const key = iso.slice(5), saint = UKRAINIAN_SAINTS[key];
    return `<section class="card"><div class="lab"><span class="grow">Ukrainian saint of the day</span></div>${saint ? `<h3 style="font-family:var(--serif)">${esc(saint.name)}</h3><p style="font-family:var(--serif);font-size:1.02rem;line-height:1.55">${esc(saint.bio)}</p>` : '<p class="muted">No verified Ukrainian saint is listed for this date yet. This collection is being expanded; no commemoration is invented for dates without a verified entry.</p>'}<p class="muted" style="font-size:.75rem">Ukrainian heritage collection · commemorations may follow different dates in Ukrainian liturgical calendars.</p></section>`;
  }
  function viewCalendar() {
    if (!st.month) { const d = P(st.date); st.month = { y: d.getUTCFullYear(), m: d.getUTCMonth() }; }
    const { y, m } = st.month, first = L.D(y, m + 1, 1), start = L.add(first, -first.getUTCDay()), today = todayISO();
    let h = `<section class="card calendar-overview"><div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><button class="ib" data-act="mprev" aria-label="Previous month">‹</button><h2 style="flex:1;text-align:center;margin:0">${L.MN[m]} ${y}</h2><button class="ib" data-act="mnext" aria-label="Next month">›</button></div>
      <div class="legend">${['roman', 'byz', 'sarum'].map(k => `<button data-act="layer" data-v="${k}" class="${st.layers[k] ? 'on' : ''}">${k === 'roman' ? 'Roman' : k === 'byz' ? 'Byzantine' : 'Traditional'}</button>`).join('')}</div><div class="grid">`;
    for (const d of L.DN) h += `<div class="dow">${d.slice(0, 3)}</div>`;
    for (let i = 0; i < 42; i++) {
      const d = L.add(start, i), iso = L.iso(d), v = dayInfo(iso), out = d.getUTCMonth() !== m;
      const dots = ['roman', 'byz', 'sarum'].filter(k => st.layers[k]).map(k => `<span class="dot ${MAJOR.test(v[k].rank || '') ? 'maj' : ''}" style="--c:${col(v[k].color)}"></span>`).join('');
      const f = (st.layers.sarum && v.sarum.fast && !/^Friday/.test(v.sarum.fast)) || (st.layers.byz && v.byz.fast && (v.byz.fastSeason || /Strict|^Fast and/.test(v.byz.fast)));
      const label = fmtLong(iso) + '. ' + ['roman', 'byz', 'sarum'].filter(k => st.layers[k]).map(k => RITES[k] + ': ' + v[k].title + (v[k].fast ? '. ' + v[k].fast : '')).join('. ');
      h += `<button class="cell ${out ? 'out' : ''} ${iso === today ? 'today' : ''} ${iso === st.date ? 'sel' : ''}" data-act="pick" data-d="${iso}" aria-label="${esc(label)}" aria-pressed="${iso === st.date}"${iso === today ? ' aria-current="date"' : ''}><span>${d.getUTCDate()}</span>${f ? '<span class="f" aria-hidden="true">ƒ</span>' : ''}<span class="dots" aria-hidden="true">${dots}</span></button>`;
    }
    h += '</div><div class="calendar-key" aria-label="Liturgical color legend"><span><i class="key-dot" style="--key:#59805d"></i> Green · Ordinary Time</span><span><i class="key-dot" style="--key:#8a6ba4"></i> Violet · Penitential seasons</span><span><i class="key-dot" style="--key:#b23e3e"></i> Red · Martyrs / Holy Spirit</span><span><i class="key-dot" style="--key:#eee8d9"></i> White · Festive celebrations</span><span><i class="key-dot" style="--key:#c9a227"></i> Gold · Major feasts</span><span><i class="key-dot" style="--key:#c9899e"></i> Rose · Joyful Sundays</span></div>';
    h += '</section>';
    const v = dayInfo(st.date);
    h += `<h3 class="calendar-selected-heading">${esc(fmtLong(st.date))}</h3>${st.layers.roman ? cardRoman(v) : ''}${st.layers.byz ? cardByz(v) : ''}${st.layers.sarum ? cardSarum(v) : ''}`;
    return h;
  }

  function felireMore() {
    if (!window.FELIRE_PRO) return '';
    const v = a => a.map(t => `<p style="font-family:var(--serif);font-size:1.02rem;line-height:1.55;margin:0 0 10px">${esc(t)}</p>`).join('');
    return `<section class="card"><h3>Félire Óengusso</h3><p class="muted">The Calendar of Óengus the Culdee, a monk of Tallaght, written about 800: a verse for every day of the year naming the saints kept on it, with a long prologue and epilogue. Today’s verse is on the Today page when Traditional is chosen.</p>
      <details style="margin:8px 0"><summary><b>The Prologue</b> <span class="muted" style="font-size:.8rem">· the saints outlast the kings</span></summary><div style="margin-top:10px">${v(window.FELIRE_PRO)}</div></details>
      <details style="margin:8px 0"><summary><b>The Epilogue</b> <span class="muted" style="font-size:.8rem">· the troops of heaven, and “Mayst Thou save me, O Jesus”</span></summary><div style="margin-top:10px">${v(window.FELIRE_EPI)}</div></details>
      <p class="muted" style="font-size:.74rem">Tr. Whitley Stokes, <i>The Martyrology of Oengus the Culdee</i> (Henry Bradshaw Society, 1905). Read from a scan of the printed book, so a letter here and there may be misread; brackets and question marks are Stokes’s own.</p></section>`;
  }
  function viewMore() {
    return `<section class="card"><h3>Settings</h3><div class="row"><button class="btn fill" data-act="settings">Open settings</button></div></section>
    <details class="card more-liturgy"><summary><b>Sacred Liturgy</b> <span class="muted">· work in progress</span></summary><div class="more-liturgy-content">${viewLiturgy()}</div></details>
    <details class="card"><summary><b>About the Divine Office texts</b></summary><p class="muted">The Byzantine prayer sequences in Ora are devotional adaptations, not complete official liturgical offices. For the full Ruthenian offices, consult the <a href="https://mci.archpitt.org/Publications.html" target="_blank" rel="noopener noreferrer">Pittsburgh prayer books</a>. Roman and Traditional texts also identify their sources within the prayers.</p></details>
    <details class="card"><summary><b>Fasting &amp; abstinence · guidance</b></summary><div class="fasting-guidance"><p>The small crossed-food symbols describe restrictions identified in Ora's calendar entries; they are not a complete statement of binding obligations.</p><p><b>Roman:</b> Current Latin Catholic fasting and abstinence are governed by canon law and applicable bishops' conference rules. <a href="https://www.usccb.org/prayer-and-worship/liturgical-year/lent" target="_blank" rel="noopener noreferrer">USCCB guidance</a>.</p><p><b>Byzantine:</b> Ukrainian Greek Catholic fasting discipline varies by eparchy and applicable particular law. The Byzantine calendar in Ora may follow a different tradition; consult your eparchy for binding rules. Oil restrictions are not automatically implied by a fasting season.</p><p><b>Traditional:</b> Sarum fasting marks historical observances, not present-day universal Catholic obligations. Personal fasting may be adapted for health and pastoral reasons.</p></div></details>
    <details class="card"><summary><b>Resources · liturgical documents</b></summary><div style="margin-top:12px"><p class="muted">Official publisher resources for personal reading. These open in the publisher's website.</p><h3>Ruthenian Byzantine</h3><p><a href="https://mci.archpitt.org/servicebooks/DivineLiturgies.pdf" target="_blank" rel="noopener noreferrer">Divine Liturgies of St. John Chrysostom and St. Basil</a></p><p><a href="https://mci.archpitt.org/Publications.html" target="_blank" rel="noopener noreferrer">Metropolitan Cantor Institute · service books and publications</a></p><p><a href="https://mci.archpitt.org/LiturgicalCalendar2026.html" target="_blank" rel="noopener noreferrer">Ruthenian liturgical calendar · 2026</a></p><h3>Roman</h3><p><a href="https://www.liturgyoffice.org.uk/Missal/Text/MCFL.pdf" target="_blank" rel="noopener noreferrer">Order of Mass · England and Wales</a></p><p><a href="https://www.usccb.org/prayer-and-worship/the-mass/order-of-mass" target="_blank" rel="noopener noreferrer">USCCB · Order of Mass resources</a></p></div></details>
    ${felireMore()}
    <section class="card"><h3>About the calendars</h3>
      <p><b>Roman (modern)</b> — General Roman Calendar with cycles; Ascension, Corpus Christi and Epiphany follow your settings.</p>
      <p><b>Byzantine</b> — Ruthenian Byzantine Catholic tradition of Pittsburgh, with Gregorian Pascha and fixed feasts. The computed calendar and lectionary are checked against selected Metropolitan Cantor Institute sources; 2026 service selection follows the published rules. A complete parish Typikon and future annual service calendars are not included. Ukrainian heritage remains separate.</p>
      <p><b>Traditional</b> — the Sarum Use, the medieval rite of Salisbury that was followed in England and Ireland: its temporal cycle with Ember Days, Rogation, vigils, octaves, Lenten and St Martin’s fasts, and the feasts from your Gaelic Sarum calendars (valid for any year).</p></section>
    <details class="card credits"><summary><h3 style="margin:0">Credits &amp; sources</h3></summary><div style="margin-top:8px">
      <p class="muted">Roman readings: USCCB daily readings feed (bible.usccb.org); fallback citations from the <a href="https://cpbjr.github.io/catholic-readings-api/">Catholic Readings API</a>. Art images: Wikipedia / Wikimedia Commons. Prayer texts: public domain (Douay-Rheims–Challoner wording, Keble’s Phos Hilaron). Official links: USCCB, Universalis, Divine Office and the Metropolitan Cantor Institute of Pittsburgh.</p>
      <p class="muted">Sarum Mass: F. E. Warren, <i>The Sarum Missal in English</i> (1911). Sarum Matins: Divinum Officium texts, with Irish Lives from the Book of Lismore (Stokes, 1890) and Plummer. Félire Óengusso: Whitley Stokes (1905). Texts read from scans, so an occasional misread word is possible.</p>
      <p class="muted"><b>Roman Liturgy of the Hours:</b> Ora’s current Lauds, Vespers, Compline, and Office of Readings combine date-dependent selections with devotional adaptations. They are not yet complete reproductions of the approved modern Roman office. Where available, Ora uses public-domain Douay-Rheims Scripture and historical prayers; the official antiphons, readings, responsories, intercessions, and concluding prayers may differ. Consult the linked authorized editions for the complete appointed texts.</p>
      <p class="muted">Office of Readings: the table of readings from the four-volume <i>Liturgy of the Hours</i>, indexed by Felix Just, S.J. (catholic-resources.org). Full texts of the second readings, where public domain: Kirsopp Lake, <i>The Apostolic Fathers</i> (1912); A. Roberts &amp; J. Donaldson, <i>Ante-Nicene Fathers</i> vol. 1 (1885). Byzantine calendar: Ruthenian fixed feasts and the Paschal cycle, checked against selected MCI 2026 dates. Ukrainian heritage data from Winnipeg remains separate. Audio of the Roman hours: the free daily recordings of <a href="https://divineoffice.org" target="_blank" rel="noopener">Divine Office</a> (DivineOffice.org), streamed from their podcast.</p>
      <p class="muted">Papal quotations and the Sunday Angelus: the official English texts on <a href="https://www.vatican.va" target="_blank" rel="noopener">vatican.va</a> © Dicastero per la Comunicazione – Libreria Editrice Vaticana; only short excerpts are shown, with links to the full text.</p>
      <p class="muted">Quotations are modern renderings of public-domain translations; check the cited work before quoting in print.</p></div></details>`;
  }
  function hoursHTML() {
    const rite = S.rite, hrs = C.HOURS[rite], now = new Date().getHours() + new Date().getMinutes() / 60;
    let cur = -1; hrs.forEach((x, i) => { if (x.start != null && x.start <= now) cur = i; });
    if (rite === 'byz' && now >= 0 && cur < 0) cur = 0;
    let h = `<div class="seg">${Object.keys(RITES).map(k => `<button data-act="rite" data-v="${k}" class="${rite === k ? 'on' : ''}">${k === 'roman' ? 'Roman' : k === 'byz' ? 'Byzantine' : 'Traditional'}</button>`).join('')}</div>`;
    hrs.forEach((x, i) => { h += `<div class="cite" style="${i === cur ? 'background:var(--line);border-radius:8px;padding:7px 8px' : ''}"><span><b style="color:var(--ink)">${esc(x.n)}</b> <span class="muted">· ${esc(x.alt)}</span><br><span class="muted">${esc(x.d)}</span></span><span>${esc(x.at)}${i === cur ? '<br><b>now</b>' : ''}</span></div>`; if (rite === 'roman') h += doSlot(st.date, x.n, true); if (rite === 'roman' && x.oor) h += `<details style="margin:0 0 8px"><summary class="muted" style="font-size:.82rem">Pray the Office of Readings for ${esc(fmtShort(st.date))}</summary>${oorHTML(st.date)}</details>`; else if (rite === 'roman' && /^(lauds|vespers)$/.test(x.hour || '') && window.Hours && Hours.modern) h += `<details style="margin:0 0 8px"><summary class="muted" style="font-size:.82rem">Pray ${esc(x.n)} for ${esc(fmtShort(st.date))}</summary>${Hours.modern(L, P(st.date), x.hour === 'lauds' ? 'L' : 'V')}</details>`; else if (rite === 'sarum' && x.w === 'M' && window.Hours && Hours.sarumMatins) h += `<details class="matins-d" style="margin:0 0 8px"><summary class="muted" style="font-size:.82rem">Pray Matins for ${esc(fmtShort(st.date))}</summary><div class="matins-slot" data-d="${esc(st.date)}"><p class="muted" style="font-size:.8rem">Loading Matins… (the first time, Ora downloads the Matins texts, about 3.6 MB; after that they work offline).</p></div></details>`; else if (rite === 'sarum' && x.w && window.Hours && Hours.sarum) h += `<details style="margin:0 0 8px"><summary class="muted" style="font-size:.82rem">Pray ${esc(x.n)} for ${esc(fmtShort(st.date))}</summary>${Hours.sarum(L, P(st.date), x.w, window.Sarum) || ''}</details>`; });
    if (rite === 'sarum' && window.Hours && Hours.sarumBVM) h += `<details style="margin:10px 0 8px"><summary><b>The Commemoration of Our Lady</b> <span class="muted" style="font-size:.8rem">· a short office of Mary, said on free days, chiefly Saturdays</span></summary>${[['L', 'Lauds'], ['P', 'Prime'], ['T', 'Terce'], ['S', 'Sext'], ['N', 'None'], ['V', 'Vespers'], ['C', 'Compline']].map(([w, n]) => `<details style="margin:4px 0 4px 10px"><summary class="muted" style="font-size:.82rem">${n}</summary>${Hours.sarumBVM(L, P(st.date), w, window.Sarum) || ''}</details>`).join('')}</details>`;
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
  /* ---------- Divine Office recordings (DivineOffice.org podcast). office_audio.json holds only the links,
     refreshed twice a day by tools/fetch_divineoffice.py; the audio streams from Divine Office's own podcast host. ---------- */
  let doAudio = null;
  const doP = fetch('office_audio.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null)
    .then(j => { const ok = j && Object.keys(j).length; doAudio = ok ? j : (store.get('ora.doaudio', {}) || {}); if (ok) store.set('ora.doaudio', j); hydrateDo(); });   // an empty list never replaces the last good one
  const doSlot = (iso, name, quiet) => name ? `<div class="doaud"${quiet ? ' data-q="1"' : ''} data-iso="${esc(iso)}" data-k="${esc(String(name).replace(/[^A-Za-z]/g, ''))}"></div>` : '';
  function hydrateDo() {
    if (!doAudio) return;
    document.querySelectorAll('.doaud:not([data-done])').forEach(el => {
      el.dataset.done = '1';
      const day = doAudio[el.dataset.iso] || {}, kk = Object.keys(day).find(k => k.toLowerCase() === el.dataset.k.toLowerCase()), x = kk && day[kk];
      if (!x) { if (el.dataset.q) return; el.innerHTML = `<p class="muted" style="font-size:.74rem;margin:2px 0 6px">No Divine Office recording for this day yet (they are posted the evening before).</p>`; return; }
      el.innerHTML = `<div style="margin:4px 0 2px"><audio controls preload="none" src="${esc(x.u)}" style="width:100%;height:38px"></audio></div><p class="muted" style="font-size:.72rem;margin:0 0 8px">Listen · ${esc(x.t)} · recording by <a href="https://divineoffice.org" target="_blank" rel="noopener">Divine Office</a></p>`;
    });
  }
  /* ---------- Office of Readings: full second-reading texts (oortext.json, public-domain translations), loaded when first opened ---------- */
  let oortxP = null;
  const loadOorText = () => oortxP || (oortxP = fetch('oortext.json').then(r => { if (!r.ok) throw new Error('x'); return r.json(); }).catch(e => { oortxP = null; throw e; }));
  document.addEventListener('toggle', ev => {
    const det = ev.target; if (!det || !det.classList || !det.classList.contains('oortx') || !det.open) return;
    const slot = det.querySelector('.oortx-slot'); if (!slot || slot.dataset.done) return;
    loadOorText().then(d => {
      const x = d[slot.dataset.k]; slot.dataset.done = '1';
      if (!x) {
        const [author,work] = slot.dataset.k.split('|');
        const martin = /Sulpicius Severus/i.test(author) && /^Letter 3$/i.test(work);
        const url = martin ? 'https://en.wikisource.org/wiki/Nicene_and_Post-Nicene_Fathers:_Series_II/Volume_XI/Sulpitius_Severus/Letters/Letter_III' : 'https://www.ccel.org/fathers';
        slot.innerHTML = '<p class="muted" style="font-size:.88rem;line-height:1.55">A verified public-domain translation of this appointed excerpt has not yet been bundled. The reference above is preserved; no substitute text is shown.</p><p><a target="_blank" rel="noopener noreferrer" href="'+url+'">'+(martin ? 'Read public-domain Letter III (1894 translation)' : 'Browse public-domain Church Fathers translations')+'</a></p>';
        return;
      }
      slot.innerHTML = x.p.map(p => `<p style="font-family:var(--serif);font-size:1.1rem;line-height:1.7;margin:.65em 0">${esc(p).replace(/\[(\d+(?::\d+)?)\]/g, '<sup class="muted">$1</sup>')}</p>`).join('') + `<p class="muted" style="font-size:.74rem">${esc(x.src)}</p>`;
    }).catch(() => { slot.innerHTML = '<p class="muted" style="font-size:.8rem">The text could not be loaded. Ora needs to be online the first time you open it.</p>'; });
  }, true);
  /* ---------- Sarum Matins: the texts (matins.json) are loaded the first time Matins is opened ---------- */
  let matinsP = null;
  function loadMatins() {
    if (!matinsP) matinsP = fetch('matins.json').then(r => { if (!r.ok) throw new Error('http ' + r.status); return r.json(); }).then(d => { Hours.setMatins(d); return d; }).catch(e => { matinsP = null; throw e; });
    return matinsP;
  }
  document.addEventListener('toggle', ev => {
    const det = ev.target; if (!det || !det.classList || !det.classList.contains('matins-d') || !det.open) return;
    const slot = det.querySelector('.matins-slot'); if (!slot || slot.dataset.done) return;
    loadMatins().then(() => { slot.dataset.done = '1'; slot.innerHTML = Hours.sarumMatins(L, P(slot.dataset.d), window.Sarum); hydrateAsv(); })
      .catch(() => { slot.innerHTML = '<p class="muted" style="font-size:.8rem">Matins could not be loaded. Ora needs to be online the first time you open Matins; please try again when you have a connection.</p>'; });
  }, true);
  new MutationObserver(() => { hydrateAsv(); hydrateDo(); document.querySelectorAll('.office-readings-text details.oortx[open]:not([data-requested])').forEach(el => { el.dataset.requested='1'; el.dispatchEvent(new Event('toggle', {bubbles:true})); }); }).observe(document.getElementById('app'), { childList: true, subtree: true });

  function renderHeader() {
    $('#hdr').innerHTML = `<button class="ib" data-act="prev" aria-label="Previous day">‹</button><button class="date" data-act="datepick" style="flex:1;text-align:center"><b>${esc(fmtShort(st.date))}</b><span class="muted" style="font-size:.74rem">${st.date === todayISO() ? 'Today' : 'Tap to choose date'}</span></button><input type="date" id="dp" aria-label="Choose date" min="1000-01-01" value="${st.date}"><button class="ib" data-act="next" aria-label="Next day">›</button>`;
  }
  function setLitColour() {
    try {
      const v = dayInfo(st.date);
      // Use the same calendar and observanceColor() as each tradition's Today card.
      // Reading and liturgy selections take precedence over the primary prayer rite.
      const rite = st.tab === 'readings' ? st.readRite
        : st.tab === 'liturgy' ? (st.liturgyView === 'byz' ? 'byz' : 'roman')
        : S.rite;
      const r = rite === 'sarum' ? v.sarum : rite === 'byz' ? v.byz : v.roman;
      const c = observanceColor(r, rite);
      document.documentElement.style.setProperty('--lit', c === 'w' ? 'var(--lit-white)' : col(c));
    } catch (e) { /* keep the default */ }
  }
  let renderedView = '';
  const detailKey = d => [d.closest('.step')?.id || '', d.className, d.querySelector(':scope > summary')?.textContent || '', d.dataset.cite || '', d.dataset.d || ''].join('|');
  function tabHeading() {
    const titles = {today:'Today', pray:'Divine Office', readings:'Daily Mass Readings', liturgy:'Sacred Liturgy', justice:'Catholic Social Teaching', more:'More', calendar:'Calendar'};
    return `<section class="tab-heading"><h1>${titles[st.tab]}</h1></section>`;
  }
  function render() {
    const view = JSON.stringify([st.tab, st.date, S.rite, st.kind, st.shour, st.readRite, st.jtab]);
    const opened = new Map(view === renderedView ? [...document.querySelectorAll('#app details')].map(d => [detailKey(d), d.open]) : []);
    const active = document.activeElement;
    const activeDetail = active && active.matches('summary') ? detailKey(active.parentElement) : '';
    const focusSelector = active && active.matches('[data-act]') ? '[data-act="' + CSS.escape(active.dataset.act) + '"]' + ['v', 'd', 'i'].filter(k => active.dataset[k] != null).map(k => '[data-' + k + '="' + CSS.escape(active.dataset[k]) + '"]').join('') : '';
    setLitColour();
    renderHeader();
    document.querySelectorAll('#nav button').forEach(b => { b.classList.toggle('on', b.dataset.tab === st.tab); if (b.dataset.tab === st.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    const content = st.tab === 'today' ? viewToday() : st.tab === 'pray' ? viewPray() : st.tab === 'readings' ? viewReadings() : st.tab === 'liturgy' ? viewLiturgy() : st.tab === 'calendar' ? viewCalendar() : st.tab === 'justice' ? viewJustice() : viewMore();
    $('#app').innerHTML = tabHeading() + content;
    if (st.tab === 'liturgy') LiturgicalText.hydrate();
    document.querySelectorAll('.seg button[data-act], .legend button[data-act]').forEach(b => b.setAttribute('aria-pressed', b.classList.contains('on')));
    document.querySelectorAll('#app details').forEach(d => { const key = detailKey(d); if (opened.has(key)) d.open = opened.get(key); if (key === activeDetail && !active.isConnected) d.querySelector(':scope > summary')?.focus({ preventScroll: true }); });
    if (focusSelector && !active.isConnected) { const target = document.querySelector(focusSelector); if (target) target.focus({ preventScroll: true }); }
    renderedView = view;
    store.set('ora.navigation', { tab: st.tab, readRite: st.readRite, liturgyView: st.liturgyView });
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
    const steps = stepsFor(S.rite, kindOf(S.rite), dayInfo(st.date));
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
    d.innerHTML = `<h3 id="settings-title">Settings</h3>
      ${sel('s_rite', 'Primary rite (prayer, quotes, hours)', Object.entries(RITES), S.rite)}
      ${sel('s_reading', 'Prayer and Scripture text size', [['compact', 'Compact'], ['comfortable', 'Comfortable'], ['large', 'Large']], S.readingSize)}
      ${sel('s_asc', 'Roman: Ascension', [['thursday', 'Thursday (universal)'], ['sunday', 'Sunday (most US provinces)']], S.ascension)}
      ${sel('s_corp', 'Roman: Corpus Christi', [['thursday', 'Thursday (universal)'], ['sunday', 'Sunday']], S.corpus)}
      ${sel('s_epi', 'Roman: Epiphany', [['jan6', 'January 6 (universal)'], ['sunday', 'Sunday (USA)']], S.epiphany)}
      <p class="muted">Byzantine calendar and Divine Liturgy: Ruthenian Byzantine Catholic tradition of Pittsburgh.</p>
      <div class="check"><input type="checkbox" id="s_lady" ${S.ladyDayTransfer ? 'checked' : ''}><label for="s_lady" style="margin:0;color:var(--ink)">Traditional calendar: move Lady Day out of Holy Week/Easter Octave</label></div>
      ${hasTTS ? `${sel('s_voice', 'Voice', [['', 'Automatic'], ...vs.map(v => [v.voiceURI, v.name + ' (' + v.lang + ')'])], S.voice)}<label for="s_rate">Speech speed: <span id="s_rv">${S.rate}</span></label><input type="range" id="s_rate" min="0.6" max="1.3" step="0.05" value="${S.rate}">` : ''}
      <div class="row" style="margin-top:14px"><button class="btn fill" data-act="savesettings">Save</button><button class="btn" data-act="closedlg">Cancel</button></div>`;
    d.showModal();
    const r = $('#s_rate', d); if (r) r.oninput = () => $('#s_rv', d).textContent = r.value;
  }
  function saveSettings() {
    const g = id => { const e = $('#' + id); return e ? e.value : null; };
    Object.assign(S, { rite: g('s_rite'), ascension: g('s_asc'), corpus: g('s_corp'), epiphany: g('s_epi'), byzChurch: 'ruthenian', byzLiturgyChurch: 'ruthenian', byzAnna: 'default', readingSize: g('s_reading'), byzPascha: 'gregorian', byzOldCal: false, ladyDayTransfer: $('#s_lady').checked });
    if ($('#s_voice')) { S.voice = g('s_voice'); S.rate = +g('s_rate'); }
    applyReadingSize(); save(); infoCache.clear(); $('#dlg').close(); render();
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
      case 'jtab': st.jtab = v; break;
      case 'rite': if (!Object.hasOwn(RITES, v)) return; S.rite = v; st.readRite = v; save(); break;
      case 'kind': st.kind = v; break;
      case 'prayview': st.prayView = v === 'mass' ? 'mass' : 'office'; break;
      case 'liturgyview': st.liturgyView = v === 'byz' ? 'byz' : 'mass'; break;
      case 'shour': st.shour = v; break;
      case 'goPray': st.kind = b.dataset.k; st.tab = 'pray'; window.scrollTo(0, 0); break;
      case 'qnext': st.quoteShift++; break;
      case 'pnext': st.popeShift++; break;
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
  document.addEventListener('keydown', e => { const el = e.target.closest('.glance .gl[role="button"]'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); el.click(); } });
  document.addEventListener('change', e => { if (e.target.id === 'dp' && e.target.value) { st.date = e.target.value; st.month = null; render(); } });
  if (hasTTS) speechSynthesis.onvoiceschanged = () => { };

  /* If Ora was left open on today's date, move it to the new day when it is reopened after midnight. */
  let shownToday = todayISO();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const t = todayISO();
    if (t !== shownToday) { if (st.date === shownToday) { st.date = t; st.month = null; render(); } shownToday = t; }
  });
  // Check the published build, not the GitHub commit: Pages can lag behind.
  // A visible notice avoids interrupting someone halfway through a prayer.
  const APP_BUILD = 'ora-v149';
  let updateShown = false;
  async function checkForPublishedUpdate() {
    if (document.visibilityState !== 'visible' || updateShown) return;
    try {
      const response = await fetch('sw.js?update-check=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) return;
      const match = (await response.text()).match(/const V = ['"](ora-v\\d+)['"]/);
      if (!match || match[1] === APP_BUILD) return;
      updateShown = true;
      const notice = document.createElement('div');
      notice.setAttribute('role', 'status');
      notice.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(86px + env(safe-area-inset-bottom, 0px));z-index:1000;background:var(--card);color:var(--ink);border:1px solid var(--lit);border-radius:12px;padding:12px 14px;box-shadow:0 4px 22px #0007;display:flex;align-items:center;justify-content:space-between;gap:12px';
      notice.innerHTML = '<span>New Ora update available</span><button type="button" class="btn fill">Update now</button>';
      notice.querySelector('button').addEventListener('click', async () => {
        store.set('ora.navigation', { tab: st.tab, readRite: st.readRite, liturgyView: st.liturgyView });
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) await reg.update();
        } catch (_) { /* reload can still fetch online */ }
        location.reload();
      });
      document.body.appendChild(notice);
    } catch (_) { /* offline */ }
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkForPublishedUpdate(); });
  setInterval(checkForPublishedUpdate, 60000);
  setTimeout(checkForPublishedUpdate, 12000);
  render();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => { });
})();

