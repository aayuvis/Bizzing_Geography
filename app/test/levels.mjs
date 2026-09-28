/* levels.mjs — the ten roads keep their rules. */
import { LEVELS, START } from '../src/levels.js';
import { STOPS, byId } from '../src/stops.js';
import { BANDS } from '../src/model.js';

let fails = 0; const bad = (m) => { fails++; console.error('✗ ' + m); };
const AGE = { '6-7': 6, '8-10': 8, '11-14': 11 };
const last = {};
for (const L of LEVELS) {
  const seen = new Set();
  if (L.steps.length < 8 || L.steps.length > 14) bad(`Level ${L.n} has ${L.steps.length} steps`);
  for (const s of L.steps) {
    const st = byId[s.stop];
    if (!st) { bad(`Level ${L.n}: no stop "${s.stop}"`); continue; }
    if (seen.has(s.stop)) bad(`Level ${L.n}: ${s.stop} twice`);
    seen.add(s.stop);
    if (![1, 2, 3].includes(s.lv)) bad(`Level ${L.n}: ${s.stop} lv ${s.lv}`);
    if (!(s.stop in last) && s.lv !== 1) bad(`Level ${L.n}: ${s.stop} first met at lv ${s.lv}`);
    if (s.stop in last && s.lv < last[s.stop]) bad(`Level ${L.n}: ${s.stop} goes down to lv ${s.lv}`);
    if (L.n + 5 < AGE[st.band]) bad(`Level ${L.n} (age ${L.n + 5}): ${s.stop} is for ${st.band}`);
    last[s.stop] = s.lv;
  }
}
for (const s of STOPS) if (!(s.id in last)) bad(`stop ${s.id} is on no road`);
for (const b of BANDS) if (!LEVELS.find((L) => L.n === START[b.id])) bad(`band ${b.id} starts nowhere`);
console.log(`${fails ? '✗' : '✓'} levels: ${LEVELS.length} roads, ${LEVELS.reduce((a, L) => a + L.steps.length, 0)} steps, every stop placed`);
process.exit(fails ? 1 : 0);
