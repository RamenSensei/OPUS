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
  `drained:true` (月白/胡粉/銀鼠 — pair with `ink: C.ginnezu`; haori + 小夜's obi-age stay saturated). In 'pour' both 袂
  hang from the held-out forearms under their own weight (round foot r ≈ 12, one fold from the elbow; no shelf). Returns hand,
  hands, dango, spout, stick, stick2, cloth, child. **oldSayo** = identical paths/poses, white bun.
- **child** 小夜 — stand · carry-susuki · run · kneel-back · reach · sleep · steal · sit · reach-up; `sheaf` (300),
  `look`, `reach`, `dango`, `haori` (sleep), `boy`, `cry`.
- **hands** — fox-window (anchor = diamond centre; returns center, w, h, corners) · cupped (bowl centre; center, rx, ry,
  drips, tips) · grab (between wrists) · ladle (old wrist; cup, r, rx, ry, lip). `age` 0..1 (default 1; cupped/grab 0),
  `interlace`, `tremble` (±2 px @ 9 Hz), `sleeve`, `patternUnit` (76), `water`, `curl`, `close`, `tilt`, `angle`, `len`,
  `dip`, `wet`.
  `CAST.foxWindowRect(x, y, scale, opts)` → { cx, cy, w, h, corners, path(ctx) } for clipping the inside (unchanged).
  - Key line (all poses): carved, ≈1.4 px on the lit side (stage upper-left, rotation-aware) → ≈3 px on the shadow
    side; flat skin (no registration offset); inside a hand only 1–2 carved nicks per joint and one or two palm lines.
  - **fox-window is the real 狐の窓**: each hand a fox head (middle + ring curled to the thumb, index + little finger
    raised as ears); the left fox turned over (palm view, thumb on top), the right seen from the back (thumb tucked
    behind the palm). The ears cross — left index × right little finger at the top (right over), left little finger ×
    right index at the foot (left over, redrawn in a square clip: seamless weave). Their inner edges ARE the diamond
    between the crossings; the curled knuckles round off its side corners (~45 px in), so a clip larger than the
    opening is always covered by the hands.
  - **Drawn as ukiyo-e hands (hands round, 2026-09)**: one carved contour round forearm + palm + ears + the curled
    pair; few lines inside. Ears: three phalanges kinked 3–5° toward the window at PIP/DIP (never outward — the
    window's corners sit a few px inside the diamond), tapering to 0.65 × base width, a small knuckle swell on the back
    edge, a long rounded tip turning out past the crossing. Bases close to the corner (index 28, little 58 px along the
    edges): long fingers, a narrow palm (≈ 4 finger-widths), a slender wrist, the forearm widening into the cuff.
    Middle + ring: ONE curled mass (double lobe of PIP knuckles, one crease); palm view its tips go under the thumb's
    pad. Thumb: palm view it grows out of the thenar with no seam (its lower edge sweeps on round the thenar to the
    wrist), one joint crease; back view it is behind the palm — only the thenar swell and one crease (no tab). Small
    flesh fillets at the webs.
  - Unchanged API and anchors: the diamond (FW 150 × 115), `CAST.foxWindowRect`, the forearm's end at (∓333, 47)–
    (∓267, 93) (scale-1 local) inside 六's cuff lining (FWG A…G) and under 三's forearm ribbons (ARMS start ∓284, 60).
    Scenes that split the pose at x = 0 for the tremble (六) cut through the two finger crossings — prefer drawing
    each hand with CAST's own `tremble` (it moves each hand whole).
- **grab**: fingers fanned wide and long, thumb well apart (`close` 0); `close` 1 gathers the long fingers and
    plunges them (a clutch at the water, never a fist). `dip` (default 0.34 + 0.26·close; `wet: false` → dry): beyond
    the waterline each digit sinks into `palette.water`'s ink toward the tip, with a dark wet band where it enters.
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
- **kaguya / kaguya-engawa puppets** (hands round): one great hanging 袖 from the shoulder to mid-thigh, bellying
  forward with a rounded foot clear of the robe, a dark 袖口 slit of card in its mouth, two fine 重ね lines of card
  following its front round the foot; the robe flares to the toe with three 重ね lines along the front hem.
- **kaguya / kaguya-engawa puppets** (figure round): her 垂髪 is now CARD (the darkest value), cut round with a fine
  line of light, parted by two lines of light into three strands that sweep dark over the train's light; a pale
  profile face with a slit of card for the eye. Hair + eye are also a second, lacquered layer of card: `.layer2`
  (Path2D, nonzero), merged into `.sticks` unless `layer2InSticks: false` (bare sticks: `.stickPath`). Fill
  `path` then `sticks` with 'multiply' (as 三's SB.sharpFill does) and the hair prints near-sumi; `drawPuppet` does it.
  Note for 三: its own `engawaCard` (56.4–) still cuts her hair as LIGHT — switch it to `CAST.puppet('kaguya-engawa')`
  (same figure, same hair) or cut the hair as card, so the dissolve at 56.4–57.0 does not flip her hair from dark to pale.
- Legacy: kaguya (紫苑の匂 kasane), tennyo, rabbit, okina, ouna, elder, mikado, guard/samurai, deer.

Performance (scale 1): grandma/oldSayo 0.6–0.9 ms; child ≤ 0.6 (carry-susuki 1.7 at scale 1, ~0.9 at film size); fox
≤ 0.2; puppets 0.15–1.5 (2.6 with penumbra+alpha); close-up hands 1.5–3.4 ms (one per frame).
