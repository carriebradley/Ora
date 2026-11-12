const assert=require('node:assert/strict');
module.exports=async(browser,base)=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 const page=await context.newPage(),cdp=await context.newCDPSession(page);
 const active=()=>page.locator('#nav [aria-current="page"]').getAttribute('data-tab');
 const drag=async(x,y,dx,dy)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  for(let i=1;i<=8;i++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/8,y:y+dy*i/8,id:1}]});
   await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 };
 const swipe=async(left=true)=>{
  const box=await page.locator('.tab-heading').boundingBox();
  await drag(left?290:100,box.y+box.height/2,left?-190:190,0);
 };
 try{
  await page.goto(`${base}index.html?tab=today&date=2026-11-12&rite=roman`);
  await swipe(false);assert.equal(await active(),'today','first page does not wrap');
  for(const tab of ['pray','readings','justice','calendar','more']){
   await swipe();assert.equal(await active(),tab,'native swipe advances to '+tab);
   assert.equal(await page.locator('#dp').inputValue(),'2026-11-12','swipe preserves the date');
  }
  await swipe();assert.equal(await active(),'more','last page does not wrap');
  for(const tab of ['calendar','justice','readings','pray','today']){await swipe(false);assert.equal(await active(),tab);}
  assert.equal(await page.evaluate(()=>document.activeElement.id),'app','content receives focus');
  let box=await page.locator('.tab-heading').boundingBox(),y=box.y+box.height/2;
  await drag(220,y,-25,0);assert.equal(await active(),'today','small drags do not navigate');
  await drag(12,y,190,0);assert.equal(await active(),'today','browser edge gestures stay available');
  await page.locator('#nav [data-tab="justice"]').click();
  await drag(200,540,4,-230);
  assert.equal(await active(),'justice','vertical scroll does not change tabs');
  assert.ok(await page.evaluate(()=>scrollY)>30,'native vertical scrolling works');
  await page.locator('#nav [data-tab="today"]').click();
  box=await page.locator('.gl[role="button"]').first().boundingBox();
  await drag(280,box.y+box.height/2,-170,0);
  assert.equal(await active(),'today','interactive cards retain their gestures');
  // Exercise cancellation, pinch and selection without browser default actions
  // changing the selection or touch target before the listener sees them.
  const ignored=await page.evaluate(()=>{
   const el=document.querySelector('.tab-heading'),app=document.querySelector('#app');
   const touch=(id,x)=>new Touch({identifier:id,target:el,clientX:x,clientY:200});
   const emit=(type,touches,changed=touches)=>el.dispatchEvent(new TouchEvent(type,{bubbles:true,cancelable:true,touches,targetTouches:touches,changedTouches:changed}));
   emit('touchstart',[touch(1,290)]);emit('touchcancel',[],[touch(1,100)]);emit('touchend',[],[touch(1,100)]);
   emit('touchstart',[touch(1,290)]);emit('touchmove',[touch(1,100),touch(2,180)]);emit('touchend',[],[touch(1,100)]);
   const range=document.createRange();range.selectNodeContents(el);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);
   emit('touchstart',[touch(1,290)]);emit('touchend',[],[touch(1,100)]);selection.removeAllRanges();
   const dialog=document.querySelector('#dlg');dialog.showModal();emit('touchstart',[touch(1,290)]);emit('touchend',[],[touch(1,100)]);dialog.close();
   return document.querySelector('#nav [aria-current="page"]').dataset.tab;
  });
  assert.equal(ignored,'today','cancelled, multiple touches, selection and dialogs do not navigate');
  await swipe();assert.equal(await active(),'pray');
  await page.reload();assert.equal(await active(),'pray','swiped tab persists on refresh');
  await page.locator('#nav [data-tab="calendar"]').click();assert.equal(await active(),'calendar','tap navigation still works');
  console.log('Swipes: native touch in both directions, boundaries, scroll, controls, selection, cancellation, pinch, dialogs and persistence passed.');
 }finally{await context.close();}
};
