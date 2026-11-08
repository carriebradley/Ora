#!/usr/bin/env python3
"""Fetch the official USCCB daily-readings RSS feed and merge it into readings.json.

USCCB's permissions page allows displaying the daily readings from this feed on a website that
does not require users to give anything of value. The feed's copyright notice must be shown with
the text (the app does this). Run daily (see .github/workflows/readings.yml) — the feed only holds
~10 days, so readings.json accumulates history.

usage: python3 fetch_readings.py [--file sample.xml] [--out readings.json]
"""
import json, re, sys, os, urllib.request, urllib.error
import xml.etree.ElementTree as ET
from html.parser import HTMLParser

FEED = 'https://bible.usccb.org/readings.rss'
KEEP_DAYS = 800


class Sections(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.sections, self.mode, self.stop = [], None, False
        self.label, self.cite, self.buf, self.in_a = [], [], [], False

    def flush(self):
        if self.mode and (self.label or self.cite):
            text = ''.join(self.buf).replace('\xa0', ' ')
            lines = [re.sub(r'[ \t]+', ' ', l).strip() for l in text.split('\n')]
            text = re.sub(r'\n{3,}', '\n\n', '\n'.join(lines)).strip()
            self.sections.append({'label': ' '.join(''.join(self.label).split()),
                                  'cite': ' '.join(''.join(self.cite).replace('\xa0', ' ').split()), 'text': text})
        self.label, self.cite, self.buf = [], [], []

    def handle_starttag(self, tag, attrs):
        if self.stop: return
        if tag == 'h4': self.flush(); self.mode = 'h'
        elif tag == 'a' and self.mode == 'h': self.in_a = True
        elif tag == 'br' and self.mode == 'b': self.buf.append('\n')

    def handle_endtag(self, tag):
        if self.stop: return
        if tag == 'a': self.in_a = False
        elif tag == 'h4': self.mode = 'b'
        elif tag == 'p' and self.mode == 'b': self.buf.append('\n\n')

    def handle_data(self, data):
        if self.stop: return
        if data.strip().startswith('- - -') or 'Lectionary for Mass' in data:
            self.flush(); self.mode, self.stop = None, True; return
        if self.mode == 'h': (self.cite if self.in_a else self.label).append(data)
        elif self.mode == 'b': self.buf.append(data)

    def close(self):
        super().close(); self.flush()


def parse(xml_bytes):
    root = ET.fromstring(xml_bytes)
    ch = root.find('channel')
    copyright_ = (ch.findtext('copyright') or '').strip()
    out = {}
    for it in ch.findall('item'):
        link = (it.findtext('link') or '').strip()
        m = re.search(r'/(\d{2})(\d{2})(\d{2})\.cfm', link)
        if not m: continue
        date = f'20{m.group(3)}-{m.group(1)}-{m.group(2)}'
        p = Sections(); p.feed(it.findtext('description') or ''); p.close()
        out[date] = {'title': (it.findtext('title') or '').strip(), 'link': link, 'sections': p.sections}
    return out, copyright_


MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december']
PODCAST = 'https://bible.usccb.org/podcasts/audio'


def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'ora-personal-prayer-app/1.0 (personal use)'})
    return urllib.request.urlopen(req, timeout=30).read().decode('utf-8', 'replace')


def track_id(html):
    """The USCCB podcast page embeds a SoundCloud player; pull out the track id."""
    m = re.search(r'api\.soundcloud\.com(?:%2F|/)tracks(?:%2F|/)(\d+)', html)
    return m.group(1) if m else None


def podcast_slugs(index_html):
    """Map 'YYYY-MM-DD' -> page slug, from links on the podcast index page (handles feast-day suffixes)."""
    out = {}
    for slug in re.findall(r'/podcasts/audio/(daily-mass-reading-podcast-[a-z0-9-]+)', index_html):
        m = re.match(r'daily-mass-reading-podcast-([a-z]+)-(\d{1,2})-(\d{4})', slug)
        if m and m.group(1) in MONTHS:
            out.setdefault(f'{m.group(3)}-{MONTHS.index(m.group(1)) + 1:02d}-{int(m.group(2)):02d}', slug)
    return out


def add_audio(days, fetch=get):
    """Attach a SoundCloud track id (field 'audio') to each day that lacks one. Failures are skipped quietly."""
    try: slugs = podcast_slugs(fetch(PODCAST))
    except Exception: slugs = {}
    for date, rec in days.items():
        if rec.get('audio'): continue
        y, mo, d = date.split('-')
        guess = f'daily-mass-reading-podcast-{MONTHS[int(mo) - 1]}-{int(d)}-{y}'
        for slug in dict.fromkeys([slugs.get(date), guess]):
            if not slug: continue
            try:
                t = track_id(fetch(f'{PODCAST}/{slug}'))
                if t: rec['audio'] = t; break
            except Exception: pass


def main():
    a = sys.argv[1:]
    out_path = a[a.index('--out') + 1] if '--out' in a else 'readings.json'
    if '--file' in a: data = open(a[a.index('--file') + 1], 'rb').read()
    else:
        req = urllib.request.Request(FEED, headers={'User-Agent': 'ora-personal-prayer-app/1.0 (personal use)'})
        data = urllib.request.urlopen(req, timeout=30).read()
    new, copyright_ = parse(data)
    old = json.load(open(out_path)) if os.path.exists(out_path) else {}
    for k, v in new.items():
        if old.get(k, {}).get('audio') and not v.get('audio'): v['audio'] = old[k]['audio']
    old.update(new)
    if '--no-audio' not in a: add_audio({k: v for k, v in old.items() if not k.startswith('_')})
    old['_copyright'] = copyright_ or old.get('_copyright', '')
    days = sorted(k for k in old if not k.startswith('_'))
    for k in days[:-KEEP_DAYS]: del old[k]
    json.dump(old, open(out_path, 'w'), ensure_ascii=False, separators=(',', ':'), sort_keys=True)
    print(f'{len(new)} days from feed; {len(days)} total in {out_path}')


if __name__ == '__main__': main()
