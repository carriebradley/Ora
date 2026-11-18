#!/usr/bin/env python3
"""Extract English dated Melkite hymns from the Eparchy of Newton's Nov 2026 DOCX.
Keep Arabic, Scripture readings, homilies and parish-specific hymns out.
Run: python tools/import_melkite_propers.py --source local.docx
Or omit --source to fetch the official diocesan monthly DOCX.
"""
import argparse
from io import BytesIO
import json
from pathlib import Path
import re
import time
from urllib.error import URLError
from zipfile import is_zipfile
from urllib.request import Request, urlopen
from docx import Document

SOURCE='https://melkite.org/wp-content/uploads/2025/12/November-2026.docx'
INDEX='https://melkite.org/liturgical-resources'
DATE=re.compile(r'^(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),?\s+November\s+(\d{1,2}),\s*2026\b',re.I)
ARABIC=re.compile(r'[\u0600-\u06ff]')
HYMN=re.compile(r'^(?:Troparion|Kondakion|Kontakion)\b',re.I)
HYMN_BOUNDARY=re.compile(r'^(?:Trisagion\b|Instead\s+of\b)',re.I)
PROK=re.compile(r'^(?:Prokimenon|Prokeimenon)\s*:',re.I)
ALLELUIA=re.compile(r'^Alleluia\s*:',re.I)
STOP_READ=re.compile(r'^(?:Reading from\b|Brethren\b|Gospel\s*:|At that time\b|The Lord told\b|Homily\b)',re.I)

def clean(s):return re.sub(r'\s+',' ',s or '').strip()
def english(s):
    return bool(s) and not ARABIC.search(s) and not re.match(r'^TYPICON\s*-',s,re.I)

def blocks(doc):
    lines=[clean(p.text) for p in doc.paragraphs]
    marks=[(i,'2026-11-%02d'%int(m.group(1))) for i,s in enumerate(lines) if (m:=DATE.match(s))]
    if len(marks)<8:raise ValueError('Monthly typicon headings unexpectedly absent: '+str(len(marks)))
    for n,(start,day) in enumerate(marks):
        yield day,lines[start:marks[n+1][0] if n+1<len(marks) else len(lines)]

def hymns(lines):
    out=[];unresolved=[]
    begin=next((i+1 for i,s in enumerate(lines) if re.fullmatch(r'Hymns\s*:?',s,re.I)),None)
    if begin is None:return out,unresolved
    end=next((i for i in range(begin,len(lines)) if re.match(r'^Epistle\s*:',lines[i],re.I)),len(lines))
    part=lines[begin:end]
    for i,title in enumerate(part):
        if not english(title) or not HYMN.match(title):continue
        if re.search(r'patron\s+of\s+the\s+church',title,re.I):
            unresolved.append('Patronal hymn determined locally')
            continue
        following=next((s for s in part[i+1:] if s),'')
        if english(following) and not HYMN.match(following) and not HYMN_BOUNDARY.match(following) and len(following)>24 and len(following)<=1200:
            out.append(title.strip(' :')+': '+following)
        else:
            unresolved.append(title)
    return out,list(dict.fromkeys(unresolved))

def verses(lines,start_re,stop_re):
    start=next((i for i,s in enumerate(lines) if start_re.match(s)),None)
    if start is None:return []
    result=[lines[start]]
    for raw in lines[start+1:]:
        if stop_re.search(raw):break
        if ARABIC.search(raw):break
        if not english(raw):continue
        if STOP_READ.match(raw) or len(raw)>310 or 'READING from' in raw:break
        if len(result)>=5:break
        result.append(raw)
    return result if len(result)>=2 and all(len(x)<=450 for x in result) else []

def extract(doc):
    days={}
    for iso,lines in blocks(doc):
        if not any(re.fullmatch(r'Liturgy of St\. John Chrysostom',s,re.I) for s in lines):
            continue
        groups={};unresolved=[]
        items,unresolved=hymns(lines)
        if items:groups['troparia']=items
        ps=verses(lines,PROK,re.compile(r'^(?:READING from|ALLELUIA\s*:|Gospel\s*:)',re.I))
        al=verses(lines,ALLELUIA,re.compile(r'^(?:Gospel\s*:|Homily\b)',re.I))
        if ps:groups['prokeimenon']=ps
        if al:groups['alleluia']=al
        # No generic Kinonikon is relabelled a daily Communion proper.
        if not groups:continue
        record={'church':'melkite','iso':iso,'source':INDEX,'typicon':'November-2026.docx','groups':groups}
        if unresolved:record['unresolved']=unresolved
        days[iso]=record
    for iso in ('2026-11-15','2026-11-22'):
        if not all(k in days.get(iso,{}).get('groups',{}) for k in ('troparia','prokeimenon','alleluia')):
            raise ValueError('Source anchor missing complete Sunday groups: '+iso)
    return {'schema':1,'days':dict(sorted(days.items()))}

def fetch_source(attempts=3):
    """Reject non-DOCX responses and retry transient source failures."""
    if attempts < 1:
        raise ValueError('At least one source attempt is required')
    for attempt in range(attempts):
        try:
            request=Request(SOURCE,headers={'User-Agent':'Ora Liturgical Source Import',
                                           'Cache-Control':'no-cache'})
            with urlopen(request,timeout=45) as response:
                raw=response.read(20*1024*1024+1)
                headers=getattr(response,'headers',None)
                content_type=headers.get_content_type() if headers else 'unknown'
                status=getattr(response,'status',None)
            if len(raw)>20*1024*1024 or not is_zipfile(BytesIO(raw)):
                prefix=raw[:4096].lower()
                kind=('html' if b'<html' in prefix or b'<!doctype html' in prefix else 'other')
                markers=[name for name in ('cloudflare','captcha','access denied','challenge')
                         if name.encode('ascii') in prefix]
                raise ValueError('Newton source returned invalid or oversized DOCX '
                                 f'(HTTP {status}, type {content_type}, bytes {len(raw)}, '
                                 f'format {kind}, markers {",".join(markers) or "none"})')
            return Document(BytesIO(raw))
        except (URLError, TimeoutError, ValueError) as error:
            if attempt+1==attempts:
                raise RuntimeError('Newton source unavailable or invalid after retries; existing hymns were not replaced') from error
            time.sleep(2*(attempt+1))

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--source',type=Path)
    p.add_argument('--out',type=Path,default=Path('melkite-propers-2026-11.json'))
    args=p.parse_args()
    if args.source:book=Document(args.source)
    else:book=fetch_source()
    data=extract(book)
    args.out.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'dates':len(data['days']),'groups':{d:list(e['groups']) for d,e in data['days'].items()}},indent=2))
if __name__=='__main__':main()
