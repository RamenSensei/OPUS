#!/usr/bin/env node
/* ==========================================================================
   tools/score-test.js — render and check the FILM score (js/score.js).

     node tools/score-test.js                       # everything
     node tools/score-test.js --only render,bowl,rt
     options: --out shots/score-full.wav  --json (also write per-second stats)
              --t0 0 --t1 236 (render span)  --sr 48000

   render : the whole film through TSUKI.AUDIO.renderOffline → 16-bit WAV;
            per-segment RMS / peak / loudest & quietest second / spectral
            centroid / share of energy above 6 kHz and below 150 Hz; the
            written silences; NaN, clipping, clicks outside onsets; level
            jumps at the segment joins; per-second table.
   bowl   : 99.0–100.2 must hold only the 鏧 — re-renders the leap without it.
   cues   : TSUKI.CUES sanity (every array sorted, inside the film, counts).
   rt     : index.html WITH sound: start, seek into long sustained sounds
            (baren, shō, bells, geese), across the absolute silence, scrub,
            pause/play; checks the master curve, timing and console errors.
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
const only = opt('only') ? String(opt('only')).split(',') : ['cues', 'render', 'bowl', 'rt'];
const OUT = path.resolve(opt('out', path.join(ROOT, 'shots', 'score-full.wav')));
const T0 = parseFloat(opt('t0', '0')), T1 = parseFloat(opt('t1', '236')), SR = parseInt(opt('sr', '48000'), 10);
const fails = [], notes = [];
const check = (ok, msg) => { if (!ok) fails.push(msg); return ok; };

/* ---------- in-page analysis (runs in Chromium) ---------- */
function pageAnalysis() {
  const db = (x) => (x > 0 ? 20 * Math.log10(x) : -999);
  const r1 = (x) => Math.round(x * 10) / 10;
  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const a = i + k, b = a + len / 2;
          const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
  }
  /** Per-second RMS, centroid and band energy shares. */
  function perSecond(buf, t0) {
    const sr = buf.sampleRate, L = buf.getChannelData(0), R = buf.getChannelData(1), N = 2048, out = [];
    const win = new Float64Array(N);
    for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N);
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let s = 0; s * sr < buf.length; s++) {
      const a = s * sr, b = Math.min(buf.length, a + sr);
      let ss = 0, pk = 0;
      for (let i = a; i < b; i++) { ss += (L[i] * L[i] + R[i] * R[i]) / 2; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
      const band = { lo: 0, mid: 0, hi: 0, air: 0 };
      let num = 0, den = 0;
      for (let f = a; f + N <= b; f += N) {
        for (let i = 0; i < N; i++) { re[i] = ((L[f + i] + R[f + i]) / 2) * win[i]; im[i] = 0; }
        fft(re, im);
        for (let k = 1; k < N / 2; k++) {
          const hz = (k * sr) / N, p = re[k] * re[k] + im[k] * im[k], m = Math.sqrt(p);
          num += m * hz; den += m;
          if (hz < 150) band.lo += p; else if (hz < 1000) band.mid += p; else if (hz < 6000) band.hi += p; else band.air += p;
        }
      }
      const tot = band.lo + band.mid + band.hi + band.air + 1e-30;
      out.push({ t: t0 + s, rms: r1(db(Math.sqrt(ss / Math.max(1, b - a)))), peak: r1(db(pk)), centroid: den > 0 ? Math.round(num / den) : 0,
        lo: r1(10 * Math.log10(band.lo / tot + 1e-12)), air: r1(10 * Math.log10(band.air / tot + 1e-12)), e: { ...band } });
    }
    return out;
  }
  /** RMS / max over [a, b) seconds of the buffer (film time t0 at sample 0). */
  function span(buf, t0, a, b) {
    const sr = buf.sampleRate, i0 = Math.max(0, Math.round((a - t0) * sr)), i1 = Math.min(buf.length, Math.round((b - t0) * sr));
    let ss = 0, mx = 0, n = 0;
    for (const d of [buf.getChannelData(0), buf.getChannelData(1)]) {
      for (let i = i0; i < i1; i++) { ss += d[i] * d[i]; mx = Math.max(mx, Math.abs(d[i])); n++; }
    }
    return { rms: r1(db(Math.sqrt(ss / Math.max(1, n)))), max: r1(db(mx)), zero: mx === 0 };
  }
  /** Onset masks: every event start, strums, and the whole span of grainy/multi-hit sounds. */
  function onsetsOf(score, t0) {
    const A = TSUKI.AUDIO, on = [];
    const grainy = new Set(['swish', 'splash', 'geese', 'baren', 'pour', 'suzu', 'hyoshigi', 'puff', 'mushi', 'glass', 'sozu', 'plink']);
    for (const e of score.events) {
      on.push(e.t - t0);
      if (Array.isArray(e.note)) for (let i = 0; i < e.note.length; i++) on.push(e.t - t0 + (i * Math.abs(e.strum || 45)) / 1000);
      let spanS = e.trem ? e.dur || 1.6 : 0;
      if (grainy.has(e.inst) && (e.inst !== 'glass' || e.grains)) {
        const I = A.instruments[e.inst];
        spanS = Math.min(3, I.len(Object.assign({}, I.defaults, e)));
      }
      for (let x = 0; x < spanS; x += 0.02) on.push(e.t - t0 + x);
    }
    return on;
  }
  return { perSecond, span, onsetsOf, db };
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
  await page.waitForFunction(() => window.TSUKI && TSUKI.AUDIO && window.T);
  for (const f of ['js/core/palette.js', 'js/script.js', 'js/score.js']) await page.addScriptTag({ path: path.join(ROOT, f) });
  await page.evaluate(`window.SA = (${pageAnalysis.toString()})();`);
  const segs = await page.evaluate(() => {
    let t = 0;
    return TSUKI.SCRIPT.segments.map((s) => { const x = { id: s.id, ja: s.title_ja, start: t, end: t + s.duration }; t += s.duration; return x; });
  });
  const info = await page.evaluate(() => ({ events: TSUKI.SCORE.events.length, beds: TSUKI.SCORE.beds.length,
    insts: [...new Set(TSUKI.SCORE.events.map((e) => e.inst))].join(' '), master: TSUKI.SCORE.master }));
  console.log(`score: ${info.events} events, ${info.beds} beds · instruments: ${info.insts}`);

  /* ---------------- TSUKI.CUES sanity ---------------- */
  if (only.includes('cues')) {
    const c = await page.evaluate(() => {
      const C = TSUKI.CUES, out = { arrays: {}, errs: [] };
      for (const [k, v] of Object.entries(C)) {
        if (!Array.isArray(v)) continue;
        const flat = v.flat();
        out.arrays[k] = v.length;
        if (!flat.every((x) => typeof x === 'number' && x >= 0 && x <= 236)) out.errs.push(k + ': out of film');
        for (let i = 1; i < v.length; i++) if (!Array.isArray(v[i]) && v[i] < v[i - 1]) out.errs.push(k + ': unsorted');
      }
      const n = (k, want) => { if (C[k].length !== want) out.errs.push(`${k}: ${C[k].length} ≠ ${want}`); };
      n('kento', 8); n('dango', 15); n('dangoLate', 15); n('dangoLateSilent', 4); n('palmBeads', 15); n('bells', 3); n('peels', 4);
      if (C.dango[14] !== 29.4 || C.dangoLate[14] !== 168.7) out.errs.push('dango ends ' + C.dango[14] + ' / ' + C.dangoLate[14]);
      if (Math.abs(C.gustAt(14.0) - 1) > 0.01) out.errs.push('gustAt(14.0) = ' + C.gustAt(14.0));
      // every CLICK-like sound in the score sits on a CUES time
      const S = TSUKI.SCORE.events;
      const at = (inst, pred = () => true) => S.filter((e) => e.inst === inst && pred(e)).map((e) => e.t);
      const same = (a, b, k) => { if (a.join() !== b.join()) out.errs.push(`${k}: score ${a.join()} ≠ cues ${b.join()}`); };
      same(at('kento'), [...C.kento, ...C.click], 'kento');
      same(at('sozu', (e) => !e.dry), C.sozu, 'sozu');
      same(at('bonsho'), C.bells, 'bells');
      same(at('pestle'), C.pestle.filter((t) => t < C.pestleFade[1]), 'pestle');
      same(at('koto', (e) => e.harm && (e.t === 33.6 || e.t === 197.5)), C.harmonic, 'harmonic');
      same(at('rin'), C.bowl, 'bowl');
      out.dangoLateSilent = C.dangoLateSilent;
      return out;
    });
    console.log('\n== TSUKI.CUES: ' + Object.entries(c.arrays).map(([k, n]) => `${k}(${n})`).join(' '));
    console.log('   silent late dango at ' + c.dangoLateSilent.join(', '));
    check(!c.errs.length, 'cues: ' + c.errs.join('; '));
  }

  /* ---------------- full render ---------------- */
  if (only.includes('render')) {
    const r = await page.evaluate(async ({ T0, T1, SR, segs }) => {
      const tt = performance.now();
      const buf = await TSUKI.AUDIO.renderOffline(T0, T1, SR);
      const ms = performance.now() - tt;
      window.__buf = buf;
      const safety = T.analyze(buf, SA.onsetsOf(TSUKI.SCORE, T0));
      delete safety.perSec;
      const ps = SA.perSecond(buf, T0);
      const seg = segs.map((s) => {
        const a = Math.max(s.start, T0), b = Math.min(s.end, T1);
        const secs = ps.filter((x) => x.t >= a && x.t < b);
        const sp = SA.span(buf, T0, a, b);
        const E = secs.reduce((m, x) => { for (const k in x.e) m[k] = (m[k] || 0) + x.e[k]; return m; }, {});
        const tot = (E.lo || 0) + (E.mid || 0) + (E.hi || 0) + (E.air || 0) + 1e-30;
        const audible = secs.filter((x) => x.rms > -70);
        return { id: s.id, ja: s.ja, a, b, rms: sp.rms, peak: sp.max,
          loud: Math.max(...secs.map((x) => x.rms)), quiet: Math.min(...secs.map((x) => x.rms)),
          centroid: Math.round(audible.reduce((m, x) => m + x.centroid, 0) / Math.max(1, audible.length)),
          air: Math.round(10 * 10 * Math.log10((E.air || 1e-30) / tot)) / 10, lo: Math.round(10 * 10 * Math.log10((E.lo || 1e-30) / tot)) / 10,
          head: SA.span(buf, T0, a, Math.min(b, a + 2)).rms, tail: SA.span(buf, T0, Math.max(a, b - 2), b).rms };
      });
      const quiet = [[0, 2], [99.0, 100.2], [148.0, 152.0], [234.2, 236.0]].filter(([a, b]) => a >= T0 && b <= T1)
        .map(([a, b]) => ({ a, b, ...SA.span(buf, T0, a, b) }));
      // the loudest single seconds, and where high/low energy is strongest (harshness / mud)
      const top = (key, n) => ps.filter((x) => x.rms > -60).sort((x, y) => y[key] - x[key]).slice(0, n).map((x) => ({ t: x.t, v: x[key], rms: x.rms }));
      return { ms, safety, seg, quiet, ps: ps.map(({ e, ...x }) => x), loudest: top('rms', 6), harsh: top('air', 6), mud: top('lo', 6), len: buf.length, sr: buf.sampleRate };
    }, { T0, T1, SR, segs });

    // WAV: fetch the rendered buffer in 10 s chunks of interleaved 16-bit PCM
    const chunks = [];
    const CH = 10 * r.sr;
    for (let i = 0; i < r.len; i += CH) {
      const b64 = await page.evaluate(({ i, CH }) => {
        const b = window.__buf, L = b.getChannelData(0), R = b.getChannelData(1), n = Math.min(CH, b.length - i);
        const out = new Int16Array(n * 2);
        for (let k = 0; k < n; k++) {
          out[2 * k] = Math.max(-32768, Math.min(32767, Math.round(L[i + k] * 32767)));
          out[2 * k + 1] = Math.max(-32768, Math.min(32767, Math.round(R[i + k] * 32767)));
        }
        const u8 = new Uint8Array(out.buffer);
        let s = '';
        for (let j = 0; j < u8.length; j += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(j, j + 0x8000));
        return btoa(s);
      }, { i, CH });
      chunks.push(Buffer.from(b64, 'base64'));
    }
    const data = Buffer.concat(chunks), hdr = Buffer.alloc(44);
    hdr.write('RIFF', 0); hdr.writeUInt32LE(36 + data.length, 4); hdr.write('WAVE', 8); hdr.write('fmt ', 12);
    hdr.writeUInt32LE(16, 16); hdr.writeUInt16LE(1, 20); hdr.writeUInt16LE(2, 22); hdr.writeUInt32LE(r.sr, 24);
    hdr.writeUInt32LE(r.sr * 4, 28); hdr.writeUInt16LE(4, 32); hdr.writeUInt16LE(16, 34); hdr.write('data', 36); hdr.writeUInt32LE(data.length, 40);
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, Buffer.concat([hdr, data]));

    const s = r.safety;
    console.log(`\n== film score ${T0}–${T1} s @ ${r.sr} Hz rendered in ${(r.ms / 1000).toFixed(1)} s (${((T1 - T0) / (r.ms / 1000)).toFixed(1)}× realtime) → ${path.relative(ROOT, OUT)}`);
    console.log(`   peak ${s.peakDb} dBFS · integrated rms ${s.rmsDb} · loudest 1 s ${s.loudestSecDb} · NaN ${s.nan} · clipped samples ${s.clip} · dc ${s.dc.join('/')}`);
    console.log(`   clicks outside onsets: sample jumps>0.2 ${s.jumps} (all ${s.jumpsAll}, max ${s.maxJump}@${s.maxJumpAt}s) · 2nd-difference spikes ${s.spikes}${s.spikes ? ' at ' + s.spikeAt.join(', ') : ''}`);
    console.log('\n   segment              span        rms    peak   loud1s quiet1s centroid  >6kHz  <150Hz   head→tail');
    for (const g of r.seg) {
      console.log(`   ${(g.ja || g.id).padEnd(14, '　').slice(0, 10).padEnd(12)} ${String(g.a).padStart(5)}–${String(g.b).padEnd(5)} ${String(g.rms).padStart(6)} ${String(g.peak).padStart(6)}  ${String(g.loud).padStart(6)} ${String(g.quiet).padStart(6)}  ${String(g.centroid).padStart(6)} ${String(g.air).padStart(6)} ${String(g.lo).padStart(6)}   ${g.head} → ${g.tail}`);
    }
    console.log('\n   joins (last 2 s → first 2 s of the next):  ' + r.seg.slice(0, -1).map((g, i) => `${g.b}: ${g.tail}→${r.seg[i + 1].head}`).join(' · '));
    console.log('\n   written silences:');
    for (const q of r.quiet) console.log(`     ${q.a}–${q.b}: rms ${q.rms} dBFS · max ${q.max} dBFS${q.zero ? ' · DIGITAL SILENCE' : ''}`);
    console.log('   loudest seconds: ' + r.loudest.map((x) => `${x.t}s ${x.v}`).join(' · '));
    console.log('   most energy >6 kHz (dB of total): ' + r.harsh.map((x) => `${x.t}s ${x.v} (rms ${x.rms})`).join(' · '));
    console.log('   most energy <150 Hz (dB of total): ' + r.mud.map((x) => `${x.t}s ${x.v} (rms ${x.rms})`).join(' · '));
    console.log('\n   per second: rms dBFS / centroid Hz / >6k share dB');
    for (let i = 0; i < r.ps.length; i += 6) {
      console.log('   ' + r.ps.slice(i, i + 6).map((x) => `${String(x.t).padStart(3)}s ${String(x.rms).padStart(6)}/${String(x.centroid).padStart(5)}/${String(x.air).padStart(5)}`).join('  '));
    }
    if (opt('json')) fs.writeFileSync(OUT.replace(/\.wav$/, '.json'), JSON.stringify(r, null, 1));

    // ---- checks ----
    check(s.nan === 0, 'render: NaN samples');
    check(s.clip === 0, 'render: clipping');
    check(s.peakDb <= -1, `render: peak ${s.peakDb} dBFS > −1`);
    check(s.jumps === 0 && s.spikes === 0, `render: ${s.jumps} jumps / ${s.spikes} spikes outside onsets`);
    const q = (a) => r.quiet.find((x) => x.a === a);
    if (q(148.0)) check(q(148.0).zero || q(148.0).max < -80, `silence 148–152: max ${q(148.0).max} dBFS`);
    if (q(234.2)) check(q(234.2).zero || q(234.2).max < -80, `silence 234.2–236: max ${q(234.2).max} dBFS`);
    if (q(0)) check(q(0).rms < -44 && q(0).rms > -60, `0–2 s should be paper room tone ≈ −50 dBFS (${q(0).rms})`);
    for (const g of r.seg) {
      check(g.loud <= -16, `${g.id}: loudest second ${g.loud} dBFS (> −16)`);
      if (g.air > -12) notes.push(`${g.id}: ${g.air} dB of its energy above 6 kHz`);
    }
  }

  /* ---------------- 99.0–100.2: only the bowl ---------------- */
  if (only.includes('bowl')) {
    const b = await page.evaluate(async () => {
      const S = TSUKI.SCORE, noBowl = { ...S, events: S.events.filter((e) => e.inst !== 'rin') };
      const with_ = await TSUKI.AUDIO.renderOffline(96, 101, 48000);
      const without = await TSUKI.AUDIO.renderOffline(96, 101, 48000, noBowl);
      return { withBowl: SA.span(with_, 96, 99.0, 100.2), rest: SA.span(without, 96, 99.02, 100.2), before: SA.span(without, 96, 98.0, 99.0) };
    });
    console.log(`\n== the leap 99.0–100.2: with the bowl rms ${b.withBowl.rms} dBFS · everything else ${b.rest.rms} dBFS (max ${b.rest.max}) · the second before ${b.before.rms}`);
    check(b.rest.rms < b.withBowl.rms - 20, `leap gap: residual ${b.rest.rms} dBFS is not ≥ 20 dB under the bowl (${b.withBowl.rms})`);
  }

  /* ---------------- live: the film page with sound ---------------- */
  if (only.includes('rt')) {
    const p2 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const plogs = [];
    p2.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') plogs.push(`${m.type()}: ${m.text()}`); });
    p2.on('pageerror', (e) => plogs.push(`pageerror: ${e.message}`));
    await p2.goto('file://' + path.join(ROOT, 'index.html'));
    await p2.waitForFunction(() => window.__film && window.__film.ready);
    await p2.evaluate(() => window.__film.ready);
    await p2.evaluate(() => { TSUKI.AUDIO.debug = true; });
    await p2.click('#btn-start');
    await p2.waitForTimeout(1200);
    const st = () => p2.evaluate(() => ({ ...TSUKI.AUDIO._state(), running: TSUKI.AUDIO.running(), T: +__film.time.toFixed(2),
      played: TSUKI.AUDIO._debug.played, resumed: TSUKI.AUDIO._debug.resumed, skipped: TSUKI.AUDIO._debug.skipped }));
    const trail = [];
    const step = async (name, fn, wait) => { if (fn) await p2.evaluate(fn); await p2.waitForTimeout(wait); trail.push({ name, ...(await st()) }); };
    await step('started (poster T)', null, 300);
    await step('seek 0 (paper room)', () => __film.seek(0), 1500);
    await step('seek 3.0 (baren)', () => __film.seek(3.0), 900);
    await step('seek 18.0 (motif)', () => __film.seek(18.0), 900);
    await step('seek 130 (shō, 8 beds)', () => __film.seek(130.0), 1000);
    await step('seek 147.3 → silence', () => __film.seek(147.3), 1500);
    await step('in the silence', null, 800);
    await step('seek 150.5 (in silence)', () => __film.seek(150.5), 900);
    for (let i = 0; i < 8; i++) await p2.evaluate((t) => __film.seek(t), 170 + i * 0.7).then(() => p2.waitForTimeout(25));
    await step('after scrub → 175 geese', null, 1000);
    await step('pause', () => __film.pause(), 300);
    await step('seek 216 paused', () => __film.seek(216.0), 200);
    await step('play @216 (bells)', () => __film.play(), 1200);
    await step('seek 233.4 → end', () => __film.seek(233.4), 3200);
    const dbg = await p2.evaluate(() => {
      const bad = [];
      for (const x of TSUKI.AUDIO._debug.log) {
        if (x.off > 0) continue;
        const want = x.anchorCtx + (x.t - x.anchorT);
        if (want >= x.now && Math.abs(x.when - want) > 1e-6) bad.push(['mistimed', x.t, x.inst]);
        if (want < x.now && x.now - want > 0.08) bad.push(['late', x.t, x.inst]);
      }
      return { n: TSUKI.AUDIO._debug.log.length, bad: bad.slice(0, 6), nBad: bad.length };
    });
    console.log('\n== index.html with sound (live transport)');
    for (const s of trail) console.log(`   ${s.name.padEnd(26)} T ${String(s.T).padStart(7)} ctx ${s.ctx} running ${s.running} master ${s.master} voices ${s.voices} beds ${s.beds} · played ${s.played} resumed ${s.resumed} skipped ${s.skipped}`);
    console.log(`   scheduled ${dbg.n} · timing violations ${dbg.nBad}${dbg.nBad ? ' ' + JSON.stringify(dbg.bad) : ''}`);
    const at = (n) => trail.find((s) => s.name === n);
    const hasCtx = at('started (poster T)').ctx === 'running';
    if (!hasCtx) notes.push('rt: the AudioContext did not run in this browser; transport checks skipped');
    else {
      check(at('in the silence').master === 0, `rt: master should be 0 inside 148–152 (got ${at('in the silence').master})`);
      check(at('seek 0 (paper room)').master === 1 && at('seek 0 (paper room)').beds >= 1, 'rt: the opening (paper room) did not start');
      check(at('seek 130 (shō, 8 beds)').beds >= 8, 'rt: beds not running at 130');
      check(at('seek 130 (shō, 8 beds)').voices >= 1, 'rt: the shō did not resume at 130');
      check(at('play @216 (bells)').voices >= 1, 'rt: the bell did not resume at 216');
      check(!at('pause').running, 'rt: still running after pause');
      check(dbg.nBad === 0, `rt: ${dbg.nBad} timing violations`);
    }
    const errs = plogs.filter((l) => !/Autoplay|AudioContext was not allowed/.test(l));
    if (errs.length) console.log('   CONSOLE:\n   ' + [...new Set(errs)].join('\n   '));
    check(!errs.some((l) => /^(error|pageerror)/.test(l)), 'rt: console errors on the film page');
    check(!errs.some((l) => /\[audio\]/.test(l)), 'rt: audio warnings on the film page');
  }

  if (logs.length) console.log('\nCONSOLE (test page):\n' + [...new Set(logs)].join('\n'));
  check(!logs.some((l) => /^(error|pageerror)|\[audio\]/.test(l)), 'test page: console errors / audio warnings');
  await browser.close();
  if (notes.length) console.log('\nNOTES:\n - ' + notes.join('\n - '));
  console.log(fails.length ? `\nFAIL (${fails.length}):\n - ${fails.join('\n - ')}` : '\nALL CHECKS PASSED');
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
