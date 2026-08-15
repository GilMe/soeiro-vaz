// art.js — painting helpers. Everything here draws at full colour into the
// 320x200 buffer; vga.js is what makes it look like 1991, not this file.
// Rule of thumb from actual Sierra backgrounds: soft airbrushed gradients,
// then break them up with stipple. Never flat fills over large areas.

export function rnd(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

export function fill(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

export function vgrad(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  for (const [p, c] of stops) g.addColorStop(p, c);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}

export function hgrad(ctx, x, y, w, h, stops) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  for (const [p, c] of stops) g.addColorStop(p, c);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}

// Random single-pixel noise. The dither pass loves this; it kills banding.
export function speckle(ctx, x, y, w, h, cols, dens, seed) {
  const r = rnd(seed), n = Math.floor(w * h * dens);
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = cols[(r() * cols.length) | 0];
    ctx.fillRect(x + ((r() * w) | 0), y + ((r() * h) | 0), 1, 1);
  }
}

// Granite — Porto is built out of this, so it earns its own function.
export function granite(ctx, x, y, w, h, seed, base = '#6d6f71') {
  vgrad(ctx, x, y, w, h, [[0, shade(base, 12)], [1, shade(base, -14)]]);
  speckle(ctx, x, y, w, h, [shade(base, 26), shade(base, -22), shade(base, 6)], 0.30, seed);
}

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map(v => Math.max(0, Math.min(255, v + amt)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

// Portuguese roof: half-cylinder terracotta tiles in rows.
export function roofTiles(ctx, x, y, w, h, seed) {
  const r = rnd(seed);
  vgrad(ctx, x, y, w, h, [[0, '#a8542f'], [1, '#6d3520']]);
  for (let cx = x; cx < x + w; cx += 3) {
    const t = 0.7 + r() * 0.6;
    ctx.fillStyle = `rgba(255,190,140,${0.18 * t})`;
    ctx.fillRect(cx, y, 1, h);
    ctx.fillStyle = 'rgba(40,15,10,0.30)';
    ctx.fillRect(cx + 2, y, 1, h);
  }
  speckle(ctx, x, y, w, h, ['#5a2c19', '#c96a3c'], 0.12, seed + 7);
}

// A shuttered window with a stone surround. lit=warm interior glow.
export function window9(ctx, x, y, w, h, lit, seed) {
  fill(ctx, x - 1, y - 1, w + 2, h + 2, '#8e8b83');          // stone frame
  if (lit) {
    vgrad(ctx, x, y, w, h, [[0, '#ffd98a'], [1, '#c98c33']]);
  } else {
    vgrad(ctx, x, y, w, h, [[0, '#2a3038'], [1, '#151a20']]);
  }
  // shutters
  const r = rnd(seed);
  if (r() > 0.45) {
    const sw = Math.max(2, (w / 2) | 0);
    vgrad(ctx, x, y, sw, h, [[0, '#3f6b4a'], [1, '#27462f']]);
    for (let sy = y + 1; sy < y + h; sy += 2) fill(ctx, x, sy, sw, 1, 'rgba(0,0,0,.25)');
  }
  fill(ctx, x + ((w / 2) | 0), y, 1, h, 'rgba(0,0,0,.45)');   // mullion
  fill(ctx, x, y + ((h / 2) | 0), w, 1, 'rgba(0,0,0,.35)');
}

// Calçada portuguesa — the black-and-white mosaic pavement, in perspective.
export function calcada(ctx, x, y, w, h, seed) {
  const r = rnd(seed);
  vgrad(ctx, x, y, w, h, [[0, '#8a867c'], [1, '#b9b5a9']]);
  for (let py = 0; py < h; py++) {
    const persp = 1 + (py / h) * 2.4;                    // stones grow toward camera
    const step = Math.max(2, persp | 0) + 1;
    for (let px = -step; px < w + step; px += step) {
      const j = ((r() * step) | 0) - (step >> 1);
      const v = r();
      ctx.fillStyle = v > 0.78 ? 'rgba(30,28,26,.55)'
                    : v > 0.62 ? 'rgba(255,252,240,.40)'
                    : 'rgba(0,0,0,.10)';
      ctx.fillRect(x + px + j, y + py, Math.max(1, step - 1), 1);
    }
  }
}

// --- SCI dialog chrome -------------------------------------------------------
// Sierra's windows: light grey face, double bevel, black surround. Buttons
// are raised until pressed.
export function bevel(ctx, x, y, w, h, face = '#d8d2c2', pressed = false) {
  fill(ctx, x, y, w, h, face);
  const lt  = pressed ? '#6e6858' : '#f6f1e4';
  const rb  = pressed ? '#f6f1e4' : '#6e6858';
  const lt2 = pressed ? '#aaa494' : '#e8e2d2';
  const rb2 = pressed ? '#e8e2d2' : '#a29c8c';
  fill(ctx, x, y, w, 1, lt);           fill(ctx, x, y, 1, h, lt);
  fill(ctx, x, y + h - 1, w, 1, rb);   fill(ctx, x + w - 1, y, 1, h, rb);
  fill(ctx, x + 1, y + 1, w - 2, 1, lt2);       fill(ctx, x + 1, y + 1, 1, h - 2, lt2);
  fill(ctx, x + 1, y + h - 2, w - 2, 1, rb2);   fill(ctx, x + w - 2, y + 1, 1, h - 2, rb2);
}

export function sciWindow(ctx, x, y, w, h) {
  fill(ctx, x - 2, y - 2, w + 4, h + 4, '#14100c');    // black surround
  fill(ctx, x + 2, y + h + 2, w + 2, 2, 'rgba(0,0,0,.35)');  // drop shadow
  fill(ctx, x + w + 2, y + 2, 2, h + 2, 'rgba(0,0,0,.35)');
  bevel(ctx, x, y, w, h, '#d8d2c2', false);
}

// Text in the chunky bordered box Sierra used for everything.
export function panel(ctx, x, y, w, h) {
  fill(ctx, x, y, w, h, '#b9b5a9');
  fill(ctx, x, y, w, 1, '#efece2'); fill(ctx, x, y, 1, h, '#efece2');
  fill(ctx, x, y + h - 1, w, 1, '#55524b'); fill(ctx, x + w - 1, y, 1, h, '#55524b');
  // Dark interior: the text on top is light, so a mid-grey field kills contrast.
  fill(ctx, x + 2, y + 2, w - 4, h - 4, '#33323a');
  fill(ctx, x + 2, y + 2, w - 4, 1, '#1e1d23');
  fill(ctx, x + 2, y + h - 3, w - 4, 1, '#55524b');
}

export function text(ctx, str, x, y, col = '#000', font = '8px "Courier New", monospace') {
  ctx.font = font; ctx.textBaseline = 'top'; ctx.fillStyle = col;
  ctx.fillText(str, x, y);
}

// Word-wrap to a pixel width, returns lines.
export function wrap(ctx, str, maxw, font = '8px "Courier New", monospace') {
  ctx.font = font;
  const words = str.split(' '), lines = []; let cur = '';
  for (const wd of words) {
    const t = cur ? cur + ' ' + wd : wd;
    if (ctx.measureText(t).width > maxw && cur) { lines.push(cur); cur = wd; }
    else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}
