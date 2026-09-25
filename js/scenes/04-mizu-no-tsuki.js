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
  const GRAB = { x: 1000, y: 668, s: 1.75 };
  const CUP = { s: 1.9 };                       // cupped hands: pool centred on the reflection
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
    for (const s of SHARDS) {
      const d = s.dist * sc;
      const cx = REFL.x + Math.cos(s.dir) * d, cy = REFL.y + Math.sin(s.dir) * d * persp;
      ctx.save();
      // each shard rides the ripple: pushed out along its radius, stretched along the ring
      ctx.translate(cx, cy);
      ctx.scale(1, persp);
      ctx.rotate(s.spin * sc);
      const st = 1 + (s.stretch - 1) * sc;
      const rr0 = s.r0 * R.rx, rr1 = s.r1 * R.rx * (1 - 0.15 * sc);
      const half = ((s.a1 - s.a0) / 2) * st;
      ctx.beginPath();
      // an annular sector centred on its own mid-angle, drawn about the origin
      const mx = Math.cos(s.am) * s.rm * R.rx, my = Math.sin(s.am) * s.rm * R.rx;
      ctx.translate(-mx, -my);
      ctx.arc(0, 0, rr1, s.am - half, s.am + half);
      ctx.arc(0, 0, Math.max(0.5, rr0 + (rr1 - rr0) * 0.25 * sc), s.am + half * (1 - 0.3 * sc), s.am - half * (1 - 0.3 * sc), true);
      ctx.closePath();
      ctx.fillStyle = C.kinari;
      ctx.fill();
      // mica: the shards glitter as they fly
      const k = sc * (0.4 + 0.6 * Math.pow(Math.max(0, Math.sin(T * 13 + s.kira * 40)), 3));
      if (k > 0.02) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255,250,236,${0.45 * k})`;
        ctx.fill();
      }
      ctx.restore();
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
  /** Beads falling between the fingers every 0.5 s (75.4–82.2). */
  function palmBeads(T) {
    const out = [];
    const n = Math.floor((BT.last - BT.sit) / 0.5) + 1;
    for (let i = 0; i < n; i++) {
      const t0 = BT.sit + 0.25 + i * 0.5;
      if (t0 > BT.last + 0.01) break;
      const age = T - t0;
      if (age < -0.3 || age > 1.2) continue;
      const di = [0, 2, 4, 1, 3, 5][i % 6];
      out.push({ i, t0, age, di, tl: t0 + 0.32, landed: age > 0.32 });
    }
    return out;
  }

  /* ---------------- scratch for underwater tinting -------------------- */
  let scratch = null;
  function scratchFor(ctx) {
    const cv = ctx.canvas;
    if (!scratch || scratch.width !== cv.width || scratch.height !== cv.height) scratch = B.canvas(cv.width, cv.height);
    const s = scratch.getContext('2d');
    s.setTransform(1, 0, 0, 1, 0, 0);
    s.globalCompositeOperation = 'source-over';
    s.globalAlpha = 1;
    s.clearRect(0, 0, scratch.width, scratch.height);
    s.setTransform(ctx.getTransform());
    return s;
  }
  function blitScratch(ctx) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(scratch, 0, 0);
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
  const NIGHT = U.mix(C.ai, C.koiai, 0.45);
  const NIGHT_A = 0.36;

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
    const s2 = scratchFor(ctx);
    const geo = CAST.hands(s2, GRAB.x, y, s, { pose: 'grab', close, t: T, age: 0 });
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
    cx += u[0] * away; cy += u[1] * away;
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
    const s2 = scratchFor(ctx);
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
    const s2 = scratchFor(ctx);
    const geo = CAST.hands(s2, st.x, st.y, CUP.s, { pose: 'cupped', water: 0, t: T, tremble, age: 0 });
    const hold = T >= BT.sit ? r / PALM_R : 0;
    const dark = U.seg(T, BT.last - 0.6, BT.last + 1.4, E.inOutSine);
    glaze(s2, NIGHT, NIGHT_A + 0.22 * dark);
    // the pool held in the palms: dark 藍 water, shrinking with the moon
    if (water > 0.01) {
      const rx = 36 * CUP.s * Math.sqrt(water), ry = 27 * CUP.s * Math.sqrt(water);
      s2.save();
      s2.globalCompositeOperation = 'source-atop';
      s2.fillStyle = U.rgba(U.mix(C.ai, C.koiai, 0.55), 0.92);
      s2.beginPath();
      s2.ellipse(st.poolX + 2, st.poolY + 2, rx, ry, 0, 0, TAU);
      s2.fill();
      s2.strokeStyle = U.rgba(C.geppaku, 0.35);
      s2.lineWidth = 1.5;
      s2.beginPath();
      s2.ellipse(st.poolX + 2, st.poolY + 2, rx - 1, ry - 1, 0, Math.PI * 1.1, Math.PI * 1.75);
      s2.stroke();
      s2.restore();
    }
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
    if (!cup || !cup.geo || !cup.geo.drips) return;
    ctx.save();
    for (const b of palmBeads(T)) {
      const p = cup.geo.drips[b.di % cup.geo.drips.length];
      if (!p) continue;
      if (b.age < 0) {
        // swelling at the fingers' seam
        const k = 1 + b.age / 0.3;
        ctx.fillStyle = U.rgba(C.gofun, 0.85 * k);
        ctx.beginPath();
        ctx.arc(p[0], p[1], 1 + 2.4 * k, 0, TAU);
        ctx.fill();
        continue;
      }
      if (b.age > 0.32) continue;
      const f = b.age / 0.32;
      const yy = p[1] + 4 + 70 * f * f;
      if (yy > 950) continue;
      ctx.fillStyle = U.rgba(C.gofun, 0.95);
      ctx.beginPath();
      ctx.ellipse(p[0], yy, 3, 3 + 5 * f, 0, 0, TAU);
      ctx.fill();
      // record where it lands (for its ring)
      b.lx = p[0]; b.ly = yy;
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
    const reveal = E.inOutSine(U.seg(T, BT.reveal, BT.reveal + 0.7));
    return { x, y, scale, reveal, open };
  }

  function drawFoxWindow(ctx, T, S) {
    const st = foxState(T);
    if (!st) return;
    const opts = { pose: 'fox-window', age: 1, t: T, interlace: 1 };
    // inside the diamond: Shot D — the 四 scene's own frame at this T
    if (st.reveal > 0.001) {
      const win = CAST.foxWindowRect(st.x, st.y, st.scale, opts);
      ctx.save();
      ctx.beginPath();
      win.path(ctx);
      ctx.clip();
      ctx.globalAlpha = st.reveal;
      if (TSUKI.SHOTS.D && TSUKI.SHOTS.D.frame) TSUKI.SHOTS.D.frame(ctx, T, S);
      ctx.globalAlpha = 1;
      // the glass: a mica sweep across the diamond as it clears
      const sw = U.seg(T, BT.reveal, BT.reveal + 1.1);
      if (sw > 0 && sw < 1) {
        const x0 = win.cx - win.w * 0.7 + win.w * 1.4 * E.inOutSine(sw);
        const g = ctx.createLinearGradient(x0 - 50, 0, x0 + 50, 0);
        g.addColorStop(0, 'rgba(255,252,240,0)');
        g.addColorStop(0.5, `rgba(255,252,240,${0.35 * Math.sin(sw * Math.PI)})`);
        g.addColorStop(1, 'rgba(255,252,240,0)');
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = g;
        ctx.fillRect(win.cx - win.w, win.cy - win.h, win.w * 2, win.h * 2);
      }
      ctx.restore();
    }
    if (st.scale < 11.9) {
      const s2 = scratchFor(ctx);
      CAST.hands(s2, st.x, st.y, st.scale, opts);
      // against the bright window, the nearing hands fall into silhouette
      glaze(s2, NIGHT, NIGHT_A);
      glaze(s2, U.mix(C.koiai, C.sumi, 0.55), 0.9 * E.inOutSine(U.seg(T, BT.open - 0.2, BT.open + 0.9)));
      blitScratch(ctx);
    }
  }

  /* ---------------- the scene ------------------------------------------ */
  TSUKI.scene('mizu-no-tsuki', {
    init() { ladleOffset(); },
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
