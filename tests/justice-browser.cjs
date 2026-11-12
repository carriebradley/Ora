const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async(page,base,artifacts)=>{
 const cards='#app > .justice-daily > .card, #app > section.card, #app > details.card';
 const distinct=async()=>{
  const styles=await page.locator(cards).evaluateAll(cards=>cards.map(c=>{const icon=c.querySelector('[data-justice-icon]'),style=getComputedStyle(c);return {border:style.borderLeftColor,right:style.borderRightColor,icon:icon?.dataset.justiceIcon,color:icon?getComputedStyle(icon).color:''};}));
  assert.ok(styles.length>=6);assert.equal(new Set(styles.map(s=>s.border)).size,styles.length,'each card has its own color');
  assert.equal(new Set(styles.map(s=>s.icon)).size,styles.length,'each card has its own icon');
  for(const s of styles){assert.ok(s.icon);assert.equal(s.color,s.border,'icon matches its card');assert.equal(s.right,s.border,'both edges match');}
 };
 await page.goto(`${base}index.html?tab=justice&date=2026-11-12`);
 await page.waitForFunction(()=>document.querySelector('.justice-teaching-text li'));
 assert.equal(await page.locator('.justice-teaching-text li').count(),6,'all six medieval teaching points are together');
 assert.match(await page.locator('.justice-teaching').innerText(),/The friars/);
 assert.doesNotMatch(await page.locator('#app').innerText(),/\b\d+ of \d+\b|continued on later days/);
 await distinct();await page.screenshot({path:path.join(artifacts,'justice-complete-teaching.png'),fullPage:true});
 await page.locator('.justice-library > summary').click();
 await page.locator('[data-act="jtab"][data-v="readings"]').click();
 await page.waitForFunction(()=>document.querySelector('.justice-full-reading'));
 const source=await page.evaluate(async()=>{const d=await(await fetch('readings.json')).json();return JusticeReadings.combine(d._justice.items)[0];});
 await page.locator('.justice-full-reading > summary').first().click();
 const normalize=s=>s.replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/\s+/g,' ').trim();
 const full=normalize(await page.locator('.justice-full-reading').first().innerText());
 assert.ok(full.includes(normalize(source.paras[0])),'first saved section is available');
 assert.ok(full.includes(normalize(source.paras.at(-1))),'last saved section is available immediately');
 await page.goto(`${base}index.html?tab=justice&date=2026-11-13`);
 await page.waitForFunction(()=>document.querySelector('.justice-reading'));
 assert.equal(await page.locator('.justice-charity').count(),1,'saints sharing the date occupy a single card');
 assert.equal(await page.locator('.charity-saint').count(),2,'both saints are retained');
 await distinct();
 const continuation=page.locator('.justice-reading-rest');
 if(await continuation.count()){await continuation.locator('summary').click();assert.ok((await continuation.locator('p').count())>0);}
 assert.doesNotMatch(await page.locator('.justice-reading').innerText(),/\b\d+ of \d+\b|continued on later days/);
 console.log('Social Teaching: distinct card colors/icons, complete medieval article, same-card continuation and every saved source part accessible passed.');
};
