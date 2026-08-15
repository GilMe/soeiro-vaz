// scenes/cais.js — O Cais do Restelo, March 1500. Cabral's fleet fitting out:
// thirteen ships, the largest Portugal has ever sent to sea, and at the foot
// of one gangplank a master deciding who is worth their weight.

import { fill, vgrad, speckle, granite, calcada, shade, rnd } from '../art.js';
import { vol, folds, limb, hand, head, eyes } from '../figure.js';
import { SONG_ABERTURA } from '../audio.js';

// The master: forearms like mooring lines, planted at the foot of the plank.
function drawMestre(ctx, t) {
  const x = 236, y = 178, HT = 53;
  const breathe = Math.sin(t * 0.7) * 0.4;
  const headR = HT * 0.088, neckY = y - HT + headR * 2.6 + breathe;
  ctx.fillStyle = 'rgba(10,8,6,.35)';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 9.5, 2.6, 0, 0, Math.PI * 2); ctx.fill();
  // legs wide, immovable
  limb(ctx, x - 3, y - HT * 0.30, x - 7, y, 3.6, '#2e2a24');
  limb(ctx, x + 3, y - HT * 0.30, x + 7, y, 3.6, '#2e2a24');
  fill(ctx, x - 9, y - 1.6, 5, 2, '#17140f');
  fill(ctx, x + 4, y - 1.6, 5, 2, '#17140f');
  // sea coat, salt-faded
  vol(ctx, [[x - 7, neckY], [x + 7, neckY],
            [x + 9, y - HT * 0.28], [x - 9, y - HT * 0.28]], '#4a4434');
  folds(ctx, x, neckY + 4, y - HT * 0.30, 3);
  // arms crossed high — a gate with a heartbeat
  limb(ctx, x - 6, neckY + HT * 0.13, x + 7, neckY + HT * 0.11, 3.8, '#544e3c');
  hand(ctx, x - 5, neckY + HT * 0.12, 1.8, '#a67c52');
  // head: weathered, grey-bearded
  const hy = y - HT + headR * 1.15 + breathe;
  head(ctx, x, hy, headR, '#a67c52', '#5a5248', 0);
  ctx.fillStyle = '#6e6558';                              // the beard
  ctx.beginPath(); ctx.ellipse(x, hy + headR * 0.62, headR * 0.72, headR * 0.5, 0, 0, Math.PI); ctx.fill();
  eyes(ctx, x, hy, headR, 0);
}

export const cais = {
  id: 'cais',
  name: 'O Cais do Restelo',
  image: 'assets/cais.png',                // optional future painting
  music: SONG_ABERTURA,
  walk: { top: 148, bottom: 194, left: 14, right: 300 },
  start: { x: 30, y: 178 },

  paint(ctx) {
    // cold March morning sky
    vgrad(ctx, 0, 0, 320, 96, [[0, '#7a92ac'], [0.55, '#a8b8c4'], [1, '#d4d6cc']]);
    speckle(ctx, 0, 0, 320, 90, ['#93a8bc', '#b8c4cc'], 0.04, 3);
    // the far bank
    ctx.fillStyle = 'rgba(96,108,104,.5)';
    ctx.beginPath(); ctx.moveTo(0, 96);
    for (let x = 0; x <= 320; x += 14) ctx.lineTo(x, 90 - Math.sin(x * 0.02) * 4);
    ctx.lineTo(320, 96); ctx.closePath(); ctx.fill();
    // river
    vgrad(ctx, 0, 92, 320, 40, [[0, '#5c7488'], [1, '#7e94a0']]);
    const r = rnd(11);
    for (let i = 0; i < 200; i++)
      fill(ctx, (r() * 320) | 0, (94 + r() * 36) | 0, 1 + ((r() * 3) | 0), 1, 'rgba(230,240,245,.28)');
    // the rest of the fleet, at anchor in the stream
    const nauFar = (x, y, s) => {
      ctx.fillStyle = '#3a3226';
      ctx.beginPath();
      ctx.moveTo(x - 14 * s, y); ctx.lineTo(x + 14 * s, y);
      ctx.lineTo(x + 10 * s, y + 5 * s); ctx.lineTo(x - 10 * s, y + 5 * s);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#2e281e'; ctx.lineWidth = Math.max(1, s);
      for (const mx of [-6, 1, 8]) {
        ctx.beginPath(); ctx.moveTo(x + mx * s, y); ctx.lineTo(x + mx * s, y - 18 * s); ctx.stroke();
      }
      fill(ctx, x - 1 * s, y - 21 * s, 5 * s, 3 * s, '#8a3f32');
    };
    nauFar(60, 104, 0.9); nauFar(120, 98, 0.7); nauFar(174, 102, 0.8);
    // the flagship, moored at the quay, right — a wall of hull
    ctx.fillStyle = '#4a3a26';
    ctx.beginPath();
    ctx.moveTo(252, 40); ctx.lineTo(320, 34); ctx.lineTo(320, 158); ctx.lineTo(258, 150);
    ctx.closePath(); ctx.fill();
    for (let py = 52; py < 148; py += 9)
      fill(ctx, 254, py, 66, 2, 'rgba(0,0,0,.22)');
    fill(ctx, 254, 44, 66, 4, '#5e4a2e');
    // masts and furled sails above
    ctx.strokeStyle = '#3a2f1e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(278, 40); ctx.lineTo(278, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(308, 36); ctx.lineTo(308, 0); ctx.stroke();
    fill(ctx, 262, 6, 32, 5, '#d8cfb4');
    fill(ctx, 296, 12, 24, 5, '#d8cfb4');
    // gangplank down to the quay
    ctx.fillStyle = '#6a5533';
    ctx.beginPath();
    ctx.moveTo(258, 120); ctx.lineTo(268, 120); ctx.lineTo(232, 170); ctx.lineTo(220, 168);
    ctx.closePath(); ctx.fill();
    for (let i = 0; i < 6; i++)
      fill(ctx, 224 + i * 6.6, 165 - i * 8.2, 9, 1.6, 'rgba(0,0,0,.25)');
    // quay
    granite(ctx, 0, 128, 320, 12, 21, '#8b877c');
    calcada(ctx, 0, 138, 320, 62, 33);
    // cargo waiting: crates and sacks, left
    for (const [cx, cy, cw, chh] of [[28, 148, 26, 20], [58, 152, 20, 16], [40, 132, 22, 16]]) {
      fill(ctx, cx, cy, cw, chh, '#6a5533');
      fill(ctx, cx, cy, cw, 2.4, '#7d6540');
      fill(ctx, cx + 2, cy, 2, chh, 'rgba(0,0,0,.2)');
      fill(ctx, cx + cw - 4, cy, 2, chh, 'rgba(0,0,0,.2)');
    }
    ctx.fillStyle = '#7d6540';
    ctx.beginPath(); ctx.ellipse(96, 158, 12, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(112, 162, 10, 6, 0, 0, Math.PI * 2); ctx.fill();
    // bollard
    fill(ctx, 196, 140, 8, 14, '#55524b');
    fill(ctx, 194, 138, 12, 4, '#666258');
    // gulls
    ctx.strokeStyle = 'rgba(240,244,246,.7)'; ctx.lineWidth = 1;
    for (const [gx, gy] of [[80, 30], [96, 38], [150, 24]]) {
      ctx.beginPath(); ctx.moveTo(gx - 3, gy); ctx.quadraticCurveTo(gx, gy - 2.5, gx + 3, gy); ctx.stroke();
    }
    // cold light wash
    vgrad(ctx, 0, 0, 320, 200, [[0, 'rgba(200,214,224,.10)'], [1, 'rgba(140,160,180,.08)']]);
  },

  drawLayer(ctx, t, game, y0, y1) {
    if (!game.flags.embarcou && y0 <= 178 && 178 < y1) drawMestre(ctx, t);
  },

  hotspots: [
    { id: 'mestre', x: 220, y: 122, w: 34, h: 58, name: 'o mestre',
      when: f => !f.embarcou },

    { id: 'prancha', x: 218, y: 116, w: 54, h: 56, name: 'a prancha de embarque',
      olhar: ['Sobe do cais para o convés. Doze passos de madeira entre a tua vida inteira e a outra.',
              'It climbs from the quay to the deck. Twelve wooden steps between your entire life and the other one.'] },

    { id: 'nau', x: 250, y: 0, w: 70, h: 120, name: 'a nau capitânia',
      olhar: ['Uma parede de carvalho com mastros até ao céu. Treze naus. A maior armada que Portugal já mandou ao mar, e um lugar nela é teu, se o mestre deixar.',
              'A wall of oak with masts to the sky. Thirteen ships. The largest fleet Portugal has ever sent to sea — and one place in it is yours, if the master allows.'] },

    { id: 'carga', x: 20, y: 128, w: 106, h: 44, name: 'a carga',
      olhar: ['Caixas, barris, sacos — e algures no meio, o teu porão pago com o dinheiro de toda a gente que conheces.',
              'Crates, barrels, sacks — and somewhere among them, your hold-space, paid for with the money of everyone you know.'] },

    { id: 'rio', x: 0, y: 92, w: 250, h: 34, name: 'o Tejo', deadly: true,
      olhar: ['O Tejo, e depois a barra, e depois o mar. Onze minutos até Almada sempre te chegaram. Agora são meses.',
              'The Tagus, then the bar, then the sea. Eleven minutes to Almada was always enough for you. Now it is months.'] },

    { id: 'saida', x: 0, y: 148, w: 22, h: 46, name: 'a Ribeira',
      to: 'ribeira', at: { x: 30, y: 150, wx: 60, wy: 176 },
      olhar: ['A cidade fica. É o que as cidades fazem.',
              'The city stays. It is what cities do.'] },
  ],
};
