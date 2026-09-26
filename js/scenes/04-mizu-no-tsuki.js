/* ==========================================================================
   04-mizu-no-tsuki.js — 三 水の月 (66–90), Shot C.
   The child's hands shatter the moon in the tsukubai into mica; it regathers,
   untouched. たけ's ladle lifts a tiny moon into the child's cupped hands and
   it leaks away bead by bead, until her hands are dark and empty. Then たけ's
   old hands glide in already joined in the fox window (狐の窓); the diamond
   fills with the moon's true face (Shot D) and opens until the sky is all
   there is (88.2–90.0) — 四 begins on the identical frame.
   All times below are GLOBAL film time T (66–90).

   The child kneels at the near rim, a little to the left: her forearms
   come in from the lower left and the lower right on converging lines, out
   of 紺絣 sleeves whose 紅-lined mouths (袖口) sit at the wrists, and sink
   into her own shadow after ~300 px — arms at a glance, never two legs. The
   grab plunges straight ahead; the cupped hands turn a little toward たけ's
   ladle, which answers from the top right — the handle crosses the frame.
   Hands are never morphed: grab, cup and window are separate poses that
   slide in and out. The cupped hands are baked once into sprites (moonlit,
   lit from within by the moon they hold, and fallen into night) and only
   translated; the window is one authored 墨 silhouette with an even-odd hole
   — the hole is also the clip through which Shot D is seen.
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const U = TSUKI.U, B = TSUKI.B, C = TSUKI.C;
  const PRINT = TSUKI.PRINT, CAST = TSUKI.CAST, MOON = TSUKI.MOON;
  const TAU = Math.PI * 2;
  const E = U.ease;

  /* ---------------- beats (absolute film time) ------------------------- */
  const BT = {
    plunge: 67.4, shatter: 67.9, up: 68.9, calm: 70.0, whole: 71.8,
    ladleIn: 72.0, dip: 73.0, lift: 73.8, tip: 75.0, sit: 75.4, tremble: 80.6, last: 82.2,
    ladleOut: 83.2, cupOut: 84.6, window: 86.0, reveal: 87.2, open: 88.2, end: 90.0,
  };

  /* ---------------- layout -------------------------------------------- */
  const REFL = { x: 1000, y: 600 };
  const ARM = 0.26;                              // the child's cupped hands: turned a little from the lower left (rad)
  // the grab: she plunges both hands straight ahead of her (her body below the
  // basin, a little to the left); the forearms come in on converging lines
  // from the lower left and the lower right, each out of its sleeve mouth
  const GRAB = { x: 1000, y: 628, s: 1.25, arm: 0.04, splay: 0.56 };
  const CUP = { s: 1.15, splay: [0.32, 0.44] };                 // splay: left, right (rad, from the arm axis)
  const LADLE = { s: 1.4, angle: 2.3, len: 560 };
  const FOX = { x: 960, y: 420, zoom: 12.4 };
  const PALM_R = 18;
  const ca = Math.cos(ARM), sa = Math.sin(ARM);
  /** local (arm frame) → world offset */
  const rot = (p) => [p[0] * ca - p[1] * sa, p[0] * sa + p[1] * ca];

  /* ---------------- night: the hands' palette glazed toward 藍 --------- */
  const NIGHT = U.mix(C.ai, C.koiai, 0.45);
  const HANDS = {
    skin: U.mix(C.gofun, C.kitsune, 0.24), skinOld: U.mix(U.mix(C.gofun, C.kitsune, 0.28), C.odo, 0.12),
    crease: U.mix(C.kitsune, C.sumi, 0.35), spot: U.mix(C.odo, C.kitsune, 0.5), vein: U.mix(C.ai, C.kitsune, 0.55),
    nail: U.mix(C.gofun, C.toki, 0.35), sleeve: C.ai, sleeveFg: C.gofun, childSleeve: C.kon, childSleeveFg: C.gofun,
    bamboo: U.mix(C.odo, C.sumi, 0.5), cup: C.odo, water: U.mix(C.ai, C.koiai, 0.4),
  };
  const nightPal = (a, to = NIGHT) => { const o = {}; for (const k of Object.keys(HANDS)) o[k] = U.mix(HANDS[k], to, a); return o; };
  const NIGHT_PAL = nightPal(0.24);
  const CHILD_PAL = Object.assign({}, NIGHT_PAL, { crease: U.mix(NIGHT_PAL.crease, NIGHT_PAL.skin, 0.5) });

  /* ---------------- shards: the reflection broken into arcs of light ---- */
  /*
   * The disc cracks into sixteen pieces — a core of 3, a ring of 5, a rim of
   * 8 — whose edges are shared, so at rest they tile it exactly (unit-disc
   * coordinates). Struck, each piece rides out on the ripples as an ARC of
   * the rim: it keeps to its circle about the centre, stretching along it and
   * thinning across it into a crescent, each at its own speed and distance,
   * turning a little on its own — never an orderly ring — and each glints
   * ('lighter' kira) and dims on its own clock. They regather with τ 0.5 s,
   * dock with no gap by 71.4, and the whole reflection closes over them.
   */
  const ORIGINS = [[0, 0.12], [-1.55, 0.5], [1.55, 0.5]];   // unit-disc coords (y before perspective)
  const SHARDS = (() => {
    const out = [];
    const bands = [[0, 0.4, 3], [0.4, 0.72, 5], [0.72, 1.0, 8]];
    const bound = (R, th) => (R <= 0 || R >= 1 ? R : R + 0.05 * (U.noise1(th * 2.2 + R * 17, 83) * 2 - 1));
    const r = U.rng(8087);
    for (const [r0, r1, n] of bands) {
      const off = r() * TAU;
      const cracks = [];
      for (let i = 0; i < n; i++) cracks.push({ a: off + (i / n) * TAU + U.lerp(-0.3, 0.3, r()) * (TAU / n) * 0.5, lean: U.lerp(-0.3, 0.3, r()) * (TAU / n) });
      for (let i = 0; i < n; i++) {
        const c0 = cracks[i], c1 = cracks[(i + 1) % n];
        let a0 = c0.a, a1 = c1.a;
        if (a1 <= a0) a1 += TAU;
        const pol = [];                                 // [ρ, θ] round the piece
        const N = 8;
        const aOut0 = a0 + c0.lean, aOut1 = a1 + c1.lean;
        for (let q = 0; q <= N; q++) { const t = a0 + (a1 - a0) * q / N; pol.push([bound(r0, t), t]); }
        for (let q = N; q >= 0; q--) { const t = aOut0 + (aOut1 - aOut0) * q / N; pol.push([bound(r1, t), t]); }
        const pts = pol.map(([rr, t]) => [Math.cos(t) * rr, Math.sin(t) * rr]);
        const cx = pts.reduce((sum, p) => sum + p[0], 0) / pts.length, cy = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
        // the ripple it rides: the plunge at the centre, or the ring from one
        // of the two hands — so the arcs never share one circle
        const o = ORIGINS[r() < 0.5 ? 0 : cx < 0 ? 1 : 2];
        const rc = Math.hypot(cx - o[0], cy - o[1]), tc = Math.atan2(cy - o[1], cx - o[0]);
        // each vertex in polar form about that origin, its angle unwrapped about the piece's
        const pol2 = pts.map(([x, y]) => {
          const t = Math.atan2(y - o[1], x - o[0]);
          return [Math.hypot(x - o[0], y - o[1]), tc + Math.atan2(Math.sin(t - tc), Math.cos(t - tc))];
        });
        out.push({
          pol: pol2, rc, tc, o,
          travel: U.lerp(r0 === 0 ? 0.9 : 0.2, 2.4, Math.pow(r(), 1.3)),   // how far out (disc radii) it rides (the core's wedges all go: they open into arcs)
          swirl: U.lerp(-0.7, 0.7, r()),                  // how far round (rad) it is carried
          stretch: U.lerp(1.15, 1.9, r()),                // along its circle
          thin: U.lerp(0.35, 0.65, r()),                  // across it
          out: U.lerp(0.8, 1.7, r()),                     // seconds to fly out
          dim: U.lerp(0.25, 0.85, r()), dimW: U.lerp(2.2, 5.5, r()), ph: r() * TAU,
          kira: Math.pow(r(), 1.5), kiraW: U.lerp(5, 11, r()), kph: r() * TAU,
        });
      }
    }
    return out;
  })();

  const DOCK = 71.4;                                    // every gap closed
  /** The regather (0 = docked … 1 = flown): τ 0.5 from 70.0, landing softly by DOCK. */
  function gather(T) {
    if (T < BT.calm) return 1;
    if (T >= DOCK) return 0;
    const e1 = Math.exp(-(DOCK - BT.calm) / 0.5);
    return ((Math.exp(-(T - BT.calm) / 0.5) - e1) / (1 - e1)) * (1 - U.smoothstep(71.0, DOCK, T));
  }
  /** 0 = whole … 1 = fully scattered (piece s, or the whole field when s is omitted). */
  function scatter(T, s) {
    if (T < BT.shatter || T >= DOCK) return 0;
    const out = E.outCubic(U.clamp((T - BT.shatter) / (s ? s.out : 1.4)));
    return out * gather(T);
  }
  /** The water's wobble of the reflection (the same transform SC.reflection applies). */
  const wobXf = (T, wob) => ({ x: wob * 3 * Math.sin(T * 9.1), sx: 1 + wob * 0.06 * Math.sin(T * 7.3), sy: 1 - wob * 0.05 * Math.sin(T * 6.1 + 1) });

  function drawShards(ctx, T, alpha, wob) {
    if (alpha <= 0.003) return;
    const R = TSUKI.SHOTS.C.G.refl;
    const persp = R.ry / R.rx;
    const gz = MOON.glaze(T);
    const xf = wobXf(T, wob);
    ctx.save();
    TSUKI.SHOTS.C.waterClip(ctx);
    ctx.clip();
    ctx.translate(REFL.x + xf.x, REFL.y);
    ctx.scale(R.rx * xf.sx, R.rx * persp * xf.sy);
    ctx.globalAlpha *= alpha;
    const glints = [];
    for (let i = 0; i < SHARDS.length; i++) {
      const s = SHARDS[i];
      const sc = scatter(T, s);
      // the piece's centre rides out on its circle and is carried round a little
      const rc = s.rc + sc * s.travel + sc * 0.05 * Math.sin(T * 7 + i);
      const tc = s.tc + sc * s.swirl;
      const kS = 1 + (s.stretch - 1) * sc, kT = 1 - s.thin * sc;
      const arcK = (Math.max(s.rc, 0.2) / Math.max(rc, 0.2)) * kS;   // keep (and stretch) its arc length
      const p = new Path2D();
      s.pol.forEach(([rr, t], j) => {
        const r2 = Math.max(0, rc + (rr - s.rc) * kT), t2 = tc + (t - s.tc) * arcK;
        const X = s.o[0] + Math.cos(t2) * r2, Y = s.o[1] + Math.sin(t2) * r2;
        if (j) p.lineTo(X, Y); else p.moveTo(X, Y);
      });
      p.closePath();
      // each dims on its own clock while it is out
      const a = 1 - sc * s.dim * (0.5 + 0.5 * Math.sin(T * s.dimW + s.ph));
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.fillStyle = C.kinari;
      ctx.fill(p);
      if (gz.alpha > 0) { ctx.fillStyle = U.rgba(gz.color, gz.alpha); ctx.fill(p); }
      ctx.restore();
      const k = sc * s.kira * Math.pow(Math.max(0, Math.sin(T * s.kiraW + s.kph)), 3);
      if (k > 0.02) glints.push([p, k * a]);
    }
    // mica: some pieces flash, unevenly
    if (glints.length) {
      ctx.globalCompositeOperation = 'lighter';
      for (const [p, k] of glints) {
        ctx.fillStyle = `rgba(255,250,236,${0.55 * k})`;
        ctx.fill(p);
      }
    }
    ctx.restore();
  }

  /* ---------------- ripples -------------------------------------------- */
  function allRings(T) {
    const SC = TSUKI.SHOTS.C;
    const list = SC.dropRings(T);
    // the plunge: rings race outward from both hands
    if (T > BT.shatter - 0.1 && T < BT.calm + 1) {
      for (let i = 0; i < 4; i++) list.push({ x: REFL.x, y: REFL.y + 8, t0: BT.shatter - 0.05 + i * 0.2, speed: 190 - i * 20, life: 2.1 - i * 0.15, amp: 0.55, n: 3, gap: 9, r0: 50, w: 1.3 });
      for (const dx of [-110, 110]) list.push({ x: REFL.x + dx, y: REFL.y + 22, t0: BT.shatter - 0.08, speed: 150, life: 1.9, amp: 0.4, n: 2, gap: 8, r0: 20 });
      // drops falling from the lifted, empty hands
      for (let i = 0; i < 5; i++) list.push({ x: REFL.x + U.lerp(-120, 120, U.hash(i + 3)), y: REFL.y + U.lerp(-10, 60, U.hash(i + 9)), t0: BT.up + 0.25 + i * 0.16, speed: 45, life: 1.0, amp: 0.35, n: 2, gap: 5 });
    }
    // the ladle's dip
    if (T > BT.dip - 0.1 && T < BT.dip + 2) {
      list.push({ x: REFL.x, y: REFL.y, t0: BT.dip, speed: 70, life: 1.6, amp: 0.45, n: 3, gap: 7, r0: 24 });
      list.push({ x: REFL.x, y: REFL.y, t0: BT.lift, speed: 55, life: 1.4, amp: 0.35, n: 2, gap: 6, r0: 22 });
    }
    // beads from the child's palms
    for (const b of palmBeads(T)) if (b.landed) list.push({ x: b.lx, y: b.ly, t0: b.tl, speed: 34, life: 1.0, amp: 0.3, n: 2, gap: 4 });
    return list;
  }

  /* ---------------- scratch (the settle's stretch, the window's wipe):   */
  /* ONE stage-size canvas, allocated in init(). Its users never overlap:  */
  /* the settle ends at 67.2, the wipe runs 87.2–88.0.                     */
  let scratch = null;
  let sbox = null;   // device-pixel rect of the current scratch pass (immediate, not carried between frames)
  function stageScratch(w, h) {
    if (!scratch || scratch.width !== w || scratch.height !== h) scratch = B.canvas(w, h);
    const s = scratch.getContext('2d');
    s.restore(); s.restore();                                  // drop any clip left from the last pass
    s.setTransform(1, 0, 0, 1, 0, 0);
    s.globalCompositeOperation = 'source-over';
    s.globalAlpha = 1;
    return s;
  }
  function scratchFor(ctx, box) {
    const cv = ctx.canvas;
    const s = stageScratch(cv.width, cv.height);
    const M = ctx.getTransform();
    const bx = box || [0, 0, 1920, 1080];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [lx, ly] of [[bx[0], bx[1]], [bx[2], bx[1]], [bx[0], bx[3]], [bx[2], bx[3]]]) {
      const dx = M.a * lx + M.c * ly + M.e, dy = M.b * lx + M.d * ly + M.f;
      x0 = Math.min(x0, dx); x1 = Math.max(x1, dx); y0 = Math.min(y0, dy); y1 = Math.max(y1, dy);
    }
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
    x1 = Math.min(cv.width, Math.ceil(x1)); y1 = Math.min(cv.height, Math.ceil(y1));
    sbox = x1 > x0 && y1 > y0 ? [x0, y0, x1 - x0, y1 - y0] : null;
    s.save();
    if (sbox) {
      s.clearRect(sbox[0], sbox[1], sbox[2], sbox[3]);
      s.beginPath();
      s.rect(sbox[0], sbox[1], sbox[2], sbox[3]);
      s.clip();
    }
    s.setTransform(M);
    return s;
  }
  function blitScratch(ctx, alpha = 1) {
    if (!sbox) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha *= alpha;
    ctx.drawImage(scratch, sbox[0], sbox[1], sbox[2], sbox[3], sbox[0], sbox[1], sbox[2], sbox[3]);
    ctx.restore();
  }

  /* ---------------- 小夜's kasuri sleeves ------------------------------- */
  /*
   * 紺絣: ragged 十字 and 井桁 marks at uneven spacing on 紺. A kasuri mark is
   * dyed into the threads before weaving, so its edges break into the weft:
   * each bar is built of short weft dashes that slip a little sideways, with
   * a 1 px bleed of paler ink round them. One 100 px tile per night glaze.
   */
  const kasuriTiles = new Map();
  function kasuri(a) {
    const key = a.toFixed(2);
    if (kasuriTiles.has(key)) return kasuriTiles.get(key);
    const S = 100;
    const t = B.canvas(S, S);
    const c = t.getContext('2d');
    c.fillStyle = U.mix(C.kon, NIGHT, a);
    c.fillRect(0, 0, S, S);
    const r = U.rng(1212);
    const fg = U.mix(C.gofun, NIGHT, a);
    // one weft dash (wrapped round the tile so the pattern repeats seamlessly)
    const dash = (x, y, w, h, al) => {
      c.fillStyle = U.rgba(fg, al);
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) c.fillRect(x + ox, y + oy, w, h);
    };
    /** a bar of the mark: `n` weft rows from (x, y), each `w` wide, slipping sideways */
    const bar = (x, y, w, n) => {
      for (let q = 0; q < n; q++) {
        const sl = U.lerp(-1.6, 1.6, r()), ww = w * U.lerp(0.75, 1.15, r());
        dash(x + sl - 1, y + q * 1.5 - 0.6, ww + 2, 2.4, 0.22);   // the bleed
        if (r() > 0.1) dash(x + sl, y + q * 1.5, ww, 1.25, U.lerp(0.62, 0.9, r()));
      }
    };
    // marks on a jittered 3 × 3 lattice, two cells left plain
    const skip = new Set([Math.floor(r() * 9), Math.floor(r() * 9)]);
    for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 3; gx++) {
      if (skip.has(gy * 3 + gx)) continue;
      const cx = (gx + 0.5) * (S / 3) + ((gy % 2) * S / 6) + U.lerp(-7, 7, r()), cy = (gy + 0.5) * (S / 3) + U.lerp(-6, 6, r());
      if (r() < 0.72) {
        // 十字: a vertical of short weft rows, and a two-row horizontal
        const hl = U.lerp(9, 12, r()), vl = Math.round(U.lerp(6, 8, r()));
        bar(cx - 1.4, cy - vl * 0.75, 2.8, vl);
        bar(cx - hl / 2, cy - 1.2, hl, 2);
      } else {
        // 井桁: two short verticals crossed by two horizontals
        for (const ox of [-2.6, 2.6]) bar(cx + ox - 1.1, cy - 5.5, 2.2, 7);
        for (const oy of [-2.6, 2.6]) bar(cx - 6, cy + oy - 0.6, 12, 1);
      }
    }
    kasuriTiles.set(key, t);
    return t;
  }
  /**
   * 小夜's kimono sleeve (袖) seen from behind and above as she reaches away:
   * the forearm comes OUT of the sleeve mouth (袖口) — the sleeve is printed
   * over the forearm stub, its rim bowed toward the hand, a little wider than
   * the wrist, with the 紅 lining (ふき) showing as a thin band along it and
   * the 袂 hanging on the outer side: a sleeve at a glance, never a trouser
   * leg. Foreshortened (it opens fast toward the shoulder), and from `dark`
   * [a, b] px behind the mouth it sinks into the child's own shadow (a 墨
   * bokashi to α .86), so only ~300 px of arm reads before the dark.
   * (mx, my) = the mouth's centre; (dx, dy) toward the shoulder; `side` ±1 =
   * the outer side (away from the other arm); s = the hands' scale.
   */
  function sode(c, mx, my, dx, dy, o) {
    const s = o.s, side = o.side || 1, night = o.night == null ? 0.24 : o.night;
    const w0 = o.w0 * s, w1 = o.w1 * s, len = o.len, dk = o.dark || [150 * s, 290 * s];
    const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy * side, ny = ux * side;
    const p = (a, b) => [mx + ux * a + nx * b, my + uy * a + ny * b];
    const hw = (a) => (w0 + (w1 - w0) * Math.pow(U.clamp(a / (len * 0.62)), 0.85)) / 2;
    const bag = (a) => w1 * 0.3 * U.smoothstep(0.1, 0.34, a / len);          // the 袂, hanging outward
    const bow = w0 * 0.2;                                                     // the rim bows toward the hand
    const N = 22, inner = [], outer = [], crease = [];
    for (let q = 0; q <= N; q++) {
      const a = len * Math.pow(q / N, 1.3);
      inner.push(p(a, -hw(a)));
      outer.push(p(a, hw(a) + bag(a)));
      if (a > len * 0.1 && a < dk[1]) crease.push(p(a, hw(a) * 0.9));
    }
    const rimA = outer[0], rimB = inner[0], rimC = p(-bow * 2, 0);
    const path = new Path2D();
    path.moveTo(...inner[0]);
    for (let q = 1; q <= N; q++) path.lineTo(...inner[q]);
    for (let q = N; q >= 0; q--) path.lineTo(...outer[q]);
    path.quadraticCurveTo(...rimC, ...rimB);
    path.closePath();
    // into the child's shadow: a 墨 bokashi along the sleeve (over line and lining alike)
    const shadow = () => {
      c.save();
      c.clip(path);
      const gl = c.createLinearGradient(...p(dk[0], 0), ...p(dk[1], 0));
      gl.addColorStop(0, U.rgba(C.sumi, 0));
      gl.addColorStop(0.55, U.rgba(C.sumi, 0.5));
      gl.addColorStop(1, U.rgba(C.sumi, 0.86));
      c.fillStyle = gl;
      c.fill(path);
      c.restore();
    };
    if (o.shadowOnly) { shadow(); return; }
    const pat = c.createPattern(kasuri(night), 'repeat');
    const ang = Math.atan2(uy, ux) - Math.PI / 2;
    pat.setTransform(new DOMMatrix().translate(mx, my).rotate((ang * 180) / Math.PI).scale((s / 1.75) * 0.74));
    c.save();
    c.fillStyle = pat;
    c.fill(path);
    c.clip(path);
    // the shadowed underside (away from the moon) and the 袂 in shadow
    const g = c.createLinearGradient(...p(0, -w1 / 2), ...p(0, w1 / 2 + w1 * 0.3));
    g.addColorStop(0, U.rgba(C.sumi, 0.1));
    g.addColorStop(0.4, U.rgba(C.sumi, 0));
    g.addColorStop(0.62, U.rgba(C.sumi, 0.12));
    g.addColorStop(1, U.rgba(C.sumi, 0.45));
    c.fillStyle = g;
    c.fill(path);
    // the crease where the 袂 falls away from the arm
    B.taper(c, crease, 0.6 * s, 2.6 * s, U.rgba(C.sumi, 0.66), 0.1);
    // the cloth bunched where the forearm bends up out of it: two carved folds
    // curving back from the inner edge
    for (const [a0, f] of [[0.2, 0.62], [0.34, 0.5]]) {
      const a = dk[0] * a0 / 0.3, h = hw(a);
      B.taper(c, [p(a, -h - 2), p(a + 10 * s, -h * (1 - f * 0.55)), p(a + 26 * s, -h * (1 - f))], 2.4 * s, 0.4 * s, U.rgba(C.sumi, 0.6), 0.2);
    }
    c.restore();
    // the 墨 key line, then the lining along the rim over it
    c.save();
    c.strokeStyle = U.rgba(C.sumi, 0.85);
    c.lineWidth = 1.9 * s;
    c.lineJoin = 'round';
    c.stroke(path);
    const rim = new Path2D();
    rim.moveTo(...rimA);
    rim.quadraticCurveTo(...rimC, ...rimB);
    // the 紅 lining showing at the mouth (ふき): a crescent just inside the rim,
    // fullest at the middle, gone at the two corners — the Harunobu sleeve
    const lin = new Path2D();
    lin.moveTo(...rimA);
    lin.quadraticCurveTo(...rimC, ...rimB);
    lin.quadraticCurveTo(...p(-bow * 0.45, 0), ...rimA);
    c.fillStyle = U.mix(U.mix(C.beni, C.enji, 0.3), NIGHT, night + 0.1);
    c.fill(lin);
    c.strokeStyle = U.rgba(C.sumi, 0.9);
    c.lineWidth = 1.7 * s;
    c.lineCap = 'round';
    c.stroke(rim);
    c.restore();
    shadow();
  }

  /* ---------------- the child's grabbing hands (67.4–70.3) ------------- */
  function drawGrab(ctx, T) {
    if (T < BT.plunge || T > BT.calm + 0.3) return;
    const inP = E.outCubic(U.seg(T, BT.plunge, BT.shatter));
    const outP = E.inOutSine(U.seg(T, BT.up + 0.1, BT.calm + 0.2));
    const lift = E.outSine(U.seg(T, BT.up, BT.up + 0.35));             // coming up: nearer the eye
    const back = (1 - inP) * 560 + outP * 620 - lift * 14;            // along her reach, toward the body
    const A = GRAB.arm, cA = Math.cos(A), sA = Math.sin(A);
    const rotG = (q) => [q[0] * cA - q[1] * sA, q[0] * sA + q[1] * cA];
    const [bx, by] = rotG([0, back]);
    const x = GRAB.x + bx, y = GRAB.y + by;
    const s = GRAB.s * (1 + 0.05 * lift - 0.04 * (T > BT.shatter && T < BT.up ? 1 : 0) * E.outSine(U.seg(T, BT.shatter, BT.shatter + 0.2)));
    // a clutch at the water, never a fist: the long fingers gather (to 0.7) and
    // open again as the hands come up empty
    const CL = 0.7;
    const close = CL * (T < BT.shatter ? 0 : T < BT.up ? E.outCubic(U.seg(T, BT.shatter, BT.shatter + 0.22)) : U.lerp(1, 0.25, E.inOutSine(U.seg(T, BT.up, BT.up + 0.5))));
    // the fingers are dry until they strike the water, in it while she clutches,
    // and come up out of it (the beads carry the wet away)
    const under = U.env(T, BT.shatter - 0.06, BT.shatter + 0.1, BT.up - 0.1, BT.up + 0.15);
    // (CAST's wet needs dip·finger ≥ 0.2·tip radius: a dip under ≈ 0.12 throws,
    // so the tips go in with the strike itself at 0.14 and come out the same way)
    const dip = under < 0.4 ? 0 : Math.max(0.14, under * (0.26 + 0.2 * close));
    const geo = (() => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(A);
      const g = CAST.hands(ctx, 0, 0, s, { pose: 'grab', close, t: T, age: 0, sleeve: false, palette: NIGHT_PAL, dip, wet: dip > 0.004 });
      ctx.restore();
      return g;
    })();
    // the sleeves: out of each mouth back toward her shoulders, the two arms
    // splayed apart (lower left, lower right) — printed over the forearm stubs
    for (const sd of [-1, 1]) {
      const th = sd * 0.16;                                             // the hand's own turn (CAST grab)
      const m = rotG([(sd * 66 - 17 * Math.sin(th)) * s, (40 + 17 * Math.cos(th)) * s]);
      const d = rotG([sd * Math.sin(GRAB.splay), Math.cos(GRAB.splay)]);
      sode(ctx, x + m[0], y + m[1], d[0], d[1], { s, side: sd, w0: 56, w1: 118, len: 520, dark: [90 * s, 235 * s] });
    }
    // bright beads falling from the fingertips as they come up empty
    if (geo && T > BT.up && T < BT.up + 1.2) {
      ctx.save();
      geo.tips.forEach((p0, i) => {
        const t0 = BT.up + 0.05 + (i % 5) * 0.12 + U.hash(i + 71) * 0.1;
        const age = T - t0;
        if (age < 0 || age > 0.5) return;
        const q = rotG(p0);
        const px = x + q[0], py = y + q[1];
        const yy = py + 10 + 90 * age * age * 4;
        if (yy > 945) return;
        ctx.fillStyle = U.rgba(C.gofun, 0.9 * (1 - age / 0.5));
        ctx.beginPath();
        ctx.ellipse(px, yy, 3, 3 + 5 * age, 0, 0, TAU);
        ctx.fill();
      });
      ctx.restore();
    }
  }

  /* ---------------- たけ's ladle (72.0–84.4) ---------------------------- */
  let ladleOff = null;   // cup position relative to the hand anchor (computed once)
  function ladleOffset() {
    if (ladleOff) return ladleOff;
    const cv = B.canvas(8, 8);
    const g = CAST.hands(cv.getContext('2d'), 0, 0, LADLE.s, { pose: 'ladle', tilt: 0, angle: LADLE.angle, len: LADLE.len, age: 1 });
    ladleOff = g ? g.cup : [-480, 600];
    return ladleOff;
  }
  const POUR = { x: 1046, y: 556 };        // the cup, hovering over the palms
  const REST = { x: 1136, y: 494 };        // laid by, beside the palms: the hand off-frame
  /** Where the ladle's cup is at T, its scale and tilt. */
  function ladleState(T) {
    if (T < BT.ladleIn || T > BT.cupOut + 0.3) return null;
    const off = ladleOffset();
    const L = Math.hypot(off[0], off[1]);
    const u = [-off[0] / L, -off[1] / L];                // from the cup toward the hand (up-right)
    const enter = E.outCubic(U.seg(T, BT.ladleIn, BT.dip - 0.05));
    const leave = E.inOutSine(U.seg(T, BT.ladleOut, BT.cupOut + 0.3));
    const hover = E.inOutSine(U.seg(T, BT.lift, BT.tip - 0.12));
    const rest = E.inOutSine(U.seg(T, BT.sit + 0.15, BT.sit + 1.5));
    let cx = U.lerp(U.lerp(REFL.x, POUR.x, hover), REST.x, rest);
    let cy = U.lerp(U.lerp(REFL.y, POUR.y, hover), REST.y, rest);
    const away = (1 - enter) * 900 + leave * 950;
    cx += u[0] * away + 1.4 * U.wobble(T * 0.5, 23) * (1 - rest);
    cy += u[1] * away + 1.4 * U.wobble(T * 0.43, 29) * (1 - rest);
    const dipK = U.env(T, BT.dip - 0.1, BT.dip + 0.15, BT.lift - 0.1, BT.lift + 0.15);
    const scale = LADLE.s * (1 - 0.05 * dipK + 0.05 * hover * (1 - rest));
    const tilt = U.env(T, BT.tip - 0.08, BT.tip + 0.2, BT.sit - 0.05, BT.sit + 0.5);
    const water = T < BT.dip + 0.2 ? 0 : T < BT.tip ? E.outSine(U.seg(T, BT.dip + 0.2, BT.lift)) : U.lerp(1, 0, U.seg(T, BT.tip, BT.sit));
    return { cx, cy, scale, tilt, water };
  }
  function drawLadle(ctx, T) {
    const L = ladleState(T);
    if (!L) return null;
    const off = ladleOffset();
    const k = L.scale / LADLE.s;
    const ax = L.cx - off[0] * k, ay = L.cy - off[1] * k;
    const g = CAST.hands(ctx, ax, ay, L.scale, { pose: 'ladle', tilt: L.tilt, angle: LADLE.angle, len: LADLE.len, water: L.water, age: 1, t: T, palette: NIGHT_PAL });
    // the tiny moon in the cup (from the lift until it pours out)
    if (g && T >= BT.lift - 0.05 && T < BT.tip + 0.12) {
      const a = E.outSine(U.seg(T, BT.lift - 0.05, BT.lift + 0.35)) * (1 - U.smoothstep(BT.tip, BT.tip + 0.12, T));
      ctx.save();
      ctx.translate(g.cup[0], g.cup[1]);
      ctx.rotate(g.rot || 0);
      ctx.scale(1, Math.max(0.35, (g.ry || 1) / (g.rx || 1)));
      MOON.draw(ctx, 0, 0, Math.min(PALM_R, (g.rx || PALM_R) * 0.8), T, { alpha: a, fringe: false });
      ctx.restore();
    }
    return g;
  }

  /** The pour (75.0–75.4): a tongue of water from the tipped cup, the moon riding it into the palms. */
  function drawPour(ctx, T, cupGeo, pool) {
    if (T < BT.tip || T >= BT.sit + 0.05 || !cupGeo || !pool) return;
    const u = U.seg(T, BT.tip, BT.sit);
    const lip = cupGeo.lip || cupGeo.cup;
    const tongue = U.env(T, BT.tip, BT.tip + 0.1, BT.sit - 0.08, BT.sit + 0.05);
    const mx = U.lerp(lip[0], pool.x, 0.5) - 6, my = U.lerp(lip[1], pool.y, 0.5) - 8;
    const pts = B.qpts(lip[0], lip[1], mx, my, pool.x, pool.y, 10);
    if (tongue > 0.01) B.taper(ctx, pts, 8, 2, U.rgba(C.geppaku, 0.4 * tongue), 0.2);
    // the moon carried in the tongue: squashed as it slides, opening as it lands
    const e = E.inOutSine(u);
    const q = U.qbez(lip, [mx, my], [pool.x, pool.y], e);
    ctx.save();
    ctx.translate(q[0], q[1]);
    ctx.scale(1, U.lerp(0.45, 0.8, E.inQuad(u)));
    MOON.draw(ctx, 0, 0, PALM_R, T, { fringe: false, alpha: U.smoothstep(BT.tip, BT.tip + 0.08, T) });
    ctx.restore();
    // a small landing ring in the palms
    if (u > 0.85) {
      const k = U.seg(T, BT.sit - 0.06, BT.sit + 0.05);
      ctx.save();
      ctx.strokeStyle = U.rgba(C.geppaku, 0.5 * (1 - k));
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(pool.x, pool.y, PALM_R + 10 * k, (PALM_R + 10 * k) * 0.7, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ---------------- the child's cupped hands (73.8–85.8) --------------- */
  // baked once: 'moon' (lit from the moon above), 'lit' (and from within, by
  // the moon in the palms), 'dark' (fallen into night, a 胡粉 rim of moonlight)
  let cupSpr = null;
  const CUP_BOX = [-470, -125, 470, 740];         // arm-frame local box (sleeves run off the frame)
  function bakeCup(k) {
    if (cupSpr && Math.abs(cupSpr.k - k) / k < 0.1) return cupSpr;
    const corners = [[CUP_BOX[0], CUP_BOX[1]], [CUP_BOX[2], CUP_BOX[1]], [CUP_BOX[0], CUP_BOX[3]], [CUP_BOX[2], CUP_BOX[3]]].map(rot);
    const x0 = Math.min(...corners.map((p) => p[0])), x1 = Math.max(...corners.map((p) => p[0]));
    const y0 = Math.min(...corners.map((p) => p[1])), y1 = Math.max(...corners.map((p) => p[1]));
    const W = Math.ceil((x1 - x0) * k) + 4, H = Math.ceil((y1 - y0) * k) + 4;
    const make = () => { const cv = B.canvas(W, H); const c = cv.getContext('2d'); c.setTransform(k, 0, 0, k, 2 - x0 * k, 2 - y0 * k); return { cv, c }; };
    let geo = null;
    const hands = (c) => {
      c.save();
      c.rotate(ARM);
      geo = CAST.hands(c, 0, 0, CUP.s, { pose: 'cupped', water: 0, t: 0, age: 0, sleeve: false, palette: CHILD_PAL });
      c.restore();
    };
    // the same sleeves as the grab's: out of their 紅-lined mouths the forearms
    // splay back toward her shoulders (she sits to the lower left, so the left
    // arm comes from the lower left and the right one from straight below)
    const sleeves = (c, shadowOnly) => {
      for (const sd of [-1, 1]) {
        const w = rot([sd * 30 * CUP.s, 52 * CUP.s]);
        const sp = sd < 0 ? CUP.splay[0] : CUP.splay[1];
        const d = rot([sd * Math.sin(sp), Math.cos(sp)]);
        sode(c, w[0], w[1], d[0], d[1], { s: CUP.s, side: sd, w0: 52, w1: 116, len: 660, dark: [100 * CUP.s, 250 * CUP.s], shadowOnly });
      }
    };
    // moonlit
    const A = make();
    hands(A.c);
    sleeves(A.c);
    // lit from within: a flat 月白 tint on the palms only
    const L = make();
    hands(L.c);
    L.c.save();
    L.c.setTransform(1, 0, 0, 1, 0, 0);
    L.c.globalCompositeOperation = 'source-atop';
    L.c.fillStyle = U.rgba(C.geppaku, 0.13);
    L.c.fillRect(0, 0, W, H);
    L.c.restore();
    sleeves(L.c);
    // fallen into night: 藍墨 glaze and a 1.5 px 胡粉 rim along the upper edges
    const D = make();
    D.c.drawImage(A.cv, 0, 0, W, H, x0 - 2 / k, y0 - 2 / k, W / k, H / k);
    D.c.save();
    D.c.setTransform(1, 0, 0, 1, 0, 0);
    D.c.globalCompositeOperation = 'source-atop';
    D.c.fillStyle = U.rgba(U.mix(C.ai, C.sumi, 0.6), 0.88);
    D.c.fillRect(0, 0, W, H);
    D.c.restore();
    const rim = B.canvas(W, H), rc = rim.getContext('2d');
    rc.drawImage(A.cv, 0, 0);
    rc.globalCompositeOperation = 'source-in';
    rc.fillStyle = C.gofun;
    rc.fillRect(0, 0, W, H);
    rc.globalCompositeOperation = 'destination-out';
    rc.drawImage(A.cv, 0, Math.max(1, 1.5 * k));
    D.c.save();
    D.c.setTransform(1, 0, 0, 1, 0, 0);
    D.c.globalAlpha = 0.3;
    D.c.drawImage(rim, 0, 0);
    D.c.restore();
    sleeves(D.c, true);                        // the sleeves still sink into her shadow
    cupSpr = { k, x0: x0 - 2 / k, y0: y0 - 2 / k, W, H, moon: A.cv, lit: L.cv, dark: D.cv, geo };
    return cupSpr;
  }
  function cupState(T) {
    if (T < BT.lift || T > BT.cupOut + 1.3) return null;
    const inP = E.outCubic(U.seg(T, BT.lift, BT.tip));
    const outP = E.inOutSine(U.seg(T, BT.cupOut, BT.cupOut + 1.2));
    const back = (1 - inP) * 700 + outP * 720;
    const tremble = U.env(T, BT.tremble, BT.tremble + 0.4, BT.last - 0.2, BT.last + 0.6);
    const tw = tremble * 2 * (Math.sin(T * 56.5) * 0.7 + Math.sin(T * 37 + 1) * 0.3);
    const [bx, by] = rot([0, back]);
    const x = REFL.x + bx + 1.5 * U.wobble(T * 0.5, 19) + tw;
    const y = REFL.y + 6 * CUP.s + by + 1.6 * U.wobble(T * 0.6, 17) + tw * 0.4;
    const pc = rot([0, -6 * CUP.s]);
    return { x, y, poolX: x + pc[0], poolY: y + pc[1] };
  }
  const palmR = (T) => (T < BT.sit ? PALM_R : PALM_R * Math.pow(U.clamp(1 - (T - BT.sit) / 6.8), 0.7));
  function drawCup(ctx, T) {
    const st = cupState(T);
    if (!st) return null;
    const spr = bakeCup(ctx.getTransform().a);
    const r = palmR(T);
    const hold = T >= BT.sit ? r / PALM_R : 0;
    const dark = U.seg(T, BT.last - 0.6, BT.last + 1.2, E.inOutSine);
    const blit = (cv, a) => {
      if (a <= 0.003) return;
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.drawImage(cv, 0, 0, spr.W, spr.H, st.x + spr.x0, st.y + spr.y0, spr.W / spr.k, spr.H / spr.k);
      ctx.restore();
    };
    // the base, then the lit or dark state over it (same silhouette: a true cross-fade)
    blit(spr.moon, 1);
    const lit = U.smoothstep(0, 0.35, hold) * (1 - dark);
    blit(spr.lit, lit);
    blit(spr.dark, dark);
    // the water held in the palms: a flat pool filling the hollow, draining away
    const fill = T < BT.sit ? E.outSine(U.seg(T, BT.tip + 0.1, BT.sit)) : Math.pow(r / PALM_R, 0.8);
    const prx = T < BT.sit ? 36 * fill : U.lerp(20, 36, fill);
    const pa = 0.78 * (T < BT.sit ? 1 : U.smoothstep(0, 0.25, fill));
    if (prx > 0.8 && T > BT.tip && pa > 0.01) {
      ctx.save();
      ctx.translate(st.poolX, st.poolY);
      ctx.rotate(ARM);
      ctx.fillStyle = U.rgba(U.mix(C.ai, C.koiai, 0.4), pa);
      ctx.beginPath();
      ctx.ellipse(0, 1, prx, prx * 0.74, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = U.rgba(C.geppaku, 0.55 * pa);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 1, prx - 1, prx * 0.74 - 1, 0, Math.PI * 1.1, Math.PI * 1.75);
      ctx.stroke();
      ctx.restore();
    }
    // the moon in the palms: a coin of paper floating in the water, a little off its centre
    if (T >= BT.sit && r > 0.4) {
      const o = rot([-4, -3]);
      ctx.save();
      ctx.translate(st.poolX + o[0], st.poolY + o[1]);
      ctx.scale(1, 0.8);
      MOON.draw(ctx, 0, 0, r, T, { fringe: false });
      ctx.restore();
    }
    return { st, geo: spr.geo };
  }

  /**
   * The fifteen beads leaking from the cupped hands — one per plink of the
   * score (TSUKI.CUES.palmBeads: 75.4 + k·6.8/14, the last at 82.2 as the
   * hands go empty). Each lets go BEAD_FALL s before its plink so that its
   * ring lands ON it. Seen from above, only drops that leave the hands' outer
   * edges can be seen falling: they slip off the sides of the palms and ring
   * the water just beside them.
   */
  const DRIPS = [[-60, 6], [62, 0], [-57, -22], [60, 22], [-55, 28], [58, -16]];
  const BEAD_FALL = 0.32;
  const BEAD_TIMES = ((TSUKI.CUES && TSUKI.CUES.palmBeads) || Array.from({ length: 15 }, (_, k) => Math.round((75.4 + (k * 6.8) / 14) * 1000) / 1000))
    .map((t) => t - BEAD_FALL);
  function palmBeads(T) {
    const out = [];
    BEAD_TIMES.forEach((t0, i) => {
      const age = T - t0;
      if (age < -0.3 || age > 1.2) return;
      const d = DRIPS[[0, 3, 1, 4, 2, 5][i % 6]];
      const st = cupState(t0);
      if (!st) return;
      const q = rot([d[0] * CUP.s, d[1] * CUP.s]), out1 = rot([Math.sign(d[0]) * 9, 0]);
      const x = st.x + q[0], y = st.y + q[1];
      out.push({ i, t0, age, x, y, lx: x + out1[0], ly: y + out1[1] + 54, tl: t0 + BEAD_FALL, landed: age >= BEAD_FALL });
    });
    return out;
  }
  function drawBeads(ctx, T) {
    ctx.save();
    for (const b of palmBeads(T)) {
      if (b.age < 0) {
        // swelling at the edge of the palm (never before the water is poured in)
        const sw = Math.min(0.3, b.t0 - BT.tip);
        if (sw <= 0 || b.age < -sw) continue;
        const k = 1 + b.age / sw;
        ctx.fillStyle = U.rgba(C.gofun, 0.9 * k);
        ctx.beginPath();
        ctx.arc(b.x, b.y, 1 + 2.6 * k, 0, TAU);
        ctx.fill();
        continue;
      }
      if (b.age > BEAD_FALL) continue;
      const f = E.inQuad(b.age / BEAD_FALL);
      const x = U.lerp(b.x, b.lx, f), y = U.lerp(b.y, b.ly, f);
      ctx.strokeStyle = U.rgba(C.geppaku, 0.45 * f);
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(x, y - 4);
      ctx.stroke();
      ctx.fillStyle = U.rgba(C.gofun, 0.98);
      ctx.beginPath();
      ctx.ellipse(x, y, 3.8, 3.8 + 2.6 * f, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------------- the fox window (86.0–90.0) ------------------------- */
  /*
   * きつねの窓: the diamond made with both thumbs and index fingers, the
   * window a fox teaches in 安房直子's story — through it you see the ones you
   * have lost (the rhyme 六 pays off, sixty years later, with the same hands).
   * たけ holds it up to the child's eye from her side of the basin, so we see
   * it from the far side: CAST's anatomical window turned over (180°), each
   * hand cut at its wrist line and carried on by a forearm carved as one
   * contour with it (the wrist turning, the ulnar head's knob, the forearm
   * filling toward the elbow; CAST's tapered key line), rising in a V into
   * her 波兎 sleeves — slid back to mid-forearm, the mouth gaping dark round
   * the arm, the 袂 hanging below it and the sleeve turning up at the elbow
   * off the frame, clear of the haiku's pocket — and a 薄墨 bokashi up each
   * forearm into its sleeve's shadow, so the arms recede and the hands come
   * forward. The hands are the same old hands that held the ladle, lit by the
   * same moon but nearer the eye and more in shadow: moonlit skin glazed
   * toward 藍, a 墨 key line round the whole pose, 墨 creases and knuckles,
   * and a 2 px 胡粉 rim of moonlight on the upper-left (moon-side) edges.
   * As the window opens toward the eye (88.2–90) the hands pass out of the
   * light into a flat 墨藍 silhouette. The diamond hole is also the clip
   * through which Shot D is seen.
   */
  const WIN_INK = U.mix(C.sumi, C.ai, 0.2);
  // the ladle hand's skin (NIGHT .24) a little deeper in shadow — skin, not stone
  const WIN_SKIN = U.mix(U.mix(HANDS.skinOld, NIGHT, 0.38), NIGHT_PAL.skinOld, 0.45);
  const WIN_PAL = {
    skin: WIN_SKIN, skinOld: WIN_SKIN, spot: U.mix(WIN_SKIN, C.kitsune, 0.3), vein: U.mix(C.ai, WIN_SKIN, 0.45),
    nail: U.mix(C.gofun, NIGHT, 0.3), crease: C.sumi,
  };
  const WIN_OPTS = { pose: 'fox-window', age: 1, interlace: 1, sleeve: false, palette: WIN_PAL, ink: C.sumi, outline: 0.9 };
  // forearms (world orientation, scale-1 px from the diamond's centre). Each is
  // carved as ONE contour out of CAST's hand: the hand is printed only up to its
  // wrist line (CAST's forearm stub beyond it is cut away), and the forearm's two
  // edges leave the hand's contour there on its own tangents, turn through the
  // wrist and run up into the 波兎 sleeve — a slender wrist (≈ 0.75 × the
  // forearm), the ulnar head's small knob just above it, the forearm filling
  // out on its radial side toward the elbow. `out`/`inn`: CAST's contour points
  // (turned over) [before, at, after] where each edge leaves the hand; `outW`/
  // `innW`: [distance along the forearm from the wrist, half-width] anchors;
  // `cuff`: where the sleeve's mouth crosses the forearm (px from the wrist).
  const ARMS = [
    // right: the palm-view hand (radial side out, ulnar in); the forearm leans out to the upper right
    { sgn: 1, ang: 52, out: [[280, -10], [306, -29], [333, -47]], inn: [[228, -56], [244, -72], [267, -93]],
      outW: [[72, 40.5], [150, 45], [240, 51], [340, 55]], innW: [[36, 41], [74, 38.8], [150, 40.5], [240, 44], [340, 46]],
      cuff: 168, crease: [14, 11, 0.45], sleeve: { m: [6, 66], drop: 64, r: 30, up: [-0.22, -1], inn: [[150, -86], [215, -92]], out: [[108, -34], [184, -168]] }, rabbit: [120, 100], facing: 1 },
    // left: the back-view hand (ulnar side out, with the ulnar head's knob); steeper, clear of the haiku's pocket
    { sgn: -1, ang: 68, out: [[-282, -12], [-308, -30], [-333, -47]], inn: [[-225, -56], [-243, -73], [-267, -93]],
      outW: [[38, 42.5], [76, 39.6], [150, 41.5], [240, 45], [340, 47]], innW: [[72, 40], [150, 44.5], [240, 50], [340, 54]],
      cuff: 150, crease: [15, 16, 0.6], sleeve: { m: [4, 58], drop: 0, up: [0.24, -1], inn: [[150, -86], [200, -90]], out: [[-16, 24], [-46, 14], [-60, -80], [-58, -210]] }, rabbit: [110, 40], facing: -1 },
  ];
  const nrm = (v) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
  /** A smooth curve through anchors pts with unit tangents ts (cubic Hermite), sampled per segment. */
  function hermite(pts, ts, per) {
    const out = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]) / 3;
      const c1 = [a[0] + ts[i][0] * L, a[1] + ts[i][1] * L], c2 = [b[0] - ts[i + 1][0] * L, b[1] - ts[i + 1][1] * L];
      for (let j = 1; j <= per; j++) {
        const t = j / per, m = 1 - t, k0 = m * m * m, k1 = 3 * m * m * t, k2 = 3 * m * t * t, k3 = t * t * t;
        out.push([k0 * a[0] + k1 * c1[0] + k2 * c2[0] + k3 * b[0], k0 * a[1] + k1 * c1[1] + k2 * c2[1] + k3 * b[1]]);
      }
    }
    return out;
  }
  const polyTo = (p, pts, move) => { pts.forEach((q, i) => (i || !move ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]))); return p; };
  const armGeo = ARMS.map((a) => {
    const th = U.deg(a.ang), d = [a.sgn * Math.cos(th), -Math.sin(th)], n = [a.sgn * Math.sin(th), Math.cos(th)];
    const W = [(a.out[1][0] + a.inn[1][0]) / 2, (a.out[1][1] + a.inn[1][1]) / 2];
    const at = (s, w) => [W[0] + d[0] * s + n[0] * w, W[1] + d[1] * s + n[1] * w];
    const edge = (e, prof, side) => {
      const pts = [e[1]].concat(prof.map(([s, w]) => at(s, side * w)));
      const ts = pts.map((q, i) => (i === 0 ? nrm([e[2][0] - e[0][0], e[2][1] - e[0][1]])
        : i === pts.length - 1 ? d : nrm([pts[i + 1][0] - pts[i - 1][0], pts[i + 1][1] - pts[i - 1][1]])));
      return { pts: hermite(pts, ts, 12), t0: ts[0] };
    };
    const o = edge(a.out, a.outW, 1), i = edge(a.inn, a.innW, -1);
    const So = a.out[1], Si = a.inn[1];
    // the fill reaches 6 px back into the hand (inside its contour), so the
    // wrist line never shows as a seam
    const fill = new Path2D();
    polyTo(fill, [[Si[0] - i.t0[0] * 6 + n[0] * 1.5, Si[1] - i.t0[1] * 6 + n[1] * 1.5], [So[0] - o.t0[0] * 6 - n[0] * 1.5, So[1] - o.t0[1] * 6 - n[1] * 1.5]], true);
    polyTo(fill, o.pts);
    polyTo(fill, i.pts.slice().reverse());
    fill.closePath();
    // the key line: the two edges only, from 3 px inside the hand's own line
    const key = new Path2D();
    for (const [e, S] of [[o, So], [i, Si]]) polyTo(key, [[S[0] - e.t0[0] * 3, S[1] - e.t0[1] * 3]].concat(e.pts), true);
    // the hand is printed on its side of the wrist line only
    const v = nrm([Si[0] - So[0], Si[1] - So[1]]), E = 4000;
    let h = [-v[1], v[0]];
    if (h[0] * -So[0] + h[1] * -So[1] < 0) h = [-h[0], -h[1]];
    const clip = polyTo(new Path2D(), [[So[0] - v[0] * E, So[1] - v[1] * E], [So[0] + v[0] * E, So[1] + v[1] * E],
      [So[0] + (v[0] + h[0]) * E, So[1] + (v[1] + h[1]) * E], [So[0] + (h[0] - v[0]) * E, So[1] + (h[1] - v[1]) * E]], true);
    // the wrist's one crease, where the skin folds on the inside of the bend
    const k = i.pts.reduce((b, q) => (Math.abs((q[0] - W[0]) * d[0] + (q[1] - W[1]) * d[1] - a.crease[0]) < Math.abs((b[0] - W[0]) * d[0] + (b[1] - W[1]) * d[1] - a.crease[0]) ? q : b));
    const crease = B.qpts(k[0] - n[0] * 1.2, k[1] - n[1] * 1.2, k[0] + n[0] * a.crease[1] * 0.55 + d[0] * 2, k[1] + n[1] * a.crease[1] * 0.55 + d[1] * 2,
      k[0] + n[0] * a.crease[1] + d[0] * 6, k[1] + n[1] * a.crease[1] + d[1] * 6, 8);
    return { a, d, n, W, at, fill, key, clip, crease };
  });
  const armPath = (() => { const p = new Path2D(); for (const g of armGeo) p.addPath(g.fill); return p; })();
  const armKeyPath = (() => {
    // CAST's key recipe (cast.js handKey): 2.8 px, united with a copy moved
    // 1.6 px toward the stage's lower right; the flat fill that follows covers
    // the inner halves — ≈ 1.4 px on the lit side, ≈ 3 px on the shadow side
    const p = new Path2D(), off = new DOMMatrix([1, 0, 0, 1, 0.42 * 1.6, 0.91 * 1.6]);
    for (const g of armGeo) { p.addPath(g.key); p.addPath(g.key, off); }
    return p;
  })();
  /**
   * Each arm's 波兎 sleeve, slid back to mid-forearm by the raised arm: its
   * mouth (袖口) crosses the forearm — the near lip lies on the arm, the
   * opening gapes dark on either side of it — its top runs along the arm and
   * off the frame, and below the arm the 袂 hangs under its own weight: the
   * front edge falls from the mouth's outer corner, turns a round corner
   * (袖の丸み) and the bottom goes off the frame. (P(t, o): t along the forearm
   * from the cuff, o outward.)
   */
  const DOWN = [0, 1];
  /** Catmull-Rom through pts (continuing path p; its first point is joined with lineTo). */
  function splineTo(p, pts) {
    const n = pts.length, g = (i) => pts[Math.max(0, Math.min(n - 1, i))];
    p.lineTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n - 1; i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    return p;
  }
  const sleeveGeo = armGeo.map((g) => {
    const a = g.a, sl = a.sleeve, c0 = g.at(a.cuff, 0), d = g.d, n = g.n;
    const P = (t, o) => [c0[0] + d[0] * t + n[0] * o, c0[1] + d[1] * t + n[1] * o];
    const add = (q, v, k) => [q[0] + v[0] * k, q[1] + v[1] * k];
    const up = nrm(sl.up);
    // the sleeve's front edge is ONE edge of cloth: from the top of the sleeve
    // (A) it crosses over the arm as the mouth's near lip and, past the arm's
    // outer side (M), turns down and hangs as the 袂's front edge to its round
    // corner (F)
    const A = P(0, -78), M = P(sl.m[0], sl.m[1]);
    const F = add(M, DOWN, sl.drop);
    // the 袂's bottom, then round the elbow (px from F); with no drop (the steep
    // left arm) the cloth simply bellies round below the mouth, from M
    const outer = sl.out.map(([x, y]) => [F[0] + x, F[1] + y]);
    const inner = sl.inn.map(([t, o]) => P(t, o));
    const iTop = inner[inner.length - 1], oTop = outer[outer.length - 1];
    const path = new Path2D();
    path.moveTo(...A);
    // the top of the sleeve along the arm, then up the upper arm past the elbow, off the frame
    splineTo(path, [A].concat(inner, [add(iTop, up, 160), add(iTop, up, 900)]));
    path.lineTo(...add(oTop, up, 900));
    // down round the elbow to the 袂's bottom, its round front corner, the front edge up and over the arm
    let hM;
    if (sl.drop > 0) {
      splineTo(path, [add(oTop, up, 160)].concat(outer.slice().reverse(), [[(outer[0][0] + F[0]) / 2, (outer[0][1] + F[1]) / 2]]));
      path.arcTo(...F, ...M, sl.r);
      path.lineTo(...M);
      hM = add(M, DOWN, -16);
    } else {
      splineTo(path, [add(oTop, up, 160)].concat(outer.slice().reverse(), [M]));
      hM = add(M, nrm([M[0] - outer[0][0], M[1] - outer[0][1]]), 22);
    }
    const hA = add(A, n, 58);                                     // the lip's Bézier handles (A ↔ M)
    path.bezierCurveTo(...hM, ...hA, ...A);
    path.closePath();
    // the opening: between the near lip and the far lip (a little deeper into
    // the sleeve, meeting the front edge below the arm) — dark, round the arm
    const E = add(M, DOWN, Math.min(22, sl.drop * 0.4));
    const mouth = new Path2D();
    mouth.moveTo(...A);
    mouth.bezierCurveTo(...hA, ...hM, ...M);
    mouth.lineTo(...E);
    mouth.bezierCurveTo(...add(add(E, DOWN, -40), d, 24), ...add(add(A, n, 50), d, 22), ...A);
    mouth.closePath();
    // one carved fold from under the arm down into the hanging 袂
    const fold = sl.drop > 0 ? [P(36, 46), add(P(52, 62), DOWN, sl.drop * 0.6), [F[0] + (outer[0][0] - F[0]) * 0.4, F[1] + (outer[0][1] - F[1]) * 0.4 - 4]] : null;
    return { path, mouth, fold, rabbit: P(a.rabbit[0], a.rabbit[1]), facing: a.facing, ang: Math.atan2(d[1], d[0]), c0, g };
  });
  const sleevesPath = (() => { const p = new Path2D(); for (const g of sleeveGeo) p.addPath(g.path); return p; })();

  function foxState(T) {
    if (T < BT.window) return null;
    const inP = E.outCubic(U.seg(T, BT.window, BT.reveal));
    const open = E.inOutCubic(U.seg(T, BT.open, BT.end));
    const scale = U.lerp(1, FOX.zoom, open);
    const drift = [2 * U.wobble(T * 0.5, 41), 2 * U.wobble(T * 0.45, 43)];
    const x = FOX.x + (1 - inP) * 1100 + drift[0] * (1 - open);
    const y = FOX.y - (1 - inP) * 820 + drift[1] * (1 - open);
    return { x, y, scale, open };
  }

  /** The window's hole (a diamond 300 × 230 at scale 1) in ctx's transform. */
  const holeAt = (st) => {
    const r = CAST.foxWindowRect(st.x, st.y, st.scale, { interlace: 1 });
    const p = new Path2D();
    p.moveTo(r.corners[0][0], r.corners[0][1]);
    for (let i = 1; i < 4; i++) p.lineTo(r.corners[i][0], r.corners[i][1]);
    p.closePath();
    return p;
  };

  /** Shot D inside the window, revealed by a 60 px bokashi wipe at 30° (87.2–88.0). */
  function drawWindowInside(ctx, T, S, st) {
    const sw = E.inOutSine(U.seg(T, BT.reveal, BT.reveal + 0.8));
    if (sw <= 0.001) return;
    const hole = holeAt(st);
    if (sw >= 1) {
      ctx.save();
      ctx.clip(hole);
      TSUKI.SHOTS.D.frame(ctx, T, S);
      ctx.restore();
      return;
    }
    const hw = 150 * st.scale, hh = 115 * st.scale;
    const s2 = scratchFor(ctx, [st.x - hw - 4, st.y - hh - 4, st.x + hw + 4, st.y + hh + 4]);
    s2.save();
    s2.clip(hole);
    TSUKI.SHOTS.D.frame(s2, T, S);
    s2.restore();
    // the feathered edge of the wipe
    const ang = U.deg(30), cx = Math.cos(ang), cy = Math.sin(ang);
    const span = (hw + hh) * 1.1, edge = U.lerp(-span - 60, span + 60, sw);
    const ex = st.x + cx * edge, ey = st.y + cy * edge;
    const g = s2.createLinearGradient(ex - cx * 30, ey - cy * 30, ex + cx * 30, ey + cy * 30);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    s2.save();
    s2.globalCompositeOperation = 'destination-in';
    s2.fillStyle = g;
    s2.fillRect(st.x - hw - 10, st.y - hh - 10, hw * 2 + 20, hh * 2 + 20);
    s2.restore();
    blitScratch(ctx);
  }

  /** The window pose in ctx at (0,0), scale sc: the hands (CAST, turned over), the forearms, the sleeves. */
  function paintWindow(c, sc, T, mask, withSleeve) {
    c.save();
    c.scale(sc, sc);
    // the hands, each printed up to its wrist line
    c.save();
    for (const g of armGeo) c.clip(g.clip);
    c.rotate(Math.PI);
    CAST.hands(c, 0, 0, 1, mask ? { ...WIN_OPTS, silhouette: mask, t: T } : { ...WIN_OPTS, t: T });
    c.restore();
    // the forearms carry the hands' contour on: the same carved key line, then the flat skin
    if (!mask) {
      c.strokeStyle = U.rgba(C.sumi, WIN_OPTS.outline);
      c.lineWidth = 2.8;
      c.lineJoin = 'round';
      c.lineCap = 'round';
      c.stroke(armKeyPath);
    }
    c.fillStyle = mask || WIN_SKIN;
    c.fill(armPath);
    if (!mask) {
      // a 薄墨 bokashi up each forearm into the shadow of its sleeve, so the
      // arms recede into the night and the lit hands come forward
      for (const g of armGeo) {
        c.save();
        c.clip(g.fill);
        const p0 = g.at(30, 0), p1 = g.at(g.a.cuff + 10, 0);
        const gr = c.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
        gr.addColorStop(0, U.rgba(C.sumi, 0));
        gr.addColorStop(0.6, U.rgba(C.sumi, 0.12));
        gr.addColorStop(1, U.rgba(C.sumi, 0.3));
        c.fillStyle = gr;
        c.fill(g.fill);
        c.restore();
        B.taper(c, g.crease, 2.8, 0.2, U.rgba(C.sumi, g.a.crease[2]), 0.1);
      }
    }
    if (withSleeve) {
      // the sleeves: 藍 with a faint 青海波 woven in and one 胡粉 rabbit leaping on each (波兎)
      const ai = U.mix(C.ai, C.koiai, 0.45);
      for (const sg of sleeveGeo) {
        if (!mask) {
          // the same carved key line as the arms, round the whole sleeve
          const kp = new Path2D();
          kp.addPath(sg.path);
          kp.addPath(sg.path, new DOMMatrix([1, 0, 0, 1, 0.42 * 1.6, 0.91 * 1.6]));
          c.strokeStyle = U.rgba(C.sumi, WIN_OPTS.outline);
          c.lineWidth = 2.8;
          c.lineJoin = 'round';
          c.stroke(kp);
        }
        c.fillStyle = mask || ai;
        c.fill(sg.path);
        if (mask) continue;
        c.save();
        c.clip(sg.path);
        const pat = B.pattern(c, 'seigaiha', U.mix(ai, C.gofun, 0.13), ai, 26);
        pat.setTransform(new DOMMatrix().translate(sg.c0[0], sg.c0[1]).rotate((sg.ang * 180) / Math.PI + 90));
        c.save();
        c.globalAlpha *= 0.55;
        c.fillStyle = pat;
        c.fill(sg.path);
        c.restore();
        // the sleeve falls into shadow up toward the frame edge, as the forearms do
        const e0 = sg.g.at(sg.g.a.cuff + 20, 0), e1 = sg.g.at(sg.g.a.cuff + 330, 0);
        const gr = c.createLinearGradient(e0[0], e0[1], e1[0], e1[1]);
        gr.addColorStop(0, U.rgba(C.sumi, 0));
        gr.addColorStop(1, U.rgba(C.sumi, 0.24));
        c.fillStyle = gr;
        c.fill(sg.path);
        c.save();
        c.translate(sg.rabbit[0], sg.rabbit[1]);
        CAST.rabbit(c, 0, 0, 0.8, { pose: 'leap', phase: 0.45, facing: sg.facing, silhouette: U.mix(C.gofun, C.ai, 0.12), t: 0 });
        c.restore();
        // the dark of the opening, round the arm (the near lip lies on the arm itself)
        c.save();
        const outside = new Path2D();
        outside.rect(-3000, -3000, 6000, 6000);
        outside.addPath(armPath);
        c.clip(outside, 'evenodd');
        c.fillStyle = U.mix(C.sumi, C.koiai, 0.25);
        c.fill(sg.mouth);
        c.restore();
        // the fold
        if (sg.fold) {
        B.taper(c, B.qpts(...sg.fold[0], ...sg.fold[1], ...sg.fold[2], 14), 0.4, 2.2, U.rgba(C.sumi, 0.6), 0.2);
        }
        c.restore();
      }
    }
    c.restore();
  }

  // near scale 1 the pose is printed from baked sprites: the lit pose with its
  // key line and creases, the rim of moonlight, and the same pose in the near
  // dark (the opening)
  let winSpr = null;
  const WIN_BOX = [-460, -448, 628, 146];            // the pose (+ its key line) below the frame top at scale ≥ 1
  const WIN_KEY = 1.6;                               // the key line round the whole pose (px at scale 1)
  const WIN_RIM = 2;                                 // the 胡粉 rim (px at scale 1), on the upper-left edges
  function bakeWindow(k) {
    if (winSpr && Math.abs(winSpr.k - k) / k < 0.1) return winSpr;
    const q = k;                                          // device resolution at scale 1
    const W = Math.ceil((WIN_BOX[2] - WIN_BOX[0]) * q), H = Math.ceil((WIN_BOX[3] - WIN_BOX[1]) * q);
    const mk = () => { const cv = B.canvas(W, H), c = cv.getContext('2d'); c.setTransform(q, 0, 0, q, -WIN_BOX[0] * q, -WIN_BOX[1] * q); return { cv, c }; };
    // the key line: the whole pose's silhouette in 墨, blotted outward, under the lit pose
    const detail = mk();
    const sil = mk();
    paintWindow(sil.c, 1, 0, C.sumi, true);
    sil.c.setTransform(1, 0, 0, 1, 0, 0);
    sil.c.globalCompositeOperation = 'source-in';                 // the sleeve too
    sil.c.fillStyle = C.sumi;
    sil.c.fillRect(0, 0, W, H);
    detail.c.save();
    detail.c.setTransform(1, 0, 0, 1, 0, 0);
    detail.c.globalAlpha = 0.85;
    const o = WIN_KEY * q;
    for (let j = 0; j < 8; j++) {
      const a = (j / 8) * TAU;
      detail.c.drawImage(sil.cv, Math.cos(a) * o, Math.sin(a) * o);
    }
    detail.c.restore();
    paintWindow(detail.c, 1, 0, null, true);
    // the rim: the hands and forearms (not the sleeves) minus themselves moved
    // down-right — and never across a sleeve that lies over a forearm
    const rim = mk();
    paintWindow(rim.c, 1, 0, C.gofun, false);
    rim.c.setTransform(1, 0, 0, 1, 0, 0);
    rim.c.globalCompositeOperation = 'destination-out';
    rim.c.drawImage(rim.cv, Math.round(WIN_RIM * 0.75 * q), Math.round(WIN_RIM * q));
    rim.c.setTransform(q, 0, 0, q, -WIN_BOX[0] * q, -WIN_BOX[1] * q);
    rim.c.fill(sleevesPath);
    // the same pose in the near dark (the opening), for the cross-fade into the vectors
    const ink = mk();
    paintWindow(ink.c, 1, 0, WIN_INK, true);
    winSpr = { k, q, W, H, detail: detail.cv, rim: rim.cv, ink: ink.cv };
    return winSpr;
  }

  // the opening (88.2–90): coming toward the eye, the hands leave the
  // moonlight — the lines and the rim go, the skin sinks into 墨藍 — and past
  // ×SPR_MAX they are printed as vectors so they stay sharp at ×12
  const SPR_MAX = 1.6;
  function drawWindowHands(ctx, T, st) {
    if (st.scale >= FOX.zoom - 0.02) return;
    const dark = E.inOutSine(U.seg(st.scale, 1.0, 1.45));
    const keyA = 1 - U.smoothstep(1.45, SPR_MAX, st.scale);   // the outer key line goes last
    const spr = bakeWindow(ctx.getTransform().a);
    if (st.scale < SPR_MAX) {
      const w = (WIN_BOX[2] - WIN_BOX[0]) * st.scale, h = (WIN_BOX[3] - WIN_BOX[1]) * st.scale;
      const x0 = st.x + WIN_BOX[0] * st.scale, y0 = st.y + WIN_BOX[1] * st.scale;
      ctx.save();
      ctx.globalAlpha *= keyA;
      ctx.drawImage(spr.detail, x0, y0, w, h);
      ctx.restore();
      if (dark < 0.999) {
        ctx.save();
        ctx.globalAlpha *= 0.55 * (1 - dark);
        ctx.drawImage(spr.rim, x0, y0, w, h);
        ctx.restore();
      }
      if (dark > 0.001) {
        ctx.save();
        ctx.globalAlpha *= dark;
        ctx.drawImage(spr.ink, x0, y0, w, h);
        ctx.restore();
      }
      return;
    }
    ctx.save();
    ctx.translate(st.x, st.y);
    paintWindow(ctx, st.scale, T, WIN_INK, true);
    ctx.restore();
  }

  function drawFoxWindow(ctx, T, S) {
    const st = foxState(T);
    if (!st) return;
    drawWindowInside(ctx, T, S, st);
    drawWindowHands(ctx, T, st);
  }

  /* ---------------- the Shot C frame ------------------------------------ */
  function drawC(ctx, T) {
    const SC = TSUKI.SHOTS.C;
    const rings = allRings(T);
    const sc = scatter(T);
    const shattered = T >= BT.shatter && T < BT.whole;
    const wob = Math.max(U.env(T, BT.shatter - 0.1, BT.shatter + 0.2, BT.calm, BT.whole), U.env(T, BT.dip - 0.05, BT.dip + 0.2, BT.lift + 0.4, BT.lift + 1.4) * 0.6);
    SC.print(ctx, T, {
      water: (c) => {
        PRINT.with(c, 'P7', T, (c2) => {
          // while the moon is in the ladle and the palms, the water gives it up;
          // when the empty hands withdraw it is there again, untouched
          const held = U.smoothstep(73.75, 74.5, T) * (1 - U.smoothstep(84.9, 86.0, T));
          // …until たけ's window comes over the basin: her hands and sleeve shade
          // the water and the moon leaves it for the diamond (one moon per frame)
          const shade = 1 - U.smoothstep(86.5, BT.reveal, T);
          // its glow and glint were broken with it: they come back only after
          // the disc is whole (71.6 → 72.3), not with it
          const glow = T >= BT.shatter && T < 72.3 ? E.outSine(U.seg(T, 71.6, 72.3)) : 1;
          if (!shattered) SC.reflection(c2, T, { wobble: wob, alpha: (1 - 0.92 * held) * shade, glow });
          else {
            // an 'over' dissolve, never a grey disc between two states: as the
            // last gaps close (71.0–71.3) the whole disc comes up UNDER the
            // shards and heals every seam; they dock (71.4) and melt into it
            const under = U.smoothstep(71.0, 71.3, T);
            if (under > 0) SC.reflection(c2, T, { alpha: under, wobble: wob, glow });
            drawShards(c2, T, 1 - U.smoothstep(BT.whole - 0.45, BT.whole, T), wob);
          }
        });
        PRINT.with(c, 'P7', T, (c2) => SC.rings(c2, T, rings, { refl: sc < 0.05 ? SC.G.refl : null }));
        PRINT.with(c, 'P2', T, (c2) => SC.petals(c2, T, rings));
        PRINT.with(c, 'P8', T, (c2) => SC.dew(c2, T));
      },
      spout: (c) => {
        PRINT.with(c, 'P7', T, (c2) => SC.spout(c2, T));
        PRINT.with(c, 'K', T, (c2) => {
          drawGrab(c2, T);
          const cup = drawCup(c2, T);
          if (cup) drawBeads(c2, T);
          const lg = drawLadle(c2, T);
          if (cup) drawPour(c2, T, lg, { x: cup.st.poolX, y: cup.st.poolY });
        });
      },
    });
  }

  /* ---------------- the scene ------------------------------------------ */
  TSUKI.scene('mizu-no-tsuki', {
    init(S) {
      ladleOffset();
      const w = Math.round(1920 * S.k), h = Math.round(1080 * S.k);
      stageScratch(w, h);                                  // not mid-film
      TSUKI.SHOTS.C.warm(70, w, h);
      if (TSUKI.SHOTS.D.warm) TSUKI.SHOTS.D.warm(w, h);
      bakeCup(S.k);
      bakeWindow(S.k);
    },
    draw(ctx, t, S) {
      ctx.save();
      // every cache here is carved at (or near) the stage resolution: plain bilinear blits
      ctx.imageSmoothingQuality = 'low';
      drawScene(ctx, S.seg.start + t, S);
      ctx.restore();
    },
  });
  function drawScene(ctx, T, S) {
    if (T >= BT.end - 1e-4 && TSUKI.SHOTS.D && TSUKI.SHOTS.D.frame) { TSUKI.SHOTS.D.frame(ctx, T, S); return; }
    // settle out of the match-cut: the basin eases its y-scale 1.3 → 1.0
    const squash = 1 + 0.3 * (1 - E.inOutSine(U.seg(T, 66.0, 67.2)));
    if (squash > 1.0001) {
      // print the frame once at identity (into the scratch), then stretch the finished image
      const cv = ctx.canvas;
      const f = stageScratch(cv.width, cv.height);
      const M = ctx.getTransform();
      f.clearRect(0, 0, cv.width, cv.height);
      f.save();
      f.setTransform(M);
      drawC(f, T);
      f.restore();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingQuality = 'low';
      const cy = 620 * M.d + M.f;
      ctx.translate(0, cy);
      ctx.scale(1, squash);
      ctx.translate(0, -cy);
      ctx.drawImage(scratch, 0, 0);
      ctx.restore();
    } else drawC(ctx, T);
    PRINT.with(ctx, 'K', T, (c2) => drawFoxWindow(c2, T, S));
  }
})(window.TSUKI);
