// scenes/beco.js — Beco do Loureiro. The alley behind the Ribeira.
// Where Soeiro lives, where he works, and where the man who is owed money
// has decided to spend his afternoon.

import { fill, vgrad, speckle, granite, roofTiles, window9, calcada, shade, rnd } from '../art.js';
import { vol, folds, limb, hand, head, eyes } from '../figure.js';
import { SONG_BECO } from '../audio.js';

// Ruivo's man, drawn live: leaning on the right wall by the stairs, arms
// crossed, in no hurry whatsoever. Big. Deliberately a head taller than you.
function drawHomem(ctx, t) {
  const x = 251, y = 176, HT = 52;
  const breathe = Math.sin(t * 0.8) * 0.5;
  const headR = HT * 0.088, lean = 3;                 // leant against the wall
  const neckY = y - HT + headR * 2.6 + breathe;
  ctx.fillStyle = 'rgba(10,8,6,.35)';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 9, 2.6, 0, 0, Math.PI * 2); ctx.fill();
  // legs: one straight, one crossed at the ankle — the international stance
  // of a man being paid by the hour
  limb(ctx, x + lean - 2, y - HT * 0.32, x - 2, y, 3.4, '#26222c');
  limb(ctx, x + lean + 2, y - HT * 0.32, x - 5, y - 1, 3.4, '#26222c');
  fill(ctx, x - 4, y - 1.4, 4.4, 1.8, '#17140f');
  fill(ctx, x - 7, y - 2.2, 4.4, 1.8, '#17140f');
  // coat: broad, shoulders against the wall
  vol(ctx, [
    [x + lean - 6, neckY], [x + lean + 7, neckY],
    [x + lean + 8, y - HT * 0.28], [x - 6, y - HT * 0.28],
  ], '#3a3038');
  folds(ctx, x + lean, neckY + HT * 0.14, y - HT * 0.30, 2);
  // crossed arms: a heavy bar across the chest, one hand showing
  limb(ctx, x + lean - 5, neckY + HT * 0.16, x + lean + 6, neckY + HT * 0.14, 3.6, '#443a44');
  hand(ctx, x + lean - 4, neckY + HT * 0.15, 1.7, '#a67c52');
  // head under the flat cap, tilted a touch, watching you specifically
  const hy = y - HT + headR * 1.15 + breathe;
  head(ctx, x + lean + 1, hy, headR, '#a67c52', '#241c14', -1);
  ctx.fillStyle = '#2b2620';
  fill(ctx, x + lean - headR * 1.1, hy - headR * 1.05, headR * 2.4, headR * 0.6, '#2b2620');
  fill(ctx, x + lean - headR * 1.1, hy - headR * 1.05, headR * 2.4, headR * 0.22, shade('#2b2620', 14));
  eyes(ctx, x + lean + 1, hy, headR, -1);
}

// Dona Brízida, at last visible: seated halfway up her own staircase with
// needlework she is not looking at, because she is looking at everything else.
function drawBrizida(ctx, t) {
  const x = 262, y = 130;                 // on the stairs, above street level
  const stitch = Math.sin(t * 2.1) * 0.8;
  ctx.fillStyle = 'rgba(10,8,6,.35)';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 7.5, 2, 0, 0, Math.PI * 2); ctx.fill();
  // seated: full dark skirt spread over the step
  vol(ctx, [[x - 5, y - 12], [x + 5, y - 12], [x + 8, y], [x - 8, y]], '#333026');
  // shawl
  vol(ctx, [[x - 4, y - 19], [x + 4, y - 19], [x + 5.5, y - 11], [x - 5.5, y - 11]], '#4a3a2a');
  folds(ctx, x, y - 18, y - 11.5, 2);
  // needlework hands
  limb(ctx, x - 4, y - 13, x + 1 + stitch, y - 10.5, 1.8, '#4a3a2a');
  hand(ctx, x + 1 + stitch, y - 10.8, 1.2, '#b98d63');
  fill(ctx, x - 1 + stitch, y - 11.5, 3.4, 2.2, '#cfc4a6');
  // head under the widow's kerchief
  const hy = y - 22.5;
  head(ctx, x, hy, 4, '#b98d63', '#2b2620', 0);
  ctx.fillStyle = '#2b2620';
  ctx.beginPath(); ctx.ellipse(x, hy - 0.9, 4.1, 3.4, 0, Math.PI, Math.PI * 2); ctx.fill();
  fill(ctx, x - 4.4, hy - 1.2, 1.7, 4.6, '#2b2620');
  fill(ctx, x + 2.7, hy - 1.2, 1.7, 4.6, shade('#2b2620', -8));
  // both eyes, on you, over the needlework
  eyes(ctx, x, hy, 4, 0);
}

export const beco = {
  id: 'beco',
  name: 'Beco do Loureiro',
  image: 'assets/beco.png',
  music: SONG_BECO,
  walk: { top: 140, bottom: 193, left: 22, right: 298 },
  playerScale: { min: 0.68, max: 1.18 },
  start: { x: 160, y: 170 },

  drawLayer(ctx, t, game, y0, y1) {
    if (y0 <= 176 && 176 < y1) drawHomem(ctx, t);
    if (game.flags.acto2Fim && y0 <= 130 && 130 < y1) drawBrizida(ctx, t);
  },

  paint(ctx) {
    // base coat, so the perspective clips never leave black wedges in the corners
    granite(ctx, 0, 0, 320, 200, 9, '#565349');

    // --- the bright end of the alley, which is the river ---------------------
    vgrad(ctx, 118, 78, 84, 78, [[0, '#cfd6cf'], [0.5, '#b9bfb4'], [1, '#8e9088']]);
    speckle(ctx, 118, 78, 84, 78, ['#dfe4dc', '#a4a89e'], 0.05, 3);
    // a suggestion of masts out there
    ctx.strokeStyle = 'rgba(60,64,58,.5)'; ctx.lineWidth = 1;
    for (const mx of [138, 152, 172, 186]) {
      ctx.beginPath(); ctx.moveTo(mx, 132); ctx.lineTo(mx, 96); ctx.stroke();
    }

    // --- left wall, receding -------------------------------------------------
    ctx.save(); ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(120, 76); ctx.lineTo(120, 158); ctx.lineTo(0, 200);
    ctx.closePath(); ctx.clip();
    granite(ctx, 0, 0, 122, 200, 17, '#5f5c56');
    for (let cy = 8; cy < 200; cy += 7) fill(ctx, 0, cy, 122, 1, 'rgba(0,0,0,.16)');
    ctx.restore();
    roofTiles(ctx, -4, 0, 128, 12, 23);
    window9(ctx, 22, 46, 16, 20, false, 5);
    window9(ctx, 74, 66, 13, 16, true, 11);

    // the office door, left
    fill(ctx, 26, 104, 34, 58, '#2e2718');
    fill(ctx, 26, 104, 34, 3, '#191408');
    for (let i = 0; i < 6; i++) fill(ctx, 29 + i * 5, 104, 1, 58, 'rgba(0,0,0,.35)');
    fill(ctx, 54, 132, 3, 4, '#b39a5c');
    fill(ctx, 22, 94, 44, 9, '#4a3f26');       // lintel board
    fill(ctx, 23, 95, 42, 7, '#6a5a38');

    // --- right wall ----------------------------------------------------------
    ctx.save(); ctx.beginPath();
    ctx.moveTo(320, 0); ctx.lineTo(200, 76); ctx.lineTo(200, 158); ctx.lineTo(320, 200);
    ctx.closePath(); ctx.clip();
    granite(ctx, 198, 0, 124, 200, 29, '#6a655c');
    for (let cy = 12; cy < 200; cy += 7) fill(ctx, 198, cy, 124, 1, 'rgba(0,0,0,.14)');
    ctx.restore();
    roofTiles(ctx, 196, 0, 128, 12, 37);
    window9(ctx, 286, 40, 16, 20, true, 7);
    window9(ctx, 232, 68, 12, 15, false, 13);

    // the outside stair up to the garret
    ctx.fillStyle = '#7d786d';
    for (let i = 0; i < 9; i++)
      fill(ctx, 252 + i * 5, 158 - i * 7, 46 - i * 4, 7, i % 2 ? '#726d63' : '#807b70');
    fill(ctx, 296, 84, 20, 40, '#2e2718');     // door at the top

    // --- the ground ----------------------------------------------------------
    calcada(ctx, 0, 150, 320, 50, 61);
    ctx.fillStyle = '#3a3730';
    ctx.beginPath();
    ctx.moveTo(0, 200); ctx.lineTo(118, 154); ctx.lineTo(202, 154); ctx.lineTo(320, 200);
    ctx.closePath(); ctx.fill();
    calcada(ctx, 60, 156, 200, 44, 71);
    speckle(ctx, 0, 160, 320, 40, ['#4a463c', '#2b2822'], 0.10, 83);
    // the alley's permanent puddle
    ctx.fillStyle = 'rgba(120,140,140,.35)';
    ctx.beginPath(); ctx.ellipse(112, 182, 24, 6, 0, 0, Math.PI * 2); ctx.fill();

    // --- washing, strung across ---------------------------------------------
    ctx.strokeStyle = '#6b5a3c'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(96, 52); ctx.quadraticCurveTo(160, 68, 226, 46); ctx.stroke();
    const r = rnd(41);
    for (let i = 1; i < 7; i++) {
      const t = i / 7, x = 96 + t * 130;
      const y = 52 * (1 - t) * (1 - t) + 68 * 2 * t * (1 - t) + 46 * t * t;
      const w = 9 + r() * 8, h = 12 + r() * 9;
      fill(ctx, x - w / 2, y, w, h, ['#b9b0a0', '#8a9088', '#a89880', '#7d8490'][i % 4]);
      fill(ctx, x - w / 2, y, w, 1, 'rgba(0,0,0,.25)');
    }

    // --- a crate, and something living behind it -----------------------------
    fill(ctx, 66, 160, 26, 18, '#6a5a3c');
    fill(ctx, 66, 160, 26, 2, '#8a7550');
    fill(ctx, 78, 160, 2, 18, 'rgba(0,0,0,.3)');

    // --- o homem do Ruivo, leaning, patient ----------------------------------
    fill(ctx, 236, 140, 13, 34, '#3a3038');
    ctx.fillStyle = '#a67c52';
    ctx.beginPath(); ctx.arc(242, 134, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(30,20,12,.8)';
    ctx.beginPath(); ctx.arc(242, 132, 5, Math.PI, Math.PI * 2); ctx.fill();
    fill(ctx, 235, 127, 15, 4, '#2b2620');     // flat cap
    fill(ctx, 248, 148, 8, 4, '#8a7550');      // hands, folded, in no hurry

    // --- gloom ---------------------------------------------------------------
    vgrad(ctx, 0, 0, 320, 200, [[0, 'rgba(10,12,20,.42)'], [0.55, 'rgba(10,12,20,.10)'],
                                [1, 'rgba(10,12,20,.46)']]);
  },

  hotspots: [
    { id: 'homem', x: 236, y: 122, w: 34, h: 56, name: 'o homem do Ruivo' },

    { id: 'portaEscritorio', x: 16, y: 56, w: 44, h: 100, name: 'a porta do escritório',
      to: 'escritorio', at: { x: 122, y: 132, wx: 140, wy: 165 },
      olhar: ['A Casa dos Escrivães. Passas ali onze horas por dia a copiar o que outros ganham.',
              'The clerks\' house. You spend eleven hours a day in there copying what other people earn.'] },

    { id: 'portaArmazem', x: 204, y: 76, w: 30, h: 56, name: 'o teu armazém',
      to: 'armazem', at: { x: 196, y: 132, wx: 172, wy: 168 },
      olhar: ['A sede da Companhia Real da Malagueta. A porta range de maneira acusatória.',
              'The head office of the Companhia Real da Malagueta. The door creaks accusingly.'] },

    { id: 'brizida', x: 246, y: 102, w: 34, h: 32, name: 'a Dona Brízida',
      when: f => f.acto2Fim },

    { id: 'escadas', x: 238, y: 44, w: 78, h: 86, name: 'as escadas',
      olhar: ['Sobem para o teu sótão. A Dona Brízida está sentada no cimo desde o meio-dia.',
              'They go up to your garret. Dona Brízida has been sitting at the top since noon.'] },

    { id: 'caixote', x: 120, y: 100, w: 26, h: 24, name: 'um barril da tua malagueta',
      olhar: ['Um barril da tua mercadoria, largado no beco porque já não vale a pena roubá-la. Tens mais onze toneladas. Pagas armazém todas as semanas.',
              'A barrel of your merchandise, left in the alley because it is no longer worth stealing. You have eleven more tons. You pay storage on it every week.'],
      pegar: ['Não. Já tens onze toneladas. O problema nunca foi a quantidade.',
              'No. You have eleven tons. Quantity was never the problem.'] },

    { id: 'roupa', x: 126, y: 8, w: 92, h: 64, name: 'a roupa estendida',
      olhar: ['Roupa a secar num beco onde nunca bate sol. É assim há trezentos anos.',
              'Washing hung to dry in an alley the sun never reaches. It has been like this for three hundred years.'] },

    { id: 'poca', x: 64, y: 148, w: 80, h: 30, name: 'a poça',
      olhar: ['A poça do beco. Não seca no Verão e ninguém sabe de onde vem.',
              "The alley's puddle. It doesn't dry in summer and nobody knows where it comes from."] },

    { id: 'fundo', x: 136, y: 74, w: 48, h: 42, name: 'o fim do beco',
      to: 'ribeira', at: { x: 310, y: 160, wx: 290, wy: 184 },
      olhar: ['Ao fundo está a Ribeira, e na Ribeira está toda a gente.',
              'At the end is the Ribeira, and in the Ribeira is everybody.'] },
  ],
};
