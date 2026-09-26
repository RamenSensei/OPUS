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
    // the stone's face: an upright oblong, its edge worn and chipped by age.
    // At ≈46 px on the sheet one stone unit is ≈0.46 px, so the wear is cut
    // at a scale that reads: the sides waver by ≈1–2 units, the corners are
    // softened unevenly, and a few real chips bite 2–5 units into the face.
    const CHIPS = [[0, 0.22, 3.2, 7], [0, 0.71, 2.2, 5], [1, 0.12, 2.6, 6], [1, 0.47, 4.2, 9], [1, 0.9, 2.4, 5], [2, 0.34, 3.4, 8], [2, 0.8, 1.8, 4], [3, 0.58, 2.8, 7], [3, 0.93, 3.6, 6]];
    const CORNER = [4.2, 2.4, 5.6, 3.0];                 // TL, TR, BR, BL: how much each corner is rounded off
    const corners = [[2.2, 2.6], [97.6, 2.0], [98.0, SH - 2.6], [2.4, SH - 2.2]];
    const edge = [];
    for (let sd = 0; sd < 4; sd++) {
      const [x0, y0] = corners[sd], [x1, y1] = corners[(sd + 1) % 4];
      const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;   // inward normal (the sides run clockwise)
      const n = Math.round(L / 1.2);
      const c0 = CORNER[sd], c1 = CORNER[(sd + 1) % 4];
      for (let i = 0; i < n; i++) {
        const u = i / n, d = u * L;
        let j = 0.9 * (U.fbm2(d * 0.09, sd * 3.1, 3, 1231) - 0.5) + 0.35 * (r() - 0.5);    // the wavering side
        j += c0 * Math.pow(Math.max(0, 1 - d / (c0 * 2.2)), 2) + c1 * Math.pow(Math.max(0, 1 - (L - d) / (c1 * 2.2)), 2);
        for (const [cs, cu, cd, cw] of CHIPS) {
          if (cs !== sd) continue;
          const t = (d - cu * L) / cw;
          if (Math.abs(t) < 1) j += cd * (1 - t * t) * (0.8 + 0.4 * U.hash(i + sd * 97));
        }
        edge.push([x0 + dx * u + nx * j, y0 + dy * u + ny * j]);
      }
    }
    c.beginPath();
    c.moveTo(edge[0][0], edge[0][1]);
    for (const q of edge) c.lineTo(q[0], q[1]);
    c.closePath();
    c.fillStyle = C.shu;
    c.fill();
    // 印泥: the paste lies unevenly — denser and deeper in places, thinner in others
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
    // the paste pools a little at the stone's edge (a pressed seal's rim is its densest line)
    c.strokeStyle = U.rgba(U.mix(C.shu, C.akane, 0.5), 0.28);
    c.lineWidth = 2.2;
    c.stroke();
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
    // the paper's tooth takes the paste unevenly: density 0.85–1 in a fibrous noise
    const img = c.getImageData(0, 0, cv.width, cv.height), px = img.data;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
      const o = (y * cv.width + x) * 4 + 3;
      if (!px[o]) continue;
      const X = x / sc, Y = y / sc;
      const v = 0.6 * U.fbm2(X / 9, Y / 14, 3, 1241) + 0.4 * U.fbm2(X / 1.6, Y / 3.2, 2, 1242);
      px[o] = Math.round(px[o] * U.clamp(0.85 + 0.15 * (1.35 * v - 0.1), 0.85, 1));
    }
    c.putImageData(img, 0, 0);
    sealSprite = cv;
    return cv;
  }

  /** The stone's shadow as it comes down (and lifts): a soft 墨 oblong, two degrees of softness. */
  let stoneShade = null;
  function buildStoneShade() {
    const { w } = SEAL, h = (w * STONE.h) / STONE.w, pad = 26, q = 2;
    const mk = (blur) => {
      const cv = TSUKI.B.canvas(Math.ceil((w + pad * 2) * q), Math.ceil((h + pad * 2) * q));
      const c = cv.getContext('2d');
      c.scale(q, q);
      c.filter = `blur(${blur}px)`;
      c.fillStyle = C.sumi;
      c.fillRect(pad, pad, w, h);
      return cv;
    };
    stoneShade = { soft: mk(10 * 2), firm: mk(4 * 2), pad, w, h };
    return stoneShade;
  }

  /**
   * 忘れじ is pressed (230.0, the taiko's thud). 229.72–230.0: the stone's
   * shadow comes down onto the paper — large and soft, then small and firm
   * (α 0 → 0.18, scale 1.25 → 1.02, offset (+6,+8) → (+1,+1)). 230.0: the
   * stone is on the paper and lifts: the seal is simply THERE, at full
   * density and full size; the shadow goes up and away (230.02–230.34).
   * 230.0–230.5 the paste settles into the fibres (1.0 → 0.92), its first
   * wet spread (a 0.4 px bloom) drying back by 230.6.
   */
  const SEAL_T = 230.0;
  function drawStoneShade(ctx, T) {
    let p, dir;
    if (T >= SEAL_T - 0.28 && T < SEAL_T) { p = U.ease.inQuad(U.seg(T, SEAL_T - 0.28, SEAL_T)); dir = 1; }
    else if (T >= SEAL_T + 0.02 && T < SEAL_T + 0.34) { p = 1 - U.ease.outQuad(U.seg(T, SEAL_T + 0.02, SEAL_T + 0.34)); dir = -1; }
    else return;
    const sh = stoneShade || buildStoneShade();
    const a = (dir > 0 ? 0.16 : 0.1) * p;
    const s = U.lerp(1.25, 1.02, p);
    const ox = U.lerp(6, 1, p), oy = U.lerp(8, 1, p);
    const { cx, cy } = SEAL;
    ctx.save();
    ctx.translate(cx + ox, cy + oy);
    ctx.rotate(SEAL_ROT);
    ctx.scale(s, s);
    const W = sh.w + sh.pad * 2, H = sh.h + sh.pad * 2;
    ctx.globalAlpha = a * (1 - p);
    ctx.drawImage(sh.soft, -W / 2, -H / 2, W, H);
    ctx.globalAlpha = a * p;
    ctx.drawImage(sh.firm, -W / 2, -H / 2, W, H);
    ctx.restore();
  }
  const SEAL_ROT = -0.0087;                        // ≈ 0.5°: stamped by hand, never quite square

  function drawSeal(ctx, T) {
    drawStoneShade(ctx, T);
    if (T < SEAL_T) return;
    const a = U.lerp(1, 0.92, U.ease.outSine(U.seg(T, SEAL_T, SEAL_T + 0.5)));
    const bloom = 0.25 * (1 - U.ease.outSine(U.seg(T, SEAL_T, SEAL_T + 0.6)));
    const spr = sealSprite || buildSeal();
    const { cx, cy, w } = SEAL;
    const h = (w * STONE.h) / STONE.w;
    ctx.save();
    ctx.imageSmoothingQuality = 'high';       // a small, heavily reduced sprite: resample well
    ctx.translate(cx, cy);
    ctx.rotate(SEAL_ROT);
    if (bloom > 0.003) {                       // the wet paste's first spread into the fibres
      ctx.globalAlpha = bloom;
      const bw = w + 0.8, bh = h + 0.8;
      ctx.drawImage(spr, -bw / 2, -bh / 2, bw, bh);
    }
    ctx.globalAlpha = a;
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
    // the rabbit pressed up with the disc: its outline in relief under the
    // carbon — lit on its upper-left slopes, shaded on its lower-right
    const rl = relief || buildRelief();
    ctx.drawImage(rl.cv, x - r - rl.pad, y - r - rl.pad, rl.S / rl.q, rl.S / rl.q);
    // the rabbit's carbon: the one thing given to the moon, and kept (墨 α 0.10)
    const cb = carbon || buildCarbon();
    ctx.save();
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = k * 0.1 / 0.82;          // the sprite's mean density ≈ 0.82
    ctx.drawImage(cb.cv, x - r - cb.pad, y - r - cb.pad, cb.S / cb.q, cb.S / cb.q);
    ctx.restore();
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
    drawKira(ctx, T, k);
  }

  /**
   * Kira in the relief: a few fixed mica flecks dusted into the embossed
   * disc. They rest barely there; once — as the last key lines clear and
   * before the seal (228.2–229.6) — a slow raking light crosses the disc
   * along the moon's own 30° kira axis and each catches it in turn.
   */
  const KIRA_N = 26;
  const kiraFlecks = (() => {
    const out = [];
    for (let i = 0; i < KIRA_N; i++) {
      const a = U.hash(i * 5 + 3301) * TAU, d = Math.sqrt(U.hash(i * 5 + 3302)) * 0.9;
      out.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, s: U.lerp(1.0, 2.1, Math.pow(U.hash(i * 5 + 3303), 1.5)), rot: U.hash(i * 5 + 3304) * Math.PI, g: U.lerp(0.65, 1, U.hash(i * 5 + 3305)) });
    }
    return out;
  })();
  const KIRA_AX = [Math.cos(Math.PI / 6), Math.sin(Math.PI / 6)];
  function drawKira(ctx, T, k) {
    const { x, y, r } = KARA;
    const u = U.seg(T, 228.2, 229.6, U.ease.inOutSine);          // the light's pass, once
    const s = U.lerp(-1.5, 1.5, u);
    const passing = T > 228.2 && T < 229.6;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const f of kiraFlecks) {
      const along = f.x * KIRA_AX[0] + f.y * KIRA_AX[1];
      const w = passing ? Math.max(0, 1 - Math.pow((along - s) / 0.42, 2)) : 0;
      const a = k * (0.08 + 0.85 * w * w * f.g);
      if (a < 0.01) continue;
      const px = x + f.x * r, py = y + f.y * r, sz = f.s;
      ctx.fillStyle = `rgba(255,252,242,${a.toFixed(3)})`;
      ctx.beginPath();                                          // a flake of mica: a small cut facet
      ctx.moveTo(px + Math.cos(f.rot) * sz, py + Math.sin(f.rot) * sz);
      ctx.lineTo(px + Math.cos(f.rot + 1.9) * sz * 0.55, py + Math.sin(f.rot + 1.9) * sz * 0.55);
      ctx.lineTo(px - Math.cos(f.rot) * sz * 0.8, py - Math.sin(f.rot) * sz * 0.8);
      ctx.lineTo(px + Math.cos(f.rot - 1.4) * sz * 0.5, py + Math.sin(f.rot - 1.4) * sz * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * The rabbit's outline in relief (built once): the plain maria shape, its
   * upper-left rim band in 胡粉 and its lower-right rim band in 墨 — the same
   * pair of the disc's own rim, at the scale of a finer carving.
   */
  let relief = null;
  function buildRelief() {
    const { r } = KARA;
    const q = 2, pad = 8, S = Math.ceil((r * 2 + pad * 2) * q);
    const shape = TSUKI.B.canvas(S, S), c = shape.getContext('2d');
    c.scale(q, q);
    const M = TSUKI.MOON.maria;
    M(c, r + pad, r + pad, r, 1, '#000000', { strokes: M.STROKES.map((_, i) => i) });
    const band = (dx, dy, col, a) => {
      const b = TSUKI.B.canvas(S, S), bc = b.getContext('2d');
      bc.drawImage(shape, 0, 0);
      bc.globalCompositeOperation = 'destination-out';
      bc.drawImage(shape, dx * q, dy * q);
      bc.globalCompositeOperation = 'source-in';
      bc.fillStyle = U.rgba(col, a);
      bc.fillRect(0, 0, S, S);
      return b;
    };
    const out = TSUKI.B.canvas(S, S), oc = out.getContext('2d');
    oc.drawImage(band(1.1, 1.1, C.gofun, 0.55), 0, 0);        // upper-left slopes: lit
    oc.drawImage(band(-1.1, -1.1, C.sumi, 0.13), 0, 0);       // lower-right slopes: in shade
    relief = { cv: out, pad, q, S };
    return relief;
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
    // only the part of the sheet the pushed view can see is printed (at 1.3×
    // that is 59 % of it): every full-frame plate costs that much less
    const x0 = Math.max(0, Math.floor(CAM.fx - CAM.fx / s) - 2), y0 = Math.max(0, Math.floor(CAM.fy - CAM.fy / s) - 2);
    const x1 = Math.min(S.W, Math.ceil(CAM.fx + (S.W - CAM.fx) / s) + 2), y1 = Math.min(S.H, Math.ceil(CAM.fy + (S.H - CAM.fy) / s) + 2);
    b.save();
    b.setTransform(1, 0, 0, 1, 0, 0);          // a whole-pixel clip (no anti-aliased clip mask)
    b.beginPath();
    b.rect(Math.floor(x0 * S.k), Math.floor(y0 * S.k), Math.ceil((x1 - x0) * S.k) + 1, Math.ceil((y1 - y0) * S.k) + 1);
    b.clip();
    b.setTransform(S.k, 0, 0, S.k, 0, 0);
    b.fillStyle = C.kinari;                    // the bare washi, as the engine lays it
    b.fillRect(x0, y0, x1 - x0, y1 - y0);
    E.age(b, T);
    E.draw(b, T, { age: false, live: false });
    b.restore();
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
      buildStoneShade();
      buildCarbon();
      buildRelief();
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
