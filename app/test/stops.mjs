/* stops.mjs — every stop, every level, thousands of generated questions.
   Exactly one right option, distinct options, the answer never in the text,
   a map question's targets all real shapes. Never loosen this to make a
   chapter pass: fix the generator. */
import { STOPS, drill, correct, qKey, newSeen, remember, vary, varyKind } from '../src/stops.js';
import { seeded } from '../src/rand.js';
import { hasShape } from '../src/map.js';

let fails = 0, n = 0; const kinds = { type: 0, order: 0 };
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
        } else if (q.kind === 'type') {
          kinds.type++;
          if (!q.ans || !(q.accept || []).includes(q.ans)) bad(s, lv, q, 'a typed answer that does not accept its own answer');
          if (!correct(q, q.ans) || !correct(q, '  ' + q.ans.toUpperCase() + ' ') || correct(q, q.ans.slice(0, -1)) || correct(q, '')) bad(s, lv, q, 'typing check: the answer, its case and spaces pass; a letter short or nothing fails');
          if ((q.accept || []).some((a) => a.length > 2 && q.text.toLowerCase().includes(a.toLowerCase()))) bad(s, lv, q, 'answer in the text');
        } else if (q.kind === 'order') {
          kinds.order++;
          const want = q.ans.split('|');
          if (want.length < 3 || new Set(q.items).size !== q.items.length || [...q.items].sort().join() !== [...want].sort().join()) bad(s, lv, q, `order: ${q.items.join(' | ')} vs ${q.ans}`);
          if (q.items.join('|') === q.ans) bad(s, lv, q, 'order: shown already in the answer’s order');
          if (!correct(q, q.ans) || correct(q, [...want].reverse().join('|'))) bad(s, lv, q, 'order: the right order is right, the reverse is not');
        } else bad(s, lv, q, 'unknown kind ' + q.kind);
      }
    }
  }
}
/* A round asks ten DIFFERENT things (the owner: "a bird's-eye view asks the same question
   multiple times"). Every stop, every level, 40 rounds: ten questions, no two with the same
   words and answer, none the same fact asked the other way round (drill's seen.fits). A stop
   that cannot fill a round needs more questions written — never a shorter round, never a repeat. */
const short = [];
for (const s of STOPS) for (const lv of [1, 2, 3]) {
  const r = seeded('unique' + s.id + lv);
  for (let i = 0; i < 40; i++) {
    const d = drill(s, lv, 10, r), keys = new Set(d.map(qKey));
    if (d.length < 10) { short.push(`${s.id} lv${lv}: ${d.length} different questions`); break; }
    if (keys.size !== d.length) { bad(s, lv, d[0], 'a round repeats a question'); break; }
    const S = newSeen(); for (const q of d) { if (!S.fits(q)) { bad(s, lv, q, 'a round asks the same fact twice'); break; } remember(S, q); }
  }
}
if (short.length) { fails += short.length; console.error(`✗ ${short.length} stop levels cannot fill a round of ten different questions:\n   ${short.join('\n   ')}`); }
/* E4/G2: a mixed set (Library quizzes, the trip, level checks) asks about a third of its choosing
   questions another way — typed, or a tap on the map — and each converted question is right for its
   answer and ONLY its answer, with the answer nowhere in its words. */
{
  let sets = 0, mixed = 0, conv = 0;
  for (const s of STOPS) for (const lv of [1, 2, 3]) {
    const r = seeded('vary' + s.id + lv), base = drill(s, lv, 10, r), out = vary(base, r);
    const can = base.filter((q) => varyKind(q)).length; sets++;
    if (can >= 2) { mixed++; if (out.filter((q) => q.varied).length < 2) bad(s, lv, base[0], `a mixed set converted fewer than 2 of ${can} it could`); }
    out.forEach((q, i) => { if (!q.varied) return; conv++; const was = base[i], other = was.opts.find((o) => o !== was.ans);
      if (q.kind === 'type' && !(correct(q, was.ans) && correct(q, was.ans.toLowerCase()) && !correct(q, other))) bad(s, lv, q, 'a typed question must take its answer (any case) and refuse the others');
      if (q.kind === 'map' && !(q.ok.length === 1 && correct(q, q.ok[0]) && q.targetName === was.ans)) bad(s, lv, q, 'a map question must be its answer’s country');
      if (q.text.toLowerCase().includes(was.ans.toLowerCase()) && was.ans.length > 2) bad(s, lv, q, 'a converted question names its answer'); });
  }
  if (conv < 100) { fails++; console.error(`✗ too few questions asked another way (${conv})`); }
}
/* the right answer has no favourite slot */
const slots = [0, 0, 0, 0];
for (const s of STOPS) { const r = seeded('slots' + s.id); for (const q of drill(s, 2, 10, r)) if (q.kind === 'mc' && q.opts.length === 4) slots[q.opts.indexOf(q.ans)]++; }
const tot = slots.reduce((a, b) => a + b, 0);
/* E4: at least two kinds of item beyond choosing, really generated */
if (kinds.type < 50 || kinds.order < 50) { fails++; console.error(`✗ too few typed (${kinds.type}) or put-in-order (${kinds.order}) questions`); }
if (slots.some((x) => x / tot < 0.18)) { fails++; console.error('✗ answer slots are lopsided:', slots); }
console.log(`${fails ? '✗' : '✓'} stops: ${STOPS.length} stops, ${n} questions (${kinds.type} typed, ${kinds.order} in order), slots ${slots.join('/')}${fails ? `, ${fails} failures` : ''}`);
process.exit(fails ? 1 : 0);
