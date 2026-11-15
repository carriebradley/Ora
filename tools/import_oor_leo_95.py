#!/usr/bin/env python3
"""Import five appointed passages of Leo the Great's Sermon 95.

The 1895 Charles Lett Feltoe translation from NPNF Series II, vol. 12, is
a historical English alternative, not First Edition ICEL wording.
"""
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
URL = "https://www.newadvent.org/fathers/360395.htm"
AUTHOR = "Leo the Great"
APPOINTMENTS = {
    "Sermon 95 on the Beatitudes 1-2": [1, 2],
    "Sermon 95, 2-3": [2, 3],
    "Sermon 95, 4-6": [4, 5, 6],
    "Sermon 95, 6-8": [6, 7, 8],
    "Sermon 95, 8-9": [8, 9],
}
ROMAN = dict(zip(("I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"), range(1, 10)))

class Sections(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tag = None
        self.parts = []
        self.current = None
        self.sections = {}
        self.closed = False

    def handle_starttag(self, tag, attrs):
        if tag in ("h2", "h3", "h4") and self.tag is None:
            self.tag = tag
            self.parts = []
        elif tag == "p" and self.tag is None and self.current and not self.closed:
            self.tag = "p"
            self.parts = []
        elif tag == "br" and self.tag == "p":
            self.parts.append(" ")

    def handle_data(self, data):
        if self.tag:
            self.parts.append(data)

    def handle_endtag(self, tag):
        if tag != self.tag:
            return
        content = " ".join("".join(self.parts).split())
        self.tag, self.parts = None, []
        if tag in ("h2", "h3", "h4"):
            if "About this page" in content:
                self.closed = True
                self.current = None
                return
            heading = re.match(r"^(I|II|III|IV|V|VI|VII|VIII|IX)\.\s", content)
            if heading:
                number = ROMAN[heading.group(1)]
                if number in self.sections:
                    raise ValueError(f"Duplicate Roman section: {number}")
                self.sections[number] = []
                self.current = number
        elif tag == "p" and content:
            self.sections[self.current].append(content)

def parse(html):
    parser = Sections()
    parser.feed(html)
    if set(parser.sections) != set(range(1, 10)):
        raise ValueError(f"Missing/extra numbered sermon sections: {sorted(parser.sections)}")
    for number, paragraphs in parser.sections.items():
        if len(" ".join(paragraphs)) < 150:
            raise ValueError(f"Incomplete sermon section {number}")
    if "blessed" not in " ".join(parser.sections[2]).lower():
        raise ValueError("Wrong source: beatitudes not present in section II")
    return parser.sections

def import_readings(html, existing):
    sections = parse(html)
    out = dict(existing)
    count = 0
    for work, numbers in APPOINTMENTS.items():
        key = AUTHOR + "|" + work
        record = {
            "p": [para for number in numbers for para in sections[number]],
            "title": "Sermon on the Beatitudes",
            "edition": "historical-alternative",
            "sourceUrl": URL,
            "src": ("Alternative historical English translation of the sections "
                    "appointed in the Roman Office, not the First Edition ICEL wording. "
                    "Charles Lett Feltoe, trans., Nicene and Post-Nicene Fathers, "
                    "Second Series, vol. 12 (1895). Source: " + URL),
        }
        if key in out:
            if out[key] != record:
                raise ValueError(f"Refusing to overwrite different text: {key}")
            continue
        out[key] = record
        count += 1
    return out, count

def main():
    path = ROOT / "oortext.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    if all(AUTHOR + "|" + work in data for work in APPOINTMENTS):
        print("All five Leo Sermon 95 excerpts already present")
        return
    request = urllib.request.Request(URL, headers={
        "User-Agent": "Ora-Patristic-Text-Importer/1.0 (historical source attribution)"})
    with urllib.request.urlopen(request, timeout=40) as response:
        if not response.geturl().startswith(URL):
            raise ValueError("Unexpected source redirect")
        html = response.read().decode("utf-8")
    updated, count = import_readings(html, data)
    if count:
        path.write_text(json.dumps(updated, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Added {count} historic excerpts, now {len(updated)} bundled Office readings")

if __name__ == "__main__":
    main()
