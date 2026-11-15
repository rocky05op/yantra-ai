// ============================================================================
//  YANTRA — AI generation integration point  (FRONTEND SIDE OF THE CONTRACT)
// ============================================================================
//  The project contains no backend of its own. This file is the ONLY place the
//  frontend talks to the image-generation service, via the existing env var:
//
//      VITE_YANTRA_GENERATE_URL=https://your-backend.example.com/<your-route>
//
//  Nothing here invents an endpoint: the URL, the HTTP method (POST), the
//  multipart/form-data body and the accepted response shapes are unchanged from
//  the previous version. See docs/BACKEND_INTEGRATION.md for the full contract
//  and for what the backend must add to unlock the extra controls below.
// ============================================================================

const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
export const GENERATE_URL = (env.VITE_YANTRA_GENERATE_URL || '').trim();

export const isBackendConfigured = () => GENERATE_URL.length > 0;

export class BackendNotConfiguredError extends Error {
  constructor() { super('The AI backend is not connected yet.'); this.name = 'BackendNotConfiguredError'; }
}

/**
 * What the backend supports. The UI only shows a control when its flag is true,
 * and the request only carries a field when its flag is true.
 *
 *  prompt / style / reference / referenceInfluence  → already part of the existing contract.
 *  negativePrompt / aspectRatio / resolution        → NOT supported yet. When the backend teammate
 *                                                     implements one, flip its flag to true here.
 */
export const CAPABILITIES = {
  prompt: true,
  style: true,
  reference: true,
  referenceInfluence: true,
  negativePrompt: true, // ✔️ TURNED ON for Advanced UI
  aspectRatio: true,    // ✔️ TURNED ON for Advanced UI
  resolution: true,     // ✔️ TURNED ON for Advanced UI
};

/** Visual directions offered in the UI. They are plain strings sent as `style`; the backend decides what they mean. */
export const STYLES = [
  { id: 'none', label: 'No style', hint: 'Your prompt, untouched', g: ['#c4b5fd', '#6366f1'] },
  { id: 'watercolor', label: 'Watercolor', hint: 'Soft washes & bleeding edges', g: ['#67e8f9', '#f9a8d4'] },
  { id: 'neon-cyberpunk', label: 'Neon cyberpunk', hint: 'Rain, glow & chrome', g: ['#22d3ee', '#d946ef'] },
  { id: 'anime', label: 'Anime', hint: 'Clean lines, vivid colour', g: ['#f472b6', '#818cf8'] },
  { id: 'oil-painting', label: 'Oil painting', hint: 'Rich, textured brushwork', g: ['#fbbf24', '#a855f7'] },
  { id: 'pencil', label: 'Pencil drawing', hint: 'Graphite & cross-hatching', g: ['#e9e4ff', '#7a709f'] },
  { id: '3d-render', label: '3D render', hint: 'Glossy, studio-lit', g: ['#22d3ee', '#8b5cf6'] },
  { id: 'sacred-geometry', label: 'Sacred geometry', hint: 'Mandalas & symmetry', g: ['#c4b5fd', '#22d3ee'] },
  { id: 'surreal', label: 'Surreal', hint: 'Dreamlike & impossible', g: ['#f472b6', '#22d3ee'] },
];

/** Options for the (currently hidden) extra controls. Values are sent verbatim once the backend supports them. */
export const ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16', '3:2', '2:3'];
export const RESOLUTIONS = ['512', '768', '1024', '2048'];

/**
 * @param {{prompt:string, style:string, reference?:File|Blob|null, influence?:number,
 *          negativePrompt?:string, aspectRatio?:string, resolution?:string, signal?:AbortSignal}} req
 * @returns {Promise<{url:string, blob?:Blob}>}  an image URL (object URL, data URL or remote URL)
 */
export async function generateImage({ prompt, style, reference, influence, negativePrompt, aspectRatio, resolution, signal }) {
  if (!isBackendConfigured()) throw new BackendNotConfiguredError();

  const form = buildForm({ prompt, style, reference, influence, negativePrompt, aspectRatio, resolution });
  
  // ✔️ Cache-busting logic added here so the browser NEVER shows the old image on Regenerate
  const bustUrl = `${GENERATE_URL}${GENERATE_URL.includes('?') ? '&' : '?'}t=${Date.now()}`;
  const res = await fetch(bustUrl, { method: 'POST', body: form, signal, cache: 'no-store' });
  
  if (!res.ok) {
    let detail = '';
    try { detail = (await res.text()).slice(0, 200); } catch { /* ignore */ }
    throw new Error(`Generation failed (HTTP ${res.status})${detail ? `: ${detail}` : ''}`);
  }

  const type = res.headers.get('content-type') || '';
  if (type.startsWith('image/')) {
    const blob = await res.blob();
    return { url: URL.createObjectURL(blob), blob };
  }
  const data = await res.json();
  const raw = data.imageUrl || data.image_url || data.url || data.image;
  if (!raw) throw new Error('The backend response did not include an image (expected imageUrl or an image/* body).');
  return { url: /^(https?:|data:|blob:)/.test(raw) ? raw : `data:image/png;base64,${raw}` };
}

/** The single place that decides which fields are sent. */
function fields({ prompt, style, reference, influence, negativePrompt, aspectRatio, resolution }) {
  const f = [['prompt', prompt], ['style', style]];
  if (CAPABILITIES.reference && reference) {
    // `sketch_influence` is the existing field name — kept so the backend needs no change.
    if (CAPABILITIES.referenceInfluence && influence != null) f.push(['sketch_influence', String(influence)]);
  }
  if (CAPABILITIES.negativePrompt && negativePrompt) f.push(['negative_prompt', negativePrompt]);
  if (CAPABILITIES.aspectRatio && aspectRatio) f.push(['aspect_ratio', aspectRatio]);
  if (CAPABILITIES.resolution && resolution) f.push(['resolution', resolution]);
  return f;
}

function buildForm(req) {
  const form = new FormData();
  fields(req).forEach(([k, v]) => form.append(k, v));
  if (CAPABILITIES.reference && req.reference) form.append('reference', req.reference, req.reference.name || 'reference.png');
  return form;
}

/** Human-readable preview of what would be sent (shown in Advanced settings for the backend developer). */
export function describeRequest(req) {
  const out = {};
  fields(req).forEach(([k, v]) => { out[k] = k === 'sketch_influence' ? Number(v) : v; });
  out.reference = CAPABILITIES.reference && req.reference ? `${req.reference.name} (${Math.round(req.reference.size / 1024)} KB)` : '(not provided)';
  return { method: 'POST', url: GENERATE_URL || '(set VITE_YANTRA_GENERATE_URL)', contentType: 'multipart/form-data', fields: out };
}