// menu.js — the title menu and the in-game menu, drawn as a proper SCI
// dialog: light grey window, double bevel, black surround, raised buttons
// that press when the pointer is on them.

import { fill, text, bevel, sciWindow } from './art.js';
import { W, H } from './vga.js';

const BTN_H = 15, BTN_GAP = 4, PAD = 12;

export class Menu {
  constructor() { this.open = false; this.items = []; this.title = ''; this.rects = []; this.hover = null; }

  // opts.style 'window' (default) draws the SCI dialog; 'strip' draws a slim
  // row of text buttons over the artwork — for the title screen, where the
  // painting is the point. opts.y pins the vertical position.
  show(title, items, opts = {}) {
    this.open = true; this.title = title; this.items = items;
    this.y = opts.y ?? null; this.scrim = opts.scrim ?? 0.5;
    this.style = opts.style ?? 'window';
  }
  hide() { this.open = false; this.hover = null; }

  move(x, y) {
    this.hover = null;
    for (const r of this.rects)
      if (!r.disabled && x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) this.hover = r.id;
  }

  hit(x, y) {
    for (const r of this.rects)
      if (!r.disabled && x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return r.id;
    return null;
  }

  // The title strip: dark plates, gold text, the painting left alone.
  _strip(ctx) {
    const y = this.y ?? 176, bh = 16;
    ctx.font = '8px "Courier New", monospace';
    const pads = 16, gap = 6;
    const widths = this.items.map(it => ctx.measureText(it.label).width + pads);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (this.items.length - 1);
    let x = (W - total) / 2;
    this.rects = [];
    this.items.forEach((it, i) => {
      const w = widths[i];
      const on = this.hover === it.id;
      fill(ctx, x, y, w, bh, on ? 'rgba(30,24,10,.85)' : 'rgba(8,6,4,.66)');
      fill(ctx, x, y, w, 1, on ? 'rgba(255,228,150,.8)' : 'rgba(255,228,150,.28)');
      fill(ctx, x, y + bh - 1, w, 1, 'rgba(0,0,0,.5)');
      ctx.textAlign = 'center';
      text(ctx, it.label, x + w / 2, y + 4,
           it.disabled ? '#6e685c' : on ? '#ffe9a8' : '#d8cba0',
           (on ? 'bold ' : '') + '8px "Courier New", monospace');
      ctx.textAlign = 'left';
      this.rects.push({ x, y, w, h: bh, id: it.id, disabled: it.disabled });
      x += w + gap;
    });
  }

  draw(ctx) {
    if (!this.open) return;
    if (this.style === 'strip') { this._strip(ctx); return; }
    fill(ctx, 0, 0, W, H, `rgba(8,10,16,${this.scrim})`);

    const head = this.title ? 22 : 6;
    const bw = 148;
    const bh = PAD + head + this.items.length * (BTN_H + BTN_GAP) - BTN_GAP + PAD;
    const bx = (W - bw) / 2 | 0;
    const by = Math.min(this.y != null ? this.y : (H - bh) / 2 | 0, H - bh - 8);

    sciWindow(ctx, bx, by, bw, bh);

    if (this.title) {
      ctx.textAlign = 'center';
      text(ctx, this.title, W / 2, by + 8, '#2b2721', 'bold 9px "Courier New", monospace');
      ctx.textAlign = 'left';
      // the double rule Sierra put under every dialog title
      fill(ctx, bx + 10, by + 20, bw - 20, 1, '#a29c8c');
      fill(ctx, bx + 10, by + 21, bw - 20, 1, '#f0ebdd');
    }

    this.rects = [];
    this.items.forEach((it, i) => {
      const iy = by + PAD + head + i * (BTN_H + BTN_GAP) - (this.title ? 4 : 0);
      const on = this.hover === it.id;
      if (it.disabled) {
        bevel(ctx, bx + 14, iy, bw - 28, BTN_H, '#cfc9b9', false);
        ctx.textAlign = 'center';
        text(ctx, it.label, W / 2, iy + 4, '#a8a292', '8px "Courier New", monospace');
        ctx.textAlign = 'left';
      } else {
        bevel(ctx, bx + 14, iy, bw - 28, BTN_H, on ? '#c4b78c' : '#d8d2c2', on);
        ctx.textAlign = 'center';
        text(ctx, it.label, W / 2 + (on ? 0.6 : 0), iy + 4 + (on ? 0.6 : 0),
             '#2b2721', (on ? 'bold ' : '') + '8px "Courier New", monospace');
        ctx.textAlign = 'left';
      }
      this.rects.push({ x: bx + 14, y: iy, w: bw - 28, h: BTN_H, id: it.id, disabled: it.disabled });
    });
  }
}
