// scenes/ribeira.js — A Ribeira, Lisboa. Late September 1499.
//
// Vasco da Gama has come back from India: two ships out of four, fifty-five men
// out of a hundred and seventy, and a cargo worth sixty times what the voyage
// cost. The entire city is on the riverbank losing its mind about it.
//
// Soeiro Vaz needs to get past them to a moneylender's door before it shuts.
// The greatest day in Portuguese history is, to him, traffic.

import { fill, vgrad, speckle, granite, roofTiles, window9, calcada, shade, rnd } from '../art.js';
import { vol, folds, limb, hand, head, eyes, sardinha } from '../figure.js';
import { SONG_RIBEIRA } from '../audio.js';

const SKIN = ['#9a7754', '#8a6845', '#6e5236', '#a8845e', '#7d5c3e'];
// The crowd faces the sunset, so from behind they are mostly shadow —
// muted, darkened cloth with a warm rim where the light catches them.
const CLOTH = ['#5e3028', '#333c4c', '#4a4228', '#523a52', '#364a3a',
               '#6b5530', '#3e3a44', '#5e4732', '#2c414c', '#57343c'];

// The crowd: everyone has their back to us, because the ships are that way.
// Built once, animated every frame. A still crowd reads as a photograph of a
// crowd, which is not the same thing at all.
function buildCrowd(seed) {
  const r = rnd(seed);
  const people = [];
  // Enough to be a wall across the square, few enough to read as people.
  for (let i = 0; i < 80; i++) {
    const y = 118 + r() * 62;
    people.push({
      x: 40 + r() * 232, y, s: 0.5 + ((y - 118) / 62) * 0.62,
      c: CLOTH[(r() * CLOTH.length) | 0], k: SKIN[(r() * SKIN.length) | 0],
      hat: r() > 0.55,
      rate: 3.2 + r() * 3.4,        // how excitable this one is
      phase: r() * 6.283,
      amp: 0.6 + r() * 1.6,
      lift: r() > 0.58,             // has an arm up
      ox: 0, oy: 0,                 // recoil offset, eased toward target
    });
  }
  return people.sort((a, b) => a.y - b.y);
}

const PEOPLE = buildCrowd(77);
const RECOIL = 48;                  // how far the smell carries

// Once Soeiro is carrying the fish, the crowd opens around him as he walks —
// a bubble that follows him, rather than a corridor that appears.
export function updateCrowd(dt, game) {
  const parted = game.flags.multidaoAberta;
  const px = game.player.x, py = game.player.y;
  const k = Math.min(1, dt * 7);
  for (const p of PEOPLE) {
    let tx = 0, ty = 0;
    if (parted) {
      const dx = p.x - px, dy = (p.y - py) * 1.9;
      const d = Math.hypot(dx, dy) || 1;
      if (d < RECOIL) {
        const f = (1 - d / RECOIL) * 26;
        tx = (dx / d) * f;
        ty = (dy / d) * f * 0.30;
      }
    }
    p.ox += (tx - p.ox) * k;
    p.oy += (ty - p.oy) * k;
  }
}

// Drawn in two passes so Soeiro can stand among them: everyone behind him,
// then him, then everyone in front.
export function drawCrowd(ctx, t, game, y0, y1) {
  const parted = game.flags.multidaoAberta;
  const px = game.player.x, py = game.player.y;
  // After Act 1 the party is over: Lisbon has gone home, bar a dozen
  // stragglers with nowhere better to stand.
  const thin = game.flags.acto1Fim;
  for (let pi = 0; pi < PEOPLE.length; pi++) {
    const p = PEOPLE[pi];
    if (thin && pi % 6 !== 0) continue;
    const y = p.y + p.oy;
    if (y < y0 || y >= y1) continue;
    const x = p.x + p.ox;
    const h = 38 * p.s, w = 13 * p.s;    // sized to match the player sprite
    const by = y - Math.abs(Math.sin(t * p.rate + p.phase)) * p.amp * p.s;
    const recoiling = parted &&
      Math.hypot(p.x - px, (p.y - py) * 1.9) < RECOIL;

    // body: a shadowed back with a soft sunset rim on one shoulder
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.5, by); ctx.lineTo(x + w * 0.5, by);
    ctx.lineTo(x + w * 0.40, by - h * 0.66); ctx.lineTo(x - w * 0.40, by - h * 0.66);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.fillRect(x + w * 0.14, by - h * 0.66, Math.max(1, w * 0.2), h * 0.66);
    ctx.fillStyle = 'rgba(255,196,130,.30)';                  // rim light
    ctx.fillRect(x - w * 0.40, by - h * 0.66, Math.max(1, w * 0.10), h * 0.44);
    ctx.fillRect(x - w * 0.40, by - h * 0.66, w * 0.80, Math.max(1, h * 0.035));

    ctx.strokeStyle = p.k;
    ctx.lineWidth = Math.max(1.4, 2.2 * p.s);
    ctx.lineCap = 'round';
    if (recoiling) {                      // hand clamped over the nose
      ctx.beginPath();
      ctx.moveTo(x - w * 0.30, by - h * 0.50);
      ctx.lineTo(x - w * 0.05, by - h * 0.72);
      ctx.stroke();
    } else if (p.lift) {                  // waving at a man who cannot see them
      const wave = Math.sin(t * p.rate * 1.25 + p.phase) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.28, by - h * 0.56);
      ctx.lineTo(x + w * 0.46 + wave * 1.6 * p.s, by - h * (0.80 + wave * 0.10));
      ctx.stroke();
      ctx.fillStyle = p.k;                // the open hand
      ctx.beginPath();
      ctx.arc(x + w * 0.46 + wave * 1.6 * p.s, by - h * (0.80 + wave * 0.10),
              Math.max(1, 1.3 * p.s), 0, Math.PI * 2);
      ctx.fill();
    }

    // head: hair-dominated (they face away), warm light on the crown
    const hr = Math.max(1.6, 3.0 * p.s);
    const hy = by - h * 0.66 - hr * 0.9;
    ctx.fillStyle = '#241a12';
    ctx.beginPath(); ctx.arc(x, hy, hr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.k;
    ctx.beginPath(); ctx.arc(x, hy + hr * 0.45, hr * 0.72, 0, Math.PI); ctx.fill();
    ctx.fillStyle = 'rgba(255,196,130,.40)';
    ctx.beginPath(); ctx.arc(x - hr * 0.2, hy - hr * 0.25, hr * 0.75, Math.PI * 1.05, Math.PI * 1.85); ctx.fill();
    if (p.hat) {
      ctx.fillStyle = shade(p.c, -14);
      ctx.fillRect(x - hr * 1.25, hy - hr * 0.95, hr * 2.5, Math.max(1.2, hr * 0.55));
    }
  }
}

// The fishwife, drawn live over the painted background. Same 1:6 proportions
// and the same shading system as everyone else.
function drawPeixeira(ctx, t) {
  const x = 266, y = 182, HT = 46;
  const bob = Math.sin(t * 1.1) * 0.7;
  const headR = HT * 0.09, neckY = y - HT + headR * 2.6 + bob;
  ctx.fillStyle = 'rgba(10,8,6,.35)';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 9, 2.6, 0, 0, Math.PI * 2); ctx.fill();
  // dress: full-length, wide at the hem
  vol(ctx, [[x - 5.5, neckY], [x + 5.5, neckY], [x + 8.5, y], [x - 8.5, y]], '#7e4a52');
  folds(ctx, x, neckY + HT * 0.2, y - 1, 3);
  // apron
  vol(ctx, [[x - 4, y - HT * 0.52 + bob], [x + 4, y - HT * 0.52 + bob],
            [x + 5.5, y - 2], [x - 5.5, y - 2]], '#cfc4a6', { lit: 10, dark: -16 });
  // arms folded on the apron
  limb(ctx, x - 5.5, neckY + HT * 0.16, x + 1, y - HT * 0.46 + bob, 2.2, '#7e4a52');
  limb(ctx, x + 5.5, neckY + HT * 0.16, x - 1, y - HT * 0.44 + bob, 2.2, '#7e4a52');
  hand(ctx, x + 1, y - HT * 0.46 + bob, 1.3, '#b98d63');
  // head under the headscarf
  const hy = y - HT + headR * 1.15 + bob;
  head(ctx, x, hy, headR, '#b98d63', '#5e4a34', 0);
  // the scarf wraps over the hair
  ctx.fillStyle = '#e2d8ba';
  ctx.beginPath(); ctx.ellipse(x, hy - headR * 0.28, headR * 0.98, headR * 0.78, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = shade('#e2d8ba', -18);
  fill(ctx, x - headR * 1.0, hy - headR * 0.25, headR * 0.5, headR * 1.3, shade('#e2d8ba', -10));
  fill(ctx, x + headR * 0.5, hy - headR * 0.25, headR * 0.5, headR * 1.3, shade('#e2d8ba', -22));
  eyes(ctx, x, hy, headR, 0);
}

export const ribeira = {
  id: 'ribeira',
  name: 'A Ribeira',
  image: 'assets/ribeira.png',
  music: SONG_RIBEIRA,
  walk: { top: 138, bottom: 194, left: 8, right: 312 },
  start: { x: 296, y: 186 },
  // The crowd is a wall until it isn't.
  gate: { x: 246, flag: 'multidaoAberta',
          blocked: ['Empurras. A multidão empurra melhor. A porta do cambista fica do outro lado da praça, e entre ti e ela está Lisboa inteira, de costas.',
                    'You push. The crowd pushes better. The moneylender\'s door is on the far side of the square, and between you and it stands all of Lisbon, with its back turned.'] },

  paint(ctx) {
    // --- sky ----------------------------------------------------------------
    vgrad(ctx, 0, 0, 320, 78, [[0, '#4d7ba8'], [0.5, '#8fb4cf'], [1, '#d6d2bd']]);
    speckle(ctx, 0, 0, 320, 78, ['#9dbcd4', '#7fa4c2'], 0.03, 3);

    // --- far bank: Almada, which is as far as Soeiro has ever been ----------
    ctx.fillStyle = 'rgba(96,110,104,.60)';
    ctx.beginPath(); ctx.moveTo(0, 80);
    for (let x = 0; x <= 320; x += 14) ctx.lineTo(x, 71 - Math.sin(x * 0.019) * 5);
    ctx.lineTo(320, 80); ctx.closePath(); ctx.fill();

    // --- the Tagus ----------------------------------------------------------
    vgrad(ctx, 0, 78, 320, 34, [[0, '#5c7b8c'], [1, '#7e97a2']]);
    const r = rnd(9);
    for (let i = 0; i < 240; i++) {
      const y = 80 + r() * 30;
      fill(ctx, (r() * 320) | 0, y | 0, 1 + ((r() * 3) | 0), 1, 'rgba(230,240,245,.30)');
    }

    // --- the two ships that came back ---------------------------------------
    const nau = (x, y, s) => {
      ctx.fillStyle = '#4a3a26';
      ctx.beginPath();
      ctx.moveTo(x - 20 * s, y); ctx.lineTo(x + 20 * s, y);
      ctx.lineTo(x + 15 * s, y + 7 * s); ctx.lineTo(x - 14 * s, y + 7 * s);
      ctx.closePath(); ctx.fill();
      fill(ctx, x - 20 * s, y - 5 * s, 7 * s, 5 * s, '#5b4529');      // sterncastle
      ctx.strokeStyle = '#3b2f1e'; ctx.lineWidth = Math.max(1, s);
      for (const mx of [-9, 1, 11]) {
        ctx.beginPath(); ctx.moveTo(x + mx * s, y); ctx.lineTo(x + mx * s, y - 26 * s); ctx.stroke();
        fill(ctx, x + mx * s - 6 * s, y - 24 * s, 12 * s, 2 * s, '#d8cfb4');  // furled sail
      }
      fill(ctx, x + 11 * s, y - 30 * s, 8 * s, 4 * s, '#a8323a');       // pennant
    };
    nau(120, 96, 1.0);
    nau(206, 92, 0.82);

    // --- quay ---------------------------------------------------------------
    granite(ctx, 0, 108, 320, 12, 33, '#8b877c');
    calcada(ctx, 0, 118, 320, 82, 41);
    speckle(ctx, 0, 160, 320, 40, ['#6c6355', '#8b8172'], 0.06, 55);

    // --- left: the moneylender's house --------------------------------------
    granite(ctx, -4, 26, 80, 136, 12, '#7e7a70');
    roofTiles(ctx, -6, 18, 86, 10, 22);
    window9(ctx, 12, 44, 15, 19, false, 4);
    window9(ctx, 44, 42, 15, 19, true, 8);
    window9(ctx, 12, 84, 14, 17, false, 6);
    fill(ctx, 22, 112, 26, 48, '#3f3221');                       // the door
    fill(ctx, 22, 112, 26, 2, '#241c12');
    for (let i = 0; i < 5; i++) fill(ctx, 24 + i * 5, 112, 1, 48, 'rgba(0,0,0,.28)');
    fill(ctx, 42, 136, 3, 3, '#c8b070');                         // ring handle
    fill(ctx, 20, 100, 32, 9, '#6b5a3c');                        // hanging sign
    fill(ctx, 21, 101, 30, 7, '#8a7550');
    fill(ctx, 34, 96, 2, 5, '#4a3a26');

    // --- right: a fish stall nobody is visiting today ------------------------
    fill(ctx, 262, 150, 52, 6, '#6b5a3c');
    fill(ctx, 264, 156, 4, 16, '#5b4529'); fill(ctx, 306, 156, 4, 16, '#5b4529');
    for (const [bx, by, bs] of [[272, 146, 1], [292, 148, .9], [282, 142, .8]]) {
      ctx.fillStyle = '#8a7550';
      ctx.beginPath(); ctx.ellipse(bx, by, 11 * bs, 5 * bs, 0, 0, Math.PI * 2); ctx.fill();
      const rr = rnd(bx);
      for (let i = 0; i < 14; i++) {                              // sardines
        const sx = bx - 8 * bs + rr() * 16 * bs, sy = by - 3 * bs + rr() * 5 * bs;
        ctx.fillStyle = rr() > .5 ? '#b9c4c8' : '#93a2aa';
        ctx.beginPath(); ctx.ellipse(sx, sy, 3 * bs, 1.2 * bs, rr() * 1.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    // the fishwife, facing the river like everyone else
    fill(ctx, 300, 152, 10, 26, '#6e3f45');
    ctx.fillStyle = '#b98d63';
    ctx.beginPath(); ctx.arc(305, 148, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(30,20,12,.8)';
    ctx.beginPath(); ctx.arc(305, 147, 4, 0, Math.PI); ctx.fill();
    fill(ctx, 300, 141, 11, 3, '#d8cfb4');                       // headscarf

    // (the crowd is not painted here — it is animated over the top each frame)

    // --- bunting, because the city is celebrating ---------------------------
    ctx.strokeStyle = '#6b5a3c'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(60, 34);
    ctx.quadraticCurveTo(160, 58, 260, 30); ctx.stroke();
    for (let i = 0; i <= 12; i++) {
      const t = i / 12, x = 60 + t * 200;
      const y = 34 + (1 - t) * t * 4 * 24 - Math.abs(t - .5) * 0;
      const yy = 34 * (1 - t) * (1 - t) + 58 * 2 * t * (1 - t) + 30 * t * t;
      ctx.fillStyle = ['#a8323a', '#2f4a54', '#c8b070'][i % 3];
      ctx.beginPath();
      ctx.moveTo(x - 3, yy); ctx.lineTo(x + 3, yy); ctx.lineTo(x, yy + 7);
      ctx.closePath(); ctx.fill();
    }

    // haze over the water
    vgrad(ctx, 0, 74, 320, 30, [[0, 'rgba(226,224,206,.42)'], [1, 'rgba(226,224,206,0)']]);
  },

  update(dt, game) { updateCrowd(dt, game); },
  drawLayer(ctx, t, game, y0, y1) {
    drawCrowd(ctx, t, game, y0, y1);
    if (y0 <= 180 && 180 < y1) drawPeixeira(ctx, t);
    // The sardine, held aloft: the crowd parts for what it can smell, and the
    // player can see exactly what he is doing to make that happen. He keeps
    // it up for every crossing — there and back — until the day is over.
    if (game.flags.multidaoAberta && !game.flags.acto1Fim &&
        game.has('uma sardinha') && y1 > 1e8) {
      const p = game.player;
      const s = p.scale(ribeira);
      const hx = p.x + 6 * s, hy = p.y - 58 * s;
      ctx.strokeStyle = '#3b3a4c';                       // the raised arm
      ctx.lineWidth = Math.max(1.6, 3.4 * s);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x + 3 * s, p.y - 40 * s);
      ctx.lineTo(hx, hy + 3 * s);
      ctx.stroke();
      hand(ctx, hx, hy + 2.5 * s, Math.max(1, 1.7 * s), '#c9a37a');
      sardinha(ctx, hx, hy - 1.5 * s, s, -0.35 + Math.sin(t * 2.2) * 0.1);
      // the smell, radiating
      ctx.strokeStyle = 'rgba(180,200,160,.4)';
      ctx.lineWidth = 0.8;
      for (const off of [-4, 2, 7]) {
        const wob = Math.sin(t * 3 + off) * 0.8;
        ctx.beginPath();
        ctx.moveTo(hx + off * s, hy - 4 * s);
        ctx.quadraticCurveTo(hx + (off + wob) * s, hy - 8 * s, hx + (off - wob) * s, hy - 12 * s);
        ctx.stroke();
      }
    }
  },

  // Order matters: hotspotAt returns the first match, so small specific things
  // must come before the big background regions they sit inside.
  hotspots: [
    { id: 'porta', x: 12, y: 64, w: 42, h: 70, name: 'a porta do cambista',
      olhar: ['A casa do cambista. Não é o Ruivo — o Ruivo é a quem deves. O cambista é a última pessoa em Lisboa que ainda te podia emprestar dinheiro novo para pagares o velho. A tabuleta diz: FECHA AO PÔR DO SOL.',
              'The moneylender\'s house. He is not Ruivo — Ruivo is the man you owe. The moneylender is the last person in Lisbon who might still lend you new money to pay off the old. The sign says: CLOSES AT SUNSET.'] },

    { id: 'saida', x: 304, y: 126, w: 16, h: 68, name: 'o beco do Loureiro',
      to: 'beco', at: { x: 170, y: 140, wx: 168, wy: 168 },
      olhar: ['A rua continua para o beco do Loureiro, onde dormes e onde trabalhas, que são a dez passos um do outro.',
              'The street runs on to Beco do Loureiro, where you sleep and where you work, which are ten paces apart.'] },

    { id: 'paraCais', x: 0, y: 138, w: 16, h: 56, name: 'o Cais do Restelo',
      when: f => f.acto3Fim,
      to: 'cais', at: { x: 16, y: 170, wx: 44, wy: 178 },
      olhar: ['Rio abaixo, no Restelo, a armada de Cabral engorda de carga. Parte em Março. Tu, aparentemente, também.',
              'Downriver at Restelo, Cabral\'s fleet fattens with cargo. It sails in March. So, apparently, do you.'] },

    { id: 'portaTaberna', x: 84, y: 82, w: 22, h: 34, name: 'a Taberna do Bicudo',
      to: 'taberna', at: { x: 30, y: 150, wx: 48, wy: 170 },
      olhar: ['A taberna onde há dois anos anunciaste, de cima de uma mesa, que o Gama ia morrer no mar. Têm boa memória, ali dentro.',
              'The tavern where, two years ago, from the top of a table, you announced that Gama would die at sea. They have good memories in there.'] },

    { id: 'peixeira', x: 250, y: 96, w: 68, h: 88, name: 'a peixeira' },

    { id: 'naus', x: 160, y: 52, w: 106, h: 62, name: 'as naus',
      olhar: ['Partiram quatro, voltaram duas. Tu disseste que não voltava nenhuma. Estiveste quase certo, e quase certo não paga renda.',
              'Four sailed, two came back. You said none would. You were nearly right, and nearly right does not pay rent.'],
      falar: ['Falas com um barco. O barco, justiça lhe seja feita, também não te responderia se pudesse.',
              "You talk to a ship. In fairness, it wouldn't answer you even if it could."] },

    { id: 'multidao', x: 56, y: 114, w: 192, h: 68, name: 'a multidão',
      olhar: ['Lisboa inteira, de costas para ti, a aplaudir exactamente aquilo que garantiste que era impossível.',
              'All of Lisbon, with its back to you, applauding precisely the thing you guaranteed was impossible.'],
      falar: ['Alguém te reconhece. "Ó Soeiro! Então e o Gama? Morreu no mar?" Riem-se. Riem-se bastante. Riem-se mais do que era preciso.',
              '"Hey Soeiro! So how about Gama? Die at sea, did he?" They laugh. They laugh quite a lot. They laugh more than was necessary.'] },

    { id: 'rio', x: 60, y: 98, w: 196, h: 26, name: 'o rio', deadly: true,
      olhar: ['O Tejo. Larguíssimo. Soeiro enjoa no barco de Almada, que demora onze minutos.',
              'The Tagus. Enormous. Soeiro gets seasick on the Almada ferry, which takes eleven minutes.'] },
  ],
};
