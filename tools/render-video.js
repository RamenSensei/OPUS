#!/usr/bin/env node
/* ==========================================================================
   tools/render-video.js — export the film to an MP4 (H.264 + AAC).
   Every frame is rendered deterministically through window.__film.render(t)
   and captured with the DOM calligraphy layer; the soundtrack is rendered
   through an OfflineAudioContext with the same instruments as the live film.

     node tools/render-video.js [--fps 30] [--w 1920] [--from 0] [--to END]
                                [--crf 18] [--out dist/tsukimi.mp4] [--nosubs]

   Needs an ffmpeg build with libx264 and aac: set FFMPEG=/path/to/ffmpeg or
   have `ffmpeg` on PATH.
   ========================================================================== */
'use strict';
const path = require('path');
const fs = require('fs');
const { spawn, execFileSync } = require('child_process');
let pw;
try { pw = require('playwright'); } catch (e) { pw = require('/opt/node22/lib/node_modules/playwright'); }

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf('--' + name);
  if (i < 0) return def;
  const v = args[i + 1];
  return v && !v.startsWith('--') ? v : true;
};

function findFfmpeg() {
  const cands = [process.env.FFMPEG, 'ffmpeg'].filter(Boolean);
  for (const c of cands) {
    try {
      const enc = execFileSync(c, ['-hide_banner', '-encoders'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
      if (enc.includes('libx264')) return c;
    } catch (e) { /* try next */ }
  }
  throw new Error('No ffmpeg with libx264 found. Set FFMPEG=/path/to/ffmpeg.');
}

(async () => {
  const ffmpeg = findFfmpeg();
  const fps = parseFloat(opt('fps', '30'));
  const width = parseInt(opt('w', '1920'), 10);
  const height = Math.round((width * 9) / 16);
  const crf = String(opt('crf', '18'));
  const out = path.resolve(ROOT, opt('out', 'dist/tsukimi.mp4'));
  fs.mkdirSync(path.dirname(out), { recursive: true });

  const browser = await pw.chromium.launch({ args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') logs.push(m.text()); });
  const q = ['still', 'nosound', `w=${width}`];
  await page.goto('file://' + path.join(ROOT, 'index.html') + '?' + q.join('&'));
  await page.waitForFunction(() => window.__film && window.__film.ready);
  await page.evaluate(() => window.__film.ready);
  await page.addStyleTag({ content: '#stage{box-shadow:none!important} #theatre{padding:0!important}' });
  if (opt('nosubs')) await page.addStyleTag({ content: '#subs{display:none!important}' });
  const total = await page.evaluate(() => window.__film.total);
  const from = parseFloat(opt('from', '0'));
  const to = Math.min(total, parseFloat(opt('to', String(total))));
  const frames = Math.round((to - from) * fps);

  // ---- soundtrack
  const wav = path.join(path.dirname(out), '.tsukimi-audio.wav');
  let haveAudio = false;
  const hasAudio = await page.evaluate(() => !!(window.TSUKI.AUDIO && window.TSUKI.AUDIO.renderOffline));
  if (hasAudio) {
    process.stdout.write('rendering soundtrack… ');
    const b64 = await page.evaluate(async ([a, b]) => {
      const buf = await window.TSUKI.AUDIO.renderOffline(a, b, 48000);
      const ch = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
      const data = new DataView(new ArrayBuffer(44 + len * ch * 2));
      const str = (o, s) => { for (let i = 0; i < s.length; i++) data.setUint8(o + i, s.charCodeAt(i)); };
      str(0, 'RIFF'); data.setUint32(4, 36 + len * ch * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
      data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, ch, true);
      data.setUint32(24, sr, true); data.setUint32(28, sr * ch * 2, true); data.setUint16(32, ch * 2, true);
      data.setUint16(34, 16, true); str(36, 'data'); data.setUint32(40, len * ch * 2, true);
      const chans = []; for (let c = 0; c < ch; c++) chans.push(buf.getChannelData(c));
      let o = 44;
      for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) {
        const s = Math.max(-1, Math.min(1, chans[c][i]));
        data.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2;
      }
      const bytes = new Uint8Array(data.buffer);
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
      return btoa(bin);
    }, [from, to]);
    fs.writeFileSync(wav, Buffer.from(b64, 'base64'));
    haveAudio = true;
    console.log('done');
  }

  // ---- frames → ffmpeg
  const ffArgs = ['-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-'];
  if (haveAudio) ffArgs.push('-i', wav);
  ffArgs.push('-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p',
    '-tune', 'animation', '-movflags', '+faststart');
  if (haveAudio) ffArgs.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
  ffArgs.push(out);
  const ff = spawn(ffmpeg, ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    const t = from + i / fps;
    await page.evaluate((x) => window.__film.render(x), t);
    const jpg = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(jpg)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % Math.round(fps * 5) === 0) {
      const el = (Date.now() - t0) / 1000;
      const eta = i ? (el / i) * (frames - i) : 0;
      process.stdout.write(`\rframe ${i}/${frames}  T=${t.toFixed(1)}s  eta ${Math.round(eta)}s   `);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  if (haveAudio) fs.unlinkSync(wav);
  console.log(`\nwrote ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1048576).toFixed(1)} MiB)`);
  if (logs.length) console.log('page messages:\n' + [...new Set(logs)].join('\n'));
})().catch((e) => { console.error(e); process.exit(1); });
