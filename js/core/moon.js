/* ==========================================================================
   moon.js — the one moon (TSUKI.MOON).
   The moon is a single unbroken celestial arc for the whole film. Its angle
   φ(T) is a monotone cubic through the screenplay's keypoints; each master
   shot projects φ with its own mapping. The disc is never inked: it is the
   bare washi showing through a hole in every plate, glazed a little by the
   hour, dusted with mica that glints as a soft window passes every 7 s —
   and, from T 106 on, carrying the rabbit.
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
    // the moon rests below the horizon until KEYS[0]: ease out of the hold
    // (zero start slope) so there is no velocity step at the 序→一 hand-off
    m[0] = 0; m[n - 1] = d[n - 2];
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
    // toward dawn the glaze greys: colour and alpha both continuous at φ 2.7
    return { color: U.mix(C.geppaku, C.ginnezu, U.smoothstep(2.7, 2.95, p)), alpha: U.lerp(0.2, 0.5, U.smoothstep(2.7, 3.14, p)) };
  };

  /** Kira strength (fades toward dawn). */
  MOON.kira = (T) => 1 - U.smoothstep(2.7, 3.1, MOON.phi(T));

  /* ---------------- the maria (rabbit plate R) ------------------------- */
  /**
   * Paint the rabbit maria on the disc (x, y, r). The shape here is THE
   * rabbit: the smoke in 四 settles into exactly these fourteen brush strokes
   * — a rabbit standing on the left, facing right, holding the 横杵 over a
   * squat 臼 on the right. Each stroke is a 6-point ribbon with per-point
   * widths, in unit-disc coordinates (authored on Shot D's moon: centre
   * (960,430), r 260), with 2–6 px of paper between neighbours.
   * The strokes are printed as ONE flat 薄墨 impression from a carved block:
   * baked once per ink into a sprite (union of the strokes, a 1–2 px ragged
   * edge, one kasure break per stroke, goma-zuri speckle, a paper eye) and
   * blitted — so every moon from T 106 carries the same printed rabbit.
   * opts (optional): { pestle: radians — the 杵 swung about the paws (四),
   *                    strokes: [indices] — draw only some (plain vector fill) }
   * MOON.maria.STROKES / .PIVOT / .PESTLE / .swing / .ribbon expose the shape
   * so the smoke in 四 can ease into it.
   */
  MOON.maria = (ctx, x, y, r, alpha, color = C.sumi, opts) => {
    if (alpha <= 0 || r <= 0) return;
    const M = MOON.maria;
    const pest = opts && opts.pestle ? opts.pestle : 0;
    const only = opts && opts.strokes;
    if (only) {
      // a plain vector fill of some strokes (no texture)
      const path = new Path2D();
      M.STROKES.forEach((st, i) => {
        if (only.indexOf(i) < 0) return;
        let pts = st.p;
        if (pest && M.PESTLE.indexOf(i) >= 0) pts = M.swing(pts, pest);
        M.ribbon(path, pts.map((q) => [x + q[0] * r, y + q[1] * r]), st.w.map((w) => w * r), st.flat);
      });
      ctx.save();
      ctx.fillStyle = U.rgba(color, alpha);
      ctx.fill(path);
      ctx.restore();
      return;
    }
    // device px of the disc radius → sprite level
    const tf = ctx.getTransform ? ctx.getTransform() : null;
    const dev = r * (tf ? Math.hypot(tf.a, tf.b) : 1);
    ctx.save();
    ctx.globalAlpha *= alpha;
    if (Math.abs(pest) < 1e-4) {
      const s = M.sprite(color, 'all', dev);
      ctx.drawImage(s.cv, x - r * s.ext, y - r * s.ext, 2 * r * s.ext, 2 * r * s.ext);
    } else {
      // the body and the swung pestle composited opaque first, then printed once
      const sb = M.sprite(color, 'body', dev), sp = M.sprite(color, 'pestle', dev);
      const n = sb.cv.width;
      if (!M._mix || M._mix.width < n) { M._mix = B.canvas(n, n); }
      const mx = M._mix.getContext('2d');
      mx.setTransform(1, 0, 0, 1, 0, 0);
      mx.globalCompositeOperation = 'source-over';
      mx.clearRect(0, 0, n, n);
      mx.drawImage(sb.cv, 0, 0);
      const k = n / (2 * sb.ext);                       // sprite px per unit
      const [px, py] = M.PIVOT;
      mx.translate(n / 2 + px * k, n / 2 + py * k);
      mx.rotate(pest);
      mx.translate(-(n / 2 + px * k), -(n / 2 + py * k));
      mx.drawImage(sp.cv, 0, 0, n, n);
      ctx.drawImage(M._mix, 0, 0, n, n, x - r * sb.ext, y - r * sb.ext, 2 * r * sb.ext, 2 * r * sb.ext);
    }
    ctx.restore();
  };
  (() => {
    const M = MOON.maria;
    const D = (x, y) => [(x - 960) / 260, (y - 430) / 260];   // Shot D px → unit disc
    const W = (w) => w / 260;
    const S = (pts, ws, flat) => ({ p: pts.map((q) => D(q[0], q[1])), w: ws.map(W), flat: !!flat });
    // the rabbit (left, facing right) · the 横杵 · the 臼 (right); Shot D px
    const ox = -8, oy = 2;                                     // the figure, centred on the face
    const P = (pts) => pts.map(([a, b]) => [a + ox, b + oy]);
    M.STROKES = [
      /* 0 far ear   */ S(P([[906, 340], [899, 327], [891, 315], [883, 305], [876, 298], [870, 293]]), [8, 12, 13, 11, 7, 2]),
      /* 1 near ear  */ S(P([[921, 337], [917, 322], [912, 309], [906, 298], [900, 290], [894, 285]]), [9, 13, 15, 13, 8, 2]),
      /* 2 head      */ S(P([[899, 367], [909, 358], [921, 354], [934, 355], [945, 359], [953, 366]]), [24, 32, 35, 33, 28, 20]),
      /* 3 back      */ S(P([[890, 386], [876, 406], [867, 430], [862, 455], [862, 480], [867, 503]]), [10, 18, 24, 28, 32, 32]),
      /* 4 belly     */ S(P([[909, 392], [914, 413], [916, 436], [915, 459], [910, 481], [901, 501]]), [8, 16, 24, 30, 32, 30]),
      /* 5 餅        */ S(P([[1013, 471], [1023, 467], [1034, 465], [1045, 465], [1055, 467], [1063, 471]]), [4, 8, 10, 10, 8, 4]),
      /* 6 haunch    */ S(P([[866, 512], [879, 524], [895, 531], [911, 534], [926, 534], [938, 531]]), [24, 32, 34, 31, 26, 17]),
      /* 7 foot      */ S(P([[907, 553], [922, 556], [938, 557], [952, 556], [963, 554], [971, 551]]), [10, 12, 12, 11, 9, 7]),
      /* 8 tail      */ S(P([[849, 506], [843, 512], [840, 519], [841, 526], [846, 531], [852, 532]]), [7, 11, 13, 12, 8, 3]),
      /* 9 arms      */ S(P([[921, 429], [932, 434], [942, 439], [951, 443], [959, 447], [966, 451]]), [12, 13, 13, 12, 12, 11]),
      /* 10 杵 handle */ S(P([[952, 459], [969, 453], [986, 447], [1003, 441], [1019, 436], [1033, 432]]), [8, 9, 9, 9, 9, 8]),
      /* 11 杵 head   */ S(P([[1029, 411], [1031, 419], [1033, 427], [1035, 435], [1037, 443], [1039, 451]]), [20, 22, 22, 22, 22, 20], true),
      /* 12 臼 lip    */ S(P([[989, 486], [1008, 484], [1027, 483], [1046, 483], [1065, 484], [1084, 486]]), [15, 19, 20, 20, 19, 15]),
      /* 13 臼 body   */ S(P([[1036, 499], [1036, 509], [1036, 519], [1036, 529], [1036, 539], [1036, 549]]), [78, 72, 68, 70, 78, 86], true),
    ];
    M.PESTLE = [10, 11];
    M.PIVOT = D(966 + ox, 452 + oy);
    M.EYE = D(931 + ox, 358 + oy);
    /** the order the smoke settles in (四): mortar → body → head → ears → pestle */
    M.ORDER = [13, 12, 5, 7, 6, 8, 3, 4, 9, 2, 1, 0, 10, 11];
    /** The pestle strokes swung by angle a (radians, + = down toward the mortar) about the paws. */
    M.swing = (pts, a) => {
      const [px, py] = M.PIVOT, c = Math.cos(a), s = Math.sin(a);
      return pts.map(([qx, qy]) => [px + (qx - px) * c - (qy - py) * s, py + (qx - px) * s + (qy - py) * c]);
    };
    /** Spine & edges of one ribbon (Catmull-Rom through pts, per-point widths ws). */
    const outline = (pts, ws, rough) => {
      const n = pts.length, sub = 6, sp = [], sw = [];
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
      const m = sp.length, L = [], R = [], N = [];
      for (let i = 0; i < m; i++) {
        const a = sp[Math.max(0, i - 1)], b = sp[Math.min(m - 1, i + 1)];
        let dx = b[0] - a[0], dy = b[1] - a[1];
        const len = Math.hypot(dx, dy) || 1;
        dx /= len; dy /= len;
        N.push([-dy, dx]);
        const hl = sw[i] / 2 + (rough ? rough(i, 0) : 0), hr = sw[i] / 2 + (rough ? rough(i, 1) : 0);
        L.push([sp[i][0] - dy * hl, sp[i][1] + dx * hl]);
        R.push([sp[i][0] + dy * hr, sp[i][1] - dx * hr]);
      }
      return { sp, sw, L, R, N };
    };
    /**
     * Add one brush ribbon to a Path2D: a Catmull-Rom spine through pts with
     * per-point widths ws, round ends (flat: square ends), wound clockwise so
     * a nonzero fill of many ribbons is their exact union.
     */
    M.ribbon = (path, pts, ws, flat, rough) => {
      const { sp, sw, L, R } = outline(pts, ws, rough);
      const m = sp.length;
      let poly = L.concat(R.slice().reverse());
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

    /* ---- the carved block: one printed sprite per ink, three cuts ------ */
    // 'all' = the rabbit at rest; 'body' = without the pestle; 'pestle' alone
    const EXT = 0.62;                  // sprite half-size in disc radii (the figure lies within ±0.5)
    const LEVELS = [512, 256, 128, 64]; // device px of the disc radius per mip
    const cache = new Map();
    function carve(color, cut, R) {
      const n = Math.ceil(2 * R * EXT) + 2;
      const cv = B.canvas(n, n), c = cv.getContext('2d');
      const k = R;                                     // sprite px per unit
      const cx = n / 2, cy = n / 2;
      const px = 260 / R;                              // Shot-D px per sprite px
      const idx = M.STROKES.map((_, i) => i).filter((i) => (cut === 'all' ? true : cut === 'pestle' ? M.PESTLE.indexOf(i) >= 0 : M.PESTLE.indexOf(i) < 0));
      // 1. the union of the strokes, with a 1–2 px ragged (noise-displaced) edge
      const path = new Path2D();
      for (const i of idx) {
        const st = M.STROKES[i];
        const rough = (j, side) => (U.fbm2(j * 0.45 + i * 7.3, side * 5.1 + i, 3, 71) - 0.5) * 3.2 / 260;
        M.ribbon(path, st.p.map((q) => [cx + q[0] * k, cy + q[1] * k]), st.w.map((w) => w * k), st.flat,
          (j, side) => rough(j, side) * k);
      }
      c.fillStyle = color;
      c.fill(path);
      // 2. kasure: one dry-brush break per stroke — paper streaks along the tail
      c.globalCompositeOperation = 'destination-out';
      c.lineCap = 'round';
      for (const i of idx) {
        const st = M.STROKES[i];
        if (st.w[2] * 260 < 9) continue;
        const o = outline(st.p.map((q) => [cx + q[0] * k, cy + q[1] * k]), st.w.map((w) => w * k));
        const m = o.sp.length;
        const r = U.rng(3100 + i * 17);
        const lines = st.flat ? 3 : 2;
        for (let l = 0; l < lines; l++) {
          const side = U.lerp(-0.34, 0.34, (l + 0.5) / lines) + U.lerp(-0.08, 0.08, r());
          const a0 = Math.floor(m * U.lerp(0.5, 0.7, r())), a1 = m - 1 - Math.floor(m * U.lerp(0.02, 0.1, r()));
          c.strokeStyle = `rgba(0,0,0,${U.lerp(0.55, 0.85, r())})`;
          c.lineWidth = Math.max(0.6, U.lerp(0.9, 1.7, r()) / px);
          c.beginPath();
          for (let j = a0; j <= a1; j++) {
            const q = o.sp[j], nn = o.N[j], h = o.sw[j] * side;
            const X = q[0] + nn[0] * h, Y = q[1] + nn[1] * h;
            if (j === a0) c.moveTo(X, Y); else c.lineTo(X, Y);
          }
          c.stroke();
        }
      }
      // 3. the paper eye
      if (cut !== 'pestle') {
        c.fillStyle = '#000';
        c.beginPath();
        c.ellipse(cx + M.EYE[0] * k, cy + M.EYE[1] * k, 2.6 / px, 3.0 / px, -0.3, 0, U.TAU);
        c.fill();
      }
      c.globalCompositeOperation = 'source-over';
      // 4. goma-zuri: the pigment lies unevenly (alpha × 0.8–1.0) with paper pores
      const img = c.getImageData(0, 0, n, n), d = img.data;
      for (let yy = 0; yy < n; yy++) for (let xx = 0; xx < n; xx++) {
        const o = (yy * n + xx) * 4 + 3;
        if (!d[o]) continue;
        const X = xx * px, Y = yy * px;              // in Shot-D px, so every mip matches
        let f = U.clamp(0.8 + 0.4 * U.fbm2(X / 34, Y / 34, 3, 57), 0, 1);
        const pore = U.fbm2(X / 2.2, Y / 2.2, 1, 58);
        if (pore > 0.8) f *= 0.55;
        d[o] = Math.round(d[o] * f);
      }
      c.putImageData(img, 0, 0);
      return { cv, ext: n / 2 / k };
    }
    /** The printed sprite for ink `color`, cut 'all'|'body'|'pestle', at device radius dev. */
    M.sprite = (color, cut, dev) => {
      let lv = LEVELS[0];
      for (const L of LEVELS) if (L >= dev * 0.9) lv = L;
      const key = `${color}|${cut}|${lv}`;
      let s = cache.get(key);
      if (!s) {
        // carve the biggest level once; smaller mips are reductions of it (same grain)
        const bigKey = `${color}|${cut}|${LEVELS[0]}`;
        let big = cache.get(bigKey);
        if (!big) { big = carve(color, cut, LEVELS[0]); cache.set(bigKey, big); }
        if (lv === LEVELS[0]) return big;
        let src = big, R = LEVELS[0];
        while (R > lv) {
          const R2 = R / 2, n2 = Math.ceil(src.cv.width / 2);
          const cv = B.canvas(n2, n2), c = cv.getContext('2d');
          c.imageSmoothingQuality = 'high';
          c.drawImage(src.cv, 0, 0, n2, n2);
          src = { cv, ext: src.ext };
          R = R2;
          cache.set(`${color}|${cut}|${R}`, src);
        }
        s = cache.get(key);
      }
      return s;
    };
  })();
  /**
   * Draw the paper moon at (x, y, r) for film time T.
   * opts:
   *   paper    — disc base colour (default 生成: the washi itself)
   *   glaze    — override {color, alpha}: printed flat over the disc, with a
   *              3–4 px 当て無し rim one step deeper at the cut edge
   *   maria    — override rabbit alpha (default 0.22 after T 106, else 0)
   *   halo     — 0..1 月暈 strength: MOON.ring, a carved flat band one step
   *              lighter than the sky with one outer bokashi (not an airbrush)
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
    if (opts.halo) MOON.ring(ctx, x, y, r, opts.halo, opts.haloR, opts.haloColor);
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
    // glaze: ONE flat impression over the disc (a hole to the paper is not a
    // lit sphere), and the 当て無し rim — the glaze pooled a little at the
    // hole's cut edge, a 3–4 px band one step deeper, crisp inside and out
    const gz = opts.glaze || MOON.glaze(T);
    if (gz.alpha > 0) {
      ctx.fillStyle = U.rgba(gz.color, gz.alpha);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, U.TAU);
      ctx.fill();
      const rw = U.clamp(r * 0.035, 1.2, 4);
      if (r > 12) {
        ctx.fillStyle = U.rgba(gz.color, Math.min(0.45, gz.alpha * 0.36 + 0.025));
        ctx.beginPath();
        ctx.arc(x, y, r, 0, U.TAU);
        ctx.arc(x, y, r - rw, 0, U.TAU, true);
        ctx.fill('evenodd');
      }
    }
    // the rabbit
    const ma = opts.maria != null ? opts.maria : T >= MOON.MARIA_BORN ? 0.22 : 0;
    MOON.maria(ctx, x, y, r, ma, C.sumi, opts.pestle ? { pestle: opts.pestle } : undefined);
    // kira-zuri: mica dusted onto the block — fixed flecks that catch the
    // light a little more as a wide, soft window passes every 7 s
    const kira = (opts.kira == null ? 1 : opts.kira) * MOON.kira(T);
    if (kira > 0.01) MOON.mica(ctx, x, y, r, T, kira);
    ctx.restore();
  };

  /* ---------------- 月暈: the carved ring ------------------------------- */
  /**
   * The halo as a printer carves it (not an airbrush): a flat band one step
   * lighter than the sky, crisp at the disc, then ONE bokashi outward.
   *   MOON.ring(ctx, x, y, r, strength 0..1, haloR (outer, default 1.7 r),
   *             color (default 月白), band (fraction of haloR − r that is flat, 0.42))
   * Shots that want a glow round the moon call this instead of rolling their own.
   */
  MOON.ring = (ctx, x, y, r, strength, haloR, color, band) => {
    const s = strength == null ? 0.35 : strength;
    if (s <= 0.001 || r <= 0) return;
    const hr = Math.max(r + 4, haloR || r * 1.7);
    const hc = color || C.geppaku;
    const f = U.clamp(band == null ? 0.42 : band, 0.05, 0.95);
    const A = 0.22 * s;
    const g = ctx.createRadialGradient(x, y, r, x, y, hr);
    // flat band (the block's face), a crisp shoulder, then one wiped bokashi
    g.addColorStop(0, U.rgba(hc, A));
    g.addColorStop(f, U.rgba(hc, A));
    g.addColorStop(f + (1 - f) * 0.08, U.rgba(hc, A * 0.72));
    g.addColorStop(f + (1 - f) * 0.45, U.rgba(hc, A * 0.3));
    g.addColorStop(1, U.rgba(hc, 0));
    ctx.save();
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, hr, 0, U.TAU);
    ctx.arc(x, y, Math.max(0, r - 0.5), 0, U.TAU, true);
    ctx.fill('evenodd');
    ctx.restore();
  };

  /* ---------------- kira-zuri: the mica flecks ------------------------- */
  // ~80 tiny flecks in unit-disc coordinates, the same on every moon (one block)
  const FLECKS = (() => {
    const out = [];
    for (let i = 0; i < 80; i++) {
      const a = U.hash(i * 3 + 811) * U.TAU, d = Math.sqrt(U.hash(i * 3 + 812)) * 0.92;
      out.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, s: U.lerp(0.45, 1.15, Math.pow(U.hash(i * 3 + 813), 1.6)), a: U.lerp(0.14, 0.32, U.hash(i * 7 + 814)) });
    }
    return out;
  })();
  const KIRA_DIR = [Math.cos(U.deg(30)), Math.sin(U.deg(30))];
  /** Paint the mica flecks on the disc (x, y, r); k = strength 0..1. */
  MOON.mica = (ctx, x, y, r, T, k) => {
    const ph = U.fract(T / 7);
    // the window centre along the 30° axis, in disc radii (off the disc when idle)
    const s = ph < 0.55 ? U.lerp(-1.9, 1.9, U.ease.inOutSine(ph / 0.55)) : 9;
    const fr = U.clamp(Math.sqrt(r / 128), 0.6, 1.3);    // fleck size: grains, not snow
    const groups = new Map();
    for (const f of FLECKS) {
      const u = f.x * KIRA_DIR[0] + f.y * KIRA_DIR[1];
      const w = Math.max(0, 1 - Math.pow((u - s) / 0.6, 2));   // soft window, width 1.2 r
      const a = Math.round(Math.min(1, f.a * k * (1 + 0.8 * w * w)) * 25) / 25;
      if (a <= 0) continue;
      let p = groups.get(a);
      if (!p) { p = new Path2D(); groups.set(a, p); }
      const px = x + f.x * r, py = y + f.y * r, rr = f.s * fr;
      p.moveTo(px + rr, py);
      p.arc(px, py, rr, 0, U.TAU);
    }
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [a, p] of groups) {
      ctx.fillStyle = `rgba(255,253,244,${a})`;
      ctx.fill(p);
    }
    ctx.restore();
  };
})(window.TSUKI = window.TSUKI || {});
