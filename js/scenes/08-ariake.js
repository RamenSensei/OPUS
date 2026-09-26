/* ==========================================================================
   08-ariake.js — 七 有明 (T 190–206, Shot B in the 後摺)

   The same room sixty years on, pulled from the worn blocks ('B7'): no andon,
   no scroll — only the darker, unfaded rectangle where it hung; a torn cell
   lets a coin of moonlight fall on the tatami; panel 3 is slid open onto the
   pre-dawn engawa. There 小夜, sixty-six, sits with her back to us in the
   波兎 haori and lights incense: a straight thread of smoke at x 1180 that
   points at the low pale moon and stops short of it (224 → 114 px). She
   dozes; a fox's head rises in shadow on panel 4, two glints peek round the
   stile and its 墨 paw takes the top dango; she wakes, sees — and, as たけ
   did, turns her face to the moon and pretends not to see. Her haiku writes
   itself on the dark wall (DOM).

   191 the incense lit; the thread grows 191–194   193–196.5 two dozing nods (a slow
       sink, a quick catch; the second held asleep through the theft)
   195 glints round the stile, the fox's head rises   195.2–196.12 the paw (creep,
       hook, snatch)
   196 the top dango gone (14 remain)   196.2 glints off, the head sinks
   196.5 she wakes and turns to the stand   197.5 she turns to the moon
   204–206 a slow push-in on the thread (1.00 → 1.04 about (1180,700))
   206 match-cut: the thread → Fuji's snow gully on the same axis.

   No warm colour: the only warm spot is the hand-applied 退紅 strip on the
   jug (drawn outside the P2 block, which is gone in the 後摺).
   The paper is aged with TSUKI.SHOTS.age (foxing multiplied: it darkens the
   dark wood instead of glittering on it); the moon is painted after it —
   the moon is never old.
   old 小夜 is CAST.oldSayo — たけ's own paths (seiza, view 'back': the 波兎
   haori, the bun and its comb; look = her turn, nod = her doze), hair in
   銀鼠×鼠. Drawn here (not CAST): the fox's head in shadow and its paw, the
   offerings.
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const { U, B, C, CAST, PRINT, MOON } = TSUKI;
  const SB = TSUKI.SHOTS.B;
  const G = SB.GEOM;
  const E = U.ease;
  const AINEZU = SB.INK.AINEZU;
  const TAIKO = C.toki;                               // 退紅: the faded heko-obi

  const SAYO = { x: 1094, y: 944, s: 1.07 };            // CAST.oldSayo back view: ≈160 px kneeling
  const BURNER = { x: 1180, y: 905 };
  const STAND = { x: 1218, y: 934 };                  // the 三方 (the jug stands just right of it)
  const JUG = { x: 1252, y: 934 };
  const OPEN = { x0: G.opening.x0 + 10, x1: G.opening.x1 - 16 };   // the opening between its stiles

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
    const bowl = (k) => {
      k.beginPath();
      k.moveTo(BURNER.x - 16, BURNER.y - 14); k.lineTo(BURNER.x + 16, BURNER.y - 14);
      k.quadraticCurveTo(BURNER.x + 17, BURNER.y + 2, BURNER.x + 9, BURNER.y + 6);
      k.lineTo(BURNER.x - 9, BURNER.y + 6);
      k.quadraticCurveTo(BURNER.x - 17, BURNER.y + 2, BURNER.x - 16, BURNER.y - 14);
      k.closePath();
    };
    PRINT.with(c, 'P4', T, (k) => {
      k.fillStyle = U.mix(C.nezumi, C.sumi, 0.2);
      bowl(k); k.fill();
      k.fillStyle = U.mix(C.ginnezu, C.gofun, 0.3);
      k.beginPath(); k.ellipse(BURNER.x, BURNER.y - 14, 16, 3.2, 0, 0, U.TAU); k.fill();
    });
    PRINT.with(c, 'K', T, (k) => {
      k.strokeStyle = U.rgba(C.sumi, 0.8);
      k.lineWidth = 1.1;
      k.beginPath(); k.ellipse(BURNER.x, BURNER.y - 14, 16, 3.2, 0, 0, U.TAU); k.stroke();
      bowl(k); k.stroke();
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
      const g = k.createRadialGradient(BURNER.x, tipY, 0, BURNER.x, tipY, 6);
      g.addColorStop(0, U.rgba(C.gofun, 0.8 * lit * flick));
      g.addColorStop(1, U.rgba(C.ginnezu, 0));
      k.fillStyle = g;
      k.fillRect(BURNER.x - 6, tipY - 6, 12, 12);
    });
    // the thread: ONE continuous 薄墨 line on x 1180, a slight sine curl, fading out by y 640
    const grow = E.outSine(U.seg(T, 191.0, 194.0));
    const top = U.lerp(tipY, 640, grow);
    const sway = (y) => {
      const h = tipY - y;
      return Math.sin(h * 0.035 - T * 0.9) * 2.2 * U.smoothstep(0, 1, h / 260) + U.wobble(h * 0.01 + T * 0.2, 17) * 1.2 * U.smoothstep(0, 1, h / 80);
    };
    PRINT.with(c, 'K', T, (k) => {
      const n = 48;
      k.beginPath();
      for (let i = 0; i <= n; i++) {
        const y = U.lerp(tipY, top, i / n);
        if (i === 0) k.moveTo(BURNER.x + sway(y), y); else k.lineTo(BURNER.x + sway(y), y);
      }
      const g = k.createLinearGradient(0, tipY, 0, 640);
      const a = 0.48 * Math.min(1, grow * 4);
      g.addColorStop(0, U.rgba(C.sumi, a));
      g.addColorStop(0.55, U.rgba(C.sumi, a * 0.9));
      g.addColorStop(1, U.rgba(C.sumi, 0));
      k.strokeStyle = g;
      k.lineCap = 'butt';
      k.lineJoin = 'round';
      k.lineWidth = 1.9;
      k.stroke();
      // a faint 胡粉 edge on its moon side: smoke catches the light, the grass does not
      k.globalCompositeOperation = 'lighter';
      k.translate(1.1, 0);
      const g2 = k.createLinearGradient(0, tipY, 0, 640);
      g2.addColorStop(0, U.rgba(C.gofun, 0.14 * Math.min(1, grow * 4)));
      g2.addColorStop(1, U.rgba(C.gofun, 0));
      k.strokeStyle = g2;
      k.lineWidth = 0.9;
      k.stroke();
    });
  }

  /* ------------------------------------------------------------------ */
  /* offerings: the 三方 with fifteen dango (then fourteen), the jug     */
  /* ------------------------------------------------------------------ */
  function offerings(c, T) {
    const taken = T >= 195.95;                       // (the paw closes on it at 195.95)
    PRINT.with(c, 'P1', T, (k) => {
      k.save();
      k.translate(STAND.x, STAND.y);
      k.fillStyle = U.mix(C.kinari, C.odo, 0.35);
      k.beginPath(); k.moveTo(-24, -22); k.lineTo(24, -22); k.lineTo(21, -17); k.lineTo(-21, -17); k.closePath(); k.fill();
      k.beginPath(); k.moveTo(-17, -17); k.lineTo(17, -17); k.lineTo(20, 0); k.lineTo(-20, 0); k.closePath(); k.fill();
      k.restore();
    });
    PRINT.with(c, 'P7', T, (k) => {
      k.save();
      k.translate(STAND.x, STAND.y);
      const r = 4.4;
      // 9-4-2 seen from the back: the top pair — one is stolen at 196
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
      k.translate(STAND.x, STAND.y);
      k.strokeStyle = U.rgba(C.sumi, 0.7);
      k.lineWidth = 0.9;
      k.beginPath(); k.moveTo(-24, -22); k.lineTo(24, -22); k.lineTo(21, -17); k.lineTo(-21, -17); k.closePath(); k.stroke();
      k.beginPath(); k.moveTo(-17, -17); k.lineTo(17, -17); k.lineTo(20, 0); k.lineTo(-20, 0); k.closePath(); k.stroke();
      k.fillStyle = U.rgba(C.sumi, 0.7);
      k.beginPath(); k.ellipse(0, -9, 6, 2.6, 0, 0, U.TAU); k.fill();
      k.restore();
    });
    // the jug (鼠) and its susuki: 銀鼠 plumes in the late impression, leaning away from the thread
    const sway = Math.sin(T * 0.7) * 0.5 + U.wobble(T * 0.3, 3) * 0.4;
    const jug = (k) => {
      k.beginPath();
      k.moveTo(JUG.x - 7, JUG.y); k.bezierCurveTo(JUG.x - 16, JUG.y - 6, JUG.x - 16, JUG.y - 26, JUG.x - 6, JUG.y - 31); k.lineTo(JUG.x - 5, JUG.y - 38);
      k.lineTo(JUG.x + 5, JUG.y - 38); k.lineTo(JUG.x + 6, JUG.y - 31); k.bezierCurveTo(JUG.x + 16, JUG.y - 26, JUG.x + 16, JUG.y - 6, JUG.x + 7, JUG.y);
      k.closePath();
    };
    PRINT.with(c, 'P4', T, (k) => {
      k.fillStyle = U.mix(C.nezumi, C.sumi, 0.25);
      jug(k); k.fill();
      for (const [a0, L] of [[0.08, 118], [0.2, 136], [0.34, 124], [0.5, 100]]) {
        const a = a0 + sway * 0.012;
        const bx = JUG.x, by = JUG.y - 37;
        const tx = bx + Math.sin(a) * L, ty = by - Math.cos(a) * L;
        k.strokeStyle = U.mix(C.nezumi, C.sumi, 0.35);
        k.lineWidth = 1.3;
        k.beginPath(); k.moveTo(bx, by); k.quadraticCurveTo(bx + Math.sin(a) * L * 0.4, by - L * 0.6, tx, ty); k.stroke();
        // the plume: fine drooping strands from the top third
        k.strokeStyle = U.rgba(C.ginnezu, 0.95);
        k.lineWidth = 1;
        for (let kk = 0; kk < 9; kk++) {
          const u = kk / 8;
          const px = U.lerp(bx + Math.sin(a) * L * 0.7, tx, u), py = U.lerp(by - Math.cos(a) * L * 0.7, ty, u);
          k.beginPath(); k.moveTo(px, py); k.quadraticCurveTo(px + 5, py + 1, px + 8 + kk * 0.5, py + 8); k.stroke();
        }
      }
    });
    PRINT.with(c, 'K', T, (k) => { k.strokeStyle = U.rgba(C.sumi, 0.75); k.lineWidth = 1; jug(k); k.stroke(); });
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
  /* the fox: never whole — the head in shadow on panel 4, glints, a paw  */
  /* ------------------------------------------------------------------ */
  function foxShadow(c, T) {
    const up = E.outCubic(U.seg(T, 194.9, 195.4)) * (1 - E.inCubic(U.seg(T, 196.2, 196.8)));
    if (up <= 0.001) return;
    const reach = U.env(T, 195.3, 195.7, 195.95, 196.15);
    // ears and muzzle only, rising from below the bottom rail, looking left toward the stand
    const X = 1372 - 10 * reach, Y = 884 + (1 - up) * 110;
    const b = SB.softLayer(c, 'fox', [1290, 760, 1460, G.bottom], 0.5);
    b.save();
    b.beginPath(); b.rect(1296, 812, 150, G.bottom - 812); b.clip();
    b.translate(X, Y); b.rotate(-0.12 * reach);
    const p = new Path2D();
    p.moveTo(40, 90);                                     // the neck, down and out of the paper
    p.bezierCurveTo(34, 44, 30, 20, 20, 6);
    p.lineTo(24, -30); p.lineTo(12, -8);                  // far ear
    p.lineTo(6, -38); p.lineTo(-4, -10);                  // near ear
    p.bezierCurveTo(-14, -8, -26, -4, -40, 4);            // brow → the long muzzle
    p.lineTo(-58, 10); p.lineTo(-56, 14);                 // the nose
    p.bezierCurveTo(-40, 18, -24, 22, -12, 30);           // jaw
    p.bezierCurveTo(-4, 50, 0, 70, 2, 90);                // throat, down
    p.closePath();
    b.fill(p);
    b.restore();
    SB.softPrint(c, T, 'fox', { alpha: 0.85, ranges: [[1290, 1620]] });
  }
  function foxPaw(c, T) {
    // three movements, not a telescope: it CREEPS low along the boards from behind the stile
    // (195.2–195.6, outSine), LIFTS and hooks over the top dango (195.6–195.8, inOutSine), holds a
    // breath (195.8–195.95), and SNATCHES back in a straight line (195.95–196.12, inQuad) — the pad
    // curls 0.3 rad round the dango as it closes
    if (T < 195.2 || T > 196.12) return;
    const x0 = OPEN.x1 + 2, y0 = 926;
    const low = [STAND.x + 18, 930], hook = [STAND.x + 5, STAND.y - 34];
    let tip, curl = 0, carry = false;
    if (T < 195.6) {
      const u = E.outSine(U.seg(T, 195.2, 195.6));
      tip = [U.lerp(x0 - 4, low[0], u), low[1] + 1.5 * Math.sin(Math.PI * u)];
    } else if (T < 195.95) {
      const u = E.inOutSine(U.seg(T, 195.6, 195.8));
      tip = [U.lerp(low[0], hook[0], u), U.lerp(low[1], hook[1], u) - 4 * Math.sin(Math.PI * u)];
      curl = 0.3 * E.inOutSine(U.seg(T, 195.72, 195.9));
    } else {
      const u = E.inQuad(U.seg(T, 195.95, 196.12));
      tip = [U.lerp(hook[0], x0 + 4, u), U.lerp(hook[1], y0 - 6, u)];
      curl = 0.3; carry = true;
    }
    const tx = tip[0], ty = tip[1];
    // the foreleg from behind the stile: low along the boards, the wrist lifting as it hooks
    const mid = [(x0 + tx) / 2 + 4, Math.max(ty, y0) + 3 - 10 * (y0 - ty > 20 ? 1 : 0)];
    PRINT.with(c, 'K', T, (k) => {
      const pts = B.qpts(x0 + 6, y0 + 2, mid[0], mid[1], tx, ty, 12);
      B.taper(k, pts, 7, 4, U.rgba(C.sumi, 0.95), 0.1);
      // the pad and three toe bumps, curling round the dango
      k.save();
      k.translate(tx, ty); k.rotate(0.3 - curl);
      k.fillStyle = U.rgba(C.sumi, 0.95);
      k.beginPath(); k.ellipse(0, 1, 4.2, 3.4, 0, 0, U.TAU); k.fill();
      for (const [ox, oy] of [[-3.6, -2.6], [-1, -4], [1.8, -3.4]]) { k.beginPath(); k.arc(ox, oy - curl * 3, 1.4, 0, U.TAU); k.fill(); }
      if (carry) { k.fillStyle = C.gofun; k.beginPath(); k.arc(-4, -3, 4.2, 0, U.TAU); k.fill(); k.strokeStyle = U.rgba(C.sumi, 0.6); k.lineWidth = 0.8; k.stroke(); }
      k.restore();
    });
  }
  function foxGlints(c, T) {
    const a = U.env(T, 194.95, 195.2, 196.0, 196.25) * (1 - U.env(T, 195.55, 195.6, 195.66, 195.72) * 0.9);   // one blink
    if (a <= 0.001) return;
    // two eyes peeking round the stile, just inside the opening (銀鼠 halos: no warm colour now)
    PRINT.with(c, 'P7', T, (k) => {
      for (const x of [OPEN.x1 - 13, OPEN.x1 - 3]) {
        const g = k.createRadialGradient(x, 902, 0, x, 902, 4.5);
        g.addColorStop(0, U.rgba(C.ginnezu, 0.6 * a));
        g.addColorStop(1, U.rgba(C.ginnezu, 0));
        k.fillStyle = g;
        k.fillRect(x - 5, 897, 10, 10);
        k.fillStyle = U.rgba(C.gofun, 0.95 * a);
        k.beginPath(); k.arc(x, 902, 1.6, 0, U.TAU); k.fill();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* 小夜 at sixty-six, from behind: CAST.oldSayo — たけ's own paths      */
  /* ------------------------------------------------------------------ */
  /**
   * 舟を漕ぐ: a doze is not a bow. The head sinks slowly (inSine: the weight wins by degrees) and
   * is caught in a jerk (outCubic, ≈0.15 s) that overshoots a little and settles. The second sink
   * goes deeper and stays down, asleep through the theft; the wake jerk is her turn to the stand.
   */
  function dozeNod(T) {
    // first nod: sink 193.0–194.1, catch 194.1–194.28 (to −0.15), settle 194.28–194.63
    let n = 0;
    if (T >= 193.0 && T < 194.1) n = E.inSine(U.seg(T, 193.0, 194.1));
    else if (T >= 194.1 && T < 194.28) n = U.lerp(1, -0.15, E.outCubic(U.seg(T, 194.1, 194.28)));
    else if (T >= 194.28 && T < 194.9) n = U.lerp(-0.15, 0, E.inOutSine(U.seg(T, 194.28, 194.63)));
    // second: sink 194.9–196.2 to 1.15, held asleep to 196.5, the wake jerk 196.5–196.65
    else if (T >= 194.9 && T < 196.5) n = 1.15 * E.inSine(U.seg(T, 194.9, 196.2));
    else if (T >= 196.5 && T < 196.65) n = U.lerp(1.15, -0.12, E.outCubic(U.seg(T, 196.5, 196.65)));
    else if (T >= 196.65) n = U.lerp(-0.12, 0, E.inOutSine(U.seg(T, 196.65, 197.0)));
    return n;
  }
  function sayoPose(T) {
    const light = U.env(T, 190.6, 190.95, 191.2, 191.8);
    const toStand = U.env(T, 196.5, 196.85, 197.25, 197.7, E.inOutSine);
    const toMoon = U.seg(T, 197.5, 198.4, E.inOutSine);
    const dz = dozeNod(T);
    return {
      nod: Math.abs(dz) > light * 0.5 ? dz : light * 0.5, // head forward and down (negative: the catch lifts it past level)
      turn: U.clamp(0.55 * toStand + 0.9 * toMoon, -1, 1),   // toward +x (the stand, then the moon)
      lift: toMoon,                                  // the head raised a little to the moon: she smiles
    };
  }
  // her hair: 銀鼠 toward 鼠, so the back of the head reads as hair (not a pale face) against
  // the cream nape and the 半襟; the 煤竹 comb across the bun
  const OLD_HAIR = U.mix(C.ginnezu, C.nezumi, 0.3);
  function drawSayo(L, T) {
    const q = sayoPose(T);
    // the same figure as たけ (CAST.oldSayo = たけ's paths and poses, white bun): seiza, back view,
    // ≈160 px (x 1043–1145, y 790–950). The head never drops behind the collar: CAST draws it last.
    PRINT.with(L, 'K', T, (k) => {
      CAST.oldSayo(k, SAYO.x, SAYO.y, SAYO.s, {
        pose: 'seiza', view: 'back', t: T,
        look: q.turn, nod: 2.0 * q.nod - 0.5 * q.lift,     // (the doze exaggerated for the scale: the head sinks ≈13 px)
        palette: { hair: OLD_HAIR },
      });
    });
  }

  /* ------------------------------------------------------------------ */
  TSUKI.scene('ariake', {
    init(S) {
      const k = S.k || 1;
      TSUKI.SHOTS.warmFlat('B7', 195, k);
      // the late paper is resampled once to the backing size: do it now, not on the cut at 190
      try {
        const cv = B.canvas(Math.round(1920 * k), Math.round(1080 * k)), c = cv.getContext('2d');
        c.setTransform(k, 0, 0, k, 0, 0);
        TSUKI.SHOTS.age(c, 199);
      } catch (e) { /* warming is only an optimisation */ }
    },
    draw(ctx, t, S) {
      const T = S.seg.start + t;
      // a clean context whatever the previous scene left behind (the engine resets only some state)
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'low';
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      ctx.miterLimit = 10;
      // 204–206: a slow push-in on the thread (1.00 → 1.04 about (1180,700)); the stage is
      // printed 1:1 into a buffer and the finished impression scaled once (SB.withCamera)
      const e = E.inOutSine(U.seg(T, 204, 206));
      const cam = e > 0 ? { s: 1 + 0.04 * e, about: [1180, 700], to: [1180, 700] } : null;
      const m = moon(T);
      SB.withCamera(ctx, cam, (cx) => {
        cx.imageSmoothingEnabled = true;
        cx.imageSmoothingQuality = 'low';
        SB.draw(cx, T, {
          id: 'B7',
          between: {
            base: (c) => {
              // the paper of the closed panels: the dim pre-dawn light from the low moon beyond the opening
              // (carved in flat steps like every light on this paper, but faint: the old paper holds
              //  only a pale disc of the setting moon beside the opening, no lift of its own)
              SB.light(c, T, { x: m.x, y: m.y + 150, r: 262, falloff: 0.44, core: 0, ranges: [[G.panels[0][0], G.opening.x0], [G.opening.x1, G.panels[3][1]]] });
              PRINT.with(c, 'P4', T, (k) => { k.fillStyle = U.rgba(AINEZU, 0.3); k.fillRect(G.panels[0][0], G.top, G.panels[0][1] - G.panels[0][0], G.bottom - G.top); });
              foxShadow(c, T);
            },
            ink: (c) => {
              SB.tokonomaShade(c, T, 0.55);
              // on the engawa, inside the opening (never over the stiles)
              c.save();
              c.beginPath(); c.rect(OPEN.x0, G.top, OPEN.x1 - OPEN.x0, G.bottom - G.top); c.clip();
              incense(c, T);
              offerings(c, T);
              drawSayo(c, T);
              c.restore();
              foxPaw(c, T);
              foxGlints(c, T);
              // the coin of moonlight through the torn cell, fallen down-left on the tatami
              PRINT.with(c, 'P7', T, (k) => {
                const g = k.createRadialGradient(650, 1010, 0, 650, 1010, 40);
                g.addColorStop(0, U.rgba(C.gofun, 0.5));
                g.addColorStop(0.75, U.rgba(C.gofun, 0.38));
                g.addColorStop(1, U.rgba(C.gofun, 0));
                k.fillStyle = g;
                k.save(); k.translate(650, 1010); k.scale(1, 0.3); k.translate(-650, -1010);
                k.beginPath(); k.arc(650, 1010, 40, 0, U.TAU); k.fill();
                k.restore();
              });
            },
          },
        });
        // the late impression's paper: yellowed and foxed everywhere …
        TSUKI.SHOTS.age(cx, T);
        // … but the moon, a hole to the fresh paper, painted after the aging: it is never old
        cx.save();
        cx.beginPath(); cx.rect(OPEN.x0, G.top + 30, OPEN.x1 - OPEN.x0, G.bottom - G.top - 30); cx.clip();
        // (the rabbit fades monotonically across the late moons: 0.22 → 0.2 here, Shot E 0.2 → 0.15, karazuri 0.1)
        MOON.draw(cx, m.x, m.y, m.r, T, { halo: 0.35, haloR: m.r * 1.8, maria: U.lerp(0.22, 0.2, U.clamp((T - 190) / 16)), fringe: false });
        cx.restore();
      });
    },
  });
})(window.TSUKI);
