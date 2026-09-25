#!/usr/bin/env node
/* ==========================================================================
   tools/build.js — bundle the film into one self-contained HTML file.
     node tools/build.js
   → dist/tsukimi.html   complete document: CSS, fonts (data URIs) and every
                         script inlined. Open it anywhere, offline.
   → dist/artifact.html  the same page as a body fragment (no doctype/head
                         wrappers) for hosts that supply their own skeleton.
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const MIME = { woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf' };

function inlineCss(href) {
  let css = read(href);
  const dir = path.dirname(href);
  css = css.replace(/url\('([^')]+)'\)/g, (m, u) => {
    if (/^(data:|https?:)/.test(u)) return m;
    const file = path.join(ROOT, dir, u);
    const ext = path.extname(u).slice(1);
    const b64 = fs.readFileSync(file).toString('base64');
    return `url(data:${MIME[ext] || 'application/octet-stream'};base64,${b64})`;
  });
  return css;
}

function build() {
  let html = read('index.html');
  html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) =>
    /^https?:/.test(href) ? m : `<style>\n${inlineCss(href)}\n</style>`);
  html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) =>
    /^https?:/.test(src) ? m : `<script>\n${read(src).replace(/<\/script/gi, '<\\/script')}\n</script>`);
  fs.mkdirSync(DIST, { recursive: true });
  fs.writeFileSync(path.join(DIST, 'tsukimi.html'), html);

  // fragment: <title> + <style>s first, then the body content and scripts
  const title = (html.match(/<title>[\s\S]*?<\/title>/) || [''])[0];
  const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'));
  const styles = (head.match(/<style>[\s\S]*?<\/style>/g) || []).join('\n');
  const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));
  fs.writeFileSync(path.join(DIST, 'artifact.html'), `${title}\n${styles}\n${body}`);

  const kb = (f) => (fs.statSync(path.join(DIST, f)).size / 1024).toFixed(0) + ' KiB';
  console.log(`dist/tsukimi.html  ${kb('tsukimi.html')}\ndist/artifact.html ${kb('artifact.html')}`);
}

build();
