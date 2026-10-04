/* stops.js — the Atlas: ten worlds, each a chapter file (chapters/*.js), and
   the one runner-facing API every question goes through. */
import * as home from './chapters/home.js';
import * as landwater from './chapters/landwater.js';
import * as continents from './chapters/continents.js';
import * as compass from './chapters/compass.js';
import * as capitals from './chapters/capitals.js';
import * as weather from './chapters/weather.js';
import * as rivers from './chapters/rivers.js';
import * as globe from './chapters/globe.js';
import * as restless from './chapters/restless.js';
import * as people from './chapters/people.js';
import { rnd, shuffle } from './rand.js';
import { fold, typeQ, mapQ, TWO_CONTINENTS } from './chapters/kit.js';
import { QUIZ } from './geo.js';
import { hasShape } from './map.js';

const CHAPTERS = [home, landwater, continents, compass, capitals, weather, rivers, globe, restless, people];
export const WORLDS = CHAPTERS.map((c) => c.WORLD);
export const STOPS = CHAPTERS.flatMap((c) => c.STOPS.map((s) => ({ ...s, world: c.WORLD.id })));
export const byId = Object.fromEntries(STOPS.map((s) => [s.id, s]));
export const worldOf = (id) => WORLDS.find((w) => w.id === id);
export const stopsIn = (wid) => STOPS.filter((s) => s.world === wid);

/* A round never asks the same thing twice — not even dressed differently.
   A question's identity is its words and its answer: a new picture or a new set of wrong
   options does not make it a new question. And a fact asked the other way round is the same
   fact: "the highest mountain in Asia?" then "which continent is Everest on?" — each one's
   answer sits in the other's words — so only one of them goes in a round. */
const qfold = (s) => String(s || '').replace(/<[^>]+>/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const qKey = (q) => qfold(q.text) + '|' + qfold(q.ans || (q.ok || []).join());
function factOf(q) {
  const t = ' ' + qfold(q.text) + ' ', a = qfold(q.ans || '');
  /* an answer that is a word in every question of its kind ("true", "north") cannot mirror; nor can a
     question that names all its own options ("…weather or climate?") */
  const open = q.kind === 'mc' && a.length > 2 && !['true', 'false'].includes(a) && !q.opts.every((o) => t.includes(' ' + qfold(o) + ' '));
  return { t, a, open };
}
const mirrors = (x, y) => x.open && y.open && y.t.includes(' ' + x.a + ' ') && x.t.includes(' ' + y.a + ' ');
export const fits = (seen, q) => !seen.keys.has(qKey(q)) && !seen.facts.some((f) => mirrors(f, factOf(q)));
export const newSeen = () => { const seen = { keys: new Set(), facts: [] }; seen.fits = (q) => fits(seen, q); return seen; };
export function remember(seen, q) { seen.keys.add(qKey(q)); seen.facts.push(factOf(q)); }

/* n different questions from one stop at one level. A generator is told what the round has
   already asked (`seen`), so a hand-written bank picks an item it has not used; a generator
   that draws from data is simply asked again. A round never pads itself with a repeat:
   test/stops.mjs proves every stop gives ten different questions at every level. Pass one
   `seen` to several drills (an expedition's quiz) and none of them repeats another. */
export function drill(stop, lv, n = 10, r = rnd, seen = newSeen()) {
  const out = [];
  for (let t = 0; out.length < n && t < n * 80; t++) {
    const q = stop.gen(r, lv, seen);
    if (!q || !fits(seen, q)) continue;
    remember(seen, q); out.push({ ...q, stop: stop.id, lv });
  }
  return out;
}

/* A mixed set (E4/G2: Library quizzes, the 5-minute trip and level checks were all choosing): about a
   third of a set's choosing questions are asked another way, where the question allows it fairly —
     a country for an answer  →  tap it on the world map (big enough to tap, on one continent)
     a name for an answer     →  type it (a proper name, or "which word…": one word)
   Never a question that needs its options ("which of these…"), never true/false. The answer stays the
   same answer; test/stops.mjs proves each converted question is right for it and only for it. */
const BY_NAME = Object.fromEntries(QUIZ.map((c) => [c.name, c]));
const NEEDS_OPTS = /\b(these|the following|of them|which one)\b/i;
export function varyKind(q) {
  if (q.kind !== 'mc' || ['True', 'False'].includes(q.ans) || NEEDS_OPTS.test(q.text)) return null;
  /* "…in the Northern or the Southern hemisphere?" names its options: typed, it would give itself away */
  const low = q.text.toLowerCase(); if (q.opts.some((o) => o.length > 2 && low.includes(o.toLowerCase()))) return null;
  const c = BY_NAME[q.ans];
  if (c && c.area >= 30000 && !TWO_CONTINENTS.has(c.cc) && hasShape(c.cc)) return 'map';
  const proper = /^[A-Z][\p{L}’'.-]*( [A-Z][\p{L}’'.-]*| (of|de|da|do|du|la|el|al|and|the) [A-Z][\p{L}’'.-]*){0,3}$/u.test(q.ans);
  if (q.ans.length <= 28 && !/\d/.test(q.ans) && (proper || (/^Which word/.test(q.text) && /^[\p{Ll}-]+$/u.test(q.ans)))) return 'type';
  return null;
}
export function varyOne(q, how) {
  if (how === 'map') { const c = BY_NAME[q.ans]; return { ...mapQ(`${q.text.replace(/\s*$/, '')} Tap it on the map.`, [c.cc], null, q.why || '', c.cc), html: q.html || '', targetName: c.name, varied: 'map', from: q.from, stop: q.stop, lv: q.lv }; }
  return { ...typeQ(`${q.text.replace(/\s*$/, '')} Type it.`, q.ans, [], q.why || '', q.html || ''), varied: 'type', from: q.from, stop: q.stop, lv: q.lv };
}
export function vary(items, r = rnd, share = 0.34, allow = ['map', 'type']) {
  const can = items.map((q, i) => [i, varyKind(q)]).filter(([, k]) => k && allow.includes(k));
  const n = Math.min(can.length, Math.max(can.length >= 2 ? 2 : can.length, Math.round(items.length * share)));
  const pickIdx = new Map(shuffle(can, r).slice(0, n));
  return items.map((q, i) => (pickIdx.has(i) ? { ...q, ...varyOne(q, pickIdx.get(i)) } : q));
}

/* Is this answer right? An option string for 'mc'; a place id for 'map'. */
export function correct(q, a) {
  if (q.kind === 'map') return q.ok.includes(a);
  if (q.kind === 'type') { const f = fold(a); return !!f && (q.accept || [q.ans]).some((x) => fold(x) === f); }
  return String(a) === q.ans;
}
