/* ==========================================================================
   score.js — the music and sound of 『月の出でたらむ夜は　〜十五夜摺〜』.

   TSUKI.CUES  — every time the picture must share with the sound, defined ONCE
                 here (absolute film seconds). Scenes read these arrays instead
                 of re-typing numbers, so a plate lands exactly on its click.
   TSUKI.SCORE — { master, events, beds } for TSUKI.AUDIO (see design/AUDIO_API.md).

   Grammar (design/screenplay.json · sound_bible):
     scale    都節 on D: D E♭ G A B♭ — koto in 平調子 on D.
     縁       A4 B♭4 D5 E♭5 D5: whole ONCE (16.5–19.9); forgotten in four passes
              (140–147.8) and broken by the CLICK where D5 should fall; offered
              again at dawn (210.5) and completed by the shakuhachi (214.0) under
              the first bell, whose hum is tuned to D.
     earth    insects are mortal life — one bed per insect, so they enter and
              leave one at a time; the first voice (12.0) is also the last (233.0).
     heaven   shō 合竹 A4 B4 E5 F♯5 A5 B5 (no semitones), kagura-suzu, glass A6 B6 E7.
     marks    sōzu KON 40 · 160 · 232.5 · kentō CLICK taught ×8 in 序, once at 147.8 ·
              梵鐘 withheld until dawn: 215 · 220 · 225.
     silence  0–2 paper · 99.0–100.2 only the bowl · 148.0–152.0 ABSOLUTE (master 0) ·
              234.2–236 end.
   間: most of this film is air. Levels aim at night air, never at a synth demo.
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const A = TSUKI.AUDIO;
  const r3 = (x) => Math.round(x * 1000) / 1000;

  /** Groups of evenly spaced beats with a longer breath between groups. */
  function groups(t0, sizes, step, breath) {
    const out = [];
    let t = t0;
    sizes.forEach((n, g) => {
      for (let i = 0; i < n; i++) { out.push(r3(t)); t += i < n - 1 ? step : 0; }
      if (g < sizes.length - 1) t += breath;
    });
    return out;
  }
  const every = (t0, step, until) => { const o = []; for (let t = t0; t < until - 1e-6; t += step) o.push(r3(t)); return o; };

  /* ====================================================================== */
  /* 1. THE SHARED CLOCK — times the picture must match (absolute seconds)   */
  /* ====================================================================== */
  const CUES = {
    // 序: the baren's circular strokes (0.7 s) while the key block spirals out 2.0–6.0
    baren: { from: 2.0, to: 6.0, stroke: 0.7 },
    barenStrokes: every(2.0, 0.7, 6.0),
    // 序: eight colour plates land in register, one kentō click each (6.0 + 0.6 i)
    kento: every(6.0, 0.6, 10.21),
    // 五: the same click, once — perfect register, the sound of forgetting
    click: [147.8],
    // 一: fifteen dango, one per koto pluck: nine at 0.45 s, a breath, four, a breath, two
    dango: groups(22.4, [9, 4, 2], 0.45, 0.8),
    // 六: the same fifteen, slower (0.5 s, breaths 0.75 s); plucks 3 7 10 13 are silent
    dangoLate: groups(161.2, [9, 4, 2], 0.5, 0.75),
    dangoLateSilent: [],                       // filled below: the four dango that arrive in silence
    // sōzu: the tube tips (water spills) 0.2 s before it strikes the stone: KON
    sozu: [40.0, 160.0, 232.5],
    sozuTip: [39.8, 159.8, 232.3],
    // 六: the dry tube, rocked by wind, off-screen (during the 月に雁 crop)
    sozuDry: [181.0],
    // 七: a dew drop falls into the dry sōzu
    dew: [201.5],
    // wind: gust onsets; each gust peaks 1.0 s later and dies over ~3 s (see gustAt)
    gusts: [13.0, 19.5, 27.0, 35.0, 114.2, 163.8, 177.4, 193.2, 199.6, 204.2],
    // 二: the biwa narrates each shadow beat; kagura-suzu as the culm shines / the girl appears
    biwa: [41.0, 43.0, 46.0, 48.0, 50.5, 52.5, 54.5, 57.0],
    kaguraSuzu: [46.0, 48.0],
    puppetRustle: [40.7, 42.7, 49.8, 54.2, 59.8],
    // 三: spout drops (every 2.3 s from 72.0, stopping for the 間 82.2–86.0) and the
    //     fifteen beads that leak from the child's palms (75.4 → 82.2, evenly)
    spoutDrops: every(72.0, 2.3, 82.0),
    palmBeads: Array.from({ length: 15 }, (_, k) => r3(75.4 + (k * 6.8) / 14)),
    splash: [67.9],
    // 四: every insect stops for the leap; the bowl sounds alone; they return one by one
    insectsStop: [99.0, 100.2],
    bowl: [99.0],
    insectReturns: [100.2, 100.6, 101.1, 101.9, 103.0],
    // 四: ぺったん every 1.6 s from 106.4 (the picture's pestle keeps going; the SOUND
    //     fades 1 → 0 over 108–112: we stop hearing it)
    pestle: every(106.4, 1.6, 118.0),
    pestleFade: [108.0, 112.0],
    // 五: the grandmother's heartbeat (55 Hz, 60 bpm) — it stops at the look back (147.0)
    heartbeat: every(136.0, 1.0, 146.5),
    // 五: the koto forgets — pass onsets, the ache, then the CLICK
    forget: { passes: [140.0, 141.9, 143.8, 145.6], ache: 147.0, click: 147.8 },
    // 五: kagura-suzu clusters riding the cloud of celestials down the paper
    celestialSuzu: [132.0, 133.4, 134.9, 136.4, 137.9, 139.2],
    // ABSOLUTE silence (master gain 0) and the other written silences
    silence: [[148.0, 152.0]],
    quiet: [[0, 2.0], [99.0, 100.2], [148.0, 152.0], [234.2, 236.0]],
    // 五/六/七/結: single insects
    firstInsect: [12.0],
    insectsAgain: [156.6, 158.2],
    lastInsect: [233.0],
    // the koto harmonic of たけ's complicity, returned identically for 小夜's
    harmonic: [33.6, 197.5],
    // andon blown out (and its echo inside the fox window, t − 150)
    andon: [37.0, 187.0],
    // お月見泥棒: the child's arm (33.0), its echo in the fox window (183.0), the fox's paw (195.2)
    theft: [33.0, 183.0, 195.2],
    // 六: tea — two pours, the pot set down; the strip; geese honks
    tea: [169.0, 169.62],
    teaTick: [170.34],
    strip: [171.0],
    geese: [174.5, 176.0, 178.4],
    // fox window: the glass cluster A6 B6 E7 (三 opens it, 六 returns it)
    foxWindow: [87.2, 182.0],
    // 結: 縁 offered, the missing D, three 捨て鐘, four plates lifting, the seal
    enOffered: [210.5, 211.2, 211.9, 212.8],
    missingD: [214.0],
    bells: [215.0, 220.0, 225.0],
    peels: [222.0, 223.5, 225.0, 226.5],
    seal: [230.0],
  };
  CUES.dangoLateSilent = [3, 7, 10, 13].map((k) => CUES.dangoLate[k - 1]);
  /** The 縁 motif, whole (一). */
  CUES.enWhole = [16.5, 17.2, 17.9, 18.8, 19.9];
  /** Gust strength 0…~1 at film time t — the picture's susuki sway reads the same curve. */
  CUES.gustRise = 1.0;
  CUES.gustFall = 3.0;
  CUES.gustAt = (t) => {
    let e = 0;
    for (const g of CUES.gusts) e += A.gustEnv(t - g, CUES.gustRise, CUES.gustFall);
    return e;
  };
  TSUKI.CUES = CUES;

  /* ====================================================================== */
  /* 2. HELPERS                                                              */
  /* ====================================================================== */
  const events = [], beds = [];
  const add = (...xs) => { for (const x of xs) Array.isArray(x) ? events.push(...x) : events.push(x); };
  const bed = (...xs) => { for (const x of xs) Array.isArray(x) ? beds.push(...x) : beds.push(x); };
  const MIYAKO = A.scale('miyako', 'D4');
  const STRINGS = A.hirajoshi('D4');           // 13 strings of the koto, 平調子 on D

  /** Notes (phrase tokens) placed on given absolute times. */
  function on(times, notes, inst, opts = {}) {
    const toks = typeof notes === 'string' ? notes.trim().split(/\s+/) : notes;
    const gaps = times.map((t, i) => (i < times.length - 1 ? times[i + 1] - t : 1));
    return A.phrase(times[0], toks, gaps, inst, opts).map((e, i) => Object.assign(e, { t: r3(e.t) }));
  }
  /** oshide: the D string pressed up a semitone before it sounds — E♭ reached from D. */
  const oshide = (t, vel, o = {}) => Object.assign({ t, inst: 'koto', note: 'D5', press: 1, pressAt: 0.03, pressTime: 0.09, vel }, o);
  /** The sōzu: the tube tips and spills, then strikes the stone — KON. */
  const kon = (t, vel, o = {}) => [
    { t: r3(t - 0.2), inst: 'splash', kind: 'gush', dur: 0.26, vel: vel * 0.5, pan: -0.15, rev: 0.4 },
    Object.assign({ t, inst: 'sozu', vel, pan: -0.1, rev: 0.75 }, o),
  ];

  /* ---------- insects: each voice is its own bed (see the bed `insects`) ---------- */
  // identities: the same eleven insects are heard all night, near or through paper
  const V = {
    s1: ['suzu', 4380, -0.55], s2: ['suzu', 4520, 0.35], s3: ['suzu', 4230, -0.2], s4: ['suzu', 4610, 0.6],
    s5: ['suzu', 4270, -0.75], s6: ['suzu', 4460, 0.1], s7: ['suzu', 4240, 0.8], s8: ['suzu', 4560, -0.4],
    m1: ['matsu', 3380, 0.45], m2: ['matsu', 3180, -0.3], m3: ['matsu', 3520, 0.7],
  };
  const VL = 0.2;                              // one insect near: ≈ −40 dBFS
  const LEAD = 0.1;                            // the bed opens 0.1 s early so the first call lands ON `from`
  /** One insect, singing from `from` (its first call exactly then) until `to`. */
  function voice(id, from, to, o = {}) {
    const [kind, f, pan] = V[id];
    return Object.assign({
      inst: 'insects', from: r3(from - LEAD), to, first: LEAD, field: 0,
      nSuzu: kind === 'suzu' ? 1 : 0, nMatsu: kind === 'matsu' ? 1 : 0, fSuzu: kind === 'suzu' ? f : undefined,
      fMatsu: kind === 'matsu' ? f : undefined, vamp: 0.85, activity: 0.5, pan, level: VL, fadeIn: 0.08, fadeOut: 1.5,
      dist: 0.15, rev: 0.35, vid: id, seed: seedOf(`${id}@${r3(from)}`),
    }, o);
  }
  function seedOf(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0) % 1e9; }
  /**
   * The same insect heard from elsewhere (through paper, in memory): identical
   * calls — same from/seed — but gated to [on, off] by automation.
   */
  function twin(b, on, off, o = {}) {
    const L = def(o.level, b.level);
    const x = Object.assign({}, b, o, { level: 0, to: def(o.to, r3(off + 0.05)), fadeOut: 0 });
    const fin = def(o.gateIn, 0.03), fout = def(o.gateOut, 0.03);
    x.automation = [[on, 0], [r3(on + fin), L], [r3(off - fout), L], [off, 0]];
    delete x.gateIn; delete x.gateOut;
    return x;
  }
  function def(v, d) { return v === undefined ? d : v; }
  const shiftBed = (b, dt) => Object.assign({}, b, { from: r3(b.from + dt), to: r3(b.to + dt) },
    b.fill ? { fill: b.fill.map(([t, v]) => [r3(t + dt), v]) } : {}, b.gusts ? { gusts: b.gusts.map((t) => r3(t + dt)) } : {});

  /* ====================================================================== */
  /* 3. THE FILM, SEGMENT BY SEGMENT                                         */
  /* ====================================================================== */

  /* ---------------- 序 摺り初め 0–14: the print is pulled ---------------- */
  // 0–2 paper room tone only (brown noise ≈ −50 dBFS); the room stays under the printing
  bed({ inst: 'night', from: 0, to: 14.0, level: 0.11, air: 0.25, fadeIn: 0.4, fadeOut: 1.5, seed: 11 });
  // 2.0–6.0 the baren rubs the key block out of the paper, spiralling from the house
  add({ t: CUES.baren.from, inst: 'baren', dur: CUES.baren.to - CUES.baren.from, stroke: CUES.baren.stroke, vel: 0.24, pan: 0.2, resume: true });
  // 6.0–10.2 eight plates settle into the kentō notch (lower right): CLICK ×8 — learn this sound
  add(on(CUES.kento, CUES.kento.map(() => 0), 'kento', { vel: [0.56, 0.6, 0.62, 0.58, 0.63, 0.66, 0.6, 0.57], pan: 0.35, rev: 0.16 })
    .map((e) => (delete e.note, e)));
  // 7.0 as the title lands: one koto 引き色 — D4 plucked, then pulled ~40 cents flat
  add({ t: 7.0, inst: 'koto', note: 'D4', vel: 0.5, slide: -0.4, slideAt: 0.3, slideTime: 0.6, pan: -0.1, rev: 0.32 });
  // 10.2 mica lands: the print sparkles faintly (the same glass that the moon shatters into at 67.9)
  add({ t: 10.26, inst: 'glass', grains: 16, lo: 2600, hi: 5200, spread: 1.3, vel: 0.28, pan: 0.1, rev: 0.4 });
  // 12.0 the first suzumushi, far away · 13.0 the first gust: the print breathes (beds below)

  /* ---------------- 一 月の出 14–40: first impression ---------------- */
  // the chorus of the first night: eight suzumushi 1 → 8 by 30 s, three matsumushi from 24 s
  const NIGHT1 = [
    voice('s1', 12.0, 40.0, { dist: 0.4, activity: 0.35 }),
    voice('s2', 14.8, 40.0), voice('s3', 16.3, 40.0, { dist: 0.3 }), voice('s4', 18.6, 40.0),
    voice('s5', 21.4, 40.0, { dist: 0.35 }), voice('s6', 24.4, 40.0), voice('s7', 27.1, 40.0, { dist: 0.3 }),
    voice('s8', 29.8, 40.0),
    voice('m1', 24.0, 40.0), voice('m2', 25.3, 40.0, { dist: 0.3 }), voice('m3', 26.9, 40.0),
  ].map((b) => Object.assign(b, { fadeOut: 0.02 }));    // every bed cuts with the KON
  const FIELD1 = { inst: 'insects', from: 15.0, to: 40.0, nSuzu: 0, nMatsu: 0, field: 0.8, level: 0, fadeIn: 0.5, fadeOut: 0.02,
    automation: [[15.0, 0], [30.0, 0.22], [40.0, 0.24]], dist: 0.45, seed: 401 };
  bed(NIGHT1, FIELD1);
  // wind in the susuki (0.8–2 kHz), the same gusts the picture sways to
  const WIND1 = { inst: 'wind', from: 12.9, to: 40.0, level: 0.26, fadeIn: 0.5, fadeOut: 0.02, lo: 800, hi: 2000, q: 1.3,
    brightness: 0.43, gust: 0.22, rumble: 0.3, air: 0.12, gusts: CUES.gusts.filter((g) => g < 40), gustAmt: 0.75, seed: 303 };
  bed(WIND1);
  // the kakei trickles into the sōzu; the tube fills (its note rises) until it tips at 39.8
  const TRICKLE1 = { inst: 'trickle', from: 13.4, to: 40.0, level: 0.3, fadeIn: 1.6, fadeOut: 0.02, f: 900, q: 5,
    fill: [[13.4, 850], [39.8, 1500]], bubbles: 0.5, pan: -0.25, dist: 0.2, seed: 505 };
  bed(TRICKLE1);

  // 16.5–19.9 THE 縁 MOTIF, WHOLE — the only complete statement in the film (rubato)
  add(on(CUES.enWhole, 'A4 Bb4 D5', 'koto', { vel: [0.58, 0.56, 0.6], pan: -0.05, rev: 0.34 }).slice(0, 3));
  add(oshide(18.8, 0.62, { pan: -0.05, rev: 0.34, vib: 12, vibAt: 0.55 }));       // E♭5, pressed up from D5
  add({ t: 19.9, inst: 'koto', note: 'D5', vel: 0.54, pan: -0.05, rev: 0.4 });     // home: long decay
  // 22.4–29.4 fifteen plucks, one per dango — the counting melody (9 · 4 · 2)
  const COUNT = 'D4 Eb4 G4 A4 Bb4 A4 G4 Eb4 D4  G4 A4 Bb4 D5  Eb5 D5';
  const COUNT_VEL = [0.46, 0.44, 0.48, 0.5, 0.54, 0.48, 0.45, 0.43, 0.48, 0.48, 0.51, 0.54, 0.58, 0.56, 0.5];
  add(on(CUES.dango, COUNT, 'koto', { vel: COUNT_VEL, pan: 0.1, rev: 0.26 }));
  // 33.0 お月見泥棒: a small arm, a rustle of the kaishi paper — 33.6 the harmonic of たけ's complicity
  add({ t: CUES.theft[0], inst: 'swish', kind: 'rustle', vel: 0.34, pan: 0.12 });
  const HARMONIC = { inst: 'koto', note: 'A5', harm: true, vel: 0.38, pan: 0.05, rev: 0.42 };
  add(Object.assign({ t: CUES.harmonic[0] }, HARMONIC));
  // 37.0 たけ blows out the andon: a breath, the flame guttering
  add({ t: CUES.andon[0], inst: 'puff', vel: 0.42, gutter: 0.7, pan: 0.15 });
  // 39.8 the sōzu tips · 40.0 KON — hard cut; every bed cuts with it
  add(kon(CUES.sozu[0], 0.85));

  /* ---------------- 二 影絵・竹取 40–66: the shadow theatre ---------------- */
  // inside: the same insects, heard through the shoji (6 dB/oct wall at 1.5 kHz, −9 dB)
  const WALL = { muffle: 1500, rev: 0.25 };
  bed(NIGHT1.map((b) => twin(b, 40.0, 66.0, Object.assign({ level: b.level * 0.355 }, WALL))));
  bed(twin(FIELD1, 40.0, 66.0, Object.assign({ level: 0.24 * 0.355 }, WALL)));
  bed({ inst: 'night', from: 40.0, to: 66.0, level: 0.16, air: 0.35, fadeIn: 0.05, fadeOut: 0.05, seed: 13 });
  // たけ's hands turn the paper puppets (panel 4 is right, panel 1 left)
  add(on(CUES.puppetRustle, CUES.puppetRustle.map(() => 0), 'swish', { kind: 'rustle', vel: [0.3, 0.26, 0.28, 0.26, 0.32],
    pan: [0.5, 0.5, 0.2, -0.15, 0.1], dur: [0.45, 0.4, 0.5, 0.45, 0.55] }).map((e) => (delete e.note, e)));
  // the biwa narrates each shadow beat (biwa-hōshi): the tale opens, the cutter, the culm, the girl, the growth, the tears
  add([
    { t: 41.0, inst: 'biwa', note: ['D2', 'A2', 'D3'], vel: 0.6, strike: 0.55, pan: 0.45 },   // 今は昔 — the grove
    { t: 43.0, inst: 'biwa', note: 'A2', vel: 0.48, strike: 0.35, pan: 0.45 },                 // the cutter walks in
    { t: 46.0, inst: 'biwa', note: 'D3', vel: 0.5, strike: 0.3, press: 1, pressAt: 0.35, pressTime: 0.2, pan: 0.45 }, // one culm shines
    { t: 48.0, inst: 'biwa', note: 'G3', vel: 0.48, strike: 0.3, pan: 0.4 },                   // a girl-shaped hole of light
    { t: 50.5, inst: 'biwa', note: 'D3', vel: 0.44, strike: 0.25, pan: 0.2 },                  // she grows …
    { t: 52.5, inst: 'biwa', note: 'Eb3', vel: 0.44, strike: 0.25, pan: 0.1 },
    { t: 54.5, inst: 'biwa', note: 'G3', vel: 0.46, strike: 0.3, pan: -0.05 },                 // … into a woman
    { t: 57.0, inst: 'biwa', note: 'Bb2', vel: 0.5, strike: 0.35, slide: -1, slideAt: 0.45, slideTime: 0.8, pan: -0.45 }, // sleeve to her face
  ]);
  // 46.0, 48.0 kagura-suzu: the light inside the bamboo
  add({ t: 46.0, inst: 'suzu', shakes: 2, rate: 3, vel: 0.36, bright: 0.6, pan: 0.45, rev: 0.4 },
    { t: 48.0, inst: 'suzu', shakes: 3, rate: 3.2, vel: 0.4, bright: 0.6, pan: 0.4, rev: 0.4 });
  // 50.5–54.5 a rising koto arpeggio across the growth (D4 → D5, miyako-bushi)
  add(A.phrase(50.9, MIYAKO.degs('0 1 2 3 4 5').map(A.name), [0.65, 0.6, 0.65, 0.7, 0.7, 1], 'koto',
    { vel: [0.36, 0.38, 0.41, 0.44, 0.47, 0.5], pan: [0.2, 0.15, 0.1, 0.05, 0, -0.05], rev: 0.34 }));
  // 55.5 a single D4: the grown Kaguya carried toward panel 1
  add({ t: 55.5, inst: 'koto', note: 'D4', vel: 0.48, pan: -0.2, rev: 0.36 });
  // 57.5–61.0 the shakuhachi's meri sigh: E♭4 bending down to D4, breath audible
  add({ t: 57.5, inst: 'shakuhachi', note: 'Eb4', dur: 3.2, vel: 0.38, bendFrom: -0.4, bends: [[1.2, 0], [1.75, -1]], release: 0.8,
    muraiki: 0.55, tone: 0.3, pan: -0.2, resume: true });
  // 63.0 the paper moon eclipses the real one: the mix dips −6 dB (master) and a low D2 rings through the push-in
  add({ t: 63.0, inst: 'koto', note: 'D2', vel: 0.82, dur: 3.5, pan: 0, rev: 0.42 });

  /* ---------------- 三 水の月 66–90: the moon in the water ---------------- */
  // outside again: six of the same insects (moderate), low wind, the spout trickling
  const SIX = ['s1', 's2', 's4', 's5', 's7', 'm1'];
  const NIGHT3 = NIGHT1.filter((b) => SIX.includes(b.vid))
    .map((b) => twin(b, 66.0, 99.0, { level: VL * 0.85, dist: 0.2, gateOut: 0.02 }));
  bed(NIGHT3);
  bed(twin(FIELD1, 66.0, 99.0, { level: 0.1, gateOut: 0.02 }));
  bed({ inst: 'wind', from: 66.0, to: 99.0, level: 0.12, fadeIn: 0.3, fadeOut: 0.02, lo: 500, hi: 1300, brightness: 0.35, gust: 0.35,
    rumble: 0.5, air: 0.2, seed: 707 });
  // the spout trickles until the moon is whole again, then only drops
  bed({ inst: 'trickle', from: 66.0, to: 72.0, level: 0.26, fadeIn: 0.05, fadeOut: 1.4, f: 1150, q: 4.5, bubbles: 0.6, pan: -0.27, seed: 606 });
  // 67.9 small hands shatter the moon: a splash and a shimmer of mica
  add({ t: CUES.splash[0], inst: 'splash', kind: 'hand', vel: 0.55, drops: 6, pan: 0 },
    { t: CUES.splash[0], inst: 'glass', grains: 28, lo: 2000, hi: 5000, spread: 1.5, vel: 0.4, pan: 0, rev: 0.45 });
  // 68.9 the hands come up empty, dripping
  [[69.0, 2300, 1600, 0.26], [69.32, 2100, 1500, 0.22], [69.75, 2500, 1750, 0.18]].forEach(([t, f0, f1, vel]) =>
    add({ t, inst: 'plink', f0, f1, glide: 0.05, vel, pan: 0.05 }));
  // 70.2–71.8 koto harmonics as the shards regather — closer together, the moon whole on D6
  add(on([70.2, 70.8, 71.3, 71.8], 'Bb5 G5 A5 D6', 'koto', { harm: true, vel: [0.24, 0.26, 0.28, 0.32], pan: [-0.2, 0.15, -0.05, 0], rev: 0.46 }));
  // 70.5 the child's sob: the shakuhachi's breath alone, bending
  add({ t: 70.5, inst: 'shakuhachi', note: 'A4', air: true, dur: 0.7, vel: 0.46, bendFrom: 1, bends: [[0.35, 0.5]], fall: -2.5,
    release: 0.35, muraiki: 0.9, pan: 0.1 });
  // 72.0 … drops from the spout, 1.8 → 1.2 kHz, every 2.3 s (the 間 silences them after 81.2)
  add(on(CUES.spoutDrops, CUES.spoutDrops.map(() => 0), 'plink', { f0: 1800, f1: 1200, glide: 0.08, vel: 0.42, pan: -0.27, rev: 0.42 })
    .map((e) => (delete e.note, e)));
  // 73.0 the ladle dips; 75.0 a tiny moon poured into cupped hands
  add({ t: 73.0, inst: 'splash', kind: 'gush', dur: 0.22, drops: 2, vel: 0.2, pan: 0.3 },
    { t: 75.0, inst: 'pour', dur: 0.36, f0: 1300, f1: 1700, tickAt: -1, vel: 0.2, pan: 0.1 });
  // 75.4–82.2 fifteen beads leak between her fingers, quieter and higher as the water runs out
  CUES.palmBeads.forEach((t, k) => add({ t, inst: 'plink', f0: 2300 + k * 30, f1: 1650 + k * 25, glide: 0.05,
    vel: k === 14 ? 0.22 : 0.3 - k * 0.009, pan: 0.05, rev: 0.38 }));
  // 82.2–86.0 間: only insects. 86.1 たけ's sleeves as her joined hands glide in
  add({ t: 86.1, inst: 'swish', kind: 'cloth', vel: 0.14, dur: 0.8, pan: 0.3 });
  // 87.2 the fox window: glass A6 B6 E7 (heaven has no semitones), swelling as it opens, carried into 四
  add({ t: CUES.foxWindow[0], inst: 'glass', note: ['A6', 'B6', 'E7'], swell: 2.8, dur: 3.0, release: 2.2, vel: 0.5, rev: 0.55, resume: true });

  /* ---------------- 四 月天心 90–118: the rabbit in the moon ---------------- */
  // fire on the moon's face, 90.0–99.0; it flares as the rabbit leaps (98.0–98.9)
  bed({ inst: 'fire', from: 90.0, to: 99.0, level: 0.28, fadeIn: 0.8, fadeOut: 0.02, crackle: 0.5, roar: 0.25, pan: 0.05,
    automation: [[98.1, 0.28], [98.95, 0.5]], seed: 909 });
  add([
    { t: 90.6, inst: 'biwa', note: 'A2', vel: 0.5, strike: 0.3, pan: 0 },                     // the old beggar by the fire
    { t: 92.0, inst: 'koto', note: 'G5', vel: 0.4, pan: -0.35, rev: 0.34 },                    // a monkey brings fruit
    { t: 93.4, inst: 'koto', note: 'Eb5', vel: 0.38, pan: 0.35, rev: 0.34 },                   // a fox brings a fish
    { t: 95.8, inst: 'koto', note: 'Eb3', vel: 0.46, pan: 0.05, rev: 0.34 },                   // the rabbit, empty-handed …
    { t: 96.35, inst: 'koto', note: 'D3', vel: 0.4, pan: 0.05, rev: 0.34, dur: 2.5 },          // … its ears droop
    { t: 97.0, inst: 'koto', note: 'Eb6', harm: true, vel: 0.4, pan: 0, rev: 0.45, dur: 1.9 }, // it looks up, at us
    { t: 97.9, inst: 'biwa', note: ['D2', 'A2', 'D3', 'G3'], vel: 0.8, strike: 1, strum: 18, dur: 0.95, pan: 0 }, // the leap
  ]);
  // 99.0 every insect on earth stops for 1.2 s: in the gap only one small struck bowl (鏧 ≈ 1.1 kHz, 6 s);
  // even the air holds its breath — the room (reverb) is cut until the insects return (see `room`)
  add({ t: CUES.bowl[0], inst: 'rin', note: 'C#6', decay: 6, vel: 0.42, pan: 0, rev: 0.5, resume: true });
  // 100.2 … the insects return one at a time
  const RETURN = ['s1', 's4', 's2', 'm1', 's5'].map((id, i) => voice(id, CUES.insectReturns[i], 121.0, { fadeOut: 3.0 }));
  const LATER = [voice('s7', 109.3, 121.0, { fadeOut: 3.0 }), voice('s3', 113.2, 121.0, { fadeOut: 3.0 }), voice('s8', 116.0, 121.0, { fadeOut: 3.0 })];
  bed(RETURN, LATER);
  // 106.4 ぺったん every 1.6 s — soft taiko thud + wet slap, doubled by the lowest koto D2;
  // 108 → 112 its gain falls 1 → 0 with the tilt: the pestle we stop hearing
  const pestleGain = (t) => (t <= CUES.pestleFade[0] ? 1 : Math.max(0, (CUES.pestleFade[1] - t) / (CUES.pestleFade[1] - CUES.pestleFade[0])));
  for (const t of CUES.pestle) {
    const g = pestleGain(t);
    if (g <= 0.02) continue;
    add({ t, inst: 'pestle', vel: 0.5 * g, pan: 0, rev: 0.34 },
      { t, inst: 'koto', note: 'D2', vel: 0.34 * g, dur: 1.4, pan: 0, rev: 0.3 });
  }
  // 108 the tilt down to earth: a little wind in the garden again
  bed({ inst: 'wind', from: 108.0, to: 121.0, level: 0.12, fadeIn: 2.5, fadeOut: 3.0, lo: 700, hi: 1800, q: 1.4, brightness: 0.4,
    gust: 0.25, rumble: 0.35, air: 0.3, gusts: [114.2], gustAmt: 0.5, seed: 808 });
  // 110.0 the shō enters pianissimo: A4 B4 E5 F♯5 A5 B5 — it will swell to forte by 140 and be cut by the CLICK
  const SHO_T = 110.0;
  add({ t: SHO_T, inst: 'sho', aitake: 'ichi', root: 'A4', dur: r3(CUES.click[0] - SHO_T), release: 0.05, vel: 0.6, width: 0.7,
    bright: 0.55, rev: 0.5, resume: true,
    levels: [[0, 0], [3.0, 0.15], [8.0, 0.2], [14.0, 0.3], [22.0, 0.55], [30.0, 1.0], [37.8, 1.0]] });

  /* ---------------- 五 天の羽衣 118–160: the robe of heaven ---------------- */
  // inside again, through the mist wipe: the insects heard through the shoji
  const NIGHT5 = [...RETURN, ...LATER].map((b) => twin(b, 118.0, 148.0, Object.assign({ level: b.level * 0.4, gateIn: 3.0 }, WALL)));
  // they thin 8 → 3 as heaven arrives (132–138); the last three vanish under the cloud at 148.0
  const EXIT = { s8: 132.4, s3: 133.5, s7: 134.6, m1: 135.8, s5: 137.0 };
  for (const b of NIGHT5) {
    const id = b.vid;
    if (EXIT[id]) b.automation = [[118.0, 0], [121.0, b.automation[1][1]], [EXIT[id], b.automation[1][1]], [r3(EXIT[id] + 1.4), 0]];
  }
  bed(NIGHT5);
  bed({ inst: 'night', from: 119.0, to: 148.05, level: 0.14, air: 0.3, fadeIn: 2.0, fadeOut: 0.02, seed: 17 });
  // 122.5 Kaguya's letter writes itself: a soft brush stroke under every character
  // (times follow the text engine's reveal: letter reveal 3.0 s, stagger ≤ 0.09 s)
  function revealTimes(segId, kind, reveal, stagger0) {
    const S = TSUKI.SCRIPT;
    let start = null, cols = null, t0 = 0;
    if (S && S.segments) {
      for (const s of S.segments) {
        const c = (s.text || []).find((x) => x.kind === kind);
        if (s.id === segId && c) { start = t0 + c.t; cols = c.ja; }
        t0 += s.duration;
      }
    }
    if (start === null) return null;
    const chars = [...cols.join('')], stagger = Math.min(stagger0, (reveal * 0.75) / Math.max(1, chars.length));
    return chars.map((ch, i) => ({ t: r3(start + i * stagger), ch }));
  }
  const LETTER = revealTimes('ama-no-hagoromo', 'letter', 3.0, 0.09) ||
    [...'脱ぎおく衣を形見と見たまへ。月の出でたらむ夜は、見おこせたまへ。'].map((ch, i) => ({ t: r3(122.5 + i * 0.0703), ch }));
  const isKanji = (ch) => /[一-鿿]/.test(ch), isPunct = (ch) => /[、。]/.test(ch);
  CUES.letterStrokes = LETTER.map((x) => x.t);
  LETTER.forEach(({ t, ch }, i) => add({ t, inst: 'swish', kind: 'brush', dur: isPunct(ch) ? 0.035 : 0.08,
    vel: isPunct(ch) ? 0.13 : isKanji(ch) ? 0.3 : 0.22, bright: isKanji(ch) ? 0.5 : 0.75, pan: 0.6, rev: 0.15, seed: 7000 + i }));
  // … over a koto D3, re-plucked softly: a floor under the letter
  add(on([122.5, 125.5, 128.5], 'D3 D3 D3', 'koto', { vel: [0.38, 0.34, 0.32], pan: 0.1, rev: 0.4 }));
  // 124.0–126.0 the rabbits of the haori shine through: a quiet ascending glissando over the strings
  const GLISS = STRINGS.slice(1).sort((a, b) => a - b);          // G3 … A5
  let gt = 124.0;
  const glissT = GLISS.map((_, i) => { const t = gt; gt += 0.16 * Math.pow(0.9, i); return r3(t); });
  add(on(glissT, GLISS.map(A.name), 'koto', { vel: GLISS.map((_, i) => 0.26 + i * 0.013), pan: GLISS.map((_, i) => -0.3 + (0.6 * i) / 11), rev: 0.46 }));
  // 126.2 the haori laid over the sleeping child
  add({ t: 126.2, inst: 'swish', kind: 'cloth', vel: 0.2, dur: 0.9, pan: -0.1 });
  // 132.0 shadows cast by nothing: kagura-suzu clusters ride the cloud of celestials down the paper, nearer
  CUES.celestialSuzu.forEach((t, i) => add({ t, inst: 'suzu', shakes: [3, 4, 4, 5, 4, 3][i], rate: 3.1, vel: [0.3, 0.34, 0.37, 0.4, 0.38, 0.32][i],
    dist: [0.5, 0.42, 0.36, 0.3, 0.26, 0.3][i], bright: 0.55, pan: 0.02 * i, rev: 0.5 }));
  // 136.0 a soft taiko heartbeat, 55 Hz, 60 bpm (lub-dub) — fullest at the culmination, weaker as she climbs away
  const heartVel = (t) => (t < 140 ? 0.2 + (0.3 - 0.2) * ((t - 136) / 4) : 0.3 - 0.02 * (t - 140));
  for (const t of CUES.heartbeat) {
    const v = heartVel(t);
    add({ t, inst: 'taiko', note: 'A1', vel: v, decay: 0.7, dist: 0.2, rev: 0.28, pan: 0 },
      { t: r3(t + 0.3), inst: 'taiko', note: 'A1', vel: v * 0.62, decay: 0.6, dist: 0.2, rev: 0.28, pan: 0 });
  }
  // 140.0–147.8 THE KOTO FORGETS in four passes (heaven's cluster rubs against every semitone)
  const P = CUES.forget.passes;
  add(on([P[0], P[0] + 0.42, P[0] + 0.84], 'A4 Bb4 D5', 'koto', { vel: [0.7, 0.66, 0.68], pan: 0, rev: 0.4 }));  // pass 1: A B♭ D E♭ —
  add(oshide(r3(P[0] + 1.3), 0.68, { rev: 0.4 }));                                                                 //   … the fifth withheld
  add(on([P[1], P[1] + 0.42, P[1] + 0.84, P[1] + 1.3], 'A4 B4 D5 E5', 'koto', { vel: [0.62, 0.58, 0.58, 0.55], pan: 0, rev: 0.42 })); // pass 2: semitones raised
  add(on([P[2], P[2] + 0.5], 'D5 E5', 'koto', { vel: [0.52, 0.47], pan: 0, rev: 0.44 }));                         // pass 3: D E
  add({ t: P[3], inst: 'koto', note: 'E5', harm: true, vel: 0.32, pan: 0, rev: 0.48 });                           // pass 4: E, a thin harmonic
  // 147.0 she looks back: one E♭, pressed up from D — the ache returns for a single note — and the heart stops
  add(oshide(CUES.forget.ache, 0.72, { pressAt: 0.14, pressTime: 0.32, vib: 16, vibAt: 0.5, dur: r3(CUES.click[0] - CUES.forget.ache), rev: 0.42 }));
  // 147.8 CLICK: the kentō of 序 — dry, close, louder. The rest where D5 should fall. (The shō is cut with it.)
  add({ t: CUES.click[0], inst: 'kento', vel: 1, pan: 0, rev: 0.03 });
  // 148.0–152.0 ABSOLUTE SILENCE — see master. 152.0 a breath of wind returns
  bed({ inst: 'wind', from: 152.0, to: 160.0, level: 0.11, fadeIn: 1.4, fadeOut: 0.02, lo: 600, hi: 1500, brightness: 0.35, gust: 0.35,
    rumble: 0.45, air: 0.25, seed: 1152 });
  // 155.0 the cut to A′ brings no sound of its own. 156.6 one suzumushi; 158.2 a second
  bed(voice('s1', CUES.insectsAgain[0], 160.0, { dist: 0.05, activity: 0.2, fadeOut: 0.02, pan: -0.3 }),
    voice('s4', CUES.insectsAgain[1], 160.0, { dist: 0.15, activity: 0.2, fadeOut: 0.02 }));
  // 159.2 the sōzu trickle again … 160.0 KON
  bed({ inst: 'trickle', from: 159.2, to: 160.0, level: 0.26, fadeIn: 0.3, fadeOut: 0.02, f: 1100, q: 5, fill: [[159.2, 1100], [160.0, 1450]],
    bubbles: 0.4, pan: -0.25, seed: 1159 });
  add(kon(CUES.sozu[1], 0.85));

  /* ---------------- 六 後摺 160–190: sixty years later ---------------- */
  // 160.0 the jolt into the late impression: a dry paper crack under the KON's tail
  add({ t: 160.06, inst: 'swish', kind: 'crack', vel: 0.5, pan: 0 });
  // three insects only, sparse; thinner wind; no trickle
  bed(voice('s1', 160.7, 189.6, { activity: 0.16, dist: 0.25, fadeOut: 0.9 }),
    voice('s4', 162.3, 189.6, { activity: 0.16, dist: 0.35, fadeOut: 0.9 }),
    voice('m2', 164.1, 189.6, { activity: 0.14, dist: 0.3, fadeOut: 0.9 }));
  bed({ inst: 'wind', from: 160.0, to: 189.6, level: 0.1, fadeIn: 0.6, fadeOut: 0.9, lo: 700, hi: 1700, q: 1.6, brightness: 0.35,
    gust: 0.2, rumble: 0.3, air: 0.2, gusts: [163.8, 177.4], gustAmt: 0.55, seed: 1160 });
  // 161.2–168.7 the counting melody as a late impression: slower, worn strings, four plucks missing
  const LATE = on(CUES.dangoLate, COUNT, 'koto', { worn: true, vel: COUNT_VEL.map((v) => v * 0.88), detune: -7, pan: 0.1, rev: 0.28 })
    .filter((e) => !CUES.dangoLateSilent.includes(e.t));
  add(LATE);
  // 169.0 two cups poured (one will stay untouched); 170.34 the pot set down — then silence round the cup
  add({ t: CUES.tea[0], inst: 'pour', dur: 0.5, f0: 700, f1: 1250, tickAt: -1, vel: 0.36, pan: 0.05 },
    { t: CUES.tea[1], inst: 'pour', dur: 0.55, f0: 700, f1: 1300, tickAt: r3(CUES.teaTick[0] - CUES.tea[1]), vel: 0.36, pan: -0.05 });
  // 171.0 the faded strip: a single B♭4, pressed softly and let go
  add({ t: CUES.strip[0], inst: 'koto', note: 'Bb4', worn: true, vel: 0.46, press: 0.6, pressAt: 0.25, pressTime: 0.3, pressHold: 0.45, pan: 0, rev: 0.34 });
  // 173.0 the margins close into a tall 月に雁
  add({ t: 173.0, inst: 'swish', kind: 'rustle', dur: 0.7, vel: 0.13, bright: 0.25, pan: 0 });
  // 173.8 a long shakuhachi A4, bending meri and back (the lagging goose calls at its lowest)
  add({ t: 173.8, inst: 'shakuhachi', note: 'A4', dur: 7.0, vel: 0.3, bendFrom: -1, bends: [[2.6, 0], [3.2, -1], [4.8, -1], [5.4, 0]],
    release: 1.2, muraiki: 0.5, tone: 0.4, vib: 16, pan: -0.1, resume: true });
  // 174.5, 176.0 distant geese with the valley's echo; 178.4 the third, alone and late
  add({ t: CUES.geese[0], inst: 'geese', birds: 2, honks: 2, gap: 0.38, f: 380, echo: 0.35, vel: 0.22, pan: 0.25, dist: 0.5, resume: true },
    { t: CUES.geese[1], inst: 'geese', birds: 2, honks: 2, gap: 0.36, f: 372, echo: 0.35, vel: 0.21, pan: 0.05, dist: 0.5, resume: true },
    { t: CUES.geese[2], inst: 'geese', birds: 1, honks: 2, gap: 0.42, f: 352, echo: 0.45, vel: 0.2, pan: -0.2, dist: 0.55, resume: true });
  // 181.0 the dry sōzu, rocked by the wind, knocks once (no water to measure time)
  add({ t: CUES.sozuDry[0], inst: 'sozu', dry: true, vel: 0.42, pan: -0.25, rev: 0.32, dist: 0.3 });
  // 182.0 the fox window returns as the old hands rise …
  add({ t: CUES.foxWindow[1], inst: 'glass', note: ['A6', 'B6', 'E7'], swell: 1.2, dur: 6.4, release: 1.2, vel: 0.36, rev: 0.55, resume: true });
  // … and inside it, low-passed and quieter, the first night's soundscape of t − 150:
  // the very same insects (same seeds, shifted by 150 s), the trickle, the andon breath
  const ECHO = { level: 0, muffle: 2200, rev: 0.4 };
  const echoGate = (b, k) => Object.assign(shiftBed(b, 150), ECHO, {
    fadeIn: 0, fadeOut: 0, automation: [[182.0, 0], [183.0, k], [188.2, k], [189.5, 0]],
  });
  bed(NIGHT1.map((b) => echoGate(b, b.level * 0.45)), echoGate(FIELD1, 0.22 * 0.45), echoGate(TRICKLE1, 0.3 * 0.4),
    echoGate(WIND1, 0.26 * 0.3));                               // the gust of 35.0 sways the window's susuki at 185.0
  add({ t: CUES.theft[1], inst: 'swish', kind: 'rustle', vel: 0.2, lp: 1800, pan: 0.12, rev: 0.3 },   // a small arm, once more
    { t: CUES.andon[1], inst: 'puff', vel: 0.3, gutter: 0.7, lp: 1800, pan: 0.1, rev: 0.3 });
  // 188.0–190.0 the hands tremble: a breathy shakuhachi muraiki, shaking — then silence
  add({ t: 188.0, inst: 'shakuhachi', note: 'A4', dur: 1.2, vel: 0.28, muraiki: 1, tone: 0.2, bendFrom: -0.5, vib: 40, vibRate: 8.5,
    vibDelay: 0.1, fall: -2, release: 0.45, pan: 0 });

  /* ---------------- 七 有明 190–206: the empty room ---------------- */
  bed({ inst: 'night', from: 190.3, to: 206.0, level: 0.13, air: 0.3, fadeIn: 1.0, fadeOut: 0.05, seed: 19 });
  // only one or two insects, far apart; pre-dawn wind in sparse gusts, far off in the susuki
  bed(voice('s1', 192.3, 206.0, { activity: 0.14, dist: 0.4, muffle: 3500, fadeOut: 0.05 }),
    voice('m2', 198.8, 206.0, { activity: 0.12, dist: 0.45, muffle: 3500, fadeOut: 0.05 }));
  bed({ inst: 'wind', from: 190.6, to: 206.0, level: 0.1, fadeIn: 1.5, fadeOut: 0.05, lo: 600, hi: 1500, brightness: 0.3, gust: 0.15,
    rumble: 0.35, air: 0.15, gusts: CUES.gusts.filter((g) => g > 190 && g < 206), gustAmt: 0.7, dist: 0.35, muffle: 2500, seed: 1190 });
  // single worn koto notes like drips: G4 191.0, D4 194.5, A4 200.0
  add(on([191.0, 194.5, 200.0], 'G4 D4 A4', 'koto', { worn: true, vel: [0.44, 0.4, 0.42], detune: -7, pan: 0.1, rev: 0.36 }));
  // 191.0 the faintest ember hiss as the incense is lit
  add({ t: 191.0, inst: 'swish', kind: 'hiss', vel: 0.12, dur: 1.6, bright: 0.25, pan: 0.23 });
  // 195.2 a dry susuki rustle: the unseen thief
  add({ t: CUES.theft[2], inst: 'swish', kind: 'grass', vel: 0.24, dur: 0.8, bright: 0.3, pan: 0.5 });
  // 197.5 she pretends not to see: the same harmonic that marked たけ's complicity at 33.6
  add(Object.assign({ t: CUES.harmonic[1] }, HARMONIC));
  // 201.5 a drop of dew into the dry sōzu: the water beginning to return
  add({ t: CUES.dew[0], inst: 'plink', f0: 2100, f1: 1500, glide: 0.06, hollow: 1, vel: 0.4, pan: -0.2, rev: 0.45 });

  /* ---------------- 結 不尽の煙 206–236: Fuji's smoke ---------------- */
  // dawn pine-wind (soft, low-passed); it lifts away with the earth plates (225.0–226.5)
  bed({ inst: 'wind', from: 206.0, to: 226.5, level: 0.2, fadeIn: 0.4, fadeOut: 1.5, lo: 300, hi: 900, q: 1.2, brightness: 0.3, gust: 0.35,
    rumble: 0.4, air: 0.1, lp: 1300, seed: 1206 });
  // two insects left; dawn silences them before the unprinting
  bed(voice('s1', 206.4, 221.8, { activity: 0.14, dist: 0.3, fadeOut: 2.0 }),
    voice('s4', 208.1, 218.5, { activity: 0.12, dist: 0.4, fadeOut: 2.0 }));
  // 210.5 a thin koto (worn, damped) offers the first four notes of 縁 — then the rest, waiting
  add(on(CUES.enOffered.slice(0, 3), 'A4 Bb4 D5', 'koto', { worn: true, vel: [0.5, 0.48, 0.5], detune: -5, pan: -0.05, rev: 0.4 }));
  add(oshide(CUES.enOffered[3], 0.52, { worn: true, detune: -5, pan: -0.05, rev: 0.42 }));
  // 214.0 the smoke touches the moon: the SHAKUHACHI plays the missing D — muraiki, meri from C♯, then pure, held
  add({ t: CUES.missingD[0], inst: 'shakuhachi', note: 'D5', dur: 6.0, vel: 0.5, bendFrom: -1, bendTime: 0.45, muraiki: 0.85, tone: 0.45,
    vib: 9, vibDelay: 3.6, release: 1.8, swell: 0.05, pan: 0.05, rev: 0.5, resume: true });
  // 215 · 220 · 225 the three 捨て鐘 before 明け六つ (the hour itself is never struck): hum D3, partial 2.0 = D5
  CUES.bells.forEach((t, i) => add({ t, inst: 'bonsho', note: 'D4', partials: 'dawn', decay: 12, vel: [0.6, 0.55, 0.5][i], bright: 0.4,
    dist: 0.3, rev: 0.5, pan: -0.2, resume: true }));
  // 222.0–228.0 the print unprints: four soft peels as the plate groups lift
  CUES.peels.forEach((t, i) => add({ t, inst: 'swish', kind: 'peel', dur: 1.3, vel: [0.3, 0.28, 0.26, 0.3][i], bright: [0.45, 0.35, 0.3, 0.25][i],
    pan: [0.15, -0.1, 0.05, 0][i], rev: 0.3, resume: true }));
  // 226.8 小夜's last haiku: the only new ink — her brush, faint
  const HAIKU = revealTimes('fuji-no-keburi', 'haiku', 2.6, 0.11);
  const lastHaiku = HAIKU ? HAIKU.filter((x) => x.t > 226) : [];
  CUES.haikuStrokes = lastHaiku.map((x) => x.t);
  lastHaiku.forEach(({ t, ch }, i) => add({ t, inst: 'swish', kind: 'brush', vel: isKanji(ch) ? 0.17 : 0.12, bright: 0.6, pan: 0.23, rev: 0.12, seed: 7200 + i }));
  // 227.8 the paper room of 序 again
  bed({ inst: 'night', from: 227.8, to: 236.0, level: 0.11, air: 0.25, fadeIn: 1.5, fadeOut: 0.5, seed: 23 });
  // 230.0 the seal 忘れじ: a soft taiko thud (55 Hz) with a felt click, the paper pressed
  add({ t: CUES.seal[0], inst: 'taiko', note: 'A1', vel: 0.34, decay: 0.7, dist: 0.1, rev: 0.25, pan: 0.3 },
    { t: CUES.seal[0], inst: 'swish', kind: 'press', vel: 0.42, pan: 0.35, rev: 0.15 });
  // 232.5 a last KON: the water has returned — nearer and gentler, so the room is quiet again by 233.0
  add(kon(CUES.sozu[2], 0.55, { rev: 0.28 }));
  // 233.0 one suzumushi — the first voice of the film is its last sound
  add({ t: CUES.lastInsect[0], inst: 'mushi', kind: 'suzu', f: V.s1[1], dur: 1.2, vel: 0.3, pan: -0.15, rev: 0.35 });

  /* ====================================================================== */
  /* 4. MASTER: the written silences                                         */
  /* ====================================================================== */
  const [S0, S1] = CUES.silence[0];
  const master = [
    [0, 0], [0.6, 1],                         // the paper room fades up from nothing
    [62.8, 1], [63.0, 0.5], [65.85, 0.5], [66.0, 1],   // 二: the eclipse — the mix dips −6 dB through the push-in
    [r3(S0 - 0.05), 1], [r3(S0 - 0.01), 0],   // 148.0: ABSOLUTE silence — no insects, no wind, no reverb tail
    [S1, 0], [r3(S1 + 0.25), 1],              // 152.0: the world may breathe again
    [233.85, 1], [234.2, 0], [236, 0],        // the last suzumushi, then silence to the end
  ];

  // the room (reverb return): at the leap the air itself stops, and comes back with the insects
  const [Q0, Q1] = CUES.insectsStop;
  const room = [[r3(Q0 - 0.02), 1], [Q0, 0], [Q1, 0], [r3(Q1 + 0.4), 1]];

  TSUKI.SCORE = {
    key: 'D miyako-bushi (都節), koto 平調子 on D',
    gain: 1,
    master,
    room,
    events,
    beds,
  };
})(window.TSUKI = window.TSUKI || {});
