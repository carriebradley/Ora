const {test}=require('node:test'),assert=require('node:assert/strict'),M=require('../justice-readings.js');
const item=(part,paras,extra={})=>({author:'Writer',work:'A complete passage',url:'https://example.test/passage',part,paras,...extra});
test('all saved parts are restored in source order without dropping the ending',()=>{
 const parts=[item('2 of 2',['The ending.']),item('1 of 2',['The beginning.','The middle.'])];
 const before=JSON.stringify(parts),joined=M.combine(parts);
 assert.equal(joined.length,1);assert.equal(joined[0].complete,true);
 assert.deepEqual(joined[0].paras,['The beginning.','The middle.','The ending.']);
 assert.equal(JSON.stringify(parts),before,'source data stays unchanged');
});
test('missing, duplicate, conflicting or malformed parts never masquerade as full readings',()=>{
 for(const parts of [[item('1 of 2',['Beginning'])],[item('1 of 2',['Beginning']),item('1 of 2',['Duplicate'])],[item('1 of 2',['Beginning']),item('2 of 3',['Ending'])],[item('part unknown',['Text'])],[item('1 of 1',[])]]){
  const joined=M.combine(parts);assert.equal(joined[0].complete,false);assert.deepEqual(joined[0].paras,[]);
 }
 const mixed=M.combine([item('1 of 2',['First']),item('2 of 2',['Second'],{work:'A different work'})]);
 assert.equal(mixed.length,2);assert.ok(mixed.every(r=>!r.complete));
 assert.equal(M.combine([item(undefined,['Standalone'])])[0].complete,true);
});
test('the bundled reading collection retains every saved paragraph with no inaccessible continuation',()=>{
 const items=require('../readings.json')._justice.items,joined=M.combine(items);
 assert.ok(joined.length>0);assert.ok(joined.every(r=>r.complete));
 const original=items.flatMap(x=>x.paras),restored=joined.flatMap(x=>x.paras);
 assert.equal(restored.length,original.length);
 assert.deepEqual([...restored].sort(),[...original].sort());
});
