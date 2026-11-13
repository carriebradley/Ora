const {test}=require('node:test');
const assert=require('node:assert/strict');
const {ART}=require('../content.js'),S=require('../sacred-art.js');

test('every artwork has a dated, sourced caption with origin uncertainty preserved',()=>{
  for(const a of ART){
    assert.doesNotMatch(a.created,/^c\. |^Probably /,a.t);assert.ok(a.created,a.t);assert.ok(a.origin,a.t);assert.match(a.source,/^https:\/\//,a.t);
    if(a.image){assert.match(a.image,/^https:\/\/(?:collectionapi\.metmuseum\.org|openaccess-cdn\.clevelandart\.org)\//);assert.ok(a.credit);assert.match(a.license,/Public domain|CC0/);}
  }
  assert.match(ART.find(a=>a.t==='Our Lady of Częstochowa').origin,/uncertain/);
  assert.match(ART.find(a=>a.t==='The Baptism of Christ').created,/1437.*1445/);
});

test('Byzantine Another deck contains all 18 distinct Eastern works in every season',()=>{
  for(const tag of ['general','advent','christmas','lent','easter','marian','pentecost']){
    const deck=S.order(ART,'byz','2026-11-13',new Set([tag,'general']));
    assert.equal(deck.length,18);assert.equal(new Set(deck.map(a=>a.q)).size,18);
    assert.ok(deck.every(a=>a.tr==='East'));
  }
});

test('ordinary-day rotation reaches every Eastern work before repeating',()=>{
  const seen=[];
  for(let n=0;n<18;n++){
    const date=new Date(Date.UTC(2026,10,13+n)).toISOString().slice(0,10);
    seen.push(S.order(ART,'byz',date,new Set(['general']))[0].q);
  }
  assert.equal(new Set(seen).size,18);
});

test('seasonal art is preferred without removing the rest of the repertoire',()=>{
  const tags=new Set(['advent','general']);
  const deck=S.order(ART,'byz','2026-12-01',tags);
  assert.ok(deck[0].tags.includes('advent'));
  assert.equal(deck.length,ART.filter(a=>a.tr==='East').length);
  assert.deepEqual(deck,S.order(ART,'byz','2026-12-01',tags));
});

test('Roman and Traditional art retain their existing tradition and period boundaries',()=>{
  const roman=S.order(ART,'roman','2026-11-13'),traditional=S.order(ART,'sarum','2026-11-13');
  assert.equal(roman.length,19);assert.equal(traditional.length,9);
  assert.ok([...roman,...traditional].every(a=>a.tr==='West'));
  assert.ok(traditional.some(a=>a.t==='Ghent Altarpiece'));
  assert.ok(!traditional.some(a=>a.a==='Caravaggio'));
});
