const supabaseAdmin = window.supabase.createClient(
  'https://lgdhudhsorazcjhtisrs.supabase.co',
  'sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm'
);

async function handleAdminLogin() {
  const form = document.getElementById('adminLogin');
  if (!form) return;
  const note = document.getElementById('loginNote');
  const button = form.querySelector('button[type="submit"]');
  const { data: sessionData } = await supabaseAdmin.auth.getSession();
  if (sessionData.session) { window.location.href = 'admin.html'; return; }
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); button.disabled = true; button.textContent = 'Signing in...'; note.textContent = 'Checking your account...';
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const { error } = await supabaseAdmin.auth.signInWithPassword({ email, password });
    if (error) { note.textContent = 'Email or password is incorrect. Please try again.'; button.disabled = false; button.textContent = 'Sign in'; return; }
    note.textContent = 'Login successful. Opening dashboard...'; window.location.href = 'admin.html';
  });
}

function escapeHtml(value) { return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }

function renderStats(data) {
  document.getElementById('statNew').textContent = data.filter(item => item.status === 'new').length;
  document.getElementById('statConversation').textContent = data.filter(item => ['contacted','quoted'].includes(item.status)).length;
  document.getElementById('statBooked').textContent = data.filter(item => item.status === 'booked').length;
}

function renderEnquiries() {
  const list = document.getElementById('enquiryList');
  if (!list) return;
  const search = (document.getElementById('enquirySearch')?.value || '').trim().toLowerCase();
  const status = document.getElementById('enquiryStatusFilter')?.value || 'all';
  const data = (window.__imaniEnquiries || []).filter(item => {
    const matchesStatus = status === 'all' || (item.status || 'new') === status;
    const haystack = [item.name,item.phone,item.email,item.event_type,item.venue,item.budget].join(' ').toLowerCase();
    return matchesStatus && (!search || haystack.includes(search));
  });
  if (!data.length) { list.innerHTML = '<div class="admin-empty">No enquiries match your search or filter.</div>'; return; }
  list.innerHTML = data.map(item => {
    const date = new Date(item.created_at).toLocaleDateString('en-GB');
    return `<div class="enquiry-row"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.phone || '')} · ${date}</small></div><div>${escapeHtml(item.event_type || 'Event')}<small>${escapeHtml(item.venue || 'Venue not provided')}</small></div><div>${item.guest_count ? escapeHtml(String(item.guest_count)) + ' guests' : 'Guest count not provided'}<small>${escapeHtml(item.budget || 'Budget not provided')}</small></div><div><span class="status-pill">${escapeHtml(item.status || 'new')}</span></div><div><button class="admin-button secondary" type="button" onclick="showEnquiry(${item.id})">View</button></div></div>`;
  }).join('');
}

async function loadAdminDashboard() {
  const list = document.getElementById('enquiryList'); if (!list) return;
  const { data: sessionData } = await supabaseAdmin.auth.getSession();
  if (!sessionData.session) { window.location.href = 'admin-login.html'; return; }
  const { data, error } = await supabaseAdmin.from('enquiries').select('id,created_at,name,phone,email,event_type,event_date,venue,guest_count,budget,message,status').order('created_at', { ascending: false });
  if (error) { list.innerHTML = '<div class="admin-empty">Could not load enquiries. Please refresh.</div>'; return; }
  window.__imaniEnquiries = data || []; renderStats(window.__imaniEnquiries); renderEnquiries();
}

function showEnquiry(id) {
  const item = (window.__imaniEnquiries || []).find(entry => entry.id === id); if (!item) return;
  let modal = document.getElementById('enquiryModal');
  if (!modal) { modal = document.createElement('div'); modal.id = 'enquiryModal'; modal.className = 'enquiry-modal'; modal.innerHTML = `<div class="enquiry-modal-card"><button class="modal-close" type="button" aria-label="Close" onclick="closeEnquiryModal()">×</button><div id="enquiryModalContent"></div></div>`; document.body.appendChild(modal); modal.addEventListener('click', event => { if (event.target === modal) closeEnquiryModal(); }); }
  document.getElementById('enquiryModalContent').innerHTML = `<p class="eyebrow dark">Enquiry details</p><h2>${escapeHtml(item.name)}</h2><div class="detail-grid"><div><span>Phone</span><strong>${escapeHtml(item.phone || 'Not provided')}</strong></div><div><span>Email</span><strong>${escapeHtml(item.email || 'Not provided')}</strong></div><div><span>Event</span><strong>${escapeHtml(item.event_type || 'Not provided')}</strong></div><div><span>Event date</span><strong>${escapeHtml(item.event_date || 'Not provided')}</strong></div><div><span>Venue</span><strong>${escapeHtml(item.venue || 'Not provided')}</strong></div><div><span>Guests</span><strong>${escapeHtml(item.guest_count || 'Not provided')}</strong></div><div><span>Budget</span><strong>${escapeHtml(item.budget || 'Not provided')}</strong></div><div><span>Received</span><strong>${new Date(item.created_at).toLocaleString('en-GB')}</strong></div></div><div class="message-box"><span>Customer message</span><p>${escapeHtml(item.message || 'No message provided.')}</p></div><div class="status-editor"><label for="statusSelect">Status</label><select id="statusSelect">${['new','contacted','quoted','booked','closed'].map(status => `<option value="${status}" ${status === item.status ? 'selected' : ''}>${status.charAt(0).toUpperCase() + status.slice(1)}</option>`).join('')}</select><button class="admin-button" id="saveStatusButton" type="button" onclick="saveEnquiryStatus(${item.id})">Save status</button><button class="admin-button secondary" type="button" onclick="deleteEnquiry(${item.id})">Delete enquiry</button><span class="status-save-note" id="statusSaveNote"></span></div>`;
  modal.classList.add('open');
}

function closeEnquiryModal() { document.getElementById('enquiryModal')?.classList.remove('open'); }

async function saveEnquiryStatus(id) {
  const select = document.getElementById('statusSelect'), button = document.getElementById('saveStatusButton'), note = document.getElementById('statusSaveNote'); if (!select || !button || !note) return;
  button.disabled = true; button.textContent = 'Saving...'; note.textContent = '';
  const { error } = await supabaseAdmin.from('enquiries').update({ status: select.value }).eq('id', id);
  if (error) { note.textContent = 'Could not save. Please try again.'; button.disabled = false; button.textContent = 'Save status'; return; }
  const item = (window.__imaniEnquiries || []).find(entry => entry.id === id); if (item) item.status = select.value;
  note.textContent = 'Saved'; button.textContent = 'Saved'; renderStats(window.__imaniEnquiries); renderEnquiries();
  setTimeout(() => { button.disabled = false; button.textContent = 'Save status'; }, 1000);
}

async function deleteEnquiry(id) {
  const item = (window.__imaniEnquiries || []).find(entry => entry.id === id); if (!item) return;
  if (!window.confirm(`Delete the enquiry from ${item.name}? This cannot be undone.`)) return;
  const { error } = await supabaseAdmin.from('enquiries').delete().eq('id', id);
  if (error) { window.alert('Could not delete this enquiry. Please try again.'); return; }
  window.__imaniEnquiries = window.__imaniEnquiries.filter(entry => entry.id !== id); closeEnquiryModal(); renderStats(window.__imaniEnquiries); renderEnquiries();
}

async function signOutAdmin() { await supabaseAdmin.auth.signOut(); window.location.href = 'admin-login.html'; }

document.getElementById('enquirySearch')?.addEventListener('input', renderEnquiries);
document.getElementById('enquiryStatusFilter')?.addEventListener('change', renderEnquiries);
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeEnquiryModal(); });
handleAdminLogin(); loadAdminDashboard();
