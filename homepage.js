(() => {
  const tabs = Array.from(document.querySelectorAll('.home-mood-tabs [role="tab"]'));
  const panels = Array.from(document.querySelectorAll('.home-mood-panel'));
  const selectMood = (tab, moveFocus = false) => {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
    if (moveFocus) tab.focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectMood(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectMood(tabs[next], true);
    });
  });

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
      document.querySelectorAll('.home-awaiting').forEach(element => {
        element.classList.remove('home-awaiting');
      });
      observer.disconnect();
    });
  }

  const menu = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('homeNavigation');
  if (menu && navigation) {
    const synchronizeMenu = () => {
      const isMobile = window.matchMedia('(max-width: 800px)').matches;
      const isOpen = menu.getAttribute('aria-expanded') === 'true';
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
