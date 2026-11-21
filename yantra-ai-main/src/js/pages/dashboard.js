import { initShell } from '../core/shell.js';
import { svg, hydrateIcons } from '../core/icons.js';
import { listWorks, removeWork } from '../core/storage.js';
import { countUp } from '../core/motion.js';
import { confirmDialog, toast } from '../core/ui.js';
import { downloadDataUrl, prefersReducedMotion } from '../core/util.js';
import { drawYantra, drawCoreGlow, fitCanvas } from '../core/yantra-art.js';
import { isBackendConfigured } from '../api/aiClient.js';

initShell();
const $ = (id) => document.getElementById(id);

/* greeting */
const now = new Date(), hr = now.getHours();
$('greeting').textContent = hr < 5 ? 'Still up' : hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
$('today').textContent = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

/* real stats only */
$('statAi').textContent = isBackendConfigured() ? 'Connected' : 'Not connected';

function renderWorks() {
  const works = listWorks();
  const images = works.filter((w) => w.kind !== 'pattern').length; // legacy 'sketch' items count as images
  countUp($('statTotal'), works.length); countUp($('statImage'), images); countUp($('statPattern'), works.length - images);
  $('recentMeta').textContent = works.length ? `${works.length} saved in this browser` : '';
  const box = $('works');

  if (!works.length) {
    box.innerHTML = `<div class="empty">
      <svg class="art" viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="eg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#f472b6"/></linearGradient></defs><g fill="none" stroke="url(#eg)" stroke-width="2.5" stroke-linejoin="round"><circle cx="60" cy="60" r="48" opacity=".5"/><path d="M60 22 94 80H26z"/><path d="M60 98 26 40h68z" opacity=".7"/></g><circle cx="60" cy="60" r="4" fill="url(#eg)"/></svg>
      <h3>Your gallery is empty</h3>
      <p>Save an image or a pattern and it will appear here with a thumbnail you can reopen, download or delete.</p>
      <div class="quick"><a class="btn btn-primary" href="prompt-to-image.html">${svg('wand', { size: 18 })} Prompt to Image</a><a class="btn" href="index.html">${svg('hexagon', { size: 18 })} Make a pattern</a></div></div>`;
    return;
  }

  box.innerHTML = '';
  works.forEach((w, i) => {
    const el = document.createElement('article');
    el.className = 'work'; el.style.animationDelay = `${Math.min(i, 8) * 60}ms`;
    const isPattern = w.kind === 'pattern';
    const href = isPattern ? `index.html?load=${w.id}` : `prompt-to-image.html?load=${w.id}`;
    el.innerHTML = `<div class="work-img"><img alt="" /><div class="skeleton"></div><span class="work-kind">${svg(isPattern ? 'hexagon' : 'wand', { size: 13 })}${isPattern ? 'Pattern' : 'Image'}</span></div>
      <div class="work-body"><div><strong></strong><br /><small>${new Date(w.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</small></div>
      <div class="work-actions"><a class="btn btn-sm" href="${href}">${svg('folder', { size: 15 })} Open</a>
      <button class="btn-icon" type="button" data-act="dl" aria-label="Download" title="Download">${svg('download', { size: 16 })}</button>
      <button class="btn-icon" type="button" data-act="rm" aria-label="Delete" title="Delete">${svg('trash', { size: 16 })}</button></div></div>`;
    el.querySelector('strong').textContent = w.name;
    el.querySelector('img').alt = `${isPattern ? 'pattern' : 'image'} thumbnail: ${w.name}`;
    const img = el.querySelector('img');
    img.onload = () => img.classList.add('loaded');
    img.src = w.image;
    el.querySelector('[data-act=dl]').addEventListener('click', () => downloadDataUrl(w.image, `yantra-${isPattern ? 'pattern' : 'image'}-${w.id}.${w.image.startsWith('data:image/jpeg') ? 'jpg' : w.image.startsWith('data:image/webp') ? 'webp' : 'png'}`));
    el.querySelector('[data-act=rm]').addEventListener('click', async () => {
      if (await confirmDialog({ title: 'Delete this work?', body: `“${w.name}” will be removed from this browser. This can't be undone.`, confirmText: 'Delete' })) { removeWork(w.id); toast('Deleted'); renderWorks(); }
    });
    box.appendChild(el);
  });
}
renderWorks();

/* live mini pattern on the Pattern Studio card */
const mini = $('miniPattern'), mctx = mini.getContext('2d');
const reduce = prefersReducedMotion();
let spin = 0, last = performance.now(), vis = true, raf = 0;
function draw(now) {
  raf = 0; if (!vis) return;
  spin += Math.min(0.05, (now - last) / 1000) * 18; last = now;
  const { w, h } = fitCanvas(mini);
  mctx.clearRect(0, 0, w, h);
  drawCoreGlow(mctx, w / 2, h / 2, h * 0.55, '#8b5cf6');
  drawYantra(mctx, { cx: w / 2, cy: h / 2, maxR: h * 0.42, layers: 6, symmetry: 6, spin: reduce ? 0 : spin, primary: '#c4b5fd', secondary: '#22d3ee' });
  if (!reduce) raf = requestAnimationFrame(draw);
}
new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis && !raf) { last = performance.now(); raf = requestAnimationFrame(draw); } }).observe(mini);
hydrateIcons();
