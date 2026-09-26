/* ==========================================================================
   07-atozuri.js — 六　後摺 (160–190): the same garden, pulled sixty years later.
     160.0–169.0  Shot A from the worn blocks (PRINT's jolt 160–160.6; the worn
                  blocks replace the fresh ones at the first peak of the shake):
                  flat sky, broken lines, reeds, the dry sōzu, a torn shoji — only
                  the moon fresh. A bent figure in the 波兎 haori on たけ's exact
                  path (old 小夜): fifteen dango, one per (partly silent) pluck.
                  (TSUKI.SHOTS.A.drawLate — a cached, aged snapshot after 160.62.)
     169.0–171.0  A′ insert: old hands pour two cups — the far one first (169.0),
                  then the near one (169.62), which steams; on the tick of the pot
                  set down (170.34) a hard cut to the untouched cup, a tiny moon
                  floating in its tea, held (a 2 % drift) to 171.0.
     171.0–173.0  A′ insert: the jug's susuki tied with a strip of the faded red
                  heko-obi — 退紅, hand-applied, overrunning its key line. It is 小夜.
                  The eye low at the boards: the offerings stand against the moonlit
                  paper; one 藍鼠 shadow block — the susuki's 影絵 on the shoji, and the
                  戸袋's hard diagonal across the boards, through the dango. Printed
                  once into a still at the camera's scale (a 2.40 → 2.66 lean in on
                  the strip); the colour plates' grain wear thinned to a third.
     173.0–182.0  月に雁: yellowed margins close to a tall 640 × 930 print over a 地
                  of paper (the subtitle sits there); flat pale 藍, the fresh moon
                  in its upper third, three geese descending steeply on bowed
                  paths toward a stand of reeds in the mist — the lead large and
                  low, the second across the moon's rim, the third small, high,
                  late and falling behind; 白居易's couplet is the DOM 画賛 in the
                  left margin (173.6–181.6). Margins open 181.4–182.
     182.0–190.0  A′: her old hands rise already joined in the fox window (墨
                  silhouettes against the moonlit paper, a 銀鼠 rim on the
                  moon side, pale knuckle creases; the 波兎 sleeves rising from
                  below the frame); inside the diamond the first impression still
                  plays at T − 150; 186–187 the little girl turns and looks out;
                  187 the andon goes out; 188 the hands tremble (the two arms against
                  each other, each hand whole, the fingers woven as CAST weaves
                  them); 189.1 she lets go — the left a beat before the right, the
                  fingers unhook, each hand turns outward and they part, the first
                  impression gone from between them — and they fall, still falling
                  (and opening) when the cut lands at 190.
   Uses TSUKI.SHOTS.A (shot-a.js) and TSUKI.SHOTS.A_prime (shot-a-prime.js; a
   local fallback of the A′ framing is drawn if that shot is missing).
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const U = TSUKI.U, B = TSUKI.B, C = TSUKI.C;
  const PRINT = TSUKI.PRINT, MOON = TSUKI.MOON;
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const E = U.ease;
  const SUSUDAKE = U.mix(C.odo, C.sumi, 0.55);
  const TEA = U.mix(C.koke, C.odo, 0.45);
  const CUES = () => TSUKI.CUES || {};

  const shotA = () => TSUKI.SHOTS.A;
  const hasAprime = () => PRINT.has('A_prime') && TSUKI.SHOTS.A_prime && TSUKI.SHOTS.A_prime.draw;
  const aged = (hex) => shotA().aged(hex);
  /** the late paper over the whole frame (the theatre builder's multiply foxing when present) */
  function ageAll(ctx, T, opts) {
    shotA().ageFrame(ctx, T, opts);
  }
  /**
   * The late paper for the camera-moving A′ inserts: the frame multiplied by
   * 鳥の子 (the moon exempt), and a few foxing stains printed in the scene's own
   * coordinates, so they travel with the paper under the camera.
   */
  const FOX_SPOTS = (() => { const r = U.rng(1601); const o = []; for (let i = 0; i < 26; i++) o.push([U.lerp(150, 1300, r()), U.lerp(600, 1080, r()), U.lerp(1.2, 5, Math.pow(r(), 2)), U.lerp(0.1, 0.22, r())]); return o; })();
  function ageInsert(ctx, cam, holes) {
    ctx.save();
    if (holes && holes.length) {
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      for (const [hx, hy, hr, hry] of holes) { ctx.moveTo(hx + hr, hy); ctx.ellipse(hx, hy, hr, hry == null ? hr : hry, 0, 0, TAU, true); }
      ctx.clip('evenodd');
    }
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = C.torinoko;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    camApply(ctx, cam);
    const ink = U.mix(C.odo, C.sumi, 0.45);
    for (const [x, y, r, a] of FOX_SPOTS) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, U.rgba(ink, a)); g.addColorStop(0.6, U.rgba(ink, a * 0.6)); g.addColorStop(1, U.rgba(ink, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* A′ (engawa in profile) — the theatre builder's master, or a local   */
  /* fallback of the same framing                                        */
  /* ------------------------------------------------------------------ */
  const camApply = (ctx, cam) => {
    ctx.translate(cam.to[0], cam.to[1]);
    ctx.scale(cam.scale, cam.scale);
    ctx.translate(-cam.about[0], -cam.about[1]);
  };
  const camPoint = (cam, x, y) => [cam.to[0] + (x - cam.about[0]) * cam.scale, cam.to[1] + (y - cam.about[1]) * cam.scale];
  /** key-line width factor for props drawn under a close insert camera: ≈1.6–2.5 px on screen, not base × zoom */
  const keyScale = (cam) => 1 / (Math.max(1, cam.scale) * 0.55);
  function fallbackAprime(ctx, T, opts) {
    ctx.save();
    if (opts.camera) camApply(ctx, opts.camera);
    const pen = shotA().livePen(ctx, T);
    pen('P7', (c) => { c.fillStyle = C.geppaku; c.fillRect(-400, 112, W + 800, 710); });
    pen('P1', (c) => {
      c.fillStyle = SUSUDAKE; c.fillRect(-400, 822, W + 800, 400);
      c.fillStyle = U.mix(SUSUDAKE, C.sumi, 0.35); c.fillRect(-400, 0, W + 800, 112); c.fillRect(1165, 112, 30, 900);
    });
    pen('K', (c) => {
      c.strokeStyle = U.rgba(C.sumi, 0.8);
      c.lineWidth = 1.2;
      for (let x = -70; x < W + 400; x += 330) { c.strokeRect(x, 172, 330, 628); for (let k = 1; k < 3; k++) { c.beginPath(); c.moveTo(x + 110 * k, 172); c.lineTo(x + 110 * k, 800); c.stroke(); } for (let k = 1; k < 6; k++) { c.beginPath(); c.moveTo(x, 172 + 105 * k); c.lineTo(x + 330, 172 + 105 * k); c.stroke(); } }
      for (let y = 850; y < 1200; y += 38) { c.beginPath(); c.moveTo(-400, y); c.lineTo(W + 400, y); c.stroke(); }
    });
    pen.flush();
    if (opts.between) for (const k of ['boards', 'post', 'eave']) if (opts.between[k]) { ctx.save(); opts.between[k](ctx, PRINT.state(T)); ctx.restore(); }
    ctx.restore();
    if (opts.age !== false) ageAll(ctx, T, { holes: opts.holes });
  }
  function drawAprime(ctx, T, opts) {
    if (hasAprime()) TSUKI.SHOTS.A_prime.draw(ctx, T, opts);
    else fallbackAprime(ctx, T, opts);
  }

  /* ------------------------------------------------------------------ */
  /* carved key lines for the close inserts                              */
  /* ------------------------------------------------------------------ */
  /**
   * A Path2D that also remembers its outline as polylines, so the same shape
   * can be filled (colour blocks) and cut as a key line whose width swells and
   * thins along it like a knife-cut line — instead of a uniform stroke that the
   * insert camera magnifies into a 4–5 px vector contour.
   */
  function carvePath() {
    const path = new Path2D(), subs = [];
    let cur = null, last = [0, 0];
    const begin = (x, y) => { cur = { pts: [[x, y]], closed: false }; subs.push(cur); last = [x, y]; };
    const push = (x, y) => { if (!cur) begin(last[0], last[1]); cur.pts.push([x, y]); last = [x, y]; };
    return {
      path, subs,
      moveTo(x, y) { path.moveTo(x, y); begin(x, y); },
      lineTo(x, y) { path.lineTo(x, y); push(x, y); },
      quadraticCurveTo(cx, cy, x, y) {
        path.quadraticCurveTo(cx, cy, x, y);
        const p0 = last;
        for (let i = 1; i <= 12; i++) { const t = i / 12, u = 1 - t; push(u * u * p0[0] + 2 * u * t * cx + t * t * x, u * u * p0[1] + 2 * u * t * cy + t * t * y); }
      },
      bezierCurveTo(ax, ay, bx, by, x, y) {
        path.bezierCurveTo(ax, ay, bx, by, x, y);
        const p0 = last;
        for (let i = 1; i <= 16; i++) {
          const t = i / 16, u = 1 - t;
          push(u * u * u * p0[0] + 3 * u * u * t * ax + 3 * u * t * t * bx + t * t * t * x, u * u * u * p0[1] + 3 * u * u * t * ay + 3 * u * t * t * by + t * t * t * y);
        }
      },
      ellipse(x, y, rx, ry, rot, a0, a1) {
        path.ellipse(x, y, rx, ry, rot, a0, a1);
        const cr = Math.cos(rot), sr = Math.sin(rot), n = Math.max(20, Math.ceil((rx + ry) * 0.8));
        const P = (a) => { const ex = Math.cos(a) * rx, ey = Math.sin(a) * ry; return [x + ex * cr - ey * sr, y + ex * sr + ey * cr]; };
        const s = P(a0);
        begin(s[0], s[1]);
        for (let i = 1; i <= n; i++) { const q = P(a0 + ((a1 - a0) * i) / n); push(q[0], q[1]); }
        if (Math.abs(a1 - a0) >= TAU - 1e-6) cur.closed = true;
      },
      rect(x, y, w, h) { path.rect(x, y, w, h); begin(x, y); push(x + w, y); push(x + w, y + h); push(x, y + h); cur.closed = true; },
      closePath() { path.closePath(); if (cur) { cur.closed = true; last = cur.pts[0]; cur = null; } },
    };
  }
  /**
   * Cut the key line of carvePath(s) `cps` in the current ink: width w (in the
   * ctx's units) swelling and thinning between 60 % and 100 % along the line,
   * open ends tapered; wk(x, y), if given, scales it along the outline (e.g.
   * heavier on the side away from the moon). One fill of quads with round
   * knuckles at the corners.
   */
  function carveLine(c, cps, w, seed, wk) {
    const out = new Path2D();
    let si = 0;
    for (const cp of Array.isArray(cps) ? cps : [cps]) for (const sp of cp.subs) {
      const pts = sp.pts;
      if (pts.length < 2) continue;
      if (sp.closed) { const a = pts[0], b = pts[pts.length - 1]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) > 1e-6) pts.push(a.slice()); }
      const L = [0];
      for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const tot = L[L.length - 1];
      if (tot < 1e-6) continue;
      const sd = seed * 13.7 + si++ * 5.3;
      const half = (i) => {
        let k = 0.8 + 0.2 * U.wobble(L[i] / 11 + sd, 917);
        if (wk) k *= wk(pts[i][0], pts[i][1]);        // the knife leaves more wood on the shadow side
        if (!sp.closed) k *= U.lerp(0.4, 1, U.smoothstep(0, Math.min(7, tot * 0.3), Math.min(L[i], tot - L[i])));
        return (w * k) / 2;
      };
      let pd = null;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
        if (l < 1e-6) continue;
        const nx = -dy / l, ny = dx / l, ha = half(i), hb = half(i + 1);
        out.moveTo(a[0] + nx * ha, a[1] + ny * ha);
        out.lineTo(b[0] + nx * hb, b[1] + ny * hb);
        out.lineTo(b[0] - nx * hb, b[1] - ny * hb);
        out.lineTo(a[0] - nx * ha, a[1] - ny * ha);
        out.closePath();
        // a knuckle where the line turns (same winding as the quads: the union fills)
        if (pd && pd[0] * dx / l + pd[1] * dy / l < 0.97) { out.moveTo(a[0] + ha, a[1]); out.arc(a[0], a[1], ha, 0, TAU, true); }
        pd = [dx / l, dy / l];
      }
    }
    c.fill(out);
  }

  /* ------------------------------------------------------------------ */
  /* A′ inserts: the offerings of the late night, at A′ scale            */
  /* ------------------------------------------------------------------ */
  const OS = { x: 1066, y: 950, s: 1.65 };     // old 小夜 on たけ's exact spot in A′ (cf. 五)
  const POT_DOWN = { x: 986, y: 958 };         // where the pot is set down, beside her knee

  function cupPath(x, y, w, h) {
    const p = carvePath();
    p.moveTo(x - w / 2, y - h);
    p.bezierCurveTo(x - w / 2 - 1, y - h * 0.4, x - w * 0.42, y - 1, x - w * 0.34, y);
    p.lineTo(x + w * 0.34, y);
    p.bezierCurveTo(x + w * 0.42, y - 1, x + w / 2 + 1, y - h * 0.4, x + w / 2, y - h);
    // left open: fills close it, but the key line must not cut across the mouth (the rim does)
    return p;
  }
  /** three threads of steam rising from a cup's rim (P7 胡粉); col lets a pre-aged frame keep its ink */
  function cupSteam(pen, T, x, top, steam, col) {
    pen('P7', (c) => {
      c.lineCap = 'round';
      for (let j = 0; j < 3; j++) {
        c.strokeStyle = U.rgba(col, 0.3 * Math.min(1, steam * 2) * (1 - j * 0.15));
        c.lineWidth = 2.2 - j * 0.4;
        c.beginPath();
        for (let i = 0; i <= 14; i++) {
          const s = i / 14;
          const px = x - 5 + j * 5 + Math.sin(s * 6 + T * 1.4 + j * 2.2) * 4 * s + s * 6;
          const py = top - 4 - s * (46 + j * 10) * steam;
          i ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.stroke();
      }
    });
  }
  /** a yunomi on the boards; tea level, optional steam; returns the tea surface */
  function drawCup(ctx, T, x, y, o) {
    const k = o.scale || 1;
    const w = 30 * k, h = 30 * k;
    const lw = o.lw || 1;                          // key-line scale under the insert camera
    const pen = shotA().livePen(ctx, T);
    const bodyC = cupPath(x, y, w, h), body = bodyC.path;
    const rim = carvePath();
    rim.ellipse(x, y - h, w / 2, 3.8 * k, 0, 0, TAU);
    const tea = new Path2D();
    tea.ellipse(x, y - h + 0.8 * k, w / 2 - 1.6 * k, 3.0 * k, 0, 0, TAU);
    const inside = new Path2D();
    inside.ellipse(x, y - h, w / 2 - 0.8 * k, 3.4 * k, 0, 0, TAU);
    pen('P1', (c) => {
      // a pale earthen yunomi (萩焼-like), its glaze pooling darker on the moon-shadow side
      c.fillStyle = U.mix(C.kinari, C.odo, 0.26); c.fill(body);
      c.save(); c.clip(body);
      c.fillStyle = U.mix(C.kinari, C.odo, 0.42); c.fillRect(x + w * 0.12, y - h - 2, w, h + 4);
      c.restore();
      c.fillStyle = U.mix(C.odo, C.sumi, 0.45); c.fill(inside);
      c.strokeStyle = U.rgba(U.mix(C.odo, C.sumi, 0.5), 0.7); c.lineWidth = 1.3 * k;
      c.beginPath(); c.moveTo(x - w / 2 + 1.5, y - h * 0.55); c.quadraticCurveTo(x, y - h * 0.5, x + w / 2 - 1.5, y - h * 0.58); c.stroke();
    });
    if (o.fill > 0) pen('P3', (c) => { c.globalAlpha *= o.fill; c.fillStyle = TEA; c.fill(tea); });
    pen('K', (c) => {
      c.fillStyle = U.rgba(C.sumi, 0.85); carveLine(c, [bodyC, rim], 1.1 * lw, x);
      c.fillStyle = U.rgba(C.sumi, 0.6); c.fillRect(x - w * 0.3, y - 1.2 * lw, w * 0.6, 1.4 * lw);
    });
    if (o.steam > 0) cupSteam(pen, T, x, y - h, o.steam, C.gofun);
    pen.flush();
    return { teaX: x, teaY: y - h + 0.8 * k, rx: w / 2 - 1.6 * k, ry: 3.0 * k };
  }
  /**
   * The 横手急須 (a side-handled teapot for two cups): a squat earthen body, a
   * tapering spout (−x), a low domed lid with its bud, and the side handle
   * turned toward us — held like a knife's haft, in line with the forearm,
   * when she pours. Drawn in its own frame (base centre at 0,0); the same pot
   * is poured from (169.0–170.3) and set down beside her knee (170.34).
   */
  const KYUSU = { lip: [-30.1, -19.5], root: [8, -10.2], end: [30, -3.8], grip: [24.2, -5.5] };   // the spout's lip; the handle's axis; where her fist closes on it
  function kyusu(ctx, T, lw) {
    const pen = shotA().livePen(ctx, T);
    const bodyC = carvePath();
    bodyC.moveTo(-11, 0); bodyC.lineTo(11, 0);
    bodyC.bezierCurveTo(18.5, -0.4, 21.6, -5.4, 21.1, -9.6);
    bodyC.bezierCurveTo(20.6, -14.6, 15.6, -18.1, 11, -18.6);
    bodyC.lineTo(-11, -18.6);
    bodyC.bezierCurveTo(-15.6, -18.1, -20.6, -14.6, -21.1, -9.6);
    bodyC.bezierCurveTo(-21.6, -5.4, -18.5, -0.4, -11, 0);
    bodyC.closePath();
    const spoutC = carvePath();
    spoutC.moveTo(-19.6, -4.6);
    spoutC.bezierCurveTo(-24.6, -7.2, -28.6, -12.6, -31.3, -18.5);
    spoutC.lineTo(-29.0, -20.5);
    spoutC.bezierCurveTo(-26.8, -15.9, -23.2, -12.7, -18.9, -12.3);
    spoutC.closePath();
    const lidC = carvePath();
    lidC.moveTo(-11, -18.6); lidC.bezierCurveTo(-8.6, -23.1, 8.6, -23.1, 11, -18.6); lidC.closePath();
    const knobC = carvePath();
    knobC.ellipse(0, -23.4, 2.5, 1.9, 0, 0, TAU);
    // the side handle, foreshortened toward us: a tapered haft and its cut end
    const handleC = carvePath(), capC = carvePath();
    {
      const [r0, e0] = [KYUSU.root, KYUSU.end];
      const dx = e0[0] - r0[0], dy = e0[1] - r0[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
      handleC.moveTo(r0[0] + nx * 2.6, r0[1] + ny * 2.6); handleC.lineTo(e0[0] + nx * 1.9, e0[1] + ny * 1.9);
      handleC.lineTo(e0[0] - nx * 1.9, e0[1] - ny * 1.9); handleC.lineTo(r0[0] - nx * 2.6, r0[1] - ny * 2.6); handleC.closePath();
      capC.ellipse(e0[0], e0[1], 1.1, 1.9, Math.atan2(dy, dx), 0, TAU);
    }
    const pc = U.mix(C.odo, C.sumi, 0.5);
    pen('P1', (c) => {
      c.fillStyle = pc; c.fill(bodyC.path); c.fill(spoutC.path);
      // the glaze pooled darker on the side away from the moon, a paler lip of unglazed clay at the foot
      c.save(); c.clip(bodyC.path);
      c.fillStyle = U.mix(pc, C.sumi, 0.3); c.fillRect(4, -26, 30, 30);
      c.fillStyle = U.mix(pc, C.kinari, 0.3); c.fillRect(-24, -2.6, 48, 3);
      c.restore();
      c.fillStyle = U.mix(pc, C.kinari, 0.22); c.fill(lidC.path); c.fill(knobC.path);
      c.fillStyle = U.mix(pc, C.sumi, 0.2); c.fill(handleC.path);
      c.fillStyle = U.mix(pc, C.kinari, 0.15); c.fill(capC.path);
    });
    pen('K', (c) => {
      c.fillStyle = U.rgba(C.sumi, 0.85);
      carveLine(c, [bodyC, spoutC, lidC, knobC], 1.1 * lw, 31);
      carveLine(c, [handleC, capC], 0.9 * lw, 37);
    });
    pen.flush();
  }
  /** the pot set down on the boards (upright) */
  function drawPot(ctx, T, x, y, lw = 1) {
    ctx.save();
    ctx.translate(x, y);
    kyusu(ctx, T, lw);
    ctx.restore();
  }

  /**
   * The still life of the late night, seen with the eye low — at the height of
   * the boards: the offerings stand near the sill and their tops rise against
   * the moonlit paper. The jug of susuki left of centre (its neck, where the
   * faded strip is tied, on the upper third), the 三方 with its fifteen dango
   * to the right, the lacquer box low and near on the left with the old bamboo
   * card leaning on it. Everything here is carved in stage coordinates and
   * printed once into insert 2's still (see stripStill); only the strip (hand-
   * applied after the print) and the paper's age are laid on live.
   */
  const OFFER_KEY = { jug: 1.25, sanbo: 1.1, box: 1.0, dango: 0.95 };   // key-line weights (× lw)
  const LATE_SHADE = U.mix(C.ai, C.nezumi, 0.5);                         // 藍鼠: the one shadow block
  const SHADE_A = 0.58;
  /** the key line heavier on the side away from the moon (the left), lighter where the moon strikes */
  const litSide = (x0, x1) => (x) => U.lerp(1.4, 0.62, U.clamp((x - x0) / (x1 - x0)));

  /**
   * The insert's moonlight: from the garden, off frame front right, a little
   * above the eaves (the moon is past the zenith, going west). Every object
   * throws one flat, hard 藍鼠 shadow up and to the left along the boards —
   * one shadow block, so overlapping shadows never print darker — and where
   * it reaches the sill it climbs the paper: the jug's susuki throw their 影絵
   * onto the shoji, as the cut-outs did in 三. On the right the 戸袋 (the
   * shutter box at the engawa's end, off frame) casts one hard diagonal
   * across the boards and straight up the paper, and it cuts the 三方 through
   * the stack of dango.
   * Boards (y ≥ SILL): a point h above its base (x, by) → (x − LA·h, by − LB·h).
   * Paper (y < SILL): for an object whose base is D = (by − SILL)/LK in front
   * of the sill, a pure shift (−LWX·D, SILL − by + LWY·D) — continuous with
   * the boards where they meet.
   */
  const SILL = 822, LA = 1.0, LB = 0.48, LK = 0.4, LWX = LK * LA / LB, LWY = LK / LB;
  const floorM = (by) => new DOMMatrix([1, 0, LA, LB, -LA * by, by * (1 - LB)]);
  const wallM = (by) => { const D = (by - SILL) / LK; return new DOMMatrix([1, 0, 0, 1, -LWX * D, SILL - by + LWY * D]); };

  const JUG = { x: 567, y: 858 };
  const SANBO = { x: 826, y: 850 };
  const BOX = { x: 420, y: 904 };
  const EDGE_X = SANBO.x + 4;                                  // the 戸袋's shadow on the 三方: its right part is dark
  const XW = EDGE_X - LA * (SANBO.y - SILL) / LB;               // …and on the paper, straight up from the sill
  const FAR = 1400;
  const DARK = (() => {                                        // the 戸袋's shadow (stage coords)
    const p = new Path2D();
    p.moveTo(XW, -400); p.lineTo(W + 800, -400); p.lineTo(W + 800, SILL + LB * FAR); p.lineTo(XW + LA * FAR, SILL + LB * FAR); p.lineTo(XW, SILL);
    p.closePath();
    return p;
  })();
  const LIT_FLOOR = (() => { const p = new Path2D(); p.moveTo(-800, SILL); p.lineTo(XW, SILL); p.lineTo(XW + LA * FAR, SILL + LB * FAR); p.lineTo(-800, SILL + LB * FAR); p.closePath(); return p; })();
  const LIT_WALL = (() => { const p = new Path2D(); p.rect(-800, -400, XW + 800, SILL + 400); return p; })();

  /**
   * One flat shadow block: paint(m) fills silhouettes (as many fills as it
   * likes, any opaque colour) into a mask the size of c's canvas under c's
   * transform; their union prints once, 藍鼠, multiplied.
   */
  function shadowBlock(c, paint, alpha) {
    const cv = B.canvas(c.canvas.width, c.canvas.height), m = cv.getContext('2d');
    m.setTransform(c.getTransform());
    m.fillStyle = '#000';
    m.strokeStyle = '#000';
    paint(m);
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = 'source-in';
    m.fillStyle = LATE_SHADE;
    m.fillRect(0, 0, cv.width, cv.height);
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'multiply';
    c.globalAlpha *= alpha;
    c.drawImage(cv, 0, 0);
    c.restore();
    cv.width = cv.height = 0;
  }

  let OFFER = null;
  /** the still life's shapes, carved once (stage coordinates) */
  function offerGeo() {
    if (OFFER) return OFFER;
    const G = {};
    /* the jug: a stoneware 壺 — high shoulders, a short neck with a rolled lip, a small foot; hand-thrown, a touch lopsided */
    {
      const { x: jx, y: jy } = JUG;
      const prof = [[0, 16.5], [-2.5, 18.8], [-7, 21.5], [-19, 28.6], [-33, 32.6], [-46, 33.2], [-57, 30.8], [-66, 25], [-72, 17.2], [-77, 11.4], [-84, 10.2], [-89.5, 11.6], [-93, 14]];
      const L = prof.map(([y, hw]) => [jx - hw, jy + y]);
      const R = prof.map(([y, hw]) => [jx + hw * 0.965 + 0.6, jy + y + 0.5 * (y / 93)]);
      const crPts = (pts) => {                     // Catmull-Rom through the profile → a smooth side
        const out = [];
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
          for (let j = 0; j < 6; j++) {
            const t = j / 6, t2 = t * t, t3 = t2 * t;
            out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
              0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
          }
        }
        out.push(pts[pts.length - 1].slice());
        return out;
      };
      const ls = crPts(L), rs = crPts(R);
      const body = carvePath();
      body.moveTo(ls[0][0], ls[0][1]);
      for (const p of ls.slice(1)) body.lineTo(p[0], p[1]);
      body.lineTo(rs[rs.length - 1][0], rs[rs.length - 1][1]);
      for (let i = rs.length - 2; i >= 0; i--) body.lineTo(rs[i][0], rs[i][1]);
      body.closePath();
      const mouth = carvePath();
      mouth.ellipse(jx + 0.3, jy - 93, 13.6, 3.3, 0, 0, TAU);
      // the foot ring's line and one throwing ridge on the shoulder (carved, not drawn)
      const ring = carvePath();
      ring.moveTo(jx - 18.5, jy - 3); ring.quadraticCurveTo(jx, jy - 1.4, jx + 18, jy - 2.6);
      const ridge = carvePath();
      ridge.moveTo(jx - 24, jy - 65); ridge.quadraticCurveTo(jx - 4, jy - 61.5, jx + 22, jy - 64.2);
      // the shadow plate: everything of the body but the moonlit side (a hard crescent on the left)
      const lit = new Path2D();
      lit.ellipse(jx + 15, jy - 48, 33, 54, 0, 0, TAU);
      // ビードロ: the kiln's ash glaze, pooled on the shoulder facing the fire, running down in tongues
      const glaze = new Path2D();
      const g0 = jy - 66;
      glaze.moveTo(jx - 26, g0 - 4); glaze.quadraticCurveTo(jx, g0 - 9, jx + 27, g0 - 5);
      for (const [dx, len, hw] of [[21, 16, 3.2], [11, 34, 4.2], [0, 12, 3], [-9, 27, 3.8], [-19, 10, 2.8]].map((a) => a)) {
        glaze.lineTo(jx + dx + hw, g0 + 3);
        glaze.bezierCurveTo(jx + dx + hw, g0 + len * 0.7, jx + dx + hw * 1.1, g0 + len, jx + dx, g0 + len + 1.6);
        glaze.bezierCurveTo(jx + dx - hw * 1.1, g0 + len, jx + dx - hw, g0 + len * 0.7, jx + dx - hw, g0 + 3);
      }
      glaze.lineTo(jx - 26, g0 + 2); glaze.closePath();
      // the moon's glint along the right shoulder
      const glint = new Path2D();
      glint.moveTo(jx + 20, jy - 66); glint.quadraticCurveTo(jx + 31, jy - 58, jx + 32.5, jy - 42);
      glint.quadraticCurveTo(jx + 29, jy - 55, jx + 20, jy - 66);
      G.jug = { body, mouth, ring, ridge, lit, glaze, glint, sil: body.path, wk: litSide(jx - 34, jx + 34) };
    }
    /* the susuki in the jug, grey in the late print (the warm and fresh blocks are gone): still, the room's air is still */
    {
      const { x: jx, y: jy } = JUG;
      const r = U.rng(606);
      const stems = new Path2D(), hairs = new Path2D(), hairsHi = new Path2D(), key = new Path2D(), leaves = new Path2D();
      const kiraPts = [];
      for (let i = 0; i < 6; i++) {
        const a = U.lerp(-0.42, 0.36, i / 5) + U.lerp(-0.05, 0.05, r());
        const L = U.lerp(150, 205, r());
        const bx = jx + U.lerp(-5, 5, r()), by = jy - 92;
        const tx = bx + Math.sin(a) * L, ty = by - Math.cos(a) * L;
        const cx = bx + Math.sin(a) * L * 0.4, cy = by - L * 0.55;
        stems.moveTo(bx - 1, by); stems.quadraticCurveTo(cx - 1, cy, tx, ty); stems.quadraticCurveTo(cx + 1, cy, bx + 1, by);
        key.moveTo(bx, by); key.quadraticCurveTo(cx, cy, tx, ty);
        const side = a < 0 ? -1 : 1;
        for (let k = 0; k < 14; k++) {
          const v = k / 13;
          const p = U.qbez([bx, by], [cx, cy], [tx, ty], U.lerp(1, 0.78, v));
          const th = a + side * U.lerp(0.1, 1.2, v) + U.lerp(-0.1, 0.1, r());
          const hl = L * U.lerp(0.26, 0.17, v);
          const ex = p[0] + Math.sin(th + side * 0.5) * hl, ey = p[1] - Math.cos(th + side * 0.5) * hl;
          const mx = p[0] + Math.sin(th) * hl * 0.55, my = p[1] - Math.cos(th) * hl * 0.55;
          const tgt = v < 0.4 && r() < 0.5 ? hairsHi : hairs;
          if (k % 3 === 1) kiraPts.push([U.lerp(p[0], ex, 0.6), U.lerp(p[1], ey, 0.6)]);
          const dx = ex - p[0], dy = ey - p[1], ll = Math.hypot(dx, dy) || 1, nx = (-dy / ll) * 1.4, ny = (dx / ll) * 1.4;
          tgt.moveTo(p[0], p[1]); tgt.quadraticCurveTo(mx + nx, my + ny, ex, ey); tgt.quadraticCurveTo(mx - nx, my - ny, p[0], p[1]);
          if (k % 2 === 0) { key.moveTo(p[0], p[1]); key.quadraticCurveTo(mx, my, ex, ey); }
        }
        if (i % 2 === 0) {
          const la = a + side * 0.9;
          leaves.moveTo(bx, by - 10); leaves.quadraticCurveTo(bx + Math.sin(la) * 40, by - 50, bx + Math.sin(la) * 70, by - 30);
          leaves.quadraticCurveTo(bx + Math.sin(la) * 36, by - 44, bx, by - 6);
        }
      }
      G.susuki = { stems, hairs, hairsHi, key, leaves, kiraPts };
    }
    /* the 三方, seen from the front: an 折敷 tray with its raised rim (隅切り: the cut corners show as
       two narrow faces) on a stand pierced by one horizontal pointed-oval 刳形 */
    {
      const { x: sx, y: sy } = SANBO;
      const rimC = carvePath();
      rimC.moveTo(sx - 40, sy - 60); rimC.lineTo(sx + 40, sy - 60); rimC.lineTo(sx + 40, sy - 47); rimC.lineTo(sx - 40, sy - 47); rimC.closePath();
      const cornC = carvePath();
      cornC.moveTo(sx - 40, sy - 60); cornC.lineTo(sx - 47, sy - 63); cornC.lineTo(sx - 47, sy - 50); cornC.lineTo(sx - 40, sy - 47); cornC.closePath();
      cornC.moveTo(sx + 40, sy - 60); cornC.lineTo(sx + 47, sy - 63); cornC.lineTo(sx + 47, sy - 50); cornC.lineTo(sx + 40, sy - 47); cornC.closePath();
      const floorC = carvePath();
      floorC.moveTo(sx - 47, sy - 63); floorC.lineTo(sx - 40, sy - 66); floorC.lineTo(sx + 40, sy - 66); floorC.lineTo(sx + 47, sy - 63); floorC.lineTo(sx + 40, sy - 60); floorC.lineTo(sx - 40, sy - 60); floorC.closePath();
      const standC = carvePath();
      standC.moveTo(sx - 29, sy - 47); standC.lineTo(sx + 29, sy - 47); standC.lineTo(sx + 33, sy); standC.lineTo(sx - 33, sy); standC.closePath();
      const holeC = carvePath();
      holeC.moveTo(sx - 15, sy - 23);
      holeC.bezierCurveTo(sx - 7, sy - 31, sx + 7, sy - 31, sx + 15, sy - 23);
      holeC.bezierCurveTo(sx + 7, sy - 15.5, sx - 7, sy - 15.5, sx - 15, sy - 23);
      holeC.closePath();
      // the grain of the 白木, cut in the key block: vertical on the stand, along the rim
      const grain = new Path2D(), gr = U.rng(4401);
      for (let i = 0; i < 7; i++) {
        const x0 = sx - 27 + i * 8.6 + gr() * 3, w = U.lerp(-1.6, 1.6, gr());
        const yTop = sy - 45, yBot = sy - 2;
        if (Math.abs(x0 - sx) < 17) { grain.moveTo(x0, yTop); grain.quadraticCurveTo(x0 + w, sy - 36, x0 + w * 0.5, sy - 30); grain.moveTo(x0 + w * 0.3, sy - 16); grain.quadraticCurveTo(x0 - w, sy - 9, x0 + (x0 - sx) * 0.1, yBot); }
        else { grain.moveTo(x0, yTop); grain.bezierCurveTo(x0 + w, sy - 32, x0 - w, sy - 16, x0 + (x0 - sx) * 0.13, yBot); }
      }
      for (const yy of [sy - 56, sy - 51.5]) { grain.moveTo(sx - 36, yy + gr()); grain.bezierCurveTo(sx - 12, yy - 1.2, sx + 10, yy + 1.2, sx + 36, yy + gr() - 0.5); }
      // fifteen dango (9 · 4 · 2) seen from the front: three on the tray and the row behind peeping
      // between them, two in the hollows, one on top
      const back = carvePath(), front = carvePath();
      const rr = 9.2, base = sy - 62 - rr + 1;
      const balls = [];
      const ball = (p, x, y, sc, back) => { p.moveTo(x + rr * sc, y); p.ellipse(x, y, rr * sc, rr * sc * 0.95, 0, 0, TAU); balls.push([x, y, rr * sc, back]); };
      ball(back, sx - 9.2, base - 5, 0.96, true); ball(back, sx + 9.2, base - 5, 0.96, true);
      for (const dx of [-18.4, 0, 18.4]) ball(front, sx + dx, base, 1);
      for (const dx of [-9.2, 9.2]) ball(front, sx + dx, base - 16, 1);
      ball(front, sx, base - 32, 1);
      const sil = new Path2D();
      for (const cp of [rimC, cornC, floorC, standC]) sil.addPath(cp.path);
      G.sanbo = { rimC, cornC, floorC, standC, holeC, grain, back, front, balls, sil, wk: litSide(sx - 47, sx + 47) };
    }
    /* the black-lacquer box of old paper cut-outs: flat 墨-lacquer (no 朱, no gloss), its lid a shade
       apart, 銀鼠 where the moon catches its edges, tied with a faded 真田紐 */
    {
      const { x: bx, y: by } = BOX;
      const box = carvePath(); box.rect(bx - 44, by - 30, 88, 30);
      const lid = carvePath(); lid.rect(bx - 47, by - 38, 94, 9);
      const hi = new Path2D();
      hi.rect(bx - 12, by - 38.6, 58.4, 1.5);                                  // the lid's top edge, toward the moon
      hi.rect(bx + 45.2, by - 37.6, 1.5, 7.6);                                 // its right end
      hi.rect(bx + 42.4, by - 28.8, 1.3, 27.8);                                // the body's right corner
      const cord = carvePath();
      cord.rect(bx + 10, by - 38.5, 3.6, 38.5);                               // one band down the front
      // a small flat 蝶結び on the lid's face: two short loops lying against it, two short tails
      const knot = carvePath();
      knot.moveTo(bx + 11.8, by - 34); knot.bezierCurveTo(bx + 7, by - 38.6, bx + 3.2, by - 35.6, bx + 4.2, by - 32.6); knot.bezierCurveTo(bx + 6.4, by - 31.2, bx + 9.4, by - 32.4, bx + 11.8, by - 34); knot.closePath();
      knot.moveTo(bx + 11.8, by - 34); knot.bezierCurveTo(bx + 16.6, by - 38.6, bx + 20.4, by - 35.6, bx + 19.4, by - 32.6); knot.bezierCurveTo(bx + 17.2, by - 31.2, bx + 14.2, by - 32.4, bx + 11.8, by - 34); knot.closePath();
      knot.moveTo(bx + 13.8, by - 34); knot.ellipse(bx + 11.8, by - 34, 2, 1.7, 0, 0, TAU);
      const tails = carvePath();
      tails.moveTo(bx + 10.8, by - 33); tails.quadraticCurveTo(bx + 8.4, by - 27, bx + 7.4, by - 21); tails.lineTo(bx + 9.2, by - 21.2); tails.quadraticCurveTo(bx + 10.2, by - 27, bx + 12, by - 32.6); tails.closePath();
      tails.moveTo(bx + 12.6, by - 33); tails.quadraticCurveTo(bx + 15, by - 28, bx + 15.6, by - 23.5); tails.lineTo(bx + 17.2, by - 23.8); tails.quadraticCurveTo(bx + 16.2, by - 28.4, bx + 13.8, by - 32.8); tails.closePath();
      const sil = new Path2D(); sil.addPath(box.path); sil.addPath(lid.path);
      G.box = { box, lid, hi, cord, knot, tails, sil, wk: litSide(bx - 47, bx + 47) };
    }
    return (OFFER = G);
  }
  /** the old 影絵 card of the bamboo grove, leaning on the lacquer box: flat 墨 paper on its stick */
  const CARD = { x: JUG.x - 50, y: JUG.y + 4, s: 0.19, rot: 0.3 };
  function cardAt(c, color) {
    const CAST = TSUKI.CAST;
    if (!CAST || !CAST.drawPuppet) return;
    c.save();
    c.translate(CARD.x, CARD.y);
    c.rotate(CARD.rot);
    CAST.drawPuppet(c, 'bamboo', 0, 0, CARD.s, { color, sticks: false, t: 0, wind: 0 });
    c.restore();
  }

  /** every object's cast shadow and the 戸袋's diagonal — one 藍鼠 block, printed through P4 */
  function offeringShadows(c) {
    const G = offerGeo();
    const casters = [
      { by: JUG.y, fill: (m) => { m.fill(G.jug.sil); m.fill(G.susuki.stems); m.fill(G.susuki.hairs); m.fill(G.susuki.hairsHi); m.fill(G.susuki.leaves); } },
      { by: SANBO.y, fill: (m) => { m.fill(G.sanbo.sil); m.fill(G.sanbo.back.path); m.fill(G.sanbo.front.path); } },
      { by: BOX.y, fill: (m) => { m.fill(G.box.sil); } },
      { by: CARD.y, fill: (m) => cardAt(m, '#000') },
    ];
    PRINT.with(c, 'P4', STILL_T, (k) => shadowBlock(k, (m) => {
      m.fill(DARK);
      for (const [clip, M] of [[LIT_FLOOR, floorM], [LIT_WALL, wallM]]) {
        for (const o of casters) {
          m.save();
          m.clip(clip);
          const d = M(o.by);
          m.transform(d.a, d.b, d.c, d.d, d.e, d.f);
          o.fill(m);
          m.restore();
        }
      }
    }, SHADE_A));
  }

  /**
   * The still life itself, printed plate by plate (lw: the key-line scale
   * under the insert camera): the 三方 and its dango, the jug of susuki, the
   * lacquer box and the card; each with one flat shadow plate on the side
   * away from the moon, and the 戸袋's shadow over the right of the 三方.
   */
  function drawLateOfferings(ctx, T, lw = 1) {
    const A = shotA(), G = offerGeo();
    let pen = A.livePen(ctx, T);
    const inkK = U.rgba(C.sumi, 0.88);
    /* the 三方 and the dango (furthest back) */
    {
      const S = G.sanbo;
      const wood = U.mix(C.kinari, C.odo, 0.3);
      pen('P1', (c) => {
        c.fillStyle = wood; c.fill(S.standC.path);
        c.fillStyle = U.mix(C.kinari, C.odo, 0.2); c.fill(S.rimC.path);
        c.fillStyle = U.mix(wood, C.sumi, 0.12); c.fill(S.cornC.path);
        c.fillStyle = U.mix(C.kinari, C.odo, 0.14); c.fill(S.floorC.path);
        c.fillStyle = U.mix(C.odo, C.sumi, 0.6); c.fill(S.holeC.path);
      });
      pen('K', (c) => {
        c.fillStyle = inkK; carveLine(c, [S.rimC, S.cornC, S.floorC, S.standC, S.holeC], OFFER_KEY.sanbo * lw, SANBO.x, S.wk);
        c.strokeStyle = U.rgba(C.sumi, 0.22); c.lineWidth = 0.55 * lw; c.lineCap = 'round'; c.stroke(S.grain);
      });
      // the left cut corner and the stand's left edge turn from the moon: one shadow plate
      pen('P4', (c) => {
        c.globalCompositeOperation = 'multiply';
        c.fillStyle = U.rgba(LATE_SHADE, 0.34);
        c.fill(S.cornC.path);
        c.save(); c.clip(S.standC.path);
        c.beginPath(); c.moveTo(SANBO.x - 34, SANBO.y - 48); c.lineTo(SANBO.x - 24, SANBO.y - 48); c.lineTo(SANBO.x - 27, SANBO.y + 1); c.lineTo(SANBO.x - 34, SANBO.y + 1); c.fill();
        c.restore();
      });
      pen.flush();
      // the dango: the row behind first, then the front of the stack; each carries a karazuri — a blind-
      // embossed rim, a hair of light above-right (toward the moon), of shade below-left — and one flat
      // crescent of shadow on its lower left
      const dango = (path, balls, fill, seed) => {
        pen('P7', (c) => {
          c.fillStyle = fill; c.fill(path.path);
          c.lineCap = 'round';
          for (const [x, y, r] of balls) {
            c.strokeStyle = U.rgba(C.gofun, 0.9); c.lineWidth = 1.0 * lw;
            c.beginPath(); c.arc(x + 0.3 * lw, y - 0.35 * lw, r - 1.1 * lw, Math.PI * 1.45, Math.PI * 1.95); c.stroke();
          }
        });
        pen('P4', (c) => {
          c.globalCompositeOperation = 'multiply';
          c.fillStyle = U.rgba(LATE_SHADE, 0.3);
          for (const [x, y, r] of balls) {
            c.save();
            c.beginPath(); c.ellipse(x, y, r, r * 0.95, 0, 0, TAU); c.clip();
            c.beginPath(); c.rect(x - r - 2, y - r - 2, 2 * r + 4, 2 * r + 4); c.ellipse(x + r * 0.3, y - r * 0.3, r * 0.98, r * 0.93, 0, 0, TAU);
            c.fill('evenodd');
            c.restore();
          }
        });
        pen('K', (c) => { c.fillStyle = inkK; carveLine(c, path, OFFER_KEY.dango * lw, seed, S.wk); });
        pen.flush();
      };
      dango(S.back, S.balls.filter((b) => b[3]), U.mix(C.gofun, C.torinoko, 0.45), SANBO.x + 1);
      dango(S.front, S.balls.filter((b) => !b[3]), U.mix(C.gofun, C.torinoko, 0.2), SANBO.x + 2);
    }
    /* the jug and its susuki */
    {
      const J = G.jug, Su = G.susuki, jx = JUG.x;
      pen('P3', (c) => { c.fillStyle = U.mix(C.matsuba, C.nezumi, 0.45); c.fill(Su.leaves); });
      pen('P4', (c) => { c.fillStyle = U.mix(C.nezumi, C.rikyu, 0.45); c.fill(Su.stems); c.fillStyle = C.ginnezu; c.fill(Su.hairs); });
      pen('P7', (c) => { c.fillStyle = U.mix(C.gofun, C.ginnezu, 0.3); c.fill(Su.hairsHi); });
      pen('K', (c) => { c.strokeStyle = U.rgba(C.sumi, 0.72); c.lineWidth = 0.85 * lw; c.lineCap = 'round'; c.stroke(Su.key); });
      pen('P4', (c) => {
        // 鼠 stoneware, flat; the ash glaze a cooler grey-green on the shoulder
        c.fillStyle = U.mix(C.nezumi, C.kinari, 0.12); c.fill(J.body.path);
        c.save(); c.clip(J.body.path);
        c.fillStyle = U.rgba(U.mix(C.matsuba, C.nezumi, 0.55), 0.85); c.fill(J.glaze);
        c.restore();
        c.fillStyle = U.mix(C.nezumi, C.sumi, 0.62); c.fill(J.mouth.path);
      });
      pen('P7', (c) => { c.fillStyle = U.rgba(C.gofun, 0.55); c.fill(J.glint); });
      pen.flush();
      // the jug's shadow plate: a hard crescent down its left side (and the neck's), away from the moon
      pen('P4', (c) => {
        c.globalCompositeOperation = 'multiply';
        c.fillStyle = U.rgba(LATE_SHADE, 0.5);
        c.save(); c.clip(J.body.path);
        const p = new Path2D(); p.rect(jx - 60, JUG.y - 120, 120, 130); p.addPath(J.lit);
        c.fill(p, 'evenodd');
        c.restore();
      });
      pen('K', (c) => {
        c.fillStyle = inkK;
        carveLine(c, [J.body, J.mouth], OFFER_KEY.jug * lw, jx, J.wk);
        c.fillStyle = U.rgba(C.sumi, 0.6);
        carveLine(c, [J.ring, J.ridge], 0.55 * lw, jx + 3, J.wk);
      });
      // kira-zuri: mica dusted on the plumes (a few fixed flecks)
      pen('P8', (c) => {
        const kr = U.rng(6061), mica = new Path2D();
        for (const p of Su.kiraPts) { if (kr() < 0.55) { const r2 = U.lerp(0.5, 1.2, kr()) * lw; mica.moveTo(p[0] + r2, p[1]); mica.arc(p[0], p[1], r2, 0, TAU); } }
        c.fillStyle = 'rgba(255,253,244,0.3)';
        c.fill(mica);
      });
      pen.flush();
    }
    /* the lacquer box (nearest) and the old card leaning on it */
    {
      const Bx = G.box;
      pen('P4', (c) => {
        c.fillStyle = U.mix(C.sumi, C.enji, 0.07); c.fill(Bx.box.path);
        c.fillStyle = U.mix(U.mix(C.sumi, C.enji, 0.08), C.nezumi, 0.12); c.fill(Bx.lid.path);
        c.fillStyle = U.mix(C.ginnezu, C.kinari, 0.15); c.fill(Bx.hi);
        c.fillStyle = U.mix(U.mix(C.ai, C.nezumi, 0.55), C.sumi, 0.25); c.fill(Bx.cord.path); c.fill(Bx.knot.path); c.fill(Bx.tails.path);
      });
      pen('K', (c) => {
        c.fillStyle = U.rgba(C.sumi, 0.92); carveLine(c, [Bx.box, Bx.lid], OFFER_KEY.box * lw, BOX.x, Bx.wk);
        c.fillStyle = U.rgba(C.sumi, 0.7); carveLine(c, [Bx.cord, Bx.knot, Bx.tails], 0.6 * lw, BOX.x + 5);
      });
      pen.flush();
      PRINT.with(ctx, 'K', T, (c) => cardAt(c, U.mix(C.sumi, C.odo, 0.12)));
    }
    /* the 戸袋's shadow falls across the right of the 三方 and its dango (the same block as the boards') */
    PRINT.with(ctx, 'P4', T, (k) => shadowBlock(k, (m) => {
      m.beginPath(); m.rect(EDGE_X, SANBO.y - 140, 120, 160); m.clip();
      m.fill(G.sanbo.sil); m.fill(G.sanbo.back.path); m.fill(G.sanbo.front.path);
    }, SHADE_A));
  }
  /** 退紅: a strip torn from the heko-obi, tied round the stems — hand-applied, overrunning the key line */
  function drawStrip(ctx, T, a, lw = 1) {
    const { x: jx, y: jy } = JUG;
    const y = jy - 110;
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.fillStyle = U.rgba(C.toki, 0.95);
    // the wrap
    ctx.beginPath();
    ctx.moveTo(jx - 12, y - 3); ctx.quadraticCurveTo(jx, y - 7, jx + 12, y - 4);
    ctx.lineTo(jx + 12.5, y + 5); ctx.quadraticCurveTo(jx, y + 2, jx - 12.5, y + 6);
    ctx.closePath();
    ctx.fill();
    // the knot and two frayed tails, lifting a little in the air
    const sw = Math.sin(T * 1.1) * 1.5;
    ctx.beginPath();
    ctx.ellipse(jx + 12, y + 1, 4.5, 4, 0.3, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(jx + 14, y); ctx.bezierCurveTo(jx + 24, y + 4 + sw, jx + 28, y + 16, jx + 34 + sw, y + 26);
    ctx.lineTo(jx + 30 + sw, y + 28); ctx.bezierCurveTo(jx + 24, y + 18, jx + 20, y + 8, jx + 13, y + 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(jx + 14, y + 2); ctx.bezierCurveTo(jx + 20, y + 10, jx + 19, y + 22, jx + 22 + sw * 0.6, y + 34);
    ctx.lineTo(jx + 18 + sw * 0.6, y + 35); ctx.bezierCurveTo(jx + 15, y + 22, jx + 15, y + 11, jx + 12, y + 5);
    ctx.closePath();
    ctx.fill();
    // the faded shibori: rings of paler dye
    ctx.fillStyle = U.rgba(C.gofun, 0.35);
    for (const [dx, dy] of [[-6, 0], [2, -1], [9, 1], [26, 17], [19, 25]]) { ctx.beginPath(); ctx.ellipse(jx + dx, y + dy, 1.6, 1.1, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
    // its key line, printed where the colour was meant to go (the hand overran it)
    ctx.save();
    ctx.globalAlpha *= a * 0.6;
    ctx.strokeStyle = U.rgba(C.sumi, 0.7);
    ctx.lineWidth = 0.9 * lw;
    ctx.beginPath();
    ctx.moveTo(jx - 11, y - 1); ctx.quadraticCurveTo(jx, y - 5, jx + 11, y - 2);
    ctx.moveTo(jx - 11, y + 4.5); ctx.quadraticCurveTo(jx, y + 1.5, jx + 11, y + 3.5);
    ctx.stroke();
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* old 小夜 at A′ scale                                                */
  /* ------------------------------------------------------------------ */
  /**
   * She holds still through the insert, so each pose is carved once into a
   * sprite at the insert's closest zoom. CAST cuts its key line ≈2.5 px wide
   * at the figure's own scale; under the 2.3–4.7× insert camera that printed
   * 6–12 px lines beside the cups' 2 px ones. So each pose is carved m times
   * larger on a canvas scaled 1/m (the same figure, its line m× finer), m
   * being the camera the pose is seen through — the lines land ≈2–3 px on
   * screen, like the props'.
   * CAST's own pot and its round stand-in hand are cut out of the sprite:
   * the 急須 is drawn live and tips as she pours, and the hand is drawn live
   * (oldHand) — closed round the pot's handle, then open as she lets it go.
   */
  const FIG_ZOOM = 4.8;
  const FIG_LINE = { pour: 3.0, seiza: 4.6 };       // m: the camera scale each pose's key line is cut for
  const FOREARM = { pour: 1.72, seiza: 1.25 };      // CAST's forearm angle for the pose (grandmaPose armN[1], from straight down)
  const DISC = { pour: 9, seiza: 10 };              // CAST's stand-in hand (handPath len; always the closed grip)
  const FIG_PAL = () => ({ obijime: U.mix(C.kon, C.ginnezu, 0.3) });
  const figCache = {};
  /** CAST at m× on a canvas scaled 1/m; the near hand back in stage px */
  function castFig(g, pose, m, extra) {
    g.save();
    g.scale(1 / m, 1 / m);
    const r = TSUKI.CAST.oldSayo(g, OS.x * m, OS.y * m, OS.s * m, Object.assign({ pose, facing: -1, t: 0, stream: false, palette: FIG_PAL() }, extra || {}));
    g.restore();
    return r && r.hand ? [r.hand[0] / m, r.hand[1] / m] : null;
  }
  /** the near wrist: h at the cuff's centre, u out of the cuff along the forearm, v toward the palm */
  function wristFrame(h, pose) {
    const a = FOREARM[pose];
    const u = [-Math.sin(a), Math.cos(a)];            // facing −1 mirrors CAST's forearm
    let v = [-u[1], u[0]];
    if (v[1] < 0) v = [-v[0], -v[1]];
    return { h, u, v };
  }
  const inFrame = (c, F) => c.transform(F.u[0], F.u[1], F.v[0], F.v[1], F.h[0], F.h[1]);
  /** a closed Catmull-Rom path through pts (as cast.js draws its shapes) */
  function crPath(pts) {
    const p = new Path2D(), n = pts.length, k = 1 / 6, get = (i) => pts[(i + n) % n];
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
    }
    p.closePath();
    return p;
  }
  /** a band over the key lines of CAST's 'pour' pot (body, spout, bail), in its own frame at the hand */
  function castPotBand(g, hand) {
    const hl = [(OS.x - hand[0]) / OS.s, (hand[1] - OS.y) / OS.s];
    g.save();
    g.translate(OS.x, OS.y);
    g.scale(-OS.s, OS.s);
    g.translate(hl[0] + 6, hl[1] - 2);
    g.rotate(0.55);
    g.strokeStyle = '#000';
    g.lineCap = 'round';
    g.lineJoin = 'round';
    // the body's outline crosses the sleeve: a band only as wide as the line (and its
    // anti-aliasing), so the sleeve's own key line keeps all but the crossing points
    g.lineWidth = 0.95;
    g.stroke(crPath([[-12, -8], [12, -8], [15, 2], [11, 12], [-11, 12], [-15, 2]]));
    // the bail and the spout hang over the bare boards: generous bands
    g.lineWidth = 2.2;
    const bail = new Path2D();
    bail.moveTo(-10, -8); bail.bezierCurveTo(-10, -22, 10, -22, 10, -8);
    g.stroke(bail);
    const spout = new Path2D();
    spout.moveTo(11, 0); spout.lineTo(20, -4); spout.lineTo(25.4, -7.3);
    g.lineWidth = 7.2;
    g.stroke(spout);
    g.restore();
  }
  function figSprite(c, pose) {
    const cw = c.canvas.width, key = pose + '|' + cw;
    if (figCache[key]) return figCache[key];
    const CAST = TSUKI.CAST;
    const bb = CAST.bounds('oldSayo', pose, {});
    const x0 = OS.x - (bb[0] + bb[2]) * OS.s - 6, y0 = OS.y + bb[1] * OS.s - 6;   // facing −1 mirrors the box
    const w = bb[2] * OS.s + 12, h = bb[3] * OS.s + 12;
    const k = (cw / W) * FIG_ZOOM, pw = Math.ceil(w * k), ph = Math.ceil(h * k);
    const mk = () => { const cv = B.canvas(pw, ph), g = cv.getContext('2d'); g.setTransform(k, 0, 0, k, -x0 * k, -y0 * k); return [cv, g]; };
    const put = (dst, src, op) => { dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.globalCompositeOperation = op; dst.drawImage(src, 0, 0); dst.restore(); };
    const m = FIG_LINE[pose];
    const [cv, g] = mk();
    let hand;
    if (pose === 'pour') {
      // her pot is not CAST's: print it unfilled, and lift its key lines out
      // with a band of the unlined impression, so the sleeve runs on beneath
      const pal = Object.assign(FIG_PAL(), { pot: 'rgba(0,0,0,0)' });
      hand = castFig(g, pose, m, { palette: pal });
      const [cvB, gB] = mk(), [cvM, gM] = mk();
      castFig(gB, pose, m, { palette: pal, outline: 0 });
      castPotBand(gM, hand);
      put(gB, cvM, 'destination-in');
      put(g, cvM, 'destination-out');
      put(g, cvB, 'lighter');
      cvB.width = cvB.height = cvM.width = cvM.height = 0;
    } else hand = castFig(g, pose, m);
    // CAST's round stand-in hand, cut away beyond the cuff
    const F = wristFrame(hand, pose), L = DISC[pose] * 0.62;
    g.save();
    inFrame(g, F);
    g.beginPath(); g.rect(0.1, -40, 60, 80); g.clip();
    g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.ellipse(L * 0.42 * OS.s, 0, L * 0.52 * OS.s + 1.9, DISC[pose] * 0.27 * OS.s + 1.9, 0, 0, TAU); g.fill();
    g.restore();
    return (figCache[key] = { cv, x0, y0, w, h, hand, m });
  }

  /**
   * Her old hand, from the cuff: 'pour' closed round the pot's side handle
   * like a knife's haft, the thumb laid along it toward the lid; 'seiza' open
   * and loose, fingers falling, the moment after she lets the pot go.
   * In the wrist frame (x out of the cuff, y toward the palm), key line kw.
   */
  const HAND = {
    // the knife-haft grip seen from the little-finger side: the back of the hand, the knuckle
    // row, four fingers wrapped under the handle (four bumps and their creases), the thumb
    // laid forward along the top of the handle
    pour: {
      shape: [[-5, -4.3], [[0, -4.9], [5, -5.3], [9, -5.0]], [[11, -4.8], [12.8, -4.0], [13.4, -2.4]], [[13.7, -1.4], [13.6, 1.4], [13.3, 2.4]],
        [[13.0, 3.9], [12.3, 5.2], [11.0, 5.4]], [[10.2, 5.5], [9.8, 5.0], [9.4, 5.2]], [[8.8, 5.7], [7.6, 5.8], [6.9, 5.2]],
        [[6.5, 4.8], [6.1, 5.0], [5.6, 5.1]], [[4.9, 5.4], [3.9, 5.3], [3.4, 4.8]], [[3.1, 4.5], [2.6, 4.6], [2.2, 4.6]],
        [[1.3, 4.6], [-1, 4.2], [-5, 4.2]]],
      thumb: [[5.4, -4.9], [[8.6, -6.0], [13.4, -5.2], [16.8, -3.4]], [[18.0, -2.8], [17.8, -1.5], [16.6, -1.4]], [[14.6, -1.4], [12.2, -2.4], [9.6, -2.5]]],
      lines: [[[9.6, 5.1], [9.7, 4.4], [9.8, 3.8], [9.9, 3.1]], [[6.1, 4.9], [6.2, 4.3], [6.2, 3.8], [6.3, 3.3]], [[2.8, 4.6], [2.9, 4.1], [2.9, 3.8], [3.0, 3.4]],
        [[13.0, -2.4], [11.9, -1.2], [11.5, 1.0], [11.8, 2.9]]],
      knuckles: [[9.0, -4.9], [6.8, -5.1]],
      spot: [3.2, -2.8],
    },
    // loose, the moment after she lets the pot go: palm down, the fingers together
    // and falling a little, their tips staggered, the thumb's tip just under the palm
    seiza: {
      shape: [[-5, -3.6], [[0, -4.1], [4.4, -4.3], [7.2, -3.8]], [[10.2, -3.3], [13.2, -2.2], [15.4, -0.9]],
        [[16.7, -0.2], [17.9, 0.4], [17.6, 1.2]], [[17.3, 1.9], [16.5, 1.9], [15.9, 1.7]],
        [[16.8, 2.2], [17.6, 2.9], [17.2, 3.7]], [[16.8, 4.3], [16.0, 4.0], [15.4, 3.9]],
        [[16.1, 4.4], [16.6, 5.1], [16.1, 5.6]], [[15.6, 6.1], [14.6, 5.7], [13.6, 5.3]],
        [[12.2, 4.8], [11.0, 4.6], [10.0, 4.6]], [[9.2, 4.7], [8.8, 5.5], [8.0, 5.7]],
        [[7.1, 5.9], [6.3, 5.3], [5.8, 4.6]], [[5.0, 3.9], [1, 3.6], [-5, 3.6]]],
      thumb: null,
      lines: [[[15.9, 1.7], [14.4, 1.2], [12.8, 0.5], [11.2, -0.3]], [[15.4, 3.9], [14.0, 3.3], [12.6, 2.6], [11.0, 2.0]],
        [[13.1, -2.2], [13.3, -1.6], [13.3, -1.0], [13.1, -0.5]]],
      knuckles: [[7.2, -3.8], [5.4, -4.1]],
      spot: [3.8, -2.3],
    },
  };
  const HAND_K = 1.15;                              // the hand drawings' size (old hands, at the figure's scale)
  const bez = (p, spec) => {
    p.moveTo(spec[0][0], spec[0][1]);
    for (let i = 1; i < spec.length; i++) { const [a, b, e] = spec[i]; p.bezierCurveTo(a[0], a[1], b[0], b[1], e[0], e[1]); }
    p.closePath();
    return p;
  };
  function oldHand(c, T, F, pose, kw, bend) {
    const H0 = HAND[pose];
    const skin = (TSUKI.CAST.palettes && TSUKI.CAST.palettes.oldSayo && TSUKI.CAST.palettes.oldSayo.skin) || U.mix(C.gofun, C.kitsune, 0.22);
    const hand = bez(new Path2D(), H0.shape), thumb = H0.thumb ? bez(new Path2D(), H0.thumb) : null;
    const inner = new Path2D();
    for (const [a, b, d, e] of H0.lines) { inner.moveTo(a[0], a[1]); inner.bezierCurveTo(b[0], b[1], d[0], d[1], e[0], e[1]); }
    for (const [x, y] of H0.knuckles) { inner.moveTo(x - 0.8, y + 0.5); inner.quadraticCurveTo(x, y - 0.5, x + 0.8, y + 0.6); }
    // the creases where the wrist leaves the cuff
    inner.moveTo(1.4, -3.6); inner.quadraticCurveTo(1.9, -2.8, 1.8, -1.9);
    PRINT.with(c, 'K', T, (k) => {
      k.save();
      inFrame(k, F);
      // nothing of the hand inside the sleeve
      k.beginPath(); k.rect(0, -30, 60, 60); k.clip();
      if (bend) { k.translate(1.5, 0); k.rotate(bend); k.translate(-1.5, 0); }
      k.scale(HAND_K, HAND_K);
      k.lineJoin = 'round'; k.lineCap = 'round';
      k.fillStyle = skin;
      k.fill(hand);
      if (thumb) k.fill(thumb);
      k.fillStyle = U.mix(skin, C.odo, 0.45);
      k.beginPath(); k.ellipse(H0.spot[0], H0.spot[1], 0.7, 0.5, 0.3, 0, TAU); k.fill();
      k.strokeStyle = U.rgba(C.sumi, 0.85);
      k.lineWidth = kw / HAND_K;
      k.stroke(hand);
      if (thumb) k.stroke(thumb);
      k.strokeStyle = U.rgba(C.sumi, 0.7);
      k.lineWidth = (kw * 0.55) / HAND_K;
      k.stroke(inner);
      k.restore();
      // the cuff's edge again, across the wrist (the stand-in hand had covered it)
      k.save();
      inFrame(k, F);
      k.strokeStyle = U.rgba(C.sumi, 0.85);
      k.lineWidth = kw;
      k.lineCap = 'round';
      k.beginPath(); k.moveTo(0, -4.4); k.lineTo(0, 4.4); k.stroke();
      k.restore();
    });
  }
  /** the pot's tilt (rad, − = the spout dips): tipped for each pour, eased back up between and after */
  function potTilt(T, tea) {
    const s = E.inOutSine;
    const a = Math.max(U.env(T, tea[0] - 0.3, tea[0] + 0.06, tea[0] + 0.44, tea[0] + 0.6, s), U.env(T, tea[1] - 0.1, tea[1] + 0.06, tea[1] + 0.44, tea[1] + 0.62, s));
    return -0.3 + (TILT_POUR + 0.3) * a;
  }
  /**
   * old 小夜 in the insert: the carved sprite, then (pouring) the 急須 turning
   * in her fist about the wrist, and the live hand. Returns the spout's lip.
   */
  function drawOldSayoA(c, T, pose, lw, tilt) {
    const f = figSprite(c, pose);
    PRINT.with(c, 'K', T, (k) => {
      k.imageSmoothingEnabled = true;
      k.imageSmoothingQuality = 'low';
      k.drawImage(f.cv, f.x0, f.y0, f.w, f.h);
    });
    const F = wristFrame(f.hand, pose), kw = 2.5 / f.m;
    if (pose !== 'pour') { oldHand(c, T, F, pose, kw, 0); return null; }
    const P = potPose(F, tilt);
    c.save();
    c.translate(P.O[0], P.O[1]);
    c.rotate(tilt);
    kyusu(c, T, lw);
    c.restore();
    // the bend is a rotation in stage space: in the (mirrored) wrist frame it turns the other way
    oldHand(c, T, F, pose, kw, P.bend * (F.u[0] * F.v[1] - F.u[1] * F.v[0]));
    return P.lip;
  }
  /**
   * The 急須 in her fist at a tilt (rad, − = the spout dips): the fist turns
   * about the wrist with the pot, its grip on the handle's axis; the pot hangs
   * from the fist. → { O (the pot's base centre), bend, lip }.
   */
  function potPose(F, tilt) {
    const hd = [KYUSU.end[0] - KYUSU.root[0], KYUSU.end[1] - KYUSU.root[1]];
    const bend = tilt + Math.atan2(hd[1], hd[0]) - Math.atan2(-F.u[1], -F.u[0]);
    const piv = [F.h[0] + F.u[0] * 1.5, F.h[1] + F.u[1] * 1.5];
    const gx = 7 * HAND_K - 1.5, g0 = [F.u[0] * gx, F.u[1] * gx];   // the grip: x 7 of the fist
    const cb = Math.cos(bend), sb = Math.sin(bend), ct = Math.cos(tilt), st = Math.sin(tilt);
    const G = [piv[0] + g0[0] * cb - g0[1] * sb, piv[1] + g0[0] * sb + g0[1] * cb];
    const R = (p) => [p[0] * ct - p[1] * st, p[0] * st + p[1] * ct];
    const gp = R(KYUSU.grip), O = [G[0] - gp[0], G[1] - gp[1]], lp = R(KYUSU.lip);
    return { O, bend, lip: [O[0] + lp[0], O[1] + lp[1]] };
  }
  /** flat, hard-edged 藍鼠 floor shadows to the lower left (the moon is off-frame upper right) */
  function castLateShadows(c, T, res, pose, withFigure, withPot, withOfferings) {
    const SA = TSUKI.SHOTS.A_prime;
    if (!SA || !SA.castShadow) return;
    const CAST = TSUKI.CAST;
    if (withFigure) SA.castShadow(c, T, (s2) => CAST.oldSayo(s2, OS.x, OS.y, OS.s, { pose, facing: -1, t: T, silhouette: '#000', noBuffer: true, stream: false }), { baseY: OS.y, alpha: 0.45, len: 1.3, bbox: [860, 640, 1180, 960], res });
    if (withPot) SA.castShadow(c, T, (s2) => { s2.fillStyle = '#000'; s2.beginPath(); s2.ellipse(POT_DOWN.x, POT_DOWN.y - 11, 21.5, 12.5, 0, 0, TAU); s2.fill(); }, { baseY: POT_DOWN.y, alpha: 0.45, len: 1.2, bbox: [960, 930, 1012, 960], res });
    if (withOfferings) offeringShadows(c);
  }


  /* ------------------------------------------------------------------ */
  /* the inserts' still print, carved once                               */
  /* ------------------------------------------------------------------ */
  /**
   * The print table is still from 160.62 until the unprinting, and the
   * figure holds each pose: so the A′ plates are flattened once, and for
   * each held pose the part of the engawa the camera will see is printed once
   * with its floor shadows into one buffer at twice the stage's resolution
   * (the shadows stay crisp under the push). A moving insert frame is then
   * one resampled blit — not five layer blits, a multiply pass and a live
   * CAST silhouette under the camera — and the hold on the cup (170.5–171.0,
   * the camera still) is one plain blit of the finished frame.
   */
  const STILL_T = 170, STILL_Q = 2;
  let flatA = null;
  /**
   * What the inserts keep of the colour blocks' grain wear. The worn blocks'
   * short streaks of bare paper (PRINT.grainWear) are right at the garden's
   * scale, but the insert cameras (2.3–4.7×) blow them up into rows of pale
   * dashes that read as scratches on the boards: each colour plate is printed
   * as ⅓ worn + ⅔ fresh (a linear mix of the two carvings, premultiplied), so
   * the wear is a third as deep; the key block keeps all its cracks and gaps.
   */
  const WEAR_KEEP = 1 / 3;
  function printAprimeThinned(c, T, skip) {
    const shot = PRINT.shot('A_prime'), st = PRINT.state(T);
    for (const l of ['wall', 'shade', 'boards', 'post', 'eave']) {
      if (skip && skip.includes(l)) continue;
      const L = shot.layers[l];
      if (!L) continue;
      for (const pid of PRINT.ORDER) {
        const sl = L[pid];
        if (!sl) continue;
        const o = sl.orig, w = sl.worn, a = st.alpha[pid] == null ? 1 : st.alpha[pid];
        const same = o && w && o.c.width === w.c.width && o.c.height === w.c.height && Math.abs(o.x - w.x) < 1e-6 && Math.abs(o.y - w.y) < 1e-6;
        if (pid === 'K' || pid === 'P8' || !same || st.wear < 1) { PRINT.drawLayer(c, 'A_prime', l, T, { only: [pid], state: st }); continue; }
        if (a <= 0.001) continue;
        const cv = B.canvas(o.c.width, o.c.height), x = cv.getContext('2d');
        x.globalAlpha = WEAR_KEEP;
        x.drawImage(w.c, 0, 0);
        x.globalCompositeOperation = 'lighter';
        x.globalAlpha = 1 - WEAR_KEEP;
        x.drawImage(o.c, 0, 0);
        const off = st.off[pid] || [0, 0];
        c.save();
        c.globalAlpha = a;
        c.imageSmoothingQuality = 'low';
        c.drawImage(cv, o.x + off[0], o.y + off[1], o.w, o.h);
        c.restore();
        cv.width = cv.height = 0;
      }
    }
  }
  /** the A′ plates flattened into one stage-size impression (unaged, the grain wear thinned) */
  function flatAprime(ctx) {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    if (flatA && flatA.width === cw && flatA.height === ch) return flatA;
    const cv = B.canvas(cw, ch), c = cv.getContext('2d'), k = cw / W;
    c.setTransform(k, 0, 0, k, 0, 0);
    c.fillStyle = C.kinari;
    c.fillRect(0, 0, W, H);
    if (hasAprime()) {
      try { printAprimeThinned(c, STILL_T); } catch (e) { c.fillStyle = C.kinari; c.fillRect(0, 0, W, H); drawAprime(c, STILL_T, { age: false }); }
    } else drawAprime(c, STILL_T, { age: false });
    return (flatA = cv);
  }
  /** the stage rect a camera sees */
  const camRect = (cam) => {
    const x0 = cam.about[0] - cam.to[0] / cam.scale, y0 = cam.about[1] - cam.to[1] / cam.scale;
    return [x0, y0, x0 + W / cam.scale, y0 + H / cam.scale];
  };
  /** the union of what a camera sees over [t0, t1] (a few px of margin), inside the stage */
  function camSpan(camAt, t0, t1) {
    const R = [W, H, 0, 0];
    for (let i = 0; i <= 60; i++) {
      const r = camRect(camAt(U.lerp(t0, t1, i / 60)));
      R[0] = Math.min(R[0], r[0]); R[1] = Math.min(R[1], r[1]); R[2] = Math.max(R[2], r[2]); R[3] = Math.max(R[3], r[3]);
    }
    return [Math.max(0, Math.floor(R[0]) - 8), Math.max(0, Math.floor(R[1]) - 8), Math.min(W, Math.ceil(R[2]) + 8), Math.min(H, Math.ceil(R[3]) + 8)];
  }
  const stillBufs = {};
  /** plates + floor shadows over region R, at STILL_Q (or qs) × the stage; bg(c) replaces the flat plates */
  function stillPrint(ctx, key, R, shadows, qs, bg) {
    const cw = ctx.canvas.width, k = cw / W, q = (qs || STILL_Q) * k, id = key + '|' + cw;
    const hit = stillBufs[id];
    if (hit && hit.R.join() === R.join()) return hit;
    const bw = Math.ceil((R[2] - R[0]) * q), bh = Math.ceil((R[3] - R[1]) * q);
    const cv = B.canvas(bw, bh), c = cv.getContext('2d');
    c.setTransform(q, 0, 0, q, -R[0] * q, -R[1] * q);
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'low';
    if (bg) { c.fillStyle = C.kinari; c.fillRect(R[0], R[1], R[2] - R[0], R[3] - R[1]); bg(c); }
    else c.drawImage(flatAprime(ctx), R[0] * k, R[1] * k, (R[2] - R[0]) * k, (R[3] - R[1]) * k, R[0], R[1], R[2] - R[0], R[3] - R[1]);
    shadows(c, q / (bw / W));                   // castShadow sizes its own buffer from its canvas' width
    if (hit) hit.cv.width = hit.cv.height = 0;
    return (stillBufs[id] = { cv, R, q });
  }
  /** print the still under the camera: one resample of the region it sees (false if the camera looks past it) */
  function printStill(ctx, S, cam) {
    const r = camRect(cam), R = S.R;
    if (r[0] < R[0] - 0.5 || r[1] < R[1] - 0.5 || r[2] > R[2] + 0.5 || r[3] > R[3] + 0.5) return false;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';
    ctx.drawImage(S.cv, (r[0] - R[0]) * S.q, (r[1] - R[1]) * S.q, (r[2] - r[0]) * S.q, (r[3] - r[1]) * S.q, 0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
    return true;
  }
  /** insert 1's still for a pose: what the camera sees while she holds it */
  function cupsStill(ctx, pose) {
    const CU = CUES(), tick = (CU.teaTick || [170.34])[0];
    const R = pose === 'pour' ? camSpan(CAM1, 169, tick) : camSpan(CAM1, Math.min(tick, 171), 171);
    return stillPrint(ctx, 'cups-' + pose, R, (c, res) => castLateShadows(c, STILL_T, res, pose, true, pose === 'seiza', false));
  }
  /**
   * insert 2's still: the whole still life — the plates, the one shadow block, the objects — printed
   * once at the camera's own closest scale (so its one resample per frame only ever shrinks it a little)
   */
  const STRIP_Q = 2.7;
  const stripStill = (ctx) => stillPrint(ctx, 'strip', camSpan(CAM2, 171, 173), (c) => {
    offeringShadows(c);
    drawLateOfferings(c, STILL_T, keyScale(CAM2(172)));
  }, STRIP_Q, stripPlates);
  /**
   * The plates under the still life: A′ without its 'shade' block — whose soft shadows of the
   * garden's susuki would tangle with the crisp 影絵 the jug's own susuki throw here — and
   * that block's night tone laid back by hand: the paper dimmer away from the moon, a breath
   * darker toward the sill.
   */
  function stripPlates(c) {
    if (!hasAprime()) { drawAprime(c, STILL_T, { age: false }); return; }
    printAprimeThinned(c, STILL_T, ['shade']);
    const G = TSUKI.SHOTS.A_prime.GEOM || { shojiTop: 172, shojiBottom: 800 };
    PRINT.with(c, 'P4', STILL_T, (k) => {
      const gn = k.createLinearGradient(0, 0, W, 0);
      gn.addColorStop(0, U.rgba(LATE_SHADE, 0.46)); gn.addColorStop(0.55, U.rgba(LATE_SHADE, 0.3)); gn.addColorStop(1, U.rgba(LATE_SHADE, 0.14));
      k.fillStyle = gn;
      k.fillRect(0, G.shojiTop, W, G.shojiBottom - G.shojiTop);
      const gv = k.createLinearGradient(0, G.shojiTop, 0, G.shojiBottom);
      gv.addColorStop(0.7, U.rgba(LATE_SHADE, 0)); gv.addColorStop(1, U.rgba(LATE_SHADE, 0.16));
      k.fillStyle = gv;
      k.fillRect(0, G.shojiTop, W, G.shojiBottom - G.shojiTop);
    });
  }
  /** fallback if a still does not cover the camera: the flat plates and the shadows, printed live */
  function printLive(ctx, cam, shadows) {
    const r = camRect(cam), k = ctx.canvas.width / W;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';
    ctx.drawImage(flatAprime(ctx), r[0] * k, r[1] * k, (r[2] - r[0]) * k, (r[3] - r[1]) * k, 0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
    ctx.save();
    camApply(ctx, cam);
    shadows(ctx, U.clamp(cam.scale, 1, 2.2));
    ctx.restore();
  }

  const TILT_POUR = -0.62;
  let SPOUT = null;
  /** where the tea leaves the spout at the pour's full tip (CAST's pour pose, her near hand): the cups are set under it */
  function spoutAt() {
    if (SPOUT) return SPOUT;
    const cv = B.canvas(4, 4);
    const ret = TSUKI.CAST.oldSayo(cv.getContext('2d'), OS.x, OS.y, OS.s, { pose: 'pour', facing: -1, t: 0, stream: false });
    const hand = ret && ret.hand ? ret.hand : [921.2, 841];
    SPOUT = potPose(wristFrame(hand, 'pour'), TILT_POUR).lip;
    return SPOUT;
  }
  /** the two cups: the far one (poured first, left untouched) a little behind and to the left; the tea arcs out a few px */
  const cups = () => { const s = spoutAt(); return { near: { x: s[0] - 4, y: 952, k: 1 }, far: { x: s[0] - 29, y: 939, k: 0.93 } }; };
  // insert 1 camera: the two-shot of the hands, the pot and the two cups, held through the
  // pouring; then, on the ceramic tick of the pot set down (170.34), a hard cut to the
  // untouched cup alone — still, but for a breath of drift (1.00 → 1.02) to 171.0
  const TEA_TICK = () => (CUES().teaTick || [170.34])[0];
  const CAM1 = (T) => {
    const f = cups().far;
    if (T < TEA_TICK()) return { scale: 2.3 + 0.06 * U.seg(T, 169, 171), about: [972, 884], to: [960, 640] };
    return { scale: 4.7 * camDrift(T), about: [f.x + 2, f.y + 6], to: [960, 600] };
  };
  const camDrift = (T) => 1 + 0.02 * E.inOutSine(U.seg(T, TEA_TICK(), 171));
  const HOLD = 170.34;                                 // the cut lands on the untouched cup; the camera holds
  /** insert 1, whole: the still print, the pot set down, old 小夜 and her hand, the cups, the tea, the paper's age, the moon in the cup */
  function paintInsertCups(ctx, T, o) {
    const cam = CAM1(T);
    const CU = CUES();
    const tea = CU.tea || [169.0, 169.62], tick = (CU.teaTick || [170.34])[0];
    const down = T >= tick;
    const pose = down ? 'seiza' : 'pour';
    const cp = cups();
    const lw = keyScale(cam);
    if (!printStill(ctx, cupsStill(ctx, pose), cam)) printLive(ctx, cam, (c, res) => castLateShadows(c, STILL_T, res, pose, true, down, false));
    ctx.save();
    camApply(ctx, cam);
    if (down) drawPot(ctx, T, POT_DOWN.x, POT_DOWN.y, lw);
    const lip = drawOldSayoA(ctx, T, pose, lw, potTilt(T, tea)) || spoutAt();
    const fillFar = U.seg(T, tea[0] + 0.08, tea[0] + 0.5), fillNear = U.seg(T, tea[1] + 0.08, tea[1] + 0.5);
    const far = drawCup(ctx, T, cp.far.x, cp.far.y, { fill: fillFar, steam: 0, scale: cp.far.k, lw });
    drawCup(ctx, T, cp.near.x, cp.near.y, { fill: fillNear, steam: o.steam ? nearSteam(T, tea) : 0, scale: cp.near.k, lw });
    // the streams: from the lip, falling away from the spout and bending into each cup
    const pour = (tx, ty, a) => {
      if (a <= 0 || down) return;
      PRINT.with(ctx, 'P3', T, (k) => {
        k.strokeStyle = U.rgba(TEA, 0.9 * a);
        k.lineCap = 'round';
        k.lineWidth = 2.2;
        k.beginPath();
        k.moveTo(lip[0], lip[1]);
        k.bezierCurveTo(lip[0] - 4, lip[1] + 5, tx + (lip[0] - tx) * 0.15, ty - (ty - lip[1]) * 0.45, tx, ty);
        k.stroke();
        k.fillStyle = U.rgba(C.gofun, 0.5 * a);
        k.beginPath(); k.ellipse(tx, ty + 0.5, 3.2, 0.9, 0, 0, TAU); k.fill();
      });
    };
    pour(cp.far.x + 1, cp.far.y - 30 * cp.far.k + 1, U.env(T, tea[0], tea[0] + 0.06, tea[0] + 0.44, tea[0] + 0.52, E.linear));
    pour(cp.near.x, cp.near.y - 30 + 1, U.env(T, tea[1], tea[1] + 0.06, tea[1] + 0.44, tea[1] + 0.52, E.linear));
    ctx.restore();
    // the one untouched cup will hold a tiny moon — the moon is never old: a hole in the age
    const [mx, my] = camPoint(cam, far.teaX, far.teaY + 0.2);
    ageInsert(ctx, cam, [[mx, my, far.rx * cam.scale, far.ry * cam.scale]]);
    if (o.moon) cupMoon(ctx, T, cam, far, tea);
    return far;
  }
  const nearSteam = (T, tea) => U.seg(T, tea[1] + 0.3, tea[1] + 1.3);
  /** the tiny moon floating in the untouched cup's tea (drawn after the age: it is never old) */
  function cupMoon(ctx, T, cam, far, tea) {
    const ma = U.seg(T, tea[0] + 0.7, tea[0] + 1.3, E.inOutSine);
    if (ma <= 0.001) return;
    const [mx, my] = camPoint(cam, far.teaX, far.teaY + 0.2);
    const mr = 5.2 * cam.scale;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(mx, my, far.rx * cam.scale, far.ry * cam.scale, 0, 0, TAU);
    ctx.clip();
    ctx.translate(mx, my);
    ctx.scale(1, 0.3);
    ctx.globalAlpha *= ma;
    MOON.draw(ctx, 0, 0, mr, T, { halo: 0.35, haloR: mr * 1.6, fringe: false });
    ctx.restore();
  }
  /** 胡粉 as it prints after ageInsert's 鳥の子 multiply (α 0.5): the hold frame's steam is drawn over the aged frame */
  const AGED_GOFUN = (() => {
    const g = U.hexToRgb(C.gofun), t = U.hexToRgb(C.torinoko);
    return U.rgbToHex(...g.map((v, i) => v * (0.5 + 0.5 * (t[i] / 255))));
  })();
  let hold = null;
  function drawInsertCups(ctx, T) {
    const CU = CUES();
    const tea = CU.tea || [169.0, 169.62], tick = (CU.teaTick || [170.34])[0];
    const still = T >= HOLD && T >= tick && T >= tea[1] + 0.6 && T >= tea[0] + 0.6;
    if (!still) { paintInsertCups(ctx, T, { steam: true, moon: true }); return; }
    // the hold on the cup: everything under the camera is still but the steam and the moon's
    // kira — the finished frame (at the cut's framing) is printed once, then laid in with the
    // camera's breath of drift, and only those are drawn over it
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    const Th = Math.max(HOLD, tick, tea[1] + 0.6, tea[0] + 0.6);
    if (!hold || hold.cv.width !== cw || hold.cv.height !== ch) {
      const cv = B.canvas(cw, ch), c = cv.getContext('2d'), k = cw / W;
      c.setTransform(k, 0, 0, k, 0, 0);
      c.fillStyle = C.kinari;
      c.fillRect(0, 0, W, H);
      hold = { cv, far: paintInsertCups(c, Th, { steam: false, moon: false }), d0: camDrift(Th) };
    }
    const d = camDrift(T) / hold.d0, to = CAM1(T).to, k = cw / W;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (Math.abs(d - 1) < 1e-4) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(hold.cv, 0, 0);
    } else {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'low';
      ctx.drawImage(hold.cv, to[0] * k * (1 - d), to[1] * k * (1 - d), cw * d, ch * d);
    }
    ctx.restore();
    const cam = CAM1(T), cp = cups();
    ctx.save();
    camApply(ctx, cam);
    const pen = shotA().livePen(ctx, T);
    cupSteam(pen, T, cp.near.x, cp.near.y - 30 * cp.near.k, nearSteam(T, tea), AGED_GOFUN);
    pen.flush();
    ctx.restore();
    cupMoon(ctx, T, cam, hold.far, tea);
  }

  // insert 2 camera: the eye at the boards' height, close on the jug's neck, where the faded strip is the
  // one warm thing in the print (on the upper third); the 三方 and the 戸袋's diagonal to the right, the
  // box low on the left — a slow 2.40 → 2.66 lean in about the strip itself
  const STRIP_AT = [JUG.x + 12, JUG.y - 110];
  const CAM2 = (T) => {
    const u = U.seg(T, 171, 173, E.inOutSine);
    return { scale: U.lerp(2.4, 2.66, u), about: STRIP_AT, to: [669, 576] };
  };
  function drawInsertStrip(ctx, T) {
    const cam = CAM2(T);
    if (!printStill(ctx, stripStill(ctx), cam)) printLive(ctx, cam, (c) => { offeringShadows(c); drawLateOfferings(c, STILL_T, keyScale(cam)); });
    ageInsert(ctx, cam);
    // hand-applied after the print (and after the years)
    ctx.save();
    camApply(ctx, cam);
    drawStrip(ctx, T, 1, keyScale(cam));
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* 173–182: 月に雁                                                      */
  /* ------------------------------------------------------------------ */
  // the print: 640 × 930, x 640–1280, with a 地 of yellowed washi below it (the subtitle sits on paper)
  const PANEL = { x0: 640, x1: 1280, y1: 930 };
  const KMOON = { x: 1000, y: 262, r: 118 };          // in the print's upper third
  const PANEL_INK = U.mix(U.mix(C.ai, C.bero, 0.35), C.gunjo, 0.45);
  // the descent, from upper right to lower left, and the side its path bows toward (a landing
  // approach: steep at first, flattening as they come down toward the reeds — 落雁)
  const DIR = [-0.588, 0.809], PERP = [0.809, 0.588];
  const GEESE = [
    // the lead: large and low, nearest, wings spread, head down-left
    { at: [812, 622], v: 210, span: 250, glide: true, ph: 0.0, rate: 1.2, bow: 60 },
    // the second: at mid-height, crossing the moon's lower rim at the hero time
    { at: [1010, 360], v: 160, span: 175, glide: true, ph: 0.45, rate: 1.2, bow: 50 },
    // the third (小夜): small, high on the right, late — beating faster, never gliding, falling
    // behind (40 px by the end); it crosses the moon alone as the print dissolves
    { at: [1190, 110], v: 115, span: 122, glide: false, ph: 0.7, rate: 1.62, bow: 40, lag: 40 },
  ];
  /**
   * The late paper of the crop, printed by this scene (not the generic one): 鳥の
   * 子 multiplied in, foxing dots, and — on the margins only — two or three
   * old tide-lines of damp: irregular, broken, uneven in width and ink, never
   * a drawn circle.
   */
  function kakeAge(c, amount, tide, seed) {
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.globalAlpha = 0.5 * amount;
    c.fillStyle = C.torinoko;
    c.fillRect(0, 0, W, H);
    c.restore();
    const r = U.rng(seed), ink = U.mix(C.odo, C.sumi, 0.45);
    c.save();
    for (let i = 0; i < 60; i++) {
      const x = r() * W, y = r() * H, rr = U.lerp(1, 6, Math.pow(r(), 2)), a = U.lerp(0.12, 0.25, r()) * amount;
      const g = c.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, U.rgba(ink, a)); g.addColorStop(0.6, U.rgba(ink, a * 0.55)); g.addColorStop(1, U.rgba(ink, 0));
      c.fillStyle = g;
      c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    if (tide) {
      c.lineCap = 'round';
      for (const [cx, cy, R, sd, a0, a1] of [[210, 820, 160, 3, 0.4, 4.9], [1690, 360, 120, 7, 2.2, 7.4]]) {
        // the edge a drying stain leaves: a wandering, lobed line — only part of a loop, heavier
        // where the water stood longest, broken where it thinned out
        const n = 120;
        let prev = null;
        for (let j = 0; j <= n; j++) {
          const th = U.lerp(a0, a1, j / n);
          const rad = R * (1 + 0.55 * (U.fbm2(Math.cos(th) * 1.6 + sd, Math.sin(th) * 1.6, 3, 40 + sd) - 0.5) + 0.2 * Math.sin(th * 3 + sd));
          const pt = [cx + Math.cos(th) * rad * 1.3, cy + Math.sin(th) * rad * 0.7];
          if (prev) {
            const wv = U.noise1(j * 0.17 + sd, 50 + sd);
            if (wv > 0.34) {
              c.strokeStyle = U.rgba(ink, (0.02 + 0.05 * wv) * amount);
              c.lineWidth = U.lerp(0.6, 2.6, wv);
              c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(pt[0], pt[1]); c.stroke();
            }
          }
          prev = pt;
        }
      }
    }
    c.restore();
  }
  // the two caches of the crop: the aged print (藍 field, the mist and reeds at its foot), and the aged margin paper
  let kake = null;
  function kakeCaches(ctx) {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    if (kake && kake.cw === cw && kake.ch === ch) return kake;
    const k = cw / W;
    const mk = (paint, amount, tide, seed) => {
      const cv = B.canvas(cw, ch), c = cv.getContext('2d');
      c.setTransform(k, 0, 0, k, 0, 0);
      c.fillStyle = C.kinari;
      c.fillRect(0, 0, W, H);
      paint(c);
      kakeAge(c, amount, tide, seed);
      return cv;
    };
    const field = mk((c) => {
      // flat pale 藍 from the worn sky block (P6 α 0.55), no bokashi
      c.fillStyle = U.rgba(PANEL_INK, 0.58);
      c.fillRect(0, 0, W, H);
      // near its foot a すやり霞 — two flat 胡粉 bars with carved (hard) edges and
      // rounded, stepped ends, floating over the water — and reeds rising through them
      const bar = (x0, x1, y0, h, capL, capR) => {
        const p = new Path2D(), n = y0 + h * 0.44;
        p.moveTo(x0 + capL, y0);
        for (let x = x0 + capL; x <= x1 - capR; x += 8) p.lineTo(x, y0 + (U.noise1(x * 0.013, 71) - 0.5) * 3);
        p.bezierCurveTo(x1 - capR * 0.45, y0, x1, n - h * 0.3, x1, n);
        p.bezierCurveTo(x1, n + h * 0.35, x1 - capR * 0.5, y0 + h, x1 - capR, y0 + h);
        p.lineTo(x0 + capL, y0 + h);
        p.bezierCurveTo(x0 + capL * 0.5, y0 + h, x0, n + h * 0.35, x0, n);
        p.bezierCurveTo(x0, n - h * 0.3, x0 + capL * 0.45, y0, x0 + capL, y0);
        p.closePath();
        return p;
      };
      const mist = new Path2D();
      mist.addPath(bar(560, 1150, 790, 40, 30, 58));
      mist.addPath(bar(990, 1360, 832, 26, 44, 30));
      c.fillStyle = U.rgba(U.mix(C.gofun, C.geppaku, 0.35), 0.66);
      c.fill(mist, 'nonzero');
      reeds(c);
    }, 0.42, false, 175);
    const margin = mk(() => {}, 1, true, 176);
    kake = { cw, ch, field, margin };
    return kake;
  }
  /** 葦: a stand of reeds at the print's lower left, in 墨 — where the geese are coming down */
  function reeds(c) {
    const r = U.rng(4242);
    const stems = new Path2D(), leaves = new Path2D(), heads = new Path2D();
    for (let i = 0; i < 17; i++) {
      const bx = U.lerp(652, 900, Math.pow(r(), 1.3)), L = U.lerp(70, 205, r()) * (bx < 760 ? 1 : 0.8);
      const lean = U.lerp(-0.08, 0.2, r());
      const pts = [];
      for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([bx + Math.sin(lean) * L * t * t, 934 - L * t]); }
      const tip = pts[8];
      // a thin tapered culm
      for (let k = 0; k < 8; k++) {
        const w = U.lerp(1.8, 0.6, k / 8);
        stems.moveTo(pts[k][0] - w, pts[k][1]); stems.lineTo(pts[k + 1][0] - w * 0.8, pts[k + 1][1]);
        stems.lineTo(pts[k + 1][0] + w * 0.8, pts[k + 1][1]); stems.lineTo(pts[k][0] + w, pts[k][1]); stems.closePath();
      }
      // one or two long blades peeling off, bending down
      for (let j = 0; j < 1 + (r() < 0.5 ? 1 : 0); j++) {
        const at = pts[3 + Math.floor(r() * 3)], side = r() < 0.5 ? -1 : 1, bl = U.lerp(40, 80, r());
        leaves.moveTo(at[0], at[1]);
        leaves.quadraticCurveTo(at[0] + side * bl * 0.6, at[1] - bl * 0.45, at[0] + side * bl, at[1] + bl * 0.05);
        leaves.quadraticCurveTo(at[0] + side * bl * 0.55, at[1] - bl * 0.32, at[0], at[1] + 3);
        leaves.closePath();
      }
      // the plume of the tallest, drooping
      if (L > 150) {
        heads.moveTo(tip[0], tip[1]);
        heads.quadraticCurveTo(tip[0] + 12, tip[1] - 6, tip[0] + 18, tip[1] + 16);
        heads.quadraticCurveTo(tip[0] + 8, tip[1] + 4, tip[0], tip[1] + 3);
        heads.closePath();
      }
    }
    c.fillStyle = U.rgba(C.sumi, 0.82); c.fill(stems); c.fill(leaves);
    c.fillStyle = U.rgba(U.mix(C.sumi, C.nezumi, 0.4), 0.8); c.fill(heads);
  }

  /**
   * 雁 (Hiroshige, 月に雁): a white-fronted goose descending, seen from a
   * little below so its wings spread wide on both sides of the body (span ≈
   * 2.4 × body on the full stroke), neck stretched ahead. Four stepped wing
   * beats (1.2 Hz). Local coords: heading −x, body centred at the origin,
   * span ≈ 210 at scale 1. 鼠 body and coverts, 墨 primaries (five separated
   * fingers), head and neck; a 胡粉 belly and undertail, and the white blaze
   * at the bill.
   */
  // per beat: [wing length ×, sweep back (rad), far-wing length ×, curl of the fingers]
  const BEATS = [[0.78, -0.32, 0.72, -0.25], [1.0, 0.1, 0.94, 0.05], [0.9, 0.42, 0.86, 0.3], [0.95, 0.2, 0.9, 0.15]];
  function wing(side, len, sweep, curl) {
    // side −1: the wing on the far side of the body axis (drawn first), +1 the near one
    const root = [-6, side * 5], rootB = [18, side * 6];
    const d = [Math.sin(sweep), side * Math.cos(sweep)];            // along the wing
    const n = [-d[1] * side, d[0] * side];                          // toward the leading edge (the head side)
    const P = (u, v) => [root[0] + d[0] * len * u + n[0] * v, root[1] + d[1] * len * u + n[1] * v];
    // coverts & secondaries: a broad inner wing to the wrist
    const cov = new Path2D();
    const wr = P(0.48, 6), hd = P(0.62, 3);
    cov.moveTo(root[0], root[1]);
    cov.bezierCurveTo(P(0.18, 9)[0], P(0.18, 9)[1], P(0.36, 10)[0], P(0.36, 10)[1], wr[0], wr[1]);
    cov.lineTo(hd[0], hd[1]);
    const tb = P(0.6, -30);
    cov.lineTo(tb[0], tb[1]);
    // the scalloped trailing edge back to the body
    for (let i = 1; i <= 4; i++) {
      const s = i / 4;
      const q = [U.lerp(tb[0], rootB[0], s), U.lerp(tb[1], rootB[1], s)];
      const m = [U.lerp(tb[0], rootB[0], s - 0.12) + d[0] * 4 - n[0] * 4, U.lerp(tb[1], rootB[1], s - 0.12) + d[1] * 4 - n[1] * 4];
      cov.quadraticCurveTo(m[0], m[1], q[0], q[1]);
    }
    cov.closePath();
    // the secondaries' dark trailing band
    const sec = new Path2D();
    sec.moveTo(tb[0], tb[1]);
    for (let i = 1; i <= 4; i++) { const s = i / 4; const q = [U.lerp(tb[0], rootB[0], s), U.lerp(tb[1], rootB[1], s)]; sec.lineTo(q[0] + n[0] * 7, q[1] + n[1] * 7); }
    for (let i = 4; i >= 0; i--) { const s = i / 4; sec.lineTo(U.lerp(tb[0], rootB[0], s) - n[0] * 2, U.lerp(tb[1], rootB[1], s) - n[1] * 2); }
    sec.closePath();
    // the hand and five primaries fanning from it, their tips separated
    const prim = new Path2D();
    prim.moveTo(wr[0], wr[1]); prim.lineTo(hd[0], hd[1]); prim.lineTo(P(0.66, -26)[0], P(0.66, -26)[1]); prim.lineTo(tb[0], tb[1]); prim.closePath();
    const a0 = Math.atan2(d[1], d[0]);
    for (let i = 0; i < 5; i++) {
      const f = i / 4;
      const base = P(0.6 + 0.05 * (1 - f), U.lerp(3, -26, f));
      const ang = a0 - side * (U.lerp(-0.06, 0.3, f) + curl * 0.6 * (1 - f));
      const fl = len * U.lerp(0.4, 0.24, f);
      const e = [base[0] + Math.cos(ang) * fl, base[1] + Math.sin(ang) * fl];
      const px = -Math.sin(ang), py = Math.cos(ang), w = U.lerp(6.2, 5.4, f);
      prim.moveTo(base[0] + px * w, base[1] + py * w);
      prim.bezierCurveTo(base[0] + px * w + Math.cos(ang) * fl * 0.6, base[1] + py * w + Math.sin(ang) * fl * 0.6, e[0] + px * w * 0.5, e[1] + py * w * 0.5, e[0], e[1]);
      prim.bezierCurveTo(e[0] - px * w * 0.4, e[1] - py * w * 0.4, base[0] - px * w + Math.cos(ang) * fl * 0.5, base[1] - py * w + Math.sin(ang) * fl * 0.5, base[0] - px * w, base[1] - py * w);
      prim.closePath();
    }
    const lead = new Path2D();
    lead.moveTo(root[0], root[1]);
    lead.bezierCurveTo(P(0.18, 9)[0], P(0.18, 9)[1], P(0.36, 10)[0], P(0.36, 10)[1], wr[0], wr[1]);
    lead.lineTo(hd[0], hd[1]);
    return { cov, sec, prim, lead };
  }
  function goose(c, params, ink) {
    const [lk, sw, fk, curl] = params;
    const L = 92;
    const far = wing(-1, L * fk, sw + 0.06, curl);
    c.fillStyle = ink.farCov; c.fill(far.cov);
    c.fillStyle = ink.sumi; c.fill(far.sec); c.fill(far.prim);
    // the body seen from a little below: full breast, the pale belly, the white undertail
    const body = new Path2D();
    body.moveTo(-28, -2);
    body.bezierCurveTo(-22, -11, 10, -12, 30, -7);
    body.bezierCurveTo(38, -5, 45, -3, 50, 0);
    body.bezierCurveTo(45, 3, 38, 6, 30, 8);
    body.bezierCurveTo(10, 13, -20, 11, -28, 3);
    body.closePath();
    c.fillStyle = ink.body; c.fill(body);
    c.fillStyle = ink.belly;
    c.beginPath(); c.moveTo(-14, 3); c.bezierCurveTo(-2, 9, 16, 9, 30, 4); c.bezierCurveTo(36, 3, 44, 1, 49, 0); c.bezierCurveTo(40, 5, 30, 9, 16, 9); c.bezierCurveTo(4, 10, -8, 8, -14, 3); c.closePath(); c.fill();
    c.fillStyle = ink.sumi;
    c.beginPath(); c.moveTo(-2, 1); c.lineTo(3, 5); c.moveTo(6, 0); c.lineTo(11, 5); c.moveTo(14, 0); c.lineTo(18, 4);
    c.strokeStyle = ink.bar; c.lineWidth = 1.6; c.lineCap = 'round'; c.stroke();
    // neck stretched ahead (short), the head, an 8 px bill with the white blaze behind it
    const neck = new Path2D();
    neck.moveTo(-24, -6); neck.bezierCurveTo(-33, -7, -40, -5, -46, -2);
    neck.lineTo(-46, 5); neck.bezierCurveTo(-40, 4, -33, 4, -25, 4); neck.closePath();
    c.fillStyle = ink.sumi; c.fill(neck);
    c.beginPath(); c.ellipse(-50.5, 1.6, 6.4, 5, 0.08, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-55.5, -1.2); c.lineTo(-63.5, 2); c.lineTo(-55.5, 4.4); c.closePath(); c.fill();
    c.fillStyle = ink.belly;
    c.beginPath(); c.ellipse(-55.6, 1.4, 1.4, 2.5, 0.3, 0, TAU); c.fill();
    // the near wing over the body
    const nw = wing(1, L * lk, sw, curl);
    c.fillStyle = ink.cov; c.fill(nw.cov);
    c.fillStyle = ink.sumi; c.fill(nw.sec); c.fill(nw.prim);
    c.strokeStyle = ink.sumi; c.lineWidth = 1.5; c.lineCap = 'round'; c.stroke(nw.lead);
    c.strokeStyle = ink.edge; c.lineWidth = 0.7; c.stroke(nw.cov);
  }
  /** a periodic Catmull-Rom through the four beat keys at key-phase f (continuous: no held frames) */
  function beatAt(f) {
    const i = Math.floor(f), u = f - i, K = (j) => BEATS[((j % 4) + 4) % 4];
    const a = K(i - 1), b = K(i), c2 = K(i + 1), d = K(i + 2), u2 = u * u, u3 = u2 * u;
    return b.map((_, k) => 0.5 * (2 * b[k] + (-a[k] + c2[k]) * u + (2 * a[k] - 5 * b[k] + 4 * c2[k] - d[k]) * u2 + (-a[k] + 3 * b[k] - 3 * c2[k] + d[k]) * u3));
  }
  /**
   * A goose's wings at T: key-phase f (4 keys per beat). The two ahead beat
   * three times from the gliding key (1) and hold it for a second (a 3.5 s
   * rhythm, the beats easing out of and into the glide); the third never
   * glides and beats 1.35× faster, trying to keep up.
   */
  function wingPhase(T, g) {
    if (!g.glide) return (T * g.rate + g.ph) * 4;
    const cyc = 3.5, flap = 2.5, t = U.fract(T / cyc + g.ph) * cyc;
    if (t >= flap) return 13;
    const x = t / flap;
    return 1 + 12 * (x - (0.6 * Math.sin(TAU * x)) / TAU);
  }
  /** where a goose is at T, and its heading (the tangent of its bowed descent) */
  function goosePath(T, g) {
    const lag = (tt) => (g.lag ? g.lag * U.smoothstep(176, 182, tt) : 0);
    const S = 700;
    const at = (tt) => {
      const s2 = g.v * (tt - 178) - (lag(tt) - lag(178));
      const b = g.bow * (1 - (s2 / S) * (s2 / S));
      return [g.at[0] + DIR[0] * s2 + PERP[0] * b, g.at[1] + DIR[1] * s2 + PERP[1] * b];
    };
    const p = at(T), q = at(T + 0.02);
    return { x: p[0], y: p[1], ang: Math.atan2(q[1] - p[1], q[0] - p[0]) };
  }
  function drawGeese(ctx, T) {
    const ink = {
      sumi: C.sumi, body: aged(U.mix(C.nezumi, C.sumi, 0.25)), cov: aged(U.mix(C.nezumi, C.ginnezu, 0.2)),
      farCov: aged(U.mix(C.nezumi, C.sumi, 0.45)), belly: aged(U.mix(C.gofun, C.ginnezu, 0.15)), edge: U.rgba(C.sumi, 0.55),
      bar: U.rgba(C.sumi, 0.4),
    };
    PRINT.with(ctx, 'K', T, (c) => {
      for (const g of GEESE) {
        const P = goosePath(T, g), s = g.span / 210;
        if (P.x < PANEL.x0 - 160 * s || P.x > PANEL.x1 + 160 * s || P.y < -140 * s || P.y > PANEL.y1 + 140 * s) continue;
        const f = wingPhase(T, g);
        // the body rides a little against each downstroke
        const bob = 2.5 * s * Math.sin(TAU * (f / 4));
        c.save();
        c.translate(P.x, P.y - bob);
        // heading down-left along the descent, the body a little flatter than the path
        c.rotate((P.ang - Math.PI) * 0.82);
        c.scale(s * 1.08, s * 1.08);
        goose(c, beatAt(f), ink);
        c.restore();
      }
    });
  }
  /** the 月に雁 print itself: the aged 藍 field, the fresh moon, the geese */
  function kakemonoPrint(ctx, T, K) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(K.field, 0, 0);
    ctx.restore();
    // the fresh moon (never aged), its halo in the yellowed ink
    ctx.save();
    ctx.imageSmoothingQuality = 'low';
    MOON.draw(ctx, KMOON.x, KMOON.y, KMOON.r, T, { halo: 0.35, haloR: KMOON.r * 1.5, haloColor: aged(C.geppaku) });
    ctx.restore();
    // the geese, descending steeply from upper right to lower left across the disc
    drawGeese(ctx, T);
  }
  /** the yellowed washi margins at `close` (1 = shut to the 640 × 930 print and its 地), with its border line */
  function kakemonoMargins(ctx, K, close) {
    if (close <= 0.001) return;
    const lw = PANEL.x0 * close, rx = W - (W - PANEL.x1) * close, by = H - (H - PANEL.y1) * close;
    margins(ctx, K, lw, rx, by);
    ctx.save();
    ctx.strokeStyle = U.rgba(C.sumi, 0.85);
    ctx.lineWidth = 1;
    ctx.strokeRect(lw + 0.5, -2, rx - lw - 1, by + 1.5);
    ctx.restore();
  }
  const kakeClose = (T) => U.seg(T, 173.0, 173.8, E.outCubic) * (1 - U.seg(T, 181.4, 182.0, E.inOutSine));
  function drawKakemono(ctx, T) {
    const K = kakeCaches(ctx);
    kakemonoPrint(ctx, T, K);
    // the margins: yellowed washi sliding in from both sides
    kakemonoMargins(ctx, K, kakeClose(T));
  }
  /**
   * 181.4–182: the margins open onto the engawa. The 月に雁 print dissolves
   * off the panel as they go (the moon fades with it, it does not pop), and
   * the empty A′ is there underneath — the window about to rise.
   */
  function drawKakemonoOut(ctx, T) {
    const K = kakeCaches(ctx);
    const outU = U.seg(T, 181.4, 182.0, E.inOutSine);
    drawFoxWindow(ctx, T);
    if (outU < 0.999) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(PANEL.x0, 0, PANEL.x1 - PANEL.x0, PANEL.y1);
      ctx.clip();
      ctx.globalAlpha = 1 - outU;
      kakemonoPrint(ctx, T, K);
      ctx.restore();
    }
    kakemonoMargins(ctx, K, kakeClose(T));
  }
  function margins(ctx, K, lw, rx, by) {
    const k = ctx.canvas.width / W;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const L = Math.ceil(lw * k), R = Math.floor(rx * k), Bm = Math.floor((by == null ? H : by) * k);
    if (L > 0) ctx.drawImage(K.margin, 0, 0, L, K.ch, 0, 0, L, K.ch);
    if (R < K.cw) ctx.drawImage(K.margin, R, 0, K.cw - R, K.ch, R, 0, K.cw - R, K.ch);
    if (Bm < K.ch && R > L) ctx.drawImage(K.margin, L, Bm, R - L, K.ch - Bm, L, Bm, R - L, K.ch - Bm);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* 182–190: the fox window                                             */
  /* ------------------------------------------------------------------ */
  // the diamond sits a little below the frame's centre, so the sleeves run out of
  // the frame early (≤ 45 % of it) and the window, not the arms, is the picture
  const FW = { x: 960, y: 592, s: 1.27 };
  /** the pair at T: they rise together from just below the frame (unhurried and settling:
   *  ≈ 950 px/s at entry, slowing; nearly home as the theft plays inside at 183.0); the tremble */
  function handsAt(T) {
    const rise = 1 - E.outSine(U.seg(T, 182.0, 183.3));
    const tremble = U.seg(T, 188.0, 188.25) * 0.67;
    return { x: FW.x, y: FW.y + 780 * rise, s: FW.s, tremble };
  }
  /**
   * Letting go (189.1–190): each arm on its own, the left a beat (0.08 s) ahead
   * of the right. The woven fingers unhook: each forearm swings a little outward
   * from the elbow (below the frame) and each hand, loosening, turns up at the
   * wrist — the window opens from its top, hinged a moment on the crossing at
   * its foot, and the two hands part; the tremble of holding it goes out of
   * them. For a fifth of a second the lift of the fingertips half offsets the
   * first give of the wrists — a moment's hang, open — then the weight takes
   * them: still falling (the arms still opening) when the cut lands at 190.
   */
  const RELEASE = { t0: 189.1, lag: 0.08, dur: 0.5, fall: 1.5, drop: 820, arm: U.deg(2.2), armFall: U.deg(3.0), wrist: U.deg(4.5) };
  const ELBOW = [-500, 475], WRIST = [-300, 70];      // canonical (left-hand) units: the forearm's ends
  const stageOf = (side, p) => [FW.x - side * p[0] * FW.s, FW.y + p[1] * FW.s];
  /** one arm at T (side −1 = the left, as we see it; +1 = the right): its motion off the rest pose */
  function armAt(T, side, tw) {
    const t0 = RELEASE.t0 + (side > 0 ? RELEASE.lag : 0);
    const rel = E.inOutSine(U.seg(T, t0, t0 + RELEASE.dur));
    const fall = E.inOutSine(U.seg(T, t0, t0 + RELEASE.fall));
    // (CAST's tremble: +tw on the left hand, −0.8·tw on the right — gone once they let go)
    const oy = (side < 0 ? tw : -0.8 * tw) * FW.s * (1 - rel);
    const [ex, ey] = stageOf(side, ELBOW), [wx, wy] = stageOf(side, WRIST);
    return {
      rel, fall, ex, ey, wx, wy, dx: 0, dy: RELEASE.drop * fall + oy,
      a: side * (RELEASE.arm * rel + RELEASE.armFall * fall),     // the forearm, outward (the left anticlockwise)
      b: side * RELEASE.wrist * rel,                               // the hand at the wrist, fingertips up
    };
  }
  const rotAbout = (p, cx, cy, a) => { const c = Math.cos(a), s = Math.sin(a), u = p[0] - cx, v = p[1] - cy; return [cx + u * c - v * s, cy + u * s + v * c]; };
  /** a rest-position stage point carried by an arm (hand: turned at the wrist too), plus the pair's rise dy0 */
  function armPt(a, dy0, p, hand) {
    const q = rotAbout(hand ? rotAbout(p, a.wx, a.wy, a.b) : p, a.ex, a.ey, a.a);
    return [q[0] + a.dx, q[1] + a.dy + dy0];
  }
  // the geometry of CAST's fox-window hand (cast.js foxHand), for the sleeves and the creases
  const FWG = (() => {
    const Wd = 150, Hd = 115, D = Math.hypot(Wd, Hd);
    const e1 = [Wd / D, -Hd / D], out1 = [-Hd / D, -Wd / D], e2 = [Wd / D, Hd / D], out2 = [-Hd / D, Wd / D];
    const UV = (u, v) => [-Wd + e1[0] * u + out1[0] * v, e1[1] * u + out1[1] * v];
    const along = (e, o, sN, w) => [-Wd + e[0] * D * sN + o[0] * w, e[1] * D * sN + o[1] * w];
    return { D, Wd, Hd, UV, along, e1, out1, e2, out2 };
  })();
  /** 波兎 on the sleeves: 胡粉 rabbits leaping over seigaiha on 藍 (a tile, built once) */
  let namiTile = null;
  function namiPattern(ctx) {
    if (!namiTile) {
      const S = 128, cv = B.canvas(S, S), c = cv.getContext('2d');
      // the rabbits a quiet 胡粉 toward 藍, so the only warm light on screen is the window
      const ground = aged(C.ai), fg = aged(U.mix(C.gofun, C.ai, 0.32));
      c.fillStyle = ground; c.fillRect(0, 0, S, S);
      c.strokeStyle = U.rgba(fg, 0.7); c.lineWidth = 1.4;
      for (const [cy, xs] of [[0.66, [0, 0.5, 1]], [0.8, [0.25, 0.75]]]) for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) for (const cx of xs) {
        for (const kk of [1, 0.68, 0.36]) { c.beginPath(); c.arc(cx * S + ox, cy * S + oy, S * 0.22 * kk, Math.PI, 0); if (kk === 1) { c.fillStyle = ground; c.fill(); } c.stroke(); }
      }
      c.fillStyle = fg;
      const rab = (x, y, s) => {
        c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-0.28); c.beginPath();
        c.ellipse(0, 0, 0.5, 0.26, 0, 0, TAU);
        c.moveTo(0.62, -0.1); c.ellipse(0.5, -0.12, 0.22, 0.19, 0, 0, TAU);
        c.moveTo(0.48, -0.26); c.ellipse(0.28, -0.4, 0.26, 0.07, 0.55, 0, TAU);
        c.moveTo(0.52, -0.3); c.ellipse(0.36, -0.46, 0.24, 0.06, 0.35, 0, TAU);
        c.moveTo(-0.3, 0.1); c.ellipse(-0.62, 0.22, 0.34, 0.08, 0.35, 0, TAU);
        c.moveTo(0.4, 0.14); c.ellipse(0.62, 0.3, 0.24, 0.06, -0.5, 0, TAU);
        c.fill(); c.restore();
      };
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { rab(0.3 * S + ox, 0.3 * S + oy, S * 0.24); rab(0.8 * S + ox, 0.06 * S + oy, S * 0.18); }
      namiTile = cv;
    }
    return ctx.createPattern(namiTile, 'repeat');
  }
  /** a linear bokashi across a band: `ink` at α a0 on the line (p0 → p1, run on past both ends — the
   *  caller's clip trims it), wiped to nothing `w` px along n */
  function bokashiBand(c, p0, p1, n, w, ink, a0) {
    const g = c.createLinearGradient(p0[0], p0[1], p0[0] + n[0] * w, p0[1] + n[1] * w);
    g.addColorStop(0, U.rgba(ink, a0));
    g.addColorStop(0.35, U.rgba(ink, a0 * 0.62));
    g.addColorStop(0.7, U.rgba(ink, a0 * 0.2));
    g.addColorStop(1, U.rgba(ink, 0));
    c.fillStyle = g;
    c.beginPath();
    const ext = 400;
    const d = [p1[0] - p0[0], p1[1] - p0[1]], L = Math.hypot(d[0], d[1]) || 1, u = [d[0] / L, d[1] / L];
    const a = [p0[0] - u[0] * ext, p0[1] - u[1] * ext], b = [p1[0] + u[0] * ext, p1[1] + u[1] * ext];
    c.moveTo(a[0] - n[0] * 4, a[1] - n[1] * 4); c.lineTo(b[0] - n[0] * 4, b[1] - n[1] * 4);
    c.lineTo(b[0] + n[0] * w, b[1] + n[1] * w); c.lineTo(a[0] + n[0] * w, a[1] + n[1] * w);
    c.closePath();
    c.fill();
  }
  /**
   * One forearm in its 波兎 sleeve (side −1 = the left arm as we see it, +1 =
   * the right), rising from below the frame to the wrist (POV hands): a flat
   * 藍 shape carrying the pattern, the paler lit fold along the forearm, a
   * 薄墨 bokashi wiped in along the hanging edge and under the cuff (the arm is
   * round inside the cloth), the dark lining where the cuff opens round the
   * wrist; carved 墨 key line as heavy as the hands' (≈2 px on the lit side,
   * swelling toward the lower right as CAST's), and three tapering folds —
   * down the hanging 袂, along the forearm, and the crease at the elbow.
   */
  function sleeve(ctx, T, h, side) {
    const pat = namiPattern(ctx);
    const sg = -side;                                 // the canonical (left-hand) space → this side
    const L = (p) => [h.x + sg * p[0] * h.s, h.y + p[1] * h.s];
    const A = FWG.UV(-0.86 * FWG.D, 146), G = FWG.UV(-0.74 * FWG.D, -40);
    // the forearm runs down and out, below the frame; the sleeve's upper edge
    // follows it with the elbow's fullness, its 袂 hangs from the cuff's lower side
    const top = [A, [A[0] - 118, A[1] + 120], [A[0] - 196, A[1] + 360], [A[0] - 232, A[1] + 620]];
    const hang = [[G[0] - 30, G[1] + 560], [G[0] - 6, G[1] + 300], [G[0] + 4, G[1] + 150], G];
    const pts = top.concat(hang).map(L);
    // the sleeve's upper corner at the cuff is rounded, not a point
    const a1 = L([U.lerp(A[0], G[0], 0.16), U.lerp(A[1], G[1], 0.16)]), a2 = L([A[0] - 26, A[1] + 30]);
    const sl = new Path2D();
    sl.moveTo(a1[0], a1[1]);
    sl.quadraticCurveTo(pts[0][0], pts[0][1], a2[0], a2[1]);
    sl.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
    sl.lineTo(pts[4][0], pts[4][1]);
    sl.bezierCurveTo(pts[5][0], pts[5][1], pts[6][0], pts[6][1], pts[7][0], pts[7][1]);
    sl.closePath();
    // the lit fold along the forearm: a second, paler 藍 block
    const fold = new Path2D();
    const q = [A, [A[0] - 118, A[1] + 120], [A[0] - 196, A[1] + 360], [A[0] - 232, A[1] + 620], [A[0] - 184, A[1] + 620], [A[0] - 146, A[1] + 360], [A[0] - 76, A[1] + 134], [A[0] + 26, A[1] + 30]].map(L);
    fold.moveTo(q[0][0], q[0][1]);
    fold.bezierCurveTo(q[1][0], q[1][1], q[2][0], q[2][1], q[3][0], q[3][1]);
    fold.lineTo(q[4][0], q[4][1]);
    fold.bezierCurveTo(q[5][0], q[5][1], q[6][0], q[6][1], q[7][0], q[7][1]);
    fold.closePath();
    // the cuff opening round the wrist: the dark lining, seen end-on
    const cuffPts = [A, FWG.UV(-0.95 * FWG.D, 118), FWG.UV(-0.97 * FWG.D, 50), FWG.UV(-0.88 * FWG.D, -22), G, FWG.UV(-0.8 * FWG.D, 60)].map(L);
    const cuff = new Path2D();
    cuff.moveTo(cuffPts[0][0], cuffPts[0][1]);
    for (let i = 1; i < cuffPts.length; i++) cuff.lineTo(cuffPts[i][0], cuffPts[i][1]);
    cuff.closePath();
    // (a direction in canonical units, carried to this side)
    const dirL = (d) => { const v = [sg * d[0], d[1]], l = Math.hypot(v[0], v[1]); return [v[0] / l, v[1] / l]; };
    const shade = aged(U.mix(C.koiai, C.sumi, 0.5));
    PRINT.with(ctx, 'P5', T, (c) => {
      c.fillStyle = aged(C.ai); c.fill(sl);
      c.save();
      c.clip(sl);
      if (pat.setTransform) pat.setTransform(new DOMMatrix().translateSelf(h.x + sg * 40, h.y).scaleSelf(0.56, 0.56));
      c.fillStyle = pat;
      c.fillRect(-200, h.y - 400, W + 400, 1600);
      c.save();
      c.globalAlpha *= 0.3;
      c.fillStyle = aged(U.mix(C.ai, C.gofun, 0.5));
      c.fill(fold);
      c.restore();
      // 薄墨 bokashi: wiped in from the hanging edge (the cloth turning away under the arm) …
      const g0 = L([G[0] + 4, G[1] + 150]), g1 = L([G[0] - 30, G[1] + 560]);
      bokashiBand(c, g0, g1, dirL([-1, -0.06]), 118 * h.s, shade, 0.38);
      // … and under the cuff: a soft, edgeless one where the wrist's shadow falls into the sleeve
      const cu = L([G[0] - 34, G[1] + 4]), cr = 118 * h.s;
      const cg = c.createRadialGradient(cu[0], cu[1], 0, cu[0], cu[1], cr);
      cg.addColorStop(0, U.rgba(shade, 0.24)); cg.addColorStop(0.45, U.rgba(shade, 0.15)); cg.addColorStop(1, U.rgba(shade, 0));
      c.fillStyle = cg;
      c.fillRect(cu[0] - cr, cu[1] - cr, 2 * cr, 2 * cr);
      c.restore();
    });
    PRINT.with(ctx, 'K', T, (c) => {
      c.fillStyle = U.mix(C.koiai, C.sumi, 0.55); c.fill(cuff);
      // the carved key line: the path and a copy 1.6 px toward the lower right, stroked once
      // (so the two never double their ink) — ≈2 px on the lit side, ≈3.5 on the shadow side
      const kl = new Path2D();
      kl.addPath(sl);
      kl.addPath(sl, new DOMMatrix().translateSelf(0.7, 1.44));
      c.strokeStyle = U.rgba(C.sumi, 0.85); c.lineWidth = 2.0; c.lineJoin = 'round'; c.lineCap = 'round';
      c.stroke(kl);
      // three carved folds, tapering (2.6 → 1 px): down the hanging 袂 from under the cuff,
      // along the forearm inside the lit fold, and the crease where the sleeve gathers at the elbow
      c.save();
      c.clip(sl);
      const ink = U.rgba(C.sumi, 0.78);
      const crease = (p0, pc, p1, w0, w1) => {
        const a = L(p0), m = L(pc), b = L(p1);
        B.taper(c, B.qpts(a[0], a[1], m[0], m[1], b[0], b[1], 16), w0, w1, ink, 0.12);
      };
      crease([G[0] - 30, G[1] + 90], [G[0] - 58, G[1] + 270], [G[0] - 70, G[1] + 470], 2.6, 1.0);
      crease([A[0] - 80, A[1] + 200], [A[0] - 108, A[1] + 340], [A[0] - 120, A[1] + 520], 2.4, 1.0);
      crease([A[0] - 178, A[1] + 242], [A[0] - 112, A[1] + 252], [A[0] - 98, A[1] + 356], 2.3, 0.9);
      c.restore();
    });
  }
  let emptyA = null;
  function emptyAprime(ctx, T) {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    if (emptyA && emptyA.width === cw && emptyA.height === ch) return emptyA;
    const cv = B.canvas(cw, ch), c = cv.getContext('2d'), k = cw / W;
    // the inserts' flattened plates (the table is the same still one), then the old paper
    c.drawImage(flatAprime(ctx), 0, 0);
    c.setTransform(k, 0, 0, k, 0, 0);
    shotA().ageFrame(c, 185, { amount: 1 });
    emptyA = cv;
    return cv;
  }
  /**
   * The first impression inside the diamond: framed on the 三方, the thief's
   * arm and たけ (183), then, as the child climbs up and sits (184.2–186.0),
   * a slow push onto her — ≈100 px tall when she turns and looks out (186).
   */
  const innerCrop = (T) => {
    const u = E.inOutSine(U.seg(T, 184.2, 186.0));
    return { scale: U.lerp(2.2, 2.6, u), about: [U.lerp(1035, 1040, u), U.lerp(676, 675, u)] };
  };
  // CAST's weave clip (foxHand 'over'): the left little finger from 30 px before the foot
  // crossing to past its tip, ±70 across (canonical units → stage, at rest)
  const OVER_CLIP = [[18.8, 41.2], [-66.4, 152.4], [40.3, 233.9], [125.5, 122.7]].map(([x, y]) => [FW.x + x * FW.s, FW.y + y * FW.s]);
  /** the window's first impression fades as the fingers unhook (it is only there while the window is) */
  const insideAt = (T) => 1 - E.inOutSine(U.seg(T, 189.08, 189.4));
  function drawFoxWindow(ctx, T) {
    const A = shotA();
    // the late night outside the window: A′, empty (these are her own hands) —
    // the print table is still from 160.62, so the aged engawa is printed once
    const bg = emptyAprime(ctx, T);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bg, 0, 0);
    ctx.restore();
    const h = handsAt(T), dy0 = h.y - FW.y;
    const tw = h.tremble ? (Math.sin(T * 56.5) * 0.7 + Math.sin(T * 37 + 1) * 0.3) * 2 * h.tremble : 0;
    const aL = armAt(T, -1, tw), aR = armAt(T, 1, tw);
    if (dy0 + Math.min(aL.dy, aR.dy) > H + 420 - FW.y) return;
    // the window's diamond: each side corner goes with its own hand, the crossings between the two
    const s = FW.s, P = (a, p) => armPt(a, dy0, p, true);
    const mid = (p) => { const l = P(aL, p), r = P(aR, p); return [(l[0] + r[0]) / 2, (l[1] + r[1]) / 2]; };
    const corners = [P(aL, [FW.x - FWG.Wd * s, FW.y]), mid([FW.x, FW.y - FWG.Hd * s]), P(aR, [FW.x + FWG.Wd * s, FW.y]), mid([FW.x, FW.y + FWG.Hd * s])];
    const cen = mid([FW.x, FW.y]);
    const ins = insideAt(T);
    if (ins > 0.002) {
      // inside: the first impression, still playing at T − 150
      const Tp = T - 150;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(corners[0][0], corners[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(corners[i][0], corners[i][1]);
      ctx.closePath();
      ctx.clip();
      const bx = [Math.min(...corners.map((p) => p[0])), Math.min(...corners.map((p) => p[1])), Math.max(...corners.map((p) => p[0])), Math.max(...corners.map((p) => p[1]))];
      ctx.save();
      ctx.fillStyle = C.kinari;
      ctx.fillRect(bx[0] - 2, bx[1] - 2, bx[2] - bx[0] + 4, bx[3] - bx[1] + 4);
      A.cropTransform(ctx, Object.assign(innerCrop(T), { to: cen }));
      // she turns on the 186.0 beat: back view to 185.75, profile to 186.0, then the
      // three-quarter look straight out, held through the andon going out (187.0)
      A.drawGarden(ctx, Tp, { camera: false, gazeOut: U.seg(Tp, 35.56, 36.28) });
      ctx.restore();
      if (ins < 0.998) {
        // … dissolving into the empty late engawa behind it as the window comes apart
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1 - ins;
        ctx.drawImage(bg, 0, 0);
      }
      ctx.restore();
    }
    // her forearms in the 波兎 sleeves and the old hands — carved once at rest, each
    // arm printed where it is now: the rise, the tremble (the left hand and the right
    // against each other, each whole), the letting go
    const R = restSprites(ctx);
    const k = ctx.canvas.width / W;
    ctx.save();
    const put = (spr, a, hand, clip) => {
      ctx.save();
      if (Math.abs(a.a) < 1e-6 && (!hand || Math.abs(a.b) < 1e-6)) {
        // at rest: copied 1:1 on whole device px
        ctx.setTransform(1, 0, 0, 1, Math.round(a.dx * k), Math.round((a.dy + dy0) * k + spr.y) - spr.y);
        ctx.imageSmoothingEnabled = false;
      } else {
        ctx.setTransform(1, 0, 0, 1, (a.ex + a.dx) * k, (a.ey + a.dy + dy0) * k);
        ctx.rotate(a.a);
        ctx.translate(-a.ex * k, -a.ey * k);
        if (hand) { ctx.translate(a.wx * k, a.wy * k); ctx.rotate(a.b); ctx.translate(-a.wx * k, -a.wy * k); }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'low';
      }
      if (clip) { ctx.beginPath(); clip.forEach((p, i) => (i ? ctx.lineTo(p[0] * k, p[1] * k) : ctx.moveTo(p[0] * k, p[1] * k))); ctx.closePath(); ctx.clip(); }
      ctx.drawImage(spr.cv, spr.x, spr.y);
      ctx.restore();
    };
    put(R.sleeveL, aL); put(R.sleeveR, aR);
    // the fingers' weave: the left hand, the right over it (its little finger over the left
    // index at the top), then the left little finger's far half again, over the right index
    // at the foot — CAST's own 'over' clip, carried with the left hand
    put(R.handL, aL, true); put(R.handR, aR, true); put(R.handL, aL, true, OVER_CLIP);
    ctx.restore();
  }
  // the sleeves and the hands at rest (h.y = FW.y, no tremble), each arm on its own,
  // carved at the stage's resolution and cut to their ink ({cv, x, y}: device px)
  let rest = null;
  function trimDev(cv, oy) {
    // (read through a fresh copy: one readback per canvas)
    const w = cv.width, hh = cv.height, rd = B.canvas(w, hh), rc = rd.getContext('2d');
    rc.drawImage(cv, 0, 0);
    const d = rc.getImageData(0, 0, w, hh).data;
    rd.width = rd.height = 0;
    let x0 = w, y0 = hh, x1 = -1, y1 = -1;
    for (let y = 0; y < hh; y++) {
      const row = y * w * 4;
      for (let x = 0; x < w; x++) if (d[row + x * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; y1 = y; }
    }
    if (x1 < 0) return { cv: B.canvas(1, 1), x: 0, y: oy };
    x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(w - 1, x1 + 2); y1 = Math.min(hh - 1, y1 + 2);
    const out = B.canvas(x1 - x0 + 1, y1 - y0 + 1);
    out.getContext('2d').drawImage(cv, -x0, -y0);
    cv.width = cv.height = 0;
    return { cv: out, x: x0, y: oy + y0 };
  }
  function restSprites(ctx) {
    const cw = ctx.canvas.width;
    if (rest && rest.cw === cw) return rest;
    const k = cw / W, y0 = FW.y - 272, y1 = H + 80;
    // (y0·k is kept as it falls: the sprites print at round(y0·k + dy·k), as they always have)
    const mk = (paint) => {
      const cv = B.canvas(cw, Math.ceil((y1 - y0) * k)), c = cv.getContext('2d');
      c.setTransform(k, 0, 0, k, 0, -y0 * k);
      paint(c);
      return cv;
    };
    const h = { x: FW.x, y: FW.y, s: FW.s };
    const CAST = TSUKI.CAST;
    const hopts = { pose: 'fox-window', age: 1, interlace: 1, t: 0, tremble: 0, sleeve: false };
    const T = 185;
    // one hand alone, at rest: the pair drawn apart (interlace 0 — each hand 130 out and
    // 30 down), shifted so this hand lands home, and the other cut away
    const oneHand = (side, extra) => (c) => {
      c.save();
      c.beginPath();
      if (side < 0) c.rect(-50, y0 - 50, FW.x + 130 * FW.s + 50, y1 - y0 + 100);
      else c.rect(FW.x - 130 * FW.s, y0 - 50, W, y1 - y0 + 100);
      c.clip();
      CAST.hands(c, h.x - side * 130 * h.s, h.y - 30 * h.s, h.s, Object.assign({}, hopts, { interlace: 0 }, extra));
      c.restore();
    };
    // the same authored window as in 三, old: moonlit skin in one flat pale
    // block, carved 墨 key lines, knuckles, creases, a few age spots; where the
    // moon (upper right) catches them, a narrow 胡粉 bokashi printed INSIDE the
    // contour (no light rim outside the key line) — read off the pair's own silhouette
    const hand = (side) => {
      const cv = mk((c) => PRINT.with(c, 'K', T, (cc) => oneHand(side, { palette: winPal(), ink: C.sumi, outline: 0.9 })(cc)));
      moonlitEdge(cv, k, y0, (c) => CAST.hands(c, h.x, h.y, h.s, Object.assign({}, hopts, { silhouette: '#fff' })));
      return trimDev(cv, y0 * k);
    };
    rest = {
      cw,
      sleeveL: trimDev(mk((c) => sleeve(c, T, h, -1)), y0 * k),
      sleeveR: trimDev(mk((c) => sleeve(c, T, h, 1)), y0 * k),
      handL: hand(-1),
      handR: hand(1),
    };
    return rest;
  }
  /**
   * The moon's touch on the old hands: a narrow bokashi of 胡粉 laid inside the
   * hands' contour along the edges that face the moon (upper right) — the hand
   * silhouette minus itself shifted a few px toward the lower left, softened,
   * kept inside the silhouette — printed on the skin only (never on the key
   * lines, which stay whole and dark). Build time only.
   */
  function moonlitEdge(cv, k, y0, silhouette) {
    const w = cv.width, h = cv.height;
    const mk = () => { const m = B.canvas(w, h), c = m.getContext('2d'); c.setTransform(k, 0, 0, k, 0, -y0 * k); return [m, c]; };
    const [sil, sc] = mk();
    silhouette(sc);
    const [soft, fc] = mk();
    fc.setTransform(1, 0, 0, 1, 0, 0);
    // what the moon sees: the silhouette minus itself pushed toward the lower left …
    const [rim, rc] = mk();
    rc.setTransform(1, 0, 0, 1, 0, 0);
    const d = Math.max(2, Math.round(9 * k));
    rc.drawImage(sil, 0, 0);
    rc.globalCompositeOperation = 'destination-out';
    rc.drawImage(sil, -d, d);
    // … softened into a bokashi and kept inside the hands
    fc.filter = `blur(${Math.max(1, 3.2 * k).toFixed(1)}px)`;
    fc.drawImage(rim, 0, 0);
    fc.filter = 'none';
    fc.globalCompositeOperation = 'destination-in';
    fc.drawImage(sil, 0, 0);
    const c = cv.getContext('2d');
    const img = c.getImageData(0, 0, w, h), px = img.data;
    const S = fc.getImageData(0, 0, w, h).data;
    const g = U.hexToRgb(aged(U.mix(C.gofun, C.geppaku, 0.3)));
    for (let i = 0; i < px.length; i += 4) {
      if (!px[i + 3] || !S[i + 3]) continue;
      const lum = (0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2]) / 255;
      const a = Math.min(0.8, (S[i + 3] / 255) * 1.1) * U.clamp((lum - 0.32) / 0.22);   // the skin, not the key line
      if (a <= 0) continue;
      px[i] += (g[0] - px[i]) * a; px[i + 1] += (g[1] - px[i + 1]) * a; px[i + 2] += (g[2] - px[i + 2]) * a;
    }
    c.putImageData(img, 0, 0);
    sil.width = sil.height = rim.width = rim.height = soft.width = soft.height = 0;
  }
  // old skin under the moon: the flesh block (胡粉 + 狐色) pulled toward 藍, on the late paper
  let WIN_PAL = null;
  const winPal = () => {
    if (WIN_PAL) return WIN_PAL;
    const skin = aged(U.mix(U.mix(C.gofun, C.kitsune, 0.28), C.ai, 0.22));
    return (WIN_PAL = {
      skin, skinOld: skin,
      crease: U.mix(C.sumi, C.ai, 0.2),
      spot: U.mix(skin, C.odo, 0.5),
      vein: U.mix(C.ai, skin, 0.35),
      nail: aged(U.mix(C.gofun, C.ai, 0.3)),
    });
  };

  /* ------------------------------------------------------------------ */
  TSUKI.scene('atozuri', {
    init(S) {
      const k = S.k || 1;
      try {
        const A = shotA();
        if (A.warmLate) A.warmLate(k);
        if (A.warmJolt) A.warmJolt(k);           // the jolt's two impressions (160.0–160.62)
        const cv = B.canvas(Math.round(W * k), Math.round(H * k)), c = cv.getContext('2d');
        c.setTransform(k, 0, 0, k, 0, 0);
        kakeCaches(c);
        emptyAprime(c, 185);
        restSprites(c);
        namiPattern(c);
        spoutAt();
        figSprite(c, 'pour'); figSprite(c, 'seiza');
        flatAprime(c);
        cupsStill(c, 'pour'); cupsStill(c, 'seiza'); stripStill(c);
        drawInsertCups(c, 170.75);                      // carves the hold's finished frame
        drawFoxWindow(c, 182.5);                        // the inset's first frame (its crop's glow, sprites)
        // every still is carved from the flat plates now: let them go (flatAprime re-carves on demand)
        if (flatA) { flatA.width = flatA.height = 0; flatA = null; }
        // the moon's printed rabbit at the crop's size, before the first frame needs it
        MOON.draw(c, KMOON.x, KMOON.y, KMOON.r, 178, {});
      } catch (e) { /* warming is only an optimisation */ }
    },
    draw(ctx, t, S) {
      const T = S.seg.start + t;
      if (T < 169) shotA().drawLate(ctx, T);
      else if (T < 171) drawInsertCups(ctx, T);
      else if (T < 173) drawInsertStrip(ctx, T);
      else if (T < 181.4) drawKakemono(ctx, T);
      else if (T < 182) drawKakemonoOut(ctx, T);
      else drawFoxWindow(ctx, T);
    },
  });
})(window.TSUKI = window.TSUKI || {});
