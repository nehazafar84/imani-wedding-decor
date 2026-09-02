(() => {
  const sidebar = document.querySelector('.admin-sidebar');
  const nav = document.querySelector('.admin-nav');
  const brand = document.querySelector('.admin-brand');
  if (!sidebar || !nav || !brand || document.querySelector('.admin-menu-toggle')) return;

  const style = document.createElement('style');
  style.textContent = `
    .admin-menu-toggle{display:none;border:0;background:transparent;color:#fff;width:42px;height:42px;padding:8px;border-radius:8px;cursor:pointer;align-items:center;justify-content:center}
    .admin-menu-toggle span,.admin-menu-toggle span::before,.admin-menu-toggle span::after{display:block;width:22px;height:2px;background:currentColor;border-radius:2px;position:relative;transition:.2s ease}
    .admin-menu-toggle span::before,.admin-menu-toggle span::after{content:"";position:absolute;left:0}
    .admin-menu-toggle span::before{top:-7px}.admin-menu-toggle span::after{top:7px}
    .admin-menu-toggle[aria-expanded="true"] span{background:transparent}.admin-menu-toggle[aria-expanded="true"] span::before{top:0;transform:rotate(45deg)}.admin-menu-toggle[aria-expanded="true"] span::after{top:0;transform:rotate(-45deg)}
    @media(max-width:600px){
      .admin-sidebar{padding:14px!important;overflow:visible!important}
      .admin-brand{margin:0!important;width:100%;display:flex!important;align-items:center!important}
      .admin-menu-toggle{display:inline-flex;margin-left:auto}
      .admin-nav{display:none!important;overflow:visible!important;padding:12px 0 2px!important;margin:0!important;gap:6px!important;flex-direction:column!important}
      .admin-sidebar.menu-open .admin-nav{display:flex!important}
      .admin-nav a{width:100%;box-sizing:border-box;padding:11px 12px!important;font-size:.82rem!important;border-radius:8px!important}
      .admin-nav a.active{order:initial!important;box-shadow:none!important;background:rgba(255,255,255,.12)!important}
    }
  `;
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'admin-menu-toggle';
  button.setAttribute('aria-label', 'Open admin menu');
  button.setAttribute('aria-expanded', 'false');
  button.innerHTML = '<span></span>';
  brand.appendChild(button);

  const setOpen = (open) => {
    sidebar.classList.toggle('menu-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close admin menu' : 'Open admin menu');
  };

  button.addEventListener('click', () => setOpen(!sidebar.classList.contains('menu-open')));
  nav.addEventListener('click', (event) => { if (event.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 600) setOpen(false); });
})();