/* The Explorer's Library — eight tools, one file each (docs/LIBRARY-CONTRACT.md).
   Six load with the app; Where on Earth? and Earth Through Time carry most of the
   app's data, so they load when first opened (and quietly once the app is idle,
   so they still work offline). toolById holds whatever has loaded. */
import * as capitals from './capitals.js';
import * as states from './states.js';
import * as landmarks from './landmarks.js';
import * as flags from './flags.js';
import * as explorer from './explorer.js';
import * as dictionary from './dictionary.js';
import { TIME } from './meta.js';
import { GAME_META, GAME_ORDER } from '../games/meta.js';

/* The Library's shelf, and the Play tab's. Games use the same contract as tools
   (view / act / key / selftest) so every tap, key and save path serves both; they
   live on their own shelf and their own route (#/game/<id>). Where on Earth? moved
   from the Library to Play; its id and its stored data stay 'geoguess'. */
const ORDER = ['capitals', 'states', 'landmarks', 'time', 'flags', 'explorer', 'dictionary'];
const EAGER = { capitals, states, landmarks, flags, explorer, dictionary };
const LAZY = {
  time: () => import('./time.js'), geoguess: () => import('./geoguess.js'),
  tradewinds: () => import('../games/tradewinds.js'), chain: () => import('../games/chain.js'), compass: () => import('../games/compass.js'),
  bigger: () => import('../games/bigger.js'), shape: () => import('../games/shape.js'), sunclock: () => import('../games/sunclock.js'),
  geobee: () => import('../games/geobee.js'), flagsprint: () => import('../games/flagsprint.js'),
};
const META = { time: TIME, ...GAME_META };
export const toolById = { ...EAGER };
export const SHELF = ORDER.map((id) => (EAGER[id] ? EAGER[id].TOOL : META[id]));
export const GAMES = GAME_ORDER.map((id) => GAME_META[id]);
export const GAME_IDS = new Set(GAME_ORDER);
export const metaOf = (id) => SHELF.find((t) => t.id === id) || GAME_META[id] || null;
export function loadTool(id) {
  if (toolById[id]) return Promise.resolve(toolById[id]);
  if (!LAZY[id]) return Promise.resolve(null);
  return LAZY[id]().then((m) => (toolById[id] = m));
}
export async function allTools() { const all = [...ORDER, ...GAME_ORDER]; for (const id of all) await loadTool(id); return all.map((id) => toolById[id]); }
