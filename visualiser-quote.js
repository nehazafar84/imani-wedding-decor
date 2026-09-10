(() => {
  const params = new URLSearchParams(location.search);
  if (params.get('visualiser') !== '1') return;
  const codes = ['venue','stage','centrepiece'].map(k => params.get(k+'_code') || '');
  if (!codes.every((v,i) => new RegExp('^'+['V','S','C'][i]+'[0-9A-Z_-]{1,20}$').test(v))) return;
  const reference = 'IMANI-'+codes.join('-');
  if(params.get('design_reference')!==reference) return;
  window.imaniVisualiserPayload = {
    visualiser_design_reference: reference,
    visualiser_venue_code: codes[0], visualiser_stage_code: codes[1], visualiser_centrepiece_code: codes[2],
    visualiser_saved: params.get('saved') === '1'
  };
  const box=document.createElement('div'); box.className='full-row';
  const label=document.createElement('p');label.textContent=(params.get('intent')==='booking'?'Your booking request — chosen design: ':'Your design: ')+reference;
  const link=document.createElement('a');link.href='visualiser.html?'+new URLSearchParams({venue_code:codes[0],stage_code:codes[1],centrepiece_code:codes[2]});link.textContent='View / change design';
  box.append(label,link);document.getElementById('quoteForm')?.prepend(box);
})();
