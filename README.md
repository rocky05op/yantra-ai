# YANTRA — Creative AI Studio (frontend)

Vanilla JS + Vite (the stack the project already used). **No new dependencies.** Animation is CSS + the Web Animations API — the project has no React or Framer Motion, so none was added.

## Run
```bash
npm install
npm run dev      # opens /loading.html
npm run build    # multi-page build (see vite.config.mjs)
```

## Pages
| Page | File | What |
|---|---|---|
| Loader | `loading.html` | animated yantra intro → landing |
| Landing | `landing.html` | hero, features, workflow, CTA |
| Studio | `dashboard.html` | greeting, workspaces, real stats, saved works gallery |
| Patterns | `index.html` | Pattern Studio (sacred geometry generator) |
| **Prompt to Image** | `prompt-to-image.html` | the single AI image-generation workspace |

## Prompt to Image
Prompt editor (counter, ideas, ⌘/Ctrl+Enter), style gallery, optional reference image, Advanced settings (reference influence, history toggle, request preview), animated generate button, loading animation, result preview, Download, Regenerate, Use as reference, Copy prompt, full-size view, Save to gallery, and a generation history.

Aspect ratio, resolution and negative prompt are built but **hidden until the backend supports them** — see `docs/BACKEND_INTEGRATION.md`. Preview them with `/prompt-to-image.html?caps=all`.

Files: `prompt-to-image.html`, `src/js/pages/prompt.js`, `src/css/prompt.css`, `src/js/api/aiClient.js` (the only network code).

## Changes in this version
- **Removed** Sketch Studio (page, canvas engine, CSS, nav link, dashboard cards, landing sections). The old "Sketch → AI" panel became Prompt to Image.
- The feature is called **Prompt to Image** everywhere.
- Saved gallery items from the old Sketch Studio still open (they appear as "Image" items).
- Old files remain in `legacy/` (original pre-redesign project, untouched).

## Backend
See `docs/BACKEND_INTEGRATION.md`. `VITE_YANTRA_GENERATE_URL` is the only env var.
