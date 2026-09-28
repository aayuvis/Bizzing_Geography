/* library/index.js — the Geography Library: one module per tool, in shelf
   order. Every tool follows docs/LIBRARY-CONTRACT.md (Bizzing Maths's
   contract, extended with map taps: `act('tap', json)`). */
import * as geoguess from './geoguess.js';
import * as capitals from './capitals.js';
import * as states from './states.js';
import * as landmarks from './landmarks.js';
import * as time from './time.js';
import * as flags from './flags.js';
import * as explorer from './explorer.js';
import * as dictionary from './dictionary.js';

export const TOOLS = [geoguess, capitals, states, landmarks, time, flags, explorer, dictionary];
export const toolById = Object.fromEntries(TOOLS.map((t) => [t.TOOL.id, t]));
export const SHELF = TOOLS.map((t) => t.TOOL);
