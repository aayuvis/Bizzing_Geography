/* rewards.js — what a child gets for learning, and the rules that keep it honest
   (family standard §1, §6, §8).

   RANK moves only on learning. A right answer is worth 1 XP while the thing is
   still being learned; a drill on a station already aced pays nothing, and plain
   answers from any one source stop paying after XP_CAP a day. Mastery pays on
   top — a station passed, a level, a capital learned — so the rank says what the
   child can now do, not how many easy drills they repeated.

   MEDALS are computed from evidence (the child's record), never awarded by a
   button; each is celebrated once (k.medals[id] = the day it was first seen).

   COINS are the family wallet's (family.js): the standard amounts, the daily cap,
   fixed prices. The shop sells looks for the child's maps — never content, never
   a chance at anything, and it never touches rank. */

import { WORLDS, stopsIn } from './stops.js';
import { QUIZ } from './geo.js';
import { EXPEDITIONS } from './data/expeditions.js';
import { stats as expStats } from './expeditions.js';
import { dayKey } from './rand.js';
import { ICONS, GLYPH } from './icons.js';

/* ------------------------------------------------------------------ rank */

export const XP_CAP = 15;            // plain right answers, per source, per day
export const XP_BONUS = { stop: 5, level: 20, known: 2, part: 10, made: 5 };
const aced = (k, id, lv) => { const r = (k.stops || {})[id]; return !!(r && r.stars >= 3 && r.lv && r.lv[lv]); };
/* XP for one right answer from `src` (a stop id or a tool id); 0 once it is aced or capped today. */
export function xpFor(k, src, { stop, lv } = {}) {
  if (stop && aced(k, stop, lv)) return 0;
  const d = dayKey(), x = k.xpDay && k.xpDay.d === d ? k.xpDay : (k.xpDay = { d, by: {} });
  const used = x.by[src] || 0; if (used >= XP_CAP) return 0;
  x.by[src] = used + 1; return 1;
}
export function bonus(k, why) { const n = XP_BONUS[why] || 0; k.xp += n; return n; }

/* ------------------------------------------------------------------ medals */

const known = (box) => Object.entries(box || {}).filter(([, b]) => b >= 2).map(([c]) => c);
const contName = { Africa: 'Africa', Asia: 'Asia', Europe: 'Europe', 'North America': 'North America', 'South America': 'South America', Oceania: 'Oceania' };
const capMedal = (cont, glyph) => ({
  id: 'caps-' + cont.toLowerCase().replace(/\s/g, '-'), tier: 3, glyph, name: `Every capital of ${contName[cont]}`,
  how: `Know all ${QUIZ.filter((c) => c.cont === cont).length} capitals of ${cont} — each right on two different days.`,
  test: (k) => { const kn = new Set(known((k.lib.capitals || {}).box)); return QUIZ.filter((c) => c.cont === cont).every((c) => kn.has(c.cc)); },
});
export const MEDALS = [
  { id: 'first-station', tier: 1, glyph: '🚩', name: 'First stop', how: 'Pass your first stop (seven of ten right).', test: (k) => Object.values(k.stops).some((r) => r.stars >= 2) },
  { id: 'ten-aced', tier: 2, glyph: '⭐', name: 'Ten stops aced', how: 'Earn ★★★ — nine of ten — at ten stops.', test: (k) => Object.values(k.stops).filter((r) => r.stars >= 3).length >= 10 },
  ...WORLDS.map((w) => ({ id: 'world-' + w.id, tier: 2, glyph: w.glyph, name: `${w.short}, walked`, how: `Pass every stop in ${w.name}.`, test: (k) => stopsIn(w.id).every((s) => (k.stops[s.id] || {}).stars >= 2) })),
  ...[2, 4, 6, 8, 10].map((n) => ({ id: 'level-' + n, tier: n >= 8 ? 3 : 2, glyph: '🛤️', name: `Level ${n} road`, how: `Pass the Level ${n} check.`, test: (k) => k.road.finished.includes(n) })),
  { id: 'caps-25', tier: 1, glyph: '🏛️', name: '25 capitals', how: 'Know 25 capitals of countries, each right on two different days.', test: (k) => known((k.lib.capitals || {}).box).length >= 25 },
  { id: 'caps-100', tier: 2, glyph: '🏛️', name: '100 capitals', how: 'Know 100 capitals of countries.', test: (k) => known((k.lib.capitals || {}).box).length >= 100 },
  capMedal('Africa', '🦁'), capMedal('Asia', '🐼'), capMedal('Europe', '🏰'), capMedal('North America', '🦅'), capMedal('South America', '🦙'), capMedal('Oceania', '🦘'),
  { id: 'flags-50', tier: 2, glyph: '🚩', name: '50 flags', how: 'Know 50 flags — each right on two different days.', test: (k) => known((k.lib.flags || {}).box).length >= 50 },
  { id: 'states-india', tier: 2, glyph: '🇮🇳', name: 'India’s capitals', how: 'Know the capital of every Indian state and union territory.', test: (k) => { const b = (k.lib.states || {}).box || {}; const ids = Object.keys(b).filter((x) => x.startsWith('IN-')); return ids.length >= 30 && ids.every((x) => b[x] >= 2); } },
  { id: 'close-pin', tier: 2, glyph: '📍', name: 'Spot on', how: 'In Where on Earth?, drop a pin within 100 km of the place.', test: (k) => ((k.lib.geoguess || {}).bestKm ?? 1e9) <= 100 },
  { id: 'big-round', tier: 3, glyph: '🌍', name: 'World reader', how: 'Score 20,000 points in one round of Where on Earth?', test: (k) => ((k.lib.geoguess || {}).best || 0) >= 20000 },
  { id: 'first-made', tier: 1, glyph: '🛠️', name: 'Maker', how: 'Make your first expedition project.', test: (k) => EXPEDITIONS.some((e) => expStats(k, e).made > 0) },
  { id: 'part-learned', tier: 2, glyph: '🧠', name: 'It stuck', how: 'Pass an expedition test on a later day than its lessons — 8 of 10.', test: (k) => EXPEDITIONS.some((e) => expStats(k, e).learned > 0) },
  /* Play: each from what the game recorded — a port woken, an age reached, a chain at its shortest */
  { id: 'tw-five', tier: 1, glyph: '⛵', name: 'Lamplighter', how: 'In Shelly’s Trade Winds, wake five sleeping ports.', test: (k) => ((k.lib.tradewinds || {}).woke || 0) >= 5 },
  { id: 'tw-steam', tier: 1, glyph: '🚢', name: 'Full steam', how: 'In Shelly’s Trade Winds, earn enough goodwill to reach the Age of Steam.', test: (k) => ((k.lib.tradewinds || {}).era || 0) >= 1 },
  { id: 'tw-ocean', tier: 2, glyph: '🌊', name: 'An ocean lit', how: 'In Shelly’s Trade Winds, light every port of one ocean.', test: (k) => Object.keys((k.lib.tradewinds || {}).oceans || {}).length >= 1 },
  { id: 'tw-world', tier: 3, glyph: '🌍', name: 'The world connected', how: 'In Shelly’s Trade Winds, light all sixty ports.', test: (k) => ((k.lib.tradewinds || {}).wins || 0) >= 1 },
  { id: 'chain-ten', tier: 2, glyph: '🔗', name: 'Shortest way', how: 'In Neighbour Chain, find the shortest chain ten times.', test: (k) => ((k.lib.chain || {}).perfect || 0) >= 10 },
  { id: 'compass-two', tier: 2, glyph: '🧭', name: 'Dead reckoning', how: 'In Hot & Cold Compass, find a hidden capital in two guesses or fewer.', test: (k) => ((k.lib.compass || {}).quick || 0) >= 7 },
  { id: 'bigger-fools', tier: 2, glyph: '⚖️', name: 'Not fooled', how: 'In Bigger or Smaller?, see through five maps that make a country look bigger than it is.', test: (k) => ((k.lib.bigger || {}).foolsBeaten || 0) >= 5 },
  { id: 'shape-ten', tier: 2, glyph: '🔍', name: 'Shape detective', how: 'In Shape Detective, name ten countries from their shape alone — no clue.', test: (k) => ((k.lib.shape || {}).noClue || 0) >= 10 },
  { id: 'sun-full', tier: 2, glyph: '☀️', name: 'Sun reader', how: 'In Sun Clock, get every question in a round right.', test: (k) => ((k.lib.sunclock || {}).best || 0) >= 8 },
  ...EXPEDITIONS.map((e) => ({ id: 'exp-' + e.id, tier: 3, glyph: e.glyph, name: `${e.name}, finished`, how: `Finish every day of ${e.name}, the final project included.`, test: (k) => expStats(k, e).complete })),
];
export const TIER = ['', 'bronze', 'silver', 'gold'];
export const earned = (k) => MEDALS.filter((m) => (k.medals || {})[m.id]);
/* New medals since last time: recorded once, so each is celebrated once. */
export function newMedals(k) {
  k.medals = k.medals || {};
  const out = [];
  for (const m of MEDALS) if (!k.medals[m.id]) { let ok = false; try { ok = m.test(k); } catch (_) {} if (ok) { k.medals[m.id] = dayKey(); out.push(m); } }
  return out;
}
/* Each medal is its own painting (public/medals/<id>.webp, tools/art/gen.py MEDAL_ART): one not yet
   earned shows the same painting, faded and greyed — what you are working towards, never a blank "?" */
export const medallion = (m, size = 72, got = true) =>
  `<img class="medal ${TIER[m.tier]}${got ? '' : ' dim'}" src="medals/${m.id}.webp" alt="" width="${size}" height="${size}" loading="lazy" decoding="async">`;

/* ------------------------------------------------------------------ the shop */

/* Looks for the child's maps, at printed prices. Every item says what it is;
   nothing is random, nothing is content, nothing is for real money. */
export const SHOP = [
  { id: 'pin:dot', kind: 'pin', name: 'Round pin', price: 0, blurb: 'The pin every explorer starts with.' },
  { id: 'pin:star', kind: 'pin', name: 'Star pin', price: 20, blurb: 'A gold star where you guess.' },
  { id: 'pin:flag', kind: 'pin', name: 'Flag pin', price: 25, blurb: 'Plant a flag on your guess.' },
  { id: 'pin:gem', kind: 'pin', name: 'Gem pin', price: 35, blurb: 'A cut gem, like a treasure map.' },
  { id: 'pin:compass', kind: 'pin', name: 'Compass-rose pin', price: 45, blurb: 'Four points, for a navigator.' },
  { id: 'frame:plain', kind: 'frame', name: 'Plain frame', price: 0, blurb: 'A clean edge round every map.' },
  { id: 'frame:parchment', kind: 'frame', name: 'Parchment', price: 25, blurb: 'Old-paper edges on every map.' },
  { id: 'frame:rope', kind: 'frame', name: 'Ship’s rope', price: 30, blurb: 'A sailor’s rope round your maps.' },
  { id: 'frame:brass', kind: 'frame', name: 'Brass', price: 40, blurb: 'A polished brass rim, like an old instrument.' },
  { id: 'frame:wood', kind: 'frame', name: 'Chart-table wood', price: 50, blurb: 'Dark wood, like a captain’s chart table.' },
];
export const shopOf = (k) => { k.shop = k.shop || { owned: ['pin:dot', 'frame:plain'], pin: 'dot', frame: 'plain' }; return k.shop; };
export const PIN_PATH = {
  dot: null,
  star: 'M0-9l2.6 5.4 5.9.8-4.3 4.1 1 5.9L0 4.4-5.2 7.2l1-5.9-4.3-4.1 5.9-.8z',
  flag: 'M-4 8V-10M-4-10h11l-3 4 3 4H-4',
  gem: 'M0-9l7 6-7 12-7-12z',
  compass: 'M0-11l2.4 8.6L11 0l-8.6 2.4L0 11l-2.4-8.6L-11 0l8.6-2.4z',
};
