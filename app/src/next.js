/* next.js — THE next step. One function decides what "Continue" means, and every
   screen that offers a next step asks it: the home's Continue card, #/continue
   from the Hive, the end of a welcome. Two buttons that disagree about what is
   next were the audit's B2 finding; there is now one place that can be wrong.

     0. the mistakes deck, when five or more cards have come back (F3: a miss is
        learned after a gap, so a full deck is the most useful five minutes there are)
     1. the next station on the child's own road
     2. the level check, when every station on the road is done
     3. the expedition worked on most recently (or one for the child's age)
     4. a round of Where on Earth? */

import { byId, worldOf } from './stops.js';
import { road, rankOf } from './model.js';
import { EXPEDITIONS } from './data/expeditions.js';
import { stats as expStats, dayTitle } from './expeditions.js';
import { missDue } from './mistakes.js';
export const MISS_FIRST = 5;

export function homeExpedition(k) {
  const on = EXPEDITIONS.filter((e) => (k.exp || {})[e.id]).map((e) => ({ e, last: Object.values(k.exp[e.id].seen || {}).sort().pop() || k.exp[e.id].at }));
  if (on.length) return on.sort((a, b) => (a.last < b.last ? 1 : -1))[0].e;
  const age = { '6-7': 6, '8-10': 8, '11-14': 11 }[k.band] || 8;
  return EXPEDITIONS.find((e) => age >= e.ages[0] && age <= e.ages[1]) || EXPEDITIONS[0];
}

/* { act, arg, title, sub, kicker, art, glyph, done, total, where } */
export function nextStep(k) {
  const rd = road(k), rk = rankOf(k.xp);
  const where = { level: rd.L.n, levelName: rd.L.name, done: rd.done, total: rd.steps.length, rank: rk };
  const due = missDue(k);
  if (due.length >= MISS_FIRST) {
    const st = byId[due[0].q.stop] || (rd.next && byId[rd.next.stop]);
    return { act: 'practiseMisses', arg: '', kicker: 'your misses are back', title: `${Math.min(10, due.length)} cards to try again`, sub: 'Each one you missed has waited a day. Right now is when it sticks.', art: st ? `w-${st.world}` : 'w-home', glyph: '⏳', ...where };
  }
  if (rd.next) {
    const s = byId[rd.next.stop], w = worldOf(s.world);
    return { act: 'openStop', arg: s.id, kicker: `stop ${rd.next.n}`, title: s.title, sub: `${w.name} · ${s.hook}`, art: `w-${w.id}`, glyph: s.glyph, ...where };
  }
  if (!rd.all || !k.road.finished.includes(rd.L.n)) {
    return { act: 'levelCheck', arg: '', kicker: 'every stop done', title: 'The level check', sub: `Twelve questions from your road. Ten right opens Level ${Math.min(10, rd.L.n + 1)}.`, art: `w-${byId[rd.steps[0].stop].world}`, glyph: '🏁', ...where };
  }
  const e = homeExpedition(k), es = expStats(k, e), ed = es.next;
  if (ed) {
    const st = ed.stop || (ed.stops || [])[0];
    return { act: 'expDay', arg: `${e.id}|${ed.n}`, kicker: `${e.name} · day ${ed.n} of ${es.days}`, title: dayTitle(ed), html: true, sub: e.blurb || '', art: st ? `w-${byId[st].world}` : `crs-${e.id}`, glyph: e.glyph, ...where };
  }
  return { act: 'openTool', arg: 'geoguess', kicker: 'Every road walked', title: 'Where on Earth?', sub: 'A real place somewhere on Earth. Pin it on the map.', art: 'lib-geoguess', glyph: '🌍', ...where };
}
