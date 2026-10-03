/* demo.js — ?demo: a sample explorer with three weeks of believable progress, so a
   grown-up can look round before making a real one (family standard §14). Built in
   memory each time from a fixed seed; main.js never saves it and family.js writes
   nothing shared while it is open. The banner says "Sample" on every screen. */

import { newHousehold, newKid, road, stopRec, byId } from './model.js';
import { LEVELS } from './levels.js';
import { COUNTRIES } from './geo.js';
import { EXPEDITIONS, daysOf } from './data/expeditions.js';
import { seeded, shuffle } from './rand.js';
import { newMedals } from './rewards.js';

const pad = (n) => String(n).padStart(2, '0');
const dayAgo = (n) => { const d = new Date(Date.now() - n * 864e5); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

export function demoHousehold() {
  const r = seeded('bizzing-demo'), h = newHousehold();
  h.demo = true; h.parent.pinHash = null;
  const k = newKid('Sample', '8-10', 'savannalion');
  k.id = 'kdemo'; k.prefs.theme = 'atlas'; k.medalsQuiet = true;
  /* the levels before this band's start are behind it; three stations into its own road */
  const start = k.road.level;
  for (const L of LEVELS) if (L.n < start) for (const s of L.steps) { const x = stopRec(k, s.stop); x.learned = true; x.stars = Math.max(x.stars, 2 + (r() < 0.4 ? 1 : 0)); x.best = Math.max(x.best, 80); x.runs++; x.lv[s.lv] = true; }
  for (const s of road(k).steps.slice(0, 3)) { const x = stopRec(k, s.stop); x.learned = true; x.stars = 2; x.best = 80; x.runs = 2; x.lv[s.lv] = true; }
  k.road.finished = LEVELS.filter((L) => L.n < start).map((L) => L.n);
  /* three weeks of short days, a few skipped (nothing is lost for a day off) */
  for (let i = 21; i >= 1; i--) { if (r() < 0.3) continue; const q = 8 + Math.floor(r() * 18); k.days[dayAgo(i)] = { q, ok: Math.round(q * (0.65 + r() * 0.3)), s: 1 + Math.floor(r() * 3) }; }
  k.xp = Object.values(k.days).reduce((a, d) => a + d.ok, 0);
  /* capitals: twenty-odd known, a few more on the way */
  const cc = shuffle(COUNTRIES.filter((c) => c.quiz).map((c) => c.cc), r);
  k.lib.capitals = { box: Object.fromEntries(cc.slice(0, 32).map((c, i) => [c, i < 22 ? 2 : 1])) };
  /* one expedition, a week in */
  const e = EXPEDITIONS.find((x) => x.ages[0] <= 8 && x.ages[1] >= 8) || EXPEDITIONS[0];
  const days = daysOf(e).slice(0, 6);
  k.exp[e.id] = { at: dayAgo(9), seen: Object.fromEntries(days.map((d, i) => [d.key, dayAgo(9 - i)])), m: {}, art: {}, work: {} };
  k.last = { k: 'stop', title: byId[road(k).steps[2].stop].title, at: Date.now() - 864e5 };
  /* its medals counted now (quietly — they are not news), so the sample's shelf is not empty */
  newMedals(k); delete k.medalsQuiet;
  h.kids.push(k); h.active = k.id;
  return h;
}
