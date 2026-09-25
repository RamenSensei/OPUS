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
    [66, 0.74], [90, 1.02], [118, 1.32], [140, Math.PI / 2], [148, 1.64], [160, 1.96],
    [190, 2.46], [206, 2.8], [214, 3.02], [222.6, Math.PI],
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
      // held, not extrapolated, outside the keypoints
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
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
  /** Shot E (dawn, art-directed): linear, never easing — (5,16) px/s from
   *  (1140,202) at 206 → (1180,330) at 214 (rim meets the smoke) → hidden
   *  behind the summit plateau at 222.6. */
  MOON.E = (T) => {
    const u = Math.max(0, T - 206);
    return { x: 1140 + 5 * u, y: 202 + 16 * u, r: 48, hidden: T >= 222.6 };
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
   * rabbit: the smoke in 四 settles into exactly this path — fourteen brush
   * strokes of a rabbit (left, facing right) pounding with a 杵 into the 臼
   * (right). Each stroke is a 6-point ribbon with per-point widths, in unit
   * disc coordinates (authored on Shot D's moon: centre (960,430), r 260).
   * The strokes are filled as ONE union (flat 薄墨, no darker overlaps).
   * opts (optional): { pestle: radians — the 杵 swung about the paws (四),
   *                    strokes: [indices] to draw only some }
   * MOON.maria.STROKES / .PIVOT / .PESTLE / .ribbon(path, pts, ws) expose the
   * shape so the smoke in 四 can ease into it.
   */
  MOON.maria = (ctx, x, y, r, alpha, color = C.sumi, opts) => {
    if (alpha <= 0 || r <= 0) return;
    const M = MOON.maria;
    const pest = opts && opts.pestle ? opts.pestle : 0;
    const only = opts && opts.strokes;
    const path = new Path2D();
    const k = r;
    M.STROKES.forEach((st, i) => {
      if (only && only.indexOf(i) < 0) return;
      let pts = st.p;
      if (pest && M.PESTLE.indexOf(i) >= 0) pts = M.swing(pts, pest);
      M.ribbon(path, pts.map((q) => [x + q[0] * k, y + q[1] * k]), st.w.map((w) => w * k), st.flat);
    });
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, U.TAU);
    ctx.clip();
    ctx.fillStyle = U.rgba(color, alpha);
    ctx.fill(path);
    ctx.restore();
  };
  (() => {
    const M = MOON.maria;
    const D = (x, y) => [(x - 960) / 260, (y - 430) / 260];   // Shot D px → unit disc
    const W = (w) => w / 260;
    const S = (pts, ws) => ({ p: pts.map((q) => D(q[0], q[1])), w: ws.map(W) });
    M.STROKES = [
      /* 0 far ear   */ S([[912, 402], [898, 374], [884, 348], [869, 324], [855, 305], [844, 292]], [10, 15, 18, 17, 12, 3]),
      /* 1 near ear  */ S([[926, 398], [918, 368], [909, 341], [899, 316], [889, 297], [880, 284]], [11, 17, 21, 20, 14, 4]),
      /* 2 head      */ S([[906, 418], [920, 405], [937, 400], [953, 404], [966, 411], [975, 420]], [22, 32, 37, 34, 26, 15]),
      /* 3 jaw       */ S([[912, 423], [928, 425], [944, 426], [957, 425], [967, 423], [975, 421]], [24, 26, 24, 20, 16, 10]),
      /* 4 back      */ S([[906, 428], [884, 450], [866, 478], [854, 510], [848, 540], [852, 566]], [16, 28, 36, 40, 38, 28]),
      /* 5 chest     */ S([[934, 446], [942, 474], [941, 504], [933, 534], [920, 560], [905, 580]], [18, 28, 34, 36, 30, 20]),
      /* 6 body      */ S([[912, 446], [908, 476], [902, 506], [894, 536], [885, 562], [876, 580]], [30, 44, 52, 54, 48, 30]),
      /* 7 haunch    */ S([[850, 560], [857, 582], [874, 594], [896, 597], [918, 596], [940, 593]], [18, 28, 30, 24, 17, 10]),
      /* 8 tail      */ S([[848, 532], [838, 536], [832, 543], [830, 551], [834, 558], [842, 560]], [8, 14, 16, 16, 12, 5]),
      /* 9 arms      */ S([[930, 462], [941, 468], [951, 472], [959, 474], [965, 473], [971, 470]], [16, 17, 16, 14, 13, 12]),
      /* 10 杵 handle */ S([[968, 470], [986, 463], [1003, 457], [1021, 450], [1038, 443], [1055, 437]], [9, 10, 10, 10, 10, 10]),
      /* 11 杵 head   */ S([[1046, 410], [1049, 421], [1052, 431], [1055, 442], [1058, 453], [1061, 464]], [17, 21, 22, 22, 21, 17]),
      /* 12 臼 rim    */ S([[978, 498], [1003, 491], [1030, 488], [1056, 488], [1082, 491], [1106, 498]], [12, 16, 18, 18, 16, 12]),
      /* 13 臼 body   */ Object.assign(S([[1042, 493], [1042, 513], [1042, 534], [1042, 554], [1042, 574], [1042, 592]], [100, 86, 74, 72, 82, 98]), { flat: true }),
    ];
    M.PESTLE = [10, 11];
    M.PIVOT = D(968, 470);
    /** The pestle strokes swung by angle a (radians, + = down toward the mortar) about the paws. */
    M.swing = (pts, a) => {
      const [px, py] = M.PIVOT, c = Math.cos(a), s = Math.sin(a);
      return pts.map(([qx, qy]) => [px + (qx - px) * c - (qy - py) * s, py + (qx - px) * s + (qy - py) * c]);
    };
    /**
     * Add one brush ribbon to a Path2D: a Catmull-Rom spine through pts with
     * per-point widths ws, round ends, wound clockwise so a nonzero fill of
     * many ribbons is their exact union.
     */
    M.ribbon = (path, pts, ws, flat) => {
      const n = pts.length, sub = 5, sp = [], sw = [];
      const g = (i) => pts[Math.max(0, Math.min(n - 1, i))];
      for (let i = 0; i < n - 1; i++) {
        const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
        for (let j = 0; j < sub; j++) {
          const t = j / sub, t2 = t * t, t3 = t2 * t;
          sp.push([
            0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
            0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
          ]);
          sw.push(ws[i] + (ws[i + 1] - ws[i]) * (t * t * (3 - 2 * t)));
        }
      }
      sp.push(pts[n - 1]);
      sw.push(ws[n - 1]);
      const m = sp.length, L = [], R = [];
      for (let i = 0; i < m; i++) {
        const a = sp[Math.max(0, i - 1)], b = sp[Math.min(m - 1, i + 1)];
        let dx = b[0] - a[0], dy = b[1] - a[1];
        const len = Math.hypot(dx, dy) || 1;
        dx /= len; dy /= len;
        const h = sw[i] / 2;
        L.push([sp[i][0] - dy * h, sp[i][1] + dx * h]);
        R.push([sp[i][0] + dy * h, sp[i][1] - dx * h]);
      }
      let poly = L.concat(R.reverse());
      let area = 0;
      for (let i = 0; i < poly.length; i++) {
        const q = poly[i], w = poly[(i + 1) % poly.length];
        area += q[0] * w[1] - w[0] * q[1];
      }
      if (area < 0) poly = poly.reverse();
      path.moveTo(poly[0][0], poly[0][1]);
      for (let i = 1; i < poly.length; i++) path.lineTo(poly[i][0], poly[i][1]);
      path.closePath();
      for (const e of flat ? [] : [0, m - 1]) {
        const h = sw[e] / 2;
        if (h < 0.3) continue;
        path.moveTo(sp[e][0] + h, sp[e][1]);
        path.arc(sp[e][0], sp[e][1], h, 0, U.TAU, false);
      }
    };
  })();

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
