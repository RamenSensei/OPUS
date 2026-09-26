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
   Drawn here (not CAST): the carry's hand-shadow (a fist on the stick), the
   paper moon's bamboo pole (sharp at the disc, softening into たけ's own
   raised fists: one connected shadow), the offerings still-life (panel 1),
   小夜 in the foreground (a back-lit silhouette with a moon rim, three-quarter
   back, turned toward Kaguya; her 紅 shibori heko-obi off-centre below the
   subtitle band).
   The bamboo-cutter is CAST's puppet with its hatchet cut away (the tale has
   no axe); the growth morph is CAST's negative 'kaguya' puppet, and the
   engawa card (56.4–) CAST's 'kaguya-engawa' — the same woman, the 御簾 rolled
   up above her crown. On both, her 垂髪 and eye are card twice over (the
   puppet's lacquered second layer, printed multiply): the darkest value.
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const { U, B, C, CAST, PRINT, MOON } = TSUKI;
  const SB = TSUKI.SHOTS.B;
  const G = SB.GEOM;
  const E = U.ease;
  const AINEZU = SB.INK.AINEZU;
  const L2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

  /* ------------------------------------------------------------------ */
  /* the beats (absolute film time)                                      */
  /* ------------------------------------------------------------------ */
  const BAMBOO = { x: 1372, base: 950, s: 1.0 };
  const OKINA = { x0: 1660, x1: 1478, y: 949, s: 1.5 };
  const KAG_CHILD_S = 0.62;
  const ENGAWA = { x: 542, y: 955, s: 1.0 };           // Kaguya's cut-out engawa card, panel 1 (right of the offerings)
  // the oval card's woman lands where the engawa card's woman stands (feet on its boards)
  const KAG_END_S = 1.0;                               // puppet scale (woman 190·s px)
  const KAG_END = [ENGAWA.x + 8, ENGAWA.y - 16];
  const TAKE = { x: 1552, y: 968, s: 1.95 };            // たけ's body shadow (anchor = knees on the floor)
  // たけ's hands move a puppet on each paper rustle of the score (TSUKI.CUES, AUDIO_API.md)
  const rustle = () => (TSUKI.CUES && TSUKI.CUES.puppetRustle) || [40.7, 42.7, 49.8, 54.2, 59.8];

  /** where the oval card (her feet) is, its scale and growth, at T */
  function kaguyaCarry(T, node) {
    // 48–50 inside the split node; 50–50.5 lifted out; 50.5–54.5 morph into panel 3; 54.5–56.4 across panel 2
    const inNode = [node[0] - 1, node[1] + 13 * KAG_CHILD_S];
    const lifted = [node[0] - 24, node[1] - 40];
    const p3 = [1126, 790];
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
      pos = [U.lerp(p3[0], KAG_END[0], u), U.lerp(p3[1], KAG_END[1], u) - Math.sin(Math.PI * u) * 60];
      s = KAG_END_S; grow = 1;
    }
    return { pos, s, grow };
  }

  /**
   * the paper moon: a disc cut from card on the end of a long bamboo pole in たけ's own
   * hands (one connected shadow: moon → pole → her fists → her arms → her bowed back).
   * She lifts it on the last rustle (59.8): the disc rises out from under panel 3's bottom
   * rail in an arc — steep at first, then gliding in from the right — and settles on the
   * glow at 63.0; then it tracks the glow. The ease is the pole's weight: a slow start
   * (s ≈ 2.6·u^1.5), a long careful landing (the last half-second moves ≈ 12 px).
   * Returns the centre and how far it has come (0..1).
   */
  const MOON_ARC = { p0: [1190, 1122], c: [930, 468] };   // start (the disc just under the rail) · arc control
  function paperMoon(T) {
    const gl = SB.glow(T);
    const t0 = rustle()[4];
    const u = U.seg(T, t0, 63);
    const s = 1 - Math.pow(1 - Math.pow(u, 1.5), 2.6);
    const a = (1 - s) * (1 - s), b = 2 * s * (1 - s), c = s * s;
    const p0 = MOON_ARC.p0, p1 = MOON_ARC.c;
    return { x: a * p0[0] + b * p1[0] + c * gl.x, y: a * p0[1] + b * p1[1] + c * gl.y, r: 150, u: s, on: T >= t0 };
  }

  /** たけ's arms on the pole: at her lap (0) → raised before her, as far forward as they reach (0.5) */
  const poleLift = (T) => 0.5 * E.inOutSine(U.seg(T, rustle()[4] - 0.1, 61.8));

  /**
   * the pole's centre line from the disc's centre (d) to her grip (g), bowed a little under
   * the disc's weight (sag px at the middle, always downward): n+1 points, 0 = disc, n = grip
   */
  function polePts(d, g, sag, n) {
    const dx = g[0] - d[0], dy = g[1] - d[1], L = Math.hypot(dx, dy) || 1;
    let nx = -dy / L, ny = dx / L;
    if (ny < 0) { nx = -nx; ny = -ny; }
    const mx = (d[0] + g[0]) / 2 + nx * sag * 2, my = (d[1] + g[1]) / 2 + ny * sag * 2;
    return B.qpts(d[0], d[1], mx, my, g[0], g[1], n);
  }

  /**
   * a band along the pole over fractions [f0, f1] (past 1 = the butt through her fist),
   * tapering w0 → w1, with the bamboo's nodes as slight swellings (fixed on the pole:
   * px from the disc's centre, so they ride out with it as she feeds the pole through her hands)
   */
  const POLE_NODES = [212, 358, 504, 650];
  function poleBand(pts, f0, f1, w0, w1) {
    const n = pts.length - 1, L = [], R = [];
    let len = 0;
    for (let i = 0; i < n; i++) len += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
    const nodes = POLE_NODES.filter((d) => d < len - 60).map((d) => d / len), nw = len / 5.5;
    const at = (f) => {
      const x = U.clamp(f, 0, 1) * n, i = Math.min(n - 1, Math.floor(x)), k = x - i;
      const p = [U.lerp(pts[i][0], pts[i + 1][0], k), U.lerp(pts[i][1], pts[i + 1][1], k)];
      const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], dl = Math.hypot(dx, dy) || 1;
      if (f > 1) { p[0] += (dx / dl) * (f - 1) * n * dl; p[1] += (dy / dl) * (f - 1) * n * dl; }
      return { p, nx: -dy / dl, ny: dx / dl };
    };
    const steps = Math.max(2, Math.ceil(((f1 - f0) * len) / 4));
    for (let j = 0; j <= steps; j++) {
      const f = U.lerp(f0, f1, j / steps), q = at(f);
      let w = U.lerp(w0, w1, U.clamp(f)) / 2;
      for (const k of nodes) w += 0.6 * Math.max(0, 1 - Math.abs(f - k) * nw);
      L.push([q.p[0] + q.nx * w, q.p[1] + q.ny * w]); R.push([q.p[0] - q.nx * w, q.p[1] - q.ny * w]);
    }
    const p = new Path2D();
    L.forEach((q, i) => (i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1])));
    for (let i = R.length - 1; i >= 0; i--) p.lineTo(R[i][0], R[i][1]);
    p.closePath();
    return p;
  }

  /* ------------------------------------------------------------------ */
  /* stand-ins                                                           */
  /* ------------------------------------------------------------------ */
  /**
   * たけ's hand-shadow closed round a stick: a fist with four knuckle bumps and
   * the thumb over them, the wrist, the forearm running down and out of the
   * paper toward (dir) with its hanging sleeve. (x, y) = where the stick passes
   * through the fist; the stick continues up (a = its angle from straight up).
   * s = scale (a hand far from the paper throws a large shadow).
   */
  function fistPath(x, y, s, dir, open) {
    const p = new Path2D();
    const q = new Path2D();
    // palm and the curled fingers: the knuckles face the stick's far side
    q.moveTo(-14, -12);
    q.bezierCurveTo(-18, -2, -17, 12, -10, 18);
    q.lineTo(12, 20);
    q.bezierCurveTo(17, 10, 17, -6, 12, -14);
    q.closePath();
    for (let i = 0; i < 4; i++) { const ky = -9 + i * 7.6; q.moveTo(-12, ky + 3.8); q.ellipse(-15.5, ky, 4.4, 3.9, 0, 0, U.TAU); }
    // the thumb wrapped over the front of the fingers
    q.moveTo(8, -14); q.bezierCurveTo(-2, -20, -14, -16, -17, -10); q.lineTo(-12, -6); q.bezierCurveTo(-6, -10, 2, -10, 10, -6); q.closePath();
    if (open) { q.moveTo(-14, -8); q.bezierCurveTo(-30, -18, -34, -30, -30, -36); q.lineTo(-24, -30); q.bezierCurveTo(-20, -20, -10, -12, -6, -8); q.closePath(); }
    // wrist and forearm, out toward dir, widening; the sleeve (袂) hanging below it
    const d = [Math.cos(dir), Math.sin(dir)], n = [-d[1], d[0]];
    const W0 = 13, W1 = 24, L = 170;
    const A = [2 + n[0] * W0, 14 + n[1] * W0], Bq = [2 - n[0] * W0, 14 - n[1] * W0];
    const C0 = [2 + d[0] * L - n[0] * W1, 14 + d[1] * L - n[1] * W1], D0 = [2 + d[0] * L + n[0] * W1, 14 + d[1] * L + n[1] * W1];
    q.moveTo(A[0], A[1]); q.lineTo(D0[0], D0[1]); q.lineTo(C0[0], C0[1]); q.lineTo(Bq[0], Bq[1]); q.closePath();
    const e = [2 + d[0] * 70, 14 + d[1] * 70];
    q.moveTo(e[0], e[1]); q.bezierCurveTo(e[0] - 30, e[1] + 10, e[0] - 36, e[1] + 60, e[0] - 22, e[1] + 110);
    q.lineTo(e[0] + d[0] * 100 + 10, e[1] + 140); q.lineTo(e[0] + d[0] * 90, e[1] + 20); q.closePath();
    p.addPath(q, new DOMMatrix().translate(x, y).scale(s, s));
    return p;
  }

  /** the tsukimi still-life's shadow: 三方 with a stepped pyramid of dango, the jug with a susuki spray */
  function offeringsPath(T, x, y, s, mirror) {
    const p = new Path2D();
    const MX = new DOMMatrix().translate(x, y).scale(mirror ? -s : s, s);
    const add = (q) => p.addPath(q, MX);
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
    return { path: p, hole: h, M: MX };
  }

  /** 小夜's soft 紅絞り heko-obi bow (anchor = the knot): two drooping loops, two long tails — muted in the dark */
  function drawBow(c, x, y, s, T) {
    const sw = Math.sin(T * 0.8) * 0.5;
    c.save();
    c.translate(x, y);
    c.rotate(-0.12);
    c.scale(s, s);
    const loops = (k) => {
      for (const dir of [-1, 1]) {
        k.beginPath();
        k.moveTo(dir * 3, -3);
        k.bezierCurveTo(dir * 12, -14, dir * 30, -13, dir * 33, -2 + sw);
        k.bezierCurveTo(dir * 35, 8, dir * 24, 12, dir * 12, 8);
        k.bezierCurveTo(dir * 7, 6, dir * 4, 4, dir * 3, 3);
        k.closePath();
        k.fill();
      }
    };
    c.fillStyle = U.mix(C.beni, C.sumi, 0.72);
    loops(c);
    for (const [dir, L] of [[-1, 34], [1, 28]]) {
      c.beginPath();
      c.moveTo(dir * 2, 3);
      c.bezierCurveTo(dir * 10, 12, dir * 9, L * 0.6, dir * 13 + sw, L);
      c.lineTo(dir * 4 + sw, L + 2);
      c.bezierCurveTo(dir * 3, L * 0.6, dir * 0, 12, dir * -2, 4);
      c.closePath();
      c.fill();
    }
    c.beginPath(); c.ellipse(0, 1, 6, 5.5, 0, 0, U.TAU); c.fill();
    // shibori: small resist rings, paler, over the loops
    c.fillStyle = U.rgba(U.mix(C.beni, C.gofun, 0.4), 0.45);
    const rr = U.rng(58);
    for (let i = 0; i < 26; i++) {
      const dir = rr() < 0.5 ? -1 : 1, px = dir * U.lerp(8, 29, rr()), py = U.lerp(-9, 6, rr());
      c.beginPath(); c.arc(px, py, 0.9, 0, U.TAU); c.fill();
    }
    // the thin line of moonlight along the loops' upper edges only
    c.strokeStyle = U.rgba(U.mix(C.beni, C.gofun, 0.45), 0.7);
    c.lineWidth = 1.2 / s;
    c.beginPath();
    c.moveTo(-4, -4); c.bezierCurveTo(-12, -14, -28, -13, -32, -4);
    c.moveTo(4, -4); c.bezierCurveTo(12, -14, 28, -13, 32, -4);
    c.stroke();
    c.restore();
  }

  /* ------------------------------------------------------------------ */
  /* Kaguya on the cut-out engawa (panel 1): a dark card — eave, 御簾      */
  /* with its slits of light, post, boards, 高欄 — and she a hole of light */
  /* ------------------------------------------------------------------ */
  const engawaStill = {};                              // the card at rest, per stage size (see shadows)
  function engawaCard(L, T, raise) {
    // CAST's 'kaguya-engawa': the same figure as the carry card's woman (feet at (8, −16)),
    // so the dissolve 56.4–57.0 changes only the card round her. The 御簾 is rolled up above
    // her crown; her 垂髪 is card, and a second, lacquered layer of card (hair and eye)
    // is laid over it in multiply, so on the paper the hair prints as the darkest value.
    const kp = CAST.puppet('kaguya-engawa', null, ENGAWA.x, ENGAWA.y, ENGAWA.s, { raise: U.clamp(raise), t: T, sticks: false, layer2InSticks: false });
    L.fill(kp.path, kp.rule);
    if (kp.layer2) {
      L.save();
      L.globalCompositeOperation = 'multiply';
      L.fill(kp.layer2);
      L.restore();
    }
  }

  /* ------------------------------------------------------------------ */
  /* the shadow-play                                                     */
  /* ------------------------------------------------------------------ */
  function shadows(c, T) {
    // ---------- たけ: body and arm, far from the paper (soft, lighter) ----------
    const R = rustle();
    const liftBamboo = U.env(T, R[0], R[0] + 1.0, 42.1, 42.9) * 0.34;   // the arm moves on the rustle; the culms rise on the biwa (41.0)
    const pl = poleLift(T);                                          // (59.7–61.8) her arms raise the pole
    const lift = Math.max(liftBamboo, pl);
    const breath = Math.sin(T * 1.3) * 0.6;
    const pm = paperMoon(T);
    const soft = SB.softLayer(c, 'take', [TAKE.x - 300, TAKE.y - 420, G.panels[3][1], G.bottom], 0.28);
    // she looks up after the moon she lifts (−: the head tips back)
    // (the little puppet sticks in her fists are let go as she takes up the pole)
    const take = CAST.grandma(soft, TAKE.x, TAKE.y + breath, TAKE.s, { pose: 'hold-puppet', facing: -1, lift, arms: 'both', stick: Math.max(0, 12 * (1 - 5 * pl)), silhouette: AINEZU, t: T, look: -0.05 - 0.36 * pl });
    // the pole: from the disc's centre (hidden behind the card) down to her near fist, on through it.
    // Near the paper it is sharp and dark (in the puppets' layer below), lightening as it leaves the
    // paper; by her hands, far from the paper, it has crossed into her own soft shadow (here). The
    // cross-over [fb, fz] (fractions disc → grip) sits just inside her soft layer's left edge.
    // It comes into the light as she takes it up (59.75–60.15) and leaves it in the push-in (64.1–65.3).
    const poleA = U.seg(T, 59.75, 60.15, E.inOutSine) * (1 - U.seg(T, 64.1, 65.3, E.inOutSine));
    let pole = null, fb = 0, fz = 0;
    if (pm.on && poleA > 0.001) {
      const g = take.hands[0];
      const L = Math.hypot(g[0] - pm.x, g[1] - pm.y);
      pole = polePts([pm.x, pm.y], g, 4 + L * 0.008, 96);
      fb = U.clamp((TAKE.x - 300 + 14 - pm.x) / ((g[0] - pm.x) || 1), 0.3, 0.9);
      fz = Math.min(1, fb + 0.14);
      const gs = soft.createLinearGradient(pm.x, pm.y, g[0], g[1]);
      gs.addColorStop(fb, U.rgba(AINEZU, 0));
      gs.addColorStop(fz, U.rgba(AINEZU, poleA));
      soft.fillStyle = gs;
      soft.fill(poleBand(pole, fb, 1 + 34 / (L || 1), 5.5, 7.5));
      soft.fillStyle = AINEZU;
    }
    // the hand that carries Kaguya (49.6–57.2): a fist on her card's stick, the forearm from the lower right
    let carryGrip = null;
    if (T >= 49.6 && T < 57.3) {
      const node = bambooNode(T);
      const k = kaguyaCarry(T, node);
      const kp = CAST.puppet('kaguya', null, k.pos[0], k.pos[1], k.s, { card: 'oval', grow: k.grow, t: T, stickAngle: 0.5, stickLen: 70 });
      const up = U.seg(T, 49.6, 50.2, E.outCubic) * (1 - U.seg(T, 56.5, 57.3, E.inCubic));
      const g = kp.ends && kp.ends[0] ? kp.ends[0] : [k.pos[0] + 20, k.pos[1] + 60];
      carryGrip = [g[0], g[1] + (1 - up) * 220];
      const hl = SB.softLayer(c, 'hand', [carryGrip[0] - 70, carryGrip[1] - 60, carryGrip[0] + 280, Math.min(G.bottom + 40, carryGrip[1] + 330)], 0.34);
      hl.fill(fistPath(carryGrip[0], carryGrip[1], 1.15, 1.05, T > 56.6));
    }
    SB.softPrint(c, T, 'take', { alpha: 0.6 });
    if (carryGrip) SB.softPrint(c, T, 'hand', { alpha: 0.6 });

    // ---------- the offerings' shadow: the real still-life on the engawa, panel 1 bottom-left ----------
    {
      const o = offeringsPath(T, 404, 958, 0.74, true);
      PRINT.with(c, 'P4', T, (k) => {
        k.save();
        SB.paperClip(k, [[G.panels[0][0], G.panels[0][1]]]);
        const clipPath = new Path2D(); clipPath.rect(0, 0, 1920, 1080); clipPath.addPath(o.hole, o.M);
        k.clip(clipPath, 'evenodd');
        k.globalCompositeOperation = 'multiply';
        k.fillStyle = AINEZU;
        k.fill(o.path);
        k.restore();
      });
    }
    // ---------- puppets held against the paper (sharp): one union layer ----------
    const S = SB.sharpLayer(c, 'puppets', [G.panels[0][0], G.top, G.panels[3][1], G.bottom]);
    // the bamboo grove (41: lifted into panel 4)
    const bRise = E.outBack(U.seg(T, 41.0, 42.1));
    if (T >= 40.95) {
      const base = U.lerp(1540, BAMBOO.base, U.clamp(bRise, 0, 1.08));
      const shine = U.seg(T, 46.0, 46.5, E.outCubic);
      const split = U.seg(T, 48.0, 50.0, E.inOutSine);
      const pb = CAST.puppet('bamboo', null, BAMBOO.x, base, BAMBOO.s, { t: T, wind: 0.3, shine, split, stickAngle: 0.04, stickLen: 180 });
      S.fill(pb.path, pb.rule);
      if (pb.sticks) S.fill(pb.sticks);
    }
    // the bamboo-cutter (43: walks in along the bottom rail; no axe — the tale has none).
    // He starts on the rustle (42.7), so on the biwa (43.0) he is already ≈22 px into panel 4.
    if (T >= R[1]) {
      const u = U.seg(T, R[1], 45.8);
      const x = U.lerp(OKINA.x0, OKINA.x1, E.outSine(u));
      const walking = u < 1;
      const phase = walking ? (T - R[1]) * (2.52 / (45.8 - R[1])) : 2.52 + U.seg(T, 45.8, 46.3) * 0.2;
      const bow = U.seg(T, 48.2, 49.4, E.inOutSine);   // he bends to the shining culm
      const ok = CAST.puppet('okina', null, x, OKINA.y + bow * 2, OKINA.s, { pose: 'walk', phase, facing: -1, t: T, stickAngle: 0.1, stickLen: 70 });
      const O = SB.sharpLayer(c, 'okina', [x - 200, OKINA.y - 260, x + 200, G.bottom]);
      O.save();
      if (bow > 0) { O.translate(x, OKINA.y); O.rotate(-bow * 0.12); O.translate(-x, -OKINA.y); }
      O.fill(ok.path, ok.rule);
      if (ok.sticks) O.fill(ok.sticks);
      // cut the hatchet away (haft and blade), then close his hand round nothing
      const hx = ok.hand[0], hy = ok.hand[1], bx = ok.blade[0], by = ok.blade[1];
      const d = Math.hypot(bx - hx, by - hy) || 1, px = -(by - hy) / d * 3.6, py = (bx - hx) / d * 3.6;
      O.globalCompositeOperation = 'destination-out';
      O.beginPath(); O.moveTo(hx + px, hy + py); O.lineTo(bx + px, by + py); O.lineTo(bx - px, by - py); O.lineTo(hx - px, hy - py); O.closePath(); O.fill();
      O.beginPath(); O.arc(bx, by + 1, 8, 0, U.TAU); O.fill();
      O.globalCompositeOperation = 'source-over';
      O.beginPath(); O.ellipse(hx, hy, 5.5, 5, 0, 0, U.TAU); O.fill();
      O.restore();
      const RO = O.canvas.__region;
      S.drawImage(O.canvas, 0, 0, RO.w, RO.h, RO.x0, RO.y0, RO.w / RO.s, RO.h / RO.s);
    }
    // the paper moon (a disc cut from card) and the near-paper length of its pole, sharp and dark,
    // thinning into the soft shadow of her hands (the pole leaves the paper as it nears her)
    if (pm.on) {
      S.beginPath(); S.arc(pm.x, pm.y, pm.r, 0, U.TAU); S.fill();
      if (pole) {
        const g = pole[pole.length - 1];
        const gs = S.createLinearGradient(pm.x, pm.y, g[0], g[1]);
        gs.addColorStop(Math.min(0.42, fb - 0.06), U.rgba(AINEZU, poleA));
        gs.addColorStop(fb, U.rgba(AINEZU, 0.6 * poleA));
        gs.addColorStop(fz, U.rgba(AINEZU, 0));
        S.fillStyle = gs;
        S.fill(poleBand(pole, 0, fz, 3.4, 4.6));
        S.fillStyle = AINEZU;
      }
    }
    SB.softPrint(c, T, 'puppets', { mode: 'multiply' });
    // Kaguya: the oval card (48–57), then the cut-out engawa (56.4–)
    const swap = U.seg(T, 56.4, 57.0, E.inOutSine);
    if (T >= 48.0 && swap < 1) {
      const node = bambooNode(T);
      const k = kaguyaCarry(T, node);
      const reveal = U.seg(T, 48.2, 49.6, E.inOutSine);
      const kp = CAST.puppet('kaguya', null, k.pos[0], k.pos[1], k.s, { card: 'oval', grow: k.grow, t: T, stickAngle: 0.5, stickLen: 70 });
      // (the stick comes into her card at 49.8; her lacquered hair and eye are there from the start)
      SB.sharpFill(c, T, [[kp.path, kp.rule], [T >= 49.8 ? kp.sticks : kp.layer2, 'nonzero']], { alpha: reveal * (1 - swap) });
    }
    if (swap > 0) {
      const raise = U.seg(T, 57.0, 58.5);
      const K2 = SB.sharpLayer(c, 'engawa', [ENGAWA.x - 140, ENGAWA.y - 285, ENGAWA.x + 120, G.bottom]);
      // at rest (sleeve down before 57.0, raised from 58.5) the card is one fixed image: cut once
      // into the layer's own pixel grid, then blitted 1:1
      const RK = K2.canvas.__region, rest = raise <= 0 || raise >= 1;
      const key = `${raise >= 1 ? 1 : 0}|${K2.canvas.width}x${K2.canvas.height}|${RK.x0},${RK.y0},${RK.s}`;
      if (rest && engawaStill[key]) {
        K2.save(); K2.setTransform(1, 0, 0, 1, 0, 0); K2.drawImage(engawaStill[key], 0, 0); K2.restore();
      } else {
        engawaCard(K2, T, raise);
        if (rest) {
          const cv = B.canvas(K2.canvas.width, K2.canvas.height);
          cv.getContext('2d').drawImage(K2.canvas, 0, 0);
          engawaStill[key] = cv;
        }
      }
      SB.softPrint(c, T, 'engawa', { mode: 'multiply', alpha: swap });
    }
    // the paper moon: a shadow like the other puppets', one step darker (藍鼠 × 藍鼠: card held
    // flat against the paper), flat-filled with a crisp edge — a hand-made eclipse, not a photograph
    if (pm.on) {
      PRINT.with(c, 'P4', T, (k) => {
        k.save();
        SB.paperClip(k);
        k.globalCompositeOperation = 'multiply';
        k.fillStyle = U.rgba(AINEZU, 0.3 + 0.2 * pm.u);
        k.beginPath(); k.arc(pm.x, pm.y, pm.r - 0.5, 0, U.TAU); k.fill();
        k.restore();
      });
    }
    // the corona: where the card leaves the real glow, a flat ring of 胡粉 (hard edges; SB.light
    // carves the one bokashi outside it) and nine fixed flecks of mica on it, glinting in turn
    const cor = E.inOutSine(U.seg(T, 62.0, 63.2));
    if (pm.on && cor > 0.001) {
      const gl = SB.glow(T), rOut = 190;          // (= SB.light's eclipse disc: 150–190 flat, then one 36 px bokashi — at 66 the ring lands on the basin's rim)
      PRINT.with(c, 'P7', T, (k) => {
        k.save();
        SB.paperClip(k);
        k.globalCompositeOperation = 'lighter';
        k.fillStyle = U.rgba(C.gofun, 0.3 * cor);
        k.beginPath();
        k.arc(gl.x, gl.y, rOut, 0, U.TAU);
        k.arc(pm.x, pm.y, pm.r, 0, U.TAU, true);
        k.fill('evenodd');
        k.restore();
      });
      PRINT.with(c, 'P8', T, (k) => {
        k.save();
        SB.paperClip(k);
        k.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 9; i++) {
          const an = (i / 9) * U.TAU + 0.35 + U.hash(i + 41) * 0.4;
          const rr = pm.r + 42 + U.hash(i + 7) * 26;         // (on the corona's outer band, where the paper greys: there mica can glint)
          const tw = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(T * 2.1 + i * 2.4), 3);
          const fx = pm.x + Math.cos(an) * rr, fy = pm.y + Math.sin(an) * rr, fr = 1.1 + U.hash(i + 13) * 1.1;
          k.fillStyle = U.rgba(C.gofun, 0.85 * tw * cor);
          k.beginPath(); k.moveTo(fx - fr * 2.2, fy); k.lineTo(fx, fy - fr * 0.7); k.lineTo(fx + fr * 2.2, fy); k.lineTo(fx, fy + fr * 0.7); k.closePath(); k.fill();
        }
        k.restore();
      });
    }
    // the shining culm's slit: one 胡粉 point of light, and a few mica specks (46 – 48.3)
    const spark = U.seg(T, 46.0, 46.4, E.outCubic) * (1 - U.seg(T, 47.9, 48.3));
    if (spark > 0.001) {
      const n = bambooNode(T);
      PRINT.with(c, 'P7', T, (k) => {
        k.globalCompositeOperation = 'lighter';
        const g = k.createRadialGradient(n[0], n[1], 0, n[0], n[1], 7);
        g.addColorStop(0, U.rgba(C.gofun, 0.95 * spark));
        g.addColorStop(1, U.rgba(C.gofun, 0));
        k.fillStyle = g;
        k.save(); k.translate(n[0], n[1]); k.scale(0.55, 1.4); k.translate(-n[0], -n[1]);
        k.beginPath(); k.arc(n[0], n[1], 7, 0, U.TAU); k.fill();
        k.restore();
      });
      PRINT.with(c, 'P8', T, (k) => {
        k.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
          const a = 0.5 + 0.5 * Math.sin(T * (4.1 + i * 1.3) + i * 2);
          const ox = [-7, 6, -2][i], oy = [-12, -5, 13][i];
          k.fillStyle = U.rgba(C.gofun, 0.7 * a * spark);
          k.beginPath(); k.arc(n[0] + ox, n[1] + oy, 1.1, 0, U.TAU); k.fill();
        }
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
    // three-quarter back view, kneeling, turned toward panel 1 (Kaguya): her head, the round
    // window and the girl of light make one diagonal; the subtitle clears her head.
    // 58.5 she tips her head back toward the round window; 60 she lowers it (the paper moon rises)
    const up = U.seg(T, 58.5, 59.1, E.inOutSine) * (1 - U.seg(T, 60.0, 60.7, E.inOutSine));
    const down = U.seg(T, 60.0, 60.8, E.inOutSine);
    const X = 652, br = Math.sin(T * 1.2) * 0.6;
    const hx = X - 3 - 2 * up;                                   // the head a little toward Kaguya
    const hy = 932 + 8 * up + 5 * down + br * 0.3;               // head centre
    const sy = 1 - 0.1 * up;                                     // tipped back: the dome foreshortens
    const hemL = 954 + 4 * up - 3 * down, hemR = hemL + 5;       // the bob's hem, slanting with the turn
    // the okappa from behind, turned: a dome, the hem cut straight but not quite; below its left end
    // the line of her cheek and jaw (lost profile) — she is looking toward the girl of light
    const head = new Path2D();
    head.moveTo(hx - 26, hemL);
    head.bezierCurveTo(hx - 33, hy - 7 * sy, hx - 27, hy - 27 * sy, hx + 1, hy - 27 * sy);
    head.bezierCurveTo(hx + 28, hy - 27 * sy, hx + 32, hy - 6 * sy, hx + 25, hemR);
    const teeth = 10;
    for (let i = teeth; i >= 0; i--) {
      const f = i / teeth, x = U.lerp(hx - 26, hx + 25, f);
      head.lineTo(x, U.lerp(hemL, hemR, f) + (i % 2 ? 1.6 : -0.4) + Math.sin(i * 2.7) * 0.8);
    }
    head.closePath();
    const cheek = new Path2D();
    cheek.moveTo(hx - 25, hemL - 4);
    cheek.bezierCurveTo(hx - 28, hemL + 3, hx - 24, hemL + 9, hx - 16, hemL + 10);
    cheek.lineTo(hx - 10, hemL + 2);
    cheek.closePath();
    // the nape under the bob: a narrow neck between hair and collar, paper light on either side
    const neck = new Path2D();
    neck.moveTo(hx - 9, hemL); neck.lineTo(hx + 9, hemR - 1); neck.lineTo(hx + 12, hemR + 9); neck.lineTo(hx - 11, hemL + 9); neck.closePath();
    // shoulders and the kneeling back, turned: the far (left) shoulder falls away narrower, the near
    // one broad; the near sleeve's 袂 hangs from her elbow, a soft bag at her side
    const body = new Path2D();
    body.moveTo(hx - 13, hemL + 6);
    body.bezierCurveTo(hx - 28, hemL + 9 + br, hx - 40, hemL + 18, hx - 44, 1004);
    body.bezierCurveTo(hx - 49, 1028, hx - 52, 1054, hx - 60, 1090);
    body.lineTo(hx + 80, 1090);
    body.bezierCurveTo(hx + 78, 1066, hx + 84, 1046, hx + 80, 1026);
    body.bezierCurveTo(hx + 76, 1006, hx + 66, 994, hx + 56, 990);
    body.bezierCurveTo(hx + 44, hemR + 14, hx + 30, hemR + 8 + br, hx + 14, hemR + 5);
    body.closePath();
    // the figure: a near-pure 墨 silhouette against the lit paper …
    PRINT.with(c, 'K', T, (k) => {
      k.fillStyle = U.mix(C.sumi, C.kon, 0.12);
      k.fill(body); k.fill(neck); k.fill(cheek); k.fill(head);
    });
    // … with a thin rim of moonlight just inside its upper edges (the dome, the near shoulder)
    PRINT.with(c, 'P7', T, (k) => {
      k.save();
      k.strokeStyle = U.rgba(C.geppaku, 0.55);
      k.lineWidth = 3;
      k.save(); k.clip(head);
      k.beginPath();
      k.moveTo(hx - 30, hy - 7 * sy);
      k.bezierCurveTo(hx - 27, hy - 27 * sy, hx - 12, hy - 27 * sy, hx + 1, hy - 27 * sy);
      k.bezierCurveTo(hx + 15, hy - 27 * sy, hx + 28, hy - 27 * sy, hx + 31, hy - 6 * sy);
      k.stroke();
      k.restore();
      k.clip(body);
      k.beginPath();
      k.moveTo(hx + 16, hemR + 6); k.bezierCurveTo(hx + 32, hemR + 10, hx + 46, 988, hx + 58, 992);
      k.moveTo(hx - 14, hemL + 8); k.bezierCurveTo(hx - 28, hemL + 11, hx - 38, 988, hx - 44, 1004);
      k.stroke();
      k.restore();
    });
    // the heko-obi: a soft 紅 shibori butterfly at the small of her back, off-centre with the turn
    PRINT.with(c, 'P2', T, (k) => drawBow(k, hx + 17, 1056, 0.92, T));
  }

  TSUKI.scene('kage-e-taketori', {
    init(S) { TSUKI.SHOTS.warmFlat('B', 50, S.k || 1); },
    draw(ctx, t, S) {
      const T = S.seg.start + t;
      // a clean context whatever the previous scene left behind (the engine resets only some state)
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'low';
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      ctx.miterLimit = 10;
      // the push-in on the ring (64–66): scale 1 → 1.5, ring centre → (960,610)
      // (the stage is printed 1:1 into a buffer and the impression scaled once: SB.withCamera)
      const e = E.inOutSine(U.seg(T, 64, 66));
      let cam = null;
      if (e > 0) {
        const gl = SB.glow(T);
        cam = { s: U.lerp(1, 1.5, e), about: [gl.x, gl.y], to: [U.lerp(gl.x, 960, e), U.lerp(gl.y, 610, e)] };
      }
      // as the paper moon covers the glow the room sinks: only the ring of real light remains
      const ecl = E.inOutSine(U.seg(T, 61.0, 63.2));
      SB.withCamera(ctx, cam, (cx) => {
        cx.imageSmoothingEnabled = true;
        cx.imageSmoothingQuality = 'low';
        SB.draw(cx, T, {
          between: {
            base: (c) => { SB.moonInWindow(c, T); SB.light(c, T, { eclipse: ecl }); nodeGlow(c, T); shadows(c, T); },
            ink: (c) => { SB.tokonomaShade(c, T, 0.7 + 0.2 * ecl); sayo(c, T); },
          },
        });
      });
    },
  });
})(window.TSUKI);
