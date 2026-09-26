/* ==========================================================================
   paper.js — washi & print finish, applied over every frame.
   A texture pair is generated once (deterministically): kozo fibres, pulp
   mottling and aged edges (焼け) multiplied, and tiny gofun flecks screened.
   It binds every scene into one "print".
   Normally the pair is painted ONCE per stage size into two canvases that
   sit over the film (P.mount) and the browser's compositor blends them
   (mix-blend-mode multiply / screen, see css/film.css), so no frame pays
   for it. P.apply composites the same pair into a canvas instead, for a
   canvas-only export.
   ========================================================================== */
(function (TSUKI) {
  'use strict';

  const U = TSUKI.U, B = TSUKI.B;
  const P = (TSUKI.PAPER = {});

  let LW = 1920, LH = 1080;   // logical size the textures are authored at
  let low = null;             // half-res pulp mottling (the only costly part)

  /** Set the logical size (default 1920×1080). The textures are painted lazily. */
  P.build = (W = 1920, H = 1080) => {
    LW = W; LH = H;
    low = null;
    fitW = fitH = 0;
  };

  // work at half resolution for the noise, upscale smoothly: washi mottling
  // is low-frequency, and fibres are drawn as vectors at full resolution.
  function mottling() {
    if (low) return low;
    const w = Math.ceil(LW / 2), h = Math.ceil(LH / 2);
    low = B.canvas(w, h);
    const lc = low.getContext('2d');
    const img = lc.createImageData(w, h);
    const d = img.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const m = U.fbm2(x / 90, y / 90, 4, 3);          // pulp clouds (quiet: washi, not Perlin)
        // the fibre flow: kozo lies mostly one way (the sheet was shaken
        // along its length), so the pulp thins and thickens in long streaks
        const fl = U.fbm2(x / 160 + y / 900, y / 6, 2, 8);
        const f = U.hash2(x * 1.7, y * 2.3);              // fine grain
        const nx = x / w - 0.5, ny = y / h - 0.5;
        const edge = Math.pow(Math.min(1, Math.hypot(nx * 1.1, ny * 1.25) * 1.55), 3.2); // 焼け
        let v = 250 - (m - 0.5) * 12 - (fl - 0.5) * 7 - f * 10 - edge * 30;
        // warm tint: multiply layer, so white = no change
        d[i] = U.clamp(v + 2, 0, 255);
        d[i + 1] = U.clamp(v - 3 - edge * 6, 0, 255);
        d[i + 2] = U.clamp(v - 14 - edge * 16, 0, 255);
        d[i + 3] = 255;
      }
    }
    lc.putImageData(img, 0, 0);
    return low;
  }

  /** Paint the multiply layer (g) and the screen layer (l), both bw×bh, directly at that size. */
  function paint(g, l, bw, bh) {
    const s = bw / LW;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.drawImage(mottling(), 0, 0, bw, bh);
    g.setTransform(s, 0, 0, s, 0, 0);
    // kozo fibres: long, thin, faintly darker hairs, lying mostly along the
    // sheet's flow (FLOW ± a loose spread) — a few stray across it
    const r = U.rng(77);
    g.lineCap = 'round';
    const FLOW = -0.08;
    const along = () => FLOW + (r() + r() + r() - 1.5) * 0.7 + (r() < 0.12 ? Math.PI / 2 : 0);
    for (let i = 0; i < 900; i++) {
      const x = r() * LW, y = r() * LH, len = U.lerp(12, 70, r()), a = along();
      const bend = U.lerp(-8, 8, r());
      g.strokeStyle = `rgba(150,128,96,${U.lerp(0.05, 0.16, r())})`;
      g.lineWidth = U.lerp(0.4, 1.1, r());
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a) * len * 0.5 + bend, y + Math.sin(a) * len * 0.5 - bend, x + Math.cos(a) * len, y + Math.sin(a) * len);
      g.stroke();
    }
    // a few fibre clumps
    for (let i = 0; i < 40; i++) {
      const x = r() * LW, y = r() * LH;
      g.fillStyle = `rgba(160,140,110,${U.lerp(0.03, 0.08, r())})`;
      g.beginPath();
      g.ellipse(x, y, U.lerp(3, 10, r()), U.lerp(1, 3, r()), r() * Math.PI, 0, U.TAU);
      g.fill();
    }

    l.setTransform(1, 0, 0, 1, 0, 0);
    l.clearRect(0, 0, bw, bh);
    l.setTransform(s, 0, 0, s, 0, 0);
    for (let i = 0; i < 2600; i++) {
      const x = r() * LW, y = r() * LH;
      l.fillStyle = `rgba(255,250,235,${U.lerp(0.03, 0.12, r())})`;
      const sz = U.lerp(0.6, 1.8, r());
      l.fillRect(x, y, sz, sz);
    }
    // light fibres: few, faint, long and curved like the dark ones (straight
    // bright segments read as film scratches on dark inks), loosely clustered
    // in drifts along the flow — kozo in a sheet is never evenly spread
    const rl = U.rng(78);
    l.lineCap = 'round';
    for (let c = 0; c < 22; c++) {
      const cx = rl() * LW, cy = rl() * LH;
      const n = 3 + Math.floor(rl() * 8);
      for (let i = 0; i < n; i++) {
        const x = cx + (rl() - 0.5) * 260, y = cy + (rl() - 0.5) * 90;
        const len = U.lerp(20, 90, Math.pow(rl(), 0.8));
        const a = FLOW + (rl() + rl() - 1) * 0.45;
        const bend = U.lerp(-0.22, 0.22, rl()) * len;
        const ca = Math.cos(a), sa = Math.sin(a);
        l.strokeStyle = `rgba(255,249,234,${U.lerp(0.02, 0.05, rl())})`;
        l.lineWidth = U.lerp(0.45, 0.9, rl());
        l.beginPath();
        l.moveTo(x, y);
        l.quadraticCurveTo(x + ca * len * 0.5 - sa * bend, y + sa * len * 0.5 + ca * bend, x + ca * len, y + sa * len);
        l.stroke();
      }
    }
  }

  // the textures at the stage's backing size: either the mounted DOM
  // canvases (compositor) or two offscreen copies (P.apply)
  let fitW = 0, fitH = 0, grainFit = null, lightFit = null, mounted = null;

  /**
   * Hand the paper to the compositor: grainEl / lightEl are canvases placed
   * over the film (css: mix-blend-mode multiply / screen). strength 0..1.
   */
  P.mount = (grainEl, lightEl, strength = 1) => {
    mounted = { g: grainEl, l: lightEl };
    grainFit = lightFit = null;      // the offscreen pair is no longer needed
    fitW = fitH = 0;
    grainEl.style.opacity = String(0.9 * strength);
    lightEl.style.opacity = String(0.8 * strength);
  };
  P.mounted = () => !!mounted;

  /** Size and paint the textures for a backing store of bw×bh (no-op if unchanged). */
  P.fit = (bw, bh) => {
    if (bw === fitW && bh === fitH) return;
    fitW = bw; fitH = bh;
    if (mounted) {
      for (const c of [mounted.g, mounted.l]) { c.width = bw; c.height = bh; }
      paint(mounted.g.getContext('2d', { alpha: false }), mounted.l.getContext('2d'), bw, bh);
    } else {
      grainFit = B.canvas(bw, bh);
      lightFit = B.canvas(bw, bh);
      paint(grainFit.getContext('2d'), lightFit.getContext('2d'), bw, bh);
    }
  };

  /**
   * Composite the paper finish over the whole backing store of ctx
   * (canvas-only path; the film normally uses P.mount). strength 0..1.
   */
  P.apply = (ctx, strength = 1) => {
    const cv = ctx.canvas;
    if (mounted) return;
    P.fit(cv.width, cv.height);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.9 * strength;
    ctx.drawImage(grainFit, 0, 0);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.8 * strength;
    ctx.drawImage(lightFit, 0, 0);
    ctx.restore();
  };

  P.grainCanvas = () => (mounted ? mounted.g : grainFit);
})(window.TSUKI = window.TSUKI || {});
