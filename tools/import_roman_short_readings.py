#!/usr/bin/env python3
"""Extract public-domain whole-verse short readings from checked DRBO captures.

The liturgical appointment comes from Ora's First Edition witness. The biblical
wording is Douay–Rheims–Challoner, not the NAB or an ICEL translation. Lettered
half-verses expand to whole verses and are explicitly marked. Unaligned textual
traditions are rejected, not filled with a different passage.
"""
import argparse,json,re
from pathlib import Path

CODES={'Genesis':1,'Exodus':2,'Leviticus':3,'Deuteronomy':5,'1 Kings':11,'2 Samuel':10,'Nehemiah':16,'Tobit':17,'Judith':18,'Job':20,'Song of Songs':24,'Wisdom':25,'Isaiah':27,'Jeremiah':28,'Ezekiel':31,'Hosea':33,'Joel':34,'Micah':38,'Zechariah':43,'Malachi':44,'Acts':51,'Romans':52,'1 Corinthians':53,'2 Corinthians':54,'Galatians':55,'Ephesians':56,'Philippians':57,'Colossians':58,'1 Thessalonians':59,'2 Thessalonians':60,'1 Timothy':61,'2 Timothy':62,'Titus':63,'Hebrews':65,'James':66,'1 Peter':67,'2 Peter':68,'1 John':69,'Revelation':73}

def verses(capture):
    rows=re.findall(r'^L\d+: ?(.*)$',capture,re.M)
    body='\n'.join(rows)
    markers=list(re.finditer(r'【\d+†\s+(\d+)\s*】',body))
    result={}
    for i,m in enumerate(markers):
        text=body[m.end():markers[i+1].start() if i+1<len(markers) else len(body)]
        # Commentary may be inserted between verses; keep only the verse.
        text=re.split(r'\[\d+\]\s*["“]|【\d+†< prev】|\n\s*TOP OF PAGE',text,maxsplit=1)[0]
        text=re.sub(r'【[^】]+】','',text)
        text=' '.join(text.split()).strip()
        if not text or any(t in text for t in ['Douay-Rheims Bible','< prev','TOP OF PAGE','Content type:']):continue
        number=int(m[1])
        if number in result and result[number]!=text:raise ValueError(f'Conflicting verse {number}')
        result[number]=text
    return result

def normalize(raw):
    if raw=='Judith 8:25-27':raise ValueError('Greek/Vulgate passage boundaries need separate alignment')
    value=re.sub(r'^See\s+','',raw).replace('—','-').replace('–','-')
    if raw=='Joel 2:27-3:1a':return 'Joel 2:27-28'
    value=value.replace('Genesis 49-10','Genesis 49:10').replace('Hosea 5:15b-16:2','Hosea 6:1-3a')
    if value.startswith('Tobit 4:'):value='Tobit 4:16,17,19,20'
    if value.startswith('Zechariah 2:14-17'):value='Zechariah 2:10-13'
    if value.startswith('Malachi 3:23-24'):value='Malachi 4:5-6'
    # NAB Micah 5:2–4a = Vulgate 5:3–5a; preserve the final peace clause.
    if value.startswith('Micah 5:2, 3, 4a'):value='Micah 5:3-5a'
    return value

def build(raw,chapters):
    ref=normalize(raw);m=re.match(r'^(.+?)\s+(\d+)\s*:\s*(.*)$',ref)
    if not m or m[1] not in CODES:raise ValueError('Unsupported book/reference')
    book,chapter,tail=m[1],int(m[2]),m[3]
    requested=f'{chapter}:{tail}';selected=[];sources=[]
    def take(c,v):
        code=f'{CODES[book]:02}{c:03}';entry=chapters.get(code)
        if not entry or v not in entry['verses']:raise ValueError(f'Missing verse {book} {c}:{v}')
        text=entry['verses'][v]
        if book=='Micah' and c==5 and v==5 and '4a' in raw:
            prefix='And this man shall be our peace'
            if not text.startswith(prefix):raise ValueError('Micah boundary changed')
            text=prefix+'.'
        if book=='Hosea' and c==6 and v==3 and '16:2' in raw:
            if '. We shall know' not in text:raise ValueError('Hosea boundary changed')
            text=text.split('. We shall know')[0]+'.'
        selected.append(text)
        if entry['source'] not in sources:sources.append(entry['source'])
    for segment in requested.split(';'):
        segment=segment.strip();p=re.match(r'(?:(\d+)\s*:\s*)?(.*)$',segment)
        if p[1]:chapter=int(p[1])
        for item in p[2].split(','):
            item=re.sub(r'(?<=\d)[ab]\b','',item.strip())
            r=re.fullmatch(r'(\d+)(?:\s*-\s*(?:(\d+):)?(\d+))?',item)
            if not r:raise ValueError('Unsupported verse segment: '+item)
            start=int(r[1]);end=int(r[3] or start);last_ch=int(r[2] or chapter)
            if last_ch<chapter or last_ch>chapter+1:raise ValueError('Unverified chapter span')
            for c in range(chapter,last_ch+1):
                code=f'{CODES[book]:02}{c:03}';vs=chapters.get(code,{}).get('verses',{})
                lo=start if c==chapter else 1;hi=end if c==last_ch else max(vs,default=0)
                if lo>hi:raise ValueError('Invalid verse range')
                for v in range(lo,hi+1):take(c,v)
            chapter=last_ch
    display=re.sub(r'(?<=\d)[ab]\b','',ref)
    if book=='Micah' and '4a' in raw:display='Micah 5:3-5a'
    if book=='Hosea' and '16:2' in raw:display='Hosea 6:1-3a'
    return {'ref':display,'officeRef':raw,'text':' '.join(selected),'source':sources,
            'translation':'Douay-Rheims-Challoner','rights':'public-domain',
            'wholeVerses':bool(re.search(r'\d[ab]\b',raw)) and book not in ('Micah','Hosea'),
            'referenceAdjusted':ref!=re.sub(r'^See\s+','',raw).replace('—','-').replace('–','-')}

def lxx_judith(capture):
    body=' '.join(re.findall(r'^L\d+: ?(.*)$',capture,re.M))
    match=re.search(r'\b25\s+(.*?)\s+26\s+(.*?)\s+27\s+(.*?)\s+28\s',body)
    if not match:raise ValueError('Missing Judith LXX verse boundaries')
    text=' '.join(' '.join(match.groups()).split())
    if not text.startswith('Moreover let us give thanks') or not text.endswith('to admonish them.') or 'Laban' not in text:raise ValueError('Judith LXX passage changed')
    return {'ref':'Judith 8:25-27','officeRef':'Judith 8:25-27','text':text,
            'source':['https://ebible.org/eng-lxx2012/JDT08.htm'],
            'translation':'LXX2012','rights':'public-domain','wholeVerses':False,
            'referenceAdjusted':False,'license':'https://ebible.org/find/details.php?id=eng-lxx2012'}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--references',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('captures',type=Path,nargs='+');a=p.parse_args()
    chapters={};failures={};judith=None
    for path in a.captures:
        for url,capture in json.loads(path.read_text()).items():
            if url=='https://ebible.org/eng-lxx2012/JDT08.htm':judith=lxx_judith(capture)
            match=re.search(r'drbo\.org/chapter/(\d{5})\.htm',url)
            if not match:continue
            found=verses(capture)
            if found:chapters[match[1]]={'verses':found,'source':url}
    records={}
    for ref in json.loads(a.references.read_text()):
        try:records[ref]=judith if ref=='Judith 8:25-27' and judith else build(ref,chapters)
        except ValueError as exc:failures[ref]=str(exc)
    a.output.write_text(json.dumps({'translation':'Douay-Rheims-Challoner','records':records,'unresolved':failures},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'imported':len(records),'unresolved':failures},indent=2))
if __name__=='__main__':main()
