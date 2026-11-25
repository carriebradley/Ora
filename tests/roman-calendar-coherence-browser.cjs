const assert=require('node:assert/strict');

const boundaries=[
  [
    {
      date:'2026-11-29', title:'1st Sunday of Advent', rank:'Sunday', season:'Advent',
      gospel:'Mark 13:33-37', eveningReading:'Philippians 4:4-7',
      night:'Night Prayer after Second Vespers · 1st Sunday of Advent'
    },
    {
      date:'2026-11-30', title:'Saint Andrew, Apostle', rank:'Feast', season:'Advent',
      gospel:'Matthew 4:18-22', eveningReading:'Ephesians 4:11-13'
    }
  ],
  [
    {
      date:'2026-12-07', title:'Saint Ambrose, Bishop and Doctor', rank:'Memorial', season:'Advent',
      gospel:'Luke 5:17-26', eveningReading:'Romans 8:29-30', firstVespers:true,
      night:'Night Prayer after First Vespers · Immaculate Conception of the Blessed Virgin Mary'
    },
    {
      date:'2026-12-08', title:'Immaculate Conception of the Blessed Virgin Mary',
      rank:'Solemnity', season:'Advent', gospel:'Luke 1:26-38', eveningReading:'Romans 5:20-21',
      night:'Night Prayer after Second Vespers · Immaculate Conception of the Blessed Virgin Mary'
    }
  ],
  [
    {
      date:'2027-04-04', title:'Second Sunday of Easter (Sunday of Divine Mercy)',
      rank:'Sunday', season:'Easter Time', gospel:'John 20:19-31', eveningReading:'Hebrews 10:12-14',
      night:'Night Prayer after Second Vespers · Second Sunday of Easter (Sunday of Divine Mercy)'
    },
    {
      date:'2027-04-05', title:'Annunciation of the Lord', rank:'Solemnity', season:'Easter Time',
      gospel:'Luke 1:26-38', eveningReading:'1 John 1:1-2',
      night:'Night Prayer after Second Vespers · Annunciation of the Lord'
    }
  ]
];

module.exports=async function(browser,base){
  // Use the published Gospel citations as a controlled feed. This test is
  // independent of how far ahead the production RSS import has reached.
  const feed=Object.fromEntries(boundaries.flat().map(({date,title,gospel})=>[
    date,{title,sections:[{label:'Gospel',cite:gospel}]}
  ]));
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  try{
    await context.route('**/*',route=>{
      const url=route.request().url();
      if(url===base+'readings.json')return route.fulfill({json:feed});
      return url.startsWith(base)?route.continue():route.abort();
    });
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    const openTab=tab=>page.locator('#nav [data-tab="'+tab+'"]').click();
    const openHour=hour=>page.locator('[data-act="kind"][data-v="'+hour+'"]').click();
    for(const pair of boundaries){
      await page.goto(base+'index.html?tab=today&rite=roman&date='+pair[0].date);
      for(const expected of pair){
        const {date,title,rank,season,gospel,eveningReading,firstVespers,night}=expected;
        const selectedDate=()=>page.locator('#dp').inputValue();
        await openTab('today');
        assert.equal(await selectedDate(),date);
        const roman=page.locator('.glance [data-act="rite"][data-v="roman"]');
        assert.equal(await roman.locator('.gd').textContent(),title,date);
        assert.equal(await roman.locator('.gb').textContent(),rank,date);

        await openTab('more');
        const liturgy=page.locator('.more-liturgy');
        if(!(await liturgy.evaluate(el=>el.open)))await liturgy.locator(':scope > summary').click();
        await liturgy.locator('[data-act="liturgyview"][data-v="mass"]').click();
        const mass=liturgy.locator('.simple-liturgy');
        assert.equal(await mass.locator('.simple-liturgy-title').textContent(),title,date);
        const source=await mass.locator('[data-text-id="roman"]').evaluate(el=>({
          date:el.dataset.dayDate,rank:el.dataset.dayRank,season:el.dataset.daySeason
        }));
        assert.deepEqual(source,{date,rank,season},date);

        await mass.locator('[data-act="goReadings"]').click();
        await page.locator('.reading-group .reading-reference').filter({hasText:gospel}).waitFor();
        assert.equal(await selectedDate(),date);
        assert.equal(await page.locator('.reading-main-title').textContent(),title,date);
        const stamp=date.slice(5).replace('-','')+date.slice(2,4);
        const usccb='https://bible.usccb.org/bible/readings/'+stamp+'.cfm';
        assert.equal(await page.getByRole('link',{name:'USCCB page',exact:true}).getAttribute('href'),usccb,date);

        await openTab('pray');
        await openHour('evening');
        const evening=await page.locator('#st0').evaluate(el=>({
          heading:el.querySelector('.roman-office-heading')?.textContent||'',
          reading:Array.from(el.querySelectorAll('.sec > b'),b=>b.textContent)
            .find(label=>label.startsWith('Short reading · '))
        }));
        assert.equal(await selectedDate(),date);
        assert.equal(evening.heading.startsWith('Evening Prayer I · '),Boolean(firstVespers),date);
        assert.equal(evening.reading,'Short reading · '+eveningReading,date);

        await openHour('night');
        const nightHeading=page.locator('#st0 .roman-office-heading');
        if(night)assert.equal(await nightHeading.textContent(),night,date);
        else assert.equal(await nightHeading.count(),0,date+' uses weekday Night Prayer');
        assert.equal(await selectedDate(),date);

        if(expected===pair[0])await page.locator('#hdr [data-act="next"]').click();
      }
    }
    assert.deepEqual(errors,[],'no app errors across the Roman calendar boundaries');
    console.log('Roman calendar coherence: Today, Mass, readings, Vespers and Night Prayer passed across all three boundaries.');
  }finally{
    await context.close();
  }
};
