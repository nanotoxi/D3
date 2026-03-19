// src/useCursorTrail.js
// Canvas-based comet trail. Updated to Nanotoxi electric-blue brand color.
// Call initCursorTrail() once at app root level. Returns a cleanup function.

export function initCursorTrail() {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 99999;
  `;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let W = window.innerWidth;
  let H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;

  const points = [];
  const MAX = 32;

  const onMove = (e) => {
    points.unshift({ x: e.clientX, y: e.clientY, age: 0 });
    if (points.length > MAX) points.length = MAX;
  };

  const onResize = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
  };

  document.addEventListener('mousemove', onMove);
  window.addEventListener('resize', onResize);

  let rafId;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);

    points.forEach((pt) => { pt.age += 1; });

    // Tapered comet trail — deep blue (#00c6ff)
    if (points.length > 1) {
      for (let i = 0; i < points.length - 1; i++) {
        const t = i / MAX;
        const alpha = Math.max(0, 1 - t * 1.05) * 0.82;
        const lineW = Math.max(0.2, (1 - t) * 8);

        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        // ← Brand blue: rgba(0, 198, 255) replaces the old green
        ctx.strokeStyle = `rgba(0, 198, 255, ${alpha})`;
        ctx.lineWidth = lineW;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    }

    // Bright dot at tip with dual glow rings
    if (points.length > 0) {
      const tip = points[0];

      // Outer soft glow
      const outerGrad = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 18);
      outerGrad.addColorStop(0, 'rgba(0,198,255,0.22)');
      outerGrad.addColorStop(1, 'rgba(0,198,255,0)');
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 18, 0, Math.PI * 2);
      ctx.fillStyle = outerGrad;
      ctx.fill();

      // Inner tight glow
      const innerGrad = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 9);
      innerGrad.addColorStop(0, 'rgba(0,198,255,0.92)');
      innerGrad.addColorStop(0.4, 'rgba(0,198,255,0.45)');
      innerGrad.addColorStop(1, 'rgba(0,198,255,0)');
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = innerGrad;
      ctx.fill();

      // Sharp center dot
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(180,240,255,0.95)';
      ctx.fill();
    }

    // Age out old points
    for (let i = points.length - 1; i >= 0; i--) {
      if (points[i].age > 22) points.splice(i, 1);
    }

    rafId = requestAnimationFrame(draw);
  };

  rafId = requestAnimationFrame(draw);

  return () => {
    cancelAnimationFrame(rafId);
    document.removeEventListener('mousemove', onMove);
    window.removeEventListener('resize', onResize);
    canvas.remove();
  };
}
