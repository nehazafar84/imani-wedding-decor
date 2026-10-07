(() => {
  const enquiryForm = document.getElementById('quoteForm');
  if (enquiryForm) {
    const links = [document.querySelector('.nav-cta[aria-current="page"]'), document.querySelector('.mobile-conversion-bar .primary')].filter(Boolean);
    links.forEach(link => link.addEventListener('click', event => {
      event.preventDefault();
      enquiryForm.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'});
      enquiryForm.querySelector('input')?.focus({preventScroll: true});
    }));
  }
  const menu = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('siteNavigation');
  if (menu && navigation) {
    const background = [...document.querySelectorAll('main, .site-footer, .mobile-conversion-bar, .visualiser-sticky-actions')];
    const synchronizeMenu = () => {
      const mobile = window.matchMedia('(max-width: 800px)').matches;
      const open = mobile && menu.getAttribute('aria-expanded') === 'true';
      navigation.inert = mobile && !open;
      background.forEach(element => { element.inert = open; });
      document.body.classList.toggle('menu-active', open);
    };
    new MutationObserver(synchronizeMenu).observe(menu, {attributes: true, attributeFilter: ['aria-expanded']});
    window.addEventListener('resize', synchronizeMenu);
    synchronizeMenu();
    document.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || menu.getAttribute('aria-expanded') !== 'true' || !window.matchMedia('(max-width: 800px)').matches) return;
      const last = navigation.querySelector('a:last-child');
      if (event.shiftKey && document.activeElement === menu) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); menu.focus();
      }
    });
  }

  const cards = [...document.querySelectorAll('[data-public-gallery]')];
  if (!cards.length) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'public-lightbox';
  dialog.setAttribute('aria-labelledby', 'publicLightboxTitle');
  dialog.innerHTML = '<div class="public-lightbox-top"><span>IMANI / DÉCOR CONCEPTS</span><button type="button" data-close aria-label="Close image preview">×</button></div><img alt=""><div class="public-lightbox-bottom"><button type="button" data-previous aria-label="Previous image">←</button><div><h2 id="publicLightboxTitle"></h2><p class="public-lightbox-count"></p></div><button type="button" data-next aria-label="Next image">→</button></div>';
  document.body.appendChild(dialog);
  const image = dialog.querySelector('img');
  const title = dialog.querySelector('h2');
  const count = dialog.querySelector('.public-lightbox-count');
  let active = 0;
  let opener;
  const show = index => {
    active = (index + cards.length) % cards.length;
    const photo = cards[active].querySelector('img');
    image.src = photo.src; image.alt = photo.alt;
    image.width = Number(photo.getAttribute('width')); image.height = Number(photo.getAttribute('height'));
    title.textContent = cards[active].querySelector('strong').textContent;
    count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')} · AI-CREATED CONCEPT`;
  };
  cards.forEach((card, index) => card.addEventListener('click', () => { opener = card; show(index); dialog.showModal(); }));
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-previous]').addEventListener('click', () => show(active - 1));
  dialog.querySelector('[data-next]').addEventListener('click', () => show(active + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(active - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(active + 1); }
  });
  dialog.addEventListener('close', () => opener?.focus());
})();
