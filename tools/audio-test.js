#!/usr/bin/env node
/* ==========================================================================
   tools/audio-test.js — render and check the sound engine (headless Chromium).

     node tools/audio-test.js                # everything
     node tools/audio-test.js --only full,inst,cover,rt,page
     options: --t0 0 --t1 40 (demo span)  --out shots/audio-demo.wav  --json

   full : renders tools/audio-demo-score.js through TSUKI.AUDIO.renderOffline,
          writes a 16-bit stereo WAV, prints levels / NaN / clipping / DC /
          clicks and the per-second RMS + spectral centroid.
   inst : renders each instrument and bed alone (plus beds at level 1).
   cover: every instrument/bed parameter and composer helper once.
   rt   : drives the live transport (init/play/update/seek/pause) with an
          engine-like irregular frame loop and checks what got scheduled.
   page : opens index.html with sound, presses 開演, seeks and pauses.
   ========================================================================== */
'use strict';
const path = require('path');
const fs = require('fs');
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name, d) => {
  const i = args.indexOf('--' + name);
  if (i < 0) return d;
  const v = args[i + 1];
  return v && !v.startsWith('--') ? v : true;
};
const only = opt('only') ? String(opt('only')).split(',') : ['full', 'inst', 'cover', 'rt', 'page'];
const T0 = parseFloat(opt('t0', '0')), T1 = parseFloat(opt('t1', '40'));
const OUT = path.resolve(opt('out', path.join(ROOT, 'shots', 'audio-demo.wav')));
const fails = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); return ok; };
const fmtStats = (s) => `peak ${s.peakDb} dBFS · rms ${s.rmsDb} · loudest 1s ${s.loudestSecDb} · NaN ${s.nan} · clip ${s.clip}` +
  ` · dc ${s.dc.join('/')} · jumps>0.2 off-onset ${s.jumps} (all ${s.jumpsAll}, max ${s.maxJump}@${s.maxJumpAt}s) · spikes ${s.spikes}${s.spikes ? ' ' + s.spikeAt.join(',') : ''}`;
function safety(name, s, { rmsLo = -60, strict = true } = {}) {
  check(s.nan === 0, `${name}: NaN samples`);
  check(s.clip === 0, `${name}: clipping`);
  check(s.peakDb <= -1, `${name}: peak ${s.peakDb} dBFS > -1`);
  check(Math.abs(s.dc[0]) < 2e-3 && Math.abs(s.dc[1]) < 2e-3, `${name}: DC offset ${s.dc}`);
  if (strict) check(s.jumps === 0, `${name}: ${s.jumps} sample jumps > 0.2 outside onsets`);
  check(s.loudestSecDb > rmsLo, `${name}: too quiet (${s.loudestSecDb} dBFS)`);
}

(async () => {
  const browser = await pw.chromium.launch({
    args: ['--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files', '--disable-web-security'],
  });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  await page.goto('file://' + path.join(ROOT, 'tools', 'audio-test.html'));
  await page.waitForFunction(() => window.TSUKI && TSUKI.AUDIO && TSUKI.SCORE && window.T);

  /* ---------------- full demo render ---------------- */
  if (only.includes('full')) {
    const r = await page.evaluate(async ({ T0, T1 }) => {
      const t = performance.now();
      const buf = await TSUKI.AUDIO.renderOffline(T0, T1, 48000);
      const ms = performance.now() - t;
      const onsets = TSUKI.SCORE.events.map((e) => e.t - T0);
      // hyoshigi kizami / suzu shakes / tremolo have sub-onsets: mask their spans
      for (const e of TSUKI.SCORE.events) {
        const span = e.kizami ? (e.kizamiDur || 4) : e.trem ? (e.dur || 1.6) : e.shakes ? e.shakes / (e.rate || 3.2) : e.count ? e.count * (e.gap || 0.9) : 0;
        for (let x = 0; x < span + 0.05; x += 0.02) onsets.push(e.t - T0 + x);
        if (Array.isArray(e.note)) for (let i = 0; i < e.note.length; i++) onsets.push(e.t - T0 + i * Math.abs(e.strum || 45) / 1000);
      }
      return { ms, stats: T.analyze(buf, onsets), wav: T.wavB64(buf) };
    }, { T0, T1 });
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, Buffer.from(r.wav, 'base64'));
    console.log(`\n== full demo ${T0}–${T1}s rendered in ${(r.ms / 1000).toFixed(2)}s (${((T1 - T0) / (r.ms / 1000)).toFixed(1)}× realtime) → ${OUT}`);
    console.log('   ' + fmtStats(r.stats));
    console.log('   per second (rms dBFS / centroid Hz):');
    const ps = r.stats.perSec;
    for (let i = 0; i < ps.length; i += 8) console.log('   ' + ps.slice(i, i + 8).map((x) => `${String(x.s).padStart(2)}s ${String(x.rmsDb).padStart(6)}/${String(x.centroid).padStart(5)}`).join('  '));
    safety('full mix', r.stats);
    check(r.stats.loudestSecDb >= -24 && r.stats.loudestSecDb <= -12, `full mix: loudest second ${r.stats.loudestSecDb} dBFS outside −24…−12`);
    if (opt('json')) fs.writeFileSync(OUT.replace(/\.wav$/, '.json'), JSON.stringify(r.stats, null, 1));
  }

  /* ---------------- each instrument / bed alone ---------------- */
  if (only.includes('inst')) {
    const res = await page.evaluate(async () => {
      const A = TSUKI.AUDIO, S = TSUKI.SCORE, out = [];
      const names = [...new Set(S.events.map((e) => e.inst))];
      for (const name of names) {
        const evs = S.events.filter((e) => e.inst === name);
        const t0 = Math.max(0, Math.min(...evs.map((e) => e.t)) - 0.2);
        const t1 = Math.min(t0 + 24, Math.max(...evs.map((e) => {
          const I = A.instruments[e.inst];
          return e.t + Math.min(12, I.len(Object.assign({}, I.defaults, e)));
        })) + 0.5);
        const buf = await A.renderOffline(t0, t1, 48000, { events: evs, beds: [] });
        const on = [];
        for (const e of evs) {
          const span = e.kizami ? (e.kizamiDur || 4) : e.trem ? (e.dur || 1.6) : e.shakes ? e.shakes / (e.rate || 3.2) : e.count ? e.count * (e.gap || 0.9) : 0;
          for (let x = 0; x < span + 0.05; x += 0.02) on.push(e.t - t0 + x);
          if (Array.isArray(e.note)) for (let i = 0; i < e.note.length; i++) on.push(e.t - t0 + i * Math.abs(e.strum || 45) / 1000);
          on.push(e.t - t0);
        }
        const st = T.analyze(buf, on);
        delete st.perSec;
        out.push({ name, kind: 'inst', n: evs.length, span: [t0, t1], st });
      }
      for (const b of S.beds) {
        const t1 = Math.min(b.to, b.from + 14);
        const buf = await A.renderOffline(b.from, t1, 48000, { events: [], beds: [b] });
        const st = T.analyze(buf, []);
        delete st.perSec;
        out.push({ name: b.inst, kind: 'bed @' + b.level, span: [b.from, t1], st });
        // calibration: the bed at level 1, 8 s, after its fade
        const cal = Object.assign({}, b, { from: 0, to: 12, level: 1, fadeIn: 0.5, fadeOut: 0.5, automation: [] });
        const cb = await A.renderOffline(2, 10, 48000, { events: [], beds: [cal] });
        const cs = T.analyze(cb, []);
        out.push({ name: b.inst, kind: 'bed @1', span: [2, 10], st: { rmsDb: cs.rmsDb, peakDb: cs.peakDb, loudestSecDb: cs.loudestSecDb } });
      }
      return out;
    });
    console.log('\n== instruments / beds alone');
    for (const r of res) {
      const s = r.st;
      if (r.kind === 'bed @1') { console.log(`   ${r.name.padEnd(11)} level 1 → rms ${s.rmsDb} dBFS, peak ${s.peakDb}`); continue; }
      console.log(`   ${r.name.padEnd(11)} ${r.kind.padEnd(9)} ${fmtStats(s)}`);
      safety(`${r.name} (${r.kind})`, s, { rmsLo: r.kind === 'inst' ? -45 : -60, strict: r.name !== 'fire' });
    }
  }

  /* ---------------- every parameter / helper once ---------------- */
  if (only.includes('cover')) {
    const r = await page.evaluate(async () => {
      const A = TSUKI.AUDIO, errs = [];
      const sc = A.scale('miyako', 'D4'), hj = A.hirajoshi('D4');
      const ok = (c, m) => { if (!c) errs.push(m); };
      ok(A.note('Eb4') === 63 && A.note('E♭4') === 63 && A.note('F#3') === 54 && A.note(62.5) === 62.5, 'note()');
      ok(Math.abs(A.freq('A4') - 440) < 1e-9, 'freq()');
      ok(sc.degs('0 1 2 3 4 5 -1').join() === '62,63,67,69,70,74,58', 'scale.degs ' + sc.degs('0 1 2 3 4 5 -1'));
      ok(sc.snap('E4') === 63 || sc.snap('E4') === 67, 'scale.snap');
      ok(hj.length === 13 && hj[0] === 62 && hj[1] === 55, 'hirajoshi');
      const ph = A.phrase(1, 'D4 . Eb4^2 G4~ A4+D5!', [0.5, 0.25], 'koto', { vel: [0.5, 0.6], human: 0.01 });
      ok(ph.length === 4 && ph[1].press === 2 && ph[2].yuri && Array.isArray(ph[3].note) && ph[3].vel > 0.6, 'phrase parse ' + JSON.stringify(ph));
      const ev = [
        { t: 0.1, inst: 'koto', note: 'G4', slide: -0.5, slideAt: 0.1, slideTime: 0.4 },
        { t: 0.6, inst: 'koto', note: 'A4', press: 1, pressHold: 0.4, vib: 25 },
        { t: 1.2, inst: 'koto', note: 'D5', trem: true, dur: 1, tremShape: 'fade', damp: 0.3 },
        { t: 1.3, inst: 'koto', note: 'Bb4', trem: true, dur: 0.8, tremShape: 'grow', tremRate: 14 },
        { t: 2.4, inst: 'koto', note: 'D3+A3+D4+G4', strum: -80, dur: 1.2, dist: 0.5 },
        { t: 3.0, inst: 'koto', note: 61.5, lp: 3000 },
        { t: 3.5, inst: 'biwa', note: 'A2', strike: 0, slide: 1, vel: 1 },
        { t: 4.0, inst: 'shakuhachi', note: 'D5', dur: 1.5, bends: [[0.6, 1], [1.1, 0]], tone: 0.9, attack: 0.3, release: 0.8, vib: 30, vibRate: 5.5, vibDelay: 0.2 },
        { t: 5.2, inst: 'shakuhachi', note: 'G4', dur: 0.3, bendFrom: 2, muraiki: 1, fall: -2 },
        { t: 5.8, inst: 'rin', note: 'D6', decay: 4, beat: 2 },
        { t: 6.0, inst: 'bonsho', note: 'D2', decay: 8, bright: 1, beat: 0.5, dist: 0.8 },
        { t: 6.5, inst: 'suzu', note: 'A7', shakes: 3, rate: 5, spread: 0.3, count: 20, bright: 1 },
        { t: 7.0, inst: 'taiko', rim: true, vel: 1 },
        { t: 7.3, inst: 'taiko', note: 'D2', decay: 2, vel: 1, dist: 0 },
        { t: 7.6, inst: 'kotsuzumi', stroke: 'chi' }, { t: 7.9, inst: 'kotsuzumi', stroke: 'pu', note: 'A4' },
        { t: 8.0, inst: 'sho', note: ['D5', 'E5', 'A5'], dur: 3, swell: 1, release: 1, bright: 1, width: 1, breath: 1 },
        { t: 8.2, inst: 'sho', aitake: 'kotsu', root: 'A4', dur: 2, swell: 0.5 },
        { t: 8.4, inst: 'sho', aitake: [0, 7, 14], note: 'D5', dur: 1 },
        { t: 9.0, inst: 'hyoshigi', pitch: 1.3, count: 3, gap: 0.2 },
        { t: 9.5, inst: 'hyoshigi', kizami: true, kizamiDur: 1.5 },
        { t: 9.9, inst: 'nonesuch', note: 'D4' },
        // film instruments (js/score.js)
        { t: 0.2, inst: 'sozu', vel: 0.8 }, { t: 1.4, inst: 'sozu', dry: true, vel: 0.5 },
        { t: 0.5, inst: 'kento', vel: 1, rev: 0.02 }, { t: 0.6, inst: 'kento', take: 1 },
        { t: 0.7, inst: 'baren', dur: 2, stroke: 0.5, vel: 0.4 },
        { t: 1.0, inst: 'geese', birds: 3, honks: 3, gap: 0.3, f: 400, echo: 0.5, spread: 0.3 },
        ...['brush', 'rustle', 'crack', 'peel', 'press', 'grass', 'hiss', 'cloth'].map((kind, i) => ({ t: 2 + i * 0.4, inst: 'swish', kind, bright: i / 7 })),
        { t: 3.1, inst: 'plink', f0: 2100, f1: 1500, glide: 0.06, hollow: 1, splash: 0.5 },
        { t: 3.3, inst: 'splash', kind: 'hand', drops: 5 }, { t: 3.6, inst: 'splash', kind: 'gush', dur: 0.3 },
        { t: 4.2, inst: 'pestle', vel: 0.6 }, { t: 4.4, inst: 'puff', dur: 0.4, gutter: 1 },
        { t: 4.6, inst: 'pour', dur: 0.8, f0: 600, f1: 1400, tickAt: 1.0 },
        { t: 5.0, inst: 'mushi', kind: 'suzu', f: 4400, dur: 1.2, pulses: 3 }, { t: 5.5, inst: 'mushi', kind: 'matsu', f: 3300 },
        { t: 6.1, inst: 'glass', note: ['A6', 'B6', 'E7'], swell: 0.8, dur: 1.5, release: 1 },
        { t: 6.3, inst: 'glass', grains: 12, lo: 2500, hi: 4500, spread: 0.8 },
        { t: 6.6, inst: 'koto', note: 'A5', harm: true }, { t: 6.8, inst: 'koto', note: ['A4', 'D5'], worn: true, press: 1 },
        { t: 7.2, inst: 'shakuhachi', note: 'A4', air: true, dur: 0.6, bendFrom: 1, fall: -2 },
        { t: 7.5, inst: 'bonsho', note: 'D4', partials: 'dawn', decay: 6 },
        { t: 7.6, inst: 'bonsho', note: 'D3', partials: [[0.5, 0.5, 1.2, 0.7], [1, 1, 1, 0], [2.4, 0.3, 0.5, 1.1]], decay: 4 },
        { t: 8.6, inst: 'sho', aitake: 'ichi', root: 'A4', dur: 2, release: 0.05, levels: [[0, 0], [0.5, 0.3], [1.5, 1]] },
      ];
      const beds = [
        { inst: 'drone', from: 0, to: 12, notes: 'D2+A2+D3', beat: 0.3, bright: 1, level: 0.4, pan: -0.5 },
        { inst: 'wind', from: 1, to: 11, brightness: 1, gust: 1, rate: 3, level: 0.5, automation: [[3, 1], [6, 0.1], [9, 0.6]] },
        { inst: 'water', from: 0, to: 12, lap: 1, drips: 60, koi: 20, level: 0.5, dist: 0.6 },
        { inst: 'insects', from: 0, to: 12, density: 1, suzumushi: 1, matsumushi: 1, field: 1, level: 0.5 },
        { inst: 'insects', from: 2, to: 12, density: 0, suzumushi: 0, matsumushi: 1, field: 0, level: 0.5, pan: 0.8 },
        { inst: 'fire', from: 0, to: 12, crackle: 1, roar: 1, level: 0.5 },
        { inst: 'night', from: 0, air: 1, level: 1 },
        { inst: 'wind', from: 0.5, to: 11, lo: 800, hi: 2000, q: 1.3, rumble: 0.3, air: 0.2, gusts: [1, [4, 0.5]], gustAmt: 0.7, gustRise: 0.8, gustFall: 2, level: 0.3, muffle: 2500 },
        { inst: 'trickle', from: 0, to: 12, f: 1000, q: 5, fill: [[0, 900], [10, 1500]], bubbles: 1, level: 0.4, lp: 3000 },
        { inst: 'insects', from: 1, to: 12, nSuzu: 1, nMatsu: 1, fSuzu: 4400, fMatsu: 3300, first: 0.2, activity: 0.3, vamp: 0.8, field: 0, level: 0.3 },
        { inst: 'insects', from: 0, to: 12, nSuzu: 0, nMatsu: 0, field: 1, level: 0.2, muffle: 1500 },
      ];
      let st = null;
      try {
        const master = [[0, 0], [0.3, 1], [10.5, 1], [10.6, 0], [11, 0], [11.2, 1]], room = [[3, 1], [3.05, 0], [4, 0], [4.3, 1]];
        const buf = await A.renderOffline(0, 12, 44100, { events: ev, beds, master, room });
        const q = T.analyze({ sampleRate: 44100, length: Math.round(0.4 * 44100), numberOfChannels: 2,
          getChannelData: (c) => buf.getChannelData(c).subarray(Math.round(10.6 * 44100), Math.round(11 * 44100)) }, []);
        ok(q.peakDb < -200, 'master 0 is not digital silence: ' + q.peakDb);
        st = T.analyze(buf, ev.map((e) => e.t));
        delete st.perSec;
        const b2 = await A.renderOffline(4.5, 12, 22050, { events: ev.map((e) => Object.assign({}, e, { resume: true })), beds, master, room });
        const s2 = T.analyze(b2, []);
        ok(s2.nan === 0, 'resume render NaN');
      } catch (e) { errs.push('render: ' + e.stack); }
      return { errs, st };
    });
    console.log('\n== parameter coverage (all params, 44.1k + resumed 22.05k render)');
    if (r.st) console.log('   ' + fmtStats(r.st));
    check(!r.errs.length, 'coverage: ' + r.errs.join('; '));
    if (r.st) { check(r.st.nan === 0, 'coverage: NaN'); check(r.st.peakDb <= -1, 'coverage: peak ' + r.st.peakDb); }
  }

  /* ---------------- live transport ---------------- */
  if (only.includes('rt')) {
    const r = await page.evaluate(async () => {
      const A = TSUKI.AUDIO, errs = [];
      A.debug = true;
      try { A.init(); } catch (e) { errs.push('init: ' + e.message); }
      for (let i = 0; i < 100 && A._state().ctx !== 'running'; i++) await T.sleep(20);
      if (A._state().ctx !== 'running') return { skipped: 'context never ran: ' + A._state().ctx };
      // an engine stand-in: film clock from the audio clock, irregular frames
      let T0 = 9, aT = 9, aC = 0, playing = false, Tn = 9;
      const R = TSUKI.U.rng(7);
      const reanchor = () => { aC = A.running() ? A.now() : performance.now() / 1000; aT = Tn; };
      const clock = () => (A.running() ? A.now() : performance.now() / 1000);
      const frames = async (secs, maxGap = 60) => {
        const end = performance.now() + secs * 1000;
        while (performance.now() < end) {
          await T.sleep(4 + R() * maxGap);
          if (!playing) { A.update(Tn); continue; }
          Tn = aT + (clock() - aC);
          try { A.update(Tn); } catch (e) { errs.push('update: ' + e.message); }
        }
      };
      const play = () => { playing = true; A.play(Tn); reanchor(); };
      const pause = () => { playing = false; A.pause(); };
      const seek = (t) => { Tn = t; A.seek(t, playing); reanchor(); };
      const step = (name) => ({ name, ...A._state(), log: A._debug.log.length });
      const trail = [];
      try {
        Tn = T0; play(); await frames(2.5); trail.push(step('play@9'));
        await T.sleep(1200); await frames(1); trail.push(step('after 1.2s stall'));
        seek(29.5); await frames(1.5); trail.push(step('seek@29.5 (sho resume)'));
        for (let i = 0; i < 10; i++) { seek(14 + i * 0.3); await T.sleep(15); Tn = aT + (clock() - aC); A.update(Tn); }
        await frames(1.2); trail.push(step('after scrub'));
        pause(); await frames(0.4); trail.push(step('paused'));
        seek(31); await frames(0.2); trail.push(step('seek while paused'));
        play(); await frames(1.2); trail.push(step('play@31'));
        A.setMuted(true); await frames(0.2); A.setMuted(false);
        pause();
      } catch (e) { errs.push('transport: ' + e.stack); }
      // every event played on time: ctx when = anchorCtx + (t − anchorT), or at once if (slightly) late
      const bad = [], seen = new Set();
      for (const x of A._debug.log) {
        const want = x.anchorCtx + (x.t - x.anchorT) + (x.off || 0);
        const key = `${x.t}:${x.inst}:${x.anchorCtx}`;
        if (seen.has(key)) bad.push(['dup', x]);
        seen.add(key);
        if (x.off > 0) continue;              // resumed mid-note
        if (want >= x.now && Math.abs(x.when - want) > 1e-6) bad.push(['mistimed', x]);
        if (want < x.now && x.now - want > 0.08) bad.push(['late', x]);
      }
      return { trail, errs, bad: bad.slice(0, 5), nBad: bad.length, n: A._debug.log.length, stats: { ...A._debug, log: undefined } };
    });
    console.log('\n== live transport');
    if (r.skipped) { console.log('   skipped: ' + r.skipped); }
    else {
      for (const s of r.trail) console.log(`   ${s.name.padEnd(24)} ctx ${s.ctx} playing ${s.playing} voices ${s.voices} beds ${s.beds} scheduled ${s.log} anchorT ${s.anchorT == null ? '-' : s.anchorT.toFixed(2)}`);
      console.log(`   sessions ${r.stats.sessions} · played ${r.stats.played} · resumed ${r.stats.resumed} · skipped(late) ${r.stats.skipped} · timing violations ${r.nBad}`);
      if (r.nBad) console.log('   ' + JSON.stringify(r.bad));
      check(!r.errs.length, 'live transport errors: ' + r.errs.join('; '));
      check(r.nBad === 0, `live transport: ${r.nBad} timing violations`);
      const paused = r.trail.find((s) => s.name === 'paused');
      check(paused && !paused.playing && paused.beds === 0, 'pause did not stop the session');
    }
  }

  /* ---------------- the film page with sound ---------------- */
  if (only.includes('page')) {
    const p2 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const plogs = [];
    p2.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') plogs.push(`${m.type()}: ${m.text()}`); });
    p2.on('pageerror', (e) => plogs.push(`pageerror: ${e.message}`));
    await p2.goto('file://' + path.join(ROOT, 'index.html'));
    await p2.waitForFunction(() => window.__film && window.__film.ready);
    await p2.evaluate(() => window.__film.ready);
    if (!(await p2.evaluate(() => TSUKI.SCORE && TSUKI.SCORE.events && TSUKI.SCORE.events.length))) {
      await p2.addScriptTag({ path: path.join(ROOT, 'tools', 'audio-demo-score.js') });
    }
    await p2.click('#btn-start');
    await p2.waitForTimeout(1500);
    const s1 = await p2.evaluate(() => ({ ...TSUKI.AUDIO._state(), running: TSUKI.AUDIO.running(), T: __film.time }));
    await p2.evaluate(() => __film.seek(12));
    await p2.waitForTimeout(800);
    await p2.keyboard.press('ArrowRight');
    await p2.waitForTimeout(800);
    const s2 = await p2.evaluate(() => ({ ...TSUKI.AUDIO._state(), running: TSUKI.AUDIO.running(), T: __film.time }));
    await p2.keyboard.press('m');
    await p2.keyboard.press('m');
    await p2.evaluate(() => __film.pause());
    await p2.waitForTimeout(300);
    const s3 = await p2.evaluate(() => ({ ...TSUKI.AUDIO._state(), running: TSUKI.AUDIO.running(), T: __film.time }));
    console.log('\n== index.html with sound');
    for (const [k, s] of [['started', s1], ['seek+next seg', s2], ['paused', s3]]) {
      console.log(`   ${k.padEnd(14)} T ${s.T.toFixed(2)} ctx ${s.ctx} running ${s.running} voices ${s.voices} beds ${s.beds} sr ${s.sampleRate}`);
    }
    check(s1.running || s1.ctx !== 'running', 'page: audio not running after start');
    check(!s3.running, 'page: still running after pause');
    const errs = plogs.filter((l) => !/Autoplay|AudioContext was not allowed/.test(l));
    if (errs.length) console.log('   CONSOLE:\n   ' + [...new Set(errs)].join('\n   '));
    check(!errs.some((l) => /^(error|pageerror)/.test(l)), 'page: console errors');
  }

  if (logs.length) console.log('\nCONSOLE (test page):\n' + [...new Set(logs)].join('\n'));
  await browser.close();
  console.log(fails.length ? `\nFAIL (${fails.length}):\n - ${fails.join('\n - ')}` : '\nALL CHECKS PASSED');
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
