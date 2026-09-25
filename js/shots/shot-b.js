/* ==========================================================================
   shot-b.js — MASTER SHOT B: the interior shoji wall with the round window.
   The film's theatre (二 影絵・竹取, 五 天の羽衣, 七 有明).

   Two carvings of the same room are registered with TSUKI.PRINT:
     'B'   the grandmother's night (初摺): four moon-white shoji, the round
           window with its reed lattice, the tokonoma with 「掬水月在手」.
     'B7'  sixty years on (後摺, 七): no scroll — only the unfaded rectangle
           where it hung; panel 2 torn, panel 3 slid open onto the pre-dawn
           engawa, the round window pale and flat. worn: true.

   Two print layers (the dark room never overlaps the paper, so the paper's
   inks can be printed first and everything in front of it second):
     base   the paper's own inks: 月白 shoji paper and its lit face (P7), the
            sky in the round window and (B7) through the opened panel (P6),
            tatami (P3)                ← between: the moon & clouds in the window,
                                         the light and every shadow on the paper
     ink    wood & plaster (P1), greys (P4: B7's susuki and hills), the key block
            (K: darkness, lattice, reeds, rims, calligraphy), glints (P8)
                                       ← between: ribbon over the stile, figures in
                                         front, the tokonoma's shade, 七's engawa
   Both are printed through TSUKI.SHOTS.printFlat (flattened while the print
   table is still; live per plate while the plates tremble — six blocks).

   HELPERS on TSUKI.SHOTS.B
     GEOM                         the room's measurements (panels, rungs, window, tear…)
     cell(p, c, r)                paper cell rect [x, y, w, h]: panel p 0–3, column c 0–2, row r 0–5
     glow(T)                      {x, y, r} moon glow behind the paper (MOON.B)
     draw(ctx, T, opts)           print the shot: opts.id 'B'|'B7', opts.between {layer: fn(ctx, st)},
                                  opts.skip [layers]
     light(ctx, T, opts)          live moonlight on the paper (P4 falloff, P7 core, K dim):
                                  opts x, y, r, falloff, core, dim (0..1 cloud), ranges [[x0,x1]…],
                                  eclipse (0..1: the paper around the glow sinks, the ring stays)
     paperClip(ctx, ranges)       clip to the shoji paper (optionally some x-ranges)
     windowClip(ctx)              clip to the round window's opening
     moonInWindow(ctx, T, opts)   MOON.draw clipped to the window (opts x, y, r, halo, alpha)
     moonFringes(ctx, x, y, r, T) the tears' blue & gold crescents on a moon (see note)
     tokonomaShade(ctx, T, a)     darken the alcove: 0 spill-lit … 1 lost in shadow (1.087 = solid)
     sharpFill(ctx, T, paths, o)  puppets held against the paper: fill Path2D(s) straight onto
                                  the print, 藍鼠 multiply through P4 (paths: Path2D | [[path, rule]…];
                                  o: alpha, color, plate, ranges, clip)
     softLayer(ctx, name, region, res)  a small low-res layer over [x0,y0,x1,y1] for shadows far
                                  from the paper: paint 藍鼠 coverage in stage coords; the upscale
                                  is the penumbra (res 0.3 ≈ 3 px)
     softPrint(ctx, T, name, o)   print that layer (multiply via P4; o: alpha, mode, plate, ranges)
     sharpLayer(ctx, name, region)  the same at full resolution (compose, then softPrint)
     tearPath()                   the ragged hole in panel 2 (七)
     INK                          { SUSUDAKE, WOOD, AINEZU, PLASTER, TATAMI }
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const U = TSUKI.U, B = TSUKI.B, C = TSUKI.C, PRINT = TSUKI.PRINT, MOON = TSUKI.MOON;
  const W = 1920, H = 1080;
  TSUKI.SHOTS = TSUKI.SHOTS || {};
  const SB = (TSUKI.SHOTS.B = TSUKI.SHOTS.B || {});

  // wake the brush font early so the scroll can be carved with it during loading
  try { if (document.fonts && document.fonts.load) document.fonts.load('56px "Yuji Syuku"', '掬水月在手'); } catch (e) { /* ignore */ }

  /* ------------------------------------------------------------------ */
  /* inks                                                                */
  /* ------------------------------------------------------------------ */
  const SUSUDAKE = U.mix(C.odo, C.sumi, 0.55);          // 煤竹
  const WOOD = U.mix(SUSUDAKE, C.sumi, 0.45);           // wood seen against the light
  const AINEZU = U.mix(C.ai, C.nezumi, 0.5);            // 藍鼠: every shadow on the shoji
  const PLASTER = C.odo;                                // 聚楽
  const TATAMI = U.mix(C.susuki, C.nezumi, 0.45);       // 尾花×鼠
  SB.INK = { SUSUDAKE, WOOD, AINEZU, PLASTER, TATAMI };

  /* ------------------------------------------------------------------ */
  /* geometry                                                            */
  /* ------------------------------------------------------------------ */
  const G = (SB.GEOM = {
    panels: [[300, 630], [630, 960], [960, 1290], [1290, 1620]],
    top: 270, bottom: 960, frame: 10,
    rungs: [385, 500, 615, 730, 845],             // horizontal kumiko (the climb)
    stile: 960,
    window: { x: 960, y: 150, r: 110, rim: 8 },
    wall: { x0: 280, x1: 1640, y0: 40, y1: 258 }, // 小壁
    lintel: [256, 272],
    sill: [958, 974],
    floorY: 974,
    vanish: [960, 540],
    tokonoma: { x0: 40, x1: 252, y0: 236, floor: 912 },
    post: [252, 294],                              // 床柱
    rpost: [1620, 1646],
    scroll: { x0: 110, x1: 180, y0: 300, y1: 820 },
    unfaded: { x0: 95, x1: 195, y0: 300, y1: 820 },
    rightWall: { x0: 1646, x1: 1920 },
    tear: { x0: 760, x1: 820, y0: 560, y1: 640 },  // 七: the torn hole in panel 2
    opening: { x0: 960, x1: 1290 },                // 七: panel 3 slid open
  });
  G.kumikoX = G.panels.map(([x0]) => [x0 + 110, x0 + 220]);

  SB.cell = (p, c, r) => {
    const [x0, x1] = G.panels[p];
    const xa = c === 0 ? x0 + G.frame : x0 + 110 * c + 2;
    const xb = c === 2 ? x1 - G.frame : x0 + 110 * (c + 1) - 2;
    const ya = r === 0 ? G.top + G.frame : G.top + 115 * r + 2;
    const yb = r === 5 ? G.bottom - G.frame - 4 : G.top + 115 * (r + 1) - 2;
    return [xa, ya, xb - xa, yb - ya];
  };

  SB.glow = (T) => { const m = MOON.B(T); return { x: m.glowX, y: m.glowY, r: m.glowR }; };

  /* ------------------------------------------------------------------ */
  /* carving helpers                                                     */
  /* ------------------------------------------------------------------ */
  /** a plank / post: body in P1, 墨 edges and a little grain in K. */
  function plank(P1, K, x, y, w, h, opts = {}) {
    const r = U.rng(opts.seed || 1);
    P1.fillStyle = opts.color || WOOD;
    P1.fillRect(x, y, w, h);
    if (opts.shade) {
      const vert = h > w;
      const g = vert ? P1.createLinearGradient(x, 0, x + w, 0) : P1.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, U.rgba(C.sumi, opts.shade[0]));
      g.addColorStop(1, U.rgba(C.sumi, opts.shade[1]));
      P1.fillStyle = g;
      P1.fillRect(x, y, w, h);
    }
    K.strokeStyle = U.rgba(C.sumi, opts.edge == null ? 0.9 : opts.edge);
    K.lineWidth = opts.lw || 1.6;
    K.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const n = opts.grain == null ? Math.round((h > w ? w : h) / 5) : opts.grain;
    K.lineWidth = 0.8;
    for (let i = 0; i < n; i++) {
      K.strokeStyle = U.rgba(C.sumi, U.lerp(0.14, 0.34, r()));
      K.beginPath();
      if (h > w) {
        let gx = x + w * U.lerp(0.12, 0.88, r());
        K.moveTo(gx, y + 2);
        for (let yy = y + 2; yy < y + h - 2; yy += 14) { gx += U.lerp(-0.6, 0.6, r()); K.lineTo(U.clamp(gx, x + 1.5, x + w - 1.5), yy); }
      } else {
        let gy = y + h * U.lerp(0.12, 0.88, r());
        K.moveTo(x + 2, gy);
        for (let xx = x + 2; xx < x + w - 2; xx += 14) { gy += U.lerp(-0.6, 0.6, r()); K.lineTo(xx, U.clamp(gy, y + 1.5, y + h - 1.5)); }
      }
      K.stroke();
    }
  }

  /** 聚楽 plaster: 黄土 at `a` (P1), grit and straw fibres (K, faint). */
  function plaster(P1, K, x, y, w, h, a, seed, clip) {
    P1.save(); K.save();
    if (clip) { clip(P1); P1.clip(); clip(K); K.clip(); }
    P1.fillStyle = U.rgba(PLASTER, a);
    P1.fillRect(x, y, w, h);
    const r = U.rng(seed);
    for (let i = 0; i < Math.round((w * h) / 9000); i++) {
      const px = x + r() * w, py = y + r() * h, rr = U.lerp(20, 70, r());
      const g = P1.createRadialGradient(px, py, 0, px, py, rr);
      g.addColorStop(0, U.rgba(PLASTER, a * 0.25));
      g.addColorStop(1, U.rgba(PLASTER, 0));
      P1.fillStyle = g;
      P1.fillRect(px - rr, py - rr, rr * 2, rr * 2);
    }
    const n = Math.round((w * h) / 80);
    for (let i = 0; i < n; i++) {
      K.fillStyle = U.rgba(C.sumi, U.lerp(0.08, 0.3, r()));
      const s = U.lerp(0.6, 1.7, r());
      K.fillRect(x + r() * w, y + r() * h, s, s);
    }
    K.lineCap = 'round';
    for (let i = 0; i < Math.round((w * h) / 1300); i++) {
      const px = x + r() * w, py = y + r() * h, an = r() * Math.PI, L = U.lerp(4, 12, r());
      K.strokeStyle = U.rgba(C.sumi, U.lerp(0.12, 0.28, r()));
      K.lineWidth = U.lerp(0.6, 1.1, r());
      K.beginPath();
      K.moveTo(px, py);
      K.quadraticCurveTo(px + Math.cos(an) * L * 0.5 + U.lerp(-2, 2, r()), py + Math.sin(an) * L * 0.5, px + Math.cos(an) * L, py + Math.sin(an) * L);
      K.stroke();
    }
    P1.restore(); K.restore();
  }

  /* ------------------------------------------------------------------ */
  /* the carving                                                         */
  /* ------------------------------------------------------------------ */
  function carve(P0, v) {
    const late = v === 'B7';
    // two print layers: 'base' = the paper's own inks (P3 tatami, P6 sky, P7 lit paper);
    // 'ink' = everything in front (P1 wood & plaster, P4 greys, K key block, P8 glints).
    // The dark room never overlaps the paper, so this keeps the stacking and halves the blocks.
    const BASE = { P3: 1, P6: 1, P7: 1 };
    const P = (layer, plate) => P0(BASE[plate.split('~')[0]] ? 'base' : 'ink', plate);
    const wl = G.wall, win = G.window, tk = G.tokonoma;
    /* ================= room ================= */
    {
      const P1 = P('room', 'P1'), P3 = P('room', 'P3'), P6 = P('room', 'P6'), P7 = P('room', 'P7'), K = P('room', 'K');
      // the whole room's wood tone under everything (the 煤竹 block) — but never under the
      // paper of the shoji, the window's sky or (sixty years on) the faded alcove wall
      P1.save();
      P1.beginPath();
      P1.rect(0, 0, W, H);
      P1.rect(G.panels[0][0], G.top, G.panels[3][1] - G.panels[0][0], G.bottom - G.top);
      P1.moveTo(win.x + win.r + 2, win.y); P1.arc(win.x, win.y, win.r + 2, 0, U.TAU, true);
      if (late) P1.rect(tk.x0, tk.y0, tk.x1 - tk.x0, tk.floor - tk.y0);
      P1.rect(0, G.floorY, W, H - G.floorY);                       // the tatami is its own block
      P1.clip('evenodd');
      P1.fillStyle = SUSUDAKE;
      P1.fillRect(0, 0, W, H);
      P1.restore();
      // --- darkness (墨), clear of the lit and plastered surfaces ---
      K.save();
      K.beginPath();
      K.rect(0, 0, W, H);
      K.rect(wl.x0, wl.y0, wl.x1 - wl.x0, wl.y1 - wl.y0);
      K.rect(G.post[1], G.lintel[0], G.rpost[0] - G.post[1], G.floorY - G.lintel[0]);
      K.rect(tk.x0, tk.y0, tk.x1 - tk.x0, tk.floor - tk.y0);
      K.rect(0, G.floorY, W, H - G.floorY);
      K.clip('evenodd');
      const g = K.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, U.rgba(C.sumi, 0.97));
      g.addColorStop(0.7, U.rgba(C.sumi, 0.93));
      g.addColorStop(1, U.rgba(C.sumi, 0.8));
      K.fillStyle = g;
      K.fillRect(0, 0, W, H);
      // 木目: the grain of the block shows in the solid black (lighter streaks)
      {
        const r = U.rng(909);
        K.globalCompositeOperation = 'destination-out';
        K.lineCap = 'round';
        for (let i = 0; i < 260; i++) {
          let gy = r() * H;
          const gx0 = r() * W - 200, L = U.lerp(180, 900, r());
          K.strokeStyle = `rgba(0,0,0,${U.lerp(0.025, 0.07, r())})`;
          K.lineWidth = U.lerp(0.8, 3.2, r());
          K.beginPath();
          K.moveTo(gx0, gy);
          for (let xx = gx0; xx < gx0 + L; xx += 30) { gy += U.wobble(xx * 0.004 + i, 21) * 1.6; K.lineTo(xx, gy); }
          K.stroke();
        }
        K.globalCompositeOperation = 'source-over';
      }
      K.restore();
      // --- the right wall: plaster barely there in the dark (the text pocket) ---
      plaster(P1, K, G.rightWall.x0, 24, G.rightWall.x1 - G.rightWall.x0, G.floorY - 24, 0.05, 35);
      // --- ceiling moulding and beam ---
      plank(P1, K, 0, 0, W, 24, { seed: 5, shade: [0.5, 0.3], grain: 3 });
      plank(P1, K, wl.x0 - 20, 24, wl.x1 - wl.x0 + 40, 16, { seed: 6, shade: [0.3, 0.55], grain: 2 });
      // --- 小壁 plaster (with the window cut out) ---
      const holeClip = (c) => {
        c.beginPath();
        c.rect(wl.x0, wl.y0, wl.x1 - wl.x0, wl.y1 - wl.y0);
        c.moveTo(win.x + win.r, win.y);
        c.arc(win.x, win.y, win.r, 0, U.TAU, true);
      };
      plaster(P1, K, wl.x0, wl.y0, wl.x1 - wl.x0, wl.y1 - wl.y0, late ? 0.3 : 0.36, late ? 33 : 31, holeClip);
      K.save(); holeClip(K); K.clip('evenodd');
      {
        const gv = K.createLinearGradient(0, wl.y0, 0, wl.y1);
        gv.addColorStop(0, U.rgba(C.sumi, 0.72));
        gv.addColorStop(0.55, U.rgba(C.sumi, 0.42));
        gv.addColorStop(1, U.rgba(C.sumi, 0.5));
        K.fillStyle = gv;
        K.fillRect(wl.x0, wl.y0, wl.x1 - wl.x0, wl.y1 - wl.y0);
        for (const [ex, dir] of [[wl.x0, 1], [wl.x1, -1]]) {
          const gh = K.createLinearGradient(ex, 0, ex + dir * 380, 0);
          gh.addColorStop(0, U.rgba(C.sumi, 0.6));
          gh.addColorStop(1, U.rgba(C.sumi, 0));
          K.fillStyle = gh;
          K.fillRect(dir > 0 ? ex : ex - 380, wl.y0, 380, wl.y1 - wl.y0);
        }
      }
      K.restore();
      // --- 七: what the torn cell of panel 2 lets you see: the dark pre-dawn garden ---
      if (late) carveTear(P0);
      // --- the sky seen through the round window ---
      P6.save();
      P6.beginPath(); P6.arc(win.x, win.y, win.r + 2, 0, U.TAU); P6.clip();
      {
        const gs = P6.createLinearGradient(0, win.y - win.r, 0, win.y + win.r);
        gs.addColorStop(0, U.mix(C.kon, C.sumi, 0.4));
        gs.addColorStop(0.5, C.kon);
        gs.addColorStop(1, U.mix(C.kon, C.bero, 0.3));
        P6.fillStyle = gs;
        P6.fillRect(win.x - win.r - 4, win.y - win.r - 4, 2 * win.r + 8, 2 * win.r + 8);
      }
      P6.restore();
      if (late) {
        // 後摺: the window's sky printed flat and pale — the moon has left it
        const Pw = P('room', 'P6~worn');
        Pw.save();
        Pw.beginPath(); Pw.arc(win.x, win.y, win.r + 2, 0, U.TAU); Pw.clip();
        // (printed at the late P6 alpha 0.55: this is a pale, still-cool 藍 after the yellowing)
        Pw.fillStyle = U.mix(C.ai, C.bero, 0.45);
        Pw.fillRect(win.x - win.r - 4, win.y - win.r - 4, 2 * win.r + 8, 2 * win.r + 8);
        Pw.restore();
      }
      // --- the rim: a 煤竹 ring between two 墨 key lines ---
      P1.save();
      P1.lineWidth = win.rim + 6;
      P1.strokeStyle = WOOD;
      P1.beginPath(); P1.arc(win.x, win.y, win.r + win.rim / 2 + 1, 0, U.TAU); P1.stroke();
      P1.restore();
      K.strokeStyle = U.rgba(C.sumi, 0.95);
      K.lineWidth = 2.4;
      K.beginPath(); K.arc(win.x, win.y, win.r + 0.5, 0, U.TAU); K.stroke();
      K.lineWidth = 1.6;
      K.beginPath(); K.arc(win.x, win.y, win.r + win.rim + 4, 0, U.TAU); K.stroke();
      K.strokeStyle = U.rgba(C.sumi, 0.5);
      K.lineWidth = win.rim - 2;
      K.beginPath(); K.arc(win.x, win.y, win.r + win.rim * 0.6, Math.PI * 1.1, Math.PI * 1.9); K.stroke();
      const P8 = P('room', 'P8');
      P8.strokeStyle = U.rgba(C.geppaku, late ? 0.12 : 0.18);
      P8.lineWidth = 1.4;
      P8.beginPath(); P8.arc(win.x, win.y, win.r + win.rim + 1.5, Math.PI * 0.15, Math.PI * 0.85); P8.stroke();

      // --- tokonoma ---
      plaster(P1, K, tk.x0, tk.y0, tk.x1 - tk.x0, tk.floor - tk.y0, late ? 0.35 : 0.4, late ? 37 : 36);
      if (late) {
        // the unfaded rectangle: where the scroll hung for decades the plaster kept its 黄土
        const u = G.unfaded;
        P1.fillStyle = U.rgba(U.mix(PLASTER, C.sumi, 0.12), 0.72);
        P1.fillRect(u.x0, u.y0, u.x1 - u.x0, u.y1 - u.y0);
        const cx = (u.x0 + u.x1) / 2;
        K.fillStyle = U.rgba(C.sumi, 0.85);
        K.fillRect(cx - 1.5, u.y0 - 28, 3, 6);             // the nail
        K.strokeStyle = U.rgba(C.sumi, 0.25);
        K.lineWidth = 1;
        K.strokeRect(u.x0 + 0.5, u.y0 + 0.5, u.x1 - u.x0 - 1, u.y1 - u.y0 - 1);
      }
      {
        const k0 = late ? 0.5 : 1;
        const gt = K.createLinearGradient(0, tk.y0, 0, tk.y0 + 200);
        gt.addColorStop(0, U.rgba(C.sumi, 0.75 * k0));
        gt.addColorStop(1, U.rgba(C.sumi, 0.1 * k0));
        K.fillStyle = gt;
        K.fillRect(tk.x0, tk.y0, tk.x1 - tk.x0, 200);
        K.fillStyle = U.rgba(C.sumi, 0.1 * k0);
        K.fillRect(tk.x0, tk.y0 + 200, tk.x1 - tk.x0, tk.floor - tk.y0 - 200);
        const g2 = K.createLinearGradient(tk.x0, 0, tk.x0 + 90, 0);
        g2.addColorStop(0, U.rgba(C.sumi, 0.65 * k0));
        g2.addColorStop(1, U.rgba(C.sumi, 0));
        K.fillStyle = g2;
        K.fillRect(tk.x0, tk.y0, 90, tk.floor - tk.y0);
      }
      plank(P1, K, tk.x0 - 10, tk.y0 - 22, tk.x1 - tk.x0 + 20, 22, { seed: 41, shade: [0.3, 0.6], grain: 2 });   // 落掛
      plank(P1, K, tk.x0 - 10, tk.floor, tk.x1 - tk.x0 + 20, 16, { seed: 42, shade: [0.2, 0.55], grain: 2 });   // 床框
      if (!late) carveScroll(P1, P3, K, P7);
      // --- the 床柱: a natural polished log, slightly waisted, with knots ---
      {
        const [px0, px1] = G.post;
        const r = U.rng(47);
        const L = [], R = [];
        for (let yy = 0; yy <= G.floorY; yy += 20) {
          const w = U.wobble(yy * 0.004, 3) * 3;
          L.push([px0 + 2 + w + Math.sin(yy * 0.003) * 2, yy]);
          R.push([px1 - 2 + w * 0.6 + Math.sin(yy * 0.003 + 1) * 2, yy]);
        }
        const outline = (c) => {
          c.beginPath();
          L.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])));
          for (let i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
          c.closePath();
        };
        outline(P1);
        const gp = P1.createLinearGradient(px0, 0, px1, 0);
        gp.addColorStop(0, U.mix(WOOD, C.sumi, 0.4));
        gp.addColorStop(0.55, WOOD);
        gp.addColorStop(1, U.mix(SUSUDAKE, C.odo, 0.15));
        P1.fillStyle = gp;
        P1.fill();
        outline(K);
        K.strokeStyle = U.rgba(C.sumi, 0.92);
        K.lineWidth = 1.8;
        K.stroke();
        K.save(); outline(K); K.clip();
        for (let i = 0; i < 9; i++) {
          K.strokeStyle = U.rgba(C.sumi, U.lerp(0.18, 0.34, r()));
          K.lineWidth = 0.9;
          const gx = U.lerp(px0 + 6, px1 - 6, r());
          K.beginPath(); K.moveTo(gx, 0);
          for (let yy = 0; yy < G.floorY; yy += 30) K.lineTo(gx + U.wobble(yy * 0.01 + i, 5) * 3, yy);
          K.stroke();
        }
        for (let i = 0; i < 4; i++) {
          const kx = U.lerp(px0 + 12, px1 - 12, r()), ky = U.lerp(320, 880, r());
          K.strokeStyle = U.rgba(C.sumi, 0.5);
          K.lineWidth = 1;
          K.beginPath(); K.ellipse(kx, ky, 4, 7, 0, 0, U.TAU); K.stroke();
          K.beginPath(); K.ellipse(kx, ky, 1.6, 3, 0, 0, U.TAU); K.stroke();
        }
        K.fillStyle = U.rgba(C.sumi, 0.55);
        K.fillRect(px0 - 4, 0, px1 - px0 + 8, G.lintel[0]);    // its top vanishes in the dark
        K.restore();
        // the paper's light catching the post's right edge — only where it faces the paper
        // (below the lintel: its top vanishes in the dark)
        const P8 = P('room', 'P8');
        P8.strokeStyle = U.rgba(C.geppaku, 0.2);
        P8.lineWidth = 1.4;
        P8.beginPath();
        let started = false;
        for (const q of R) {
          if (q[1] < G.lintel[1] + 6) continue;
          if (!started) { P8.moveTo(q[0] - 1.5, q[1]); started = true; } else P8.lineTo(q[0] - 1.5, q[1]);
        }
        P8.stroke();
      }
      // --- the right post, lit on its left edge by the paper ---
      plank(P1, K, G.rpost[0], 0, G.rpost[1] - G.rpost[0], G.floorY, { seed: 13, shade: [0.1, 0.55], grain: 4 });
      K.fillStyle = U.rgba(C.sumi, 0.55);
      K.fillRect(G.rpost[0], 0, G.rpost[1] - G.rpost[0], G.lintel[0]);
      P('room', 'P8').fillStyle = U.rgba(C.geppaku, 0.18);
      P('room', 'P8').fillRect(G.rpost[0] + 1, G.top, 1.4, G.bottom - G.top);
    }
    if (late) carveOutside(P);

    /* ================= reeds ================= */
    {
      const K = P('reeds', 'K');
      K.save();
      K.beginPath(); K.arc(win.x, win.y, win.r, 0, U.TAU); K.clip();
      const rr = U.rng(late ? 44 : 43);
      for (let rx = win.x - win.r + 4; rx <= win.x + win.r; rx += 9) {
        const w0 = U.lerp(1.0, 1.5, rr());
        K.strokeStyle = U.rgba(C.sumi, U.lerp(0.82, 0.95, rr()));
        K.lineWidth = w0;
        const wob = U.lerp(-0.6, 0.6, rr());
        K.beginPath();
        K.moveTo(rx, win.y - win.r - 2);
        K.quadraticCurveTo(rx + wob, win.y, rx - wob * 0.3, win.y + win.r + 2);
        K.stroke();
        for (let ny = win.y - win.r + U.lerp(10, 50, rr()); ny < win.y + win.r; ny += U.lerp(48, 80, rr())) {
          K.fillStyle = U.rgba(C.sumi, 0.9);
          K.fillRect(rx - w0 * 0.9, ny, w0 * 1.8, 1.3);
        }
      }
      for (const by of [win.y - 38, win.y + 42]) {
        K.fillStyle = U.rgba(C.sumi, 0.92);
        K.fillRect(win.x - win.r, by - 2.5, 2 * win.r, 5);
        K.fillStyle = U.rgba(C.sumi, 0.35);
        K.fillRect(win.x - win.r, by + 2.5, 2 * win.r, 2);
      }
      if (late) {
        // sixty years: two reeds broken, hanging askew
        K.globalCompositeOperation = 'destination-out';
        K.fillRect(win.x + 26, win.y + 4, 16, 38);
        K.globalCompositeOperation = 'source-over';
        K.strokeStyle = U.rgba(C.sumi, 0.9);
        K.lineWidth = 1.3;
        K.beginPath(); K.moveTo(win.x + 30, win.y - 36); K.lineTo(win.x + 36, win.y + 12); K.moveTo(win.x + 39, win.y - 36); K.lineTo(win.x + 33, win.y + 6); K.stroke();
      }
      K.restore();
    }

    /* ================= paper ================= */
    {
      const P7 = P('paper', 'P7');
      for (let p = 0; p < 4; p++) {
        if (late && p === 2) continue;                   // panel 3 slid open
        const [x0, x1] = G.panels[p];
        P7.fillStyle = C.geppaku;
        P7.fillRect(x0 + 4, G.top + 4, x1 - x0 - 8, G.bottom - G.top - 8);
        const r = U.rng(80 + p);
        for (let i = 0; i < 6; i++) {
          // the pasted strips overlap just under each rung: a faint seam
          if (i < 5) {
            P7.fillStyle = U.rgba(AINEZU, late ? 0.1 : 0.06);
            P7.fillRect(x0 + 10, G.top + 115 * (i + 1) + 2, x1 - x0 - 20, 5);
          }
          for (let f = 0; f < 22; f++) {
            const fx = x0 + 12 + r() * (x1 - x0 - 24), fy = G.top + 115 * i + 8 + r() * 100;
            const an = U.lerp(-0.6, 0.6, r()), L = U.lerp(8, 26, r());
            P7.strokeStyle = U.rgba(AINEZU, U.lerp(0.05, 0.12, r()));
            P7.lineWidth = 0.7;
            P7.beginPath();
            P7.moveTo(fx, fy);
            P7.quadraticCurveTo(fx + L * 0.5, fy + U.lerp(-3, 3, r()), fx + Math.cos(an) * L, fy + Math.sin(an) * L);
            P7.stroke();
          }
        }
        if (late) {
          // patched cells (fresher paper, slightly off square) and old water stains
          const pr = U.rng(300 + p);
          for (let k = 0; k < 3; k++) {
            const cx = Math.floor(pr() * 3), cy = Math.floor(pr() * 6);
            if (p === 1 && cy >= 2 && cy <= 3) continue;
            const [cxp, cyp, cw, ch] = SB.cell(p, cx, cy);
            P7.fillStyle = U.rgba(C.gofun, 0.7);
            P7.fillRect(cxp + 1, cyp + 1, cw - 2, ch - 2);
            P7.strokeStyle = U.rgba(AINEZU, 0.22);
            P7.lineWidth = 1;
            P7.strokeRect(cxp + 2.5, cyp + 2.5, cw - 5, ch - 5);
          }
          for (let k = 0; k < 2; k++) {
            const sx = x0 + 40 + pr() * (x1 - x0 - 80), sy = G.top + 60 + pr() * 560, sr = U.lerp(14, 34, pr());
            const g = P7.createRadialGradient(sx, sy, sr * 0.55, sx, sy, sr);
            g.addColorStop(0, U.rgba(C.odo, 0.03));
            g.addColorStop(0.85, U.rgba(C.odo, 0.16));
            g.addColorStop(1, U.rgba(C.odo, 0));
            P7.fillStyle = g;
            P7.beginPath(); P7.ellipse(sx, sy, sr, sr * 0.8, 0, 0, U.TAU); P7.fill();
          }
        }
      }
      if (late) {
        // panel 2's torn hole: the paper cut away (its lip and flaps are carved in carveTear)
        const pts = tearPath();
        P7.save();
        P7.globalCompositeOperation = 'destination-out';
        P7.beginPath(); pts.forEach((q, i) => (i ? P7.lineTo(q[0], q[1]) : P7.moveTo(q[0], q[1]))); P7.closePath();
        P7.fill();
        P7.restore();
      }
    }

    /* ================= lattice ================= */
    {
      const P1 = P('lattice', 'P1'), K = P('lattice', 'K'), P7 = P('lattice', 'P7');
      plank(P1, K, wl.x0 - 20, G.lintel[0], wl.x1 - wl.x0 + 40, G.lintel[1] - G.lintel[0], { seed: 11, shade: [0.35, 0.55], grain: 3 });
      for (let p = 0; p < 4; p++) {
        if (late && p === 2) continue;
        const [x0, x1] = G.panels[p];
        const f = G.frame;
        K.fillStyle = U.rgba(C.sumi, 0.9);
        for (const kx of G.kumikoX[p]) K.fillRect(kx - 1.75, G.top + f, 3.5, G.bottom - G.top - 2 * f);
        for (const ky of G.rungs) K.fillRect(x0 + f, ky - 1.75, x1 - x0 - 2 * f, 3.5);
        plank(P1, K, x0, G.top, f, G.bottom - G.top, { seed: 20 + p * 4, grain: 1, lw: 1.2 });
        plank(P1, K, x1 - f, G.top, f, G.bottom - G.top, { seed: 21 + p * 4, grain: 1, lw: 1.2 });
        plank(P1, K, x0, G.top, x1 - x0, f, { seed: 22 + p * 4, grain: 1, lw: 1.2 });
        plank(P1, K, x0, G.bottom - f - 4, x1 - x0, f + 4, { seed: 23 + p * 4, grain: 1, lw: 1.2 });
        // the recessed pull (引手) on each panel's meeting stile
        //   (one per panel, on the stile away from the centre, so no two ever pair up)
        const hx = p < 2 ? x0 + f + 15 : x1 - f - 15;
        K.fillStyle = U.rgba(C.sumi, 0.4);
        K.beginPath(); K.ellipse(hx, 640, 3.2, 10, 0, 0, U.TAU); K.fill();
        K.strokeStyle = U.rgba(C.sumi, 0.28); K.lineWidth = 0.8;
        K.beginPath(); K.ellipse(hx, 640, 4.6, 11.6, 0, 0, U.TAU); K.stroke();
        P7.fillStyle = U.rgba(C.geppaku, 0.14);
        P7.fillRect(x0 + f, G.top + f, 1.2, G.bottom - G.top - 2 * f - 4);
      }
      if (!late) {
        // the central stile where panels 2 and 3 meet: one strong vertical — the ladder's rail
        K.fillStyle = U.rgba(C.sumi, 0.95);
        K.fillRect(G.stile - 2, G.top, 4, G.bottom - G.top);
      } else {
        // 七: panel 3 is tucked behind panel 4; the opening is framed by two stiles
        plank(P1, K, G.opening.x1 - 16, G.top, 16, G.bottom - G.top, { seed: 91, grain: 1, lw: 1.2, shade: [0.5, 0.15] });
        plank(P1, K, G.opening.x0, G.top, 10, G.bottom - G.top, { seed: 92, grain: 1, lw: 1.2 });
      }
      // sill (敷居) with its two grooves
      plank(P1, K, 0, G.sill[0], W, G.sill[1] - G.sill[0], { seed: 61, shade: [0.1, 0.5], grain: 2 });
      K.strokeStyle = U.rgba(C.sumi, 0.75);
      K.lineWidth = 1.2;
      for (const gy of [G.sill[0] + 5, G.sill[0] + 10]) { K.beginPath(); K.moveTo(G.panels[0][0], gy); K.lineTo(G.panels[3][1], gy); K.stroke(); }
      P('lattice', 'P8').fillStyle = U.rgba(C.geppaku, 0.16);
      P('lattice', 'P8').fillRect(G.panels[0][0], G.sill[0] + 1, G.panels[3][1] - G.panels[0][0], 1.3);
    }

    /* ================= floor ================= */
    {
      const P3 = P('floor', 'P3'), P7 = P('floor', 'P7'), K = P('floor', 'K');
      const y0 = G.floorY;
      const [vx, vy] = G.vanish;
      const X = (xs, y) => vx + (xs - vx) * (y - vy) / (y0 - vy);
      P3.fillStyle = late ? U.mix(TATAMI, C.nezumi, 0.3) : TATAMI;
      P3.fillRect(0, y0, W, H - y0);
      // the weave (目): dense lines receding to the vanishing point
      P3.strokeStyle = U.rgba(U.mix(C.nezumi, C.sumi, 0.3), 0.22);
      P3.lineWidth = 0.8;
      P3.beginPath();
      for (let xs = -900; xs < W + 900; xs += 5.5) { P3.moveTo(X(xs, y0), y0); P3.lineTo(X(xs, H), H); }
      P3.stroke();
      // 畳縁: cloth borders converging on (960,540) — the uki-e floor
      for (const xs of [300, 960, 1620]) {
        K.fillStyle = U.rgba(U.mix(C.sumi, C.kon, 0.3), 0.92);
        const w0 = 9;
        K.beginPath();
        K.moveTo(X(xs - w0 / 2, y0), y0); K.lineTo(X(xs + w0 / 2, y0), y0);
        K.lineTo(X(xs + w0 / 2, H), H); K.lineTo(X(xs - w0 / 2, H), H);
        K.closePath(); K.fill();
      }
      const g = P7.createLinearGradient(0, y0, 0, H);
      g.addColorStop(0, U.rgba(C.geppaku, late ? 0.16 : 0.24));
      g.addColorStop(0.55, U.rgba(C.geppaku, 0.04));
      g.addColorStop(1, U.rgba(C.geppaku, 0));
      P7.fillStyle = g;
      P7.fillRect(G.panels[0][0], y0, G.panels[3][1] - G.panels[0][0], H - y0);
      const gk = K.createLinearGradient(0, y0, 0, H);
      gk.addColorStop(0, U.rgba(C.sumi, 0.25));
      gk.addColorStop(1, U.rgba(C.sumi, 0.72));
      K.fillStyle = gk;
      K.fillRect(0, y0, W, H - y0);
      for (const [a, b, dir] of [[0, G.panels[0][0] + 60, 1], [G.panels[3][1] - 60, W, -1]]) {
        const gg = K.createLinearGradient(dir > 0 ? b : a, 0, dir > 0 ? a : b, 0);
        gg.addColorStop(0, U.rgba(C.sumi, 0));
        gg.addColorStop(1, U.rgba(C.sumi, 0.7));
        K.fillStyle = gg;
        K.fillRect(a, y0, b - a, H - y0);
      }
    }
  }

  /** 「掬水月在手」 on a 生成 mount with 黄土 borders (visual only). */
  function carveScroll(P1, P3, K, P7) {
    const s = G.scroll;
    const w = s.x1 - s.x0, h = s.y1 - s.y0;
    const cx = (s.x0 + s.x1) / 2;
    K.strokeStyle = U.rgba(C.sumi, 0.8);
    K.lineWidth = 1.2;
    K.beginPath(); K.moveTo(cx, s.y0 - 26); K.lineTo(s.x0 + 14, s.y0); K.moveTo(cx, s.y0 - 26); K.lineTo(s.x1 - 14, s.y0); K.stroke();
    K.fillStyle = U.rgba(C.sumi, 0.85);
    K.fillRect(cx - 1.5, s.y0 - 30, 3, 6);
    const honshi = [s.x0 + 14, s.y0 + 106, w - 28, h - 106 - 80];  // 本紙: bare 生成 paper
    P1.save();
    P1.beginPath(); P1.rect(s.x0, s.y0, w, h); P1.rect(...honshi); P1.clip('evenodd');
    P1.fillStyle = U.mix(C.odo, C.kuchiba, 0.4);                  // 天・地
    P1.fillRect(s.x0, s.y0, w, h);
    P1.fillStyle = U.mix(C.odo, C.sumi, 0.25);                    // 中廻し
    P1.fillRect(s.x0 + 8, s.y0 + 96, w - 16, h - 96 - 70);
    P1.restore();
    P1.fillStyle = U.mix(C.odo, C.matsuba, 0.35);                 // 一文字
    P1.fillRect(s.x0 + 8, s.y0 + 96, w - 16, 10);
    P1.fillRect(s.x0 + 8, s.y1 - 80, w - 16, 10);
    P7.fillStyle = U.rgba(C.gofun, 0.35);                         // 本紙 (a little whiter than the wall)
    P7.fillRect(...honshi);
    P1.fillStyle = U.mix(C.odo, C.sumi, 0.4);                     // 風帯
    P1.fillRect(s.x0 + 16, s.y0, 7, 92);
    P1.fillRect(s.x1 - 23, s.y0, 7, 92);
    K.fillStyle = U.rgba(C.sumi, 0.9);
    K.fillRect(s.x0 - 2, s.y0 - 3, w + 4, 6);                     // 八双
    K.fillRect(s.x0 - 1, s.y1 - 4, w + 2, 9);                     // 軸
    K.beginPath(); K.ellipse(s.x0 - 6, s.y1 + 0.5, 6, 5.5, 0, 0, U.TAU); K.ellipse(s.x1 + 6, s.y1 + 0.5, 6, 5.5, 0, 0, U.TAU); K.fill();
    K.strokeStyle = U.rgba(C.sumi, 0.8);
    K.lineWidth = 1;
    K.strokeRect(s.x0 + 0.5, s.y0 + 0.5, w - 1, h - 1);
    K.strokeRect(s.x0 + 14.5, s.y0 + 106.5, w - 29, h - 106 - 81);
    // one column, brushed: 掬水月在手 (于良史「春山夜月」) — visual only
    const txt = '掬水月在手';
    const top = s.y0 + 126, bot = s.y1 - 104;
    const fs = Math.min(46, ((bot - top) / txt.length) * 0.96);
    K.save();
    K.fillStyle = U.rgba(C.sumi, 0.9);
    K.textAlign = 'center';
    K.textBaseline = 'middle';
    K.font = `${fs}px "Yuji Syuku", "Shippori Mincho B1", serif`;
    [...txt].forEach((ch, i) => {
      const yy = top + (i + 0.5) * ((bot - top) / txt.length);
      K.save();
      K.translate(cx + (i % 2 ? 1.5 : -1), yy);
      K.rotate((i % 2 ? 1 : -1) * 0.03);
      K.scale(1, 1.06);
      K.fillText(ch, 0, 0);
      K.restore();
    });
    K.restore();
    K.fillStyle = U.rgba(C.sumi, 0.6);
    K.fillRect(cx + 12, bot + 8, 2, 20);
    B.seal(P7, cx + 8, bot + 34, 11, '月', U.mix(C.shu, C.sumi, 0.2), 0.8);
  }

  /**
   * 七: the torn hole in panel 2, seen from inside — the dark pre-dawn garden
   * through it (P4, printed in front of the paper and under the kumiko), torn
   * washi fibres round the lip and three curled flaps folding into the room.
   */
  function carveTear(P0) {
    const P4 = P0('ink', 'P4'), P7 = P0('ink', 'P7'), K = P0('ink', 'K');
    const pts = tearPath(), t = G.tear;
    const cx = (t.x0 + t.x1) / 2, cy = (t.y0 + t.y1) / 2;
    const path = (c) => { c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.closePath(); };
    // beyond the paper: night-blue garden, a paler band low down (the sky over the far hedge)
    P4.save();
    path(P4); P4.clip();
    const g = P4.createLinearGradient(0, t.y0 - 10, 0, t.y1 + 10);
    g.addColorStop(0, U.rgba(U.mix(C.ai, C.bero, 0.45), 0.72));
    g.addColorStop(0.55, U.rgba(U.mix(C.ai, C.bero, 0.45), 0.72));
    g.addColorStop(0.62, U.rgba(U.mix(C.ai, C.kikyo, 0.45), 0.66));
    g.addColorStop(0.8, U.rgba(U.mix(C.ai, C.nezumi, 0.5), 0.8));
    g.addColorStop(0.82, U.rgba(U.mix(C.kon, C.nezumi, 0.4), 0.85));
    g.addColorStop(1, U.rgba(U.mix(C.kon, C.nezumi, 0.4), 0.85));
    P4.fillStyle = g;
    P4.fillRect(t.x0 - 20, t.y0 - 20, t.x1 - t.x0 + 40, t.y1 - t.y0 + 40);
    P4.restore();
    // torn fibres of the washi reaching into the hole (long-fibred kōzo tears, it does not cut)
    const r = U.rng(512);
    P7.lineCap = 'round';
    for (let i = 0; i < pts.length; i++) {
      const q = pts[i];
      if (r() < 0.35) continue;
      const dx = cx - q[0], dy = cy - q[1], d = Math.hypot(dx, dy) || 1;
      const L = U.lerp(2, 7, r());
      const a = Math.atan2(dy, dx) + U.lerp(-0.5, 0.5, r());
      P7.strokeStyle = U.rgba(C.geppaku, U.lerp(0.45, 0.85, r()));
      P7.lineWidth = U.lerp(0.5, 0.9, r());
      P7.beginPath(); P7.moveTo(q[0] - (dx / d) * 1.5, q[1] - (dy / d) * 1.5);
      P7.quadraticCurveTo(q[0] + Math.cos(a) * L * 0.5, q[1] + Math.sin(a) * L * 0.5 + 1, q[0] + Math.cos(a) * L, q[1] + Math.sin(a) * L);
      P7.stroke();
    }
    // three curled flaps folding into the room: paper-white slivers, their turned-back face greyer
    const flaps = [
      [[cx - 14, t.y0 + 6], [cx + 1, t.y0 + 3], [cx - 3, t.y0 + 24], [cx - 9, t.y0 + 21]],     // hanging from the top
      [[t.x1 - 1, cy - 10], [t.x1, cy + 8], [cx + 13, cy + 4], [cx + 16, cy - 4]],             // curling in from the right
      [[cx - 18, t.y1 - 4], [cx - 4, t.y1 - 1], [cx - 9, t.y1 - 18]],                         // folded up from below
    ];
    for (const f of flaps) {
      P7.fillStyle = U.rgba(C.geppaku, 0.96);
      P7.beginPath(); f.forEach((q, i) => (i ? P7.lineTo(q[0], q[1]) : P7.moveTo(q[0], q[1]))); P7.closePath(); P7.fill();
      // the underside of the curl (the part turned toward the room) a shade greyer
      const m = [(f[0][0] + f[1][0]) / 2, (f[0][1] + f[1][1]) / 2];
      P7.fillStyle = U.rgba(U.mix(C.geppaku, C.nezumi, 0.35), 0.9);
      P7.beginPath(); P7.moveTo(m[0], m[1]); P7.lineTo(f[1][0], f[1][1]); P7.lineTo(f[2][0], f[2][1]); P7.closePath(); P7.fill();
      K.strokeStyle = U.rgba(C.sumi, 0.7);
      K.lineWidth = 0.9;
      K.lineJoin = 'round';
      K.beginPath(); f.forEach((q, i) => (i ? K.lineTo(q[0], q[1]) : K.moveTo(q[0], q[1]))); K.closePath(); K.stroke();
    }
  }

  /** the ragged torn hole in panel 2 (七) */
  function tearPath() {
    const t = G.tear, r = U.rng(505);
    const cx = (t.x0 + t.x1) / 2, cy = (t.y0 + t.y1) / 2, rx = (t.x1 - t.x0) / 2, ry = (t.y1 - t.y0) / 2;
    const pts = [];
    const n = 44;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * U.TAU;
      const k = 0.78 + 0.26 * r() + 0.12 * Math.sin(a * 3 + 1);
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return pts;
  }
  SB.tearPath = tearPath;

  /** 七: the pre-dawn engawa seen through the opened panel 3. */
  function carveOutside(P) {
    const o = G.opening;
    const P6 = P('outsky', 'P6'), P6w = P('outsky', 'P6~worn'), P4 = P('outside', 'P4'), P1 = P('outside', 'P1'), K = P('outside', 'K'), P7 = P('outside', 'P7');
    const x0 = o.x0, x1 = o.x1, y0 = G.top, y1 = G.bottom;
    const all = [P6, P6w, P4, P1, K, P7];
    for (const c of all) { c.save(); c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip(); }
    // the sky (the first impression's block, never seen: 七 is always late)
    P6.fillStyle = C.ai;
    P6.fillRect(x0, y0, x1 - x0, 780 - y0);
    // the late impression's sky: flat pale 藍, a low 桔梗 band (α 0.3), no bokashi.
    // (P6 prints at α 0.55 in the 後摺 and the paper yellows over it: carve it full-strength
    //  and a touch toward ベロ藍 so it stays a cool pale blue, not khaki)
    P6w.fillStyle = U.mix(C.ai, C.bero, 0.45);
    P6w.fillRect(x0, y0, x1 - x0, 780 - y0);
    {
      const gb = P6w.createLinearGradient(0, 640, 0, 780);
      gb.addColorStop(0, U.rgba(C.kikyo, 0));
      gb.addColorStop(0.5, U.rgba(C.kikyo, 0.42));
      gb.addColorStop(1, U.rgba(C.kikyo, 0.5));
      P6w.fillStyle = gb;                      // (bokashi is gone in the 後摺 — but this is the dawn's own band, printed flat-ish)
      P6w.fillRect(x0, 640, x1 - x0, 140);
    }
    // the eave's underside at the top of the opening, with rafter ends
    P1.fillStyle = WOOD;
    P1.fillRect(x0, y0, x1 - x0, 30);
    K.fillStyle = U.rgba(C.sumi, 0.72);
    K.fillRect(x0, y0, x1 - x0, 30);
    for (let rx = x0 + 6; rx < x1; rx += 36) { K.fillStyle = U.rgba(C.sumi, 0.92); K.fillRect(rx, y0 + 24, 13, 9); }
    // far hills: a flat 鼠 line; susuki silhouettes (鼠 / 銀鼠: the warm block is gone)
    P4.fillStyle = U.rgba(C.nezumi, 0.5);
    P4.beginPath();
    P4.moveTo(x0, 790);
    for (let x = x0; x <= x1 + 10; x += 10) P4.lineTo(x, 764 + Math.sin(x * 0.013) * 6 + U.wobble(x * 0.02, 9) * 5);
    P4.lineTo(x1, 820); P4.lineTo(x0, 820); P4.closePath(); P4.fill();
    // the dark garden between the hedge and the engawa
    P4.fillStyle = U.rgba(U.mix(C.nezumi, C.ai, 0.35), 0.62);
    P4.fillRect(x0, 818, x1 - x0, 70);
    // (the incense axis x 1180 is kept clear: no stem crosses x 1150–1212)
    for (const bx of [972, 1004, 1040, 1080, 1118, 1240, 1268, 1296]) {
      const i = Math.round(bx / 7);
      const lean = bx < 1180 ? -0.14 : 0.1;
      B.susuki(P4, bx, 905, U.lerp(150, 220, U.hash(i + 7)), { t: 0, seed: 700 + i, wind: 0.2, lean, blades: 6, plumes: 3, blade: U.mix(C.nezumi, C.sumi, 0.3), plume: C.ginnezu, alpha: 0.9 });
    }
    // the engawa boards just outside (lit by the low moon), 煤竹 with seams
    P1.fillStyle = U.mix(SUSUDAKE, C.odo, 0.2);
    P1.fillRect(x0, 884, x1 - x0, y1 - 884);
    K.strokeStyle = U.rgba(C.sumi, 0.6);
    K.lineWidth = 1.1;
    for (const by of [884, 904, 930]) { K.beginPath(); K.moveTo(x0, by); K.lineTo(x1, by); K.stroke(); }
    const gb = K.createLinearGradient(0, 884, 0, y1);
    gb.addColorStop(0, U.rgba(C.sumi, 0.05));
    gb.addColorStop(1, U.rgba(C.sumi, 0.5));
    K.fillStyle = gb;
    K.fillRect(x0, 884, x1 - x0, y1 - 884);
    const P8 = P('outside', 'P8');
    P8.fillStyle = U.rgba(C.geppaku, 0.22);
    P8.fillRect(x0, 884, x1 - x0, 1.5);
    for (const c of all) c.restore();
  }

  PRINT.defineShot('B', {
    layers: ['base', 'ink'],
    worn: false,
    build(P) { carve(P, 'B'); },
  });
  PRINT.defineShot('B7', {
    layers: ['base', 'ink'],
    worn: true,
    build(P) {
      carve(P, 'B7');
      // the key block's late impression, carved by hand: the solid blacks of the room
      // take a fine goma-zuri speckle and a few cracks, never the line-art dash-gaps
      TSUKI.SHOTS.gentleWear(P, 'ink', 'K', 801, { gaps: 1400, cracks: 7 });
    },
  });

  /* ------------------------------------------------------------------ */
  /* printing                                                            */
  /* ------------------------------------------------------------------ */
  SB.draw = (ctx, T, opts = {}) => {
    const id = opts.id || 'B';
    const layers = ['base', 'ink'];
    const st = PRINT.state(T);
    ctx.save();
    ctx.imageSmoothingQuality = 'low';
    if (opts.under) { ctx.save(); opts.under(ctx, st); ctx.restore(); }
    for (const l of layers) {
      if (opts.skip && opts.skip.includes(l)) continue;
      TSUKI.SHOTS.printFlat(ctx, T, id, l, opts.print || {});
      if (opts.between && opts.between[l]) { ctx.save(); opts.between[l](ctx, st); ctx.restore(); }
    }
    ctx.restore();
  };

  SB.windowClip = (ctx) => {
    ctx.beginPath();
    ctx.arc(G.window.x, G.window.y, G.window.r, 0, U.TAU);
    ctx.clip();
  };

  /** The moon seen through the round window (a hole to the paper), with a little halo. */
  SB.moonInWindow = (ctx, T, opts = {}) => {
    const m = MOON.B(T);
    const x = opts.x == null ? m.x : opts.x, y = opts.y == null ? m.y : opts.y, r = opts.r == null ? m.r : opts.r;
    if (Math.hypot(x - G.window.x, y - G.window.y) > G.window.r + r * 2.2) return;
    ctx.save();
    SB.windowClip(ctx);
    MOON.draw(ctx, x, y, r, T, { halo: opts.halo == null ? 0.6 : opts.halo, haloR: r * 2, alpha: opts.alpha, fringe: false });
    SB.moonFringes(ctx, x, y, r, T, opts.alpha);
    ctx.restore();
  };

  /**
   * The tears' chromatic fringes on the moon: where a drifting plate's hole no
   * longer lines up with the disc, that plate's ink prints a thin crescent onto
   * the paper moon (藍/ベロ藍 one side, 山吹 the other; 1–4 px as the plates
   * swing). Drawn here because MOON.draw currently paints its bare-paper disc
   * over its own fringes.
   */
  SB.moonFringes = (ctx, x, y, r, T, alpha = 1) => {
    const st = PRINT.state(T);
    const a0 = alpha == null ? 1 : alpha;
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, U.TAU); ctx.clip();
    for (const [id, col] of [['P6', C.bero], ['P5', C.ai], ['P2', C.yamabuki]]) {
      const o = st.off[id];
      if (!o || st.alpha[id] <= 0) continue;
      const dx = o[0] * 0.36, dy = o[1] * 0.36;
      if (Math.hypot(dx, dy) < 0.4) continue;
      ctx.fillStyle = U.rgba(col, 0.82 * st.alpha[id] * a0);
      ctx.beginPath();
      ctx.arc(x, y, r + 2, 0, U.TAU);
      ctx.arc(x + dx, y + dy, r, 0, U.TAU, true);
      ctx.fill('evenodd');
    }
    ctx.restore();
  };

  /** clip to the shoji paper (whole wall, or a list of x-ranges) */
  SB.paperClip = (ctx, ranges) => {
    ctx.beginPath();
    for (const [a, b] of ranges || [[G.panels[0][0], G.panels[3][1]]]) ctx.rect(a, G.top, b - a, G.bottom - G.top);
    ctx.clip();
  };

  /**
   * The live moonlight on the paper: 月白 at the glow falling to 月白×藍鼠 on
   * the far panels (P4), a brighter core (P7), and a cloud's dimming (K).
   */
  SB.light = (ctx, T, opts = {}) => {
    const gl = SB.glow(T);
    const x = opts.x == null ? gl.x : opts.x, y = opts.y == null ? gl.y : opts.y;
    const R = opts.r == null ? 235 : opts.r;
    const far = opts.falloff == null ? 0.56 : opts.falloff;
    const x0 = G.panels[0][0], x1 = G.panels[3][1];
    ctx.save();
    SB.paperClip(ctx, opts.ranges);
    PRINT.with(ctx, 'P4', T, (c) => {
      const R1 = R * 5.2;
      const ecl = U.clamp(opts.eclipse || 0);
      const g = c.createRadialGradient(x, y, 0, x, y, R1);
      const at = (r) => r / R1;
      g.addColorStop(0, U.rgba(AINEZU, 0));
      g.addColorStop(at(R * (0.8 + 0.2 * ecl)), U.rgba(AINEZU, 0));
      g.addColorStop(at(R * (1.7 - 0.55 * ecl)), U.rgba(AINEZU, far * (0.4 + 0.5 * ecl)));
      g.addColorStop(at(R * 2.6), U.rgba(AINEZU, far * (0.74 + 0.4 * ecl)));
      g.addColorStop(1, U.rgba(AINEZU, Math.min(0.95, far * (1 + 0.4 * ecl))));
      c.fillStyle = g;
      c.fillRect(x0, G.top, x1 - x0, G.bottom - G.top);
    });
    const core = opts.core == null ? 1 : opts.core;
    if (core > 0) {
      PRINT.with(ctx, 'P7', T, (c) => {
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(x, y, 0, x, y, R * 1.12);
        g.addColorStop(0, U.rgba(C.gofun, 0.2 * core));
        g.addColorStop(0.6, U.rgba(C.gofun, 0.15 * core));
        g.addColorStop(0.84, U.rgba(C.gofun, 0.06 * core));
        g.addColorStop(1, U.rgba(C.gofun, 0));
        c.fillStyle = g;
        c.fillRect(x - R * 1.1, y - R * 1.1, 2.2 * R, 2.2 * R);
      });
    }
    const dim = opts.dim || 0;
    if (dim > 0.001) {
      PRINT.with(ctx, 'K', T, (c) => {
        c.globalCompositeOperation = 'multiply';
        c.fillStyle = U.rgba(U.mix(AINEZU, C.sumi, 0.6), U.clamp(dim) * 0.94);
        c.fillRect(x0, G.top, x1 - x0, G.bottom - G.top);
      });
    }
    ctx.restore();
  };

  /** Darken the alcove: a = 0 (spill-lit) … 1 (lost in shadow). */
  SB.tokonomaShade = (ctx, T, a) => {
    if (a <= 0.001) return;
    PRINT.with(ctx, 'K', T, (c) => {
      c.fillStyle = U.rgba(C.sumi, Math.min(1, 0.92 * Math.max(0, a)));   // a > 1 → up to solid
      c.fillRect(G.tokonoma.x0, G.tokonoma.y0 - 24, G.post[0] - G.tokonoma.x0, G.floorY - G.tokonoma.y0 + 24);
    });
  };

  /* ------------------------------------------------------------------ */
  /* shadows on the paper                                                */
  /*   sharp (puppets held against the paper): fill paths straight onto  */
  /*   the print, 藍鼠 multiply through P4 — sharpFill(ctx, T, path, rule)*/
  /*   soft (far from the paper): paint coverage into a small, low-res   */
  /*   layer; its smooth upscale is the penumbra — softLayer / softPrint */
  /* ------------------------------------------------------------------ */
  const bufs = {};

  /** Fill shadow path(s) straight onto the paper: 藍鼠 multiply, plate P4 (offset & alpha). */
  SB.sharpFill = (ctx, T, paths, opts = {}) => {
    const list = Array.isArray(paths) ? paths : [[paths, opts.rule || 'nonzero']];
    PRINT.with(ctx, opts.plate || 'P4', T, (c) => {
      c.save();
      if (opts.clip !== false) SB.paperClip(c, opts.ranges);
      c.globalCompositeOperation = 'multiply';
      c.globalAlpha *= opts.alpha == null ? 1 : opts.alpha;
      c.fillStyle = opts.color || AINEZU;
      for (const [p, rule] of list) if (p) c.fill(p, rule || 'nonzero');
      c.restore();
    });
  };

  /**
   * A soft shadow layer over region [x0,y0,x1,y1] (logical px) at a fraction
   * `res` of the print's resolution (0.3 → a penumbra of ≈3 print px).
   * Returns a context in stage coordinates; paint coverage in 藍鼠 (opaque).
   */
  SB.softLayer = (ctx, name, region, res = 0.3) => {
    const k = ctx.canvas.width / W;
    const [x0, y0, x1, y1] = region;
    const s = k * res;
    const w = Math.max(1, Math.ceil((x1 - x0) * s)), h = Math.max(1, Math.ceil((y1 - y0) * s));
    let b = bufs[name];
    if (!b || b.width < w || b.height < h) b = bufs[name] = B.canvas(Math.max(w, b ? b.width : 0), Math.max(h, b ? b.height : 0));
    const c = b.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, w + 2, h + 2);
    c.setTransform(s, 0, 0, s, -x0 * s, -y0 * s);
    c.fillStyle = AINEZU;
    c.strokeStyle = AINEZU;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    b.__region = { x0, y0, x1, y1, w, h, s };
    return c;
  };

  /** Print a soft layer onto the paper: 藍鼠 multiply through P4, smoothly upscaled. */
  SB.softPrint = (ctx, T, name, opts = {}) => {
    const b = bufs[name];
    if (!b || !b.__region) return;
    const R = b.__region;
    PRINT.with(ctx, opts.plate || 'P4', T, (c) => {
      c.save();
      if (opts.clip !== false) SB.paperClip(c, opts.ranges);
      c.globalCompositeOperation = opts.mode || 'multiply';
      c.globalAlpha *= opts.alpha == null ? 1 : opts.alpha;
      c.imageSmoothingEnabled = true;
      c.imageSmoothingQuality = 'medium';
      c.drawImage(b, 0, 0, R.w, R.h, R.x0, R.y0, R.w / R.s, R.h / R.s);
      c.restore();
    });
  };

  /**
   * A full-resolution scratch over a region (for things that must be composed
   * before printing, e.g. a figure darkened into the night). Same API shape as
   * softLayer with res 1; print it with softPrint(…, {mode: 'source-over'}).
   */
  SB.sharpLayer = (ctx, name, region, res) => {
    // flat silhouettes: above ≈0.85 backing px per logical px the extra resolution is invisible
    const k = ctx.canvas.width / W;
    return SB.softLayer(ctx, name, region, res == null ? Math.min(1, 0.85 / Math.max(0.01, k)) : res);
  };
})(window.TSUKI = window.TSUKI || {});
