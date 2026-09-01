const supabaseGallery = window.supabase.createClient(
  'https://lgdhudhsorazcjhtisrs.supabase.co',
  'sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm'
);

function galleryEscape(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function galleryImageUrl(path) {
  if (!path) return '';
  return supabaseGallery.storage.from('gallery').getPublicUrl(path).data.publicUrl;
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
    list.innerHTML = '<div class="admin-empty">No gallery items yet. Add your first item above.</div>';
    return;
  }
  list.innerHTML = data.map(item => {
    const imageUrl = galleryImageUrl(item.image_path);
    return `<article class="gallery-admin-card">
      <div class="gallery-admin-preview"${imageUrl ? ` style="background-image:url('${galleryEscape(imageUrl)}');background-size:cover;background-position:center"` : ''}>${imageUrl ? '' : '<span>Photo to be added</span>'}</div>
      <div class="gallery-admin-copy"><div class="gallery-card-head"><div><small>${galleryEscape(item.category)}</small><strong>${galleryEscape(item.title)}</strong></div><span class="status-pill">${item.is_published ? 'Published' : 'Draft'}</span></div>
      ${item.video_url ? '<p>Video link saved</p>' : '<p>No video link</p>'}
      <div class="gallery-card-actions"><button class="admin-button secondary" type="button" onclick="toggleGalleryPublish(${item.id},${!item.is_published})">${item.is_published ? 'Unpublish' : 'Publish'}</button><button class="admin-button gallery-delete" type="button" onclick="deleteGalleryItem(${item.id},'${galleryEscape(item.image_path || '')}')">Delete</button></div></div>
    </article>`;
  }).join('');
}

async function uploadGalleryImage(file) {
  if (!file) return null;
  const allowed = ['image/jpeg','image/png','image/webp','image/avif'];
  if (!allowed.includes(file.type)) throw new Error('Please choose a JPG, PNG, WebP or AVIF image.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Photo must be smaller than 10 MB.');
  const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `weddings/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const { error } = await supabaseGallery.storage.from('gallery').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  return path;
}

async function addGalleryItem(event) {
  event.preventDefault();
  const note = document.getElementById('galleryFormNote');
  const button = event.currentTarget.querySelector('button[type="submit"]');
  const imageFile = document.getElementById('galleryImage').files[0];
  button.disabled = true;
  button.textContent = imageFile ? 'Uploading...' : 'Adding...';
  note.textContent = imageFile ? 'Uploading your photo securely...' : 'Saving gallery item...';
  let imagePath = null;
  try {
    imagePath = await uploadGalleryImage(imageFile);
    const payload = {
      title: document.getElementById('galleryTitle').value.trim(),
      category: document.getElementById('galleryCategory').value,
      image_path: imagePath,
      video_url: document.getElementById('galleryVideo').value.trim() || null,
      alt_text: document.getElementById('galleryAlt').value.trim() || null,
      is_published: document.getElementById('galleryPublished').checked
    };
    const { error } = await supabaseGallery.from('gallery_items').insert(payload);
    if (error) throw error;
    event.currentTarget.reset();
    note.textContent = imagePath ? 'Photo and gallery item added successfully.' : 'Gallery item added successfully.';
    await loadGalleryItems();
  } catch (error) {
    if (imagePath) await supabaseGallery.storage.from('gallery').remove([imagePath]);
    note.textContent = error.message || 'Could not add item. Please try again.';
  } finally {
    button.disabled = false;
    button.textContent = 'Add item';
  }
}

async function toggleGalleryPublish(id, value) {
  const { error } = await supabaseGallery.from('gallery_items').update({ is_published: value }).eq('id', id);
  if (!error) loadGalleryItems();
}

async function deleteGalleryItem(id, imagePath) {
  if (!window.confirm('Delete this gallery item?')) return;
  const { error } = await supabaseGallery.from('gallery_items').delete().eq('id', id);
  if (error) return;
  if (imagePath) await supabaseGallery.storage.from('gallery').remove([imagePath]);
  loadGalleryItems();
}

async function signOutAdmin() {
  await supabaseGallery.auth.signOut();
  window.location.href = 'admin-login.html';
}

document.getElementById('galleryAdminForm')?.addEventListener('submit', addGalleryItem);
loadGalleryItems();
