/* Compass Tower — eight points, grid squares, scale and direction across the
   world. Ages 8–10. */
import { mc, bank, mix, FAMOUS } from './kit.js';
import { int, pick, shuffle } from '../rand.js';
import { gridMap, SYMBOLS, rose, scaleBar } from '../figs.js';
import { directions } from './home.js';
import { QUIZ, byCc, haversine, POINTS8 } from '../geo.js';

export const WORLD = { id: 'compass', name: 'Compass Tower', short: 'Compass', glyph: '🧭', band: '8-10', ink: '#8A4B12', tint: '#F8EBDD',
  blurb: 'Eight compass points, grid references, map scale, and which way one country is from another.' };

const GRID_SYMS = ['lake', 'station', 'camp', 'hill', 'tree', 'bridge', 'school', 'park', 'lighthouse'];
const ref = (c, r) => 'ABCDE'[c] + (r + 1);
function gridRef(r, lv) {
  const n = lv === 1 ? 3 : 5;
  const syms = shuffle(GRID_SYMS, r).slice(0, n);
  const cells = shuffle(Array.from({ length: 20 }, (_, i) => [i % 5, Math.floor(i / 5)]), r).slice(0, n);
  const items = syms.map((sym, i) => ({ sym, c: cells[i][0], r: cells[i][1] }));
  const it = pick(items, r), name = SYMBOLS[it.sym].name;
  const all = [];
  for (let c = 0; c < 5; c++) for (let rr = 0; rr < 4; rr++) all.push(ref(c, rr));
  const near = all.filter((x) => x !== ref(it.c, it.r) && (x[0] === ref(it.c, it.r)[0] || x[1] === ref(it.c, it.r)[1] || x === ref(it.r < 5 ? it.r : 0, it.c < 4 ? it.c : 0)));
  if (r() < 0.5 || lv === 1) {
    return mc(r, `Which square is the ${name} in?`, ref(it.c, it.r), near.length >= 3 ? near : all,
      'Read along the bottom for the letter first, then up the side for the number — “along the corridor, then up the stairs”.', gridMap(items));
  }
  return mc(r, `What is in square ${ref(it.c, it.r)}?`, name, GRID_SYMS.map((s) => SYMBOLS[s].name),
    'Find the letter along the bottom, then go up to the number.', gridMap(items));
}

const KM = [1, 2, 5, 10, 25, 50, 100];
function scale(r, lv) {
  if (lv >= 3 && r() < 0.5) {
    const S = pick([10000, 25000, 50000, 100000, 250000], r), cm = int(2, 8, r);
    const km = (S * cm) / 100000;
    const f = (x) => (Number.isInteger(x) ? x : x.toFixed(1)) + ' km';
    return mc(r, `A map has the scale 1 : ${S.toLocaleString('en-US')}. Two places are ${cm} cm apart on it. How far apart are they really?`,
      f(km), [f(km * 10), f(km / 10), f(km * 2), f(km + 1), f(km / 2)],
      `1 cm on the map is ${S.toLocaleString('en-US')} cm on the ground — that is ${(S / 100000).toString()} km. So ${cm} cm is ${cm} × ${S / 100000} = ${f(km)}.`);
  }
  const k = pick(lv === 1 ? KM.slice(0, 3) : KM, r), cm = int(2, lv === 1 ? 5 : 9, r);
  return mc(r, `On this map, 1 cm stands for ${k} km. Two towns are ${cm} cm apart on the map. How far apart are they really?`,
    `${k * cm} km`, [`${k * (cm + 1)} km`, `${k * (cm - 1)} km`, `${k + cm} km`, `${cm} km`, `${k * cm * 10} km`],
    `Every centimetre is ${k} km, so ${cm} cm is ${cm} × ${k} = ${k * cm} km.`, scaleBar(k));
}

/* Which way is one country from another, on the map? Measured from the
   countries' own centres in the data. Only asked when the answer is clear —
   within 15° of one of the eight points, and no further than 3,000 km, so a
   child is never marked wrong for a direction that is really in between. */
function mapDir(a, b) {
  let dx = b.at[1] - a.at[1]; if (dx > 180) dx -= 360; if (dx < -180) dx += 360;
  const dy = b.at[0] - a.at[0];
  const deg = ((Math.atan2(dx * Math.cos(((a.at[0] + b.at[0]) / 2) * Math.PI / 180), dy) * 180) / Math.PI + 360) % 360;
  return deg;
}
export function worldWay(r, lv) {
  for (let t = 0; t < 200; t++) {
    const a = pick(QUIZ.filter((c) => c.at && (lv >= 3 || FAMOUS.has(c.cc))), r);
    const pool = (lv >= 2 ? QUIZ : a.borders.map((x) => byCc[x]).filter(Boolean)).filter((b) => b && b.at && b !== a && (lv >= 3 || FAMOUS.has(b.cc)));
    if (!pool.length) continue;
    const b = pick(pool, r);
    if (/north|south|east|west/i.test(a.name + b.name)) continue;   // North Korea gives its own direction away
    const d = haversine(a.at, b.at); if (d > 3000 || d < 300) continue;
    const deg = mapDir(a, b), k = Math.round(deg / 45) % 8, off = Math.abs(deg - k * 45) % 360;
    if (Math.min(off, 360 - off) > 15) continue;
    return mc(r, `On a world map, which way is ${b.name} from ${a.name}?`, POINTS8[k], POINTS8,
      `From the middle of ${a.name}, the middle of ${b.name} is to the ${POINTS8[k]}.`);
  }
  return mc(r, 'Which way is India from China?', 'south-west', POINTS8, 'India is below China on the map, and a little to the left.');
}

export const STOPS = [
  { id: 'eight-points', title: 'Eight compass points', glyph: '✳️', band: '8-10',
    hook: 'Halfway between north and east is north-east. Sailors used 32 points; eight will take you almost anywhere.',
    idea: ['Between the four main points are four more: <b>north-east</b>, <b>south-east</b>, <b>south-west</b> and <b>north-west</b>.', 'We always say north or south <b>first</b>: north-east, never east-north.', `<span class="fig-c">${rose(8, 170)}</span>`],
    why: 'Eight points are enough to give directions across a town, a country or an ocean.',
    gen: (r, lv) => directions(r, lv, true) },
  { id: 'grid-refs', title: 'Grid squares', glyph: '#️⃣', band: '8-10',
    hook: '“Meet me at C3.” On a map with a grid, those two characters are enough to find each other.',
    idea: ['Many maps have a <b>grid</b>: letters along the bottom and numbers up the side.', 'To give a square, read <b>along</b> first, then <b>up</b>: “along the corridor, then up the stairs”.', 'Big maps use the same idea with numbers both ways — a <b>grid reference</b>.'],
    why: 'A grid turns “somewhere near the top” into one exact square.',
    gen: gridRef },
  { id: 'map-scale', title: 'Map scale', glyph: '📏', band: '8-10',
    hook: 'A map of your whole country fits on a page. The trick is that every centimetre stands for many kilometres.',
    idea: ['A <b>scale</b> tells you how much smaller the map is than the real place.', 'A <b>scale bar</b> says “this much on the map is this far on the ground”. Measure on the map, then multiply.', 'A scale written <b>1 : 50,000</b> means 1 cm on the map is 50,000 cm on the ground — half a kilometre.'],
    why: 'With a scale, a map becomes a ruler for the whole world.',
    gen: scale },
  { id: 'world-way', title: 'Which way across the world?', glyph: '↗️', band: '8-10',
    hook: 'From India, Nepal is to the north. From Nepal, India is to the south.',
    idea: ['Compass points work between countries, too. Picture a map with north at the top and ask: is it up, down, left or right — or in between?', 'On a flat map, “which way” is only simple for places that are fairly near each other. For places across the world, a globe tells a different story — you will meet that at the Lighthouse.'],
    why: 'It is how travellers, pilots and sailors have always thought about the world.',
    gen: worldWay },
];
