// Colour themes (unchanged values from the original app) + helpers.
export const THEMES = {
  lavender: { label: 'Lavender', primary: '#b19cd9', secondary: '#7851a9', accent: '#d4a5ff' },
  cosmic: { label: 'Cosmic', primary: '#ff006e', secondary: '#8338ec', accent: '#ff006e' },
  ocean: { label: 'Ocean', primary: '#00d9ff', secondary: '#0066cc', accent: '#00d9ff' },
  sunset: { label: 'Sunset', primary: '#ff6b35', secondary: '#f7931e', accent: '#ff6b35' },
  forest: { label: 'Forest', primary: '#06a77d', secondary: '#2d6a4f', accent: '#06a77d' },
  sakura: { label: 'Sakura', primary: '#ff69b4', secondary: '#ff1493', accent: '#ff69b4' },
};

/** Multiply an #rrggbb colour's brightness (factor < 1 darkens, > 1 lightens). */
export function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, Math.round(v * factor)));
  const r = c((n >> 16) & 255), g = c((n >> 8) & 255), b = c(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function themeFor(name, customColor) {
  if (name === 'custom' && /^#[0-9a-f]{6}$/i.test(customColor || '')) {
    return { label: 'Custom', primary: customColor, secondary: shade(customColor, 0.62), accent: shade(customColor, 1.25) };
  }
  return THEMES[name] || THEMES.lavender;
}
