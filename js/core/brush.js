/* ==========================================================================
   brush.js — ukiyo-e drawing primitives (TSUKI.B).
   All coordinates are in the logical 1920×1080 stage space. Every function
   saves/restores canvas state it touches. Nothing here reads the clock: pass
   `t` explicitly so frames stay a pure function of time.
   ========================================================================== */
(function (TSUKI) {
  'use strict';

  const U = TSUKI.U, C = TSUKI.C;
  const B = (TSUKI.B = {});

  /* ------------------------------------------------------------------ */
  /* offscreen canvases & sprite cache                                   */
  /* ------------------------------------------------------------------ */
  B.canvas = (w, h) => {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  };
  const spriteCache = new Map();
  /** Cached offscreen sprite. draw(ctx, w, h) is called once per key. */
  B.sprite = (key, w, h, draw) => {
    let c = spriteCache.get(key);
    if (!c) {
      if (spriteCache.size > 600) spriteCache.clear(); // animated keys must not leak
      c = B.canvas(w, h);
      draw(c.getContext('2d'), c.width, c.height);
      spriteCache.set(key, c);
    }
    return c;
  };
  B.clearCache = () => spriteCache.clear();

  /* ------------------------------------------------------------------ */
  /* basic shapes                                                        */
  /* ------------------------------------------------------------------ */
  B.poly = (ctx, pts, close = true) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (close) ctx.closePath();
  };
  /** Smooth closed/open curve through points (Catmull-Rom → Bezier). */
  B.smoothPath = (ctx, pts, close = false, tension = 0.5) => {
    const n = pts.length;
    if (n < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    const get = (i) => (close ? pts[(i + n) % n] : pts[U.clamp(i, 0, n - 1)]);
    const last = close ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      const k = tension / 3;
      ctx.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k,
        p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k,
        p2[0], p2[1]
      );
    }
    if (close) ctx.closePath();
  };

  /** Soft radial glow. */
  B.glow = (ctx, x, y, r, color, alpha = 1, inner = 0) => {
    ctx.save();
    const g = ctx.createRadialGradient(x, y, r * inner, x, y, r);
    g.addColorStop(0, U.rgba(color, alpha));
    g.addColorStop(0.45, U.rgba(color, alpha * 0.35));
    g.addColorStop(1, U.rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  };

  /**
   * Tapered brush stroke along a polyline: width goes w0 → w1 (with a
   * swelling belly controlled by `belly`). Filled as one polygon, so it is
   * crisp like a carved key-block line rather than a uniform canvas stroke.
   */
  B.taper = (ctx, pts, w0, w1, color, belly = 0.25) => {
    const n = pts.length;
    if (n < 2) return;
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
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  /** Sample a quadratic curve into points. */
  B.qpts = (x0, y0, cx, cy, x1, y1, steps = 12) => {
    const out = [];
    for (let i = 0; i <= steps; i++) out.push(U.qbez([x0, y0], [cx, cy], [x1, y1], i / steps));
    return out;
  };

  /** Lanceolate leaf (bamboo, reed) with optional sumi outline. */
  B.leaf = (ctx, x, y, len, w, angle, color, outline) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.35, -w, len, 0);
    ctx.quadraticCurveTo(len * 0.35, w * 0.9, 0, 0);
    ctx.fillStyle = color;
    ctx.fill();
    if (outline) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(len * 0.04, 0);
      ctx.lineTo(len * 0.8, 0);
      ctx.globalAlpha = 0.45;
      ctx.stroke();
    }
    ctx.restore();
  };

  /* ------------------------------------------------------------------ */
  /* skies                                                               */
  /* ------------------------------------------------------------------ */
  /**
   * Vertical sky gradient. stops: [[pos 0..1, hex, alpha?], ...]
   */
  B.sky = (ctx, stops, x = 0, y = 0, w = 1920, h = 1080) => {
    ctx.save();
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    for (const s of stops) g.addColorStop(s[0], U.rgba(s[1], s[2] == null ? 1 : s[2]));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  };

  /**
   * 一文字ぼかし — the dark band printed across the top edge of a
   * landscape print. A solid band for `solid` px that fades out over `fade` px.
   */
  B.ichimonji = (ctx, color, solid = 60, fade = 220, alpha = 1, w = 1920) => {
    ctx.save();
    const g = ctx.createLinearGradient(0, 0, 0, solid + fade);
    g.addColorStop(0, U.rgba(color, alpha));
    g.addColorStop(solid / (solid + fade), U.rgba(color, alpha));
    g.addColorStop(Math.min(1, (solid + fade * 0.45) / (solid + fade)), U.rgba(color, alpha * 0.28));
    g.addColorStop(1, U.rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, solid + fade);
    ctx.restore();
  };

  /** Horizontal horizon glow band (e.g. dusk light behind mountains). */
  B.horizonGlow = (ctx, y, h, color, alpha = 0.6, w = 1920) => {
    ctx.save();
    const g = ctx.createLinearGradient(0, y - h, 0, y + h);
    g.addColorStop(0, U.rgba(color, 0));
    g.addColorStop(0.5, U.rgba(color, alpha));
    g.addColorStop(1, U.rgba(color, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, y - h, w, h * 2);
    ctx.restore();
  };

  /* ------------------------------------------------------------------ */
  /* kasumi — mist bands                                                 */
  /* ------------------------------------------------------------------ */
  /**
   * 霞 band: a long flat bar with rounded ends, as printed in ukiyo-e and
   * painted in emaki (すやり霞). Crisp by default; `soft` (0..1) feathers the
   * ends, `fade` (0..1) fades the lower edge (bokashi).
   * seed makes the top/bottom edges gently irregular.
   * Sprite-cached per size: for widths that animate every frame use B.band.
   */
  B.kasumi = (ctx, x, y, w, h, color, alpha = 1, opts = {}) => {
    const soft = opts.soft == null ? 0 : opts.soft;
    const fade = opts.fade == null ? 0.35 : opts.fade;
    const seed = opts.seed == null ? 1 : opts.seed;
    const W = Math.round(U.clamp(w, 8, 3200)), H = Math.round(U.clamp(h, 4, 600));
    const key = `kasumi|${W}|${H}|${color}|${soft}|${fade}|${seed}`;
    const spr = B.sprite(key, W + 4, H + 4, (c, cw, ch) => {
      const r = U.rng(seed);
      const rad = H / 2;
      // irregular capsule
      const top = [], bot = [];
      const N = Math.max(6, Math.round(W / 80));
      for (let i = 0; i <= N; i++) {
        const px = 2 + rad + (W - 2 * rad) * (i / N);
        top.push([px, 2 + H * 0.06 * r()]);
        bot.push([px, 2 + H - H * 0.06 * r()]);
      }
      c.beginPath();
      c.moveTo(top[0][0], top[0][1]);
      for (let i = 1; i < top.length; i++) c.lineTo(top[i][0], top[i][1]);
      c.arc(2 + W - rad, 2 + rad, rad * 0.98, -Math.PI / 2, Math.PI / 2);
      for (let i = bot.length - 1; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]);
      c.arc(2 + rad, 2 + rad, rad * 0.98, Math.PI / 2, Math.PI * 1.5);
      c.closePath();
      const g = c.createLinearGradient(0, 2, 0, 2 + H);
      g.addColorStop(0, U.rgba(color, 1));
      g.addColorStop(0.55, U.rgba(color, 1));
      g.addColorStop(1, U.rgba(color, 1 - fade));
      c.fillStyle = g;
      c.fill();
      if (soft > 0) {
        c.globalCompositeOperation = 'destination-in';
        const e = Math.min(0.49, soft * 0.5);
        const hg = c.createLinearGradient(0, 0, cw, 0);
        hg.addColorStop(0, 'rgba(0,0,0,0)');
        hg.addColorStop(e, 'rgba(0,0,0,1)');
        hg.addColorStop(1 - e, 'rgba(0,0,0,1)');
        hg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = hg;
        c.fillRect(0, 0, cw, ch);
      }
    });
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.drawImage(spr, x - 2, y - 2, w + 4, h + 4);
    ctx.restore();
  };

  /**
   * Plain animated mist band (no sprite, safe for widths that change every
   * frame): rounded bar with a vertical bokashi toward the bottom edge.
   */
  B.band = (ctx, x, y, w, h, color, alpha = 1, fade = 0.3) => {
    if (w <= 1 || h <= 1 || alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, U.rgba(color, 1));
    g.addColorStop(0.6, U.rgba(color, 1));
    g.addColorStop(1, U.rgba(color, 1 - fade));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, Math.min(h / 2, w / 2));
    ctx.fill();
    ctx.restore();
  };

  /**
   * A stacked bank of kasumi bands (the classic stepped mist), drifting
   * horizontally with `drift` px. rows: number of bands.
   */
  B.kasumiBank = (ctx, x, y, w, rowH, rows, color, alpha = 1, seed = 1, drift = 0, opts = {}) => {
    const r = U.rng(seed);
    for (let i = 0; i < rows; i++) {
      const bw = w * U.lerp(0.45, 0.9, r());
      const bx = x + (w - bw) * r() + drift * U.lerp(0.6, 1.2, r());
      const by = y + i * rowH * 0.78 + rowH * 0.2 * r();
      B.kasumi(ctx, bx, by, bw, rowH * U.lerp(0.6, 0.95, r()), color, alpha * U.lerp(0.75, 1, r()), {
        seed: seed * 31 + i, soft: opts.soft, fade: opts.fade,
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /* the moon                                                            */
  /* ------------------------------------------------------------------ */
  /** Stylised moon-rabbit (兎の餅つき) maria silhouette in unit space (r=1). */
  const rabbitMaria = (c, r) => {
    c.save();
    c.scale(r, r);
    c.beginPath();
    // body
    c.ellipse(-0.18, 0.16, 0.2, 0.26, -0.35, 0, U.TAU);
    // head
    c.moveTo(-0.02, -0.12);
    c.ellipse(-0.06, -0.16, 0.11, 0.1, 0, 0, U.TAU);
    // ears
    c.moveTo(-0.12, -0.28);
    c.ellipse(-0.16, -0.4, 0.045, 0.17, -0.35, 0, U.TAU);
    c.moveTo(-0.04, -0.3);
    c.ellipse(-0.06, -0.42, 0.04, 0.16, 0.05, 0, U.TAU);
    // mortar (usu)
    c.moveTo(0.18, 0.18);
    c.ellipse(0.33, 0.2, 0.17, 0.06, 0, 0, U.TAU);
    c.moveTo(0.18, 0.2);
    c.rect(0.2, 0.2, 0.26, 0.3);
    // arm + pestle (kine)
    c.moveTo(0.02, 0.0);
    c.ellipse(0.1, -0.02, 0.1, 0.035, -0.5, 0, U.TAU);
    c.moveTo(0.24, -0.26);
    c.ellipse(0.24, -0.02, 0.028, 0.24, 0.25, 0, U.TAU);
    // mare wash around them
    c.moveTo(0.0, 0.62);
    c.ellipse(-0.3, 0.55, 0.3, 0.14, 0.2, 0, U.TAU);
    c.moveTo(0.5, -0.45);
    c.ellipse(0.42, -0.5, 0.16, 0.12, 0.4, 0, U.TAU);
    c.fill();
    c.restore();
  };

  /**
   * 名月. opts:
   *   color   — disc ink (default 月色)
   *   rim     — rim tint colour for bokashi edge (default 金茶)
   *   halo    — 0..1 strength of the soft halo (月暈)
   *   haloColor, haloR (multiple of r, default 2.6)
   *   maria   — 0..1 strength of the rabbit maria
   *   mica    — time in seconds to animate kira-zuri sparkle (false = none)
   *   outline — sumi outline alpha (0 = none)
   *   alpha   — overall alpha
   */
  B.moon = (ctx, x, y, r, opts = {}) => {
    const color = opts.color || C.tsukiKi;
    const rim = opts.rim || C.kin;
    const halo = opts.halo == null ? 0.5 : opts.halo;
    const haloColor = opts.haloColor || color;
    const alpha = opts.alpha == null ? 1 : opts.alpha;
    const maria = opts.maria == null ? 0.12 : opts.maria;
    ctx.save();
    ctx.globalAlpha *= alpha;
    if (halo > 0) {
      const hr = r * (opts.haloR || 2.6);
      const g = ctx.createRadialGradient(x, y, r * 0.95, x, y, hr);
      g.addColorStop(0, U.rgba(haloColor, 0.42 * halo));
      g.addColorStop(0.18, U.rgba(haloColor, 0.2 * halo));
      g.addColorStop(0.5, U.rgba(haloColor, 0.06 * halo));
      g.addColorStop(1, U.rgba(haloColor, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, hr, 0, U.TAU);
      ctx.fill();
    }
    // disc with bokashi rim, rendered once per (size bucket,color,rim,maria)
    // as a sprite and scaled to r, so an animated radius does not re-render.
    const R = Math.max(8, Math.ceil(r / 24) * 24);
    const key = `moon|${R}|${color}|${rim}|${Math.round(maria * 100)}`;
    const spr = B.sprite(key, R * 2 + 4, R * 2 + 4, (c) => {
      const cx = R + 2, cy = R + 2;
      c.save();
      c.beginPath();
      c.arc(cx, cy, R, 0, U.TAU);
      c.clip();
      const g = c.createRadialGradient(cx - R * 0.18, cy - R * 0.2, R * 0.05, cx, cy, R);
      g.addColorStop(0, U.mix(color, '#ffffff', 0.35));
      g.addColorStop(0.72, color);
      g.addColorStop(1, U.mix(color, rim, 0.55));
      c.fillStyle = g;
      c.fillRect(0, 0, R * 2 + 4, R * 2 + 4);
      // mottled mare texture
      const rr = U.rng(R * 13 + 7);
      for (let i = 0; i < 26; i++) {
        const a = rr() * U.TAU, d = Math.sqrt(rr()) * R * 0.85;
        const px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d;
        const pr = R * U.lerp(0.06, 0.22, rr());
        const mg = c.createRadialGradient(px, py, 0, px, py, pr);
        mg.addColorStop(0, U.rgba(rim, 0.1 + maria * 0.25));
        mg.addColorStop(1, U.rgba(rim, 0));
        c.fillStyle = mg;
        c.fillRect(px - pr, py - pr, pr * 2, pr * 2);
      }
      if (maria > 0) {
        c.translate(cx, cy);
        c.fillStyle = U.rgba(U.shade(rim, 0.85), maria);
        c.filter = `blur(${Math.max(1, R * 0.03)}px)`;
        rabbitMaria(c, R);
        c.filter = 'none';
      }
      c.restore();
    });
    const sc = r / R;
    ctx.drawImage(spr, x - (R + 2) * sc, y - (R + 2) * sc, (R * 2 + 4) * sc, (R * 2 + 4) * sc);
    if (opts.outline) {
      ctx.strokeStyle = U.rgba(C.sumi, opts.outline);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, U.TAU);
      ctx.stroke();
    }
    if (opts.mica !== undefined && opts.mica !== false) {
      // kira-zuri: sparse mica glints that breathe slowly
      const t = opts.mica;
      const rr = U.rng(911);
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 60; i++) {
        const a = rr() * U.TAU, d = Math.sqrt(rr()) * r * 0.96;
        const ph = rr() * U.TAU, sp = U.lerp(0.4, 1.3, rr());
        const tw = Math.pow(Math.max(0, Math.sin(t * sp + ph)), 8);
        if (tw < 0.02) continue;
        ctx.globalAlpha = alpha * tw * 0.55;
        const s = U.lerp(0.8, 2.2, rr());
        ctx.fillRect(x + Math.cos(a) * d - s / 2, y + Math.sin(a) * d - s / 2, s, s);
      }
    }
    ctx.restore();
  };

  /** Moon reflection on water: a wavering column of horizontal strokes. */
  B.moonReflection = (ctx, x, y0, y1, width, t, color, alpha = 0.8, seed = 3) => {
    ctx.save();
    const rows = Math.max(4, Math.round((y1 - y0) / 9));
    for (let i = 0; i < rows; i++) {
      const s = i / (rows - 1);
      const y = y0 + (y1 - y0) * s;
      const w = width * U.lerp(1, 0.25, s) * (0.6 + 0.4 * U.noise1(i * 0.7 + t * 1.3, seed));
      const off = U.wobble(i * 0.37 + t * 0.9, seed + 5) * width * 0.35 * (0.3 + s);
      const a = alpha * U.lerp(1, 0.15, s) * (0.55 + 0.45 * U.noise1(i * 1.3 - t * 2, seed + 9));
      ctx.fillStyle = U.rgba(color, a);
      const h = U.lerp(4, 2, s);
      ctx.beginPath();
      ctx.ellipse(x + off, y, w / 2, h, 0, 0, U.TAU);
      ctx.fill();
    }
    ctx.restore();
  };

  /* ------------------------------------------------------------------ */
  /* clouds                                                              */
  /* ------------------------------------------------------------------ */
  /**
   * Stylised ukiyo-e cloud: flat underside, lobed top. opts:
   *   fill, alpha, outline (sumi alpha), lobes, seed, shade (inner bokashi colour)
   */
  B.cloud = (ctx, x, y, w, h, opts = {}) => {
    const r = U.rng(opts.seed || 7);
    const lobes = opts.lobes || Math.max(3, Math.round(w / h / 0.9));
    const fill = opts.fill || C.gofun;
    ctx.save();
    ctx.globalAlpha *= opts.alpha == null ? 1 : opts.alpha;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    let px = x;
    for (let i = 0; i < lobes; i++) {
      const lw = (w / lobes) * U.lerp(0.8, 1.2, r());
      const nx = i === lobes - 1 ? x + w : Math.min(x + w, px + lw);
      const lh = h * U.lerp(0.55, 1, r()) * (1 - Math.abs(i / (lobes - 1 || 1) - 0.5) * 0.5);
      const cx = (px + nx) / 2;
      ctx.bezierCurveTo(px - lw * 0.05, y + h - lh * 1.3, nx + lw * 0.05, y + h - lh * 1.3, nx, y + h - (i === lobes - 1 ? 0 : h * 0.12));
      void cx;
      px = nx;
    }
    ctx.closePath();
    if (opts.shade) {
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, fill);
      g.addColorStop(1, opts.shade);
      ctx.fillStyle = g;
    } else ctx.fillStyle = fill;
    ctx.fill();
    if (opts.outline) {
      ctx.strokeStyle = U.rgba(C.sumi, opts.outline);
      ctx.lineWidth = opts.lineWidth || 2;
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    ctx.restore();
  };

  /* ------------------------------------------------------------------ */
  /* grasses — 薄 (susuki) & autumn field                                */
  /* ------------------------------------------------------------------ */
  /**
   * A clump of susuki (pampas grass) rooted at (x,y), height h.
   * opts: t, seed, wind (0..1), lean (radians), blades, plumes,
   *       blade (colour), plume (colour), outline (colour|null), alpha
   */
  B.susuki = (ctx, x, y, h, opts = {}) => {
    const t = opts.t || 0, seed = opts.seed || 1;
    const r = U.rng(seed);
    const wind = opts.wind == null ? 0.5 : opts.wind;
    const lean = opts.lean || 0;
    const bladeCol = opts.blade || C.koke;
    const plumeCol = opts.plume || C.susuki;
    const nBlades = opts.blades || 9;
    const nPlumes = opts.plumes == null ? 4 : opts.plumes;
    ctx.save();
    ctx.globalAlpha *= opts.alpha == null ? 1 : opts.alpha;
    const gust = (k) => wind * (0.55 * Math.sin(t * 0.8 + k) + 0.45 * U.wobble(t * 0.35 + k * 3, seed));
    // blades
    for (let i = 0; i < nBlades; i++) {
      const bl = h * U.lerp(0.45, 0.85, r());
      const ang = lean + U.lerp(-0.55, 0.55, r()) + gust(i * 0.7) * 0.12;
      const bend = U.lerp(0.25, 0.7, r()) * (r() < 0.5 ? -1 : 1);
      const ex = x + Math.sin(ang) * bl + bend * bl * 0.35;
      const ey = y - Math.cos(ang) * bl * 0.8 + bl * 0.15 * Math.abs(bend);
      const cx = x + Math.sin(ang) * bl * 0.55, cy = y - Math.cos(ang) * bl * 0.75;
      B.taper(ctx, B.qpts(x + U.lerp(-4, 4, r()), y, cx, cy, ex, ey, 14), U.lerp(3, 6, r()), 0.4, bladeCol, 0.2);
    }
    // plumes (尾花)
    for (let i = 0; i < nPlumes; i++) {
      const sl = h * U.lerp(0.8, 1.05, r());
      const baseAng = lean + U.lerp(-0.25, 0.25, r());
      const sway = gust(i * 1.9 + 11) * 0.22;
      const ang = baseAng + sway;
      const tipX = x + Math.sin(ang) * sl, tipY = y - Math.cos(ang) * sl;
      const cX = x + Math.sin(baseAng) * sl * 0.5, cY = y - Math.cos(baseAng) * sl * 0.55;
      const stem = B.qpts(x, y, cX, cY, tipX, tipY, 16);
      B.taper(ctx, stem, 2.2, 1.0, U.mix(bladeCol, plumeCol, 0.4), 0);
      // drooping head: a fan of fine hairs from the upper 30% of the stem
      const droop = U.lerp(0.5, 1.1, r()) + sway * 1.5;
      const hairs = 16;
      for (let k = 0; k < hairs; k++) {
        const s = U.lerp(0.68, 1, k / (hairs - 1));
        const p = stem[Math.round(s * (stem.length - 1))];
        const hl = h * U.lerp(0.1, 0.2, r()) * (1 - (s - 0.68) * 1.2);
        const ha = ang + droop * U.lerp(0.35, 1, (s - 0.68) / 0.32) + U.lerp(-0.25, 0.25, r());
        const ex = p[0] + Math.sin(ha) * hl, ey = p[1] - Math.cos(ha) * hl;
        const mx = p[0] + Math.sin(ha - 0.35) * hl * 0.5, my = p[1] - Math.cos(ha - 0.35) * hl * 0.5;
        B.taper(ctx, B.qpts(p[0], p[1], mx, my, ex, ey, 6), 2.2, 0.3, U.rgba(plumeCol, U.lerp(0.65, 1, r())), 0.35);
      }
    }
    if (opts.outline) {
      ctx.globalAlpha *= 0.5;
    }
    ctx.restore();
  };

  /** A field of susuki clumps spread across [x0,x1] along baseline y. */
  B.susukiField = (ctx, x0, x1, y, h, n, opts = {}) => {
    const r = U.rng(opts.seed || 5);
    for (let i = 0; i < n; i++) {
      const px = U.lerp(x0, x1, (i + r() * 0.8) / n);
      B.susuki(ctx, px, y + U.lerp(-6, 10, r()), h * U.lerp(0.7, 1.15, r()), {
        ...opts, seed: (opts.seed || 5) * 100 + i, lean: (opts.lean || 0) + U.lerp(-0.15, 0.15, r()),
      });
    }
  };

  /* ------------------------------------------------------------------ */
  /* water                                                               */
  /* ------------------------------------------------------------------ */
  /** Broken horizontal ripple strokes over a region, drifting with t. */
  B.ripples = (ctx, x, y, w, h, t, color, alpha = 0.5, seed = 2, density = 1) => {
    ctx.save();
    const r = U.rng(seed);
    const n = Math.round((w * h) / 9000 * density);
    for (let i = 0; i < n; i++) {
      const yy = y + h * Math.pow(r(), 0.85);
      const persp = U.lerp(0.4, 1.4, (yy - y) / h);
      const len = U.lerp(20, 90, r()) * persp;
      const speed = U.lerp(4, 14, r());
      const xx = x + ((r() * w + t * speed) % (w + len)) - len;
      const a = alpha * (0.4 + 0.6 * Math.max(0, Math.sin(t * U.lerp(0.4, 1.1, r()) + r() * 6)));
      ctx.strokeStyle = U.rgba(color, a);
      ctx.lineWidth = U.lerp(1, 2.6, r()) * persp;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.quadraticCurveTo(xx + len / 2, yy - 2 * persp, xx + len, yy);
      ctx.stroke();
    }
    ctx.restore();
  };

  /** 青海波 wave rows drawn directly (for large decorative seas). */
  B.seigaiha = (ctx, x, y, w, h, r, fg, bg, lineW = 2) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const rows = Math.ceil(h / (r * 0.5)) + 2;
    for (let j = -1; j < rows; j++) {
      const yy = y + j * r * 0.5;
      const off = j % 2 === 0 ? 0 : r;
      for (let xx = x - r * 2 + off; xx < x + w + r * 2; xx += r * 2) {
        for (let k = 4; k >= 1; k--) {
          ctx.beginPath();
          ctx.arc(xx, yy + r, (r * k) / 4, Math.PI, 0);
          ctx.fillStyle = k % 2 === 0 ? bg : fg;
          ctx.fill();
          ctx.strokeStyle = fg;
          ctx.lineWidth = lineW;
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  };

  /* ------------------------------------------------------------------ */
  /* land                                                                */
  /* ------------------------------------------------------------------ */
  /**
   * Mountain ridge: noise-generated skyline from x0..x1 around baseline
   * `y` with amplitude `amp`, filled down to `bottom` with a bokashi fade
   * (colour at the ridge, fading to `fadeTo` alpha at the bottom).
   */
  B.ridge = (ctx, x0, x1, y, amp, color, opts = {}) => {
    const seed = opts.seed || 1, freq = opts.freq || 0.004;
    const bottom = opts.bottom || 1080;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, bottom);
    for (let x = x0; x <= x1 + 8; x += 8) {
      const n = U.fbm2(x * freq, seed * 3.1, 4, seed);
      const peak = opts.peaks ? opts.peaks(x) : 0;
      ctx.lineTo(x, y - (n - 0.35) * amp - peak);
    }
    ctx.lineTo(x1, bottom);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, y - amp, 0, bottom);
    g.addColorStop(0, U.rgba(color, opts.alpha == null ? 1 : opts.alpha));
    g.addColorStop(opts.solid == null ? 0.35 : opts.solid, U.rgba(color, opts.alpha == null ? 1 : opts.alpha));
    g.addColorStop(1, U.rgba(color, opts.fadeTo == null ? 0.15 : opts.fadeTo));
    ctx.fillStyle = g;
    ctx.fill();
    if (opts.outline) {
      ctx.strokeStyle = U.rgba(C.sumi, opts.outline);
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    ctx.restore();
  };

  /**
   * 富士 — the iconic cone with a snow cap of jagged fingers.
   * (cx, baseY) bottom centre; w base width; h height.
   */
  B.fuji = (ctx, cx, baseY, w, h, opts = {}) => {
    const body = opts.color || C.bero;
    const snow = opts.snow || C.gofun;
    const topW = w * 0.09;
    const peakY = baseY - h;
    const slope = (s) => Math.pow(s, 1.55); // concave flanks
    const pts = [];
    const N = 40;
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      pts.push([cx - topW / 2 - (w / 2 - topW / 2) * s, peakY + h * slope(s)]);
    }
    const right = pts.map((p) => [2 * cx - p[0], p[1]]).reverse();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(right[right.length - 1][0], right[right.length - 1][1]);
    // crater notches along the flat top
    const notch = [[-0.5, 0], [-0.3, 0.012], [-0.12, -0.004], [0.05, 0.014], [0.22, 0], [0.5, 0]];
    for (const [nx, ny] of notch) ctx.lineTo(cx + nx * topW, peakY + ny * h);
    for (const p of right) ctx.lineTo(p[0], p[1]);
    ctx.lineTo(cx - w / 2, baseY);
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, peakY, 0, baseY);
    g.addColorStop(0, opts.top || U.shade(body, 0.75));
    g.addColorStop(1, opts.bottom || U.rgba(body, opts.baseAlpha == null ? 0.25 : opts.baseAlpha));
    ctx.fillStyle = g;
    ctx.fill();
    if (opts.outline) {
      ctx.strokeStyle = U.rgba(C.sumi, opts.outline);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.clip();
    if (snow) {
      // snow cap: fingers reaching down the flanks
      const r = U.rng(opts.seed || 22);
      const capH = h * (opts.capH || 0.3);
      ctx.beginPath();
      ctx.moveTo(cx - w, peakY - 10);
      ctx.lineTo(cx + w, peakY - 10);
      const fingers = 11;
      for (let i = fingers; i >= 0; i--) {
        const s = i / fingers; // 1 → 0 : right to left
        const xx = cx + U.lerp(-1, 1, s) * (topW / 2 + w * 0.18);
        const deep = capH * U.lerp(0.45, 1.15, r()) * (1 - Math.abs(s - 0.5) * 0.6);
        ctx.lineTo(xx + w * 0.012, peakY + deep * 0.55);
        ctx.lineTo(xx, peakY + deep);
        ctx.lineTo(xx - w * 0.012, peakY + deep * 0.5);
      }
      ctx.closePath();
      ctx.fillStyle = U.rgba(snow, opts.snowAlpha == null ? 1 : opts.snowAlpha);
      ctx.fill();
    }
    ctx.restore();
  };

  /* ------------------------------------------------------------------ */
  /* creatures                                                           */
  /* ------------------------------------------------------------------ */
  /**
   * 雁 — flying goose in silhouette (Hiroshige, 月に雁). Heading left when
   * dir = -1. phase in radians drives the wingbeat.
   */
  B.goose = (ctx, x, y, s, phase, color = C.sumi, dir = -1, alpha = 1) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s * dir * -1, s);
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    const beat = Math.sin(phase);
    // body + neck + head, heading to +x (flipped by dir)
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 8, -0.05, 0, U.TAU);
    ctx.fill();
    B.taper(ctx, [[18, -2], [34, -6], [46, -8]], 7, 4, color, 0);
    ctx.beginPath();
    ctx.ellipse(49, -8.5, 5.5, 4, -0.1, 0, U.TAU);
    ctx.fill();
    B.poly(ctx, [[53, -9], [62, -7.5], [53, -6.5]]);
    ctx.fill();
    // tail
    B.poly(ctx, [[-24, -3], [-36, -1], [-35, 4], [-22, 4]]);
    ctx.fill();
    // wings: far wing (lighter) and near wing
    const wing = (lift, k) => {
      const tipY = -lift * 46;
      ctx.beginPath();
      ctx.moveTo(10, -2);
      ctx.quadraticCurveTo(0, tipY * 0.6 - 6, -18 * k, tipY);
      ctx.quadraticCurveTo(-8, tipY * 0.35, -12, 1);
      ctx.closePath();
      ctx.fill();
    };
    ctx.globalAlpha *= 0.85;
    wing(beat * 0.9 + 0.2, 0.9);
    ctx.globalAlpha /= 0.85;
    wing(-beat * 0.2 + beat, 1.15);
    ctx.restore();
  };

  /* ------------------------------------------------------------------ */
  /* patterns (textiles)                                                 */
  /* ------------------------------------------------------------------ */
  const patCache = new Map();
  /**
   * CanvasPattern for a textile motif. name: 'seigaiha' | 'asanoha' |
   * 'same' | 'kikko' | 'yagasuri' | 'shippo' | 'kumo'. fg/bg are hex.
   * size = tile size in px. The pattern is created against `ctx`.
   */
  B.pattern = (ctx, name, fg, bg, size = 24) => {
    const key = `${name}|${fg}|${bg}|${size}`;
    let tile = patCache.get(key);
    if (!tile) {
      tile = B.canvas(size * 2, size * 2);
      const c = tile.getContext('2d');
      const S = size * 2;
      c.fillStyle = bg;
      c.fillRect(0, 0, S, S);
      c.strokeStyle = fg;
      c.fillStyle = fg;
      c.lineWidth = Math.max(1, size / 14);
      if (name === 'seigaiha') {
        const r = size / 2;
        for (let j = -1; j < 5; j++) {
          for (let i = -1; i < 3; i++) {
            const xx = i * size + (j % 2 ? r : 0), yy = j * r * 0.5 + r;
            for (let k = 3; k >= 1; k--) {
              c.beginPath();
              c.arc(xx + r, yy, (r * k) / 3, Math.PI, 0);
              c.fillStyle = bg;
              c.fill();
              c.stroke();
            }
          }
        }
      } else if (name === 'asanoha') {
        const h = S / 2, w = S / 2;
        const star = (cx, cy) => {
          for (let k = 0; k < 6; k++) {
            const a = (k * Math.PI) / 3;
            c.beginPath();
            c.moveTo(cx, cy);
            c.lineTo(cx + Math.cos(a) * w * 0.6, cy + Math.sin(a) * w * 0.6);
            c.stroke();
          }
        };
        star(w / 2, h / 2); star(w * 1.5, h / 2); star(w / 2, h * 1.5); star(w * 1.5, h * 1.5); star(w, h);
      } else if (name === 'same') {
        const n = 6;
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
          c.beginPath();
          c.arc((i + (j % 2) * 0.5) * (S / n), (j + 0.5) * (S / n), S / n / 5, 0, U.TAU);
          c.fill();
        }
      } else if (name === 'kikko') {
        const r = S / 4;
        const hex = (cx, cy) => {
          c.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = Math.PI / 6 + (k * Math.PI) / 3;
            const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
            k ? c.lineTo(px, py) : c.moveTo(px, py);
          }
          c.closePath();
          c.stroke();
        };
        const dx = r * Math.sqrt(3);
        for (let j = -1; j < 4; j++) for (let i = -1; i < 4; i++) hex(i * dx + (j % 2 ? dx / 2 : 0), j * r * 1.5);
      } else if (name === 'yagasuri') {
        for (let i = 0; i < 2; i++) {
          const x0 = i * size;
          c.fillStyle = i % 2 ? fg : bg;
          c.beginPath();
          c.moveTo(x0, 0); c.lineTo(x0 + size, size * 0.5); c.lineTo(x0 + size, size * 1.5); c.lineTo(x0, size); c.closePath();
          c.fill();
          c.fillStyle = i % 2 ? bg : fg;
          c.beginPath();
          c.moveTo(x0, size); c.lineTo(x0 + size, size * 1.5); c.lineTo(x0 + size, S + size * 0.5); c.lineTo(x0, S); c.closePath();
          c.fill();
        }
      } else if (name === 'shippo') {
        const r = S / 4;
        for (const [cx, cy] of [[0, 0], [S / 2, 0], [S, 0], [0, S / 2], [S / 2, S / 2], [S, S / 2], [0, S], [S / 2, S], [S, S], [S / 4, S / 4], [S * 0.75, S * 0.25], [S / 4, S * 0.75], [S * 0.75, S * 0.75]]) {
          c.beginPath();
          c.arc(cx, cy, r, 0, U.TAU);
          c.stroke();
        }
      } else if (name === 'kumo') {
        c.globalAlpha = 0.9;
        for (let k = 0; k < 3; k++) {
          c.beginPath();
          c.arc(S * 0.3 + k * S * 0.15, S * 0.55, S * 0.12, Math.PI, 0);
          c.stroke();
        }
      }
      patCache.set(key, tile);
    }
    return ctx.createPattern(tile, 'repeat');
  };

  /* ------------------------------------------------------------------ */
  /* seals & particles                                                   */
  /* ------------------------------------------------------------------ */
  /** 朱印 — vermilion seal with white characters (1–4 chars, square). */
  B.seal = (ctx, x, y, size, text, color = C.shu, alpha = 1) => {
    ctx.save();
    ctx.globalAlpha *= alpha;
    const r = U.rng(text.charCodeAt(0));
    ctx.fillStyle = color;
    ctx.beginPath();
    const j = size * 0.04;
    ctx.moveTo(x + r() * j, y + r() * j);
    ctx.lineTo(x + size - r() * j, y + r() * j);
    ctx.lineTo(x + size - r() * j, y + size - r() * j);
    ctx.lineTo(x + r() * j, y + size - r() * j);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = TSUKI.C.gofun;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const chars = [...text];
    if (chars.length === 1) {
      ctx.font = `${size * 0.72}px "Shippori Mincho B1", "Yu Mincho", serif`;
      ctx.fillText(chars[0], x + size / 2, y + size / 2 + size * 0.03);
    } else {
      // 2 → one column; 4 → two columns read right-to-left
      const cols = chars.length > 2 ? 2 : 1;
      const rows = Math.ceil(chars.length / cols);
      const fs = (size * 0.86) / rows;
      ctx.font = `${fs}px "Shippori Mincho B1", "Yu Mincho", serif`;
      chars.forEach((ch, i) => {
        const col = Math.floor(i / rows), row = i % rows;
        const cx = cols === 1 ? x + size / 2 : x + size * (0.73 - col * 0.46);
        ctx.fillText(ch, cx, y + size * 0.07 + fs * (row + 0.5));
      });
    }
    ctx.restore();
  };

  /**
   * Deterministic drifting particle i at time t (falling leaves, petals,
   * embers, fireflies…). Returns {x,y,rot,life} or null when not alive.
   * opts: seed, area [x,y,w,h], vx, vy (px/s), sway (px), period (s),
   *       spin (rad/s), wrap (true: loops forever)
   */
  B.drift = (i, t, opts) => {
    const seed = (opts.seed || 1) * 7919 + i * 131;
    const h0 = U.hash(seed), h1 = U.hash(seed + 1), h2 = U.hash(seed + 2), h3 = U.hash(seed + 3);
    const [ax, ay, aw, ah] = opts.area || [0, 0, 1920, 1080];
    const vx = (opts.vx || 0) * U.lerp(0.7, 1.3, h2);
    const vy = (opts.vy || 40) * U.lerp(0.7, 1.3, h3);
    const period = opts.period || (ah + 200) / Math.max(1, Math.abs(vy));
    const tt = t + h0 * period;
    const cyc = Math.floor(tt / period);
    const lt = tt - cyc * period; // local time in this lap
    const cx = U.hash(seed + cyc * 17);
    let x = ax + cx * aw + vx * lt + Math.sin(lt * U.lerp(0.6, 1.4, h1) + h2 * 9) * (opts.sway || 30);
    let y = ay - 100 + vy * lt;
    if (vy < 0) y = ay + ah + 100 + vy * lt;
    const rot = (opts.spin || 1) * lt * U.lerp(-1.5, 1.5, h1) + h3 * 6;
    return { x, y, rot, life: lt / period, k: h1, lap: cyc };
  };
})(window.TSUKI = window.TSUKI || {});
