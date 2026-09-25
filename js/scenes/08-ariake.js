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

   191 the incense lit; the thread grows 191–194   193–196.5 two slow nods
   195 glints round the stile, the fox's head rises   195.2–196 the paw
   196 the top dango gone (14 remain)   196.2 glints off, the head sinks
   196.5 she wakes and turns to the stand   197.5 she turns to the moon
   204–206 a slow push-in on the thread (1.00 → 1.04 about (1180,700))
   206 match-cut: the thread → Fuji's snow gully on the same axis.

   No warm colour: the only warm spot is the hand-applied 退紅 strip on the
   jug (drawn outside the P2 block, which is gone in the 後摺).
   The paper is aged with TSUKI.SHOTS.age (foxing multiplied: it darkens the
   dark wood instead of glittering on it); the moon is painted after it —
   the moon is never old.
   Drawn here (not CAST): old 小夜 from behind (the haori's 波兎 tile, the
   white bun and its comb; her nods and her turn to the moon exaggerated for
   the scale), the fox's head in shadow and its paw, the offerings.
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const { U, B, C, PRINT, MOON } = TSUKI;
  const SB = TSUKI.SHOTS.B;
  const G = SB.GEOM;
  const E = U.ease;
  const AINEZU = SB.INK.AINEZU;
  const TAIKO = C.toki;                               // 退紅: the faded heko-obi

  const SAYO = { x: 1094, y: 942, s: 1.0 };
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
  /* the 波兎 haori tile (藍 ground, 胡粉 seigaiha and leaping rabbits)   */
  /* ------------------------------------------------------------------ */
  let haoriTile = null;
  function buildTile() {
    const S = 64;
    const cv = B.canvas(S, S), c = cv.getContext('2d');
    c.fillStyle = U.mix(C.ai, C.kon, 0.15);
    c.fillRect(0, 0, S, S);
    c.strokeStyle = U.rgba(C.gofun, 0.8);
    c.lineWidth = 1.1;
    for (const [cy, xs] of [[0.62, [0, 0.5, 1]], [0.74, [0.25, 0.75]]]) {
      for (const ox of [-S, 0, S]) for (const cx of xs) for (const k of [1, 0.66, 0.33]) {
        c.beginPath(); c.arc(cx * S + ox, cy * S, S * 0.25 * k, Math.PI, 0);
        if (k === 1) { c.fillStyle = U.mix(C.ai, C.kon, 0.15); c.fill(); }
        c.stroke();
      }
    }
    c.fillStyle = C.gofun;
    const rabbit = (x, y, s) => {
      c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-0.28);
      c.beginPath();
      c.ellipse(0, 0, 0.5, 0.26, 0, 0, U.TAU);
      c.moveTo(0.62, -0.1); c.ellipse(0.5, -0.12, 0.22, 0.19, 0, 0, U.TAU);
      c.moveTo(0.48, -0.26); c.ellipse(0.28, -0.4, 0.26, 0.07, 0.55, 0, U.TAU);
      c.moveTo(-0.3, 0.1); c.ellipse(-0.62, 0.22, 0.34, 0.08, 0.35, 0, U.TAU);
      c.fill(); c.restore();
    };
    rabbit(0.3 * S, 0.28 * S, S * 0.24);
    rabbit(0.8 * S, 0.06 * S, S * 0.19);
    rabbit(0.8 * S + -S, 0.06 * S, S * 0.19);
    haoriTile = cv;
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
    const taken = T >= 196.0;
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
    const reach = U.env(T, 195.2, 195.7, 195.9, 196.2);
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
    const r = U.env(T, 195.2, 195.8, 195.95, 196.2, E.inOutSine);
    if (r <= 0.001) return;
    // from behind panel 4's stile, low along the boards, then up to the top dango
    const x0 = OPEN.x1 + 2, y0 = 926;
    const tx = U.lerp(x0 - 6, STAND.x + 5, r), ty = U.lerp(y0, STAND.y - 34, r);
    const mid = [(x0 + tx) / 2 + 6, Math.max(ty, y0) + 4];
    PRINT.with(c, 'K', T, (k) => {
      const pts = B.qpts(x0 + 6, y0 + 2, mid[0], mid[1], tx, ty, 12);
      B.taper(k, pts, 7, 4, U.rgba(C.sumi, 0.95), 0.1);
      // the pad and three toe bumps, curled round the dango
      k.fillStyle = U.rgba(C.sumi, 0.95);
      k.beginPath(); k.ellipse(tx, ty + 1, 4.2, 3.4, 0.3, 0, U.TAU); k.fill();
      for (const [ox, oy] of [[-3.6, -2.6], [-1, -4], [1.8, -3.4]]) { k.beginPath(); k.arc(tx + ox, ty + oy, 1.4, 0, U.TAU); k.fill(); }
      if (T > 195.9) { k.fillStyle = C.gofun; k.beginPath(); k.arc(tx - 4, ty - 3, 4.2, 0, U.TAU); k.fill(); k.strokeStyle = U.rgba(C.sumi, 0.6); k.lineWidth = 0.8; k.stroke(); }
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
  /* 小夜 at sixty-six, from behind: the haori, the white bun             */
  /* ------------------------------------------------------------------ */
  function sayoPose(T) {
    const light = U.env(T, 190.6, 190.95, 191.2, 191.8);
    const nod1 = U.env(T, 193.0, 193.9, 194.2, 194.9, E.inOutSine);
    const nod2 = U.env(T, 194.9, 195.7, 196.2, 196.6, E.inOutSine);
    const toStand = U.env(T, 196.5, 196.85, 197.25, 197.7, E.inOutSine);
    const toMoon = U.seg(T, 197.5, 198.4, E.inOutSine);
    return {
      nod: Math.max(light * 0.5, nod1 * 0.85, nod2), // head forward and down
      turn: 0.55 * toStand + 0.9 * toMoon,          // toward +x (the stand, then the moon)
      tilt: 0.16 * toMoon,                          // the head tipped up and aside: she smiles
      wake: U.seg(T, 196.4, 196.7),
    };
  }
  function drawSayo(L, T) {
    const q = sayoPose(T);
    const { x: X, y: Y } = SAYO;
    const br = Math.sin(T * 1.1) * 0.6;
    const sh = -96 + br;                                  // shoulder line (rounded with age)
    // kimono skirt spreading on the boards
    const skirt = new Path2D();
    skirt.moveTo(X - 40, Y - 26); skirt.bezierCurveTo(X - 48, Y - 12, X - 47, Y - 2, X - 44, Y + 2);
    skirt.lineTo(X + 44, Y + 2); skirt.bezierCurveTo(X + 47, Y - 2, X + 48, Y - 12, X + 40, Y - 26); skirt.closePath();
    // the haori's back: narrow sloping shoulders, bowed, broad at the seat
    const back = new Path2D();
    // (the bent back rises round the head, which sinks between the shoulders)
    back.moveTo(X - 9, Y + sh - 3);
    back.bezierCurveTo(X - 20, Y + sh - 5, X - 31, Y + sh + 2, X - 34, Y + sh + 20);
    back.bezierCurveTo(X - 37, Y + sh + 44, X - 39, Y - 36, X - 41, Y - 10);
    back.lineTo(X + 41, Y - 10);
    back.bezierCurveTo(X + 39, Y - 36, X + 37, Y + sh + 44, X + 34, Y + sh + 20);
    back.bezierCurveTo(X + 31, Y + sh + 2, X + 20, Y + sh - 5, X + 9, Y + sh - 3);
    back.closePath();
    // sleeves at her sides, hanging to the boards
    const sleeves = [-1, 1].map((s) => {
      const p = new Path2D();
      p.moveTo(X + s * 26, Y + sh + 16); p.bezierCurveTo(X + s * 38, Y + sh + 30, X + s * 44, Y - 40, X + s * 44, Y - 16);
      p.lineTo(X + s * 33, Y - 14); p.bezierCurveTo(X + s * 31, Y - 40, X + s * 29, Y + sh + 40, X + s * 24, Y + sh + 24); p.closePath();
      return p;
    });
    // head: forward and down in her doze, turned (+x) to the stand and to the moon, tipped up at the last
    const hx = X + 8 * q.turn, hy = Y + sh - 12 + 10 * q.nod - 4 * q.tilt;
    const rot = 0.1 * q.turn - q.tilt;
    // the collar V at the nape (the haori's lapels round a narrow white 半襟)
    const collar = new Path2D();
    collar.moveTo(X - 11, Y + sh - 7); collar.lineTo(X, Y + sh + 8); collar.lineTo(X + 11, Y + sh - 7);
    collar.lineTo(X + 7, Y + sh - 9); collar.lineTo(X, Y + sh + 1); collar.lineTo(X - 7, Y + sh - 9); collar.closePath();
    if (!haoriTile) buildTile();
    // the nape and — as she turns — a sliver of cheek and ear on the moon side
    PRINT.with(L, 'P7', T, (k) => {
      k.save();
      k.translate(hx, hy); k.rotate(rot);
      k.fillStyle = U.mix(C.gofun, C.kitsune, 0.18);
      k.beginPath(); k.ellipse(0, 10 + 2 * q.nod, 6, 6 + 3 * q.nod, 0, 0, U.TAU); k.fill();   // nape
      const t = Math.min(1, q.turn);
      if (t > 0.05) {
        k.beginPath(); k.ellipse(10 + 3 * t, 2, 3 + 3.5 * t, 9, 0.15, 0, U.TAU); k.fill();      // cheek
        k.beginPath(); k.ellipse(7 + 2 * t, -1, 2.6, 4, 0, 0, U.TAU); k.fill();                   // ear
      }
      k.restore();
    });
    PRINT.with(L, 'P4', T, (k) => {
      k.save();
      k.translate(hx, hy); k.rotate(rot);
      // the white hair drawn back from the brow; the bun sits at the back of the head, its comb across it
      k.fillStyle = U.mix(C.gofun, C.ginnezu, 0.28);
      k.beginPath(); k.ellipse(-2.5 * q.turn, -2, 13.5, 13, 0, 0, U.TAU); k.fill();
      k.fillStyle = U.mix(C.gofun, C.ginnezu, 0.4);
      k.beginPath(); k.ellipse(-4 * q.turn, -3 - 3 * q.nod, 7.5, 6.6, 0, 0, U.TAU); k.fill();
      k.restore();
    });
    PRINT.with(L, 'K', T, (k) => {
      k.save();
      k.translate(hx, hy); k.rotate(rot);
      k.strokeStyle = U.rgba(C.sumi, 0.7); k.lineWidth = 1;
      k.beginPath(); k.ellipse(-2.5 * q.turn, -2, 13.5, 13, 0, 0, U.TAU); k.stroke();
      k.beginPath(); k.ellipse(-4 * q.turn, -3 - 3 * q.nod, 7.5, 6.6, 0, 0, U.TAU); k.stroke();
      // hair strands combed to the bun
      k.strokeStyle = U.rgba(C.sumi, 0.22); k.lineWidth = 0.7;
      for (const a of [-0.9, -0.45, 0.45, 0.9]) { k.beginPath(); k.moveTo(-2.5 * q.turn + Math.sin(a) * 12, -2 - Math.cos(a) * 11); k.quadraticCurveTo(-3 * q.turn + Math.sin(a) * 7, -4, -4 * q.turn + Math.sin(a) * 5, -2 - 3 * q.nod); k.stroke(); }
      // the 煤竹 comb across the top of the bun
      k.strokeStyle = U.rgba(U.mix(C.odo, C.sumi, 0.55), 0.95); k.lineWidth = 2.4; k.lineCap = 'round';
      k.beginPath(); k.moveTo(-4 * q.turn - 7, -8 - 3 * q.nod); k.quadraticCurveTo(-4 * q.turn, -10.5 - 3 * q.nod, -4 * q.turn + 7, -8 - 3 * q.nod); k.stroke();
      k.restore();
    });
    // print: skirt (紺 stripes), haori (藍 波兎), key lines, hair, skin
    PRINT.with(L, 'P5', T, (k) => {
      k.fillStyle = U.mix(C.kon, C.sumi, 0.2);
      k.fill(skirt);
      k.strokeStyle = U.rgba(C.nezumi, 0.7); k.lineWidth = 0.8;
      k.save(); k.clip(skirt);
      for (let x = X - 46; x < X + 46; x += 4.5) { k.beginPath(); k.moveTo(x, Y - 30); k.lineTo(x + 1, Y + 4); k.stroke(); }
      k.restore();
      const pat = k.createPattern(haoriTile, 'repeat');
      pat.setTransform(new DOMMatrix().translate(X - 3, Y - 7).scale(0.36, 0.36));
      k.fillStyle = pat;
      k.fill(back); for (const s2 of sleeves) k.fill(s2);
    });
    PRINT.with(L, 'K', T, (k) => {
      k.strokeStyle = U.rgba(C.sumi, 0.8); k.lineWidth = 1.2; k.lineJoin = 'round';
      k.stroke(skirt); k.stroke(back); for (const s2 of sleeves) k.stroke(s2);
      // the centre back seam
      k.strokeStyle = U.rgba(C.sumi, 0.4); k.lineWidth = 0.8;
      k.beginPath(); k.moveTo(X, Y + sh + 6); k.quadraticCurveTo(X + 0.5, Y - 50, X, Y - 12); k.stroke();
    });
    PRINT.with(L, 'P7', T, (k) => { k.fillStyle = U.mix(C.gofun, C.ginnezu, 0.15); k.fill(collar); });
    PRINT.with(L, 'K', T, (k) => { k.strokeStyle = U.rgba(C.sumi, 0.7); k.lineWidth = 0.9; k.stroke(collar); });
  }

  /* ------------------------------------------------------------------ */
  TSUKI.scene('ariake', {
    init(S) { buildTile(); TSUKI.SHOTS.warmFlat('B7', 195, S.k || 1); },
    draw(ctx, t, S) {
      const T = S.seg.start + t;
      // a clean context whatever the previous scene left behind (the engine resets only some state)
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'low';
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      ctx.miterLimit = 10;
      const e = E.inOutSine(U.seg(T, 204, 206));
      if (e > 0) {
        const s = 1 + 0.04 * e;
        ctx.translate(1180, 700); ctx.scale(s, s); ctx.translate(-1180, -700);
      }
      const m = moon(T);
      SB.draw(ctx, T, {
        id: 'B7',
        between: {
          base: (c) => {
            // the paper of the closed panels: the dim pre-dawn light from the low moon beyond the opening
            SB.light(c, T, { x: m.x, y: m.y + 150, r: 250, falloff: 0.6, core: 0.3, ranges: [[G.panels[0][0], G.opening.x0], [G.opening.x1, G.panels[3][1]]] });
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
      TSUKI.SHOTS.age(ctx, T);
      // … but the moon, a hole to the fresh paper, painted after the aging: it is never old
      ctx.save();
      ctx.beginPath(); ctx.rect(OPEN.x0, G.top + 30, OPEN.x1 - OPEN.x0, G.bottom - G.top - 30); ctx.clip();
      MOON.draw(ctx, m.x, m.y, m.r, T, { halo: 0.35, haloR: m.r * 1.8, maria: 0.12, fringe: false });
      ctx.restore();
    },
  });
})(window.TSUKI);
