# TASK — Loading screen fix

## Root cause
- `loading.js` navigated to `/index.html` (Pattern Studio) with an absolute path (breaks with `base: './'`), skipping the intro flow (loading → landing → dashboard; the page's own Skip link already pointed to `landing.html`).
- Progress and navigation depended only on `requestAnimationFrame` plus a heavy `initShell()` (ambient background, motion, fx). rAF is paused in hidden/background tabs, and any exception in shell init meant the script never reached navigation, leaving the screen at a partial/stuck state.

## Files modified
loading.html, src/css/loading.css, src/js/pages/loading.js, TASK_REPORT.md (frontend only; backend/API/auth untouched)

## Animation implemented
Midnight radial background; antique-gold + royal-violet canvas mandala (petal, triangle and dot rings that reveal in sequence and rotate slowly); progress arc around the mandala; ~46 floating particles; blur-to-sharp gold-shimmer "YANTRA AI" logo reveal; thin gold/violet progress bar; fade/scale exit before navigation. Pure Canvas 2D + CSS, no dependencies. `prefers-reduced-motion`: no particles/rotation/shimmer, 0.7s duration, short fade.

## Fix
Progress is real elapsed time (3.2s) → always reaches 100%. Driven by rAF plus a 200ms interval (works in background tabs). Independent hard timeout (duration + exit + 1.5s) calls `location.replace('landing.html')`. Single-fire guard; drawing errors are caught and cannot block navigation. Skip link works. `<noscript>` meta refresh to landing.

## Destination
`landing.html` (relative path). Verified from existing links: Skip link, shell nav "Home", and landing CTAs lead on to dashboard.html.

## Test results (headless Chromium via static server)
- Normal and reduced-motion: auto-navigates to landing.html; reload on loading.html also navigates; no errors from loading page.
- Screenshot reviewed; mandala/title layout adjusted to avoid overlap.

## Remaining issue
- Could not run `vite` (Windows-only node_modules); under the static server landing.html logs a CSS-as-module MIME error, which Vite resolves. Run `npm run dev` locally to confirm. Google Fonts blocked in sandbox (fallback fonts used).

---

# TASK 1B — Pattern engine & functional Pattern Studio

## Completed
- **New motif engine** `src/js/pattern/engine.js`: 21 dedicated Canvas 2D routines (no longer one ring renderer with new names). Hooked into the existing `render()` in `studio.js`; the 4 Classic presets still use the original `drawYantra`.
  - Bengali Alpana: Padma Lotus (layered petals), Shankha (conch shells), Matsya (fish ring), Floral Circle (circle-flowers), Alpana Border (scrolling frieze bands), Leaf and Vine (spiral vines + leaves).
  - Rajasthani Mandana: Mandana Chowk (nested squares), Peacock Geometry (feather eyes), Elephant Motif (elephants on a ring), Diamond Grid (lattice), Floral Mandana (round petals + paisley).
  - Sacred Geometry: Sri Yantra Inspired (9 triangles + lotus rings + gates), Flower of Life (hex circle lattice), Sacred Mandala (banded ornament rings), Kaleidoscope (seeded mirrored wedge), Geometric Bloom (lobed rose curves).
  - Fusion: Alpana Fusion, Mandana Fusion, Lotus Geometry (circle-intersection petals), Modern Indian Mandala (cusped arches), Digital Folk Art (mirrored pixel mosaic).
- **Controls all drive the canvas live**: symmetry, rotation, scale, complexity, line thickness, density, **spacing (new slider)**, stroke colour (renamed from "Custom colour"), background (swatches + picker), 12 palettes. New settings `pattern`, `spacing`, `seed` are in undo history and autosave.
- **Canvas**: zoom +/- (0.5–4x), mouse-wheel zoom, drag to pan, Fit (resets zoom + pan; also double-click), fullscreen, grid, reset, randomize (now also picks a pattern, seed, palette, background), clear, undo/redo (+ Ctrl+Z/Y), PNG export with 1024/2048/4096 selector. Zoom/pan are vector transforms (stay crisp) and are never exported.
- **Performance/cleanup**: single rAF loop; `destroy()` aborts every listener (AbortController), disconnects the ResizeObserver, cancels rAF; also on `pagehide`. Patterns are fitted to the shorter canvas side, so resizing never distorts them.
- Removed the "abstract interpretation" note/badges — Matsya, Shankha, Peacock, Elephant are now literal (stylised) motifs. "Lotus Mandala" preset replaced by "Leaf and Vine"; "Shankha Motif" renamed "Shankha".

## Modified files
src/js/pattern/studio.js, src/js/pattern/collections.js, src/js/pages/pattern.js, index.html, src/css/studio.css, TASK_REPORT.md
## Created files
src/js/pattern/engine.js

## Backend
Not modified (backend/, .env*, docs/BACKEND_INTEGRATION.md, API client untouched; `diff` against the supplied zip shows no changes there).

## Tested (headless Chromium, 1440/1000/390/1800 px wide)
- All 21 engine presets + 4 classic render; contact sheet reviewed, patterns visibly distinct.
- Every slider (symmetry, rotation, scale, complexity, thickness, density, spacing) changes the canvas on engine patterns and classic presets (canvas pixel-hash check). Palette, stroke colour, background swatch/picker change it too.
- Undo, redo, Ctrl+Z, reset, randomize, clear (+undo/redo of clear), animation on/off.
- Zoom in/out, wheel zoom, pan, fit, grid, fullscreen; canvas resize keeps patterns round and centred.
- PNG export at 1024/2048/4096 (exact pixel sizes verified, content matches canvas).
- Browser console: no JS errors (only Google Fonts blocked by the sandbox network).

## Incomplete / known issues
- Per-layer editing, visibility and ordering are still not implemented (Layers list is read-only).
- Figurative motifs are stylised vector shapes (elephant is simple); Sri Yantra is "inspired", not a canonical bindu-exact construction.
- Squared patterns (Alpana Border, Diamond Grid, Mandana Chowk, Digital Folk) rotate as a square frame when animation is on; turn animation off for a static frame.
- Kaleidoscope/Digital Folk use a seed (Randomize changes it); there is no dedicated "new seed" button yet.
- `vite` could not run in the sandbox (bundled node_modules is Windows-only); I tested with a static server that stubs the CSS import. Run `npm run dev` locally to confirm.

## Next step
Per-layer controls (colour/visibility), a "shuffle seed" button, and a canonical Sri Yantra construction.

---

# TASK 1D — Cinematic animation & motion graphics (frontend only)

## Completed
- **Ornament layer** `src/js/core/ornament.js` + `src/css/ornament.css` (SVG/CSS only, no libraries), injected on every page by `initShell()`: slowly rotating, self-drawing mandalas (parallax), expanding sacred rings, rising glowing lotus outlines, animated Alpana frieze under the nav, animated gold/violet conic borders on `.card/.y-panel/.cta` (capped at 18, 8 on touch), floating nav mark / orbit chips / hero visual, card-icon hover glow, button press animation, glowing canvas frame on Pattern Studio, shimmering studio title, page-enter blur-in, gold mandala ring on the leave transition.
- **Particles**: existing `background.js` upgraded — gold + violet palette, gold mouse trail, 1.6 s fade-in, density cap 64 (34 on touch), connecting lines, mouse repulsion; pauses when tab hidden.
- **Loading screen**: self-drawing SVG mandala over the canvas mandala, gold burst + scale/blur/brightness cinematic exit (0.9 s), existing logo reveal/progress/particles kept.
- **Entry guard (index.html, the site root)**: a fresh open or reload goes to `loading.html?next=index.html`, then back to the Studio. Sessions flag `yantra:nav` (6 s timestamp, set by in-app link clicks and by the loader) prevents loops; back/forward, in-app links and blocked storage skip it; `?noload` bypass. `loading.html` opened directly still goes to `landing.html`. `next` is whitelisted and can never be `loading.html`. Hard timeout in loader unchanged.
- Hidden tab → all CSS animations paused (`html.is-hidden`). `prefers-reduced-motion` disables all new motion.

## Modified files
src/js/core/shell.js, src/js/core/background.js, src/js/pages/loading.js, src/css/loading.css, loading.html, index.html, TASK_REPORT.md
## Created files
src/js/core/ornament.js, src/js/core/nav.js, src/css/ornament.css

## Backend
Not touched.

## Tested (headless Chromium, static server stubbing CSS imports)
Fresh `/` → loader → Studio; reload → loader → Studio; nav link → no loader; `loading.html` → landing; reduced motion and 390px mobile (no horizontal overflow); dashboard, prompt, sketch, landing render with ornaments; no console errors (fonts blocked by sandbox only). Screenshots reviewed (loader, landing).

## Remaining
- `vite` not run (Windows node_modules): run `npm run dev` to confirm. Frame-rate was not profiled on real mobile hardware.
- Prompt/Sketch panels use other class names so don't yet get animated borders (add their selectors to `initOrnaments`).
- Landing/dashboard/other pages still load without the loader on reload by design (only the root entry shows it); extend the guard if wanted.
