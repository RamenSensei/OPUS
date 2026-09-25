# Cast API (TSUKI.CAST) — quick reference

Full documentation lives in the header of `js/core/cast.js`. Model sheets: `node tools/cast-shoot.js --sheets` → `shots/cast/`.

`CAST.<name>(ctx, x, y, scale, opts)` — (x, y) is the ground contact (kaguya 'rise' / tennyo 'fly' = waist; fox 'eyes' =
midpoint of the glints; hands = anchors below). Scale 1 ≈ a 300 px standing adult; たけ kneeling ≈ 150 px (film 52 px ≈
0.35); 小夜 standing ≈ 155 px (62 px ≈ 0.4). Animals true size (rabbit 55, fox 85, monkey 75 px at scale 1). Pure
function of the args (time only via `opts.t`); ctx always restored; returns named points in caller space.

Common opts: `pose, facing (±1), t, wind (0.25), alpha (offscreen group composite), buffer: true (use for special
composite modes, e.g. multiply shadows), silhouette (colour | true = 墨), outline (0.85), ink (key-line colour),
style: 'sumi-line', palette`. `CAST.palettes` = {kaguya, grandma, oldSayo, grandmaDrained, sayo}; `CAST.AINEZU` = 藍鼠.

- **grandma** たけ — poses seiza · engawa · stack · pour · lift-haori · lap · hold-puppet · walk; `view:'back'` (seiza,
  engawa) with `look`, `nod`; `haori:false`; `lift` 0..1; `arms:'both'`; `stick` (70); `dango`, `stream`, `child` (lap);
  `drained:true` (月白/胡粉/銀鼠 — pair with `ink: C.ginnezu`; haori + 小夜's obi-age stay saturated). Returns hand,
  hands, dango, spout, stick, stick2, cloth, child. **oldSayo** = identical paths/poses, white bun.
- **child** 小夜 — stand · carry-susuki · run · kneel-back · reach · sleep · steal · sit · reach-up; `sheaf` (300),
  `look`, `reach`, `dango`, `haori` (sleep), `boy`, `cry`.
- **hands** — fox-window (anchor = diamond centre; returns center, w, h, corners) · cupped (bowl centre; center, rx, ry,
  drips, tips) · grab (between wrists) · ladle (old wrist; cup, r, rx, ry, lip). `age` 0..1 (default 1; cupped/grab 0),
  `interlace`, `tremble` (±2 px @ 9 Hz), `sleeve`, `patternUnit` (76), `water`, `curl`, `close`, `tilt`, `angle`, `len`.
  `CAST.foxWindowRect(x, y, scale, opts)` → { cx, cy, w, h, corners, path(ctx) } for clipping the inside.
- **fox** — sit · walk · steal · eyes; `color` 'white' | 'gold'; `carry:'fish'|'dango'`; `lookBack` 0..1; steal `reach`
  (returns mouth, paw); eyes `blink`, `glow`, `sep`.
- **Shadow puppets** — `CAST.puppet(name, ctx, x, y, scale, opts)` → { path, rule, sticks, ends, bbox, points };
  `CAST.drawPuppet(...)` with `color` (藍鼠), `mode` 'shadow' | 'cut' (destination-out) | 'light', `alpha`, `penumbra` px,
  `sticks`, `stickAngle`, `stickLen`. Puppets: `okina` (walk/cut, `phase`, `swing`), `bamboo` (`shine` → `.node`,
  `split`), `kaguya` (negative puppet; `grow` 0..1 child → woman; `raise`; `card:'oval'`), `kaguya-engawa`, `palanquin`,
  `cloud` (瑞雲 with 7 tennyo; `ribbon`), `moon`, `climber` (たけ's shadow: `youth` 0..1, `climb` rungs (115 px/rung),
  `climbMix`, `hair` 20→260, `look`).
- **Jataka** — `beggar` shuffle · sit · rise (`rise` 0..1); `monkey` sit (`fruit`, `offer`) · walk · sticks; `rabbit`
  sit (`droop`) · gaze · leap (`phase`) · pound; the fox with fish = `fox` walk `carry:'fish'`. Use `silhouette` or
  `style:'sumi-line'` on the moon's face.
- Legacy: kaguya (紫苑の匂 kasane), tennyo, rabbit, okina, ouna, elder, mikado, guard/samurai, deer.

Performance (scale 1): grandma/oldSayo 0.6–0.9 ms; child ≤ 0.6 (carry-susuki 1.7 at scale 1, ~0.9 at film size); fox
≤ 0.2; puppets 0.15–1.5 (2.6 with penumbra+alpha); close-up hands 1.5–3.4 ms (one per frame).
