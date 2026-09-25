/* ==========================================================================
   audio.js — the orchestra pit (TSUKI.AUDIO).
   Every sound in the film is synthesised here with WebAudio: no samples.

   Instruments are plain functions  fn(ctx, dest, when, p) → kit {end}
   that never assume a realtime context, so the same code plays live
   (AudioContext) and renders for export (OfflineAudioContext).

   Transport (called by engine.js): init() · running() · now() · play(T) ·
   pause() · seek(T, playing) · update(T) every frame · setMuted(m).
   Film time maps to context time as  ctxT = anchorCtx + (T − anchorT).
   renderOffline(T0, T1, rate) → Promise<AudioBuffer> for video export.

   The score is TSUKI.SCORE (js/score.js), read lazily at play time:
     { gain?, master?: [[t, gain], ...],
       events: [{ t, inst, note, vel, dur, pan, rev, dist, ... }],
       beds:   [{ inst, from, to, level, fadeIn, fadeOut, automation }] }
   `master` is a film-time gain curve applied AFTER the whole master chain
   (reverb, compressor, clip): a 0 there is digital silence, tails included.
   `room` ([[t, gain], ...]) scales the shared reverb's return: 0 = dry air.
   Composer helpers: phrase(), scale(), hirajoshi(), note(), freq().
   All randomness is seeded from the event, so renders are repeatable.

   Quick reference (every event: t inst note vel pan rev dist lp seed resume)
     koto       note|[chord] dur(damp) strum(ms, <0 = down) press pressAt
                pressTime pressHold slide slideAt slideTime vib vibRate vibAt
                trem tremRate tremShape(swell|fade|grow|even) damp detune
                harm (touched-node harmonic) · worn (後摺: lossy, short, beating)
     biwa       as koto + strike(0–1 bachi slap); sawari buzz built in
     shakuhachi note dur attack release bendFrom bendTime bends[[dt,semi]]
                fall yuri vib vibRate vibDelay muraiki tone swell air(breath only)
     bonsho     note(G2) decay(16) bright beat partials('dawn'|[[r,a,dk,splitHz]])
     rin        note(A5) decay(9) beat                (also the small 鏧 bowl)
     suzu       shakes rate spread count note bright
     taiko      note(A1) decay rim                  kotsuzumi  stroke(pon|ta|chi|pu)
     sho        aitake(kotsu|ichi|ku|otsu|ju|bo|[iv]) root | note[] dur swell
                release bright width breath levels[[dt,0–1]]
     hyoshigi   count gap kizami(true|n) kizamiDur pitch
     sozu       dry                      kento     (the kentō CLICK)
     baren      dur stroke               pestle    (ぺったん)
     geese      birds honks gap f echo   swish     kind(brush|rustle|crack|peel|
                                                   press|grass|hiss|cloth) dur bright
     plink      f0 f1 glide hollow splash          splash kind(hand|gush) drops
     glass      note[] dur swell release | grains lo hi spread
     puff       dur gutter               pour      dur f0 f1 tickAt
     mushi      kind(suzu|matsu) f dur pulses      (one insect, one call)
   beds: from to level fadeIn fadeOut automation[[t,level]] pan rev dist
         muffle(Hz, 6 dB/oct wall) lp(Hz)
     insects density suzumushi matsumushi field nSuzu nMatsu fSuzu fMatsu first
             activity vamp · wind brightness gust rate lo hi q rumble air
             gusts[[t,amt]] gustAmt gustRise gustFall · trickle flow f q fill[[t,Hz]]
             bubbles · water lap drips koi · drone notes beat bright
             fire crackle roar · night air
   ========================================================================== */
(function (TSUKI) {
  'use strict';

  const U = TSUKI.U;
  const AUDIO = (TSUKI.AUDIO = {});
  const clamp = U.clamp, lerp = U.lerp;
  const TAU = Math.PI * 2;
  const LOOKAHEAD = 0.25;   // s of score scheduled ahead of the playhead
  const BED_AHEAD = 0.6;    // s of bed detail (chirps, gusts) scheduled ahead
  const LATE = 0.08;        // an event later than this is dropped (or resumed)
  const SEEK_SETTLE = 0.09; // s a scrub must rest before the music restarts
  const MAX_VOICES = 48;
  const perfNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
  const def = (v, d) => (v === undefined || v === null ? d : v);

  /* ------------------------------------------------------------------ */
  /* pitch                                                               */
  /* ------------------------------------------------------------------ */
  const LETTER = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

  /** 'D4' | 'Eb4' | 'E♭4' | 'F#3' | 62 (midi, may be fractional) → midi. */
  function midiOf(n) {
    if (typeof n === 'number') return n;
    const m = /^\s*([A-Ga-g])([#♯b♭]*)(-?\d+)\s*$/.exec(String(n));
    if (!m) throw new Error('audio: bad note "' + n + '"');
    let v = LETTER[m[1].toUpperCase()];
    for (const c of m[2]) v += c === '#' || c === '♯' ? 1 : -1;
    return v + (parseInt(m[3], 10) + 1) * 12;
  }
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const freqOf = (n) => mtof(midiOf(n));
  const nameOf = (m) => {
    const r = Math.round(m);
    return NAMES[((r % 12) + 12) % 12] + (Math.floor(r / 12) - 1);
  };
  /** note | 'D4+A4' | [..] → array of midi numbers. */
  function noteList(n) {
    if (n === undefined || n === null) return [];
    if (Array.isArray(n)) return n.map(midiOf);
    if (typeof n === 'string' && /[+,\s]/.test(n.trim())) return n.trim().split(/[+,\s]+/).map(midiOf);
    return [midiOf(n)];
  }

  /* ------------------------------------------------------------------ */
  /* scales                                                              */
  /* ------------------------------------------------------------------ */
  const SCALES = {
    miyako: [0, 1, 5, 7, 8],     // 陰旋法 都節 (in)  D E♭ G A B♭
    in: [0, 1, 5, 7, 8],
    ritsu: [0, 2, 5, 7, 9],      // 律  D E G A B   (gagaku)
    yo: [0, 2, 5, 7, 10],        // 陽旋法 (yō)  D E G A C
    minyo: [0, 3, 5, 7, 10],     // 民謡  D F G A C
    ryukyu: [0, 4, 5, 7, 11],    // 琉球  D F# G A C#
    hirajoshi: [0, 2, 3, 7, 8],  // western "hirajōshi"  D E F A B♭
    kumoi: [0, 2, 3, 7, 9],      // 雲井  D E F A B
  };

  /**
   * scale('miyako', 'D4') → { deg(i), degs('0 1 2 -1'), name(i), range(lo,hi),
   *   contains(n), snap(n) }. Degrees wrap by octave (5 → root+12, −1 → below).
   */
  function scale(name = 'miyako', root = 'D4') {
    const iv = Array.isArray(name) ? name : SCALES[name];
    if (!iv) throw new Error('audio: unknown scale ' + name);
    const r = midiOf(root), n = iv.length;
    const pc = (m) => (((Math.round(m) - r) % 12) + 12) % 12;
    const deg = (d) => {
      if (d === null || d === undefined || Number.isNaN(d)) return null;
      const o = Math.floor(d / n);
      return r + iv[((d % n) + n) % n] + 12 * o;
    };
    return {
      root: r, intervals: iv.slice(), deg,
      degs: (a) => (typeof a === 'string' ? a.trim().split(/\s+/).map((x) => (/^[.\-_r]$/.test(x) ? null : Number(x))) : a).map(deg),
      name: (d) => nameOf(deg(d)),
      range: (lo, hi) => {
        const out = [];
        for (let m = Math.ceil(midiOf(lo)); m <= midiOf(hi); m++) if (iv.includes(pc(m))) out.push(m);
        return out;
      },
      contains: (m) => iv.includes(pc(midiOf(m))),
      snap: (m) => {
        m = Math.round(midiOf(m));
        for (let k = 0; k < 12; k++) {
          if (iv.includes(pc(m - k))) return m - k;
          if (iv.includes(pc(m + k))) return m + k;
        }
        return m;
      },
    };
  }

  /** The 13 strings of a koto in 平調子 hirajōshi (index 0 = string 一). */
  function hirajoshi(root = 'D4') {
    const r = midiOf(root);
    return [0, -7, -5, -4, 0, 1, 5, 7, 8, 12, 13, 17, 19].map((x) => r + x);
  }

  /* ------------------------------------------------------------------ */
  /* phrase helper                                                       */
  /* ------------------------------------------------------------------ */
  const CYCLE = new Set(['vel', 'dur', 'pan', 'rev', 'dist', 'strum', 'detune', 'press']);
  const PHRASE_ONLY = new Set(['human', 'legato', 'each']);

  function parseTok(tok) {
    if (tok === null || tok === undefined) return null;
    if (typeof tok === 'number' || Array.isArray(tok)) return { note: tok };
    const s = String(tok).trim();
    if (/^[.\-_r]$/.test(s) || s === '') return null;
    const m = /^([^\^~!]+)((?:\^\d*(?:\.\d+)?|~|!)*)$/.exec(s);
    if (!m) throw new Error('audio: bad phrase token "' + s + '"');
    const notes = m[1].split('+');
    const e = { note: notes.length > 1 ? notes : notes[0] };
    const mods = m[2] || '';
    const pm = /\^(\d*(?:\.\d+)?)/.exec(mods);
    if (pm) e.press = pm[1] === '' ? 1 : parseFloat(pm[1]);
    if (mods.includes('~')) e.yuri = true;
    if (mods.includes('!')) e.accent = true;
    return e;
  }

  /**
   * phrase(t0, notes, rhythm, inst, opts) → events[]
   *  notes : 'D4 Eb4 G4 . A4^2 Bb4~ D5!' or array (names | midi | [chord] | null)
   *          '.' rest · 'D4+A4' chord · '^n' press n semitones (koto/biwa oshi-iro)
   *          '~' yuri (shakuhachi) · '!' accent (vel ×1.3)
   *  rhythm: seconds between onsets, or an array of gaps (cycled)
   *  opts  : any event params; vel/dur/pan/rev/dist/strum/detune/press may be
   *          arrays (cycled per token, rests included). human: seeded jitter (s);
   *          legato: dur = gap × legato; each(ev, i): edit hook.
   */
  function phrase(t0, notes, rhythm, inst, opts = {}) {
    const toks = typeof notes === 'string' ? notes.trim().split(/\s+/) : notes;
    const R = U.rng(Math.round(t0 * 1000) + toks.length * 7 + 17);
    const out = [];
    let t = t0;
    toks.forEach((tok, i) => {
      const gap = Array.isArray(rhythm) ? rhythm[i % rhythm.length] : def(rhythm, 0.5);
      const pt = parseTok(tok);
      const jit = opts.human ? (R() - 0.5) * 2 * opts.human : 0;
      if (pt) {
        const e = { t: Math.max(0, +(t + jit).toFixed(4)), inst, note: pt.note };
        for (const k in opts) {
          if (PHRASE_ONLY.has(k)) continue;
          const v = opts[k];
          e[k] = CYCLE.has(k) && Array.isArray(v) ? v[i % v.length] : v;
        }
        if (pt.press !== undefined) e.press = pt.press;
        if (pt.yuri) e.yuri = true;
        if (pt.accent) e.vel = Math.min(1, def(e.vel, 0.7) * 1.3);
        if (opts.legato && e.dur === undefined) e.dur = gap * opts.legato;
        if (opts.each) opts.each(e, i);
        out.push(e);
      }
      t += gap;
    });
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* buffers: caches, JS filters, noise, reverb impulse                  */
  /* ------------------------------------------------------------------ */
  const hashStr = (s) => {
    let h = 2166136261;
    s = String(s);
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  };
  const core = new Map();   // noise, impulse responses: kept forever
  const lru = new Map();    // plucks, bell bunches, clacks, one-shots: bounded
  const LRU_MAX = 160;
  function cacheCore(key, make) {
    let b = core.get(key);
    if (!b) core.set(key, (b = make()));
    return b;
  }
  function cacheLru(key, make) {
    let b = lru.get(key);
    if (b) { lru.delete(key); lru.set(key, b); return b; }
    b = make();
    lru.set(key, b);
    if (lru.size > LRU_MAX) lru.delete(lru.keys().next().value);
    return b;
  }
  const newBuf = (ch, len, sr) => new AudioBuffer({ numberOfChannels: ch, length: Math.max(1, len), sampleRate: sr });

  /** RBJ biquad, applied in place to a Float32Array. */
  function biquad(x, type, f, q, db, sr) {
    const w = (TAU * Math.min(f, sr * 0.45)) / sr, cw = Math.cos(w), sw = Math.sin(w);
    const A = Math.pow(10, (db || 0) / 40), al = sw / (2 * q);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'lowpass') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
    else if (type === 'highpass') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
    else if (type === 'bandpass') { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al; }
    else if (type === 'peaking') { b0 = 1 + al * A; b1 = -2 * cw; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cw; a2 = 1 - al / A; }
    else { // highshelf
      const s = 2 * Math.sqrt(A) * al;
      b0 = A * (A + 1 + (A - 1) * cw + s); b1 = -2 * A * (A - 1 + (A + 1) * cw); b2 = A * (A + 1 + (A - 1) * cw - s);
      a0 = A + 1 - (A - 1) * cw + s; a1 = 2 * (A - 1 - (A + 1) * cw); a2 = A + 1 - (A - 1) * cw - s;
    }
    b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const xi = x[i];
      const y = b0 * xi + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = xi; y2 = y1; y1 = y;
      x[i] = y;
    }
    return x;
  }
  function peakNorm(chs, target) {
    let pk = 1e-9;
    for (const d of chs) for (let i = 0; i < d.length; i++) pk = Math.max(pk, Math.abs(d[i]));
    const k = target / pk;
    for (const d of chs) for (let i = 0; i < d.length; i++) d[i] *= k;
  }
  function fadeEnds(d, sr, fin, fout) {
    const a = Math.max(1, Math.round(fin * sr)), b = Math.max(1, Math.round(fout * sr));
    for (let i = 0; i < a && i < d.length; i++) d[i] *= i / a;
    for (let i = 0; i < b && i < d.length; i++) d[d.length - 1 - i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / b);
  }

  /** Fill with uniform noise in [−1, 1) (inline xorshift: fast, seeded). */
  function whiteFill(d, seed) {
    let x = (Math.imul(seed | 0, 2654435761) ^ 0x9e3779b9) | 0 || 1;
    for (let i = 0; i < d.length; i++) {
      x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
      d[i] = (x >>> 0) * 4.656612873077393e-10 - 1;
    }
    return d;
  }

  /** 6 s stereo looping noise: 'white' | 'pink' | 'brown'. Seamless, no DC. */
  function noiseBuffer(sr, kind) {
    return cacheCore(`noise:${kind}:${sr}`, () => {
      const len = Math.round(sr * 6), xf = Math.round(sr * 0.08);
      const b = newBuf(2, len, sr);
      for (let ch = 0; ch < 2; ch++) {
        const g = whiteFill(new Float32Array(len + xf), 911 + ch * 77 + kind.length * 13);
        if (kind === 'white') for (let i = 0; i < g.length; i++) g[i] *= 0.6;
        else if (kind === 'pink') {
          let p0 = 0, p1 = 0, p2 = 0, p3 = 0, p4 = 0, p5 = 0, p6 = 0;
          for (let i = 0; i < g.length; i++) {
            const w = g[i];
            p0 = 0.99886 * p0 + w * 0.0555179; p1 = 0.99332 * p1 + w * 0.0750759;
            p2 = 0.969 * p2 + w * 0.153852; p3 = 0.8665 * p3 + w * 0.3104856;
            p4 = 0.55 * p4 + w * 0.5329522; p5 = -0.7616 * p5 - w * 0.016898;
            g[i] = (p0 + p1 + p2 + p3 + p4 + p5 + p6 + w * 0.5362) * 0.12;
            p6 = w * 0.115926;
          }
        } else {
          let br = 0;
          for (let i = 0; i < g.length; i++) { br = (br + 0.02 * g[i]) / 1.02; g[i] = br * 3.2; }
        }
        let mean = 0;
        for (let i = 0; i < g.length; i++) mean += g[i];
        mean /= g.length;
        const d = b.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = g[i] - mean;
        // the loop point continues the sequence: blend the overrun into the head
        for (let i = 0; i < xf; i++) {
          const a = (Math.PI / 2) * (i / xf);
          d[i] = (g[i] - mean) * Math.sin(a) + (g[len + i] - mean) * Math.cos(a);
        }
      }
      return b;
    });
  }

  /** Dark, warm stereo impulse: a wooden hall opening onto night air (~4.5 s). */
  function reverbIR(sr) {
    return cacheCore('ir:' + sr, () => {
      const secs = 4.8, len = Math.round(sr * secs), pre = Math.round(sr * 0.016), rt = 4.0;
      const b = newBuf(2, len, sr);
      const kDecay = Math.exp(-6.9 / (rt * sr)), hk = Math.exp((-TAU * 140) / sr), fade = Math.round(0.09 * sr);
      for (let ch = 0; ch < 2; ch++) {
        const d = b.getChannelData(ch), R = U.rng(4242 + ch * 1013);
        whiteFill(d, 4242 + ch * 1013);
        let l1 = 0, l2 = 0, a = 0, hp = 0, hpx = 0, env = 1;
        for (let i = 0; i < pre; i++) d[i] = 0;
        for (let i = pre; i < len; i++) {
          const n = i - pre;
          if ((n & 31) === 0) a = Math.exp((-TAU * (700 + 6800 * Math.exp(-n / sr / 0.75))) / sr); // highs die first
          l1 = a * l1 + (1 - a) * d[i];
          l2 = a * l2 + (1 - a) * l1;
          const x = n / fade, v = l2 * env * (n < fade ? x * x * (3 - 2 * x) : 1);
          env *= kDecay;
          hp = hk * (hp + v - hpx); hpx = v;   // one-pole high-pass: no mud
          d[i] = hp;
        }
        // early reflections off wooden beams: soft, smeared taps
        for (let k = 0; k < 16; k++) {
          const i0 = pre + Math.round(((5 + k * 5.5 + R() * 5) / 1000) * sr);
          const amp = 0.55 * Math.pow(0.84, k) * (R() < 0.5 ? -1 : 1);
          const w = 10 + Math.round(R() * 8);
          for (let j = 0; j < w && i0 + j < len; j++) d[i0 + j] += (amp * Math.sin((Math.PI * j) / w)) / (w * 0.35);
        }
      }
      // unit energy per channel → wet level is set by the sends
      for (let ch = 0; ch < 2; ch++) {
        const d = b.getChannelData(ch);
        let e = 0;
        for (let i = 0; i < len; i++) e += d[i] * d[i];
        const k = 1 / Math.sqrt(e);
        for (let i = 0; i < len; i++) d[i] *= k;
        fadeEnds(d, sr, 0, 0.3);
      }
      return b;
    });
  }

  /*
   * A paper wall (bed `muffle`): the first-order (6 dB/oct) bilinear low-pass
   *   y[n] = b0·(x[n] + x[n−1]) + p·y[n−1],  k = tan(π·fc/sr), b0 = k/(1+k), p = (1−k)/(1+k)
   * as its impulse response (h0 = b0, h1 = b0(1+p), h_n = p·h_{n−1}), cut at −140 dB, for a ConvolverNode.
   * Measured against createIIRFilter([b0, b0], [1, −p]) on noise: residual −121…−133 dB, zero latency,
   * the same sound. Why not the IIR node: Chrome's createIIRFilter runs seconds of impulse to find its tail
   * time (the cost scales with the sample rate) — ≈ 20 ms of main thread per node at 48 kHz, a dropped frame
   * at every muffled bed's entrance and up to 14 at once on a seek. This is ≈ 0.1 ms. Cached per (rate, Hz).
   */
  function wallIR(sr, hz) {
    const fc = Math.min(Math.max(20, hz), sr * 0.45);
    return cacheCore(`wall:${sr}:${fc.toFixed(1)}`, () => {
      const k = Math.tan((Math.PI * fc) / sr), b0 = k / (1 + k), p = (1 - k) / (1 + k);
      let n = 2;
      for (let h = b0 * (1 + p); Math.abs(h) > 1e-7 * b0 && n < 8192; h *= p) n++;
      const b = newBuf(2, n, sr);
      for (let ch = 0; ch < 2; ch++) {
        const d = b.getChannelData(ch);
        d[0] = b0;
        for (let i = 1, h = b0 * (1 + p); i < n; i++, h *= p) d[i] = h;
      }
      return b;
    });
  }

  /* ------------------------------------------------------------------ */
  /* plucked strings: extended Karplus–Strong, rendered to buffers        */
  /* ------------------------------------------------------------------ */
  const PLUCK = {
    // bright tsume attack, paulownia body, long natural ring
    koto: { gain: 0.7, bright: 0.62, pos: 0.13, sawari: 0, pick: 0.22, second: 0.3, lp: 7000,
      t60: (f) => clamp(5.6 * Math.pow(147 / f, 0.45), 1.8, 6),
      body: [[205, 1.1, 4], [470, 1.3, 3], [1250, 1.8, 2], [3400, 1.0, -4]] },
    // big bachi near the bridge, buzzing sawari, shorter ring
    biwa: { gain: 0.6, bright: 0.72, pos: 0.07, sawari: 0.6, pick: 0.4, second: 0.2, lp: 6200,
      t60: (f) => clamp(4.2 * Math.pow(110 / f, 0.4), 1.6, 4.5),
      body: [[150, 1.0, 5], [410, 1.4, 3.5], [1700, 2.0, 2.5], [4000, 1.0, -5]] },
    // 後摺: the same koto sixty years on — dull strings, more loss, a false beat
    kotoWorn: { gain: 0.74, bright: 0.4, pos: 0.13, sawari: 0, pick: 0.17, second: 0.5, secondDetune: 1.0034, lp: 5200,
      t60: (f) => clamp(2.4 * Math.pow(147 / f, 0.45), 0.9, 2.6),
      body: [[205, 1.1, 4], [470, 1.3, 3], [1250, 1.8, 1], [3400, 1.0, -7]] },
    // a touched-node harmonic: nearly pure, glassy, rings long
    kotoHarm: { gain: 0.36, harm: true, lp: 7000,
      t60: (f) => clamp(4.4 * Math.pow(440 / f, 0.3), 2.4, 5),
      body: [[205, 1.1, 2], [470, 1.3, 2], [1250, 1.8, 1], [3400, 1.0, -6]] },
  };
  /** koto variants live in the same table: koto · kotoWorn · kotoHarm */
  const stringKind = (kind, p) => (kind === 'koto' && p ? (p.harm ? 'kotoHarm' : p.worn ? 'kotoWorn' : 'koto') : kind);

  function ksString(out, sr, f, t60, o, R, amp) {
    const P = sr / f;
    let N = Math.floor(P), d = P - N;
    if (d < 0.1) { N -= 1; d += 1; }
    const C = (1 - d) / (1 + d);                         // all-pass: fractional tuning
    const hf = clamp(lerp(40, 10, o.bright) / f, 0.006, 0.5); // loss grows with frequency
    const a = 1 - hf, h = hf / 2;                        // zero-phase 3-tap loop filter
    const w = (TAU * f) / sr;
    const rho = Math.min(0.99995, Math.pow(10, -3 / (t60 * f)) / (1 - hf * (1 - Math.cos(w))));
    // excitation: noise, low-passed by pluck hardness, comb-filtered by position
    const exc = new Float32Array(N);
    const ea = Math.exp((-TAU * lerp(2500, 9000, o.bright)) / sr);
    let lp = 0, mean = 0;
    for (let i = 0; i < N; i++) { lp = ea * lp + (1 - ea) * (R() * 2 - 1); exc[i] = lp; }
    const pd = Math.max(1, Math.round(o.pos * N));
    for (let i = N - 1; i >= pd; i--) exc[i] -= exc[i - pd];
    for (let i = 0; i < N; i++) mean += exc[i];
    mean /= N;
    let pk = 1e-9;
    for (let i = 0; i < N; i++) { exc[i] -= mean; pk = Math.max(pk, Math.abs(exc[i])); }
    const s = new Float32Array(out.length);
    const bar = o.sawari ? lerp(0.9, 0.28, o.sawari) : 0;
    let u1 = 0, w1 = 0;
    for (let n = 0; n < s.length; n++) {
      let u = 0;
      if (n >= N) u = rho * (a * s[n - N] + h * ((n > N ? s[n - N - 1] : 0) + s[n - N + 1]));
      const wv = C * u + u1 - C * w1;
      u1 = u; w1 = wv;
      let v = wv + (n < N ? exc[n] / pk : 0);
      if (bar && v < -bar) v = -bar + (v + bar) * 0.18;  // sawari: string grazes the bridge
      s[n] = v;
    }
    for (let n = 0; n < s.length; n++) out[n] += amp * s[n];
  }

  function pluckBuffer(sr, midi, kind) {
    return cacheLru(`pluck:${kind}:${midi}:${sr}`, () => {
      const o = PLUCK[kind], f = mtof(midi);
      const R = U.rng(midi * 131 + kind.length);
      const t60 = o.t60(f);
      const len = Math.round(sr * Math.min(5.5, t60 * 0.7 + 0.3));
      const x = new Float32Array(len);
      if (o.harm) {
        // the finger rests on the node as the nail plucks: the octave rings almost pure
        const tau = t60 / 6.9;
        [[1, 1, 1], [2, 0.1, 0.55], [3, 0.035, 0.4], [4, 0.012, 0.3]].forEach(([k, a, dk]) => addPartial(x, sr, 0, f * k, a, tau * dk, 0.0035));
        ksString(x, sr, f, t60 * 0.6, { bright: 0.06, pos: 0.25, sawari: 0 }, R, 0.16);
        const nk = Math.round(sr * 0.004);
        let lp = 0;
        for (let i = 0; i < nk; i++) { lp += 0.25 * (R() * 2 - 1 - lp); x[i] += 0.1 * lp * Math.sin((Math.PI * i) / nk); }
      } else {
        ksString(x, sr, f, t60, o, R, 1);
        if (o.second) ksString(x, sr, f * (o.secondDetune || 1.0011), t60 * 0.8, o, R, o.second); // second polarisation
        const nk = Math.round(sr * 0.005);                   // the nail / plectrum itself
        for (let i = 0; i < nk; i++) x[i] += o.pick * (R() * 2 - 1) * Math.pow(1 - i / nk, 2);
      }
      peakNorm([x], 0.9);
      fadeEnds(x, sr, 0.0005, 0.25);
      const b = newBuf(1, len, sr);
      b.copyToChannel(x, 0);
      return b;
    });
  }

  /* ------------------------------------------------------------------ */
  /* bell bunches (suzu) and wood clacks (hyoshigi), rendered to buffers  */
  /* ------------------------------------------------------------------ */
  /** Adds a decaying sinusoid (cheap recursive oscillator). */
  function addPartial(d, sr, i0, f, amp, tau, att) {
    const w = (TAU * f) / sr;
    if (w >= Math.PI * 0.95) return;
    const k = 2 * Math.cos(w), dk = Math.exp(-1 / (tau * sr)), na = Math.max(1, Math.round(att * sr));
    let y1 = Math.sin(-w), y2 = Math.sin(-2 * w), env = amp, n = 0;
    for (; i0 + n < d.length; n++) {
      const y = k * y1 - y2;
      y2 = y1; y1 = y;
      d[i0 + n] += y * env * (n < na ? n / na : 1);
      env *= dk;
      if (env < amp * 1e-3) break;
    }
    return i0 + n;
  }

  function suzuBuffer(sr, variant, count, spread, base, bright) {
    return cacheLru(`suzu:${variant}:${count}:${spread}:${Math.round(base)}:${bright}:${sr}`, () => {
      const R = U.rng(3301 + variant * 97);
      const len = Math.round(sr * (spread + 1.1));
      const b = newBuf(2, len, sr), L = b.getChannelData(0), Rt = b.getChannelData(1), m = new Float32Array(len);
      for (let k = 0; k < count; k++) {
        const f = base * lerp(0.78, 1.55, R()), pan = R() * 1.6 - 0.8;
        const gl = Math.cos(((pan + 1) * Math.PI) / 4), gr = Math.sin(((pan + 1) * Math.PI) / 4);
        const dec = lerp(0.09, 0.2, R());   // small cast bells: T60 ≈ 0.6–1.4 s
        const hits = 1 + (R() < 0.6 ? 1 : 0) + (R() < 0.3 ? 1 : 0);
        let lo = len, hi = 0;
        for (let h = 0; h < hits; h++) {
          const i0 = Math.round(sr * spread * Math.pow(R(), 1.3));
          const amp = lerp(0.35, 1, R()) * (h ? 0.55 : 1);
          lo = Math.min(lo, i0);
          for (const [r, a, dk] of [[1, 1, 1], [2.41, 0.4, 0.45], [3.93, 0.16, 0.25]]) {
            hi = Math.max(hi, addPartial(m, sr, i0, f * r, amp * a, dec * dk, 0.0012));
          }
        }
        for (let i = lo; i < hi; i++) { L[i] += gl * m[i]; Rt[i] += gr * m[i]; m[i] = 0; }
      }
      for (const d of [L, Rt]) {
        biquad(d, 'highshelf', 6500, 0.7, lerp(-9, -2, bright), sr);
        biquad(d, 'highpass', 900, 0.7, 0, sr);
      }
      peakNorm([L, Rt], 0.8);
      fadeEnds(L, sr, 0.0005, 0.2); fadeEnds(Rt, sr, 0.0005, 0.2);
      return b;
    });
  }

  function clackBuffer(sr, variant) {
    return cacheLru(`clack:${variant}:${sr}`, () => {
      const R = U.rng(700 + variant * 31);
      const len = Math.round(sr * 0.32), d = new Float32Array(len);
      const f1 = 1180 * (1 + (R() - 0.5) * 0.06), f2 = f1 * lerp(1.08, 1.16, R());
      for (const [f, g] of [[f1, 1], [f2, 0.8]]) {           // two oak blocks, both ring
        addPartial(d, sr, 0, f, g, 0.055, 0.0004);
        addPartial(d, sr, 0, f * 2.76, g * 0.32, 0.024, 0.0003);
        addPartial(d, sr, 0, f * 5.4, g * 0.12, 0.011, 0.0002);
      }
      addPartial(d, sr, 0, 430, 0.35, 0.018, 0.0008);          // the knock of the hands
      const nk = Math.round(sr * 0.0025);
      for (let i = 0; i < nk; i++) d[i] += 0.9 * (R() * 2 - 1) * Math.sin((Math.PI * i) / nk);
      biquad(d, 'highpass', 180, 0.7, 0, sr);
      biquad(d, 'highshelf', 6000, 0.7, -6, sr);
      peakNorm([d], 0.9);
      fadeEnds(d, sr, 0.0003, 0.05);
      const b = newBuf(1, len, sr);
      b.copyToChannel(d, 0);
      return b;
    });
  }

  /* ------------------------------------------------------------------ */
  /* graph: master chain per context, one session (+ reverb) per play     */
  /* ------------------------------------------------------------------ */
  const TRIM = 0.62;           // after the compressor's automatic make-up gain
  function softClipCurve() {
    const n = 4097, c = new Float32Array(n), knee = 0.7, top = 0.88;
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1, ax = Math.abs(x);
      const y = ax <= knee ? ax : knee + (top - knee) * Math.tanh((ax - knee) / (top - knee));
      c[i] = Math.sign(x) * y;
    }
    return c;
  }

  /** music → hp → shelf → compressor → trim → safety clip → auto (score master) → mute → out */
  function makeGraph(ctx) {
    const G = { ctx, sr: ctx.sampleRate };
    const gain = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
    const filt = (type, f, q, db) => {
      const b = ctx.createBiquadFilter();
      b.type = type; b.frequency.value = f; b.Q.value = q; b.gain.value = db || 0;
      return b;
    };
    G.music = gain(1);
    const hp = filt('highpass', 28, 0.6);
    const shelf = filt('highshelf', 8500, 0.7, -2.5);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 14; comp.ratio.value = 2.4;
    comp.attack.value = 0.02; comp.release.value = 0.4;
    const trim = gain(TRIM);
    const clip = ctx.createWaveShaper();
    clip.curve = softClipCurve();
    clip.oversample = 'none';
    G.auto = gain(1);          // TSUKI.SCORE.master: after everything, so 0 is digital silence
    G.mute = gain(1);
    G.music.connect(hp); hp.connect(shelf); shelf.connect(comp); comp.connect(trim);
    trim.connect(clip); clip.connect(G.auto); G.auto.connect(G.mute); G.mute.connect(ctx.destination);
    return G;
  }

  /** The score's master curve [[t, gain], ...] (linear between points) at film time t. */
  function masterAt(pts, t) {
    if (!pts || !pts.length) return 1;
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (t < pts[i][0]) {
        const [a, va] = pts[i - 1], [b, vb] = pts[i];
        return b <= a ? vb : va + ((vb - va) * (t - a)) / (b - a);
      }
    }
    return pts[pts.length - 1][1];
  }
  /** Schedule the master curve from film time T0 (ctx time of film t = c(t)); glide from the current value. */
  function scheduleMaster(param, pts, T0, c, now, glide) {
    param.cancelScheduledValues(now);
    const v0 = masterAt(pts, T0);
    if (glide > 0) { param.setValueAtTime(param.value, now); param.linearRampToValueAtTime(v0, now + glide); }
    else param.setValueAtTime(v0, now);
    for (const [t, v] of pts || []) {
      if (t > T0 && c(t) > now + glide) param.linearRampToValueAtTime(v, c(t));
    }
  }

  /** A session is everything started by one play(); killed as a whole. */
  function makeSession(G) {
    const ctx = G.ctx;
    const S = { G, voices: [], beds: [], dead: false };
    S.out = ctx.createGain();
    S.out.connect(G.music);
    S.send = ctx.createGain();
    S.conv = ctx.createConvolver();
    S.conv.normalize = false;
    S.conv.buffer = reverbIR(G.sr);
    S.room = ctx.createGain();          // the reverb return: TSUKI.SCORE.room can hold the air's breath
    S.send.connect(S.conv);
    S.conv.connect(S.room);
    S.room.connect(S.out);
    return S;
  }

  function stopKit(K, t) {
    for (const s of K.srcs) { try { s.stop(t); } catch (e) { /* already finished */ } }
  }
  function freeKit(K) {
    if (K.freed) return;
    K.freed = true;
    for (const n of K.nodes) { try { n.disconnect(); } catch (e) { /* gone */ } }
  }
  /** Disconnect a kit's nodes once all its sources have ended. */
  function autoFree(K) {
    let n = K.srcs.length;
    if (!n) { freeKit(K); return K; }
    for (const s of K.srcs) s.onended = () => { if (--n <= 0) freeKit(K); };
    return K;
  }

  function killSession(S, fade) {
    if (!S || S.dead) return;
    S.dead = true;
    const ctx = S.G.ctx, now = ctx.currentTime, g = S.out.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0, now + fade);
    const stopAt = now + fade + 0.02;
    for (const v of S.voices) stopKit(v, stopAt);
    for (const b of S.beds) b.stop(stopAt);
    setTimeout(() => {
      for (const v of S.voices) freeKit(v);
      for (const b of S.beds) b.free();
      for (const n of [S.out, S.send, S.conv, S.room]) { try { n.disconnect(); } catch (e) { /* gone */ } }
    }, (fade + 0.2) * 1000);
  }

  /* ------------------------------------------------------------------ */
  /* kit: node factory that remembers what it made (for stop + cleanup)   */
  /* ------------------------------------------------------------------ */
  const waveCache = new WeakMap();
  const WAVES = {
    shakuhachi: [0, 1, 0.3, 0.16, 0.08, 0.05, 0.025, 0.015],
    sho: [0, 1, 0.62, 0.5, 0.36, 0.3, 0.22, 0.16, 0.12, 0.08, 0.06, 0.045, 0.03],
  };
  function wave(ctx, name) {
    let m = waveCache.get(ctx);
    if (!m) waveCache.set(ctx, (m = {}));
    if (!m[name]) {
      const im = Float32Array.from(WAVES[name]);
      m[name] = ctx.createPeriodicWave(new Float32Array(im.length), im);
    }
    return m[name];
  }

  /*
   * Pin a node to stereo. Otherwise, when a stereo branch (noise) finishes,
   * Chrome drops it from the channel count, the voice turns mono and the
   * StereoPanner jumps from pass-through to equal-power (−3 dB click).
   */
  function stereo(n) {
    n.channelCount = 2;
    n.channelCountMode = 'explicit';
    n.channelInterpretation = 'speakers';
    return n;
  }

  /** StereoPanner on a stereo input is a balance control: keep power equal. */
  const panComp = (p) => 1 / Math.sqrt(1 + Math.sin((clamp(Math.abs(p || 0)) * Math.PI) / 2));

  function kit(ctx, out) {
    const K = { ctx, out, nodes: [], srcs: [], end: 0 };
    const reg = (n) => { K.nodes.push(n); return n; };
    K.gain = (v = 0) => { const g = reg(ctx.createGain()); g.gain.value = v; return g; };
    K.filter = (type, f, q = 0.707, db = 0) => {
      const b = reg(ctx.createBiquadFilter());
      b.type = type; b.frequency.value = Math.min(f, ctx.sampleRate * 0.45); b.Q.value = q; b.gain.value = db;
      return b;
    };
    K.pan = (p) => { const n = reg(ctx.createStereoPanner()); n.pan.value = clamp(p || 0, -1, 1); return n; };
    K.osc = (type, f, t0) => {
      const o = reg(ctx.createOscillator());
      if (typeof type === 'string') o.type = type; else o.setPeriodicWave(type);
      o.frequency.value = f;
      o.start(Math.max(0, t0));
      K.srcs.push(o);
      return o;
    };
    K.buf = (buffer, t0, o = {}) => {
      const s = reg(ctx.createBufferSource());
      s.buffer = buffer;
      if (o.loop) s.loop = true;
      if (o.rate) s.playbackRate.value = o.rate;
      s.start(Math.max(0, t0), o.offset || 0);
      if (o.stop) { s.stop(o.stop); s._stop = true; }
      K.srcs.push(s);
      return s;
    };
    /** looping stereo noise, entering the loop at a seeded point */
    K.noise = (kind, t0, seed = 0) => K.buf(noiseBuffer(ctx.sampleRate, kind), t0, { loop: true, offset: ((Math.abs(Math.round(seed)) % 1009) / 1009) * 5.5 });
    K.chain = (...ns) => { for (let i = 0; i < ns.length - 1; i++) ns[i].connect(ns[i + 1]); return ns[ns.length - 1]; };
    K.done = (end) => {
      K.end = Math.max(K.end, end);
      for (const s of K.srcs) if (!s._stop) { s.stop(Math.max(0, K.end)); s._stop = true; }
      return K;
    };
    return K;
  }

  /* ------------------------------------------------------------------ */
  /* envelopes that can start part-way through (resume after a seek)      */
  /* ------------------------------------------------------------------ */
  /*
   * pts, relative to the note start: [t, v] = linear ramp arriving at v at t;
   * [t, v, tau] = from t, glide exponentially toward v (time-constant tau).
   * A target segment runs until the next target node; use targets last.
   */
  function envVal(pts, x) {
    let pt = pts[0][0], pv = pts[0][1], tv = null, tau = 1;
    const at = (t) => (tv === null ? pv : tv + (pv - tv) * Math.exp(-(t - pt) / tau));
    if (x <= pt) return pv;
    for (let i = 1; i < pts.length; i++) {
      const [t, v, k] = pts[i];
      if (k) {
        if (x <= t) return at(x);
        pv = at(t); pt = t; tv = v; tau = k;
      } else {
        tv = null;
        if (x <= t) return t <= pt ? v : pv + ((v - pv) * (x - pt)) / (t - pt);
        pv = v; pt = t;
      }
    }
    return at(x);
  }
  /** Schedule pts on param; `when` is the ctx time of local time `off`. */
  function applyEnv(param, when, pts, off = 0) {
    const T = (t) => when + Math.max(0, t - off);
    param.setValueAtTime(envVal(pts, off), when);
    for (let i = 1; i < pts.length; i++) {
      const [t, v, k] = pts[i], nx = pts[i + 1];
      if (k) {
        if (nx && !nx[2]) { if (t > off) param.setValueAtTime(envVal(pts, t), T(t)); continue; }
        if (t <= off) { if (!nx || nx[0] > off) param.setTargetAtTime(v, when, k); }
        else param.setTargetAtTime(v, T(t), k);
      } else if (t > off) param.linearRampToValueAtTime(v, T(t));
    }
  }

  /* ------------------------------------------------------------------ */
  /* instruments                                                         */
  /* ------------------------------------------------------------------ */
  const INST = {};
  /**
   * Register an instrument. fn(ctx, dest, when, p) builds the sound into
   * dest and returns its kit; p.off > 0 asks it to start part-way through.
   * len(p) → how long it sounds (s), used to resume it after a seek.
   */
  function inst(name, defaults, fn, len) {
    INST[name] = { name, defaults, fn, len: len || ((p) => def(p.dur, 2)), resumable: !!defaults.resumable, sustained: !!defaults.sustained };
  }
  /** keep envelope times non-decreasing */
  function mono(pts) {
    for (let i = 1; i < pts.length; i++) if (pts[i][0] < pts[i - 1][0]) pts[i][0] = pts[i - 1][0];
    return pts;
  }

  /* ---------- koto / biwa: plucked strings ---------- */
  function pitchMoves(K, param, t0, base, p) {
    param.setValueAtTime(base, t0);
    let c = base;
    if (p.press) {                               // oshi-iro: press behind the bridge
      const a = t0 + def(p.pressAt, 0.18), d = def(p.pressTime, 0.12), to = c + p.press * 100;
      param.setValueAtTime(c, a);
      param.linearRampToValueAtTime(c + (to - c) * 0.75, a + d * 0.5);
      param.linearRampToValueAtTime(to, a + d);
      if (p.pressHold !== undefined) {           // …and let go again
        const b = a + d + p.pressHold;
        param.setValueAtTime(to, b);
        param.linearRampToValueAtTime(c, b + d);
      } else c = to;
    }
    if (p.slide) {                               // glide (hiki-iro when negative)
      const a = t0 + def(p.slideAt, 0.06), d = def(p.slideTime, 0.45);
      param.setValueAtTime(c, a);
      param.linearRampToValueAtTime(c + p.slide * 100, a + d);
    }
    if (p.vib) {                                 // yuri-iro: vibrato by pressing
      const at = def(p.vibAt, 0.3);
      const lfo = K.osc('sine', def(p.vibRate, 5.2), t0);
      const dg = K.gain(0);
      applyEnv(dg.gain, t0, [[0, 0], [at, 0], [at + 0.4, p.vib]]);
      lfo.connect(dg);
      dg.connect(param);
    }
  }

  /** The wooden body (and a DC guard for sawari): one chain per event. */
  function bodyChain(K, kind) {
    const o = PLUCK[kind], ns = [K.filter('highpass', 55, 0.7)];
    for (const [bf, bq, bg] of o.body) ns.push(K.filter(bg < 0 && bf > 3000 ? 'highshelf' : 'peaking', bf, bq, bg));
    ns.push(K.filter('lowpass', o.lp, 0.6));
    K.chain(...ns, K.out);
    return ns[0];
  }

  /** One pluck from a cached string buffer. until → damp with the hand. */
  function pluck(K, kind, m, t0, p, vel, until, off = 0, dampTau = 0.06) {
    const mi = Math.round(m);
    const buf = pluckBuffer(K.ctx.sampleRate, mi, kind);
    const R = U.rng(p.seed + mi * 7 + Math.round(t0 * 100));
    const s = K.buf(buf, t0, { offset: Math.min(off, buf.duration - 0.05) });
    pitchMoves(K, s.detune, t0, (m - mi) * 100 + def(p.detune, 0) + (R() - 0.5) * 6, p);
    const g = K.gain(0);
    const amp = Math.pow(clamp(vel, 0.02, 1), 1.5) * PLUCK[kind].gain;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(amp, t0 + 0.0015);
    s.connect(g);
    g.connect(K.body || K.out);
    let end = t0 + buf.duration - off;
    if (until !== undefined && until < end) {
      g.gain.setValueAtTime(amp, until);
      g.gain.setTargetAtTime(0, until, dampTau);
      end = until + dampTau * 7;
    }
    s.stop(end);
    s._stop = true;
    K.end = Math.max(K.end, end);
  }

  function tremolo(K, kind, m, t0, p, vel) {
    const dur = def(p.dur, 1.6), rate = def(p.tremRate, 11);
    const n = Math.max(2, Math.round(dur * rate));
    const R = U.rng(p.seed + 5);
    const shape = p.tremShape || 'swell';
    const times = [];
    for (let i = 0; i < n; i++) times.push(t0 + i / rate + (i ? (R() - 0.5) * 0.014 : 0));
    const q = Object.assign({}, p, { press: 0, slide: 0, vib: 0 });
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) / n;
      const sh = shape === 'fade' ? 1 - 0.6 * x : shape === 'grow' ? 0.45 + 0.55 * x : shape === 'even' ? 1 : lerp(0.5, 1, Math.sin(Math.PI * x));
      const v = vel * sh * lerp(0.86, 1, R()) * (i % 2 ? 0.88 : 1);   // alternating strokes
      const until = i < n - 1 ? times[i + 1] + 0.004 : p.damp ? times[i] + p.damp : undefined;
      pluck(K, kind, m, times[i], q, v, until, 0, 0.018);
    }
  }

  /** the bachi slapping the biwa's belly */
  function bachi(K, t0, amt, seed) {
    const n = K.noise('white', t0, seed);
    const bp = K.filter('bandpass', 620, 0.9), lp = K.filter('lowpass', 2400, 0.7), g = K.gain(0);
    applyEnv(g.gain, t0, [[0, 0], [0.0015, amt], [0.0015, 0, 0.016]]);
    K.chain(n, bp, lp, g, K.out);
    n.stop(t0 + 0.25);
    n._stop = true;
  }

  function stringInst(inst) {
    return (ctx, dest, when, p) => {
      const K = kit(ctx, dest), kind = stringKind(inst, p);
      K.body = bodyChain(K, kind);
      const notes = noteList(def(p.note, kind === 'biwa' ? 'D3' : 'D4'));
      const vel = clamp(def(p.vel, 0.7));
      const sp = def(p.strum, notes.length > 1 ? (kind === 'biwa' ? 28 : 45) : 0);
      const order = sp < 0 ? notes.slice().reverse() : notes;
      const gap = Math.abs(sp) / 1000, off = p.off || 0;
      order.forEach((m, i) => {
        const t0 = when + i * gap, v = vel * (1 - 0.05 * i);
        if (p.trem) tremolo(K, kind, m, t0, p, v);
        else pluck(K, kind, m, t0, p, v, p.dur !== undefined ? t0 + p.dur - off : undefined, off);
      });
      if (kind === 'biwa' && !off) {
        const st = def(p.strike, 0.5);
        if (st > 0) bachi(K, when, 0.9 * st * Math.pow(vel, 1.3), p.seed);
      }
      return K.done(K.end);
    };
  }
  const stringLen = (inst) => (p) => {
    const ms = noteList(def(p.note, 'D4'));
    return p.dur !== undefined ? p.dur + 0.4 : PLUCK[stringKind(inst, p)].t60(mtof(Math.min(...ms))) * 0.8 + 0.3;
  };
  inst('koto', { rev: 0.28, resumable: true }, stringInst('koto'), stringLen('koto'));
  inst('biwa', { rev: 0.34, resumable: true }, stringInst('biwa'), stringLen('biwa'));

  /* ---------- shakuhachi: breath, bamboo, loneliness ---------- */
  const FLUTTER = 20;   // brown noise below 9 Hz has σ ≈ 0.042 → ~unit scale
  inst('shakuhachi', { rev: 0.42, dur: 2.5, resumable: true, sustained: true }, (ctx, dest, when, p) => {
    const K = kit(ctx, dest);
    const m = noteList(def(p.note, 'A4'))[0], f = mtof(m);
    const vel = clamp(def(p.vel, 0.6), 0.05, 1);
    const att = def(p.attack, lerp(0.2, 0.08, vel));
    const dur = Math.max(att + 0.12, def(p.dur, 2.5));
    const rel = def(p.release, 0.4), off = p.off || 0;
    const tone = clamp(def(p.tone, 0.5)), kan = clamp((m - 64) / 20);
    const yuri = !!p.yuri, mur = clamp(def(p.muraiki, 0.3));
    const end = when + dur + rel * 1.5 - off;

    // pitch (cents): scoop from below (meri / kari approach), bends, fall
    const bf = def(p.bendFrom, -0.3) * 100, bt = def(p.bendTime, Math.abs(bf) > 60 ? 0.32 : 0.12);
    const dp = [[0, bf], [bt * 0.45, bf * 0.3], [bt, 0]];
    let last = 0;
    for (const [dt, semi] of (p.bends || []).slice().sort((x, y) => x[0] - y[0])) {
      if (dt > bt && dt < dur) { dp.push([dt, semi * 100]); last = semi * 100; }
    }
    dp.push([dur, last]);
    if (p.fall) dp.push([dur + rel, last + p.fall * 100]);
    const pitch = mono(dp), air = !!p.air;          // air: a breath-only sob, no tone
    const a = 0.19 * Math.pow(vel, 1.2), sw = def(p.swell, 0.25);
    const flut = K.gain(1);
    let o = null;
    if (!air) {
      // tone: bamboo core → air-filter → flutter → swell envelope
      o = K.osc(wave(ctx, 'shakuhachi'), f, when);
      applyEnv(o.detune, when, pitch, off);
      const lp = K.filter('lowpass', f * lerp(2.5, 6, tone) * (1 + kan) + 400, 0.4);
      const env = K.gain(0);
      applyEnv(env.gain, when, mono([[0, 0], [att, a * 0.8], [Math.max(att + 0.05, dur * 0.6), a * (0.85 + sw)],
        [dur, a * (0.8 + sw * 0.6)], [dur, 0, rel / 5]]), off);
      K.chain(o, lp, flut, env, K.out);
    }

    // breath: pitched hollow noise (following the bends) + high air; muraiki bursts at the attack
    const nz = K.noise('white', when, p.seed);
    const bp = K.filter('bandpass', f, air ? 3.5 : 6), hp = K.filter('highpass', 1400, 0.5), blp = K.filter('lowpass', air ? 4000 : 4800, 0.5);
    applyEnv(bp.detune, when, pitch, off);
    const g1 = K.gain(air ? 14 : 8), g2 = K.gain((1.0 + mur) * (air ? 0.7 : 1)), benv = K.gain(0);
    nz.connect(bp); bp.connect(g1); g1.connect(benv);
    nz.connect(hp); hp.connect(blp); blp.connect(g2); g2.connect(benv);
    benv.connect(air ? flut : K.out);
    if (air) flut.connect(K.out);
    const bpk = a * (0.3 + 1.5 * mur), bs = air ? a * 0.75 : a * lerp(0.14, 0.32, 1 - tone);
    applyEnv(benv.gain, when, mono([[0, 0], [Math.min(att * 0.5, 0.06) + 0.012, bpk], [Math.min(att + 0.3, dur - 0.02), bs],
      [dur, bs], [dur, 0, rel / 4]]), off);

    // life: slow amplitude flutter and pitch drift from the player's breath
    const fl = K.noise('brown', when, p.seed + 7), flp = K.filter('lowpass', 9, 0.5);
    const fg = K.gain(0.05 * FLUTTER), dg = K.gain(5 * FLUTTER);
    fl.connect(flp); flp.connect(fg); fg.connect(flut.gain); flp.connect(dg); dg.connect(bp.detune);
    if (o) dg.connect(o.detune);

    // vibrato arrives late (or yuri: slow, deep head-shake)
    const vd = def(p.vibDelay, yuri ? 0.15 : Math.min(0.8, dur * 0.45));
    const lfo = K.osc('sine', def(p.vibRate, yuri ? 2.9 : 4.8), when), vg = K.gain(0);
    applyEnv(vg.gain, when, mono([[0, 0], [vd, 0], [Math.max(vd + 0.3, dur * 0.9), def(p.vib, yuri ? 45 : 14)]]), off);
    lfo.connect(vg); vg.connect(bp.detune);
    if (o) vg.connect(o.detune);
    if (yuri) { const ag = K.gain(0.14); lfo.connect(ag); ag.connect(flut.gain); }
    return K.done(end);
  }, (p) => def(p.dur, 2.5) + def(p.release, 0.4) * 1.5);

  /* ---------- bells: bonsho (temple), rin (singing bowl) ---------- */
  /** Inharmonic partials, each split in two for slow beating (うなり). */
  function bell(K, when, off, f, partials, o) {
    const mix = K.gain(o.gain);
    for (const [r, a, ds, sp] of partials) {
      const fr = f * r;
      if (fr > 12000) continue;
      const tau = (o.decay * ds) / 6.9, att = r < 1.2 ? o.att : o.att * 0.4;
      for (const [df, w] of sp ? [[(-sp * o.beat) / 2, 1], [(sp * o.beat) / 2, 0.72]] : [[0, 1.72]]) {
        const osc = K.osc('sine', fr + df, when), g = K.gain(0);
        applyEnv(g.gain, when, [[0, 0], [att, a * w], [att, 0, tau]], off);
        osc.connect(g);
        g.connect(mix);
      }
    }
    return mix;
  }
  // [ratio, amp, decay scale, split Hz]
  const BONSHO = [[0.5, 0.45, 1.15, 0.35], [1, 1, 1, 0.9], [2.03, 0.6, 0.72, 1.7], [2.76, 0.5, 0.55, 0.6], [3.51, 0.36, 0.42, 2.3],
    [4.18, 0.3, 0.33, 1.2], [5.43, 0.22, 0.24, 3.1], [6.72, 0.15, 0.17, 2.0], [8.1, 0.1, 0.12, 2.7], [10.2, 0.06, 0.09, 3.5],
    [12.6, 0.04, 0.07, 4.2]];
  const RIN = [[1, 1, 1, 0.7], [2.74, 0.42, 0.55, 1.4], [5.18, 0.18, 0.3, 2.2], [8.4, 0.07, 0.18, 3.3]];
  // the dawn bell of the sound bible: 0.5 1 1.18 1.5 2.0 2.74 3.76 over the hum; only the
  // hum pair is split (0.7 Hz 唸り). With note D4 the hum is D3 and the 2.0 partial is D5.
  const BONSHO_DAWN = [[0.5, 0.6, 1.35, 0.7], [1, 1, 1, 0], [1.18, 0.4, 0.7, 0], [1.5, 0.46, 0.75, 0],
    [2.0, 0.58, 0.9, 0], [2.74, 0.28, 0.45, 0], [3.76, 0.16, 0.3, 0]];

  inst('bonsho', { rev: 0.45, resumable: true }, (ctx, dest, when, p) => {
    const K = kit(ctx, dest);
    const f = freqOf(def(p.note, 'G2')), vel = clamp(def(p.vel, 0.7)), off = p.off || 0;
    const decay = def(p.decay, 16), bright = clamp(def(p.bright, 0.5));
    const parts = Array.isArray(p.partials) ? p.partials : p.partials === 'dawn' ? BONSHO_DAWN : BONSHO;
    const lp = K.filter('lowpass', lerp(1600, 5200, bright), 0.5);
    const mix = bell(K, when, off, f, parts, { gain: 0.085 * Math.pow(vel, 1.1), decay, beat: def(p.beat, 1), att: 0.03 });
    mix.connect(lp);
    lp.connect(K.out);
    if (off < 0.05) {
      // shumoku: a swung wooden beam — soft thud, faint metallic splash
      const th = K.noise('brown', when, p.seed), tl = K.filter('lowpass', 240, 0.7), tg = K.gain(0);
      applyEnv(tg.gain, when, [[0, 0], [0.005, 1.2 * vel], [0.005, 0, 0.035]]);
      K.chain(th, tl, tg, K.out);
      const sp = K.noise('white', when, p.seed + 3), sb = K.filter('bandpass', 2100, 1.2), sg = K.gain(0);
      applyEnv(sg.gain, when, [[0, 0], [0.003, 0.06 * vel * (0.5 + bright)], [0.003, 0, 0.02]]);
      K.chain(sp, sb, sg, K.out);
      th.stop(when + 0.5); th._stop = true;
      sp.stop(when + 0.3); sp._stop = true;
    }
    return K.done(when + decay * 1.25 - off);
  }, (p) => def(p.decay, 16) * 1.25);

  inst('rin', { rev: 0.4, resumable: true }, (ctx, dest, when, p) => {
    const K = kit(ctx, dest);
    const f = freqOf(def(p.note, 'A5')), vel = clamp(def(p.vel, 0.6)), off = p.off || 0;
    const decay = def(p.decay, 9);
    const sh = K.filter('highshelf', 5000, 0.7, -5);
    const mix = bell(K, when, off, f, RIN, { gain: 0.09 * Math.pow(vel, 1.1), decay, beat: def(p.beat, 1), att: 0.004 });
    mix.connect(sh);
    sh.connect(K.out);
    if (off < 0.05) {
      const n = K.noise('white', when, p.seed), b = K.filter('bandpass', 4200, 1.5), g = K.gain(0);
      applyEnv(g.gain, when, [[0, 0], [0.001, 0.05 * vel], [0.001, 0, 0.004]]);
      K.chain(n, b, g, K.out);
      n.stop(when + 0.1); n._stop = true;
    }
    return K.done(when + decay * 1.2 - off);
  }, (p) => def(p.decay, 9) * 1.2);

  /* ---------- suzu: kagura bells ---------- */
  /** the buffer arguments of shake i (shared with prewarm) */
  const suzuArgs = (p, i) => [Math.abs(Math.round(p.seed) + i) % 8, Math.round(def(p.count, 14)), def(p.spread, 0.14),
    p.note !== undefined ? freqOf(p.note) : 3300, Math.round(clamp(def(p.bright, 0.5)) * 4) / 4];
  inst('suzu', { rev: 0.35 }, (ctx, dest, when, p) => {
    const K = kit(ctx, dest);
    const vel = clamp(def(p.vel, 0.6)), shakes = Math.max(1, Math.round(def(p.shakes, 1))), rate = def(p.rate, 3.2);
    const R = U.rng(p.seed);
    for (let i = 0; i < shakes; i++) {
      const buf = suzuBuffer(ctx.sampleRate, ...suzuArgs(p, i));
      const t = when + i / rate + (i ? (R() - 0.5) * 0.03 : 0);
      const s = K.buf(buf, t, { rate: 1 + (R() - 0.5) * 0.02 });
      const g = K.gain(0.48 * Math.pow(vel, 1.2) * (i % 2 ? 0.8 : 1) * lerp(0.85, 1, R()));
      s.connect(g);
      g.connect(K.out);
      K.end = Math.max(K.end, t + buf.duration + 0.05);
    }
    return K.done(K.end);
  }, (p) => def(p.shakes, 1) / def(p.rate, 3.2) + 1.5);

  /* ---------- taiko (distant ōdaiko), kotsuzumi ---------- */
  inst('taiko', { rev: 0.4, dist: 0.3 }, (ctx, dest, when, p) => {
    const K = kit(ctx, dest);
    const f = freqOf(def(p.note, 'A1')), vel = clamp(def(p.vel, 0.7)), decay = def(p.decay, 1.1);
    const a = 0.5 * Math.pow(vel, 1.3);
    const lp = K.filter('lowpass', lerp(900, 2600, vel), 0.6);
    lp.connect(K.out);
    if (p.rim) {                                  // fuchi: the rim, a dry "ka"
      const s = K.buf(clackBuffer(ctx.sampleRate, 5), when, { rate: 0.6 });
      const g = K.gain(a * 0.6);
      K.chain(s, g, lp);
      return K.done(when + 0.6);
    }
    const o = K.osc('sine', f * 1.9, when), g = K.gain(0);
    o.frequency.setValueAtTime(f * 1.9, when);
    o.frequency.exponentialRampToValueAtTime(f * 1.04, when + 0.06);
    o.frequency.exponentialRampToValueAtTime(f * 0.96, when + decay);
    applyEnv(g.gain, when, [[0, 0], [0.004, a], [0.004, 0, decay * 0.26]]);
    K.chain(o, g, lp);
    const o2 = K.osc('sine', f * 1.62 * 1.5, when), g2 = K.gain(0);
    o2.frequency.setValueAtTime(f * 1.62 * 1.5, when);
    o2.frequency.exponentialRampToValueAtTime(f * 1.62, when + 0.05);
    applyEnv(g2.gain, when, [[0, 0], [0.003, a * 0.3], [0.003, 0, 0.08]]);
    K.chain(o2, g2, lp);
    const n = K.noise('white', when, p.seed), nl = K.filter('lowpass', 700, 0.7), ng = K.gain(0);
    applyEnv(ng.gain, when, [[0, 0], [0.002, a * 0.6], [0.002, 0, 0.025]]);
    K.chain(n, nl, ng, lp);
    return K.done(when + decay * 2);
  }, (p) => def(p.decay, 1.1) * 2);

  // stroke: [start Hz, end Hz, decay s, noise]
  const TSUZUMI = { pon: [520, 340, 0.5, 0.25], ta: [950, 880, 0.07, 1], chi: [760, 700, 0.12, 0.45], pu: [360, 320, 0.1, 0.3] };
  inst('kotsuzumi', { rev: 0.42 }, (ctx, dest, when, p) => {
    const K = kit(ctx, dest);
    const [f0, f1, dec, nz] = TSUZUMI[p.stroke] || TSUZUMI.pon;
    const k = p.note !== undefined ? freqOf(p.note) / f0 : 1;
    const vel = clamp(def(p.vel, 0.7)), a = 0.28 * Math.pow(vel, 1.2);
    const body = K.filter('peaking', f1 * k, 4, 4);
    body.connect(K.out);
    const o = K.osc('sine', f0 * k, when), g = K.gain(0);
    o.frequency.setValueAtTime(f0 * k, when);
    o.frequency.exponentialRampToValueAtTime(f1 * k, when + dec * 0.7);
    applyEnv(g.gain, when, [[0, 0], [0.003, a], [0.003, 0, dec * 0.35]]);
    K.chain(o, g, body);
    const o2 = K.osc('triangle', f0 * k * 2.23, when), g2 = K.gain(0);
    o2.frequency.setValueAtTime(f0 * k * 2.23, when);
    o2.frequency.exponentialRampToValueAtTime(f1 * k * 2.23, when + dec * 0.7);
    applyEnv(g2.gain, when, [[0, 0], [0.002, a * 0.22], [0.002, 0, dec * 0.12]]);
    K.chain(o2, g2, body);
    const n = K.noise('white', when, p.seed), nb = K.filter('bandpass', f0 * k * 1.6, 2.5), ng = K.gain(0);
    applyEnv(ng.gain, when, [[0, 0], [0.0015, a * nz * 1.5], [0.0015, 0, 0.012 + 0.02 * nz]]);
    K.chain(n, nb, ng, K.out);
    return K.done(when + dec * 3 + 0.1);
  }, () => 2);

  /* ---------- sho: aitake clusters, the sound of the heavens ---------- */
  const AITAKE = {
    kotsu: [0, 2, 5, 7, 12, 14], ichi: [0, 2, 7, 9, 12, 14], ku: [0, 5, 7, 10, 12, 17],
    otsu: [0, 1, 5, 7, 8, 12], ju: [0, 2, 5, 7, 9, 14], bo: [0, 5, 7, 12, 14, 19],
  };
  inst('sho', { rev: 0.5, dur: 8, resumable: true, sustained: true }, (ctx, dest, when, p) => {
    const K = kit(ctx, dest);
    let notes;
    if (p.aitake) {
      const iv = Array.isArray(p.aitake) ? p.aitake : AITAKE[p.aitake] || AITAKE.kotsu;
      const r = midiOf(def(p.root, noteList(def(p.note, 'A4'))[0]));
      notes = iv.map((x) => r + x);
    } else notes = noteList(def(p.note, 'A4'));
    const vel = clamp(def(p.vel, 0.6)), off = p.off || 0;
    const swell = def(p.swell, 3), rel = def(p.release, 3);
    const dur = Math.max(swell + 0.2, def(p.dur, 8));
    const bright = clamp(def(p.bright, 0.5)), width = clamp(def(p.width, 0.6));
    const R = U.rng(p.seed), n = notes.length;
    const lp = K.filter('lowpass', 900, 0.4), sh = K.filter('highshelf', 5000, 0.7, -5);
    const wob = K.gain(1), env = K.gain(0), top = lerp(2200, 4500, bright);
    if (p.levels && p.levels.length) {
      // an explicit dynamic curve [[dt, 0–1], ...]: the reeds open as the breath grows
      const lv = mono(p.levels.map(([t, v]) => [clamp(t, 0, dur), clamp(v, 0, 1.5)]));
      const last = lv[lv.length - 1][1], bf = (v) => 700 + (top - 700) * Math.pow(clamp(v), 0.8);
      applyEnv(env.gain, when, mono([[0, 0], ...lv, [dur, last], [dur, 0, rel / 4]]), off);
      applyEnv(lp.frequency, when, mono([[0, 700], ...lv.map(([t, v]) => [t, bf(v)]), [dur, bf(last)], [dur + rel, 700]]), off);
    } else {
      applyEnv(lp.frequency, when, mono([[0, 700], [swell, top], [dur, top * 0.9], [dur + rel, 700]]), off);
      applyEnv(env.gain, when, mono([[0, 0], [swell * 0.45, 0.45], [swell, 1], [dur, 0.92], [dur, 0, rel / 4]]), off);
    }
    // te-utsuri: the breath turns over every few seconds — a small dip
    const wp = [[0, 1]];
    for (let t = swell + lerp(2.5, 5, R()); t < dur - 1; t += lerp(3.5, 6, R())) wp.push([t - 0.25, 1], [t, 0.8], [t + 0.4, 1]);
    applyEnv(wob.gain, when, wp, off);
    const lfo = K.osc('sine', 0.13 + R() * 0.05, when), lg = K.gain(0.05);
    lfo.connect(lg);
    lg.connect(wob.gain);
    K.chain(lp, sh, wob, env, K.out);
    const amp = (0.2 * Math.pow(vel, 1.1)) / Math.sqrt(n);
    notes.forEach((m, i) => {
      const pos = n > 1 ? (i % 2 ? 1 : -1) * lerp(0.2, 1, i / (n - 1)) * width : 0;
      const pn = K.pan(pos), g = K.gain(amp);
      for (const dc of [-1, 1]) {
        const o = K.osc(wave(ctx, 'sho'), mtof(m), when);
        o.detune.value = dc * lerp(2, 5, R());
        o.connect(g);
      }
      g.connect(pn);
      pn.connect(lp);
    });
    const nz = K.noise('pink', when, p.seed), nb = K.filter('bandpass', 2400, 0.8);
    const ng = K.gain(def(p.breath, 0.3) * 0.25 * vel);
    K.chain(nz, nb, ng, wob);
    return K.done(when + dur + rel * 1.6 - off);
  }, (p) => def(p.dur, 8) + def(p.release, 3) * 1.6);

  /* ---------- hyoshigi: the clappers that open the curtain ---------- */
  inst('hyoshigi', { rev: 0.32 }, (ctx, dest, when, p) => {
    const K = kit(ctx, dest);
    const vel = clamp(def(p.vel, 0.8)), R = U.rng(p.seed), pitch = def(p.pitch, 1);
    const hits = [];
    if (p.kizami) {            // accelerating "chon…chon-chon-chon" then the tome
      const n = p.kizami === true ? 14 : Math.max(3, Math.round(p.kizami)), total = def(p.kizamiDur, 4);
      const w = [];
      let sum = 0, t = 0;
      for (let i = 0; i < n - 1; i++) { w.push(Math.pow(0.82, i)); sum += w[i]; }
      for (let i = 0; i < n - 1; i++) { hits.push([t, lerp(0.45, 0.85, i / (n - 1))]); t += (w[i] / sum) * total * 0.88; }
      hits.push([total, 1]);
    } else {
      const n = Math.max(1, Math.round(def(p.count, 1))), gap = def(p.gap, 0.9);
      for (let i = 0; i < n; i++) hits.push([i * gap, 1]);
    }
    for (const [dt, v] of hits) {
      const t = when + dt + (dt ? (R() - 0.5) * 0.012 : 0);
      const s = K.buf(clackBuffer(ctx.sampleRate, Math.floor(R() * 4)), t, { rate: pitch * (1 + (R() - 0.5) * 0.03) });
      const g = K.gain(0.55 * Math.pow(vel * v, 1.2));
      s.connect(g);
      g.connect(K.out);
      K.end = Math.max(K.end, t + 0.4);
    }
    return K.done(K.end);
  }, (p) => (p.kizami ? def(p.kizamiDur, 4) : def(p.count, 1) * def(p.gap, 0.9)) + 0.5);

  /* ------------------------------------------------------------------ */
  /* one-shots rendered in JS: wood, water, paper, breath, birds, insects */
  /* Each is a pure function of its params (seeded), cached in the LRU,   */
  /* started from an offset when resumed after a seek.                    */
  /* ------------------------------------------------------------------ */
  /** Seeded xorshift white noise in [−1, 1). */
  function noiseGen(seed) {
    let x = (Math.imul((seed | 0) + 0x632be5ab, 2654435761) ^ 0x9e3779b9) | 0 || 1;
    return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) * 4.656612873077393e-10 - 1; };
  }
  /** Zero-delay state-variable filter, safe to sweep per sample. step(x, f, q) → unity-peak band; .lo .hi */
  function SVF(sr) {
    let s1 = 0, s2 = 0, gf = -1, gq = -1, a1 = 0, a2 = 0, a3 = 0, k = 1;
    const o = { lo: 0, hi: 0 };
    o.step = (x, f, q) => {
      if (f !== gf || q !== gq) {
        gf = f; gq = q;
        const g = Math.tan((Math.PI * Math.min(Math.max(f, 10), sr * 0.45)) / sr);
        k = 1 / q; a1 = 1 / (1 + g * (g + k)); a2 = g * a1; a3 = g * a2;
      }
      const v3 = x - s2, v1 = a1 * s1 + a2 * v3, v2 = s2 + a2 * s1 + a3 * v3;
      s1 = 2 * v1 - s1; s2 = 2 * v2 - s2;
      o.lo = v2; o.hi = x - k * v1 - v2;
      return k * v1;
    };
    return o;
  }
  /** Hann-windowed band of noise: a grain of paper, grass, crackle. */
  function addGrain(d, sr, i0, dur, f, q, amp, rnd) {
    const n = Math.max(8, Math.round(dur * sr)), F = SVF(sr);
    for (let j = 0; j < n && i0 + j < d.length; j++) {
      if (i0 + j < 0) { F.step(rnd(), f, q); continue; }
      d[i0 + j] += F.step(rnd(), f, q) * (0.5 - 0.5 * Math.cos((TAU * j) / n)) * amp;
    }
  }
  /** A decaying sine that glides f0 → f1 (exponentially) over `glide` s: drops, plops. */
  function addGlide(d, sr, i0, f0, f1, glide, amp, tau, att) {
    const n = Math.min(d.length - i0, Math.round(sr * (att + tau * 7))), ng = Math.max(1, glide * sr);
    const ga = Math.log(f1 / f0) / ng, na = Math.max(1, Math.round(att * sr)), dk = Math.exp(-1 / (tau * sr));
    let ph = 0, env = amp;
    for (let j = 0; j < n; j++) {
      ph += (TAU * (j < ng ? f0 * Math.exp(ga * j) : f1)) / sr;
      d[i0 + j] += Math.sin(ph) * env * (j < na ? 0.5 - 0.5 * Math.cos((Math.PI * j) / na) : 1);
      if (j >= na) env *= dk;
    }
  }
  const sm01 = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  /** Rendered, cached buffer: fill(chs, sr, len) writes Float32Arrays. */
  function sketch(key, sr, secs, chans, fill) {
    return cacheLru(key + ':' + sr, () => {
      const len = Math.max(16, Math.round(secs * sr)), chs = [];
      for (let c = 0; c < chans; c++) chs.push(new Float32Array(len));
      fill(chs, sr, len);
      for (const d of chs) {          // never let a NaN out
        let sum = 0;
        for (let i = 0; i < len; i++) sum += d[i];
        if (!Number.isFinite(sum)) for (let i = 0; i < len; i++) if (!Number.isFinite(d[i])) d[i] = 0;
      }
      const b = newBuf(chans, len, sr);
      chs.forEach((d, c) => b.copyToChannel(d, c));
      return b;
    });
  }
  const finish = (chs, sr, peak = 0.9, fin = 0.0004, fout = 0.04) => {
    peakNorm(chs, peak);
    for (const d of chs) fadeEnds(d, sr, fin, fout);
  };
  const v4 = (p, n = 4) => Math.abs(Math.round(def(p.seed, 0))) % n;   // a few seeded takes per sound

  /**
   * Register a buffer instrument. buf(sr, p) → AudioBuffer (cached, also used by prewarm),
   * amp(p) → linear gain. Resumable: a seek starts the buffer part-way through.
   */
  function oneShot(name, defaults, buf, amp, len) {
    inst(name, Object.assign({ resumable: true }, defaults), (ctx, dest, when, p) => {
      const K = kit(ctx, dest), b = buf(ctx.sampleRate, p), off = Math.max(0, p.off || 0);
      if (off >= b.duration - 0.02) return K.done(when);
      const s = K.buf(b, when, { offset: off }), g = K.gain(amp(p));
      if (off > 0) { g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(amp(p), when + 0.03); }
      s.connect(g);
      g.connect(K.out);
      return K.done(when + b.duration - off + 0.01);
    }, len);
    INST[name].warm = buf;
  }
  const velAmp = (k, e = 1.2) => (p) => k * Math.pow(clamp(def(p.vel, 0.7), 0.02, 1), e);

  /* ---------- 鹿威し sōzu: the KON (and the cracked, dry tube of the 後摺) ---------- */
  oneShot('sozu', { rev: 0.72 }, (sr, p) => {
    const dry = !!p.dry, v = v4(p, 3);
    return sketch(`sozu:${dry ? 1 : 0}:${v}`, sr, dry ? 0.7 : 1.5, 1, ([d]) => {
      const R = U.rng(4400 + v * 13 + (dry ? 99 : 0)), rnd = noiseGen(77 + v);
      const f = (dry ? 305 : 200) * (1 + (R() - 0.5) * 0.02), tau = dry ? 0.035 : 0.13, na = Math.round(sr * 0.0016);
      let ph = 0;
      for (let i = 0; i < d.length; i++) {     // the thump: the tube's body, pitch settling after impact
        const t = i / sr;
        ph += (TAU * f * (1 + 0.17 * Math.exp(-t / 0.012))) / sr;
        d[i] += Math.sin(ph) * (i < na ? i / na : 1) * Math.exp(-t / tau);
      }
      addPartial(d, sr, 0, f * 2.32, dry ? 0.16 : 0.4, dry ? 0.016 : 0.055, 0.001);   // hollow tube modes
      addPartial(d, sr, 0, f * 3.91, dry ? 0.09 : 0.19, dry ? 0.01 : 0.026, 0.0008);
      addPartial(d, sr, 0, f * 5.6, 0.07, 0.012, 0.0006);
      addPartial(d, sr, 0, 1650 * (1 + (R() - 0.5) * 0.04), dry ? 0.5 : 0.32, 0.006, 0.0003);  // bamboo on stone
      addPartial(d, sr, 0, 2950, 0.16, 0.0035, 0.0002);
      addGrain(d, sr, 0, 0.004, 2400, 0.9, dry ? 0.9 : 0.55, rnd);
      if (dry) for (let k = 1; k <= 4; k++) {   // a split tube rattles
        addGrain(d, sr, Math.round(sr * (0.009 + k * 0.011 + R() * 0.004)), 0.005, 1900 + R() * 900, 1.5, 0.42 * Math.pow(0.6, k), rnd);
      }
      biquad(d, 'highpass', 60, 0.7, 0, sr);
      finish([d], sr, 0.9, 0.0002, 0.12);
    });
  }, velAmp(0.62), (p) => (p.dry ? 0.7 : 1.5));

  /* ---------- 見当 kentō: a block settling into register — the CLICK ---------- */
  oneShot('kento', { rev: 0.16 }, (sr, p) => {
    const v = def(p.take, 0);
    return sketch(`kento:${v}`, sr, 0.3, 1, ([d]) => {
      const R = U.rng(5150 + v * 17), f = 1200 * (1 + (R() - 0.5) * 0.01);
      addPartial(d, sr, 0, f, 1, 0.0034, 0.0003);            // the tick: cherry wood, 12 ms
      addPartial(d, sr, 0, f * 2.81, 0.26, 0.0016, 0.0002);
      addPartial(d, sr, 0, f * 4.37, 0.09, 0.0009, 0.0002);
      addPartial(d, sr, 0, 180, 0.8, 0.021, 0.0016);         // the thunk: the block sits down
      addPartial(d, sr, 0, 180 * 2.31, 0.2, 0.009, 0.001);
      addGrain(d, sr, 0, 0.0014, 3000, 0.7, 0.35, noiseGen(900 + v));
      biquad(d, 'highpass', 70, 0.7, 0, sr);
      finish([d], sr, 0.9, 0.0002, 0.06);
    });
  }, velAmp(0.62), () => 0.3);

  /* ---------- 馬連 baren: the rub that pulls the print (circular strokes) ---------- */
  oneShot('baren', { rev: 0.12, sustained: true }, (sr, p) => {
    const dur = def(p.dur, 4), stroke = def(p.stroke, 0.7), v = v4(p);
    return sketch(`baren:${dur}:${stroke}:${v}`, sr, dur + 0.05, 2, ([L, Rr]) => {
      const rnd = noiseGen(3100 + v), tk = noiseGen(3300 + v), R = U.rng(31 + v), F = SVF(sr), F2 = SVF(sr);
      const n = Math.round(dur * sr), hk = Math.exp((-TAU * 300) / sr), KR = 32;
      let br = 0, hp = 0, hpx = 0, nextTick = 0, fc = 360, g = 0, pan = 0, speed = 0;
      const tick = new Float32Array(L.length);
      for (let i = 0; i < n; i++) {
        if (i % KR === 0) {                                                    // control rate: every 32 samples
          const t = i / sr, x = t / dur, ph = (t / stroke) % 1;
          speed = Math.sin(Math.PI * x);                                       // the spiral's reach: slow, fast, slow
          const circ = 0.5 + 0.5 * Math.pow(Math.sin(TAU * ph), 2);            // pressure turns twice a circle
          fc = 360 + 760 * speed * (0.6 + 0.4 * Math.sin(TAU * ph + 0.6));
          g = Math.pow(speed, 0.85) * circ * sm01(t / 0.12) * sm01((dur - t) / 0.2);
          pan = 0.22 * Math.sin(TAU * ph);                                     // the pad circling
        }
        br = (br + 0.02 * rnd()) / 1.02;                                       // brown noise
        let y = F.step(br * 3.2, fc, 0.8);
        hp = hk * (hp + y - hpx); hpx = y; y = hp;                             // 300 Hz …
        F2.step(y, 1200, 0.7); y = F2.lo;                                      // … 1200 Hz
        L[i] += y * g * (1 - pan); Rr[i] += y * g * (1 + pan);
        if (i >= nextTick) {                                                   // paper fibre catching the pad
          addGrain(tick, sr, i, 0.002 + R() * 0.003, 1500 + R() * 1800, 1.4, 0.05 * speed, tk);
          nextTick = i + Math.round((sr * (0.02 + R() * 0.12)) / (0.3 + speed));
        }
      }
      for (let i = 0; i < L.length; i++) { L[i] += tick[i]; Rr[i] += tick[i] * 0.8; }
      finish([L, Rr], sr, 0.85, 0.01, 0.05);
    });
  }, velAmp(0.5, 1), (p) => def(p.dur, 4) + 0.05);

  /* ---------- geese: distant two-formant FM honks, echoing across the valley ---------- */
  function honk(d, sr, i0, f, dur, amp, rnd) {
    const n = Math.round(dur * sr), n1 = Math.max(2, Math.round(1050 / f)), n2 = Math.max(n1 + 1, Math.round(2350 / f)), F = SVF(sr);
    let ph = 0;
    for (let j = 0; j < n && i0 + j < d.length; j++) {
      const x = j / n;
      const fc = f * (0.8 + 0.2 * sm01(x / 0.16)) * (1 - 0.1 * sm01((x - 0.6) / 0.4));   // scoop up, sag at the end
      ph += (TAU * fc) / sr;
      const I = 1.1 + 2.4 * Math.sin(Math.PI * x), m = Math.sin(ph);
      const v = 0.45 * Math.sin(ph + 0.6 * I * m) + Math.sin(n1 * ph + I * m) + 0.38 * Math.sin(n2 * ph + 0.8 * I * m);
      const env = Math.sin((Math.PI / 2) * sm01(x / 0.12)) * Math.sin((Math.PI / 2) * sm01((1 - x) / 0.28));
      d[i0 + j] += (v + 0.5 * F.step(rnd(), 1250, 1.2)) * env * amp;
    }
  }
  oneShot('geese', { rev: 0.55, dist: 0.45 }, (sr, p) => {
    const birds = Math.max(1, Math.round(def(p.birds, 2))), honks = Math.max(1, Math.round(def(p.honks, 2)));
    const gap = def(p.gap, 0.36), f = def(p.f, 370), echo = clamp(def(p.echo, 0.35)), spread = def(p.spread, 0.2), v = v4(p);
    const key = `geese:${birds}:${honks}:${gap}:${Math.round(f)}:${echo}:${spread}:${v}`;
    const len = spread * birds + honks * gap + 0.5 + 0.24 * 4;
    return sketch(key, sr, len, 2, ([L, Rr]) => {
      const R = U.rng(6100 + v * 7 + birds * 31), rnd = noiseGen(6200 + v), m = new Float32Array(L.length);
      for (let b = 0; b < birds; b++) {
        const fb = f * (1 + (b ? (R() - 0.5) * 0.16 : 0)), pan = clamp(0.5 - b * 0.35 + (R() - 0.5) * 0.2, -0.9, 0.9);
        const gl = Math.cos(((pan + 1) * Math.PI) / 4), gr = Math.sin(((pan + 1) * Math.PI) / 4);
        m.fill(0);
        for (let h = 0; h < honks; h++) {
          const t = b * spread + R() * 0.06 + h * gap * lerp(0.9, 1.1, R());
          honk(m, sr, Math.round(t * sr), fb * lerp(0.97, 1.03, R()), h % 2 ? lerp(0.2, 0.26, R()) : lerp(0.15, 0.2, R()), lerp(0.75, 1, R()), rnd);
        }
        for (let i = 0; i < m.length; i++) { L[i] += gl * m[i]; Rr[i] += gr * m[i]; }
      }
      // air absorption, then the far side of the valley answers: a ping-pong echo, darker each time
      for (const d of [L, Rr]) biquad(d, 'lowpass', 2600, 0.6, 0, sr);
      if (echo > 0) {
        const dl = Math.round(0.24 * sr), k = Math.exp((-TAU * 1800) / sr);
        let lL = 0, lR = 0;
        for (let i = dl; i < L.length; i++) {
          lL = k * lL + (1 - k) * Rr[i - dl]; lR = k * lR + (1 - k) * L[i - dl];
          L[i] += echo * lL; Rr[i] += echo * lR;
        }
      }
      finish([L, Rr], sr, 0.85, 0.001, 0.1);
    });
  }, velAmp(0.5, 1.1), (p) => def(p.spread, 0.2) * def(p.birds, 2) + def(p.honks, 2) * def(p.gap, 0.36) + 1.46);

  /* ---------- paper and grass: brush, rustle, crack, peel, press, grass, hiss, cloth ---------- */
  const SWISH = { brush: 0.08, rustle: 0.45, crack: 0.5, peel: 1.3, press: 0.22, grass: 0.8, hiss: 1.6, cloth: 0.7 };
  oneShot('swish', { rev: 0.2 }, (sr, p) => {
    const kind = SWISH[p.kind] !== undefined ? p.kind : 'brush', dur = def(p.dur, SWISH[kind]);
    const br = Math.round(clamp(def(p.bright, 0.5)) * 4) / 4, v = v4(p, kind === 'brush' ? 6 : 4);
    return sketch(`swish:${kind}:${dur}:${br}:${v}`, sr, dur + 0.06, 1, ([d]) => {
      const R = U.rng(8100 + v * 19 + kind.length * 101), rnd = noiseGen(8200 + v * 7 + kind.length), F = SVF(sr);
      const n = Math.round(dur * sr), bk = lerp(0.8, 1.25, br);
      const grains = (count, t0, t1, fLo, fHi, dLo, dHi, aLo, aHi, weight) => {
        for (let k = 0; k < count; k++) {
          let x = R();
          if (weight) x = weight(x);
          addGrain(d, sr, Math.round((t0 + (t1 - t0) * x) * sr), lerp(dLo, dHi, R()), lerp(fLo, fHi, R()) * bk, 1.4, lerp(aLo, aHi, R()), rnd);
        }
      };
      if (kind === 'brush') {            // a loaded brush drawn across washi
        for (let i = 0; i < n; i++) {
          const x = i / n, env = x < 0.25 ? Math.pow(Math.sin((Math.PI / 2) * (x / 0.25)), 2) : Math.pow(Math.cos((Math.PI / 2) * ((x - 0.25) / 0.75)), 2);
          d[i] += F.step(rnd(), lerp(1800, 3300, x) * bk, 1.1) * env * (0.75 + 0.25 * rnd());
        }
        biquad(d, 'highpass', 1500, 0.7, 0, sr); biquad(d, 'lowpass', 4200, 0.7, 0, sr);
      } else if (kind === 'rustle') {    // a paper cut-out lifted and turned
        for (let i = 0; i < n; i++) d[i] += F.step(rnd(), 2100 * bk, 0.7) * 0.3 * Math.sin(Math.PI * (i / n));
        grains(6 + Math.floor(R() * 4), 0.02, dur * 0.85, 1200, 5000, 0.006, 0.03, 0.4, 1, (x) => Math.pow(x, 1.4));
      } else if (kind === 'crack') {     // a dry sheet cracking as the print jolts
        const m = Math.round(0.06 * sr), hp = SVF(sr);
        for (let i = 0; i < m; i++) {
          const t = i / sr;
          hp.step(rnd(), 2000, 0.7);
          d[i] += hp.hi * Math.sin((Math.PI / 2) * sm01(t / 0.0012)) * Math.exp(-t / 0.013);
        }
        grains(3, 0, 0.022, 2500, 6000, 0.0015, 0.003, 0.5, 0.9);
        grains(7, 0.07, dur * 0.95, 2500, 6000, 0.0015, 0.004, 0.06, 0.25, (x) => Math.pow(x, 1.6));
      } else if (kind === 'peel') {      // a sheet peeled from the block: tack, then the release
        for (let i = 0; i < n; i++) {
          const x = i / n, env = sm01(x / 0.55) * (1 - sm01((x - 0.8) / 0.18));
          const fwip = Math.exp(-Math.pow((x - 0.84) / 0.05, 2));
          d[i] += F.step(rnd(), lerp(900, 2600, x) * bk * (1 + fwip), 0.9) * (0.35 * env + 0.9 * fwip);
        }
        grains(Math.round(40 * dur), 0.05, dur * 0.82, 1500, 5000, 0.0012, 0.0035, 0.05, 0.22, (x) => 1 - Math.pow(1 - x, 1.6));
      } else if (kind === 'press') {     // the seal pressed into paper: felt, then the sheet giving
        addPartial(d, sr, 0, 700, 0.5, 0.004, 0.0015);
        addPartial(d, sr, 0, 1740, 0.2, 0.002, 0.001);
        for (let i = 0; i < n; i++) { const t = i / sr; d[i] += F.step(rnd(), 520, 0.6) * sm01(t / 0.004) * Math.exp(-t / 0.028) * 0.9; }
      } else if (kind === 'grass') {     // dry susuki brushed by something unseen
        for (let i = 0; i < n; i++) d[i] += F.step(rnd(), 3200 * bk, 0.8) * 0.3 * Math.pow(Math.sin(Math.PI * (i / n)), 0.7);
        grains(Math.round(120 * dur), 0.02, dur * 0.95, 1500, 6500, 0.002, 0.012, 0.05, 0.3, (x) => 0.5 - 0.5 * Math.cos(Math.PI * x));
      } else if (kind === 'hiss') {      // an ember catching the incense
        let a = 0;
        for (let i = 0; i < n; i++) {
          const x = i / n;
          if ((i & 63) === 0) a = 0.6 + 0.4 * U.noise1(i / sr * 7, v + 3);
          d[i] += F.step(rnd(), 4600 * bk, 1.2) * a * sm01(x / 0.1) * (1 - sm01((x - 0.5) / 0.5));
        }
        grains(8, 0.05, dur * 0.7, 900, 2800, 0.001, 0.002, 0.2, 0.5);
      } else {                           // cloth: a haori laid down
        for (let i = 0; i < n; i++) d[i] += F.step(rnd(), lerp(500, 1300, i / n) * bk, 0.8) * Math.pow(Math.sin(Math.PI * (i / n)), 1.3);
        grains(5, 0.1, dur * 0.8, 800, 2000, 0.01, 0.04, 0.2, 0.4);
      }
      // paper is bright, but never hiss: a ceiling per kind (the brush is already band-limited)
      const ceil = { rustle: 5500, crack: 6500, peel: 6000, press: 2800, grass: 6500, hiss: 7000, cloth: 2800 }[kind];
      if (ceil) { biquad(d, 'lowpass', ceil * bk, 0.6, 0, sr); biquad(d, 'lowpass', ceil * bk, 0.6, 0, sr); }
      finish([d], sr, 0.85, 0.0006, 0.02);
    });
  }, velAmp(0.42), (p) => def(p.dur, SWISH[p.kind] || 0.08) + 0.06);

  /* ---------- water: a drop, a dew plink into dry bamboo, a hand splash, a gush ---------- */
  oneShot('plink', { rev: 0.4 }, (sr, p) => {
    const f0 = Math.round(def(p.f0, 1800)), f1 = Math.round(def(p.f1, 1200)), gl = def(p.glide, 0.08);
    const hollow = Math.round(clamp(def(p.hollow, 0)) * 4) / 4, spl = Math.round(clamp(def(p.splash, 0)) * 4) / 4, v = v4(p);
    return sketch(`plink:${f0}:${f1}:${gl}:${hollow}:${spl}:${v}`, sr, gl * 4 + (hollow ? 0.45 : 0.1), 1, ([d]) => {
      const R = U.rng(7700 + v), rnd = noiseGen(7800 + v);
      addGlide(d, sr, 0, f0, f1, gl, 1, gl * 0.55, 0.0012);
      addGlide(d, sr, 0, f0 * 2.4, f1 * 2.4, gl, 0.12, gl * 0.25, 0.0008);
      if (hollow) {                      // the empty bamboo answers
        addPartial(d, sr, Math.round(sr * 0.002), 610 * lerp(0.98, 1.02, R()), 0.45 * hollow, 0.075, 0.0015);
        addPartial(d, sr, Math.round(sr * 0.002), 1490, 0.16 * hollow, 0.03, 0.001);
        addGrain(d, sr, 0, 0.003, 1200, 1, 0.3 * hollow, rnd);
      }
      if (spl) addGrain(d, sr, 0, 0.01, 3000, 0.8, 0.35 * spl, rnd);
      finish([d], sr, 0.9, 0.0004, 0.03);
    });
  }, velAmp(0.4), (p) => def(p.glide, 0.08) * 4 + (p.hollow ? 0.45 : 0.1));

  oneShot('splash', { rev: 0.35 }, (sr, p) => {
    const kind = p.kind === 'gush' ? 'gush' : 'hand', drops = Math.round(def(p.drops, kind === 'hand' ? 7 : 3)), v = v4(p);
    const dur = kind === 'gush' ? def(p.dur, 0.3) : def(p.dur, 0.04);
    return sketch(`splash:${kind}:${drops}:${dur}:${v}`, sr, dur + 1.0, 1, ([d]) => {
      const R = U.rng(9100 + v), rnd = noiseGen(9200 + v), F = SVF(sr), n = Math.round(sr * (dur + 0.05));
      let a = 0.5;
      for (let i = 0; i < n; i++) {
        const t = i / sr;
        if (kind === 'gush') {           // the tube tips: water pours out onto stone
          if ((i & 31) === 0) a = 0.45 + 0.55 * U.noise1(t * 38, v + 11);
          d[i] += F.step(rnd(), lerp(1300, 700, t / dur), 0.8) * a * sm01(t / 0.02) * (1 - sm01(t / dur));
        } else {                         // small hands plunge in
          d[i] += F.step(rnd(), 2200, 0.6) * sm01(t / 0.002) * Math.exp(-t / 0.012);
        }
      }
      addGlide(d, sr, 0, kind === 'gush' ? 260 : 330, 150, 0.05, kind === 'gush' ? 0.3 : 0.55, 0.03, 0.002);
      for (let k = 0; k < drops; k++) {  // droplets falling back
        const t = dur + 0.04 + Math.pow(R(), 1.5) * 0.75;
        addGlide(d, sr, Math.round(t * sr), lerp(1400, 3000, R()), lerp(900, 1800, R()), 0.05, lerp(0.08, 0.3, R()) * (1 - k / (drops + 2)), 0.02, 0.001);
      }
      biquad(d, 'lowpass', 5500, 0.6, 0, sr);
      finish([d], sr, 0.9, 0.0005, 0.05);
    });
  }, velAmp(0.45), (p) => def(p.dur, p.kind === 'gush' ? 0.3 : 0.04) + 1.0);

  /* ---------- ぺったん: the moon rabbit's pestle, a soft damp thud ---------- */
  oneShot('pestle', { rev: 0.3 }, (sr, p) => {
    const v = v4(p, 3);
    return sketch(`pestle:${v}`, sr, 0.45, 1, ([d]) => {
      const R = U.rng(4800 + v), rnd = noiseGen(4900 + v), na = Math.round(sr * 0.003);
      let ph = 0;
      for (let i = 0; i < d.length; i++) {  // 90 Hz, 0.15 s
        const t = i / sr;
        ph += (TAU * 90 * (1 + 0.3 * Math.exp(-t / 0.01))) / sr;
        d[i] += Math.sin(ph) * (i < na ? i / na : 1) * Math.exp(-t / 0.05);
      }
      addPartial(d, sr, 0, 185, 0.18, 0.03, 0.002);
      addGrain(d, sr, Math.round(sr * 0.001), 0.022, 1000 * lerp(0.95, 1.05, R()), 0.8, 0.5, rnd);   // the wet slap
      finish([d], sr, 0.9, 0.0003, 0.05);
    });
  }, velAmp(0.62), () => 0.45);

  /* ---------- a breath: the andon blown out (and its flame guttering) ---------- */
  oneShot('puff', { rev: 0.25 }, (sr, p) => {
    const dur = def(p.dur, 0.3), gut = Math.round(clamp(def(p.gutter, 0.7)) * 4) / 4, v = v4(p);
    return sketch(`puff:${dur}:${gut}:${v}`, sr, dur + 0.8, 1, ([d]) => {
      const rnd = noiseGen(5500 + v), F = SVF(sr), G = SVF(sr), n = Math.round(dur * sr);
      for (let i = 0; i < n; i++) {
        const x = i / n;
        d[i] += F.step(rnd(), lerp(1500, 650, x), 0.7) * Math.sin((Math.PI / 2) * sm01(x / 0.15)) * Math.pow(1 - x, 1.5);
      }
      if (gut) {
        const i0 = Math.round(dur * 0.35 * sr);
        for (let i = i0; i < d.length; i++) {
          const t = (i - i0) / sr;
          G.step(rnd(), 260, 0.7);
          d[i] += G.lo * 2.2 * gut * (0.5 + 0.5 * Math.sin(TAU * 13 * t)) * sm01(t / 0.03) * Math.exp(-t / 0.13);
        }
      }
      biquad(d, 'lowpass', 3200, 0.6, 0, sr);
      finish([d], sr, 0.85, 0.003, 0.05);
    });
  }, velAmp(0.4), (p) => def(p.dur, 0.3) + 0.8);

  /* ---------- tea poured into a cup (the cup filling), a small ceramic tick ---------- */
  oneShot('pour', { rev: 0.25 }, (sr, p) => {
    const dur = def(p.dur, 1.2), f0 = def(p.f0, 650), f1 = def(p.f1, 1500), tk = def(p.tickAt, dur + 0.3), v = v4(p);
    return sketch(`pour:${dur}:${f0}:${f1}:${tk}:${v}`, sr, Math.max(dur, tk) + 0.25, 1, ([d]) => {
      const rnd = noiseGen(6600 + v), F = SVF(sr), F2 = SVF(sr), H = SVF(sr), n = Math.round(dur * sr);
      let b = 0;
      for (let i = 0; i < n; i++) {
        const x = i / n, f = lerp(f0, f1, Math.pow(x, 0.8)), w = rnd();
        b += 0.0045 * (rnd() - b * 0.9);                             // bubbling: smooth random swell
        const am = 0.55 + 0.45 * Math.tanh(b * 40);
        const env = Math.pow(Math.sin((Math.PI / 2) * sm01(x / 0.06)), 2) * Math.pow(Math.cos((Math.PI / 2) * sm01((x - 0.87) / 0.13)), 2);
        H.step(w, 3500, 0.7);
        d[i] += (F.step(w, f, 3.5) + 0.35 * F2.step(rnd(), f * 2.2, 5) + 0.02 * H.hi) * am * env;
      }
      if (tk >= 0) {                                                  // the pot set down against the cup
        const i0 = Math.round(tk * sr);
        addPartial(d, sr, i0, 2750, 0.5, 0.012, 0.0006);
        addPartial(d, sr, i0, 4130, 0.28, 0.008, 0.0005);
        addPartial(d, sr, i0, 6100, 0.1, 0.004, 0.0004);
      }
      biquad(d, 'lowpass', 5200, 0.6, 0, sr);
      finish([d], sr, 0.85, 0.005, 0.04);
    });
  }, velAmp(0.4), (p) => Math.max(def(p.dur, 1.2), def(p.tickAt, def(p.dur, 1.2) + 0.3)) + 0.25);

  /* ---------- one insect, one call: 鈴虫 rīn · 松虫 chin-chirorin ---------- */
  oneShot('mushi', { rev: 0.35 }, (sr, p) => {
    const kind = p.kind === 'matsu' ? 'matsu' : 'suzu', f = Math.round(def(p.f, kind === 'suzu' ? 4400 : 3300));
    const dur = def(p.dur, 1.2), pulses = Math.max(1, Math.round(def(p.pulses, 1))), am = def(p.am, 35);
    return sketch(`mushi:${kind}:${f}:${dur}:${pulses}:${am}`, sr, kind === 'suzu' ? dur + 0.1 : 1.1, 1, ([d]) => {
      if (kind === 'suzu') {
        const pl = (dur / pulses) * (pulses > 1 ? 0.82 : 1);
        for (let k = 0; k < pulses; k++) {
          const i0 = Math.round((k * dur * sr) / pulses), n = Math.round(pl * sr);
          let ph = 0;
          for (let j = 0; j < n && i0 + j < d.length; j++) {
            const t = j / sr, fr = f * (t < 0.06 ? 0.992 + 0.008 * (t / 0.06) : 1);
            ph += (TAU * fr) / sr;
            const env = Math.min(t / 0.025, 1) * lerp(1, 0.7, t / pl) * Math.min(1, (pl - t) / 0.05);
            d[i0 + j] += Math.sin(ph) * (0.45 + 0.55 * Math.sin(TAU * am * t)) * env;
          }
        }
      } else {
        const notes = [[0, 0.07, 1.06, 1], [0.21, 0.04, 1, 0.8], [0.285, 0.045, 0.94, 0.75], [0.365, 0.16, 0.985, 0.85]];
        for (const [t0, dd, fr, a] of notes) {
          const i0 = Math.round(t0 * sr), n = Math.round(dd * sr);
          let ph = 0;
          for (let j = 0; j < n; j++) {
            const t = j / sr, trill = dd > 0.1 ? 0.5 - 0.5 * Math.cos((TAU * t) / 0.022) : 1;
            ph += (TAU * f * fr) / sr;
            d[i0 + j] += Math.sin(ph) * a * trill * Math.min(1, t / 0.004, (dd - t) / 0.01);
          }
        }
      }
      biquad(d, 'highpass', 900, 0.7, 0, sr);
      finish([d], sr, 0.8, 0.002, 0.03);
    });
  }, velAmp(0.2, 1), (p) => (p.kind === 'matsu' ? 1.1 : def(p.dur, 1.2) + 0.1));

  /* ---------- glass: heaven's high sines (the fox window) and mica sparkle ---------- */
  function glassGrains(sr, n, lo, hi, spread, v) {
    return sketch(`glassg:${n}:${lo}:${hi}:${spread}:${v}`, sr, spread + 0.9, 2, ([L, Rr]) => {
      const R = U.rng(2700 + v * 3 + n), m = new Float32Array(L.length);
      for (let k = 0; k < n; k++) {
        const t = spread * Math.pow(R(), 1.6), pan = R() * 1.6 - 0.8;
        const gl = Math.cos(((pan + 1) * Math.PI) / 4), gr = Math.sin(((pan + 1) * Math.PI) / 4);
        m.fill(0);
        const end = addPartial(m, sr, Math.round(t * sr), lerp(lo, hi, R()), lerp(0.3, 1, R()) * (1 - 0.6 * (t / spread)), lerp(0.05, 0.22, R()), 0.002);
        for (let i = Math.round(t * sr); i < end; i++) { L[i] += gl * m[i]; Rr[i] += gr * m[i]; }
      }
      finish([L, Rr], sr, 0.8, 0.001, 0.2);
    });
  }
  inst('glass', { rev: 0.5, resumable: true, sustained: true }, (ctx, dest, when, p) => {
    const K = kit(ctx, dest), off = p.off || 0, vel = clamp(def(p.vel, 0.5));
    if (p.grains) {
      const b = glassGrains(ctx.sampleRate, Math.round(p.grains), Math.round(def(p.lo, 2000)), Math.round(def(p.hi, 5000)), def(p.spread, 1.5), v4(p));
      if (off >= b.duration - 0.02) return K.done(when);
      const s = K.buf(b, when, { offset: off }), g = K.gain(0.3 * Math.pow(vel, 1.2));
      s.connect(g); g.connect(K.out);
      return K.done(when + b.duration - off);
    }
    const notes = noteList(def(p.note, ['A6', 'B6', 'E7'])), n = notes.length, R = U.rng(p.seed);
    const swell = def(p.swell, 1.5), dur = Math.max(swell + 0.1, def(p.dur, 3)), rel = def(p.release, 2);
    const env = K.gain(0);
    applyEnv(env.gain, when, mono([[0, 0], [swell * 0.4, 0.35], [swell, 1], [dur, 0.9], [dur, 0, rel / 4]]), off);
    env.connect(K.out);
    const amp = (0.06 * Math.pow(vel, 1.1)) / Math.sqrt(n);
    notes.forEach((m, i) => {
      const f = mtof(m), g = K.gain(amp), sh = K.gain(1), pn = K.pan(n > 1 ? lerp(-0.5, 0.5, i / (n - 1)) : 0);
      for (const dc of [-1, 1]) { const o = K.osc('sine', f, when); o.detune.value = dc * lerp(1.5, 4, R()); o.connect(g); }
      const lfo = K.osc('sine', lerp(0.23, 0.6, R()), when), lg = K.gain(0.3);   // light glinting off glass
      lfo.connect(lg); lg.connect(sh.gain);
      K.chain(g, sh, pn, env);
    });
    return K.done(when + dur + rel * 1.6 - off);
  }, (p) => (p.grains ? def(p.spread, 1.5) + 0.9 : def(p.dur, 3) + def(p.release, 2) * 1.6));

  /* ------------------------------------------------------------------ */
  /* beds: continuous ambiences                                          */
  /* ------------------------------------------------------------------ */
  const BEDS = {};
  const BEDCAL = { insects: 2.1, wind: 1.1, water: 0.6, drone: 0.3, fire: 0.8, night: 0.28, trickle: 0.5 }; // level 1 ≈ −20 dBFS (night ≈ −32)
  /**
   * fn(ctx, K, B) builds continuous sources into K.out (started at B.c0) and
   * may return tick(uptoT) to schedule detail. B: { p, from, to, t0, c(T),
   * c0, seed, late(ct), shot(build(k)) } — shot() makes a self-freeing voice.
   * Detail is generated from `from` onward with seeded streams, so a seek
   * lands on exactly the chirps a continuous playthrough would have heard.
   */
  function bedDef(name, defaults, fn) { BEDS[name] = { defaults, fn }; }

  /** Deterministic event stream: bout(R, t) → { notes: [{ t, … }], next }. */
  function stream(seed, t, bout) {
    const R = U.rng(seed), q = [];
    return (upto) => {
      const out = [];
      for (;;) {
        while (q.length && q[0].t < upto) out.push(q.shift());
        if (q.length || t >= upto) return out;
        const b = bout(R, t);
        for (const n of b.notes) q.push(n);
        t = Math.max(b.next, t + 0.01);
      }
    };
  }
  const expo = (R, mean) => -Math.log(1 - R() * 0.999) * mean;
  /** Ramp points every `step` film seconds from t0 (for gusts, flicker, waves). */
  function grid(B, step, fn) {
    let g = B.t0 + step;
    return (upto) => { while (g < upto) { fn(g, B.c(g)); g += step; } };
  }

  function bedLevel(b, t) {
    if (t <= b.from || t >= b.to) return 0;
    let e = 1;
    if (b.fadeIn > 0) e = Math.min(e, U.smoothstep(b.from, b.from + b.fadeIn, t));
    if (b.fadeOut > 0) e = Math.min(e, 1 - U.smoothstep(b.to - b.fadeOut, b.to, t));
    let pt = b.from, pv = b.level;
    for (const [at, v] of b.automation) {
      if (t < at) return e * (at <= pt ? v : pv + ((v - pv) * (t - pt)) / (at - pt));
      pt = at; pv = v;
    }
    return e * pv;
  }
  function scheduleBedLevel(param, b, T0, c, k) {
    const r = T0 > b.from + 0.01 ? 0.3 : 0.02;
    const ts = [b.to];
    for (const [a, d] of [[b.from, b.fadeIn], [b.to - b.fadeOut, b.fadeOut]]) for (let i = 0; i <= 8; i++) ts.push(a + (d * i) / 8);
    for (const [at] of b.automation) ts.push(at);
    param.setValueAtTime(0, c(T0));
    param.linearRampToValueAtTime(bedLevel(b, T0 + r) * k, c(T0 + r));
    for (const t of ts.filter((x) => x > T0 + r && x <= b.to).sort((x, y) => x - y)) {
      param.linearRampToValueAtTime(bedLevel(b, t) * k, c(t));
    }
  }

  function startBed(S, b, T0, c) {
    const ctx = S.G.ctx, D = BEDS[b.inst];
    const p = Object.assign({}, D.defaults, b);
    const K = kit(ctx, null);
    const out = (K.out = stereo(K.gain(0)));
    scheduleBedLevel(out.gain, b, T0, c, (BEDCAL[b.inst] || 1) * panComp(p.pan));
    let head = out;
    const dist = clamp(def(p.dist, 0));
    if (dist > 0) { const lp = K.filter('lowpass', 18000 * Math.pow(0.08, dist), 0.5); head.connect(lp); head = lp; }
    if (p.muffle) {         // a paper wall: first-order (6 dB/oct) low-pass (see wallIR: not createIIRFilter)
      const f = ctx.createConvolver();
      f.normalize = false;
      f.buffer = wallIR(ctx.sampleRate, p.muffle);
      K.nodes.push(f);
      head.connect(f); head = f;
    }
    if (p.lp) { const lp = K.filter('lowpass', p.lp, 0.6); head.connect(lp); head = lp; }
    const pn = K.pan(def(p.pan, 0)), send = K.gain(clamp(def(p.rev, 0.3) + dist * 0.3, 0, 1.5));
    head.connect(pn); pn.connect(S.out); pn.connect(send); send.connect(S.send);
    const subs = [];
    const B = {
      p, from: b.from, to: b.to, t0: T0, c, c0: c(T0), seed: b.seed, ctx,
      late: (ct) => ct < ctx.currentTime - 0.02,
      shot: (build) => {
        const k = kit(ctx, out);
        build(k);
        k.done(k.end);
        autoFree(k);
        subs.push(k);
      },
    };
    const tick = D.fn(ctx, K, B) || null;
    K.done(c(b.to) + 0.05);
    autoFree(K);
    return {
      tick: (upto) => {
        if (tick && upto > T0) tick(Math.min(upto, b.to));
        if (subs.length > 32) for (let i = subs.length - 1; i >= 0; i--) if (subs[i].freed) subs.splice(i, 1);
      },
      stop: (t) => { stopKit(K, t); for (const k of subs) stopKit(k, t); },
      free: () => { freeKit(K); for (const k of subs) freeKit(k); },
    };
  }

  /* ---------- insects: 鈴虫 suzumushi, 松虫 matsumushi, the far field ---------- */
  /*
   * A chorus (density → voice counts) or, with nSuzu / nMatsu, an exact cast of voices:
   * one insect per bed is how the score makes them enter and leave one at a time.
   * fSuzu / fMatsu fix the pitch, vamp the loudness (0.5–1), activity the rhythm
   * (default density), first the delay of the first call after `from` (default random 0–3 s).
   */
  bedDef('insects', { density: 0.6, suzumushi: 1, matsumushi: 0.7, field: 0.6, rev: 0.35, dist: 0.15 }, (ctx, K, B) => {
    const p = B.p, dens = clamp(def(p.activity, p.density)), R = U.rng(B.seed), ticks = [];
    const solo = (p.nSuzu !== undefined || p.nMatsu !== undefined);
    const firstAt = (r) => B.from + (p.first !== undefined ? p.first : r * 3);
    if (p.field > 0) {
      const n = K.noise('pink', B.c0, B.seed), fg = K.gain(0), lp = K.filter('lowpass', 7500, 0.5);
      K.chain(fg, lp, K.out);
      for (const [bf, q, lf, dep] of [[4700, 2.2, 37, 0.45], [3500, 3, 26.5, 0.4], [5600, 3, 44, 0.5]]) {
        const bp = K.filter('bandpass', bf, q), am = K.gain(1 - dep), l = K.osc('sine', lf * lerp(0.95, 1.05, R()), B.c0), d = K.gain(dep);
        l.connect(d); d.connect(am.gain);
        K.chain(n, bp, am, fg);
      }
      const base = p.field * 0.2, sw = (t) => base * (0.55 + 0.45 * U.noise1(t * 0.15, B.seed));
      fg.gain.setValueAtTime(sw(B.t0), B.c0);
      ticks.push(grid(B, 0.5, (t, ct) => fg.gain.linearRampToValueAtTime(sw(t), ct)));
    }
    const nS = p.nSuzu !== undefined ? Math.round(p.nSuzu) : solo ? 0 : Math.round(clamp(p.suzumushi) * (1 + dens * 3));
    for (let i = 0; i < nS; i++) {         // "riiin": a liquid bell-tone, fast AM, in phrases
      const rf = R(), ra = R(), rp = R();
      const f = p.fSuzu ? p.fSuzu * (1 + i * 0.021) : lerp(4050, 4650, rf), amp = (p.vamp !== undefined ? p.vamp : lerp(0.5, 1, ra)) * 0.16;
      const pos = solo && nS === 1 ? 0 : (nS > 1 ? lerp(-0.75, 0.75, i / (nS - 1)) : 0) + (rp - 0.5) * 0.3;
      const o = K.osc('sine', f, B.c0), am = K.gain(0.45), l = K.osc('sine', lerp(28, 42, R()), B.c0), ld = K.gain(0.55);
      const env = K.gain(0), pn = K.pan(pos);
      l.connect(ld); ld.connect(am.gain);
      K.chain(o, am, env, pn, K.out);
      const take = stream(B.seed + 101 * (i + 1), firstAt(R()), (Q, t) => {
        const notes = [];
        let x = t;
        const n = 2 + Math.floor(Q() * (3 + dens * 5));
        for (let j = 0; j < n; j++) {
          const d = lerp(0.22, 0.42, Q());
          notes.push({ t: x, d, a: lerp(0.6, 1, Q()) });
          x += d + lerp(0.12, 0.3, Q());
        }
        return { notes, next: x + lerp(1.2, 4.5, Q()) * lerp(1.6, 0.6, dens) };
      });
      ticks.push((upto) => {
        for (const e of take(upto)) {
          const ct = B.c(e.t);
          if (e.t < B.t0 || B.late(ct)) continue;
          const A = amp * e.a, g = env.gain;
          g.setValueAtTime(0, ct);
          g.linearRampToValueAtTime(A, ct + 0.025);
          g.linearRampToValueAtTime(A * 0.7, ct + e.d - 0.05);
          g.linearRampToValueAtTime(0, ct + e.d);
          o.frequency.setValueAtTime(f * 0.992, ct);
          o.frequency.linearRampToValueAtTime(f, ct + 0.06);
        }
      });
    }
    const nM = p.nMatsu !== undefined ? Math.round(p.nMatsu) : solo ? 0 : Math.round(clamp(p.matsumushi) * (0.4 + dens * 2));
    for (let i = 0; i < nM; i++) {         // "chin — chi-ro-rin"
      const rf = R(), ra = R(), rp = R();
      const f = p.fMatsu ? p.fMatsu * (1 + i * 0.03) : lerp(2900, 3400, rf), amp = (p.vamp !== undefined ? p.vamp : lerp(0.5, 1, ra)) * 0.15;
      const o = K.osc('sine', f, B.c0), env = K.gain(0), pn = K.pan(solo && nM === 1 ? 0 : (rp - 0.5) * 1.4);
      K.chain(o, env, pn, K.out);
      const rs = R();
      const take = stream(B.seed + 977 * (i + 1), p.first !== undefined ? B.from + p.first : B.from + 1 + rs * 4, (Q, t) => {
        const notes = [];
        let x = t;
        const reps = 1 + Math.floor(Q() * (1 + dens * 3));
        for (let r = 0; r < reps; r++) {
          notes.push({ t: x, d: 0.07, f: 1.06, a: 1 });
          let y = x + 0.21;
          for (const [d, fr, a] of [[0.04, 1.0, 0.8], [0.045, 0.94, 0.75], [0.16, 0.985, 0.85]]) {
            notes.push({ t: y, d, f: fr, a, trill: d > 0.1 });
            y += d + 0.035;
          }
          x = y + lerp(0.9, 1.6, Q());
        }
        return { notes, next: x + lerp(2, 6, Q()) * lerp(1.5, 0.6, dens) };
      });
      ticks.push((upto) => {
        for (const e of take(upto)) {
          const ct = B.c(e.t);
          if (e.t < B.t0 || B.late(ct)) continue;
          const A = amp * e.a, g = env.gain;
          o.frequency.setValueAtTime(f * e.f, ct);
          if (e.trill) {
            for (let k = 0; k * 0.022 < e.d; k++) {
              const u = ct + k * 0.022;
              g.setValueAtTime(0, u);
              g.linearRampToValueAtTime(A, u + 0.006);
              g.linearRampToValueAtTime(0, u + 0.019);
            }
          } else {
            g.setValueAtTime(0, ct);
            g.linearRampToValueAtTime(A, ct + 0.004);
            g.linearRampToValueAtTime(A * 0.6, ct + e.d * 0.6);
            g.linearRampToValueAtTime(0, ct + e.d);
          }
        }
      });
    }
    return (upto) => { for (const t of ticks) t(upto); };
  });

  /* ---------- wind through susuki ---------- */
  /**
   * The shape of one gust, shared with the picture (TSUKI.CUES.gustAt): it begins at
   * dt = 0, peaks at dt = rise (smoothstep), then dies away (≈10 % after `fall` s).
   */
  function gustEnv(dt, rise = 1, fall = 3) {
    if (dt <= 0) return 0;
    if (dt < rise) return sm01(dt / rise);
    return Math.exp((-2.3 * (dt - rise)) / fall);
  }
  bedDef('wind', { brightness: 0.4, gust: 0.5, rate: 1, rev: 0.2, lo: 450, hi: 1500, q: 2.5, rumble: 1, air: 1,
    gusts: null, gustAmt: 0.6, gustRise: 1, gustFall: 3 }, (ctx, K, B) => {
    const p = B.p, br = clamp(p.brightness), gu = clamp(p.gust), rt = def(p.rate, 1), s = B.seed;
    const G = (p.gusts || []).map((g) => (Array.isArray(g) ? g : [g, 1]));
    const gustAt = (t) => {
      let e = 0;
      for (const [tg, a] of G) e += a * gustEnv(t - tg, p.gustRise, p.gustFall);
      return clamp(0.45 + ((U.noise1(t * 0.09 * rt, s) - 0.5) * 1.1 + (U.noise1(t * 0.31 * rt, s + 3) - 0.5) * 0.7 +
        (U.noise1(t * 1.1 * rt, s + 5) - 0.5) * 0.25) * gu * 1.6 + e * p.gustAmt - (G.length ? 0.2 * p.gustAmt : 0), 0.04, 1);
    };
    const n1 = K.noise('pink', B.c0, s), n2 = K.noise('pink', B.c0, s + 1), n3 = K.noise('white', B.c0, s + 2);
    const bhp = K.filter('highpass', 90, 0.6), blp = K.filter('lowpass', 380, 0.6), gb = K.gain(0);
    const bp = K.filter('bandpass', 800, p.q), gw = K.gain(0);
    const hp = K.filter('highpass', 2800, 0.6), hlp = K.filter('lowpass', 6000, 0.5), gh = K.gain(0);
    K.chain(n1, bhp, blp, gb, K.out);
    K.chain(n2, bp, gw, K.out);
    K.chain(n3, hp, hlp, gh, K.out);
    const qk = Math.sqrt(p.q / 2.5);    // a wider band passes more: keep the level
    const set = (t, ct, first) => {
      const g = gustAt(t), m = first ? 'setValueAtTime' : 'linearRampToValueAtTime';
      gb.gain[m](0.7 * (0.3 + 0.7 * g) * p.rumble, ct);
      blp.frequency[m](lerp(250, 520, g), ct);
      bp.frequency[m](lerp(p.lo, p.hi, g) * lerp(0.7, 1.4, br), ct);
      gw.gain[m](2.8 * qk * Math.pow(g, 1.5) * lerp(0.5, 1.2, br), ct);
      gh.gain[m](0.75 * Math.pow(g, 2) * lerp(0.2, 1, br) * p.air, ct);
    };
    set(B.t0, B.c0, true);
    return grid(B, 0.2, (t, ct) => set(t, ct, false));
  });

  /* ---------- trickle: the kakei spout filling the sōzu (narrow-band water) ---------- */
  bedDef('trickle', { flow: 0.6, f: 1500, q: 4, fill: null, bubbles: 0.5, rev: 0.3 }, (ctx, K, B) => {
    const p = B.p, s = B.seed, pts = (p.fill || []).slice().sort((a, b) => a[0] - b[0]);
    const fAt = (t) => {
      if (!pts.length) return p.f;
      if (t <= pts[0][0]) return pts[0][1];
      for (let i = 1; i < pts.length; i++) if (t < pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
      return pts[pts.length - 1][1];
    };
    const n1 = K.noise('white', B.c0, s), n2 = K.noise('white', B.c0, s + 1);
    const bp1 = K.filter('bandpass', fAt(B.t0), p.q), bp2 = K.filter('bandpass', fAt(B.t0) * 2.25, p.q * 1.4);
    const am = K.gain(0.5), g2 = K.gain(0.22), out = K.gain(clamp(p.flow) * 1.4), tl = K.filter('lowpass', 4200, 0.6);
    K.chain(n1, bp1, am); K.chain(n2, bp2, g2, am); K.chain(am, out, tl, K.out);
    // bubbling: a fast, random swell of the stream
    const bub = K.noise('brown', B.c0, s + 2), blp = K.filter('lowpass', 38, 0.7), bg = K.gain(6);
    K.chain(bub, blp, bg); bg.connect(am.gain);
    for (const [t, f] of pts) {
      if (t <= B.t0) continue;
      bp1.frequency.linearRampToValueAtTime(f, B.c(t));
      bp2.frequency.linearRampToValueAtTime(f * 2.25, B.c(t));
    }
    if (!(p.bubbles > 0)) return null;
    const take = stream(s + 5, B.from + 0.3, (Q, t) => ({
      notes: [{ t, f0: lerp(900, 2000, Q()), up: lerp(1.2, 1.6, Q()), d: lerp(0.02, 0.045, Q()), A: 0.05 * lerp(0.3, 1, Q()), pos: Q() * 0.6 - 0.3 }],
      next: t + expo(Q, 1 / (4 * p.bubbles)),
    }));
    return (upto) => {
      for (const e of take(upto)) {
        const ct = B.c(e.t);
        if (e.t < B.t0 || B.late(ct)) continue;
        B.shot((k) => {
          const o = k.osc('sine', e.f0, ct), g = k.gain(0), pn = k.pan(e.pos);
          o.frequency.setValueAtTime(e.f0, ct);
          o.frequency.exponentialRampToValueAtTime(e.f0 * e.up, ct + e.d);
          applyEnv(g.gain, ct, [[0, 0], [0.002, e.A], [0.002, 0, e.d * 0.45]]);
          k.chain(o, g, pn, k.out);
          k.end = ct + e.d * 4 + 0.05;
        });
      }
    };
  });

  /* ---------- water: lapping, drips, the odd koi ---------- */
  bedDef('water', { lap: 0.7, drips: 6, koi: 0.6, rev: 0.35 }, (ctx, K, B) => {
    const p = B.p, s = B.seed, lap = clamp(p.lap);
    const n1 = K.noise('brown', B.c0, s), n2 = K.noise('pink', B.c0, s + 1);
    const llp = K.filter('lowpass', 420, 0.6), gl = K.gain(0), sbp = K.filter('bandpass', 1300, 0.9), gs = K.gain(0);
    const mbp = K.filter('bandpass', 650, 1.1), gm = K.gain(0);
    K.chain(n1, llp, gl, K.out);
    K.chain(n2, sbp, gs, K.out);
    K.chain(n2, mbp, gm, K.out);
    const waves = [];
    const takeW = stream(s + 5, B.from, (Q, t) => {
      const P = lerp(1.1, 2.6, Q());
      return { notes: [{ t, P, A: lerp(0.4, 1, Q()) }], next: t + P * lerp(0.55, 0.9, Q()) };
    });
    const lapAt = (t) => {
      let v = 0.22;
      for (const w of waves) {
        const x = (t - w.t) / w.P;
        if (x > 0 && x < 1) v += w.A * (x < 0.3 ? Math.pow(Math.sin((Math.PI * x) / 0.6), 2) : Math.pow(Math.cos((Math.PI * (x - 0.3)) / 1.4), 2));
      }
      return v;
    };
    const set = (t, ct, first) => {
      for (const w of takeW(t + 0.01)) waves.push(w);
      while (waves.length && waves[0].t + waves[0].P < t - 0.1) waves.shift();
      const v = lapAt(t), m = first ? 'setValueAtTime' : 'linearRampToValueAtTime';
      gl.gain[m](1.1 * lap * v, ct);
      llp.frequency[m](300 + 260 * v, ct);
      mbp.frequency[m](480 + 380 * v, ct);
      gm.gain[m](1.6 * lap * v * v, ct);
      gs.gain[m](0.5 * lap * v * v, ct);
    };
    set(B.t0, B.c0, true);
    const lapTick = grid(B, 0.07, (t, ct) => set(t, ct, false));
    const drip = (ct, f0, up, d, A, pos) => B.shot((k) => {
      const o = k.osc('sine', f0, ct), g = k.gain(0), pn = k.pan(pos);
      o.frequency.setValueAtTime(f0, ct);
      o.frequency.exponentialRampToValueAtTime(f0 * up, ct + d);
      applyEnv(g.gain, ct, [[0, 0], [0.0015, A], [0.0015, 0, d * 0.45]]);
      k.chain(o, g, pn, k.out);
      k.end = ct + d * 4 + 0.05;
    });
    const takeD = stream(s + 7, B.from + 0.5, (Q, t) => ({
      notes: [{ t, f0: lerp(500, 1300, Q()), up: lerp(1.5, 2.4, Q()), d: lerp(0.03, 0.07, Q()), A: 0.09 * lerp(0.3, 1, Q()), pos: Q() * 1.6 - 0.8 }],
      next: t + expo(Q, 60 / Math.max(0.1, p.drips)),
    }));
    const takeK = stream(s + 9, B.from + 3, (Q, t) => ({
      notes: [{ t, A: 0.16 * lerp(0.5, 1, Q()), pos: Q() * 1.2 - 0.6, k: Math.floor(Q() * 1e6) }],
      next: t + expo(Q, 60 / Math.max(0.05, p.koi)),
    }));
    return (upto) => {
      lapTick(upto);
      if (p.drips > 0) for (const e of takeD(upto)) {
        const ct = B.c(e.t);
        if (e.t >= B.t0 && !B.late(ct)) drip(ct, e.f0, e.up, e.d, e.A, e.pos);
      }
      if (p.koi > 0) for (const e of takeK(upto)) {
        const ct = B.c(e.t);
        if (e.t < B.t0 || B.late(ct)) continue;
        B.shot((k) => {                   // a koi breaks the surface
          const n = k.noise('white', ct, e.k), bp = k.filter('bandpass', 1100, 0.7), g = k.gain(0), pn = k.pan(e.pos);
          applyEnv(g.gain, ct, [[0, 0], [0.006, e.A], [0.006, 0, 0.09]]);
          k.chain(n, bp, g, pn, k.out);
          const o = k.osc('sine', 190, ct), og = k.gain(0);
          o.frequency.setValueAtTime(190, ct);
          o.frequency.exponentialRampToValueAtTime(85, ct + 0.15);
          applyEnv(og.gain, ct, [[0, 0], [0.004, e.A * 0.8], [0.004, 0, 0.05]]);
          k.chain(o, og, pn);
          k.end = ct + 0.7;
        });
        const Q = U.rng(e.k);
        for (let j = 0, m = 3 + Math.floor(Q() * 3); j < m; j++) {
          drip(ct + 0.12 + Q() * 0.8, lerp(700, 1500, Q()), lerp(1.4, 2, Q()), lerp(0.025, 0.05, Q()), e.A * 0.35 * Q(), e.pos + (Q() - 0.5) * 0.3);
        }
      }
    };
  });

  /* ---------- drone: the low floor of the most solemn moments ---------- */
  bedDef('drone', { notes: ['D2', 'A2'], beat: 0.12, bright: 0.25, rev: 0.4 }, (ctx, K, B) => {
    const p = B.p, notes = noteList(def(p.notes, p.note)), n = notes.length, br = clamp(p.bright), c0 = B.c0;
    const lp = K.filter('lowpass', lerp(260, 1300, br), 0.5), og = K.gain(0.5 / Math.sqrt(n));
    K.chain(lp, og, K.out);
    const lfo = K.osc('sine', 0.045, c0), lg = K.gain(lerp(60, 280, br));
    lfo.connect(lg); lg.connect(lp.frequency);
    notes.forEach((m, i) => {
      const f = mtof(m), g = K.gain(1), pn = K.pan(n > 1 ? (i % 2 ? 0.25 : -0.25) : 0);
      const a = K.osc('sine', f, c0), b = K.osc('sine', f + p.beat * (1 + i * 0.37), c0);
      const h = K.osc('triangle', f * 2 + p.beat * 0.5, c0), hg = K.gain(0.16);
      const bg = K.gain(0.8);
      a.connect(g); b.connect(bg); bg.connect(g); h.connect(hg); hg.connect(g);
      K.chain(g, pn, lp);
    });
  });

  /* ---------- fire: the elixir burning on Fuji ---------- */
  bedDef('fire', { crackle: 0.6, roar: 0.4, rev: 0.25 }, (ctx, K, B) => {
    const p = B.p, s = B.seed, roar = clamp(p.roar);
    const n1 = K.noise('brown', B.c0, s), n2 = K.noise('pink', B.c0, s + 1);
    const rh = K.filter('highpass', 70, 0.6), rl = K.filter('lowpass', 380, 0.6), gr = K.gain(0), mb = K.filter('bandpass', 850, 0.8), gm = K.gain(0);
    K.chain(n1, rh, rl, gr, K.out);
    K.chain(n2, mb, gm, K.out);
    const set = (t, ct, first) => {
      const a = U.noise1(t * 2.3, s), b = U.noise1(t * 5.1, s + 1), m = first ? 'setValueAtTime' : 'linearRampToValueAtTime';
      gr.gain[m](1.8 * roar * (0.5 + 0.5 * a), ct);
      gm.gain[m](0.9 * roar * b * b, ct);
    };
    set(B.t0, B.c0, true);
    const flick = grid(B, 0.1, (t, ct) => set(t, ct, false));
    const take = stream(s + 3, B.from + 0.2, (Q, t) => {
      const notes = [];
      for (let j = 0, m = 1 + Math.floor(Q() * 6); j < m; j++) {
        const pop = Q() < 0.1;
        notes.push({ t: t + Q() * 0.25, f: pop ? lerp(700, 1200, Q()) : lerp(1500, 5500, Q()), tau: pop ? 0.02 : lerp(0.003, 0.012, Q()),
          A: (pop ? 0.7 : 0.36) * Math.pow(lerp(0.2, 1, Q()), 2), pos: Q() * 1.4 - 0.7, k: Math.floor(Q() * 1e6) });
      }
      notes.sort((x, y) => x.t - y.t);
      return { notes, next: t + 0.26 + expo(Q, 1 / Math.max(0.05, p.crackle * 2.5)) };
    });
    return (upto) => {
      flick(upto);
      for (const e of take(upto)) {
        const ct = B.c(e.t);
        if (e.t < B.t0 || B.late(ct)) continue;
        B.shot((k) => {
          const n = k.noise('white', ct, e.k), bp = k.filter('bandpass', e.f, 1.2), g = k.gain(0), pn = k.pan(e.pos);
          applyEnv(g.gain, ct, [[0, 0], [0.0008, e.A], [0.0008, 0, e.tau]]);
          k.chain(n, bp, g, pn, k.out);
          k.end = ct + e.tau * 8 + 0.01;
        });
      }
    };
  });

  /* ---------- night: near-silence, the room holding its breath ---------- */
  bedDef('night', { air: 0.5, rev: 0.15 }, (ctx, K, B) => {
    const p = B.p;
    const n1 = K.noise('brown', B.c0, B.seed), n2 = K.noise('pink', B.c0, B.seed + 1);
    K.chain(n1, K.filter('lowpass', 160, 0.6), K.gain(0.6), K.out);
    K.chain(n2, K.filter('bandpass', 2800, 0.5), K.gain(0.05 * clamp(p.air)), K.out);
  });

  /* ------------------------------------------------------------------ */
  /* score → voices                                                      */
  /* ------------------------------------------------------------------ */
  const warned = new Set();
  const warnOnce = (msg) => { if (!warned.has(msg)) { warned.add(msg); console.warn('[audio] ' + msg); } };

  const seedOf = (e) => def(e.seed, hashStr(`${e.inst}:${(+e.t).toFixed(3)}:${String(e.note)}`) % 1e9);

  function prepScore(src) {
    src = src || TSUKI.SCORE || {};
    const events = [], beds = [];
    (src.events || []).forEach((e, i) => {
      if (!e || !isFinite(e.t)) return;
      if (!INST[e.inst]) { warnOnce('unknown instrument "' + e.inst + '"'); return; }
      events.push(Object.assign({}, e, { _i: i, seed: seedOf(e) }));
    });
    events.sort((a, b) => a.t - b.t || a._i - b._i);
    (src.beds || []).forEach((b, i) => {
      if (!b || !BEDS[b.inst]) { warnOnce('unknown bed "' + (b && b.inst) + '"'); return; }
      const x = Object.assign({ from: 0, to: 1e5, level: 0.5, fadeIn: 2, fadeOut: 3 }, b);
      x.to = Math.min(isFinite(x.to) ? x.to : 1e5, 1e5);
      x.automation = (b.automation || []).slice().sort((u, v) => u[0] - v[0]);
      x.seed = def(b.seed, hashStr(`${b.inst}:${x.from}:${i}`) % 1e9);
      beds.push(x);
    });
    const master = (src.master || []).filter((x) => Array.isArray(x) && isFinite(x[0]) && isFinite(x[1]))
      .map(([t, v]) => [+t, clamp(+v, 0, 4)]).sort((a, b) => a[0] - b[0]);
    const room = (src.room || []).filter((x) => Array.isArray(x) && isFinite(x[0]) && isFinite(x[1]))
      .map(([t, v]) => [+t, clamp(+v, 0, 4)]).sort((a, b) => a[0] - b[0]);
    return { events, beds, gain: def(src.gain, 1), master, room };
  }

  /** Voice routing: instrument → [distance low-pass] → pan → dry + reverb send. */
  function playEvent(S, e, when, off) {
    const ctx = S.G.ctx, I = INST[e.inst], now = ctx.currentTime;
    let live = 0, oldest = null;
    for (const v of S.voices) {
      if (v.freed || v.end <= now) continue;
      live++;
      if (!oldest || v.start < oldest.start) oldest = v;
    }
    if (live >= MAX_VOICES && oldest) {     // steal the oldest voice, gently
      const g = oldest.vin.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(0, now + 0.05);
      stopKit(oldest, now + 0.06);
      oldest.end = now;
    }
    const p = Object.assign({}, I.defaults, e, { off: off || 0 });
    const dist = clamp(def(p.dist, 0));
    const vk = kit(ctx, null);
    const vin = stereo(vk.gain((1 - 0.45 * dist) * panComp(p.pan)));
    let head = vin;
    if (dist > 0 || p.lp) { const lp = vk.filter('lowpass', p.lp || 18000 * Math.pow(0.07, dist), 0.5); head.connect(lp); head = lp; }
    const pn = vk.pan(def(p.pan, 0)), send = vk.gain(clamp(def(p.rev, 0.3) + dist * 0.35, 0, 1.5));
    head.connect(pn); pn.connect(S.out); pn.connect(send); send.connect(S.send);
    let K;
    try { K = I.fn(ctx, vin, when, p); } catch (err) {
      warnOnce(`${e.inst} @${e.t}: ${err && err.message}`);
      freeKit(vk);
      return null;
    }
    for (const n of vk.nodes) K.nodes.push(n);
    K.vin = vin;
    K.start = when;
    autoFree(K);
    S.voices.push(K);
    return K;
  }

  /* ------------------------------------------------------------------ */
  /* scheduler: one Runner per session, shared by live and offline        */
  /* ------------------------------------------------------------------ */
  const dbg = { log: [], sessions: 0, played: 0, skipped: 0, resumed: 0 };

  function Runner(S, score, T0, c0, fromT) {
    this.S = S; this.score = score; this.T0 = T0; this.anchorT = T0; this.anchorCtx = c0;
    const ev = score.events, from = Math.min(T0, def(fromT, T0));
    let lo = 0, hi = ev.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (ev[m].t < from) lo = m + 1; else hi = m; }
    this.idx = this.first = lo;
    this.beds = score.beds.map(() => null);
  }
  Runner.prototype.c = function (t) { return this.anchorCtx + (t - this.anchorT); };
  Runner.prototype.play = function (e, when, off) {
    playEvent(this.S, e, when, off);
    if (this.live && AUDIO.debug) dbg.log.push({ t: e.t, inst: e.inst, when, off, anchorCtx: this.anchorCtx, anchorT: this.anchorT, now: this.S.G.ctx.currentTime });
  };
  const lenOf = (e) => { const I = INST[e.inst]; return I.len(Object.assign({}, I.defaults, e)); };
  const canResume = (e) => e.resume && INST[e.inst].resumable && !e.trem;
  /** Long notes already sounding at T0 that asked to be resumed. */
  Runner.prototype.begin = function () {
    const ev = this.score.events, T0 = this.T0, now = this.S.G.ctx.currentTime;
    for (let i = this.first - 1; i >= 0 && ev[i].t > T0 - 120; i--) {
      const e = ev[i];
      if (canResume(e) && e.t + lenOf(e) > T0 + 0.2) {
        this.play(e, Math.max(this.c(T0), now), T0 - e.t);
        if (this.live) dbg.resumed++;
      }
    }
  };
  Runner.prototype.advance = function (upto) {
    const S = this.S, now = S.G.ctx.currentTime, ev = this.score.events;
    while (this.idx < ev.length && ev[this.idx].t < upto) {
      const e = ev[this.idx++], when = this.c(e.t);
      if (when >= now - LATE) { this.play(e, Math.max(when, now), 0); if (this.live) dbg.played++; continue; }
      // missed (the page stalled): breath instruments fade in late, plucks are dropped
      const off = now - when + 0.01;
      if ((canResume(e) || (INST[e.inst].sustained && off < 1.5)) && off < lenOf(e) - 0.3) { this.play(e, now + 0.01, off); if (this.live) dbg.resumed++; } else if (this.live) dbg.skipped++;
    }
    const beds = this.score.beds, tNow = this.anchorT + (now - this.anchorCtx);
    for (let i = 0; i < beds.length; i++) {
      const b = beds[i];
      if (this.beds[i] === null && b.from < upto + BED_AHEAD && b.to > this.T0 + 0.05) {
        let t0 = Math.max(b.from, this.T0);
        if (this.c(t0) < now - 0.01) t0 = tNow + 0.02;   // came in late: fade in from here
        if (t0 >= b.to) { this.beds[i] = false; continue; }
        S.beds.push((this.beds[i] = startBed(S, b, t0, (t) => Math.max(0, this.c(t)))));
      }
      if (this.beds[i]) this.beds[i].tick(upto + BED_AHEAD);
    }
    if (S.voices.length > 64) S.voices = S.voices.filter((v) => !v.freed);
  };

  /* ------------------------------------------------------------------ */
  /* transport (live)                                                    */
  /* ------------------------------------------------------------------ */
  let ctx = null, G = null, sess = null, runner = null;
  let playing = false, muted = false, needStart = false, pendAt = 0, pendT = null, lastSeek = -1;

  function stopAll(fade) {
    if (sess) killSession(sess, fade);
    sess = null;
    runner = null;
  }
  function startAt(T, fromT) {
    stopAll(0.06);
    const score = prepScore();
    sess = makeSession(G);
    G.music.gain.setTargetAtTime(score.gain, ctx.currentTime, 0.03);
    runner = new Runner(sess, score, T, ctx.currentTime, fromT);
    runner.live = true;
    scheduleMaster(G.auto.gain, score.master, T, (t) => runner.c(t), ctx.currentTime, 0.02);
    scheduleMaster(sess.room.gain, score.room, T, (t) => runner.c(t), ctx.currentTime, 0);
    runner.begin();
    runner.advance(T + LOOKAHEAD);
    dbg.sessions++;
  }

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); return AUDIO; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { warnOnce('WebAudio unavailable'); return AUDIO; }
    ctx = new AC({ latencyHint: 'interactive' });
    G = makeGraph(ctx);
    G.mute.gain.value = muted ? 0 : 1;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    reverbIR(ctx.sampleRate);
    for (const k of ['white', 'pink', 'brown']) noiseBuffer(ctx.sampleRate, k);
    prewarm();
    return AUDIO;
  }

  /** Build the score's buffers (plucks, bells, clacks, waves) in idle slices, soonest first. */
  function prewarm() {
    const sc = TSUKI.SCORE;
    if (!ctx || !sc || !sc.events) return;
    const sr = ctx.sampleRate, jobs = [() => wave(ctx, 'shakuhachi'), () => wave(ctx, 'sho')], seen = new Set();
    const job = (key, fn) => { if (!seen.has(key)) { seen.add(key); jobs.push(fn); } };
    for (const e of sc.events.filter((x) => x && isFinite(x.t)).sort((a, b) => a.t - b.t)) {
      try {
        if (e.inst === 'koto' || e.inst === 'biwa') {
          const kind = stringKind(e.inst, e);
          for (const m of noteList(def(e.note, 'D4'))) job(kind + Math.round(m), () => pluckBuffer(sr, Math.round(m), kind));
        } else if (INST[e.inst] && INST[e.inst].warm) {
          const p = Object.assign({}, INST[e.inst].defaults, e, { seed: seedOf(e) }), w = INST[e.inst].warm;
          job(e.inst + ':' + JSON.stringify(p), () => w(sr, p));
        } else if (e.inst === 'glass' && e.grains) {
          const p = Object.assign({}, e, { seed: seedOf(e) });
          job('glass:' + JSON.stringify(p), () => glassGrains(sr, Math.round(p.grains), Math.round(def(p.lo, 2000)), Math.round(def(p.hi, 5000)), def(p.spread, 1.5), v4(p)));
        } else if (e.inst === 'suzu') {
          const p = Object.assign({}, e, { seed: seedOf(e) });
          for (let i = 0; i < Math.min(8, Math.max(1, Math.round(def(e.shakes, 1)))); i++) {
            const a = suzuArgs(p, i);
            job('suzu' + a.join(), () => suzuBuffer(sr, ...a));
          }
        } else if (e.inst === 'hyoshigi' || (e.inst === 'taiko' && e.rim)) {
          for (let v = 0; v < 6; v++) job('clack' + v, () => clackBuffer(sr, v));
        }
      } catch (err) { /* a bad note is reported when it plays */ }
    }
    const idle = window.requestIdleCallback ? (f) => window.requestIdleCallback(f, { timeout: 400 }) : (f) => setTimeout(f, 30);
    const step = () => {
      const t0 = perfNow();
      while (jobs.length && perfNow() - t0 < 0.008) jobs.shift()();
      if (jobs.length) idle(step);
    };
    idle(step);
  }

  function play(T) {
    playing = true;
    if (!ctx) return;
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    if (ctx.state === 'running') { needStart = false; startAt(T); } else { needStart = true; pendAt = 0; pendT = T; }
  }
  function pause() {
    playing = false;
    needStart = false;
    stopAll(0.09);
  }
  function seek(T, isPlaying) {
    stopAll(0.06);
    const t = perfNow();
    if (def(isPlaying, playing) && ctx) {
      playing = true;
      needStart = true;
      pendAt = t - lastSeek < 0.25 ? t : -1e9;   // an isolated jump restarts at once; a scrub waits to settle
      pendT = T;
    }
    lastSeek = t;
  }
  function update(T) {
    if (!ctx || !playing) return;
    if (ctx.state !== 'running') {
      if (runner) { stopAll(0.05); needStart = true; pendAt = -1e9; pendT = null; }
      return;
    }
    if (needStart) {
      if (perfNow() - pendAt < SEEK_SETTLE) return;
      needStart = false;
      startAt(T, pendT !== null && pendT <= T && T - pendT < 0.5 ? pendT : T);
      pendT = null;
      return;
    }
    if (!runner) { startAt(T); return; }
    // the engine re-anchored (clock switch, long stall): follow it
    if (Math.abs(runner.anchorT + (ctx.currentTime - runner.anchorCtx) - T) > 0.2) { startAt(T); return; }
    runner.advance(T + LOOKAHEAD);
  }
  function setMuted(m) {
    muted = !!m;
    if (G) G.mute.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.06);
  }

  /** Play one event right now on the live session (for auditioning). */
  function audition(instName, params = {}) {
    if (!ctx) init();
    if (!sess) sess = makeSession(G);
    const e = Object.assign({ t: 0, inst: instName }, params);
    e.seed = def(e.seed, hashStr(JSON.stringify(e)) % 1e9);
    return playEvent(sess, e, ctx.currentTime + 0.03, 0) ? true : false;
  }

  /* ------------------------------------------------------------------ */
  /* offline render (video export): same instruments, same reverb         */
  /* ------------------------------------------------------------------ */
  function renderOffline(T0, T1, sampleRate = 48000, score) {
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const dur = Math.max(0.05, T1 - T0);
    const octx = new OAC({ numberOfChannels: 2, length: Math.ceil(dur * sampleRate), sampleRate });
    const g = makeGraph(octx);
    const s = makeSession(g);
    const sc = prepScore(score);
    g.music.gain.value = sc.gain;
    const r = new Runner(s, sc, T0, 0);
    scheduleMaster(g.auto.gain, sc.master, T0, (t) => t - T0, 0, 0);
    scheduleMaster(s.room.gain, sc.room, T0, (t) => t - T0, 0, 0);
    const CHUNK = 1;
    r.begin();
    r.advance(T0 + CHUNK + LOOKAHEAD);
    for (let t = CHUNK; t < dur - 0.01; t += CHUNK) {
      const at = t;
      octx.suspend(at).then(() => { r.advance(T0 + at + CHUNK + LOOKAHEAD); octx.resume(); });
    }
    return octx.startRendering();
  }

  /* ------------------------------------------------------------------ */
  /* export                                                              */
  /* ------------------------------------------------------------------ */
  Object.assign(AUDIO, {
    // transport (engine.js)
    init, play, pause, seek, update, setMuted, renderOffline,
    running: () => !!ctx && ctx.state === 'running' && playing,
    now: () => (ctx ? ctx.currentTime : 0),
    // composer helpers (score.js)
    phrase, scale, hirajoshi, note: midiOf, notes: noteList, freq: freqOf, mtof, name: nameOf,
    shift: (evs, dt) => evs.map((e) => Object.assign({}, e, { t: e.t + dt })),
    beats: (bpm) => (n) => (n * 60) / bpm,
    SCALES, AITAKE, instruments: INST, beds: BEDS,
    gustEnv, masterAt,
    // development
    audition, prewarm, debug: false, _debug: dbg,
    _buffers: { pluck: pluckBuffer, suzu: suzuBuffer, clack: clackBuffer, ir: reverbIR, noise: noiseBuffer, clear: () => lru.clear() },
    _state: () => ({
      ctx: ctx ? ctx.state : 'none', playing, needStart, sampleRate: ctx ? ctx.sampleRate : 0,
      voices: sess ? sess.voices.filter((v) => !v.freed).length : 0, beds: sess ? sess.beds.length : 0,
      anchorT: runner ? runner.anchorT : null, anchorCtx: runner ? runner.anchorCtx : null,
      master: G ? +G.auto.gain.value.toFixed(4) : null,
      cache: { core: core.size, lru: lru.size },
    }),
  });
})(window.TSUKI = window.TSUKI || {});
