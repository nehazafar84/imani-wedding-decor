(() => {
  const params = new URLSearchParams(location.search);
  if (params.get('visualiser') !== '1') return;
  const codes = ['venue','stage','centrepiece'].map(k => params.get(k+'_code') || '');
  if (!codes.every((v,i) => new RegExp('^'+['V','S','C'][i]+'[0-9A-Z_-]{1,20}$').test(v))) return;
  const reference = 'IMANI-'+codes.join('-');
  if(params.get('design_reference')!==reference) return;
  const M=window.ImaniStyling;
  let config=null,configurationReference=null;
  if(params.has('styling')){
    try{config=M.normalize(JSON.parse(params.get('styling')),true);configurationReference=reference+'-'+M.fingerprint(config);if(params.get('configuration_reference')&&params.get('configuration_reference')!==configurationReference)throw new Error('Changed design')}
    catch{const note=document.getElementById('formNote');if(note)note.textContent='Your design link is incomplete. Return to the visualiser and choose your design again.';document.querySelector('#quoteForm [type="submit"]').disabled=true;return}
  }
  window.imaniVisualiserPayload = {
    visualiser_design_reference: reference,
    visualiser_venue_code: codes[0], visualiser_stage_code: codes[1], visualiser_centrepiece_code: codes[2],
    visualiser_saved: params.get('saved') === '1'
  };
  if(config)Object.assign(window.imaniVisualiserPayload,{visualiser_configuration:config,visualiser_configuration_reference:configurationReference});
  const box=document.createElement('div'); box.className='full-row';
  const label=document.createElement('p');label.textContent=(params.get('intent')==='booking'?'Your booking request — chosen design: ':'Your design: ')+(configurationReference||reference);label.style.overflowWrap='anywhere';
  const back=new URLSearchParams({venue_code:codes[0],stage_code:codes[1],centrepiece_code:codes[2]});if(config)back.set('styling',JSON.stringify(config));
  const link=document.createElement('a');link.href='visualiser.html?'+back;link.textContent='View / change design';
  box.append(label);
  if(config){const details=document.createElement('details'),summary=document.createElement('summary'),list=document.createElement('ul');summary.textContent='Your complete décor choices';M.summary(config).forEach(text=>{const li=document.createElement('li');li.textContent=text;list.append(li)});details.append(summary,list);box.append(details)}
  box.append(link);document.getElementById('quoteForm')?.prepend(box);
})();
