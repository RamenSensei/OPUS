/* ==========================================================================
   cast.js — the film's characters (TSUKI.CAST), drawn procedurally in the
   yamato-e / ukiyo-e manner so every scene shows the same people.

   Call:  TSUKI.CAST.<name>(ctx, x, y, scale, opts)
   (x, y) is the ground contact point (feet / base of robes) unless noted.
   scale 1 = a standing adult ~300 logical px tall.
   ========================================================================== */
(function (TSUKI) {
  'use strict';

  const U = TSUKI.U, B = TSUKI.B, C = TSUKI.C;
  const CAST = (TSUKI.CAST = {});
  const TAU = Math.PI * 2;

  /* ------------------------------------------------------------------ */
  /* path helpers (all in local figure units)                            */
  /* ------------------------------------------------------------------ */
  /** Catmull-Rom spline through pts into a Path2D. A point [x,y,1] is a corner. */
  function sp(pts, close, path, tension) {
    const p = path || new Path2D();
    const n = pts.length;
    const k = (tension == null ? 1 : tension) / 6;
    p.moveTo(pts[0][0], pts[0][1]);
    const get = (i) => (close ? pts[(i + n) % n] : pts[i < 0 ? 0 : i > n - 1 ? n - 1 : i]);
    const last = close ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      const c1x = p1[2] ? p1[0] : p1[0] + (p2[0] - p0[0]) * k;
      const c1y = p1[2] ? p1[1] : p1[1] + (p2[1] - p0[1]) * k;
      const c2x = p2[2] ? p2[0] : p2[0] - (p3[0] - p1[0]) * k;
      const c2y = p2[2] ? p2[1] : p2[1] - (p3[1] - p1[1]) * k;
      p.bezierCurveTo(c1x, c1y, c2x, c2y, p2[0], p2[1]);
    }
    if (close) p.closePath();
    return p;
  }
  /** Sample a Catmull-Rom spline through pts into a polyline (for tapers). */
  function crs(pts, per) {
    per = per || 6;
    const n = pts.length, out = [];
    const get = (i) => pts[i < 0 ? 0 : i > n - 1 ? n - 1 : i];
    for (let i = 0; i < n - 1; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      for (let j = 0; j < per; j++) {
        const s = j / per, s2 = s * s, s3 = s2 * s;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * s + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * s2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * s3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * s + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * s2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * s3),
        ]);
      }
    }
    out.push([pts[n - 1][0], pts[n - 1][1]]);
    return out;
  }
  /** Add a tapered brush stroke (polygon) along polyline pts to a Path2D. */
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
  const ell = (path, x, y, rx, ry, rot) => {
    path.moveTo(x + Math.cos(rot || 0) * rx, y + Math.sin(rot || 0) * rx);
    path.ellipse(x, y, rx, ry, rot || 0, 0, TAU);
    return path;
  };
  const lerpPt = (a, b, s) => [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
  const rot = (p, cx, cy, a) => {
    const c = Math.cos(a), s = Math.sin(a), dx = p[0] - cx, dy = p[1] - cy;
    return [cx + dx * c - dy * s, cy + dx * s + dy * c, p[2]];
  };
  const rotAll = (pts, cx, cy, a) => (a ? pts.map((p) => rot(p, cx, cy, a)) : pts);
  const shift = (pts, dx, dy) => pts.map((p) => [p[0] + dx, p[1] + dy, p[2]]);

  /** Deterministic sway signal in ~[-1,1] (sine + slow wobble). */
  const swayF = (t, k, seed, f) => {
    f = f || 1;
    return 0.62 * Math.sin(t * 0.85 * f + k) + 0.38 * U.wobble(t * 0.33 * f + k * 1.7, seed || 3);
  };

  /* ------------------------------------------------------------------ */
  /* the pen: fills, key-lines, silhouette & level-of-detail             */
  /* ------------------------------------------------------------------ */
  function makePen(ctx, s, o) {
    const sil = o.silhouette || null;
    const ol = o.outline == null ? 0.85 : o.outline;
    const inv = 1 / s;
    const lwS = U.clamp(0.45 + 1.5 * s, 0.65, 2.5); // key-line width in screen px
    const P = {
      ctx, s, inv, sil, ol,
      t: o.t || 0,
      wind: o.wind == null ? 0.25 : o.wind,
      lw: lwS * inv,
      px: inv,
      hi: !sil && s >= 0.8,        // fine detail: patterns, hair strands
      mid: !sil && s >= 0.3,       // medium detail: faces, folds, kasane
      tiny: s < 0.2,
      reg: sil ? 0 : U.clamp(0.35 + 0.55 * s, 0.35, 1.1) * inv, // registration offset
      ink: U.rgba(C.sumi, ol),
    };
    P.nb = s < 0.22 ? 2 : s < 0.5 ? 3 : s < 0.8 ? 4 : 99; // kasane bands shown
    P.band = U.clamp(1.3 + 1.3 * s, 1.5, 3.0) * inv;        // kasane band width (local)
    P.fill = (path, col) => {
      ctx.fillStyle = sil || col;
      if (P.reg) {
        ctx.translate(P.reg, P.reg * 0.6);
        ctx.fill(path);
        ctx.translate(-P.reg, -P.reg * 0.6);
      } else ctx.fill(path);
      if (sil) {
        ctx.strokeStyle = sil;
        ctx.lineWidth = P.lw * 0.6;
        ctx.stroke(path);
      }
    };
    /** Flat fill with no registration offset (for fills that must meet exactly). */
    P.flat = (path, col) => {
      ctx.fillStyle = sil || col;
      ctx.fill(path);
    };
    P.line = (path, mul, a) => {
      if (sil || ol <= 0) return;
      ctx.strokeStyle = a == null ? P.ink : U.rgba(C.sumi, ol * a);
      ctx.lineWidth = P.lw * (mul == null ? 1 : mul);
      ctx.stroke(path);
    };
    P.shape = (path, col, mul, a) => {
      P.fill(path, col);
      P.line(path, mul, a);
    };
    /** Fill a Path2D of tapered strokes in sumi (fold lines, strands). */
    P.strokes = (path, a, col) => {
      if (sil || ol <= 0) return;
      ctx.fillStyle = col ? U.rgba(col, a == null ? 1 : a) : U.rgba(C.sumi, ol * (a == null ? 1 : a));
      ctx.fill(path);
    };
    /** Build + fill tapered sumi lines: list of [pts, w0mul, w1mul]. */
    P.folds = (list, a, per) => {
      if (sil || ol <= 0) return;
      const p = new Path2D();
      for (const f of list) taperTo(p, crs(f[0], per || 5), P.lw * (f[1] == null ? 1 : f[1]), P.lw * (f[2] == null ? 0.15 : f[2]), f[3] || 0.1);
      P.strokes(p, a);
    };
    return P;
  }

  /* ------------------------------------------------------------------ */
  /* alpha buffer: figures with alpha < 1 are drawn opaque offscreen,    */
  /* then composited once, so overlapping robes don't show through.      */
  /* ------------------------------------------------------------------ */
  let scratch = null, sctx = null;
  function getScratch(w, h) {
    if (!scratch) {
      scratch = document.createElement('canvas');
      scratch.width = Math.max(16, w); scratch.height = Math.max(16, h);
      sctx = scratch.getContext('2d');
    } else if (scratch.width < w || scratch.height < h) {
      scratch.width = Math.max(scratch.width, w);
      scratch.height = Math.max(scratch.height, h);
    }
    return sctx;
  }

  const REG = {}; // name → { draw, poses, bounds(pose,o) }

  /**
   * Wrap a draw routine as a public character function.
   * draw(ctx, P, o) paints in local units: origin at the anchor, +x = facing.
   */
  function define(name, def) {
    REG[name] = def;
    const fn = function (ctx, x, y, scale, opts) {
      const o = Object.assign({}, def.defaults, opts || {});
      scale = scale == null ? 1 : scale;
      const a = o.alpha == null ? 1 : o.alpha;
      if (a <= 0.004 || !(scale > 0)) return;
      if (!o.pose || (def.poses.indexOf(o.pose) < 0 && !(def.alias && def.alias[o.pose]))) o.pose = def.poses[0];
      if (def.alias && def.alias[o.pose]) o.pose = def.alias[o.pose];
      o.t = o.t || 0;
      o.wind = o.wind == null ? 0.25 : o.wind;
      const facing = o.facing != null && o.facing < 0 ? -1 : 1;
      const ga = ctx.globalAlpha;
      const buffered = a < 0.995 && !o.noBuffer && typeof ctx.getTransform === 'function';
      if (!buffered) {
        ctx.save();
        ctx.globalAlpha = ga * a;
        ctx.translate(x, y);
        ctx.scale(scale * facing, scale);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        def.draw(ctx, makePen(ctx, scale, o), o);
        ctx.restore();
        return;
      }
      // device-space bounding box of the figure
      const M = ctx.getTransform();
      const bb = def.bounds(o.pose, o);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const [lx, ly] of [[bb[0], bb[1]], [bb[0] + bb[2], bb[1]], [bb[0], bb[1] + bb[3]], [bb[0] + bb[2], bb[1] + bb[3]]]) {
        const gx = x + lx * scale * facing, gy = y + ly * scale;
        const dx = M.a * gx + M.c * gy + M.e, dy = M.b * gx + M.d * gy + M.f;
        if (dx < x0) x0 = dx; if (dx > x1) x1 = dx; if (dy < y0) y0 = dy; if (dy > y1) y1 = dy;
      }
      const cw = ctx.canvas.width, ch = ctx.canvas.height;
      x0 = Math.max(0, Math.floor(x0) - 4); y0 = Math.max(0, Math.floor(y0) - 4);
      x1 = Math.min(cw, Math.ceil(x1) + 4); y1 = Math.min(ch, Math.ceil(y1) + 4);
      if (x1 <= x0 || y1 <= y0) return;
      const s2 = getScratch(cw, ch);
      s2.setTransform(1, 0, 0, 1, 0, 0);
      s2.globalAlpha = 1;
      s2.globalCompositeOperation = 'source-over';
      s2.clearRect(x0, y0, x1 - x0, y1 - y0);
      s2.save();
      s2.setTransform(M);
      s2.translate(x, y);
      s2.scale(scale * facing, scale);
      s2.lineJoin = 'round';
      s2.lineCap = 'round';
      def.draw(s2, makePen(s2, scale, o), o);
      s2.restore();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = ga * a;
      ctx.drawImage(scratch, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
      ctx.restore();
    };
    fn.poses = def.poses.slice();
    CAST[name] = fn;
    return fn;
  }

  /** Local bounding box [x, y, w, h] of a pose at scale 1, facing right. */
  CAST.bounds = (name, pose, opts) => {
    const d = REG[name];
    if (!d) return [-150, -300, 300, 300];
    const o = Object.assign({}, d.defaults, opts || {});
    return d.bounds(pose || d.poses[0], o);
  };
  CAST.POSES = {};

  /* ------------------------------------------------------------------ */
  /* shared parts                                                        */
  /* ------------------------------------------------------------------ */
  const pal = (base, o) => (o.palette ? Object.assign({}, base, o.palette) : base);

  /**
   * Stacked kasane bands: shapeAt(e) returns a Path2D of the garment with
   * its layered edge pushed out by e. Draw inner (most extended) first.
   * layers: outer → inner colours.
   */
  function pickLayers(layers, n) {
    if (n >= layers.length) return layers;
    if (n <= 2) return [layers[0], layers[layers.length - 1]];
    const out = [];
    for (let i = 0; i < n; i++) out.push(layers[Math.round((i * (layers.length - 1)) / (n - 1))]);
    return out;
  }
  function kasane(P, layers, shapeAt, lineOuter) {
    const pick = pickLayers(layers, P.nb);
    const E = (pick.length - 1) * P.band;
    let outer = null;
    for (let i = pick.length - 1; i >= 0; i--) {
      const path = shapeAt(i * P.band, E);
      P.fill(path, pick[i]);
      if (i === 0) outer = path;
      else if (P.hi && i < pick.length - 1) P.line(path, 0.35, 0.25);
    }
    if (lineOuter !== false) P.line(outer);
    return outer;
  }

  /**
   * Yamato-e face (引目鉤鼻). (x,y) = face centre, h = face height,
   * view: 'q' 3/4 toward +x · 'p' profile · 'f' front · 'up' 3/4 tilted up
   * kind: 'lady' | 'man' | 'old' | 'oldw' | 'child'
   */
  function face(P, x, y, h, view, kind, skin, tilt) {
    const ctx = P.ctx;
    const rx = h * (view === 'p' ? 0.36 : kind === 'child' ? 0.46 : 0.4), ry = h * 0.5;
    const a = tilt || 0;
    const fp = new Path2D();
    if (view === 'p') {
      // profile: soft forehead, tiny nose bump, small chin
      const pts = [
        [-rx * 0.9, -ry * 0.75], [0, -ry], [rx * 0.8, -ry * 0.7], [rx * 1.02, -ry * 0.15],
        [rx * 1.18, ry * 0.12], [rx * 1.0, ry * 0.3], [rx * 0.98, ry * 0.52], [rx * 0.7, ry * 0.9],
        [0, ry * 1.0], [-rx * 0.9, ry * 0.5],
      ];
      sp(rotAll(shift(pts, x, y), x, y, a), true, fp);
    } else ell(fp, x, y, rx, ry, a);
    P.fill(fp, skin);
    if (!P.mid) return;
    P.line(fp, 0.45, 0.55);
    const ca = Math.cos(a), sa = Math.sin(a);
    const at = (u, v) => [x + (u * ca - v * sa) * h, y + (u * sa + v * ca) * h];
    const fine = Math.max(P.lw * 0.42, 0.55 * P.inv);
    const lines = new Path2D();
    const eye = (u0, v0, u1, v1, w) => {
      const p0 = at(u0, v0), p1 = at(u1, v1), m = at((u0 + u1) / 2, (v0 + v1) / 2 - 0.015);
      taperTo(lines, [p0, m, p1], w * 0.6, w, 0.3);
    };
    const ew = fine * (kind === 'child' ? 1.5 : 1.25);
    const dx = view === 'q' || view === 'up' ? 0.12 : view === 'p' ? 0.26 : 0;
    const ey = view === 'up' ? -0.08 : 0.0;
    if (view === 'p') {
      eye(0.15, ey - 0.02, 0.27, ey, ew);
    } else if (view === 'f') {
      eye(-0.26, ey, -0.08, ey + 0.01, ew); eye(0.08, ey + 0.01, 0.26, ey, ew);
    } else {
      eye(-0.2 + dx, ey + 0.005, -0.04 + dx, ey + 0.01, ew);
      eye(0.08 + dx, ey + 0.01, 0.22 + dx, ey - 0.005, ew);
    }
    if (kind === 'old' || kind === 'oldw') {
      // a few age lines
      const u = view === 'p' ? 0.1 : dx - 0.1;
      taperTo(lines, [at(u - 0.12, -0.2), at(u, -0.23), at(u + 0.14, -0.21)], fine * 0.8, fine * 0.4, 0);
      taperTo(lines, [at(u + 0.18, 0.12), at(u + 0.22, 0.22), at(u + 0.2, 0.3)], fine * 0.7, fine * 0.3, 0);
    }
    // brows: lady → high smudged hikimayu; others → thin brows
    if (kind === 'lady') {
      if (P.hi) {
        ctx.fillStyle = U.rgba(C.sumi, 0.55 * P.ol);
        const b1 = at(-0.14 + dx, -0.36), b2 = at(0.15 + dx, -0.36);
        ctx.beginPath();
        if (view !== 'p') ctx.ellipse(b1[0], b1[1], h * 0.06, h * 0.028, a, 0, TAU);
        ctx.ellipse(b2[0], b2[1], h * 0.06, h * 0.028, a, 0, TAU);
        ctx.fill();
      }
    } else if (P.hi) {
      if (view === 'p') taperTo(lines, [at(0.12, ey - 0.13), at(0.28, ey - 0.12)], fine, fine * 0.4, 0);
      else {
        taperTo(lines, [at(-0.22 + dx, ey - 0.12), at(-0.05 + dx, ey - 0.14)], fine * 0.5, fine, 0);
        taperTo(lines, [at(0.08 + dx, ey - 0.14), at(0.24 + dx, ey - 0.12)], fine, fine * 0.5, 0);
      }
    }
    // nose: tiny hook (鉤鼻)
    if (view !== 'p') {
      const nx = dx * 1.6 + 0.02;
      taperTo(lines, [at(nx, 0.08), at(nx + 0.05, 0.19), at(nx - 0.02, 0.2)], fine * 0.9, fine * 0.5, 0);
    }
    P.strokes(lines, 0.9);
    // lips: a dot of beni
    const lp = view === 'p' ? at(0.33, 0.34) : at(dx * 1.3 + 0.01, 0.33);
    ctx.fillStyle = kind === 'old' ? U.rgba(C.enji, 0.6) : C.beni;
    ctx.beginPath();
    ctx.ellipse(lp[0], lp[1], h * (kind === 'lady' ? 0.05 : 0.06), h * 0.028, a, 0, TAU);
    ctx.fill();
  }

  /** Fine hair strands (毛割) along an edge polyline: build into one path. */
  function strands(P, path, edge, n, len, dir, seed, w) {
    const r = U.rng(seed);
    const E = edge.length;
    for (let i = 0; i < n; i++) {
      const s = (i + r() * 0.8) / n;
      const k = s * (E - 1), i0 = Math.floor(k), f = k - i0;
      const a = edge[i0], b = edge[Math.min(E - 1, i0 + 1)];
      const p = lerpPt(a, b, f);
      const L = len * U.lerp(0.5, 1.2, r());
      const ang = dir + U.lerp(-0.25, 0.25, r());
      const q1 = [p[0] + Math.cos(ang) * L * 0.5 + U.lerp(-1, 1, r()) * L * 0.1, p[1] + Math.sin(ang) * L * 0.5];
      const q2 = [p[0] + Math.cos(ang) * L, p[1] + Math.sin(ang) * L];
      taperTo(path, [p, q1, q2], w, w * 0.15, 0);
    }
  }


  /** Overlay a textile pattern (B.pattern) inside a path, detail level only. */
  function patFill(P, path, name, fg, bg, size, a) {
    if (!P.hi) return;
    const ctx = P.ctx;
    ctx.save();
    ctx.globalAlpha *= a == null ? 1 : a;
    ctx.fillStyle = B.pattern(ctx, name, fg, bg, size);
    ctx.fill(path);
    ctx.restore();
  }
  const swayFn = (t, wind, k) => (0.18 + wind * 0.82) * swayF(t, k, 11);

  /* ================================================================== */
  /* かぐや姫 — Kaguya-hime                                              */
  /* ================================================================== */
  /*
   * Default kasane: 紫苑の匂 (shion-no-nioi, an eighth-month autumn kasane):
   * purples graded dark → pale over a green 単 (hitoe), worn under a
   * 朽葉 (kuchiba, golden fallen-leaf) karaginu with 亀甲 pattern, a scarlet
   * 緋袴 and a white 裳 train with a faint 青海波.
   */
  const KAGUYA = {
    hair: '#151413',
    sheen: C.gunjo,
    skin: C.gofun,
    karaginu: C.kuchiba,
    karaginuFg: U.mix(C.kuchiba, C.kitsune, 0.35),
    kasane: [C.murasaki, U.mix(C.murasaki, C.fuji, 0.45), C.fuji, U.mix(C.fuji, C.gofun, 0.5), U.mix(C.geppaku, C.fuji, 0.1), C.wakatake],
    kosode: C.gofun,
    hakama: U.mix(C.beni, C.akane, 0.35),
    mo: C.gofun,
    moFg: U.mix(C.ginnezu, C.gofun, 0.4),
    cord: U.mix(C.beni, C.akane, 0.35),
    motoyui: C.gofun,
    // hagoromo (celestial robe)
    hago: C.gofun,
    hagoGold: C.kin,
    hagoIn: U.mix(C.tsukiKi, C.gofun, 0.4),
    scarf: U.mix(C.gofun, C.tsukiKi, 0.3),
    scarfIn: U.mix(C.toki, C.gofun, 0.35),
    glow: C.tsukiKi,
    bamboo: C.aotake,
    bambooDark: C.matsuba,
    bambooIn: U.mix(C.tsukiKi, C.susuki, 0.3),
  };

  /* ---- stand: 3/4 view toward +x ---------------------------------- */
  function kaguyaStand(ctx, P, o, K) {
    const t = o.t, w = P.wind;
    const L = K.kasane;
    const sw = swayFn(t, w, 1), sw2 = swayFn(t, w, 2.3);
    const tr = o.train == null ? 1 : o.train;
    const tip = -70 - 130 * tr;

    // 裳 mo: white pleated train from the back waist, fanning over the floor
    const mo = sp([
      [-24, -168, 1], [-38, -118], [-56, -70], [-82, -32], [(tip - 70) * 0.62 + sw2, -10], [tip + sw2 * 2, -2], [tip - 3 + sw2 * 2, 3, 1],
      [-70, 3, 1], [-40, -50],
    ], true);
    P.fill(mo, K.mo);
    patFill(P, mo, 'seigaiha', K.moFg, K.mo, 7, 0.55);
    if (P.mid) P.folds([
      [[[-34, -130], [-60, -60], [tip * 0.62, -8]], 0.7, 0.15],
      [[[-32, -100], [-66, -36], [tip * 0.85, -2]], 0.6, 0.15],
    ], 0.7);
    P.line(mo, 0.85);
    // 引腰 hikigoshi: two long white ribbons trailing past the train
    if (P.mid) {
      const rb = new Path2D();
      taperTo(rb, crs([[-30, -150], [-58, -80], [-104, -26], [tip * 0.8, -4], [tip - 26 + sw * 6, 0.5]], 6), 4.2, 2.6, 0);
      taperTo(rb, crs([[-28, -140], [-50, -70], [-90, -18], [tip * 0.7, -1], [tip - 8 + sw2 * 5, 3]], 6), 3.6, 2.2, 0);
      P.fill(rb, K.mo);
      P.line(rb, 0.5, 0.8);
    }

    // 緋袴 at the front hem
    const hk = sp([[26, -84], [46, -44], [60, -12], [68, 1, 1], [34, 2, 1], [24, -40]], true);
    P.shape(hk, K.hakama, 0.8);
    if (P.mid) P.folds([[[[40, -50], [52, -22], [58, -2]], 0.7, 0.2]], 0.6);

    // robes: 表着 + 五衣 + 単, stacked hems and front edges
    const robeAt = (e, E) => {
      const h = -(E - e) * 0.9;
      return sp([
        [-6, -258], [-19, -247], [-25, -220], [-29, -175], [-34, -126], [-43, -80], [-57, -40], [-80 - e * 0.5, -12 + h * 0.4],
        [-104 - e * 0.8, h, 1], [-40, h + 1.5], [12, h + 2], [50 + e * 0.8, h, 1],
        [44 + e * 0.8, -30], [36 + e * 0.6, -80], [30 + e * 0.3, -130], [27, -180], [25, -225], [18, -252],
      ], true);
    };
    kasane(P, L, robeAt);
    if (P.mid) P.folds([
      [[[-14, -150], [-24, -90], [-44, -24]], 0.8, 0.12],
      [[[4, -128], [4, -70], [0, -8]], 0.7, 0.12],
      [[[22, -120], [28, -64], [36, -8]], 0.6, 0.12],
    ], 0.7);

    // 唐衣 karaginu (waist-length jacket)
    const kara = sp([
      [-6, -258], [-19, -247], [-25, -220], [-28, -172, 1], [0, -166], [28, -170, 1], [27, -205], [25, -228], [18, -252], [8, -257],
    ], true);
    P.fill(kara, K.karaginu);
    patFill(P, kara, 'kikko', K.karaginuFg, K.karaginu, 7);
    P.line(kara);

    // hair: long fall down the back, loosely tied, trailing on the floor
    const hs = sw * 1.4;
    const hairOut = [
      [-12, -292], [-20, -283], [-25, -265], [-29, -244], [-31, -222], [-32, -204], [-34 + hs * 0.2, -174], [-39 + hs * 0.35, -132],
      [-47 + hs * 0.6, -90], [-58 + hs * 0.8, -52], [-74 + hs * 0.6, -22], [-98, -6], [-132, 0], [-170, 2], [-190, 1, 1],
    ];
    const hairIn = [
      [-164, -2.5], [-124, -6], [-90, -13], [-66 + hs * 0.5, -30], [-50 + hs * 0.7, -62], [-39 + hs * 0.5, -100], [-31 + hs * 0.3, -140],
      [-26 + hs * 0.1, -180], [-23, -206], [-17, -228], [-9, -248], [-3, -262],
    ];
    const hair = sp(hairOut.concat(hairIn), true);
    P.fill(hair, K.hair);
    if (P.hi) {
      const st = new Path2D();
      strands(P, st, crs(hairOut.slice(6, 12), 3), 14, 11, Math.PI * 0.66, 7, P.lw * 0.45);
      P.strokes(st, 0.95, K.hair);
      const sh = new Path2D();
      taperTo(sh, crs([[-14, -250], [-26, -190], [-34, -130], [-50, -64], [-84, -14], [-140, -2]], 5), P.lw * 0.4, P.lw * 0.1, 0.2);
      taperTo(sh, crs([[-20, -238], [-30, -176], [-40, -110], [-60, -44], [-110, -5]], 5), P.lw * 0.35, P.lw * 0.1, 0.2);
      P.strokes(sh, 0.3, K.sheen);
    }
    P.line(hair, 0.8);
    // 元結 tie
    if (P.mid) {
      const ty = sp([[-33.5, -211, 1], [-22, -213, 1], [-21, -202, 1], [-33, -199, 1]], true);
      P.shape(ty, K.motoyui, 0.5, 0.8);
    }

    // far sleeve: only its layered cuff shows beyond the near one
    const SL = [K.karaginu].concat(L);
    const farAt = (e) => sp([[20, -206], [40 + e, -200, 1], [44 + e, -148 + e * 0.2, 1], [30, -142], [20, -170]], true);
    kasane(P, SL, farAt);

    // near sleeve: hangs from the forearm, rounded heavy bottom, cuff toward +x
    const nearAt = (e) => sp([
      [-8, -247], [-17, -224], [-21, -196], [-23, -164], [-22, -142], [-15, -130], [2, -126], [20, -127], [33 + e, -131 + e * 0.25, 1],
      [32.5 + e, -162], [30 + e, -197, 1], [14, -203], [0, -214], [-3, -236],
    ], true);
    const sl = kasane(P, SL, nearAt, false);
    patFill(P, sl, 'kikko', K.karaginuFg, K.karaginu, 7);
    P.line(sl);
    if (P.mid) P.folds([
      [[[-12, -205], [-10, -170], [-6, -134]], 0.8, 0.1],
      [[[10, -198], [14, -165], [16, -130]], 0.7, 0.1],
    ], 0.75);

    // collar: nested V of every layer down to the white kosode
    const cl = [K.karaginu].concat(L, [K.kosode]);
    const n = cl.length;
    const cs = P.mid ? Math.min(P.band, 2.2) : 2.4;
    for (let i = 0; i <= n; i++) {
      const e = (n - i) * cs * 0.75;
      const v = sp([[1 - e * 0.55, -259 + e * 0.12, 1], [11, -243 + e * 0.9, 1], [19 + e * 0.4, -258 + e * 0.1, 1]], true);
      P.fill(v, i < n ? cl[i] : K.skin);
      if (i === 0) P.line(v, 0.7);
    }

    kaguyaHead(P, 9, -273, 'q', K, 0.14);
  }

  /** Head: face (引目鉤鼻) with centre-parted hair. (x,y) = face centre. */
  function kaguyaHead(P, x, y, view, K, tilt) {
    const fh = 21;
    if (view === 'q') {
      face(P, x, y, fh, 'q', 'lady', K.skin, tilt);
      // crown, back of head and the near side-lock over the ear
      const cap = sp([
        [x + 3, y - 10.5], [x - 1, y - 8], [x - 4, y - 2], [x - 5.5, y + 6], [x - 6, y + 15], [x - 5, y + 24], [x - 11, y + 27],
        [x - 17, y + 20], [x - 21, y + 6], [x - 21, y - 8], [x - 16, y - 18], [x - 7, y - 24], [x + 3, y - 24], [x + 10, y - 19], [x + 11, y - 12],
        [x + 9, y - 8], [x + 6, y - 10],
      ], true);
      P.fill(cap, K.hair);
      P.line(cap, 0.55, 0.85);
      if (P.hi) {
        const st = new Path2D();
        taperTo(st, crs([[x + 2, y - 20], [x - 4, y - 14], [x - 7, y - 4]], 4), P.lw * 0.32, P.lw * 0.05, 0);
        taperTo(st, crs([[x - 5, y - 21], [x - 13, y - 13], [x - 16, y + 4]], 4), P.lw * 0.32, P.lw * 0.05, 0);
        P.strokes(st, 0.35, K.sheen);
      }
    }
  }

  /* ---- back: back view gazing up (hair dominates) ----------------- */
  function kaguyaBack(ctx, P, o, K) {
    const t = o.t, w = P.wind;
    const L = K.kasane;
    const look = o.look == null ? 0.45 : o.look; // head turn toward +x
    const sw = swayFn(t, w, 1), sw2 = swayFn(t, w, 2.7), sw3 = swayFn(t, w, 4.1);
    const tr = o.train == null ? 1 : o.train;
    const my = 20 + 34 * tr; // train reach toward the viewer

    // 裳 train fanning toward the viewer, a little to one side
    const mo = sp([
      [-24, -168, 1], [24, -168, 1], [44, -90], [66, -24], [92 + sw2 * 3, my - 6], [80 + sw2 * 3, my + 4, 1], [10, my + 10],
      [-66, my + 2, 1], [-84 + sw2 * 2, my - 10], [-62, -24], [-42, -90],
    ], true);
    P.fill(mo, K.mo);
    patFill(P, mo, 'seigaiha', K.moFg, K.mo, 7, 0.5);
    if (P.mid) {
      const f = [];
      for (let i = -3; i <= 3; i++) if (i) f.push([[[i * 4, -140], [i * 10, -60], [i * 19 + 4, my + 4]], 0.6, 0.2]);
      P.folds(f, 0.55);
    }
    P.line(mo, 0.85);
    // hikigoshi ribbons, left and right of the train
    if (P.mid) {
      const rb = new Path2D();
      taperTo(rb, crs([[-26, -150], [-50, -70], [-78, -10], [-104 + sw * 4, my - 4], [-112 + sw * 7, my + 18]], 6), 4, 2.4, 0);
      taperTo(rb, crs([[26, -150], [52, -70], [80, -8], [106 + sw3 * 4, my - 2], [118 + sw3 * 7, my + 14]], 6), 4, 2.4, 0);
      P.fill(rb, K.mo);
      P.line(rb, 0.5, 0.8);
    }

    // robes: bell from shoulders to the floor with stacked hems
    const robeAt = (e, E) => {
      const h = -(E - e);
      return sp([
        [0, -262], [-17, -256], [-30, -240], [-36, -204], [-40, -154], [-48, -98], [-60, -46], [-74 - e * 0.8, h - 4, 1],
        [-36, h + 3], [36, h + 3], [74 + e * 0.8, h - 4, 1],
        [60, -46], [48, -98], [40, -154], [36, -204], [30, -240], [17, -256],
      ], true);
    };
    kasane(P, L, robeAt);
    if (P.mid) P.folds([
      [[[-30, -150], [-40, -90], [-56, -20]], 0.8, 0.12],
      [[[30, -150], [40, -90], [56, -20]], 0.8, 0.12],
    ], 0.7);

    // sleeves: arms folded forward, sleeves hang heavy at both sides
    const SL = [K.karaginu].concat(L);
    for (const side of [-1, 1]) {
      const d = (side > 0 ? sw : sw2) * 1.4;
      const at = (e) => {
        const s = side;
        return sp([
          [s * 22, -252], [s * 36, -240], [s * 45, -212], [s * 51 + d * 0.3, -175], [s * 55 + d * 0.7, -140],
          [s * (54 + e * 0.35) + d, -120 + e, 1], [s * 40 + d, -114 + e * 0.95], [s * 29 + d * 0.8, -118 + e * 0.9, 1],
          [s * 27, -150], [s * 25, -200],
        ], true);
      };
      const out = kasane(P, SL, at, false);
      patFill(P, out, 'kikko', K.karaginuFg, K.karaginu, 7);
      P.line(out);
      if (P.mid) P.folds([[[[side * 38, -200], [side * 42, -160], [side * 42, -122]], 0.7, 0.1]], 0.7);
    }
    // karaginu back panel
    const kara = sp([[-17, -256], [-30, -240], [-34, -204], [-31, -166, 1], [0, -162], [31, -166, 1], [34, -204], [30, -240], [17, -256], [0, -261]], true);
    P.fill(kara, K.karaginu);
    patFill(P, kara, 'kikko', K.karaginuFg, K.karaginu, 7);
    P.line(kara);
    if (P.mid) {
      const kg = new Path2D();
      taperTo(kg, [[-31, -168], [0, -164], [31, -168]], 3.6, 3.6, 0);
      P.shape(kg, K.cord, 0.45);
    }

    // head tilted back; a sliver of cheek toward the moon
    const hx = look * 2.5, hy = -275;
    if (P.mid && look > 0.05) {
      const k = Math.min(1, look + 0.2);
      const ch = sp([[hx + 4, hy - 4], [hx + 9 + 5 * k, hy - 3], [hx + 11 + 3 * k, hy + 5], [hx + 7, hy + 12], [hx + 2, hy + 10]], true);
      P.shape(ch, K.skin, 0.45, 0.6);
    }
    // hair: crown → spread over the shoulders → tied → long fall → pooled on the train
    const hs = sw * 2.2, hs2 = sw3 * 2;
    const R = [
      [hx + 11, -292], [hx + 13.5, -280], [hx + 12, -266], [18, -254], [21, -240], [18, -224], [12.5, -210],
      [12 + hs * 0.15, -180], [14 + hs * 0.35, -130], [16 + hs * 0.55, -80], [18 + hs * 0.75, -30], [21 + hs * 0.9, 4],
      [24 + hs, my - 12], [16 + hs + hs2, my + 8], [5 + hs + hs2 * 1.3, my + 16, 1],
    ];
    const Lh = [
      [-6 + hs + hs2, my + 12], [-17 + hs + hs2 * 0.5, my - 2], [-18 + hs * 0.9, 4], [-16 + hs * 0.75, -30], [-14 + hs * 0.55, -80],
      [-12 + hs * 0.35, -130], [-11 + hs * 0.15, -180], [-12.5, -210], [-18, -224], [-21, -240], [-18, -254], [hx - 12, -266],
      [hx - 13.5, -280], [hx - 10, -292], [hx, -298],
    ];
    const hair = sp(R.concat(Lh), true);
    P.fill(hair, K.hair);
    if (P.hi) {
      const st = new Path2D();
      strands(P, st, crs(R.slice(7, 13), 3), 12, 9, 1.35, 3, P.lw * 0.42);
      strands(P, st, crs(Lh.slice(2, 8).reverse(), 3), 12, 9, 1.8, 5, P.lw * 0.42);
      strands(P, st, crs([R[12], R[13], R[14], Lh[0], Lh[1]], 3), 10, 7, 1.57, 9, P.lw * 0.42);
      P.strokes(st, 0.95, K.hair);
      const sh = new Path2D();
      for (let i = -2; i <= 2; i++) {
        taperTo(sh, crs([[hx + i * 3, -290], [i * 5, -246], [i * 2.2 + hs * 0.2, -200], [i * 3 + hs * 0.5, -110], [i * 4 + hs * 0.8, -10], [i * 4.5 + hs + hs2, my]], 5), P.lw * 0.32, P.lw * 0.08, 0.1);
      }
      P.strokes(sh, 0.22, K.sheen);
    }
    P.line(hair, 0.75);
    // 元結 white paper tie
    if (P.mid) {
      const ty = sp([[-13.5, -216, 1], [13.5, -216, 1], [13, -205, 1], [-13, -205, 1]], true);
      P.shape(ty, K.motoyui, 0.5, 0.8);
    }
  }

  define('kaguya', {
    poses: ['stand', 'back'],
    defaults: {},
    bounds(pose, o) {
      const tr = o.train == null ? 1 : o.train;
      if (pose === 'back') return [-125, -305, 250, 330 + 34 * tr];
      return [-230 - 130 * (tr - 1), -305, 305 + 130 * tr - 130, 312];
    },
    draw(ctx, P, o) {
      const K = pal(KAGUYA, o);
      if (o.pose === 'back') kaguyaBack(ctx, P, o, K);
      else kaguyaStand(ctx, P, o, K);
    },
  });

  for (const k of Object.keys(REG)) CAST.POSES[k] = REG[k].poses.slice();
  CAST._internal = { sp, crs, taperTo, face, makePen };
})(window.TSUKI = window.TSUKI || {});
