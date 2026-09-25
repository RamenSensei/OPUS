/* 03-kage-e-taketori.js — 二 影絵・竹取 (40–66). WIP */
(function (TSUKI) {
  'use strict';
  const { U, B, C } = TSUKI;
  const SB = TSUKI.SHOTS.B;
  TSUKI.scene('kage-e-taketori', {
    draw(ctx, t, S) {
      const T = S.seg.start + t;
      SB.draw(ctx, T, {
        between: {
          sky: (c) => SB.moonInWindow(c, T),
          paper: (c) => SB.light(c, T),
          tokonoma: (c) => SB.tokonomaShade(c, T, 0.45),
        },
      });
    },
  });
})(window.TSUKI);
