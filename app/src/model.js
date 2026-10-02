/* model.js — the household, the child, and every rule about progress.

   State is a HOUSEHOLD, not a child: { parent, kids[], active } — Finance's
   rule, because a second child must never inherit the first one's stars,
   road or rank. Anything child-shaped lives on the kid.

   The child record holds a first name (never a surname, never a birthday),
   an AGE BAND (never an age), an avatar, and progress. Nothing else. */

import { STOPS, byId } from './stops.js';
import { LEVELS, START, firstLevel } from './levels.js';
import { dayKey } from './rand.js';

export const BANDS = [
  { id: '6-7', label: '6–7', blurb: 'First maps' },
  { id: '8-10', label: '8–10', blurb: 'Capitals and climates' },
  { id: '11-14', label: '11–14', blurb: 'Coordinates and plates' },
];
export const bandRank = (b) => BANDS.findIndex((x) => x.id === b);

/* Ninety-six explorers in twelve packs of eight (src/avatars.js, the family engine's
   shape): two packs to each living world, tiered Common · Rare · Epic · Legendary.
   Commons are free to every child; the rest are bought with Bizzing coins earned by
   learning, once their world is open — and a Legendary first needs its named
   milestone. Nothing is drawn blind. */
import { PACKS, CATALOGUE, AVATAR_IDS, COMMONS } from './avatars.js';
export const AVATAR_PACKS = PACKS.map((p) => ({ id: p.id, name: p.name, blurb: p.blurb, pack: p.pack, avatars: p.faces.map((f) => f[0]) }));
export const AVATARS = AVATAR_IDS;
export const AVATAR_NAME = Object.fromEntries(CATALOGUE.map((a) => [a.id, a.name]));
/* The family faces this picker offered before it had its own: a child who
   chose one keeps it, drawn as itself — never silently swapped. */
export const AVATAR_KEPT = ['beaker', 'atom', 'robo', 'magnet', 'scopey', 'brainiac', 'rocket', 'astro', 'comet', 'saturn', 'luna', 'supernova',
  'panda', 'redpanda', 'pengu', 'froggy', 'capy', 'ottie', 'snowfox', 'koi', 'neko', 'nautilus', 'hexbee', 'tessgecko', 'flakefox', 'peacock', 'sunlion', 'bizzy'];
const AVATAR_FILES = new Set([...AVATARS, ...AVATAR_KEPT]);
export const avatarFile = (id) => (AVATAR_FILES.has(id) ? id : AVATARS[0]);

/* Nine ranks, each a step in how people came to know the world. Every "why"
   is a checked fact, with its source in RANK_SRC. XP comes only from right
   answers — never from time on the app — so a rank says something true. */
export const RANKS = [
  { n: 'Wanderer', xp: 0, why: 'Every explorer starts by wandering — and noticing.' },
  { n: 'Pathfinder', xp: 60, why: 'People found their way long before maps, by the Sun, the stars and the land.' },
  { n: 'Map Reader', xp: 180, why: 'A clay tablet from Babylon, about 2,600 years old, is one of the oldest known maps of the world.' },
  { n: 'Navigator', xp: 400, why: 'Polynesian navigators crossed thousands of kilometres of open Pacific by reading stars, waves and birds.' },
  { n: 'Geographer', xp: 750, why: 'Eratosthenes, about 240 BCE, measured the size of the Earth using shadows in two cities.' },
  { n: 'Cartographer', xp: 1250, why: 'In 1154 al-Idrisi made a great map of the known world for King Roger II of Sicily.' },
  { n: 'Surveyor', xp: 2000, why: 'The Great Trigonometrical Survey of India, begun in 1802, measured the land in triangles.' },
  { n: 'Explorer', xp: 3000, why: 'Explorers still map the deep ocean floor, much of which no one has seen.' },
  { n: 'Globe Master', xp: 4500, why: 'Satellites have photographed the whole Earth from orbit since Landsat, in 1972.' },
];
export const RANK_SRC = ['The British Museum — the Babylonian Map of the World', 'Encyclopaedia Britannica — “Polynesian culture: navigation”',
  'Encyclopaedia Britannica — “Eratosthenes”, “al-Idrīsī”, “Great Trigonometrical Survey”', 'NOAA — “How much of the ocean have we explored?”', 'NASA — Landsat Science'];
export function rankOf(xp) {
  let i = 0; while (i < RANKS.length - 1 && xp >= RANKS[i + 1].xp) i++;
  const r = RANKS[i], next = RANKS[i + 1];
  return { i, ...r, next, pct: next ? Math.round((100 * (xp - r.xp)) / (next.xp - r.xp)) : 100 };
}

/* ---------------------------------------------------------------- kids */

export function newHousehold() { return { v: 6, kids: [], active: null, parent: { pin: null, tester: false, streetview: true, plan: 'free' } }; }

export function newKid(name, band, avatar) {
  return {
    id: 'k' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    name: String(name || '').trim().slice(0, 20) || 'Explorer',
    band: BANDS.some((b) => b.id === band) ? band : '8-10',
    avatar: COMMONS.includes(avatar) ? avatar : COMMONS[0],   // a new explorer starts with a Common, free to all
    xp: 0,
    stops: {},            // stop id → { stars, best, learned, runs, lv: { 1: true, … } levels passed }
    road: { level: START[band] || 3, finished: [], checks: {} },   // the ten roads
    lib: {},              // library tool id → that tool's own record
    days: {},             // dayKey → { q, ok }
    exp: {},              // expedition id → { at, seen, m } (src/expeditions.js ledger)
    created: Date.now(),
    prefs: {},
    shop: { owned: ['pin:dot', 'frame:plain'], pin: 'dot', frame: 'plain' },   // looks bought from the family wallet
    medals: {},           // medal id → the day it was first earned (each celebrated once)
    owned: [],            // avatars bought with Bizzing coins (Commons need no entry)
    worlds: [],           // worlds 3–6 opened with coins (1–2 are open to everyone)
    miss: {},             // the mistakes deck: question key → { q, at, box, from }
  };
}
export const kid = (h) => h.kids.find((k) => k.id === h.active) || null;

/* Today's ring (the family's daily ring, as Bizzing Bee and India have it): one notch
   per finished SESSION — a station quiz, a Library quiz, a Where on Earth? round, an
   expedition day. It counts today only: nothing carries over, nothing is lost. */
export const GOALS = [2, 3, 5];
export const goalOf = (k) => (GOALS.includes((k.prefs || {}).goal) ? k.prefs.goal : 3);
export function session(k) { const d = dayKey(), day = k.days[d] || (k.days[d] = { q: 0, ok: 0 }); day.s = (day.s || 0) + 1; }
export const sessionsToday = (k) => ((k.days || {})[dayKey()] || {}).s || 0;
export function tick(k, right, xp = 1) {
  const d = dayKey();
  const day = k.days[d] || (k.days[d] = { q: 0, ok: 0 });
  day.q++; if (right) { day.ok++; k.xp += xp; }
  const keys = Object.keys(k.days).sort();
  while (keys.length > 90) delete k.days[keys.shift()];
}

export const stopRec = (k, id) => k.stops[id] || (k.stops[id] = { stars: 0, best: 0, learned: false, runs: 0, lv: {} });

/* Stars, three per stop, earned only by answers (E9 — reading the lesson earns nothing):
     ★   a drill at 50% or better: on the way
     ★★  a drill at 70% or better — passes this level of the stop
     ★★★ a drill at 90% or better
   Mastery is re-checked: a stop passed more than REVIEW_DAYS ago is due for REVIEW. A pass
   keeps it; a miss while it is due drops ONE star (never below one) and says so. */
export const PASS = 0.7, ACE = 0.9, CHECK_PASS = 0.8, REVIEW_DAYS = 28;
export const reviewDue = (r, now = Date.now()) => !!(r && r.stars >= 2 && r.at && now - r.at > REVIEW_DAYS * 864e5);
export function scoreRun(k, id, lv, right, total, now = Date.now()) {
  const r = stopRec(k, id), pct = total ? right / total : 0, due = reviewDue(r, now);
  r.runs++; r.best = Math.max(r.best, Math.round(pct * 100));
  let s = pct >= 0.5 ? 1 : 0;
  if (pct >= PASS) { s = Math.max(s, 2); r.lv[lv] = true; }
  if (pct >= ACE) s = 3;
  const before = r.stars, firstPass = pct >= PASS && before < 2;
  let slipped = false;
  if (due && pct < PASS) { r.stars = Math.max(1, r.stars - 1); slipped = true; r.slipped = (r.slipped || 0) + 1; }
  else r.stars = Math.max(r.stars, s);
  if (pct >= PASS) r.at = now;
  return { pct, stars: r.stars, gained: Math.max(0, r.stars - before), passed: pct >= PASS, firstPass, slipped, reviewed: due && pct >= PASS };
}

/* ---------------------------------------------------------------- the road */

export const levelOf = (n) => LEVELS.find((L) => L.n === n);
export const stepDone = (k, s) => !!(k.stops[s.stop] && k.stops[s.stop].lv[s.lv]);

/* The child's own level is walked in order: a step is open once the one
   before it is done. Earlier levels are all open; later ones are closed
   (tester mode opens everything, and changes nothing else). */
export function road(k) {
  const L = levelOf(k.road.level) || LEVELS[0];
  const steps = L.steps.map((s, i) => ({ ...s, n: i + 1, done: stepDone(k, s) }));
  let open = true;
  for (const s of steps) { s.open = open || s.done; if (!s.done) open = false; }
  const next = steps.find((s) => !s.done) || null;
  return { L, steps, next, done: steps.filter((s) => s.done).length, all: steps.every((s) => s.done) };
}
/* The lv a stop is practised at for this child: the highest lv it has on any
   road up to the child's own level. */
export function lvFor(k, id) {
  let lv = 0;
  for (const L of LEVELS) { if (L.n > k.road.level) break; for (const s of L.steps) if (s.stop === id) lv = Math.max(lv, s.lv); }
  return lv || 1;
}
export function stopOpen(h, k, id) {
  if (h.parent.tester) return true;
  const f = firstLevel(id); if (!f) return false;
  if (f < k.road.level) return true;
  if (f > k.road.level) return false;
  const st = road(k).steps.find((s) => s.stop === id);
  return !!(st && st.open);
}
/* The level check: twelve questions from this level's steps. Passing it
   finishes the level — whether the child walked every step or is ready to
   skip ahead. */
export function passLevel(k) {
  const n = k.road.level;
  if (!k.road.finished.includes(n)) k.road.finished.push(n);
  if (n < LEVELS.length) k.road.level = n + 1;
  return k.road.level;
}

export function starsTotal(k) { return STOPS.reduce((s, t) => s + ((k.stops[t.id] || {}).stars || 0), 0); }
export const maxStars = () => STOPS.length * 3;
export { byId };
