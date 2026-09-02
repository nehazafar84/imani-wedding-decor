const supabaseGallery = window.supabase.createClient(
  'https://lgdhudhsorazcjhtisrs.supabase.co',
  'sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm'
);

let galleryItemsCache = [];

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
  galleryItemsCache = data || [];
  count.textContent = `${galleryItemsCache.length} ${galleryItemsCache.length === 1 ? 'item' : 'items'}`;
  if (!galleryItemsCache.length) {
    list.innerHTML = '<div class="admin-empty">No gallery items yet. Add your first item above.</div>';
    return;
  }
  list.innerHTML = galleryItemsCache.map((item,index) => {
    const imageUrl = galleryImageUrl(item.image_path);
    return `<article class="gallery-admin-card">
      <div class="gallery-admin-preview"${imageUrl ? ` style="background-image:url('${galleryEscape(imageUrl)}');background-size:cover;background-position:center"` : ''}>${imageUrl ? '' : '<span>Photo to be added</span>'}</div>
      <div class="gallery-admin-copy"><div class="gallery-card-head"><div><small>${galleryEscape(item.category)}</small><strong>${galleryEscape(item.title)}</strong></div><span class="status-pill">${item.is_published ? 'Published' : 'Draft'}</span></div>
      ${item.video_url ? '<p>Video link saved</p>' : '<p>No video link</p>'}
      <div class="gallery-card-actions">
        <button class="admin-button secondary" type="button" onclick="editGalleryItem('${item.id}')">Edit</button>
        <button class="admin-button secondary" type="button" onclick="moveGalleryItem('${item.id}',-1)" ${index===0?'disabled':''}>↑ Up</button>
        <button class="admin-button secondary" type="button" onclick="moveGalleryItem('${item.id}',1)" ${index===galleryItemsCache.length-1?'disabled':''}>↓ Down</button>
        <button class="admin-button secondary" type="button" onclick="toggleGalleryPublish('${item.id}',${!item.is_published})">${item.is_published ? 'Unpublish' : 'Publish'}</button>
        <button class="admin-button gallery-delete" type="button" onclick="deleteGalleryItem('${item.id}','${galleryEscape(item.image_path || '')}')">Delete</button>
      </div></div>
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
  const form = event.currentTarget;
  const note = document.getElementById('galleryFormNote');
  const button = form.querySelector('button[type="submit"]');
  const editId = document.getElementById('galleryEditId').value;
  const imageFile = document.getElementById('galleryImage').files[0];
  button.disabled = true;
  button.textContent = editId ? 'Saving...' : (imageFile ? 'Uploading...' : 'Adding...');
  note.textContent = editId ? 'Saving changes...' : (imageFile ? 'Uploading your photo securely...' : 'Saving gallery item...');
  let newImagePath = null;
  try {
    if (imageFile) newImagePath = await uploadGalleryImage(imageFile);
    const payload = {
      title: document.getElementById('galleryTitle').value.trim(),
      category: document.getElementById('galleryCategory').value,
      video_url: document.getElementById('galleryVideo').value.trim() || null,
      alt_text: document.getElementById('galleryAlt').value.trim() || null,
      is_published: document.getElementById('galleryPublished').checked,
      updated_at: new Date().toISOString()
    };
    if (newImagePath) payload.image_path = newImagePath;
    if (editId) {
      const oldItem = galleryItemsCache.find(item => item.id === editId);
      const { error } = await supabaseGallery.from('gallery_items').update(payload).eq('id', editId);
      if (error) throw error;
      if (newImagePath && oldItem?.image_path) await supabaseGallery.storage.from('gallery').remove([oldItem.image_path]);
      note.textContent = 'Gallery item updated successfully.';
    } else {
      payload.image_path = newImagePath;
      payload.sort_order = galleryItemsCache.length;
      const { error } = await supabaseGallery.from('gallery_items').insert(payload);
      if (error) throw error;
      note.textContent = newImagePath ? 'Photo and gallery item added successfully.' : 'Gallery item added successfully.';
    }
    resetGalleryForm();
    await loadGalleryItems();
  } catch (error) {
    if (newImagePath) await supabaseGallery.storage.from('gallery').remove([newImagePath]);
    note.textContent = error.message || 'Could not save item. Please try again.';
  } finally {
    button.disabled = false;
    button.textContent = 'Add item';
  }
}

function editGalleryItem(id) {
  const item = galleryItemsCache.find(row => row.id === id);
  if (!item) return;
  document.getElementById('galleryEditId').value = item.id;
  document.getElementById('galleryTitle').value = item.title || '';
  document.getElementById('galleryCategory').value = item.category || 'Other';
  document.getElementById('galleryVideo').value = item.video_url || '';
  document.getElementById('galleryAlt').value = item.alt_text || '';
  document.getElementById('galleryPublished').checked = !!item.is_published;
  document.getElementById('galleryFormTitle').textContent = 'Edit gallery item';
  document.getElementById('gallerySubmitButton').textContent = 'Save changes';
  document.getElementById('galleryCancelEdit').hidden = false;
  document.getElementById('galleryFormNote').textContent = 'Change the details below. Choose a new photo only if you want to replace the current one.';
  document.getElementById('galleryTitle').focus();
  window.scrollTo({top:0,behavior:'smooth'});
}

function resetGalleryForm() {
  const form = document.getElementById('galleryAdminForm');
  form.reset();
  document.getElementById('galleryEditId').value = '';
  document.getElementById('galleryFormTitle').textContent = 'Add gallery item';
  document.getElementById('gallerySubmitButton').textContent = 'Add item';
  document.getElementById('galleryCancelEdit').hidden = true;
}

async function moveGalleryItem(id, direction) {
  const index = galleryItemsCache.findIndex(item => item.id === id);
  const targetIndex = index + direction;
  if (index < 0 || targetIndex < 0 || targetIndex >= galleryItemsCache.length) return;
  const current = galleryItemsCache[index];
  const target = galleryItemsCache[targetIndex];
  const currentOrder = Number.isFinite(current.sort_order) ? current.sort_order : index;
  const targetOrder = Number.isFinite(target.sort_order) ? target.sort_order : targetIndex;
  const { error: firstError } = await supabaseGallery.from('gallery_items').update({sort_order: targetOrder}).eq('id', current.id);
  if (firstError) return;
  const { error: secondError } = await supabaseGallery.from('gallery_items').update({sort_order: currentOrder}).eq('id', target.id);
  if (!secondError) loadGalleryItems();
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
document.getElementById('galleryCancelEdit')?.addEventListener('click', () => {
  resetGalleryForm();
  document.getElementById('galleryFormNote').textContent = 'You can add the details now, with or without a photo.';
});
loadGalleryItems();
