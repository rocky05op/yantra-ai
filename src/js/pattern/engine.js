// Pattern Studio motif engine. Each pattern is a dedicated Canvas 2D routine (not a
// re-skin of the ring renderer). All share one option object `o`:
//   R scale radius · n symmetry · L complexity · d density · sp spacing · lw line px
//   c1/c2/c3 palette · bg ink-fill colour · seed (kaleidoscope/folk) · spin (deg)
// Drawing is origin-centred; drawPattern() handles translate/rotate/state.

const TAU = Math.PI * 2;
const rad = (d) => (d * Math.PI) / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function rng(seed) { // mulberry32 — deterministic per seed so frames never flicker
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ---------- drawing helpers ---------- */
const stroke = (ctx, col, a, w) => { ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke(); };
const fill = (ctx, col, a) => { ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fill(); };
/** opaque "ink" fill (hides what is underneath) + tint, so layered petals read as layers */
const solid = (ctx, o, col, a = 0.18) => { ctx.globalAlpha = 1; ctx.fillStyle = o.bg; ctx.fill(); fill(ctx, col, a); };
const circ = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.2, r), 0, TAU); };
const dot = (ctx, x, y, r, col, a = 0.9) => { circ(ctx, x, y, r); fill(ctx, col, a); };
const each = (ctx, k, fn, off = 0) => { for (let i = 0; i < k; i++) { ctx.save(); ctx.rotate(off + (i * TAU) / k); fn(i); ctx.restore(); } };
const poly = (ctx, pts, close = true) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); if (close) ctx.closePath(); };
const ngon = (k, r, off = 0) => Array.from({ length: k }, (_, i) => [Math.cos(off + (i * TAU) / k) * r, Math.sin(off + (i * TAU) / k) * r]);
const star = (k, step, r, off = 0) => Array.from({ length: k }, (_, i) => [Math.cos(off + (i * step * TAU) / k) * r, Math.sin(off + (i * step * TAU) / k) * r]);

/** pointed lotus petal along +x from r0 to r1, half-width w */
function petalPath(ctx, r0, r1, w) {
  const l = r1 - r0;
  ctx.beginPath(); ctx.moveTo(r0, 0);
  ctx.bezierCurveTo(r0 + l * 0.25, -w * 1.35, r0 + l * 0.7, -w * 0.95, r1, 0);
  ctx.bezierCurveTo(r0 + l * 0.7, w * 0.95, r0 + l * 0.25, w * 1.35, r0, 0);
  ctx.closePath();
}
const roundPetal = (ctx, r0, r1, w) => { ctx.beginPath(); ctx.ellipse((r0 + r1) / 2, 0, Math.max(0.1, (r1 - r0) / 2), w, 0, 0, TAU); };
/** paisley / buti along +x */
function paisley(ctx, len, w) {
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.bezierCurveTo(len * 0.1, -w * 1.7, len * 0.7, -w * 1.4, len, w * 0.7);
  ctx.bezierCurveTo(len * 0.72, w * 0.9, len * 0.25, w * 1.5, 0, 0); ctx.closePath();
}
/** scalloped ring: k arcs bulging outward (depth>0) or inward */
function scallop(ctx, r, k, depth) {
  ctx.beginPath();
  for (let i = 0; i < k; i++) {
    const a0 = (i * TAU) / k, a1 = ((i + 1) * TAU) / k, am = (a0 + a1) / 2;
    if (!i) ctx.moveTo(Math.cos(a0) * r, Math.sin(a0) * r);
    ctx.quadraticCurveTo(Math.cos(am) * (r + depth * 2), Math.sin(am) * (r + depth * 2), Math.cos(a1) * r, Math.sin(a1) * r);
  }
  ctx.closePath();
}
function teeth(ctx, r0, r1, k, off = 0) {
  ctx.beginPath();
  for (let i = 0; i < k; i++) {
    const a0 = off + (i * TAU) / k, a1 = off + ((i + 1) * TAU) / k, am = (a0 + a1) / 2;
    if (!i) ctx.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0);
    ctx.lineTo(Math.cos(am) * r1, Math.sin(am) * r1); ctx.lineTo(Math.cos(a1) * r0, Math.sin(a1) * r0);
  }
  ctx.closePath();
}
const ringDots = (ctx, r, k, size, col, a = 0.9, off = 0) => { for (let i = 0; i < k; i++) dot(ctx, Math.cos(off + (i * TAU) / k) * r, Math.sin(off + (i * TAU) / k) * r, size, col, a); };
const ring = (ctx, r, col, a, w) => { circ(ctx, 0, 0, r); stroke(ctx, col, a, w); };
const leafPath = (ctx, len, w) => petalPath(ctx, 0, len, w);

/* ======================= BENGALI ALPANA ======================= */

const PATTERNS = {};

PATTERNS.padma = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, m = Math.max(3, n);
  ringDots(ctx, R * 0.97, Math.round(m * 3 * d), R * 0.011, c1, 0.7);
  scallop(ctx, R * 0.93, m * 2, R * 0.02); stroke(ctx, c2, 0.5, lw);
  for (let t = L - 1; t >= 0; t--) {
    const f = Math.pow((t + 1) / L, 1 / sp), r1 = R * (0.22 + 0.68 * f), r0 = R * 0.05;
    const w = (r0 + (r1 - r0) * 0.42) * Math.sin(Math.PI / m) * 1.1, col = t % 2 ? c2 : c1;
    each(ctx, m, () => {
      petalPath(ctx, r0, r1, w); solid(ctx, o, col, 0.2); stroke(ctx, col, 0.95, lw * 1.2);
      petalPath(ctx, r0 + (r1 - r0) * 0.2, r1 * 0.86, w * 0.5); stroke(ctx, col, 0.45, lw * 0.8);
      ctx.beginPath(); ctx.moveTo(r0 + (r1 - r0) * 0.15, 0); ctx.lineTo(r1 * 0.74, 0); stroke(ctx, col, 0.4, lw * 0.8);
    }, t % 2 ? Math.PI / m : 0);
  }
  circ(ctx, 0, 0, R * 0.1); solid(ctx, o, c3, 0.5); stroke(ctx, c3, 0.9, lw);
  ringDots(ctx, R * 0.055, Math.max(5, Math.round(m * d)), R * 0.01, o.bg, 0.9);
};

/** conch shell pointing +x: sharp spire at +len, flared lip at -len/2 */
function shellPath(ctx, len, w) {
  ctx.beginPath(); ctx.moveTo(len, 0);
  ctx.bezierCurveTo(len * 0.7, -w * 0.15, len * 0.25, -w * 1.35, -len * 0.2, -w * 1.2);
  ctx.bezierCurveTo(-len * 0.4, -w * 1.1, -len * 0.55, -w * 0.8, -len * 0.5, -w * 0.3);
  ctx.lineTo(-len * 0.5, w * 0.3);
  ctx.bezierCurveTo(-len * 0.55, w * 0.8, -len * 0.4, w * 1.1, -len * 0.2, w * 1.2);
  ctx.bezierCurveTo(len * 0.25, w * 1.35, len * 0.7, w * 0.15, len, 0); ctx.closePath();
}
PATTERNS.shankha = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, m = Math.max(3, n);
  const r0 = R * (0.2 + 0.1 * sp), len = (R * 0.92 - r0) * 0.55, w = Math.min(len * 0.42, ((r0 + len) * Math.PI) / m * 0.45);
  ringDots(ctx, R * 0.98, m * Math.round(3 * d), R * 0.009, c2, 0.6);
  scallop(ctx, R * 0.15, m, R * 0.04); solid(ctx, o, c3, 0.25); stroke(ctx, c3, 0.9, lw);
  each(ctx, m, () => {
    ctx.save(); ctx.translate(r0 + len * 0.35, 0);
    shellPath(ctx, len, w); solid(ctx, o, c1, 0.2); stroke(ctx, c1, 0.95, lw * 1.3);
    const ridges = 3 + Math.round(L * d * 0.6);
    for (let k = 1; k <= ridges; k++) { // ribs across the body
      const x = -len * 0.15 + (len * 1.05 * k) / (ridges + 1), h = w * 1.2 * Math.pow(Math.max(0.02, 1 - x / len), 0.75) * 0.95;
      ctx.beginPath(); ctx.moveTo(x, -h); ctx.quadraticCurveTo(x + len * 0.14, 0, x, h); stroke(ctx, c1, 0.6, lw * 0.9);
    }
    ctx.beginPath(); ctx.ellipse(-len * 0.5, 0, w * 0.1, w * 0.3, 0, 0, TAU); fill(ctx, c3, 0.9); // opening
    ctx.beginPath(); ctx.moveTo(-len * 0.45, 0); ctx.quadraticCurveTo(len * 0.1, -w * 0.5, len * 0.75, 0); stroke(ctx, c2, 0.7, lw);
    ctx.restore();
    ctx.save(); ctx.rotate(Math.PI / m); ringDots(ctx, R * 0.5 + r0 * 0.4, 1, R * 0.018, c2, 0.8); ctx.restore();
  });
  each(ctx, m, () => { petalPath(ctx, R * 0.03, R * 0.14, R * 0.035); stroke(ctx, c3, 0.8, lw); }, Math.PI / m);
  ring(ctx, R * 0.94, c1, 0.5, lw);
};

PATTERNS.matsya = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, m = Math.max(2, n);
  const rr = R * 0.66, len = Math.min(((rr * TAU) / m) * 0.97, R * 0.72), h = len * 0.2;
  for (let k = 0; k < Math.max(2, Math.round(L / 2)); k++) { // wave rings
    const r = R * (0.1 + 0.1 * k * sp); if (r > rr - h * 1.4) break;
    scallop(ctx, r, m * 4, R * 0.018); stroke(ctx, c2, 0.5, lw);
  }
  each(ctx, m, (i) => {
    ctx.translate(rr, 0); ctx.rotate(Math.PI / 2); // nose points clockwise, tail chases previous fish
    const a = len / 2;
    ctx.beginPath(); ctx.moveTo(a, 0);
    ctx.bezierCurveTo(a * 0.5, -h * 1.15, -a * 0.3, -h, -a * 0.6, -h * 0.12);
    ctx.lineTo(-a * 1.02, -h * 0.85); ctx.quadraticCurveTo(-a * 0.82, 0, -a * 1.02, h * 0.85); ctx.lineTo(-a * 0.6, h * 0.12);
    ctx.bezierCurveTo(-a * 0.3, h, a * 0.5, h * 1.15, a, 0); ctx.closePath();
    solid(ctx, o, i % 2 ? c2 : c1, 0.28); stroke(ctx, i % 2 ? c2 : c1, 0.95, lw * 1.3);
    ctx.beginPath(); ctx.moveTo(a * 0.1, -h * 1.0); ctx.quadraticCurveTo(a * 0.0, -h * 1.9, -a * 0.35, -h * 1.0); stroke(ctx, c1, 0.8, lw); // dorsal fin
    ctx.beginPath(); ctx.moveTo(a * 0.05, h * 1.0); ctx.quadraticCurveTo(-a * 0.05, h * 1.7, -a * 0.3, h * 1.0); stroke(ctx, c1, 0.6, lw);
    const rows = 2 + Math.round(L * 0.5 * d);
    for (let k = 0; k < rows; k++) { const x = a * 0.55 - (k * a * 1.0) / rows * 1.1, hh = h * 0.7; ctx.beginPath(); ctx.arc(x, 0, hh * 0.6, -Math.PI / 2, Math.PI / 2); stroke(ctx, c3, 0.55, lw * 0.8); }
    ctx.beginPath(); ctx.arc(a * 0.88, 0, 1, 0, 0); dot(ctx, a * 0.62, -h * 0.18, h * 0.12, c3, 1);
    ctx.beginPath(); ctx.arc(a * 0.4, 0, h * 0.7, -1.1, 1.1); stroke(ctx, c3, 0.7, lw); // gill
  });
  each(ctx, m * 2, () => dot(ctx, R * 0.93, 0, R * 0.012, c1, 0.7));
  ring(ctx, R * 0.95, c1, 0.4, lw);
  circ(ctx, 0, 0, R * 0.05); fill(ctx, c3, 0.9);
};

PATTERNS.floralCircle = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, m = Math.max(3, n);
  const ro = R * (0.5 + 0.2 * sp), fr = Math.min(R * 0.2, ((ro * TAU) / m) * 0.36);
  ring(ctx, R * 0.97, c1, 0.5, lw); ringDots(ctx, R * 0.93, m * 4 * Math.round(d + 0.5), R * 0.008, c2, 0.8);
  scallop(ctx, ro + fr * 1.55, m, fr * 0.35); stroke(ctx, c2, 0.7, lw);
  ctx.beginPath(); for (let i = 0; i < m; i++) { const a = ((i + 0.5) * TAU) / m; ctx.moveTo(Math.cos(a) * (ro - fr * 1.2), Math.sin(a) * (ro - fr * 1.2)); ctx.lineTo(Math.cos(a) * (ro + fr * 1.3), Math.sin(a) * (ro + fr * 1.3)); } stroke(ctx, c2, 0.4, lw);
  each(ctx, m, () => { // little 5-petal flowers made of circles
    ctx.translate(ro, 0);
    each(ctx, 5, () => { circ(ctx, fr * 0.5, 0, fr * 0.36); solid(ctx, o, c1, 0.22); stroke(ctx, c1, 0.9, lw); });
    dot(ctx, 0, 0, fr * 0.22, c3, 0.95);
  });
  for (let k = 0; k < clamp(L, 2, 7); k++) { // central bloom of nested circle-petals
    const t = k / clamp(L, 2, 7), pr = R * 0.34 * (1 - t * 0.7), pc = R * 0.1 * (1 - t * 0.5);
    each(ctx, m, () => { circ(ctx, pr * 0.62, 0, pc * 1.6); stroke(ctx, k % 2 ? c2 : c1, 0.85, lw); }, k * Math.PI / m);
  }
  dot(ctx, 0, 0, R * 0.05, c3, 0.95);
};

PATTERNS.alpanaBorder = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, half = R * 0.96, bands = clamp(L, 2, 9), bh = (half * 2) / bands;
  const tw = bh * 1.05 * sp, kind = ['bud', 'wave', 'diamond', 'leaf', 'teeth'];
  ctx.save(); ctx.beginPath(); ctx.rect(-half, -half, half * 2, half * 2); ctx.clip();
  for (let b = 0; b < bands; b++) {
    const cy = -half + bh * (b + 0.5), dir = b % 2 ? -1 : 1, off = ((o.spin * 0.012 * tw * dir) % tw + tw) % tw, col = b % 2 ? c2 : c1, type = kind[b % kind.length];
    ctx.beginPath(); ctx.moveTo(-half, cy - bh / 2); ctx.lineTo(half, cy - bh / 2); stroke(ctx, c1, 0.6, lw);
    ctx.beginPath(); ctx.moveTo(-half, cy - bh / 2 + bh * 0.07); ctx.lineTo(half, cy - bh / 2 + bh * 0.07); stroke(ctx, c2, 0.35, lw * 0.7);
    if (type === 'wave') {
      ctx.beginPath(); for (let x = -half - tw; x <= half + tw; x += tw / 12) { const y = cy + Math.sin(((x - off) / tw) * TAU) * bh * 0.22; x === -half - tw ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } stroke(ctx, col, 0.95, lw * 1.4);
    }
    for (let x = -half - tw + off; x < half + tw; x += tw) {
      ctx.save(); ctx.translate(x, cy);
      if (type === 'bud') {
        const k = clamp(Math.round(n / 2), 2, 5);
        ctx.translate(0, bh * 0.3);
        for (let j = 0; j < k; j++) { ctx.save(); ctx.rotate(-Math.PI / 2 + (j - (k - 1) / 2) * 0.5); petalPath(ctx, 0, bh * 0.7, bh * 0.16); solid(ctx, o, col, 0.25); stroke(ctx, col, 0.95, lw); ctx.restore(); }
        dot(ctx, 0, 0, bh * 0.05, c3, 0.9);
      } else if (type === 'wave') { circ(ctx, 0, -bh * 0.22, bh * 0.07); stroke(ctx, c3, 0.9, lw); dot(ctx, tw / 2, bh * 0.22, bh * 0.03, c3, 0.9); }
      else if (type === 'diamond') {
        poly(ctx, ngon(4, bh * 0.4, 0)); ctx.rotate(Math.PI / 4); poly(ctx, ngon(4, bh * 0.4, Math.PI / 4)); solid(ctx, o, col, 0.2); stroke(ctx, col, 0.9, lw);
        ctx.rotate(-Math.PI / 4); poly(ctx, ngon(4, bh * 0.14, Math.PI / 4)); stroke(ctx, c3, 0.8, lw); dot(ctx, 0, 0, bh * 0.04, c3, 1);
        dot(ctx, tw / 2, 0, bh * 0.045, c1, 0.8);
      } else if (type === 'leaf') {
        [-1, 1].forEach((s) => { ctx.save(); ctx.rotate(s * -0.9); petalPath(ctx, 0, bh * 0.38, bh * 0.1); solid(ctx, o, col, 0.22); stroke(ctx, col, 0.9, lw); ctx.restore(); });
        ctx.beginPath(); ctx.moveTo(-tw / 2, bh * 0.16); ctx.quadraticCurveTo(0, -bh * 0.2, tw / 2, bh * 0.16); stroke(ctx, c2, 0.6, lw);
      } else { // teeth: alternating triangles
        poly(ctx, [[-tw / 2, bh * 0.35], [0, -bh * 0.35], [tw / 2, bh * 0.35]]); solid(ctx, o, col, 0.3); stroke(ctx, col, 0.9, lw);
        dot(ctx, 0, bh * 0.1, bh * 0.05, c3, 0.9);
      }
      ctx.restore();
    }
  }
  ctx.restore();
  ctx.beginPath(); ctx.rect(-half, -half, half * 2, half * 2); stroke(ctx, c1, 0.9, lw * 1.6);
};

PATTERNS.leafVine = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, m = Math.max(2, n), turns = 0.9 * sp + 0.3;
  const leaves = Math.round(4 + L * d * 1.2);
  each(ctx, m, (arm) => {
    const pts = [], N = 70, side = 1;
    for (let i = 0; i <= N; i++) { const t = i / N, r = R * (0.1 + 0.68 * t), a = t * turns * Math.PI; pts.push([Math.cos(a) * r, Math.sin(a) * r, a, t]); }
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); stroke(ctx, c2, 0.95, lw * 1.6);
    for (let k = 1; k <= leaves; k++) {
      const t = k / (leaves + 1), p = pts[Math.round(t * N)], tang = p[2] + Math.PI / 2 - 0.35, s = k % 2 ? 1 : -1, size = R * (0.07 + 0.12 * t);
      ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(tang + s * 0.9 - (s < 0 ? 0 : 0));
      leafPath(ctx, size * 2.2, size * 0.7); solid(ctx, o, c1, 0.25); stroke(ctx, c1, 0.95, lw);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(size * 1.8, 0); stroke(ctx, c1, 0.4, lw * 0.7);
      ctx.restore();
      if (k % 3 === 0) { ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(tang - s * 1.2); ctx.beginPath(); for (let a = 0; a < 9; a += 0.4) { const rr = size * 0.15 * a * 0.6 + 1; ctx.lineTo(size * 0.8 + Math.cos(a) * rr * (s), Math.sin(a) * rr); } stroke(ctx, c3, 0.7, lw * 0.9); ctx.restore(); }
    }
    const e = pts[N]; ctx.save(); ctx.translate(e[0], e[1]); ctx.rotate(e[2]);
    each(ctx, 5, () => { roundPetal(ctx, 0, R * 0.08, R * 0.03); solid(ctx, o, c3, 0.4); stroke(ctx, c3, 0.95, lw); }); dot(ctx, 0, 0, R * 0.018, c1, 1); ctx.restore();
  });
  circ(ctx, 0, 0, R * 0.09); solid(ctx, o, c3, 0.35); stroke(ctx, c3, 0.95, lw);
  ringDots(ctx, R * 0.05, 6, R * 0.01, c1, 0.9);
};

/* ====================== RAJASTHANI MANDANA ====================== */

PATTERNS.chowk = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, m = Math.max(3, n);
  const h0 = R * 0.8;
  rectStroke(ctx, h0 * 1.12, c1, 0.5, lw);
  ctx.beginPath(); ctx.moveTo(-h0, -h0); ctx.lineTo(h0, h0); ctx.moveTo(h0, -h0); ctx.lineTo(-h0, h0); stroke(ctx, c2, 0.35, lw);
  const dots = Math.round(4 + 4 * d);
  for (let s = 0; s < 4; s++) { // dotted rim + corner lotus buds
    ctx.save(); ctx.rotate((s * Math.PI) / 2);
    for (let i = 0; i < dots; i++) dot(ctx, -h0 * 1.12 + (i + 0.5) * ((h0 * 2.24) / dots), -h0 * 1.12, R * 0.014, c3, 0.9);
    ctx.translate(-h0, -h0); ctx.rotate(Math.PI / 4);
    petalPath(ctx, 0, h0 * 0.36, h0 * 0.1); solid(ctx, o, c1, 0.3); stroke(ctx, c1, 0.95, lw * 1.2);
    ctx.restore();
  }
  let h = h0;
  for (let k = 0; k < L; k++) { // nested square / diamond chain, each inscribed in the last
    const rot = (k % 2) * Math.PI / 4, side = h * (k % 2 ? 1 : 1);
    const pts = ngon(4, side * (k % 2 ? 1 : Math.SQRT2), Math.PI / 4 + (k % 2 ? 0 : 0)).map(([x, y]) => [x, y]);
    const sq = k % 2 === 0 ? ngon(4, h * Math.SQRT2, Math.PI / 4) : ngon(4, h, 0);
    poly(ctx, sq); solid(ctx, o, k % 2 ? c2 : c1, 0.12 + 0.05 * (k % 3)); stroke(ctx, k % 2 ? c2 : c1, 0.95, lw * (1.6 - k * 0.05));
    if (k % 2 === 0) { // little dot at each mid-edge of the square
      for (let i = 0; i < 4; i++) dot(ctx, Math.cos((i * Math.PI) / 2) * h * 0.88, Math.sin((i * Math.PI) / 2) * h * 0.88, R * 0.012, c3, 0.9);
    }
    h = h / Math.SQRT2 * (0.92 + 0.08 / sp);
    void rot; void side; void pts;
  }
  each(ctx, m, () => { petalPath(ctx, 0, h * 0.95, h * 0.2); solid(ctx, o, c3, 0.3); stroke(ctx, c3, 0.95, lw); }, Math.PI / 4 / m);
  circ(ctx, 0, 0, h * 0.18); solid(ctx, o, c1, 0.7); stroke(ctx, c3, 1, lw);
};
function rectStroke(ctx, h, col, a, w) { ctx.beginPath(); ctx.rect(-h, -h, h * 2, h * 2); stroke(ctx, col, a, w); }

/** peacock feather eye at distance r along +x, total length len */
function feather(ctx, o, r0, len, w, c1, c2, c3) {
  const { lw } = o;
  ctx.beginPath(); ctx.moveTo(r0, 0); ctx.lineTo(r0 + len, 0); stroke(ctx, c2, 0.8, lw);
  const barbs = Math.round(5 + len / (o.R * 0.05));
  ctx.beginPath();
  for (let i = 1; i < barbs; i++) { const x = r0 + (len * i) / barbs, bl = w * (0.5 + 0.5 * Math.sin((i / barbs) * Math.PI)); ctx.moveTo(x, 0); ctx.lineTo(x + bl * 0.5, -bl); ctx.moveTo(x, 0); ctx.lineTo(x + bl * 0.5, bl); }
  stroke(ctx, c1, 0.55, lw * 0.8);
  const ex = r0 + len * 0.82; // eye: nested ellipses
  [[1, c1, 0.18], [0.72, c2, 0.5], [0.46, c3, 0.8], [0.22, o.bg, 1]].forEach(([k, col, a], i) => { ctx.beginPath(); ctx.ellipse(ex, 0, w * 0.95 * k, w * 1.25 * k, 0, 0, TAU); ctx.globalAlpha = 1; ctx.fillStyle = o.bg; ctx.fill(); fill(ctx, col, a); stroke(ctx, col, 0.95, lw); void i; });
}
PATTERNS.peacock = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, m = Math.max(3, n);
  ringDots(ctx, R * 0.97, Math.round(m * 4 * d), R * 0.01, c3, 0.6);
  const tiers = clamp(Math.round(L / 3), 1, 4);
  for (let t = tiers - 1; t >= 0; t--) {
    const k = m * (t % 2 ? 2 : 1), len = R * (0.82 - t * 0.2 * sp) - R * 0.1, w = Math.min(((R * 0.4) * Math.PI) / k, R * 0.12) * (1 - t * 0.1);
    each(ctx, k, () => feather(ctx, o, R * 0.12 + t * R * 0.03, len, w, c1, c2, c3), t % 2 ? Math.PI / k : 0);
  }
  each(ctx, m * 2, () => { petalPath(ctx, R * 0.07, R * 0.18, R * 0.03); solid(ctx, o, c1, 0.4); stroke(ctx, c1, 0.9, lw); });
  circ(ctx, 0, 0, R * 0.08); solid(ctx, o, c3, 0.6); stroke(ctx, c3, 1, lw); dot(ctx, 0, 0, R * 0.03, c2, 1);
};

/** stylised elephant facing +x, ~1 unit long (scaled by s); y up is negative */
function elephant(ctx, o, s, c1, c2, c3) {
  const { lw } = o, u = (x) => x * s;
  ctx.save();
  const body = (path, col, a = 0.2, w = lw * 1.2) => { path(); solid(ctx, o, col, a); stroke(ctx, col, 0.95, w); };
  [-0.3, -0.19, 0.13, 0.24].forEach((x, i) => body(() => { ctx.beginPath(); ctx.roundRect(u(x - 0.045), u(0.05), u(0.09), u(0.27), u(0.03)); }, c1, 0.15));
  body(() => { ctx.beginPath(); ctx.roundRect(u(-0.42), u(-0.22), u(0.74), u(0.34), u(0.15)); }, c1, 0.22); // body
  body(() => { ctx.beginPath(); ctx.moveTo(u(-0.34), u(-0.22)); ctx.lineTo(u(0.24), u(-0.22)); ctx.lineTo(u(0.24), u(-0.05)); ctx.lineTo(u(-0.34), u(-0.05)); ctx.closePath(); }, c3, 0.3, lw * 0.9); // blanket
  ctx.beginPath(); for (let i = 0; i < 6; i++) { const x = -0.3 + i * 0.1; ctx.moveTo(u(x), u(-0.05)); ctx.quadraticCurveTo(u(x + 0.05), u(0.01), u(x + 0.1), u(-0.05)); } stroke(ctx, c3, 0.9, lw * 0.8);
  body(() => { ctx.beginPath(); ctx.moveTo(u(-0.2), u(-0.22)); ctx.bezierCurveTo(u(-0.2), u(-0.4), u(0.12), u(-0.4), u(0.12), u(-0.22)); ctx.closePath(); }, c2, 0.4, lw); // howdah
  body(() => circ(ctx, u(0.36), u(-0.12), u(0.16)), c1, 0.25); // head
  body(() => { ctx.beginPath(); ctx.ellipse(u(0.27), u(-0.07), u(0.07), u(0.13), 0.2, 0, TAU); }, c2, 0.4, lw); // ear
  ctx.beginPath(); ctx.moveTo(u(0.47), u(-0.08)); ctx.bezierCurveTo(u(0.6), u(0.0), u(0.54), u(0.2), u(0.62), u(0.27)); ctx.lineWidth = u(0.075); ctx.strokeStyle = o.bg; ctx.globalAlpha = 1; ctx.stroke(); stroke(ctx, c1, 0.95, lw * 1.2); // trunk
  ctx.beginPath(); ctx.moveTo(u(0.47), u(-0.08)); ctx.bezierCurveTo(u(0.6), u(0.0), u(0.54), u(0.2), u(0.62), u(0.27)); stroke(ctx, c1, 0.6, u(0.07));
  ctx.beginPath(); ctx.moveTo(u(0.43), u(0.0)); ctx.quadraticCurveTo(u(0.55), u(0.08), u(0.52), u(0.14)); stroke(ctx, c3, 0.9, lw * 1.3); // tusk
  ctx.beginPath(); ctx.moveTo(u(-0.42), u(-0.12)); ctx.quadraticCurveTo(u(-0.52), u(0.0), u(-0.47), u(0.14)); stroke(ctx, c1, 0.9, lw); // tail
  dot(ctx, u(0.4), u(-0.17), u(0.017), c3, 1);
  ctx.restore();
}
PATTERNS.elephant = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, m = Math.max(2, n);
  const rr = R * (0.52 + 0.1 * sp), s = Math.min(R * 0.62, ((rr * TAU) / m) * 0.95);
  ring(ctx, R * 0.96, c1, 0.5, lw); ring(ctx, R * 0.92, c2, 0.35, lw);
  scallop(ctx, rr - s * 0.38, m * 2, R * 0.02); stroke(ctx, c2, 0.6, lw);
  ringDots(ctx, R * 0.94, Math.round(m * 6 * d), R * 0.008, c3, 0.7);
  each(ctx, m, () => { ctx.translate(rr, 0); ctx.rotate(Math.PI / 2); ctx.translate(0, s * 0.02); elephant(ctx, o, s, c1, c2, c3); });
  each(ctx, m, () => { petalPath(ctx, R * 0.03, R * (0.14 + 0.03 * L / 6), R * 0.04); solid(ctx, o, c3, 0.35); stroke(ctx, c3, 0.95, lw); }, Math.PI / m);
  dot(ctx, 0, 0, R * 0.035, c1, 1);
};

PATTERNS.diamondGrid = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, half = R * 0.92, cell = (half * 2) / (L + 1) * sp, a = cell / 2, k = clamp(n, 3, 12);
  ctx.save(); ctx.beginPath(); ctx.rect(-half, -half, half * 2, half * 2); ctx.clip();
  const m = Math.ceil(half / a) + 1;
  for (let i = -m; i <= m; i++) for (let j = -m; j <= m; j++) {
    if ((i + j) & 1) continue;
    const x = i * a, y = j * a, odd = ((i - j) / 2) & 1, col = odd ? c2 : c1;
    ctx.save(); ctx.translate(x, y);
    poly(ctx, ngon(4, a, 0).map(([px, py]) => [px, py])); solid(ctx, o, col, odd ? 0.28 : 0.14); stroke(ctx, col, 0.95, lw * 1.2);
    poly(ctx, ngon(4, a * 0.62, 0)); stroke(ctx, col, 0.6, lw);
    if (d > 0.8) { poly(ctx, star(k * 2, 2, a * 0.5, -Math.PI / 2).slice(0, k * 2)); }
    ctx.beginPath(); each(ctx, k, () => { ctx.moveTo(a * 0.12, 0); ctx.lineTo(a * 0.4, 0); }); stroke(ctx, c3, 0.8, lw * 0.9);
    dot(ctx, 0, 0, a * 0.08, c3, 1);
    ctx.restore();
    if (d > 1.3) dot(ctx, x + a, y, a * 0.06, c3, 0.8);
  }
  ctx.restore();
  rectStroke(ctx, half, c1, 0.95, lw * 1.8); rectStroke(ctx, half * 1.05, c2, 0.5, lw);
};

PATTERNS.floralMandana = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, m = Math.max(3, n), thick = lw * 1.4;
  ring(ctx, R * 0.96, c1, 0.6, thick); ringDots(ctx, R * 0.91, m * Math.round(2 + 2 * d), R * 0.012, c3, 0.9);
  const rb = R * (0.62 + 0.1 * (sp - 1)), bl = R * 0.26;
  each(ctx, m, () => { ctx.translate(rb, 0); paisley(ctx, bl, bl * 0.28); solid(ctx, o, c2, 0.35); stroke(ctx, c2, 0.95, thick); ctx.translate(bl * 0.2, 0); ctx.scale(0.5, 0.5); paisley(ctx, bl, bl * 0.28); stroke(ctx, c3, 0.9, thick); });
  each(ctx, m, () => { ctx.translate(R * 0.38, 0); petalPath(ctx, 0, R * 0.3, R * 0.045); solid(ctx, o, c3, 0.25); stroke(ctx, c3, 0.9, thick); }, Math.PI / m);
  const tiers = clamp(Math.round(L / 2), 1, 5);
  for (let t = tiers - 1; t >= 0; t--) {
    const f = (t + 1) / tiers, r1 = R * 0.46 * f + R * 0.1, w = Math.min(r1 * Math.sin(Math.PI / m) * 1.05, R * 0.14);
    each(ctx, m, () => { roundPetal(ctx, R * 0.03, r1, w * 0.85); solid(ctx, o, t % 2 ? c2 : c1, 0.3); stroke(ctx, t % 2 ? c2 : c1, 0.95, thick); dot(ctx, r1 * 0.85, 0, w * 0.18, c3, 0.9); }, t % 2 ? Math.PI / m : 0);
  }
  circ(ctx, 0, 0, R * 0.07); solid(ctx, o, c3, 0.7); stroke(ctx, c3, 1, thick);
};

/* ======================== SACRED GEOMETRY ======================== */

PATTERNS.sriYantra = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, m = clamp(n, 3, 12) * 2;
  // outer bhupura gates
  const sq = R * 0.97, gate = R * 0.12;
  ctx.beginPath(); for (let s = 0; s < 4; s++) { ctx.save(); ctx.rotate((s * Math.PI) / 2); ctx.moveTo(-sq, -sq); ctx.lineTo(-gate * 1.6, -sq); ctx.lineTo(-gate * 1.6, -sq - R * 0.03); ctx.lineTo(gate * 1.6, -sq - R * 0.03); ctx.lineTo(gate * 1.6, -sq); ctx.lineTo(sq, -sq); ctx.restore(); } stroke(ctx, c1, 0.9, lw * 1.2);
  ctx.beginPath(); ctx.rect(-sq * 0.9, -sq * 0.9, sq * 1.8, sq * 1.8); stroke(ctx, c2, 0.5, lw);
  const rc = R * 0.82; ring(ctx, rc, c1, 0.8, lw);
    each(ctx, m * 2, () => { petalPath(ctx, rc * 0.8, rc * 0.99, rc * 0.07); stroke(ctx, c1, 0.9, lw); });
  each(ctx, m, () => { petalPath(ctx, rc * 0.66, rc * 0.86, rc * 0.09); stroke(ctx, c2, 0.95, lw); }, Math.PI / m);
  ring(ctx, rc * 0.66, c1, 0.7, lw); ring(ctx, rc * 0.63, c2, 0.5, lw);
  // nine interlocking triangles, drawn outside-in (y up). [apex y, base y]: 4 upward + 5 downward
  const U = [[0.58, -0.5], [0.46, -0.36], [0.32, -0.22], [0.16, -0.1]], D = [[-0.6, 0.46], [-0.5, 0.32], [-0.38, 0.2], [-0.26, 0.1], [-0.12, 0.02]];
  const seq = [[D[0], -1], [U[0], 1], [D[1], -1], [U[1], 1], [D[2], -1], [U[2], 1], [D[3], -1], [U[3], 1], [D[4], -1]];
  const cnt = clamp(L, 1, 9), scl = rc * 0.92 * (0.85 + 0.15 * sp);
  for (let i = 0; i < cnt; i++) {
    const [[ya, yb], dir] = seq[i], w = Math.abs(ya - yb) * 0.5774 * scl;
    poly(ctx, [[0, -ya * scl], [-w, -yb * scl], [w, -yb * scl]]); solid(ctx, o, dir > 0 ? c1 : c2, 0.1); stroke(ctx, dir > 0 ? c1 : c2, 0.95, lw * 1.3);
  }
  dot(ctx, 0, 0, R * 0.022, c3, 1);
};

PATTERNS.flowerOfLife = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, rings = clamp(Math.round(L / 3), 1, 5), r = (R * 0.9) / (rings + 1);
  const m = Math.max(3, n), step = r * sp;
  ring(ctx, R * 0.97, c1, 0.8, lw * 1.3); ring(ctx, R * 0.93, c2, 0.5, lw);
  const seen = new Set();
  for (let q = -rings; q <= rings; q++) for (let s = -rings; s <= rings; s++) {
    const dist = Math.max(Math.abs(q), Math.abs(s), Math.abs(q + s)); if (dist > rings) continue;
    const x = step * (q + s / 2), y = step * ((Math.sqrt(3) / 2) * s), key = `${q},${s}`; if (seen.has(key)) continue; seen.add(key);
    circ(ctx, x, y, r); if (dist <= 1) { fill(ctx, dist ? c2 : c3, 0.12 * d); } stroke(ctx, dist % 2 ? c2 : c1, 0.95, lw * 1.4);
  }
  circ(ctx, 0, 0, r * (rings + 1) * (0.98 + 0.02 * sp)); stroke(ctx, c3, 0.7, lw);
  poly(ctx, star(m * 2, 2 > m ? 1 : Math.max(1, Math.floor((m * 2 - 1) / 2 / 1)), R * 0.9, -Math.PI / 2)); stroke(ctx, c3, 0.22 * d, lw * 0.8);
  dot(ctx, 0, 0, r * 0.1, c3, 1);
};

PATTERNS.sacredMandala = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, m = Math.max(3, n);
  const types = ['petalsOut', 'dots', 'teeth', 'scallop', 'star', 'petalsIn', 'chain', 'rays'], bands = clamp(L, 2, 12), bt = (R * 0.92) / bands;
  ring(ctx, R * 0.98, c1, 0.7, lw * 1.2);
  for (let b = 0; b < bands; b++) {
    const r1 = R * 0.95 - b * bt * (0.8 + 0.2 * sp), r0 = r1 - bt * 0.86, col = b % 2 ? c2 : c1, t = types[(b + 3 * (b >> 3)) % types.length], k = m * (1 + (b % 3));
    ring(ctx, r1, col, 0.45, lw);
    switch (t) {
      case 'petalsOut': each(ctx, k, () => { petalPath(ctx, r0, r1, Math.min(r0 * Math.sin(Math.PI / k) * 1.2, bt * 0.5)); solid(ctx, o, col, 0.22); stroke(ctx, col, 0.9, lw); }); break;
      case 'petalsIn': each(ctx, k, () => { petalPath(ctx, r1, r0, Math.min(r1 * Math.sin(Math.PI / k) * 1.1, bt * 0.5)); solid(ctx, o, col, 0.22); stroke(ctx, col, 0.9, lw); }, Math.PI / k); break;
      case 'dots': ringDots(ctx, (r0 + r1) / 2, k * 2 * Math.round(d + 0.5), Math.max(1.2, bt * 0.1), col, 0.9); ring(ctx, r0, col, 0.4, lw * 0.8); break;
      case 'teeth': teeth(ctx, r0, r1, k * 2); solid(ctx, o, col, 0.2); stroke(ctx, col, 0.9, lw); break;
      case 'scallop': scallop(ctx, r0 + bt * 0.2, k * 2, bt * 0.28); stroke(ctx, col, 0.9, lw); scallop(ctx, r0 + bt * 0.05, k * 2, bt * 0.16); stroke(ctx, c3, 0.5, lw * 0.8); break;
      case 'star': poly(ctx, star(k, Math.max(1, Math.floor((k - 1) / 2)), r1 * 0.98, -Math.PI / 2)); stroke(ctx, col, 0.85, lw); poly(ctx, ngon(k, r0, -Math.PI / 2)); stroke(ctx, c3, 0.5, lw * 0.8); break;
      case 'chain': each(ctx, k * 2, () => { circ(ctx, (r0 + r1) / 2, 0, bt * 0.28); stroke(ctx, col, 0.85, lw); }); break;
      default: ctx.beginPath(); each(ctx, k * 3, () => { ctx.moveTo(r0, 0); ctx.lineTo(r1, 0); }); stroke(ctx, col, 0.7, lw * 0.9);
    }
  }
  const rc = R * 0.95 - bands * bt * (0.8 + 0.2 * sp);
  if (rc > R * 0.04) { each(ctx, m, () => { petalPath(ctx, 0, Math.max(rc, R * 0.08), Math.max(rc, R * 0.08) * Math.sin(Math.PI / m)); solid(ctx, o, c3, 0.3); stroke(ctx, c3, 0.95, lw); }); }
  dot(ctx, 0, 0, R * 0.03, c3, 1);
};

PATTERNS.kaleidoscope = (ctx, o) => {
  const { R, n, L, d, lw, c1, c2, c3 } = o, m = Math.max(2, n), wedge = Math.PI / m, cols = [c1, c2, c3];
  const rnd = rng(o.seed || 1), count = Math.round(L * 2 * Math.max(0.7, d)), shapes = [], spread = Math.min(1.25, o.sp || 1);
  for (let i = 0; i < count; i++) shapes.push({ k: Math.floor(rnd() * 5), r: R * (0.1 + 0.85 * rnd()) * Math.min(1, spread * 0.85), a: rnd() * wedge * 0.9 + wedge * 0.05, s: R * (0.02 + 0.07 * rnd()), c: cols[Math.floor(rnd() * 3)], rot: rnd() * TAU, f: rnd() < 0.5 });
  const draw = () => shapes.forEach((s) => {
    ctx.save(); ctx.translate(Math.cos(s.a) * s.r, Math.sin(s.a) * s.r); ctx.rotate(s.rot);
    if (s.k === 0) circ(ctx, 0, 0, s.s * 0.8); else if (s.k === 1) poly(ctx, ngon(3, s.s)); else if (s.k === 2) petalPath(ctx, -s.s, s.s * 1.4, s.s * 0.5); else if (s.k === 3) poly(ctx, ngon(4, s.s * 0.9, Math.PI / 4)); else { ctx.beginPath(); ctx.moveTo(-s.s * 1.4, 0); ctx.quadraticCurveTo(0, s.s * 1.1, s.s * 1.4, 0); }
    if (s.f && s.k !== 4) { fill(ctx, s.c, 0.22); } stroke(ctx, s.c, 0.75, lw); ctx.restore();
  });
  for (let i = 0; i < m; i++) { ctx.save(); ctx.rotate((i * TAU) / m); draw(); ctx.scale(1, -1); draw(); ctx.restore(); }
  each(ctx, m, () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(R, 0); stroke(ctx, c1, 0.12, lw); });
  ring(ctx, R * 0.98, c1, 0.5, lw);
};

PATTERNS.bloom = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, m = Math.max(3, n);
  const k = Math.max(1, Math.floor((m - 1) / 2));
  poly(ctx, star(m, k, R * 0.98, -Math.PI / 2)); stroke(ctx, c2, 0.4, lw);
  for (let l = 0; l < L; l++) {
    const f = Math.pow(1 - l / (L + 0.5), 1 / sp), A = R * (0.2 + 0.72 * f), depth = 0.28 + 0.5 * (l / L), col = l % 2 ? c2 : c1;
    ctx.beginPath();
    for (let i = 0; i <= 240; i++) { const t = (i / 240) * TAU, rr = A * (1 - depth * 0.5 + depth * 0.5 * Math.cos(m * t + (l % 2) * Math.PI)); const x = Math.cos(t) * rr, y = Math.sin(t) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); solid(ctx, o, col, 0.1 + 0.03 * (l % 3)); stroke(ctx, col, 0.95, lw * 1.2);
    if (l % 2 === 0 && d > 0.6) ringDots(ctx, A * (1 - depth * 0.5 + depth * 0.5) * 0.98, m, R * 0.01 * d, c3, 0.9);
  }
  circ(ctx, 0, 0, R * 0.05); fill(ctx, c3, 1);
};

/* =========================== FUSION =========================== */

PATTERNS.alpanaFusion = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, m = Math.max(3, n);
  const k = Math.max(1, Math.floor((m * 2 - 1) / 2));
  poly(ctx, star(m * 2, k, R * 0.97, -Math.PI / 2)); stroke(ctx, c2, 0.55, lw);
  poly(ctx, ngon(m * 2, R * 0.97, -Math.PI / 2)); stroke(ctx, c1, 0.3, lw);
  ringDots(ctx, R * 0.8, m * 2 * Math.round(d + 0.5), R * 0.01, c3, 0.8, Math.PI / (m * 2));
  const tiers = clamp(Math.round(L / 2), 1, 5);
  for (let t = tiers - 1; t >= 0; t--) {
    const f = (t + 1) / tiers, r1 = R * (0.2 + 0.55 * Math.pow(f, 1 / sp)), w = r1 * Math.sin(Math.PI / m) * 0.8;
    each(ctx, m, () => { petalPath(ctx, R * 0.04, r1, w); solid(ctx, o, t % 2 ? c2 : c1, 0.22); stroke(ctx, t % 2 ? c2 : c1, 0.95, lw * 1.2); }, t % 2 ? Math.PI / m : 0);
  }
  each(ctx, m, () => { ctx.translate(R * 0.83, 0); ctx.rotate(Math.PI / 2); roundPetal(ctx, -R * 0.07, R * 0.07, R * 0.035); stroke(ctx, c3, 0.9, lw); poly(ctx, ngon(4, R * 0.045, 0)); fill(ctx, c3, 0.5); }, Math.PI / m);
  circ(ctx, 0, 0, R * 0.07); solid(ctx, o, c3, 0.6); stroke(ctx, c3, 1, lw);
};

PATTERNS.mandanaFusion = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, m = Math.max(4, n), sq = clamp(Math.round(L / 2) + 1, 2, 7), thick = lw * 1.3;
  for (let k = 0; k < sq; k++) {
    const h = R * 0.8 * Math.pow(1 - k / (sq + 0.3), 1 / sp) * (k % 2 ? 0.98 : 1), rot = (k * Math.PI) / (m * 1.0) * 0 + (k % 2) * Math.PI / 4;
    ctx.save(); ctx.rotate(rot); rectStroke(ctx, h, k % 2 ? c2 : c1, 0.95, thick); ctx.beginPath(); ctx.rect(-h, -h, h * 2, h * 2); solid(ctx, o, k % 2 ? c2 : c1, 0.1);
    stroke(ctx, k % 2 ? c2 : c1, 0.95, thick);
    for (let s = 0; s < 4; s++) { ctx.save(); ctx.rotate((s * Math.PI) / 2); ctx.translate(-h, -h); ctx.rotate(Math.PI / 4); petalPath(ctx, 0, h * 0.22, h * 0.06); stroke(ctx, c3, 0.9, lw); ctx.restore(); }
    ctx.restore();
  }
  const rc = R * 0.45 / (0.5 + 0.5 * sp);
  ring(ctx, rc, c1, 0.8, thick); scallop(ctx, rc * 0.9, m * 2, rc * 0.08); stroke(ctx, c3, 0.8, lw);
  each(ctx, m, () => { roundPetal(ctx, rc * 0.2, rc * 0.88, rc * 0.18); solid(ctx, o, c3, 0.3); stroke(ctx, c3, 0.95, lw); ctx.save(); ctx.translate(rc * 0.9, 0); ctx.scale(0.6, 0.6); stroke(ctx, c1, 0, 0); ctx.restore(); });
  each(ctx, m, () => dot(ctx, R * 0.93, 0, R * 0.014 * d, c3, 0.9), Math.PI / m);
  dot(ctx, 0, 0, rc * 0.12, c1, 1);
};

PATTERNS.lotusGeometry = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, m = Math.max(3, n);
  poly(ctx, ngon(m, R * 0.98, -Math.PI / 2)); stroke(ctx, c2, 0.7, lw * 1.2);
  poly(ctx, ngon(m, R * 0.98 * Math.cos(Math.PI / m) * 0.99, -Math.PI / 2 + Math.PI / m)); stroke(ctx, c3, 0.25, lw);
  ring(ctx, R * 0.98, c1, 0.4, lw);
  const tiers = clamp(Math.round(L / 3) + 1, 1, 5), dd = Math.sin(Math.PI / m) * 2;
  for (let t = tiers - 1; t >= 0; t--) {
    const f = Math.pow((t + 1) / tiers, 1 / sp), rc = (R * 0.9 * f) / 1.62 * (t ? 1 : 1), col = t % 2 ? c2 : c1, off = t % 2 ? Math.PI / m : 0;
    // petal = lens where two neighbouring circles (centres on a ring) overlap — compass-and-straightedge lotus
    for (let i = 0; i < m; i++) {
      const a0 = off + (i * TAU) / m, a1 = off + ((i + 1) * TAU) / m, x0 = Math.cos(a0) * rc, y0 = Math.sin(a0) * rc, x1 = Math.cos(a1) * rc, y1 = Math.sin(a1) * rc;
      ctx.save(); circ(ctx, x0, y0, rc); ctx.clip();
      circ(ctx, x1, y1, rc); solid(ctx, o, col, 0.2); stroke(ctx, col, 0.95, lw * 1.2);
      ctx.restore();
      ctx.save(); circ(ctx, x1, y1, rc); ctx.clip(); circ(ctx, x0, y0, rc); stroke(ctx, col, 0.95, lw * 1.2); ctx.restore();
    }
    if (d > 0.7) ringDots(ctx, rc * 1.62 * 0.98, m, R * 0.01 * d + 0.6, c3, 0.9, off + Math.PI / m);
  }
  void dd;
  each(ctx, m, () => { circ(ctx, R * 0.07, 0, R * 0.045); stroke(ctx, c3, 0.9, lw); });
  circ(ctx, 0, 0, R * 0.04); fill(ctx, c3, 1);
};

/** cusped Indian arch, base at r0 (width bw), apex at r1, along +x */
function archPath(ctx, r0, r1, bw) {
  const h = r1 - r0;
  ctx.beginPath(); ctx.moveTo(r0, -bw);
  ctx.lineTo(r0 + h * 0.42, -bw);
  ctx.bezierCurveTo(r0 + h * 0.62, -bw * 1.05, r0 + h * 0.7, -bw * 0.45, r1, 0);
  ctx.bezierCurveTo(r0 + h * 0.7, bw * 0.45, r0 + h * 0.62, bw * 1.05, r0 + h * 0.42, bw);
  ctx.lineTo(r0, bw); ctx.closePath();
}
PATTERNS.modernMandala = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, m = Math.max(3, n), k = m * 2;
  const bold = lw * 1.4;
  each(ctx, k, (i) => { archPath(ctx, R * 0.74, R * 0.99, Math.min(R * 0.74 * Math.PI / k * 0.82, R * 0.14)); solid(ctx, o, i % 2 ? c2 : c1, 0.55); stroke(ctx, i % 2 ? c2 : c1, 1, bold); archPath(ctx, R * 0.78, R * 0.9, R * 0.045); stroke(ctx, c3, 0.9, lw); });
  for (let i = 0; i < k * 2; i++) { // alternating filled wedge band
    const a0 = (i * TAU) / (k * 2), a1 = ((i + 1) * TAU) / (k * 2);
    ctx.beginPath(); ctx.arc(0, 0, R * 0.74, a0, a1); ctx.arc(0, 0, R * 0.6, a1, a0, true); ctx.closePath(); if (i % 2) { solid(ctx, o, c3, 0.5); } stroke(ctx, c3, 0.9, lw);
  }
  const rings = clamp(Math.round(L / 2), 1, 6);
  for (let t = 0; t < rings; t++) {
    const r = R * (0.58 - (t * 0.38) / rings * sp * 0.9);
    if (r < R * 0.1) break;
    ring(ctx, r, t % 2 ? c2 : c1, 0.95, bold); ringDots(ctx, r - R * 0.03, k * (1 + (t % 2)) * Math.round(d + 0.5), Math.max(1.2, R * 0.01), c3, 0.9, t * 0.1);
    if (t % 2 === 0) each(ctx, k, () => { petalPath(ctx, r * 0.78, r * 0.98, r * 0.06); stroke(ctx, c1, 0.7, lw); });
  }
  poly(ctx, star(k, Math.max(1, Math.floor((k - 1) / 2)), R * 0.16)); solid(ctx, o, c3, 0.7); stroke(ctx, c3, 1, bold);
};

PATTERNS.digitalFolk = (ctx, o) => {
  const { R, n, L, d, sp, lw, c1, c2, c3 } = o, N = clamp(6 + L, 7, 19) | 1, cell = (R * 1.7) / N, half = Math.floor(N / 2);
  const rnd = rng(o.seed || 1), cols = [c1, c2, c3], size = cell * clamp(0.95 / Math.pow(sp, 0.6), 0.4, 1), grid = {};
  const p = clamp(0.42 * d + 0.2, 0.3, 0.92);
  for (let y = 0; y <= half; y++) for (let x = 0; x <= half - 0; x++) { // one octant, mirrored 8 ways
    if (x > y) continue; const on = rnd() < p || (x === 0 && y === 0); const kind = Math.floor(rnd() * 5), col = Math.floor(rnd() * 3);
    for (const [a, b] of [[x, y], [y, x]]) for (const sx of [1, -1]) for (const sy of [1, -1]) grid[`${a * sx},${b * sy}`] = on ? [kind, col] : null;
  }
  ctx.save();
  for (let y = -half; y <= half; y++) for (let x = -half; x <= half; x++) {
    const g = grid[`${x},${y}`]; if (!g) continue;
    ctx.save(); ctx.translate(x * cell, y * cell); const s = size / 2, col = cols[g[1]];
    if (g[0] === 0) ctx.rect(-s, -s, s * 2, s * 2), ctx.beginPath(), ctx.rect(-s * 0.9, -s * 0.9, s * 1.8, s * 1.8);
    else if (g[0] === 1) poly(ctx, ngon(4, s * 1.1, 0));
    else if (g[0] === 2) circ(ctx, 0, 0, s * 0.85);
    else if (g[0] === 3) poly(ctx, [[0, -s], [s, s], [-s, s]]);
    else { ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.moveTo(0, -s); ctx.lineTo(0, s); }
    if (g[0] !== 4) { solid(ctx, o, col, 0.55); } stroke(ctx, col, 1, lw * 1.2);
    ctx.restore();
  }
  ctx.restore();
  const e = (half + 1) * cell;
  ctx.beginPath(); ctx.rect(-e, -e, e * 2, e * 2); stroke(ctx, c1, 0.9, lw * 1.4);
  for (let s = 0; s < 4; s++) { ctx.save(); ctx.rotate((s * Math.PI) / 2); for (let i = -half; i <= half; i++) { poly(ctx, [[i * cell - cell * 0.3, -e], [i * cell, -e - cell * 0.45], [i * cell + cell * 0.3, -e]]); stroke(ctx, c2, 0.9, lw); } ctx.restore(); }
};

/* ============================ API ============================ */

export const ENGINE_PATTERNS = Object.freeze({
  padma: 'Padma Lotus', shankha: 'Shankha', matsya: 'Matsya', floralCircle: 'Floral Circle', alpanaBorder: 'Alpana Border', leafVine: 'Leaf and Vine',
  chowk: 'Mandana Chowk', peacock: 'Peacock Geometry', elephant: 'Elephant Motif', diamondGrid: 'Diamond Grid', floralMandana: 'Floral Mandana',
  sriYantra: 'Sri Yantra Inspired', flowerOfLife: 'Flower of Life', sacredMandala: 'Sacred Mandala', kaleidoscope: 'Kaleidoscope', bloom: 'Geometric Bloom',
  alpanaFusion: 'Alpana Fusion', mandanaFusion: 'Mandana Fusion', lotusGeometry: 'Lotus Geometry', modernMandala: 'Modern Indian Mandala', digitalFolk: 'Digital Folk Art',
});
export const hasEngine = (id) => Object.prototype.hasOwnProperty.call(PATTERNS, id);

/** Draw pattern `id`. o: { cx, cy, R, n, L, d, sp, lw, rotation, spin, c1, c2, c3, bg, seed } */
export function drawPattern(ctx, id, o) {
  const fn = PATTERNS[id];
  if (!fn) return false;
  ctx.save();
  ctx.translate(o.cx, o.cy);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (id !== 'alpanaBorder') ctx.rotate(rad(o.rotation + o.spin * 0.35)); else ctx.rotate(rad(o.rotation));
  fn(ctx, o);
  ctx.restore();
  ctx.globalAlpha = 1;
  return true;
}
