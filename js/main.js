/* main.js — boot the film once every script has loaded. */
(function (TSUKI) {
  'use strict';
  const S = TSUKI.SCRIPT;
  document.title = S.title.ja;
  const ct = document.getElementById('curtain-title');
  (S.curtain && S.curtain.columns ? S.curtain.columns : [S.title.ja]).forEach((c, i) => {
    const d = document.createElement('div');
    d.className = 'v' + (i > 0 ? ' small' : '');
    d.textContent = c;
    ct.appendChild(d);
  });
  document.getElementById('curtain-zh').textContent = S.title.zh || '';
  TSUKI.ENGINE.boot();
})(window.TSUKI);
