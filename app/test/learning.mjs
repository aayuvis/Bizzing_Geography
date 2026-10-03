/* learning.mjs — the learning gaps the family audit named, each held to its Done-when:
   F3 a mistakes deck that brings missed items back AFTER A GAP (and a miss drops one step);
   E6 a hint on every question that never gives the answer away;
   C4 one search that finds stops, places, words and tools. */
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const { STOPS, drill, byId } = await import('../src/stops.js');
const { seeded } = await import('../src/rand.js');
const { missAdd, missDue, missRight, missWrong, missCount, keyOf, GAP, MAX } = await import('../src/mistakes.js');
const { hintFor } = await import('../src/hints.js');
const { search, placesReady } = await import('../src/search.js');
const { newKid } = await import('../src/model.js');
const { byCc } = await import('../src/geo.js');

let fails = 0, n = 0; const ok = (c, m) => { n++; if (!c) { fails++; if (fails < 25) console.error('✗ ' + m); } };

/* F3: the deck */
const k = newKid('Ahana', '8-10'), t0 = Date.UTC(2026, 3, 1, 10);
const q = drill(byId['find-continent'], 1, 1, seeded('x'))[0];
missAdd(k, q, 'Find the continents', t0);
ok(missCount(k) === 1 && missDue(k, t0 + 60e3).length === 0, 'a miss is kept, and does NOT come back straight away');
ok(missDue(k, t0 + GAP[0] + 1).length === 1, 'it comes back after the gap (the next day)');
ok(missRight(k, keyOf(q), t0 + GAP[0] + 1) === 'up' && missDue(k, t0 + GAP[0] + 2e3).length === 0, 'right after the gap: up one step, and a longer gap starts');
ok(missWrong(k, keyOf(q), t0 + 2 * GAP[0]) === 'down' && k.miss[keyOf(q)].box === 0, 'a miss in the deck drops ONE step (never hidden, never lost)');
missRight(k, keyOf(q), t0 + 3 * GAP[0]); ok(missRight(k, keyOf(q), t0 + 3 * GAP[0] + GAP[1] + 1) === 'learned' && missCount(k) === 0, 'two steps up after gaps: learned, and it leaves the deck');
const flag = drill(byId.flags, 2, 1, seeded('f'))[0]; missAdd(k, flag, 'Flags', t0);
ok(/<img[^>]+flags\//.test(k.miss[keyOf(flag)].q.html || ''), 'a missed flag keeps its flag picture');
for (let i = 0; i < MAX + 10; i++) missAdd(k, { kind: 'mc', text: 'q' + i, ans: 'a', opts: ['a', 'b'] }, '', t0 + i);
ok(missCount(k) === MAX, `the deck keeps at most ${MAX}`);
ok(!newKid('Kabir', '8-10').miss || !Object.keys(newKid('Kabir', '8-10').miss).length, 'a second child starts with an empty deck');

/* E6: hints never reveal the answer */
let hinted = 0;
for (const s of STOPS) for (const lv of [1, 2, 3]) {
  const r = seeded('hint' + s.id + lv);
  for (const x of drill(s, lv, 10, r)) {
    const h = hintFor(x, s); hinted++;
    ok(h && h.say, `${s.id}: every question has a hint`);
    if (x.kind === 'mc') {
      if (h.kind === 'strike') ok(h.opt !== x.ans && x.opts.includes(h.opt), `${s.id}: the hint takes away a WRONG option (${x.text})`);
      else ok(!['True', 'False'].includes(h.say) && !(x.ans.length > 3 && h.say.toLowerCase().includes(x.ans.toLowerCase())), `${s.id}: a reminder never names the answer (${x.text} → ${h.say})`);
    }
    if (x.kind === 'map' && x.ok.length === 1 && byCc[x.ok[0]]) ok(!h.say.includes(byCc[x.ok[0]].name), `${s.id}: a map hint never names the country (${h.say})`);
    if (x.kind === 'type') ok(!h.say.toLowerCase().includes(x.ans.toLowerCase()), `${s.id}: a typing hint gives a letter, not the word`);
    if (x.kind === 'order') ok(h.first === x.ans.split('|')[0] && h.say.split('|').length === 1, `${s.id}: an order hint places one, not all`);
  }
}

/* C4: one search finds three known things of different kinds */
const has = (qq, kind, t) => search(qq).some((x) => x.kind === kind && x.t === t);
ok(has('compass', 'Stop', 'Eight compass points'), 'search finds a stop ("compass" → Eight compass points)');
ok(has('canberra', 'Country', 'Australia'), 'search finds a country by its capital ("canberra" → Australia)');
ok(has('delta', 'Word', 'delta'), 'search finds a dictionary word ("delta")');
ok(search('taj').some((x) => x.kind === 'Landmark'), 'search finds a landmark ("taj")');
ok(search('where on').some((x) => x.kind === 'Library'), 'search finds a Library tool');
/* the user's ask: US state capitals, US cities and US landmarks are all findable — every one, not a sample */
{
  const { STATES } = await import('../src/data/states.js');
  const { LANDMARKS } = await import('../src/data/landmarks.js');
  const US = STATES.filter((x) => x.c === 'US');
  ok(US.every((x) => search(x.name).some((r) => r.kind === 'US state' && r.t === x.name)), 'every US state is found by its name');
  ok(US.filter((x) => x.id !== 'US-DC').every((x) => search(x.cap).some((r) => r.kind === 'State capital' && r.t === x.cap)), 'every US state capital is found by its name (Sacramento, Austin…)');
  ok(search('sacramento')[0].sub.includes('California'), '"sacramento" says whose capital it is');
  const usl = LANDMARKS.filter((l) => l.cc === 'US' || l.also === 'US');
  ok(usl.length >= 20 && usl.every((l) => search(l.name).some((r) => r.kind === 'Landmark' && r.t === l.name)), `every US landmark is found (${usl.length})`);
  globalThis.window = globalThis.window || new EventTarget();
  await placesReady();
  const { PLACES } = await import('../src/data/places.js');
  const cities = PLACES.filter((p) => p.cc === 'US' && p.big);
  ok(cities.length >= 25 && cities.every((p) => search(p.n.replace(/,\s+/g, ', ')).some((r) => (r.kind === 'City' || r.kind === 'State capital' || r.kind === 'Country') && (r.t === p.n.replace(/,\s+/g, ', ') || r.kind === 'Country'))), `every major US city is found (${cities.length})`);
  ok(search('houston').some((r) => r.kind === 'City' && r.sub === 'United States'), '"houston" finds the city and its country');
}
ok(search('x').length === 0, 'one letter searches nothing (no wall of results)');

if (fails) { console.error(`✗ learning: ${fails} of ${n} failed`); process.exit(1); }
console.log(`✓ learning: mistakes deck after a gap, ${hinted} hints that never give the answer, one search — ${n} checks`);
