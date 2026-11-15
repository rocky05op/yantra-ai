// App shell shared by every page: ambient background, premium navigation,
// page transitions, icon hydration, motion + range bindings.
import { hydrateIcons, svg, logoSvg } from './icons.js';
import { initBackground } from './background.js';
import { initMotion } from './motion.js';
import { bindRanges } from './ui.js';
import { prefersReducedMotion } from './util.js';
import { initFx } from './fx.js';

const LINKS = [
  { id: 'landing', href: 'landing.html', label: 'Home', icon: 'home' },
  { id: 'dashboard', href: 'dashboard.html', label: 'Studio', icon: 'dashboard' },
  { id: 'pattern', href: 'index.html', label: 'Patterns', icon: 'hexagon' },
  { id: 'prompt', href: 'prompt-to-image.html', label: 'Prompt to Image', icon: 'wand' },
  { id: 'sketch', href: 'sketch-to-image.html', label: 'Sketch to Image', icon: 'brush' },
];

export function initShell({ ambient = true } = {}) {
  const page = document.body.dataset.page || '';

  if (ambient) {
    const amb = document.createElement('div');
    amb.className = 'ambient';
    amb.setAttribute('aria-hidden', 'true');
    amb.innerHTML = '<div class="orb orb--a"></div><div class="orb orb--b"></div><div class="orb orb--c"></div><canvas></canvas>';
    document.body.prepend(amb);
    initBackground(amb.querySelector('canvas'));
  }

  const root = document.getElementById('nav-root');
  if (root) buildNav(root, page);

  hydrateIcons();
  bindRanges();
  initMotion();
  setupTransitions();
  initFx();
}

function buildNav(root, page) {
  const links = LINKS.map((l) => `<a href="${l.href}" data-nav="${l.id}"${l.id === page ? ' aria-current="page"' : ''}>${svg(l.icon, { size: 18 })}<span>${l.label}</span></a>`).join('');
  const drawerLinks = LINKS.map((l, i) => `<a href="${l.href}" style="--i:${i}"${l.id === page ? ' aria-current="page"' : ''}>${svg(l.icon, { size: 22 })}<span>${l.label}</span></a>`).join('');
  root.outerHTML = `
    <header class="nav" id="nav">
      <div class="nav-inner">
        <a class="brand" href="landing.html" aria-label="YANTRA home"><span class="brand-mark">${logoSvg()}</span><span>YANTRA</span></a>
        <nav class="nav-links" aria-label="Primary">${links}<span class="nav-indicator"></span></nav>
        <div class="nav-actions">
          <a class="btn btn-primary btn-sm" href="prompt-to-image.html" data-magnetic>${svg('sparkles', { size: 16 })}<span>Start creating</span></a>
          <button class="btn-icon nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="drawer">${svg('menu', { size: 22 })}</button>
        </div>
      </div>
    </header>
    <div class="drawer" id="drawer">${drawerLinks}</div>`;

  const nav = document.getElementById('nav');
  const bar = nav.querySelector('.nav-links');
  const ind = bar.querySelector('.nav-indicator');
  const toggle = nav.querySelector('.nav-toggle');
  const drawer = document.getElementById('drawer');

  const solid = () => nav.classList.toggle('is-solid', window.scrollY > 12 || page !== 'landing');
  solid();
  window.addEventListener('scroll', solid, { passive: true });

  const moveTo = (a) => {
    if (!a) { ind.style.setProperty('--o', 0); return; }
    ind.style.setProperty('--x', `${a.offsetLeft}px`);
    ind.style.setProperty('--w', `${a.offsetWidth}px`);
    ind.style.setProperty('--o', 1);
  };
  const active = () => bar.querySelector('[aria-current="page"]');
  moveTo(active());
  bar.querySelectorAll('a').forEach((a) => {
    a.addEventListener('pointerenter', () => moveTo(a));
    a.addEventListener('focus', () => moveTo(a));
  });
  bar.addEventListener('pointerleave', () => moveTo(active()));
  window.addEventListener('resize', () => moveTo(active()));
  document.fonts && document.fonts.ready.then(() => moveTo(active()));

  const setOpen = (open) => {
    drawer.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.innerHTML = svg(open ? 'x' : 'menu', { size: 22 });
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setOpen(!drawer.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  window.matchMedia('(min-width: 861px)').addEventListener('change', (m) => m.matches && setOpen(false));
}

/** Fade out before navigating to another YANTRA page. */
function setupTransitions() {
  window.addEventListener('pageshow', () => document.body.classList.remove('is-leaving'));
  if (prefersReducedMotion()) return;
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target || a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || (url.pathname === location.pathname && url.hash)) return;
    e.preventDefault();
    document.body.classList.add('is-leaving');
    setTimeout(() => { location.href = url.href; }, 220);
  });
}
