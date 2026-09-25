/* ==========================================================================
   engine.js — the projector (TSUKI.ENGINE).
   Owns the stage, the clock, scene registry, transitions between segments,
   the paper finish, the controls and the capture/debug hooks.

   Scenes register with:
     TSUKI.scene('segment-id', {
       init(S)            // optional, once: build caches (S.canvas(), etc.)
       draw(ctx, t, S)    // required: pure function of local time t (s)
     });
   ctx is already scaled so the stage is 1920×1080 logical px.
   S = { W, H, dur, seg, T, U, B, C, canvas(w,h) }.
   A scene may be asked for t slightly < 0 or > dur during transitions:
   keep drawing gracefully (clamp your own timelines).
   ========================================================================== */
(function (TSUKI) {
  'use strict';

  const U = TSUKI.U, B = TSUKI.B;
  const W = 1920, H = 1080;
  const scenes = {};
  TSUKI.scene = (id, def) => { scenes[id] = def; };

  const ENGINE = (TSUKI.ENGINE = { W, H, scenes });

  /* ------------------------------------------------------------------ */
  /* state                                                               */
  /* ------------------------------------------------------------------ */
  let script, segs, total;
  let stage, canvas, ctx, overlay, bufA, bufB, bufM, ctxA, ctxB, ctxM;
  let k = 1;                 // backing px per logical px
  let T = 0;                 // film time (s)
  let playing = false;
  let anchorClock = 0, anchorT = 0, clockKind = 'perf';
  let started = false;
  let muted = false;
  let audioOn = false;       // AudioContext created (after a user gesture)
  let audioWaitUntil = 0;
  let lastUI = 0;
  const params = new URLSearchParams(location.search);
  const DEBUG = params.has('debug');
  const STILL = params.has('still');
  const errors = {};

  const AUDIO = () => TSUKI.AUDIO;

  /* ------------------------------------------------------------------ */
  /* clock                                                               */
  /* ------------------------------------------------------------------ */
  const audioClock = () => {
    const A = AUDIO();
    return A && A.running && A.running() ? A.now() : null;
  };
  const clockNow = () => {
    const a = audioClock();
    return a != null ? a : performance.now() / 1000;
  };
  const reanchor = () => {
    clockKind = audioClock() != null ? 'audio' : 'perf';
    anchorClock = clockNow();
    anchorT = T;
  };

  /* ------------------------------------------------------------------ */
  /* sizing                                                              */
  /* ------------------------------------------------------------------ */
  function resize() {
    const theatre = document.getElementById('theatre');
    const fs = !!document.fullscreenElement;
    const vw = theatre.clientWidth, vh = theatre.clientHeight;
    const margin = fs || STILL || vw < 700 ? 0 : Math.min(48, vw * 0.03);
    const scale = Math.min((vw - margin * 2) / W, (vh - margin * 2) / H);
    const cssW = Math.floor(W * scale), cssH = Math.floor(H * scale);
    stage.style.width = cssW + 'px';
    stage.style.height = cssH + 'px';
    overlay.style.transform = `scale(${cssW / W})`;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let bw = Math.round(cssW * dpr);
    if (params.has('w')) bw = parseInt(params.get('w'), 10) || bw;
    bw = U.clamp(bw, 480, 2560);
    const bh = Math.round((bw * H) / W);
    for (const c of [canvas, bufA, bufB, bufM]) { c.width = bw; c.height = bh; }
    k = bw / W;
    if (TSUKI.PRINT) TSUKI.PRINT.setQuality(k);
    for (const c of [ctx, ctxA, ctxB, ctxM]) {
      c.setTransform(k, 0, 0, k, 0, 0);
      c.imageSmoothingQuality = 'high';
    }
    render(T);
  }

  /* ------------------------------------------------------------------ */
  /* scene drawing                                                       */
  /* ------------------------------------------------------------------ */
  function resetCtx(c) {
    c.setTransform(k, 0, 0, k, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.filter = 'none';
    c.shadowBlur = 0;
    c.shadowColor = 'rgba(0,0,0,0)';
    c.lineCap = 'butt';
    c.lineJoin = 'miter';
  }

  function sceneCtx(seg) {
    return { W, H, dur: seg.duration, seg, T, U, B, C: TSUKI.C, canvas: B.canvas, k };
  }

  function drawSeg(c, seg, t) {
    resetCtx(c);
    c.fillStyle = TSUKI.C.kinari;
    c.fillRect(0, 0, W, H);
    const sc = scenes[seg.id];
    if (!sc) return placeholder(c, seg, t);
    try {
      if (!sc._inited && sc.init) { sc.init(sceneCtx(seg)); }
      sc._inited = true;
      c.save();
      sc.draw(c, t, sceneCtx(seg));
      c.restore();
    } catch (e) {
      if (!errors[seg.id]) { errors[seg.id] = String(e && e.stack || e); console.error(`[scene ${seg.id}]`, e); }
      resetCtx(c);
      placeholder(c, seg, t, true);
    }
    resetCtx(c);
  }

  function placeholder(c, seg, t, broken) {
    c.fillStyle = broken ? '#3a1d1d' : TSUKI.C.koiai;
    c.fillRect(0, 0, W, H);
    B.moon(c, 1380, 360, 150, { halo: 0.6, mica: t });
    c.fillStyle = TSUKI.C.gofun;
    c.font = '48px "Shippori Mincho B1", serif';
    c.textAlign = 'center';
    c.fillText(`${seg.title_ja || seg.id}${broken ? '（描画エラー）' : ''}`, W / 2, H * 0.72);
    c.font = '28px "Shippori Mincho B1", serif';
    c.fillText(`${seg.id} · ${t.toFixed(1)}s / ${seg.duration}s`, W / 2, H * 0.72 + 56);
  }

  /* ------------------------------------------------------------------ */
  /* transitions                                                         */
  /* ------------------------------------------------------------------ */
  let noiseField = null; // low-res fbm for ink dissolves
  function getNoise() {
    if (noiseField) return noiseField;
    const w = 192, h = 108;
    const f = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      f[y * w + x] = 0.75 * U.fbm2(x / 22, y / 22, 4, 41) + 0.25 * U.hash2(x, y);
    }
    const cv = B.canvas(w, h);
    noiseField = { w, h, f, cv, cx: cv.getContext('2d'), img: null };
    noiseField.img = noiseField.cx.createImageData(w, h);
    return noiseField;
  }

  /** Paint a mask into ctxM (white = show B). */
  function maskInk(p, soft = 0.08, center) {
    const N = getNoise();
    const d = N.img.data;
    const th = U.lerp(-soft, 1 + soft, p);
    for (let y = 0; y < N.h; y++) for (let x = 0; x < N.w; x++) {
      const i = y * N.w + x;
      let v = N.f[i];
      if (center) {
        // bias: open first near a point (e.g. the moon)
        const dx = x / N.w - center[0] / W, dy = y / N.h - center[1] / H;
        v = v * 0.55 + Math.min(1, Math.hypot(dx * 1.6, dy) * 1.3) * 0.45;
      }
      const a = U.smoothstep(v - soft, v + soft, th) * 255;
      const o = i * 4;
      d[o] = d[o + 1] = d[o + 2] = 255;
      d[o + 3] = a;
    }
    N.cx.putImageData(N.img, 0, 0);
    ctxM.save();
    ctxM.setTransform(k, 0, 0, k, 0, 0);
    ctxM.clearRect(0, 0, W, H);
    ctxM.imageSmoothingEnabled = true;
    ctxM.drawImage(N.cv, 0, 0, W, H);
    ctxM.restore();
  }

  function composite(type, p, tr) {
    const e = U.ease.inOutSine(p);
    const kin = TSUKI.C.kin, gofun = TSUKI.C.gofun, sumi = TSUKI.C.sumi;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    const full = (c) => ctx.drawImage(c, 0, 0);
    switch (type) {
      case 'cut':
        full(bufB);
        break;
      case 'paper':
      case 'sumi': {
        const col = type === 'paper' ? (tr.color || TSUKI.C.kinari) : (tr.color || sumi);
        if (p < 0.5) { full(bufA); ctx.globalAlpha = U.ease.inOutSine(p * 2); }
        else { full(bufB); ctx.globalAlpha = 1 - U.ease.inOutSine((p - 0.5) * 2); }
        ctx.fillStyle = col;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        break;
      }
      case 'ink': {
        full(bufA);
        maskInk(e, tr.soft || 0.09, tr.center);
        ctxB.save();
        ctxB.setTransform(1, 0, 0, 1, 0, 0);
        ctxB.globalCompositeOperation = 'destination-in';
        ctxB.drawImage(bufM, 0, 0);
        ctxB.restore();
        full(bufB);
        break;
      }
      case 'iris': {
        full(bufA);
        const [cx, cy] = tr.center || [W / 2, H / 2];
        const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) * 1.05;
        const r = U.ease.inOutCubic(p) * R;
        const soft = tr.soft == null ? 60 : tr.soft;
        ctxM.save();
        ctxM.setTransform(k, 0, 0, k, 0, 0);
        ctxM.clearRect(0, 0, W, H);
        const g = ctxM.createRadialGradient(cx, cy, Math.max(0, r - soft), cx, cy, r + 0.01);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctxM.fillStyle = g;
        ctxM.fillRect(0, 0, W, H);
        ctxM.restore();
        ctxB.save();
        ctxB.setTransform(1, 0, 0, 1, 0, 0);
        ctxB.globalCompositeOperation = 'destination-in';
        ctxB.drawImage(bufM, 0, 0);
        ctxB.restore();
        full(bufB);
        if (tr.ring !== false && r > 1) {
          ctx.setTransform(k, 0, 0, k, 0, 0);
          ctx.strokeStyle = U.rgba(tr.ringColor || kin, 0.55 * Math.sin(Math.PI * p));
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, r - soft * 0.5, 0, U.TAU);
          ctx.stroke();
        }
        break;
      }
      case 'kasumi': {
        // すやり霞: long mist bands drift in from the right (emaki reading
        // direction), cover the frame, the scene changes beneath them, and
        // they drift on out to the left.
        const rows = tr.rows || 7;
        const col = tr.color || kin;
        const rh = H / rows;
        const pad = 160;
        const s = U.smoothstep(0.42, 0.58, p);
        full(bufA);
        if (s > 0) { ctx.globalAlpha = s; full(bufB); ctx.globalAlpha = 1; }
        ctx.setTransform(k, 0, 0, k, 0, 0);
        for (let i = 0; i < rows; i++) {
          const d = U.hash(i * 7 + 3) * 0.14;
          const q = U.clamp((p - d) / 0.86);
          let L, R;
          if (q < 0.5) { L = U.lerp(W + pad, -pad, U.ease.inOutCubic(q / 0.5)); R = W + pad; }
          else { L = -pad; R = U.lerp(W + pad, -pad, U.ease.inOutCubic((q - 0.5) / 0.5)); }
          const y = i * rh - rh * 0.3 + U.wobble(i * 1.7 + p * 2, 3) * rh * 0.06;
          const shade = U.mix(col, TSUKI.C.gofun, 0.12 * (i % 3));
          B.band(ctx, L, y, R - L, rh * 1.55, shade, tr.alpha == null ? 1 : tr.alpha, 0.35);
        }
        break;
      }
      case 'scroll': {
        // emaki: unrolling right→left means the new scene enters from the
        // LEFT while the old one moves off to the right.
        const x = e * canvas.width;
        ctx.drawImage(bufA, x, 0);
        ctx.drawImage(bufB, x - canvas.width, 0);
        ctx.setTransform(k, 0, 0, k, 0, 0);
        const sx = x / k;
        const g = ctx.createLinearGradient(sx - 40, 0, sx + 40, 0);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(0.5, `rgba(40,30,20,${0.25 * Math.sin(Math.PI * p)})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(sx - 40, 0, 80, H);
        break;
      }
      case 'cross':
      default:
        full(bufA);
        ctx.globalAlpha = e;
        full(bufB);
    }
    ctx.globalAlpha = 1;
    void gofun;
  }

  /* ------------------------------------------------------------------ */
  /* frame                                                               */
  /* ------------------------------------------------------------------ */
  function segIndexAt(t) {
    for (let i = segs.length - 1; i >= 0; i--) if (t >= segs[i].start) return i;
    return 0;
  }

  function render(t) {
    if (!segs) return;
    t = U.clamp(t, 0, total - 1e-3);
    const i = segIndexAt(t);
    const seg = segs[i];
    const lt = t - seg.start;
    const tr = seg.transition;
    if (i > 0 && tr && tr.type !== 'cut' && lt < tr.dur) {
      const prev = segs[i - 1];
      drawSeg(ctxA, prev, t - prev.start);
      drawSeg(ctxB, seg, lt);
      resetCtx(ctx);
      composite(tr.type, U.clamp(lt / tr.dur), tr);
    } else {
      drawSeg(ctx, seg, lt);
    }
    resetCtx(ctx);
    if (!params.has('nopaper')) TSUKI.PAPER.apply(ctx, script.paperStrength == null ? 1 : script.paperStrength);
    TSUKI.TEXT.update(t);
    updateUI(t, i);
    if (DEBUG) debugHUD(t, seg, lt);
  }

  function debugHUD(t, seg, lt) {
    resetCtx(ctx);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(12, 12, 560, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '22px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`T ${t.toFixed(2)}  ${seg.id}  t ${lt.toFixed(2)}/${seg.duration}`, 22, 40);
  }

  function frame() {
    requestAnimationFrame(frame);
    if (playing) {
      // hold the picture for a moment while the AudioContext spins up, so
      // the first notes are not dropped (Safari/iOS can take ~300 ms)
      if (audioWaitUntil && audioClock() == null && performance.now() < audioWaitUntil) {
        reanchor();
        return;
      }
      audioWaitUntil = 0;
      if ((clockKind === 'audio') !== (audioClock() != null)) reanchor();
      T = anchorT + (clockNow() - anchorClock);
      if (T >= total) { T = total - 1e-3; pause(); showEnd(true); }
      const A = AUDIO();
      if (A && A.update) A.update(T);
      render(T);
    }
  }

  /* ------------------------------------------------------------------ */
  /* transport                                                           */
  /* ------------------------------------------------------------------ */
  function play() {
    if (T >= total - 0.05) seek(0);
    playing = true;
    showEnd(false);
    const A = AUDIO();
    if (A && A.play) A.play(T);
    audioWaitUntil = audioOn && !muted ? performance.now() + 600 : 0;
    reanchor();
    document.body.classList.add('playing');
    document.body.classList.remove('paused');
    pokeUI();
  }
  function pause() {
    playing = false;
    const A = AUDIO();
    if (A && A.pause) A.pause();
    document.body.classList.remove('playing');
    document.body.classList.add('paused');
    pokeUI();
  }
  function seek(t) {
    T = U.clamp(t, 0, total - 1e-3);
    const A = AUDIO();
    if (A && A.seek) A.seek(T, playing);
    reanchor();
    showEnd(false);
    render(T);
  }
  const toggle = () => (playing ? pause() : play());

  /* ------------------------------------------------------------------ */
  /* UI                                                                  */
  /* ------------------------------------------------------------------ */
  const $ = (id) => document.getElementById(id);
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  let uiSegIdx = -1, uiTime = '';

  function buildUI() {
    const ticks = $('ticks');
    ticks.innerHTML = '';
    segs.forEach((s, i) => {
      const b = document.createElement('button');
      b.className = 'tick';
      b.type = 'button';
      b.style.left = (s.start / total) * 100 + '%';
      b.style.width = (s.duration / total) * 100 + '%';
      b.title = `${s.title_ja}${s.title_zh ? ' · ' + s.title_zh : ''}`;
      b.setAttribute('aria-label', `第${i + 1}段 ${s.title_ja}`);
      b.addEventListener('click', (ev) => { ev.stopPropagation(); seek(s.start + 0.01); pokeUI(); });
      ticks.appendChild(b);
    });
    const scrub = $('scrub');
    scrub.max = String(total);
    scrub.addEventListener('input', () => { seek(parseFloat(scrub.value)); pokeUI(); });
    $('btn-play').addEventListener('click', (e) => { e.stopPropagation(); ensureStarted(); toggle(); });
    $('btn-subs').addEventListener('click', (e) => { e.stopPropagation(); setSubs(!subsOn); });
    $('btn-sound').addEventListener('click', (e) => { e.stopPropagation(); setMuted(!muted); });
    $('btn-full').addEventListener('click', (e) => { e.stopPropagation(); fullscreen(); });
    $('btn-start').addEventListener('click', (e) => { e.stopPropagation(); start(); });
    $('btn-again').addEventListener('click', (e) => { e.stopPropagation(); seek(0); play(); });
    stage.addEventListener('click', () => { if (started) toggle(); });
    for (const ev of ['mousemove', 'touchstart']) document.addEventListener(ev, pokeUI, { passive: true });
    document.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); });
    document.addEventListener('fullscreenchange', resize);
    window.addEventListener('resize', resize);
  }

  let subsOn = true;
  function setSubs(on) {
    subsOn = on;
    TSUKI.TEXT.setSubs(on);
    $('btn-subs').setAttribute('aria-pressed', String(on));
    try { localStorage.setItem('tsuki.subs', on ? '1' : '0'); } catch (e) { /* storage unavailable */ }
  }
  function setMuted(m) {
    muted = m;
    const A = AUDIO();
    if (A && A.setMuted) A.setMuted(m);
    $('btn-sound').setAttribute('aria-pressed', String(!m));
    $('btn-sound').classList.toggle('muted', m);
  }
  function fullscreen() {
    const el = $('theatre');
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  }
  function ensureStarted() {
    if (started) return;
    started = true;
    document.body.classList.add('started');
    const A = AUDIO();
    if (A && A.init && !params.has('nosound')) {
      try { A.init(); A.setMuted && A.setMuted(muted); audioOn = true; } catch (e) { console.warn('audio init failed', e); }
    }
  }
  function start() {
    ensureStarted();
    play();
  }
  function showEnd(on) {
    document.body.classList.toggle('ended', on);
  }
  function pokeUI() {
    lastUI = performance.now();
    document.body.classList.add('ui');
    clearTimeout(pokeUI._t);
    pokeUI._t = setTimeout(() => {
      if (playing && performance.now() - lastUI > 2400) document.body.classList.remove('ui');
    }, 2600);
  }
  function updateUI(t, i) {
    const ts = `${fmt(t)} / ${fmt(total)}`;
    if (ts !== uiTime) { uiTime = ts; $('time').textContent = ts; $('scrub').value = String(t); }
    if (i !== uiSegIdx) {
      uiSegIdx = i;
      const s = segs[i];
      $('seg-name').textContent = `${s.title_ja}${s.title_zh ? '　' + s.title_zh : ''}`;
      document.querySelectorAll('.tick').forEach((el, j) => el.classList.toggle('on', j === i));
    }
  }
  function onKey(e) {
    if (e.target && (e.target.tagName === 'INPUT' && e.target.type !== 'range')) return;
    const i = segIndexAt(T);
    switch (e.key) {
      case ' ': case 'k': case 'K':
        e.preventDefault();
        if (!started) start(); else toggle();
        break;
      case 'ArrowRight': e.preventDefault(); seek(i < segs.length - 1 ? segs[i + 1].start + 0.01 : T); break;
      case 'ArrowLeft': e.preventDefault(); seek(T - segs[i].start > 2 ? segs[i].start + 0.01 : segs[Math.max(0, i - 1)].start + 0.01); break;
      case 'l': case 'L': seek(T + 5); break;
      case 'j': case 'J': seek(T - 5); break;
      case 'f': case 'F': fullscreen(); break;
      case 'c': case 'C': setSubs(!subsOn); break;
      case 'm': case 'M': setMuted(!muted); break;
      default: return;
    }
    pokeUI();
  }

  /* ------------------------------------------------------------------ */
  /* boot                                                                */
  /* ------------------------------------------------------------------ */
  function normaliseScript(s) {
    let t = 0;
    s.segments.forEach((seg, i) => {
      seg.index = i;
      seg.start = t;
      t += seg.duration;
    });
    return t;
  }

  ENGINE.boot = () => {
    script = TSUKI.SCRIPT;
    segs = script.segments;
    total = normaliseScript(script);
    stage = $('stage');
    canvas = $('film');
    overlay = $('overlay');
    ctx = canvas.getContext('2d', { alpha: false });
    bufA = B.canvas(1, 1); bufB = B.canvas(1, 1); bufM = B.canvas(1, 1);
    ctxA = bufA.getContext('2d'); ctxB = bufB.getContext('2d'); ctxM = bufM.getContext('2d');
    TSUKI.PAPER.build(W, H);
    TSUKI.TEXT.init(overlay, $('subs'), script);
    buildUI();
    try { setSubs(localStorage.getItem('tsuki.subs') !== '0'); } catch (e) { setSubs(true); }
    setMuted(params.has('nosound'));
    let t0 = 0;
    if (params.has('t')) t0 = parseFloat(params.get('t')) || 0;
    if (params.has('seg')) {
      const s = segs.find((x) => x.id === params.get('seg'));
      if (s) t0 = s.start + (parseFloat(params.get('st')) || 0);
    }
    if (!params.has('t') && !params.has('seg') && script.posterT != null) t0 = script.posterT;
    T = U.clamp(t0, 0, total - 1e-3);
    resize();
    if (STILL) document.body.classList.add('still');
    document.body.classList.add('paused');
    requestAnimationFrame(frame);
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    // warm-up: carve every shot's blocks and run every scene's init() now,
    // so nothing stalls mid-film.
    const warm = () => new Promise((res) => {
      setTimeout(() => {
        for (const seg of segs) {
          const sc = scenes[seg.id];
          if (sc && !sc._inited && sc.init) {
            try { sc.init(sceneCtx(seg)); } catch (e) { errors[seg.id] = String(e && e.stack || e); console.error(`[scene ${seg.id} init]`, e); }
          }
          if (sc) sc._inited = true;
        }
        try { if (TSUKI.PRINT) TSUKI.PRINT.buildAll(); } catch (e) { errors.print = String(e && e.stack || e); console.error('[print]', e); }
        res();
      }, 0);
    });
    document.body.classList.add('loading');
    ENGINE.ready = fontsReady.then(warm).then(() => {
      document.body.classList.remove('loading');
      render(T);
      return true;
    });
    // capture / automation hooks
    window.__film = {
      ready: ENGINE.ready,
      get total() { return total; },
      get time() { return T; },
      segments: segs.map((s) => ({ id: s.id, start: s.start, duration: s.duration, title_ja: s.title_ja })),
      seek: (t) => { seek(t); return T; },
      render: (t) => { T = U.clamp(t, 0, total - 1e-3); render(T); return T; },
      play, pause,
      errors: () => ({ ...errors }),
      renderAudio: (t0, t1, sr) => (TSUKI.AUDIO && TSUKI.AUDIO.renderOffline ? TSUKI.AUDIO.renderOffline(t0, t1, sr) : Promise.resolve(null)),
      start: () => { started = true; document.body.classList.add('started'); },
    };
    if (params.has('autoplay')) { started = true; document.body.classList.add('started'); play(); }
  };

  ENGINE.seek = (t) => seek(t);
  ENGINE.time = () => T;
  ENGINE.total = () => total;
  ENGINE.isPlaying = () => playing;
})(window.TSUKI = window.TSUKI || {});
