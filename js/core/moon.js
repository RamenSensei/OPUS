/* ==========================================================================
   moon.js — the one moon (TSUKI.MOON).
   The moon is a single unbroken celestial arc for the whole film. Its angle
   φ(T) is a monotone cubic through the screenplay's keypoints; each master
   shot projects φ with its own mapping. The disc is never inked: it is the
   bare washi showing through a hole in every plate, glazed a little by the
   hour, swept by a band of mica — and, from T 106 on, carrying the rabbit.
   ========================================================================== */
(function (TSUKI) {
  'use strict';

  const U = TSUKI.U, B = TSUKI.B, C = TSUKI.C;
  const MOON = (TSUKI.MOON = {});

  /* ---------------- the clock (design/screenplay.json → moon_clock) ------- */
  MOON.KEYS = [
    [14, -0.22], [16, -0.14], [20, -0.02], [24, 0.08], [32, 0.26], [40, 0.4],
    [66, 0.74], [90, 1.02], [118, 1.32], [140, Math.PI / 2], [160, 1.96],
    [190, 2.46], [206, 2.8], [214, 3.02], [219, Math.PI],
  ];
  MOON.CULMINATION = 140;
  MOON.MARIA_BORN = 106;       // the rabbit's smoke settles into the maria

  // Fritsch–Carlson monotone cubic Hermite through KEYS
  const pchip = (() => {
    const xs = MOON.KEYS.map((k) => k[0]), ys = MOON.KEYS.map((k) => k[1]);
    const n = xs.length, d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else {
        const h0 = xs[i] - xs[i - 1], h1 = xs[i + 1] - xs[i];
        const w1 = 2 * h1 + h0, w2 = h1 + 2 * h0;
        m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
      }
    }
    return (x) => {
      if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
      if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
      let i = 0;
      while (x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], s = (x - xs[i]) / h;
      const h00 = 2 * s * s * s - 3 * s * s + 1, h10 = s * s * s - 2 * s * s + s;
      const h01 = -2 * s * s * s + 3 * s * s, h11 = s * s * s - s * s;
      return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1];
    };
  })();

  /** Celestial angle φ at film time T (radians; 0 = horizon east, π/2 = culmination). */
  MOON.phi = (T) => pchip(T);

  /* ---------------- per-shot projections ------------------------------- */
  /** Shot A (wide garden): position and apparent size (horizon illusion). */
  MOON.A = (T) => {
    const p = MOON.phi(T), s = Math.sin(p);
    return { x: 960 - 800 * Math.cos(p), y: 700 - 560 * s, r: 72 + 38 * Math.pow(1 - s, 2), phi: p };
  };
  /** Shot B (shoji wall): glow centre behind the paper + the round-window disc. */
  MOON.B = (T) => {
    const p = MOON.phi(T);
    const gx = 960 - 420 * Math.cos(p), gy = 960 - 810 * Math.sin(p);
    // the disc (r 64) rides the glow centre; it is seen only through the
    // round window (960,150) r 110 — fully inside ≈T 131–146, centred at 140.
    return { glowX: gx, glowY: gy, glowR: 220, x: gx, y: gy, r: 64, window: { x: 960, y: 150, r: 110 }, phi: p };
  };
  /** Shot D (looking straight up): fixed. */
  MOON.D = () => ({ x: 960, y: 430, r: 260, haloR: 420 });
  /** Shot E (dawn, art-directed): descends onto Fuji's summit. */
  MOON.E = (T) => {
    const a = U.seg(T, 206, 214, U.ease.inOutSine);
    const b = U.seg(T, 214, 218.5, U.ease.inSine);
    const x = U.lerp(1110, 1180, a);
    const y = U.lerp(250, 330, a) + b * 150;
    return { x, y, r: 48 };
  };

  /* ---------------- colour law ----------------------------------------- */
  /** Glaze over the bare paper: {color, alpha} by the hour. */
  MOON.glaze = (T) => {
    const p = MOON.phi(T);
    if (p < 0.3) return { color: C.yamabuki, alpha: 0.55 * (1 - Math.max(0, Math.sin(p))) };
    if (p <= 2.7) {
      // cross-fade out of the yamabuki glaze over φ 0.3 → 0.45
      const w = U.smoothstep(0.3, 0.45, p);
      return w < 1
        ? { color: U.mix(C.yamabuki, C.geppaku, w), alpha: U.lerp(0.55 * (1 - Math.sin(0.3)), 0.2, w) }
        : { color: C.geppaku, alpha: 0.2 };
    }
    return { color: C.ginnezu, alpha: U.lerp(0.2, 0.5, U.smoothstep(2.7, 3.14, p)) };
  };

  /** Kira strength (fades toward dawn). */
  MOON.kira = (T) => 1 - U.smoothstep(2.7, 3.1, MOON.phi(T));

  /* ---------------- the maria (rabbit plate R) ------------------------- */
  /**
   * Paint the rabbit maria clipped to the disc. The shape here is THE
   * rabbit: the smoke in 四 settles into exactly this path.
   */
  MOON.maria = (ctx, x, y, r, alpha, color = C.sumi) => {
    if (alpha <= 0) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, U.TAU);
    ctx.clip();
    ctx.translate(x, y);
    ctx.fillStyle = U.rgba(color, alpha);
    B.rabbitMaria(ctx, r * 0.92);
    ctx.restore();
  };

  /**
   * Draw the paper moon at (x, y, r) for film time T.
   * opts:
   *   paper    — disc base colour (default 生成: the washi itself)
   *   glaze    — override {color, alpha}
   *   maria    — override rabbit alpha (default 0.22 after T 106, else 0)
   *   halo     — 0..1 月暈 strength (bokashi ring outside the disc)
   *   haloColor, haloR
   *   kira     — 0..1 multiplier on the mica sweep (default by hour)
   *   fringe   — true: chromatic misregistration fringes from TSUKI.PRINT
   *   alpha    — overall
   */
  MOON.draw = (ctx, x, y, r, T, opts = {}) => {
    const a = opts.alpha == null ? 1 : opts.alpha;
    if (a <= 0 || r <= 0) return;
    ctx.save();
    ctx.globalAlpha *= a;
    if (opts.halo) {
      const hr = opts.haloR || r * 1.7;
      const g = ctx.createRadialGradient(x, y, r, x, y, hr);
      const hc = opts.haloColor || C.geppaku;
      g.addColorStop(0, U.rgba(hc, 0.28 * opts.halo));
      g.addColorStop(0.55, U.rgba(hc, 0.1 * opts.halo));
      g.addColorStop(1, U.rgba(hc, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, hr, 0, U.TAU);
      ctx.fill();
    }
    // misregistration fringes: the hole in each plate moves with its plate
    const P = TSUKI.PRINT;
    if (opts.fringe !== false && P) {
      const st = P.state(T);
      const f = (id, col) => {
        const o = st.off[id];
        if (!o || (Math.abs(o[0]) < 0.5 && Math.abs(o[1]) < 0.5) || st.alpha[id] <= 0) return;
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, U.TAU);
        ctx.clip();
        ctx.fillStyle = U.rgba(col, 0.85 * st.alpha[id]);
        ctx.beginPath();
        ctx.arc(x, y, r + 2, 0, U.TAU);
        ctx.arc(x + o[0], y + o[1], r, 0, U.TAU, true);
        ctx.fill('evenodd');
        ctx.restore();
      };
      f('P6', C.bero);
      f('P5', C.ai);
      f('P2', C.yamabuki);
    }
    // the bare paper
    ctx.fillStyle = opts.paper || C.kinari;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, U.TAU);
    ctx.fill();
    // glaze
    const gz = opts.glaze || MOON.glaze(T);
    if (gz.alpha > 0) {
      const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.25, r * 0.1, x, y, r);
      g.addColorStop(0, U.rgba(gz.color, gz.alpha * 0.75));
      g.addColorStop(1, U.rgba(gz.color, Math.min(1, gz.alpha * 1.15)));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, U.TAU);
      ctx.fill();
    }
    // the rabbit
    const ma = opts.maria != null ? opts.maria : T >= MOON.MARIA_BORN ? 0.22 : 0;
    MOON.maria(ctx, x, y, r, ma);
    // kira-zuri: a soft mica band sweeping across the disc every 7 s
    const kira = (opts.kira == null ? 1 : opts.kira) * MOON.kira(T);
    if (kira > 0.01) {
      const ph = U.fract(T / 7);
      const s = U.lerp(-1.6, 1.6, U.ease.inOutSine(U.clamp(ph / 0.55)));
      if (ph < 0.55) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r, 0, U.TAU);
        ctx.clip();
        ctx.translate(x, y);
        ctx.rotate(U.deg(30));
        const bw = Math.max(12, r * 0.25);
        const g = ctx.createLinearGradient(s * r - bw, 0, s * r + bw, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.5, `rgba(255,253,244,${0.32 * kira})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = g;
        ctx.fillRect(-r * 2, -r * 2, r * 4, r * 4);
        ctx.restore();
      }
    }
    ctx.restore();
  };
})(window.TSUKI = window.TSUKI || {});
