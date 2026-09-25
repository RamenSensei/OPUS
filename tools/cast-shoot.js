#!/usr/bin/env node
/* ==========================================================================
   tools/cast-shoot.js — screenshot the cast model sheets (headless Chromium).

     node tools/cast-shoot.js                      # sheets 1-6 at t=0
     node tools/cast-shoot.js --sheets 1,2 --t 0,1.5,3
     node tools/cast-shoot.js --focus kaguya --scale 1.2 [--t 0,2]
     node tools/cast-shoot.js --perf               # time every character × pose
     options: --out DIR (default shots/cast)  --w 1920

   Writes shots/cast/<sheet>[_t<t>].png and prints console / page errors.
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
  const out = path.resolve(opt('out', path.join(ROOT, 'shots', 'cast')));
  fs.mkdirSync(out, { recursive: true });
  const width = parseInt(opt('w', '1920'), 10);
  const height = Math.round((width * 9) / 16);
  const browser = await pw.chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', (m) => {
    const ty = m.type();
    if (ty === 'error' || ty === 'warning') logs.push(`${ty}: ${m.text()}`);
    else if (opt('perf') || opt('verbose')) console.log(m.text());
  });
  page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
  const base = 'file://' + path.join(ROOT, 'tools', 'cast-sheet.html');
  const times = String(opt('t', '0')).split(',').map(Number);
  const jobs = [];
  if (opt('perf')) {
    jobs.push({ q: 'perf=1', name: 'perf' });
  } else if (opt('zoom')) {
    const z = opt('zoom');
    const extra = ['pose', 'scale', 'cx', 'cy'].filter((k) => opt(k)).map((k) => `${k}=${opt(k)}`).join('&');
    for (const t of times) jobs.push({ q: `zoom=${z}&${extra}&t=${t}${opt('dark') ? '&dark' : ''}`, name: `zoom-${z}${times.length > 1 ? `_t${t}` : ''}` });
  } else if (opt('focus')) {
    const f = opt('focus');
    const sc = opt('scale', '1');
    for (const t of times) jobs.push({ q: `focus=${f}&scale=${sc}&t=${t}`, name: `focus-${f}-s${sc}${times.length > 1 ? `_t${t}` : ''}` });
  } else {
    const sheets = String(opt('sheets', '1,2,3,4,5,6')).split(',');
    for (const s of sheets) for (const t of times) jobs.push({ q: `sheet=${s}&t=${t}`, name: `sheet${s}${times.length > 1 || t ? `_t${t}` : ''}` });
  }
  for (const j of jobs) {
    await page.goto(`${base}?${j.q}&w=${width}`);
    await page.waitForFunction(() => window.__done === true, null, { timeout: 120000 });
    const f = path.join(out, `${j.name}.png`);
    await page.screenshot({ path: f });
    const info = await page.evaluate(() => window.__info || '');
    console.log(`${f}${info ? '  ' + info : ''}`);
  }
  if (logs.length) console.log('CONSOLE:\n' + [...new Set(logs)].join('\n'));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
