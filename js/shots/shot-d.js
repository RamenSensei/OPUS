/* ==========================================================================
   shot-d.js — MASTER SHOT D: looking straight up at the moon (四 月天心).
   An enormous blank paper moon (960,430) r 260 with a 月暈 ring r 420 in a
   ベロ藍 sky under a near-black ichimonji; susuki plumes stand along the
   bottom edge as silhouettes. On the moon's face the Jataka of the rabbit
   plays in sumi (90–103); the fire is the only warm colour ever drawn inside
   the moon; the smoke settles into the maria (TSUKI.MOON.maria) at 106.

   Plates (PRINT shot 'D'):
     sky   P6 one flat ベロ藍 + a flat 紺 foot band from y 930 (14 px wipe)
           · P8 faint kira
     halo  P7 the 月暈: one flat impression a step lighter than the sky (群青
           α .3), crisp at the disc, flat to R + 30, one 12 px wipe (no ring,
           no hairline — SD.haloBand, shared with the tilt)
     top   P6i ichimonji (ベロ藍 + 墨 60%), flat to y 104, 22 px wipe —
           printed over the 月暈

   TSUKI.SHOTS.D
     MOON                     { x, y, r, haloR } — the fixed moon of Shot D
     frame(ctx, T, S, o)      the whole Shot D frame at film time T (the 四
                              scene function; 三 draws it inside the fox
                              window). o.moon === false → no moon/face (the
                              tilt draws the one moon itself); o.dy → shift
                              sky & susuki (tilt); o.susuki === false;
                              o.haloAlpha === 0 → no 月暈 plate;
                              o.halo {x,y,R,a} → a live 月暈 (stage
                              coords) printed between the sky and the
                              ichimonji instead of the carved one
     face(ctx, T, x, y, r)    the Jataka + fire + smoke + maria/pestle on a
                              moon at (x,y,r)
     pestle(T)                the 杵's swing angle at T (radians)
     susuki(ctx, T, dy, a)    the plume silhouettes along the bottom edge
     warm(w, h)               build the flattened sky and susuki strips (init)
     J                        the Jataka's stage & timing table
   TSUKI.SHOTS.flatPrint      (see shot-c.js)
   ========================================================================== */
(function (TSUKI) {
  'use strict';

  const U = TSUKI.U, B = TSUKI.B, C = TSUKI.C;
  const PRINT = TSUKI.PRINT, MOON = TSUKI.MOON, CAST = TSUKI.CAST;
  const TAU = Math.PI * 2;
  const E = U.ease;
  TSUKI.SHOTS = TSUKI.SHOTS || {};
  const SD = (TSUKI.SHOTS.D = TSUKI.SHOTS.D || {});


  /* ------------------------------------------------------------------ */
  /* flattened printing (shared with shot-c.js; whichever loads first)   */
  /* ------------------------------------------------------------------ */
  TSUKI.SHOTS.flatPrint = TSUKI.SHOTS.flatPrint || (() => {
    const cache = new Map();
    const sig = (st) => {
      let s = `${st.wear}|${st.ichimonji}|${st.keyReveal ? 1 : 0}`;
      for (const id of PRINT.IDS) s += `|${st.alpha[id]},${st.off[id][0]},${st.off[id][1]}`;
      return s;
    };
    const flat = (ctx, id, layers, T, opts = {}) => {
      const st = opts.state || PRINT.state(T);
      const cw = opts.w || ctx.canvas.width, ch = opts.h || ctx.canvas.height;
      const key = `${id}|${layers.join(',')}|${opts.tag || ''}`;
      const sg = sig(st);
      let e = cache.get(key);
      if (!e || e.w !== cw || e.h !== ch || e.sig !== sg) {
        if (e && e.w === cw && e.h === ch && !opts.build) {
          for (const l of layers) PRINT.drawLayer(ctx, id, l, T, { state: st, alpha: opts.alpha });
          return;
        }
        const cv = e && e.w === cw && e.h === ch ? e.cv : B.canvas(cw, ch);
        const c2 = cv.getContext('2d');
        c2.setTransform(1, 0, 0, 1, 0, 0);
        c2.clearRect(0, 0, cw, ch);
        c2.setTransform(cw / 1920, 0, 0, cw / 1920, 0, 0);
        c2.imageSmoothingQuality = 'high';
        for (const l of layers) PRINT.drawLayer(c2, id, l, T, { state: st, alpha: opts.alpha });
        e = { cv, w: cw, h: ch, sig: sg };
        cache.set(key, e);
      }
      if (opts.build) return;
      ctx.drawImage(e.cv, 0, 0, 1920, 1080);
    };
    return flat;
  })();

  const M = (SD.MOON = { x: 960, y: 430, r: 260, haloR: 420 });
  /**
   * The 月暈 as a printer carves it: ONE flat impression one step lighter than
   * the sky (群青 over ベロ藍 — a lighter blue, never a grey veil), cut crisp
   * at the disc, flat out to R + 30 and there cut with one short wipe (12 px)
   * — a hard outer step, never a long radial fade (that reads as airbrush) —
   * no hairline, no ring of darker sky inside it (both read as a lens or a
   * bullseye). It lies UNDER the ichimonji (the 'top' layer), which is printed
   * over it. Shared with the tilt (05), which prints it live at any R (the
   * disc scales with it: r = M.r · R / M.haloR).
   */
  const HALO = { col: C.gunjo, a: 0.3, flatTo: 30, wipe: 12 };
  SD.haloBand = (c, x, y, R, a = 1) => {
    if (a <= 0.004 || R <= 4) return;
    const s = R / M.haloR;
    // flat from the disc's cut edge out to R + 30, then ONE short wipe (12 px):
    // a hard-edged block, not an airbrushed glow
    const r0 = M.r * s, rf = R + HALO.flatTo * s, r1 = rf + Math.max(1.5, HALO.wipe * s), span = r1 - r0;
    const f = (rf - r0) / span, A = HALO.a;
    c.save();
    c.globalAlpha *= a;
    const g = c.createRadialGradient(x, y, r0, x, y, r1);
    g.addColorStop(0, U.rgba(HALO.col, A));
    g.addColorStop(f, U.rgba(HALO.col, A));                                  // the flat of the block
    g.addColorStop(f + (1 - f) * 0.5, U.rgba(HALO.col, A * 0.4));            // its wiped edge
    g.addColorStop(1, U.rgba(HALO.col, 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, r1, 0, TAU);
    c.arc(x, y, Math.max(0, r0 - 1), 0, TAU, true);                          // under the disc's cut edge
    c.fill('evenodd');
    c.restore();
  };
  const NIGHT_TOP = U.mix(C.bero, C.sumi, 0.6);

  /* ------------------------------------------------------------------ */
  /* carving                                                             */
  /* ------------------------------------------------------------------ */

  /** 板目: the faint wood grain a large flat block leaves in its ink (build time only). */
  function woodGrain(c, x, y, w, h, dark, light, alpha, seed) {
    const r = U.rng(seed);
    const knots = [];
    for (let i = 0; i < Math.max(2, Math.round(w * h / 400000)); i++) knots.push([x + r() * w, y + r() * h, U.lerp(30, 90, r())]);
    c.save();
    c.lineCap = 'round';
    let y0 = y - 20;
    let i = 0;
    while (y0 < y + h + 20) {
      y0 += U.lerp(3, 26, Math.pow(r(), 1.6));
      i++;
      const col = r() < 0.65 ? dark : light;
      c.strokeStyle = U.rgba(col, alpha * U.lerp(0.3, 1, r()));
      c.lineWidth = U.lerp(0.7, 2.4, r());
      const x0 = x + (r() < 0.5 ? -20 : r() * w * 0.6), x1 = x0 + w * U.lerp(0.25, 1.1, r());
      const f = U.lerp(0.0015, 0.004, r()), amp = U.lerp(2, 10, r()), ph = r() * 9;
      c.beginPath();
      for (let px = x0; px <= x1; px += 12) {
        let py = y0 + amp * Math.sin(px * f + ph) + 4 * U.wobble(px * 0.006 + i * 0.3, seed);
        for (const [kx, ky, kr] of knots) {
          const dx = (px - kx) / (kr * 2.6), dyk = (y0 - ky) / (kr * 1.6);
          const g = Math.exp(-dx * dx - dyk * dyk);
          py += Math.sign(y0 - ky || 1) * kr * 0.9 * g;
        }
        if (px === x0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.stroke();
    }
    c.restore();
  }

  /**
   * A flat band of `col` between y0 and y1 whose ONE open edge (`at` 'top' or
   * 'bottom') is wiped over `wipe` px — the ichimonji way: the block is a
   * plain rectangle, the gradation lives only in the last few px of its edge.
   */
  function hardBand(c, y0, y1, col, a, wipe, at) {
    const g = c.createLinearGradient(0, y0, 0, y1);
    const h = y1 - y0, w = Math.min(0.5, wipe / h);
    if (at === 'bottom') {
      g.addColorStop(0, U.rgba(col, a));
      g.addColorStop(1 - w, U.rgba(col, a));
      g.addColorStop(1 - w * 0.45, U.rgba(col, a * 0.42));
      g.addColorStop(1, U.rgba(col, 0));
    } else {
      g.addColorStop(0, U.rgba(col, 0));
      g.addColorStop(w * 0.55, U.rgba(col, a * 0.42));
      g.addColorStop(w, U.rgba(col, a));
      g.addColorStop(1, U.rgba(col, a));
    }
    c.fillStyle = g;
    c.fillRect(-20, y0, 1960, h);
  }
  /** Where the sky's two bands lie (logical px). */
  const SKY = { top: 104, topWipe: 22, foot: 930, footWipe: 14 };

  PRINT.defineShot('D', {
    layers: ['sky', 'halo', 'top'],
    worn: false,
    build(P) {
      // P6: the night — ONE flat impression of ベロ藍 (no airbrushed bands),
      // and at its foot a flat 紺 band with a hard, briefly wiped upper edge
      const s = P('sky', 'P6');
      s.fillStyle = U.mix(C.bero, C.kon, 0.1);
      s.fillRect(0, 0, 1920, 1080);
      hardBand(s, SKY.foot, 1080, U.mix(C.kon, C.tetsukon, 0.3), 0.9, SKY.footWipe, 'top');
      woodGrain(s, 0, 0, 1920, 1080, C.kon, U.mix(C.bero, C.hanada, 0.4), 0.06, 777);
      // P6i: the ichimonji — a near-black flat band whose lower edge is wiped
      // over 22 px; printed on its own 'top' layer, over the 月暈
      const i = P('top', 'P6i');
      hardBand(i, 0, SKY.top + SKY.topWipe, NIGHT_TOP, 1, SKY.topWipe, 'bottom');
      // P8: faint mica points (no stars in ukiyo-e night — only kira)
      const k = P('sky', 'P8');
      const r = U.rng(9091);
      for (let n = 0; n < 90; n++) {
        const x = r() * 1920, y = r() * 900;
        if (Math.hypot(x - M.x, y - M.y) < M.r + 40) continue;
        k.fillStyle = `rgba(255,250,236,${U.lerp(0.04, 0.15, r())})`;
        k.beginPath();
        k.arc(x, y, U.lerp(0.8, 2, r()), 0, TAU);
        k.fill();
      }
      // P7: the 月暈 — a band of 胡粉 bokashi, no line (a drawn ring reads as a lens)
      SD.haloBand(P('halo', 'P7'), M.x, M.y, M.haloR, 1);
    },
  });

  /* ------------------------------------------------------------------ */
  /* susuki silhouettes along the bottom edge (sprites, swayed live)     */
  /* ------------------------------------------------------------------ */
  /*
   * Looking straight up from inside the field: stems rise from below the
   * frame and lean in toward the zenith; heavy plumes nod over them. The
   * middle of the bottom edge (x 620–1300) stays low — it is the subtitle's.
   * root x, head (x, y), plume length, droop side, seed.
   */
  const CLUMPS = [
    { x: 60, stems: [[-40, 60, 895, 140, 1], [30, 170, 930, 115, 1], [90, 5, 950, 105, -1], [-10, 250, 985, 90, 1]], seed: 3 },
    { x: 400, stems: [[0, 60, 972, 92, 1], [40, -30, 995, 78, -1]], seed: 7, blades: 0.75 },
    { x: 1560, stems: [[0, -40, 965, 100, -1], [60, -120, 935, 115, -1], [-50, 30, 990, 78, 1]], seed: 13, blades: 0.8 },
    { x: 1860, stems: [[40, -150, 880, 150, -1], [-20, -250, 915, 140, -1], [80, -60, 945, 115, -1], [0, -330, 965, 105, -1]], seed: 17 },
  ];
  let sprites = null;                                  // carved at the device resolution (1:1 blits)
  /** One clump painted in ink `col`, local origin at the root (0,0) = (x, 1080). */
  function paintClump(c, cl, col) {
    const r = U.rng(cl.seed * 31);
    const bk = cl.blades || 1;
    // blades: long tapering leaves rising from the bottom
    for (let i = 0; i < 5 + cl.stems.length * 2; i++) {
      const bx = U.lerp(-60, 60, r()), h = U.lerp(90, 200, r()) * bk;
      const lean = U.lerp(-0.5, 0.5, r()) + (cl.x < 960 ? 0.25 : -0.25);
      const ex = bx + Math.sin(lean) * h, ey = -Math.cos(lean) * h * 0.9;
      const bend = (r() < 0.5 ? -1 : 1) * U.lerp(20, 60, r());
      B.taper(c, B.qpts(bx, 40, bx + (ex - bx) * 0.4 + bend * 0.3, ey * 0.55, ex + bend, ey + Math.abs(bend) * 0.4, 14), U.lerp(5, 9, r()), 0.4, col, 0.15);
    }
    for (const [rx, hx, hy, len, side] of cl.stems) {
      const top = [hx, hy - 1080];
      const stem = B.qpts(rx, 60, (rx + top[0]) / 2 + side * -10, (60 + top[1]) / 2, top[0], top[1], 18);
      B.taper(c, stem, 4, 2.2, col, 0);
      // the plume: a nodding fan of fine hairs from the top third of the stem
      const hairs = 30;
      for (let k = 0; k < hairs; k++) {
        const s = U.lerp(0.62, 1, k / (hairs - 1));
        const p = stem[Math.round(s * (stem.length - 1))];
        const u = (s - 0.62) / 0.38;
        const hl = len * U.lerp(0.55, 0.3, u) * U.lerp(0.8, 1.15, r());
        const a0 = Math.atan2(top[1] - stem[stem.length - 4][1], top[0] - stem[stem.length - 4][0]);
        const ha = a0 + side * U.lerp(1.35, 0.25, u) + U.lerp(-0.18, 0.18, r());
        const ex = p[0] + Math.cos(ha) * hl, ey = p[1] + Math.sin(ha) * hl;
        const mx = p[0] + Math.cos(ha - side * 0.35) * hl * 0.55, my = p[1] + Math.sin(ha - side * 0.35) * hl * 0.55;
        B.taper(c, B.qpts(p[0], p[1], mx, my, ex, ey, 8), U.lerp(2.6, 4.2, r()), 0.4, col, 0.4);
      }
    }
  }
  /*
   * The clumps are carved once into two strips (left and right). Each strip
   * sways as a whole — grass bends from the root — printed as horizontal
   * bands shifted by whole device pixels (a shear without resampling).
   */
  const STRIPS = [{ x0: -420, x1: 900, phase: 0.3, clumps: (c) => c.x < 960 }, { x0: 1180, x1: 2340, phase: 2.1, clumps: (c) => c.x >= 960 }];
  const STRIP_TOP = 250;                               // logical px above the root line (plumes reach y ≈ 835)
  const BANDS = 12;
  function buildSusuki(q) {
    if (sprites && Math.abs(sprites.q - q) / q < 0.01) return sprites;
    const list = STRIPS.map((sp) => {
      const w = sp.x1 - sp.x0, h = STRIP_TOP + 40;
      const cv = B.canvas(w * q, h * q);
      const x = cv.getContext('2d');
      x.scale(q, q);
      for (const cl of CLUMPS.filter(sp.clumps)) {
        x.save();
        x.translate(cl.x - sp.x0, STRIP_TOP);
        // rim light: 尾花 printed first, the sumi silhouette 1.6 px lower over it
        x.save();
        x.translate(0.8, -1.6);
        x.globalAlpha = 0.75;
        paintClump(x, cl, U.mix(C.susuki, C.kuchiba, 0.25));
        x.restore();
        paintClump(x, cl, C.sumi);
        x.restore();
      }
      return { cv, w, h, sp };
    });
    sprites = { q, list };
    return sprites;
  }
  SD.susuki = (ctx, T, dy = 0, alpha = 1) => {
    if (alpha <= 0.003) return;
    const tf = ctx.getTransform();
    const k = tf.a;                                     // device px per logical px (no rotation here)
    const spr = buildSusuki(k);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha *= alpha;
    for (const s of spr.list) {
      const sh = 0.022 * Math.sin(T * 0.62 + s.sp.phase) + 0.014 * U.wobble(T * 0.27 + s.sp.phase, 5);
      const top = Math.round((1080 + dy - STRIP_TOP) * k + tf.f);   // device y of the strip's top
      const dx0 = Math.round(s.sp.x0 * k + tf.e);
      const H = s.cv.height, W = s.cv.width;
      for (let j = 0; j < BANDS; j++) {
        const r0 = Math.round((j * H) / BANDS), r1 = Math.round(((j + 1) * H) / BANDS);
        if (top + r1 <= 0 || top + r0 >= ctx.canvas.height) continue;
        const above = STRIP_TOP - ((r0 + r1) / 2) / k;
        const off = Math.round(-sh * above * k);
        ctx.drawImage(s.cv, 0, r0, W, r1 - r0, dx0 + off, top + r0, W, r1 - r0);
      }
    }
    ctx.restore();
  };
  /** Build the flattened sky and the susuki strips now (from a scene's init, stage size). */
  SD.warm = (w, h) => {
    buildSusuki(w / 1920);
    TSUKI.SHOTS.flatPrint(null, 'D', ['sky', 'halo', 'top'], 100, { w, h, build: true });
    TSUKI.SHOTS.flatPrint(null, 'D', ['sky'], 100, { w, h, build: true });
    // the printed rabbit, carved now (not mid-film)
    for (const cut of ['all', 'body', 'pestle']) for (const d of [512, 256, 128, 64]) MOON.maria.sprite(C.sumi, cut, d);
  };

  /* ------------------------------------------------------------------ */
  /* the Jataka on the moon's face                                       */
  /* ------------------------------------------------------------------ */
  /*
   * The stage on the face: a ring round the fire seen from a little above,
   * as a 絵巻 shows a gathering — the beggar and the rabbit on the near side,
   * the monkey and the fox across the fire (higher, a little smaller, in a
   * paler ink: further away). Each actor is authored at its own origin (its
   * ground contact) and printed at (x, y) × g, so the whole play is about
   * 1.4× the old single-file frieze and still sits in the lower part of the
   * face, every figure ≥ 30 px inside the rim. `dx0` = where it enters from
   * (authored px from its place).
   */
  const J = {
    beggar: { x: 834, y: 604, g: 1.36, s: 0.62 },
    monkeyIn: [92.0, 93.4], monkey: { x: 778, y: 506, g: 1.16, dx0: -100, s: 1.12 },
    foxIn: [93.4, 94.8], fox: { x: 1134, y: 484, g: 1.14, dx0: 136, s: 1.15 },
    rabbitIn: [94.8, 95.8], rabbit: { x: 1079, y: 604, g: 1.4, dx0: 150, s: 1.15 },
    droop: 95.8, gaze: 97.0, leap: 98.0, into: 98.9, flash: 99.0, rise: 99.4, fade: [100, 103],
    fire: { x: 980, y: 600, g: 1.2 },
  };
  SD.J = J;
  const INK = C.sumi;
  const INK_NEAR = U.mix(C.sumi, C.kinari, 0.13);      // ≈ 墨 α .86 on the moon's paper, but flat
  const INK_FAR = U.mix(C.sumi, C.kinari, 0.36);       // 薄墨: across the fire
  const STAFF_X = -8;                                  // the beggar's staff, planted at his heels
  /** Draw fn in actor a's own frame: origin at its ground contact, scaled by a.g. */
  const at = (ctx, a, fn, dx = 0) => {
    ctx.save();
    ctx.translate(a.x + dx * a.g, a.y);
    ctx.scale(a.g, a.g);
    const r = fn(ctx);
    ctx.restore();
    return r;
  };

  /** Catmull-Rom closed path (CAST's spline: tension 1, [x,y,1] = corner), positively wound. */
  function spPath(p, pts) {
    let area = 0;
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a[0] * b[1] - b[0] * a[1]; }
    if (area < 0) pts = pts.slice().reverse();
    const n = pts.length, k = 1 / 6;
    const get = (i) => pts[(i + n) % n];
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      p.bezierCurveTo(p1[2] ? p1[0] : p1[0] + (p2[0] - p0[0]) * k, p1[2] ? p1[1] : p1[1] + (p2[1] - p0[1]) * k,
        p2[2] ? p2[0] : p2[0] - (p3[0] - p1[0]) * k, p2[2] ? p2[1] : p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
    }
    p.closePath();
  }
  const ell = (p, cx, cy, rx, ry, a) => { p.moveTo(cx + rx * Math.cos(a), cy + rx * Math.sin(a)); p.ellipse(cx, cy, rx, ry, a, 0, TAU); };

  /* ---- carved lines --------------------------------------------------- */
  /*
   * Every actor on the face is one flat ink from the key block, and the
   * carver has cut two or three interior lines into it — ear, haunch, the
   * fold of a sleeve — that print as grooves of a slightly lighter value.
   * Each is a gouge: a quadratic stroke swelling in the middle and tapering
   * to nothing at both ends, authored in the actor's own frame (its ground
   * contact, × a.g) for the pose it holds, always well inside its silhouette.
   * [x0, y0, cx, cy, x1, y1, width]
   */
  const LINE_NEAR = U.mix(INK_NEAR, C.kinari, 0.46);
  const LINE_FAR = U.mix(INK_FAR, C.kinari, 0.4);
  const CUTS = {
    // the monkey, sitting up facing the fire: the folded thigh, the arm against its side, the ear
    monkey: [[-12, -4, -3, -27, 11, -21, 1.3], [3, -47, 1, -36, 12, -33, 1.1], [1.5, -66, 0.5, -62, 3, -59, 0.9]],
    // the fox (facing left): the haunch, the near foreleg, the ear's groove
    fox: [[-4, -3, 4, -40, 24, -16, 1.4], [-9, -46, -7, -26, -9, -7, 1.1], [-9, -82, -8, -87, -5, -90, 0.9]],
    // the beggar (facing the fire): his sleeve against the body, the fold across the hip, the collar
    beggar: [[18, -57, 27, -45, 38, -40, 1.2], [-8, -26, 4, -14, 22, -11, 1.3], [26, -61, 30, -57, 32, -52, 0.9]],
  };
  /** Cut an actor's lines (a gouge per entry) into ctx, in its current frame. */
  function cutLines(c, list, ink, alpha, mirror = 1) {
    if (alpha <= 0.004) return;
    c.save();
    c.globalAlpha *= alpha;
    for (const [x0, y0, cx, cy, x1, y1, w] of list) {
      B.taper(c, B.qpts(x0 * mirror, y0, cx * mirror, cy, x1 * mirror, y1, 10), 0.15, 0.15, ink, w);
    }
    c.restore();
  }

  /**
   * The empty-handed rabbit sitting (CAST.rabbit 'sit' geometry), with the
   * droop made legible for a silhouette: the head bows and the ears fall
   * back and DOWN behind it, hanging below the line of the head. `lift`
   * raises the head and ears again (the moment before it turns to us).
   * Returns the silhouette and its carved lines (haunch, foreleg, ear, eye)
   * in local px (drawn × s·0.55, mirrored by facing).
   */
  function rabbitSitPaths(droop, T) {
    const p = new Path2D();
    const br = Math.sin(T * 2.1) * 0.6 * (1 - droop);
    spPath(p, [[12, -60], [0, -62 - br], [-16, -56], [-28, -44], [-35, -28], [-35, -12], [-28, -2], [-16, 1, 1], [18, 1, 1], [25, -10], [27, -26], [26, -42], [20, -54]]);
    ell(p, -33, -12, 6.5, 5.85, 0);
    ell(p, 19, -2, 7, 3.6, 0); ell(p, 27, -1.5, 7, 3.6, 0);
    // head: bows forward and down
    const hx = 26 - droop * 2, hy = -70 - br + droop * 8, ha = 0.05 + droop * 0.3;
    const back = 0.12 + droop * 1.38;
    const eA = -0.28 - back * 1.05, eB = -0.08 - back * 1.0;
    const head = new Path2D();
    ell(head, -2 + Math.sin(eB) * 20, -14 - Math.cos(eB) * 20, 6.2, 21, eB);
    spPath(head, [[-14, 2], [-12, -10], [-3, -16], [8, -14], [15, -6], [18, 3], [17.5, 6.5, 1], [12, 10.5], [1, 12], [-9, 9]]);
    ell(head, -6 + Math.sin(eA) * 21, -12 - Math.cos(eA) * 21, 7.2, 22.5, eA);
    const cH = Math.cos(ha), sH = Math.sin(ha);
    const hp = (x, y) => [hx + x * cH - y * sH, hy + x * sH + y * cH];
    p.addPath(head, new DOMMatrix().translate(hx, hy).rotate((ha * 180) / Math.PI));
    // cuts: the haunch (a dome over the folded hind leg), the foreleg, the near ear's groove
    const ux = Math.sin(eA), uy = -Math.cos(eA);
    const e0 = hp(-6 + ux * 11, -12 + uy * 11), e1 = hp(-6 + ux * 33, -12 + uy * 33), em = hp(-6 + ux * 22 + uy * 1.2, -12 + uy * 22 - ux * 1.2);
    const cuts = [[-4, -3, -14, -40, -31, -16, 2.3], [11, -31, 16, -16, 12, -4, 1.8], [e0[0], e0[1], em[0], em[1], e1[0], e1[1], 2]];
    return { p, cuts, eye: hp(6, -3) };
  }
  function rabbitSit(ctx, x, y, s, droop, facing, alpha, T) {
    const { p, cuts, eye } = rabbitSitPaths(droop, T);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * 0.55 * facing, s * 0.55);
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = INK_NEAR;
    ctx.fill(p);
    ctx.clip(p);
    cutLines(ctx, cuts, LINE_NEAR, 1);
    ctx.fillStyle = LINE_NEAR;
    ctx.beginPath();
    ctx.ellipse(eye[0], eye[1], 1.9, 2.2, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  /**
   * A frontal rabbit, sitting up and looking out of the moon at us.
   * fold 0..1: the ears laid back (they shorten and splay as they tip away).
   */
  function rabbitFront(ctx, x, y, s, alpha, T, fold = 0) {
    const p = new Path2D(), cuts = [];
    const breathe = Math.sin(T * 2.3) * 0.6;
    ell(p, 0, -22, 20, 23, 0);                             // body
    ell(p, -12, -4, 9, 5, 0.2); ell(p, 12, -4, 9, 5, -0.2);   // hind feet
    ell(p, 0, -52 - breathe, 15, 14, 0);                  // head
    // ears: rooted at y ≈ −63, laid back they foreshorten and splay
    const eL = 17 * (1 - 0.42 * fold), sp = 0.34 * fold;
    for (const [sx, a0] of [[-7, -0.14], [7, 0.12]]) {
      const a = a0 + Math.sign(sx) * sp;
      const ux = Math.sin(a), uy = -Math.cos(a), ry = -63 - breathe;
      ell(p, sx + ux * eL, ry + uy * eL, 5 * (1 + 0.12 * fold), eL, a);
      // the ear's groove
      cuts.push([sx + ux * eL * 0.45, ry + uy * eL * 0.45, sx + ux * eL, ry + uy * eL, sx + ux * eL * 1.6, ry + uy * eL * 1.6, 1.5]);
    }
    ell(p, -6, -34, 4, 7, 0.3); ell(p, 6, -34, 4, 7, -0.3); // fore paws held to the chest
    // the haunches, cut either side of the belly
    cuts.push([-8, -4, -18, -9, -16, -23, 1.6], [8, -4, 18, -9, 16, -23, 1.6]);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = INK_NEAR;
    ctx.fill(p);
    ctx.save();
    ctx.clip(p);
    cutLines(ctx, cuts, LINE_NEAR, 1);
    ctx.restore();
    // the eyes: two points of the moon's own paper
    ctx.fillStyle = C.kinari;
    for (const sx of [-5.5, 5.5]) {
      ctx.beginPath();
      ctx.ellipse(sx, -54 - breathe, 1.9, 2.3, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---- the fire: five hooked 火焔 tongues (北斎) ------------------------ */
  /*
   * Printed as Hokusai cuts a fire: a few big tongues, each an S that rises
   * and hooks back on itself at the tip (蕨手), each with its own tapering
   * 墨 contour from the key block — thick where it leaves the logs, a hair at
   * the hook — over flat 朱, a smaller hooked 山吹 core printed a little off
   * register; the logs lie in front of their roots; 朱 embers as dots.
   * Back → front: [base dx, height, lean, curl side, width, core?]
   */
  const TONGUES = [
    [-19, 50, -0.24, -1, 25, false], [19, 58, 0.22, 1, 25, false],
    [2, 90, 0.07, 1, 36, true],
    [-10, 42, -0.1, -1, 23, true], [12, 34, 0.15, 1, 19, false],
  ];
  const FIRE_INK = U.rgba(INK, 0.92);
  function fireLevel(T) {
    const flare = U.env(T, J.into - 0.05, J.into + 0.08, J.flash + 0.1, J.rise + 0.2) * 0.4;
    // the flames go out inside the stop (99.0–100.2), with the fire's sound;
    // only the embers (to 106.6) and the smoke (from 100.0) outlive them
    const die = 1 - U.smoothstep(J.flash, J.flash + 1.2, T);
    return Math.max(0, die + flare * die);
  }
  /**
   * One tongue: its centreline (a slow travelling S that hooks back through
   * ~230° over the last third) and the two edges, base → tip.
   */
  function tongueGeom(bx, by, h, w0, lean, curl, ph) {
    const N = 24, cl = [], ws = [];
    let x = bx, y = by, th = -Math.PI / 2 + lean;
    const ds = h / 19.5;                                            // steps shorten into the curl
    for (let j = 0; j <= N; j++) {
      const s = j / N;
      cl.push([x, y]);
      // a little fuller a third of the way up, then narrowing into the hook
      ws.push(Math.max(0.5, w0 * (0.78 + 0.22 * Math.sin(Math.PI * Math.min(1, s * 1.5))) * Math.pow(1 - s, 0.9)));
      let turn = 0.032 * Math.sin(s * 5.2 + ph) * (1 - s);          // the S of the body (a gentle sway)
      const u = s > 0.62 ? (s - 0.62) / 0.38 : 0;
      turn += curl * 0.74 * Math.pow(u, 0.8);                        // the hook (蕨手): a tightening curl
      th += turn;
      const st = ds * (1 - 0.55 * u);
      x += Math.cos(th) * st;
      y += Math.sin(th) * st;
    }
    const L = [], R = [];
    for (let j = 0; j <= N; j++) {
      const a = cl[Math.max(0, j - 1)], b = cl[Math.min(N, j + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len, hw = ws[j] / 2;
      L.push([cl[j][0] + nx * hw, cl[j][1] + ny * hw]);
      R.push([cl[j][0] - nx * hw, cl[j][1] - ny * hw]);
    }
    const path = new Path2D();
    path.moveTo(L[0][0], L[0][1]);
    for (let q = 1; q <= N; q++) path.lineTo(L[q][0], L[q][1]);
    for (let q = N; q >= 0; q--) path.lineTo(R[q][0], R[q][1]);
    path.closePath();
    return { path, L, R };
  }
  function fireTongues(T, lv) {
    const out = [];
    TONGUES.forEach(([dx, h0, lean, curl, w, core], i) => {
      // they breathe, slowly: a gentle rise and fall and a lean that sways
      const h = h0 * lv * (1 + 0.06 * Math.sin(T * 4.3 + i * 2.1) + 0.035 * Math.sin(T * 7.9 + i * 1.3));
      if (h < 4) return;
      const ln = lean + 0.035 * Math.sin(T * 2.2 + i * 1.3);
      const bx = dx * (0.6 + 0.4 * lv), ww = Math.max(9, w * (0.55 + 0.45 * lv));
      const ph = T * 2.4 + i * 1.7;
      const t = tongueGeom(bx, -2, h, ww, ln, curl, ph);
      if (core) t.core = tongueGeom(bx + 1.4, -1.2, h * 0.56, ww * 0.44, ln * 0.85, curl, ph + 0.6).path;
      out.push(t);
    });
    return out;
  }
  /** The fire, printed in its own frame (origin = the middle of its base, × J.fire.g). */
  function drawFire(ctx, T) {
    at(ctx, J.fire, (c) => fireAt(c, T));
  }
  function fireAt(ctx, T) {
    const lv = fireLevel(T);
    const f = { x: 0, y: 0 };
    // embers (朱 dots): the last of them fades at 106
    const emb = U.env(T, 89, 90, 103.5, 106.6);
    if (emb > 0) {
      PRINT.with(ctx, 'P2', T, (c) => {
        const r = U.rng(4242);
        for (let i = 0; i < 9; i++) {
          const ex = f.x + U.lerp(-30, 30, r()), ey = f.y + U.lerp(-6, 3, r());
          const last = i === 4;
          const tw = 0.62 + 0.38 * Math.sin(T * U.lerp(1.6, 3.4, r()) + i);
          const a = emb * tw * (last ? 1 : 1 - U.smoothstep(103.5, 105.2, T));
          const rr = last ? 3.2 : U.lerp(1.5, 2.8, r());
          if (a <= 0.01) continue;
          c.fillStyle = U.rgba(last ? C.yamabuki : C.shu, a);
          c.beginPath();
          c.arc(last ? f.x + 2 : ex, last ? f.y - 3 : ey, rr, 0, TAU);
          c.fill();
        }
      });
    }
    if (lv > 0.01) {
      // back → front, each tongue whole: 朱, its 山吹 core off register, its contour
      for (const t of fireTongues(T, lv)) {
        PRINT.with(ctx, 'P2', T, (c) => {
          c.fillStyle = C.shu;
          c.fill(t.path);
          if (t.core) {
            c.fillStyle = C.yamabuki;
            c.fill(t.core);
          }
        });
        PRINT.with(ctx, 'K', T, (c) => {
          B.taper(c, t.L, 1.55, 0.3, FIRE_INK, 0);
          B.taper(c, t.R, 1.55, 0.3, FIRE_INK, 0);
        });
      }
      // sparks: a few 朱 and 山吹 points drifting up off the hooks
      PRINT.with(ctx, 'P2', T, (c) => {
        for (let i = 0; i < 6; i++) {
          const ph = U.fract(T * 0.42 + i * 0.173);
          const sx = f.x + U.lerp(-22, 22, U.hash(i + 7)) + Math.sin(ph * 5 + i) * 7;
          const sy = f.y - 52 - ph * 80 * (0.5 + 0.5 * lv);
          c.fillStyle = U.rgba(i % 2 ? C.shu : C.yamabuki, (1 - ph) * 0.9 * lv);
          c.beginPath();
          c.arc(sx, sy, 1.5, 0, TAU);
          c.fill();
        }
      });
    }
    // the logs (薪) in front of the roots of the flames: three crossed sticks on a bed of ash
    const logA = U.clamp(1 - U.smoothstep(101.8, 104.6, T));
    if (logA > 0) {
      PRINT.with(ctx, 'K', T, (c) => {
        c.save();
        c.globalAlpha *= 0.9 * logA;
        B.taper(c, [[f.x - 32, f.y + 5], [f.x, f.y + 3.5], [f.x + 32, f.y + 5]], 2.2, 0.8, U.rgba(INK, 0.35), 0.4);
        B.taper(c, [[f.x - 36, f.y + 2], [f.x + 34, f.y - 6]], 6, 5, INK, 0);
        B.taper(c, [[f.x - 32, f.y - 6], [f.x + 36, f.y + 1]], 6, 5, INK, 0);
        B.taper(c, [[f.x - 18, f.y + 3], [f.x + 20, f.y + 4]], 5, 5, INK, 0);
        c.restore();
      });
    }
  }

  /* ---- the god in mica (帝釈天) ------------------------------------------ */
  const god = { a: null, b: null };
  function godBuffers(w, h) {
    for (const k of ['a', 'b']) if (!god[k] || god[k].width < w || god[k].height < h) god[k] = B.canvas(Math.max(w, god[k] ? god[k].width : 0), Math.max(h, god[k] ? god[k].height : 0));
  }
  /**
   * The beggar risen, as a figure of mica: his silhouette printed 'lighter'
   * in 胡粉 with a travelling 30° glint, edged by a thin 銀鼠 rim. No face.
   */
  function drawGod(ctx, T, rise, a) {
    if (a <= 0.004) return null;
    const tf = ctx.getTransform();
    const k = tf.a;
    const bx0 = -75, by0 = -222, bw = 165, bh = 232;     // the beggar's own frame (origin = where he sits)
    const W = Math.ceil(bw * k) + 6, H = Math.ceil(bh * k) + 6;
    godBuffers(W, H);
    const g = god.a.getContext('2d'), rb = god.b.getContext('2d');
    // the silhouette
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.clearRect(0, 0, W, H);
    g.setTransform(k, 0, 0, k, 3 - bx0 * k, 3 - by0 * k);
    const ret = CAST.beggar(g, 0, 0, J.beggar.s, { pose: 'rise', rise, t: T, silhouette: '#ffffff' });
    // the rim: the silhouette blotted four ways, minus itself
    rb.setTransform(1, 0, 0, 1, 0, 0);
    rb.globalCompositeOperation = 'source-over';
    rb.globalAlpha = 1;
    rb.clearRect(0, 0, W, H);
    const o = Math.max(1, 1.5 * k);
    for (const [ox, oy] of [[-o, 0], [o, 0], [0, -o], [0, o]]) rb.drawImage(god.a, 0, 0, W, H, ox, oy, W, H);
    rb.globalCompositeOperation = 'source-in';
    rb.fillStyle = C.ginnezu;
    rb.fillRect(0, 0, W, H);
    rb.globalCompositeOperation = 'destination-out';
    rb.drawImage(god.a, 0, 0, W, H, 0, 0, W, H);
    // the body: 胡粉 with a travelling glint band (as the moon's kira)
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = C.gofun;
    g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-atop';
    const ph = U.fract((T - J.rise) / 1.3);
    const ang = U.deg(30), ca = Math.cos(ang), sa = Math.sin(ang);
    const span = (W + H) * 0.7, c0 = U.lerp(-span, span, ph);
    const gx = W / 2 + ca * c0, gy = H / 2 + sa * c0;
    const gr = g.createLinearGradient(gx - ca * 26 * k, gy - sa * 26 * k, gx + ca * 26 * k, gy + sa * 26 * k);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.5, 'rgba(255,255,255,1)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, W, H);
    // print: the mica 'lighter', the rim over it
    const dx = Math.round(bx0 * k + tf.e - 3), dy = Math.round(by0 * k + tf.f - 3);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha *= 0.26 * a;
    ctx.drawImage(god.a, 0, 0, W, H, dx, dy, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = ctx.globalAlpha / 0.26 * 0.65;
    ctx.drawImage(god.b, 0, 0, W, H, dx, dy, W, H);
    ctx.restore();
    return ret;
  }

  /**
   * A short carved ground line under an actor (its own frame): a thin 薄墨
   * stroke, fullest in the middle, that seats the figure on the face so the
   * far side reads as further off rather than higher up. It stays when the
   * actor leaves it (the rabbit's empty place) and goes with the play.
   */
  function groundLine(ctx, a, x0, x1, ink, alpha) {
    if (alpha <= 0.004) return;
    at(ctx, a, (c) => {
      c.save();
      c.globalAlpha *= alpha;
      B.taper(c, B.qpts(x0, 1.6, (x0 + x1) / 2, 0.4, x1, 1.8, 10), 0.3, 0.3, ink, 5.5);
      c.restore();
    });
  }
  function drawPlay(ctx, T) {
    const fade = 1 - U.smoothstep(J.fade[0], J.fade[1], T);
    // the ground under each place, printed as its actor settles on it
    const seat = (t0) => U.smoothstep(t0, t0 + 0.5, T) * fade;
    groundLine(ctx, J.monkey, -40, 34, INK_FAR, 0.5 * seat(J.monkeyIn[1] - 0.15));
    groundLine(ctx, J.fox, -44, 52, INK_FAR, 0.5 * seat(J.foxIn[1] - 0.1));
    groundLine(ctx, J.beggar, -26, 74, INK_NEAR, 0.42 * fade);
    groundLine(ctx, J.rabbit, -34, 28, INK_NEAR, 0.42 * seat(J.droop - 0.1));
    // flat opaque inks, each actor one impression with its lines cut in:
    // 墨 for the near side, a paler 薄墨 for the far side of the fire
    // the far side first — the monkey: three hops in from the left, sitting up, with fruit; then offers
    if (T >= J.monkeyIn[0] && fade > 0) {
      const Mk = J.monkey;
      const end = J.monkeyIn[1] - 0.15;
      const u = U.seg(T, J.monkeyIn[0], end);
      const hop = T < end ? Math.sin(U.fract(u * 3) * Math.PI) : 0;
      const tilt = T < end ? -0.12 * Math.sin(U.fract(u * 3) * TAU) : 0;
      const k = Mk.s;
      const sw = 3 * Math.sin(T * 2.4);
      const offer = E.outSine(U.seg(T, end, end + 0.6));
      const fig = (c, o) => CAST.monkey(c, 0, 0, k, { pose: 'sit', offer, fruit: 3, t: T, ...o });
      at(ctx, Mk, (c) => {
        c.translate(0, -hop * 16);
        c.rotate(tilt);
        // its long tail, an upright arc curling behind it
        c.save();
        c.globalAlpha *= fade;
        const tx = -12 * k;
        B.taper(c, [[tx, -14 * k], [tx - 10 * k, -13 * k], [tx - 17 * k, -22 * k + sw * 0.3], [tx - 17 * k + sw, -38 * k], [tx - 11 * k + sw, -46 * k], [tx - 6 * k + sw, -41 * k]], 4 * k, 1.8 * k, INK_FAR, 0);
        c.restore();
        fig(c, { silhouette: INK_FAR, alpha: fade });
        cutLines(c, CUTS.monkey, LINE_FAR, fade);
      }, U.lerp(Mk.dx0, 0, u));
    }
    // the fox: from the right with a fish
    if (T >= J.foxIn[0] && fade > 0) {
      const Fx = J.fox;
      const arrive = J.foxIn[1] - 0.1;
      const dx = U.lerp(Fx.dx0, 0, E.outSine(U.seg(T, J.foxIn[0], arrive)));
      const fig = T < arrive
        ? (c, o) => CAST.fox(c, 0, 0, Fx.s, { pose: 'walk', carry: 'fish', facing: -1, t: T * 1.3, ...o })
        : (c, o) => CAST.fox(c, 0, 0, Fx.s, { pose: 'sit', carry: 'fish', facing: -1, t: T, ...o });
      at(ctx, Fx, (c) => {
        fig(c, { silhouette: INK_FAR, alpha: fade });
        // its cuts come as it sits
        cutLines(c, CUTS.fox, LINE_FAR, fade * U.smoothstep(arrive, arrive + 0.3, T));
      }, dx);
    }
    // the near side — the beggar: hunched by the fire, his staff planted
    // beside him; at the flash he rises and turns to mica (帝釈天)
    if (T < J.rise + 0.6) {
      const a = 1 - U.smoothstep(J.rise, J.rise + 0.6, T);
      const fig = T < J.rise
        ? (c, o) => CAST.beggar(c, 0, 0, J.beggar.s, { pose: 'sit', t: T, ...o })
        : (c, o) => CAST.beggar(c, 0, 0, J.beggar.s, { pose: 'rise', rise: E.inOutSine(U.seg(T, J.rise, J.rise + 0.9)), t: T, ...o });
      at(ctx, J.beggar, (c) => {
        c.save();
        c.globalAlpha *= a;
        const sx = STAFF_X;
        B.taper(c, [[sx, 1], [sx - 4, -40], [sx - 7, -76], [sx - 8, -84]], 2.2, 2.8, INK_NEAR, 0);
        c.fillStyle = INK_NEAR;
        c.beginPath();
        c.ellipse(sx - 8, -86, 2.8, 3.6, -0.2, 0, TAU);
        c.fill();
        c.restore();
        fig(c, { silhouette: INK_NEAR, alpha: a });
        // his cuts (the sitting pose's) go as he begins to rise
        cutLines(c, CUTS.beggar, LINE_NEAR, a * (1 - U.smoothstep(J.rise, J.rise + 0.25, T)));
      });
    }
    if (T >= J.rise && fade > 0) {
      const rise = E.inOutSine(U.seg(T, J.rise, J.rise + 0.9));
      const mica = U.smoothstep(J.rise, J.rise + 0.6, T) * fade;
      at(ctx, J.beggar, (c) => {
        const ret = drawGod(c, T, rise, mica);
        // a thin nimbus, and a few motes of mica
        const hd = ret && ret.head ? ret.head : [0, -120];
        c.save();
        c.globalAlpha *= 0.5 * mica;
        c.strokeStyle = U.rgba(U.mix(C.kin, C.ginnezu, 0.4), 0.85);
        c.lineWidth = 1.1;
        c.beginPath();
        c.arc(hd[0], hd[1] - 2, 19, 0, TAU);
        c.stroke();
        c.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 12; i++) {
          const an = U.hash(i + 5) * TAU, d = U.lerp(8, 52, U.hash(i + 9));
          const tw = Math.pow(Math.max(0, Math.sin(T * 4 + i * 2.3)), 6);
          c.fillStyle = `rgba(255,250,236,${0.7 * tw})`;
          c.fillRect(Math.cos(an) * d * 0.6 - 1, -70 + Math.sin(an) * d * 1.5 - 1, 2, 2);
        }
        c.restore();
      });
    }
    // the rabbit: hops in with nothing, ears droop, looks out at us, gathers
    // itself and leaps
    if (T >= J.rabbitIn[0] && T < J.into) {
      const R = J.rabbit;
      if (T < J.droop) {
        const u = U.seg(T, J.rabbitIn[0], J.droop);
        const hop = u * 2, ph = hop - Math.floor(hop);
        const fig = (c, o) => CAST.rabbit(c, 0, 0, R.s, { pose: 'hop', phase: ph, facing: -1, t: T, ...o });
        at(ctx, R, (c) => fig(c, { silhouette: INK_NEAR }), U.lerp(R.dx0, 0, E.outSine(u)));
      } else if (T < J.gaze) {
        // the ears droop (95.8, 0.45 s) and hang; from 96.7 the head comes up again
        const d = E.inOutSine(U.seg(T, J.droop, J.droop + 0.45)) * (1 - E.inOutSine(U.seg(T, J.gaze - 0.3, J.gaze - 0.02)));
        at(ctx, R, (c) => rabbitSit(c, 0, 0, R.s, d, -1, 1, T));
      } else if (T < J.leap) {
        // 97.0 it turns to us — a cut on the koto's harmonic, and it settles
        // (0.22 s); the look holds; then it gathers itself for the leap,
        // crouching about its feet, ears laid back (97.84–98.0)
        const settle = E.outSine(U.seg(T, J.gaze, J.gaze + 0.22));
        const cr = E.inQuad(U.seg(T, J.leap - 0.16, J.leap));
        at(ctx, R, (c) => {
          c.scale((1 + 0.08 * cr) * (1 + 0.025 * (1 - settle)), (1 - 0.16 * cr) * (0.955 + 0.045 * settle));
          rabbitFront(c, 0, 0, R.s * 0.92, 1, T, Math.max(0.7 * cr, 0.3 * (1 - settle)));
        });
      } else {
        // 98.0, on the bachi: it springs in profile — the swap hidden in the
        // fastest frame — stretched along its flight for 0.14 s, on a
        // ballistic parabola of its body (the pivot `lift` px above its
        // feet) from where it sat into the heart of the fire, apex 60 px
        // above the flame tips: nose-up, and in head first
        const F = J.fire;
        const u = U.seg(T, J.leap, J.into);
        const g = U.lerp(R.g, F.g, u);
        const lift = 52;
        const x = U.lerp(R.x, F.x + 4 * F.g, u);
        const apex = F.y - 80 * F.g - 60;
        const y0 = R.y - lift * R.g, y1 = F.y - 30 * F.g;
        const y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * (2 * apex - (y0 + y1) / 2) + u * u * y1;
        const vis = 1 - U.smoothstep(0.86, 1, u);
        const st = 1 - E.outQuad(U.seg(T, J.leap, J.leap + 0.14));
        const fig = (c, o) => CAST.rabbit(c, 0, lift, R.s, { pose: 'leap', phase: u, facing: -1, t: T, ...o });
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(U.lerp(0.12, -0.95, E.inSine(u)));
        ctx.scale(g * (1 + 0.14 * st), g * (1 - 0.08 * st));
        fig(ctx, { silhouette: INK_NEAR, alpha: vis });
        ctx.restore();
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* smoke → maria                                                       */
  /* ------------------------------------------------------------------ */
  /**
   * The 杵's swing (radians, + toward the mortar): ぺったん every 1.6 s from
   * 106.4, on the score's pestle cues. The picture never stops pounding: the
   * SOUND fades to nothing over 108–112 (CUES.pestleFade) while the rabbit
   * keeps striking through the tilt and over the garden until the cut at 118.
   */
  SD.pestle = (T) => {
    if (T < 106.0) return 0;
    const A = U.deg(18);
    let a;
    if (T < 106.4) a = A * E.inQuad(U.seg(T, 106.0, 106.4));
    else {
      const ph = U.fract((T - 106.4) / 1.6);
      // impact at ph 0: a slow lift to −18°, a short hold, a quick strike
      if (ph < 0.62) a = U.lerp(A, -A, E.inOutSine(ph / 0.62));
      else if (ph < 0.76) a = -A;
      else a = U.lerp(-A, A, E.inQuad((ph - 0.76) / 0.24));
    }
    return a;
  };

  /**
   * The fourteen strokes of smoke. Each is born as a wisp over the fire,
   * leaves it as a loose curl round the place its stroke will lie, and then
   * settles, thickening, into that stroke — in the order a painter would lay
   * them: the mortar, the body, the head, the ears, the pestle last.
   */
  const MARIA = MOON.maria;
  const SMOKE = MARIA.STROKES.map((st, i) => {
    const rank = MARIA.ORDER.indexOf(i);
    const h = U.hash(i * 13 + 5), h2 = U.hash(i * 7 + 1), h3 = U.hash(i * 11 + 3);
    return {
      i, rank,
      t0: 100 + rank * 0.07 + h * 0.3,                   // wisp birth
      m0: 101.5 + rank * 0.1,                           // it begins to gather
      m1: 104.2 + rank * 0.125,                         // settled (the pestle last, 105.8)
      dx: (h - 0.5) * 36,
      lean: U.lerp(0.35, 0.8, h3),                     // the plume leans up-left
      freq: U.lerp(4.8, 8.0, U.hash(i * 17 + 9)),
      spin: (h2 < 0.5 ? -1 : 1) * U.lerp(0.6, 1.1, h),  // the swirl as it gathers
      len: U.lerp(150, 230, h2),
      seed: i * 3 + 1,
    };
  });
  /**
   * The wisp's 6 points (Shot D px) at T: a thread of smoke rising from the
   * fire in a travelling S that widens as it climbs.
   */
  function wisp(sm, T) {
    // a thread of the plume: it leaves the fire, leans away up-left on the
    // night air in a slow travelling S, and every thread leans the same way
    const age = Math.max(0, T - sm.t0);
    const grow = E.outSine(U.clamp(age / 2.2));
    const f = J.fire;
    const L = sm.len * (0.22 + 0.78 * grow);
    const bx = f.x + sm.dx * 0.2 * f.g, by = f.y - 44 * f.g;
    const pts = [];
    for (let j = 0; j < 6; j++) {
      const q = j / 5;
      const amp = (3 + 24 * q) * (0.5 + 0.5 * grow);
      pts.push([bx - sm.lean * q * q * L + sm.dx * q * 0.6 + amp * Math.sin(q * sm.freq - T * 1.4 + sm.seed), by - q * L + 6 * q * Math.cos(q * 4 - T + sm.seed)]);
    }
    return pts;
  }
  function target(i, T) {
    const st = MARIA.STROKES[i];
    let p = st.p;
    if (MARIA.PESTLE.indexOf(i) >= 0) p = MARIA.swing(p, SD.pestle(T));
    return { p: p.map((q) => [M.x + q[0] * M.r, M.y + q[1] * M.r]), w: st.w.map((w) => w * M.r), flat: st.flat };
  }
  function drawSmoke(ctx, T) {
    const out = U.smoothstep(106.0, 106.55, T);
    const core = new Path2D(), halo = new Path2D(), crisp = new Path2D();
    let nSoft = 0, nCrisp = 0;
    for (const sm of SMOKE) {
      if (T < sm.t0) continue;
      const tg = target(sm.i, T);
      const e = U.seg(T, sm.m0, sm.m1);
      const wp = wisp(sm, T);
      const born = E.outSine(U.clamp((T - sm.t0) / 0.9));
      // the thread drifts over and swirls into its place (no stroke arrives
      // formed: it only takes its shape as it thickens)
      const ep = E.inOutSine(e);
      const cx = tg.p.reduce((a, q) => a + q[0], 0) / 6, cy = tg.p.reduce((a, q) => a + q[1], 0) / 6;
      const sw = sm.spin * (1 - ep), cs = Math.cos(sw), sn = Math.sin(sw);
      const pts = wp.map((q, j) => {
        const x = U.lerp(q[0], tg.p[j][0], ep), y = U.lerp(q[1], tg.p[j][1], ep);
        const dx = x - U.lerp(q[0], cx, ep), dy = y - U.lerp(q[1], cy, ep);
        return [x - dx + dx * cs - dy * sn, y - dy + dx * sn + dy * cs];
      });
      const wk = Math.pow(e, 1.5);
      const ws = tg.w.map((w, j) => U.lerp(U.lerp(1.4, 6.5, j / 5) * born, w, wk));
      if (e <= 0.85) {
        MARIA.ribbon(core, pts, ws, tg.flat && e > 0.6);
        MARIA.ribbon(halo, pts, ws.map((w) => w + 5 * (1 - wk)), tg.flat && e > 0.6);
        nSoft++;
      } else { MARIA.ribbon(crisp, pts, ws, tg.flat); nCrisp++; }
    }
    PRINT.with(ctx, 'K', T, (c) => {
      c.save();
      c.globalCompositeOperation = 'multiply';
      if (nSoft) {
        // a soft 薄墨 bleed round a paler core
        c.fillStyle = U.rgba(C.sumi, 0.04 * (1 - out));
        c.fill(halo);
        c.fillStyle = U.rgba(C.sumi, 0.075 * (1 - out));
        c.fill(core);
      }
      if (nCrisp) {
        c.fillStyle = U.rgba(C.sumi, 0.2 * (1 - out));
        c.fill(crisp);
      }
      c.restore();
    });
  }

  /**
   * The face of the moon at (x, y, r) — the play, the fire, the smoke, then
   * the maria with its live pestle. Everything is authored on Shot D's moon
   * and mapped onto (x, y, r).
   */
  SD.face = (ctx, T, x = M.x, y = M.y, r = M.r) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.clip();
    const k = r / M.r;
    ctx.translate(x, y);
    ctx.scale(k, k);
    ctx.translate(-M.x, -M.y);
    const Tj = Math.max(T, 89.5);          // before 90 (inside the fox window) the play is as at 90
    // Through the fox window the face is blank, waiting (87.2–89.4); the
    // beggar and his fire print in as the window passes the frame, so 四
    // opens on them (90.2) — and a clipped flame never shows at the diamond's point
    const pre = T < 90.2 ? U.seg(T, 89.4, 90.2, E.inOutSine) : 1;
    if (pre > 0.002) {
      ctx.globalAlpha *= pre;
      if (T < 103.2) PRINT.with(ctx, 'K', Tj, (c) => drawPlay(c, Tj));
      if (T < 106.3) drawFire(ctx, Tj);
      if (T >= 100 && T < 106.55) drawSmoke(ctx, T);
    }
    ctx.restore();
    // the maria, printed at 106 — with the pestle's swing
    if (T >= 106.0) {
      const a = 0.22 * U.smoothstep(106.0, 106.5, T);
      MOON.maria(ctx, x, y, r, a, C.sumi, { pestle: SD.pestle(T) });
      // a faint vapour curl from the mortar (玉兔搗藥)
      const v = U.smoothstep(106.4, 107.4, T) * (1 - U.smoothstep(108, 110, T));
      if (v > 0) {
        const mx = x + (1027 - M.x) * k, my = y + (462 - M.y) * k;
        ctx.save();
        ctx.strokeStyle = U.rgba(C.gofun, 0.35 * v);
        ctx.lineWidth = 3 * k;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let j = 0; j <= 12; j++) {
          const q = j / 12;
          const px = mx + (Math.sin(q * 5 + T * 0.8) * 9 + q * 12) * k, py = my - q * 56 * k;
          if (j) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  /** The flash (99.0–99.4): the disc whitens and the sky round it breathes. */
  function flash(ctx, T, dy) {
    const a = T < J.flash ? 0 : T < J.flash + 0.06 ? (T - J.flash) / 0.06 : 1 - E.outSine(U.seg(T, J.flash + 0.06, J.rise));
    if (a <= 0.001) return;
    const y = M.y + dy;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(M.x, y, M.r * 0.6, M.x, y, M.r * 2.1);
    g.addColorStop(0, `rgba(250,246,232,${0.5 * a})`);
    g.addColorStop(0.35, `rgba(238,242,234,${0.22 * a})`);
    g.addColorStop(1, 'rgba(238,242,234,0)');
    ctx.fillStyle = g;
    ctx.fillRect(M.x - M.r * 2.2, y - M.r * 2.2, M.r * 4.4, M.r * 4.4);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = U.rgba(C.gofun, 0.96 * a);
    ctx.beginPath();
    ctx.arc(M.x, y, M.r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* the frame                                                           */
  /* ------------------------------------------------------------------ */
  SD.frame = (ctx, T, S, o = {}) => {
    const dy = o.dy || 0;
    const st = PRINT.state(T);
    ctx.save();
    if (dy) ctx.translate(0, dy);
    if (o.haloAlpha !== 0 && !o.halo) TSUKI.SHOTS.flatPrint(ctx, 'D', ['sky', 'halo', 'top'], T, { state: st });
    else {
      // the sky, then a live 月暈 (o.halo, stage coordinates — the tilt's
      // travelling one) or none, then the ichimonji printed over it
      TSUKI.SHOTS.flatPrint(ctx, 'D', ['sky'], T, { state: st });
      const h = o.halo;
      if (h && h.a > 0.004) {
        ctx.save();
        if (dy) ctx.translate(0, -dy);
        PRINT.with(ctx, 'P7', T, (c) => SD.haloBand(c, h.x, h.y, h.R, h.a));
        ctx.restore();
      }
      if (dy > -(SKY.top + SKY.topWipe + 20)) PRINT.drawLayer(ctx, 'D', 'top', T, { state: st });
    }
    ctx.restore();
    if (o.moon !== false) {
      // no second halo: the 月暈 is the carved band of the 'halo' plate alone
      MOON.draw(ctx, M.x, M.y + dy, M.r, T, { halo: 0, maria: 0 });
      SD.face(ctx, T, M.x, M.y + dy, M.r);
      flash(ctx, T, dy);
    }
    if (o.susuki !== false) PRINT.with(ctx, 'K', T, (c) => SD.susuki(c, T, dy, o.susukiAlpha == null ? 1 : o.susukiAlpha));
  };
})(window.TSUKI = window.TSUKI || {});
