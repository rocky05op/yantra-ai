// Pattern Studio engine — ported from the original main.js with the same
// controls/behaviour, plus fixes:
//  * one render loop (the original started a new rAF chain on every slider move)
//  * custom colour is actually applied (it was stored but never drawn)
//  * undo/redo restores theme, speed and animation, and slider drags are coalesced
//  * "auto-save" really persists settings; export renders a 2048px image
import { drawYantra, drawCoreGlow } from '../core/yantra-art.js';
import { THEMES, themeFor, shade } from '../core/themes.js';
import { PRESETS, BRAND_THEMES, BRAND, presetById } from './collections.js';
import { drawPattern, hasEngine, ENGINE_PATTERNS } from './engine.js';
import { prefersReducedMotion } from '../core/util.js';
import { syncRange } from '../core/ui.js';

export const DEFAULTS = Object.freeze({ layers: 6, rotation: 0, symmetry: 6, scale: 1, speed: 50, animation: true, theme: 'lavender', customColor: '#b19cd9', lineWidth: 1, density: 1, spacing: 1, pattern: 'yantra', seed: 7, bgColor: BRAND.bg, cleared: false });

export { PRESETS };
const resolveTheme = (name, custom) => BRAND_THEMES[name] || themeFor(name, custom);
// Fields a catalogue preset always sets, so switching presets never inherits leftovers.
const PRESET_BASE = { rotation: 0, lineWidth: 1, density: 1, spacing: 1, seed: 7, bgColor: BRAND.bg };
const patternName = (s) => ENGINE_PATTERNS[s.pattern] || 'Classic rings';
const ZOOM_MIN = 0.5, ZOOM_MAX = 4;


const $ = (id) => document.getElementById(id);

export class PatternStudio {
  constructor({ onToast, onCommit, onPreset } = {}) {
    this.canvas = $('yantracCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.previewCanvas = $('previewCanvas');
    this.previewCtx = this.previewCanvas.getContext('2d');
    this.toast = onToast || (() => {});
    this.onCommit = onCommit || (() => {});
    this.onPreset = onPreset || (() => {});
    this.view = { zoom: 1, panX: 0, panY: 0, grid: false }; // on-screen only; never saved or exported
    this.ac = new AbortController(); // every listener below is bound to this signal -> destroy() removes them all
    this.layerListEl = $('layerList');
    this.settings = { ...DEFAULTS };
    if (prefersReducedMotion()) this.settings.animation = false; // respect OS setting by default
    this.history = [];
    this.index = -1;
    this.spin = 0;
    this.raf = 0;
    this.last = 0;
    this.size = { w: 0, h: 0, dpr: 1 };
    this.themes = { ...THEMES, ...BRAND_THEMES };
  }

  init(initial) {
    if (initial) this.settings = { ...this.settings, ...initial };
    this.bind();
    this.ro = new ResizeObserver(() => { this.resize(); });
    this.ro.observe(this.canvas.parentElement);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { this.last = 0; this.invalidate(); } }, { signal: this.ac.signal });
    window.addEventListener('pagehide', () => this.destroy(), { signal: this.ac.signal });
    this.commit(true);
    this.syncUI();
    this.resize();
  }

  /* ---------- rendering ---------- */
  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, this.canvas.clientWidth), h = Math.max(1, this.canvas.clientHeight);
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.size = { w, h, dpr };
    $('infoResolution').textContent = `${this.canvas.width}×${this.canvas.height}`;
    this.invalidate();
  }

  invalidate() { if (!this.raf) this.raf = requestAnimationFrame((t) => this.frame(t)); }

  frame(now) {
    this.raf = 0;
    if (document.hidden) return;
    if (this.settings.animation) {
      const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 0;
      this.spin = (this.spin + dt * this.settings.speed * 0.6) % 360; // deg/s, accumulates so speed changes never jump
    }
    this.last = this.settings.animation ? now : 0;
    this.render(this.ctx, this.size.w, this.size.h, this.spin, true, this.view);
    this.drawPreview();
    if (this.settings.animation) this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  render(ctx, w, h, spin, withGlow = true, view = null, s = this.settings) {
    const theme = resolveTheme(s.theme, s.customColor);
    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    bg.addColorStop(0, shade(s.bgColor, 2.1)); bg.addColorStop(1, s.bgColor);
    ctx.globalAlpha = 1;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    if (view && view.grid) this.drawGrid(ctx, w, h, 40 * view.zoom, view.panX, view.panY);
    if (s.cleared) return;
    ctx.save();
    if (view) { ctx.translate(w / 2 + view.panX, h / 2 + view.panY); ctx.scale(view.zoom, view.zoom); ctx.translate(-w / 2, -h / 2); } // vector zoom: stays crisp
    const maxR = (Math.min(w, h) / 2) * 0.8 * s.scale; // square fit: canvas aspect never distorts the pattern
    const lw = Math.max(1, Math.min(w, h) / 700) * s.lineWidth;
    if (withGlow) drawCoreGlow(ctx, w / 2, h / 2, maxR * 0.9, theme.accent);
    if (hasEngine(s.pattern)) {
      drawPattern(ctx, s.pattern, { cx: w / 2, cy: h / 2, R: maxR, n: s.symmetry, L: s.layers, d: s.density, sp: s.spacing || 1, lw, rotation: s.rotation, spin, c1: theme.primary, c2: theme.secondary, c3: theme.accent, bg: shade(s.bgColor, 1.35), seed: s.seed });
    } else {
      drawYantra(ctx, { cx: w / 2, cy: h / 2, maxR: maxR * (s.spacing || 1), layers: s.layers, symmetry: s.symmetry, rotation: s.rotation, spin, primary: theme.primary, secondary: theme.secondary, node: 0.1 * s.density, lineWidth: lw });
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawGrid(ctx, w, h, step, ox = 0, oy = 0) {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(241, 231, 209, 0.07)';
    ctx.beginPath();
    for (let x = (w / 2 + ox) % step; x < w; x += step) { ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, h); }
    for (let y = (h / 2 + oy) % step; y < h; y += step) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(w, Math.round(y) + 0.5); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(201, 164, 92, 0.35)';
    ctx.beginPath();
    ctx.moveTo(Math.round(w / 2 + ox) + 0.5, 0); ctx.lineTo(Math.round(w / 2 + ox) + 0.5, h); ctx.moveTo(0, Math.round(h / 2 + oy) + 0.5); ctx.lineTo(w, Math.round(h / 2 + oy) + 0.5);
    ctx.stroke();
    ctx.restore();
  }

  drawPreview() {
    const p = this.previewCtx;
    p.clearRect(0, 0, 200, 200);
    const m = Math.min(this.canvas.width, this.canvas.height);
    p.drawImage(this.canvas, (this.canvas.width - m) / 2, (this.canvas.height - m) / 2, m, m, 0, 0, 200, 200);
  }

  /** Render to a standalone square canvas for export / thumbnails. */
  renderOffscreen(size = 2048) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    this.render(c.getContext('2d'), size, size, this.spin, true);
    return c;
  }

  /* ---------- UI binding ---------- */
  bind() {
    const sig = { signal: this.ac.signal };
    const on = (el, ev, fn, opt) => el.addEventListener(ev, fn, { ...sig, ...opt });
    const slider = (id, key, parse, label) => {
      const el = $(id);
      on(el, 'input', () => {
        this.settings[key] = parse(el.value);
        this.settings.cleared = false;
        label();
        this.invalidate();
      });
      on(el, 'change', () => this.commit());
    };
    slider('layersSlider', 'layers', (v) => parseInt(v, 10), () => this.syncLabels());
    slider('rotationSlider', 'rotation', (v) => parseInt(v, 10), () => this.syncLabels());
    slider('symmetrySlider', 'symmetry', (v) => parseInt(v, 10), () => this.syncLabels());
    slider('scaleSlider', 'scale', (v) => parseFloat(v), () => this.syncLabels());
    slider('lineSlider', 'lineWidth', (v) => parseFloat(v), () => this.syncLabels());
    slider('densitySlider', 'density', (v) => parseFloat(v), () => this.syncLabels());
    slider('spacingSlider', 'spacing', (v) => parseFloat(v), () => this.syncLabels());
    slider('speedSlider', 'speed', (v) => parseInt(v, 10), () => this.syncLabels());

    on($('animationToggle'), 'change', (e) => {
      this.settings.animation = e.target.checked;
      this.commit();
      this.invalidate();
    });
    on($('resetBtn'), 'click', () => this.reset());
    on($('undoBtn'), 'click', () => this.undo());
    on($('redoBtn'), 'click', () => this.redo());
    on($('randomBtn'), 'click', () => this.randomPattern());
    on($('clearBtn'), 'click', () => this.clear());

    // background colour
    on($('bgInput'), 'input', (e) => { this.settings.bgColor = e.target.value; this.syncUI(); this.invalidate(); });
    on($('bgInput'), 'change', () => this.commit());
    document.querySelectorAll('.bg-swatch').forEach((b) => on(b, 'click', () => { this.settings.bgColor = b.dataset.bg; this.syncUI(); this.commit(); this.invalidate(); }));

    // view controls (zoom / fit / fullscreen / grid)
    const zoomBy = (d) => this.setZoom(Math.round(this.view.zoom * 4) / 4 + d);
    on($('zoomInBtn'), 'click', () => zoomBy(0.25));
    on($('zoomOutBtn'), 'click', () => zoomBy(-0.25));
    on($('fitBtn'), 'click', () => this.fit());
    on($('gridBtn'), 'click', () => { this.view.grid = !this.view.grid; $('gridBtn').setAttribute('aria-pressed', String(this.view.grid)); this.invalidate(); });
    on($('fullscreenBtn'), 'click', () => this.toggleFullscreen());
    // wheel zoom + drag pan on the canvas (view-only, never exported)
    const cv = this.canvas;
    on(cv, 'wheel', (e) => { e.preventDefault(); this.setZoom(this.view.zoom * Math.exp(-e.deltaY * 0.0015), true); }, { passive: false });
    let drag = null;
    on(cv, 'pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, px: this.view.panX, py: this.view.panY }; cv.setPointerCapture(e.pointerId); cv.classList.add('panning'); });
    on(cv, 'pointermove', (e) => { if (!drag) return; this.view.panX = drag.px + e.clientX - drag.x; this.view.panY = drag.py + e.clientY - drag.y; this.invalidate(); });
    const end = () => { drag = null; cv.classList.remove('panning'); };
    on(cv, 'pointerup', end); on(cv, 'pointercancel', end);
    on(cv, 'dblclick', () => this.fit());
    on(document, 'fullscreenchange', () => { $('fullscreenBtn').setAttribute('aria-pressed', String(!!document.fullscreenElement)); this.resize(); });

    document.querySelectorAll('.color-preset').forEach((btn) => {
      on(btn, 'click', () => { this.settings.theme = btn.dataset.theme; this.settings.cleared = false; this.syncUI(); this.commit(); this.invalidate(); });
    });
    on($('colorInput'), 'input', (e) => {
      this.settings.customColor = e.target.value;
      this.settings.theme = 'custom';
      this.settings.cleared = false;
      this.syncUI(); this.invalidate();
    });
    on($('colorInput'), 'change', () => this.commit());

    on(document, 'keydown', (e) => {
      if (e.target.matches('input[type=text], input[type=search], textarea')) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
      else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); this.redo(); }
    });
  }

  syncLabels() {
    const s = this.settings;
    $('layersValue').textContent = s.layers;
    $('rotationValue').textContent = `${s.rotation}°`;
    $('symmetryValue').textContent = s.symmetry;
    $('scaleValue').textContent = `${s.scale.toFixed(1)}x`;
    $('speedValue').textContent = `${s.speed}%`;
    $('lineValue').textContent = `${s.lineWidth.toFixed(1)}x`;
    $('densityValue').textContent = `${s.density.toFixed(1)}x`;
    $('spacingValue').textContent = `${(s.spacing ?? 1).toFixed(1)}x`;
    $('infoPattern').textContent = patternName(s);
    $('infoLayers').textContent = s.layers;
    $('infoSymmetry').textContent = `${s.symmetry}-fold`;
    this.renderLayerList();
  }

  /** Read-only list of the rings currently drawn (per-layer editing is pending). */
  renderLayerList() {
    const el = this.layerListEl, s = this.settings;
    if (!el) return;
    const key = `${s.layers}|${s.theme}|${s.customColor}|${s.cleared}|${s.pattern}`;
    if (el.dataset.key === key) return;
    el.dataset.key = key;
    const t = resolveTheme(s.theme, s.customColor);
    el.replaceChildren(...Array.from({ length: s.cleared ? 0 : s.layers }, (_, l) => {
      const li = document.createElement('li');
      const dot = document.createElement('i'); dot.style.background = l % 2 === 0 ? t.primary : t.secondary;
      const name = document.createElement('span'); name.textContent = s.pattern === 'yantra' ? `Ring ${l + 1}` : `Tier ${l + 1}`;
      const meta = document.createElement('small'); meta.textContent = `${Math.round(((l + 1) / s.layers) * 100)}% · ${l % 2 === 0 ? 'primary' : 'secondary'}`;
      li.append(dot, name, meta);
      return li;
    }));
    if (s.cleared) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Canvas cleared'; el.append(li); }
  }

  /** Push every setting back into the DOM (used after undo/redo/presets/load). */
  syncUI() {
    const s = this.settings;
    [['layersSlider', s.layers], ['rotationSlider', s.rotation], ['symmetrySlider', s.symmetry], ['scaleSlider', s.scale], ['speedSlider', s.speed], ['lineSlider', s.lineWidth], ['densitySlider', s.density], ['spacingSlider', s.spacing ?? 1]].forEach(([id, v]) => { $(id).value = v; syncRange($(id)); });
    $('animationToggle').checked = s.animation;
    $('colorInput').value = s.customColor;
    document.querySelectorAll('.color-preset').forEach((b) => {
      const on = b.dataset.theme === s.theme;
      b.classList.toggle('active', on);
      b.setAttribute('aria-checked', String(on));
    });
    $('bgInput').value = s.bgColor;
    document.querySelectorAll('.bg-swatch').forEach((b) => b.classList.toggle('active', b.dataset.bg.toLowerCase() === s.bgColor.toLowerCase()));
    $('infoTheme').textContent = resolveTheme(s.theme, s.customColor).label;
    this.syncLabels();
    this.renderLayerList();
  }

  /* ---------- history ---------- */
  commit(silent = false) {
    const snap = JSON.stringify(this.settings);
    if (this.history[this.index] === snap) return;
    this.history = this.history.slice(0, this.index + 1);
    this.history.push(snap);
    this.index = this.history.length - 1;
    if (this.history.length > 100) { this.history.shift(); this.index--; }
    if (!silent) this.onCommit(this.settings);
  }
  load(snap) {
    this.settings = { ...DEFAULTS, ...JSON.parse(snap) };
    this.syncUI();
    this.invalidate();
    this.onCommit(this.settings);
  }
  undo() { if (this.index > 0) { this.index--; this.load(this.history[this.index]); this.toast('Undo'); } }
  redo() { if (this.index < this.history.length - 1) { this.index++; this.load(this.history[this.index]); this.toast('Redo'); } }

  /* ---------- actions ---------- */
  setZoom(z, fine = false) {
    this.view.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, fine ? z : Math.round(z * 4) / 4));
    $('zoomValue').textContent = `${Math.round(this.view.zoom * 100)}%`;
    this.invalidate();
  }

  /** Fit to screen: zoom 100% (pattern is always sized to fit the shorter canvas side) and re-centre. */
  fit() { this.view.panX = 0; this.view.panY = 0; this.setZoom(1); }

  toggleFullscreen() {
    const box = $('canvasBox');
    if (document.fullscreenElement) document.exitFullscreen();
    else if (box.requestFullscreen) box.requestFullscreen().catch(() => this.toast('Fullscreen is not available here', 'error'));
    else this.toast('Fullscreen is not supported in this browser', 'error');
  }

  clear() { this.settings.cleared = true; this.syncUI(); this.commit(); this.invalidate(); this.toast('Canvas cleared — move any control or pick a preset to bring it back'); }

  reset() { this.settings = { ...DEFAULTS, animation: this.settings.animation }; this.fit(); this.syncUI(); this.commit(); this.invalidate(); this.toast('Reset to default'); }

  randomPattern() {
    const themes = Object.keys(this.themes), ids = Object.keys(ENGINE_PATTERNS), pick = (a) => a[Math.floor(Math.random() * a.length)];
    const r = (lo, hi, step = 0.1) => Math.round((lo + Math.random() * (hi - lo)) / step) * step;
    Object.assign(this.settings, {
      pattern: pick(ids), seed: 1 + Math.floor(Math.random() * 9999),
      layers: Math.floor(Math.random() * 8) + 3,
      rotation: Math.floor(Math.random() * 360),
      symmetry: Math.floor(Math.random() * 9) + 3,
      scale: +r(0.7, 1.3).toFixed(1),
      theme: pick(themes),
      lineWidth: +r(0.7, 2).toFixed(1),
      density: +r(0.6, 1.6).toFixed(1),
      spacing: +r(0.7, 1.4).toFixed(1),
      bgColor: pick(['#090812', '#20264A', '#1d0d0a', '#1a0f2e']),
      cleared: false,
    });
    this.syncUI(); this.commit(); this.invalidate();
    this.toast(`Random: ${patternName(this.settings)}`);
  }

  applyPreset(id) {
    const p = presetById(id);
    if (!p) return;
    // Catalogue presets start from clean base values; the original five only override what they define.
    Object.assign(this.settings, p.cat === 'classic' ? { spacing: 1 } : PRESET_BASE, p.settings, { cleared: false });
    this.syncUI(); this.commit(); this.invalidate();
    this.onPreset(id);
    this.toast(`Preset: ${p.name}`);
  }

  /** Stop the render loop and remove every listener/observer (no leaks if the page is torn down). */
  destroy() {
    cancelAnimationFrame(this.raf); this.raf = 0;
    this.ac.abort();
    if (this.ro) this.ro.disconnect();
  }
}
