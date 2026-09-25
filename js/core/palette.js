/* ==========================================================================
   palette.js — 日本の伝統色. The film is painted only from these inks
   (plus alpha variants via TSUKI.U.rgba). Keys are romaji; `name` is kanji.
   ========================================================================== */
(function (TSUKI) {
  'use strict';

  const INKS = {
    // paper & light
    gofun:      { hex: '#F3EDE0', name: '胡粉' },   // oyster-shell white
    kinari:     { hex: '#EDE3CC', name: '生成' },   // unbleached washi
    torinoko:   { hex: '#E4D5B4', name: '鳥の子' }, // aged paper
    geppaku:    { hex: '#EEF2EA', name: '月白' },   // moon-white
    tsukiKi:    { hex: '#F2E3AE', name: '月色' },   // warm moonlight
    // sumi & greys
    sumi:       { hex: '#1C1A18', name: '墨' },
    keshizumi:  { hex: '#3A3634', name: '消炭' },
    nezumi:     { hex: '#7D7B76', name: '鼠' },
    rikyu:      { hex: '#6E7462', name: '利休鼠' },
    ginnezu:    { hex: '#A9A9A2', name: '銀鼠' },
    // blues (ai / bero)
    tetsukon:   { hex: '#141A33', name: '鉄紺' },   // deepest night
    koiai:      { hex: '#15233F', name: '濃藍' },
    kon:        { hex: '#1F2F57', name: '紺' },
    bero:       { hex: '#1D4E89', name: 'ベロ藍' }, // Prussian blue, Hokusai
    ai:         { hex: '#2E5C7D', name: '藍' },
    gunjo:      { hex: '#4C6CB3', name: '群青' },
    hanada:     { hex: '#5B8AA6', name: '縹' },
    asagi:      { hex: '#7FB2B8', name: '浅葱' },
    kamenozoki: { hex: '#C6DCD8', name: '瓶覗' },   // palest blue
    // reds
    beni:       { hex: '#C0283A', name: '紅' },
    akane:      { hex: '#A8323A', name: '茜' },
    shu:        { hex: '#D9512C', name: '朱' },     // vermilion (seals, torii)
    enji:       { hex: '#8E2C3A', name: '臙脂' },
    toki:       { hex: '#EAA79A', name: '鴇色' },
    // yellows & earth
    yamabuki:   { hex: '#E8A93A', name: '山吹' },
    kin:        { hex: '#C9A45C', name: '金茶' },   // gold / mica-gold
    odo:        { hex: '#B58A4C', name: '黄土' },
    kitsune:    { hex: '#A8683A', name: '狐色' },
    kuchiba:    { hex: '#C7A56A', name: '朽葉' },   // dry leaves / susuki plume
    susuki:     { hex: '#D6C49A', name: '尾花' },
    // greens
    wakatake:   { hex: '#6A9E78', name: '若竹' },
    aotake:     { hex: '#3F7F5E', name: '青竹' },
    matsuba:    { hex: '#3E5A3A', name: '松葉' },
    koke:       { hex: '#6B7A3A', name: '苔' },
    rokusho:    { hex: '#4F8A7B', name: '緑青' },
    // purples & autumn flowers
    kikyo:      { hex: '#5A56A0', name: '桔梗' },
    hagi:       { hex: '#B35C8C', name: '萩' },
    fuji:       { hex: '#8F86B8', name: '藤' },
    murasaki:   { hex: '#5B3A6E', name: '紫' },
  };

  const C = (TSUKI.C = {});
  const NAMES = (TSUKI.C_NAMES = {});
  for (const k of Object.keys(INKS)) {
    C[k] = INKS[k].hex;
    NAMES[k] = INKS[k].name;
  }
  TSUKI.INKS = INKS;
})(window.TSUKI = window.TSUKI || {});
