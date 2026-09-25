/* ==========================================================================
   03-kage-e-taketori.js — 二 影絵・竹取 (T 40–66, Shot B, 初摺)

   Inside, the andon out: four moon-white shoji are the screen, the rising
   moon is the lantern. The Tale of the Bamboo Cutter plays right → left as
   藍鼠 shadow-play: panel 4 the grove and the shining culm, panel 3 the
   growth (one continuous morph, a hole of light in a dark oval), panel 2 the
   passage in たけ's hand-shadow, panel 1 Kaguya on a cut-out engawa raising
   her sleeve under the real glow. Then たけ's paper moon eclipses the glow:
   a black disc ringed with light, and the camera pushes into the ring
   (64–66) to match-cut to the tsukubai's rim.

   Shadows: two union buffers printed 藍鼠 multiply through P4 — 'soft'
   (たけ's body and arm, far from the paper, lighter, 6–10 px penumbra) then
   'shadow' (puppets held against the paper, sharp). Overlaps never
   compound within a buffer; puppets over her body read darker.
   Stand-ins drawn here (not in CAST): the hand-shadow that carries Kaguya,
   the offerings still-life, 小夜's heko-obi bow; the bamboo-cutter puppet
   is CAST's with its hatchet removed (the tale has no axe).
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const { U, B, C, CAST, PRINT, MOON } = TSUKI;
  const SB = TSUKI.SHOTS.B;
  const G = SB.GEOM;
  const E = U.ease;
  const AINEZU = SB.INK.AINEZU;

  /* ------------------------------------------------------------------ */
  /* the beats (absolute film time)                                      */
  /* ------------------------------------------------------------------ */
  const BAMBOO = { x: 1372, base: 950, s: 1.0 };
  const OKINA = { x0: 1660, x1: 1478, y: 949, s: 1.5 };
  const KAG_CHILD_S = 0.62;
  const ENGAWA = { x: 474, y: 953, s: 1.1 };           // Kaguya's cut-out engawa, panel 1
  // the oval card's woman must land exactly on the engawa card's woman
  const KAG_END_S = 0.92 * ENGAWA.s;                   // puppet scale (woman 190·s px)
  const KAG_END = [ENGAWA.x + 6 * ENGAWA.s, ENGAWA.y - 12 * ENGAWA.s];
  const TAKE = { x: 1552, y: 968, s: 1.95 };            // たけ's body shadow (anchor = knees on the floor)

  /** where the oval card (her feet) is, its scale and growth, at T */
  function kaguyaCarry(T, node) {
    // 48–50 inside the split node; 50–50.5 lifted out; 50.5–54.5 morph into panel 3; 54.5–56.4 across panel 2
    const inNode = [node[0] - 1, node[1] + 13 * KAG_CHILD_S];
    const lifted = [node[0] - 24, node[1] - 40];
    const p3 = [1128, 912];
    let pos, s, grow;
    if (T < 50) { pos = inNode; s = KAG_CHILD_S; grow = 0; }
    else if (T < 50.5) { const u = E.inOutSine(U.seg(T, 50, 50.5)); pos = [U.lerp(inNode[0], lifted[0], u), U.lerp(inNode[1], lifted[1], u)]; s = KAG_CHILD_S; grow = 0; }
    else if (T < 54.5) {
      const u = U.seg(T, 50.5, 54.5);
      const m = E.inOutSine(u);
      // an arc: up and over into panel 3, settling on the bottom rail as she grows
      pos = [U.lerp(lifted[0], p3[0], m), U.lerp(lifted[1], p3[1], m) - Math.sin(Math.PI * m) * 90];
      s = U.lerp(KAG_CHILD_S, KAG_END_S, E.inOutSine(u));
      grow = E.inOutSine(u);
    } else {
      const u = E.inOutSine(U.seg(T, 54.5, 56.4));
      pos = [U.lerp(p3[0], KAG_END[0], u), U.lerp(p3[1], KAG_END[1], u) - Math.sin(Math.PI * u) * 22];
      s = KAG_END_S; grow = 1;
    }
    return { pos, s, grow };
  }

  /** the paper moon: centre, and how far it has come (0..1) */
  function paperMoon(T) {
    const gl = SB.glow(T);
    const u = E.outCubic(U.seg(T, 60, 63));
    const start = [1548, 548];
    return { x: U.lerp(start[0], gl.x, u), y: U.lerp(start[1], gl.y, u), r: 150, u, on: T >= 59.9 };
  }

  /* ------------------------------------------------------------------ */
  /* stand-ins                                                           */
  /* ------------------------------------------------------------------ */
  /** たけ's hand-shadow gripping a stick (grip at 0,0, stick up), forearm and
   *  hanging sleeve going down-right out of the paper. a = forearm angle. */
  function handPath(x, y, s, a, open) {
    const p = new Path2D();
    const M = new DOMMatrix().translate(x, y).rotate(a * 180 / Math.PI).scale(s, s);
    const q = new Path2D();
    // fist round the stick (knuckles to the left), thumb over the top
    q.ellipse(0, 4, 13, 16, 0.25, 0, U.TAU);
    q.moveTo(-9, -6); q.bezierCurveTo(-6, -16, 6, -16, 9, -9); q.lineTo(4, -4); q.closePath();
    if (open) { q.moveTo(-12, -2); q.bezierCurveTo(-26, -14, -30, -24, -26, -30); q.lineTo(-20, -24); q.bezierCurveTo(-16, -14, -8, -8, -4, -4); q.closePath(); }
    // wrist and forearm, down and away
    q.moveTo(-10, 12); q.lineTo(12, 10); q.lineTo(26, 140); q.lineTo(-4, 146); q.closePath();
    // the sleeve (袂) hanging from the forearm
    q.moveTo(-6, 70); q.bezierCurveTo(-40, 76, -56, 104, -52, 150); q.lineTo(-38, 210); q.lineTo(20, 210); q.lineTo(22, 110); q.closePath();
    p.addPath(q, M);
    return p;
  }

  /** the tsukimi still-life's shadow: 三方 with a stepped pyramid of dango, the jug with a susuki spray */
  function offeringsPath(T, x, y, s) {
    const p = new Path2D();
    const add = (q) => p.addPath(q, new DOMMatrix().translate(x, y).scale(s, s));
    const q = new Path2D();
    // 三方: tray with a rim, a pedestal with its eye-shaped 繰形 hole of light
    q.rect(-2, -30, 74, 6);
    q.moveTo(0, -24); q.lineTo(70, -24); q.lineTo(64, -18); q.lineTo(6, -18); q.closePath();
    q.moveTo(10, -18); q.lineTo(60, -18); q.lineTo(64, 0); q.lineTo(6, 0); q.closePath();
    // dango: 3-2-1 steps of overlapping rounds (the 9-4-1 stack seen from the side)
    const r = 8.2;
    const rows = [[3, 0], [2, 1], [1, 2]];
    for (const [n, k] of rows) for (let i = 0; i < n; i++) {
      const cx = 35 + (i - (n - 1) / 2) * r * 2.05, cy = -30 - r - k * r * 1.6;
      q.moveTo(cx + r, cy); q.arc(cx, cy, r, 0, U.TAU);
    }
    add(q);
    // the 繰形 (a hole in the pedestal): cut with an anticlockwise sub-path
    const h = new Path2D();
    h.moveTo(22, -9); h.bezierCurveTo(28, -15, 42, -15, 48, -9); h.bezierCurveTo(42, -4, 28, -4, 22, -9); h.closePath();
    // jug (壺) and the susuki spray
    const j = new Path2D();
    j.moveTo(100, 0); j.bezierCurveTo(86, -8, 84, -40, 100, -52); j.lineTo(102, -64); j.lineTo(118, -64); j.lineTo(120, -52);
    j.bezierCurveTo(136, -40, 134, -8, 120, 0); j.closePath();
    add(j);
    const sway = Math.sin(T * 0.9) * 0.6 + U.wobble(T * 0.4, 7) * 0.5;
    const st = new Path2D();
    const strand = (pts, w0, w1) => {
      // a tapered strand along pts (closed sliver)
      const n = pts.length, Ls = [], Rs = [];
      for (let i = 0; i < n; i++) {
        const a2 = pts[Math.max(0, i - 1)], b2 = pts[Math.min(n - 1, i + 1)];
        const dx = b2[0] - a2[0], dy = b2[1] - a2[1], dl = Math.hypot(dx, dy) || 1;
        const w = U.lerp(w0, w1, i / (n - 1)) / 2;
        Ls.push([pts[i][0] - (dy / dl) * w, pts[i][1] + (dx / dl) * w]); Rs.push([pts[i][0] + (dy / dl) * w, pts[i][1] - (dx / dl) * w]);
      }
      st.moveTo(Ls[0][0], Ls[0][1]); for (const q2 of Ls) st.lineTo(q2[0], q2[1]); for (let i = n - 1; i >= 0; i--) st.lineTo(Rs[i][0], Rs[i][1]); st.closePath();
    };
    const rr = U.rng(83);
    // susuki: tall stems, each ending in a drooping, feathered plume (尾花)
    const plumes = [[-0.42, 168, -1], [-0.14, 190, 1], [0.1, 176, 1], [0.34, 150, 1], [-0.7, 128, -1]];
    for (const [a0, L, side] of plumes) {
      const a = a0 + sway * 0.014;
      const bx = 110, by = -62;
      const tx = bx + Math.sin(a) * L, ty = by - Math.cos(a) * L;
      const cx = bx + Math.sin(a * 0.5) * L * 0.5, cy = by - L * 0.62;
      const stem = B.qpts(bx, by, cx, cy, tx, ty, 12);
      strand(stem, 2.2, 1.2);
      // the plume: fine strands from the top third of the stem, drooping to one side
      for (let k = 0; k < 11; k++) {
        const u = U.lerp(0.62, 1, k / 10);
        const p0 = stem[Math.round(u * (stem.length - 1))];
        const hl = U.lerp(34, 18, (u - 0.62) / 0.38) * U.lerp(0.8, 1.15, rr());
        const ang = a + side * U.lerp(0.5, 1.5, (u - 0.62) / 0.38) + U.lerp(-0.15, 0.15, rr()) + sway * 0.02;
        const e = [p0[0] + Math.sin(ang) * hl, p0[1] - Math.cos(ang) * hl];
        const m = [p0[0] + Math.sin(ang - side * 0.35) * hl * 0.55, p0[1] - Math.cos(ang - side * 0.35) * hl * 0.55];
        strand(B.qpts(p0[0], p0[1], m[0], m[1], e[0], e[1], 6), 1.9, 0.35);
      }
    }
    // a 萩 branch arching out of the jug, small paired leaves and a few blossom knots
    {
      const a = -1.15 + sway * 0.01;
      const pts = B.qpts(104, -60, 60, -150, -20 + sway * 0.8, -118, 16);
      strand(pts, 2, 0.8);
      for (let i = 3; i < pts.length; i += 2) {
        const q2 = pts[i];
        for (const side of [-1, 1]) {
          const la = a + side * 0.9 + (i / pts.length) * 0.8;
          st.moveTo(q2[0], q2[1]);
          st.ellipse(q2[0] + Math.cos(la) * 6, q2[1] + Math.sin(la) * 6, 5.2, 2.6, la, 0, U.TAU);
        }
      }
      for (const i of [9, 13, 16]) { const q2 = pts[i]; st.moveTo(q2[0] + 3, q2[1] + 4); st.arc(q2[0], q2[1] + 4, 3, 0, U.TAU); }
    }
    add(st);
    return { path: p, hole: h, M: new DOMMatrix().translate(x, y).scale(s, s) };
  }

  /** 小夜's soft 紅絞り heko-obi bow (anchor = the knot): two drooping loops, two long tails */
  function drawBow(c, x, y, s, T) {
    const sw = Math.sin(T * 0.8) * 0.5;
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    const body = (k) => {
      // loops: soft, heavy cloth — they sag outward and down
      for (const dir of [-1, 1]) {
        k.beginPath();
        k.moveTo(dir * 3, -3);
        k.bezierCurveTo(dir * 12, -14, dir * 30, -13, dir * 33, -2 + sw);
        k.bezierCurveTo(dir * 35, 8, dir * 24, 12, dir * 12, 8);
        k.bezierCurveTo(dir * 7, 6, dir * 4, 4, dir * 3, 3);
        k.closePath();
        k.fill();
      }
      // tails, uneven, hanging
      for (const [dir, L] of [[-1, 40], [1, 33]]) {
        k.beginPath();
        k.moveTo(dir * 2, 3);
        k.bezierCurveTo(dir * 10, 12, dir * 9, L * 0.6, dir * 13 + sw, L);
        k.lineTo(dir * 4 + sw, L + 2);
        k.bezierCurveTo(dir * 3, L * 0.6, dir * 0, 12, dir * -2, 4);
        k.closePath();
        k.fill();
      }
      k.beginPath(); k.ellipse(0, 1, 6, 5.5, 0, 0, U.TAU); k.fill();
    };
    c.fillStyle = U.mix(C.beni, C.sumi, 0.55);
    body(c);
    // shibori: faint resist dots on the loops
    c.fillStyle = U.rgba(U.mix(C.beni, C.gofun, 0.25), 0.32);
    const r = U.rng(911);
    for (let i = 0; i < 40; i++) {
      const dir = r() < 0.5 ? -1 : 1;
      c.fillRect(dir * U.lerp(6, 30, r()), U.lerp(-9, 7, r()), 1, 1);
    }
    // the thin line of moonlight along the loops' upper edges
    c.strokeStyle = U.rgba(U.mix(C.beni, C.gofun, 0.6), 0.85);
    c.lineWidth = 1 / s * 1.3;
    c.beginPath();
    c.moveTo(-4, -4); c.bezierCurveTo(-12, -14, -28, -13, -32, -4);
    c.moveTo(4, -4); c.bezierCurveTo(12, -14, 28, -13, 32, -4);
    c.stroke();
    c.restore();
  }

  /* ------------------------------------------------------------------ */
  /* the shadow-play                                                     */
  /* ------------------------------------------------------------------ */
  function shadows(c, T) {
    // ---------- たけ: body and arm, far from the paper (soft, lighter) ----------
    const liftMoon = U.seg(T, 59.6, 60.6, E.inOutSine) * 0.62;
    const liftBamboo = U.env(T, 40.9, 41.7, 42.1, 42.9) * 0.34;
    const lift = Math.max(liftMoon, liftBamboo);
    const breath = Math.sin(T * 1.3) * 0.6;
    let takeRet = null;
    const soft = SB.shadowBuf(c, 'soft');
    SB.softStamp(soft, (s2) => {
      takeRet = CAST.grandma(s2, TAKE.x, TAKE.y + breath, TAKE.s, { pose: 'hold-puppet', facing: -1, lift, arms: 'both', stick: 12, silhouette: AINEZU, t: T, look: -0.05 });
    }, 8, [TAKE.x - 260, TAKE.y - 400, TAKE.x + 150, TAKE.y + 20]);
    // the hand-shadow that carries Kaguya (50–57), soft
    if (T >= 49.6 && T < 57.4) {
      const node = bambooNode(T);
      const k = kaguyaCarry(T, node);
      const up = U.seg(T, 49.6, 50.2, E.outCubic) * (1 - U.seg(T, 56.6, 57.4, E.inCubic));
      const grip = [k.pos[0] + 10 * k.s, k.pos[1] + 50 + (1 - up) * 160];
      const open = T > 56.5;
      SB.softStamp(soft, (s2) => { s2.fill(handPath(grip[0], grip[1], 1.05, -0.42, open)); }, 6, [grip[0] - 90, grip[1] - 60, grip[0] + 160, grip[1] + 260]);
    }
    c.save();
    SB.paperClip(c);
    SB.shadowComposite(c, T, 'soft', { alpha: 0.6 });
    c.restore();

    // ---------- puppets held against the paper (sharp) ----------
    const sh = SB.shadowBuf(c, 'shadow');
    // the offerings still-life, bottom-left of panel 1
    {
      const o = offeringsPath(T, 652, 958, 0.86);
      sh.save();
      SB.softFill(sh, o.path, 1.6);
      // the pedestal's eye-shaped hole lets the light through
      sh.globalCompositeOperation = 'destination-out';
      sh.setTransform(sh.getTransform().multiply(o.M));
      sh.fill(o.hole);
      sh.restore();
    }
    // the bamboo grove (41: lifted into panel 4)
    const bRise = E.outBack(U.seg(T, 41.0, 42.1));
    if (T >= 40.95) {
      const base = U.lerp(1540, BAMBOO.base, U.clamp(bRise, 0, 1.08));
      const shine = U.seg(T, 46.0, 46.5, E.outCubic);
      const split = U.seg(T, 48.0, 50.0, E.inOutSine);
      const pb = CAST.puppet('bamboo', sh, BAMBOO.x, base, BAMBOO.s, { t: T, wind: 0.3, shine, split, stickAngle: 0.04, stickLen: 180 });
      SB.softFill(sh, pb.path, 1, pb.rule);
      if (pb.sticks) sh.fill(pb.sticks);
    }
    // the bamboo-cutter (43: walks in along the bottom rail; no axe)
    if (T >= 42.9) {
      const u = U.seg(T, 43.0, 45.8);
      const x = U.lerp(OKINA.x0, OKINA.x1, E.outSine(u));
      const walking = u < 1;
      const phase = walking ? (T - 43) * 0.9 : 2.52 + U.seg(T, 45.8, 46.3) * 0.2;
      const bow = U.seg(T, 48.2, 49.4, E.inOutSine);   // he bends to the shining culm
      const ok = CAST.puppet('okina', sh, x, OKINA.y + bow * 2, OKINA.s, { pose: 'walk', phase, facing: -1, t: T, stickAngle: 0.1, stickLen: 70 });
      sh.save();
      if (bow > 0) { sh.translate(x, OKINA.y); sh.rotate(-bow * 0.12); sh.translate(-x, -OKINA.y); }
      // stamp him alone, then cut away the hatchet (the tale has none)
      SB.softStamp(sh, (s2) => {
        s2.fill(ok.path, ok.rule);
        if (ok.sticks) s2.fill(ok.sticks);
        s2.save();
        s2.globalCompositeOperation = 'destination-out';
        s2.lineCap = 'round';
        s2.lineWidth = 6.5;
        s2.beginPath(); s2.moveTo(ok.hand[0] - 2, ok.hand[1] + 4); s2.lineTo(ok.blade[0], ok.blade[1]); s2.stroke();
        s2.beginPath(); s2.arc(ok.blade[0], ok.blade[1] + 1, 6.5, 0, U.TAU); s2.fill();
        s2.restore();
      }, 0.8, [x - 50, OKINA.y - 80, x + 50, OKINA.y + 90]);
      sh.restore();
    }
    // Kaguya: the oval card (48–57), then the cut-out engawa (56.4–)
    const swap = U.seg(T, 56.4, 57.0, E.inOutSine);
    if (T >= 48.0 && swap < 1) {
      const node = bambooNode(T);
      const k = kaguyaCarry(T, node);
      const reveal = U.seg(T, 48.2, 49.6, E.inOutSine);
      const kp = CAST.puppet('kaguya', sh, k.pos[0], k.pos[1], k.s, { card: 'oval', grow: k.grow, t: T, stickAngle: -0.42, stickLen: 120 * k.s + 40 });
      // pulled from the paper at the swap: softer, fainter
      SB.softStamp(sh, (s2) => { s2.fill(kp.path, kp.rule); if (kp.sticks && T >= 49.8) s2.fill(kp.sticks); }, 1 + swap * 9, [kp.bbox[0] - 10, kp.bbox[1] - 10, kp.bbox[2] + 10, kp.bbox[3] + 10], reveal * (1 - swap));
    }
    if (swap > 0) {
      const raise = U.seg(T, 57.0, 58.5, E.inOutSine);
      const ke = CAST.puppet('kaguya-engawa', sh, ENGAWA.x, ENGAWA.y, ENGAWA.s, { raise, t: T, stickAngle: 0.05, stickLen: 70 });
      SB.softStamp(sh, (s2) => { s2.fill(ke.path, ke.rule); if (ke.sticks) s2.fill(ke.sticks); }, 1 + (1 - swap) * 8, [ke.bbox[0] - 12, ke.bbox[1] - 12, ke.bbox[2] + 12, ke.bbox[3] + 12], swap);
    }
    // the paper moon on its stick (60–)
    const pm = paperMoon(T);
    if (pm.on) {
      const hand = takeRet && takeRet.hand ? takeRet.hand : [TAKE.x - 110, TAKE.y - 160];
      const moonPath = new Path2D();
      moonPath.arc(pm.x, pm.y, pm.r, 0, U.TAU);
      SB.softFill(sh, moonPath, 2);
      // the stick from the disc's rim toward her raised hand
      const a = Math.atan2(hand[1] - pm.y, hand[0] - pm.x);
      const g0 = [pm.x + Math.cos(a) * (pm.r - 6), pm.y + Math.sin(a) * (pm.r - 6)];
      sh.save();
      sh.lineCap = 'round';
      sh.lineWidth = 3.4;
      sh.beginPath(); sh.moveTo(g0[0], g0[1]); sh.lineTo(hand[0], hand[1]); sh.stroke();
      sh.restore();
    }
    c.save();
    SB.paperClip(c);
    SB.shadowComposite(c, T, 'shadow', { alpha: 1 });
    // the paper moon: a flat black disc (藍鼠 deepening to 墨), its rim the only softness
    if (pm.on) {
      PRINT.with(c, 'K', T, (k) => {
        k.globalCompositeOperation = 'multiply';
        const d = 0.55 + 0.45 * pm.u;
        const g = k.createRadialGradient(pm.x, pm.y, pm.r * 0.55, pm.x, pm.y, pm.r);
        g.addColorStop(0, U.rgba(C.sumi, 0.8 * d));
        g.addColorStop(0.82, U.rgba(C.sumi, 0.74 * d));
        g.addColorStop(1, U.rgba(C.sumi, 0.34 * d));
        k.fillStyle = g;
        k.beginPath(); k.arc(pm.x, pm.y, pm.r - 0.5, 0, U.TAU); k.fill();
      });
    }
    c.restore();
    // the shining culm's slit: a 胡粉 point with kira (46–48.6, until the culm opens)
    const spark = U.seg(T, 46.0, 46.4, E.outCubic) * (1 - U.seg(T, 48.2, 48.9));
    if (spark > 0.001) {
      const n = bambooNode(T);
      PRINT.with(c, 'P8', T, (k) => {
        k.globalCompositeOperation = 'lighter';
        const tw = 0.6 + 0.4 * Math.sin(T * 7.3) * Math.sin(T * 3.1 + 1);
        const L = 9 + 5 * tw;
        k.strokeStyle = U.rgba(C.gofun, 0.8 * spark);
        k.lineWidth = 1.2;
        k.beginPath();
        k.moveTo(n[0] - L, n[1]); k.lineTo(n[0] + L, n[1]);
        k.moveTo(n[0], n[1] - L * 1.3); k.lineTo(n[0], n[1] + L * 1.3);
        k.stroke();
        k.fillStyle = U.rgba(C.gofun, 0.95 * spark);
        k.beginPath(); k.arc(n[0], n[1], 2.2, 0, U.TAU); k.fill();
      });
    }
  }

  /** the light of the shining culm on the paper (drawn under the shadows) */
  function nodeGlow(c, T) {
    const shine = U.seg(T, 46.0, 46.5, E.outCubic) * (1 - U.seg(T, 50.2, 51.4));
    if (shine <= 0.001) return;
    const n = bambooNode(T);
    PRINT.with(c, 'P7', T, (k) => {
      k.globalCompositeOperation = 'lighter';
      const g = k.createRadialGradient(n[0], n[1], 0, n[0], n[1], 80);
      g.addColorStop(0, U.rgba(C.gofun, 0.42 * shine));
      g.addColorStop(0.3, U.rgba(C.gofun, 0.14 * shine));
      g.addColorStop(1, U.rgba(C.gofun, 0));
      k.fillStyle = g;
      k.fillRect(n[0] - 80, n[1] - 80, 160, 160);
    });
  }

  /** the bamboo's node (the shining segment) in stage coords at T */
  function bambooNode(T) {
    const bRise = E.outBack(U.seg(T, 41.0, 42.1));
    const base = U.lerp(1540, BAMBOO.base, U.clamp(bRise, 0, 1.08));
    // node of the middle culm: (segA+segB)/2 = −128 local, with the culm's sway
    const sway = Math.sin(T * 0.8 + 2 * 1.7) * 0.02 * (0.3 + 0.3);
    const y = -128;
    return [BAMBOO.x + (-0.012 * y + (sway * y * y) / 620) * BAMBOO.s, base + y * BAMBOO.s];
  }

  /* ------------------------------------------------------------------ */
  /* 小夜 in the foreground                                              */
  /* ------------------------------------------------------------------ */
  function sayo(c, T) {
    const up = U.seg(T, 58.5, 59.1, E.inOutSine) * (1 - U.seg(T, 60.0, 60.8, E.inOutSine));
    const look = up * 0.85;
    const x = 962, y = 1122, s = 2.45;
    // a thin rim of moonlight where her head and shoulders meet the paper's glow
    PRINT.with(c, 'P7', T, (k) => CAST.child(k, x, y - 2.4, s, { pose: 'kneel-back', look, silhouette: U.rgba(C.geppaku, 0.5), t: T }));
    // the figure in its own colours, then sunk into the dark: backlit, only the 紺 and the red hinted
    const b = SB.shadowBuf(c, 'sayo');
    CAST.child(b, x, y, s, { pose: 'kneel-back', look, t: T, outline: 0.9 });
    b.save();
    b.globalCompositeOperation = 'source-atop';
    b.fillStyle = U.rgba(C.sumi, 0.88);
    b.fillRect(x - 200, y - 330, 400, 340);
    b.restore();
    const by = y - 40 * s;
    SB.shadowComposite(c, T, 'sayo', { tint: false, mode: 'source-over', plate: 'K' });
    PRINT.with(c, 'P2', T, (k) => drawBow(k, x, by + 2, 1.05, T));
  }

  TSUKI.scene('kage-e-taketori', {
    draw(ctx, t, S) {
      const T = S.seg.start + t;
      ctx.imageSmoothingQuality = 'low';
      // the push-in on the ring (64–66): scale 1 → 1.5, ring centre → (960,610)
      const e = E.inOutSine(U.seg(T, 64, 66));
      if (e > 0) {
        const gl = SB.glow(T);
        const s = U.lerp(1, 1.5, e);
        const to = [U.lerp(gl.x, 960, e), U.lerp(gl.y, 610, e)];
        ctx.translate(to[0], to[1]);
        ctx.scale(s, s);
        ctx.translate(-gl.x, -gl.y);
      }
      // as the paper moon covers the glow the room sinks: only the ring of real light remains
      const ecl = E.inOutSine(U.seg(T, 61.0, 63.2));
      SB.draw(ctx, T, {
        between: {
          room: (c) => { SB.tokonomaShade(c, T, 0.7 + 0.2 * ecl); SB.moonInWindow(c, T); },
          paper: (c) => { SB.light(c, T, { eclipse: ecl }); nodeGlow(c, T); shadows(c, T); },
          floor: (c) => sayo(c, T),
        },
      });
    },
  });
})(window.TSUKI);
