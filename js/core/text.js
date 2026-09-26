/* ==========================================================================
   text.js — the calligraphy layer (TSUKI.TEXT).
   Poems, titles and narration live in the DOM above the canvas so the
   Japanese can be set vertically (縦書き) in real fonts. Each frame the
   engine calls TEXT.update(T); every style is computed from T alone, so
   seeking and still-frame capture always show the right state.

   Cue shape (see js/script.js):
     { t, dur, kind: 'haiku'|'waka'|'narration'|'title'|'caption'|'cartouche',
       ja: [col, col, ...], author, zh, en, position, x, y, ink: 'light'|'dark',
       size, chirashi: [offsets px], seal,
       sub_ink: 'dark' — the Chinese subtitle in sumi (over pale paper) }
   ========================================================================== */
(function (TSUKI) {
  'use strict';

  const U = TSUKI.U;
  const TEXT = (TSUKI.TEXT = {});

  let overlay = null, subs = null, subsZh = null, subsEn = null;
  let cues = [];
  let subsEnabled = true;

  const el = (tag, cls, parent) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  };

  /** Split a column string into per-character spans; returns span list. */
  const charSpans = (parent, str) => {
    const out = [];
    for (const ch of [...str]) {
      const s = el('span', 'ch', parent);
      s.textContent = ch;
      if (ch === ' ' || ch === '　') s.classList.add('sp');
      out.push(s);
    }
    return out;
  };

  const DEFAULTS = {
    haiku:     { reveal: 2.6, out: 1.6, stagger: 0.11, cls: 'poem haiku' },
    waka:      { reveal: 3.0, out: 1.5, stagger: 0.085, cls: 'poem waka' },
    kanshi:    { reveal: 2.6, out: 1.5, stagger: 0.11, cls: 'poem waka kanshi' },
    letter:    { reveal: 3.0, out: 1.4, stagger: 0.09, cls: 'poem narration letter' },
    narration: { reveal: 1.8, out: 1.2, stagger: 0.05, cls: 'poem narration' },
    title:     { reveal: 3.2, out: 2.0, stagger: 0.22, cls: 'title-card' },
    caption:   { reveal: 1.2, out: 1.0, stagger: 0.03, cls: 'caption' },
    cartouche: { reveal: 1.4, out: 1.4, stagger: 0.06, cls: 'cartouche' },
  };

  function build(cue) {
    const d = DEFAULTS[cue.kind] || DEFAULTS.narration;
    const root = el('div', `${d.cls} pos-${cue.position || 'right'} ink-${cue.ink || 'light'}${cue.font ? ' font-' + cue.font : ''}${cue.layout ? ' laid' : ''}`, overlay);
    root.style.display = 'none';
    if (cue.layout) {
      root.style.left = '0px'; root.style.top = '0px'; root.style.right = 'auto'; root.style.bottom = 'auto';
    } else {
      if (cue.x != null) { root.style.left = cue.x + 'px'; root.style.right = 'auto'; root.style.transform = 'none'; }
      if (cue.y != null) { root.style.top = cue.y + 'px'; root.style.bottom = 'auto'; }
    }
    if (cue.size) root.style.setProperty('--fs', cue.size + 'px');
    const spans = [];
    let author = null, seal = null;
    if (cue.kind === 'caption') {
      const line = el('div', 'cap-line', root);
      spans.push(...charSpans(line, (cue.ja || []).join(' ')));
    } else {
      const body = el('div', 'cols', root);
      (cue.ja || []).forEach((col, i) => {
        const c = el('div', 'col', body);
        const L = cue.layout && cue.layout[i];
        if (L) {
          // absolute placement per column (e.g. title on a painted tanzaku)
          c.style.position = 'absolute';
          c.style.left = L.x + 'px';
          c.style.top = L.y + 'px';
          if (L.size) c.style.fontSize = L.size + 'px';
          if (L.font) c.style.fontFamily = L.font === 'brush' ? 'var(--f-brush)' : 'var(--f-mincho)';
          if (L.spacing != null) c.style.letterSpacing = L.spacing + 'em';
        } else {
          const off = cue.chirashi ? cue.chirashi[i] || 0 : defaultChirashi(cue, i);
          if (off) c.style.marginTop = off + 'px';
        }
        spans.push(...charSpans(c, col));
      });
      if (cue.author || cue.seal) {
        const sig = el('div', 'sig', body);
        if (cue.sigAt) {
          sig.style.position = 'absolute';
          sig.style.left = cue.sigAt.x + 'px';
          sig.style.top = cue.sigAt.y + 'px';
        }
        if (cue.author) {
          const a = el('div', 'author', sig);
          a.textContent = cue.author;
          author = a;
        }
        if (cue.seal !== false) {
          const s = el('div', 'seal' + (cue.seal_style === '朱文' ? ' shubun' : ' hakubun') + (cue.start >= 160 ? ' seal-faded' : ''), sig);
          const txt = cue.seal || '月';
          s.textContent = txt;
          if ([...txt].length > 1) s.classList.add('multi');
          seal = s;
        }
      }
      if (cue.kind === 'title' && (cue.zh || cue.en)) {
        const sub = el('div', 'title-sub', root);
        if (cue.zh) el('div', 'title-zh', sub).textContent = cue.zh;
        if (cue.en) el('div', 'title-en', sub).textContent = cue.en;
      }
    }
    // 落款 comes after the text: the signature and the seal are animated
    // (except on the title card, which is signed from the start)
    if (cue.kind === 'title') author = seal = null;
    if (author) author.style.opacity = '0';
    if (seal) seal.style.opacity = '0';
    return { root, spans, d, author, seal };
  }

  // Default 散らし書き: poems step down column by column like a hand-written
  // tanzaku; narration stays aligned.
  function defaultChirashi(cue, i) {
    if (cue.kind === 'haiku') return [0, 70, 140][i] || 0;
    if (cue.kind === 'waka') return [0, 44, 88, 36, 80][i] || 0;
    return 0;
  }

  /** Initialise with the script. Call once after the DOM exists. */
  TEXT.init = (overlayEl, subsEl, script) => {
    overlay = overlayEl;
    subs = subsEl;
    subs.innerHTML = '';
    subsZh = el('div', 'sub-zh', subs);
    subsEn = el('div', 'sub-en', subs);
    cues = [];
    for (const seg of script.segments) {
      for (const c of seg.text || []) {
        const cue = { ...c, start: seg.start + c.t, end: seg.start + c.t + c.dur, seg: seg.id };
        cue.dom = build(cue);
        cues.push(cue);
      }
    }
    cues.sort((a, b) => a.start - b.start);
  };

  TEXT.setSubs = (on) => {
    subsEnabled = on;
    subs.classList.toggle('off', !on);
  };

  const setIf = (obj, key, val) => {
    if (obj['_' + key] !== val) {
      obj['_' + key] = val;
      return true;
    }
    return false;
  };

  /** Update every cue for global time T. */
  TEXT.update = (T) => {
    let subZh = '', subEn = '', subA = 0, subInk = false;
    for (const cue of cues) {
      const { root, spans, d, author, seal } = cue.dom;
      const visible = T >= cue.start && T <= cue.end;
      if (setIf(root, 'vis', visible)) root.style.display = visible ? '' : 'none';
      if (!visible) continue;
      const lt = T - cue.start;
      const outP = U.seg(T, cue.end - d.out, cue.end, U.ease.inSine);
      // block-level fade out: dissolve upward like mist
      const blockOp = (1 - outP).toFixed(3);
      if (setIf(root, 'op', blockOp)) {
        root.style.opacity = blockOp;
        root.style.filter = outP > 0.001 ? `blur(${(outP * 5).toFixed(2)}px)` : 'none';
        root.style.translate = outP > 0.001 ? `0 ${(-outP * 14).toFixed(1)}px` : '0 0';
      }
      // per-character ink soak
      const n = spans.length;
      const stagger = Math.min(d.stagger, (d.reveal * 0.75) / Math.max(1, n));
      const charDur = Math.max(0.5, d.reveal - stagger * n);
      for (let i = 0; i < n; i++) {
        const p = U.seg(lt, i * stagger, i * stagger + charDur, U.ease.outCubic);
        const s = spans[i];
        const key = p.toFixed(3);
        if (setIf(s, 'p', key)) {
          s.style.opacity = key;
          s.style.filter = p < 0.999 ? `blur(${((1 - p) * 6).toFixed(2)}px)` : 'none';
          s.style.translate = p < 0.999 ? `0 ${((1 - p) * -8).toFixed(1)}px` : '0 0';
        }
      }
      // the signature soaks in as the last characters land; the seal is
      // stamped half a second after the poem is complete
      const R = Math.max(0, n - 1) * stagger + charDur;
      if (author) {
        const a = U.seg(lt, R * 0.9, R * 0.9 + 0.6, U.ease.outCubic).toFixed(3);
        if (setIf(author, 'p', a)) author.style.opacity = a;
      }
      if (seal) {
        const p = U.seg(lt, R + 0.5, R + 0.62);
        const a = p.toFixed(3);
        if (setIf(seal, 'p', a)) {
          seal.style.opacity = a;
          seal.style.scale = p < 0.999 ? (1.12 - 0.12 * p).toFixed(3) : '';
        }
      }
      if (cue.kind !== 'title' && (cue.zh || cue.en)) {
        const a = U.env(lt, 0.8, 2.0, cue.dur - d.out, cue.dur);
        if (a > subA) { subA = a; subZh = cue.zh || ''; subEn = cue.en || ''; subInk = cue.sub_ink === 'dark'; }
      }
    }
    if (setIf(subsZh, 'txt', subZh)) subsZh.textContent = subZh;
    if (setIf(subsEn, 'txt', subEn)) subsEn.textContent = subEn;
    // dark subtitle ink for cues whose band is pale paper (cue.sub_ink)
    if (setIf(subs, 'dark', subInk)) subs.classList.toggle('dark', subInk);
    // the line's ink fades as a, its halo as a² (film.css): the block itself
    // is never faded as a whole, which would bring the dark halo in with it
    const sa = subA.toFixed(3);
    if (setIf(subs, 'op', sa)) {
      subs.style.opacity = subA > 0 ? '1' : '0';
      subs.style.setProperty('--sa', sa);
      subs.style.setProperty('--ss', (subA * subA).toFixed(3));
    }
  };

  TEXT.cues = () => cues;
})(window.TSUKI = window.TSUKI || {});
