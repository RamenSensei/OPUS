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
   Drawn here (not CAST): the hand-shadows (a fist on the stick: the carry
   and the paper moon), the offerings still-life (panel 1, bottom-left), the
   engawa card (eave, 御簾 with its slits, post, 高欄, boards — Kaguya a hole
   of light before it, her hair parted from her robe by a line of card, her
   袂 raised before her bowed face), 小夜 in the foreground (a back-lit
   silhouette with a moon rim; her heko-obi bow below the subtitle band).
   The bamboo-cutter is CAST's puppet with its hatchet cut away (the tale has
   no axe); the growth morph is CAST's negative 'kaguya' puppet.
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
   * the paper moon: centre, and how far it has come (0..1). It is lifted on the last
   * rustle (59.8) from fully beyond panel 4's right edge (1620 + r + 20), so its shadow
   * slides in from the right over the 60.0 beat, and aligns with the glow at 63.0.
   */
  function paperMoon(T) {
    const gl = SB.glow(T);
    const t0 = rustle()[4];
    const u = E.outCubic(U.seg(T, t0, 63));
    const start = [1790, 548];
    return { x: U.lerp(start[0], gl.x, u), y: U.lerp(start[1], gl.y, u), r: 150, u, on: T >= t0 };
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
  function engawaCard(L, T, raise) {
    const X = ENGAWA.x, Y = ENGAWA.y;
    const r = E.inOutSine(U.clamp(raise));
    const sw = Math.sin(T * 0.9) * 0.6;
    L.save();
    L.fillStyle = AINEZU;
    // the dark room behind her, from under the blind's border to the boards
    L.fillRect(X - 72, Y - 206, 146, 196);
    // the blind's border (御簾の帽額), a thin paper gap above it under the eave
    L.fillRect(X - 76, Y - 213, 152, 6);
    // the eave: a thin roof edge overhanging to the left, its tip turned up
    const ev = new Path2D();
    ev.moveTo(X - 112, Y - 238); ev.quadraticCurveTo(X - 98, Y - 224, X - 76, Y - 223);
    ev.lineTo(X + 76, Y - 226); ev.lineTo(X + 76, Y - 217); ev.lineTo(X - 78, Y - 215);
    ev.quadraticCurveTo(X - 100, Y - 216, X - 116, Y - 234); ev.closePath();
    L.fill(ev);
    // the post, and the boards (簀子) with a line of paper between two planks
    L.fillRect(X - 90, Y - 222, 10, 222);
    L.fillRect(X - 100, Y - 11, 176, 6);
    L.fillRect(X - 100, Y - 3, 176, 5);
    // light: the blind's slits — thin lines of paper across its upper part
    L.save();
    L.globalCompositeOperation = 'destination-out';
    for (let y = Y - 202; y < Y - 118; y += 6.5) L.fillRect(X - 68, y, 138, 1.3);
    L.restore();
    // her figure: cut out of the card (feet on the boards at (fx, fy)), facing the glow (+x)
    const fx = X + 8, fy = Y - 12;
    const P = (x, y) => [fx + x, fy + y];
    const bow = U.deg(15) * (0.35 + 0.65 * r);
    const neck = P(4, -162);
    const R = (x, y) => { const q = P(x, y), dx = q[0] - neck[0], dy = q[1] - neck[1]; return [neck[0] + dx * Math.cos(bow) - dy * Math.sin(bow), neck[1] + dx * Math.sin(bow) + dy * Math.cos(bow)]; };
    const poly = (pts) => { const q = new Path2D(); pts.forEach((p, i) => (i ? q.lineTo(p[0], p[1]) : q.moveTo(p[0], p[1]))); q.closePath(); return q; };
    const smooth = (pts) => {
      const q = new Path2D(), n = pts.length;
      q.moveTo((pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2);
      for (let i = 1; i <= n; i++) { const a = pts[i % n], b = pts[(i + 1) % n]; q.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
      q.closePath(); return q;
    };
    // robe (uchiki over the hakama): narrow shoulders, a gentle flare, the train behind
    const robe = smooth([P(-10, -158), P(8, -160), P(13, -146), P(14, -110), P(18, -62), P(24, -14), P(27, -2), P(6, 0), P(-22, 0), P(-38, 3), P(-27, -8), P(-19, -48), P(-15, -104), P(-13, -146)]);
    // hair: over the crown and down her back to the boards, trailing past her train
    const hair = smooth([R(-3, -191), R(-12, -188), R(-16, -178), P(-16, -160), P(-20, -120), P(-23, -72), P(-28, -28), P(-42, -4), P(-64, 2), P(-48, -6), P(-32, -14), P(-25, -50), P(-19, -100), P(-14, -142), R(-11, -162), R(-7, -178)]);
    // head: a small profile, bowed (brow, nose, lips, chin — behind the sleeve once it is raised)
    const head = poly([R(-9, -186), R(-2, -191), R(6, -189), R(11, -184), R(13, -179), R(13.5, -176), R(17, -172), R(13.5, -170), R(14, -167), R(12, -165), R(12.8, -163), R(9, -160), R(3, -158), R(-4, -162), R(-9, -172)]);
    // the near sleeve (袂): hanging at her side → raised before her bowed face
    const lerpP = (a, b) => [U.lerp(a[0], b[0], r), U.lerp(a[1], b[1], r)];
    const sl = [lerpP(P(4, -154), P(16, -185)), lerpP(P(18, -150), P(37, -183 + sw)), lerpP(P(22, -96), P(40, -112 + sw)), lerpP(P(6, -92), P(19, -106))];
    const sleeve = smooth([sl[0], L2(sl[0], sl[1], 0.5), sl[1], L2(sl[1], sl[2], 0.5), sl[2], L2(sl[2], sl[3], 0.5), sl[3], L2(sl[3], sl[0], 0.5)]);
    // the forearm that lifts it (hidden by the sleeve when raised; along the robe when down)
    const arm = poly([P(6, -152), P(13, -152), lerpP(P(18, -112), P(25, -178)), lerpP(P(10, -112), P(18, -181))]);
    L.save();
    L.globalCompositeOperation = 'destination-out';
    for (const q of [robe, hair, head, sleeve, arm]) L.fill(q);
    L.restore();
    // lines of card left standing inside her (paper bridges): the hair parted from the robe,
    // the gap between the raised sleeve and her face, two layered hems (重ね)
    L.strokeStyle = AINEZU; L.lineCap = 'round'; L.lineJoin = 'round';
    L.lineWidth = 2.6;
    L.beginPath(); { const pts = [R(-11, -168), P(-14, -150), P(-17, -110), P(-21, -52), P(-30, -8)]; pts.forEach((p, i) => (i ? L.lineTo(p[0], p[1]) : L.moveTo(p[0], p[1]))); } L.stroke();
    if (r > 0.25) {
      L.lineWidth = 3.4 * U.clamp((r - 0.25) / 0.4);
      L.beginPath(); L.moveTo(sl[0][0] - 1, sl[0][1] + 3); L.lineTo(sl[3][0] - 1, sl[3][1] - 2); L.stroke();
    }
    L.lineWidth = 1.6;
    for (const y of [-7, -14]) { L.beginPath(); L.moveTo(P(4, y)[0], P(4, y)[1]); L.lineTo(P(30, y + 2)[0], P(30, y + 2)[1]); L.stroke(); }
    // the 高欄 before her: rails, two posts with 擬宝珠, dark across her hem
    L.fillRect(X - 100, Y - 50, 176, 5);
    L.fillRect(X - 100, Y - 28, 176, 3);
    for (const px of [X - 94, X + 70]) {
      L.fillRect(px - 3.5, Y - 58, 7, 50);
      L.beginPath(); L.ellipse(px, Y - 62, 5, 6, 0, 0, U.TAU); L.fill();
      L.beginPath(); L.moveTo(px - 2, Y - 67); L.lineTo(px, Y - 73); L.lineTo(px + 2, Y - 67); L.fill();
    }
    L.restore();
  }

  /* ------------------------------------------------------------------ */
  /* the shadow-play                                                     */
  /* ------------------------------------------------------------------ */
  /** the paper moon's hand: grip below the disc (the stick short), the forearm off to the lower right */
  function moonGrip(pm) { return [pm.x + 92, pm.y + 322]; }

  function shadows(c, T) {
    // ---------- たけ: body and arm, far from the paper (soft, lighter) ----------
    const R = rustle();
    const liftBamboo = U.env(T, R[0], R[0] + 1.0, 42.1, 42.9) * 0.34;   // the arm moves on the rustle; the culms rise on the biwa (41.0)
    const reach = U.seg(T, 59.6, 60.4, E.inOutSine) * 0.22;         // her arm goes out low, off the paper, to the moon
    const lift = Math.max(liftBamboo, reach);
    const breath = Math.sin(T * 1.3) * 0.6;
    const soft = SB.softLayer(c, 'take', [TAKE.x - 300, TAKE.y - 420, G.panels[3][1], G.bottom], 0.28);
    CAST.grandma(soft, TAKE.x, TAKE.y + breath, TAKE.s, { pose: 'hold-puppet', facing: -1, lift, arms: 'both', stick: 12, silhouette: AINEZU, t: T, look: -0.05 });
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
    // the hand that holds up the paper moon (60–)
    const pm = paperMoon(T);
    let moonHand = null;
    if (pm.on) moonHand = moonGrip(pm);
    // one soft layer for both hands and たけ: they never compound
    const pushFade = 1 - U.seg(T, 64.1, 65.3, E.inOutSine);
    if (moonHand && pushFade > 0.01 && moonHand[0] - 70 < G.panels[3][1]) {
      const hl2 = SB.softLayer(c, 'mhand', [moonHand[0] - 70, moonHand[1] - 60, Math.min(G.panels[3][1], moonHand[0] + 300), G.bottom + 40], 0.34);
      hl2.fill(fistPath(moonHand[0], moonHand[1], 1.3, 1.12, false));
      SB.softPrint(c, T, 'mhand', { alpha: 0.6 * pushFade });
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
    // the paper moon (a disc cut from card) and its stick: short, from the disc's lower rim into the fist
    if (pm.on) {
      S.beginPath(); S.arc(pm.x, pm.y, pm.r, 0, U.TAU); S.fill();
      const g = L2([pm.x + 40, pm.y + pm.r - 6], moonHand, pushFade);
      const r0 = [pm.x + 40, pm.y + pm.r - 6];
      const dx = g[0] - r0[0], dy = g[1] - r0[1], dl = Math.hypot(dx, dy) || 1, nx = -dy / dl * 1.9, ny = dx / dl * 1.9;
      S.beginPath(); S.moveTo(r0[0] + nx, r0[1] + ny); S.lineTo(g[0] + nx * 1.2, g[1] + ny * 1.2); S.lineTo(g[0] - nx * 1.2, g[1] - ny * 1.2); S.lineTo(r0[0] - nx, r0[1] - ny); S.closePath(); S.fill();
    }
    SB.softPrint(c, T, 'puppets', { mode: 'multiply' });
    // Kaguya: the oval card (48–57), then the cut-out engawa (56.4–)
    const swap = U.seg(T, 56.4, 57.0, E.inOutSine);
    if (T >= 48.0 && swap < 1) {
      const node = bambooNode(T);
      const k = kaguyaCarry(T, node);
      const reveal = U.seg(T, 48.2, 49.6, E.inOutSine);
      const kp = CAST.puppet('kaguya', null, k.pos[0], k.pos[1], k.s, { card: 'oval', grow: k.grow, t: T, stickAngle: 0.5, stickLen: 70 });
      SB.sharpFill(c, T, [[kp.path, kp.rule], [T >= 49.8 ? kp.sticks : null, 'nonzero']], { alpha: reveal * (1 - swap) });
    }
    if (swap > 0) {
      const raise = U.seg(T, 57.0, 58.5);
      const K2 = SB.sharpLayer(c, 'engawa', [ENGAWA.x - 140, ENGAWA.y - 250, ENGAWA.x + 120, G.bottom]);
      engawaCard(K2, T, raise);
      SB.softPrint(c, T, 'engawa', { mode: 'multiply', alpha: swap });
    }
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
        k.save();
        SB.paperClip(k);
        k.beginPath(); k.arc(pm.x, pm.y, pm.r - 0.5, 0, U.TAU); k.fill();
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
    // 58.5 she tips her head back toward the round window; 60 she lowers it (the paper moon rises)
    const up = U.seg(T, 58.5, 59.1, E.inOutSine) * (1 - U.seg(T, 60.0, 60.7, E.inOutSine));
    const down = U.seg(T, 60.0, 60.8, E.inOutSine);
    const X = 962, br = Math.sin(T * 1.2) * 0.6;
    const hy = 934 + 8 * up + 5 * down + br * 0.3;               // head centre
    const sy = 1 - 0.1 * up;                                     // tipped back: the dome foreshortens
    const hemY = 960 + 4 * up - 3 * down;
    const flare = 3 * up;
    // the okappa from behind: a dome, the hem cut straight but not quite (a little ragged)
    const head = new Path2D();
    head.moveTo(X - 27 - flare, hemY);
    head.bezierCurveTo(X - 33 - flare, hy - 6 * sy, X - 29, hy - 27 * sy, X, hy - 27 * sy);
    head.bezierCurveTo(X + 29, hy - 27 * sy, X + 33 + flare, hy - 6 * sy, X + 27 + flare, hemY);
    const teeth = 10;
    for (let i = teeth; i >= 0; i--) {
      const x = X - 27 - flare + ((54 + 2 * flare) * i) / teeth;
      head.lineTo(x, hemY + (i % 2 ? 1.6 : -0.4) + Math.sin(i * 2.7) * 0.8);
    }
    head.closePath();
    // shoulders and the kneeling back (no neck: the bob sits on the collar); sleeves at the sides
    const body = new Path2D();
    body.moveTo(X - 15, hemY - 4);
    body.lineTo(X - 17, hemY + 3);
    body.bezierCurveTo(X - 36, hemY + 5 + br, X - 50, hemY + 12, X - 56, 1002);
    body.bezierCurveTo(X - 62, 1024, X - 64, 1050, X - 76, 1090);
    body.lineTo(X + 76, 1090);
    body.bezierCurveTo(X + 64, 1050, X + 62, 1024, X + 56, 1002);
    body.bezierCurveTo(X + 50, hemY + 12, X + 36, hemY + 5 + br, X + 17, hemY + 3);
    body.lineTo(X + 15, hemY - 4);
    body.closePath();
    // the figure: a near-pure 墨 silhouette against the lit paper …
    PRINT.with(c, 'K', T, (k) => {
      k.fillStyle = U.mix(C.sumi, C.kon, 0.12);
      k.fill(body); k.fill(head);
    });
    // … with a thin rim of moonlight just inside its upper edges (head and shoulders)
    PRINT.with(c, 'P7', T, (k) => {
      k.save();
      k.strokeStyle = U.rgba(C.geppaku, 0.55);
      k.lineWidth = 3;
      k.save(); k.clip(head);
      k.beginPath();
      k.moveTo(X - 31 - flare, hy - 6 * sy);
      k.bezierCurveTo(X - 29, hy - 27 * sy, X - 14, hy - 27 * sy, X, hy - 27 * sy);
      k.bezierCurveTo(X + 14, hy - 27 * sy, X + 29, hy - 27 * sy, X + 31 + flare, hy - 6 * sy);
      k.stroke();
      k.restore();
      k.clip(body);
      k.beginPath();
      k.moveTo(X - 18, hemY + 3); k.bezierCurveTo(X - 36, hemY + 7, X - 50, 984, X - 56, 1004);
      k.moveTo(X + 18, hemY + 3); k.bezierCurveTo(X + 36, hemY + 7, X + 50, 984, X + 56, 1004);
      k.stroke();
      k.restore();
    });
    // the heko-obi bow at the small of her back, below the subtitle band
    PRINT.with(c, 'P2', T, (k) => drawBow(k, X, 1054, 0.95, T));
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
