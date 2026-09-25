# Sound engine API (TSUKI.AUDIO) — composer's reference

All synthesis, no samples. The score lives in `js/score.js` as `TSUKI.SCORE = { gain?, events: [...], beds: [...] }`,
re-read at every play/seek.

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
- **rin** — `note` A5 (E5–D6), `decay` 9, `beat`.
- **suzu** — `shakes` 1, `rate` 3.2/s, `spread` 0.14 s, `count` 14, `note` (≈3.3 kHz base), `bright`.
- **taiko** — distant ōdaiko (dist 0.3 default), `note` A1, `decay` 1.1, `rim: true` (fuchi "ka"). Very sparingly.
- **kotsuzumi** — `stroke` 'pon'|'ta'|'chi'|'pu', `note` re-pitches.
- **sho** — `aitake` preset (kotsu, ichi, ku, otsu, ju, bo, or interval array) + `root` (A4), or explicit `note: [...]`;
  `dur` 8, `swell` 3, `release` 3, `bright`, `width` 0–1, `breath`. Built-in slow breath-turn dips.
- **hyoshigi** — `count` + `gap`, or `kizami: true|n` with `kizamiDur` 4 (accelerating clacks + final strike); `pitch`.

## Beds
Common: `from`, `to`, `level` 0–1 (0.5), `fadeIn` 2, `fadeOut` 3, `pan`, `rev`, `dist`, `seed`,
`automation: [[T, level], ...]` (absolute film times, linear from `level` at `from`). Seeded from `from` → seek-exact.

| bed | params (default) | typical level |
|---|---|---|
| insects | `density` 0.6, `suzumushi` 1, `matsumushi` 0.7, `field` 0.6 | 0.3–0.6 |
| wind | `brightness` 0.4, `gust` 0.5, `rate` 1 | 0.2–0.5 |
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
- Dev: `audition(inst, params)`, `debug = true`, `_state()`; `renderOffline(T0, T1, sr = 48000, scoreOverride?)`.
- Test harness: `node tools/audio-test.js [--only full,inst,cover,rt,page]` → shots/audio-*.wav + level stats.

## Mixing guidance (measured)
Loudest-second RMS at demo velocities: koto −22.7 dBFS, shakuhachi −20, biwa −22, sho −22, bonsho −23, taiko −23,
kotsuzumi −25, hyoshigi −26, rin −31, suzu −31; beds at level 1 ≈ −22…−26 (night −31). Master: unity below ≈ −18 dBFS,
gentle compression above, soft-clip ceiling −1.1 dBFS. Aim for loud passages ≈ −18 dBFS RMS, quiet ones −30…−36.
