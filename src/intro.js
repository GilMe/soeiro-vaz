// intro.js — title card and opening sequence.
// Sierra games didn't drop you into a room; they gave you a painted title with
// music under it, then a few cards of setup, then handed over the mouse.

import { fill, vgrad, speckle, panel, text, wrap, rnd } from './art.js';
import { W, H } from './vga.js';
import { drawDissolve, loadImage } from './fx.js';

const BEATS = [
  { title: true, img: 'assets/title.png' },
  { img: 'assets/intro/lisboa-panorama.png',
    pt: 'Lisboa. Setembro de 1499.',
    en: 'Lisbon. September 1499.' },
  { img: 'assets/intro/partida-da-frota.png', pos: 'top',
    pt: 'Há dois anos, Vasco da Gama partiu para a Índia. Toda a gente dizia que era o futuro.',
    en: 'Two years ago Vasco da Gama sailed for India. Everyone said it was the future.' },
  { img: 'assets/intro/taberna.png',
    pt: 'Tu disseste que ele morria no mar. Disseste alto. Disseste na taberna. Disseste a toda a gente que parou para ouvir, e a algumas que não pararam.',
    en: 'You said he would die at sea. You said it loudly. You said it in the tavern. You said it to everyone who stopped to listen, and to several who did not.' },
  { img: 'assets/intro/aritmetica.png', pos: 'top',
    pt: 'Tinhas feito as contas.',
    en: 'You had done the arithmetic.' },
  { img: 'assets/intro/compra-da-malagueta.png',
    pt: 'Por isso pediste quatro mil reais ao Bastião Ruivo e compraste toda a malagueta de Lisboa. Porque quando a frota falhasse, a malagueta era a única pimenta da Europa — e era tua.',
    en: 'So you borrowed four thousand reais from Bastião Ruivo and bought every grain of malagueta in Lisbon. Because when the fleet failed, malagueta would be the only pepper in Europe — and it would be yours.' },
  { img: 'assets/intro/regresso.png', pos: 'top',
    pt: 'O Gama voltou esta manhã.',
    en: 'Gama came back this morning.' },
  { img: 'assets/intro/regresso.png', pos: 'top',
    pt: 'Tens onze toneladas da pimenta errada. Tens uma dívida. E tens uma senhoria que triplicou a renda, porque agora a Ribeira é outra coisa.',
    en: 'You have eleven tons of the wrong pepper. You have a debt. And you have a landlady who has tripled the rent, because the Ribeira is different now.' },
  { img: 'assets/intro/regresso.png', pos: 'top',
    pt: 'O mercado ainda não estava preparado.',
    en: "The market wasn't ready." },
];

// The dusk river the whole sequence plays over.
function backdrop(ctx, t) {
  vgrad(ctx, 0, 0, W, 66, [
    [0, '#26305a'], [0.34, '#5b5286'], [0.60, '#b06a72'],
    [0.83, '#e89050'], [1, '#ffcb8c']]);
  speckle(ctx, 0, 0, W, 42, ['#2a3350', '#4a4468'], 0.04, 5);

  // far shore
  ctx.fillStyle = '#1b2030';
  ctx.beginPath(); ctx.moveTo(0, 70);
  for (let x = 0; x <= W; x += 12) ctx.lineTo(x, 64 - Math.sin(x * 0.021) * 4);
  ctx.lineTo(W, 70); ctx.closePath(); ctx.fill();

  // water, with the sunset smeared down it
  vgrad(ctx, 0, 68, W, 84, [[0, '#a86a4c'], [0.35, '#5a4d5e'], [1, '#232a3c']]);
  const r = rnd(21);
  for (let i = 0; i < 340; i++) {
    const y = 69 + r() * 82;
    const w = 1 + ((r() * 4) | 0);
    const glow = y < 92 ? 'rgba(255,190,120,.34)' : 'rgba(180,190,220,.13)';
    fill(ctx, ((r() * W + Math.sin(t * 0.6 + y) * 3) | 0) % W, y | 0, w, 1, glow);
  }

  // the two ships that came back, in silhouette
  const nau = (x, y, s, bob) => {
    const yy = y + Math.sin(t * 0.9 + bob) * 1.2;
    ctx.fillStyle = '#141826';
    ctx.beginPath();
    ctx.moveTo(x - 22 * s, yy); ctx.lineTo(x + 22 * s, yy);
    ctx.lineTo(x + 16 * s, yy + 8 * s); ctx.lineTo(x - 15 * s, yy + 8 * s);
    ctx.closePath(); ctx.fill();
    fill(ctx, x - 22 * s, yy - 6 * s, 8 * s, 6 * s, '#141826');
    ctx.strokeStyle = '#141826'; ctx.lineWidth = Math.max(1, s);
    for (const mx of [-10, 1, 12]) {
      ctx.beginPath();
      ctx.moveTo(x + mx * s, yy); ctx.lineTo(x + mx * s, yy - 30 * s); ctx.stroke();
      fill(ctx, x + mx * s - 7 * s, yy - 28 * s, 14 * s, 2 * s, '#141826');
    }
  };
  nau(78, 84, 1.0, 0);
  nau(232, 77, 0.78, 2.1);

  // the city, black against the light
  ctx.fillStyle = '#0d1018';
  ctx.beginPath(); ctx.moveTo(0, H);
  ctx.lineTo(0, 150);
  const rr = rnd(88);
  for (let x = 0; x <= W; x += 16) {
    const h = 150 - 6 - rr() * 16;
    ctx.lineTo(x, h); ctx.lineTo(x + 16, h);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  // a few lit windows
  const r2 = rnd(4);
  for (let i = 0; i < 26; i++)
    fill(ctx, (r2() * W) | 0, 152 + ((r2() * 40) | 0), 2, 2,
         r2() > .5 ? 'rgba(255,200,110,.75)' : 'rgba(255,170,80,.45)');
}

// The closing cinematic: March 1500, and the joke the whole game was built
// to land. Stills are optional (assets/outro/) — beats without a loaded image
// play over the painted dusk.
export const OUTRO_BEATS = [
  { img: 'assets/intro/partida-da-frota.png', pos: 'top',
    pt: 'A 9 de Março de 1500, a armada de Pedro Álvares Cabral larga de Belém. Treze naus. A maior que Portugal alguma vez mandou ao mar.',
    en: 'On 9 March 1500, the fleet of Pedro Álvares Cabral sails from Belém. Thirteen ships. The largest Portugal has ever sent to sea.' },
  { img: 'assets/intro/partida-da-frota.png', pos: 'top',
    pt: 'Tu vais numa delas. No porão, com o capital de toda a gente que conheces e um peixe seco que te deu uma peixeira.',
    en: 'You are aboard one of them. In the hold, with the capital of everyone you know and a dried fish a fishwife gave you.' },
  { img: 'assets/outro/porao.png',
    pt: 'Enjoas antes da barra. Enjoas ainda o Tejo era doce. O mestre diz que passa. O mestre mente.',
    en: 'You are seasick before the bar. Seasick while the Tagus was still fresh water. The master says it passes. The master lies.' },
  { img: 'assets/outro/porao.png',
    pt: 'Semanas. O Atlântico inteiro. E depois a armada guina para oeste — tão para oeste que os pilotos discutem — e a 22 de Abril alguém grita TERRA.',
    en: 'Weeks. The whole Atlantic. And then the fleet swings west — so far west the pilots argue — and on 22 April somebody shouts LAND.' },
  { img: 'assets/outro/terra-a-vista.png',
    pt: 'Uma costa que não está em mapa nenhum. Verde até onde a vista alcança. A maior descoberta de uma geração acontece a quarenta pés por cima da tua cabeça.',
    en: 'A coast that is on no map. Green as far as sight reaches. The greatest discovery of a generation happens forty feet above your head.' },
  { img: 'assets/outro/porao.png',
    pt: 'Tu não a vês. Estás lá em baixo, abraçado a um balde, a explicar ao peixe seco que o mercado ainda não estava preparado.',
    en: 'You do not see it. You are below, holding a bucket, explaining to the dried fish that the market was not ready yet.' },
];

const DIS = 0.30;   // dissolve half-time, seconds

export class Intro {
  constructor(beats = BEATS) {
    this.beats = beats;
    this.i = 0; this.fade = 0; this.done = false; this.t = 0;
    this.trans = null;                    // { phase: 'out'|'in', t }
    for (const b of beats) if (b.img) loadImage(b.img);   // warm the cache
  }

  advance() {
    if (this.trans) return;               // ignore clicks mid-dissolve
    if (this.i >= this.beats.length - 1) { this.done = true; return; }
    // Same image on both beats? Skip the dissolve, just swap the card.
    if (this.beats[this.i].img === this.beats[this.i + 1].img) { this.i++; this.fade = 0; return; }
    this.trans = { phase: 'out', t: 0 };
  }

  draw(ctx, dt, gloss) {
    this.t += dt;
    this.fade = Math.min(1, this.fade + dt * 2.4);

    if (this.trans) {
      this.trans.t += dt;
      if (this.trans.t >= DIS) {
        if (this.trans.phase === 'out') {
          this.i++; this.fade = 0;
          this.trans = { phase: 'in', t: 0 };
        } else this.trans = null;
      }
    }
    const b = this.beats[this.i];

    // The still, if the user's painting for this beat has arrived;
    // the procedural dusk otherwise. Either way the sequence never stalls.
    const rec = b.img ? loadImage(b.img) : null;
    if (rec && rec.ready) ctx.drawImage(rec.img, 0, 0, W, H);
    else backdrop(ctx, this.t);

    if (b.title) {
      fill(ctx, 0, 0, W, H, 'rgba(8,10,18,.28)');
      const a = this.fade;
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      // a soft plate behind the type so it survives the sunset behind it
      fill(ctx, 40, 34, W - 80, 62, 'rgba(10,12,20,.52)');
      text(ctx, 'SOEIRO VAZ', W / 2, 42, '#ffe4a8', 'bold 18px "Courier New", monospace');
      text(ctx, 'na Terra da Pimenta', W / 2, 66, '#e8c88c', '11px "Courier New", monospace');
      fill(ctx, 96, 84, 128, 1, 'rgba(232,200,140,.65)');
      text(ctx, 'Lisboa · 1499', W / 2, 88, '#c9b894', '8px "Courier New", monospace');
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
      this._dissolve(ctx);
      return;   // the title menu draws over this
    }

    // a card of setup, in the usual bordered box
    const bw = 250, bx = (W - bw) / 2 | 0, inner = bw - 16;
    const lines = wrap(ctx, b.pt, inner, '8px "Courier New", monospace');
    const gl = gloss ? wrap(ctx, b.en, inner, '8px "Courier New", monospace') : [];
    const bh = 16 + lines.length * 10 + (gl.length ? 7 + gl.length * 10 : 0) + 12;
    // Each still declares where its empty space is: sky-heavy paintings take
    // the card at the top, so the text never sits on the picture's subject.
    const by = b.pos === 'top' ? 16 : H - bh - 14;

    ctx.globalAlpha = this.fade;
    panel(ctx, bx, by, bw, bh);
    let ty = by + 8;
    for (const l of lines) { text(ctx, l, bx + 8, ty, '#fff8e0'); ty += 10; }
    if (gl.length) {
      fill(ctx, bx + 4, ty + 2, bw - 8, gl.length * 10 + 5, '#20242c');
      ty += 6;
      for (const l of gl) { text(ctx, l, bx + 8, ty, '#9fe07a'); ty += 10; }
    }
    text(ctx, gloss ? '[TAB] esconder' : '[TAB] traduzir',
         bx + bw - 84, by + bh - 12, '#cfcbbf', '7px "Courier New", monospace');
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    text(ctx, `${this.i}/${this.beats.length - 1}`, W / 2, 8, '#6f6c66', '7px "Courier New", monospace');
    ctx.textAlign = 'left';
    this._dissolve(ctx);
  }

  _dissolve(ctx) {
    if (!this.trans) return;
    drawDissolve(ctx, this.trans.phase === 'out'
      ? this.trans.t / DIS : 1 - this.trans.t / DIS);
  }
}
