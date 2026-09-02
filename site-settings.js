const publicSettingsClient=window.supabase.createClient('https://lgdhudhsorazcjhtisrs.supabase.co','sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm');

function normalizeWhatsAppNumber(value){
  let clean=String(value||'').replace(/[^0-9]/g,'');
  if(!clean)return'';
  if(clean.startsWith('0044'))clean=clean.slice(2);
  if(clean.startsWith('0'))clean=`44${clean.slice(1)}`;
  return clean;
}

function applyBackgroundImage(selector,value){
  const element=document.querySelector(selector);
  const url=String(value||'').trim();
  if(!element||!url)return;
  element.style.backgroundImage=`url("${url.replace(/"/g,'%22')}")`;
  element.classList.add('has-photo');
}

async function loadPublicSettings(){
  const {data,error}=await publicSettingsClient.from('site_settings').select('key,value');
  if(error||!data)return;
  const settings=Object.fromEntries(data.map(row=>[row.key,row.value]));

  const phone=document.querySelector('[data-setting="business_phone"]');
  if(phone&&settings.business_phone){
    phone.textContent=`WhatsApp — ${settings.business_phone}`;
    const clean=normalizeWhatsAppNumber(settings.business_phone);
    if(clean){phone.href=`https://wa.me/${clean}`;phone.target='_blank';phone.rel='noopener';}
  }

  const email=document.querySelector('[data-setting="business_email"]');
  if(email&&settings.business_email){email.textContent=`Email — ${settings.business_email}`;email.href=`mailto:${settings.business_email}`;}

  document.querySelectorAll('[data-setting="business_location"]').forEach(el=>{if(settings.business_location)el.textContent=settings.business_location;});

  const instagram=document.querySelector('[data-setting="instagram_url"]');
  if(instagram&&settings.instagram_url){instagram.href=settings.instagram_url;instagram.hidden=false;}
  const facebook=document.querySelector('[data-setting="facebook_url"]');
  if(facebook&&settings.facebook_url){facebook.href=settings.facebook_url;facebook.hidden=false;}

  applyBackgroundImage('.hero',settings.home_hero_image);
  applyBackgroundImage('.image-stage',settings.home_stage_image);
  applyBackgroundImage('.image-nikkah',settings.home_nikkah_image);
  applyBackgroundImage('.image-mehndi',settings.home_mehndi_image);
  applyBackgroundImage('.image-table',settings.home_table_image);
}

loadPublicSettings();