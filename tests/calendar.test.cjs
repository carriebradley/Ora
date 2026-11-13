const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const L = require('../calendar.js');
const S = require('../sarum.js');
const B = require('../byzlect.js');
const date = s => new Date(s + 'T00:00:00Z');
const sarum = s => S.sarum(date(s));
const byz = (s, church = 'ukrainian') => L.byzantine(date(s), { byzChurch: church });

test('St Martin’s observance covers every date, including Sundays, feasts and Christmas Eve', () => {
  for (const y of [2026, 2027, 2028]) {
    assert.equal(sarum(`${y}-11-10`).historicalObservance, null);
    assert.equal(sarum(`${y}-12-25`).historicalObservance, null);
    for (let d = L.D(y, 11, 11); d < L.D(y, 12, 25); d = L.add(d, 1)) {
      const r = S.sarum(d);
      assert.equal(r.historicalObservance.name, "St. Martin's Lent");
      if (d.getUTCDay() === 0) { assert.equal(r.fast, ''); assert.match(r.historicalObservance.day, /Sunday/); }
      if (![0, 1, 3, 5].includes(d.getUTCDay())) assert.doesNotMatch(r.fast, /historical Monday/);
      if ([1, 3, 5].includes(d.getUTCDay()) && d.getUTCDate() !== 11) assert.ok(r.fast, L.iso(d));
      assert.ok(r.kept.some(x => /winter "Lent"/.test(x.text)), L.iso(d));
    }
  }
  assert.match(sarum('2026-11-13').historicalObservance.day, /Feast/);
  assert.match(sarum('2026-12-24').fast, /Strict/);
  assert.equal(sarum('2028-12-24').fast, '');
  assert.match(sarum('2028-12-23').fast, /anticipated/);
});

test('Byzantine Sunday tones agree with 50 published MCI 2026 dates', () => {
  const fixture = require('./byzantine-tones-2026.json');
  for (const [d, tone] of Object.entries(fixture.tones)) assert.equal(byz(d).tone, tone, d);
});

test('Roman solemnities on Fridays of Lent do not retain ordinary abstinence', () => {
  const joseph = L.roman(date('2027-03-19'));
  assert.match(joseph.title, /Joseph/);
  assert.equal(joseph.fast, '');
  assert.ok(L.roman(date('2027-03-12')).fast);
  assert.ok(L.roman(date('2027-03-26')).fast);
});

test('Byzantine movable feasts, Soul Saturdays and fasting boundaries', () => {
  assert.match(byz('2026-02-16').fast, /Strict abstinence/);
  assert.equal(byz('2026-02-18').fast, '');
  assert.match(byz('2026-02-18', 'ruthenian').fast, /Abstinence from meat/);
  assert.equal(byz('2026-02-22').fast, '');
  assert.equal(byz('2026-02-22').fastSeason, 'Great Fast');
  assert.equal(byz('2026-01-30').fast, ''); // Publican and Pharisee fast-free week
  assert.equal(byz('2026-04-10').fast, ''); // Bright Friday
  assert.equal(byz('2026-05-29').fast, ''); // Pentecost week
  assert.match(byz('2026-04-03').fast, /Strict abstinence/);
  assert.match(byz('2026-04-05').title, /Pascha/);
  assert.match(byz('2026-05-14').title, /Ascension/);
  assert.match(byz('2026-05-24').title, /Pentecost/);
  assert.equal(byz('2026-06-01').fastSeason, 'Apostles’ Fast');
  assert.equal(byz('2026-06-29').fastSeason, '');
  for (const d of ['2026-02-07', '2026-02-28', '2026-03-07', '2026-03-14', '2026-05-23']) assert.ok([byz(d).title, ...byz(d).also.map(x => x.title)].some(x => /Saturday of the Dead/.test(x)), d);
  for (const d of ['2026-01-05', '2026-08-29', '2026-09-14', '2026-12-24']) assert.match(byz(d).fast, /Fast and abstinence/, d);
  assert.match(byz('2026-03-28').title, /Lazarus/);
  assert.equal(byz('2026-03-28').fast, '');
  assert.match(byz('2026-01-25').season, /preparation/);
  assert.match(byz('2026-07-19').title, /First Six/);
  assert.match(byz('2026-10-11').title, /Seventh/);
});

test('Ukrainian and Ruthenian St Anna dates stay aligned with the readings', () => {
  for (const [church, d] of [['ukrainian', '2026-12-09'], ['ruthenian', '2026-12-08']]) {
    assert.match(byz(d, church).title, /Conception/);
    assert.ok(B.read(date(d), 0, L.westernEaster, church).sets.some(s => s.r.some(([,c]) => c === 'Galatians 4:22-31')));
  }
  assert.doesNotMatch(byz('2026-12-09', 'ruthenian').title, /Conception/);
  const allTitles = r => [r.title, ...r.also.map(a => a.title)].join(' ');
  assert.match(allTitles(byz('2027-12-24')), /Royal Hours/);
  assert.doesNotMatch(allTitles(byz('2027-12-25')), /Royal Hours/);
  assert.match(allTitles(byz('2027-01-01')), /Sunday after the Nativity|Circumcision/);
  assert.match(allTitles(byz('2023-12-22')), /Royal Hours/);
  assert.doesNotMatch(allTitles(byz('2023-12-24')), /Royal Hours/);
});

test('All 63 original Office readings remain unchanged; Polycarp is connected', () => {
  const texts = JSON.parse(fs.readFileSync(require.resolve('../oortext.json'), 'utf8'));
  const hashes = require('./completed-readings.sha256.json');
  assert.equal(Object.keys(hashes).length, 63);
  assert.equal(Object.keys(texts).length, 64);
  for (const [k, expected] of Object.entries(hashes)) {
    const sorted = Object.fromEntries(Object.entries(texts[k]).sort(([a], [b]) => a.localeCompare(b)));
    assert.equal(crypto.createHash('sha256').update(JSON.stringify(sorted)).digest('hex'), expected, k);
  }
  const context = { self: {} }; vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../oor.js'), 'utf8'), context);
  for (const entry of [...Object.values(context.self.OOR), ...Object.values(context.self.OOR_SAINTS).flat()]) {
    if (entry.t) assert.ok(texts[entry.a + '|' + entry.w], entry.a + '|' + entry.w);
  }
  const polycarp = context.self.OOR_SAINTS['2/23'][0];
  assert.equal(polycarp.t, 1);
  assert.match(texts[polycarp.a + '|' + polycarp.w].p[0], /^\[13:2\]/);
  assert.match(texts[polycarp.a + '|' + polycarp.w].p.at(-1), /costly spices/);
});

test('Three calendar engines return valid days for every date in 2026–2027', () => {
  for (let d = L.D(2026, 1, 1); d < L.D(2028, 1, 1); d = L.add(d, 1)) {
    for (const read of [L.roman, L.byzantine, S.sarum]) {
      const r = read(d);
      assert.ok(r.title && !r.title.includes('undefined'), L.iso(d));
      assert.equal(r.date, L.iso(d));
    }
  }
});

const ContentFlows=require('../content.js').FLOWS;
test('Roman Lauds and Vespers do not append duplicate canticles or devotions',()=>{
 for(const [hour,code] of [['morning','L'],['evening','V']]){
  assert.deepEqual(ContentFlows.roman[hour].map(step=>step.type),['office']);
  assert.equal(ContentFlows.roman[hour][0].which,code);
 }
 assert.equal(ContentFlows.roman.night.some(step=>step.type==='office'&&step.which==='C'),true);
});
