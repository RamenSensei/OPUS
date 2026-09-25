/* ==========================================================================
   05-tsuki-tenshin.js — 四 月天心 (90–118).
   Shot D: the enormous blank moon; the Jataka of the rabbit plays on its
   face; the smoke settles into the maria (106); ぺったん from 106.4.
   108–111: the tilt down to earth — the Shot D sky slides up by 1080e,
   Shot A slides in from below by 1080(1−e), and the ONE moon is drawn once
   on top of both masters, travelling from Shot D's (960,430) r 260 to
   MOON.A(111), its halo fading. Shot D's susuki (its bottom edge) leave
   first (108.2–108.8), before they could hang in Shot A's sky. The join is
   never seen: a 180 px 紺 bokashi is printed across it, and soft
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
  const TAU = Math.PI * 2;
  const E = U.ease;
  const TILT = [108.0, 111.0];

  /** The 月暈 ring, live (matches Shot D's P7 halo plate at scale 1). */
  function haloRing(ctx, x, y, R, a, T) {
    if (a <= 0.004) return;
    PRINT.with(ctx, 'P7', T, (c) => {
      c.save();
      c.globalAlpha *= a;
      c.translate(x, y);
      const w = 46 * (R / 420);
      const band = c.createRadialGradient(0, 0, R - w, 0, 0, R);
      band.addColorStop(0, U.rgba(C.gofun, 0));
      band.addColorStop(0.8, U.rgba(C.gofun, 0.08));
      band.addColorStop(1, U.rgba(C.gofun, 0.02));
      c.fillStyle = band;
      c.beginPath();
      c.arc(0, 0, R, 0, TAU);
      c.arc(0, 0, R - w, 0, TAU, true);
      c.fill();
      c.strokeStyle = U.rgba(C.gofun, 0.18);
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, R, 0, TAU);
      c.stroke();
      c.restore();
    });
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

  /* ---- すやり霞 on the seam: flat 胡粉 bands, soft top and bottom -------- */
  const MIST = [
    // x0, x1 (at e = 0 → 1), width, dy from the seam, height, alpha, seed.
    // The Buson poem writes at x ≈ 1150–1400 from 110.0: the left bands end
    // before it, the right one starts after it, so none has to leave early.
    { x: [-240, -160], w: 1300, dy: -76, h: 82, a: 0.56, seed: 41 },
    { x: [1560, 1500], w: 900, dy: -22, h: 64, a: 0.5, seed: 43 },
    { x: [140, 200], w: 980, dy: 32, h: 50, a: 0.42, seed: 47 },
  ];
  /** The seam's bokashi: the mid-tone between Shot D's foot (紺) and Shot A's head. */
  const SEAM = { h: 180, col: U.mix(C.kon, C.koiai, 0.35) };
  let mistSpr = null;
  function mistSprites(k) {
    if (mistSpr && Math.abs(mistSpr.k - k) / k < 0.1) return mistSpr;
    mistSpr = MIST.map((m) => {
      const q = k, W = Math.ceil(m.w * q), H = Math.ceil(m.h * q);
      const cv = B.canvas(W, H), c = cv.getContext('2d');
      const r = U.rng(m.seed), rad = H / 2;
      // a capsule with gently irregular long edges and round ends
      const top = [], bot = [], N = 14;
      for (let i = 0; i <= N; i++) {
        const px = rad + (W - 2 * rad) * (i / N);
        top.push([px, H * 0.08 * r()]);
        bot.push([px, H - H * 0.08 * r()]);
      }
      c.beginPath();
      c.moveTo(top[0][0], top[0][1] + 1);
      for (const p of top) c.lineTo(p[0], p[1] + 1);
      c.arc(W - rad, rad, rad * 0.98, -Math.PI / 2, Math.PI / 2);
      for (let i = bot.length - 1; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1] - 1);
      c.arc(rad, rad, rad * 0.98, Math.PI / 2, Math.PI * 1.5);
      c.closePath();
      c.fillStyle = C.gofun;
      c.fill();
      // bokashi: soft into the top, softer out of the bottom — no hard edge
      c.globalCompositeOperation = 'destination-in';
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(0,0,0,0.15)');
      g.addColorStop(0.3, 'rgba(0,0,0,1)');
      g.addColorStop(0.55, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      const hg = c.createLinearGradient(0, 0, W, 0);
      hg.addColorStop(0, 'rgba(0,0,0,0)');
      hg.addColorStop(0.06, 'rgba(0,0,0,1)');
      hg.addColorStop(0.94, 'rgba(0,0,0,1)');
      hg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = hg;
      c.fillRect(0, 0, W, H);
      return cv;
    });
    mistSpr.k = k;
    return mistSpr;
  }

  function tilt(ctx, T, S) {
    const SD = TSUKI.SHOTS.D;
    const e = E.inOutSine(U.seg(T, TILT[0], TILT[1]));
    // whole device pixels: the two masters slide without resampling
    const kk = ctx.getTransform().d || 1;
    const up = Math.round(-1080 * e * kk) / kk, dn = 1080 + up;
    // Shot D's sky slides up (no moon: it travels on its own; no susuki yet)
    if (dn > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, 1920, Math.ceil(dn) + 1);
      ctx.clip();
      SD.frame(ctx, T, S, { dy: up, moon: false, susuki: false, haloAlpha: 0 });
      ctx.restore();
    }
    // Shot A slides in from below
    if (dn < 1080) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, Math.floor(dn), 1920, 1080 - Math.floor(dn));
      ctx.clip();
      ctx.translate(0, dn);
      garden(ctx, T, { moon: false, camera: false });
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
    // soft suyari-gasumi ride the seam — printed before the moon, which is a hole over them
    if (e > 0.001 && e < 0.999) {
      const k = Math.min(1, Math.sin(Math.PI * e) * 2.2);
      const spr = mistSprites(ctx.getTransform().a);
      PRINT.with(ctx, 'P7', T, (c) => {
        MIST.forEach((m, i) => {
          const al = m.a * k;
          if (al <= 0.003) return;
          c.save();
          c.globalAlpha *= al;
          c.drawImage(spr[i], U.lerp(m.x[0], m.x[1], e), dn + m.dy, m.w, m.h);
          c.restore();
        });
      });
    }
    // the ONE moon, drawn once on top of both masters and everything between them
    const a = MOON.A(TILT[1]);
    const x = U.lerp(SD.MOON.x, a.x, e), y = U.lerp(SD.MOON.y, a.y, e), r = U.lerp(SD.MOON.r, a.r, e);
    haloRing(ctx, x, y, SD.MOON.haloR * (r / SD.MOON.r), 1 - e, T);
    // its own halo eases from Shot D's (0.25, r 380) to Shot A's (0.35, 1.9 r)
    MOON.draw(ctx, x, y, r, T, { halo: U.lerp(0.25, 0.35, e), haloR: U.lerp(380 * (r / SD.MOON.r), r * 1.9, e), maria: 0 });
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
