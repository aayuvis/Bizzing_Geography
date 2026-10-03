/* search.js — ONE box that finds anything (C4, family standard §3): every stop, every
   Atlas place, every country and its capital, every landmark, every dictionary word,
   every expedition and Library tool. The index is built from the same data the app
   teaches from, so a search can never find something the app does not have. */

import { esc } from './ui.js';
import { gi, ico } from './icons.js';
import { STOPS, WORLDS, worldOf } from './stops.js';
import { QUIZ, STATES, INDIA, byCc } from './geo.js';
import { LANDMARKS } from './data/landmarks.js';
import { POSTCARDS } from './data/postcards.js';
import { WORDS } from './library/dictionary.js';
import { EXPEDITIONS } from './data/expeditions.js';
import { SHELF } from './library/index.js';
import { says, shelly } from './mascot.js';

/* accents, case and punctuation never decide a search: "Washington, D.C." = "washington dc" */
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const tight = (s) => s.replace(/ /g, '');
/* the states of every country State Capitals teaches — found by the state's name or by its capital */
const STATE_C = { US: 'United States', IN: 'India', CA: 'Canada', AU: 'Australia', BR: 'Brazil', MX: 'Mexico', DE: 'Germany', NG: 'Nigeria' };
const STATE_ROWS = () => [
  ...STATES.filter((x) => STATE_C[x.c]).map((x) => ({ c: x.c, id: x.id, name: x.name, cap: x.cap })),
  ...INDIA.states.map((x) => ({ c: 'IN', id: x.id, name: x.name, cap: x.cap })),
];
/* cities (Natural Earth's populated places, 2,600 of them) load with the first search, so the
   first screen never carries them; a city that is already found as a capital is not listed twice */
let PLACES = null, LOADING = null, AGES = null;
/* resolves when the cities are in the index (the search page re-renders on the event) */
/* Earth Through Time's ages load with them too (70 KB of history): the Earth's own story, our maps,
   and each continent's ages — never a hard moment's own age, which the tool shows only to 11–14 */
export const placesReady = () => LOADING || (LOADING = Promise.all([import('./data/places.js'), import('./data/eras.js'), import('./data/history.js')]).then(([m, er, hi]) => {
  AGES = [...er.EARTH.map((e) => [e, 'Earth through time']), ...er.MAPS.map((e) => [e, 'Our maps through time']), ...Object.entries(hi.CONTINENT_HISTORY).flatMap(([c, L]) => L.filter((e) => !e.hard).map((e) => [e, c + ' through time']))];
  PLACES = m.PLACES; INDEX = null; if (typeof window !== 'undefined' && window.dispatchEvent) window.dispatchEvent(new Event('bzg-search-ready')); }));
function places() { if (!PLACES) placesReady(); return PLACES; }
let INDEX = null;
export function index() {
  if (INDEX) return INDEX;
  const key = (n) => fold(n).replace(/\s*\(.*?\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const national = QUIZ.flatMap((c) => c.cap.map((n) => c.cc + '|' + key(n)));
  /* a "state" whose capital is the nation's own (Washington, D.C.) is found as the country's capital already */
  const states = STATE_ROWS(), stateCaps = states.filter((x) => !national.some((k) => k.startsWith(x.c + '|' + key(x.cap))));
  const capsOf = new Set([...national, ...states.map((x) => x.c + '|' + key(x.cap))]);
  INDEX = [
    ...STOPS.map((s) => ({ kind: 'Stop', t: s.title, sub: `${worldOf(s.world).name} · ${s.hook}`, glyph: s.glyph, act: 'openStop', arg: s.id, w: s.title + ' ' + s.hook })),
    ...WORLDS.map((w) => ({ kind: 'Atlas place', t: w.name, sub: w.blurb, glyph: w.glyph, act: 'openWorld', arg: w.id, w: w.name + ' ' + w.short })),
    ...QUIZ.map((c) => ({ kind: 'Country', t: c.name, sub: `Capital: ${c.cap.join(', ')} · ${c.cont}`, glyph: '🌍', act: 'openCountry', arg: c.cc, w: c.name + ' ' + c.cap.join(' ') })),
    ...states.map((x) => ({ kind: x.c === 'US' ? 'US state' : 'State', t: x.name, sub: `Capital: ${x.cap} · ${STATE_C[x.c]}`, glyph: '🗺️', act: 'openState', arg: x.c + '|' + x.id, w: x.name + ' ' + x.cap })),
    ...stateCaps.map((x) => ({ kind: 'State capital', t: x.cap.replace(/\s*\(.*?\)/g, ''), sub: `Capital of ${x.name}, ${STATE_C[x.c]}`, glyph: '🏛️', act: 'openState', arg: x.c + '|' + x.id, w: x.cap })),
    ...(places() || []).filter((p) => byCc[p.cc] && !capsOf.has(p.cc + '|' + key(p.n))).map((p) => ({ kind: 'City', t: p.n.replace(/,\s+/g, ', '), sub: byCc[p.cc].name, glyph: '🏙️', act: 'openCity', arg: p.id, w: p.n + ' ' + byCc[p.cc].name, big: p.big })),
    ...POSTCARDS.map((p) => ({ kind: 'Painted place', t: p.place, sub: `Where on Earth? · ${p.clues[0]}`, glyph: '🌍', act: 'openPlace', arg: p.id, w: p.place + ' ' + p.clues.join(' ') })),
    ...(AGES || []).map(([e, track]) => ({ kind: 'Earth Through Time', t: e.title, sub: `${track} · ${e.when}`, glyph: '⏳', act: 'openEra', arg: e.id, w: e.title + ' ' + (e.hook || e.body || '') })),
    ...LANDMARKS.map((l) => ({ kind: 'Landmark', t: l.name, sub: l.where, glyph: '🏛️', act: 'openLandmark', arg: l.id, w: l.name + ' ' + l.where })),
    ...WORDS.map(([w, d]) => ({ kind: 'Word', t: w, sub: d, glyph: '📖', act: 'openWord', arg: w, w })),
    ...EXPEDITIONS.map((e) => ({ kind: 'Expedition', t: e.name, sub: e.blurb || '', glyph: e.glyph, act: 'expOpen', arg: e.id, w: e.name + ' ' + (e.blurb || '') })),
    ...SHELF.map((t) => ({ kind: 'Library', t: t.name, sub: t.blurb, glyph: t.glyph, act: 'openTool', arg: t.id, w: t.name + ' ' + t.blurb })),
  ].map((x) => ({ ...x, f: fold(x.t), fw: fold(x.w), ft: tight(fold(x.w)) }));
  return INDEX;
}
/* best first: the name starts with it, then a word in the name does, then anywhere */
export const placeOf = (id) => (PLACES || []).find((p) => p.id === id);
export function search(q, n = 40) {
  const f = fold(q); if (f.length < 2) return [];
  const ft = tight(f);
  const score = (x) => (x.f === f ? 0 : x.f.startsWith(f) ? 1 : new RegExp('\\b' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(x.f) ? 2 : x.f.includes(f) ? 3 : x.fw.includes(f) ? 4 : ft.length >= 3 && x.ft.includes(ft) ? 5 : 9);
  return index().map((x) => [score(x), x]).filter(([s]) => s < 9).sort((a, b) => a[0] - b[0] || (b[1].big || 0) - (a[1].big || 0) || a[1].t.length - b[1].t.length).slice(0, n).map(([, x]) => x);
}
export function viewSearch(q) {
  const res = search(q || '');
  return `<section class="narrow search-page">
    <header class="phead"><span></span><div class="phead-t"><h1>Search</h1></div><div class="phead-r"></div></header>
    <div class="search-box">${ico('search')}<input id="search-q" class="inp big" data-search value="${esc(q || '')}" placeholder="A country, a capital, a stop, a word…" aria-label="Search places, stops and words" autocomplete="off" autofocus></div>
    ${!q || q.trim().length < 2 ? says('think', 'Type a country, a state, a city, a landmark, a word like <b>delta</b> — or the name of a stop.') :
      res.length ? `<p class="muted small" aria-live="polite">${res.length === 40 ? 'The first 40 matches' : `${res.length} ${res.length === 1 ? 'match' : 'matches'}`}</p>
      <ul class="search-res">${res.map((x) => `<li><button class="card sr" data-act="${x.act}" data-arg="${esc(x.arg)}"><span class="sr-g">${gi(x.glyph)}</span><span class="sr-t"><span class="kicker">${x.kind}</span><b>${esc(x.t)}</b><span class="muted small">${esc(x.sub)}</span></span></button></li>`).join('')}</ul>`
      : `<div class="card empty-state">${shelly('sleep', 110)}<p>Nothing called “${esc(q)}” here yet. Try a shorter word, or a country’s name.</p></div>`}
  </section>`;
}
