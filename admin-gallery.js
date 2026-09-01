const supabaseGallery = window.supabase.createClient(
  'https://lgdhudhsorazcjhtisrs.supabase.co',
  'sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm'
);

function galleryEscape(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

async function requireGalleryAdmin() {
  const { data } = await supabaseGallery.auth.getSession();
  if (!data.session) {
    window.location.href = 'admin-login.html';
    return false;
  }
  return true;
}

async function loadGalleryItems() {
  if (!(await requireGalleryAdmin())) return;
  const list = document.getElementById('galleryAdminList');
  const count = document.getElementById('galleryCount');
  const { data, error } = await supabaseGallery.from('gallery_items').select('*').order('sort_order').order('created_at', { ascending: false });
  if (error) {
    list.innerHTML = '<div class="admin-empty">Could not load gallery items.</div>';
    return;
  }
  count.textContent = `${data.length} ${data.length === 1 ? 'item' : 'items'}`;
  if (!data.length) {
    list.innerHTML = '<div class="admin-empty">No gallery items yet. Add your first placeholder above.</div>';
    return;
  }
  list.innerHTML = data.map(item => `<article class="gallery-admin-card">
    <div class="gallery-admin-preview">${item.image_path ? '<span>Image ready</span>' : '<span>Photo to be added</span>'}</div>
    <div class="gallery-admin-copy"><div class="gallery-card-head"><div><small>${galleryEscape(item.category)}</small><strong>${galleryEscape(item.title)}</strong></div><span class="status-pill">${item.is_published ? 'Published' : 'Draft'}</span></div>
    ${item.video_url ? `<p>Video link saved</p>` : '<p>No video link</p>'}
    <div class="gallery-card-actions"><button class="admin-button secondary" type="button" onclick="toggleGalleryPublish(${item.id},${!item.is_published})">${item.is_published ? 'Unpublish' : 'Publish'}</button><button class="admin-button gallery-delete" type="button" onclick="deleteGalleryItem(${item.id})">Delete</button></div></div>
  </article>`).join('');
}

async function addGalleryItem(event) {
  event.preventDefault();
  const note = document.getElementById('galleryFormNote');
  const button = event.currentTarget.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Adding...';
  const payload = {
    title: document.getElementById('galleryTitle').value.trim(),
    category: document.getElementById('galleryCategory').value,
    video_url: document.getElementById('galleryVideo').value.trim() || null,
    alt_text: document.getElementById('galleryAlt').value.trim() || null,
    is_published: document.getElementById('galleryPublished').checked
  };
  const { error } = await supabaseGallery.from('gallery_items').insert(payload);
  if (error) {
    note.textContent = 'Could not add item. Please try again.';
  } else {
    event.currentTarget.reset();
    note.textContent = 'Gallery item added successfully.';
    await loadGalleryItems();
  }
  button.disabled = false;
  button.textContent = 'Add item';
}

async function toggleGalleryPublish(id, value) {
  const { error } = await supabaseGallery.from('gallery_items').update({ is_published: value }).eq('id', id);
  if (!error) loadGalleryItems();
}

async function deleteGalleryItem(id) {
  if (!window.confirm('Delete this gallery item?')) return;
  const { error } = await supabaseGallery.from('gallery_items').delete().eq('id', id);
  if (!error) loadGalleryItems();
}

async function signOutAdmin() {
  await supabaseGallery.auth.signOut();
  window.location.href = 'admin-login.html';
}

document.getElementById('galleryAdminForm')?.addEventListener('submit', addGalleryItem);
loadGalleryItems();
