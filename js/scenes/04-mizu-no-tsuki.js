/* ==========================================================================
   04-mizu-no-tsuki.js — 三 水の月 (66–90), Shot C.
   The child's hands shatter the moon in the tsukubai into mica; it regathers,
   untouched. たけ's ladle lifts a tiny moon into the child's cupped hands and
   it leaks away bead by bead. Then たけ's old hands make the fox window; the
   diamond fills with the moon's true face (Shot D) and opens until the sky is
   all there is (88.2–90.0) — 四 begins on the identical frame.
   All times below are GLOBAL film time T (66–90).
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const U = TSUKI.U, B = TSUKI.B, C = TSUKI.C;
  const PRINT = TSUKI.PRINT, CAST = TSUKI.CAST;
  const TAU = Math.PI * 2;
  const E = U.ease;

  /* ---------------- beats (absolute film time) ------------------------- */
  const BT = {
    plunge: 67.4, shatter: 67.9, up: 68.9, calm: 70.0, whole: 71.8,
    ladleIn: 72.0, dip: 73.0, lift: 73.8, tip: 75.0, sit: 75.4, tremble: 80.6, last: 82.2,
    ladleOut: 83.2, cupOut: 84.4, window: 86.0, reveal: 87.2, open: 88.2, end: 90.0,
  };

  /* ---------------- layout -------------------------------------------- */
  const REFL = { x: 1000, y: 600 };
  const GRAB = { x: 1000, y: 628, s: 1.75 };
  const CUP = { s: 1.65 };                       // cupped hands: pool centred on the reflection
  const LADLE = { s: 1.25, angle: 2.25 };       // たけ's ladle from the top-right
  const FOX = { x: 960, y: 420 };               // the fox window's centre
  const PALM_R = 18;

  /* ---------------- shards: the reflection cut into 40 ring segments -- */
  const SHARDS = (() => {
    const out = [];
    const bands = [[0, 0.3, 3], [0.3, 0.56, 8], [0.56, 0.8, 12], [0.8, 1.0, 17]];
    const r = U.rng(8081);
    for (const [r0, r1, n] of bands) {
      const off = r() * TAU;
      for (let i = 0; i < n; i++) {
        const a0 = off + (i / n) * TAU, a1 = off + ((i + 1) / n) * TAU;
        const am = (a0 + a1) / 2, rm = (r0 + r1) / 2;
        out.push({
          r0, r1, a0, a1, am, rm,
          dist: U.lerp(60, 180, r()) * (0.55 + rm * 0.6),
          dir: am + U.lerp(-0.35, 0.35, r()),
          spin: U.lerp(-0.35, 0.35, r()),
          stretch: U.lerp(1.1, 1.7, r()),
          kira: r(),
        });
      }
    }
    return out;
  })();

  /** 0 = intact … 1 = fully scattered (with the exponential regather). */
  function scatter(T) {
    if (T < BT.shatter || T >= BT.whole + 0.25) return 0;
    const out = E.outCubic(U.clamp((T - BT.shatter) / 1.4));
    if (T < BT.calm) return out;
    return Math.exp(-(T - BT.calm) / 0.5) * out;
  }

  function drawShards(ctx, T) {
    const sc = scatter(T);
    const R = TSUKI.SHOTS.C.G.refl;
    const persp = R.ry / R.rx;
    ctx.save();
    TSUKI.SHOTS.C.waterClip(ctx);
    ctx.clip();
    ctx.translate(REFL.x, REFL.y);
    ctx.scale(1, persp);
    ctx.lineCap = 'round';
    for (const s of SHARDS) {
      // each shard rides a ripple outward: an arc of light along its ring,
      // lengthening as the ring grows, thinning as it goes
      const rad = s.rm * R.rx + s.dist * sc;
      const th = ((s.r1 - s.r0) * R.rx * (1 - 0.45 * sc) + 2) * (1 + 0.25 * (1 - sc));
      const half = ((s.a1 - s.a0) / 2) * (s.rm * R.rx + 8) / (rad + 8) * (1 + (s.stretch - 1) * sc * 1.4) * 1.05;
      const am = s.am + s.spin * sc;
      if (rad < th * 0.6) {
        ctx.fillStyle = C.kinari;
        ctx.beginPath();
        ctx.arc(0, 0, th, 0, TAU);
        ctx.fill();
        continue;
      }
      // a crescent: tapered at both ends, lying along its ring
      const path = new Path2D();
      const N = 10;
      for (let q = 0; q <= N; q++) {
        const u = q / N, a = am - half + 2 * half * u, w = (th / 2) * Math.sin(Math.PI * u);
        const rr = rad + w;
        if (q) path.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else path.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      for (let q = N; q >= 0; q--) {
        const u = q / N, a = am - half + 2 * half * u, w = (th / 2) * Math.sin(Math.PI * u) * 0.35;
        path.lineTo(Math.cos(a) * (rad - w), Math.sin(a) * (rad - w));
      }
      path.closePath();
      ctx.fillStyle = C.kinari;
      ctx.fill(path);
      // mica: the shards glitter as they fly
      const k = sc * (0.4 + 0.6 * Math.pow(Math.max(0, Math.sin(T * 11 + s.kira * 40)), 3));
      if (k > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255,250,236,${0.5 * k})`;
        ctx.fill(path);
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

  /* ---------------- the palm moon & its beads -------------------------- */
  const palmR = (T) => {
    if (T < BT.sit) return PALM_R;
    return PALM_R * Math.pow(U.clamp(1 - (T - BT.sit) / 6.8), 0.7);
  };
  /**
   * Beads leaking from the cupped hands every 0.5 s (75.4–82.2). Seen from
   * above, only drops that leave the hands' outer edges can be seen falling:
   * they slip off the sides of the palms and ring the water just beside them.
   */
  const DRIPS = [[-63, 8], [64, 2], [-60, -22], [62, 24], [-58, 30], [61, -16]];
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
      const x = st.x + d[0] * CUP.s, y = st.y + d[1] * CUP.s;
      const side = Math.sign(d[0]);
      out.push({ i, t0, age, x, y, lx: x + side * 8, ly: y + 58, tl: t0 + 0.32, landed: age > 0.32 });
    });
    return out;
  }

  /* ---------------- scratch for underwater tinting -------------------- */
  let scratch = null;
  let sbox = null;   // device-pixel rect of the current scratch pass (immediate, not carried between frames)
  /** A scratch layer for one hand pass, limited to the logical box [x0, y0, x1, y1]. */
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
  function blitScratch(ctx) {
    if (!sbox) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(scratch, sbox[0], sbox[1], sbox[2], sbox[3], sbox[0], sbox[1], sbox[2], sbox[3]);
    ctx.restore();
  }

  /** Glaze everything already in the scratch (source-atop) with a flat ink. */
  function glaze(s2, col, a, clip) {
    if (a <= 0.001) return;
    s2.save();
    s2.globalCompositeOperation = 'source-atop';
    if (clip) clip(s2);
    s2.fillStyle = U.rgba(col, a);
    s2.fillRect(-200, -600, 2320, 2400);
    s2.restore();
  }
  /* ---------------- 小夜's kasuri sleeves, reaching in from below ------ */
  let kasuriTile = null;
  function kasuri() {
    if (kasuriTile) return kasuriTile;
    const S = 64;
    kasuriTile = B.canvas(S, S);
    const c = kasuriTile.getContext('2d');
    c.fillStyle = C.kon;
    c.fillRect(0, 0, S, S);
    const r = U.rng(1212);
    // 十字絣: small crosses with feathered (bled) edges, plus a few dashes
    const cross = (x, y) => {
      for (const [ox, oy] of [[0, 0], [S, 0], [-S, 0], [0, S], [0, -S]]) {
        for (let k = 0; k < 3; k++) {
          c.fillStyle = U.rgba(C.gofun, [0.25, 0.45, 0.85][k]);
          const w = [9, 7.5, 6][k], h = [2.6, 2.1, 1.6][k];
          c.fillRect(x + ox - w / 2 + U.lerp(-0.6, 0.6, r()), y + oy - h / 2, w, h);
          c.fillRect(x + ox - h / 2, y + oy - w / 2 + U.lerp(-0.6, 0.6, r()), h, w);
        }
      }
    };
    cross(16, 16); cross(48, 48);
    c.fillStyle = U.rgba(C.gofun, 0.5);
    c.fillRect(40, 14, 8, 1.6); c.fillRect(8, 44, 7, 1.6);
    return kasuriTile;
  }
  /**
   * A kimono sleeve from the wrist (wx, wy) back toward the body along (dx, dy),
   * widening from w0 to w1 over len px; the cuff hem lies over the forearm.
   */
  function sleeve(c, wx, wy, dx, dy, w0, w1, len, k) {
    const L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const p = (a, b) => [wx + ux * a + nx * b, wy + uy * a + ny * b];
    const path = new Path2D();
    const a0 = p(0, -w0 / 2), a1 = p(0, w0 / 2);
    path.moveTo(...a0);
    path.bezierCurveTo(...p(len * 0.3, -w0 * 0.62), ...p(len * 0.6, -w1 * 0.5), ...p(len, -w1 / 2));
    path.lineTo(...p(len, w1 / 2));
    path.bezierCurveTo(...p(len * 0.6, w1 * 0.5), ...p(len * 0.3, w0 * 0.62), ...a1);
    path.quadraticCurveTo(...p(-7, 0), ...a0);
    path.closePath();
    const pat = c.createPattern(kasuri(), 'repeat');
    const ang = Math.atan2(uy, ux) - Math.PI / 2;
    pat.setTransform(new DOMMatrix().translate(wx, wy).rotate((ang * 180) / Math.PI).scale(k * 0.55));
    c.save();
    c.fillStyle = pat;
    c.fill(path);
    // a fold or two, and the shadowed underside
    c.clip(path);
    const g = c.createLinearGradient(...p(0, -w1 / 2), ...p(0, w1 / 2));
    g.addColorStop(0, U.rgba(C.sumi, 0));
    g.addColorStop(0.7, U.rgba(C.sumi, 0));
    g.addColorStop(1, U.rgba(C.sumi, 0.35));
    c.fillStyle = g;
    c.fill(path);
    // the arms recede into the dark toward the body (and keep the subtitle band calm)
    const gy = c.createLinearGradient(0, 850, 0, 1080);
    gy.addColorStop(0, U.rgba(C.koiai, 0));
    gy.addColorStop(1, U.rgba(C.koiai, 0.7));
    c.fillStyle = gy;
    c.fill(path);
    B.taper(c, [p(len * 0.25, w0 * 0.1), p(len * 0.55, w1 * 0.12), p(len, w1 * 0.1)], 2.2 * k, 0.6 * k, U.rgba(C.sumi, 0.45), 0.2);
    c.restore();
    c.save();
    c.strokeStyle = U.rgba(C.sumi, 0.85);
    c.lineWidth = 2.2 * k;
    c.lineJoin = 'round';
    c.stroke(path);
    // the cuff hem
    c.strokeStyle = U.rgba(U.mix(C.kon, C.gofun, 0.35), 0.6);
    c.lineWidth = 1.4 * k;
    c.beginPath();
    c.moveTo(...p(5, -w0 / 2 + 2));
    c.quadraticCurveTo(...p(-2, 0), ...p(5, w0 / 2 - 2));
    c.stroke();
    c.restore();
  }

  const NIGHT = U.mix(C.ai, C.koiai, 0.45);
  const NIGHT_A = 0.24;

  /* ---------------- the child's grabbing hands (67.4–70.1) ------------- */
  function drawGrab(ctx, T) {
    if (T < BT.plunge || T > BT.calm + 0.3) return;
    const inP = E.outCubic(U.seg(T, BT.plunge, BT.shatter));
    const outP = E.inOutSine(U.seg(T, BT.up + 0.1, BT.calm + 0.2));
    const lift = E.outSine(U.seg(T, BT.up, BT.up + 0.35));             // coming up: nearer the eye
    const y = GRAB.y + (1 - inP) * 560 + outP * 620 - lift * 14;
    const s = GRAB.s * (1 + 0.05 * lift - 0.04 * (T > BT.shatter && T < BT.up ? 1 : 0) * E.outSine(U.seg(T, BT.shatter, BT.shatter + 0.2)));
    const close = T < BT.shatter ? 0 : T < BT.up ? E.outCubic(U.seg(T, BT.shatter, BT.shatter + 0.22)) : U.lerp(1, 0.25, E.inOutSine(U.seg(T, BT.up, BT.up + 0.5)));
    const under = U.env(T, BT.shatter - 0.08, BT.shatter + 0.08, BT.up - 0.05, BT.up + 0.2);
    const s2 = scratchFor(ctx, [GRAB.x - 195 * s, y - 150 * s, GRAB.x + 195 * s, 1090]);
    const geo = CAST.hands(s2, GRAB.x, y, s, { pose: 'grab', close, t: T, age: 0, sleeve: false });
    for (const sd of [-1, 1]) {
      const th = sd * 0.16;
      const wx = GRAB.x + (sd * 66 - 30 * Math.sin(th) - 5 * sd) * s, wy = y + (40 + 30 * Math.cos(th) - 8) * s;
      sleeve(s2, wx, wy, -sd * 0.06, 1, 44 * s, 104 * s, 520, s / 1.75);
    }
    glaze(s2, NIGHT, NIGHT_A);
    // the fingers under water: 藍 over the part inside the basin's water
    glaze(s2, U.mix(C.ai, C.koiai, 0.5), 0.6 * under, (c) => {
      TSUKI.SHOTS.C.waterClip(c);
      c.clip();
      c.beginPath();
      c.rect(0, 0, 1920, y - 22 * s);
      c.clip();
    });
    blitScratch(ctx);
    // bright beads falling from the fingertips as they come up empty
    if (geo && T > BT.up && T < BT.up + 1.2) {
      ctx.save();
      geo.tips.forEach((p, i) => {
        const t0 = BT.up + 0.05 + (i % 5) * 0.12 + U.hash(i + 71) * 0.1;
        const age = T - t0;
        if (age < 0 || age > 0.5) return;
        const yy = p[1] + 10 + 90 * age * age * 4;
        if (yy > 950) return;
        ctx.fillStyle = U.rgba(C.gofun, 0.9 * (1 - age / 0.5));
        ctx.beginPath();
        ctx.ellipse(p[0], yy, 3, 3 + 5 * age, 0, 0, TAU);
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
    const g = CAST.hands(cv.getContext('2d'), 0, 0, LADLE.s, { pose: 'ladle', tilt: 0, angle: LADLE.angle, age: 1 });
    ladleOff = g ? g.cup : [-260, 330];
    return ladleOff;
  }
  /** Where the ladle's cup is at T, its scale and tilt. */
  function ladleState(T) {
    if (T < BT.ladleIn || T > BT.cupOut + 0.2) return null;
    const off = ladleOffset();
    const dir = [-off[0], -off[1]];
    const L = Math.hypot(dir[0], dir[1]);
    const u = [dir[0] / L, dir[1] / L];                 // from the cup toward the hand (up-right)
    const enter = E.outCubic(U.seg(T, BT.ladleIn, BT.dip - 0.05));
    const leave = E.inOutSine(U.seg(T, BT.ladleOut, BT.cupOut + 0.2));
    // cup path: in along the handle, dip at the moon, lift up-right, pour, rest
    let cx = REFL.x, cy = REFL.y;
    const hover = E.inOutSine(U.seg(T, BT.lift, BT.tip - 0.15));
    cx += hover * 70; cy += hover * -56;
    const rest = E.inOutSine(U.seg(T, BT.sit + 0.2, BT.sit + 1.4));
    cx += rest * 60; cy += rest * -40;
    const away = (1 - enter) * 900 + leave * 950;
    cx += u[0] * away + 1.6 * U.wobble(T * 0.5, 23); cy += u[1] * away + 1.6 * U.wobble(T * 0.43, 29);
    const dipK = U.env(T, BT.dip - 0.1, BT.dip + 0.15, BT.lift - 0.1, BT.lift + 0.15);
    const scale = LADLE.s * (1 - 0.06 * dipK + 0.08 * hover - 0.02 * rest);
    const tilt = U.env(T, BT.tip - 0.05, BT.tip + 0.3, BT.sit + 0.15, BT.sit + 0.7) * 0.85;
    const water = T < BT.dip + 0.2 ? 0.05 : T < BT.tip ? E.outSine(U.seg(T, BT.dip + 0.2, BT.lift)) : U.lerp(1, 0.08, U.seg(T, BT.tip, BT.sit));
    return { cx, cy, scale, tilt, water, dipK, hover };
  }
  function drawLadle(ctx, T) {
    const L = ladleState(T);
    if (!L) return null;
    const off = ladleOffset();
    const k = L.scale / LADLE.s;
    const ax = L.cx - off[0] * k, ay = L.cy - off[1] * k;
    const s2 = scratchFor(ctx, [L.cx - 90, -10, 1930, L.cy + 110]);
    const g = CAST.hands(s2, ax, ay, L.scale, { pose: 'ladle', tilt: L.tilt, angle: LADLE.angle, water: L.water, age: 1, t: T });
    glaze(s2, NIGHT, NIGHT_A);
    blitScratch(ctx);
    // the tiny moon in the cup (from the lift until it pours out)
    if (g && T >= BT.lift - 0.05 && T < BT.tip + 0.05) {
      const a = E.outSine(U.seg(T, BT.lift - 0.05, BT.lift + 0.35));
      ctx.save();
      ctx.translate(g.cup[0], g.cup[1]);
      ctx.rotate(g.rot || 0);
      ctx.scale(1, Math.max(0.4, (g.ry || 1) / (g.rx || 1)));
      TSUKI.MOON.draw(ctx, 0, 0, PALM_R * (0.94 + 0.06 * a), T, { alpha: a, fringe: false });
      ctx.restore();
    }
    return g;
  }

  /** The moon riding the poured water from the cup into the palms (75.0–75.4). */
  function drawPour(ctx, T, cupGeo, palm) {
    if (T < BT.tip + 0.05 || T >= BT.sit || !cupGeo || !palm) return;
    const u = E.inOutSine(U.seg(T, BT.tip + 0.05, BT.sit));
    const x = U.lerp(cupGeo.cup[0], palm.x, u), y = U.lerp(cupGeo.cup[1], palm.y, u) - Math.sin(u * Math.PI) * 18;
    // a short stream of water
    ctx.save();
    ctx.strokeStyle = U.rgba(C.geppaku, 0.55);
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cupGeo.lip ? cupGeo.lip[0] : cupGeo.cup[0], cupGeo.lip ? cupGeo.lip[1] : cupGeo.cup[1]);
    ctx.quadraticCurveTo((x + palm.x) / 2 + 10, Math.min(y, palm.y) - 12, palm.x, palm.y);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.8);
    TSUKI.MOON.draw(ctx, 0, 0, PALM_R, T, { fringe: false });
    ctx.restore();
  }

  /* ---------------- the child's cupped hands (73.8–85.6) --------------- */
  function cupState(T) {
    if (T < BT.lift || T > BT.cupOut + 1.3) return null;
    const inP = E.outCubic(U.seg(T, BT.lift, BT.tip));
    const outP = E.inOutSine(U.seg(T, BT.cupOut, BT.cupOut + 1.2));
    const breathe = 2 * U.wobble(T * 0.6, 17);
    const dy = (1 - inP) * 620 + outP * 640;
    const x = REFL.x + 1.5 * U.wobble(T * 0.5, 19);
    const y = REFL.y + 6 * CUP.s + dy + breathe;
    return { x, y, poolX: x, poolY: y - 6 * CUP.s };
  }
  function drawCup(ctx, T) {
    const st = cupState(T);
    if (!st) return null;
    const r = palmR(T);
    const water = T < BT.tip ? 0 : T < BT.sit ? E.outSine(U.seg(T, BT.tip + 0.1, BT.sit)) : Math.pow(r / PALM_R, 1.1);
    const tremble = U.env(T, BT.tremble, BT.tremble + 0.4, BT.last - 0.2, BT.last + 0.6) * 0.8;
    const s2 = scratchFor(ctx, [st.x - 270, st.y - 220, st.x + 270, 1090]);
    const geo = CAST.hands(s2, st.x, st.y, CUP.s, { pose: 'cupped', water: 0, t: T, tremble, age: 0, sleeve: false });
    for (const sd of [-1, 1]) sleeve(s2, st.x + sd * 30 * CUP.s, st.y + 56 * CUP.s, sd * 0.3, 1, 42 * CUP.s, 100 * CUP.s, 520, CUP.s / 1.75);
    const hold = T >= BT.sit ? r / PALM_R : 0;
    const dark = U.seg(T, BT.last - 0.6, BT.last + 1.4, E.inOutSine);
    glaze(s2, NIGHT, NIGHT_A);
    glaze(s2, U.mix(C.koiai, C.sumi, 0.35), 0.5 * dark);
    // the moon lights her palms from within while she holds it
    if (hold > 0.01) {
      s2.save();
      s2.globalCompositeOperation = 'source-atop';
      const g = s2.createRadialGradient(st.poolX, st.poolY, r, st.poolX, st.poolY, 150);
      g.addColorStop(0, U.rgba(C.geppaku, 0.34 * hold));
      g.addColorStop(0.5, U.rgba(C.geppaku, 0.1 * hold));
      g.addColorStop(1, U.rgba(C.geppaku, 0));
      s2.fillStyle = g;
      s2.fillRect(st.poolX - 160, st.poolY - 160, 320, 320);
      s2.restore();
    }
    // the water held in the palms: a small dark pool round the moon, shrinking with it
    const pr = T < BT.sit ? 52 * water : 2.4 * r + 14 * Math.sqrt(r / PALM_R);
    if (pr > 0.5) {
      s2.save();
      s2.globalCompositeOperation = 'source-atop';
      s2.save();
      s2.translate(st.poolX + 2, st.poolY + 2);
      s2.scale(1, 0.74);
      const pg = s2.createRadialGradient(0, 0, pr * 0.3, 0, 0, pr);
      pg.addColorStop(0, U.rgba(U.mix(C.ai, C.koiai, 0.5), 0.95));
      pg.addColorStop(0.75, U.rgba(U.mix(C.ai, C.koiai, 0.35), 0.8));
      pg.addColorStop(1, U.rgba(C.ai, 0.15));
      s2.fillStyle = pg;
      s2.beginPath();
      s2.arc(0, 0, pr, 0, TAU);
      s2.fill();
      s2.restore();
      s2.strokeStyle = U.rgba(C.geppaku, 0.4);
      s2.lineWidth = 1.4;
      s2.beginPath();
      s2.ellipse(st.poolX + 2, st.poolY + 2, pr - 1, pr * 0.74 - 1, 0, Math.PI * 1.1, Math.PI * 1.8);
      s2.stroke();
      s2.restore();
    }
    blitScratch(ctx);
    // the moon in the palms: a coin of paper in the dark water
    if (T >= BT.sit && r > 0.4) {
      ctx.save();
      ctx.translate(st.poolX + 2, st.poolY + 2);
      ctx.scale(1, 0.8);
      TSUKI.MOON.draw(ctx, 0, 0, r, T, { fringe: false });
      ctx.restore();
    }
    return { st, geo };
  }

  function drawBeads(ctx, T, cup) {
    if (!cup) return;
    ctx.save();
    for (const b of palmBeads(T)) {
      if (b.age < 0) {
        // swelling at the edge of the palm
        const k = 1 + b.age / 0.3;
        ctx.fillStyle = U.rgba(C.gofun, 0.9 * k);
        ctx.beginPath();
        ctx.arc(b.x, b.y, 1 + 2.8 * k, 0, TAU);
        ctx.fill();
        continue;
      }
      if (b.age > 0.32) continue;
      const f = E.inQuad(b.age / 0.32);
      const x = U.lerp(b.x, b.lx, f), y = U.lerp(b.y, b.ly, f);
      ctx.strokeStyle = U.rgba(C.geppaku, 0.5 * f);
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(x, y - 4);
      ctx.stroke();
      ctx.fillStyle = U.rgba(C.gofun, 0.98);
      ctx.beginPath();
      ctx.ellipse(x, y, 4.2, 4.2 + 3 * f, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------------- the fox window (86.0–90.0) ------------------------- */
  function foxState(T) {
    if (T < BT.window) return null;
    const inP = E.outCubic(U.seg(T, BT.window, BT.reveal));
    const open = E.inOutCubic(U.seg(T, BT.open, BT.end));
    const scale = U.lerp(1, 12.2, open);
    const drift = [2 * U.wobble(T * 0.5, 41), 2 * U.wobble(T * 0.45, 43)];
    const x = FOX.x + (1 - inP) * 1000 + drift[0] * (1 - open);
    const y = FOX.y - (1 - inP) * 760 + drift[1] * (1 - open);
    return { x, y, scale, open };
  }

  function drawFoxWindow(ctx, T, S) {
    const st = foxState(T);
    if (!st) return;
    const opts = { pose: 'fox-window', age: 1, t: T, interlace: 1 };
    // inside the diamond: Shot D — the 四 scene's own frame at this T. It
    // clears like glass: a mica edge sweeps across (30°, as the moon's kira)
    // and behind it the moon's true face is there.
    const sw = E.inOutSine(U.seg(T, BT.reveal, BT.reveal + 0.8));
    if (sw > 0.001) {
      const win = CAST.foxWindowRect(st.x, st.y, st.scale, opts);
      const ang = U.deg(30), ca = Math.cos(ang), sa = Math.sin(ang);
      const span = (win.w + win.h) * 0.6;
      const edge = -span + 2 * span * sw;                 // signed distance of the sweep along its normal
      ctx.save();
      ctx.beginPath();
      win.path(ctx);
      ctx.clip();
      if (sw < 1) {
        ctx.save();
        ctx.translate(win.cx, win.cy);
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.rect(-span * 2, -span * 2, span * 2 + edge, span * 4);
        ctx.restore();
        ctx.clip();
      }
      if (TSUKI.SHOTS.D && TSUKI.SHOTS.D.frame) TSUKI.SHOTS.D.frame(ctx, T, S);
      ctx.restore();
      if (sw < 1) {
        ctx.save();
        ctx.beginPath();
        win.path(ctx);
        ctx.clip();
        const ex = win.cx + ca * edge, ey = win.cy + sa * edge;
        const g = ctx.createLinearGradient(ex - ca * 40, ey - sa * 40, ex + ca * 40, ey + sa * 40);
        const k = Math.sin(sw * Math.PI);
        g.addColorStop(0, 'rgba(255,252,240,0)');
        g.addColorStop(0.5, `rgba(255,252,240,${0.55 * k})`);
        g.addColorStop(1, 'rgba(255,252,240,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = g;
        ctx.fillRect(win.cx - win.w, win.cy - win.h, win.w * 2, win.h * 2);
        ctx.restore();
      }
    }
    if (st.scale < 11.9) {
      const s2 = scratchFor(ctx, [st.x - 720 * st.scale, st.y - 220 * st.scale, st.x + 720 * st.scale, st.y + 420 * st.scale]);
      CAST.hands(s2, st.x, st.y, st.scale, opts);
      // against the bright window, the nearing hands fall into silhouette
      glaze(s2, NIGHT, NIGHT_A);
      glaze(s2, U.mix(C.koiai, C.sumi, 0.55), 0.9 * E.inOutSine(U.seg(T, BT.open - 0.2, BT.open + 0.9)));
      blitScratch(ctx);
    }
  }

  /* ---------------- the scene ------------------------------------------ */
  TSUKI.scene('mizu-no-tsuki', {
    init(S) {
      ladleOffset();
      const w = Math.round(1920 * S.k), h = Math.round(1080 * S.k);
      TSUKI.SHOTS.C.warm(70, w, h);
      if (TSUKI.SHOTS.D.warm) TSUKI.SHOTS.D.warm(w, h);
    },
    draw(ctx, t, S) {
      const T = S.seg.start + t;
      const SC = TSUKI.SHOTS.C;
      // settle out of the match-cut: the basin eases its y-scale 1.3 → 1.0
      const squash = 1 + 0.3 * (1 - E.inOutSine(U.seg(T, 66.0, 67.2)));
      if (T >= BT.end - 1e-4 && TSUKI.SHOTS.D && TSUKI.SHOTS.D.frame) { TSUKI.SHOTS.D.frame(ctx, T, S); return; }
      ctx.save();
      if (squash > 1.0001) {
        ctx.translate(960, 620);
        ctx.scale(1, squash);
        ctx.translate(-960, -620);
      }
      // precompute bead landings (for their rings) from the cup geometry
      const cupSt = cupState(T);
      const rings = allRings(T);
      const sc = scatter(T);
      const wob = Math.max(U.env(T, BT.shatter - 0.1, BT.shatter + 0.2, BT.calm, BT.whole), U.env(T, BT.dip - 0.05, BT.dip + 0.2, BT.lift + 0.4, BT.lift + 1.4) * 0.6);
      let cupGeo = null;
      SC.print(ctx, T, {
        water: (c) => {
          PRINT.with(c, 'P7', T, (c2) => {
            if (sc < 0.02) SC.reflection(c2, T, { wobble: wob });
            else {
              // cross-fade between the whole disc and its shards at both ends
              const whole = 1 - U.smoothstep(0, 0.06, sc);
              if (whole > 0) SC.reflection(c2, T, { alpha: whole, wobble: wob });
              drawShards(c2, T);
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
            drawBeads(c2, T, cup);
            cupGeo = drawLadle(c2, T);
            if (cup) drawPour(c2, T, cupGeo, { x: cup.st.poolX, y: cup.st.poolY });
          });
        },
      });
      void cupSt;
      ctx.restore();
      PRINT.with(ctx, 'K', T, (c2) => drawFoxWindow(c2, T, S));
    },
  });
})(window.TSUKI);
