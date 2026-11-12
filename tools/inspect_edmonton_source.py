"""Inspect public source structure. Never publish liturgical prayer text."""
import json, urllib.request, concurrent.futures
from bs4 import BeautifulSoup
BASE='https://eeparchy.com'
def fetch(url):
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'Ora source verification (personal devotional calendar)'})
        with urllib.request.urlopen(req,timeout=35) as r:
            html=r.read().decode('utf-8'); status=r.status
        soup=BeautifulSoup(html,'html.parser')
        main=soup.find('main') or soup
        links=[{'href':a.get('href'),'text':a.get_text(' ',strip=True)} for a in main.find_all('a',href=True) if '/calendar/202' in a['href']]
        h1=main.find('h1')
        out={'url':url,'status':status,'title':h1.get_text(' ',strip=True) if h1 else '', 'day_count':len(links),'samples':links[:2]}
        if '/calendar/' in url:
            out['parents']=[{'tag':p.name,'attrs':p.attrs} for p in list(h1.parents)[:4]] if h1 else []
            out['headings']=[{'tag':h.name,'attrs':h.attrs,'title':h.get_text(' ',strip=True)} for h in main.find_all(['h1','h2'])][:14]
            out['scripts']=[{'attrs':s.attrs,'chars':len(s.string or '')} for s in soup.find_all('script')]
            out['first_nodes']=[{'tag':n.name,'attrs':n.attrs,'text':n.get_text(' ',strip=True)[:120]} for n in list(h1.next_siblings)[:7] if getattr(n,'name',None)] if h1 else []
            labels=[]
            for n in main.find_all(['p','h2','h3','h4','strong','b']):
                if n.get_text(' ',strip=True).lower() in ['epistle','gospel']:
                    labels.append({'tag':n.name,'attrs':n.attrs,'next':str(n.find_next_sibling())[:250], 'parent':{'tag':n.parent.name,'attrs':n.parent.attrs}})
            out['reference_nodes']=labels[:8]
        return out
    except Exception as e:return {'url':url,'error':str(e)}
urls=[f'{BASE}/calendar?month={m}&year=2026' for m in range(1,13)]+[f'{BASE}/calendar?month=1&year=2027',f'{BASE}/calendar/2026-11-12']
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    print(json.dumps(list(pool.map(fetch,urls)),ensure_ascii=False,indent=2))
