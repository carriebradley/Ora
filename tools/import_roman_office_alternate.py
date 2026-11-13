#!/usr/bin/env python3
"""Extract eligible prayer sections from line-numbered alternate Office witnesses.

Excludes Scripture wording, hymns, Gospel canticle bodies and commentary.
Common formularies must supply their saint's own concluding prayer separately.
"""
import json,re,argparse
from pathlib import Path
from import_roman_office_icel import witness_rows

def extract(capture,url,common=False):
    rows=witness_rows(capture)
    def find(pattern,start=0):
        return next((n for n,t in sorted(rows.items()) if n>=start and re.search(pattern,t,re.I)),None)
    def between(a,b):
        if a is None or b is None or b<=a or any(i not in rows for i in range(a,b)):raise ValueError('Missing/incomplete boundary')
        text='\n'.join(rows[i].strip() for i in range(a,b)).strip()
        if '【' in text or '\ufffd' in text:raise ValueError('Unresolved source artifact')
        return re.sub(r'^\s*[-–]\s*','— ',text,flags=re.M)
    ps=find(r'^PSALMODY$');rd=find(r'^READING\b',ps or 0);resp=find(r'^RESPONSORY$',rd or 0)
    gospel=find(r'^(?:BENEDICTUS|MAGNIFICAT)\b',resp or 0);inter=find(r'^INTERCESSIONS$',gospel or 0)
    father=find(r'^Our Father',inter or 0);coll=find(r'^(?:COLLECT|PRAYER)$',father or 0)
    end=find(r'^May the Lord bless us',coll or 0)
    if any(x is None for x in [ps,rd,resp,gospel,inter,father]):raise ValueError('Incomplete Office witness')
    out={'source':url,'edition':'first','antiphons':[],'psalmodyRefs':[]};current=None;prayers={}
    for n in range(ps+1,rd):
        text=rows[n].strip();m=re.match(r'^Antiphon(?:\s+[123])?\s*:?\s*(.+)$',text)
        if m:
            ant=m[1].strip()
            if current is not None and ant==out['antiphons'][current]:continue
            if ant in out['antiphons']:raise ValueError('Out-of-order antiphon')
            current=len(out['antiphons']);out['antiphons'].append(ant);out['psalmodyRefs'].append(None)
        if current is not None and out['psalmodyRefs'][current] is None:
            p=re.match(r'^Psalm\s+(\d+)',text);c=re.match(r'^Canticle\s*[^A-Za-z0-9]*\s*((?:See )?(?:[123] )?[A-Za-z]+\s+\d+:.*)$',text)
            if p:out['psalmodyRefs'][current]='Psalm '+p[1]
            elif c:out['psalmodyRefs'][current]='Canticle – '+c[1]
        prayer=re.match(r'^Psalm Prayer:\s*(.+)$',text)
        if prayer and current is not None:prayers[str(current)]=prayer[1]
    if len(out['antiphons'])!=3 or not all(out['psalmodyRefs']):raise ValueError('Incomplete psalmody')
    if prayers:out['psalmPrayers']=prayers
    out['responsory']=between(resp+1,gospel)
    ant=find(r'^Antiphon\s*:',gospel+1)
    if ant is None or ant>=inter:raise ValueError('Missing Gospel antiphon')
    out['gospelAntiphon']=' '.join(re.sub(r'^Antiphon\s*:\s*','',between(ant,inter)).split())
    out['intercessions']=between(inter+1,father)
    if not common:
        out['collect']=between(coll+1,end)+'\n— Amen.'
    reading=re.sub(r'^READING\s*:?\s*','',rows[rd]).strip()
    if not reading:reading=rows[rd+1].strip()
    if not re.match(r'^(?:See )?(?:[123] )?[A-Za-z]+\s+\d+:\d',reading):raise ValueError('Missing reading reference')
    out['readingRef']=reading
    return out

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('captures',type=Path);p.add_argument('output',type=Path);a=p.parse_args()
    records={};rejected={}
    for url,capture in json.loads(a.captures.read_text()).items():
        if 'liturgies.net' not in url:continue
        try:records[url]=extract(capture,url,common=any(part in url for part in ['/holywomen/','/pastors/']))
        except ValueError as exc:rejected[url]=str(exc)
    a.output.write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'accepted':len(records),'rejected':rejected},indent=2))
if __name__=='__main__':main()
