#!/usr/bin/env python3
"""Conservative, source-identified 2026 Newton monthly typikon importer.

Runs only on public documents linked by the Diocese of Newton's liturgical
resources page. Leaves the verified November-only public dataset untouched.
Each dated prayer record retains its precise month, document, and ISO date.
"""
import argparse
from datetime import date
from io import BytesIO
import json
from pathlib import Path
import re
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

from docx import Document
from import_melkite_propers import hymns, verses, PROK, ALLELUIA

YEAR = 2026
INDEX = "https://melkite.org/liturgical-resources"
MONTHS = ("January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December")
# The twelve 2026 links on Newton's public resources page share this prefix.
SOURCE_PREFIX = "https://melkite.org/wp-content/uploads/2025/12/"
WEEKDAYS = "Monday Tuesday Wednesday Thursday Friday Saturday Sunday".split()
DATE_HEADING = re.compile(
    r"^\s*(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)"
    r"\s*,?\s+(" + "|".join(MONTHS) + r")\s+(\d{1,2})\s*,?\s*2026\b",
    re.IGNORECASE)
CHRY = re.compile(r"^(?:Divine\s+)?Liturgy of (?:St\.?|Saint) John Chrysostom\s*\.?$",re.I)
PROK_STOP = re.compile(r"^(?:READING from|ALLELUIA\s*:|Gospel\s*:)",re.I)
ALL_STOP = re.compile(r"^(?:Gospel\s*:|Homily\b)",re.I)
CYRILLIC_ARABIC = re.compile(r"[\u0400-\u052f\u0600-\u06ff]")
# Some DOCX paragraphs run straight into the next *reading heading*.
# Remove the known heading suffix only; never guess or invent prayer words.
EMBEDDED_READING = re.compile(r"\s+Reading from (?:the )?(?:Epistle|Gospel)\b.*$",re.I)

def devotional_verses(lines):
    return [EMBEDDED_READING.sub("",s).strip() for s in lines]

def document_url(month):
    if month not in MONTHS:
        raise ValueError("Unknown source month")
    return SOURCE_PREFIX + month + "-2026.docx"

def paragraphs(doc):
    # Word paragraph order is kept. Do not interpret unpublished page layout.
    return [re.sub(r"\s+", " ", p.text or "").strip() for p in doc.paragraphs]

def split_days(doc, month, quarantined=None):
    if month not in MONTHS: raise ValueError("Unknown source month")
    lines = paragraphs(doc)
    marks = []
    invalid = set()
    for i, line in enumerate(lines):
        match = DATE_HEADING.match(line)
        if not match: continue
        weekday, named_month, num = match.groups()
        if named_month.lower() != month.lower():
            continue
        day = date(YEAR, MONTHS.index(month)+1, int(num))
        if WEEKDAYS[day.weekday()].lower() != weekday.lower():
            # Never attach a possibly mistyped heading's hymns to the date.
            # Still use the boundary to prevent its prayers leaking into the
            # preceding date. Disclose source conflicts in coverage metadata.
            invalid.add(day.isoformat())
            if quarantined is not None:
                quarantined.append({"date":day.isoformat(),
                    "printedWeekday":weekday,"actualWeekday":WEEKDAYS[day.weekday()]})
        if marks and marks[-1][1] == day.isoformat():
            raise ValueError("Repeated day heading: " + day.isoformat())
        marks.append((i, day.isoformat()))
    if not marks:
        raise ValueError("No dated " + month + " 2026 headings; source format must be reviewed")
    if len({d for _, d in marks}) != len(marks):
        raise ValueError("Non-adjacent repeated source day in " + month)
    for i,(begin,iso) in enumerate(marks):
        end = marks[i+1][0] if i+1 < len(marks) else len(lines)
        if iso not in invalid:
            yield iso, lines[begin:end]

def extract_month(doc,month,quarantined=None):
    records = {}
    dates = []
    for iso, lines in split_days(doc,month,quarantined=quarantined):
        dates.append(iso)
        # This importer is for dated Chrysostom hymns, not the Basil,
        # Presanctified, Vespers, Orthros or weekday service readings.
        if not any(CHRY.fullmatch(line) for line in lines):
            continue
        groups = {}
        choices,unresolved = hymns(lines)
        if choices: groups["troparia"] = choices
        prok = verses(lines,PROK,PROK_STOP)
        alleluia = verses(lines,ALLELUIA,ALL_STOP)
        if prok: groups["prokeimenon"] = devotional_verses(prok)
        if alleluia: groups["alleluia"] = devotional_verses(alleluia)
        if not groups:
            continue
        for kind,words in groups.items():
            if not words or len(words)>40 or any(
                not isinstance(w,str) or not w.strip() or len(w)>1200 or CYRILLIC_ARABIC.search(w)
                for w in words):
                raise ValueError("Unsafe or unreadable "+kind+" on "+iso)
        record = {"church":"melkite","iso":iso,"source":INDEX,
                  "typicon":month+"-2026.docx","groups":groups}
        if unresolved:
            record["unresolved"] = unresolved
        records[iso] = record
    return records, dates

def fetch_month(month):
    url = document_url(month)
    if urlsplit(url).hostname != "melkite.org":
        raise ValueError("Non-Newton source")
    request = Request(url,headers={"User-Agent":"Ora devotional typikon importer"})
    with urlopen(request, timeout=45) as result:
        raw = result.read(20*1024*1024+1)
    if len(raw)>20*1024*1024 or not raw.startswith(b"PK"):
        raise ValueError("Unexpected DOCX download for "+month)
    return Document(BytesIO(raw))

def verify_november(records,existing_path):
    reference = json.loads(Path(existing_path).read_text(encoding="utf-8"))["days"]
    if set(reference) != set(records):
        raise ValueError("November source changed its covered dates; review before replacing")
    for iso, earlier in reference.items():
        current = dict(records[iso])
        current.pop("iso",None)
        before = dict(earlier)
        before.pop("iso",None)
        if before != current:
            raise ValueError("November published hymn content changed for "+iso)

def assemble(fetch=fetch_month, november_baseline="melkite-propers-2026-11.json"):
    all_days = {}
    coverage = {}
    for month in MONTHS:
        quarantined=[]
        month_days, seen = extract_month(fetch(month), month, quarantined=quarantined)
        if month == "November":
            verify_november(month_days,november_baseline)
        # Newton's published Nativity guide appoints Vespers with St. Basil
        # on Thursday 24 December 2026. The monthly file's Chrysostom
        # heading is inconsistent with that service; keep it out of the
        # dated Chrysostom hymn reader pending source reconciliation.
        if month == "December" and "2026-12-24" in month_days:
            del month_days["2026-12-24"]
            quarantined.append({"date":"2026-12-24",
                "reason":"Chrysostom heading conflicts with Newton Nativity Vesperal Basil order",
                "reference":"https://melkite.org/wp-content/uploads/2016/09/The-Feast-of-the-Nativity-of-Our-Lord-God-and-Savior-Jesus-Christ.pdf"})
        if not month_days:
            raise ValueError(month+" contains no extractable Chrysostom hymns; investigate rather than invent")
        if set(month_days) & set(all_days):
            raise ValueError("Duplicate dates between monthly documents")
        all_days.update(month_days)
        coverage[month] = {"headings":len(seen),"hymnDates":len(month_days),
                           "source":document_url(month),"quarantined":quarantined}
    return {"schema":1,"year":YEAR,"source":INDEX,"coverage":coverage,
            "days":dict(sorted(all_days.items()))}

def main():
    cli = argparse.ArgumentParser()
    cli.add_argument("--out",type=Path,default=Path("melkite-propers-2026.json"))
    cli.add_argument("--november",default="melkite-propers-2026-11.json")
    args = cli.parse_args()
    data = assemble(november_baseline=args.november)
    args.out.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"months":len(data["coverage"]),"days":len(data["days"]),
                      "coverage":data["coverage"]},indent=2))

if __name__ == "__main__":
    main()
