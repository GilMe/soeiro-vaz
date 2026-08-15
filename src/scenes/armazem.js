// scenes/armazem.js — O Armazém. Head office, warehouse, and grave of the
// Companhia Real da Malagueta, which is not royal and is not a company.
// Eleven tons of the wrong pepper, and a signboard better made than the shed.

import { fill, vgrad, speckle, text, shade, rnd } from '../art.js';
import { vol, folds, limb, hand, head, eyes } from '../figure.js';
import { SONG_ARMAZEM } from '../audio.js';

// O Sota: fifty-five men came back from India, and this is what one of them
// looks like. Gaunt, kerchiefed, patient. He is leaning on your sacks and
// he knows exactly what is in them.
function drawSota(ctx, t) {
  const x = 76, y = 172, HT = 50;
  const chew = Math.sin(t * 1.3) * 0.5;              // gums, working
  const headR = HT * 0.088, neckY = y - HT + headR * 2.6;
  ctx.fillStyle = 'rgba(10,8,6,.35)';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 8.5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  // legs: bowed, sea-legs on land
  limb(ctx, x - 2, y - HT * 0.3, x - 6, y, 3, '#2c2c30');
  limb(ctx, x + 2, y - HT * 0.3, x + 6, y, 3, '#2c2c30');
  fill(ctx, x - 8, y - 1.6, 4.6, 1.8, '#17140f');
  fill(ctx, x + 3.4, y - 1.6, 4.6, 1.8, '#17140f');
  // faded sea jacket, too big now
  vol(ctx, [[x - 6, neckY], [x + 6, neckY],
            [x + 8, y - HT * 0.26], [x - 8, y - HT * 0.26]], '#3c4a58');
  folds(ctx, x, neckY + 4, y - HT * 0.28, 3);
  fill(ctx, x - 6, neckY + 3, 12, 1.4, 'rgba(220,230,240,.16)');
  // arms folded low, one hand tapping a sack
  limb(ctx, x - 6, neckY + HT * 0.14, x - 13, neckY + HT * 0.26 + chew, 2.2, '#3c4a58');
  hand(ctx, x - 13, neckY + HT * 0.27 + chew, 1.4, '#8a6845');
  limb(ctx, x + 6, neckY + HT * 0.14, x + 1, y - HT * 0.42, 2.2, '#3c4a58');
  // head: hollow-cheeked, under the red kerchief
  const hy = y - HT + headR * 1.15;
  head(ctx, x, hy, headR, '#8a6845', '#4a3626', 0);
  fill(ctx, x - headR * 0.75, hy + headR * 0.15, headR * 0.5, headR * 0.5, 'rgba(20,12,8,.30)');
  fill(ctx, x + headR * 0.25, hy + headR * 0.15, headR * 0.5, headR * 0.5, 'rgba(20,12,8,.30)');
  ctx.fillStyle = '#7d2c24';                          // kerchief over everything
  ctx.beginPath(); ctx.ellipse(x, hy - headR * 0.28, headR * 1.0, headR * 0.82, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = shade('#7d2c24', -14);
  ctx.beginPath(); ctx.ellipse(x + headR * 1.0, hy - headR * 0.35, headR * 0.42, headR * 0.3, 0.5, 0, Math.PI * 2); ctx.fill();
  // jaw, working on nothing
  fill(ctx, x - headR * 0.35, hy + headR * 0.55 + chew * 0.6, headR * 0.7, headR * 0.28, '#7d5c3e');
  eyes(ctx, x, hy, headR, 0);
}

export const armazem = {
  id: 'armazem',
  name: 'O Armazém',
  image: 'assets/armazem.png',
  music: SONG_ARMAZEM,
  walk: { top: 142, bottom: 194, left: 30, right: 290 },
  start: { x: 172, y: 168 },

  drawLayer(ctx, t, game, y0, y1) {
    if (game.flags.acto2Fim && !game.flags.acto3Fim && y0 <= 172 && 172 < y1)
      drawSota(ctx, t);
  },

  // Runs after the background (painted or procedural) — letters the blank
  // signboard, and, once the rebrand is under way, the stencilled lies.
  decorate(ctx, game) {
    ctx.textAlign = 'center';
    text(ctx, 'COMPANHIA REAL', 189, 13, '#4a3418', 'bold 9px "Courier New", monospace');
    text(ctx, 'DA MALAGUETA', 189, 25, '#4a3418', 'bold 9px "Courier New", monospace');
    if (game && game.flags.sacosProntos) {
      // brush marks on individual sacks — big enough to read, rough enough
      // to look painted in pitch by a nervous man
      ctx.textAlign = 'center';
      for (const [sx, sy, rot] of [[52, 122, -0.12], [148, 110, 0.08], [246, 124, -0.07], [303, 114, 0.1]]) {
        ctx.save();
        ctx.translate(sx, sy); ctx.rotate(rot);
        fill(ctx, -17, -5.5, 34, 11, 'rgba(232,220,190,.85)');
        fill(ctx, -17, -5.5, 34, 1.2, 'rgba(120,100,70,.4)');
        fill(ctx, -17, 4.3, 34, 1.2, 'rgba(120,100,70,.4)');
        text(ctx, 'CALECUT', 0, -3.5, '#241408', 'bold 7px "Courier New", monospace');
        ctx.restore();
      }
    }
    ctx.textAlign = 'left';
  },

  // Procedural fallback if the painting hasn't loaded: a brown shed, honestly.
  paint(ctx) {
    vgrad(ctx, 0, 0, 320, 200, [[0, '#2e2214'], [0.5, '#4a3720'], [1, '#5f4a2c']]);
    // plank walls with light through the gaps
    const r = rnd(7);
    for (let x = 0; x < 320; x += 9) {
      fill(ctx, x, 0, 8, 150, x % 18 ? '#43311c' : '#4c3820');
      if (r() > 0.7) fill(ctx, x + 8, 10, 1, 130, 'rgba(200,220,240,.25)');
    }
    // sacks, heaped
    for (let i = 0; i < 60; i++) {
      const sx = (r() * 300) | 0, sy = 60 + ((r() * 80) | 0);
      if (sx > 130 && sx < 230 && sy > 100) continue;          // keep the door clear
      ctx.fillStyle = r() > .5 ? '#6b5433' : '#7d6540';
      ctx.beginPath(); ctx.ellipse(sx, sy, 11, 6, 0, 0, Math.PI * 2); ctx.fill();
    }
    fill(ctx, 190, 70, 26, 44, '#3a2c18');                     // the back door
    fill(ctx, 134, 6, 112, 38, '#8a7146');                     // the board
    fill(ctx, 136, 8, 108, 34, '#a3885a');
    vgrad(ctx, 0, 150, 320, 50, [[0, '#5f4a2c'], [1, '#3d2f1c']]);
    speckle(ctx, 0, 150, 320, 50, ['#6f5836', '#33271666'], 0.08, 13);
  },

  hotspots: [
    { id: 'tabuleta', x: 132, y: 4, w: 116, h: 42, name: 'a tabuleta',
      olhar: ['COMPANHIA REAL DA MALAGUETA. Não é real e não é uma companhia. És tu e um barracão. A tabuleta custou mais do que a renda do barracão.',
              'COMPANHIA REAL DA MALAGUETA. It is not royal and it is not a company. It is you and a shed. The signboard cost more than the rent on the shed.'] },

    { id: 'portaBeco', x: 190, y: 68, w: 28, h: 48, name: 'a porta para o beco',
      to: 'beco', at: { x: 219, y: 132, wx: 200, wy: 165 },
      olhar: ['A porta range para quem entra e range para quem sai. Range mais para quem sai.',
              'The door creaks at whoever comes in and creaks at whoever leaves. It creaks more at whoever leaves.'] },

    { id: 'sota', x: 58, y: 118, w: 36, h: 58, name: 'o Sota',
      when: f => f.acto2Fim && !f.acto3Fim },

    // Barrels first: they sit inside the right-hand sack pile's rectangle,
    // and first match wins.
    { id: 'barris', x: 274, y: 134, w: 46, h: 52, name: 'os barris',
      olhar: ['Barris para a malagueta que ias vender a granel. O "a granel" era a parte do plano de que mais gostavas. Atrás deles, o pez de calafate.',
              'Barrels for the malagueta you were going to sell in bulk. The "in bulk" was your favourite part of the plan. Behind them, the caulker\'s pitch.'] },

    { id: 'sacos', x: 0, y: 34, w: 132, h: 132, name: 'a malagueta' },
    { id: 'sacos', x: 228, y: 40, w: 92, h: 92, name: 'a malagueta' },
    { id: 'sacos', x: 132, y: 92, w: 58, h: 40, name: 'a malagueta' },
  ],
};
