/* expeditions.mjs — the ten learning sprints, held to their promises.
   · the data: ten expeditions of 20–30 days, every stop and tool real (selftest);
   · every practice and check produces ten distinct, answerable questions;
   · THE DAY RULE: a check passed on the day of its teaching is practice; the same
     score on a later day is learning; a low score never is. Proven both ways;
   · no calendar pressure: nothing decays when days are skipped;
   · a second child inherits nothing. */
import { EXPEDITIONS, daysOf } from '../src/data/expeditions.js';
import { ledger, stats, quizFor, reviewStops, selftest, doDay, finishDay, learnedList, expAllows, projAct, projState } from '../src/expeditions.js';
import { ENGINES } from '../src/projects.js';
import { newKid } from '../src/model.js';
import { byId } from '../src/stops.js';
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; if (fails < 30) console.error('  ✗ ' + m); } };
selftest(ok);

let quizzes = 0;
for (const e of EXPEDITIONS) for (const d of daysOf(e)) if (d.k === 'p' || d.k === 'c' || d.k === 'f') {
  for (let t = 0; t < 3; t++) {
    const N = d.k === 'f' ? 15 : 10, q = quizFor(d, Math.random, N, reviewStops(e, d)); quizzes++;
    /* ten — except in an expedition's first part, whose thin stops have nothing earlier to review */
    const first = d.mod === e.modules[0].id;
    ok(q.length === N || (first && q.length >= 7), `${e.id} day ${d.n}: ${N} questions (${q.length})`);
    ok(q.filter((x) => !x.review).length >= Math.min(5, q.length), `${e.id} day ${d.n}: at least five from the day's own stops`);
    ok(new Set(q.map((x) => x.text + '|' + (x.ans || x.ok.join()))).size === q.length, `${e.id} day ${d.n}: no repeats`);
    ok(q.every((x) => x.kind === 'map' ? x.ok.length : x.opts.includes(x.ans)), `${e.id} day ${d.n}: every question has its answer`);
  }
}

/* the day rule */
const e = EXPEDITIONS[0], m = e.modules[0], days = daysOf(e).filter((d) => d.mod === m.id);
const a = newKid('Ahana', '6-7'), b = newKid('Kabir', '8-10');
for (const d of days.filter((d) => d.k === 't')) ledger.did(a, e.id, d.key, '2026-09-01');
let r = ledger.checked(a, e.id, m.id, 10, 10, '2026-09-01');
ok(r.good && !r.mastered && r.sameDay, 'a perfect check on the day of teaching is practice, not learning');
ok(!learnedList(a).length, '…and the grown-ups see nothing learned yet');
r = ledger.checked(a, e.id, m.id, 6, 10, '2026-09-20');
ok(!r.mastered, 'six of ten on a later day is not learned');
r = ledger.checked(a, e.id, m.id, 8, 10, '2026-09-20');
ok(r.mastered, 'eight of ten on a later day IS learned');
ok(learnedList(a).length === 1 && learnedList(a)[0].m.id === m.id, 'the grown-ups see exactly that objective');
const c = newKid('Mira', '8-10');
ok(ledger.checked(c, e.id, m.id, 10, 10, '2026-09-20').untaught, 'a check before any lesson does not count');
/* no calendar pressure */
const before = JSON.stringify(a.exp);
ok(stats(a, e).next && JSON.stringify(a.exp) === before, 'reading progress months later changes nothing — no decay, no streak');
/* doing a day through the engine */
const t1 = daysOf(e)[0];
ok(doDay(b, e.id, t1.n).go[0] === 'stop' && b.exp[e.id].seen[t1.key], 'a learn day opens its stop and is ticked');
ok(expAllows(b, t1.stop), 'the stop an expedition sent you to is open to you');
const pd = daysOf(e).find((d) => d.k === 'p');
const run = doDay(b, e.id, pd.n).run;
ok(run && run.items.length >= 7 && !run.extra.check, 'a practice day is a quiz run (ten, or all the first part holds)');
finishDay(b, { ...run.extra }, 7, 10);
ok(b.exp[e.id].seen[pd.key], 'finishing a practice ticks the day');
/* a project is made IN the app, and only when its checklist is complete */
const proj = daysOf(e).find((d) => d.k === 'm');
ok(doDay(b, e.id, proj.n).go[0] === 'proj', 'a project day opens its builder');
ok(projAct(b, `${e.id}|${proj.key}`, 'done') !== 'made' && !b.exp[e.id].seen[proj.key], 'an unfinished project cannot be marked made');
b.exp[e.id].work[proj.key] = ENGINES[proj.engine].solve(proj);
ok(projAct(b, `${e.id}|${proj.key}`, 'done') === 'made' && b.exp[e.id].seen[proj.key] && b.exp[e.id].art[proj.key], 'a finished one is made, and kept');
/* the final test counts only on a later day than the last part's test was learned */
const fin = daysOf(e).find((d) => d.k === 'f');
for (const mm of e.modules) b.exp[e.id].m[mm.id] = { on: '2099-01-01', tries: 1, best: 9 };
ok(!ledger.checked(b, e.id, 'final', 15, 15, '2099-01-01').mastered, 'the final test on the day of the last part test is practice');
ok(ledger.checked(b, e.id, 'final', 12, 15, '2099-02-01').mastered, 'twelve of fifteen on a later day finishes it');
ok(!a.exp[EXPEDITIONS[1].id] && Object.keys(c.exp).length === 1 && !Object.keys(c.exp[e.id].art || {}).length && Object.keys(b.exp[e.id].art).length === 1, 'every child keeps their own record');

console.log(`${fails ? '✗' : '✓'} expeditions: ${EXPEDITIONS.length} sprints, ${EXPEDITIONS.reduce((s, x) => s + daysOf(x).length, 0)} days, ${quizzes} quizzes run, ${n} checks${fails ? `, ${fails} failures` : ''}`);
process.exit(fails ? 1 : 0);
