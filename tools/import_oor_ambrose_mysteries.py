#!/usr/bin/env python3
"""Import exact numbered patristic sections from Ambrose, On the Mysteries.

This is the H. de Romestin et al. 1896 historical English translation, not the
ICEL First Edition's own translation. It is labelled accordingly in Ora.
No modern publisher's content, source commentary or unrelated chapters is copied.
"""
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
URL = "https://www.newadvent.org/fathers/3405.htm"
AUTHOR = "Ambrose of Milan"
# Office index keys must match exactly, including omitted/nonconsecutive sections.
APPOINTMENTS = {
    "On the Mysteries 1-7": [1, 2, 3, 4, 5, 6, 7],
    "On the Mysteries 8-11": [8, 9, 10, 11],
    "On the Mysteries 12-16.19": [12, 13, 14, 15, 16, 19],
    "On the Mysteries 19-21.24.26-28": [19, 20, 21, 24, 26, 27, 28],
    "On the Mysteries 29-30.34-35.37.42": [29, 30, 34, 35, 37, 42],
    "On the Mysteries 43.47-49": [43, 47, 48, 49],
    "On the Mysteries 52-54.58": [52, 53, 54, 58],
}

class Paragraphs(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.parts = []
        self.lines = []
        self.skipped = 0

    def handle_starttag(self, tag, attrs):
        if tag == "p":
            self.depth += 1
            if self.depth == 1:
                self.parts = []
        elif tag == "br" and self.depth:
            self.parts.append(" ")

    def handle_data(self, data):
        if self.depth:
            self.parts.append(data)

    def handle_endtag(self, tag):
        if tag != "p" or not self.depth:
            return
        self.depth -= 1
        if self.depth:
            return
        text = " ".join("".join(self.parts).split())
        match = re.match(r"^(\d{1,2})\.\s+(.+)$", text, re.S)
        if match:
            self.lines.append((int(match.group(1)), match.group(2).strip()))

def parse(html):
    parser = Paragraphs()
    parser.feed(html)
    if len(parser.lines) < 55:
        raise ValueError(f"Too few numbered paragraphs: {len(parser.lines)}")
    found = {}
    for n, body in parser.lines:
        if n in found:
            raise ValueError(f"Duplicate section {n}")
        if len(body) < 50:
            raise ValueError(f"Truncated section {n}")
        found[n] = body
    required = set().union(*map(set, APPOINTMENTS.values()))
    absent = sorted(required - set(found))
    if absent:
        raise ValueError(f"Missing appointed sections: {absent}")
    if 1 not in found or max(found) < 58:
        raise ValueError("Wrong source or incomplete work")
    return found

def import_readings(html, texts):
    sections = parse(html)
    result = dict(texts)
    changes = 0
    for name, numbers in APPOINTMENTS.items():
        key = AUTHOR + "|" + name
        entry = {
            "p": [sections[n] for n in numbers],
            "title": "On the Mysteries",
            "edition": "historical-alternative",
            "sourceUrl": URL,
            "src": ("Alternative English translation of the numbered sections appointed "
                    "in the Roman Office; not the First Edition ICEL wording. "
                    "H. de Romestin, E. de Romestin and H. T. F. Duckworth, trans., "
                    "Nicene and Post-Nicene Fathers, second series, vol. 10 (1896). "
                    "Source: " + URL),
        }
        if key in result:
            if result[key] != entry:
                raise ValueError(f"Existing reading differs; refusing overwrite: {key}")
            continue
        result[key] = entry
        changes += 1
    return result, changes

def main():
    path = ROOT / "oortext.json"
    texts = json.loads(path.read_text(encoding="utf-8"))
    if all(AUTHOR + "|" + key in texts for key in APPOINTMENTS):
        print("All seven numbered Ambrose readings already bundled; no download")
        return
    request = urllib.request.Request(URL, headers={
        "User-Agent": "Ora-Patristic-Text-Importer/1.0 (historical source research)"})
    with urllib.request.urlopen(request, timeout=40) as response:
        if not response.geturl().startswith("https://www.newadvent.org/fathers/3405"):
            raise ValueError("Unexpected source URL redirect")
        html = response.read().decode("utf-8")
    updated, count = import_readings(html, texts)
    if count:
        path.write_text(json.dumps(updated, ensure_ascii=False, separators=(",", ":")) + "\n",
                        encoding="utf-8")
    print(f"Imported {count} numbered historical excerpts; total {len(updated)}")

if __name__ == "__main__":
    main()
