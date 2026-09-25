#!/usr/bin/env node
/* ==========================================================================
   tools/script-from-screenplay.js — one-off generator: design/screenplay.json
   → js/script.js skeleton (segments, durations, text cues). Transitions are
   emitted as a default and the screenplay's prose is kept as a comment so a
   human can choose the engine transition type. Refuses to overwrite an
   existing js/script.js unless --force.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const sp = JSON.parse(fs.readFileSync(path.join(ROOT, 'design/screenplay.json'), 'utf8'));
const outFile = path.join(ROOT, 'js/script.js');
if (fs.existsSync(outFile) && !process.argv.includes('--force') && !/temporary test script/.test(fs.readFileSync(outFile, 'utf8'))) {
  console.error('js/script.js exists; pass --force to overwrite');
  process.exit(1);
}
const J = (v) => JSON.stringify(v);
const lines = [];
lines.push('/* ==========================================================================');
lines.push(`   script.js — the film's running order and every word it shows.`);
lines.push('   Generated from design/screenplay.json, then edited by hand.');
lines.push('   ========================================================================== */');
lines.push('(function (TSUKI) {');
lines.push("  'use strict';");
lines.push('  TSUKI.SCRIPT = {');
lines.push(`    title: ${J({ ja: sp.title.ja, zh: sp.title.zh, en: sp.title.en, reading: sp.title.reading })},`);
lines.push(`    curtain: { columns: ${J([sp.title.ja])} },`);
lines.push('    segments: [');
sp.segments.forEach((s, i) => {
  lines.push('      {');
  lines.push(`        id: ${J(s.id)}, title_ja: ${J(s.title_ja)}, title_zh: ${J(s.title_zh)}, duration: ${s.duration},`);
  if (i > 0) {
    const prev = sp.segments[i - 1];
    lines.push(`        // from previous: ${String(prev.transition_out || '').replace(/\s+/g, ' ').slice(0, 300)}`);
    lines.push(`        transition: { type: 'cross', dur: 2 },`);
  }
  lines.push('        text: [');
  for (const c of s.text_cues || []) {
    const o = { t: c.t, dur: c.dur, kind: c.kind, ja: c.ja, author: c.author || undefined, zh: c.zh, position: c.position };
    lines.push(`          ${J(o)},`);
  }
  lines.push('        ],');
  lines.push('      },');
});
lines.push('    ],');
lines.push('  };');
lines.push('})(window.TSUKI = window.TSUKI || {});');
fs.writeFileSync(outFile, lines.join('\n') + '\n');
console.log(`wrote js/script.js with ${sp.segments.length} segments`);
