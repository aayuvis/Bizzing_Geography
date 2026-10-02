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
