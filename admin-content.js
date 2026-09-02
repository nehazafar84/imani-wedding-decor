const contentClient = window.supabase.createClient('https://lgdhudhsorazcjhtisrs.supabase.co','sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm');
let contentRows=[];

function esc(value){return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));}

async function requireContentAdmin(){const {data:{session}}=await contentClient.auth.getSession();if(!session){location.href='admin-login.html';return false;}return true;}

async function loadContent(){if(!(await requireContentAdmin()))return;const fields=document.getElementById('contentFields');const {data,error}=await contentClient.from('site_content').select('*').order('sort_order');if(error){fields.innerHTML='<div class="admin-empty">Could not load website content.</div>';return;}contentRows=data||[];fields.innerHTML=contentRows.map(row=>`<div class="content-edit-field"><label for="content-${esc(row.key)}"><span>${esc(row.section)}</span>${esc(row.label)}</label><textarea id="content-${esc(row.key)}" data-key="${esc(row.key)}" rows="${row.value.length>100?4:2}">${esc(row.value)}</textarea></div>`).join('');}

document.getElementById('contentAdminForm').addEventListener('submit',async e=>{e.preventDefault();const note=document.getElementById('contentFormNote');note.textContent='Saving changes...';const updates=[...document.querySelectorAll('[data-key]')].map(el=>({key:el.dataset.key,value:el.value.trim(),updated_at:new Date().toISOString()}));for(const update of updates){const {error}=await contentClient.from('site_content').update({value:update.value,updated_at:update.updated_at}).eq('key',update.key);if(error){note.textContent='Could not save changes. Please try again.';return;}}note.textContent='Website content saved successfully.';});

async function signOutContentAdmin(){await contentClient.auth.signOut();location.href='admin-login.html';}

loadContent();