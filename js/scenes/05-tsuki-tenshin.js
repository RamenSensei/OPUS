/* ==========================================================================
   05-tsuki-tenshin.js — 四 月天心 (90–118).
   Shot D: the enormous blank moon; the Jataka of the rabbit plays on its
   face; the smoke settles into the maria (106); ぺったん from 106.4.
   108–111: the tilt down to earth — the Shot D sky slides up by 1080e,
   Shot A slides in from below by 1080(1−e), and the ONE moon is drawn once
   on top of both masters, travelling from Shot D's (960,430) r 260 to
   MOON.A(111), its halo fading. Shot D's susuki (its bottom edge) leave
   first (108.2–108.8), before they could hang in Shot A's sky. The join is
   never seen: a 180 px 紺 bokashi is printed across it, and crisp
   suyari-gasumi ride it — behind the moon (nothing touches the moon), the
   one right of the Buson pocket staying to the end. The pestle keeps
   striking; only its sound fades. From 111: Shot A (SHOTS.A.drawGarden),
   where たけ gives 小夜 her dango and the child falls asleep in her lap (the
   figure tables live in shot-a.js).
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const U = TSUKI.U, B = TSUKI.B, C = TSUKI.C;
  const PRINT = TSUKI.PRINT, MOON = TSUKI.MOON;
  const E = U.ease;
  const TILT = [108.0, 111.0];

  /** The 月暈, live (Shot D's P7 halo plate at any radius: TSUKI.SHOTS.D.haloBand). */
  function haloRing(ctx, x, y, R, a, T) {
    if (a <= 0.004) return;
    PRINT.with(ctx, 'P7', T, (c) => TSUKI.SHOTS.D.haloBand(c, x, y, R, a));
  }

  /** Shot A at T, with or without its own moon (fallback: a night sky if A isn't carved). */
  function garden(ctx, T, opts) {
    const A = TSUKI.SHOTS.A;
    if (A && A.drawGarden && PRINT.has('A')) { A.drawGarden(ctx, T, opts); return; }
    // graceful stand-in until Shot A exists: a night sky over a dark field
    B.sky(ctx, [[0, U.mix(C.bero, C.sumi, 0.35)], [0.55, C.bero], [0.62, C.kon], [1, U.mix(C.kon, C.sumi, 0.4)]]);
    if (!opts || opts.moon !== false) {
      const m = MOON.A(T);
      MOON.draw(ctx, m.x, m.y, m.r, T, { halo: 0.35, haloR: m.r * 1.9 });
    }
  }

  /* ---- すやり霞 on the seam: crisp flat 胡粉 bands ----------------------- */
  /*
   * Cut as the engine's kasumi transition cuts them (and Shot A's mist):
   * one flat 胡粉 impression per band, a hard top edge carrying a short
   * bokashi of the deeper ink, the lower edge wiped a little (a bottom
   * bokashi, never feathered all round), the ends elongated half-ovals with
   * the nose a little above mid-height — and some bands stepped by a second,
   * thinner bar laid along one edge, the emaki way.
   */
  const MIST = [
    // x at e = 0 → 1, length, dy from the seam, height, alpha, and the stepped bar
    // [its left nose, right nose (relative to the main bar's), height ×, below?].
    // The Buson poem writes at x ≈ 1150–1400 from 110.0: the left bands end
    // before it, the right one starts after it, so none has to leave early.
    { x: [-240, -160], w: 1300, dy: -70, h: 52, a: 0.84, step: [150, -300, 0.5, true] },
    { x: [1560, 1500], w: 900, dy: -18, h: 40, a: 0.76, step: [-70, 0, 0.55, false] },
    { x: [140, 200], w: 960, dy: 34, h: 30, a: 0.66, step: null },
  ];
  /** The seam's bokashi: the mid-tone between Shot D's foot (紺) and Shot A's head. */
  const SEAM = { h: 180, col: U.mix(C.kon, C.koiai, 0.35) };
  let mistSpr = null;
  /** One stepped suyari band, carved at k device px per logical px. */
  function mistSprite(m, k) {
    const parts = [{ x0: 0, x1: m.w, top: 0, h: m.h }];
    if (m.step) {
      const [dl, dr, hk, below] = m.step, sh = m.h * hk;
      parts.push({ x0: dl, x1: m.w + dr, top: below ? m.h - sh * 0.42 : -sh * 0.58, h: sh });
    }
    const L = Math.min(...parts.map((q) => q.x0)), R = Math.max(...parts.map((q) => q.x1));
    const T0 = Math.min(...parts.map((q) => q.top)), B0 = Math.max(...parts.map((q) => q.top + q.h));
    const pad = 2, W = Math.ceil((R - L) * k) + pad * 2, H = Math.ceil((B0 - T0) * k) + pad * 2;
    const cv = B.canvas(W, H), c = cv.getContext('2d');
    c.setTransform(k, 0, 0, k, pad - L * k, pad - T0 * k);
    c.beginPath();
    for (const q of parts) {
      const x0 = q.x0, x1 = q.x1, t = q.top, b = q.top + q.h, hh = q.h;
      const cl = hh * 1.75, cr = hh * 1.45, xl = x0 + cl, xr = x1 - cr;
      c.moveTo(xl, t);
      c.lineTo(xr, t);
      c.bezierCurveTo(xr + cr * 0.52, t, x1, t + hh * 0.24, x1, t + hh * 0.52);
      c.bezierCurveTo(x1, t + hh * 0.8, xr + cr * 0.5, b, xr, b);
      c.lineTo(xl, b);
      c.bezierCurveTo(xl - cl * 0.5, b, x0, t + hh * 0.86, x0, t + hh * 0.45);
      c.bezierCurveTo(x0, t + hh * 0.12, xl - cl * 0.6, t, xl, t);
      c.closePath();
    }
    // flat 胡粉; the top edge carries a short bokashi of the deeper ink
    const deep = U.mix(C.gofun, C.kinari, 0.6);
    const g = c.createLinearGradient(0, T0, 0, B0);
    g.addColorStop(0, deep);
    g.addColorStop(Math.min(0.2, 5 / (B0 - T0)), U.mix(deep, C.gofun, 0.5));
    g.addColorStop(Math.min(0.4, 12 / (B0 - T0)), C.gofun);
    g.addColorStop(1, C.gofun);
    c.fillStyle = g;
    c.fill('nonzero');
    // the lower edge wiped a little
    c.globalCompositeOperation = 'destination-in';
    const w = c.createLinearGradient(0, T0, 0, B0);
    w.addColorStop(0, 'rgba(0,0,0,1)');
    w.addColorStop(0.62, 'rgba(0,0,0,1)');
    w.addColorStop(1, 'rgba(0,0,0,0.45)');
    c.fillStyle = w;
    c.fillRect(L - 4, T0 - 4, R - L + 8, B0 - T0 + 8);
    return { cv, ox: L - pad / k, oy: T0 - pad / k, w: W / k, h: H / k };
  }
  function mistSprites(k) {
    if (mistSpr && Math.abs(mistSpr.k - k) / k < 0.01) return mistSpr;
    mistSpr = MIST.map((m) => mistSprite(m, k));
    mistSpr.k = k;
    return mistSpr;
  }

  function tilt(ctx, T, S) {
    const SD = TSUKI.SHOTS.D;
    const e = E.inOutSine(U.seg(T, TILT[0], TILT[1]));
    // whole device pixels: the two masters slide without resampling
    const kk = ctx.getTransform().d || 1;
    const up = Math.round(-1080 * e * kk) / kk, dn = 1080 + up;
    // the ONE moon's path (drawn last), and its 月暈 — printed as part of the
    // sky: under Shot D's ichimonji, under the seam's bokashi and the mist
    const a = MOON.A(TILT[1]);
    const x = U.lerp(SD.MOON.x, a.x, e), y = U.lerp(SD.MOON.y, a.y, e), r = U.lerp(SD.MOON.r, a.r, e);
    const halo = { x, y, R: SD.MOON.haloR * (r / SD.MOON.r), a: 1 - e };
    // Shot D's sky slides up (no moon: it travels on its own; no susuki yet)
    if (dn > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, 1920, Math.ceil(dn) + 1);
      ctx.clip();
      SD.frame(ctx, T, S, { dy: up, moon: false, susuki: false, halo });
      ctx.restore();
    }
    // Shot A slides in from below (the 月暈's lower part carries on over it)
    if (dn < 1080) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, Math.floor(dn), 1920, 1080 - Math.floor(dn));
      ctx.clip();
      ctx.save();
      ctx.translate(0, dn);
      garden(ctx, T, { moon: false, camera: false });
      ctx.restore();
      if (y + halo.R * 1.2 > dn) haloRing(ctx, x, y, halo.R, halo.a, T);
      ctx.restore();
    }
    // Shot D's susuki (its bottom edge) leave before the join can carry them into Shot A's sky
    const sa = 1 - U.smoothstep(108.2, 108.8, T);
    if (dn > 0 && sa > 0) PRINT.with(ctx, 'K', T, (c) => SD.susuki(c, T, up, sa));
    // the join is never seen: a 紺 bokashi printed across it (P6, the sky block);
    // it comes in as the join rises from the bottom edge, and its lower half
    // shrinks as the join reaches the top, so it is gone at 111
    const seamIn = U.smoothstep(0, 0.04, e);
    if (dn > 0 && seamIn > 0) {
      const h0 = SEAM.h / 2, h1 = Math.min(h0, dn);
      PRINT.with(ctx, 'P6', T, (c) => {
        c.globalAlpha *= seamIn;
        const g = c.createLinearGradient(0, dn - h0, 0, dn + h1);
        const m = h0 / (h0 + h1);
        g.addColorStop(0, U.rgba(SEAM.col, 0));
        g.addColorStop(m * 0.45, U.rgba(SEAM.col, 0.55));
        g.addColorStop(m, U.rgba(SEAM.col, 1));
        g.addColorStop(m + (1 - m) * 0.55, U.rgba(SEAM.col, 0.55));
        g.addColorStop(1, U.rgba(SEAM.col, 0));
        c.fillStyle = g;
        c.fillRect(0, dn - h0, 1920, h0 + h1);
      });
    }
    // crisp suyari-gasumi ride the seam — printed before the moon, which is a hole over them
    if (e > 0.001 && e < 0.999) {
      const k = Math.min(1, Math.sin(Math.PI * e) * 2.2);
      const spr = mistSprites(ctx.getTransform().a);
      PRINT.with(ctx, 'P7', T, (c) => {
        MIST.forEach((m, i) => {
          const al = m.a * k;
          if (al <= 0.003) return;
          c.save();
          c.globalAlpha *= al;
          const sp = spr[i];
          c.drawImage(sp.cv, U.lerp(m.x[0], m.x[1], e) + sp.ox, dn + m.dy + sp.oy, sp.w, sp.h);
          c.restore();
        });
      });
    }
    // the ONE moon, drawn once on top of both masters and everything between them;
    // Shot D's 月暈 (printed with the skies above) hands over to Shot A's halo (0.35, 1.9 r)
    MOON.draw(ctx, x, y, r, T, { halo: 0.35 * e, haloR: r * 1.9, maria: 0 });
    MOON.maria(ctx, x, y, r, 0.22, C.sumi, { pestle: SD.pestle(T) });
  }

  /**
   * From 114 the child sleeps in たけ's lap: through Shot A's documented
   * opts.sayo override, her okappa head is laid clear of たけ's hand, on
   * her knees, instead of hidden under her arm (the sleep pose of shot-a.js
   * shifted 10 px toward the offerings).
   */
  function gardenOpts(T) {
    const o = { camera: false };
    const A = TSUKI.SHOTS.A;
    if (A && A.sayo && T >= 114) {
      const st = A.sayo(T);
      if (st && st.pose === 'sleep') o.sayo = Object.assign({}, st, { x: st.x - 10 });
    }
    return o;
  }

  TSUKI.scene('tsuki-tenshin', {
    init(S) {
      TSUKI.SHOTS.D.warm(Math.round(1920 * S.k), Math.round(1080 * S.k));
      mistSprites(S.k);
    },
    draw(ctx, t, S) {
      const T = S.seg.start + t;
      const SD = TSUKI.SHOTS.D;
      ctx.save();
      // every cache here is carved at (or near) the stage resolution: plain bilinear blits
      ctx.imageSmoothingQuality = 'low';
      if (T < TILT[0]) SD.frame(ctx, T, S);
      else if (T < TILT[1]) tilt(ctx, T, S);
      else garden(ctx, T, gardenOpts(T));
      ctx.restore();
    },
  });
})(window.TSUKI);
