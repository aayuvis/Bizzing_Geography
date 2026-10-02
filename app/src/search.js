/* search.js — ONE box that finds anything (C4, family standard §3): every stop, every
   Atlas place, every country and its capital, every landmark, every dictionary word,
   every expedition and Library tool. The index is built from the same data the app
   teaches from, so a search can never find something the app does not have. */

import { esc } from './ui.js';
import { gi, ico } from './icons.js';
import { STOPS, WORLDS, worldOf } from './stops.js';
import { QUIZ } from './geo.js';
import { LANDMARKS } from './data/landmarks.js';
import { WORDS } from './library/dictionary.js';
import { EXPEDITIONS } from './data/expeditions.js';
import { SHELF } from './library/index.js';
import { says, shelly } from './mascot.js';

const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
let INDEX = null;
export function index() {
  if (INDEX) return INDEX;
  INDEX = [
    ...STOPS.map((s) => ({ kind: 'Stop', t: s.title, sub: `${worldOf(s.world).name} · ${s.hook}`, glyph: s.glyph, act: 'openStop', arg: s.id, w: s.title + ' ' + s.hook })),
    ...WORLDS.map((w) => ({ kind: 'Atlas place', t: w.name, sub: w.blurb, glyph: w.glyph, act: 'openWorld', arg: w.id, w: w.name + ' ' + w.short })),
    ...QUIZ.map((c) => ({ kind: 'Country', t: c.name, sub: `Capital: ${c.cap.join(', ')} · ${c.cont}`, glyph: '🌍', act: 'openCountry', arg: c.cc, w: c.name + ' ' + c.cap.join(' ') })),
    ...LANDMARKS.map((l) => ({ kind: 'Landmark', t: l.name, sub: l.where, glyph: '🏛️', act: 'openLandmark', arg: l.id, w: l.name + ' ' + l.where })),
    ...WORDS.map(([w, d]) => ({ kind: 'Word', t: w, sub: d, glyph: '📖', act: 'openWord', arg: w, w })),
    ...EXPEDITIONS.map((e) => ({ kind: 'Expedition', t: e.name, sub: e.blurb || '', glyph: e.glyph, act: 'expOpen', arg: e.id, w: e.name + ' ' + (e.blurb || '') })),
    ...SHELF.map((t) => ({ kind: 'Library', t: t.name, sub: t.blurb, glyph: t.glyph, act: 'openTool', arg: t.id, w: t.name + ' ' + t.blurb })),
  ].map((x) => ({ ...x, f: fold(x.t), fw: fold(x.w) }));
  return INDEX;
}
/* best first: the name starts with it, then a word in the name does, then anywhere */
export function search(q, n = 40) {
  const f = fold(q).trim(); if (f.length < 2) return [];
  const score = (x) => (x.f === f ? 0 : x.f.startsWith(f) ? 1 : new RegExp('\\b' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(x.f) ? 2 : x.f.includes(f) ? 3 : x.fw.includes(f) ? 4 : 9);
  return index().map((x) => [score(x), x]).filter(([s]) => s < 9).sort((a, b) => a[0] - b[0] || a[1].t.length - b[1].t.length).slice(0, n).map(([, x]) => x);
}
export function viewSearch(q) {
  const res = search(q || '');
  return `<section class="narrow search-page">
    <header class="phead"><span></span><div class="phead-t"><h1>Search</h1></div><div class="phead-r"></div></header>
    <div class="search-box">${ico('search')}<input id="search-q" class="inp big" data-search value="${esc(q || '')}" placeholder="A country, a capital, a stop, a word…" aria-label="Search places, stops and words" autocomplete="off" autofocus></div>
    ${!q || q.trim().length < 2 ? says('think', 'Type a country, a capital, a landmark, a word like <b>delta</b> — or the name of a stop.') :
      res.length ? `<p class="muted small" aria-live="polite">${res.length === 40 ? 'The first 40 matches' : `${res.length} ${res.length === 1 ? 'match' : 'matches'}`}</p>
      <ul class="search-res">${res.map((x) => `<li><button class="card sr" data-act="${x.act}" data-arg="${esc(x.arg)}"><span class="sr-g">${gi(x.glyph)}</span><span class="sr-t"><span class="kicker">${x.kind}</span><b>${esc(x.t)}</b><span class="muted small">${esc(x.sub)}</span></span></button></li>`).join('')}</ul>`
      : `<div class="card empty-state">${shelly('sleep', 110)}<p>Nothing called “${esc(q)}” here yet. Try a shorter word, or a country’s name.</p></div>`}
  </section>`;
}
