import { prefersReducedMotion } from './util.js';

// Gold + violet ambient palette (gold weighted slightly higher)
const COLORS = ['212,175,90', '231,200,115', '139,92,246', '168,85,247', '196,181,253'];

export function initBackground(canvas) {
  const ctx = canvas.getContext('2d');
  const reduce = prefersReducedMotion();
  let w = 0, h = 0, dpr = 1, raf = 0, particles = [], born = performance.now();
  const pointer = { x: -9999, y: -9999 };
  const trail = [];

  function resize() {
    dpr = window.devicePixelRatio || 1;
    w = window.innerWidth; 
    h = window.innerHeight;
    
    canvas.width = w * dpr; 
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    const count = Math.round(Math.min(window.matchMedia('(pointer: coarse)').matches ? 34 : 64, Math.max(20, (w * h) / 26000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.7 + 0.5, c: COLORS[(Math.random() * COLORS.length) | 0], ph: Math.random() * 6.28,
    }));
    if (reduce) { born = -1e9; frame(0); }
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = Math.min(1, (t - born) / 1600); // gentle fade-in
    const link = 120;
    for (const p of particles) {
      if (!reduce) {
        const dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy;
        if (d2 < 22000) { const d = Math.sqrt(d2) || 1, f = (1 - d / 148) * 0.9; p.vx += (dx / d) * f * 0.08; p.vy += (dy / d) * f * 0.08; }
        p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx + 0.04; p.y += p.vy - 0.03;
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
      }
      const tw = 0.55 + 0.45 * Math.sin(t * 0.0015 + p.ph);
      ctx.fillStyle = `rgba(${p.c},${0.16 * tw})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, 6.283); ctx.fill();
      ctx.fillStyle = `rgba(${p.c},${0.85 * tw})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 < link * link) {
          ctx.strokeStyle = `rgba(${a.c},${(1 - Math.sqrt(d2) / link) * 0.16})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    if (!reduce && trail.length > 1) {
      for (let i = 1; i < trail.length; i++) {
        const k = i / trail.length;
        ctx.strokeStyle = `rgba(212,175,90,${k * 0.5})`;
        ctx.lineWidth = k * 3;
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y); ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke();
      }
    }
    if (trail.length) { trail.shift(); if (pointer.x > -999) trail.push({ x: pointer.x, y: pointer.y }); }
    if (!reduce) raf = requestAnimationFrame(frame);
  }

  function start() { if (!raf && !reduce) raf = requestAnimationFrame(frame); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  window.addEventListener('pointermove', (e) => {
    pointer.x = e.clientX; pointer.y = e.clientY;
    if (trail.length < 16) trail.push({ x: e.clientX, y: e.clientY });
  }, { passive: true });
  window.addEventListener('pointerleave', () => { pointer.x = pointer.y = -9999; });
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  resize();
  start();
}