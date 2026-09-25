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
  const SEAL = { x: 1300, y: 820, size: 90 };

  /* ------------------------------------------------------------------ */
  /* the seal 忘れじ — 白文: the characters are cut out of the 朱 to the   */
  /* paper (like the moon, they are absence). Carved as vector strokes so */
  /* the stamp never depends on a font; built once.                      */
  /* ------------------------------------------------------------------ */
  // strokes in a 100-unit square: right column 忘, left column れ over じ
  const GLYPHS = [
    // 忘 — 亡
    { w: 6.6, pts: [[71.5, 8.5], [72.5, 17.5]] },
    { w: 6.4, pts: [[54.5, 21.5], [90, 20.5]] },
    { w: 6.4, pts: [[60.5, 26], [60.5, 43], [90, 43]] },
    // 忘 — 心
    { w: 6.2, pts: [[54.5, 64], [57.5, 76]] },
    { w: 6.6, pts: [[65, 55], [65, 84.5], [68, 88], [89.5, 88], [89.5, 79]] },
    { w: 6.0, pts: [[73.5, 52], [76.5, 63]] },
    { w: 6.0, pts: [[83, 53], [86.5, 65]] },
    // れ
    { w: 6.2, pts: [[18, 8.5], [17.2, 30], [18, 49]] },
    { w: 6.0, pts: [[8.5, 23], [27, 20.5], [17.8, 35], [26, 26], [33.5, 23.5], [37.5, 30], [37.5, 43], [40.5, 47.5], [47.5, 44]] },
    // じ
    { w: 6.4, pts: [[17.5, 54.5], [17.5, 79], [20.5, 87], [29, 90], [37, 87], [44, 79]] },
    { w: 5.2, pts: [[33.5, 55], [35.5, 63.5]] },
    { w: 5.2, pts: [[41, 53], [43, 61.5]] },
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
    const { x, y, size } = SEAL;
    const cx = x + size / 2, cy = y + size / 2;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.rotate(-0.012);                       // stamped by hand, never quite square
    ctx.drawImage(spr, -size / 2, -size / 2, size, size);
    ctx.restore();
    // the press leaves a faint bruise in the paper around the stamp
    if (p >= 1) {
      ctx.save();
      ctx.strokeStyle = U.rgba(C.sumi, 0.05);
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 1.5, y - 1.5, size + 3, size + 3);
      ctx.restore();
    }
  }

  /* ------------------------------------------------------------------ */
  /* the karazuri moon and the 見当 notch: relief in the bare paper       */
  /* ------------------------------------------------------------------ */
  function drawKarazuri(ctx, T, k) {
    if (k <= 0.001) return;
    const { x, y, r } = KARA;
    const L = -3 * Math.PI / 4;                // raking light from the upper left
    ctx.save();
    ctx.globalAlpha = k;
    // 3% sheen of the raised disc
    const sh = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    sh.addColorStop(0, U.rgba(C.gofun, 0.07));
    sh.addColorStop(0.7, U.rgba(C.gofun, 0.03));
    sh.addColorStop(1, U.rgba(C.gofun, 0.015));
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    // the rabbit's carbon: the one thing given to the moon, kept (α 0.10)
    TSUKI.MOON.maria(ctx, x, y, r, 0.1);
    // soft cast shade just outside the lower-right rim
    const cs = ctx.createConicGradient(L, x, y);
    cs.addColorStop(0, U.rgba(C.sumi, 0));
    cs.addColorStop(0.3, U.rgba(C.sumi, 0));
    cs.addColorStop(0.5, U.rgba(C.sumi, 0.07));
    cs.addColorStop(0.7, U.rgba(C.sumi, 0));
    cs.addColorStop(1, U.rgba(C.sumi, 0));
    ctx.strokeStyle = cs;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x + 1, y + 1, r + 3, 0, TAU);
    ctx.stroke();
    // the rim: 胡粉 highlight on the upper-left slope, 墨 shadow on the lower-right
    const hi = ctx.createConicGradient(L, x, y);
    hi.addColorStop(0, U.rgba(C.gofun, 0.55));
    hi.addColorStop(0.18, U.rgba(C.gofun, 0.34));
    hi.addColorStop(0.3, U.rgba(C.gofun, 0));
    hi.addColorStop(0.7, U.rgba(C.gofun, 0));
    hi.addColorStop(0.82, U.rgba(C.gofun, 0.34));
    hi.addColorStop(1, U.rgba(C.gofun, 0.55));
    ctx.strokeStyle = hi;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(x - 0.6, y - 0.6, r - 1.1, 0, TAU);
    ctx.stroke();
    const lo = ctx.createConicGradient(L, x, y);
    lo.addColorStop(0, U.rgba(C.sumi, 0));
    lo.addColorStop(0.24, U.rgba(C.sumi, 0));
    lo.addColorStop(0.38, U.rgba(C.sumi, 0.14));
    lo.addColorStop(0.5, U.rgba(C.sumi, 0.22));
    lo.addColorStop(0.62, U.rgba(C.sumi, 0.14));
    lo.addColorStop(0.76, U.rgba(C.sumi, 0));
    lo.addColorStop(1, U.rgba(C.sumi, 0));
    ctx.strokeStyle = lo;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(x + 0.6, y + 0.6, r + 0.4, 0, TAU);
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
      // ask the browser for the glyphs the canvas will need at the end
      try {
        if (document.fonts && document.fonts.load) document.fonts.load('22px "Shippori Mincho B1"', COLOPHON + SEAL_TEXT).catch(() => {});
      } catch (e) { /* offline or no FontFaceSet */ }
    },

    draw(ctx, t, S) {
      const T = S.seg.start + t;
      const E = TSUKI.SHOTS.E;
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
