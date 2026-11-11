"""Extract factual date cells from the user-supplied Newton 2026 calendar.
Usage: python3 tools/import_melkite_calendar.py source.pdf
Requires PyMuPDF. Never imports calendar artwork, reflections or prayer texts.
"""
import datetime, hashlib, json, re, sys
from pathlib import Path
import fitz
source = Path(sys.argv[1])
doc = fitz.open(source)
days = {}
for month in range(1, 13):
    page = doc[month + 1]
    spans = [s for b in page.get_text('dict')['blocks'] for l in b.get('lines', []) for s in l['spans']]
    numbers = [s for s in spans if s['size'] >= 20 and re.fullmatch(r'\d{1,2}', s['text'].strip())]
    rows = sorted(set(round(s['bbox'][1], 1) for s in numbers))
    for number in numbers:
        date = datetime.date(2026, month, int(number['text'].strip()))
        column = (date.weekday() + 1) % 7
        assert int(number['bbox'][0] / (864 / 7)) == column, date
        row = min(range(len(rows)), key=lambda i: abs(rows[i] - number['bbox'][1]))
        top, bottom = rows[row] - 2, rows[row + 1] - 2 if row + 1 < len(rows) else 1260
        cell = sorted([s for s in spans if s['size'] < 20 and column * 864 / 7 <= (s['bbox'][0] + s['bbox'][2]) / 2 < (column + 1) * 864 / 7 and top <= s['bbox'][1] < bottom], key=lambda s: (round(s['bbox'][1], 1), s['bbox'][0]))
        # Scripture uses a distinct light face/size; capture wrapped lines as well.
        references, primary, saints, tone = [], [], [], None
        for s in cell:
            t = s['text'].strip()
            if not t or t == '†': continue
            if t.startswith('TONE '):
                tone = int(t.split()[1]); continue
            if 'Light' in s['font'] and s['size'] > 7:
                if re.match(r'^(?:[123] )?[A-Z]{2,5} \d', t) and not (references and references[-1].endswith(';')):
                    references.append(t)
                else:
                    assert references, (date, t)
                    references[-1] += ' ' + t
            elif 'Medium' in s['font'] or 'Regular' in s['font'] or ('Bold' in s['font'] and s['size'] < 10): primary.append(t)
            elif s['size'] < 7: saints.append(t)
        assert references, date
        days[str(date)] = dict(page=month + 2, observance=' '.join(primary), saints=' '.join(saints), references=references, tone=tone)
assert len(days) == 365
result = dict(year=2026, source='Diocese of Newton, 2026 Diocesan Calendar', url='https://melkite.org/liturgical-resources', sha256=hashlib.sha256(source.read_bytes()).hexdigest(), days=days)
Path('melkite-2026.js').write_text('/* Generated factual calendar data; see tools/import_melkite_calendar.py. */\n(function(root){ const data = ' + json.dumps(result, ensure_ascii=False, indent=2) + '; if(typeof module === \'object\' && module.exports) module.exports=data; else root.MELKITE_2026=data; })(typeof self !== \'undefined\' ? self : this);\n')
