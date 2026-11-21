// Shared yantra renderer. Same geometry as the original app (concentric rings of
// nodes joined by lines) — now used by the pattern studio, landing hero, loader
// and dashboard so they all stay visually consistent.

export function drawYantra(ctx, { cx, cy, maxR, layers = 6, symmetry = 6, rotation = 0, spin = 0, primary = '#b19cd9', secondary = '#7851a9', glow = true, node = 0.15, lineWidth = 1 }) {
  ctx.save();
  if (glow) ctx.globalCompositeOperation = 'lighter';
  for (let l = 0; l < layers; l++) {
    const r = (maxR / layers) * (l + 1);
    const dir = l % 2 === 0 ? 1 : -1; // alternate layers counter-rotate while animating
    const color = l % 2 === 0 ? primary : secondary;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(((rotation + spin * dir) * Math.PI) / 180);
    const step = (Math.PI * 2) / symmetry;

    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.14;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = 0.42;
    ctx.beginPath();
    for (let i = 0; i < symmetry; i++) {
      const x = Math.cos(step * i) * r, y = Math.sin(step * i) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = color;
    for (let i = 0; i < symmetry; i++) {
      const x = Math.cos(step * i) * r, y = Math.sin(step * i) * r;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.2, r * node), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = lineWidth * 2;
      ctx.stroke();
      ctx.lineWidth = lineWidth;
    }
    ctx.restore();
  }
  ctx.restore();
}

/** Soft radial glow at the centre, used under the pattern. */
export function drawCoreGlow(ctx, cx, cy, r, color = '#a855f7') {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, color + 'aa');
  g.addColorStop(1, color + '00');
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.restore();
}

/** Size a canvas to its CSS box at device pixel ratio; returns {w,h,dpr}. */
export function fitCanvas(canvas, maxDpr = 2) {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  const w = Math.max(1, Math.round(canvas.clientWidth));
  const h = Math.max(1, Math.round(canvas.clientHeight));
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h, dpr };
}
