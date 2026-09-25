/* ==========================================================================
   01-jo-surizome.js — 序　摺り初め (0–14): the print is pulled.
   Blank washi with its deckle and the 見当; the baren spirals the key block
   out of the thatched house (PRINT's keyReveal, 2–6); the colour blocks land
   one by one (6.0 … 10.2) — everywhere except one dry half-disc behind the
   susuki, which glows 山吹: the moon before the world. The title's 短冊 and
   the 色紙 「十五夜摺」 with the 縁 seal print in with the warm block (6.6).
   13.0: the first gust — the print breathes. The last frame is Shot A 初摺,
   fully printed; 一 begins on the identical frame.

   Exposes TSUKI.SHOTS.A.titlePanels(ctx, T, alpha) — the painted 短冊 / 色紙 /
   縁 seal, printed with P2 (一 keeps drawing it until 16.0).
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const U = TSUKI.U, B = TSUKI.B, C = TSUKI.C;
  const PRINT = TSUKI.PRINT;
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const A = (TSUKI.SHOTS = TSUKI.SHOTS || {}).A = TSUKI.SHOTS.A || {};

  /* ------------------------------------------------------------------ */
  /* the title panels: 短冊 (x 1680–1790, y 60–470), 色紙 (x 1560–1660,  */
  /* y 60–160) with 十五夜摺, and the 縁 seal (朱文) at the tanzaku's foot  */
  /* ------------------------------------------------------------------ */
  const PANEL = { x0: 1540, y0: 40, x1: 1810, y1: 490 };
  const SEAL_TEXT = '縁';
  const SHIKISHI_TEXT = ['十五', '夜摺'];     // right column, left column
  let panelCv = null, panelK = 0, panelFontsOk = false;

  function fontsReady() {
    try { return document.fonts && document.fonts.check('32px "Yuji Syuku"', '十五夜摺'); } catch (e) { return true; }
  }

  function paintPanels(c) {
    const r = U.rng(1414);
    // 短冊: 生成 ground, a 1.5 px 紅 border, faint 山吹 砂子
    const tz = { x: 1680, y: 60, w: 110, h: 410 };
    c.fillStyle = C.kinari;
    c.fillRect(tz.x, tz.y, tz.w, tz.h);
    // the faintest 打曇 of age at head and foot (paper, not ink)
    let g = c.createLinearGradient(0, tz.y, 0, tz.y + tz.h);
    g.addColorStop(0, U.rgba(C.torinoko, 0.55));
    g.addColorStop(0.1, U.rgba(C.torinoko, 0));
    g.addColorStop(0.9, U.rgba(C.torinoko, 0));
    g.addColorStop(1, U.rgba(C.torinoko, 0.5));
    c.fillStyle = g;
    c.fillRect(tz.x, tz.y, tz.w, tz.h);
    const sunago = (x, y, w, h, n, a) => {
      for (let i = 0; i < n; i++) {
        const px = x + r() * w, py = y + Math.pow(r(), 1.6) * h, s = U.lerp(0.5, 1.7, r());
        c.fillStyle = U.rgba(C.yamabuki, U.lerp(0.25, a, r()));
        c.beginPath();
        c.arc(px, py, s, 0, TAU);
        c.fill();
      }
    };
    sunago(tz.x + 4, tz.y + 4, tz.w - 8, 90, 70, 0.6);
    c.save();
    c.translate(0, tz.y * 2 + tz.h);
    c.scale(1, -1);
    sunago(tz.x + 4, tz.y + 4, tz.w - 8, 70, 45, 0.5);
    c.restore();
    c.strokeStyle = C.beni;
    c.lineWidth = 1.5;
    c.strokeRect(tz.x + 3.5, tz.y + 3.5, tz.w - 7, tz.h - 7);
    c.strokeStyle = U.rgba(C.sumi, 0.25);
    c.lineWidth = 0.8;
    c.strokeRect(tz.x + 0.4, tz.y + 0.4, tz.w - 0.8, tz.h - 0.8);
    // 縁 — 朱文: 朱 characters on the paper ground, with a 2 px inset 朱 outline
    const sx = 1721, sy = 434, ss = 28;
    c.strokeStyle = C.shu;
    c.lineWidth = 2;
    c.strokeRect(sx + 1, sy + 1, ss - 2, ss - 2);
    c.fillStyle = C.shu;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `${ss * 0.76}px "Yuji Syuku", "Shippori Mincho B1", serif`;
    c.fillText(SEAL_TEXT, sx + ss / 2, sy + ss / 2 + 1);
    // 色紙 with 十五夜摺 as a 2 × 2 block, centred (1610,110)
    const sk = { x: 1560, y: 60, w: 100, h: 100 };
    c.fillStyle = C.kinari;
    c.fillRect(sk.x, sk.y, sk.w, sk.h);
    g = c.createRadialGradient(sk.x + 50, sk.y + 50, 20, sk.x + 50, sk.y + 50, 74);
    g.addColorStop(0, U.rgba(C.torinoko, 0));
    g.addColorStop(1, U.rgba(C.torinoko, 0.45));
    c.fillStyle = g;
    c.fillRect(sk.x, sk.y, sk.w, sk.h);
    sunago(sk.x + 3, sk.y + 3, sk.w - 6, 26, 26, 0.5);
    c.strokeStyle = U.rgba(C.kin, 0.85);
    c.lineWidth = 1.2;
    c.strokeRect(sk.x + 2.6, sk.y + 2.6, sk.w - 5.2, sk.h - 5.2);
    c.strokeStyle = U.rgba(C.sumi, 0.25);
    c.lineWidth = 0.8;
    c.strokeRect(sk.x + 0.4, sk.y + 0.4, sk.w - 0.8, sk.h - 0.8);
    c.fillStyle = C.sumi;
    c.font = '32px "Yuji Syuku", "Shippori Mincho B1", serif';
    const cols = [1610 + 19, 1610 - 19];
    SHIKISHI_TEXT.forEach((col, i) => {
      [...col].forEach((ch, j) => c.fillText(ch, cols[i], 110 - 18 + j * 37));
    });
  }

  function panels(k) {
    const ok = fontsReady();
    if (panelCv && panelK === k && (panelFontsOk || !ok)) return panelCv;
    const w = PANEL.x1 - PANEL.x0, h = PANEL.y1 - PANEL.y0;
    panelCv = B.canvas(w * k, h * k);
    const c = panelCv.getContext('2d');
    c.setTransform(k, 0, 0, k, -PANEL.x0 * k, -PANEL.y0 * k);
    paintPanels(c);
    panelK = k;
    panelFontsOk = ok;
    return panelCv;
  }

  /** The painted title panels, printed with the warm block (P2). */
  A.titlePanels = (ctx, T, alpha = 1) => {
    if (alpha <= 0.002) return;
    const k = Math.max(1, Math.min(2, (ctx.getTransform().a || 1) * 1.0));
    const cv = panels(k);
    PRINT.with(ctx, 'P2', T, (c) => {
      c.globalAlpha *= alpha;
      c.drawImage(cv, PANEL.x0, PANEL.y0, PANEL.x1 - PANEL.x0, PANEL.y1 - PANEL.y0);
    });
  };

  /* ------------------------------------------------------------------ */
  /* the sheet: deckle (耳) and the 鉤見当                                */
  /* ------------------------------------------------------------------ */
  let deckle = null;
  function deckleSprite(k) {
    if (deckle && deckle.k === k) return deckle.cv;
    const cv = B.canvas(W * k, H * k);
    const c = cv.getContext('2d');
    c.setTransform(k, 0, 0, k, 0, 0);
    const r = U.rng(4040);
    // the soft, torn-by-water edge of the sheet (耳), ≈40 px in from the frame
    const edge = [];
    const M = 40;
    const rag = (u, sd) => (U.noise1(u * 0.045, sd) - 0.5) * 10 + (U.noise1(u * 0.4, sd + 9) - 0.5) * 3.2;
    for (let x = M; x < W - M; x += 4) edge.push([x, M + rag(x, 3)]);
    for (let y = M; y < H - M; y += 4) edge.push([W - M + rag(y, 5), y]);
    for (let x = W - M; x > M; x -= 4) edge.push([x, H - M + rag(x, 7)]);
    for (let y = H - M; y > M; y -= 4) edge.push([M + rag(y, 11), y]);
    const sheet = new Path2D();
    sheet.moveTo(edge[0][0], edge[0][1]);
    for (const p of edge) sheet.lineTo(p[0], p[1]);
    sheet.closePath();
    // the board beyond the sheet
    const out = new Path2D();
    out.rect(-10, -10, W + 20, H + 20);
    out.addPath(sheet);
    c.fillStyle = U.mix(C.nezumi, C.odo, 0.35);
    c.fill(out, 'evenodd');
    // the board's grain
    c.save();
    c.clip(out, 'evenodd');
    for (let i = 0; i < 90; i++) {
      const y = r() * H;
      c.strokeStyle = U.rgba(C.sumi, U.lerp(0.03, 0.1, r()));
      c.lineWidth = U.lerp(0.6, 2, r());
      c.beginPath();
      c.moveTo(0, y);
      for (let x = 0; x <= W; x += 40) c.lineTo(x, y + Math.sin(x * 0.004 + i) * 3);
      c.stroke();
    }
    c.restore();
    // the deckle itself: thin translucent paper with fibres feathering outward
    c.save();
    c.strokeStyle = U.rgba(C.gofun, 0.35);
    c.lineWidth = 2;
    c.stroke(sheet);
    for (let i = 0; i < edge.length; i += 1) {
      if (r() > 0.55) continue;
      const [x, y] = edge[i];
      const nx = x < M + 20 ? -1 : x > W - M - 20 ? 1 : 0, ny = y < M + 20 ? -1 : y > H - M - 20 ? 1 : 0;
      if (nx && ny) continue;
      const L = U.lerp(1.5, 6, r());
      c.strokeStyle = U.rgba(C.kinari, U.lerp(0.3, 0.75, r()));
      c.lineWidth = U.lerp(0.4, 1, r());
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + nx * L + (r() - 0.5) * 3, y + ny * L + (r() - 0.5) * 3);
      c.stroke();
    }
    c.restore();
    // a faint shadow of the sheet on the board
    c.save();
    c.clip(out, 'evenodd');
    c.strokeStyle = U.rgba(C.sumi, 0.18);
    c.lineWidth = 6;
    c.translate(2, 3);
    c.stroke(sheet);
    c.restore();
    deckle = { cv, k };
    return cv;
  }

  function kento(ctx, T, a) {
    if (a <= 0.002) return;
    const x = 1840, y = 1040, L = 46;
    // raking light across the notch at 0.8 s: 0.2 → 0.6 → 0.35 over 1.2 s
    const hi = T < 0.8 ? 0.2 : T < 1.4 ? U.lerp(0.2, 0.6, U.ease.inOutSine(U.seg(T, 0.8, 1.4))) : T < 2.0 ? U.lerp(0.6, 0.35, U.ease.inOutSine(U.seg(T, 1.4, 2.0))) : 0.35;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.lineCap = 'square';
    ctx.lineWidth = 1;
    ctx.strokeStyle = U.rgba(C.gofun, Math.min(1, hi * 1.4));
    ctx.beginPath();
    ctx.moveTo(x - L - 1, y - 1); ctx.lineTo(x - 1, y - 1); ctx.lineTo(x - 1, y - L - 1);
    ctx.stroke();
    ctx.strokeStyle = U.rgba(C.sumi, 0.12 + hi * 0.06);
    ctx.beginPath();
    ctx.moveTo(x - L + 1, y + 1); ctx.lineTo(x + 1, y + 1); ctx.lineTo(x + 1, y - L + 1);
    ctx.stroke();
    ctx.restore();
  }

  TSUKI.scene('jo-surizome', {
    draw(ctx, t, S) {
      const T = S.seg.start + t;
      // the moon before the moon: a faint 山吹 warmth as the spiral passes (from 2 s),
      // the dry disc when the colour arrives (6 → 9.6)
      const warm = T < 2 ? 0 : T < 6 ? 0.3 * U.seg(T, 2, 3.4, U.ease.inOutSine) : U.lerp(0.3, 1, U.seg(T, 6, 9.6, U.ease.inOutSine));
      A.drawGarden(ctx, T, {
        still: T < 13,             // near susuki, 萩, sōzu from the carved block until the first gust
        figures: false,
        moonAlpha: warm,
        glow: warm,
      });
      A.titlePanels(ctx, T, 1);
      // the sheet's deckle and the 見当 (visible to 6 s, gone into the frame by 9 s)
      const da = 1 - U.seg(T, 6, 9, U.ease.inOutSine);
      if (da > 0.002) {
        const k = S.k || 1;
        ctx.save();
        ctx.globalAlpha *= da;
        ctx.drawImage(deckleSprite(Math.min(1.5, Math.max(0.5, k))), 0, 0, W, H);
        ctx.restore();
        kento(ctx, T, da);
      }
    },
  });
})(window.TSUKI = window.TSUKI || {});
