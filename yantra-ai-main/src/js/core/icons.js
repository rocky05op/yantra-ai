// Inline icon set drawn in the Lucide style (24x24 grid, 2px round strokes).
// Zero dependencies. To switch to the official `lucide` package later, keep the
// <i data-icon="name"> markup and replace the lookup in `svg()` below.

const P = {
  sparkles: 'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z|M20 3v4|M22 5h-4|M4 17v2|M5 18H3',
  arrowRight: 'M5 12h14|M12 5l7 7-7 7',
  arrowDown: 'M12 5v14|M19 12l-7 7-7-7',
  menu: 'M4 6h16|M4 12h16|M4 18h16',
  x: 'M18 6 6 18|M6 6l12 12',
  undo: 'M9 14 4 9l5-5|M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  redo: 'M15 14l5-5-5-5|M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
  trash: 'M3 6h18|M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6|M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2|M10 11v6|M14 11v6',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M7 10l5 5 5-5|M12 15V3',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4|M17 8l-5-5-5 5|M12 3v12',
  image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z|M10.5 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0|M21 15l-5-5L5 21',
  reset: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8|M3 3v5h5',
  maximize: 'M8 3H5a2 2 0 0 0-2 2v3|M21 8V5a2 2 0 0 0-2-2h-3|M3 16v3a2 2 0 0 0 2 2h3|M16 21h3a2 2 0 0 0 2-2v-3',
  layers: 'M12 2 2 7l10 5 10-5-10-5z|M2 17l10 5 10-5|M2 12l10 5 10-5',
  palette: 'M12 22a10 10 0 1 1 10-10c0 2.5-2 3-4 3h-2a2 2 0 0 0-1.5 3.3c.6.8.3 1.7-.5 2.2-.6.3-1.3.5-2 .5z|M7.5 10.5h.01|M12 7.5h.01|M16.5 10.5h.01',
  zap: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  smartphone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z|M12 18h.01',
  dice: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z|M8 8h.01|M16 8h.01|M8 16h.01|M16 16h.01|M12 12h.01',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8|M16 6l-4-4-4 4|M12 2v13',
  save: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z|M17 21v-8H7v8|M7 3v5h8',
  play: 'M6 3l14 9-14 9V3z',
  pause: 'M6 4h4v16H6z|M14 4h4v16h-4z',
  wand: 'M15 4V2|M15 16v-2|M8 9h2|M20 9h2|M17.8 11.8 19 13|M15 9h.01|M17.8 6.2 19 5|M3 21l9-9|M12.2 6.2 11 5',
  plug: 'M12 22v-5|M9 8V2|M15 8V2|M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8z',
  check: 'M20 6 9 17l-5-5',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z|M12 16v-4|M12 8h.01',
  alert: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z|M12 9v4|M12 17h.01',
  dashboard: 'M3 3h7v9H3z|M14 3h7v5h-7z|M14 12h7v9h-7z|M3 16h7v5H3z',
  folder: 'M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z',
  hexagon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z|M12 7l4 2.3v4.4L12 16l-4-2.3V9.3z',
  home: 'M3 10.5 12 3l9 7.5|M5 9.5V21h14V9.5|M10 21v-6h4v6',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z|M12 6v6l4 2',
  code: 'M16 18l6-6-6-6|M8 6l-6 6 6 6',
  sliders: 'M4 21v-7|M4 10V3|M12 21v-9|M12 8V3|M20 21v-5|M20 12V3|M1 14h6|M9 8h6|M17 16h6',
  droplet: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z',
  loader: 'M21 12a9 9 0 1 1-6.219-8.56',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z|M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  rotate: 'M21 12a9 9 0 1 1-3-6.7L21 8|M21 3v5h-5',
  chevronDown: 'M6 9l6 6 6-6',
  maximize: 'M8 3H5a2 2 0 0 0-2 2v3|M21 8V5a2 2 0 0 0-2-2h-3|M3 16v3a2 2 0 0 0 2 2h3|M16 21h3a2 2 0 0 0 2-2v-3',
  copy: 'M9 9h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z|M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1',
  brush: 'M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08|M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z',
  eraser: 'M7 21h10|M5.5 13.5 13 6a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8L11 20H7.5l-2-2a2 2 0 0 1 0-2.8z|M9 10l5 5',
  compare: 'M12 3v18|M3 5h6v14H3z|M15 5h6v14h-6z',
};

export function svg(name, { size = 20, cls = '' } = {}) {
  const d = P[name];
  if (!d) return '';
  const paths = d.split('|').map((p) => `<path d="${p}"/>`).join('');
  return `<svg class="icon ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}

/** Replace every <i data-icon="name" data-size="18"></i> inside `root` with an inline SVG. */
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((node) => {
    const size = parseInt(node.dataset.size || '20', 10);
    const tpl = document.createElement('template');
    tpl.innerHTML = svg(node.dataset.icon, { size, cls: node.className });
    const el = tpl.content.firstElementChild;
    if (el) node.replaceWith(el);
  });
}

let logoId = 0;
/** The YANTRA mark: interlocking triangles inside a ring. */
export function logoSvg() {
  const id = `yl${logoId++}`;
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c4b5fd"/><stop offset=".5" stop-color="#a855f7"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs><g fill="none" stroke="url(#${id})" stroke-width="1.8" stroke-linejoin="round"><circle cx="20" cy="20" r="17.5"/><path d="M20 6.5 32.5 28H7.5z"/><path d="M20 33.5 7.5 12h25z"/></g><circle cx="20" cy="20" r="2.4" fill="url(#${id})"/></svg>`;
}
