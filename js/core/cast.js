/* ==========================================================================
   cast.js — the film's characters (TSUKI.CAST), drawn procedurally in the
   yamato-e / ukiyo-e manner so every scene shows the same people.

   CALL   TSUKI.CAST.<name>(ctx, x, y, scale, opts)
          (x, y) = ground contact point (feet / base of the robes) — except
          kaguya 'rise' and tennyo 'fly', where it is the body centre (waist).
          scale 1 = a standing adult ~300 logical px tall. Animals are drawn
          at true size beside people (rabbit sitting ~55 px, fox ~85 px, stag
          ~250 px at scale 1): use scale 3–8 for moon-rabbit close-ups.
          Every call is a pure function of its arguments and leaves ctx as it
          found it.

   COMMON OPTS (defaults)
     pose       string, see CAST.POSES[name]; unknown → first pose
     facing     1 (toward +x, right) | -1 (mirrored, toward the left)
     t          0      seconds; drives sway of hair, sleeves, ribbons, walk
                       cycles, breathing (deterministic, smooth)
     wind       0.25   0..1 amplitude of sway / flutter
     alpha      1      group opacity (drawn opaque into a small offscreen
                       buffer and composited once: overlapping robes never
                       show through each other)
     buffer     false  force the offscreen group composite (use with special
                       globalCompositeOperation / ctx.globalAlpha < 1 is
                       handled automatically)
     silhouette null   colour string → flat single-ink silhouette (no lines,
                       no interior detail), e.g. rabbits printed on the moon
     outline    0.85   sumi key-line alpha (0 = flat colour planes)
     palette    {}     overrides of the character's colour table (see the
                       KAGUYA / OKINA / … tables below; hex strings)
   Level of detail follows the on-screen size: kasane bands, faces and folds
   from ~90 px tall; textile patterns, hair strands, whiskers at scale ≥ 0.8.

   CHARACTERS · POSES · EXTRA OPTS
     kaguya   stand · back · seated · weep · rise · baby
                look   back: 0..1 head turned up toward +x (0.6);
                       rise: 'up' to look ahead (default gazes down)
                train  0..1+ length of the 裳 train / hair on the floor (1)
                stand  weep: true → standing weep (default seated)
                robe   rise: 'hagoromo' → white/gold feathered celestial robe
                lean   rise: body tilt in radians (0.1)
                glow   baby: 0..1 light of the bamboo node (1)
                stalk  baby: false → the girl alone (no bamboo)
     okina    stand · walk · cut · kneel · reach
                phase  cut: 0 raised … 1 struck (0.2)
                holding kneel: 'baby' (default, glowing child) | 'none'
                glow   kneel: 0..1
     ouna     stand · kneel · weep · point      (elder: same poses, indigo)
     elder    stand · kneel · weep · point
     mikado   stand · walk · kneel · gaze   train 0..1+, look (radians)
     tennyo   fly · stand (on a procession cloud)
                instrument 'none' | 'sho' | 'flute' | 'lute'
                dir    fly: flight angle in radians (0 level, −0.3 rising)
     rabbit   sit · pound · hop · leap · gaze
                phase  pound: 0..1 stroke (0 raised, .5 impact; default from t)
                       hop / leap: 0..1 through the jump
     guard    stand · aim · kneel           (alias: samurai)
     child    reach · stand · sit          girl: true (bob hair), cry: true
     fox      sit · walk                   color: 'white' (Inari, default) | 'gold'
     deer     stand · call · graze · walk  antlers: false → doe

   HELPERS
     CAST.POSES           { name: [poses] }
     CAST.bounds(name, pose, opts) → [x, y, w, h] local box at scale 1,
                          facing right (for layout / culling)
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
  /**
   * total: local units → logical px; s: effective scale for level of detail
   * (scale × figure size / 300, so a small animal at scale 1 draws like a
   * small figure).
   */
  const patterns = new Map(); // CanvasPattern cache (name|fg|bg|size)
  function makePen(ctx, total, o, s) {
    if (s == null) s = total;
    const sil = o.silhouette === true ? C.sumi : o.silhouette || null;
    const ol = o.outline == null ? 0.85 : o.outline;
    const inv = 1 / total;
    const lwS = U.clamp(0.45 + 1.5 * s, 0.65, 2.5); // key-line width in screen px
    const wash = o.style === 'sumi-line' ? (o.wash == null ? 0.1 : o.wash) : 0;
    const inkCol = o.ink || C.sumi;
    const P = {
      ctx, s, inv, sil, ol, wash, inkCol,
      t: o.t || 0,
      wind: o.wind == null ? 0.25 : o.wind,
      lw: lwS * inv * (wash ? 0.85 : 1),
      px: inv,
      hi: !sil && s >= 0.8,        // fine detail: patterns, hair strands
      mid: !sil && (s >= 0.3 || wash > 0), // medium detail: faces, folds, kasane
      fx: !sil && !wash,           // colour effects: glows, sparkles, accents
      tiny: s < 0.2,
      reg: sil || wash ? 0 : U.clamp(0.35 + 0.55 * s, 0.35, 1.1) * inv, // registration offset
      ink: U.rgba(inkCol, ol),
    };
    P.nb = s < 0.22 ? 2 : s < 1.1 ? 3 : 99; // kasane layers shown (all 6–7 at hero scale)
    P.band = U.clamp(1.3 + 1.3 * s, 1.5, 3.0) * inv;        // kasane band width (local)
    P.fill = (path, col) => {
      if (wash) { ctx.fillStyle = U.rgba(inkCol, wash); ctx.fill(path); return; }
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
      ctx.fillStyle = wash ? U.rgba(inkCol, wash) : sil || col;
      ctx.fill(path);
    };
    P.line = (path, mul, a) => {
      if (sil || ol <= 0) return;
      ctx.strokeStyle = a == null ? P.ink : U.rgba(inkCol, ol * a);
      ctx.lineWidth = P.lw * (mul == null ? 1 : mul);
      ctx.stroke(path);
    };
    /** Textile pattern as a fill style (hi detail only; the base colour otherwise). */
    P.pat = (name, fg, bg, size, a) => {
      if (!P.hi) return bg;
      const f = a == null ? fg : U.mix(bg, fg, a);
      const key = name + f + bg + size;
      let pt = patterns.get(key);
      if (!pt) { pt = B.pattern(ctx, name, f, bg, size); patterns.set(key, pt); }
      return pt;
    };
    /** A pale 'reverse' key-line, as printers leave on sumi-black garments. */
    P.rline = (path, col, mul, a) => {
      if (sil || wash || ol <= 0) return;
      ctx.strokeStyle = U.rgba(col, (a == null ? 0.75 : a) * ol);
      ctx.lineWidth = P.lw * (mul == null ? 0.7 : mul);
      ctx.stroke(path);
    };
    P.shape = (path, col, mul, a) => {
      P.fill(path, col);
      P.line(path, mul, a);
    };
    /** Fill a Path2D of tapered strokes in sumi (fold lines, strands). */
    P.strokes = (path, a, col) => {
      if (sil || ol <= 0) return;
      ctx.fillStyle = col && !wash ? U.rgba(col, a == null ? 1 : a) : U.rgba(inkCol, ol * (a == null ? 1 : a) * (col ? 0.7 : 1));
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
  // small scratch canvases pooled by size bucket (a full-frame scratch would
  // cost a full snapshot per figure)
  const scratchPool = new Map();
  function getScratch(w, h) {
    const bw = Math.ceil(w / 128) * 128, bh = Math.ceil(h / 128) * 128;
    const key = bw + 'x' + bh;
    let c = scratchPool.get(key);
    if (!c) {
      if (scratchPool.size > 12) scratchPool.clear();
      c = document.createElement('canvas');
      c.width = bw; c.height = bh;
      scratchPool.set(key, c);
    }
    return c;
  }

  const REG = {}; // name → { draw, poses, bounds(pose,o) }

  /**
   * Map a draw routine's return value from local units to the caller's space:
   * [x, y] pairs (and arrays of them) become points; numbers under keys
   * r, rx, ry, w, h, size become lengths; anything else passes through.
   */
  function mapRet(v, x, y, s, f, key) {
    if (Array.isArray(v)) {
      if (v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number') return [x + v[0] * s * f, y + v[1] * s];
      return v.map((e) => mapRet(e, x, y, s, f));
    }
    if (v && typeof v === 'object' && !(v instanceof Path2D)) {
      const out = {};
      for (const k of Object.keys(v)) out[k] = mapRet(v[k], x, y, s, f, k);
      return out;
    }
    if (typeof v === 'number' && /^(r|rx|ry|w|h|size|len)$/.test(key || '')) return v * s;
    return v;
  }

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
      const unit = def.unit || 1;
      const se = scale * (def.size || 300) / 300;
      scale *= unit;
      const ga = ctx.globalAlpha;
      const buffered = (a * ga < 0.995 || o.buffer) && !o.noBuffer && typeof ctx.getTransform === 'function';
      if (!buffered) {
        ctx.save();
        ctx.globalAlpha = ga * a;
        ctx.translate(x, y);
        ctx.scale(scale * facing, scale);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        const ret = def.draw(ctx, makePen(ctx, scale, o, se), o);
        ctx.restore();
        return ret ? mapRet(ret, x, y, scale, facing) : undefined;
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
      const scratch = getScratch(x1 - x0, y1 - y0);
      const s2 = scratch.getContext('2d');
      s2.setTransform(1, 0, 0, 1, 0, 0);
      s2.globalAlpha = 1;
      s2.globalCompositeOperation = 'source-over';
      s2.clearRect(0, 0, x1 - x0, y1 - y0);
      s2.save();
      s2.setTransform(M.a, M.b, M.c, M.d, M.e - x0, M.f - y0);
      s2.translate(x, y);
      s2.scale(scale * facing, scale);
      s2.lineJoin = 'round';
      s2.lineCap = 'round';
      const ret = def.draw(s2, makePen(s2, scale, o, se), o);
      s2.restore();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = ga * a;
      ctx.drawImage(scratch, 0, 0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
      ctx.restore();
      return ret ? mapRet(ret, x, y, scale, facing) : undefined;
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
    const u = d.unit || 1;
    return d.bounds(pose || d.poses[0], o).map((v) => v * u);
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
  function kasane(P, layers, shapeAt, lineOuter, outerFill) {
    const pick = pickLayers(layers, P.nb);
    const E = (pick.length - 1) * P.band;
    let outer = null;
    for (let i = pick.length - 1; i >= 0; i--) {
      const path = shapeAt(i * P.band, E);
      P.fill(path, i === 0 ? outerFill || pick[i] : pick[i]);
      if (i === 0) outer = path;
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
        ctx.fillStyle = U.rgba(P.inkCol, 0.4 * P.ol);
        const b1 = at(-0.14 + dx, -0.36), b2 = at(0.15 + dx, -0.36);
        ctx.beginPath();
        if (view !== 'p') ctx.ellipse(b1[0], b1[1], h * 0.045, h * 0.02, a, 0, TAU);
        ctx.ellipse(b2[0], b2[1], h * 0.045, h * 0.02, a, 0, TAU);
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
    if (!P.fx) return;
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


  /**
   * Ribbons / scarves: tapered strips outlined by a wider sumi underlay (a
   * fill is much cheaper than stroking a long tapered polygon).
   * list: [[pts, w0, w1, belly], ...]
   */
  function ribbons(P, list, col, lineMul, a) {
    const fillP = new Path2D();
    const ink = !P.sil && P.ol > 0 ? new Path2D() : null;
    const o = P.lw * (lineMul == null ? 0.6 : lineMul);
    for (const [pts, w0, w1, b] of list) {
      taperTo(fillP, pts, w0, w1, b);
      if (ink) taperTo(ink, pts, w0 + o * 2, w1 + o * 2, b * w0 / (w0 + o * 2));
    }
    if (ink) {
      P.ctx.fillStyle = U.rgba(P.inkCol, P.ol * (a == null ? 1 : a));
      P.ctx.fill(ink);
    }
    P.fill(fillP, col);
    return fillP;
  }

  /* ------------------------------------------------------------------ */
  /* textile tiles of our own (cached canvases → CanvasPattern)          */
  /* ------------------------------------------------------------------ */
  const tiles = new Map();
  /**
   * CanvasPattern from a cached tile. unit = tile size in local units,
   * px = tile canvas size, draw(c, px) paints it (seamless).
   */
  function tilePattern(ctx, key, unit, px, draw) {
    let e = tiles.get(key);
    if (!e) {
      const cv = B.canvas(px, px);
      draw(cv.getContext('2d'), px);
      const pat = ctx.createPattern(cv, 'repeat');
      if (pat.setTransform) pat.setTransform(new DOMMatrix([unit / px, 0, 0, unit / px, 0, 0]));
      e = { pat };
      tiles.set(key, e);
    }
    return e.pat;
  }
  /** A small white leaping rabbit (for the 波兎 motif) in unit space, heading +x. */
  function leapingRabbit(c, x, y, s) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.rotate(-0.28);
    c.beginPath();
    c.ellipse(0, 0, 0.5, 0.26, 0, 0, TAU);                 // body
    c.moveTo(0.62, -0.1); c.ellipse(0.5, -0.12, 0.22, 0.19, 0, 0, TAU); // head
    c.moveTo(0.48, -0.26); c.ellipse(0.28, -0.4, 0.26, 0.07, 0.55, 0, TAU); // ears swept back
    c.moveTo(0.52, -0.3); c.ellipse(0.36, -0.46, 0.24, 0.06, 0.35, 0, TAU);
    c.moveTo(-0.3, 0.1); c.ellipse(-0.62, 0.22, 0.34, 0.08, 0.35, 0, TAU); // hind legs stretched back
    c.moveTo(0.4, 0.14); c.ellipse(0.62, 0.3, 0.24, 0.06, -0.5, 0, TAU);  // forelegs
    c.moveTo(-0.5, -0.08); c.ellipse(-0.56, -0.12, 0.1, 0.09, 0, 0, TAU); // tail
    c.fill();
    c.restore();
  }
  /** 波兎: white rabbits leaping over seigaiha waves on 藍. */
  function namiUsagi(ctx, ground, fg, unit) {
    return tilePattern(ctx, 'nami|' + ground + fg + unit, unit, unit >= 40 ? 256 : 128, (c, S) => {
      c.fillStyle = ground;
      c.fillRect(0, 0, S, S);
      c.strokeStyle = U.rgba(fg, 0.85);
      c.lineWidth = S * 0.013;
      const waves = (cy, xs) => {
        for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) for (const cx of xs) {
          for (const k of [1, 0.68, 0.36]) {
            c.beginPath();
            c.arc(cx * S + ox, cy * S + oy, S * 0.25 * k, Math.PI, 0);
            if (k === 1) { c.fillStyle = ground; c.fill(); }
            c.stroke();
          }
        }
      };
      waves(0.62, [0, 0.5, 1]);
      waves(0.74, [0.25, 0.75]);
      c.fillStyle = fg;
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        leapingRabbit(c, 0.3 * S + ox, 0.3 * S + oy, S * 0.24);
        leapingRabbit(c, 0.8 * S + ox, 0.05 * S + oy, S * 0.19);
      }
    });
  }
  /** 縞: fine vertical stripes. */
  function stripes(ctx, ground, fg, unit) {
    return tilePattern(ctx, 'stripe|' + ground + fg + unit, unit, 32, (c, S) => {
      c.fillStyle = ground; c.fillRect(0, 0, S, S);
      c.fillStyle = fg; c.fillRect(S * 0.1, 0, S * 0.14, S); c.fillRect(S * 0.55, 0, S * 0.07, S);
    });
  }
  /** 絣: 紺 with small bleeding 胡粉 crosses and dashes. */
  function kasuri(ctx, ground, fg, unit) {
    return tilePattern(ctx, 'kasuri|' + ground + fg + unit, unit, unit >= 20 ? 128 : 64, (c, S) => {
      c.fillStyle = ground; c.fillRect(0, 0, S, S);
      c.fillStyle = fg;
      const cross = (x, y, k) => {
        for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
          c.globalAlpha = 0.9; c.fillRect(x * S - k * S + ox, y * S - 0.018 * S + oy, 2 * k * S, 0.036 * S);
          c.globalAlpha = 0.75; c.fillRect(x * S - 0.018 * S + ox, y * S - k * S * 0.8 + oy, 0.036 * S, 1.6 * k * S);
        }
      };
      cross(0.25, 0.25, 0.09); cross(0.75, 0.75, 0.09);
      c.globalAlpha = 0.6;
      c.fillRect(0.62 * S, 0.22 * S, 0.14 * S, 0.03 * S); c.fillRect(0.1 * S, 0.7 * S, 0.12 * S, 0.03 * S);
      c.globalAlpha = 1;
    });
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
    const tip = -70 - 110 * tr;

    // 裳 mo: white pleated train from the back waist, fanning over the floor
    const mo = sp([
      [-24, -168, 1], [-38, -118], [-56, -70], [-82, -32], [(tip - 70) * 0.62 + sw2, -10], [tip + sw2 * 2, -2], [tip - 3 + sw2 * 2, 3, 1],
      [-70, 3, 1], [-40, -50],
    ], true);
    P.fill(mo, P.s >= 1.2 ? P.pat('seigaiha', K.moFg, K.mo, 7, 0.55) : K.mo);
    if (P.mid) P.folds([
      [[[-40, -110], [-66, -46], [tip * 0.7, -5]], 0.6, 0.15],
      [[[-44, -80], [-80, -26], [tip * 0.92, -1]], 0.55, 0.15],
    ], 0.6);
    P.line(mo, 0.85);

    // 緋袴 at the front hem
    const hk = sp([[26, -84], [46, -44], [60, -12], [68, 1, 1], [34, 2, 1], [24, -40]], true);
    P.shape(hk, K.hakama, 0.8);
    if (P.mid) P.folds([[[[40, -50], [52, -22], [58, -2]], 0.7, 0.2]], 0.6);

    // robes: 表着 + 五衣 + 単, stacked hems and front edges
    const robeAt = (e, E) => {
      const h = -(E - e) * 0.9;
      return sp([
        [-6, -258], [-16, -251], [-22, -234], [-26, -205], [-29, -175], [-34, -126], [-43, -80], [-57, -40], [-80 - e * 0.5, -12 + h * 0.4],
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
      [-6, -258], [-16, -251], [-22, -234], [-26, -205], [-28, -172, 1], [0, -166], [28, -170, 1], [27, -205], [25, -228], [18, -252], [8, -257],
    ], true);
    P.fill(kara, P.pat('kikko', K.karaginuFg, K.karaginu, 7));
    P.line(kara);

    // far sleeve: only its layered cuff shows beyond the near one
    const SL = [K.karaginu].concat(L);
    const farAt = (e) => sp([[20, -212], [40 + e, -208, 1], [45 + e, -150 + e * 0.2, 1], [30, -144], [20, -170]], true);
    kasane(P, SL, farAt);

    const weep = o.pose === 'weep';
    // near sleeve: hangs from the forearm, rounded heavy bottom, cuff toward +x
    // (weeping: this is the other arm's sleeve, hanging lower)
    const nearAt = (e) => sp([
      [-9, -248], [-16, -228], [-20, -200], [-23, -168], [-24, -140], [-19, -124], [-6, -119], [14, -122], [34 + e, -130 + e * 0.25, 1],
      [33 + e, -168], [31 + e, -207, 1], [22, -213], [10, -224], [0, -238],
    ], true);
    const sl = kasane(P, SL, nearAt, false, P.pat('kikko', K.karaginuFg, K.karaginu, 7));
    P.line(sl);
    if (P.mid) P.folds([
      [[[-12, -210], [-13, -168], [-8, -126]], 0.8, 0.1],
      [[[8, -214], [13, -170], [18, -126]], 0.7, 0.1],
    ], 0.75);

    // collar: nested V of every layer down to the white kosode
    const cl = pickLayers([K.karaginu].concat(L, [K.kosode]), P.nb + 1);
    const n = cl.length;
    const cs = P.mid ? U.clamp(P.band * 0.6, 1.1, 1.8) : 2.2;
    for (let i = 0; i <= n; i++) {
      const e = (n - i) * cs;
      const v = sp([[6.5 - e * 0.95, -260 + e * 0.15, 1], [10.5 + e * 0.1, -252 + e * 1.05, 1], [14 + e * 0.6, -260 + e * 0.1, 1]], true);
      P.fill(v, i < n ? cl[i] : K.skin);
      if (i === 0) P.line(v, 0.7);
    }

    // face, then one hair mass: crown, side-lock and the long fall to the floor
    const bow = weep ? 0.42 : 0;
    const F = headAt(9, -273, bow);
    face(P, F[0], F[1], 21, 'q', 'lady', K.skin, 0.14 + bow);
    const hs = sw * 1.4;
    ladyHairQ(P, 9, -273, K, [
      [-10, -240], [-13, -226], [-17, -204], [-21 + hs * 0.1, -180], [-27 + hs * 0.3, -140], [-36 + hs * 0.5, -100],
      [-50 + hs * 0.7, -62], [-66 + hs * 0.5, -30], [-90, -13], [-124, -6], [-164, -2.5],
    ], [
      [-14, -262], [-18, -252], [-24, -236], [-29.5, -216], [-32, -198], [-34 + hs * 0.2, -174], [-39 + hs * 0.35, -132],
      [-47 + hs * 0.6, -90], [-58 + hs * 0.8, -52], [-74 + hs * 0.6, -22], [-98, -6], [-132, 0], [-170, 2], [-190, 1, 1],
    ], -207, bow);
    if (weep) weepSleeve(P, F[0], F[1], K, SL, sw);
  }

  /** Head pivot: the face centre after bowing the head by `bow` radians. */
  const headAt = (x, y, bow) => (bow ? rot([x, y], x - 3, y + 16, bow) : [x, y]);

  /** The sleeve raised to the face (袖を顔に): cuff across the eyes, hanging below. */
  function weepSleeve(P, fx, fy, K, SL, sw) {
    const d = sw * 1.2;
    const at = (e) => sp([
      [fx - 3, fy + 1 - e * 0.9, 1], [fx + 5, fy - 1 - e], [fx + 13 + e * 0.3, fy + 2 - e * 0.8, 1], [fx + 18, fy + 16], [fx + 24 + d * 0.3, fy + 40],
      [fx + 24 + d, fy + 62], [fx + 12 + d, fy + 74], [fx - 4 + d * 0.6, fy + 68], [fx - 10, fy + 46], [fx - 8, fy + 22],
    ], true);
    const out = kasane(P, SL, at, false, P.pat('kikko', K.karaginuFg, K.karaginu, 7));
    P.line(out);
    if (P.mid) P.folds([
      [[[fx + 1, fy + 6], [fx + 3, fy + 34], [fx + 3 + d, fy + 64]], 0.8, 0.1],
      [[[fx + 10, fy + 6], [fx + 13, fy + 32], [fx + 13 + d, fy + 58]], 0.6, 0.1],
    ], 0.7);
  }

  /**
   * 3/4 lady's hair toward +x: crown, centre part, side-lock over the ear, and
   * a long fall. (x,y) = face centre. inner/outer: the fall's two edges, each
   * listed top → bottom (inner = toward the body). tieY: 元結 height (or null).
   */
  function ladyHairQ(P, x, y, K, inner, outer, tieY, bow) {
    const ctx = P.ctx;
    let lock = [
      [x + 2, y - 11, 1], [x - 1, y - 9], [x - 3.5, y - 3], [x - 5, y + 5], [x - 6, y + 13], [x - 6.5, y + 20], [x - 8.5, y + 26], [x - 13, y + 30],
    ];
    let crown = [
      [x - 21, y + 3], [x - 20.5, y - 8], [x - 16, y - 17], [x - 8, y - 23], [x + 1, y - 24], [x + 7.5, y - 20], [x + 10, y - 13], [x + 9, y - 8], [x + 6, y - 10.2],
    ];
    if (bow) {
      lock = rotAll(lock, x - 3, y + 16, bow);
      crown = rotAll(crown, x - 3, y + 16, bow);
    }
    const pts = lock.concat(inner, outer.slice().reverse(), crown);
    const hair = sp(pts, true);
    P.fill(hair, K.hair);
    if (P.hi) {
      const st = new Path2D();
      const n = outer.length;
      strands(P, st, crs(outer.slice(Math.floor(n * 0.4), n - 2), 3), 14, 11, Math.PI * 0.66, 7, P.lw * 0.45);
      P.strokes(st, 0.95, K.hair);
      const sh = new Path2D(); // hair sheen (hero scale only)
      const mid = (f) => inner.map((p, i) => {
        const q = outer[Math.min(n - 1, Math.round((i * (n - 1)) / (inner.length - 1)))];
        return [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
      });
      taperTo(sh, crs(mid(0.35), 5), P.lw * 0.4, P.lw * 0.1, 0.2);
      taperTo(sh, crs(mid(0.7), 5), P.lw * 0.35, P.lw * 0.1, 0.2);
      taperTo(sh, crs(rotAll([[x + 1, y - 21], [x - 5, y - 14], [x - 7, y - 3]], x - 3, y + 16, bow || 0), 4), P.lw * 0.3, P.lw * 0.05, 0);
      taperTo(sh, crs(rotAll([[x - 6, y - 21], [x - 14, y - 12], [x - 16, y + 6]], x - 3, y + 16, bow || 0), 4), P.lw * 0.3, P.lw * 0.05, 0);
      if (P.s >= 1.2) P.strokes(sh, 0.3, K.sheen);
    }
    P.line(hair, 0.75);
    if (tieY != null && P.mid) {
      // 元結: a white paper band across the fall, spanning its two edges
      const xAt = (pts, yy) => {
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1];
          if ((a[1] - yy) * (b[1] - yy) <= 0 && a[1] !== b[1]) return a[0] + (b[0] - a[0]) * (yy - a[1]) / (b[1] - a[1]);
        }
        return pts[0][0];
      };
      const y0 = tieY - 3, y1 = tieY + 2.5;
      const o0 = xAt(outer, y0), o1 = xAt(outer, y1), i0 = xAt(inner, y0), i1 = xAt(inner, y1);
      const sg = i0 > o0 ? 1 : -1;
      const ty = sp([[o0 + sg * 0.9, y0, 1], [i0 - sg * 0.9, y0 - 0.5, 1], [i1 - sg * 0.9, y1 - 0.5, 1], [o1 + sg * 0.9, y1, 1]], true);
      P.shape(ty, K.motoyui, 0.35, 0.6);
    }
  }

  /* ---- back: back view gazing up (hair dominates) ----------------- */
  function kaguyaBack(ctx, P, o, K) {
    const t = o.t, w = P.wind;
    const L = K.kasane;
    const look = o.look == null ? 0.6 : o.look; // head turn toward +x (0..1)
    const sw = swayFn(t, w, 1), sw2 = swayFn(t, w, 2.7), sw3 = swayFn(t, w, 4.1);
    const tr = o.train == null ? 1 : o.train;
    const my = 14 + 28 * tr; // train reach toward the viewer

    // 裳 train fanning toward the viewer, a little to one side
    const mo = sp([
      [-24, -168, 1], [24, -168, 1], [42, -90], [60, -24], [80 + sw2 * 3, my - 6], [70 + sw2 * 3, my + 3, 1], [8, my + 8],
      [-58, my + 1, 1], [-72 + sw2 * 2, my - 9], [-58, -24], [-40, -90],
    ], true);
    P.fill(mo, P.s >= 1.2 ? P.pat('seigaiha', K.moFg, K.mo, 7, 0.5) : K.mo);
    if (P.mid) {
      const f = [];
      for (let i = -3; i <= 3; i++) if (i) f.push([[[i * 4, -140], [i * 10, -60], [i * 17 + 4, my + 3]], 0.6, 0.2]);
      P.folds(f, 0.55);
    }
    P.line(mo, 0.85);

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
      const out = kasane(P, SL, at, false, P.pat('kikko', K.karaginuFg, K.karaginu, 7));
      P.line(out);
      if (P.mid) P.folds([[[[side * 38, -200], [side * 42, -160], [side * 42, -122]], 0.7, 0.1]], 0.7);
    }
    // karaginu back panel
    const kara = sp([[-17, -256], [-30, -240], [-34, -204], [-31, -166, 1], [0, -162], [31, -166, 1], [34, -204], [30, -240], [17, -256], [0, -261]], true);
    P.fill(kara, P.pat('kikko', K.karaginuFg, K.karaginu, 7));
    P.line(kara);
    if (P.mid) {
      const kg = new Path2D();
      taperTo(kg, [[-31, -168], [0, -164], [31, -168]], 3.6, 3.6, 0);
      P.shape(kg, K.cord, 0.45);
    }

    // head tilted back toward the moon (+x): the jaw & chin show at the right
    const hx = look * 2.5, hy = -277;
    if (look > 0.05) {
      const k = Math.min(1, look);
      const ch = sp([
        [hx + 8, hy - 10], [hx + 12 + 1.5 * k, hy - 11], [hx + 16 + 3.5 * k, hy - 6.5], [hx + 18.5 + 4 * k, hy - 1],
        [hx + 18 + 3.5 * k, hy + 4.5], [hx + 14.5 + 2 * k, hy + 9.5], [hx + 8, hy + 9],
      ], true);
      P.shape(ch, K.skin, 0.45, 0.65);
      if (P.hi && look > 0.3) {
        // the lost profile: a single lash line at the cheek's edge
        const la = new Path2D();
        taperTo(la, [[hx + 15 + 3 * k, hy - 5.5], [hx + 17.5 + 3.8 * k, hy - 4], [hx + 18.8 + 4 * k, hy - 2.2]], P.lw * 0.5, P.lw * 0.2, 0);
        P.strokes(la, 0.8);
      }
    }
    // hair: crown → a bell over the shoulders → tied → a long gently S-curving
    // fall → pooled on the train, swept to one side
    const hs = sw * 2.2, hs2 = sw3 * 2;
    const S = (y) => Math.sin((y + 220) / 90) * 2.5; // the fall's slow S
    const R = [
      [hx + 10, -294], [hx + 14 - look * 1.5, -284], [hx + 14 - look * 2, -271], [16, -258], [21.5, -244], [20, -228], [13.5, -213],
      [13.5 + S(-180) + hs * 0.15, -180], [16 + S(-130) + hs * 0.35, -130], [18.5 + S(-80) + hs * 0.55, -80], [20.5 + S(-30) + hs * 0.75, -30],
      [23 + hs * 0.9, 4], [29 + hs, my - 14], [27 + hs + hs2, my + 6], [14 + hs + hs2 * 1.3, my + 17, 1],
    ];
    const Lh = [
      [-2 + hs + hs2, my + 14], [-17 + hs + hs2 * 0.5, my], [-20 + hs * 0.9, 4], [-18.5 + S(-30) + hs * 0.75, -30], [-16.5 + S(-80) + hs * 0.55, -80],
      [-14 + S(-130) + hs * 0.35, -130], [-12.5 + S(-180) + hs * 0.15, -180], [-13.5, -213], [-20, -228], [-21.5, -244], [-16, -258],
      [hx - 14, -271], [hx - 14.5, -284], [hx - 10, -294], [hx, -299],
    ];
    const hair = sp(R.concat(Lh), true);
    P.fill(hair, K.hair);
    if (P.hi) {
      const st = new Path2D();
      strands(P, st, crs(R.slice(7, 13), 3), 12, 9, 1.35, 3, P.lw * 0.42);
      strands(P, st, crs(Lh.slice(2, 8).reverse(), 3), 12, 9, 1.8, 5, P.lw * 0.42);
      strands(P, st, crs([R[12], R[13], R[14], Lh[0], Lh[1]], 3), 10, 7, 1.57, 9, P.lw * 0.42);
      // a few loose wisps escaping above the tie
      taperTo(st, crs([[19, -240], [23 + hs * 0.3, -222], [22 + hs * 0.5, -200]], 4), P.lw * 0.45, P.lw * 0.05, 0);
      taperTo(st, crs([[-19, -236], [-22 + hs * 0.3, -216], [-20 + hs * 0.5, -196]], 4), P.lw * 0.45, P.lw * 0.05, 0);
      P.strokes(st, 0.95, K.hair);
      const sh = new Path2D(); // hair sheen (hero scale only)
      for (let i = -2; i <= 2; i++) {
        taperTo(sh, crs([[hx + i * 3.5, -290], [i * 6, -246], [i * 2.2 + hs * 0.2, -200], [i * 3 + S(-110) + hs * 0.5, -110], [i * 4 + hs * 0.8, -10], [i * 4.5 + 4 + hs + hs2, my]], 5), P.lw * 0.32, P.lw * 0.08, 0.1);
      }
      if (P.s >= 1.2) P.strokes(sh, 0.22, K.sheen);
    }
    P.line(hair, 0.75);
    // 元結 white paper tie
    if (P.mid) {
      const ty = sp([[-13.6, -217, 1], [0, -218], [13.6, -217, 1], [13.4, -211, 1], [0, -212], [-13.4, -211, 1]], true);
      P.shape(ty, K.motoyui, 0.5, 0.8);
    }
  }

  /* ---- seated: formal seated mound of robes, hair pooling behind -- */
  function kaguyaSeated(ctx, P, o, K) {
    const t = o.t, w = P.wind;
    const L = K.kasane;
    const sw = swayFn(t, w, 1.4);
    const weep = o.pose === 'weep';
    const tr = o.train == null ? 1 : o.train;

    // 緋袴 showing at the front where the robes part
    const hk = sp([[40, -44], [70, -24], [96, -4], [104, 5, 1], [60, 8, 1], [36, -20]], true);
    P.shape(hk, K.hakama, 0.8);
    // robes: the great layered mound; kasane spread on the floor
    const robeAt = (e, E) => {
      const h = E - e;
      return sp([
        [6, -127], [-4, -124], [-14, -108], [-26, -80], [-38, -50], [-52, -24], [-70, -8], [-88 - e, -h * 0.4, 1],
        [-40, 4 - h * 0.7], [20, 7 - h * 0.8], [66, 5 - h * 0.7], [94 + e, -h * 0.5, 1],
        [84 + e * 0.6, -14], [70 + e * 0.3, -38], [56, -64], [42, -94], [30, -118], [20, -126],
      ], true);
    };
    kasane(P, L, robeAt);
    if (P.mid) P.folds([
      [[[-14, -88], [-34, -40], [-62, -4]], 0.8, 0.12],
      [[[-2, -40], [-10, -12], [-20, 6]], 0.6, 0.12],
      [[[70, -30], [74, -12], [72, 4]], 0.6, 0.12],
    ], 0.65);
    // karaginu
    const kara = sp([[6, -127], [-4, -124], [-12, -110], [-18, -92], [-22, -78, 1], [4, -72], [32, -74, 1], [31, -100], [28, -118], [20, -126]], true);
    P.fill(kara, P.pat('kikko', K.karaginuFg, K.karaginu, 7));
    P.line(kara);

    const SL = [K.karaginu].concat(L);
    // far sleeve resting on the lap (cuff toward +x)
    const farAt = (e) => sp([[36, -92], [66 + e, -84, 1], [72 + e, -44 + e * 0.2, 1], [52, -38], [36, -60]], true);
    kasane(P, SL, farAt);
    if (!weep) {
      // near sleeve lying over the lap
      const nearAt = (e) => sp([
        [-2, -123], [-12, -106], [-18, -84], [-22, -60], [-16, -40], [4, -30], [30, -30], [60 + e, -36 + e * 0.2, 1],
        [60 + e, -60], [58 + e, -82, 1], [42, -88], [24, -100], [8, -116],
      ], true);
      const sl = kasane(P, SL, nearAt, false, P.pat('kikko', K.karaginuFg, K.karaginu, 7));
      P.line(sl);
      if (P.mid) P.folds([[[[-8, -96], [-10, -64], [0, -36]], 0.8, 0.1], [[[20, -94], [28, -64], [34, -34]], 0.6, 0.1]], 0.7);
    } else {
      // the other sleeve rests in the lap
      const lapAt = (e) => sp([[-2, -123], [-12, -104], [-18, -80], [-14, -46], [10, -36], [44 + e, -42 + e * 0.2, 1], [44 + e, -66, 1], [26, -76], [10, -104]], true);
      const sl = kasane(P, SL, lapAt, false, P.pat('kikko', K.karaginuFg, K.karaginu, 7));
      P.line(sl);
    }
    // collar
    const cl = pickLayers([K.karaginu].concat(L, [K.kosode]), P.nb + 1);
    const n = cl.length;
    const cs = P.mid ? U.clamp(P.band * 0.6, 1.1, 1.8) : 2.2;
    for (let i = 0; i <= n; i++) {
      const e = (n - i) * cs;
      const v = sp([[13.5 - e * 0.95, -128 + e * 0.15, 1], [17.5 + e * 0.1, -120 + e * 1.05, 1], [21 + e * 0.6, -128 + e * 0.1, 1]], true);
      P.fill(v, i < n ? cl[i] : K.skin);
      if (i === 0) P.line(v, 0.7);
    }
    const bow = weep ? 0.5 : 0.08;
    const F = headAt(16, -141, bow);
    face(P, F[0], F[1], 21, 'q', 'lady', K.skin, 0.14 + bow);
    const hs = sw * 1.2, T = tr;
    ladyHairQ(P, 16, -141, K, [
      [1, -108], [-4, -96], [-12, -80], [-22, -62], [-36, -42], [-54, -22], [-80, -8], [-110 * T, -2], [-150 * T, 1],
    ], [
      [2, -130], [-5, -120], [-13, -104], [-23, -86], [-35, -62], [-50 + hs * 0.3, -38], [-72 + hs * 0.6, -18], [-100 * T + hs, -5],
      [-136 * T + hs, 3], [-170 * T + hs * 0.5, 5], [-188 * T, 3, 1],
    ], -96, bow);
    if (weep) weepSleeve(P, F[0], F[1], K, SL, sw);
  }

  /* ---- rise: ascending, robes and hair streaming downward --------- */
  /* anchor: body centre (waist). Head top ≈ −160, tails to ≈ +230.      */
  function kaguyaRise(ctx, P, o, K) {
    const t = o.t, w = 0.35 + P.wind * 0.65;
    const hago = o.robe === 'hagoromo';
    const L = hago ? [K.hago, K.hagoIn, U.mix(K.hago, K.hagoGold, 0.45), K.hagoGold] : K.kasane;
    const outerCol = hago ? K.hago : K.karaginu;
    // flow: a slow travelling wave growing toward the tails, all swept back (−x)
    const fl = (u, k) => w * (Math.sin(u * 3.0 - t * 1.2 + (k || 0)) * 9 + U.wobble(t * 0.4 + (k || 0), 17) * 5) * u - u * u * 34;
    ctx.rotate(o.lean == null ? 0.1 : o.lean);

    // hair: one long black stream behind, parting into two soft locks
    const hairBack = sp([
      [-10, -142], [-20, -124], [-26, -96], [-34, -40], [-44 + fl(0.3, 0.2), 30], [-56 + fl(0.55, 0.2), 100], [-58 + fl(0.8, 0.2), 170],
      [-66 + fl(1.05, 0.2), 246, 1], [-40 + fl(0.85, 0.9), 186], [-30 + fl(0.7, 0.9), 160], [-26 + fl(0.95, 1.2), 226, 1],
      [-8 + fl(0.7, 1.2), 150], [4 + fl(0.4, 1), 60], [18, -30], [18, -96], [15, -124], [8, -142],
    ], true);
    P.fill(hairBack, K.hair);
    if (P.hi && P.s >= 1.2) {
      const st = new Path2D();
      for (let i = 0; i < 3; i++) {
        const x = -30 + i * 10;
        taperTo(st, crs([[x * 0.7, 40], [x - 10 + fl(0.5, i), 100], [x - 20 + fl(0.8, i * 0.4), 160]], 4), P.lw * 0.35, P.lw * 0.05, 0);
      }
      P.strokes(st, 0.3, K.sheen);
    }
    P.line(hairBack, 0.7);

    // scarf behind the shoulders
    const sc = scarfPath(P, t, w, K);
    ribbons(P, sc.back, K.scarf, 0.6, 0.85);

    // skirt: the layered robes swept down into two long soft tails
    const skirt = (e) => sp([
      [-23, -44], [-31 - e * 0.4, 0], [-37 - e * 0.9 + fl(0.35, 0), 50], [-40 - e * 1.0 + fl(0.6, 0), 100], [-34 - e * 0.9 + fl(0.85, 0), 150],
      [-26 + fl(1, 0) - e * 0.6, 186 + e * 2.2, 1], [-14 + fl(0.8, 0.6), 150 - e * 0.3], [-2 + fl(0.7, 0.8), 126 - e * 0.5],
      [10 + fl(0.9, 1), 168], [20 + fl(1.08, 1.1) - e * 0.5, 216 + e * 2.4, 1], [30 + e * 0.8 + fl(0.9, 1.1), 170], [35 + e * 1.0 + fl(0.65, 1), 110],
      [34 + e * 0.9 + fl(0.4, 1), 50], [29 + e * 0.4, 0], [23, -44],
    ], true);
    const skOut = kasane(P, L, skirt, false, hago ? P.pat('seigaiha', U.mix(K.hago, K.hagoGold, 0.55), K.hago, 13) : null);
    P.line(skOut);
    if (P.mid) P.folds([
      [[[-10, -30], [-14 + fl(0.3, 0), 40], [-18 + fl(0.6, 0), 110], [-20 + fl(0.9, 0), 160]], 0.7, 0.1],
      [[[10, -26], [12 + fl(0.3, 1), 44], [16 + fl(0.7, 1), 120], [18 + fl(0.95, 1), 180]], 0.6, 0.1],
    ], 0.55);

    // sleeves: arms a little open; long sleeves flowing down into soft tails
    const SL = [outerCol].concat(L);
    for (const side of [-1, 1]) {
      const s = side, k = side > 0 ? 2 : 3.3;
      const at = (e) => sp([
        [s * 13, -116], [s * 30, -110], [s * 44, -92], [s * 54, -66, 1], [s * (58 + e * 0.6) + fl(0.3, k) * 0.6, -30],
        [s * (62 + e * 0.9) + fl(0.55, k), 20], [s * (58 + e * 0.8) + fl(0.8, k), 62], [s * 50 + fl(1, k), 100 + e * 2, 1],
        [s * (42 - e * 0.4) + fl(0.8, k), 58], [s * (32 - e * 0.3) + fl(0.5, k) * 0.7, 10], [s * 24, -40], [s * 20, -84],
      ], true);
      const out = kasane(P, SL, at, false, hago ? P.pat('seigaiha', U.mix(K.hago, K.hagoGold, 0.55), K.hago, 13) : null);
      P.line(out);
      if (P.mid) {
        const hd = sp([[s * 53, -68], [s * 60, -62], [s * 62, -52], [s * 57, -48], [s * 52, -56]], true);
        P.shape(hd, K.skin, 0.5, 0.7);
        P.folds([[[[s * 34, -90], [s * 42 + fl(0.2, k) * 0.5, -30], [s * 46 + fl(0.6, k), 40]], 0.6, 0.1]], 0.55);
      }
    }
    // body front
    const kara = sp([[-8, -120], [-18, -113], [-23, -84], [-25, -44, 1], [0, -38], [25, -44, 1], [23, -84], [18, -113], [8, -120]], true);
    P.shape(kara, outerCol);
    // collar
    const cl = pickLayers([outerCol].concat(L, [K.kosode]), P.nb + 1);
    const cs = P.mid ? U.clamp(P.band * 0.6, 1.1, 1.8) : 2.2;
    for (let i = 0; i <= cl.length; i++) {
      const e = (cl.length - i) * cs;
      const v = sp([[-3.5 - e * 0.8, -122 + e * 0.15, 1], [0.5, -114 + e * 1.0, 1], [4.5 + e * 0.8, -122 + e * 0.15, 1]], true);
      P.fill(v, i < cl.length ? cl[i] : K.skin);
      if (i === 0) P.line(v, 0.7);
    }
    // head: 3/4, gazing down toward the earth she leaves (o.look = 'up' to look ahead)
    const up = o.look === 'up';
    const F = [2, -136];
    face(P, F[0], F[1], 21, up ? 'up' : 'q', 'lady', K.skin, up ? -0.15 : 0.22);
    const x = F[0], y = F[1];
    const cap = sp([
      [x + 1, y - 11, 1], [x - 2, y - 8], [x - 4.5, y], [x - 6, y + 10], [x - 7, y + 22], [x - 11, y + 32, 1],
      [x - 17, y + 18], [x - 20, y + 3], [x - 19, y - 9], [x - 14, y - 18], [x - 6, y - 23], [x + 3, y - 24],
      [x + 9, y - 19], [x + 11, y - 11], [x + 11.5, y + 4], [x + 11, y + 16], [x + 14, y + 28, 1],
      [x + 15.5, y + 14], [x + 14.5, y - 2], [x + 12, y - 14], [x + 6, y - 10],
    ], true);
    P.shape(cap, K.hair, 0.55, 0.85);
    // scarf in front: over the forearms and sagging across the robes
    ribbons(P, sc.front, K.scarf, 0.6, 0.85);
    if (P.mid) P.strokes(sc.inner, 0.85, K.scarfIn);
  }

  /** 天の羽衣 scarf: loops behind the shoulders, over the forearms, ends streaming down. */
  function scarfPath(P, t, w, K) {
    const wv = (k) => w * (0.65 * Math.sin(t * 1.4 + k) + 0.35 * U.wobble(t * 0.55 + k, 23));
    const inner = new Path2D();
    const back = [[crs([[-50, -76], [-40, -106], [-18, -122], [16, -122], [40, -106], [52, -76]], 6), 7, 7, 0.2]];
    const endL = [[-50, -76], [-66 + wv(0) * 4, -36], [-74 + wv(0.7) * 10, 14], [-94 + wv(1.4) * 16, 74], [-114 + wv(2.1) * 22, 136], [-140 + wv(2.8) * 26, 186]];
    const endR = [[52, -76], [68 + wv(1) * 4, -40], [64 + wv(1.7) * 10, 12], [58 + wv(2.4) * 16, 70], [38 + wv(3.1) * 22, 126], [12 + wv(3.8) * 26, 174]];
    const sag = [[-58, -56], [-46 + wv(5) * 2, 20], [-14 + wv(5.5) * 4, 58], [30 + wv(6) * 3, 30], [60, -52]];
    const front = [[crs(endL, 4), 10, 2, 0.3], [crs(endR, 4), 10, 2, 0.3], [crs(sag, 5), 5.5, 5.5, 0.2]];
    if (P.mid) {
      taperTo(inner, crs(endL.slice(1), 5), 3.2, 0.4, 0);
      taperTo(inner, crs(endR.slice(1), 5), 3.2, 0.4, 0);
    }
    return { back, front, inner };
  }

  /* ---- baby: tiny glowing girl in a cut bamboo node ---------------- */
  /* anchor: foot of the bamboo stalk. At scale 1 the stalk is ~160 tall
     and the girl ~30. opts.glow 0..1, opts.stalk (default true).        */
  function kaguyaBaby(ctx, P, o, K) {
    const g = o.glow == null ? 1 : o.glow;
    const t = o.t;
    const R = 22, top = -150, tilt = -0.28, ry = 6.5;
    const pulse = 0.88 + 0.12 * Math.sin(t * 1.6);
    const stalk = o.stalk !== false;
    const ex = (a) => [Math.cos(a) * R * Math.cos(tilt) - Math.sin(a) * ry * Math.sin(tilt), top + Math.cos(a) * R * Math.sin(tilt) + Math.sin(a) * ry * Math.cos(tilt)];
    if (g > 0 && P.fx) {
      const gr = ctx.createRadialGradient(0, top - 14, 3, 0, top - 14, 130);
      gr.addColorStop(0, U.rgba(K.glow, 0.7 * g * pulse));
      gr.addColorStop(0.3, U.rgba(K.glow, 0.24 * g * pulse));
      gr.addColorStop(1, U.rgba(K.glow, 0));
      ctx.fillStyle = gr;
      ctx.fillRect(-130, top - 144, 260, 260);
    }
    if (stalk) {
      // hollow interior (back wall), lit from within
      const hol = new Path2D();
      hol.ellipse(0, top, R, ry, tilt, 0, TAU);
      P.fill(hol, U.mix(K.bambooIn, K.glow, 0.6 * g));
    }
    // the girl: seated, hands in her sleeves, rising from the hollow
    const bx = 1, by = top + 2;
    const hairB = sp([[bx - 4, by - 30], [bx - 9, by - 22], [bx - 10, by - 6], [bx - 6, by + 2], [bx - 2, by - 14]], true);
    P.fill(hairB, K.hair);
    const body = sp([[bx - 10, by + 4], [bx - 10, by - 10], [bx - 5, by - 19], [bx + 5, by - 19], [bx + 10, by - 10], [bx + 11, by + 4]], true);
    P.shape(body, K.kasane[2], 0.6);
    const slv = sp([[bx - 3, by - 13], [bx + 9, by - 11], [bx + 12, by - 3], [bx + 11, by + 3], [bx - 4, by + 2]], true);
    P.shape(slv, K.karaginu, 0.6);
    if (P.mid) {
      const cf = new Path2D();
      taperTo(cf, [[bx + 11.5, by - 4], [bx + 11, by + 2.5]], 1.6, 1.6, 0);
      P.fill(cf, K.kasane[5]);
    }
    const col = sp([[bx - 2.5, by - 19, 1], [bx + 0.5, by - 14, 1], [bx + 3.5, by - 19, 1]], true);
    P.fill(col, K.kosode);
    face(P, bx + 1.5, by - 25, 9, 'q', 'child', K.skin, 0.1);
    const hair = sp([[bx + 2.5, by - 29.5, 1], [bx - 0.5, by - 28], [bx - 2, by - 23], [bx - 2.5, by - 17], [bx - 6, by - 14], [bx - 7, by - 24], [bx - 5, by - 30], [bx + 1, by - 32], [bx + 5.5, by - 30], [bx + 6, by - 26]], true);
    P.shape(hair, K.hair, 0.45, 0.8);
    if (stalk) {
      // front wall of the stalk hides her lap; the cut rim drawn over
      const front = new Path2D();
      front.moveTo(-R, 0);
      const e0 = ex(Math.PI);
      front.lineTo(e0[0], e0[1]);
      for (let i = 1; i <= 12; i++) { const p = ex(Math.PI - (i / 12) * Math.PI); front.lineTo(p[0], p[1]); }
      front.lineTo(R, 0);
      front.closePath();
      if (P.sil) P.fill(front, K.bamboo);
      else {
        const gr = ctx.createLinearGradient(-R, 0, R, 0);
        gr.addColorStop(0, U.mix(K.bamboo, K.bambooDark, 0.4));
        gr.addColorStop(0.3, K.bamboo);
        gr.addColorStop(0.75, U.mix(K.bamboo, K.glow, 0.18 * g));
        gr.addColorStop(1, U.mix(K.bamboo, K.bambooDark, 0.6));
        P.fill(front, gr);
      }
      if (P.mid) {
        const nd = new Path2D();
        for (const ny of [-40, -104]) {
          taperTo(nd, [[-R, ny - 1], [0, ny + 2.5], [R, ny - 1]], 2.6, 2.6, 0);
        }
        P.strokes(nd, 0.75, K.bambooDark);
        const hl = new Path2D();
        for (const [y0, y1] of [[-4, -36], [-46, -100], [-110, -146]]) taperTo(hl, [[-R * 0.5, y0], [-R * 0.5, y1]], 2.4, 1.2, 0);
        P.strokes(hl, 0.35, C.gofun);
        // a sprig of leaves from the lower node
        const lp = new Path2D();
        taperTo(lp, [[-R + 1, -42], [-R - 14, -52], [-R - 30, -58]], 2.2, 1, 0);
        const leaf = (lx, ly, a, len, wd) => {
          const c = Math.cos(a), s = Math.sin(a);
          lp.moveTo(lx, ly);
          lp.quadraticCurveTo(lx + c * len * 0.35 - s * wd, ly + s * len * 0.35 + c * wd, lx + c * len, ly + s * len);
          lp.quadraticCurveTo(lx + c * len * 0.35 + s * wd * 0.9, ly + s * len * 0.35 - c * wd * 0.9, lx, ly);
        };
        leaf(-R - 30, -58, 2.75, 34, 6.5);
        leaf(-R - 26, -57, 2.2, 30, 6);
        leaf(-R - 14, -52, 1.95, 26, 5.5);
        P.shape(lp, K.bamboo, 0.55);
      }
      P.line(front);
      const rim = new Path2D();
      rim.ellipse(0, top, R, ry, tilt, 0, TAU);
      P.line(rim, 0.8);
    }
    // sparkles (kira)
    if (g > 0.05 && P.fx && P.mid) {
      ctx.fillStyle = U.rgba(C.gofun, 0.95 * g);
      for (let i = 0; i < 10; i++) {
        const tw = Math.max(0, Math.sin(t * 1.9 + i * 1.7));
        if (tw < 0.15) continue;
        const a = i * 2.39996 + t * 0.25, r = 26 + 34 * U.hash(i + 3);
        const sx = Math.cos(a) * r, sy = top - 20 + Math.sin(a) * r * 0.75, ss = 2.2 * tw;
        ctx.beginPath();
        ctx.moveTo(sx, sy - ss * 2.2); ctx.lineTo(sx + ss * 0.4, sy); ctx.lineTo(sx, sy + ss * 2.2); ctx.lineTo(sx - ss * 0.4, sy); ctx.closePath();
        ctx.moveTo(sx - ss * 2.2, sy); ctx.lineTo(sx, sy - ss * 0.4); ctx.lineTo(sx + ss * 2.2, sy); ctx.lineTo(sx, sy + ss * 0.4); ctx.closePath();
        ctx.fill();
      }
    }
  }

  define('kaguya', {
    poses: ['stand', 'back', 'seated', 'weep', 'rise', 'baby'],
    defaults: {},
    bounds(pose, o) {
      const tr = o.train == null ? 1 : o.train;
      if (pose === 'back') return [-125, -308, 250, 348 + 30 * tr];
      if (pose === 'seated' || (pose === 'weep' && !o.stand)) return [-230 * tr - 10, -170, 240 + 230 * tr, 184];
      if (pose === 'rise') return [-205, -178, 360, 448];
      if (pose === 'baby') return [-135, -300, 270, 305];
      return [-200 - 110 * (tr - 1), -305, 260 + 110 * tr, 312];
    },
    draw(ctx, P, o) {
      const K = pal(KAGUYA, o);
      const p = o.pose;
      if (p === 'back') kaguyaBack(ctx, P, o, K);
      else if (p === 'seated' || (p === 'weep' && !o.stand)) kaguyaSeated(ctx, P, o, K);
      else if (p === 'rise') kaguyaRise(ctx, P, o, K);
      else if (p === 'baby') kaguyaBaby(ctx, P, o, K);
      else kaguyaStand(ctx, P, o, K);
    },
  });

  /* ================================================================== */
  /* the rig: joints from angles (commoners, guards, the emperor)       */
  /* limbs: angle 0 = hanging straight down, + swings toward +x.        */
  /* spine: 0 = upright, + leans toward +x.  y up is negative.          */
  /* ================================================================== */
  const dDown = (a) => [Math.sin(a), Math.cos(a)];
  const dUp = (a) => [Math.sin(a), -Math.cos(a)];
  const add = (p, d, l) => [p[0] + d[0] * l, p[1] + d[1] * l];
  const nrmF = (s) => [Math.cos(s), Math.sin(s)]; // forward normal of a spine at angle s

  function rigAt(q, D, hip) {
    const s1 = q.spine || 0, s2 = s1 + (q.hunch || 0);
    const mid = add(hip, dUp(s1), D.torso * 0.5);
    const neck = add(mid, dUp(s2), D.torso * 0.5);
    const sh = add(mid, dUp(s2), D.torso * 0.34);
    const head = add(neck, dUp(s2 + (q.neck || 0) * 0.6), D.neck);
    const arm = (a, dx, tgt) => {
      const s = [sh[0] + dx, sh[1]];
      if (tgt) a = ik(s, tgt, D.upper, D.fore, a && a.bend ? a.bend : 1);
      const el = add(s, dDown(a[0]), D.upper);
      return [s, el, add(el, dDown(a[1]), D.fore)];
    };
    // hand-to-face target (weeping): a point on the face in the head frame
    const ha = s2 * 0.6 + (q.neck || 0);
    let faceT = q.toFace ? [head[0] + Math.cos(ha) * 9 - Math.sin(ha) * 1, head[1] + Math.sin(ha) * 9 + Math.cos(ha) * 1] : null;
    if (q.reachN) faceT = [sh[0] + q.reachN[0], sh[1] + q.reachN[1]]; // IK target relative to the shoulder
    const leg = (a, dx) => {
      const h = [hip[0] + dx, hip[1]];
      const kn = add(h, dDown(a[0]), D.thigh);
      return [h, kn, add(kn, dDown(a[1]), D.shin)];
    };
    return {
      hip, mid, neck, sh, head, s1, s2, q,
      armN: arm(q.armN, 2, faceT), armF: arm(q.armF, -3, q.reachF ? [sh[0] + q.reachF[0], sh[1] + q.reachF[1]] : null), legN: leg(q.legN, 2), legF: leg(q.legF, -3),
    };
  }
  /** Two-bone IK: angles [upper, fore] reaching from s to target; bend ±1 picks the elbow side. */
  function ik(s, tg, L1, L2, bend) {
    const dx = tg[0] - s[0], dy = tg[1] - s[1];
    const d = U.clamp(Math.hypot(dx, dy), Math.abs(L1 - L2) + 0.01, L1 + L2 - 0.01);
    const base = Math.atan2(dx, dy);
    const al = Math.acos(U.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const a1 = base + bend * al;
    const el = [s[0] + Math.sin(a1) * L1, s[1] + Math.cos(a1) * L1];
    return [a1, Math.atan2(tg[0] - el[0], tg[1] - el[1])];
  }
  /** Build a rig and drop it onto the ground (y = 0 at the lowest contact). */
  function rig(q, D) {
    const J0 = rigAt(q, D, [0, 0]);
    let low = Math.max(J0.legN[2][1], J0.legF[2][1]) + (D.sole || 7);
    if (q.kneel) low = Math.max(low, J0.legN[1][1] + D.knee, J0.legF[1][1] + D.knee);
    const J = rigAt(q, D, [q.x || 0, -low]);
    return J;
  }
  /** Tube along a joint chain (limb, sleeve) into a Path2D. */
  const tube = (pts, w0, w1, belly) => taperTo(new Path2D(), crs(pts, 5), w0, w1, belly || 0);

  const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };

  /**
   * Kimono sleeve along an arm chain [shoulder, elbow, wrist]: a flat cloth
   * flap — thin arm, cuff, and the sleeve bag hanging below the forearm.
   * When the forearm is raised the sleeve slides back to the elbow and
   * returns { bare: true } so the caller draws a bare forearm.
   */
  function sleevePath(arm, w, depth, noSlide) {
    const [s, e, h] = arm;
    const u1 = unit(s, e), u2 = unit(e, h);
    let n1 = [-u1[1], u1[0]], n2 = [-u2[1], u2[0]];
    const sg = n2[1] + n1[1] * 0.5 >= 0 ? 1 : -1;
    n1 = [n1[0] * sg, n1[1] * sg]; n2 = [n2[0] * sg, n2[1] * sg];
    const nm = unit([0, 0], [n1[0] + n2[0], n1[1] + n2[1]]);
    const P_ = (p, n, k) => [p[0] + n[0] * k, p[1] + n[1] * k];
    const raised = u2[1] < -0.45 && !noSlide;
    if (raised) {
      // sleeve slid down onto the upper arm; the bag hangs from the elbow
      const low = Math.max(s[1], e[1]) + depth * 0.55;
      const c1 = P_(e, n1, -w * 0.48), c2 = P_(e, n1, w * 0.5);
      return {
        bare: true,
        path: sp([P_(s, n1, -w * 0.55), [c1[0], c1[1], 1], [c2[0], c2[1], 1], [c2[0] + n1[0] * 3, low - 4], [(c2[0] + s[0]) / 2 + n1[0] * 4, low, 1], P_(s, n1, w * 0.5)], true),
      };
    }
    const cw = w * 0.55;
    const cA = P_(h, n2, -cw), cB = P_(h, n2, cw);
    const bot = Math.max(e[1], h[1]) + depth;
    const back = P_(e, nm, w * 0.5);
    const pts = [
      P_(s, n1, -w * 0.5), P_(e, nm, -w * 0.5), [cA[0], cA[1], 1], [cB[0], cB[1], 1],
      [cB[0] - u2[0] * 1.5, Math.max(cB[1] + 2, bot - 3)], [cB[0] - u2[0] * 6, bot, 1],
      [back[0] - u2[0] * 4, bot - 1], [back[0] - u2[0] * 2, Math.max(back[1], bot - depth * 0.45)],
      back, P_(s, n1, w * 0.5),
    ];
    return { bare: false, path: sp(pts, true) };
  }
  /** Small hand at the wrist, pointing along the forearm (a fist when grip). */
  function handPath(arm, len, grip) {
    const [, e, h] = arm;
    const a = Math.atan2(h[1] - e[1], h[0] - e[0]);
    const c = Math.cos(a), s = Math.sin(a);
    const L = grip ? len * 0.62 : len;
    const p = new Path2D();
    p.ellipse(h[0] + c * L * 0.42, h[1] + s * L * 0.42, L * 0.52, len * 0.27, a, 0, TAU);
    if (!grip) p.ellipse(h[0] + c * L * 0.2 - s * len * 0.25, h[1] + s * L * 0.2 + c * len * 0.25, len * 0.22, len * 0.12, a + 0.6, 0, TAU);
    return p;
  }
  /** Bare foot on a straw sandal at an ankle; dir 1 = toes toward +x. */
  function footPath(an, len, dir, gy) {
    const p = new Path2D();
    const y = gy == null ? an[1] + 6 : gy;
    p.moveTo(an[0] - len * 0.28 * dir, y);
    p.bezierCurveTo(an[0] - len * 0.32 * dir, an[1] - 1, an[0] - len * 0.05 * dir, an[1] - 3.5, an[0] + len * 0.12 * dir, an[1] - 2);
    p.bezierCurveTo(an[0] + len * 0.45 * dir, y - 4.5, an[0] + len * 0.72 * dir, y - 3.2, an[0] + len * 0.74 * dir, y);
    p.closePath();
    return p;
  }

  /**
   * Heads for the commoners and warriors: one profile silhouette toward +x
   * (forehead, nose, mouth, chin) in a local frame at (x,y) = skull centre,
   * rotated by a (+ = bowing, − = looking up).
   * style: 'okina' | 'ouna' | 'boy' | 'girl' | 'man'
   */
  const PROFILES = {
    okina: [[-1, -13], [5, -11.5], [8.6, -8], [10, -4], [10.2, -2], [11.5, 1], [14.6, 4.6, 1], [11.6, 6], [11.8, 7.4], [10.6, 9], [11.4, 11], [9, 13.4], [4, 14], [0, 12.5], [-7, 11], [-12, 4], [-12.5, -4], [-9, -10.5]],
    ouna: [[-1, -13], [5, -11.5], [8.4, -8], [9.6, -4], [9.8, -2], [11, 1], [13.4, 4.4, 1], [11, 5.8], [11.2, 7.2], [10.2, 8.8], [10.8, 10.8], [8.5, 13], [4, 13.6], [0, 12], [-7, 11], [-12, 4], [-12.5, -4], [-9, -10.5]],
    man: [[-1, -13], [5, -11.5], [8.8, -8], [10.4, -4], [10.4, -1.5], [11.8, 1.5], [14, 4.4, 1], [11.6, 5.8], [12, 7.4], [11.2, 8.8], [11.8, 11], [9.4, 13.6], [4, 14.2], [0, 12.5], [-7, 11], [-12, 4], [-12.5, -4], [-9, -10.5]],
    boy: [[-1, -14], [6, -12], [9.5, -7], [10.6, -3], [11, 0], [12.6, 2.6, 1], [10.8, 4], [11, 5.6], [10.2, 7.2], [10.2, 9.6], [6, 12.8], [0, 12], [-8, 10], [-13, 2], [-13, -6], [-9, -12]],
  };
  PROFILES.girl = PROFILES.boy;
  function head(P, x, y, a, K, style, o) {
    const ctx = P.ctx;
    o = o || {};
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    const prof = sp(PROFILES[style] || (style === 'take' ? PROFILES.ouna : PROFILES.man), true);
    // hair behind the head (women, children)
    if (style === 'ouna') {
      const tail = sp([[-11, 7], [-16, 12], [-19, 24], [-15, 28], [-10, 19], [-7, 11]], true);
      P.shape(tail, K.hair, 0.5, 0.8);
      if (P.mid) {
        const tie = new Path2D();
        taperTo(tie, [[-17, 13.5], [-10, 12.5]], 2.6, 2.6, 0);
        P.fill(tie, K.tie || C.gofun);
      }
    }
    P.fill(prof, K.skin);
    P.line(prof, 0.6, 0.85);
    const kid = style === 'boy' || style === 'girl';
    if (P.mid) {
      const L = new Path2D();
      const fw = Math.max(P.lw * 0.45, 0.6 * P.inv);
      const cry = o.cry;
      // eye: a single line (closed/squinting when old or crying)
      if (kid) {
        if (cry) taperTo(L, [[5.8, -1.5], [7.6, -0.4], [9.4, -1.6]], fw, fw, 0.3);
        else { L.moveTo(8.4, -1); L.ellipse(7.9, -1, 1.3, 1.5, 0, 0, TAU); }
      } else if (style === 'take') taperTo(L, [[5.6, -1.4], [7.5, -0.2], [9.3, -0.9]], fw * 1.5, fw * 0.7, 0.3); // closed eye
      else taperTo(L, [[6.2, -1.2], [7.8, -0.4], [9.4, -0.9]], fw * 1.3, fw * 0.8, 0.2);
      if (style === 'okina' || style === 'ouna') {
        taperTo(L, [[3.5, -7], [6, -7.6], [8.4, -6.8]], fw * 0.6, fw * 0.4, 0);
        taperTo(L, [[7.4, 3.6], [8.6, 6.2], [8.6, 9]], fw * 0.8, fw * 0.3, 0);
        taperTo(L, [[5.4, 0.8], [6.6, 1.8]], fw * 0.5, fw * 0.3, 0);
      }
      if (style === 'take') { P.strokes(L, 0.85); ctx.restore(); takeHair(P, x, y, a, K); return; }
      // ear
      L.moveTo(-1, -1.5);
      L.bezierCurveTo(-4.5, -3, -5, 4.5, -1.2, 4);
      P.strokes(L, 0.85);
      const ear = new Path2D();
      ear.moveTo(-1, -1.5); ear.bezierCurveTo(-4.5, -3, -5, 4.5, -1.2, 4); ear.closePath();
      P.fill(ear, U.shade(K.skin, 0.95));
      P.line(ear, 0.4, 0.8);
      // mouth
      if (o.cry && kid) {
        const m = new Path2D();
        m.ellipse(9.4, 7.2, 1.6, 1.5, 0, 0, TAU);
        P.fill(m, C.enji);
      } else if (style !== 'okina') {
        const m = new Path2D();
        m.ellipse(10.6, 7, 0.9, 0.55, 0, 0, TAU);
        P.fill(m, style === 'ouna' ? C.enji : C.beni);
      }
      if (o.cry && kid) {
        const tr = new Path2D();
        taperTo(tr, [[7.5, 1], [7.2, 4], [7.6, 6]], 1.4, 0.4, 0);
        P.fill(tr, C.kamenozoki);
      }
    }
    if (style === 'okina') {
      const hr = sp([[3, -7], [-2, -9.5], [-8, -9], [-12.2, -3], [-12.6, 4], [-8, 10.6], [-5, 9], [-4.6, 4], [-4, -2], [0, -5.5]], true);
      P.shape(hr, K.hair, 0.45, 0.75);
      const knot = sp([[-5, -11.5], [-2.5, -15.5], [-8, -17.5], [-12, -14], [-9.5, -10]], true);
      P.shape(knot, K.hair, 0.45, 0.8);
      const bd = new Path2D();
      const sw = Math.sin((o.t || 0) * 1.1) * 1.2 * (o.wind == null ? 0.3 : o.wind + 0.2);
      taperTo(bd, crs([[10.5, 10.5], [10 + sw * 0.3, 20], [8 + sw, 33]], 4), 4.2, 0.5, 0.2);
      taperTo(bd, crs([[7, 13], [5.8 + sw * 0.3, 21], [4 + sw, 29]], 4), 3.2, 0.5, 0.2);
      taperTo(bd, crs([[12, 6], [14.6, 8.6], [15.2, 12]], 3), 2, 0.6, 0);
      taperTo(bd, [[4.5, -4.8], [8, -5.6], [11.2, -3.6]], 2.4, 1.2, 0);
      P.fill(bd, K.hair);
      P.line(bd, 0.3, 0.5);
    } else if (style === 'take') {
      ctx.restore();
      takeHair(P, x, y, a, K);
      return;
    } else if (style === 'ouna') {
      const hr = sp([[5.5, -9], [1, -12.5], [-7, -13], [-12.6, -6], [-13.2, 3], [-10, 10.5], [-5.5, 10.5], [-4.6, 4], [-3.4, -2.5], [1, -6.5]], true);
      P.shape(hr, K.hair, 0.5, 0.8);
      if (P.hi) P.folds([[[[3, -9], [-4, -9], [-9, -4]], 0.4, 0.1], [[[1, -11], [-7, -10], [-11, -2]], 0.4, 0.1]], 0.45);
    } else if (style === 'girl') {
      const hr = sp([[9, -8], [5, -13.5], [-5, -15], [-13, -9], [-15.5, 1], [-14, 11], [-6, 12.5], [-5.5, 4], [-3, -2.5], [2, -5], [8.5, -4.5, 1]], true);
      P.shape(hr, K.hair, 0.55, 0.85);
    } else if (style === 'boy') {
      const tuft = sp([[-3, -13.5], [0, -16.5], [-7, -18], [-10, -12.5]], true);
      P.shape(tuft, K.hair, 0.5, 0.8);
      const side = sp([[-7, -3.5], [-12.5, -5], [-14, 3], [-9, 6]], true);
      P.shape(side, K.hair, 0.5, 0.8);
    } else {
      const hr = sp([[4, -8.5], [-1, -11.5], [-9, -11], [-13, -4], [-12.8, 5], [-8, 10.8], [-5, 9.5], [-4.5, 3], [-3.5, -3], [1, -6.5]], true);
      P.shape(hr, K.hair, 0.5, 0.8);
    }
    ctx.restore();
  }

  /**
   * A figure in kimono on a rig. G: garment spec
   *   { kimono, lining, obi, pants, sandal, feet, hem (length below hip along the thigh),
   *     sleeveDepth, long (robe to the floor), width, pattern:[name, fg, size, alpha] }
   */
  function kimonoBody(P, J, K, G, t) {
    const fw = G.width || 1;
    const drawLeg = (leg, far) => {
      const [hp, kn, an] = leg;
      if (!G.long) {
        const p = tube([hp, kn, an], 15 * fw, 7.5, 0.1);
        P.shape(p, far ? U.shade(G.pants, 0.88) : G.pants, 0.9);
      }
      const kneelFoot = J.q.kneel;
      const f = kneelFoot ? footPath(an, 19 * (G.footK || 1), -1, an[1] + 5.5) : footPath(an, 19 * (G.footK || 1), 1, an[1] + 6);
      P.shape(f, G.feet || (far ? U.shade(K.skin, 0.93) : K.skin), 0.65);
      if (G.sandal && P.mid) {
        const so = new Path2D();
        if (kneelFoot) so.rect(an[0] - 16, an[1] + 5, 18, 2.2);
        else so.rect(an[0] - 6, an[1] + 6, 21, 2.3);
        P.shape(so, G.sandal, 0.45);
        if (!kneelFoot) {
          const st = new Path2D();
          taperTo(st, [[an[0] + 5, an[1] + 6], [an[0] + 1, an[1] + 1]], 1.3, 1.3, 0);
          P.fill(st, U.shade(G.sandal, 0.7));
        }
      }
    };
    const drawArm = (arm, far) => {
      const sl = sleevePath(arm, (G.sleeveW || 12.5) * fw, G.sleeveDepth || 12, far ? G.noSlideF : G.noSlideN);
      if (sl.bare) {
        const fa = tube([arm[1], arm[2]], 6.5, 5, 0);
        P.shape(fa, far ? U.shade(K.skin, 0.93) : K.skin, 0.7);
      }
      const sc = G.sleeveCol || G.kimono;
      P.shape(sl.path, far ? U.shade(sc, 0.86) : G.sleeveFill || sc, 0.95);
      if (!G.noHands) P.shape(handPath(arm, 10, !arm.open), far ? U.shade(K.skin, 0.93) : K.skin, 0.6);
    };
    drawArm(J.armF, true);
    drawLeg(J.legF, true);
    drawLeg(J.legN, false);
    // torso (kimono body)
    const n1 = nrmF(J.s1), n2 = nrmF(J.s2);
    const off = (p, n, k) => [p[0] + n[0] * k, p[1] + n[1] * k];
    const hemL = G.hem || 60;
    const td = (leg) => unit(leg[0], leg[1]);
    const dn = td(J.legN), df = td(J.legF);
    let hb, hf, hm, xf = [];
    if (G.long && J.q.kneel) {
      const kn = J.legN[1][0] > J.legF[1][0] ? J.legN[1] : J.legF[1];
      const bx = Math.min(J.legN[2][0], J.legF[2][0], J.hip[0]) - 12;
      hb = [bx, -1];
      hf = [kn[0] + 9, -1];
      hm = [(bx + kn[0]) / 2, 1.5];
      xf = [[kn[0] + 4, kn[1] - 10], lerpPt(off(J.hip, n1, 15 * fw), [kn[0], kn[1] - 12], 0.5)];
    } else if (G.long) {
      const fx = Math.max(J.legN[2][0], J.legF[2][0]), bxx = Math.min(J.legN[2][0], J.legF[2][0]);
      hb = [Math.min(J.hip[0] - 24 * fw, bxx - 10) - Math.max(0, -J.s1) * 20, -1];
      hf = [Math.max(J.hip[0] + 22 * fw, fx + 12), -1];
      hm = [(hb[0] + hf[0]) / 2, 1.5];
    } else {
      const bk = df[0] < dn[0] ? df : dn, fr = df[0] < dn[0] ? dn : df;
      hb = off(add(J.hip, bk, hemL), n1, -14 * fw);
      hf = off(add(J.hip, fr, hemL), n1, 13 * fw);
      hm = add(J.hip, [(dn[0] + df[0]) / 2, (dn[1] + df[1]) / 2], hemL + 2);
    }
    const body = sp([
      off(J.neck, n2, -7), off(J.sh, n2, -14 * fw), off(J.mid, n1, -15 * fw), off(J.hip, n1, -16 * fw),
      [hb[0], hb[1], 1], hm, [hf[0], hf[1], 1],
    ].concat(xf, [
      off(J.hip, n1, 15 * fw), off(J.mid, n1, 14 * fw), off(J.sh, n2, 12.5 * fw), off(J.neck, n2, 5.5),
    ]), true);
    P.fill(body, G.bodyFill || (G.pattern ? P.pat(G.pattern[0], G.pattern[1], G.kimono, G.pattern[2], G.pattern[3]) : G.kimono));
    P.line(body);
    // collar band crossing to the obi
    const ob = lerpPt(J.hip, J.mid, G.obiAt == null ? 0.3 : G.obiAt);
    const eri = new Path2D();
    if (G.shortCollar) taperTo(eri, crs([off(J.neck, n2, -4.5), off(J.neck, n2, 2.5), off(lerpPt(J.neck, J.mid, 0.45), n2, 8.5)], 4), 4, 1.2, 0);
    else taperTo(eri, crs([off(J.neck, n2, -4.5), off(J.neck, n2, 2.5), off(lerpPt(J.sh, J.mid, 0.4), n2, 8.5), off(ob, n1, 6)], 4), 4.2, 2.6, 0);
    P.fill(eri, G.lining);
    if (P.mid) P.line(eri, 0.4, 0.6);
    if (G.seatDrape) {
      // seated on a ledge: the kimono falls from the knees to the ankles as one drape
      const kn = J.legN[1], an = J.legN[2], kf = J.legF[1];
      const dr = sp([[Math.min(kn[0], kf[0]) - 14, kn[1] - 6], [kn[0] + 12, kn[1] - 8], [kn[0] + 14, kn[1] + 10], [an[0] + 11, an[1] - 2, 1], [an[0] - 13, an[1] - 1, 1], [Math.min(kn[0], kf[0]) - 12, kn[1] + 14]], true);
      P.fill(dr, G.bodyFill || G.kimono);
      P.line(dr);
    }
    const obi = new Path2D();
    taperTo(obi, [off(ob, n1, -15.5 * fw), off(ob, n1, 14.5 * fw)], G.obiW || 8.5, G.obiW || 8.5, 0);
    P.shape(obi, G.obi, 0.6);
    if (G.obiage) {
      // 帯揚げ: a bright band along the top of the obi (kept ≥ 1.4 px so it survives at tiny sizes)
      const oa = new Path2D();
      const wv = Math.max(2.2, 1.4 * P.inv);
      const up = (G.obiW || 8.5) / 2 + wv * 0.35;
      taperTo(oa, [off(off(ob, n1, -13 * fw), n2, 0), off(off(ob, n1, 13.5 * fw), n2, 0)].map((p) => [p[0] - n1[1] * -up, p[1] - up * n1[0]]), wv, wv, 0);
      P.fill(oa, G.obiage);
    }
    if (G.obijime && P.mid) {
      const oj = new Path2D();
      taperTo(oj, [off(ob, n1, 2 * fw), off(ob, n1, 15 * fw)], 1.6, 1.6, 0);
      P.fill(oj, G.obijime);
    }
    if (G.haori) {
      // 羽織: over the kimono, open at the front so the obi shows, to mid-thigh
      const len = G.haori.len || 36;
      const back = df[0] < dn[0] ? df : dn, front = df[0] < dn[0] ? dn : df;
      const hbk = off(add(J.hip, back, len * 0.7), n1, -17 * fw);
      const hfr = off(add(J.hip, front, len), n1, 9 * fw);
      const hr = sp([
        off(J.neck, n2, -8.5), off(J.sh, n2, -15.5 * fw), off(J.mid, n1, -16.8 * fw), off(J.hip, n1, -18 * fw), [hbk[0], hbk[1], 1],
        lerpPt(hbk, hfr, 0.5), [hfr[0], hfr[1], 1], off(J.hip, n1, 9.5 * fw), off(J.mid, n1, 8.5 * fw), off(J.sh, n2, 7.5 * fw), off(J.neck, n2, 1),
      ], true);
      P.fill(hr, G.haori.fill || G.haori.col);
      P.line(hr);
      if (P.mid) P.folds([[[off(J.sh, n2, -4), off(J.mid, n1, -6), lerpPt(off(J.hip, n1, -6), hbk, 0.8)], 0.6, 0.15]], 0.6);
      if (G.specks) {
        const s1 = new Path2D();
        for (const [u, v] of [[0.3, -0.5], [0.55, 0.3], [0.75, -0.3], [0.45, -0.1]]) {
          const pc = lerpPt(J.hip, J.neck, u);
          const pp = off(pc, n1, v * 14);
          s1.moveTo(pp[0] + 2.4, pp[1]);
          s1.ellipse(pp[0], pp[1], 2.4, 1.5, -0.4, 0, TAU);
        }
        P.flat(s1, G.specks);
      }
    }
    if (P.mid) P.folds([
      [[off(J.hip, n1, -3), lerpPt(off(J.hip, n1, -5), hb, 0.6), lerpPt(off(J.hip, n1, -5), hb, 0.96)], 0.7, 0.2],
      [[off(J.hip, n1, 6), lerpPt(off(J.hip, n1, 6), hf, 0.7)], 0.5, 0.15],
    ], 0.7);
    if (!G.skipArmN) drawArm(J.armN, false);
    return { body, ob };
  }

  /** たけ's hair: drawn back from the brow into a low 銀鼠 bun with a 煤竹 comb. */
  function takeHair(P, x, y, a, K) {
    const ctx = P.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    const hr = sp([[6.5, -9], [1.5, -12.8], [-6.5, -13.4], [-12.4, -7.5], [-13.8, 0.5], [-11.5, 7.5], [-7, 9.5], [-4.8, 4], [-3.6, -2.6], [1.2, -6.8]], true);
    P.shape(hr, K.hair, 0.5, 0.8);
    const bun = new Path2D();
    bun.ellipse(-13.2, 7.2, 6.6, 5.6, 0.35, 0, TAU);
    P.shape(bun, K.hair, 0.5, 0.8);
    if (P.mid) {
      const comb = new Path2D();
      taperTo(comb, crs([[-19.2, 3.8], [-15.2, 0.9], [-10.4, 1.6]], 3), 2.6, 2.2, 0.1);
      P.shape(comb, K.comb, 0.35, 0.8);
      if (P.hi) P.folds([[[[3, -10.5], [-4, -10.6], [-10, -5]], 0.35, 0.1], [[[0, -8], [-7, -7], [-11, 1]], 0.35, 0.1], [[[-15, 5], [-12.5, 9], [-9, 10]], 0.3, 0.1]], 0.5);
    }
    ctx.restore();
  }

  /* ================================================================== */
  /* たけ — the grandmother  ·  oldSayo — 小夜 at 66 (the same path)     */
  /* ================================================================== */
  const GRANDMA = {
    skin: U.mix(C.gofun, C.kitsune, 0.22),
    hair: C.ginnezu,
    comb: U.mix(C.odo, C.sumi, 0.55),        // 煤竹
    kimono: C.kon,
    stripe: C.nezumi,                        // 紺 with 鼠 stripes
    collar: C.gofun,                         // 半襟
    obi: C.odo,
    obijime: C.shu,
    haori: C.ai,                             // 波兎 haori: 藍 ground
    haoriFg: C.gofun,                        //   胡粉 rabbits & seigaiha
    tabi: C.gofun,
    wood: U.mix(C.kinari, C.odo, 0.35),      // 三方, stick
    dango: C.gofun,
    pot: U.mix(C.odo, C.sumi, 0.5),
    tea: U.mix(C.koke, C.odo, 0.4),
    // the sleeping child under the haori
    child: null,
  };
  const OLD_SAYO = Object.assign({}, GRANDMA, { hair: U.mix(C.gofun, C.ginnezu, 0.2) });
  /** たけ after the robe: every colour drained to 月白 · 胡粉 · 銀鼠 (use with ink: C.ginnezu). */
  const GRANDMA_DRAINED = Object.assign({}, GRANDMA, {
    skin: C.gofun, hair: C.ginnezu, comb: C.ginnezu, kimono: C.geppaku, stripe: U.mix(C.geppaku, C.ginnezu, 0.35),
    collar: C.gofun, obi: C.gofun, obijime: C.gofun,
  });
  const GRANDMA_D = { torso: 72, neck: 16, upper: 34, fore: 30, thigh: 44, shin: 42, sole: 5, knee: 5 };

  function grandmaPose(o) {
    const t = o.t;
    const lift = o.lift == null ? 1 : U.clamp(o.lift);
    const look = o.look == null ? 0 : o.look;
    const kneel = { kneel: true, legN: [1.2, -1.54], legF: [1.1, -1.6] };
    switch (o.pose) {
      case 'stack':
        return Object.assign({ spine: 0.42, hunch: 0.3, neck: 0.35, armN: [0.95, 1.45], armF: [0.82, 1.52] }, kneel);
      case 'pour':
        return Object.assign({ spine: 0.34, hunch: 0.3, neck: 0.38, armN: [1.05, 1.72], armF: [0.75, 1.95] }, kneel);
      case 'lift-haori':
        return Object.assign({ spine: U.lerp(0.25, 0.1, lift), hunch: U.lerp(0.3, 0.16, lift), neck: U.lerp(0.2, -0.3, lift),
          armN: { bend: -1 }, reachN: [U.lerp(30, 44, lift), U.lerp(10, -44, lift)], armF: { bend: -1 }, reachF: [U.lerp(26, 40, lift), U.lerp(12, -40, lift)] }, kneel);
      case 'hold-puppet':
        return Object.assign({ spine: 0.16, hunch: 0.24, neck: 0.05 + look,
          armN: [U.lerp(0.35, 2.2, lift), U.lerp(1.25, 2.95, lift)],
          armF: o.arms === 'both' ? [U.lerp(0.25, 1.85, lift), U.lerp(1.3, 2.75, lift)] : [0.25, 1.35] }, kneel);
      case 'engawa':
        return { seat: true, spine: 0.14, hunch: 0.34, neck: 0.1 + look, legN: [1.45, 0.08], legF: [1.35, -0.02], armN: [0.35, 1.3], armF: [0.25, 1.4] };
      case 'walk': {
        const ph = t * TAU * 0.42, s = Math.sin(ph), c = Math.cos(ph);
        return { spine: 0.22, hunch: 0.36, neck: 0.12, legN: [0.24 * s + 0.04, 0.24 * s - 0.15 * Math.max(0, -c) - 0.08], legF: [-0.24 * s + 0.04, -0.24 * s - 0.15 * Math.max(0, c) - 0.08],
          armN: [0.45, 1.35], armF: [0.35, 1.45], bob: Math.abs(c) * 1.5 };
      }
      case 'lap':
        return Object.assign({ spine: 0.03, hunch: 0.1, neck: 0.3, armN: [0.42, 1.5], armF: [0.3, 1.6] }, kneel);
      default: // seiza
        return Object.assign({ spine: 0.26, hunch: 0.36, neck: 0.18 + look, armN: [0.35, 1.25], armF: [0.25, 1.35] }, kneel);
    }
  }

  /** Profile たけ on the rig. Returns hand / stick / spout points. */
  function drawGrandma(ctx, P, o, K) {
    const pose = o.pose;
    if (pose === 'engawa' && o.view === 'back') return grandmaBack(ctx, P, o, K, true);
    if (pose === 'seiza' && o.view === 'back') return grandmaBack(ctx, P, o, K, false);
    const q = grandmaPose(o);
    const D = GRANDMA_D;
    let J;
    if (q.seat) {
      J = rigAt(q, D, [0, -9]);
    } else J = rig(q, D);
    if (q.bob) ctx.translate(0, q.bob);
    const wearing = o.haori !== false && pose !== 'lift-haori' && pose !== 'lap';
    const haoriFill = P.fx && P.s >= 0.6 ? namiUsagi(ctx, K.haori, K.haoriFg, 19) : K.haori;
    const kimFill = P.fx && P.s >= 0.5 ? stripes(ctx, K.kimono, K.stripe, 5) : K.kimono;
    const ret = {};
    // the sleeping child and the haori spread over her (lap)
    if (pose === 'lap' && o.child !== false) {
      // drawn before the grandmother's near arm, after her body (see below)
    }
    const G = {
      kimono: K.kimono, bodyFill: kimFill, lining: K.collar, obi: K.obi, feet: K.tabi, long: true,
      sleeveDepth: 17, obiAt: 0.42, obiW: 11, footK: 0.85, width: 1.05,
      sleeveFill: wearing ? haoriFill : kimFill, sleeveCol: wearing ? K.haori : K.kimono,
      obijime: K.obijime, noHands: false, skipArmN: pose === 'lap',
      haori: wearing ? { fill: haoriFill, col: K.haori, len: 36 } : null,
      specks: wearing && P.fx && P.s < 0.6 && P.s >= 0.18 ? K.haoriFg : null,
    };
    if (q.seat) {
      // legs dangling from the veranda edge: the kimono drapes over the knees to the ankles
      G.long = false; G.pants = K.kimono; G.hem = 46; G.seatDrape = true;
    }
    G.shortCollar = true;
    kimonoBody(P, J, K, G, o.t);
    const ha = J.s2 * 0.6 + (q.neck || 0);
    head(P, J.head[0], J.head[1], ha, K, 'take', o);
    // props & return points
    const hN = J.armN[2], hF = J.armF[2];
    ret.hand = hN; ret.hands = [hN, hF];
    if (pose === 'stack' && o.dango !== false && P.mid) {
      const d = new Path2D();
      d.ellipse(hN[0] + 7, hN[1] - 3, 5, 4.6, 0, 0, TAU);
      P.shape(d, K.dango, 0.5);
      ret.dango = [hN[0] + 7, hN[1] - 3];
    }
    if (pose === 'pour') {
      // a small earthenware pot (土瓶) tilted over the cup
      ctx.save();
      ctx.translate(hN[0] + 6, hN[1] - 2);
      ctx.rotate(0.55);
      const pot = sp([[-12, -8], [12, -8], [15, 2], [11, 12], [-11, 12], [-15, 2]], true);
      P.shape(pot, K.pot, 0.8);
      const sp1 = new Path2D();
      taperTo(sp1, [[12, 0], [20, -4], [25, -7]], 4.5, 2.5, 0);
      P.shape(sp1, K.pot, 0.6);
      const hd = new Path2D();
      hd.moveTo(-10, -8); hd.bezierCurveTo(-10, -22, 10, -22, 10, -8);
      P.line(hd, 0.8);
      ctx.restore();
      const a = 0.55, sx = hN[0] + 6 + Math.cos(a) * 25 - Math.sin(a) * -7, sy = hN[1] - 2 + Math.sin(a) * 25 + Math.cos(a) * -7;
      ret.spout = [sx, sy];
      if (o.stream !== false && P.fx) {
        const st = new Path2D();
        taperTo(st, [[sx, sy], [sx + 2, sy + 12], [sx + 2.5, sy + 26]], 1.8, 1.2, 0);
        P.strokes(st, 0.8, K.tea);
      }
      P.shape(handPath(J.armN, 9, true), K.skin, 0.55);
    }
    if (pose === 'hold-puppet') {
      const L = o.stick == null ? 70 : o.stick;
      const tip = [hN[0] + 3, hN[1] - L];
      const st = new Path2D();
      taperTo(st, [[hN[0] + 4, hN[1] + 8], tip], 2.2, 1.6, 0);
      P.shape(st, K.wood, 0.5);
      P.shape(handPath(J.armN, 9, true), K.skin, 0.55);
      ret.stick = tip;
      if (o.arms === 'both') {
        const tip2 = [hF[0] + 2, hF[1] - L * 0.9];
        const s2 = new Path2D();
        taperTo(s2, [[hF[0] + 3, hF[1] + 8], tip2], 2.2, 1.6, 0);
        P.shape(s2, K.wood, 0.5);
        ret.stick2 = tip2;
      }
    }
    if (pose === 'lift-haori') {
      // the haori held up between both hands, hanging like a curtain
      const cx = (hN[0] + hF[0]) / 2 + 38, top = Math.min(hN[1], hF[1]) - 3;
      const sw = swayFn(o.t, P.wind, 2.1) * 3;
      const W = 34, Lh = Math.min(88, -top - 10), sl = 30;
      const cloth = sp([
        [cx - W * 0.55, top + 2, 1], [cx - 4, top - 3], [cx + W * 0.55, top + 2, 1],           // collar held at the hands
        [cx + W * 0.62, top + 14], [cx + W + 12 + sw, top + 18], [cx + W + 16 + sw * 1.2, top + 18 + sl], [cx + W * 0.62 + sw, top + 24 + sl, 1], // right sleeve
        [cx + W * 0.6 + sw * 1.4, top + Lh], [cx + sw * 1.5, top + Lh + 4], [cx - W * 0.6 + sw * 1.4, top + Lh, 1],                            // hem
        [cx - W * 0.62 + sw, top + 24 + sl, 1], [cx - W - 16 + sw * 1.2, top + 18 + sl], [cx - W - 12 + sw, top + 18], [cx - W * 0.62, top + 14], // left sleeve
      ], true);
      P.fill(cloth, P.fx && P.s >= 0.6 ? namiUsagi(ctx, K.haori, K.haoriFg, 19) : K.haori);
      P.line(cloth);
      if (P.mid) P.folds([[[[cx - 8, top + 8], [cx - 9 + sw, top + Lh * 0.5], [cx - 8 + sw * 1.4, top + Lh - 2]], 0.6, 0.15], [[[cx + 10, top + 8], [cx + 11 + sw, top + Lh * 0.5], [cx + 12 + sw * 1.4, top + Lh - 2]], 0.6, 0.15]], 0.6);
      P.shape(handPath(J.armN, 9, true), K.skin, 0.55);
      P.shape(handPath(J.armF, 9, true), K.skin, 0.55);
      ret.cloth = { a: [cx - W - 16, top], b: [cx + W + 16, top + Lh + 4] };
    }
    if (pose === 'lap') {
      // the child asleep across her lap, the haori laid over her
      const kn = J.legN[1];
      if (o.child !== false) {
        const r = sleepingChild(P, kn[0] - 10, kn[1] - 13, o, K.child || CHILD_SAYO, K, true);
        ret.child = r;
      }
      const sl = sleevePath(J.armN, 12.5 * 1.05, 17, false);
      P.shape(sl.path, kimFill, 0.95);
      P.shape(handPath(J.armN, 9, false), K.skin, 0.55);
    }
    return ret;
  }

  /**
   * Back view (seated seiza, or on the veranda edge): the haori's back, the
   * bun, head turning toward the moon. opts.look (−1..1, + = toward +x) and
   * opts.nod (0..1) animate the head.
   */
  function grandmaBack(ctx, P, o, K, engawa) {
    const look = o.look == null ? 0.35 : o.look;
    const nod = o.nod || 0;
    const wearing = o.haori !== false;
    const haoriFill = wearing ? (P.fx && P.s >= 0.6 ? namiUsagi(ctx, K.haori, K.haoriFg, 19) : K.haori) : (P.fx && P.s >= 0.5 ? stripes(ctx, K.kimono, K.stripe, 5) : K.kimono);
    const base = engawa ? -2 : 0;
    // kimono skirt spreading on the boards (seiza), or the seat edge (engawa)
    const skirt = sp([[-34, base - 30], [-40, base - 6], [-37, base + (engawa ? 4 : 1), 1], [37, base + (engawa ? 4 : 1), 1], [40, base - 6], [34, base - 30]], true);
    P.shape(skirt, P.fx && P.s >= 0.5 ? stripes(ctx, K.kimono, K.stripe, 5) : K.kimono);
    // the haori: a rounded, bent back from the shoulders to the seat
    const body = sp([
      [-10, -104], [-18, -102], [-25, -94], [-29, -78], [-32, -54], [-35, -30], [-37, -12, 1], [0, -8], [37, -12, 1], [35, -30], [32, -54], [29, -78], [25, -94], [18, -102], [10, -104], [0, -107],
    ], true);
    P.fill(body, haoriFill);
    P.line(body);
    if (P.mid) {
      P.folds([[[[0, -100], [0.5, -60], [0, -14]], 0.6, 0.3], [[[-22, -80], [-27, -50], [-30, -16]], 0.6, 0.15], [[[22, -80], [27, -50], [30, -16]], 0.6, 0.15]], 0.6);
      if (wearing && P.fx && P.s < 0.6 && P.s >= 0.18) {
        const sp1 = new Path2D();
        for (const [sx, sy] of [[-14, -70], [10, -52], [-5, -34], [17, -82]]) sp1.ellipse(sx, sy, 2.6, 1.6, -0.4, 0, TAU);
        P.flat(sp1, K.haoriFg);
      }
    }
    // collar band (半襟 white at the nape, kimono collar)
    const col = sp([[-10, -104], [0, -100], [10, -104], [7, -108], [0, -106], [-7, -108]], true);
    P.shape(col, K.collar, 0.5);
    // head sunk between rounded shoulders; the bun low at the nape with its comb; turns & nods
    const hx = look * 3, hy = -115 + nod * 6;
    if (Math.abs(look) > 0.08 && P.mid) {
      const s = look > 0 ? 1 : -1, k = Math.min(1, Math.abs(look));
      const ch = sp([[hx + s * 7, hy - 8], [hx + s * (11 + 2.5 * k), hy - 7], [hx + s * (14 + 3 * k), hy - 1], [hx + s * (12.5 + 2.5 * k), hy + 6], [hx + s * 7, hy + 8]], true);
      P.shape(ch, K.skin, 0.45, 0.7);
    }
    const hd = new Path2D();
    hd.ellipse(hx, hy - 1, 12.5, 13, look * 0.12, 0, TAU);
    P.shape(hd, K.hair, 0.6, 0.85);
    if (P.hi) P.folds([[[[hx - 7, hy - 11], [hx - 5, hy - 2], [hx - 2, hy + 6]], 0.3, 0.1], [[[hx + 7, hy - 11], [hx + 5, hy - 2], [hx + 2, hy + 6]], 0.3, 0.1], [[[hx, hy - 13], [hx, hy - 3], [hx, hy + 5]], 0.3, 0.1]], 0.4);
    const bun = new Path2D();
    bun.ellipse(hx * 0.8, hy + 9, 7, 5.4, 0, 0, TAU);
    P.shape(bun, U.shade(K.hair, 0.92), 0.55, 0.9);
    if (P.mid) {
      const comb = new Path2D();
      taperTo(comb, crs([[hx * 0.8 - 7.5, hy + 5.5], [hx * 0.8, hy + 3.2], [hx * 0.8 + 7.5, hy + 5.5]], 3), 2.2, 2.2, 0);
      P.shape(comb, K.comb, 0.35, 0.8);
    }
    // sleeves resting at the sides
    for (const s of [-1, 1]) {
      const sl = sp([[s * 25, -92], [s * 33, -74], [s * 38, -40], [s * 37, -16, 1], [s * 27, -14, 1], [s * 25, -50]], true);
      P.shape(sl, haoriFill, 0.9);
    }
    return { head: [hx, hy] };
  }

  /**
   * 小夜 asleep on her side, curled, (x,y) = where her head rests; lying
   * toward +x. With haori = true the 波兎 haori covers her to the shoulders.
   */
  function sleepingChild(P, x, y, o, KC, KH, haori) {
    const ctx = P.ctx;
    const br = Math.sin((o.t || 0) * 1.6) * 0.8; // slow breathing
    // body under the cloth (only its edge shows)
    const body = sp([[x + 6, y - 2], [x + 30, y - 12 - br], [x + 64, y - 14 - br], [x + 92, y - 22 - br * 0.5], [x + 112, y - 16], [x + 118, y + 10, 1], [x + 8, y + 12, 1]], true);
    P.shape(body, P.fx && P.s >= 0.5 ? kasuri(ctx, KC.kimono, KC.kimonoFg, 8) : KC.kimono);
    // the red obi-age peeking at the waist
    if (P.fx) {
      const ob = sp([[x + 52, y - 12], [x + 62, y - 13], [x + 63, y - 6], [x + 53, y - 5]], true);
      P.shape(ob, KC.obiage, 0.4);
    }
    // small feet (tabi) at the end
    const ft = new Path2D();
    ft.ellipse(x + 120, y + 5, 6, 3.4, -0.4, 0, TAU);
    P.shape(ft, C.gofun, 0.5);
    if (haori) {
      const sw = Math.sin((o.t || 0) * 0.7) * 0.8;
      const hf = P.fx && P.s >= 0.6 ? namiUsagi(ctx, KH.haori, KH.haoriFg, 19) : KH.haori;
      // the haori laid over her: collar at her shoulder, falling over hip and drawn-up knees
      const cloth = sp([[x + 10, y - 9, 1], [x + 26, y - 17 - br], [x + 48, y - 18 - br], [x + 70, y - 24 - br], [x + 88, y - 28 - br * 0.5], [x + 104, y - 20],
        [x + 110 + sw, y + 11, 1], [x + 84, y + 13], [x + 62, y + 11 + sw], [x + 36, y + 13, 1], [x + 16, y + 12, 1]], true);
      P.fill(cloth, hf);
      P.line(cloth);
      // a sleeve of the haori spilling over the front edge onto the boards
      const slv = sp([[x + 40, y - 6], [x + 62, y - 4], [x + 66, y + 13, 1], [x + 38, y + 13, 1]], true);
      P.fill(slv, hf);
      P.line(slv, 0.8);
      if (P.mid) {
        const lap = new Path2D();
        taperTo(lap, crs([[x + 11, y - 8], [x + 20, y - 1], [x + 26, y + 12]], 3), 3.2, 3.2, 0);
        P.fill(lap, U.mix(KH.haori, C.sumi, 0.45));
        P.folds([[[[x + 66, y - 18], [x + 72, y - 4], [x + 74, y + 11]], 0.7, 0.2], [[[x + 88, y - 24], [x + 92, y - 6], [x + 94, y + 11]], 0.6, 0.2]], 0.6);
      }
    }
    // head: okappa seen from the side, resting, eyes closed
    const hd = new Path2D();
    hd.ellipse(x, y - 6, 11.5, 11, 0.2, 0, TAU);
    P.shape(hd, KC.hair, 0.6, 0.85);
    const fc = sp([[x - 2, y - 6], [x + 7, y - 8], [x + 10, y - 1], [x + 7, y + 5], [x - 1, y + 4]], true);
    P.shape(fc, KC.skin, 0.45, 0.7);
    if (P.mid) {
      const e = new Path2D();
      taperTo(e, [[x + 2.5, y - 2.5], [x + 4.5, y - 1.5], [x + 6.5, y - 2.4]], P.lw * 0.6, P.lw * 0.5, 0.2);
      P.strokes(e, 0.85);
    }
    return { head: [x, y - 6] };
  }

  /* ================================================================== */
  /* 竹取の翁 — the old bamboo cutter                                    */
  /* ================================================================== */
  const OKINA = {
    skin: U.mix(C.gofun, C.kitsune, 0.32),
    hair: U.mix(C.gofun, C.ginnezu, 0.3),
    kimono: C.ai,
    kimonoFg: U.mix(C.ai, C.hanada, 0.45),
    lining: C.asagi,
    obi: C.odo,
    pants: U.mix(C.kon, C.ai, 0.35),
    wrap: C.kinari,
    sandal: C.susuki,
    bamboo: C.aotake,
    bambooDark: C.matsuba,
    blade: C.ginnezu,
    haft: C.kitsune,
    staff: C.kuchiba,
  };
  const OKINA_D = { torso: 86, neck: 21, upper: 42, fore: 38, thigh: 50, shin: 49, sole: 7, knee: 7 };

  function okinaPose(pose, t, ph) {
    const walkPh = t * 2 * Math.PI * 0.55;
    switch (pose) {
      case 'walk': {
        const s = Math.sin(walkPh), c = Math.cos(walkPh);
        return {
          spine: 0.2, hunch: 0.32, neck: 0.1,
          legN: [0.34 * s + 0.05, 0.34 * s - 0.2 * Math.max(0, -c) - 0.12], legF: [-0.34 * s + 0.05, -0.34 * s - 0.2 * Math.max(0, c) - 0.12],
          armN: { bend: -1 }, reachN: [22, -13], armF: [-0.25 * s + 0.1, 0.3 - 0.2 * s],
          bob: Math.abs(c) * 2,
        };
      }
      case 'cut': {
        const p = U.ease.inOutSine(U.clamp(ph == null ? 0.2 : ph));
        return {
          spine: U.lerp(-0.05, 0.3, p), hunch: 0.25, neck: U.lerp(-0.2, 0.2, p),
          legN: [0.32, 0.05], legF: [-0.3, -0.18],
          armN: [U.lerp(2.75, 1.35, p), U.lerp(2.2, 1.0, p)], armF: [0.95, 1.6],
        };
      }
      case 'kneel':
        return {
          kneel: true, spine: 0.3, hunch: 0.34, neck: 0.5,
          legN: [1.18, -1.54], legF: [1.08, -1.6],
          armN: [0.5, 1.72], armF: [0.3, 1.55],
        };
      case 'reach':
        return {
          spine: -0.12, hunch: -0.05, neck: -0.9,
          legN: [0.12, 0.02], legF: [-0.2, -0.14],
          armN: [2.85, 2.95], armF: [2.45, 2.75],
        };
      default: // stand, bent, one hand on a staff, the other at the small of the back
        return {
          spine: 0.14, hunch: 0.44, neck: 0.1,
          legN: [0.22, -0.06], legF: [-0.02, -0.2],
          armN: [0.42, 1.2], armF: [-0.75, 1.1],
        };
    }
  }

  function drawOkina(ctx, P, o, K) {
    const t = o.t, pose = o.pose;
    const q = okinaPose(pose, t, o.phase);
    const J = rig(q, OKINA_D);
    const G = {
      kimono: K.kimono, lining: K.lining, obi: K.obi, pants: K.pants, sandal: K.sandal, wrap: K.wrap,
      hem: 50, sleeveDepth: 11, pattern: ['same', K.kimonoFg, 6, 0.8],
    };
    if (q.bob) ctx.translate(0, q.bob);
    const holding = pose === 'kneel' && o.holding !== 'none';
    let bx = 0, by = 0;
    if (holding) {
      const a = J.armN[2], b = J.armF[2];
      bx = (a[0] + b[0]) / 2 + 7; by = (a[1] + b[1]) / 2 - 6;
      babyGlow(P, bx, by, 1, o.glow == null ? 1 : o.glow, t, KAGUYA);
    }
    // props behind the body
    if (pose === 'walk') bambooBundle(P, J, K, t);
    if (pose === 'stand') {
      const h = J.armN[2];
      const st = new Path2D();
      taperTo(st, [[h[0] + 6, h[1] - 18], [h[0] + 9, 0]], 3.6, 3, 0);
      P.shape(st, K.staff, 0.6);
    }
    kimonoBody(P, J, K, G, t);
    // head
    const ha = J.s2 * 0.6 + (q.neck || 0);
    head(P, J.head[0], J.head[1], ha, K, 'okina', o);
    // props in front
    if (pose === 'walk') P.shape(handPath(J.armN, 10, true), K.skin, 0.6);
    if (pose === 'cut') {
      const h = J.armN[2], e = J.armN[1];
      const a = Math.atan2(h[1] - e[1], h[0] - e[0]);
      ctx.save();
      ctx.translate(h[0], h[1]);
      ctx.rotate(a);
      const haft = new Path2D();
      haft.rect(-4, -2.2, 30, 4.4);
      P.shape(haft, K.haft, 0.6);
      const bl = sp([[18, -3, 1], [30, -4, 1], [31, -14], [26, -19, 1], [18, -14, 1]], true);
      P.shape(bl, K.blade, 0.8);
      ctx.restore();
      P.shape(handPath(J.armN, 11, true), K.skin, 0.6);
    }
    if (holding) {
      babyBundle(P, bx, by, 1, KAGUYA);
      P.shape(handPath(J.armN, 10, false), K.skin, 0.6);
    }
  }

  /** A bundle of cut bamboo poles on the far shoulder (drawn behind the head). */
  function bambooBundle(P, J, K, t) {
    const s = J.sh;
    const ang = -0.3;
    const c = Math.cos(ang), sn = Math.sin(ang);
    const base = [s[0] - 3, s[1] - 7];
    const behind = false;
    const poles = [[-7, 0.62], [4, 1], [-2, 0.82], [9, 0.94], [-11, 0.9]];
    for (const [off, k] of poles) {
      const x0 = base[0] - c * 150 * k - sn * off, y0 = base[1] - sn * 150 * k + c * off;
      const x1 = base[0] + c * 110 * k - sn * off, y1 = base[1] + sn * 110 * k + c * off;
      const p = new Path2D();
      taperTo(p, [[x0, y0], [x1, y1]], 6.5, 5, 0);
      P.shape(p, behind ? U.shade(K.bamboo, 0.85) : K.bamboo, 0.7);
      if (P.mid) {
        const nd = new Path2D();
        for (let i = 1; i < 6; i++) {
          const f = i / 6 + off * 0.004;
          const nx = x0 + (x1 - x0) * f, ny = y0 + (y1 - y0) * f;
          taperTo(nd, [[nx + sn * 3.4, ny - c * 3.4], [nx - sn * 3.4, ny + c * 3.4]], 1.6, 1.6, 0);
        }
        P.strokes(nd, 0.6, K.bambooDark);
      }
    }
    if (!behind && P.mid) {
      // straw rope binding near the shoulder
      const r = new Path2D();
      taperTo(r, [[base[0] - c * 34 - sn * 12, base[1] - sn * 34 + c * 12], [base[0] - c * 30 + sn * 14, base[1] - sn * 30 - c * 14]], 3, 3, 0);
      P.shape(r, K.sandal, 0.5);
    }
  }

  /** The tiny shining child, swaddled, held in the hands. */
  function babyGlow(P, x, y, k, g, t, K) {
    const ctx = P.ctx;
    if (g > 0 && P.fx) {
      const pulse = 0.88 + 0.12 * Math.sin(t * 1.6);
      const gr = ctx.createRadialGradient(x, y, 1, x, y, 46 * k);
      gr.addColorStop(0, U.rgba(K.glow, 0.75 * g * pulse));
      gr.addColorStop(0.4, U.rgba(K.glow, 0.22 * g * pulse));
      gr.addColorStop(1, U.rgba(K.glow, 0));
      ctx.fillStyle = gr;
      ctx.fillRect(x - 46 * k, y - 46 * k, 92 * k, 92 * k);
    }
  }
  function babyBundle(P, x, y, k, K) {
    const b = sp([[x - 8 * k, y + 3 * k], [x - 5 * k, y - 5 * k], [x + 4 * k, y - 6 * k], [x + 9 * k, y + 1 * k], [x + 4 * k, y + 6 * k], [x - 4 * k, y + 6 * k]], true);
    P.shape(b, K.kasane[3], 0.55);
    const hd = new Path2D();
    hd.ellipse(x + 3.5 * k, y - 7.5 * k, 3.6 * k, 4 * k, 0.2, 0, TAU);
    P.shape(hd, K.skin, 0.45, 0.7);
    const hr = sp([[x + 1 * k, y - 11 * k], [x + 6 * k, y - 11 * k], [x + 1.5 * k, y - 8 * k], [x + 0 * k, y - 3 * k], [x - 1.5 * k, y - 8 * k]], true);
    P.fill(hr, K.hair);
  }

  define('okina', {
    poses: ['stand', 'walk', 'cut', 'kneel', 'reach'],
    defaults: {},
    bounds(pose) {
      if (pose === 'walk') return [-170, -300, 330, 305];
      if (pose === 'kneel') return [-80, -200, 215, 205];
      if (pose === 'reach') return [-70, -330, 150, 335];
      if (pose === 'cut') return [-80, -322, 232, 327];
      return [-70, -262, 168, 267];
    },
    draw(ctx, P, o) { drawOkina(ctx, P, o, pal(OKINA, o)); },
  });

  /* ================================================================== */
  /* 月の兎 — the moon rabbit                                            */
  /* design units ×0.55: a sitting rabbit is ~55 px tall at scale 1       */
  /* (true size beside a 300 px person). Moon close-ups: scale 3–8.       */
  /* ================================================================== */
  const RABBIT = {
    fur: C.gofun,
    shade: U.mix(C.gofun, C.ginnezu, 0.35),
    ear: C.toki,
    eye: C.beni,
    usu: C.kitsune,
    usuDark: U.mix(C.kitsune, C.sumi, 0.35),
    kine: C.kuchiba,
    mochi: C.gofun,
  };

  /** Rabbit head in a local frame at (x,y) rotated a; ears swept back by `back` (0..1). */
  function rabbitHead(P, x, y, a, K, back, t) {
    const ctx = P.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    const sw = Math.sin((t || 0) * 1.3) * 0.04;
    const earA = -0.28 - back * 1.05 + sw, earB = -0.08 - back * 1.0 - sw;
    // far ear
    const fe = new Path2D();
    fe.ellipse(-2 + Math.sin(earB) * 20, -14 - Math.cos(earB) * 20, 6.2, 21, earB, 0, TAU);
    P.shape(fe, K.shade, 0.85);
    // head
    const hd = sp([[-14, 2], [-12, -10], [-3, -16], [8, -14], [15, -6], [18, 3], [17.5, 6.5, 1], [12, 10.5], [1, 12], [-9, 9]], true);
    P.shape(hd, K.fur);
    // near ear with pink inside
    const ne = new Path2D();
    const ex = -6 + Math.sin(earA) * 21, ey = -12 - Math.cos(earA) * 21;
    ne.ellipse(ex, ey, 7.2, 22.5, earA, 0, TAU);
    P.shape(ne, K.fur);
    if (!P.sil) {
      const ie = new Path2D();
      ie.ellipse(ex + Math.cos(earA) * 0.5, ey + Math.sin(earA) * 0.5 + 1.5, 3.2, 16, earA, 0, TAU);
      P.flat(ie, K.ear);
    }
    if (!P.sil) {
      // eye: a red dot ringed in sumi
      const ey2 = new Path2D();
      ey2.ellipse(6.5, -3, 2.6, 2.9, 0, 0, TAU);
      P.flat(ey2, K.eye);
      P.line(ey2, 0.5, 0.9);
      const ns = new Path2D();
      ns.ellipse(17.2, 4.2, 1.6, 1.3, 0, 0, TAU);
      P.flat(ns, K.ear);
      if (P.mid) P.folds([[[[16.5, 6], [14.5, 9], [11.5, 9.5]], 0.55, 0.2]], 0.8);
      if (P.hi) {
        const wk = new Path2D();
        for (const [dy, len, bend] of [[3, 16, -3], [5, 17, 0], [7, 15, 3]]) {
          taperTo(wk, [[15, dy], [15 + len * 0.55, dy + bend * 0.4 - 1], [15 + len, dy + bend]], 0.9, 0.2, 0);
        }
        P.strokes(wk, 0.55);
      }
    }
    ctx.restore();
  }

  function rabbitBody(P, pts, K, haunch) {
    const b = sp(pts, true);
    P.shape(b, K.fur);
    if (P.mid && haunch) P.folds([[haunch, 0.8, 0.15]], 0.8);
    return b;
  }

  function drawRabbit(ctx, P, o, K) {
    const t = o.t, pose = o.pose;
    const tail = (x, y, r) => { const p = new Path2D(); p.ellipse(x, y, r, r * 0.9, 0, 0, TAU); P.shape(p, K.fur, 0.8); };
    const paw = (x, y, a, l) => { const p = new Path2D(); p.ellipse(x, y, l || 6.5, 3.6, a || 0, 0, TAU); P.shape(p, K.fur, 0.7); };
    if (pose === 'sit' || pose === 'gaze') {
      const g = pose === 'gaze';
      const breathe = Math.sin(t * 2.1) * 0.6;
      tail(-33, -12, 6.5);
      if (g) {
        rabbitBody(P, [[13, -74], [0, -76 - breathe], [-13, -68], [-23, -52], [-29, -32], [-29, -12], [-22, -2], [-10, 1, 1], [20, 1, 1], [25, -12], [24, -34], [22, -54], [19, -68]], K,
          [[-24, -4], [-22, -26], [-10, -34], [3, -24], [6, -6]]);
        paw(22, -46, 1.0, 6); paw(26, -44, 1.2, 6);
        paw(18, -2, 0, 7); paw(25, -1.5, 0, 7);
        rabbitHead(P, 19, -86 - breathe, -0.55, K, 0.05, t);
      } else {
        rabbitBody(P, [[12, -60], [0, -62 - breathe], [-16, -56], [-28, -44], [-35, -28], [-35, -12], [-28, -2], [-16, 1, 1], [18, 1, 1], [25, -10], [27, -26], [26, -42], [20, -54]], K,
          [[-27, -4], [-25, -24], [-12, -34], [2, -26], [6, -6]]);
        paw(19, -2, 0, 7); paw(27, -1.5, 0, 7);
        rabbitHead(P, 26, -70 - breathe, 0.05, K, 0.12, t);
      }
      return;
    }
    if (pose === 'pound') {
      let ph = o.phase == null ? U.fract(t * 0.55) : U.fract(o.phase);
      // quick drop (0 → .5), slow lift (.5 → 1)
      const lift = ph < 0.5 ? 1 - U.ease.inQuad(ph * 2) : U.ease.inOutSine((ph - 0.5) * 2);
      const bend = 1 - lift;
      // usu (mortar) with mochi
      const ux = 66;
      const usu = sp([[ux - 24, -44, 1], [ux - 20, -24], [ux - 22, -4], [ux - 25, 0, 1], [ux + 25, 0, 1], [ux + 22, -4], [ux + 20, -24], [ux + 24, -44, 1]], true);
      P.shape(usu, K.usu);
      if (P.mid) {
        const rings = new Path2D();
        taperTo(rings, [[ux - 21, -36], [ux, -34], [ux + 21, -36]], 1.6, 1.6, 0);
        taperTo(rings, [[ux - 22, -9], [ux, -7], [ux + 22, -9]], 1.6, 1.6, 0);
        P.strokes(rings, 0.6, K.usuDark);
        if (P.hi) P.folds([[[[ux - 8, -30], [ux - 9, -14]], 0.5, 0.3], [[[ux + 10, -28], [ux + 11, -16]], 0.5, 0.3]], 0.5);
      }
      const rim = new Path2D();
      rim.ellipse(ux, -44, 24, 6.5, 0, 0, TAU);
      P.shape(rim, K.usuDark, 0.8);
      const squash = 1 - 0.25 * Math.max(0, 1 - Math.abs(ph - 0.5) * 8);
      const mo = new Path2D();
      mo.ellipse(ux, -46 + (1 - squash) * 2, 19 * (2 - squash), 7 * squash, 0, Math.PI, TAU);
      mo.ellipse(ux, -45, 19 * (2 - squash) * 0.98, 4.5, 0, 0, Math.PI);
      P.shape(mo, K.mochi, 0.7);
      // rabbit on hind legs, leaning into the stroke
      const lean = 0.08 + bend * 0.32;
      tail(-22, -24, 6);
      ctx.save();
      ctx.translate(-4, 0);
      ctx.rotate(lean * 0.5);
      // long hind foot on the ground
      const ft = sp([[-18, 0, 1], [-16, -6], [-4, -8], [10, -4], [13, 0, 1]], true);
      P.shape(ft, K.fur, 0.8);
      const body = rabbitBody(P, [[10, -80], [-2, -82], [-14, -72], [-20, -52], [-24, -30], [-22, -12], [-12, -4], [4, -4], [14, -16], [18, -38], [18, -60], [15, -72]], K,
        [[-20, -10], [-19, -30], [-8, -38], [4, -28], [6, -10]]);
      void body;
      ctx.restore();
      // mallet: pivot at the paws
      const pv = [U.lerp(28, 16, lift), U.lerp(-58, -86, lift)];
      const th = U.lerp(0.04, -1.62, lift);
      const hl = 42;
      const hc = [pv[0] + Math.cos(th) * hl, pv[1] + Math.sin(th) * hl];
      const hd = new Path2D();
      taperTo(hd, [[pv[0] - Math.cos(th) * 6, pv[1] - Math.sin(th) * 6], hc], 4.2, 4.6, 0);
      P.shape(hd, K.kine, 0.7);
      ctx.save();
      ctx.translate(hc[0], hc[1]);
      ctx.rotate(th);
      const kh = new Path2D();
      kh.roundRect(-6.5, -15, 13, 30, 3.5);
      P.shape(kh, K.kine, 0.9);
      if (P.mid) { const e = new Path2D(); e.moveTo(-6.5, -9); e.lineTo(6.5, -9); e.moveTo(-6.5, 9); e.lineTo(6.5, 9); P.line(e, 0.4, 0.5); }
      ctx.restore();
      // head + paws gripping the handle
      rabbitHead(P, 16 + lean * 12, -92 + bend * 10, 0.1 + bend * 0.35, K, 0.18, t);
      paw(pv[0] - 2, pv[1] + 2, th, 6.5);
      paw(pv[0] + 4, pv[1] + 1, th, 6);
      return;
    }
    if (pose === 'hop') {
      const ph = o.phase == null ? U.fract(t * 1.2) : U.fract(o.phase);
      const air = Math.sin(ph * Math.PI);
      const st = 0.35 + 0.65 * air; // stretch
      ctx.translate(0, -air * 26);
      ctx.rotate(-0.12 * air + 0.05);
      tail(-40 - st * 6, -30, 6);
      // hind legs trailing back
      const hl = sp([[-26, -30], [-40 - st * 8, -20], [-52 - st * 14, -10 + st * 2], [-68 - st * 16, -3 + st * 3, 1], [-60 - st * 14, 3 + st * 2], [-44 - st * 8, -2], [-26, -10]], true);
      P.shape(hl, K.fur, 0.8);
      rabbitBody(P, [[20, -52], [4, -56], [-16, -52], [-32, -42], [-42 - st * 4, -28], [-38 - st * 4, -14], [-24, -10], [-6, -12], [10, -16], [22, -26], [26, -40]], K,
        [[-36, -16], [-30, -34], [-18, -38], [-8, -26]]);
      // fore legs reaching
      const fl = sp([[14, -24], [26 + st * 10, -10 + st * 2], [34 + st * 14, -2 + st * 2, 1], [24 + st * 10, -4 + st * 2], [8, -16]], true);
      P.shape(fl, K.fur, 0.8);
      rabbitHead(P, 28, -58, 0.18, K, 0.45 + 0.4 * air, t);
      return;
    }
    // leap: fully stretched, rising diagonally (the Jataka rabbit into the fire)
    {
      const ph = o.phase == null ? 0.5 : U.clamp(o.phase);
      const k = Math.sin(ph * Math.PI);
      ctx.translate(0, -34 - k * 20);
      ctx.rotate(-0.32 + ph * 0.4);
      tail(-54, -20, 6);
      const hl = sp([[-30, -26], [-48, -16], [-64, -4], [-86, 8, 1], [-80, 14], [-58, 6], [-36, -2]], true);
      P.shape(hl, K.fur, 0.8);
      rabbitBody(P, [[26, -42], [8, -48], [-14, -44], [-34, -34], [-50, -22], [-48, -8], [-30, -2], [-6, -4], [14, -10], [28, -22]], K,
        [[-44, -8], [-36, -26], [-22, -30], [-12, -16]]);
      const fl = sp([[20, -18], [40, -12], [56, -8, 1], [40, -6], [16, -8]], true);
      P.shape(fl, K.fur, 0.8);
      rabbitHead(P, 36, -46, 0.3, K, 1, t);
    }
  }

  define('rabbit', {
    poses: ['sit', 'pound', 'hop', 'leap', 'gaze'],
    defaults: {},
    unit: 0.55,
    size: 60,
    bounds(pose) {
      if (pose === 'pound') return [-40, -175, 140, 180];
      if (pose === 'hop') return [-85, -130, 145, 135];
      if (pose === 'leap') return [-100, -150, 175, 150];
      if (pose === 'gaze') return [-45, -135, 90, 140];
      return [-45, -125, 95, 130];
    },
    draw(ctx, P, o) { drawRabbit(ctx, P, o, pal(RABBIT, o)); },
  });

  /* ================================================================== */
  /* 嫗 — the old wife  ·  elder — a grandmother (ouna variant)          */
  /* ================================================================== */
  const OUNA = {
    skin: U.mix(C.gofun, C.kitsune, 0.26),
    hair: U.mix(C.ginnezu, C.nezumi, 0.25),
    tie: C.gofun,
    kimono: U.mix(C.kitsune, C.rikyu, 0.45),
    kimonoFg: U.mix(C.kitsune, C.rikyu, 0.25),
    lining: C.kuchiba,
    obi: U.mix(C.rikyu, C.sumi, 0.45),
    feet: C.gofun,
  };
  const ELDER = Object.assign({}, OUNA, {
    kimono: U.mix(C.ai, C.nezumi, 0.5),
    kimonoFg: U.mix(C.ai, C.nezumi, 0.25),
    lining: C.kinari,
    obi: C.enji,
  });
  const OUNA_D = { torso: 80, neck: 19, upper: 40, fore: 36, thigh: 50, shin: 48, sole: 6, knee: 6 };
  function ounaPose(pose) {
    switch (pose) {
      case 'kneel':
        return { kneel: true, spine: 0.16, hunch: 0.34, neck: 0.3, legN: [1.2, -1.54], legF: [1.1, -1.6], armN: [0.35, 1.25], armF: [0.2, 1.3] };
      case 'weep':
        return { kneel: true, spine: 0.3, hunch: 0.4, neck: 0.6, legN: [1.2, -1.54], legF: [1.1, -1.6], armN: { bend: -1 }, armF: [0.2, 1.3], toFace: true };
      case 'point':
        return { spine: 0.02, hunch: 0.3, neck: -0.45, legN: [0.1, 0.02], legF: [-0.08, -0.1], armN: [2.35, 2.5], armF: [0.25, 1.1] };
      default:
        return { spine: 0.08, hunch: 0.36, neck: 0.1, legN: [0.1, 0.02], legF: [-0.08, -0.1], armN: [0.3, 1.25], armF: [0.2, 1.35] };
    }
  }
  function drawOuna(ctx, P, o, K) {
    const q = ounaPose(o.pose);
    const J = rig(q, OUNA_D);
    const G = {
      kimono: K.kimono, lining: K.lining, obi: K.obi, feet: K.feet, long: true,
      sleeveDepth: 17, obiAt: 0.42, obiW: 11, pattern: ['same', K.kimonoFg, 5, 0.9], noSlideN: q.toFace, footK: 0.85,
    };
    G.skipArmN = !!q.toFace;
    kimonoBody(P, J, K, G, o.t);
    const ha = J.s2 * 0.6 + (q.neck || 0);
    head(P, J.head[0], J.head[1], ha, K, 'ouna', o);
    if (q.toFace) {
      // the sleeve pressed to the eyes: cuff across the face, cloth hanging to the lap
      const h = J.armN[2], e = J.armN[1];
      const sw = swayFn(o.t, P.wind, 3) * 1.5;
      const sl = sp([
        [h[0] - 5, h[1] - 3, 1], [h[0] + 7, h[1] - 1, 1], [h[0] + 10, h[1] + 14], [e[0] + 12 + sw, e[1] + 16],
        [e[0] + 4 + sw, e[1] + 28], [e[0] - 8 + sw * 0.6, e[1] + 22], [e[0] - 8, e[1] + 4], [h[0] - 8, h[1] + 12],
      ], true);
      P.shape(sl, K.kimono, 0.95);
      if (P.mid) P.folds([[[[h[0] + 1, h[1] + 4], [e[0] + 2, e[1] + 8], [e[0] + 1 + sw, e[1] + 24]], 0.6, 0.1]], 0.6);
      const hd = new Path2D();
      hd.ellipse(h[0] + 1, h[1] - 2, 4.5, 3, ha, 0, TAU);
      P.shape(hd, K.skin, 0.5, 0.7);
    }
  }
  const OUNA_B = (pose) => {
    if (pose === 'kneel' || pose === 'weep') return [-70, -175, 150, 180];
    if (pose === 'point') return [-50, -300, 130, 305];
    return [-55, -260, 120, 265];
  };
  define('ouna', { poses: ['stand', 'kneel', 'weep', 'point'], defaults: {}, bounds: OUNA_B, draw(ctx, P, o) { drawOuna(ctx, P, o, pal(OUNA, o)); } });
  define('elder', { poses: ['stand', 'kneel', 'weep', 'point'], defaults: {}, bounds: OUNA_B, draw(ctx, P, o) { drawOuna(ctx, P, o, pal(ELDER, o)); } });

  /* ================================================================== */
  /* child — 小夜 (Sayo), six: 墨 okappa, 紺 kasuri, the 紅 obi-age       */
  /* ~150 px tall at scale 1                                              */
  /* ================================================================== */
  const CHILD_SAYO = {
    skin: U.mix(C.gofun, C.toki, 0.22),
    hair: '#161412',
    kimono: C.kon,
    kimonoFg: C.gofun,                       // kasuri flecks
    lining: C.gofun,
    obi: U.mix(C.odo, C.sumi, 0.45),         // a dark soft sash so the red sings
    obiage: C.beni,                          // 紅の帯揚げ — the colour that survives
    pants: C.kon,
    sandal: C.susuki,
    stem: C.matsuba,
    plume: C.susuki,
    dango: C.gofun,
  };
  const CHILD = CHILD_SAYO;
  const CHILD_D = { torso: 50, neck: 14, upper: 22, fore: 20, thigh: 27, shin: 25, sole: 5, knee: 5 };

  function childPose(o) {
    const t = o.t;
    const sob = Math.sin(t * 6) * 0.03;
    switch (o.pose) {
      case 'reach-up':
        return { spine: -0.1, hunch: -0.1, neck: -0.75 + sob, legN: [0.12, 0.06], legF: [-0.14, -0.12], armN: [2.9 + sob * 3, 3.05], armF: [2.6 - sob * 3, 2.85], cry: true };
      case 'reach': // crouched at the water, grabbing at the moon
        return { spine: 0.95, hunch: 0.3, neck: 0.45, legN: [1.2, -0.25], legF: [1.05, -0.4], armN: [0.55, 0.5], armF: [0.35, 0.8], squat: true };
      case 'sit':
        return { kneel: true, spine: 0.05, hunch: 0.1, neck: -0.35, legN: [1.25, -1.55], legF: [1.15, -1.6], armN: [0.3, 1.2], armF: [0.2, 1.25] };
      case 'run': {
        const ph = t * TAU * 1.5, s = Math.sin(ph), c = Math.cos(ph);
        return { spine: 0.22, hunch: 0.05, neck: -0.05, legN: [0.6 * s + 0.1, 0.6 * s - 0.55 * Math.max(0, -c) - 0.2], legF: [-0.6 * s + 0.1, -0.6 * s - 0.55 * Math.max(0, c) - 0.2],
          armN: [-0.7 * s, -0.7 * s + 1.1], armF: [0.7 * s, 0.7 * s + 1.1], bob: Math.abs(c) * 4 - 2, run: true };
      }
      case 'carry-susuki': {
        const ph = t * TAU * 0.85, s = Math.sin(ph), c = Math.cos(ph);
        return { spine: 0.06, hunch: -0.02, neck: -0.08, legN: [0.34 * s + 0.04, 0.34 * s - 0.3 * Math.max(0, -c) - 0.08], legF: [-0.34 * s + 0.04, -0.34 * s - 0.3 * Math.max(0, c) - 0.08],
          armN: { bend: -1 }, reachN: [11, 20], armF: [0.3 * s, 0.3 * s + 0.35], bob: Math.abs(c) * 1.6 };
      }
      default: // stand
        return { spine: 0.02, hunch: 0.04, neck: -0.1, legN: [0.08, 0.02], legF: [-0.07, -0.06], armN: [0.15, 0.5], armF: [-0.1, 0.25] };
    }
  }

  /**
   * A sheaf of susuki carried over the shoulder. (hx,hy) = the grip at the
   * chest; the cut ends poke out below it, the stems lean back past the head
   * and each ends in a soft drooping plume (尾花).
   */
  function susukiSheaf(P, hx, hy, len, K, t, wind) {
    const stems = new Path2D(), plumes = new Path2D(), hairs = new Path2D();
    const r = U.rng(77);
    for (let i = 0; i < 7; i++) {
      const a = -2.2 + i * 0.055 + (r() - 0.5) * 0.05;   // up and back (toward −x)
      const L = len * U.lerp(0.82, 1.02, r());
      const sway = (0.4 + wind) * (Math.sin(t * 1.3 + i * 0.7) * 0.05 + U.wobble(t * 0.5 + i, 3) * 0.03);
      const bend = -0.26 - r() * 0.12 + sway;
      const pts = [];
      for (let k = 0; k <= 8; k++) {
        const u = -0.1 + (k / 8) * 1.1, aa = a + bend * Math.max(0, u) * Math.max(0, u);
        pts.push([hx + Math.cos(aa) * L * u + (i - 3) * 0.9 * Math.max(0, u), hy + Math.sin(aa) * L * u]);
      }
      taperTo(stems, pts.slice(0, pts.length - 2), 2.4, 1.3, 0);
      // plume: a drooping tuft hanging from the last third of the stem
      const n = pts.length;
      const up = [], lo = [];
      const m = 7;
      for (let k = 0; k <= m; k++) {
        const u = 0.64 + (k / m) * 0.36;
        const fi = u * (n - 1), i0 = Math.min(n - 2, Math.floor(fi));
        const q = lerpPt(pts[i0], pts[i0 + 1], fi - i0);
        const d = unit(pts[i0], pts[i0 + 1]);
        const nn = [-d[1], d[0]];                            // the stem's lower side (points down/back)
        const sg = nn[1] > 0 ? 1 : -1;
        const w = len * 0.024 * Math.pow(Math.sin(Math.PI * Math.min(1, (u - 0.64) / 0.36 * 0.85 + 0.12)), 0.6) * (1 + 0.2 * Math.sin(t * 1.7 + i + k));
        const droop = len * 0.05 * Math.pow((k / m), 1.6);          // the tassel hangs lower toward its end
        up.push([q[0] - nn[0] * sg * w * 0.2, q[1] - nn[1] * sg * w * 0.2 + droop * 0.25]);
        lo.push([q[0] + nn[0] * sg * w, q[1] + nn[1] * sg * w + droop * 1.15]);
        if (P.mid && k % 2 === 1) {
          const e = lo[lo.length - 1];
          taperTo(hairs, [e, [e[0] - d[0] * w * 0.5 - 1, e[1] + w * 1.2]], 1.2, 0.2, 0);
        }
      }
      const tip = pts[n - 1];
      const tp = [tip[0] - 1, tip[1] + len * 0.045];
      sp(up.concat([[tp[0], tp[1], 1]], lo.reverse()), true, plumes);
    }
    P.fill(stems, K.stem);
    P.fill(plumes, K.plume);
    P.fill(hairs, K.plume);
    if (P.mid) P.line(plumes, 0.3, 0.45);
  }

  /** 小夜 from behind, kneeling (seiza), head tilting up by opts.look (0..1). */
  function childBack(ctx, P, o, K) {
    const look = o.look == null ? 0 : U.clamp(o.look, -1, 1);
    const kim = P.fx && P.s >= 0.5 ? kasuri(ctx, K.kimono, K.kimonoFg, 8) : K.kimono;
    // feet soles peeking under the seat
    const ft = new Path2D();
    ft.ellipse(-9, -3, 6, 3.4, 0.3, 0, TAU); ft.ellipse(9, -3, 6, 3.4, -0.3, 0, TAU);
    P.shape(ft, C.gofun, 0.5);
    const body = sp([[-10, -70], [-19, -64], [-24, -44], [-27, -18], [-29, -4, 1], [0, 0], [29, -4, 1], [27, -18], [24, -44], [19, -64], [10, -70], [0, -71]], true);
    P.shape(body, kim);
    // obi with the red obi-age knotted at the back
    const ob = sp([[-24, -44], [24, -44], [24.5, -34], [-24.5, -34]], true);
    P.shape(ob, K.obi, 0.5);
    const oa = new Path2D();
    const wv = Math.max(2.4, 1.4 * P.inv);
    taperTo(oa, [[-23, -44.5], [0, -45.5], [23, -44.5]], wv, wv, 0);
    oa.ellipse(-5, -40, 6, 4.2, -0.3, 0, TAU);
    oa.ellipse(5, -40, 6, 4.2, 0.3, 0, TAU);
    P.shape(oa, K.obiage, 0.4);
    // sleeves at the sides
    for (const s of [-1, 1]) {
      const sl = sp([[s * 18, -64], [s * 27, -52], [s * 30, -30], [s * 28, -20, 1], [s * 20, -22, 1], [s * 19, -44]], true);
      P.shape(sl, kim, 0.9);
    }
    // head: okappa from behind, tilting up
    const hy = -84 + look * 2;
    ctx.save();
    ctx.translate(0, hy);
    ctx.scale(1, 1 - look * 0.12);
    const nape = new Path2D();
    nape.rect(-4, 6, 8, 6);
    P.fill(nape, K.skin);
    const hd = sp([[-13, 7, 1], [-14.5, -4], [-11, -13], [0, -16], [11, -13], [14.5, -4], [13, 7, 1]], true);
    P.shape(hd, K.hair, 0.6, 0.85);
    if (P.hi) P.folds([[[[-6, -12], [-8, -2], [-8, 6]], 0.3, 0.1], [[[5, -12], [7, -2], [7, 6]], 0.3, 0.1]], 0.35);
    ctx.restore();
    return { head: [0, hy] };
  }

  function drawChild(ctx, P, o, K) {
    const t = o.t, pose = o.pose;
    if (pose === 'kneel-back') return childBack(ctx, P, o, K);
    if (pose === 'sleep') return sleepingChild(P, 0, -12, o, K, o.haoriPalette || GRANDMA, o.haori !== false);
    if (pose === 'steal') {
      // a small arm rising from below the engawa lip (anchor = the lip), reaching up and in
      const rch = o.reach == null ? 1 : U.clamp(o.reach);
      const hx = 8 + rch * 10, hy = -8 - rch * 38;
      const sl = sp([[-7, 30], [-6, 6], [hx - 6, hy + 10], [hx - 2, hy - 1, 1], [hx + 6, hy + 2, 1], [8, 8], [9, 30]], true);
      P.shape(sl, P.fx && P.s >= 0.5 ? kasuri(ctx, K.kimono, K.kimonoFg, 8) : K.kimono);
      const hd = new Path2D();
      hd.ellipse(hx + 3, hy - 4, 4.4, 3.4, -1.1, 0, TAU);
      P.shape(hd, K.skin, 0.55);
      if (o.dango) {
        const d = new Path2D();
        d.ellipse(hx + 4, hy - 9, 4.6, 4.3, 0, 0, TAU);
        P.shape(d, K.dango, 0.5);
      }
      return { hand: [hx + 3, hy - 4] };
    }
    const q = childPose(o);
    const J = rig(q, CHILD_D);
    if (q.bob) ctx.translate(0, q.bob);
    const kim = P.fx && P.s >= 0.5 ? kasuri(ctx, K.kimono, K.kimonoFg, 8) : K.kimono;
    const G = {
      kimono: K.kimono, bodyFill: kim, sleeveFill: kim, lining: K.lining, obi: K.obi, obiage: K.obiage, pants: K.skin, sandal: K.sandal,
      hem: pose === 'sit' ? 30 : 34, width: 0.92, long: pose === 'sit', feet: K.skin, sleeveW: 10, sleeveDepth: 13, obiAt: 0.42, obiW: 7, footK: 0.7,
    };
    const ret = {};
    if (pose === 'carry-susuki') {
      // the sheaf rests on the near shoulder; stems behind the head
      const h = J.armN[2];
      kimonoBody(P, J, K, Object.assign({}, G, { skipArmN: true }), t);
      susukiSheaf(P, h[0], h[1], o.sheaf == null ? 300 : o.sheaf, K, t, P.wind);
      const sl = sleevePath(J.armN, 10 * 0.92, 13, true);
      P.shape(sl.path, kim, 0.95);
      P.shape(handPath(J.armN, 9, true), K.skin, 0.6);
      ret.hand = h;
    } else kimonoBody(P, J, K, G, t);
    ctx.save();
    ctx.translate(J.head[0], J.head[1]);
    ctx.scale(1.08, 1.08);
    const hb = q.run ? Math.sin(t * TAU * 3) * 0.04 : 0;
    head(P, 0, 0, J.s2 * 0.6 + (q.neck || 0) + hb, K, o.boy ? 'boy' : 'girl', { cry: q.cry || o.cry, t });
    ctx.restore();
    ret.head = J.head;
    ret.hands = [J.armN[2], J.armF[2]];
    return ret;
  }
  define('child', {
    poses: ['stand', 'carry-susuki', 'run', 'kneel-back', 'reach', 'sleep', 'steal', 'sit', 'reach-up'], defaults: {},
    bounds(pose, o) {
      if (pose === 'carry-susuki') { const L = o.sheaf == null ? 300 : o.sheaf; return [-L * 0.7, -L - 30, L * 0.7 + 50, L + 36]; }
      if (pose === 'run') return [-50, -165, 105, 172];
      if (pose === 'kneel-back') return [-36, -104, 72, 110];
      if (pose === 'reach') return [-40, -110, 120, 116];
      if (pose === 'sleep') return [-20, -50, 162, 64];
      if (pose === 'steal') return [-16, -60, 40, 96];
      if (pose === 'reach-up') return [-40, -195, 85, 200];
      if (pose === 'sit') return [-45, -110, 100, 115];
      return [-35, -150, 75, 155];
    },
    draw(ctx, P, o) { return drawChild(ctx, P, o, pal(CHILD_SAYO, o)); },
  });

  /* ================================================================== */
  /* guard — 衛府 archers of the Emperor (alias: samurai)                 */
  /* ================================================================== */
  const GUARD = {
    skin: U.mix(C.gofun, C.kitsune, 0.3),
    hair: '#161412',
    robe: C.ai,
    robeFg: U.mix(C.ai, C.gunjo, 0.4),
    lining: C.akane,
    obi: U.mix(C.sumi, C.ai, 0.2),
    hakama: C.kinari,
    cap: '#181715',
    bow: U.mix(C.sumi, C.kitsune, 0.35),
    string: C.gofun,
    quiver: C.kitsune,
    feather: C.gofun,
    sandal: C.sumi,
  };
  const GUARD_D = { torso: 90, neck: 21, upper: 43, fore: 40, thigh: 53, shin: 51, sole: 7, knee: 7 };
  function drawGuard(ctx, P, o, K) {
    const pose = o.pose;
    let q;
    if (pose === 'aim') q = { spine: -0.04, hunch: 0.02, neck: 0.05, legN: [0.34, 0.1], legF: [-0.3, -0.2], armN: [1.58, 1.55], armF: [1.9, -2.2] };
    else if (pose === 'kneel') q = { kneel: true, spine: 0.06, hunch: 0.1, neck: 0.05, legN: [1.55, 0.05], legF: [0.35, -1.6], armN: [0.5, 1.2], armF: [0.1, 0.3], one: true };
    else q = { spine: 0.02, hunch: 0.05, neck: 0, legN: [0.1, 0.03], legF: [-0.08, -0.1], armN: [0.35, 1.3], armF: [0.1, 0.25] };
    const D = GUARD_D;
    const J = rigAt(q, D, [0, 0]);
    // ground: standing on feet, or kneeling on the far knee with the near foot planted
    let low = Math.max(J.legN[2][1], J.legF[2][1]) + D.sole;
    if (q.one) low = Math.max(J.legF[1][1] + D.knee, J.legN[2][1] + D.sole);
    const JJ = rigAt(q, D, [0, -low]);
    // quiver (ebira) behind the back with a fan of arrows
    const n1 = nrmF(JJ.s1);
    const qb = [JJ.mid[0] - n1[0] * 18, JJ.mid[1] - n1[1] * 18];
    if (P.mid) {
      const ar = new Path2D();
      for (let i = 0; i < 5; i++) {
        const a = -0.55 + i * 0.12;
        taperTo(ar, [[qb[0], qb[1] + 10], [qb[0] + Math.sin(a) * 58, qb[1] - Math.cos(a) * 58]], 1.4, 1.2, 0);
      }
      P.fill(ar, K.bow);
      const fe = new Path2D();
      for (let i = 0; i < 5; i++) {
        const a = -0.55 + i * 0.12;
        const tip = [qb[0] + Math.sin(a) * 58, qb[1] - Math.cos(a) * 58];
        fe.ellipse(tip[0] - Math.sin(a) * 6, tip[1] + Math.cos(a) * 6, 2.4, 7, a, 0, TAU);
      }
      P.shape(fe, K.feather, 0.4);
    }
    const qv = sp([[qb[0] - 8, qb[1] - 6, 1], [qb[0] + 8, qb[1] - 8, 1], [qb[0] + 7, qb[1] + 24, 1], [qb[0] - 7, qb[1] + 26, 1]], true);
    P.shape(qv, K.quiver, 0.8);
    // bow behind for stand/kneel (held upright in the near hand)
    const bowAt = (cx, cy, h, bend, a) => {
      const pts = [];
      for (let i = 0; i <= 10; i++) {
        const s = i / 10, y = (s - 0.62) * h;
        pts.push([cx - Math.sin(s * Math.PI) * bend + Math.sin(a) * y, cy + y * Math.cos(a)]);
      }
      return pts;
    };
    const G = {
      kimono: K.robe, lining: K.lining, obi: K.obi, pants: K.hakama, sandal: K.sandal, feet: K.sandal,
      hem: 56, sleeveW: 13.5, sleeveDepth: 18, obiAt: 0.3, width: 1.05, pattern: ['kumo', K.robeFg, 10, 0.5],
    };
    kimonoBody(P, JJ, K, G, o.t);
    // head with kanmuri + 緌 (oikake fan ear-flaps)
    const ha = JJ.s2 * 0.6 + (q.neck || 0);
    head(P, JJ.head[0], JJ.head[1], ha, K, 'man', o);
    ctx.save();
    ctx.translate(JJ.head[0], JJ.head[1]);
    ctx.rotate(ha);
    const cap = sp([[-12, -7, 1], [-11, -16], [-4, -19], [5, -16], [8, -8, 1]], true);
    P.shape(cap, K.cap, 0.7);
    const knot = sp([[-6, -18], [-8, -27], [-2, -28], [0, -18]], true);
    P.shape(knot, K.cap, 0.6);
    const fan = new Path2D();
    fan.moveTo(-4, 3);
    fan.arc(-4, 3, 8, -2.5, 0.2);
    fan.closePath();
    P.shape(fan, K.cap, 0.5, 0.7);
    if (P.mid) {
      const rib = new Path2D();
      for (let i = 0; i < 4; i++) { const a = -2.3 + i * 0.6; rib.moveTo(-4, 3); rib.lineTo(-4 + Math.cos(a) * 7.5, 3 + Math.sin(a) * 7.5); }
      ctx.strokeStyle = U.rgba(C.gofun, 0.35); ctx.lineWidth = P.lw * 0.4; ctx.stroke(rib);
    }
    ctx.restore();
    // bow & arrow
    if (pose === 'aim') {
      const h = JJ.armN[2];
      const draw = JJ.armF[2];
      const pts = bowAt(h[0] + 4, h[1], 170, -26, 0);
      const bw = new Path2D();
      taperTo(bw, pts, 2.2, 2.2, 0.8);
      P.shape(bw, K.bow, 0.5);
      if (!P.sil) {
        const str = new Path2D();
        str.moveTo(pts[0][0], pts[0][1]); str.lineTo(draw[0] + 2, draw[1]); str.lineTo(pts[10][0], pts[10][1]);
        ctx.strokeStyle = U.rgba(K.string, 0.9); ctx.lineWidth = Math.max(P.lw * 0.35, 0.6 * P.inv); ctx.stroke(str);
      }
      const ar = new Path2D();
      taperTo(ar, [[draw[0] - 4, draw[1]], [h[0] + 30, h[1]]], 1.6, 1.6, 0);
      P.fill(ar, K.bow);
      const tp = sp([[h[0] + 30, h[1] - 2.6], [h[0] + 36, h[1], 1], [h[0] + 30, h[1] + 2.6]], true);
      P.fill(tp, K.blade || C.ginnezu);
      P.shape(handPath(JJ.armN, 10, true), K.skin, 0.6);
      P.shape(handPath(JJ.armF, 10, true), K.skin, 0.6);
    } else {
      const h = JJ.armN[2];
      const pts = bowAt(h[0] + 3, h[1] + 4, 175, pose === 'kneel' ? 10 : 12, pose === 'kneel' ? 0.1 : 0.06);
      const bw = new Path2D();
      taperTo(bw, pts, 2.3, 2.3, 0.8);
      P.shape(bw, K.bow, 0.5);
      if (!P.sil && P.mid) {
        const str = new Path2D();
        str.moveTo(pts[0][0], pts[0][1]); str.lineTo(pts[10][0], pts[10][1]);
        ctx.strokeStyle = U.rgba(K.string, 0.7); ctx.lineWidth = Math.max(P.lw * 0.3, 0.5 * P.inv); ctx.stroke(str);
      }
      P.shape(handPath(JJ.armN, 10, true), K.skin, 0.6);
    }
  }
  define('guard', {
    poses: ['stand', 'aim', 'kneel'], defaults: {},
    bounds(pose) { return pose === 'aim' ? [-70, -305, 190, 310] : pose === 'kneel' ? [-70, -250, 160, 255] : [-70, -310, 150, 315]; },
    draw(ctx, P, o) { drawGuard(ctx, P, o, pal(GUARD, o)); },
  });

  /* ================================================================== */
  /* 帝 — the Emperor in 束帯 sokutai                                    */
  /* ================================================================== */
  const MIKADO = {
    ho: '#1D1B20',
    hoFg: '#302D35',
    rev: C.nezumi,
    under: [U.mix(C.beni, C.akane, 0.5), C.gofun, U.mix(C.beni, C.akane, 0.5)], // 下襲 / 衵 / 単 at the cuffs
    hakama: C.gofun,
    okuchi: U.mix(C.beni, C.akane, 0.5),
    kyo: U.mix(C.gofun, C.torinoko, 0.25),
    kyoFg: U.mix(C.ginnezu, C.gofun, 0.35),
    shaku: C.torinoko,
    cap: '#141312',
    skin: C.gofun,
    hair: '#141312',
    shoes: '#141312',
    hirao: C.murasaki,
    hiraoFg: C.kin,
  };

  function mikadoHead(P, x, y, look, K) {
    const ctx = P.ctx;
    const up = look < -0.15;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(look);
    // hair at the back of the head below the cap
    const hr = sp([[-4, -8], [-13, -6], [-15, 4], [-10, 11], [-4, 9], [-3, 0]], true);
    P.fill(hr, K.hair);
    face(P, 1, 0, 22, up ? 'up' : 'q', 'man', K.skin, 0.06);
    if (P.mid) {
      // thin moustache and a wisp of beard
      const m = new Path2D();
      taperTo(m, [[1.5, 6.2], [4.5, 5.6], [7, 6.4]], 0.9, 0.3, 0);
      taperTo(m, [[3.5, 10.5], [3.8, 12.5], [3.2, 14]], 1.4, 0.4, 0);
      P.strokes(m, 0.7);
    }
    P.line(hr, 0.5, 0.7);
    // kanmuri: lacquered cap, koji behind, the upright ei (立纓)
    const cap = sp([[-15, -4, 1], [-14, -13], [-7, -19], [4, -19], [11, -14], [12, -7, 1]], true);
    P.shape(cap, K.cap, 0.7);
    const koji = sp([[-9, -16, 1], [-9, -27], [-5, -31], [1, -30], [2, -18, 1]], true);
    P.shape(koji, K.cap, 0.6);
    const ei = new Path2D();
    taperTo(ei, crs([[-6, -29], [-7.5, -44], [-9, -58], [-13, -68], [-19, -71]], 4), 3.8, 3.2, 0);
    P.shape(ei, K.cap, 0.5);
    if (P.mid) {
      const band = new Path2D();
      taperTo(band, [[-15, -6.5], [-2, -7.5], [11.5, -8.5]], 1.2, 1.2, 0);
      ctx.fillStyle = U.rgba(C.nezumi, 0.5);
      if (P.fx) ctx.fill(band);
    }
    ctx.restore();
  }

  function drawMikado(ctx, P, o, K) {
    const t = o.t, pose = o.pose;
    const w = P.wind;
    const tr = o.train == null ? 1 : o.train;
    const sw = swayFn(t, w, 1.7);
    const kneel = pose === 'kneel';
    const walk = pose === 'walk';
    const ph = t * TAU * 0.32;
    const st = walk ? Math.sin(ph) : 0;
    const L = K.under;
    if (kneel) {
      // train trailing behind on the floor
      const ky = sp([[-40, -40, 1], [-70, -8], [-140 * tr - 60, -2 + sw], [-150 * tr - 70, 5, 1], [-60, 6], [-30, 0, 1]], true);
      P.fill(ky, P.pat('kikko', K.kyoFg, K.kyo, 8, 0.7));
      P.line(ky, 0.85);
      // robe mound
      const body = sp([
        [4, -148], [-12, -143], [-24, -122], [-34, -90], [-46, -52], [-58, -18], [-66, -2, 1], [-10, 5], [58, 3], [72, -2, 1],
        [66, -22], [54, -50], [40, -84], [30, -118], [24, -140], [16, -148],
      ], true);
      P.fill(body, P.pat('shippo', K.hoFg, K.ho, 9, 0.9));
      P.line(body);
      if (P.mid) {
        const f = new Path2D();
        taperTo(f, crs([[-18, -100], [-30, -50], [-44, -4]], 4), P.lw * 0.7, P.lw * 0.1, 0.1);
        taperTo(f, crs([[40, -40], [52, -16], [58, 0]], 4), P.lw * 0.6, P.lw * 0.1, 0.1);
        P.strokes(f, 0.5, K.rev);
      }
      const ok = sp([[40, -8], [70, -6], [74, 2, 1], [44, 3, 1]], true);
      P.shape(ok, K.okuchi, 0.6);
      // sleeves in the lap with layered cuffs; shaku held upright
      const at = (e) => sp([[-4, -140], [-16, -118], [-22, -84], [-18, -56], [0, -44], [40 + e, -50 + e * 0.2, 1], [40 + e, -80, 1], [28, -92], [14, -118]], true);
      const sl = kasane(P, [K.ho].concat(L), at, false, P.pat('shippo', K.hoFg, K.ho, 9, 0.9));
      P.line(sl);
      P.rline(sl, K.rev, 0.55, 0.8);
      const sk = sp([[35, -122, 1], [42, -121, 1], [40, -80, 1], [34, -80, 1]], true);
      P.shape(sk, K.shaku, 0.7);
      const col = new Path2D();
      taperTo(col, [[4, -148], [10, -146], [17, -148]], 5, 5, 0);
      P.shape(col, K.ho, 0.6);
      mikadoHead(P, 10, -162, o.look == null ? 0.1 : o.look, K);
      return;
    }
    const gaze = pose === 'gaze';
    // 裾 kyo: the long train from the back waist along the floor
    const tx = -60 - 190 * tr;
    const ky = sp([
      [-34, -120, 1], [-50, -60], [-80, -16], [tx * 0.6, -4 + sw], [tx + sw * 4, -1], [tx - 2 + sw * 4, 5, 1], [tx * 0.55, 6], [-50, 4], [-26, -40],
    ], true);
    P.fill(ky, P.pat('kikko', K.kyoFg, K.kyo, 8, 0.7));
    P.line(ky, 0.85);
    // legs: white 表袴 with the red 大口 at the hem, black shoes
    const leg = (x0, dx, far) => {
      const p = sp([[x0 - 13, -84], [x0 + 13, -84], [x0 + 15 + dx * 0.6, -30], [x0 + 18 + dx, -6, 1], [x0 - 12 + dx, -6, 1], [x0 - 14 + dx * 0.4, -40]], true);
      P.shape(p, far ? U.shade(K.hakama, 0.92) : K.hakama, 0.9);
      const hem = sp([[x0 - 12 + dx, -12, 1], [x0 + 18 + dx, -12, 1], [x0 + 18 + dx, -6, 1], [x0 - 12 + dx, -6, 1]], true);
      P.shape(hem, K.okuchi, 0.5);
      const sh = sp([[x0 - 10 + dx, -7, 1], [x0 + 16 + dx, -8], [x0 + 22 + dx, -3], [x0 + 20 + dx, 0, 1], [x0 - 10 + dx, 0, 1]], true);
      P.shape(sh, K.shoes, 0.6);
    };
    leg(-14, -st * 18, true);
    leg(8, st * 18, false);
    // 袍 body: broad, dark, to below the knee; 襴 band at the hem
    const hs = walk ? st * 5 : 0;
    const body = sp([
      [-2, -254], [-18, -248], [-29, -228], [-35, -192], [-40, -150], [-46, -112], [-54 + hs, -76, 1],
      [-6, -71], [48 + hs, -74, 1], [42, -112], [36, -152], [31, -196], [27, -234], [16, -251],
    ], true);
    P.fill(body, P.pat('shippo', K.hoFg, K.ho, 9, 0.9));
    P.line(body);
    if (P.mid) {
      const f = new Path2D();
      taperTo(f, crs([[-52 + hs, -94], [-4, -90], [44 + hs, -92]], 4), P.lw * 0.6, P.lw * 0.6, 0);
      taperTo(f, crs([[-18, -150], [-28, -110], [-36, -80]], 4), P.lw * 0.7, P.lw * 0.1, 0.1);
      taperTo(f, crs([[10, -140], [12, -100], [14, -76]], 4), P.lw * 0.6, P.lw * 0.1, 0.1);
      P.strokes(f, 0.5, K.rev);
    }
    // 平緒 ornamental sash hanging in front
    if (P.mid) {
      const hi = new Path2D();
      taperTo(hi, crs([[20, -150], [22 + sw, -120], [24 + sw * 1.5, -86]], 4), 6, 5, 0);
      P.fill(hi, P.pat('same', K.hiraoFg, K.hirao, 4, 0.9));
      P.line(hi, 0.4, 0.7);
    }
    // far sleeve (cuff peeking), near sleeve with layered cuff
    const SL = [K.ho].concat(L);
    const farAt = (e) => sp([[18, -214], [40 + e, -210, 1], [46 + e, -140 + e * 0.2, 1], [30, -134], [18, -170]], true);
    const fs = kasane(P, SL, farAt, false, P.pat('shippo', K.hoFg, K.ho, 9, 0.9));
    P.line(fs);
    P.rline(fs, K.rev, 0.5, 0.6);
    const nearAt = (e) => sp([
      [-9, -247], [-17, -226], [-22, -196], [-26, -160], [-28, -132], [-22, -114], [-8, -108], [14, -110], [36 + e + hs * 0.3, -118 + e * 0.25, 1],
      [35 + e, -160], [33 + e, -205, 1], [22, -212], [10, -224], [0, -238],
    ], true);
    const ns = kasane(P, SL, nearAt, false, P.pat('shippo', K.hoFg, K.ho, 9, 0.9));
    P.line(ns);
    P.rline(ns, K.rev, 0.55, 0.8);
    if (P.mid) {
      const f = new Path2D();
      taperTo(f, crs([[-14, -200], [-16, -160], [-12, -116]], 4), P.lw * 0.7, P.lw * 0.1, 0.1);
      taperTo(f, crs([[10, -206], [14, -160], [18, -114]], 4), P.lw * 0.6, P.lw * 0.1, 0.1);
      P.strokes(f, 0.55, K.rev);
    }
    // shaku held before the chest (lowered when gazing up)
    const sk = gaze ? sp([[38, -178, 1], [44, -176, 1], [46, -136, 1], [40, -137, 1]], true) : sp([[30, -236, 1], [37, -236, 1], [36, -192, 1], [30, -192, 1]], true);
    P.shape(sk, K.shaku, 0.7);
    // round collar (盤領)
    const col = sp([[-3, -256], [8, -261], [18, -256], [17, -249], [8, -252], [-2, -249]], true);
    P.shape(col, K.ho, 0.6);
    mikadoHead(P, 8, -272, o.look != null ? o.look : gaze ? -0.5 : 0.08, K);
  }

  define('mikado', {
    poses: ['stand', 'walk', 'kneel', 'gaze'],
    defaults: {},
    bounds(pose, o) {
      const tr = o.train == null ? 1 : o.train;
      if (pose === 'kneel') return [-80 - 150 * tr, -240, 160 + 150 * tr, 248];
      return [-70 - 190 * tr, -350, 130 + 190 * tr, 358];
    },
    draw(ctx, P, o) { drawMikado(ctx, P, o, pal(MIKADO, o)); },
  });

  /* ================================================================== */
  /* 天女 — celestial maiden / envoy (飛天)                               */
  /* fly: anchor = body centre (waist); stand: anchor = foot of her cloud */
  /* ================================================================== */
  const TENNYO = {
    skin: C.gofun,
    hair: '#151413',
    robe: C.gofun,
    robeIn: U.mix(C.tsukiKi, C.gofun, 0.35),
    skirt: U.mix(C.shu, C.akane, 0.35),
    skirtIn: U.mix(C.toki, C.gofun, 0.3),
    hem: C.kin,
    ribbon: U.mix(C.asagi, C.gofun, 0.35),
    ribbonIn: U.mix(C.rokusho, C.asagi, 0.5),
    gold: C.kin,
    cloud: C.gofun,
    cloudIn: U.mix(C.tsukiKi, C.gofun, 0.3),
    wood: U.mix(C.kitsune, C.enji, 0.25),
    pipe: U.mix(C.kuchiba, C.aotake, 0.25),
  };

  function instrument(P, kind, x, y, a, K) {
    const ctx = P.ctx;
    if (!kind || kind === 'none') return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    if (kind === 'flute') {
      const f = new Path2D();
      f.roundRect(-6, -1.6, 46, 3.2, 1.6);
      P.shape(f, K.wood, 0.6);
      if (P.mid) { const h = new Path2D(); for (let i = 0; i < 5; i++) h.ellipse(16 + i * 5, 0, 0.8, 0.8, 0, 0, TAU); P.fill(h, C.sumi); }
    } else if (kind === 'sho') {
      const b = new Path2D();
      for (let i = -3; i <= 3; i++) {
        const hgt = 24 + (3 - Math.abs(i)) * 3 - (i === 1 ? 5 : 0);
        b.roundRect(i * 2.6 - 1.2, -hgt, 2.4, hgt, 1);
      }
      P.shape(b, K.pipe, 0.45);
      const cup = new Path2D();
      cup.ellipse(0, 1, 9.5, 5, 0, 0, TAU);
      P.shape(cup, K.wood, 0.6);
      const mp = new Path2D();
      mp.roundRect(7, -1, 7, 3, 1);
      P.shape(mp, K.gold, 0.5);
    } else if (kind === 'lute') {
      const body = sp([[0, -20], [10, -14], [14, 2], [9, 16], [0, 20], [-9, 16], [-14, 2], [-10, -14]], true);
      P.shape(body, K.wood, 0.8);
      const neck = new Path2D();
      taperTo(neck, [[0, -18], [0, -34], [-5, -40]], 4.5, 3.2, 0);
      P.shape(neck, K.wood, 0.6);
      if (P.mid) {
        const st = new Path2D();
        for (let i = -1.5; i <= 1.5; i++) { st.moveTo(i * 1.4, -32); st.lineTo(i * 2.2, 12); }
        ctx.strokeStyle = U.rgba(C.gofun, 0.6); ctx.lineWidth = P.lw * 0.25; if (!P.sil) ctx.stroke(st);
        const pb = new Path2D(); pb.rect(-6, 6, 12, 3.5); P.shape(pb, K.gold, 0.4);
        const hole = new Path2D(); hole.ellipse(-5, -4, 1.6, 3, 0.2, 0, TAU); hole.ellipse(5, -4, 1.6, 3, -0.2, 0, TAU); P.fill(hole, C.sumi);
      }
    }
    ctx.restore();
  }

  /** Hair with the tall double loop (宝髻) — local head frame, 3/4 toward +x. */
  function tennyoHair(P, K, t, flow) {
    const loops = new Path2D();
    loops.ellipse(-3, -22, 5.2, 8.5, -0.25, 0, TAU);
    loops.ellipse(6, -23, 4.6, 7.5, 0.3, 0, TAU);
    P.shape(loops, K.hair, 0.55, 0.85);
    if (!P.sil && P.mid) {
      const hole = new Path2D();
      hole.ellipse(-3, -22.5, 2, 4.5, -0.25, 0, TAU);
      hole.ellipse(6, -23.5, 1.8, 4, 0.3, 0, TAU);
      P.flat(hole, K.bg || C.kinari);
      P.line(hole, 0.35, 0.6);
    }
    const cap = sp([[4, -10.5, 1], [0, -8], [-3.5, -1], [-6, 8], [-10, 13], [-16, 8], [-18, -3], [-15, -12], [-7, -17], [3, -17], [9, -14], [10.5, -8], [9, -6, 1]], true);
    P.shape(cap, K.hair, 0.5, 0.85);
    if (P.mid) {
      const orn = new Path2D();
      orn.ellipse(1, -15.5, 2.4, 1.6, 0, 0, TAU);
      orn.ellipse(-9, -14, 1.8, 1.3, 0, 0, TAU);
      P.shape(orn, K.gold, 0.4);
    }
    void flow; void t;
  }

  /** A travelling-wave ribbon from p0 heading along ang for len; rippling with t, curling at the end. */
  function ribbonPts(p0, ang, len, amp, t, k, seed, curl) {
    const pts = [];
    const c = Math.cos(ang), s = Math.sin(ang);
    const n = 12;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const wave = Math.sin(u * 6.0 - t * 2.2 * k + seed) * amp * (0.25 + u) + (curl || 0) * u * u * 50;
      pts.push([p0[0] + c * len * u - s * wave, p0[1] + s * len * u + c * wave]);
    }
    // curl the tip back on itself
    const a = pts[n - 1], b = pts[n];
    const d = unit(a, b), nn = [-d[1], d[0]];
    const cs = (curl || 0) >= 0 ? 1 : -1;
    pts.push([b[0] + d[0] * 8 + nn[0] * 6 * cs, b[1] + d[1] * 8 + nn[1] * 6 * cs]);
    pts.push([b[0] + d[0] * 4 + nn[0] * 12 * cs, b[1] + d[1] * 4 + nn[1] * 12 * cs]);
    return pts;
  }

  /** Tang-style sleeve on a 3-joint arm with a flap trailing toward -x (flight / wind). */
  function tennyoArm(P, s, e, h, K, t, far, flow) {
    const col = far ? U.shade(K.robe, 0.9) : K.robe;
    const d = unit(e, h), n = [-d[1], d[0]];
    const f = (flow == null ? 1 : flow);
    const wv = Math.sin(t * 2.4 + (far ? 1.3 : 0)) * 3 * f;
    const sleeve = sp([
      [s[0] - 4, s[1] - 5], [e[0] - n[0] * 5, e[1] - n[1] * 5], [h[0] - n[0] * 4.5, h[1] - n[1] * 4.5, 1], [h[0] + n[0] * 5, h[1] + n[1] * 5, 1],
      [h[0] + n[0] * 8 - d[0] * 10 - 6 * f, h[1] + n[1] * 8 - d[1] * 10 + 10 + wv, 1],
      [e[0] + n[0] * 6 - 14 * f, e[1] + n[1] * 6 + 14 + wv], [e[0] + n[0] * 5, e[1] + n[1] * 5], [s[0] + 3, s[1] + 6],
    ], true);
    P.shape(sleeve, col, 0.85);
    if (P.mid) {
      const cf = new Path2D();
      taperTo(cf, [[h[0] - n[0] * 4.5, h[1] - n[1] * 4.5], [h[0] + n[0] * 5, h[1] + n[1] * 5]], 2.2, 2.2, 0);
      P.fill(cf, K.gold);
    }
    const hd = new Path2D();
    hd.ellipse(h[0] + d[0] * 4.5, h[1] + d[1] * 4.5, 5, 2.6, Math.atan2(d[1], d[0]), 0, TAU);
    P.shape(hd, K.skin, 0.5);
  }

  function drawTennyo(ctx, P, o, K) {
    const t = o.t;
    const inst = o.instrument || 'none';
    if (o.pose === 'stand') return tennyoStand(ctx, P, o, K, inst);
    const w = 0.55 + P.wind * 0.45;
    ctx.rotate(o.dir || 0);
    ctx.translate(0, Math.sin(t * 1.1) * 3);
    const sw = (u, k) => Math.sin(u * 4.5 - t * 2.1 * (k || 1)) * 7 * u * w;
    // far ribbon: arches over the back and streams far behind
    const rA = ribbonPts([10, -62], Math.PI + 0.05, 290, 16 * w, t, 1, 0.3, -0.5);
    const pa = new Path2D();
    taperTo(pa, crs([[52, -30], [46, -58], [28, -68]].concat(rA), 2), 7.5, 2, 0.2);
    P.shape(pa, U.shade(K.ribbon, 0.9), 0.6);
    // hair streaming back from the nape
    const hw = (u) => Math.sin(u * 4 - t * 2) * 4 * u * w;
    const hair = sp([[62, -46], [44, -44 + hw(0.2)], [20, -40 + hw(0.4)], [-6, -38 + hw(0.6)], [-34, -36 + hw(0.8)], [-58, -36 + hw(1), 1],
      [-30, -31 + hw(0.8)], [-4, -31 + hw(0.6)], [22, -32 + hw(0.4)], [46, -32]], true);
    P.shape(hair, K.hair, 0.6, 0.8);
    // skirt (裙): wraps the bent legs, hem streaming behind in tongues
    // bent legs (hiten): thighs back, shins rising behind; hem flutters off the ankles
    const skAt = (e) => sp([
      [16, -18], [-24, -16 + sw(0.2)], [-54, -10 + sw(0.3)], [-62, -14], [-66, -34], [-72, -56 - e * 0.3],
      [-104 - e * 1.2, -84 + sw(0.7) - e * 0.6, 1], [-92 - e * 0.4, -60 + sw(0.6)], [-138 - e * 1.6, -64 + sw(0.9, 1.1), 1],
      [-100 - e * 0.5, -42 + sw(0.7, 1.1)], [-136 - e * 1.5, -26 + sw(1, 1.2), 1], [-96 - e * 0.4, -20 + sw(0.6, 1.2)],
      [-88, 2], [-78, 14], [-44, 18 + sw(0.2, 1.2)], [12, 10],
    ], true);
    kasane(P, [K.skirt, K.skirtIn, K.hem], skAt);
    if (P.mid) P.folds([
      [[[-8, -6], [-44, -2], [-66, 0], [-78, -20], [-84, -42]], 0.7, 0.1],
      [[[-24, 8], [-56, 10], [-74, 4]], 0.6, 0.1],
    ], 0.65);
    // small bare feet at the ankles, toes pointing back
    const ft = sp([[-68, -52], [-74, -66], [-80, -76, 1], [-82, -66], [-76, -50]], true);
    P.shape(ft, K.skin, 0.6);
    // 裙帯: two long waist ribbons fluttering below
    const wr = (k, y0, len) => {
      const pts = [];
      for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push([10 - len * u, y0 + u * 46 + Math.sin(u * 5 - t * 2.6 + k) * 7 * u * w]); }
      return pts;
    };
    ribbons(P, [[crs(wr(0.3, 6, 150), 3), 4, 1.5, 0.1], [crs(wr(1.7, 10, 120), 3), 3.5, 1.2, 0.1]], K.gold, 0.5, 0.8);
    // far arm
    const hands = inst === 'flute' ? [[80, -44], [96, -41]] : inst === 'sho' ? [[76, -34], [80, -30]] : inst === 'lute' ? [[64, -16], [80, -36]] : [[100, -36], [62, -2]];
    tennyoArm(P, [50, -30], [58, -8], hands[1], K, t, true, 1);
    if (inst === 'lute') instrument(P, 'lute', 72, -24, 1.0, K);
    // torso: white upper robe, necklace, gold sash
    const torso = sp([[62, -38], [40, -36], [16, -24], [4, -10], [8, 8], [26, 6], [46, -6], [62, -22]], true);
    P.shape(torso, K.robe);
    if (P.mid) {
      const sash = new Path2D();
      taperTo(sash, [[10, -20], [12, -6], [14, 8]], 5, 5, 0);
      P.shape(sash, K.gold, 0.5);
      const neck = new Path2D();
      taperTo(neck, crs([[60, -38], [54, -30], [58, -22]], 3), 2.2, 2.2, 0);
      P.shape(neck, K.gold, 0.4);
    }
    // near arm
    tennyoArm(P, [46, -26], inst === 'none' ? [70, -24] : [60, -12], hands[0], K, t, false, 1);
    // head: 3/4, looking ahead, chin lifted
    ctx.save();
    ctx.translate(72, -52);
    ctx.rotate(-0.1);
    face(P, 2, 0, 19, 'q', 'lady', K.skin, 0.05);
    tennyoHair(P, K, t);
    ctx.restore();
    if (inst === 'flute') instrument(P, 'flute', 76, -46, 0.08, K);
    if (inst === 'sho') instrument(P, 'sho', 78, -34, -0.2, K);
    // near ribbon: from the elbow, looping under the body, streaming behind
    const rB = ribbonPts([10, 22], Math.PI - 0.06, 300, 18 * w, t, 1.15, 2.1, 0.45);
    const pb = new Path2D();
    taperTo(pb, crs([[64, -18], [58, 10], [36, 22]].concat(rB), 2), 8, 2, 0.2);
    P.shape(pb, K.ribbon, 0.6);
    if (P.mid) {
      const inn = new Path2D();
      taperTo(inn, crs(rB.slice(1, 12), 3), 2.4, 0.4, 0);
      taperTo(inn, crs(rA.slice(1, 12), 3), 2, 0.4, 0);
      P.strokes(inn, 0.85, K.ribbonIn);
    }
  }

  /** Standing on a small cloud (procession / 来迎): 3/4 toward +x, playing. */
  function tennyoStand(ctx, P, o, K, inst) {
    const t = o.t, w = 0.45 + P.wind * 0.55;
    const drift = Math.sin(t * 0.9) * 2;
    // 来迎雲: lobed cloud with curling swirls and a long tail
    const cl = sp([[-56, -4], [-58, -18], [-44, -30], [-26, -30], [-14, -40], [6, -42], [22, -34], [40, -40], [58, -32], [66, -16], [60, -2],
      [20, 4], [-40, 2], [-100, 0 + drift], [-160, -10 + drift * 1.5], [-196, -20 + drift * 2, 1], [-150, -18 + drift], [-96, -14]], true);
    P.shape(cl, K.cloud, 0.8);
    if (P.mid) {
      const sw = new Path2D();
      for (const [cx, cy, r] of [[-36, -16, 9], [-2, -24, 11], [36, -22, 10]]) {
        sw.moveTo(cx - r, cy + 2);
        sw.bezierCurveTo(cx - r, cy - r * 1.1, cx + r, cy - r * 1.1, cx + r * 0.6, cy);
        sw.bezierCurveTo(cx + r * 0.3, cy + r * 0.5, cx - r * 0.3, cy + r * 0.3, cx - r * 0.2, cy - r * 0.2);
      }
      P.line(sw, 0.5, 0.55);
      const tl = new Path2D();
      tl.moveTo(-70, -8); tl.bezierCurveTo(-110, -6 + drift, -140, -12 + drift, -176, -18 + drift * 2);
      P.line(tl, 0.45, 0.5);
    }
    ctx.translate(0, -30);
    // ribbons hang from the elbows and swing back in S-curves
    const rA = ribbonPts([-30, -112], 1.92, 150, 12 * w, t, 0.9, 0.5, -0.6);
    const rB = ribbonPts([30, -108], 1.75, 150, 12 * w, t, 1.1, 1.9, 0.5);
    const pa = new Path2D();
    taperTo(pa, crs([[-6, -156], [-28, -140]].concat(rA), 2), 6, 1.6, 0.2);
    P.shape(pa, U.shade(K.ribbon, 0.9), 0.6);
    // skirt to the cloud, flaring, hem layers
    const sk = (e) => sp([[-18, -98], [-24, -60], [-32 - e, -22], [-40 - e * 1.2, 0, 1], [0, 3 + e * 0.3], [38 + e * 1.2, 0, 1], [30 + e, -24], [22, -60], [16, -98]], true);
    kasane(P, [K.skirt, K.skirtIn, K.hem], sk);
    if (P.mid) P.folds([[[[-6, -80], [-10, -40], [-14, -4]], 0.7, 0.1], [[[8, -80], [12, -40], [16, -4]], 0.6, 0.1]], 0.7);
    const hands = inst === 'flute' ? [[26, -170], [40, -168]] : inst === 'sho' ? [[20, -160], [24, -156]] : inst === 'lute' ? [[16, -120], [28, -144]] : [[30, -130], [16, -124]];
    tennyoArm(P, [10, -150], [16, -122], hands[1], K, t, true, 0.35);
    if (inst === 'lute') instrument(P, 'lute', 20, -130, 0.6, K);
    const body = sp([[-10, -158], [-20, -150], [-24, -124], [-20, -96], [0, -92], [18, -96], [22, -124], [18, -150], [8, -158]], true);
    P.shape(body, K.robe);
    if (P.mid) {
      const sash = new Path2D();
      taperTo(sash, [[-22, -104], [0, -101], [20, -104]], 5, 5, 0);
      P.shape(sash, K.gold, 0.5);
      const neck = new Path2D();
      taperTo(neck, crs([[-8, -157], [0, -148], [8, -156]], 3), 2.2, 2.2, 0);
      P.shape(neck, K.gold, 0.4);
    }
    tennyoArm(P, [-8, -150], [-4, -122], hands[0], K, t, false, 0.35);
    ctx.save();
    ctx.translate(2, -174);
    face(P, 2, 0, 19, 'q', 'lady', K.skin, 0.08);
    tennyoHair(P, K, t);
    ctx.restore();
    if (inst === 'flute') instrument(P, 'flute', 10, -170, 0.06, K);
    if (inst === 'sho') instrument(P, 'sho', 14, -162, -0.12, K);
    const pb = new Path2D();
    taperTo(pb, crs([[12, -150], [30, -118]].concat(rB), 2), 6.5, 1.6, 0.2);
    P.shape(pb, K.ribbon, 0.6);
    if (P.mid) {
      const inn = new Path2D();
      taperTo(inn, crs(rB.slice(1, 12), 3), 2, 0.3, 0);
      P.strokes(inn, 0.8, K.ribbonIn);
    }
  }

  define('tennyo', {
    poses: ['fly', 'stand'],
    defaults: {},
    bounds(pose) {
      if (pose === 'stand') return [-205, -242, 285, 272];
      return [-345, -175, 470, 350];
    },
    draw(ctx, P, o) { drawTennyo(ctx, P, o, pal(TENNYO, o)); },
  });

  /* ================================================================== */
  /* 狐 — the fox (white Inari fox, or golden: opts.color = 'gold')       */
  /* design units ×0.55: a sitting fox is ~85 px tall at scale 1          */
  /* ================================================================== */
  const FOX_WHITE = { fur: C.gofun, belly: C.gofun, tip: C.gofun, mark: C.shu, ear: U.mix(C.shu, C.toki, 0.5), eye: C.shu, nose: C.sumi, sock: C.gofun };
  const FOX_GOLD = { fur: U.mix(C.yamabuki, C.kitsune, 0.45), belly: C.kinari, tip: C.kinari, mark: C.sumi, ear: U.mix(C.kitsune, C.sumi, 0.35), eye: C.yamabuki, nose: C.sumi, sock: U.mix(C.kitsune, C.sumi, 0.45) };

  function foxHead(P, x, y, a, K, t, hm) {
    const ctx = P.ctx;
    hm = hm || {};
    const sx = hm.sx == null ? 1 : hm.sx;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(a);
    if (sx !== 1) ctx.scale(Math.abs(sx) < 0.12 ? 0.12 * Math.sign(sx || 1) : sx, 1);
    const tw = Math.sin((t || 0) * 0.7) * 0.05;
    const earF = sp([[-8, -8], [-10 + tw * 20, -28, 1], [4, -11]], true);
    P.shape(earF, U.shade(K.fur, 0.92), 0.8);
    const hd = sp([[-15, -1], [-10, -12], [2, -15], [14, -10], [26, -4], [38, 1, 1], [34, 4.5], [24, 8], [10, 12], [-4, 13], [-14, 8]], true);
    P.shape(hd, K.fur);
    const earN = sp([[0, -11], [5 + tw * 20, -31, 1], [15, -8]], true);
    P.shape(earN, K.fur, 0.9);
    if (!P.sil && P.mid) {
      const ie = sp([[4, -12], [5.5 + tw * 20, -25], [11.5, -10]], true);
      P.flat(ie, K.ear);
      const eye = new Path2D();
      taperTo(eye, [[10, -4.5], [14, -5], [18, -3.5]], 1.6, 0.6, 0.3);
      P.strokes(eye, 1, C.sumi);
      const mk = new Path2D();
      taperTo(mk, [[8, -3], [13, -2.4], [20, -1]], 0.9, 0.3, 0);
      P.strokes(mk, 0.8, K.mark);
      const ns = new Path2D();
      ns.ellipse(37.2, 1.2, 1.8, 1.4, 0, 0, TAU);
      P.flat(ns, K.nose);
      P.folds([[[[36, 3.5], [30, 5.5], [24, 5.5]], 0.5, 0.2]], 0.7);
      if (P.hi && !hm.carry) {
        const wk = new Path2D();
        for (const dy of [2.5, 4.5]) taperTo(wk, [[30, dy], [40, dy + 1], [48, dy + 3]], 0.7, 0.2, 0);
        P.strokes(wk, 0.4);
      }
    }
    if (hm.carry === 'fish') {
      // a fish held crosswise in the jaws, tail drooping (drawn in outline)
      const f = sp([[18, 8], [26, 4.5], [40, 5], [52, 9], [60, 15], [66, 12, 1], [64, 20], [66, 27, 1], [58, 19], [50, 15], [38, 13], [26, 12.5]], true);
      if (P.sil) { ctx.strokeStyle = P.sil; ctx.lineWidth = P.lw * 1.3; ctx.stroke(f); ctx.fillStyle = U.rgba(C.gofun, 0.001); }
      else {
        P.shape(f, K.fish || U.mix(C.ginnezu, C.gofun, 0.4), 0.9);
        if (P.mid) {
          const d = new Path2D();
          d.ellipse(25, 8, 1.3, 1.3, 0, 0, TAU);
          P.flat(d, C.sumi);
          P.folds([[[[30, 5.5], [31.5, 9], [30, 12.5]], 0.6, 0.3], [[[36, 9], [46, 10], [54, 13]], 0.4, 0.1]], 0.7);
        }
      }
    } else if (hm.carry === 'dango') {
      const dg = new Path2D();
      dg.ellipse(38, 5, 5.6, 5.4, 0, 0, TAU);
      P.shape(dg, P.sil ? P.sil : K.dango || C.gofun, 0.7);
    }
    ctx.restore();
    const c = Math.cos(a), s = Math.sin(a);
    return [x + 36 * sx * c - 5 * s, y + 36 * sx * s + 5 * c];
  }

  /** Two eye-glints in the grass: 胡粉 points with 山吹 halos. blink 0..1 closes them. */
  function foxEyes(ctx, P, o) {
    const k = 1 / 0.55;                       // fox unit → film px at scale 1
    const b = U.clamp(o.blink || 0);
    const sep = (o.sep == null ? 14 : o.sep) * k;
    const ry = Math.max(0.08, 1 - b);
    const halo = new Path2D(), core = new Path2D();
    for (const sgn of [-1, 1]) {
      const ex = sgn * sep / 2;
      halo.moveTo(ex + 4 * k, 0); halo.ellipse(ex, 0, 4 * k, 4 * k * (0.35 + 0.65 * ry), 0, 0, TAU);
      core.moveTo(ex + 1.6 * k, 0); core.ellipse(ex, 0, 1.6 * k, 1.6 * k * ry, 0, 0, TAU);
    }
    ctx.save();
    ctx.globalAlpha *= (o.glow == null ? 0.38 : o.glow) * (1 - b * 0.7);
    ctx.fillStyle = o.haloColor || C.yamabuki;
    ctx.fill(halo);
    ctx.restore();
    if (b < 0.97) { ctx.fillStyle = o.color || C.gofun; ctx.fill(core); }
    return { left: [-sep / 2, 0], right: [sep / 2, 0] };
  }

  /** Stealing a dango: crouched, neck stretched, near forepaw reaching. reach 0..1. */
  function foxSteal(ctx, P, o, K) {
    const t = o.t, r = U.ease.inOutSine(U.clamp(o.reach == null ? 1 : o.reach));
    const tw = Math.sin(t * 1.3) * 3;
    // tail low and straight out behind: stealth
    const tail = sp([[-46, -52], [-80, -52 + tw * 0.3], [-112, -46 + tw * 0.7], [-136, -38 + tw, 1], [-116, -34 + tw * 0.8], [-84, -38 + tw * 0.3], [-50, -38]], true);
    P.shape(tail, K.fur);
    if (!P.sil) { const tp = sp([[-118, -45 + tw * 0.8], [-136, -38 + tw], [-116, -34 + tw * 0.8], [-112, -40 + tw * 0.7]], true); P.shape(tp, K.tip, 0.6); }
    const far = U.shade(K.fur, 0.88);
    qLeg(P, [26 + r * 6, -40], 'f', 40, 0.25 + r * 0.15, 0, far, K.sock, 9, true);
    qLeg(P, [-40, -46], 'h', 50, -0.25, 0.55, far, K.sock, 12, true);
    // neck stretched forward and up to the prize (under the body's outline)
    const hx = 64 + r * 22, hy = -86 - r * 10;
    const nk = new Path2D();
    taperTo(nk, crs([[26 + r * 6, -54], [48 + r * 12, -72 - r * 6], [hx, hy]], 4), 30, 16, 0.05);
    P.shape(nk, K.fur);
    const body = sp([[44 + r * 8, -70 - r * 4], [18 + r * 4, -64], [-12, -58], [-40, -60], [-56, -52], [-58, -38], [-42, -30], [-12, -31], [20 + r * 4, -34], [40 + r * 6, -42], [52 + r * 8, -56 - r * 3]], true);
    P.shape(body, K.fur);
    if (P.mid && !P.sil) { const bl = sp([[46 + r * 8, -48], [30 + r * 5, -36], [10, -33], [30, -42]], true); P.flat(bl, K.belly); }
    qLeg(P, [-34, -44], 'h', 50, -0.3, 0.6, K.fur, K.sock, 13, true, K.fur);
    // near foreleg: from planted to lifted and reaching forward
    const sh = [40 + r * 6, -46];
    const el = [sh[0] + 12 + r * 10, sh[1] + 14 - r * 20];
    const pw = [sh[0] + 12 + r * 34, sh[1] + 40 - r * 38];
    const lg = new Path2D();
    taperTo(lg, crs([sh, el, pw], 4), 11, 5, 0.1);
    P.shape(lg, K.fur, 0.8);
    if (!P.sil) { const c = new Path2D(); c.ellipse(sh[0], sh[1] + 1, 6.6, 4.6, 0, 0, TAU); P.flat(c, K.fur); }
    const paw = new Path2D();
    paw.ellipse(pw[0] + 2, pw[1], 5, 2.8, -0.2 * r, 0, TAU);
    P.shape(paw, K.sock, 0.6);
    const mouth = foxHead(P, hx, hy, 0.12 - r * 0.3, K, t, { carry: o.dango ? 'dango' : o.carry });
    return { mouth, paw: [pw[0] + 2, pw[1]] };
  }

  function drawFox(ctx, P, o, K) {
    const t = o.t;
    if (o.pose === 'walk') {
      const ph = t * TAU * 0.9;
      const leg = (hx, hy, far, fore, k) => {
        const s = Math.sin(ph + k) * 0.36, l = Math.max(0, Math.sin(ph + k + 1.4));
        qLeg(P, [hx, hy], fore ? 'f' : 'h', fore ? 50 : 56, s, l, far ? U.shade(K.fur, 0.88) : K.fur, K.sock, fore ? 9 : 12, true, far ? null : K.fur);
      };
      leg(40, -50, true, true, Math.PI);
      leg(-38, -54, true, false, 0);
      // tail streaming behind
      const tw = (u) => Math.sin(u * 3 - t * 2.4) * 5 * u;
      const tail = sp([[-44, -64], [-70, -70 + tw(0.3)], [-100, -72 + tw(0.6)], [-128, -66 + tw(0.9)], [-140, -60 + tw(1), 1], [-122, -52 + tw(0.85)], [-94, -52 + tw(0.55)], [-66, -52 + tw(0.3)], [-44, -50]], true);
      P.shape(tail, K.fur);
      if (!P.sil) {
        const tp = sp([[-122, -66 + tw(0.85)], [-140, -60 + tw(1)], [-122, -52 + tw(0.85)], [-116, -58 + tw(0.8)]], true);
        P.shape(tp, K.tip, 0.7);
      }
      const bob = Math.abs(Math.cos(ph)) * 1.5;
      const body = sp([[50, -84 + bob], [30, -78 + bob], [0, -76 + bob], [-30, -78 + bob], [-50, -70], [-54, -54], [-40, -42], [-10, -44], [24, -42], [48, -50], [56, -66]], true);
      P.shape(body, K.fur);
      if (P.mid && !P.sil) {
        const bl = sp([[52, -58], [36, -44], [10, -41], [30, -48]], true);
        P.flat(bl, K.belly);
      }
      leg(34, -50, false, true, 0);
      leg(-32, -54, false, false, Math.PI);
      return { mouth: foxHead(P, 58, -92 + bob, o.carry ? 0.1 : 0.2, K, t, { carry: o.carry, sx: Math.cos(U.clamp(o.lookBack || 0) * Math.PI) }) };
    }
    if (o.pose === 'eyes') return foxEyes(ctx, P, o);
    if (o.pose === 'steal') return foxSteal(ctx, P, o, K);
    // sit: Inari pose, tail raised behind
    const br = Math.sin(t * 1.8) * 0.6;
    const tw = Math.sin(t * 0.9) * 2 * (0.3 + P.wind);
    const tail = sp([[-22, -18], [-54, -30], [-72 + tw * 0.4, -62], [-68 + tw, -100], [-48 + tw, -126], [-30 + tw, -130, 1], [-40 + tw, -108], [-44 + tw * 0.6, -80], [-32, -50], [-12, -28]], true);
    P.shape(tail, K.fur);
    if (!P.sil) {
      const tp = sp([[-52 + tw, -118], [-44 + tw, -126], [-30 + tw, -130], [-38 + tw, -112]], true);
      P.shape(tp, K.tip, 0.6);
    }
    const legF = sp([[14, -60], [12, -30], [11, -4], [20, -3], [21, -34], [24, -58]], true);
    P.shape(legF, U.shade(K.fur, 0.9), 0.8);
    const body = sp([[12, -108 - br], [0, -96], [-14, -76], [-30, -54], [-40, -28], [-38, -6], [-22, 1], [4, 1], [12, -20], [22, -44], [30, -66], [30, -88], [24, -102]], true);
    P.shape(body, K.fur);
    if (P.mid) P.folds([[[[-32, -8], [-26, -30], [-10, -40], [2, -26], [4, -6]], 0.8, 0.15]], 0.8);
    if (P.mid && !P.sil) {
      const ch = sp([[24, -96], [26, -74], [22, -56], [18, -64], [16, -84]], true);
      P.flat(ch, K.belly);
    }
    const legN = sp([[20, -60], [22, -30], [24, -4], [33, -3], [31, -34], [30, -62]], true);
    P.shape(legN, K.fur, 0.85);
    const pw = new Path2D(); pw.ellipse(29, -2, 6, 2.6, 0, 0, TAU); pw.ellipse(16, -2, 5.5, 2.4, 0, 0, TAU); P.shape(pw, K.sock, 0.6);
    if (o.jewel !== false && P.mid) {
      // red bib (前掛け) of an Inari fox (white fox only by default)
      if (K === FOX_WHITE || o.bib) {
        const bib = sp([[14, -102], [30, -96], [30, -84], [22, -78], [14, -88]], true);
        P.shape(bib, C.akane, 0.6);
      }
    }
    const lb = U.clamp(o.lookBack || 0);
    return { mouth: foxHead(P, 18 - lb * 6, -118 - br - lb * 4, -0.08 - lb * 0.25 * (1 - Math.abs(Math.cos(lb * Math.PI))), K, t, { carry: o.carry, sx: Math.cos(lb * Math.PI) }) };
  }

  define('fox', {
    poses: ['sit', 'walk', 'steal', 'eyes'], defaults: {}, unit: 0.55, size: 80,
    bounds(pose) {
      if (pose === 'eyes') return [-24, -14, 48, 28];
      if (pose === 'steal') return [-142, -140, 270, 146];
      return pose === 'walk' ? [-148, -138, 250, 146] : [-82, -168, 140, 175];
    },
    draw(ctx, P, o) { return drawFox(ctx, P, o, o.color === 'gold' ? pal(FOX_GOLD, o) : pal(FOX_WHITE, o)); },
  });

  /* ================================================================== */
  /* 鹿 — the stag (奥山に紅葉踏み分け鳴く鹿の…)                          */
  /* ~250 px to the antler tips at scale 1                                 */
  /* ================================================================== */
  const DEER = { fur: U.mix(C.kitsune, C.odo, 0.35), dark: U.mix(C.kitsune, C.sumi, 0.35), spot: C.kinari, rump: C.gofun, antler: C.kuchiba, hoof: C.sumi, eye: C.sumi };
  /**
   * Quadruped leg: front ('f') knee bends back; hind ('h') has the stifle
   * forward and the hock back. top = joint on the body, L = leg length,
   * swing (rad, + = forward), lift 0..1 (flexing to step). Returns hoof point.
   */
  function qLeg(P, top, kind, L, swing, lift, col, hoofCol, w, pawRound, cover) {
    const base = kind === 'f'
      ? [[0, 0], [1.5, 0.46], [0.5, 0.9], [3.5, 1.0]]
      : [[0, 0], [0.16, 0.34], [-0.1, 0.66], [-0.04, 1.0]];
    let pts = base.map(([x, y]) => [x * L * (kind === 'f' ? 0.02 : 1) + (kind === 'f' ? x : 0), y * L]);
    if (kind === 'f') pts = [[0, 0], [1.5, L * 0.46], [0.5, L * 0.9], [3.5, L]];
    const r = (p, c, a) => rot(p, c[0], c[1], a);
    if (lift) {
      if (kind === 'f') { pts[2] = r(pts[2], pts[1], lift * 1.1); pts[3] = r(pts[3], pts[1], lift * 1.1); pts[3] = r(pts[3], pts[2], lift * 0.6); }
      else { pts[2] = r(pts[2], pts[1], -lift * 0.5); pts[3] = r(pts[3], pts[1], -lift * 0.5); pts[3] = r(pts[3], pts[2], lift * 0.9); }
    }
    pts = pts.map((p) => { const q = rot(p, 0, 0, -swing); return [top[0] + q[0], top[1] + q[1]]; });
    const p = new Path2D();
    taperTo(p, crs(pts, 4), w, w * 0.34, 0.15);
    P.shape(p, col, 0.8);
    if (cover && !P.sil) {
      // hide the leg's flat top cap inside the body (near legs over the body)
      const c = new Path2D();
      c.ellipse(top[0], top[1] + w * 0.05, w * 0.62, w * 0.42, 0, 0, TAU);
      P.flat(c, cover);
    }
    const h = pts[3];
    const hf = new Path2D();
    if (pawRound) hf.ellipse(h[0] + 2.5, h[1] - 1, w * 0.42, w * 0.22, 0, 0, TAU);
    else { hf.moveTo(h[0] - w * 0.2, h[1] - w * 0.3); hf.lineTo(h[0] + w * 0.35, h[1] - w * 0.25); hf.lineTo(h[0] + w * 0.4, h[1] + 1); hf.lineTo(h[0] - w * 0.3, h[1] + 1); hf.closePath(); }
    P.shape(hf, hoofCol, 0.5);
    return h;
  }

  function drawDeer(ctx, P, o, K) {
    const t = o.t, pose = o.pose;
    const walk = pose === 'walk';
    const ph = t * TAU * 0.55;
    const sw = (k) => (walk ? Math.sin(ph + k) * 0.32 : 0);
    const lf = (k) => (walk ? Math.max(0, Math.sin(ph + k + 1.4)) : 0);
    const bob = walk ? Math.abs(Math.cos(ph)) * 2 : 0;
    ctx.translate(0, -bob);
    const LL = 96;
    // far legs
    qLeg(P, [46, -104], 'f', LL, sw(Math.PI) + 0.02, lf(Math.PI), U.shade(K.fur, 0.84), K.hoof, 12);
    qLeg(P, [-56, -112], 'h', LL + 12, sw(0) - 0.04, lf(0), U.shade(K.fur, 0.84), K.hoof, 16);
    // body: deep chest, slim waist, high rounded rump
    const body = sp([[64, -150], [70, -128], [64, -104], [44, -92], [10, -90], [-24, -92], [-50, -98], [-70, -108], [-80, -124], [-72, -142], [-46, -142], [-6, -138], [34, -144]], true);
    P.shape(body, K.fur);
    if (!P.sil && P.mid) {
      const rp = sp([[-74, -136], [-80, -122], [-70, -106], [-64, -122]], true);
      P.flat(rp, K.rump);
      const spt = new Path2D();
      const r = U.rng(31);
      for (let i = 0; i < 24; i++) {
        const x = U.lerp(-60, 40, r()), y = U.lerp(-134, -114, r()) + Math.abs(x) * 0.03;
        spt.moveTo(x + 2.2, y); spt.ellipse(x, y, 2.2, 1.6, 0, 0, TAU);
      }
      P.flat(spt, K.spot);
      P.folds([[[[-48, -100], [-40, -116], [-36, -130]], 0.7, 0.2], [[[50, -98], [54, -116], [50, -132]], 0.6, 0.2]], 0.6);
    }
    const tl = sp([[-76, -138], [-86, -134], [-84, -126], [-76, -128]], true);
    P.shape(tl, K.rump, 0.6);
    // near legs
    qLeg(P, [40, -102], 'f', LL, sw(0) - 0.02, lf(0), K.fur, K.hoof, 13, false, K.fur);
    qLeg(P, [-50, -110], 'h', LL + 12, sw(Math.PI) + 0.04, lf(Math.PI), K.fur, K.hoof, 18, false, K.fur);
    // neck + head
    const call = pose === 'call', graze = pose === 'graze';
    const na = call ? -1.05 : graze ? 1.05 : -0.62;
    const nb = [56, -140];
    const len = graze ? 58 : 54;
    const nt = [nb[0] + Math.cos(na) * len, nb[1] + Math.sin(na) * len];
    const neck = new Path2D();
    taperTo(neck, crs([[nb[0] - 12, nb[1] + 12], lerpPt(nb, nt, 0.5), nt], 4), 34, 16, 0.05);
    P.shape(neck, K.fur);
    ctx.save();
    ctx.translate(nt[0], nt[1]);
    ctx.rotate(call ? -0.5 : graze ? 1.2 : 0.3);
    const an = new Path2D();
    const sway = Math.sin(t * 0.8) * 0.02;
    taperTo(an, crs([[-4, -8], [-12, -34], [-8 - sway * 100, -62], [4, -84]], 4), 4.2, 1.6, 0.1);
    taperTo(an, [[-10, -26], [4, -36], [12, -40]], 2.8, 1.2, 0);
    taperTo(an, [[-9, -54], [-24, -70], [-28, -80]], 2.6, 1.1, 0);
    taperTo(an, [[-11, -18], [-20, -24]], 2.4, 1, 0);
    taperTo(an, crs([[2, -8], [0, -30], [8, -54], [18, -70]], 4), 3.2, 1.3, 0.1);
    taperTo(an, [[2, -40], [16, -46]], 2.2, 1, 0);
    if (o.antlers !== false) P.shape(an, K.antler, 0.55);
    const hd = sp([[-10, -8], [2, -12], [14, -8], [28, -4], [36, 2, 1], [32, 7], [18, 8], [2, 8], [-10, 4]], true);
    P.shape(hd, K.fur);
    const ear = sp([[-6, -6], [-22, -16], [-24, -10], [-10, -1]], true);
    P.shape(ear, K.fur, 0.7);
    if (!P.sil && P.mid) {
      const e = new Path2D(); e.ellipse(8, -3, 2.6, 2, 0.2, 0, TAU); P.flat(e, K.eye);
      const n = new Path2D(); n.ellipse(35, 2, 2, 1.8, 0, 0, TAU); P.flat(n, K.hoof);
      if (call) { const m = sp([[34, 5], [22, 12], [30, 7]], true); P.flat(m, C.enji); }
    }
    ctx.restore();
  }
  define('deer', {
    poses: ['stand', 'call', 'graze', 'walk'], defaults: {},
    size: 250,
    bounds(pose) { return pose === 'graze' ? [-108, -200, 282, 210] : [-108, -278, 256, 288]; },
    draw(ctx, P, o) { drawDeer(ctx, P, o, pal(DEER, o)); },
  });

  /* ================================================================== */
  /* hands — close-ups: 狐の窓 (fox window), cupped hands, the ladle      */
  /* scale 1 = the fox window ≈ 300 × 230 inside, hands ≈ 720 px wide     */
  /* ================================================================== */
  const HANDS = {
    skin: U.mix(C.gofun, C.kitsune, 0.24),
    skinOld: U.mix(U.mix(C.gofun, C.kitsune, 0.28), C.odo, 0.12),
    crease: U.mix(C.kitsune, C.sumi, 0.35),
    spot: U.mix(C.odo, C.kitsune, 0.5),
    vein: U.mix(C.ai, C.kitsune, 0.55),
    nail: U.mix(C.gofun, C.toki, 0.35),
    sleeve: C.ai, sleeveFg: C.gofun,          // the 波兎 haori sleeve
    childSleeve: C.kon, childSleeveFg: C.gofun,
    bamboo: U.mix(C.odo, C.sumi, 0.5),       // 煤竹 handle
    cup: C.odo, water: U.mix(C.ai, C.koiai, 0.4),
  };
  const FW = { W: 150, H: 115 };             // fox-window half size (inner diamond)

  /**
   * A whole hand as ONE inked silhouette — palm, four fingers, thumb — built in
   * hand space: wrist at (0,0), fingers toward −y, thumb on the +x side before
   * the mirror m. Every part is stroked first and filled over, so only the
   * union's outline survives; the finger separations are then carved with
   * tapered sumi lines (no stuck-on sticks).
   * h = { at, rot, m, sc, view 'palm'|'back', curl n | [i,m,r,l], spread 0..1,
   *       fan [4], thumb { a, curl, over }, age, arm (forearm stub length) }
   * Returns { tips[4], thumbTip, palm, wrist } in the caller's local space.
   */
  function handTop(P, K, h) {
    const ctx = P.ctx;
    const m = h.m || 1, sc = h.sc || 1, age = h.age || 0, back = h.view === 'back';
    const ca = Math.cos(h.rot || 0), sa = Math.sin(h.rot || 0);
    const at = h.at || [0, 0];
    const T = (p) => { const x = p[0] * m * sc, y = p[1] * sc; return [at[0] + x * ca - y * sa, at[1] + x * sa + y * ca, p[2]]; };
    const knob = age * 0.1;
    const Lp = 60;
    const armL = h.arm == null ? 30 : h.arm;
    const palmPts = [[-16, armL], [-19, 4], [-27, -22], [-29, -44], [-25, -Lp + 5], [-8, -Lp - 1], [10, -Lp - 1], [25, -Lp + 1], [31, -42], [35, -22], [25, 0], [19, armL]];
    const skin = K.skinNow;
    const all = [sp(palmPts.map(T), true)];
    const curl = Array.isArray(h.curl) ? h.curl : [h.curl || 0, h.curl || 0, h.curl || 0, h.curl || 0];
    const spread = h.spread || 0;
    //          base x, base y, len, width, rest angle, spread angle
    const FB = [[18.5, -Lp + 2, 46, 13.6, 0.05, 0.22], [6, -Lp - 1, 52, 14, 0, 0.07], [-6.5, -Lp + 1, 48, 13.2, -0.04, -0.1], [-18, -Lp + 5, 38, 11.6, -0.1, -0.32]];
    const seps = new Path2D(), det = new Path2D(), nails = new Path2D();
    const tips = [];
    const lw = P.lw;
    const bump = (u, j) => Math.exp(-Math.pow((u - j) / 0.07, 2));
    // one digit: centre line from a buried base out to a round cap
    const digit = (bx, by, L, w, a, c, bend, isThumb) => {
      const d0 = [Math.sin(a), -Math.cos(a)];
      const a2 = a + bend;
      const d1 = [Math.sin(a2), -Math.cos(a2)];
      const Lv = L * (1 - (back ? 0.7 : 0.48) * c);
      const rt = w * (0.43 + 0.05 * c);
      const cl = [], wv = [];
      const S = [-10, 0, 0.2, 0.4, 0.6, 0.8, 1];
      for (const q of S) {
        const s = q < 0 ? q : q * (Lv - rt);
        const u = Math.max(0, s / Lv);
        const dd = u < 0.5 ? d0 : d1;
        const prev = cl.length ? cl[cl.length - 1] : null;
        const p = prev && q > 0 ? [prev[0] + dd[0] * (s - prev[2]), prev[1] + dd[1] * (s - prev[2]), s] : [bx + d0[0] * s, by + d0[1] * s, s];
        cl.push(p);
        wv.push(w * (1 - 0.14 * u) * (1 + knob * (bump(u, isThumb ? 0.6 : 0.5) + (isThumb ? 0 : bump(u, 0.78)))) * (1 + 0.1 * c * u) / 2);
      }
      const Lf = [], Rf = [];
      for (let k = 0; k < cl.length; k++) {
        const a0 = cl[Math.max(0, k - 1)], a1 = cl[Math.min(cl.length - 1, k + 1)];
        const dl = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]) || 1;
        const n = [-(a1[1] - a0[1]) / dl, (a1[0] - a0[0]) / dl];
        Lf.push([cl[k][0] - n[0] * wv[k], cl[k][1] - n[1] * wv[k]]);
        Rf.push([cl[k][0] + n[0] * wv[k], cl[k][1] + n[1] * wv[k]]);
      }
      const e = cl[cl.length - 1], n1 = [-d1[1], d1[0]], r = wv[wv.length - 1];
      const cap = [0.25, 0.5, 0.75].map((f) => { const th = f * Math.PI; return [e[0] - n1[0] * r * Math.cos(th) + d1[0] * r * Math.sin(th), e[1] - n1[1] * r * Math.cos(th) + d1[1] * r * Math.sin(th)]; });
      const outline = Lf.concat(cap, Rf.slice().reverse());
      all.push(sp(outline.map(T), true));
      // carved separation: from where the digit leaves the palm, round the tip and back
      const sepPts = Lf.slice(isThumb ? 2 : 1).concat(cap, Rf.slice(isThumb ? 2 : 1).reverse()).map(T);
      taperTo(seps, crs(sepPts, 3), lw * 0.12, lw * 0.12, 7.5);
      const tip = [e[0] + d1[0] * r, e[1] + d1[1] * r];
      if (P.mid) {
        // joint creases: across the digit at the knuckles (more & bonier with age)
        const cnt = back ? 1 + Math.round(age * 2) : 1;
        for (const u of isThumb ? [0.55] : back ? [0.47, 0.76] : [0.47]) {
          if (u * Lv > Lv - rt) continue;
          const s = u * (Lv - rt);
          let k = 1; while (k < cl.length - 1 && cl[k + 1][2] < s) k++;
          const f = (s - cl[k][2]) / ((cl[k + 1][2] - cl[k][2]) || 1);
          const p = lerpPt(cl[k], cl[k + 1], f), ww = U.lerp(wv[k], wv[k + 1], f);
          const dd = u < 0.5 ? d0 : d1, nn = [-dd[1], dd[0]];
          for (let j = 0; j < cnt; j++) {
            const off = (j - (cnt - 1) / 2) * 2.6 + (back ? 0 : 0);
            const bow = back ? 2.2 : -1.6;
            const c0 = [p[0] - nn[0] * ww * 0.55 + dd[0] * off, p[1] - nn[1] * ww * 0.55 + dd[1] * off];
            const c1 = [p[0] + dd[0] * (off + bow), p[1] + dd[1] * (off + bow)];
            const c2 = [p[0] + nn[0] * ww * 0.55 + dd[0] * off, p[1] + nn[1] * ww * 0.55 + dd[1] * off];
            taperTo(det, [T(c0), T(c1), T(c2)], lw * 0.2, lw * (back ? 0.5 : 0.35), 0.5);
          }
        }
        if (back && c < 0.55) {
          const nc = [e[0] - d1[0] * r * 0.1, e[1] - d1[1] * r * 0.1];
          const q = T(nc);
          const ang = Math.atan2(T([nc[0] + d1[0], nc[1] + d1[1]])[1] - q[1], T([nc[0] + d1[0], nc[1] + d1[1]])[0] - q[0]);
          nails.moveTo(q[0] + r * 0.85 * sc * Math.cos(ang), q[1] + r * 0.85 * sc * Math.sin(ang));
          nails.ellipse(q[0], q[1], r * 0.85 * sc, r * (isThumb ? 0.5 : 0.62) * sc, ang, 0, TAU);
        }
      }
      return T(tip);
    };
    for (let i = 0; i < 4; i++) {
      const [bx, by, L, w, a0, as] = FB[i];
      const c = U.clamp(curl[i]);
      tips.push(digit(bx, by, L, w, a0 + as * spread + (h.fan ? h.fan[i] : 0), c, -0.1 * c, false));
    }
    const th = h.thumb || {};
    const tc = U.clamp(th.curl || 0);
    const thumbTip = digit(24, -12, 46, 17.5, th.a == null ? 0.6 : th.a, tc, th.bend == null ? -0.3 * tc - 0.1 : th.bend, true);
    // ink: stroke every part (twice the key width: half is covered), then fill them all
    if (!P.sil && P.ol > 0) for (const p of all) P.line(p, 1.8);
    for (const p of all) P.fill(p, skin);
    P.strokes(seps, 1);
    if (P.mid) {
      const L2 = new Path2D();
      if (!back) {
        // palm lines: heart, head, life (the life line rounding the thenar)
        taperTo(L2, crs([[-28, -40], [-14, -46], [2, -48], [14, -52]].map(T), 4), lw * 0.2, lw * 0.5, 0.4);
        taperTo(L2, crs([[-27, -30], [-10, -32], [8, -30], [20, -38]].map(T), 4), lw * 0.2, lw * 0.4, 0.4);
        taperTo(L2, crs([[20, -46], [10, -34], [8, -16], [12, 0]].map(T), 4), lw * 0.45, lw * 0.15, 0.3);
      } else {
        // knuckles: small bony arcs; tendons fanning to the wrist with age
        for (let i = 0; i < 4; i++) {
          const [bx, by] = FB[i];
          if (U.clamp(curl[i]) > 0.6) taperTo(L2, crs([[bx - 5, by + 1], [bx, by - 3], [bx + 5, by + 1]].map(T), 3), lw * 0.25, lw * 0.25, 1.2);
          else taperTo(L2, crs([[bx - 4, by + 3], [bx, by + 1], [bx + 4, by + 3]].map(T), 3), lw * 0.2, lw * 0.2, 1.4 * (0.4 + age));
          if (age > 0.3 && i < 3) taperTo(L2, crs([[bx, by + 6], [bx * 0.7, by + 22], [bx * 0.4, by + 40]].map(T), 3), lw * 0.35 * age, lw * 0.05, 0.2);
        }
      }
      P.strokes(L2, 0.45 + age * 0.3, K.crease);
      P.strokes(det, 0.5 + age * 0.35, K.crease);
      if (back) P.shape(nails, K.nail, 0.3, 0.65);
      if (back && age > 0.3 && P.fx) {
        const V = new Path2D();
        taperTo(V, crs([[-10, 20], [-4, -8], [-12, -30], [-6, -44]].map(T), 4), lw * 1.4 * age, lw * 0.4, 0.3);
        taperTo(V, crs([[6, 22], [10, -2], [4, -26]].map(T), 4), lw * 1.1 * age, lw * 0.3, 0.3);
        ctx.save(); ctx.globalAlpha *= 0.3 * age; P.flat(V, K.vein); ctx.restore();
        const S = new Path2D();
        const r = U.rng(h.seed || 7);
        for (let i = 0; i < 7; i++) {
          const q = T([-22 + r() * 44, -50 + r() * 50]), rr = (1.6 + r() * 3) * age * sc;
          S.moveTo(q[0] + rr, q[1]); S.ellipse(q[0], q[1], rr, rr * 0.75, r() * 3, 0, TAU);
        }
        ctx.save(); ctx.globalAlpha *= 0.5 * age; P.flat(S, K.spot); ctx.restore();
      }
    }
    return { tips, thumbTip, palm: T([2, -30]), wrist: T([2, 0]), T };
  }

  /** A kimono cuff seen end-on round a wrist: the sleeve going off-frame along dir. */
  function cuffSleeve(P, K, wr, dir, w, len, fill, lining) {
    const n = [-dir[1], dir[0]];
    const p = (a, b) => [wr[0] + dir[0] * a + n[0] * b, wr[1] + dir[1] * a + n[1] * b];
    const sl = sp([p(8, -w * 0.62), p(len * 0.5, -w * 0.8), p(len, -w * 0.86, 1), p(len, w * 0.86, 1), p(len * 0.5, w * 0.8), p(8, w * 0.62)], true);
    P.fill(sl, fill);
    P.line(sl);
    const cf = sp([p(8, -w * 0.62), p(20, -w * 0.3), p(22, 0), p(20, w * 0.3), p(8, w * 0.62), p(2, 0)], true);
    P.fill(cf, lining);
    if (P.mid) P.folds([[[p(40, -w * 0.3), p(len * 0.6, -w * 0.4), p(len, -w * 0.42)], 0.7, 0.2], [[p(50, w * 0.25), p(len * 0.7, w * 0.3), p(len, w * 0.3)], 0.6, 0.2]], 0.5);
  }

  /** 小夜's two cupped hands seen from above, palms up, holding water. */
  function cuppedHands(ctx, P, o, K, age, tw) {
    const sl = P.fx && P.s >= 0.25 ? kasuri(ctx, K.childSleeve, K.childSleeveFg, 30) : K.childSleeve;
    const res = [];
    const c = o.curl == null ? 0.75 : o.curl;
    for (const s of [-1, 1]) {
      const at = [s * 28, 34 + tw * (s > 0 ? 1 : -0.8)];
      res.push(handTop(P, K, { at, rot: -s * 0.06, m: s, view: 'palm', curl: [c * 1.1, c * 1.15, c * 1.15, c * 1.1], spread: 0, fan: [-0.05, -0.02, 0.01, 0.05], thumb: { a: -0.02, curl: 0.15, bend: -0.12 }, age, arm: 30, seed: s + 3 }));
      if (o.sleeve !== false) cuffSleeve(P, K, [at[0] + s * 1, at[1] + 30], [s * 0.08, 1], 50, 120, sl, U.mix(K.childSleeve, C.sumi, 0.55));
    }
    if (P.fx) {
      // the hollow of the joined palms: a soft 'multiply' bokashi, darkest at the seam
      const g = ctx.createRadialGradient(0, -6, 2, 0, -6, 44);
      g.addColorStop(0, U.rgba(U.mix(K.skinNow, C.kitsune, 0.5), 0.4));
      g.addColorStop(1, U.rgba(K.skinNow, 0));
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(0, -6, 44, 36, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    const wv = o.water == null ? 0 : U.clamp(o.water);
    if (wv > 0 && !P.sil) {
      const wp = new Path2D();
      wp.ellipse(0, -6, 38 * Math.sqrt(wv), 29 * Math.sqrt(wv), 0, 0, TAU);
      ctx.save(); ctx.globalAlpha *= 0.6; P.flat(wp, K.water); ctx.restore();
    }
    const tips = res[0].tips.concat(res[1].tips);
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const drips = [mid(res[0].tips[3], res[1].tips[3]), [0, 30], mid(res[0].tips[0], res[0].tips[1]), mid(res[1].tips[0], res[1].tips[1]), mid(res[0].tips[1], res[0].tips[2]), mid(res[1].tips[1], res[1].tips[2])];
    return { center: [0, -6], rx: 38, ry: 29, drips, tips };
  }

  /** 小夜's hands plunging to grab the moon: backs up, fingers spread; close 0..1 makes fists. */
  function grabHands(ctx, P, o, K, age, tw) {
    const sl = P.fx && P.s >= 0.25 ? kasuri(ctx, K.childSleeve, K.childSleeveFg, 30) : K.childSleeve;
    const cl = U.clamp(o.close || 0);
    const res = [];
    for (const s of [-1, 1]) {
      const at = [s * 66, 40 + tw * (s > 0 ? 1 : -0.8)];
      const c = 0.12 + cl * 0.8;
      res.push(handTop(P, K, { at, rot: s * 0.16, m: -s, view: 'back', curl: [c, c * 1.05, c * 1.1, c * 1.12], spread: 1 - cl * 0.85, thumb: { a: 0.85 - cl * 0.5, curl: cl * 0.6 }, age, arm: 30, seed: s + 5 }));
      if (o.sleeve !== false) cuffSleeve(P, K, [at[0] - s * 5, at[1] + 30], [-s * 0.16, 1], 50, 120, sl, U.mix(K.childSleeve, C.sumi, 0.55));
    }
    return { center: [0, -40], tips: res[0].tips.concat(res[1].tips, [res[0].thumbTip, res[1].thumbTip]) };
  }

  /**
   * たけ's old right hand from the top-right holding the bamboo 柄杓 in a pinch
   * grip (index along the handle, thumb beneath); the cup seen from above.
   * tilt 0..1 tips the cup to pour. Returns the water surface (cup, rx, ry, r), lip.
   */
  function ladleHand(ctx, P, o, K, age, tw) {
    const tilt = U.clamp(o.tilt || 0);
    const dirA = (o.angle == null ? 2.3 : o.angle);
    const rot = Math.atan2(Math.cos(dirA), -Math.sin(dirA));
    const hand = { at: [0, tw], rot, m: -1, view: 'back', curl: [0.06, 0.86, 0.92, 0.96], spread: 0, fan: [-0.05, 0, 0, 0], thumb: { a: 0.12, curl: 0.12, bend: -0.12 }, age, arm: 50, seed: 9 };
    // the hand-space transform, to lay the handle between index and thumb
    const ca = Math.cos(rot), sa = Math.sin(rot);
    const T = (p) => { const x = -p[0], y = p[1]; return [x * ca - y * sa, tw + x * sa + y * ca]; };
    const L = o.len == null ? 300 : o.len;
    const h0 = T([23, 20]), h1 = T([23 + Math.sin(0.03) * L, 20 - L]);
    const d = unit(h0, h1), n = [-d[1], d[0]];
    const hd = new Path2D();
    taperTo(hd, [h0, [h1[0] - d[0] * 26, h1[1] - d[1] * 26]], 9, 8, 0);
    P.shape(hd, K.bamboo, 0.8);
    if (P.mid) {
      const nd = new Path2D();
      for (const u of [0.42, 0.76]) { const px = h0[0] + (h1[0] - h0[0]) * u, py = h0[1] + (h1[1] - h0[1]) * u; taperTo(nd, [[px - n[0] * 5, py - n[1] * 5], [px + n[0] * 5, py + n[1] * 5]], 1.8, 1.8, 0); }
      P.strokes(nd, 0.7);
    }
    // the cup: a short bamboo cylinder from above; tilting narrows the rim across the pour
    const R = 30;
    const cx = h1[0] + d[0] * 6, cy = h1[1] + d[1] * 6;
    const ry = R * (0.9 - 0.55 * tilt);
    const pa = Math.atan2(d[1], d[0]);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(pa);
    const body = new Path2D();
    body.ellipse(0, 0, R, ry, 0, 0, TAU);
    body.moveTo(R, 7); body.ellipse(0, 7 * (1 - tilt * 0.5), R, ry, 0, 0, TAU);
    const wall = new Path2D();
    wall.moveTo(-R, 0); wall.lineTo(-R, 7 * (1 - tilt * 0.5)); wall.ellipse(0, 7 * (1 - tilt * 0.5), R, ry, 0, Math.PI, 0, true); wall.lineTo(R, 0); wall.ellipse(0, 0, R, ry, 0, 0, Math.PI);
    P.fill(wall, U.shade(K.cup, 0.85));
    const rim = new Path2D();
    rim.ellipse(0, 0, R, ry, 0, 0, TAU);
    P.fill(rim, K.cup);
    const inner = new Path2D();
    inner.ellipse(0, 0, R - 4, ry - 4 * ry / R, 0, 0, TAU);
    P.fill(inner, U.shade(K.cup, 0.62));
    const wv = (o.water == null ? 1 : U.clamp(o.water)) * (1 - tilt * 0.55);
    const wr = (R - 6) * Math.sqrt(Math.max(0.05, wv));
    const wy = (ry - 6 * ry / R) * Math.sqrt(Math.max(0.05, wv));
    const wo = (R - 6 - wr) * 0.9;
    if (wv > 0.02) {
      const w = new Path2D();
      w.ellipse(0, wo * (tilt > 0 ? 1 : 0), wr, wy, 0, 0, TAU);
      P.fill(w, K.water);
    }
    P.line(rim, 0.9); P.line(wall, 0.9);
    ctx.restore();
    // the hand over the handle, and the 波兎 sleeve up to the frame edge
    const hr = handTop(P, K, hand);
    if (o.sleeve !== false) {
      const sf = P.fx && P.s >= 0.25 ? namiUsagi(ctx, K.sleeve, K.sleeveFg, o.patternUnit || 76) : K.sleeve;
      const wr0 = T([2, 50]), wr1 = T([2, 60]);
      cuffSleeve(P, K, wr0, unit(wr0, wr1), 70, 240, sf, U.mix(K.sleeve, C.sumi, 0.6));
    }
    const off = [Math.cos(pa) * 0 - Math.sin(pa) * wo * (tilt > 0 ? 1 : 0), Math.sin(pa) * 0 + Math.cos(pa) * wo * (tilt > 0 ? 1 : 0)];
    const lip = [cx - Math.sin(pa) * ry, cy + Math.cos(pa) * ry];
    return { cup: [cx + off[0], cy + off[1]], r: wr, rx: wr, ry: wy, rot: pa, lip, grip: hr.tips[0] };
  }

  /**
   * One hand of the fox window as a single anatomical outline: an 'L' of index
   * finger and thumb whose inner edges ARE the window's diamond, the three
   * folded fingers as a knuckled ridge, the thenar, the wrist into the sleeve.
   * Built in a hand frame (u along the index, v across the knuckles).
   * side −1 = left hand, 1 = right (mirrored). part: 'all' | 'thumbTip'.
   */
  function foxHand(P, side, K, age, dx, dy, tw, part) {
    const ctx = P.ctx;
    const s = side;
    const Wd = FW.W, Hd = FW.H, D = Math.hypot(Wd, Hd);
    const e1 = [Wd / D, -Hd / D], e2 = [Wd / D, Hd / D];          // index up-right, thumb down-right (left hand)
    const out1 = [-Hd / D, -Wd / D], out2 = [-Hd / D, Wd / D];    // outward normals of the two diamond edges
    const knob = age * 0.09;
    const X = (x) => s * x + dx, Y = (y) => y + dy + tw;
    const P2 = (p) => [X(p[0]), Y(p[1]), p[2]];
    const UV = (u, v, c) => [-Wd + e1[0] * u + out1[0] * v, e1[1] * u + out1[1] * v, c];
    const along = (e, o, sN, w) => [-Wd + e[0] * D * sN + o[0] * w, e[1] * D * sN + o[1] * w];
    const jointW = (sN, w, j) => w * (1 + knob * (Math.exp(-Math.pow((sN - j[0]) / 0.05, 2)) + Math.exp(-Math.pow((sN - j[1]) / 0.05, 2))));
    const IW = 44, TW = 50;
    const idxIn = [], idxOut = [], thIn = [], thOut = [];
    for (let i = 0; i <= 8; i++) {
      const sN = 0.1 + (i / 8) * 0.9;
      idxIn.push(along(e1, out1, sN, 0));
      idxOut.push(along(e1, out1, sN, jointW(sN, IW * (1.12 - 0.22 * sN), [0.52, 0.8])));
    }
    for (let i = 0; i <= 8; i++) {
      const sN = 0.16 + (i / 8) * 0.84;
      thIn.push(along(e2, out2, sN, 0));
      thOut.push(along(e2, out2, sN, jointW(sN, TW * (1.18 - 0.3 * sN + 0.1 * Math.exp(-Math.pow((sN - 0.9) / 0.08, 2))), [0.64, 0.64])));
    }
    const capI = along(e1, out1, 1.06, IW * 0.45), capT = along(e2, out2, 1.07, TW * 0.5);
    const outline = [[-Wd + 4, 0]].concat(idxIn.slice(1), [[capI[0], capI[1]]], idxOut.slice().reverse().slice(0, -1), [
      UV(0.13 * D, 50), UV(0.22 * D, 60), UV(0.27 * D, 78), UV(0.245 * D, 93),                               // folded fingers: three
      UV(0.26 * D, 107), UV(0.22 * D, 121), UV(0.21 * D, 135), UV(0.15 * D, 149), UV(0.03 * D, 155),           // curled knuckles
      UV(-0.22 * D, 152), UV(-0.5 * D, 140), UV(-0.78 * D, 118, 1),                                            // little-finger side to the wrist
      UV(-0.86 * D, 64), UV(-0.8 * D, 16, 1),                                                                  // wrist
      [-232, 96], [-196, 84],                                                                                  // thenar
    ], thOut.slice(1), [[capT[0], capT[1]]], thIn.slice().reverse().slice(0, -1));
    if (part !== 'thumbTip') {
      if (K.sleeveOn) {
        // the sleeve hangs from the forearm: slanted top edge, vertical front edge
        // from the cuff, rounded bottom corners (袖の丸み) — a kimono 袂, not a tube
        const A = UV(-0.72 * D, 176), G = UV(-0.74 * D, -40);
        const sl = sp([A, [A[0] - 160, A[1] + 112], [-634, 140], [-652, 262], [-622, 330, 1], [-420, 350], [G[0] - 44, 350], [G[0] - 16, 322], [G[0] - 8, 250], G].map(P2), true);
        P.fill(sl, K.sleeveFill);
        P.line(sl);
        // the cuff (袖口): the dark lining showing round the wrist
        const cuff = sp([A, UV(-0.84 * D, 150), UV(-0.93 * D, 64), UV(-0.86 * D, -18), G].map(P2), true);
        P.fill(cuff, U.mix(K.sleeve, C.sumi, 0.6));
        if (P.mid) P.folds([
          [[[A[0] - 90, A[1] + 90], [-520, 190], [-540, 300]].map(P2), 0.8, 0.2],
          [[[G[0] - 70, G[1] + 40], [G[0] - 90, 200], [G[0] - 80, 320]].map(P2), 0.7, 0.2],
          [[[-420, 130], [-440, 220], [-430, 300]].map(P2), 0.5, 0.25],
        ], 0.55);
      }
      const hand = sp(outline.map(P2), true);
      P.shape(hand, K.skinNow);
      if (P.mid) {
        const L = new Path2D();
        const fw = P.lw;
        // the folded fingers: separations curling under
        for (const v of [66, 94, 122]) taperTo(L, crs([UV(0.05 * D, v - 2), UV(0.17 * D, v + 2), UV(0.235 * D, v + 7)].map(P2), 4), fw * 0.8, fw * 0.2, 0.2);
        // knuckles (bony arcs for old hands)
        for (const v of [22, 64, 100, 134]) taperTo(L, crs([UV(-0.02 * D, v - 10), UV(0.01 * D, v), UV(-0.02 * D, v + 10)].map(P2), 3), fw * 0.2, fw * (0.3 + age * 0.4), 0.3);
        // joint creases on the index & thumb
        const crease = (e, o, sN, w, cnt) => {
          for (let k = 0; k < cnt; k++) {
            const q = sN + (k - (cnt - 1) / 2) * 0.016;
            const a = along(e, o, q, w * 0.2), b = along(e, o, q + 0.012, w * 0.5), c = along(e, o, q, w * 0.8);
            taperTo(L, [P2(a), P2(b), P2(c)], fw * 0.25, fw * 0.6, 0.4);
          }
        };
        const nc = 1 + Math.round(age * 2);
        crease(e1, out1, 0.52, IW, nc); crease(e1, out1, 0.8, IW, nc); crease(e2, out2, 0.64, TW, nc);
        // tendons from the knuckles toward the wrist
        for (const v of [30, 66, 100]) taperTo(L, crs([UV(-0.07 * D, v), UV(-0.22 * D, v * 0.94 + 3), UV(-0.36 * D, v * 0.88 + 6)].map(P2), 3), fw * (0.15 + age * 0.3), fw * 0.05, 0.3);
        P.strokes(L, 0.5 + age * 0.3, K.crease);
        if (age > 0.25) {
          const V = new Path2D();
          taperTo(V, crs([UV(-0.74 * D, 80), UV(-0.5 * D, 60), UV(-0.3 * D, 76), UV(-0.1 * D, 60)].map(P2), 4), fw * 1.2 * age, fw * 0.3, 0.3);
          taperTo(V, crs([UV(-0.7 * D, 120), UV(-0.45 * D, 108), UV(-0.25 * D, 118)].map(P2), 4), fw * 1.0 * age, fw * 0.3, 0.3);
          ctx.save(); ctx.globalAlpha *= 0.35 * age; P.flat(V, K.vein); ctx.restore();
          if (P.fx) {
            const sp1 = new Path2D();
            const r = U.rng(s > 0 ? 41 : 43);
            for (let i = 0; i < 9; i++) {
              const q = P2(UV((-0.7 + r() * 0.7) * D, 20 + r() * 120)), rr = (2.5 + r() * 5) * age;
              sp1.moveTo(q[0] + rr, q[1]); sp1.ellipse(q[0], q[1], rr, rr * 0.75, r() * 3, 0, TAU);
            }
            ctx.save(); ctx.globalAlpha *= 0.5 * age; P.flat(sp1, K.spot); ctx.restore();
          }
        }
        const ni = along(e1, out1, 0.98, IW * 0.5);
        const nl = new Path2D();
        nl.ellipse(X(ni[0]), Y(ni[1]), IW * 0.27, IW * 0.2, Math.atan2(e1[1], e1[0] * s), 0, TAU);
        P.shape(nl, K.nail, 0.35, 0.7);
      }
    }
    // the thumb's distal half — redrawn last for the left hand so it passes OVER the right thumb (interlaced)
    const i0 = 4;
    if (part === 'thumbTip') {
      const tp = sp(thOut.slice(i0).concat([[capT[0], capT[1]]], thIn.slice(i0).reverse()).map(P2), true);
      P.fill(tp, K.skinNow);
      const open = sp(thOut.slice(i0).concat([[capT[0], capT[1]]], thIn.slice(i0).reverse()).map(P2), false);
      P.line(open);
    }
    if (P.mid) {
      const nt = along(e2, out2, 0.98, TW * 0.5);
      const nl = new Path2D();
      nl.ellipse(X(nt[0]), Y(nt[1]), TW * 0.27, TW * 0.2, Math.atan2(e2[1], e2[0] * s), 0, TAU);
      P.shape(nl, K.nail, 0.35, 0.7);
    }
  }

  function drawHands(ctx, P, o, K) {
    const pose = o.pose, t = o.t;
    const age = o.age == null ? (pose === 'cupped' || pose === 'grab' ? 0 : 1) : U.clamp(o.age);
    K.skinNow = U.mix(K.skin, K.skinOld, age);
    const tr = (o.tremble || 0);
    const tw = tr ? (Math.sin(t * 47) * 0.6 + Math.sin(t * 29 + 1) * 0.4) * 3 * tr : 0;
    if (pose === 'cupped') return cuppedHands(ctx, P, o, K, age, tw);
    if (pose === 'ladle') return ladleHand(ctx, P, o, K, age, tw);
    if (pose === 'grab') return grabHands(ctx, P, o, K, age, tw);
    // fox window
    const il = o.interlace == null ? 1 : U.ease.inOutSine(U.clamp(o.interlace));
    const gap = (1 - il) * 130;
    K.sleeveOn = o.sleeve !== false;
    K.sleeveFill = P.fx && P.s >= 0.25 ? (age > 0.5 ? namiUsagi(ctx, K.sleeve, K.sleeveFg, o.patternUnit || 76) : kasuri(ctx, K.childSleeve, K.childSleeveFg, 30)) : (age > 0.5 ? K.sleeve : K.childSleeve);
    const dy = (1 - il) * 30;
    // left hand, then the right over it (its index crosses over at the top),
    // then the left thumb's tip again so it passes over the right thumb: interlaced
    foxHand(P, -1, K, age, -gap, dy, tw, 'all');
    foxHand(P, 1, K, age, gap, dy, -tw * 0.8, 'all');
    foxHand(P, -1, K, age, -gap, dy, tw, 'thumbTip');
    return foxWindowGeom(il, tw);
  }
  function foxWindowGeom(il, tw) {
    const k = 0.35 + 0.65 * il;
    return { center: [0, tw * 0.1], w: FW.W * 2 * k, h: FW.H * 2 * k, corners: [[-FW.W * k, 0], [0, -FW.H * k], [FW.W * k, 0], [0, FW.H * k]] };
  }

  define('hands', {
    poses: ['fox-window', 'cupped', 'grab', 'ladle'],
    defaults: {},
    size: 600,
    bounds(pose) {
      if (pose === 'cupped') return [-110, -110, 220, 330];
      if (pose === 'grab') return [-175, -130, 350, 350];
      if (pose === 'ladle') return [-300, -130, 560, 520];
      return [-680, -180, 1360, 545];
    },
    draw(ctx, P, o) { return drawHands(ctx, P, o, Object.assign({}, pal(HANDS, o))); },
  });
  /**
   * The fox window's inner diamond in the caller's space (same args as
   * CAST.hands): { cx, cy, w, h, corners, path(ctx) } — path adds the
   * diamond to ctx's current path (for clip), after ctx.beginPath().
   */
  CAST.foxWindowRect = (x, y, scale, opts) => {
    opts = opts || {};
    scale = scale == null ? 1 : scale;
    const il = opts.interlace == null ? 1 : U.ease.inOutSine(U.clamp(opts.interlace));
    const t = opts.t || 0, tr = opts.tremble || 0;
    const tw = tr ? (Math.sin(t * 47) * 0.6 + Math.sin(t * 29 + 1) * 0.4) * 3 * tr : 0;
    const f = opts.facing != null && opts.facing < 0 ? -1 : 1;
    const g = foxWindowGeom(il, tw);
    const corners = g.corners.map(([px, py]) => [x + px * scale * f, y + py * scale]);
    return {
      cx: x + g.center[0] * scale * f, cy: y + g.center[1] * scale, w: g.w * scale, h: g.h * scale, corners,
      path(ctx) {
        ctx.moveTo(corners[0][0], corners[0][1]);
        for (let i = 1; i < 4; i++) ctx.lineTo(corners[i][0], corners[i][1]);
        ctx.closePath();
      },
    };
  };

  define('grandma', {
    poses: ['seiza', 'engawa', 'stack', 'pour', 'lift-haori', 'lap', 'hold-puppet', 'walk'],
    defaults: {},
    bounds(pose, o) {
      if (o.view === 'back') return [-48, -142, 96, 150];
      if (pose === 'engawa') return [-50, -150, 110, 212];
      if (pose === 'walk') return [-50, -230, 110, 236];
      if (pose === 'lap') return [-60, -150, 250, 158];
      if (pose === 'lift-haori') return [-70, -225, 200, 232];
      if (pose === 'hold-puppet') return [-60, -165 - (o.stick == null ? 70 : o.stick), 150, 172 + (o.stick == null ? 70 : o.stick)];
      if (pose === 'pour') return [-60, -150, 150, 156];
      return [-60, -150, 135, 156];
    },
    draw(ctx, P, o) { return drawGrandma(ctx, P, o, pal(o.drained ? GRANDMA_DRAINED : GRANDMA, o)); },
  });
  define('oldSayo', {
    poses: REG.grandma.poses,
    defaults: {},
    bounds: REG.grandma.bounds,
    draw(ctx, P, o) { return drawGrandma(ctx, P, o, pal(o.drained ? Object.assign({}, GRANDMA_DRAINED, { hair: OLD_SAYO.hair }) : OLD_SAYO, o)); },
  });
  /* ================================================================== */
  /* 影絵 — shadow-play puppets: flat cut paper as Path2D                 */
  /* CAST.puppet(name, ctx, x, y, scale, opts) builds the path only;      */
  /* CAST.drawPuppet(ctx, name, x, y, scale, opts) fills or cuts it.      */
  /* ================================================================== */
  const AINEZU = U.mix(C.ai, C.nezumi, 0.5);        // 藍鼠: shadows on shoji, never black
  const polyArea = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const q = pts[i], r = pts[(i + 1) % pts.length]; a += q[0] * r[1] - r[0] * q[1]; } return a; };
  /** Path builder whose subpaths all wind clockwise (holes anticlockwise), so a nonzero fill is an exact union. */
  function PB() {
    const p = new Path2D();
    const B = {
      p,
      poly(pts, smooth, hole) {
        if ((polyArea(pts) < 0) !== !!hole) pts = pts.slice().reverse();
        if (smooth === false) { p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.closePath(); } else sp(pts, true, p);
        return B;
      },
      ell(cx, cy, rx, ry, r, hole) {
        r = r || 0;
        p.moveTo(cx + rx * Math.cos(r), cy + rx * Math.sin(r));
        p.ellipse(cx, cy, rx, ry, r, 0, TAU, !!hole);
        return B;
      },
      /** A tapered limb/cord along pts with round ends. */
      tube(pts, w0, w1, hole) {
        const c = pts.length > 2 ? crs(pts, 4) : pts;
        const n = c.length, L = [], R = [];
        for (let i = 0; i < n; i++) {
          const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
          const dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
          const nx = -(b[1] - a[1]) / dl, ny = (b[0] - a[0]) / dl;
          const w = (w0 + (w1 - w0) * i / (n - 1)) / 2;
          L.push([c[i][0] + nx * w, c[i][1] + ny * w]); R.push([c[i][0] - nx * w, c[i][1] - ny * w]);
        }
        B.poly(L.concat(R.reverse()), false, hole);
        if (w0 > 1.5) B.ell(c[0][0], c[0][1], w0 / 2, w0 / 2, 0, hole);
        if (w1 > 1.5) B.ell(c[n - 1][0], c[n - 1][1], w1 / 2, w1 / 2, 0, hole);
        return B;
      },
    };
    return B;
  }
  const ikPts = (s, tg, L1, L2, bend) => {
    const [a1, a2] = ik(s, tg, L1, L2, bend);
    const el = [s[0] + Math.sin(a1) * L1, s[1] + Math.cos(a1) * L1];
    return [el, [el[0] + Math.sin(a2) * L2, el[1] + Math.cos(a2) * L2]];
  };
  const smooth01 = (x) => { x = U.clamp(x); return x * x * (3 - 2 * x); };

  /* --- 竹取の翁 the bamboo-cutter: hunched, 烏帽子, long beard, a hatchet (design H 180) --- */
  function puppetOkina(pb, o) {
    const t = o.t || 0;
    const cut = o.pose === 'cut';
    const ph = (o.phase == null ? t * 0.9 : o.phase) * TAU;
    const sw = smooth01(o.swing == null ? 0 : o.swing);
    // legs first (to find the ground): thin, knees always a little bent
    const hip = [6, -68];
    const legs = cut ? [[0.46, 0.3], [-0.34, 0.16]] : [[Math.sin(ph) * 0.4, 0.28 + Math.max(0, Math.sin(ph + 1.6)) * 0.55], [Math.sin(ph + Math.PI) * 0.4, 0.28 + Math.max(0, Math.sin(ph + Math.PI + 1.6)) * 0.55]];
    const LJ = legs.map(([a, kb]) => {
      const k = [hip[0] + Math.sin(a) * 33, hip[1] + Math.cos(a) * 33];
      const a2 = a - kb;
      return [hip, k, [k[0] + Math.sin(a2) * 33, k[1] + Math.cos(a2) * 33]];
    });
    const bob = cut ? 0 : Math.abs(Math.cos(ph)) * 1.5;
    const dy = -Math.max(LJ[0][2][1], LJ[1][2][1]) - 4;
    const Y = (p) => [p[0], p[1] + dy, p[2]];
    for (const L of LJ) {
      pb.tube(L.map(Y), 9.5, 6.5);
      const f = Y(L[2]);
      pb.poly([[f[0] - 5, f[1] - 3], [f[0] + 11, f[1] - 2], [f[0] + 13, f[1] + 3, 1], [f[0] - 6, f[1] + 4, 1]], true);
    }
    // torso leans forward from the hip; more as the hatchet strikes
    const lean = cut ? 0.04 + sw * 0.24 : 0.12;
    const R = (p) => { const q = Y(rot(p, hip[0], hip[1], lean)); return [q[0], q[1] - bob, p[2]]; };
    const P0 = (arr) => arr.map(R);
    // kimono tucked up at the back (尻端折り), obi, hunched back
    pb.poly(P0([[20, -134], [30, -127], [35, -112], [33, -94], [34, -84], [30, -60, 1], [-8, -62, 1], [-11, -80], [-8, -100], [2, -122], [11, -132]]));
    const HD = (arr) => P0(arr.map(([x, y, c]) => [34 + (x - 34) * 1.2, -140 + (y + 140) * 1.2, c]));
    pb.poly(HD([[20, -140], [21, -150], [30, -157], [40, -154], [44, -148], [49, -143, 1], [45, -140], [45, -137], [43, -134], [47, -112, 1], [36, -122], [30, -131], [22, -134]]));   // bald head, nose, long beard
    pb.ell(...HD([[27, -157]])[0], 3.8, 5.2, -0.6);                                                                      // topknot (髷)
    // the hatchet arm (IK) with its hanging sleeve
    const S = R([22, -124]);
    let hand, ha;
    if (cut) {
      hand = R([U.lerp(4, 64, sw), U.lerp(-190, -100, sw)]);
      ha = U.lerp(-2.0, 0.55, sw) + lean;
    } else { hand = R([36 + Math.sin(ph) * 3, -92]); ha = 1.15 + Math.sin(ph) * 0.1; }
    const [el, hd] = ikPts(S, hand, 29, 29, cut ? -1 : -1);
    const dn = [el[0] - S[0], el[1] - S[1]], dl = Math.hypot(dn[0], dn[1]) || 1;
    const nx = -dn[1] / dl, ny = dn[0] / dl, sg = ny > 0 ? 1 : -1;               // the sleeve hangs below the upper arm
    pb.poly([S, el, [el[0] + nx * sg * 16 - dn[0] * 0.1, el[1] + ny * sg * 16], [S[0] + nx * sg * 20, S[1] + ny * sg * 20]], true);
    pb.tube([S, el, hd], 9, 6.5);
    const u = [Math.cos(ha), Math.sin(ha)], v = [-u[1], u[0]];
    const hl = cut ? 66 : 44;
    const E = [hd[0] + u[0] * hl, hd[1] + u[1] * hl];
    pb.tube([[hd[0] - u[0] * 6, hd[1] - u[1] * 6], E], 4.5, 4);
    const q = (a, b) => [E[0] + u[0] * a + v[0] * b, E[1] + u[1] * a + v[1] * b];
    pb.poly([q(-13, 2), q(5, 2), q(10, 19, 1), q(-19, 21, 1)], false);         // blade
    // the far arm: both hands on the haft when cutting; walking, it leans on a staff (杖)
    const Sf = R([14, -122]);
    const hf = cut ? [hd[0] - u[0] * 10, hd[1] - u[1] * 10] : R([46, -104]);
    const [ef, hf2] = ikPts(Sf, hf, 29, 29, 1);
    pb.tube([Sf, ef, hf2], 8, 6);
    if (!cut) {
      const foot = [hf2[0] + 12 + Math.sin(ph + 0.8) * 6, dy - 2];
      pb.tube([[hf2[0] - 1, hf2[1] - 8], foot], 4, 3.4);
    }
    return { blade: q(-4, 18), hand: hd, feet: LJ.map((L) => Y(L[2])), grips: [R([2, -96]), R([24, -150])], bbox: [-40, -214, 140, 220] };
  }

  /* --- three bamboo culms with leaf sprays; a shining slit; the split node (design px) --- */
  function puppetBamboo(pb, o) {
    const t = o.t || 0, wind = o.wind == null ? 0.25 : o.wind;
    const shine = o.shine == null ? 0 : U.clamp(+o.shine);
    const split = smooth01(o.split || 0);
    const culms = [[-70, 540, 15, -0.035, 1], [0, 620, 19, 0.012, 2], [60, 500, 14, 0.05, 3]];
    const segA = -92, segB = -164;                           // the glowing segment of the middle culm
    let node = null;
    for (const [bx, H, w, lean, k] of culms) {
      const sway = Math.sin(t * 0.8 + k * 1.7) * 0.02 * (0.3 + wind);
      const X = (y) => bx - lean * y + sway * y * y / H;
      const pt = (y) => [X(y), y];
      const W = (y) => w * (1 - 0.3 * (-y / H));
      const tubeY = (y0, y1) => pb.tube([pt(y0), pt((y0 + y1) / 2), pt(y1)], W(y0), W(y1));
      if (k === 2) {
        tubeY(0, segA);
        tubeY(segB, -H);
        const ym = (segA + segB) / 2;
        node = pt(ym);
        if (split <= 0.001) {
          tubeY(segA, segB);
          if (shine > 0) pb.ell(node[0], node[1], 1 + 1.6 * shine, 3 + 6 * shine, 0, true);   // the slit: a hole
        } else {
          // the culm splits: two thin shells bow apart, leaving light between them
          for (const s of [-1, 1]) {
            const pts = [], inn = [];
            for (let i = 0; i <= 8; i++) {
              const y = segA + (segB - segA) * i / 8;
              const b = Math.sin(Math.PI * i / 8) * (4 + 10 * split);
              const c = X(y), ww = W(y) / 2;
              pts.push([c + s * (ww + b), y]);
              inn.push([c + s * (ww + b - ww * (0.9 - 0.55 * split)), y]);
            }
            pb.poly(pts.concat(inn.reverse()), false);
          }
        }
      } else tubeY(0, -H);
      // nodes: slight rings
      for (let y = -44; y > -H + 20; y -= 72) pb.ell(X(y), y, W(y) * 0.62, 2.4);
      // leaf sprays from the upper nodes, alternating sides
      let side = k % 2 ? 1 : -1;
      for (let y = -H * 0.52; y > -H + 10; y -= 58) {
        side = -side;
        const b0 = pt(y);
        const tw = [b0[0] + side * 26, b0[1] - 10 + Math.sin(t * 1.1 + y) * 1.5 * (0.3 + wind)];
        pb.tube([b0, [b0[0] + side * 12, b0[1] - 7], tw], 2.4, 1.4);
        for (let j = 0; j < 3; j++) {
          const a = (side > 0 ? 0.25 : Math.PI - 0.25) + side * (j - 1) * 0.55 + Math.sin(t * 1.3 + j + y * 0.1) * 0.08 * (0.3 + wind) + side * 0.35;
          const L = 34 - j * 4;
          const base = [tw[0] - side * j * 6, tw[1] + j * 2];
          const tip = [base[0] + Math.cos(a) * L, base[1] + Math.sin(a) * L];
          const n = [-Math.sin(a), Math.cos(a)];
          const mid = [base[0] + Math.cos(a) * L * 0.4, base[1] + Math.sin(a) * L * 0.4];
          pb.poly([base, [mid[0] + n[0] * 3.6, mid[1] + n[1] * 3.6], [tip[0], tip[1], 1], [mid[0] - n[0] * 3.6, mid[1] - n[1] * 3.6]], true);
        }
      }
    }
    return { node, grips: [[-70, -60], [60, -60]], bbox: [-140, -640, 280, 646], stickLen: 220 };
  }

  /* --- かぐや姫 as a negative puppet: child → girl → woman, one path of 22 keypoints --- */
  //   crown, forehead, brow, nose, lips, chin, throat, collar, sleeve top, sleeve fore,
  //   sleeve back, knee, hem front, hem, train end, train top, hair end, hair hips,
  //   hair waist, hair back, nape, back of head — facing +x, feet at (0,0)
  const KAG_CHILD = [[-2, -42], [4, -40], [7, -36], [8, -34.5, 1], [7, -33], [5.5, -31], [2.5, -29.5], [6, -28], [9, -25], [11, -15], [2, -14], [7, -9], [8, -1], [3, 0], [-7, 0, 1], [-6, -2], [-6, -8], [-6, -13], [-6, -20], [-6, -26], [-7.5, -31, 1], [-7, -38]];
  const KAG_GIRL = [[-4, -112], [5, -107], [9, -100], [11, -97, 1], [9, -94], [7, -90], [3, -87], [9, -82], [15, -74], [20, -46], [3, -42], [11, -28], [15, -3], [5, 0], [-22, 0, 1], [-16, -5], [-14, -30], [-13, -48], [-13, -66], [-12, -80], [-11, -93], [-10, -104]];
  const KAG_WOMAN = [[-4, -190], [8, -185], [12, -178], [17, -172, 1], [13, -168], [14, -165], [10, -160], [3, -156], [18, -140], [32, -82, 1], [14, -72], [18, -44], [24, -2], [8, 0], [-60, 0, 1], [-40, -7], [-28, -3], [-26, -70], [-24, -112], [-21, -142], [-19, -162], [-14, -183]];
  // paper bridges left inside her hole (dark slits under evenodd): the sleeve's back
  // edge, the hair falling apart from the robe, two hem layers, the hairline by the face.
  // [points..., width] per keyframe, same counts so they morph with her.
  const KAG_SLITS = {
    child: [[[5, -25], [4, -20], [3, -15], 0.8], [[-5, -30], [-5, -28], [-5, -27], [-5, -26], 0], [[7, -3], [2, -3], [-2, -3], [-5, -2], 0], [[6, -5], [2, -5], [-2, -4], 0], [[0.8, -39.5], [-0.4, -36], [0.6, -32], 0.8]],
    girl: [[[10, -74], [7, -58], [4, -44], 1.6], [[-8, -92], [-10, -76], [-11, -60], [-12, -48], 1.4], [[13, -6], [0, -6], [-10, -5], [-18, -3], 1.1], [[12, -11], [2, -11], [-6, -9], 0.3], [[1.5, -107], [-0.5, -99], [1, -91], 1.2]],
    woman: [[[14, -136], [15, -106], [14, -76], 2.2], [[-13, -160], [-17, -120], [-19, -80], [-21, -18], 2.0], [[22, -9], [0, -10], [-26, -8], [-50, -4], 1.6], [[20, -17], [-2, -18], [-24, -14], 1.4], [[1, -187], [-3, -175], [0, -163], 1.8]],
  };
  function kaguyaKeys(grow, raise) {
    const g = U.clamp(grow == null ? 1 : grow);
    const A = g < 0.5 ? KAG_CHILD : KAG_GIRL, Bk = g < 0.5 ? KAG_GIRL : KAG_WOMAN;
    const SA = g < 0.5 ? KAG_SLITS.child : KAG_SLITS.girl, SB = g < 0.5 ? KAG_SLITS.girl : KAG_SLITS.woman;
    const f = smooth01(g < 0.5 ? g / 0.5 : (g - 0.5) / 0.5);
    const pts = A.map((p, i) => [U.lerp(p[0], Bk[i][0], f), U.lerp(p[1], Bk[i][1], f), p[2]]);
    const slits = SA.map((sl, i) => sl.map((p, j) => (typeof p === 'number' ? U.lerp(p, SB[i][j], f) : [U.lerp(p[0], SB[i][j][0], f), U.lerp(p[1], SB[i][j][1], f)])));
    const r = smooth01(raise || 0);
    if (r > 0) {
      const H = -pts[0][1], k = H / 190;
      const neck = pts[6];
      const R = (p) => rot(p, neck[0], neck[1], 0.22 * r);
      // bow the head, and lift the sleeve to the face: the forearm rises, the sleeve hangs from it
      for (const i of [0, 1, 2, 3, 4, 5, 21]) { const q = R(pts[i]); pts[i] = [q[0], q[1], pts[i][2]]; }
      slits[4] = slits[4].map((p) => (typeof p === 'number' ? p : R(p)));
      // the sleeve covers her face below the eyes: nose, lips and chin slide under its edge
      const up = [[25, -171], [35, -106], [14, -96]];
      for (let j = 0; j < 3; j++) pts[8 + j] = [U.lerp(pts[8 + j][0], up[j][0] * k, r), U.lerp(pts[8 + j][1], up[j][1] * k, r), j === 1 ? 1 : 0];
      for (let j = 4; j <= 7; j++) { const q = lerpPt(pts[3], pts[8], (j - 3) / 5); pts[j] = [U.lerp(pts[j][0], q[0], r), U.lerp(pts[j][1], q[1], r)]; }
      const us = [[15, -164], [16, -134], [15, -100]];
      slits[0] = slits[0].map((p, j) => (typeof p === 'number' ? p : [U.lerp(p[0], us[j][0] * k, r), U.lerp(p[1], us[j][1] * k, r)]));
    }
    return { pts, slits };
  }
  /** A slit of paper left inside a hole: a closed sliver, pointed at both ends (no caps: evenodd-safe). */
  function slitPoly(pb, pts, w) {
    if (w < 0.25) return;
    const c = crs(pts, 5), n = c.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)];
      const dl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = -(b[1] - a[1]) / dl, ny = (b[0] - a[0]) / dl;
      const ww = w * Math.pow(Math.sin(Math.PI * i / (n - 1)), 0.6) / 2;
      L.push([c[i][0] + nx * ww, c[i][1] + ny * ww]); R.push([c[i][0] - nx * ww, c[i][1] - ny * ww]);
    }
    pb.poly(L.concat(R.reverse().slice(1, -1)), false);
  }
  function puppetKaguya(pb, o) {
    const { pts, slits } = kaguyaKeys(o.grow, o.raise);
    let x0 = Infinity, x1 = -Infinity;
    for (const p of pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); }
    const H = -pts[0][1];
    const cx = (x0 + x1) / 2;
    const rx = (x1 - x0) / 2 + 6 + H * 0.07;
    let ret;
    if (o.card === 'oval') {
      const orx = rx * 1.3, ory = H * 0.62 + 10;
      pb.ell(cx, -H / 2, orx, ory);
      ret = { center: [cx, -H / 2], rx: orx, ry: ory, grips: [[cx, -H / 2 + ory * 0.8]], bbox: [cx - orx, -H / 2 - ory, orx * 2, ory * 2] };
    } else {
      // the dark card: arched top, straight sides, a flat foot she stands on
      const card = [], foot = 6 + H * 0.05, top = -H - 8 - H * 0.05, shoulder = top + rx * 1.1;
      for (let i = 0; i <= 20; i++) { const a = Math.PI + (i / 20) * Math.PI; card.push([cx + rx * Math.cos(a), shoulder + (shoulder - top) * Math.sin(a)]); }
      const rc = Math.min(8, rx * 0.2);
      card.push([cx + rx, foot - rc], [cx + rx - rc * 0.3, foot - rc * 0.3], [cx + rx - rc, foot], [cx - rx + rc, foot], [cx - rx + rc * 0.3, foot - rc * 0.3], [cx - rx, foot - rc]);
      pb.poly(card, false);
      ret = { center: [cx, (top + foot) / 2], rx, ry: (foot - top) / 2, grips: [[cx, foot - 3]], bbox: [cx - rx, top, rx * 2, foot - top] };
    }
    pb.poly(pts, true);                              // her figure: a hole under evenodd
    for (const sl of slits) slitPoly(pb, sl.slice(0, -1), sl[sl.length - 1]);
    return Object.assign(ret, { rule: 'evenodd', head: pts[3], height: H, stickLen: 180 });
  }
  /** Kaguya on a cut-out engawa: the card is eave, post and boards; she is light. raise 0..1. */
  function puppetKaguyaEngawa(pb, o) {
    const k = 0.92;
    const kk = kaguyaKeys(1, o.raise == null ? 0 : o.raise);
    const pts = kk.pts.map((p) => [p[0] * k + 6, p[1] * k - 12, p[2]]);
    pb.poly([[-116, 12], [116, 12], [116, -214], [96, -214], [104, -236, 1], [-104, -236, 1], [-96, -214], [-116, -214]], false);
    pb.poly(pts, true);
    for (const sl of kk.slits) slitPoly(pb, sl.slice(0, -1).map((p) => [p[0] * k + 6, p[1] * k - 12]), sl[sl.length - 1] * k);
    // light slits: the eave's lower edge, the post's edge, two board gaps
    pb.poly([[-96, -212], [96, -212], [96, -208], [-96, -208]], false);
    pb.poly([[-88, -206], [-85, -206], [-85, -14], [-88, -14]], false);
    pb.poly([[-116, -6], [116, -6], [116, -4], [-116, -4]], false);
    pb.poly([[-116, 3], [116, 3], [116, 5], [-116, 5]], false);
    return { rule: 'evenodd', head: pts[3], grips: [[-60, 10], [70, 10]], bbox: [-118, -238, 236, 252], stickLen: 160 };
  }

  /* --- 鳳輦: the emperor's palanquin with a phoenix finial and four bearers (design px) --- */
  function bearer(pb, bx, ph, poleY) {
    const hip = [bx, -38];
    const LJ = [0, Math.PI].map((k) => {
      const a = Math.sin(ph + k) * 0.38, kb = 0.1 + Math.max(0, Math.sin(ph + k + 1.6)) * 0.5;
      const kn = [hip[0] + Math.sin(a) * 20, hip[1] + Math.cos(a) * 20];
      const a2 = a - kb;
      return [hip, kn, [kn[0] + Math.sin(a2) * 20, kn[1] + Math.cos(a2) * 20]];
    });
    const dy = -Math.max(LJ[0][2][1], LJ[1][2][1]) - 2;
    const Y = (p) => [p[0], p[1] + dy];
    for (const L of LJ) { pb.tube(L.map(Y), 7, 5); const f = Y(L[2]); pb.poly([[f[0] - 3, f[1] - 2], [f[0] + 8, f[1] - 1], [f[0] + 8, f[1] + 2], [f[0] - 3, f[1] + 2]], false); }
    const sh = poleY + 3;
    pb.poly([[bx - 7, sh], [bx + 8, sh], [bx + 10, -44 + dy], [bx + 12, -28 + dy, 1], [bx - 12, -28 + dy, 1], [bx - 9, -44 + dy]], true);
    pb.ell(bx + 3, sh - 9, 6.5, 7);
    pb.poly([[bx - 3, sh - 12], [bx + 7, sh - 14], [bx + 3, sh - 21], [bx - 3, sh - 23, 1], [bx - 5, sh - 16]], true);   // eboshi
    pb.tube([[bx + 2, sh + 2], [bx + 12, sh + 10], [bx + 8, poleY - 1]], 5, 4);
  }
  function puppetPalanquin(pb, o) {
    const t = o.t || 0;
    const ph = (o.phase == null ? t * 1.1 : o.phase) * TAU;
    const bob = Math.abs(Math.sin(ph)) * 2;
    const py = -70 - bob;
    for (const [bx, k] of [[-118, 0], [-96, Math.PI], [96, Math.PI * 0.5], [118, Math.PI * 1.5]]) bearer(pb, bx, ph + k, py);
    pb.tube([[-150, py], [150, py]], 5, 5);
    const by = py - 3;
    pb.poly([[-48, by], [48, by], [44, by - 10], [-44, by - 10]], false);
    pb.poly([[-38, by - 9], [38, by - 9], [38, by - 64], [-38, by - 64]], false);
    for (const yy of [-22, -34, -46]) pb.poly([[-30, by + yy], [30, by + yy], [30, by + yy - 3], [-30, by + yy - 3]], false, true);   // sudare slits
    pb.poly([[-66, by - 57, 1], [-50, by - 63], [50, by - 63], [66, by - 57, 1], [48, by - 72], [22, by - 90], [0, by - 97], [-22, by - 90], [-48, by - 72]], true);   // the roof, eaves turned up
    // tassels at the eaves
    for (const s of [-1, 1]) {
      const sway = Math.sin(t * 2.2 + s) * 2;
      pb.tube([[s * 58, by - 62], [s * 59 + sway * 0.5, by - 48], [s * 60 + sway, by - 36]], 1.8, 1.6);
      pb.poly([[s * 60 + sway - 3, by - 36], [s * 60 + sway + 3, by - 36], [s * 60 + sway + 2, by - 26], [s * 60 + sway - 2, by - 26]], true);
    }
    // the phoenix (鳳凰) finial: body, crest, raised wings, three plumes
    const fx = 0, fy = by - 98;
    pb.tube([[fx, fy], [fx, fy - 8]], 4, 3);
    pb.ell(fx, fy - 14, 8, 5, -0.2);
    pb.tube([[fx + 5, fy - 16], [fx + 9, fy - 24], [fx + 12, fy - 27]], 4, 3);
    pb.poly([[fx + 11, fy - 29], [fx + 18, fy - 27, 1], [fx + 12, fy - 25]], false);
    pb.tube([[fx + 10, fy - 29], [fx + 7, fy - 36]], 1.6, 0.8);
    pb.poly([[fx - 3, fy - 17], [fx - 2, fy - 38], [fx + 6, fy - 44, 1], [fx + 4, fy - 30], [fx + 3, fy - 18]], true);
    pb.poly([[fx - 5, fy - 15], [fx - 14, fy - 34], [fx - 10, fy - 42, 1], [fx - 4, fy - 30]], true);
    for (let j = 0; j < 3; j++) {
      // long tail plumes arching back and falling, tips curled
      const w = Math.sin(t * 1.6 + j) * 1.5;
      pb.tube([[fx - 6, fy - 13], [fx - 18 - j * 2, fy - 20 - j * 3 + w], [fx - 30 - j * 4, fy - 16 - j * 2 + w], [fx - 36 - j * 5, fy - 4 + j * 2 + w], [fx - 32 - j * 5, fy + 2 + j * 2 + w]], 2.8, 1.2);
    }
    return { grips: [[-40, by - 20], [40, by - 20]], bbox: [-160, -214, 320, 220], stickLen: 150 };
  }

  /* --- 瑞雲: a scalloped cloud bearing tennyo and a canopied carriage (design px) --- */
  function tennyoShadow(pb, x, y, s, f, t, ph, rib) {
    // a flying apsara (飛天): body level, chest lifted, the skirt trailing to a point,
    // one arm forward with a lotus, scarves (披帛) streaming above and below
    const T = (px, py) => [x + px * s * f, y + py * s];
    const w = (u, k) => Math.sin(t * 2.2 + ph - u * 5.5 + k) * 4.5 * u;
    pb.ell(...T(22, -11), 4.6 * s, 4.8 * s);                               // head
    pb.ell(...T(20.5, -16.5), 3 * s, 2.8 * s);                             // topknot
    pb.poly([T(19, -7), T(12, -1), T(2, 3), T(-6, 6), T(-4, -3), T(6, -8), T(15, -12)], true);                  // torso
    pb.poly([T(-2, -3), T(-18, -3), T(-32, -5), T(-47, -10 + w(1, 0) * 0.3, 1), T(-37, 1), T(-20, 7), T(-4, 8)], true);   // skirt
    pb.tube([T(15, -7), T(23, 1), T(31, -3)], 3 * s, 2.4 * s);           // arm forward
    pb.poly([T(20, -1), T(28, 0), T(27, 10, 1), T(21, 7)], true);         // its sleeve
    pb.ell(...T(33, -5), 3 * s, 2.2 * s, -0.4 * f);                        // lotus
    pb.tube([T(12, -9), T(4, -14), T(-3, -12)], 2.6 * s, 2.2 * s);       // far arm back
    for (const [k, L, pts0] of [[0, rib, [[13, -12], [4, -22], [-12, -24], [-30, -17], [-50, -22], [-70, -15]]], [1.9, 1, [[-3, 6], [-20, 14], [-38, 12], [-56, 18]]]]) {
      const pts = pts0.map(([px, py], i) => { const u = i / (pts0.length - 1); return T(px - (L - 1) * 60 * u * u, py + w(u, k) * (0.7 + 0.3 * L)); });
      pb.tube(pts, 2.4 * s, 0.9 * s);
    }
  }
  function puppetCloud(pb, o) {
    const t = o.t || 0;
    const puff = (i) => 1 + 0.035 * Math.sin(t * 0.9 + i * 1.7);
    const C0 = [[-150, 6, 26], [-110, -8, 34], [-62, -18, 42], [-8, -22, 46], [46, -16, 40], [94, -6, 32], [132, 4, 24], [-90, 16, 26], [-30, 16, 32], [30, 16, 28], [86, 14, 22]];
    C0.forEach(([cx, cy, r], i) => pb.ell(cx, cy, r * puff(i), r * 0.8 * puff(i + 3)));
    // the curling tail behind (瑞雲の尾)
    for (let i = 0; i < 9; i++) {
      const u = i / 8, a = -0.4 - u * 2.6;
      pb.ell(150 + u * 90 + Math.cos(a) * 14 * u, 14 - u * 26 + Math.sin(a) * 14 * u, (20 - u * 13) * puff(i + 11), (15 - u * 10) * puff(i + 11));
    }
    // 羅蓋: the canopy on its pole, tassels swaying; a small carriage beneath
    const cx = -20;
    pb.poly([[cx - 30, -36], [cx + 30, -36], [cx + 26, -80], [cx - 26, -80]], false);
    pb.poly([[cx - 34, -80], [cx + 34, -80], [cx + 30, -86], [cx - 30, -86]], false);
    pb.tube([[cx, -86], [cx, -150]], 3.4, 3);
    pb.poly([[cx - 52, -142], [cx - 20, -160], [cx, -168], [cx + 20, -160], [cx + 52, -142, 1], [cx + 30, -146], [cx, -154], [cx - 30, -146]], true);
    pb.ell(cx, -174, 5, 6);
    for (let j = -2; j <= 2; j++) {
      const sx = cx + j * 24, sw = Math.sin(t * 1.8 + j) * 2;
      pb.tube([[sx, -146 + Math.abs(j) * 2], [sx + sw * 0.5, -130], [sx + sw, -116]], 1.4, 1.2);
      pb.ell(sx + sw, -113, 2.6, 3.4);
    }
    // seven celestials around it
    const TN = [[-190, -70, 1, 0], [-130, -120, 0.9, 1], [70, -120, 1.05, 2], [140, -70, 0.9, 3], [-80, -190, 0.85, 4], [30, -200, 0.95, 5], [190, -150, 0.8, 6]];
    const rib = o.ribbon == null ? 1.8 : o.ribbon;
    for (const [x, y, s, i] of TN) tennyoShadow(pb, x, y + Math.sin(t * 0.7 + i) * 3, s * 1.1, -1, t, i * 1.3, i === 0 ? rib * 2.2 : rib);
    return { grips: [], bbox: [-340, -240, 620, 290] };
  }

  /* --- the paper moon on its stick --- */
  function puppetMoon(pb, o) {
    const r = o.r == null ? 100 : o.r;
    pb.ell(0, 0, r, r);
    return { grips: [[0, r - 2]], bbox: [-r, -r, 2 * r, 2 * r], stickLen: 2.2 * r, center: [0, 0], r };
  }

  const PUPPETS = {
    okina: { build: puppetOkina, unit: 1 / 3, opts: 'pose walk|cut, phase (walk, default t·0.9), swing 0..1 (cut)' },
    bamboo: { build: puppetBamboo, unit: 1, opts: 'shine 0..1 (slit of light), split 0..1, wind' },
    kaguya: { build: puppetKaguya, unit: 1, opts: 'grow 0..1 (child 42 → girl 112 → woman 190 px), raise 0..1' },
    'kaguya-engawa': { build: puppetKaguyaEngawa, unit: 1, opts: 'raise 0..1 (sleeve to her face)' },
    palanquin: { build: puppetPalanquin, unit: 1, opts: 'phase (default t·1.1)' },
    cloud: { build: puppetCloud, unit: 1, opts: 'ribbon (scarf length multiplier, default 1.8)' },
    moon: { build: puppetMoon, unit: 1, opts: 'r (default 100)' },
  };

  /**
   * Build a puppet's paths in the caller's space. Returns
   *   { path: Path2D, rule: 'nonzero'|'evenodd', sticks: Path2D|null,
   *     ends: [[x,y]] (the sticks' far ends, for the puppeteer's hands),
   *     bbox: [x0,y0,x1,y1], ...named points (node, blade, head, center…) }
   * opts: t, facing (±1), sticks (default true), stickAngle (rad from straight
   * down, + toward +x, default 0.35 — NOT mirrored by facing), stickLen (px),
   * stickW (px), plus the puppet's own options (see CAST.PUPPETS).
   */
  CAST.puppet = (name, ctx, x, y, scale, opts) => {
    const d = PUPPETS[name];
    if (!d) return null;
    const o = opts || {};
    scale = scale == null ? 1 : scale;
    const f = o.facing != null && o.facing < 0 ? -1 : 1;
    const k = scale * d.unit;
    const pb = PB();
    const r = d.build(pb, o) || {};
    const path = new Path2D();
    path.addPath(pb.p, new DOMMatrix([k * f, 0, 0, k, x, y]));
    const M = (p) => [x + p[0] * k * f, y + p[1] * k];
    const out = { path, rule: r.rule || 'nonzero', sticks: null, ends: [] };
    for (const key of Object.keys(r)) {
      const v = r[key];
      if (key === 'bbox' || key === 'grips' || key === 'rule' || key === 'stickLen') continue;
      if (Array.isArray(v) && v.length >= 2 && typeof v[0] === 'number') out[key] = M(v);
      else if (Array.isArray(v) && Array.isArray(v[0])) out[key] = v.map(M);
      else if (typeof v === 'number') out[key] = /^(r|rx|ry)$/.test(key) ? v * k : v;
    }
    const bb = r.bbox || [-100, -200, 200, 200];
    const c0 = M([bb[0], bb[1]]), c1 = M([bb[0] + bb[2], bb[1] + bb[3]]);
    out.bbox = [Math.min(c0[0], c1[0]), Math.min(c0[1], c1[1]), Math.max(c0[0], c1[0]), Math.max(c0[1], c1[1])];
    if (o.sticks !== false && r.grips && r.grips.length) {
      const sp2 = PB();
      const a = o.stickAngle == null ? 0.35 : o.stickAngle;
      const L = o.stickLen == null ? (r.stickLen || 200) * k : o.stickLen;
      const w = o.stickW == null ? Math.max(1.6, 2.6 * Math.sqrt(k)) : o.stickW;
      for (const g of r.grips) {
        const p0 = M(g), p1 = [p0[0] + Math.sin(a) * L, p0[1] + Math.cos(a) * L];
        sp2.tube([p0, p1], w, w * 1.15);
        out.ends.push(p1);
        out.bbox[0] = Math.min(out.bbox[0], p1[0]); out.bbox[2] = Math.max(out.bbox[2], p1[0]); out.bbox[3] = Math.max(out.bbox[3], p1[1]);
      }
      out.sticks = sp2.p;
    }
    return out;
  };
  CAST.PUPPETS = {};
  for (const n of Object.keys(PUPPETS)) CAST.PUPPETS[n] = PUPPETS[n].opts;

  /**
   * Draw a puppet's shadow. opts (besides CAST.puppet's): color (default 藍鼠),
   * alpha, mode 'shadow' (fill with ctx's current composite, e.g. multiply) |
   * 'cut' (destination-out: punch it out of what is there) | 'light' (fill,
   * colour default 月白); penumbra (px): soft edge by offset low-alpha passes
   * (1 for puppets held against the paper, 6–10 for things far from it).
   * With penumbra or alpha < 1 the puppet is drawn once through a scratch
   * canvas so overlaps never compound under multiply. Returns CAST.puppet's result.
   */
  CAST.drawPuppet = (ctx, name, x, y, scale, opts) => {
    const o = opts || {};
    const r = CAST.puppet(name, ctx, x, y, scale, o);
    if (!r) return null;
    const a = o.alpha == null ? 1 : o.alpha;
    if (a <= 0.004) return r;
    const col = o.color || (o.mode === 'light' ? C.geppaku : AINEZU);
    const pen = o.penumbra || 0;
    const blur = pen > 2.5 && 'filter' in ctx;
    const paint = (c2) => {
      c2.fillStyle = col;
      if (pen > 0 && !blur) {
        c2.save();
        c2.globalAlpha *= 0.3;
        for (const [dx, dy] of [[pen, 0], [-pen, 0], [0, pen], [0, -pen], [pen * 0.5, pen * 0.5], [-pen * 0.5, -pen * 0.5]]) {
          c2.translate(dx, dy);
          c2.fill(r.path, r.rule);
          if (r.sticks) c2.fill(r.sticks);
          c2.translate(-dx, -dy);
        }
        c2.restore();
      }
      c2.fill(r.path, r.rule);
      if (r.sticks) c2.fill(r.sticks);
    };
    ctx.save();
    if (o.mode === 'cut') ctx.globalCompositeOperation = 'destination-out';
    if (pen > 0 || a < 0.995) {
      const Mx = ctx.getTransform();
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      const [bx0, by0, bx1, by1] = r.bbox;
      for (const [gx, gy] of [[bx0, by0], [bx1, by0], [bx0, by1], [bx1, by1]]) {
        const dx = Mx.a * gx + Mx.c * gy + Mx.e, dy = Mx.b * gx + Mx.d * gy + Mx.f;
        x0 = Math.min(x0, dx); x1 = Math.max(x1, dx); y0 = Math.min(y0, dy); y1 = Math.max(y1, dy);
      }
      const padd = pen * 2 + 4;
      x0 = Math.max(0, Math.floor(x0 - padd)); y0 = Math.max(0, Math.floor(y0 - padd));
      x1 = Math.min(ctx.canvas.width, Math.ceil(x1 + padd)); y1 = Math.min(ctx.canvas.height, Math.ceil(y1 + padd));
      if (x1 > x0 && y1 > y0) {
        const sc = getScratch(x1 - x0, y1 - y0);
        const s2 = sc.getContext('2d');
        s2.setTransform(1, 0, 0, 1, 0, 0);
        s2.globalAlpha = 1;
        s2.globalCompositeOperation = 'source-over';
        s2.clearRect(0, 0, x1 - x0, y1 - y0);
        s2.setTransform(Mx.a, Mx.b, Mx.c, Mx.d, Mx.e - x0, Mx.f - y0);
        paint(s2);
        s2.setTransform(1, 0, 0, 1, 0, 0);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha *= a;
        if (blur) ctx.filter = `blur(${(pen * 0.4 * Math.hypot(Mx.a, Mx.b)).toFixed(2)}px)`;
        ctx.drawImage(sc, 0, 0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
      }
    } else paint(ctx);
    ctx.restore();
    return r;
  };
  CAST.AINEZU = AINEZU;

  CAST.palettes = { kaguya: KAGUYA, grandma: GRANDMA, oldSayo: OLD_SAYO, grandmaDrained: GRANDMA_DRAINED, sayo: CHILD_SAYO };
  CAST.samurai = CAST.guard;
  for (const k of Object.keys(REG)) CAST.POSES[k] = REG[k].poses.slice();
  CAST._internal = { sp, crs, taperTo, face, makePen };
})(window.TSUKI = window.TSUKI || {});
