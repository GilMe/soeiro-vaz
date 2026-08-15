// scenes/escritorio.js — A Casa dos Escrivães.
// Where cargo manifests are copied by men who will never see any cargo.
// Soeiro's cousin Diogo went to India once and has not stopped mentioning it.

import { fill, vgrad, speckle, granite, window9, shade, rnd } from '../art.js';
import { vol, folds, limb, hand, head, eyes, scaled, sardinha } from '../figure.js';
import { SONG_ESCRITORIO } from '../audio.js';

function desk(ctx, x, y, s, occupied, seed) {
  const w = 30 * s, h = 16 * s;
  ctx.fillStyle = '#6a5533';                       // sloped writing surface
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w / 2 - 2 * s, y - h); ctx.lineTo(x - w / 2 + 2 * s, y - h);
  ctx.closePath(); ctx.fill();
  fill(ctx, x - w / 2, y, w, 3 * s, '#4a3a20');
  fill(ctx, x - w / 2 + 3 * s, y + 3 * s, 3 * s, 14 * s, '#4a3a20');
  fill(ctx, x + w / 2 - 6 * s, y + 3 * s, 3 * s, 14 * s, '#4a3a20');
  fill(ctx, x - 7 * s, y - h + 2 * s, 14 * s, 9 * s, '#ddd3b4');   // paper
  const r = rnd(seed);
  for (let i = 0; i < 4; i++)
    fill(ctx, x - 6 * s, y - h + 4 * s + i * 2 * s, (6 + r() * 8) * s, 1, 'rgba(40,30,20,.55)');
  fill(ctx, x + 9 * s, y - h + 3 * s, 3 * s, 3 * s, '#22242c');    // inkwell
  if (occupied) {
    ctx.strokeStyle = '#e8e0c8'; ctx.lineWidth = Math.max(1, s);   // a quill, upright
    ctx.beginPath(); ctx.moveTo(x + 4 * s, y - h + 3 * s); ctx.lineTo(x + 7 * s, y - h - 7 * s); ctx.stroke();
  }
}

function clerk(ctx, x, y, s, coat, skin, bowed) {
  const h = 30 * s, w = 12 * s;
  ctx.fillStyle = coat;
  ctx.beginPath();
  ctx.moveTo(x - w * .5, y); ctx.lineTo(x + w * .5, y);
  ctx.lineTo(x + w * .42, y - h * .68); ctx.lineTo(x - w * .42, y - h * .68);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.22)';
  ctx.fillRect(x + w * .16, y - h * .68, Math.max(1, w * .18), h * .68);
  const hy = y - h * (bowed ? .72 : .80);
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(x, hy, Math.max(2, 4 * s), 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(30,20,12,.8)';
  ctx.beginPath(); ctx.arc(x, hy - 0.6 * s, Math.max(2, 3.8 * s), Math.PI, Math.PI * 2); ctx.fill();
}

// Diogo, drawn live: standing in the middle of the empty office, mid-story,
// one arm out describing a wave that gets bigger every telling.
function drawDiogo(ctx, t) {
  const x = 185, y = 174, HT = 50;
  const wave = Math.sin(t * 1.6) * 3;
  const headR = HT * 0.088;
  const neckY = y - HT + headR * 2.6;
  ctx.fillStyle = 'rgba(10,8,6,.35)';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 8.5, 2.6, 0, 0, Math.PI * 2); ctx.fill();
  // legs planted wide — a man who has stood on a deck and mentions it
  limb(ctx, x - 2.5, y - HT * 0.30, x - 5, y, 3.2, '#4a2f24');
  limb(ctx, x + 2.5, y - HT * 0.30, x + 5, y, 3.2, '#4a2f24');
  fill(ctx, x - 7, y - 1.6, 4.4, 1.8, '#2b1c12');
  fill(ctx, x + 3, y - 1.6, 4.4, 1.8, '#2b1c12');
  // the good coat: new, red-brown, conspicuously unfrayed
  vol(ctx, [[x - 6, neckY], [x + 6, neckY],
            [x + 7.5, y - HT * 0.26], [x - 7.5, y - HT * 0.26]], '#7d4436');
  folds(ctx, x - 3, neckY + 3, y - HT * 0.28, 2);
  for (let i = 0; i < 4; i++)
    fill(ctx, x - 0.8, neckY + 3 + i * 5, 1.6, 1.6, '#c8ac5e');
  // the describing arm, sweeping the horizon of the story
  limb(ctx, x + 5, neckY + HT * 0.10, x + 13, neckY - HT * 0.06 - wave, 3, '#7d4436');
  hand(ctx, x + 13.6, neckY - HT * 0.07 - wave, 1.8, '#a67c52');
  // the other hand on the hip, thumb in the belt
  limb(ctx, x - 5, neckY + HT * 0.10, x - 8, neckY + HT * 0.26, 3, '#7d4436');
  // head, and the new hat worn indoors on purpose
  const hy = y - HT + headR * 1.15;
  head(ctx, x, hy, headR, '#a67c52', '#3a2a1a', 0);
  vol(ctx, [[x - headR * 1.3, hy - headR * 1.15], [x + headR * 1.3, hy - headR * 1.15],
            [x + headR * 1.3, hy - headR * 0.6], [x - headR * 1.3, hy - headR * 0.6]], '#8a3f32');
  vol(ctx, [[x - headR * 0.7, hy - headR * 1.7], [x + headR * 0.7, hy - headR * 1.7],
            [x + headR * 0.7, hy - headR * 1.1], [x - headR * 0.7, hy - headR * 1.1]], '#8a3f32');
  fill(ctx, x + headR * 0.5, hy - headR * 1.5, headR * 0.85, headR * 0.28, '#c8ac5e');  // plume clip
  eyes(ctx, x, hy, headR, 0);
}

// The chief clerk, back at his desk in Act 2. Bent over the middle desk,
// writing. He has not raised his head since 1494 and is not starting today.
function drawEscrivaoMor(ctx, t) {
  const x = 226, y = 150;
  const scratch = Math.sin(t * 5) * 0.5;
  ctx.fillStyle = 'rgba(10,8,6,.35)';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 7.5, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  // seated, hunched over the slope of the desk
  vol(ctx, [[x - 5, y - 17], [x + 1, y - 19], [x + 6.5, y - 13], [x + 7, y], [x - 7, y]], '#2f2b33');
  folds(ctx, x - 1, y - 15, y - 2, 2);
  limb(ctx, x + 3, y - 14, x + 9 + scratch, y - 9, 2.4, '#2f2b33');
  hand(ctx, x + 9.4 + scratch, y - 8.6, 1.4, '#b0a58c');
  // bald crown, bowed: mostly scalp, a grey fringe clinging on
  const hy = y - 21;
  head(ctx, x - 1, hy, 3.8, '#b0a58c', '#b0a58c', 0);
  ctx.fillStyle = '#6e6250';
  ctx.beginPath(); ctx.ellipse(x - 1, hy + 0.8, 3.9, 2.6, 0, Math.PI * 0.7, Math.PI * 1.7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x - 1, hy + 0.8, 3.9, 2.6, 0, Math.PI * 1.3, Math.PI * 1.9); ctx.fill();
}

// The seal of the Casa da Índia: a stub of brass on the middle desk. Drawn
// separately from the clerk, because objects should not leave the room in
// somebody's sprite.
function drawSelo(ctx) {
  const x = 214, y = 142;
  fill(ctx, x - 1, y + 4, 6, 1.4, 'rgba(0,0,0,.3)');   // its little shadow
  fill(ctx, x, y, 4, 5, '#8a7434');
  fill(ctx, x - 0.8, y - 1.4, 5.6, 1.8, '#a38c42');
  fill(ctx, x + 0.4, y - 2.6, 4, 1.4, '#c8ac5e');       // catch the candlelight
}

export const escritorio = {
  id: 'escritorio',
  name: 'A Casa dos Escrivães',
  image: 'assets/escritorio.png',
  music: SONG_ESCRITORIO,
  // The painting has steep perspective — huge foreground desks — so the
  // player grows well past 1.0 walking toward the camera, and the walkable
  // band stops short of the desk row he'd otherwise stand inside.
  walk: { top: 130, bottom: 188, left: 16, right: 262 },
  playerScale: { min: 0.85, max: 1.55 },
  start: { x: 140, y: 165 },

  drawLayer(ctx, t, game, y0, y1) {
    if (!game.flags.diogoFoi && y0 <= 174 && 174 < y1)
      scaled(ctx, 185, 174, 1.4, () => drawDiogo(ctx, t));
    if (game.flags.acto1Fim && y0 <= 150 && 150 < y1) {
      if (!game.flags.escrivaoFora)
        scaled(ctx, 226, 150, 1.5, () => drawEscrivaoMor(ctx, t));
      if (!game.has('o selo'))
        scaled(ctx, 226, 150, 1.5, () => drawSelo(ctx));
      // The sardine, deployed: it lies under the desk doing its work, with
      // the stink rising in polite waves.
      if (game.flags.escrivaoFora) {
        sardinha(ctx, 224, 154, 1.2, 0.1);
        ctx.strokeStyle = 'rgba(170,190,150,.45)';
        ctx.lineWidth = 0.9;
        for (const off of [-4, 1, 6]) {
          const wob = Math.sin(t * 2.6 + off) * 1.2;
          ctx.beginPath();
          ctx.moveTo(224 + off, 150);
          ctx.quadraticCurveTo(224 + off + wob, 143, 224 + off - wob, 136);
          ctx.stroke();
        }
      }
    }
  },

  paint(ctx) {
    // --- room shell ----------------------------------------------------------
    granite(ctx, 0, 0, 320, 150, 51, '#7a7468');
    vgrad(ctx, 0, 0, 320, 150, [[0, 'rgba(20,18,24,.5)'], [1, 'rgba(20,18,24,.05)']]);
    // beamed ceiling
    for (let i = 0; i < 6; i++) fill(ctx, 0, 6 + i * 5, 320, 3, i % 2 ? '#4a3f2c' : '#3d3423');
    // floorboards
    vgrad(ctx, 0, 148, 320, 52, [[0, '#6a5a3e'], [1, '#4a3f2c']]);
    for (let i = 0; i < 9; i++) fill(ctx, 0, 150 + i * 6, 320, 1, 'rgba(0,0,0,.28)');
    speckle(ctx, 0, 148, 320, 52, ['#7d6b4a', '#3d3423'], 0.07, 63);

    // --- window, right: the only good thing in the room ---------------------
    window9(ctx, 246, 40, 46, 44, true, 2);
    ctx.fillStyle = 'rgba(255,224,160,.16)';        // shaft of light on the boards
    ctx.beginPath();
    ctx.moveTo(246, 84); ctx.lineTo(292, 84); ctx.lineTo(320, 186); ctx.lineTo(214, 186);
    ctx.closePath(); ctx.fill();

    // --- shelves of ledgers, left -------------------------------------------
    fill(ctx, 6, 34, 84, 96, '#3d3423');
    for (let row = 0; row < 4; row++) {
      fill(ctx, 6, 34 + row * 24, 84, 3, '#54492f');
      const r = rnd(90 + row);
      let x = 10;
      while (x < 86) {
        const w = 3 + ((r() * 4) | 0), h = 16 + ((r() * 4) | 0);
        fill(ctx, x, 37 + row * 24 + (20 - h), w, h,
             ['#6b3f32', '#4a4a58', '#5c5233', '#3f4a38', '#6a5533'][(r() * 5) | 0]);
        fill(ctx, x, 37 + row * 24 + (20 - h), w, 1, 'rgba(255,240,200,.18)');
        x += w + 1;
      }
    }

    // --- the chief clerk, raised at the back ---------------------------------
    fill(ctx, 128, 118, 64, 8, '#4a3a20');
    fill(ctx, 132, 126, 56, 14, '#3d3423');
    desk(ctx, 160, 118, 0.9, true, 5);
    clerk(ctx, 160, 118, 0.85, '#2f2b33', '#c9a37a', true);

    // --- rows of desks -------------------------------------------------------
    desk(ctx, 74, 156, 0.85, false, 11);          // Soeiro's, empty
    desk(ctx, 232, 152, 0.9, true, 19);           // Diogo's
    desk(ctx, 118, 146, 0.7, true, 23);
    clerk(ctx, 118, 146, 0.68, '#4a4238', '#b98d63', true);

    // --- Diogo, standing, telling it again -----------------------------------
    clerk(ctx, 244, 176, 1.0, '#6b3f32', '#a67c52', false);
    ctx.strokeStyle = '#a67c52'; ctx.lineWidth = 1;   // arm out, describing a wave
    ctx.beginPath(); ctx.moveTo(240, 158); ctx.lineTo(226, 148); ctx.stroke();
    fill(ctx, 238, 142, 14, 4, '#8a3f32');            // a hat he did not use to own

    // the pepper pouch on his desk, which he shows to everyone
    fill(ctx, 226, 138, 11, 8, '#7d6a48');
    fill(ctx, 226, 138, 11, 2, '#9a8558');
    fill(ctx, 229, 140, 5, 4, '#3d2a18');

    // --- door back to the alley ---------------------------------------------
    fill(ctx, 8, 96, 34, 70, '#2e2718');
    fill(ctx, 8, 96, 34, 3, '#191408');
    for (let i = 0; i < 6; i++) fill(ctx, 11 + i * 5, 96, 1, 70, 'rgba(0,0,0,.35)');
    fill(ctx, 36, 128, 3, 4, '#b39a5c');

    vgrad(ctx, 0, 0, 320, 200, [[0, 'rgba(12,10,16,.34)'], [0.6, 'rgba(12,10,16,.04)'],
                                [1, 'rgba(12,10,16,.30)']]);
  },

  hotspots: [
    { id: 'bolsa', x: 148, y: 88, w: 62, h: 32, name: 'a bolsa de pimenta',
      // sits on the sideboard by the candle until Diogo is out of the room
    },

    { id: 'diogo', x: 164, y: 96, w: 44, h: 80, name: 'o teu primo Diogo',
      when: f => !f.diogoFoi },

    { id: 'minhaMesa', x: 246, y: 96, w: 72, h: 76, name: 'a tua secretária',
      olhar: ['A tua secretária. Onze anos de manifestos de carga, todos de outra gente. És tu que os escreves. É a tua letra que diz quem é rico.',
              "Your desk. Eleven years of cargo manifests, all somebody else's. You write them. It is your handwriting that says who is rich."],
      pegar: ['Não há nada teu nesta sala. Nem a cadeira.',
              'There is nothing of yours in this room. Not even the chair.'] },

    { id: 'selo', x: 200, y: 128, w: 18, h: 18, name: 'o selo da Casa da Índia',
      when: (f, g) => f.acto1Fim && !g.has('o selo') },

    { id: 'escrivaoMor', x: 202, y: 104, w: 44, h: 52, name: 'o escrivão-mor',
      when: f => f.acto1Fim && !f.escrivaoFora },

    { id: 'mesas', x: 208, y: 82, w: 38, h: 32, name: 'as outras secretárias',
      olhar: ['Vazias. Foram todos à Ribeira ver o homem do momento. Só ficou o Diogo, que já não precisa de ver — esteve lá.',
              'Empty. They have all gone to the Ribeira to see the man of the hour. Only Diogo stayed — he does not need to look. He was there.'] },

    { id: 'prateleiras', x: 0, y: 8, w: 96, h: 126, name: 'as prateleiras',
      olhar: ['Livros de registo até ao tecto. Cada um é a fortuna de outra pessoa, escrita à tua mão. Com papel destes e a tua letra, um homem podia escrever a fortuna que quisesse.',
              "Ledgers to the ceiling. Each one somebody else's fortune, in your handwriting. With paper like this and your hand, a man could write himself any fortune he liked."] },

    { id: 'janela', x: 278, y: 24, w: 42, h: 60, name: 'a janela',
      olhar: ['Dali vê-se o rio. É por isso que ninguém te deixa sentar deste lado da sala.',
              "You can see the river from there. That is why nobody lets you sit on this side of the room."] },

    { id: 'porta', x: 106, y: 48, w: 40, h: 66, name: 'a porta',
      to: 'beco', at: { x: 44, y: 140, wx: 80, wy: 170 },
      olhar: ['A porta para o beco. Passas por ela duas vezes por dia e nunca a nenhuma hora interessante.',
              'The door to the alley. You go through it twice a day and never at an interesting hour.'] },
  ],
};
