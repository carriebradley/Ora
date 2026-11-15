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
START = re.compile(r"Chapter\s+Thirty[- ]three\s*:\s*of a miracle wrought by his sister Scholastica", re.I)
END = re.compile(r"Chapter\s+Thirty[- ]four\s*:", re.I)

class BlockReader(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.active = None
        self.parts = []
        self.blocks = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            self.skip += 1
        if self.skip:
            return
        if tag in ("p", "h2", "h3", "h4", "blockquote", "div") and self.active is None:
            self.active = tag
            self.parts = []
        elif tag == "br" and self.active is not None:
            self.parts.append(" ")

    def handle_data(self, data):
        if not self.skip and self.active:
            self.parts.append(data)

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.skip:
            self.skip -= 1
            return
        if self.skip or self.active != tag:
            return
        body = " ".join("".join(self.parts).split())
        if body:
            self.blocks.append(body)
        self.active = None
        self.parts = []

def parse(html):
    parser = BlockReader()
    parser.feed(html)
    starts = [i for i,b in enumerate(parser.blocks) if START.search(b)]
    ends = [i for i,b in enumerate(parser.blocks) if END.search(b)]
    if not starts or not ends:
        raise ValueError("Chapter 33/34 boundaries not found")
    start = starts[-1]
    stop = next((i for i in ends if i>start), None)
    if stop is None or stop-start<3:
        raise ValueError("Incomplete chapter 33 boundary")
    chapter = parser.blocks[start+1:stop]
    chapter = [b for b in chapter if len(b)>50 and not b.startswith(("Notes:", "Footnotes:"))]
    text = " ".join(chapter).lower()
    if not 1300 < len(text) < 14000:
        raise ValueError(f"Unexpected chapter size: {len(text)}")
    for word in ("scholastica", "benedict", "prayer", "rain"):
        if word not in text:
            raise ValueError("The Scholastica narrative is incomplete: "+word)
    if "chapter thirty-four" in text:
        raise ValueError("Adjacent chapter was included")
    if len(chapter)<4:
        raise ValueError("Too few prayer-reading paragraphs")
    return chapter

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
