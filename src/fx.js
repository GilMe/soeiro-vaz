// fx.js — shared visual machinery: the SCI pixel dissolve and the image cache.

import { W, H } from './vga.js';

// --- 4x4 pixel dissolve ------------------------------------------------------
// Cells black out in a fixed shuffled order; replaying the same order for the
// fade-in is what makes it read as a dissolve rather than a fade.
const CW = 4, COLS = W / CW, ROWS = H / CW;
const CELLS = new Uint16Array(COLS * ROWS);
for (let i = 0; i < CELLS.length; i++) CELLS[i] = i;
for (let i = CELLS.length - 1; i > 0; i--) {
  const j = (Math.random() * (i + 1)) | 0;
  const t = CELLS[i]; CELLS[i] = CELLS[j]; CELLS[j] = t;
}

export function drawDissolve(ctx, frac) {
  const n = Math.floor(CELLS.length * Math.max(0, Math.min(1, frac)));
  ctx.fillStyle = '#000';
  for (let i = 0; i < n; i++) {
    const c = CELLS[i];
    ctx.fillRect((c % COLS) * CW, ((c / COLS) | 0) * CW, CW, CW);
  }
}

// --- image cache -------------------------------------------------------------
// loadImage('assets/x.png', onReady) -> { img, ready }. Cached forever; the
// callback fires once when a not-yet-ready image finishes, so callers can
// repaint. Missing files simply never become ready — callers keep their
// procedural fallback and nothing breaks.
const CACHE = new Map();

export function loadImage(src, onReady) {
  let rec = CACHE.get(src);
  if (!rec) {
    rec = { img: new Image(), ready: false, waiters: [] };
    rec.img.onload = () => {
      rec.ready = true;
      for (const cb of rec.waiters) cb();
      rec.waiters.length = 0;
    };
    rec.img.src = src;
    CACHE.set(src, rec);
  }
  if (!rec.ready && onReady) rec.waiters.push(onReady);
  return rec;
}
