"""Import calendar facts/citations only; never republishes prayers or Scripture prose.
Sources: Edmonton daily pages and New Westminster fixed Menaion.
Usage: python tools/import_edmonton_calendar.py --year 2026
Requires beautifulsoup4. Failures are explicit; a missing date is never invented.
"""
import argparse, calendar, concurrent.futures, datetime as dt, json, re, time, urllib.request
from pathlib import Path
from bs4 import BeautifulSoup
BASE='https://eeparchy.com'
MENAION='https://nweparchy.ca/menaion/'
MONTHS=list(calendar.month_name)
def clean(s):return re.sub(r'\s+',' ',s).strip()
def fetch(url):
    for attempt in range(2):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'Ora calendar source review; factual references only'})
            with urllib.request.urlopen(req,timeout=35) as r:
                html=r.read().decode('utf-8')
                headers={k:r.headers.get(k,'') for k in ['Access-Control-Allow-Origin','X-Frame-Options','Content-Security-Policy']}
            return BeautifulSoup(html,'html.parser'),headers
        except Exception:
            if attempt:raise
            time.sleep(1)
def fixed_menaion():
    soup,_=fetch(MENAION); out={}; month=None
    for row in soup.find_all('tr'):
        cells=row.find_all(['td','th'],recursive=False)
        values=[clean(c.get_text(' ',strip=True)) for c in cells]
        if len(cells)<4:
            for n in range(1,13):
                if re.match(r'^'+MONTHS[n]+r'\b', ' '.join(values),re.I):month=n
            continue
        if not month or not values[0].isdigit():continue
        day=int(values[0]); raw=values[1]
        title=re.split(r'\b(?:On this day|On the following|On the next|On the Sunday|Saturday before|Saturday after|Sunday before|Sunday after|Sunday of the Holy Forefathers)',raw,1,flags=re.I)[0].strip()
        symbol=next((s for s in ['🕀','🕁','🕂','🕃'] if s in raw),'')
        title=clean(re.sub('[🕀🕁🕂🕃]','',title))
        if title:out[f'{month:02d}-{day:02d}']={'title':title,'symbol':symbol}
    if len(out)<360:raise ValueError(f'Menaion schema changed: only {len(out)} fixed dates')
    return out
def month_index(year,month):
    url=f'{BASE}/calendar?month={month}&year={year}';soup,_=fetch(url);out={}
    for a in (soup.find('main') or soup).find_all('a',href=True):
        match=re.search(r'/calendar/(\d{4}-\d{2}-\d{2})$',a['href'])
        if match and match[1].startswith(f'{year}-{month:02d}-'):
            value=clean(a.get_text(' ',strip=True))
            value=re.sub(r'^\d{1,2}\s*'+MONTHS[month]+r'\s*','',value)
            out[match[1]]=value
    return out
CITATION=re.compile(r'^(?:[1-4]\s*)?[A-Za-z][A-Za-z .]+\s+\d+(?::\s*\d+)?(?:[a-c\d\s:;,().\-–—]+)?$')
def daily(iso,summary):
    soup,headers=fetch(f'{BASE}/calendar/{iso}');main=soup.find('main') or soup
    article=main.find('article') or main;heading=article.find('h1')
    if not heading:raise ValueError('no day heading')
    header=heading.find_parent('header')
    rubric=clean(' '.join(p.get_text(' ',strip=True) for p in header.find_all('p'))) if header else ''
    title=clean(heading.get_text(' ',strip=True)).replace(';.', ';')
    services=article.select('.liturgical-day-service-body')
    refs=[]
    if services:
        for p in services[0].find_all(['p','h3','h4']):
            label=clean(p.get_text(' ',strip=True))
            if re.fullmatch(r'(Epistle|Gospel)(?:\s*\([^)]*\))?',label,re.I):
                sibling=p.find_next_sibling()
                if sibling:
                    citation=clean(sibling.get_text(' ',strip=True)).replace('–','-').replace('—','-')
                    if len(citation)<200:
                        parts=re.split(r'\s*[;·]\s*(?=(?:[1-4]\s*)?[A-Z])',citation)
                        if parts and all(CITATION.fullmatch(part) for part in parts):
                            for part in parts:
                                pair=['Gospel' if label.lower().startswith('gospel') else 'Epistle',part]
                                if pair not in refs:refs.append(pair)
    tone=re.search(r'(?:(?:Octoechos )?Tone)\s+(\d)',title,re.I)
    rank=next((r for r in ['Feast of the Lord','Feast of the Mother of God','All-Night Vigil Feast','Polyeleos Feast','Saint with Great Doxology','Saint with Six Stichera'] if r.lower() in rubric.lower()),'')
    source=f'{BASE}/calendar/{iso}'
    return {'title':title,'rubric':rubric,'rank':rank,'tone':int(tone[1]) if tone else 0,'references':refs,'source':source,'services':[clean(h.get_text(' ',strip=True)) for h in article.select('.liturgical-service-tabs__print-heading')],'headers':headers}
def build(year):
    fixed=fixed_menaion()
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        months=list(pool.map(lambda m:month_index(year,m),range(1,13)))
    days={};withheld={};published={k:v for m in months for k,v in m.items()}
    rejected_months=set()
    for month,entries in enumerate(months,1):
        sundays=[(iso,title) for iso,title in entries.items() if 'Sunday' in title.split(';')[0]]
        wrong=[iso for iso,_ in sundays if dt.date.fromisoformat(iso).weekday()!=6]
        right=[iso for iso,_ in sundays if dt.date.fromisoformat(iso).weekday()==6]
        if len(wrong)>=2 and not right:rejected_months.add(month)
    candidates={}
    for iso,summary in published.items():
        if int(iso[5:7]) in rejected_months:
            withheld[iso]='Source month has repeated Sunday/weekday date conflicts; import withheld.'
        elif iso.endswith('-04-30') and re.search('Jeremiah',summary,re.I):
            withheld[iso]='Jeremiah appears one day early compared with the fixed Menaion; import withheld.'
        elif 'Sunday' in summary.split(';')[0] and dt.date.fromisoformat(iso).weekday()!=6:
            withheld[iso]='Sunday title on a weekday; import withheld.'
        else:candidates[iso]=summary
    def one(pair):
        iso,summary=pair
        try:return iso,daily(iso,summary),None
        except Exception as e:return iso,None,str(e)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for iso,entry,error in pool.map(one,candidates.items()):
            if error:withheld[iso]='Source fetch or parse failed: '+error
            else:
                # No remote headers, prayer texts, Scripture prose or personal data are bundled.
                entry.pop('headers',None);days[iso]=entry
    if len(days)<150:raise ValueError(f'Unexpectedly low source coverage: {len(days)}. Review before replacing data.')
    for iso,words in {f'{year}-11-11':['Menas','Theodore'],f'{year}-11-12':['Josaphat'],f'{year}-11-15':['Sunday'],f'{year}-12-09':['Conception']}.items():
        if iso not in days or not all(w.lower() in days[iso]['title'].lower() for w in words):raise ValueError('Source anchor failed: '+iso)
    return {'year':year,'retrieved':dt.datetime.now(dt.timezone.utc).isoformat(),'calendarSource':BASE+'/calendar','menaionSource':MENAION,'days':dict(sorted(days.items())),'fixed':fixed,'withheld':dict(sorted(withheld.items())),'publishedMonths':{str(i+1):len(m) for i,m in enumerate(months)},'note':'Facts and Scripture citations only. No full liturgical translations are reproduced. Missing and inconsistent source dates use explicitly labelled fixed-Menaion/calculated information.'}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--year',type=int,default=2026);p.add_argument('--out');p.add_argument('--repair-missing',action='store_true');args=p.parse_args()
    out=Path(args.out or f'edmonton-{args.year}.js')
    if args.repair_missing:
        old=out.read_text(encoding='utf-8');data=json.loads(old.split('function(){return ',1)[1].rsplit(';});',1)[0])
        for iso,e in data['days'].items():
            if not e['references']:
                updated=daily(iso,'');updated.pop('headers',None);data['days'][iso]=updated
        data['retrieved']=dt.datetime.now(dt.timezone.utc).isoformat()
    else:data=build(args.year)
    content='/* Official dated calendar facts and Scripture references; no prayer translations. */\n(function(root,factory){if(typeof module===\'object\'&&module.exports)module.exports=factory();else root.EDMONTON_2026=factory();})(typeof self!==\'undefined\'?self:this,function(){return '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';});\n'
    out.write_text(content,encoding='utf-8')
    print(json.dumps({'year':args.year,'imported_days':len(data['days']),'withheld_days':len(data['withheld']),'fixed_dates':len(data['fixed']),'published_months':data['publishedMonths'],'anchors':{iso:data['days'][iso] for iso in [f'{args.year}-11-11',f'{args.year}-11-12',f'{args.year}-11-15',f'{args.year}-12-09']}},ensure_ascii=False,indent=2))
