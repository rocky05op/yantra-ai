// Pattern Studio preset catalogue. Each preset = a motif routine from engine.js (`pattern`)
// + starting values for the shared controls. Classic presets use the original ring renderer
// (`pattern: 'yantra'`).

export const BRAND = Object.freeze({ bg: '#090812', violet: '#7041A5', gold: '#C9A45C', terracotta: '#A84C32', ivory: '#F1E7D1', indigo: '#20264A' });

// Palettes tuned for the additive-blend renderer (light-on-dark), built from the brand colours.
export const BRAND_THEMES = {
  heritage: { label: 'Gold & Terracotta', primary: '#C9A45C', secondary: '#A84C32', accent: '#C9A45C' },
  royal: { label: 'Royal Violet', primary: '#9a6fd0', secondary: '#7041A5', accent: '#7041A5' },
  ivory: { label: 'Ivory & Gold', primary: '#F1E7D1', secondary: '#C9A45C', accent: '#C9A45C' },
  terracotta: { label: 'Terracotta', primary: '#D9694A', secondary: '#A84C32', accent: '#A84C32' },
  peacock: { label: 'Peacock', primary: '#6f7ccf', secondary: '#C9A45C', accent: '#6f7ccf' },
  violetgold: { label: 'Violet & Gold', primary: '#C9A45C', secondary: '#7041A5', accent: '#7041A5' },
};

export const BG_CHOICES = [
  { value: '#090812', label: 'Midnight' }, { value: '#20264A', label: 'Deep Indigo' },
  { value: '#1d0d0a', label: 'Terracotta night' }, { value: '#1a0f2e', label: 'Violet night' },
];

export const COLLECTIONS = [
  { id: 'alpana', name: 'Bengali Alpana' },
  { id: 'mandana', name: 'Rajasthani Mandana' },
  { id: 'sacred', name: 'Sacred Geometry' },
  { id: 'fusion', name: 'Fusion Art' },
  { id: 'classic', name: 'Classic' },
];

const A = '#1d0d0a', I = '#20264A', M = '#090812';
const ENGINE = { 'padma-lotus': 'padma', 'shankha-motif': 'shankha', matsya: 'matsya', 'floral-circle': 'floralCircle', 'alpana-border': 'alpanaBorder', 'leaf-vine': 'leafVine',
  'mandana-chowk': 'chowk', 'peacock-geometry': 'peacock', 'elephant-motif': 'elephant', 'diamond-grid': 'diamondGrid', 'floral-mandana': 'floralMandana',
  'sri-yantra': 'sriYantra', 'flower-of-life': 'flowerOfLife', 'sacred-mandala': 'sacredMandala', kaleidoscope: 'kaleidoscope', 'geometric-bloom': 'bloom',
  'alpana-fusion': 'alpanaFusion', 'mandana-fusion': 'mandanaFusion', 'lotus-geometry': 'lotusGeometry', 'modern-indian-mandala': 'modernMandala', 'digital-folk-art': 'digitalFolk' };
const p = (id, name, cat, s) => ({ id, name, cat, abstract: false, settings: { pattern: ENGINE[id] || 'yantra', spacing: 1, seed: 7, ...s } });

export const PRESET_LIST = [
  // Bengali Alpana — ivory rice-paste lines on a dark terracotta floor
  p('padma-lotus', 'Padma Lotus', 'alpana', { layers: 8, symmetry: 8, rotation: 0, scale: 0.95, lineWidth: 1.2, density: 1.2, theme: 'ivory', bgColor: A }),
  p('shankha-motif', 'Shankha', 'alpana', { layers: 5, symmetry: 5, rotation: 18, scale: 0.9, lineWidth: 1.6, density: 0.8, theme: 'ivory', bgColor: A }),
  p('matsya', 'Matsya', 'alpana', { layers: 7, symmetry: 6, rotation: 0, scale: 1.1, lineWidth: 1.4, density: 1.4, theme: 'terracotta', bgColor: A }),
  p('floral-circle', 'Floral Circle', 'alpana', { layers: 4, symmetry: 6, rotation: 30, scale: 0.85, lineWidth: 1, density: 1.8, theme: 'ivory', bgColor: A }),
  p('alpana-border', 'Alpana Border', 'alpana', { layers: 5, symmetry: 12, rotation: 0, scale: 1.15, lineWidth: 0.8, density: 0.6, theme: 'heritage', bgColor: A }),
  p('leaf-vine', 'Leaf and Vine', 'alpana', { layers: 6, symmetry: 4, rotation: 0, scale: 0.95, lineWidth: 1.2, density: 1, theme: 'heritage', bgColor: A }),
  // Rajasthani Mandana — bold, graphic, ochre-red
  p('mandana-chowk', 'Mandana Chowk', 'mandana', { layers: 4, symmetry: 4, rotation: 45, scale: 1, lineWidth: 2.2, density: 1, theme: 'terracotta', bgColor: M }),
  p('peacock-geometry', 'Peacock Geometry', 'mandana', { layers: 9, symmetry: 7, rotation: 0, scale: 1, lineWidth: 1.2, density: 1.3, theme: 'peacock', bgColor: M }),
  p('elephant-motif', 'Elephant Motif', 'mandana', { layers: 6, symmetry: 5, rotation: 20, scale: 1.15, lineWidth: 2.4, density: 1.6, theme: 'terracotta', bgColor: M }),
  p('diamond-grid', 'Diamond Grid', 'mandana', { layers: 6, symmetry: 4, rotation: 0, scale: 1.2, lineWidth: 1.8, density: 0.5, theme: 'ivory', bgColor: M }),
  p('floral-mandana', 'Floral Mandana', 'mandana', { layers: 5, symmetry: 6, rotation: 15, scale: 0.9, lineWidth: 1.5, density: 1.7, theme: 'terracotta', bgColor: M }),
  // Sacred Geometry — fine lines, violet & gold
  p('sri-yantra', 'Sri Yantra Inspired', 'sacred', { layers: 9, symmetry: 4, rotation: 0, scale: 1, lineWidth: 1, density: 0.6, theme: 'heritage', bgColor: M }),
  p('flower-of-life', 'Flower of Life', 'sacred', { layers: 6, symmetry: 6, rotation: 0, scale: 0.85, lineWidth: 1, density: 2, theme: 'royal', bgColor: M }),
  p('sacred-mandala', 'Sacred Mandala', 'sacred', { layers: 9, symmetry: 9, rotation: 0, scale: 0.95, lineWidth: 1, density: 1, theme: 'violetgold', bgColor: M }),
  p('kaleidoscope', 'Kaleidoscope', 'sacred', { layers: 8, symmetry: 8, rotation: 0, scale: 0.95, lineWidth: 1.1, density: 1, theme: 'ocean', bgColor: M, seed: 11 }),
  p('geometric-bloom', 'Geometric Bloom', 'sacred', { layers: 7, symmetry: 7, rotation: 12, scale: 1, lineWidth: 1.4, density: 1.2, theme: 'royal', bgColor: M }),
  // Fusion Art — deep indigo ground, mixed palettes
  p('alpana-fusion', 'Alpana Fusion', 'fusion', { layers: 8, symmetry: 6, rotation: 15, scale: 1, lineWidth: 1.4, density: 1.5, theme: 'violetgold', bgColor: I }),
  p('mandana-fusion', 'Mandana Fusion', 'fusion', { layers: 6, symmetry: 8, rotation: 22, scale: 1.05, lineWidth: 2, density: 0.9, theme: 'heritage', bgColor: I }),
  p('lotus-geometry', 'Lotus Geometry', 'fusion', { layers: 9, symmetry: 6, rotation: 36, scale: 0.95, lineWidth: 1, density: 1, theme: 'ivory', bgColor: I }),
  p('modern-indian-mandala', 'Modern Indian Mandala', 'fusion', { layers: 12, symmetry: 9, rotation: 20, scale: 1, lineWidth: 0.9, density: 1.4, theme: 'peacock', bgColor: I }),
  p('digital-folk-art', 'Digital Folk Art', 'fusion', { layers: 5, symmetry: 8, rotation: 0, scale: 1.05, lineWidth: 1.6, density: 1.2, theme: 'peacock', bgColor: I, seed: 5 }),
  // Classic — the original five presets are kept (Kaleidoscope sits in Sacred Geometry)
  p('mandala', 'Mandala', 'classic', { layers: 8, symmetry: 8, scale: 0.9 }),
  p('flower', 'Flower', 'classic', { layers: 5, symmetry: 5, scale: 0.8 }),
  p('geometric', 'Geometric', 'classic', { layers: 6, symmetry: 4, scale: 1 }),
  p('spiral', 'Spiral', 'classic', { layers: 12, symmetry: 3, scale: 1.2 }),
];

/** id -> settings, kept under the old name so `?preset=` links keep working. */
export const PRESETS = Object.fromEntries(PRESET_LIST.map((x) => [x.id, x.settings]));
export const presetById = (id) => PRESET_LIST.find((x) => x.id === id);
