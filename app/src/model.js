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

/* The avatars are the family's: Bizzing Bee's painted set, as Maths and
   Schedule use it — one collection across the house. All free, all at once:
   no unlocking, no drops, no price. */
export const AVATAR_PACKS = [
  { id: 'lab', name: 'Lab Friends', blurb: 'Borrowed from Bizzing Bee’s lab.', avatars: ['beaker', 'atom', 'robo', 'magnet', 'scopey', 'brainiac'] },
  { id: 'stars', name: 'Star Crew', blurb: 'Borrowed from Bizzing Bee’s cosmos.', avatars: ['rocket', 'astro', 'comet', 'saturn', 'luna', 'supernova'] },
  { id: 'animals', name: 'Wild Friends', blurb: 'Creatures from every continent.', avatars: ['panda', 'redpanda', 'pengu', 'froggy', 'capy', 'ottie', 'snowfox', 'koi', 'neko'] },
  { id: 'patterns', name: 'Pattern Pets', blurb: 'Spirals and symmetry from nature.', avatars: ['nautilus', 'hexbee', 'tessgecko', 'flakefox', 'peacock', 'sunlion'] },
];
export const AVATARS = AVATAR_PACKS.flatMap((p) => p.avatars);
export const AVATAR_NAME = {
  beaker: 'Bubbly Beaker', atom: 'Atom', robo: 'Robo Helper', magnet: 'Magneto Max', scopey: 'Scopey', brainiac: 'Brainiac',
  rocket: 'Rocket Rae', astro: 'Astro', comet: 'Comet', saturn: 'Saturn', luna: 'Luna', supernova: 'Supernova',
  panda: 'Panda', redpanda: 'Red Panda', pengu: 'Penguin', froggy: 'Froggy', capy: 'Capybara', ottie: 'Otter', snowfox: 'Snow Fox', koi: 'Koi', neko: 'Neko',
  nautilus: 'Spiral Snail', hexbee: 'Honeycomb Bee', tessgecko: 'Tiling Gecko', flakefox: 'Snowflake Fox', peacock: 'Spiral Peacock', sunlion: 'Sunflower Lion',
};
export const avatarFile = (id) => (AVATARS.includes(id) || id === 'bizzy' ? id : AVATARS[0]);

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

export function newHousehold() { return { v: 1, kids: [], active: null, parent: { pin: null, tester: false } }; }

export function newKid(name, band, avatar) {
  return {
    id: 'k' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    name: String(name || '').trim().slice(0, 20) || 'Explorer',
    band: BANDS.some((b) => b.id === band) ? band : '8-10',
    avatar: AVATARS.includes(avatar) ? avatar : AVATARS[0],
    xp: 0,
    stops: {},            // stop id → { stars, best, learned, runs, lv: { 1: true, … } levels passed }
    road: { level: START[band] || 3, finished: [], checks: {} },   // the ten roads
    lib: {},              // library tool id → that tool's own record
    days: {},             // dayKey → { q, ok }
    created: Date.now(),
    prefs: {},
  };
}
export const kid = (h) => h.kids.find((k) => k.id === h.active) || null;

export function tick(k, right, xp = 1) {
  const d = dayKey();
  const day = k.days[d] || (k.days[d] = { q: 0, ok: 0 });
  day.q++; if (right) { day.ok++; k.xp += xp; }
  const keys = Object.keys(k.days).sort();
  while (keys.length > 90) delete k.days[keys.shift()];
}

export const stopRec = (k, id) => k.stops[id] || (k.stops[id] = { stars: 0, best: 0, learned: false, runs: 0, lv: {} });

/* Stars, three per stop, and each one says what it is for:
     ★   read the lesson
     ★★  a drill at 70% or better — passes this level of the stop
     ★★★ a drill at 90% or better */
export const PASS = 0.7, ACE = 0.9, CHECK_PASS = 0.8;
export function scoreRun(k, id, lv, right, total) {
  const r = stopRec(k, id), pct = total ? right / total : 0;
  r.runs++; r.best = Math.max(r.best, Math.round(pct * 100));
  let s = r.learned ? 1 : 0;
  if (pct >= PASS) { s = Math.max(s, 2); r.lv[lv] = true; }
  if (pct >= ACE) s = 3;
  const before = r.stars; r.stars = Math.max(r.stars, s);
  return { pct, stars: r.stars, gained: r.stars - before, passed: pct >= PASS };
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
