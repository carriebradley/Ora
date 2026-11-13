const {test}=require('node:test');
const assert=require('node:assert/strict');
const R=require('../roman-office-texts.js'),D=require('../roman-office-texts-data.js');
const L=require('../calendar.js'),H=require('../hours.js');
const date=s=>new Date(s+'T00:00:00Z');
const us={epiphany:'sunday',ascension:'sunday',corpus:'sunday'};

test('all four psalter weeks have three official antiphons, responsories and complete intercessions',()=>{
  for(let week=1;week<=4;week++){
    for(let day=0;day<7;day++)for(const which of ['L','V']){
      const r=R.psalter(week,day===6&&which==='V'?0:day,which,day===6&&which==='V');
      assert.ok(r,`${week}/${day}/${which}`);assert.equal(r.antiphons.length,3);
      assert.match(r.responsory,/Glory to the Father/);
      assert.ok(r.intercessions.length>200);assert.ok(r.collect.length>100);
      assert.doesNotMatch(r.intercessions,/Our Father|Concluding Prayer|Login|Contribute/);
    }
  }
});

test('ordinary weekday prayer sections match independently inspected First Edition witnesses',()=>{
  const monday=H.modern(L,date('2027-01-11'),'L',us);
  assert.match(monday,/I lift up my heart to you, O Lord, and you will hear my morning prayer\./);
  assert.match(monday,/Blessed be the Lord our God, blessed from age to age\./);
  assert.match(monday,/Give us your Spirit, Lord\./);
  assert.match(monday,/Let our work always find its origin in you/);
  assert.doesNotMatch(monday,/Intercessions \(devotional\)|Scriptural refrain:|Short responsory \(traditional\)/);
  const thursday=R.psalter(4,4,'V');
  assert.deepEqual(thursday.antiphons,['He is my comfort and my refuge. In him I put my trust.','Blessed are the people whose God is the Lord.','Now the victorious reign of our God has begun.']);
});

test('Sunday proper canticle antiphons and collects are never recycled by psalter week',()=>{
  const plan=H.modernPsalmody(L,date('2027-06-27'),'L',us);
  const selected=R.select(L,plan.d,'L',us,plan);
  assert.ok(selected.intercessions);assert.ok(selected.antiphons);
  assert.equal(selected.id,'ord-w13-sun-mp');
  assert.match(selected.collect,/grace of adoption/);assert.match(selected.gospelAntiphon,/Take courage, daughter/);
  const feast=H.modernPsalmody(L,date('2027-06-29'),'L',us);
  assert.equal(R.select(L,feast.d,'L',us,feast),null);
});

test('Night Prayer uses seven weekday prayers and the special solemnity prayer',()=>{
  const prayers=new Set();
  for(let day=0;day<7;day++){
    const r=R.night({index:day,kind:'weekday',easter:false});
    assert.ok(r.antiphons.length);assert.match(r.responsory,/Into your hands, Lord/);
    assert.match(r.gospelAntiphon,/that awake, we may keep watch with Christ/);
    assert.match(r.collect,/Amen/);prayers.add(r.collect);
  }
  assert.equal(prayers.size,7);
  assert.match(R.night({index:0,kind:'solemnity-ii'}).collect,/we beg you to visit this house/);
  assert.match(R.night({index:0,kind:'sunday-ii'}).collect,/mystery of the rising of Christ/);
  assert.match(R.night(H.romanNightPlan(L,date('2027-05-16'),us)).collect,/mystery of the rising of Christ/);
  const easter=R.night({index:0,kind:'sunday-ii',easter:true});
  assert.match(easter.responsory,/alleluia/i);assert.match(easter.gospelAntiphon,/alleluia/i);
  assert.match(R.night({index:0,kind:'sunday-ii',easter:true,octave:true}).responsory,/This is the day/);
});

test('modern ordinary uses the permitted ICET canticles and acknowledgments while historical offices survive',()=>{
  const morning=H.modern(L,date('2026-11-16'),'L',us),evening=H.modern(L,date('2026-11-16'),'V',us);
  assert.match(morning,/he has come to his people and set them free/);
  assert.match(evening,/My soul proclaims the greatness of the Lord/);
  for(const html of [morning,evening]){
    assert.match(html,/International Commission on English in the Liturgy/);
    assert.match(html,/International Consultation on English Texts/);
    const opening=html.match(/<b>Opening<\/b>(.*?)<\/div>/s)[1];
    assert.doesNotMatch(opening,/Holy Ghost|world without end|every evil, and/);
  }
  assert.match(H.hour(L,date('2026-11-16'),'L'),/Holy Ghost|world without end/);
  assert.equal(R.html('<script>\n— Amen.'),'<p>&lt;script&gt;<br><span class="roman-response">— Amen.</span></p>');
});

test('eligible-text bundle contains no Scripture bodies, hymn lyrics, recordings or Second Edition texts',()=>{
  for(const [key,r]of Object.entries(D.records)){
    assert.equal(r.edition,'first',key);
    assert.match(r.source,/^https:\/\/divineoffice\.org\//);
    assert.deepEqual(Object.keys(r).filter(k=>/^(?:hymn|readingText|psalmText|audio|secondEdition)$/.test(k)),[]);
    for(const value of Object.values(r))if(typeof value==='string')assert.doesNotMatch(value,/Login to|Contribute now|Surgeworks|Recording copyright|\u3010/);
  }
});
