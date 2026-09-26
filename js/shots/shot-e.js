/* ==========================================================================
   shot-e.js — master shot E: dawn Fuji from afar (結).
   Homage: 北斎『富嶽三十六景』 (the flat summit plateau, the concave flanks,
   the snow running down the fall lines) and 芳年『月百姿』「烟中月」 (a thread
   of smoke across the moon).

   The shot exists only in the late impression (後摺, T ≥ 206): flat blues,
   broken key lines, goma-zuri speckle, a yellowed and foxed sheet — and one
   FRESH block, the 東雲 (plate D), cut in 鴇, the ink of the faded heko-obi.
   Everything static is carved into plates here; everything that moves is
   drawn live through PRINT.with so the unprinting (T 222–228) lifts it in
   fugitive-pigment order.

   Layers (back → front):  [aged sheet] · sky · dawn · [moon] · fuji
                           · [smoke, kasumi] · land · [shadow, fox, near susuki]

   API — TSUKI.SHOTS.E
     AXIS, CRATER, PEAK, APEX, HORIZON, MATCH   geometry (MATCH = the 206.0 cut)
     HOUSE, FIGURE, FOX, SHADOW, INK
     fujiPath()                          Path2D of the mountain (for clips)
     moon(T)                             MOON.E(T) + visible flag
     smokeTip(T)                         y of the smoke thread's tip
     smokeX(y, T)                        x of the thread's centre line at height y (its slow S)
     dawn(T)                             東雲 growth 0..1 (206–220)
     draw(ctx, T, opts)                  the whole dawn picture, printed at T
       opts.dawn   0..1 override of the 東雲 growth
       opts.shadow 0..1 override of the dawn-shadow reveal
       opts.look   0..1 override of the fox's head turn
       opts.age    false → skip the aged sheet (draw it yourself with E.age)
       opts.live   false → leave the rim flash and the smoke to E.drawLive
     drawLive(ctx, T)                    the rim flash + the smoke (sharp, over a live:false print)
     layer(ctx, name, T, opts)           one carved layer (PRINT.drawLayer)
     age(ctx, T[, amount])               the 後摺 paper (lifts 226.5–228)
     drawMoon / drawSmoke / drawKasumi / drawShadow / drawFox / drawNearSusuki
                                         the live parts, each (ctx, T[, k])
   ========================================================================== */
(function (TSUKI) {
  'use strict';

  const U = TSUKI.U, B = TSUKI.B, C = TSUKI.C;
  const PRINT = TSUKI.PRINT, MOON = TSUKI.MOON;
  TSUKI.SHOTS = TSUKI.SHOTS || {};
  const E = (TSUKI.SHOTS.E = TSUKI.SHOTS.E || {});
  const TAU = Math.PI * 2;
  const W = 1920, H = 1080;

  /* ------------------------------------------------------------------ */
  /* geometry (design/screenplay.json → shots.E, segments[結])           */
  /* ------------------------------------------------------------------ */
  E.AXIS = 1180;                       // the incense → gully → smoke axis
  E.CRATER = [1180, 425];              // smoke root, on the crater's floor
  E.PEAK = [1180, 418];
  E.APEX = [1195, 342];                // where the flanks would meet: the fall lines radiate from here
  E.HORIZON = 822;
  E.MATCH = { x: 1180, gully: [425, 640], smoke: [420, 392] };
  E.HOUSE = { x0: 200, x1: 420, base: 830 };
  E.FIGURE = [390, 822];               // 小夜 seated on the engawa's edge, facing the mountain
  E.FOX = [980, 904];
  E.SHADOW = { from: [398, 830], to: [1290, 952] };  // ≈ 900 px; passes the fox's paws

  // the inks of this shot (後摺 palette)
  const AINEZU = U.mix(C.ai, C.nezumi, 0.5);
  const INK = {
    sky: U.mix(U.mix(C.gunjo, C.hanada, 0.25), C.geppaku, 0.4),   // flat pale 藍: the worn sky block
    kikyo: C.kikyo,
    fuji: U.mix(U.mix(C.bero, C.kon, 0.4), C.nezumi, 0.16),    // ベロ藍, the worn mountain block re-inked
    snow: C.gofun,
    hills: U.mix(AINEZU, C.kon, 0.3),
    hills2: U.mix(AINEZU, C.ginnezu, 0.4),
    thatch: U.mix(C.odo, C.nezumi, 0.42),
    thatchDk: U.mix(U.mix(C.odo, C.sumi, 0.55), C.nezumi, 0.3),
    wood: U.mix(C.odo, C.sumi, 0.55),               // 煤竹
    plaster: U.mix(C.odo, C.kinari, 0.55),
    shoji: C.geppaku,
    blade: U.mix(U.mix(C.matsuba, C.rikyu, 0.55), C.nezumi, 0.15),
    bladeNear: U.mix(U.mix(C.matsuba, C.rikyu, 0.25), C.sumi, 0.12),
    bladeLt: U.mix(C.kuchiba, C.rikyu, 0.45),
    stem: U.mix(C.kuchiba, C.rikyu, 0.5),
    plume: U.mix(C.ginnezu, C.susuki, 0.42),
    groundTop: U.mix(U.mix(C.susuki, C.ginnezu, 0.45), C.rikyu, 0.12),
    groundMid: U.mix(U.mix(C.susuki, C.rikyu, 0.55), C.ginnezu, 0.2),
    groundBot: U.mix(U.mix(C.rikyu, C.matsuba, 0.35), C.nezumi, 0.2),
    shadow: AINEZU,                                 // 藍鼠: every cast shadow
    toki: C.toki,
    sumi: C.sumi,
  };
  E.INK = INK;
  const SKY_A = 1;                                  // coverage of the flat sky block (× the plate's 0.55 × SKY_P6)
  const SKY_P6 = 1.38;                              // the sky block, inked a little heavier than the table's 0.55
  const FUJI_P6 = 1.66;                             // the mountain block prints heavier still (×0.55 ≈ 0.91)

  /** Fuji profile: 0 at the shoulder … 1 at the base (concave flanks). */
  const prof = (u) => 0.42 * u + 0.58 * (1 - (1 - u) * (1 - u));
  // Hokusai's flat top: a plateau at y 417–419 with three small crenellations
  // and, on the axis, the crater — a flat-bottomed trough 30 px wide.
  const SUMMIT = [
    [1140, 421], [1142.5, 418.9], [1146.5, 418.3], [1150.2, 417.8], [1152, 416.5], [1153.8, 417.7],
    [1158, 418.1], [1162.5, 418.3], [1165, 418.6],
    [1168, 420.9], [1170.6, 423.6], [1172.2, 425.4], [1176, 425.7], [1180, 425.9], [1184, 425.7],
    [1187.8, 425.4], [1189.4, 423.6], [1192, 420.9], [1195, 418.5],
    [1199.5, 418.1], [1204.3, 417.8], [1206, 416.4], [1207.8, 417.7], [1213, 418.2], [1219, 418.4],
    [1225, 418.2], [1230.5, 417.9], [1234, 416.5], [1235.8, 417.8], [1240.5, 418.4], [1245, 418.8],
    [1248.3, 419.4], [1250, 421],
  ];
  let fujiPts = null;
  function fujiOutline() {
    if (fujiPts) return fujiPts;
    const pts = [];
    const N = 70;
    for (let i = N; i >= 1; i--) {
      const u = i / N;
      const wob = Math.sin(u * 9.0) * 1.2 * u;
      pts.push([1140 - 440 * u + wob, 421 + 400 * prof(u)]);
    }
    for (const p of SUMMIT) pts.push(p);
    for (let i = 1; i <= N; i++) {
      const u = i / N;
      const wob = Math.sin(u * 7.3 + 1.1) * 1.3 * u;
      pts.push([1250 + 450 * u + wob, 421 + 400 * prof(u)]);
    }
    fujiPts = pts;
    return pts;
  }
  let fujiP2D = null;
  /** The mountain, closed just under the horizon (never below the field's top). */
  E.fujiPath = () => {
    if (fujiP2D) return fujiP2D;
    const p = new Path2D();
    const pts = fujiOutline();
    p.moveTo(pts[0][0], 836);
    for (const q of pts) p.lineTo(q[0], q[1]);
    p.lineTo(pts[pts.length - 1][0], 836);
    p.closePath();
    fujiP2D = p;
    return p;
  };

  /* ------------------------------------------------------------------ */
  /* small carving tools                                                 */
  /* ------------------------------------------------------------------ */
  function taperTo(path, pts, w0, w1, belly) {
    const n = pts.length;
    if (n < 2) return path;
    belly = belly || 0;
    const L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[i > 0 ? i - 1 : 0], b = pts[i < n - 1 ? i + 1 : n - 1];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const s = i / (n - 1);
      const w = (w0 + (w1 - w0) * s + belly * Math.sin(s * Math.PI) * Math.max(w0, w1)) / 2;
      L.push(pts[i][0] - dy * w, pts[i][1] + dx * w);
      R.push(pts[i][0] + dy * w, pts[i][1] - dx * w);
    }
    path.moveTo(L[0], L[1]);
    for (let i = 2; i < L.length; i += 2) path.lineTo(L[i], L[i + 1]);
    for (let i = R.length - 2; i >= 0; i -= 2) path.lineTo(R[i], R[i + 1]);
    path.closePath();
    return path;
  }
  E.taperTo = taperTo;
  /** A carved line with a width function of arc-length fraction s (0..1). */
  function strokeVar(path, pts, wf) {
    const n = pts.length;
    if (n < 2) return path;
    const acc = [0];
    for (let i = 1; i < n; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tot = acc[n - 1] || 1;
    const L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[i > 0 ? i - 1 : 0], b = pts[i < n - 1 ? i + 1 : n - 1];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const w = wf(acc[i] / tot) / 2;
      L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
      R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    path.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) path.lineTo(L[i][0], L[i][1]);
    for (let i = n - 1; i >= 0; i--) path.lineTo(R[i][0], R[i][1]);
    path.closePath();
    return path;
  }
  const qpts = (x0, y0, cx, cy, x1, y1, n) => {
    const out = [];
    for (let i = 0; i <= n; i++) out.push(U.qbez([x0, y0], [cx, cy], [x1, y1], i / n));
    return out;
  };
  const polyPath = (pts, close = true) => {
    const p = new Path2D();
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    if (close) p.closePath();
    return p;
  };

  /** goma-zuri: pigment skips (paper specks) and, optionally, a few darker grains. */
  function gomazuri(c, x, y, w, h, density, seed, dark) {
    const r = U.rng(seed);
    const n = Math.round((w * h) / density);
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = 'rgba(0,0,0,0.6)';
    for (let i = 0; i < n; i++) {
      const s = U.lerp(0.5, 1.4, r());
      c.fillRect(x + r() * w, y + r() * h, s, s * U.lerp(0.6, 1.2, r()));
    }
    c.restore();
    if (dark) {
      c.save();
      c.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < n * 0.2; i++) {
        c.fillStyle = U.rgba(dark, U.lerp(0.06, 0.18, r()));
        const s = U.lerp(0.5, 1.3, r());
        c.fillRect(x + r() * w, y + r() * h, s, s);
      }
      c.restore();
    }
  }

  /** 木目: the grain of a worn cherry block, faintly lifting through a flat colour. */
  function woodGrain(c, x0, y0, w, h, seed, darkInk, darkK) {
    const r = U.rng(seed);
    c.save();
    c.lineCap = 'round';
    const knots = [[x0 + w * 0.63, y0 + h * 0.3], [x0 + w * 0.18, y0 + h * 0.72]];
    const rows = Math.round(h / 16);
    for (let i = 0; i < rows; i++) {
      const y = y0 + (i + r()) * (h / rows);
      const lighter = r() < 0.62;
      c.globalCompositeOperation = lighter ? 'destination-out' : 'source-atop';
      const a = U.lerp(0.025, 0.07, Math.pow(r(), 1.5));
      c.strokeStyle = lighter ? `rgba(0,0,0,${a})` : U.rgba(darkInk, a * darkK);
      c.lineWidth = U.lerp(1.2, 4.5, r());
      const span = w * U.lerp(0.25, 0.8, r()), xs = x0 + (w - span) * r();
      const ph = r() * 50, fq = U.lerp(0.0012, 0.003, r());
      c.beginPath();
      for (let x = xs; x <= xs + span; x += 20) {
        let yy = y + Math.sin(x * fq + ph) * 5 + U.wobble(x * 0.004 + i * 0.7, seed) * 4;
        for (const [kx, ky] of knots) {
          const d = Math.hypot((x - kx) / 1.8, y - ky);
          yy += 18 * Math.exp(-d * d / 9000) * Math.sign(y - ky);
        }
        if (x === xs) c.moveTo(x, yy); else c.lineTo(x, yy);
      }
      c.stroke();
    }
    c.restore();
  }

  /* ------------------------------------------------------------------ */
  /* susuki: one generator for carved (static) and live (swaying) clumps */
  /* ------------------------------------------------------------------ */
  function makeClump(x, y, h, seed, o = {}) {
    const r = U.rng(seed);
    const nb = o.blades == null ? 7 : o.blades;
    const np = o.plumes == null ? 3 : o.plumes;
    const lean = o.lean || 0, wk = o.wk || 1, droopDir = o.droop == null ? 1 : o.droop;
    const blades = [], plumes = [];
    for (let i = 0; i < nb; i++) {
      blades.push({
        dx: U.lerp(-0.03, 0.03, r()) * h,
        ang: lean * 0.5 + U.lerp(-0.55, 0.6, r()),
        len: h * U.lerp(0.55, 0.95, r()),
        bend: U.lerp(0.5, 1.25, r()) * (r() < (o.same == null ? 0.7 : o.same) ? droopDir : -droopDir),
        w: U.lerp(2.4, 4.2, r()) * wk * U.clamp(h / 130, 0.4, 1.8),
        key: r() < (o.keyFrac == null ? 0.5 : o.keyFrac),
        lt: r() < 0.28,
      });
    }
    for (let i = 0; i < np; i++) {
      const nh = o.hairs || Math.round(U.clamp(h / 5, 8, 36));
      const hairs = [];
      for (let k = 0; k < nh; k++) {
        hairs.push({ s: U.lerp(0.6, 1, k / Math.max(1, nh - 1)) + U.lerp(-0.02, 0.02, r()), l: U.lerp(0.075, 0.15, r()), a: U.lerp(-0.34, 0.3, r()), c: U.lerp(0.25, 0.7, r()) });
      }
      plumes.push({
        dx: U.lerp(-0.02, 0.02, r()) * h,
        ang: lean + U.lerp(-0.2, 0.2, r()),
        len: h * U.lerp(0.86, 1.06, r()),
        curve: U.lerp(-0.1, 0.06, r()),
        droop: U.lerp(0.55, 1.0, r()) * droopDir,
        nod: U.lerp(0.25, 0.7, r()),
        ph: r() * TAU,
        hairs,
      });
    }
    return { x, y, h, seed, blades, plumes, sw: U.clamp(h / 220, 0.35, 1.6) };
  }

  /** Paths of a clump (at rest); adds to `out`. parts: 'blades' | 'plumes' | both. */
  function clumpPaths(cl, sway, out, tipK, parts) {
    const { x, y, h } = cl;
    const px = U.clamp(h / 150, 0.35, 1.9);
    if (parts !== 'plumes') cl.blades.forEach((b, i) => {
      const sw = sway ? sway(i * 0.9) * 0.45 : 0;
      const a0 = b.ang + sw * 0.5, a1 = b.ang + b.bend + sw;
      const bx = x + b.dx, by = y;
      const cx = bx + Math.sin(a0) * b.len * 0.6, cy = by - Math.cos(a0) * b.len * 0.6;
      const ex = cx + Math.sin(a1) * b.len * 0.55, ey = cy - Math.cos(a1) * b.len * 0.55;
      const pts = qpts(bx, by, cx, cy, ex, ey, cl.lod ? 8 : 12);
      taperTo(b.lt ? out.bladeLt : out.blade, pts, b.w, 0.3, 0.18);
      if (b.key && out.key) taperTo(out.key, pts.slice(1, cl.lod ? 7 : 11), 0.85 * px, 0.25, 0);
    });
    if (parts !== 'blades') cl.plumes.forEach((p, i) => {
      const sw = sway ? sway(i * 1.7 + 5 + p.ph) : 0;
      const ang = p.ang + sw * 0.9;
      const sg = Math.sign(p.droop || 1);
      const nod = p.nod * sg + sw * 0.6;                     // the head's weight bends the stem
      const bx = x + p.dx, by = y;
      const cX = bx + Math.sin(ang + p.curve) * p.len * 0.62, cY = by - Math.cos(ang + p.curve) * p.len * 0.62;
      const tx = cX + Math.sin(ang + nod) * p.len * 0.42, ty = cY - Math.cos(ang + nod) * p.len * 0.42;
      const stem = qpts(bx, by, cX, cY, tx, ty, cl.lod ? 10 : 16);
      taperTo(out.stem, stem, 1.8 * px, 0.7 * px, 0);
      if (out.key) taperTo(out.key, stem.slice(0, cl.lod ? 7 : 11), 0.6 * px, 0.35 * px, 0);
      const droop = Math.abs(p.droop) + sw * sg * 1.2;
      const at = (s) => { const u = 1 - s; return [u * u * bx + 2 * u * s * cX + s * s * tx, u * u * by + 2 * u * s * cY + s * s * ty]; };
      // heading of the stem at s (analytic derivative of the quadratic)
      const dirAt = (s) => Math.atan2((1 - s) * (cX - bx) + s * (tx - cX), -((1 - s) * (cY - by) + s * (ty - cY)));
      // the plume's soft body: silk hanging from the upper stem
      const body = [];
      const nb = cl.lod ? 6 : 10;
      for (let j = 0; j <= nb; j++) {
        const s = U.lerp(0.58, 1, j / nb);
        const q = at(s);
        const da = dirAt(s) + sg * droop * U.lerp(0.9, 1.5, j / nb);
        const off = h * 0.045 * (1 - (j / nb) * 0.45);
        body.push([q[0] + Math.sin(da) * off, q[1] - Math.cos(da) * off]);
      }
      taperTo(out.body, body, h * 0.032, h * 0.01, 0.55);
      for (const hr of p.hairs) {
        const s = U.clamp(hr.s, 0, 1);
        const q = at(s);
        const u = (s - 0.6) / 0.4;
        const hl = h * hr.l * (1.25 - u * 0.6);
        const d0 = dirAt(s);
        const a0 = d0 + sg * (U.lerp(0.35, 0.8, hr.c) + hr.a * 0.5);       // leaves the stem
        const a1 = d0 + sg * (droop * U.lerp(1.3, 2.1, hr.c) + hr.a);       // and hangs
        const mx = q[0] + Math.sin(a0) * hl * 0.55, my = q[1] - Math.cos(a0) * hl * 0.55;
        const ex = mx + Math.sin(a1) * hl * 0.5, ey = my - Math.cos(a1) * hl * 0.5;
        const hp = qpts(q[0], q[1], mx, my, ex, ey, cl.lod ? 4 : 6);
        taperTo(out.plume, hp, 1.7 * px, 0.15, 0.4);
        if (tipK && out.tip) taperTo(out.tip, hp, 1.3 * px, 0.15, 0.35);
      }
    });
  }
  const newPaths = () => ({ blade: new Path2D(), bladeLt: new Path2D(), stem: new Path2D(), plume: new Path2D(), body: new Path2D(), key: new Path2D(), tip: new Path2D() });

  /** A far plume head: a small drooping comma of hairs on a short stem. */
  function farPlume(out, x, y, h, lean, r) {
    const tx = x + Math.sin(lean) * h, ty = y - Math.cos(lean) * h;
    taperTo(out.stem, [[x, y], [x + Math.sin(lean) * h * 0.5, y - Math.cos(lean) * h * 0.52], [tx, ty]], 1.1, 0.5, 0);
    const n = 4 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const s = U.lerp(0.55, 1, k / (n - 1));
      const px = x + (tx - x) * s, py = y + (ty - y) * s;
      const hl = h * U.lerp(0.35, 0.5, r()) * (1.1 - s * 0.5);
      const ha = lean + U.lerp(0.9, 1.9, r());
      const ex = px + Math.sin(ha) * hl, ey = py - Math.cos(ha) * hl;
      taperTo(out.plume, qpts(px, py, px + Math.sin(ha - 0.5) * hl * 0.5, py - Math.cos(ha - 0.5) * hl * 0.5, ex, ey, 4), 1.7, 0.2, 0.3);
      if (out.tip) taperTo(out.tip, qpts(px, py, px + Math.sin(ha - 0.5) * hl * 0.5, py - Math.cos(ha - 0.5) * hl * 0.5, ex, ey, 4), 1.2, 0.2, 0.3);
    }
  }

  /** The top of the susuki field (the horizon line of the land). */
  const fieldTop = (x) => {
    let y = 844 - U.fbm2(x * 0.018, 1.3, 3, 21) * 12;
    if (x > 190 && x < 430) y = Math.max(y, 830);
    return y;
  };

  /* ------------------------------------------------------------------ */
  /* the carving (runs once, during loading)                             */
  /* ------------------------------------------------------------------ */
  /**
   * Plate D is the one FRESH block of the late impression: its 後摺 variant
   * must be the same clean cut, never the auto-worn speckle. twin() carves
   * into both at once (every call and property forwarded to the second).
   */
  function twin(a, b) {
    return new Proxy(a, {
      get(t, k) {
        const v = t[k];
        if (typeof v === 'function') return (...args) => { b[k](...args); return v.apply(t, args); };
        return v;
      },
      set(t, k, v) { t[k] = v; b[k] = v; return true; },
    });
  }
  let Dplate = null;                                   // set per build: layer → twin context

  /**
   * The pre-dawn 桔梗 band: a thin stripe of the old sky block (P6 at 0.55 →
   * α ≈ 0.25) lying just above the 東雲 — carved in the dawn layer so it rides
   * the pink as it rises. Soft both sides, strongest at the left, gone by the
   * mountain.
   */
  function kikyoBand(c) {
    const cv = B.canvas(1920, 1080);
    const k = cv.getContext('2d');
    const g = k.createLinearGradient(0, 452, 0, 548);
    g.addColorStop(0, U.rgba(INK.kikyo, 0));
    g.addColorStop(0.3, U.rgba(INK.kikyo, 0.36));
    g.addColorStop(0.5, U.rgba(INK.kikyo, 0.46));
    g.addColorStop(0.72, U.rgba(INK.kikyo, 0.3));
    g.addColorStop(1, U.rgba(INK.kikyo, 0));
    k.fillStyle = g;
    k.fillRect(0, 452, 1300, 96);
    k.globalCompositeOperation = 'destination-in';
    const h = k.createLinearGradient(0, 0, 1300, 0);
    h.addColorStop(0, 'rgba(0,0,0,1)');
    h.addColorStop(0.45, 'rgba(0,0,0,0.85)');
    h.addColorStop(0.78, 'rgba(0,0,0,0.3)');
    h.addColorStop(1, 'rgba(0,0,0,0)');
    k.fillStyle = h;
    k.fillRect(0, 452, 1300, 96);
    c.drawImage(cv, 0, 0, 1920, 1080);
  }

  /** The sky block reaches down just under the field's edge — never deeper. */
  function skyShape() {
    const pts = [[-2, -2], [1922, -2]];
    for (let x = 1922; x >= -2; x -= 8) pts.push([x, fieldTop(U.clamp(x, 0, 1920)) + 4]);
    return polyPath(pts);
  }

  function carveSky(P) {
    const shape = skyShape();
    // ---- 初摺 variant (never seen in the film: the shot is born late) ----
    const s = P('sky', 'P6');
    const g = s.createLinearGradient(0, 0, 0, 850);
    g.addColorStop(0, U.rgba(C.bero, 0.95));
    g.addColorStop(0.45, U.rgba(C.bero, 0.55));
    g.addColorStop(1, U.rgba(C.bero, 0.12));
    s.fillStyle = g;
    s.fill(shape);
    kikyoBand(s);
    // ---- 後摺: flat pale 藍, no bokashi, the grain of the worn block ----
    const w = P('sky', 'P6~worn');
    w.fillStyle = U.rgba(INK.sky, SKY_A);
    w.fill(shape);
    woodGrain(w, 0, 0, 1920, 850, 71, C.kon, 0.4);
    gomazuri(w, 0, 0, 1920, 850, 2600, 72, null);
  }

  function carveDawn(P) {
    // plate D: the fresh 東雲 from the left horizon, in 鴇 — the ink of the
    // faded heko-obi. ONE continuous bokashi field, wiped on the block the
    // way a printer does it: nothing at y ≈ 480, deepening down the sky to
    // α 0.8 and held firm for the last 60 px to the horizon (the land's edge
    // and the far hills cut it clean); full over the left third of the
    // sheet, thinning toward the mountain (x 0–900).
    const d = Dplate('dawn');
    const x1 = 1200;
    const ink = U.mix(C.toki, C.gofun, 0.12);             // a fresh, clean 鴇: body enough to sit on the old blue
    const cv = B.canvas(1920, 1080);
    const c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 480, 0, 848);
    const prof = [[0, 0], [0.136, 0.04], [0.272, 0.13], [0.408, 0.29], [0.543, 0.47], [0.652, 0.61], [0.76, 0.73], [0.842, 0.8], [1, 0.84]];
    for (const [f, a] of prof) g.addColorStop(f, U.rgba(ink, a));
    c.fillStyle = g;
    c.fillRect(0, 480, x1, 368);
    // the wiping cloth leaves the gradation faintly uneven: a few long,
    // barely lighter strokes across the field
    const r = U.rng(83);
    c.save();
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 9; i++) {
      const y = U.lerp(560, 800, r()), hh = U.lerp(5, 14, r());
      const lg = c.createLinearGradient(0, y - hh, 0, y + hh);
      const a = U.lerp(0.03, 0.07, r());
      lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(0.5, `rgba(0,0,0,${a})`); lg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = lg;
      c.fillRect(U.lerp(-100, 300, r()), y - hh, U.lerp(500, 1000, r()), hh * 2);
    }
    c.restore();
    c.globalCompositeOperation = 'destination-in';
    const h = c.createLinearGradient(0, 0, x1, 0);
    h.addColorStop(0, 'rgba(0,0,0,1)');
    h.addColorStop(0.42, 'rgba(0,0,0,1)');
    h.addColorStop(0.62, 'rgba(0,0,0,0.78)');
    h.addColorStop(0.8, 'rgba(0,0,0,0.36)');
    h.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = h;
    c.fillRect(0, 470, x1, 400);
    d.drawImage(cv, 0, 0, 1920, 1080);
    gomazuri(d, 0, 560, x1, 290, 1400, 81, null);
    // the thin 桔梗 band above it, from the old sky block
    const k6 = P('dawn', 'P6'), k6w = P('dawn', 'P6~worn');
    kikyoBand(k6);
    kikyoBand(k6w);
    gomazuri(k6w, 0, 452, 1300, 96, 900, 84, null);
  }

  /* ---- Fuji's snow: tongues along the fall lines (radiating from APEX) --- */
  // xm = where the tongue's axis crosses y 470 · w = width at the shoulders ·
  // tip y · y of its left shoulder (the scallop floor) · scallop depth to the next
  const TONGUES = [
    // xm, w, tip y, trough y, scallop depth, shape (0 = a sharp finger, 1 = a blunt lobe)
    [1100, 22, 491, 462, 9, 1],
    [1116, 10, 531, 468, 6, 0],
    [1128, 7, 584, 470, 11, 0],   // long: the left ravine
    [1142, 28, 498, 460, 5, 1],
    [1157, 9, 517, 466, 8, 0],
    [1168, 6, 489, 468, 4, 0],
    // the gully on the axis (x 1180) is carved on its own
    [1195, 24, 494, 461, 10, 1],
    [1209, 9, 525, 466, 6, 0],
    [1221, 6, 568, 470, 9, 0],    // long
    [1237, 30, 500, 459, 12, 1],
    [1254, 8, 539, 466, 6, 0],
    [1268, 7, 590, 471, 8, 0],    // long: the right ravine
    [1284, 20, 497, 463, 7, 1],
    [1298, 10, 512, 468, 9, 0],
  ];
  // side streaks: thin ribs of snow down the ridges, joined to the body
  const STREAKS = [[1103, 458, 556, 4.6], [1152, 456, 540, 4], [1244, 456, 548, 4.4], [1290, 460, 574, 5]];
  const fallDir = (xm, ym = 470) => {
    const dx = xm - E.APEX[0], dy = ym - E.APEX[1];
    const l = Math.hypot(dx, dy);
    return [dx / l, dy / l];
  };
  const alongFall = (d, y) => {                       // point on a fall line (dir d) at height y
    const r = (y - E.APEX[1]) / d[1];
    return [E.APEX[0] + d[0] * r, y];
  };
  let snowCache = null;
  function snowGeom() {
    if (snowCache) return snowCache;
    const r = U.rng(4242);
    const tongues = TONGUES.map(([xm, w, tipY, trY, sc, lobe]) => {
      const d = fallDir(xm);
      const nl = [-d[1], d[0]];                        // toward the tongue's left
      const c0 = alongFall(d, trY);
      const Ls = [c0[0] + nl[0] * w / 2, c0[1] + nl[1] * w / 2];
      const Rs = [c0[0] - nl[0] * w / 2, c0[1] - nl[1] * w / 2 + U.lerp(-2, 2, r())];
      const tip = alongFall(d, tipY);
      tip[0] += U.lerp(-1.2, 1.2, r());
      return { d, nl, Ls, Rs, tip, w, sc, lobe, long: tipY > 540 };
    });
    snowCache = tongues;
    return tongues;
  }
  function snowPath() {
    const T = snowGeom();
    const p = new Path2D();
    p.moveTo(1030, 380);
    p.lineTo(1030, 466);
    let prev = [1060, 466];
    p.lineTo(prev[0], prev[1]);
    for (let i = 0; i < T.length; i++) {
      const t = T[i];
      // scallop: a concave arc up toward the summit between two tongues
      const mx = (prev[0] + t.Ls[0]) / 2, my = (prev[1] + t.Ls[1]) / 2;
      const ax = E.APEX[0] - mx, ay = E.APEX[1] - my, al = Math.hypot(ax, ay);
      const dep = i > 0 ? T[i - 1].sc : 7;
      p.quadraticCurveTo(mx + (ax / al) * dep, my + (ay / al) * dep, t.Ls[0], t.Ls[1]);
      // the tongue: a finger with slightly concave flanks to a point, or a blunt lobe
      const k = t.lobe ? -0.34 : t.long ? 0.06 : 0.16;
      const f = t.lobe ? 0.78 : 0.55;
      const q1 = [U.lerp(t.Ls[0], t.tip[0], f) - t.nl[0] * t.w * k, U.lerp(t.Ls[1], t.tip[1], f) - t.nl[1] * t.w * k];
      const q2 = [U.lerp(t.Rs[0], t.tip[0], f) + t.nl[0] * t.w * k, U.lerp(t.Rs[1], t.tip[1], f) + t.nl[1] * t.w * k];
      p.quadraticCurveTo(q1[0], q1[1], t.tip[0], t.tip[1]);
      p.quadraticCurveTo(q2[0], q2[1], t.Rs[0], t.Rs[1]);
      prev = t.Rs;
    }
    const mx = (prev[0] + 1330) / 2, my = (prev[1] + 468) / 2;
    p.quadraticCurveTo(mx, my - 6, 1330, 468);
    p.lineTo(1360, 468);
    p.lineTo(1360, 380);
    p.closePath();
    return p;
  }
  /** The gully on the axis (x 1174–1186, y 425–640): it carries the incense line across the cut. */
  function gullyPath() {
    const gl = [], gr = [];
    for (let i = 0; i <= 40; i++) {
      const s = i / 40, y = U.lerp(425, 640, s);
      const hw = U.lerp(6.1, 0.5, Math.pow(s, 0.78)) + Math.sin(s * 23) * 0.4 * (1 - s);
      const cx = E.AXIS + Math.sin(s * 5.5) * 0.45 * s;
      gl.push([cx - hw, y]);
      gr.unshift([cx + hw, y]);
    }
    return polyPath(gl.concat(gr));
  }
  function streakPaths() {
    const p = new Path2D();
    for (const [xm, y0, y1, w] of STREAKS) {
      const d = fallDir(xm);
      const pts = [];
      for (let i = 0; i <= 14; i++) pts.push(alongFall(d, U.lerp(y0, y1, i / 14)));
      strokeVar(p, pts, (s) => U.lerp(w, 0.5, Math.pow(s, 0.8)));
    }
    return p;
  }

  /** The key block's contour of the mountain, with optional carved wear. */
  function fujiContour(worn) {
    const pts = fujiOutline();
    const iS = pts.findIndex((p) => p[0] >= 1140 && p[1] < 430);
    const iE = pts.length - 1 - [...pts].reverse().findIndex((p) => p[0] <= 1250 && p[1] < 430);
    // the contour stops where the block is wiped away at the foot (FOOT), tapering out
    const left = pts.slice(0, iS + 1).filter((p) => p[1] <= 752).reverse();   // shoulder → foot
    const top = pts.slice(iS, iE + 1);
    const right = pts.slice(iE).filter((p) => p[1] <= 752);                    // shoulder → foot
    const path = new Path2D();
    // worn: irregular breaks (arc-length fractions, gap in px) — more on the right flank
    const gapsL = worn ? [[0.23, 5], [0.58, 11], [0.86, 4]] : [];
    const gapsR = worn ? [[0.12, 3], [0.37, 14], [0.52, 6], [0.71, 9], [0.9, 12]] : [];
    const thinL = worn ? [0.4, 0.74] : [], thinR = worn ? [0.27, 0.63] : [];
    const flank = (list0, gaps, thins, seed) => {
      const list = resample(list0, 2);
      let acc = 0;
      const lens = [0];
      for (let i = 1; i < list.length; i++) { acc += Math.hypot(list[i][0] - list[i - 1][0], list[i][1] - list[i - 1][1]); lens.push(acc); }
      const tot = acc;
      const wf = (s) => {
        let w = U.lerp(2.7, 1.1, Math.pow(s, 0.8)) * (1 + 0.12 * U.wobble(s * 9, seed)) * (1 - 0.75 * U.smoothstep(0.82, 1, s));
        for (const th of thins) w *= 1 - 0.42 * Math.exp(-Math.pow((s - th) / 0.025, 2));
        return w;
      };
      // split into runs between the gaps
      let run = [];
      for (let i = 0; i < list.length; i++) {
        const s = lens[i] / tot;
        const inGap = gaps.some(([g, px]) => Math.abs(s * tot - g * tot) < px / 2);
        if (inGap) {
          if (run.length > 1) strokeVar(path, run.map((q) => q.p), (u) => wf(U.lerp(run[0].s, run[run.length - 1].s, u)));
          run = [];
        } else run.push({ p: list[i], s });
      }
      if (run.length > 1) strokeVar(path, run.map((q) => q.p), (u) => wf(U.lerp(run[0].s, run[run.length - 1].s, u)));
    };
    flank(left, gapsL, thinL, 3);
    flank(right, gapsR, thinR, 5);
    strokeVar(path, top, (s) => (worn ? 2.2 - 0.9 * Math.exp(-Math.pow((s - 0.78) / 0.06, 2)) : 2.3));
    return path;
  }
  /** Resample a polyline to ≈ step px spacing. */
  function resample(pts, step) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
      for (let j = 1; j <= n; j++) out.push([U.lerp(a[0], b[0], j / n), U.lerp(a[1], b[1], j / n)]);
    }
    return out;
  }
  /** A few short carved ticks at the long snow fingers (they read in the key-only stage). */
  function snowTicks() {
    const p = new Path2D();
    for (const t of snowGeom()) {
      if (!t.long) continue;
      const a = [U.lerp(t.Ls[0], t.tip[0], 0.72), U.lerp(t.Ls[1], t.tip[1], 0.72)];
      taperTo(p, qpts(a[0], a[1], U.lerp(a[0], t.tip[0], 0.5) - t.nl[0] * 0.6, U.lerp(a[1], t.tip[1], 0.5), t.tip[0], t.tip[1], 6), 0.9, 0.15, 0);
    }
    // and the gully's lower end
    taperTo(p, [[E.AXIS - 2.2, 596], [E.AXIS - 1.2, 618], [E.AXIS - 0.3, 638]], 0.8, 0.15, 0);
    return p;
  }

  /**
   * The mountain's foot is never printed down to the ground: the block is
   * wiped from y ≈ 690, so the ベロ藍 pales (toward 月白, half-way by 760)
   * and gives out into the air by 816 — the massif floats on its kasumi, as
   * Hokusai's never stands on the field. (Applied to a plate already inked.)
   */
  const FOOT = { y0: 690, y1: 760, y2: 816 };
  function footBokashi(c, ink) {
    c.save();
    c.globalCompositeOperation = 'source-atop';
    const pale = c.createLinearGradient(0, FOOT.y0, 0, FOOT.y2);
    pale.addColorStop(0, U.rgba(C.geppaku, 0));
    pale.addColorStop((FOOT.y1 - FOOT.y0) / (FOOT.y2 - FOOT.y0), U.rgba(C.geppaku, 0.5));
    pale.addColorStop(1, U.rgba(C.geppaku, 0.62));
    c.fillStyle = pale;
    c.fillRect(600, FOOT.y0, 1200, 160);
    c.globalCompositeOperation = 'destination-out';
    const gone = c.createLinearGradient(0, FOOT.y1 - 30, 0, FOOT.y2);
    gone.addColorStop(0, 'rgba(0,0,0,0)');
    gone.addColorStop(0.45, 'rgba(0,0,0,0.35)');
    gone.addColorStop(0.8, 'rgba(0,0,0,0.82)');
    gone.addColorStop(1, 'rgba(0,0,0,1)');
    c.fillStyle = gone;
    c.fillRect(600, FOOT.y1 - 30, 1200, 400);
    c.restore();
  }

  function carveFuji(P) {
    const path = E.fujiPath();
    // ---- far hills on the left horizon, 藍鼠 against the dawn (no outline).
    // Their ink is indigo, so they are cut on the 藍 block (P5) and lift with
    // the other blues (223.5–225) — never a blue strip left behind under the
    // bare sky. Like the sky block, this block is wider than the sheet (E.draw
    // prints it without the 後摺's sideways drift, so no dry strip opens at
    // the left edge); its upward drift (−3) is carved out here, and its foot
    // runs a few px under the field's edge (hidden there until the field
    // lifts, after the hills have gone), so neither the drift nor the lift's
    // rise opens a seam at the horizon.
    const g4 = P('fuji', 'P5');
    g4.save();
    g4.translate(0, 3);
    g4.fillStyle = INK.hills;
    // both close along (under) the field's own edge, and sink into the field at their ends
    const under = (x0, x1) => { const u = []; for (let x = x1; x >= x0; x -= 8) u.push([x, fieldTop(x) + 8]); return u; };
    const hill = [];
    for (let x = -10; x <= 880; x += 6) {
      const n = U.fbm2(x * 0.006, 3.7, 4, 12);
      const bump = 20 * Math.exp(-Math.pow((x - 96) / 64, 2)) + 11 * Math.exp(-Math.pow((x - 560) / 80, 2));
      hill.push([x, Math.min(fieldTop(x) + 3, 810 - (n - 0.4) * 24 - bump + Math.max(0, x - 660) * 0.16 + Math.pow(Math.max(0, x - 780) / 40, 2) * 4)]);
    }
    g4.fill(polyPath(hill.concat(under(-10, 880))));
    g4.fillStyle = INK.hills2;
    const hill2 = [];
    for (let x = -10; x <= 760; x += 6) {
      const n = U.fbm2(x * 0.009, 8.1, 3, 13);
      hill2.push([x, Math.min(fieldTop(x) + 3, 824 - (n - 0.4) * 12 + Math.pow(Math.max(0, x - 680) / 30, 2) * 3)]);
    }
    hill2.push(...under(-10, 760));
    g4.fill(polyPath(hill2));
    g4.restore();
    // ---- ベロ藍 massif (P6: printed flat; the moon is clipped to the sky, so
    // nothing needs to hide behind the mountain)
    const g6 = P('fuji', 'P6');
    g6.fillStyle = C.bero;
    g6.fill(path);
    const w6 = P('fuji', 'P6~worn');
    w6.fillStyle = INK.fuji;
    w6.fill(path);
    w6.save();
    w6.clip(path);
    woodGrain(w6, 680, 400, 1040, 440, 64, C.kon, 1.2);
    w6.restore();
    gomazuri(w6, 690, 410, 1020, 430, 1500, 65, C.kon);
    footBokashi(g6, C.bero);
    footBokashi(w6, INK.fuji);
    // ---- snow (P7 胡粉): the cap, tongues along the fall lines, the gully, ribs
    const g7 = P('fuji', 'P7');
    g7.save();
    g7.clip(path);
    g7.fillStyle = INK.snow;
    g7.fill(snowPath());
    g7.fill(gullyPath());
    g7.fill(streakPaths());
    g7.restore();
    // ---- 紅富士: the sunward snow takes the dawn (plate D, the fresh block)
    const gd = Dplate('fuji');
    gd.save();
    gd.clip(path);
    const snowAll = new Path2D();
    snowAll.addPath(snowPath());
    snowAll.addPath(gullyPath());
    snowAll.addPath(streakPaths());
    gd.clip(snowAll);
    const bl = gd.createLinearGradient(1070, 0, 1290, 0);
    bl.addColorStop(0, U.rgba(INK.toki, 0.55));
    bl.addColorStop(0.45, U.rgba(INK.toki, 0.3));
    bl.addColorStop(1, U.rgba(INK.toki, 0));
    gd.fillStyle = bl;
    gd.fillRect(1040, 400, 320, 250);
    gd.restore();
    // and faintly the upper sunward flank
    gd.save();
    gd.clip(path);
    const fl = gd.createLinearGradient(700, 0, 1180, 0);
    fl.addColorStop(0, U.rgba(INK.toki, 0.16));
    fl.addColorStop(1, U.rgba(INK.toki, 0));
    gd.fillStyle = fl;
    gd.fillRect(700, 420, 480, 420);
    gd.restore();
    gd.save();
    gd.globalCompositeOperation = 'destination-out';
    const df = gd.createLinearGradient(0, FOOT.y0, 0, FOOT.y2);
    df.addColorStop(0, 'rgba(0,0,0,0)');
    df.addColorStop(1, 'rgba(0,0,0,1)');
    gd.fillStyle = df;
    gd.fillRect(600, FOOT.y0, 1200, 400);
    gd.restore();
    // ---- key block: the contour (carved, tapering); its 後摺 variant has its
    // own irregular breaks and thin places instead of the uniform auto-wear
    const k = P('fuji', 'K');
    k.fillStyle = U.rgba(C.sumi, 0.9);
    k.fill(fujiContour(false));
    k.fillStyle = U.rgba(C.sumi, 0.34);
    k.fill(snowTicks());
    const kw = P('fuji', 'K~worn');
    kw.fillStyle = U.rgba(C.sumi, 0.88);
    kw.fill(fujiContour(true));
    kw.fillStyle = U.rgba(C.sumi, 0.3);
    kw.fill(snowTicks());
  }

  /** The tiny thatched house (x 200–420, base y 830) with 小夜 on its engawa. */
  function carveHouse(P) {
    const p1 = P('land', 'P1'), k = P('land', 'K'), p4 = P('land', 'P4'), p7 = P('land', 'P7'), d = Dplate('land');
    const x0 = 196, x1 = 424;
    const eaveY = 782, ridgeY = 726;
    const roof = [[x0, eaveY], [x0 + 6, eaveY - 8], [262, ridgeY + 6], [270, ridgeY], [350, ridgeY], [358, ridgeY + 6], [x1 - 6, eaveY - 8], [x1, eaveY]];
    p1.fillStyle = INK.plaster;
    p1.fillRect(208, 786, 40, 36);
    p1.fillStyle = INK.wood;
    for (const px of [206, 248, 290, 332, 374, 414]) p1.fillRect(px, 784, 3, 40);
    p1.fillRect(204, 784, 214, 3);
    // three shoji closed and lit by the dawn; the first slid open on the dark room
    p7.fillStyle = INK.shoji;
    for (const sx of [293, 335, 377]) p7.fillRect(sx, 788, 37, 33);
    p4.fillStyle = U.mix(C.sumi, INK.shadow, 0.3);
    p4.fillRect(251, 788, 39, 33);
    const sg = p4.createLinearGradient(0, 782, 0, 800);
    sg.addColorStop(0, U.rgba(INK.shadow, 0.75));
    sg.addColorStop(1, U.rgba(INK.shadow, 0));
    p4.fillStyle = sg;
    p4.fillRect(204, 782, 214, 18);
    k.save();
    k.strokeStyle = U.rgba(C.sumi, 0.34);
    k.lineWidth = 0.6;
    for (const sx of [293, 335, 377]) {
      for (let i = 1; i < 3; i++) { k.beginPath(); k.moveTo(sx + (37 * i) / 3, 788); k.lineTo(sx + (37 * i) / 3, 821); k.stroke(); }
      for (let j = 1; j < 4; j++) { k.beginPath(); k.moveTo(sx, 788 + (33 * j) / 4); k.lineTo(sx + 37, 788 + (33 * j) / 4); k.stroke(); }
    }
    k.restore();
    p1.fillStyle = INK.wood;
    p1.fillRect(198, 822, 226, 5);
    p4.fillStyle = U.mix(C.nezumi, C.ginnezu, 0.4);
    for (let sx = 204; sx < 420; sx += 24) p4.fillRect(sx, 827, 10, 4);
    k.fillStyle = U.rgba(C.sumi, 0.85);
    k.fillRect(198, 821, 226, 1.4);
    k.fillRect(198, 826.4, 226, 1);
    const rp = polyPath(roof);
    p1.fillStyle = INK.thatch;
    p1.fill(rp);
    p1.fillStyle = INK.thatchDk;
    p1.beginPath();
    p1.moveTo(x0, eaveY); p1.lineTo(x1, eaveY); p1.lineTo(x1 - 3, eaveY + 4); p1.lineTo(x0 + 3, eaveY + 4); p1.closePath();
    p1.fill();
    d.save();
    d.clip(rp);
    const dg = d.createLinearGradient(x0, 0, 330, 0);
    dg.addColorStop(0, U.rgba(INK.toki, 0.55));
    dg.addColorStop(1, U.rgba(INK.toki, 0));
    d.fillStyle = dg;
    d.fillRect(x0, ridgeY, 140, eaveY - ridgeY);
    d.restore();
    k.save();
    k.clip(rp);
    const r = U.rng(505);
    k.strokeStyle = U.rgba(C.sumi, 0.38);
    k.lineCap = 'round';
    for (let i = 0; i < 150; i++) {
      const u = r();
      const y = U.lerp(ridgeY + 4, eaveY - 2, Math.pow(r(), 0.8));
      const f = (y - ridgeY) / (eaveY - ridgeY);
      const xl = U.lerp(266, x0 + 2, f), xr = U.lerp(354, x1 - 2, f);
      const x = U.lerp(xl, xr, u);
      const lean = (x - 310) / 110 * 0.5;
      const len = U.lerp(4, 9, r());
      k.lineWidth = U.lerp(0.5, 0.9, r());
      k.beginPath();
      k.moveTo(x, y);
      k.lineTo(x + lean * len, y + len);
      k.stroke();
    }
    k.restore();
    const out = new Path2D();
    taperTo(out, [[x0, eaveY], [x0 + 6, eaveY - 8], [262, ridgeY + 6], [270, ridgeY]], 1.8, 1.3, 0);
    taperTo(out, [[350, ridgeY], [358, ridgeY + 6], [x1 - 6, eaveY - 8], [x1, eaveY]], 1.3, 1.8, 0);
    taperTo(out, [[x0 - 1, eaveY + 0.5], [x1 + 1, eaveY + 0.5]], 1.4, 1.4, 0);
    k.fillStyle = U.rgba(C.sumi, 0.9);
    k.fill(out);
    k.fillStyle = U.rgba(C.sumi, 0.88);
    k.beginPath();
    k.moveTo(264, ridgeY + 1); k.lineTo(270, ridgeY - 5); k.lineTo(350, ridgeY - 5); k.lineTo(356, ridgeY + 1); k.closePath();
    k.fill();
    k.lineWidth = 1.1;
    k.strokeStyle = U.rgba(C.sumi, 0.85);
    for (let i = 0; i < 6; i++) {
      const cx = 278 + i * 13;
      k.beginPath();
      k.moveTo(cx - 3, ridgeY - 10); k.lineTo(cx + 3, ridgeY - 3);
      k.moveTo(cx + 3, ridgeY - 10); k.lineTo(cx - 3, ridgeY - 3);
      k.stroke();
    }
    k.fillStyle = U.rgba(C.sumi, 0.7);
    for (const px of [206, 248, 290, 332, 374, 414]) k.fillRect(px + 0.5, 784, 1.1, 38);
    carveFigure(P);
  }

  /**
   * 小夜 at 66, seated on the engawa's edge in たけ's haori, facing the
   * mountain, head a little raised (≈22 px). Her colours print from P5 (the
   * 藍 haori: they lift with the blues) and only her carbon outline stays on
   * the key block to the end. The 後摺 drifts P5 by (+5,−3); a figure this
   * small is registered by hand, so her fill is carved (−4,+2) to sit within
   * a pixel of her outline.
   */
  const FIG_S = 0.2;
  function carveFigure(P) {
    const CAST = TSUKI.CAST;
    const [fx, fy] = E.FIGURE;
    const opts = { pose: 'engawa', facing: 1, t: 0, wind: 0, look: -0.12 };
    const p5 = P('land', 'P5'), p7 = P('land', 'P7'), k = P('land', 'K');
    let ok = !!(CAST && CAST.oldSayo);
    // her silhouette, at 5× (it is only ≈22 px tall)
    const q = 5, box = [fx - 30, fy - 40, 60, 56];
    const sil = B.canvas(box[2] * q, box[3] * q), sc = sil.getContext('2d');
    sc.setTransform(q, 0, 0, q, -box[0] * q, -box[1] * q);
    if (ok) {
      try { CAST.oldSayo(sc, fx, fy, FIG_S, Object.assign({}, opts, { silhouette: '#000' })); } catch (e) { ok = false; }
    }
    if (!ok) { sc.clearRect(box[0], box[1], box[2], box[3]); figureStandIn(sc, fx, fy, '#000'); }
    // she sits in front of the lit shoji: cut her out of the paper and its lattice
    for (const c of [p7, k]) {
      c.save();
      c.globalCompositeOperation = 'destination-out';
      c.drawImage(sil, box[0], box[1], box[2], box[3]);
      c.drawImage(sil, box[0] + 1, box[1] - 1, box[2], box[3]);
      c.restore();
    }
    // her colours (P5), carved (−4,+2) against the block's drift
    p5.save();
    p5.translate(-4, 2);
    if (ok) CAST.oldSayo(p5, fx, fy, FIG_S, Object.assign({}, opts, { outline: 0.5 }));
    else figureStandIn(p5, fx, fy, U.mix(C.ai, C.sumi, 0.2));
    p5.restore();
    // the key block keeps only her outline: silhouette minus its erosion
    const ring = B.canvas(sil.width, sil.height), rc = ring.getContext('2d');
    rc.drawImage(sil, 0, 0);
    const e = B.canvas(sil.width, sil.height), ec = e.getContext('2d');
    ec.drawImage(sil, 0, 0);
    ec.globalCompositeOperation = 'destination-in';
    const o = 0.95 * q;
    for (const [dx, dy] of [[o, 0], [-o, 0], [0, o], [0, -o]]) ec.drawImage(sil, dx, dy);
    rc.globalCompositeOperation = 'destination-out';
    rc.drawImage(e, 0, 0);
    rc.globalCompositeOperation = 'source-in';
    rc.fillStyle = U.rgba(C.sumi, 0.82);
    rc.fillRect(0, 0, ring.width, ring.height);
    k.drawImage(ring, box[0], box[1], box[2], box[3]);
  }
  function figureStandIn(k, x, y, col) {
    // a seated back-and-profile silhouette: haori mound, bun, dangling legs
    k.save();
    k.fillStyle = col;
    k.beginPath();
    k.moveTo(x - 6, y); k.quadraticCurveTo(x - 7, y - 12, x - 2, y - 17); k.quadraticCurveTo(x + 3, y - 18, x + 5, y - 12);
    k.lineTo(x + 7, y - 4); k.lineTo(x + 7, y); k.closePath();
    k.fill();
    k.fillRect(x + 3, y - 1, 2.4, 8);
    k.beginPath(); k.arc(x + 1.5, y - 20, 2.8, 0, TAU); k.fill();
    k.restore();
  }

  /** One mid-field unit: a stem with a hanging head and a blade or two. */
  function unit(out, x, y, h, lean, r, lit) {
    const cl = makeClump(x, y, h, Math.floor(r() * 1e6), { blades: r() < 0.6 ? 2 : 1, plumes: 1, lean, hairs: Math.round(U.clamp(h / 3.2, 7, 16)), keyFrac: 0.35, wk: 0.8, same: 0.92 });
    clumpPaths(cl, null, out, lit);
  }
  let fieldClumps = null;
  function fieldLayout() {
    if (fieldClumps) return fieldClumps;
    const r = U.rng(9090);
    const list = [];
    // a few fuller clumps, grouped (never an even lawn)
    const groups = [[110, 200, 4, 872, 904], [640, 240, 4, 900, 940], [985, 150, 4, 878, 900], [1250, 180, 3, 900, 940], [1520, 260, 5, 884, 920], [1860, 160, 3, 872, 900]];
    for (const [cx, w, n, y0, y1] of groups) {
      for (let i = 0; i < n; i++) {
        const x = cx + U.lerp(-w / 2, w / 2, (i + r()) / n);
        const y = U.lerp(y0, y1, r());
        const h = U.lerp(64, 104, r()) * U.lerp(0.9, 1.15, (y - 860) / 80);
        list.push(makeClump(x, y, h, 4000 + list.length, { blades: 4 + Math.floor(r() * 3), plumes: r() < 0.6 ? 2 : 3, lean: U.lerp(0.12, 0.4, r()), wk: 0.9 }));
      }
    }
    // long foreground blades rising from the bottom edge, at the sides only (subtitle band calm)
    for (let i = 0; i < 12; i++) {
      const left = i % 2 === 0;
      const x = left ? U.lerp(-20, 480, r()) : U.lerp(1420, 1940, r());
      list.push(makeClump(x, U.lerp(1086, 1110, r()), U.lerp(120, 190, r()), 5000 + i, { blades: 4, plumes: 0, lean: U.lerp(0.05, 0.3, r()), wk: 1.3, keyFrac: 0.6 }));
    }
    list.sort((a, b) => a.y - b.y);
    fieldClumps = list;
    return list;
  }

  function carveField(P) {
    const p3 = P('land', 'P3'), p4 = P('land', 'P4'), k = P('land', 'K'), d = Dplate('land');
    const r = U.rng(777);
    // ---- the ground: straw-grey at the far edge, deepening toward the viewer
    const top = [];
    for (let x = -10; x <= 1930; x += 8) top.push([x, fieldTop(x)]);
    const gp = polyPath([[-10, 1090]].concat(top, [[1930, 1090]]));
    const gg = p3.createLinearGradient(0, 826, 0, 1080);
    gg.addColorStop(0, INK.groundTop);
    gg.addColorStop(0.22, U.mix(INK.groundTop, INK.groundMid, 0.55));
    gg.addColorStop(0.55, INK.groundMid);
    gg.addColorStop(1, INK.groundBot);
    p3.fillStyle = gg;
    p3.fill(gp);
    // the shade under the far heads, and the rows of grass bowing in the field
    p3.save();
    p3.clip(gp);
    const sh = p3.createLinearGradient(0, 836, 0, 880);
    sh.addColorStop(0, U.rgba(INK.groundBot, 0));
    sh.addColorStop(0.45, U.rgba(INK.groundBot, 0.28));
    sh.addColorStop(1, U.rgba(INK.groundBot, 0));
    p3.fillStyle = sh;
    p3.fillRect(-10, 836, 1940, 44);
    const sweep = new Path2D();
    for (let i = 0; i < 46; i++) {
      const y = U.lerp(870, 1070, Math.pow(r(), 0.9));
      const x = U.lerp(-60, 1880, r()), len = U.lerp(90, 300, r()) * U.lerp(0.6, 1.4, (y - 870) / 200);
      const pts = qpts(x, y, x + len * 0.5, y - U.lerp(3, 10, r()), x + len, y + U.lerp(-2, 3, r()), 12);
      taperTo(sweep, pts, 0.4, U.lerp(1.6, 3.6, r()), 0.4);
    }
    p3.fillStyle = U.rgba(INK.groundBot, 0.3);
    p3.fill(sweep);
    p3.restore();
    // ---- blades: fine dark strokes through the whole field, fewer toward the bottom centre
    const bl = new Path2D(), kb = new Path2D();
    for (let i = 0; i < 520; i++) {
      const x = r() * 1960 - 20;
      const y0 = U.lerp(fieldTop(x) + 6, 1100, Math.pow(r(), 1.25));
      const depth = U.clamp((y0 - 840) / 240);
      if (depth > 0.5 && Math.abs(x - 960) < 420 && r() < 0.75) continue;   // keep the subtitle band calm
      const len = U.lerp(14, 40, r()) * U.lerp(0.6, 2.6, depth);
      const a = U.lerp(-0.2, 0.5, r());
      const bend = U.lerp(0.25, 1.0, r());
      const cx = x + Math.sin(a) * len * 0.6, cy = y0 - Math.cos(a) * len * 0.6;
      const ex = cx + Math.sin(a + bend) * len * 0.5, ey = cy - Math.cos(a + bend) * len * 0.5;
      const pts = qpts(x, y0, cx, cy, ex, ey, 8);
      taperTo(bl, pts, U.lerp(1.2, 2.8, r()) * U.lerp(0.7, 1.4, depth), 0.25, 0.1);
      if (r() < 0.35) taperTo(kb, pts, 0.7, 0.2, 0);
    }
    p3.fillStyle = U.rgba(INK.blade, 0.5);
    p3.fill(bl);
    k.fillStyle = U.rgba(C.sumi, 0.24);
    k.fill(kb);
    // ---- heads: the far fringe, then drifts of nodding plumes across the field
    const fr = newPaths(), frT = newPaths();
    for (let i = 0; i < 460; i++) {
      const x = U.lerp(-10, 1930, (i + r()) / 460);
      if (x > 200 && x < 424 && r() < 0.8) continue;
      const yTop = fieldTop(x);
      const y = yTop + U.lerp(2, 16, Math.pow(r(), 1.3));
      const h = U.lerp(11, 20, r()) * U.lerp(1, 1.4, (y - yTop) / 16);
      farPlume(x < 900 ? frT : fr, x, y, h, U.lerp(0.1, 0.55, r()), r);
    }
    const mid = newPaths(), midT = newPaths();
    for (let i = 0; i < 900; i++) {
      const x = r() * 1980 - 30;
      const yTop = fieldTop(x);
      const depth = Math.pow(r(), 1.5);                     // more heads far away
      const y = U.lerp(yTop + 14, 1040, depth);
      const drift = U.fbm2(x * 0.004, y * 0.01, 3, 29);
      if (drift < 0.5 + depth * 0.2) continue;
      if (x > 190 && x < 432 && y < 850) continue;
      if (depth > 0.45 && Math.abs(x - 960) < 460 && r() < 0.8) continue; // subtitle band
      const h = U.lerp(16, 30, r()) * U.lerp(1, 3.4, depth);
      const lit = x < 900;
      unit(lit ? midT : mid, x, y, h, U.lerp(0.2, 0.42, r()), r, lit);
    }
    for (const o of [fr, frT, mid, midT]) {
      p3.fillStyle = INK.blade; p3.fill(o.blade);
      p3.fillStyle = INK.bladeLt; p3.fill(o.bladeLt);
      p3.fillStyle = INK.stem; p3.fill(o.stem);
      p4.fillStyle = U.rgba(INK.plume, 0.4); p4.fill(o.body);
      p4.fillStyle = U.rgba(INK.plume, 0.95); p4.fill(o.plume);
      k.fillStyle = U.rgba(C.sumi, 0.3); k.fill(o.key);
    }
    // the dawn catches the heads on the sunward side (plate D)
    d.save();
    const dg = d.createLinearGradient(0, 0, 960, 0);
    dg.addColorStop(0, U.rgba(INK.toki, 0.72));
    dg.addColorStop(0.5, U.rgba(INK.toki, 0.38));
    dg.addColorStop(1, U.rgba(INK.toki, 0));
    d.fillStyle = dg;
    d.fill(frT.tip);
    d.fill(midT.tip);
    d.restore();
    // ---- fuller clumps and the few long foreground blades
    for (const cl of fieldLayout()) {
      const o = newPaths();
      const lit = cl.x < 900 && cl.plumes.length;
      clumpPaths(cl, null, o, lit);
      p3.fillStyle = INK.blade; p3.fill(o.blade);
      p3.fillStyle = INK.bladeLt; p3.fill(o.bladeLt);
      p3.fillStyle = INK.stem; p3.fill(o.stem);
      p4.fillStyle = U.rgba(INK.plume, 0.42); p4.fill(o.body);
      p4.fillStyle = U.rgba(INK.plume, 0.95); p4.fill(o.plume);
      k.fillStyle = U.rgba(C.sumi, 0.4); k.fill(o.key);
      if (lit) { d.fillStyle = U.rgba(INK.toki, 0.55 * U.clamp(1 - cl.x / 900, 0, 1)); d.fill(o.tip); }
    }
  }

  /* ------------------------------------------------------------------ */
  /* live parts carved once: kasumi, near susuki, the aged sheet          */
  /* ------------------------------------------------------------------ */
  /**
   * A carved 霞 (すやり霞) as the printers cut it: one flat impression of 胡粉
   * with a HARD carved top edge (it wavers by ≈1–2 px) and a one-sided
   * bokashi below — full to half its depth, wiped away beneath. Its ends are
   * cut, never feathered: the top edge turns down in a quarter-ellipse into a
   * rounded point (lenL / lenR px long — a long trailing end and a blunt one),
   * so the band's outline is crisp all round and only its underside is soft.
   * Drawn into c at (x, y) = the left end of the top edge.
   */
  function carveMist(c, x, y, w, h, seed, lenL, lenR, grain) {
    const ph = U.rng(seed)() * 10;
    const x1 = x + w;
    const dipAt = (d, L) => (d >= L ? 0 : 1 - Math.sqrt(1 - Math.pow(1 - d / L, 2)));
    const topY = (px) => {
      const und = 1.1 * Math.sin((px - x) / 190 + ph) + 0.8 * U.wobble((px - x) / 70, seed);
      return y + und + h * 0.9 * Math.max(dipAt(px - x, lenL), dipAt(x1 - px, lenR));
    };
    const shape = new Path2D();
    shape.moveTo(x, y + h + 2);
    const n = Math.max(24, Math.round(w / 6));
    for (let i = 0; i <= n; i++) {
      // denser samples in the ends, where the edge turns
      const u = i / n, px = x + w * (u < 0.5 ? 0.5 * Math.pow(2 * u, 1.35) : 1 - 0.5 * Math.pow(2 - 2 * u, 1.35));
      shape.lineTo(px, topY(px));
    }
    shape.lineTo(x1, y + h + 2);
    shape.closePath();
    const g = c.createLinearGradient(0, y - 3, 0, y + h);
    g.addColorStop(0, U.rgba(C.gofun, 1));
    g.addColorStop(0.5, U.rgba(C.gofun, 1));
    g.addColorStop(0.64, U.rgba(C.gofun, 0.72));
    g.addColorStop(0.8, U.rgba(C.gofun, 0.34));
    g.addColorStop(0.92, U.rgba(C.gofun, 0.1));
    g.addColorStop(1, U.rgba(C.gofun, 0));
    c.fillStyle = g;
    c.fill(shape);
    if (grain) gomazuri(c, x - 4, y - 4, w + 8, h + 8, grain, seed + 3, null);
  }

  // x (left end), y (carved top edge), w, h, drift factor, alpha, seed, left end length, right end length.
  // The mountain is ≈ x 957–1437 at y 646, 928–1467 at 674, 811–1587 at 764, 781–1617 at 782:
  // each band overhangs a flank by a few tens of px at most (it lies IN FRONT of the
  // mountain, it is not a stripe across the sky), and the ends of a pair stagger.
  const KASUMI = [
    [1040, 646, 414, 36, 1.0, 0.5, 11, 120, 46],    // across the right flank, just under the gully's end
    [898, 672, 290, 28, 1.0, 0.46, 12, 40, 110],    // lower and left, overlapping it: the ends stagger
    [580, 760, 620, 46, 1.25, 0.6, 13, 70, 150],    // the left foot, nearest the sunrise (takes the dawn)
    [1110, 778, 570, 40, 1.25, 0.56, 14, 160, 60],  // the right foot: the massif floats on these two
  ];
  let kSprites = null;
  function buildKasumi(q) {
    kSprites = KASUMI.map(([x, y, w, h, , , seed, eL, eR]) => {
      const pad = 24, cw = Math.ceil(w + pad * 2), ch = Math.ceil(h + pad * 2);
      const cv = B.canvas(cw * q, ch * q);
      const c = cv.getContext('2d');
      c.setTransform(q, 0, 0, q, (pad - x) * q, (pad - y) * q);
      carveMist(c, x, y, w, h, seed, eL, eR, 300);
      // the same band in 鴇 for plate D: the mist nearest the sunrise takes the dawn
      const tv = B.canvas(cv.width, cv.height);
      const t = tv.getContext('2d');
      t.drawImage(cv, 0, 0);
      t.globalCompositeOperation = 'source-in';
      t.fillStyle = C.toki;
      t.fillRect(0, 0, tv.width, tv.height);
      t.globalCompositeOperation = 'destination-in';
      const fg = t.createLinearGradient(0, 0, tv.width, 0);
      const at = (sx) => U.clamp((sx - x + pad) / cw);           // screen x → sprite fraction
      fg.addColorStop(0, 'rgba(0,0,0,0.85)');
      fg.addColorStop(U.clamp(at(560), 0.01, 0.98), 'rgba(0,0,0,0.55)');
      fg.addColorStop(U.clamp(at(1000), 0.02, 0.99), 'rgba(0,0,0,0)');
      fg.addColorStop(1, 'rgba(0,0,0,0)');
      t.fillStyle = fg;
      t.fillRect(0, 0, tv.width, tv.height);
      return { cv, tv, pad, cw, ch };
    });
  }

  // near live susuki: tall clumps framing the edges, and grass about the fox —
  // carved once per plate into sprites, swayed each frame by a shear about the base
  let nearClumps = null;
  function nearLayout() {
    if (nearClumps) return nearClumps;
    nearClumps = [
      makeClump(36, 1096, 410, 7101, { blades: 7, plumes: 3, lean: 0.2, wk: 1.5, hairs: 19 }),
      makeClump(122, 1104, 340, 7102, { blades: 6, plumes: 2, lean: 0.34, wk: 1.4, hairs: 17 }),
      makeClump(1846, 1098, 450, 7103, { blades: 8, plumes: 3, lean: -0.1, wk: 1.6, hairs: 19 }),
      makeClump(1748, 1106, 320, 7104, { blades: 6, plumes: 2, lean: 0.06, wk: 1.35, hairs: 17 }),
      makeClump(918, 936, 74, 7105, { blades: 5, plumes: 2, lean: -0.18, droop: -1, wk: 0.9 }),
      makeClump(1040, 944, 66, 7106, { blades: 4, plumes: 2, lean: 0.34, wk: 0.9 }),
      makeClump(972, 918, 30, 7109, { blades: 4, plumes: 0, lean: 0.1, wk: 0.7, keyFrac: 0.8 }),
      makeClump(996, 922, 26, 7110, { blades: 3, plumes: 0, lean: 0.3, wk: 0.7, keyFrac: 0.8 }),
    ];
    return nearClumps;
  }
  let nearSprites = null;
  function buildNear(q) {
    const plates = {
      P3: [['blade', INK.bladeNear, 1], ['bladeLt', INK.bladeLt, 1], ['stem', INK.stem, 1]],
      P4: [['body', INK.plume, 0.4], ['plume', INK.plume, 0.97]],
      D: [['tip', INK.toki, 0.42]],
      K: [['key', C.sumi, 0.55]],
    };
    nearSprites = [];
    for (const cl of nearLayout()) {
      for (const part of ['blades', 'plumes']) {
        if (part === 'plumes' && !cl.plumes.length) continue;
        const o = newPaths();
        clumpPaths(cl, null, o, cl.x < 900, part);
        // generous box about the base (the clump leans and droops either way)
        const bx = cl.x - cl.h * 1.1, by = cl.y - cl.h * 1.15, bw = cl.h * 2.2, bh = cl.h * 1.15 + 8;
        const x0 = Math.max(-40, bx), x1 = Math.min(1960, bx + bw), y1 = Math.min(1090, by + bh);
        const spr = { cl, part, x: x0, y: by, w: x1 - x0, h: y1 - by, ph: part === 'plumes' ? 2.1 : 0, plates: {} };
        for (const pid of Object.keys(plates)) {
          if (pid === 'D' && !(cl.x < 900)) continue;
          const cv = B.canvas(spr.w * q, spr.h * q);
          const c = cv.getContext('2d');
          c.setTransform(q, 0, 0, q, -spr.x * q, -spr.y * q);
          for (const [key, col, a] of plates[pid]) {
            c.fillStyle = U.rgba(col, a);
            c.fill(o[key]);
          }
          const t = trimSprite(cv, spr, q);
          if (t) spr.plates[pid] = t;
        }
        // the four impressions of this clump composited once, in plate order:
        // printed in one blit while every plate lies in register at full ink
        // (all of the shot before the unprinting)
        const ts = Object.values(spr.plates);
        if (ts.length) {
          const mx0 = Math.min(...ts.map((t) => t.x)), my0 = Math.min(...ts.map((t) => t.y));
          const mx1 = Math.max(...ts.map((t) => t.x + t.w)), my1 = Math.max(...ts.map((t) => t.y + t.h));
          const mv = B.canvas(Math.round((mx1 - mx0) * q), Math.round((my1 - my0) * q));
          const mc = mv.getContext('2d');
          for (const pid of Object.keys(plates)) {
            const t = spr.plates[pid];
            if (t) mc.drawImage(t.cv, Math.round((t.x - mx0) * q), Math.round((t.y - my0) * q));
          }
          spr.merged = { cv: mv, x: mx0, y: my0, w: mv.width / q, h: mv.height / q };
        }
        nearSprites.push(spr);
      }
    }
  }

  /** Trim a sprite canvas to its ink (build time only). → {cv, x, y, w, h} in logical px */
  function trimSprite(cv, box, q) {
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
    for (let y = 0; y < cv.height; y += 2) for (let x = 0; x < cv.width; x += 2) {
      if (d[(y * cv.width + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return null;
    x0 = Math.max(0, x0 - 3); y0 = Math.max(0, y0 - 3);
    x1 = Math.min(cv.width, x1 + 4); y1 = Math.min(cv.height, y1 + 4);
    const out = B.canvas(x1 - x0, y1 - y0);
    out.getContext('2d').drawImage(cv, -x0, -y0);
    return { cv: out, x: box.x + x0 / q, y: box.y + y0 / q, w: (x1 - x0) / q, h: (y1 - y0) / q };
  }

  let agedSheet = null;
  function buildAged(q) {
    agedSheet = B.canvas(W * q, H * q);
    const c = agedSheet.getContext('2d');
    c.setTransform(q, 0, 0, q, 0, 0);
    c.fillStyle = C.kinari;
    c.fillRect(0, 0, W, H);
    PRINT.age(c, 300, { amount: 1 });
  }

  PRINT.defineShot('E', {
    layers: ['sky', 'dawn', 'fuji', 'land'],
    worn: true,
    build(P, q) {
      const twins = {};
      Dplate = (layer) => twins[layer] || (twins[layer] = twin(P(layer, 'D'), P(layer, 'D~worn')));
      try {
        carveSky(P);
        carveDawn(P);
        carveFuji(P);
        carveHouse(P);
        carveField(P);
      } finally {
        // Dplate closes over P, and P over every raw (untrimmed, full-frame)
        // plate canvas of this build: let them go once the carving is done
        Dplate = null;
      }
      buildKasumi(q);
      buildNear(q);
      buildAged(q);
    },
  });
  const ensure = () => PRINT.shot('E');               // (re)carves after a change of resolution

  /* ------------------------------------------------------------------ */
  /* live parts                                                          */
  /* ------------------------------------------------------------------ */
  E.moon = (T) => {
    const m = MOON.E(T);
    return { x: m.x, y: m.y, r: m.r, hidden: m.hidden, visible: !m.hidden };
  };

  /**
   * y of the smoke thread's tip. From the 206 match-cut it barely creeps
   * (0.6 px/s) while the moon comes down; at 212.6 — as the koto's fourth
   * note waits — it gathers itself and REACHES (a surge peaking ≈10 px/s)
   * to touch her lower rim exactly at 214.0, arriving at the creep it keeps
   * after (a C¹ Hermite: no kink at either end). Then it keeps creeping
   * (≈2–2.4 px/s) while the moon, falling 16 px/s, slides down onto it
   * (烟中月) — the tip rests inside her face; once she has gone behind the
   * summit (222.6) it rises on, easing up to ≈8 px/s, into an empty sky.
   */
  const REACH = { t0: 212.6, t1: 214, v0: 0.6, v1: 1.75 };
  E.smokeTip = (T) => {
    if (T <= 206) return 392;
    if (T <= REACH.t0) return 392 - REACH.v0 * (T - 206);
    if (T <= REACH.t1) {
      // climb c(s) above 392: c0 at t0 (slope v0) → 14 at t1 (slope v1)
      const D = REACH.t1 - REACH.t0, s = (T - REACH.t0) / D;
      const c0 = REACH.v0 * (REACH.t0 - 206), c1 = 14;
      const s2 = s * s, s3 = s2 * s;
      const c = (2 * s3 - 3 * s2 + 1) * c0 + (s3 - 2 * s2 + s) * D * REACH.v0 + (-2 * s3 + 3 * s2) * c1 + (s3 - s2) * D * REACH.v1;
      return 392 - c;
    }
    if (T <= 222.6) { const s = T - 214; return 378 - 1.75 * s - 0.04 * s * s; }
    const v0 = 1.75 + 0.08 * 8.6, y0 = 378 - 1.75 * 8.6 - 0.04 * 8.6 * 8.6;
    const s = T - 222.6, dv = 8 - v0, tau = 1.6;
    return y0 - v0 * s - dv * (s - tau * (1 - Math.exp(-s / tau)));
  };

  /** Length of the feathered tip (px): short while it creeps to the rim, soft once it is inside her. */
  const smokeFade = (T) => U.lerp(4, 30, U.smoothstep(214.05, 215.8, T)) + 8 * U.smoothstep(222.6, 225, T);

  /**
   * The thread's centre-line x at height y. It leaves the crater upright, on
   * the gully's axis (the 206 match-cut), then bends in a slow S — a wave
   * that rolls up the thread at about the speed the smoke climbs (≈ 3 px/s),
   * so even the short thread of the climax (≈ 47 px) is a living line of a
   * few px either way, never a rod — and the dawn air carries it, higher up,
   * a little downwind (+x, the way the kasumi drift and the susuki lean).
   */
  const smokeX = (y, T) => {
    const h = Math.max(0, E.CRATER[1] - y);
    const env = 1 - Math.exp(-(h * h) / 180);          // vertical out of the crater
    const amp = env * (2.5 + 0.03 * h);
    const wave = 0.82 * Math.sin(h / 10.5 - T * 0.29 + 1.9) + 0.18 * U.wobble(h / 36 - T * 0.12, 17);
    return E.AXIS + amp * wave + 0.0008 * h * h;
  };
  E.smokeX = smokeX;

  /** The rim's 胡粉 line at the contact: runs 0.8 s, holds, gone by 215.3 (her rim is still ≥ 19 px above the plateau). */
  const KIRA = {
    run: 0.8, hold: 214.75, end: 215.3,
    // mica points along the rim: [turns from the contact point, arm (±1), size px, radial offset px]
    points: [[0.035, 1, 1.9, 0.2], [0.075, -1, 1.5, -0.4], [0.16, 1, 1.4, 0.5], [0.215, -1, 2.1, 0], [0.3, 1, 1.6, -0.3], [0.37, -1, 1.4, 0.4], [0.455, 1, 1.8, 0.1]],
  };

  let skyClip = null;
  /** Everything but the mountain (fill with 'evenodd'). */
  const skyPath = () => {
    if (!skyClip) {
      skyClip = new Path2D();
      skyClip.rect(-20, -20, W + 40, H + 40);
      skyClip.addPath(E.fujiPath());
    }
    return skyClip;
  };
  /**
   * The moon. part: undefined → all of her; 'under' → halo + disc (printed in
   * her place under the mountain); 'over' → only the mica flash of 214.0,
   * which never meets the mountain (her rim is ≥ 20 px above the plateau
   * until 215.3), so it can be laid on last, sharp, over a scaled print.
   */
  E.drawMoon = (ctx, T, part) => {
    const m = E.moon(T);
    if (!m.visible) return;
    const u = U.clamp((T - 206) / 16.6);
    if (part !== 'over') {
      // the hole is the disc ∩ the sky: the mountain prints over her
      ctx.save();
      ctx.clip(skyPath(), 'evenodd');
      // the setting moon pales toward 銀鼠, but stays the lightest thing in the
      // sky: a 月白 glaze with only a breath of 銀鼠 in it, and her 月暈
      MOON.draw(ctx, m.x, m.y, m.r, T, {
        fringe: false,
        halo: 0.6,                                         // the dawn moon's 月暈 (the one glow allowed)
        haloR: m.r * 1.8,
        glaze: { color: U.mix(C.geppaku, C.ginnezu, U.lerp(0, 0.08, u)), alpha: U.lerp(0.5, 0.56, u) },
        maria: U.lerp(0.2, 0.15, u),                       // continues ariake (0.22 → 0.2 by the 206 cut)
      });
      ctx.restore();
    }
    // 214.0 — the smoke touches the lower rim. A thin line of 胡粉 runs round
    // her cut edge from the point of contact, both ways, and closes at the
    // top (0.8 s); the few hard mica points it passes catch the light once.
    // A printed rim, lit — no bloom, no flare.
    if (T >= 214 && T < KIRA.end && part !== 'under') {
      // where the thread's hairline tip met her rim (fixed on the disc: the light starts there)
      const m0 = E.moon(214), tx = smokeX(E.smokeTip(214), 214);
      const a0 = Math.atan2(Math.sqrt(Math.max(0, m0.r * m0.r - (tx - m0.x) * (tx - m0.x))), tx - m0.x);
      PRINT.with(ctx, 'P8', T, (c) => {
        const p = U.clamp((T - 214) / KIRA.run);
        const e = U.ease.outSine(p) * 0.5;                   // how far each arm has run (turns)
        const fade = 1 - U.smoothstep(KIRA.hold, KIRA.end, T);
        c.save();
        // the line itself: 2 px, straddling the cut edge, crisp; the arms'
        // heads are the freshest ink (a touch denser over their last 20°)
        c.lineCap = 'butt';
        c.lineWidth = 2;
        const R = m.r + 0.35;
        const arcs = (x0, x1) => {
          c.beginPath();
          if (x1 - x0 >= 0.998) c.arc(m.x, m.y, R, 0, TAU);
          else if (x1 > x0) {
            c.arc(m.x, m.y, R, a0 + x0 * TAU, a0 + x1 * TAU);
            c.moveTo(m.x + Math.cos(a0 - x0 * TAU) * R, m.y + Math.sin(a0 - x0 * TAU) * R);
            c.arc(m.x, m.y, R, a0 - x0 * TAU, a0 - x1 * TAU, true);
          }
          c.stroke();
        };
        c.strokeStyle = U.rgba(C.gofun, 0.8 * fade);
        if (e >= 0.499) arcs(0, 1); else arcs(0, e);
        // the mica in it: the same line, catching the light (hard-edged — a
        // line of light, not a glow), brightest where the heads are
        c.globalCompositeOperation = 'lighter';
        c.lineWidth = 1.4;
        c.strokeStyle = `rgba(255,250,236,${(0.3 * fade).toFixed(3)})`;
        if (e >= 0.499) arcs(0, 1); else arcs(0, e);
        if (e < 0.499 && e > 0.015) {
          c.strokeStyle = `rgba(255,250,236,${(0.4 * fade).toFixed(3)})`;
          arcs(Math.max(0, e - 0.05), e);
        }
        // mica points: each lights as a head passes it, once, and goes out
        for (const [f, side, sz, dr] of KIRA.points) {
          if (f > e) continue;
          const at = 214 + KIRA.run * (2 / Math.PI) * Math.asin(Math.min(1, 2 * f));   // when the head passed
          const age = T - at;
          const tw = (age < 0.05 ? age / 0.05 : Math.exp(-(age - 0.05) / 0.22)) * fade;
          if (tw < 0.03) continue;
          const ang = a0 + side * f * TAU;
          const gx = m.x + Math.cos(ang) * (m.r + dr), gy = m.y + Math.sin(ang) * (m.r + dr);
          c.fillStyle = `rgba(255,251,240,${(0.95 * tw).toFixed(3)})`;
          c.beginPath();                                    // a cut diamond of mica
          c.moveTo(gx, gy - sz); c.lineTo(gx + sz * 0.62, gy); c.lineTo(gx, gy + sz); c.lineTo(gx - sz * 0.62, gy);
          c.closePath();
          c.fill();
        }
        c.restore();
      });
    }
  };

  /**
   * The emperor's poem, burned with the elixir, rising: one swell of density
   * leaves the crater at 211.6, climbs the thread faster than the smoke and
   * reaches its tip exactly as the tip touches her rim (214.0) — then opens
   * into the veil across her face and is gone by 215.4.
   * → { h: height above the crater, amp 0..1, sig: half-length (px) } | null
   */
  const SMOKE_INK = U.mix(C.nezumi, C.sumi, 0.18);    // 鼠, a breath of 墨: it must read against the pale 藍 as well as on her face
  const smokePulse = (T, len) => {
    if (T <= 211.6 || T >= 215.4) return null;
    const u = U.clamp((T - 211.6) / 2.4);
    return {
      h: len * (0.08 + 0.92 * U.ease.inOutSine(u)),
      amp: U.smoothstep(211.6, 212.3, T) * (1 - U.smoothstep(214.05, 215.4, T)),
      sig: 6 + 10 * U.smoothstep(214, 215.2, T),
    };
  };

  /**
   * The undying smoke (P4), 烟中月: a thin dense line out of the crater,
   * carried by a 薄墨 plume that widens as it climbs and leans downwind; only
   * the hairline leads the plume to her rim. Once she has come down onto it
   * the plume lies across her lower face as a pale 鼠 film. Its root is cut
   * in the key block, with a few Hokusai curls (K).
   */
  E.drawSmoke = (ctx, T) => {
    const tip = E.smokeTip(T);
    const root = E.CRATER[1];
    const len = root - tip;
    if (len <= 1) return;
    const line = (L) => {
      const n = Math.max(12, Math.round(L / 2.5));
      const out = [];
      for (let i = 0; i <= n; i++) { const y = root - (L * i) / n; out.push([smokeX(y, T), y]); }
      return out;
    };
    const pts = line(len);
    const fade = Math.min(smokeFade(T), len * 0.8);
    const ex = (h, k) => 1 - Math.exp(-h / k);
    const pu = smokePulse(T, len);
    const swell = pu ? (h) => pu.amp * Math.exp(-Math.pow((h - pu.h) / pu.sig, 2)) : () => 0;
    // the hairline leads: the plume stops short of the tip until she has
    // come down onto it, then fills in beneath her face
    const lead = U.lerp(10, 3, U.smoothstep(214, 215.4, T));
    const Lv = Math.max(1, len - lead);
    // the plume's top is a soft round billow, not a spear point
    const cap = (h, top, R) => (h <= top - R ? 1 : h >= top ? 0 : Math.sqrt(1 - Math.pow((h - (top - R)) / R, 2)));
    const tipW = (h) => U.lerp(0.28, 1, U.smoothstep(len, len - 12, h));   // the hairline draws out fine
    // the thread loosens as it arrives, and once it has touched her it
    // relaxes into the veil — a trace of the line stays
    const relax = U.lerp(1, 0.55, U.smoothstep(213.6, 216.4, T));
    // the dawn air carries the plume downwind (+x) as it climbs: its thin
    // outer veil furthest, its dense middle least — so the line runs along
    // the plume's upwind side
    const trail = (h, k) => U.lerp(0.05, 0.16, k) * h * ex(h, 20);
    const center = line(Lv);
    const veilW = (h) => (4 + 26 * ex(h, 36)) * (1 + 0.5 * swell(h));
    // the plume is a bokashi across its width as well as along it: six
    // nested impressions, each narrower, each a little more ink — dense along
    // the middle, wiped away at the edges — whose edges billow slowly (they
    // share one wiping, i.e. one gradient along the plume)
    const PLUME = [1, 0.8, 0.62, 0.45, 0.3, 0.17];
    const layerA = (A) => 1 - Math.pow(1 - A, 1 / PLUME.length);
    const passes = PLUME.map((k, i) => {
      const bil = (h) => 1 + 0.11 * Math.sin(h / 6.5 - T * 0.9 + i * 1.7) * ex(h, 14);
      const R = Math.min(9, veilW(Lv) * 0.4) * (0.55 + 0.45 * k);
      const vpts = center.map(([x, y]) => [x + trail(root - y, (k - 0.17) / 0.83), y]);
      // width(h), alpha at the root, alpha aloft, points, length, top feather (px), ink
      return [(h) => veilW(h) * k * bil(h) * cap(h, Lv, R), layerA(0.34), layerA(0.5), vpts, Lv, 12, SMOKE_INK, 'plume'];
    });
    // the core: 3.4 px out of the crater → a hairline that leads the plume to her rim
    passes.push([(h) => (3.4 - 1.9 * ex(h, 20)) * (1 + 0.3 * swell(h)) * tipW(h), 0.5, 0.34 * relax, pts, len, fade, U.mix(C.nezumi, C.sumi, 0.22)]);
    // a faint pulse of density rolling up the thread with the smoke (≈ 3 px/s), and the poem's swell
    const pulse = (h) => (1 + 0.13 * Math.sin(h / 5.2 - T * 0.58) * ex(h, 10)) * (1 + 0.7 * swell(h));
    PRINT.with(ctx, 'P4', T, (c) => {
      const grads = {};
      for (const [wf, a0, a1, ppts, L, fd, ink, gkey] of passes) {
        const p = new Path2D();
        strokeVar(p, ppts, (s) => wf(s * L));
        let g = gkey && grads[gkey];
        if (!g) {
          const f = U.clamp(1 - Math.min(fd, L * 0.8) / L, 0.02, 0.999);
          const rgb = U.hexToRgb(ink), col = (a) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a.toFixed(3)})`;
          g = c.createLinearGradient(0, root, 0, root - L);
          const at = (h) => Math.min(0.9, U.lerp(a0, a1, U.ease.inOutSine(U.clamp(h / 16))) * pulse(h));
          g.addColorStop(0, col(a0));
          for (let hh = 4; hh < f * L; hh += 4) g.addColorStop(hh / L, col(at(hh)));
          g.addColorStop(f, col(at(f * L)));
          g.addColorStop(1, col(0));
          if (gkey) grads[gkey] = g;
        }
        c.fillStyle = g;
        c.fill(p);
      }
    });
    PRINT.with(ctx, 'K', T, (c) => {
      // the key block carries only the root: a hairline out of the crater
      const rl = Math.min(14, len);
      const kp = pts.filter((q) => root - q[1] <= rl + 0.01);
      if (kp.length > 1) {
        const kg = c.createLinearGradient(0, root, 0, root - rl);
        kg.addColorStop(0, U.rgba(C.sumi, 0.34));
        kg.addColorStop(1, U.rgba(C.sumi, 0));
        const hl = new Path2D();
        taperTo(hl, kp, 1.1, 0.5, 0);
        c.fillStyle = kg;
        c.fill(hl);
      }
      // 蕨手: now and then the thread sheds a wisp that rolls over into a
      // small fiddlehead and rides up with the smoke (≈ 3 px/s). A curl is
      // cut clear of the thread's tip (the tip is the hairline that meets
      // her) and never on her face: the moon keeps only the soft veil.
      const m = E.moon(T);
      const spacing = 28, speed = 3;
      const run = speed * Math.max(0, T - 200);
      const phase = run % spacing;
      const base = Math.floor(run / spacing);
      for (let k = 0; ; k++) {
        const h = 12 + phase + k * spacing;
        if (h > len - 24) break;
        const id = k - base;                               // stays with its curl as it rises
        if (U.hash(id * 13 + 5) < 0.2) continue;           // a seeded skip: the rhythm is never even
        const side = (((id % 2) + 2) % 2) ? 1 : -1;
        const y = root - h, x = smokeX(y, T);
        const rr = U.lerp(3.4, 4.3, U.hash(id * 7 + 3)) * U.lerp(0.85, 1, U.clamp((h - 12) / 30));
        // the wisp leaves the thread, arcs out and up, and rolls over into a curl
        const ex = x + side * rr * 1.9, ey = y - rr * 1.75;
        const cx = ex, cy = ey + rr * 0.55;                // the curl's eye, under the crest
        // near her disc a curl fades out (she approaches at 16 px/s: a cut would pop)
        const dm = Math.hypot(cx - m.x, cy - m.y);
        const near = m.visible ? U.smoothstep(m.r + 3, m.r + 16, dm) : 1;
        // (and none in the top 24–34 px: the hairline that leads the plume stays clean)
        const a = near * U.smoothstep(12, 22, h) * (1 - U.smoothstep(len - 34, len - 24, h));
        if (a <= 0.02) continue;
        const pts = [];
        for (let i = 0; i <= 8; i++) {
          const f = i / 8, g = 1 - f;
          pts.push([
            g * g * g * x + 3 * g * g * f * (x + side * rr * 0.25) + 3 * g * f * f * (x + side * rr * 1.2) + f * f * f * ex,
            g * g * g * (y + 1.5) + 3 * g * g * f * (y - rr * 0.8) + 3 * g * f * f * (y - rr * 1.7) + f * f * f * ey,
          ]);
        }
        for (let i = 1; i <= 16; i++) {
          const f = i / 16;
          const th = -Math.PI / 2 + side * f * TAU * 1.05;  // over the crest, outward and down, and in
          const rad = rr * 0.55 * (1 - f * 0.62);
          pts.push([cx + Math.cos(th) * rad, cy + Math.sin(th) * rad]);
        }
        c.fillStyle = U.rgba(C.sumi, 0.36 * a);
        c.fill(taperTo(new Path2D(), pts, 1.1, 0.3, 0.1));
      }
    });
  };

  /** Kasumi bands at y ≈ 646/674 and ≈ 762/780 (flat 胡粉 α ≈ 0.55), drifting +2 px/s (P7; the dawn-side one also in D). */
  E.drawKasumi = (ctx, T) => {
    ensure();
    const S = kSprites;
    const dx = 2 * (T - 206);
    PRINT.with(ctx, 'P7', T, (c) => {
      const base = c.globalAlpha;                         // the plate's alpha (unprinting)
      KASUMI.forEach(([x, y, , , df, a], i) => {
        const s = S[i];
        c.globalAlpha = base * a;
        c.drawImage(s.cv, x + dx * df - s.pad, y - s.pad, s.cw, s.ch);
      });
    });
    const g = E.dawn(T);
    PRINT.with(ctx, 'D', T, (c) => {
      const base = c.globalAlpha * U.lerp(0.05, 1, g);
      KASUMI.forEach(([x, y, , , df, a], i) => {
        if (x > 900) return;
        const s = S[i];
        c.globalAlpha = base * a;
        c.drawImage(s.tv, x + dx * df - s.pad, y - s.pad, s.cw, s.ch);
      });
    });
  };

  /** 小夜's long dawn shadow (藍鼠, P4): revealed from her feet outward. k 0..1 */
  let shadowPath = null;
  function buildShadow() {
    const [ax, ay] = E.SHADOW.from, [bx, by] = E.SHADOW.to;
    const L = Math.hypot(bx - ax, by - ay);
    const ux = (bx - ax) / L, uy = (by - ay) / L, nx = -uy, ny = ux;
    // her seated figure drawn out 40× along the ground: a long body, the bun near the end
    const Wd = [[0, 1.4], [0.04, 2.8], [0.2, 4.2], [0.45, 5.2], [0.68, 5.6], [0.8, 4.8], [0.86, 2.6], [0.88, 2.2], [0.905, 3.9], [0.94, 4.1], [0.962, 3.0], [0.975, 3.3], [0.99, 1.8], [1, 0]];
    const half = (s) => {
      for (let i = 0; i < Wd.length - 1; i++) if (s <= Wd[i + 1][0]) return U.lerp(Wd[i][1], Wd[i + 1][1], U.ease.inOutSine((s - Wd[i][0]) / (Wd[i + 1][0] - Wd[i][0])));
      return 0;
    };
    const left = [], right = [];
    const N = 200;
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      const ragL = (U.fbm2(s * 70, 1.5, 2, 41) - 0.5) * 2.6, ragR = (U.fbm2(s * 70, 7.5, 2, 43) - 0.5) * 2.6;
      const w = half(s);
      const bend = Math.sin(s * Math.PI) * 6;
      const cx = ax + ux * L * s + nx * bend, cy = ay + uy * L * s + ny * bend;
      const kL = w > 1.5 ? 1 : 0.3;
      left.push([cx + nx * (w + ragL * kL), cy + ny * (w + ragL * kL)]);
      right.push([cx - nx * (w + ragR * kL), cy - ny * (w + ragR * kL)]);
    }
    shadowPath = polyPath(left.concat(right.reverse()));
  }
  E.drawShadow = (ctx, T, k) => {
    if (k == null) k = U.seg(T, 215, 220, U.ease.outCubic);
    if (k <= 0.001) return;
    if (!shadowPath) buildShadow();
    const [ax, ay] = E.SHADOW.from, [bx, by] = E.SHADOW.to;
    const alpha = 0.68 * U.clamp(k * 2.2);            // (multiply) ≈ α 0 → 0.55 as the wipe runs out from her feet
    // printed over the grass like a transparent ink (the plumes show through,
    // darkened), lighter as it runs out — the penumbra widens with distance
    const at = (s) => alpha * U.lerp(1, 0.5, Math.pow(U.clamp(s, 0, 1), 0.8));   // (s < 0 while the wipe starts: k < 0.08)
    PRINT.with(ctx, 'P4', T, (c) => {
      c.globalCompositeOperation = 'multiply';
      const g = c.createLinearGradient(ax, ay, bx, by);
      g.addColorStop(0, U.rgba(INK.shadow, at(0)));
      if (k < 1) {
        g.addColorStop(U.clamp(k - 0.08, 0, 0.998), U.rgba(INK.shadow, at(k - 0.08)));
        g.addColorStop(U.clamp(k, 0.001, 0.999), U.rgba(INK.shadow, 0));
        g.addColorStop(1, U.rgba(INK.shadow, 0));
      } else {
        g.addColorStop(0.5, U.rgba(INK.shadow, at(0.5)));
        g.addColorStop(1, U.rgba(INK.shadow, at(1)));
      }
      c.fillStyle = g;
      c.fill(shadowPath);
    });
  };

  /** The fox in the susuki (墨 silhouette ≈36 px). look 0..1 = head turned to the peak. */
  E.drawFox = (ctx, T, look) => {
    if (look == null) look = U.seg(T, 216.5, 217.2, U.ease.inOutSine);
    const CAST = TSUKI.CAST;
    const [x, y] = E.FOX;
    PRINT.with(ctx, 'K', T, (c) => {
      if (CAST && CAST.fox) {
        try {
          CAST.fox(c, x, y, 0.4, { pose: 'sit', facing: -1, silhouette: C.sumi, lookBack: look, t: T * 0.25, wind: 0.1, alpha: 0.94 });
          return;
        } catch (e) { /* fall through to the stand-in */ }
      }
      foxStandIn(c, x, y, look);
    });
  };
  function foxStandIn(c, x, y, look) {
    c.save();
    c.fillStyle = U.rgba(C.sumi, 0.94);
    c.beginPath();
    c.ellipse(x, y - 10, 7, 11, -0.1, 0, TAU);
    c.fill();
    const hx = x + U.lerp(-5, 5, look), hy = y - 24;
    c.beginPath();
    c.ellipse(hx, hy, 5, 4, 0, 0, TAU);
    c.moveTo(hx - 3, hy - 2); c.lineTo(hx - 2, hy - 9); c.lineTo(hx, hy - 3);
    c.moveTo(hx + 1, hy - 3); c.lineTo(hx + 3, hy - 9); c.lineTo(hx + 4, hy - 2);
    c.fill();
    c.restore();
  }

  const NEAR_PLATES = ['P3', 'P4', 'D', 'K'];
  /** Near live susuki, printed from P3 / P4 / D / K: each clump sways as a shear about its base. */
  E.drawNearSusuki = (ctx, T) => {
    ensure();
    // a steady dawn breeze; any swell is the score's own (TSUKI.CUES.gustAt), never an unheard one
    const CU = TSUKI.CUES;
    let g = 0;
    try { if (CU && CU.gustAt) g = U.clamp(CU.gustAt(T)) || 0; } catch (e) { g = 0; }
    const gust = 0.55 + 0.45 * g;
    const shear = nearSprites.map((s) => {
      const cl = s.cl, seed = cl.seed;
      const a = cl.sw * 0.05 * gust * (0.6 * Math.sin(T * 0.7 + seed * 0.37 + s.ph) + 0.4 * U.wobble(T * 0.28 + s.ph * 2.1, seed % 97));
      return Math.tan(a) * (s.part === 'plumes' ? 1.25 : 0.8);
    });
    // every clump is printed whole (its four impressions in plate order)
    // before the next: while all four plates lie in register at full ink —
    // the whole shot before the unprinting — as one pre-composited blit
    const st = PRINT.state(T);
    const inRegister = NEAR_PLATES.every((id) => st.alpha[id] === 1 && st.off[id][0] === 0 && st.off[id][1] === 0);
    if (inRegister) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      nearSprites.forEach((s, i) => {
        const t = s.merged;
        if (!t) return;
        const sh = shear[i];
        ctx.save();
        ctx.transform(1, 0, sh, 1, -sh * s.cl.y, 0);
        ctx.drawImage(t.cv, t.x, t.y, t.w, t.h);
        ctx.restore();
      });
      ctx.restore();
      return;
    }
    // lifting (the unprinting): the same order — clump by clump, each clump's
    // four impressions in plate order — each at its own plate's register and ink
    nearSprites.forEach((s, i) => {
      const sh = shear[i];
      for (const pid of NEAR_PLATES) {
        const t = s.plates[pid];
        if (!t) continue;
        PRINT.with(ctx, pid, T, (c) => {
          c.imageSmoothingEnabled = false;           // a sheared blit: nearest texels are cheap and read the same
          c.transform(1, 0, sh, 1, -sh * s.cl.y, 0);
          c.drawImage(t.cv, t.x, t.y, t.w, t.h);
        });
      }
    });
  };

  /* ------------------------------------------------------------------ */
  /* printing the shot                                                   */
  /* ------------------------------------------------------------------ */
  E.layer = (ctx, name, T, opts) => PRINT.drawLayer(ctx, 'E', name, T, opts || {});
  /** 東雲 growth: most of the pink arrives with the bells. */
  E.dawn = (T) => {
    const u = U.seg(T, 206, 220);
    return U.lerp(U.ease.inSine(u), U.ease.inOutSine(u), 0.5);
  };

  /**
   * The late impression's paper: 鳥の子 yellowing and foxing, laid under the
   * old blocks (so the moon and the fresh 東雲 stay clean). Pre-rendered once
   * and printed 1:1; lifts with the key block (226.5–228).
   */
  E.age = (ctx, T, amount) => {
    const st = PRINT.state(T);
    const a = amount == null ? st.wear * (1 - U.seg(T, 226.5, 228, U.ease.inOutSine)) : amount;
    if (a <= 0.001) return;
    ensure();
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = a;
    ctx.drawImage(agedSheet, 0, 0, W, H);
    ctx.restore();
  };

  const fujiAlpha = (T) => ({ P6: FUJI_P6, D: U.seg(T, 214.3, 218.2, U.ease.inOutSine), K: 1 - U.seg(T, 226.5, 227.4, U.ease.inOutSine) });

  /**
   * The rim's mica flash and the smoke thread, sharp, over a picture printed
   * with draw(…, { live: false }) (e.g. into a buffer the caller then
   * scales). Nothing in draw() prints over either of them where they lie
   * (the kasumi and the land are far below), so the order is draw()'s.
   */
  E.drawLive = (ctx, T) => {
    E.drawMoon(ctx, T, 'over');
    E.drawSmoke(ctx, T);
  };

  /**
   * 214.0, the touch: the sheet feels it — the colour blocks shiver one
   * step out of register and settle (≈ two frames each way, ~1 device px),
   * the CLICK's grammar whispered. The key block and the live parts hold.
   */
  const TOUCH = { P5: [1.2, -0.8], P6: [-1.1, 1.0], P7: [0.9, 1.2], D: [-1.3, -0.6], P3: [0.6, -1.1], P4: [-0.8, 0.7], P1: [1.0, 0.5] };
  const touched = (st, T) => {
    if (T < 214 || T >= 214.068) return st;
    const k = T < 214.034 ? 1 : -0.45;
    const off = Object.assign({}, st.off);
    for (const id of Object.keys(TOUCH)) {
      const o = st.off[id] || [0, 0];
      off[id] = [o[0] + TOUCH[id][0] * k, o[1] + TOUCH[id][1] * k];
    }
    return Object.assign({}, st, { off });
  };

  E.draw = (ctx, T, opts = {}) => {
    const st = touched(PRINT.state(T), T);
    const live = opts.live !== false;                // false: leave the moon and smoke to drawLive
    const g = opts.dawn == null ? E.dawn(T) : opts.dawn;
    if (opts.age !== false) E.age(ctx, T);
    // sky: flat pale 藍. Its 後摺 drift is vertical only at the frame's edge —
    // the block is wider than the sheet — so no dry strip shows at the left.
    ctx.save();
    ctx.translate(-5 * st.wear, 0);
    E.layer(ctx, 'sky', T, { state: st, alpha: { P6: SKY_P6 } });
    ctx.restore();
    // the fresh 東雲 block rises from the left horizon
    ctx.save();
    ctx.translate(0, E.HORIZON);
    ctx.scale(1, U.lerp(0.45, 1, g));
    ctx.translate(0, -E.HORIZON);
    // (the old 桔梗 band first — its block, like the sky's, is wider than the
    // sheet and drifts only upward — then the fresh 鴇 over it)
    ctx.save();
    ctx.translate(-5 * st.wear, 0);
    E.layer(ctx, 'dawn', T, { state: st, only: ['P6'], alpha: { P6: U.lerp(0.5, 1, g) } });
    ctx.restore();
    E.layer(ctx, 'dawn', T, { state: st, skip: ['P6'], alpha: { D: U.lerp(0.06, 1, g) } });
    ctx.restore();
    // the moon: a hole to the paper, cut by the mountain
    E.drawMoon(ctx, T, live ? undefined : 'under');
    // the far hills (the 藍 block: wider than the sheet, it drifts only upward)
    ctx.save();
    ctx.translate(-5 * st.wear, 0);
    E.layer(ctx, 'fuji', T, { state: st, only: ['P5'] });
    ctx.restore();
    // Fuji (its key lines lift a little early near the end, clearing the haiku), smoke, mist
    E.layer(ctx, 'fuji', T, { state: st, alpha: fujiAlpha(T), skip: ['P5'] });
    if (live) E.drawSmoke(ctx, T);
    E.drawKasumi(ctx, T);
    // land: field, house, 小夜; her shadow, the fox, the near susuki
    // (her shadow falls on the ground and the blades, under the plume heads
    // that stand up into the light)
    const landA = { D: U.lerp(0.1, 1, g) };
    E.layer(ctx, 'land', T, { state: st, alpha: landA, only: ['P1', 'P3'] });
    E.drawShadow(ctx, T, opts.shadow);
    E.layer(ctx, 'land', T, { state: st, alpha: landA, skip: ['P1', 'P3'] });
    E.drawFox(ctx, T, opts.look);
    E.drawNearSusuki(ctx, T);
  };
})(window.TSUKI = window.TSUKI || {});
