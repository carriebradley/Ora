#!/usr/bin/env python3
"""Extract eligible First Edition prayer sections from line-numbered witnesses.

Input is a private research capture, not a public bundle of third-party pages.
Only antiphons, psalm-prayers, responsories, intercessions and concluding prayers
are exported. Scripture, hymns, recordings, commentary and site furniture are
deliberately outside this importer. See docs/roman-office-text-permissions.md.
"""
import argparse
import json
import re
from pathlib import Path


def witness_rows(capture):
    rows = {}
    for number, text in re.findall(r'^L(\d+): ?(.*)$', capture, re.M):
        number = int(number)
        # The site's outer date/title can change while the reusable prayer body
        # stays fixed. These header lines are never imported.
        if number >= 70 and number in rows and rows[number] != text:
            raise ValueError(f'Conflicting source line {number}')
        rows[number] = text
    return rows


def extract(capture, url):
    rows = witness_rows(capture)
    if not rows:
        raise ValueError('No source lines')
    def find(pattern, start=0):
        return next((n for n, text in sorted(rows.items())
                     if n >= start and re.search(pattern, text, re.I)), None)
    def between(start, end):
        if start is None or end is None or end <= start:
            raise ValueError(f'Missing section boundary: {start}, {end}')
        if any(n not in rows for n in range(start, end)):
            raise ValueError(f'Incomplete source lines: {start}–{end}')
        text = '\n'.join(rows[n] for n in range(start, end)).strip()
        if '【' in text or 'Login to' in text:
            raise ValueError('Site furniture in prayer section')
        return text
    psalmody = find(r'^PSALMODY$')
    reading = find(r'^READING\b', psalmody or 0)
    resp = find(r'^(?:RESPONSORY|In place of the [Rr]esponsory,.*)$', reading or 0)
    gospel = find(r'^(?:CANTICLE OF (?:MARY|ZECHARIAH|SIMEON)|GOSPEL CANTICLE)$', resp or 0)
    intercessions = find(r'^INTERCESSIONS$', gospel or 0)
    collect = find(r'^Concluding Prayer$', gospel or 0)
    ending = find(r'^(?:DISMISSAL|BLESSING|May the Lord bless us\b)', collect or 0)
    result = {'source': url, 'edition': 'first'}
    ants = []
    prayers = {}
    refs = []
    current = None
    for n, text in sorted(rows.items()):
        if psalmody is None or reading is None or not psalmody < n < reading:
            continue
        m = re.match(r'^Ant\.\s*([123])\s+(.+)$', text)
        if not ants and not m:
            # Some witnesses omit the numeral on the first antiphon.
            first = re.match(r'^Ant\.\s+(.+)$', text)
            if first:
                m = re.match(r'^Ant\.\s*([123])\s+(.+)$', 'Ant. 1 ' + first[1])
        if m:
            current, ant = int(m[1]) - 1, m[2]
            if current < len(ants) and ants[current] == ant:
                continue  # An antiphon repeated between canticle stanzas.
            if current != len(ants):
                raise ValueError('Nonsequential psalm antiphons')
            ants.append(ant)
            refs.append(None)
        ref = re.match(r'^(Psalm\s+\d+)(?:[AB])?(?:[:\s].*)?$|^(Canticle\s*(?:[–—·:-]\s*)?.+)$', text)
        if ref and current is not None:
            refs[current] = ref[1] or ref[2]
        if current is not None and refs[current] is None and re.match(r'^(?:[123] )?[A-Za-z]+ \d+:\d', text):
            refs[current] = 'Canticle – ' + text
        if text in ('II', 'III') and current and refs[current] is None:
            # A split psalm prints its number once, followed by I / II.
            if (refs[current - 1] or '').startswith('Psalm '):
                refs[current] = refs[current - 1]
        if text.lower() == 'psalm-prayer' and current is not None:
            end = find(r'^Ant\.', n + 1)
            prayers[str(current)] = between(n + 1, end)
    if ants:
        result['antiphons'] = ants
        result['psalmodyRefs'] = refs
    if prayers:
        result['psalmPrayers'] = prayers
    if resp is not None and gospel is not None:
        result['responsory'] = between(resp + 1, gospel)
    elif gospel is not None:
        octave = find(r'^—\s+This is the day(?: that)? the Lord has made;', reading or 0)
        if octave is not None and octave < gospel:
            result['responsory'] = rows[octave]
    if gospel is not None:
        ant = find(r'^Ant\. ', gospel + 1)
        if ant is not None:
            result['gospelAntiphon'] = re.sub(r'^Ant\. ', '', rows[ant])
    if intercessions is not None:
        father = find(r'^Our Father', intercessions + 1)
        result['intercessions'] = between(intercessions + 1, father)
    if collect is not None and ending is not None:
        result['collect'] = between(collect + 1, ending)
    if not result.get('collect') or not result.get('gospelAntiphon'):
        raise ValueError('Incomplete Office witness')
    result['readingRef'] = re.sub(r'^READING\s*:?\s*', '', rows.get(reading, ''))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('capture', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    records, rejected = {}, {}
    for url, capture in json.loads(args.capture.read_text()).items():
        try:
            records[url] = extract(capture, url)
        except ValueError as exc:
            rejected[url] = str(exc)
    args.output.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'accepted': len(records), 'rejected': rejected}, indent=2))


if __name__ == '__main__':
    main()
