/* Restore complete saved readings without mixing sources or inventing missing parts. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.JusticeReadings=factory();})(typeof self!=='undefined'?self:this,function(){
 function combine(items){
  const groups=new Map();
  for(const [index,item] of items.entries()){
   const numbered=typeof item.part==='string'?item.part.match(/^(\d+) of (\d+)$/):null;
   const key=item.part?JSON.stringify([item.author,item.work,item.url]):'single:'+index;
   if(!groups.has(key))groups.set(key,[]);
   groups.get(key).push({item,number:numbered?+numbered[1]:1,total:numbered?+numbered[2]:1,valid:!item.part||!!numbered});
  }
  return [...groups.values()].map(parts=>{
   parts.sort((a,b)=>a.number-b.number);
   const total=parts[0].total;
   const complete=total>0&&parts.length===total&&parts.every((p,i)=>p.valid&&p.total===total&&p.number===i+1&&Array.isArray(p.item.paras)&&p.item.paras.length&&p.item.paras.every(t=>typeof t==='string'&&t.trim()));
   const paras=complete?parts.flatMap(p=>p.item.paras.slice()):[];
   const {author,work,url}=parts[0].item;
   return {author,work,url,complete,paras,words:paras.reduce((n,p)=>n+p.trim().split(/\s+/).length,0)};
  });
 }
 return {combine};
});
