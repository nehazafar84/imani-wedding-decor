(() => {
  const comparison = document.querySelector('.home-comparison');
  const range = document.getElementById('homeReveal');
  if (comparison && range) {
    const renderComparison = () => {
      const amount = Math.max(0, Math.min(100, Number(range.value)));
      comparison.style.setProperty('--reveal', `${amount}%`);
      range.setAttribute('aria-valuetext', `${amount} percent styled`);
    };
    range.addEventListener('input', renderComparison);
    renderComparison();
  }

  const menu = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('homeNavigation');
  if (menu && navigation) {
    const synchronizeMenu = () => {
      const isMobile = window.matchMedia('(max-width: 800px)').matches;
      const isOpen = menu.getAttribute('aria-expanded') === 'true';
      // Prevent the closed mobile navigation from receiving keyboard focus.
      navigation.inert = isMobile && !isOpen;
      document.body.classList.toggle('menu-active', isMobile && isOpen);
    };
    new MutationObserver(synchronizeMenu).observe(menu, {
      attributes: true,
      attributeFilter: ['aria-expanded']
    });
    window.addEventListener('resize', synchronizeMenu);
    synchronizeMenu();
    document.addEventListener('keydown', event => {
      if (event.key !== 'Tab' || menu.getAttribute('aria-expanded') !== 'true' ||
          !window.matchMedia('(max-width: 800px)').matches) return;
      const links = Array.from(navigation.querySelectorAll('a[href]'));
      const last = links[links.length - 1];
      if (event.shiftKey && document.activeElement === menu) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        menu.focus();
      }
    });
  }
})();
