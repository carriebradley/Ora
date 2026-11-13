/* Full-deck sacred-art rotation; seasonal art leads without excluding other works. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.SacredArt=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const traditional=new Set(['The Last Supper','Pietà','The Annunciation','Ghent Altarpiece','Adoration of the Magi','The Baptism of Christ','The Descent from the Cross','The Resurrection','Holy Trinity']);
  const eligible=(art,rite)=>rite==='byz'?art.tr==='East':rite==='sarum'?art.tr==='West'&&traditional.has(art.t):art.tr==='West';
  const rotate=(list,n)=>{if(!list.length)return [];const at=((n%list.length)+list.length)%list.length;return list.slice(at).concat(list.slice(0,at));};
  function order(works,rite,iso,tags=new Set()){
    const day=Math.floor(Date.parse(iso+'T00:00:00Z')/864e5);
    const all=rotate(works.filter(a=>eligible(a,rite)),day);
    const seasonal=all.filter(a=>a.tags?.some(t=>t!=='general'&&tags.has(t)));
    if(!seasonal.length||day%3===0)return all;
    const featured=rotate(seasonal,day);
    return featured.concat(all.filter(a=>!featured.includes(a)));
  }
  return {eligible,order};
});
