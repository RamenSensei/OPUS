#!/usr/bin/env node
/* ==========================================================================
   tools/shoot.js — capture still frames from the film (headless Chromium).

     node tools/shoot.js --times 3,12.5,40            # global times
     node tools/shoot.js --seg bamboo --n 6            # 6 frames spread over a segment
     node tools/shoot.js --seg bamboo --at 0,4,9.5     # local times within a segment
     node tools/shoot.js --all --n 3                   # every segment
     options: --out DIR (default shots/)  --w 1280 (capture width)
              --sheet (also write a contact sheet per run)  --nopaper

   Prints console errors / scene errors and the file list. Frames are
   rendered through window.__film.render(t), so they are exact.
   ========================================================================== */
'use strict';
const path = require('path');
const fs = require('fs');
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

(async () => {
  const out = path.resolve(opt('out', path.join(ROOT, 'shots')));
  fs.mkdirSync(out, { recursive: true });
  const width = parseInt(opt('w', '1280'), 10);
  const height = Math.round((width * 9) / 16);
  const launch = { args: ['--disable-web-security', '--allow-file-access-from-files'] };
  if (fs.existsSync('/opt/pw-browsers/chromium')) launch.executablePath = undefined;
  const browser = await pw.chromium.launch(launch);
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  const q = ['still', 'nosound', `w=${width}`];
  if (opt('nopaper')) q.push('nopaper');
  await page.goto('file://' + path.join(ROOT, process.env.PAGE||'index.html') + '?' + q.join('&'));
  await page.waitForFunction(() => window.__film && window.__film.ready);
  await page.evaluate(() => window.__film.ready);
  // the stage fills the viewport in still mode
  await page.addStyleTag({ content: '#stage{box-shadow:none!important} #theatre{padding:0!important}' });
  const segs = await page.evaluate(() => window.__film.segments);
  const total = await page.evaluate(() => window.__film.total);

  const jobs = [];
  const segArg = opt('seg');
  const n = parseInt(opt('n', '4'), 10);
  const localTimes = (s) => {
    const at = opt('at');
    if (at && at !== true) return String(at).split(',').map(Number);
    return Array.from({ length: n }, (_, i) => (s.duration * (i + 0.5)) / n);
  };
  if (opt('times')) {
    for (const t of String(opt('times')).split(',').map(Number)) {
      const s = [...segs].reverse().find((x) => t >= x.start) || segs[0];
      jobs.push({ t, label: `${s.id}@${(t - s.start).toFixed(1)}` });
    }
  } else if (segArg || opt('all')) {
    const list = opt('all') ? segs : segs.filter((s) => String(segArg).split(',').includes(s.id));
    if (!list.length) { console.error('unknown segment', segArg, 'known:', segs.map((s) => s.id).join(', ')); process.exit(2); }
    for (const s of list) for (const lt of localTimes(s)) jobs.push({ t: s.start + lt, label: `${s.id}@${lt.toFixed(1)}` });
  } else {
    for (let i = 0; i < 8; i++) jobs.push({ t: (total * (i + 0.5)) / 8, label: `T${((total * (i + 0.5)) / 8).toFixed(1)}` });
  }

  const files = [];
  for (const j of jobs) {
    const t0 = Date.now();
    await page.evaluate((t) => window.__film.render(t), j.t);
    const ms = Date.now() - t0;
    const f = path.join(out, `${j.label.replace(/[^\w@.-]/g, '_')}.png`);
    await page.screenshot({ path: f });
    files.push(f);
    console.log(`${f}  (T=${j.t.toFixed(2)}, render ${ms}ms)`);
  }

  if (opt('sheet') && files.length > 1) {
    const cols = Math.min(3, files.length);
    const tw = 640, th = 360;
    const rows = Math.ceil(files.length / cols);
    const sheet = await browser.newPage({ viewport: { width: cols * tw, height: rows * (th + 28) } });
    const html = `<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${tw}px);font:14px monospace;color:#ccc">` +
      files.map((f) => `<div><img src="file://${f}" style="width:${tw}px;height:${th}px;display:block"><div style="height:28px;line-height:28px;padding-left:6px">${path.basename(f)}</div></div>`).join('') + '</body>';
    const tmp = path.join(out, '_sheet.html');
    fs.writeFileSync(tmp, html);
    await sheet.goto('file://' + tmp);
    await sheet.waitForTimeout(200);
    const sf = path.join(out, `sheet-${Date.now()}.png`);
    await sheet.screenshot({ path: sf, fullPage: true });
    fs.unlinkSync(tmp);
    console.log(`contact sheet: ${sf}`);
  }

  const sceneErrors = await page.evaluate(() => window.__film.errors());
  if (Object.keys(sceneErrors).length) console.log('SCENE ERRORS:', JSON.stringify(sceneErrors, null, 2));
  if (logs.length) console.log('CONSOLE:\n' + [...new Set(logs)].join('\n'));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
