/* ==========================================================================
   util.js — deterministic math toolkit shared by every scene.
   Everything here is pure: same input, same output. Scenes must never use
   Math.random() for anything that is drawn; use U.rng(seed) or U.hash().
   ========================================================================== */
(function (TSUKI) {
  'use strict';

  const U = (TSUKI.U = {});
  U.TAU = Math.PI * 2;

  /* ---------- scalar helpers ---------- */
  U.clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.invLerp = (a, b, x) => (b === a ? 0 : (x - a) / (b - a));
  U.remap = (x, a, b, c, d) => U.lerp(c, d, U.invLerp(a, b, x));
  U.smoothstep = (a, b, x) => {
    const t = U.clamp(U.invLerp(a, b, x));
    return t * t * (3 - 2 * t);
  };
  U.fract = (x) => x - Math.floor(x);
  U.deg = (d) => (d * Math.PI) / 180;

  /** Progress of t through [a,b], clamped to 0..1, optionally eased. */
  U.seg = (t, a, b, ease) => {
    const p = U.clamp(U.invLerp(a, b, t));
    return ease ? ease(p) : p;
  };

  /** Envelope: 0 before a, rises to 1 at b, holds, falls to 0 from c to d. */
  U.env = (t, a, b, c, d, ease = U.ease.inOutSine) => {
    if (t <= a || t >= d) return 0;
    if (t < b) return ease(U.invLerp(a, b, t));
    if (t <= c) return 1;
    return ease(1 - U.invLerp(c, d, t));
  };

  U.ease = {
    linear: (t) => t,
    inSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
    outSine: (t) => Math.sin((t * Math.PI) / 2),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
    outBack: (t) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
  };

  /* ---------- hashing & seeded randomness ---------- */
  /** Integer hash → [0,1). Works for any finite number (floored). */
  U.hash = (n) => {
    let x = Math.floor(n) | 0;
    x = Math.imul(x ^ (x >>> 16), 0x7feb352d);
    x = Math.imul(x ^ (x >>> 15), 0x846ca68b);
    x ^= x >>> 16;
    return (x >>> 0) / 4294967296;
  };
  U.hash2 = (x, y) => U.hash(Math.floor(x) * 374761393 + Math.floor(y) * 668265263);
  U.hash3 = (x, y, z) => U.hash(Math.floor(x) * 374761393 + Math.floor(y) * 668265263 + Math.floor(z) * 2147483647);

  /** mulberry32 seeded PRNG. const r = U.rng(42); r() → [0,1) */
  U.rng = (seed) => {
    let a = (seed * 2654435761) >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    next.range = (lo, hi) => lo + (hi - lo) * next();
    next.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * next());
    next.pick = (arr) => arr[Math.floor(next() * arr.length)];
    next.sign = () => (next() < 0.5 ? -1 : 1);
    return next;
  };

  /* ---------- value noise (smooth, deterministic) ---------- */
  const sm = (t) => t * t * (3 - 2 * t);
  U.noise1 = (x, seed = 0) => {
    const i = Math.floor(x), f = x - i;
    return U.lerp(U.hash(i + seed * 7919), U.hash(i + 1 + seed * 7919), sm(f));
  };
  U.noise2 = (x, y, seed = 0) => {
    const ix = Math.floor(x), iy = Math.floor(y);
    const fx = x - ix, fy = y - iy;
    const s = seed * 1013;
    const a = U.hash2(ix + s, iy), b = U.hash2(ix + 1 + s, iy);
    const c = U.hash2(ix + s, iy + 1), d = U.hash2(ix + 1 + s, iy + 1);
    const ux = sm(fx), uy = sm(fy);
    return U.lerp(U.lerp(a, b, ux), U.lerp(c, d, ux), uy);
  };
  /** Fractal noise in [0,1). */
  U.fbm2 = (x, y, oct = 4, seed = 0) => {
    let v = 0, amp = 0.5, norm = 0;
    for (let o = 0; o < oct; o++) {
      v += amp * U.noise2(x, y, seed + o * 17);
      norm += amp;
      x *= 2.03; y *= 2.03; amp *= 0.5;
    }
    return v / norm;
  };
  /** Signed smooth wobble in [-1,1] — handy for sway: U.wobble(t*0.7, seed). */
  U.wobble = (x, seed = 0) => U.noise1(x, seed) * 2 - 1;

  /* ---------- colour ---------- */
  const hexCache = new Map();
  U.hexToRgb = (hex) => {
    let c = hexCache.get(hex);
    if (c) return c;
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
    const n = parseInt(h, 16);
    c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    hexCache.set(hex, c);
    return c;
  };
  U.rgbToHex = (r, g, b) =>
    '#' + [r, g, b].map((v) => Math.round(U.clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  /** '#rrggbb' + alpha → 'rgba(...)' */
  U.rgba = (hex, a = 1) => {
    const [r, g, b] = U.hexToRgb(hex);
    return `rgba(${r},${g},${b},${a})`;
  };
  /** Mix two hex colours, t in 0..1 → hex. */
  U.mix = (h1, h2, t) => {
    const a = U.hexToRgb(h1), b = U.hexToRgb(h2);
    return U.rgbToHex(U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t), U.lerp(a[2], b[2], t));
  };
  /** Multiply-darken a hex colour by k (0..1 darker, >1 lighter). */
  U.shade = (hex, k) => {
    const [r, g, b] = U.hexToRgb(hex);
    return U.rgbToHex(r * k, g * k, b * k);
  };

  /* ---------- geometry ---------- */
  U.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  /** Point on quadratic bezier. */
  U.qbez = (p0, p1, p2, t) => {
    const u = 1 - t;
    return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
  };
  /** Point on cubic bezier. */
  U.cbez = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
  };
})(window.TSUKI = window.TSUKI || {});
