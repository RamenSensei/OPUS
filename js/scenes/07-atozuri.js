/* ==========================================================================
   07-atozuri.js — 六　後摺 (160–190): the same garden, pulled sixty years later.
     160.0–169.0  Shot A from the worn blocks (PRINT's jolt 160–160.6; the worn
                  blocks replace the fresh ones at the first peak of the shake):
                  flat sky, broken lines, reeds, the dry sōzu, a torn shoji — only
                  the moon fresh. A bent figure in the 波兎 haori on たけ's exact
                  path (old 小夜): fifteen dango, one per (partly silent) pluck.
                  (TSUKI.SHOTS.A.drawLate — a cached, aged snapshot after 160.62.)
     169.0–171.0  A′ insert: old hands pour two cups — the far one first (169.0),
                  then the near one (169.62), which steams; the pot is set down
                  (170.34); the push ends on the untouched cup, a tiny moon
                  floating in its tea, held 170.5–171.0.
     171.0–173.0  A′ insert: the jug's susuki tied with a strip of the faded red
                  heko-obi — 退紅, hand-applied, overrunning its key line. It is 小夜.
     173.0–182.0  月に雁: yellowed margins close to a tall 640 × 1080 kakemono;
                  flat pale 藍, the fresh moon (960,330) r 120, three geese
                  descending across it, the third lagging; 白居易's couplet is the
                  DOM 画賛 in the left margin (173.6–181.6). Margins open 181.4–182.
     182.0–190.0  A′: her old hands rise already joined in the fox window (墨
                  silhouettes against the moonlit paper, a 銀鼠 rim on the
                  moon side, pale knuckle creases; the 波兎 sleeves rising from
                  below the frame); inside the diamond the first impression still
                  plays at T − 150; 186–187 the little girl turns and looks out;
                  187 the andon goes out; 188 the hands tremble; 189.1 they fall —
                  still falling when the cut lands at 190.
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
  /* A′ inserts: the offerings of the late night, at A′ scale            */
  /* ------------------------------------------------------------------ */
  const OS = { x: 1066, y: 950, s: 1.65 };     // old 小夜 on たけ's exact spot in A′ (cf. 五)
  const JUG = { x: 410, y: 948 };
  const SANBO = { x: 520, y: 950 };
  const BOX = { x: 296, y: 950 };
  const POT_DOWN = { x: 986, y: 958 };         // where the pot is set down, beside her knee

  function cupPath(x, y, w, h) {
    const p = new Path2D();
    p.moveTo(x - w / 2, y - h);
    p.bezierCurveTo(x - w / 2 - 1, y - h * 0.4, x - w * 0.42, y - 1, x - w * 0.34, y);
    p.lineTo(x + w * 0.34, y);
    p.bezierCurveTo(x + w * 0.42, y - 1, x + w / 2 + 1, y - h * 0.4, x + w / 2, y - h);
    p.closePath();
    return p;
  }
  /** a yunomi on the boards; tea level, optional steam; returns the tea surface */
  function drawCup(ctx, T, x, y, o) {
    const k = o.scale || 1;
    const w = 30 * k, h = 30 * k;
    const pen = shotA().livePen(ctx, T);
    const body = cupPath(x, y, w, h);
    const rim = new Path2D();
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
      c.strokeStyle = U.rgba(C.sumi, 0.85); c.lineWidth = 1.1; c.stroke(body); c.stroke(rim);
      c.fillStyle = U.rgba(C.sumi, 0.6); c.fillRect(x - w * 0.3, y - 1.2, w * 0.6, 1.4);
    });
    if (o.steam > 0) {
      pen('P7', (c) => {
        c.lineCap = 'round';
        for (let j = 0; j < 3; j++) {
          c.strokeStyle = U.rgba(C.gofun, 0.3 * Math.min(1, o.steam * 2) * (1 - j * 0.15));
          c.lineWidth = 2.2 - j * 0.4;
          c.beginPath();
          for (let i = 0; i <= 14; i++) {
            const s = i / 14;
            const px = x - 5 + j * 5 + Math.sin(s * 6 + T * 1.4 + j * 2.2) * 4 * s + s * 6;
            const py = y - h - 4 - s * (46 + j * 10) * o.steam;
            i ? c.lineTo(px, py) : c.moveTo(px, py);
          }
          c.stroke();
        }
      });
    }
    pen.flush();
    return { teaX: x, teaY: y - h + 0.8 * k, rx: w / 2 - 1.6 * k, ry: 3.0 * k };
  }
  /** the 土瓶 set down on the boards: a round earthen pot, a spout, a cane handle */
  function drawPot(ctx, T, x, y) {
    const pen = shotA().livePen(ctx, T);
    const body = new Path2D();
    body.moveTo(x - 22, y - 4);
    body.bezierCurveTo(x - 26, y - 24, x - 14, y - 34, x, y - 34);
    body.bezierCurveTo(x + 14, y - 34, x + 26, y - 24, x + 22, y - 4);
    body.quadraticCurveTo(x, y + 2, x - 22, y - 4);
    body.closePath();
    const spout = new Path2D();
    spout.moveTo(x - 20, y - 16); spout.quadraticCurveTo(x - 32, y - 20, x - 38, y - 32); spout.lineTo(x - 34, y - 34);
    spout.quadraticCurveTo(x - 28, y - 25, x - 19, y - 24); spout.closePath();
    const lid = new Path2D();
    lid.ellipse(x, y - 34, 10, 2.6, 0, 0, TAU);
    lid.moveTo(x + 3, y - 38); lid.ellipse(x, y - 38, 3, 2.2, 0, 0, TAU);
    const handle = new Path2D();
    handle.moveTo(x - 17, y - 28); handle.bezierCurveTo(x - 18, y - 58, x + 18, y - 58, x + 17, y - 28);
    const pc = U.mix(C.odo, C.sumi, 0.5);
    pen('P1', (c) => {
      c.fillStyle = pc; c.fill(body); c.fill(spout);
      c.fillStyle = U.mix(pc, C.kinari, 0.25); c.fill(lid);
      c.save(); c.clip(body); c.fillStyle = U.mix(pc, C.sumi, 0.3); c.fillRect(x + 6, y - 40, 30, 44); c.restore();
      c.strokeStyle = U.mix(C.kuchiba, C.odo, 0.4); c.lineWidth = 2.4; c.lineCap = 'round'; c.stroke(handle);
    });
    pen('K', (c) => {
      c.strokeStyle = U.rgba(C.sumi, 0.85); c.lineWidth = 1.1;
      c.stroke(body); c.stroke(spout); c.stroke(lid);
      c.lineWidth = 0.8; c.stroke(handle);
    });
    pen.flush();
  }

  /** the jug of susuki (grey in the late print), the 三方 with fifteen dango, the lacquer box, the paper cut-out */
  function drawLateOfferings(ctx, T) {
    const A = shotA();
    const pen = A.livePen(ctx, T);
    const { x: jx, y: jy } = JUG;
    // the jug (鼠 stoneware)
    const jug = new Path2D();
    jug.moveTo(jx - 14, jy - 86);
    jug.bezierCurveTo(jx - 16, jy - 78, jx - 10, jy - 70, jx - 22, jy - 58);
    jug.bezierCurveTo(jx - 42, jy - 40, jx - 38, jy - 6, jx - 22, jy);
    jug.lineTo(jx + 22, jy);
    jug.bezierCurveTo(jx + 38, jy - 6, jx + 42, jy - 40, jx + 22, jy - 58);
    jug.bezierCurveTo(jx + 10, jy - 70, jx + 16, jy - 78, jx + 14, jy - 86);
    jug.closePath();
    const mouth = new Path2D();
    mouth.ellipse(jx, jy - 86, 14, 4, 0, 0, TAU);
    pen('P4', (c) => {
      c.fillStyle = C.nezumi; c.fill(jug);
      c.save(); c.clip(jug); c.fillStyle = U.mix(C.nezumi, C.sumi, 0.3); c.fillRect(jx + 8, jy - 90, 40, 94); c.restore();
      c.fillStyle = U.mix(C.nezumi, C.sumi, 0.5); c.fill(mouth);
      // a run of glaze
      c.fillStyle = U.rgba(C.ginnezu, 0.7);
      c.beginPath(); c.moveTo(jx - 8, jy - 60); c.quadraticCurveTo(jx - 4, jy - 34, jx - 9, jy - 22); c.quadraticCurveTo(jx - 13, jy - 36, jx - 12, jy - 58); c.closePath(); c.fill();
    });
    pen('K', (c) => { c.strokeStyle = U.rgba(C.sumi, 0.85); c.lineWidth = 1.4; c.stroke(jug); c.stroke(mouth); });
    // the susuki in the jug (grey plumes: the warm and fresh blocks are gone)
    const r = U.rng(606);
    const stems = new Path2D(), hairs = new Path2D(), hairsHi = new Path2D(), key = new Path2D(), leaves = new Path2D();
    const sway = Math.sin(T * 0.8) * 0.012;
    for (let i = 0; i < 6; i++) {
      const a = U.lerp(-0.42, 0.36, i / 5) + U.lerp(-0.05, 0.05, r()) + sway;
      const L = U.lerp(150, 205, r());
      const bx = jx + U.lerp(-5, 5, r()), by = jy - 84;
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
    pen('P3', (c) => { c.fillStyle = U.mix(C.matsuba, C.nezumi, 0.4); c.fill(leaves); });
    pen('P4', (c) => { c.fillStyle = U.mix(C.nezumi, C.rikyu, 0.45); c.fill(stems); c.fillStyle = C.ginnezu; c.fill(hairs); });
    pen('P7', (c) => { c.fillStyle = U.mix(C.gofun, C.ginnezu, 0.35); c.fill(hairsHi); });
    pen('K', (c) => { c.strokeStyle = U.rgba(C.sumi, 0.75); c.lineWidth = 0.9; c.stroke(key); });
    // the 三方 with fifteen dango stacked 9 · 4 · 2, seen from the front:
    // three on the tray (the row behind peeping between), two in the hollows, one on top
    const { x: sx, y: sy } = SANBO;
    const tray = new Path2D();
    tray.moveTo(sx - 46, sy - 58); tray.lineTo(sx + 46, sy - 58); tray.lineTo(sx + 42, sy - 44); tray.lineTo(sx - 42, sy - 44); tray.closePath();
    const rimT = new Path2D();
    rimT.moveTo(sx - 46, sy - 58); rimT.lineTo(sx - 42, sy - 62); rimT.lineTo(sx + 42, sy - 62); rimT.lineTo(sx + 46, sy - 58);
    const stand = new Path2D();
    stand.moveTo(sx - 32, sy - 44); stand.lineTo(sx + 32, sy - 44); stand.lineTo(sx + 36, sy); stand.lineTo(sx - 36, sy); stand.closePath();
    const hole = new Path2D();
    hole.moveTo(sx - 9, sy - 8); hole.lineTo(sx - 9, sy - 26); hole.quadraticCurveTo(sx, sy - 36, sx + 9, sy - 26); hole.lineTo(sx + 9, sy - 8); hole.closePath();
    const back = new Path2D(), front = new Path2D();
    const rr = 9.2, base = sy - 60 - rr + 1;
    const ball = (p, x, y, s) => { p.moveTo(x + rr * s, y); p.ellipse(x, y, rr * s, rr * s * 0.95, 0, 0, TAU); };
    ball(back, sx - 9.2, base - 5, 0.96); ball(back, sx + 9.2, base - 5, 0.96);
    for (const dx of [-18.4, 0, 18.4]) ball(front, sx + dx, base, 1);
    for (const dx of [-9.2, 9.2]) ball(front, sx + dx, base - 16, 1);
    ball(front, sx, base - 32, 1);
    pen('P1', (c) => {
      c.fillStyle = U.mix(C.kinari, C.odo, 0.35); c.fill(stand);
      c.fillStyle = U.mix(C.kinari, C.odo, 0.22); c.fill(tray);
      c.fillStyle = U.mix(C.odo, C.sumi, 0.45); c.fill(hole);
    });
    pen('K', (c) => { c.strokeStyle = U.rgba(C.sumi, 0.85); c.lineWidth = 1.2; c.stroke(tray); c.stroke(rimT); c.stroke(stand); c.stroke(hole); });
    // the row behind first (it peeps between the front three), then the front of the stack
    pen('P7', (c) => { c.fillStyle = U.mix(C.gofun, C.torinoko, 0.45); c.fill(back); });
    pen('K', (c) => { c.strokeStyle = U.rgba(C.sumi, 0.85); c.lineWidth = 0.9; c.stroke(back); });
    pen.flush();
    pen('P7', (c) => { c.fillStyle = U.mix(C.gofun, C.torinoko, 0.22); c.fill(front); });
    pen('K', (c) => { c.strokeStyle = U.rgba(C.sumi, 0.85); c.lineWidth = 0.9; c.stroke(front); });
    // the black-lacquer box of old paper cut-outs (no 朱: 墨 with 銀鼠 highlights)
    const { x: bx0, y: by0 } = BOX;
    const box = new Path2D();
    box.rect(bx0 - 44, by0 - 30, 88, 30);
    const lid = new Path2D();
    lid.rect(bx0 - 47, by0 - 38, 94, 9);
    pen('P4', (c) => {
      c.fillStyle = U.mix(C.sumi, C.enji, 0.12); c.fill(box); c.fill(lid);
      c.fillStyle = U.rgba(C.ginnezu, 0.8); c.fillRect(bx0 - 42, by0 - 36.5, 60, 1.6); c.fillRect(bx0 - 40, by0 - 26, 1.4, 20);
    });
    pen('K', (c) => { c.strokeStyle = U.rgba(C.sumi, 0.9); c.lineWidth = 1; c.stroke(box); c.stroke(lid); });
    pen.flush();
    // the old 影絵 card of the bamboo grove, leaning on the lacquer box — flat 墨 paper on its stick
    const CAST = TSUKI.CAST;
    if (CAST && CAST.drawPuppet) {
      PRINT.with(ctx, 'K', T, (c) => {
        c.save();
        c.translate(bx0 + 64, by0 - 13);
        c.rotate(0.24);
        CAST.drawPuppet(c, 'bamboo', 0, 0, 0.19, { color: U.mix(C.sumi, C.odo, 0.12), sticks: true, stickAngle: 0.02, stickLen: 64, stickW: 4, t: 0, wind: 0 });
        c.restore();
      });
    }
  }
  /** 退紅: a strip torn from the heko-obi, tied round the stems — hand-applied, overrunning the key line */
  function drawStrip(ctx, T, a) {
    const { x: jx, y: jy } = JUG;
    const y = jy - 104;
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
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(jx - 11, y - 1); ctx.quadraticCurveTo(jx, y - 5, jx + 11, y - 2);
    ctx.moveTo(jx - 11, y + 4.5); ctx.quadraticCurveTo(jx, y + 1.5, jx + 11, y + 3.5);
    ctx.stroke();
    ctx.restore();
  }

  /** old 小夜 at A′ scale — carved once per pose at the insert's closest zoom (she holds still) */
  const figCache = {};
  const FIG_ZOOM = 4.8;
  function figSprite(c, pose) {
    const cw = c.canvas.width, key = pose + '|' + cw;
    if (figCache[key]) return figCache[key];
    const CAST = TSUKI.CAST;
    const bb = CAST.bounds('oldSayo', pose, {});
    const x0 = OS.x - (bb[0] + bb[2]) * OS.s - 6, y0 = OS.y + bb[1] * OS.s - 6;   // facing −1 mirrors the box
    const w = bb[2] * OS.s + 12, h = bb[3] * OS.s + 12;
    const k = (cw / W) * FIG_ZOOM;
    const cv = B.canvas(Math.ceil(w * k), Math.ceil(h * k)), g = cv.getContext('2d');
    g.setTransform(k, 0, 0, k, -x0 * k, -y0 * k);
    CAST.oldSayo(g, OS.x, OS.y, OS.s, { pose, facing: -1, t: 0, stream: false, palette: { obijime: U.mix(C.kon, C.ginnezu, 0.3) } });
    return (figCache[key] = { cv, x0, y0, w, h });
  }
  function drawOldSayoA(c, T, pose) {
    const f = figSprite(c, pose);
    PRINT.with(c, 'K', T, (k) => {
      k.imageSmoothingEnabled = true;
      k.imageSmoothingQuality = 'low';
      k.drawImage(f.cv, f.x0, f.y0, f.w, f.h);
    });
  }
  /** flat, hard-edged 藍鼠 floor shadows to the lower left (the moon is off-frame upper right) */
  function castLateShadows(c, T, cam, pose, withFigure, withPot, withOfferings) {
    const SA = TSUKI.SHOTS.A_prime;
    if (!SA || !SA.castShadow) return;
    const CAST = TSUKI.CAST;
    const res = U.clamp(cam.scale, 1, 2.2);        // crisp at the insert's scale: no airbrushed penumbra
    if (withFigure) SA.castShadow(c, T, (s2) => CAST.oldSayo(s2, OS.x, OS.y, OS.s, { pose, facing: -1, t: T, silhouette: '#000', noBuffer: true, stream: false }), { baseY: OS.y, alpha: 0.45, len: 1.3, bbox: [860, 640, 1180, 960], res });
    if (withPot) SA.castShadow(c, T, (s2) => { s2.fillStyle = '#000'; s2.beginPath(); s2.ellipse(POT_DOWN.x, POT_DOWN.y - 17, 22, 17, 0, 0, TAU); s2.fill(); }, { baseY: POT_DOWN.y, alpha: 0.45, len: 1.2, bbox: [960, 900, 1012, 960], res });
    if (withOfferings) {
      SA.castShadow(c, T, (s2) => {
        s2.fillStyle = '#000';
        s2.beginPath();
        s2.moveTo(JUG.x - 14, JUG.y - 86); s2.bezierCurveTo(JUG.x - 10, JUG.y - 70, JUG.x - 42, JUG.y - 40, JUG.x - 22, JUG.y);
        s2.lineTo(JUG.x + 22, JUG.y); s2.bezierCurveTo(JUG.x + 42, JUG.y - 40, JUG.x + 10, JUG.y - 70, JUG.x + 14, JUG.y - 86); s2.closePath(); s2.fill();
        s2.fillRect(SANBO.x - 36, SANBO.y - 62, 72, 62);
        s2.beginPath(); s2.moveTo(SANBO.x - 28, SANBO.y - 60); s2.lineTo(SANBO.x, SANBO.y - 112); s2.lineTo(SANBO.x + 28, SANBO.y - 60); s2.closePath(); s2.fill();
        s2.fillRect(BOX.x - 47, BOX.y - 38, 94, 38);
      }, { baseY: 948, alpha: 0.45, len: 1.1, bbox: [250, 820, 580, 950], res });
    }
  }

  let SPOUT = null;
  /** the spout of the pot in the 'pour' pose (CAST's own point) */
  function spoutAt() {
    if (SPOUT) return SPOUT;
    const CAST = TSUKI.CAST;
    const cv = B.canvas(4, 4);
    const ret = CAST.oldSayo(cv.getContext('2d'), OS.x, OS.y, OS.s, { pose: 'pour', facing: -1, t: 0, stream: false });
    SPOUT = ret && ret.spout ? ret.spout.slice() : [904, 875];
    return SPOUT;
  }
  /** the two cups: the far one (poured first, left untouched) a little behind and to the left */
  const cups = () => { const s = spoutAt(); return { near: { x: s[0] + 2, y: 952, k: 1 }, far: { x: s[0] - 25, y: 939, k: 0.93 } }; };
  // insert 1 camera: the hands, the pot, the two cups — then the push to the untouched cup (held from 170.5)
  const CAM1 = (T) => {
    const u = U.seg(T, 169.85, 170.5, E.inOutSine);
    const f = cups().far;
    const drift = U.seg(T, 169, 171);
    return { scale: U.lerp(2.3 + 0.06 * drift, 4.7, u), about: [U.lerp(972, f.x + 2, u), U.lerp(884, f.y - 22, u)], to: [960, U.lerp(640, 600, u)] };
  };
  function drawInsertCups(ctx, T) {
    const cam = CAM1(T);
    const CU = CUES();
    const tea = CU.tea || [169.0, 169.62], tick = (CU.teaTick || [170.34])[0];
    const down = T >= tick;
    const pose = down ? 'seiza' : 'pour';
    const cp = cups();
    const sp = spoutAt();
    let far = null;
    drawAprime(ctx, T, {
      camera: cam,
      age: false,
      between: {
        post: (c) => castLateShadows(c, T, cam, pose, true, down, false),
        eave: (c) => {
          if (down) drawPot(c, T, POT_DOWN.x, POT_DOWN.y);
          drawOldSayoA(c, T, pose);
          const fillFar = U.seg(T, tea[0] + 0.08, tea[0] + 0.5), fillNear = U.seg(T, tea[1] + 0.08, tea[1] + 0.5);
          far = drawCup(c, T, cp.far.x, cp.far.y, { fill: fillFar, steam: 0, scale: cp.far.k });
          drawCup(c, T, cp.near.x, cp.near.y, { fill: fillNear, steam: U.seg(T, tea[1] + 0.3, tea[1] + 1.3), scale: cp.near.k });
          // the streams: short falls from the spout, the first bending a little toward the far cup
          const pour = (tx, ty, a) => {
            if (a <= 0) return;
            PRINT.with(c, 'P3', T, (k) => {
              k.strokeStyle = U.rgba(TEA, 0.9 * a);
              k.lineCap = 'round';
              k.lineWidth = 2.2;
              k.beginPath();
              k.moveTo(sp[0], sp[1]);
              k.bezierCurveTo(sp[0] - 3, sp[1] + 6, tx + (sp[0] - tx) * 0.15, ty - (ty - sp[1]) * 0.45, tx, ty);
              k.stroke();
              k.fillStyle = U.rgba(C.gofun, 0.5 * a);
              k.beginPath(); k.ellipse(tx, ty + 0.5, 3.2, 0.9, 0, 0, TAU); k.fill();
            });
          };
          pour(cp.far.x + 1, cp.far.y - 30 * cp.far.k + 1, U.env(T, tea[0], tea[0] + 0.06, tea[0] + 0.44, tea[0] + 0.52, E.linear));
          pour(cp.near.x, cp.near.y - 30 + 1, U.env(T, tea[1], tea[1] + 0.06, tea[1] + 0.44, tea[1] + 0.52, E.linear));
        },
      },
    });
    if (!far) return;
    // the one untouched cup holds a tiny moon — the moon is never old: a hole in the age
    const [mx, my] = camPoint(cam, far.teaX, far.teaY + 0.2);
    const mr = 5.2 * cam.scale;
    ageInsert(ctx, cam, [[mx, my, far.rx * cam.scale, far.ry * cam.scale]]);
    const ma = U.seg(T, tea[0] + 0.7, tea[0] + 1.3, E.inOutSine);
    if (ma > 0.001) {
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
  }

  // insert 2 camera: the jug and its strip
  const CAM2 = (T) => {
    const u = U.seg(T, 171, 173, E.inOutSine);
    return { scale: U.lerp(2.75, 3.0, u), about: [U.lerp(452, 440, u), U.lerp(872, 866, u)], to: [960, 560] };
  };
  function drawInsertStrip(ctx, T) {
    const cam = CAM2(T);
    drawAprime(ctx, T, {
      camera: cam,
      age: false,
      between: {
        post: (c) => castLateShadows(c, T, cam, 'seiza', false, false, true),
        eave: (c) => drawLateOfferings(c, T),
      },
    });
    ageInsert(ctx, cam);
    // hand-applied after the print (and after the years)
    ctx.save();
    camApply(ctx, cam);
    drawStrip(ctx, T, 1);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* 173–182: 月に雁                                                      */
  /* ------------------------------------------------------------------ */
  const PANEL = { x0: 640, x1: 1280 };
  const KMOON = { x: 960, y: 330, r: 120 };
  const PANEL_INK = U.mix(U.mix(C.ai, C.bero, 0.35), C.gunjo, 0.45);
  const GEESE = [
    { t0: 174.0, speed: 1.0, span: 210, off: [0, 0], ph: 0.0 },
    { t0: 174.35, speed: 1.0, span: 170, off: [-128, -34], ph: 0.33 },
    { t0: 175.4, speed: 0.8, span: 140, off: [-46, -168], ph: 0.52 },
  ];
  const FLY = { p0: [1402, -150], p1: [470, 820], dur: 7.0 };
  // the two caches of the crop: the aged 藍 field of the panel, and the aged margin paper
  let kake = null;
  function kakeCaches(ctx) {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    if (kake && kake.cw === cw && kake.ch === ch) return kake;
    const k = cw / W;
    const mk = (paint, amount) => {
      const cv = B.canvas(cw, ch), c = cv.getContext('2d');
      c.setTransform(k, 0, 0, k, 0, 0);
      c.fillStyle = C.kinari;
      c.fillRect(0, 0, W, H);
      paint(c);
      c.imageSmoothingQuality = 'low';
      PRINT.age(c, 175, { amount });
      return cv;
    };
    const field = mk((c) => {
      // flat pale 藍 from the worn sky block (P6 α 0.55) — no bokashi but one low band of mist (P7)
      c.fillStyle = U.rgba(PANEL_INK, 0.58);
      c.fillRect(0, 0, W, H);
      const g = c.createLinearGradient(0, 780, 0, 900);
      g.addColorStop(0, U.rgba(C.gofun, 0));
      g.addColorStop(0.55, U.rgba(C.gofun, 0.34));
      g.addColorStop(0.62, U.rgba(C.gofun, 0.34));
      g.addColorStop(1, U.rgba(C.gofun, 0));
      c.fillStyle = g;
      c.fillRect(0, 780, W, 120);
    }, 0.42);
    const margin = mk(() => {}, 1);
    kake = { cw, ch, field, margin };
    return kake;
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
  function goose(c, frame, ink) {
    const [lk, sw, fk, curl] = BEATS[frame];
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
  function drawGeese(ctx, T) {
    const ink = {
      sumi: C.sumi, body: aged(U.mix(C.nezumi, C.sumi, 0.25)), cov: aged(U.mix(C.nezumi, C.ginnezu, 0.2)),
      farCov: aged(U.mix(C.nezumi, C.sumi, 0.45)), belly: aged(U.mix(C.gofun, C.ginnezu, 0.15)), edge: U.rgba(C.sumi, 0.55),
      bar: U.rgba(C.sumi, 0.4),
    };
    const a = Math.atan2(FLY.p1[1] - FLY.p0[1], FLY.p1[0] - FLY.p0[0]) - Math.PI;
    PRINT.with(ctx, 'K', T, (c) => {
      for (const g of GEESE) {
        const u = (T - g.t0) * g.speed / FLY.dur;
        if (u < -0.02 || u > 1.05) continue;
        const x = U.lerp(FLY.p0[0], FLY.p1[0], u) + g.off[0], y = U.lerp(FLY.p0[1], FLY.p1[1], u) + g.off[1];
        const frame = Math.floor(U.fract(T * 1.2 + g.ph) * 4) % 4;
        c.save();
        c.translate(x, y);
        c.rotate(a * 0.78);
        const s = g.span / 210;
        c.scale(s * 1.08, s * 1.08);
        goose(c, frame, ink);
        c.restore();
      }
    });
  }
  function drawKakemono(ctx, T) {
    const inU = U.seg(T, 173.0, 173.8, E.outCubic);
    const outU = U.seg(T, 181.4, 182.0, E.inOutSine);
    const close = inU * (1 - outU);
    const K = kakeCaches(ctx);
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
    // the margins: yellowed washi sliding in from both sides
    if (close > 0.001) {
      margins(ctx, K, PANEL.x0 * close, W - (W - PANEL.x1) * close);
      const lw = PANEL.x0 * close, rx = W - (W - PANEL.x1) * close;
      ctx.save();
      ctx.strokeStyle = U.rgba(C.sumi, 0.85);
      ctx.lineWidth = 1;
      ctx.strokeRect(lw + 0.5, 0.5, rx - lw - 1, H - 1);
      ctx.strokeStyle = U.rgba(C.sumi, 0.1);
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(lw - 3, 0); ctx.lineTo(lw - 3, H); ctx.moveTo(rx + 3, 0); ctx.lineTo(rx + 3, H); ctx.stroke();
      ctx.restore();
    }
  }
  function margins(ctx, K, lw, rx) {
    const k = ctx.canvas.width / W;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const L = Math.ceil(lw * k), R = Math.floor(rx * k);
    if (L > 0) ctx.drawImage(K.margin, 0, 0, L, K.ch, 0, 0, L, K.ch);
    if (R < K.cw) ctx.drawImage(K.margin, R, 0, K.cw - R, K.ch, R, 0, K.cw - R, K.ch);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* 182–190: the fox window                                             */
  /* ------------------------------------------------------------------ */
  const FW = { x: 960, y: 452, s: 1.27 };
  function handsAt(T) {
    const rise = 1 - E.outCubic(U.seg(T, 182.0, 183.0));
    const fall = E.inOutSine(U.seg(T, 189.1, 190.6));
    const tremble = U.seg(T, 188.0, 188.25) * 0.67;
    return { x: FW.x, y: FW.y + 920 * rise + 820 * fall, s: FW.s, tremble };
  }
  // the geometry of CAST's fox-window hand (cast.js foxHand), for the sleeves and the creases
  const FWG = (() => {
    const Wd = 150, Hd = 115, D = Math.hypot(Wd, Hd);
    const e1 = [Wd / D, -Hd / D], out1 = [-Hd / D, -Wd / D], e2 = [Wd / D, Hd / D], out2 = [-Hd / D, Wd / D];
    const UV = (u, v) => [-Wd + e1[0] * u + out1[0] * v, e1[1] * u + out1[1] * v];
    const along = (e, o, sN, w) => [-Wd + e[0] * D * sN + o[0] * w, e[1] * D * sN + o[1] * w];
    return { D, UV, along, e1, out1, e2, out2 };
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
  /**
   * The forearms in their 波兎 sleeves, rising from below the frame to the
   * wrists (POV hands): flat 藍 shapes carrying the pattern, the dark lining
   * where the cuff opens round the wrist, 墨 key lines.
   */
  function sleeves(ctx, T, h, tw) {
    const pat = namiPattern(ctx);
    for (const side of [-1, 1]) {
      const L = (p) => [h.x + side * p[0] * h.s, h.y + p[1] * h.s + (side < 0 ? tw : -tw * 0.8) * h.s];
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
      PRINT.with(ctx, 'P5', T, (c) => {
        c.fillStyle = aged(C.ai); c.fill(sl);
        c.save();
        c.clip(sl);
        if (pat.setTransform) pat.setTransform(new DOMMatrix().translateSelf(h.x + side * 40, h.y).scaleSelf(0.56, 0.56));
        c.fillStyle = pat;
        c.fillRect(-200, h.y - 400, W + 400, 1600);
        c.globalAlpha *= 0.3;
        c.fillStyle = aged(U.mix(C.ai, C.gofun, 0.5));
        c.fill(fold);
        c.restore();
      });
      PRINT.with(ctx, 'K', T, (c) => {
        c.fillStyle = U.mix(C.koiai, C.sumi, 0.55); c.fill(cuff);
        c.strokeStyle = U.rgba(C.sumi, 0.85); c.lineWidth = 1.6; c.lineJoin = 'round'; c.stroke(sl);
        // folds down the hanging sleeve
        c.lineWidth = 1.1;
        c.beginPath();
        for (const [a0, a1, b0, b1] of [[G[0] - 30, G[1] + 90, G[0] - 70, G[1] + 470], [A[0] - 80, A[1] + 200, A[0] - 120, A[1] + 520]]) {
          const f1 = L([a0, a1]), f2 = L([b0, b1]);
          c.moveTo(f1[0], f1[1]); c.quadraticCurveTo(f1[0] - side * 14, (f1[1] + f2[1]) / 2, f2[0], f2[1]);
        }
        c.stroke();
      });
    }
  }
  let emptyA = null;
  function emptyAprime(ctx, T) {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    if (emptyA && emptyA.width === cw && emptyA.height === ch) return emptyA;
    const cv = B.canvas(cw, ch), c = cv.getContext('2d'), k = cw / W;
    c.setTransform(k, 0, 0, k, 0, 0);
    c.fillStyle = C.kinari;
    c.fillRect(0, 0, W, H);
    const Tr = 185;
    drawAprime(c, Tr, { age: false });
    shotA().ageFrame(c, Tr, { amount: 1 });
    emptyA = cv;
    return cv;
  }
  function drawFoxWindow(ctx, T) {
    const CAST = TSUKI.CAST;
    const A = shotA();
    // the late night outside the window: A′, empty (these are her own hands) —
    // the print table is still from 160.62, so the aged engawa is printed once
    const bg = emptyAprime(ctx, T);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(bg, 0, 0);
    ctx.restore();
    const h = handsAt(T);
    if (h.y > H + 420) return;
    const hopts = { pose: 'fox-window', age: 1, interlace: 1, t: T, tremble: h.tremble, sleeve: false };
    const win = CAST.foxWindowRect(h.x, h.y, h.s, hopts);
    const tw = h.tremble ? (Math.sin(T * 56.5) * 0.7 + Math.sin(T * 37 + 1) * 0.3) * 2 * h.tremble : 0;
    // inside: the first impression, still playing at T − 150
    const Tp = T - 150;
    ctx.save();
    ctx.beginPath();
    win.path(ctx);
    ctx.clip();
    ctx.fillStyle = C.kinari;
    ctx.fillRect(win.cx - win.w, win.cy - win.h, win.w * 2, win.h * 2);
    A.cropTransform(ctx, { scale: 1.8, about: [1080, 668], to: [win.cx, win.cy] });
    A.drawGarden(ctx, Tp, { camera: false, gazeOut: U.seg(Tp, 36.0, 37.0) });
    ctx.restore();
    // her forearms in the 波兎 sleeves rising from below the frame, and the old
    // hands — carved once at rest, then printed where the arms are (the rise,
    // the tremble: the left hand and the right tremble against each other)
    const R = restSprites(ctx);
    const dy = h.y - FW.y;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const k = ctx.canvas.width / W, mid = Math.round(FW.x * k);
    const put = (cv, x0, x1, oy) => { const w = x1 - x0; if (w > 0) ctx.drawImage(cv, x0, 0, w, cv.height, x0, Math.round((R.y0 + dy + oy) * k), w, cv.height); };
    put(R.sleeves, 0, mid, tw * h.s); put(R.sleeves, mid, R.sleeves.width, -tw * 0.8 * h.s);
    put(R.hands, 0, mid, tw * h.s); put(R.hands, mid, R.hands.width, -tw * 0.8 * h.s);
    ctx.restore();
  }
  // the sleeves and the hands at rest (h.y = FW.y, no tremble), carved at the stage's resolution
  let rest = null;
  function restSprites(ctx) {
    const cw = ctx.canvas.width, ch = ctx.canvas.height;
    if (rest && rest.cw === cw) return rest;
    const k = cw / W, y0 = 180, y1 = H + 20;
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
    rest = {
      cw, y0,
      sleeves: mk((c) => sleeves(c, T, h, 0)),
      // the same authored window as in 三, aged: a near-foreground 墨 silhouette
      // with its knuckles, creases and tendons cut out of the block in pale lines,
      // a 銀鼠 rim where the moon (upper right) catches the edges
      hands: mk((c) => PRINT.with(c, 'K', T, (cc) => {
        CAST.hands(cc, h.x + 1.8, h.y - 1.8, h.s, Object.assign({}, hopts, { silhouette: U.mix(C.ginnezu, C.gofun, 0.25) }));
        CAST.hands(cc, h.x, h.y, h.s, Object.assign({}, hopts, { palette: WIN_PAL, ink: WIN_INK, outline: 1 }));
      })),
    };
    return rest;
  }
  const WIN_INK = U.mix(C.sumi, C.ai, 0.2);
  const WIN_PAL = { skin: WIN_INK, skinOld: WIN_INK, spot: WIN_INK, vein: WIN_INK, nail: U.mix(WIN_INK, C.ginnezu, 0.12), crease: U.mix(C.ginnezu, WIN_INK, 0.2) };

  /* ------------------------------------------------------------------ */
  TSUKI.scene('atozuri', {
    init(S) {
      const k = S.k || 1;
      try {
        const A = shotA();
        if (A.warmLate) A.warmLate(k);
        const cv = B.canvas(Math.round(W * k), Math.round(H * k)), c = cv.getContext('2d');
        c.setTransform(k, 0, 0, k, 0, 0);
        kakeCaches(c);
        emptyAprime(c, 185);
        restSprites(c);
        namiPattern(c);
        spoutAt();
        figSprite(c, 'pour'); figSprite(c, 'seiza');
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
      else if (T < 182) {
        // the margins open onto the engawa (the window about to rise)
        drawFoxWindow(ctx, T);
        const outU = U.seg(T, 181.4, 182.0, E.inOutSine);
        margins(ctx, kakeCaches(ctx), PANEL.x0 * (1 - outU), W - (W - PANEL.x1) * (1 - outU));
      } else drawFoxWindow(ctx, T);
    },
  });
})(window.TSUKI = window.TSUKI || {});
