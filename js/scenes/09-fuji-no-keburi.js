/* ==========================================================================
   09-fuji-no-keburi.js — 結　不尽の煙 (T 206–236).
   Shot E at dawn (後摺 + a fresh 東雲 block): the moon comes down to Fuji's
   summit at a steady (5,16) px/s; at 214.0 the undying smoke — the burned
   elixir and, burned with it, the emperor's poem — touches her rim, the only
   contact between earth and moon in the film; pearl Fuji; the fox turns its
   head; 小夜's long shadow reaches toward the mountain. From 222 the print
   unprints itself in fugitive-pigment order (TSUKI.PRINT), down to clean
   washi: the 見当 notch, a karazuri moon carrying only the rabbit's carbon,
   小夜's last haiku (DOM), the 朱 seal 忘れじ and a tiny colophon.
   The film ends on paper, not black.
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const { U, C } = TSUKI;
  const TAU = Math.PI * 2;

  /* canvas words of the last paper (tools/fonts.js scans this file for glyphs) */
  const SEAL_TEXT = '忘れじ';
  const COLOPHON = '原典　竹取物語・今昔物語集';

  /* the last paper (screenplay: segments[結].layers['the last paper']) */
  const KARA = { x: 960, y: 360, r: 150 };
  const NOTCH = { x: 1840, y: 1040, arm: 46 };
  const SEAL = { cx: 1300, cy: 820, size: 90 };       // centre, like the karazuri circle

  /* ------------------------------------------------------------------ */
  /* the seal 忘れじ — 白文: the characters are cut out of the 朱 to the   */
  /* paper (like the moon, they are absence). Carved as vector strokes so */
  /* the stamp never depends on a font; built once.                      */
  /* ------------------------------------------------------------------ */
  // strokes in a 100-unit square: right column 忘, left column れ over じ
  const GLYPHS = [
    // 忘 — 亡
    { w: 6.6, pts: [[72.5, 7.5], [73.2, 16.5]] },
    { w: 6.4, pts: [[54, 21], [91, 20.2]] },
    { w: 6.4, pts: [[61, 26], [61, 43.5], [91, 43.5]] },
    // 忘 — 心
    { w: 6.2, pts: [[54, 62], [57, 74]] },
    { w: 6.6, pts: [[66.5, 53.5], [66.5, 83.5], [69.5, 88.5], [90.5, 88.5], [90.5, 78.5]] },
    { w: 6.0, pts: [[75, 51], [78, 62]] },
    { w: 6.0, pts: [[84.5, 52], [88, 63.5]] },
    // れ — the stem; then one stroke: across, back down to the stem, the hump, the flick
    { w: 5.6, pts: [[12, 7.5], [11.5, 29], [12.3, 50.5]] },
    { w: 5.0, pts: [[4, 20], [20.5, 16.5], [13, 38.5], [17.5, 33.5], [22, 29], [27.5, 25], [33, 23], [38.5, 24.5], [41, 30], [41.5, 38], [41.5, 44], [43.5, 48.5], [48, 48.8]] },
    // じ
    { w: 6.2, pts: [[15.5, 56], [15.5, 78.5], [18.5, 87], [26.5, 90.5], [35, 88], [42.5, 80]] },
    { w: 5.0, pts: [[31, 56], [33, 64]] },
    { w: 5.0, pts: [[39, 54], [41, 62]] },
  ];

  let sealSprite = null;
  function buildSeal() {
    const N = 256, sc = N / 100;
    const cv = TSUKI.B.canvas(N, N);
    const c = cv.getContext('2d');
    c.scale(sc, sc);
    const r = U.rng(1230);
    // the stone's face: a square whose edge has been chipped by age
    c.beginPath();
    const edge = [];
    const side = (x0, y0, x1, y1, n) => {
      for (let i = 0; i < n; i++) {
        const s = i / n;
        const j = (r() - 0.5) * 1.3 + (r() < 0.08 ? -1.6 * r() : 0);
        const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
        edge.push([U.lerp(x0, x1, s) - (dy / L) * j, U.lerp(y0, y1, s) + (dx / L) * j]);
      }
    };
    side(2.2, 2.6, 97.6, 2.0, 26);
    side(97.6, 2.0, 98.0, 97.4, 26);
    side(98.0, 97.4, 2.4, 97.8, 26);
    side(2.4, 97.8, 2.2, 2.6, 26);
    c.moveTo(edge[0][0], edge[0][1]);
    for (const p of edge) c.lineTo(p[0], p[1]);
    c.closePath();
    c.fillStyle = C.shu;
    c.fill();
    // 印泥: the paste lies a little unevenly — denser and deeper in places
    c.save();
    c.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 70; i++) {
      const x = r() * 100, y = r() * 100, rr = U.lerp(4, 16, r());
      const g = c.createRadialGradient(x, y, 0, x, y, rr);
      const deep = r() < 0.55;
      const col = deep ? U.mix(C.shu, C.akane, 0.55) : U.mix(C.shu, C.yamabuki, 0.25);
      const a = U.lerp(0.06, 0.2, r());
      g.addColorStop(0, U.rgba(col, a));
      g.addColorStop(1, U.rgba(col, 0));
      c.fillStyle = g;
      c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    c.restore();
    // cut the characters out to the paper (carved: a little irregular)
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = '#000';
    for (const g of GLYPHS) {
      c.lineWidth = g.w;
      c.beginPath();
      g.pts.forEach((p, i) => {
        const jx = (U.hash(i * 13 + g.pts.length * 7 + p[0] * 3) - 0.5) * 0.5;
        const jy = (U.hash(i * 17 + p[1] * 5) - 0.5) * 0.5;
        if (i === 0) c.moveTo(p[0] + jx, p[1] + jy); else c.lineTo(p[0] + jx, p[1] + jy);
      });
      c.stroke();
    }
    // a pressed stamp never inks perfectly: small voids, more toward the rim
    for (let i = 0; i < 260; i++) {
      const x = r() * 100, y = r() * 100;
      const dEdge = Math.min(x, y, 100 - x, 100 - y);
      if (r() > 0.25 + 0.75 * Math.exp(-dEdge / 7)) continue;
      c.globalAlpha = U.lerp(0.35, 1, r());
      const s = U.lerp(0.3, 1.3, r());
      c.beginPath();
      c.ellipse(x, y, s, s * U.lerp(0.5, 1, r()), r() * Math.PI, 0, TAU);
      c.fill();
    }
    // two faint hairline cracks in the stone, as old seals have
    c.globalAlpha = 0.9;
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(2, 61); c.lineTo(6, 60.2); c.lineTo(9, 61.4);
    c.moveTo(98, 30); c.lineTo(94.5, 31.2);
    c.stroke();
    c.restore();
    sealSprite = cv;
    return cv;
  }

  function drawSeal(ctx, T) {
    const t0 = 230.0;
    if (T < t0) return;
    const p = U.clamp((T - t0) / 0.12);
    const a = 0.92 * U.ease.outCubic(p);
    const s = U.lerp(1.06, 1.0, U.ease.outCubic(p));
    const spr = sealSprite || buildSeal();
    const { cx, cy, size } = SEAL;
    ctx.save();
    ctx.imageSmoothingQuality = 'high';       // a small, heavily reduced sprite: resample well
    ctx.globalAlpha = a;
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.rotate(-0.012);                       // stamped by hand, never quite square
    ctx.drawImage(spr, -size / 2, -size / 2, size, size);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* the karazuri moon and the 見当 notch: relief in the bare paper       */
  /* ------------------------------------------------------------------ */
  /**
   * The rabbit's carbon, as ink that soaked into the fibres sixty years ago:
   * the maria shape (TSUKI.MOON.maria), softened and uneven, built once.
   */
  let carbon = null;
  function buildCarbon() {
    const { r } = KARA;
    const q = 1.5, pad = 12, S = Math.ceil((r * 2 + pad * 2) * q);
    const shape = TSUKI.B.canvas(S, S);
    const c = shape.getContext('2d');
    c.scale(q, q);
    TSUKI.MOON.maria(c, r + pad, r + pad, r, 1, '#000000');
    // soften the cut edge: carbon bleeds a hair into the paper
    const soft = TSUKI.B.canvas(S, S);
    const s2 = soft.getContext('2d');
    s2.filter = 'blur(2.2px)';
    s2.drawImage(shape, 0, 0);
    s2.filter = 'none';
    s2.globalAlpha = 0.55;
    s2.drawImage(shape, 0, 0);
    // uneven density: the ink lies heavier in some fibres than others
    const img = TSUKI.B.canvas(S, S);
    const ic = img.getContext('2d');
    const d = ic.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const v = 0.55 * U.fbm2(x / 38, y / 38, 4, 91) + 0.3 * U.fbm2(x / 7, y / 11, 2, 92) + 0.15 * U.hash2(x, y);
      d.data[(y * S + x) * 4 + 3] = U.clamp(0.35 + v * 0.95) * 255;
    }
    ic.putImageData(d, 0, 0);
    s2.globalAlpha = 1;
    s2.globalCompositeOperation = 'destination-in';
    s2.drawImage(img, 0, 0);
    // tint it 墨
    s2.globalCompositeOperation = 'source-in';
    s2.fillStyle = C.sumi;
    s2.fillRect(0, 0, S, S);
    carbon = { cv: soft, pad, q, S };
    return carbon;
  }

  function drawKarazuri(ctx, T, k) {
    if (k <= 0.001) return;
    const { x, y, r } = KARA;
    const L = -3 * Math.PI / 4;                // raking light from the upper left
    ctx.save();
    ctx.globalAlpha = k;
    // the raised disc's paper sheen (≈3%)
    const sh = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    sh.addColorStop(0, U.rgba(C.gofun, 0.09));
    sh.addColorStop(0.7, U.rgba(C.gofun, 0.035));
    sh.addColorStop(1, U.rgba(C.gofun, 0.02));
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    // the rabbit's carbon: the one thing given to the moon, and kept (墨 α 0.10)
    const cb = carbon || buildCarbon();
    ctx.save();
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = k * 0.1 / 0.82;          // the sprite's mean density ≈ 0.82
    ctx.drawImage(cb.cv, x - r - cb.pad, y - r - cb.pad, cb.S / cb.q, cb.S / cb.q);
    ctx.restore();
    // soft cast shade just outside the lower-right rim
    const cs = ctx.createConicGradient(L, x, y);
    cs.addColorStop(0, U.rgba(C.sumi, 0));
    cs.addColorStop(0.3, U.rgba(C.sumi, 0));
    cs.addColorStop(0.5, U.rgba(C.sumi, 0.08));
    cs.addColorStop(0.7, U.rgba(C.sumi, 0));
    cs.addColorStop(1, U.rgba(C.sumi, 0));
    ctx.strokeStyle = cs;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x + 1.2, y + 1.2, r + 3.5, 0, TAU);
    ctx.stroke();
    // the fold of the emboss: a hairline that keeps the circle whole at the sides
    ctx.strokeStyle = U.rgba(C.sumi, 0.07);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(x, y, r + 0.3, 0, TAU);
    ctx.stroke();
    // the rim: 胡粉 highlight on the upper-left slope, 墨 shadow on the lower-right (±2 px)
    const hi = ctx.createConicGradient(L, x, y);
    hi.addColorStop(0, U.rgba(C.gofun, 0.9));
    hi.addColorStop(0.12, U.rgba(C.gofun, 0.62));
    hi.addColorStop(0.26, U.rgba(C.gofun, 0));
    hi.addColorStop(0.74, U.rgba(C.gofun, 0));
    hi.addColorStop(0.88, U.rgba(C.gofun, 0.62));
    hi.addColorStop(1, U.rgba(C.gofun, 0.9));
    ctx.strokeStyle = hi;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(x - 0.7, y - 0.7, r - 1.2, 0, TAU);
    ctx.stroke();
    const lo = ctx.createConicGradient(L, x, y);
    lo.addColorStop(0, U.rgba(C.sumi, 0));
    lo.addColorStop(0.22, U.rgba(C.sumi, 0));
    lo.addColorStop(0.36, U.rgba(C.sumi, 0.16));
    lo.addColorStop(0.5, U.rgba(C.sumi, 0.26));
    lo.addColorStop(0.64, U.rgba(C.sumi, 0.16));
    lo.addColorStop(0.78, U.rgba(C.sumi, 0));
    lo.addColorStop(1, U.rgba(C.sumi, 0));
    ctx.strokeStyle = lo;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(x + 0.7, y + 0.7, r + 0.2, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawNotch(ctx, k) {
    if (k <= 0.001) return;
    const { x, y, arm } = NOTCH;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.lineCap = 'square';
    ctx.lineWidth = 1;
    // 鉤見当: an L pressed by the kentō ledge — lit edge above-left, shade below-right
    ctx.strokeStyle = U.rgba(C.gofun, 0.6);
    ctx.beginPath();
    ctx.moveTo(x - arm, y - 1); ctx.lineTo(x - 1, y - 1); ctx.lineTo(x - 1, y - arm);
    ctx.stroke();
    ctx.strokeStyle = U.rgba(C.sumi, 0.13);
    ctx.beginPath();
    ctx.moveTo(x - arm, y + 1); ctx.lineTo(x + 1, y + 1); ctx.lineTo(x + 1, y - arm);
    ctx.stroke();
    ctx.restore();
  }

  function drawColophon(ctx, T) {
    const a = U.seg(T, 233, 234, U.ease.inOutSine);
    if (a <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = U.rgba(C.sumi, 0.55);
    ctx.font = '22px "Shippori Mincho B1", "Yu Mincho", "Hiragino Mincho ProN", serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
    ctx.fillText(COLOPHON, 1760, 1012);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  TSUKI.scene('fuji-no-keburi', {
    init() {
      buildSeal();
      buildCarbon();
      // ask the browser for the glyphs the canvas will need at the end
      try {
        if (document.fonts && document.fonts.load) document.fonts.load('22px "Shippori Mincho B1"', COLOPHON + SEAL_TEXT).catch(() => {});
      } catch (e) { /* offline or no FontFaceSet */ }
    },

    draw(ctx, t, S) {
      const T = S.seg.start + t;
      const E = TSUKI.SHOTS.E;
      // every sprite and plate here is carved at (or near) the stage resolution:
      // bilinear is indistinguishable, and avoids the slow high-quality resampler
      ctx.imageSmoothingQuality = 'low';
      // the paper remembers what was pressed into it: relief under the ink
      drawKarazuri(ctx, T, U.seg(T, 226, 228, U.ease.inOutSine));
      drawNotch(ctx, U.seg(T, 225.4, 227.4, U.ease.inOutSine));
      // the print (後摺 + 東雲), lifting away 222–228 in fugitive-pigment order
      if (T < 228.05) E.draw(ctx, T);
      // the last paper
      drawSeal(ctx, T);
      drawColophon(ctx, T);
    },
  });
})(window.TSUKI);
