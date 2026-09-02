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

  const setText = (selector, value) => {
    const el = document.querySelector(selector);
    if (el && value) el.textContent = value;
  };

  setText('[data-content="home_eyebrow"]', content.home_eyebrow);
  setText('[data-content="home_title"]', content.home_title);
  setText('[data-content="home_intro"]', content.home_intro);
  setText('[data-content="home_story_title"]', content.home_story_title);
  setText('[data-content="home_areas"]', content.home_areas);
  setText('[data-content="about_short"]', content.about_short);
}

loadSiteContent();
