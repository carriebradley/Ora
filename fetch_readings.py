#!/usr/bin/env python3
"""Fetch the official USCCB daily-readings RSS feed and merge it into readings.json.

USCCB's permissions page allows displaying the daily readings from this feed on a website that
does not require users to give anything of value. The feed's copyright notice must be shown with
the text (the app does this). Run daily (see .github/workflows/readings.yml) — the feed only holds
~10 days, so readings.json accumulates history.

usage: python3 tools/fetch_readings.py [--file sample.xml] [--out readings.json]
"""
import json, re, sys, os, datetime, urllib.request, urllib.error
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


# ---------- Justice tab: daily ~5-minute readings from public-domain texts ----------
# Add more public-domain pages here: (author, work, url). Each page is split into ~850-word readings.
JUSTICE_SOURCES = [
    ('St. John Chrysostom', 'Four Discourses on the Rich Man and Lazarus, I', 'https://tertullian.org/fathers/chrysostom_four_discourses_01_discourse1.htm'),
    ('St. John Chrysostom', 'Four Discourses on the Rich Man and Lazarus, II', 'https://tertullian.org/fathers/chrysostom_four_discourses_02_discourse2.htm'),
    ('St. John Chrysostom', 'Four Discourses on the Rich Man and Lazarus, III', 'https://tertullian.org/fathers/chrysostom_four_discourses_03_discourse3.htm'),
    ('St. John Chrysostom', 'Four Discourses on the Rich Man and Lazarus, IV', 'https://tertullian.org/fathers/chrysostom_four_discourses_04_discourse4.htm'),
    ('Asterius of Amasea', 'Sermon 1: The Rich Man and Lazarus', 'https://tertullian.org/fathers/asterius_01_sermon1.htm'),
    ('Asterius of Amasea', 'Sermon 2: The Unjust Steward', 'https://tertullian.org/fathers/asterius_02_sermon2.htm'),
    ('Asterius of Amasea', 'Sermon 3: Against Covetousness', 'https://tertullian.org/fathers/asterius_03_sermon3.htm'),
    ('Philoxenus of Hierapolis', 'First Discourse on Poverty', 'https://tertullian.org/fathers/philoxenus_discourse08.htm'),
    ('Philoxenus of Hierapolis', 'Second Discourse on Poverty', 'https://tertullian.org/fathers/philoxenus_discourse09.htm'),
    ('The Didache', 'The Teaching of the Twelve Apostles', 'https://www.newadvent.org/fathers/0714.htm'),
    ('St. Clement of Alexandria', 'Who is the Rich Man that shall be Saved?', 'https://www.newadvent.org/fathers/0207.htm'),
    ('St. Cyprian of Carthage', 'On Works and Alms', 'https://www.newadvent.org/fathers/050708.htm'),
    ('St. John Chrysostom', 'Homily 50 on Matthew (honouring Christ in the poor)', 'https://www.newadvent.org/fathers/200150.htm'),
    ('St. John Chrysostom', 'Homily 66 on Matthew (on almsgiving)', 'https://www.newadvent.org/fathers/200166.htm'),
    ('Pope St. Leo the Great', 'Sermon 9: Upon the Collections, IV', 'https://www.newadvent.org/fathers/360309.htm'),
    ('Pope St. Leo the Great', 'Sermon 10: On the Collections, V', 'https://www.newadvent.org/fathers/360310.htm'),
]
CHUNK_WORDS = 850
SKIP = re.compile(r'previous page|next page|table of contents|public domain|roger pearse|^footnotes?$|^notes?$|tertullian\.org|new advent|newadvent|instant download|church fathers:|^\W*$', re.I)


class _Text(HTMLParser):
    BLOCK = {'p', 'br', 'div', 'h1', 'h2', 'h3', 'h4', 'li', 'tr', 'blockquote'}
    def __init__(self): super().__init__(convert_charrefs=True); self.out = []; self.skip = 0
    def handle_starttag(self, t, a):
        if t in ('script', 'style', 'head'): self.skip += 1
        if t in self.BLOCK: self.out.append('\n')
    def handle_endtag(self, t):
        if t in ('script', 'style', 'head'): self.skip = max(0, self.skip - 1)
        if t in self.BLOCK: self.out.append('\n')
    def handle_data(self, d):
        if not self.skip: self.out.append(d)


def trim_site(html, url=''):
    """Cut away the site furniture around the text (New Advent's donation notice above, its 'About this page' below)."""
    if 'newadvent.org' in url:
        i = html.find('Please help support the mission of New Advent')
        if i > 0:
            k = html.find('</div>', i)
            html = html[k if k > 0 else i:]
        j = html.find('About this page')
        if j > 0: html = html[:j]
    return html


def page_paragraphs(html, url=''):
    html = trim_site(html, url)
    p = _Text(); p.feed(html)
    raw = re.sub(r'\|\d+|\[p\. ?\d+\]', '', ''.join(p.out))      # page markers from the print edition
    lines = [re.sub(r'\s+', ' ', l).strip() for l in raw.split('\n')]
    paras = []
    for l in lines:
        if re.match(r'^(footnotes?|notes)\b', l, re.I) and len(l) < 20: break   # stop at the footnotes
        if SKIP.search(l) or len(l.split()) < 12: continue                        # nav, headings, stray bits
        paras.append(l)
    return paras


def split_long(par, limit):
    parts, cur = [], ''
    for sent in re.split(r'(?<=[.!?])\s+', par):
        if len((cur + ' ' + sent).split()) > limit and cur: parts.append(cur); cur = sent
        else: cur = (cur + ' ' + sent).strip()
    if cur: parts.append(cur)
    return parts


def chunk(paras, size=CHUNK_WORDS):
    flat = []
    for p in paras: flat += split_long(p, size) if len(p.split()) > size else [p]
    out, cur, n = [], [], 0
    for p in flat:
        w = len(p.split())
        if cur and n + w > size * 1.15: out.append(cur); cur, n = [], 0
        cur.append(p); n += w
    if cur and (n > 150 or not out): out.append(cur)
    elif cur: out[-1] += cur
    return out


def build_justice(fetch=None):
    fetch = fetch or (lambda u: urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'ora-personal-prayer-app/1.0 (personal use)'}), timeout=30).read().decode('utf-8', 'replace'))
    items = []
    for author, work, url in JUSTICE_SOURCES:
        try: parts = chunk(page_paragraphs(fetch(url), url))
        except Exception as e: print('justice: skipped', url, e); continue
        for i, c in enumerate(parts, 1):
            items.append({'author': author, 'work': work, 'part': f'{i} of {len(parts)}', 'url': url, 'words': sum(len(p.split()) for p in c), 'paras': c})
    return items


def update_justice(old, fetch=None):
    """Refresh the reading list at most weekly; on any failure keep what is already there."""
    cur = old.get('_justice') or {}
    same = cur.get('urls') == [u for _, _, u in JUSTICE_SOURCES]
    if same and cur.get('items') and cur.get('fetched', '') > (datetime.date.today() - datetime.timedelta(days=7)).isoformat(): return
    try: items = build_justice(fetch)
    except Exception as e: print('justice: failed', e); return
    if items: old['_justice'] = {'fetched': datetime.date.today().isoformat(), 'urls': [u for _, _, u in JUSTICE_SOURCES], 'items': items}; print(f'justice: {len(items)} readings')


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
    if '--no-justice' not in a: update_justice(old)
    old['_copyright'] = copyright_ or old.get('_copyright', '')
    days = sorted(k for k in old if not k.startswith('_'))
    for k in days[:-KEEP_DAYS]: del old[k]
    json.dump(old, open(out_path, 'w'), ensure_ascii=False, separators=(',', ':'), sort_keys=True)
    print(f'{len(new)} days from feed; {len(days)} total in {out_path}')


if __name__ == '__main__': main()
