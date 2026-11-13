/* Index availability, not certification of the calendar appointment or whole Office. */
const fs=require('node:fs'),vm=require('node:vm');
const c={self:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../oor.js'),'utf8'),c);
const texts=require('../oortext.json'),index=new Map();
for(const e of [...Object.values(c.self.OOR),...Object.values(c.self.OOR_SAINTS).flat()])if(e.a&&e.w)index.set(e.a+'|'+e.w,e);
const available=[],missing=[];
for(const [key]of index)(texts[key]?available:missing).push(key);
console.log(JSON.stringify({scope:'Unique second-reading references in Ora’s temporal and sanctoral index, not a complete-office certification',indexed:index.size,available:available.length,missing:missing.length,bundled:Object.keys(texts).length,approvedIcel:Object.values(texts).filter(r=>r.rights==='icel-web-policy').length,missingReferences:missing.sort()},null,2));
