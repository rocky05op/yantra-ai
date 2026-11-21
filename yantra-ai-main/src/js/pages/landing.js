import { initShell } from '../core/shell.js';
import { drawYantra, drawCoreGlow, fitCanvas } from '../core/yantra-art.js';
import { prefersReducedMotion } from '../core/util.js';

initShell();

const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
const reduce = prefersReducedMotion();
let spin = 0, last = performance.now(), visible = true, pointerTilt = 0, raf = 0;

new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); } }).observe(canvas);
window.addEventListener('pointermove', (e) => { pointerTilt = (e.clientX / window.innerWidth - 0.5) * 24; }, { passive: true });

function loop(now) {
  raf = 0;
  if (!visible) return;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!reduce) spin += dt * 14;
  const { w, h } = fitCanvas(canvas);
  ctx.clearRect(0, 0, w, h);
  const pulse = 1 + (reduce ? 0 : Math.sin(now / 1400) * 0.03);
  drawCoreGlow(ctx, w / 2, h / 2, w * 0.46, '#8b5cf6');
  drawYantra(ctx, { cx: w / 2, cy: h / 2, maxR: w * 0.42 * pulse, layers: 7, symmetry: 6, rotation: pointerTilt, spin, primary: '#c4b5fd', secondary: '#22d3ee', node: 0.09, lineWidth: 1.2 });
  drawYantra(ctx, { cx: w / 2, cy: h / 2, maxR: w * 0.24, layers: 3, symmetry: 3, rotation: 30, spin: -spin * 1.6, primary: '#f472b6', secondary: '#a855f7', node: 0.12, lineWidth: 1.2 });
  ctx.fillStyle = '#fff'; ctx.shadowColor = '#a855f7'; ctx.shadowBlur = 18;
  ctx.beginPath(); ctx.arc(w / 2, h / 2, 5, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  if (!reduce) raf = requestAnimationFrame(loop);
}
raf = requestAnimationFrame(loop);
