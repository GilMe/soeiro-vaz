// scenes/taberna.js — A Taberna do Bicudo. Where buyers are found, where
// Diogo holds court, and where every single patron remembers exactly what
// Soeiro said about Vasco da Gama, every single day, forever.

import { fill, vgrad, speckle, granite, text, rnd, shade } from '../art.js';
import { vol, folds, limb, hand, head, eyes } from '../figure.js';
import { SONG_TABERNA } from '../audio.js';

// A seated patron: hunched back, mug, opinions.
function patron(ctx, x, y, coat, t, ph) {
  const sway = Math.sin(t * 0.9 + ph) * 0.6;
  ctx.fillStyle = 'rgba(10,8,6,.35)';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 8, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  vol(ctx, [[x - 5.5, y - 14 + sway], [x + 5.5, y - 15 + sway], [x + 7, y], [x - 7, y]], coat);
  folds(ctx, x, y - 12 + sway, y - 1, 2);
  head(ctx, x, y - 18 + sway, 4, '#8a6845', '#241a12', 2);
}

// O Bicudo, behind his counter: a fixture, like the barrels, but sterner.
function drawBicudo(ctx, t) {
  const x = 40, y = 118;
  const wipe = Math.sin(t * 1.8) * 1.5;
  // torso above the counter only — the counter owns the rest of him
  vol(ctx, [[x - 6, y - 24], [x + 6, y - 24], [x + 8, y - 6], [x - 8, y - 6]], '#4a3a2c');
  folds(ctx, x, y - 21, y - 8, 2);
  fill(ctx, x - 7, y - 8, 14, 2.4, '#6b5433');       // apron top
  // one hand endlessly wiping the counter
  limb(ctx, x + 5, y - 18, x + 10 + wipe, y - 8, 2.4, '#4a3a2c');
  hand(ctx, x + 10.5 + wipe, y - 7.6, 1.5, '#a67c52');
  const hy = y - 29;
  head(ctx, x, hy, 4.4, '#a67c52', '#3a2e20', 0);
  eyes(ctx, x, hy, 4.4, 0);
}

// Diogo again — same coat, same hat, new venue, same story.
function drawDiogoTaberna(ctx, t) {
  const x = 120, y = 168, HT = 48;
  const wave = Math.sin(t * 1.6) * 3;
  const headR = HT * 0.088, neckY = y - HT + headR * 2.6;
  ctx.fillStyle = 'rgba(10,8,6,.4)';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 8, 2.4, 0, 0, Math.PI * 2); ctx.fill();
  limb(ctx, x - 2, y - HT * 0.3, x - 4.5, y, 3, '#4a2f24');
  limb(ctx, x + 2, y - HT * 0.3, x + 4.5, y, 3, '#4a2f24');
  vol(ctx, [[x - 5.5, neckY], [x + 5.5, neckY],
            [x + 7, y - HT * 0.26], [x - 7, y - HT * 0.26]], '#7d4436');
  folds(ctx, x - 2.5, neckY + 3, y - HT * 0.28, 2);
  for (let i = 0; i < 4; i++) fill(ctx, x - 0.8, neckY + 3 + i * 4.6, 1.5, 1.5, '#c8ac5e');
  limb(ctx, x + 4.5, neckY + HT * 0.1, x + 12, neckY - HT * 0.05 - wave, 2.8, '#7d4436');
  hand(ctx, x + 12.6, neckY - HT * 0.06 - wave, 1.7, '#a67c52');
  const hy = y - HT + headR * 1.15;
  head(ctx, x, hy, headR, '#a67c52', '#3a2a1a', 0);
  vol(ctx, [[x - headR * 1.3, hy - headR * 1.15], [x + headR * 1.3, hy - headR * 1.15],
            [x + headR * 1.3, hy - headR * 0.62], [x - headR * 1.3, hy - headR * 0.62]], '#8a3f32');
  vol(ctx, [[x - headR * 0.7, hy - headR * 1.65], [x + headR * 0.7, hy - headR * 1.65],
            [x + headR * 0.7, hy - headR * 1.1], [x - headR * 0.7, hy - headR * 1.1]], '#8a3f32');
  eyes(ctx, x, hy, headR, 0);
}

// The Florentine agent: seated apart, dressed in money, ledger open.
function drawAgente(ctx, t) {
  const x = 262, y = 164;
  const pen = Math.sin(t * 2.2) * 0.8;
  ctx.fillStyle = 'rgba(10,8,6,.4)';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 8, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  // seated, crimson, fur-trimmed (allegedly)
  vol(ctx, [[x - 6, y - 16], [x + 6, y - 17], [x + 7.5, y], [x - 7.5, y]], '#5a2434');
  folds(ctx, x, y - 14, y - 2, 2);
  fill(ctx, x - 5.5, y - 16.5, 11, 1.8, '#2c1220');
  limb(ctx, x + 5, y - 12, x + 10, y - 7 + pen, 2.4, '#5a2434');
  hand(ctx, x + 10.4, y - 6.6 + pen, 1.4, '#b98d63');
  const hy = y - 21;
  head(ctx, x, hy, 4.4, '#b98d63', '#1c1410', -1);
  vol(ctx, [[x - 5.5, hy - 5.6], [x + 5.5, hy - 5.6], [x + 5.9, hy - 2.8], [x - 5.9, hy - 2.8]], '#3a1622');
  eyes(ctx, x, hy, 4.4, -1);
}

export const taberna = {
  id: 'taberna',
  name: 'A Taberna do Bicudo',
  image: 'assets/taberna-jogo.png',        // optional future painting (empty room)
  music: SONG_TABERNA,
  walk: { top: 142, bottom: 192, left: 20, right: 300 },
  start: { x: 48, y: 170 },

  paint(ctx) {
    // walls and beams
    vgrad(ctx, 0, 0, 320, 200, [[0, '#1d1610'], [0.4, '#3a2c1c'], [1, '#4a3826']]);
    granite(ctx, 0, 30, 320, 100, 17, '#4a3c2a');
    vgrad(ctx, 0, 30, 320, 100, [[0, 'rgba(15,10,6,.55)'], [1, 'rgba(15,10,6,.15)']]);
    for (let i = 0; i < 5; i++) fill(ctx, 0, 4 + i * 6, 320, 3.4, i % 2 ? '#2c2114' : '#241b10');
    // floor
    vgrad(ctx, 0, 130, 320, 70, [[0, '#57422a'], [1, '#33261682']]);
    for (let i = 0; i < 10; i++) fill(ctx, 0, 132 + i * 7, 320, 1, 'rgba(0,0,0,.25)');
    speckle(ctx, 0, 130, 320, 70, ['#6a5335', '#2c2014'], 0.06, 43);

    // fireplace, right
    fill(ctx, 272, 60, 44, 74, '#3a3028');
    fill(ctx, 278, 70, 32, 60, '#1c1410');
    vgrad(ctx, 280, 96, 28, 34, [[0, '#e8843a'], [0.6, '#a33c1c'], [1, '#5a1c10']]);
    speckle(ctx, 280, 96, 28, 34, ['#ffc45e', '#7d2814'], 0.2, 9);
    fill(ctx, 268, 56, 52, 6, '#57422a');

    // counter, left, with barrels
    fill(ctx, 8, 96, 64, 8, '#5a4225');
    fill(ctx, 10, 104, 60, 34, '#4a3620');
    for (const bx of [16, 40]) {
      fill(ctx, bx, 74, 20, 22, '#5e4526');
      for (let i = 0; i < 3; i++) fill(ctx, bx, 78 + i * 6, 20, 1.4, '#3a2a16');
    }
    // hanging lamp
    fill(ctx, 158, 0, 2, 26, '#2c2114');
    fill(ctx, 152, 26, 14, 8, '#6a5230');
    vgrad(ctx, 148, 34, 22, 10, [[0, 'rgba(255,196,110,.5)'], [1, 'rgba(255,196,110,0)']]);

    // tables: one for the regulars, one for the money
    const table = (x, y, w) => {
      fill(ctx, x, y, w, 5, '#6a5028');
      fill(ctx, x + 3, y + 5, 4, 16, '#4a3820');
      fill(ctx, x + w - 7, y + 5, 4, 16, '#4a3820');
      speckle(ctx, x, y, w, 5, ['#7d613a'], 0.2, x);
    };
    table(84, 150, 64);
    table(238, 150, 56);
    // mugs
    for (const [mx, my] of [[96, 146], [122, 146], [252, 146]]) {
      fill(ctx, mx, my, 5, 5, '#8a7146');
      fill(ctx, mx + 5, my + 1, 1.6, 3, '#8a7146');
    }
    // window, small and losing to the dark
    fill(ctx, 196, 52, 22, 28, '#0f1a26');
    fill(ctx, 196, 52, 22, 2, '#57422a'); fill(ctx, 196, 78, 22, 2, '#57422a');
    fill(ctx, 206, 52, 2, 28, '#57422a');
  },

  drawLayer(ctx, t, game, y0, y1) {
    if (y0 <= 144 && 144 < y1) drawBicudo(ctx, t);
    if (y0 <= 166 && 166 < y1) {
      patron(ctx, 96, 166, '#3e3a44', t, 0);
      patron(ctx, 124, 165, '#4a4228', t, 1.7);
    }
    if (y0 <= 168 && 168 < y1 && game.flags.acto1Fim) drawDiogoTaberna(ctx, t);
    if (y0 <= 164 && 164 < y1) drawAgente(ctx, t);
  },

  hotspots: [
    { id: 'agente', x: 244, y: 130, w: 40, h: 46, name: 'o agente florentino' },

    { id: 'diogoTab', x: 104, y: 116, w: 34, h: 56, name: 'o teu primo Diogo',
      when: f => f.acto1Fim },

    { id: 'patrons', x: 82, y: 140, w: 70, h: 36, name: 'os clientes do costume',
      olhar: ['Os mesmos de sempre, nas mesmas mesas de sempre. Todos te viram subir àquela mesa há dois anos. Nenhum se esqueceu.',
              'The usual men at the usual tables. Every one of them watched you climb onto that table two years ago. Not one has forgotten.'],
      falar: ['"Ó profeta! Vem aí nevoeiro ou vem aí frota?" A mesa inteira acha isto extraordinário. Achavam ontem e vão achar amanhã.',
              '"Hey, prophet! Fog coming in, or a fleet?" The whole table finds this extraordinary. They found it extraordinary yesterday and they will again tomorrow.'] },

    { id: 'lareira', x: 268, y: 52, w: 52, h: 84, name: 'a lareira',
      olhar: ['A lareira onde, há dois anos, queimaste ceremonialmente um mapa da rota da Índia. Havia testemunhas. Há sempre testemunhas.',
              'The fireplace where, two years ago, you ceremonially burned a map of the India route. There were witnesses. There are always witnesses.'] },

    { id: 'balcao', x: 6, y: 70, w: 68, h: 70, name: 'o taberneiro',
      olhar: ['O Bicudo. Serve toda a gente na mesma ordem: primeiro quem paga, depois quem promete, depois tu.',
              'Bicudo. He serves everyone in the same order: first those who pay, then those who promise, then you.'],
      falar: ['"Fiado? Para ti? A tua palavra vale menos que a tua pimenta, e a tua pimenta já não vale nada."',
              '"Credit? For you? Your word is worth less than your pepper, and your pepper is now worth nothing."',
              'o Bicudo'] },

    { id: 'portaFora', x: 0, y: 96, w: 22, h: 84, name: 'a porta para a Ribeira',
      to: 'ribeira', at: { x: 96, y: 140, wx: 110, wy: 162 },
      olhar: ['Lá fora é a Ribeira, o rio, e toda a gente que se lembra.',
              'Outside is the Ribeira, the river, and everyone who remembers.'] },
  ],
};
