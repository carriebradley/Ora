#!/usr/bin/env python3
"""Import a historical English text for the St Martin Office of Readings.

Source: Alexander Roberts (1894), Sulpitius Severus, Letter III.
The complete historical letter is provided as a supplemental reading, not
represented as the exact modern Liturgy of the Hours excerpt.
"""
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

URL = "https://www.newadvent.org/fathers/3502.htm"
ROOT = Path(__file__).resolve().parents[1]
KEY = "Sulpicius Severus|Letter 3"

class Extract(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.capture = False
        self.in_heading = False
        self.in_paragraph = False
        self.heading = []
        self.para = []
        self.paragraphs = []
        self.finished = False

    def handle_starttag(self, tag, attrs):
        if tag in ("h2", "h3"):
            self.in_heading = True
            self.heading = []
        if tag == "p" and self.capture and not self.finished:
            self.in_paragraph = True
            self.para = []

    def handle_data(self, data):
        if self.in_heading:
            self.heading.append(data)
        if self.in_paragraph:
            self.para.append(data)

    def handle_endtag(self, tag):
        if tag in ("h2", "h3") and self.in_heading:
            name = " ".join("".join(self.heading).split()).lower()
            if re.search(r"letter\s*(?:3|iii)\b", name):
                self.capture = True
            elif self.capture:
                self.finished = True
                self.capture = False
            self.in_heading = False
        if tag == "p" and self.in_paragraph:
            text = " ".join("".join(self.para).split())
            if len(text) > 35:
                self.paragraphs.append(text)
            self.in_paragraph = False

def main():
    req = urllib.request.Request(URL, headers={"User-Agent": "Ora-Devotional-Text-Importer/1.0 (historical source attribution)"})
    with urllib.request.urlopen(req, timeout=30) as response:
        html = response.read().decode("utf-8")
    parser = Extract()
    parser.feed(html)
    paras = parser.paragraphs
    if len(paras) < 15 or not any("Martin" in p for p in paras):
        raise RuntimeError(f"Source layout or content failed validation: {len(paras)} paragraphs")
    path = ROOT / "oortext.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data[KEY] = {
        "p": paras,
        "src": "Sulpicius Severus, Letter III (complete historical letter, not the exact modern Office excerpt). Alexander Roberts, trans., Nicene and Post-Nicene Fathers, Series II, vol. 11 (1894). Source: " + URL
    }
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Imported {len(paras)} paragraphs into {KEY}")

if __name__ == "__main__":
    main()
