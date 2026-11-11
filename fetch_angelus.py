#!/usr/bin/env python3
"""Find the Pope's latest Sunday Angelus (or Regina Caeli) on vatican.va and keep the
sentences from the part "After the Angelus" where he asks people to pray, in angelus.json.

Only a few sentences and the link are kept; Ora links to the full text on vatican.va.
Run by .github/workflows/readings.yml from the repository's main folder.

usage: python3 fetch_angelus.py [--file page.html --index index.html] [--out angelus.json]
"""
import json, re, sys, datetime, urllib.request
from html.parser import HTMLParser
from html import unescape

BASE = 'https://www.vatican.va'
INDEX = BASE + '/content/leo-xiv/en/angelus/{y}.index.html'
UA = {'User-Agent': 'ora-personal-prayer-app/1.0 (personal use)'}
KEY = re.compile(r'\b(pray|praying|prayer|prayers|entrust|entrusting|intercession|implore|invoke)\b', re.I)


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read().decode('utf-8', 'replace')


class Text(HTMLParser):
    BLOCK = {'p', 'div', 'br', 'h1', 'h2', 'h3', 'h4', 'li', 'tr', 'hr'}

    def __init__(self):
        super().__init__(); self.out = []; self.skip = 0

    def handle_starttag(self, t, a):
        if t in ('script', 'style', 'noscript'): self.skip += 1
        if t in self.BLOCK: self.out.append('\n')

    def handle_endtag(self, t):
        if t in ('script', 'style', 'noscript') and self.skip: self.skip -= 1
        if t in self.BLOCK: self.out.append('\n')

    def handle_data(self, d):
        if not self.skip: self.out.append(d)


def text(html):
    p = Text(); p.feed(html)
    return re.sub(r'[ \t\xa0]+', ' ', ''.join(p.out))


def latest(index_html):
    links = re.findall(r'href="([^"]*/angelus/\d{4}/documents/(\d{8})-[^"]+\.html)"[^>]*>(.*?)</a>', index_html, re.S)
    best = None
    for href, d, label in links:
        if '/en/' not in href: continue
        if not best or d > best[1]: best = (href, d, re.sub(r'\s+', ' ', unescape(re.sub(r'<[^>]+>', '', label))).strip())
    return best


def requests(page_html):
    t = text(page_html)
    m = re.search(r'After the (Angelus|Regina C\w*li)', t, re.I)
    if not m: return []
    t = t[m.end():]
    e = re.search(r'Copyright|©|Dicastero per la Comunicazione', t)
    if e: t = t[:e.start()]
    paras = [re.sub(r'\s+', ' ', x).strip() for x in t.split('\n')]
    out = []
    for para in paras:
        for s in re.split(r'(?<=[.!?])\s+(?=[A-Z“"‘])', para):
            s = s.strip()
            if KEY.search(s) and 25 < len(s) < 320 and s not in out: out.append(s)
    return out[:5]


def main():
    a = sys.argv[1:]
    out = a[a.index('--out') + 1] if '--out' in a else 'angelus.json'
    if '--file' in a:
        page = open(a[a.index('--file') + 1], encoding='utf-8').read()
        idx = open(a[a.index('--index') + 1], encoding='utf-8').read() if '--index' in a else ''
        best = latest(idx) if idx else ('', '00000000', '')
    else:
        y = datetime.date.today().year; best = None
        for yr in (y, y - 1):
            try: best = latest(get(INDEX.format(y=yr)))
            except Exception as ex: print('index', yr, ex)
            if best: break
        if not best: print('no Angelus found'); return
        page = get(best[0] if best[0].startswith('http') else BASE + best[0])
    href, d, label = best
    url = href if href.startswith('http') else BASE + href
    r = {'date': f'{d[:4]}-{d[4:6]}-{d[6:]}', 'title': label, 'url': url, 'pray': requests(page)}
    json.dump(r, open(out, 'w'), indent=1, ensure_ascii=False)
    print(r['date'], len(r['pray']), 'prayer requests')


if __name__ == '__main__':
    main()
