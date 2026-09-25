/* ==========================================================================
   02-tsuki-no-de.js — 一　月の出 (14–40): moonrise over the garden (初摺).
   Continues 序's last frame exactly (same moon, same gust on t_abs). The dry
   half-disc lifts: a huge 山吹 moon; 小夜 with a sheaf taller than herself
   crosses it (POSTER, 21.0); the fox's two glints (20–22); she runs the pond's
   rim while たけ builds the 三方 (fifteen dango, one per koto pluck, 22.4–29.4);
   衣かつぎ steam (29.5); flowers in the jug (30.5); お月見泥棒 (33.0) and
   たけ turning to the moon (33.6); the child sits beside her (34.2); the andon
   is blown out (37.0); a slow push toward the shoji (38–40); the sōzu tips
   (39.8) — KON, the cut at 40.0.
   Everything lives in TSUKI.SHOTS.A (js/shots/shot-a.js); this scene adds only
   序's title panels, carried until 16.0.
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const U = TSUKI.U;

  TSUKI.scene('tsuki-no-de', {
    draw(ctx, t, S) {
      const T = S.seg.start + t;
      const A = TSUKI.SHOTS.A;
      A.drawGarden(ctx, T);
      // 序's 短冊, 色紙 and 縁 seal: held, then fading with the DOM title (14.4–16.0)
      if (T < 16 && A.titlePanels) {
        const k = A.push(T);
        ctx.save();
        if (k !== 1) { ctx.translate(1180, 630); ctx.scale(k, k); ctx.translate(-1180, -630); }
        A.titlePanels(ctx, T, 1 - U.ease.inSine(U.seg(T, 14.4, 16.0)));
        ctx.restore();
      }
    },
  });
})(window.TSUKI = window.TSUKI || {});
