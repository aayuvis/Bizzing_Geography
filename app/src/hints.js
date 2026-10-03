/* hints.js — one step of help per question (E6), never the answer.

     choose-one   one wrong option is taken away (with three or more to choose from);
                  a true-or-false question gets the stop's own idea as a reminder
     map          a country: the continent it is on, and the map turns to it;
                  a continent: a well-known country that is in it
     type         the first letter and how many letters
     put-in-order which one comes first

   A hinted right answer still counts for the stop, but pays no coin and no rank — the
   reward is halved by the rule, and the screen says so. test/hints.mjs runs every
   generated question through hintFor and fails if a hint names or reveals the answer. */

import { byCc, QUIZ, CONTINENTS } from './geo.js';
import { seeded } from './rand.js';
import { FAMOUS } from './chapters/kit.js';

/* E6, the second step: a picture of WHERE, never of which. A map question moves in on the answer's
   part of the world (a box some fifty degrees wide, never the country); a choose-one whose answer is
   a country lights its whole continent — only when the options are on more than one, or the light
   would say nothing; a question that names a country (its capital, its river) lights that country.
   null when there is no honest second step. test/learning.mjs holds every one to never naming,
   lighting or zooming to the answer alone. */
const NAMED = new Map(QUIZ.map((c) => [c.name.toLowerCase(), c]));
export function hint2(q) {
  if (q.kind === 'map' && !q.region) {
    const ok = (q.ok || []).filter((c) => byCc[c]); if (ok.length !== 1) return null;
    const [lat, lng] = byCc[ok[0]].at, x0 = Math.max(-180, Math.min(124, lng - 28)), y0 = Math.max(-60, Math.min(40, lat - 20)), box = [x0, y0, x0 + 56, y0 + 40];   // shifted, never shrunk, at the map's edges
    return { kind: 'text', level: 2, say: `Closer: the map has moved in on that part of ${byCc[ok[0]].cont}. It is somewhere on this view.`, view: box };
  }
  if (q.kind !== 'mc') return null;
  const ans = NAMED.get(String(q.ans).toLowerCase());
  if (ans) {
    const conts = new Set(q.opts.map((o) => (NAMED.get(String(o).toLowerCase()) || {}).cont).filter(Boolean));
    if (conts.size < 2) return null;
    const fill = Object.fromEntries(QUIZ.filter((c) => c.cont === ans.cont).map((c) => [c.cc, 'hl']));
    return { kind: 'map', level: 2, say: 'It is somewhere in the lit part of the world.', map: { fill, cont: ans.cont } };
  }
  const named = QUIZ.filter((c) => c.name.length > 3 && new RegExp(`\\b${c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(q.text));
  if (named.length !== 1 || q.opts.some((o) => String(o).toLowerCase() === named[0].name.toLowerCase())) return null;
  return { kind: 'map', level: 2, say: `${named[0].name} is lit on the map — picture what is inside it.`, map: { fill: { [named[0].cc]: 'hl' }, cont: named[0].cont } };
}

export function hintFor(q, stop) {
  const r = seeded('hint|' + q.text);
  if (q.kind === 'mc') {
    const wrong = q.opts.filter((o) => o !== q.ans);
    if (q.opts.length >= 3) return { kind: 'strike', opt: wrong[Math.floor(r() * wrong.length)], say: 'One wrong answer is gone.' };
    const names = (t) => q.opts.some((o) => o.length > 3 && t.toLowerCase().includes(o.toLowerCase()));
    const said = stop && stop.hook && !names(stop.hook) ? `Remember: ${stop.hook}` : 'Say the question to yourself, then ask: which one would still be true next week, and which only today?';
    return { kind: 'text', say: q.opts.length === 2 && /weather|climate/i.test(q.text) ? said : stop && stop.hook && !names(stop.hook) ? `Remember: ${stop.hook}` : 'Read the question once more, slowly, and picture the place.' };
  }
  if (q.kind === 'map') {
    if (q.region) return { kind: 'text', say: 'Look at the places next to the ones you already know.' };
    const ok = (q.ok || []).filter((c) => byCc[c]);
    if (ok.length === 1) {
      const c = byCc[ok[0]], cont = CONTINENTS.find((x) => x.id === c.cont);
      return cont ? { kind: 'text', say: `It is in ${c.cont}. The map has turned to it.`, view: cont.view } : { kind: 'text', say: 'Look near the middle of the map first.' };
    }
    /* a continent (or a group): name one well-known country inside it — never the group's own name */
    const fam = ok.filter((c) => FAMOUS.has(c) && byCc[c].quiz && !q.text.includes(byCc[c].name));
    const pick = fam.length ? fam[Math.floor(r() * fam.length)] : ok[0];
    return { kind: 'text', say: `${byCc[pick].name} is one of the places that would be right.` };
  }
  if (q.kind === 'type') {
    const a = String(q.ans);
    return { kind: 'text', say: `It starts with “${a[0]}” and has ${a.replace(/[^\p{L}]/gu, '').length} letters.` };
  }
  if (q.kind === 'order') {
    const first = String(q.ans).split('|')[0];
    return { kind: 'first', first, say: `${first} comes first.` };
  }
  return { kind: 'text', say: 'Read the question once more, slowly.' };
}
