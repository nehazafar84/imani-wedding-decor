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

async function loadPublicGallery() {
  const container = document.getElementById('liveGallery');
  if (!container) return;

  const { data, error } = await publicGalleryClient
    .from('gallery_items')
    .select('id,title,category,image_path,video_url,alt_text,sort_order,created_at')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    container.innerHTML = '<div class="public-gallery-empty">Gallery is temporarily unavailable.</div>';
    return;
  }

  if (!data.length) {
    container.innerHTML = '<div class="public-gallery-empty">Our latest wedding work will appear here soon.</div>';
    return;
  }

  container.innerHTML = data.map((item, index) => {
    const imageUrl = publicGalleryImageUrl(item.image_path);
    const image = imageUrl
      ? `<img src="${publicGalleryEscape(imageUrl)}" alt="${publicGalleryEscape(item.alt_text || item.title)}" loading="lazy">`
      : '<div class="public-gallery-placeholder">Image coming soon</div>';
    const video = item.video_url
      ? `<a class="public-gallery-video" href="${publicGalleryEscape(item.video_url)}" target="_blank" rel="noopener">View video</a>`
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

loadPublicGallery();
