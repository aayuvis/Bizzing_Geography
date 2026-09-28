/* stops.js — the Atlas: ten worlds, each a chapter file (chapters/*.js), and
   the one runner-facing API every question goes through. */
import * as home from './chapters/home.js';
import * as landwater from './chapters/landwater.js';
import * as continents from './chapters/continents.js';
import * as compass from './chapters/compass.js';
import * as capitals from './chapters/capitals.js';
import * as weather from './chapters/weather.js';
import * as rivers from './chapters/rivers.js';
import * as globe from './chapters/globe.js';
import * as restless from './chapters/restless.js';
import * as people from './chapters/people.js';
import { rnd } from './rand.js';

const CHAPTERS = [home, landwater, continents, compass, capitals, weather, rivers, globe, restless, people];
export const WORLDS = CHAPTERS.map((c) => c.WORLD);
export const STOPS = CHAPTERS.flatMap((c) => c.STOPS.map((s) => ({ ...s, world: c.WORLD.id })));
export const byId = Object.fromEntries(STOPS.map((s) => [s.id, s]));
export const worldOf = (id) => WORLDS.find((w) => w.id === id);
export const stopsIn = (wid) => STOPS.filter((s) => s.world === wid);

/* n different questions from one stop at one level. Different means a
   different question text AND answer — a drill that asks the same thing twice
   in a row is teaching the button, not the idea. */
export function drill(stop, lv, n = 10, r = rnd) {
  const out = [], seen = new Set();
  for (let t = 0; out.length < n && t < n * 30; t++) {
    const q = stop.gen(r, lv);
    const k = q.text + '|' + (q.ans || q.ok.join());
    if (seen.has(k) && t < n * 20) continue;
    seen.add(k); out.push({ ...q, stop: stop.id, lv });
  }
  return out;
}

/* Is this answer right? An option string for 'mc'; a place id for 'map'. */
export function correct(q, a) {
  if (q.kind === 'map') return q.ok.includes(a);
  return String(a) === q.ans;
}
