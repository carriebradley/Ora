#!/usr/bin/env python3
"""Generate a citation-only USCCB feed archive. No source body redistribution.

The JSON conversion does not grant permissions or clear historical Git content.
See docs/ORA-V1-PUBLICATION-RIGHTS.md. No effect on Ora unless explicitly used.
"""
import argparse
import json
import re
from pathlib import Path

DAY = re.compile(r'^\d{4}-\d{2}-\d{2}$')


def references_only(source):
    if not isinstance(source, dict):
        raise ValueError('Source must be an object')
    out = {}
    for key, record in source.items():
        if not DAY.fullmatch(key):
            if key in ('_copyright', '_justice'):
                out[key] = record
            continue
        if not isinstance(record, dict):
            continue
        # Whitelist only labels, references, and the publisher link.
        # Discard all unknown fields, excerpts, descriptions and HTML.
        parts = []
        for section in record.get('sections', []):
            if isinstance(section, dict):
                label = section.get('label')
                cite = section.get('cite')
                if isinstance(label, str) and isinstance(cite, str) and (label.strip() or cite.strip()):
                    parts.append({'label': label, 'cite': cite})
        href = f'https://bible.usccb.org/bible/readings/{key[5:7]}{key[8:10]}{key[2:4]}.cfm'
        safe = {'link': href, 'sections': parts}
        if isinstance(record.get('title'), str):
            safe['title'] = record['title']
        if str(record.get('audio', '')).isdigit() and record.get('audio'):
            safe['audio'] = str(record['audio'])
            suffix = record.get('audio_suffix')
            if isinstance(suffix, str) and re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', suffix):
                safe['audio_suffix'] = suffix
        out[key] = safe
    out['_publication_mode'] = 'references-only'
    return out


def main():
    parser = argparse.ArgumentParser(description='Create a separate, citation-only readings archive')
    parser.add_argument('--input', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    src, dest = Path(args.input).resolve(), Path(args.output).resolve()
    if src == dest:
        parser.error('Specify a separate output file; the source must not be overwritten')
    with src.open(encoding='utf-8') as fp:
        data = json.load(fp)
    reduced = references_only(data)
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open('w', encoding='utf-8') as fp:
        json.dump(reduced, fp, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
    print(f'{sum(DAY.fullmatch(k) is not None for k in reduced)} dates; references only; {dest}')


if __name__ == '__main__':
    main()
