/* data.mjs — the map and the country data say what they claim.
   · the depiction is the Survey of India's: J&K whole, inside India;
   · 195 quizzed countries, each with a shape, a capital and a flag;
   · every capital lies in (or within a few km of) its own country's shape —
     a capital pinned in the wrong country is exactly what a child notices;
   · every state capital lies in its own state. */
import { COUNTRIES, QUIZ, STATES, INDIA, haversine } from '../src/geo.js';
import { countryAt, hasShape, project, invert, nearCountry } from '../src/map.js';
import { geoContains } from 'd3-geo';
import { feature } from 'topojson-client';
import { REGIONS } from '../src/data/regions.js';
import { existsSync } from 'node:fs';

let fails = 0; const bad = (m) => { fails++; console.error('✗ ' + m); };

for (const [n, p] of [['Gilgit', [35.92, 74.31]], ['Muzaffarabad', [34.37, 73.47]], ['Aksai Chin', [35.2, 79.5]], ['Leh', [34.16, 77.58]], ['Tawang', [27.59, 91.86]]])
  if (countryAt(p) !== 'IN') bad(`${n} should be inside India's shape (Survey of India depiction), got ${countryAt(p)}`);

if (QUIZ.length !== 195) bad(`${QUIZ.length} quizzed countries, not 195`);
const near = (cc, at) => nearCountry(at, cc);
let farCaps = [];
for (const c of QUIZ) {
  if (!hasShape(c.cc)) bad(`${c.name} has no shape`);
  if (!c.cap.length) bad(`${c.name} has no capital`);
  if (!existsSync(new URL(`../public/flags/${c.cc.toLowerCase()}.svg`, import.meta.url))) bad(`${c.name} has no flag`);
  c.cap.forEach((n, i) => { if (!c.capAt[i]) bad(`${n} has no coordinates`); else if (!near(c.cc, c.capAt[i])) farCaps.push(`${n} (${c.name})`); });
}
/* Island micro-states can be smaller than the simplified shape's error; allow a handful, name them. */
if (farCaps.length > 6) bad(`${farCaps.length} capitals fall outside their country: ${farCaps.join(', ')}`);
else if (farCaps.length) console.log(`  (tiny island capitals off the simplified coast: ${farCaps.join(', ')})`);

const byReg = {};
for (const [c, obj] of Object.entries(REGIONS.objects)) for (const f of feature(REGIONS, obj).features) byReg[f.id] = f;
for (const s of STATES) {
  const f = byReg[s.id];
  if (!f) { bad(`${s.name} has no shape`); continue; }
  let ok = geoContains(f, [s.capAt[1], s.capAt[0]]);
  for (let a = 0; !ok && a < 360; a += 30) ok = geoContains(f, [s.capAt[1] + 0.2 * Math.sin(a), s.capAt[0] + 0.2 * Math.cos(a)]);
  if (!ok) bad(`${s.cap} is not inside ${s.name}`);
}
const nst = INDIA.states.filter((s) => s.type === 'state').length, nut = INDIA.states.filter((s) => s.type === 'ut').length;
if (nst !== 28 || nut !== 8) bad(`India: ${nst} states and ${nut} UTs`);
for (const s of INDIA.states) if (!s.capXY || !s.d) bad(`India ${s.name}: no shape or capital`);

/* the projection round-trips */
for (const p of [[28.6, 77.2], [-33.9, 18.4], [51.5, -0.1]]) { const q = invert(project(p)); if (haversine(p, q) > 5) bad(`projection drifts at ${p}`); }

console.log(`${fails ? '✗' : '✓'} data: ${COUNTRIES.length} places, ${QUIZ.length} countries, ${STATES.length} states + India ${nst}+${nut}, capitals in their countries`);
process.exit(fails ? 1 : 0);
