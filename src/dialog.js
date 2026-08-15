// dialog.js — the choice conversation. Soeiro's options are always pitch-speak;
// a plain sentence is structurally unavailable to him. Wrong picks are funny
// failures that loop; the right read advances. Keys 1-3 or click.

import { fill, panel, text, wrap } from './art.js';
import { W, H } from './vga.js';

export class Dialog {
  constructor() { this.open = false; this.node = null; this.tree = null; this.rects = []; this.hover = null; this.onEnd = null; }

  start(tree, onEnd) {
    this.tree = tree; this.onEnd = onEnd || null;
    this.node = tree.start;
    this.open = true;
  }

  choose(i, game) {
    const n = this.tree.nodes[this.node];
    const opt = n.options[i];
    if (!opt) return;
    if (opt.effect) opt.effect(game);
    if (opt.next) { this.node = opt.next; return; }
    this.open = false;
    if (this.onEnd) this.onEnd(game, opt.result || 'done');
  }

  move(x, y) {
    this.hover = null;
    for (const r of this.rects)
      if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) this.hover = r.i;
  }

  hit(x, y) {
    for (const r of this.rects)
      if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return r.i;
    return null;
  }

  draw(ctx, gloss) {
    if (!this.open) return;
    const n = this.tree.nodes[this.node];
    fill(ctx, 0, 0, W, H, 'rgba(8,10,16,.42)');

    // --- what they said, top ------------------------------------------------
    const bw = 272, bx = (W - bw) / 2 | 0, inner = bw - 16;
    const lines = wrap(ctx, n.pt, inner, '8px "Courier New", monospace');
    const gl = gloss ? wrap(ctx, n.en, inner, '8px "Courier New", monospace') : [];
    const th = 20 + lines.length * 10 + (gl.length ? 7 + gl.length * 10 : 0) + 8;
    panel(ctx, bx, 10, bw, th);
    let ty = 18;
    if (n.speaker) { text(ctx, n.speaker.toUpperCase(), bx + 8, ty - 6, '#ffe9a8', '7px "Courier New", monospace'); ty += 5; }
    for (const l of lines) { text(ctx, l, bx + 8, ty, '#fff8e0'); ty += 10; }
    if (gl.length) {
      fill(ctx, bx + 4, ty + 2, bw - 8, gl.length * 10 + 5, '#20242c');
      ty += 6;
      for (const l of gl) { text(ctx, l, bx + 8, ty, '#9fe07a'); ty += 10; }
    }

    // --- what you can say back, bottom -------------------------------------
    this.rects = [];
    // measure first
    const opts = n.options.map(o => wrap(ctx, o.pt, inner - 14, '8px "Courier New", monospace'));
    const oh = opts.reduce((a, ls) => a + ls.length * 10 + 8, 0) + 14;
    const oy = H - oh - 8;
    panel(ctx, bx, oy, bw, oh);
    let yy = oy + 8;
    opts.forEach((ls, i) => {
      const hgt = ls.length * 10 + 6;
      const on = this.hover === i;
      fill(ctx, bx + 5, yy - 2, bw - 10, hgt, on ? 'rgba(255,232,170,.18)' : 'rgba(255,255,255,.04)');
      if (on) fill(ctx, bx + 5, yy - 2, 2, hgt, '#ffe9a8');
      text(ctx, `${i + 1}.`, bx + 8, yy, '#c9b894', '8px "Courier New", monospace');
      ls.forEach((l, li) => text(ctx, l, bx + 20, yy + li * 10, on ? '#fff8e0' : '#d8d4c8'));
      this.rects.push({ x: bx + 5, y: yy - 2, w: bw - 10, h: hgt, i });
      yy += hgt + 2;
    });
  }
}

// --- Act 2: getting Diogo to vouch ------------------------------------------
// The agent will not talk to the town joke. Diogo's word opens the door —
// and Diogo's price is three words Soeiro cannot say. Almost.
export const DIOGO_VOUCH = {
  start: 'n0',
  nodes: {
    n0: {
      speaker: 'Diogo',
      pt: 'Ó primo! Vieste ouvir a história? Senta, que eu ia agora na parte da água.',
      en: 'Cousin! Come to hear the story? Sit down, I was just getting to the part about the water.',
      options: [
        { pt: 'Vim propor-te uma parceria estratégica de imagem.',
          en: 'I have come to propose a strategic image partnership.',
          next: 'f1' },
        { pt: 'Preciso que digas ao florentino que sou de confiança.',
          en: 'I need you to tell the Florentine that I can be trusted.',
          next: 'f2' },
        { pt: 'Diogo. O mercado deu-te razão.',
          en: 'Diogo. The market proved you right.',
          next: 'n1' },
      ],
    },
    f1: {
      speaker: 'Diogo',
      pt: 'Já tenho trabalho, primo. Contar isto. Pagam-me em vinho e é um bom patrão.',
      en: 'I have a job, cousin. Telling this. They pay me in wine and it is a good employer.',
      options: [
        { pt: 'Reformulo a proposta.', en: 'Let me reformulate.', next: 'n0' },
      ],
    },
    f2: {
      speaker: 'Diogo',
      pt: 'E porque diria eu isso? Diz-me uma coisa verdadeira primeiro. Uma chega.',
      en: 'And why would I say that? Tell me one true thing first. One will do.',
      options: [
        { pt: 'Volto já.', en: 'I will come back to that.', next: 'n0' },
      ],
    },
    n1: {
      speaker: 'Diogo',
      pt: 'O Diogo pousa a caneca. A taberna inteira faz silêncio, o que nunca tinha acontecido. "...Diz lá isso outra vez."',
      en: 'Diogo puts down his mug. The whole tavern goes quiet, which has never happened. "...Say that again."',
      options: [
        { pt: 'O mercado deu-te razão.',
          en: 'The market proved you right.',
          result: 'win' },
        { pt: 'Ouviste perfeitamente à primeira.',
          en: 'You heard me perfectly well the first time.',
          next: 'f2' },
      ],
    },
  },
};

// --- Act 2: the deal --------------------------------------------------------
// The agent buys origin, not smell. And there is no honest exit from n1.
export const AGENT_DEAL = {
  start: 'n0',
  nodes: {
    n0: {
      speaker: 'o agente florentino',
      pt: 'Pimenta de Calecute, diz o papel. O papel tem boa letra. Conheço esta letra de algum lado.',
      en: 'Calicut pepper, the paper says. The paper has a fine hand. I know this hand from somewhere.',
      options: [
        { pt: 'A melhor letra da Casa da Índia.',
          en: 'The finest hand in the Casa da Índia.',
          next: 'n1' },
        { pt: 'Posso baixar o preço.',
          en: 'I can lower the price.',
          next: 'f1' },
      ],
    },
    f1: {
      speaker: 'o agente florentino',
      pt: '"Nunca diga isso primeiro." Escreve qualquer coisa no livro. Tens a sensação de que era sobre ti.',
      en: '"Never say that first." He writes something in the ledger. You have the feeling it was about you.',
      options: [
        { pt: 'Voltemos ao papel.', en: 'Let us return to the paper.', next: 'n0' },
      ],
    },
    n1: {
      speaker: 'o agente florentino',
      pt: 'O Marchionni leva as onze toneladas. E mais cem, entregues à chegada da próxima frota. Adianto agora, resto à entrega. Assine.',
      en: 'Marchionni will take the eleven tons. And a hundred more, delivered when the next fleet lands. An advance now, the rest on delivery. Sign.',
      options: [
        { pt: 'Assino.',
          en: 'I sign.',
          result: 'win' },
        { pt: 'Cem?! Eu tenho onze.',
          en: 'A hundred?! I have eleven.',
          next: 'f2' },
      ],
    },
    f2: {
      speaker: 'o agente florentino',
      pt: 'As onze são a amostra, presumo. Um homem com a melhor letra da Casa da Índia sabe onde há pimenta. Assine.',
      en: 'The eleven are the sample, I presume. A man with the finest hand in the Casa da Índia knows where pepper is found. Sign.',
      options: [
        { pt: 'Assino.',
          en: 'I sign.',
          result: 'win' },
        { pt: '…Assino.',
          en: '…I sign.',
          result: 'win' },
      ],
    },
  },
};

// --- Act 3: the verifier ----------------------------------------------------
// Marchionni pays verifiers. This one chewed leather off Africa for three
// months and knows what Calicut smells like. There is exactly one thing to
// say to him, and it is the shortest line in the game.
export const SOTA_PRECO = {
  start: 'n0',
  nodes: {
    n0: {
      speaker: 'o Sota',
      pt: 'Eu estive lá. Três meses a mastigar couro com as gengivas. Sei como cheira Calecute, e sei como cheira Barcelos com pimenta do Diogo esfregada por cima.',
      en: 'I was there. Three months chewing leather with my gums. I know what Calicut smells like, and I know what Barcelos smells like with Diogo\'s pepper rubbed on top.',
      options: [
        { pt: 'Isto é um produto de origem certificada.',
          en: 'This is a product of certified origin.',
          next: 'f1' },
        { pt: 'E quem acreditaria em ti, marinheiro?',
          en: 'And who would believe you, sailor?',
          next: 'f2' },
        { pt: 'Quanto?',
          en: 'How much?',
          result: 'win' },
      ],
    },
    f1: {
      speaker: 'o Sota',
      pt: 'Ele levanta a ponta do teu manifesto, que já leu. "Boa letra."',
      en: 'He lifts the corner of your manifest, which he has already read. "Fine hand."',
      options: [
        { pt: 'Reformulemos.', en: 'Let us reformulate.', next: 'n0' },
      ],
    },
    f2: {
      speaker: 'o Sota',
      pt: '"O florentino paga verificadores. O verificador sou eu. Acredita em mim por ofício."',
      en: '"The Florentine pays verifiers. I am the verifier. He believes me professionally."',
      options: [
        { pt: 'Entendido. Recuemos.', en: 'Understood. Let us step back.', next: 'n0' },
      ],
    },
  },
};

// --- Act 3: Dona Brízida invests --------------------------------------------
// She has watched every scheme in this alley for forty years. She does not
// buy promises. She buys collateral.
export const BRIZIDA_INV = {
  start: 'n0',
  nodes: {
    n0: {
      speaker: 'Dona Brízida',
      pt: 'Ouvi dizer que o florentino te comprou pimenta. Tenho as rendas do homem de Alfama paradas debaixo do colchão. Quanto pagas, e não me respondas com uma palavra que não exista.',
      en: 'I hear the Florentine bought pepper from you. I have the Alfama man\'s rents sitting under my mattress. What do you pay — and do not answer me with a word that does not exist.',
      options: [
        { pt: 'Um retorno garantido de vinte por cento.',
          en: 'A guaranteed return of twenty per cent.',
          next: 'f1' },
        { pt: 'Uma posição preferencial na estrutura de capital.',
          en: 'A preferential position in the capital structure.',
          next: 'f2' },
        { pt: 'Se eu falhar, ficas com o armazém e com a tabuleta.',
          en: 'If I fail, you get the warehouse and the signboard.',
          next: 'n1' },
      ],
    },
    f1: {
      speaker: 'Dona Brízida',
      pt: '"Garantido por quem? Por ti?" Volta ao bordado. O bordado está mais seguro.',
      en: '"Guaranteed by whom? By you?" She returns to the needlework. The needlework is a safer investment.',
      options: [
        { pt: 'Deixa-me recomeçar.', en: 'Let me start again.', next: 'n0' },
      ],
    },
    f2: {
      speaker: 'Dona Brízida',
      pt: '"Isso são oito palavras e não vi nenhuma moeda no meio delas."',
      en: '"That was eight words and I did not see a single coin among them."',
      options: [
        { pt: 'Deixa-me recomeçar.', en: 'Let me start again.', next: 'n0' },
      ],
    },
    n1: {
      speaker: 'Dona Brízida',
      pt: 'Pousa o bordado. "A tabuleta não, que é bonita e não é tua ideia vendê-la. O armazém serve. Cinco mil. E Soeiro — eu sei onde dormes, porque a cama é minha."',
      en: 'She puts down the needlework. "Not the signboard — it is pretty, and selling it was never your idea. The warehouse will do. Five thousand. And Soeiro — I know where you sleep, because the bed is mine."',
      options: [
        { pt: 'Aceito.', en: 'Agreed.', result: 'win' },
      ],
    },
  },
};

// --- Act 4: the gangplank ---------------------------------------------------
// The master has heard every speech ever made on a quay. For the first time
// in the game, one of the options is a plain sentence.
export const MESTRE_EMBARQUE = {
  start: 'n0',
  nodes: {
    n0: {
      speaker: 'o mestre',
      pt: 'Porão do Marchionni. O papel é bom.' + ' Falta-me saber do homem. Porque vais tu para o mar, escrivão?',
      en: 'Marchionni hold-space. The paper is good. The man I still need to know. Why are you going to sea, clerk?',
      options: [
        { pt: 'Vejo uma oportunidade de crescimento numa rota em expansão.',
          en: 'I see a growth opportunity on an expanding route.',
          next: 'f1' },
        { pt: 'Vou supervisionar pessoalmente o meu investimento.',
          en: 'I am going to personally oversee my investment.',
          next: 'f2' },
        { pt: 'Tenho medo. Mas tenho mais medo de ficar.',
          en: 'I am afraid. But I am more afraid of staying.',
          result: 'win' },
      ],
    },
    f1: {
      speaker: 'o mestre',
      pt: 'Cospe para o rio, sem pressa. "Já ouvi discursos, escrivão. O mar não ouve nenhum."',
      en: 'He spits into the river, unhurried. "I have heard speeches, clerk. The sea listens to none of them."',
      options: [
        { pt: 'Deixa-me responder outra vez.', en: 'Let me answer again.', next: 'n0' },
      ],
    },
    f2: {
      speaker: 'o mestre',
      pt: '"O teu investimento vai no porão. Tu és peso. Dá-me uma razão que pese menos."',
      en: '"Your investment travels in the hold. You are weight. Give me a reason that weighs less."',
      options: [
        { pt: 'Deixa-me responder outra vez.', en: 'Let me answer again.', next: 'n0' },
      ],
    },
  },
};

// --- the Act 1 pitch --------------------------------------------------------
// Soeiro cannot pay. Soeiro will not say so. The man cannot do arithmetic,
// but he can count ships.
export const PITCH_RUIVO = {
  start: 'n0',
  nodes: {
    n0: {
      speaker: 'o homem do Ruivo',
      pt: 'O senhor Ruivo pergunta, com todo o respeito, se tens os quatro mil reais.',
      en: 'Senhor Ruivo asks, with every respect, whether you have the four thousand reais.',
      options: [
        { pt: 'Tenho melhor: uma oportunidade de co-investimento estruturado.',
          en: 'I have better: a structured co-investment opportunity.',
          next: 'f1' },
        { pt: 'Tenho um produto premium de origem alternativa pronto para o mercado.',
          en: 'I have a premium product of alternative origin, ready for market.',
          next: 'f2' },
        { pt: 'Antes de falarmos de dinheiro: quantas naus voltaram hoje?',
          en: 'Before we talk money: how many ships came back today?',
          next: 'n1' },
      ],
    },
    f1: {
      speaker: 'o homem do Ruivo',
      pt: 'O senhor Ruivo não co-investe. O senhor Ruivo cobra. São ofícios diferentes.',
      en: 'Senhor Ruivo does not co-invest. Senhor Ruivo collects. These are different trades.',
      options: [
        { pt: 'Compreendo. Recuo à pergunta anterior.', en: 'Understood. I withdraw to the previous question.', next: 'n0' },
      ],
    },
    f2: {
      speaker: 'o homem do Ruivo',
      pt: 'Isso é a tua pimenta com outro nome. Eu estava lá quando lhe compraste o nome antigo.',
      en: 'That is your pepper with a new name. I was there when you bought it under the old name.',
      options: [
        { pt: 'O posicionamento evoluiu. Mas avancemos.', en: 'The positioning has evolved. But let us move on.', next: 'n0' },
      ],
    },
    n1: {
      speaker: 'o homem do Ruivo',
      pt: 'Duas. Lisboa inteira as contou.',
      en: 'Two. All of Lisbon counted them.',
      options: [
        { pt: 'Duas naus. Para uma cidade inteira a gritar por pimenta. Quem tiver pimenta daqui a um mês, vende-a ao preço que quiser. Diz ao senhor Ruivo que ele não tem um devedor — tem um fornecedor.',
          en: 'Two ships. For an entire city screaming for pepper. Whoever holds pepper a month from now names his price. Tell Senhor Ruivo he does not have a debtor — he has a supplier.',
          result: 'win' },
        { pt: 'Duas! E eu previa zero. O meu modelo só errou por duas.',
          en: 'Two! And I predicted zero. My model was only off by two.',
          next: 'f3' },
      ],
    },
    f3: {
      speaker: 'o homem do Ruivo',
      pt: 'O teu modelo. O senhor Ruivo pediu-me para te partir um dedo por cada vez que dissesses "modelo".',
      en: 'Your model. Senhor Ruivo asked me to break one finger for every time you said "model".',
      options: [
        { pt: 'Voltemos às naus.', en: 'Let us return to the ships.', next: 'n1' },
      ],
    },
  },
};
