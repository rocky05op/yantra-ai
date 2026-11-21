// Prompt to Image — the one image-generation workspace.
// All network access goes through ../api/aiClient.js (existing integration point).
import { initShell } from '../core/shell.js';
import { hydrateIcons, svg } from '../core/icons.js';
import { toast, confirmDialog, syncRange } from '../core/ui.js';
import { downloadBlob, loadImage, prefersReducedMotion } from '../core/util.js';
import { saveWork, getWork, listHistory, addHistory, removeHistory, clearHistory } from '../core/storage.js';
import { STYLES, ASPECT_RATIOS, RESOLUTIONS, CAPABILITIES, isBackendConfigured, generateImage, describeRequest, BackendNotConfiguredError } from '../api/aiClient.js';

initShell();
const $ = (id) => document.getElementById(id);
const reduce = prefersReducedMotion();
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/** `?caps=all` previews the layout of controls the backend does not support yet. Their values are never sent. */
const PREVIEW_ALL = new URLSearchParams(location.search).get('caps') === 'all';
const cap = (k) => !!CAPABILITIES[k] || PREVIEW_ALL;

const state = { style: 'none', ratio: '1:1', res: '1024', ref: null, abort: null, running: false, current: null, lastReq: null, timers: [] };

const IDEAS = [
  'A glowing temple floating above a violet ocean at dusk, painterly, cinematic light',
  'A cyan fox made of constellations curled up on a moonlit hill',
  'Sacred geometry mandala blooming from a lotus, lavender and pink neon on black',
  'A tiny village inside a glass terrarium, warm lights, macro photography',
  'An astronaut tending a garden of luminous jellyfish plants on Mars',
  'A rain-soaked neon alley at night, reflections on wet asphalt, a lone cyclist',
  'A giant whale drifting through the clouds above a sleeping city, soft pastel sky',
  'An ancient library where the books are made of light, volumetric rays, awe',
];

/* ---------- helpers ---------- */
const rand = (a, b) => a + Math.random() * (b - a);
function particles(host, n) {
  const colors = ['#c4b5fd', '#22d3ee', '#f472b6', '#a855f7', '#e9d5ff'];
  host.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i'), t = rand(8, 18);
    p.style.cssText = `--x:${rand(2, 98).toFixed(1)}%;--s:${rand(2, 6).toFixed(1)}px;--t:${t.toFixed(1)}s;--dl:${(-rand(0, t)).toFixed(1)}s;--dx:${rand(-40, 40).toFixed(0)}px;--c:${colors[i % colors.length]}`;
    host.appendChild(p);
  }
}
const fade = (el, delay = 0, y = 16) => !reduce && el.animate([{ opacity: 0, transform: `translateY(${y}px)` }, { opacity: 1, transform: 'none' }], { duration: 650, delay, easing: EASE, fill: 'backwards' });
const ext = (blob) => ({ 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' }[blob.type] || 'png');
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'image';

function loadForCanvas(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (/^https?:/i.test(url) && new URL(url, location.href).origin !== location.origin) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img); img.onerror = () => reject(new Error('image not readable'));
    img.src = url;
  });
}
/** Downscaled copy as a data URL. Throws if the browser refuses to read the pixels (e.g. cross-origin without CORS). */
async function makeThumb(url, maxSide, q = 0.84) {
  const img = await loadForCanvas(url);
  const k = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/webp', q);
}

/* ---------- ambient ---------- */
particles($('headParticles'), 14);
particles($('stageParticles'), 26);
if (!reduce) {
  [...$('form').children].forEach((el, i) => fade(el, 120 + i * 70));
  $('stageCard').animate([{ opacity: 0, transform: 'translateY(26px) scale(0.97)' }, { opacity: 1, transform: 'none' }], { duration: 800, delay: 200, easing: EASE, fill: 'backwards' });
}

/* ---------- capabilities (only controls the backend supports are shown) ---------- */
document.querySelectorAll('[data-cap]').forEach((el) => { el.hidden = !cap(el.dataset.cap); });
$('sizeRow').hidden = !(cap('aspectRatio') || cap('resolution'));
$('capsNote').hidden = !(PREVIEW_ALL && (!CAPABILITIES.negativePrompt || !CAPABILITIES.aspectRatio || !CAPABILITIES.resolution));
$('influenceField').hidden = !CAPABILITIES.referenceInfluence;

const pill = $('backendPill');
if (isBackendConfigured()) { pill.classList.add('ok'); $('backendText').textContent = 'Backend connected'; }

/* ---------- prompt editor ---------- */
const prompt = $('prompt');
function onPromptChange() {
  const n = prompt.value.length;
  $('promptCount').textContent = `${n}/500`;
  const counter = $('promptCount').parentElement;
  counter.style.setProperty('--p', Math.min(100, (n / 500) * 100));
  counter.classList.toggle('is-near', n >= 450);
  prompt.style.height = 'auto';
  prompt.style.height = `${Math.min(360, Math.max(168, prompt.scrollHeight))}px`;
  refreshPayload();
}
prompt.addEventListener('input', onPromptChange);
prompt.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('form').requestSubmit(); } });
function setPrompt(text, focus = true) { prompt.value = text.slice(0, 500); onPromptChange(); if (focus) prompt.focus(); }
$('clearPromptBtn').addEventListener('click', () => { setPrompt(''); });
$('surpriseBtn').addEventListener('click', () => {
  let next; do { next = IDEAS[Math.floor(Math.random() * IDEAS.length)]; } while (next === prompt.value && IDEAS.length > 1);
  setPrompt(next);
  if (!reduce) prompt.animate([{ opacity: 0.2, filter: 'blur(4px)' }, { opacity: 1, filter: 'none' }], { duration: 500, easing: EASE });
});
function renderIdeas() {
  const pick = [...IDEAS].sort(() => Math.random() - 0.5).slice(0, 4);
  $('ideaChips').innerHTML = pick.map((t) => `<button type="button" class="chip" title=""></button>`).join('');
  [...$('ideaChips').children].forEach((b, i) => { b.textContent = pick[i].split(' ').slice(0, 4).join(' ') + '…'; b.title = pick[i]; b.addEventListener('click', () => setPrompt(pick[i])); });
}
renderIdeas();
$('negPrompt').addEventListener('input', refreshPayload);

/* ---------- style cards ---------- */
$('styleGrid').innerHTML = STYLES.map((s) => `<button type="button" class="p2i-style" role="radio" aria-checked="${s.id === state.style}" tabindex="${s.id === state.style ? 0 : -1}" data-style="${s.id}" title="${s.hint}" style="--g1:${s.g[0]};--g2:${s.g[1]}"><span class="sw"></span><b>${s.label}</b></button>`).join('');
function pickStyle(id, focus = false) {
  state.style = id;
  $('styleGrid').querySelectorAll('.p2i-style').forEach((b) => { const on = b.dataset.style === id; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
  refreshPayload();
}
$('styleGrid').addEventListener('click', (e) => { const b = e.target.closest('[data-style]'); if (b) pickStyle(b.dataset.style); });
$('styleGrid').addEventListener('keydown', (e) => {
  const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
  if (!(e.key in keys)) return;
  e.preventDefault();
  const i = STYLES.findIndex((s) => s.id === state.style);
  pickStyle(STYLES[(i + keys[e.key] + STYLES.length) % STYLES.length].id, true);
});

/* ---------- optional controls (hidden until the backend supports them) ---------- */
$('ratioGrid').innerHTML = ASPECT_RATIOS.map((r) => { const [a, b] = r.split(':').map(Number), m = Math.max(a, b); return `<button type="button" class="p2i-ratio" role="radio" aria-checked="${r === state.ratio}" data-ratio="${r}"><i style="--w:${(a / m).toFixed(3)};--h:${(b / m).toFixed(3)}"></i>${r}</button>`; }).join('');
$('ratioGrid').addEventListener('click', (e) => {
  const b = e.target.closest('[data-ratio]'); if (!b) return;
  state.ratio = b.dataset.ratio;
  $('ratioGrid').querySelectorAll('.p2i-ratio').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  setFrameRatio(state.ratio);
  refreshPayload();
});
$('resGrid').innerHTML = RESOLUTIONS.map((r) => `<button type="button" class="chip" role="radio" aria-checked="${r === state.res}" data-res="${r}">${r}px</button>`).join('');
$('resGrid').addEventListener('click', (e) => {
  const b = e.target.closest('[data-res]'); if (!b) return;
  state.res = b.dataset.res;
  $('resGrid').querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  refreshPayload();
});
function setFrameRatio(r) { const [a, b] = String(r).split(/[:/]/).map(Number); if (a && b) $('frame').style.setProperty('--ar', `${a} / ${b}`); }

/* ---------- reference image ---------- */
const dz = $('dropzone');
async function setReferenceFile(file) {
  if (!file || !file.type.startsWith('image/')) return toast('Please choose an image file', 'error');
  if (file.size > 15 * 1024 * 1024) return toast('Image is larger than 15 MB', 'error');
  const url = URL.createObjectURL(file);
  try {
    await loadImage(url);
    if ($('refThumb').dataset.url) URL.revokeObjectURL($('refThumb').dataset.url);
    state.ref = file;
    $('refThumb').src = url; $('refThumb').dataset.url = url; $('refThumb').hidden = false; $('dzText').hidden = true; $('refRemove').hidden = false;
    $('influence').disabled = false; $('influenceHint').textContent = 'Higher = stays closer to your reference.';
    toast('Reference added', 'success'); refreshPayload();
  } catch { URL.revokeObjectURL(url); toast('Could not read that image', 'error'); }
}
function clearReference(notify = true) {
  if ($('refThumb').dataset.url) URL.revokeObjectURL($('refThumb').dataset.url);
  state.ref = null; $('refThumb').hidden = true; $('refThumb').removeAttribute('src'); delete $('refThumb').dataset.url;
  $('dzText').hidden = false; $('refRemove').hidden = true; $('refInput').value = '';
  $('influence').disabled = true; $('influenceHint').textContent = 'Add a reference image to use this.';
  refreshPayload(); if (notify) toast('Reference removed');
}
$('refInput').addEventListener('change', (e) => setReferenceFile(e.target.files[0]));
$('refRemove').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); clearReference(); });
['dragenter', 'dragover'].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
['dragleave', 'drop'].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
dz.addEventListener('drop', (e) => setReferenceFile(e.dataTransfer.files[0]));

/* ---------- advanced ---------- */
$('advToggle').addEventListener('click', () => {
  const open = $('advToggle').getAttribute('aria-expanded') !== 'true';
  $('advToggle').setAttribute('aria-expanded', String(open));
  $('advBody').classList.toggle('is-open', open);
});
$('influence').addEventListener('input', (e) => { $('influenceVal').textContent = `${e.target.value}%`; refreshPayload(); });

function currentReq() {
  return { prompt: prompt.value.trim(), style: state.style, reference: state.ref, influence: +$('influence').value, negativePrompt: $('negPrompt').value.trim(), aspectRatio: state.ratio, resolution: state.res };
}
function refreshPayload() { $('payloadPre').textContent = JSON.stringify(describeRequest({ ...currentReq(), prompt: prompt.value.trim() || '(empty)' }), null, 2); }

/* ---------- stage states ---------- */
const card = $('stageCard');
const panes = { empty: $('stEmpty'), loading: $('stLoading'), result: $('stResult'), notice: $('stNotice') };
function setStage(name) {
  Object.entries(panes).forEach(([k, el]) => { el.hidden = k !== name; });
  card.dataset.state = name; card.classList.toggle('is-busy', name === 'loading');
}
function setToolbar(on) { ['dlBtn', 'expandBtn', 'refBtn', 'saveBtn', 'copyBtn'].forEach((id) => { $(id).disabled = !on; }); $('regenBtn').disabled = !(on && state.lastReq); }

function showNotice({ kind = 'info', title, body, extra }) {
  const n = $('stNotice');
  n.className = `p2i-notice${kind === 'error' ? ' err' : ''}`;
  n.innerHTML = `<span class="ic">${svg(kind === 'error' ? 'alert' : 'plug', { size: 26 })}</span><h2></h2><p></p>`;
  n.querySelector('h2').textContent = title; n.querySelector('p').textContent = body;
  if (extra) { const p = document.createElement('p'); p.innerHTML = extra; n.appendChild(p); }
  if (kind === 'error') {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-sm'; b.innerHTML = `${svg('rotate', { size: 16 })} Try again`;
    b.addEventListener('click', () => state.lastReq && run(state.lastReq)); n.appendChild(b);
  }
  setStage('notice'); setToolbar(!!state.current);
  if (!reduce) n.animate([{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: EASE });
}

/* loading animation */
const MESSAGES = ['Reading your prompt…', 'Mixing colours…', 'Composing the scene…', 'Painting the light…', 'Adding fine detail…', 'Still working — big ideas take a moment…'];
function startLoading() {
  let i = 0, t0 = Date.now();
  $('loadMsg').textContent = MESSAGES[0]; $('loadTime').textContent = '0s';
  state.timers.push(setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); $('loadTime').textContent = `${s}s`; }, 1000));
  state.timers.push(setInterval(() => {
    i = Math.min(i + 1, MESSAGES.length - 1);
    const el = $('loadMsg'); const clone = el.cloneNode(); clone.textContent = MESSAGES[i]; el.replaceWith(clone); // restarts the CSS entrance
  }, 3200));
  setStage('loading'); setToolbar(false);
}
function stopLoading() { state.timers.forEach(clearInterval); state.timers = []; }

/* ---------- generate ---------- */
const genBtn = $('generateBtn');
function setRunning(on) {
  state.running = on; genBtn.classList.toggle('is-running', on);
  $('genLabel').textContent = on ? 'Cancel generation' : 'Generate image';
  genBtn.setAttribute('aria-busy', String(on));
}
$('form').addEventListener('submit', (e) => { e.preventDefault(); if (state.running) { state.abort && state.abort.abort(); return; } run(currentReq()); });
$('regenBtn').addEventListener('click', () => { if (state.running) return; run(currentReq()); });
async function run(req) {
  if (state.running) return;
  if (!req.prompt) { prompt.focus(); return toast('Write a prompt first', 'error'); }

  if (!isBackendConfigured()) {
    refreshPayload();
    if (state.current) return toast('AI backend not connected — nothing was generated', 'error');
    showNotice({
      title: 'AI backend not connected',
      body: 'Your prompt and settings are ready, but there is no image-generation service to send them to yet. Nothing was generated and nothing was sent.',
      extra: 'Backend developer: set <code>VITE_YANTRA_GENERATE_URL</code> and see <code>docs/BACKEND_INTEGRATION.md</code>. The exact request is under Advanced settings.',
    });
    return;
  }

  state.lastReq = req; state.abort = new AbortController(); setRunning(true);
  if (cap('aspectRatio') && !state.current) setFrameRatio(req.aspectRatio);
  startLoading();
  if (innerWidth <= 1100) card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });

  try {
    const out = await generateImage({ ...req, signal: state.abort.signal });
    await showResult(out, req);
    toast('Image ready', 'success');
  } catch (e) {
    if (e.name === 'AbortError') { toast('Generation cancelled'); restoreAfterFailure(); }
    else if (e instanceof BackendNotConfiguredError) restoreAfterFailure();
    else if (state.current) { toast(e.message, 'error', 4200); restoreAfterFailure(); }
    else showNotice({ kind: 'error', title: 'Generation failed', body: e.message });
  } finally { stopLoading(); state.abort = null; setRunning(false); }
}
function restoreAfterFailure() { if (state.current) { setStage('result'); setToolbar(true); } else { setStage('empty'); setToolbar(false); } }

/* ---------- result ---------- */
async function showResult(out, req, { record = true, historyId = null } = {}) {
  const img = $('resultImg');
  const prevUrl = state.current && state.current.url;
  await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; img.src = out.url; });
  if (!img.naturalWidth) throw new Error('The backend returned something that is not a readable image.');
  if (prevUrl && prevUrl !== out.url && prevUrl.startsWith('blob:')) URL.revokeObjectURL(prevUrl);
  state.current = { url: out.url, blob: out.blob || null, req, historyId };
  state.lastReq = req;
  $('frame').style.setProperty('--ar', `${img.naturalWidth} / ${img.naturalHeight}`);

  const fig = $('stResult');
  fig.classList.remove('is-new'); void fig.offsetWidth; fig.classList.add('is-new');
  setStage('result'); setToolbar(true);

  const st = STYLES.find((s) => s.id === req.style);
  const cap_ = $('caption'); cap_.hidden = false;
  cap_.innerHTML = '<q></q><span class="tag"></span>';
  cap_.querySelector('q').textContent = req.prompt; cap_.querySelector('.tag').textContent = st ? st.label : req.style;
  if (!reduce) [...$('toolbar').children].forEach((el, i) => el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 500 + i * 60, easing: EASE, fill: 'backwards' }));

  if (record && $('autoHistory').checked) {
    let image = out.url;
    try { image = await makeThumb(out.url, 768); } catch { if (!/^https?:/i.test(out.url)) image = null; }
    if (image) { const h = addHistory({ prompt: req.prompt, style: req.style, image, settings: { negativePrompt: req.negativePrompt || '', aspectRatio: req.aspectRatio, resolution: req.resolution } }); state.current.historyId = h.id; }
    renderHistory();
  } else renderHistory();
}

/* ---------- toolbar actions ---------- */
$('dlBtn').addEventListener('click', async () => {
  const c = state.current; if (!c) return;
  const name = `yantra-${slug(c.req.prompt)}-${Date.now()}`;
  try {
    const blob = c.blob || await (await fetch(c.url)).blob();
    downloadBlob(blob, `${name}.${ext(blob)}`); toast('Download started', 'success');
  } catch {
    const a = document.createElement('a'); a.href = c.url; a.download = `${name}.png`; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove(); toast('Opened the image — save it from the new tab if it did not download');
  }
});
$('refBtn').addEventListener('click', async () => {
  const c = state.current; if (!c) return;
  try { const b = c.blob || await (await fetch(c.url)).blob(); await setReferenceFile(new File([b], 'previous-result.png', { type: b.type || 'image/png' })); }
  catch { toast('The browser could not read that image to use as a reference', 'error'); }
});
$('saveBtn').addEventListener('click', async () => {
  const c = state.current; if (!c) return;
  try {
    const image = await makeThumb(c.url, 1000, 0.9);
    saveWork({ kind: 'image', name: c.req.prompt.slice(0, 48), image, settings: { prompt: c.req.prompt, style: c.req.style } });
    toast('Saved to your gallery', 'success');
  } catch (e) { toast(e.message && /storage/i.test(e.message) ? e.message : 'Could not save this image to the gallery', 'error'); }
});
$('copyBtn').addEventListener('click', async () => {
  const c = state.current; if (!c) return;
  try { await navigator.clipboard.writeText(c.req.prompt); toast('Prompt copied', 'success'); } catch { toast('Copy is not available in this browser', 'error'); }
});
$('expandBtn').addEventListener('click', () => {
  const c = state.current; if (!c) return;
  const box = document.createElement('div'); box.className = 'p2i-lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Full size image');
  box.innerHTML = `<img alt="" /><button class="btn-icon" type="button" aria-label="Close">${svg('x', { size: 20 })}</button>`;
  box.querySelector('img').src = c.url;
  const prev = document.activeElement;
  const close = () => { box.classList.remove('is-open'); document.removeEventListener('keydown', onKey); setTimeout(() => { box.remove(); prev && prev.focus && prev.focus(); }, 300); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  box.addEventListener('click', (e) => { if (e.target !== box.querySelector('img')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(box); requestAnimationFrame(() => { box.classList.add('is-open'); box.querySelector('button').focus(); });
});

/* ---------- history ---------- */
const grid = $('histGrid');
function renderHistory() {
  const items = listHistory();
  $('clearHist').hidden = !items.length;
  grid.innerHTML = '';
  if (!items.length) {
    grid.innerHTML = `<div class="p2i-hist-empty">${svg('image', { size: 28 })}<strong>No generations yet</strong><span>Your results will collect here so you can reopen, compare or regenerate them.</span></div>`;
    return;
  }
  items.forEach((h, i) => {
    const el = document.createElement('article');
    el.className = `p2i-hist${state.current && state.current.historyId === h.id ? ' is-current' : ''}`; el.style.setProperty('--i', Math.min(i, 10));
    el.innerHTML = `<button class="open" type="button"><span class="th"><img alt="" loading="lazy" /></span><span class="meta"><span></span><small></small></span></button>
      <button class="rm" type="button" aria-label="Delete from history" title="Delete">${svg('trash', { size: 15 })}</button>`;
    el.querySelector('img').src = h.image;
    el.querySelector('img').alt = `Generated image: ${h.prompt.slice(0, 80)}`;
    el.querySelector('.meta span').textContent = h.prompt;
    const st = STYLES.find((s) => s.id === h.style);
    el.querySelector('small').textContent = `${st ? st.label : h.style} · ${new Date(h.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`;
    el.querySelector('.open').addEventListener('click', () => openHistory(h));
    el.querySelector('.rm').addEventListener('click', () => { removeHistory(h.id); if (state.current && state.current.historyId === h.id) state.current.historyId = null; renderHistory(); toast('Removed from history'); });
    grid.appendChild(el);
  });
}
grid.addEventListener('pointermove', (e) => {
  const el = e.target.closest('.p2i-hist'); if (!el || e.pointerType === 'touch' || reduce) return;
  const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
  el.style.setProperty('--mx', `${px * 100}%`); el.style.setProperty('--my', `${py * 100}%`);
  el.style.setProperty('--ry', `${((px - 0.5) * 8).toFixed(2)}deg`); el.style.setProperty('--rx', `${((0.5 - py) * 8).toFixed(2)}deg`);
});
grid.addEventListener('pointerout', (e) => { const el = e.target.closest('.p2i-hist'); if (el && !el.contains(e.relatedTarget)) { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); } });
$('clearHist').addEventListener('click', async () => {
  if (await confirmDialog({ title: 'Clear generation history?', body: 'All results listed here will be removed from this browser. Images saved to your gallery are not affected.', confirmText: 'Clear history' })) { clearHistory(); if (state.current) state.current.historyId = null; renderHistory(); toast('History cleared'); }
});
async function openHistory(h) {
  if (state.running) return toast('Wait for the current generation to finish, or cancel it', 'error');
  setPrompt(h.prompt, false); pickStyle(h.style);
  const req = { ...currentReq(), prompt: h.prompt, style: h.style };
  await showResult({ url: h.image }, req, { record: false, historyId: h.id });
  if (innerWidth <= 1100) card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
}

/* ---------- open from the dashboard gallery (?load=id) ---------- */
(async () => {
  const id = new URLSearchParams(location.search).get('load');
  const w = id && getWork(id);
  if (w && w.kind !== 'pattern') {
    const p = (w.settings && w.settings.prompt) || w.name || '';
    if (p) setPrompt(p, false);
    if (w.settings && STYLES.some((s) => s.id === w.settings.style)) pickStyle(w.settings.style);
    try { await showResult({ url: w.image }, { ...currentReq(), prompt: p || 'Saved image' }, { record: false }); toast('Image opened from your gallery'); } catch { toast('Could not open that image', 'error'); }
  }
})();

onPromptChange(); refreshPayload(); renderHistory(); setToolbar(false); syncRange($('influence')); hydrateIcons();
