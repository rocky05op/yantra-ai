// "My works" gallery persisted in localStorage. Everything shown on the
// dashboard comes from here, so numbers and thumbnails are always real.
import { uid } from './util.js';

const KEY = 'yantra.gallery.v1';
const MAX_ITEMS = 24;

function read() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}

export const listWorks = () => read();
export const getWork = (id) => read().find((w) => w.id === id) || null;

/** @param {{kind:'image'|'pattern', name:string, image:string, settings?:object}} work */
export function saveWork(work) {
  const item = { id: uid(), createdAt: Date.now(), ...work };
  let items = [item, ...read()].slice(0, MAX_ITEMS);
  // If the quota is hit, drop the oldest work until it fits.
  for (let tries = 0; tries < MAX_ITEMS; tries++) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); return item; } catch {
      if (items.length <= 1) break;
      items = items.slice(0, -1);
    }
  }
  throw new Error('Browser storage is full — download your work as PNG instead.');
}

export function removeWork(id) {
  try { localStorage.setItem(KEY, JSON.stringify(read().filter((w) => w.id !== id))); } catch { /* ignore */ }
}

/** Tiny safe wrappers for small JSON preferences. */
export function loadJSON(key, fallback = null) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } }
export function saveJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } }

/* ---------- Prompt to Image generation history (separate from the gallery) ---------- */
const HISTORY_KEY = 'yantra.p2i.history.v1';
const HISTORY_MAX = 12;
const readHistory = () => { const v = loadJSON(HISTORY_KEY, []); return Array.isArray(v) ? v : []; };

export const listHistory = () => readHistory();

/** @param {{prompt:string, style:string, image:string, settings?:object}} entry  `image` is a small data URL (thumbnail) or remote URL */
export function addHistory(entry) {
  const item = { id: uid(), createdAt: Date.now(), ...entry };
  let items = [item, ...readHistory()].slice(0, HISTORY_MAX);
  for (let tries = 0; tries < HISTORY_MAX; tries++) {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(items)); return item; } catch {
      if (items.length <= 1) break;
      items = items.slice(0, -1);
    }
  }
  return item; // storage full: still usable this session, just not persisted
}
export function removeHistory(id) { saveJSON(HISTORY_KEY, readHistory().filter((h) => h.id !== id)); }
export function clearHistory() { try { localStorage.removeItem(HISTORY_KEY); } catch { /* ignore */ } }
