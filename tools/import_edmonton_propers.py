#!/usr/bin/env python3
"""Import Edmonton's dated English Divine Liturgy propers, excluding Scripture prose.

The source is the Ukrainian Catholic Eparchy of Edmonton's date-specific
liturgical calendar. Do not mix these texts with Melkite editions. Only
previously verified Edmonton 2026 dates are candidates. Partial fetch failures
leave earlier verified records unchanged; they never produce invented hymns.

Usage:
  python tools/import_edmonton_propers.py --output ukrainian-propers.json
  python tools/import_edmonton_propers.py --start 2026-11-01 --end 2026-11-30
Requires beautifulsoup4 (also used by import_edmonton_calendar.py).
"""
import argparse
import concurrent.futures
import datetime as dt
import json
import re
from pathlib import Path

from bs4 import BeautifulSoup
from import_edmonton_calendar import BASE, clean, fetch

ROOT = Path(__file__).resolve().parents[1]
GROUPS = ('troparia', 'prokeimenon', 'alleluia', 'communion')
SCRIPTURE_HEADINGS = re.compile(r'^(?:Epistle|Gospel|Apostle)(?:\s*\([^)]*\))?$', re.I)
MAX_LINE = 1200
MAX_GROUP = 9500


def extract(html, iso):
    """Return only the appointed hymn/verse groups from Divine Liturgy HTML."""
    soup = BeautifulSoup(html, 'html.parser')
    article = soup.find('main') or soup
    services = article.select('.liturgical-day-service-body')
    if not services:
        raise ValueError('missing liturgical-day-service-body')
    groups = {name: [] for name in GROUPS}
    current = None
    for element in services[0].find_all(['p', 'h2', 'h3', 'h4', 'h5']):
        # Normalize a verified Cyrillic lookalike in one otherwise English word.
        text = clean(element.get_text(' ', strip=True)).replace('Тeach', 'Teach')
        if not text:
            continue
        if SCRIPTURE_HEADINGS.fullmatch(text):
            current = None
            continue
        if re.fullmatch(r'Troparia\s+(?:and|&)\s+Kontakia', text, re.I):
            current = 'troparia'
            continue
        if re.match(r'^Prokeimenon\b', text, re.I):
            current = 'prokeimenon'
        elif re.match(r'^Alleluia(?:\s*,|\s*$)', text, re.I):
            current = 'alleluia'
        elif re.fullmatch(r'Communion Hymn(?:s)?', text, re.I):
            current = 'communion'
            continue
        elif re.fullmatch(r'(?:Hours|Vespers|Matins|Divine Liturgy)', text, re.I):
            current = None
            continue
        if current is None:
            continue
        if len(text) > MAX_LINE:
            raise ValueError(f'{iso}: unexpected long {current} line')
        if re.match(r'^(?:Brothers and Sisters|At that time,|In those days,)\b', text, re.I):
            raise ValueError(f'{iso}: Scripture prose appeared among hymn lines')
        if text not in groups[current]:
            groups[current].append(text)
    if not groups['troparia'] and not groups['prokeimenon'] and not groups['communion']:
        raise ValueError(f'{iso}: no named hymn groups were found')
    if any(sum(map(len, lines)) > MAX_GROUP for lines in groups.values()):
        raise ValueError(f'{iso}: hymn group exceeded expected length')
    return {
        'source': f'{BASE}/calendar/{iso}',
        'church': 'ukrainian',
        'groups': {key: lines for key, lines in groups.items() if lines},
    }


def valid_source_dates(year=2026):
    """Dates already vetted by the Edmonton calendar importer."""
    path = ROOT / f'edmonton-{year}.js'
    source = path.read_text(encoding='utf-8')
    marker = 'function(){return '
    if marker not in source:
        raise ValueError('Edmonton data wrapper changed')
    raw = source.split(marker, 1)[1]
    data, _ = json.JSONDecoder().raw_decode(raw)
    return set(data['days'])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--start', help='Inclusive ISO date (default 28 days ago)')
    parser.add_argument('--end', help='Inclusive ISO date (default 45 days ahead)')
    parser.add_argument('--output', default='ukrainian-propers.json')
    parser.add_argument('--workers', type=int, default=3)
    args = parser.parse_args()
    today = dt.date.today()
    start = dt.date.fromisoformat(args.start) if args.start else today - dt.timedelta(days=28)
    end = dt.date.fromisoformat(args.end) if args.end else today + dt.timedelta(days=45)
    if end < start or (end-start).days > 120:
        raise ValueError('Import window must be between 0 and 120 days')
    supported = valid_source_dates(2026)
    candidates = sorted(iso for iso in supported if start.isoformat() <= iso <= end.isoformat())
    if not candidates:
        print('No verified Edmonton dates in the selected import window.')
        return
    out = ROOT / args.output
    previous = json.loads(out.read_text(encoding='utf-8')) if out.exists() else {'schema': 1, 'days': {}}
    if previous.get('schema') != 1 or not isinstance(previous.get('days'), dict):
        raise ValueError('Unknown previous proper-data format')
    days = dict(previous['days'])
    failures = []

    def retrieve(iso):
        try:
            soup, _headers = fetch(f'{BASE}/calendar/{iso}')
            entry = extract(str(soup), iso)
            return iso, entry, None
        except Exception as error:
            return iso, None, str(error)

    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, min(3, args.workers))) as pool:
        for iso, entry, error in pool.map(retrieve, candidates):
            if error:
                failures.append((iso, error))
            else:
                days[iso] = entry
    if len(failures) == len(candidates):
        raise ValueError('All dated proper imports failed; existing data preserved')
    if '2026-11-15' in candidates:
        anchor = days.get('2026-11-15', {}).get('groups', {})
        if not (anchor.get('troparia') and anchor.get('prokeimenon')
                and anchor.get('alleluia') and anchor.get('communion')):
            raise ValueError('November 15 source anchor incomplete; output not replaced')
    data = {'schema': 1, 'days': dict(sorted(days.items()))}
    if data != previous:
        out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({
        'candidate_dates': len(candidates),
        'updated_or_verified': len(candidates) - len(failures),
        'stored_dates': len(days),
        'failures': failures[:12],
        'changed': data != previous,
    }, ensure_ascii=False))


if __name__ == '__main__':
    main()
