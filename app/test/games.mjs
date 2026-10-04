/* games.mjs — Shelly's Trade Winds' world, proved: every start can light every port, and
   every sea lane stays on the sea (off the land the map draws) except where it enters a port,
   a strait or a canal. Then the chart's SVG ships draw for every era. */
import { PORTS, HOMES, newGame, autoplay, plan } from '../src/games/tw-engine.js';
import { STRAITS, CANALS } from '../src/games/tw-data.js';
import { LANES } from '../src/data/sealanes.js';
import { countryAt } from '../src/map.js';
import { haversine } from '../src/geo.js';
let fails = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { fails++; if (fails < 30) console.error('  ✗ ' + m); } };

/* every start is winnable, in a sensible number of months */
for (const h of HOMES) {
  const S = newGame(h.id, 'test-' + h.id); autoplay(S, 200);
  ok(S.won && S.ports.every((p) => p.awake), `from ${PORTS[S.home].n}: every port can be lit (${S.turn} months)`);
  ok(S.turn >= 12 && S.turn <= 60, `from ${PORTS[S.home].n}: a game of 1–5 years, not a slog (${S.turn} months)`);
  ok(S.era === 3, `from ${PORTS[S.home].n}: all four ages are reached`);
}
/* every port can be reached from every home, in the age of sail */
for (const h of HOMES) { const S = newGame(h.id, 'r'); S.month = 6; ok(PORTS.every((P) => P.i === S.home || plan(S, S.home, P.i)), `every port is reachable from ${PORTS[S.home].n} in summer (in winter the far north is iced in)`); }

/* lanes keep to the sea */
const gates = [...STRAITS.flatMap((s) => s.line || [s.at]), ...Object.values(CANALS).flatMap((c) => c.line || [c.at])].filter(Boolean);
const nearGate = (p, km) => gates.some((g) => haversine(p, g) < km);
let pts = 0, onLand = 0;
for (const L of LANES) for (const path of L.p) if (path) {
  const ends = [PORTS[L.a].at, PORTS[L.b].at];
  for (let i = 1; i + 1 < path.length; i++) {
    const p = path[i]; pts++;
    if (countryAt(p) && !ends.some((e) => haversine(p, e) < 160) && !nearGate(p, 160)) { onLand++; if (onLand < 6) console.error(`    lane ${PORTS[L.a].n}–${PORTS[L.b].n} crosses land at ${p}`); }
  }
}
ok(pts > 1000, `lanes have points to check (${pts})`);
ok(onLand === 0, `no lane crosses land away from a port, strait or canal (${onLand} of ${pts} points)`);
ok(LANES.every((L) => (!L.km[0] || L.km[0] >= L.km[1]) && (!L.km[1] || L.km[1] >= L.km[2])), 'a canal never makes a voyage longer');
const lm = LANES.find((L) => [PORTS[L.a].n, PORTS[L.b].n].sort().join() === 'London,Mumbai');
ok(!lm || lm.km[1] < lm.km[0] * 0.7, 'Suez shortens London–Mumbai');

/* ---------------------------------------------------------------- Geo Bee (F6)
   The ten rivals are Bizzing Maths' ten — nothing is invented twice. Read the Maths file itself
   (a sibling checkout; BIZZING_MATHS overrides) and hold every field but `spec` to it. */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as GB from '../src/games/geobee-engine.js';
import * as geobee from '../src/games/geobee.js';
import * as flagsprint from '../src/games/flagsprint.js';
import * as K from '../src/games/kit.js';
import { QUIZ } from '../src/geo.js';
import { dayKey } from '../src/rand.js';
{
  const here = dirname(fileURLToPath(import.meta.url));
  const tries = [process.env.BIZZING_MATHS, resolve(here, '../../../Bizzing-Maths'), resolve(here, '../../../../../../Bizzing-Maths'), '/home/user/Bizzing-Maths']
    .filter(Boolean).map((p) => resolve(p, 'app/src/contest.js'));
  const file = tries.find((p) => existsSync(p));
  if (!file) console.log('  · Bizzing Maths is not checked out beside this repo — the rivals were not compared (set BIZZING_MATHS)');
  else {
    const src = readFileSync(file, 'utf8'), lit = src.slice(src.indexOf('[', src.indexOf('export const RIVALS')), src.indexOf('];', src.indexOf('export const RIVALS')) + 1);
    const MATHS = new Function(`return ${lit}`)();
    ok(MATHS.length === 10 && GB.RIVALS.length === 10, `ten rivals in each (${MATHS.length}, ${GB.RIVALS.length})`);
    ok(MATHS.map((b) => b.name).join() === GB.RIVALS.map((b) => b.name).join(), `the same ten names, in the same order: ${GB.RIVALS.map((b) => b.name).join(', ')}`);
    for (const m of MATHS) {
      const g = GB.RIVALS.find((b) => b.name === m.name) || {};
      for (const f of ['id', 'age', 'lvl', 'nerve', 'pace', 'note', 'tell']) ok(g[f] === m[f], `${m.name}: ${f} is the Maths file's (${JSON.stringify(g[f])} vs ${JSON.stringify(m[f])})`);
    }
    ok(GB.SUDDEN_AT === Number((src.match(/SUDDEN_AT = (\d+)/) || [])[1]), 'sudden death starts in the same round as Maths');
  }
  /* the Bee's rules, each seen to happen */
  let replayed = 0, champs = 0, ended = 0, youWon = 0;
  for (let i = 0; i < 300; i++) {
    const c = GB.newContest(['6-7', '8-10', '11-14'][i % 3], 'rules' + i); let g = 0, rr = i * 7 + 1; const rnd = () => ((rr = (rr * 48271) % 2147483647) / 2147483647);
    while (!c.over && g++ < 400) {
      if (c.champ) { GB.championship(c, rnd() < 0.5); continue; }
      const you = c.field.find((f) => f.you), e = GB.playRound(c, you.out ? null : rnd() < 0.85);
      if (/played again/.test(e.note || '')) { replayed++; if (e.out.length) ok(false, 'a round everybody missed sat somebody down'); }
      if (e.champ) champs++;
      if (e.round === 1 && e.out.length) ok(false, 'somebody sat down in round one');
    }
    if (!c.over) GB.runOut(c);
    if (c.over && c.winner && c.field.filter((f) => f.place === 1).length === 1) ended++;
    if (c.winner === 'you') youWon++;
  }
  ok(ended === 300, `300 Bees, every one ends with one winner (${ended})`);
  ok(replayed > 0 && champs > 0, `a round everybody misses is played again (${replayed}×); championship rules happen (${champs}×)`);
  ok(youWon > 0 && youWon < 300, `the child can win and can lose (${youWon} of 300 won)`);
  /* questions: one right answer, never in the words — every rung of the ladder, many times */
  let asked = 0, leak = 0, typed = 0;
  for (const band of ['6-7', '8-10', '11-14']) for (let i = 0; i < 40; i++) {
    const c = GB.newContest(band, `q${band}${i}`);
    for (let k = 0; k < 18 && !c.over; k++) { const q = GB.childQuestion(c); asked++; if (q.kind === 'type') typed++; const l = GB.leaks(q); if (l) { leak++; if (leak < 4) console.error(`    ${band}: ${l} — ${q.text} → ${q.ans}`); } c.round++; }
  }
  ok(asked > 1500 && leak === 0, `${asked} Bee questions: one right answer, not in the words (${leak} leaks)`);
  ok(typed > 30, `some questions are typed, where a name is natural (${typed})`);
  ok(GB.leaks({ kind: 'mc', text: 'What is the capital of Sweden? Stockholm?', ans: 'Stockholm', opts: ['Oslo', 'Stockholm', 'Riga', 'Bern'] }) !== '', 'the leak rule catches an answer in the words');
  /* month seeding */
  const a = GB.newContest('8-10', GB.monthSeed('8-10', new Date(2026, 9, 1))), b = GB.newContest('8-10', GB.monthSeed('8-10', new Date(2026, 9, 31)));
  const c2 = GB.newContest('8-10', GB.monthSeed('8-10', new Date(2026, 10, 1)));
  const first = (c) => [0, 1, 2].map(() => { const q = GB.childQuestion(c); GB.playRound(c, true); return q.text + '→' + q.ans; }).join(' | ');
  const fa = first(a), fb = first(b), fc = first(c2);
  ok(fa === fb, 'the 1st and the 31st of October ask the same first three questions');
  ok(fa !== fc, 'November asks different ones');
}

/* ---------------------------------------------------------------- Flag Sprint (F2) */
{
  const Q = new Set(QUIZ.map((c) => c.cc));
  for (let i = 0; i < 30; i++) {
    const run = flagsprint.makeRun('g' + i, ['6-7', '8-10', '11-14'][i % 3]);
    ok(new Set(run.map((x) => x.cc)).size === run.length && run.length >= 40, `run ${i}: ${run.length} flags, none twice`);
    ok(run.every((x) => Q.has(x.cc) && x.opts.every((o) => Q.has(o))), `run ${i}: only the 195, asked or offered`);
    ok(run.every((x) => new Set(x.opts).size === 4 && x.opts.includes(x.cc)), `run ${i}: four distinct names, the right one among them`);
  }
  ok(!flagsprint.POOL.some((c) => ['GL', 'TW', 'EH', 'AQ', 'HK', 'PR'].includes(c.cc)), 'Greenland, Taiwan, Western Sahara, Antarctica, Hong Kong, Puerto Rico are never asked as countries');
}

/* ---------------------------------------------------------------- Today's round (G9) */
{
  const d1 = new Date(2026, 9, 4, 8), d1b = new Date(2026, 9, 4, 22), d2 = new Date(2026, 9, 5, 8);
  ok(K.todaySeed('chain', d1) === K.todaySeed('chain', d1b), 'the same day gives the same seed, morning or night');
  ok(K.todaySeed('chain', d1) !== K.todaySeed('chain', d2), 'the next day gives a different seed');
  ok(K.todaySeed('chain', d1) !== K.todaySeed('shape', d1), 'two games on one day are two puzzles');
  const seen = new Set(); for (let i = 0; i < 400; i++) seen.add(K.todaySeed('bigger', new Date(2026, 0, 1 + i)));
  ok(seen.size === 400, `400 days, 400 different seeds (${seen.size})`);
  /* every puzzle game: today's round on two "devices" (two fresh contexts) is the same puzzle */
  const { allTools } = await import('../src/library/index.js');
  const tools = Object.fromEntries((await allTools()).map((t) => [t.TOOL.id, t]));
  const mk = () => ({ band: '11-14', kid: { band: '11-14', lib: {} }, ui: {}, data: {}, save() {}, render() {}, toast() {}, sfx: { good() {}, bad() {}, click() {}, level() {} }, confetti() {}, say() {}, tick() {} });
  for (const id of ['chain', 'compass', 'bigger', 'shape', 'sunclock', 'flagsprint']) {
    const t = tools[id], a = mk(), b = mk();
    ok(K.todayStart(id, a.data)[0] === `${id}|daily` && /Today’s round/.test(t.view(a)), `${id}: the title card has a “Today’s round” button`);
    t.act('daily', '', a); t.act('daily', '', b);
    const strip = (g) => JSON.stringify(g, (k, v) => (k === 't0' ? undefined : v));
    ok(a.ui.g && strip(a.ui.g) === strip(b.ui.g), `${id}: today's round is the same puzzle on two devices`);
    if (a.ui.g && a.ui.g.daily !== true) ok(false, `${id}: today's round is marked as today's`);
  }
  const d = {}; K.keepToday(d, 4); K.keepToday(d, 9);
  ok(d.daily[dayKey()] === 4, 'today’s result is the first one; a replay is practice');
  for (let i = 1; i <= 60; i++) d.daily[`2020-01-${String(i).padStart(2, '0')}`] = 1;
  K.keepToday(d, 1); ok(Object.keys(d.daily).length <= 31 && d.daily[dayKey()] === 4, 'only a month of days is kept — and no run of days is counted anywhere');
  ok(!/streak/i.test(readFileSync(new URL('../src/games/kit.js', import.meta.url), 'utf8').replace(/no streaks/gi, '')), 'the daily helper counts no streak');
}
void geobee;

/* ---------------------------------------------------------------- Shelly's Trade Winds: The Long Voyage */
{
  const V = await import('../src/games/tw-voyage.js'), T = await import('../src/games/tw-story.js');
  /* a whole career, sailed by the test captain: every port lit, every invention, ten ships */
  for (const seed of ['lv-a', 'lv-b', 'lv-c']) {
    const S = V.autoplay(V.newGame(seed), 900), p = V.progress(S);
    ok(p.lit === 60 && p.inv === p.invAll && p.ships === 10, `Long Voyage ${seed}: a career lights all sixty, fits every invention and builds ten ships (${p.lit} · ${p.inv}/${p.invAll} · ${p.ships} ships · ${S.turn} months)`);
    ok(S.year >= 1914 && S.era === 3, `${seed}: the calendar reaches the age of Panama (${S.year})`);
    ok(S.ships.every((sh) => sh.hull > 0), `${seed}: no ship is ever lost — the crew always comes home`);
  }
  /* the same seed is the same voyage */
  const a = V.autoplay(V.newGame('same'), 120), b = V.autoplay(V.newGame('same'), 120);
  ok(JSON.stringify(a) === JSON.stringify(b), 'the same seed sails the same voyage (seeded, never a dice roll for a reward)');
  /* the start is the story's */
  const S0 = V.newGame('start');
  ok(S0.ships[0].name === 'Small Hope' && V.capacity(S0, S0.ships[0]) === 8 && S0.crew.pereira === 'aboard' && S0.crew.tavi === 'aboard' && V.litCount(S0) === 1 && S0.beats.start === 0, 'Mumbai, 1800: the Small Hope (eight crates), Pereira, Tavi, one lamp lit');
  /* lighting: a dark port is lit by what its climate cannot grow, not by its own cargo */
  { const S = V.newGame('light'), K = V.PORTS.findIndex((x) => x.n === 'Karachi');
    V.buy(S, 1, 99); S.ships[0].at = K; V.sell(S, 1, 'fruit');
    ok(S.ports[K].lit && S.gifts.tidesense != null && S.crew.farida === 'aboard', 'fruit sold in Karachi lights it; the first light wakes Tidesense; Farida comes aboard');
    const own = V.newGame('own'), sub = V.PORTS.findIndex((x) => x.band === 'sub' && x.n !== 'Karachi'); own.ships[0].hold = [{ g: V.PORTS[sub].good, n: 4, from: 0, clean: true }]; own.ships[0].at = sub; V.sell(own, 1, V.PORTS[sub].good);
    ok(!own.ports[sub].lit, 'a port is never lit by the cargo it grows itself'); }
  /* the market: supply and demand */
  { const S = V.newGame('mkt'), K = V.PORTS.findIndex((x) => x.n === 'Karachi'); S.ports[K].lit = true; const p0 = V.sellPrice(S, K, 'fruit'); S.ports[K].glut.fruit = 120;
    ok(V.sellPrice(S, K, 'fruit') < p0, 'a port that has had a lot of one cargo pays less for it'); }
  /* dangers: the clock stops, every choice is costed, a strong enough ship meets it well */
  { const S = V.newGame('d'); S.ships[0].voyage = { from: 0, to: 5, path: [[0, 0]], months: 3, left: 3, elapsed: 0, km: 1, pass: [], ev: [{ k: 'pirates', at: 1 }], met: [], gun: false };
    S.ships[0].at = null; V.nextMonth(S);
    ok(S.pending.length === 1 && V.nextMonth(S).error, 'a danger stops the clock: no next month until it is met');
    const c = V.dangerCard(S); ok(c.choices.length >= 3 && c.choices.every((x) => x.cost), 'every danger card shows its choices and what each costs');
    ok(!/sink|kill|destroy/i.test(JSON.stringify(c)) && /never sunk/.test(c.text), 'pirates are a danger, never an enemy you sink');
    V.resolve(S, 'parley'); ok(!S.pending.length, 'a choice meets the danger and the clock runs again'); }
  { const S = V.newGame('tow'), sh = S.ships[0]; sh.voyage = { from: 0, to: 9, path: [[10, 60], [0, 50]], months: 2, left: 2, elapsed: 1, km: 1, pass: [], ev: [], met: [], gun: false }; sh.at = null; sh.hull = 1;
    S.pending.push({ k: 'cyclone', at: 0, ship: 1 }); V.resolve(S, 'sail');
    ok(sh.voyage == null && V.isYard(sh.at) && sh.hull > 0, 'a wrecked hull is towed to a yard: the crew always comes home'); }
  /* war: the strait is closed to the planner; Truthlight's true letter ends it */
  { const S = V.newGame('war'); for (const p of S.ports) p.lit = true; S.war = { n: 1, strait: 'babelmandeb', at: [12.6, 43.3], until: 99 }; S.era = 0;
    const A = V.PORTS.findIndex((x) => x.n === 'Aden'), J = V.PORTS.findIndex((x) => x.n === 'Jeddah');
    const p = V.planFor(S, 1, A, J); ok(!p || !p.pass.includes('babelmandeb'), 'a war closes its strait to every voyage');
    S.beats.master = 1; ok(!V.board(S, A).some((j) => j.kind === 'peace'), 'no peace without Truthlight’s evidence');
    S.gifts.truthlight = 1; ok(V.board(S, A).some((j) => j.kind === 'peace'), 'with Truthlight, the true letter is on the board at Aden'); }
  /* expeditions are counted only for a Captain, and seal on their own goal */
  { const S = V.newGame('ex'); for (const p of S.ports) p.lit = false; for (const i of V.PACIFIC_ISLANDS) S.ports[i].lit = true; V.checkExpeditions(S);
    ok(!S.ex.lanterns, 'expeditions wait for a Captain');
    S.xp = 2000; S.ships.push({ ...S.ships[0], id: 2, name: 'Wakeful', hold: [], jobs: [], ups: [] }); V.checkExpeditions(S);
    ok(S.ex.lanterns != null && V.PACIFIC_ISLANDS.length >= 4, `the Pacific Lanterns seal when every island port (${V.PACIFIC_ISLANDS.map((i) => V.PORTS[i].n).join(', ')}) is lit`); }
  /* the tables keep their promises */
  ok(T.EARNED.every((e) => !T.INVENTIONS.some((u) => u.id === e.id)) && T.INVENTIONS.every((u) => u.price > 0), 'nothing earned is ever for sale');
  ok(T.EXPEDITIONS.length === 10 && T.GIFTS.length === 6 && T.RANKS.at(-1).ships === 10, 'ten expeditions, six gifts, and the last rank is ten ships');
  ok(Object.values(T.CREW).every((c) => c.glyph && !/<img/.test(c.glyph)), 'the crew are names and roles, never drawn');
}

console.log(`${fails ? '✗' : '✓'} games: ${n} checks${fails ? `, ${fails} failures` : ''}`);
process.exit(fails ? 1 : 0);
