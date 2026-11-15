#!/usr/bin/env python3
"""Import six specified excerpts from Augustine's Letter 130 to Proba.

Source is a historical NPNF English translation on New Advent, NOT the ICEL
First Edition translation. Match both the paragraph number and its chapter;
import only sections explicitly prescribed by the existing Office index.
"""
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
URL = "https://www.newadvent.org/fathers/1102130.htm"
AUTHOR = "Augustine"
# Key: exact "work" field in oor.js. Values: chapter, paragraph pairs.
APPOINTMENTS = {
    "Letter 130 to Proba 8, 15.17–9, 18": [(8,15), (8,17), (9,18)],
    "Letter 130 to Proba 9, 18–10, 20": [(9,18), (10,19), (10,20)],
    "Letter 130 to Proba 11, 21–12, 22": [(11,21), (12,22)],
    "Letter 130 to Proba 12, 22–13, 24": [(12,22), (12,23), (13,24)],
    "Letter 130 to Proba 14, 25-26": [(14,25), (14,26)],
    "Letter 130 to Proba 14, 27–15, 28": [(14,27), (15,28)],
}

class Sections(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.capture = None
        self.chapter = None
        self.sections = {}

    def handle_starttag(self, tag, attrs):
        if tag in ("h2", "h3", "p") and self.capture is None:
            self.capture = tag
            self.parts = []
        elif tag == "br" and self.capture == "p":
            self.parts.append(" ")

    def handle_data(self, data):
        if self.capture:
            self.parts.append(data)

    def handle_endtag(self, tag):
        if tag != self.capture:
            return
        text = " ".join("".join(self.parts).split())
        if tag in ("h2", "h3"):
            heading = re.fullmatch(r"Chapter\s+(\d+)", text, flags=re.I)
            if heading:
                self.chapter = int(heading.group(1))
        elif tag == "p" and self.chapter:
            numbered = re.match(r"^(\d{1,2})\.\s+(.+)$", text, flags=re.S)
            if numbered:
                key = (self.chapter, int(numbered.group(1)))
                if key in self.sections:
                    raise ValueError(f"Duplicate section: {key}")
                self.sections[key] = numbered.group(2).strip()
        self.capture = None
        self.parts = []

def parse(html):
    parser = Sections()
    parser.feed(html)
    required = set().union(*(set(rows) for rows in APPOINTMENTS.values()))
    absent = sorted(required - set(parser.sections))
    if absent:
        raise ValueError(f"Missing required chapter/paragraph pairs: {absent}")
    if len(parser.sections) < 25:
        raise ValueError("Incomplete Letter 130 source")
    for chapter, number in required:
        if len(parser.sections[(chapter,number)]) < 160:
            raise ValueError(f"Short/truncated numbered paragraph: {chapter}:{number}")
    return parser.sections

def import_readings(html, existing):
    sections = parse(html)
    out = dict(existing)
    added = 0
    for name, selections in APPOINTMENTS.items():
        key = AUTHOR + "|" + name
        entry = {
            "p": [sections[section] for section in selections],
            "title": "On Prayer",
            "edition": "historical-alternative",
            "sourceUrl": URL,
            "src": ("Alternative historical English translation of the numbered passages "
                    "appointed in the Roman Office; not the First Edition ICEL wording. "
                    "St Augustine, Letter 130 to Proba. J. G. Cunningham, trans., "
                    "Nicene and Post-Nicene Fathers, First Series, volume 1 (1887). "
                    "Source: " + URL),
        }
        if key in out:
            if out[key] != entry:
                raise ValueError(f"Refusing to overwrite nonidentical reading: {key}")
            continue
        out[key] = entry
        added += 1
    return out, added

def main():
    path = ROOT / "oortext.json"
    current = json.loads(path.read_text(encoding="utf-8"))
    if all(AUTHOR+"|"+key in current for key in APPOINTMENTS):
        print("All six Letter 130 excerpts already present; no network request")
        return
    request = urllib.request.Request(URL, headers={
        "User-Agent": "Ora-Patristic-Text-Importer/1.0 (historical text research)"})
    with urllib.request.urlopen(request, timeout=40) as response:
        if not response.geturl().startswith(URL):
            raise ValueError("Unexpected source redirect")
        html = response.read().decode("utf-8")
    updated, added = import_readings(html, current)
    if added:
        path.write_text(json.dumps(updated, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Imported {added} verified historical excerpts; total {len(updated)}")

if __name__ == "__main__":
    main()
