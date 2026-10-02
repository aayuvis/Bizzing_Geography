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
import { GEOGUESS, TIME } from './meta.js';

const ORDER = ['geoguess', 'capitals', 'states', 'landmarks', 'time', 'flags', 'explorer', 'dictionary'];
const EAGER = { capitals, states, landmarks, flags, explorer, dictionary };
const LAZY = { geoguess: () => import('./geoguess.js'), time: () => import('./time.js') };
const META = { geoguess: GEOGUESS, time: TIME };
export const toolById = { ...EAGER };
export const SHELF = ORDER.map((id) => (EAGER[id] ? EAGER[id].TOOL : META[id]));
export function loadTool(id) {
  if (toolById[id]) return Promise.resolve(toolById[id]);
  if (!LAZY[id]) return Promise.resolve(null);
  return LAZY[id]().then((m) => (toolById[id] = m));
}
export async function allTools() { for (const id of ORDER) await loadTool(id); return ORDER.map((id) => toolById[id]); }
