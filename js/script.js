/* script.js — temporary test script (replaced from design/screenplay.json). */
(function (TSUKI) {
  'use strict';
  TSUKI.SCRIPT = {
    title: { ja: '月の名残', zh: '月之余韵', en: 'Remnants of the Moon' },
    curtain: { columns: ['月の名残', '中秋 浮世絵短編'] },
    segments: [
      { id: 'test-a', title_ja: '序', title_zh: '序', duration: 8,
        text: [ { t: 0.5, dur: 7, kind: 'haiku', ja: ['名月や', '池をめぐりて', '夜もすがら'], author: '芭蕉', seal: '芭', zh: '明月当空——绕池徘徊，竟至终宵', position: 'right' },
                { t: 0.5, dur: 6, kind: 'cartouche', ja: ['第一段　竹取', '月百姿'], position: 'upper-left' } ] },
      { id: 'test-b', title_ja: '破', title_zh: '破', duration: 8, transition: { type: 'ink', dur: 3, center: [1400, 360] },
        text: [ { t: 1, dur: 6.5, kind: 'title', ja: ['月の名残'], author: '十五夜', seal: '月', zh: '月 之 余 韵', en: 'Remnants of the Moon', position: 'center' } ] },
      { id: 'test-c', title_ja: '急', title_zh: '急', duration: 8, transition: { type: 'kasumi', dur: 3 } },
      { id: 'test-d', title_ja: '結', title_zh: '结', duration: 6, transition: { type: 'iris', dur: 2.5, center: [960, 400] } },
    ],
  };
})(window.TSUKI = window.TSUKI || {});
