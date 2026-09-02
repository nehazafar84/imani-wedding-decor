const publicPackagesClient=window.supabase.createClient('https://lgdhudhsorazcjhtisrs.supabase.co','sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm');
const escPackage=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
async function loadPublicPackages(){
  const grid=document.getElementById('publicPackagesGrid');
  if(!grid)return;
  const {data,error}=await publicPackagesClient
    .from('service_packages')
    .select('id,title,category,short_description,features,is_published,sort_order')
    .eq('is_published',true)
    .order('sort_order')
    .order('created_at',{ascending:false});
  if(error){grid.innerHTML='<div class="admin-empty">Services are temporarily unavailable.</div>';return}
  if(!data||!data.length){grid.innerHTML='<div class="admin-empty">Our tailored décor options are being updated. Please get in touch for your celebration.</div>';return}
  grid.innerHTML=data.map(item=>{
    const features=String(item.features||'').split('\n').map(x=>x.trim()).filter(Boolean);
    return `<article class="page-card"><span>${escPackage(item.category)}</span><h3>${escPackage(item.title)}</h3><p>${escPackage(item.short_description)||'Tailored décor styling designed around your venue and celebration.'}</p>${features.length?`<ul>${features.map(feature=>`<li>${escPackage(feature)}</li>`).join('')}</ul>`:''}<a class="text-link" href="quote.html">Get a tailored quote →</a></article>`;
  }).join('');
}
loadPublicPackages();