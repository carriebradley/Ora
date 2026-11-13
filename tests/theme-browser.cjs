const assert=require('node:assert/strict');
module.exports=async(page,base)=>{
 await page.goto(`${base}index.html?tab=more`);
 for(const [choice,device]of [['dark','light'],['light','dark']]){
  await page.emulateMedia({colorScheme:device});
  await page.locator(`[data-act="theme"][data-v="${choice}"]`).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'),choice);
  assert.equal(await page.locator(`[data-act="theme"][data-v="${choice}"]`).getAttribute('aria-pressed'),'true');
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),choice);
  await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),choice);
 }
 await page.locator('[data-act="theme"][data-v="system"]').click();
 for(const mode of ['dark','light']){
  await page.emulateMedia({colorScheme:mode});
  await page.waitForFunction(mode=>document.documentElement.dataset.theme===mode,mode);
 }
 console.log('Appearance: saved light/dark overrides, native controls, reload persistence and live System changes passed.');
};
