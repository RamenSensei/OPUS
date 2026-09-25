/* ==========================================================================
   09-fuji-no-keburi.js — 結　不尽の煙 (T 206–236).
   Shot E at dawn (後摺 + a fresh 東雲 block): the moon comes down to Fuji's
   summit at a steady (5,16) px/s; at 214.0 the undying smoke — the burned
   elixir and, burned with it, the emperor's poem — touches her rim, the only
   contact between earth and moon in the film (the view leans in to 1.3×
   for it, 210.5–214.0, and is home on the whole sheet by 221.5); pearl
   Fuji; the fox turns its head; 小夜's long shadow reaches toward the
   mountain. From 222 the print
   unprints itself in fugitive-pigment order (TSUKI.PRINT), down to clean
   washi: the 見当 notch, a karazuri moon carrying only the rabbit's carbon,
   小夜's last haiku (DOM), the 朱 seal 忘れじ and a tiny colophon.
   The film ends on paper, not black.
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const { U, C } = TSUKI;
  const TAU = Math.PI * 2;

  /* canvas words of the last paper (tools/fonts.js scans this file for glyphs) */
  const SEAL_TEXT = '忘れじ';
  const COLOPHON = '原典　竹取物語・今昔物語集';

  /* the last paper (screenplay: segments[結].layers['the last paper']) */
  const KARA = { x: 960, y: 360, r: 150 };
  const NOTCH = { x: 1840, y: 1040, arm: 46 };
  const SEAL = { cx: 1300, cy: 820, w: 46 };          // centre, like the karazuri circle; a tall 長方印 (≈46 × 120)

  /* ------------------------------------------------------------------ */
  /* the seal 忘れじ — 白文: the characters are cut out of the 朱 to the   */
  /* paper (like the moon, they are absence). The characters are the     */
  /* outlines of Shippori Mincho B1 ExtraBold (SIL OFL, the film's own   */
  /* mincho), embedded so the stamp never waits on a font subset. A     */
  /* tall 長方印, one column read top to bottom — 忘 / れ / じ — each     */
  /* character whole in its own near-square cell (a two-column layout    */
  /* would stretch 忘 until 亡 and 心 read as two characters).           */
  /* Coordinates: font units, y down (baseline at 880); [bbox], path.    */
  /* ------------------------------------------------------------------ */
  const GLYPHS = {
    '忘': [[61, 28, 951, 946],
      'M776 168 795 140Q800 134 808 122Q816 110 822 104Q827 99 831 99Q839 99 878 131Q917 163 933 183Q938 188 93' +
      '8 194Q938 200 932 205Q925 210 913 210H355Q345 210 340 216Q334 221 334 231V369Q334 378 338 382Q341 387 35' +
      '3 388Q365 390 391 390H569Q661 390 713 388L756 383Q770 381 784 377Q799 374 801 374Q807 374 811 375Q840 38' +
      '3 852 394Q864 406 864 424Q864 454 842 468Q820 482 756 488Q693 494 560 494H386Q318 494 284 486Q250 479 23' +
      '6 458Q221 437 221 394V231Q221 221 216 216Q210 210 200 210H171Q136 211 101 219Q98 220 93 220Q81 220 74 20' +
      '7L70 200Q67 194 67 188Q67 182 72 178Q77 175 86 176Q120 179 189 181H419Q440 181 440 160Q438 92 433 48V46Q' +
      '433 35 440 30Q446 26 457 29Q578 55 578 69Q578 73 571 78L568 80Q554 89 554 105V160Q554 170 560 176Q565 18' +
      '1 575 181H751Q767 181 776 168ZM421 533Q425 531 430 531Q436 531 441 532Q510 540 554 562Q599 584 619 612Q6' +
      '39 640 639 668Q639 695 622 713Q606 731 581 731Q568 731 553 725Q542 721 535 705Q520 667 492 626Q464 586 4' +
      '32 552Q426 545 422 540Q419 535 421 533ZM297 719Q297 653 292 612V610Q292 599 298 594Q305 590 316 593Q430 ' +
      '618 430 631Q430 636 424 639L423 640Q409 650 409 665V820Q409 831 416 835Q423 839 447 839H553Q609 839 639 ' +
      '837Q650 836 656 834Q661 831 666 823Q673 814 684 786Q694 759 706 725Q712 708 717 708Q719 708 721 714Q723 ' +
      '719 723 729L725 810Q725 825 742 834Q755 842 760 852Q766 861 766 875Q766 901 746 916Q727 932 678 939Q630 ' +
      '946 541 946H426Q371 946 344 938Q318 930 308 909Q297 888 297 846ZM721 600Q721 596 728 596Q733 596 742 599' +
      'Q850 631 900 686Q951 740 951 795Q951 829 934 851Q916 873 889 873Q869 873 849 860Q837 852 836 836Q829 780' +
      ' 800 722Q772 664 732 618Q721 604 721 600ZM194 603Q200 603 206 620Q224 675 224 727Q224 776 208 812Q192 84' +
      '9 166 868Q147 883 121 883Q102 883 87 874Q72 864 65 847Q61 833 61 826Q61 806 72 789Q84 772 104 761Q132 74' +
      '3 156 705Q180 667 186 623Q188 603 194 603Z'],
    'れ': [[103, 101, 990, 908],
      'M990 609Q990 612 986 624Q981 635 978 641Q892 846 775 846Q722 846 687 824Q652 802 636 768Q619 734 619 696' +
      'Q619 654 626 610Q632 567 647 491Q669 388 669 344Q669 316 658 298Q648 280 625 280Q577 280 502 346Q426 413' +
      ' 362 502Q354 514 354 528Q356 622 366 708L374 768Q375 774 378 796Q381 819 381 840Q381 869 366 888Q352 908' +
      ' 329 908Q305 908 292 898Q280 888 276 877Q272 866 267 841Q261 808 251 768Q246 751 237 751Q232 751 228 758' +
      'Q220 772 211 784Q200 799 182 810Q164 821 149 821Q131 821 117 803Q103 785 103 757Q103 715 138 669Q151 652' +
      ' 174 623Q180 614 180 607Q180 600 177 593Q149 541 136 508Q122 475 122 442Q122 399 151 378Q172 362 213 344' +
      'Q254 327 296 316Q314 310 314 292V262Q314 220 306 190Q299 160 276 138Q263 127 249 118Q235 109 235 106Q235' +
      ' 101 252 101Q272 101 302 109Q342 124 374 149Q407 174 407 206Q407 217 401 240Q395 264 387 291Q386 294 386' +
      ' 298Q386 307 396 319Q409 332 409 352Q409 358 408 361Q407 366 407 373Q407 380 410 380Q414 380 423 371Q486' +
      ' 307 552 268Q617 228 673 228Q727 228 752 262Q777 296 777 347Q777 384 772 422Q767 461 757 516Q747 573 742' +
      ' 607Q737 641 737 676Q737 713 756 730Q776 746 800 746Q840 746 876 724Q913 702 961 634Q965 628 974 616Q982' +
      ' 604 986 604Q990 604 990 609ZM185 569Q191 581 200 581Q208 581 215 572Q270 506 296 463Q309 440 309 432Q30' +
      '9 427 306 425Q304 423 298 423Q264 423 234 433Q203 443 184 460Q166 477 166 495Q166 528 185 569ZM297 718V6' +
      '88L298 664V662Q298 653 295 647Q292 641 287 641Q282 641 277 649Q273 656 263 679Q259 689 259 693Q259 696 2' +
      '63 706Q266 710 270 718Q276 730 282 740Q289 751 293 751Q296 751 296 742Q297 732 297 718Z'],
    'じ': [[170, 112, 862, 905],
      'M222 617Q222 563 226 516Q230 469 237 402Q247 302 247 265Q247 220 227 188Q207 155 181 140Q176 137 173 135' +
      'Q170 133 170 130Q170 123 199 118Q228 112 251 112Q322 112 352 142Q382 173 382 231Q382 265 374 308Q365 351' +
      ' 349 409Q319 519 319 604Q319 705 362 748Q406 792 498 792Q576 792 660 753Q744 714 831 627Q842 616 849 616' +
      'Q851 616 851 618Q851 624 841 640Q675 905 462 905Q222 905 222 617ZM761 248Q731 207 710 186Q689 166 661 15' +
      '5Q653 152 642 148Q632 144 628 142Q624 139 624 136Q624 131 654 129Q684 127 699 127Q767 127 814 150Q862 17' +
      '3 862 222Q862 254 844 264Q826 275 811 275Q780 275 761 248ZM618 341Q604 301 588 272Q571 244 544 217Q538 2' +
      '11 530 204Q523 198 523 196Q523 191 532 191Q556 191 605 207Q654 223 693 254Q732 284 732 327Q732 357 716 3' +
      '70Q700 384 679 384Q633 384 618 341Z'],
  };
  // cells [x, y, w, h] in a 100 × 262-unit stone: 9 units of margin, 5 between
  // characters; each glyph is scaled (almost) uniformly into its cell
  const STONE = { w: 100, h: 262 };
  const CELLS = { '忘': [9, 9, 82, 84], 'れ': [9, 98, 82, 74], 'じ': [14, 177, 72, 76] };

  let sealSprite = null;
  function buildSeal() {
    const sc = 2.4, SW = STONE.w, SH = STONE.h;
    const cv = TSUKI.B.canvas(Math.ceil(SW * sc), Math.ceil(SH * sc));
    const c = cv.getContext('2d');
    c.scale(sc, sc);
    const r = U.rng(1230);
    // the stone's face: an upright oblong whose edge has been chipped by age
    c.beginPath();
    const edge = [];
    const side = (x0, y0, x1, y1, n) => {
      for (let i = 0; i < n; i++) {
        const s = i / n;
        const j = (r() - 0.5) * 1.1 + (r() < 0.08 ? -1.5 * r() : 0);
        const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
        edge.push([U.lerp(x0, x1, s) - (dy / L) * j, U.lerp(y0, y1, s) + (dx / L) * j]);
      }
    };
    side(2.2, 2.6, 97.6, 2.0, 30);
    side(97.6, 2.0, 98.0, SH - 2.6, 78);
    side(98.0, SH - 2.6, 2.4, SH - 2.2, 30);
    side(2.4, SH - 2.2, 2.2, 2.6, 78);
    c.moveTo(edge[0][0], edge[0][1]);
    for (const p of edge) c.lineTo(p[0], p[1]);
    c.closePath();
    c.fillStyle = C.shu;
    c.fill();
    // 印泥: the paste lies a little unevenly — denser and deeper in places
    c.save();
    c.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 180; i++) {
      const x = r() * SW, y = r() * SH, rr = U.lerp(4, 16, r());
      const g = c.createRadialGradient(x, y, 0, x, y, rr);
      const deep = r() < 0.55;
      const col = deep ? U.mix(C.shu, C.akane, 0.55) : U.mix(C.shu, C.yamabuki, 0.22);
      const a = U.lerp(0.06, 0.2, r());
      g.addColorStop(0, U.rgba(col, a));
      g.addColorStop(1, U.rgba(col, 0));
      c.fillStyle = g;
      c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    c.restore();
    // cut the characters out to the paper. A carver's strokes are more even
    // than a brush's: the mincho's hairlines are thickened a little.
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = '#000';
    c.strokeStyle = '#000';
    c.lineJoin = 'round';
    for (const ch of Object.keys(CELLS)) {
      const [[a, b, e, f], d] = GLYPHS[ch];
      const [cx, cy, cw, chh] = CELLS[ch];
      const sx = cw / (e - a), sy = chh / (f - b);
      const p = new Path2D(d);
      c.save();
      c.translate(cx, cy);
      c.scale(sx, sy);
      c.translate(-a, -b);
      c.fill(p);
      c.lineWidth = 1.6 / Math.sqrt(sx * sy);
      c.stroke(p);
      c.restore();
    }
    // a pressed stamp never inks perfectly: small voids, more toward the rim
    for (let i = 0; i < 780; i++) {
      const x = r() * SW, y = r() * SH;
      const dEdge = Math.min(x, y, SW - x, SH - y);
      if (r() > 0.22 + 0.78 * Math.exp(-dEdge / 7)) continue;
      c.globalAlpha = U.lerp(0.35, 1, r());
      const s = U.lerp(0.3, 1.2, r());
      c.beginPath();
      c.ellipse(x, y, s, s * U.lerp(0.5, 1, r()), r() * Math.PI, 0, TAU);
      c.fill();
    }
    // two faint hairline cracks in the stone, as old seals have
    c.globalAlpha = 0.9;
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(2, 170); c.lineTo(5.5, 169.3); c.lineTo(8, 170.2);
    c.moveTo(98, 52); c.lineTo(95, 53);
    c.stroke();
    c.restore();
    sealSprite = cv;
    return cv;
  }

  function drawSeal(ctx, T) {
    const t0 = 230.0;
    if (T < t0) return;
    const p = U.clamp((T - t0) / 0.12);
    const a = 0.92 * U.ease.outCubic(p);
    const s = U.lerp(1.06, 1.0, U.ease.outCubic(p));
    const spr = sealSprite || buildSeal();
    const { cx, cy, w } = SEAL;
    const h = (w * STONE.h) / STONE.w;
    ctx.save();
    ctx.imageSmoothingQuality = 'high';       // a small, heavily reduced sprite: resample well
    ctx.globalAlpha = a;
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    ctx.rotate(-0.012);                       // stamped by hand, never quite square
    ctx.drawImage(spr, -w / 2, -h / 2, w, h);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* the karazuri moon and the 見当 notch: relief in the bare paper       */
  /* ------------------------------------------------------------------ */
  /**
   * The rabbit's carbon, as ink that soaked into the fibres sixty years ago:
   * the maria shape (TSUKI.MOON.maria), softened and uneven, built once.
   */
  let carbon = null;
  function buildCarbon() {
    const { r } = KARA;
    const q = 1.5, pad = 12, S = Math.ceil((r * 2 + pad * 2) * q);
    const shape = TSUKI.B.canvas(S, S);
    const c = shape.getContext('2d');
    c.scale(q, q);
    TSUKI.MOON.maria(c, r + pad, r + pad, r, 1, '#000000');
    // soften the cut edge: carbon bleeds a hair into the paper
    const soft = TSUKI.B.canvas(S, S);
    const s2 = soft.getContext('2d');
    s2.filter = 'blur(2.2px)';
    s2.drawImage(shape, 0, 0);
    s2.filter = 'none';
    s2.globalAlpha = 0.55;
    s2.drawImage(shape, 0, 0);
    // uneven density: the ink lies heavier in some fibres than others
    const img = TSUKI.B.canvas(S, S);
    const ic = img.getContext('2d');
    const d = ic.createImageData(S, S);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const v = 0.55 * U.fbm2(x / 38, y / 38, 4, 91) + 0.3 * U.fbm2(x / 7, y / 11, 2, 92) + 0.15 * U.hash2(x, y);
      d.data[(y * S + x) * 4 + 3] = U.clamp(0.35 + v * 0.95) * 255;
    }
    ic.putImageData(d, 0, 0);
    s2.globalAlpha = 1;
    s2.globalCompositeOperation = 'destination-in';
    s2.drawImage(img, 0, 0);
    // tint it 墨
    s2.globalCompositeOperation = 'source-in';
    s2.fillStyle = C.sumi;
    s2.fillRect(0, 0, S, S);
    carbon = { cv: soft, pad, q, S };
    return carbon;
  }

  function drawKarazuri(ctx, T, k) {
    if (k <= 0.001) return;
    const { x, y, r } = KARA;
    const L = -3 * Math.PI / 4;                // raking light from the upper left
    ctx.save();
    ctx.globalAlpha = k;
    // the raised disc's paper sheen (≈3%)
    const sh = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    sh.addColorStop(0, U.rgba(C.gofun, 0.09));
    sh.addColorStop(0.7, U.rgba(C.gofun, 0.035));
    sh.addColorStop(1, U.rgba(C.gofun, 0.02));
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
    // the rabbit's carbon: the one thing given to the moon, and kept (墨 α 0.10)
    const cb = carbon || buildCarbon();
    ctx.save();
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = k * 0.1 / 0.82;          // the sprite's mean density ≈ 0.82
    ctx.drawImage(cb.cv, x - r - cb.pad, y - r - cb.pad, cb.S / cb.q, cb.S / cb.q);
    ctx.restore();
    // soft cast shade just outside the lower-right rim
    const cs = ctx.createConicGradient(L, x, y);
    cs.addColorStop(0, U.rgba(C.sumi, 0));
    cs.addColorStop(0.3, U.rgba(C.sumi, 0));
    cs.addColorStop(0.5, U.rgba(C.sumi, 0.08));
    cs.addColorStop(0.7, U.rgba(C.sumi, 0));
    cs.addColorStop(1, U.rgba(C.sumi, 0));
    ctx.strokeStyle = cs;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x + 1.2, y + 1.2, r + 3.5, 0, TAU);
    ctx.stroke();
    // the fold of the emboss: a hairline that keeps the circle whole at the sides
    ctx.strokeStyle = U.rgba(C.sumi, 0.07);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(x, y, r + 0.3, 0, TAU);
    ctx.stroke();
    // the rim: 胡粉 highlight on the upper-left slope, 墨 shadow on the lower-right (±2 px)
    const hi = ctx.createConicGradient(L, x, y);
    hi.addColorStop(0, U.rgba(C.gofun, 0.9));
    hi.addColorStop(0.12, U.rgba(C.gofun, 0.62));
    hi.addColorStop(0.26, U.rgba(C.gofun, 0));
    hi.addColorStop(0.74, U.rgba(C.gofun, 0));
    hi.addColorStop(0.88, U.rgba(C.gofun, 0.62));
    hi.addColorStop(1, U.rgba(C.gofun, 0.9));
    ctx.strokeStyle = hi;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(x - 0.7, y - 0.7, r - 1.2, 0, TAU);
    ctx.stroke();
    const lo = ctx.createConicGradient(L, x, y);
    lo.addColorStop(0, U.rgba(C.sumi, 0));
    lo.addColorStop(0.22, U.rgba(C.sumi, 0));
    lo.addColorStop(0.36, U.rgba(C.sumi, 0.16));
    lo.addColorStop(0.5, U.rgba(C.sumi, 0.26));
    lo.addColorStop(0.64, U.rgba(C.sumi, 0.16));
    lo.addColorStop(0.78, U.rgba(C.sumi, 0));
    lo.addColorStop(1, U.rgba(C.sumi, 0));
    ctx.strokeStyle = lo;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(x + 0.7, y + 0.7, r + 0.2, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawNotch(ctx, k) {
    if (k <= 0.001) return;
    const { x, y, arm } = NOTCH;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.lineCap = 'square';
    ctx.lineWidth = 1;
    // 鉤見当: an L pressed by the kentō ledge — lit edge above-left, shade below-right
    ctx.strokeStyle = U.rgba(C.gofun, 0.6);
    ctx.beginPath();
    ctx.moveTo(x - arm, y - 1); ctx.lineTo(x - 1, y - 1); ctx.lineTo(x - 1, y - arm);
    ctx.stroke();
    ctx.strokeStyle = U.rgba(C.sumi, 0.13);
    ctx.beginPath();
    ctx.moveTo(x - arm, y + 1); ctx.lineTo(x + 1, y + 1); ctx.lineTo(x + 1, y - arm);
    ctx.stroke();
    ctx.restore();
  }

  function drawColophon(ctx, T) {
    const a = U.seg(T, 233, 234, U.ease.inOutSine);
    if (a <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = U.rgba(C.sumi, 0.55);
    ctx.font = '22px "Shippori Mincho B1", "Yu Mincho", "Hiragino Mincho ProN", serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = '2px';
    ctx.fillText(COLOPHON, 1760, 1012);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* the camera: one slow push toward the contact, and back to the sheet */
  /* ------------------------------------------------------------------ */
  /**
   * 210.5 (the koto's four notes) → 214.0 the view leans in to 1.3× so the
   * smoke meeting her rim reads; it holds through the first bell, 小夜's
   * shadow (215), the fox's turn (216.5) and pearl Fuji (216.6) — the push is
   * about a point low in the frame, so the house, 小夜 and the fox all stay in
   * shot — and eases back to the whole sheet by 221.5, before the unprinting.
   * About (823, 780) at 1.3 the view is x 190–1667, y 180–1011 of the stage.
   */
  const CAM = { fx: 823, fy: 780, s: 1.3 };
  const camScale = (T) => {
    const k = U.seg(T, 210.5, 214.0, U.ease.inOutSine) * (1 - U.seg(T, 217.0, 221.5, U.ease.inOutSine));
    return U.lerp(1, CAM.s, k);
  };
  const camApply = (ctx, s) => { ctx.translate(CAM.fx, CAM.fy); ctx.scale(s, s); ctx.translate(-CAM.fx, -CAM.fy); };
  /**
   * While the camera is in, the carved print is laid 1:1 into a buffer and
   * the buffer is scaled once (a scaled blit of every plate costs twice the
   * frame); the smoke thread and the rim's flash are then drawn live over it,
   * sharp. The buffer is let go whenever the camera is home.
   */
  let camBuf = null;
  function pushedPrint(ctx, T, S, s) {
    const E = TSUKI.SHOTS.E;
    const bw = Math.max(1, Math.round(S.W * S.k)), bh = Math.max(1, Math.round(S.H * S.k));
    if (!camBuf || camBuf.width !== bw || camBuf.height !== bh) camBuf = TSUKI.B.canvas(bw, bh);
    const b = camBuf.getContext('2d');
    b.setTransform(S.k, 0, 0, S.k, 0, 0);
    b.globalAlpha = 1;
    b.globalCompositeOperation = 'source-over';
    b.imageSmoothingEnabled = true;
    b.imageSmoothingQuality = 'low';
    b.fillStyle = C.kinari;                    // the bare washi, as the engine lays it
    b.fillRect(0, 0, S.W, S.H);
    E.age(b, T);
    E.draw(b, T, { age: false, live: false });
    ctx.save();
    camApply(ctx, s);
    ctx.drawImage(camBuf, 0, 0, S.W, S.H);
    E.drawLive(ctx, T);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  TSUKI.scene('fuji-no-keburi', {
    init() {
      buildSeal();
      buildCarbon();
      // ask the browser for the glyphs the canvas will need at the end
      try {
        if (document.fonts && document.fonts.load) document.fonts.load('22px "Shippori Mincho B1"', COLOPHON + SEAL_TEXT).catch(() => {});
      } catch (e) { /* offline or no FontFaceSet */ }
    },

    draw(ctx, t, S) {
      const T = S.seg.start + t;
      const E = TSUKI.SHOTS.E;
      // every sprite and plate here is carved at (or near) the stage resolution:
      // bilinear is indistinguishable, and avoids the slow high-quality resampler
      ctx.imageSmoothingQuality = 'low';
      // the push toward the contact (210.5–221.5); home, on the whole sheet, before the unprinting
      const cs = camScale(T);
      if (cs > 1) {                            // (at 1 exactly the buffer would be a plain copy: no seam either way)
        pushedPrint(ctx, T, S, cs);
        return;
      }
      camBuf = null;
      // the sheet: yellowed and foxed in the late impression, clean again at the end
      E.age(ctx, T);
      // the paper remembers what was pressed into it: relief under the ink,
      // surfacing only as the last key lines clear
      drawKarazuri(ctx, T, U.seg(T, 226.6, 228, U.ease.inCubic));
      drawNotch(ctx, U.seg(T, 225.4, 227.4, U.ease.inOutSine));
      // the print (後摺 + 東雲), lifting away 222–228 in fugitive-pigment order
      if (T < 228.05) E.draw(ctx, T, { age: false });
      // the last paper
      drawSeal(ctx, T);
      drawColophon(ctx, T);
    },
  });
})(window.TSUKI);
