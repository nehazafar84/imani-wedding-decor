const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');

function setMenuState(isOpen) {
  if (!nav || !menuButton) return;
  nav.classList.toggle('open', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  if (window.matchMedia('(max-width: 800px)').matches) nav.setAttribute('aria-hidden', String(!isOpen));
  else nav.removeAttribute('aria-hidden');
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

menuButton?.setAttribute('aria-expanded', 'false');
if (nav && window.matchMedia('(max-width: 800px)').matches) nav.setAttribute('aria-hidden', 'true');
menuButton?.addEventListener('click', () => setMenuState(!nav.classList.contains('open')));
document.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', () => setMenuState(false)));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && nav?.classList.contains('open')) { setMenuState(false); menuButton?.focus(); } });
window.addEventListener('resize', () => {
  if (window.innerWidth > 800) {
    if (nav?.classList.contains('open')) setMenuState(false);
    nav?.removeAttribute('aria-hidden');
  } else if (nav && !nav.classList.contains('open')) nav.setAttribute('aria-hidden', 'true');
});

if (!document.querySelector('link[data-mobile-conversion]')) {
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'mobile-conversion.css';
  css.dataset.mobileConversion = 'true';
  document.head.appendChild(css);
}

if (!document.body.classList.contains('admin-body') && !document.querySelector('.mobile-conversion-bar')) {
  const bar = document.createElement('div');
  bar.className = 'mobile-conversion-bar';
  bar.setAttribute('aria-label', 'Quick actions');
  bar.innerHTML = '<a href="gallery.html">View our work</a><a class="primary" href="quote.html">Get a quote</a>';
  document.body.appendChild(bar);
}

const areasCard = document.querySelector('.areas-card');
if (areasCard && !areasCard.querySelector('.local-area-links')) {
  const links = document.createElement('div');
  links.className = 'local-area-links';
  links.innerHTML = '<a href="wedding-decor-cardiff.html">Cardiff wedding décor</a><a href="nikkah-decor-cardiff.html">Nikkah décor Cardiff</a><a href="asian-wedding-decor-bristol.html">Asian wedding décor Bristol</a>';
  areasCard.appendChild(links);
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'));
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
