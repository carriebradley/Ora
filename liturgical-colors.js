/* Ora's visual feast colours, separate from the source calendar's vestment data. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.LiturgicalColors=factory();
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const blue='#3b729f';
  function marian(day){
    const title=String(day?.title||'');
    if(/^(?:saint|st\.) joseph\b|^(?:saints|sts\.) joachim and ann[ae]\b/i.test(title))return false;
    return /\b(?:theotokos|mother of god|our lady|our blessed lady|blessed virgin|ever[- ]virgin|virgin mary|immaculate (?:heart|conception)|holy name of mary|queenship of mary|mary,? (?:the )?(?:holy )?mother|saint mary major)\b/i.test(title)
      || /\b(?:annunciation|assumption)\b/i.test(title)
      || /\b(?:nativity|visitation|presentation|purification|conception) of (?:the )?mary\b/i.test(title)
      || /\bmaternity of (?:saint )?ann[ae]?\b/i.test(title)
      || /^\s*(?:the )?dormition\s*$/i.test(title)
      || /\bconception of (?:the )?(?:(?:holy|saint|st\.?|righteous)\s+)*ann[ae]\b/i.test(title);
  }
  const display=day=>marian(day)?'blue':day?.color;
  return {blue,marian,display};
});
