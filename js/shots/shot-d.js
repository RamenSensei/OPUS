/* ==========================================================================
   shot-d.js — MASTER SHOT D: looking straight up at the moon (四 月天心).
   An enormous blank paper moon (960,430) r 260 with a 月暈 ring r 420 in a
   ベロ藍 sky under a near-black ichimonji; susuki plumes stand along the
   bottom edge as silhouettes. On the moon's face the Jataka of the rabbit
   plays in sumi (90–103); the fire is the only warm colour ever drawn inside
   the moon; the smoke settles into the maria (TSUKI.MOON.maria) at 106.

   Plates (PRINT shot 'D'):
     sky   P6 ベロ藍 → 紺 bokashi · P6i ichimonji (ベロ藍 + 墨 60%) · P8 faint kira
     halo  P7 the 月暈 ring (2 px 胡粉 α .18, soft inner band α .08)

   TSUKI.SHOTS.D
     MOON                     { x, y, r, haloR } — the fixed moon of Shot D
     frame(ctx, T, S, o)      the whole Shot D frame at film time T (the 四
                              scene function; 三 draws it inside the fox
                              window). o.moon === false → no moon/face (the
                              tilt draws the one moon itself); o.dy → shift
                              sky & susuki (tilt); o.susuki === false;
                              o.haloAlpha === 0 → no 月暈 plate
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
  const NIGHT_TOP = U.mix(C.bero, C.sumi, 0.6);
  const GROUND = 580;                                  // the Jataka's ground line on the face

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

  PRINT.defineShot('D', {
    layers: ['sky', 'halo'],
    worn: false,
    build(P) {
      // P6: the night — ベロ藍, deepening to 紺 at the bottom edge
      const s = P('sky', 'P6');
      const g = s.createLinearGradient(0, 0, 0, 1080);
      g.addColorStop(0, U.mix(C.bero, C.kon, 0.35));
      g.addColorStop(0.3, C.bero);
      g.addColorStop(0.55, U.mix(C.bero, C.kon, 0.2));
      g.addColorStop(0.85, C.kon);
      g.addColorStop(1, U.mix(C.kon, C.tetsukon, 0.5));
      s.fillStyle = g;
      s.fillRect(0, 0, 1920, 1080);
      // the sky a little paler round the moon (a bokashi of the block, not a glow)
      s.save();
      s.translate(M.x, M.y);
      const rg = s.createRadialGradient(0, 0, M.r, 0, 0, 520);
      rg.addColorStop(0, U.rgba(U.mix(C.bero, C.hanada, 0.45), 0.25));
      rg.addColorStop(0.5, U.rgba(U.mix(C.bero, C.hanada, 0.3), 0.08));
      rg.addColorStop(1, U.rgba(C.bero, 0));
      s.fillStyle = rg;
      s.fillRect(-560, -560, 1120, 1120);
      s.restore();
      woodGrain(s, 0, 0, 1920, 1080, C.kon, U.mix(C.bero, C.hanada, 0.4), 0.06, 777);
      // P6i: the ichimonji
      const i = P('sky', 'P6i');
      B.ichimonji(i, NIGHT_TOP, 140, 200, 1);
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
      // P7: the 月暈 ring — a 2 px 胡粉 line (α .18) with a soft inner band (α .08)
      const h = P('halo', 'P7');
      h.save();
      h.translate(M.x, M.y);
      const band = h.createRadialGradient(0, 0, M.haloR - 46, 0, 0, M.haloR);
      band.addColorStop(0, U.rgba(C.gofun, 0));
      band.addColorStop(0.8, U.rgba(C.gofun, 0.08));
      band.addColorStop(1, U.rgba(C.gofun, 0.02));
      h.fillStyle = band;
      h.beginPath();
      h.arc(0, 0, M.haloR, 0, TAU);
      h.arc(0, 0, M.haloR - 46, 0, TAU, true);
      h.fill();
      h.strokeStyle = U.rgba(C.gofun, 0.18);
      h.lineWidth = 2;
      h.beginPath();
      h.arc(0, 0, M.haloR, 0, TAU);
      h.stroke();
      h.restore();
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
    TSUKI.SHOTS.flatPrint(null, 'D', ['sky', 'halo'], 100, { w, h, build: true });
    TSUKI.SHOTS.flatPrint(null, 'D', ['sky'], 100, { w, h, build: true });
    // the printed rabbit, carved now (not mid-film)
    for (const cut of ['all', 'body', 'pestle']) for (const d of [512, 256, 128, 64]) MOON.maria.sprite(C.sumi, cut, d);
  };

  /* ------------------------------------------------------------------ */
  /* the Jataka on the moon's face                                       */
  /* ------------------------------------------------------------------ */
  const J = {
    beggar: { x: 866, s: 0.62 },
    monkeyIn: [92.0, 93.4], monkey: { x0: 700, x1: 786, s: 1.12 },
    foxIn: [93.4, 94.8], fox: { x0: 1250, x1: 1124, s: 1.15 },
    rabbitIn: [94.8, 95.8], rabbit: { x0: 1220, x1: 1044, s: 1.15 },
    droop: 95.8, gaze: 97.0, leap: 98.0, into: 98.9, flash: 99.0, rise: 99.4, fade: [100, 103],
    fire: { x: 960, y: GROUND },
  };
  SD.J = J;
  const INK = C.sumi;

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

  /**
   * The empty-handed rabbit sitting (CAST.rabbit 'sit' geometry), with the
   * droop made legible for a silhouette: the head bows and the ears fall
   * back and DOWN behind it, hanging below the line of the head.
   */
  function rabbitSit(ctx, x, y, s, droop, facing, alpha, T) {
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
    p.addPath(head, new DOMMatrix().translate(hx, hy).rotate((ha * 180) / Math.PI));
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * 0.55 * facing, s * 0.55);
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = INK;
    ctx.fill(p);
    ctx.restore();
  }

  /** A frontal rabbit, sitting up and looking out of the moon at us. */
  function rabbitFront(ctx, x, y, s, alpha, T) {
    const p = new Path2D();
    const breathe = Math.sin(T * 2.3) * 0.6;
    ell(p, 0, -22, 20, 23, 0);                             // body
    ell(p, -12, -4, 9, 5, 0.2); ell(p, 12, -4, 9, 5, -0.2);   // hind feet
    ell(p, 0, -52 - breathe, 15, 14, 0);                  // head
    ell(p, -7, -80 - breathe, 5, 17, -0.14);              // ears
    ell(p, 7, -81 - breathe, 5, 17, 0.12);
    ell(p, -6, -34, 4, 7, 0.3); ell(p, 6, -34, 4, 7, -0.3); // fore paws held to the chest
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = INK;
    ctx.fill(p);
    // the eyes: two points of the moon's own paper
    ctx.fillStyle = C.kinari;
    for (const sx of [-5.5, 5.5]) {
      ctx.beginPath();
      ctx.ellipse(sx, -54 - breathe, 1.9, 2.3, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---- the fire: seven Buddhist 火焔 tongues --------------------------- */
  // [base dx, height, lean (|≤ .25|), curl side, width]
  const TONGUES = [
    [0, 80, 0.0, 1, 32], [-14, 60, -0.12, -1, 27], [14, 64, 0.12, 1, 27], [-27, 42, -0.2, -1, 23],
    [27, 46, 0.2, 1, 23], [-6, 38, -0.05, -1, 21], [8, 36, 0.06, 1, 19],
  ];
  function fireLevel(T) {
    const flare = U.env(T, J.into - 0.05, J.into + 0.08, J.flash + 0.1, J.rise + 0.2) * 0.4;
    const die = 1 - U.smoothstep(J.rise, 103.2, T);
    return Math.max(0, die + flare * die);
  }
  /**
   * One tongue as a filled outline: widest at its base, tapering steadily to
   * the tip; the top quarter curls back on itself (蕨手), as flames do in the
   * 火焔光背 of a Fudō.
   */
  function tongue(p, bx, by, h, w0, lean, curl, ph) {
    const N = 18, cl = [], ws = [];
    let x = bx, y = by, th = -Math.PI / 2 + lean;
    const ds = h / N;
    for (let j = 0; j <= N; j++) {
      const s = j / N;
      cl.push([x, y]);
      ws.push(Math.max(0.6, w0 * Math.pow(1 - s, 1.05) * (s > 0.76 ? U.lerp(1, 0.7, (s - 0.76) / 0.24) : 1)));
      let turn = 0.07 * Math.sin(s * 5.5 + ph) * (1 - s);           // the S of the body
      if (s > 0.74) turn += curl * 0.85 * ((s - 0.74) / 0.26);       // the hook at the tip (蕨手)
      th += turn;
      x += Math.cos(th) * ds;
      y += Math.sin(th) * ds;
    }
    const L = [], R = [];
    for (let j = 0; j <= N; j++) {
      const a = cl[Math.max(0, j - 1)], b = cl[Math.min(N, j + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len, hw = ws[j] / 2;
      L.push([cl[j][0] + nx * hw, cl[j][1] + ny * hw]);
      R.push([cl[j][0] - nx * hw, cl[j][1] - ny * hw]);
    }
    const pts = L.concat(R.reverse());
    let area = 0;
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; area += a[0] * b[1] - b[0] * a[1]; }
    if (area < 0) pts.reverse();
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    p.closePath();
  }
  function firePaths(T, lv) {
    const f = J.fire;
    const outer = new Path2D(), inner = new Path2D();
    TONGUES.forEach(([dx, h0, lean, curl, w], i) => {
      const h = h0 * lv * (1 + 0.1 * Math.sin(T * 8.3 + i * 2.1));
      if (h < 4) return;
      const ln = U.clamp(lean + 0.05 * Math.sin(T * 3.1 + i * 1.3), -0.25, 0.25);
      const bx = f.x + dx * (0.6 + 0.4 * lv);
      tongue(outer, bx, f.y - 2, h, Math.max(10, w * (0.55 + 0.45 * lv)), ln, curl, T * 4.2 + i * 1.7);
      if (i < 5) tongue(inner, f.x + dx * 0.5 * lv, f.y - 3, h * 0.55, Math.max(5, w * 0.45 * (0.55 + 0.45 * lv)), ln * 0.8, curl, T * 4.6 + i * 1.3 + 0.8);
    });
    return { outer, inner };
  }
  function drawFire(ctx, T) {
    const lv = fireLevel(T);
    const f = J.fire;
    // the logs (薪): three crossed sticks and a bed of ash under them
    const logA = U.clamp(1 - U.smoothstep(101.8, 104.6, T));
    if (logA > 0) {
      PRINT.with(ctx, 'K', T, (c) => {
        c.save();
        c.globalAlpha *= 0.85 * logA;
        B.taper(c, [[f.x - 30, f.y + 5], [f.x, f.y + 3.5], [f.x + 30, f.y + 5]], 2.2, 0.8, U.rgba(INK, 0.35), 0.4);
        B.taper(c, [[f.x - 36, f.y + 2], [f.x + 34, f.y - 7]], 6, 5, INK, 0);
        B.taper(c, [[f.x - 32, f.y - 7], [f.x + 36, f.y + 1]], 6, 5, INK, 0);
        B.taper(c, [[f.x - 18, f.y + 3], [f.x + 20, f.y + 4]], 5, 5, INK, 0);
        c.restore();
      });
    }
    // embers: the last of them fades at 106
    const emb = U.env(T, 89, 90, 103.5, 106.6);
    if (emb > 0) {
      PRINT.with(ctx, 'P2', T, (c) => {
        const r = U.rng(4242);
        for (let i = 0; i < 9; i++) {
          const ex = f.x + U.lerp(-28, 28, r()), ey = f.y + U.lerp(-8, 2, r());
          const last = i === 4;
          const tw = 0.6 + 0.4 * Math.sin(T * U.lerp(3, 7, r()) + i);
          const a = emb * tw * (last ? 1 : 1 - U.smoothstep(103.5, 105.2, T));
          if (a <= 0.01) continue;
          c.fillStyle = U.rgba(i % 3 ? C.shu : C.yamabuki, a);
          c.beginPath();
          c.arc(last ? f.x + 2 : ex, last ? f.y - 3 : ey, last ? 3.2 : U.lerp(1.5, 2.8, r()), 0, TAU);
          c.fill();
        }
      });
    }
    if (lv <= 0.01) return;
    const { outer, inner } = firePaths(T, lv);
    // key line: the union's outer silhouette only (stroked under the fill)
    PRINT.with(ctx, 'K', T, (c) => {
      c.strokeStyle = U.rgba(INK, 0.6);
      c.lineWidth = 2;
      c.lineJoin = 'round';
      c.stroke(outer);
    });
    PRINT.with(ctx, 'P2', T, (c) => {
      c.fillStyle = C.shu;
      c.fill(outer);
      c.fillStyle = C.yamabuki;
      c.fill(inner);
      // sparks rising
      for (let i = 0; i < 9; i++) {
        const ph = U.fract(T * 0.55 + i * 0.137);
        const sx = f.x + U.lerp(-24, 24, U.hash(i + 7)) + Math.sin(ph * 6 + i) * 8;
        const sy = f.y - 40 - ph * 90 * (0.5 + 0.5 * lv);
        c.fillStyle = U.rgba(C.yamabuki, (1 - ph) * 0.9 * lv);
        c.beginPath();
        c.arc(sx, sy, 1.6, 0, TAU);
        c.fill();
      }
    });
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
    const bx0 = J.beggar.x - 75, by0 = GROUND - 222, bw = 165, bh = 232;
    const W = Math.ceil(bw * k) + 6, H = Math.ceil(bh * k) + 6;
    godBuffers(W, H);
    const g = god.a.getContext('2d'), rb = god.b.getContext('2d');
    // the silhouette
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.clearRect(0, 0, W, H);
    g.setTransform(k, 0, 0, k, 3 - bx0 * k, 3 - by0 * k);
    const ret = CAST.beggar(g, J.beggar.x, GROUND, J.beggar.s, { pose: 'rise', rise, t: T, silhouette: '#ffffff' });
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

  /** Walk-in helper: x along [x0 → x1] over [a, b] with an ease. */
  const walk = (T, a, b, x0, x1) => ({ x: U.lerp(x0, x1, E.outSine(U.seg(T, a, b))), u: U.seg(T, a, b) });

  function drawPlay(ctx, T) {
    const fade = 1 - U.smoothstep(J.fade[0], J.fade[1], T);
    const sil = (a) => ({ silhouette: INK, alpha: 0.86 * a });
    // the monkey: three hops in from the left, sitting up, with fruit; then offers
    if (T >= J.monkeyIn[0] && fade > 0) {
      const end = J.monkeyIn[1] - 0.15;
      const u = U.seg(T, J.monkeyIn[0], end);
      const x = U.lerp(J.monkey.x0, J.monkey.x1, u);
      const hop = T < end ? Math.sin(U.fract(u * 3) * Math.PI) : 0;
      const tilt = T < end ? -0.12 * Math.sin(U.fract(u * 3) * TAU) : 0;
      const k = J.monkey.s;
      const sw = 3 * Math.sin(T * 2.4);
      ctx.save();
      ctx.translate(x, GROUND - hop * 16);
      ctx.rotate(tilt);
      // its long tail, an upright arc curling behind it
      ctx.save();
      ctx.globalAlpha *= 0.86 * fade;
      const tx = -12 * k;
      B.taper(ctx, [[tx, -14 * k], [tx - 14 * k, -12 * k], [tx - 24 * k, -22 * k + sw * 0.3], [tx - 24 * k + sw, -38 * k], [tx - 16 * k + sw, -46 * k], [tx - 10 * k + sw, -40 * k]], 4 * k, 1.8 * k, INK, 0);
      ctx.restore();
      CAST.monkey(ctx, 0, 0, k, { pose: 'sit', offer: E.outSine(U.seg(T, end, end + 0.6)), fruit: 3, t: T, ...sil(fade) });
      ctx.restore();
    }
    // the fox: from the right with a fish
    if (T >= J.foxIn[0] && fade > 0) {
      const w = walk(T, J.foxIn[0], J.foxIn[1] - 0.1, J.fox.x0, J.fox.x1);
      if (T < J.foxIn[1] - 0.1) CAST.fox(ctx, w.x, GROUND, J.fox.s, { pose: 'walk', carry: 'fish', facing: -1, t: T * 1.3, ...sil(fade) });
      else CAST.fox(ctx, J.fox.x1, GROUND, J.fox.s, { pose: 'sit', carry: 'fish', facing: -1, t: T, ...sil(fade) });
    }
    // the beggar: hunched by the fire, his staff planted beside him;
    // at the flash he rises and turns to mica (帝釈天)
    if (T < J.rise + 0.6) {
      const a = 1 - U.smoothstep(J.rise, J.rise + 0.6, T);
      ctx.save();
      ctx.globalAlpha *= 0.86 * a;
      const sx = J.beggar.x - 22;
      B.taper(ctx, [[sx, GROUND + 1], [sx - 4, GROUND - 40], [sx - 7, GROUND - 76], [sx - 8, GROUND - 84]], 2.2, 2.8, INK, 0);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.ellipse(sx - 8, GROUND - 86, 2.8, 3.6, -0.2, 0, TAU);
      ctx.fill();
      ctx.restore();
      if (T < J.rise) CAST.beggar(ctx, J.beggar.x, GROUND, J.beggar.s, { pose: 'sit', t: T, ...sil(1) });
      else CAST.beggar(ctx, J.beggar.x, GROUND, J.beggar.s, { pose: 'rise', rise: E.inOutSine(U.seg(T, J.rise, J.rise + 0.9)), t: T, ...sil(a) });
    }
    if (T >= J.rise && fade > 0) {
      const rise = E.inOutSine(U.seg(T, J.rise, J.rise + 0.9));
      const mica = U.smoothstep(J.rise, J.rise + 0.6, T) * fade;
      const ret = drawGod(ctx, T, rise, mica);
      // a thin nimbus, and a few motes of mica
      const hd = ret && ret.head ? ret.head : [J.beggar.x, GROUND - 120];
      ctx.save();
      ctx.globalAlpha *= 0.5 * mica;
      ctx.strokeStyle = U.rgba(U.mix(C.kin, C.ginnezu, 0.4), 0.85);
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(hd[0], hd[1] - 2, 19, 0, TAU);
      ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 12; i++) {
        const an = U.hash(i + 5) * TAU, d = U.lerp(8, 52, U.hash(i + 9));
        const tw = Math.pow(Math.max(0, Math.sin(T * 4 + i * 2.3)), 6);
        ctx.fillStyle = `rgba(255,250,236,${0.7 * tw})`;
        ctx.fillRect(J.beggar.x + Math.cos(an) * d * 0.6 - 1, GROUND - 70 + Math.sin(an) * d * 1.5 - 1, 2, 2);
      }
      ctx.restore();
    }
    // the rabbit: hops in with nothing, ears droop, looks out at us, leaps
    if (T >= J.rabbitIn[0] && T < J.into) {
      const R = J.rabbit;
      if (T < J.droop) {
        const u = U.seg(T, J.rabbitIn[0], J.droop);
        const hop = u * 2, ph = hop - Math.floor(hop);
        const x = U.lerp(R.x0, R.x1, E.outSine(u));
        // a paper edge where it passes in front of the fox, as cut-paper puppets overlap
        if (Math.abs(x - J.fox.x1) < 90) {
          for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) CAST.rabbit(ctx, x + ox, GROUND + oy, R.s, { pose: 'hop', phase: ph, facing: -1, t: T, silhouette: C.kinari, noBuffer: true });
        }
        CAST.rabbit(ctx, x, GROUND, R.s, { pose: 'hop', phase: ph, facing: -1, t: T, ...sil(1) });
      } else if (T < J.leap) {
        // droop (95.8, 0.45 s, held); at 96.9–97.1 it turns to face us
        const d = E.inOutSine(U.seg(T, J.droop, J.droop + 0.45)) * (1 - E.inOutSine(U.seg(T, J.gaze - 0.1, J.gaze + 0.1)));
        const turn = U.seg(T, J.gaze - 0.1, J.gaze + 0.1, E.inOutSine);
        if (turn < 1) rabbitSit(ctx, R.x1, GROUND, R.s, d, -1, 0.86 * (1 - turn), T);
        if (turn > 0) rabbitFront(ctx, R.x1, GROUND, R.s * 0.92, 0.86 * turn, T);
      } else {
        // a parabola from its place into the fire, apex 60 px above the flames
        const u = U.seg(T, J.leap, J.into);
        const x = U.lerp(R.x1, J.fire.x + 4, u);
        const flameTop = J.fire.y - 76;
        const apex = flameTop - 60;
        const y0 = GROUND, y1 = J.fire.y - 18;
        const y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * (2 * apex - (y0 + y1) / 2) + u * u * y1;
        const vis = 1 - U.smoothstep(0.88, 1, u);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(U.lerp(-0.25, 0.6, u));
        CAST.rabbit(ctx, 0, 0, R.s, { pose: 'leap', phase: u, facing: -1, t: T, silhouette: INK, alpha: 0.86 * vis });
        ctx.restore();
      }
    }
  }

  /* ------------------------------------------------------------------ */
  /* smoke → maria                                                       */
  /* ------------------------------------------------------------------ */
  /** The 杵's swing (radians, + toward the mortar): ぺったん every 1.6 s from 106.4. */
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
    // the tilt takes it away: the motion fades out to the rest pose by 111
    return a * (1 - E.inOutSine(U.seg(T, 108, 111)));
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
    const bx = f.x + sm.dx * 0.2, by = f.y - 44;
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
    if (T < 103.2) PRINT.with(ctx, 'K', Tj, (c) => drawPlay(c, Tj));
    if (T < 106.3) drawFire(ctx, Tj);
    if (T >= 100 && T < 106.55) drawSmoke(ctx, T);
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
    TSUKI.SHOTS.flatPrint(ctx, 'D', o.haloAlpha === 0 ? ['sky'] : ['sky', 'halo'], T, { state: st });
    ctx.restore();
    if (o.moon !== false) {
      MOON.draw(ctx, M.x, M.y + dy, M.r, T, { halo: 0.25, haloR: 380, maria: 0 });
      SD.face(ctx, T, M.x, M.y + dy, M.r);
      flash(ctx, T, dy);
    }
    if (o.susuki !== false) PRINT.with(ctx, 'K', T, (c) => SD.susuki(c, T, dy, o.susukiAlpha == null ? 1 : o.susukiAlpha));
  };
})(window.TSUKI = window.TSUKI || {});
