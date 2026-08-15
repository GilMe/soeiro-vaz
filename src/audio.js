// audio.js — 2-operator FM synthesis, which is what the AdLib / Sound Blaster
// OPL2 chip actually did: one sine oscillator modulates a carrier's frequency,
// with an envelope on the modulator so the timbre changes as the note decays.
// No samples, no files. This is why Sierra music sounds nasal and slightly angry.

const SEMI = { C:0, 'C#':1, D:2, 'D#':3, E:4, F:5, 'F#':6, G:7, 'G#':8, A:9, 'A#':10, B:11 };
export function f(name) {
  const m = /^([A-G]#?)(-?\d)$/.exec(name);
  if (!m) throw new Error('bad note ' + name);
  return 440 * Math.pow(2, (SEMI[m[1]] + (parseInt(m[2], 10) + 1) * 12 - 69) / 12);
}

// Instrument patches. `mult` is the modulator:carrier frequency ratio and
// `index` how hard it swings — the two knobs that define an FM voice.
export const PATCH = {
  reed:  { mult: 2,    index: 260, wave: 'sine',     atk: .04,  dec: .10, sus: .80, rel: .16, gain: .20 },
  pluck: { mult: 3,    index: 620, wave: 'sine',     atk: .004, dec: .16, sus: .10, rel: .14, gain: .24 },
  drone: { mult: 1,    index: 90,  wave: 'sine',     atk: .12,  dec: .20, sus: .90, rel: .40, gain: .17 },
  bell:  { mult: 3.51, index: 900, wave: 'sine',     atk: .002, dec: .50, sus: .06, rel: .90, gain: .22 },
  reedy: { mult: 1.5,  index: 420, wave: 'triangle', atk: .02,  dec: .14, sus: .60, rel: .20, gain: .18 },
  horn:  { mult: 1,    index: 340, wave: 'sine',     atk: .05,  dec: .10, sus: .85, rel: .14, gain: .23 },
};

export class Audio {
  constructor() { this.ready = false; this.musicOn = true; this.song = null; this.timer = null; }

  init() {
    if (this.ready) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.mus = this.ctx.createGain(); this.mus.gain.value = 0.30; this.mus.connect(this.master);
    this.sbus = this.ctx.createGain(); this.sbus.gain.value = 0.75; this.sbus.connect(this.master);
    this.noise = this._noiseBuffer();
    this.ready = true;
  }

  setEnabled(on) {
    this.musicOn = on;
    if (this.master) this.master.gain.value = on ? 0.5 : 0;
  }

  _noiseBuffer() {
    const n = this.ctx.sampleRate * 0.5;
    const b = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  fm(bus, freq, t, dur, p) {
    const { mult, index, wave, atk, dec, sus, rel, gain } = p;
    const c = this.ctx;
    const car = c.createOscillator(); car.type = wave; car.frequency.value = freq;
    const mod = c.createOscillator(); mod.type = 'sine'; mod.frequency.value = freq * mult;
    const mg = c.createGain();
    mg.gain.setValueAtTime(index, t);
    mg.gain.exponentialRampToValueAtTime(Math.max(0.5, index * 0.06), t + dur * 0.85 + 0.01);
    mod.connect(mg); mg.connect(car.frequency);
    const amp = c.createGain();
    const hold = Math.max(dur, atk + dec);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.linearRampToValueAtTime(gain, t + atk);
    amp.gain.linearRampToValueAtTime(gain * sus, t + atk + dec);
    amp.gain.setValueAtTime(gain * sus, t + hold);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + hold + rel);
    car.connect(amp); amp.connect(bus);
    mod.start(t); car.start(t);
    mod.stop(t + hold + rel + .05); car.stop(t + hold + rel + .05);
  }

  hit(t, { freq = 160, dur = .09, gain = .30, q = 1 } = {}) {
    const c = this.ctx;
    const src = c.createBufferSource(); src.buffer = this.noise;
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp); bp.connect(g); g.connect(this.sbus);
    src.start(t); src.stop(t + dur + .02);
  }

  // ---- sound effects -------------------------------------------------------
  sfx(name) {
    if (!this.ready) return;
    const t = this.ctx.currentTime, S = this.sbus;
    switch (name) {
      case 'step':   this.hit(t, { freq: 220 + Math.random() * 90, dur: .06, gain: .13, q: .8 }); break;
      case 'thud':   this.hit(t, { freq: 90, dur: .18, gain: .34, q: .6 }); break;
      case 'take':
        [0, .05, .10].forEach((d, i) =>
          this.fm(S, f(['G4','C5','E5'][i]), t + d, .07, { ...PATCH.pluck, gain: .18 }));
        break;
      case 'points':                                   // the Sierra "you scored" chime
        [0, .07, .14, .21].forEach((d, i) =>
          this.fm(S, f(['C5','E5','G5','C6'][i]), t + d, .09, { ...PATCH.bell, gain: .16 }));
        break;
      case 'nope':   this.fm(S, f('F#3'), t, .16, { ...PATCH.reedy, index: 700, gain: .16 }); break;
      case 'crow': { // the rooster. Deliberately awful.
        const c = this.ctx;
        const o = c.createOscillator(); o.type = 'sawtooth';
        const g = c.createGain();
        o.frequency.setValueAtTime(380, t);
        o.frequency.exponentialRampToValueAtTime(900, t + .13);
        o.frequency.exponentialRampToValueAtTime(300, t + .42);
        o.frequency.exponentialRampToValueAtTime(620, t + .60);
        g.gain.setValueAtTime(.0001, t);
        g.gain.linearRampToValueAtTime(.22, t + .03);
        g.gain.setValueAtTime(.22, t + .50);
        g.gain.exponentialRampToValueAtTime(.0001, t + .72);
        const wob = c.createOscillator(); wob.frequency.value = 26;
        const wg = c.createGain(); wg.gain.value = 70;
        wob.connect(wg); wg.connect(o.frequency);
        o.connect(g); g.connect(S);
        o.start(t); wob.start(t); o.stop(t + .8); wob.stop(t + .8);
        break;
      }
      case 'death':
        ['A4','G#4','G4','F#4','F4','E4'].forEach((n, i) =>
          this.fm(S, f(n), t + i * .13, .12, { ...PATCH.reedy, gain: .20 }));
        break;
    }
  }

  // ---- music ---------------------------------------------------------------
  // A cantiga: modal, drone-backed, no leading tone. 13th-century Iberian music
  // is basically already chiptune, which is convenient.
  play(song) {
    if (!this.ready) return;
    this.song = song; this.step = 0; this.next = this.ctx.currentTime + .1;
    clearInterval(this.timer);
    this.timer = setInterval(() => this._sched(), 25);
  }
  stop() { clearInterval(this.timer); this.timer = null; this.song = null; }

  _sched() {
    if (!this.song || !this.musicOn) return;
    const spb = 60 / this.song.bpm / 2;                  // one step = an eighth note
    while (this.next < this.ctx.currentTime + 0.25) {
      const s = this.step % this.song.len;
      for (const tr of this.song.tracks) {
        const ev = tr.notes[s];
        if (!ev) continue;
        const [note, beats] = Array.isArray(ev) ? ev : [ev, 1];
        if (note === '-') continue;
        if (note === '*') { this.hit(this.next, { freq: 130, dur: .12, gain: .16, q: .7 }); continue; }
        this.fm(this.mus, f(note), this.next, beats * spb * .92,
                { ...PATCH[tr.patch], gain: PATCH[tr.patch].gain * (tr.vol ?? 1) });
      }
      this.next += spb; this.step++;
    }
  }
}

// "O Regresso do Gama" — the title, the intro, the Cais, and the ending.
// The triumphal march Lisbon is singing the day the fleet comes home:
// anthem-shaped (a rising heroes-of-the-sea fanfare, dotted march descents),
// horns forward, drums underneath. Soeiro hates every bar of it.
export const SONG_ABERTURA = {
  bpm: 106, len: 32,
  tracks: [
    // march bass: tonic and dominant taking turns like oars
    { patch: 'drone', vol: 1.0, notes: {
        0: 'C3', 2: 'G2', 4: 'C3', 6: 'G2',
        8: 'C3', 10: 'G2', 12: 'C3', 14: 'E3',
        16: 'F2', 18: 'C3', 20: 'G2', 22: 'B2',
        24: 'C3', 26: 'G2', 28: ['C3', 4] } },
    // the fanfare: up the arpeggio like a prow over a wave, then the proud
    // dotted descent
    { patch: 'horn', vol: 1.0, notes: {
        0: 'C4', 1: 'E4', 2: 'G4', 3: 'C5', 4: ['E5', 3], 7: 'D5',
        8: ['C5', 2], 10: 'B4', 11: 'A4', 12: ['G4', 4],
        16: 'A4', 17: 'B4', 18: 'C5', 19: 'D5', 20: ['E5', 2], 22: 'D5', 23: 'C5',
        24: ['D5', 2], 26: 'B4', 27: 'G4', 28: ['C5', 4] } },
    // second horn a third below, arriving for the big phrases
    { patch: 'horn', vol: .5, notes: {
        4: ['C5', 3], 12: ['E4', 4], 20: ['C5', 2], 24: ['B4', 2], 28: ['E5', 4] } },
    // the crowd's tambourines-and-plucked-strings layer
    { patch: 'pluck', vol: .5, notes: {
        0: 'G4', 2: 'E4', 4: 'G4', 6: 'C5', 8: 'G4', 10: 'E4', 12: 'B4', 14: 'D4',
        16: 'A4', 18: 'F4', 20: 'B4', 22: 'D5', 24: 'G4', 26: 'F4', 28: 'E4', 30: 'G4' } },
    // bells for the church towers, which are also celebrating
    { patch: 'bell', vol: .55, notes: { 0: 'C5', 12: 'G4', 28: 'C5' } },
    // march drums, with the roll into the repeat
    { patch: 'drone', vol: 0, notes: {
        0: '*', 2: '*', 4: '*', 6: '*', 8: '*', 10: '*', 12: '*', 14: '*',
        16: '*', 18: '*', 20: '*', 22: '*', 24: '*', 26: '*', 28: '*', 30: '*', 31: '*' } },
  ],
};

// "A Casa dos Escrivães" — eleven years of this. A quill-scratch clock of a
// tune that never quite goes anywhere, on purpose.
export const SONG_ESCRITORIO = {
  bpm: 84, len: 32,
  tracks: [
    { patch: 'drone', vol: .6, notes: {
        0: ['A2', 8], 8: ['A2', 8], 16: ['F2', 8], 24: ['E2', 8] } },
    { patch: 'pluck', vol: .6, notes: {
        0: 'A3', 4: 'E4', 8: 'C4', 12: 'E4',
        16: 'A3', 20: 'D4', 24: 'C4', 28: 'B3' } },
    { patch: 'reedy', vol: .45, notes: {
        16: 'E4', 19: 'F4', 22: 'E4', 24: ['C4', 3], 28: ['B3', 3] } },
  ],
};

// "O Armazém" — eleven tons of nothing, at rest. Low, hollow, patient.
export const SONG_ARMAZEM = {
  bpm: 66, len: 32,
  tracks: [
    { patch: 'drone', vol: .9, notes: {
        0: ['D2', 8], 8: ['D2', 8], 16: ['C2', 8], 24: ['D2', 8] } },
    { patch: 'reedy', vol: .7, notes: {
        0: 'D3', 6: 'D#3', 8: ['D3', 4],
        16: 'C3', 22: 'D#3', 24: ['D3', 6] } },
    { patch: 'pluck', vol: .35, notes: { 4: 'A4', 20: 'G4', 28: 'A#4' } },
  ],
};

// "O Beco" — indoors and out of the sun. Same key as the Ribeira theme, half
// the tempo and none of the confidence.
export const SONG_BECO = {
  bpm: 74, len: 32,
  tracks: [
    { patch: 'drone', vol: .8, notes: {
        0: ['D3', 8], 8: ['B2', 8], 16: ['C3', 8], 24: ['A2', 8] } },
    { patch: 'reedy', vol: .85, notes: {
        0:'D4', 3:'F4', 6:'E4', 8:'D4', 11:'C4', 14:'D4',
        16:'E4', 19:'G4', 22:'F4', 24:'E4', 27:'D4', 30:['C4',2] } },
    { patch: 'pluck', vol: .4, notes: {
        0:'A4', 6:'D4', 8:'G4', 14:'B3', 16:'A4', 22:'E4', 24:'A3', 30:'C4' } },
  ],
};

// "A Taberna" — a drinking song played slightly too many times tonight.
export const SONG_TABERNA = {
  bpm: 132, len: 32,
  tracks: [
    { patch: 'drone', vol: .9, notes: {
        0:'D3', 3:'D3', 6:'A2', 8:'D3', 11:'D3', 14:'A2',
        16:'C3', 19:'C3', 22:'G2', 24:'D3', 27:'A2', 30:'D3' } },
    { patch: 'reedy', vol: .95, notes: {
        0:'D4', 2:'E4', 3:'F4', 5:'E4', 6:'F4', 8:'G4', 10:'F4', 11:'E4',
        12:'D4', 14:'C4', 16:'E4', 18:'F4', 19:'G4', 21:'A4', 22:'G4',
        24:'F4', 26:'E4', 27:'D4', 28:['D4', 3] } },
    { patch: 'pluck', vol: .5, notes: {
        1:'A3', 4:'D4', 7:'A3', 9:'D4', 12:'A3', 15:'C4',
        17:'C4', 20:'E4', 23:'C4', 25:'A3', 28:'D4', 31:'A3' } },
    { patch: 'drone', vol: 0, notes: {
        0:'*', 3:'*', 5:'*', 6:'*', 8:'*', 11:'*', 13:'*', 14:'*',
        16:'*', 19:'*', 21:'*', 22:'*', 24:'*', 27:'*', 29:'*', 30:'*' } },
  ],
};

// "A Ribeira" — the city celebrating, heard by someone who isn't invited.
// A court dance in D minor: brisk, pleased with itself, faintly cheap.
export const SONG_RIBEIRA = {
  bpm: 116, len: 32,
  tracks: [
    { patch: 'drone', vol: .95, notes: {
        0:'D3', 2:'A3', 4:'D3', 6:'F3',
        8:'C3', 10:'G3', 12:'C3', 14:'E3',
        16:'B2', 18:'F3', 20:'B2', 22:'D3',
        24:'A2', 26:'E3', 28:'A2', 30:'C3' } },
    { patch: 'reed', vol: 1, notes: {
        0:'D5', 1:'E5', 2:'F5', 4:'E5', 6:'D5', 7:'C5',
        8:'C5', 9:'D5', 10:'E5', 12:'D5', 14:'C5', 15:'A4',
        16:'B4', 17:'C5', 18:'D5', 20:'C5', 22:'B4', 23:'A4',
        24:['A4',3], 27:'C5', 28:['D5',4] } },
    { patch: 'pluck', vol: .55, notes: {
        0:'A4', 3:'D5', 5:'A4', 8:'G4', 11:'C5', 13:'G4',
        16:'F4', 19:'B4', 21:'F4', 24:'E4', 27:'A4', 29:'E4' } },
    { patch: 'drone', vol: 0, notes: {
        0:'*', 2:'*', 3:'*', 6:'*', 8:'*', 10:'*', 11:'*', 14:'*',
        16:'*', 18:'*', 19:'*', 22:'*', 24:'*', 26:'*', 27:'*', 30:'*' } },
  ],
};
