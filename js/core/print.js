/* ==========================================================================
   print.js — the woodblock (TSUKI.PRINT).
   The film is one print pulled on the Fifteenth Night. Every master shot is
   cached as carved blocks — a key block (K) and colour plates (P1…P8, D) —
   and each frame "prints" them with a per-plate (dx, dy, alpha) that comes
   from ONE table of film time: the printing in 序, the tears and the CLICK
   in 五, the jolt into the late impression (後摺) at 160, and the unprinting
   in the order real pigments fade, in 結.

   Plates (design/screenplay.json → plates):
     K  墨 key block          P1 黄土/煤竹 wood, thatch, earth
     P2 紅 萩 山吹 朱 warm      P3 松葉 尾花 greens, susuki
     P4 鼠 銀鼠 藍鼠 greys      P5 藍 water, the haori
     P6 ベロ藍 紺 桔梗 sky      P6i the ichimonji band (wiped on in 序)
   Plate landings in 序 follow TSUKI.CUES.kento (the score's clicks).
     P7 胡粉 月白 highlights    P8 雲母 kira (composited 'lighter')
     D  鴇 dawn (結 only)       R  the rabbit — drawn by TSUKI.MOON
   ========================================================================== */
(function (TSUKI) {
  'use strict';

  const U = TSUKI.U, B = TSUKI.B, C = TSUKI.C;
  const W = 1920, H = 1080;
  const PRINT = (TSUKI.PRINT = {});

  PRINT.IDS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P6i', 'P7', 'P8', 'D', 'K'];
  /** composite order: colours under the key block, mica last */
  PRINT.ORDER = ['P1', 'P3', 'P4', 'P5', 'P6', 'P6i', 'P2', 'P7', 'D', 'K', 'P8'];
  /** printing order in 序 (plate i lands at 6 + 0.55·i) */
  PRINT.LAND = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];

  /* ------------------------------------------------------------------ */
  /* the table                                                           */
  /* ------------------------------------------------------------------ */
  const TEARS = { P1: [0, 12], P2: [10, 4], P3: [-7, 4], P4: [3, -3], P5: [-12, -6], P6: [6, -10], P6i: [6, -10], P7: [-4, 8], P8: [3, -3], D: [0, 0], K: [0, 0] };
  const UNPRINT = [
    { ids: ['D', 'P2'], a: 222.0, b: 223.5 },
    { ids: ['P5', 'P6', 'P6i', 'P7', 'P8'], a: 223.5, b: 225.0 },
    { ids: ['P1', 'P3', 'P4'], a: 225.0, b: 226.5 },
    { ids: ['K'], a: 226.5, b: 228.0 },
  ];
  /** a colour block is laid this long before its kentō click, off register (序) */
  const LAND_PRE = 0.3;
  // the key block's rub (the baren spiral) ends as the first colour block is
  // laid: kentō[0] − LAND_PRE (5.7 with the score's 6.0), so the 黄土 block too
  // hangs off register for 0.3 s before its click
  // (score.js loads after this file; its CUES.baren.to should read 5.7 too)
  PRINT.TIMES = { printStart: 2, keyDone: 6 - LAND_PRE, landStart: 6, landStep: 0.6, landPre: LAND_PRE, tears: 140, click: 147.8, jolt: 160, joltDur: 0.6, unprint: 222, blank: 228 };

  const seedDir = (id, salt) => {
    const h = U.hash(id.charCodeAt(0) * 131 + (id.charCodeAt(1) || 0) * 17 + (id.charCodeAt(2) || 0) + salt * 977);
    const a = h * U.TAU;
    return [Math.cos(a), Math.sin(a)];
  };

  let memoT = NaN, memo = null;
  /**
   * The print state at film time T:
   *   { off: {id: [dx,dy]}, alpha: {id: a}, wear 0..1, keyReveal: null|{cx,cy,width,reach},
   *     ichimonji: 0..1 (wipe progress), phase: 'printing'|'shozuri'|'tears'|'atozuri'|'unprint'|'blank' }
   */
  PRINT.state = (T) => {
    if (T === memoT && memo) return memo;
    const off = {}, alpha = {};
    for (const id of PRINT.IDS) { off[id] = [0, 0]; alpha[id] = 1; }
    const X = PRINT.TIMES;
    let wear = 0, keyReveal = null, ichimonji = 1, phase = 'shozuri';

    // ---- 序: printing
    if (T < 14) {
      phase = 'printing';
      if (T < X.keyDone) {
        keyReveal = { cx: 1180, cy: 560, width: 160, reach: 1300 * U.ease.inOutSine(U.clamp((T - X.printStart) / (X.keyDone - X.printStart))) };
      }
      // plates land on the score's kentō clicks (TSUKI.CUES.kento). Every
      // landing is a small CLICK — the grammar 147.8 depends on: the block is
      // laid 0.3 s early, visibly off register (10–14 px, the scale of the
      // TEARS table), held there; on its click it snaps home in 0.06 s,
      // overshoots 1.2 px and settles. (Cues are 0.6 s apart, so a block
      // never appears while the previous one is still snapping.)
      const kento = TSUKI.CUES && TSUKI.CUES.kento;
      PRINT.LAND.forEach((id, i) => {
        const tl = kento && kento[i] != null ? kento[i] : X.landStart + X.landStep * i;
        const pre = LAND_PRE;
        const a = pre > 0 ? U.ease.outSine(U.clamp((T - (tl - pre)) / 0.18)) : U.clamp((T - tl) / 0.03);
        const k = T < tl ? 1 : 1 - U.clamp((T - tl) / 0.06);
        const d = seedDir(id, 1), mag = U.lerp(10, 14, U.hash(i + 11));
        const over = 1.2 * U.env(T, tl + 0.04, tl + 0.07, tl + 0.07, tl + 0.16, U.ease.inOutSine);
        alpha[id] = a;
        off[id] = [d[0] * (mag * k - over), d[1] * (mag * k - over)];
        if (id === 'P6') { alpha.P6i = 0; off.P6i = off.P6; }
      });
      const skyAt = kento && kento[5] != null ? kento[5] : 8.9; // P6 lands, then its band is wiped on
      ichimonji = U.seg(T, skyAt, skyAt + 0.6, U.ease.inOutSine);
      alpha.P6i = ichimonji > 0 ? 1 : 0;
      alpha.D = 0;
    } else if (T < 206) {
      alpha.D = 0;
    }

    // ---- 五: the tears, and the CLICK of forgetting
    if (T >= X.tears && T < X.click + 0.06) {
      phase = 'tears';
      const ramp = U.smoothstep(X.tears, X.tears + 2, T);
      const snap = T >= X.click ? 1 - (T - X.click) / 0.06 : 1;
      PRINT.LAND.concat(['P6i']).forEach((id) => {
        const i = Math.max(0, PRINT.LAND.indexOf(id === 'P6i' ? 'P6' : id));
        const s = ramp * snap * Math.sin((U.TAU * (T - X.tears)) / 3.1 + 1.3 * i);
        const v = TEARS[id];
        off[id] = [v[0] * s, v[1] * s];
      });
    }

    // ---- 六 onward: the late impression (後摺)
    if (T >= X.jolt) {
      phase = 'atozuri';
      wear = U.smoothstep(X.jolt, X.jolt + X.joltDur, T);
      alpha.P2 = 1 - wear;
      alpha.P6i = 1 - wear;
      alpha.P6 = U.lerp(1, 0.55, wear);
      off.P6 = [5 * wear, -3 * wear];
      off.P5 = [5 * wear, -3 * wear];
      off.P2 = [0, -4 * wear];
      if (T < X.jolt + X.joltDur) {
        // damped oscillation, 3 cycles, seeded direction per plate
        const u = (T - X.jolt) / X.joltDur;
        for (const id of PRINT.IDS) {
          const d = seedDir(id, 7), amp = U.lerp(4, 8, U.hash(id.length * 31 + id.charCodeAt(1)));
          const s = Math.sin(u * 3 * U.TAU) * (1 - u) * amp;
          off[id] = [off[id][0] + d[0] * s, off[id][1] + d[1] * s];
        }
      }
      if (T >= 206) alpha.D = 1;
    }

    // ---- 結: unprinting in fugitive-pigment order
    if (T >= X.unprint) {
      phase = T >= X.blank ? 'blank' : 'unprint';
      for (const g of UNPRINT) {
        const p = U.seg(T, g.a, g.b, U.ease.inOutSine);
        for (const id of g.ids) {
          const d = seedDir(id, 3), slip = U.lerp(2, 4, U.hash(id.charCodeAt(0) + 5));
          alpha[id] *= 1 - p;
          off[id] = [off[id][0] + d[0] * slip * p, off[id][1] + d[1] * slip * p - 4 * p];
        }
      }
    }

    memoT = T;
    memo = { off, alpha, wear, keyReveal, ichimonji, phase };
    return memo;
  };

  /** Draw live (animated) content as if printed from plate `id` at T. */
  PRINT.with = (ctx, id, T, fn) => {
    const st = PRINT.state(T);
    const a = st.alpha[id];
    if (a == null || a <= 0.001) return;
    const o = st.off[id];
    ctx.save();
    ctx.translate(o[0], o[1]);
    ctx.globalAlpha *= a;
    fn(ctx, st);
    ctx.restore();
  };

  /* ------------------------------------------------------------------ */
  /* carved blocks: shot caches                                          */
  /* ------------------------------------------------------------------ */
  const defs = {};
  const built = {};
  const lastUsed = {};       // performance.now() of each shot's last print (rebuild order only)
  let quality = 1;

  /**
   * Register a master shot.
   *   def.layers: ['sky','land',...] back → front
   *   def.worn:   true → also carve a late-impression variant of each plate
   *   def.build(P, q): P(layer, plateId) returns a 2D context in LOGICAL
   *               coordinates (1920×1080). Name a plate 'P6~worn' to supply
   *               your own late-impression variant (e.g. the flat sky).
   */
  PRINT.defineShot = (id, def) => { defs[id] = def; delete built[id]; };

  /**
   * Choose the cache resolution (backing px per logical px, 0.5…1.0: the
   * stage never needs more than 1920 px). Shots not yet carved use it
   * exactly (so plates blit 1:1). Shots already carved are kept — drawn
   * scaled — unless they would now be enlarged by > 8 % (soft) or are
   * oversampled by > 1.5×; those are re-carved in the background, one shot
   * per idle task, and swapped in when done — but never while
   * PRINT.deferWhile() is true (the engine: while the film plays, since a
   * carve blocks the main thread for up to a second). Nothing is rebuilt
   * in render.
   */
  PRINT.setQuality = (k) => {
    quality = U.clamp(k, 0.5, 1.0);
    const stale = Object.keys(built).filter((id) => quality > built[id].q * 1.08 || quality < built[id].q / 1.5);
    if (stale.length) recarve(stale);
  };
  PRINT.quality = () => quality;
  PRINT.deferWhile = null;

  let recarveGen = 0;
  const idle = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 60));
  function recarve(ids) {
    const gen = ++recarveGen;
    const queue = ids.slice();
    const step = () => {
      if (gen !== recarveGen) return;                  // superseded by a newer size
      if (PRINT.deferWhile && PRINT.deferWhile()) { setTimeout(() => idle(step), 400); return; }
      // the shots printed most recently first
      queue.sort((a, b) => (lastUsed[b] || 0) - (lastUsed[a] || 0));
      const id = queue.shift();
      if (id == null) return;
      const sh = built[id];
      if (sh && (quality > sh.q * 1.08 || quality < sh.q / 1.5)) {
        try { build(id); } catch (e) { console.error('[print] recarve', id, e); }
      }
      if (queue.length) idle(step);
    };
    idle(step);
  }

  /** Trim a full-frame plate canvas to its ink. Returns {c,x,y,w,h} in logical px, or null. */
  function trim(cv, q) {
    const sw = Math.ceil(cv.width / 8), sh = Math.ceil(cv.height / 8);
    const s = B.canvas(sw, sh), sc = s.getContext('2d');
    sc.drawImage(cv, 0, 0, sw, sh);
    const d = sc.getImageData(0, 0, sw, sh).data;
    let x0 = sw, y0 = sh, x1 = -1, y1 = -1;
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      if (d[(y * sw + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return null;
    const px0 = Math.max(0, x0 * 8 - 8), py0 = Math.max(0, y0 * 8 - 8);
    const px1 = Math.min(cv.width, (x1 + 1) * 8 + 8), py1 = Math.min(cv.height, (y1 + 1) * 8 + 8);
    const out = B.canvas(px1 - px0, py1 - py0);
    out.getContext('2d').drawImage(cv, -px0, -py0);
    return { c: out, x: px0 / q, y: py0 / q, w: (px1 - px0) / q, h: (py1 - py0) / q };
  }

  /** Carve the late-impression variant of a plate: grain wear (colour blocks), K gaps & cracks. */
  function wearOut(pl, id, seed) {
    const c = B.canvas(pl.c.width, pl.c.height);
    const x = c.getContext('2d');
    x.drawImage(pl.c, 0, 0);
    x.globalCompositeOperation = 'destination-out';
    const r = U.rng(seed);
    const area = c.width * c.height;
    const sc = c.width / pl.w; // backing px per logical px
    if (id === 'K') {
      // dash-gaps (≤ 8% of line length) and a few cracks along the grain
      const n = Math.round(area / (380 * sc * sc));
      x.fillStyle = '#000';
      for (let i = 0; i < n; i++) {
        const px = r() * c.width, py = r() * c.height, rr = U.lerp(1.5, 4.5, r()) * sc;
        x.beginPath();
        x.ellipse(px, py, rr * U.lerp(1, 2.2, r()), rr, r() * Math.PI, 0, U.TAU);
        x.fill();
      }
      x.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        let px = r() * c.width, py = r() * c.height;
        x.lineWidth = U.lerp(1, 2.2, r()) * sc;
        x.beginPath();
        x.moveTo(px, py);
        const len = U.lerp(120, 420, r()) * sc;
        for (let s = 0; s < len; s += 12 * sc) {
          px += 12 * sc;
          py += U.lerp(-2, 2, r()) * sc;
          x.lineTo(px, py);
        }
        x.stroke();
      }
    } else {
      PRINT.grainWear(x, pl.c, seed, { sc, ox: pl.x, oy: pl.y });
    }
    return { c, x: pl.x, y: pl.y, w: pl.w, h: pl.h };
  }

  /**
   * Grain wear of a colour block (後摺): the ink thins where the worn block
   * no longer holds it — never an even snow of bright points. Punches
   * (destination-out, α .25–.5) short streaks along the wood grain (1 × 3–7
   * px at 0° ± 8°, 1–3 specks in a line), whose density follows a slow noise
   * (patches of the block worn, others still crisp) and rises near the
   * edges of the ink and on its high points; no speck lands inside a region
   * narrower than 6 px (thin blades and lines keep their ink).
   *   dst  — context to punch (identity transform: backing px), already holding the ink
   *   src  — canvas whose alpha says where the ink is (usually dst's own content)
   *   opts — sc (backing px per logical px, 1), ox/oy (logical origin of the
   *          canvas, so the noise is fixed to the stage), density (1)
   * Used by the automatic worn plates; shots carving their own '~worn'
   * plates can call it the same way.
   */
  PRINT.grainWear = (dst, src, seed, opts = {}) => {
    const sc = opts.sc || 1, ox = opts.ox || 0, oy = opts.oy || 0;
    const w = src.width, h = src.height;
    if (w < 4 || h < 4) return;
    let data;
    try { data = src.getContext('2d').getImageData(0, 0, w, h).data; } catch (e) { return; }
    const A = (px, py) => {
      px = px | 0; py = py | 0;
      return px < 0 || py < 0 || px >= w || py >= h ? 0 : data[(py * w + px) * 4 + 3];
    };
    const r = U.rng(seed);
    const lw = w / sc, lh = h / sc;                     // logical size
    const n = Math.round((lw * lh) / 170 * (opts.density == null ? 1 : opts.density));
    const NARROW = 3 * sc, NEAR = 11 * sc, FAR = 26 * sc;
    const D8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
    const solid = (px, py, rad) => {
      for (const [dx, dy] of D8) if (A(px + dx * rad, py + dy * rad) < 150) return false;
      return true;
    };
    dst.save();
    dst.setTransform(1, 0, 0, 1, 0, 0);
    dst.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < n; i++) {
      const px = r() * w, py = r() * h;
      const u = r(), len0 = r(), ang0 = r(), cnt = r(), al = r();
      if (A(px, py) < 200 || !solid(px, py, NARROW)) continue;
      // where the block wears: slow patches, the edges of the ink, the high points
      const lx = ox + px / sc, ly = oy + py / sc;
      const patch = U.fbm2(lx / 210, ly / 150, 3, seed % 97);
      const high = U.fbm2(lx / 60, ly / 60, 2, (seed % 97) + 5);
      let p = Math.pow(U.clamp((patch - 0.38) * 2.4), 1.6) * 0.55 + (high > 0.7 ? 0.25 : 0);
      if (!solid(px, py, NEAR)) p = p * 1.6 + 0.16;
      else if (!solid(px, py, FAR)) p = p * 1.3 + 0.06;
      if (u > p * 0.5) continue;
      // on a dark ink the paper shows through hard: thin it less there
      const o4 = ((py | 0) * w + (px | 0)) * 4;
      const lum = (0.3 * data[o4] + 0.59 * data[o4 + 1] + 0.11 * data[o4 + 2]) / 255;
      const ak = U.lerp(0.55, 1, U.clamp(lum / 0.5));
      // a short streak along the grain
      const a = U.deg(U.lerp(-8, 8, ang0));
      const ca = Math.cos(a), sa = Math.sin(a);
      const m = 1 + Math.floor(cnt * 3);
      let d = 0;
      for (let j = 0; j < m; j++) {
        const L = U.lerp(3, 7, j === 0 ? len0 : U.hash(i * 7 + j)) * sc;
        const cx = px + ca * (d + L / 2), cy = py + sa * (d + L / 2);
        if (j > 0 && (A(cx, cy) < 200 || !solid(cx, cy, NARROW))) break;
        const th = U.lerp(0.8, 1.2, U.hash(i * 13 + j)) * sc;
        dst.fillStyle = `rgba(0,0,0,${(ak * U.lerp(0.25, 0.5, j === 0 ? al : U.hash(i * 3 + j + 7))).toFixed(3)})`;
        dst.setTransform(ca, sa, -sa, ca, cx, cy);
        dst.fillRect(-L / 2, -th / 2, L, th);
        d += L + U.lerp(1.5, 4, U.hash(i * 5 + j)) * sc;
      }
    }
    dst.restore();
  };

  function build(id) {
    const def = defs[id];
    if (!def) throw new Error(`PRINT: unknown shot ${id}`);
    const q = quality;
    const raw = {};
    let done = false;
    const P = (layer, plate) => {
      if (done) throw new Error(`PRINT: the blocks of shot ${id} are already carved (P called after build)`);
      const key = `${layer}|${plate}`;
      if (!raw[key]) {
        const cv = B.canvas(W * q, H * q);
        const cx = cv.getContext('2d');
        cx.setTransform(q, 0, 0, q, 0, 0);
        cx.imageSmoothingQuality = 'high';
        raw[key] = { cv, cx, layer, plate };
      }
      return raw[key].cx;
    };
    try { def.build(P, q); } catch (e) { release(raw); done = true; throw e; }
    done = true;
    const shot = { id, layers: {}, q };
    for (const l of def.layers) shot.layers[l] = {};
    for (const key of Object.keys(raw)) {
      const { cv, layer, plate } = raw[key];
      if (!shot.layers[layer]) shot.layers[layer] = {};
      const [pid, variant] = plate.split('~');
      const t = trim(cv, q);
      // the full-frame raw plate is no longer needed: free its backing store
      // now, even if a shot kept a reference to P or to this context
      cv.width = 0; cv.height = 0;
      raw[key] = null;
      if (!t) continue;
      const slot = shot.layers[layer][pid] || (shot.layers[layer][pid] = {});
      if (variant === 'worn') slot.worn = t; else slot.orig = t;
    }
    if (def.worn) {
      let n = 0;
      for (const l of Object.keys(shot.layers)) for (const pid of Object.keys(shot.layers[l])) {
        const slot = shot.layers[l][pid];
        if (slot.orig && !slot.worn && pid !== 'P8') slot.worn = wearOut(slot.orig, pid, 97 + n++ * 13);
      }
    }
    built[id] = shot;
    return shot;
  }
  function release(raw) {
    for (const key of Object.keys(raw)) if (raw[key]) { raw[key].cv.width = 0; raw[key].cv.height = 0; raw[key] = null; }
  }

  PRINT.shot = (id) => built[id] || build(id);
  /** Build every registered shot now (call during loading, not mid-film). */
  PRINT.buildAll = () => { for (const id of Object.keys(defs)) PRINT.shot(id); };
  PRINT.has = (id) => !!defs[id];
  /** Registered shot ids, and whether one is carved (for a loader that builds one per task). */
  PRINT.ids = () => Object.keys(defs);
  PRINT.isBuilt = (id) => !!built[id];

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

  /**
   * Print one plate. When the plate is cached at exactly the resolution it
   * is drawn at (axis-aligned, scale = its q), it is copied 1:1 at a whole
   * device pixel — no resampling — so a misregistering block moves in 1-px
   * steps, as a real block would. Otherwise it is drawn scaled.
   */
  function blit(ctx, pl, dx, dy, a, m) {
    if (!pl || a <= 0.001) return;
    ctx.globalAlpha = a;
    if (m && m.b === 0 && m.c === 0 && Math.abs(m.a * pl.w - pl.c.width) < 0.5 && Math.abs(m.d * pl.h - pl.c.height) < 0.5) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(pl.c, Math.round(m.a * (pl.x + dx) + m.e), Math.round(m.d * (pl.y + dy) + m.f));
      ctx.restore();
    } else if (m && Math.abs(m.a) * pl.w < pl.c.width * 0.7) {
      // a strong reduction (a camera pulling back): keep the filtered path
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(pl.c, pl.x + dx, pl.y + dy, pl.w, pl.h);
      ctx.imageSmoothingQuality = 'low';
    } else {
      ctx.drawImage(pl.c, pl.x + dx, pl.y + dy, pl.w, pl.h);
    }
  }

  function spiralMask(s, kr) {
    const b = kr.width / U.TAU; // arm spacing = stroke width
    s.globalCompositeOperation = 'destination-in';
    s.lineWidth = kr.width + 14;
    s.lineCap = 'round';
    s.lineJoin = 'round';
    s.strokeStyle = '#000';
    s.beginPath();
    s.moveTo(kr.cx, kr.cy);
    const thMax = kr.reach / b;
    for (let th = 0; th <= thMax; th += 0.08) {
      const r = b * th;
      s.lineTo(kr.cx + Math.cos(th) * r, kr.cy + Math.sin(th) * r);
    }
    if (kr.reach > 1) s.stroke();
    else {
      s.save();
      s.setTransform(1, 0, 0, 1, 0, 0);
      s.globalCompositeOperation = 'source-over';
      s.clearRect(0, 0, s.canvas.width, s.canvas.height);
      s.restore();
    }
  }

  /**
   * Print one layer of a shot at film time T.
   * opts: state (override PRINT.state), alpha: {plateId: multiplier},
   *       only: [plateIds], skip: [plateIds], wear (override 0..1)
   */
  PRINT.drawLayer = (ctx, id, layer, T, opts = {}) => {
    const shot = PRINT.shot(id);
    const L = shot.layers[layer];
    if (!L) return;
    const st = opts.state || PRINT.state(T);
    const wear = opts.wear == null ? st.wear : opts.wear;
    lastUsed[id] = performance.now();
    ctx.save();
    ctx.imageSmoothingQuality = 'low';
    const m = ctx.getTransform();
    for (const pid of PRINT.ORDER) {
      const slot = L[pid];
      if (!slot) continue;
      if (opts.only && !opts.only.includes(pid)) continue;
      if (opts.skip && opts.skip.includes(pid)) continue;
      let a = (st.alpha[pid] == null ? 1 : st.alpha[pid]) * (opts.alpha && opts.alpha[pid] != null ? opts.alpha[pid] : 1);
      if (a <= 0.001) continue;
      const [dx, dy] = st.off[pid] || [0, 0];
      ctx.globalCompositeOperation = pid === 'P8' ? 'lighter' : 'source-over';
      const drawSlot = (c) => {
        if (wear > 0 && slot.worn && wear < 1) { blit(c, slot.orig, dx, dy, a * (1 - wear), m); blit(c, slot.worn, dx, dy, a * wear, m); }
        else blit(c, wear >= 1 && slot.worn ? slot.worn : slot.orig || slot.worn, dx, dy, a, m);
      };
      if (pid === 'K' && st.keyReveal) {
        const s = scratchFor(ctx);
        s.imageSmoothingQuality = 'low';
        drawSlot(s);
        s.globalAlpha = 1;
        spiralMask(s, st.keyReveal);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.drawImage(scratch, 0, 0);
        ctx.restore();
      } else if (pid === 'P6i' && st.ichimonji < 1) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W * st.ichimonji, H);
        ctx.clip();
        drawSlot(ctx);
        ctx.restore();
      } else {
        drawSlot(ctx);
      }
    }
    ctx.restore();
  };

  /**
   * Print a whole shot: every layer back → front, calling opts.between[layer]
   * (ctx, state) AFTER that layer — the place to draw the moon, live figures…
   */
  PRINT.drawShot = (ctx, id, T, opts = {}) => {
    const def = defs[id];
    const st = opts.state || PRINT.state(T);
    for (const l of def.layers) {
      PRINT.drawLayer(ctx, id, l, T, { ...opts, state: st });
      if (opts.between && opts.between[l]) {
        ctx.save();
        opts.between[l](ctx, st);
        ctx.restore();
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /* the paper of a late impression                                      */
  /* ------------------------------------------------------------------ */
  let foxing = null;
  function foxingSprite() {
    if (foxing) return foxing;
    foxing = B.canvas(W / 2, H / 2);
    const x = foxing.getContext('2d');
    x.scale(0.5, 0.5);
    const r = U.rng(606);
    const ink = U.mix(C.odo, C.sumi, 0.45);
    for (let i = 0; i < 64; i++) {
      const px = r() * W, py = r() * H, rr = U.lerp(2, 13, Math.pow(r(), 2));
      const g = x.createRadialGradient(px, py, 0, px, py, rr);
      const a = U.lerp(0.12, 0.25, r());
      g.addColorStop(0, U.rgba(ink, a));
      g.addColorStop(0.6, U.rgba(ink, a * 0.6));
      g.addColorStop(1, U.rgba(ink, 0));
      x.fillStyle = g;
      x.beginPath();
      x.arc(px, py, rr, 0, U.TAU);
      x.fill();
    }
    // a few tide-lines of old damp
    for (let i = 0; i < 3; i++) {
      const px = r() * W, py = r() * H, rr = U.lerp(60, 160, r());
      x.strokeStyle = U.rgba(ink, 0.06);
      x.lineWidth = 2;
      x.beginPath();
      x.ellipse(px, py, rr, rr * U.lerp(0.5, 0.9, r()), r() * Math.PI, 0, U.TAU);
      x.stroke();
    }
    return foxing;
  }

  /**
   * Age the paper for the 後摺 (after drawing the shot, before live
   * foreground if desired). amount 0..1 (default: PRINT.state(T).wear).
   * opts.holes: [[x, y, r], ...] regions exempt (the moon is never old).
   */
  PRINT.age = (ctx, T, opts = {}) => {
    const amt = opts.amount == null ? PRINT.state(T).wear : opts.amount;
    if (amt <= 0.001) return;
    ctx.save();
    if (opts.holes && opts.holes.length) {
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      for (const [hx, hy, hr] of opts.holes) { ctx.moveTo(hx + hr, hy); ctx.arc(hx, hy, hr, 0, U.TAU, true); }
      ctx.clip('evenodd');
    }
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.5 * amt;
    ctx.fillStyle = C.torinoko;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = amt;
    const m = ctx.getTransform();
    if (m.b === 0 && m.c === 0 && m.a === m.d && m.a > 0) {
      // the foxing resampled once to this scale, then copied 1:1 (a half-res
      // → full-frame 'high' resample costs 20–50 ms per call)
      const f = foxingAt(m.a);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(f, Math.round(m.e), Math.round(m.f));
    } else {
      ctx.imageSmoothingQuality = 'low';
      ctx.drawImage(foxingSprite(), 0, 0, W, H);
    }
    ctx.restore();
  };
  let foxFit = null;
  function foxingAt(k) {
    const w = Math.round(W * k), h = Math.round(H * k);
    if (foxFit && foxFit.width === w && foxFit.height === h) return foxFit;
    foxFit = B.canvas(w, h);
    const x = foxFit.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(foxingSprite(), 0, 0, w, h);
    return foxFit;
  }
})(window.TSUKI = window.TSUKI || {});
