#!/usr/bin/env python3
"""Import selected ICEL-owned First Edition nonbiblical readings and responsories.

Only the ancient/medieval source authors explicitly listed below are eligible.
The published noncommercial-website permission and required notices are documented
in docs/roman-office-text-permissions.md. This does not license Scripture bodies,
hymns, recordings, modern source authors or other publishers' translations.
Input: line-numbered research captures from the seven specified witness URLs.
"""
import argparse,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ACK='The English translation of The Liturgy of the Hours (Four Volumes) © 1974, International Commission on English in the Liturgy Corporation. All rights reserved.'
SOURCES={
 'adv-w01-sun-or':('Cyril of Jerusalem|Catechesis 15, 1-3','Cyril'),
 'adv-w01-tue-or':('Gregory Nazianzen|Discourse 45, 9.22.26.28','Gregory'),
 'lent-hw-tue-or':('Basil the Great|On the Holy Spirit 15, 35','Basil'),
 'lent-hw-wed-or':('Augustine|On the Gospel of John 84, 1-2','Augustine'),
 '1117-or':('Conrad of Marburg|Letter of 1232','Conrad'),
 '1130-or':('John Chrysostom|On the Gospel of John 19, 1','Chrysostom'),
 '1207-or':('Ambrose of Milan|Letter 2, 1-2.4-5.7','Ambrose')}
def extract(text):
 result={}
 for part in text.split('\n--------------------------------------------------------------------------------\n'):
  url=re.search(r'https://divineoffice.org/([\w-]+)/',part)
  if not url or url[1] not in SOURCES:continue
  key,author=SOURCES[url[1]];rows={int(n):v for n,v in re.findall(r'^L(\d+): ?(.*)$',part,re.M)}
  start=next((n for n,t in sorted(rows.items()) if t.lower()=='second reading'),None)
  if start is None:continue
  if author.lower() not in rows.get(start+1,'').lower():raise ValueError('Unexpected author')
  title=rows[start+2];body=start+3
  end=next((n for n,t in sorted(rows.items()) if n>body and t.startswith('RESPONSORY')),None)
  stop=next((n for n,t in sorted(rows.items()) if end and n>end and re.match(r'^(?:TE DEUM|CONCLUDING PRAYER|CANTICLE)',t)),None)
  if not end or not stop or any(n not in rows for n in range(body,stop)):raise ValueError('Incomplete boundaries: '+key)
  paras=[rows[n] for n in range(body,end) if rows[n]]
  responsory='\n'.join(rows[n] for n in range(end+1,stop)).strip()
  if not paras or len(responsory)<50 or re.search(r'【|\ufffd|Login to',str(paras)+responsory):raise ValueError('Unresolved source artifact')
  result[key]={'p':paras,'title':title,'responsory':responsory,'responsoryRef':rows[end].removeprefix('RESPONSORY').strip(),'rights':'icel-web-policy','edition':'first','acknowledgment':ACK,'sourceUrl':url[0],'src':'First Edition Liturgy of the Hours · '+ACK+' Source: '+url[0]+' No ICEL affiliation or endorsement is claimed.'}
 return result
def main():
 ap=argparse.ArgumentParser();ap.add_argument('captures',nargs='+',type=Path);args=ap.parse_args();out={}
 for path in args.captures:
  data=json.loads(path.read_text());text='\n'.join(c['text'] for c in data['content'] if c['type']=='text');out.update(extract(text))
 if len(out)!=len(SOURCES):raise ValueError('Not all seven witnesses are complete')
 p=ROOT/'oortext.json';d=json.loads(p.read_text());d.update(out);p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n');print('Added',len(out),'approved readings and responsories; total',len(d))
if __name__=='__main__':main()
