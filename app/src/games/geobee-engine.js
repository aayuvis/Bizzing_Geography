/* geobee-engine.js — the Geo Bee: Bizzing Maths' Mock Contest (itself Bizzing Bee's mock bee),
   with geography.

   The rivals are the SAME TEN CHILDREN as the Bee's and Maths' — same names, same ages, same
   nerve, same pace, same notes and tells. The family's first rule for anything across the
   house: nothing is invented twice. A child who has sat beside Suki at the spelling bee meets
   her again here, still unshakeable. Only `spec` changes, because geography has its own
   specialities: capitals, flags, maps, physical, climate (SPEC_OF maps them to stop worlds).
   test/games.mjs reads the Maths file and proves every other field is the same.

   The round does the knocking out, not the bot: whether a rival gets a question is
   BASE + spec + (lvl + start − hardness)·SPREAD − press·(1 − nerve)·PRESS, clamped.
   Rules, from the Bee, as Maths keeps them:
     - round one eliminates nobody;
     - a round everybody misses is played again;
     - the final two play championship rules: when one misses, the other must get theirs
       AND one more to win, or both play on;
     - past SUDDEN_AT rounds the questions stop getting harder and every rival's nerve starts
       to go, so a contest always ends.

   Questions come ONLY from the stops' own generators (stops.js drill) — the contest invents
   no geography — walked up a hardness ladder made of the ten levels' own steps (levels.js).
   A month's Bee is seeded by the year and month: every child in a band meets the same
   questions all month, and a replay meets them again. */

import { LEVELS } from '../levels.js';
import { byId, drill, newSeen, varyKind, varyOne, qKey } from '../stops.js';
import { shuffle, seeded } from '../rand.js';

export const RIVALS = [
  { id: 'pixel', name: 'Pip', age: 8, lvl: .18, nerve: .74, spec: 'flags', pace: 620, note: 'Eight, and answers at a sprint. Brilliant or gone.', tell: 'starts before the question finishes' },
  { id: 'koi', name: 'Nova', age: 9, lvl: .24, nerve: .70, spec: 'capitals', pace: 1150, note: 'Steady. Her tables are solid and she knows it.', tell: 'says the question back, always' },
  { id: 'beaker', name: 'Rafi', age: 10, lvl: .32, nerve: .58, spec: 'physical', pace: 1300, note: 'Takes every number apart before he answers.', tell: 'writes on his palm with one finger' },
  { id: 'panda', name: 'Suki', age: 11, lvl: .38, nerve: .93, spec: null, pace: 1400, note: 'Unshakeable. The lights do nothing to her.', tell: 'breathes out, then answers' },
  { id: 'comet', name: 'Dax', age: 11, lvl: .42, nerve: .34, spec: null, pace: 700, note: 'Fastest here in round one. Watch him in round six.', tell: 'rocks on his heels' },
  { id: 'astro', name: 'Mira', age: 12, lvl: .44, nerve: .66, spec: 'maps', pace: 1250, note: 'Knows every square to 30 by heart.', tell: 'looks at the ceiling, as if it is written there' },
  { id: 'scopey', name: 'Theo', age: 12, lvl: .43, nerve: .80, spec: null, pace: 2100, note: 'Checks every answer with the nines before he says it.', tell: 'counts on his fingers under the desk — to check, not to add' },
  { id: 'melody', name: 'Ines', age: 13, lvl: .52, nerve: .72, spec: 'climate', pace: 1200, note: 'Percentages and fractions hold no surprises for her.', tell: 'mouths the numbers before she answers' },
  { id: 'samurai', name: 'Kwame', age: 14, lvl: .62, nerve: .78, spec: 'capitals', pace: 1100, note: 'Near a hundred, nobody is quicker.', tell: 'hands behind his back, dead still' },
  { id: 'goldlegend', name: 'Vesper', age: 15, lvl: .72, nerve: .95, spec: null, pace: 900, note: 'Won this last year. Has not looked at anyone since.', tell: 'does not ask for anything' },
];
/* what each speciality is called on screen */
export const SPECS = { capitals: 'capitals', flags: 'flags', maps: 'maps and directions', physical: 'land, rivers and the restless Earth', climate: 'weather and climate' };
/* a stop's speciality, from its world (the flags stop is its own) */
const SPEC_OF = { home: 'maps', compass: 'maps', globe: 'maps', people: 'maps', capitals: 'capitals', continents: 'physical', landwater: 'physical', rivers: 'physical', restless: 'physical', weather: 'climate' };
export const specOf = (stopId) => (stopId === 'flags' ? 'flags' : SPEC_OF[(byId[stopId] || {}).world] || null);

const BASE = 0.84, SPREAD = 1.5, PRESS = 0.55, SPEC = 0.10;
export const SUDDEN_AT = 14;
const STEP = 0.045;
/* where the field starts, by the child's band: the band's own starting road (levels.js START
   is 1 / 3 / 6), so the same rivals face questions pitched to the child in front of them —
   and never past the band's ceiling, so a seven-year-old is not asked about tectonic plates */
const START = { '6-7': 0.0, '8-10': 0.2, '11-14': 0.5 };
const CEIL = { '6-7': 0.19, '8-10': 0.49, '11-14': 0.96 };

/* The ladder: rung n is level n+1's own steps, each a stop at its lv. Hardness 0..0.99. */
export const LADDER = LEVELS.map((L) => ({ h: (L.n - 1) / 10, n: L.n, steps: L.steps.filter((s) => byId[s.stop]) }));
const rungAt = (h) => { let rung = LADDER[0]; for (const x of LADDER) if (x.h <= h + 1e-9) rung = x; return rung; };

/* A contest asks what a child can answer by choosing or typing: map taps and put-in-order
   items need their own boards, and a figure that is a whole world map is too heavy to
   redraw every round. */
const askable = (q) => (q.kind === 'mc' || q.kind === 'type') && (q.html || '').length < 40000;

/* the child's question at hardness h; `avoid` holds what this contest has already asked */
export function questionAt(h, r, band = '8-10', avoid = new Set()) {
  const rung = rungAt(h);
  for (let t = 0; t < 40; t++) {
    const st = rung.steps[Math.floor(r() * rung.steps.length)], stop = byId[st.stop];
    const [q] = drill(stop, st.lv, 1, r, newSeen());
    if (!q || !askable(q) || avoid.has(qKey(q))) continue;
    /* typed where it is natural: a name to spell, for 8 and up (a 6–7 is never asked to spell) */
    const typed = band !== '6-7' && q.kind === 'mc' && varyKind(q) === 'type' && r() < 0.3 ? { ...q, ...varyOne(q, 'type') } : q;
    return { ...typed, h: rung.h, level: rung.n, tag: specOf(stop.id) };
  }
  return null;
}
/* a rival's question is only its speciality: the round's draw of stop, no words needed */
export function tagAt(h, r) { const rung = rungAt(h); return specOf(rung.steps[Math.floor(r() * rung.steps.length)].stop); }

export function rivalGets(bot, tag, h, round, start, r) {
  const press = Math.min(1, round / 10);
  const tired = Math.max(0, round - SUDDEN_AT) * 0.05;
  const spec = bot.spec && bot.spec === tag ? SPEC : 0;
  const wobble = (r() - 0.5) * 0.08;
  const p = Math.min(0.97, Math.max(0.04, BASE + spec + (bot.lvl + start - h) * SPREAD - press * (1 - bot.nerve) * PRESS - tired + wobble));
  return r() < p;
}

/* ---------------------------------------------------------------- a contest */

/* the month a Bee belongs to — the local calendar, as the child lives it */
export const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
export const monthSeed = (band, d = new Date()) => `geobee|${monthKey(d)}|${band}`;

export function newContest(band, seed = monthSeed(band)) {
  const r = seeded(seed);
  const field = shuffle([{ id: 'you', you: true }, ...RIVALS.map((b) => ({ id: b.id }))], r).map((c, i) => ({ ...c, n: i + 1, out: 0 }));
  return { band, seed, round: 1, start: START[band] ?? 0.2, field, log: [], place: null, over: false, champ: null, winner: null, asked: [], rq: 0 };
}

export const live = (c) => c.field.filter((x) => !x.out);
export const bot = (id) => RIVALS.find((b) => b.id === id);

export function hardness(c) {
  const r = Math.min(c.round, SUDDEN_AT);
  return Math.min(CEIL[c.band] ?? 0.96, c.start + (r - 1) * STEP);
}

/* The child's question for this round, seeded by the contest, the round and whether it is the
   championship question — so a reload, or a replay this month, asks the same thing. */
export function childQuestion(c) {
  const r = seeded(`${c.seed}:${c.round}:${c.rq}`);
  const q = questionAt(hardness(c), r, c.band, new Set(c.asked));
  if (q) c.asked.push(qKey(q));
  return q;
}

/* Resolve a whole round. `youRight` is the child's result, or null once the child is out
   (the rest is then played through). */
export function playRound(c, youRight) {
  const r = seeded(`${c.seed}:r${c.round}:${c.rq}`);
  const h = hardness(c);
  const res = {};
  for (const x of live(c)) res[x.id] = x.you ? !!youRight : rivalGets(bot(x.id), tagAt(h, r), h, c.round, c.start, r);
  const ids = Object.keys(res);
  const missed = ids.filter((id) => !res[id]);
  const entry = { round: c.round, h, res, out: [] };

  if (c.round === 1) entry.note = 'Round one — nobody sits down in round one.';
  else if (missed.length === ids.length) entry.note = 'Everybody missed, so the round is played again.';
  else if (ids.length === 2 && missed.length === 1) {
    /* championship rules: the survivor must take one more */
    const other = ids.find((id) => res[id]);
    const extra = other === 'you' ? null : rivalGets(bot(other), tagAt(h, r), h, c.round, c.start, r);
    entry.champ = { id: other, needs: true, extra };
    if (other === 'you') c.champ = { missed: missed[0] };          // the screen asks the child the championship question
    else if (extra) { out(c, missed[0], entry); c.winner = other; }
    else entry.note = `${bot(other).name} missed the championship question — both play on.`;
  } else {
    /* everyone who sits down in the same round shares the same place */
    const place = ids.length - missed.length + 1;
    missed.forEach((id) => out(c, id, entry, place));
  }
  c.log.push(entry);
  c.round++; c.rq = 0;
  finish(c);
  return entry;
}

/* the child's own championship question, when they are the survivor */
export function championship(c, right) {
  const missed = c.champ && c.champ.missed;
  c.champ = null;
  if (right) { out(c, missed, c.log.at(-1)); c.winner = 'you'; }
  else c.log.at(-1).note = 'You missed the championship question — both play on.';
  finish(c);
}

function out(c, id, entry, place) {
  const x = c.field.find((f) => f.id === id);
  if (!x || x.out) return;
  x.place = place ?? live(c).length;
  x.out = c.round;
  entry.out.push(id);
}

function finish(c) {
  const l = live(c);
  if (l.length === 1) c.winner = l[0].id;
  if (c.winner) {
    const w = c.field.find((f) => f.id === c.winner);
    w.place = 1; c.field.forEach((f) => { if (f.id !== c.winner && !f.out) { f.out = c.round; f.place = 2; } });
    c.over = true;
  }
  const you = c.field.find((f) => f.you);
  if (you.out || c.over) c.place = you.place;
}

/* Once the child is out, run the rest to the end so the result can say who won — rivals
   only, fast, and guaranteed to stop. */
export function runOut(c) {
  let guard = 0;
  while (!c.over && guard++ < 400) {
    if (c.champ) { championship(c, false); continue; }
    playRound(c, null);
  }
  if (!c.over) { const l = live(c); c.winner = l[0].id; finish(c); }   // cannot happen; belt and braces
  return c;
}

/* The leak rules of test/stops.mjs, as one function: exactly one right option, distinct and
   non-empty options, and the answer never in the words unless the words name EVERY option
   ("…weather or climate?"). A typed question must take its own answer and never show it. */
export function leaks(q) {
  const low = String(q.text).toLowerCase();
  if (q.kind === 'mc') {
    const named = (o) => low.includes(o.toLowerCase());
    if (q.opts.filter((o) => o === q.ans).length !== 1) return 'not exactly one right option';
    if (new Set(q.opts).size !== q.opts.length || q.opts.length < 2) return 'options repeat, or too few';
    if (q.opts.some((o) => o === '' || o === 'undefined' || o === 'null')) return 'an empty option';
    if (!['True', 'False'].includes(q.ans) && q.ans.length > 2 && named(q.ans) && !q.opts.every(named)) return 'the answer is in the text';
    return '';
  }
  if (q.kind === 'type') {
    if (!q.ans || !(q.accept || []).includes(q.ans)) return 'a typed answer that does not accept itself';
    if ((q.accept || []).some((a) => a.length > 2 && low.includes(a.toLowerCase()))) return 'the answer is in the text';
    return '';
  }
  return 'not a contest kind: ' + q.kind;
}
