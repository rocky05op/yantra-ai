# Backend integration (for the backend teammate)

The frontend talks to the image-generation service in **one place only**: `src/js/api/aiClient.js`.
Nothing about the existing integration was changed:

- same env var: `VITE_YANTRA_GENERATE_URL` (no new env vars were added)
- same call: `POST <VITE_YANTRA_GENERATE_URL>` as `multipart/form-data`
- same accepted responses (below)
- no new endpoints were invented

Until the variable is set, **Generate image** shows an "AI backend not connected" notice and sends nothing. No fake images are produced.

## Enable it
1. Copy `.env.example` to `.env`.
2. Set `VITE_YANTRA_GENERATE_URL` to the endpoint's full URL (restart `npm run dev`).
3. Mind CORS (allow the frontend origin) and add auth headers in `generateImage()` if needed.

## Request — what the frontend sends today
| field | type | notes |
|---|---|---|
| `prompt` | string | required, ≤ 500 chars |
| `style` | string | one of `none, watercolor, neon-cyberpunk, anime, oil-painting, pencil, 3d-render, sacred-geometry, surreal` |
| `reference` | image file | optional reference image (≤ 15 MB) |
| `sketch_influence` | string `0–100` | only sent together with `reference`. **Field name kept for compatibility**; the UI calls it "Reference influence" |

### ⚠ One change that affects the backend
Sketch Studio was removed, so the **`sketch` file field is no longer sent**. If the backend currently *requires* `sketch`, make it optional (or accept `prompt` alone). Everything else in the request is unchanged. If the backend needs the reference under the old `sketch` name, change one line in `buildForm()`.

## Response — accepted shapes (unchanged)
- `Content-Type: image/*` body, or
- JSON with `imageUrl` (also `image_url`, `url`, `image`): an http(s)/data URL or raw base64 PNG.

Non-2xx responses show the status and the first 200 chars of the body.

## Controls that exist in the UI but are OFF until the backend supports them
The Prompt to Image workspace has finished UI for these, hidden by default so users never see controls that do nothing. To turn one on, implement it server-side, then set its flag to `true` in `CAPABILITIES` (top of `aiClient.js`). The field is then shown in the UI **and** added to the request:

| capability flag | UI control | form field sent once enabled | values |
|---|---|---|---|
| `negativePrompt` | Negative prompt box | `negative_prompt` | string ≤ 300 chars |
| `aspectRatio` | Aspect ratio picker | `aspect_ratio` | `1:1, 4:3, 3:4, 16:9, 9:16, 3:2, 2:3` |
| `resolution` | Resolution chips | `resolution` | `512, 768, 1024, 2048` (long side, px) |

These three field names and value lists are **proposals** — rename them or edit `ASPECT_RATIOS` / `RESOLUTIONS` in `aiClient.js` to match the real API. Open `/prompt-to-image.html?caps=all` to preview how they will look (preview only: their values are never sent).

## Frontend-only features (no backend needed)
Regenerate (re-sends the same request), Download, Use as reference, Copy prompt, Expand, Save to gallery and Generation history all work in the browser. History and gallery are stored in `localStorage` as reduced-size copies (≤ 768 px / 1000 px WebP), so the full-resolution image only lives in the current session.
If the backend returns a **remote URL**, the browser can only download/save/thumbnail it when that host sends CORS headers; otherwise Download opens the image in a new tab and history keeps the remote URL.

## Sketch to Image (separate page: `sketch-to-image.html`)
No new endpoint or env var. It reuses `generateImage()` and the same `POST VITE_YANTRA_GENERATE_URL` multipart call:
`prompt`, `style`, `sketch_influence` and the canvas export (sketch + optional uploaded image, flattened to a PNG) sent as the existing **`reference`** file field.
If the backend needs it under the legacy `sketch` name, change one line in `buildForm()` in `aiClient.js`.
