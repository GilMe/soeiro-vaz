// actor.js — Soeiro Vaz, drawn as code. A clerk in a dark gown who believes
// he dresses like a merchant: white collar, good belt, a roll of documents
// he is never without. Proportions ~1:6 head-to-height, sized to stand
// honestly beside the painted doorways. Walks in true profile: left is a
// mirror of right, and he leans into the stride.

import { fill, shade } from './art.js';
import { vol, folds, limb, hand, head, eyes } from './figure.js';

export class Actor {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y;
    this.tx = x; this.ty = y;
    this.facing = 'front';
    this.phase = 0;
    this.moving = false;
    this.speed = opts.speed ?? 46;
    this.gown = opts.cloak ?? '#3b3a4c';
    this.hair = opts.hood ?? '#2a2118';
    this.skin = opts.skin ?? '#c9a37a';
    this.onStep = opts.onStep ?? (() => {});
    this.onArrive = null;
    this._lastStep = 0;
  }

  goTo(x, y, cb) { this.tx = x; this.ty = y; this.onArrive = cb || null; }

  update(dt, scene) {
    const dx = this.tx - this.x, dy = this.ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 1.2) {
      if (this.moving) { this.moving = false; this.phase = 0; }
      if (this.onArrive) { const cb = this.onArrive; this.onArrive = null; cb(); }
      return;
    }
    this.moving = true;
    const sp = this.speed * (0.55 + 0.45 * this.scale(scene));
    const step = Math.min(d, sp * dt);
    this.x += (dx / d) * step;
    this.y += (dy / d) * step * 0.62;
    this.facing = Math.abs(dx) > Math.abs(dy) * 1.3
      ? (dx < 0 ? 'left' : 'right')
      : (dy < 0 ? 'back' : 'front');
    this.phase += step * 0.4;
    const s = Math.floor(this.phase / 3);
    if (s !== this._lastStep) { this._lastStep = s; this.onStep(); }
  }

  // Perspective: scale across the walkable band. Rooms with steep painted
  // perspective (the office and its huge foreground desks) override the
  // range; the default matches the outdoor scenes.
  scale(scene) {
    const { top, bottom } = scene.walk;
    const t = Math.max(0, Math.min(1, (this.y - top) / (bottom - top)));
    const ps = scene.playerScale || { min: 0.62, max: 1.0 };
    return ps.min + t * (ps.max - ps.min);
  }

  draw(ctx, scene) {
    const s = this.scale(scene);
    const HT = 54 * s;                       // full height
    const x = this.x, y = this.y;
    const side = this.facing === 'left' ? -1 : this.facing === 'right' ? 1 : 0;
    const back = this.facing === 'back';
    const prof = side !== 0;                 // seen in profile
    const swing = this.moving ? Math.sin(this.phase * 0.95) : 0;
    // the step bob — weight actually transferring from foot to foot
    const bob = this.moving ? -Math.abs(Math.sin(this.phase * 0.95)) * 1.5 * s : 0;

    const headR = HT * 0.085;                // ~1:6 proportions
    const legH  = HT * 0.30;
    const bodyW = HT * 0.30 * (prof ? 0.80 : 1);   // narrower from the side
    const hipY  = y - legH + bob * 0.5;
    const neckY = y - HT + headR * 2.6 + bob;
    const headY = y - HT + headR * 1.15 + bob;

    // ground shadow (never mirrored)
    ctx.fillStyle = 'rgba(10,8,6,.35)';
    ctx.beginPath();
    ctx.ellipse(x, y + 1, bodyW * 0.95, Math.max(1.6, 2.6 * s), 0, 0, Math.PI * 2);
    ctx.fill();

    // Left is a mirror of right: everything below draws the right-facing
    // sprite, so the two directions read genuinely differently — documents
    // forward, head forward, lean into the walk.
    ctx.save();
    if (side === -1) { ctx.translate(2 * x, 0); ctx.scale(-1, 1); }
    const lean = prof && this.moving ? 1.6 * s : 0;

    // legs: dark hose, striding
    const la = swing * legH * 0.5, lb = -la;
    limb(ctx, x - bodyW * 0.14 + lean * 0.4, hipY, x - bodyW * 0.18 + la, y, Math.max(1.6, HT * 0.075), '#2b2733');
    limb(ctx, x + bodyW * 0.14 + lean * 0.4, hipY, x + bodyW * 0.18 + lb, y, Math.max(1.6, HT * 0.075), '#2b2733');
    // shoes point the way he walks in profile
    fill(ctx, x - bodyW * 0.18 + la - (prof ? 0.4 : 1.6) * s, y - 1.2 * s, 3.6 * s, 1.6 * s, '#1c1812');
    fill(ctx, x + bodyW * 0.18 + lb - (prof ? 0.4 : 1.6) * s, y - 1.2 * s, 3.6 * s, 1.6 * s, '#1c1812');

    // the gown: knee-length, slightly flared, gradient-shaded
    const hemY = hipY + legH * 0.28;
    vol(ctx, [
      [x - bodyW * 0.40 + lean, neckY], [x + bodyW * 0.40 + lean, neckY],
      [x + bodyW * 0.56, hemY], [x - bodyW * 0.56, hemY],
    ], this.gown);
    folds(ctx, x + lean * 0.5, neckY + HT * 0.1, hemY, 2);
    // belt
    fill(ctx, x - bodyW * 0.46 + lean * 0.5, hipY - legH * 0.30, bodyW * 0.92, Math.max(1.2, 2 * s), '#6a4e26');
    fill(ctx, x - bodyW * 0.46 + lean * 0.5, hipY - legH * 0.30, bodyW * 0.92, Math.max(0.6, 0.8 * s), shade('#6a4e26', 18));
    if (!prof) fill(ctx, x - 1.2 * s, hipY - legH * 0.30, 2.4 * s, Math.max(1.2, 2 * s), '#c8ac5e');

    const armW = Math.max(1.6, HT * 0.065);
    if (back) {
      limb(ctx, x - bodyW * 0.36, neckY + headR,
           x - bodyW * 0.40 - swing * 3 * s, hipY - legH * 0.2, armW, this.gown);
      limb(ctx, x + bodyW * 0.36, neckY + headR,
           x + bodyW * 0.40 + swing * 3 * s, hipY - legH * 0.2, armW, this.gown);
    } else if (prof) {
      // the near arm swings visibly across the body
      limb(ctx, x + lean * 0.6, neckY + headR,
           x + bodyW * 0.30 + swing * 4 * s + lean, hipY - legH * 0.35, armW, this.gown);
      hand(ctx, x + bodyW * 0.30 + swing * 4 * s + lean, hipY - legH * 0.28, Math.max(1, 1.5 * s), this.skin);
    } else {
      // both arms swinging in opposition
      limb(ctx, x - bodyW * 0.34, neckY + headR,
           x - bodyW * 0.40 - swing * 3 * s, hipY - legH * 0.2, armW, this.gown);
      hand(ctx, x - bodyW * 0.40 - swing * 3 * s, hipY - legH * 0.14, Math.max(1, 1.6 * s), this.skin);
      limb(ctx, x + bodyW * 0.34, neckY + headR,
           x + bodyW * 0.40 + swing * 3 * s, hipY - legH * 0.2, armW, this.gown);
      hand(ctx, x + bodyW * 0.40 + swing * 3 * s, hipY - legH * 0.14, Math.max(1, 1.6 * s), this.skin);
    }

    // collar: the one clean white thing he owns
    if (!back) {
      const cw = bodyW * (prof ? 0.34 : 0.44);
      fill(ctx, x - cw / 2 + lean + (prof ? bodyW * 0.10 : 0), neckY - 0.6 * s, cw, Math.max(1.2, 2 * s), '#e8e2d0');
    }

    // head — pushed forward in profile so he looks where he is going
    const hx = x + (prof ? headR * 0.55 : 0) + lean;
    head(ctx, hx, headY, headR, this.skin, this.hair, back ? 2 : (prof ? 1 : 0));
    if (!back) eyes(ctx, hx, headY, headR, prof ? 1 : 0);

    ctx.restore();
  }
}
