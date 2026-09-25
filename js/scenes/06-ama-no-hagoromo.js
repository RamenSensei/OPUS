/* ==========================================================================
   06-ama-no-hagoromo.js — 五 天の羽衣 (T 118–160) · THE CLIMAX
   Shot B (118–155), then Shot A′ (155–160).

   118  through the mist wipe: the glow has climbed to the top rail; a thin
        veil of cloud lies over the moon in the window and draws off at 121
        (its rim "enters" — the moon clock already has it half inside)
   122.5 たけ's shadow slips off her haori (the letter writes itself, DOM)
   124–126 she holds it up against the moon: its 波兎 shines through
   126–128.5 she lays it over the sleeping child; the shadows merge
   132  shadows cast by nothing: a 瑞雲 with seven tennyo and a canopied
        carriage pours out of the window and slides down panels 2–3
        (far from the paper: soft, α .7 → .25)
   136–139.8 the ribbon of light (天の羽衣) unfurls down the central stile
   140  CULMINATION: the moon centred in the window. Her shadow peels off
        the paper (skew, penumbra), stands, straightens (老いをせず), turns
        to the stile like a paper puppet turned over
   141.2–146.8 she climbs the kumiko hand over hand; cells flash; her hair
        lengthens into Heian hair; the ribbon winds round her; PRINT tears
        every plate (140–147.8)
   146.6–147 she looks back once (the hero, 147)     147.8 CLICK: she faces
        the moon again — forgotten
   148–148.22 she slides up past the top rail; 148.2–148.45 small and dark
        against the moon she is absorbed (kira 148.4); the 墨 叢雲 closes
        over the window (148.6–152): the whole room goes dark
   152.4 the cloud passes; only the child's shadow under the haori's
   155  cut, in silence, to A′: たけ upright against the post, eyes closed,
        小夜 asleep in her lap under the haori. 155.4–157.8 her colour
        drains downward to 胡粉/銀鼠 (a feathered front with kira on her)
        while the haori and the red heko-obi stay bright; the child casts a
        shadow, the grandmother none. Hold to 160.

   Every live layer is printed through PRINT (with / softPrint / MOON) so the
   tears, the CLICK and the jolt reach all of it.
   Drawn here (local cut-paper rigs, not CAST): たけ's shadow on the paper
   and the climbing shadow (ONE rig: seated-old → standing-young → climbing,
   equal parts, blended — so the peel is continuous), the haori as its own
   T-shaped cut piece, the celestial procession, the ribbon, the 叢雲, the
   波兎 silk tile, the A′ offerings and heko-obi bow. CAST: 小夜 asleep
   ('sleep' silhouette) on the paper, the A′ pair (grandma 'lap').
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const { U, B, C, CAST, PRINT, MOON } = TSUKI;
  const SB = TSUKI.SHOTS.B, SA = TSUKI.SHOTS.A_prime;
  const G = SB.GEOM;
  const E = U.ease;
  const AINEZU = SB.INK.AINEZU;
  const EBICHA = U.mix(C.shu, C.sumi, 0.45);      // 海老茶: たけ's obijime
  const CUT = 155.0;
  const clamp01 = (x) => U.clamp(x);
  const io = (t, a, b) => E.inOutSine(clamp01((t - a) / (b - a)));

  /* ------------------------------------------------------------------ */
  /* placement (Shot B)                                                  */
  /* ------------------------------------------------------------------ */
  const TK = { x: 1052, y: 958, s: 1.12 };      // たけ: floor contact under her hip; facing the child (+x)
  const CH = { x: 1134, y: 958, s: 1.55 };      // 小夜 asleep across her lap, head at her knees
  const CLX = 1026;                              // where she stands to climb, facing the stile (−x)
  const RUNG = (Y) => (Y - TK.y) / TK.s;         // a stage y → rig-local y

  /* ------------------------------------------------------------------ */
  /* small geometry                                                      */
  /* ------------------------------------------------------------------ */
  const L2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; };
  const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];

  /** Catmull-Rom spline through pts into path (a point [x, y, 1] is a corner). */
  function spline(path, pts, closed = true) {
    const n = pts.length;
    const g = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
    path.moveTo(pts[0][0], pts[0][1]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      const c1 = p1[2] ? p1 : [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = p2[2] ? p2 : [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      path.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]);
    }
    if (closed) path.closePath();
    return path;
  }
  const splinePath = (pts, closed = true) => spline(new Path2D(), pts, closed);

  /** A tapered capsule along a polyline (one closed outline with round caps). */
  function tube(pts, w0, w1) {
    const p = new Path2D(), n = pts.length, Ls = [], Rs = [], Ns = [];
    for (let i = 0; i < n; i++) {
      const t = unit(pts[Math.max(0, i - 1)], pts[Math.min(n - 1, i + 1)]);
      const nm = [-t[1], t[0]], w = U.lerp(w0, w1, n > 1 ? i / (n - 1) : 0) / 2;
      Ns.push(nm);
      Ls.push([pts[i][0] + nm[0] * w, pts[i][1] + nm[1] * w]);
      Rs.push([pts[i][0] - nm[0] * w, pts[i][1] - nm[1] * w]);
    }
    p.moveTo(Ls[0][0], Ls[0][1]);
    for (let i = 1; i < n; i++) p.lineTo(Ls[i][0], Ls[i][1]);
    const ae = Math.atan2(Ns[n - 1][1], Ns[n - 1][0]);
    p.arc(pts[n - 1][0], pts[n - 1][1], w1 / 2, ae, ae + Math.PI, true);
    for (let i = n - 1; i >= 0; i--) p.lineTo(Rs[i][0], Rs[i][1]);
    const a0 = Math.atan2(-Ns[0][1], -Ns[0][0]);
    p.arc(pts[0][0], pts[0][1], w0 / 2, a0, a0 + Math.PI, true);
    p.closePath();
    return p;
  }

  /** two-bone IK: elbow on the side of +bend (1: below a raised arm / behind a hanging one) */
  function ik(S, W, l1, l2, bend = 1) {
    const dx = W[0] - S[0], dy = W[1] - S[1];
    const d = U.clamp(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01, l1 + l2 - 0.01);
    const a = Math.atan2(dy, dx);
    const A = Math.acos(U.clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    const El = [S[0] + Math.cos(a + bend * A) * l1, S[1] + Math.sin(a + bend * A) * l1];
    return [El, [S[0] + Math.cos(a) * d, S[1] + Math.sin(a) * d]];
  }

  /* ================================================================== */
  /* たけ's shadow: ONE cut-paper rig                                     */
  /*   local units, facing +x, y down, origin on the floor under the hip. */
  /*   seated-old (SEAT) → standing-young (STAND) → climbing (climb(T)):  */
  /*   the same parts with the same points, blended.                     */
  /* ================================================================== */
  const ARM = { upper: 58, fore: 54 };
  const SEAT = {
    H: [-8, -40], S: [30, -128], N: [41, -134], headT: 0.34, look: 0, hunch: 1, bun: 1, hair: 0, sleeve: 30, feet: 0, worn: 1, nw: 19,
    //       waistF      thighF      kneeF      hemF     hemB      hipB       waistB
    skirt: [[22, -62], [48, -47], [70, -22], [64, 0], [-50, 0], [-56, -30], [-36, -66]],
    wN: [56, -52], wF: [48, -50], lean: 0, elbowUp: 0, hairOut: 0,
  };
  const STAND = {
    H: [0, -160], S: [-3, -258], N: [-1, -273], headT: 0.06, look: 0, hunch: 0, bun: 0, hair: 1, sleeve: 50, feet: 1, worn: 0, nw: 14,
    skirt: [[18, -162], [23, -118], [21, -72], [28, 0], [-66, 4], [-31, -118], [-23, -164]],
    wN: [16, -150], wF: [4, -152], lean: 0, elbowUp: 0, hairOut: 0,
  };

  function blend(A, Bk, f) {
    if (f <= 0) return A;
    if (f >= 1) return Bk;
    const o = {};
    for (const k of Object.keys(A)) {
      const a = A[k], b = Bk[k];
      if (b == null) o[k] = a;
      else if (typeof a === 'number') o[k] = U.lerp(a, b, f);
      else if (Array.isArray(a) && typeof a[0] === 'number') o[k] = [U.lerp(a[0], b[0], f), U.lerp(a[1], b[1], f)];
      else if (Array.isArray(a)) o[k] = a.map((p, i) => [U.lerp(p[0], b[i][0], f), U.lerp(p[1], b[i][1], f)]);
      else o[k] = f < 0.5 ? a : b;
    }
    return o;
  }
  const shiftRig = (R, dx, dy) => {
    const o = Object.assign({}, R);
    for (const k of ['H', 'S', 'N', 'wN', 'wF']) o[k] = [R[k][0] + dx, R[k][1] + dy];
    o.skirt = R.skirt.map((p) => [p[0] + dx, p[1] + dy]);
    return o;
  };
  /** bend the upper body forward about the hip by angle a (the skirt stays) */
  const leanRig = (R, a) => {
    if (Math.abs(a) < 1e-4) return R;
    const o = Object.assign({}, R);
    for (const k of ['S', 'N']) { const d = rot([R[k][0] - R.H[0], R[k][1] - R.H[1]], a); o[k] = [R.H[0] + d[0], R.H[1] + d[1]]; }
    return o;
  };

  /* ---- the haori sequence (seated, 118–140) ---- */
  function seatedRig(T) {
    let R = Object.assign({}, SEAT);
    // 122.5 hands to the collar at her shoulders; 123–124 up and forward, torso straightening, face up
    const toCollar = io(T, 122.5, 123.0);
    const lift = io(T, 123.0, 124.0);
    const lay = io(T, 126.0, 127.9);
    const back = io(T, 128.0, 128.7);
    const straighten = lift * (1 - lay);
    R = leanRig(R, -0.2 * straighten + 0.34 * lay * (1 - back));
    R.headT = U.lerp(0.3, -0.42, straighten) + 0.28 * lay * (1 - back);
    R.hunch = U.lerp(1, 0.55, straighten);
    R.worn = 1 - io(T, 122.7, 123.6);
    // hands: lap → collar → held up → the child's shoulder → lap
    const sway = Math.sin(T * 1.1) * 2 * straighten;
    const collarN = [R.S[0] + 6, R.S[1] + 4], collarF = [R.S[0] - 6, R.S[1] + 2];
    const upN = [72 + sway, -214], upF = [30 + sway, -222];
    const dnN = [136, -52], dnF = [110, -58];
    let wN = L2(SEAT.wN, collarN, toCollar), wF = L2(SEAT.wF, collarF, toCollar);
    wN = L2(wN, upN, lift); wF = L2(wF, upF, lift);
    wN = L2(wN, dnN, lay); wF = L2(wF, dnF, lay);
    wN = L2(wN, SEAT.wN, back); wF = L2(wF, SEAT.wF, back);
    R.wN = wN; R.wF = wF;
    R.breath = Math.sin(T * 1.3) * 0.8;
    return R;
  }

  /* ---- the climb (local): shoulder schedule and the hands on the rungs ---- */
  //   hand over hand: the upper hand always holds a rung 80–125 px above the shoulder
  //   (clear above the head), the lower one at the chest; the body rises in four pulls
  //   (a knee pushes the robe out before each); she arrives under the top rail at 145.2.
  const SH0 = TK.y + (STAND.S[1]) * TK.s;                         // standing shoulder, stage y (≈669)
  const PULLS = [[141.25, 141.65, 610], [141.8, 142.45, 520], [143.0, 143.75, 405], [144.45, 145.2, 364]];
  function shoulderY(T) {
    let y = SH0, prev = SH0;
    for (const [a, b, to] of PULLS) { y = U.lerp(prev, to, io(T, a, b)); if (T < b) break; prev = to; }
    return y;
  }
  const HANDS = {
    N: [[0, 500], [143.85, 144.3, 296], [145.35, 145.95, 352]],
    F: [[0, 615], [142.95, 143.4, 385]],
  };
  function handY(key, T) {
    const K = HANDS[key];
    let y = K[0][1], moving = 0;
    for (let i = 1; i < K.length; i++) {
      const [a, b, to] = K[i];
      if (T <= a) break;
      const u = io(T, a, b);
      y = U.lerp(y, to, u);
      if (T < b) moving = Math.sin(Math.PI * u);
    }
    return [y, moving];
  }
  function climbRig(T) {
    const ys = shoulderY(T);
    const rise = (SH0 - ys) / TK.s;
    const R = shiftRig(STAND, 0, -rise);
    // the knee pushes the robe out before each pull
    let knee = 0;
    for (const [a, b] of PULLS) knee = Math.max(knee, U.env(T, a - 0.4, a - 0.05, a + 0.15, b - 0.05));
    knee = Math.max(knee, 0.55 * io(T, 145.3, 145.9));              // at the top: one foot up on a rung
    // below the feet (on a rung, hidden) the hem hangs and trails down and back, fluttering
    const fl = Math.sin(T * 1.7) * 4, fl2 = Math.sin(T * 1.7 - 0.7) * 5;
    const r0 = -rise;
    R.skirt = [[16, -163 + r0], [20 + 12 * knee, -120 - 14 * knee + r0], [19 + 30 * knee, -74 - 36 * knee + r0],
      [14 + 10 * knee, 22 + r0, 1], [-50 + fl2, 70 + r0, 1], [-27 + fl * 0.3, -104 + r0], [-22, -165 + r0]];
    R.feet = 0.55;
    const pull = PULLS.reduce((m, [a, b]) => Math.max(m, U.env(T, a, a + 0.15, b - 0.15, b)), 0);
    const Rl = leanRig(R, 0.06 * pull);
    const lx = (X) => (X - CLX) / -TK.s;
    const [yN, mN] = handY('N', T), [yF, mF] = handY('F', T);
    Rl.wN = [lx(971) + 12 * mN, RUNG(yN) - 3];
    Rl.wF = [lx(977) + 12 * mF, RUNG(yF) - 3];
    // at the top she settles, the hand drawn down to her shoulder, and lifts her face to the moon
    Rl.headT = U.lerp(-0.1 + 0.05 * Math.sin(T * 1.7), -0.38, io(T, 145.3, 146.1));
    Rl.elbowUp = 1 - io(T, 145.35, 145.95);
    Rl.hairOut = 1;
    return Rl;
  }

  /** everything about the climbing figure at T (null before the peel / after the moon takes her) */
  function climberState(T) {
    if (T < 140 || T >= 148.45) return null;
    const youth = io(T, 140.25, 141.05);
    const turn = io(T, 140.85, 141.2);
    const climbMix = io(T, 140.95, 141.4);
    let R = blend(seatedRig(139.9), STAND, youth);
    if (climbMix > 0) R = blend(R, climbRig(T), climbMix);
    R = Object.assign({}, R);
    R.youth = youth;
    R.hair = U.lerp(0, 1, io(T, 140.3, 143.6));
    R.bun = 1 - io(T, 140.2, 140.9);
    // she looks back once (146.6–147.0) … and at the CLICK faces the moon, forgotten
    const lookBack = io(T, 146.6, 147.0) * (1 - io(T, 147.8, 148.0));
    R.look = lookBack;
    R.headT = U.lerp(R.headT, 0.34, lookBack) - 0.3 * io(T, 147.8, 148.05);
    const u = clamp01((T - 140) / 1.2);
    const skew = Math.sin(Math.PI * u) * U.deg(12);
    const pen = 6 * U.env(T, 140.0, 140.45, 140.75, 141.3);
    const x = U.lerp(TK.x, CLX, io(T, 140.4, 141.1));
    const fx = Math.cos(Math.PI * turn);
    // 148.0–148.22: drawn up past the top rail (clipped by the paper's edge); 148.2–: in the window
    const up = 480 * E.inQuad(clamp01((T - 148.0) / 0.22));
    const inWin = T >= 148.21;
    return { R, x, y: TK.y - up, fx, skew, pen, inWin, youth, T };
  }

  /**
   * Build the rig's silhouette in stage coordinates.
   * Returns { parts: [Path2D], hair, hairGap, motoyui: [[x,y],[x,y]], body (union helper),
   *           head, waist, hands, nape, hem } — parts are painted one by one (union by paint).
   */
  function figure(R, M, T) {
    const body = [], headP = [], armN = [];
    const mk = (p, into) => { const q = new Path2D(); q.addPath(p, M); into.push(q); return q; };
    const tp = (p) => { const q = M.transformPoint(new DOMPoint(p[0], p[1])); return [q.x, q.y]; };
    const H = R.H, S = R.S, N = R.N;
    const u = unit(H, S), n = [-u[1], u[0]], Lt = Math.hypot(S[0] - H[0], S[1] - H[1]);
    const P = (t, w) => [H[0] + u[0] * t * Lt + n[0] * w, H[1] + u[1] * t * Lt + n[1] * w];
    const hu = R.hunch, wo = R.worn || 0, br = R.breath || 0;
    // skirt (the kimono binds the legs: one shape from waist to hem; layered hems step at the back)
    mk(splinePath(R.skirt), body);
    // torso: the hunch of age rounds the upper back; a worn haori thickens it a little
    mk(splinePath([P(-0.06, 24 + 3 * wo), P(0.35, 20 + 2 * wo + br), P(0.7, 19 + 2 * wo), P(0.96, 11),
      P(1.02, -12 - 4 * hu - 3 * wo), P(0.78, -20 - 17 * hu - 5 * wo), P(0.45, -24 - 7 * hu - 5 * wo), P(-0.06, -29 - 4 * wo)]), body);
    // neck
    mk(tube([P(0.9, -2), N], R.nw || 15, (R.nw || 15) * 0.8), body);
    // head: a profile (look → the profile turns back: nose and chin to the other side)
    const th = R.headT, sx = Math.cos(Math.PI * (R.look || 0));
    const sxc = Math.abs(sx) < 0.06 ? (sx < 0 ? -0.06 : 0.06) : sx;
    const hc0 = rot([3, -15], th);
    const Hc = [N[0] + hc0[0], N[1] + hc0[1]];
    const hp = (x, y, flip = true) => { const r = rot([flip ? x * sxc : x, y], th); return [Hc[0] + r[0], Hc[1] + r[1]]; };
    const face = [[-16, 3], [-16.5, -7], [-10, -15.5], [-1, -18.5], [8, -16.5], [13.5, -11.5], [15.5, -5], [15.4, -2.4],
      [21.5, 4.6, 1], [16, 6.6], [17.4, 8.8], [15.2, 10.4], [16.4, 12.2], [13.4, 16.2], [7, 17.8], [-2, 14.5]];
    mk(splinePath(face.map(([x, y, c]) => { const q = hp(x, y); return c ? [q[0], q[1], 1] : q; })), headP);
    // the old bun, low at the back of the head (with the comb's little ridge)
    if (R.bun > 0.03) {
      const b = hp(-17, -3, false), rb = 9.5 * R.bun + 0.5;
      const p = new Path2D(); p.ellipse(b[0], b[1], rb, rb * 0.9, th, 0, U.TAU);
      mk(p, headP);
      mk(tube([hp(-12, -11, false), hp(-20, -11, false)], 4 * R.bun, 4 * R.bun), headP);
    }
    // arms (far with the body, near as its own piece) with their hanging sleeves (袂)
    const arm = (Sa, W, into) => {
      // climbing, a hand high above the shoulder is reached with the elbow up beside the head
      // (the arm arches over it and the face stays clear); otherwise the elbow hangs
      let [El, Wr] = ik(Sa, W, ARM.upper, ARM.fore, 1);
      const up = (R.elbowUp || 0) * U.smoothstep(18, 70, Sa[1] - W[1]);
      if (up > 0) { const [E2] = ik(Sa, W, ARM.upper, ARM.fore, -1); El = L2(El, E2, up); }
      mk(tube([Sa, El], 13, 11), into);
      mk(tube([El, Wr], 10.5, 8), into);
      const hand = new Path2D();
      hand.ellipse(Wr[0] + (Wr[0] - El[0]) * 0.08, Wr[1] + (Wr[1] - El[1]) * 0.08, 6.5, 5.5, Math.atan2(Wr[1] - El[1], Wr[0] - El[0]), 0, U.TAU);
      mk(hand, into);
      const raised = Wr[1] < El[1] - 4;
      const a = raised ? L2(Sa, El, 0.3) : El, b = raised ? L2(El, Wr, 0.1) : L2(El, Wr, 0.55);
      const dp = R.sleeve;
      mk(splinePath([a, b, [b[0] - 2, b[1] + dp * 0.88, 1], [U.lerp(a[0], b[0], 0.5) - 4, Math.max(a[1], b[1]) + dp * 1.02], [a[0] - 6, a[1] + dp * 0.92, 1]]), into);
      return { El, Wr, raised };
    };
    const aF = arm([S[0] - 4, S[1] + 4], R.wF, body);
    const aN = arm(S, R.wN, armN);
    // toes peeping from the hem
    if (R.feet > 0.05) {
      const t0 = R.skirt[3];
      mk(splinePath([[t0[0] - 4, t0[1] - 5], [t0[0] + 12 * R.feet, t0[1] - 4, 1], [t0[0] + 13 * R.feet, t0[1] + 1, 1], [t0[0] - 3, t0[1] + 2]]), body);
    }
    // Heian hair: from the back of the head it falls clear behind the back to the hem,
    // tied with a 元結 at the shoulder blades
    let hair = null, motoyui = null, nape = null;
    const hl = R.hair || 0;
    if (hl > 0.02) {
      const root = hp(-8, -14, false), nap = hp(-15, 5, false);
      const bx = Math.min(P(0.8, -20 - 17 * hu)[0], P(0.4, -24 - 7 * hu)[0]);
      const Lh = U.lerp(10, 262, hl);
      const x0 = Math.min(nap[0] - 2, bx - 6.5);
      const sw = Math.sin(T * 1.25) * 5 * hl;
      // as she climbs toward the moon a draught lifts it: the lower hair swings out behind her
      const out = (R.hairOut || 0) * hl;
      const wave = (q) => Math.sin(q * 5.2 - T * 1.6) * 7 * q * out;
      const ctr = [root, nap];
      for (const q of [0.15, 0.32, 0.5, 0.68, 0.84, 0.98]) ctr.push([x0 - 42 * out * Math.pow(q, 1.3) - 5 * q + wave(q) + sw * q, nap[1] + q * Lh]);
      const wv = [19, 15, 15.5, 15.5, 14.5, 13.5, 12.5, 11].map((w) => w * U.lerp(0.72, 1, hl));
      const Ls = [], Rs = [];
      for (let i = 0; i < ctr.length; i++) {
        const t = unit(ctr[Math.max(0, i - 1)], ctr[Math.min(ctr.length - 1, i + 1)]);
        const nm = [-t[1], t[0]], w = wv[i] / 2;
        Ls.push([ctr[i][0] + nm[0] * w, ctr[i][1] + nm[1] * w]); Rs.push([ctr[i][0] - nm[0] * w, ctr[i][1] - nm[1] * w]);
      }
      // the ends part into three uneven locks
      const e0 = Ls[Ls.length - 1], e1 = Rs[Rs.length - 1], dn = unit(ctr[ctr.length - 2], ctr[ctr.length - 1]);
      const tip = (f, L) => { const q = L2(e0, e1, f); return [q[0] + dn[0] * L, q[1] + dn[1] * L]; };
      const hpth = new Path2D();
      spline(hpth, Ls.concat([tip(0.12, 16 * hl), [...tip(0.3, 3), 1], tip(0.5, 11 * hl), [...tip(0.68, 2), 1], tip(0.88, 14 * hl)], Rs.slice().reverse()), true);
      hair = new Path2D(); hair.addPath(hpth, M);
      if (hl > 0.35) {
        const t = unit(ctr[2], ctr[3]), nm = [-t[1], t[0]], w = wv[2] / 2 + 3;
        const mc = L2(ctr[2], ctr[3], 0.3);
        motoyui = [tp([mc[0] + nm[0] * w, mc[1] + nm[1] * w]), tp([mc[0] - nm[0] * w, mc[1] - nm[1] * w])];
      }
      nape = tp(nap);
    }
    return {
      body, head: headP, armN, parts: body.concat(headP, armN), hair, motoyui, nape,
      look: R.look || 0, nearRaised: aN.raised,
      headC: tp(Hc), waist: tp(P(0.12, 0)), hands: [tp(aN.Wr), tp(aF.Wr)], hem: tp(R.skirt[3]),
      shoulder: tp(S), hip: tp(H),
    };
  }

  /** the rig → stage matrix: (x, y) floor anchor, facing sx (−1..1, a paper puppet turning), shear */
  const rigMatrix = (x, y, s, sx, skew) => new DOMMatrix([s * sx, 0, -Math.tan(skew || 0) * s, s, x, y]);

  /**
   * Paint a figure into a layer ctx (stage coords), union by paint. Its pieces are
   * articulated like a cut-paper puppet's: a hairline of paper where the hair lies over
   * the robe, round the face when it turns back over the hair, and round the near arm
   * when it is raised across the head; the 元結 is a cut across the hair.
   */
  function paintFigure(L, fg) {
    const cut = (paths, w, clipFn) => {
      L.save();
      if (clipFn) clipFn();
      L.globalCompositeOperation = 'destination-out';
      L.lineWidth = w; L.lineJoin = 'round';
      for (const p of paths) L.stroke(p);
      L.restore();
    };
    for (const p of fg.body) L.fill(p);
    if (fg.hair) {
      cut([fg.hair], 3, () => { L.beginPath(); L.rect(fg.nape[0] - 400, fg.nape[1] + 8, 800, 1200); L.clip(); });
      L.fill(fg.hair);
      if (fg.motoyui) {
        L.save();
        L.globalCompositeOperation = 'destination-out';
        L.lineWidth = 2.4; L.lineCap = 'butt';
        L.beginPath(); L.moveTo(fg.motoyui[0][0], fg.motoyui[0][1]); L.lineTo(fg.motoyui[1][0], fg.motoyui[1][1]); L.stroke();
        L.restore();
      }
    }
    if (fg.hair && fg.look > 0.35) cut(fg.head, 3.2);
    for (const p of fg.head) L.fill(p);
    for (const p of fg.armN) L.fill(p);
  }

  /* ================================================================== */
  /* the haori: its own T-shaped cut piece                               */
  /*   outline in (u, v): u across (body ±0.5, sleeves to ±0.84),        */
  /*   v from the collar (0) to the hem (1)                              */
  /* ================================================================== */
  const HAORI_UV = [[0, 0.035], [0.5, 0], [0.8, 0.02], [0.845, 0.2], [0.8, 0.44], [0.62, 0.47], [0.53, 0.44],
    [0.52, 0.72], [0.5, 1, 1], [0.24, 1.015], [0, 1], [-0.24, 1.015], [-0.5, 1, 1], [-0.52, 0.72],
    [-0.53, 0.44], [-0.62, 0.47], [-0.8, 0.44], [-0.845, 0.2], [-0.8, 0.02], [-0.5, 0]];
  const HW = 104, HL = 152;                      // stage px: body width, length
  /** the child's back, stage: the top of her sleeping silhouette at fraction v along her (0 shoulder … 1 feet) */
  const CHILD_TOP = [[6, -14], [30, -24], [64, -26], [92, -34], [112, -28], [118, -4]];
  function childTop(v) {
    const f = U.clamp(v) * (CHILD_TOP.length - 1), i = Math.min(CHILD_TOP.length - 2, Math.floor(f));
    const p = L2(CHILD_TOP[i], CHILD_TOP[i + 1], f - i);
    return [CH.x + p[0] * CH.s, CH.y + p[1] * CH.s];
  }
  /** the haori at T (stage path) or null while worn; frame: {held, lay} */
  function haoriShape(T, fg) {
    if (T < 122.7) return null;
    const lift = io(T, 122.7, 124.0);                   // off her shoulders into her hands
    const lay = io(T, 126.0, 128.2);                    // down over the child
    const hN = fg.hands[0], hF = fg.hands[1];
    const mid = L2(hN, hF, 0.5);
    const wornTop = fg.shoulder, wornDir = unit(fg.shoulder, fg.hip);
    const sway = (v) => Math.sin(T * 1.15 + v * 2.2) * 5 * v * (1 - lay);
    // laying it down it swings like a spread blanket: the hem sweeps forward over her about the collar
    const phi = (Math.PI / 2) * E.inOutSine(clamp01(lay * 1.35));
    const pts = HAORI_UV.map(([uu, v, c]) => {
      // held: hanging from the collar held in both hands (and, laying, swung forward about it)
      const hr = rot([uu * HW + sway(v), v * HL - Math.abs(uu) * 4], -phi * (0.75 + 0.25 * v));
      const hang = [mid[0] + hr[0], mid[1] + hr[1]];
      // worn: collapsed onto her back (shoulders → hips)
      const worn = [wornTop[0] - 6 + wornDir[0] * v * 105 + uu * 22, wornTop[1] + wornDir[1] * v * 105 + Math.abs(uu) * 8];
      // laid: along the child's back; the across-direction becomes the drape to the floor
      const along = U.clamp(0.02 + v * 0.95);
      const top = childTop(along);
      // across the garment (u) becomes the drape from her back (u = +½) down to the boards (u = −½)
      const drape = [top[0] + uu * 8, U.lerp(top[1] - 7, CH.y + 1, clamp01(0.5 - uu))];
      let p = L2(worn, hang, E.inOutSine(clamp01(lift * 1.25 - v * 0.25)));
      // laid hem-first: the hem touches down over her feet, then it is smoothed up to her shoulders
      if (lay > 0) p = L2(p, drape, E.inOutSine(clamp01((lay - 0.4) / 0.6 * 1.25 - (1 - v) * 0.25)));
      return c ? [p[0], p[1], 1] : p;
    });
    return { path: splinePath(pts), mid, lift, lay, frame: { mid, w: HW, h: HL } };
  }

  /* ================================================================== */
  /* the 波兎 silk tile (rabbits leaping over seigaiha), built once      */
  /* ================================================================== */
  let silkTile = null;
  function buildSilk() {
    const S = 96;
    const cv = B.canvas(S, S);
    const c = cv.getContext('2d');
    c.strokeStyle = C.geppaku;
    c.fillStyle = C.geppaku;
    c.lineWidth = 1.7;
    const r = 24;
    for (let j = 0; j < 5; j++) {
      const yy = 48 + j * 12;
      const off = j % 2 ? r : 0;
      for (let xx = -r * 2 + off; xx < S + r * 2; xx += r * 2) {
        for (const k of [1, 0.66, 0.33]) { c.beginPath(); c.arc(xx, yy + r, r * k, Math.PI, 0); c.stroke(); }
      }
    }
    const rabbit = (x, y, s, flip) => {
      c.save();
      c.translate(x, y); c.scale(s * flip, s); c.rotate(-0.28);
      c.beginPath();
      c.ellipse(0, 0, 12, 6, 0, 0, U.TAU);
      c.moveTo(16, -4); c.ellipse(11, -4, 5, 4.2, 0, 0, U.TAU);
      c.moveTo(9, -8); c.ellipse(4, -12, 1.9, 7, -1.0, 0, U.TAU);
      c.moveTo(12, -8); c.ellipse(7.5, -13, 1.7, 6.5, -0.8, 0, U.TAU);
      c.moveTo(-8, 2); c.ellipse(-15, 5, 7, 2.1, 0.45, 0, U.TAU);
      c.moveTo(9, 4); c.ellipse(14, 7, 4.5, 1.7, -0.6, 0, U.TAU);
      c.fill();
      c.restore();
    };
    rabbit(30, 24, 1, 1);
    rabbit(76, 70, 0.8, -1);
    silkTile = cv;
  }

  /* ================================================================== */
  /* shadows cast by nothing: the 来迎 procession                         */
  /* ================================================================== */
  /**
   * One flying tennyo, local: head leading along +x, ~100 px from the crown to the
   * trailing robe; the knees bent back, one arm reaching ahead scattering flowers, the
   * other raising a lotus; the 天衣 loops over her shoulders and streams back in S-curves.
   */
  function tennyoPaths(add, T, i) {
    const ph = T * 1.2 + i * 1.7;
    const bob = Math.sin(ph) * 1.2;
    const Y = (y) => y + bob;
    // head (with the jewelled double topknot, 宝髻) and the neck
    const hd = new Path2D(); hd.ellipse(46, Y(-2), 8.2, 7.6, 0.2, 0, U.TAU); add(hd);
    for (const [x, y, r] of [[49, -11, 4.2], [43, -13, 3.6]]) { const k = new Path2D(); k.ellipse(x, Y(y), r, r * 1.15, 0.3, 0, U.TAU); add(k); }
    add(tube([[40, Y(3)], [33, Y(6)]], 8, 9));
    // torso, then the robe flowing back over the bent legs; three pointed tails at the hem
    add(splinePath([[36, Y(-2)], [22, Y(-5)], [8, Y(-4)], [-8, Y(-6)], [-26, Y(-14)], [-44, Y(-22) + Math.sin(ph + 1) * 3, 1],
      [-36, Y(-10)], [-58, Y(-8) + Math.sin(ph + 1.6) * 3, 1], [-42, Y(1)], [-60, Y(8) + Math.sin(ph + 2.2) * 3, 1],
      [-30, Y(8)], [-6, Y(12)], [14, Y(13)], [30, Y(10)]]));
    // the feet peeping from the hem, bent back
    add(tube([[-30, Y(-12)], [-40, Y(-26)], [-36, Y(-32)]], 6, 4));
    // arms: ahead and a little down, scattering flowers; the other bent up with a lotus
    add(tube([[32, Y(4)], [48, Y(12)], [64, Y(14)]], 6, 4.4));
    for (const [x, y] of [[74, 20], [82, 12], [79, 28]]) { const f = new Path2D(); f.ellipse(x, Y(y), 2.4, 2.1, 0, 0, U.TAU); add(f); }
    add(tube([[26, Y(-1)], [20, Y(-14)], [30, Y(-23)]], 5.6, 4.4));
    add(splinePath([[26, Y(-24)], [30, Y(-34)], [35, Y(-27)], [38, Y(-33)], [40, Y(-23)], [33, Y(-20)]]));
    // the 天衣: a loop arching over the head from shoulder to shoulder, its two ends streaming back
    const loop = [];
    for (let j = 0; j <= 10; j++) { const a = Math.PI * (j / 10); loop.push([36 - Math.cos(a) * 12, Y(-4 - Math.sin(a) * 24)]); }
    add(tube(loop, 4.6, 4.6));
    for (const [k, y0, L, amp] of [[0, -4, 190, 13], [1, 8, 150, 11]]) {
      const pts = [];
      for (let j = 0; j <= 16; j++) {
        const q = j / 16;
        const x = (k ? 30 : 24) - q * L;
        const y = y0 + (k ? 1 : -1) * 14 * Math.sin(Math.PI * Math.min(1, q * 2.2)) + Math.sin(q * 5.5 - ph * 1.1 + k * 2) * amp * Math.min(1, q * 1.6);
        pts.push([x, Y(y)]);
      }
      add(tube(pts, 5.8, 3.6));
    }
  }
  /** the 瑞雲 with its canopy and carriage; local, travelling toward +x (the head), tail streaming back */
  function cloudPaths(add, T) {
    const puff = (i) => 1 + 0.03 * Math.sin(T * 0.9 + i * 1.7);
    // the cushion: big curls on top, flat scalloped underside
    const lobes = [[-78, -4, 22], [-44, -16, 30], [-4, -22, 34], [38, -16, 30], [72, -4, 22], [96, 6, 14], [-96, 6, 14]];
    lobes.forEach(([x, y, r], i) => { const p = new Path2D(); p.ellipse(x, y, r * puff(i) * 1.15, r * 0.82 * puff(i + 2), 0, 0, U.TAU); add(p); });
    add(splinePath([[-104, 8], [-70, 20, 1], [-52, 14], [-34, 22, 1], [-14, 15], [6, 23, 1], [26, 15], [46, 22, 1], [66, 14], [88, 20, 1], [108, 8], [60, -2], [-60, -2]]));
    // curls (scroll ends) at the cloud's head and back
    for (const [x, y, s] of [[112, 0, 1], [-114, 2, -1]]) {
      const pts = [];
      for (let j = 0; j <= 10; j++) { const a = j / 10 * U.TAU * 0.8; pts.push([x + s * Math.sin(a) * (12 - j * 0.6), y - (1 - Math.cos(a)) * (10 - j * 0.5)]); }
      add(tube(pts, 9, 4));
    }
    // the canopy (羅蓋) on its pole, tassels swaying; the carriage beneath it
    const cx = 2;
    add(splinePath([[cx - 26, -30, 1], [cx + 26, -30, 1], [cx + 22, -66, 1], [cx - 22, -66, 1]]));        // carriage body
    add(splinePath([[cx - 32, -64, 1], [cx + 32, -64, 1], [cx + 26, -72, 1], [cx - 26, -72, 1]]));        // its roof
    add(tube([[cx, -72], [cx, -128]], 3.4, 3));
    add(splinePath([[cx - 50, -118], [cx - 24, -138], [cx, -146], [cx + 24, -138], [cx + 50, -118, 1], [cx + 30, -124], [cx, -132], [cx - 30, -124, 1]]));
    const fin = new Path2D(); fin.ellipse(cx, -151, 4.5, 5.5, 0, 0, U.TAU); add(fin);
    for (let j = -2; j <= 2; j++) {
      const sx = cx + j * 22, sw = Math.sin(T * 1.8 + j) * 2.5;
      add(tube([[sx, -121 + Math.abs(j) * 3], [sx + sw * 0.5, -104], [sx + sw, -90]], 2, 1.6));
      const b2 = new Path2D(); b2.ellipse(sx + sw, -87, 2.6, 3.4, 0, 0, U.TAU); add(b2);
    }
  }
  /**
   * The whole procession at T into a layer (stage coords). It pours out of the
   * window: the cloud's head from just under the window (132) down to (1060,560)
   * (139); the tennyo fly ahead and around it, heads leading down the path.
   */
  const DESCENT = Math.atan2(290, 170);          // the path's angle (down-right)
  const GLIDE = 0.46;                             // each tennyo glides down more gently than the cloud falls
  const TENNYO = [
    // [along, across, scale, extra rotation, delay] relative to the cloud head, in path coords
    [175, -30, 1.02, 0.1, 0], [125, 60, 0.94, -0.12, 0.25], [70, -105, 0.9, 0.18, 0.4], [30, 118, 0.96, -0.05, 0.1],
    [-45, -120, 0.86, 0.25, 0.55], [-60, 104, 0.9, -0.2, 0.7], [-150, -40, 0.82, 0.12, 0.85],
  ];
  function paintProcession(L, T) {
    const u = E.outSine(clamp01((T - 132) / 7));
    const head = [U.lerp(930, 1060, u), U.lerp(236, 560, u)];
    const dirx = Math.cos(DESCENT), diry = Math.sin(DESCENT);
    const Mc = new DOMMatrix().translate(head[0], head[1]).rotate(10).scale(1.05, 1.05);
    cloudPaths((p) => { const q = new Path2D(); q.addPath(p, Mc); L.fill(q); }, T);
    // the cloud's tail streams back up to the window it poured out of, thinning to a wisp
    {
      const a0 = Mc.transformPoint(new DOMPoint(-104, 2)), a = [a0.x, a0.y], z = [G.window.x - 6, G.window.y + G.window.r + 4];
      const d = unit(a, z), nm = [-d[1], d[0]], len = Math.hypot(z[0] - a[0], z[1] - a[1]);
      const pts = [];
      for (let j = 0; j <= 24; j++) {
        const q = j / 24;
        const bow = Math.sin(Math.PI * q) * 34 + Math.sin(q * 7 + T * 0.7) * 7 * q;
        pts.push([a[0] + d[0] * len * q + nm[0] * bow, a[1] + d[1] * len * q + nm[1] * bow]);
      }
      L.fill(tube(pts, 22, 2.2));
    }
    TENNYO.forEach(([a, c, s, r0, dl], i) => {
      // each drifts a little on its own (they settle round the cloud as it slows)
      const bob = Math.sin(T * 0.8 + i * 1.3) * 6;
      const lag = (1 - u) * 40 * dl;
      const px = head[0] + dirx * (a - lag) - diry * (c + bob), py = head[1] + diry * (a - lag) + dirx * (c + bob);
      const M = new DOMMatrix().translate(px, py).rotate((GLIDE + r0) * 180 / Math.PI).scale(s * 1.12, s * 1.12 * (i % 2 ? -1 : 1));
      tennyoPaths((p) => { const q = new Path2D(); q.addPath(p, M); L.fill(q); }, T, i);
    });
    return head;
  }

  /* ================================================================== */
  /* the ribbon of light (天の羽衣)                                        */
  /* ================================================================== */
  /** centreline from the window's lower rim down the stile, to her */
  function ribbonLine(T, cl) {
    const top = [G.stile, 266];
    const unf = E.inOutSine(clamp01((T - 136) / 3.8));
    if (unf <= 0) return null;
    // before the peel it ends at her seated shoulder; after, at the climber's waist;
    // once she has gone up past the rail it is drawn up after her
    const fw = io(T, 141.0, 141.3);
    const seat = [TK.x + 4, 800];
    const end = T < 140 ? seat : cl ? L2(seat, [cl.waist[0] - 20 * fw, cl.waist[1] - 74 * fw], io(T, 140, 140.5)) : [G.stile, 300];
    const N = 48, pts = [];
    for (let i = 0; i <= N; i++) {
      const s = (i / N) * unf;
      const bend = U.smoothstep(0.72, 1, s);
      const wave = Math.sin(s * U.TAU * 2 + T * 1.2) * 10 * Math.sin(Math.PI * s) * (1 - bend * 0.7);
      pts.push([U.lerp(top[0], end[0], bend) + wave, U.lerp(top[1], end[1], s)]);
    }
    return pts;
  }
  /** flat cloth: width pinches at each half-twist; 1 px 胡粉 edges on the wide faces; a split fluttering tip */
  function ribbonBand(pts, T, w0 = 18, w1 = 3.5) {
    const n = pts.length, Ls = [], Rs = [], Ws = [];
    for (let i = 0; i < n; i++) {
      const s = i / (n - 1);
      const t = unit(pts[Math.max(0, i - 1)], pts[Math.min(n - 1, i + 1)]);
      const nm = [-t[1], t[0]];
      const w = U.lerp(w0, w1, s) * Math.max(0.12, Math.abs(Math.cos(U.TAU * 1.5 * s + T * 0.9))) / 2;
      Ws.push(w);
      Ls.push([pts[i][0] + nm[0] * w, pts[i][1] + nm[1] * w]); Rs.push([pts[i][0] - nm[0] * w, pts[i][1] - nm[1] * w]);
    }
    return { Ls, Rs, Ws };
  }
  function drawRibbon(c, T, cl, fg) {
    if (T < 136 || T >= 148.35) return;
    let pts = ribbonLine(T, fg);
    if (!pts || pts.length < 3) return;
    const fade = 1 - U.seg(T, 148.0, 148.35);
    // after the peel its end winds round her (141.2–142.6): from her front shoulder down across
    // her body to her back at the hip — a band of light over the dark robe — and out behind her
    const side = pts.map(() => 1);
    const wind = fg ? io(T, 141.2, 142.6) : 0;
    if (wind > 0) {
      const [cx, cy] = fg.waist;
      const A = pts[pts.length - 1], Bk = [cx + 24, cy + 8];
      const tail = [Bk, [cx + 46, cy + 18 + Math.sin(T * 2.3) * 3], [cx + 68, cy + 40 + Math.sin(T * 2.3 - 0.8) * 5],
        [cx + 82, cy + 72 + Math.sin(T * 2.3 - 1.6) * 6], [cx + 90, cy + 108 + Math.sin(T * 2.3 - 2.4) * 7]];
      const ext = [];
      for (let j = 1; j <= 8; j++) ext.push(L2(A, Bk, j / 8));
      for (let i = 0; i < tail.length - 1; i++) {
        const p0 = tail[Math.max(0, i - 1)], p1 = tail[i], p2 = tail[i + 1], p3 = tail[Math.min(tail.length - 1, i + 2)];
        for (let j = 1; j <= 4; j++) {
          const t = j / 4, t2 = t * t, t3 = t2 * t;
          ext.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
        }
      }
      const m = Math.max(1, Math.round(ext.length * wind));
      for (let j = 0; j < m; j++) { pts.push(ext[j]); side.push(1); }
    }
    const band = ribbonBand(pts, T, 18, 6);
    const n = pts.length;
    const near = new Path2D(), far = new Path2D();
    for (let i = 0; i < n - 1; i++) {
      const P2 = side[i] > 0 && side[i + 1] > 0 ? near : far;
      P2.moveTo(band.Ls[i][0], band.Ls[i][1]); P2.lineTo(band.Ls[i + 1][0], band.Ls[i + 1][1]);
      P2.lineTo(band.Rs[i + 1][0], band.Rs[i + 1][1]); P2.lineTo(band.Rs[i][0], band.Rs[i][1]); P2.closePath();
    }
    // the split tip: two thin tails fluttering from the free end
    {
      const e = pts[n - 1], d = unit(pts[n - 3], e), nm = [-d[1], d[0]];
      const fl = Math.sin(T * 5.3) * 3, fl2 = Math.sin(T * 4.1 + 1) * 3;
      const tip = side[n - 1] > 0 ? near : far;
      tip.moveTo(band.Ls[n - 1][0], band.Ls[n - 1][1]);
      tip.lineTo(e[0] + d[0] * 16 + nm[0] * (4 + fl), e[1] + d[1] * 16 + nm[1] * (4 + fl));
      tip.lineTo(e[0] + d[0] * 3, e[1] + d[1] * 3);
      tip.lineTo(e[0] + d[0] * 13 - nm[0] * (4 + fl2), e[1] + d[1] * 13 - nm[1] * (4 + fl2));
      tip.lineTo(band.Rs[n - 1][0], band.Rs[n - 1][1]);
      tip.closePath();
    }
    PRINT.with(c, 'P7', T, (k) => {
      k.save();
      k.beginPath();
      k.rect(G.panels[0][0], G.top - 6, G.panels[3][1] - G.panels[0][0], G.bottom - G.top + 12);
      k.clip();
      k.globalAlpha *= fade;
      k.globalCompositeOperation = 'lighter';
      k.fillStyle = U.rgba(C.gofun, 0.66);
      if (cl && cl.clipOut) { k.save(); k.clip(cl.clipOut, 'evenodd'); k.fill(far); k.restore(); } else k.fill(far);
      k.fill(near);
      // the silk's bright edges where its broad face turns to us
      k.lineWidth = 1;
      for (const sd of [band.Ls, band.Rs]) {
        for (let i = 1; i < sd.length; i++) {
          const w = band.Ws[i];
          if (w < 3.2 || side[i] < 0) continue;
          k.strokeStyle = U.rgba(C.gofun, U.clamp((w - 3) / 5) * 0.55);
          k.beginPath(); k.moveTo(sd[i - 1][0], sd[i - 1][1]); k.lineTo(sd[i][0], sd[i][1]); k.stroke();
        }
      }
      k.restore();
    });
    // kira along its edges: slow travelling glints
    PRINT.with(c, 'P8', T, (k) => {
      k.globalCompositeOperation = 'lighter';
      k.globalAlpha *= fade;
      for (let j = 0; j < 7; j++) {
        const q = U.fract(T * 0.21 + j / 7);
        const i = Math.floor(q * (n - 1));
        if (band.Ws[i] < 2.5 || side[i] < 0) continue;
        const p = j % 2 ? band.Ls[i] : band.Rs[i];
        k.fillStyle = U.rgba(C.gofun, 0.6 * Math.sin(Math.PI * q));
        k.beginPath(); k.arc(p[0], p[1], 1.5, 0, U.TAU); k.fill();
      }
    });
  }

  /* ================================================================== */
  /* the 叢雲 over the window                                            */
  /* ================================================================== */
  function cloudX(T, layer) {
    // leading-edge keyframes [t, x]: the far and mid streaks pass first, then the near 墨
    // bank slams the window shut (148.6) and holds it until 152.0, gone by 152.4
    const K = [
      { w: 360, keys: [[148.15, 840], [148.5, 1000], [151.9, 1160], [152.6, 1420]] },
      { w: 380, keys: [[148.2, 840], [148.55, 1010], [151.9, 1170], [152.7, 1440]] },
      { w: 430, keys: [[148.4, 846], [148.6, 1078], [152.0, 1150], [152.4, 1500]] },
    ][layer];
    const k = K.keys;
    if (T < k[0][0] || T > k[k.length - 1][0]) return { on: false, cx: 0, w: K.w };
    let i = 0;
    while (i < k.length - 2 && T > k[i + 1][0]) i++;
    const u = (T - k[i][0]) / (k[i + 1][0] - k[i][0]);
    const ease = i === 1 ? E.linear : i === 0 ? E.outCubic : E.inCubic;
    const lead = U.lerp(k[i][1], k[i + 1][1], ease(U.clamp(u)));
    return { on: true, cx: lead - K.w / 2, w: K.w, lead };
  }
  /** the near bank: scalloped lobes (Yoshitoshi's black cloud) */
  function bankPath(cx, cy, w, h, seed) {
    const p = new Path2D();
    const r = U.rng(seed);
    const n = Math.round(w / 34);
    for (let i = 0; i < n; i++) {
      const x = cx - w / 2 + (i + 0.5) * (w / n);
      const e = Math.sin(Math.PI * (i + 0.5) / n);
      const rr = h * U.lerp(0.36, 0.52, r()) * (0.55 + 0.45 * e);
      p.moveTo(x + rr, cy - h * 0.12); p.arc(x, cy - h * 0.12, rr, 0, U.TAU);
      const r2 = rr * 0.7;
      p.moveTo(x + r2 + 8, cy + h * 0.22); p.arc(x + 8, cy + h * 0.22, r2, 0, U.TAU);
    }
    p.rect(cx - w / 2 + 16, cy - h * 0.15, w - 32, h * 0.4);
    return p;
  }
  /** a long flat streak (3–4× wider than tall), scalloped on its leading, lower edge */
  function streakPath(lead, cy, w, h, seed) {
    const r = U.rng(seed);
    const x0 = lead - w, pts = [];
    // top edge: nearly flat, a slight swell
    for (let i = 0; i <= 6; i++) pts.push([x0 + (w * i) / 6, cy - h * 0.5 - Math.sin(Math.PI * i / 6) * h * 0.18 + U.lerp(-1.5, 1.5, r())]);
    // the leading nose
    pts.push([lead + h * 0.35, cy - h * 0.1]);
    // bottom edge: scallops toward the lead, flattening toward the tail
    const nb = 7;
    for (let i = 0; i <= nb; i++) {
      const f = i / nb, x = lead - w * f;
      const sc = (1 - f) * h * 0.22 * (i % 2 ? 1 : -0.3);
      pts.push([x, cy + h * 0.5 + sc, i % 2 ? 0 : 1]);
    }
    return splinePath(pts);
  }
  /** fraction of the moon disc covered by the near cloud (32 samples) */
  function coverage(T) {
    const m = MOON.B(T);
    const nc = cloudX(T, 2);
    if (!nc.on) return 0;
    let hit = 0;
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * U.TAU * 3.1, rr = m.r * Math.sqrt((i + 0.5) / 32);
      const px = m.x + Math.cos(a) * rr;
      if (Math.abs(px - nc.cx) < nc.w / 2 - 24) hit++;
    }
    return hit / 32;
  }
  function drawClouds(c, T, part) {
    if (T < 148.1 || T > 152.75) return;
    c.save();
    SB.windowClip(c);
    if (part !== 'near') {
    // far 鼠 and mid 銀鼠 streaks (a bokashi on their trailing ends), then the near 墨 bank
    for (const [i, plate, col, cy, h, seed] of [[0, 'P4', C.nezumi, 218, 46, 5], [1, 'P4', C.ginnezu, 84, 40, 9]]) {
      const cl = cloudX(T, i);
      if (!cl.on) continue;
      const path = streakPath(cl.lead, cy, cl.w, h, seed);
      PRINT.with(c, plate, T, (k) => {
        const g = k.createLinearGradient(cl.lead - cl.w, 0, cl.lead, 0);
        g.addColorStop(0, U.rgba(col, 0));
        g.addColorStop(0.35, U.rgba(col, 0.9));
        g.addColorStop(1, U.rgba(col, 0.95));
        k.fillStyle = g;
        k.fill(path);
      });
    }
    }
    const cl = cloudX(T, 2);
    if (cl.on && part !== 'far') {
      const path = bankPath(cl.cx, 150, cl.w, 280, 13);
      const m = MOON.B(T);
      const dir = m.x > cl.cx ? 1 : -1;
      PRINT.with(c, 'P7', T, (k) => {            // 胡粉 rim on the edge toward the hidden moon
        k.save(); k.translate(dir * 3.5, -1.5);
        k.fillStyle = U.rgba(C.gofun, 0.55); k.fill(path);
        k.restore();
      });
      PRINT.with(c, 'K', T, (k) => { k.fillStyle = C.sumi; k.fill(path); });
    }
    c.restore();
  }
  /** 118–121.3: a thin veil lies over the moon and draws off to the right — the rim arrives */
  function drawVeil(c, T) {
    if (T > 121.6) return;
    const u = io(T, 119.6, 121.4);
    const m = MOON.B(T);
    const lead = U.lerp(m.x + m.r + 30, m.x + m.r + 490, u);
    c.save();
    SB.windowClip(c);
    PRINT.with(c, 'P4', T, (k) => {
      const w = 420;
      const g = k.createLinearGradient(lead - w, 0, lead, 0);
      g.addColorStop(0, U.rgba(U.mix(C.kon, C.nezumi, 0.5), 0.5));
      g.addColorStop(0.7, U.rgba(U.mix(C.kon, C.nezumi, 0.5), 0.94));
      g.addColorStop(1, U.rgba(U.mix(C.kon, C.nezumi, 0.5), 0.9));
      k.fillStyle = g;
      k.fill(streakPath(lead, m.y + 4, w, m.r * 2 + 44, 21));
    });
    c.restore();
  }

  /* ================================================================== */
  /* Shot B: the shadows on the paper                                    */
  /* ================================================================== */
  /** the offerings still-life (panel 1, 五: the moon is high, the shadow falls short and low) */
  function offeringsPath(T) {
    const x = 352, y = 958, s = 0.95;
    const p = new Path2D();
    const q = new Path2D();
    q.rect(-2, -30, 74, 6);
    q.moveTo(0, -24); q.lineTo(70, -24); q.lineTo(64, -18); q.lineTo(6, -18); q.closePath();
    q.moveTo(10, -18); q.lineTo(60, -18); q.lineTo(64, 0); q.lineTo(6, 0); q.closePath();
    const r = 8.2;
    for (const [n, k] of [[3, 0], [2, 1], [1, 2]]) for (let i = 0; i < n; i++) {
      const cx = 35 + (i - (n - 1) / 2) * r * 2.05, cy = -30 - r - k * r * 1.6;
      q.moveTo(cx + r, cy); q.arc(cx, cy, r, 0, U.TAU);
    }
    q.moveTo(120, 0); q.bezierCurveTo(106, -8, 104, -40, 120, -52); q.lineTo(122, -64); q.lineTo(138, -64); q.lineTo(140, -52);
    q.bezierCurveTo(156, -40, 154, -8, 140, 0); q.closePath();
    const sway = Math.sin(T * 0.9) * 0.6 + U.wobble(T * 0.4, 7) * 0.5;
    const rr = U.rng(84);
    for (const [a0, L, side] of [[-0.4, 160, -1], [-0.1, 186, 1], [0.14, 170, 1], [0.38, 144, 1]]) {
      const a = a0 + sway * 0.014;
      const bx = 130, by = -62;
      const tx = bx + Math.sin(a) * L, ty = by - Math.cos(a) * L;
      const stem = B.qpts(bx, by, bx + Math.sin(a * 0.5) * L * 0.5, by - L * 0.62, tx, ty, 10);
      for (let i = 0; i < stem.length - 1; i++) { const [x0, y0] = stem[i], [x1, y1] = stem[i + 1]; q.moveTo(x0 - 1, y0); q.lineTo(x1 - 0.8, y1); q.lineTo(x1 + 0.8, y1); q.lineTo(x0 + 1, y0); q.closePath(); }
      for (let k = 0; k < 10; k++) {
        const u = U.lerp(0.62, 1, k / 9);
        const p0 = stem[Math.round(u * (stem.length - 1))];
        const hl = U.lerp(32, 16, (u - 0.62) / 0.38) * U.lerp(0.8, 1.15, rr());
        const ang = a + side * U.lerp(0.5, 1.5, (u - 0.62) / 0.38) + U.lerp(-0.15, 0.15, rr());
        const e = [p0[0] + Math.sin(ang) * hl, p0[1] - Math.cos(ang) * hl];
        const nx = -Math.cos(ang) * 0.9, ny = -Math.sin(ang) * 0.9;
        q.moveTo(p0[0] + nx, p0[1] + ny); q.lineTo(e[0], e[1]); q.lineTo(p0[0] - nx, p0[1] - ny); q.closePath();
      }
    }
    p.addPath(q, new DOMMatrix().translate(x, y).scale(s, s));
    return p;
  }

  /** たけ's seated figure (118–140) */
  function seatedFigure(T) {
    const R = seatedRig(T);
    return figure(R, rigMatrix(TK.x, TK.y, TK.s, 1, 0), T);
  }
  /** the climber's figure (140–148.45): matrix with the peel's shear and the puppet's turn */
  function climberFigure(st) {
    const sx = Math.abs(st.fx) < 0.05 ? (st.fx < 0 ? -0.05 : 0.05) : st.fx;
    const M = rigMatrix(st.x, st.y, TK.s, sx, st.skew);
    return figure(st.R, M, st.T);
  }

  function shadowsB(c, T, st, cfg) {
    // the climber (140–148.2 on the paper): soft while she peels away, then sharp against the kumiko.
    // While she still overlaps the child (to 141.35) her layer is merged into the child's (one
    // union, no seam, no compounding); afterwards she is printed on her own.
    let Lc = null, merge = false;
    if (st && !st.inWin && cfg) {
      const soft = st.pen > 0.3;
      const res = soft ? U.lerp(0.9, 0.24, clamp01(st.pen / 6)) : null;
      const xs = [cfg.headC[0], cfg.hands[0][0], cfg.hands[1][0], cfg.hem[0], cfg.shoulder[0], cfg.hip[0]];
      const bb = [Math.min(...xs) - 90, Math.max(G.top - 10, Math.min(cfg.headC[1], cfg.hands[0][1], cfg.hands[1][1]) - 60),
        Math.max(...xs) + 120, G.bottom];
      Lc = soft ? SB.softLayer(c, 'climb', bb, res) : SB.sharpLayer(c, 'climb', bb);
      paintFigure(Lc, cfg);
      merge = T < 141.35;
    }
    // ---------- far from the paper: the procession of the celestials (132–148.5) ----------
    if (T >= 132 && T < 148.9) {
      const a = 0.72 * U.seg(T, 132, 132.8) * (1 - 0.66 * io(T, 139, 140)) * (1 - U.seg(T, 147.9, 148.8));
      const u = E.outSine(clamp01((T - 132) / 7));
      const hx = U.lerp(930, 1060, u), hy = U.lerp(236, 560, u);
      const reg = [Math.max(G.panels[0][0], hx - 420), G.top, Math.min(G.panels[3][1], hx + 420), Math.min(G.bottom, hy + 380)];
      const far = SB.softLayer(c, 'far', reg, 0.5);
      paintProcession(far, T);
      // where she climbs through them, her own shadow is the shadow (they never compound)
      if (Lc) {
        const RC = Lc.canvas.__region;
        far.save(); far.globalCompositeOperation = 'destination-out';
        far.drawImage(Lc.canvas, 0, 0, RC.w, RC.h, RC.x0, RC.y0, RC.w / RC.s, RC.h / RC.s);
        far.restore();
      }
      SB.softPrint(c, T, 'far', { alpha: a });
    }
    // ---------- against the paper: offerings, たけ with the haori, 小夜 ----------
    SB.sharpFill(c, T, [[offeringsPath(T), 'nonzero']]);
    // (after the peel only the child and the haori remain here: a small layer)
    const region = T >= 141.35 ? [CH.x - 20, 846, CH.x + 290, G.bottom] : [TK.x - 212, 480, CH.x + 290, G.bottom];
    const seatA = T < 140 ? 1 : 0;
    let haori = null, seatFg = null;
    const L = SB.sharpLayer(c, 'seat', region);
    // the child, and the haori laid over her (from 126 the haori moves; after 128.2 it rests on her)
    CAST.child(L, CH.x, CH.y, CH.s, { pose: 'sleep', haori: false, silhouette: AINEZU, t: T });
    if (seatA > 0) {
      seatFg = seatedFigure(T);
      paintFigure(L, seatFg);
      haori = haoriShape(T, seatFg);
    } else {
      // after the peel the haori rests on the child
      haori = haoriShape(Math.max(T, 128.3), seatedFigure(128.3));
    }
    if (haori) L.fill(haori.path);
    if (Lc && merge) {
      const RC = Lc.canvas.__region;
      L.save();
      L.imageSmoothingEnabled = true; L.imageSmoothingQuality = 'medium';
      L.drawImage(Lc.canvas, 0, 0, RC.w, RC.h, RC.x0, RC.y0, RC.w / RC.s, RC.h / RC.s);
      L.restore();
    }
    SB.softPrint(c, T, 'seat', { mode: 'multiply' });
    if (Lc && !merge) SB.softPrint(c, T, 'climb', { mode: 'multiply' });
    // the silk transmits its pattern while held up (124–126): only where silk alone stands before the light
    const silk = U.env(T, 123.9, 124.3, 125.8, 126.3);
    if (silk > 0.001 && haori && seatFg) {
      if (!silkTile) buildSilk();
      const S2 = SB.sharpLayer(c, 'silk', region);
      S2.save();
      S2.clip(haori.path);
      const pat = S2.createPattern(silkTile, 'repeat');
      const f = haori.frame;
      pat.setTransform(new DOMMatrix().translate(f.mid[0] - 48, f.mid[1] + 4).scale(0.66, 0.66));
      S2.fillStyle = pat;
      S2.fillRect(f.mid[0] - 140, f.mid[1] - 10, 280, 180);
      S2.restore();
      // her own body is solid shadow in front of it
      S2.save();
      S2.globalCompositeOperation = 'destination-out';
      for (const p of seatFg.parts) S2.fill(p);
      S2.restore();
      SB.softPrint(c, T, 'silk', { mode: 'source-over', plate: 'P7', alpha: 0.46 * silk });
    }
  }

  /** the climber small and dark against the moon, absorbed (148.2–148.45) */
  function climberInWindow(c, T, st) {
    if (!st || !st.inWin) return;
    const m = MOON.B(T);
    const q = clamp01((T - 148.2) / 0.25);
    const s = U.lerp(0.22, 0.03, E.inQuad(q)) * TK.s;
    // from the window's lower rim into the disc's centre
    const y0 = G.window.y + G.window.r - 6;
    const px = U.lerp(G.stile + 6, m.x, E.outSine(q)), py = U.lerp(y0, m.y + 10, E.outSine(q));
    const R = st.R;
    const M = new DOMMatrix([-s, 0, 0, s, px + s * R.H[0], py - s * R.H[1]]);
    const fg = figure(R, M, T);
    c.save();
    SB.windowClip(c);
    PRINT.with(c, 'P4', T, (k) => {
      k.globalAlpha *= 1 - E.inQuad(clamp01((q - 0.55) / 0.45));
      k.globalCompositeOperation = 'multiply';
      k.fillStyle = U.mix(AINEZU, C.sumi, 0.25);
      for (const p of fg.parts) k.fill(p);
      if (fg.hair) k.fill(fg.hair);
    });
    c.restore();
  }

  /** she is absorbed by the disc: a kira pinpoint (148.4), its rays crossing onto the sky */
  function kiraPin(c, T) {
    const pin = U.env(T, 148.32, 148.42, 148.5, 148.9);
    if (pin <= 0) return;
    const m = MOON.B(T);
    c.save();
    SB.windowClip(c);
    PRINT.with(c, 'P8', T, (k) => {
      k.globalCompositeOperation = 'lighter';
      const g = k.createRadialGradient(m.x, m.y, 0, m.x, m.y, 40);
      g.addColorStop(0, U.rgba(C.gofun, 0.95 * pin));
      g.addColorStop(0.2, U.rgba(C.gofun, 0.4 * pin));
      g.addColorStop(1, U.rgba(C.gofun, 0));
      k.fillStyle = g;
      k.fillRect(m.x - 40, m.y - 40, 80, 80);
      // four long thin rays, tapering, reaching past the rim onto the 紺
      for (const [a, L] of [[0, 128], [Math.PI / 2, 116], [Math.PI, 128], [-Math.PI / 2, 116]]) {
        const d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]], len = L * pin;
        k.fillStyle = U.rgba(C.gofun, 0.7 * pin);
        k.beginPath();
        k.moveTo(m.x + n[0] * 1.6, m.y + n[1] * 1.6);
        k.lineTo(m.x + d[0] * len, m.y + d[1] * len);
        k.lineTo(m.x - n[0] * 1.6, m.y - n[1] * 1.6);
        k.closePath(); k.fill();
      }
    });
    c.restore();
  }

  /** cells flash 胡粉 as her hands pass them (each grab 141.2–147) */
  const GRABS = (() => {
    const g = [];
    for (const key of ['N', 'F']) for (let i = 1; i < HANDS[key].length; i++) g.push({ t: HANDS[key][i][1], y: HANDS[key][i][2] });
    g.push({ t: 141.2, y: 615 }, { t: 141.2, y: 730 });
    return g;
  })();
  function cellFlashes(c, T) {
    if (T < 141.1 || T > 147.4) return;
    PRINT.with(c, 'P7', T, (k) => {
      k.globalCompositeOperation = 'lighter';
      for (const gr of GRABS) {
        const age = T - gr.t;
        if (age < 0 || age > 0.35) continue;
        const a = Math.sin(Math.PI * age / 0.35);
        // the cell just above the gripped rung, both sides of the stile
        const row = Math.floor((gr.y - 12 - G.top) / 115);
        if (row < 0 || row > 5) continue;
        for (const [p, col, w] of [[1, 2, 1], [2, 0, 0.6]]) {
          const [x, y, cw, ch] = SB.cell(p, col, row);
          k.fillStyle = U.rgba(C.gofun, 0.36 * a * w);
          k.fillRect(x, y, cw, ch);
        }
      }
    });
  }

  function drawB(ctx, T) {
    const cov = coverage(T);
    const dark = Math.max(cov, U.env(T, 148.5, 148.65, 151.95, 152.4) * 0.97);
    const st = climberState(T);
    const cfg = st && !st.inWin ? climberFigure(st) : null;
    if (cfg) {
      // the climber's silhouette as a clip for the ribbon's far half (evenodd: everything but her)
      const co = new Path2D();
      co.rect(0, 0, 1920, 1080);
      for (const p of cfg.parts) co.addPath(p);
      st.clipOut = co;
    }
    SB.draw(ctx, T, {
      // a flat 紺 under the window, printed with the (still) key block: when the sky
      // plate drifts in the tears its edge shows as a colour shift, not bare paper
      under: (c) => {
        PRINT.with(c, 'K', T, (k) => {
          k.fillStyle = SB.INK.WOOD;
          k.beginPath(); k.arc(G.window.x, G.window.y, G.window.r + G.window.rim + 8, 0, U.TAU); k.fill();
          k.fillStyle = U.mix(C.kon, C.sumi, 0.25);
          k.beginPath(); k.arc(G.window.x, G.window.y, G.window.r + 1, 0, U.TAU); k.fill();
        });
      },
      between: {
        base: (c) => {
          // the sky behind the reeds: the moon (and at the CLICK its glaze lifts for a breath), her last ascent, the 叢雲
          const lift = U.env(T, 148.36, 148.42, 148.5, 148.62);
          SB.moonInWindow(c, T, { halo: 0.55 + 0.35 * lift });
          if (lift > 0) {
            const m = MOON.B(T);
            c.save(); SB.windowClip(c);
            PRINT.with(c, 'P7', T, (k) => {
              k.globalCompositeOperation = 'lighter';
              k.fillStyle = U.rgba(C.gofun, 0.3 * lift);
              k.beginPath(); k.arc(m.x, m.y, m.r * 1.15, 0, U.TAU); k.fill();
            });
            c.restore();
          }
          drawVeil(c, T);
          climberInWindow(c, T, st);
          drawClouds(c, T, 'far');
          kiraPin(c, T);
          drawClouds(c, T, 'near');
          // on the paper: the light, every shadow, the flashing cells
          SB.light(c, T, { r: 260, falloff: 0.5, dim: dark });
          shadowsB(c, T, st, cfg);
          cellFlashes(c, T);
        },
        ink: (c) => {
          SB.tokonomaShade(c, T, 1.087);
          // under the black cloud the whole room goes dark: the plaster and the tatami too
          if (dark > 0.002) {
            PRINT.with(c, 'K', T, (k) => {
              k.fillStyle = U.rgba(C.sumi, 0.72 * dark);
              k.beginPath();
              k.rect(G.wall.x0 - 20, 24, G.wall.x1 - G.wall.x0 + 40, G.lintel[1] - 24);
              k.moveTo(G.window.x + G.window.r + G.window.rim + 4, G.window.y);
              k.arc(G.window.x, G.window.y, G.window.r + G.window.rim + 4, 0, U.TAU, true);
              k.fill('evenodd');
              k.fillStyle = U.rgba(C.sumi, 0.66 * dark);
              k.fillRect(0, G.sill[0], 1920, 1080 - G.sill[0]);
            });
          }
          drawRibbon(c, T, st, cfg);
        },
      },
    });
  }

  /* ================================================================== */
  /* Shot A′ (155–160): the colour drain                                  */
  /* ================================================================== */
  const AP = { x: 1120, y: 950, s: 1.65, f: -1 };    // たけ, her back against the post, 小夜 in her lap (facing left)
  let figs = null;                                     // { k, colour, drained, alone, child: {bow, contact}, x, y, w, h }
  function buildFigures(k) {
    const x0 = 740, y0 = 640, w = 480, h = 330;        // logical box round the pair
    const mk = () => { const cv = B.canvas(Math.ceil(w * k), Math.ceil(h * k)); const cx = cv.getContext('2d'); cx.setTransform(k, 0, 0, k, -x0 * k, -y0 * k); return [cv, cx]; };
    // (the lap pose's little obi-age pill is replaced by the heko-obi bow drawn below)
    const pal = { obijime: EBICHA, child: Object.assign({}, CAST.palettes.sayo, { obiage: C.kon }) };
    // the pair in colour; the pair drained (たけ to 月白/胡粉/銀鼠 — the child and the haori keep their colour)
    const [colour, cc] = mk();
    const ret = CAST.grandma(cc, AP.x, AP.y, AP.s, { pose: 'lap', facing: AP.f, t: 0.3, palette: pal });
    const [drained, dc] = mk();
    CAST.grandma(dc, AP.x, AP.y, AP.s, { pose: 'lap', facing: AP.f, drained: true, ink: C.ginnezu, t: 0.3, palette: { child: pal.child } });
    // たけ alone (drained) — the kira of the drain front glints only on her
    const [alone, ac] = mk();
    CAST.grandma(ac, AP.x, AP.y, AP.s, { pose: 'lap', facing: AP.f, drained: true, child: false, t: 0.3 });
    // the child's silhouette for her floor shadow (the sleeping child + the haori over her, as the lap pose lays her)
    const [kid, kc] = mk();
    const head = ret && ret.child && ret.child.head ? ret.child.head : [AP.x - 60, AP.y - 60];
    // sleepingChild is drawn at the knee in the grandma's local units; CAST.child 'sleep' anchors
    // its head 6 units above (x, y−12): place it so the heads coincide
    CAST.child(kc, head[0], head[1] + 18 * AP.s, AP.s, { pose: 'sleep', facing: AP.f, haori: true, silhouette: '#000', t: 0.3 });
    // the heko-obi bow, tied at her back: its loops push up out from under the haori at the hip
    const bow = [head[0] + AP.f * 60 * AP.s, head[1] - 14 * AP.s];
    // her lowest pixels (the contact line of the child's shadow)
    figs = { k, colour, drained, alone, kid, bow, head, x: x0, y: y0, w, h };
  }

  /** the A′ offerings: 三方 with fourteen dango, the jug of autumn grasses (colour) */
  function drawOfferingsA(c, T, shadowOnly) {
    const bx = 560, by = 944;
    const sway = Math.sin(T * 0.9) * 0.5;
    const s = 1.25;
    c.save();
    c.translate(bx, by); c.scale(s, s);
    const ink = U.rgba(C.sumi, 0.85);
    const wood = U.mix(C.kinari, C.odo, 0.3);
    const tray = () => { c.beginPath(); c.moveTo(-34, -30); c.lineTo(34, -30); c.lineTo(30, -24); c.lineTo(-30, -24); c.closePath(); };
    const base = () => { c.beginPath(); c.moveTo(-24, -24); c.lineTo(24, -24); c.lineTo(28, 0); c.lineTo(-28, 0); c.closePath(); };
    c.fillStyle = shadowOnly ? '#000' : wood;
    base(); c.fill(); tray(); c.fill();
    if (!shadowOnly) {
      c.strokeStyle = ink; c.lineWidth = 1.1;
      base(); c.stroke(); tray(); c.stroke();
      c.fillStyle = U.rgba(C.sumi, 0.75);
      c.beginPath(); c.ellipse(0, -12, 9, 4, 0, 0, U.TAU); c.fill();
    }
    const r = 6.2;
    for (const [n, k] of [[3, 0], [2, 1], [1, 2]]) for (let i = 0; i < n; i++) {
      const cx = (i - (n - 1) / 2) * r * 2.05, cy = -30 - r - k * r * 1.55;
      c.fillStyle = shadowOnly ? '#000' : C.gofun;
      c.beginPath(); c.arc(cx, cy, r, 0, U.TAU); c.fill();
      if (!shadowOnly) { c.strokeStyle = U.rgba(C.sumi, 0.55); c.lineWidth = 0.8; c.stroke(); }
    }
    const jx = 62;
    c.fillStyle = shadowOnly ? '#000' : U.mix(C.nezumi, C.sumi, 0.25);
    c.beginPath(); c.moveTo(jx - 10, 0); c.bezierCurveTo(jx - 22, -8, jx - 22, -34, jx - 8, -42); c.lineTo(jx - 7, -52); c.lineTo(jx + 7, -52); c.lineTo(jx + 8, -42);
    c.bezierCurveTo(jx + 22, -34, jx + 22, -8, jx + 10, 0); c.closePath(); c.fill();
    if (!shadowOnly) { c.strokeStyle = ink; c.lineWidth = 1; c.stroke(); c.strokeStyle = U.rgba(C.ginnezu, 0.5); c.beginPath(); c.moveTo(jx - 12, -30); c.quadraticCurveTo(jx - 14, -16, jx - 8, -6); c.stroke(); }
    const stemCol = shadowOnly ? '#000' : C.matsuba;
    for (const [a0, L] of [[-0.35, 120], [-0.05, 138], [0.2, 126], [0.45, 104]]) {
      const a = a0 + sway * 0.01;
      const tx = jx + Math.sin(a) * L, ty = -50 - Math.cos(a) * L;
      c.strokeStyle = stemCol; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(jx, -50); c.quadraticCurveTo(jx + Math.sin(a) * L * 0.4, -50 - L * 0.6, tx, ty); c.stroke();
      c.strokeStyle = shadowOnly ? '#000' : U.rgba(C.susuki, 0.95);
      c.lineWidth = 1;
      for (let kk = 0; kk < 8; kk++) {
        const u = kk / 7;
        const px = U.lerp(jx + Math.sin(a) * L * 0.72, tx, u), py = U.lerp(-50 - Math.cos(a) * L * 0.72, ty, u);
        c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + 6, py + 2, px + 10 + kk * 0.6, py + 9); c.stroke();
      }
    }
    if (!shadowOnly) {
      c.strokeStyle = C.matsuba; c.lineWidth = 1;
      c.beginPath(); c.moveTo(jx - 4, -50); c.quadraticCurveTo(jx - 40, -110, jx - 70, -80); c.stroke();
      const hg = B.qpts(jx - 4, -50, jx - 40, -110, jx - 70, -80, 10);
      for (let i = 3; i < hg.length; i++) {
        c.fillStyle = C.matsuba; c.beginPath(); c.ellipse(hg[i][0] - 3, hg[i][1] + 3, 3.2, 1.6, 0.6, 0, U.TAU); c.fill();
        if (i % 2) { c.fillStyle = C.hagi; c.beginPath(); c.arc(hg[i][0] + 1, hg[i][1] + 5, 2, 0, U.TAU); c.fill(); }
      }
      c.fillStyle = C.yamabuki;
      for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(jx + 20 + (i % 3) * 3, -118 + Math.floor(i / 3) * 3, 1.5, 0, U.TAU); c.fill(); }
      c.fillStyle = C.kikyo;
      for (const [sx, sy] of [[jx + 26, -96], [jx + 16, -104]]) {
        c.beginPath();
        for (let i = 0; i < 10; i++) { const rr = i % 2 ? 2 : 5; const an = (i / 10) * U.TAU; c.lineTo(sx + Math.cos(an) * rr, sy + Math.sin(an) * rr); }
        c.closePath(); c.fill();
      }
    }
    c.restore();
  }

  /** 小夜's soft 紅絞り heko-obi bow, seen at her back past the haori's edge (P2) */
  function drawBow(c, x, y, s, T) {
    const sw = Math.sin(T * 0.8) * 0.4;
    c.save();
    c.translate(x, y); c.scale(s, s);
    c.fillStyle = C.beni;
    for (const dir of [-1, 1]) {
      c.beginPath();
      c.moveTo(dir * 3, -3);
      c.bezierCurveTo(dir * 11, -13, dir * 27, -12, dir * 29, -2 + sw);
      c.bezierCurveTo(dir * 31, 7, dir * 21, 11, dir * 11, 7);
      c.bezierCurveTo(dir * 6, 5, dir * 4, 4, dir * 3, 3);
      c.closePath(); c.fill();
    }
    for (const [dir, L] of [[-1, 30], [1, 24]]) {
      c.beginPath();
      c.moveTo(dir * 2, 3);
      c.bezierCurveTo(dir * 9, 11, dir * 8, L * 0.6, dir * 12 + sw, L);
      c.lineTo(dir * 4 + sw, L + 2);
      c.bezierCurveTo(dir * 3, L * 0.6, 0, 11, dir * -2, 4);
      c.closePath(); c.fill();
    }
    c.beginPath(); c.ellipse(0, 1, 5.5, 5, 0, 0, U.TAU); c.fill();
    // shibori: small resist rings
    c.fillStyle = U.rgba(U.mix(C.beni, C.gofun, 0.55), 0.7);
    const r = U.rng(911);
    for (let i = 0; i < 34; i++) {
      const dir = r() < 0.5 ? -1 : 1;
      const px = dir * U.lerp(7, 26, r()), py = U.lerp(-8, 6, r());
      c.beginPath(); c.arc(px, py, 0.9, 0, U.TAU); c.fill();
    }
    c.strokeStyle = U.rgba(C.sumi, 0.6);
    c.lineWidth = 0.8 / s * 1.2;
    for (const dir of [-1, 1]) {
      c.beginPath();
      c.moveTo(dir * 3, -3); c.bezierCurveTo(dir * 11, -13, dir * 27, -12, dir * 29, -2 + sw); c.bezierCurveTo(dir * 31, 7, dir * 21, 11, dir * 11, 7);
      c.stroke();
    }
    c.restore();
  }

  function drawAprime(ctx, T) {
    const k = ctx.canvas.width / 1920;
    if (!figs || Math.abs(figs.k - k) > 1e-6) buildFigures(k);
    SA.draw(ctx, T, {
      between: {
        post: (c) => {
          // floor shadows: the offerings and the child — never the grandmother
          SA.castShadow(c, T, (s2) => drawOfferingsA(s2, T, true), { baseY: 944, alpha: 0.55, len: 1.3, bbox: [500, 700, 740, 946] });
          SA.castShadow(c, T, (s2) => {
            s2.drawImage(figs.kid, figs.x, figs.y, figs.w, figs.h);
          }, { baseY: 934, alpha: 0.6, len: 1.25, bbox: [figs.x, 850, figs.x + figs.w, 942] });
        },
        eave: (c) => {
          PRINT.with(c, 'K', T, (k2) => drawOfferingsA(k2, T, false));
          drainedPair(c, T);
        },
      },
    });
  }

  /** the pair, draining top → bottom (155.4–157.8) */
  function drainedPair(c, T) {
    const u = clamp01((T - 155.4) / 2.4);
    const yTop = 715, yBot = 960;
    const front = U.lerp(yTop - 12, yBot + 12, E.inOutSine(u));
    PRINT.with(c, 'K', T, (k2) => {
      k2.drawImage(figs.drained, figs.x, figs.y, figs.w, figs.h);
      if (u < 1) {
        // the colour survives below the front (feathered 36 px)
        const b = SB.sharpLayer(k2, 'drain', [figs.x, figs.y, figs.x + figs.w, figs.y + figs.h], 1);
        b.drawImage(figs.colour, figs.x, figs.y, figs.w, figs.h);
        b.globalCompositeOperation = 'destination-in';
        const g = b.createLinearGradient(0, front - 18, 0, front + 18);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,1)');
        b.fillStyle = g;
        b.fillRect(figs.x, figs.y, figs.w, figs.h);
        b.globalCompositeOperation = 'source-over';
        SB.softPrint(k2, T, 'drain', { mode: 'source-over', plate: 'K', clip: false });
      }
    });
    // the heko-obi bow stays bright (P2)
    PRINT.with(c, 'P2', T, (k2) => drawBow(k2, figs.bow[0], figs.bow[1], 0.52, T));
    // kira along the front, only on her
    if (u > 0 && u < 1) {
      const kb = SB.sharpLayer(c, 'drainKira', [figs.x, figs.y, figs.x + figs.w, figs.y + figs.h], 1);
      const r = U.rng(1557);
      for (let i = 0; i < 26; i++) {
        const x = U.lerp(figs.x + 60, figs.x + figs.w - 40, r());
        const tw = 0.5 + 0.5 * Math.sin(T * 9 + i * 2.1);
        kb.fillStyle = U.rgba(C.gofun, 0.8 * tw);
        kb.beginPath(); kb.arc(x, front + U.lerp(-7, 7, r()), U.lerp(0.9, 1.9, r()), 0, U.TAU); kb.fill();
      }
      kb.save();
      kb.setTransform(1, 0, 0, 1, 0, 0);
      kb.globalCompositeOperation = 'destination-in';
      kb.drawImage(figs.alone, 0, 0, figs.alone.width, figs.alone.height, 0, 0, kb.canvas.__region.w, kb.canvas.__region.h);
      kb.restore();
      SB.softPrint(c, T, 'drainKira', { mode: 'lighter', plate: 'P8', clip: false });
    }
  }

  /* ------------------------------------------------------------------ */
  TSUKI.scene('ama-no-hagoromo', {
    init(S) {
      buildSilk();
      try { buildFigures(S.k || 1); } catch (e) { figs = null; }
      TSUKI.SHOTS.warmFlat('B', 130, S.k || 1);
      TSUKI.SHOTS.warmFlat('A_prime', 156, S.k || 1);
    },
    draw(ctx, t, S) {
      const T = S.seg.start + t;
      // a clean context whatever the previous scene left behind (the engine resets only some state)
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'low';
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      ctx.miterLimit = 10;
      if (T < CUT) drawB(ctx, T);
      else drawAprime(ctx, T);
    },
  });
})(window.TSUKI);
