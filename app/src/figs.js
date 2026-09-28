/* figs.js — the little drawings lessons and questions use. SVG, drawn by the
   app, so the letters on a grid or a compass are the app's own type (the
   family's rule: no generated lettering, ever). Colours come from classes
   styled in app.css, so light and dark both work. */

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const svg = (w, h, body, cls = '', label = '') =>
  `<svg class="fig ${cls}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;

/* ---- map symbols: the app draws them, so a key is always the same key */
export const SYMBOLS = {
  tree: { name: 'woodland', d: '<circle cx="0" cy="-4" r="9" class="s-green"/><rect x="-1.5" y="4" width="3" height="8" class="s-brown"/>' },
  river: { name: 'river', d: '<path d="M-16 6 C-8 -8 0 14 8 -2 S14 -6 18 -4" class="s-water" fill="none"/>' },
  rail: { name: 'railway', d: '<path d="M-18 0H18" class="s-ink"/><path d="M-14 -4V4M-6 -4V4M2 -4V4M10 -4V4" class="s-ink"/>' },
  road: { name: 'main road', d: '<path d="M-18 0H18" class="s-road"/>' },
  bridge: { name: 'bridge', d: '<path d="M-16 -3 C-6 -12 6 -12 16 -3" class="s-ink" fill="none"/><path d="M-18 4H18" class="s-water"/>' },
  lake: { name: 'lake', d: '<ellipse rx="16" ry="9" class="s-waterfill"/>' },
  hill: { name: 'hill', d: '<path d="M-16 8 L-4 -10 L4 -2 L10 -8 L18 8Z" class="s-hill"/>' },
  camp: { name: 'campsite', d: '<path d="M-10 8 L0 -10 L10 8Z" class="s-tent"/><path d="M0 -10V8" class="s-ink"/>' },
  station: { name: 'railway station', d: '<rect x="-9" y="-9" width="18" height="18" rx="2" class="s-red"/><path d="M-18 0H-9M9 0H18" class="s-ink"/>' },
  school: { name: 'school', d: '<path d="M-12 8V-2L0 -10L12 -2V8Z" class="s-bld"/><rect x="-3" y="1" width="6" height="7" class="s-ink-f"/>' },
  park: { name: 'park', d: '<rect x="-14" y="-10" width="28" height="20" rx="4" class="s-park"/><circle cx="-5" cy="-1" r="4" class="s-green"/><circle cx="5" cy="2" r="4" class="s-green"/>' },
  lighthouse: { name: 'lighthouse', d: '<path d="M-5 10 L-3 -8 H3 L5 10Z" class="s-red"/><path d="M-3 -8 L0 -13 L3 -8" class="s-ink-f"/><path d="M6 -10 L16 -14 M6 -8 L16 -6" class="s-ray"/>' },
};
export const symbol = (id, size = 64) => svg(40, 32, `<g transform="translate(20 16)">${SYMBOLS[id].d}</g>`, 'sym', SYMBOLS[id].name).replace('<svg', `<svg width="${size}" height="${size * 0.8}"`);

/* ---- a compass rose: 4 or 8 points, the app's letters */
export function rose(points = 4, size = 120) {
  const L = points === 4 ? ['N', 'E', 'S', 'W'] : ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  let b = '<circle r="44" class="r-ring"/>';
  L.forEach((l, i) => {
    const a = (i * 360) / L.length, long = l.length === 1, len = long ? 40 : 28;
    b += `<path d="M0 0 L${-5} ${-8} L0 ${-len} L5 ${-8}Z" transform="rotate(${a})" class="${l === 'N' ? 'r-n' : long ? 'r-main' : 'r-minor'}"/>`;
    const r = long ? 55 : 50, x = Math.sin((a * Math.PI) / 180) * r, y = -Math.cos((a * Math.PI) / 180) * r;
    b += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" class="r-t${long ? '' : ' r-t2'}">${l}</text>`;
  });
  return svg(140, 140, `<g transform="translate(70 70)">${b}</g>`, 'rose', `${points}-point compass`).replace('<svg', `<svg width="${size}" height="${size}"`);
}

/* ---- a direction board: things placed round a centre on a 5×5 plan.
   items: [{ sym, dx, dy }] where dx east, dy north, in cells. */
export function plan(items, centre = 'school', showRose = true) {
  const C = 44, N = 5, o = 2;
  let b = '';
  for (let i = 0; i <= N; i++) b += `<path d="M${i * C} 0V${N * C}M0 ${i * C}H${N * C}" class="g-line"/>`;
  const put = (sym, dx, dy, cls = '') => `<g transform="translate(${(o + dx) * C + C / 2} ${(o - dy) * C + C / 2}) scale(1.05)" class="${cls}">${SYMBOLS[sym].d}</g>`;
  b += put(centre, 0, 0, 'g-centre');
  for (const it of items) b += put(it.sym, it.dx, it.dy);
  const rs = showRose ? `<g transform="translate(${N * C + 34} 34) scale(.42)">${rose(8).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>` : '';
  return svg(N * C + 70, N * C, `<rect width="${N * C}" height="${N * C}" class="g-bg"/>${b}${rs}`, 'plan', 'A plan seen from above, north at the top');
}

/* ---- a grid-reference map: letters along the bottom, numbers up the side */
export function gridMap(items, cols = 5, rows = 4) {
  const C = 48, P = 22;
  let b = `<rect x="${P}" y="0" width="${cols * C}" height="${rows * C}" class="g-bg"/>`;
  for (let i = 0; i <= cols; i++) b += `<path d="M${P + i * C} 0V${rows * C}" class="g-line"/>`;
  for (let j = 0; j <= rows; j++) b += `<path d="M${P} ${j * C}H${P + cols * C}" class="g-line"/>`;
  for (let i = 0; i < cols; i++) b += `<text x="${P + i * C + C / 2}" y="${rows * C + 17}" class="g-t">${'ABCDEFGH'[i]}</text>`;
  for (let j = 0; j < rows; j++) b += `<text x="${P / 2}" y="${(rows - j - 1) * C + C / 2 + 5}" class="g-t">${j + 1}</text>`;
  for (const it of items) b += `<g transform="translate(${P + it.c * C + C / 2} ${(rows - it.r - 1) * C + C / 2})">${SYMBOLS[it.sym].d}</g>`;
  return svg(P + cols * C + 4, rows * C + 24, b, 'gridmap', 'A map with a grid: letters along the bottom, numbers up the side');
}

/* ---- a scale bar */
export function scaleBar(km, cm = 1) {
  const u = 60;
  let b = '';
  for (let i = 0; i < 4; i++) b += `<rect x="${10 + i * u}" y="14" width="${u}" height="8" class="${i % 2 ? 'sb-w' : 'sb-b'}"/>`;
  for (let i = 0; i <= 4; i++) b += `<text x="${10 + i * u}" y="38" class="g-t">${i * km}</text>`;
  b += `<text x="${10 + 4 * u + 8}" y="38" class="g-t" text-anchor="start">km</text>`;
  return svg(4 * u + 44, 44, b, 'scalebar', `A scale bar: each block is ${cm} centimetre and ${km} kilometres`);
}

/* ---- the Earth cut open */
export function layers() {
  const L = [['crust', 100, 'l-crust'], ['mantle', 94, 'l-mantle'], ['outer core', 52, 'l-outer'], ['inner core', 24, 'l-inner']];
  let b = '';
  for (const [, r, c] of L) b += `<circle r="${r}" class="${c}"/>`;
  b += '<path d="M0 0 L110 -110 L110 0Z" class="l-cut"/>';
  const lab = [['crust', 0, -104], ['mantle', 0, -72], ['outer core', 0, -36], ['inner core', 0, 4]];
  for (const [t, x, y] of lab) b += `<text x="${x}" y="${y}" class="l-t">${t}</text>`;
  return svg(240, 240, `<g transform="translate(120 120)">${b}</g>`, 'layers', 'The Earth cut open: crust, mantle, outer core, inner core');
}

/* ---- the water cycle, as arrows between sea, cloud and land */
export function waterCycle() {
  const b = `<rect x="0" y="150" width="320" height="50" class="wc-sea"/><path d="M180 150 L240 70 L320 150Z" class="wc-land"/>
    <circle cx="40" cy="30" r="18" class="wc-sun"/>
    <ellipse cx="160" cy="45" rx="42" ry="18" class="wc-cloud"/><ellipse cx="195" cy="40" rx="30" ry="15" class="wc-cloud"/>
    <path d="M80 140 C80 100 100 70 130 58" class="wc-arr"/><text x="30" y="110" class="wc-t">evaporation</text>
    <text x="118" y="22" class="wc-t">condensation</text>
    <path d="M210 62 L215 90 M222 62 L227 90 M234 62 L239 90" class="wc-rain"/><text x="238" y="54" class="wc-t">precipitation</text>
    <path d="M270 130 C250 145 230 150 205 152" class="wc-arr"/><text x="236" y="190" class="wc-t">collection</text>`;
  return svg(320, 200, b, 'watercycle', 'The water cycle: evaporation, condensation, precipitation, collection');
}

/* ---- the globe's lines */
export function globeLines() {
  let b = '<circle r="90" class="gb-sea"/>';
  const lat = (d, cls, t) => { const y = -Math.sin((d * Math.PI) / 180) * 90, x = Math.cos((d * Math.PI) / 180) * 90; b += `<path d="M${-x} ${y}H${x}" class="${cls}"/>${t ? `<text x="${x + 6}" y="${y + 4}" class="gb-t">${t}</text>` : ''}`; };
  lat(66.56, 'gb-l', 'Arctic Circle'); lat(23.44, 'gb-l', 'Tropic of Cancer'); lat(0, 'gb-eq', 'Equator'); lat(-23.44, 'gb-l', 'Tropic of Capricorn'); lat(-66.56, 'gb-l', 'Antarctic Circle');
  b += '<path d="M0 -90V90" class="gb-pm"/><text x="-4" y="-96" class="gb-t" text-anchor="middle">North Pole</text><text x="0" y="108" class="gb-t" text-anchor="middle">South Pole</text>';
  return svg(340, 230, `<g transform="translate(110 115)">${b}</g>`, 'globelines', 'The globe’s special lines of latitude');
}

/* ---- plate boundaries, three little diagrams */
export function boundary(kind) {
  const arrows = { divergent: ['M60 50 L20 50', 'M100 50 L140 50'], convergent: ['M20 50 L60 50', 'M140 50 L100 50'], transform: ['M30 38 L90 38', 'M130 62 L70 62'] }[kind];
  const b = `<rect x="0" y="20" width="80" height="60" class="pb-a"/><rect x="80" y="20" width="80" height="60" class="pb-b"/>
    ${arrows.map((d) => `<path d="${d}" class="pb-arr" marker-end="url(#ah)"/>`).join('')}
    <defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" class="pb-head"/></marker></defs>`;
  return svg(160, 100, b, 'boundary', `A ${kind} plate boundary`);
}
