/* family.mjs — the family layer's contracts: the shared wallet, the activity feed,
   rank that moves only on learning, and medals from evidence (FAMILY-STANDARD §1, §6, §8, §13). */
const store = {};
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };

const F = await import('../src/family.js');
const { newKid, scoreRun, stopRec, tick } = await import('../src/model.js');
const { xpFor, bonus, XP_CAP, newMedals, MEDALS, SHOP, SHIP_LOOK, shopOf, shipVars } = await import('../src/rewards.js');
const { road } = await import('../src/model.js');
let fails = 0, n = 0; const ok = (c, m) => { n++; if (!c) { fails++; console.error('✗ ' + m); } };
const W = () => JSON.parse(store['bizzing.wallet'] || '{"kids":{}}');

/* the wallet: standard amounts, a daily cap, fixed prices, append-only */
ok(F.earn('geography', 'Ahana', 'right') === 1 && F.earn('geography', 'Ahana', 'stop') === 5 && F.earn('geography', 'Ahana', 'mastered') === 20 && F.earn('geography', 'Ahana', 'contest') === 10, 'the standard amounts: 1 · 5 · 20 · 10');
ok(F.earn('geography', 'Ahana', 'login') === 0 && F.earn('geography', 'Ahana', 'streak') === 0 && F.earn('geography', 'Ahana', 'time') === 0, 'nothing for logins, streaks or time');
ok(F.balance('ahana') === 36 && W().kids.ahana.ledger.length === 4, 'one wallet per child, keyed by first name in lower case, every coin in the ledger');
let paid = 0; for (let i = 0; i < 40; i++) paid += F.earn('geography', 'Ahana', 'mastered');
ok(F.earnedToday('Ahana') === F.DAILY_CAP && paid === F.DAILY_CAP - 36, `the daily cap holds at ${F.DAILY_CAP} per app`);
ok(F.earn('maths', 'Ahana', 'right') === 1, 'the cap is per app — another app still pays');
const bal = F.balance('Ahana');
ok(!F.spend('geography', 'Ahana', bal + 1, 'extra:pin:gem') && F.balance('Ahana') === bal, 'spending never goes below zero');
ok(F.spend('geography', 'Ahana', 20, 'extra:pin:star') && F.balance('Ahana') === bal - 20 && W().kids.ahana.ledger.at(-1).n === -20, 'a fixed price is charged and written to the ledger');
ok(F.earn('geography', 'Kabir', 'right') === 1 && F.balance('kabir') === 1 && F.balance('Ahana') === bal - 20, 'siblings never share coins');
ok(SHOP.every((x) => Number.isInteger(x.price) && x.price >= 0) && !SHOP.some((x) => /random|mystery|pack|spin|chance/i.test(x.name + x.blurb)), 'the shop: printed prices, nothing random');
/* K6: Trade Winds ship looks — each has its colours, one is free, an old shop record reads as the classic ship,
   and a look never says it changes speed or cargo */
{ const ships = SHOP.filter((x) => x.kind === 'ship'), ids = ships.map((x) => x.id.split(':')[1]);
  const old = { shop: { owned: ['pin:dot', 'frame:plain'], pin: 'dot', frame: 'plain' } };
  ok(ships.length >= 4 && ids.every((i) => SHIP_LOOK[i]) && ships.filter((x) => x.price === 0).length === 1 && shopOf(old).ship === 'classic' && old.shop.owned.includes('ship:classic')
    && !ships.some((x) => /fast|speed|cargo|strong/i.test(x.blurb)) && shipVars({ shop: { ship: 'indigo' } }).includes(SHIP_LOOK.indigo.sail), 'ship looks: priced, one free, a look only, and an old record reads as the classic ship'); }
/* the demo writes nothing shared */
const before = JSON.stringify(store); F.familyOff(true);
ok(F.earn('geography', 'Sample', 'stop') === 0 && !F.spend('geography', 'Ahana', 1, 'x'), 'the demo neither earns nor spends');
F.trackMilestone('geography', 'Sample', 'stop', 'x');
ok(JSON.stringify(store) === before, 'the demo writes nothing to the shared keys'); F.familyOff(false);

/* the activity feed, through the family's vendored tracker: a fake window and clock */
let t = new Date(2026, 9, 2, 16, 5).getTime(), tickFn = null;
const realNow = Date.now, realSI = globalThis.setInterval;
Date.now = () => t; globalThis.window = globalThis; globalThis.addEventListener = () => {}; globalThis.removeEventListener = () => {};
globalThis.document = { visibilityState: 'visible' }; globalThis.setInterval = (fn) => { tickFn = fn; return 1; }; globalThis.clearInterval = () => {};
const A = F.trackActivity('geography', () => 'Ahana');
for (let i = 0; i < 9; i++) { t += 15000; tickFn(); }            // two active minutes (input "now" kept fresh below)
/* the drop-in stamps the day from the same clock it times with (Date.now), so the pinned clock decides it:
   2 Oct 2026, whatever the real date is */
const dayNow = () => '2026-10-02';
const rows0 = JSON.parse(store['bizzing.activity'] || '{"s":[]}').s.filter((x) => x.a === 'geography' && !x.ev);
ok(rows0.length === 1 && rows0[0].m >= 1 && rows0[0].who === 'Ahana' && rows0[0].d === dayNow(), 'an active minute, one sitting: { a, d, t, m, who }');
const m0 = rows0[0].m; t += 10 * 60000; for (let i = 0; i < 8; i++) { t += 15000; tickFn(); }
ok(JSON.parse(store['bizzing.activity']).s.filter((x) => !x.ev).reduce((a, x) => a + x.m, 0) === m0, 'idle minutes are not counted');
A.stop(); Date.now = realNow; globalThis.setInterval = realSI;
F.familyOff(true); const b2 = JSON.stringify(store); const A2 = F.trackActivity('geography', () => 'Sample'); A2.stop();
ok(JSON.stringify(store) === b2, 'the demo starts no tracker'); F.familyOff(false);
F.trackMilestone('geography', 'Ahana', 'band', 'Reached Level 4');
ok(JSON.parse(store['bizzing.activity']).s.some((x) => x.ev === 'band' && x.m === 0 && x.label === 'Reached Level 4'), 'a milestone is a row with m:0, ev and label');

/* L7: stickers between explorers on one device — eight pictures, no words; three a day; never to oneself */
{ const St = await import('../src/stickers.js'), a = { id: 'a', name: 'Ahana' }, b = { id: 'b', name: 'Kabir' }, hh = { kids: [a, b] }, T0 = Date.UTC(2026, 9, 2, 10);
  const r = [St.sendSticker(hh, a, 'b', 'ship', T0), St.sendSticker(hh, a, 'b', 'star', T0), St.sendSticker(hh, a, 'b', 'map', T0), St.sendSticker(hh, a, 'b', 'map', T0), St.sendSticker(hh, a, 'b', 'map', T0 + 864e5), St.sendSticker(hh, a, 'a', 'map', T0), St.sendSticker(hh, a, 'b', 'hello there', T0)];
  ok(r.join() === 'sent,sent,sent,limit,sent,bad,bad' && St.unseen(b).length === 4 && St.STICKERS.length === 8 && b.stk.every((x) => St.byStk[x.s]), 'stickers: a picture from the eight, three a day, never to yourself, never words');
  St.markSeen(b); ok(!St.unseen(b).length && b.stk.length === 4, 'seen stickers are kept'); }

/* rank moves only on learning */
const k = newKid('Ahana', '8-10', 'compowl'), st = road(k).steps[0];
let xp = 0; for (let i = 0; i < 40; i++) xp += xpFor(k, 'plain-src');
ok(xp === XP_CAP, `plain right answers from one source stop paying at ${XP_CAP} a day`);
const r = stopRec(k, st.stop); r.stars = 3; r.lv[st.lv] = true;
ok(xpFor(k, st.stop, { stop: st.stop, lv: st.lv }) === 0, 'a drill on a station already aced pays no XP — easy drills cannot farm rank');
const x0 = k.xp; tick(k, true, 0); ok(k.xp === x0, 'a right answer with no XP due leaves the rank alone');
ok(bonus(k, 'stop') === 5 && bonus(k, 'level') === 20 && k.xp === x0 + 25, 'mastery pays: a station passed, a level');
ok(bonus(k, 'coins') === 0, 'nothing else pays rank');

/* medals: from evidence, once */
const m = newKid('Kabir', '6-7', 'compowl');
ok(newMedals(m).length === 0, 'a new explorer has no medals');
const s0 = road(m).steps[0]; scoreRun(m, s0.stop, s0.lv, 8, 10);
const got = newMedals(m);
ok(got.length === 1 && got[0].id === 'first-station', 'passing a first station earns "First station"');
ok(newMedals(m).length === 0, 'and it is celebrated once');
ok(MEDALS.every((x) => x.how && x.test && !/day(s)? in a row|streak|login/i.test(x.how)), 'every medal says how it is earned, and none is for days in a row');
ok(new Set(MEDALS.map((x) => x.id)).size === MEDALS.length, 'medal ids are unique');
{ const { existsSync } = await import('node:fs'); const miss = MEDALS.filter((x) => !existsSync(new URL(`../public/medals/${x.id}.webp`, import.meta.url)));
  ok(!miss.length, `every medal has its own painting (${miss.map((x) => x.id).join(', ') || 'all ' + MEDALS.length})`); }

if (fails) { console.error(`✗ family: ${fails} of ${n} failed`); process.exit(1); }
console.log(`✓ family: wallet, feed, rank, medals — ${n} checks`);
