/* ==========================================================================
   06-ama-no-hagoromo.js — 五 天の羽衣 (T 118–160) · THE CLIMAX
   Shot B (118–155), then Shot A′ (155–160).

   118  through the mist wipe: the glow has climbed to the top rail
   121  the moon's rim enters the round window (MOON.B — one moon)
   122.5 たけ's shadow slips off her haori (the letter writes itself, DOM)
   124–126 she holds it up against the moon: its 波兎 shines through
   126–128.5 she lays it over the sleeping child; the shadows merge
   132  shadows cast by nothing: a 瑞雲 with seven tennyo and a canopy
        slides down panels 2–3 (far from the paper: soft, α .7 → .25)
   136–139.8 the ribbon of light (天の羽衣) unfurls down the central stile
   140  CULMINATION: the moon centred in the window. Her shadow peels off
        the paper (skew, penumbra, a paper-puppet turn), stands, straightens
   141.2–146.8 she climbs the kumiko rung by rung; cells flash; hair grows;
        the ribbon winds round her; PRINT tears every plate (140–147.8)
   147  she looks back once        147.8 CLICK (PRINT: perfect register)
   148–148.4 she slides up into the window, dark against the moon; a kira
        pinpoint; the 墨 叢雲 closes over the window (148.6–152): darkness
   152.4 the cloud passes; only the child's shadow under the haori's
   155  cut, in silence, to A′: たけ upright against the post, eyes closed,
        小夜 asleep in her lap under the haori. 155.4–157.8 her colour
        drains downward to 胡粉/銀鼠 (a feathered front with kira) while the
        haori and the red heko-obi stay bright; the child casts a shadow,
        the grandmother none. Hold to 160.

   Every live layer is printed through PRINT (with / shadowComposite /
   MOON.draw) so the tears, the CLICK and the jolt reach all of it.
   Stand-ins drawn here: the 叢雲, the ribbon, the 波兎 silk tile, the A′
   offerings still-life; the climbing figure is CAST.puppet('climber').
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const { U, B, C, CAST, PRINT, MOON } = TSUKI;
  const SB = TSUKI.SHOTS.B, SA = TSUKI.SHOTS.A_prime;
  const G = SB.GEOM;
  const E = U.ease;
  const AINEZU = SB.INK.AINEZU;
  const EBICHA = U.mix(C.shu, C.sumi, 0.45);      // 海老茶: たけ's obijime
  const CUT = 155.0;

  /* ------------------------------------------------------------------ */
  /* Shot B: placement                                                   */
  /* ------------------------------------------------------------------ */
  const TK = { x: 1060, y: 962, s: 1.24 };                         // たけ seated, facing the child (right)
  const CH = { x: 1101, y: 950, s: 1.24 };                         // 小夜 asleep across her lap
  const CL = { x: 1012, y: 960 };                                  // the climber (scale 1: rungs 115 px)
  const K_TOP = 3.05;                                              // rungs climbed by 146.8

  const clamp01 = (x) => U.clamp(x);

  /* ------------------------------------------------------------------ */
  /* the 波兎 silk tile (rabbits leaping over seigaiha), built once      */
  /* ------------------------------------------------------------------ */
  let silkTile = null;
  function buildSilk() {
    const S = 88;
    const cv = B.canvas(S, S);
    const c = cv.getContext('2d');
    c.strokeStyle = C.geppaku;
    c.fillStyle = C.geppaku;
    c.lineWidth = 1.6;
    // seigaiha: three rows of nested arcs
    const r = 22;
    for (let j = 0; j < 5; j++) {
      const yy = 44 + j * 11;
      const off = j % 2 ? r : 0;
      for (let xx = -r * 2 + off; xx < S + r * 2; xx += r * 2) {
        for (const k of [1, 0.66, 0.33]) { c.beginPath(); c.arc(xx, yy + r, r * k, Math.PI, 0); c.stroke(); }
      }
    }
    // a leaping rabbit over the waves
    const rabbit = (x, y, s, flip) => {
      c.save();
      c.translate(x, y); c.scale(s * flip, s);
      c.beginPath();
      c.ellipse(0, 0, 11, 5.5, -0.25, 0, U.TAU);          // stretched body mid-leap
      c.moveTo(14, -6); c.ellipse(10, -5, 4.6, 3.8, 0, 0, U.TAU);   // head
      c.moveTo(9, -8); c.ellipse(6, -12, 1.8, 6, -0.9, 0, U.TAU);  // ears laid back
      c.moveTo(12, -8); c.ellipse(9, -13, 1.6, 5.5, -0.7, 0, U.TAU);
      c.moveTo(-8, 2); c.ellipse(-13, 5, 6, 2, 0.5, 0, U.TAU);      // hind legs trailing
      c.moveTo(8, 3); c.ellipse(12, 6, 4, 1.6, -0.6, 0, U.TAU);      // forelegs reaching
      c.fill();
      c.restore();
    };
    rabbit(28, 22, 1, 1);
    rabbit(72, 64, 0.8, -1);
    silkTile = cv;
  }

  /* ------------------------------------------------------------------ */
  /* the ribbon of light                                                 */
  /* ------------------------------------------------------------------ */
  function ribbonPoints(T, climber) {
    // unfurl 136–139.8 down the stile to her; 140–147.2 it winds round her and rises with her
    const top = [G.stile, 262];
    const unf = E.inOutSine(clamp01((T - 136) / 3.8));
    const pts = [];
    let end;
    if (T < 140) end = [TK.x - 10, 792];
    else end = climber.waist;
    const wave = (s) => Math.sin(s * U.TAU * 2 + T * 1.3) * 11 * Math.sin(Math.PI * s);
    const N = 44;
    const L = unf;
    for (let i = 0; i <= N; i++) {
      const s = (i / N) * L;
      // down the stile, bending to her near the end
      const bend = U.smoothstep(0.7, 1, s);
      const x = U.lerp(top[0], end[0], bend) + wave(s);
      const y = U.lerp(top[1], end[1], s);
      pts.push([x, y]);
    }
    // winding once round her body (after 140): an ellipse round the waist, drawn as a spiral
    const wind = U.seg(T, 140.4, 142.4, E.inOutSine);
    if (T >= 140 && climber && wind > 0) {
      const [cx, cy] = climber.waist;
      const rx = 30, ry = 11;
      const M = 34;
      for (let i = 1; i <= M; i++) {
        const u = (i / M) * wind;
        const a = Math.PI * 0.5 + u * U.TAU * 1.15;
        pts.push([cx + Math.cos(a) * rx * (1 - 0.25 * u), cy + Math.sin(a) * ry - 26 * u]);
      }
    }
    return pts;
  }

  function drawRibbon(c, T, climber) {
    if (T < 136 || T >= 148.3) return;
    const pts = ribbonPoints(T, climber);
    if (pts.length < 3) return;
    const fadeOut = 1 - U.seg(T, 147.9, 148.3);
    const n = pts.length;
    const Ls = [], Rs = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], dl = Math.hypot(dx, dy) || 1;
      const s = i / (n - 1);
      const w = U.lerp(18, 3, s) * (0.75 + 0.25 * Math.sin(s * 19 + T * 2)) / 2;
      Ls.push([pts[i][0] - (dy / dl) * w, pts[i][1] + (dx / dl) * w]);
      Rs.push([pts[i][0] + (dy / dl) * w, pts[i][1] - (dx / dl) * w]);
    }
    PRINT.with(c, 'P7', T, (k) => {
      k.save();
      k.beginPath();
      k.rect(G.panels[0][0], G.top, G.panels[3][1] - G.panels[0][0], G.bottom - G.top + 6);
      k.moveTo(G.window.x + G.window.r, G.window.y); k.arc(G.window.x, G.window.y, G.window.r, 0, U.TAU);
      k.clip();
      k.globalCompositeOperation = 'lighter';
      k.globalAlpha *= fadeOut;
      // a soft halo, then the bright body
      k.strokeStyle = U.rgba(C.gofun, 0.12);
      k.lineWidth = 16;
      k.lineJoin = 'round';
      k.lineCap = 'round';
      k.beginPath(); pts.forEach((p, i) => (i ? k.lineTo(p[0], p[1]) : k.moveTo(p[0], p[1]))); k.stroke();
      k.fillStyle = U.rgba(C.gofun, 0.62);
      k.beginPath();
      k.moveTo(Ls[0][0], Ls[0][1]);
      for (const p of Ls) k.lineTo(p[0], p[1]);
      for (let i = Rs.length - 1; i >= 0; i--) k.lineTo(Rs[i][0], Rs[i][1]);
      k.closePath();
      k.fill();
      k.restore();
    });
    // kira along its edges: a slow travelling glint
    PRINT.with(c, 'P8', T, (k) => {
      k.globalCompositeOperation = 'lighter';
      k.globalAlpha *= fadeOut;
      for (let j = 0; j < 7; j++) {
        const u = U.fract(T * 0.23 + j / 7);
        const i = Math.floor(u * (n - 1));
        const p = j % 2 ? Ls[i] : Rs[i];
        const a = 0.55 * Math.sin(Math.PI * u);
        k.fillStyle = U.rgba(C.gofun, a);
        k.beginPath(); k.arc(p[0], p[1], 1.6, 0, U.TAU); k.fill();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* the climbing shadow                                                 */
  /* ------------------------------------------------------------------ */
  function climberState(T) {
    // peel 140–141.2 (soften, skew, rise, straighten, then the paper-puppet turn to face the stile),
    // climb 141.2–146.8, look back 147–147.5, into the window 148–148.4
    const peel = clamp01((T - 140) / 1.2);
    const youth = E.inOutSine(clamp01((T - 140.25) / 0.8));
    const turn = E.inOutSine(clamp01((T - 140.95) / 0.3));               // 0 facing the child → 1 facing the stile
    const sx = Math.cos(Math.PI * turn);
    const skew = Math.sin(Math.PI * peel) * U.deg(12);
    const pen = T < 141.2 ? Math.sin(Math.PI * peel) * 6 + peel * 2 : 2;
    const k = T < 141.2 ? null : K_TOP * clamp01((T - 141.2) / 5.6);
    const climbMix = E.inOutSine(clamp01((T - 141.2) / 0.5));
    const hair = U.lerp(0.25, 1, E.inOutSine(clamp01((T - 140.4) / 6.4)));
    const look = E.inOutSine(clamp01((T - 147.0) / 0.5));
    const rise = E.inCubic(clamp01((T - 148.0) / 0.4));
    // where she stands: from her seat (facing the child) to the foot of the stile
    const x = U.lerp(1046, CL.x, E.inOutSine(clamp01((T - 140.4) / 0.8)));
    return { peel, youth, turn, sx, skew, pen, k, climbMix, hair, look, rise, x };
  }

  /* ------------------------------------------------------------------ */
  /* the 叢雲 over the window                                            */
  /* ------------------------------------------------------------------ */
  function cloudX(T, layer) {
    // leading-edge keyframes [t, x]: the thin far and mid bands pass under and over the moon first,
    // then the near 墨 bank slams the window shut (148.6) and holds it until 152.0, gone by 152.4
    const K = [
      { w: 300, keys: [[148.15, 840], [148.5, 1000], [151.9, 1160], [152.6, 1400]] },      // far 鼠 (low band)
      { w: 330, keys: [[148.2, 840], [148.55, 1010], [151.9, 1170], [152.7, 1420]] },      // mid 銀鼠 (high band)
      { w: 430, keys: [[148.4, 846], [148.6, 1078], [152.0, 1150], [152.4, 1500]] },       // near 墨
    ][layer];
    const k = K.keys;
    if (T < k[0][0] || T > k[k.length - 1][0]) return { on: false, cx: 0, w: K.w };
    let i = 0;
    while (i < k.length - 2 && T > k[i + 1][0]) i++;
    const u = (T - k[i][0]) / (k[i + 1][0] - k[i][0]);
    const ease = i === 1 ? U.ease.linear : i === 0 ? E.outCubic : E.inCubic;
    const lead = U.lerp(k[i][1], k[i + 1][1], ease(U.clamp(u)));
    return { on: true, cx: lead - K.w / 2, w: K.w };
  }
  function cloudPath(cx, cy, w, h, seed) {
    const p = new Path2D();
    const r = U.rng(seed);
    const n = Math.round(w / 34);
    // a scalloped bank: a row of big lobes on top, smaller ones underneath
    for (let i = 0; i < n; i++) {
      const x = cx - w / 2 + (i + 0.5) * (w / n);
      const e = Math.sin(Math.PI * (i + 0.5) / n);
      const rr = h * U.lerp(0.36, 0.52, r()) * (0.55 + 0.45 * e);
      p.moveTo(x + rr, cy - h * 0.12); p.arc(x, cy - h * 0.12, rr, 0, U.TAU);
      const r2 = rr * 0.7;
      p.moveTo(x + r2 + 8, cy + h * 0.22); p.arc(x + 8, cy + h * 0.22, r2, 0, U.TAU);
    }
    p.rect(cx - w / 2 + 16, cy - h * 0.15, w - 32, h * 0.4);
    return p;
  }
  /** fraction of the moon disc covered by the near cloud (32 samples) */
  function coverage(T) {
    const m = MOON.B(T);
    const nc = cloudX(T, 2);
    if (!nc.on) return 0;
    // the near cloud covers everything inside its body band
    let hit = 0;
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * U.TAU * 3.1, rr = m.r * Math.sqrt((i + 0.5) / 32);
      const px = m.x + Math.cos(a) * rr;
      if (Math.abs(px - nc.cx) < nc.w / 2 - 24) hit++;
    }
    return hit / 32;
  }
  function drawClouds(c, T) {
    if (T < 148.1 || T > 152.75) return;
    c.save();
    SB.windowClip(c);
    const layers = [
      { plate: 'P4', col: C.nezumi, cy: 236, h: 70, seed: 5 },
      { plate: 'P4', col: C.ginnezu, cy: 70, h: 72, seed: 9 },
      { plate: 'K', col: C.sumi, cy: 150, h: 280, seed: 13 },
    ];
    layers.forEach((L, i) => {
      const cl = cloudX(T, i);
      if (!cl.on) return;
      const path = cloudPath(cl.cx, L.cy, cl.w, L.h, L.seed);
      if (i === 2) {
        // 胡粉 rim on the edge that faces the hidden moon (a lighter pull, offset toward it)
        const m = MOON.B(T);
        const dir = m.x > cl.cx ? 1 : -1;
        PRINT.with(c, 'P7', T, (k) => {
          k.save();
          k.translate(dir * 3.5, -1.5);
          k.fillStyle = U.rgba(C.gofun, 0.55);
          k.fill(path);
          k.restore();
        });
      }
      PRINT.with(c, L.plate, T, (k) => {
        k.fillStyle = i === 2 ? C.sumi : U.rgba(L.col, 0.92);
        k.fill(path);
      });
    });
    c.restore();
  }

  /* ------------------------------------------------------------------ */
  /* Shot B: the shadows on the paper                                    */
  /* ------------------------------------------------------------------ */
  /** たけ's seated shadow (CAST grandma poses), 118–140 */
  function drawTake(s2, T, alpha = 1) {
    const o = { facing: 1, silhouette: AINEZU, t: T };
    const w = (a, fn) => { if (a > 0.004) { s2.save(); s2.globalAlpha *= a * alpha; fn(); s2.restore(); } };
    // phases with short crossfades
    const aSeiza = 1 - U.seg(T, 122.5, 122.9);
    const aNoHaori = U.env(T, 122.5, 122.9, 122.95, 123.25, E.linear);
    const aLift = U.seg(T, 122.95, 123.25) * (1 - U.seg(T, 127.3, 128.2));
    const aLap = U.seg(T, 127.3, 128.2);
    w(aSeiza, () => CAST.grandma(s2, TK.x, TK.y, TK.s, Object.assign({ pose: 'seiza' }, o)));
    w(aNoHaori, () => CAST.grandma(s2, TK.x, TK.y, TK.s, Object.assign({ pose: 'seiza', haori: false }, o)));
    let ret = null;
    if (aLift > 0.004) {
      const up = E.inOutSine(U.seg(T, 123.0, 124.0));
      const down = E.inOutSine(U.seg(T, 126.0, 127.9));
      const lift = up * (1 - 0.8 * down);
      s2.save();
      s2.globalAlpha *= aLift * alpha;
      // laying it over the child: the whole gesture leans forward
      s2.translate(TK.x, TK.y); s2.rotate(down * 0.12); s2.translate(-TK.x, -TK.y);
      s2.translate(down * 26, down * 6);
      ret = CAST.grandma(s2, TK.x, TK.y, TK.s, Object.assign({ pose: 'lift-haori', lift }, o));
      s2.restore();
    }
    w(aLap, () => CAST.grandma(s2, TK.x, TK.y, TK.s, Object.assign({ pose: 'lap', child: false }, o)));
    return ret;
  }
  function drawChild(s2, T) {
    const covered = U.seg(T, 127.0, 128.2);
    if (covered < 1) { s2.save(); s2.globalAlpha *= 1 - covered; CAST.child(s2, CH.x, CH.y, CH.s, { pose: 'sleep', haori: false, silhouette: AINEZU, t: T }); s2.restore(); }
    if (covered > 0) { s2.save(); s2.globalAlpha *= covered; CAST.child(s2, CH.x, CH.y, CH.s, { pose: 'sleep', haori: true, silhouette: AINEZU, t: T }); s2.restore(); }
  }
  /** the offerings still-life (panel 1, 五: the moon is high, the shadow falls short and low) */
  function offerings(s2, T) {
    const x = 352, y = 958, s = 0.95;
    const p = new Path2D();
    const q = new Path2D();
    q.rect(-2, -30, 74, 6);
    q.moveTo(0, -24); q.lineTo(70, -24); q.lineTo(64, -18); q.lineTo(6, -18); q.closePath();
    q.moveTo(10, -18); q.lineTo(60, -18); q.lineTo(64, 0); q.lineTo(6, 0); q.closePath();
    const r = 8.2;
    for (const [n, k] of [[3, 0], [2, 1], [1, 2]]) for (let i = 0; i < n; i++) {
      const cx = 35 + (i - (n - 1) / 2) * r * 2.05, cy = -30 - r - k * r * 1.6;
      q.moveTo(cx + r, cy); q.arc(cx, cy, r, 0, U.TAU);
    }
    q.moveTo(120, 0); q.bezierCurveTo(106, -8, 104, -40, 120, -52); q.lineTo(122, -64); q.lineTo(138, -64); q.lineTo(140, -52);
    q.bezierCurveTo(156, -40, 154, -8, 140, 0); q.closePath();
    const sway = Math.sin(T * 0.9) * 0.6 + U.wobble(T * 0.4, 7) * 0.5;
    const rr = U.rng(84);
    for (const [a0, L, side] of [[-0.4, 160, -1], [-0.1, 186, 1], [0.14, 170, 1], [0.38, 144, 1]]) {
      const a = a0 + sway * 0.014;
      const bx = 130, by = -62;
      const tx = bx + Math.sin(a) * L, ty = by - Math.cos(a) * L;
      const stem = B.qpts(bx, by, bx + Math.sin(a * 0.5) * L * 0.5, by - L * 0.62, tx, ty, 10);
      for (let i = 0; i < stem.length - 1; i++) { const [x0, y0] = stem[i], [x1, y1] = stem[i + 1]; q.moveTo(x0 - 1, y0); q.lineTo(x1 - 0.8, y1); q.lineTo(x1 + 0.8, y1); q.lineTo(x0 + 1, y0); q.closePath(); }
      for (let k = 0; k < 10; k++) {
        const u = U.lerp(0.62, 1, k / 9);
        const p0 = stem[Math.round(u * (stem.length - 1))];
        const hl = U.lerp(32, 16, (u - 0.62) / 0.38) * U.lerp(0.8, 1.15, rr());
        const ang = a + side * U.lerp(0.5, 1.5, (u - 0.62) / 0.38) + U.lerp(-0.15, 0.15, rr());
        const e = [p0[0] + Math.sin(ang) * hl, p0[1] - Math.cos(ang) * hl];
        const nx = -Math.cos(ang) * 0.9, ny = -Math.sin(ang) * 0.9;
        q.moveTo(p0[0] + nx, p0[1] + ny); q.lineTo(e[0], e[1]); q.lineTo(p0[0] - nx, p0[1] - ny); q.closePath();
      }
    }
    p.addPath(q, new DOMMatrix().translate(x, y).scale(s, s));
    SB.softFill(s2, p, 1.4);
  }

  /** the climbing shadow's path and landmarks at T (null before the peel / after the moon takes her) */
  function climberGeom(T) {
    if (T < 140.1 || T >= 148.45) return null;
    const cs = climberState(T);
    const inWin = cs.rise > 0;
    const o = { t: T, sticks: false, youth: cs.youth, hair: cs.hair, look: cs.look };
    if (cs.k != null) { o.climb = cs.k; o.climbMix = cs.climbMix; }
    const facing = cs.sx >= 0 ? 1 : -1;
    const pp = CAST.puppet('climber', null, 0, 0, 1, Object.assign({ facing }, o));
    // placement: skew, the edge-on turn (scale-x), and the final rise into the window
    const turnS = Math.max(0.04, Math.abs(cs.sx));
    let Mm = new DOMMatrix().translate(cs.x, CL.y).multiply(new DOMMatrix([turnS, 0, -Math.tan(cs.skew), 1, 0, 0]));
    if (inWin) {
      const m = MOON.B(T);
      const head = pp.head;
      // from where she stands toward the moon's disc, shrinking
      const hx = cs.x + head[0], hy = CL.y + head[1];
      const tx = U.lerp(hx, m.x, cs.rise), ty = U.lerp(hy, m.y, cs.rise);
      const s = U.lerp(1, 0.12, cs.rise);
      Mm = new DOMMatrix().translate(tx, ty).scale(s, s).translate(-head[0], -head[1]).multiply(new DOMMatrix([turnS, 0, 0, 1, 0, 0]));
    }
    const path = new Path2D();
    path.addPath(pp.path, Mm);
    const tr = (p) => { const q = Mm.transformPoint(new DOMPoint(p[0], p[1])); return [q.x, q.y]; };
    const foot = pp.feet ? [(pp.feet[0][0] + pp.feet[1][0]) / 2, (pp.feet[0][1] + pp.feet[1][1]) / 2] : [pp.head[0], 0];
    const waistL = [U.lerp(foot[0], pp.head[0], 0.5), U.lerp(foot[1], pp.head[1], 0.5)];
    return { path, rule: pp.rule, head: tr(pp.head), waist: tr(waistL), hands: pp.hands.map(tr), inWin, feet: tr(foot), x: cs.x, fadeIn: U.seg(T, 140.1, 140.45) };
  }

  function shadowsB(c, T) {
    const cs = climberState(T);
    // ---------- far from the paper: the procession of the celestials (132–148.4) ----------
    if (T >= 132 && T < 149) {
      const u = E.outSine(clamp01((T - 132) / 7));
      const cx = U.lerp(900, 1060, u), cy = U.lerp(120, 560, u);
      const a = 0.7 * U.seg(T, 132, 133.2) * (1 - 0.64 * U.seg(T, 139, 140, E.inOutSine)) * (1 - U.seg(T, 147.6, 148.6));
      const far = SB.shadowBuf(c, 'far');
      const pp = CAST.puppet('cloud', far, cx, cy, 1.02, { t: T, facing: -1, sticks: false, ribbon: 2.1 });
      SB.softStamp(far, (s2) => s2.fill(pp.path, pp.rule), 8, pp.bbox);
      c.save();
      SB.paperClip(c);
      SB.shadowComposite(c, T, 'far', { alpha: a });
      c.restore();
    }
    // ---------- against the paper: offerings, たけ, 小夜 ----------
    const sh = SB.shadowBuf(c, 'shadow');
    offerings(sh, T);
    let liftRet = null;
    // her seated shadow until the peel; it becomes the climber
    const seatA = 1 - U.seg(T, 140.1, 140.45);
    if (seatA > 0.004) {
      sh.save();
      if (T > 140) {
        // the peel: a skew away from the paper, softening
        sh.translate(TK.x, TK.y); sh.transform(1, 0, -Math.tan(cs.skew), 1, 0, 0); sh.translate(-TK.x, -TK.y);
      }
      SB.softStamp(sh, (s2) => { liftRet = drawTake(s2, T); }, T > 140 ? cs.pen : 1.2, [TK.x - 120, TK.y - 260, TK.x + 260, TK.y + 10], seatA);
      sh.restore();
    }
    SB.softStamp(sh, (s2) => drawChild(s2, T), 1.2, [CH.x - 60, CH.y - 110, CH.x + 250, CH.y + 20]);
    // the climber (140–148.4): drawn in the same buffer once she has left her seat
    const climber = climberGeom(T);
    if (climber) SB.softStamp(sh, (s2) => s2.fill(climber.path, climber.rule), cs.pen, [climber.x - 260, CL.y - 820, climber.x + 260, CL.y + 30], climber.fadeIn);
    // print what is on the paper
    c.save();
    SB.paperClip(c);
    SB.shadowComposite(c, T, 'shadow', { alpha: 1 });
    c.restore();
    // the silk transmits its pattern while held up (124–126)
    const silk = U.env(T, 123.9, 124.3, 125.8, 126.3);
    if (silk > 0.001 && liftRet && liftRet.cloth) {
      if (!silkTile) buildSilk();
      const a = liftRet.cloth.a, b = liftRet.cloth.b;
      PRINT.with(c, 'P7', T, (k) => {
        k.save();
        // only inside the haori's shadow: the buffer's coverage restricted to the cloth
        k.beginPath(); k.rect(a[0] + 18, a[1] + 6, b[0] - a[0] - 22, b[1] - a[1] - 8); k.clip();
        const pat = k.createPattern(silkTile, 'repeat');
        pat.setTransform(new DOMMatrix().translate(a[0], a[1]).scale(0.62, 0.62));
        k.globalAlpha *= 0.35 * silk;
        const tmp = SB.shadowBuf(k, 'silk');
        tmp.fillStyle = pat;
        tmp.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
        tmp.globalCompositeOperation = 'destination-in';
        tmp.setTransform(1, 0, 0, 1, 0, 0);
        tmp.drawImage(SB.bufCanvas('shadow'), 0, 0);
        k.restore();
        SB.shadowComposite(c, T, 'silk', { tint: false, mode: 'source-over', plate: 'P7', alpha: 0.35 * silk });
      });
    }
  }

  /** the climber rising into the window: dark against the moon */
  function climberInWindow(c, T, climber) {
    if (!climber || !climber.inWin) return;
    c.save();
    SB.windowClip(c);
    PRINT.with(c, 'P4', T, (k) => {
      k.globalCompositeOperation = 'multiply';
      k.fillStyle = AINEZU;
      k.fill(climber.path, climber.rule);
    });
    c.restore();
  }

  /** she is absorbed by the disc: a kira pinpoint (148.4) */
  function kiraPin(c, T) {
    const pin = U.env(T, 148.3, 148.42, 148.5, 148.85);
    if (pin <= 0) return;
    const m = MOON.B(T);
    c.save();
    SB.windowClip(c);
    PRINT.with(c, 'P8', T, (k) => {
      k.globalCompositeOperation = 'lighter';
      const g = k.createRadialGradient(m.x, m.y, 0, m.x, m.y, 30);
      g.addColorStop(0, U.rgba(C.gofun, 0.95 * pin));
      g.addColorStop(0.22, U.rgba(C.gofun, 0.35 * pin));
      g.addColorStop(1, U.rgba(C.gofun, 0));
      k.fillStyle = g;
      k.fillRect(m.x - 30, m.y - 30, 60, 60);
      k.strokeStyle = U.rgba(C.gofun, 0.85 * pin);
      k.lineWidth = 1.1;
      k.beginPath(); k.moveTo(m.x - 24 * pin, m.y); k.lineTo(m.x + 24 * pin, m.y); k.moveTo(m.x, m.y - 30 * pin); k.lineTo(m.x, m.y + 30 * pin); k.stroke();
    });
    c.restore();
  }

  /** cells flash 胡粉 as her hands pass them (141.2–147) */
  function cellFlashes(c, T) {
    if (T < 141.2 || T > 147.4) return;
    PRINT.with(c, 'P7', T, (k) => {
      k.globalCompositeOperation = 'lighter';
      for (let j = 0; j < 7; j++) {
        // hand height reaches rung (j + 3.5) at k = j; the cell above the rung flashes
        const tj = 141.2 + (j / K_TOP) * 5.6;
        const age = T - tj;
        if (age < 0 || age > 0.35) continue;
        const a = Math.sin(Math.PI * age / 0.35);
        const yRung = 960 - 115 * (j + 3);
        const row = Math.floor((yRung - 115 - G.top) / 115 + 0.001);
        if (row < 0 || row > 5) continue;
        for (const [p, col, w] of [[2, 0, 1], [1, 2, 0.55]]) {
          const [x, y, cw, ch] = SB.cell(p, col, row);
          k.fillStyle = U.rgba(C.gofun, 0.34 * a * w);
          k.fillRect(x, y, cw, ch);
        }
      }
    });
  }

  function drawB(ctx, T) {
    const cov = coverage(T);
    const dark = Math.max(cov, U.env(T, 148.5, 148.65, 151.95, 152.4) * 0.97);
    const climber = climberGeom(T);
    SB.draw(ctx, T, {
      between: {
        room: (c) => {
          SB.tokonomaShade(c, T, 0.95);
          // the sky behind the reeds: the moon, her last ascent, the pinpoint, the 叢雲
          SB.moonInWindow(c, T, { halo: 0.55 });
          climberInWindow(c, T, climber);
          kiraPin(c, T);
          drawClouds(c, T);
        },
        paper: (c) => {
          SB.light(c, T, { r: 260, falloff: 0.5, dim: dark });
          shadowsB(c, T);
          cellFlashes(c, T);
        },
        lattice: (c) => drawRibbon(c, T, climber),
      },
    });
  }

  /* ------------------------------------------------------------------ */
  /* Shot A′ (155–160): the colour drain                                 */
  /* ------------------------------------------------------------------ */
  const AP = { x: 1066, y: 950, s: 1.65, f: -1 };    // たけ, her back against the post, 小夜 in her lap (facing left)
  let figs = null;                                     // { k, colour, drained, childShadow, x, y, w, h }
  function buildFigures(k) {
    const x0 = 690, y0 = 640, w = 520, h = 330;        // logical box round the pair
    const mk = () => { const cv = B.canvas(Math.ceil(w * k), Math.ceil(h * k)); const cx = cv.getContext('2d'); cx.setTransform(k, 0, 0, k, -x0 * k, -y0 * k); return [cv, cx]; };
    const pal = { obijime: EBICHA };
    const [colour, cc] = mk();
    CAST.grandma(cc, AP.x, AP.y, AP.s, { pose: 'lap', facing: AP.f, t: 0.3, palette: pal });
    const [noChild, nc] = mk();
    CAST.grandma(nc, AP.x, AP.y, AP.s, { pose: 'lap', facing: AP.f, child: false, t: 0.3, palette: pal });
    const [drained, dc] = mk();
    CAST.grandma(dc, AP.x, AP.y, AP.s, { pose: 'lap', facing: AP.f, child: false, drained: true, ink: C.ginnezu, t: 0.3 });
    // the child's visible pixels = where the pair differs from たけ alone
    const W0 = colour.width, H0 = colour.height;
    const a = cc.getImageData(0, 0, W0, H0), bb = nc.getImageData(0, 0, W0, H0);
    const [mask, mc] = mk();
    const m = mc.createImageData(W0, H0);
    for (let i = 0; i < a.data.length; i += 4) {
      const d = Math.abs(a.data[i] - bb.data[i]) + Math.abs(a.data[i + 1] - bb.data[i + 1]) + Math.abs(a.data[i + 2] - bb.data[i + 2]) + Math.abs(a.data[i + 3] - bb.data[i + 3]);
      m.data[i] = m.data[i + 1] = m.data[i + 2] = 0;
      m.data[i + 3] = d > 24 ? 255 : 0;
    }
    mc.putImageData(m, 0, 0);
    // drained composite: drained たけ, then the child (in her colours) where she shows
    const kid = B.canvas(W0, H0);
    const kc = kid.getContext('2d');
    kc.drawImage(colour, 0, 0);
    kc.globalCompositeOperation = 'destination-in';
    kc.drawImage(mask, 0, 0);
    dc.save(); dc.setTransform(1, 0, 0, 1, 0, 0); dc.drawImage(kid, 0, 0); dc.restore();
    figs = { k, colour, drained, mask, x: x0, y: y0, w, h };
  }

  /** the A′ offerings: 三方 with fourteen dango, the jug of autumn grasses (colour) */
  function drawOfferingsA(c, T, shadowOnly) {
    const bx = 520, by = 944;
    const sway = Math.sin(T * 0.9) * 0.5;
    const s = 1.25;
    c.save();
    c.translate(bx, by); c.scale(s, s);
    const ink = U.rgba(C.sumi, 0.85);
    // 三方
    const wood = U.mix(C.kinari, C.odo, 0.3);
    const tray = () => { c.beginPath(); c.moveTo(-34, -30); c.lineTo(34, -30); c.lineTo(30, -24); c.lineTo(-30, -24); c.closePath(); };
    const base = () => { c.beginPath(); c.moveTo(-24, -24); c.lineTo(24, -24); c.lineTo(28, 0); c.lineTo(-28, 0); c.closePath(); };
    c.fillStyle = shadowOnly ? '#000' : wood;
    base(); c.fill(); tray(); c.fill();
    if (!shadowOnly) {
      c.strokeStyle = ink; c.lineWidth = 1.1;
      base(); c.stroke(); tray(); c.stroke();
      c.fillStyle = U.rgba(C.sumi, 0.75);
      c.beginPath(); c.ellipse(0, -12, 9, 4, 0, 0, U.TAU); c.fill();   // 繰形
    }
    // dango 9-4-1 (the top one stolen): three visible rows
    const r = 6.2;
    for (const [n, k] of [[3, 0], [2, 1], [1, 2]]) for (let i = 0; i < n; i++) {
      const cx = (i - (n - 1) / 2) * r * 2.05, cy = -30 - r - k * r * 1.55;
      c.fillStyle = shadowOnly ? '#000' : C.gofun;
      c.beginPath(); c.arc(cx, cy, r, 0, U.TAU); c.fill();
      if (!shadowOnly) { c.strokeStyle = U.rgba(C.sumi, 0.55); c.lineWidth = 0.8; c.stroke(); }
    }
    // the jug (鼠 glaze) with susuki, 萩, 女郎花, 桔梗
    const jx = 62;
    c.fillStyle = shadowOnly ? '#000' : U.mix(C.nezumi, C.sumi, 0.25);
    c.beginPath(); c.moveTo(jx - 10, 0); c.bezierCurveTo(jx - 22, -8, jx - 22, -34, jx - 8, -42); c.lineTo(jx - 7, -52); c.lineTo(jx + 7, -52); c.lineTo(jx + 8, -42);
    c.bezierCurveTo(jx + 22, -34, jx + 22, -8, jx + 10, 0); c.closePath(); c.fill();
    if (!shadowOnly) { c.strokeStyle = ink; c.lineWidth = 1; c.stroke(); c.strokeStyle = U.rgba(C.ginnezu, 0.5); c.beginPath(); c.moveTo(jx - 12, -30); c.quadraticCurveTo(jx - 14, -16, jx - 8, -6); c.stroke(); }
    const stemCol = shadowOnly ? '#000' : C.matsuba;
    for (const [a0, L] of [[-0.35, 120], [-0.05, 138], [0.2, 126], [0.45, 104]]) {
      const a = a0 + sway * 0.01;
      const tx = jx + Math.sin(a) * L, ty = -50 - Math.cos(a) * L;
      c.strokeStyle = stemCol; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(jx, -50); c.quadraticCurveTo(jx + Math.sin(a) * L * 0.4, -50 - L * 0.6, tx, ty); c.stroke();
      // plume
      c.strokeStyle = shadowOnly ? '#000' : U.rgba(C.susuki, 0.95);
      c.lineWidth = 1;
      for (let kk = 0; kk < 8; kk++) {
        const u = kk / 7;
        const px = U.lerp(jx + Math.sin(a) * L * 0.72, tx, u), py = U.lerp(-50 - Math.cos(a) * L * 0.72, ty, u);
        c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + 6, py + 2, px + 10 + kk * 0.6, py + 9); c.stroke();
      }
    }
    if (!shadowOnly) {
      // 萩 (small magenta clusters on an arching twig), 女郎花 (yellow dots), 桔梗 (violet stars)
      c.strokeStyle = C.matsuba; c.lineWidth = 1;
      c.beginPath(); c.moveTo(jx - 4, -50); c.quadraticCurveTo(jx - 40, -110, jx - 70, -80); c.stroke();
      const hg = B.qpts(jx - 4, -50, jx - 40, -110, jx - 70, -80, 10);
      for (let i = 3; i < hg.length; i++) {
        c.fillStyle = C.matsuba; c.beginPath(); c.ellipse(hg[i][0] - 3, hg[i][1] + 3, 3.2, 1.6, 0.6, 0, U.TAU); c.fill();
        if (i % 2) { c.fillStyle = C.hagi; c.beginPath(); c.arc(hg[i][0] + 1, hg[i][1] + 5, 2, 0, U.TAU); c.fill(); }
      }
      c.fillStyle = C.yamabuki;
      for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(jx + 20 + (i % 3) * 3, -118 + Math.floor(i / 3) * 3, 1.5, 0, U.TAU); c.fill(); }
      c.fillStyle = C.kikyo;
      for (const [sx, sy] of [[jx + 26, -96], [jx + 16, -104]]) {
        c.beginPath();
        for (let i = 0; i < 10; i++) { const rr = i % 2 ? 2 : 5; const an = (i / 10) * U.TAU; c.lineTo(sx + Math.cos(an) * rr, sy + Math.sin(an) * rr); }
        c.closePath(); c.fill();
      }
    }
    c.restore();
  }

  function drawAprime(ctx, T) {
    const k = ctx.canvas.width / 1920;
    if (!figs || Math.abs(figs.k - k) > 1e-6) buildFigures(k);
    SA.draw(ctx, T, {
      between: {
        post: (c) => {
          // floor shadows: the offerings and the child — never the grandmother
          SA.castShadow(c, T, (s2) => drawOfferingsA(s2, T, true), { baseY: 944, alpha: 0.55, pen: 1, len: 1.3 });
          SA.castShadow(c, T, (s2) => {
            s2.save();
            s2.drawImage(figs.mask, figs.x, figs.y, figs.w, figs.h);
            s2.restore();
          }, { baseY: 950, alpha: 0.6, pen: 1.2, len: 1.5 });
        },
        eave: (c) => {
          PRINT.with(c, 'K', T, (k2) => drawOfferingsA(k2, T, false));
          drainedPair(c, T);
        },
      },
    });
  }

  /** the pair, draining top → bottom (155.4–157.8) */
  function drainedPair(c, T) {
    const u = clamp01((T - 155.4) / 2.4);
    const yTop = 690, yBot = 956;
    const front = U.lerp(yTop - 30, yBot + 30, E.inOutSine(u));
    PRINT.with(c, 'K', T, (k2) => {
      k2.drawImage(figs.drained, figs.x, figs.y, figs.w, figs.h);
      if (u < 1) {
        // the colour survives below the front (feathered 40 px)
        const b = SB.shadowBuf(k2, 'drain');
        b.drawImage(figs.colour, figs.x, figs.y, figs.w, figs.h);
        b.globalCompositeOperation = 'destination-in';
        const g = b.createLinearGradient(0, front - 20, 0, front + 20);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,1)');
        b.fillStyle = g;
        b.fillRect(figs.x, figs.y, figs.w, figs.h);
        b.globalCompositeOperation = 'source-over';
        SB.shadowComposite(k2, T, 'drain', { tint: false, mode: 'source-over', plate: 'K' });
      }
    });
    // kira along the front, only on her
    if (u > 0 && u < 1) {
      PRINT.with(c, 'P8', T, (k2) => {
        k2.globalCompositeOperation = 'lighter';
        const r = U.rng(1557);
        for (let i = 0; i < 16; i++) {
          const x = U.lerp(1000, 1160, r());
          const tw = 0.5 + 0.5 * Math.sin(T * 9 + i * 2.1);
          k2.fillStyle = U.rgba(C.gofun, 0.7 * tw);
          k2.beginPath(); k2.arc(x, front + U.lerp(-8, 8, r()), U.lerp(0.8, 1.8, r()), 0, U.TAU); k2.fill();
        }
      });
    }
  }

  /* ------------------------------------------------------------------ */
  TSUKI.scene('ama-no-hagoromo', {
    init(S) {
      buildSilk();
      try { buildFigures(S.k || 1); } catch (e) { figs = null; }
    },
    draw(ctx, t, S) {
      const T = S.seg.start + t;
      ctx.imageSmoothingQuality = 'low';
      if (T < CUT) drawB(ctx, T);
      else drawAprime(ctx, T);
    },
  });
})(window.TSUKI);
