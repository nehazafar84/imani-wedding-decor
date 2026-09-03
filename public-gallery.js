const publicGalleryClient = window.supabase.createClient(
  'https://lgdhudhsorazcjhtisrs.supabase.co',
  'sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm'
);

function publicGalleryEscape(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function publicGalleryImageUrl(path) {
  if (!path) return '';
  return publicGalleryClient.storage.from('gallery').getPublicUrl(path).data.publicUrl;
}

function safePublicVideoUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function publicGalleryKey(value) {
  return String(value || 'Wedding').trim().toLowerCase();
}

function renderPublicGallery(container, items) {
  container.innerHTML = items.map((item, index) => {
    const imageUrl = publicGalleryImageUrl(item.image_path);
    const videoUrl = safePublicVideoUrl(item.video_url);
    const image = imageUrl
      ? `<img src="${publicGalleryEscape(imageUrl)}" alt="${publicGalleryEscape(item.alt_text || item.title || 'Imani Events wedding décor')}" loading="lazy" decoding="async">`
      : '<div class="public-gallery-placeholder">Image coming soon</div>';
    const video = videoUrl
      ? `<a class="public-gallery-video" href="${publicGalleryEscape(videoUrl)}" target="_blank" rel="noopener noreferrer" aria-label="View video for ${publicGalleryEscape(item.title || 'this gallery item')}">View video</a>`
      : '';

    return `<article class="public-gallery-card ${index % 5 === 0 ? 'featured' : ''}">
      <div class="public-gallery-media">${image}</div>
      <div class="public-gallery-copy">
        <span>${publicGalleryEscape(item.category || 'Wedding')}</span>
        <h3>${publicGalleryEscape(item.title)}</h3>
        ${video}
      </div>
    </article>`;
  }).join('');
}

async function loadPublicGallery() {
  const container = document.getElementById('liveGallery');
  const filters = document.getElementById('galleryFilters');
  const status = document.getElementById('galleryStatus');
  if (!container) return;

  const { data, error } = await publicGalleryClient
    .from('gallery_items')
    .select('id,title,category,image_path,video_url,alt_text,sort_order,created_at')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = '<div class="public-gallery-empty">Gallery is temporarily unavailable.</div>';
    if (status) status.textContent = 'Please try again shortly.';
    return;
  }

  if (!data.length) {
    container.innerHTML = '<div class="public-gallery-empty">Our latest wedding work will appear here soon.</div>';
    if (status) status.textContent = 'New celebrations are coming soon.';
    return;
  }

  const categories = [...new Map(data.map(item => [publicGalleryKey(item.category), String(item.category || 'Wedding').trim()])).entries()];
  if (filters) {
    filters.innerHTML = [
      '<button type="button" class="gallery-filter active" data-filter="all" aria-pressed="true">All celebrations</button>',
      ...categories.map(([key, label]) => `<button type="button" class="gallery-filter" data-filter="${publicGalleryEscape(key)}" aria-pressed="false">${publicGalleryEscape(label)}</button>`)
    ].join('');

    filters.addEventListener('click', event => {
      const button = event.target.closest('.gallery-filter');
      if (!button) return;
      const key = button.dataset.filter;
      const visible = key === 'all' ? data : data.filter(item => publicGalleryKey(item.category) === key);
      filters.querySelectorAll('.gallery-filter').forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      renderPublicGallery(container, visible);
      if (status) status.textContent = `${visible.length} ${visible.length === 1 ? 'celebration' : 'celebrations'} shown`;
    });
  }

  renderPublicGallery(container, data);
  if (status) status.textContent = `${data.length} ${data.length === 1 ? 'celebration' : 'celebrations'} to explore`;
}

loadPublicGallery();
