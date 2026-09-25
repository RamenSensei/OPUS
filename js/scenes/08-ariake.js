/* ==========================================================================
   08-ariake.js — 七 有明 (T 190–206, Shot B in the 後摺)

   The same room sixty years on, pulled from the worn blocks ('B7'): no andon,
   no scroll — only the darker, unfaded rectangle where it hung; a torn cell
   lets a coin of moonlight fall on the tatami; panel 3 is slid open onto the
   pre-dawn engawa. There 小夜, sixty-six, sits with her back to us in the
   波兎 haori and lights incense: a straight thread of smoke at x 1180 that
   points at the low pale moon and stops short of it (224 → 114 px). She
   dozes; a fox's shadow rises on panel 4 and its 墨 paw takes the top dango;
   she wakes, sees — and, as たけ did, turns her face to the moon and pretends
   not to see. Her haiku writes itself on the dark wall (DOM).

   191 the incense lit; the thread grows 191–194   193–196.5 two slow nods
   195 glints round the stile, the fox's shadow rises   195.2–196 the paw
   196 the top dango gone (14 remain)   196.2 glints off, the shadow sinks
   196.5 she wakes and turns to the stand   197.5 she turns to the moon
   204–206 a slow push-in on the thread (1.00 → 1.04 about (1180,700))
   206 match-cut: the thread → Fuji's snow gully on the same axis.

   No warm colour: the only warm spot is the hand-applied 退紅 strip on the
   jug (drawn outside the P2 block, which is gone in the 後摺).
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const { U, B, C, CAST, PRINT, MOON } = TSUKI;
  const SB = TSUKI.SHOTS.B;
  const G = SB.GEOM;
  const E = U.ease;
  const AINEZU = SB.INK.AINEZU;
  const TAIKO = C.toki;                               // 退紅: the faded heko-obi

  const SAYO = { x: 1098, y: 941, s: 1.07 };
  const BURNER = { x: 1180, y: 905 };
  const STAND = { x: 1236, y: 934 };                  // the 三方 (the jug stands just right of it)
  const JUG = { x: 1270, y: 934 };

  /** the moon of the 有明: art-directed inside the opening, descending */
  function moon(T) {
    const u = U.clamp((T - 190) / 16);
    return { x: U.lerp(1160, 1195, u), y: U.lerp(360, 470, u), r: 56 };
  }

  /* ------------------------------------------------------------------ */
  /* incense                                                             */
  /* ------------------------------------------------------------------ */
  function incense(c, T) {
    // the burner (鼠 glaze) with a faint ember (no warm colour: 胡粉 / 銀鼠)
    PRINT.with(c, 'P4', T, (k) => {
      k.fillStyle = U.mix(C.nezumi, C.sumi, 0.2);
      k.beginPath();
      k.moveTo(BURNER.x - 16, BURNER.y - 14); k.lineTo(BURNER.x + 16, BURNER.y - 14);
      k.quadraticCurveTo(BURNER.x + 17, BURNER.y + 2, BURNER.x + 9, BURNER.y + 6);
      k.lineTo(BURNER.x - 9, BURNER.y + 6);
      k.quadraticCurveTo(BURNER.x - 17, BURNER.y + 2, BURNER.x - 16, BURNER.y - 14);
      k.closePath(); k.fill();
      k.fillStyle = U.mix(C.ginnezu, C.gofun, 0.3);
      k.beginPath(); k.ellipse(BURNER.x, BURNER.y - 14, 16, 3.2, 0, 0, U.TAU); k.fill();
    });
    PRINT.with(c, 'K', T, (k) => {
      k.strokeStyle = U.rgba(C.sumi, 0.8);
      k.lineWidth = 1.1;
      k.beginPath(); k.ellipse(BURNER.x, BURNER.y - 14, 16, 3.2, 0, 0, U.TAU); k.stroke();
      k.beginPath();
      k.moveTo(BURNER.x - 16, BURNER.y - 14); k.quadraticCurveTo(BURNER.x - 17, BURNER.y + 2, BURNER.x - 9, BURNER.y + 6);
      k.lineTo(BURNER.x + 9, BURNER.y + 6); k.quadraticCurveTo(BURNER.x + 17, BURNER.y + 2, BURNER.x + 16, BURNER.y - 14);
      k.stroke();
      // the stick of incense
      k.strokeStyle = U.rgba(C.sumi, 0.75);
      k.lineWidth = 1.4;
      k.beginPath(); k.moveTo(BURNER.x, BURNER.y - 15); k.lineTo(BURNER.x, BURNER.y - 34); k.stroke();
    });
    const lit = U.seg(T, 190.9, 191.2);
    if (lit <= 0) return;
    const tipY = BURNER.y - 34;
    PRINT.with(c, 'P7', T, (k) => {
      k.globalCompositeOperation = 'lighter';
      const flick = 0.75 + 0.25 * Math.sin(T * 5.1) * Math.sin(T * 2.3 + 1);
      const g = k.createRadialGradient(BURNER.x, tipY, 0, BURNER.x, tipY, 7);
      g.addColorStop(0, U.rgba(C.gofun, 0.8 * lit * flick));
      g.addColorStop(1, U.rgba(C.ginnezu, 0));
      k.fillStyle = g;
      k.fillRect(BURNER.x - 7, tipY - 7, 14, 14);
    });
    // the thread: 薄墨, nearly straight on x 1180, a slight sine curl, fading out by y 640
    const grow = E.outSine(U.seg(T, 191.0, 194.0));
    const top = U.lerp(tipY, 640, grow);
    PRINT.with(c, 'K', T, (k) => {
      const n = 60;
      k.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const y0 = U.lerp(tipY, top, i / n), y1 = U.lerp(tipY, top, (i + 1) / n);
        const u = (tipY - y0) / (tipY - 640);
        const sway = (y) => Math.sin((tipY - y) * 0.035 - T * 0.9) * 2.2 * U.smoothstep(0, 1, (tipY - y) / 260) + U.wobble((tipY - y) * 0.01 + T * 0.2, 17) * 1.4;
        const a = 0.35 * (1 - U.smoothstep(0.6, 1, u)) * Math.min(1, grow * 4);
        if (a <= 0.004) continue;
        k.strokeStyle = U.rgba(C.sumi, a);
        k.lineWidth = U.lerp(1.5, 1.1, u);
        k.beginPath();
        k.moveTo(BURNER.x + sway(y0), y0);
        k.lineTo(BURNER.x + sway(y1), y1);
        k.stroke();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* offerings: the 三方 with fifteen dango (then fourteen), the jug     */
  /* ------------------------------------------------------------------ */
  function offerings(c, T) {
    const taken = T >= 196.0;
    const s = 1.0;
    PRINT.with(c, 'P1', T, (k) => {
      k.save();
      k.translate(STAND.x, STAND.y); k.scale(s, s);
      k.fillStyle = U.mix(C.kinari, C.odo, 0.35);
      k.beginPath(); k.moveTo(-24, -22); k.lineTo(24, -22); k.lineTo(21, -17); k.lineTo(-21, -17); k.closePath(); k.fill();
      k.beginPath(); k.moveTo(-17, -17); k.lineTo(17, -17); k.lineTo(20, 0); k.lineTo(-20, 0); k.closePath(); k.fill();
      k.restore();
    });
    PRINT.with(c, 'P7', T, (k) => {
      k.save();
      k.translate(STAND.x, STAND.y); k.scale(s, s);
      const r = 4.4;
      // 9-4-2 seen from the back, the top pair: one is stolen at 196
      const rows = [[3, 0], [2, 1], [taken ? 1 : 2, 2]];
      k.fillStyle = C.gofun;
      for (const [n, kk] of rows) for (let i = 0; i < n; i++) {
        const cx = (i - (n - 1) / 2) * r * 2.05 + (kk === 2 && taken ? -r * 1.02 : 0), cy = -22 - r - kk * r * 1.55;
        k.beginPath(); k.arc(cx, cy, r, 0, U.TAU); k.fill();
      }
      k.restore();
    });
    PRINT.with(c, 'K', T, (k) => {
      k.save();
      k.translate(STAND.x, STAND.y); k.scale(s, s);
      k.strokeStyle = U.rgba(C.sumi, 0.7);
      k.lineWidth = 0.9;
      k.beginPath(); k.moveTo(-24, -22); k.lineTo(24, -22); k.lineTo(21, -17); k.lineTo(-21, -17); k.closePath(); k.stroke();
      k.beginPath(); k.moveTo(-17, -17); k.lineTo(17, -17); k.lineTo(20, 0); k.lineTo(-20, 0); k.closePath(); k.stroke();
      k.fillStyle = U.rgba(C.sumi, 0.7);
      k.beginPath(); k.ellipse(0, -9, 6, 2.6, 0, 0, U.TAU); k.fill();
      k.restore();
    });
    // the jug (鼠) and its susuki (銀鼠 plumes in the late impression)
    const sway = Math.sin(T * 0.7) * 0.5 + U.wobble(T * 0.3, 3) * 0.4;
    PRINT.with(c, 'P4', T, (k) => {
      k.fillStyle = U.mix(C.nezumi, C.sumi, 0.25);
      k.beginPath();
      k.moveTo(JUG.x - 7, JUG.y); k.bezierCurveTo(JUG.x - 16, JUG.y - 6, JUG.x - 16, JUG.y - 26, JUG.x - 6, JUG.y - 31); k.lineTo(JUG.x - 5, JUG.y - 38);
      k.lineTo(JUG.x + 5, JUG.y - 38); k.lineTo(JUG.x + 6, JUG.y - 31); k.bezierCurveTo(JUG.x + 16, JUG.y - 26, JUG.x + 16, JUG.y - 6, JUG.x + 7, JUG.y);
      k.closePath(); k.fill();
      for (const [a0, L] of [[-0.3, 118], [-0.06, 136], [0.16, 124], [0.36, 100]]) {
        const a = a0 + sway * 0.012;
        const tx = JUG.x + Math.sin(a) * L, ty = JUG.y - 37 - Math.cos(a) * L;
        k.strokeStyle = U.mix(C.nezumi, C.sumi, 0.3);
        k.lineWidth = 1.2;
        k.beginPath(); k.moveTo(JUG.x, JUG.y - 37); k.quadraticCurveTo(JUG.x + Math.sin(a) * L * 0.45, JUG.y - 37 - L * 0.6, tx, ty); k.stroke();
        k.strokeStyle = U.rgba(C.ginnezu, 0.95);
        k.lineWidth = 1;
        for (let kk = 0; kk < 8; kk++) {
          const u = kk / 7;
          const px = U.lerp(JUG.x + Math.sin(a) * L * 0.72, tx, u), py = U.lerp(JUG.y - 37 - Math.cos(a) * L * 0.72, ty, u);
          k.beginPath(); k.moveTo(px, py); k.quadraticCurveTo(px + 5, py + 2, px + 8 + kk * 0.5, py + 8); k.stroke();
        }
      }
    });
    PRINT.with(c, 'K', T, (k) => {
      k.strokeStyle = U.rgba(C.sumi, 0.75);
      k.lineWidth = 1;
      k.beginPath();
      k.moveTo(JUG.x - 7, JUG.y); k.bezierCurveTo(JUG.x - 16, JUG.y - 6, JUG.x - 16, JUG.y - 26, JUG.x - 6, JUG.y - 31); k.lineTo(JUG.x - 5, JUG.y - 38);
      k.lineTo(JUG.x + 5, JUG.y - 38); k.lineTo(JUG.x + 6, JUG.y - 31); k.bezierCurveTo(JUG.x + 16, JUG.y - 26, JUG.x + 16, JUG.y - 6, JUG.x + 7, JUG.y);
      k.stroke();
    });
    // the strip of faded heko-obi tying the susuki: hand-applied 退紅, overrunning its line a little (丹絵)
    c.save();
    c.fillStyle = U.rgba(TAIKO, 0.92);
    c.beginPath();
    c.moveTo(JUG.x - 7, JUG.y - 46); c.lineTo(JUG.x + 8, JUG.y - 49); c.lineTo(JUG.x + 9, JUG.y - 44); c.lineTo(JUG.x - 6, JUG.y - 41); c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(JUG.x + 7, JUG.y - 45); c.quadraticCurveTo(JUG.x + 14, JUG.y - 38, JUG.x + 12, JUG.y - 26); c.lineTo(JUG.x + 9, JUG.y - 27); c.quadraticCurveTo(JUG.x + 11, JUG.y - 37, JUG.x + 5, JUG.y - 43); c.closePath();
    c.fill();
    c.restore();
  }

  /* ------------------------------------------------------------------ */
  /* the fox: shadow on panel 4, glints round the stile, a 墨 paw        */
  /* ------------------------------------------------------------------ */
  function foxShadow(c, T) {
    const up = E.outCubic(U.seg(T, 194.9, 195.35)) * (1 - E.inCubic(U.seg(T, 196.2, 196.8)));
    if (up <= 0.001) return;
    const reach = U.env(T, 195.2, 195.8, 195.9, 196.2);
    const b = SB.shadowBuf(c, 'fox');
    SB.softStamp(b, (s2) => {
      CAST.fox(s2, 1452, 968 + (1 - up) * 110, 1.75, { pose: 'steal', reach, facing: -1, silhouette: AINEZU, t: T });
    }, 2.2, [1280, 780, 1640, 1000]);
    c.save();
    SB.paperClip(c, [[1290, 1620]]);
    SB.shadowComposite(c, T, 'fox', { alpha: 0.9 });
    c.restore();
  }
  function foxPaw(c, T) {
    const r = U.env(T, 195.2, 195.8, 195.95, 196.2, E.inOutSine);
    if (r <= 0.001) return;
    // from behind panel 4's stile (x 1290) out to the top dango (1236, 900)
    const x0 = 1292, y0 = 912;
    const tx = U.lerp(x0 + 4, STAND.x + 4, r), ty = U.lerp(y0 + 4, STAND.y - 33, r);
    PRINT.with(c, 'K', T, (k) => {
      k.fillStyle = U.rgba(C.sumi, 0.95);
      B.taper(k, B.qpts(x0 + 8, y0 + 8, (x0 + tx) / 2 + 4, Math.min(y0, ty) - 6, tx, ty, 10), 11, 7, U.rgba(C.sumi, 0.95), 0.1);
      k.beginPath(); k.ellipse(tx - 2, ty + 1, 6, 4.4, 0.3, 0, U.TAU); k.fill();
      // the dango in its grasp as it withdraws
      if (T > 195.9) { k.fillStyle = C.gofun; k.beginPath(); k.arc(tx - 6, ty - 2, 4.2, 0, U.TAU); k.fill(); }
    });
  }
  function foxGlints(c, T) {
    const a = U.env(T, 194.95, 195.2, 196.0, 196.25) * (1 - U.env(T, 195.55, 195.6, 195.66, 195.72) * 0.9);   // one blink
    if (a <= 0.001) return;
    PRINT.with(c, 'P7', T, (k) => {
      for (const x of [1276, 1286]) {
        const g = k.createRadialGradient(x, 902, 0, x, 902, 4.5);
        g.addColorStop(0, U.rgba(C.ginnezu, 0.55 * a));
        g.addColorStop(1, U.rgba(C.ginnezu, 0));
        k.fillStyle = g;
        k.fillRect(x - 5, 897, 10, 10);
        k.fillStyle = U.rgba(C.gofun, 0.9 * a);
        k.beginPath(); k.arc(x, 902, 1.6, 0, U.TAU); k.fill();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* 小夜 at sixty-six (たけ's exact path and pose table, white bun)      */
  /* ------------------------------------------------------------------ */
  function sayo(c, T) {
    // lights incense (191): a small bow toward the burner; dozes 193–196.5 (two nods);
    // wakes 196.5 and turns to the stand; 197.5 turns her face to the moon, head tilted
    const light = U.env(T, 190.6, 190.95, 191.2, 191.8);
    const nod1 = U.env(T, 193.0, 193.9, 194.2, 194.9, E.inOutSine);
    const nod2 = U.env(T, 194.9, 195.7, 196.2, 196.6, E.inOutSine);
    const nod = Math.max(light * 0.35, nod1 * 0.8, nod2 * 0.95);
    const toStand = U.env(T, 196.5, 196.9, 197.3, 197.7, E.inOutSine);
    const toMoon = U.seg(T, 197.5, 198.3, E.inOutSine);
    const look = 0.12 + toStand * 0.75 + toMoon * 0.42;
    const breathe = Math.sin(T * 1.1) * 0.5;
    PRINT.with(c, 'K', T, (k) => {
      CAST.oldSayo(k, SAYO.x, SAYO.y + breathe, SAYO.s, { pose: 'engawa', view: 'back', look, nod: Math.max(0, nod - toMoon * 0.2), t: T });
    });
  }

  /* ------------------------------------------------------------------ */
  TSUKI.scene('ariake', {
    draw(ctx, t, S) {
      const T = S.seg.start + t;
      ctx.imageSmoothingQuality = 'low';
      const e = E.inOutSine(U.seg(T, 204, 206));
      if (e > 0) {
        const s = 1 + 0.04 * e;
        ctx.translate(1180, 700); ctx.scale(s, s); ctx.translate(-1180, -700);
      }
      const m = moon(T);
      SB.draw(ctx, T, {
        id: 'B7',
        between: {
          room: (c) => SB.tokonomaShade(c, T, 0.28),
          outsky: (c) => {
            // the pale moon of the 有明, inside the opening, a hole to the fresh paper
            c.save();
            c.beginPath(); c.rect(G.opening.x0, G.top + 52, G.opening.x1 - G.opening.x0, G.bottom - G.top - 52); c.clip();
            MOON.draw(c, m.x, m.y, m.r, T, { halo: 0.35, haloR: m.r * 1.8, maria: 0.15, fringe: false });
            c.restore();
          },
          outside: (c) => {
            c.save();
            c.beginPath(); c.rect(G.opening.x0, G.top, G.opening.x1 - G.opening.x0 - 14, G.bottom - G.top); c.clip();
            incense(c, T);
            offerings(c, T);
            sayo(c, T);
            foxPaw(c, T);
            foxGlints(c, T);
            c.restore();
          },
          paper: (c) => {
            SB.light(c, T, { x: m.x + 40, y: m.y + 260, r: 170, falloff: 0.42, core: 0.35, ranges: [[G.panels[0][0], G.opening.x0], [G.opening.x1, G.panels[3][1]]] });
            // panel 1 is further from the opening: dimmed by 藍鼠 30%
            PRINT.with(c, 'P4', T, (k) => { k.fillStyle = U.rgba(AINEZU, 0.3); k.fillRect(G.panels[0][0], G.top, G.panels[0][1] - G.panels[0][0], G.bottom - G.top); });
            foxShadow(c, T);
          },
          floor: (c) => {
            // the coin of moonlight through the torn cell, fallen down-left on the tatami
            PRINT.with(c, 'P7', T, (k) => {
              const g = k.createRadialGradient(650, 1010, 0, 650, 1010, 40);
              g.addColorStop(0, U.rgba(C.gofun, 0.42));
              g.addColorStop(0.75, U.rgba(C.gofun, 0.3));
              g.addColorStop(1, U.rgba(C.gofun, 0));
              k.fillStyle = g;
              k.save(); k.translate(650, 1010); k.scale(1, 0.3); k.translate(-650, -1010);
              k.beginPath(); k.arc(650, 1010, 40, 0, U.TAU); k.fill();
              k.restore();
            });
          },
        },
      });
      // the late impression's paper: yellowed and foxed everywhere but the moon
      PRINT.age(ctx, T, { holes: [[m.x, m.y, m.r]] });
    },
  });
})(window.TSUKI);
