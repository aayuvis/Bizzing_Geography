/* icons.mjs — every glyph the app shows has an SVG drawing (standard §9, N4). The data
   keeps its emoji (a child recognises them in a list); gi() draws each as the family's
   line icon, and a glyph without a drawing would fall back to a pin — this fails on it. */
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const { hasGlyph, ICONS, ico, EMOJI } = await import('../src/icons.js');
const { WORLDS, STOPS } = await import('../src/stops.js');
const { EXPEDITIONS } = await import('../src/data/expeditions.js');
const { SHELF } = await import('../src/library/index.js');
const { MEDALS } = await import('../src/rewards.js');
const { CONTINENTS } = await import('../src/geo.js');
const { GLYPH: DAYG } = await import('../src/expeditions.js');
let fails = 0; const bad = (m) => { fails++; if (fails < 30) console.error('✗ ' + m); };
const all = [...WORLDS.map((x) => ['world ' + x.id, x.glyph]), ...STOPS.map((x) => ['stop ' + x.id, x.glyph]), ...EXPEDITIONS.map((x) => ['expedition ' + x.id, x.glyph]),
  ...SHELF.map((x) => ['tool ' + x.id, x.glyph]), ...MEDALS.map((x) => ['medal ' + x.id, x.glyph]), ...CONTINENTS.map((x) => ['continent ' + x.id, x.glyph]), ...Object.entries(DAYG).map(([k, g]) => ['day ' + k, g])];
for (const [what, g] of all) if (!hasGlyph(g)) bad(`${what}: glyph ${g} has no SVG drawing`);
for (const [n, p] of Object.entries(ICONS)) { if (EMOJI.test(p)) bad(`icon ${n} contains an emoji`); if (!/^<(path|circle|rect|g|svg|ellipse)/.test(p)) bad(`icon ${n} is not SVG`); }
if (!/<svg class="ico"[^>]*viewBox="0 0 24 24"/.test(ico('globe'))) bad('ico() draws on the 24px grid');
if (fails) { console.error(`✗ icons: ${fails} problems`); process.exit(1); }
console.log(`✓ icons: ${Object.keys(ICONS).length} SVG icons; all ${all.length} glyphs in the data have a drawing`);
