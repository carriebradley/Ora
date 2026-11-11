#!/usr/bin/env python3
"""Collect the links to each day's Divine Office recordings (DivineOffice.org podcast feed)
into office_audio.json, so Ora can stream them in its Roman hours.

Only the episode links and titles are stored; the audio itself is streamed from
DivineOffice.org's own podcast host when someone presses play, as in any podcast app.
Run by .github/workflows/readings.yml. The feed is published the evening before, so the
workflow runs twice a day.

usage: python3 tools/fetch_divineoffice.py [--file sample.xml] [--out office_audio.json]
"""
import json, re, sys, os, datetime, urllib.request
import xml.etree.ElementTree as ET
from urllib.parse import urlparse, parse_qs

FEED = 'https://divineoffice.org/feed/podcast/'
KEEP_DAYS = 21
WANT = {'Invitatory', 'OfficeOfReadings', 'MorningPrayer', 'MidmorningPrayer', 'MiddayPrayer',
        'MidafternoonPrayer', 'EveningPrayer', 'NightPrayer'}


def norm(s):
    return re.sub(r'[^A-Za-z]', '', s or '')


def parse(xml_bytes):
    out = {}
    root = ET.fromstring(xml_bytes)
    for it in root.iter('item'):
        enc = it.find('enclosure')
        if enc is None or not enc.get('url'):
            continue
        url = enc.get('url')
        q = parse_qs(urlparse(url).query)
        prayer = norm((q.get('prayer') or [''])[0])
        date = (q.get('date') or [''])[0]
        title = (it.findtext('title') or '').strip()
        if not prayer:  # fall back to the title: "November 9th, 2026 – Morning Prayer – …"
            m = re.search(r'–\s*([^–]+?)\s*(?:–|$)', title)
            prayer = norm(m.group(1)) if m else ''
        if not (prayer in WANT or prayer.endswith('Prayer')) or not re.fullmatch(r'\d{8}', date):
            continue
        iso = f'{date[:4]}-{date[4:6]}-{date[6:]}'
        t = re.sub(r'\s*–\s*Divine Office: Liturgy of the Hours\s*$', '', title)
        t = re.sub(r'^[A-Z][a-z]+ \d{1,2}(st|nd|rd|th), \d{4}\s*–\s*', '', t)
        out.setdefault(iso, {})[prayer] = {'u': url, 't': t}
    return out


def main():
    args = sys.argv[1:]
    out = args[args.index('--out') + 1] if '--out' in args else os.path.join(os.path.dirname(__file__), '..', 'office_audio.json')
    if '--file' in args:
        data = open(args[args.index('--file') + 1], 'rb').read()
    else:
        req = urllib.request.Request(FEED, headers={'User-Agent': 'ora-personal-prayer-app/1.0 (personal use)'})
        data = urllib.request.urlopen(req, timeout=60).read()
    new = parse(data)
    try:
        old = json.load(open(out))
    except Exception:
        old = {}
    for d, v in new.items():
        old.setdefault(d, {}).update(v)
    cutoff = (datetime.date.today() - datetime.timedelta(days=KEEP_DAYS)).isoformat()
    old = {d: v for d, v in sorted(old.items()) if d >= cutoff}
    json.dump(old, open(out, 'w'), indent=0, ensure_ascii=False)
    print(f'{len(new)} days in feed, {len(old)} kept')


if __name__ == '__main__':
    main()
