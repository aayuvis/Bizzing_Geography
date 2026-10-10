/* coach.mjs — Shelly's Coach and the daily goal (Bizzing Bee's). Every stop belongs to exactly one trap;
   no trick names a real place (CLAUDE.md rule 3 — method, never a fact typed from memory); the rings
   measure what they say; targets stay inside their choices; the read follows the deck. */
import { STOPS, byId, drill } from '../src/stops.js';
import { QUIZ } from '../src/geo.js';
import { seeded } from '../src/rand.js';
import * as CZ from '../src/coach.js';
import { newKid } from '../src/model.js';
import { missAdd } from '../src/mistakes.js';
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.error('  ✗ ' + m); } };

/* every stop is claimed once, and every claimed stop exists */
ok(!CZ.unclaimed().length, `every stop has a trap (unclaimed: ${CZ.unclaimed().join(', ')})`);
const claims = Object.values(CZ.TRAPS).flatMap((t) => t.stops);
ok(claims.length === new Set(claims).size && claims.every((s) => byId[s]), 'no stop is claimed twice, and none is invented');
/* the tricks teach method: no country or capital named in them */
const names = QUIZ.flatMap((c) => [c.name, ...c.cap]).filter((n) => n.length > 4);
for (const [k, t] of Object.entries(CZ.TRAPS)) {
  const words = `${t.mistake} ${t.rule} ${t.check}`;
  ok(t.label && t.mistake && t.rule && t.check && /^#[0-9A-F]{6}$/i.test(t.col), `${k}: every field`);
  const hit = names.find((n) => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(words));
  ok(!hit, `${k}: names no real place (${hit})`);
}
for (const tip of CZ.TIPS) { const hit = names.find((n) => tip.b.includes(n) || tip.t.includes(n)); ok(!hit, `tip “${tip.t}” names no real place (${hit})`); }

/* the rings: app always, practice only while answering, right answers from the day's own count */
const k = newKid('Asha', '8-10', 'shelly'), d = '2026-10-10';
k.days[d] = { q: 4, ok: 3 };
for (let i = 0; i < 8; i++) CZ.metricTick(k, i < 2, d);
let m = CZ.today(k, d);
ok(m.app === 8 * CZ.TICK && m.prac === 2 * CZ.TICK && m.right === 3, `the clock: app ${m.app}s, practice ${m.prac}s, right ${m.right}`);
ok(m.t.app === CZ.TGT_DEF.app && m.t.prac === CZ.TGT_DEF.prac && m.t.right === CZ.TGT_DEF.right, 'default targets');
k.prefs.tgt = { app: 999, prac: 5, right: 50 }; m = CZ.today(k, d);
ok(m.t.app === CZ.TGT_DEF.app && m.t.prac === 5 && m.t.right === 50, 'a target outside its choices falls back; inside, it holds');
ok(Math.abs(m.pRight - 3 / 50) < 1e-9 && !CZ.allClosed(m), 'a ring is a share of its own target');
ok(/stroke-dasharray/.test(CZ.ringsSVG(100, [0.5, 1.4, 0])) && (CZ.ringsSVG(100, [0.5, 1.4, 0]).match(/stroke-dasharray/g) || []).length === 3, 'past a target, a second lap is drawn (½ + 1 + the lap)');

/* the read follows the deck: empty, then the trap with most misses */
ok(/Nothing is catching you/.test(CZ.readLine(k).line) && !CZ.traps(k).length, 'an empty deck: nothing to say yet');
const r = seeded('coach'), q1 = drill(byId['eight-points'], 2, 3, r), q2 = drill(byId['cap-europe'], 1, 1, r);
q1.forEach((q) => { missAdd(k, q, 'Eight compass points'); missAdd(k, q, 'Eight compass points'); }); q2.forEach((q) => missAdd(k, q, 'Capitals of Europe'));
missAdd(k, { kind: 'mc', text: 'Lib question', ans: 'X', opts: ['X', 'Y'] }, 'Country Capitals');
const g = CZ.traps(k);
ok(g[0].k === 'compass' && g[0].n === 6 && g.find((x) => x.k === 'capitals').n === 2, `the deck, grouped: ${g.map((x) => x.k + ' ' + x.n).join(', ')}`);
ok(/which way\?/i.test(CZ.readLine(k).line), 'Shelly names the biggest trap');
ok(CZ.beatStop(k, 'compass') === 'eight-points' && CZ.beatStop(k, 'flags') === 'flags', 'Beat it opens the stop with most misses, else the trap’s first stop');
ok(CZ.ladder(3).now.n === 3 && CZ.ladder(3).next.n === 4 && CZ.ladder(10).next === null, 'the ladder: right now, and the next road');

if (fails) { console.error(`✗ coach: ${fails} failure(s)`); process.exit(1); }
console.log(`✓ coach: ${Object.keys(CZ.TRAPS).length} traps over ${claims.length} stops, ${CZ.TIPS.length} habits, three rings`);
