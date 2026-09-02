const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');

function setMenuState(isOpen) {
  if (!nav || !menuButton) return;
  nav.classList.toggle('open', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

menuButton?.setAttribute('aria-expanded', 'false');
menuButton?.addEventListener('click', () => {
  setMenuState(!nav.classList.contains('open'));
});

document.querySelectorAll('.main-nav a').forEach((link) => {
  link.addEventListener('click', () => setMenuState(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav?.classList.contains('open')) setMenuState(false);
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 800 && nav?.classList.contains('open')) setMenuState(false);
});

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
