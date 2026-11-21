// Sketch to Image — separate workspace. Uses the existing aiClient (no new endpoints):
// the composited sketch is sent as the existing `reference` file with `sketch_influence`.
import { initShell } from '../core/shell.js';
import { hydrateIcons, svg } from '../core/icons.js';
import { toast, syncRange } from '../core/ui.js';
import { downloadBlob, canvasToBlob, loadImage, prefersReducedMotion } from '../core/util.js';
import { saveWork } from '../core/storage.js';
import { STYLES, isBackendConfigured, generateImage, describeRequest, BackendNotConfiguredError } from '../api/aiClient.js';

initShell();
const $ = (id) => document.getElementById(id);
const reduce = prefersReducedMotion();
const W = 1024 , H = 768 , MAX_UNDO = 40;
const bg = $('bg');
const draw = $('draw');
const bgc = bg.getContext('2d');
const ctx = draw.getContext('2d');
[bg, draw].forEach((c) => { c.width = W; c.height = H; });
const state = {
  tool: 'brush',
  style: 'none',
  image: null,
  undo: [],
  redo: [],
  drawing: false,
  last: null,
  mid: null,
  pendingPoints: [],
  drawFrame: 0,
  running: false,
  abort: null,
  current: null,
  timers: []
};

/* ---------- ambient particles (same markup as Prompt to Image) ---------- */
const colors = ['#c4b5fd', '#22d3ee', '#f472b6', '#a855f7', '#e9d5ff'], rnd = (a, b) => a + Math.random() * (b - a);
function particles(host, n) { for (let i = 0; i < n; i++) { const p = document.createElement('i'), t = rnd(8, 18); p.style.cssText = `--x:${rnd(2, 98).toFixed(1)}%;--s:${rnd(2, 6).toFixed(1)}px;--t:${t.toFixed(1)}s;--dl:${(-rnd(0, t)).toFixed(1)}s;--dx:${rnd(-40, 40).toFixed(0)}px;--c:${colors[i % 5]}`; host.appendChild(p); } }
/* particles($('headParticles'), 14); particles($('stageParticles'), 22); */

/* ---------- canvas ---------- */
function paintBg() {
  bgc.fillStyle = '#fff'; bgc.fillRect(0, 0, W, H);
  if (state.image) { const im = state.image, k = Math.min(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k; bgc.drawImage(im, (W - w) / 2, (H - h) / 2, w, h); }
}
paintBg();
const snapshot = () => ctx.getImageData(0, 0, W, H);
function pushUndo() { state.undo.push(snapshot()); if (state.undo.length > MAX_UNDO) state.undo.shift(); state.redo = []; syncHistoryBtns(); }
function syncHistoryBtns() { $('undoBtn').disabled = !state.undo.length; $('redoBtn').disabled = !state.redo.length; }
function undo() { if (!state.undo.length) return; state.redo.push(snapshot()); ctx.putImageData(state.undo.pop(), 0, 0); syncHistoryBtns(); }
function redo() { if (!state.redo.length) return; state.undo.push(snapshot()); ctx.putImageData(state.redo.pop(), 0, 0); syncHistoryBtns(); }
$('undoBtn').addEventListener('click', undo); $('redoBtn').addEventListener('click', redo);
$('clearBtn').addEventListener('click', () => { pushUndo(); ctx.clearRect(0, 0, W, H); toast('Canvas cleared'); });
document.addEventListener('keydown', (e) => {
  if (/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
  const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); } else if (mod && k === 'y') { e.preventDefault(); redo(); }
  else if (!mod && k === 'b') setTool('brush'); else if (!mod && k === 'e') setTool('eraser');
});

function setTool(t) { state.tool = t; $('toolBrush').classList.toggle('is-active', t === 'brush'); $('toolEraser').classList.toggle('is-active', t === 'eraser'); $('toolBrush').setAttribute('aria-pressed', t === 'brush'); $('toolEraser').setAttribute('aria-pressed', t === 'eraser'); }
$('toolBrush').addEventListener('click', () => setTool('brush')); $('toolEraser').addEventListener('click', () => setTool('eraser'));
const size = $('size'); size.addEventListener('input', () => { $('sizeVal').textContent = `${size.value}px`; });
$('swatches').innerHTML = ['#1a1033', '#ffffff', '#ef4444', '#f59e0b', '#22c55e', '#22d3ee', '#8b5cf6', '#f472b6'].map((c) => `<button type="button" style="--c:${c}" data-c="${c}" aria-label="Colour ${c}"></button>`).join('');
$('swatches').addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) { $('color').value = b.dataset.c; setTool('brush'); } });


const pos = (e, r = draw.getBoundingClientRect()) => ({
  x: ((e.clientX - r.left) / r.width) * W,
  y: ((e.clientY - r.top) / r.height) * H,
  r
});

function style() {
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.lineWidth = +size.value;
  ctx.globalCompositeOperation =
    state.tool === 'eraser' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = ctx.fillStyle = $('color').value;
}

draw.style.touchAction = 'none';


function flushDrawQueue() {
  if (state.drawFrame) {
    cancelAnimationFrame(state.drawFrame);
    state.drawFrame = 0;
  }

  if (!state.pendingPoints.length || !state.drawing) {
    state.pendingPoints = [];
    return;
  }

  ctx.stroke();
}


  const points = state.pendingPoints;
  state.pendingPoints = [];

  for (const q of points) {
    const m = {
      x: (state.last.x + q.x) / 2,
      y: (state.last.y + q.y) / 2
    };

    ctx.beginPath();
    ctx.moveTo(state.mid.x, state.mid.y);
    ctx.quadraticCurveTo(
      state.last.x,
      state.last.y,
      m.x,
      m.y
    );
    ctx.stroke();

    state.last = q;
    state.mid = m;
  }

function scheduleDraw() {
  if (state.drawFrame) return;

  state.drawFrame = requestAnimationFrame(flushDrawQueue);
}

draw.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  state.rect = draw.getBoundingClientRect();
  e.preventDefault();
  draw.setPointerCapture(e.pointerId);

  pushUndo();
  style();

  const p = pos(e, state.rect);

  state.drawing = true;
  state.last = { x: p.x, y: p.y };
  state.mid = { x: p.x, y: p.y };
  state.pendingPoints = [];

  ctx.beginPath();
  ctx.arc(p.x, p.y, ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.fill();
});

draw.addEventListener('pointermove', (e) => {
  const r = state.rect || draw.getBoundingClientRect();
  const p = pos(e, r);

  // Update cursor only when not drawing
const c = $('cursor');
const d = (+size.value / W) * r.width;

c.style.width = c.style.height = `${d}px`;
c.style.transform =
  `translate(${p.x / W * r.width - d / 2}px, ${p.y / H * r.height - d / 2}px)`;

  if (!state.drawing || !state.last) return;

  const events = e.getCoalescedEvents?.();
  const points = events?.length ? events : [e];

  ctx.beginPath();
  ctx.moveTo(state.last.x, state.last.y);

  for (const ev of points) {
    const q = pos(ev, r);
    ctx.lineTo(q.x, q.y);
    state.last = { x: q.x, y: q.y };
  }

  ctx.stroke();
});
const end = () => {
  flushDrawQueue();
  state.drawing = false;
  state.last = null;
  state.mid = null;
};

['pointerup', 'pointercancel', 'lostpointercapture'].forEach((event) => {
  draw.addEventListener(event, end);
});

/* ---------- image upload ---------- */
const dz = $('dropzone');
async function setImage(file) {
  if (!file || !file.type.startsWith('image/')) return toast('Please choose an image file', 'error');
  if (file.size > 15 * 1024 * 1024) return toast('Image is larger than 15 MB', 'error');
  const url = URL.createObjectURL(file);
  try {
    state.image = await loadImage(url); paintBg();
    if ($('imgThumb').dataset.url) URL.revokeObjectURL($('imgThumb').dataset.url);
    $('imgThumb').src = url; $('imgThumb').dataset.url = url; $('imgThumb').hidden = false; $('dzText').hidden = true; $('imgRemove').hidden = false;
    toast('Image added to canvas', 'success'); refreshPayload();
  } catch { URL.revokeObjectURL(url); toast('Could not read that image', 'error'); }
}
function clearImage() { state.image = null; paintBg(); $('imgThumb').hidden = true; $('imgThumb').removeAttribute('src'); $('dzText').hidden = false; $('imgRemove').hidden = true; $('imgInput').value = ''; refreshPayload(); }
$('imgInput').addEventListener('change', (e) => setImage(e.target.files[0]));
$('imgRemove').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); clearImage(); });
['dragenter', 'dragover'].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
['dragleave', 'drop'].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
dz.addEventListener('drop', (e) => setImage(e.dataTransfer.files[0]));
$('wrap').addEventListener('dragover', (e) => e.preventDefault());
$('wrap').addEventListener('drop', (e) => { e.preventDefault(); setImage(e.dataTransfer.files[0]); });

/* ---------- prompt / style / influence ---------- */
const prompt = $('prompt');
prompt.addEventListener('input', () => { $('promptCount').textContent = `${prompt.value.length}/500`; refreshPayload(); });
prompt.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $('form').requestSubmit(); } });
$('styleGrid').innerHTML = STYLES.map((s) => `<button type="button" class="p2i-style" role="radio" aria-checked="${s.id === state.style}" tabindex="${s.id === state.style ? 0 : -1}" data-style="${s.id}" title="${s.hint}" style="--g1:${s.g[0]};--g2:${s.g[1]}"><span class="sw"></span><b>${s.label}</b></button>`).join('');
function pickStyle(id) { state.style = id; $('styleGrid').querySelectorAll('.p2i-style').forEach((b) => { const on = b.dataset.style === id; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; }); refreshPayload(); }
$('styleGrid').addEventListener('click', (e) => { const b = e.target.closest('[data-style]'); if (b) pickStyle(b.dataset.style); });
$('influence').addEventListener('input', (e) => { $('influenceVal').textContent = `${e.target.value}%`; refreshPayload(); });
const SKETCH_STUB = { name: 'sketch.png', size: 0 };
function refreshPayload() { $('payloadPre').textContent = JSON.stringify(describeRequest({ prompt: prompt.value.trim() || '(empty)', style: state.style, reference: SKETCH_STUB, influence: +$('influence').value }), null, 2).replace('"sketch.png (0 KB)"', '"sketch.png (canvas export, PNG)"'); }

/* ---------- stage ---------- */
const card = $('stageCard'), panes = { empty: $('stEmpty'), loading: $('stLoading'), result: $('stResult'), notice: $('stNotice') };
function setStage(n) { Object.entries(panes).forEach(([k, el]) => { el.hidden = k !== n; }); card.dataset.state = n; card.classList.toggle('is-busy', n === 'loading'); }
function toolbar(on) { $('dlBtn').disabled = !on; $('saveBtn').disabled = !on; }
function notice({ kind = 'info', title, body, extra }) {
  const n = $('stNotice'); n.className = `p2i-notice${kind === 'error' ? ' err' : ''}`;
  n.innerHTML = `<span class="ic">${svg(kind === 'error' ? 'alert' : 'plug', { size: 26 })}</span><h2></h2><p></p>`;
  n.querySelector('h2').textContent = title; n.querySelector('p').textContent = body;
  if (extra) { const p = document.createElement('p'); p.innerHTML = extra; n.appendChild(p); }
  setStage('notice'); toolbar(!!state.current);
}
const MSGS = ['Reading your sketch…', 'Tracing the lines…', 'Mixing colours…', 'Painting the light…', 'Adding fine detail…'];
function startLoading() { let i = 0; const t0 = Date.now(); $('loadMsg').textContent = MSGS[0]; $('loadTime').textContent = '0s'; state.timers.push(setInterval(() => { $('loadTime').textContent = `${Math.floor((Date.now() - t0) / 1000)}s`; }, 1000), setInterval(() => { i = Math.min(i + 1, MSGS.length - 1); $('loadMsg').textContent = MSGS[i]; }, 3200)); setStage('loading'); toolbar(false); }
const stopLoading = () => { state.timers.forEach(clearInterval); state.timers = []; };
function setRunning(on) { state.running = on; $('generateBtn').classList.toggle('is-running', on); $('genLabel').textContent = on ? 'Cancel generation' : 'Generate from sketch'; $('generateBtn').setAttribute('aria-busy', String(on)); }

async function exportSketch() {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.drawImage(bg, 0, 0); x.drawImage(draw, 0, 0);
  return canvasToBlob(c, 'image/png');
}
const isBlank = () => !state.image && !ctx.getImageData(0, 0, W, H).data.some((v, i) => i % 4 === 3 && v);

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (state.running) { state.abort && state.abort.abort(); return; }
  const text = prompt.value.trim();
  if (!text) { prompt.focus(); return toast('Write a prompt first', 'error'); }
  if (isBlank()) return toast('Draw something or upload an image first', 'error');
  if (!isBackendConfigured()) {
    return notice({ title: 'AI backend not connected', body: 'Your sketch, prompt and style are ready, but there is no image-generation service to send them to yet. Nothing was generated and nothing was sent.', extra: 'Backend developer: set <code>VITE_YANTRA_GENERATE_URL</code> — see <code>docs/BACKEND_INTEGRATION.md</code>.' });
  }
  state.abort = new AbortController(); setRunning(true); startLoading();
  if (innerWidth <= 1100) card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  try {
    const blob = await exportSketch();
    const out = await generateImage({ prompt: text, style: state.style, reference: new File([blob], 'sketch.png', { type: 'image/png' }), influence: +$('influence').value, generationMode: 'sketch',signal: state.abort.signal ,});
    const img = $('resultImg');
    await new Promise((r) => { img.onload = r; img.onerror = r; img.src = out.url; });
    if (!img.naturalWidth) throw new Error('The backend returned something that is not a readable image.');
    if (state.current && state.current.url.startsWith('blob:') && state.current.url !== out.url) URL.revokeObjectURL(state.current.url);
    state.current = { url: out.url, blob: out.blob || null, prompt: text, style: state.style };
    $('frame').style.setProperty('--ar', `${img.naturalWidth} / ${img.naturalHeight}`);
    const fig = $('stResult'); fig.classList.remove('is-new'); void fig.offsetWidth; fig.classList.add('is-new');
    setStage('result'); toolbar(true); toast('Image ready', 'success');
  } catch (err) {
    if (err.name === 'AbortError') { toast('Generation cancelled'); state.current ? (setStage('result'), toolbar(true)) : (setStage('empty'), toolbar(false)); }
    else if (err instanceof BackendNotConfiguredError) setStage('empty');
    else if (state.current) { toast(err.message, 'error', 4200); setStage('result'); toolbar(true); }
    else notice({ kind: 'error', title: 'Generation failed', body: err.message });
  } finally { stopLoading(); state.abort = null; setRunning(false); }
});

/* ---------- downloads / save ---------- */
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'image';
$('dlBtn').addEventListener('click', async () => {
  const c = state.current; if (!c) return;
  try { const b = c.blob || await (await fetch(c.url)).blob(); downloadBlob(b, `yantra-sketch-${slug(c.prompt)}-${Date.now()}.${b.type === 'image/jpeg' ? 'jpg' : b.type === 'image/webp' ? 'webp' : 'png'}`); toast('Download started', 'success'); }
  catch { const a = document.createElement('a'); a.href = c.url; a.download = 'yantra-sketch.png'; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); a.remove(); }
});
$('sketchDl').addEventListener('click', async () => { downloadBlob(await exportSketch(), `yantra-sketch-${Date.now()}.png`); toast('Sketch downloaded', 'success'); });
$('saveBtn').addEventListener('click', async () => {
  const c = state.current; if (!c) return;
  try {
    const im = await new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = c.url; });
    const k = Math.min(1, 1000 / Math.max(im.naturalWidth, im.naturalHeight)), cv = document.createElement('canvas');
    cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
    saveWork({ kind: 'image', name: c.prompt.slice(0, 48), image: cv.toDataURL('image/webp', 0.9), settings: { prompt: c.prompt, style: c.style } });
    toast('Saved to your gallery', 'success');
  } catch (e) { toast(e && /storage/i.test(e.message) ? e.message : 'Could not save this image', 'error'); }
});

if (isBackendConfigured()) { $('backendPill').classList.add('ok'); $('backendText').textContent = 'Backend connected'; }
refreshPayload(); syncRange(size); syncRange($('influence')); hydrateIcons();
