/* mascot.js — SHELLY, the sea turtle whose shell is a globe (family standard v2 §2, the
   owner's recommended pick). Six poses, painted once (tools/art/gen.py, sticker style,
   no lettering) — and, by this app's own rule, her globe carries only the lines of
   latitude and longitude: a model never draws a real map here.

     wave   the greeting, the welcome            cheer  every finish and medal
     think  hints, the search                    point  "this way": the next step
     sleep  empty states, the night              oops   error states, a wrong answer

   She is in the logo, the home greeting, every world's entrance, each finish screen and
   every empty and error state. The child's own avatar is theirs; Shelly is the app's. */

export const POSES = ['wave', 'cheer', 'think', 'point', 'sleep', 'oops'];
export const shelly = (pose = 'wave', size = 96, cls = '') =>
  `<img class="shelly s-${POSES.includes(pose) ? pose : 'wave'}${cls ? ' ' + cls : ''}" src="mascot/shelly-${POSES.includes(pose) ? pose : 'wave'}.webp" width="${size}" height="${size}" alt="" loading="lazy" decoding="async">`;
export const shellyHead = (size = 28) => `<img class="shelly-head" src="mascot/shelly-head.webp" width="${size}" height="${size}" alt="" decoding="async">`;

/* An empty state (standard §16): the sleeping mascot, one sentence and one button. */
export const empty = (say, button = '') => `<div class="card empty-state">${shelly('sleep', 120)}<p>${say}</p>${button}</div>`;
/* An error state: the oops pose, plain words and a retry — never a stack trace. */
export const oops = (say, button = '') => `<div class="card empty-state error-state" role="alert">${shelly('oops', 120)}<p>${say}</p>${button}</div>`;
/* Shelly says something (a speech bubble beside her) */
export const says = (pose, line, size = 84) => `<div class="shelly-says">${shelly(pose, size)}<p class="bubble-s">${line}</p></div>`;
