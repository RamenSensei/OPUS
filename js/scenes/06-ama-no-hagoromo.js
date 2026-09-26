/* ==========================================================================
   06-ama-no-hagoromo.js — 五 天の羽衣 (T 118–160) · THE CLIMAX
   Shot B (118–155), then Shot A′ (155–160).

   118  through the mist wipe: the glow has climbed to the top rail; a thin
        veil of cloud lies over the moon in the window and draws off at 121
        (its rim "enters" — the moon clock already has it half inside)
   122.5 たけ's shadow slips off her haori (the letter writes itself, DOM)
   124–126 she holds it up against the moon: its 波兎 shines through
   126–128.5 she lays it over the sleeping child; the shadows merge
   132  shadows cast by nothing: a 霊芝雲 pours out of the window and slides
        down panels 2–3 carrying a canopied carriage (CAST's 鳳輦, its bearers
        on the cloud), seven tennyo flying round it — two blocks, both carved
        crisp: the cloud one flat pale pull (α .55, a second pull 6 px lower
        for depth), the carriage and tennyo darker (α .75); ×⅓ at 140
   136–139.8 the ribbon of light (天の羽衣) unfurls down the central stile
   140  CULMINATION: the moon centred in the window. Her shadow peels off
        the paper (skew, penumbra), stands, straightens (老いをせず), and
        turns to the lattice like a paper puppet turned over: her profile
        narrows to an edge (141.03) and opens again as her BACK — the 十二単
        from behind, the great sleeves, the 裳, the black fall of her hair
   141.2–145.4 she climbs the kumiko hand over hand, every grip on a bar
        (the rungs, last the top rail), the paper glinting along each bar she
        takes; her hair lengthens into
        Heian hair; the ribbon runs down the stile behind her and winds round
        her waist; PRINT tears every plate (140–147.8)
   146.35–147 she looks back once over her right shoulder, slowly, to the
        child: her profile comes out of the round of her hair (the hero,
        147; her hair and the ribbon's end follow the turn late; a held
        breath to 147.8)     147.8 CLICK: a cold 0.2 s — she faces the moon
        again, forgotten
   148.05–149.0 she is drawn up the paper and out past the top rail (a slow
        lift, never a yank: ≤ 800 px/s); 148.95–149.5 small and dark against
        the moon she is absorbed (kira 149.42); the 墨 叢雲 closes over the
        window (149.3–149.65): the whole room dims with it, and holds dark
   151.95–152.45 the cloud passes, the room relit in step as the disc is
        uncovered; only the child's shadow under the haori's
   155  cut, in silence, to A′: たけ upright against the post, eyes closed,
        小夜 asleep in her lap under the haori. 155.4–157.8 her colour
        drains downward (a feathered front with kira on her) to the bare
        paper: no ink on her at all, only her lines and stripes blind-
        embossed (空摺) and the bun a pale 銀鼠 — while the haori and the red
        heko-obi stay bright; the jug, the 三方 and the child throw long, hard
        墨 moon shadows to the lower left; the grandmother none. Hold to 160.

   Every live layer is printed through PRINT (with / softPrint / MOON) so the
   tears, the CLICK and the jolt reach all of it.
   Every shadow is in two values, as a real shadow would be: thin silk lets
   a little light through (藍鼠), skin and hair none (HAIR_INK) — so heads,
   hair, hands and 小夜's okappa read with no line cut into the paper.
   Drawn here (local cut-paper rigs, not CAST): たけ's shadow on the paper
   (ONE rig: seated-old → standing-young, equal parts, blended — so the peel
   is continuous), the young woman from behind (backFigure), the haori as its
   own T-shaped cut piece (a pendulum held up; laid, its breadth foreshortens
   and it bellies), the celestial procession, the ribbon, the 叢雲, the 波兎
   silk tile, the A′ offerings and heko-obi bow, the embossed たけ of A′.
   CAST: the carriage ('palanquin' puppet), 小夜 asleep ('sleep' silhouette)
   on the paper, the A′ pair (grandma 'lap').
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
  /*   seated-old (SEAT) → standing-young (STAND): the same parts with  */
  /*   the same points, blended; from the turn on she is backFigure().   */
  /* ================================================================== */
  const ARM = { upper: 58, fore: 54 };
  // the shadow in two values: thin silk lets a little moonlight through (藍鼠); hair is opaque
  // (藍鼠 × 墨) — so the hair, the okappa and the cap of the head read without any cut line
  const HAIR_INK = U.mix(AINEZU, C.sumi, 0.55);
  const SEAT = {
    H: [-8, -40], S: [30, -128], N: [41, -134], headT: 0.34, look: 0, hunch: 1, bun: 1, hair: 0, sleeve: 30, feet: 0, worn: 1, nw: 19,
    //       waistF      thighF      kneeF      hemF     hemB      hipB       waistB
    skirt: [[22, -62], [48, -47], [70, -22], [64, 0], [-50, 0], [-56, -30], [-36, -66]],
    wN: [56, -52], wF: [48, -50], lean: 0, elbowUp: 0, hairOut: 0, fan: 0, hairAng: 0,
  };
  const STAND = {
    H: [0, -160], S: [-3, -258], N: [-1, -273], headT: 0.06, look: 0, hunch: 0, bun: 0, hair: 1, sleeve: 50, feet: 1, worn: 0, nw: 14,
    skirt: [[18, -162], [23, -118], [21, -72], [28, 0], [-66, 4], [-31, -118], [-23, -164]],
    wN: [16, -150], wF: [4, -152], lean: 0, elbowUp: 0, hairOut: 0, fan: 0.2, hairAng: 0,
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

  /* ---- the climb: the shoulder line's schedule (stage y) ---- */
  //   the body rises in four pulls (a knee lifts the hem before each) and arrives under the top
  //   rail at 145.0, the head clear of the rung at 385 (it sits in the top row of cells)
  const SH0 = TK.y + (STAND.S[1]) * TK.s;                         // standing shoulder, stage y (≈669)
  const PULLS = [[141.25, 141.65, 610], [141.8, 142.45, 520], [143.0, 143.75, 430], [144.3, 145.0, 372]];
  function shoulderY(T) {
    let y = SH0, prev = SH0;
    for (const [a, b, to] of PULLS) { y = U.lerp(prev, to, io(T, a, b)); if (T < b) break; prev = to; }
    return y;
  }
  /* ---- the climb, from behind (後ろ姿) ---- */
  //   Once she has turned to the lattice (141.03) her shadow is her back: the 十二単 from behind —
  //   the robe widening to its layered hems, the 裳 hanging below them, the great sleeves falling
  //   from her raised arms, and down the middle, over all of it, the black fall of her hair.
  //   Hand over hand along the stile, every grip on a real bar (the rungs 730 … 385, last the
  //   top rail's lower edge, 280); the body rises in four pulls, a knee lifting the hem before each.
  const XB = 1036;                                   // her centre line, a step right of the stile (the ribbon runs clear beside her)
  //   (every reach is within the arm's length of the shoulder at that moment; at the top she hangs
  //   from the rail by her left hand, her right on the rung below, and looks back over her right
  //   shoulder, clear of both arms)
  const HANDS_B = {
    L: [[0, 615], [141.6, 141.95, 500], [143.3, 143.7, 385], [144.95, 145.35, 286]],
    R: [[0, 730], [141.95, 142.3, 615], [142.6, 143.0, 500]],
  };
  const HX = { L: 972, R: 1098 };
  function handYB(key, T) {
    const K = HANDS_B[key];
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
  function backRig(T) {
    const sy = (shoulderY(T) - TK.y) / TK.s;
    // a knee lifts the hem before each pull (left, right, left, right); at the top the left foot
    // stays up on a rung
    let kL = 0, kR = 0;
    PULLS.forEach(([a, b], i) => {
      const k = U.env(T, a - 0.4, a - 0.05, a + 0.15, b - 0.05);
      if (i % 2) kR = Math.max(kR, k); else kL = Math.max(kL, k);
    });
    kL = Math.max(kL, 0.55 * io(T, 145.3, 145.9));
    const [yL, mL] = handYB('L', T), [yR, mR] = handYB('R', T);
    const lx = (X) => (X - XB) / TK.s;
    // hanging from the rail by the left hand, her hips swing a little out from the stile
    const pull = PULLS.reduce((m, [a, b]) => Math.max(m, U.env(T, a, a + 0.15, b - 0.15, b)), 0);
    return {
      sy, kL, kR,
      hL: [lx(HX.L) - 9 * mL, RUNG(yL) - 3], hR: [lx(HX.R) + 9 * mR, RUNG(yR) - 3],
      lean: 0.05 * io(T, 145.0, 145.9) - 0.02 * pull + 0.006 * Math.sin(T * 1.1),
      out: 1, look: 0, tilt: 0, hairAng: 0, hair: 1,
    };
  }

  /**
   * The young woman from behind, local units (origin on the floor under her centre line, +x to
   * stage right — the child's side — y down, ≈300 tall). Bs: { sy (shoulder line), hL, hR
   * (hands), kL, kR (0..1 a knee lifted), lean (the hips swung out), out (the draught), hair
   * (0..1 its length), look (0..1 her head turned back over her right shoulder: the profile comes
   * out of the round of her hair), tilt (bowed toward the child), hairAng }.
   * Returns the same record as figure().
   */
  function backFigure(Bs, M, T) {
    const body = [], dark = [], ext = [];
    const mk = (p, into) => { const q = new Path2D(); q.addPath(p, M); into.push(q); return q; };
    const tp = (p) => { const q = M.transformPoint(new DOMPoint(p[0], p[1])); return [q.x, q.y]; };
    const sy = Bs.sy, out = Bs.out || 0, ln = Bs.lean || 0;
    const bp = (x, y, c) => (c ? [x + ln * Math.max(0, y - sy), y, 1] : [x + ln * Math.max(0, y - sy), y]);
    const bpp = (pts) => pts.map(([x, y, c]) => bp(x, y, c));
    const kL = Bs.kL || 0, kR = Bs.kR || 0, tr = Bs.trail || 0;
    const hem = sy + 258 + 10 * tr;
    const fl = (k) => Math.sin(T * 1.7 - k);
    // the 裳 (train): from under the waist, down behind the legs and below the hems, its pleated
    // end swung toward the child by the draught
    {
      const s = 7 * fl(0.4) * out + 12 * out;
      const t2 = 30 * tr;
      mk(splinePath(bpp([[-20, sy + 104], [20, sy + 104], [25, sy + 190], [27 + s, hem + 40 + t2, 1], [14 + s, hem + 47 + t2, 1], [13 + s, hem + 42 + t2, 1],
        [0 + s * 0.9, hem + 49 + t2, 1], [-1 + s * 0.9, hem + 43 + t2, 1], [-13 + s * 0.8, hem + 47 + t2, 1], [-25 + s * 0.7, hem + 36 + t2, 1], [-25, sy + 190]])), body);
      ext.push(tp(bp(27 + s, hem + 40 + t2)));
    }
    // the layered hems (重ね): three more layers under the robe, each stepping out and down,
    // trailing toward the child in the draught
    for (let j = 3; j >= 1; j--) {
      const d = fl(0.7 + 0.5 * j) * (1.5 + j) * out;
      mk(splinePath(bpp([[-38 - 2 * j, sy + 176], [-48 - 5 * j - 6 * kL + 2 * out, hem - 34 * kL + 5 * j, 1], [3 * j * out + d, hem + 4 + 6 * j],
        [49 + 6 * j + 6 * kR + 5 * j * out + d, hem - 30 * kR + 5 * j + 2 * j * out, 1], [38 + 2 * j, sy + 176]])), body);
    }
    // the robe (唐衣 over the 袿): sloping shoulders, the layers widening all the way to the hem; a
    // lifted knee draws the hem up on its side; the draught carries the hem toward the child
    mk(splinePath(bpp([[-9, sy - 7], [-23, sy - 2], [-30, sy + 24], [-34, sy + 70], [-37, sy + 110], [-41 - 8 * kL, sy + 175 - 18 * kL],
      [-48 - 6 * kL + 2 * out, hem - 34 * kL, 1], [2 + 4 * out, hem + 4 - 14 * (kL + kR)], [49 + 6 * kR + 7 * out, hem - 30 * kR + 4 * out, 1], [42 + 8 * kR, sy + 175 - 18 * kR],
      [37, sy + 110], [34, sy + 70], [30, sy + 24], [23, sy - 2], [9, sy - 7]])), body);
    // the arms, and the great sleeves (大袖) falling from them
    const arm = (side, W, k) => {
      const S = bp(24 * side, sy + 5);
      // (the elbows point out, away from her, as anyone's do on a ladder; reaching down or across the
      //  arm reaches a little further: hanging from the rail, her lower hand still holds its rung)
      const up = W[1] < S[1] - 30;
      const l1 = up ? ARM.upper : 61, l2 = up ? ARM.fore : 57;
      const e1 = ik(S, W, l1, l2, 1), e2 = ik(S, W, l1, l2, -1);
      const [El, Wr] = (e1[0][0] - e2[0][0]) * side > 0 ? e1 : e2;          // the elbow out, away from her
      const sw = (Math.sin(T * 1.45 + k) * 4 + Math.sin(T * 0.83 + 2 * k) * 2) * out;
      const low = Math.max(El[1], S[1]);
      if (Wr[1] < S[1] - 10) {
        // raised: the cuff opens at the wrist, the silk slides down the forearm and falls past the
        // elbow in one long banner (the 袂), widening to a slanted hem at her side, clear of her body
        const a = L2(El, Wr, 0.8), d = unit(El, Wr), nm = [d[1] * side, -d[0] * side];
        // (the silk hangs ≈75 below the forearm, never below the waist; its outer corner under the
        //  arm's outermost point)
        const hy = Math.min(S[1] + 70, Math.max(a[1], El[1]) + 66) + 0.3 * sw;
        const ox = side < 0 ? Math.min(El[0], a[0]) - 13 : Math.max(El[0], a[0]) + 13;
        const oc = [ox + 0.6 * sw, hy], ic = [S[0] + side * 3, hy + 14];
        const m = L2(a, oc, 0.55);
        mk(splinePath([[a[0] + nm[0] * 5, a[1] + nm[1] * 5], [m[0] + side * 7, m[1]], [oc[0], oc[1], 1],
          [ic[0], ic[1], 1], [S[0] - side * 5, S[1] + 22], El, [a[0] - nm[0] * 4, a[1] - nm[1] * 4]]), body);
        ext.push(tp(oc));
      } else {
        // level or low: the bag hangs from the forearm straight down, narrowing a little, its hem
        // rounded, swinging with her
        const a = L2(El, Wr, 0.62), b = L2(S, El, 0.45), yb = Math.max(a[1], El[1]);
        mk(splinePath([b, El, a, [a[0] + side * 1 + sw, yb + 50], [U.lerp(a[0], b[0], 0.35) + sw, yb + 78], [b[0] - side * 2 + sw * 0.7, yb + 66],
          [b[0] - side * 3, b[1] + 30]]), body);
        ext.push(tp([a[0] + sw, yb + 78]));
      }
      mk(tube([S, El], 14, 12), body);
      mk(tube([El, Wr], 11, 8.5), body);
      const hand = new Path2D();
      hand.ellipse(Wr[0] + (Wr[0] - El[0]) * 0.07, Wr[1] + (Wr[1] - El[1]) * 0.07, 6.5, 5.6, Math.atan2(Wr[1] - El[1], Wr[0] - El[0]), 0, U.TAU);
      mk(hand, dark);
      return Wr;
    };
    const wL = arm(-1, Bs.hL, 0), wR = arm(1, Bs.hR, 1.3);
    // the head from behind: the round of her hair; turned back, her profile comes out of it on
    // the right — brow, nose, lips, chin — bowed toward the child
    const look = Bs.look || 0;
    const Hc = [6.5 * look, sy - 26 + 2 * look];
    const head = new Path2D(); head.ellipse(Hc[0], Hc[1], 15.5, 17.5, 0.1 * look, 0, U.TAU);
    mk(head, dark);
    if (look > 0.02) {
      const tl = Bs.tilt || 0, kx = 1.28 * Math.sin(Math.PI / 2 * look);
      const face = [[-8, -12], [-1, -18.5], [8, -16.5], [13.5, -11.5], [15.5, -5], [15.4, -2.4],
        [21.5, 4.6, 1], [16, 6.6], [17.4, 8.8], [15.2, 10.4], [16.4, 12.2], [13.4, 16.2], [7, 17.8], [-4, 13]];
      mk(splinePath(face.map(([x, y, c]) => { const r = rot([x * kx, y], tl); return c ? [Hc[0] + r[0], Hc[1] + r[1], 1] : [Hc[0] + r[0], Hc[1] + r[1]]; })), dark);
    }
    // the hair (垂髪): from the crown down the middle of her back, over the robe and the train, past
    // the hems, parting into three strands; the draught from the window lifts it toward the child;
    // it follows the turn of her head late (hairAng: a swing about the nape)
    const hl = Bs.hair == null ? 1 : Bs.hair;
    const nape = [0, sy - 8];
    if (hl > 0.02) {
      const Lh = U.lerp(20, 336, hl) + 60 * tr, ang = Bs.hairAng || 0;
      const at = (q, dx) => {
        const y = nape[1] + q * Lh;
        const x = ln * Math.max(0, y - sy) + out * (30 * Math.pow(q, 1.8) - 5 * Math.sin(Math.PI * q) + Math.sin(q * 4.2 - T * 1.5) * 6 * q) + Math.sin(T * 1.2) * 2 * q + (dx || 0);
        const d = rot([x - nape[0], y - nape[1]], ang * Math.min(1, q * 1.5));
        return [nape[0] + d[0], nape[1] + d[1]];
      };
      const band = (ctr, ws) => {
        const Ls = [], Rs = [];
        for (let i = 0; i < ctr.length; i++) {
          const t = unit(ctr[Math.max(0, i - 1)], ctr[Math.min(ctr.length - 1, i + 1)]);
          const nm = [-t[1], t[0]], w = ws[i] / 2;
          Ls.push([ctr[i][0] + nm[0] * w, ctr[i][1] + nm[1] * w]); Rs.push([ctr[i][0] - nm[0] * w, ctr[i][1] - nm[1] * w]);
        }
        const e = ctr[ctr.length - 1], d = unit(ctr[ctr.length - 2], e);
        return splinePath(Ls.concat([[e[0] + d[0] * ws[ws.length - 1], e[1] + d[1] * ws[ws.length - 1], 1]], Rs.slice().reverse()));
      };
      const QS = 0.62, wk = U.lerp(0.8, 1, hl);
      // (gathered narrow at the nape so the round of the head always reads, then spreading over
      //  the shoulder blades)
      const ctr = [[Hc[0] * 0.5, sy - 30], nape], ws = [22 * wk, 20 * wk];
      for (const q of [0.12, 0.26, 0.4, 0.52, QS]) { ctr.push(at(q)); ws.push((U.lerp(26, 18, q / QS) + 4 * Math.sin(Math.PI * q / QS)) * wk); }
      mk(band(ctr, ws), dark);
      for (const [j, len, ph] of [[-1, 0.9, 0.9], [0, 1, 0], [1, 0.86, 2.1]]) {
        const sc = [at(QS - 0.05)], sws = [7.5 * wk];
        for (let i = 1; i <= 7; i++) {
          const f = i / 7, q = U.lerp(QS, len, f);
          sc.push(at(q, j * 15 * Math.pow(f, 1.3) + Math.sin(q * 6 - T * 1.9 + ph) * 3.5 * f * out));
          sws.push(U.lerp(7.5, 1.4, f) * wk);
        }
        mk(band(sc, sws), dark);
        ext.push(tp(sc[sc.length - 1]));
      }
    }
    const parts = body.concat(dark);
    return {
      body, armN: [], dark, parts, ext, nape: tp(nape), look,
      headC: tp(Hc), waist: tp(bp(-30, sy + 106)), waistR: tp(bp(31, sy + 110)), hands: [tp(wL), tp(wR)],
      hem: tp(bp(0, hem)), shoulder: tp([0, sy]), hip: tp(bp(0, sy + 130)),
    };
  }

  /** everything about the climbing figure at T (null before the peel / after the moon takes her) */
  function climberState(T) {
    if (T < 140 || T >= 149.5) return null;
    const youth = io(T, 140.25, 141.05);
    const turn = io(T, 140.85, 141.2);
    let R = Object.assign({}, blend(seatedRig(139.9), STAND, youth));
    R.youth = youth;
    R.hair = U.lerp(0, 1, io(T, 140.3, 143.6));
    R.bun = 1 - io(T, 140.2, 140.9);
    // she looks back once — a slow remembering from the last heartbeat (146.3) to the E♭ ache
    // (147.0), a held breath — and at the CLICK (147.8) a cold 0.2 s: she faces the moon, forgotten
    const lookBack = io(T, 146.35, 147.0) * (1 - io(T, 147.8, 148.0));
    R.look = lookBack;
    R.headT = U.lerp(R.headT, 0.34, lookBack) - 0.3 * io(T, 147.8, 148.05) + 0.015 * Math.sin(Math.PI * U.seg(T, 147.0, 147.8));
    // the long hair follows the head late (a lagged difference: it swings out, then settles)
    //   (+ swings the tresses out behind her, the way her face turns; − back against her)
    R.hairAng = 0.14 * (io(T, 146.35, 147.0) - io(T, 146.55, 147.25)) - 0.1 * (io(T, 147.8, 148.0) - io(T, 147.95, 148.25));
    const u = clamp01((T - 140) / 1.2);
    const skew = Math.sin(Math.PI * u) * U.deg(12);
    const pen = 6 * U.env(T, 140.0, 140.45, 140.75, 141.3);
    const x = U.lerp(TK.x, XB, io(T, 140.4, 141.0));
    // the turn: a paper puppet turned to the lattice — her profile narrows to an edge (141.03) and
    // opens again as her back
    const fx = Math.cos(Math.PI * turn);
    let back = null;
    if (turn >= 0.5) {
      back = backRig(T);
      back.hair = R.hair;
      back.look = lookBack;
      back.tilt = 0.42 * lookBack - 0.12 * io(T, 147.8, 148.05) + 0.02 * Math.sin(Math.PI * U.seg(T, 147.0, 147.8));
      back.hairAng = R.hairAng;
      // drawn up, what is loose trails below her: the hair, the train, the hems (∝ her speed)
      back.trail = Math.sin(Math.PI * clamp01((T - 148.05) / 0.95));
    }
    // 148.05–149.0: drawn up the paper and out past the top rail (clipped by the paper's edge),
    // eased in and out — lifted, not yanked (peak ≈ 790 px/s); 148.95–: in the window
    const up = 480 * E.inOutSine(clamp01((T - 148.05) / 0.95));
    const inWin = T >= 148.95;
    return { R, back, x, y: TK.y - up, fx, skew, pen, inWin, youth, T };
  }

  /**
   * Build the rig's silhouette in stage coordinates.
   * Returns { body, fan, hair, head, cap, armN: [Path2D] (painted in that order: union by
   * paint, two values — see paintFigure), parts (all of them: her clip), headC, waist, hands,
   * nape, hem, shoulder, hip, ext (the far points of the hair and hem, for the layer's bounds) }.
   */
  function figure(R, M, T) {
    const body = [], armN = [], dark = [];
    const mk = (p, into) => { const q = new Path2D(); q.addPath(p, M); into.push(q); return q; };
    const tp = (p) => { const q = M.transformPoint(new DOMPoint(p[0], p[1])); return [q.x, q.y]; };
    const H = R.H, S = R.S, N = R.N;
    const u = unit(H, S), n = [-u[1], u[0]], Lt = Math.hypot(S[0] - H[0], S[1] - H[1]);
    const P = (t, w) => [H[0] + u[0] * t * Lt + n[0] * w, H[1] + u[1] * t * Lt + n[1] * w];
    const hu = R.hunch, wo = R.worn || 0, br = R.breath || 0;
    const ext = [];
    // skirt (the kimono binds the legs: one shape from waist to hem; layered hems step at the back)
    mk(splinePath(R.skirt), body);
    // the 十二単's layered hems (重ね): under the robe three more layers, each a little longer and
    // swung a little further back from the stile than the one before it, so the hem steps out
    // into a trailing fan (芳年「月宮迎」) — lifted and fluttering in the draught from the window
    const fan = R.fan || 0;
    if (fan > 0.02) {
      const low = [R.skirt[2], R.skirt[3], R.skirt[4], R.skirt[5]];
      for (let j = 3; j >= 1; j--) {
        const sc = 1 + 0.055 * j * fan, an = (0.05 * j + 0.012 * j * Math.sin(T * 1.7 - 0.6 * j)) * fan;
        const q = low.map((p, i) => { const d = rot([(p[0] - H[0]) * sc, (p[1] - H[1]) * sc], an); return [H[0] + d[0], H[1] + d[1], i === 1 || i === 2 ? 1 : 0]; });
        mk(splinePath([[H[0] + 10, H[1] + 6], q[0], q[1], q[2], q[3]]), body);
        if (j === 3) ext.push(tp(q[2]));
      }
    }
    // torso: the hunch of age rounds the upper back; a worn haori thickens it a little
    mk(splinePath([P(-0.06, 24 + 3 * wo), P(0.35, 20 + 2 * wo + br), P(0.7, 19 + 2 * wo), P(0.96, 11),
      P(1.02, -12 - 4 * hu - 3 * wo), P(0.78, -20 - 17 * hu - 5 * wo), P(0.45, -24 - 7 * hu - 5 * wo), P(-0.06, -29 - 4 * wo)]), body);
    // neck
    mk(tube([P(0.9, -2), N], R.nw || 15, (R.nw || 15) * 0.8), dark);
    // head: a profile (look → the profile turns back: nose and chin to the other side)
    const th = R.headT, sx = Math.cos(Math.PI * (R.look || 0));
    const sxc = Math.abs(sx) < 0.06 ? (sx < 0 ? -0.06 : 0.06) : sx;
    const hc0 = rot([3, -15], th);
    const Hc = [N[0] + hc0[0], N[1] + hc0[1]];
    const hp = (x, y, flip = true) => { const r = rot([flip ? x * sxc : x, y], th); return [Hc[0] + r[0], Hc[1] + r[1]]; };
    const face = [[-16, 3], [-16.5, -7], [-10, -15.5], [-1, -18.5], [8, -16.5], [13.5, -11.5], [15.5, -5], [15.4, -2.4],
      [21.5, 4.6, 1], [16, 6.6], [17.4, 8.8], [15.2, 10.4], [16.4, 12.2], [13.4, 16.2], [7, 17.8], [-2, 14.5]];
    const pp = (pts, flip = true) => pts.map(([x, y, c]) => { const q = hp(x, y, flip); return c ? [q[0], q[1], 1] : q; });
    mk(splinePath(pp(face)), dark);
    const hl = R.hair || 0;
    // the old bun, low at the back of the head (with the comb's little ridge)
    if (R.bun > 0.03) {
      const b = hp(-17, -3, false), rb = 9.5 * R.bun + 0.5;
      const p = new Path2D(); p.ellipse(b[0], b[1], rb, rb * 0.9, th, 0, U.TAU);
      mk(p, dark);
      mk(tube([hp(-12, -11, false), hp(-20, -11, false)], 4 * R.bun, 4 * R.bun), dark);
    }
    // arms (far with the body, near as its own piece) with their hanging sleeves (袂)
    const arm = (Sa, W, into) => {
      // a hand high above the shoulder is reached with the elbow up beside the head; otherwise it hangs
      let [El, Wr] = ik(Sa, W, ARM.upper, ARM.fore, 1);
      const up = (R.elbowUp || 0) * U.smoothstep(18, 70, Sa[1] - W[1]);
      if (up > 0) { const [E2] = ik(Sa, W, ARM.upper, ARM.fore, -1); El = L2(El, E2, up); }
      mk(tube([Sa, El], 13, 11), into);
      mk(tube([El, Wr], 10.5, 8), into);
      const hand = new Path2D();
      hand.ellipse(Wr[0] + (Wr[0] - El[0]) * 0.08, Wr[1] + (Wr[1] - El[1]) * 0.08, 6.5, 5.5, Math.atan2(Wr[1] - El[1], Wr[0] - El[0]), 0, U.TAU);
      mk(hand, dark);
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
    // Heian hair (垂髪): from the nape it falls clear behind her back, past the hem, and parts into
    // three strands; the draught from the window lifts it out behind her as she climbs, and it
    // follows the turn of her head late (R.hairAng: a swing about the nape)
    let nape = null;
    if (hl > 0.02) {
      // (looking back, the face turns out over the hair: the tress is gathered lower, at the back of
      //  the neck, so the jaw's profile stays clear against the paper)
      const lk = R.look || 0;
      const nap = L2(hp(-15, 5, false), [N[0] - 11, N[1] + 12], lk);
      const bx = Math.min(P(0.8, -20 - 17 * hu)[0], P(0.4, -24 - 7 * hu)[0]);
      const Lh = U.lerp(10, 400, hl);
      const x0 = U.lerp(nap[0] - 2, Math.min(nap[0] - 2, bx - 6.5), clamp01(hl * 2.5));   // (a short tress hangs from the nape)
      const sw = Math.sin(T * 1.25) * 5 * hl;
      const out = (R.hairOut || 0) * hl;
      const ang = R.hairAng || 0;
      const at = (q, dx) => {
        const wave = Math.sin(q * 4.6 - T * 1.6) * 8 * q * out;
        const p = [x0 - 54 * out * Math.pow(q, 1.3) - 5 * q + wave + sw * q + (dx || 0), nap[1] + q * Lh];
        const d = rot([p[0] - nap[0], p[1] - nap[1]], ang * Math.min(1, q * 1.6));
        return [nap[0] + d[0], nap[1] + d[1]];
      };
      const band = (ctr, ws) => {
        const Ls = [], Rs = [];
        for (let i = 0; i < ctr.length; i++) {
          const t = unit(ctr[Math.max(0, i - 1)], ctr[Math.min(ctr.length - 1, i + 1)]);
          const nm = [-t[1], t[0]], w = ws[i] / 2;
          Ls.push([ctr[i][0] + nm[0] * w, ctr[i][1] + nm[1] * w]); Rs.push([ctr[i][0] - nm[0] * w, ctr[i][1] - nm[1] * w]);
        }
        const e = ctr[ctr.length - 1], d = unit(ctr[ctr.length - 2], e);
        return splinePath(Ls.concat([[e[0] + d[0] * ws[ws.length - 1], e[1] + d[1] * ws[ws.length - 1], 1]], Rs.slice().reverse()));
      };
      const wk = U.lerp(0.72, 1, hl), QS = 0.56;
      // the tress, gathered (元結) at the shoulder blades
      const ctr = [L2(hp(-10, -8, false), [N[0] - 9, N[1] + 2], lk), nap], ws = [17 * wk, 17 * wk];
      for (const q of [0.1, 0.22, 0.34, 0.46, QS]) { ctr.push(at(q)); ws.push(U.lerp(15.5, 13, q / QS) * wk); }
      mk(band(ctr, ws), dark);
      // … parting into three uneven strands toward the ends
      for (const [j, len, ph] of [[-1, 0.9, 0.9], [0, 1, 0], [1, 0.84, 2.1]]) {
        const sc = [at(QS - 0.04)], sws = [6.2 * wk];
        for (let i = 1; i <= 7; i++) {
          const f = i / 7, q = U.lerp(QS, len, f);
          const spread = j * 15 * Math.pow(f, 1.2) + Math.sin(q * 6 - T * 1.9 + ph) * 3.5 * f * out;
          sc.push(at(q, spread));
          sws.push(U.lerp(6.2, 1.2, f) * wk);
        }
        mk(band(sc, sws), dark);
        ext.push(tp(sc[sc.length - 1]));
      }
      nape = tp(nap);
    }
    const parts = body.concat(armN, dark);
    return {
      body, armN, dark, parts, nape, ext,
      look: R.look || 0, nearRaised: aN.raised,
      headC: tp(Hc), waist: tp(P(0.12, 0)), hands: [tp(aN.Wr), tp(aF.Wr)], hem: tp(R.skirt[3]),
      shoulder: tp(S), hip: tp(H),
    };
  }

  /** the rig → stage matrix: (x, y) floor anchor, facing sx (−1..1, a paper puppet turning), shear */
  const rigMatrix = (x, y, s, sx, skew) => new DOMMatrix([s * sx, 0, -Math.tan(skew || 0) * s, s, x, y]);

  /**
   * Paint a figure into a layer ctx (stage coords), union by paint, in two values and no cut
   * lines — the shadow's own physics: thin silk passes a little moonlight (the robe, its hems,
   * the sleeved arms: the layer's 藍鼠); skin and hair pass none (head, neck, hands, the toe,
   * the long hair: HAIR_INK). The opaque parts are painted last: where any of them lies, the
   * shadow is at its darkest, whatever is in front.
   */
  function paintFigure(L, fg) {
    const ink = L.fillStyle;
    for (const p of fg.body) L.fill(p);
    for (const p of fg.armN) L.fill(p);
    L.fillStyle = HAIR_INK;
    for (const p of fg.dark) L.fill(p);
    L.fillStyle = ink;
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
    // held up it is silk on a pendulum: when the lift lands (124.0) the hem swings on and settles
    // (damped, ≈0.95 s period), then breathes in the draught
    const t4 = Math.max(0, T - 124.0);
    const swing = (v) => (12 * Math.exp(-t4 / 0.8) * Math.sin(U.TAU * t4 / 0.95) * v * v + 8 * v * Math.sin(T * 0.8 + v * 2.2)) * (1 - lay) * lift;
    const pts = HAORI_UV.map(([uu, v, c]) => {
      // held: hanging from the collar held in both hands; laying, swung forward about it — the
      // collar leads and the hem lags (each point turns by its own φ(v)), and the silk bellies
      // (air under it) at the middle of the swing
      const phiV = (Math.PI / 2) * E.inOutSine(clamp01(lay * 1.4 - 0.2 * v));
      const bel = 10 * Math.sin(Math.PI * v) * Math.sin(Math.PI * lay);
      // (turned toward the child the garment's plane turns flat over her too: seen on the paper its
      //  breadth foreshortens — it never stands up as a rigid board)
      const fs = U.lerp(1, 0.16, Math.sin(phiV));
      const hr = rot([uu * HW * fs + swing(v) - bel, v * HL - Math.abs(uu) * 4 * fs], -phiV);
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
  /** a closed band along a centre line with per-point widths (round-ended), for ribbons and tresses */
  function strip(ctr, ws) {
    const Ls = [], Rs = [];
    for (let i = 0; i < ctr.length; i++) {
      const t = unit(ctr[Math.max(0, i - 1)], ctr[Math.min(ctr.length - 1, i + 1)]);
      const nm = [-t[1], t[0]], w = ws[i] / 2;
      Ls.push([ctr[i][0] + nm[0] * w, ctr[i][1] + nm[1] * w]); Rs.push([ctr[i][0] - nm[0] * w, ctr[i][1] - nm[1] * w]);
    }
    const e = ctr[ctr.length - 1], d = unit(ctr[ctr.length - 2], e);
    return splinePath(Ls.concat([[e[0] + d[0] * ws[ws.length - 1] * 0.6, e[1] + d[1] * ws[ws.length - 1] * 0.6, 1]], Rs.slice().reverse()));
  }
  /**
   * One flying tennyo (飛天, after the 雲中供養菩薩), local: flying toward +x, ≈105 px from the
   * offering to the feet. The spine an S — the chest lifted, the head up and forward (a small
   * profile with the 宝髻), the belly drawn in, the legs trailing together inside the skirt, the
   * feet peeping at its end; one arm holds the flower tray (華籠) ahead, the other floats up
   * behind. She rides a small carved cloud-head with a curling tail. Her 天衣: two broad scarves
   * (Ω and S loops over and under her) tapering to fine ends, a travelling wave running out
   * along them (the tips lag); `flick` (0..1) whips them when her bells shake.
   */
  // (every part is wound the same way — splines oriented like tube() and strip(), ellipses drawn
  //  anticlockwise — so one tennyo is ONE nonzero fill: the parts union, nothing cancels)
  const orient = (pts) => {
    let a = 0;
    for (let j = 0; j < pts.length; j++) { const p = pts[j], q = pts[(j + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
    return a > 0 ? pts.slice().reverse() : pts;
  };
  function tennyoPaths(add, T, i, flick) {
    const ph = T * 1.1 + i * 1.7;
    const Y = (y) => y + Math.sin(ph) * 1.0;
    const splinePath = (pts) => spline(new Path2D(), orient(pts), true);
    const el = (x, y, rx, ry, a) => { const p = new Path2D(); p.ellipse(x, Y(y), rx, ry, a || 0, 0, U.TAU, true); add(p); };
    // the cloud-head she rides: three scalloped lobes and a tail curling back (霊芝)
    {
      const cy = 24, p = new Path2D();
      for (const [x, y, r] of [[-6, cy, 9], [8, cy - 3, 11], [22, cy + 1, 8], [-18, cy + 3, 7]]) { p.moveTo(x + r, Y(y)); p.ellipse(x, Y(y), r, r * 0.8, 0, 0, U.TAU, true); }
      add(p);
      add(strip([[-18, Y(cy + 4)], [-34, Y(cy + 6)], [-50, Y(cy + 3)], [-60, Y(cy - 3)], [-58, Y(cy - 9)], [-52, Y(cy - 8)]], [9, 8, 6, 4.5, 3.5, 3]));
    }
    // head (a small profile: brow, nose, chin toward +x, lifted), the 宝髻 in two loops, the neck
    add(splinePath([[42, Y(-21)], [50, Y(-22)], [55, Y(-17)], [56, Y(-14)], [59, Y(-12), 1], [56, Y(-10)], [56, Y(-7)], [51, Y(-5)], [44, Y(-7)], [40, Y(-14)]]));
    el(43, -26, 4.4, 4.0, -0.4); el(36, -24, 4.0, 3.6, -0.6);
    add(tube([[45, Y(-7)], [38, Y(-1)]], 6.5, 8));
    // torso: an S — the chest thrust forward and up, the waist drawn back and down
    add(splinePath([[44, Y(-2)], [34, Y(-4)], [22, Y(0)], [10, Y(8)], [4, Y(16)], [14, Y(18)], [26, Y(12)], [38, Y(8)]]));
    // the skirt (裙): from the hips a long tapering fall trailing back, the legs together inside it,
    // its hem fluttering; the feet peep out at the end
    const fl = Math.sin(ph + 1) * 2.5, fl2 = Math.sin(ph + 1.8) * 2.5;
    // (the legs bend up at the knees, so the skirt's end sweeps up behind her — the S goes on)
    add(splinePath([[12, Y(6)], [-6, Y(8)], [-24, Y(6)], [-40, Y(0) + fl * 0.4], [-54, Y(-10) + fl, 1], [-50, Y(-2) + fl2 * 0.5], [-64, Y(-4) + fl2, 1],
      [-44, Y(12)], [-24, Y(19)], [-4, Y(21)], [10, Y(19)]]));
    add(splinePath([[-48, Y(-12)], [-57, Y(-21), 1], [-53, Y(-23), 1], [-45, Y(-15)]]));
    // the arm ahead with the flower tray, two petals falling from it
    add(tube([[36, Y(0)], [49, Y(4)], [62, Y(0)]], 5.4, 4.2));
    add(splinePath([[58, Y(-2)], [74, Y(-5), 1], [72, Y(-1)], [60, Y(1), 1]]));
    el(66, -7, 7, 2.6, -0.2);
    el(75, 8 + Math.sin(ph * 0.7) * 2, 2.2, 1.7, 0.4); el(67, 15 + Math.sin(ph * 0.7 + 1) * 2, 2, 1.6, -0.3);
    // the other arm floating up behind, the hand turned in a mudra
    add(tube([[28, Y(-2)], [18, Y(-16)], [24, Y(-30)]], 5.2, 4));
    add(tube([[24, Y(-30)], [25, Y(-40)]], 1.8, 1.4));
    add(splinePath([[25, Y(-39)], [19, Y(-45), 1], [23, Y(-44)], [25, Y(-51), 1], [27, Y(-44)], [31, Y(-45), 1]]));
    // 天衣: two broad scarves, a travelling wave running out along them (the ends lag)
    const k = 1 + 0.9 * (flick || 0);
    const scarf = (pts, w0, wm, w1, sh) => {
      const n = pts.length, ctr = [], ws = [];
      for (let j = 0; j < n; j++) {
        const s = j / (n - 1);
        const a = pts[Math.max(0, j - 1)], b = pts[Math.min(n - 1, j + 1)];
        const d = unit(a, b), off = 12 * k * s * s * Math.sin(ph * 1.3 - 2.4 * s * 3 + sh);
        ctr.push([pts[j][0] - d[1] * off, Y(pts[j][1]) + d[0] * off]);
        ws.push(s < 0.45 ? U.lerp(w0, wm, s / 0.45) : U.lerp(wm, w1, (s - 0.45) / 0.55));
      }
      add(strip(ctr, ws));
    };
    // over her: up from the shoulders in an Ω above her back, then streaming out behind
    scarf([[32, -4], [34, -22], [26, -42], [8, -52], [-10, -46], [-18, -32], [-30, -26], [-48, -30], [-68, -38], [-88, -40], [-106, -34], [-122, -36]], 3, 6.2, 1.1, 0);
    // under her: from the forearm down under the cloud-head and out in an S
    scarf([[48, 3], [40, 16], [26, 34], [6, 42], [-14, 38], [-32, 40], [-52, 46], [-74, 44], [-94, 36], [-112, 36]], 2.8, 5.6, 1.1, 2.1);
  }
  /**
   * The 瑞雲 (霊芝雲), local, travelling toward +x (its head): a flat-topped cushion of
   * puffs the carriage rides on, its front and back ends rolling into curls (light cut
   * into each roll so the curl reads through the penumbra).
   */
  function paintCloud(L, T) {
    const puff = (i) => 1 + 0.03 * Math.sin(T * 0.8 + i * 1.7);
    // the flat top
    L.fill(splinePath([[-176, 4], [-150, -10], [-80, -15], [0, -16], [80, -15], [150, -10], [182, 2], [170, 24], [-164, 24]]));
    // puffs under it, scalloping the underside
    const P = [[-150, 16, 22], [-112, 20, 30], [-66, 24, 34], [-16, 26, 38], [36, 24, 36], [86, 22, 32], [130, 18, 26]];
    P.forEach(([x, y, r], i) => { const q = new Path2D(); q.ellipse(x, y, r * 1.1 * puff(i), r * 0.8 * puff(i + 3), 0, 0, U.TAU); L.fill(q); });
    // the curls (霊芝): at the head a big roll hooked forward and down, at the back a smaller one
    const CURLS = [[176, 20, 30, 1], [-178, 18, 22, -1], [60, 44, 20, 1]];
    CURLS.forEach(([x, y, r, f], i) => { const q = new Path2D(); q.ellipse(x, y, r * puff(i + 5), r * 0.92 * puff(i + 6), 0, 0, U.TAU); L.fill(q); });
    L.save();
    L.globalCompositeOperation = 'destination-out';
    L.lineCap = 'round';
    CURLS.forEach(([x, y, r, f]) => {
      // a spiral of light: from the roll's eye out to its lower edge
      L.lineWidth = Math.max(4.5, r * 0.26);
      L.beginPath();
      for (let j = 0; j <= 16; j++) {
        const q = j / 16, an = f > 0 ? Math.PI * (1.5 - 1.6 * q) : Math.PI * (-0.5 + 1.6 * q), rr = r * (0.18 + 0.52 * q);
        const px = x + Math.cos(an) * rr * f * (f > 0 ? 1 : -1), py = y + Math.sin(an) * rr;
        if (j) L.lineTo(px, py); else L.moveTo(px, py);
      }
      L.stroke();
    });
    L.restore();
  }
  /** the 天人 escort round the carriage: [dx, dy] from the cloud's head (stage px), rotation, bob phase */
  const TENNYO = [
    [205, -70, 0.05], [175, 95, -0.08], [55, -285, 0.12], [-120, -205, 0.08],
    [-245, -60, 0.14], [-205, 105, -0.05], [-360, -175, 0.18],
  ];
  const GLIDE = 0.12;                              // they fly almost level, a little down, as the cloud falls
  const TEN_S = 1.25;                              // ≈130 px from the lotus to the feet
  const CLOUD_ROT = U.deg(10);
  /** the procession's head (the cloud's front) at T: from just under the window (132) to (1060,560) (139) */
  function processionHead(T) {
    const u = E.outSine(clamp01((T - 132) / 7));
    return { u, x: U.lerp(930, 1060, u), y: U.lerp(236, 560, u) };
  }
  /**
   * The procession's cloud: the 霊芝雲 and its tail streaming back up to the
   * window it poured out of. Stage coords.
   */
  function paintProcessionCloud(L, T) {
    const hd = processionHead(T);
    const a0 = new DOMMatrix().translate(hd.x, hd.y).rotate(10).transformPoint(new DOMPoint(-150, 12));
    const a = [a0.x, a0.y], z = [G.window.x - 6, G.window.y + G.window.r + 4];
    const d = unit(a, z), nm = [-d[1], d[0]], len = Math.hypot(z[0] - a[0], z[1] - a[1]);
    const pts = [];
    for (let j = 0; j <= 24; j++) {
      const q = j / 24;
      const bow = Math.sin(Math.PI * q) * 38 + Math.sin(Math.PI * 2 * q + T * 0.5) * 8 * q;
      pts.push([a[0] + d[0] * len * q + nm[0] * bow, a[1] + d[1] * len * q + nm[1] * bow]);
    }
    const tail = tube(pts, 30, 3);
    // one flat ink, crisp scallops (no penumbra): first a second pull 6 px lower and paler — the
    // cloud's depth — then the cloud itself over it
    const a0g = L.globalAlpha;
    for (const [dy, al] of [[6, 0.36], [0, 1]]) {
      L.save();
      L.globalAlpha = a0g * al;
      L.translate(0, dy);
      L.save();
      L.translate(hd.x, hd.y); L.rotate(CLOUD_ROT);
      paintCloud(L, T);
      L.restore();
      L.fill(tail);
      L.restore();
    }
  }
  /**
   * Pass 2, crisp: the canopied carriage (CAST's 鳳輦, its bearers standing on the cloud)
   * and the seven tennyo flying round it. Stage coords.
   */
  function paintProcessionFigures(L, T, part, Tw) {
    const hd = processionHead(T);
    if (part !== 'tennyo') {
      // the carriage on its own clock (procClock): its tassels come to rest as the procession holds
      const Mc = new DOMMatrix().translate(hd.x, hd.y).rotate(10);
      const pal = CAST.puppet('palanquin', null, 0, 0, 0.85, { t: Tw == null ? T : Tw, phase: 0.2, sticks: false });
      if (pal) { const q = new Path2D(); q.addPath(pal.path, Mc.translate(10, -12)); L.fill(q, pal.rule); }
      if (part === 'carriage') return;
    }
    const suzu = (TSUKI.CUES && TSUKI.CUES.celestialSuzu) || [132.0, 133.4, 134.9, 136.4, 137.9, 139.2];
    TENNYO.forEach(([dx, dy, r0], i) => {
      // each floats on her own slow figure-eight (6.2 s), rolling with it, and trails the cloud a
      // little while it still falls
      const lag = (1 - hd.u) * 30 * (0.4 + 0.6 * U.hash(i + 3));
      const a = U.TAU * (T - 132) / 6.2 + i * 0.9;
      const px = hd.x + dx - lag * 0.5 + 14 * Math.sin(a);
      const py = hd.y + dy - lag + 9 * Math.sin(2 * a);
      // each cluster of the kagura bells whips one tennyo's scarves
      let flick = 0;
      suzu.forEach((c, j) => { if (j % TENNYO.length === (i * 3) % TENNYO.length) flick = Math.max(flick, U.env(T, c, c + 0.2, c + 0.2, c + 1.4)); });
      L.save();
      L.translate(px, py); L.rotate(GLIDE + r0 + 0.07 * Math.cos(a)); L.scale(TEN_S, TEN_S);
      const one = new Path2D();
      tennyoPaths((p) => one.addPath(p), T, i, flick);
      L.fill(one);
      L.restore();
    });
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
    // (from behind, it comes down the stile to her left side at the waist)
    const dx = cl && cl.waistR ? -3 : -20, dy = cl && cl.waistR ? -8 : -74;
    let end = T < 140 ? seat : cl ? L2(seat, [cl.waist[0] + dx * fw, cl.waist[1] + dy * fw], io(T, 140, 140.5)) : [G.stile, top[1] + 2];
    // (148.05–: as she is drawn up the ribbon is drawn up after her, into the window)
    if (T >= 148.05) { const k = clamp01((end[1] - top[1] - 2) / 60); end = [U.lerp(G.stile, end[0], k), Math.max(end[1], top[1] + 2)]; }
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
    if (T < 136 || T >= 149.1) return;
    let pts = ribbonLine(T, fg);
    if (!pts || pts.length < 3) return;
    const fade = 1 - U.seg(T, 148.2, 149.1);
    // once she has peeled off the paper the ribbon runs down the stile BEHIND her (her silhouette
    // cuts it: her hand on the rail, her arm, her body stay whole) and winds round her waist in
    // front (141.2–142.6): a band of light across the robe, its end streaming out behind her
    const behind = !!(cl && cl.Lc && fg);
    const side = pts.map(() => (behind ? -1 : 1));
    const wind = fg ? io(T, 141.2, 142.6) : 0;
    if (wind > 0) {
      const [cx, cy] = fg.waist;
      // (the end trails her turn: a lagged swing out as she looks back, and back at the CLICK)
      const lag = io(T, 146.55, 147.25) - io(T, 146.85, 147.65) - 0.6 * (io(T, 147.95, 148.15) - io(T, 148.1, 148.4));
      // (from behind: across the small of her back, left to right, and out from her right hip)
      const A = pts[pts.length - 1], Bk = fg.waistR ? [fg.waistR[0] + 2, fg.waistR[1] + 4] : [cx + 24, cy + 8];
      const bx = Bk[0] - 24, by = Bk[1] - 8;
      const tail = [Bk];
      for (let j = 1; j <= 4; j++) {
        const f = j / 4, w = Math.sin(T * 2.3 - 0.8 * j) * (2.5 + 1.5 * j);
        tail.push([bx + 24 + 26 * j + 12 * lag * f, by + 8 + 6 * j + 5 * j * j * 0.5 + w - 16 * lag * f]);
      }
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
    // the silk's bright edges where its broad face turns to us (three alpha steps, one stroke each)
    const edges = [new Path2D(), new Path2D(), new Path2D()];
    for (const sd of [band.Ls, band.Rs]) {
      for (let i = 1; i < sd.length; i++) {
        const w = band.Ws[i];
        if (w < 3.2) continue;
        const e = edges[Math.min(2, Math.floor(U.clamp((w - 3) / 5) * 3))];
        e.moveTo(sd[i - 1][0], sd[i - 1][1]); e.lineTo(sd[i][0], sd[i][1]);
      }
    }
    // the band in front of her (the wrap): its soft face only, straight onto the print
    PRINT.with(c, 'P7', T, (k) => {
      k.save();
      k.beginPath();
      k.rect(G.panels[0][0], G.top - 6, G.panels[3][1] - G.panels[0][0], G.bottom - G.top + 12);
      k.clip();
      k.globalAlpha *= fade;
      k.globalCompositeOperation = 'lighter';
      k.fillStyle = U.rgba(C.gofun, 0.66);
      k.fill(near);
      if (!behind) {
        k.fill(far);
        k.lineWidth = 1;
        edges.forEach((e, i) => { k.strokeStyle = U.rgba(C.gofun, 0.55 * (i + 0.5) / 3); k.stroke(e); });
      }
      k.restore();
    });
    // behind her: the ribbon and every bright edge go into a small layer, her silhouette is cut out
    // of it (her own shadow layer, so hair over robe, hand over rail all count), and it is printed
    // 'lighter' — no pale line ever traces her contour
    if (behind && cl.Lc) {
      const RL = SB.sharpLayer(c, 'ribbon', RIB_REG);
      RL.fillStyle = U.rgba(C.gofun, 0.66);
      RL.fill(far);
      RL.lineWidth = 1;
      edges.forEach((e, i) => { RL.strokeStyle = U.rgba(C.gofun, 0.55 * (i + 0.5) / 3); RL.stroke(e); });
      const RC = cl.Lc.canvas.__region;
      RL.save();
      RL.globalCompositeOperation = 'destination-out';
      RL.imageSmoothingEnabled = true;
      RL.drawImage(cl.Lc.canvas, 0, 0, RC.w, RC.h, RC.x0, RC.y0, RC.w / RC.s, RC.h / RC.s);
      RL.restore();
      SB.softPrint(c, T, 'ribbon', { mode: 'lighter', plate: 'P7', alpha: fade, clip: false });
    }
    // kira along its edges: slow travelling glints (never on her)
    const onHer = (x, y) => behind && fg.parts.some((p) => HIT().isPointInPath(p, x, y));
    PRINT.with(c, 'P8', T, (k) => {
      k.globalCompositeOperation = 'lighter';
      k.globalAlpha *= fade;
      for (let j = 0; j < 7; j++) {
        const q = U.fract(T * 0.21 + j / 7);
        const i = Math.floor(q * (n - 1));
        if (band.Ws[i] < 2.5) continue;
        const p = j % 2 ? band.Ls[i] : band.Rs[i];
        if (onHer(p[0], p[1])) continue;
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
    // bank closes over the window (149.3–149.65; it reaches the disc's centre only at the
    // kira's peak, ≈149.47), drifts on while it hides the moon, and its trailing lobes (≈470 px behind
    // the lead) uncover the disc at an even pace 151.95–152.45, in step with the room's relight
    // (drawB); by 152.5 the last lobe has left the window
    const K = [
      { w: 360, keys: [[149.1, 840], [149.45, 1000], [151.9, 1160], [152.6, 1420]] },
      { w: 380, keys: [[149.15, 840], [149.5, 1010], [151.9, 1170], [152.7, 1440]] },
      { w: 430, keys: [[149.3, 846], [149.65, 1078], [151.95, 1431], [152.5, 1580]], eases: [E.inOutSine, (x) => Math.pow(x, 2.5), E.linear] },
    ][layer];
    const k = K.keys;
    if (T < k[0][0] || T > k[k.length - 1][0]) return { on: false, cx: 0, w: K.w };
    let i = 0;
    while (i < k.length - 2 && T > k[i + 1][0]) i++;
    const u = (T - k[i][0]) / (k[i + 1][0] - k[i][0]);
    const ease = K.eases ? K.eases[i] : i === 1 ? E.linear : i === 0 ? E.outCubic : E.inCubic;
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
  function drawClouds(c, T, part) {
    if (T < 149.05 || T > 152.75) return;
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
  /** the climber's figure (140–149.5): matrix with the peel's shear and the puppet's turn */
  function climberFigure(st) {
    const f = st.back ? -st.fx : st.fx;
    const sx = Math.abs(f) < 0.05 ? (f < 0 ? -0.05 : 0.05) : f;
    const M = rigMatrix(st.x, st.y, TK.s, sx, st.skew);
    return st.back ? backFigure(st.back, M, st.T) : figure(st.R, M, st.T);
  }

  /**
   * 小夜's okappa in the shadow: her hair is opaque (HAIR_INK) over the round of her head — the
   * straight-cut fringe standing out a little at the brow, the bob's straight hem at the jaw
   * flaring at the nape; her face, below the fringe and forward of the side hair, stays in the
   * lighter value. (x, y) = the head's centre (CAST's 'sleep' head, facing +x).
   */
  function childHead(L, h) {
    const s = CH.s;
    const P = (x, y, c) => (c ? [h[0] + x * s, h[1] + y * s, 1] : [h[0] + x * s, h[1] + y * s]);
    L.save();
    L.fillStyle = HAIR_INK;
    L.fill(splinePath([P(-12.4, 7.4, 1), P(-12.6, -1), P(-9.6, -8.8), P(-2, -12.4), P(5.6, -11.2), P(10.2, -7.6),
      P(12, -2.4, 1), P(4.6, -2.2, 1), P(3.4, 6.2, 1), P(-5, 7.4)]));
    L.restore();
  }

  const CLIMB_REG = [800, G.top - 20, 1320, G.bottom];
  const RIB_REG = [880, G.top - 6, 1240, 860];                 // the ribbon behind her (a fixed layer)
  let hitCtx = null;                                             // an identity-transform context for point tests
  const HIT = () => hitCtx || (hitCtx = B.canvas(2, 2).getContext('2d'));
  const CLIMB_RES = [0.9, 0.62, 0.42, 0.3, 0.24];
  const climbRes = (pen) => CLIMB_RES[Math.min(CLIMB_RES.length - 1, Math.round(clamp01(pen / 6) * (CLIMB_RES.length - 1)))];
  // the procession's layer: a fixed size, sliding with the cloud
  const procReg = (hd) => { const x0 = U.clamp(Math.min(hd.x - 520, G.window.x - 60), G.panels[0][0], G.panels[3][1] - 860); return [x0, G.top, x0 + 860, G.top + 540]; };
  const SEAT_REG = [[TK.x - 212, 480, CH.x + 290, G.bottom], [CH.x - 20, 846, CH.x + 290, G.bottom]];

  // the procession settles as it fades to a third (139–140) and holds: the cloud's breathing and the
  // carriage's tassels ease to rest on this clock (velocity continuous at 139, still from 140.0), so
  // from 140 the cloud and the carriage are one fixed image (procStill, a pure function of the stage size)
  const procClock = (T) => (T < 139 ? T : 139 + 0.5 * (1 - Math.pow(1 - clamp01(T - 139), 2)));
  let procStill = null;

  function shadowsB(c, T, st, cfg) {
    // the climber (140–148.95 on the paper): soft while she peels away, then sharp against the kumiko.
    // While she still overlaps the child (to 141.35) her layer is merged into the child's (one
    // union, no seam, no compounding); afterwards she is printed on her own.
    let Lc = null, merge = false;
    if (st && !st.inWin && cfg) {
      // (one fixed region and five penumbra steps: the layer's buffers are allocated once, in init —
      //  a buffer that changes size with her pose would be re-allocated mid-climb)
      const soft = st.pen > 0.3;
      const res = soft ? climbRes(st.pen) : null;
      Lc = soft ? SB.softLayer(c, 'climb', CLIMB_REG, res) : SB.sharpLayer(c, 'climb', CLIMB_REG);
      paintFigure(Lc, cfg);
      merge = T < 141.35;
      st.Lc = Lc;
    }
    // ---------- far from the paper: the procession of the celestials (132–149.3) ----------
    // two blocks: the 霊芝雲 flat and pale (藍鼠 α .55, crisp scallops, a paler second pull 6 px
    // lower), the carriage and the tennyo darker (α .75); both fade to a third from 139–140 and hold
    if (T >= 132 && T < 149.3) {
      const f = U.seg(T, 132, 132.8) * (1 - 0.66 * io(T, 139, 140)) * (1 - U.seg(T, 148.4, 149.3));
      const hd = processionHead(T);
      const cut = (lay) => {
        // where she climbs through them, her own shadow is the shadow (they never compound).
        // Cut with her outline itself, not her (low-res, soft) layer: an upscaled blit of it costs
        // ≈1 ms in the peel, and at a third of the procession's ink the penumbra's few px never show
        if (!Lc) return;
        lay.save(); lay.globalCompositeOperation = 'destination-out';
        for (const p of cfg.parts) lay.fill(p);
        lay.restore();
      };
      // ONE layer (never compounding inside itself): the cloud pulled paler (α .55 of the print), the
      // carriage and the tennyo over it at full (α .75)
      const pl = SB.sharpLayer(c, 'proc', procReg(hd));
      // the cloud and the carriage: from 140 one fixed image (procClock), pre-printed once into the
      // layer's own pixel grid and blitted 1:1; the tennyo float on over it, live
      const RP = pl.canvas.__region;
      const key = `${pl.canvas.width}x${pl.canvas.height}|${RP.x0},${RP.y0},${RP.s}`;
      if (T >= 140 && procStill && procStill.key === key) {
        pl.save(); pl.setTransform(1, 0, 0, 1, 0, 0); pl.drawImage(procStill.cv, 0, 0); pl.restore();
      } else {
        const Tw = procClock(T);
        pl.save(); pl.globalAlpha = 0.55 / 0.75;
        paintProcessionCloud(pl, Tw);
        pl.restore();
        paintProcessionFigures(pl, T, 'carriage', Tw);
        if (T >= 140) {
          const cv = B.canvas(pl.canvas.width, pl.canvas.height);
          cv.getContext('2d').drawImage(pl.canvas, 0, 0);
          procStill = { key, cv };
        }
      }
      paintProcessionFigures(pl, T, 'tennyo');
      cut(pl);
      SB.softPrint(c, T, 'proc', { alpha: 0.75 * f });
    }
    // ---------- against the paper: offerings, たけ with the haori, 小夜 ----------
    SB.sharpFill(c, T, [[offeringsPath(T), 'nonzero']]);
    // (after the peel only the child and the haori remain here: a small layer)
    const region = T >= 141.35 ? SEAT_REG[1] : SEAT_REG[0];
    const seatA = T < 140 ? 1 : 0;
    let haori = null, seatFg = null;
    const L = SB.sharpLayer(c, 'seat', region);
    // the child, and the haori laid over her (from 126 the haori moves; after 128.2 it rests on her)
    const kid = CAST.child(L, CH.x, CH.y, CH.s, { pose: 'sleep', haori: false, silhouette: AINEZU, t: T });
    childHead(L, kid && kid.head ? kid.head : [CH.x, CH.y - 18 * CH.s]);
    if (seatA > 0) {
      seatFg = seatedFigure(T);
      paintFigure(L, seatFg);
      haori = haoriShape(T, seatFg);
    } else {
      // after the peel the haori rests on the child
      haori = haoriShape(Math.max(T, 128.3), seatedFigure(128.3));
    }
    if (haori) L.fill(haori.path);
    // laid over her, the haori's collar stands off her neck: a small V of paper between her cheek
    // and the lapel (襟) — the one cut that says "a garment", not a lump
    const notch = io(T, 127.7, 128.4);
    if (notch > 0.01 && kid && kid.head) {
      const h = kid.head;
      L.save();
      L.globalCompositeOperation = 'destination-out';
      L.globalAlpha = notch;
      L.beginPath(); L.moveTo(h[0] + 7.6, h[1] - 7); L.lineTo(h[0] + 19.5, h[1] - 9.5); L.lineTo(h[0] + 12.6, h[1] + 6); L.closePath(); L.fill();
      L.restore();
    }
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

  /** the climber small and dark against the moon, absorbed (148.95–149.5) */
  function climberInWindow(c, T, st) {
    if (!st || !st.inWin) return;
    const m = MOON.B(T);
    const q = clamp01((T - 148.95) / 0.55);
    const s = U.lerp(0.22, 0.03, E.inQuad(q)) * TK.s;
    // from the window's lower rim into the disc's centre
    const y0 = G.window.y + G.window.r - 6;
    const px = U.lerp(G.stile + 6, m.x, E.outSine(q)), py = U.lerp(y0, m.y + 10, E.outSine(q));
    const Bs = st.back;
    const M = new DOMMatrix([s, 0, 0, s, px, py - s * (Bs.sy + 130)]);
    const fg = backFigure(Bs, M, T);
    c.save();
    SB.windowClip(c);
    PRINT.with(c, 'P4', T, (k) => {
      k.globalAlpha *= 1 - E.inQuad(clamp01((q - 0.55) / 0.45));
      k.globalCompositeOperation = 'multiply';
      k.fillStyle = U.mix(AINEZU, C.sumi, 0.25);
      for (const p of fg.parts) k.fill(p);
    });
    c.restore();
  }

  /** she is absorbed by the disc: a kira pinpoint (149.42), its rays crossing onto the sky */
  function kiraPin(c, T) {
    const pin = U.env(T, 149.32, 149.42, 149.5, 149.95);
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

  /**
   * Each grip lights the paper along the rung she takes (141.2–145.4): a short bokashi of 胡粉
   * hugging the bar on either side of her fist — rising 8 px above it, 4 px below — fading out
   * along the rung within ≈90 px, α ≤ .2. The kumiko prints over it, so the bar stays dark; her
   * own hand is left out (a gap under the fist). Never a whole cell.
   */
  const GRABS = (() => {
    const g = [];
    for (const key of ['L', 'R']) for (let i = 1; i < HANDS_B[key].length; i++) g.push({ t: HANDS_B[key][i][1], y: HANDS_B[key][i][2], hand: key === 'L' ? 0 : 1 });
    g.push({ t: 141.2, y: 615, hand: 0 }, { t: 141.2, y: 730, hand: 1 });
    // the bar under the fist: a rung, or (above the last rung) the top rail's lower edge
    for (const gr of g) {
      let bar = G.top + G.frame, top = true;
      for (const ry of G.rungs) if (Math.abs(ry - gr.y) < Math.abs(bar - gr.y)) { bar = ry; top = false; }
      gr.bar = bar; gr.top = top;
    }
    return g;
  })();
  const GLINT = { w: 200, h: 24, cy: 12 };                   // logical px; the bar's centre line at cy
  let glintSprite = null;
  function glint(k) {
    if (glintSprite && glintSprite.k === k) return glintSprite.cv;
    const W = Math.ceil(GLINT.w * k), H = Math.ceil(GLINT.h * k);
    const cv = B.canvas(W, H), x2 = cv.getContext('2d'), img = x2.createImageData(W, H);
    const [cr, cg, cb] = U.hexToRgb(C.gofun), ss = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
    for (let j = 0; j < H; j++) {
      const y = (j + 0.5) / k - GLINT.cy;
      // off the bar's edges (±1.75): 8 px of light above, 4 below
      const v = y < -1.75 ? Math.pow(clamp01(1 - (-1.75 - y) / 8), 1.8) : y > 1.75 ? 0.7 * Math.pow(clamp01(1 - (y - 1.75) / 4), 1.8) : 1;
      for (let i = 0; i < W; i++) {
        const d = Math.abs((i + 0.5) / k - GLINT.w / 2);
        const h = ss(7, 17, d) * Math.pow(clamp01(1 - (d - 17) / 80), 1.6);
        const o = (j * W + i) * 4;
        img.data[o] = cr; img.data[o + 1] = cg; img.data[o + 2] = cb; img.data[o + 3] = Math.round(255 * v * h);
      }
    }
    x2.putImageData(img, 0, 0);
    glintSprite = { k, cv };
    return cv;
  }
  function gripX(gr) {
    if (gr.x == null) {
      const st = climberState(gr.t);
      const fg = st && !st.inWin ? climberFigure(st) : null;
      gr.x = fg && fg.hands && fg.hands[gr.hand] ? fg.hands[gr.hand][0] : G.stile + (gr.hand ? 110 : 12);
    }
    return gr.x;
  }
  function cellFlashes(c, T) {
    if (T < 141.1 || T > 146.2) return;
    const live = GRABS.filter((gr) => T > gr.t && T < gr.t + 0.6);
    if (!live.length) return;
    const k = c.canvas.width / 1920;
    const spr = glint(k);
    PRINT.with(c, 'P7', T, (q) => {
      q.save();
      SB.paperClip(q);
      q.globalCompositeOperation = 'lighter';
      const a0 = q.globalAlpha;
      for (const gr of live) {
        // a quick catch as the fingers close, a slow fade
        const a = E.outSine(clamp01((T - gr.t) / 0.07)) * Math.pow(1 - clamp01((T - gr.t - 0.07) / 0.5), 2);
        if (a <= 0.003) continue;
        q.globalAlpha = a0 * 0.2 * a;
        const x = gripX(gr);
        if (gr.top) {
          // the top rail: light below its edge only
          q.save(); q.beginPath(); q.rect(x - GLINT.w / 2, gr.bar, GLINT.w, GLINT.h); q.clip();
          q.drawImage(spr, x - GLINT.w / 2, gr.bar - 1.75 - GLINT.cy, GLINT.w, GLINT.h);
          q.restore();
        } else q.drawImage(spr, x - GLINT.w / 2, gr.bar - GLINT.cy, GLINT.w, GLINT.h);
      }
      q.restore();
    });
  }

  function drawB(ctx, T) {
    // the room under the 叢雲: it dims as the streaks and the near bank close (149.25–149.65)
    // and relights as the bank's trailing lobes uncover the disc (151.95–152.45; cloudX)
    const dark = 0.97 * U.env(T, 149.25, 149.65, 151.95, 152.45);
    const st = climberState(T);
    const cfg = st && !st.inWin ? climberFigure(st) : null;
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
          const lift = U.env(T, 149.36, 149.42, 149.5, 149.62);
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
          // on the paper: the light, the glints along the rungs she grips, every shadow
          SB.light(c, T, { r: 260, falloff: 0.5, dim: dark });
          cellFlashes(c, T);          // (light on the paper: her shadow falls over it)
          shadowsB(c, T, st, cfg);
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
    const CW = Math.ceil(w * k), CH2 = Math.ceil(h * k);
    const mk = () => { const cv = B.canvas(CW, CH2); const cx = cv.getContext('2d'); cx.setTransform(k, 0, 0, k, -x0 * k, -y0 * k); return [cv, cx]; };
    const grandma = (cx, o) => CAST.grandma(cx, AP.x, AP.y, AP.s, Object.assign({ pose: 'lap', facing: AP.f, t: 0.3 }, o));
    // (the lap pose's little obi-age pill is replaced by the heko-obi bow drawn below)
    const pal = { obijime: EBICHA, child: Object.assign({}, CAST.palettes.sayo, { obiage: C.kon }) };
    // the pair in colour; the pair drained (たけ to 月白/胡粉/銀鼠 — the child and the haori keep their colour)
    const [colour, cc] = mk();
    const ret = grandma(cc, { palette: pal });
    const [drained, dc] = mk();
    grandma(dc, { drained: true, ink: C.ginnezu, palette: { child: pal.child } });
    // たけ alone (drained) — the kira of the drain front glints only on her
    const [alone, ac] = mk();
    grandma(ac, { drained: true, child: false });
    // the child's silhouette for her floor shadow (the sleeping child + the haori over her, as the lap pose lays her)
    const [kid, kc] = mk();
    const head = ret && ret.child && ret.child.head ? ret.child.head : [AP.x - 60, AP.y - 60];
    // sleepingChild is drawn at the knee in the grandma's local units; CAST.child 'sleep' anchors
    // its head 6 units above (x, y−12): place it so the heads coincide
    CAST.child(kc, head[0], head[1] + 18 * AP.s, AP.s, { pose: 'sleep', facing: AP.f, haori: true, silhouette: '#000', t: 0.3 });
    // the heko-obi bow, tied at her back: its loops push up out from under the haori at the hip
    const bow = [head[0] + AP.f * 60 * AP.s, head[1] - 14 * AP.s];
    figs = { k, colour, drained, alone, kid, bow, head, x: x0, y: y0, w, h };
    try { figs.emb = embossPair(k, mk, grandma, pal, drained); } catch (e) { figs.emb = drained; }
  }

  /**
   * たけ drained to the bare paper (Harunobu's 空摺): no ink at all on her — kimono, face, hands,
   * collar and obi are the unprinted 生成 of the sheet; only the bun keeps a pale 銀鼠 — and every
   * key line, fold and kimono stripe is blind-embossed: a 胡粉 highlight up-left, a faint 鼠 shade
   * down-right, ≈0.8 device px apart. The child and the haori in her lap keep their colour (taken
   * from the drained pair wherever the child is seen). Built once, at the backing scale.
   */
  function embossPair(k, mk, grandma, pal, drained) {
    const px = (cv) => cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
    const GK = ['skin', 'kimono', 'stripe', 'collar', 'obi', 'obijime', 'tabi'];
    const CK = ['skin', 'hair', 'kimono', 'kimonoFg', 'lining', 'obi', 'obiage', 'pants', 'sandal', 'stem', 'plume', 'dango'];
    const flat = (keys, col) => { const o = {}; for (const kk of keys) o[kk] = col; return o; };
    // 1. her paper: bare 生成, the bun pale 銀鼠, no lines
    const [paper, pc] = mk();
    grandma(pc, { drained: true, child: false, outline: 0, palette: Object.assign(flat(GK, C.kinari), { hair: U.mix(C.ginnezu, C.gofun, 0.3), comb: C.ginnezu }) });
    // 2. her lines and stripes as a mask (black ink and stripes on white fills → darkness = relief)
    const [lines, lc] = mk();
    grandma(lc, { child: false, ink: '#000000', palette: Object.assign(flat(GK, '#ffffff'), { hair: '#ffffff', comb: '#ffffff', stripe: '#000000' }) });
    const L = px(lines);
    for (let i = 0; i < L.data.length; i += 4) {
      const a = L.data[i + 3] / 255, m = (1 - L.data[i] / 255) * a;
      L.data[i] = L.data[i + 1] = L.data[i + 2] = 0; L.data[i + 3] = Math.round(255 * m);
    }
    lines.getContext('2d').putImageData(L, 0, 0);
    const tint = (col) => {
      const cv = B.canvas(lines.width, lines.height), c = cv.getContext('2d');
      c.drawImage(lines, 0, 0);
      c.globalCompositeOperation = 'source-in';
      c.fillStyle = col; c.fillRect(0, 0, cv.width, cv.height);
      return cv;
    };
    const d = 0.8;                                        // device px
    const pcx = paper.getContext('2d');
    pcx.save();
    pcx.setTransform(1, 0, 0, 1, 0, 0);
    pcx.globalCompositeOperation = 'source-atop';         // (only on her)
    pcx.globalAlpha = 0.18; pcx.drawImage(tint(C.nezumi), d, d);
    pcx.globalAlpha = 0.9; pcx.drawImage(tint(C.gofun), -d, -d);
    pcx.restore();
    // 3. where the child is seen: vary only her colours (and the haori's) between two renders
    const [cA, aC] = mk(), [cB, bC] = mk();
    grandma(aC, { drained: true, ink: C.ginnezu, palette: { child: Object.assign({}, pal.child, flat(CK, '#000000')), haori: '#000000', haoriFg: '#000000' } });
    grandma(bC, { drained: true, ink: C.ginnezu, palette: { child: Object.assign({}, pal.child, flat(CK, '#ffffff')), haori: '#ffffff', haoriFg: '#ffffff' } });
    const A = px(cA), Bd = px(cB), D = px(drained), P = px(paper);
    const W = cA.width, H = cA.height, m = new Uint8Array(W * H);
    for (let i = 0, j = 0; i < A.data.length; i += 4, j++) {
      const diff = Math.abs(A.data[i] - Bd.data[i]) + Math.abs(A.data[i + 1] - Bd.data[i + 1]) + Math.abs(A.data[i + 2] - Bd.data[i + 2]);
      if (diff > 60 || (D.data[i + 3] > 8 && P.data[i + 3] < 8)) m[j] = 1;
    }
    // (grown by a pixel, so the child's own outline comes with her)
    const mm = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = 0;
      for (let dy = -1; dy <= 1 && !v; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < W && yy < H && m[yy * W + xx]) { v = 1; break; }
      }
      mm[y * W + x] = v;
    }
    for (let i = 0, j = 0; i < D.data.length; i += 4, j++) if (!mm[j]) D.data[i + 3] = 0;
    const child = B.canvas(W, H);
    child.getContext('2d').putImageData(D, 0, 0);
    pcx.save();
    pcx.setTransform(1, 0, 0, 1, 0, 0);
    pcx.drawImage(child, 0, 0);
    pcx.restore();
    return paper;
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
          // long, flat, hard-edged moon shadows raking to the lower left (墨 α .45, full resolution:
          // no penumbra) — the jug, the 三方, the sleeping child; the grandmother casts none
          SA.castShadow(c, T, (s2) => drawOfferingsA(s2, T, true), { baseY: 944, alpha: 0.45, len: 2.6, res: 1, color: C.sumi, bbox: [500, 700, 740, 946] });
          SA.castShadow(c, T, (s2) => {
            s2.drawImage(figs.kid, figs.x, figs.y, figs.w, figs.h);
          }, { baseY: 934, alpha: 0.45, len: 2.6, res: 1, color: C.sumi, bbox: [figs.x, 850, figs.x + figs.w, 942] });
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
      k2.drawImage(figs.emb || figs.drained, figs.x, figs.y, figs.w, figs.h);
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
      // allocate every shadow layer's buffer now (its size is a pure function of its region), so no
      // canvas is created mid-climb: the peel's five penumbra steps, the climber, the procession,
      // the seat before and after the peel, the silk, the drain
      try {
        const k = S.k || 1, dummy = B.canvas(Math.round(1920 * k), 4).getContext('2d');
        for (const r of CLIMB_RES) SB.softLayer(dummy, 'climb', CLIMB_REG, r);
        SB.sharpLayer(dummy, 'climb', CLIMB_REG);
        SB.sharpLayer(dummy, 'proc', procReg({ x: 1000, y: 400 }));
        SB.sharpLayer(dummy, 'ribbon', RIB_REG);
        for (const r of SEAT_REG) SB.sharpLayer(dummy, 'seat', r);
        SB.sharpLayer(dummy, 'silk', SEAT_REG[0]);
        if (figs) for (const n of ['drain', 'drainKira']) SB.sharpLayer(dummy, n, [figs.x, figs.y, figs.x + figs.w, figs.y + figs.h], 1);
      } catch (e) { /* warming is only an optimisation */ }
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
