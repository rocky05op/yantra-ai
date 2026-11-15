// Site-wide motion layer (Web Animations). API mirrors Framer Motion's vanilla `animate`/`stagger`
// so it can be swapped for the `motion` package with a one-line import change.
import '../../css/fx.css';
import { prefersReducedMotion, isCoarsePointer } from './util.js';

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const stagger = (step = 0.07, start = 0) => (i) => start + i * step;
export function animate(els, keyframes, { duration = 0.7, delay = 0, ease = EASE } = {}) {
  const list = els instanceof Element ? [els] : [...els];
  return list.map((el, i) => el.animate(keyframes, { duration: duration * 1000, delay: (typeof delay === 'function' ? delay(i, list.length) : delay) * 1000, easing: ease, fill: 'backwards' }));
}

export function initFx() {
  const reduce = prefersReducedMotion();
  document.body.classList.add('fx');
  if (reduce) return;

  // Navigation entrance + staggered links
  const nav = document.querySelector('.nav-inner');
  if (nav) animate(nav, [{ opacity: 0, transform: 'translateY(-22px)' }, { opacity: 1, transform: 'none' }], { duration: 0.8 });
  animate(document.querySelectorAll('.nav-links a'), [{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], { delay: stagger(0.07, 0.2), duration: 0.6 });

  // Cards / panels: staggered spring-in when scrolled into view
  const targets = [...document.querySelectorAll('.card, .glass:not(.modal):not(.toast), .p2i-hist, .work, .ws')].filter((el) => !el.closest('[data-reveal]') && !el.hasAttribute('data-reveal'));
  if ('IntersectionObserver' in window) {
    const seen = new Set();
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting);
      vis.forEach((e, i) => { io.unobserve(e.target); animate(e.target, [{ opacity: 0, transform: 'translateY(30px) scale(0.96)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }], { delay: i * 0.08, duration: 0.8 }); });
    }, { threshold: 0.08 });
    targets.forEach((t) => { if (!seen.has(t)) { seen.add(t); io.observe(t); } });
  }

  // Glow follows pointer on every button (CSS reads --bx / --by)
  document.addEventListener('pointermove', (e) => {
    const b = e.target.closest && e.target.closest('.btn, .btn-icon, .chip, .p2i-style, .p2i-mini');
    if (!b) return;
    const r = b.getBoundingClientRect();
    b.style.setProperty('--bx', `${e.clientX - r.left}px`); b.style.setProperty('--by', `${e.clientY - r.top}px`);
  }, { passive: true });

  // Click ripple
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest && e.target.closest('.btn, .btn-icon');
    if (!b || b.disabled) return;
    const r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2;
    const rp = document.createElement('span'); rp.className = 'fx-ripple';
    rp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.appendChild(rp); setTimeout(() => rp.remove(), 700);
  });

  // Cursor-reactive floating glow orbs (very light, desktop only)
  if (!isCoarsePointer()) {
    const orb = document.createElement('div'); orb.className = 'fx-cursor'; orb.setAttribute('aria-hidden', 'true'); document.body.appendChild(orb);
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, raf = 0;
    const tick = () => { x += (tx - x) * 0.12; y += (ty - y) * 0.12; orb.style.transform = `translate3d(${x - 150}px,${y - 150}px,0)`; raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(tick) : 0; };
    window.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; orb.style.opacity = 1; if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
  }

  // Smooth page-leave overlay wipe (complements the existing fade)
  const wipe = document.createElement('div'); wipe.className = 'fx-wipe'; wipe.setAttribute('aria-hidden', 'true'); document.body.appendChild(wipe);
  new MutationObserver(() => { if (document.body.classList.contains('is-leaving')) wipe.classList.add('on'); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('pageshow', () => wipe.classList.remove('on'));
}
