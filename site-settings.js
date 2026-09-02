const publicSettingsClient=window.supabase.createClient('https://lgdhudhsorazcjhtisrs.supabase.co','sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm');

async function loadPublicSettings(){
  const {data,error}=await publicSettingsClient.from('site_settings').select('key,value');
  if(error||!data)return;
  const settings=Object.fromEntries(data.map(row=>[row.key,row.value]));

  const phone=document.querySelector('[data-setting="business_phone"]');
  if(phone&&settings.business_phone){
    phone.textContent=`WhatsApp — ${settings.business_phone}`;
    const clean=settings.business_phone.replace(/[^0-9]/g,'');
    phone.href=`https://wa.me/${clean}`;
    phone.target='_blank';
    phone.rel='noopener';
  }

  const email=document.querySelector('[data-setting="business_email"]');
  if(email&&settings.business_email){email.textContent=`Email — ${settings.business_email}`;email.href=`mailto:${settings.business_email}`;}

  document.querySelectorAll('[data-setting="business_location"]').forEach(el=>{if(settings.business_location)el.textContent=settings.business_location;});

  const instagram=document.querySelector('[data-setting="instagram_url"]');
  if(instagram&&settings.instagram_url){instagram.href=settings.instagram_url;instagram.hidden=false;}
  const facebook=document.querySelector('[data-setting="facebook_url"]');
  if(facebook&&settings.facebook_url){facebook.href=settings.facebook_url;facebook.hidden=false;}
}

loadPublicSettings();