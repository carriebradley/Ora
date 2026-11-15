const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('Edmonton proper imports keep dated Ukrainian hymns separate from Scripture', () => {
  const source = path.join(__dirname, '..', 'ukrainian-propers.json');
  const data = JSON.parse(fs.readFileSync(source, 'utf8'));
  assert.equal(data.schema, 1);
  assert.ok(data.days && typeof data.days === 'object' && !Array.isArray(data.days));
  for (const [iso, day] of Object.entries(data.days)) {
    assert.match(iso, /^2026-\d{2}-\d{2}$/);
    assert.equal(day.church, 'ukrainian');
    assert.equal(day.source, 'https://eeparchy.com/calendar/' + iso);
    const names = Object.keys(day.groups || {});
    assert.ok(names.length > 0, 'at least one named prayer group: ' + iso);
    assert.ok(names.every(name => ['troparia','prokeimenon','alleluia','communion'].includes(name)));
    for (const name of names) {
      const lines = day.groups[name];
      assert.ok(Array.isArray(lines) && lines.length > 0);
      for (const text of lines) {
        assert.equal(typeof text, 'string');
        assert.ok(text.trim().length > 0);
        assert.ok(text.length <= 1200);
        assert.doesNotMatch(text, /[\u0400-\u052f]/u, 'English language only');
        assert.doesNotMatch(text, /^(?:Brothers and Sisters|At that time,|In those days,)\b/i);
      }
    }
  }
  const anchor = data.days['2026-11-15'];
  if (anchor) {
    assert.ok(anchor.groups.troparia?.length > 0);
    assert.ok(anchor.groups.prokeimenon?.length > 0);
    assert.ok(anchor.groups.alleluia?.length > 0);
    assert.ok(anchor.groups.communion?.length > 0);
  }
});
