/* scenes.mjs — the living backdrop, held to what it promises (no browser).
   For every theme: a full scene (many props, most of them moving, at several
   depths), shapes only (no <text>, no letters), deterministic from its seed,
   and every animation class it uses has keyframes in styles/scenes.css.
   The stylesheet must pause everything for calm and for reduced motion. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { THEMES } from '../src/themes.js';
import { sceneHTML, SCENE_IDS } from '../src/scenes.js';

const css = readFileSync(resolve(import.meta.dirname, '../styles/scenes.css'), 'utf8');
let fails = 0; const rows = [];
const fail = (m) => { fails++; console.error('  ✗ ' + m); };

for (const t of THEMES) {
  if (!SCENE_IDS.includes(t.id)) { fail(`${t.id}: has no scene`); continue; }
  const h = sceneHTML(t.id);
  const props = (h.match(/class="scn /g) || []).length;
  const moving = (h.match(/class="scn [^"]*\ba-[a-z]+/g) || []).length;
  const kinds = new Set((h.match(/\ba-[a-zR]+\b/g) || []));
  const inner = (h.match(/class="sc-(flap|wag|paddle|pulse|palm|wing|leg|leg2|waddle|flame|spin-slow)"/g) || []).length;
  rows.push({ theme: t.id, props, moving, 'kinds of move': kinds.size, 'inner lives': inner });
  if (props < 40) fail(`${t.id}: only ${props} props — a scene, not a sprinkle, needs ≥ 40`);
  if (moving < 30) fail(`${t.id}: only ${moving} props move (≥ 30)`);
  if (kinds.size < 6) fail(`${t.id}: only ${kinds.size} kinds of movement (≥ 6)`);
  if (/<text\b/.test(h)) fail(`${t.id}: draws text — scenes are shapes only`);
  if (h !== sceneHTML(t.id)) fail(`${t.id}: not deterministic from its seed`);
  if (!new RegExp(`\\[data-theme="${t.id}"\\]\\{--sky1`).test(css) || !new RegExp(`\\[data-mode="dark"\\]\\[data-theme="${t.id}"\\]\\{--sky1`).test(css)) fail(`${t.id}: needs a light and a dark sky`);
  for (const k of kinds) if (!new RegExp(`\\.scene \\.${k}\\b[^{]*\\{[^}]*animation`).test(css) && !new RegExp(`\\.${k}\\{[^}]*animation`).test(css) && !new RegExp(`\\.scene \\.${k}[,{]`).test(css)) fail(`${t.id}: .${k} has no rule in scenes.css`);
}
for (const m of css.matchAll(/animation:\s*([a-z-]+)/g)) if (!new RegExp(`@keyframes ${m[1]}\\b`).test(css)) fail(`animation ${m[1]} has no @keyframes`);
if (!/:root\.sc-calm \.scene \*[^{]*\{[^}]*animation-play-state:paused/.test(css)) fail('calm does not pause the scene');
if (!/prefers-reduced-motion:reduce\)\{\s*\.scene \*[^{]*\{[^}]*animation-play-state:paused/.test(css)) fail('reduced motion does not pause the scene');
if (!/\.scene::after\{[^}]*radial-gradient/.test(css)) fail('the reading veil is missing');
console.table(rows);
console.log(`${fails ? '✗' : '✓'} scenes: ${rows.length} themes, ${rows.reduce((a, r) => a + r.props, 0)} props${fails ? `, ${fails} failures` : ''}`);
process.exit(fails ? 1 : 0);
