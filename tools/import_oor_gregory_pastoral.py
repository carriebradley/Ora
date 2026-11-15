#!/usr/bin/env python3
"""Import Gregory the Great's Pastoral Rule II.4, a historical English edition.

Match the exact book and chapter. This is not the First Edition ICEL translation.
"""
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
URL = "https://www.newadvent.org/fathers/36012.htm"
KEY = "Gregory the Great|Pastoral Guide 2, 4"

class Chapters(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.capture = None
        self.parts = []
        self.chapter = None
        self.data = {}

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
        if self.capture != tag:
            return
        s = " ".join("".join(self.parts).split())
        self.capture, self.parts = None, []
        if tag in ("h2", "h3"):
            heading = re.fullmatch(r"Chapter\s+(\d+)", s, flags=re.I)
            if heading:
                n = int(heading.group(1))
                if n in self.data:
                    raise ValueError("Duplicate chapter heading")
                self.chapter = n
                self.data[n] = []
            elif re.match(r"About this page|Source\.", s, re.I):
                self.chapter = None
        elif tag == "p" and self.chapter is not None and len(s) > 160:
            self.data[self.chapter].append(s)

def parse(html):
    parser = Chapters()
    parser.feed(html)
    chapters = parser.data
    if not set(range(1, 7)).issubset(chapters):
        raise ValueError("The source does not contain contiguous Pastoral Rule II chapters 1-6")
    if 4 not in chapters or not chapters[4]:
        raise ValueError("Book II chapter 4 missing")
    passage = " ".join(chapters[4])
    if len(passage) < 900:
        raise ValueError("Pastoral Rule II.4 appears truncated")
    if "silence" not in passage.lower() or "speech" not in passage.lower():
        raise ValueError("Unexpected chapter content")
    if "silence" not in " ".join(chapters[4]).lower():
        raise ValueError("Wrong selected chapter")
    return chapters[4]

def import_reading(html, existing):
    paragraphs = parse(html)
    entry = {
        "p": paragraphs,
        "title": "Pastoral Rule: Silence and Speech",
        "edition": "historical-alternative",
        "sourceUrl": URL,
        "src": ("Alternative historical English translation of Gregory the Great, "
                "Pastoral Rule, Book II, chapter 4; not the First Edition ICEL wording. "
                "James Barmby, trans., Nicene and Post-Nicene Fathers, Second Series, "
                "volume 12 (1895). Source: " + URL),
    }
    output = dict(existing)
    if KEY in output:
        if output[KEY] != entry:
            raise ValueError("Existing Office reading differs: refusing overwrite")
        return output, 0
    output[KEY] = entry
    return output, 1

def main():
    target = ROOT / "oortext.json"
    existing = json.loads(target.read_text(encoding="utf-8"))
    if KEY in existing:
        print("Gregory Pastoral Rule II.4 already bundled")
        return
    request = urllib.request.Request(URL, headers={
        "User-Agent": "Ora-Patristic-Text-Importer/1.0 (historical source research)"})
    with urllib.request.urlopen(request, timeout=40) as response:
        if not response.geturl().startswith(URL):
            raise ValueError("Unexpected source redirect")
        html = response.read().decode("utf-8")
    output, count = import_reading(html, existing)
    if count:
        target.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n",
                          encoding="utf-8")
    print(f"Added {count} historical excerpts; bundled {len(output)}")

if __name__ == "__main__":
    main()
