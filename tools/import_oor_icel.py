#!/usr/bin/env python3
"""Import selected ICEL-owned First Edition nonbiblical readings and responsories.

Only the historical source authors explicitly listed below are eligible.
The published noncommercial-website permission and required notices are documented
in docs/roman-office-text-permissions.md. This does not license Scripture bodies,
hymns, recordings, modern source authors or other publishers' translations.
Input: line-numbered research captures from explicitly listed witness URLs.
Existing readings must be identical if encountered again; partial batches are allowed.
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
 '1207-or':('Ambrose of Milan|Letter 2, 1-2.4-5.7','Ambrose'),
 'adv-w01-mon-or':('Charles Borromeo|Pastoral letter','Charles Borromeo'),
 'adv-w01-wed-or':('Bernard of Clairvaux|Sermon 5 on Advent 1-3','Bernard'),
 'adv-w01-thu-or':('Ephrem, deacon|On the Diatessaron 18, 15-17','Ephrem'),
 'adv-w01-fri-or':('Anselm of Canterbury|Proslogium 1','Anselm'),
 'adv-w01-sat-or':('Cyprian|On the value of patience 13.15','Cyprian'),
 'adv-w02-sun-or':('Eusebius of Caesarea|On Isaiah 40','Eusebius'),
 'adv-w02-mon-or':('John of the Cross|On the ascent of Mount Carmel 2, 22','John'),
 'adv-w02-wed-or':('Augustine|On Psalm 110, 1-3','Augustine'),
 'adv-w02-thu-or':('Peter Chrysologus|Sermon "on peace" 147','Peter Chrysologus'),
 'adv-w02-sat-or':('Isaac of Stella, abbot|Sermon 51','Isaac'),
 'adv-w03-sun-or':('Augustine|Sermon 293, 3','Augustine'),
 'adv-w03-tue-or':('Imitation of Christ|Book 2, 2-3','Imitation'),
 'adv-w03-fri-or':('Augustine|On Psalm 38, 13-14','Augustine'),}
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
 if not out:raise ValueError('No complete eligible witnesses found')
 p=ROOT/'oortext.json';d=json.loads(p.read_text());
 for key,value in out.items():
  if key in d and d[key]!=value:raise ValueError('Refusing to replace existing reading: '+key)
 d.update(out);p.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n');print('Added',len(out),'approved readings and responsories; total',len(d))
if __name__=='__main__':main()
