// Pattern Studio engine — ported from the original main.js with the same
// controls/behaviour, plus fixes:
//  * one render loop (the original started a new rAF chain on every slider move)
//  * custom colour is actually applied (it was stored but never drawn)
//  * undo/redo restores theme, speed and animation, and slider drags are coalesced
//  * "auto-save" really persists settings; export renders a 2048px image
import { drawYantra, drawCoreGlow } from '../core/yantra-art.js';
import { THEMES, themeFor } from '../core/themes.js';
import { prefersReducedMotion } from '../core/util.js';
import { syncRange } from '../core/ui.js';

export const DEFAULTS = Object.freeze({ layers: 6, rotation: 0, symmetry: 6, scale: 1, speed: 50, animation: true, theme: 'lavender', customColor: '#b19cd9' });

export const PRESETS = {
  mandala: { layers: 8, symmetry: 8, scale: 0.9 },
  flower: { layers: 5, symmetry: 5, scale: 0.8 },
  geometric: { layers: 6, symmetry: 4, scale: 1 },
  spiral: { layers: 12, symmetry: 3, scale: 1.2 },
  kaleidoscope: { layers: 10, symmetry: 12, scale: 0.9 },
};

const $ = (id) => document.getElementById(id);

export class PatternStudio {
  constructor({ onToast, onCommit } = {}) {
    this.canvas = $('yantracCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.previewCanvas = $('previewCanvas');
    this.previewCtx = this.previewCanvas.getContext('2d');
    this.toast = onToast || (() => {});
    this.onCommit = onCommit || (() => {});
    this.settings = { ...DEFAULTS };
    if (prefersReducedMotion()) this.settings.animation = false; // respect OS setting by default
    this.history = [];
    this.index = -1;
    this.spin = 0;
    this.raf = 0;
    this.last = 0;
    this.size = { w: 0, h: 0, dpr: 1 };
    this.themes = THEMES;
  }

  init(initial) {
    if (initial) this.settings = { ...this.settings, ...initial };
    this.bind();
    new ResizeObserver(() => { this.resize(); }).observe(this.canvas.parentElement);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { this.last = 0; this.invalidate(); } });
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
    this.render(this.ctx, this.size.w, this.size.h, this.spin, true);
    this.drawPreview();
    if (this.settings.animation) this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  render(ctx, w, h, spin, withGlow = true) {
    const s = this.settings;
    const theme = themeFor(s.theme, s.customColor);
    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    bg.addColorStop(0, '#1a0e38'); bg.addColorStop(1, '#0a0518');
    ctx.globalAlpha = 1;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const maxR = (Math.min(w, h) / 2) * 0.8 * s.scale;
    if (withGlow) drawCoreGlow(ctx, w / 2, h / 2, maxR * 0.9, theme.accent);
    drawYantra(ctx, { cx: w / 2, cy: h / 2, maxR, layers: s.layers, symmetry: s.symmetry, rotation: s.rotation, spin, primary: theme.primary, secondary: theme.secondary, node: 0.1, lineWidth: Math.max(1, w / 700) });
    ctx.globalAlpha = 1;
  }

  drawPreview() {
    const p = this.previewCtx;
    p.clearRect(0, 0, 200, 200);
    p.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, 200, 200 * (this.canvas.height / this.canvas.width));
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
    const slider = (id, key, parse, label) => {
      const el = $(id);
      el.addEventListener('input', () => {
        this.settings[key] = parse(el.value);
        label();
        this.invalidate();
      });
      el.addEventListener('change', () => this.commit());
    };
    slider('layersSlider', 'layers', (v) => parseInt(v, 10), () => this.syncLabels());
    slider('rotationSlider', 'rotation', (v) => parseInt(v, 10), () => this.syncLabels());
    slider('symmetrySlider', 'symmetry', (v) => parseInt(v, 10), () => this.syncLabels());
    slider('scaleSlider', 'scale', (v) => parseFloat(v), () => this.syncLabels());
    slider('speedSlider', 'speed', (v) => parseInt(v, 10), () => this.syncLabels());

    $('animationToggle').addEventListener('change', (e) => {
      this.settings.animation = e.target.checked;
      this.commit();
      this.invalidate();
    });
    $('resetBtn').addEventListener('click', () => this.reset());
    $('undoBtn').addEventListener('click', () => this.undo());
    $('redoBtn').addEventListener('click', () => this.redo());
    $('randomBtn').addEventListener('click', () => this.randomPattern());

    document.querySelectorAll('.color-preset').forEach((btn) => {
      btn.addEventListener('click', () => { this.settings.theme = btn.dataset.theme; this.syncUI(); this.commit(); this.invalidate(); });
    });
    $('colorInput').addEventListener('input', (e) => {
      this.settings.customColor = e.target.value;
      this.settings.theme = 'custom';
      this.syncUI(); this.invalidate();
    });
    $('colorInput').addEventListener('change', () => this.commit());
    document.querySelectorAll('.preset-btn').forEach((btn) => btn.addEventListener('click', () => this.applyPreset(btn.dataset.preset)));

    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input[type=text], textarea')) return;
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
    $('infoLayers').textContent = s.layers;
    $('infoSymmetry').textContent = `${s.symmetry}-fold`;
  }

  /** Push every setting back into the DOM (used after undo/redo/presets/load). */
  syncUI() {
    const s = this.settings;
    [['layersSlider', s.layers], ['rotationSlider', s.rotation], ['symmetrySlider', s.symmetry], ['scaleSlider', s.scale], ['speedSlider', s.speed]].forEach(([id, v]) => { $(id).value = v; syncRange($(id)); });
    $('animationToggle').checked = s.animation;
    $('colorInput').value = s.customColor;
    document.querySelectorAll('.color-preset').forEach((b) => {
      const on = b.dataset.theme === s.theme;
      b.classList.toggle('active', on);
      b.setAttribute('aria-checked', String(on));
    });
    $('infoTheme').textContent = themeFor(s.theme, s.customColor).label;
    this.syncLabels();
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
  reset() { this.settings = { ...DEFAULTS, animation: this.settings.animation }; this.syncUI(); this.commit(); this.invalidate(); this.toast('Reset to default'); }

  randomPattern() {
    const themes = Object.keys(THEMES);
    Object.assign(this.settings, {
      layers: Math.floor(Math.random() * 8) + 3,
      rotation: Math.floor(Math.random() * 360),
      symmetry: Math.floor(Math.random() * 10) + 3,
      scale: Math.round((Math.random() * 1.5 + 0.5) * 10) / 10,
      theme: themes[Math.floor(Math.random() * themes.length)],
    });
    this.syncUI(); this.commit(); this.invalidate();
    this.toast('Random pattern generated');
  }

  applyPreset(name) {
    if (!PRESETS[name]) return;
    Object.assign(this.settings, PRESETS[name]);
    this.syncUI(); this.commit(); this.invalidate();
    this.toast(`Preset: ${name[0].toUpperCase()}${name.slice(1)}`);
  }
}
