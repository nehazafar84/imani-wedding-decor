(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('home-awaiting');
        entry.target.classList.add('home-arrived');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.home-reveal').forEach(element => {
      element.classList.add('home-awaiting');
      observer.observe(element);
    });
    reducedMotion.addEventListener('change', event => {
      if (!event.matches) return;
      document.querySelectorAll('.home-awaiting').forEach(element => element.classList.remove('home-awaiting'));
      observer.disconnect();
    });
  }

  const cards = Array.from(document.querySelectorAll('[data-gallery]'));
  const dialog = document.querySelector('.home-lightbox');
  const image = dialog?.querySelector('.home-lightbox-image');
  const title = dialog?.querySelector('#lightboxTitle');
  const count = dialog?.querySelector('.home-lightbox-count');
  let activeIndex = 0;
  let opener;
  const showImage = index => {
    activeIndex = (index + cards.length) % cards.length;
    const card = cards[activeIndex];
    const photo = card.querySelector('img');
    image.src = photo.src;
    image.alt = photo.alt;
    image.width = Number(photo.getAttribute('width'));
    image.height = Number(photo.getAttribute('height'));
    title.textContent = card.querySelector('strong').textContent;
    count.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')} · AI-CREATED CONCEPT`;
  };
  if (dialog && cards.length) {
    cards.forEach((card, index) => card.addEventListener('click', () => {
      opener = card; showImage(index); dialog.showModal();
    }));
    dialog.querySelector('.home-lightbox-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.home-lightbox-previous').addEventListener('click', () => showImage(activeIndex - 1));
    dialog.querySelector('.home-lightbox-next').addEventListener('click', () => showImage(activeIndex + 1));
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); showImage(activeIndex - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); showImage(activeIndex + 1); }
    });
    dialog.addEventListener('close', () => opener?.focus());
  }
})();
