/* ==========================================================================
   shot-c.js — MASTER SHOT C: the tsukubai close-up (三 水の月).
   More overhead than three-quarter. A round stone basin (720×520 at
   (960,620)) sits in a bed of grey gravel ringed by moss; a bamboo 筧 comes
   in from the left edge; dark 藍 water holds the moon's reflection — an
   elliptical hole to the paper (rx 70, ry 52 at (1000,600)).

   Plates (PRINT shot 'C', layers back → front):
     ground  P3 flat 松葉 moss with a sparse 点苔 stipple · P1 黄土 dots ·
             P4 the gravel bed — one flat 鼠 with a bokashi edge into the moss —
             the basin's cast shadow and the side stones · K 砂紋: the gravel
             raked in rings round the basin (P7 a hair of light on each
             crest) · K side-stone key lines · K the flat dark-moss foot
     basin   P4 stone · P1 lichen · P3 rim moss · P7 月白 far-rim light · K
     water   P5 藍 · P6 ベロ藍 far-edge bokashi · P8 a few mica points
     spout   P3 bamboo · P1 煤竹 stakes · P7 wet light · K nodes, rope; the
             萩 spray (top right: P3 leaves, P2 flowers, K); ferns in the corners
     veil    K straight bands only (no vignette): a 墨 一文字 at the top, a
             thin 墨 bokashi over the foot (the subtitle band stays calm)

   TSUKI.SHOTS.C
     G                       geometry (basin, opening, water, refl, spout, drop,
                             gravel, persp)
     print(ctx, T, hooks)    print the shot; hooks.water / hooks.spout /
                             hooks.veil (ctx, st) run after those layers (live
                             water goes after 'water', hands after 'spout')
     warm(T, w, h)           build the flattened caches now (scene init)
     waterClip(ctx)          add the visible-water region to ctx's path
     reflection(ctx, T, o)   the reflected moon (o.alpha, o.wobble, o.sx/sy, o.x/y, o.glow)
     rings(ctx, T, list, o)  seigaiha ripple rings: list of
                             {x, y, t0, speed, life, amp, n, gap, r0, w};
                             o.refl → rings read dark across the reflection
     dropTimes(T) / dropRings(T)   the spout's drops — the score's list
                             (TSUKI.CUES.spoutDrops: 72.0 … 81.2, none in the
                             間 82.2–86.0) — and their rings; a drop lands on its plink
     spout(ctx, T)           the bead swelling at the spout's lip + falling drop
                             (falls DROP_FALL s before its plink; after the last
                             drop the next bead swells and hangs through the 間)
     petals(ctx, T, rings)   six floating 萩 petals, nudged by rings
     dew(ctx, T)             dew on the moss twinkling (kira)
   TSUKI.SHOTS.flatPrint(ctx, id, layers, T, opts)
                             print a group of layers from ONE cached composite
                             while PRINT.state is unchanged (every frame of 三/四);
                             any other state falls back to plate-by-plate
   ========================================================================== */
(function (TSUKI) {
  'use strict';

  const U = TSUKI.U, B = TSUKI.B, C = TSUKI.C;
  const PRINT = TSUKI.PRINT, MOON = TSUKI.MOON;
  const TAU = Math.PI * 2;
  TSUKI.SHOTS = TSUKI.SHOTS || {};
  const SC = (TSUKI.SHOTS.C = TSUKI.SHOTS.C || {});


  /* ------------------------------------------------------------------ */
  /* flattened printing: while the print state is unchanged (every frame */
  /* of 三 and 四 is a steady 初摺), a group of layers is blitted from one */
  /* cached composite instead of plate by plate. Any change of state      */
  /* (tears, jolt, wear, unprinting) falls back to the plates.            */
  /* ------------------------------------------------------------------ */
  TSUKI.SHOTS.flatPrint = TSUKI.SHOTS.flatPrint || (() => {
    const cache = new Map();
    const sig = (st) => {
      let s = `${st.wear}|${st.ichimonji}|${st.keyReveal ? 1 : 0}`;
      for (const id of PRINT.IDS) s += `|${st.alpha[id]},${st.off[id][0]},${st.off[id][1]}`;
      return s;
    };
    /** Print `layers` of shot `id` at T into ctx (stage transform), from a cache when possible. */
    const flat = (ctx, id, layers, T, opts = {}) => {
      const st = opts.state || PRINT.state(T);
      const cw = opts.w || ctx.canvas.width, ch = opts.h || ctx.canvas.height;
      const key = `${id}|${layers.join(',')}|${opts.tag || ''}`;
      const sg = sig(st);
      let e = cache.get(key);
      if (!e || e.w !== cw || e.h !== ch || e.sig !== sg) {
        if (e && e.w === cw && e.h === ch && !opts.build) {
          // a different print state (tears, jolt…): print plate by plate
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

  /* ------------------------------------------------------------------ */
  /* geometry                                                            */
  /* ------------------------------------------------------------------ */
  const G = (SC.G = {
    basin: { x: 960, y: 620, rx: 360, ry: 260 },      // top of the stone
    side: 46,                                           // visible height of the stone's near wall
    opening: { x: 960, y: 604, rx: 282, ry: 192 },     // the hollow's lip
    water: { x: 960, y: 620, rx: 280, ry: 190 },       // water surface
    refl: { x: 1000, y: 600, rx: 70, ry: 52 },         // the reflected moon
    spout: { x0: -30, y0: 466, x1: 690, y1: 560, w: 34 },
    drop: { x: 700, y: 580, every: 2.3 },              // where drops land; `every` = one bead's swell
    gravel: { x: 960, y: 650, rx: 610, ry: 405 },
    persp: 190 / 280,                                   // ry/rx of circles lying on the water
  });

  const ell = (c, e, grow = 0, dy = 0) => { c.moveTo(e.x + e.rx + grow, e.y + dy); c.ellipse(e.x, e.y + dy, e.rx + grow, e.ry + grow * (e.ry / e.rx), 0, 0, TAU); };
  const inEll = (x, y, e, grow = 0) => {
    const dx = (x - e.x) / (e.rx + grow), dy = (y - e.y) / (e.ry + grow * (e.ry / e.rx));
    return dx * dx + dy * dy;
  };

  /** Adds the visible water (water ∩ opening) to the current path — use with clip(). */
  SC.waterClip = (c) => {
    c.beginPath();
    ell(c, G.water);
    c.clip();
    c.beginPath();
    ell(c, G.opening, -1);
  };

  /** A wobbly closed blob (for stones, moss cushions). */
  function blob(c, cx, cy, rx, ry, seed, rough = 0.08, n = 28, rot = 0) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const k = 1 + rough * (U.noise1(i * 0.9, seed) * 2 - 1) + rough * 0.5 * (U.noise1(i * 2.7, seed + 3) * 2 - 1);
      const px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k;
      pts.push([cx + px * Math.cos(rot) - py * Math.sin(rot), cy + px * Math.sin(rot) + py * Math.cos(rot)]);
    }
    B.smoothPath(c, pts, true, 0.5);
    return pts;
  }

  /** Closed Catmull-Rom subpath added to the CURRENT path (no beginPath). */
  function subSmooth(c, pts, tension = 0.5) {
    const n = pts.length;
    c.moveTo(pts[0][0], pts[0][1]);
    const k = tension / 3;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
    }
    c.closePath();
  }

  /** Carved key line: a smooth closed/open path stroked with slight width variation. */
  function keyStroke(c, pts, close, w, alpha = 0.88, col = C.sumi) {
    c.save();
    c.strokeStyle = U.rgba(col, alpha);
    c.lineWidth = w;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    B.smoothPath(c, pts, close, 0.5);
    c.stroke();
    c.restore();
  }

  function ellPts(e, a0, a1, n, grow = 0, dy = 0, jit = 0, seed = 1) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const a = U.lerp(a0, a1, i / n);
      const j = jit ? jit * (U.noise1(i * 0.8, seed) * 2 - 1) : 0;
      out.push([e.x + Math.cos(a) * (e.rx + grow + j), e.y + dy + Math.sin(a) * (e.ry + (grow + j) * (e.ry / e.rx))]);
    }
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* carving (runs once, during loading)                                 */
  /* ------------------------------------------------------------------ */
  const MOSS = U.mix(U.mix(C.matsuba, C.sumi, 0.3), C.ai, 0.12);
  const MOSS_DK = U.mix(C.matsuba, C.sumi, 0.62);
  const MOSS_LT = U.mix(C.koke, C.matsuba, 0.45);
  const MOSS_FOOT = U.mix(U.mix(C.matsuba, C.sumi, 0.7), C.ai, 0.1);
  const GRAVEL = U.mix(U.mix(C.nezumi, C.ai, 0.3), C.sumi, 0.42);
  const STONE = U.mix(C.nezumi, C.ai, 0.1);
  const STONE_DK = U.mix(C.nezumi, C.sumi, 0.42);
  const STONE_LT = U.mix(C.nezumi, C.ginnezu, 0.55);
  const WATER = U.mix(C.ai, C.koiai, 0.38);
  const WATER_FAR = U.mix(C.bero, C.koiai, 0.45);
  const SUSUDAKE = U.mix(C.odo, C.sumi, 0.55);

  function carveGround(P) {
    const r = U.rng(3301);
    const gv = G.gravel;
    // the gravel bed (海): a gently irregular ellipse, no key line — it meets
    // the moss in a bokashi
    const gravelPts = [];
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * TAU;
      const k = 1 + 0.035 * (U.noise1(i * 0.3, 71) * 2 - 1) + 0.012 * (U.noise1(i * 1.9, 72) * 2 - 1);
      gravelPts.push([gv.x + Math.cos(a) * gv.rx * k, gv.y + Math.sin(a) * gv.ry * k]);
    }
    const inGravel = (x, y) => inEll(x, y, gv);

    /* ---- P3: flat 松葉 moss everywhere, a sparse 点苔 stipple ------------ */
    const m = P('ground', 'P3');
    m.fillStyle = MOSS;
    m.fillRect(0, 0, 1920, 1080);
    for (let i = 0; i < 7000; i++) {
      const x = r() * 1920, y = r() * 1080;
      if (inGravel(x, y) < 0.9) continue;
      if (x < 520 && y < 520) continue;                 // the haiku's pocket stays flat
      const n = U.fbm2(x / 120, y / 120, 3, 9);
      if (r() > Math.pow(n, 2.4) * 1.6) continue;
      const light = r() < 0.28;
      m.fillStyle = light ? U.rgba(MOSS_LT, U.lerp(0.25, 0.5, r())) : U.rgba(MOSS_DK, U.lerp(0.35, 0.7, r()));
      const sz = U.lerp(1.2, 2.8, r());
      m.beginPath();
      m.ellipse(x, y, sz * 1.4, sz * 0.75, U.lerp(-0.5, 0.5, r()), 0, TAU);
      m.fill();
    }

    /* ---- P4: the gravel — one flat 鼠 ink, its edge cut where the moss begins */
    const g = P('ground', 'P4');
    g.fillStyle = GRAVEL;
    B.smoothPath(g, gravelPts, true, 0.5);
    g.fill();
    // the basin's cast shadow on the gravel (the moon high, a little left)
    g.fillStyle = U.rgba(U.mix(GRAVEL, C.sumi, 0.6), 0.55);
    g.beginPath();
    g.ellipse(G.basin.x + 26, G.basin.y + G.side + 8, G.basin.rx + 8, G.basin.ry * 0.96, 0, 0, TAU);
    g.fill();
    /* ---- P1: 黄土 — earth dots in the moss, lichen on the side stones -- */
    const o = P('ground', 'P1');
    for (let i = 0; i < 420; i++) {
      const x = r() * 1920, y = r() * 1080;
      if (inGravel(x, y) < 1.05) continue;
      if (x < 520 && y < 520) continue;          // the haiku's dark pocket stays plain
      if (y > 945) continue;
      o.fillStyle = U.rgba(U.mix(C.odo, C.sumi, 0.3), U.lerp(0.3, 0.6, r()));
      o.beginPath();
      o.arc(x, y, U.lerp(0.9, 2, r()), 0, TAU);
      o.fill();
    }
    carveStones(P);
  }

  /**
   * The two side stones — 手燭石 (left, under the spout) and 湯桶石 (right) —
   * cut as Hiroshige cuts a rock, not as rounded blobs: a faceted outline
   * (a dozen corners, only a little rounded), a flat top in one grey, one
   * flat lighter plane where the moon falls on it bounded by a carved ridge,
   * a darker flat side, 斧劈皴 — short parallel axe-cut strokes in clusters —
   * and moss and lichen that show through holes cut in the stone block (the
   * way a printer lets an earlier colour through), never under it.
   */
  const STONES = [
    { x: 150, y: 790, rx: 262, ry: 118, rot: -0.1, seed: 11, h: 36, lit: [2.55, 4.55] },
    { x: 1872, y: 610, rx: 200, ry: 112, rot: 0.22, seed: 23, h: 30, lit: [2.7, 4.4] },
  ];
  const stoneXY = (s, a, k) => {
    const px = Math.cos(a) * s.rx * k, py = Math.sin(a) * s.ry * k;
    return [s.x + px * Math.cos(s.rot) - py * Math.sin(s.rot), s.y + px * Math.sin(s.rot) + py * Math.cos(s.rot)];
  };
  /** A natural flat stone: an irregular, faceted outline (angles, radius factors). */
  function stoneOutline(s) {
    const r = U.rng(s.seed * 7 + 1), pts = [];
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = ((i + U.lerp(-0.3, 0.3, r())) / n) * TAU;
      const k = 1 + U.lerp(-0.1, 0.07, r());
      pts.push(stoneXY(s, a, k));
    }
    return pts;
  }
  function carveStones(P) {
    const g = P('ground', 'P4'), m = P('ground', 'P3'), o = P('ground', 'P1'), w = P('ground', 'P7'), k = P('ground', 'K');
    const TOP = U.mix(STONE, C.sumi, 0.34), SIDE = U.mix(STONE_DK, C.sumi, 0.34);
    const path = (c, pts, dy = 0) => { c.beginPath(); subSmooth(c, pts.map((q) => [q[0], q[1] + dy]), 0.22); };
    for (const s of STONES) {
      const r = U.rng(s.seed * 13 + 5);
      const pts = (s.pts = stoneOutline(s));
      // side, then the flat top
      g.fillStyle = SIDE;
      path(g, pts, s.h);
      g.fill();
      for (const q of pts.filter((q) => q[1] > s.y - s.ry * 0.2)) g.fillRect(q[0] - 4, q[1] - 2, 8, s.h + 2);
      g.fillStyle = TOP;
      path(g, pts);
      g.fill();
      // the lit plane: the outline's moon side, closed by a ridge across the stone
      const [a0, a1] = s.lit;
      const ridge = [stoneXY(s, a1, 0.72), stoneXY(s, (a0 + a1) / 2 + 0.2, 0.34), stoneXY(s, a0, 0.78)];
      const lit = new Path2D();
      lit.moveTo(...stoneXY(s, a0, 1.3));
      for (let q = 1; q <= 8; q++) lit.lineTo(...stoneXY(s, U.lerp(a0, a1, q / 8), 1.3));
      for (const q of ridge) lit.lineTo(...q);
      lit.closePath();
      g.save();
      path(g, pts);
      g.clip();
      g.fillStyle = U.rgba(STONE_LT, 0.42);
      g.fill(lit);
      // the plane turned from the moon, one step darker
      const shade = new Path2D();
      shade.moveTo(...stoneXY(s, 0.15, 1.3));
      for (let q = 1; q <= 6; q++) shade.lineTo(...stoneXY(s, U.lerp(0.15, 1.75, q / 6), 1.3));
      shade.lineTo(...stoneXY(s, 1.6, 0.55));
      shade.lineTo(...stoneXY(s, 0.3, 0.6));
      shade.closePath();
      g.fillStyle = U.rgba(C.sumi, 0.16);
      g.fill(shade);
      g.restore();
      // moss cushions on the stone (P3) and lichen (P1), through holes in the stone
      const moss = [];
      for (let i = 0; i < 3; i++) {
        const a = U.lerp(0.3, 2.8, r()) + (i % 2 ? Math.PI : 0), d = U.lerp(0.62, 0.84, r());
        const [x, y] = stoneXY(s, a, d);
        moss.push([x, y, U.lerp(26, 52, r()), U.lerp(12, 22, r()), 900 + i + s.seed]);
      }
      const lichen = [];
      for (let i = 0; i < 160 && lichen.length < 38; i++) {
        const [x, y] = stoneXY(s, r() * TAU, Math.sqrt(r()) * 0.82);
        if (U.fbm2(x / 40, y / 40, 2, s.seed + 5) < 0.52) continue;
        lichen.push([x, y, U.lerp(1.4, 3.2, r())]);
      }
      g.save();
      path(g, pts);
      g.clip();
      g.globalCompositeOperation = 'destination-out';
      for (const [x, y, rx, ry, sd] of moss) { blob(g, x, y, rx * 0.96, ry * 0.94, sd, 0.28); g.fill(); }
      for (const [x, y, rr] of lichen) { g.beginPath(); g.arc(x, y, rr * 0.9, 0, TAU); g.fill(); }
      g.restore();
      m.save();
      path(m, pts);
      m.clip();
      for (const [x, y, rx, ry, sd] of moss) {
        m.fillStyle = U.mix(MOSS_LT, MOSS, 0.45);
        blob(m, x, y, rx, ry, sd, 0.28);
        m.fill();
        for (let j = 0; j < 18; j++) {
          m.fillStyle = U.rgba(MOSS_DK, 0.8);
          m.beginPath();
          m.arc(x + U.lerp(-rx, rx, r()) * 0.8, y + U.lerp(-ry, ry, r()) * 0.7, U.lerp(0.9, 2, r()), 0, TAU);
          m.fill();
        }
      }
      m.restore();
      for (const [x, y, rr] of lichen) {
        o.fillStyle = U.mix(C.odo, C.kuchiba, 0.4);
        o.beginPath();
        o.arc(x, y, rr, 0, TAU);
        o.fill();
      }
      // P7: moonlight along the lit plane's rim (the outline, inside the stone)
      w.save();
      path(w, pts);
      w.clip();
      w.clip(lit);
      w.strokeStyle = U.rgba(C.geppaku, 0.5);
      w.lineWidth = 5;
      w.lineJoin = 'round';
      path(w, pts);
      w.stroke();
      w.restore();
      // K: the key line, the foot of the side, the ridge, and the axe-cut 皴
      k.save();
      k.strokeStyle = U.rgba(C.sumi, 0.88);
      k.lineWidth = 2.5;
      k.lineJoin = 'round';
      path(k, pts);
      k.stroke();
      const bot = pts.filter((q) => q[1] > s.y + s.ry * 0.05).map((q) => [q[0], q[1] + s.h]).sort((a, b) => a[0] - b[0]);
      B.smoothPath(k, bot, false, 0.3);
      k.lineWidth = 2.3;
      k.stroke();
      k.restore();
      B.taper(k, B.qpts(...ridge[0], ...ridge[1], ...ridge[2], 12), 0.4, 1.6, U.rgba(C.sumi, 0.55), 0.6);
      for (let c = 0; c < 4; c++) {
        // a cluster: 3–5 short strokes, parallel, falling from the ridge or an edge
        const [cx, cy] = stoneXY(s, U.lerp(0, TAU, r()), U.lerp(0.35, 0.75, r()));
        const ang = s.rot + U.lerp(0.9, 1.4, r()) * (r() < 0.5 ? 1 : -1) * 0.8 + Math.PI / 2;
        const n = 3 + Math.floor(r() * 3), len = U.lerp(16, 34, r());
        for (let j = 0; j < n; j++) {
          const ox = cx + j * 7 * Math.cos(ang - Math.PI / 2) + U.lerp(-2, 2, r()), oy = cy + j * 7 * Math.sin(ang - Math.PI / 2) * 0.6;
          const L = len * U.lerp(0.6, 1.1, r());
          B.taper(k, [[ox, oy], [ox + Math.cos(ang) * L * 0.5, oy + Math.sin(ang) * L * 0.35], [ox + Math.cos(ang) * L, oy + Math.sin(ang) * L * 0.6]], 2, 0.2, U.rgba(C.sumi, U.lerp(0.35, 0.55, r())), 0.1);
        }
      }
      // chisel strokes down the dark side
      for (const q of pts.filter((q) => q[1] > s.y)) {
        if (r() < 0.35) continue;
        B.taper(k, [[q[0] + 3, q[1] + 6], [q[0] + 4, q[1] + s.h * 0.7]], 1.4, 0.2, U.rgba(C.sumi, 0.45), 0);
      }
    }
  }

  /**
   * 砂紋: the gravel raked into rings round the basin, as a 枯山水 is raked
   * round its stones — carved into the key block as fine grooves (0.8–1.4 px
   * 墨 α .35, 14 px apart) with a hair of moonlight on each crest (P7). The
   * rings wander a little as a rake does, break where the wood broke, part
   * round the side stone in rings of their own, fade out where the gravel
   * thins into the moss, and never enter the subtitle band or the haiku's pocket.
   */
  const RAKE = { gap: 14, first: 26, alpha: 0.35, stone: { x: 150, y: 808, rx: 262, ry: 154 } };
  function carveRaked(P) {
    const k = P('ground', 'K'), w = P('ground', 'P7');
    const gv = G.gravel, st = RAKE.stone;
    const r = U.rng(3377);
    const cx = G.basin.x, cy = G.basin.y + G.side, ratio = G.basin.ry / G.basin.rx;
    const stoneZone = (x, y, grow) => {
      const dx = (x - st.x) / (st.rx + grow), dy = (y - st.y) / (st.ry + grow * 0.6);
      return dx * dx + dy * dy;
    };
    const ZONE = RAKE.first + RAKE.gap * 3 + 6;               // the side stone's own rings
    const ok = (x, y, lim) => y < 944 && !(x < 480 && y < 470) && inEll(x, y, gv) < lim;
    /** stroke one ring as runs of carved groove, its crest light beside it */
    const ring = (pts, keep, seed) => {
      let run = [];
      const flush = () => {
        if (run.length > 2) {
          for (let a = 0; a < run.length - 1; a += 6) {
            const seg = run.slice(a, a + 7);
            if (seg.length < 2) break;
            const wN = U.noise1(seed * 3.1 + a * 0.11, 93);
            if (wN < 0.07) continue;                            // where the wood broke
            k.strokeStyle = U.rgba(C.sumi, RAKE.alpha * U.lerp(0.8, 1.12, U.noise1(a * 0.07 + seed, 94)));
            k.lineWidth = U.lerp(0.8, 1.4, wN);
            k.beginPath();
            seg.forEach((q, j) => (j ? k.lineTo(q[0], q[1]) : k.moveTo(q[0], q[1])));
            k.stroke();
            w.strokeStyle = U.rgba(C.geppaku, 0.13);
            w.lineWidth = 0.9;
            w.beginPath();
            seg.forEach((q, j) => (j ? w.lineTo(q[0], q[1] - 4.5) : w.moveTo(q[0], q[1] - 4.5)));
            w.stroke();
          }
        }
        run = [];
      };
      for (const q of pts) { if (keep(q[0], q[1])) run.push(q); else flush(); }
      flush();
    };
    k.save(); w.save();
    k.lineCap = w.lineCap = 'round';
    k.lineJoin = w.lineJoin = 'round';
    // the basin's rings
    for (let i = 0; i < 20; i++) {
      const rx = G.basin.rx + RAKE.first + i * RAKE.gap, ry = rx * ratio;
      const lim = Math.pow(U.lerp(0.92, 0.985, r()), 2);      // where this ring gives out into the moss
      const n = Math.ceil((TAU * rx) / 4), pts = [];
      for (let j = 0; j <= n; j++) {
        const a = (j / n) * TAU;
        const wob = 1.3 * (U.noise1(a * 7 + i * 0.73, 91) * 2 - 1) + 0.8 * (U.noise1(a * 23 + i, 92) * 2 - 1);
        pts.push([cx + Math.cos(a) * (rx + wob), cy + Math.sin(a) * (ry + wob * ratio)]);
      }
      ring(pts, (x, y) => ok(x, y, lim) && stoneZone(x, y, ZONE) > 1, i + 1);
    }
    // the side stone's rings, where it reaches into the gravel
    for (let i = 0; i < 3; i++) {
      const grow = RAKE.first + i * RAKE.gap;
      const n = 260, pts = [];
      for (let j = 0; j <= n; j++) {
        const a = (j / n) * TAU;
        const wob = 1.1 * (U.noise1(a * 6 + i * 0.9, 95) * 2 - 1);
        pts.push([st.x + Math.cos(a) * (st.rx + grow + wob), st.y + Math.sin(a) * (st.ry + (grow + wob) * 0.6)]);
      }
      ring(pts, (x, y) => ok(x, y, 0.9) && inEll(x, y, G.basin, RAKE.first) > 1, 40 + i);
    }
    // where the moss cushion rises over the gravel it throws a thin shadow
    // onto it: a broken 墨 line just inside the edge
    const gp = [];
    for (let i = 0; i <= 144; i++) {
      const a = (i / 144) * TAU;
      const kk = 1 + 0.035 * (U.noise1(((i / 2) % 72) * 0.3, 71) * 2 - 1) + 0.012 * (U.noise1(((i / 2) % 72) * 1.9, 72) * 2 - 1);
      gp.push([gv.x + Math.cos(a) * gv.rx * kk * 0.992, gv.y + Math.sin(a) * gv.ry * kk * 0.992]);
    }
    ring(gp, (x, y) => y < 944 && !(x < 480 && y < 470) && stoneZone(x, y, 0) > 1, 77);
    k.restore(); w.restore();
  }

  function carveBasin(P) {
    const b = G.basin, o = G.opening;
    const r = U.rng(4401);
    // a natural stone: low-frequency bumps on the outer edge
    const outerPts = [];
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * TAU;
      const j = 20 * (U.noise1(a * 1.3, 44) * 2 - 1) + 4 * (U.noise1(a * 7, 45) * 2 - 1);
      outerPts.push([b.x + Math.cos(a) * (b.rx + j), b.y + Math.sin(a) * (b.ry + j * 0.75)]);
    }
    outerPts.pop();
    const sidePts = outerPts.filter((p, i) => i <= 60).map((p) => [p[0], p[1] + G.side + 4 * U.noise1(p[0] * 0.02, 46)]);

    /* ---- P4: the stone ------------------------------------------------ */
    const s = P('basin', 'P4');
    // near wall (in shadow)
    s.fillStyle = STONE_DK;
    s.beginPath();
    s.moveTo(outerPts[0][0], outerPts[0][1]);
    for (const p of sidePts) s.lineTo(p[0], p[1]);
    s.lineTo(outerPts[60][0], outerPts[60][1]);
    s.closePath();
    s.fill();
    // top surface
    s.fillStyle = STONE;
    B.smoothPath(s, outerPts, true, 0.5);
    s.fill();
    s.save();
    B.smoothPath(s, outerPts, true, 0.5);
    s.clip();
    // ring bokashi: darker toward the outer edge and near the lip, a lit crown between
    s.save();
    s.translate(b.x, b.y);
    s.scale(1, b.ry / b.rx);
    const rg = s.createRadialGradient(0, 0, o.rx, 0, 0, b.rx + 12);
    rg.addColorStop(0, U.rgba(STONE_DK, 0.45));
    rg.addColorStop(0.25, U.rgba(STONE_LT, 0.28));
    rg.addColorStop(0.55, U.rgba(STONE_LT, 0));
    rg.addColorStop(1, U.rgba(STONE_DK, 0.55));
    s.fillStyle = rg;
    s.fillRect(-b.rx - 20, -b.rx - 20, b.rx * 2 + 40, b.rx * 2 + 40);
    s.restore();
    // far side lighter, near side darker (the moon is high)
    const lg = s.createLinearGradient(0, b.y - b.ry, 0, b.y + b.ry);
    lg.addColorStop(0, U.rgba(STONE_LT, 0.4));
    lg.addColorStop(0.4, U.rgba(STONE_LT, 0));
    lg.addColorStop(0.7, U.rgba(STONE_DK, 0));
    lg.addColorStop(1, U.rgba(STONE_DK, 0.35));
    s.fillStyle = lg;
    s.fillRect(b.x - b.rx - 20, b.y - b.ry - 20, b.rx * 2 + 40, b.ry * 2 + 40);
    // mottling
    for (let i = 0; i < 700; i++) {
      const x = b.x + (r() * 2 - 1) * b.rx, y = b.y + (r() * 2 - 1) * b.ry;
      const n = U.fbm2(x / 60, y / 60, 3, 17);
      s.fillStyle = n > 0.54 ? U.rgba(STONE_LT, 0.22) : U.rgba(STONE_DK, 0.18);
      s.beginPath();
      s.ellipse(x, y, U.lerp(5, 22, r()), U.lerp(3, 10, r()), Math.atan2(y - b.y, x - b.x) + Math.PI / 2, 0, TAU);
      s.fill();
    }
    // goma-zuri speckle
    for (let i = 0; i < 2200; i++) {
      const x = b.x + (r() * 2 - 1) * b.rx, y = b.y + (r() * 2 - 1) * b.ry;
      s.fillStyle = r() < 0.5 ? U.rgba(C.sumi, 0.25) : U.rgba(C.ginnezu, 0.4);
      s.fillRect(x, y, 1.4, 1.4);
    }
    s.restore();
    // the hollow: inner wall visible on the far side, in deep shadow
    s.fillStyle = U.mix(STONE_DK, C.sumi, 0.35);
    s.beginPath();
    ell(s, o);
    s.fill();

    /* ---- P1: lichen flecks --------------------------------------------- */
    const l = P('basin', 'P1');
    l.save();
    B.smoothPath(l, outerPts, true, 0.5);
    l.clip();
    for (let i = 0; i < 420; i++) {
      const a = r() * TAU, d = U.lerp(0.8, 1.0, Math.sqrt(r()));
      const x = b.x + Math.cos(a) * b.rx * d, y = b.y + Math.sin(a) * b.ry * d;
      if (U.fbm2(x / 45, y / 45, 3, 23) < 0.5) continue;
      l.fillStyle = U.rgba(U.mix(C.odo, C.kuchiba, r() * 0.6), U.lerp(0.45, 0.85, r()));
      l.beginPath();
      l.ellipse(x, y, U.lerp(1.5, 4.5, r()), U.lerp(1.2, 3, r()), r() * 3, 0, TAU);
      l.fill();
    }
    l.restore();

    /* ---- P3: moss creeping over the rim (left and near side) ---------- */
    const m = P('basin', 'P3');
    m.save();
    B.smoothPath(m, outerPts, true, 0.5);
    m.moveTo(outerPts[0][0], outerPts[0][1]);
    for (const q of sidePts) m.lineTo(q[0], q[1]);
    m.lineTo(outerPts[60][0], outerPts[60][1]);
    m.closePath();
    m.clip();
    const patches = [[Math.PI * 0.72, 0.9, 70], [Math.PI * 0.95, 0.92, 55], [Math.PI * 0.35, 0.95, 60], [Math.PI * 1.12, 0.95, 40], [Math.PI * 0.55, 1.02, 80]];
    patches.forEach(([a, d, sz], i) => {
      const x = b.x + Math.cos(a) * b.rx * d, y = b.y + Math.sin(a) * b.ry * d + (a < Math.PI && a > 0 ? 10 : 0);
      m.fillStyle = U.rgba(MOSS_DK, 0.8);
      blob(m, x + 3, y + 4, sz, sz * 0.5, 700 + i, 0.3);
      m.fill();
      m.fillStyle = U.rgba(MOSS_LT, 0.9);
      blob(m, x, y, sz * 0.85, sz * 0.42, 720 + i, 0.3);
      m.fill();
      for (let j = 0; j < 60; j++) {
        const px = x + (r() * 2 - 1) * sz, py = y + (r() * 2 - 1) * sz * 0.5;
        m.fillStyle = U.rgba(r() < 0.5 ? C.koke : MOSS_DK, 0.7);
        m.beginPath();
        m.arc(px, py, U.lerp(1, 2.4, r()), 0, TAU);
        m.fill();
      }
    });
    m.restore();

    /* ---- P7: 月白 along the far rim; wet sheen at the lip ------------- */
    const w = P('basin', 'P7');
    const far = outerPts.slice(64, 117).map((p) => [p[0] + (b.x - p[0]) * 0.012, p[1] + (b.y - p[1]) * 0.025]);
    B.taper(w, far, 1.5, 1.5, U.rgba(C.geppaku, 0.7), 3.2);
    const lip = ellPts(o, Math.PI * 0.12, Math.PI * 0.88, 30, 3);
    B.taper(w, lip, 0.6, 0.6, U.rgba(C.geppaku, 0.35), 2.4);

    /* ---- K: key lines ------------------------------------------------- */
    const k = P('basin', 'K');
    keyStroke(k, outerPts, true, 2.8, 0.9);
    keyStroke(k, sidePts, false, 2.8, 0.92);
    // 皴: texture strokes following the ring, clustered by noise
    for (let i = 0; i < 150; i++) {
      const a = r() * TAU, d = U.lerp(o.rx / b.rx + 0.06, 0.97, r());
      const x = b.x + Math.cos(a) * b.rx * d, y = b.y + Math.sin(a) * b.ry * d;
      if (U.fbm2(x / 70, y / 70, 2, 51) < 0.47) continue;
      const len = U.lerp(12, 44, r());
      const pts = [];
      for (let q = 0; q <= 4; q++) {
        const aa = a + (q / 4) * (len / (b.rx * d));
        pts.push([b.x + Math.cos(aa) * b.rx * (d + U.lerp(-0.01, 0.01, r())), b.y + Math.sin(aa) * b.ry * d]);
      }
      B.taper(k, pts, U.lerp(0.8, 2, r()), 0.2, U.rgba(C.sumi, U.lerp(0.18, 0.42, r())), 0.3);
    }
    keyStroke(k, ellPts(o, 0, TAU, 80, 0, 0, 1.5, 46), true, 2.4, 0.9);
    // chisel hatching on the near wall
    for (let i = 4; i < 57; i += U.lerp(2.5, 5, r())) {
      const q = Math.round(i);
      const top = outerPts[q], bot = sidePts[q];
      const h = bot[1] - top[1];
      const y0 = top[1] + U.lerp(6, h * 0.45, r()), len = h * U.lerp(0.2, 0.42, r());
      const sl = U.lerp(-5, 5, r());
      B.taper(k, [[top[0], y0], [top[0] + sl * 0.5, y0 + len * 0.5], [top[0] + sl, y0 + len]], 1.3, 0.2, U.rgba(C.sumi, U.lerp(0.3, 0.5, r())), 0.2);
    }
    // a few carved cracks & weathering on the top ring
    for (let i = 0; i < 9; i++) {
      const a = r() * TAU;
      const x = b.x + Math.cos(a) * b.rx * 0.9, y = b.y + Math.sin(a) * b.ry * 0.9;
      const t = a + Math.PI / 2;
      const len = U.lerp(20, 60, r());
      B.taper(k, [[x, y], [x + Math.cos(t) * len * 0.5, y + Math.sin(t) * len * 0.5 * 0.7 + U.lerp(-3, 3, r())], [x + Math.cos(t) * len, y + Math.sin(t) * len * 0.7]], 1.6, 0.2, U.rgba(C.sumi, 0.5), 0.1);
    }
  }


  /** 板目: the faint wood grain a large flat block leaves in its ink (build time only). */
  function woodGrain(c, x, y, w, h, dark, light, alpha, seed) {
    const r = U.rng(seed);
    // a few knots the grain flows around
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


  function carveWater(P) {
    const wv = G.water, o = G.opening;
    /* ---- P5: 藍 ----------------------------------------------------------- */
    const a = P('water', 'P5');
    a.save();
    SC.waterClip(a);
    a.clip();
    a.fillStyle = WATER;
    a.fillRect(wv.x - wv.rx - 4, wv.y - wv.ry - 30, wv.rx * 2 + 8, wv.ry * 2 + 40);
    woodGrain(a, wv.x - wv.rx - 10, wv.y - wv.ry - 30, wv.rx * 2 + 20, wv.ry * 2 + 40, C.koiai, C.hanada, 0.1, 555);
    a.restore();
    /* ---- P6: ベロ藍 bokashi toward the far edge + the far rim's reflection */
    const s = P('water', 'P6');
    s.save();
    SC.waterClip(s);
    s.clip();
    const g = s.createLinearGradient(0, wv.y - wv.ry, 0, wv.y + wv.ry * 0.4);
    g.addColorStop(0, U.rgba(WATER_FAR, 1));
    g.addColorStop(0.35, U.rgba(WATER_FAR, 0.7));
    g.addColorStop(1, U.rgba(WATER_FAR, 0));
    s.fillStyle = g;
    s.fillRect(wv.x - wv.rx - 4, wv.y - wv.ry - 30, wv.rx * 2 + 8, wv.ry * 2 + 40);
    // the stone's inner wall mirrored just under the far lip: a dark rim band
    s.fillStyle = U.rgba(U.mix(C.koiai, C.sumi, 0.5), 0.75);
    s.beginPath();
    ell(s, o, 0, 10);
    s.moveTo(o.x + o.rx, o.y + 28);
    s.ellipse(o.x, o.y + 28, o.rx + 6, o.ry + 4, 0, 0, TAU, true);
    s.fill('evenodd');
    s.restore();
    /* ---- P8: a few mica points on the water ----------------------------- */
    const k8 = P('water', 'P8');
    k8.save();
    SC.waterClip(k8);
    k8.clip();
    const r = U.rng(5501);
    for (let i = 0; i < 40; i++) {
      const x = wv.x + (r() * 2 - 1) * wv.rx, y = wv.y + (r() * 2 - 1) * wv.ry;
      k8.fillStyle = `rgba(255,252,240,${U.lerp(0.05, 0.16, r())})`;
      k8.beginPath();
      k8.ellipse(x, y, U.lerp(2, 7, r()), U.lerp(0.6, 1.2, r()), 0, 0, TAU);
      k8.fill();
    }
    k8.restore();
  }

  function spoutGeom() {
    const s = G.spout;
    const dx = s.x1 - s.x0, dy = s.y1 - s.y0, L = Math.hypot(dx, dy);
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    return { ...s, L, ux, uy, nx, ny, a: Math.atan2(dy, dx) };
  }

  function carveSpout(P) {
    const s = spoutGeom();
    const hw = s.w / 2;
    const r = U.rng(6601);
    const at = (d, off) => [s.x0 + s.ux * d + s.nx * off, s.y0 + s.uy * d + s.ny * off];
    // the support: two crossed 煤竹 stakes under the pipe at d ≈ 300
    const p1 = P('spout', 'P1');
    const k = P('spout', 'K');
    const sd = 300;
    const c0 = at(sd, 0);
    const stakes = [
      [[c0[0] - 34, c0[1] - 36], [c0[0] + 26, c0[1] + 64]],
      [[c0[0] + 34, c0[1] - 34], [c0[0] - 22, c0[1] + 66]],
    ];
    for (const [a, b] of stakes) {
      B.taper(p1, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b], 13, 11, SUSUDAKE, 0);
      B.taper(k, [a, b], 1.6, 1.6, U.rgba(C.sumi, 0), 0);
      // outline both edges
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L * 6.5, ny = dx / L * 6.5;
      keyStroke(k, [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny]], false, 1.8, 0.85);
      keyStroke(k, [[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny]], false, 1.8, 0.85);
      keyStroke(k, [[b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny]], false, 1.8, 0.85);
      // cut tops show the hollow
      k.fillStyle = U.rgba(C.sumi, 0.85);
      k.beginPath();
      k.ellipse(a[0], a[1], 6.5, 3.5, Math.atan2(dy, dx) + Math.PI / 2, 0, TAU);
      k.fill();
    }
    // the pipe
    const p3 = P('spout', 'P3');
    const body = [at(0, -hw), at(s.L, -hw), at(s.L, hw), at(0, hw)];
    B.poly(p3, body);
    const gg = p3.createLinearGradient(...at(0, -hw), ...at(0, hw));
    gg.addColorStop(0, U.mix(C.aotake, C.matsuba, 0.35));
    gg.addColorStop(0.28, C.matsuba);
    gg.addColorStop(1, U.mix(C.matsuba, C.sumi, 0.35));
    p3.fillStyle = gg;
    p3.fill();
    // a lit stripe along the top (尾花)
    B.taper(p3, [at(0, -hw * 0.55), at(s.L * 0.5, -hw * 0.58), at(s.L - 8, -hw * 0.55)], 4, 3, U.rgba(C.susuki, 0.55), 0.3);
    // bamboo grain
    for (let i = 0; i < 26; i++) {
      const off = U.lerp(-hw * 0.8, hw * 0.8, r());
      const d0 = r() * s.L * 0.9, len = U.lerp(60, 200, r());
      B.taper(p3, [at(d0, off), at(Math.min(s.L - 6, d0 + len), off)], 0.8, 0.8, U.rgba(C.sumi, 0.14), 0);
    }
    // the rope binding over the stakes (棕櫚縄, 墨)
    for (let i = -2; i <= 2; i++) {
      const d = sd + i * 6;
      keyStroke(k, [at(d - 3, -hw - 2), at(d + 3, hw + 2)], false, 3.2, 0.9);
    }
    // nodes (節): a raised double line every ~150 px
    const nodes = [130, 480];
    for (const d of nodes) {
      keyStroke(k, [at(d, -hw), at(d + 2, 0), at(d, hw)], false, 2.6, 0.9);
      keyStroke(k, [at(d + 7, -hw + 2), at(d + 9, 0), at(d + 7, hw - 2)], false, 1.2, 0.6);
      B.taper(P('spout', 'P7'), [at(d + 3, -hw + 3), at(d + 4, -hw * 0.3)], 2, 1, U.rgba(C.geppaku, 0.6), 0);
    }
    // outlines
    keyStroke(k, [at(0, -hw), at(s.L, -hw)], false, 2.6, 0.9);
    keyStroke(k, [at(0, hw), at(s.L, hw)], false, 2.8, 0.92);
    // the cut end: an oblique ellipse showing the hollow, and a wet lip
    const tip = at(s.L, 0);
    k.save();
    k.translate(tip[0], tip[1]);
    k.rotate(s.a);
    k.fillStyle = U.mix(C.sumi, C.matsuba, 0.25);
    k.beginPath();
    k.ellipse(0, 0, 9, hw, 0, 0, TAU);
    k.fill();
    k.strokeStyle = U.rgba(C.sumi, 0.95);
    k.lineWidth = 2.4;
    k.beginPath();
    k.ellipse(0, 0, 11, hw, 0, 0, TAU);
    k.stroke();
    k.restore();
    const w7 = P('spout', 'P7');
    w7.save();
    w7.translate(tip[0], tip[1]);
    w7.rotate(s.a);
    w7.strokeStyle = U.rgba(C.geppaku, 0.6);
    w7.lineWidth = 1.5;
    w7.beginPath();
    w7.ellipse(0, 0, 8, hw - 4, 0, Math.PI * 0.55, Math.PI * 1.25);
    w7.stroke();
    w7.restore();
  }

  /**
   * 萩: a spray drooping in from the top-right corner, seen from above —
   * arching stems, trifoliate leaves, small magenta pea-flowers toward the tips.
   */
  function carveHagi(P) {
    const r = U.rng(7701);
    const k = P('spout', 'K'), g = P('spout', 'P3'), f = P('spout', 'P2'), w = P('spout', 'P7');
    const stems = [
      [[1990, 40], [1830, 60], [1700, 120], [1600, 200], [1530, 300], [1500, 390]],
      [[1990, 150], [1880, 170], [1780, 230], [1720, 320], [1700, 410]],
      [[1960, -20], [1860, -5], [1740, 20], [1640, 70], [1560, 120], [1470, 150], [1400, 190]],
      [[1990, 280], [1920, 300], [1870, 350], [1850, 430]],
    ];
    const leafCol = U.mix(C.matsuba, C.wakatake, 0.3), leafLt = U.mix(C.wakatake, C.koke, 0.35);
    const stemCol = U.mix(C.odo, C.sumi, 0.62);
    const leaf = (x, y, a, len) => {
      const wdt = len * 0.52;
      g.save();
      g.translate(x, y);
      g.rotate(a);
      g.beginPath();
      g.moveTo(0, 0);
      g.bezierCurveTo(len * 0.25, -wdt * 0.62, len * 0.8, -wdt * 0.55, len, 0);
      g.bezierCurveTo(len * 0.8, wdt * 0.55, len * 0.25, wdt * 0.62, 0, 0);
      g.fillStyle = r() < 0.3 ? leafLt : leafCol;
      g.fill();
      g.restore();
      k.save();
      k.translate(x, y);
      k.rotate(a);
      k.strokeStyle = U.rgba(C.sumi, 0.8);
      k.lineWidth = 1.2;
      k.beginPath();
      k.moveTo(0, 0);
      k.bezierCurveTo(len * 0.25, -wdt * 0.62, len * 0.8, -wdt * 0.55, len, 0);
      k.bezierCurveTo(len * 0.8, wdt * 0.55, len * 0.25, wdt * 0.62, 0, 0);
      k.stroke();
      k.globalAlpha = 0.5;
      k.lineWidth = 0.8;
      k.beginPath();
      k.moveTo(len * 0.08, 0);
      k.lineTo(len * 0.85, 0);
      k.stroke();
      k.restore();
    };
    const flower = (x, y, a, sz) => {
      f.save();
      f.translate(x, y);
      f.rotate(a);
      f.fillStyle = r() < 0.5 ? C.hagi : U.mix(C.hagi, C.beni, 0.25);
      f.beginPath();
      f.ellipse(0, 0, sz, sz * 0.62, 0, 0, TAU);
      f.fill();
      f.fillStyle = U.mix(C.hagi, C.gofun, 0.45);
      f.beginPath();
      f.ellipse(-sz * 0.3, 0, sz * 0.45, sz * 0.35, 0, 0, TAU);
      f.fill();
      f.restore();
    };
    stems.forEach((st, si) => {
      const pts = [];
      for (let i = 0; i < st.length - 1; i++) {
        const q = B.qpts(st[i][0], st[i][1], (st[i][0] + st[i + 1][0]) / 2 + 6, (st[i][1] + st[i + 1][1]) / 2 - 4, st[i + 1][0], st[i + 1][1], 8);
        if (i) q.shift();
        pts.push(...q);
      }
      B.taper(k, pts, 3.4, 1.2, U.rgba(C.sumi, 0.9), 0);
      B.taper(g, pts, 2.2, 0.8, stemCol, 0);
      // leaves: trifoliate clusters on short petioles, alternating sides
      for (let i = 4; i < pts.length - 1; i += 3) {
        const p0 = pts[i], p1 = pts[Math.min(pts.length - 1, i + 1)];
        const ta = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
        const side = (i / 3) % 2 < 1 ? 1 : -1;
        const pa = ta + side * U.lerp(0.7, 1.1, r());
        const pl = U.lerp(10, 16, r());
        const bx = p0[0] + Math.cos(pa) * pl, by = p0[1] + Math.sin(pa) * pl;
        B.taper(k, [p0, [bx, by]], 1.3, 0.8, U.rgba(C.sumi, 0.8), 0);
        const u = i / pts.length;
        const L = U.lerp(26, 15, u) * U.lerp(0.85, 1.15, r());
        leaf(bx, by, pa, L);
        leaf(bx, by, pa - 0.75, L * 0.78);
        leaf(bx, by, pa + 0.75, L * 0.78);
        // flowers in the axil, more toward the tip
        if (u > 0.35 || r() < 0.25) {
          const n = Math.round(U.lerp(2, 5, u));
          for (let j = 0; j < n; j++) {
            const fa = ta - side * U.lerp(0.4, 1.2, r());
            const fd = U.lerp(4, 14, r());
            flower(p0[0] + Math.cos(fa) * fd, p0[1] + Math.sin(fa) * fd, fa, U.lerp(3.2, 4.8, r()));
          }
        }
      }
      // a raceme at the tip
      const tip = pts[pts.length - 1], pre = pts[pts.length - 3];
      const ta = Math.atan2(tip[1] - pre[1], tip[0] - pre[0]);
      for (let j = 0; j < 7; j++) {
        const d = j * 5;
        flower(tip[0] + Math.cos(ta) * d + U.lerp(-3, 3, r()), tip[1] + Math.sin(ta) * d + U.lerp(-3, 3, r()), ta + U.lerp(-0.8, 0.8, r()), U.lerp(2.6, 4, r()) * (1 - j * 0.06));
      }
      void si;
    });
    void w;
  }

  /** シダ: fern clumps reaching in from the bottom corners, seen from above. */
  function carveFerns(P) {
    const g = P('spout', 'P3'), k = P('spout', 'K');
    const r = U.rng(8801);
    const lt = U.mix(C.wakatake, C.koke, 0.3), dk = U.mix(C.matsuba, C.wakatake, 0.3);
    const clumps = [
      { x: 40, y: 1150, a0: -1.45, a1: -0.25, n: 7, L: [240, 380] },
      { x: 1890, y: 1140, a0: -2.95, a1: -1.7, n: 7, L: [230, 360] },
      { x: -30, y: 640, a0: -0.7, a1: 0.35, n: 4, L: [150, 230] },
    ];
    for (const cl of clumps) {
      for (let f = 0; f < cl.n; f++) {
        const a = U.lerp(cl.a0, cl.a1, (f + r() * 0.6) / cl.n);
        const L = U.lerp(cl.L[0], cl.L[1], r());
        const bend = U.lerp(-0.5, 0.5, r());
        const pts = [];
        for (let i = 0; i <= 24; i++) {
          const q = i / 24;
          const aa = a + bend * q * q;
          const d = L * q;
          pts.push([cl.x + Math.cos(a) * d * 0.5 + Math.cos(aa) * d * 0.5, cl.y + Math.sin(a) * d * 0.5 + Math.sin(aa) * d * 0.5]);
        }
        // pinnae, alternating, shrinking to the tip
        for (let i = 3; i < 24; i++) {
          const q = i / 24;
          const p0 = pts[i], p1 = pts[i + 1] || pts[i];
          const ta = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
          for (const sd of [-1, 1]) {
            const len = L * 0.2 * Math.sin(Math.PI * Math.min(1, q * 1.15)) * (1 - q * 0.55);
            if (len < 4) continue;
            const pa = ta + sd * (1.15 - q * 0.35);
            const w = len * 0.32;
            const path = new Path2D();
            const cx = p0[0] + Math.cos(pa) * len, cy = p0[1] + Math.sin(pa) * len;
            const nx = -Math.sin(pa) * w, ny = Math.cos(pa) * w;
            path.moveTo(p0[0], p0[1]);
            path.quadraticCurveTo((p0[0] + cx) / 2 + nx, (p0[1] + cy) / 2 + ny, cx, cy);
            path.quadraticCurveTo((p0[0] + cx) / 2 - nx * 0.6, (p0[1] + cy) / 2 - ny * 0.6, p0[0], p0[1]);
            g.fillStyle = (i + (sd > 0 ? 1 : 0)) % 3 ? lt : dk;
            g.fill(path);
            k.strokeStyle = U.rgba(C.sumi, 0.7);
            k.lineWidth = 1.1;
            k.stroke(path);
          }
        }
        B.taper(k, pts, 3, 0.8, U.rgba(C.sumi, 0.9), 0);
      }
    }
  }

  /**
   * No airbrushed vignette: the night is printed as straight bands, as a
   * printer wipes them across the block. At the top an 一文字 of 墨 (flat,
   * then one bokashi) over the moss — the haiku writes in its dark; at the
   * foot a flat band of dark moss (the ground layer, under the basin and the
   * child's arms) with a thin 墨 bokashi over it that lets the sleeves sink,
   * so the subtitle band is calm.
   */
  function carveVeil(P) {
    // the foot: dark moss, flat from y 930, one short bokashi above it (ground layer, K)
    const f = P('ground', 'K');
    const fg = f.createLinearGradient(0, 872, 0, 940);
    fg.addColorStop(0, U.rgba(MOSS_FOOT, 0));
    fg.addColorStop(0.55, U.rgba(MOSS_FOOT, 0.62));
    fg.addColorStop(1, U.rgba(MOSS_FOOT, 0.9));
    f.fillStyle = fg;
    f.fillRect(0, 872, 1920, 68);
    f.fillStyle = U.rgba(MOSS_FOOT, 0.9);
    f.fillRect(0, 940, 1920, 140);
    // the 一文字 (veil layer, K: over everything)
    const k = P('veil', 'K');
    B.ichimonji(k, C.sumi, 36, 250, 0.62);
    // and the foot's 墨 bokashi, over the arms
    const g3 = k.createLinearGradient(0, 900, 0, 1080);
    g3.addColorStop(0, U.rgba(C.sumi, 0));
    g3.addColorStop(0.45, U.rgba(C.sumi, 0.28));
    g3.addColorStop(1, U.rgba(C.sumi, 0.42));
    k.fillStyle = g3;
    k.fillRect(0, 900, 1920, 180);
  }

  PRINT.defineShot('C', {
    layers: ['ground', 'basin', 'water', 'spout', 'veil'],
    worn: false,
    build(P) {
      carveGround(P);
      carveRaked(P);
      carveBasin(P);
      carveWater(P);
      carveSpout(P);
      carveHagi(P);
      carveFerns(P);
      carveVeil(P);
    },
  });

  /* ------------------------------------------------------------------ */
  /* printing                                                            */
  /* ------------------------------------------------------------------ */
  SC.LAYERS = ['ground', 'basin', 'water', 'spout', 'veil'];
  /** Print every layer at T; hooks[layer](ctx, st) runs after that layer. */
  const GROUPS = [['ground', 'basin', 'water'], ['spout'], ['veil']];
  SC.print = (ctx, T, hooks = {}) => {
    const st = PRINT.state(T);
    for (const grp of GROUPS) {
      TSUKI.SHOTS.flatPrint(ctx, 'C', grp, T, { state: st });
      const l = grp[grp.length - 1];
      if (hooks[l]) {
        ctx.save();
        hooks[l](ctx, st);
        ctx.restore();
      }
    }
  };
  /** Build the flattened caches now (call from a scene's init with the stage size). */
  SC.warm = (T, w, h) => { for (const grp of GROUPS) TSUKI.SHOTS.flatPrint(null, 'C', grp, T, { w, h, build: true }); };

  /* ------------------------------------------------------------------ */
  /* live water                                                          */
  /* ------------------------------------------------------------------ */
  /**
   * Drops from the spout: the score's list (one plink each), no extrapolation —
   * the spout stops for the 間 (82.2–86.0) and holds a bead instead.
   */
  const DROPS = () => (TSUKI.CUES && TSUKI.CUES.spoutDrops) || [72.0, 74.3, 76.6, 78.9, 81.2];
  const DROP_FALL = 0.18;                                // lip → water; the drop lands ON its plink
  /** The last two drops that have landed by T (their rings may still be spreading). */
  SC.dropTimes = (T) => {
    const L = DROPS(), out = [];
    for (let i = 0; i < L.length && L[i] <= T; i++) out.push(L[i]);
    return out.slice(-2);
  };
  SC.dropRings = (T) => SC.dropTimes(T).map((t0) => ({ x: G.drop.x, y: G.drop.y, t0, speed: 60, life: 2.0, amp: 0.4, n: 3, gap: 7 }));

  /**
   * Seigaiha rings: concentric 月白 arcs in perspective, clipped to the water;
   * where a ring crosses the moon's reflection it reads dark (藍), as in
   * Hiroshige's broken moon roads.
   */
  SC.rings = (ctx, T, list, opts = {}) => {
    const live = list.filter((R) => T >= R.t0 && T < R.t0 + R.life);
    if (!live.length) return;
    const persp = G.persp;
    const refl = opts.refl;
    const draw = (col, alphaK) => {
      for (const R of live) {
        const age = T - R.t0;
        const u = age / R.life;
        const rad = (R.r0 || 0) + R.speed * age * (1 - 0.25 * u);
        const fade = (1 - u) * (1 - u) * Math.min(1, age / 0.08);
        for (let j = 0; j < (R.n || 3); j++) {
          const rr = rad - j * (R.gap || 7);
          if (rr <= 1) continue;
          ctx.strokeStyle = U.rgba(col, R.amp * fade * alphaK * (1 - j * 0.22));
          ctx.lineWidth = (j === 0 ? 2.2 : 1.5) * (R.w || 1);
          ctx.beginPath();
          ctx.ellipse(R.x, R.y, rr, rr * persp, 0, 0, TAU);
          ctx.stroke();
        }
      }
    };
    ctx.save();
    SC.waterClip(ctx);
    ctx.clip();
    draw(C.geppaku, 1);
    if (refl) {
      ctx.beginPath();
      ctx.ellipse(refl.x, refl.y, refl.rx, refl.ry, 0, 0, TAU);
      ctx.clip();
      draw(U.mix(C.ai, C.koiai, 0.3), 1.9);
    }
    ctx.restore();
  };

  /**
   * The moon in the water: MOON.draw squashed into an ellipse (a hole to the
   * paper), a faint 月白 sheen on the water around it, and a kira glint.
   * o: alpha, wobble (0..1 ripple energy), sx/sy scale, x/y override,
   *    glow (0..1, default 1: the sheen round it and the kira glint)
   */
  SC.reflection = (ctx, T, o = {}) => {
    const R = G.refl;
    const a = o.alpha == null ? 1 : o.alpha;
    if (a <= 0.001) return;
    const wob = o.wobble || 0;
    const glow = o.glow == null ? 1 : o.glow;
    const x = (o.x == null ? R.x : o.x) + wob * 3 * Math.sin(T * 9.1);
    const y = o.y == null ? R.y : o.y;
    const sx = (o.sx || 1) * (1 + wob * 0.06 * Math.sin(T * 7.3));
    const sy = (o.sy || 1) * (1 - wob * 0.05 * Math.sin(T * 6.1 + 1));
    ctx.save();
    SC.waterClip(ctx);
    ctx.clip();
    // sheen on the water (the one allowed glow)
    if (glow > 0.003) {
    ctx.save();
    ctx.globalAlpha *= a * glow;
    ctx.translate(x, y);
    ctx.scale(1, R.ry / R.rx);
    const g = ctx.createRadialGradient(0, 0, R.rx * 0.9, 0, 0, R.rx * 2.6);
    g.addColorStop(0, U.rgba(C.geppaku, 0.16));
    g.addColorStop(0.5, U.rgba(C.geppaku, 0.05));
    g.addColorStop(1, U.rgba(C.geppaku, 0));
    ctx.fillStyle = g;
    ctx.fillRect(-R.rx * 2.7, -R.rx * 2.7, R.rx * 5.4, R.rx * 5.4);
    ctx.restore();
    }
    // the disc
    ctx.translate(x, y);
    ctx.scale(sx, sy * (R.ry / R.rx));
    MOON.draw(ctx, 0, 0, R.rx, T, { alpha: a, fringe: false, halo: 0 });
    // a kira glint at the upper left
    const gl = 0.5 + 0.5 * Math.sin(T * 1.7);
    ctx.globalCompositeOperation = 'lighter';
    const kg = ctx.createRadialGradient(-R.rx * 0.38, -R.rx * 0.42, 0, -R.rx * 0.38, -R.rx * 0.42, R.rx * 0.5);
    kg.addColorStop(0, `rgba(255,252,238,${0.22 * a * glow * (0.6 + 0.4 * gl)})`);
    kg.addColorStop(1, 'rgba(255,252,238,0)');
    ctx.fillStyle = kg;
    ctx.fillRect(-R.rx, -R.rx, R.rx * 2, R.rx * 2);
    ctx.restore();
  };

  /**
   * The bead swelling at the spout's lip, and the falling drop: each of the
   * score's drops lets go DROP_FALL s before its plink and touches the water
   * on it (the same frame its ring starts). After the last drop (81.2) the
   * next bead swells and hangs at the lip through the 間.
   */
  SC.spout = (ctx, T, opts = {}) => {
    const d = G.drop;
    const s = spoutGeom();
    const lip = [s.x1 + s.nx * (s.w * 0.36), s.y1 + s.ny * (s.w * 0.36)];
    const L = DROPS();
    let i = 0;
    while (i < L.length && L[i] < T) i++;                 // L[i]: the next drop to land (≥ T)
    const prev = i > 0 ? L[i - 1] : null, next = i < L.length ? L[i] : null;
    let grow, fall = -1;
    if (next != null && T >= next - DROP_FALL) {
      fall = (T - (next - DROP_FALL)) / DROP_FALL;       // falling: 0 at the lip … 1 on the water
      grow = 0;
    } else {
      // a fresh bead forms 0.2 s after the last one let go and swells until it
      // lets go in turn; after the last drop it swells once more and hangs
      const from = prev == null ? 66.0 : prev + 0.2 - DROP_FALL;
      const to = next != null ? next - DROP_FALL : prev + d.every - DROP_FALL;
      grow = U.seg(T, from, to, U.ease.inSine);
    }
    const a = opts.alpha == null ? 1 : opts.alpha;
    ctx.save();
    ctx.globalAlpha *= a;
    if (grow > 0.02) {
      const br = 1.2 + 3 * grow;
      ctx.fillStyle = U.rgba(C.gofun, 0.95);
      ctx.beginPath();
      ctx.ellipse(lip[0], lip[1] + br * 0.4, br * 0.9, br * (1 + 0.25 * grow), 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = U.rgba(C.ai, 0.5);
      ctx.beginPath();
      ctx.ellipse(lip[0] + br * 0.2, lip[1] + br * 0.7, br * 0.45, br * 0.4, 0, 0, TAU);
      ctx.fill();
    }
    if (fall >= 0) {
      const y = U.lerp(lip[1], d.y, U.ease.inQuad(fall));
      const x = U.lerp(lip[0], d.x, fall);
      ctx.fillStyle = U.rgba(C.gofun, 0.95);
      ctx.beginPath();
      ctx.ellipse(x, y, 3, 3 + 4 * Math.sin(fall * Math.PI), 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  };

  /** Dew on the moss catching the moon: slow, sparse twinkles (kira). */
  const DEW = (() => {
    const r = U.rng(9901), out = [];
    while (out.length < 26) {
      const x = r() * 1920, y = r() * 1080;
      if (x < 520 && y < 520) continue;                         // the haiku's pocket stays plain
      if (inEll(x, y, G.gravel) < 1.08) continue;
      out.push([x, y, r() * 9, U.lerp(0.25, 0.6, r())]);
    }
    return out;
  })();
  SC.dew = (ctx, T) => {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, ph, sp] of DEW) {
      const k = Math.pow(Math.max(0, Math.sin(T * sp + ph)), 10);
      if (k < 0.03) continue;
      ctx.fillStyle = `rgba(255,250,236,${0.6 * k})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.3 + 0.7 * k, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  };

  /** Six 萩 petals floating on the water, drifting, nudged outward by rings. */
  const PETALS = [[1150, 520, 0.4], [1190, 700, 2.1], [860, 470, 1.2], [780, 690, -0.6], [1085, 760, 0.9], [905, 560, 2.8]];
  SC.petals = (ctx, T, rings = []) => {
    ctx.save();
    SC.waterClip(ctx);
    ctx.clip();
    PETALS.forEach(([px, py, rot], i) => {
      let x = px + 14 * U.wobble(T * 0.05 + i * 3.1, 61) + (T - 66) * 0.6 * (i % 2 ? 1 : -0.7);
      let y = py + 8 * U.wobble(T * 0.06 + i * 1.7, 62);
      for (const R of rings) {
        const age = T - R.t0;
        if (age < 0 || age > R.life) continue;
        const rad = (R.r0 || 0) + R.speed * age;
        const dx = x - R.x, dy = (y - R.y) / G.persp, d = Math.hypot(dx, dy) || 1;
        const k = Math.exp(-Math.pow((d - rad) / 18, 2)) * R.amp * 18 * (1 - age / R.life);
        x += (dx / d) * k;
        y += (dy / d) * k * G.persp;
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot + 0.2 * U.wobble(T * 0.1 + i, 63));
      ctx.fillStyle = U.mix(C.hagi, C.toki, (i % 3) * 0.15);
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 3.4, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  };
})(window.TSUKI = window.TSUKI || {});
