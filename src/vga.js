// vga.js — the screen. Logic lives in a 320x200 coordinate space (every
// hotspot, sprite and UI position), but rendering happens at 2x — 640x400,
// the mid-90s Sierra resolution — so painted backgrounds stay sharp and text
// is crisp. The background PNGs are sampled straight from their full
// resolution; no palette crush, no dither. Period feel comes from the art
// and a light CRT overlay, not from grinding the image down.

export const W = 320, H = 200;      // logic space
export const RS = 3;                // render scale: 960x600 internal
export const RW = W * RS, RH = H * RS;

export class Screen {
  constructor(canvas) {
    this.out = canvas;
    this.octx = canvas.getContext('2d');
    this.buf = document.createElement('canvas');
    this.buf.width = RW; this.buf.height = RH;
    this.ctx = this.buf.getContext('2d');
    // Persistent 2x transform: all game drawing uses 320x200 coordinates.
    this.ctx.setTransform(RS, 0, 0, RS, 0, 0);
    this.resize();
  }

  resize() {
    // Fit the window in CSS pixels, back the canvas at device resolution so
    // retina displays get the full sharpness of the source art.
    const dpr = window.devicePixelRatio || 1;
    const s = Math.min(window.innerWidth / RW, window.innerHeight / RH);
    const cssW = Math.round(RW * s), cssH = Math.round(RH * s);
    this.out.style.width = cssW + 'px';
    this.out.style.height = cssH + 'px';
    this.out.width = Math.round(cssW * dpr);
    this.out.height = Math.round(cssH * dpr);
    this.octx.imageSmoothingEnabled = true;
    this.octx.imageSmoothingQuality = 'high';
  }

  // screen pixel -> 320x200 game coordinate
  toGame(clientX, clientY) {
    const r = this.out.getBoundingClientRect();
    return {
      x: (clientX - r.left) * (W / r.width),
      y: (clientY - r.top) * (H / r.height),
    };
  }

  present() {
    this.octx.drawImage(this.buf, 0, 0, this.out.width, this.out.height);
  }
}
