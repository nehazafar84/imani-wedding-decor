const siteContentClient = window.supabase.createClient(
  'https://lgdhudhsorazcjhtisrs.supabase.co',
  'sb_publishable_-sZ0I8Ymjtc67J23oUyMhw_EnqXUyFm'
);

async function loadSiteContent() {
  const { data, error } = await siteContentClient
    .from('site_content')
    .select('key,value');

  if (error || !data) return;

  const content = Object.fromEntries(data.map(row => [row.key, row.value]));

  document.querySelectorAll('[data-content]').forEach(el => {
    const key = el.dataset.content;
    if (content[key]) el.textContent = content[key];
  });
}

loadSiteContent();
