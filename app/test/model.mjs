/* model.mjs — the rules about progress and the household. */
import { reviewDue, newHousehold, newKid, scoreRun, road, stopOpen, lvFor, passLevel, rankOf, tick, stopRec, RANKS } from '../src/model.js';
import { LEVELS, START, firstLevel } from '../src/levels.js';
import { byId } from '../src/stops.js';
import { migrate, SCHEMA } from '../src/store.js';
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.error('✗ ' + m); } };

const h = newHousehold(), a = newKid('Ahana', '8-10', 'panda'), b = newKid('Kabir', '6-7', 'pengu');
h.kids.push(a, b); h.active = a.id;
ok(a.road.level === START['8-10'] && b.road.level === 1, 'each band starts on its own level');
const L = LEVELS.find((x) => x.n === a.road.level), first = L.steps[0];
/* the road leads from world to world in order; inside a world the child has reached, any of the level's stops opens (D9) */
const second = L.steps[1], wOf = (st) => byId[st.stop].world;
const otherW = L.steps.find((s) => wOf(s) !== wOf(first) && firstLevel(s.stop) === L.n), sameW = L.steps.find((s) => s !== first && wOf(s) === wOf(first));
ok(stopOpen(h, a, first.stop) && otherW && !stopOpen(h, a, otherW.stop), 'a level is walked in order from world to world: the next world waits');
if (sameW) ok(stopOpen(h, a, sameW.stop), 'inside a reached world, any of the level’s stops is open, in any order');
else ok(L.steps.length > 0, 'a level');
ok(stopOpen(h, a, LEVELS[0].steps[0].stop), 'earlier levels are all open');
ok(!stopOpen(h, a, LEVELS[9].steps.find((s) => !LEVELS.slice(0, 9).some((l) => l.steps.some((x) => x.stop === s.stop))) ? LEVELS[9].steps[0].stop : 'plates'), 'later levels are closed');
let r = scoreRun(a, first.stop, first.lv, 6, 10);
ok(!r.passed && !road(a).steps[0].done, 'six of ten does not pass a station');
r = scoreRun(a, first.stop, first.lv, 7, 10);
ok(r.passed && r.stars === 2 && road(a).steps[0].done, 'seven of ten passes with two stars');
ok(stopOpen(h, a, second.stop), 'passing station 1 opens station 2');
r = scoreRun(a, first.stop, first.lv, 5, 10);
ok(stopRec(a, first.stop).stars === 2, 'a worse run never takes a star away');
ok(!b.stops[first.stop], 'a second child never inherits the first one’s stars');
h.parent.tester = true; ok(stopOpen(h, b, 'plates'), 'tester mode opens everything'); h.parent.tester = false;
ok(!b.stops.plates, 'tester mode changes nothing about the child');
ok(lvFor(a, first.stop) >= first.lv, 'a stop is practised at its road level');
const before = a.road.level; passLevel(a); ok(a.road.level === before + 1 && a.road.finished.includes(before), 'a level check moves the road up one');
tick(a, false); ok(a.xp === 0, 'a wrong answer earns nothing'); tick(a, true, 2); ok(a.xp === 2, 'right answers earn xp');
ok(rankOf(0).n === RANKS[0].n && rankOf(RANKS[3].xp).i === 3, 'ranks follow xp');
ok(migrate({ kids: [] }).v === SCHEMA, 'an unversioned household migrates');
ok(migrate({ v: SCHEMA + 5, kids: [] }).v === SCHEMA + 5, 'a newer household is never downgraded');
{ const m = migrate({ v: 6, kids: [{ avatar: 'backpackbear', owned: ['dolphin'] }, { avatar: 'compowl', owned: [] }] }); ok(m.v === 7 && m.kids[0].avatar === 'shelly' && m.kids[0].owned.join() === 'dolphin' && m.kids[1].avatar === 'compowl', 'v7: a child who wore Backpack Bear now wears Shelly, the free mascot; nothing bought is touched'); }
/* E9: mastery is re-checked — weeks later a stop is due for review; a miss then drops ONE star and says so */
{ const c = newKid('Rev', '8-10', 'compowl'), st = road(c).steps[0], t0 = Date.UTC(2026, 0, 1);
  scoreRun(c, st.stop, st.lv, 10, 10, t0); const rr = stopRec(c, st.stop);
  ok(rr.stars === 3 && !reviewDue(rr, t0 + 5 * 864e5), 'a fresh pass is not due for review');
  ok(reviewDue(rr, t0 + 40 * 864e5), 'six weeks on, it is due for review');
  const slip = scoreRun(c, st.stop, st.lv, 4, 10, t0 + 40 * 864e5);
  ok(slip.slipped && rr.stars === 2, 'a miss while due drops one star, and is reported (slipped)');
  const back = scoreRun(c, st.stop, st.lv, 9, 10, t0 + 41 * 864e5);
  ok(back.stars === 3 && !reviewDue(rr, t0 + 42 * 864e5), 'a pass brings it back and resets the clock');
  ok(scoreRun(newKid('N', '8-10'), st.stop, st.lv, 0, 10).stars === 0, 'no star for nothing right — reading earns no star'); }
console.log(`${fails ? '✗' : '✓'} model: household, road, stars, levels, ranks, store`);
process.exit(fails ? 1 : 0);
