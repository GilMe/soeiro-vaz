// ui.js — the SCI-era interface: a verb bar that drops down when you shove the
// mouse at the top of the screen, a chunky bordered message window, and a
// score counter that ticks up with a chime.

import { fill, panel, text, wrap, bevel, sciWindow } from './art.js';
import { W, H } from './vga.js';

// --- pictorial icons ---------------------------------------------------------
// Each is drawn in a 12x12 box at scale s with real curves — the renderer is
// 3x, so proper silhouettes read cleanly. `col` is the body colour, `dark`
// the detail colour (they swap when a button is pressed).
export function icon(ctx, id, x, y, s, col, dark) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const stroke = (w, c) => { ctx.strokeStyle = c || col; ctx.lineWidth = w; ctx.stroke(); };
  switch (id) {
    case 'andar': {                                 // a figure mid-stride
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(5.8, 2.1, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(5.6, 3.8); ctx.lineTo(6.3, 7.1); stroke(1.8);
      ctx.beginPath(); ctx.moveTo(6.3, 7.1); ctx.lineTo(3.3, 10.8); stroke(1.7);
      ctx.beginPath(); ctx.moveTo(6.3, 7.1); ctx.lineTo(8.9, 9.4);
      ctx.lineTo(9.4, 10.9); stroke(1.7);
      ctx.beginPath(); ctx.moveTo(5.7, 4.5); ctx.lineTo(8.6, 6.6); stroke(1.4);
      ctx.beginPath(); ctx.moveTo(5.7, 4.7); ctx.lineTo(3.1, 6.0); stroke(1.4);
      break;
    }
    case 'olhar': {                                 // an eye, almond and iris
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(0.8, 6);
      ctx.quadraticCurveTo(6, 1.0, 11.2, 6);
      ctx.quadraticCurveTo(6, 11.0, 0.8, 6);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(6, 6, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(6.8, 5.2, 0.8, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'pegar': {                                 // an open hand
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(6.1, 8.3, 3.1, 2.7, 0, 0, Math.PI * 2); ctx.fill();
      for (const [px1, py1, px2, py2] of [
        [4.1, 6.9, 3.0, 2.9], [5.5, 6.4, 5.1, 2.0],
        [7.0, 6.4, 7.2, 2.1], [8.3, 6.9, 9.2, 3.1]]) {
        ctx.beginPath(); ctx.moveTo(px1, py1); ctx.lineTo(px2, py2); stroke(1.5);
      }
      ctx.beginPath(); ctx.moveTo(3.4, 8.6); ctx.lineTo(1.2, 6.6); stroke(1.6);
      break;
    }
    case 'falar': {                                 // a speech bubble
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(2.6, 1.4); ctx.lineTo(9.4, 1.4);
      ctx.quadraticCurveTo(11.2, 1.4, 11.2, 3.2);
      ctx.lineTo(11.2, 6.0); ctx.quadraticCurveTo(11.2, 7.8, 9.4, 7.8);
      ctx.lineTo(6.6, 7.8); ctx.lineTo(3.9, 10.8); ctx.lineTo(4.4, 7.8);
      ctx.lineTo(2.6, 7.8); ctx.quadraticCurveTo(0.8, 7.8, 0.8, 6.0);
      ctx.lineTo(0.8, 3.2); ctx.quadraticCurveTo(0.8, 1.4, 2.6, 1.4);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = dark;
      for (const dx of [3.4, 6.0, 8.6]) {
        ctx.beginPath(); ctx.arc(dx, 4.6, 0.75, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'usar': {                                  // a key, bow west, teeth east
      ctx.beginPath(); ctx.arc(3.1, 6, 2.0, 0, Math.PI * 2); stroke(1.7);
      ctx.beginPath(); ctx.moveTo(5.1, 6); ctx.lineTo(11.0, 6); stroke(1.7);
      ctx.beginPath(); ctx.moveTo(8.7, 6); ctx.lineTo(8.7, 8.3); stroke(1.6);
      ctx.beginPath(); ctx.moveTo(10.8, 6); ctx.lineTo(10.8, 8.8); stroke(1.6);
      break;
    }
    case 'saco': {                                  // the drawstring bag
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(4.7, 3.6);
      ctx.quadraticCurveTo(1.0, 6.2, 1.8, 9.0);
      ctx.quadraticCurveTo(2.5, 11.2, 6, 11.2);
      ctx.quadraticCurveTo(9.5, 11.2, 10.2, 9.0);
      ctx.quadraticCurveTo(11.0, 6.2, 7.3, 3.6);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(4.4, 2.9); ctx.lineTo(7.6, 2.9); stroke(1.8);
      ctx.beginPath(); ctx.moveTo(3.9, 1.2); ctx.lineTo(5.3, 2.6); stroke(1.3);
      ctx.beginPath(); ctx.moveTo(8.1, 1.2); ctx.lineTo(6.7, 2.6); stroke(1.3);
      ctx.strokeStyle = dark;
      ctx.beginPath(); ctx.moveTo(4.5, 3.9); ctx.lineTo(7.5, 3.9); stroke(0.9, dark);
      break;
    }
    case 'menu': {                                  // a scroll between rollers
      ctx.fillStyle = col;
      fill(ctx, 2.5, 2.8, 7, 6.4, col);
      ctx.beginPath(); ctx.moveTo(1.2, 2.2); ctx.lineTo(10.8, 2.2); stroke(1.9);
      ctx.beginPath(); ctx.moveTo(1.2, 9.9); ctx.lineTo(10.8, 9.9); stroke(1.9);
      ctx.strokeStyle = dark;
      for (const dy of [4.6, 6.1, 7.6]) {
        ctx.beginPath(); ctx.moveTo(3.7, dy); ctx.lineTo(dy > 7 ? 6.6 : 8.3, dy); stroke(0.9, dark);
      }
      break;
    }
    case 'dica': {                                  // a candle: light for the lost
      ctx.fillStyle = col;
      fill(ctx, 4.6, 5.2, 2.8, 5.4, col);           // the candle
      fill(ctx, 3.6, 10.2, 4.8, 1.2, col);          // its dish
      ctx.beginPath();                              // the flame
      ctx.moveTo(6, 1.2);
      ctx.quadraticCurveTo(7.9, 3.4, 6, 4.6);
      ctx.quadraticCurveTo(4.1, 3.4, 6, 1.2);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = dark;
      ctx.beginPath(); ctx.arc(6, 3.5, 0.7, 0, Math.PI * 2); ctx.fill();
      break;
    }
  }
  ctx.restore();
}

// Icon with a dark outline — the in-scene cursor.
export function cursorIcon(ctx, id, cx, cy) {
  for (const [ox, oy] of [[-0.8, 0], [0.8, 0], [0, -0.8], [0, 0.8]])
    icon(ctx, id, cx - 5.4 + ox, cy - 5.4 + oy, 0.9, '#100c08', '#100c08');
  icon(ctx, id, cx - 5.4, cy - 5.4, 0.9, '#f6ecd2', '#2b2117');
}

export const VERBS = [
  { id: 'andar', label: 'ANDAR', gloss: 'walk to' },
  { id: 'olhar', label: 'OLHAR', gloss: 'look at' },
  { id: 'pegar', label: 'PEGAR', gloss: 'take' },
  { id: 'falar', label: 'FALAR', gloss: 'talk to' },
  { id: 'usar',  label: 'USAR',  gloss: 'use' },
];

const BAR_H = 26;
// icon-bar geometry: five verb buttons, then bag and scroll
const BTN_W = 24, BTN_H = 22, BTN_Y = 2, BTN_X0 = 4, BTN_GAP = 1;
const bx_ = i => BTN_X0 + i * (BTN_W + BTN_GAP);
const SACO_X = bx_(5) + 5, MENU_X = SACO_X + BTN_W + BTN_GAP;
const DICA_X = MENU_X + BTN_W + BTN_GAP;

export class UI {
  constructor() {
    this.verb = 'andar';
    this.msg = null;          // { pt, en, speaker }
    this.gloss = false;       // Tab toggles the English crib
    this.invOpen = false;
    this.hover = '';
  }

  barHeight() { return BAR_H; }

  // --- input ---------------------------------------------------------------
  // Returns true if the UI consumed the click. The bar is permanent: clicks
  // on it are UI, clicks below it belong to the scene.
  click(x, y, game) {
    if (this.msg) { this.msg = null; return true; }
    if (y < BAR_H) {
      for (let i = 0; i < VERBS.length; i++) {
        const bx = bx_(i);
        if (x >= bx && x < bx + BTN_W) { this.verb = VERBS[i].id; game.audio.sfx('step'); return true; }
      }
      if (x >= SACO_X && x < SACO_X + BTN_W) { this.invOpen = !this.invOpen; return true; }
      if (x >= MENU_X && x < MENU_X + BTN_W) { this.menuRequested = true; return true; }
      if (x >= DICA_X && x < DICA_X + BTN_W) { this.hintRequested = true; return true; }
      return true;
    }
    return false;
  }

  move() {}

  // Right-click cycles the verb — how anyone actually played an SCI game.
  cycleVerb() {
    const i = VERBS.findIndex(v => v.id === this.verb);
    this.verb = VERBS[(i + 1) % VERBS.length].id;
  }

  say(pt, en, speaker) { this.msg = { pt, en, speaker: speaker || null }; }

  // --- drawing -------------------------------------------------------------
  draw(ctx, game) {
    this._bar(ctx, game);
    this._status(ctx, game);
    if (this.invOpen) this._inv(ctx, game);
    if (this.msg) this._msg(ctx, game);
  }

  _status(ctx, game) {
    // Hovered-object label, centred just under the permanent bar.
    if (this.hover) {
      const label = this.hover;
      ctx.font = '8px "Courier New", monospace';
      const w = ctx.measureText(label).width + 8;
      fill(ctx, (W - w) / 2 | 0, BAR_H + 2, w, 11, 'rgba(0,0,0,.55)');
      text(ctx, label, ((W - w) / 2 | 0) + 4, BAR_H + 4, '#ffe9a8');
    }
    // The current verb, anchored bottom-left where the eyes live during play.
    const v = VERBS.find(x => x.id === this.verb);
    fill(ctx, 2, H - 16, 58, 14, 'rgba(8,6,4,.6)');
    fill(ctx, 2, H - 16, 58, 1, 'rgba(255,232,170,.25)');
    icon(ctx, v.id, 4, H - 15, 1, '#f0e6c8', '#2b2117');
    text(ctx, v.label, 18, H - 12, '#ffe9a8', '7px "Courier New", monospace');
    // One-time tip until the player finds the right mouse button.
    if (!game.flags.usouVerbo) {
      const tip = 'botao direito muda a accao';
      ctx.font = '7px "Courier New", monospace';
      const w = ctx.measureText(tip).width + 8;
      fill(ctx, W - w - 2, H - 12, w, 10, 'rgba(0,0,0,.55)');
      text(ctx, tip, W - w + 2, H - 11, '#a8c894', '7px "Courier New", monospace');
    }
  }

  _bar(ctx, game) {
    // the bar itself: SCI chrome
    bevel(ctx, -2, -2, W + 4, BAR_H + 2, '#c9c3b2', false);
    fill(ctx, 0, BAR_H - 1, W, 1, '#3a362e');
    // verb buttons, pictorial
    for (let i = 0; i < VERBS.length; i++) {
      const v = VERBS[i], bx = bx_(i), on = v.id === this.verb;
      bevel(ctx, bx, BTN_Y, BTN_W, BTN_H, on ? '#b3a67e' : '#d8d2c2', on);
      icon(ctx, v.id, bx + 6 + (on ? 0.6 : 0), BTN_Y + 5 + (on ? 0.6 : 0), 1,
           on ? '#2b2117' : '#4a4234', on ? '#f0e6c8' : '#d8d2c2');
    }
    // bag and scroll
    bevel(ctx, SACO_X, BTN_Y, BTN_W, BTN_H, this.invOpen ? '#b3a67e' : '#d8d2c2', this.invOpen);
    icon(ctx, 'saco', SACO_X + 6, BTN_Y + 5, 1, '#4a4234', '#d8d2c2');
    bevel(ctx, MENU_X, BTN_Y, BTN_W, BTN_H, '#d8d2c2', false);
    icon(ctx, 'menu', MENU_X + 6, BTN_Y + 5, 1, '#4a4234', '#d8d2c2');
    bevel(ctx, DICA_X, BTN_Y, BTN_W, BTN_H, '#d8d2c2', false);
    icon(ctx, 'dica', DICA_X + 6, BTN_Y + 5, 1, '#4a4234', '#f0e6c8');
    // score and debt in recessed fields, right — clear of the button row
    bevel(ctx, W - 106, 4, 50, 18, '#c2bcac', true);
    ctx.textAlign = 'center';
    text(ctx, 'PONTOS', W - 81, 6, '#6e6858', '6px "Courier New", monospace');
    text(ctx, String(game.score), W - 81, 13, '#2b2721', '8px "Courier New", monospace');
    bevel(ctx, W - 54, 4, 50, 18, '#c2bcac', true);
    text(ctx, 'DÍVIDA', W - 29, 6, '#6e6858', '6px "Courier New", monospace');
    text(ctx, String(game.debt), W - 29, 13, '#8a2f24', '8px "Courier New", monospace');
    ctx.textAlign = 'left';
  }

  _inv(ctx, game) {
    const bw = 176, bh = Math.max(76, 52 + game.inv.length * 11);
    const bx = (W - bw) / 2 | 0, by = 38;
    sciWindow(ctx, bx, by, bw, bh);
    ctx.textAlign = 'center';
    text(ctx, 'O TEU SACO', bx + bw / 2, by + 7, '#2b2721', 'bold 8px "Courier New", monospace');
    ctx.textAlign = 'left';
    fill(ctx, bx + 10, by + 18, bw - 20, 1, '#a29c8c');
    fill(ctx, bx + 10, by + 19, bw - 20, 1, '#f0ebdd');
    if (!game.inv.length) {
      text(ctx, 'Vazio. Como a tua barriga.', bx + 12, by + 28, '#4a4438', '7px "Courier New", monospace');
      if (this.gloss) text(ctx, 'Empty. Like your stomach.', bx + 12, by + 38, '#4a6b3a', '7px "Courier New", monospace');
    } else {
      game.inv.forEach((it, i) => {
        icon(ctx, 'saco', bx + 10, by + 24 + i * 11, 0.6, '#6e6146', '#d8d2c2');
        text(ctx, it.pt, bx + 22, by + 26 + i * 11, '#2b2721', '7px "Courier New", monospace');
        if (this.gloss) text(ctx, it.en, bx + 98, by + 26 + i * 11, '#4a6b3a', '7px "Courier New", monospace');
      });
    }
    ctx.textAlign = 'center';
    text(ctx, '· clica para fechar ·', bx + bw / 2, by + bh - 11, '#8e887a', '6px "Courier New", monospace');
    ctx.textAlign = 'left';
  }

  _msg(ctx, game) {
    const m = this.msg;
    const bw = 232, bx = (W - bw) / 2 | 0;
    const inner = bw - 16;
    const lines = wrap(ctx, m.pt, inner, '8px "Courier New", monospace');
    // English gets the same 8px body size as the Portuguese — 7px was unreadable
    // once the frame is quantised and scaled.
    // A message with no English is a message that stays Portuguese — hints.
    const glossLines = (this.gloss && m.en) ? wrap(ctx, m.en, inner, '8px "Courier New", monospace') : [];
    const bh = 16 + lines.length * 10 + (glossLines.length ? 7 + glossLines.length * 10 : 0)
             + (m.speaker ? 11 : 0) + 12;
    const by = Math.max(26, (H - bh) / 2 - 24) | 0;
    panel(ctx, bx, by, bw, bh);
    let ty = by + 8;
    if (m.speaker) {
      text(ctx, m.speaker.toUpperCase(), bx + 8, ty, '#ffe9a8', '7px "Courier New", monospace');
      ty += 11;
    }
    for (const l of lines) { text(ctx, l, bx + 8, ty, '#fff8e0'); ty += 10; }
    if (glossLines.length) {
      // its own inset band, so the translation reads as a separate register
      fill(ctx, bx + 4, ty + 2, bw - 8, glossLines.length * 10 + 5, '#20242c');
      fill(ctx, bx + 4, ty + 2, bw - 8, 1, '#171a20');
      ty += 6;
      for (const l of glossLines) { text(ctx, l, bx + 8, ty, '#9fe07a'); ty += 10; }
    }
    if (m.en)
      text(ctx, this.gloss ? '[TAB] esconder' : '[TAB] traduzir',
           bx + bw - 84, by + bh - 12, '#cfcbbf', '7px "Courier New", monospace');
    else
      text(ctx, 'só em português', bx + bw - 78, by + bh - 12, '#b3a67e', '7px "Courier New", monospace');
  }

  // The pointer changes shape with the verb, the way SCI did.
  // The pointer is the verb, drawn with the same icon set as the bar.
  cursor(ctx, x, y) {
    cursorIcon(ctx, this.verb, x, y);
  }
}
