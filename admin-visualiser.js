const visualiserAdminClient = window.supabase.createClient('https://lgdhudhsorazcjhtisrs.supabase.co', 'sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm');
let visualiserItems = [], visualiserPhotoAssets = {}, visualiserTab = 'venue';
const visualiserEsc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const visualiserTitle = kind => kind === 'venue' ? 'Venues' : kind === 'stage' ? 'Stages' : 'Centrepieces';
async function requireVisualiserOwner(){ const {data:{session}} = await visualiserAdminClient.auth.getSession(); if(!session){location.replace('admin-login.html');return false} const {data:profile} = await visualiserAdminClient.from('admin_profiles').select('role,is_active').eq('user_id',session.user.id).maybeSingle(); if(!profile?.is_active || profile.role !== 'owner'){location.replace('admin-calendar.html');return false} return true; }
function renderAnalytics(stats){
  document.getElementById('visualiserSavedCount').textContent=stats.saved;
  document.getElementById('visualiserEnquiryCount').textContent=stats.enquiries;
  document.getElementById('visualiserConversion').textContent=stats.enquiries?Math.round(stats.converted/stats.enquiries*100)+'%':'0%';
  ['venue','stage','centrepiece','combination'].forEach((k,i)=>{
    const v=stats[k],row=visualiserItems.find(x=>x.kind===k&&x.code===v?.code);
    document.getElementById(['mostVenue','mostStage','mostCentrepiece','mostCombination'][i]).textContent=v?(row?row.name+' ('+v.code+')':v.code)+' · '+v.count:'No selections yet';
  });
}
function renderItems(){ const list=document.getElementById('visualiserItemList'), rows=visualiserItems.filter(x=>x.kind===visualiserTab).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)); if(!rows.length){list.innerHTML='<div class="admin-empty">No items yet. Add the first one above.</div>';return} list.innerHTML=rows.map(row=>{const displayImage=(!row.image_url||row.image_url.includes('assets/visualiser/room-'))?visualiserPhotoAssets[row.code]?.image:row.image_url; const mock=!displayImage; const thumb=mock?`<span class="visualiser-item-thumb mock ${row.kind}-${row.code.toLowerCase()}">${visualiserEsc(row.code)}</span>`:`<img class="visualiser-item-thumb" src="${visualiserEsc(displayImage)}" alt="">`; return `<article class="visualiser-item-row">${thumb}<div><strong>${visualiserEsc(row.code)} · ${visualiserEsc(row.name)}</strong><small>${visualiserEsc(row.short_description||'No description yet.')}</small></div><div><small>${row.kind==='venue'&&row.metadata?.rights_note?visualiserEsc(row.metadata.rights_note):row.image_url?visualiserEsc(row.image_url):'AI photographic concept · ready for an approved asset'}</small></div><span class="status-pill">${row.is_active?'Visible':'Hidden'}</span><div class="visualiser-row-actions"><button class="admin-button secondary" type="button" data-edit="${row.id}">Edit</button><button class="admin-button secondary" type="button" data-toggle="${row.id}">${row.is_active?'Hide':'Show'}</button><a class="admin-button secondary" href="visualiser.html?preview=owner&${row.kind}_code=${encodeURIComponent(row.code)}" target="_blank" rel="noopener">Preview</a></div></article>`}).join(''); list.querySelectorAll('[data-edit]').forEach(button=>button.addEventListener('click',()=>openVisualiserModal(visualiserItems.find(x=>x.id===button.dataset.edit)))); list.querySelectorAll('[data-toggle]').forEach(button=>button.addEventListener('click',()=>toggleVisualiserItem(button.dataset.toggle))); }
function openVisualiserModal(item){ const modal=document.getElementById('visualiserItemModal'),form=document.getElementById('visualiserItemForm'); document.getElementById('visualiserModalTitle').textContent=item?'Edit item':`Add ${visualiserTitle(visualiserTab).slice(0,-1)}`; document.getElementById('visualiserItemId').value=item?.id||''; document.getElementById('visualiserKind').value=item?.kind||visualiserTab; document.getElementById('visualiserKind').disabled=Boolean(item); document.getElementById('visualiserCode').value=item?.code||nextCode(visualiserTab); document.getElementById('visualiserCode').disabled=Boolean(item); document.getElementById('visualiserName').value=item?.name||''; document.getElementById('visualiserDescription').value=item?.short_description||''; document.getElementById('visualiserImage').value=item?.image_url||''; document.getElementById('visualiserSort').value=item?.sort_order??10; document.getElementById('visualiserActive').checked=item?.is_active!==false; document.getElementById('visualiserFormNote').textContent=''; document.getElementById('visualiserFile').value=''; modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.getElementById('visualiserName').focus(); }
function closeVisualiserModal(){document.getElementById('visualiserItemModal')?.classList.remove('open');document.getElementById('visualiserItemModal').setAttribute('aria-hidden','true')}
async function toggleVisualiserItem(id){ const item=visualiserItems.find(x=>x.id===id); if(!item)return; const {error}=await visualiserAdminClient.from('visualiser_items').update({is_active:!item.is_active,updated_at:new Date().toISOString()}).eq('id',id); if(error){alert('Could not update this item.');return} await loadVisualiserData(); }
async function loadVisualiserData(){
  const [items,stats,photos]=await Promise.all([
    visualiserAdminClient.from('visualiser_items').select('*').order('kind').order('sort_order').order('code'),
    visualiserAdminClient.rpc('visualiser_analytics'),
    fetch('assets/visualiser/photographic-catalogue.json').then(r=>r.ok?r.json():{}).catch(()=>({}))
  ]);
  if(items.error||stats.error||!stats.data){document.getElementById('visualiserItemList').innerHTML='<div class="admin-empty">Could not load visualiser data. Please refresh.</div>';return}
  visualiserItems=items.data||[];visualiserPhotoAssets=photos;renderAnalytics(stats.data);renderItems();
}
function nextCode(kind){const prefix={venue:'V',stage:'S',centrepiece:'C'}[kind];return prefix+(Math.max(0,...visualiserItems.filter(x=>x.kind===kind).map(x=>Number(x.code.slice(1))||0))+1)}
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{visualiserTab=button.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('is-active',x===button));renderItems()}));
document.getElementById('addVisualiserItem')?.addEventListener('click',()=>openVisualiserModal()); document.getElementById('closeVisualiserModal')?.addEventListener('click',closeVisualiserModal); document.getElementById('visualiserItemModal')?.addEventListener('click',e=>{if(e.target.id==='visualiserItemModal')closeVisualiserModal()});
document.getElementById('visualiserKind').addEventListener('change',e=>{document.getElementById('visualiserCode').value=nextCode(e.target.value)});
document.getElementById('visualiserItemForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.target,button=form.querySelector('[type="submit"]'),note=document.getElementById('visualiserFormNote');
  if(button.disabled)return;
  const id=document.getElementById('visualiserItemId').value,kind=document.getElementById('visualiserKind').value,code=document.getElementById('visualiserCode').value.trim().toUpperCase();
  if(!new RegExp('^'+{venue:'V',stage:'S',centrepiece:'C'}[kind]+'[0-9A-Z_-]{1,20}$').test(code)){note.textContent='The code must start with '+{venue:'V',stage:'S',centrepiece:'C'}[kind]+'.';return}
  const existing=visualiserItems.find(x=>x.id===id);
  let image=document.getElementById('visualiserImage').value.trim();
  if(image){try{const u=new URL(image,location.href);if(u.protocol!=='https:'&&u.origin!==location.origin)throw 0}catch{note.textContent='Use an HTTPS image URL or local asset path.';return}}
  const file=document.getElementById('visualiserFile').files[0];
  if(file&&(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5242880)){note.textContent='Choose a JPG, PNG or WebP image under 5 MB.';return}
  button.disabled=true;note.textContent='Saving…';
  try{
    if(file){
      const path=code+'/'+crypto.randomUUID()+'.'+({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type]);
      const uploaded=await visualiserAdminClient.storage.from('visualiser').upload(path,file,{contentType:file.type,upsert:false});
      if(uploaded.error)throw uploaded.error;
      image=visualiserAdminClient.storage.from('visualiser').getPublicUrl(path).data.publicUrl;
    }
    const changedImage=image!==(existing?.image_url||'');
    const payload={kind,code,name:document.getElementById('visualiserName').value.trim(),short_description:document.getElementById('visualiserDescription').value.trim(),image_url:image||null,layer_image_url:kind==='venue'?null:image||null,is_active:document.getElementById('visualiserActive').checked,sort_order:Number(document.getElementById('visualiserSort').value)||0,metadata:changedImage?{...(existing?.metadata||{}),is_placeholder:!image,rights_note:'Owner supplied image'}:(existing?.metadata||{}),updated_at:new Date().toISOString()};
    const result=id?await visualiserAdminClient.from('visualiser_items').update(payload).eq('id',id).select('id'):await visualiserAdminClient.from('visualiser_items').insert(payload).select('id');
    if(result.error||!result.data?.length)throw result.error||new Error('No update permitted');
    closeVisualiserModal();await loadVisualiserData();
  }catch(error){note.textContent=error.code==='23505'?'That code is already in use.':'Could not save. Check your owner access and image, then retry.'}
  finally{button.disabled=false}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeVisualiserModal()});
document.getElementById('visualiserSignOut')?.addEventListener('click',async()=>{await visualiserAdminClient.auth.signOut();location.replace('admin-login.html')});
(async()=>{if(await requireVisualiserOwner()) await loadVisualiserData()})();
