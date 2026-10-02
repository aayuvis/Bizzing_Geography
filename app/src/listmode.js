/* listmode.js — LIST MODE (L5): a map question as a short list of named places, for a
   screen reader, a keyboard, or anyone who would rather read than tap a shape.

   The audit's E11 finding: on a continent question ("Tap Africa") every country of
   the continent is a right answer, and the old list drew its wrong ones from that
   same continent — then filtered out every right one, and showed ONE option: the
   answer. Now the wrong ones are drawn from places that are NOT right answers
   (nearby first, so the list is still a question), the list always has four places,
   and the answer's slot comes from the question itself, so no slot is a favourite.
   test/listmode.mjs runs every map question the stops can generate through it. */

import { byCc, QUIZ } from './geo.js';
import { regionsOf } from './library/states.js';
import { seeded, shuffle } from './rand.js';

export const LIST_N = 4;

/* → { ids: [place id …], right: the one right id, names: id → name } */
export function listOptions(q, n = LIST_N) {
  const r = seeded('list|' + q.text + '|' + (q.ok || []).join(','));
  const regions = q.region ? regionsOf(q.region) : null;
  const nameOf = (id) => (regions ? (regions.find((x) => x.id === id) || {}).name : (byCc[id] || {}).name) || '';
  const pool = regions ? regions.map((x) => x.id) : QUIZ.map((c) => c.cc);
  const ok = new Set(q.ok || []);
  /* the right one: a named place that is a right answer (a quizzed country where there is one) */
  const named = [...ok].filter((id) => nameOf(id) && (regions || (byCc[id] && byCc[id].quiz)));
  const right = shuffle(named.length ? named : [...ok].filter(nameOf), r)[0];
  /* wrong ones: never a right answer; nearby first (same continent) when there are enough */
  const notOk = pool.filter((id) => !ok.has(id) && nameOf(id) && nameOf(id) !== nameOf(right));
  const near = regions || !byCc[right] ? notOk : notOk.filter((cc) => byCc[cc].cont === byCc[right].cont);
  const from = near.length >= n - 1 ? near : notOk;
  const wrong = [], seen = new Set([nameOf(right)]);
  for (const id of shuffle(from, r)) { if (wrong.length >= n - 1) break; if (!seen.has(nameOf(id))) { seen.add(nameOf(id)); wrong.push(id); } }
  /* the right one's slot: from the question, evenly over the slots */
  const ids = wrong.slice(), slot = Math.floor(r() * (ids.length + 1));
  ids.splice(slot, 0, right);
  return { ids, right, names: Object.fromEntries(ids.map((id) => [id, nameOf(id)])) };
}
