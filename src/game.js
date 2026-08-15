// game.js — loop, input, and the Ribeira puzzle chain.

import { Screen, W, H, RS, RW, RH } from './vga.js';
import { Actor } from './actor.js';
import { UI, VERBS } from './ui.js';
import { Audio, SONG_ABERTURA } from './audio.js';
import { ribeira } from './scenes/ribeira.js';
import { beco } from './scenes/beco.js';
import { escritorio } from './scenes/escritorio.js';
import { armazem } from './scenes/armazem.js';
import { taberna } from './scenes/taberna.js';
import { cais } from './scenes/cais.js';
import { Intro, OUTRO_BEATS } from './intro.js';
import { Menu } from './menu.js';
import { Dialog, PITCH_RUIVO, DIOGO_VOUCH, AGENT_DEAL, SOTA_PRECO, BRIZIDA_INV, MESTRE_EMBARQUE } from './dialog.js';
import { drawDissolve, loadImage } from './fx.js';

const SCENES = { ribeira, beco, escritorio, armazem, taberna, cais };
import { panel, text, wrap, fill, vgrad } from './art.js';

const SAVE_KEY = 'soeiro.save.v1';

class Game {
  constructor() {
    this.screen = new Screen(document.getElementById('screen'));
    this.audio = new Audio();
    this.ui = new UI();
    this.scene = ribeira;
    this.score = 0;
    this.debt = 4000;          // the anti-score. It only ever goes up.
    this.inv = [];
    this.flags = {};
    this.dead = null;
    this.player = new Actor(this.scene.start.x, this.scene.start.y, {
      cloak: '#3b3a46', hood: '#2a2933',          // a clerk's gown, not a cloak
      onStep: () => this.audio.sfx('step'),
    });
    this.bg = document.createElement('canvas');
    this.bg.width = RW; this.bg.height = RH;
    this.paintBg();
    this.checkHotspots();
    this.bindInput();
    this.last = performance.now();
    this.intro = new Intro();
    this.menu = new Menu();
    this.dialog = new Dialog();
    this.actEnd = null;
    this.trans = null;
    this.caption = null;
    this.showTitleMenu();
    requestAnimationFrame(t => this.frame(t));
  }

  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (_) { return false; } }

  // The scene background: the user's painted PNG when it exists and has
  // loaded, the procedural paint() otherwise. The quantize pass in present()
  // gives both the same VGA finish, so a swap mid-session is seamless.
  paintBg() {
    const s = this.scene;
    const c = this.bg.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, RW, RH);
    let painted = false;
    if (s.image) {
      const rec = loadImage(s.image, () => { if (this.scene === s) this.paintBg(); });
      // Full source resolution -> full buffer resolution. This is where the
      // sharpness comes from.
      if (rec.ready) { c.drawImage(rec.img, 0, 0, RW, RH); painted = true; }
    }
    // Procedural fallback and decorations draw in 320x200 logic space.
    c.setTransform(RS, 0, 0, RS, 0, 0);
    if (!painted) s.paint(c);
    if (s.decorate) s.decorate(c, this);  // signboard lettering, stencilled sacks…
  }

  startTransition(to, at) {
    if (this.trans) return;
    this.trans = { phase: 'out', t: 0, to, at };
  }

  showTitleMenu() {
    this.menuKind = 'title';
    this.menu.show(null, [
      { id: 'novo',      label: 'NOVO JOGO' },
      { id: 'continuar', label: 'CONTINUAR', disabled: !this.hasSave() },
      { id: 'som',       label: 'SOM: ' + (this.audio.musicOn ? 'LIGADO' : 'DESLIGADO') },
      { id: 'sobre',     label: 'SOBRE' },
    ], { style: 'strip', y: 176 });
  }

  showGameMenu() {
    this.menuKind = 'game';
    this.menu.show('MENU', [
      { id: 'voltar',    label: 'CONTINUAR' },
      { id: 'guardar',   label: 'GUARDAR' },
      { id: 'restaurar', label: 'RESTAURAR', disabled: !this.hasSave() },
      { id: 'recomecar', label: 'RECOMEÇAR' },
      { id: 'som',       label: 'SOM: ' + (this.audio.musicOn ? 'LIGADO' : 'DESLIGADO') },
    ]);
  }

  handleMenu(id) {
    switch (id) {
      case 'novo':
        // A real reset — a finished (or abandoned) game must not leak state
        // into the next one.
        try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
        this.score = 0; this.debt = 4000; this.inv = []; this.flags = {};
        this.dead = null; this.actEnd = null; this.outro = null;
        this.fim = false; this.pendingOutro = false; this._fimT = 0;
        this.goScene('ribeira', { x: ribeira.start.x, y: ribeira.start.y });
        this.menu.hide();
        this.intro = new Intro();
        this.intro.i = 0; this.intro.fade = 0;
        if (this.musicStarted) { this.audio.play(SONG_ABERTURA); this.currentSong = SONG_ABERTURA; }
        break;
      case 'continuar':
        this.menu.hide(); this.intro.done = true; this.load(); break;
      case 'voltar':
        this.menu.hide(); break;
      case 'guardar':
        this.save(); this.menu.hide();
        this.ui.say('Guardado.', 'Saved.'); break;
      case 'restaurar':
        this.menu.hide(); this.load(); break;
      case 'recomecar':
        try { localStorage.removeItem(SAVE_KEY); } catch (_) {}
        location.reload(); break;
      case 'som':
        this.audio.setEnabled(!this.audio.musicOn);
        this.menuKind === 'title' ? this.showTitleMenu() : this.showGameMenu();
        break;
      case 'sobre':
        this.menu.hide(); this.intro.done = true;
        this.ui.say('Lisboa, 1499. Um jogo de aventura à maneira antiga. Rato esquerdo age, rato direito muda a acção, TAB traduz, ESC abre o menu. As marcas douradas a pulsar são saídas. A vela na barra (ou a tecla D) dá uma dica — mas só em português.',
                    'Lisbon, 1499. An adventure game in the old style. Left mouse acts, right mouse changes the action, TAB translates, ESC opens the menu. The pulsing gold marks are exits. The candle on the bar (or the D key) gives a hint — but only in Portuguese.');
        break;
    }
  }

  award(n) { this.score += n; this.audio.sfx('points'); this.save(); }

  // Every clever escape costs him more than it earns.
  owe(n, pt, en) {
    this.debt += n;
    this.audio.sfx('nope');
    this.save();
    if (pt) this.ui.say(pt, en);
  }
  give(pt, en) { this.inv.push({ pt, en }); this.audio.sfx('take'); }
  has(pt) { return this.inv.some(i => i.pt === pt); }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        score: this.score, debt: this.debt, inv: this.inv, flags: this.flags,
        scene: this.scene.id, x: this.player.x, y: this.player.y,
      }));
    } catch (_) {}
  }

  load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
      if (!s) return false;
      this.score = s.score || 0;
      this.debt = s.debt ?? 4000;
      this.inv = s.inv || [];
      this.flags = s.flags || {};
      this.dead = null;
      this.goScene(s.scene || 'ribeira',
                   { x: s.x ?? ribeira.start.x, y: s.y ?? ribeira.start.y });
      return true;
    } catch (_) { return false; }
  }

  die(pt, en) { this.dead = { pt, en }; this.audio.sfx('death'); }
  revive() {
    this.dead = null;
    this.player.x = this.player.tx = this.scene.start.x;
    this.player.y = this.player.ty = this.scene.start.y;
  }

  bindInput() {
    const cv = this.screen.out;
    this.mouse = { x: 160, y: 100 };

    cv.addEventListener('pointermove', e => {
      const p = this.screen.toGame(e.clientX, e.clientY);
      this.mouse = p;
      if (this.menu.open) { this.menu.move(p.x, p.y); return; }
      if (this.dialog.open) { this.dialog.move(p.x, p.y); return; }
      this.ui.move(p.x, p.y);
      const h = this.hotspotAt(p.x, p.y);
      const v = VERBS.find(v => v.id === this.ui.verb);
      this.ui.hover = h ? `${v.label} ${h.name}` : '';
    });

    // Right-click cycles the verb. This is the primary control; the drop-down
    // bar is the secondary one.
    cv.addEventListener('contextmenu', e => {
      e.preventDefault();
      this.ui.cycleVerb();
      this.flags.usouVerbo = true;
      this.audio.init();
      this.audio.sfx('step');
    });

    cv.addEventListener('pointerdown', e => {
      if (e.button === 2) return;
      e.preventDefault();
      this.audio.init();
      if (!this.musicStarted) {
        // The title and the intro get the dramatic theme; the city waits.
        const opening = this.intro && !this.intro.done;
        this.currentSong = opening ? SONG_ABERTURA : this.scene.music;
        this.audio.play(this.currentSong);
        this.musicStarted = true;
      }
      const p = this.screen.toGame(e.clientX, e.clientY);
      if (this.menu.open) {
        const id = this.menu.hit(p.x, p.y);
        if (id) this.handleMenu(id);
        return;
      }
      if (this.fim) { this.fim = false; this.showTitleMenu(); return; }
      if (this.outro) {
        if (!this.outro.done) this.outro.advance();
        if (this.outro.done) { this.outro = null; this.fim = true; }
        return;
      }
      if (this.actEnd) { this.actEnd = null; return; }
      if (this.dialog.open) {
        const i = this.dialog.hit(p.x, p.y);
        if (i != null) this.dialog.choose(i, this);
        return;
      }
      if (this.intro && !this.intro.done) {
        this.intro.advance();
        if (this.intro.done) {
          // Out of the overture, into the city.
          if (this.scene.music && this.currentSong !== this.scene.music) {
            this.audio.play(this.scene.music);
            this.currentSong = this.scene.music;
          }
        }
        if (this.intro.done) this.ui.say(
          'Deves quatro mil reais ao Ruivo, e o Ruivo cobra hoje. O plano é simples: pedir dinheiro novo ao cambista — do outro lado da praça — para pagar o empréstimo velho. Só tens de atravessar Lisboa inteira para chegar à porta dele.',
          'You owe Ruivo four thousand reais, and Ruivo collects today. The plan is simple: borrow new money from the moneylender — across the square — to pay off the old loan. You only have to get through all of Lisbon to reach his door.');
        return;
      }
      if (this.trans) return;
      if (this.dead) { this.revive(); return; }
      if (this.ui.click(p.x, p.y, this)) {
        if (this.ui.menuRequested) { this.ui.menuRequested = false; this.showGameMenu(); }
        if (this.ui.hintRequested) { this.ui.hintRequested = false; this.showHint(); }
        // The master's last line has been read; the ship is waiting.
        if (this.pendingOutro && !this.ui.msg) {
          this.pendingOutro = false;
          this.outro = new Intro(OUTRO_BEATS);
          this.audio.play(SONG_ABERTURA);          // the theme returns for the ending
          this.currentSong = SONG_ABERTURA;
        }
        return;
      }
      if (this.ui.invOpen) { this.ui.invOpen = false; return; }
      this.act(p.x, p.y);
    });

    window.addEventListener('keydown', e => {
      if (e.key === 'Tab') { e.preventDefault(); this.ui.gloss = !this.ui.gloss; }
      if (e.key === 'r' || e.key === 'R') { localStorage.removeItem(SAVE_KEY); location.reload(); }
      if (e.key === 'Escape') {
        if (this.menu.open) return this.menu.hide();
        if (this.outro) { this.outro = null; this.fim = true; return; }
        if (this.intro && !this.intro.done) { this.intro.done = true; return; }
        this.showGameMenu();
      }
      const n = parseInt(e.key, 10);
      if (this.dialog.open) {
        if (n >= 1 && n <= 3) this.dialog.choose(n - 1, this);
        return;
      }
      if (e.key === ' ') { e.preventDefault(); this.ui.cycleVerb(); this.flags.usouVerbo = true; }
      if ((e.key === 'd' || e.key === 'D') && this.intro.done && !this.menu.open && !this.dead)
        { this.ui.msg = null; this.showHint(); }
      if (n >= 1 && n <= VERBS.length) { this.ui.verb = VERBS[n - 1].id; this.flags.usouVerbo = true; }
    });

    window.addEventListener('resize', () => this.screen.resize());
  }

  // hotspotAt returns the first match, so an earlier hotspot silently eats
  // clicks meant for a later one. That is invisible in play and produces
  // "I clicked it and nothing happened". Shout about it at load instead.
  checkHotspots() {
    const hs = this.scene.hotspots;
    for (let i = 0; i < hs.length; i++)
      for (let j = i + 1; j < hs.length; j++) {
        const a = hs[i], b = hs[j];
        if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h)
          console.warn(`[${this.scene.id}] "${a.id}" overlaps "${b.id}" — ` +
                       `"${a.id}" wins those clicks. Reorder or shrink.`);
      }
  }

  // A DICA: one sentence, in character, pointing at the next step — and only
  // in Portuguese. When you are stuck is when you are motivated to read.
  hintFor() {
    const F = this.flags, has = p => this.has(p);
    // Each act's hints only exist while that act is live, so a strange save
    // can never dredge up advice about a door already closed.
    const a1 = () => !F.acto1Fim, a2 = () => F.acto1Fim && !F.acto2Fim,
          a3 = () => F.acto2Fim && !F.acto3Fim, a4 = () => F.acto3Fim;
    const chain = [
      // Acto 1
      [() => a1() && !F.multidaoAberta && !has('uma sardinha') && !F.falouPeixeira,
        'Toda a gente foi ver o Gama. Fala com quem ficou a trabalhar — a peixeira, à direita.'],
      [() => a1() && !F.multidaoAberta && !has('uma sardinha'),
        'A peixeira ofereceu-te uma sardinha. PEGA nela. Uma sardinha de três dias é uma ferramenta.'],
      [() => a1() && !F.multidaoAberta,
        'Ninguém abre caminho a um escrivão. Toda a gente abre caminho a uma sardinha de três dias. USA-a na multidão.'],
      [() => a1() && !F.chegou,
        'A porta do cambista fica do outro lado da praça, à esquerda. Vai lá bater enquanto o sol não se põe.'],
      [() => a1() && !F.diogoFoi,
        'O teu primo Diogo, no escritório, não se cala com a Índia. Diz-lhe que há por aí um público maior.'],
      [() => a1() && !has('a bolsa de pimenta') && !F.pivotPronto,
        'A bolsa de pimenta do Diogo ficou sem dono em cima do móvel. PEGA nela.'],
      [() => a1() && !F.pivotPronto,
        'No armazém, USA a pimenta verdadeira nos teus sacos. O nariz acredita antes dos olhos.'],
      [() => !F.acto1Fim,
        'O homem do Ruivo não sabe ler, mas sabe contar naus. FALA com ele e pergunta-lhe quantas voltaram.'],
      // Acto 2
      [() => a2() && !F.escrivaoFora,
        'O escrivão-mor não levanta a cabeça há trinta anos. Mas tem nariz. USA nele a coisa mais mal-cheirosa do teu saco.'],
      [() => a2() && !has('o selo'),
        'O selo da Casa da Índia ficou órfão na secretária do meio. PEGA nele.'],
      [() => a2() && !has('papel de registo') && !has('o manifesto falso'),
        'As prateleiras do escritório têm papel em branco. Todos os grandes negócios começam em branco.'],
      [() => a2() && !has('o manifesto falso'),
        'USA a tua secretária. Onze anos de prática de letra têm de servir para alguma coisa.'],
      [() => a2() && !has('um pincel de pez') && !F.sacosProntos,
        'Atrás dos barris do armazém há pez de calafate e uma trincha. PEGA neles.'],
      [() => a2() && !F.sacosProntos,
        'Um saco de Calecute vem marcado. USA o pincel nos sacos e baptiza-os.'],
      [() => a2() && !F.agenteRecusou,
        'Na taberna, à porta pequena da Ribeira, há um florentino que compra pimenta. FALA com ele. Vai correr mal, mas fala.'],
      [() => a2() && !F.diogoVouchou,
        'O Diogo só te apresenta ao florentino se lhe disseres uma coisa verdadeira. Só uma. Sobre quem tinha razão.'],
      [() => !F.acto2Fim,
        'Volta ao florentino com papéis e marcas. Elogia a letra do manifesto — é a única frase verdadeira que tens.'],
      // Acto 3
      [() => a3() && !F.sotaPago1,
        'O homem magro ao pé dos teus sacos esteve em Calecute. Não discutas com o nariz dele. Pergunta-lhe só: quanto?'],
      [() => a3() && !F.invBrizida,
        'A Dona Brízida não compra promessas. Compra garantias. Oferece-lhe a única coisa que tens com paredes.'],
      [() => a3() && !F.invBicudo,
        'O Bicudo ouviu falar do teu contrato. FALA com ele ao balcão e prepara-te para mudar de tabuleta.'],
      [() => a3() && !F.invRuivo,
        'O homem do Ruivo tem novidades do patrão. Vai ao beco ouvi-las. Não é uma pergunta.'],
      [() => !F.acto3Fim,
        'Tens o capital de toda a gente. Leva-o ao florentino, na taberna, e ouve o que ele te diz do preço da pimenta.'],
      // Acto 4
      [() => a4() && !has('a carta de porão'),
        'O florentino vende espaço de porão na frota de Cabral. Custa exactamente o que tens. FALA com ele.'],
      [() => a4() && !F.embarcou,
        'No Cais do Restelo, o mestre já ouviu todos os discursos de Lisboa. Experimenta a única frase que nunca disseste: a verdadeira.'],
      [() => true,
        'Sobe. O resto é com o mar.'],
    ];
    for (const [cond, txt] of chain) if (cond()) return txt;
  }

  showHint() {
    this.audio.sfx('take');
    this.ui.say(this.hintFor(), null, 'dica');
  }

  // Hotspots may declare `when: flags => bool` — present only in the game
  // states where the thing is actually there. Keeps labels from pointing at
  // people who have not arrived yet.
  hotspotAt(x, y) {
    for (const h of this.scene.hotspots) {
      if (h.when && !h.when(this.flags, this)) continue;
      if (x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) return h;
    }
    return null;
  }

  clampWalk(x, y) {
    const w = this.scene.walk;
    let tx = Math.max(w.left, Math.min(w.right, x));
    const ty = Math.max(w.top, Math.min(w.bottom, y));
    const g = this.scene.gate;
    let blocked = false;
    if (g && !this.flags[g.flag] && tx < g.x) { tx = g.x; blocked = true; }
    return { x: tx, y: ty, blocked };
  }

  goScene(id, at) {
    const s = SCENES[id];
    if (!s) return;
    this.scene = s;
    this.paintBg();
    this.checkHotspots();
    this.player.x = this.player.tx = at.x;
    this.player.y = this.player.ty = at.y;
    this.player.onArrive = null;
    this.player.moving = false;
    // Walk in from the doorway rather than materialising in the middle of the room.
    if (at.wx != null) this.player.goTo(at.wx, at.wy ?? at.y);
    if (s.music && s.music !== this.currentSong) {
      this.audio.play(s.music); this.currentSong = s.music;
    }
    this.ui.hover = '';
    this.caption = { text: s.name, t: 0 };
    // First visit to the operação: the storage bill, mechanised sunk cost.
    if (s.id === 'armazem' && !this.flags.armazemVisto) {
      this.flags.armazemVisto = true;
      this.owe(150);
      this.ui.say(
        'O guarda do armazém risca mais um traço no portal. Cento e cinquenta reais de armazenagem, esta semana. A malagueta custa dinheiro até parada.',
        'The warehouse keeper scratches another mark on the doorpost. A hundred and fifty reais of storage, this week. The malagueta costs money even standing still.');
    }
    // Act 2: the tavern remembers, out loud, on arrival.
    if (s.id === 'taberna' && !this.flags.tabernaVista) {
      this.flags.tabernaVista = true;
      this.ui.say(
        'Entras. Meio segundo de silêncio. Depois, do fundo: "Ó PROFETA! Então e o Gama? Morreu no mar?" A taberna inteira acha piada. A taberna inteira achou piada ontem. Vai achar amanhã.',
        'You walk in. Half a second of silence. Then, from the back: "HEY PROPHET! How about Gama? Die at sea, did he?" The whole tavern laughs. The whole tavern laughed yesterday. It will laugh tomorrow.');
    }
    // Act 2: the rent rises again. It is nothing personal. It never is.
    if (s.id === 'beco' && this.flags.acto1Fim && !this.flags.renda2) {
      this.flags.renda2 = true;
      this.owe(400);
      this.ui.say(
        'A Dona Brízida acena-te do cimo das escadas. O homem de Alfama trouxe um primo, e o primo também paga sem discutir. A renda subiu outra vez. Ela lamenta. Lamenta genuinamente, o que não muda o número.',
        'Dona Brízida waves from the top of the stairs. The Alfama man has brought a cousin, and the cousin also pays without arguing. The rent has gone up again. She is sorry. Genuinely sorry, which does not change the number.');
    }
    // Act 3: the verifier is in the warehouse and the sacks are his evidence.
    if (s.id === 'armazem' && this.flags.acto2Fim && !this.flags.sotaVisto) {
      this.flags.sotaVisto = true;
      this.ui.say(
        'Há um homem encostado aos teus sacos. Magro como uma adriça, lenço vermelho, a mastigar coisa nenhuma. Não lhe perguntas quem é. Ele não pergunta se pode estar ali. Já sabem os dois.',
        'There is a man leaning on your sacks. Thin as a halyard, red kerchief, chewing on nothing. You do not ask who he is. He does not ask if he may be there. You both already know.');
    }
    // Act 3: word travels. The second instalment of his silence falls due.
    if (s.id === 'armazem' && this.flags.sotaPago1 && !this.flags.sotaPago2 &&
        (this.flags.invBrizida ? 1 : 0) + (this.flags.invBicudo ? 1 : 0) + (this.flags.invRuivo ? 1 : 0) >= 2) {
      this.flags.sotaPago2 = true;
      this.owe(1500);
      this.ui.say(
        '"Os teus sócios são faladores," diz o Sota, sem abrir os olhos. "Quanto mais gente acredita em ti, mais vale o meu silêncio. Mil e quinhentos."',
        '"Your partners talk," says the Sota, without opening his eyes. "The more people believe you, the more my silence is worth. Fifteen hundred."');
    }
    this.save();
  }

  // Every exit gets a soft pulsing marker: chevrons at the screen edges,
  // a bobbing diamond over doorways. Sierra made you find exits by walking
  // into walls; we can afford to be kinder.
  drawExits(ctx, t) {
    for (const h of this.scene.hotspots) {
      if (!h.to) continue;
      if (h.when && !h.when(this.flags, this)) continue;
      const pulse = (Math.sin(t * 2.8 + h.x * 0.7) + 1) / 2;
      const a = 0.40 + pulse * 0.35;
      if (h.x + h.w >= W - 6) {
        this._chevron(ctx, W - 6 - pulse * 2, h.y + h.h / 2, 1, a);       // →
      } else if (h.x <= 6) {
        this._chevron(ctx, 6 + pulse * 2, h.y + h.h / 2, -1, a);          // ←
      } else {
        // a doorway: diamond floating just above it, bobbing
        const x = h.x + h.w / 2, y = h.y - 5 - pulse * 2.5;
        ctx.fillStyle = `rgba(10,8,4,${a * 0.7})`;
        ctx.beginPath();
        ctx.moveTo(x, y - 4.6); ctx.lineTo(x + 3.6, y); ctx.lineTo(x, y + 4.6); ctx.lineTo(x - 3.6, y);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgba(255,228,150,${a})`;
        ctx.beginPath();
        ctx.moveTo(x, y - 3.6); ctx.lineTo(x + 2.8, y); ctx.lineTo(x, y + 3.6); ctx.lineTo(x - 2.8, y);
        ctx.closePath(); ctx.fill();
      }
    }
  }

  _chevron(ctx, x, y, dir, a) {
    for (const [col, off] of [[`rgba(10,8,4,${a * 0.7})`, 1], [`rgba(255,228,150,${a})`, 0]]) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x - 3 * dir + off * dir, y - 5);
      ctx.lineTo(x + 3 * dir + off * dir, y);
      ctx.lineTo(x - 3 * dir + off * dir, y + 5);
      ctx.lineTo(x - 1 * dir + off * dir, y);
      ctx.closePath(); ctx.fill();
    }
  }

  drawCaption(ctx) {
    if (!this.caption) return;
    const T = this.caption.t;
    const a = T < 0.3 ? T / 0.3 : T > 1.5 ? Math.max(0, 1 - (T - 1.5) / 0.6) : 1;
    if (a <= 0) { this.caption = null; return; }
    ctx.font = '8px "Courier New", monospace';
    const w = ctx.measureText(this.caption.text).width + 14;
    const x = (W - w) / 2 | 0;
    ctx.globalAlpha = a;
    fill(ctx, x, H - 26, w, 13, 'rgba(8,10,16,.72)');
    fill(ctx, x, H - 26, w, 1, 'rgba(220,196,140,.45)');
    ctx.textAlign = 'center';
    text(ctx, this.caption.text, W / 2, H - 23, '#ffe9a8');
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  act(x, y) {
    const h = this.hotspotAt(x, y);
    const verb = this.ui.verb;

    // Doorways: walk there, then change room.
    if (h && h.to && verb !== 'olhar') {
      const t = this.clampWalk(h.x + h.w / 2, this.scene.walk.top + 8);
      this.player.goTo(t.x, t.y, () => {
        if (t.blocked) return this.ui.say(this.scene.gate.blocked[0], this.scene.gate.blocked[1]);
        this.audio.sfx('thud');
        this.startTransition(h.to, h.at);
      });
      return;
    }

    if (verb === 'andar' || !h) {
      const t = this.clampWalk(x, y);
      this.player.goTo(t.x, t.y, t.blocked
        ? () => this.ui.say(this.scene.gate.blocked[0], this.scene.gate.blocked[1])
        : null);
      return;
    }

    const t = this.clampWalk(h.x + h.w / 2, this.scene.walk.top + 6);
    this.player.goTo(t.x, t.y, () => {
      if (t.blocked && h.x + h.w < this.scene.gate.x)
        return this.ui.say(this.scene.gate.blocked[0], this.scene.gate.blocked[1]);
      this.resolve(h, verb);
    });
  }

  resolve(h, verb) {
    const say = (pt, en, who) => this.ui.say(pt, en, who);
    const F = this.flags;

    if (h.deadly && verb !== 'olhar') {
      return this.die(
        'Entras no Tejo. O Tejo, que já engoliu nadadores melhores do que tu, não faz cerimónia.',
        'You step into the Tagus. The Tagus, which has swallowed better swimmers than you, does not stand on ceremony.');
    }

    if (h.id === 'peixeira') {
      if (verb === 'falar') {
        // Act 4: the farewell, and the fish that will not spoil.
        if (F.acto3Fim && !F.peixeSeco) {
          F.peixeSeco = true;
          this.give('um peixe seco', 'a dried fish');
          this.award(20);
          return say('"Vais para o mar, dizem." Embrulha-te um peixe seco em pano limpo. "Este não se estraga. Volta, ó filho." É a única pessoa em Lisboa que te pede que voltes e não é por causa de dinheiro.',
            '"They say you are going to sea." She wraps a dried fish in clean cloth. "This one does not spoil. Come back, love." She is the only person in Lisbon asking you to come back for reasons that are not money.',
            'a peixeira');
        }
        // Act 3: the one investor he will not take.
        if (F.acto2Fim && !F.peixeiraOferta) {
          F.peixeiraOferta = true;
          this.award(40);
          return say('"Ó filho, dizem que agora és homem de negócios." Tira uma lata de debaixo da banca. Trinta anos de moedas pequenas. "Queres? Para o teu negócio." E tu, que hoje aceitaste dinheiro de um agiota, de uma senhoria e de um chantagista, dizes que não. É a única coisa decente que fazes esta semana, e ela nunca vai saber.',
            '"They tell me you are a businessman now, love." She pulls a tin from under the stall. Thirty years of small coins. "Do you want it? For your business." And you, who today took money from a loan shark, a landlady and a blackmailer, say no. It is the only decent thing you do all week, and she will never know it.',
            'a peixeira');
        }
        F.falouPeixeira = true;
        return say('Ela olha para ti como quem já te viu passar mil vezes. "Ó filho, tens fome? Leva uma. Hoje não me pagas."',
          'She looks at you like someone who has watched you go past a thousand times. "Are you hungry, love? Take one. You don\'t pay me today."',
          'a peixeira');
      }
      if (verb === 'olhar')
        return say('Trinta anos a vender sardinha no mesmo degrau. Não tem plano, não tem sócios, não tem dívida. Nunca lhe passou pela cabeça que isso fosse pouco.',
          'Thirty years selling sardines on the same step. No plan, no partners, no debt. It has never once crossed her mind that this might be too little.');
      if (verb === 'pegar') {
        if (this.has('uma sardinha'))
          return say('Uma chega. Uma chega perfeitamente.', 'One is enough. One is more than enough.');
        this.give('uma sardinha', 'a sardine');
        this.award(10);
        return say('Aceitas a sardinha. É a primeira coisa que alguém te dá hoje sem querer nada em troca. Tem três dias.',
          'You accept the sardine. It is the first thing anyone has given you today without wanting something back. It is three days old.');
      }
    }

    if (h.id === 'multidao') {
      // The morning after: the square remembers the party, thinly.
      if (F.acto1Fim && verb === 'olhar')
        return say('Meia dúzia de pessoas onde ontem esteve Lisboa inteira. A festa acabou. As dívidas, curiosamente, não.',
          'Half a dozen people where all of Lisbon stood yesterday. The party is over. The debts, curiously, are not.');
      if (F.acto1Fim && verb === 'falar')
        return say('"Ó profeta." Já nem se riem com vontade. É quase pior.',
          '"Hey, prophet." They do not even laugh with conviction any more. It is almost worse.');
      if (verb === 'usar') {
        if (!this.has('uma sardinha'))
          return say('Não tens nada que uma multidão respeite.', 'You have nothing a crowd respects.');
        if (F.multidaoAberta)
          return say('Já abriste caminho. Não abuses.', "You've already made your path. Don't push it.");
        F.multidaoAberta = true;
        this.award(25);
        return say('Levantas a sardinha acima da cabeça e avanças. Lisboa, que não se afasta por reis, afasta-se por isto. O caminho até à porta do cambista está aberto.',
          'You raise the sardine above your head and walk. Lisbon, which will not step aside for kings, steps aside for this. The way to the moneylender\'s door is open.');
      }
      if (verb === 'pegar')
        return say('Não se pega numa multidão. A multidão é que pega em ti.',
          'You do not pick up a crowd. A crowd picks up you.');
    }

    if (h.id === 'porta') {
      if (verb !== 'olhar') {
        if (!F.multidaoAberta)
          return say('Estás longe de mais. Entre ti e aquela porta está a cidade inteira.',
            'You are too far away. Between you and that door is the entire city.');
        if (F.chegou)
          return say('Fechada. Continua fechada. Vai continuar fechada.',
            'Shut. Still shut. Going to stay shut.');
        F.chegou = true;
        this.award(15);
        return say('Chegas à porta e o cambista corre o ferrolho por dentro. Não está a fugir de um credor — está a fugir de ti. Toda a cidade sabe da malagueta. Ninguém em Lisboa te empresta mais um real. Se o dinheiro não vem de fora, resta-te o que tens: onze toneladas e a língua.',
          'You reach the door and the moneylender shoots the bolt from inside. He is not hiding from a creditor — he is hiding from you. The whole city knows about the malagueta. Nobody in Lisbon will lend you another real. If money will not come from outside, you are left with what you have: eleven tons and your tongue.');
      }
    }

    // ---- Beco do Loureiro --------------------------------------------------
    if (h.id === 'homem') {
      if (verb === 'olhar')
        return say('Encostado à parede, sem pressa nenhuma. É o homem do Bastião Ruivo. Conhece-te de vista e de dívida.',
          'Leaning on the wall, in no hurry whatsoever. Bastião Ruivo\'s man. He knows you by sight and by debt.');
      if (verb === 'falar') {
        // Act 3: Ruivo does not collect any more. Ruivo doubles down.
        if (F.acto2Fim && !F.invRuivo) {
          F.invRuivo = true;
          this.award(25);
          this.owe(8000);
          return say('"O senhor Ruivo soube do contrato com o florentino. Quer aumentar a posição." Oito mil, em cima da mesa, sem que tenhas pedido. Recusar não é uma das opções que ele trouxe. Deves agora dinheiro ao homem a quem devias dinheiro, mas mais, e com o consentimento entusiasmado dele.',
            '"Senhor Ruivo has heard of the Florentine contract. He wishes to increase his position." Eight thousand, on the table, unasked. Declining is not among the options he brought. You now owe money to the man you owed money to, but more of it, and with his enthusiastic consent.',
            'o homem do Ruivo');
        }
        if (F.invRuivo)
          return say('"O senhor Ruivo pergunta se precisas de mais." É a frase mais assustadora que já ouviste.',
            '"Senhor Ruivo asks if you need more." It is the most frightening sentence you have ever heard.',
            'o homem do Ruivo');
        if (F.acto1Fim)
          return say('"Um mês." É toda a conversa que ele tem para ti, e é mais do que tinhas ontem.',
            '"One month." It is all the conversation he has for you, and it is more than you had yesterday.',
            'o homem do Ruivo');
        // The pitch: only once there is no credit left and the idea exists.
        if (F.chegou && F.pivotPronto) {
          return this.dialog.start(PITCH_RUIVO, (g, result) => {
            if (result !== 'win') return;
            g.flags.acto1Fim = true;
            g.award(50);
            g.owe(2000);
            g.actEnd = { t: 0, title: 'FIM DO PRIMEIRO ACTO',
              body: [`dívida: ${g.debt} reais`, 'Tinhas 4.000 esta manhã.'] };
            g.save();
          });
        }
        if (F.pivotPronto)
          return say('Tens a ideia na manga e pimenta na outra. Mas um homem destes só ouve quem já não tem mais nenhuma porta. Vai primeiro ao cambista.',
            'You have the idea up one sleeve and pepper up the other. But a man like this only listens to someone with no doors left. Try the moneylender first.');
        return say('"O senhor Ruivo manda perguntar pela malagueta." Não é uma pergunta. "E manda dizer que a renda dele não triplicou."',
          '"Senhor Ruivo sends to ask after the malagueta." It is not a question. "And sends word that HIS rent has not tripled."',
          'o homem do Ruivo');
      }
      return this.die('Tocas-lhe. Ele parte-te os dedos com que escreves, que são todos, e depois pede desculpa, que é o pior.',
        'You touch him. He breaks the fingers you write with, which is all of them, and then apologises, which is the worst part.');
    }

    // ---- Acto 2: a Casa dos Escrivães --------------------------------------
    if (h.id === 'escrivaoMor') {
      if (verb === 'olhar')
        return say('O escrivão-mor, de volta à secretária. Não levanta a cabeça desde 1494. Ao lado do cotovelo dele está o selo da Casa da Índia.',
          'The chief clerk, back at his desk. He has not raised his head since 1494. At his elbow sits the seal of the Casa da Índia.');
      if (verb === 'falar')
        return say('"Estás atrasado." Não levanta a cabeça. "Há vinte anos."',
          '"You are late." He does not raise his head. "Twenty years now."',
          'escrivão-mor');
      if (verb === 'usar') {
        if (this.has('uma sardinha')) {
          F.escrivaoFora = true;
          this.inv = this.inv.filter(i => i.pt !== 'uma sardinha');
          this.award(20);
          return say('Pousas a sardinha de três dias na prateleira por baixo da secretária dele. Um minuto. Dois. O escrivão-mor levanta a cabeça pela primeira vez em trinta anos e sai da sala sem uma palavra.',
            'You slide the three-day sardine onto the shelf under his desk. One minute. Two. The chief clerk raises his head for the first time in thirty years and leaves the room without a word.');
        }
        return say('Não tens nada que mova um homem que não se move desde 1494.',
          'You have nothing that would move a man who has not moved since 1494.');
      }
    }

    if (h.id === 'selo') {
      if (verb === 'olhar')
        return say('O selo da Casa da Índia. O que ele toca passa a ser oficial. É por isso que está sempre debaixo do cotovelo de alguém.',
          'The seal of the Casa da Índia. What it touches becomes official. That is why it is always under somebody\'s elbow.');
      if (verb === 'pegar' || verb === 'usar') {
        if (!F.acto1Fim)
          return say('Ainda não precisas de nada que seja oficial. O teu problema, por enquanto, é apenas verdadeiro.',
            'You do not yet need anything official. Your problem, for now, is merely true.');
        if (!F.escrivaoFora)
          return say('Estendes a mão. A mão do escrivão-mor já está em cima do selo. Ele não levantou a cabeça. Não precisou.',
            'You reach out. The chief clerk\'s hand is already on the seal. He did not raise his head. He did not need to.');
        if (this.has('o selo'))
          return say('Já o tens na manga. A manga vai ganhando currículo.',
            'It is already up your sleeve. The sleeve is building a résumé.');
        this.give('o selo', 'the seal');
        this.award(15);
        return say('O selo desliza para a tua manga. Pesa pouco. O que ele faz é que pesa.',
          'The seal slides into your sleeve. It weighs very little. What it does is what weighs.');
      }
    }

    if (h.id === 'prateleiras' && verb === 'pegar') {
      if (!F.acto1Fim)
        return say('Papel da Casa da Índia não se leva. Regista-se. Tu é que registas, aliás.',
          'Casa da Índia paper is not taken. It is logged. By you, as it happens.');
      if (this.has('papel de registo') || this.has('o manifesto falso'))
        return say('Já tens papel que chegue para te enforcar. Uma folha basta.',
          'You already have enough paper to hang you. One sheet is plenty.');
      this.give('papel de registo', 'a blank ledger sheet');
      this.award(10);
      return say('Tiras uma folha em branco do livro novo. Em branco é como todos os grandes negócios começam.',
        'You take a blank sheet from the new ledger. Blank is how all great ventures begin.');
    }

    if (h.id === 'minhaMesa' && verb === 'usar') {
      if (!F.acto1Fim)
        return say('Sentares-te a trabalhar não resolve o teu problema. Foi a trabalhar que ele começou.',
          'Sitting down to work will not solve your problem. Work is where it started.');
      if (this.has('o manifesto falso'))
        return say('O manifesto está feito. Melhor não olhar muito para ele, que ainda o admiras.',
          'The manifest is done. Better not to look at it too long — you might start admiring it.');
      if (!this.has('papel de registo') || !this.has('o selo'))
        return say('Para escrever uma fortuna precisas de papel da Casa e do selo da Casa. A letra, essa, já a tens.',
          'To write a fortune you need the House\'s paper and the House\'s seal. The handwriting you already have.');
      this.inv = this.inv.filter(i => i.pt !== 'papel de registo');
      this.give('o manifesto falso', 'the forged manifest');
      this.award(25);
      return say('Escreves. MANIFESTO DE CARGA — PIMENTA DE CALECUTE — ONZE TONELADAS. A tua letra de onze anos de prática. O selo desce. Nunca escreveste nada tão bem na vida, e é um crime.',
        'You write. CARGO MANIFEST — CALICUT PEPPER — ELEVEN TONS. Eleven years of practice in every stroke. The seal comes down. You have never written anything so well in your life, and it is a crime.');
    }

    // ---- Acto 3: o Sota ----------------------------------------------------
    if (h.id === 'sota') {
      if (verb === 'olhar')
        return say('Cinquenta e cinco homens voltaram da Índia. Este é um deles. O que o escorbuto lhe levou em dentes, devolveu-lhe em paciência.',
          'Fifty-five men came back from India. This is one of them. What scurvy took from him in teeth, it returned in patience.');
      if (verb === 'falar') {
        if (F.acto3Fim || (F.sotaPago2))
          return say('"Vai andando, patrão." É a primeira vez que alguém te chama patrão. Custou dois mil e quinhentos.',
            '"On your way, boss." It is the first time anyone has called you boss. It cost two and a half thousand.',
            'o Sota');
        if (F.sotaPago1)
          return say('"Por enquanto, estamos entendidos." Volta a encostar-se aos sacos, como quem guarda o próprio ordenado.',
            '"For now, we understand each other." He leans back on the sacks, like a man guarding his own salary.',
            'o Sota');
        return this.dialog.start(SOTA_PRECO, (g, result) => {
          if (result !== 'win') return;
          g.flags.sotaPago1 = true;
          g.award(25);
          g.owe(1000);
          g.ui.say(
            '"Mil. Para começar." Aperta-te a mão. A mão dele é só ossos e a tua é só tinta, e é este o negócio mais honesto que fizeste hoje.',
            '"A thousand. To start." He shakes your hand. His hand is all bones and yours is all ink, and this is the most honest deal you have made today.',
            'o Sota');
          g.save();
        });
      }
      return this.die('Empurras um homem que sobreviveu ao Cabo da Boa Esperança. Não sobrevives tu a ele.',
        'You shove a man who survived the Cape of Good Hope. You do not survive him.');
    }

    // ---- O Armazém ---------------------------------------------------------
    if (h.id === 'barris' && verb === 'pegar') {
      if (!F.acto1Fim)
        return say('Os barris ficam. São a única parte do plano que ainda pode vir a servir.',
          'The barrels stay. They are the only part of the plan that might still be useful.');
      if (this.has('um pincel de pez'))
        return say('Um pincel chega. O pez não é o problema. O problema nunca foi o pez.',
          'One brush is enough. The pitch is not the problem. The pitch was never the problem.');
      this.give('um pincel de pez', 'a pitch brush');
      this.award(10);
      return say('Atrás dos barris há pez de calafate e um pincel. Compraste-os para selar barris de exportação. Vais usá-los para outra coisa.',
        'Behind the barrels there is caulker\'s pitch and a brush. You bought them to seal export barrels. You are going to use them for something else.');
    }

    if (h.id === 'sacos') {
      if (verb === 'olhar')
        return say('Onze toneladas de malagueta. Ontem era um monopólio. Hoje é mobília.',
          'Eleven tons of malagueta. Yesterday it was a monopoly. Today it is furniture.');
      if (verb === 'usar') {
        if (!this.has('a bolsa de pimenta'))
          return say('Precisavas de alguma coisa que estes sacos não têm. Ainda não sabes de quê.',
            'You need something these sacks do not have. You do not yet know what.');
        if (!F.pivotPronto) {
          F.pivotPronto = true;
          this.award(25);
          return say('Esfregas um punhado da pimenta do Diogo num saco e cheiras. Fecha os olhos e é a Índia. A tua malagueta acaba de mudar de origem. Só falta convencer o resto do mundo, a começar pelo homem lá fora.',
            'You rub a handful of Diogo\'s pepper into one sack and sniff. Close your eyes and it is India. Your malagueta has just changed origin. Now you only have to convince the rest of the world, starting with the man outside.');
        }
        // Act 2: the marks. Origin is written on the sack, not in it.
        if (F.acto1Fim && this.has('um pincel de pez') && !F.sacosProntos) {
          F.sacosProntos = true;
          this.award(20);
          this.paintBg();
          return say('Pintas em cada saco, com pez e à trincha: CALECUT. A malagueta não mudou. O saco licenciou-se.',
            'On every sack, in pitch, you paint: CALECUT. The malagueta has not changed. The sack has graduated.');
        }
        if (F.sacosProntos)
          return say('Cheiram a Calecute e dizem Calecute. Só falta alguém que pague como se fosse Calecute.',
            'They smell of Calicut and they say Calicut. All that is missing is someone who pays as if they were Calicut.');
        if (F.acto1Fim)
          return say('Cheiram bem, mas um saco de Calecute vem marcado. Precisas de tinta e de uma trincha. Os barris ali ao canto foram comprados por um homem que pensava em tudo.',
            'They smell right, but a Calicut sack comes marked. You need paint and a brush. The barrels in the corner were bought by a man who thought of everything.');
        return say('Já cheira a Calecute. Agora falta o resto: papéis e um comprador. Amanhã. Hoje, o Ruivo.',
          'It already smells of Calicut. Now the rest: paperwork and a buyer. Tomorrow. Today, Ruivo.');
      }
      if (verb === 'pegar')
        return say('Já é tudo teu. É esse o problema.',
          'It is already all yours. That is the problem.');
    }

    // ---- Acto 3: Dona Brízida, investidora ---------------------------------
    if (h.id === 'brizida') {
      if (verb === 'olhar')
        return say('A Dona Brízida, sentada a meio da escada com o bordado. Quarenta anos a ver esquemas subir e descer este beco. O bordado nunca perdeu dinheiro.',
          'Dona Brízida, halfway up the stairs with her needlework. Forty years watching schemes go up and down this alley. The needlework has never lost money.');
      if (verb === 'falar') {
        if (F.invBrizida)
          return say('"O armazém, Soeiro. Se falhares, o armazém." Diz isto como quem fala do tempo.',
            '"The warehouse, Soeiro. If you fail, the warehouse." She says it the way people discuss the weather.',
            'Dona Brízida');
        return this.dialog.start(BRIZIDA_INV, (g, result) => {
          if (result !== 'win') return;
          g.flags.invBrizida = true;
          g.award(30);
          g.owe(5000);
          g.save();
        });
      }
    }

    if (h.id === 'escadas' && verb !== 'olhar') {
      if (!F.rendaSubiu) {
        F.rendaSubiu = true;
        this.owe(600);
        return say('A Dona Brízida está sentada no cimo. Triplicou a renda. Não por maldade — apareceu um homem de Alfama que paga o dobro sem discutir. "A Ribeira agora é outra coisa, ó Soeiro."',
          'Dona Brízida is sitting at the top. She has tripled the rent. Not out of malice — a man from Alfama has turned up who pays double without arguing. "The Ribeira is different now, Soeiro."');
      }
      return say('Ela continua sentada no cimo das escadas. Tem todo o tempo do mundo e a lei do lado dela.',
        'She is still sitting at the top of the stairs. She has all the time in the world and the law on her side.');
    }

    // ---- A Casa dos Escrivães ----------------------------------------------
    if (h.id === 'diogo') {
      if (verb === 'olhar')
        return say('O teu primo Diogo. Não é inteligente. Entrou num barco. Foi só isso que ele fez, e chegou.',
          'Your cousin Diogo. He is not clever. He got on a boat. That is the entirety of what he did, and it was enough.');
      if (verb === 'falar') {
        if (F.diogoFoi)
          return say('Foi-se. A sala está estranhamente silenciosa e ninguém se queixa.',
            'He has gone. The room is oddly quiet and nobody is complaining.');
        if (!F.chegou)
          return say('"...e ao terceiro mês já não havia água doce..." Tu disseste-lhe que ele ia morrer no mar. Disseste-lho à frente de toda a gente. Ele nunca mais falou nisso, o que é muito pior.',
            '"...and by the third month there was no fresh water left..." You told him he was going to die at sea. You told him in front of everybody. He has never mentioned it since, which is very much worse.',
            'Diogo');
        F.diogoFoi = true;
        this.award(20);
        return say('Dizes-lhe que está meia Lisboa na Ribeira à procura de homens que tenham ido com o Gama. Diogo sai sem fechar a porta. Sai sem levar o chapéu.',
          'You tell him half of Lisbon is down at the Ribeira looking for men who sailed with Gama. Diogo leaves without shutting the door. He leaves without taking his hat.');
      }
    }

    if (h.id === 'bolsa') {
      if (verb === 'olhar')
        return say('Pimenta da Índia. Verdadeira. Chegou esta manhã e já custa um terço do que custava a tua. A tua, a partir de hoje, não custa nada.',
          'Indian pepper. The real thing. It landed this morning and already costs a third of what yours did. Yours, as of today, costs nothing.');
      if (verb === 'pegar' || verb === 'usar') {
        if (!F.diogoFoi)
          return say('Ele está ali. Está sempre ali. É a bolsa dele e é a sala dele e, a esta hora, é a cidade dele.',
            'He is right there. He is always right there. It is his pouch and his room and, at this hour, his city.');
        if (this.has('a bolsa de pimenta'))
          return say('Já a tens. Guarda-a, e guarda a cara também.',
            'You have it. Keep it out of sight, and keep your face out of sight as well.');
        this.give('a bolsa de pimenta', 'the pouch of pepper');
        this.award(25);
        return say('Metes a bolsa na manga. Não é roubo, é aquisição. E ocorre-te, ali, de pé, que se a tua malagueta cheirar a isto — deixa de ser malagueta.',
          'You put the pouch up your sleeve. It is not theft, it is an acquisition. And it occurs to you, standing there, that if your malagueta smells of this — it stops being malagueta.');
      }
    }

    // ---- Acto 3: o Bicudo investe ------------------------------------------
    if (h.id === 'balcao' && verb === 'falar' && F.acto2Fim) {
      if (F.invBicudo)
        return say('"Sócio!" Serve-te sem pedires. O vinho de sócio é pior do que o vinho de cliente, mas é grátis.',
          '"Partner!" He pours without being asked. Partner wine is worse than customer wine, but it is free.',
          'o Bicudo');
      F.invBicudo = true;
      this.award(25);
      this.owe(4000);
      return say('"O florentino comprou-te pimenta e eu ouvi tudo." Baixa a voz. "Quatro mil. Com uma condição: a companhia passa a chamar-se COMPANHIA REAL DA MALAGUETA E TABERNA DO BICUDO." Aceitas. A tabuleta nova fica por conta dele.',
        '"The Florentine bought your pepper and I heard everything." He lowers his voice. "Four thousand. One condition: the company is renamed COMPANHIA REAL DA MALAGUETA E TABERNA DO BICUDO." You accept. The new signboard is on him.',
        'o Bicudo');
    }

    // ---- Acto 2: a Taberna do Bicudo ---------------------------------------
    if (h.id === 'diogoTab') {
      if (verb === 'olhar')
        return say('O Diogo, no seu novo emprego: contar a história. A caneca nunca chega ao fundo — enchem-lha antes.',
          'Diogo, at his new job: telling the story. His mug never reaches the bottom — they refill it first.');
      if (verb === 'falar') {
        if (F.acto3Fim)
          return say('"Um conselho, primo. Lá fora, não contes os dias. Os dias é que te contam a ti." Levanta a caneca. É o mais parecido com um abraço que a vossa família fabrica.',
            '"One piece of advice, cousin. Out there, do not count the days. The days count you." He raises his mug. It is the closest thing to an embrace your family manufactures.',
            'Diogo');
        if (F.diogoVouchou)
          return say('"Já disse ao homem o que tinha a dizer, primo." Volta para a história. Está na parte da água outra vez.',
            '"I told the man what I had to tell him, cousin." He goes back to the story. He is at the water part again.',
            'Diogo');
        if (!F.agenteRecusou)
          return say('Está no meio da história. Interrompê-lo agora custava-te a única família que ainda te fala.',
            'He is mid-story. Interrupting now would cost you the only family still speaking to you.');
        return this.dialog.start(DIOGO_VOUCH, (g, result) => {
          if (result !== 'win') return;
          g.flags.diogoVouchou = true;
          g.award(30);
          g.ui.say(
            'O Diogo levanta-se, endireita o chapéu, e atravessa a taberna até à mesa do florentino. Não ouves o que diz. Vês o florentino olhar para ti. É um começo.',
            'Diogo stands, straightens his hat, and crosses the tavern to the Florentine\'s table. You cannot hear what he says. You see the Florentine look at you. It is a start.',
            'Diogo');
          g.save();
        });
      }
    }

    if (h.id === 'agente') {
      if (verb === 'olhar')
        return say('O agente do Marchionni, de Florença. Compra e vende meio Mediterrâneo a partir daquela mesa. O livro dele nunca fecha.',
          'Marchionni\'s agent, from Florence. He buys and sells half the Mediterranean from that table. His ledger never closes.');
      if (verb === 'falar') {
        // Act 4: the letter that costs everything he raised.
        if (F.acto3Fim && !F.cartaPorao) {
          F.cartaPorao = true;
          this.give('a carta de porão', 'the hold-space letter');
          this.award(30);
          return say('Escreve três linhas, sela, e empurra o papel. "Porão na capitânia, em nome do Marchionni. Custa exactamente o que tens." Todo o dinheiro de toda a gente atravessa a mesa numa direcção. O papel atravessa na outra. Foi este o negócio da tua vida.',
            'He writes three lines, seals them, and slides the paper across. "Hold-space on the flagship, in Marchionni\'s name. It costs exactly what you have." All of everyone\'s money crosses the table in one direction. The paper crosses in the other. This was the deal of your life.',
            'o agente florentino');
        }
        if (F.acto3Fim)
          return say('"Março, senhor. A frota não espera por devedores nem por profetas." Volta ao livro.',
            '"March, senhor. The fleet waits for neither debtors nor prophets." He returns to the ledger.',
            'o agente florentino');
        // Act 3 finale: he has raised the money. There is nothing to buy.
        if (F.invBrizida && F.invBicudo && F.invRuivo) {
          F.acto3Fim = true;
          this.award(50);
          this.actEnd = { t: 0, title: 'FIM DO TERCEIRO ACTO',
            body: [`dívida: ${this.debt} reais`,
                   'Lisboa inteira é tua sócia.',
                   'A pimenta está na Índia.'] };
          this.save();
          return say('Pousas o dinheiro na mesa dele. "Cem toneladas, à chegada da frota." Ele nem olha para as moedas. "Não há pimenta para comprar em Lisboa, senhor. A Coroa selou tudo o que chegar. Quem quer pimenta vai buscá-la." Vira uma página. "A frota de Cabral parte em Março. O Marchionni tem porão para quem tem capital. O senhor agora tem capital." Sorri pela primeira vez. "De toda a gente."',
            'You put the money on his table. "A hundred tons, when the fleet lands." He does not look at the coins. "There is no pepper to buy in Lisbon, senhor. The Crown has sealed everything that arrives. A man who wants pepper goes and fetches it." He turns a page. "Cabral\'s fleet sails in March. Marchionni has hold-space for men with capital. You now have capital." He smiles for the first time. "Everyone\'s."',
            'o agente florentino');
        }
        if (F.acto2Fim) {
          const falta = [!F.invBrizida && 'a Dona Brízida', !F.invBicudo && 'o Bicudo', !F.invRuivo && 'o homem do Ruivo'].filter(Boolean).join(', ');
          return say(`"Cem toneladas custam capital, senhor. Volte quando o tiver." Falta-te convencer: ${falta}.`,
            `"A hundred tons costs capital, senhor. Come back when you have it." Still to convince: ${falta}.`,
            'o agente florentino');
        }
        if (!F.agenteRecusou) {
          F.agenteRecusou = true;
          return say('"O profeta da malagueta." Nem levanta os olhos do livro. "Florença também tem astrólogos. Não lhes compro pimenta."',
            '"The malagueta prophet." He does not look up from the ledger. "Florence has astrologers too. I do not buy pepper from them."',
            'o agente florentino');
        }
        if (!F.diogoVouchou)
          return say('"Sem um nome que responda pelo senhor, não há conversa." O Diogo, ali ao lado, tem um nome. Tu, neste momento, tens uma alcunha.',
            '"Without a name to answer for you, there is no conversation." Diogo, right over there, has a name. You, at present, have a nickname.');
        if (!this.has('o manifesto falso') || !F.sacosProntos)
          return say('"O Marchionni compra origem, senhor, não cheiro. Papéis e marcas. Depois falamos."',
            '"Marchionni buys origin, senhor, not smell. Papers and marks. Then we talk."',
            'o agente florentino');
        return this.dialog.start(AGENT_DEAL, (g, result) => {
          if (result !== 'win') return;
          g.flags.acto2Fim = true;
          g.award(60);
          g.owe(8000);
          g.actEnd = { t: 0, title: 'FIM DO SEGUNDO ACTO',
            body: [`dívida: ${g.debt} reais`,
                   'Vendeste onze toneladas que não existem',
                   'e prometeste mais cem.'] };
          g.save();
        });
      }
    }

    // ---- Acto 4: o mestre, e a prancha -------------------------------------
    if (h.id === 'mestre' || (h.id === 'prancha' && verb !== 'olhar')) {
      if (verb === 'olhar' && h.id === 'mestre')
        return say('O mestre da capitânia. Braços como cabos de amarração. Decide quem sobe, e já disse que não a homens com mais razões do que tu.',
          'The flagship\'s master. Forearms like mooring lines. He decides who boards, and he has said no to men with better reasons than yours.');
      if (!this.has('a carta de porão'))
        return say('"Papel primeiro, escrivão." Sem a carta do Marchionni, a prancha é paisagem.',
          '"Paper first, clerk." Without Marchionni\'s letter, the gangplank is scenery.',
          'o mestre');
      return this.dialog.start(MESTRE_EMBARQUE, (g, result) => {
        if (result !== 'win') return;
        g.flags.embarcou = true;
        g.award(75);
        g.save();
        g.ui.say(
          'O mestre olha para ti mais um momento. "...Todos temos, escrivão. É por isso que se sobe." Afasta-se da prancha. Doze passos de madeira. Sobes.',
          'The master looks at you a moment longer. "...We all are, clerk. That is why one boards." He steps aside from the plank. Twelve wooden steps. You climb.',
          'o mestre');
        // The next click starts the ending.
        g.pendingOutro = true;
      });
    }

    const line = h[verb];
    if (line) return say(line[0], line[1], line[2]);

    const shrug = {
      olhar: ['Olhas. Não melhora.', "You look. It doesn't improve."],
      pegar: ['Não é teu. Quase nada é.', "It isn't yours. Very little is."],
      falar: ['Não responde. Já estás habituado.', "No answer. You're used to it."],
      usar:  ['Não. Isso não resolve isto.', "No. That doesn't solve this."],
    }[verb];
    say(shrug[0], shrug[1]);
  }

  frame(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000);
    this.last = t;
    const ctx = this.screen.ctx;

    if (this.intro && !this.intro.done) {
      this.intro.draw(ctx, dt, this.ui.gloss);
      this.menu.draw(ctx);
      this.ui.cursor(ctx, this.mouse.x, this.mouse.y);
      this.screen.present();
      return requestAnimationFrame(n => this.frame(n));
    }

    if (this.outro) {
      this.outro.draw(ctx, dt, this.ui.gloss);
      this.ui.cursor(ctx, this.mouse.x, this.mouse.y);
      this.screen.present();
      return requestAnimationFrame(n => this.frame(n));
    }

    if (this.fim) {
      this.drawFim(ctx, dt);
      this.menu.draw(ctx);
      this.ui.cursor(ctx, this.mouse.x, this.mouse.y);
      this.screen.present();
      return requestAnimationFrame(n => this.frame(n));
    }

    // room-to-room dissolve
    const TD = 0.34;
    if (this.trans) {
      this.trans.t += dt;
      if (this.trans.t >= TD) {
        if (this.trans.phase === 'out') {
          this.goScene(this.trans.to, this.trans.at);
          this.trans.phase = 'in'; this.trans.t = 0;
        } else this.trans = null;
      }
    }
    if (this.caption) this.caption.t += dt;

    // He keeps walking during the fade-in, so the room resolves around a man
    // already in motion rather than a man standing still waiting for it.
    const frozen = (this.trans && this.trans.phase === 'out') || this.dialog.open || this.actEnd;
    if (!this.ui.msg && !this.dead && !frozen) this.player.update(dt, this.scene);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.bg, 0, 0);
    ctx.restore();
    // Animated crowd, split around the player so he stands among them.
    if (this.scene.update) this.scene.update(dt, this);
    if (this.scene.drawLayer) this.scene.drawLayer(ctx, t / 1000, this, -1e9, this.player.y);
    this.player.draw(ctx, this.scene);
    if (this.scene.drawLayer) this.scene.drawLayer(ctx, t / 1000, this, this.player.y, 1e9);
    vgrad(ctx, 0, 0, W, H, [[0, 'rgba(255,214,150,.05)'], [1, 'rgba(255,190,120,.10)']]);

    if (!this.dead && !this.actEnd) this.drawExits(ctx, t / 1000);
    this.drawCaption(ctx);
    this.ui.draw(ctx, this);
    this.dialog.draw(ctx, this.ui.gloss);
    if (this.dead) this.drawDeath(ctx);
    if (this.actEnd) this.drawActEnd(ctx, dt);
    if (this.trans)
      drawDissolve(ctx, this.trans.phase === 'out'
        ? this.trans.t / TD : 1 - this.trans.t / TD);
    this.menu.draw(ctx);
    if (!this.dead && !this.trans) this.ui.cursor(ctx, this.mouse.x, this.mouse.y);
    this.screen.present();
    requestAnimationFrame(n => this.frame(n));
  }

  // The final screen: the score he earned and the number he became.
  drawFim(ctx, dt) {
    this._fimT = (this._fimT || 0) + dt;
    const a = Math.min(1, this._fimT / 1.2);
    fill(ctx, 0, 0, W, H, '#08070c');
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    text(ctx, 'FIM', W / 2, 40, '#ffe4a8', 'bold 16px "Courier New", monospace');
    fill(ctx, 128, 62, 64, 1, 'rgba(232,200,140,.5)');
    text(ctx, `pontos: ${this.score}`, W / 2, 76, '#b9b5a9', '8px "Courier New", monospace');
    text(ctx, `dívida: ${this.debt} reais`, W / 2, 88, '#e88a7a', '8px "Courier New", monospace');
    text(ctx, 'distância à pimenta: 7.500 léguas', W / 2, 100, '#b9b5a9', '8px "Courier New", monospace');
    text(ctx, 'Descobriste o Brasil.', W / 2, 122, '#fff8e0', '9px "Courier New", monospace');
    text(ctx, 'Estavas virado para o outro lado.', W / 2, 134, '#fff8e0', '9px "Courier New", monospace');
    if (this.ui.gloss) {
      text(ctx, 'You discovered Brazil. You were facing the other way.', W / 2, 146, '#9fe07a', '7px "Courier New", monospace');
    }
    text(ctx, 'Soeiro Vaz voltará em', W / 2, 162, '#8e8b83', '7px "Courier New", monospace');
    text(ctx, 'SOEIRO VAZ E A TERRA QUE NÃO ESTAVA NO MAPA', W / 2, 172, '#c9b894', '7px "Courier New", monospace');
    if (this._fimT > 2 && Math.sin(this._fimT * 3) > -0.2)
      text(ctx, '(clica)', W / 2, H - 14, '#6f6c66', '7px "Courier New", monospace');
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  // The act closes on the game's whole thesis: he succeeded, and it cost him.
  drawActEnd(ctx, dt) {
    this.actEnd.t += dt;
    const a = Math.min(1, this.actEnd.t / 0.8);
    fill(ctx, 0, 0, W, H, `rgba(6,7,12,${0.86 * a})`);
    ctx.globalAlpha = a;
    ctx.textAlign = 'center';
    text(ctx, this.actEnd.title, W / 2, 58, '#ffe4a8', 'bold 12px "Courier New", monospace');
    fill(ctx, 96, 76, 128, 1, 'rgba(232,200,140,.5)');
    let ty = 88;
    for (let i = 0; i < this.actEnd.body.length; i++) {
      text(ctx, this.actEnd.body[i], W / 2, ty,
           i === 0 ? '#e88a7a' : '#b9b5a9',
           (i === 0 ? '9px' : '8px') + ' "Courier New", monospace');
      ty += 14;
    }
    ty += 6;
    text(ctx, 'Ainda não estiveste errado.', W / 2, ty, '#fff8e0', '9px "Courier New", monospace');
    if (this.ui.gloss)
      text(ctx, 'You have still not been wrong.', W / 2, ty + 12, '#9fe07a', '8px "Courier New", monospace');
    if (this.actEnd.t > 1.4 && Math.sin(this.actEnd.t * 3) > -0.2)
      text(ctx, 'continua… (clica)', W / 2, H - 24, '#8e8b83', '7px "Courier New", monospace');
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  drawDeath(ctx) {
    fill(ctx, 0, 0, W, H, 'rgba(20,10,8,.72)');
    const bw = 240, bx = (W - bw) / 2 | 0;
    const lines = wrap(ctx, this.dead.pt, bw - 16, '8px "Courier New", monospace');
    const gl = this.ui.gloss ? wrap(ctx, this.dead.en, bw - 16, '8px "Courier New", monospace') : [];
    const bh = 34 + lines.length * 10 + (gl.length ? 7 + gl.length * 10 : 0);
    const by = (H - bh) / 2 | 0;
    panel(ctx, bx, by, bw, bh);
    text(ctx, 'MORRESTE', bx + 8, by + 8, '#ff9a86', '8px "Courier New", monospace');
    let ty = by + 20;
    for (const l of lines) { text(ctx, l, bx + 8, ty, '#fff8e0'); ty += 10; }
    if (gl.length) {
      fill(ctx, bx + 4, ty + 2, bw - 8, gl.length * 10 + 5, '#20242c');
      ty += 6;
      for (const l of gl) { text(ctx, l, bx + 8, ty, '#9fe07a'); ty += 10; }
    }
    text(ctx, '[clica para tentar outra vez]', bx + 8, by + bh - 12, '#cfcbbf', '7px "Courier New", monospace');
  }
}

const boot = document.getElementById('boot');
boot.addEventListener('pointerdown', () => {
  boot.remove();
  window.GAME = new Game();
}, { once: true });
