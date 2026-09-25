# Sound engine API (TSUKI.AUDIO) — composer's reference

All synthesis, no samples. The score lives in `js/score.js` as
`TSUKI.SCORE = { gain?, master?, room?, events: [...], beds: [...] }`, re-read at every play/seek.

- `master: [[t, gain], ...]` — a film-time gain curve (linear between points) applied **after** the whole master
  chain (reverb, compressor, soft clip). `0` is digital silence, tails included (148.0–152.0, 234.2–236.0).
  Scheduled from the playhead on every play/seek, and in `renderOffline`.
- `room: [[t, gain], ...]` — the same kind of curve on the shared reverb's return (per session). `0` = dry air
  (99.0–100.2: only the bowl, the air itself holds its breath).

`js/score.js` also exports **`TSUKI.CUES`** — every time the picture must share with the sound, defined once
(absolute film seconds). Scenes read these instead of re-typing numbers; see the table at the end.

## Events (common params)
`t` (film seconds), `inst`, `note` (`'Eb4'`, `'E♭4'`, `'F#3'`, midi number incl. fractions, array, or `'D4+A4'`),
`vel` 0–1, `pan` −1..1, `rev` reverb send 0–1 (per-instrument default), `dist` 0–1 (distance: quieter, duller, wetter),
`lp` Hz, `seed`, `resume: true` (re-enter mid-note on seek — use on long sho/bonsho/rin/held koto).

## Instruments
- **koto** — 13-string pluck, rings 2–5 s by register, sweet spot D3–D6. `dur` (hand-damp at t+dur); chords with `strum`
  (45 ms default, negative = high→low); oshi-iro `press` (0.5–2 semitones) `pressAt` 0.18 `pressTime` 0.12 `pressHold`;
  `slide` (± semis; negative = hiki-iro) `slideAt` `slideTime`; yuri-iro `vib` (cents 15–40) `vibRate` `vibAt`;
  tremolo `trem: true` + `dur` 1.6 `tremRate` 11/s `tremShape` swell|fade|grow|even `damp`; `detune` cents.
- **biwa** — same params + sawari buzz, `strike` 0–1 (bachi slap, 0.5), strum 28 ms. Best D2–D4. Sparse dramatic chords
  `['D2','A2','D3','G3']`.
- **shakuhachi** — `dur` 2.5, `attack` (vel-scaled), `release` 0.4; `bendFrom` semis (−0.3 default; −1/−2 meri approach)
  `bendTime`; `bends: [[dt, semis]]`; `fall` (e.g. −1 otoshi); `yuri: true` (slow deep undulation) else late vibrato
  `vib` 14 cents `vibRate` `vibDelay`; `muraiki` 0–1 breath burst (0.3); `tone` 0–1; `swell` 0–0.5. Range D4–D6,
  vel 0.4–0.65 (lonely).
- **bonsho** — `note` G2 (D2–D3 big bell), `decay` 16 (10–20), `bright`, `beat` (うなり). Use `resume: true`.
- **bonsho** `partials: 'dawn'` — the sound bible's dawn bell: ratios 0.5 1 1.18 1.5 2.0 2.74 3.76 over the hum,
  only the hum pair split 0.7 Hz (唸り). With `note: 'D4'` the hum is D3 (146.8 Hz) and the 2.0 partial is D5.
  Or pass your own `[[ratio, amp, decayScale, splitHz], ...]` (split 0 = one oscillator).
- **rin** — `note` A5 (E5–D6), `decay` 9, `beat`. Also the small 鏧 bowl of the leap (`note: 'C#6'` ≈ 1.1 kHz, `decay: 6`).
- **suzu** — `shakes` 1, `rate` 3.2/s, `spread` 0.14 s, `count` 14, `note` (≈3.3 kHz base), `bright`.
- **taiko** — distant ōdaiko (dist 0.3 default), `note` A1, `decay` 1.1, `rim: true` (fuchi "ka"). Very sparingly.
- **kotsuzumi** — `stroke` 'pon'|'ta'|'chi'|'pu', `note` re-pitches.
- **sho** — `aitake` preset (kotsu, ichi, ku, otsu, ju, bo, or interval array) + `root` (A4), or explicit `note: [...]`;
  `dur` 8, `swell` 3, `release` 3, `bright`, `width` 0–1, `breath`. Built-in slow breath-turn dips.
  `levels: [[dt, 0–1], ...]` replaces the swell with an explicit dynamic curve (the reeds' brightness follows it):
  the film's 110.0–147.8 shō is one event, pp → f, cut by `release: 0.05` at the CLICK. Heaven = `aitake: 'ichi', root: 'A4'`
  (A4 B4 E5 F♯5 A5 B5).
- **hyoshigi** — `count` + `gap`, or `kizami: true|n` with `kizamiDur` 4 (accelerating clacks + final strike); `pitch`.
- **koto** `harm: true` — a touched-node harmonic (nearly pure, glassy, rings 2.4–5 s); `note` is the sounding pitch.
  `worn: true` — the 後摺 koto: duller strings, t60 ≈ 0.43× (A4 ≈ 1.5 s), a slow false beat. Both work with every
  koto param (press, slide, vib, dur…).
- **shakuhachi** `air: true` — breath only, no tone: the band-passed breath follows `bendFrom`/`bends`/`fall` (a sob).
  (The breath band now follows the pitch bends for every shakuhachi note.)

### Film one-shots (rendered in JS, deterministic, cached; resumable from an offset)
| inst | what | params (default) | notes |
|---|---|---|---|
| **sozu** | 鹿威し KON: 200 Hz thump (pitch settling) + hollow tube modes + bamboo-on-stone click | `dry` (false): 305 Hz, short, a split-tube rattle | default `rev` 0.72 (big room). vel 0.85 ≈ −20 dBFS loudest s |
| **kento** | the registration CLICK: 1.2 kHz tick (12 ms) + 180 Hz thunk | `take` (0) | always the same sound; 序 vel ≈0.6 pan 0.35, 147.8 vel 1 `rev` 0.03 |
| **baren** | the rub: brown noise band-passed 300–1200 Hz, gain = spiral speed × circular pressure | `dur` 4, `stroke` 0.7 | stereo, the pad circling; vel 0.24 ≈ −35 dBFS |
| **geese** | distant honks: two-formant FM (carriers at the harmonics nearest 1.05 / 2.35 kHz), ping-pong valley echo | `birds` 2, `honks` 2, `gap` 0.36, `f` 370 Hz, `echo` 0.35, `spread` 0.2 | default `dist` 0.45 |
| **swish** | paper and grass | `kind` brush·rustle·crack·peel·press·grass·hiss·cloth, `dur` (0.08·0.45·0.5·1.3·0.22·0.8·1.6·0.7), `bright` 0.5 | brush = band-passed noise 1.5–4 kHz, 80 ms |
| **plink** | a drop: sine gliding `f0`→`f1` | `f0` 1800, `f1` 1200, `glide` 0.08, `hollow` 0–1 (dry bamboo body), `splash` 0–1 | the dew into the dry sōzu = `hollow: 1` |
| **splash** | water | `kind` hand (40 ms burst + plop + droplets) · gush (the sōzu spilling, 0.3 s), `dur`, `drops` | |
| **pestle** | ぺったん: 90 Hz thud (0.15 s) + wet slap | – | double it with koto D2 |
| **puff** | a breath (the andon blown out) | `dur` 0.3, `gutter` 0.7 (the flame fluttering) | |
| **pour** | tea: the cup filling (resonance `f0`→`f1`) + a ceramic tick | `dur` 1.2, `f0` 650, `f1` 1500, `tickAt` (dur+0.3; <0 = none) | |
| **mushi** | one insect, one call | `kind` suzu (rīn: `f` 4400, `dur` 1.2, `pulses` 1, `am` 35 Hz) · matsu (chin-chirorin, `f` 3300) | the same voice as the insects bed |
| **glass** | heaven's high sines, sustained (resumable) · or mica sparkle | `note` [A6 B6 E7], `swell` 1.5, `dur` 3, `release` 2 · `grains` n, `lo` 2000, `hi` 5000, `spread` 1.5 | glinting AM per note |

Cold build cost (48 kHz, first call): baren ≈ 70 ms, geese ≈ 35 ms, the rest < 35 ms; all are prewarmed in idle
slices after `init()` (soonest first), so playback normally never builds one.

## Beds
Common: `from`, `to`, `level` 0–1 (0.5), `fadeIn` 2, `fadeOut` 3, `pan`, `rev`, `dist`, `seed`,
`automation: [[T, level], ...]` (absolute film times, linear from `level` at `from`). Seeded from `from` → seek-exact.
`muffle` (Hz) — a paper wall: first-order 6 dB/oct low-pass (二 and 五: 1.5 kHz). `lp` (Hz) — a biquad low-pass.

Two beds with the same `inst`, `from`, `seed` and detail params produce **the same calls at the same times** — the
score uses this for "twins": the same insects heard through the shoji (gated by `automation`), and, shifted by
+150 s, the first night's soundscape replayed inside the fox window (182–190).

| bed | params (default) | typical level |
|---|---|---|
| insects | `density` 0.6, `suzumushi` 1, `matsumushi` 0.7, `field` 0.6 | 0.3–0.6 |
| insects (one voice) | `nSuzu`/`nMatsu` exact counts, `fSuzu`/`fMatsu` Hz, `vamp` 0.5–1, `activity` (rhythm, default density), `first` (s after `from` of the first call), `field: 0` | 0.2 ≈ −40 dBFS |
| wind | `brightness` 0.4, `gust` 0.5, `rate` 1, `lo` 450 / `hi` 1500 (the swept band), `q` 2.5, `rumble` 1, `air` 1, `gusts: [t | [t, amt]]`, `gustAmt` 0.6, `gustRise` 1, `gustFall` 3 | 0.1–0.3 |
| trickle | `flow` 0.6, `f` 1500, `q` 4, `fill: [[t, Hz], ...]` (the tube filling), `bubbles` 0.5 /s·4 | 0.25–0.3 |
| water | `lap` 0.7, `drips` 6/min, `koi` 0.6/min | 0.3–0.5 |
| drone | `notes` ['D2','A2'], `beat` 0.12 Hz, `bright` 0.25 | 0.3–0.6 |
| fire | `crackle` 0.6, `roar` 0.4 | 0.3–0.6 |
| night | `air` 0.5 (room tone) | 0.3–0.6 |

## Helpers
- `TSUKI.AUDIO.phrase(t0, 'D4 Eb4 . A4^1 Bb4~ D5! D4+A4', gapsOrSeconds, inst, opts)` → events. `.` rest, `+` chord,
  `^n` press, `~` yuri, `!` accent. `vel/dur/pan/rev/dist/strum/detune/press` may be arrays cycled per token (rests
  count). `human` (seeded jitter), `legato` (dur = gap × legato), `each(ev, i)`.
- `scale(name, root)` → `{deg(i), degs('0 1 2 -1'), name(i), range(lo,hi), contains, snap}`. `SCALES`: miyako/in
  (D E♭ G A B♭), ritsu (D E G A B), yo (D E G A C), minyo (D F G A C), ryukyu, hirajoshi (D E F A B♭), kumoi.
  `hirajoshi(root)` → 13 koto strings.
- `note() notes() freq() mtof() name()`, `shift(events, dt)`, `beats(bpm)(n)`.
- `gustEnv(dt, rise = 1, fall = 3)` — one gust's shape (0 → peak at `rise` → ≈10 % after `fall`), shared by the wind
  bed and `TSUKI.CUES.gustAt(t)`; `masterAt(pts, t)` — a master/room curve's value at t.
- Dev: `audition(inst, params)`, `debug = true`, `_state()`; `renderOffline(T0, T1, sr = 48000, scoreOverride?)`.
- Test harness: `node tools/audio-test.js [--only full,inst,cover,rt,page]` → shots/audio-*.wav + level stats.
- Film score: `node tools/score-test.js [--only cues,render,bowl,rt] [--json]` → shots/score-full.wav (0–236 s, 48 kHz)
  + per-segment RMS / peak / centroid / >6 kHz and <150 Hz shares, the written silences, NaN / clipping / clicks,
  the leap gap re-rendered without its bowl, and a live run of index.html with sound (seeks into sustained sounds,
  across the absolute silence, scrub, pause/play). `_state().master` shows the live master value.

## Mixing guidance (measured)
Loudest-second RMS at demo velocities: koto −22.7 dBFS, shakuhachi −20, biwa −22, sho −22, bonsho −23, taiko −23,
kotsuzumi −25, hyoshigi −26, rin −31, suzu −31; beds at level 1 ≈ −22…−26 (night −31). Master: unity below ≈ −18 dBFS,
gentle compression above, soft-clip ceiling −1.1 dBFS. Aim for loud passages ≈ −18 dBFS RMS, quiet ones −30…−36.

## The film's measured levels (tools/score-test.js)
Per segment, integrated RMS: 序 −34.5 · 一 −28.2 · 二 −28.7 · 三 −32.5 · 四 −30.4 · 五 −25.6 · 六 −29 · 七 −34.6 · 結 −26 dBFS.
Loudest seconds ≈ −20 dBFS (140 the culmination, 40 the first KON, 215–218 the missing D under the first bell);
quiet passages −33…−45; 0–2 s paper room −51.5; 148–152 and 234.2–236 digital silence; peak −7.2 dBFS; 0 clipped.

## TSUKI.CUES — the shared clock (absolute film seconds)
| key | times | what the picture does there |
|---|---|---|
| `barenStrokes` / `baren` | 2.0 2.7 … 5.5 / {2.0–6.0, stroke 0.7} | the baren circles once per 0.7 s while the key block spirals out |
| `kento` | 6.0 6.6 7.2 7.8 8.4 9.0 9.6 10.2 | colour plate i touches register (the click sounds as it touches) |
| `click` | 147.8 | every plate snaps to (0,0) within 60 ms |
| `dango` | 22.4 … 26.0 (×9 @0.45) · 26.8 … 28.15 (×4) · 28.95 29.4 | one dango appears per koto pluck |
| `dangoLate` / `dangoLateSilent` | 161.2 … 165.2 (×9 @0.5) · 165.95 … 167.45 · 168.2 168.7 / 162.2 164.2 165.95 167.45 | same, the four silent ones still appear |
| `sozuTip` / `sozu` | 39.8 159.8 232.3 / 40.0 160.0 232.5 | the tube tips and spills / strikes the stone (KON = the cut) |
| `sozuDry` · `dew` | 181.0 · 201.5 | the dry tube knocks once (off-screen, in the 月に雁 crop) · a dew drop falls into it |
| `gusts`, `gustAt(t)` | 13.0 19.5 27.0 35.0 114.2 163.8 177.4 193.2 199.6 204.2 | each gust starts at t, peaks at t+1.0, dies ≈3 s; `gustAt` is the extra sway (0 between gusts). 190–206 is heard far off only (the incense stays straight) |
| `biwa` · `kaguraSuzu` · `puppetRustle` | 41 43 46 48 50.5 52.5 54.5 57 · 46 48 · 40.7 42.7 49.8 54.2 59.8 | shadow beats · the culm shines / the girl of light · たけ's hands move a puppet |
| `splash` · `spoutDrops` · `palmBeads` | 67.9 · 72.0 74.3 76.6 78.9 81.2 · 75.4 + k·6.8/14 (k 0…14, last 82.2) | the moon shatters · a drop lands (the spout then holds a bead through the 間 82.2–86.0) · a bead falls from her fingers |
| `insectsStop` · `bowl` · `insectReturns` | [99.0, 100.2] · 99.0 · 100.2 100.6 101.1 101.9 103.0 | the disc flashes; everything stops · the bowl · insects return one by one |
| `pestle` · `pestleFade` | 106.4 108.0 … 117.6 (every 1.6) · [108, 112] | the pestle strikes (the sound fades to nothing over 108–112; the picture keeps pounding) |
| `heartbeat` | 136 … 146 (lub; dub +0.3) | – (no beat at 147.0: the look back) |
| `celestialSuzu` | 132.0 133.4 134.9 136.4 137.9 139.2 | the cloud of celestials descends |
| `forget` | passes 140.0 141.9 143.8 145.6 · ache 147.0 · click 147.8 | – |
| `silence` · `quiet` | [148.0, 152.0] · [0,2] [99,100.2] [148,152] [234.2,236] | absolute silence under the cloud |
| `firstInsect` · `insectsAgain` · `lastInsect` | 12.0 · 156.6 158.2 · 233.0 | the first / returning / last suzumushi |
| `harmonic` · `theft` · `andon` | 33.6 197.5 · 33.0 183.0 195.2 · 37.0 187.0 | turning to the moon, pretending not to see · the dango stolen · the andon blown out |
| `tea` · `teaTick` · `strip` | 169.0 169.62 · 170.34 · 171.0 | two pours · the pot set down · the faded strip |
| `geese` · `foxWindow` | 174.5 176.0 178.4 · 87.2 182.0 | honks · the fox-window glass enters |
| `letterStrokes` · `haikuStrokes` | 32 times from 122.5 · 14 from 226.8 | computed from TSUKI.SCRIPT with the text engine's reveal formula |
| `enWhole` · `enOffered` · `missingD` | 16.5 17.2 17.9 18.8 19.9 · 210.5 211.2 211.9 212.8 · 214.0 | the 縁 motif · offered at dawn · the smoke touches the moon |
| `bells` · `peels` · `seal` | 215 220 225 · 222.0 223.5 225.0 226.5 · 230.0 | 捨て鐘 · plate groups lift · the seal 忘れじ is pressed |
