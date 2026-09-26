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
  const PANEL = { x0: 1540, y0: 40, x1: 1810, y1: 496 };
  const SEAL_TEXT = '縁';
  const SHIKISHI_TEXT = ['十五', '夜摺'];     // right column, left column
  let panelCv = null, panelK = 0, panelFontsOk = false;

  function fontsReady() {
    try { return document.fonts && document.fonts.check('32px "Yuji Syuku"', '十五夜摺'); } catch (e) { return true; }
  }

  function paintPanels(c) {
    const r = U.rng(1414);
    // 短冊: 生成 ground, a 1.5 px 紅 border, faint 山吹 砂子
    const tz = { x: 1680, y: 60, w: 110, h: 422 };
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
    // 縁 — 朱文: 朱 characters on the paper ground, with a 2 px inset 朱 outline;
    // 24 px, clear of the title column's last glyph (which ends ≈ y 443)
    const sx = 1723, sy = 448, ss = 24;
    c.strokeStyle = C.shu;
    c.lineWidth = 1.8;
    c.strokeRect(sx + 1, sy + 1, ss - 2, ss - 2);
    c.fillStyle = C.shu;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `${ss * 0.74}px "Yuji Syuku", "Shippori Mincho B1", serif`;
    c.fillText(SEAL_TEXT, sx + ss / 2, sy + ss / 2 + 1);
    // the seal's ink sits unevenly: a few pores where the paste did not take
    for (let i = 0; i < 26; i++) { c.fillStyle = U.rgba(C.kinari, U.lerp(0.3, 0.8, r())); c.fillRect(sx + 1 + r() * (ss - 2), sy + 1 + r() * (ss - 2), U.lerp(0.5, 1.2, r()), U.lerp(0.5, 1.2, r())); }
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
    // the bottom-right corner is trimmed square: the sheet is laid into the 鉤見当 there
    const cut = (d) => 1 - U.smoothstep(96, 150, d);
    for (let x = M; x < W - M; x += 4) edge.push([x, M + rag(x, 3)]);
    for (let y = M; y < H - M; y += 4) edge.push([W - M + rag(y, 5) * (1 - cut(H - M - y)), y]);
    for (let x = W - M; x > M; x -= 4) edge.push([x, H - M + rag(x, 7) * (1 - cut(W - M - x))]);
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

  /**
   * Let 序's full-frame caches go (the deckle, the two key sheets, the ichimonji
   * scratch) once 序 has been played through — not before it has been drawn at
   * all (the poster frame is 一's). They are rebuilt on demand after a seek back.
   */
  let joDrawn = false;
  A.releaseJo = () => {
    if (!joDrawn) return;
    joDrawn = false;
    releaseKeys();
    if (deckle) { deckle.cv.width = 0; deckle.cv.height = 0; deckle = null; }
    if (A.releaseWipe) A.releaseWipe();
  };

  /** the 鉤見当: a karazuri L embossed 3 px inside the sheet's trimmed corner; a raking light runs along it 0.8–2.0 */
  const KENTO = { x: 1877, y: 1037, L: 46 };
  function kento(ctx, T, a) {
    if (a <= 0.002) return;
    const { x, y, L } = KENTO;
    // the notch catches the light: 0.2 → 0.6 → 0.35 over 1.2 s
    const hi = T < 0.8 ? 0.2 : T < 1.4 ? U.lerp(0.2, 0.6, U.ease.inOutSine(U.seg(T, 0.8, 1.4))) : T < 2.0 ? U.lerp(0.6, 0.35, U.ease.inOutSine(U.seg(T, 1.4, 2.0))) : 0.35;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    // the embossed ridge: 墨 shadow below-right, 胡粉 highlight above-left
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = U.rgba(C.sumi, 0.15);
    ctx.beginPath();
    ctx.moveTo(x - L + 1.2, y + 1.2); ctx.lineTo(x + 1.2, y + 1.2); ctx.lineTo(x + 1.2, y - L + 1.2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.strokeStyle = U.rgba(C.gofun, Math.min(1, 0.25 + hi));
    ctx.beginPath();
    ctx.moveTo(x - L, y - 1); ctx.lineTo(x - 1, y - 1); ctx.lineTo(x - 1, y - L);
    ctx.stroke();
    // the raking gleam: a 40 px bright run sliding along the arms, 0.8 → 2.0
    const g = U.seg(T, 0.8, 2.0, U.ease.inOutSine);
    if (g > 0 && g < 1) {
      const tot = 2 * L, pos = g * (tot + 40) - 20;
      const pt = (d) => (d < L ? [x - L + d, y - 1] : [x - 1, y - 1 - (d - L)]);
      ctx.lineWidth = 2.4;
      for (let d = Math.max(0, pos - 20); d < Math.min(tot, pos + 20); d += 2) {
        const w = 1 - Math.abs(d - pos) / 20;
        const [px, py] = pt(d), [qx, qy] = pt(Math.min(tot, d + 2));
        ctx.strokeStyle = U.rgba('#fffaf0', 0.85 * w * w * Math.sin(g * Math.PI));
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(qx, qy); ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* 2–6 s: only the key block exists yet. Every layer's K plate goes into */
  /* one sheet, and the baren's spiral out of the house reveals it.       */
  /* ------------------------------------------------------------------ */
  // The baren circles once per CUES.baren.stroke (0.7 s — the score's rub and
  // its stereo circling), so the spiral's front turns at the same rate: the
  // reach grows linearly over PRINT's 2 → 6 and the pitch is the reach per
  // circle (1300 px / (4 s / 0.7 s) ≈ 228 px). The spiral starts pointing up
  // and turns clockwise, so the front is at the right when the rub pans right.
  // (PRINT.state's keyReveal gates it and gives the centre; its eased reach and
  // width are not used here.)
  const REACH = 1300;
  const barenCue = () => { const c = TSUKI.CUES && TSUKI.CUES.baren; return c && c.stroke > 0 ? c : { from: 2, to: 6, stroke: 0.7 }; };
  const SPIRAL = (() => {
    const X = PRINT.TIMES, cue = barenCue();
    const t0 = X.printStart, t1 = X.keyDone;
    return { cx: 1180, cy: 560, t0, t1, pitch: (REACH * cue.stroke) / (t1 - t0), rot: -Math.PI / 2 };
  })();
  const spiralB = () => SPIRAL.pitch / TAU;
  const reachAt = (T) => REACH * U.clamp((T - SPIRAL.t0) / (SPIRAL.t1 - SPIRAL.t0));
  const wAt = (th) => SPIRAL.pitch * (1.0 + 0.18 * (U.noise1(th * 1.7, 5) - 0.5)) + 6;
  const spiralPt = (th, rad) => [SPIRAL.cx + Math.cos(th + SPIRAL.rot) * rad, SPIRAL.cy + Math.sin(th + SPIRAL.rot) * rad];

  /**
   * One band of the rub as a fill path (stage coords): the spiral from th0 to
   * th1, its half-width hk·wAt/2 breathing along it (the baren's pressure);
   * adjacent turns overlap or leave a starved seam where both run narrow.
   * cap: round end at th1. Returns { path, box: [x0, y0, x1, y1] }.
   */
  function band(th0, th1, hk, cap) {
    const b = spiralB(), path = new Path2D();
    const outer = [], inner = [];
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const grow = (p) => { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; };
    for (let th = th0; ; ) {
      const r = b * th, h = (wAt(th) * hk) / 2;
      const o = spiralPt(th, r + h), i = spiralPt(th, Math.max(0, r - h));
      outer.push(o); inner.push(i); grow(o);
      if (th >= th1) break;
      th = Math.min(th1, th + U.clamp(Math.sqrt(2 / Math.max(20, r + h)), 0.012, 0.15));
    }
    path.moveTo(outer[0][0], outer[0][1]);
    for (let k = 1; k < outer.length; k++) path.lineTo(outer[k][0], outer[k][1]);
    if (cap) {
      const r = b * th1, h = (wAt(th1) * hk) / 2, c = spiralPt(th1, r), a = th1 + SPIRAL.rot;
      path.arc(c[0], c[1], h, a, a + Math.PI, false);
      grow([c[0] - h, c[1] - h]); grow([c[0] + h, c[1] + h]);
    }
    for (let k = inner.length - 1; k >= 0; k--) { path.lineTo(inner[k][0], inner[k][1]); grow(inner[k]); }
    path.closePath();
    if (th0 <= 0) {
      // the first press, at the house: a full disc under the pad (same winding: the union fills)
      const h = wAt(0) / 2;
      path.moveTo(SPIRAL.cx + h, SPIRAL.cy);
      path.arc(SPIRAL.cx, SPIRAL.cy, h, 0, TAU, false);
      grow([SPIRAL.cx - h, SPIRAL.cy - h]); grow([SPIRAL.cx + h, SPIRAL.cy + h]);
    }
    return { path, box: [x0 - 2, y0 - 2, x1 + 2, y1 + 2] };
  }

  // the whole key block of Shot A, flattened once (the K plates do not move in 序),
  // in two impressions: rubbed hard, its seams between the turns left a little
  // starved (goma-zuri); and the leading first pass, its outer edge rubbed, not cut
  let keys = null;
  function keySheets(cw, ch) {
    if (keys && keys.cw === cw && keys.ch === ch) return keys;
    releaseKeys();
    const k = cw / W, b = spiralB();
    const sheet = () => {
      const cv = B.canvas(cw, ch), s = cv.getContext('2d');
      s.setTransform(k, 0, 0, k, 0, 0);
      s.imageSmoothingEnabled = false;
      const bare = Object.assign({}, PRINT.state(3), { keyReveal: null });
      for (const l of ['far', 'grove', 'house', 'field', 'pond', 'banks', 'still']) PRINT.drawLayer(s, 'A', l, 3, { state: bare, only: ['K'] });
      s.globalCompositeOperation = 'destination-out';
      return { cv, s };
    };
    // the seams: goma-zuri dots fixed to the spiral, between one turn and the next
    const hard = sheet();
    {
      const r = U.rng(606), p1 = new Path2D(), p2 = new Path2D();
      for (let th = TAU * 0.5; th < 60; th += 0.004) {
        const rr = r(), rr2 = r();
        if (rr > 0.3) continue;
        const [x, y] = spiralPt(th, b * th + SPIRAL.pitch / 2 + U.lerp(-5, 5, rr2));
        if (x < -20 || x > W + 20 || y < -20 || y > H + 20) { r(); r(); continue; }
        (rr < 0.12 ? p1 : p2).rect(x, y, U.lerp(1, 2, r()), U.lerp(1, 2, r()));
      }
      hard.s.fillStyle = 'rgba(0,0,0,0.85)'; hard.s.fill(p1);
      hard.s.fillStyle = 'rgba(0,0,0,0.55)'; hard.s.fill(p2);
    }
    // the rubbed edge of the leading pass (only ever seen inside that band)
    const lead = sheet();
    {
      const edge = new Path2D();
      for (let i = 0; i * 0.01 < 60; i++) {
        const th = i * 0.01, rr = U.hash(i * 3 + 1), off = U.hash(i * 3 + 2), sz = U.hash(i * 3 + 3);
        if (rr > 0.45) continue;
        const [x, y] = spiralPt(th, b * th + (wAt(th) * 0.82) / 2 - off * 12);
        if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
        edge.rect(x, y, 1 + sz, 1 + sz * 0.6);
      }
      lead.s.fillStyle = 'rgba(0,0,0,0.9)';
      lead.s.fill(edge);
    }
    keys = { cw, ch, hard: hard.cv, lead: lead.cv };
    return keys;
  }
  function releaseKeys() {
    if (!keys) return;
    for (const cv of [keys.hard, keys.lead]) { cv.width = 0; cv.height = 0; }
    keys = null;
  }
  /** blit sheet cv through the clip `path`, only over the band's box (device px) */
  function printThrough(ctx, cv, bd, alpha) {
    const k = ctx.canvas.width / W;
    const x0 = Math.max(0, Math.floor(bd.box[0] * k)), y0 = Math.max(0, Math.floor(bd.box[1] * k));
    const x1 = Math.min(cv.width, Math.ceil(bd.box[2] * k)), y1 = Math.min(cv.height, Math.ceil(bd.box[3] * k));
    if (x1 <= x0 || y1 <= y0) return;
    ctx.save();
    ctx.clip(bd.path);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha *= alpha;
    ctx.drawImage(cv, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
    ctx.restore();
  }
  function keyBlockOnly(ctx, T) {
    const kr = PRINT.state(T).keyReveal;
    if (!kr) return;
    const reach = reachAt(T);
    if (reach <= 1) return;
    // the baren: the full pressure out to one turn and a quarter behind the
    // front; the leading turn and a quarter a lighter, narrower first pass
    const thMax = reach / spiralB();
    const lead = Math.max(0, thMax - 1.25 * TAU);
    const K = keySheets(ctx.canvas.width, ctx.canvas.height);
    if (lead > 0) printThrough(ctx, K.hard, band(0, lead, 1, false), 1);
    printThrough(ctx, K.lead, band(lead, thMax, 0.82, true), 0.6);
  }

  /* ------------------------------------------------------------------ */
  /* the moon before the moon: a 山吹 warmth on the bare paper (no disc),  */
  /* and the disc only as a karazuri — a blind-embossed rim               */
  /* ------------------------------------------------------------------ */
  // the warmth is Shot A's own 山吹 band (A.glowBand): a flat bokashi with a
  // hard foot on the far bank — on the bare paper until the sky block lands,
  // then printed with it (A.drawGarden's glow). It breathes ±6 % on 7 s.
  function moonBefore(ctx, T, k, glow, rim) {
    if (glow > 0.002 && A.glowBand) {
      const br = 1 + 0.06 * Math.sin((TAU * T) / 7);
      A.glowBand(ctx, 0.34 * glow * br);
    }
    if (rim > 0.002) {
      const m = TSUKI.MOON.A(T);
      ctx.save();
      ctx.beginPath();
      ctx.rect(m.x - m.r - 4, m.y - m.r - 4, m.r * 2 + 8, A.GEO.bankY(m.x) - 3 - (m.y - m.r - 4));
      ctx.clip();
      ctx.globalAlpha *= rim;
      ctx.lineCap = 'round';
      // highlight on the upper-left, where the raking light meets the embossed edge
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = U.rgba(C.gofun, 0.9);
      ctx.beginPath(); ctx.arc(m.x - 0.6, m.y - 0.6, m.r, Math.PI * 0.98, Math.PI * 1.62); ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = U.rgba(C.gofun, 0.35);
      ctx.beginPath(); ctx.arc(m.x - 0.6, m.y - 0.6, m.r, Math.PI * 1.62, Math.PI * 1.8); ctx.stroke();
      // the faint shadow on the lower-right
      ctx.strokeStyle = U.rgba(C.sumi, 0.08);
      ctx.beginPath(); ctx.arc(m.x + 0.8, m.y + 0.8, m.r, Math.PI * 1.72, Math.PI * 2.02); ctx.stroke();
      ctx.restore();
    }
  }

  TSUKI.scene('jo-surizome', {
    init(S) {
      // everything 序 needs, built before the first frame (released again once 一 has begun: A.releaseJo)
      const k = S.k || 1, kk = Math.min(2, Math.max(0.5, k));
      const cw = Math.round(W * k), ch = Math.round((cw * H) / W);
      deckleSprite(Math.min(1.5, kk));
      panels(Math.max(1, Math.min(2, k)));
      try { keySheets(cw, ch); } catch (e) { /* built on demand */ }
      if (A.warmWipe) A.warmWipe(cw, ch);
    },
    draw(ctx, t, S) {
      const T = S.seg.start + t;
      const k = Math.min(2, Math.max(0.5, S.k || 1));
      const st = PRINT.state(T);
      joDrawn = true;
      // the warmth arrives with the spiral (2 → 3.4) at ×0.3 and grows as the colour lands;
      // until the sky block lands (9.0) it lies on the bare paper, then the sky carries it
      const warm = T < 2 ? 0 : T < 6 ? 0.38 * U.seg(T, 2, 3.4, U.ease.inOutSine) : U.lerp(0.38, 1, U.seg(T, 6, 9.6, U.ease.inOutSine));
      const skyA = st.alpha.P6 == null ? 1 : st.alpha.P6;
      // the dry disc: nothing but its embossed rim until the first block lands; then its glaze
      const glaze = U.seg(T, 6.0, 9.6, U.ease.inOutSine);
      const rim = U.seg(T, 2.2, 3.6, U.ease.inOutSine) * (1 - U.seg(T, 6.4, 8.4, U.ease.inOutSine));
      const k0 = ctx.getTransform().a;
      if (T < PRINT.TIMES.keyDone) {
        moonBefore(ctx, T, k, warm, rim);
        const se = ctx.imageSmoothingEnabled;
        ctx.imageSmoothingEnabled = Math.abs(k0 - ctx.canvas.width / W) > 1e-3;
        keyBlockOnly(ctx, T);
        ctx.imageSmoothingEnabled = se;
      } else {
        moonBefore(ctx, T, k, warm * (1 - skyA), rim);
        A.drawGarden(ctx, T, {
          still: T < 13,             // near susuki, 萩, sōzu from the carved block until the first gust
          figures: false,
          moonAlpha: glaze,
          glow: warm,                // the 山吹 band, printed with the sky block (× its landing)
        });
      }
      A.titlePanels(ctx, T, 1);
      // the sheet's deckle and the 見当 (visible to 6 s, gone into the frame by 9 s)
      const da = 1 - U.seg(T, 6, 9, U.ease.inOutSine);
      if (da > 0.002) {
        ctx.save();
        ctx.globalAlpha *= da;
        ctx.drawImage(deckleSprite(Math.min(1.5, k)), 0, 0, W, H);
        ctx.restore();
        kento(ctx, T, da);
      }
    },
  });
})(window.TSUKI = window.TSUKI || {});
