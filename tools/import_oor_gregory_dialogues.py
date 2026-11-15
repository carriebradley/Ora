#!/usr/bin/env python3
"""Import Gregory the Great Dialogues II.33, the life of St Scholastica.

Historical English: P. W. (1911), first published much earlier; this is NOT
the ICEL First Edition translation. Requires a unique body chapter boundary.
"""
import json
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
URL = "https://www.tertullian.org/fathers/gregory_02_dialogues_book2.htm"
KEY = "Gregory the Great|Dialogues 2, 33"
START = re.compile(r"(?:Chapter\\s+(?:Thirty[-\\s]*three|XXXIII)\\s*[:. -]*)?of\\s+a\\s+miracle\\s+wrought\\s+by\\s+his\\s+sister\\s+Scholastica", re.I)
END = re.compile(r"Chapter\\s+(?:Thirty[-\\s]*four|XXXIV)\\s*[:. -]*", re.I)

class BlockReader(HTMLParser):
    """Retain plain text and explicit paragraph boundaries, ignoring page layout."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.parts = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "nav"):
            self.skip += 1
        if not self.skip and tag in ("p", "h2", "h3", "h4", "blockquote", "br"):
            self.parts.append("\n\n")

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)

    def handle_endtag(self, tag):
        if tag in ("script", "style", "nav") and self.skip:
            self.skip -= 1
        elif not self.skip and tag in ("p", "h2", "h3", "h4", "blockquote"):
            self.parts.append("\n\n")

def parse(html):
    parser = BlockReader()
    parser.feed(html)
    text = "".join(parser.parts)
    # Prefer the chapter in the book body over the duplicate navigation title.
    starts = list(START.finditer(text))
    if not starts:
        raise ValueError("Chapter 33 heading not found; source examples: " + repr(re.findall(r".{0,100}scholastica.{0,160}", text, flags=re.I)[:8]))
    for start in reversed(starts):
        next_heading = END.search(text, start.end())
        if not next_heading:
            continue
        raw = text[start.end():next_heading.start()]
        paragraphs = [" ".join(p.split()) for p in re.split(r"\n\s*\n", raw)]
        paragraphs = [p for p in paragraphs if len(p) > 50]
        body = " ".join(paragraphs).lower()
        if 1300 < len(body) < 14000 and len(paragraphs) >= 4 and all(
            term in body for term in ("scholastica", "benedict", "prayer", "rain")
        ):
            return paragraphs
    raise ValueError("No complete Scholastica chapter between verified headings")

def import_reading(html, old):
    paragraphs = parse(html)
    entry = {
        "p": paragraphs,
        "title": "St. Scholastica: Love and Prayer",
        "edition": "historical-alternative",
        "sourceUrl": URL,
        "src": ("St Gregory the Great, Dialogues, Book II, chapter 33. "
                "Historical English translation (1911 edition), sourced from "
                "the Roger Pearse/Tertullian patristic archive; not the First "
                "Edition ICEL wording. Source: " + URL),
    }
    out = dict(old)
    if KEY in out:
        if out[KEY]!=entry:
            raise ValueError("Existing reading differs; refusing overwrite")
        return out,0
    out[KEY]=entry
    return out,1

def main():
    path=ROOT/"oortext.json"
    old=json.loads(path.read_text(encoding="utf-8"))
    if KEY in old:
        print("Gregory Dialogues II.33 already included")
        return
    req=urllib.request.Request(URL,headers={
        "User-Agent":"Ora-Patristic-Text-Importer/1.0 (historical source research)"})
    with urllib.request.urlopen(req,timeout=40) as response:
        if not response.geturl().startswith(URL):
            raise ValueError("Unexpected source redirect")
        html=response.read().decode("utf-8")
    updated,added=import_reading(html,old)
    if added:
        path.write_text(json.dumps(updated,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print("Added",added,"historical Office passages; total",len(updated))

if __name__=="__main__":
    main()
