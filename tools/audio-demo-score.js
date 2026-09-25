/* ==========================================================================
   tools/audio-demo-score.js — a 40 s tsukimi prelude that exercises every
   instrument and bed (test harness only; the film's score is js/score.js).
   D miyako-bushi: D E♭ G A B♭.
   ========================================================================== */
(function (TSUKI) {
  'use strict';
  const A = TSUKI.AUDIO;
  const ev = [];
  const add = (...xs) => { for (const x of xs) Array.isArray(x) ? ev.push(...x) : ev.push(x); };

  // 開幕 — the clappers open the curtain
  add({ t: 0.3, inst: 'hyoshigi', count: 2, gap: 1.1, vel: 0.8 });
  add({ t: 2.8, inst: 'hyoshigi', kizami: 12, kizamiDur: 3.2, vel: 0.75 });

  // koto — a first phrase in hirajōshi, with an oshi-iro on A (→ B♭)
  add(A.phrase(6.5, 'D4 Eb4 G4 A4 Bb4 A4^1 . G4 Eb4 D4', [0.5, 0.42, 0.42, 0.58, 0.95, 1.1, 0.35, 0.5, 0.55, 1.4], 'koto',
    { vel: [0.62, 0.5, 0.55, 0.6, 0.7, 0.66, 0.5, 0.52, 0.48], pan: -0.2, human: 0.015 }));
  add({ t: 11.6, inst: 'koto', note: ['D3', 'A3', 'D4'], vel: 0.6, strum: 60, pan: -0.25 });

  // shakuhachi — lonely, from below
  add({ t: 12.4, inst: 'shakuhachi', note: 'A4', dur: 3.0, vel: 0.55, bendFrom: -1, muraiki: 0.55, pan: 0.15 });
  add({ t: 14.0, inst: 'rin', note: 'A5', vel: 0.5, pan: 0.4 });
  add({ t: 15.7, inst: 'shakuhachi', note: 'Bb4', dur: 1.4, vel: 0.5, pan: 0.15 });
  add({ t: 17.2, inst: 'shakuhachi', note: 'A4', dur: 1.0, vel: 0.45, pan: 0.15, bendFrom: 0 });
  add({ t: 18.3, inst: 'shakuhachi', note: 'D5', dur: 3.4, vel: 0.62, pan: 0.15, yuri: true, fall: -1, muraiki: 0.4 });

  // kagura bells, koto tremolo
  add({ t: 20.0, inst: 'suzu', shakes: 4, rate: 3, vel: 0.55, pan: 0.3 });
  add({ t: 21.4, inst: 'koto', note: 'A4', trem: true, dur: 2.0, vel: 0.55, pan: -0.3 });

  // biwa — narrative strikes
  add({ t: 23.0, inst: 'biwa', note: ['D2', 'A2', 'D3', 'G3'], vel: 0.85, strum: 30, pan: 0.1 });
  add({ t: 24.4, inst: 'biwa', note: 'Eb3', vel: 0.7, press: 1, pressAt: 0.3, pan: 0.1 });

  // drums, far away
  add({ t: 25.2, inst: 'taiko', vel: 0.7, pan: -0.1 });
  add({ t: 26.0, inst: 'kotsuzumi', stroke: 'pon', vel: 0.65, pan: 0.35 });
  add({ t: 26.5, inst: 'kotsuzumi', stroke: 'ta', vel: 0.6, pan: 0.35 });
  add({ t: 26.8, inst: 'taiko', vel: 0.5, pan: -0.1 });
  add({ t: 27.4, inst: 'kotsuzumi', stroke: 'pon', vel: 0.55, pan: 0.35 });

  // the celestial procession: sho, then the temple bell
  add({ t: 27.5, inst: 'sho', aitake: 'otsu', root: 'D5', dur: 9, swell: 3.5, vel: 0.6, resume: true });
  add({ t: 30.5, inst: 'bonsho', note: 'G2', vel: 0.8, decay: 16, resume: true });

  // koto farewell
  add(A.phrase(33.5, 'D5 Bb4 A4 G4 . Eb4 D4', [0.7, 0.55, 0.6, 1.1, 0.4, 0.7, 1.5], 'koto',
    { vel: [0.5, 0.45, 0.48, 0.52, 0, 0.42, 0.46], pan: -0.2, rev: 0.4 }));
  add({ t: 38.2, inst: 'rin', note: 'D6', vel: 0.35, pan: 0.45 });

  TSUKI.SCORE = {
    key: 'D miyako-bushi',
    events: ev,
    beds: [
      { inst: 'night', from: 0, to: 40, level: 0.35, fadeIn: 1, fadeOut: 2 },
      { inst: 'insects', from: 4, to: 40, level: 0.5, fadeIn: 4, fadeOut: 3, density: 0.6, automation: [[24, 0.5], [27, 0.25], [36, 0.45]] },
      { inst: 'wind', from: 8, to: 28, level: 0.35, fadeIn: 3, fadeOut: 4, brightness: 0.45, gust: 0.6 },
      { inst: 'water', from: 16, to: 33, level: 0.45, fadeIn: 2, fadeOut: 3, drips: 10, koi: 3 },
      { inst: 'drone', from: 25, to: 40, level: 0.55, fadeIn: 4, fadeOut: 3, notes: ['D2', 'A2'] },
      { inst: 'fire', from: 31, to: 38, level: 0.5, fadeIn: 1.5, fadeOut: 2, crackle: 0.7 },
    ],
  };
})(window.TSUKI = window.TSUKI || {});
