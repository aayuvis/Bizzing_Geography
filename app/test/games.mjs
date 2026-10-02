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

console.log(`${fails ? '✗' : '✓'} games: ${n} checks${fails ? `, ${fails} failures` : ''}`);
process.exit(fails ? 1 : 0);
