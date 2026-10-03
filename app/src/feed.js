/* feed.js — My Feed for Bizzing Geography (FAMILY-STANDARD §6a): the LAST tab.

   The family's engine (bizzing-feed.js, vendored byte for byte) ranks; this file only tells it
   what this child is doing. The cards are cut at build time by tools/build-feed.mjs from the
   app's own corpus (data/feed.js, loaded lazily by #/feed). Everything here happens on the
   device; nothing is sent anywhere — and no card loads a Street View photo: every picture is
   one of the app's own paintings or flags.

     level      the child's road (levels.js) — the engine builds now / review / next / any from it
     signals    what was just done: the last stop or expedition, recent stops, the Library tools
                opened, the next station on the road — each with its plain-words why
     due        the mistakes deck: a miss whose gap is over brings its stop (or its capital, or
                its flag) back first
     unlocked   a question from a stop the child has not reached yet is not asked
     skip       a stop already passed is not news; an expedition day already done is not news
     extra      the level-fit rule: the stations still to walk on the child's own road

   What it keeps (k.feed, through the Store seam): which cards were seen on which day, which
   questions have paid, and today's session — drawn again only when the child has done
   something new. Scrolling earns nothing; a right answer to a card's question pays one coin,
   once (main.js). */

import { feedFor } from './bizzing-feed.js';
import { byId } from './stops.js';
import { road, stopOpen, levelOf } from './model.js';
import { missDue } from './mistakes.js';
import { EXPEDITIONS } from './data/expeditions.js';

const DAY = 864e5;
export const feedOn = (h) => !(h && h.parent && h.parent.feedOff);
export const levelName = (n) => { const L = levelOf(n); return L ? `Level ${n} · ${L.name}` : `Level ${n}`; };
const TOOL_NAME = { capitals: 'Country Capitals', flags: 'Flags of the World', dictionary: 'the Dictionary', explorer: 'the Map Explorer', geoguess: 'Where on Earth?', states: 'State Capitals' };

export function feedRec(k) {
  const f = k.feed || (k.feed = {});
  f.seen = f.seen || {}; f.paid = f.paid || {};
  return f;
}

/* the options the engine is given — pure, so test/feed-rank.mjs runs it in node */
export function feedOpts(h, k, items, now = Date.now()) {
  const rd = road(k), signals = [], due = {}, today = Math.floor(now / DAY);
  if (rd.next) signals.push({ topic: 'stop:' + rd.next.stop, w: 6, why: `Next on your road: ${byId[rd.next.stop].title}` });
  const recent = Object.entries(k.stops || {}).filter(([id, r]) => byId[id] && r.at).sort((a, b) => b[1].at - a[1].at).slice(0, 3);
  recent.forEach(([id], i) => signals.push({ topic: 'stop:' + id, w: 8 - i, why: `Because you walked ${byId[id].title}` }));
  const L = k.last;
  if (L && now - L.at < 7 * DAY) {
    const s = Object.values(byId).find((x) => x.title === L.title);
    if (s) signals.push({ topic: 'stop:' + s.id, w: 9, why: `Because you just did ${s.title}` });
    const e = EXPEDITIONS.find((x) => x.name === L.title);
    if (e) signals.push({ topic: 'exp:' + e.id, w: 9, why: `Because you are on ${e.name}` });
  }
  for (const id of Object.keys(k.lib || {})) if (TOOL_NAME[id] && Object.keys(k.lib[id] || {}).length) signals.push({ topic: 'tool:' + id, w: 4, why: `Because you opened ${TOOL_NAME[id]}` });
  for (const e of EXPEDITIONS) if ((k.exp || {})[e.id]) signals.push({ topic: 'exp:' + e.id, w: 5, why: `Because you are on ${e.name}` });
  for (const m of missDue(k, now)) {
    const why = `A question from ${m.from || 'your journey'} slipped — its gap is over`;
    if (m.q.stop && byId[m.q.stop]) due['stop:' + m.q.stop] = due['stop:' + m.q.stop] || why;
    if (m.q.ans) due['ans:' + m.q.ans] = due['ans:' + m.q.ans] || why;
  }
  const todo = new Set(rd.steps.filter((s) => !s.done).map((s) => s.stop));
  const f = feedRec(k);
  return {
    items, band: k.band, now, level: k.road.level, levelName, signals, due, seen: f.seen,
    unlocked: (it) => !(it.play && it.stop) || h.parent.tester || stopOpen(h, k, it.stop),
    skip: (it) => (it.kind === 'stop' && ((k.stops || {})[it.stop] || {}).stars >= 2) || (!!it.day && !!((((k.exp || {})[it.exp] || {}).seen || {})[it.day])),
    extra: (it) => (it.stop && todo.has(it.stop) ? { s: 3, why: `On your road: ${levelName(k.road.level)}` } : null),
    _today: today,
  };
}

/* today's session, kept until the child does something new (a stop, a level, a slipped card) */
export function feedSession(h, k, items, now = Date.now()) {
  const o = feedOpts(h, k, items, now), f = feedRec(k);
  const key = [o._today, (k.last || {}).at || 0, k.road.level, Object.keys(o.due).length, k.band].join('|');
  if (f.sess && f.sess.key === key && f.sess.list.every((x) => items.some((i) => i.id === x.id))) return f.sess.list;
  const list = feedFor(o);
  for (const x of list) f.seen[x.id] = o._today;
  for (const id of Object.keys(f.seen)) if (o._today - f.seen[id] > 14) delete f.seen[id];
  f.sess = { key, list };
  return list;
}
