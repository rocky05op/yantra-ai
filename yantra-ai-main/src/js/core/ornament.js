// Indian-inspired ornamental motion layer (SVG + CSS only). Alpana / Mandana / mandala / lotus.
import '../../css/ornament.css';
import { prefersReducedMotion, isCoarsePointer } from './util.js';

const NS = 'http://www.w3.org/2000/svg';
const pt = (r, a) => `${(100 + r * Math.cos(a)).toFixed(1)},${(100 + r * Math.sin(a)).toFixed(1)}`;

/** Lotus-petal ring path (n petals between radii r0..r1). */
function petals(n, r0, r1, rot = 0) {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2, w = Math.PI / n * 0.9;
    d += `M${pt(r0, a)}Q${pt((r0 + r1) / 2 + 6, a - w)} ${pt(r1, a)}Q${pt((r0 + r1) / 2 + 6, a + w)} ${pt(r0, a)}`;
  }
  return d;
}
function star(n, r0, r1, rot = 0) {
  let d = '';
  for (let i = 0; i < n * 2; i++) d += `${i ? 'L' : 'M'}${pt(i % 2 ? r0 : r1, rot + (i / (n * 2)) * Math.PI * 2)}`;
  return d + 'Z';
}
function dots(n, r, rad) {
  let d = '';
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, x = 100 + r * Math.cos(a), y = 100 + r * Math.sin(a); d += `M${(x - rad).toFixed(1)},${y.toFixed(1)}a${rad},${rad} 0 1,0 ${rad * 2},0a${rad},${rad} 0 1,0 ${-rad * 2},0`; }
  return d;
}

/** Returns an <svg> string of a mandala whose strokes draw themselves in (pathLength=1). */
export function mandalaSVG({ gold = '#d4af5a', violet = '#8b5cf6', cls = '' } = {}) {
  const P = (d, c, i, w = 0.6) => `<path class="orn-draw" pathLength="1" style="--i:${i}" d="${d}" stroke="${c}" stroke-width="${w}" fill="none"/>`;
  return `<svg class="orn-mandala ${cls}" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><g stroke-linecap="round" stroke-linejoin="round">
    <circle class="orn-draw" pathLength="1" style="--i:0" cx="100" cy="100" r="96" stroke="${gold}" stroke-width=".6" fill="none"/>
    <circle class="orn-draw" pathLength="1" style="--i:1" cx="100" cy="100" r="88" stroke="${violet}" stroke-width=".4" fill="none"/>
    ${P(petals(24, 62, 94), gold, 2)}${P(petals(12, 40, 74, .13), violet, 3, .7)}
    ${P(star(8, 40, 70), gold, 4)}${P(star(6, 22, 52, .5), violet, 5, .7)}
    ${P(petals(8, 8, 32, .2), gold, 6, .8)}${P(dots(36, 91, 1), gold, 7, .5)}${P(dots(16, 30, 1.4), violet, 8, .5)}
    <circle class="orn-draw" pathLength="1" style="--i:9" cx="100" cy="100" r="5" stroke="${gold}" stroke-width=".8" fill="none"/>
  </g></svg>`;
}

/** Small glowing lotus outline. */
export function lotusSVG(c = '#d4af5a') {
  return `<svg class="orn-lotus" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><path class="orn-draw" pathLength="1" style="--i:0" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round" d="${petals(8, 30, 90, -Math.PI / 2 + 0.2)}"/></svg>`;
}

/** Alpana-style frieze (data-URI tile): wave + dots + diamonds. */
const FRIEZE = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='${NS}' width='96' height='14' viewBox='0 0 96 14' fill='none' stroke='#d4af5a' stroke-width='.8'><path d='M0 7Q12 0 24 7T48 7T72 7T96 7' opacity='.75'/><path d='M24 3l3 4-3 4-3-4zM72 3l3 4-3 4-3-4z' stroke='#a78bfa'/><circle cx='48' cy='7' r='1.3' fill='#d4af5a' stroke='none'/><circle cx='0' cy='7' r='1.3' fill='#d4af5a' stroke='none'/></svg>`)}")`;

export function initOrnaments() {
  if (document.querySelector('.orn-layer')) return;
  const reduce = prefersReducedMotion(), coarse = isCoarsePointer();
  document.documentElement.style.setProperty('--orn-frieze', FRIEZE);

  // Ambient decorative layer behind content (sits above background canvas, below the page)
  const layer = document.createElement('div');
  layer.className = 'orn-layer'; layer.setAttribute('aria-hidden', 'true');
  const lotuses = coarse ? 3 : 5;
  layer.innerHTML = `
    <div class="orn-slot orn-slot--a" ${coarse ? '' : 'data-parallax="0.02"'}>${mandalaSVG({ cls: 'orn-spin' })}</div>
    <div class="orn-slot orn-slot--b" ${coarse ? '' : 'data-parallax="-0.03"'}>${mandalaSVG({ gold: '#a78bfa', violet: '#d4af5a', cls: 'orn-spin orn-spin--rev' })}</div>
    <div class="orn-rings"><i></i><i></i><i></i></div>
    ${Array.from({ length: lotuses }, (_, i) => `<div class="orn-float" style="--x:${8 + i * (84 / lotuses) + (i % 2) * 6}%;--s:${26 + (i * 13) % 22}px;--t:${16 + i * 4}s;--d:${-i * 4.5}s">${lotusSVG(i % 2 ? '#a78bfa' : '#d4af5a')}</div>`).join('')}`;
  document.body.insertBefore(layer, document.body.firstChild);

  // Alpana frieze under the navigation bar
  const nav = document.querySelector('.nav');
  if (nav && !nav.querySelector('.orn-frieze')) { const f = document.createElement('div'); f.className = 'orn-frieze'; nav.appendChild(f); }

  // Animated ornamental edges on panels/cards (capped for performance)
  const hosts = [...document.querySelectorAll('.card, .y-panel, .cta')].slice(0, coarse ? 8 : 18);
  hosts.forEach((h) => { if (!h.querySelector(':scope > .orn-edge')) { const e = document.createElement('i'); e.className = 'orn-edge'; e.setAttribute('aria-hidden', 'true'); h.appendChild(e); } });

  // Pause every CSS animation while the tab is hidden
  const sync = () => document.documentElement.classList.toggle('is-hidden', document.hidden);
  document.addEventListener('visibilitychange', sync); sync();

  if (reduce) layer.classList.add('is-static');
}
