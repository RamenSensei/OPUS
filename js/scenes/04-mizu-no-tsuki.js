/* ==========================================================================
   04-mizu-no-tsuki.js — 三 水の月 (66–90), Shot C.
   The child's hands shatter the moon in the tsukubai into mica; it regathers,
   untouched. たけ's ladle lifts a tiny moon into the child's cupped hands and
   it leaks away bead by bead, until her hands are dark and empty. Then たけ's
   old hands glide in already joined in the fox window (狐の窓); the diamond
   fills with the moon's true face (Shot D) and opens until the sky is all
   there is (88.2–90.0) — 四 begins on the identical frame.
   All times below are GLOBAL film time T (66–90).

   The child sits at the lower left: her arms come in on one diagonal, and
   たけ's ladle answers it from the top right — the handle crosses the frame.
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
  const ARM = 0.46;                              // the child's arms: a diagonal from the lower left (rad)
  const GRAB = { x: 1000, y: 628, s: 1.25 };
  const CUP = { s: 1.15 };
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

  /* ---------------- shards: the reflection crazed into 40 pieces ------- */
  /*
   * Four rings of 3 / 8 / 12 / 17 pieces. The ring boundaries wander and the
   * radial cracks lean, but every edge is shared by its two neighbours, so at
   * rest the pieces tile the disc exactly (unit-disc coordinates).
   */
  const SHARDS = (() => {
    const out = [];
    const bands = [[0, 0.3, 3], [0.3, 0.56, 8], [0.56, 0.8, 12], [0.8, 1.0, 17]];
    const bound = (R, th) => (R <= 0 || R >= 1 ? R : R + 0.045 * (U.noise1(th * 2.2 + R * 17, 83) * 2 - 1));
    const r = U.rng(8081);
    for (const [r0, r1, n] of bands) {
      const off = r() * TAU;
      const cracks = [];
      for (let i = 0; i < n; i++) cracks.push({ a: off + (i / n) * TAU + U.lerp(-0.25, 0.25, r()) * (TAU / n) * 0.5, lean: U.lerp(-0.35, 0.35, r()) * (TAU / n) });
      for (let i = 0; i < n; i++) {
        const c0 = cracks[i], c1 = cracks[(i + 1) % n];
        let a0 = c0.a, a1 = c1.a;
        if (a1 <= a0) a1 += TAU;
        const pts = [];
        const N = 6;
        // inner edge (a0 → a1), outer edge back (a1 → a0), the cracks leaning between
        const aIn0 = a0, aIn1 = a1, aOut0 = a0 + c0.lean, aOut1 = a1 + c1.lean;
        for (let q = 0; q <= N; q++) { const t = aIn0 + (aIn1 - aIn0) * q / N; const rr = bound(r0, t); pts.push([Math.cos(t) * rr, Math.sin(t) * rr]); }
        for (let q = N; q >= 0; q--) { const t = aOut0 + (aOut1 - aOut0) * q / N; const rr = bound(r1, t); pts.push([Math.cos(t) * rr, Math.sin(t) * rr]); }
        const cx = pts.reduce((sum, p) => sum + p[0], 0) / pts.length, cy = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
        const am = Math.atan2(cy, cx);
        out.push({
          pts, cx, cy, am,
          dist: U.lerp(60, 180, r()) * (0.55 + (r0 + r1) * 0.3),
          dir: am + U.lerp(-0.3, 0.3, r()),
          stretch: U.lerp(1.2, 1.8, r()),
          kira: r(),
        });
      }
    }
    return out;
  })();

  /** 0 = whole … 1 = fully scattered; the regather lands exactly at 71.8. */
  function scatter(T) {
    if (T < BT.shatter || T >= BT.whole) return 0;
    const out = E.outCubic(U.clamp((T - BT.shatter) / 1.4));
    if (T < BT.calm) return out;
    const e0 = Math.exp(-3.6);
    return out * Math.max(0, (Math.exp(-(T - BT.calm) / 0.5) - e0) / (1 - e0));
  }

  /* the reflected disc, drawn once per frame into a small buffer, then cut into shards */
  let discCv = null;
  function discBuffer(ctx, T) {
    const R = TSUKI.SHOTS.C.G.refl;
    const k = ctx.getTransform().a;
    const n = Math.ceil((R.rx * 2 + 8) * k);
    if (!discCv || discCv.width !== n) discCv = B.canvas(n, n);
    const d = discCv.getContext('2d');
    d.setTransform(1, 0, 0, 1, 0, 0);
    d.clearRect(0, 0, n, n);
    d.setTransform(k, 0, 0, k, n / 2, n / 2);
    MOON.draw(d, 0, 0, R.rx, T, { fringe: false, halo: 0 });
    return { cv: discCv, half: n / 2 / k };
  }
  function drawShards(ctx, T, alpha) {
    const sc = scatter(T);
    if (alpha <= 0.003) return;
    const R = TSUKI.SHOTS.C.G.refl;
    const persp = R.ry / R.rx;
    const disc = discBuffer(ctx, T);
    ctx.save();
    TSUKI.SHOTS.C.waterClip(ctx);
    ctx.clip();
    ctx.translate(REFL.x, REFL.y);
    ctx.scale(1, persp);
    ctx.globalAlpha *= alpha;
    for (const s of SHARDS) {
      // each shard flies straight out along its own ray, thinning across its
      // ring and stretching along it as it goes (a flake of mica)
      const dx = Math.cos(s.dir) * s.dist * sc, dy = Math.sin(s.dir) * s.dist * sc;
      const ur = [Math.cos(s.am), Math.sin(s.am)], ut = [-ur[1], ur[0]];
      const kr = 1 - 0.5 * sc, kt = 1 + (s.stretch - 1) * sc;
      const cx = s.cx * R.rx, cy = s.cy * R.rx;
      const p = new Path2D();
      s.pts.forEach((q, j) => {
        const vx = q[0] * R.rx - cx, vy = q[1] * R.rx - cy;
        const a = (vx * ur[0] + vy * ur[1]) * kr, b = (vx * ut[0] + vy * ut[1]) * kt;
        const X = cx + ur[0] * a + ut[0] * b + dx, Y = cy + ur[1] * a + ut[1] * b + dy;
        if (j) p.lineTo(X, Y); else p.moveTo(X, Y);
      });
      p.closePath();
      ctx.save();
      ctx.clip(p);
      ctx.drawImage(disc.cv, dx - disc.half, dy - disc.half, disc.half * 2, disc.half * 2);
      ctx.restore();
      // mica: the shards glitter as they fly
      const k = sc * (0.3 + 0.7 * Math.pow(Math.max(0, Math.sin(T * 11 + s.kira * 40)), 3));
      if (k > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255,250,236,${0.4 * k})`;
        ctx.fill(p);
        ctx.restore();
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

  /* ---------------- scratch (the grab's underwater tint, the window rim) */
  let scratch = null;
  let sbox = null;   // device-pixel rect of the current scratch pass (immediate, not carried between frames)
  function scratchFor(ctx, box) {
    const cv = ctx.canvas;
    if (!scratch || scratch.width !== cv.width || scratch.height !== cv.height) scratch = B.canvas(cv.width, cv.height);
    const s = scratch.getContext('2d');
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
    s.setTransform(1, 0, 0, 1, 0, 0);
    s.globalCompositeOperation = 'source-over';
    s.globalAlpha = 1;
    s.restore(); s.restore();                                  // drop any clip left from the last pass
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
  const kasuriTiles = new Map();
  function kasuri(a) {
    const key = a.toFixed(2);
    if (kasuriTiles.has(key)) return kasuriTiles.get(key);
    const S = 64;
    const t = B.canvas(S, S);
    const c = t.getContext('2d');
    c.fillStyle = U.mix(C.kon, NIGHT, a);
    c.fillRect(0, 0, S, S);
    const r = U.rng(1212);
    const fg = U.mix(C.gofun, NIGHT, a);
    // 十字絣: small crosses with feathered (bled) edges, plus a few dashes
    const cross = (x, y) => {
      for (const [ox, oy] of [[0, 0], [S, 0], [-S, 0], [0, S], [0, -S]]) {
        for (let k = 0; k < 3; k++) {
          c.fillStyle = U.rgba(fg, [0.2, 0.36, 0.7][k]);
          const w = [9, 7.5, 6][k], h = [2.6, 2.1, 1.6][k];
          c.fillRect(x + ox - w / 2 + U.lerp(-0.6, 0.6, r()), y + oy - h / 2, w, h);
          c.fillRect(x + ox - h / 2, y + oy - w / 2 + U.lerp(-0.6, 0.6, r()), h, w);
        }
      }
    };
    cross(16, 16); cross(48, 48);
    c.fillStyle = U.rgba(fg, 0.4);
    c.fillRect(40, 14, 8, 1.6); c.fillRect(8, 44, 7, 1.6);
    kasuriTiles.set(key, t);
    return t;
  }
  /**
   * A kimono sleeve from the wrist (wx, wy) back toward the body along (dx, dy),
   * widening from w0 to w1 over len px; a soft fold, the shadowed underside and
   * the cuff hem over the wrist.
   */
  function sleeve(c, wx, wy, dx, dy, w0, w1, len, k, night = 0.24) {
    const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const p = (a, b) => [wx + ux * a + nx * b, wy + uy * a + ny * b];
    const path = new Path2D();
    const a0 = p(0, -w0 / 2), a1 = p(0, w0 / 2);
    path.moveTo(...a0);
    path.bezierCurveTo(...p(len * 0.25, -w0 * 0.6), ...p(len * 0.55, -w1 * 0.48), ...p(len, -w1 / 2));
    path.lineTo(...p(len, w1 / 2));
    path.bezierCurveTo(...p(len * 0.55, w1 * 0.5), ...p(len * 0.25, w0 * 0.62), ...a1);
    path.quadraticCurveTo(...p(-7, 0), ...a0);
    path.closePath();
    const pat = c.createPattern(kasuri(night), 'repeat');
    const ang = Math.atan2(uy, ux) - Math.PI / 2;
    pat.setTransform(new DOMMatrix().translate(wx, wy).rotate((ang * 180) / Math.PI).scale(k * 0.55));
    c.save();
    c.fillStyle = pat;
    c.fill(path);
    c.clip(path);
    // the shadowed underside (the far side from the moon)
    const g = c.createLinearGradient(...p(0, -w1 / 2), ...p(0, w1 / 2));
    g.addColorStop(0, U.rgba(C.sumi, 0));
    g.addColorStop(0.62, U.rgba(C.sumi, 0));
    g.addColorStop(1, U.rgba(C.sumi, 0.4));
    c.fillStyle = g;
    c.fill(path);
    // a single fold along the sleeve
    B.taper(c, [p(len * 0.22, w0 * 0.12), p(len * 0.5, w1 * 0.1), p(len, w1 * 0.06)], 2.2 * k, 0.6 * k, U.rgba(C.sumi, 0.45), 0.2);
    c.restore();
    c.save();
    c.strokeStyle = U.rgba(C.sumi, 0.85);
    c.lineWidth = 2.2 * k;
    c.lineJoin = 'round';
    c.stroke(path);
    // the cuff hem
    c.strokeStyle = U.rgba(U.mix(C.kon, C.gofun, 0.35), 0.55);
    c.lineWidth = 1.4 * k;
    c.beginPath();
    c.moveTo(...p(5, -w0 / 2 + 2));
    c.quadraticCurveTo(...p(-2, 0), ...p(5, w0 / 2 - 2));
    c.stroke();
    c.restore();
  }

  /* ---------------- the child's grabbing hands (67.4–70.3) ------------- */
  function drawGrab(ctx, T) {
    if (T < BT.plunge || T > BT.calm + 0.3) return;
    const inP = E.outCubic(U.seg(T, BT.plunge, BT.shatter));
    const outP = E.inOutSine(U.seg(T, BT.up + 0.1, BT.calm + 0.2));
    const lift = E.outSine(U.seg(T, BT.up, BT.up + 0.35));             // coming up: nearer the eye
    const back = (1 - inP) * 620 + outP * 680 - lift * 14;            // along the arm, toward the body
    const [bx, by] = rot([0, back]);
    const x = GRAB.x + bx, y = GRAB.y + by;
    const s = GRAB.s * (1 + 0.05 * lift - 0.04 * (T > BT.shatter && T < BT.up ? 1 : 0) * E.outSine(U.seg(T, BT.shatter, BT.shatter + 0.2)));
    const close = T < BT.shatter ? 0 : T < BT.up ? E.outCubic(U.seg(T, BT.shatter, BT.shatter + 0.22)) : U.lerp(1, 0.25, E.inOutSine(U.seg(T, BT.up, BT.up + 0.5)));
    const under = U.env(T, BT.shatter - 0.08, BT.shatter + 0.08, BT.up - 0.05, BT.up + 0.2);
    const drawHands = (c, pal) => {
      c.save();
      c.translate(x, y);
      c.rotate(ARM);
      const g = CAST.hands(c, 0, 0, s, { pose: 'grab', close, t: T, age: 0, sleeve: false, palette: pal });
      c.restore();
      return g;
    };
    let geo;
    if (under > 0.01) {
      // the fingers under water: the part beyond the waterline printed in 藍
      const s2 = scratchFor(ctx, [x - 420, y - 360, x + 420, y + 260]);
      geo = drawHands(s2, NIGHT_PAL);
      s2.save();
      s2.globalCompositeOperation = 'source-atop';
      TSUKI.SHOTS.C.waterClip(s2);
      s2.clip();
      s2.translate(x, y);
      s2.rotate(ARM);
      s2.beginPath();
      s2.rect(-600, -600, 1200, 600 - 22 * s);
      s2.clip();
      s2.fillStyle = U.rgba(U.mix(C.ai, C.koiai, 0.5), 0.6 * under);
      s2.fillRect(-600, -600, 1200, 1200);
      s2.restore();
      blitScratch(ctx);
    } else geo = drawHands(ctx, NIGHT_PAL);
    for (const sd of [-1, 1]) {
      const th = sd * 0.16;
      const w = rot([(sd * 66 - 30 * Math.sin(th) - 5 * sd) * s, (40 + 30 * Math.cos(th) - 8) * s]);
      const d = rot([-sd * 0.06, 1]);
      sleeve(ctx, x + w[0], y + w[1], d[0], d[1], 44 * s, 104 * s, 620, s / 1.75);
    }
    // bright beads falling from the fingertips as they come up empty
    if (geo && T > BT.up && T < BT.up + 1.2) {
      ctx.save();
      geo.tips.forEach((p0, i) => {
        const t0 = BT.up + 0.05 + (i % 5) * 0.12 + U.hash(i + 71) * 0.1;
        const age = T - t0;
        if (age < 0 || age > 0.5) return;
        const q = rot(p0);
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
  const CUP_BOX = [-218, -125, 218, 640];         // arm-frame local box (sleeves run off the frame)
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
    const sleeves = (c) => {
      for (const sd of [-1, 1]) {
        const w = rot([sd * 30 * CUP.s, 56 * CUP.s]);
        const d = rot([sd * 0.22, 1]);
        sleeve(c, w[0], w[1], d[0], d[1], 42 * CUP.s, 104 * CUP.s, 560, CUP.s / 1.75);
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
   * Beads leaking from the cupped hands every 0.5 s (75.85–81.85, then the
   * last at 82.2). Seen from above, only drops that leave the hands' outer
   * edges can be seen falling: they slip off the sides of the palms and ring
   * the water just beside them.
   */
  const DRIPS = [[-60, 6], [62, 0], [-57, -22], [60, 22], [-55, 28], [58, -16]];
  const BEAD_TIMES = (() => {
    const out = [];
    for (let t = BT.sit + 0.45; t < BT.last - 0.2; t += 0.5) out.push(t);
    out.push(BT.last);                                   // the last drop, 82.2
    return out;
  })();
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
      out.push({ i, t0, age, x, y, lx: x + out1[0], ly: y + out1[1] + 54, tl: t0 + 0.32, landed: age > 0.32 });
    });
    return out;
  }
  function drawBeads(ctx, T) {
    ctx.save();
    for (const b of palmBeads(T)) {
      if (b.age < 0) {
        // swelling at the edge of the palm
        const k = 1 + b.age / 0.3;
        ctx.fillStyle = U.rgba(C.gofun, 0.9 * k);
        ctx.beginPath();
        ctx.arc(b.x, b.y, 1 + 2.6 * k, 0, TAU);
        ctx.fill();
        continue;
      }
      if (b.age > 0.32) continue;
      const f = E.inQuad(b.age / 0.32);
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
   * it from the far side: CAST's anatomical window turned over (180°), her
   * forearms leaving the top of the frame, one 波兎 sleeve edge at the top
   * right. The hands are a near-foreground 墨 silhouette (Hiroshige's huge
   * foreground crop) with their creases cut out of the block in pale lines,
   * and a 1.5 px 胡粉 rim of moonlight on the upper edges. The diamond hole
   * is also the clip through which Shot D is seen.
   */
  const WIN_INK = U.mix(C.sumi, C.ai, 0.2);
  const WIN_PAL = { skin: WIN_INK, skinOld: WIN_INK, spot: WIN_INK, vein: WIN_INK, nail: U.mix(WIN_INK, C.ginnezu, 0.12), crease: U.mix(C.ginnezu, WIN_INK, 0.25) };
  const WIN_OPTS = { pose: 'fox-window', age: 1, interlace: 1, sleeve: false, palette: WIN_PAL, ink: WIN_INK, outline: 1 };
  // forearms (world orientation, scale-1 px from the diamond's centre): wrist → off the top
  const ARMS = [
    { pts: [[284, -60], [336, -150], [398, -258], [470, -382], [556, -522], [660, -690]], ws: [84, 88, 94, 102, 110, 118], cuff: 0.52 },
    { pts: [[-284, -60], [-282, -160], [-270, -278], [-248, -408], [-218, -550], [-180, -710]], ws: [84, 88, 94, 102, 110, 118], cuff: 0.9 },
  ];
  const lerpPts = (pts, u) => {
    const f = u * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), t = f - i;
    return [U.lerp(pts[i][0], pts[i + 1][0], t), U.lerp(pts[i][1], pts[i + 1][1], t)];
  };
  const armPath = (() => {
    const p = new Path2D();
    for (const a of ARMS) MOON.maria.ribbon(p, a.pts, a.ws, false);
    return p;
  })();
  /** The sleeve of the right arm from its cuff to beyond the frame (藍), and its cuff line. */
  const sleeveGeo = (() => {
    const a = ARMS[0];
    const c0 = lerpPts(a.pts, a.cuff), c1 = lerpPts(a.pts, a.cuff + 0.06);
    const dx = c1[0] - c0[0], dy = c1[1] - c0[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const P = (t, o) => [c0[0] + ux * t + nx * o, c0[1] + uy * t + ny * o];
    const p = new Path2D();
    const q = [P(4, -84), P(-12, -30), P(-12, 30), P(4, 88)];
    p.moveTo(...q[0]);
    p.bezierCurveTo(...q[1], ...q[2], ...q[3]);
    p.lineTo(...P(700, 150));
    p.lineTo(...P(700, -150));
    p.closePath();
    return { path: p, cuff: [P(6, -80), P(-8, 0), P(6, 84)], rabbit: P(46, 8), ang: Math.atan2(uy, ux) };
  })();

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

  /** The window pose in ctx at (0,0), scale sc: the hands (CAST, turned over), the forearms, the sleeve. */
  function paintWindow(c, sc, T, mask, withSleeve) {
    c.save();
    c.scale(sc, sc);
    c.save();
    c.rotate(Math.PI);
    CAST.hands(c, 0, 0, 1, mask ? { ...WIN_OPTS, silhouette: mask, t: T } : { ...WIN_OPTS, t: T });
    c.restore();
    c.fillStyle = mask || WIN_INK;
    c.fill(armPath);
    if (withSleeve) {
      // the sleeve's edge: 藍, with one 胡粉 rabbit leaping on it
      c.fillStyle = U.mix(C.ai, C.koiai, 0.45);
      c.fill(sleeveGeo.path);
      c.save();
      c.clip(sleeveGeo.path);
      c.save();
      c.translate(sleeveGeo.rabbit[0], sleeveGeo.rabbit[1]);
      c.rotate(sleeveGeo.ang + Math.PI / 2);
      CAST.rabbit(c, 0, 0, 0.8, { pose: 'leap', phase: 0.45, facing: 1, silhouette: U.mix(C.gofun, C.ai, 0.12), t: 0 });
      c.restore();
      const q = sleeveGeo.cuff;
      c.strokeStyle = U.rgba(C.gofun, 0.3);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(...q[0]);
      c.quadraticCurveTo(...q[1], ...q[2]);
      c.stroke();
      c.restore();
    }
    c.restore();
  }

  // near scale 1 the pose is printed from baked sprites: the plain silhouette
  // (with its sleeve), the creases cut out of it, and the rim of moonlight
  let winSpr = null;
  const WIN_BOX = [-400, -448, 604, 300];            // what can be on screen at scale ≤ 1.15
  function bakeWindow(k) {
    if (winSpr && Math.abs(winSpr.k - k) / k < 0.1) return winSpr;
    const q = k;                                          // device resolution at scale 1
    const W = Math.ceil((WIN_BOX[2] - WIN_BOX[0]) * q), H = Math.ceil((WIN_BOX[3] - WIN_BOX[1]) * q);
    const mk = () => { const cv = B.canvas(W, H), c = cv.getContext('2d'); c.setTransform(q, 0, 0, q, -WIN_BOX[0] * q, -WIN_BOX[1] * q); return { cv, c }; };
    const plain = mk();
    paintWindow(plain.c, 1, 0, WIN_INK, true);
    const detail = mk();
    paintWindow(detail.c, 1, 0, null, true);
    const rim = mk();
    paintWindow(rim.c, 1, 0, C.gofun, false);
    rim.c.setTransform(1, 0, 0, 1, 0, 0);
    rim.c.globalCompositeOperation = 'destination-out';
    rim.c.drawImage(rim.cv, 0, Math.round(1.6 * q));
    winSpr = { k, q, W, H, plain: plain.cv, detail: detail.cv, rim: rim.cv };
    return winSpr;
  }

  function drawWindowHands(ctx, T, st) {
    if (st.scale >= FOX.zoom - 0.02) return;
    const lineA = 1 - U.smoothstep(1.02, 1.15, st.scale);
    const spr = bakeWindow(ctx.getTransform().a);
    if (st.scale < 1.15) {
      const w = (WIN_BOX[2] - WIN_BOX[0]) * st.scale, h = (WIN_BOX[3] - WIN_BOX[1]) * st.scale;
      const x0 = st.x + WIN_BOX[0] * st.scale, y0 = st.y + WIN_BOX[1] * st.scale;
      if (lineA < 0.999) ctx.drawImage(spr.plain, x0, y0, w, h);
      if (lineA > 0.01) {
        ctx.save();
        ctx.globalAlpha *= lineA;
        ctx.drawImage(spr.detail, x0, y0, w, h);
        ctx.globalAlpha *= 0.35;
        ctx.drawImage(spr.rim, x0, y0, w, h);
        ctx.restore();
      }
      return;
    }
    // opening: the plain silhouette, drawn as vectors so it stays sharp at ×12
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
          if (!shattered) SC.reflection(c2, T, { wobble: wob, alpha: 1 - 0.92 * held });
          else {
            // the shards regather; the whole disc returns over 71.55–71.8
            const whole = U.smoothstep(BT.whole - 0.25, BT.whole, T);
            drawShards(c2, T, 1 - whole);
            if (whole > 0) SC.reflection(c2, T, { alpha: whole, wobble: wob });
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
  let frameCv = null;
  TSUKI.scene('mizu-no-tsuki', {
    init(S) {
      ladleOffset();
      const w = Math.round(1920 * S.k), h = Math.round(1080 * S.k);
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
      // print the frame once at identity, then stretch the finished image
      const cv = ctx.canvas;
      if (!frameCv || frameCv.width !== cv.width || frameCv.height !== cv.height) frameCv = B.canvas(cv.width, cv.height);
      const f = frameCv.getContext('2d');
      const M = ctx.getTransform();
      f.setTransform(1, 0, 0, 1, 0, 0);
      f.clearRect(0, 0, cv.width, cv.height);
      f.setTransform(M);
      drawC(f, T);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingQuality = 'low';
      const cy = 620 * M.d + M.f;
      ctx.translate(0, cy);
      ctx.scale(1, squash);
      ctx.translate(0, -cy);
      ctx.drawImage(frameCv, 0, 0);
      ctx.restore();
    } else drawC(ctx, T);
    PRINT.with(ctx, 'K', T, (c2) => drawFoxWindow(c2, T, S));
  }
})(window.TSUKI);
