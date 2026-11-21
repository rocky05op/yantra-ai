// Loading screen: canvas mandala + particles, time-based progress, guaranteed navigation.
import { mandalaSVG } from '../core/ornament.js';
import { markInternalNav } from '../core/nav.js';
// Intro flow: loading → landing → dashboard. `?next=` may name one existing page (whitelist; never loading.html → no loops).
const PAGES = ['landing.html', 'dashboard.html', 'index.html', 'prompt-to-image.html', 'sketch-to-image.html'];
const want = new URLSearchParams(location.search).get('next');
const NEXT = PAGES.includes(want) ? want : 'landing.html';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DURATION = reduce ? 700 : 3200;
const EXIT_MS = reduce ? 200 : 900;
const MESSAGES = ['Initializing creative power…', 'Tuning the geometry…', 'Mixing colours…', 'Opening the studio…'];

const canvas = document.getElementById('loadingCanvas');
const fill = document.getElementById('loaderFill');
const msg = document.getElementById('loaderMsg');
const bar = document.querySelector('.loader-bar');
const root = document.querySelector('.loading');
const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;

let went = false;
function go() {
  if (went) return;
  went = true;
  markInternalNav(); // tells the entry-point guard this is an intended navigation (no re-trigger)
  location.replace(NEXT);
}
// Hard fallback (independent of rAF/animation): never stuck, even in a background tab or on error.
setTimeout(go, DURATION + EXIT_MS + 1500);
document.getElementById('loaderSkip')?.addEventListener('click', (e) => { e.preventDefault(); go(); });

const draw$ = document.getElementById('loaderDraw');
if (draw$) draw$.innerHTML = mandalaSVG({ cls: 'ld-geo' });

const GOLD = '212,175,90', VIOLET = '139,92,246';
let W = 0, H = 0, dpr = 1;
function resize() {
  if (!canvas) return;
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = canvas.clientWidth; H = canvas.clientHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
}
resize();
addEventListener('resize', resize);

const parts = Array.from({ length: reduce ? 0 : 46 }, () => ({
  x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + .4,
  s: Math.random() * .04 + .01, p: Math.random() * 6.28, c: Math.random() < .6 ? GOLD : VIOLET,
}));

function ring(cx, cy, R, n, rot, kind, col, a) {
  ctx.strokeStyle = `rgba(${col},${a})`;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const t = rot + (i / n) * 6.2832, c = Math.cos(t), s = Math.sin(t);
    if (kind === 'petal') {
      const w = Math.PI / n * .9, r2 = R * 1.22;
      ctx.moveTo(cx + c * R, cy + s * R);
      ctx.quadraticCurveTo(cx + Math.cos(t - w) * r2, cy + Math.sin(t - w) * r2, cx + c * R * 1.34, cy + s * R * 1.34);
      ctx.quadraticCurveTo(cx + Math.cos(t + w) * r2, cy + Math.sin(t + w) * r2, cx + c * R, cy + s * R);
    } else if (kind === 'tri') {
      const t2 = t + 6.2832 / n / 2;
      ctx.moveTo(cx + c * R * 1.15, cy + s * R * 1.15);
      ctx.lineTo(cx + Math.cos(t2) * R * .88, cy + Math.sin(t2) * R * .88);
      ctx.lineTo(cx + Math.cos(t + 6.2832 / n) * R * 1.15, cy + Math.sin(t + 6.2832 / n) * R * 1.15);
    } else {
      ctx.moveTo(cx + c * R, cy + s * R);
      ctx.arc(cx + c * R, cy + s * R, R * .05, 0, 6.2832);
    }
  }
  ctx.stroke();
}

function draw(p, now) {
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H * .36, base = Math.min(W, H) * .2;
  const e = 1 - Math.pow(1 - Math.min(p * 1.6, 1), 3); // reveal ease
  const t = reduce ? 0 : now / 1000;

  for (const q of parts) {
    const y = (q.y - t * q.s + 1) % 1;
    ctx.fillStyle = `rgba(${q.c},${.18 + .3 * Math.abs(Math.sin(t + q.p))})`;
    ctx.beginPath(); ctx.arc(q.x * W + Math.sin(t * .5 + q.p) * 12, y * H, q.r, 0, 6.2832); ctx.fill();
  }

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, base * 1.9);
  g.addColorStop(0, `rgba(${VIOLET},${.35 * e})`); g.addColorStop(1, 'rgba(6,3,17,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  ctx.lineWidth = 1.2;
  ctx.shadowColor = `rgba(${GOLD},.6)`; ctx.shadowBlur = 8;
  const layers = [
    [1.00, 24, 'petal', GOLD, .85, .12], [.80, 16, 'tri', VIOLET, .9, -.18],
    [.62, 12, 'petal', GOLD, .8, .25], [.46, 8, 'tri', GOLD, .85, -.3], [1.2, 36, 'dot', VIOLET, .7, .08],
  ];
  layers.forEach(([k, n, kind, col, a, sp], i) => {
    const vis = Math.max(0, Math.min(1, e * 1.6 - i * .22));
    if (vis > 0) ring(cx, cy, base * k * (.6 + .4 * vis), n, t * sp, kind, col, a * vis);
  });
  ctx.shadowBlur = 0;
  ctx.strokeStyle = `rgba(${GOLD},${.5 * e})`;
  ctx.beginPath(); ctx.arc(cx, cy, base * 1.05, 0, 6.2832 * Math.max(p, .02)); ctx.stroke(); // progress arc
  ctx.fillStyle = `rgba(255,242,196,${.6 + .4 * Math.sin(t * 3)})`;
  ctx.beginPath(); ctx.arc(cx, cy, 3 + 2 * e, 0, 6.2832); ctx.fill();
}

const t0 = performance.now();
let lastMsg = -1, exiting = false;
function tick() {
  if (exiting) return;
  const now = performance.now();
  const p = Math.min((now - t0) / DURATION, 1);
  try { draw(p, now); } catch (_) { /* drawing must never block navigation */ }
  if (fill) fill.style.width = `${p * 100}%`;
  bar?.setAttribute('aria-valuenow', String(Math.round(p * 100)));
  const m = Math.min(MESSAGES.length - 1, Math.floor(p * MESSAGES.length));
  if (m !== lastMsg && msg) { lastMsg = m; msg.textContent = MESSAGES[m]; }
  if (p >= 1) {
    exiting = true;
    root?.classList.add('is-exiting');
    setTimeout(go, EXIT_MS);
  }
}
// rAF for smooth visuals; interval keeps progress (and navigation) alive when rAF is paused (hidden tabs).
(function loop() { tick(); if (!exiting) requestAnimationFrame(loop); })();
setInterval(tick, 200);
