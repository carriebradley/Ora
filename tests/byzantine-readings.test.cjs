const {test} = require('node:test');
const assert = require('node:assert/strict');
const B = require('../byzlect.js');
const L = require('../calendar.js');
const read = (day, church = 'ukrainian', shift = 0) => B.read(new Date(day + 'T00:00:00Z'), shift, L.westernEaster, church);
const normalize = s => s.replace(/[ab](?=\b|[;,])/g, '').replace(/\s+/g, '').replace(/;/g, ',');
const rows = day => day.sets.flatMap(s => s.r);

test('Ukrainian cycle readings agree with 48 published Stamford 2026 propers', () => {
  const fixture = require('./stamford-readings-2026.json');
  assert.equal(fixture.cases.length, 48);
  for (const item of fixture.cases) {
    const day = read(item.date);
    for (const [label, key] of [['Epistle', 'epistle'], ['Gospel', 'gospel']]) {
      const match = rows(day).find(([kind]) => kind === label);
      assert.ok(match, item.date + ' ' + label);
      assert.equal(normalize(match[1]), normalize(item[key]), item.date + ' ' + label + ' (' + item.source + ')');
    }
  }
});

test('Corrected citations and Ruthenian verse boundaries match the MCI lectionary', () => {
  assert.equal(B.DATA.P[17].r.find(([l]) => l === 'Epistle')[1], 'Acts 8:18-25');
  assert.equal(B.DATA.P[28].r.find(([l]) => l === 'Gospel')[1], 'John 4:5-42');
  assert.equal(B.DATA.S[24].r.find(([l]) => l === 'Epistle')[1], 'Ephesians 2:14-22');
  assert.equal(B.DATA.F['12-6'].r.find(([l]) => l === 'Matins Gospel')[1], 'John 10:9-16');
  assert.ok(rows(read('2026-06-14', 'ruthenian')).some(([,c]) => c === 'Matthew 6:22-34'));
  assert.ok(rows(read('2026-06-14')).some(([,c]) => c === 'Matthew 6:22-33'));
  assert.ok(rows(read('2026-08-02')).some(([,c]) => c === 'Matthew 17:14-22'));
  assert.ok(rows(read('2026-08-02', 'ruthenian')).some(([,c]) => c === 'Matthew 17:14-23'));
});

test('Royal Hours are on Friday before weekend eves, with no ordinary Divine Liturgy', () => {
  for (const [hours, eve] of [['2023-12-22', '2023-12-24'], ['2022-12-23', '2022-12-24'], ['2024-01-05', '2024-01-05'], ['2025-01-03', '2025-01-05'], ['2030-01-04', '2030-01-05']]) {
    const day = read(hours);
    assert.equal(day.sets.filter(s => s.kind === 'hours').length, 1, hours);
    if (hours !== eve) {
      assert.ok(!day.sets.some(s => s.kind === 'move'), hours);
      const weekend = read(eve);
      assert.ok(!rows(weekend).some(([l]) => l.startsWith('Royal Hours')), eve);
      assert.ok(!rows(weekend).some(([l]) => l.startsWith('Vesperal Liturgy')), eve);
      assert.ok(rows(weekend).some(([l]) => l === 'Epistle'), eve);
    }
  }
  assert.ok(read('2025-01-17', 'ruthenian', 13).sets.some(s => s.kind === 'hours'));
  assert.equal(B.DATA.F['12-24'].r.filter(([l]) => l.startsWith('Royal Hours')).length, 4);
});

test('Annunciation during Holy Week retains the Passion readings', () => {
  const thursday = read('2027-03-25');
  assert.ok(thursday.sets.some(s => s.t === 'Annunciation'));
  assert.ok(thursday.sets.some(s => s.t.includes('Great and Holy Thursday')));
  assert.ok(rows(thursday).some(([,c]) => c === '1 Corinthians 11:23-32'));
  assert.ok(thursday.notes.some(n => /combined service order/.test(n)));
  const friday = read('2016-03-25');
  assert.ok(friday.sets.some(s => s.t.includes('Great and Holy Friday')));
});

test('January 1 uses Circumcision and Sunday before Theophany, not Sunday after Nativity', () => {
  const day = read('2023-01-01', 'ruthenian');
  assert.ok(day.sets.some(s => s.t.includes('Circumcision')));
  assert.ok(day.sets.some(s => s.t === 'Sunday before the Theophany'));
  assert.ok(!day.sets.some(s => s.t === 'Sunday after the Nativity'));
  const cal = L.byzantine(new Date('2023-01-01T00:00:00Z'), {byzChurch:'ruthenian'});
  assert.equal(cal.title, 'Sunday before Theophany');
});

test('The October Fathers commemoration follows each church’s documented Sunday window', () => {
  for (const [church, yes, no] of [['ruthenian','2027-10-10','2027-10-17'], ['ukrainian','2027-10-17','2027-10-10']]) {
    const cal = date => L.byzantine(new Date(date + 'T00:00:00Z'), {byzChurch:church});
    assert.match(cal(yes).title, /Seventh/);
    assert.doesNotMatch(cal(no).title, /Seventh/);
  }
  assert.ok(read('2027-10-10','ruthenian').sets.some(s => /Seventh/.test(s.t)));
  assert.ok(rows(read('2026-07-19','ruthenian')).some(([,c]) => c === 'John 17:1-13'));
  assert.equal(read('2026-07-19').sets[0].kind, 'move');
});

test('Calls for one church do not mutate the shared source table', () => {
  const before = JSON.stringify(B.DATA);
  for (const church of ['ukrainian','ruthenian']) for (const date of ['2026-08-02','2023-12-22','2023-12-24']) read(date, church);
  assert.equal(JSON.stringify(B.DATA), before);
  for (const group of Object.values(B.DATA)) for (const entry of Object.values(group)) for (const [,citation] of entry.r || []) {
    for (const match of citation.matchAll(/(\d+):(\d+)[ab]?-(?:(\d+):)?(\d+)/g)) {
      const [,ch,verse,endCh,endVerse] = match.map((v,i) => i ? Number(v || 0) : v);
      assert.ok((endCh || ch) > ch || ((endCh || ch) === ch && endVerse >= verse), citation);
      assert.ok(verse <= 176 && endVerse <= 176, citation);
    }
  }
});

test('Saint Anna’s parish date keeps the calendar and feast readings together', () => {
  for (const church of ['ukrainian','ruthenian']) for (const setting of ['default','8','9']) {
    const options = {byzChurch:church,byzAnna:setting}, selected = L.byzAnnaDay(options);
    for (const dd of [8,9]) {
      const date = new Date(`2026-12-0${dd}T00:00:00Z`);
      const calendar = L.byzantine(date, options);
      const readings = B.read(date, 0, L.westernEaster, church, selected);
      assert.equal(/Conception/.test(calendar.title), dd === selected);
      assert.equal(readings.sets.some(s => /Saint Anna/.test(s.t)), dd === selected);
      if (dd === selected) assert.deepEqual(readings.sets[0].r, [['Epistle','Galatians 4:22-31'],['Gospel','Luke 8:16-21']]);
    }
  }
});
