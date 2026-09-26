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
   Everything lives in TSUKI.SHOTS.A (js/shots/shot-a.js); this scene adds the
   two cameras — the poster frame (the print cut close on the disc 16.5–22.4:
   in on the first note of the 縁 motif, out on the first counting pluck) and
   the theft's close print (cut in at 32.0, back wide on the gust at 35.0) — and
   序's title panels, carried until 16.0.
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const U = TSUKI.U;

  /**
   * お月見泥棒 (33.0–34.2), the second close print of 一 (cut like the poster
   * frame, never a camera travelling past the moon): a hard cut in on the engawa
   * at 32.0 — the print seen 1.6× about (1040,690) — on the action, the child
   * halfway along her creep to the 三方 (31.4–32.35), the haiku just gone from
   * the sky; held, breathing in to 1.68 with her, while the
   * small arm takes the top dango, たけ turns her face to the moon (off frame, to
   * the left) pretending not to see, and the child climbs up and lands on her
   * knees (34.7–35.05); a hard cut back to the whole garden on the gust (35.0,
   * TSUKI.CUES.gusts) — the moon she was looking at is simply there, whole, as
   * the field bends. At 1.6× and closer the disc is wholly outside the frame, so
   * no frame of 一 ever shows the one moon cut by the frame's edge (an eased
   * lean-in or pull-back would drag it across the edge half cut). (A.drawGarden's
   * zoom: the carved layers scaled as one impression, the near live things —
   * figures, dango, susuki — redrawn under the camera.)
   */
  const THIEF = { about: [1040, 690], k: 1.6, breath: 0.08, in: 32.0 };
  const thiefOut = () => {
    const g = (TSUKI.CUES && TSUKI.CUES.gusts) || [];
    return g.find((t) => t > 34.9 && t < 35.6) || 35.0;
  };
  const thiefZoom = (T) => {
    const out = thiefOut();
    if (T < THIEF.in || T >= out) return 1;
    return THIEF.k + THIEF.breath * U.ease.inOutSine(U.seg(T, THIEF.in, out));
  };

  TSUKI.scene('tsuki-no-de', {
    init(S) {
      // the stage scratch for the thief's zoom and the push to the shoji, before the first frame needs it
      const A = TSUKI.SHOTS.A;
      if (A.warmBuffers) A.warmBuffers(S.k || 1);
      // the close print of the poster frame (16.5–22.4), carved before the first frame needs it
      if (A.warmPoster) A.warmPoster(S.k || 1);
    },
    draw(ctx, t, S) {
      const T = S.seg.start + t;
      const A = TSUKI.SHOTS.A;
      // 序's full-frame caches are done with
      if (T >= 14 && A.releaseJo) A.releaseJo();
      // the poster frame carved for this backing size before its cut (a resize re-carves it here, not at 16.5)
      if (T < 16.45 && A.keepPoster) A.keepPoster(ctx);
      const z = thiefZoom(T), poster = A.posterK && A.posterK(T) > 1;
      A.drawGarden(ctx, T, poster ? { poster: true } : z > 1.0005 ? { zoom: { k: z, about: THIEF.about } } : undefined);
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
