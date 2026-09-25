# Scene-builder guide

How to paint one segment (段) of the film. Read this before touching `js/scenes/`.

## The contract

```js
/* js/scenes/NN-segment-id.js */
(function (TSUKI) {
  'use strict';
  const { U, B, C } = TSUKI;           // math, brushes, palette

  TSUKI.scene('segment-id', {           // id must match js/script.js
    init(S) { /* optional, once: build offscreen caches with S.canvas(w,h) */ },
    draw(ctx, t, S) {                   // t = seconds since this segment began
      // paint the whole frame, back to front
    },
  });
})(window.TSUKI);
```

* `ctx` is pre-scaled: the stage is always **1920 × 1080 logical px**. Never touch `ctx.canvas.width` or reset the transform yourself; use `save()` / `restore()`.
* `S = { W: 1920, H: 1080, dur, seg, T, U, B, C, canvas(w,h), k }`. `S.seg` is the segment entry from `js/script.js` (text cues, transition, etc.). `S.k` is backing px per logical px. Offscreen caches you draw with `drawImage` should be built at `S.k` × resolution (or at least 1:1 logical) so they stay sharp.
* **Pure function of time.** A frame must depend only on `t`. No `Math.random()`, no `Date`, no state that accumulates between frames. Use `U.rng(seed)` (fresh each frame for layout), `U.hash(n)`, `U.noise1/2`, `U.fbm2`, `U.wobble`, and `B.drift(i, t, opts)` for particles. Caches built in `init()` must be time-independent.
* **Transitions overlap.** The engine may call `draw` with `t` a few seconds past `dur` (while the next segment fades in) and, for the next segment, from `t = 0` while the previous one is still visible. Clamp your own timelines (`U.seg`, `U.env`) so both ends look finished and calm.
* **Performance.** Target < 10 ms per frame at 1280-px capture width (`tools/shoot.js` prints the render time). Cache anything static (skies, mountains, textures, far layers) in `init()`; animate only what moves. Avoid `ctx.filter` blur on large areas per frame (blur once into a cache instead). Avoid thousands of tiny `fill()` calls when one path will do. Cache keys for `B.kasumi` / `B.moon` sprites are size-bucketed; for widths that animate every frame use `B.band`.
* The engine adds the washi paper finish (fibres, mottling, aged edges) on top of every frame. Do **not** add your own global paper texture or vignette.
* Text (poems, titles, subtitles) is **not** drawn by scenes. It is DOM, driven by `js/script.js`. Your job is to leave the negative space the screenplay asks for (see each cue's `position`: `right` = x 1480–1800 · y 100–760, `upper-right` = x 1540–1830 · y 60–700, `left` = x 120–440 · y 100–760, `upper-left`, `center` = x 700–1220 · y 120–700). The Chinese subtitle band is y 960–1040: keep it calm (no bright busy detail).

## The look: a woodblock print that breathes

Ukiyo-e is **flat colour planes, carved sumi outlines, and bokashi**. It is not painterly, not photographic, not glossy.

* **Flat first.** Big shapes in one ink each. Gradients only as *bokashi* (a band that fades, e.g. the dark 一文字ぼかし at the top of the sky via `B.ichimonji`, a horizon wash, a fade at the foot of mountains). No soft airbrushed glows everywhere; the one allowed glow is the moon's halo.
* **Key-block lines.** Outline figures, architecture, bamboo, rocks, waves with sumi (`C.sumi`, alpha 0.75–0.95, 1.5–3 px), round joins. Distant things lose their outlines. `B.taper` gives carved, tapering strokes. A slight registration offset (1–2 px) between fill and outline reads as authentic printing.
* **Limited palette.** Only the inks in `TSUKI.C` (see `js/core/palette.js`, 日本の伝統色), with alpha variants (`U.rgba(C.bero, 0.4)`) and mixes (`U.mix(C.ai, C.sumi, 0.3)`). Each scene should feel like 4–7 inks, not 20.
* **Composition.** Asymmetric, generous empty space (余白), strong diagonals, dramatic foreground cropping (Hiroshige puts a branch or a figure huge in front of a tiny distance), kasumi bands to separate depth and hide what doesn't need drawing. The moon is a flat disc (`B.moon`), large and calm.
* **Figures.** Hiroshige-scale: small, simplified, silhouetted or back-view, costume shapes that read instantly (the 十二単 cascade of layered hems and long black hair of a Heian lady; the 狩衣 and eboshi of a nobleman; the straw hat and bamboo basket of the old woodcutter). Clean shapes with a few interior lines beat detailed anatomy. Avoid faces larger than ~30 px.
* **Motion.** Slow, sparse and meaningful (物の哀れ). Things *drift, sway, fall, rise, dissolve*. Use eases (`U.ease.inOutSine`) and wobble noise, never linear robotic motion. Camera moves are slow pans/pushes via `ctx.translate`/`ctx.scale` on layers with parallax. Nothing should jitter frame-to-frame.
* **Nature details that sell it.** Susuki plumes bending in wind (`B.susuki`, `B.susukiField`), falling leaves (`B.drift`), water shimmer (`B.ripples`, `B.moonReflection`), geese (`B.goose`), stylised clouds (`B.cloud`), mist bands (`B.kasumi`, `B.kasumiBank`, `B.band`), Fuji (`B.fuji`), ridges with bokashi (`B.ridge`), textile patterns for robes (`B.pattern(ctx, 'seigaiha'|'asanoha'|'same'|'kikko'|'yagasuri'|'shippo', fg, bg, size)` → fillStyle), seals (`B.seal`).

## The print: plates and the one moon (read this twice)

The whole film is **one woodblock print** (see `device`, `plates`, `moon_clock`, `shots` in `design/screenplay.json`).
Two shared modules implement it; every scene must use them so the printing, the tears, the CLICK, the late impression
and the unprinting happen everywhere at once from ONE table.

**`TSUKI.PRINT`** (`js/core/print.js`)
* A *master shot* is carved once into plates: `PRINT.defineShot('A', { layers: ['sky','land'], worn: true, build(P) { … } })`.
  Inside `build`, `P(layer, plateId)` returns a context in logical 1920×1080 coordinates for that plate. Draw each ink
  into its plate: `K` = every sumi outline, lattice, hatching, silhouettes; `P1` 黄土/煤竹 wood-thatch-earth; `P2` warm
  small blocks (紅 萩 山吹 朱: andon light, flowers, obi-age, fire); `P3` 松葉 尾花 greens & susuki; `P4` 鼠 銀鼠 藍鼠
  greys, stone, clouds, cast shadows; `P5` 藍 water, haori; `P6` sky (ベロ藍 紺 桔梗, bokashi); `P6i` the ichimonji
  band; `P7` 胡粉 月白 highlights, lit paper, kasumi; `P8` kira mica (composited 'lighter'); `D` 鴇 dawn (結 only).
  Name a plate `'P6~worn'` to supply its own 後摺 variant (e.g. the flat sky: flat ベロ藍, no bokashi, no ichimonji);
  otherwise `worn: true` carves one automatically (speckle; K gets gaps and cracks). Plates are trimmed to their ink,
  cached at the stage resolution, and built during loading (`PRINT.buildAll`), so build cost doesn't matter — do the
  expensive, beautiful vector work (thatch hatching, 150 plumes, lattice) there.
* Print it each frame with `PRINT.drawShot(ctx, 'A', T, { between: { sky: (ctx, st) => { /* moon */ } } })` or layer by
  layer with `PRINT.drawLayer(ctx, 'A', 'land', T, opts)` (opts: `alpha: {P2: 0.5}`, `only`, `skip`, `wear`).
  **Use the global film time `T = S.seg.start + t`, never the local t**, for everything PRINT/MOON.
* Anything that moves is drawn live but still "printed from a plate": `PRINT.with(ctx, 'P3', T, (c) => B.susuki(c, …))`,
  `PRINT.with(ctx, 'K', T, …)` for its outlines. This applies the plate's registration offset and alpha, so live
  susuki and figures tremble with the tears, jolt at 160 and fade in the unprinting in the right order.
* `PRINT.state(T)` → `{ off: {id:[dx,dy]}, alpha: {id:a}, wear 0..1, keyReveal, ichimonji, phase }` if you need it.
* `PRINT.age(ctx, T, { holes: [[x,y,r]] })` yellows and foxes the paper for the 後摺 (amount = wear); pass the moon
  as a hole — the moon is never old.
* Don't fill the whole frame with your own background colour before printing: the ground is the bare washi (生成).
  Unprinted paper *is* the image in 序 and 結.

**`TSUKI.MOON`** (`js/core/moon.js`)
* `MOON.phi(T)` is the single celestial arc. Per-shot projections: `MOON.A(T)` → `{x,y,r}`; `MOON.B(T)` →
  `{glowX, glowY, glowR, x, y, r, window}` (disc visible only through the round window); `MOON.D()`; `MOON.E(T)`.
  Shots C / A′ are art-directed (see `moon_clock.mappings`).
* `MOON.draw(ctx, x, y, r, T, { halo, maria, glaze, kira, fringe, alpha })` paints the moon as bare paper (a hole to
  the washi) with the hour's glaze, the 7-second kira sweep, misregistration fringes during the tears, and — from
  T 106 — the rabbit maria (`MOON.maria`). Never ink the moon any other way. Nothing touches the moon except Fuji's
  smoke at T 214.

## Toolkit reference

`TSUKI.U` — `clamp lerp invLerp remap smoothstep fract deg seg(t,a,b,ease) env(t,a,b,c,d,ease)`; eases `U.ease.{linear,inSine,outSine,inOutSine,inQuad,outQuad,inOutQuad,inCubic,outCubic,inOutCubic,outExpo,inExpo,outBack}`; randomness `hash(n) hash2 hash3 rng(seed)→fn (+ .range .int .pick .sign)`; noise `noise1(x,seed) noise2(x,y,seed) fbm2(x,y,oct,seed) wobble(x,seed)∈[-1,1]`; colour `rgba(hex,a) mix(h1,h2,t) shade(hex,k) hexToRgb`; geometry `qbez cbez dist`.

`TSUKI.B` — `canvas(w,h) sprite(key,w,h,draw)`; shapes `poly(ctx,pts,close) smoothPath(ctx,pts,close,tension) glow(ctx,x,y,r,color,alpha) taper(ctx,pts,w0,w1,color,belly) qpts(x0,y0,cx,cy,x1,y1,steps) leaf(ctx,x,y,len,w,angle,color,outline)`; sky `sky(ctx,stops) ichimonji(ctx,color,solid,fade,alpha) horizonGlow(ctx,y,h,color,alpha)`; mist `kasumi(ctx,x,y,w,h,color,alpha,{soft,fade,seed}) band(ctx,x,y,w,h,color,alpha,fade) kasumiBank(ctx,x,y,w,rowH,rows,color,alpha,seed,drift)`; moon `moon(ctx,x,y,r,{color,rim,halo,haloColor,haloR,maria,mica:t,outline,alpha}) moonReflection(ctx,x,y0,y1,width,t,color,alpha,seed)`; `cloud(ctx,x,y,w,h,{fill,alpha,outline,lobes,seed,shade,lineWidth})`; grass `susuki(ctx,x,y,h,{t,seed,wind,lean,blades,plumes,blade,plume,alpha}) susukiField(ctx,x0,x1,y,h,n,opts)`; water `ripples(ctx,x,y,w,h,t,color,alpha,seed,density) seigaiha(ctx,x,y,w,h,r,fg,bg,lineW)`; land `ridge(ctx,x0,x1,y,amp,color,{seed,freq,bottom,alpha,solid,fadeTo,outline,peaks(x)}) fuji(ctx,cx,baseY,w,h,{color,snow,top,bottom,baseAlpha,capH,outline,seed,snowAlpha})`; creatures `goose(ctx,x,y,scale,phase,color,dir,alpha)`; `pattern(ctx,name,fg,bg,size)`; `seal(ctx,x,y,size,text,color,alpha)`; particles `drift(i,t,{seed,area:[x,y,w,h],vx,vy,sway,period,spin}) → {x,y,rot,life,k,lap}`.

`TSUKI.C` — inks: gofun kinari torinoko geppaku tsukiKi · sumi keshizumi nezumi rikyu ginnezu · tetsukon koiai kon bero ai gunjo hanada asagi kamenozoki · beni akane shu enji toki · yamabuki kin odo kitsune kuchiba susuki · wakatake aotake matsuba koke rokusho · kikyo hagi fuji murasaki.

If you need a new general-purpose primitive, write it inside your own scene file (as a local function). Do not edit files under `js/core/`; describe the addition in your final report instead.

## Checking your work

```
node tools/shoot.js --seg <id> --n 6 --sheet --out shots/<id>      # 6 frames + contact sheet
node tools/shoot.js --seg <id> --at 0,2.5,11 --out shots/<id>      # exact local times
node tools/shoot.js --seg <id> --n 4 --w 1920 --out shots/<id>     # full-res detail check
```

Open the PNGs (the Read tool displays images) and look hard: Is it beautiful as a still print? Does it read as ukiyo-e? Is the hero image there? Is the text space clear? Any seams, popping, clipped shapes, muddy colours? The command also prints scene errors and console errors: there must be none.
