/* listmode.mjs — list mode (E11, the audit's answer leak). Every map question any stop
   can generate, at every level, is turned into a list and held to the question rules:
   at least three places (four where the map has them), exactly one right, distinct
   names, no blank name — and the right one's slot spread evenly, so a child who always
   presses 1 is not rewarded. It caught the continent questions showing ONE option. */
import { STOPS, drill, correct } from '../src/stops.js';
import { seeded } from '../src/rand.js';
import { listOptions, LIST_N } from '../src/listmode.js';

let fails = 0, n = 0;
const slots = Array(LIST_N).fill(0), seen = new Set();
const bad = (q, msg) => { if (fails++ < 20) console.error(`✗ list: ${msg}\n   ${q.text} → ${(q.ok || []).slice(0, 6)}`); };
let multi = 0;
for (const s of STOPS) for (const lv of [1, 2, 3]) {
  const r = seeded('list' + s.id + lv);
  for (let i = 0; i < 25; i++) for (const q of drill(s, lv, 10, r)) {
    if (q.kind !== 'map') continue;
    const key = q.text + '|' + q.ok.join(); if (seen.has(key)) continue; seen.add(key);
    const { ids, right, names } = listOptions(q);
    n++; if (q.ok.length > 1) multi++;
    if (ids.length < 3) bad(q, `${ids.length} option(s): ${ids.map((x) => names[x]).join(' | ')}`);
    const hits = ids.filter((id) => correct(q, id)).length;
    if (hits !== 1) bad(q, `${hits} right options: ${ids.map((x) => names[x]).join(' | ')}`);
    if (!correct(q, right)) bad(q, 'the "right" one is not right');
    if (new Set(ids.map((x) => names[x])).size !== ids.length) bad(q, `duplicate names: ${ids.map((x) => names[x]).join(' | ')}`);
    if (ids.some((x) => !names[x])) bad(q, 'a place with no name');
    if (ids.length === LIST_N) slots[ids.indexOf(right)]++;
  }
}
const tot = slots.reduce((a, b) => a + b, 0);
if (n < 150) { fails++; console.error(`✗ list: only ${n} map questions checked`); }
if (multi < 6) { fails++; console.error(`✗ list: only ${multi} many-answer (continent) questions checked`); }
/* even slots: each within 40% of a fair share */
for (const [i, c] of slots.entries()) if (Math.abs(c - tot / LIST_N) > 0.4 * (tot / LIST_N)) { fails++; console.error(`✗ list: slot ${i + 1} holds the answer ${c} of ${tot} times`); }
if (fails) { console.error(`✗ listmode: ${fails} problems`); process.exit(1); }
console.log(`✓ listmode: ${n} map questions (${multi} with many answers) as lists of ${LIST_N}, one right, slots ${slots.join('/')}`);
