const publicSettingsClient=window.supabase.createClient('https://lgdhudhsorazcjhtisrs.supabase.co','sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm');

const verifiedContactSettings={
  business_name:'Imani Events',
  business_phone:'+44 7967 962340',
  business_email:'info@imanievents.co.uk',
  business_location:'Unit 28, Pwll Mawr Business Park, Wentloog Road, Cardiff, CF3 1TH',
  instagram_url:'https://www.instagram.com/imanieventsuk/',
  home_hero_image:'assets/home/hero-ballroom.webp'
};

function normalizeWhatsAppNumber(value){
  let clean=String(value||'').replace(/[^0-9]/g,'');
  if(!clean)return'';
  if(clean.startsWith('0044'))clean=clean.slice(2);
  if(clean.startsWith('0'))clean='44'+clean.slice(1);
  return clean;
}

function applyBackgroundImage(selector,value){
  const element=document.querySelector(selector);
  const url=String(value||'').trim();
  if(!element||!url)return;
  element.style.backgroundImage='url("'+url.replace(/"/g,'%22')+'")';
  element.classList.add('has-photo');
}

function ensureFloatingWhatsApp(number){
  if(document.body.classList.contains('admin-body'))return;
  const clean=normalizeWhatsAppNumber(number);
  if(!clean)return;
  let button=document.querySelector('.floating-whatsapp');
  if(!button){
    button=document.createElement('a');
    button.className='floating-whatsapp';
    button.target='_blank';
    button.rel='noopener';
    button.setAttribute('aria-label','Chat with Imani Events on WhatsApp');
    button.innerHTML='<span aria-hidden="true">WA</span><strong>Chat with us</strong>';
    document.body.appendChild(button);
  }
  button.href='https://wa.me/'+clean+'?text='+encodeURIComponent('Hello Imani Events, I would like to discuss my event.');
}

function applyPublicSettings(settings){
  document.querySelectorAll('[data-setting="business_phone"]').forEach(phone=>{
    if(!settings.business_phone)return;
    phone.textContent='WhatsApp — '+settings.business_phone;
    const clean=normalizeWhatsAppNumber(settings.business_phone);
    if(clean){phone.href='https://wa.me/'+clean;phone.target='_blank';phone.rel='noopener';phone.hidden=false;}
  });
  document.querySelectorAll('[data-setting="business_email"]').forEach(email=>{
    if(!settings.business_email)return;
    email.textContent='Email — '+settings.business_email;
    email.href='mailto:'+settings.business_email;
    email.hidden=false;
  });
  document.querySelectorAll('[data-setting="business_location"]').forEach(el=>{if(settings.business_location)el.textContent=settings.business_location;});
  document.querySelectorAll('[data-setting="instagram_url"]').forEach(instagram=>{
    if(!settings.instagram_url)return;
    instagram.href=settings.instagram_url;instagram.target='_blank';instagram.rel='noopener';instagram.hidden=false;
  });
  document.querySelectorAll('[data-setting="facebook_url"]').forEach(facebook=>{
    if(!settings.facebook_url)return;
    facebook.href=settings.facebook_url;facebook.target='_blank';facebook.rel='noopener';facebook.hidden=false;
  });
  ensureFloatingWhatsApp(settings.business_phone);
  applyBackgroundImage('.hero',settings.home_hero_image);
  applyBackgroundImage('.image-stage',settings.home_stage_image);
  applyBackgroundImage('.image-nikkah',settings.home_nikkah_image);
  applyBackgroundImage('.image-mehndi',settings.home_mehndi_image);
  applyBackgroundImage('.image-table',settings.home_table_image);
}

async function loadPublicSettings(){
  applyPublicSettings(verifiedContactSettings);
  const {data,error}=await publicSettingsClient.from('site_settings').select('key,value');
  if(error||!data)return;
  const managedSettings=Object.fromEntries(data.map(row=>[row.key,row.value]));
  applyPublicSettings({...managedSettings,...verifiedContactSettings});
}

loadPublicSettings();