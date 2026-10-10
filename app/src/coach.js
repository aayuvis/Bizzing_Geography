/* coach.js — Shelly's Coach and the daily goal (Bizzing Bee's, the owner: "the metrics are relevant
   and there is an inbuilt coach"). Hardcoded, offline, no model anywhere — Bee's own discipline.

   THE DAILY GOAL is Bee's three rings, measured per day and kept with the day's record (k.days):
     App time       seconds the app was on screen and looked at (a tab left open in the background
                    counts nothing — the clock ticks only while the page is visible)
     Practice time  seconds spent ANSWERING: a stop, a check, a trip, an expedition test, the mistakes
                    deck or a Library quiz. Games, the feed and browsing the map do not move it.
     Right answers  every right answer today, from anywhere (k.days[d].ok — the same count rank uses)
   Targets are the child's own (k.prefs.tgt), set on the Coach page. Going past one draws a second lap.
   Today only: nothing carries over, nothing counts days in a row — the family's "no streaks" rule.

   THE COACH reads the mistakes deck: every question still catching the child, grouped into eleven
   TRAPS — one per kind of geography thinking — and for the biggest one says what goes wrong, the
   trick that fixes it, a check to run before tapping, and the child's OWN missed questions with the
   right answer and its reason (from the generator, never typed here). The tricks are about METHOD and
   never state a fact about a real place (CLAUDE.md rule 3); test/coach.mjs holds every trap to its
   stops and fails on a stop no trap claims. */

import { STOPS, byId } from './stops.js';
import { LEVELS } from './levels.js';
import { dayKey } from './rand.js';

/* ------------------------------------------------------------------ the daily goal */
export const TGT_DEF = { app: 20, prac: 10, right: 20 };
export const TGT_CHOICES = { app: [10, 15, 20, 30, 45, 60], prac: [5, 10, 15, 20, 30], right: [10, 20, 30, 50] };
export const RING_COL = [['#E8458C', '#FF8FC0'], ['#2FA35C', '#6FD48F'], ['#3D7DF0', '#8FB6FF']];
export const TICK = 15;   // seconds per tick (Bee's METRIC_TICK)
export function targets(k) {
  const t = (k.prefs && k.prefs.tgt) || {}, pick = (f) => (TGT_CHOICES[f].includes(t[f]) ? t[f] : TGT_DEF[f]);
  return { app: pick('app'), prac: pick('prac'), right: pick('right') };
}
export function today(k, d = dayKey()) {
  const day = (k.days && k.days[d]) || {}, t = targets(k);
  const app = day.app || 0, prac = day.prac || 0, right = day.ok || 0;
  return { app, prac, right, t, pApp: app / (t.app * 60), pPrac: prac / (t.prac * 60), pRight: right / t.right };
}
/* one tick of the clock: always app time, practice time only while answering */
export function metricTick(k, practising, d = dayKey()) {
  const day = k.days[d] || (k.days[d] = { q: 0, ok: 0 });
  day.app = (day.app || 0) + TICK;
  if (practising) day.prac = (day.prac || 0) + TICK;
}
export const fmtMins = (sec) => { const m = Math.floor(Math.max(0, sec || 0) / 60); return m < 60 ? m + 'm' : Math.floor(m / 60) + 'h ' + (m % 60) + 'm'; };
/* three nested rings, Apple-Watch style (Bee's ringsSVG): past the target, a second lap in a lighter shade */
export function ringsSVG(size, vals) {
  const R = [52, 39, 26], W = 13;
  let out = `<svg class="cz-rings" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true">`;
  vals.forEach((v, i) => {
    const r = R[i], C = 2 * Math.PI * r, p = Math.max(0, v || 0), base = Math.min(1, p), over = Math.max(0, Math.min(1, p - 1)), [col, lite] = RING_COL[i];
    out += `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${col}" stroke-opacity=".18" stroke-width="${W}"/>`;
    if (base > 0) out += `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${col}" stroke-width="${W}" stroke-linecap="round" stroke-dasharray="${(C * base).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 60 60)"/>`;
    if (over > 0) out += `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${lite}" stroke-width="${W - 4}" stroke-linecap="round" stroke-dasharray="${(C * over).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 60 60)"/>`;
  });
  return out + '</svg>';
}
export const allClosed = (m) => m.pApp >= 1 && m.pPrac >= 1 && m.pRight >= 1;

/* ------------------------------------------------------------------ the traps */
/* `stops` are the Atlas stops whose misses land here; `from` the Library tools' and runs' names */
export const TRAPS = {
  compass: { label: 'Which way?', col: '#C4763C', pose: 'point', stops: ['four-points', 'eight-points', 'world-way'], from: [],
    mistake: 'You mix up east and west, or you answer from the wrong end — the direction you are going FROM instead of TO.',
    rule: 'Put your finger on the place after the word “from”: that is where you stand. Then trace a line to the other place. On most maps north is up, south is down, east is to the right and west is to the left. Halfway between two points takes both names, with north or south first: north-east, never east-north.',
    check: 'Find “from” in the question and start there. Up or down first, left or right second.' },
  mapread: { label: 'Reading a map', col: '#8A5A2B', pose: 'think', stops: ['birds-eye', 'map-symbols', 'grid-refs', 'map-scale', 'nested-places'], from: [],
    mistake: 'You read a grid square the wrong way round, or forget the scale when you measure.',
    rule: 'A map is a view from straight above, drawn small. A grid square is read “along the corridor, then up the stairs” — the one along the bottom first. And a distance on a map only becomes real once you multiply it by the scale.',
    check: 'Along first, then up. Measured something? Multiply by the scale before you answer.' },
  continents: { label: 'Continents & oceans', col: '#2F8F5B', pose: 'wave', stops: ['seven-continents', 'find-continent', 'which-continent', 'five-oceans', 'island-nations'], from: [],
    mistake: 'You put a country on the continent next door, or mix up which ocean is which.',
    rule: 'Learn the shapes as well as the names: seven big pieces of land, and the oceans as the water between them. For a country near the edge of a continent, ask which big piece of land it is joined to — or whether it is joined to any at all.',
    check: 'Before you tap, find it on the map in your head: which big piece of land is it touching?' },
  capitals: { label: 'Capitals', col: '#B14FC4', pose: 'think', stops: ['cap-europe', 'cap-asia', 'cap-africa', 'cap-americas', 'cap-oceania'], from: ['Country Capitals', 'State Capitals'],
    mistake: 'You pick the biggest or most famous city, and it is not the capital.',
    rule: 'A capital is where a country’s government meets — and that is not always its biggest or best-known city. Learn capitals in small sets, a continent at a time, and say each one out loud with its country, as a pair.',
    check: 'Am I choosing this because it is famous, or because I know it is the capital?' },
  flags: { label: 'Flags', col: '#C0392B', pose: 'point', stops: ['flags'], from: ['Flags of the World'],
    mistake: 'Two flags with the same colours look alike, and you pick its neighbour.',
    rule: 'Many flags share colours, so colours alone will not do. Look at the layout: stripes across or up and down? How many? Is there a symbol, and where does it sit? Name the one thing that makes this flag different from the flag most like it.',
    check: 'Stripes across or down, how many, and which symbol — three looks before you tap.' },
  borders: { label: 'Countries & borders', col: '#1F6FA8', pose: 'point', stops: ['neighbours', 'landlocked', 'big-countries'], from: [],
    mistake: 'You name a country that is near but does not actually touch, or forget that some countries have no coast.',
    rule: 'Neighbours share a land border: they touch on the map, not just sit close. Trace the edge of the country with your finger and name every country you cross. A landlocked country is one whose whole edge is land.',
    check: 'Do they really touch — or is there sea, or another country, in between?' },
  latlong: { label: 'Lines on the globe', col: '#3D7DF0', pose: 'think', stops: ['lat-long', 'hemispheres', 'special-lines', 'sun-time'], from: [],
    mistake: 'You swap latitude and longitude, or north and south of the Equator.',
    rule: 'Latitude lines run across, like the rungs of a ladder — lat-itude, ladder — and say how far north or south of the Equator a place is. Longitude lines run from pole to pole and say how far east or west. The Earth turns 15° every hour, so the further east, the earlier the Sun arrives.',
    check: 'Across like ladder rungs: latitude. Pole to pole: longitude.' },
  landwater: { label: 'Land & water', col: '#5B8C2A', pose: 'wave', stops: ['landforms', 'water-bodies', 'land-or-water', 'river-parts', 'great-rivers', 'high-mountains', 'deserts'], from: [],
    mistake: 'Two words for land or water sound alike — and you pick the one that means a different shape.',
    rule: 'Each word answers a question about shape: high or low? Flat or steep? Water all round it, or it all round water? An island is land with water all round; a lake is water with land all round. Picture the shape first, then find its word.',
    check: 'High or low? Flat or steep? Water around it, or it around water?' },
  weather: { label: 'Weather & climate', col: '#2E8FB8', pose: 'think', stops: ['weather-climate', 'water-cycle', 'seasons', 'climate-zones', 'biomes'], from: [],
    mistake: 'You mix up weather and climate, or the steps of the water cycle.',
    rule: 'Weather is what the sky is doing today; climate is the pattern over many years. Seasons come from the Earth’s tilt, which is why the two hemispheres have opposite seasons. The water cycle is a loop — evaporation, condensation, precipitation, collection — and round again.',
    check: 'Is it about today, or about many years? Which half of the Earth is tilted toward the Sun?' },
  restless: { label: 'The restless Earth', col: '#B2452C', pose: 'oops', stops: ['earth-layers', 'plates', 'volcanoes-quakes', 'rocks', 'pangaea'], from: [],
    mistake: 'You mix up the Earth’s layers, or the three families of rock.',
    rule: 'Think of a peach: a thin skin (the crust), thick fruit (the mantle) and a stone in the middle (the core). Rocks are sorted by how they were made — igneous from melted rock that cooled, sedimentary from layers pressed together, metamorphic changed by heat and squeezing.',
    check: 'Ask how it was made: melted, layered, or changed?' },
  people: { label: 'People & places', col: '#7A5FA8', pose: 'wave', stops: ['settlements', 'resources'], from: [],
    mistake: 'You mix up settlements by size, or a resource that comes back with one that runs out.',
    rule: 'Settlements grow up a ladder — hamlet, village, town, city — and people settle where there is water, good land and a way to travel. A resource that grows back or keeps flowing is renewable; one that took ages to form and is used up for good is not.',
    check: 'Will it come back, or is it gone once it is used?' },
};
export const TRAP_OF_STOP = Object.fromEntries(Object.entries(TRAPS).flatMap(([k, t]) => t.stops.map((s) => [s, k])));
export const trapOf = (m) => (m.q && m.q.stop && TRAP_OF_STOP[m.q.stop]) || Object.keys(TRAPS).find((k) => TRAPS[k].from.includes(m.from)) || null;

/* the deck, grouped: [{k, n, items}] — n counts every time the questions were missed, biggest first */
export function traps(k) {
  const by = {};
  for (const [key, m] of Object.entries(k.miss || {})) { const t = trapOf(m); if (!t) continue; (by[t] = by[t] || { k: t, n: 0, items: [] }).n += m.n || 1; by[t].items.push({ key, ...m }); }
  for (const g of Object.values(by)) g.items.sort((a, b) => (b.n || 1) - (a.n || 1) || b.at - a.at);
  return Object.values(by).sort((a, b) => b.n - a.n || a.k.localeCompare(b.k));
}
/* the stop to practise for a trap: the one with most misses in it, else its first stop */
export function beatStop(k, trap) {
  const g = traps(k).find((x) => x.k === trap), count = {};
  for (const m of (g ? g.items : [])) if (m.q.stop) count[m.q.stop] = (count[m.q.stop] || 0) + (m.n || 1);
  return Object.keys(count).sort((a, b) => count[b] - count[a])[0] || TRAPS[trap].stops.find((s) => byId[s]);
}
export const answerOf = (q) => (q.kind === 'map' ? q.targetName || '' : q.kind === 'order' ? String(q.ans || '').split('|').join(' → ') : q.ans != null ? String(q.ans) : (q.ok || []).join(', '));

/* Shelly's one line, in the child's own terms */
export function readLine(k) {
  const g = traps(k);
  if (!Object.keys(k.miss || {}).length) return { pose: 'wave', line: 'Nothing is catching you right now. Every question you miss teaches me how you think — so go and get some wrong, and I will have something to say.' };
  if (!g.length) return { pose: 'think', line: 'Your misses are spread thin — no one kind of question is catching you. That is a good place to be.' };
  const top = g[0], share = Math.round((100 * top.n) / g.reduce((s, x) => s + x.n, 0));
  const qs = top.items.length === 1 ? 'one question' : top.items.length + ' questions';
  if (g.length === 1) return { pose: 'think', line: `Everything catching you right now is one thing: <b>${TRAPS[top.k].label.toLowerCase()}</b> — ${qs}. Learn the trick below and it stops.` };
  return { pose: 'think', line: share >= 50 ? `Most of what catches you is one thing: <b>${TRAPS[top.k].label.toLowerCase()}</b>. Fix that, and ${share}% of your misses stop happening.`
    : `The biggest thing catching you is <b>${TRAPS[top.k].label.toLowerCase()}</b> — ${top.items.length === 1 ? 'one question' : top.items.length + ' questions'}, missed ${top.n === 1 ? 'once' : top.n + ' times'}.` };
}

/* the ladder: where the child stands on the ten roads, and what the next one brings (levels.js's own words) */
export function ladder(level) {
  const now = LEVELS.find((L) => L.n === level) || LEVELS[0], next = LEVELS.find((L) => L.n === now.n + 1) || null;
  return { now, next };
}

/* Shelly's habit of the day: how to learn, never a fact about a place */
export const TIPS = [
  { t: 'Say it out loud', b: 'Say a capital together with its country, out loud, as a pair. Two words said together are remembered together.' },
  { t: 'A little, often', b: 'Ten minutes today and ten tomorrow beat an hour once. Memory grows in the gaps between.' },
  { t: 'Point before you tap', b: 'Find the place on the map in your head before you choose. If you cannot see it, that is the one to learn next.' },
  { t: 'Mistakes come back', b: 'A question you miss waits in your mistakes deck and comes back after a gap. Getting it right then is what learning is.' },
  { t: 'Learn in small sets', b: 'Five at a time, then five more. A whole continent at once is a list; five is a set you can hold.' },
  { t: 'Find it in the real world', b: 'Next time you see a map — on a wall, in a book, on a screen — find one place you learned this week.' },
  { t: 'Teach someone', b: 'Explain one thing you learned to someone at home. If you can teach it, you know it.' },
  { t: 'Use the hint well', b: 'A hint shows where, never which. Use it — then try the same kind of question later without it.' },
  { t: 'Read the question twice', b: 'Many slips happen in the question, not the answer: from or to, north or south, capital or country.' },
  { t: 'Draw it', b: 'Sketch a country’s shape from memory, then check it in the Map Explorer. Wrong is fine — it shows you where to look.' },
  { t: 'Learn the neighbours too', b: 'When you learn a country, look at the ones that touch it. Places are remembered better in groups.' },
  { t: 'Slow is fine', b: 'A right answer after a careful look is worth more than a fast guess. Nobody is timing you here.' },
];
export const tipOf = (i) => TIPS[((i % TIPS.length) + TIPS.length) % TIPS.length];

/* every stop is claimed by exactly one trap (test/coach.mjs) */
export const unclaimed = () => STOPS.map((s) => s.id).filter((id) => !TRAP_OF_STOP[id]);
