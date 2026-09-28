/* stops.mjs — every stop, every level, thousands of generated questions.
   Exactly one right option, distinct options, the answer never in the text,
   a map question's targets all real shapes. Never loosen this to make a
   chapter pass: fix the generator. */
import { STOPS, drill, correct } from '../src/stops.js';
import { seeded } from '../src/rand.js';
import { hasShape } from '../src/map.js';

let fails = 0, n = 0;
const bad = (s, lv, q, msg) => { if (fails++ < 25) console.error(`✗ ${s.id} lv${lv}: ${msg}\n   ${q.text} → ${q.ans || q.ok}`); };
for (const s of STOPS) {
  for (const f of ['id', 'title', 'hook', 'idea', 'why', 'gen', 'band', 'world']) if (!s[f]) bad(s, 0, { text: '' }, `missing ${f}`);
  for (const lv of [1, 2, 3]) {
    const r = seeded(s.id + lv);
    for (let i = 0; i < 25; i++) {
      for (const q of drill(s, lv, 10, r)) {
        n++;
        if (q.kind === 'mc') {
          const hits = q.opts.filter((o) => correct(q, o)).length;
          if (hits !== 1) bad(s, lv, q, `${hits} right options: ${q.opts.join(' | ')}`);
          if (new Set(q.opts).size !== q.opts.length) bad(s, lv, q, `duplicate options: ${q.opts.join(' | ')}`);
          if (q.opts.length < 2) bad(s, lv, q, 'fewer than two options');
          /* the answer may appear in the text only when the text names EVERY option
             ("…weather or climate?") — then it favours none of them */
          const low = q.text.toLowerCase(), named = (o) => low.includes(o.toLowerCase());
          if (!['True', 'False'].includes(q.ans) && q.ans.length > 2 && named(q.ans) && !q.opts.every(named)) bad(s, lv, q, 'answer in the text');
          if (q.opts.some((o) => o === 'undefined' || o === '' || o === 'null')) bad(s, lv, q, `empty option: ${q.opts.join(' | ')}`);
        } else if (q.kind === 'map') {
          if (!q.ok.length) bad(s, lv, q, 'no target');
          if (!q.ok.some(hasShape)) bad(s, lv, q, 'no target has a shape on the map');
        } else bad(s, lv, q, 'unknown kind ' + q.kind);
      }
    }
  }
}
/* the right answer has no favourite slot */
const slots = [0, 0, 0, 0];
for (const s of STOPS) { const r = seeded('slots' + s.id); for (const q of drill(s, 2, 10, r)) if (q.kind === 'mc' && q.opts.length === 4) slots[q.opts.indexOf(q.ans)]++; }
const tot = slots.reduce((a, b) => a + b, 0);
if (slots.some((x) => x / tot < 0.18)) { fails++; console.error('✗ answer slots are lopsided:', slots); }
console.log(`${fails ? '✗' : '✓'} stops: ${STOPS.length} stops, ${n} questions, slots ${slots.join('/')}${fails ? `, ${fails} failures` : ''}`);
process.exit(fails ? 1 : 0);
