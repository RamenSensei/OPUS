/* ==========================================================================
   engine.js — the projector (TSUKI.ENGINE).
   Owns the stage, the clock, scene registry, transitions between segments,
   the paper finish, the controls and the capture/debug hooks.

   Scenes register with:
     TSUKI.scene('segment-id', {
       init(S)            // optional, once: build caches (S.canvas(), etc.)
       draw(ctx, t, S)    // required: pure function of local time t (s)
     });
   ctx is already scaled so the stage is 1920×1080 logical px.
   S = { W, H, dur, seg, T, U, B, C, canvas(w,h) }.
   A scene may be asked for t slightly < 0 or > dur during transitions:
   keep drawing gracefully (clamp your own timelines).
   ========================================================================== */
(function (TSUKI) {
  'use strict';

  const U = TSUKI.U, B = TSUKI.B;
  const W = 1920, H = 1080;
  const scenes = {};
  TSUKI.scene = (id, def) => { scenes[id] = def; };

  const ENGINE = (TSUKI.ENGINE = { W, H, scenes });

  /* ------------------------------------------------------------------ */
  /* state                                                               */
  /* ------------------------------------------------------------------ */
  let script, segs, total;
  let stage, canvas, ctx, overlay, bufA, bufB, bufM, ctxA, ctxB, ctxM;
  let k = 1;                 // backing px per logical px
  let T = 0;                 // film time (s)
  let playing = false;
  let anchorClock = 0, anchorT = 0, clockKind = 'perf';
  let started = false;
  let loading = true;        // blocks still being carved (see boot → warm)
  let pendingStart = false;  // start pressed while loading: play once ready
  let muted = false;
  let audioOn = false;       // AudioContext created (after a user gesture)
  let audioWaitUntil = 0;
  let lastUI = 0;
  const params = new URLSearchParams(location.search);
  const DEBUG = params.has('debug');
  const STILL = params.has('still');
  const NOPAPER = params.has('nopaper');
  const errors = {};

  const AUDIO = () => TSUKI.AUDIO;

  /* ------------------------------------------------------------------ */
  /* clock                                                               */
  /* ------------------------------------------------------------------ */
  const audioClock = () => {
    const A = AUDIO();
    return A && A.running && A.running() ? A.now() : null;
  };
  const clockNow = () => {
    const a = audioClock();
    return a != null ? a : performance.now() / 1000;
  };
  const reanchor = () => {
    clockKind = audioClock() != null ? 'audio' : 'perf';
    anchorClock = clockNow();
    anchorT = T;
  };

  /* ------------------------------------------------------------------ */
  /* sizing                                                              */
  /* ------------------------------------------------------------------ */
  // The backing store never exceeds 1920 px (the stage's logical width): on
  // a dpr-2 screen the browser upscales it, which the flat woodblock planes
  // tolerate, and every cache (plates, paper, buffers) stays ≤ 1920 wide.
  // Devices that report little memory (or iOS, whose canvas memory is
  // capped) get 1280. An explicit ?w= (capture tools) is honoured up to 2560.
  const lowMemory = () => {
    const dm = navigator.deviceMemory;
    const iOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return (dm && dm <= 4) || iOS;
  };
  let cssW = W, cssH = H;
  function resize(opts = {}) {
    const theatre = document.getElementById('theatre');
    const fs = !!document.fullscreenElement;
    const vw = theatre.clientWidth, vh = theatre.clientHeight;
    const margin = fs || STILL || vw < 700 || vh < 500 ? 0 : Math.min(48, vw * 0.03);
    const scale = Math.min((vw - margin * 2) / W, (vh - margin * 2) / H);
    cssW = Math.floor(W * scale); cssH = Math.floor(H * scale);
    stage.style.width = cssW + 'px';
    stage.style.height = cssH + 'px';
    overlay.style.transform = `scale(${cssW / W})`;
    // phone portrait: the controls live in the letterbox under the picture
    document.body.classList.toggle('portrait', !STILL && vh - cssH > 200 && vw < vh);
    // subtitles never smaller than 13 CSS px
    overlay.style.setProperty('--sub-k', Math.max(1, 13 / ((34 * cssW) / W)).toFixed(3));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let bw = Math.round(cssW * dpr);
    if (params.has('w')) bw = U.clamp(parseInt(params.get('w'), 10) || bw, 480, 2560);
    else bw = U.clamp(bw, 480, lowMemory() ? 1280 : 1920);
    const bh = Math.round((bw * H) / W);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw; canvas.height = bh;
      k = bw / W;
      freeBufs();                             // transition buffers: resized on demand
      if (TSUKI.PRINT) TSUKI.PRINT.setQuality(k);
      // the paper is painted once per size (during loading: by the warm-up)
      if (!NOPAPER && TSUKI.PAPER.mounted() && !loading) TSUKI.PAPER.fit(bw, bh);
      // the mist bands are carved at the stage's resolution: re-carve them now,
      // not in the wipe's first frame (during loading the warm-up does it)
      kasumiCache = null;
      if (!loading) bakeKasumi();
    }
    k = bw / W;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.imageSmoothingQuality = 'high';
    liftSubs();
    if (opts.render !== false && !loading) render(T);
  }
  /** keep the subtitle above the control bar while it is shown (logical px) */
  function liftSubs() {
    const bar = $('bar');
    if (!bar || !cssW) return;
    overlay.style.setProperty('--bar-lift', Math.ceil(((bar.offsetHeight || 98) + 10) * W / cssW) + 'px');
  }
  // window resizes and fullscreen changes are applied 150 ms after the last event
  let resizeTimer = 0;
  const resizeSoon = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => resize(), 150); };

  /* ------------------------------------------------------------------ */
  /* transition buffers (only while a non-cut transition needs them)     */
  /* ------------------------------------------------------------------ */
  let bufW = 0;
  function useBufs() {
    const bw = canvas.width, bh = canvas.height;
    if (bufW === bw && bufA.height === bh) return;
    for (const c of [bufA, bufB]) { c.width = bw; c.height = bh; }
    bufW = bw;
  }
  function freeBufs() {
    if (!bufW && bufM.width === 1) return;
    for (const c of [bufA, bufB, bufM]) { c.width = 1; c.height = 1; }
    bufW = 0;
  }
  function useMask() {
    if (bufM.width !== canvas.width || bufM.height !== canvas.height) { bufM.width = canvas.width; bufM.height = canvas.height; }
  }

  /* ------------------------------------------------------------------ */
  /* scene drawing                                                       */
  /* ------------------------------------------------------------------ */
  function resetCtx(c) {
    c.setTransform(k, 0, 0, k, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.filter = 'none';
    c.shadowBlur = 0;
    c.shadowColor = 'rgba(0,0,0,0)';
    c.lineCap = 'butt';
    c.lineJoin = 'miter';
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
  }

  function sceneCtx(seg) {
    return { W, H, dur: seg.duration, seg, T, U, B, C: TSUKI.C, canvas: B.canvas, k };
  }

  // last local time each scene drew without error: a frame that throws is
  // replaced by the scene's last good frame (a pure function of t), never by
  // a flash; ?debug shows the placeholder instead
  const lastGood = {};
  function drawSeg(c, seg, t, retry) {
    resetCtx(c);
    c.fillStyle = TSUKI.C.kinari;
    c.fillRect(0, 0, W, H);
    const sc = scenes[seg.id];
    if (!sc) { if (DEBUG) placeholder(c, seg, t); return; }
    try {
      if (!sc._inited && sc.init) { sc.init(sceneCtx(seg)); }
      sc._inited = true;
      c.save();
      sc.draw(c, t, sceneCtx(seg));
      c.restore();
      lastGood[seg.id] = t;
    } catch (e) {
      if (!errors[seg.id]) { errors[seg.id] = String(e && e.stack || e); console.error(`[scene ${seg.id}]`, e); }
      resetCtx(c);
      if (DEBUG) placeholder(c, seg, t, true);
      else if (!retry && lastGood[seg.id] != null && lastGood[seg.id] !== t) return drawSeg(c, seg, lastGood[seg.id], true);
      else { c.fillStyle = TSUKI.C.kinari; c.fillRect(0, 0, W, H); }   // the bare washi
    }
    resetCtx(c);
  }

  function placeholder(c, seg, t, broken) {
    c.fillStyle = broken ? '#3a1d1d' : TSUKI.C.koiai;
    c.fillRect(0, 0, W, H);
    B.moon(c, 1380, 360, 150, { halo: 0.6, mica: t });
    c.fillStyle = TSUKI.C.gofun;
    c.font = '48px "Shippori Mincho B1", serif';
    c.textAlign = 'center';
    c.fillText(`${seg.title_ja || seg.id}${broken ? '（描画エラー）' : ''}`, W / 2, H * 0.72);
    c.font = '28px "Shippori Mincho B1", serif';
    c.fillText(`${seg.id} · ${t.toFixed(1)}s / ${seg.duration}s`, W / 2, H * 0.72 + 56);
  }

  /* ------------------------------------------------------------------ */
  /* transitions                                                         */
  /* ------------------------------------------------------------------ */
  let noiseField = null; // low-res fbm for ink dissolves
  function getNoise() {
    if (noiseField) return noiseField;
    const w = 192, h = 108;
    const f = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      f[y * w + x] = 0.75 * U.fbm2(x / 22, y / 22, 4, 41) + 0.25 * U.hash2(x, y);
    }
    const cv = B.canvas(w, h);
    noiseField = { w, h, f, cv, cx: cv.getContext('2d'), img: null };
    noiseField.img = noiseField.cx.createImageData(w, h);
    return noiseField;
  }

  /** Paint a mask into ctxM (white = show B). */
  function maskInk(p, soft = 0.08, center) {
    const N = getNoise();
    const d = N.img.data;
    const th = U.lerp(-soft, 1 + soft, p);
    for (let y = 0; y < N.h; y++) for (let x = 0; x < N.w; x++) {
      const i = y * N.w + x;
      let v = N.f[i];
      if (center) {
        // bias: open first near a point (e.g. the moon)
        const dx = x / N.w - center[0] / W, dy = y / N.h - center[1] / H;
        v = v * 0.55 + Math.min(1, Math.hypot(dx * 1.6, dy) * 1.3) * 0.45;
      }
      const a = U.smoothstep(v - soft, v + soft, th) * 255;
      const o = i * 4;
      d[o] = d[o + 1] = d[o + 2] = 255;
      d[o + 3] = a;
    }
    N.cx.putImageData(N.img, 0, 0);
    useMask();
    ctxM.save();
    ctxM.setTransform(k, 0, 0, k, 0, 0);
    ctxM.clearRect(0, 0, W, H);
    ctxM.imageSmoothingEnabled = true;
    ctxM.drawImage(N.cv, 0, 0, W, H);
    ctxM.restore();
  }

  /* ---- すやり霞: the mist bands of the 'kasumi' transition ----------- */
  // Five long flat bands, each ONE opaque ink (胡粉, a breath of 鴇, 月白): a
  // rounded suyari nose in front, a long tapering tail behind; about half carry
  // a second, thinner bar laid along one edge so the ends step (the emaki way
  // of drawing すやり霞). The only
  // gradation is the atenashi bokashi along each bar's top edge — no band is
  // translucent and none fades to transparency at an edge, so they print as
  // flat 胡粉 on the paper, not as frosted glass. Sparse 金砂子 flecks ride on
  // them. They unroll in from the right (emaki reading order), staggered from
  // the middle rows outward, glide to rest (some noses inside the picture,
  // drifting on), and with the picture about two thirds veiled the scene
  // CUTS beneath them — one frame, seen only in the wide gaps, never a
  // cross-fade through the ink; then each nose runs out to the left, and only
  // once it has gone does its tail come in at the right and sweep through (a
  // band never shows both its ends at once: no floating capsules), the rows
  // leaving from the lower left to the upper right. Each band is baked once per stage size (during the warm-up)
  // at device resolution as [left end | body | right end] and printed as 1:1
  // pieces (no per-frame gradients or paths); one scene per frame.
  const KASUMI_STAGGER = 0.1;                   // latest row start (of p)
  const KASUMI_DRIFT = 540;                     // px per unit p (≈ 180 px/s) where a nose settles
  const KASUMI_CUT = 0.5;                       // the scene changes beneath the mist (a cut)
  let kasumiCache = null;
  let kasumiGeomCache = null;
  function kasumiGeom(tr) {
    const n = tr.rows || 5, seed = tr.seed == null ? 5 : tr.seed;
    if (kasumiGeomCache && kasumiGeomCache.n === n && kasumiGeomCache.seed === seed) return kasumiGeomCache;
    const rh = H / n;
    const rows = [];
    let yTop = -rh * 0.16;                       // top of the next row's ink
    for (let i = 0; yTop < H - rh * 0.28 && i < 16; i++) {
      const h = (j) => U.hash(i * 37 + j * 11 + seed);
      // broad bands, now and then a narrower one
      const bh = rh * (h(16) < 0.3 ? U.lerp(0.28, 0.38, h(1)) : U.lerp(0.52, 0.76, h(1)));
      // the leading nose is a round suyari end; the trailing end a long taper
      // (the lower edge rising to the upper in one slow curve), so no band ever
      // reads as a capsule with the same cap at both ends
      const parts = [{ dy: 0, h: bh, dl: 0, dr: 0, capL: bh * U.lerp(1.5, 1.9, h(2)), capR: bh * U.lerp(2.5, 3.3, h(3)) }];
      if (h(4) < 0.6) {
        // the stepped end: a thinner bar overlapping the lower (or upper) edge
        const sh = bh * U.lerp(0.4, 0.56, h(5));
        const below = h(6) < 0.62;
        parts.push({
          dy: below ? bh - sh * 0.42 : -sh * 0.58, h: sh,
          // its leading nose clearly ahead (<0) or behind, its trailing nose
          // behind or a little beyond: never so close that the ends bulge
          dl: h(7) < 0.3 ? -rh * U.lerp(0.45, 0.85, h(17)) : rh * U.lerp(0.55, 1.7, h(17)),
          dr: h(8) < 0.3 ? rh * U.lerp(0.28, 0.45, h(18)) : -rh * U.lerp(0.6, 1.8, h(18)),
          capL: sh * U.lerp(1.6, 2.1, h(9)), capR: sh * U.lerp(2.8, 3.8, h(21)),
        });
      }
      const top = Math.min(...parts.map((q) => q.dy)), bot = Math.max(...parts.map((q) => q.dy + q.h));
      // how far the ink reaches beyond the main bar's two noses, and how long
      // each end is before the flat body begins (logical px)
      const reachL = Math.max(...parts.map((q) => -q.dl)), reachR = Math.max(...parts.map((q) => q.dr));
      const endL = Math.max(...parts.map((q) => q.dl + q.capL)), endR = Math.max(...parts.map((q) => q.capR - q.dr));
      const mid = (yTop + (bot - top) / 2) / H;
      // where the band starts and ends its journey: just far enough beyond
      // each edge that no ink shows there, and that its full-height body
      // (not an end) meets the edge while it lies across the picture
      const x0 = W + Math.max(endR + 12, reachL + 6), x1 = -Math.max(endL + 12, reachR + 6);
      // entry order: a staircase from the middle rows outward, lightly shuffled
      const d = KASUMI_STAGGER * U.clamp(0.6 * Math.abs(mid - 0.5) * 2 + 0.4 * h(10));
      // where the leading nose settles: inside the picture for some rows,
      // just past the left edge for the rest; from there it drifts on
      // (the resting noses step down from the upper right to the lower left,
      // the emaki's reading diagonal, every other row or so)
      const inside = (i + (h(11) < 0.3 ? 1 : 0)) % 2 === 0;
      const rest = inside ? U.lerp(160, 900, 1 - mid) + U.lerp(-90, 90, h(12)) : -endL * U.lerp(0.1, 0.5, h(12));
      // the exit, after the cut: each leading nose leaves by the left edge
      // before its own tail comes in at the right (the band lies across the
      // whole picture between), then the tail sweeps through — one row after
      // another, from the lower left to the upper right
      const ord = U.clamp((1 - mid) * 0.86 + 0.14 * h(15));
      const tEnter = 0.555 + 0.17 * ord;
      // the 金砂子 riding on the main bar: sparse flecks (distance from the
      // leading nose, height within the bar, size, shape)
      const flecks = [];
      const nf = 10 + Math.floor(h(20) * 8);
      for (let f = 0; f < nf; f++) {
        const g = (j) => U.hash(i * 131 + f * 17 + j * 7 + seed * 3 + 9);
        const cluster = g(1) < 0.55;           // gathered toward the nose, as dusted by hand
        flecks.push({
          d: (cluster ? U.lerp(0.25, 1.4, g(2)) : U.lerp(0.3, 4.6, g(2))) * bh + 40,
          // 砂子 dust (round, 1.6–3 px) and a few 切箔 cut squares (3.5–6 px, turned)
          v: U.lerp(0.26, 0.8, g(3)), sq: g(5) < 0.3, a: U.lerp(0.6, 0.92, g(6)), rot: g(7) * 1.57,
          s: g(5) < 0.3 ? U.lerp(3.5, 6, g(4)) : U.lerp(1.6, 3, g(4)),
        });
      }
      rows.push({
        y: yTop - top, parts, top, bot, reachL, reachR, endL, endR, x0, x1, rest, flecks,
        // leading nose: enters, settles (the longer journeys take longer)
        tIn: d, tRest: d + (inside ? U.lerp(0.3, 0.34, h(14)) : U.lerp(0.33, 0.36, h(14))),
        tLx: tEnter - 0.012, tEnter, tOut: 0, tEnd: Math.min(0.985, tEnter + U.lerp(0.24, 0.27, h(19))),
        tint: [0, 1, 2, 1, 0, 2][i % 6],
      });
      // start the tail so its tip reaches the right edge exactly at tEnter
      const r = rows[rows.length - 1];
      let lo = r.tEnter - 0.3, hi = r.tEnter;
      for (let it = 0; it < 30; it++) {
        r.tOut = (lo + hi) / 2;
        if (kasumiRow(r, i, r.tEnter).R + r.reachR > W) hi = r.tOut; else lo = r.tOut;
      }
      yTop += bot - top + rh * U.lerp(0.28, 0.48, h(13));   // the band, and a wide, uneven gap under it
    }
    kasumiGeomCache = { n, seed, rows };
    return kasumiGeomCache;
  }
  function kasumiSprites(tr, g) {
    const col = tr.color || TSUKI.C.gofun;
    const key = `${canvas.width}|${col}|${g.n}|${g.seed}`;
    if (kasumiCache && kasumiCache.key === key) return kasumiCache;
    const C = TSUKI.C;
    // [body ink, the deeper ink of its top-edge bokashi] — all opaque
    const tints = [
      [col, U.mix(col, C.kinari, 0.6)],
      [U.mix(col, C.toki, 0.1), U.mix(col, C.toki, 0.3)],
      [U.mix(col, C.geppaku, 0.65), U.mix(C.geppaku, C.kamenozoki, 0.3)],
    ];
    const mk = ([ink, deep], r) => {
      const mx = 3, top = 2, bodyD = 16;
      const offL = mx + Math.ceil(r.reachL * k), offR = mx + Math.ceil(r.reachR * k);
      const lw = offL + Math.ceil(r.endL * k) + bodyD / 2;
      const rw = offR + Math.ceil(r.endR * k) + bodyD / 2;
      const sw = lw + rw, hD = (r.bot - r.top) * k, sh = Math.ceil(top + hD + 2);
      const cv = B.canvas(sw, sh), c = cv.getContext('2d');
      const nL = offL, nR = sw - offR;                  // the main bar's two noses
      // the lower bar first: the upper one's flat body then covers its top bokashi
      const parts = r.parts.slice().sort((a, b) => b.dy - a.dy);
      for (const q of parts) {
        const x0 = nL + q.dl * k, x1 = nR + q.dr * k;
        const cl = q.capL * k, cr = q.capR * k;
        const t = top + (q.dy - r.top) * k, b = t + q.h * k, hh = q.h * k;
        const xl = x0 + cl, xr = x1 - cr;
        // the rounded suyari end: an elongated half-oval, its nose a little
        // above mid-height so the upper edge runs out a touch further; the
        // trailing end closes a little more gently
        // the trailing end: the upper edge runs on, drooping a little, the
        // lower edge rises to meet it in one long curve, closing in a small
        // round tip a quarter of the way down
        const ty = t + hh * 0.27;
        c.beginPath();
        c.moveTo(xl, t);
        c.lineTo(xr, t);
        c.bezierCurveTo(xr + cr * 0.5, t, xr + cr * 0.86, t + hh * 0.06, x1 - hh * 0.1, ty - hh * 0.09);
        c.quadraticCurveTo(x1 + hh * 0.05, ty + hh * 0.005, x1 - hh * 0.11, ty + hh * 0.095);
        c.bezierCurveTo(xr + cr * 0.62, t + hh * 0.52, xr + cr * 0.3, b, xr, b);
        c.lineTo(xl, b);
        c.bezierCurveTo(xl - cl * 0.5, b, x0, t + hh * 0.86, x0, t + hh * 0.45);
        c.bezierCurveTo(x0, t + hh * 0.12, xl - cl * 0.6, t, xl, t);
        c.closePath();
        // one flat ink; along the top edge the atenashi bokashi of the deeper ink
        const gr = c.createLinearGradient(0, t, 0, b);
        gr.addColorStop(0, deep);
        gr.addColorStop(Math.min(0.1, 9 * k / hh), U.mix(deep, ink, 0.5));
        gr.addColorStop(Math.min(0.34, 34 * k / hh), ink);
        gr.addColorStop(1, ink);
        c.fillStyle = gr;
        c.fill();
      }
      return { cv, sw, sh, top, lw, rw, offL, offR };
    };
    kasumiCache = { key, bands: g.rows.map((r) => mk(tints[r.tint], r)) };
    return kasumiCache;
  }
  /** Bake the bands of every 'kasumi' transition now (warm-up, resize): no stall at the wipe. */
  function bakeKasumi() {
    if (!segs) return;
    for (const s of segs) if (s.transition && s.transition.type === 'kasumi') kasumiSprites(s.transition, kasumiGeom(s.transition));
  }
  /** 0→1 over u, leaving at speed v0 and arriving at speed v1 (1 = the mean speed). */
  const hermite = (u, v0, v1) => { u = U.clamp(u); return ((v0 + v1 - 2) * u + (3 - 2 * v0 - v1)) * u * u + v0 * u; };
  /** Row r's band [L, R] (logical x of the main bar's noses) and top y at progress p. */
  function kasumiRow(r, i, p) {
    const { x0, x1 } = r, span = x0 - x1;
    // the leading nose glides in already moving, slows as it settles at its
    // resting place and, without ever stopping, drifts on and then runs out to
    // the left (gone by tLx); only then does the tapering tail come in at the
    // right edge (tEnter) and sweep through: always leftward, no dead stop
    const fr = (x0 - r.rest) / span;                       // share of the way at rest
    const a1 = r.tRest - r.tIn, a2 = r.tLx - r.tRest;
    const v = KASUMI_DRIFT / span;                         // the drift, in shares of the way per unit p
    let f;
    if (p < r.tRest) f = fr * hermite((p - r.tIn) / a1, 1.3, v * a1 / fr);
    else f = fr + (1 - fr) * hermite((p - r.tRest) / a2, Math.min(2.5, v * a2 / (1 - fr)), 1.5);
    const L = x0 - span * f;
    const R = x0 - span * hermite((p - r.tOut) / (r.tEnd - r.tOut), 0.85, 1.15);
    const y = r.y + U.wobble(i * 1.7 + p * 1.6, 3) * 4;
    return { L, R, y };
  }
  function kasumiBands(tr, p) {
    const g = kasumiGeom(tr);
    const S = kasumiSprites(tr, g);
    const cw = canvas.width;
    const kin = U.mix(TSUKI.C.kin, TSUKI.C.odo, 0.18);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.imageSmoothingEnabled = false;
    g.rows.forEach((row, i) => {
      const { L, R, y } = kasumiRow(row, i, p);
      if (R - L < 2) return;
      const s = S.bands[i];
      const Ld = Math.round(L * k), Rd = Math.round(R * k), yd = Math.round((y + row.top) * k) - s.top;
      const a = Ld - s.offL, b = Rd + s.offR - s.rw;   // dest x of the two end pieces
      if (b + s.rw <= 0 || a >= cw) return;
      if (b >= a + s.lw) {
        if (a + s.lw > 0) ctx.drawImage(s.cv, 0, 0, s.lw, s.sh, a, yd, s.lw, s.sh);
        if (b < cw) ctx.drawImage(s.cv, s.lw, 0, s.rw, s.sh, b, yd, s.rw, s.sh);
        const m0 = Math.max(a + s.lw, 0), m1 = Math.min(b, cw);
        if (m1 > m0) ctx.drawImage(s.cv, s.lw - 1, 0, 2, s.sh, m0, yd, m1 - m0, s.sh);
      } else {
        // shorter than its two ends (just unrolling / almost rolled away):
        // the front of the leading end meets the back of the trailing end
        const x = Math.round((a + s.lw + b) / 2);
        if (x > a && x > 0) ctx.drawImage(s.cv, 0, 0, x - a, s.sh, a, yd, x - a, s.sh);
        const w = b + s.rw - x;
        if (w > 0 && x < cw) ctx.drawImage(s.cv, s.sw - w, 0, w, s.sh, x, yd, w, s.sh);
      }
      // 金砂子: flecks of gold dust laid on the main bar, carried with its nose;
      // kept inside the rounded ends, gone as the trailing end rolls over them
      const m = row.parts[0], cl = m.capL, cr = m.capR;
      ctx.fillStyle = kin;
      for (const f of row.flecks) {
        const x = L + f.d;
        if (x < -4 || x > W + 4 || x > R) continue;
        const vv = (f.v - 0.5) * 2, e = 1 - Math.sqrt(Math.max(0, 1 - vv * vv));
        if (f.d < cl * e + 3 || R - x < cr * (0.55 + 0.4 * Math.abs(f.v - 0.27)) + 3) continue;
        const ss = f.s * k * 0.5, px = x * k, py = (y + m.h * f.v) * k;
        ctx.globalAlpha = f.a;
        ctx.beginPath();
        if (f.sq) {
          const c = Math.cos(f.rot) * ss, sn = Math.sin(f.rot) * ss;
          ctx.moveTo(px + c, py + sn); ctx.lineTo(px - sn, py + c * 0.8); ctx.lineTo(px - c, py - sn); ctx.lineTo(px + sn, py - c * 0.8);
        } else ctx.arc(px, py, Math.max(0.6, ss), 0, U.TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
    ctx.restore();
  }

  /**
   * Which of the two segments a transition shows at progress p:
   * { a, b } — draw only what will be composited this frame.
   */
  function needs(tr, p) {
    switch (tr.type) {
      case 'paper': case 'sumi': return { a: p < 0.5, b: p >= 0.5 };
      case 'kasumi': return { a: p < KASUMI_CUT, b: p >= KASUMI_CUT };
      default: return { a: p < 1, b: p > 0 };
    }
  }

  function composite(type, p, tr) {
    const e = U.ease.inOutSine(p);
    const kin = TSUKI.C.kin, sumi = TSUKI.C.sumi;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    const full = (c) => ctx.drawImage(c, 0, 0);
    switch (type) {
      case 'cut':
        full(bufB);
        break;
      case 'ink': {
        full(bufA);
        maskInk(e, tr.soft || 0.09, tr.center);
        ctxB.save();
        ctxB.setTransform(1, 0, 0, 1, 0, 0);
        ctxB.globalCompositeOperation = 'destination-in';
        ctxB.drawImage(bufM, 0, 0);
        ctxB.restore();
        full(bufB);
        break;
      }
      case 'iris': {
        full(bufA);
        const [cx, cy] = tr.center || [W / 2, H / 2];
        const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.05;
        const r = U.ease.inOutCubic(p) * R;
        const soft = tr.soft == null ? 60 : tr.soft;
        useMask();
        ctxM.save();
        ctxM.setTransform(k, 0, 0, k, 0, 0);
        ctxM.clearRect(0, 0, W, H);
        const g = ctxM.createRadialGradient(cx, cy, Math.max(0, r - soft), cx, cy, r + 0.01);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctxM.fillStyle = g;
        ctxM.fillRect(0, 0, W, H);
        ctxM.restore();
        ctxB.save();
        ctxB.setTransform(1, 0, 0, 1, 0, 0);
        ctxB.globalCompositeOperation = 'destination-in';
        ctxB.drawImage(bufM, 0, 0);
        ctxB.restore();
        full(bufB);
        if (tr.ring !== false && r > 1) {
          ctx.setTransform(k, 0, 0, k, 0, 0);
          ctx.strokeStyle = U.rgba(tr.ringColor || kin, 0.55 * Math.sin(Math.PI * p));
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, r - soft * 0.5, 0, U.TAU);
          ctx.stroke();
        }
        break;
      }
      case 'scroll': {
        // emaki: unrolling right→left means the new scene enters from the
        // LEFT while the old one moves off to the right.
        const x = e * canvas.width;
        ctx.drawImage(bufA, x, 0);
        ctx.drawImage(bufB, x - canvas.width, 0);
        ctx.setTransform(k, 0, 0, k, 0, 0);
        const sx = x / k;
        const g = ctx.createLinearGradient(sx - 40, 0, sx + 40, 0);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(0.5, `rgba(40,30,20,${0.25 * Math.sin(Math.PI * p)})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(sx - 40, 0, 80, H);
        break;
      }
      case 'cross':
      default:
        full(bufA);
        ctx.globalAlpha = e;
        full(bufB);
    }
    ctx.globalAlpha = 1;
    void sumi;
  }

  /** The overlay a transition paints over whatever scene(s) it shows. */
  function overlayPaint(tr, p) {
    if (tr.type === 'kasumi') kasumiBands(tr, p);
    else if (tr.type === 'paper' || tr.type === 'sumi') {
      const col = tr.type === 'paper' ? (tr.color || TSUKI.C.kinari) : (tr.color || TSUKI.C.sumi);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = p < 0.5 ? U.ease.inOutSine(p * 2) : 1 - U.ease.inOutSine((p - 0.5) * 2);
      ctx.fillStyle = col;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
  }

  /* ------------------------------------------------------------------ */
  /* frame                                                               */
  /* ------------------------------------------------------------------ */
  function segIndexAt(t) {
    for (let i = segs.length - 1; i >= 0; i--) if (t >= segs[i].start) return i;
    return 0;
  }

  function render(t) {
    if (!segs) return;
    t = U.clamp(t, 0, total - 1e-3);
    const i = segIndexAt(t);
    const seg = segs[i];
    const lt = t - seg.start;
    const tr = seg.transition;
    if (i > 0 && tr && tr.type !== 'cut' && lt < tr.dur) {
      const prev = segs[i - 1];
      const p = U.clamp(lt / tr.dur);
      const n = needs(tr, p);
      // never draw a segment into a buffer this frame does not composite:
      // one visible segment is drawn straight onto the stage
      if (n.a && n.b) {
        useBufs();
        drawSeg(ctxA, prev, t - prev.start);
        drawSeg(ctxB, seg, lt);
        resetCtx(ctx);
        composite(tr.type, p, tr);
      } else if (n.a) {
        drawSeg(ctx, prev, t - prev.start);
      } else {
        drawSeg(ctx, seg, lt);
      }
      overlayPaint(tr, p);
    } else {
      drawSeg(ctx, seg, lt);
      // the transition buffers are only kept around a transition
      if (bufW && !nearTransition(t)) freeBufs();
    }
    // …and allocated a moment before one, not in its first mixed frame
    if (!bufW && nearTransition(t)) { useBufs(); ctxA.clearRect(0, 0, 1, 1); ctxB.clearRect(0, 0, 1, 1); }
    resetCtx(ctx);
    if (!NOPAPER && !TSUKI.PAPER.mounted()) TSUKI.PAPER.apply(ctx, paperStrength());
    TSUKI.TEXT.update(t);
    updateUI(t, i);
    if (DEBUG) debugHUD(t, seg, lt);
  }
  const paperStrength = () => (script.paperStrength == null ? 1 : script.paperStrength);
  // transitions that only ever show one segment per frame need no buffers
  const ONE_AT_A_TIME = { cut: 1, kasumi: 1, paper: 1, sumi: 1 };
  function nearTransition(t) {
    for (let i = 1; i < segs.length; i++) {
      const tr = segs[i].transition;
      if (tr && !ONE_AT_A_TIME[tr.type] && t > segs[i].start - 1.5 && t < segs[i].start + tr.dur + 1.5) return true;
    }
    return false;
  }

  function debugHUD(t, seg, lt) {
    resetCtx(ctx);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(12, 12, 560, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '22px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`T ${t.toFixed(2)}  ${seg.id}  t ${lt.toFixed(2)}/${seg.duration}`, 22, 40);
  }

  function frame() {
    requestAnimationFrame(frame);
    if (playing) {
      // hold the picture for a moment while the AudioContext spins up, so
      // the first notes are not dropped (Safari/iOS can take ~300 ms)
      if (audioWaitUntil && audioClock() == null && performance.now() < audioWaitUntil) {
        reanchor();
        return;
      }
      audioWaitUntil = 0;
      if ((clockKind === 'audio') !== (audioClock() != null)) reanchor();
      T = anchorT + (clockNow() - anchorClock);
      if (T >= total) { T = total - 1e-3; pause(); showEnd(true); }
      const A = AUDIO();
      if (A && A.update) A.update(T);
      render(T);
    }
  }

  /* ------------------------------------------------------------------ */
  /* transport                                                           */
  /* ------------------------------------------------------------------ */
  function play() {
    if (T >= total - 0.05) seek(0);
    playing = true;
    showEnd(false);
    const A = AUDIO();
    if (A && A.play) A.play(T);
    audioWaitUntil = audioOn && !muted ? performance.now() + 600 : 0;
    reanchor();
    document.body.classList.add('playing');
    document.body.classList.remove('paused');
    pokeUI();
  }
  function pause() {
    playing = false;
    const A = AUDIO();
    if (A && A.pause) A.pause();
    document.body.classList.remove('playing');
    document.body.classList.add('paused');
    pokeUI();
  }
  function seek(t) {
    T = U.clamp(t, 0, total - 1e-3);
    const A = AUDIO();
    if (A && A.seek) A.seek(T, playing);
    reanchor();
    showEnd(false);
    render(T);
  }
  const toggle = () => (playing ? pause() : play());

  /* ------------------------------------------------------------------ */
  /* UI                                                                  */
  /* ------------------------------------------------------------------ */
  const $ = (id) => document.getElementById(id);
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  let uiSegIdx = -1, uiTime = '', lastScrub = -1;

  function buildUI() {
    const ticks = $('ticks');
    ticks.innerHTML = '';
    segs.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'tick';
      b.type = 'button';
      b.style.left = (s.start / total) * 100 + '%';
      b.style.width = (s.duration / total) * 100 + '%';
      b.title = `${s.title_ja}${s.title_zh ? ' · ' + s.title_zh : ''}`;
      b.setAttribute('aria-label', `第${i + 1}段 ${s.title_ja}`);
      b.addEventListener('click', () => { seek(s.start + 0.01); pokeUI(); });
      ticks.appendChild(b);
    });
    const scrub = $('scrub');
    scrub.max = String(total);
    scrub.addEventListener('input', () => { seek(parseFloat(scrub.value)); lastScrub = T; pokeUI(); });
    // nothing inside the control bar or the end screen plays/pauses the film
    $('bar').addEventListener('click', (e) => e.stopPropagation());
    $('end').addEventListener('click', (e) => { if (e.target !== $('btn-again')) e.stopPropagation(); });
    $('btn-play').addEventListener('click', () => { if (!started) start(); else toggle(); });
    $('btn-subs').addEventListener('click', () => setSubs(!subsOn));
    $('btn-sound').addEventListener('click', () => setMuted(!muted));
    $('btn-full').addEventListener('click', () => fullscreen());
    $('btn-start').addEventListener('click', (e) => { e.stopPropagation(); start(); });
    $('btn-again').addEventListener('click', (e) => { e.stopPropagation(); seek(0); play(); });
    // the whole curtain starts the film (mouse and touch)
    $('curtain').addEventListener('click', (e) => { e.stopPropagation(); if (!started) start(); });
    // on touch, a tap on the picture while the controls are hidden only shows them
    let revealOnly = false;
    stage.addEventListener('pointerdown', (e) => {
      revealOnly = started && e.pointerType !== 'mouse' && !document.body.classList.contains('ui') && !document.body.classList.contains('portrait');
    }, true);
    stage.addEventListener('click', () => {
      if (revealOnly) { revealOnly = false; pokeUI(); return; }
      if (!started) start(); else toggle();
    });
    for (const ev of ['mousemove', 'touchstart']) document.addEventListener(ev, pokeUI, { passive: true });
    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); });
    document.addEventListener('fullscreenchange', resizeSoon);
    window.addEventListener('resize', resizeSoon);
  }

  let subsOn = true;
  function setSubs(on) {
    subsOn = on;
    TSUKI.TEXT.setSubs(on);
    $('btn-subs').setAttribute('aria-pressed', String(on));
    try { localStorage.setItem('tsuki.subs', on ? '1' : '0'); } catch (e) { /* storage unavailable */ }
  }
  function setMuted(m) {
    muted = m;
    const A = AUDIO();
    if (A && A.setMuted) A.setMuted(m);
    $('btn-sound').setAttribute('aria-pressed', String(!m));
    $('btn-sound').classList.toggle('muted', m);
  }
  function fullscreen() {
    const el = $('theatre');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  }
  /** Create the AudioContext inside the user's gesture. */
  function initAudio() {
    if (audioOn) return;
    const A = AUDIO();
    if (A && A.init && !params.has('nosound')) {
      try { A.init(); A.setMuted && A.setMuted(muted); audioOn = true; } catch (e) { console.warn('audio init failed', e); }
    }
  }
  function ensureStarted() {
    if (started) return;
    initAudio();
    started = true;
    document.body.classList.add('started');
  }
  function start() {
    if (started) return;
    if (loading) {
      // the blocks are still being carved: keep the gesture's audio, start when ready
      initAudio();
      pendingStart = true;
      document.body.classList.add('pending');
      return;
    }
    ensureStarted();
    // the curtain shows the poster frame; the film itself begins at 0
    if (!params.has('t') && !params.has('seg')) seek(0);
    play();
  }
  function showEnd(on) {
    document.body.classList.toggle('ended', on);
    if (on) pokeUI();
  }
  function pokeUI() {
    lastUI = performance.now();
    document.body.classList.add('ui');
    clearTimeout(pokeUI._t);
    pokeUI._t = setTimeout(() => {
      if ((playing || document.body.classList.contains('ended')) && performance.now() - lastUI > 2400) document.body.classList.remove('ui');
    }, 2600);
  }
  function updateUI(t, i) {
    const ts = `${fmt(t)} / ${fmt(total)}`;
    if (ts !== uiTime) { uiTime = ts; $('time').textContent = ts; }
    const scrub = $('scrub');
    if (Math.abs(t - lastScrub) > total / Math.max(200, scrub.clientWidth || 0)) { lastScrub = t; scrub.value = t.toFixed(2); }
    if (i !== uiSegIdx) {
      uiSegIdx = i;
      const s = segs[i];
      $('seg-name').textContent = `${s.title_ja}${s.title_zh ? '　' + s.title_zh : ''}`;
      document.querySelectorAll('.tick').forEach((el, j) => el.classList.toggle('on', j === i));
    }
  }
  function onKey(e) {
    if (e.target && (e.target.tagName === 'INPUT' && e.target.type !== 'range')) return;
    const i = segIndexAt(T);
    switch (e.key) {
      case ' ': case 'k': case 'K':
        e.preventDefault();
        if (!started) start(); else toggle();
        break;
      case 'ArrowRight': e.preventDefault(); seek(i < segs.length - 1 ? segs[i + 1].start + 0.01 : T); break;
      case 'ArrowLeft': e.preventDefault(); seek(T - segs[i].start > 2 ? segs[i].start + 0.01 : segs[Math.max(0, i - 1)].start + 0.01); break;
      case 'l': case 'L': seek(T + 5); break;
      case 'j': case 'J': seek(T - 5); break;
      case 'f': case 'F': fullscreen(); break;
      case 'c': case 'C': setSubs(!subsOn); break;
      case 'm': case 'M': setMuted(!muted); break;
      default: return;
    }
    pokeUI();
  }

  /* ------------------------------------------------------------------ */
  /* boot                                                                */
  /* ------------------------------------------------------------------ */
  function normaliseScript(s) {
    let t = 0;
    s.segments.forEach((seg, i) => {
      seg.index = i;
      seg.start = t;
      t += seg.duration;
    });
    return t;
  }

  ENGINE.boot = () => {
    script = TSUKI.SCRIPT;
    segs = script.segments;
    total = normaliseScript(script);
    stage = $('stage');
    canvas = $('film');
    overlay = $('overlay');
    ctx = canvas.getContext('2d', { alpha: false });
    bufA = B.canvas(1, 1); bufB = B.canvas(1, 1); bufM = B.canvas(1, 1);
    ctxA = bufA.getContext('2d'); ctxB = bufB.getContext('2d'); ctxM = bufM.getContext('2d');
    TSUKI.PAPER.build(W, H);
    // after a resize, blocks are re-carved in the background only while paused
    if (TSUKI.PRINT) TSUKI.PRINT.deferWhile = () => playing;
    if (NOPAPER) document.body.classList.add('nopaper');
    else if ($('paper-grain') && $('paper-light')) TSUKI.PAPER.mount($('paper-grain'), $('paper-light'), paperStrength());
    TSUKI.TEXT.init(overlay, $('subs'), script);
    buildUI();
    try { setSubs(localStorage.getItem('tsuki.subs') !== '0'); } catch (e) { setSubs(true); }
    setMuted(params.has('nosound'));
    let t0 = 0;
    if (params.has('t')) t0 = parseFloat(params.get('t')) || 0;
    if (params.has('seg')) {
      const s = segs.find((x) => x.id === params.get('seg'));
      if (s) t0 = s.start + (parseFloat(params.get('st')) || 0);
    }
    if (!params.has('t') && !params.has('seg') && script.posterT != null) t0 = script.posterT;
    T = U.clamp(t0, 0, total - 1e-3);
    // size the stage now, but paint nothing heavy: the curtain comes first
    resize({ render: false });
    if (STILL) document.body.classList.add('still');
    document.body.classList.add('paused', 'loading');
    requestAnimationFrame(frame);
    // Load every face up front: subset faces load lazily for DOM text, but
    // canvas text (seals, the painted title panel) needs them in memory too.
    const fontsReady = document.fonts && document.fonts.ready
      ? Promise.all([...document.fonts].map((f) => f.load().catch(() => null))).then(() => document.fonts.ready)
      : Promise.resolve();
    // warm-up: carve every shot's blocks and run every scene's init() before
    // the film starts, so nothing stalls mid-film — ONE unit per task, so the
    // curtain stays responsive and shows the progress. The poster's shot
    // first; the poster frame is painted as soon as it can be.
    const P = TSUKI.PRINT;
    const posterSeg = segs[segIndexAt(T)];
    const units = [];
    const unit = (name, fn) => { fn.label = name; units.push(fn); };
    unit('paper', () => { if (!NOPAPER && TSUKI.PAPER.mounted()) TSUKI.PAPER.fit(canvas.width, canvas.height); });
    const initUnit = (seg) => () => {
      const sc = scenes[seg.id];
      if (sc && !sc._inited && sc.init) {
        try { sc.init(sceneCtx(seg)); } catch (e) { errors[seg.id] = String(e && e.stack || e); console.error(`[scene ${seg.id} init]`, e); }
      }
      if (sc) sc._inited = true;
    };
    const shotUnit = (id) => () => {
      try { if (!P.isBuilt(id)) P.shot(id); } catch (e) { errors.print = String(e && e.stack || e); console.error('[print]', id, e); }
    };
    if (P && P.has('A')) unit('shot A', shotUnit('A'));
    unit('init ' + posterSeg.id, initUnit(posterSeg));
    unit('poster', () => render(T));                   // the poster behind the curtain
    unit('kasumi', bakeKasumi);                        // the すやり霞 bands, carved before the film
    for (const seg of segs) if (seg !== posterSeg) unit('init ' + seg.id, initUnit(seg));
    if (P) for (const id of P.ids()) unit('shot ' + id, shotUnit(id));
    const btn = $('btn-start');
    const log = (ENGINE.loadLog = []);
    const warm = async () => {
      for (let i = 0; i < units.length; i++) {
        await new Promise((r) => setTimeout(r, 0));
        const t0 = performance.now();
        units[i]();
        log.push([units[i].label, Math.round(performance.now() - t0)]);
        btn.style.setProperty('--load', Math.round(((i + 1) / units.length) * 100) + '%');
      }
    };
    ENGINE.ready = fontsReady.then(warm).then(() => {
      loading = false;
      document.body.classList.remove('loading', 'pending');
      if (!NOPAPER && TSUKI.PAPER.mounted()) TSUKI.PAPER.fit(canvas.width, canvas.height);
      liftSubs();
      render(T);
      if (pendingStart) { pendingStart = false; start(); }
      return true;
    });
    // capture / automation hooks
    window.__film = {
      ready: ENGINE.ready,
      get total() { return total; },
      get time() { return T; },
      segments: segs.map((s) => ({ id: s.id, start: s.start, duration: s.duration, title_ja: s.title_ja })),
      seek: (t) => { seek(t); return T; },
      render: (t) => { T = U.clamp(t, 0, total - 1e-3); render(T); return T; },
      play, pause,
      errors: () => ({ ...errors }),
      renderAudio: (t0, t1, sr) => (TSUKI.AUDIO && TSUKI.AUDIO.renderOffline ? TSUKI.AUDIO.renderOffline(t0, t1, sr) : Promise.resolve(null)),
      start: () => { started = true; document.body.classList.add('started'); },
    };
    if (params.has('autoplay')) ENGINE.ready.then(() => { started = true; document.body.classList.add('started'); play(); });
  };

  ENGINE.seek = (t) => seek(t);
  ENGINE.time = () => T;
  ENGINE.total = () => total;
  ENGINE.isPlaying = () => playing;
})(window.TSUKI = window.TSUKI || {});
