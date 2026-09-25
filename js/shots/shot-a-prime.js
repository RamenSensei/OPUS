/* ==========================================================================
   shot-a-prime.js — MASTER SHOT A′: the engawa in profile (Harunobu idiom).
   Used by 五 (the colour drain, 155–160) and by 六 for two inserts (the two
   cups & the faded strip, 169–173; the fox-window payoff, 182–190).

   The frame (1920×1080):
     eave      y 0–112   thatch edge, fascia, rafter ends, 軒桁 — in shade
     wall      y 112–822 小壁 strip, 鴨居, tall 月白 shoji (six panels) with the
                         eave's moon-shadow falling diagonally across their tops
                         and the post's shadow on the paper
     boards    y 822–1080 煤竹 boards running along the house, 墨 grain, a moon sheen
     post      x 1165–1195, the engawa's outer post (煤竹, lit edge on its right)
   Moonlight comes from off-frame upper right: every floor shadow falls to the
   lower left (see shadowMatrix). TEXT POCKET: x 500–860, y 60–480 stays plain.

   PRINT shot id 'A_prime' (worn: true — after T 160 it prints as the 後摺
   automatically). Layers back → front: 'wall', 'shade' (the moon-shadows on
   the paper: eave, post, the night's falloff), 'boards', 'post', 'eave'.

   HELPERS on TSUKI.SHOTS.A_prime
     GEOM                          measurements: postX 1180, postW 30, floorY 822,
                                   seatY 950 (where seated figures rest), shojiTop,
                                   shojiBottom, panels [[x0,x1]…], textPocket
     draw(ctx, T, opts)            print the master. opts:
        between {wall|shade|boards|post|eave: fn(ctx, st)} — live content after a layer
        camera  {scale, about:[x,y], to:[x,y]} — a close framing (e.g. inserts:
                {scale: 1.8, about: [980, 900], to: [960, 600]})
        age     true (default) → TSUKI.SHOTS.age(ctx, T, {holes}) after the last
                layer (before its between callback) when T ≥ 160; opts.holes as PRINT.age
        skip    ['post'] etc. to leave a layer out
     shadowMatrix(baseY, len)      DOMMatrix projecting stage coords onto the boards:
                                   a point at height h above baseY lands at
                                   (x − 0.62·h·len, baseY + 0.24·h·len) — lower left
     castShadow(ctx, T, draw, o)   draw(c) paints a silhouette (any colour) in stage
                                   coords; it is projected with shadowMatrix(o.baseY,
                                   o.len) and printed as 藍鼠 multiply through P4.
                                   o: baseY (required), len (1), alpha (0.55),
                                   bbox [x0,y0,x1,y1] of the caster (bounds the work —
                                   pass it), res (0.5: the upscale is the penumbra)
     INK                           { SUSUDAKE, AINEZU }

   Also defined here (shared by every master shot of this builder):
     TSUKI.SHOTS.warmFlat(shotId, T, k, layers?)  pre-build the flattened layer
        snapshots at film time T for backing scale k (call from a scene's init)
     TSUKI.SHOTS.gentleWear(P, layer, plate, seed, opts)  a hand-carved 後摺
        variant of a plate (see below)
     TSUKI.SHOTS.age(ctx, T, opts)  the 後摺 paper (鳥の子 multiply + foxing),
        like PRINT.age but the foxing is multiplied too (it darkens dark wood
        instead of glittering on it); opts.amount, opts.holes
     TSUKI.SHOTS.printFlat(ctx, T, shotId, layer, opts)
        Prints one PRINT layer exactly like PRINT.drawLayer, but while the print
        table is still (no printing, tears, jolt or unprinting) it re-uses a
        flattened snapshot of the layer's plates — one blit instead of five.
        Falls back to PRINT.drawLayer whenever any plate is moving.
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const U = TSUKI.U, B = TSUKI.B, C = TSUKI.C, PRINT = TSUKI.PRINT;
  const W = 1920, H = 1080;
  TSUKI.SHOTS = TSUKI.SHOTS || {};
  const SA = (TSUKI.SHOTS.A_prime = TSUKI.SHOTS.A_prime || {});

  /* ------------------------------------------------------------------ */
  /* shared: flattened layer snapshots while the print table is still    */
  /* ------------------------------------------------------------------ */
  if (!TSUKI.SHOTS.printFlat) {
    const FLAT = {};
    TSUKI.SHOTS.printFlat = (ctx, T, id, layer, opts = {}) => {
      const st = PRINT.state(T);
      const shot = PRINT.shot(id);
      const L = shot.layers[layer];
      if (!L) return;
      const X = PRINT.TIMES;
      const moving = st.keyReveal || st.phase === 'printing' || st.phase === 'tears' || st.phase === 'unprint' ||
        (T >= X.jolt && T < X.jolt + X.joltDur + 0.02);
      if (moving || opts.live) { PRINT.drawLayer(ctx, id, layer, T, opts); return; }
      const ids = Object.keys(L).sort();
      let sig = `w${st.wear.toFixed(3)}`;
      for (const p of ids) {
        const o = st.off[p] || [0, 0], a = st.alpha[p] == null ? 1 : st.alpha[p];
        sig += `|${p}${o[0].toFixed(2)},${o[1].toFixed(2)},${a.toFixed(3)}`;
      }
      if (opts.alpha) sig += JSON.stringify(opts.alpha);
      if (opts.only) sig += 'o' + opts.only.join(',');
      if (opts.skip) sig += 's' + opts.skip.join(',');
      const cv = ctx.canvas;
      const k = cv.width / W;
      const key = id + '|' + layer;
      const list = FLAT[key] || (FLAT[key] = []);
      let e = list.find((x) => x.sig === sig && x.cw === cv.width && x.shot === shot);
      if (!e) {
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const p of ids) {
          const s = L[p];
          for (const pl of [s.orig, s.worn]) {
            if (!pl) continue;
            const o = st.off[p] || [0, 0];
            x0 = Math.min(x0, pl.x + o[0]); y0 = Math.min(y0, pl.y + o[1]);
            x1 = Math.max(x1, pl.x + pl.w + o[0]); y1 = Math.max(y1, pl.y + pl.h + o[1]);
          }
        }
        if (!(x1 > x0 && y1 > y0)) return;
        const dx0 = Math.max(0, Math.floor(x0 * k)), dy0 = Math.max(0, Math.floor(y0 * k));
        const dx1 = Math.min(cv.width, Math.ceil(x1 * k)), dy1 = Math.min(cv.height, Math.ceil(y1 * k));
        const c = B.canvas(dx1 - dx0, dy1 - dy0);
        const cx = c.getContext('2d');
        cx.setTransform(k, 0, 0, k, -dx0, -dy0);
        cx.imageSmoothingEnabled = true;
        cx.imageSmoothingQuality = 'low';
        PRINT.drawLayer(cx, id, layer, T, opts);
        e = { sig, cw: cv.width, shot, c, x: dx0 / k, y: dy0 / k, w: (dx1 - dx0) / k, h: (dy1 - dy0) / k };
        list.unshift(e);
        if (list.length > 2) list.pop();
      }
      ctx.drawImage(e.c, e.x, e.y, e.w, e.h);
    };
  }

  /**
   * TSUKI.SHOTS.gentleWear(P, layer, plate, seed, opts) — carve a plate's late
   * impression (後摺) by hand instead of the automatic one: copy the plate into
   * '<plate>~worn' and wear it gently — fine goma-zuri speckle (also inside
   * large solid blacks, where the automatic dash-gaps would read as leopard
   * spots), a few small gaps in the lines and a few cracks along the grain.
   * Call at the end of build(), after everything has been drawn into the plate.
   * opts: speckle (count), gaps (count), cracks (count), region [x,y,w,h]
   */
  if (!TSUKI.SHOTS.gentleWear) {
    TSUKI.SHOTS.gentleWear = (P, layer, plate, seed, opts = {}) => {
      const src = P(layer, plate), dst = P(layer, plate + '~worn');
      dst.save();
      dst.setTransform(1, 0, 0, 1, 0, 0);
      dst.drawImage(src.canvas, 0, 0);
      dst.restore();
      const [rx, ry, rw, rh] = opts.region || [0, 0, W, H];
      const r = U.rng(seed);
      dst.save();
      dst.globalCompositeOperation = 'destination-out';
      const n = opts.speckle == null ? Math.round((rw * rh) / 260) : opts.speckle;
      for (let i = 0; i < n; i++) {
        dst.fillStyle = `rgba(0,0,0,${U.lerp(0.18, 0.6, r())})`;
        const sz = U.lerp(0.5, 1.3, r());
        dst.fillRect(rx + r() * rw, ry + r() * rh, sz, sz * U.lerp(0.6, 1.4, r()));
      }
      const g = opts.gaps == null ? Math.round((rw * rh) / 5000) : opts.gaps;
      dst.fillStyle = 'rgba(0,0,0,0.9)';
      for (let i = 0; i < g; i++) {
        dst.beginPath();
        dst.ellipse(rx + r() * rw, ry + r() * rh, U.lerp(0.8, 2.4, r()), U.lerp(0.6, 1.4, r()), r() * Math.PI, 0, U.TAU);
        dst.fill();
      }
      const ck = opts.cracks == null ? 4 : opts.cracks;
      dst.lineCap = 'round';
      for (let i = 0; i < ck; i++) {
        let px = rx + r() * rw, py = ry + r() * rh;
        dst.strokeStyle = `rgba(0,0,0,${U.lerp(0.4, 0.8, r())})`;
        dst.lineWidth = U.lerp(0.6, 1.4, r());
        dst.beginPath();
        dst.moveTo(px, py);
        const L = U.lerp(140, 420, r());
        for (let d = 0; d < L; d += 10) { px += 10; py += U.lerp(-1.6, 1.6, r()); dst.lineTo(px, py); }
        dst.stroke();
      }
      dst.restore();
    };
  }

  /**
   * TSUKI.SHOTS.age(ctx, T, opts) — the 後摺's paper, like PRINT.age (鳥の子
   * multiply, amount = PRINT.state(T).wear) but its foxing is printed
   * 'multiply' too, so on dark walls and boards the stains darken instead of
   * glittering light, and no clip is needed unless opts.holes is given
   * ([[x, y, r]…], exempt; cheaper: paint the moon after aging instead).
   * opts: amount (0..1), holes
   */
  if (!TSUKI.SHOTS.age) {
    let fox = null;
    const foxSprite = () => {
      if (fox) return fox;
      fox = B.canvas(W / 2, H / 2);
      const x = fox.getContext('2d');
      x.scale(0.5, 0.5);
      const r = U.rng(606);
      const ink = U.mix(C.odo, C.sumi, 0.45);
      for (let i = 0; i < 64; i++) {
        const px = r() * W, py = r() * H, rr = U.lerp(2, 13, Math.pow(r(), 2));
        const g = x.createRadialGradient(px, py, 0, px, py, rr);
        const a = U.lerp(0.12, 0.25, r());
        g.addColorStop(0, U.rgba(ink, a));
        g.addColorStop(0.6, U.rgba(ink, a * 0.6));
        g.addColorStop(1, U.rgba(ink, 0));
        x.fillStyle = g;
        x.beginPath(); x.arc(px, py, rr, 0, U.TAU); x.fill();
      }
      for (let i = 0; i < 3; i++) {
        const px = r() * W, py = r() * H, rr = U.lerp(60, 160, r());
        x.strokeStyle = U.rgba(ink, 0.06);
        x.lineWidth = 2;
        x.beginPath(); x.ellipse(px, py, rr, rr * U.lerp(0.5, 0.9, r()), r() * Math.PI, 0, U.TAU); x.stroke();
      }
      return fox;
    };
    // the paper's tint and its foxing baked into ONE opaque multiply sprite (half resolution):
    // one full-frame composite per frame instead of two
    let agedSprite = null;
    const ageSprite = () => {
      if (agedSprite) return agedSprite;
      agedSprite = B.canvas(W / 2, H / 2);
      const x = agedSprite.getContext('2d');
      x.fillStyle = U.mix('#ffffff', C.torinoko, 0.5);
      x.fillRect(0, 0, W / 2, H / 2);
      x.globalCompositeOperation = 'multiply';
      x.drawImage(foxSprite(), 0, 0, W / 2, H / 2);
      return agedSprite;
    };
    TSUKI.SHOTS.age = (ctx, T, opts = {}) => {
      const amt = opts.amount == null ? PRINT.state(T).wear : opts.amount;
      if (amt <= 0.001) return;
      ctx.save();
      if (opts.holes && opts.holes.length) {
        ctx.beginPath();
        ctx.rect(0, 0, W, H);
        for (const [hx, hy, hr] of opts.holes) { ctx.moveTo(hx + hr, hy); ctx.arc(hx, hy, hr, 0, U.TAU, true); }
        ctx.clip('evenodd');
      }
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = amt;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'low';
      ctx.drawImage(ageSprite(), 0, 0, W, H);
      ctx.restore();
    };
  }

  /* ------------------------------------------------------------------ */
  /* inks & geometry                                                     */
  /* ------------------------------------------------------------------ */
  const SUSUDAKE = U.mix(C.odo, C.sumi, 0.55);
  const WOOD_DARK = U.mix(SUSUDAKE, C.sumi, 0.3);
  const AINEZU = U.mix(C.ai, C.nezumi, 0.5);
  SA.INK = { SUSUDAKE, AINEZU, WOOD_DARK };

  const G = (SA.GEOM = {
    eave: [0, 112],
    kokabe: [112, 150],
    lintel: [150, 172],
    shojiTop: 172, shojiBottom: 800,
    sill: [800, 822],
    floorY: 822,
    seatY: 950,
    postX: 1180, postW: 30, postBase: 986,
    panels: [],
    textPocket: [500, 60, 860, 480],
    // eave shadow on the paper: its lower edge runs from (0, eaveShadowL) to (1920, eaveShadowR)
    eaveShadowL: 392, eaveShadowR: 214,
  });
  for (let x = -70; x < W; x += 330) G.panels.push([x, x + 330]);
  const eaveShadowY = (x) => U.lerp(G.eaveShadowL, G.eaveShadowR, x / W);
  SA.eaveShadowY = eaveShadowY;

  /* ------------------------------------------------------------------ */
  /* carving                                                             */
  /* ------------------------------------------------------------------ */
  function grainLines(K, x, y, w, h, n, seed, alpha = [0.14, 0.32], vertical) {
    const r = U.rng(seed);
    K.lineWidth = 0.9;
    for (let i = 0; i < n; i++) {
      K.strokeStyle = U.rgba(C.sumi, U.lerp(alpha[0], alpha[1], r()));
      K.beginPath();
      if (vertical) {
        let gx = x + r() * w;
        K.moveTo(gx, y);
        for (let yy = y; yy <= y + h; yy += 16) { gx += U.lerp(-0.7, 0.7, r()); K.lineTo(U.clamp(gx, x + 1, x + w - 1), yy); }
      } else {
        let gy = y + r() * h;
        const x0 = x + r() * w * 0.3, x1 = x0 + w * U.lerp(0.4, 1, r());
        K.moveTo(x0, gy);
        for (let xx = x0; xx <= Math.min(x + w, x1); xx += 18) { gy += U.lerp(-0.5, 0.5, r()); K.lineTo(xx, U.clamp(gy, y + 1, y + h - 1)); }
      }
      K.stroke();
    }
  }

  function carve(P) {
    /* ---------------- wall: 小壁, 鴨居, shoji, sill ---------------- */
    {
      const P1 = P('wall', 'P1'), P4 = P('shade', 'P4'), P7 = P('wall', 'P7'), K = P('wall', 'K');
      // 小壁 strip under the eave (plaster, in the eave's shade)
      P1.fillStyle = U.rgba(C.odo, 0.62);
      P1.fillRect(0, G.kokabe[0], W, G.kokabe[1] - G.kokabe[0]);
      const r = U.rng(501);
      for (let i = 0; i < 1400; i++) {
        P4.fillStyle = U.rgba(C.nezumi, U.lerp(0.1, 0.35, r()));
        P4.fillRect(r() * W, G.kokabe[0] + r() * (G.kokabe[1] - G.kokabe[0]), 1.3, 1.3);
      }
      // 鴨居
      P1.fillStyle = SUSUDAKE;
      P1.fillRect(0, G.lintel[0], W, G.lintel[1] - G.lintel[0]);
      K.strokeStyle = U.rgba(C.sumi, 0.85);
      K.lineWidth = 1.6;
      for (const y of [G.lintel[0], G.lintel[1]]) { K.beginPath(); K.moveTo(0, y); K.lineTo(W, y); K.stroke(); }
      grainLines(K, 0, G.lintel[0] + 2, W, G.lintel[1] - G.lintel[0] - 4, 10, 502);
      // the paper
      P7.fillStyle = C.geppaku;
      P7.fillRect(0, G.shojiTop, W, G.shojiBottom - G.shojiTop);
      // paper fibres and the faint overlap seams of the pasted strips
      for (let i = 0; i < 700; i++) {
        const fx = r() * W, fy = G.shojiTop + r() * (G.shojiBottom - G.shojiTop), an = U.lerp(-0.5, 0.5, r()), L = U.lerp(8, 24, r());
        P7.strokeStyle = U.rgba(AINEZU, U.lerp(0.04, 0.1, r()));
        P7.lineWidth = 0.7;
        P7.beginPath(); P7.moveTo(fx, fy); P7.quadraticCurveTo(fx + L / 2, fy + U.lerp(-3, 3, r()), fx + Math.cos(an) * L, fy + Math.sin(an) * L); P7.stroke();
      }
      // shoji panels: 横繁 kumiko (3 × 8), thin 墨 bars, 煤竹 frames
      const rows = 8;
      const cellH = (G.shojiBottom - G.shojiTop) / rows;
      for (const [x0, x1] of G.panels) {
        K.fillStyle = U.rgba(C.sumi, 0.82);
        const f = 9;
        for (let c = 1; c < 3; c++) K.fillRect(x0 + ((x1 - x0) * c) / 3 - 1.3, G.shojiTop, 2.6, G.shojiBottom - G.shojiTop);
        for (let rr = 1; rr < rows; rr++) K.fillRect(x0 + f, G.shojiTop + cellH * rr - 1.3, x1 - x0 - 2 * f, 2.6);
        // frame
        P1.fillStyle = SUSUDAKE;
        P1.fillRect(x0, G.shojiTop, f, G.shojiBottom - G.shojiTop);
        P1.fillRect(x1 - f, G.shojiTop, f, G.shojiBottom - G.shojiTop);
        P1.fillRect(x0, G.shojiTop, x1 - x0, f);
        P1.fillRect(x0, G.shojiBottom - f - 6, x1 - x0, f + 6);
        K.strokeStyle = U.rgba(C.sumi, 0.85);
        K.lineWidth = 1.3;
        K.strokeRect(x0 + 0.5, G.shojiTop + 0.5, f, G.shojiBottom - G.shojiTop - 1);
        K.strokeRect(x1 - f - 0.5, G.shojiTop + 0.5, f, G.shojiBottom - G.shojiTop - 1);
        K.beginPath(); K.moveTo(x0, G.shojiTop + f); K.lineTo(x1, G.shojiTop + f); K.moveTo(x0, G.shojiBottom - f - 6); K.lineTo(x1, G.shojiBottom - f - 6); K.stroke();
      }
      // night: the paper holds the moonlight coolly — brighter toward the moon (right), dimmer away
      {
        const gn = P4.createLinearGradient(0, 0, W, 0);
        gn.addColorStop(0, U.rgba(AINEZU, 0.46));
        gn.addColorStop(0.55, U.rgba(AINEZU, 0.3));
        gn.addColorStop(1, U.rgba(AINEZU, 0.14));
        P4.fillStyle = gn;
        P4.fillRect(0, G.shojiTop, W, G.shojiBottom - G.shojiTop);
        const gv = P4.createLinearGradient(0, G.shojiTop, 0, G.shojiBottom);
        gv.addColorStop(0, U.rgba(AINEZU, 0));
        gv.addColorStop(0.7, U.rgba(AINEZU, 0));
        gv.addColorStop(1, U.rgba(AINEZU, 0.16));
        P4.fillStyle = gv;
        P4.fillRect(0, G.shojiTop, W, G.shojiBottom - G.shojiTop);
      }
      // the eave's moon-shadow across the tops of the shoji (and the 小壁), diagonal edge
      P4.save();
      P4.beginPath();
      P4.moveTo(0, G.kokabe[0]); P4.lineTo(W, G.kokabe[0]);
      P4.lineTo(W, G.eaveShadowR); P4.lineTo(0, G.eaveShadowL); P4.closePath();
      P4.fillStyle = U.rgba(AINEZU, 0.6);
      P4.fill();
      // soft edge: two thinner pulls below the line
      for (const [d, a] of [[5, 0.12], [10, 0.06]]) {
        P4.beginPath();
        P4.moveTo(0, G.eaveShadowL); P4.lineTo(W, G.eaveShadowR); P4.lineTo(W, G.eaveShadowR + d); P4.lineTo(0, G.eaveShadowL + d); P4.closePath();
        P4.fillStyle = U.rgba(AINEZU, a);
        P4.fill();
      }
      P4.restore();
      // the post's shadow on the paper: a vertical band to the left of the post, below the eave shadow
      {
        const px = G.postX - G.postW / 2 - 64;
        P4.fillStyle = U.rgba(AINEZU, 0.42);
        P4.beginPath();
        P4.moveTo(px, eaveShadowY(px)); P4.lineTo(px + 34, eaveShadowY(px + 34)); P4.lineTo(px + 34, G.shojiBottom); P4.lineTo(px, G.shojiBottom); P4.closePath();
        P4.fill();
      }
      // sill (敷居) with its grooves and a thin moon catch-light
      P1.fillStyle = SUSUDAKE;
      P1.fillRect(0, G.sill[0], W, G.sill[1] - G.sill[0]);
      K.strokeStyle = U.rgba(C.sumi, 0.85);
      K.lineWidth = 1.4;
      for (const y of [G.sill[0], G.sill[1], G.sill[0] + 7]) { K.beginPath(); K.moveTo(0, y); K.lineTo(W, y); K.stroke(); }
      P7.fillStyle = U.rgba(C.geppaku, 0.35);
      P7.fillRect(0, G.sill[0] + 1.5, W, 1.4);
    }

    /* ---------------- eave: thatch edge, fascia, rafters, beam ---------------- */
    {
      const P1 = P('eave', 'P1'), P3 = P('eave', 'P3'), K = P('eave', 'K'), P7 = P('eave', 'P7');
      const r = U.rng(611);
      // thatch cut edge: layered bundles, 黄土 with 尾花 tips, hatched in 墨 — in the eave's own shade
      P1.fillStyle = U.mix(C.odo, C.sumi, 0.5);
      P1.fillRect(0, 0, W, 66);
      for (let i = 0; i < 1100; i++) {
        const x = r() * W, y = r() * 62, L = U.lerp(10, 26, r());
        P3.strokeStyle = U.rgba(U.mix(C.susuki, C.odo, 0.4), U.lerp(0.12, 0.34, r()));
        P3.lineWidth = U.lerp(0.8, 1.6, r());
        P3.beginPath(); P3.moveTo(x, y); P3.lineTo(x + U.lerp(-2, 2, r()), y + L); P3.stroke();
      }
      for (let i = 0; i < 1500; i++) {
        const x = r() * W, y = r() * 62, L = U.lerp(8, 22, r());
        K.strokeStyle = U.rgba(C.sumi, U.lerp(0.3, 0.6, r()));
        K.lineWidth = U.lerp(0.6, 1.2, r());
        K.beginPath(); K.moveTo(x, y); K.lineTo(x + U.lerp(-2, 2, r()), y + L); K.stroke();
      }
      // the thatch darkens up into the night
      {
        const gt = K.createLinearGradient(0, 0, 0, 66);
        gt.addColorStop(0, U.rgba(C.sumi, 0.6));
        gt.addColorStop(1, U.rgba(C.sumi, 0.15));
        K.fillStyle = gt;
        K.fillRect(0, 0, W, 66);
      }
      // the lip of the thatch: a scalloped lower edge (cut bundles), lit faintly
      K.fillStyle = U.rgba(C.sumi, 0.75);
      K.beginPath();
      K.moveTo(0, 60);
      for (let x = 0; x <= W + 20; x += 20) K.quadraticCurveTo(x + 10, 70 + U.lerp(-1, 2, r()), x + 20, 60);
      K.lineTo(W, 74); K.lineTo(0, 74); K.closePath(); K.fill();
      P7.strokeStyle = U.rgba(C.geppaku, 0.3);
      P7.lineWidth = 1.2;
      P7.beginPath();
      for (let x = 0; x <= W; x += 20) { P7.moveTo(x + 3, 62); P7.quadraticCurveTo(x + 10, 67, x + 17, 62); }
      P7.stroke();
      // fascia + rafter ends
      P1.fillStyle = WOOD_DARK;
      P1.fillRect(0, 74, W, 38);
      K.fillStyle = U.rgba(C.sumi, 0.6);
      K.fillRect(0, 74, W, 38);
      for (let x = 8; x < W; x += 46) {
        P1.fillStyle = SUSUDAKE;
        P1.fillRect(x, 80, 16, 14);
        K.strokeStyle = U.rgba(C.sumi, 0.9);
        K.lineWidth = 1.2;
        K.strokeRect(x + 0.5, 80.5, 15, 13);
        P7.fillStyle = U.rgba(C.geppaku, 0.18);
        P7.fillRect(x + 13, 81, 2, 12);
      }
      // 軒桁 beam
      P1.fillStyle = SUSUDAKE;
      P1.fillRect(0, 98, W, 14);
      K.strokeStyle = U.rgba(C.sumi, 0.9);
      K.lineWidth = 1.6;
      K.beginPath(); K.moveTo(0, 98); K.lineTo(W, 98); K.moveTo(0, 112); K.lineTo(W, 112); K.stroke();
      grainLines(K, 0, 100, W, 10, 6, 612);
    }

    /* ---------------- post ---------------- */
    {
      const P1 = P('post', 'P1'), K = P('post', 'K'), P7 = P('post', 'P7'), P4 = P('post', 'P4');
      const x0 = G.postX - G.postW / 2, x1 = G.postX + G.postW / 2;
      const g = P1.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, WOOD_DARK);
      g.addColorStop(0.7, SUSUDAKE);
      g.addColorStop(1, U.mix(SUSUDAKE, C.odo, 0.3));
      P1.fillStyle = g;
      P1.fillRect(x0, 90, G.postW, G.postBase - 90);
      K.strokeStyle = U.rgba(C.sumi, 0.92);
      K.lineWidth = 2;
      K.beginPath(); K.moveTo(x0, 90); K.lineTo(x0, G.postBase); K.moveTo(x1, 90); K.lineTo(x1, G.postBase); K.stroke();
      grainLines(K, x0 + 2, 90, G.postW - 4, G.postBase - 90, 7, 621, [0.15, 0.35], true);
      // the moonlit edge (light from the upper right)
      P7.fillStyle = U.rgba(C.geppaku, 0.55);
      P7.fillRect(x1 - 3.5, eaveShadowY(x1) - 30, 2.2, G.postBase - eaveShadowY(x1) + 30);
      // the eave's shadow reaches down the post too
      P4.fillStyle = U.rgba(AINEZU, 0.35);
      P4.fillRect(x0, 90, G.postW, eaveShadowY(x1) - 90);
      // where it enters the boards: a dark joint
      K.fillStyle = U.rgba(C.sumi, 0.7);
      K.fillRect(x0 - 2, G.postBase - 3, G.postW + 4, 4);
    }

    /* ---------------- boards ---------------- */
    {
      const P1 = P('boards', 'P1'), K = P('boards', 'K'), P7 = P('boards', 'P7'), P4 = P('boards', 'P4');
      const y0 = G.floorY;
      P1.fillStyle = SUSUDAKE;
      P1.fillRect(0, y0, W, H - y0);
      // boards run along the house: seams wider apart toward the viewer
      const seams = [];
      let y = y0, gap = 26;
      while (y < H + 40) { seams.push(y); y += gap; gap *= 1.16; }
      const r = U.rng(641);
      for (let i = 0; i < seams.length - 1; i++) {
        const ya = seams[i], yb = seams[i + 1];
        // butt joints staggered along each board
        for (let x = U.lerp(-200, 300, r()); x < W; x += U.lerp(520, 900, r())) {
          K.strokeStyle = U.rgba(C.sumi, 0.7);
          K.lineWidth = 1.2;
          K.beginPath(); K.moveTo(x, ya); K.lineTo(x, yb); K.stroke();
        }
        grainLines(K, 0, ya + 2, W, yb - ya - 4, Math.round((yb - ya) / 3.5), 650 + i, [0.1, 0.26]);
        // each board a slightly different pull of the wood block
        P1.fillStyle = U.rgba(i % 2 ? C.sumi : C.odo, 0.07);
        P1.fillRect(0, ya, W, yb - ya);
      }
      for (const s of seams) {
        K.strokeStyle = U.rgba(C.sumi, 0.85);
        K.lineWidth = 1.5;
        K.beginPath(); K.moveTo(0, s); K.lineTo(W, s); K.stroke();
      }
      // moon sheen along the polished boards (bokashi toward the viewer)
      const g = P7.createLinearGradient(0, y0, 0, H);
      g.addColorStop(0, U.rgba(C.geppaku, 0.16));
      g.addColorStop(0.45, U.rgba(C.geppaku, 0.06));
      g.addColorStop(1, U.rgba(C.geppaku, 0));
      P7.fillStyle = g;
      P7.fillRect(0, y0, W, H - y0);
      // the room's shadow under the eave: boards nearest the sill a little darker
      const g2 = P4.createLinearGradient(0, y0, 0, y0 + 60);
      g2.addColorStop(0, U.rgba(AINEZU, 0.35));
      g2.addColorStop(1, U.rgba(AINEZU, 0));
      P4.fillStyle = g2;
      P4.fillRect(0, y0, W, 60);
      // the post's floor shadow (lower left)
      P4.save();
      P4.setTransform(P4.getTransform().multiply(SA.shadowMatrix(G.postBase, 1)));
      P4.fillStyle = U.rgba(AINEZU, 0.5);
      P4.fillRect(G.postX - G.postW / 2, G.postBase - 330, G.postW, 330);
      P4.restore();
      // and toward the viewer the boards fall into night
      const g3 = K.createLinearGradient(0, y0, 0, H);
      g3.addColorStop(0, U.rgba(C.sumi, 0.18));
      g3.addColorStop(0.4, U.rgba(C.sumi, 0.3));
      g3.addColorStop(1, U.rgba(C.sumi, 0.62));
      K.fillStyle = g3;
      K.fillRect(0, y0, W, H - y0);
    }
  }

  PRINT.defineShot('A_prime', {
    layers: ['wall', 'shade', 'boards', 'post', 'eave'],
    worn: true,
    build(P) {
      carve(P);
      // the key block's late impression, carved by hand (solid blacks must not go leopard-spotted)
      TSUKI.SHOTS.gentleWear(P, 'wall', 'K', 701, { region: [0, 112, W, 710] });
      TSUKI.SHOTS.gentleWear(P, 'boards', 'K', 702, { region: [0, 822, W, 258] });
      TSUKI.SHOTS.gentleWear(P, 'post', 'K', 703, { region: [1160, 90, 40, 900], cracks: 2 });
      TSUKI.SHOTS.gentleWear(P, 'eave', 'K', 704, { region: [0, 0, W, 112] });
    },
  });

  /* ------------------------------------------------------------------ */
  /* printing & shadows                                                  */
  /* ------------------------------------------------------------------ */
  /** Floor-shadow projection: height above baseY → lower-left on the boards. */
  SA.shadowMatrix = (baseY, len = 1) => {
    // x' = x + (y − baseY)·0.62·len ;  y' = baseY − (y − baseY)·0.24·len  (y < baseY is "up")
    const a = 0.62 * len, d = 0.24 * len;
    return new DOMMatrix([1, 0, a, -d, -a * baseY, baseY + d * baseY]);
  };

  SA.draw = (ctx, T, opts = {}) => {
    ctx.save();
    ctx.imageSmoothingQuality = 'low';
    if (opts.camera) {
      const cam = opts.camera, s = cam.scale || 1;
      const ab = cam.about || [960, 540], to = cam.to || ab;
      ctx.translate(to[0], to[1]);
      ctx.scale(s, s);
      ctx.translate(-ab[0], -ab[1]);
    }
    const st = PRINT.state(T);
    const layers = ['wall', 'shade', 'boards', 'post', 'eave'].filter((l) => !(opts.skip && opts.skip.includes(l)));
    for (const l of layers) {
      TSUKI.SHOTS.printFlat(ctx, T, 'A_prime', l, opts.print || {});
      if (l === layers[layers.length - 1] && opts.age !== false && T >= PRINT.TIMES.jolt) TSUKI.SHOTS.age(ctx, T, { holes: opts.holes });
      if (opts.between && opts.between[l]) { ctx.save(); opts.between[l](ctx, st); ctx.restore(); }
    }
    ctx.restore();
  };

  const bufs = {};
  /**
   * A floor shadow: draw(c) paints the caster's silhouette in stage coords
   * (any opaque colour); it is projected onto the boards and printed 藍鼠
   * (multiply) through plate P4, from a small low-res layer (its smooth
   * upscale is the penumbra). opts: baseY, len (1), alpha (0.55),
   * bbox [x0,y0,x1,y1] of the CASTER (strongly recommended: bounds the work),
   * res (0.5), color.
   */
  SA.castShadow = (ctx, T, draw, opts = {}) => {
    const baseY = opts.baseY == null ? G.seatY : opts.baseY;
    const len = opts.len == null ? 1 : opts.len;
    const bb = opts.bbox || [0, 0, W, baseY];
    const hMax = Math.max(0, baseY - bb[1]);
    // the projected region on the boards
    const x0 = Math.floor(bb[0] - 0.62 * len * hMax) - 4, x1 = Math.ceil(bb[2]) + 4;
    const y0 = baseY - 4, y1 = Math.ceil(baseY + 0.24 * len * hMax + Math.max(0, bb[3] - baseY)) + 4;
    const k = ctx.canvas.width / W;
    const res = opts.res == null ? 0.5 : opts.res;
    const sc = k * res;
    const w = Math.max(1, Math.ceil((x1 - x0) * sc)), h = Math.max(1, Math.ceil((y1 - y0) * sc));
    const bw = Math.ceil(w / 64) * 64, bh = Math.ceil(h / 64) * 64, key = `cast|${bw}x${bh}`;
    let b = bufs[key];                                          // size a pure function of the request (determinism)
    if (!b) {
      b = bufs[key] = B.canvas(bw, bh);
      const lru = bufs.lru || (bufs.lru = []);
      lru.push(key);
      if (lru.length > 6) delete bufs[lru.shift()];
    }
    const c = b.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, b.width, b.height);
    c.setTransform(new DOMMatrix([sc, 0, 0, sc, -x0 * sc, -y0 * sc]).multiply(SA.shadowMatrix(baseY, len)));
    c.fillStyle = AINEZU;
    draw(c);
    // one flat ink
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = opts.color || AINEZU;
    c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'source-over';
    PRINT.with(ctx, 'P4', T, (cc) => {
      cc.globalCompositeOperation = 'multiply';
      cc.globalAlpha *= opts.alpha == null ? 0.55 : opts.alpha;
      cc.imageSmoothingEnabled = true;
      cc.imageSmoothingQuality = 'medium';
      cc.drawImage(b, 0, 0, w, h, x0, y0, w / sc, h / sc);
    });
  };

  /** Build the flattened snapshots of a shot's layers ahead of time (call from a scene's init). */
  TSUKI.SHOTS.warmFlat = TSUKI.SHOTS.warmFlat || ((id, T, k, layers) => {
    try {
      const cv = B.canvas(Math.round(W * k), Math.round(H * k));
      const cx = cv.getContext('2d');
      cx.setTransform(k, 0, 0, k, 0, 0);
      const shot = PRINT.shot(id);
      for (const l of layers || Object.keys(shot.layers)) TSUKI.SHOTS.printFlat(cx, T, id, l, {});
    } catch (e) { /* warming is only an optimisation */ }
  });
})(window.TSUKI = window.TSUKI || {});
