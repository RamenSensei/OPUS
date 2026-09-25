/* ==========================================================================
   05-tsuki-tenshin.js — 四 月天心 (90–118).
   Shot D: the enormous blank moon; the Jataka of the rabbit plays on its
   face; the smoke settles into the maria (106); ぺったん from 106.4.
   108–111: the tilt down to earth — the Shot D sky and susuki slide up by
   1080e, Shot A slides in from below by 1080(1−e), a kasumi band rides the
   seam, and the ONE moon is drawn once on top of both, travelling from Shot
   D's (960,430) r 260 to MOON.A(111), its halo fading. From 111: Shot A
   (TSUKI.SHOTS.A.drawGarden), where たけ gives 小夜 her dango and the child
   falls asleep in her lap (the figure tables live in shot-a.js).
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const U = TSUKI.U, B = TSUKI.B, C = TSUKI.C;
  const PRINT = TSUKI.PRINT, MOON = TSUKI.MOON;
  const TAU = Math.PI * 2;
  const E = U.ease;
  const TILT = [108.0, 111.0];

  /** The 月暈 ring, live (matches Shot D's P7 halo plate at scale 1). */
  function haloRing(ctx, x, y, R, a) {
    if (a <= 0.004) return;
    PRINT.with(ctx, 'P7', 108, (c) => {
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

  /** Shot A at T, with or without its own moon (fallback: bare paper + sky if A isn't carved). */
  function garden(ctx, T, opts) {
    const A = TSUKI.SHOTS.A;
    if (A && A.drawGarden && PRINT.has('A')) { A.drawGarden(ctx, T, opts); return; }
    // graceful stand-in until Shot A exists: a night sky over a dark field
    B.sky(ctx, [[0, U.mix(C.bero, C.sumi, 0.35)], [0.55, C.bero], [0.62, C.kon], [1, U.mix(C.kon, C.sumi, 0.4)]]);
    if (!opts || opts.moon !== false) {
      const m = MOON.A(T);
      MOON.draw(ctx, m.x, m.y, m.r, T, { halo: 0.5 });
    }
  }

  function tilt(ctx, T, S) {
    const SD = TSUKI.SHOTS.D;
    const e = E.inOutSine(U.seg(T, TILT[0], TILT[1]));
    const up = -1080 * e, dn = 1080 * (1 - e);
    // Shot D's sky and susuki slide up (no moon: it travels on its own)
    if (dn > 0) SD.frame(ctx, T, S, { dy: up, moon: false, haloAlpha: 0 });
    // Shot A slides in from below
    if (dn < 1080) {
      ctx.save();
      ctx.translate(0, dn);
      garden(ctx, T, { moon: false, camera: false });
      ctx.restore();
    }
    // a kasumi band rides the seam
    if (e > 0.001 && e < 0.999) {
      const k = Math.sin(Math.PI * e);
      const a = Math.min(1, k * 2.4);
      PRINT.with(ctx, 'P7', T, (c) => {
        B.kasumi(c, -260 + 90 * e, dn - 74, 1520, 84, C.gofun, 0.82 * a, { soft: 0.35, fade: 0.45, seed: 41 });
        B.kasumi(c, 700 - 120 * e, dn - 18, 1400, 66, U.mix(C.gofun, C.geppaku, 0.5), 0.72 * a, { soft: 0.4, fade: 0.5, seed: 43 });
        B.kasumi(c, 180 + 40 * e, dn + 34, 1000, 48, C.gofun, 0.55 * a, { soft: 0.45, fade: 0.55, seed: 47 });
      });
    }
    // the ONE moon, drawn once on top of both masters
    const a = MOON.A(TILT[1]);
    const x = U.lerp(SD.MOON.x, a.x, e), y = U.lerp(SD.MOON.y, a.y, e), r = U.lerp(SD.MOON.r, a.r, e);
    haloRing(ctx, x, y, SD.MOON.haloR * (r / SD.MOON.r), 1 - e);
    // the moon's own halo eases from Shot D's (0.75, r 380) to Shot A's (0.35, 1.9 r)
    MOON.draw(ctx, x, y, r, T, { halo: U.lerp(0.75, 0.35, e), haloR: U.lerp(380 * (r / SD.MOON.r), r * 1.9, e), maria: 0 });
    MOON.maria(ctx, x, y, r, 0.22, C.sumi, { pestle: SD.pestle(T) });
  }

  TSUKI.scene('tsuki-tenshin', {
    init(S) { TSUKI.SHOTS.D.warm(Math.round(1920 * S.k), Math.round(1080 * S.k)); },
    draw(ctx, t, S) {
      const T = S.seg.start + t;
      const SD = TSUKI.SHOTS.D;
      if (T < TILT[0]) SD.frame(ctx, T, S);
      else if (T < TILT[1]) tilt(ctx, T, S);
      else garden(ctx, T, { camera: false });
    },
  });
})(window.TSUKI);
