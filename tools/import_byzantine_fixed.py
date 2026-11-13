#!/usr/bin/env python3
"""Selected common Byzantine prayers from G. V. Shann (1891), public domain.

This is historical Orthodox English, not a claim of current Catholic translation
approval. Small Compline explicitly refers back to Great Compline's closing
prayers on printed page 84. Missing lines and unresolved extraction markers fail.
Restore drop-cap initials, remove page headers, normalize known encoding errors
and obvious missing punctuation. See docs/ORA-UPDATE-2026-11-13-v271.md.
"""
from pathlib import Path
import json,re
import argparse
parser=argparse.ArgumentParser(description='Import selected public-domain Shann prayers and eight Resurrection troparia from checked line-numbered captures.')
parser.add_argument('capture',type=Path)
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
caps=json.loads(args.capture.read_text());rows={}
for cap in caps:
 for item in cap.get('content',[]):
  if item['type']=='text':
   for m in re.finditer(r'^L(\d+): ?(.*)$',item['text'],re.M):rows[int(m[1])]=m[2]
def line(*ns):
 s=' '.join(rows[n] for n in ns)
 for a,b in [('‚Äô','’'),('‚Äî','—'),('life - creating','life-creating'),('in corruptible','incorruptible')]:s=s.replace(a,b)
 if re.search(r'【|√|‚Ä|\ufffd',s):raise ValueError(s)
 return s
p=root/'byzantine-office.js';s=p.read_text();a=s.index('const fixed=')+len('const fixed=');d,end=json.JSONDecoder().raw_decode(s[a:])
d.update({
 'comeWorship':'O come, let us worship God our King.\nO come, let us worship and fall down before Christ God, our King.\nO come, let us worship and fall down before Christ himself, our God and King.',
 'worthy':'I'+line(1736),
 'moreHonourable':'The more honourable'+line(1736).split('The more honourable',1)[1],
 'vespersVouchsafe':'V'+line(797,799,801,804),
 'motherOfGod':'O thou '+line(2028,2031).removeprefix('THOU ')+'\n\n'+line(2032)+'\n\n'+line(2033,2036),
 'beforeSleep':'A'+line(2039)+'\n\n'+line(2040,2043),
 'mostGlorious':line(2045),
 'trinityProtection':line(2047).replace(' Glory. Both now.',''),
})
d['beforeSleep']=d['beforeSleep'].replace('nightly lust Subdue','nightly lust. Subdue')
d['glory']='Glory to the Father, and to the Son, and to the Holy Spirit, now and ever, and unto ages of ages. Amen.'
for k,v in d.items():d[k]=re.sub(r'^([A-Z]{2,})',lambda m:m[1].capitalize(),v)
s=s[:a]+json.dumps(d,ensure_ascii=False,indent=2)+s[a+end:]
# Keep original lettering in source; display headings/prayers without drop-cap capitals.
for k,old,new in [('doxology','GLORY','Glory'),('creed','I BELIEVE','I believe'),('prayerHours','THOU','Thou')]:
 s=s.replace(json.dumps(old)[1:-1],new,1)
res={}
for tone,ns,drop in [(1,(8685,8691),'T'),(2,(8714,),'W'),(3,(8739,),'L'),(4,(8765,),'T'),(5,(8787,),'Y'),(6,(8812,),'A'),(7,(8833,),'T'),(8,(8857,),'T')]:res[str(tone)]={'text':drop+line(*ns),'pages':{1:'417–418',2:'419',3:'420',4:'421',5:'422',6:'423',7:'424',8:'425'}[tone]}
res={k:{**v,'text':re.sub(r'^([A-Z]{2,})',lambda m:m[1].capitalize(),v['text'])} for k,v in res.items()}
start=s.index(' const resurrection=');end=s.index(' // The caller supplies dated calendar facts',start);s=s[:start]+' const resurrection='+json.dumps(res,ensure_ascii=False,indent=2)+';\n'+s[end:];s=s.replace('return {plan,fixed,fixedSource};','return {plan,fixed,fixedSource,resurrection};');s=s.replace('Shared fixed prayers in historical English; daily canons, appointed hymns and seasonal orders still require the selected church’s service books.','Shared fixed prayers and Resurrection troparia in historical English; daily canons, other appointed hymns and seasonal orders still require the selected church’s service books.');p.write_text(s)
print('Historical fixed prayers:',len(d),'Resurrection tones:',len(res))
