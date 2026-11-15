import { initShell } from '../core/shell.js';
import { drawYantra, drawCoreGlow, fitCanvas } from '../core/yantra-art.js';
import { prefersReducedMotion } from '../core/util.js';

initShell();

const canvas = document.getElementById('loadingCanvas');
const ctx = canvas.getContext('2d');
const fill = document.getElementById('loaderFill');
const msg = document.getElementById('loaderMsg');
const bar = document.querySelector('.loader-bar');
const MESSAGES = ['Initializing creative power…', 'Tuning the geometry…', 'Mixing colours…', 'Opening the studio…'];
const DURATION = prefersReducedMotion() ? 600 : 2400; // same ~2.2s feel as the original loader
const t0 = performance.now();
let lastMsg = -1;

function frame(now) {
  const p = Math.min((now - t0) / DURATION, 1);
  const { w, h } = fitCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  const ease = 1 - Math.pow(1 - p, 3);
  drawCoreGlow(ctx, w / 2, h / 2, w * 0.5 * ease, '#a855f7');
  drawYantra(ctx, { cx: w / 2, cy: h / 2, maxR: w * 0.4 * ease, layers: 6, symmetry: 6, rotation: 0, spin: p * 360, primary: '#c4b5fd', secondary: '#22d3ee' });
  ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.9; ctx.beginPath(); ctx.arc(w / 2, h / 2, 4 + 3 * Math.sin(now / 160), 0, 7); ctx.fill(); ctx.globalAlpha = 1;

  fill.style.width = `${p * 100}%`;
  bar.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  const m = Math.min(MESSAGES.length - 1, Math.floor(p * MESSAGES.length));
  if (m !== lastMsg) { lastMsg = m; msg.textContent = MESSAGES[m]; }

  if (p < 1) requestAnimationFrame(frame);
  else setTimeout(() => { document.body.classList.add('is-leaving'); setTimeout(() => { location.href = 'landing.html'; }, 230); }, 250);
}
requestAnimationFrame(frame);
