// Left-panel preset library: search, collections, gallery, recently used, favourites.
import { PRESET_LIST, COLLECTIONS, presetById } from './collections.js';
import { DEFAULTS } from './studio.js';
import { loadJSON, saveJSON } from '../core/storage.js';

const RECENT_KEY = 'yantra.pattern.recent';
const FAV_KEY = 'yantra.pattern.favs';
const $ = (id) => document.getElementById(id);
const valid = (arr) => (Array.isArray(arr) ? arr.filter((id) => presetById(id)) : []);

export class PresetLibrary {
  constructor(studio) {
    this.studio = studio;
    this.cat = 'all';
    this.query = '';
    this.recent = valid(loadJSON(RECENT_KEY, [])).slice(0, 6);
    this.favs = valid(loadJSON(FAV_KEY, []));
    this.activeId = null;
    this.thumbs = new Map(); // id -> dataURL, rendered once
    this.buildChips();
    $('presetSearch').addEventListener('input', (e) => { this.query = e.target.value.trim().toLowerCase(); this.renderGallery(); });
    this.renderAll();
  }

  /** Called by the studio whenever a preset is applied (click, URL param…). */
  noteApplied(id) {
    this.activeId = id;
    this.recent = [id, ...this.recent.filter((x) => x !== id)].slice(0, 6);
    saveJSON(RECENT_KEY, this.recent);
    this.renderAll();
  }

  toggleFav(id) {
    this.favs = this.favs.includes(id) ? this.favs.filter((x) => x !== id) : [id, ...this.favs];
    saveJSON(FAV_KEY, this.favs);
    this.renderAll();
  }

  buildChips() {
    const box = $('presetCats');
    const items = [{ id: 'all', name: 'All' }, ...COLLECTIONS];
    box.replaceChildren(...items.map((c) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.cat = c.id; b.textContent = c.name; b.setAttribute('role', 'radio');
      b.addEventListener('click', () => { this.cat = c.id; this.syncChips(); this.renderGallery(); });
      return b;
    }));
    this.syncChips();
  }
  syncChips() { $('presetCats').querySelectorAll('.chip').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.cat === this.cat))); }

  thumb(id) {
    if (this.thumbs.has(id)) return this.thumbs.get(id);
    const p = presetById(id), c = document.createElement('canvas');
    c.width = c.height = 120;
    const s = { ...DEFAULTS, ...p.settings, cleared: false };
    this.studio.render(c.getContext('2d'), 120, 120, 0, false, null, s);
    const url = c.toDataURL('image/png');
    this.thumbs.set(id, url);
    return url;
  }

  card(id, mini = false) {
    const p = presetById(id);
    const wrap = document.createElement('div');
    wrap.className = `preset-card${mini ? ' mini' : ''}${this.activeId === id ? ' active' : ''}`;
    const main = document.createElement('button');
    main.type = 'button'; main.className = 'preset-main'; main.title = p.abstract ? `${p.name} — abstract geometric interpretation` : p.name;
    const img = new Image(); img.src = this.thumb(id); img.alt = ''; img.width = img.height = 120; img.loading = 'lazy';
    const name = document.createElement('span'); name.className = 'preset-name'; name.textContent = p.name;
    main.append(img, name);
    if (p.abstract && !mini) { const t = document.createElement('small'); t.textContent = 'abstract'; main.append(t); }
    main.addEventListener('click', () => this.studio.applyPreset(id));
    wrap.append(main);
    if (!mini) {
      const fav = document.createElement('button');
      const on = this.favs.includes(id);
      fav.type = 'button'; fav.className = 'fav-btn'; fav.textContent = on ? '★' : '☆';
      fav.setAttribute('aria-pressed', String(on)); fav.setAttribute('aria-label', `${on ? 'Remove' : 'Add'} ${p.name} ${on ? 'from' : 'to'} favourites`);
      fav.addEventListener('click', () => this.toggleFav(id));
      wrap.append(fav);
    }
    return wrap;
  }

  renderAll() { this.renderStrip('recentList', this.recent, 'Nothing yet — apply a preset'); this.renderStrip('favList', this.favs, 'Tap ☆ on a preset to pin it'); this.renderGallery(); }

  renderStrip(id, ids, empty) {
    const el = $(id);
    if (!ids.length) { const p = document.createElement('p'); p.className = 'hint'; p.textContent = empty; el.replaceChildren(p); return; }
    el.replaceChildren(...ids.map((x) => this.card(x, true)));
  }

  renderGallery() {
    const el = $('presetGallery'), q = this.query;
    const match = (p) => (this.cat === 'all' || p.cat === this.cat) && (!q || p.name.toLowerCase().includes(q));
    const nodes = [];
    for (const col of COLLECTIONS) {
      const list = PRESET_LIST.filter((p) => p.cat === col.id && match(p));
      if (!list.length) continue;
      if (this.cat === 'all') { const h = document.createElement('h3'); h.className = 'collection-title'; h.textContent = col.name; nodes.push(h); }
      const grid = document.createElement('div'); grid.className = 'preset-grid';
      grid.append(...list.map((p) => this.card(p.id)));
      nodes.push(grid);
    }
    if (!nodes.length) { const p = document.createElement('p'); p.className = 'hint'; p.textContent = 'No presets match your search.'; nodes.push(p); }
    el.replaceChildren(...nodes);
  }
}
