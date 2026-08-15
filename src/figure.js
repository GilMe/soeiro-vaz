// figure.js — shared painters that keep the cast from looking like paper
// cutouts. Three rules applied everywhere: every mass is gradient-shaded
// (lit from the left), heads are ovals with real hair masses rather than
// circles with a lid, and silhouettes get a soft dark rim instead of either
// a hard cartoon outline or nothing.

import { shade } from './art.js';

// Draw fn scaled by k around an anchor — for resizing hand-placed NPC
// sprites to a room's perspective without re-deriving their coordinates.
export function scaled(ctx, ax, ay, k, fn) {
  ctx.save();
  ctx.translate(ax, ay);
  ctx.scale(k, k);
  ctx.translate(-ax, -ay);
  fn();
  ctx.restore();
}

// The sardine. It appears in more scenes than most of the cast.
export function sardinha(ctx, x, y, s = 1, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const g = ctx.createLinearGradient(0, -1.8 * s, 0, 1.8 * s);
  g.addColorStop(0, '#c2ccd2');
  g.addColorStop(0.55, '#8fa2ac');
  g.addColorStop(1, '#5e707a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, 5 * s, 1.7 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();                                     // tail
  ctx.moveTo(4.4 * s, 0);
  ctx.lineTo(6.6 * s, -1.7 * s);
  ctx.lineTo(6.6 * s, 1.7 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1c2226';                           // the eye
  ctx.beginPath(); ctx.arc(-3.2 * s, -0.3 * s, 0.5 * s, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// A shaded convex mass. pts = [[x,y],...] clockwise.
export function vol(ctx, pts, col, opts = {}) {
  let x0 = 1e9, x1 = -1e9;
  for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; }
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, shade(col, opts.lit ?? 16));
  g.addColorStop(0.45, col);
  g.addColorStop(1, shade(col, opts.dark ?? -28));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(18,11,7,.28)';
  ctx.lineWidth = 0.7;
  ctx.stroke();
}

// Two or three soft cloth folds down a torso.
export function folds(ctx, x, yTop, yBot, n = 2) {
  ctx.strokeStyle = 'rgba(10,6,4,.16)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < n; i++) {
    const fx = x + (i - (n - 1) / 2) * 2.6 + 0.8;
    ctx.beginPath();
    ctx.moveTo(fx, yTop + 1.5);
    ctx.quadraticCurveTo(fx + 0.8, (yTop + yBot) / 2, fx - 0.4, yBot - 1);
    ctx.stroke();
  }
}

// A limb with volume: dark core stroke plus a lit edge.
export function limb(ctx, x1, y1, x2, y2, w, col) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = shade(col, -20);
  ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = shade(col, 10);
  ctx.lineWidth = w * 0.45;
  ctx.beginPath();
  ctx.moveTo(x1 - w * 0.16, y1 - w * 0.16);
  ctx.lineTo(x2 - w * 0.16, y2 - w * 0.16);
  ctx.stroke();
}

// A hand.
export function hand(ctx, x, y, r, skin) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.2, x, y, r * 1.2);
  g.addColorStop(0, shade(skin, 16));
  g.addColorStop(1, shade(skin, -18));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}

// Head: oval skull, radial skin shading, hair with its own light.
// facing: 0 front, -1 left, 1 right, 2 back.
export function head(ctx, x, y, r, skin, hair, facing = 0) {
  const rx = r * 0.88, ry = r * 1.08;
  const g = ctx.createRadialGradient(x - rx * 0.35, y - ry * 0.4, r * 0.25, x, y + ry * 0.1, r * 1.5);
  g.addColorStop(0, shade(skin, 20));
  g.addColorStop(0.55, skin);
  g.addColorStop(1, shade(skin, -30));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(24,14,8,.25)'; ctx.lineWidth = 0.6; ctx.stroke();

  if (facing === 2) {
    const hg = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.4, r * 0.2, x, y, r * 1.3);
    hg.addColorStop(0, shade(hair, 24));
    hg.addColorStop(1, shade(hair, -14));
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    return;
  }

  const off = facing * rx * 0.2;
  const hg = ctx.createLinearGradient(x - rx, 0, x + rx, 0);
  hg.addColorStop(0, shade(hair, 22));
  hg.addColorStop(0.5, hair);
  hg.addColorStop(1, shade(hair, -18));
  ctx.fillStyle = hg;
  // crown
  ctx.beginPath();
  ctx.ellipse(x - off * 0.3, y - ry * 0.30, rx * 1.03, ry * 0.80, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // side masses down toward the nape (1499 hair is not short)
  ctx.beginPath();
  ctx.ellipse(x - rx * 0.88 - off * 0.25, y + ry * 0.05, rx * 0.26, ry * 0.52, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + rx * 0.88 - off * 0.25, y + ry * 0.05, rx * 0.26, ry * 0.52, -0.15, 0, Math.PI * 2);
  ctx.fill();
}

// Eyes with a brow shadow — the difference between a face and two dots.
export function eyes(ctx, x, y, r, facing = 0) {
  ctx.fillStyle = 'rgba(24,14,8,.20)';                       // brow shadow band
  ctx.fillRect(x - r * 0.55 + facing * r * 0.2, y - r * 0.12, r * 1.1, r * 0.18);
  ctx.fillStyle = '#241a12';
  const ew = Math.max(0.9, r * 0.17), eh = Math.max(0.9, r * 0.22);
  if (facing === 0) {
    ctx.fillRect(x - r * 0.42, y + r * 0.04, ew, eh);
    ctx.fillRect(x + r * 0.25, y + r * 0.04, ew, eh);
  } else {
    ctx.fillRect(x + facing * r * 0.42 - ew / 2, y + r * 0.04, ew * 1.1, eh);
    ctx.fillRect(x + facing * r * 0.02 - ew / 2, y + r * 0.04, ew * 0.9, eh);
  }
}
