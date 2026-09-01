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
  if (sessionData.session) {
    window.location.href = 'admin.html';
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    button.disabled = true;
    button.textContent = 'Signing in...';
    note.textContent = 'Checking your account...';

    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;

    const { error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

    if (error) {
      note.textContent = 'Email or password is incorrect. Please try again.';
      button.disabled = false;
      button.textContent = 'Sign in';
      return;
    }

    note.textContent = 'Login successful. Opening dashboard...';
    window.location.href = 'admin.html';
  });
}

async function loadAdminDashboard() {
  const list = document.getElementById('enquiryList');
  if (!list) return;

  const { data: sessionData } = await supabaseAdmin.auth.getSession();
  const session = sessionData.session;

  if (!session) {
    window.location.href = 'admin-login.html';
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('enquiries')
    .select('id,created_at,name,phone,email,event_type,event_date,venue,guest_count,budget,message,status')
    .order('created_at', { ascending: false });

  if (error) {
    list.innerHTML = '<div class="admin-empty">Could not load enquiries. Please refresh.</div>';
    return;
  }

  const newCount = data.filter(item => item.status === 'new').length;
  const contactedCount = data.filter(item => ['contacted','quoted'].includes(item.status)).length;
  const bookedCount = data.filter(item => item.status === 'booked').length;

  document.getElementById('statNew').textContent = newCount;
  document.getElementById('statConversation').textContent = contactedCount;
  document.getElementById('statBooked').textContent = bookedCount;

  if (!data.length) {
    list.innerHTML = '<div class="admin-empty">No enquiries yet.</div>';
    return;
  }

  list.innerHTML = data.map(item => {
    const date = new Date(item.created_at).toLocaleDateString('en-GB');
    const venue = item.venue || 'Venue not provided';
    const eventType = item.event_type || 'Event';
    const phone = item.phone || '';
    return `<div class="enquiry-row">
      <div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(phone)} · ${date}</small></div>
      <div>${escapeHtml(eventType)}<small>${escapeHtml(venue)}</small></div>
      <div>${item.guest_count ? escapeHtml(String(item.guest_count)) + ' guests' : 'Guest count not provided'}<small>${escapeHtml(item.budget || 'Budget not provided')}</small></div>
      <div><span class="status-pill">${escapeHtml(item.status || 'new')}</span></div>
      <div><button class="admin-button secondary" type="button" onclick="showEnquiry(${item.id})">View</button></div>
    </div>`;
  }).join('');

  window.__imaniEnquiries = data;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function showEnquiry(id) {
  const item = (window.__imaniEnquiries || []).find(entry => entry.id === id);
  if (!item) return;

  const details = [
    `Name: ${item.name || ''}`,
    `Phone: ${item.phone || ''}`,
    `Email: ${item.email || ''}`,
    `Event: ${item.event_type || ''}`,
    `Event date: ${item.event_date || ''}`,
    `Venue: ${item.venue || ''}`,
    `Guests: ${item.guest_count || ''}`,
    `Budget: ${item.budget || ''}`,
    `Message: ${item.message || ''}`,
    `Status: ${item.status || 'new'}`
  ].join('\n');

  alert(details);
}

async function signOutAdmin() {
  await supabaseAdmin.auth.signOut();
  window.location.href = 'admin-login.html';
}

handleAdminLogin();
loadAdminDashboard();
