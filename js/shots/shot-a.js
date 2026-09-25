/* ==========================================================================
   shot-a.js — MASTER SHOT A · 庭 · the wide garden at Hiroshige scale.
   The film's home: 序 (being printed), 一 (moonrise), 四 (the tilt down,
   111–118), 六 (the 後摺, and the fox-window inset at T − 150).

   CARVED BLOCKS  PRINT.defineShot('A', { layers, worn: true, build })
     layers (back → front):
       'sky'      P6 bokashi night sky (wood grain) · P6i ichimonji · P8 kira
                  (後摺 P6~worn: flat pale 藍 down to the skyline)
       'far'      P6 紺 hills + ベロ藍 Fuji · P7 first snow · K Fuji contour
       'mistHigh' P7 suyari-gasumi y 585–625 (printed with a drift offset)
       'grove'    meadow, the moonlit yard, the bamboo grove behind the house
       'house'    the thatched house, shoji, engawa, 三方 & jug (empty);
                  後摺: sagging patched ridge, torn shoji, cups, lacquer box,
                  the jug's grey susuki
       'mistLow'  P7 kasumi y 780–805 (drift)
       'field'    far (P4 鼠) and mid (P3 尾花 / P1 stems / K) susuki
                  (後摺: taller, wilder, 鼠/銀鼠 plumes, crowding the house)
       'pond'     the land below the far bank, the pond (P5), banks, stones,
                  苔点, the spit with the tsukubai & sōzu frame, lantern, 萩 bush
                  (後摺: flat water, reeds over x 200–850, dry sōzu)
       'still'    序 only: near susuki, 萩 branch and sōzu tube at rest, so the
                  baren spiral reveals their key lines as well.
     PRINT.drawShot(ctx, 'A', T) alone gives a complete (figure-less) print.

   THE MOON  is a hole: MOON.draw clipped to A.SKY_MASK (at x 0–760 the sky runs
   down to the far pond bank ≈ y 831). Everything after 'sky' prints over it.

   ---------------------------------------------------------------------------
   TSUKI.SHOTS.A — helpers (every T is GLOBAL film time)

   A.drawGarden(ctx, T, opts)         the whole Shot A frame at T, back → front,
       exactly as 一 / 四 / 六 show it (plates + every live element).
       opts: moon:false          don't draw the moon (四's tilt draws ONE moon on top)
             moonAlpha 0..1      (序's dry disc)   glow 0..1 (moon's 山吹 bokashi ×)
             figures:false  offerings:false  near:false  hagi:false
             still:true          near susuki / 萩 / sōzu from the carved 'still'
                                 plates (序, while the key block is revealed)
             gazeOut 0..1        六 inset: 小夜 turns back → profile → ¾
             andon 0..1          override the andon light (default from T)
             camera:false        ignore 一's built-in push (38–40)
             late:bool           force the figures' 後摺 casting (default T ≥ 160)
             state               PRINT.state override (passed to PRINT)
             beforeNear(ctx,st)  hook drawn just before the near susuki
   A.drawSky(ctx,T) · A.drawMoon(ctx,T,{alpha,glow}) · A.drawFar(ctx,T)
   A.drawMist(ctx,T,'high'|'low')     the kasumi plates, printed with their drift
   A.drawGrove(ctx,T) · A.drawHouse(ctx,T,{andon}) (house + the andon light, P2)
   A.drawField(ctx,T) · A.drawPondLayer(ctx,T)
   A.drawPond(ctx,T,opts)             live water: moon road + 小夜's reflection
   A.drawOfferings(ctx,T,opts)        dango (count by T), dish & steam, jug flowers
   A.drawFigures(ctx,T,opts)          たけ / 小夜 (old 小夜 from 160) on their paths
   A.drawNearSusuki(ctx,T,opts)       ≈150 live plumes; opts.split 'back'|'front'
                                      + opts.depth (y) to depth-sort around figures
   A.drawHagi(ctx,T) · A.drawSozu(ctx,T) · A.drawFlorets(ctx,T) · A.drawGlints(ctx,T)
   A.moon(T) → {x,y,r} (= MOON.A)     A.SKY_MASK · A.POND (Path2D: main pond + moon-pool)
   A.cropTransform(ctx, {scale, about:[x,y], to:[x,y]})   (六's inset crop)
   A.wind(T) → {breeze, gust}         the one wind of the garden (t_abs; the gusts are
                                      TSUKI.CUES.gustAt — the score's own curve)
   A.take(T) / A.sayo(T, opts)        the figure path tables (A.STEAL: the theft's spot)
   A.DANGO_TIMES / A.DANGO_TIMES_LATE the koto plucks the dango land on (TSUKI.CUES)
   A.GEO                              key coordinates (house, engawa, offerings…)
   A.livePen(ctx, T)                  pen(id, fn) … pen.flush(): live drawing
                                      printed plate by plate in PRINT.ORDER
   A.drawLate(ctx, T)                 六: the whole 後摺 garden, AGED (鳥の子 + foxing,
                                      the moon exempt) + the hand-applied 退紅 strip.
                                      Live through the jolt (160.0–160.62, the worn
                                      blocks replacing the fresh at its first peak,
                                      160.05); after it, one cached snapshot + the
                                      live things in aged inks (~5 ms at 1280)
   A.warmLate(k)                      build that snapshot for backing scale k (init)
   A.drawStrip(ctx, T, a)             the 退紅 strip on the jug (Shot A scale)
   A.aged(hex)                        a colour × the 後摺 paper's yellowing
   A.ageFrame(ctx, T, opts)           PRINT.age with a cheap foxing upscale (≈5 ms, not 24)
   Performance notes: unscaled plate blits run with image smoothing off (the
   plates are 1:1 with the stage), and 一's push (38–40) prints the frame 1:1
   into a buffer and scales the finished impression once.
   ========================================================================== */
(function (TSUKI) {
  'use strict';

  const U = TSUKI.U, B = TSUKI.B, C = TSUKI.C;
  const PRINT = TSUKI.PRINT, MOON = TSUKI.MOON;
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  TSUKI.SHOTS = TSUKI.SHOTS || {};
  const A = (TSUKI.SHOTS.A = TSUKI.SHOTS.A || {});

  /* ------------------------------------------------------------------ */
  /* inks                                                                */
  /* ------------------------------------------------------------------ */
  const INK = {
    ichi: U.mix(C.bero, C.sumi, 0.35),
    susutake: U.mix(C.odo, C.sumi, 0.55),          // 煤竹 wood
    board: U.mix(C.odo, C.sumi, 0.42),
    ainezu: U.mix(C.ai, C.nezumi, 0.5),            // 藍鼠
    ebicha: U.mix(C.shu, C.sumi, 0.45),            // 海老茶
    thatch: U.mix(C.odo, C.kuchiba, 0.3),
    thatchHi: U.mix(C.susuki, C.kinari, 0.25),
    thatchLo: U.mix(C.odo, C.sumi, 0.3),
    plaster: U.mix(C.odo, C.kinari, 0.55),
    earth: U.mix(C.odo, C.kinari, 0.4),
    earthDk: U.mix(C.odo, C.rikyu, 0.55),
    meadow: U.mix(C.rikyu, C.matsuba, 0.5),
    moss: U.mix(C.matsuba, C.koke, 0.3),
    mossDk: U.mix(C.matsuba, C.sumi, 0.35),
    stone: U.mix(C.nezumi, C.ginnezu, 0.35),
    stoneDk: U.mix(C.nezumi, C.sumi, 0.3),
    under: U.mix(C.sumi, C.ai, 0.22),
    bamboo: U.mix(C.aotake, C.matsuba, 0.55),
    bambooLeaf: U.mix(C.matsuba, C.sumi, 0.25),
    hagiDk: U.mix(C.hagi, C.beni, 0.35),
    hagiLt: U.mix(C.hagi, C.kinari, 0.35),
    lacquer: U.mix(C.sumi, C.enji, 0.12),
  };
  A.INK = INK;

  /* the 後摺's paper: PRINT.age multiplies the frame by 鳥の子 at α 0.5 — the
     same factor, applied to a colour or baked into a sprite at build time */
  const AGE_F = U.hexToRgb(C.torinoko).map((v) => 0.5 + 0.5 * (v / 255));
  const aged = (hex) => { const c = U.hexToRgb(hex); return U.rgbToHex(c[0] * AGE_F[0], c[1] * AGE_F[1], c[2] * AGE_F[2]); };
  A.aged = aged;
  /** multiply a sprite's colour channels by the paper's yellowing (alpha untouched; build time only) */
  function ageSprite(sp) {
    const cv = B.canvas(sp.cv.width, sp.cv.height), c = cv.getContext('2d');
    c.drawImage(sp.cv, 0, 0);
    const img = c.getImageData(0, 0, cv.width, cv.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) { d[i] *= AGE_F[0]; d[i + 1] *= AGE_F[1]; d[i + 2] *= AGE_F[2]; }
    c.putImageData(img, 0, 0);
    return Object.assign({}, sp, { cv });
  }
  /** PRINT.age with a cheap upscale of its foxing sprite (the 'high' resample alone costs ~20 ms) */
  function ageFrame(ctx, T, opts) {
    ctx.save();
    ctx.imageSmoothingQuality = 'low';
    PRINT.age(ctx, T, opts);
    ctx.restore();
  }
  A.ageFrame = ageFrame;
  /** the jolt (160.0–160.6): the worn blocks replace the fresh ones at the first peak of the shake */
  const JOLT_SWAP = 160.05;
  const blockWear = (T) => (T < PRINT.TIMES.jolt ? 0 : T < JOLT_SWAP ? 0 : 1);

  /* ------------------------------------------------------------------ */
  /* geometry                                                            */
  /* ------------------------------------------------------------------ */
  const bankY = (x) => 831 + 3.2 * Math.sin(x * 0.0085 + 0.7) + 1.8 * Math.sin(x * 0.023 + 2.1) + 1.0 * Math.sin(x * 0.061 + 0.3);
  const hillY = (x) => {
    const hump = (c, w, h) => h * Math.exp(-Math.pow((x - c) / w, 2));
    return 650 - hump(862, 110, 48) - hump(1060, 170, 64) - hump(1296, 150, 50) - hump(1470, 90, 32) - hump(760, 55, 16);
  };
  const FUJI = { px: 1720, py: 500, base: 622, x0: 1490, x1: 1960, top: 40 };
  const fujiY = (x) => {
    const d = Math.abs(x - FUJI.px) - FUJI.top / 2;
    if (d <= 0) {
      const u = (x - FUJI.px) / FUJI.top;
      return FUJI.py + (Math.abs(u + 0.12) < 0.1 ? 2.2 : 0) + (Math.abs(u - 0.2) < 0.06 ? 1.4 : 0);
    }
    const half = (x < FUJI.px ? FUJI.px - FUJI.x0 : FUJI.x1 - FUJI.px) - FUJI.top / 2;
    const s = U.clamp(d / half);
    return FUJI.py + (FUJI.base - FUJI.py) * (1 - Math.pow(1 - s, 2.15));
  };

  const GEO = {
    sky: 640, leftSkyX: 760,
    house: { x0: 900, x1: 1460, ridge: 430, eave: 560 },
    shoji: { x0: 984, x1: 1376, y0: 578, y1: 690 },
    engawa: { x0: 940, x1: 1420, y0: 690, y1: 706 },
    sanbo: [1000, 690], dish: [1036, 692], jug: [962, 690],
    take: [1060, 690], seat: [1022, 690], andon: [1150, 648],
    sozu: [322, 873], tsukubai: [420, 930],
    bankY, hillY, fujiY, fuji: FUJI,
  };
  A.GEO = GEO;

  /** Catmull-Rom densify. */
  function dense(pts, close, per) {
    const n = pts.length, out = [];
    const get = (i) => (close ? pts[(i + n) % n] : pts[U.clamp(i, 0, n - 1)]);
    const last = close ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      for (let j = 0; j < per; j++) {
        const s = j / per, s2 = s * s, s3 = s2 * s;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * s + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * s3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * s + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * s3),
        ]);
      }
    }
    if (!close) out.push(pts[n - 1].slice());
    return out;
  }
  const pathOf = (pts, close = true) => {
    const p = new Path2D();
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
    if (close) p.closePath();
    return p;
  };
  const smoothOf = (pts, close = true) => pathOf(dense(pts, close, 6), close);

  /** Sky mask: sky y < 640, and at x 0–760 down to the far pond bank. */
  const SKY_MASK = (() => {
    const p = new Path2D();
    p.moveTo(-40, -40); p.lineTo(W + 40, -40); p.lineTo(W + 40, 640); p.lineTo(780, 640);
    for (let x = 780; x >= -40; x -= 8) p.lineTo(x, bankY(Math.max(0, x)) - 1);
    p.closePath();
    return p;
  })();
  A.SKY_MASK = SKY_MASK;

  /**
   * The water: the main pond (far bank, east end, the open near side, the
   * spit's east shore) and, west of the spit — which runs from the far bank
   * out toward us, carrying the sōzu and the tsukubai — the small moon-pool
   * under the rising moon.
   */
  const POND_RAWS = (() => {
    const main = [];
    for (let x = 358; x <= 1540; x += 14) main.push([x, bankY(x)]);
    main.push([1562, 836], [1598, 846], [1630, 866], [1652, 898], [1660, 936], [1652, 976], [1630, 1016], [1604, 1052], [1586, 1100]);
    main.push([604, 1100], [586, 1080], [566, 1060], [552, 1046], [530, 1034], [514, 1016], [502, 994], [486, 976], [472, 958], [456, 936], [436, 916], [414, 900], [392, 890], [372, 878], [360, 860], [355, 845]);
    const pool = [];
    for (let x = 70; x <= 288; x += 14) pool.push([x, bankY(x)]);
    pool.push([294, 848], [292, 872], [288, 900], [286, 930], [288, 962], [292, 996], [290, 1046], [288, 1100]);
    pool.push([40, 1100], [42, 1040], [48, 990], [56, 940], [62, 892], [66, 860], [70, 842]);
    return [main, pool];
  })();
  const POND_PTSS = POND_RAWS.map((raw) => dense(raw, true, 4));
  const POND = (() => { const p = new Path2D(); for (const pts of POND_PTSS) p.addPath(pathOf(pts, true)); return p; })();
  A.POND = POND;
  let pondTestCtx = null;
  function inPond(x, y) {
    if (!pondTestCtx) pondTestCtx = B.canvas(2, 2).getContext('2d');
    return pondTestCtx.isPointInPath(POND, x, y);
  }

  /* ------------------------------------------------------------------ */
  /* small helpers                                                       */
  /* ------------------------------------------------------------------ */
  /** Thin lens from (x0,y0) to (x1,y1) through control (cx,cy), max width ≈ w. */
  function sliver(p, x0, y0, cx, cy, x1, y1, w) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
    const nx = (-dy / L) * w, ny = (dx / L) * w;
    p.moveTo(x0, y0);
    p.quadraticCurveTo(cx + nx, cy + ny, x1, y1);
    p.quadraticCurveTo(cx - nx, cy - ny, x0, y0);
  }
  /** Tapered stroke polygon along pts (w0 → w1) added to a Path2D. */
  function taperPath(p, pts, w0, w1, belly) {
    const n = pts.length;
    if (n < 2) return;
    belly = belly || 0;
    const L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const s = i / (n - 1);
      const w = (U.lerp(w0, w1, s) + belly * Math.sin(s * Math.PI) * Math.max(w0, w1)) / 2;
      L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
      R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    p.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) p.lineTo(L[i][0], L[i][1]);
    for (let i = n - 1; i >= 0; i--) p.lineTo(R[i][0], R[i][1]);
    p.closePath();
  }
  /** A carved key line along a polyline: width breathes with noise, with a few nicks. */
  function carvedLine(p, pts, w, seed, nick) {
    const r = U.rng(seed);
    let seg = [];
    for (let i = 0; i < pts.length; i++) {
      seg.push(pts[i]);
      const cut = nick && seg.length > 8 && r() < nick;
      if (seg.length >= 14 || i === pts.length - 1 || cut) {
        if (seg.length > 1) {
          const a = U.lerp(0.55, 1.25, U.noise1(i * 0.21, seed)) * w, b = U.lerp(0.55, 1.25, U.noise1((i + 7) * 0.21, seed)) * w;
          taperPath(p, seg, a, b, 0.15);
        }
        seg = cut ? [] : [pts[i]];
      }
    }
  }
  const qpts = (x0, y0, cx, cy, x1, y1, n) => {
    const o = [];
    for (let i = 0; i <= n; i++) o.push(U.qbez([x0, y0], [cx, cy], [x1, y1], i / n));
    return o;
  };
  const inkLine = (c, path, a, w, col) => {
    c.strokeStyle = U.rgba(col || C.sumi, a);
    c.lineWidth = w;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.stroke(path);
  };
  /** 木目: the faint grain of the cherry block in a flat plate (destination-out). */
  function woodGrain(c, clip, x0, y0, w, h, seed, a) {
    const r = U.rng(seed);
    c.save();
    if (clip) c.clip(clip);
    c.globalCompositeOperation = 'destination-out';
    c.lineCap = 'round';
    for (let i = 0; i < h / 5.5; i++) {
      const y = y0 + i * 5.5 + r() * 4;
      c.strokeStyle = `rgba(0,0,0,${U.lerp(0.2, 1, r()) * a})`;
      c.lineWidth = U.lerp(0.6, 1.6, r());
      c.beginPath();
      const ph = r() * 10, amp = U.lerp(0.6, 3.2, r()), f = U.lerp(0.002, 0.007, r());
      const xs = x0 + r() * w * 0.6, xe = Math.min(x0 + w, xs + U.lerp(0.25, 1, r()) * w);
      for (let x = xs; x <= xe; x += 24) {
        const yy = y + Math.sin(x * f + ph) * amp + U.wobble(x * 0.01 + i, seed) * 1.2;
        x === xs ? c.moveTo(x, yy) : c.lineTo(x, yy);
      }
      c.stroke();
    }
    c.restore();
  }

  /** Pens: build → the carved plate; live → PRINT.with per plate, flushed in ORDER. */
  function buildPen(P, layer) {
    return (id, fn) => {
      const c = P(layer, id);
      c.save();
      fn(c);
      c.restore();
    };
  }
  function livePen(ctx, T) {
    const q = {};
    const pen = (id, fn) => { (q[id] || (q[id] = [])).push(fn); };
    pen.flush = () => {
      for (const id of PRINT.ORDER) {
        const a = q[id];
        if (!a) continue;
        PRINT.with(ctx, id, T, (c) => {
          for (const f of a) {
            c.save();
            if (id === 'P8') c.globalCompositeOperation = 'lighter';
            f(c);
            c.restore();
          }
        });
      }
      for (const k of Object.keys(q)) delete q[k];
    };
    return pen;
  }
  A.livePen = livePen;

  /** Late-impression wear on a hand-carved ~worn plate (logical coords). */
  function wearPlate(c, id, seed) {
    const r = U.rng(seed);
    // where is the block inked, and how dark? (build time: one readback per plate)
    const cv = c.canvas, q = cv.width / W;
    const img = c.getImageData(0, 0, cv.width, cv.height).data;
    const at = (x, y) => {
      const px = Math.min(cv.width - 1, Math.max(0, Math.floor(x * q))), py = Math.min(cv.height - 1, Math.max(0, Math.floor(y * q)));
      const o = (py * cv.width + px) * 4;
      return [img[o + 3], 0.3 * img[o] + 0.55 * img[o + 1] + 0.15 * img[o + 2]];
    };
    c.save();
    c.globalCompositeOperation = 'destination-out';
    if (id === 'K') {
      // dash-gaps in the lines (≤ 8% of their length), not holes in solid blacks
      const p = new Path2D();
      for (let i = 0; i < 4200; i++) {
        const x = r() * W, y = r() * H, rr = U.lerp(0.8, 2.0, r()), a = r() * Math.PI, e = U.lerp(1, 2.2, r());
        const [al] = at(x, y);
        if (al < 8) continue;
        // skip the inside of large solid areas: probe a ring around the speck
        let solid = 0;
        for (let k = 0; k < 6; k++) { const aa = (k / 6) * TAU; if (at(x + Math.cos(aa) * 5, y + Math.sin(aa) * 5)[0] > 200) solid++; }
        if (solid >= 5) continue;
        p.moveTo(x + Math.cos(a) * rr * e, y + Math.sin(a) * rr * e);
        p.ellipse(x, y, rr * e, rr, a, 0, TAU);
      }
      c.fillStyle = '#000';
      c.fill(p);
      c.lineCap = 'round';
      c.strokeStyle = '#000';
      for (let i = 0; i < 7; i++) {
        let x = r() * W, y = r() * H;
        c.lineWidth = U.lerp(0.9, 1.8, r());
        c.beginPath();
        c.moveTo(x, y);
        const len = U.lerp(120, 420, r());
        for (let s = 0; s < len; s += 12) { x += 12; y += U.lerp(-2, 2, r()); c.lineTo(x, y); }
        c.stroke();
      }
    } else {
      // goma-zuri: fine pores where the worn block no longer holds pigment —
      // 0.5–1.5 px, on the light and mid inks only (never snow on dark water)
      const p = new Path2D(), p2 = new Path2D();
      for (let i = 0; i < 5200; i++) {
        const x = r() * W, y = r() * H, sz = U.lerp(0.5, 1.5, r()), soft = r() < 0.5;
        const [al, lum] = at(x, y);
        if (al < 40 || lum < 60 || (id === 'P5' && r() < 0.85)) continue;
        (soft ? p2 : p).rect(x, y, sz, sz * U.lerp(0.7, 1.3, r()));
      }
      c.fillStyle = 'rgba(0,0,0,0.7)';
      c.fill(p);
      c.fillStyle = 'rgba(0,0,0,0.35)';
      c.fill(p2);
    }
    c.restore();
  }

  /* ------------------------------------------------------------------ */
  /* the wind (t_abs): frozen until 13, then breathing + gusts           */
  /* ------------------------------------------------------------------ */
  // the gusts are the score's (TSUKI.CUES.gustAt): the plumes lean on the same curve the wind is heard on
  const GUSTS = [13, 19.5, 27, 35, 114.2, 163.8, 177.4, 193.2];
  function wind(T) {
    const breeze = T < 13 ? 0 : U.smoothstep(13, 14.8, T) * (T >= 160 ? 0.8 : 1);
    let gust = 0;
    const CU = TSUKI.CUES;
    if (CU && CU.gustAt && TSUKI.AUDIO && TSUKI.AUDIO.gustEnv) gust = U.clamp(CU.gustAt(T));
    else for (const g of GUSTS) if (T > g && T < g + 9) gust = Math.max(gust, T < g + 1 ? U.smoothstep(g, g + 1, T) : Math.exp((-2.3 * (T - g - 1)) / 3));
    return { breeze, gust: gust * (T >= 160 ? 0.75 : 1) };
  }
  A.wind = wind;
  /** Lean (radians, + = toward +x) of a plant at x with phase ph. */
  function leanAt(T, x, ph, w) {
    w = w || wind(T);
    if (w.breeze <= 0 && w.gust <= 0) return 0;
    return U.deg(4.2) * w.gust
      + w.breeze * (U.deg(1.7) * Math.sin(0.9 * T + 0.004 * x + ph) + U.deg(0.7) * U.wobble(T * 0.55 + ph * 3.1, 7))
      + U.deg(0.8) * w.gust * Math.sin(2.1 * T + 0.01 * x + ph);
  }

  /* ------------------------------------------------------------------ */
  /* susuki                                                              */
  /* ------------------------------------------------------------------ */
  /**
   * One clump {x, y, h, n, spread, seed, blades, hairs, side, kf}: emits into
   * path buckets (stems, blades, bladesLt, hairs, hairsHi, key).
   */
  function clumpInto(o, lean, out, opts) {
    const r = U.rng(o.seed);
    if (o.lean) lean += o.lean;
    const n = o.n;
    const keyAll = opts && opts.keyAll;
    const big = o.h > 120 ? 1.25 : o.h < 50 ? 0.8 : 1;
    const nb = o.blades == null ? 4 : o.blades;
    for (let i = 0; i < nb; i++) {
      const side = i % 2 ? 1 : -1;
      const L = o.h * U.lerp(0.35, 0.64, r());
      const a0 = side * U.lerp(0.16, 0.7, r()) + lean * 0.6;
      const bx = o.x + U.lerp(-3, 3, r());
      const cx = bx + Math.sin(a0) * L * 0.72, cy = o.y - Math.cos(a0) * L * 0.72;
      const a1 = a0 + side * U.lerp(0.5, 1.15, r()) + lean * 0.8;
      const ex = cx + Math.sin(a1) * L * 0.52, ey = cy - Math.cos(a1) * L * 0.52 + L * 0.08;
      sliver(r() < 0.3 ? out.bladesLt : out.blades, bx, o.y, cx, cy, ex, ey, U.lerp(1.5, 2.5, r()) * big);
    }
    for (let i = 0; i < n; i++) {
      const u = n > 1 ? i / (n - 1) : 0.5;
      const L = o.h * U.lerp(0.78, 1.04, r());
      const a = (u - 0.5) * o.spread + U.lerp(-0.06, 0.06, r()) + lean;
      const bx = o.x + (u - 0.5) * 6;
      const tx = bx + Math.sin(a) * L, ty = o.y - Math.cos(a) * L * (1 - Math.abs(lean) * 0.25);
      const cxs = bx + Math.sin(a - lean * 0.55) * L * 0.5, cys = o.y - Math.cos(a) * L * 0.55;
      sliver(out.stems, bx, o.y, cxs, cys, tx, ty, U.lerp(0.9, 1.3, r()) * big);
      const side = U.clamp((o.side == null ? (r() < 0.5 ? -0.6 : 0.6) : o.side) + lean * 9, -1, 1);
      const hairs = o.hairs || 12;
      const tang = Math.atan2(tx - cxs, -(ty - cys));
      const PL = L * U.lerp(0.22, 0.3, r());
      const key = keyAll || r() < (o.kf == null ? 0.3 : o.kf);
      for (let k = 0; k < hairs; k++) {
        const v = k / (hairs - 1);
        const s = U.lerp(1.0, 0.8, v);
        const p = U.qbez([bx, o.y], [cxs, cys], [tx, ty], s);
        const th = tang + side * U.lerp(0.05, 1.15, Math.pow(v, 0.8)) + U.lerp(-0.12, 0.12, r());
        const hl = PL * U.lerp(1.0, 0.72, v) * U.lerp(0.85, 1.1, r());
        const th2 = th + side * U.lerp(0.35, 0.8, r());
        const mx = p[0] + Math.sin(th) * hl * 0.55, my = p[1] - Math.cos(th) * hl * 0.55;
        const ex = p[0] + Math.sin(th2) * hl, ey = p[1] - Math.cos(th2) * hl;
        const hi = v < 0.45 && r() < 0.55;
        sliver(hi ? out.hairsHi : out.hairs, p[0], p[1], mx, my, ex, ey, U.lerp(1.1, 1.7, r()) * big);
        if (key && (k % 2 === 0 || keyAll)) { out.key.moveTo(p[0], p[1]); out.key.quadraticCurveTo(mx, my, ex, ey); }
      }
      if (key) { out.key.moveTo(bx, o.y); out.key.quadraticCurveTo(cxs, cys, tx, ty); }
    }
  }
  const newBuckets = () => ({ stems: new Path2D(), blades: new Path2D(), bladesLt: new Path2D(), hairs: new Path2D(), hairsHi: new Path2D(), key: new Path2D() });

  /** Paint buckets through a pen. cols: {stem:[id,col], blade, bladeLt, hair, hairHi, key:[a,w]} */
  function paintBuckets(pen, b, cols) {
    const f = (bucket, spec) => { if (!spec) return; pen(spec[0], (c) => { c.fillStyle = spec[1]; c.fill(b[bucket]); }); };
    f('blades', cols.blade);
    f('bladesLt', cols.bladeLt || cols.blade);
    f('stems', cols.stem);
    f('hairs', cols.hair);
    f('hairsHi', cols.hairHi || cols.hair);
    if (cols.key) pen('K', (c) => inkLine(c, b.key, cols.key[0], cols.key[1]));
  }

  /* clump layouts ------------------------------------------------------ */
  function farClumps(late) {
    const r = U.rng(late ? 311 : 131);
    const out = [];
    for (let x = -10; x < 1930; x += U.lerp(7, 15, r())) {
      const d2 = x < 780 ? 1 : x < 880 ? 0.6 : x > 1490 ? 0.45 : 0;
      if (r() > d2) continue;
      let y = x < 760 ? U.lerp(704, 776, r()) : U.lerp(650, 702, r());
      let h = U.lerp(18, 34, r()) * (late ? 1.35 : 1) * (x < 760 ? 1.15 : 1);
      // the poster frame (T 21): over the rising disc (x 40–300) the far field is only a low fringe
      if (!late && x > 36 && x < 304) { y = Math.max(y, U.lerp(772, 792, r())); h = Math.min(h, y - 764); }
      out.push({ x, y, h, n: 2 + Math.floor(r() * 2), spread: 0.6, seed: 5000 + out.length, blades: 2, hairs: 7, kf: 0 });
    }
    return out;
  }
  function midClumps(late) {
    const r = U.rng(late ? 977 : 797);
    const out = [];
    for (let x = -20; x < 1940; x += U.lerp(16, 30, r())) {
      let d2 = x < 760 ? 1 : x < 900 ? 0.8 : x > 1480 ? 0.55 : 0.0;
      if (late && x >= 760 && x < 960) d2 = x < 872 ? 1 : 0;   // crowding the house, but never over the 三方
      if (r() > d2) continue;
      const y = x < 760 ? U.lerp(778, 814, r()) : x < 960 ? U.lerp(716, 790, r()) : U.lerp(700, 792, r());
      let h = U.lerp(56, 104, r()) * (late ? 1.45 : 1);
      // the poster frame: over the disc only a low fringe (plume tops ≥ y 762) …
      if (!late && x > 36 && x < 312) h = Math.min(h, y - 762);
      else if (!late && x >= 312 && x < 360) h = Math.min(h, y - 720);
      out.push({ x, y, h, n: 2 + Math.floor(r() * 3), spread: 0.7, seed: 7000 + out.length, blades: 3, hairs: 10, kf: 1, side: U.lerp(-0.2, 0.9, r()), moon: x < 400 });
    }
    // … and two isolated plumes framing the child, leaning away from her,
    // silhouetted across the disc's rims (武蔵野図屏風)
    if (!late) {
      out.push({ x: 66, y: 806, h: 150, n: 2, spread: 0.18, seed: 7901, blades: 2, hairs: 13, kf: 1, side: -0.9, lean: -0.3, moon: true });
      out.push({ x: 84, y: 810, h: 108, n: 1, spread: 0.1, seed: 7903, blades: 1, hairs: 12, kf: 1, side: -0.7, lean: -0.46, moon: true });
      out.push({ x: 262, y: 808, h: 136, n: 2, spread: 0.2, seed: 7902, blades: 2, hairs: 13, kf: 1, side: 0.9, lean: 0.34, moon: true });
    }
    return out.sort((a, b) => a.y - b.y);
  }
  function nearClumps(late) {
    const r = U.rng(late ? 6161 : 1616);
    const out = [];
    const add = (x, y, h, n, extra) => out.push(Object.assign({ x, y, h, n, spread: U.lerp(0.55, 0.95, r()), seed: (late ? 90000 : 30000) + out.length * 17, blades: n > 4 ? 6 : 4, hairs: 12, kf: 0.3, side: U.lerp(-0.1, 1, r()) }, extra || {}));
    for (let x = -24; x < (late ? 900 : 790); x += U.lerp(26, 40, r())) {
      const y = bankY(Math.max(0, x)) - U.lerp(1, 12, r());
      const inWin = x > 30 && x < 330;
      let h = inWin ? U.lerp(34, 56, r()) : U.lerp(96, 176, r());
      if (!inWin && x > 330 && x < 420) h *= 0.8;
      if (late) h = inWin ? U.lerp(60, 120, r()) : U.lerp(150, 250, r());
      // 後摺: wild up to the house's left corner, but leaning away from the 三方 and never over it
      const nearHouse = late && x > 760;
      if (nearHouse) h = Math.min(h, 150);
      add(x, y, h, inWin ? 3 : 5 + Math.floor(r() * 4), nearHouse ? { side: -0.7, lean: -0.18, spread: 0.5 } : undefined);
    }
    add(22, 1000, late ? 240 : 170, 6, { side: 1, dark: true });
    add(-10, 1074, late ? 290 : 215, 7, { side: 1, dark: true });
    add(372, 1086, late ? 230 : 160, 6, { side: -0.4, dark: true });
    add(442, 1098, late ? 200 : 132, 5, { side: 0.3, dark: true });
    add(918, 748, late ? 96 : 64, 4, late ? { side: -0.5, lean: -0.12, spread: 0.5 } : { side: 0.6 });
    add(897, 760, late ? 140 : 82, 5, late ? { side: -0.4, lean: -0.08, spread: 0.6 } : { side: 0.8 });
    add(1700, 868, late ? 200 : 128, 6, { side: -0.3 });
    add(1752, 884, late ? 220 : 146, 7, { side: 0.2 });
    add(1810, 874, late ? 190 : 118, 5, { side: 0.4 });
    add(1880, 1010, late ? 260 : 190, 7, { side: -0.6, dark: true });
    add(1760, 1090, late ? 240 : 170, 6, { side: -0.2, dark: true });
    if (late) {
      add(868, 744, 104, 6, { side: -0.6, lean: -0.16, spread: 0.5 });   // keeps x 975–1025 (the 三方) clear
      add(830, 772, 190, 7, { side: -0.5, lean: -0.12 });
      add(410, 1020, 150, 5, { dark: true });
    }
    return out.sort((a, b) => a.y - b.y);
  }
  const NEAR = nearClumps(false), NEAR_LATE = nearClumps(true);

  /* ------------------------------------------------------------------ */
  /* 萩 — the foreground branch hanging in from the top-left             */
  /* ------------------------------------------------------------------ */
  const HAGI = (() => {
    const r = U.rng(4417);
    // main stems: [x0,y0, cx,cy, x1,y1, weight]
    const spec = [
      [-50, 4, 150, 22, 356, 232, 1.0],
      [-44, 52, 96, 80, 252, 258, 0.85],
      [-10, -40, 220, -18, 388, 150, 0.82],
      [-50, 118, 50, 140, 150, 246, 0.64],
      [100, -50, 270, -30, 414, 76, 0.6],
      [-48, 24, 190, 50, 300, 196, 0.55],
      [30, -46, 200, -10, 330, 120, 0.5],
      [-50, 80, 120, 120, 206, 214, 0.45],
    ];
    const stems = [];
    const mk = (pts, k, depth) => {
      const N = pts.length, leaves = [], flowers = [], kids = [];
      for (let i = 2; i < N; i++) {
        const s = i / (N - 1);
        const side = i % 2 ? 1 : -1;
        const a = Math.atan2(pts[Math.min(N - 1, i + 1)][1] - pts[i - 1][1], pts[Math.min(N - 1, i + 1)][0] - pts[i - 1][0]);
        if (r() < 0.85) leaves.push({ i, a: a + side * U.lerp(0.7, 1.25, r()), L: U.lerp(9, 13.5, r()) * (1 - s * 0.3) * (0.75 + k * 0.35), tone: r() });
        if (s > 0.42 && r() < 0.34) flowers.push({ i, a: a + side * U.lerp(0.4, 1.0, r()), n: 3 + Math.floor(r() * 4), L: U.lerp(8, 15, r()) });
        if (depth === 0 && s > 0.3 && s < 0.85 && r() < 0.13) {
          const L = U.lerp(34, 70, r()) * k;
          const aa = a + side * U.lerp(0.35, 0.7, r());
          const [px, py] = pts[i];
          const ex = px + Math.cos(aa) * L, ey = py + Math.sin(aa) * L + L * 0.25;
          kids.push(mk(qpts(px, py, px + Math.cos(aa) * L * 0.5, py + Math.sin(aa) * L * 0.5 - 4, ex, ey, 9), k * 0.7, 1));
        }
      }
      flowers.push({ i: N - 1, a: Math.atan2(pts[N - 1][1] - pts[N - 3][1], pts[N - 1][0] - pts[N - 3][0]), n: depth ? 5 : 7 + Math.floor(k * 3), L: (depth ? 14 : 22) * (0.6 + k * 0.4) });
      return { pts, leaves, flowers, kids, k, w: depth ? 1.2 : 1.4 + 2.2 * k };
    };
    for (const [x0, y0, cx, cy, x1, y1, k] of spec) stems.push(mk(qpts(x0, y0, cx, cy, x1, y1, 40), k, 0));
    return stems;
  })();
  /** Paint the 萩 branch with sway angle `sw` (radians). */
  function paintHagi(pen, sw, late) {
    const piv = [-40, -40];
    const K = new Path2D(), pet = new Path2D(), leafA = new Path2D(), leafB = new Path2D(), leafC = new Path2D();
    const fl = new Path2D(), flDk = new Path2D(), flLt = new Path2D();
    const rot = (p, a) => {
      const dx = p[0] - piv[0], dy = p[1] - piv[1], ca = Math.cos(a), sa = Math.sin(a);
      return [piv[0] + dx * ca - dy * sa, piv[1] + dx * sa + dy * ca];
    };
    const draw = (st) => {
      const pts = st.pts.map((p, i) => rot(p, sw * (0.35 + 0.9 * (i / (st.pts.length - 1)))));
      taperPath(K, pts, st.w, 0.7, 0.05);
      for (const lf of st.leaves) {
        const p = pts[lf.i], a = lf.a + sw * 0.8;
        const px = p[0] + Math.cos(a) * 3.5, py = p[1] + Math.sin(a) * 3.5 + 1;
        pet.moveTo(p[0], p[1]); pet.lineTo(px, py);
        const tgt = lf.tone < 0.5 ? leafA : lf.tone < 0.85 ? leafB : leafC;
        for (const [da, kl] of [[0.15, 1], [-0.85, 0.78], [0.95, 0.78]]) {
          const aa = a + da + 0.45, L = lf.L * kl;     // leaflets droop a little
          const cx = px + Math.cos(aa) * L * 0.5, cy = py + Math.sin(aa) * L * 0.5;
          tgt.moveTo(cx + Math.cos(aa) * L * 0.5, cy + Math.sin(aa) * L * 0.5);
          tgt.ellipse(cx, cy, L * 0.52, L * 0.3, aa, 0, TAU);
        }
      }
      if (!late) {
        // racemes of small pea-flowers (旗弁 + 翼弁), drooping, irregular —
        // bigger open blossoms near the stem, dark buds at the tip
        for (const f of st.flowers) {
          const p = pts[f.i];
          const fr = U.rng(1000 + f.i * 7 + f.n * 131 + Math.round(p[0] * 3));
          const a0 = f.a + sw, down = Math.PI / 2;
          const n = f.n + 1;
          for (let j = 0; j < n; j++) {
            const u = j / Math.max(1, n - 1);
            const aa = U.lerp(a0, down, 0.3 + u * 0.5);
            const d = u * f.L * 1.1 + 2.5 + fr() * 1.5;
            const side = (fr() < 0.5 ? -1 : 1) * U.lerp(1.2, 3.4, fr());
            const x = p[0] + Math.cos(aa) * d + Math.cos(aa + Math.PI / 2) * side;
            const y = p[1] + Math.sin(aa) * d + Math.sin(aa + Math.PI / 2) * side;
            const rr = U.lerp(3.1, 1.3, u) * U.lerp(0.8, 1.2, fr());
            const bud = u > 0.78;
            const b = bud ? flDk : fr() < 0.28 ? flDk : fr() < 0.2 ? flLt : fl;
            const rot = aa + U.lerp(-0.9, 0.9, fr());
            if (bud) { b.moveTo(x + rr * 0.8, y); b.ellipse(x, y, rr * 0.8, rr * 0.5, rot, 0, TAU); continue; }
            // the standard (a rounded fan) and the two wings (a smaller lobe below)
            b.moveTo(x + Math.cos(rot) * rr, y + Math.sin(rot) * rr);
            b.ellipse(x, y, rr, rr * 0.62, rot, 0, TAU);
            const wx = x + Math.cos(rot + 1.9) * rr * 0.7, wy = y + Math.sin(rot + 1.9) * rr * 0.7;
            b.moveTo(wx + rr * 0.55, wy);
            b.ellipse(wx, wy, rr * 0.55, rr * 0.4, rot + 0.6, 0, TAU);
          }
        }
      }
      for (const kid of st.kids) draw(kid);
    };
    for (const st of HAGI) draw(st);
    pen('P3', (c) => {
      c.fillStyle = U.mix(C.matsuba, C.sumi, 0.2); c.fill(leafA);
      c.fillStyle = U.mix(C.matsuba, C.koke, 0.4); c.fill(leafB);
      c.fillStyle = U.mix(C.koke, C.wakatake, 0.35); c.fill(leafC);
    });
    pen('P2', (c) => { c.fillStyle = C.hagi; c.fill(fl); c.fillStyle = INK.hagiDk; c.fill(flDk); c.fillStyle = INK.hagiLt; c.fill(flLt); });
    pen('K', (c) => {
      c.fillStyle = U.rgba(C.sumi, 0.9); c.fill(K);
      inkLine(c, pet, 0.7, 0.7);
      inkLine(c, leafA, 0.5, 0.55); inkLine(c, leafB, 0.5, 0.55); inkLine(c, leafC, 0.5, 0.55);
    });
  }

  /* ------------------------------------------------------------------ */
  /* the sōzu tube                                                       */
  /* ------------------------------------------------------------------ */
  const SOZU = { px: 322, py: 873, L0: 38, L1: 30 };
  /** Tube angle (radians; + = spout end up) at T. */
  function sozuAngle(T) {
    const rest = U.deg(19);
    if (T >= 160 || T < 14) return rest + (T >= 160 ? U.deg(1.5) : 0);
    if (T < 39.8) return rest - U.deg(7) * U.seg(T, 14, 39.8, U.ease.inQuad);
    if (T < 39.92) return U.lerp(rest - U.deg(7), -U.deg(26), U.ease.inCubic(U.seg(T, 39.8, 39.92)));
    if (T < 40.0) return U.lerp(-U.deg(26), rest, U.ease.inQuad(U.seg(T, 39.92, 40.0)));
    return rest;
  }
  function paintSozuTube(pen, T, late) {
    const a = sozuAngle(T);
    const ca = Math.cos(a), sa = Math.sin(a);
    const x0 = SOZU.px - ca * SOZU.L0, y0 = SOZU.py - sa * SOZU.L0;
    const x1 = SOZU.px + ca * SOZU.L1, y1 = SOZU.py + sa * SOZU.L1;
    const tube = new Path2D();
    taperPath(tube, [[x0, y0], [x1, y1]], 6.4, 7.2, 0);
    const cut = new Path2D();
    cut.ellipse(x0, y0, 1.6, 3.4, a, 0, TAU);
    // 青竹: green bamboo toned with 黄土 (not a plastic green), a lit upper edge,
    // 墨 node rings and a dark cut face
    const hiL = new Path2D();
    hiL.moveTo(x0 + sa * 1.6 + ca * 3, y0 - ca * 1.6 + sa * 3); hiL.lineTo(x1 + sa * 1.6 - ca * 2, y1 - ca * 1.6 - sa * 2);
    pen('P3', (c) => {
      c.fillStyle = late ? U.mix(C.kuchiba, C.nezumi, 0.35) : U.mix(C.aotake, C.odo, 0.35);
      c.fill(tube);
      c.fillStyle = U.mix(INK.under, C.sumi, 0.4);
      c.fill(cut);
    });
    pen('P7', (c) => { c.strokeStyle = U.rgba(C.gofun, late ? 0.25 : 0.45); c.lineWidth = 1.1; c.lineCap = 'round'; c.stroke(hiL); });
    pen('K', (c) => {
      inkLine(c, tube, 0.9, 1.2);
      const nd = new Path2D();
      for (const s of [0.3, 0.74]) {
        const nx = U.lerp(x0, x1, s), ny = U.lerp(y0, y1, s);
        for (const o of [-0.7, 0.7]) {
          nd.moveTo(nx - sa * 3.6 + ca * o, ny + ca * 3.6 + sa * o);
          nd.quadraticCurveTo(nx + ca * (o + 0.9), ny + sa * (o + 0.9), nx + sa * 3.6 + ca * o, ny - ca * 3.6 + sa * o);
        }
      }
      if (late) { nd.moveTo(U.lerp(x0, x1, 0.4), U.lerp(y0, y1, 0.4) - 1); nd.lineTo(U.lerp(x0, x1, 0.62), U.lerp(y0, y1, 0.62) - 0.6); }
      inkLine(c, nd, 0.85, 1);
    });
    if (!late && T >= 14 && T < 39.8) {
      pen('P7', (c) => {
        c.strokeStyle = U.rgba(C.gofun, 0.6);
        c.lineWidth = 1.1;
        c.beginPath();
        c.moveTo(285, 853);
        c.quadraticCurveTo(286 + Math.sin(T * 9) * 0.4, 858, x0 + 2, y0 - 2);
        c.stroke();
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* PLATE PAINTERS                                                      */
  /* ------------------------------------------------------------------ */
  /** the skyline: top edge of everything in front of the sky (for the flat late sky) */
  const SKYLINE = (() => {
    const p = new Path2D();
    p.moveTo(-20, -20); p.lineTo(W + 20, -20);
    for (let x = W + 20; x >= -20; x -= 5) {
      let y;
      if (x >= 1490) y = Math.min(fujiY(x), 640);
      else if (x >= 790) y = Math.min(hillY(x), 660);
      else y = U.lerp(bankY(Math.max(0, x)) + 2, Math.min(hillY(x), 660), U.smoothstep(700, 790, x));
      p.lineTo(x, y);
    }
    p.closePath();
    return p;
  })();
  /** the 後摺's flat sky ink (applied at P6 α 0.55 by the print table): pale 藍 toward
   *  群青, and carved a shade bluer to allow for the 鳥の子 the paper will add — the ink
   *  film shields the paper under it, so the old sky still reads blue, never khaki */
  const LATE_SKY = (() => {
    const base = U.hexToRgb(U.mix(U.mix(C.ai, C.bero, 0.35), C.gunjo, 0.45));
    const t = U.hexToRgb(C.torinoko).map((v) => 0.5 + 0.5 * (v / 255));
    return U.rgbToHex(base[0] / t[0], base[1] / t[1], base[2] / t[2]);
  })();

  function paintSky(pen, late) {
    if (late) {
      // 後摺: one flat pale 藍 from a worn block — no bokashi, no ichimonji —
      // printed down to the far pond bank where the moon's sky runs behind the
      // susuki. Mixed toward ベロ藍 so that under the 鳥の子 yellowing it still
      // reads blue, not khaki.
      pen('P6', (c) => { c.fillStyle = LATE_SKY; c.fill(SKYLINE); woodGrain(c, null, 0, 0, W, 840, 71, 0.07); });
      return;
    }
    pen('P6', (c) => {
      const g = c.createLinearGradient(0, 0, 0, 845);
      g.addColorStop(0, U.mix(C.bero, C.kon, 0.18));
      g.addColorStop(0.2, C.bero);
      g.addColorStop(0.45, U.mix(C.bero, C.ai, 0.22));
      g.addColorStop(0.64, U.mix(C.bero, C.ai, 0.62));
      g.addColorStop(0.78, U.mix(C.ai, C.hanada, 0.22));
      g.addColorStop(1, U.mix(C.ai, C.hanada, 0.55));
      c.fillStyle = g;
      c.fillRect(0, 0, W, 845);
      woodGrain(c, null, 0, 0, W, 845, 17, 0.035);
      // where the moon rises (x 0–760) the sky's bokashi dies into the bare
      // paper at the horizon (y 600 → 740), as Hiroshige lets it: the rising
      // moon's 山吹 then prints on paper, not over blue
      c.save();
      c.globalCompositeOperation = 'destination-out';
      for (let x = -4; x < 860; x += 4) {
        const k = 1 - U.smoothstep(690, 840, x);
        if (k <= 0) break;
        const top = 596 - 10 * (1 - k);
        const g2 = c.createLinearGradient(0, top, 0, 748);
        g2.addColorStop(0, 'rgba(0,0,0,0)');
        g2.addColorStop(0.45, `rgba(0,0,0,${0.55 * k})`);
        g2.addColorStop(1, `rgba(0,0,0,${0.84 * k})`);
        c.fillStyle = g2;
        c.fillRect(x, top, 4.5, 250);
      }
      c.restore();
    });
    pen('P6i', (c) => {
      const col = INK.ichi;
      const g = c.createLinearGradient(0, 0, 0, 134);
      g.addColorStop(0, U.rgba(U.mix(col, C.sumi, 0.25), 1));
      g.addColorStop(0.3, U.rgba(col, 1));
      g.addColorStop(0.45, U.rgba(col, 0.96));
      g.addColorStop(0.62, U.rgba(col, 0.5));
      g.addColorStop(0.82, U.rgba(col, 0.14));
      g.addColorStop(1, U.rgba(col, 0));
      c.fillStyle = g;
      c.fillRect(0, 0, W, 132);
    });
    pen('P8', (c) => {
      const r = U.rng(808);
      const p = new Path2D(), p2 = new Path2D();
      for (let i = 0; i < 1500; i++) {
        const x = r() * W, y = Math.pow(r(), 1.25) * 640, s = U.lerp(0.5, 1.6, r());
        (r() < 0.2 ? p2 : p).rect(x, y, s, s);
      }
      c.fillStyle = U.rgba(C.gofun, 0.06);
      c.fill(p);
      c.fillStyle = U.rgba(C.gofun, 0.15);
      c.fill(p2);
    });
  }

  function paintFar(pen, late) {
    const hills = new Path2D();
    hills.moveTo(700, 700);
    for (let x = 700; x <= 1560; x += 5) hills.lineTo(x, hillY(x));
    hills.lineTo(1560, 700);
    hills.closePath();
    const fujiPts = [];
    for (let x = FUJI.x0 - 30; x <= FUJI.x1 + 10; x += 2) fujiPts.push([x, Math.min(700, fujiY(x))]);
    const fuji = new Path2D();
    fuji.moveTo(FUJI.x0 - 30, 700);
    for (const p of fujiPts) fuji.lineTo(p[0], p[1]);
    fuji.lineTo(FUJI.x1 + 10, 700);
    fuji.closePath();
    pen('P6', (c) => {
      if (late) {
        c.fillStyle = U.mix(C.kon, C.bero, 0.25);
        c.fill(hills);
        c.fillStyle = C.bero;
        c.fill(fuji);
        return;
      }
      let g = c.createLinearGradient(0, 580, 0, 700);
      g.addColorStop(0, U.mix(C.kon, C.koiai, 0.35));
      g.addColorStop(0.45, U.rgba(C.kon, 0.96));
      g.addColorStop(1, U.rgba(C.kon, 0.5));
      c.fillStyle = g;
      c.fill(hills);
      g = c.createLinearGradient(0, FUJI.py, 0, 650);
      g.addColorStop(0, U.mix(C.bero, C.koiai, 0.55));
      g.addColorStop(0.45, U.mix(C.bero, C.kon, 0.15));
      g.addColorStop(1, U.rgba(C.bero, 0.6));
      c.fillStyle = g;
      c.fill(fuji);
      woodGrain(c, fuji, FUJI.x0, FUJI.py, FUJI.x1 - FUJI.x0, 150, 23, 0.1);
    });
    const snow = new Path2D();
    const sx0 = FUJI.px - FUJI.top / 2 - 30, sx1 = FUJI.px + FUJI.top / 2 + 30;
    snow.moveTo(sx0, fujiY(sx0) - 0.5);
    for (let x = sx0; x <= sx1; x += 2) snow.lineTo(x, fujiY(x) - 0.6);
    const r = U.rng(51);
    for (let x = sx1; x >= sx0; x -= 2) {
      const d = 1 - Math.abs(x - FUJI.px) / (sx1 - FUJI.px);
      const finger = Math.pow(Math.max(0, Math.sin(x * 0.42 + 1.3)), 6) * U.lerp(5, 9, r());
      snow.lineTo(x, fujiY(x) + 4 + 4 * d + finger * d);
    }
    snow.closePath();
    pen('P7', (c) => { c.fillStyle = C.gofun; c.fill(snow); });
    pen('K', (c) => {
      const k = new Path2D();
      carvedLine(k, fujiPts.filter((p) => p[1] < 640), 1.25, 91, 0);
      c.fillStyle = U.rgba(C.sumi, 0.6);
      c.fill(k);
    });
  }

  /**
   * すやり霞 (suyari-gasumi), carved like a 瑞雲 block: one flat 胡粉 impression
   * (α a) made of 2–3 overlapping bars of different lengths — a stepped, lobed
   * end — with a crisp lower edge, a short bokashi (≈16 px) only along the
   * upper edge, both edges breathing a few px, and the entry end tapering to a
   * point over ~110 px like a brush laid down. Rasterised per pixel at build
   * time (union of the lobes = max, so overlaps never double the ink).
   * lobes: [{x0, x1, top, bot, taperL, taperR, capL, capR}] — taper (px) thins
   * the bar to a point; cap (px) rounds the end.
   */
  function mistBand(c, lobes, a, seed, q) {
    let bx0 = Infinity, bx1 = -Infinity, by0 = Infinity, by1 = -Infinity;
    for (const L of lobes) { bx0 = Math.min(bx0, L.x0); bx1 = Math.max(bx1, L.x1); by0 = Math.min(by0, L.top - 8); by1 = Math.max(by1, L.bot + 6); }
    bx0 = Math.max(0, Math.floor(bx0)); bx1 = Math.min(W, Math.ceil(bx1));
    const pw = Math.ceil((bx1 - bx0) * q), ph = Math.ceil((by1 - by0) * q);
    if (pw <= 0 || ph <= 0) return;
    const cv = B.canvas(pw, ph), cx = cv.getContext('2d');
    const img = cx.createImageData(pw, ph), d = img.data;
    const [cr, cg, cb] = U.hexToRgb(C.gofun);
    const fb = 16;
    const wav = (x, k) => (U.noise1(x * 0.012 + k * 7.1, seed + k) - 0.5) * 7 + (U.noise1(x * 0.05 + k, seed + 30 + k) - 0.5) * 2;
    for (let px = 0; px < pw; px++) {
      const x = bx0 + (px + 0.5) / q;
      const spans = [];
      for (let i = 0; i < lobes.length; i++) {
        const L = lobes[i];
        if (x < L.x0 || x > L.x1) continue;
        let top = L.top + wav(x, i * 2), bot = L.bot + wav(x, i * 2 + 1) * 0.6;
        const hgt = bot - top;
        // tapered entry / exit: the upper edge descends to the lower one
        if (L.taperL && x < L.x0 + L.taperL) { const u = (x - L.x0) / L.taperL; top = bot - hgt * Math.pow(Math.sin(u * Math.PI / 2), 0.85); }
        if (L.taperR && x > L.x1 - L.taperR) { const u = (L.x1 - x) / L.taperR; top = bot - hgt * Math.pow(Math.sin(u * Math.PI / 2), 0.85); }
        // rounded ends: an ellipse about the bar's middle
        const capAt = (dxe, cap) => { const u = U.clamp(1 - dxe / cap); const hh = Math.sqrt(Math.max(0, 1 - u * u)); const mid = (top + bot) / 2; top = mid - (mid - top) * hh; bot = mid + (bot - mid) * hh; };
        if (L.capL && x < L.x0 + L.capL) capAt(x - L.x0, L.capL);
        if (L.capR && x > L.x1 - L.capR) capAt(L.x1 - x, L.capR);
        if (bot - top > 0.2) spans.push([top, bot, Math.min(fb, (bot - top) * 0.7)]);
      }
      if (!spans.length) continue;
      for (let py = 0; py < ph; py++) {
        const y = by0 + (py + 0.5) / q;
        let al = 0;
        for (const [t0, b0, f] of spans) {
          if (y < t0 || y > b0 + 1) continue;
          const up = f > 0.5 ? U.smoothstep(t0, t0 + f, y) : 1;
          const lo = U.clamp(b0 - y + 0.5);
          al = Math.max(al, up * lo);
        }
        if (al <= 0) continue;
        const o = (py * pw + px) * 4;
        d[o] = cr; d[o + 1] = cg; d[o + 2] = cb; d[o + 3] = Math.round(255 * a * al);
      }
    }
    cx.putImageData(img, 0, 0);
    c.drawImage(cv, bx0, by0, pw / q, ph / q);
  }
  /** the three bands of Shot A (they drift, so their entry ends are tapered, their far ends stepped) */
  const MIST_BANDS = {
    high: [
      // y 585–625 across x 280–1320: tapered entry, a stepped lobed end behind the house
      { lobes: [{ x0: 262, x1: 1236, top: 586, bot: 626, taperL: 130, capR: 30 }, { x0: 620, x1: 1322, top: 604, bot: 626, capL: 24, capR: 18 }, { x0: 980, x1: 1276, top: 581, bot: 600, capL: 60, capR: 16 }], seed: 41 },
      // y 592–625 from x 1480, running off the frame: a stepped entry
      { lobes: [{ x0: 1478, x1: 1960, top: 596, bot: 626, capL: 26 }, { x0: 1530, x1: 1960, top: 588, bot: 606, capL: 20 }, { x0: 1440, x1: 1640, top: 610, bot: 627, capL: 14, capR: 22 }], seed: 43 },
    ],
    // y 780–805 across the field, entering from the left edge, its east end stepped short of the yard
    low: [{ lobes: [{ x0: 10, x1: 640, top: 780, bot: 806, taperL: 150, capR: 24 }, { x0: 380, x1: 700, top: 792, bot: 807, capL: 22, capR: 14 }, { x0: 160, x1: 520, top: 776, bot: 790, capL: 40, capR: 30 }], seed: 47 }],
  };
  function paintMist(pen, which, q) {
    pen('P7', (c) => { for (const b of MIST_BANDS[which]) mistBand(c, b.lobes, 0.55, b.seed, q || 1); });
  }

  /* the grove: meadow, the yard, bamboo --------------------------------- */
  /** the beaten-earth yard in front of the house: an irregular edge, never a ruled trapezoid */
  const YARD_PTS = (() => {
    const pts = [];
    const jig = (x, y, k, a) => [x + (U.noise1(k * 1.7, 61) - 0.5) * a, y + (U.noise1(k * 1.3, 62) - 0.5) * a * 0.4];
    // along the underfloor, then down the east side (worn into the meadow in
    // bays and tongues of grass), the far bank, up the west side along the fence
    for (let x = 900; x <= 1450; x += 25) pts.push([x, 713]);
    const E = [[1470, 720], [1488, 736], [1478, 752], [1500, 764], [1526, 776], [1516, 792], [1540, 806], [1570, 818], [1560, 830], [1590, 836]];
    E.forEach((p, i) => pts.push(jig(p[0], p[1], i + 3, 14)));
    for (let x = 1560; x >= 800; x -= 40) pts.push([x, bankY(x) + 4]);
    const Wd = [[786, 828], [804, 812], [800, 796], [822, 784], [842, 770], [838, 754], [860, 744], [880, 730]];
    Wd.forEach((p, i) => pts.push(jig(p[0], p[1], i + 11, 12)));
    return pts;
  })();
  const YARD = smoothOf(YARD_PTS, true);
  function paintGrove(pen, late) {
    const gp = new Path2D();
    gp.moveTo(700, 860);
    gp.lineTo(640, 764);
    gp.bezierCurveTo(690, 704, 730, 672, 780, 654);
    for (let x = 780; x <= W + 10; x += 20) gp.lineTo(x, Math.max(640, Math.min(hillY(x) + 24, 662)) + (x > 1480 ? -18 : 0));
    gp.lineTo(W + 10, 860);
    gp.closePath();
    // 苔点: moss in clusters of small irregular dabs (never ovals)
    const r = U.rng(91);
    const moss = new Path2D(), mossK = new Path2D();
    const dab = (p, x, y, s) => {
      const n = 5, a0 = r() * TAU;
      for (let k = 0; k <= n; k++) {
        const a = a0 + (k / n) * TAU, rr = s * U.lerp(0.6, 1.15, r());
        const px = x + Math.cos(a) * rr * 1.25, py = y + Math.sin(a) * rr * 0.8;
        k ? p.lineTo(px, py) : p.moveTo(px, py);
      }
      p.closePath();
    };
    const clusters = [[812, 812], [846, 790], [868, 822], [1488, 800], [1520, 824], [1462, 770], [1548, 818], [1236, 822], [960, 826]];
    for (const [cx, cy] of clusters) {
      const n = 3 + Math.floor(r() * 4);
      for (let i = 0; i < n; i++) {
        const x = cx + U.lerp(-14, 14, r()), y = cy + U.lerp(-5, 5, r());
        dab(moss, x, y, U.lerp(1.4, 2.6, r()));
        if (r() < 0.45) dab(mossK, x + U.lerp(-3, 3, r()), y + U.lerp(-2, 2, r()), U.lerp(0.7, 1.2, r()));
      }
    }
    pen('P3', (c) => {
      const g = c.createLinearGradient(0, 640, 0, 850);
      g.addColorStop(0, U.mix(INK.meadow, C.kon, 0.45));
      g.addColorStop(0.3, U.mix(INK.meadow, C.kon, 0.12));
      g.addColorStop(1, U.mix(INK.meadow, C.sumi, 0.3));
      c.fillStyle = g;
      c.save();
      const clip = new Path2D();
      clip.rect(-10, -10, W + 20, H + 20);
      clip.addPath(YARD);
      c.clip(clip, 'evenodd');
      c.fill(gp);
      c.restore();
    });
    pen('P1', (c) => {
      // flat moonlit earth; one wiped bokashi under the eaves' shadow
      c.fillStyle = U.mix(U.mix(INK.earth, C.rikyu, 0.5), C.sumi, 0.2);
      c.fill(YARD);
      c.save();
      c.clip(YARD);
      const g = c.createLinearGradient(0, 712, 0, 764);
      g.addColorStop(0, U.rgba(U.mix(INK.earthDk, C.sumi, 0.5), 0.75));
      g.addColorStop(1, U.rgba(U.mix(INK.earthDk, C.sumi, 0.5), 0));
      c.fillStyle = g;
      c.fillRect(760, 712, 840, 54);
      c.restore();
      woodGrain(c, YARD, 760, 700, 840, 140, 29, 0.05);
    });
    pen('P3', (c) => { c.fillStyle = U.mix(C.matsuba, C.koke, 0.25); c.fill(moss); });
    pen('K', (c) => { c.fillStyle = U.rgba(C.sumi, 0.6); c.fill(mossK); });
    // grass tufts along the yard's edges (the earth wears into the meadow)
    const tb = newBuckets();
    const rt = U.rng(late ? 919 : 191);
    const tuft = (x, y, hk) => clumpInto({ x, y, h: U.lerp(9, 20, rt()) * hk * (late ? 1.4 : 1), n: 0, spread: 0.9, seed: 7700 + Math.round(x * 3 + y), blades: 3 + Math.floor(rt() * 4) }, U.deg(3), tb);
    for (let i = 0; i < 16; i++) { const u = rt(); tuft(U.lerp(792, 890, u) + rt() * 10, U.lerp(830, 724, u) + rt() * 4, 1); }
    for (let i = 0; i < 16; i++) { const u = rt(); tuft(U.lerp(1470, 1580, u) + rt() * 10 - 5, U.lerp(718, 836, u), 1); }
    for (let i = 0; i < 9; i++) tuft(U.lerp(900, 1540, rt()), U.lerp(812, 834, rt()), 0.8);
    pen('P3', (c) => {
      c.fillStyle = U.mix(C.matsuba, C.sumi, 0.3); c.fill(tb.blades);
      c.fillStyle = U.mix(C.matsuba, C.koke, 0.35); c.fill(tb.bladesLt);
    });
    paintBamboo(pen, late);
    // a low 四つ目垣 (bamboo lattice fence) along the yard's left edge
    const fence = new Path2D(), fk = new Path2D();
    const pts = [[906, 716], [874, 744], [842, 772], [812, 800], [786, 826]];
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i], hgt = 24 + i * 3.5, w = 2.6 + i * 0.3;
      fence.rect(x - w / 2, y - hgt, w, hgt);
      fk.rect(x - w / 2, y - hgt, w, hgt);
    }
    for (const k of [0.3, 0.62, 0.9]) {
      const rail = pts.map(([x, y], i) => [x, y - (24 + i * 3.5) * k]);
      taperPath(fence, rail, 1.8, 2.4, 0);
      taperPath(fk, rail, 1.8, 2.4, 0);
    }
    for (let i = 0; i < pts.length - 1; i++) {
      for (const u of [0.33, 0.66]) {
        const x = U.lerp(pts[i][0], pts[i + 1][0], u), y = U.lerp(pts[i][1], pts[i + 1][1], u), hgt = 24 + (i + u) * 3.5;
        fence.rect(x - 0.9, y - hgt * 0.92, 1.8, hgt * 0.92);
        fk.moveTo(x, y - hgt * 0.92); fk.lineTo(x, y);
      }
    }
    pen('P1', (c) => { c.fillStyle = U.mix(C.kuchiba, C.odo, 0.5); c.fill(fence); });
    pen('K', (c) => inkLine(c, fk, 0.75, 0.8));
  }

  function paintBamboo(pen, late) {
    const r = U.rng(late ? 1717 : 717);
    const culms = new Path2D(), leaves = new Path2D(), leavesLt = new Path2D(), K = new Path2D();
    const xs = [1384, 1404, 1427, 1446, 1470, 1491, 1513, 1534];
    for (let i = 0; i < xs.length; i++) {
      const x = xs[i], top = U.lerp(330, 396, r()) - (late ? 16 : 0), lean = U.lerp(-0.03, 0.055, r());
      const pts = [];
      for (let k = 0; k <= 12; k++) { const s = k / 12; pts.push([x + lean * (700 - top) * s * s, U.lerp(700, top, s)]); }
      taperPath(culms, pts, 6.4, 3.0, 0);
      taperPath(K, pts, 7.6, 4.0, 0);
      for (let yy = 684; yy > top + 12; yy -= U.lerp(34, 44, r())) {
        const s = (700 - yy) / (700 - top), xx = x + lean * (700 - top) * s * s;
        K.moveTo(xx - 4.2, yy); K.lineTo(xx + 4.2, yy - 1.3); K.lineTo(xx + 4.2, yy + 0.3); K.lineTo(xx - 4.2, yy + 1.6); K.closePath();
      }
      for (let k = 0; k < 10; k++) {
        const s = U.lerp(0.6, 1.02, r());
        const yy = U.lerp(700, top, s), xx = x + lean * (700 - top) * s * s;
        const side = r() < 0.5 ? -1 : 1;
        const tx = xx + side * U.lerp(8, 20, r()), ty = yy - U.lerp(2, 10, r());
        K.moveTo(xx, yy); K.lineTo(tx, ty); K.lineTo(tx + 0.6, ty + 0.9); K.lineTo(xx, yy + 1.2); K.closePath();
        for (let j = 0; j < 4; j++) {
          const a = side * U.lerp(1.3, 2.3, r());
          const L = U.lerp(18, 30, r());
          const ex = tx + Math.sin(a) * L, ey = ty - Math.cos(a) * L;
          sliver(r() < 0.25 ? leavesLt : leaves, tx, ty, (tx + ex) / 2 + side * 2, (ty + ey) / 2 - 2, ex, ey, U.lerp(2.4, 3.6, r()));
        }
      }
    }
    pen('P3', (c) => {
      c.fillStyle = INK.bamboo; c.fill(culms);
      c.fillStyle = INK.bambooLeaf; c.fill(leaves);
      c.fillStyle = U.mix(C.matsuba, C.wakatake, 0.4); c.fill(leavesLt);
    });
    pen('K', (c) => { c.fillStyle = U.rgba(C.sumi, 0.55); c.fill(K); });
  }

  /** A flat stepping stone (飛石) seen low: an irregular slab, its moonlit top face, 墨 only along its shadowed lower edge. */
  function stoneInto(fillP, hiP, kP, x, y, w, h, seed) {
    const r = U.rng(seed);
    const pts = [];
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + r() * 0.25;
      const rr = U.lerp(0.8, 1.08, r());
      pts.push([x + Math.cos(a) * w * rr, y + Math.sin(a) * h * rr * (Math.sin(a) < 0 ? 0.8 : 1)]);
    }
    const dp = dense(pts, true, 4);
    fillP.addPath(pathOf(dp, true));
    // top face: the upper part of the slab, inset a little
    const top = dp.map(([px, py]) => [x + (px - x) * 0.86 - w * 0.04, Math.min(py, y) - h * 0.12 + (py - y) * 0.2]);
    hiP.addPath(pathOf(top, true));
    // key line: the lower (shadow) edge only
    const lower = dp.filter(([px, py]) => py >= y - h * 0.15).sort((a, b) => a[0] - b[0]);
    if (lower.length > 1) { kP.moveTo(lower[0][0], lower[0][1]); for (const p of lower) kP.lineTo(p[0], p[1]); }
  }
  /** A garden rock (景石) in the woodblock manner: a faceted body, its moonlit top plane, a shaded flank, 皴 lines. */
  function rockInto(R, x, y, w, h, seed) {
    const r = U.rng(seed);
    // 3–5 silhouettes: flat slabs, tall standing stones, a split crown, humped
    const kind = Math.floor(r() * 4);
    if (kind === 0) { w *= 1.25; h *= 0.62; } else if (kind === 1) { w *= 0.8; h *= 1.35; } else if (kind === 3) { w *= 1.05; h *= 0.85; }
    const j = (v, a) => v + U.lerp(-a, a, r());
    const pts = kind === 1
      ? [[x - w, y], [j(x - w * 0.8, w * 0.06), j(y - h * 0.62, h * 0.08)], [j(x - w * 0.35, w * 0.1), y - h], [j(x + w * 0.2, w * 0.08), j(y - h * 0.9, h * 0.05)],
        [j(x + w * 0.7, w * 0.08), j(y - h * 0.55, h * 0.1)], [j(x + w * 0.95, w * 0.04), j(y - h * 0.2, h * 0.1)], [x + w, y]]
      : kind === 3
        ? [[x - w, y], [j(x - w * 0.85, w * 0.06), j(y - h * 0.6, h * 0.1)], [j(x - w * 0.4, w * 0.08), y - h], [j(x - w * 0.02, w * 0.04), j(y - h * 0.7, h * 0.05)],
          [j(x + w * 0.4, w * 0.08), j(y - h * 0.92, h * 0.05)], [j(x + w * 0.95, w * 0.04), j(y - h * 0.3, h * 0.1)], [x + w, y]]
        : [[x - w, y], [j(x - w * 0.92, w * 0.06), j(y - h * 0.5, h * 0.1)], [j(x - w * 0.5, w * 0.1), j(y - h * 0.95, h * 0.06)],
          [j(x + w * 0.1, w * 0.1), y - h], [j(x + w * 0.66, w * 0.08), j(y - h * 0.72, h * 0.1)], [j(x + w * 0.98, w * 0.04), j(y - h * 0.25, h * 0.1)], [x + w, y]];
    const body = pathOf(pts, true);
    R.fill.addPath(body);
    // 墨 on the shadow side only: the right flank down to the ground
    R.k.moveTo(pts[3][0], pts[3][1]);
    for (let i = 4; i < pts.length; i++) R.k.lineTo(pts[i][0], pts[i][1]);
    R.k.lineTo(x + w * 0.55, y + 0.5);
    // shaded flank (away from the moon, which rises on the left)
    const sh = pathOf([pts[3], pts[4], pts[5], pts[6], [x + w * 0.25, y], [pts[3][0] + w * 0.05, pts[3][1] + h * 0.45]], true);
    R.shade.addPath(sh);
    // the moonlit top plane
    const hi = pathOf([pts[1], pts[2], pts[3], [pts[3][0] - w * 0.1, pts[3][1] + h * 0.3], [pts[1][0] + w * 0.3, pts[1][1] + h * 0.12]], true);
    R.hi.addPath(hi);
    // 皴: one short texture stroke where the lit plane turns into shade
    if (w > 12) { R.k.moveTo(pts[3][0] + w * 0.02, pts[3][1] + h * 0.2); R.k.quadraticCurveTo(pts[3][0] + w * 0.12, pts[3][1] + h * 0.5, x + w * 0.22, y - h * 0.12); }
  }
  const newRocks = () => ({ fill: new Path2D(), shade: new Path2D(), hi: new Path2D(), k: new Path2D() });

  /** 苔点: moss dots in sumi, clustered along a bank */
  function mossDots(p, x, y, w, h, n, seed, test) {
    const r = U.rng(seed);
    const nc = Math.max(1, Math.round(n / 4.5));
    for (let c = 0; c < nc; c++) {
      const cx = x + r() * w, cy = y + r() * h;
      if (test && !test(cx, cy)) continue;
      const m = 3 + Math.floor(r() * 4);
      for (let i = 0; i < m; i++) {
        const px = cx + U.lerp(-9, 9, r()), py = cy + U.lerp(-4, 4, r()), s = U.lerp(0.9, 1.9, r());
        const k = 5, a0 = r() * TAU;
        for (let j = 0; j <= k; j++) {
          const a = a0 + (j / k) * TAU, rr = s * U.lerp(0.55, 1.2, r());
          const qx = px + Math.cos(a) * rr * 1.4, qy = py + Math.sin(a) * rr * 0.85;
          j ? p.lineTo(qx, qy) : p.moveTo(qx, qy);
        }
        p.closePath();
      }
    }
  }

  /* the house ---------------------------------------------------------- */
  const HOUSE = { rx0: 1044, rx1: 1316, ry: 432, ex0: 892, ex1: 1468, ey: 562 };
  function ridgeY(x, late) {
    const u = U.clamp((x - HOUSE.rx0) / (HOUSE.rx1 - HOUSE.rx0));
    return HOUSE.ry + (late ? 6 * Math.sin(u * Math.PI) : 0);
  }
  function eaveY(x) { return HOUSE.ey + 1.2 * Math.sin(x * 0.02); }

  /** 後摺: the torn shoji (panel 2) — a ragged opening onto the dark room, paper flaps curling in. */
  const TEAR = (() => {
    const r = U.rng(4);
    const cx = 1131, cy = 624, N = 34;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * TAU;
      let rad = U.lerp(0.86, 1.05, r()) * (1 + 0.1 * Math.sin(a * 3 + 1) + 0.06 * Math.sin(a * 5));
      if (i % 3 === 0) rad *= U.lerp(0.9, 1.12, r());        // jags in the torn fibre
      pts.push([cx + Math.cos(a) * 18 * rad, cy + Math.sin(a) * 28 * rad]);
    }
    const hole = pathOf(pts, true);
    // flaps: pieces of the old paper still attached at the rim, curling into the hole
    const flaps = new Path2D(), flapK = new Path2D();
    for (const [i0, len, depth, curl] of [[2, 6, 0.55, 1], [11, 5, 0.5, -1], [19, 7, 0.62, 1], [27, 4, 0.42, -1]]) {
      const a = pts[i0], b = pts[(i0 + len) % N];
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const tx = mx + (cx - mx) * depth + curl * 3, ty = my + (cy - my) * depth + 4;
      flaps.moveTo(a[0], a[1]);
      for (let k = 1; k < len; k++) flaps.lineTo(pts[(i0 + k) % N][0], pts[(i0 + k) % N][1]);
      flaps.lineTo(b[0], b[1]);
      flaps.quadraticCurveTo(tx + curl * 5, ty - 3, tx, ty);
      flaps.quadraticCurveTo(tx - curl * 4, ty - 6, a[0], a[1]);
      flaps.closePath();
      flapK.moveTo(b[0], b[1]);
      flapK.quadraticCurveTo(tx + curl * 5, ty - 3, tx, ty);
      flapK.quadraticCurveTo(tx - curl * 4, ty - 6, a[0], a[1]);
    }
    return { hole, flaps, flapK, pts };
  })();
  /** 後摺: patches of fresh straw on the sagging thatch (irregular, lighter, hatched across the old grain). */
  const PATCHES = (() => {
    const r = U.rng(606);
    return [[1142, 488, 20, 12], [1278, 520, 22, 10], [1024, 534, 16, 9]].map(([x, y, w, h]) => {
      const pts = [];
      for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + r() * 0.3; pts.push([x + Math.cos(a) * w * U.lerp(0.75, 1.1, r()), y + Math.sin(a) * h * U.lerp(0.7, 1.1, r())]); }
      return { path: smoothOf(pts, true), x, y, w, h };
    });
  })();

  function paintHouse(pen, late) {
    const H0 = HOUSE, S = GEO.shoji, E = GEO.engawa;
    const wallL = new Path2D(), wallR = new Path2D(), koshi = new Path2D();
    wallL.rect(906, 566, 78, 124); wallR.rect(1376, 566, 80, 124);
    koshi.rect(906, 642, 78, 48); koshi.rect(1376, 642, 80, 48);
    const paper = new Path2D();
    paper.rect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0 - 18);
    const shojiKoshi = new Path2D();
    shojiKoshi.rect(S.x0, S.y1 - 18, S.x1 - S.x0, 18);
    pen('P1', (c) => {
      c.fillStyle = INK.plaster; c.fill(wallL); c.fill(wallR);
      c.fillStyle = INK.susutake; c.fill(koshi); c.fill(shojiKoshi);
    });
    pen('P7', (c) => {
      if (late) {
        // old paper, patched in two places with newer squares; the torn panel open onto the dark
        const cut = new Path2D();
        cut.addPath(paper);
        cut.addPath(TEAR.hole);
        c.fillStyle = C.geppaku; c.fill(cut, 'evenodd');
        c.fillStyle = U.mix(C.gofun, C.kinari, 0.3);
        c.fillRect(1296, 596, 14, 18); c.fillRect(1010, 640, 16, 14);
        c.fillStyle = U.mix(C.geppaku, C.torinoko, 0.4); c.fill(TEAR.flaps);
      } else { c.fillStyle = C.geppaku; c.fill(paper); }
    });
    if (late) pen('P4', (c) => { c.fillStyle = U.mix(C.sumi, C.ai, 0.3); c.fill(TEAR.hole); });
    const win = new Path2D();
    win.ellipse(944, 604, 16, 18, 0, 0, TAU);
    const eaveSh = new Path2D();
    eaveSh.rect(900, 564, 560, 18);
    pen('P4', (c) => {
      c.fillStyle = U.mix(INK.under, C.ai, 0.2); c.fill(win);
      const g = c.createLinearGradient(0, 564, 0, 584);
      g.addColorStop(0, U.rgba(INK.under, 0.95));
      g.addColorStop(1, U.rgba(INK.under, 0.3));
      c.fillStyle = g;
      c.fill(eaveSh);
    });
    const eng = new Path2D();
    eng.rect(E.x0, E.y0, E.x1 - E.x0, E.y1 - E.y0);
    const under = new Path2D();
    under.moveTo(E.x0 + 4, E.y1); under.lineTo(E.x1 - 4, E.y1); under.lineTo(E.x1 - 10, 731); under.lineTo(E.x0 + 10, 731); under.closePath();
    pen('P1', (c) => {
      const g = c.createLinearGradient(0, E.y0, 0, E.y1);
      g.addColorStop(0, U.mix(INK.board, C.sumi, 0.18));
      g.addColorStop(1, U.mix(INK.board, C.kinari, 0.16));
      c.fillStyle = g;
      c.fill(eng);
    });
    pen('P4', (c) => { c.fillStyle = INK.under; c.fill(under); });
    const posts = new Path2D(), tsuka = new Path2D();
    for (const x of [906, 981, 1180, 1376, 1452]) posts.rect(x - 3, 566, 6, 124);
    for (const x of [952, 1060, 1180, 1300, 1408]) tsuka.rect(x - 2.5, 706, 5, 24);
    pen('P1', (c) => { c.fillStyle = INK.susutake; c.fill(posts); c.fillStyle = U.mix(INK.susutake, C.sumi, 0.3); c.fill(tsuka); });
    const stF = new Path2D(), stH = new Path2D(), stK = new Path2D();
    stoneInto(stF, stH, stK, 1116, 733, 30, 11, 5);
    for (const [x, y, w, h, s] of [[1104, 760, 15, 5, 11], [1090, 785, 17, 5.5, 12], [1100, 810, 19, 6, 13], [1078, 831, 20, 6, 14]]) stoneInto(stF, stH, stK, x, y, w, h, s);
    pen('P4', (c) => { c.fillStyle = INK.stone; c.fill(stF); });
    pen('P7', (c) => { c.fillStyle = U.rgba(C.gofun, 0.55); c.fill(stH); });
    const roof = new Path2D();
    roof.moveTo(H0.rx0, ridgeY(H0.rx0, late));
    for (let x = H0.rx0; x <= H0.rx1; x += 8) roof.lineTo(x, ridgeY(x, late));
    roof.bezierCurveTo(H0.rx1 + 52, 468, H0.ex1 - 30, 532, H0.ex1 + 4, eaveY(H0.ex1));
    for (let x = H0.ex1; x >= H0.ex0; x -= 10) roof.lineTo(x, eaveY(x) + 2);
    roof.bezierCurveTo(H0.ex0 + 34, 530, H0.rx0 - 56, 468, H0.rx0, ridgeY(H0.rx0, late));
    roof.closePath();
    pen('P1', (c) => {
      const g = c.createLinearGradient(0, H0.ry, 0, H0.ey + 6);
      g.addColorStop(0, U.mix(INK.thatch, C.kinari, 0.14));
      g.addColorStop(0.55, INK.thatch);
      g.addColorStop(1, INK.thatchLo);
      c.fillStyle = g;
      c.fill(roof);
      if (late) {
        c.fillStyle = U.mix(C.susuki, INK.thatch, 0.45);
        for (const pt of PATCHES) c.fill(pt.path);
      }
    });
    const r = U.rng(late ? 222 : 22);
    const hiS = new Path2D();
    for (let i = 0; i < 80; i++) {
      const u = r();
      const xt = U.lerp(H0.rx0, H0.rx1, u), xb = U.lerp(H0.ex0 + 20, H0.ex1 - 20, u);
      const s0 = U.lerp(0.02, 0.4, r()), s1 = s0 + U.lerp(0.1, 0.32, r());
      const y0 = U.lerp(ridgeY(xt, late), H0.ey, s0), y1 = U.lerp(ridgeY(xt, late), H0.ey, s1);
      taperPath(hiS, [[U.lerp(xt, xb, s0), y0], [U.lerp(xt, xb, s1), y1]], U.lerp(2, 4.2, r()), 0.5, 0.2);
    }
    const edge = new Path2D();
    edge.moveTo(H0.ex0 - 2, eaveY(H0.ex0) - 16);
    for (let x = H0.ex0; x <= H0.ex1; x += 10) edge.lineTo(x, eaveY(x) - 16);
    for (let x = H0.ex1 + 3; x >= H0.ex0 - 3; x -= 10) edge.lineTo(x, eaveY(x) + 3);
    edge.closePath();
    pen('P3', (c) => {
      c.save(); c.clip(roof); c.fillStyle = U.rgba(INK.thatchHi, 0.55); c.fill(hiS); c.restore();
      const g = c.createLinearGradient(0, H0.ey - 16, 0, H0.ey + 3);
      g.addColorStop(0, U.mix(C.susuki, C.kinari, 0.3));
      g.addColorStop(1, U.mix(C.susuki, C.odo, 0.55));
      c.fillStyle = g;
      c.fill(edge);
    });
    const ridge = new Path2D();
    const rl = H0.rx0 - 18, rrx = H0.rx1 + 18;
    ridge.moveTo(rl, ridgeY(H0.rx0, late) + 5);
    ridge.quadraticCurveTo(rl - 6, ridgeY(H0.rx0, late) - 10, rl + 12, ridgeY(H0.rx0, late) - 13);
    for (let x = H0.rx0; x <= H0.rx1; x += 8) ridge.lineTo(x, ridgeY(x, late) - 13);
    ridge.quadraticCurveTo(rrx + 6, ridgeY(H0.rx1, late) - 10, rrx, ridgeY(H0.rx1, late) + 5);
    for (let x = H0.rx1; x >= H0.rx0; x -= 8) ridge.lineTo(x, ridgeY(x, late) + 3);
    ridge.closePath();
    const vx = 1180, vy = ridgeY(vx, late) - 13;
    const vent = new Path2D();
    vent.moveTo(vx - 34, vy + 2); vent.lineTo(vx - 22, vy - 17); vent.lineTo(vx + 22, vy - 17); vent.lineTo(vx + 34, vy + 2); vent.closePath();
    pen('P1', (c) => { c.fillStyle = INK.susutake; c.fill(ridge); c.fill(vent); });
    paintOfferingsStatic(pen, late);
    pen('K', (c) => {
      const hk = new Path2D();
      const r2 = U.rng(late ? 333 : 33);
      for (let i = 0; i < 260; i++) {
        const u = (i + r2() * 0.8) / 260;
        const xt = U.lerp(H0.rx0 - 6, H0.rx1 + 6, u), xb = U.lerp(H0.ex0 + 6, H0.ex1 - 6, u);
        let s = r2() * 0.1;
        while (s < 0.94) {
          const len = U.lerp(0.06, 0.2, r2());
          const s1 = Math.min(0.95, s + len);
          const yt = ridgeY(xt, late);
          const bow = (u - 0.5) * 6;
          hk.moveTo(U.lerp(xt, xb, s) + bow * s, U.lerp(yt, H0.ey - 16, s));
          hk.lineTo(U.lerp(xt, xb, s1) + bow * s1, U.lerp(yt, H0.ey - 16, s1));
          s = s1 + U.lerp(0.02, 0.08, r2());
        }
      }
      c.save();
      if (late) {
        const cl = new Path2D();
        cl.addPath(roof);
        for (const pt of PATCHES) cl.addPath(pt.path);
        c.clip(cl, 'evenodd');
      } else c.clip(roof);
      inkLine(c, hk, 0.4, 0.85);
      c.restore();
      if (late) {
        for (const pt of PATCHES) {
          const ph = new Path2D();
          for (let k = -pt.w * 1.6; k < pt.w * 1.6; k += 2.6) { ph.moveTo(pt.x + k - pt.h, pt.y - pt.h * 1.2); ph.lineTo(pt.x + k + pt.h * 0.9, pt.y + pt.h * 1.2); }
          c.save(); c.clip(pt.path); inkLine(c, ph, 0.5, 0.7); c.restore();
          inkLine(c, pt.path, 0.4, 0.7);
        }
      }
      inkLine(c, roof, 0.9, 1.8);
      const tk = new Path2D();
      const r4 = U.rng(4);
      for (let x = H0.ex0 + 1; x < H0.ex1; x += 2.4) { const t0 = U.lerp(-15, -9, r4()); tk.moveTo(x, eaveY(x) + t0); tk.lineTo(x + 0.3, eaveY(x) + 2); }
      inkLine(c, tk, 0.34, 0.6);
      inkLine(c, edge, 0.85, 1.4);
      const eu = new Path2D();
      eu.moveTo(H0.ex0 - 2, eaveY(H0.ex0) + 3.5);
      for (let x = H0.ex0; x <= H0.ex1 + 2; x += 10) eu.lineTo(x, eaveY(x) + 3.5);
      inkLine(c, eu, 0.9, 2.6);
      inkLine(c, ridge, 0.9, 1.5);
      inkLine(c, vent, 0.9, 1.3);
      c.fillStyle = U.rgba(C.sumi, 0.9);
      c.fillRect(vx - 16, vy - 13, 32, 11);
      const cr = new Path2D();
      const r5 = U.rng(late ? 55 : 5);
      for (let x = H0.rx0 + 8; x <= H0.rx1 - 6; x += 23) {
        if (Math.abs(x - vx) < 42) continue;
        const y = ridgeY(x, late) - 12, lean = U.lerp(-0.6, 0.6, r5());
        cr.moveTo(x - 3.2 + lean, y + 2); cr.lineTo(x + 2.6 + lean, y - 11);
        cr.moveTo(x + 3.2 + lean, y + 2); cr.lineTo(x - 2.6 + lean, y - 11);
      }
      inkLine(c, cr, 0.8, 0.9);
      inkLine(c, wallL, 0.8, 1.2);
      inkLine(c, wallR, 0.8, 1.2);
      const kl = new Path2D();
      for (let x = 912; x < 984; x += 8) { kl.moveTo(x, 643); kl.lineTo(x, 689); }
      for (let x = 1382; x < 1456; x += 8) { kl.moveTo(x, 643); kl.lineTo(x, 689); }
      inkLine(c, kl, 0.45, 0.7);
      inkLine(c, posts, 0.85, 1.1);
      const wl = new Path2D();
      for (let x = 934; x <= 954; x += 5) { wl.moveTo(x, 587); wl.lineTo(x, 621); }
      for (let y = 594; y <= 614; y += 6) { wl.moveTo(928, y); wl.lineTo(960, y); }
      c.save(); c.clip(win); inkLine(c, wl, 0.8, 1); c.restore();
      inkLine(c, win, 0.85, 1.4);
      const fr = new Path2D(), km = new Path2D();
      const pw = (S.x1 - S.x0) / 4;
      for (let i = 0; i < 4; i++) {
        const x0 = S.x0 + pw * i;
        fr.rect(x0 + 1, S.y0, pw - 2, S.y1 - S.y0);
        fr.moveTo(x0 + 1, S.y1 - 18); fr.lineTo(x0 + pw - 1, S.y1 - 18);
        for (let k = 1; k < 3; k++) { km.moveTo(x0 + (pw * k) / 3, S.y0); km.lineTo(x0 + (pw * k) / 3, S.y1 - 18); }
        for (let k = 1; k < 5; k++) { const y = S.y0 + ((S.y1 - 18 - S.y0) * k) / 5; km.moveTo(x0 + 1, y); km.lineTo(x0 + pw - 1, y); }
      }
      inkLine(c, km, 0.7, 0.8);
      inkLine(c, fr, 0.9, 1.5);
      const ls = new Path2D();
      ls.moveTo(900, 577); ls.lineTo(1460, 577);
      inkLine(c, ls, 0.9, 2.2);
      const eb = new Path2D();
      eb.moveTo(E.x0, E.y0); eb.lineTo(E.x1, E.y0);
      eb.moveTo(E.x0, E.y0 + 6); eb.lineTo(E.x1, E.y0 + 6);
      eb.moveTo(E.x0, E.y0 + 11); eb.lineTo(E.x1, E.y0 + 11);
      const r3 = U.rng(8);
      for (let x = E.x0 + 30; x < E.x1; x += U.lerp(60, 130, r3())) { const row = Math.floor(r3() * 3); eb.moveTo(x, E.y0 + row * 5.5); eb.lineTo(x, E.y0 + row * 5.5 + 5); }
      inkLine(c, eb, 0.7, 0.8);
      const ee = new Path2D();
      ee.moveTo(E.x0, E.y1); ee.lineTo(E.x1, E.y1);
      ee.moveTo(E.x0, E.y0); ee.lineTo(E.x0, E.y1); ee.moveTo(E.x1, E.y0); ee.lineTo(E.x1, E.y1);
      inkLine(c, ee, 0.92, 2);
      inkLine(c, tsuka, 0.7, 0.8);
      inkLine(c, stK, 0.8, 1.1);
      if (late) {
        inkLine(c, TEAR.flapK, 0.8, 0.8);
        // the torn rim: a broken hairline where the paper fibre frays
        const rim = new Path2D();
        const P = TEAR.pts;
        for (let i = 0; i < P.length; i += 2) { if (i % 6 === 4) continue; rim.moveTo(P[i][0], P[i][1]); rim.lineTo(P[(i + 1) % P.length][0], P[(i + 1) % P.length][1]); }
        inkLine(c, rim, 0.5, 0.6);
      }
    });

  }

  /* the 三方 and the jug: the carved (static) parts ----------------------- */
  const SANBO = { x: 1000, y: 690, w: 26 };
  function paintOfferingsStatic(pen, late) {
    const [sx, sy] = [SANBO.x, SANBO.y];
    const tray = new Path2D();
    tray.moveTo(sx - 13, sy - 17); tray.lineTo(sx + 13, sy - 17); tray.lineTo(sx + 12, sy - 12); tray.lineTo(sx - 12, sy - 12); tray.closePath();
    const stand = new Path2D();
    stand.moveTo(sx - 9, sy - 12); stand.lineTo(sx + 9, sy - 12); stand.lineTo(sx + 10, sy); stand.lineTo(sx - 10, sy); stand.closePath();
    const hole = new Path2D();
    hole.ellipse(sx, sy - 6, 3.2, 3.6, 0, 0, TAU);
    pen('P1', (c) => {
      c.fillStyle = U.mix(C.kinari, C.odo, 0.3); c.fill(stand);
      c.fillStyle = U.mix(C.kinari, C.odo, 0.18); c.fill(tray);
      c.fillStyle = U.mix(C.odo, C.sumi, 0.3); c.fill(hole);
    });
    const [jx, jy] = GEO.jug;
    const jug = smoothOf([[jx - 4, jy - 20], [jx + 4, jy - 20], [jx + 5, jy - 17], [jx + 8, jy - 9], [jx + 7, jy - 1], [jx, jy + 0.5], [jx - 7, jy - 1], [jx - 8, jy - 9], [jx - 5, jy - 17]], true);
    pen('P4', (c) => { c.fillStyle = U.mix(C.nezumi, C.ai, 0.2); c.fill(jug); });
    pen('P7', (c) => { c.fillStyle = U.rgba(C.gofun, 0.35); c.beginPath(); c.ellipse(jx - 3, jy - 11, 1.6, 4.5, 0.2, 0, TAU); c.fill(); });
    pen('K', (c) => { inkLine(c, tray, 0.85, 1); inkLine(c, stand, 0.85, 1); inkLine(c, jug, 0.85, 1.1); });
    if (late) {
      const box = new Path2D();
      box.rect(930, 680, 18, 10);
      pen('P4', (c) => {
        c.fillStyle = INK.lacquer; c.fill(box); c.fillRect(929, 677, 20, 4);
        c.fillStyle = U.rgba(C.ginnezu, 0.85); c.fillRect(931, 678, 12, 1);
      });
      const cut = new Path2D();
      taperPath(cut, [[jx + 9, jy], [jx + 12, jy - 30]], 3.2, 2.4, 0);
      pen('P1', (c) => { c.fillStyle = U.mix(C.odo, C.sumi, 0.5); c.fill(cut); });
      const cups = new Path2D();
      for (const cx of [1082, 1092]) { cups.moveTo(cx - 3.5, jy - 5); cups.lineTo(cx + 3.5, jy - 5); cups.lineTo(cx + 2.6, jy); cups.lineTo(cx - 2.6, jy); cups.closePath(); }
      pen('P7', (c) => { c.fillStyle = U.mix(C.gofun, C.ginnezu, 0.3); c.fill(cups); });
      pen('K', (c) => { inkLine(c, box, 0.8, 0.8); inkLine(c, cut, 0.8, 0.8); inkLine(c, cups, 0.8, 0.7); });
      const b = newBuckets();
      clumpInto({ x: jx, y: jy - 18, h: 34, n: 4, spread: 0.9, seed: 81, blades: 2, hairs: 8, kf: 1, side: -0.4 }, 0, b);
      paintBuckets(pen, b, { stem: ['P4', C.nezumi], blade: ['P3', INK.moss], hair: ['P4', C.ginnezu], hairHi: ['P7', U.mix(C.gofun, C.ginnezu, 0.3)], key: [0.7, 0.6] });
    }
  }

  /** low grass along the far bank, so the water's edge is never a bare ruled line */
  function bankFringe(late) {
    const r = U.rng(late ? 1331 : 313);
    const out = [];
    for (let x = 700; x < 1570; x += U.lerp(9, 22, r())) {
      const plumes = r() < 0.25;
      out.push({ x, y: bankY(x) - U.lerp(0, 3, r()), h: U.lerp(12, 30, r()) * (late ? 1.6 : 1), n: plumes ? 1 + Math.floor(r() * 2) : 0, spread: 0.8, seed: 9100 + out.length, blades: 3 + Math.floor(r() * 3), hairs: 6, kf: 0.5, side: U.lerp(-0.5, 0.8, r()) });
    }
    return out;
  }

  /* the field ---------------------------------------------------------- */
  function paintField(pen, late) {
    const bf = newBuckets();
    for (const o of farClumps(late)) clumpInto(o, U.deg(3), bf);
    pen('P4', (c) => {
      c.fillStyle = U.rgba(U.mix(C.nezumi, C.ai, 0.3), 0.6); c.fill(bf.blades); c.fill(bf.bladesLt); c.fill(bf.stems);
      c.fillStyle = U.rgba(late ? C.ginnezu : U.mix(C.nezumi, C.susuki, 0.35), 0.5); c.fill(bf.hairs); c.fill(bf.hairsHi);
    });
    // mid susuki: 尾花 plumes on 黄土 stems with key lines; where the moon rises
    // (x < 400) every hair is keyed and the plume is a mid tone, so over the disc
    // they print as silhouettes and over the night sky as silver
    const bm = newBuckets(), bmm = newBuckets();
    for (const o of midClumps(late)) clumpInto(o, U.deg(4), o.moon && !late ? bmm : bm, { keyAll: o.moon && !late });
    pen('P1', (c) => {
      c.fillStyle = late ? U.mix(C.nezumi, C.odo, 0.3) : U.mix(C.odo, C.sumi, 0.25);
      c.fill(bm.stems);
      c.fillStyle = U.mix(C.odo, C.sumi, 0.45);
      c.fill(bmm.stems);
    });
    pen('P3', (c) => {
      c.fillStyle = U.mix(C.matsuba, C.sumi, 0.15); c.fill(bm.blades); c.fill(bmm.blades);
      c.fillStyle = U.mix(C.matsuba, C.koke, 0.4); c.fill(bm.bladesLt); c.fill(bmm.bladesLt);
      if (!late) {
        c.fillStyle = C.susuki; c.fill(bm.hairs);
        c.fillStyle = U.mix(C.susuki, C.gofun, 0.45); c.fill(bm.hairsHi);
        c.fillStyle = U.mix(C.susuki, C.nezumi, 0.45); c.fill(bmm.hairs);
        c.fillStyle = U.mix(C.susuki, C.nezumi, 0.2); c.fill(bmm.hairsHi);
      }
    });
    if (late) pen('P4', (c) => { c.fillStyle = C.ginnezu; c.fill(bm.hairs); c.fillStyle = U.mix(C.ginnezu, C.gofun, 0.4); c.fill(bm.hairsHi); });
    pen('K', (c) => { inkLine(c, bm.key, 0.55, 0.7); inkLine(c, bmm.key, 0.82, 0.95); });
    const foot = new Path2D(), footK = new Path2D();
    {
      const r = U.rng(late ? 4242 : 2424);
      foot.moveTo(-10, bankY(0) + 2);
      let x = -10;
      const tip = [];
      while (x < 800) {
        const h = (x < 36 || x > 300 ? U.lerp(20, 34, r()) : U.lerp(12, 20, r())) * U.lerp(1, 0.4, U.smoothstep(700, 800, x)) * (late ? 1.3 : 1);
        const w = U.lerp(4, 9, r());
        tip.push([x + w * 0.5 + U.lerp(-2, 2, r()), bankY(Math.max(0, x)) - h]);
        tip.push([x + w, bankY(Math.max(0, x + w)) - h * U.lerp(0.35, 0.6, r())]);
        x += w;
      }
      for (const p of tip) foot.lineTo(p[0], p[1]);
      foot.lineTo(810, bankY(810) + 2);
      for (let xx = 810; xx >= -10; xx -= 12) foot.lineTo(xx, bankY(Math.max(0, xx)) + 2);
      foot.closePath();
      for (let i = 0; i < tip.length; i += 6) { footK.moveTo(tip[i][0], tip[i][1]); footK.lineTo(tip[i][0] + U.lerp(-3, 3, r()), bankY(Math.max(0, tip[i][0])) - 3); }
    }
    pen('P3', (c) => {
      const g = c.createLinearGradient(0, 796, 0, 834);
      g.addColorStop(0, late ? U.mix(C.matsuba, C.nezumi, 0.35) : U.mix(C.matsuba, C.kon, 0.2));
      g.addColorStop(1, late ? U.mix(C.matsuba, C.sumi, 0.35) : U.mix(C.matsuba, C.sumi, 0.4));
      c.fillStyle = g;
      c.fill(foot);
    });
    pen('K', (c) => inkLine(c, footK, 0.45, 0.6));
    const bb = newBuckets();
    for (const o of bankFringe(late)) clumpInto(o, U.deg(5), bb);
    pen('P3', (c) => {
      c.fillStyle = U.mix(C.matsuba, C.sumi, 0.22); c.fill(bb.blades); c.fill(bb.stems);
      c.fillStyle = U.mix(C.matsuba, C.koke, 0.35); c.fill(bb.bladesLt);
      c.fillStyle = late ? C.ginnezu : U.mix(C.susuki, C.nezumi, 0.2); c.fill(bb.hairs); c.fill(bb.hairsHi);
    });
    pen('K', (c) => inkLine(c, bb.key, 0.5, 0.6));
  }

  /* the pond, banks, the spit ------------------------------------------ */
  function paintPond(pen, late) {
    const land = new Path2D();
    land.moveTo(-10, bankY(0) - 2);
    for (let x = 0; x <= W; x += 16) land.lineTo(x, bankY(x) - 2);
    land.lineTo(W + 10, H + 10); land.lineTo(-10, H + 10); land.closePath();
    pen('P3', (c) => {
      const g = c.createLinearGradient(0, 826, 0, H);
      g.addColorStop(0, U.mix(INK.moss, C.sumi, 0.25));
      g.addColorStop(0.35, INK.moss);
      g.addColorStop(1, INK.mossDk);
      c.fillStyle = g;
      c.save();
      const cut = new Path2D();
      cut.addPath(land);
      cut.addPath(POND);
      c.fill(cut, 'evenodd');
      c.restore();
    });
    const earth = new Path2D();
    earth.moveTo(302, 842); earth.lineTo(348, 844); earth.bezierCurveTo(372, 880, 430, 900, 452, 940);
    earth.bezierCurveTo(470, 990, 500, 1040, 560, 1100);
    earth.lineTo(330, 1100);
    earth.bezierCurveTo(320, 1000, 300, 930, 306, 876);
    earth.closePath();
    earth.moveTo(1650, 872); earth.bezierCurveTo(1690, 920, 1690, 1010, 1640, 1100);
    earth.lineTo(1730, 1100); earth.bezierCurveTo(1770, 990, 1750, 890, 1680, 850); earth.closePath();
    pen('P1', (c) => { c.fillStyle = U.rgba(INK.earthDk, 0.88); c.fill(earth); });
    pen('P5', (c) => {
      if (late) { c.fillStyle = C.ai; c.fill(POND); woodGrain(c, POND, 0, 830, W, 260, 57, 0.08); return; }
      const g = c.createLinearGradient(0, 828, 0, 1090);
      g.addColorStop(0, U.mix(C.bero, C.koiai, 0.35));
      g.addColorStop(0.1, U.mix(C.ai, C.bero, 0.55));
      g.addColorStop(0.34, C.ai);
      g.addColorStop(0.58, U.mix(C.ai, C.hanada, 0.3));
      g.addColorStop(0.8, C.ai);
      g.addColorStop(1, U.mix(C.ai, C.koiai, 0.45));
      c.fillStyle = g;
      c.fill(POND);
      woodGrain(c, POND, 0, 830, W, 260, 57, 0.09);
    });
    pen('K', (c) => {
      const kb = new Path2D();
      POND_PTSS.forEach((pts, i) => carvedLine(kb, pts.concat([pts[0]]), 1.7, (late ? 17 : 7) + i * 5, 0));
      c.fillStyle = U.rgba(C.sumi, 0.88);
      c.fill(kb);
      const rp = new Path2D();
      const r4 = U.rng(late ? 144 : 44);
      for (let i = 0; i < 120; i++) {
        const x = U.lerp(60, 1600, r4()), y = U.lerp(846, 1040, Math.pow(r4(), 1.5));
        const L = U.lerp(12, 42, r4()) * U.lerp(0.7, 1.4, (y - 840) / 200);
        if (!inPond(x, y) || !inPond(x + L, y)) continue;
        rp.moveTo(x, y); rp.quadraticCurveTo(x + L / 2, y - 1.5, x + L, y);
        if (r4() < 0.4) { rp.moveTo(x + L * 0.2, y + 3.2); rp.quadraticCurveTo(x + L * 0.5, y + 1.9, x + L * 0.8, y + 3.2); }
      }
      inkLine(c, rp, 0.3, 0.75);
    });
  }

  /* the banks: rocks, the tsukubai and sōzu frame, the lantern, reeds (drawn over the water) */
  function paintBanks(pen, late) {
    const RK = newRocks();
    const r = U.rng(late ? 626 : 262);
    const stones = [
      [118, 841, 14, 5], [150, 836, 8, 3], [452, 836, 11, 4], [806, 839, 13, 5], [838, 841, 7, 3],
      [1330, 838, 15, 5], [1360, 842, 8, 3], [1560, 842, 16, 6], [1640, 880, 12, 7], [1664, 944, 14, 8],
      [1648, 1004, 18, 8], [1618, 1062, 16, 7],
      [590, 1086, 16, 7], [548, 1048, 14, 7], [506, 1010, 13, 7], [470, 966, 10, 6], [312, 878, 11, 5], [298, 904, 10, 6], [300, 960, 11, 7],
      [60, 902, 9, 7], [372, 958, 14, 7], [446, 968, 16, 6], [400, 1030, 20, 8], [470, 1070, 18, 7],
      [330, 874, 9, 5], [292, 930, 8, 6], [294, 1010, 10, 7],
      // the spit's 景石: big rocks along its east shore
      [352, 884, 17, 11], [424, 912, 22, 15], [468, 968, 30, 21], [506, 1016, 26, 16], [548, 1062, 38, 26], [455, 934, 12, 8],
    ];
    for (let i = 0; i < stones.length; i++) { const [x, y, w, h] = stones[i]; rockInto(RK, x, y + h * 0.35, w * U.lerp(0.9, 1.1, r()), h * 1.35, 100 + i); }
    const [tx, ty] = GEO.tsukubai;
    const basin = smoothOf([[tx - 22, ty - 2], [tx - 21, ty - 12], [tx - 12, ty - 19], [tx + 12, ty - 19], [tx + 21, ty - 12], [tx + 22, ty - 2], [tx + 17, ty + 9], [tx, ty + 12], [tx - 17, ty + 9]], true);
    const bw = new Path2D();
    bw.ellipse(tx, ty - 14, 13, 3.8, 0, 0, TAU);
    const sz = new Path2D();
    sz.rect(SOZU.px - 7, SOZU.py - 4, 3.4, 20); sz.rect(SOZU.px + 4, SOZU.py - 4, 3.4, 20);
    const kake = new Path2D();
    taperPath(kake, [[236, 847], [287, 852]], 4.2, 4.2, 0);
    const kp = new Path2D();
    kp.rect(250, 849, 3.2, 26);
    const strike = new Path2D(), stH = new Path2D(), stK = new Path2D();
    stoneInto(strike, stH, stK, 352, 891, 9, 5, 77);
    const lx = 1700, ly = 960;
    const lant = new Path2D();
    lant.moveTo(lx - 22, ly - 34); lant.quadraticCurveTo(lx, ly - 48, lx + 22, ly - 34); lant.lineTo(lx + 16, ly - 31); lant.lineTo(lx - 16, ly - 31); lant.closePath();
    lant.rect(lx - 8, ly - 31, 16, 12);
    lant.rect(lx - 11, ly - 19, 22, 4);
    lant.moveTo(lx - 10, ly - 15); lant.lineTo(lx - 16, ly); lant.lineTo(lx - 13, ly); lant.lineTo(lx - 5, ly - 15); lant.closePath();
    lant.moveTo(lx + 10, ly - 15); lant.lineTo(lx + 16, ly); lant.lineTo(lx + 13, ly); lant.lineTo(lx + 5, ly - 15); lant.closePath();
    lant.moveTo(lx + 3, ly - 50); lant.ellipse(lx, ly - 50, 3, 3.5, 0, 0, TAU);
    const lwin = new Path2D();
    lwin.rect(lx - 4.5, ly - 29, 9, 8);
    pen('P1', (c) => { c.fillStyle = INK.susutake; c.fill(sz); c.fill(kp); });
    pen('P3', (c) => { c.fillStyle = late ? U.mix(C.kuchiba, C.nezumi, 0.4) : U.mix(C.aotake, C.odo, 0.35); c.fill(kake); });
    pen('P4', (c) => {
      c.fillStyle = INK.stone; c.fill(RK.fill); c.fill(lant);
      c.fillStyle = U.mix(INK.stone, C.sumi, 0.35); c.fill(RK.shade);
      c.fillStyle = INK.under; c.fill(lwin);
      c.fillStyle = INK.stoneDk; c.fill(strike);
      const g = c.createLinearGradient(0, ty - 20, 0, ty + 12);
      g.addColorStop(0, U.mix(INK.stone, C.gofun, 0.18));
      g.addColorStop(1, INK.stoneDk);
      c.fillStyle = g;
      c.fill(basin);
    });
    pen('P5', (c) => { c.fillStyle = late ? C.ai : U.mix(C.ai, C.koiai, 0.5); c.fill(bw); });
    pen('P7', (c) => {
      c.fillStyle = U.rgba(C.gofun, 0.42); c.fill(RK.hi); c.fill(stH);
      if (!late) { c.fillStyle = U.rgba(C.gofun, 0.9); c.beginPath(); c.ellipse(tx - 4, ty - 14.5, 3.4, 1.1, 0, 0, TAU); c.fill(); }
    });
    if (late) {
      // 葦: reeds have taken the west half of the pond — rooted clumps standing
      // in the water, each with a short 墨 waterline at its foot, dense at
      // x 200–500 and thinning toward 850
      const rs = new Path2D(), rl = new Path2D(), rp = new Path2D(), rk = new Path2D(), rw = new Path2D();
      const rr = U.rng(9191);
      let made = 0;
      for (let tries = 0; tries < 80 && made < 17; tries++) {
        const x = U.lerp(196, 860, Math.pow(rr(), 1.5));
        const yb = U.lerp(852, 1066, rr());
        if (!inPond(x, yb) || !inPond(x - 10, yb) || !inPond(x + 10, yb)) continue;
        made++;
        const k = U.lerp(0.75, 1.5, (yb - 846) / 220) * U.lerp(0.85, 1.15, rr());
        const n = 5 + Math.floor(rr() * 5);
        for (let i = 0; i < n; i++) {
          const bx = x + U.lerp(-7, 7, rr()) * k;
          const a = U.lerp(-0.2, 0.24, rr()) + (i - n / 2) * 0.03;
          const h = U.lerp(46, 118, rr()) * k;
          const tx = bx + Math.sin(a) * h, ty = yb - Math.cos(a) * h;
          const cxs = bx + Math.sin(a) * h * 0.5 + U.lerp(-2, 2, rr()), cys = yb - Math.cos(a) * h * 0.5;
          sliver(rs, bx, yb, cxs, cys, tx, ty, U.lerp(0.9, 1.3, rr()) * k);
          if (rr() < 0.45) { rk.moveTo(bx, yb); rk.quadraticCurveTo(cxs, cys, tx, ty); }
          // a drooping 穂 at some tips (grey: the warm block is gone)
          if (rr() < 0.45) {
            const pa = a + U.lerp(0.5, 1.2, rr()) * (rr() < 0.5 ? -1 : 1), pl = U.lerp(9, 16, rr()) * k;
            sliver(rp, tx, ty, tx + Math.sin(pa) * pl * 0.5, ty - Math.cos(pa) * pl * 0.3, tx + Math.sin(pa) * pl, ty + pl * 0.35, 1.7 * k);
          }
        }
        // 2–3 long blades bending over at 30–60°
        const nb = 2 + Math.floor(rr() * 2);
        for (let j = 0; j < nb; j++) {
          const side = rr() < 0.5 ? -1 : 1;
          const sy = yb - U.lerp(0.12, 0.4, rr()) * 80 * k, sx = x + U.lerp(-3, 3, rr());
          const bend = U.deg(U.lerp(30, 60, rr()));
          const L = U.lerp(40, 70, rr()) * k;
          const mx = sx + side * Math.sin(bend * 0.5) * L * 0.55, my = sy - Math.cos(bend * 0.5) * L * 0.55;
          const ex = sx + side * Math.sin(bend) * L, ey = sy - Math.cos(bend) * L * 0.6 + L * 0.18;
          sliver(rl, sx, sy, mx, my, ex, ey, U.lerp(1.8, 2.6, rr()) * k);
          if (rr() < 0.5) { rk.moveTo(sx, sy); rk.quadraticCurveTo(mx, my, ex, ey); }
        }
        // the waterline at the foot
        const wl = U.lerp(10, 16, rr()) * k;
        rw.moveTo(x - wl, yb + 1); rw.quadraticCurveTo(x, yb - 0.6, x + wl, yb + 1);
        if (rr() < 0.6) { rw.moveTo(x - wl * 0.5, yb + 4.5); rw.quadraticCurveTo(x, yb + 3.6, x + wl * 0.55, yb + 4.5); }
      }
      pen('P4', (c) => { c.fillStyle = U.mix(C.nezumi, C.rikyu, 0.5); c.fill(rs); c.fillStyle = C.ginnezu; c.fill(rp); });
      pen('P3', (c) => { c.fillStyle = U.mix(C.matsuba, C.nezumi, 0.3); c.fill(rl); });
      pen('K', (c) => { inkLine(c, rk, 0.5, 0.6); inkLine(c, rw, 0.8, 1.1); });
    }
    const hb = new Path2D(), hf = new Path2D(), hk = new Path2D();
    const r5 = U.rng(5151);
    for (let i = 0; i < 11; i++) {
      const bx = U.lerp(1774, 1872, r5()), by = U.lerp(934, 964, r5());
      const a = U.lerp(-1.25, 1.25, r5()), L = U.lerp(42, 76, r5());
      const ex = bx + Math.sin(a) * L, ey = by - Math.cos(a) * L * 0.7 + L * 0.18;
      const cx = bx + Math.sin(a) * L * 0.4, cy = by - L * 0.6;
      hk.moveTo(bx, by); hk.quadraticCurveTo(cx, cy, ex, ey);
      for (let k = 0; k < 8; k++) {
        const s = U.lerp(0.3, 1, k / 7), p = U.qbez([bx, by], [cx, cy], [ex, ey], s);
        const la = a + (k % 2 ? 1.1 : -1.1);
        sliver(hb, p[0], p[1], p[0] + Math.sin(la) * 4, p[1] - Math.cos(la) * 4 + 1, p[0] + Math.sin(la) * 8, p[1] - Math.cos(la) * 8 + 3, 3.2);
        if (s > 0.55 && !late) { hf.moveTo(p[0] + 2.4, p[1] - 3); hf.ellipse(p[0], p[1] - 3, 2.4, 1.8, 0, 0, TAU); }
      }
    }
    pen('P3', (c) => { c.fillStyle = U.mix(C.matsuba, C.koke, 0.2); c.fill(hb); });
    if (!late) pen('P2', (c) => { c.fillStyle = C.hagi; c.fill(hf); });
    // tufts of grass along the spit's shore and the west lobe's bank
    const tb = newBuckets();
    const rt = U.rng(late ? 7272 : 2727);
    const tuft = (x, y) => clumpInto({ x, y, h: U.lerp(14, 30, rt()) * (late ? 1.5 : 1), n: 0, spread: 0.8, seed: 8800 + Math.round(x * 7 + y), blades: 3 + Math.floor(rt() * 4) }, U.deg(4), tb);
    for (let i = 0; i < 26; i++) { const u = rt(); tuft(U.lerp(318, 560, u) + rt() * 10, U.lerp(872, 1062, u) - 2); }
    for (let i = 0; i < 10; i++) tuft(U.lerp(40, 70, rt()), U.lerp(860, 1070, rt()));
    pen('P3', (c) => { c.fillStyle = U.mix(C.matsuba, C.sumi, 0.25); c.fill(tb.blades); c.fillStyle = U.mix(C.matsuba, C.koke, 0.45); c.fill(tb.bladesLt); });
    pen('K', (c) => {
      inkLine(c, RK.k, 0.82, 1);
      const md = new Path2D();
      const land = (x, y) => !inPond(x, y);
      mossDots(md, 300, 900, 150, 150, 70, 3, land);
      mossDots(md, 1660, 870, 100, 210, 55, 5, land);
      mossDots(md, 0, 850, 50, 220, 30, 6, land);
      c.fillStyle = U.rgba(C.sumi, 0.55);
      c.fill(md);
      inkLine(c, basin, 0.9, 1.2);
      inkLine(c, bw, 0.8, 1);
      inkLine(c, sz, 0.85, 0.9);
      inkLine(c, kake, 0.85, 0.9);
      const kn = new Path2D();
      for (const x of [252, 272]) { kn.moveTo(x - 0.6, 845.5); kn.lineTo(x + 0.6, 854); }
      inkLine(c, kn, 0.8, 0.9);
      inkLine(c, kp, 0.8, 0.8);
      inkLine(c, stK, 0.8, 0.9);
      inkLine(c, lant, 0.85, 1.1);
      inkLine(c, hk, 0.8, 0.9);
    });
  }

  /* near susuki (live, and the 序 still) --------------------------------- */
  const NEAR_COLS = {
    early: {
      stem: ['P3', U.mix(C.matsuba, C.sumi, 0.1)], blade: ['P3', U.mix(C.matsuba, C.sumi, 0.18)], bladeLt: ['P3', U.mix(C.matsuba, C.koke, 0.45)],
      hair: ['P3', C.susuki], hairHi: ['P7', U.mix(C.gofun, C.susuki, 0.25)], key: [0.82, 0.75],
    },
    earlyDark: {
      stem: ['P3', U.mix(C.matsuba, C.sumi, 0.3)], blade: ['P3', U.mix(C.matsuba, C.sumi, 0.35)], bladeLt: ['P3', U.mix(C.matsuba, C.sumi, 0.15)],
      hair: ['P3', U.mix(C.susuki, C.nezumi, 0.5)], hairHi: ['P3', U.mix(C.susuki, C.nezumi, 0.25)], key: [0.9, 0.85],
    },
    late: {
      stem: ['P4', U.mix(C.nezumi, C.rikyu, 0.4)], blade: ['P3', U.mix(C.matsuba, C.nezumi, 0.35)], bladeLt: ['P3', U.mix(C.koke, C.nezumi, 0.4)],
      hair: ['P4', C.ginnezu], hairHi: ['P7', U.mix(C.gofun, C.ginnezu, 0.35)], key: [0.8, 0.75],
    },
    lateDark: {
      stem: ['P4', U.mix(C.nezumi, C.sumi, 0.3)], blade: ['P3', U.mix(C.matsuba, C.nezumi, 0.5)], bladeLt: ['P3', U.mix(C.matsuba, C.nezumi, 0.3)],
      hair: ['P4', U.mix(C.ginnezu, C.nezumi, 0.5)], hairHi: ['P4', C.ginnezu], key: [0.85, 0.8],
    },
  };
  function paintNearInto(pen, T, clumps, late, filter) {
    const b = newBuckets(), bd = newBuckets();
    const w = wind(T);
    for (const o of clumps) {
      if (filter && !filter(o)) continue;
      clumpInto(o, leanAt(T, o.x, o.seed * 0.013, w) * (o.h > 150 ? 1.1 : 1), o.dark ? bd : b, { keyAll: o.dark });
    }
    paintBuckets(pen, bd, late ? NEAR_COLS.lateDark : NEAR_COLS.earlyDark);
    paintBuckets(pen, b, late ? NEAR_COLS.late : NEAR_COLS.early);
  }

  /* ------------------------------------------------------------------ */
  /* sprites: the live vegetation, carved at plate resolution            */
  /* ------------------------------------------------------------------ */
  // Each near clump is carved at rest into two bands (lower / upper, split at
  // half height) and swayed per frame with a shear in each band — the tips
  // bend further than the stems. The 萩 branch is one sprite rotated about its
  // corner. Built with Shot A's plates (same resolution), so no per-frame
  // vector cost.
  let SPR = null;
  function spriteOf(q, x0, y0, x1, y1, paint) {
    const px0 = Math.floor(x0 * q), py0 = Math.floor(y0 * q), px1 = Math.ceil(x1 * q), py1 = Math.ceil(y1 * q);
    const cv = B.canvas(Math.max(1, px1 - px0), Math.max(1, py1 - py0));
    const c = cv.getContext('2d');
    c.setTransform(q, 0, 0, q, -px0, -py0);
    c.imageSmoothingQuality = 'high';
    const qq = {};
    const pen = (id, fn) => { (qq[id] || (qq[id] = [])).push(fn); };
    paint(pen);
    for (const id of PRINT.ORDER) if (qq[id]) for (const f of qq[id]) { c.save(); f(c); c.restore(); }
    return trimSprite(cv, px0, py0, q);
  }
  /** Trim a sprite canvas to its ink (build time only) — empty margins still cost a blit. */
  function trimSprite(cv, px0, py0, q) {
    const whole = { cv, x: px0 / q, y: py0 / q, w: cv.width / q, h: cv.height / q };
    const K = 4, sw = Math.ceil(cv.width / K), sh = Math.ceil(cv.height / K);
    if (sw < 2 || sh < 2) return whole;
    const s = B.canvas(sw, sh), sc = s.getContext('2d');
    sc.drawImage(cv, 0, 0, sw, sh);
    const d = sc.getImageData(0, 0, sw, sh).data;
    let x0 = sw, y0 = sh, x1 = -1, y1 = -1;
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
      if (d[(y * sw + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    if (x1 < 0) return { cv: B.canvas(1, 1), x: px0 / q, y: py0 / q, w: 1 / q, h: 1 / q };
    const tx0 = Math.max(0, x0 * K - K), ty0 = Math.max(0, y0 * K - K);
    const tx1 = Math.min(cv.width, (x1 + 1) * K + K), ty1 = Math.min(cv.height, (y1 + 1) * K + K);
    if ((tx1 - tx0) * (ty1 - ty0) > 0.9 * cv.width * cv.height) return whole;
    const out = B.canvas(tx1 - tx0, ty1 - ty0);
    out.getContext('2d').drawImage(cv, -tx0, -ty0);
    return { cv: out, x: (px0 + tx0) / q, y: (py0 + ty0) / q, w: out.width / q, h: out.height / q };
  }
  /** Neighbouring clumps (similar depth, within ~130 px) share one sprite pair and one sway. */
  function clumpSprites(q, list, late) {
    const sorted = list.slice().sort((a, b) => a.x - b.x);
    const groups = [];
    const GW = late ? 230 : 130;
    for (const o of sorted) {
      const g = groups.find((gg) => Math.abs(gg.y - o.y) < 22 && o.x - gg.x0 < GW && !gg.closed);
      if (g) { g.m.push(o); g.y = Math.max(g.y, o.y); } else groups.push({ m: [o], x0: o.x, y: o.y });
      for (const gg of groups) if (o.x - gg.x0 > GW) gg.closed = true;
    }
    return groups.map((g) => {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, hmax = 0;
      for (const o of g.m) {
        x0 = Math.min(x0, o.x - o.h * 0.9 - 8); x1 = Math.max(x1, o.x + o.h * 0.9 + 8);
        y0 = Math.min(y0, o.y - o.h * 1.12 - 8); hmax = Math.max(hmax, o.h);
      }
      const y1 = g.y + 8;
      const split = Math.round((g.y - hmax * 0.45) * q) / q;
      const paint = (pen) => {
        for (const o of g.m) {
          const cols = late ? (o.dark ? NEAR_COLS.lateDark : NEAR_COLS.late) : (o.dark ? NEAR_COLS.earlyDark : NEAR_COLS.early);
          const b = newBuckets();
          clumpInto(o, 0, b, { keyAll: o.dark });
          paintBuckets(pen, b, cols);
        }
      };
      const cx = g.m.reduce((a, o) => a + o.x, 0) / g.m.length;
      const o = { x: cx, y: g.y, h: hmax, seed: g.m[0].seed };
      return { o, split, up: spriteOf(q, x0, y0, x1, split + 1 / q, paint), lo: spriteOf(q, x0, split, x1, y1, paint) };
    });
  }
  function buildSprites(q) {
    SPR = {
      q,
      near: clumpSprites(q, NEAR, false),
      nearLate: clumpSprites(q, NEAR_LATE, true),
      hagi: spriteOf(q, -70, -70, 480, 340, (pen) => paintHagi(pen, 0, false)),
      hagiLate: spriteOf(q, -70, -70, 480, 340, (pen) => paintHagi(pen, 0, true)),
    };
    SPR.nearLateAged = SPR.nearLate.map((g) => Object.assign({}, g, { up: ageSprite(g.up), lo: ageSprite(g.lo) }));
    SPR.hagiLateAged = ageSprite(SPR.hagiLate);
  }
  /** draw clump sprites with their sway (two-band shear) */
  function drawClumps(c, T, sprites, filter, alpha) {
    const w = wind(T);
    const a0 = c.globalAlpha;
    c.globalAlpha = a0 * alpha;
    for (const sp of sprites) {
      const o = sp.o;
      if (filter && !filter(o)) continue;
      // the lower band (stems, leaves) stands; the upper band (the plumes) bends
      // from the split line — a plain blit and one sheared blit per group
      const lean = Math.tan(leanAt(T, o.x, o.seed * 0.013, w) * (o.h > 150 ? 1.1 : 1));
      const L1 = lean * 1.9;
      c.setTransform(c.__m);
      c.drawImage(sp.lo.cv, sp.lo.x, sp.lo.y, sp.lo.w, sp.lo.h);
      c.transform(1, 0, -L1, 1, L1 * sp.split, 0);
      c.drawImage(sp.up.cv, sp.up.x, sp.up.y, sp.up.w, sp.up.h);
    }
    c.setTransform(c.__m);
    c.globalAlpha = a0;
  }

  /* ------------------------------------------------------------------ */
  /* CARVE                                                               */
  /* ------------------------------------------------------------------ */
  PRINT.defineShot('A', {
    layers: ['sky', 'far', 'mistHigh', 'grove', 'house', 'mistLow', 'field', 'pond', 'banks', 'still'],
    worn: true,
    build(P, q) {
      buildSprites(q);
      paintSky(buildPen(P, 'sky'), false);
      paintFar(buildPen(P, 'far'), false);
      paintMist(buildPen(P, 'mistHigh'), 'high', q);
      paintMist(buildPen(P, 'mistLow'), 'low', q);
      paintGrove(buildPen(P, 'grove'), false);
      paintHouse(buildPen(P, 'house'), false);
      paintField(buildPen(P, 'field'), false);
      paintPond(buildPen(P, 'pond'), false);
      paintBanks(buildPen(P, 'banks'), false);
      // the hand-carved late blocks (後摺) for the layers whose drawing changes,
      // with their own goma-zuri speckle and broken key lines
      const worn = (layer, fn) => {
        const ids = [];
        const pen = (id, f) => { if (!ids.includes(id)) ids.push(id); const c = P(layer, id + '~worn'); c.save(); f(c); c.restore(); };
        fn(pen);
        ids.forEach((id, n) => { if (id !== 'P8') wearPlate(P(layer, id + '~worn'), id, 700 + n * 31 + layer.length * 7); });
      };
      worn('sky', (pen) => paintSky(pen, true));
      worn('far', (pen) => paintFar(pen, true));
      worn('grove', (pen) => paintGrove(pen, true));
      worn('house', (pen) => paintHouse(pen, true));
      worn('field', (pen) => paintField(pen, true));
      worn('pond', (pen) => paintPond(pen, true));
      worn('banks', (pen) => paintBanks(pen, true));
      const ps = buildPen(P, 'still');
      paintNearInto(ps, 0, NEAR, false);
      paintHagi(ps, 0, false);
      paintSozuTube(ps, 0, false);
    },
  });

  /* ------------------------------------------------------------------ */
  /* LIVE ELEMENTS                                                       */
  /* ------------------------------------------------------------------ */
  A.moon = (T) => MOON.A(T);

  /** 山吹 glow strength of the rising moon (1 at the horizon → 0 high up). */
  const moonGlow = (T) => 1 - U.smoothstep(0.1, 0.62, MOON.phi(T));

  A.drawMoon = (ctx, T, opts = {}) => {
    const m = MOON.A(T);
    const a = opts.alpha == null ? 1 : opts.alpha;
    const gk = (opts.glow == null ? 1 : opts.glow) * moonGlow(T);
    ctx.save();
    ctx.clip(SKY_MASK);
    if (gk > 0.002) {
      const br = 1 + 0.06 * Math.sin((TAU * T) / 7);
      const gx = m.x, gy = m.y - 52 * (1 - U.smoothstep(-0.22, 0.3, MOON.phi(T)));
      const R = 300;
      const g = ctx.createRadialGradient(gx, gy, 60, gx, gy, R);
      g.addColorStop(0, U.rgba(C.yamabuki, 0.35 * gk * br));
      g.addColorStop(0.4, U.rgba(C.yamabuki, 0.13 * gk * br));
      g.addColorStop(1, U.rgba(C.yamabuki, 0));
      ctx.fillStyle = g;
      ctx.fillRect(gx - R, gy - R, R * 2, R * 2);
    }
    if (a > 0.002) {
      const late = T >= 160;
      MOON.draw(ctx, m.x, m.y, m.r, T, { alpha: a, halo: late ? 0.5 : 0.35 * (1 - gk), haloR: m.r * 1.9 });
    }
    ctx.restore();
    return m;
  };

  /** The horizon's 山吹 bokashi (printed with P6): 0.25 → 0.08 as the moon clears the susuki. */
  function horizonGlow(ctx, T) {
    if (T >= 60) return;
    const a = T < 30 ? 0.3 : U.lerp(0.3, 0.08, U.seg(T, 30, 40, U.ease.inOutSine)) * (1 - U.seg(T, 44, 60));
    PRINT.with(ctx, 'P6', T, (c) => {
      const g = c.createLinearGradient(0, 600, 0, 832);
      g.addColorStop(0, U.rgba(C.yamabuki, 0));
      g.addColorStop(1, U.rgba(C.yamabuki, a));
      c.save();
      c.clip(SKY_MASK);
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(0, 600); c.lineTo(620, 600); c.bezierCurveTo(710, 650, 750, 720, 780, 832); c.lineTo(0, 832); c.closePath();
      c.fill();
      c.restore();
    });
  }

  /** Print one Shot A layer (optionally in two passes around a live hook). */
  function layer(ctx, T, name, opts, mid) {
    const o = opts && opts.state ? { state: opts.state } : {};
    if (T >= PRINT.TIMES.jolt && T < PRINT.TIMES.jolt + PRINT.TIMES.joltDur + 0.05) o.wear = blockWear(T);
    // while the print table is still, TSUKI.SHOTS.printFlat (shot-a-prime.js) blits
    // a flattened snapshot of the layer's plates — one blit instead of five
    const flat = TSUKI.SHOTS.printFlat && !o.state;
    // the plates are cached 1:1 with the stage: while no camera scales them, a
    // moving plate (序's landings, the jolt) is blitted without resampling — the
    // offset snaps to the device pixel, ten times cheaper than a filtered blit
    const m = ctx.getTransform(), k = ctx.canvas.width / W;
    const unit = Math.abs(m.a - k) < 1e-3 && Math.abs(m.d - k) < 1e-3 && Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6;
    const draw = (extra) => {
      const se = ctx.imageSmoothingEnabled;
      if (unit) ctx.imageSmoothingEnabled = false;
      if (flat) TSUKI.SHOTS.printFlat(ctx, T, 'A', name, Object.assign(extra, o.wear == null ? {} : { wear: o.wear }));
      else PRINT.drawLayer(ctx, 'A', name, T, Object.assign(extra, o));
      ctx.imageSmoothingEnabled = se;
    };
    if (!mid) return draw({});
    draw({ skip: ['K', 'P8'] });
    ctx.save(); mid(ctx); ctx.restore();
    draw({ only: ['K', 'P8'] });
  }
  A.drawSky = (ctx, T, opts) => {
    const st = (opts && opts.state) || PRINT.state(T);
    if (st.ichimonji > 0 && st.ichimonji < 1) return ichimonjiWipe(ctx, T, st);
    layer(ctx, T, 'sky', opts);
  };
  /** 序 9.0–9.6: the ichimonji block is inked across the top — a feathered, brushed front, not a clip */
  let wipeBuf = null;
  function ichimonjiWipe(ctx, T, st) {
    PRINT.drawLayer(ctx, 'A', 'sky', T, { state: st, only: ['P6'] });
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    if (!wipeBuf || wipeBuf.width !== cw || wipeBuf.height !== ch) wipeBuf = B.canvas(cw, ch);
    const b = wipeBuf.getContext('2d');
    b.setTransform(1, 0, 0, 1, 0, 0);
    b.globalCompositeOperation = 'source-over';
    b.globalAlpha = 1;
    b.clearRect(0, 0, cw, Math.ceil(ch * 0.2));
    b.setTransform(ctx.getTransform());
    PRINT.drawLayer(b, 'A', 'sky', T, { state: Object.assign({}, st, { ichimonji: 1 }), only: ['P6i'] });
    b.globalCompositeOperation = 'destination-out';
    const fx = W * st.ichimonji;
    for (let y = -12; y < 150; y += 3) {
      const front = fx + (U.noise1(y * 0.045, 9) - 0.5) * 22 + (U.noise1(y * 0.3, 19) - 0.5) * 6;
      const g = b.createLinearGradient(front - 80, 0, front, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.7, 'rgba(0,0,0,0.6)');
      g.addColorStop(1, 'rgba(0,0,0,1)');
      b.fillStyle = g;
      b.fillRect(front - 80, y, 80, 3.2);
      b.fillStyle = '#000';
      b.fillRect(front - 0.5, y, W + 40 - front, 3.2);
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(wipeBuf, 0, 0, cw, Math.ceil(ch * 0.2), 0, 0, cw, Math.ceil(ch * 0.2));
    ctx.restore();
    PRINT.drawLayer(ctx, 'A', 'sky', T, { state: st, only: ['P8'] });
  }
  A.drawFar = (ctx, T, opts) => layer(ctx, T, 'far', opts);
  A.drawGrove = (ctx, T, opts) => layer(ctx, T, 'grove', opts);
  A.drawField = (ctx, T, opts) => layer(ctx, T, 'field', opts);
  A.drawPondLayer = (ctx, T, opts) => layer(ctx, T, 'pond', opts);
  A.drawBanks = (ctx, T, opts) => layer(ctx, T, 'banks', opts);

  /** Kasumi drift: +3 px/s (continuous within each stretch of Shot A). */
  function mistDrift(T) {
    if (T < 60) return 3 * (T - 12);
    if (T < 150) return 3 * (T - 113);
    return -24;          // 後摺: the bands are printed, still
  }
  A.drawMist = (ctx, T, which, opts) => {
    const d = mistDrift(T) * (which === 'low' ? 1.2 : 1);
    ctx.save();
    ctx.translate(d, 0);
    layer(ctx, T, which === 'low' ? 'mistLow' : 'mistHigh', opts);
    ctx.restore();
  };

  /** The andon behind the shoji (P2): 1 until 37.0, gone by 38.2. */
  const andonAt = (T) => (T < 37 ? 1 : 1 - U.seg(T, 37, 38.2, U.ease.inOutSine));
  A.andon = andonAt;
  /**
   * The lamplit shoji, printed from the warm block: one flat 山吹 over the
   * paper, a wiped bokashi band under the eave, the andon's own paper shade a
   * flat brighter patch, and a flat hard-edged spill on the boards and the yard.
   * No airbrushed glow — the moon's halo is the only glow in the film.
   */
  const SPILL = (() => {
    const S = GEO.shoji, p = new Path2D();
    p.moveTo(S.x0 - 18, 692); p.lineTo(S.x1 + 18, 692); p.lineTo(S.x1 + 52, 742); p.lineTo(S.x0 - 48, 742); p.closePath();
    return p;
  })();
  function andonLight(ctx, T, amt) {
    if (amt <= 0.003) return;
    const S = GEO.shoji;
    const pw = S.x1 - S.x0, ph = S.y1 - S.y0 - 18;
    const [ax, ay] = GEO.andon;
    PRINT.with(ctx, 'P2', T, (c) => {
      c.globalAlpha *= amt;
      c.fillStyle = U.rgba(C.yamabuki, 0.45);
      c.fillRect(S.x0, S.y0, pw, ph);
      const g = c.createLinearGradient(0, S.y0, 0, S.y0 + 32);
      g.addColorStop(0, U.rgba(U.mix(C.yamabuki, C.odo, 0.5), 0.22));
      g.addColorStop(1, U.rgba(U.mix(C.yamabuki, C.odo, 0.5), 0));
      c.fillStyle = g;
      c.fillRect(S.x0, S.y0, pw, 32);
      // the andon just behind the paper: its shade prints as one flat, brighter patch
      c.fillStyle = U.rgba(U.mix(C.yamabuki, C.gofun, 0.6), 0.5);
      c.fillRect(ax - 15, ay - 26, 30, 50);
      // the spill on the boards and the ground: flat, hard-edged
      c.fillStyle = U.rgba(C.yamabuki, 0.15);
      c.fill(SPILL);
    });
  }
  A.drawHouse = (ctx, T, opts = {}) => {
    const amt = opts.andon == null ? andonAt(T) : opts.andon;
    layer(ctx, T, 'house', opts, (c) => {
      andonLight(c, T, amt);
      if (opts.figures !== false) PRINT.with(c, 'P4', T, (k) => shojiShadow(k, T, amt));
    });
  };

  /* offerings ------------------------------------------------------------ */
  // one dango per koto pluck — the score's own table (TSUKI.CUES) when present
  const CU0 = TSUKI.CUES || {};
  const DANGO_TIMES = CU0.dango && CU0.dango.length === 15 ? CU0.dango.slice() : [22.4, 22.85, 23.3, 23.75, 24.2, 24.65, 25.1, 25.55, 26.0, 26.8, 27.25, 27.7, 28.15, 28.95, 29.4];
  const DANGO_TIMES_LATE = CU0.dangoLate && CU0.dangoLate.length === 15 ? CU0.dangoLate.slice() : [161.2, 161.7, 162.2, 162.7, 163.2, 163.7, 164.2, 164.7, 165.2, 165.95, 166.45, 166.95, 167.45, 168.2, 168.7];
  A.DANGO_TIMES = DANGO_TIMES;
  A.DANGO_TIMES_LATE = DANGO_TIMES_LATE;
  const DANGO_POS = (() => {
    const o = [];
    const r = 3.9;
    for (const [row, dy] of [[0, -2.4], [1, -1.2], [2, 0]]) for (const dx of [-8.2, 0, 8.2]) o.push([dx + (row - 1) * 0.6, -17 - r + dy]);
    for (const [row, dy] of [[0, -1.0], [1, 0]]) for (const dx of [-4.2, 4.2]) o.push([dx + row * 0.4, -17 - r - 6.2 + dy]);
    for (const dx of [-4.1, 4.1]) o.push([dx, -17 - r - 12.4]);
    return o;
  })();
  function dangoCount(T) {
    if (T >= 160) return DANGO_TIMES_LATE.filter((t) => T >= t).length;
    if (T < 22.4) return 0;
    if (T >= 41) return T >= 111.5 ? 13 : 14;
    return DANGO_TIMES.filter((t) => T >= t).length - (T >= 33.0 ? 1 : 0);
  }
  A.dangoCount = dangoCount;

  A.drawOfferings = (ctx, T, opts = {}) => {
    const pen = livePen(ctx, T);
    const late = T >= 160;
    const n = dangoCount(T);
    const [sx, sy] = [SANBO.x, SANBO.y];
    if (n > 0) {
      const d = new Path2D();
      for (let i = 0; i < n; i++) {
        const [dx, dy] = DANGO_POS[i];
        d.moveTo(sx + dx + 3.9, sy + dy);
        d.ellipse(sx + dx, sy + dy, 3.9, 3.7, 0, 0, TAU);
      }
      pen('P7', (c) => { c.fillStyle = late ? (opts.aged ? aged(U.mix(C.gofun, C.torinoko, 0.3)) : U.mix(C.gofun, C.torinoko, 0.3)) : C.gofun; c.fill(d); });
      pen('K', (c) => inkLine(c, d, 0.55, 0.6));
    }
    if (!late) {
      if (T >= 29.5) {
        const [dx, dy] = GEO.dish;
        const dish = new Path2D();
        dish.ellipse(dx, dy - 2, 11, 2.6, 0, 0, TAU);
        const imo = new Path2D(), tips = new Path2D();
        for (const [ox, oy, a] of [[-5, -5, -0.3], [1, -6, 0.1], [6, -4.6, 0.4], [-1.5, -9, -0.1]]) {
          imo.moveTo(dx + ox + 3.3, dy + oy);
          imo.ellipse(dx + ox, dy + oy, 3.3, 2.4, a, 0, TAU);
          tips.moveTo(dx + ox + Math.cos(a - 1.3) * 2.2 + 1, dy + oy - 2);
          tips.ellipse(dx + ox + Math.cos(a - 1.3) * 2.2, dy + oy - 2, 1, 0.9, 0, 0, TAU);
        }
        pen('P7', (c) => { c.fillStyle = U.mix(C.gofun, C.ginnezu, 0.2); c.fill(dish); });
        pen('P3', (c) => { c.fillStyle = C.susuki; c.fill(imo); });
        pen('K', (c) => { inkLine(c, dish, 0.7, 0.7); inkLine(c, imo, 0.6, 0.55); c.fillStyle = U.rgba(C.sumi, 0.85); c.fill(tips); });
        const st = U.seg(T, 29.5, 30.4);
        if (st > 0) {
          pen('P7', (c) => {
            c.lineCap = 'round';
            for (let k = 0; k < 3; k++) {
              const x0 = dx - 4 + k * 4, len = 26 + k * 6;
              c.strokeStyle = U.rgba(C.gofun, 0.35 * st);
              c.lineWidth = 1.3;
              c.beginPath();
              for (let j = 0; j <= 10; j++) {
                const s = j / 10;
                const x = x0 + Math.sin(s * 5 + T * 1.6 + k * 2) * 2.6 * s + s * 4;
                const y = dy - 9 - s * len;
                j ? c.lineTo(x, y) : c.moveTo(x, y);
              }
              c.stroke();
            }
          });
        }
      }
      if (T >= 30.5 || opts.flowers) {
        const [jx, jy] = GEO.jug;
        const b = newBuckets();
        const lean = leanAt(T, jx, 1.7) * 0.4;
        clumpInto({ x: jx, y: jy - 18, h: 36, n: 4, spread: 1.0, seed: 81, blades: 2, hairs: 8, kf: 1, side: -0.5 }, lean, b);
        paintBuckets(pen, b, { stem: ['P3', C.matsuba], blade: ['P3', INK.moss], hair: ['P3', C.susuki], hairHi: ['P7', U.mix(C.gofun, C.susuki, 0.3)], key: [0.75, 0.6] });
        const hg = new Path2D(), om = new Path2D(), kk = new Path2D(), stm = new Path2D();
        const spray = (x0, y0, x1, y1, bucket, nn, rr) => {
          stm.moveTo(x0, y0); stm.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - 4, x1, y1);
          for (let i = 0; i < nn; i++) { const s = 0.5 + (i / nn) * 0.5; const x = U.lerp(x0, x1, s) + (i % 2 ? 1.5 : -1.5), y = U.lerp(y0, y1, s) - Math.sin(s * Math.PI) * 4; bucket.moveTo(x + rr, y); bucket.ellipse(x, y, rr, rr, 0, 0, TAU); }
        };
        spray(jx - 2, jy - 18, jx - 22, jy - 30, hg, 6, 1.5);
        spray(jx + 2, jy - 18, jx + 17, jy - 34, hg, 5, 1.4);
        spray(jx, jy - 18, jx - 6, jy - 40, om, 5, 1.3);
        for (const [x, y] of [[jx + 8, jy - 27], [jx - 12, jy - 24]]) {
          for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU - Math.PI / 2; kk.moveTo(x, y); kk.lineTo(x + Math.cos(a) * 2.8, y + Math.sin(a) * 2.8); kk.lineTo(x + Math.cos(a + 0.63) * 1.2, y + Math.sin(a + 0.63) * 1.2); }
          stm.moveTo(jx, jy - 18); stm.lineTo(x, y);
        }
        pen('P3', (c) => inkLine(c, stm, 1, 0.8, C.matsuba));
        pen('P2', (c) => { c.fillStyle = C.hagi; c.fill(hg); c.fillStyle = C.yamabuki; c.fill(om); });
        pen('P6', (c) => { c.fillStyle = C.kikyo; c.fill(kk); });
      }
    }
    pen.flush();
  };
  /** 後摺: the strip of the faded heko-obi tying the jug's susuki — hand-applied 退紅, after the print and after the years */
  A.drawStrip = (ctx, T, a = 1) => {
    const [jx, jy] = GEO.jug;
    ctx.save();
    ctx.globalAlpha *= a * U.smoothstep(160.1, 160.6, T);
    ctx.fillStyle = U.rgba(C.toki, 0.92);
    ctx.beginPath();
    ctx.ellipse(jx + 0.6, jy - 24.5, 4.2, 1.5, -0.12, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(jx + 3.5, jy - 24); ctx.quadraticCurveTo(jx + 6.5, jy - 21, jx + 7, jy - 16); ctx.lineTo(jx + 5.4, jy - 15.8); ctx.quadraticCurveTo(jx + 5, jy - 20, jx + 2.4, jy - 23); ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  /* the figures ---------------------------------------------------------- */
  // 小夜's loop (池をめぐりて): out of the susuki and across the rising disc (21.0),
  // along the moon-pool's far bank, down the spit past the sōzu and the tsukubai
  // and out of frame toward us; round the pool's near end unseen; back up its
  // west shore from the frame's corner, along the water's edge (her reflection
  // running below her) and up the yard to the jug, walking by 30.35.
  const SAYO_KEYS = [
    [16.6, 44, 798], [18.0, 112, 795], [21.0, 190, 790], [21.7, 262, 810], [22.2, 322, 838],
    [22.75, 364, 896], [23.3, 392, 986], [23.8, 428, 1080], [24.3, 452, 1290],
    [25.0, -40, 1300], [25.45, 12, 1068], [25.9, 28, 930], [26.25, 48, 866], [26.6, 110, bankY(110) - 3],
    [28.3, 600, bankY(600) - 3], [29.05, 790, bankY(790) - 5], [29.6, 860, 778], [30.0, 918, 746], [30.35, 944, 734],
  ];
  function sayoKeyAt(T) {
    const K = SAYO_KEYS, n = K.length;
    if (T <= K[0][0]) return [K[0][1], K[0][2]];
    if (T >= K[n - 1][0]) return [K[n - 1][1], K[n - 1][2]];
    let i = 0;
    while (T > K[i + 1][0]) i++;
    const p0 = K[Math.max(0, i - 1)], p1 = K[i], p2 = K[i + 1], p3 = K[Math.min(n - 1, i + 2)];
    const u = (T - p1[0]) / (p2[0] - p1[0]);
    // Catmull-Rom with time-scaled tangents (non-uniform key spacing)
    const h = p2[0] - p1[0];
    const tan = (a, b, c) => [(c[1] - a[1]) / (c[0] - a[0] || 1) * h, (c[2] - a[2]) / (c[0] - a[0] || 1) * h];
    const m1 = tan(p0, p1, p2), m2 = tan(p1, p2, p3);
    const u2 = u * u, u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
    return [h00 * p1[1] + h10 * m1[0] + h01 * p2[1] + h11 * m2[0], h00 * p1[2] + h10 * m1[1] + h01 * p2[2] + h11 * m2[1]];
  }
  // distance run so far (for the stride phase) — a fixed table, built once
  const SAYO_DIST = (() => {
    const out = [];
    let d = 0, prev = sayoKeyAt(16.6);
    for (let T = 16.6; T <= 30.4 + 1e-9; T += 0.02) {
      const q = sayoKeyAt(T);
      const k = U.lerp(0.4, 0.6, U.clamp((q[1] - 820) / 300)) / 0.4;
      d += Math.hypot(q[0] - prev[0], q[1] - prev[1]) / k;
      out.push(d);
      prev = q;
    }
    return out;
  })();
  const sayoDist = (T) => { const f = U.clamp((T - 16.6) / 0.02, 0, SAYO_DIST.length - 1), i = Math.floor(f); return U.lerp(SAYO_DIST[i], SAYO_DIST[Math.min(SAYO_DIST.length - 1, i + 1)], f - i); };
  const depthScale = (y) => U.lerp(0.4, 0.6, U.clamp((y - 820) / 300));
  /** where 小夜 ducks under the engawa for the dango, and where her arm comes over the lip */
  const STEAL = { x: 1000, y: 738, arm: [993, 693], s: 0.42 };
  A.STEAL = STEAL;
  /** the arm's reach for the top dango: rises 32.7 → 33.0 (the grab on the beat), gone by 33.5 */
  const stealReach = (T) => (T < 33.0 ? U.seg(T, 32.7, 33.0, U.ease.inOutSine) : 1 - U.seg(T, 33.05, 33.45, U.ease.inOutSine));

  /** 小夜 (the child) at T — {x, y, s, pose, facing, t, look, gaze, hidden, sheaf, run, under, steal, reach, dango}. */
  A.sayo = (T, opts = {}) => {
    if (T < 16.6) return { hidden: true };
    if (T < 30.35) {
      const [x, y] = sayoKeyAt(T);
      const a = sayoKeyAt(T - 0.06), b = sayoKeyAt(T + 0.06);
      const facing = b[0] - a[0] < -0.4 ? -1 : 1;
      const walk = T < 21.4 || T > 30.0;
      return { x, y, s: depthScale(y), pose: 'carry-susuki', facing, t: sayoDist(T) / (walk ? 34 : 58), sheaf: 300, run: !walk };
    }
    if (T < 30.5) return { x: 944, y: 734, s: 0.4, pose: 'carry-susuki', facing: 1, t: sayoDist(30.35) / 34, sheaf: 300 };
    if (T < 31.4) return { x: 944, y: 734, s: 0.4, pose: 'stand', facing: 1, t: T };
    if (T < 32.35) {
      // she creeps along the front of the engawa toward the 三方
      const u = U.seg(T, 31.4, 32.35, U.ease.inOutSine);
      return { x: U.lerp(944, STEAL.x, u), y: U.lerp(734, STEAL.y, u), s: 0.4, pose: 'run', facing: 1, t: T * 0.55 };
    }
    if (T < 32.6) return { x: STEAL.x, y: STEAL.y, s: 0.4, pose: 'reach', facing: 1, t: T };
    if (T < 34.2) {
      // under the engawa, in the dark of the crawlspace: only the arm comes out over the lip
      const reach = stealReach(T);
      return { x: STEAL.x, y: STEAL.y, s: 0.4, pose: 'reach', facing: 1, t: T, under: true, steal: T >= 32.7 && T < 33.5, reach, dango: T >= 33.0 };
    }
    if (T < 34.8) {
      // out from under, and up onto the engawa beside her
      const u = U.seg(T, 34.2, 34.8, U.ease.inOutSine);
      return { x: U.lerp(STEAL.x, GEO.seat[0], u), y: U.lerp(STEAL.y, GEO.seat[1], u) - Math.sin(u * Math.PI) * 10, s: 0.4, pose: u < 0.2 ? 'reach' : u < 0.6 ? 'stand' : 'kneel-back', facing: 1, t: T, look: 0.2 };
    }
    if (T < 60) {
      const eat = T < 37 ? Math.max(0, Math.sin((T - 34.8) * 4.2)) * 0.12 : 0;
      return { x: GEO.seat[0], y: GEO.seat[1], s: 0.4, pose: 'kneel-back', facing: 1, t: T, look: 0.15 - eat, gaze: opts.gazeOut || 0 };
    }
    if (T < 114) return { x: GEO.seat[0], y: GEO.seat[1], s: 0.4, pose: 'kneel-back', facing: 1, t: T, look: T > 112.5 ? 0.05 - Math.max(0, Math.sin((T - 112.5) * 4)) * 0.1 : 0.2 };
    if (T < 160) {
      const settle = U.seg(T, 115.5, 116.5, U.ease.inOutSine) * 3;
      return { x: GEO.take[0] - 16, y: GEO.take[1] - 2 + settle, s: 0.4, pose: 'sleep', facing: -1, t: T };
    }
    return { hidden: true };
  };

  /** the stacking bow: the hands dip as each dango is set down on its pluck */
  function stackDip(T, times) {
    let d = 0;
    for (const ti of times) { const x = (T - ti + 0.03) / 0.11; if (x > -3 && x < 3) d = Math.max(d, Math.exp(-x * x)); }
    return d;
  }
  const lastBefore = (T, times) => { let l = -1e9; for (const ti of times) if (ti <= T) l = ti; return l; };

  /** たけ (and, from 160, old 小夜 on her exact path). */
  A.take = (T) => {
    const [tx, ty] = GEO.take;
    const s = 0.34;
    if (T >= 160) {
      const settle = T < 161 ? -2 * (1 - U.seg(T, 160.6, 161, U.ease.inOutSine)) : 0;
      const stack = T >= 161.0 && T < 168.95;
      const lt = lastBefore(T, DANGO_TIMES_LATE);
      return { x: tx, y: ty + settle, s, pose: stack ? 'stack' : 'seiza', facing: -1, look: 0, t: T, dip: stack ? stackDip(T, DANGO_TIMES_LATE) : 0, dango: stack && T - lt > 0.2 && T < DANGO_TIMES_LATE[14] };
    }
    // she comes round the house's corner onto the engawa and walks, slowly, to the offerings
    if (T < 14.6) return { hidden: true };
    if (T < 21.3) { const u = U.seg(T, 14.6, 21.3, U.ease.outSine); return { x: U.lerp(1486, tx, u), y: ty, s, pose: 'walk', facing: -1, t: T, walk: true, clipX: 1455 }; }
    if (T < 22) return { x: tx, y: ty, s, pose: 'seiza', facing: -1, look: 0.25, t: T };
    if (T < 29.6) {
      const lt = lastBefore(T, DANGO_TIMES);
      // after the fifteenth dango she sets down the dish of 衣かつぎ (29.5)
      return { x: tx, y: ty, s, pose: 'stack', facing: -1, t: T, dip: stackDip(T, DANGO_TIMES.concat([29.5])), dango: T - lt > 0.2 && T < DANGO_TIMES[14] };
    }
    if (T < 30.0) return { x: tx, y: ty, s, pose: 'seiza', facing: -1, look: 0.25, t: T };
    // the stand built, she turns to the lamplit room … the arm steals behind her back;
    // at 33.6 she turns back — her face already lifted to the moon, above the thief
    if (T < 33.6) return { x: tx, y: ty, s, pose: 'seiza', facing: 1, look: 0.1, t: T };
    if (T < 36.0) return { x: tx, y: ty, s, pose: 'seiza', facing: -1, look: -1.05, t: T };
    // 36.0–36.4: she shuffles on her knees (膝行) to the shoji and slips inside …
    if (T < 36.4) { const u = U.seg(T, 36.0, 36.4, U.ease.inOutSine); return { x: U.lerp(tx, tx + 26, u), y: ty - Math.abs(Math.sin(u * Math.PI * 2)) * 1.2, s, pose: 'seiza', facing: 1, look: 0.2, t: T }; }
    // … and from 36.4 she is inside: her shadow crosses the lit paper (see shojiShadow)
    if (T < 60) return { hidden: true, inside: true };
    if (T >= 111.5 && T < 112.5) return { x: tx, y: ty, s, pose: 'stack', facing: -1, t: T, dango: T < 112.3 };
    return { x: tx, y: ty, s, pose: 'seiza', facing: -1, look: T > 114 ? 0.45 : 0.15, t: T };
  };
  /** たけ's shadow on the lamplit shoji as she goes to the andon (36.4–37.2), fading with its light */
  function shojiShadow(c, T, amt) {
    if (T < 36.4 || T > 38.3 || amt <= 0.01) return;
    const CAST = TSUKI.CAST;
    if (!CAST) return;
    const S = GEO.shoji;
    const u = U.seg(T, 36.4, 36.95, U.ease.inOutSine);
    const x = U.lerp(1098, 1132, u);
    const bend = T >= 36.95;
    c.save();
    c.beginPath();
    c.rect(S.x0, S.y0, S.x1 - S.x0, S.y1 - S.y0 - 18);
    c.clip();
    c.globalAlpha *= amt * 0.72;
    CAST.grandma(c, x, S.y1 + 2, 0.4, { pose: bend ? 'stack' : 'walk', facing: 1, t: T * 0.8, silhouette: INK.ainezu, dango: false, noBuffer: true });
    c.restore();
  }

  /** 小夜 turning to look out of the window (六 inset): three keys — back, profile, ¾ — each landing like a new block. */
  function sayoGaze(c, st, g) {
    const CAST = TSUKI.CAST;
    const x = st.x, y = st.y, s = st.s;
    // hard key swaps (never two keys at partial alpha): back → profile at 0.25, profile → ¾ at 0.6;
    // each new key lands 1–2 px out of register for two frames, then settles
    const key = g < 0.25 ? 0 : g < 0.6 ? 1 : 2;
    const land = key === 1 ? g - 0.25 : key === 2 ? g - 0.6 : 1;
    const jit = land < 0.07 ? [1.2, -0.8] : [0, 0];
    c.save();
    c.translate(jit[0], jit[1]);
    if (key === 0) CAST.child(c, x, y, s, { pose: 'kneel-back', t: st.t, look: st.look });
    else if (key === 1) CAST.child(c, x - 2, y, s, { pose: 'sit', facing: -1, t: st.t });
    else {
      // ¾ toward us (local stand-in for CAST): the kneeling profile body, the
      // head turned out — a flat 胡粉 face under the okappa fringe, two 5 px
      // Harunobu slit-eyes, no mouth
      const ret = CAST.child(c, x - 2, y, s, { pose: 'sit', facing: -1, t: st.t });
      const k = s / 0.4;
      const hx = ret && ret.head ? ret.head[0] : x - 6 * k, hy = ret && ret.head ? ret.head[1] : y - 34 * k;
      c.translate(hx + 0.6 * k, hy + 0.4 * k);
      c.scale(k, k);
      c.fillStyle = C.sumi;
      c.beginPath();
      c.moveTo(-6.6, 3.8); c.bezierCurveTo(-7.8, -4.8, -3.8, -8.6, 0.6, -8.6); c.bezierCurveTo(5.4, -8.6, 8.4, -4.4, 7.4, 3.6);
      c.lineTo(5.6, 3.8); c.lineTo(5.0, -1.4); c.lineTo(-3.6, -1.7); c.lineTo(-4.8, 3.8); c.closePath();
      c.fill();
      c.fillStyle = C.gofun;
      c.beginPath();
      c.moveTo(-3.6, -1.6); c.lineTo(5.0, -1.4); c.bezierCurveTo(5.6, 2.8, 3.4, 5.9, 0.4, 5.9); c.bezierCurveTo(-2.8, 5.9, -4.6, 2.8, -3.6, -1.6); c.closePath();
      c.fill();
      c.strokeStyle = U.rgba(C.sumi, 0.75);
      c.lineWidth = 0.35;
      c.stroke();
      c.fillStyle = C.sumi;
      c.fillRect(-3.7, -2.2, 8.8, 1.2);
      c.lineWidth = 0.6;
      c.lineCap = 'round';
      c.strokeStyle = C.sumi;
      c.beginPath();
      c.moveTo(-2.5, 1.1); c.quadraticCurveTo(-1.7, 0.8, -0.9, 1.2);
      c.moveTo(1.5, 1.2); c.quadraticCurveTo(2.3, 0.8, 3.1, 1.1);
      c.stroke();
    }
    c.restore();
  }

  function drawSayo(c, T, st) {
    const CAST = TSUKI.CAST;
    if (st.gaze > 0) return sayoGaze(c, st, st.gaze);
    if (st.under) {
      // crouched in the crawlspace: a dark shape against the dark, below the lip
      c.save();
      c.beginPath();
      c.rect(GEO.engawa.x0 + 10, GEO.engawa.y1 + 1, GEO.engawa.x1 - GEO.engawa.x0 - 20, 26);
      c.clip();
      CAST.child(c, st.x, st.y, st.s, { pose: 'reach', facing: 1, t: st.t, silhouette: U.mix(INK.under, C.sumi, 0.45), noBuffer: true });
      c.restore();
      if (st.steal) CAST.child(c, STEAL.arm[0], STEAL.arm[1], STEAL.s, { pose: 'steal', facing: 1, reach: st.reach, dango: st.dango, t: T });
      return;
    }
    const o = { pose: st.pose, facing: st.facing, t: st.t, sheaf: st.sheaf, look: st.look, wind: 0.3 };
    if (st.pose === 'sleep') o.haori = false;
    CAST.child(c, st.x, st.y, st.s, o);
  }
  let agedOld = null;
  const AGED_OLD_SAYO = () => {
    if (agedOld) return agedOld;
    const base = Object.assign({}, (TSUKI.CAST.palettes && TSUKI.CAST.palettes.oldSayo) || {}, { obijime: U.mix(C.kon, C.ginnezu, 0.3) });
    agedOld = {};
    for (const k of Object.keys(base)) if (typeof base[k] === 'string' && base[k][0] === '#') agedOld[k] = aged(base[k]);
    return agedOld;
  };
  /** the old woman / grandmother, bowing a little as each dango is set down */
  function drawElder(c, fn, tk, extra) {
    const o = Object.assign({ pose: tk.pose, facing: tk.facing, t: tk.walk ? tk.t * 0.8 : tk.t, look: tk.look, dango: tk.dango === true || (tk.dango !== false && tk.pose === 'stack' && tk.dip == null) }, extra);
    if (tk.dip) {
      c.save();
      const kx = tk.x + tk.facing * 10, ky = tk.y;
      c.translate(kx, ky + tk.dip * 1.6);
      c.rotate(tk.facing * 0.045 * tk.dip);
      c.translate(-kx, -ky);
      fn(c, tk.x, tk.y, tk.s, o);
      c.restore();
    } else fn(c, tk.x, tk.y, tk.s, o);
  }

  A.drawFigures = (ctx, T, opts = {}) => {
    const CAST = TSUKI.CAST;
    if (!CAST) return;
    const late = opts.late == null ? T >= 160 : opts.late;
    const tk = A.take(T);
    PRINT.with(ctx, 'K', T, (c) => {
      if (late) {
        drawElder(c, CAST.oldSayo, tk, opts.aged ? { palette: AGED_OLD_SAYO(), ink: aged(C.sumi) } : { palette: { obijime: U.mix(C.kon, C.ginnezu, 0.3) } });
        return;
      }
      const sy = opts.sayo || A.sayo(T, opts);
      const behindTake = !sy.hidden && sy.pose === 'sleep';
      if (behindTake) drawSayo(c, T, sy);
      if (!tk.hidden) {
        if (tk.clipX) { c.save(); c.beginPath(); c.rect(-10, 0, tk.clipX + 10, H); c.clip(); }
        drawElder(c, CAST.grandma, tk, { palette: { obijime: INK.ebicha } });
        if (tk.clipX) c.restore();
      }
      if (!sy.hidden && !behindTake && !opts.noSayo) {
        drawSayo(c, T, sy);
        const m = MOON.A(T);
        if (T < 40 && sy.y < 826 && !sy.under && Math.abs(sy.x - m.x) < m.r + 70) {
          // against the disc she prints as a flat 墨 silhouette, sheaf and all
          c.save();
          c.clip(SKY_MASK);
          c.beginPath();
          c.arc(m.x, m.y, m.r + 0.5, 0, TAU);
          c.clip();
          CAST.child(c, sy.x, sy.y, sy.s, { pose: sy.pose, facing: sy.facing, t: sy.t, sheaf: sy.sheaf, silhouette: C.sumi, wind: 0.3 });
          c.restore();
        }
      }
    });
  };

  /** 小夜's reflection in the pond (墨 α 0.35, broken by the moon road's rows). */
  function sayoReflection(ctx, T, st) {
    const CAST = TSUKI.CAST;
    if (!CAST || st.hidden || st.gaze || st.y > 900) return;
    const by = bankY(st.x) + 1;
    if (st.y < by - 14) return;
    PRINT.with(ctx, 'K', T, (c) => {
      c.save();
      c.clip(POND);
      const band = new Path2D();
      for (let y = by; y < by + 110; y += 5) band.rect(st.x - 110, y, 220, 3.3);
      c.clip(band);
      c.translate(0, by * 2);
      c.scale(1, -1);
      c.globalAlpha *= 0.35;
      CAST.child(c, st.x, st.y, st.s, { pose: st.pose, facing: st.facing, t: st.t, sheaf: st.sheaf, silhouette: C.sumi, wind: 0.3, noBuffer: true });
      c.restore();
    });
  }

  /** The moon road: Hiroshige's column of horizontal 胡粉 dashes under the moon. */
  A.drawPond = (ctx, T, opts = {}) => {
    const late = T >= 160;
    const m = MOON.A(T);
    const st = opts.sayo || (opts.figures === false ? { hidden: true } : A.sayo(T, opts));
    if (!late && opts.figures !== false) sayoReflection(ctx, T, st);
    const amt = opts.andon == null ? andonAt(T) : opts.andon;
    if (!late && amt > 0.003) {
      // the lamplit shoji, broken into warm dashes under the far bank (a column that narrows away)
      PRINT.with(ctx, 'P2', T, (c) => {
        const r = U.rng(31);
        for (let i = 0; i < 22; i++) {
          const s = i / 21;
          const y = 838 + s * 92 + r() * 2;
          const span = U.lerp(190, 60, s);
          const w = U.lerp(14, 70, r()) * U.lerp(1, 0.55, s);
          const x = 1170 + U.lerp(-span, span, r()) + Math.sin(T * 1.3 + i * 1.9) * 5;
          c.fillStyle = U.rgba(C.yamabuki, U.lerp(0.62, 0.18, s) * amt * (0.8 + 0.2 * Math.sin(T * 2.1 + i)));
          c.fillRect(x - w / 2, y, w, 2.4);
        }
      });
    }
    const bright = late ? 0.85 : U.lerp(0.55, 1, U.smoothstep(-0.2, 0.5, MOON.phi(T)));
    PRINT.with(ctx, 'P7', T, (c) => {
      c.save();
      c.clip(POND);
      const r = U.rng(late ? 88 : 8);
      const n = late ? 8 : 40;
      const top = bankY(m.x) + 4;
      for (let i = 0; i < n; i++) {
        const s = late ? (i + 0.5) / n : Math.pow(i / n, 1.3);
        const y = top + s * (1070 - top) + r() * 3;
        const spread = U.lerp(m.r * 0.3, m.r * 0.95, s);
        const w = U.lerp(5, 42, r()) * U.lerp(0.75, 1.25, s);
        const sh = Math.sin(y * 0.19 + T * 1.7 + i) * 3 + U.wobble(T * 0.6 + i * 0.37, 11) * 5;
        const x = m.x + U.lerp(-spread, spread, r()) * 0.9 + sh;
        const inBand = y > 955 && y < 1045;
        const a = (late ? 0.6 : U.lerp(0.95, 0.45, s)) * bright * (inBand ? 0.38 : 1) * (0.78 + 0.22 * Math.sin(T * 2.3 + i * 1.7));
        c.fillStyle = U.rgba(opts.aged ? aged(C.gofun) : C.gofun, Math.min(1, a));
        c.fillRect(x - w / 2, y, w, 2.2);
      }
      c.restore();
    });
  };

  /** The near susuki (live, ≈150 plumes). opts.split 'back'|'front' with opts.depth. */
  A.drawNearSusuki = (ctx, T, opts = {}) => {
    PRINT.shot('A');   // carve (and the sprites) if not yet done
    const st = opts.state || PRINT.state(T);
    let filter = null;
    if (opts.split === 'back') filter = (o) => o.y <= opts.depth;
    else if (opts.split === 'front') filter = (o) => o.y > opts.depth;
    // the late plumes are the worn blocks: they replace the fresh ones at the jolt's first peak
    const late = opts.late == null ? (opts.state ? st.wear >= 0.5 : blockWear(T) >= 1) : !!opts.late;
    PRINT.with(ctx, 'K', T, (c) => {
      c.__m = c.getTransform();
      drawClumps(c, T, late ? (opts.aged ? SPR.nearLateAged : SPR.nearLate) : SPR.near, filter, 1);
    });
  };

  A.drawHagi = (ctx, T, opts = {}) => {
    PRINT.shot('A');
    const st = opts.state || PRINT.state(T);
    const w = wind(T);
    const sw = w.breeze * U.deg(2) * Math.sin((TAU * (T - 13)) / 11) + w.gust * U.deg(1.2);
    const piv = [-40, -40];
    PRINT.with(ctx, 'K', T, (c) => {
      c.translate(piv[0], piv[1]);
      c.rotate(sw * 0.9);
      c.translate(-piv[0], -piv[1]);
      const late = opts.state ? st.wear >= 0.5 : blockWear(T) >= 1;
      const sp = late ? (opts.aged ? SPR.hagiLateAged : SPR.hagiLate) : SPR.hagi;
      c.drawImage(sp.cv, sp.x, sp.y, sp.w, sp.h);
    });
  };

  A.drawSozu = (ctx, T) => {
    const pen = livePen(ctx, T);
    paintSozuTube(pen, T, T >= 160);
    pen.flush();
  };

  /** 金木犀: three florets drifting down across the 萩 branch (24–32, gone by 34). */
  A.drawFlorets = (ctx, T) => {
    if (T < 24 || T > 34) return;
    PRINT.with(ctx, 'P2', T, (c) => {
      for (let i = 0; i < 3; i++) {
        const t0 = 24 + i * 1.6;
        const u = (T - t0) / 8.2;
        if (u < 0 || u > 1) continue;
        const a = U.env(u, 0, 0.08, 0.82, 1, U.ease.linear);
        const x = 300 + i * 26 + u * (120 + i * 18) + Math.sin(u * 7 + i) * 14;
        const y = 120 + i * 12 + u * (330 + i * 30);
        c.save();
        c.translate(x, y);
        c.rotate(u * 5 + i);
        c.globalAlpha *= a;
        c.fillStyle = C.shu;
        for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 2); c.beginPath(); c.ellipse(1.7, 0, 1.8, 1.15, 0, 0, TAU); c.fill(); }
        c.fillStyle = C.yamabuki;
        c.beginPath(); c.arc(0, 0, 0.9, 0, TAU); c.fill();
        c.restore();
      }
    });
  };

  /** The fox: two eye-glints in the susuki (20.0 in, blink 21.2, gone 22.0). */
  A.drawGlints = (ctx, T) => {
    if (T < 20 || T > 22.05) return;
    let a = 0.6 * U.seg(T, 20, 20.3) * (1 - U.seg(T, 21.75, 22.0));
    if (T > 21.2 && T < 21.32) a *= 0.05;
    if (a <= 0.003) return;
    PRINT.with(ctx, 'P2', T, (c) => {
      for (const x of [612, 626]) {
        const g = c.createRadialGradient(x, 748, 0, x, 748, 4);
        g.addColorStop(0, U.rgba(C.yamabuki, 0.75 * a));
        g.addColorStop(1, U.rgba(C.yamabuki, 0));
        c.fillStyle = g;
        c.fillRect(x - 4, 744, 8, 8);
      }
    });
    PRINT.with(ctx, 'P7', T, (c) => {
      c.fillStyle = U.rgba(C.gofun, a);
      for (const x of [612, 626]) { c.beginPath(); c.arc(x, 748, 1.6, 0, TAU); c.fill(); }
    });
  };

  /** ctx transform for a crop {scale, about:[x,y], to:[x,y]} (the 六 fox-window inset). */
  A.cropTransform = (ctx, crop) => {
    if (!crop) return;
    const s = crop.scale || 1, ab = crop.about || [960, 540], to = crop.to || ab;
    ctx.translate(to[0], to[1]);
    ctx.scale(s, s);
    ctx.translate(-ab[0], -ab[1]);
  };

  /** 一's push toward the shoji (38–40): scale 1.00 → 1.06 about (1180,630). */
  const pushAt = (T) => (T > 38 && T < 41 ? 1 + 0.06 * U.ease.inOutSine(U.seg(T, 38, 40)) : 1);
  let pushBuf = null;
  A.push = pushAt;

  /**
   * The whole Shot A frame at T (see header). Paint order:
   * sky → moon → far → mist(high) → horizon glow → grove → house(+andon) → mist(low) →
   * field → pond → water live → near susuki (behind figures) → offerings → figures →
   * near susuki (front) → sōzu tube → 萩 → florets / glints
   */
  A.drawGarden = (ctx, T, opts = {}) => {
    const o = opts;
    const still = !!o.still;
    ctx.save();
    ctx.imageSmoothingQuality = 'low';    // plates are cached 1:1; only the push / crops resample them
    if (o.camera !== false) {
      const k = pushAt(T);
      if (k !== 1) {
        // the push toward the shoji (38–40): print the frame 1:1 (cheap, unresampled
        // plates), then scale the finished impression once
        const m = ctx.getTransform(), kk = ctx.canvas.width / W;
        if (Math.abs(m.a - kk) < 1e-3 && Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6 && Math.abs(m.e) < 1e-3 && Math.abs(m.f) < 1e-3) {
          const cw = ctx.canvas.width, ch = ctx.canvas.height;
          if (!pushBuf || pushBuf.width !== cw || pushBuf.height !== ch) pushBuf = B.canvas(cw, ch);
          const pc = pushBuf.getContext('2d');
          pc.setTransform(kk, 0, 0, kk, 0, 0);
          pc.globalAlpha = 1;
          pc.globalCompositeOperation = 'source-over';
          pc.fillStyle = C.kinari;
          pc.fillRect(0, 0, W, H);
          A.drawGarden(pc, T, Object.assign({}, o, { camera: false }));
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'low';
          ctx.drawImage(pushBuf, 1180 - 1180 * k, 630 - 630 * k, W * k, H * k);
          ctx.restore();
          return;
        }
        ctx.translate(1180, 630); ctx.scale(k, k); ctx.translate(-1180, -630);
      }
    }
    A.drawSky(ctx, T, o);
    if (o.moon !== false) A.drawMoon(ctx, T, { alpha: o.moonAlpha, glow: o.glow });
    A.drawFar(ctx, T, o);
    A.drawMist(ctx, T, 'high', o);
    horizonGlow(ctx, T);
    A.drawGrove(ctx, T, o);
    A.drawHouse(ctx, T, o);
    A.drawMist(ctx, T, 'low', o);
    A.drawField(ctx, T, o);
    A.drawPondLayer(ctx, T, o);
    A.drawPond(ctx, T, o);
    A.drawBanks(ctx, T, o);
    const st = o.figures === false ? { hidden: true } : A.sayo(T, o);
    const depth = st.hidden ? 2000 : st.y;
    if (still) PRINT.drawLayer(ctx, 'A', 'still', T, o.state ? { state: o.state } : {});
    else if (o.near !== false) A.drawNearSusuki(ctx, T, { split: 'back', depth });
    if (o.beforeNear) { ctx.save(); o.beforeNear(ctx, PRINT.state(T)); ctx.restore(); }
    if (o.offerings !== false) A.drawOfferings(ctx, T, o);
    if (o.figures !== false) A.drawFigures(ctx, T, o);
    if (!still && o.near !== false) A.drawNearSusuki(ctx, T, { split: 'front', depth });
    if (!still) {
      A.drawSozu(ctx, T);
      if (o.hagi !== false) A.drawHagi(ctx, T);
    }
    A.drawFlorets(ctx, T);
    A.drawGlints(ctx, T);
    ctx.restore();
  };

  /* ------------------------------------------------------------------ */
  /* 六: the late impression, aged — the moon exempt                     */
  /* ------------------------------------------------------------------ */
  // Once the jolt has settled (T ≥ 160.62) the print table is still and every
  // carved layer of the 後摺 is static, so they are composited ONCE — with the
  // still kasumi and the dry sōzu, the frame edges bled, the paper yellowed and
  // foxed — into one snapshot at the stage's backing resolution. Per frame:
  // that one blit, the fresh moon, and the live things printed in aged inks
  // (near susuki and 萩 from aged sprites, the old woman in an aged palette,
  // the dango, the eight moon-road dashes), then the hand-applied 退紅 strip.
  const LATE_REF = 165;
  let lateSnap = null;
  function lateSnapshot(ctx) {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    if (lateSnap && lateSnap.width === cw && lateSnap.height === ch) return lateSnap;
    const cv = B.canvas(cw, ch), c = cv.getContext('2d');
    const k = cw / W;
    c.setTransform(k, 0, 0, k, 0, 0);
    c.imageSmoothingQuality = 'low';
    c.fillStyle = C.kinari;
    c.fillRect(0, 0, W, H);
    const T = LATE_REF, st = PRINT.state(T);
    const o = { state: st };
    for (const l of ['sky', 'far']) PRINT.drawLayer(c, 'A', l, T, o);
    A.drawMist(c, T, 'high', o);
    for (const l of ['grove', 'house']) PRINT.drawLayer(c, 'A', l, T, o);
    A.drawMist(c, T, 'low', o);
    for (const l of ['field', 'pond', 'banks']) PRINT.drawLayer(c, 'A', l, T, o);
    A.drawSozu(c, T);
    // bleed: the drifted sky (+5,−3) and pond plates must not bare the sheet's edges
    c.setTransform(1, 0, 0, 1, 0, 0);
    const e = Math.ceil(7 * k);
    c.drawImage(cv, e, 0, 1, ch, 0, 0, e, ch);
    c.drawImage(cv, 0, ch - e - 1, cw, 1, 0, ch - e, cw, e);
    c.setTransform(k, 0, 0, k, 0, 0);
    ageFrame(c, T, { amount: 1 });
    lateSnap = cv;
    return cv;
  }
  /** Build the late snapshot ahead of time for a backing scale k (call from a scene's init). */
  A.warmLate = (k) => {
    try {
      PRINT.shot('A');
      const cv = B.canvas(Math.round(W * k), Math.round(H * k));
      const c = cv.getContext('2d');
      c.setTransform(k, 0, 0, k, 0, 0);
      lateSnapshot(c);
    } catch (e) { /* warming is only an optimisation */ }
  };
  /**
   * 六's garden, aged: A.drawLate(ctx, T) — Shot A 後摺 with the paper yellowed
   * and foxed and the moon fresh. During the jolt (160.0–160.62) everything is
   * printed live and aged by PRINT.age; after it, from the cached snapshot.
   * Draws the 退紅 strip last (unaged).
   */
  A.drawLate = (ctx, T, opts = {}) => {
    const m = MOON.A(T);
    if (T < PRINT.TIMES.jolt + PRINT.TIMES.joltDur + 0.02) {
      A.drawGarden(ctx, T, opts);
      ageFrame(ctx, T, { holes: [[m.x, m.y, m.r + 1.5]] });
      A.drawStrip(ctx, T);
      return;
    }
    PRINT.shot('A');
    const snap = lateSnapshot(ctx);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(snap, 0, 0);
    ctx.restore();
    ctx.save();
    ctx.imageSmoothingQuality = 'low';
    MOON.draw(ctx, m.x, m.y, m.r, T, { halo: 0.5, haloR: m.r * 1.6, haloColor: aged(C.geppaku) });
    const ao = Object.assign({}, opts, { aged: true });
    A.drawPond(ctx, T, ao);
    const st = { hidden: true };
    A.drawNearSusuki(ctx, T, { split: 'back', depth: GEO.take[1], aged: true, late: true });
    A.drawOfferings(ctx, T, ao);
    A.drawFigures(ctx, T, ao);
    A.drawNearSusuki(ctx, T, { split: 'front', depth: GEO.take[1], aged: true, late: true });
    A.drawHagi(ctx, T, { aged: true });
    void st;
    ctx.restore();
    A.drawStrip(ctx, T);
  };
})(window.TSUKI = window.TSUKI || {});
