// Scroll reveals, magnetic buttons, tilt/spotlight cards, pointer parallax, count-up.
import { prefersReducedMotion, isCoarsePointer, clamp } from './util.js';

export function initMotion(root = document) {
  const reduce = prefersReducedMotion();
  const coarse = isCoarsePointer();

  // Scroll-triggered reveals
  const reveals = root.querySelectorAll('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach((n) => n.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach((n) => io.observe(n));
  }

  if (reduce) return;

  // Magnetic buttons
  if (!coarse) {
    root.querySelectorAll('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.22, y = (e.clientY - (r.top + r.height / 2)) * 0.3;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  // Spotlight + tilt cards
  root.querySelectorAll('.card, [data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      if (!coarse && el.dataset.tilt !== 'off') {
        el.style.setProperty('--ry', `${clamp((px - 0.5) * 6, -3, 3)}deg`);
        el.style.setProperty('--rx', `${clamp((0.5 - py) * 6, -3, 3)}deg`);
      }
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
  });

  // Pointer + scroll parallax
  const layers = [...root.querySelectorAll('[data-parallax]')];
  if (layers.length && !coarse) {
    let mx = 0, my = 0, raf = 0;
    const apply = () => {
      raf = 0;
      const sy = window.scrollY;
      layers.forEach((l) => {
        const k = parseFloat(l.dataset.parallax) || 0.03;
        l.style.transform = `translate3d(${mx * k * 100}px, ${my * k * 100 - sy * k * 0.6}px, 0)`;
      });
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(apply); };
    window.addEventListener('pointermove', (e) => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; queue(); }, { passive: true });
    window.addEventListener('scroll', queue, { passive: true });
  }
}

/** Animate a number up to a real value. */
export function countUp(el, to, duration = 900) {
  if (prefersReducedMotion() || to === 0) { el.textContent = String(to); return; }
  const t0 = performance.now();
  const step = (t) => {
    const k = clamp((t - t0) / duration, 0, 1);
    el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
