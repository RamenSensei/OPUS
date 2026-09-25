/* ==========================================================================
   paper.js — washi & print finish, applied over every frame.
   A single texture is generated once (deterministically) at stage size:
   kozo fibres, pulp mottling and aged edges (焼け). The engine multiplies
   it over the finished frame, which binds every scene into one "print".
   ========================================================================== */
(function (TSUKI) {
  'use strict';

  const U = TSUKI.U, B = TSUKI.B;
  const P = (TSUKI.PAPER = {});

  let grain = null;   // multiply layer (paper tone + fibres + mottling)
  let light = null;   // screen layer (tiny bright flecks of gofun)

  /** Build textures at logical size (default 1920×1080). ~60–120ms once. */
  P.build = (W = 1920, H = 1080) => {
    // work at half resolution for the noise, upscale smoothly: washi mottling
    // is low-frequency, and fibres are drawn as vectors at full resolution.
    const w = Math.ceil(W / 2), h = Math.ceil(H / 2);
    const low = B.canvas(w, h);
    const lc = low.getContext('2d');
    const img = lc.createImageData(w, h);
    const d = img.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const m = U.fbm2(x / 90, y / 90, 4, 3);          // pulp clouds
        const f = U.hash2(x * 1.7, y * 2.3);              // fine grain
        const nx = x / w - 0.5, ny = y / h - 0.5;
        const edge = Math.pow(Math.min(1, Math.hypot(nx * 1.1, ny * 1.25) * 1.55), 3.2); // 焼け
        let v = 250 - (m - 0.5) * 22 - f * 10 - edge * 30;
        // warm tint: multiply layer, so white = no change
        d[i] = U.clamp(v + 2, 0, 255);
        d[i + 1] = U.clamp(v - 3 - edge * 6, 0, 255);
        d[i + 2] = U.clamp(v - 14 - edge * 16, 0, 255);
        d[i + 3] = 255;
      }
    }
    lc.putImageData(img, 0, 0);

    grain = B.canvas(W, H);
    const g = grain.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(low, 0, 0, W, H);
    // kozo fibres: long, thin, faintly darker hairs
    const r = U.rng(77);
    g.lineCap = 'round';
    for (let i = 0; i < 900; i++) {
      const x = r() * W, y = r() * H, len = U.lerp(12, 70, r()), a = r() * Math.PI;
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
      const x = r() * W, y = r() * H;
      g.fillStyle = `rgba(160,140,110,${U.lerp(0.03, 0.08, r())})`;
      g.beginPath();
      g.ellipse(x, y, U.lerp(3, 10, r()), U.lerp(1, 3, r()), r() * Math.PI, 0, U.TAU);
      g.fill();
    }

    light = B.canvas(W, H);
    const l = light.getContext('2d');
    for (let i = 0; i < 2600; i++) {
      const x = r() * W, y = r() * H;
      l.fillStyle = `rgba(255,250,235,${U.lerp(0.03, 0.12, r())})`;
      const s = U.lerp(0.6, 1.8, r());
      l.fillRect(x, y, s, s);
    }
    for (let i = 0; i < 500; i++) {
      const x = r() * W, y = r() * H, len = U.lerp(8, 40, r()), a = r() * Math.PI;
      l.strokeStyle = `rgba(255,248,230,${U.lerp(0.04, 0.1, r())})`;
      l.lineWidth = U.lerp(0.4, 1, r());
      l.beginPath();
      l.moveTo(x, y);
      l.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      l.stroke();
    }
  };

  /**
   * Apply the paper finish to a context already scaled to logical units.
   * strength 0..1 (engine default 1).
   */
  P.apply = (ctx, strength = 1, W = 1920, H = 1080) => {
    if (!grain) P.build(W, H);
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.9 * strength;
    ctx.drawImage(grain, 0, 0, W, H);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.8 * strength;
    ctx.drawImage(light, 0, 0, W, H);
    ctx.restore();
  };

  P.grainCanvas = () => grain;
})(window.TSUKI = window.TSUKI || {});
