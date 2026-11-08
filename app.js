/* Ora — app logic. Three calendars (Roman, Byzantine/Ukrainian, Sarum), daily readings, prayer flows, art, saints, audio. */
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
  const COLORS = { w: '#f4efe0', r: '#a8232a', g: '#3d7a4a', v: '#6a3f9a', rose: '#d9899e', k: '#1c1c1c', gold: '#c9a227' };
  const col = c => COLORS[c] || COLORS.g;
  const MAJOR = /Solemnity|Principal|Great Feast|Triduum|Holy Week|Class I$/;
  const RITES = { roman: 'Roman (modern)', byz: 'Ukrainian / Ruthenian', sarum: 'Sarum (traditional)' };

  /* ---------- settings & state ---------- */
  const S = Object.assign({}, L.DEFAULTS, { ladyDayTransfer: true, rite: 'roman', rate: 0.95, voice: '' }, store.get('ora.settings', {}));
  const save = () => store.set('ora.settings', S);
  const st = { tab: 'today', date: todayISO(), month: null, sel: null, layers: { roman: true, byz: true, sarum: true }, readRite: S.rite === 'byz' ? 'byz' : 'roman',
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
  function byzReadingsHTML(v) {
    const t = v.byz;
    let h = `<p>${esc(t.title)}${t.tone ? ` · Tone ${t.tone}` : ''}</p>`;
    h += `<div class="row"><a class="btn fill" target="_blank" rel="noopener" href="https://www.oca.org/readings/daily/${ocaDate(v.iso)}">Epistle &amp; Gospel · OCA</a><a class="btn" target="_blank" rel="noopener" href="https://www.stamforddio.org/liturgical-propers">Daily propers · Stamford</a><a class="btn" target="_blank" rel="noopener" href="https://mci.archpitt.org/liturgy/Apostol.html">Apostol</a><a class="btn" target="_blank" rel="noopener" href="https://byzantinecatholicdailyreadings.substack.com">Daily readings</a><a class="btn" target="_blank" rel="noopener" href="https://ecpubs.gumroad.com/l/jTBr">ECPubs Daily Office</a></div>`;
    h += '<p class="muted">The Byzantine Epistle and Gospel follow the Pascha-based cycle (and the Lukan jump after September 14). The OCA button opens the same Pascha-based cycle, date-shifted to match your Pascha through Pentecost season (saints’ readings on that page may belong to the shifted date). After Pentecost, check the Stamford propers or your Ruthenian/Ukrainian lectionary.</p>';
    return h;
  }

  /* ---------- art (live from Wikipedia, cached) ---------- */
  function loadArt(a) {
    const k = 'ora.art.' + a.q; if (st.art[a.q] !== undefined) return;
    const c = store.get(k, null); if (c) { st.art[a.q] = c; return; }
    st.art[a.q] = 'loading';
    const u = 'https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent(a.q) + '&gsrlimit=1&prop=pageimages|info&piprop=thumbnail&pithumbsize=1100&inprop=url&format=json&origin=*';
    fetch(u).then(r => r.json()).then(j => {
      const p = j.query && Object.values(j.query.pages)[0];
      const out = p ? { img: p.thumbnail && p.thumbnail.source, url: p.fullurl } : null;
      st.art[a.q] = out; if (out) store.set(k, out); render();
    }).catch(() => { st.art[a.q] = null; render(); });
  }
  function artHTML(a, big) {
    loadArt(a); const m = st.art[a.q];
    let h = '<div class="art">';
    h += m && m.img ? `<img src="${esc(m.img)}" alt="${esc(a.t)}" loading="lazy">` : `<div class="ph">${m === 'loading' ? 'Loading image…' : 'Image unavailable offline'}</div>`;
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
    return `<section class="card"><div class="lab"><span class="sw" style="--c:${col(r.color)}"></span><span class="grow">Ukrainian / Ruthenian</span>${speakBtn(spokenCard(r))}</div>
      <h2>${esc(r.title)}</h2><div class="chips">${chipsFor(r)}${r.tone ? chip('Tone ' + r.tone) : ''}${r.fast ? chip(r.fast, 'fast') : ''}</div>
      ${alsoHTML(r.also)}${ev.length ? `<ul class="also">${ev.map(e => `<li>${esc(e.n)} <i>— your UGCC calendar</i></li>`).join('')}</ul>` : ''}
      <p class="muted">Pascha ${fmtLong(r.pascha)} (${S.byzPascha === 'julian' ? 'Julian reckoning' : 'Gregorian reckoning'})</p></section>`;
  }
  function cardSarum(v) {
    const r = v.sarum;
    return `<section class="card"><div class="lab"><span class="sw" style="--c:${col(r.color)}"></span><span class="grow">Sarum · traditional</span>${speakBtn(spokenCard(r, r.notes))}</div>
      <h2>${esc(r.title)}</h2><div class="chips">${chipsFor(r)}${r.fast ? chip(r.fast, 'fast') : ''}</div>
      ${r.notes ? `<p class="muted">${esc(r.notes)}</p>` : ''}${alsoHTML(r.also)}</section>`;
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
  function viewToday() {
    const v = dayInfo(st.date); loadReadings(st.date);
    const q = quoteFor(v, S.rite), a = artFor(v, S.rite);
    let h = glanceHTML(v) + cardRoman(v) + cardByz(v) + cardSarum(v);
    h += `<section class="card"><div class="lab"><span class="grow">Readings of the day</span></div>
      <div class="seg" style="margin-top:8px"><button data-act="rr" data-v="roman" class="${st.readRite === 'roman' ? 'on' : ''}">Roman</button><button data-act="rr" data-v="byz" class="${st.readRite === 'byz' ? 'on' : ''}">Byzantine</button></div>
      ${st.readRite === 'roman' ? romanReadingsHTML(st.date) : byzReadingsHTML(v)}</section>`;
    h += `<section class="card"><div class="lab"><span class="grow">From the saints</span></div><div class="quote">“${esc(q.t)}”<small>${esc(q.s)} · ${esc(q.w)} · ${q.tr === 'East' ? 'Eastern' : 'Western'} Father/Saint</small></div>
      <div class="row">${speakBtn(`${q.t} — ${q.s}, ${q.w}`)}<button class="btn sm" data-act="qnext">Another</button></div></section>`;
    h += `<section class="card"><div class="lab"><span class="grow">Sacred art</span></div>${artHTML(a)}</section>`;
    h += `<div class="row" style="justify-content:center"><button class="btn fill" data-act="goPray" data-k="morning">Morning prayer</button><button class="btn fill" data-act="goPray" data-k="evening">Evening prayer</button></div>`;
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
        if (rite === 'byz') x.text = 'The Epistle and Gospel of the day. Open the daily propers to read them.';
        else { const rd = st.readings[v.iso]; x.text = rd && rd !== 'loading' ? readingsSpeech(rd) : 'The Mass readings of the day. Open the readings to read or listen.'; }
      }
      if (s.type === 'silence') x.text = `${s.title}. ${s.text || 'Be still.'}`;
      if (s.type === 'hourlink') x.text = `${s.title}. Open the full office to pray the psalms.`;
      if (s.type === 'prayer') { x.body = s.text; x.text = `${s.title}. ${s.text}`; }
      out.push(x);
    }
    return out;
  }
  const HOURLINKS = {
    roman: { lauds: ['Universalis', 'https://universalis.com/'], vespers: ['Universalis', 'https://universalis.com/'], daytime: ['Universalis', 'https://universalis.com/'], compline: ['Universalis', 'https://universalis.com/'], any: ['Divine Office (audio & text)', 'https://divineoffice.org/'] },
    byz: { orthros: ['Horologion · MCI', 'https://mci.archpitt.org/liturgy/Horologion.html'], vespers: ['Horologion · MCI', 'https://mci.archpitt.org/liturgy/Horologion.html'], hours: ['Horologion · MCI', 'https://mci.archpitt.org/liturgy/Horologion.html'], compline: ['Horologion · MCI', 'https://mci.archpitt.org/liturgy/Horologion.html'], midnight: ['Horologion · MCI', 'https://mci.archpitt.org/liturgy/Horologion.html'], any: ['Divine Praises', 'https://divinepraises.github.io/'] },
    sarum: { any: ['Divinum Officium (Roman, pre-reform texts)', 'https://www.divinumofficium.com/'] }
  };
  function linksHTML(rite, hour) {
    const m = HOURLINKS[rite], a = m[hour] || m.any, b = m.any;
    let h = `<a class="btn sm" target="_blank" rel="noopener" href="${a[1]}">${esc(a[0])}</a>`;
    if (b[1] !== a[1]) h += `<a class="btn sm" target="_blank" rel="noopener" href="${b[1]}">${esc(b[0])}</a>`;
    if (rite === 'byz') h += '<a class="btn sm" target="_blank" rel="noopener" href="https://www.stamforddio.org/liturgical-propers">Propers</a>';
    return h;
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
      else if (s.type === 'readings') h += (rite === 'byz' ? byzReadingsHTML(v) : romanReadingsHTML(st.date));
      else if (s.type === 'hourlink') h += `<div class="row">${linksHTML(rite, s.hour)}</div>`;
      else if (s.type === 'silence') h += `<div class="tx">${esc(s.text || 'Be still before God.')}</div><div class="timer" id="tm${i}">${Math.floor(s.seconds / 60)}:${pad(s.seconds % 60)}</div><button class="btn sm" data-act="timer" data-i="${i}" data-s="${s.seconds}">Start timer</button>`;
      h += '</div>';
    });
    return h;
  }

  function viewCalendar() {
    if (!st.month) { const d = P(st.date); st.month = { y: d.getUTCFullYear(), m: d.getUTCMonth() }; }
    const { y, m } = st.month, first = L.D(y, m + 1, 1), start = L.add(first, -first.getUTCDay()), today = todayISO();
    let h = `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><button class="ib" data-act="mprev">‹</button><h2 style="flex:1;text-align:center;margin:0">${L.MN[m]} ${y}</h2><button class="ib" data-act="mnext">›</button></div>
      <div class="legend">${['roman', 'byz', 'sarum'].map(k => `<button data-act="layer" data-v="${k}" class="${st.layers[k] ? 'on' : ''}">${k === 'roman' ? 'Roman' : k === 'byz' ? 'Ukrainian' : 'Sarum'}</button>`).join('')}</div><div class="grid">`;
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
      <p><b>Ukrainian / Ruthenian</b> — Byzantine cycle computed from Pascha (Gregorian or Julian reckoning), Menaion feasts on Gregorian dates by default, plus entries from your own UGCC calendar (2026–27).</p>
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
  function renderHeader() {
    $('#hdr').innerHTML = `<button class="ib" data-act="prev" aria-label="Previous day">‹</button><button class="date" data-act="datepick" style="flex:1;text-align:center"><b>${esc(fmtShort(st.date))}</b><span class="muted" style="font-size:.74rem">${st.date === todayISO() ? 'Today' : 'Tap to choose date'}</span></button><input type="date" id="dp" value="${st.date}"><button class="ib" data-act="next" aria-label="Next day">›</button><button class="ib" data-act="today" title="Today">⌂</button>`;
  }
  function render() {
    renderHeader();
    document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === st.tab));
    $('#app').innerHTML = st.tab === 'today' ? viewToday() : st.tab === 'pray' ? viewPray() : st.tab === 'calendar' ? viewCalendar() : viewMore();
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
