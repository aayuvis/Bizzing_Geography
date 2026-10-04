/* tradewinds.js — Shelly's Trade Winds: The Long Voyage. The screen; the rules are tw-voyage.js.

   The owner's story, made a game: Shelby, fifteen, one small boat, a bosun and a stowaway — and
   Shelly — in Mumbai in 1800, sixty dark lights, and a century of sea. Sail, meet the sea, go ashore,
   grow: until every port is lit, all ten expeditions are sealed, every invention is fitted and ten
   ships sail together.

   The chart is DRAWN, never painted (a model never draws a real map). People in the story are never
   drawn either — names and roles only, until the owner signs off a human cast (CLAUDE.md, Art).
   Keyboard: N next month · Enter set sail · Esc cancel · 1–4 a danger's choice · Enter to go on. */
import { GAME_META } from './meta.js';
import { worldSVG, worldPath, project, countryAt, viewFor } from '../map.js';
import { geoArea, geoGraticule10, geoCircle } from 'd3-geo';
import { haversine, fmtKm } from '../geo.js';
import { shelly } from '../mascot.js';
import { esc, ico, readBtn } from './kit.js';
import { shipVars } from '../rewards.js';
import { OCEANS, windAt } from './tw-engine.js';
import * as V from './tw-voyage.js';
import { PORTS, GOODS } from './tw-voyage.js';
import { ERAS, BANDS, MONTHS, STRAITS, CANALS, HAZARDS, MONSOON, TRADEWINDS_NEEDS_REVIEW, PORT_SRC, STRAITS_SRC, ERAS_SRC, WIND_SRC } from './tw-data.js';
import { RANKS, MARKS, CLASSES, INVENTIONS, EARNED, CREW, GIFTS, EXPEDITIONS, BOOKS, BEATS, LOG, LOG_SRC } from './tw-story.js';
import { seeded, shuffle } from '../rand.js';

export const TOOL = GAME_META.tradewinds;
export { PORTS };
const S_ = (ctx) => (ctx.data.save && ctx.data.save.v === 2 ? ctx.data.save : null);
const goodTag = (g) => (g ? `${GOODS[g].glyph} ${esc(GOODS[g].goodName)}` : 'nothing');
const PASS = { ...Object.fromEntries(STRAITS.map((s) => [s.id, s])), ...Object.fromEntries(Object.entries(CANALS).map(([id, c]) => [id, c])) };
const WINDNAME = { trades: 'the trade winds', westerlies: 'the westerlies', polar: 'the polar easterlies', monsoon: 'the monsoon' };
const cash = (n) => `<span class="tw-cash" title="Trade coin: the game’s own money — never real money, never Bizzing coins">◈ ${Math.round(n).toLocaleString('en-US')}</span>`;
const L = (a) => `data-act="lib" data-arg="tradewinds|${a}"`;

/* ------------------------------------------------------------------ the chart
   Drawn, never painted: a sea chart in SVG. Under the land go the sea (a deep gradient
   with a wave texture), the climate bands that decide every cargo, the season's storms and
   ice, and the winds as flowing streaks — so none of it is ever drawn over a continent.
   Over the land go the lanes, the ports (a lit lantern when awake) and the ships, each drawn
   as a ship of its age: sail, then steam. K scales every mark so a phone still sees them. */
const ll = (path) => ({ type: 'LineString', coordinates: path.map(([la, lo]) => [lo, la]) });
const f1 = (n) => n.toFixed(1);
const CARGO = { fruit: '#f39c34', cotton: '#e985b0', grain: '#e9c46a', timber: '#8a5a2b' };
const LAND = new Map();
const onLand = (lat, lng) => { const k = lat + ',' + lng; if (!LAND.has(k)) LAND.set(k, !!countryAt([lat, lng])); return LAND.get(k); };
function band(lat0, lat1) {          // a band of latitude, as six boxes (a ring all the way round is not one polygon)
  let out = '';
  for (let w = -180; w < 180; w += 60) {
    const ring = [[w, lat0], [w, lat1], [w + 60, lat1], [w + 60, lat0], [w, lat0]];
    let g = { type: 'Polygon', coordinates: [ring] };
    if (geoArea(g) > 2 * Math.PI) g = { type: 'Polygon', coordinates: [ring.slice().reverse()] };
    out += worldPath(g) || '';
  }
  return out;
}
const at = (lat, lng, K, body, cls = '', rot = 0) => { const xy = project([lat, lng]); return xy ? `<g class="${cls}" transform="translate(${f1(xy[0])} ${f1(xy[1])})${rot ? ` rotate(${rot})` : ''} scale(${K})">${body}</g>` : ''; };
const DEFS = `<defs>
  <radialGradient id="tw-sea-g" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#3aa0bf"/><stop offset=".55" stop-color="#22789c"/><stop offset="1" stop-color="#123f63"/></radialGradient>
  <pattern id="tw-wave" width="34" height="18" patternUnits="userSpaceOnUse"><path d="M2 12q4-4 8 0t8 0M19 4q4-4 8 0t8 0" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width=".9" stroke-linecap="round"/></pattern>
  <radialGradient id="tw-glow"><stop offset="0" stop-color="#fff6c8" stop-opacity=".95"/><stop offset=".35" stop-color="#ffd25e" stop-opacity=".65"/><stop offset="1" stop-color="#ffb300" stop-opacity="0"/></radialGradient>
  <linearGradient id="tw-land-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6ead0"/><stop offset="1" stop-color="#e8d3a6"/></linearGradient>
  <filter id="tw-coast" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="1.6" result="d"/><feGaussianBlur in="d" stdDeviation="2.2" result="b"/><feFlood flood-color="#bff3ee" flood-opacity=".75"/><feComposite in2="b" operator="in" result="halo"/><feDropShadow in="SourceGraphic" dx="0" dy="1.2" stdDeviation="1" flood-color="#0b2e45" flood-opacity=".45" result="sh"/><feMerge><feMergeNode in="halo"/><feMergeNode in="sh"/></feMerge></filter>
  <symbol id="tw-sail" viewBox="-13 -19 26 27" overflow="visible">
    <path d="M-12 1.5H12L8.5 7H-8.5Z" style="fill:var(--tw-hull,#7a4a24)" stroke="#3e2410" stroke-width=".7"/><path d="M-10.5 3.3H10.5" style="stroke:var(--tw-trim,#f2c14e)" stroke-width=".9"/>
    <path d="M-3 2V-15M4.5 2V-12.5" stroke="#3e2410" stroke-width="1.1"/>
    <path d="M-8 -14H1.5Q4 -9 1.5 -3.5H-8Q-5.5 -9 -8 -14Z" style="fill:var(--tw-sail,#fffaf0)" stroke="#b9a27a" stroke-width=".55"/>
    <path d="M0.5 -11.5H8.5Q10.6 -7.5 8.5 -3.5H0.5Q2.6 -7.5 0.5 -11.5Z" style="fill:var(--tw-sail,#fffaf0)" stroke="#b9a27a" stroke-width=".55"/>
    <path d="M5.5 -12L12.5 0.6H6Z" fill="#f4ead6" stroke="#b9a27a" stroke-width=".5"/>
    <path d="M-3 -15L3 -16.6L-3 -18.3Z" fill="currentColor" stroke="#3e2410" stroke-width=".4"/></symbol>
  <symbol id="tw-steam" viewBox="-14 -19 28 27" overflow="visible">
    <circle class="tw-smoke" cx="-5" cy="-13" r="2.8" fill="#6d7480" opacity=".55"/><circle class="tw-smoke s2" cx="-10" cy="-15.5" r="2.2" fill="#8a919c" opacity=".4"/>
    <path d="M-13 1H13L9.5 7H-9.5Z" style="fill:var(--tw-hull2,#2b2f45)" stroke="#14172a" stroke-width=".7"/><path d="M-11.3 5.2H11.3" stroke="#d64535" stroke-width="1.3"/>
    <rect x="-8" y="-3.2" width="13" height="4.2" rx=".8" fill="#f5efe4" stroke="#9c9486" stroke-width=".5"/>
    <rect x="-3.2" y="-10.5" width="4.4" height="7.4" style="fill:var(--tw-funnel,#d64535)" stroke="#7a1f16" stroke-width=".5"/><rect x="-3.2" y="-10.5" width="4.4" height="1.7" fill="#1d1d1d"/>
    <path d="M8 -3V-12" stroke="#14172a" stroke-width=".9"/><path d="M8 -12L13 -13.4L8 -15Z" fill="currentColor" stroke="#14172a" stroke-width=".4"/></symbol>
  <symbol id="tw-swirl" viewBox="-12 -12 24 24" overflow="visible"><path d="M0 0m-9 0a9 9 0 1 1 9 9M0 0m9 0a9 9 0 1 1-9-9M0 0m0-5a5 5 0 1 1-5 5M0 0m0 5a5 5 0 1 1 5-5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle r="1.8" fill="#fff"/></symbol>
</defs>`;
const BAND_LINES = [[23.5, 'Tropics'], [35, 'Subtropics'], [55, 'Temperate'], [70, 'Cold']];
function bandLayer() {          // the climate bands every cargo comes from, drawn on the sea
  let s = '';
  for (const [lat] of BAND_LINES.slice(0, 3)) for (const L of [lat, -lat]) s += `<path class="tw-bandline" d="${worldPath({ type: 'LineString', coordinates: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, L]) })}"/>`;
  s += `<path class="tw-equator" d="${worldPath({ type: 'LineString', coordinates: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, 0]) })}"/>`;
  const mids = [[11, 'Tropics'], [29, 'Subtropics'], [45, 'Temperate'], [63, 'Cold']];
  for (const [lat, n] of mids) for (const L of [lat, -lat]) { const xy = project([L, L > 30 ? -160 : -150]); if (xy) s += `<text class="tw-bandname" x="${f1(xy[0])}" y="${f1(xy[1])}">${n}</text>`; }
  return s;
}
function hazardLayer(month, K) {
  const C = HAZARDS.cyclones, I = HAZARDS.ice; let s = '';
  const storms = (lo, hi) => { let g = `<path class="tw-storm" d="${band(lo, hi)}"/>`; const mid = (lo + hi) / 2;
    for (let lng = -170; lng < 180; lng += 25) { const la = mid + ((lng / 25) % 2 ? 4 : -4); if (!onLand(la, lng)) g += at(la, lng, K, `<use href="#tw-swirl" x="-9" y="-9" width="18" height="18"/>`, 'tw-cyc'); }
    return g; };
  const ice = (lo, hi) => { let g = `<path class="tw-ice" d="${band(lo, hi)}"/>`; const mid = (lo + hi) / 2;
    for (let lng = -175; lng < 180; lng += 18) { const la = mid + ((lng / 18) % 2 ? 3 : -3); if (!onLand(la, lng)) g += at(la, lng, K, `<path d="M-6 -2L-1 -5L5 -3L7 2L1 5L-5 3Z"/>`, 'tw-floe', (lng * 7) % 60); }
    return g; };
  if (C.north.includes(month)) s += storms(C.lat[0], C.lat[1]);
  if (C.south.includes(month)) s += storms(-C.lat[1], -C.lat[0]);
  if (I.north.includes(month)) s += ice(I.lat, 80);
  if (I.south.includes(month)) s += ice(-78, -I.lat);
  return s;
}
/* the wind belts as streaks blowing the way the real belts blow — the trades toward the
   equator and west, the westerlies poleward and east; the monsoon turns round with the season */
function windLayer(month, K) {
  const pts = [];
  for (const lat of [-48, -14, 14, 46, 64, -62]) for (let lng = -165; lng < 180; lng += 34) pts.push([lat, lng + (Math.abs(lat) % 4 ? 17 : 0)]);
  for (const p of [[12, 62], [15, 88], [5, 70], [17, 66], [8, 92]]) pts.push(p);       // the monsoon's own sea
  return pts.filter(([la, lo]) => !onLand(la, lo)).map(([lat, lng], k) => {
    const w = windAt(lat, lng, month), mon = w.id === 'monsoon';
    const rot = mon ? (w.east > 0 ? -30 : 150) : w.east > 0 ? (lat > 0 ? -18 : 18) : (lat > 0 ? 162 : 198);
    return at(lat, lng, K * 1.45, `<path class="st" d="M-16 0C-10 -3.5 -4 3.5 2 0S10 -2.5 13 0"/><path class="fl" d="M-16 0C-10 -3.5 -4 3.5 2 0S10 -2.5 13 0"/><path class="hd" d="M9 -3.2L13.5 0L9 3.2"/>`, `tw-wind${mon ? ' mon' : ''} d${k % 3}`, rot);
  }).join('');
}
function compass(K, vb) {            // a drawn compass rose in the chart's corner (the letters are the app's)
  const r = 30, pts = (a, R, r2) => { const x = (t, d) => f1(Math.cos(t) * d), y = (t, d) => f1(Math.sin(t) * d), t = (a * Math.PI) / 180; return `M${x(t, R)} ${y(t, R)}L${x(t + 0.35, r2)} ${y(t + 0.35, r2)}L0 0L${x(t - 0.35, r2)} ${y(t - 0.35, r2)}Z`; };
  return `<g class="tw-rose" transform="${vb ? `translate(${f1(vb[0] + 48 * vb[2] / 1000 * Math.min(K, 1.6))} ${f1(vb[1] + vb[3] - 48 * vb[2] / 1000 * Math.min(K, 1.6))}) scale(${(vb[2] / 1000 * Math.min(K, 1.6)).toFixed(3)})` : `translate(64 452) scale(${Math.min(K, 1.6)})`}"><circle r="${r + 6}" class="ring"/><circle r="${r - 6}" class="ring2"/>
    ${[45, 135, 225, 315].map((a) => `<path class="mi" d="${pts(a, r * 0.72, 7)}"/>`).join('')}
    ${[-90, 0, 90, 180].map((a, i) => `<path class="${i % 2 ? 'ma2' : 'ma'}" d="${pts(a, r + 2, 8)}"/>`).join('')}
    <circle r="2.6" class="hub"/><text y="${-r - 9}">N</text><text x="${r + 11}" y="1">E</text><text y="${r + 12}">S</text><text x="${-r - 11}" y="1">W</text></g>`;
}

function alongPath(path, f) {
  let total = 0; const seg = path.map((p, i) => (i ? haversine(path[i - 1], p) : 0)); total = seg.reduce((a, b) => a + b, 0);
  let want = total * Math.max(0, Math.min(1, f));
  for (let i = 1; i < path.length; i++) { if (want <= seg[i]) { const t = seg[i] ? want / seg[i] : 0; return [path[i - 1][0] + (path[i][0] - path[i - 1][0]) * t, path[i - 1][1] + (path[i][1] - path[i - 1][1]) * t]; } want -= seg[i]; }
  return path[path.length - 1];
}
/* on a phone the whole world is too small to tap a port: open on the ocean around the
   selected port (or home), and let a pinch, a drag or the − button show the rest */
function phoneView(S, ui) {
  if (typeof window === 'undefined' || window.innerWidth > 600) return null;
  const P = PORTS[ui.sel != null ? ui.sel : S.home].at;
  return viewFor([P[1] - 62, Math.max(-75, P[0] - 34), P[1] + 62, Math.min(80, P[0] + 34)], 0);
}
/* how big a mark must be drawn for this screen: the chart is 1000 units wide */
function markScale() {
  if (typeof window === 'undefined') return 1;
  const vw = window.innerWidth, px = vw > 980 ? Math.min(1440, vw - 32) * 0.68 : vw;
  return Math.max(1, Math.min(2.4, (1000 / px) * 0.85));
}

const portPin = (P, lit, cls, label, K, sc) => { const xy = project(P.at); if (!xy) return '';
  return `<g class="pin tw-port ${cls}" transform="translate(${f1(xy[0])} ${f1(xy[1])}) scale(${sc})"><g transform="scale(${K})">
    ${lit ? '<circle class="halo" r="14"/>' : ''}<circle class="ring" r="9"/><circle class="core" r="${lit ? 4.6 : 3.4}"/>
    ${label ? `<text y="-12">${esc(label)}</text>` : ''}</g></g>`; };
const firstGood = (sh) => (sh.hold && sh.hold[0] ? sh.hold[0].g : null);

/* the chart's layers: under the land the sea, bands, seasons, winds — and, once the whales speak, the
   light round every lit port (the dark water beyond is where the Grey Gulls hunt) */
function layers(S, ui, K, vb) {
  const sc = vb ? vb[2] / 1000 : 1, KS = K * sc;
  const zones = V.hasGift(S, 'deepspeech') ? `<g class="tw-litzones">${PORTS.filter((P) => S.ports[P.i].lit).map((P) => `<path d="${worldPath(geoCircle().center([P.at[1], P.at[0]]).radius(9)())}"/>`).join('')}</g>` : '';
  const under = [DEFS, `<path class="tw-sea" d="${worldPath({ type: 'Sphere' })}"/>`, `<path class="tw-waves" d="${worldPath({ type: 'Sphere' })}"/>`, zones,
    `<path class="tw-grat" d="${worldPath(geoGraticule10())}"/>`, bandLayer(), hazardLayer(S.month, KS), `<g class="tw-winds">${windLayer(S.month, KS)}</g>`].join('');
  const out = [];
  for (const sh of S.ships) if (sh.voyage) out.push(`<path class="tw-voy" d="${worldPath(ll(sh.voyage.path))}"/>`);
  if (ui.plan) out.push(`<path class="tw-plan-glow" d="${worldPath(ll(ui.plan.path))}"/><path class="tw-plan" d="${worldPath(ll(ui.plan.path))}"/>`);
  if (S.war && S.war.until > S.turn) out.push(at(S.war.at[0], S.war.at[1], KS, '<circle r="11" class="tw-war"/><path d="M-6 -6L6 6M6 -6L-6 6" class="tw-war-x"/>', 'tw-warmark'));
  PORTS.forEach((P, i) => {
    const st = S.ports[i], cls = [st.lit ? 'awake' : 'sleep', i === S.home ? 'home' : '', i === ui.sel ? 'sel' : '', i === ui.dest ? 'dest' : '', S.asks.some((x) => x.port === i && !x.done) ? 'asks' : '', V.isYard(i) ? 'yard' : ''].join(' ');
    out.push(portPin(P, st.lit, cls, (st.lit && KS < 1.5) || i === ui.sel || i === ui.dest || i === S.home ? P.n : '', K, sc));
  });
  const docked = {};
  for (const sh of S.ships) {
    let pos, west = false, dx = 0, dy = 0;
    if (sh.voyage) {
      const v = sh.voyage, f = Math.min(1, (v.months - v.left + 0.5) / v.months); pos = alongPath(v.path, f);
      const a = project(alongPath(v.path, Math.max(0, f - 0.04))), b = project(alongPath(v.path, Math.min(1, f + 0.04))); west = a && b && b[0] < a[0];
    } else { if (docked[sh.at] != null) continue; docked[sh.at] = S.ships.filter((x) => !x.voyage && x.at === sh.at).length; pos = PORTS[sh.at].at; dx = 13 * K * sc; dy = 8 * K * sc; }
    const xy = project(pos); if (!xy) continue;
    const g = firstGood(sh), sym = V.classOf(sh).era >= 1 || sh.ups.includes('engine') ? 'tw-steam' : 'tw-sail';
    out.push(`<g class="pin tw-ship${sh.voyage ? ' sea' : ' dock'}${ui.ship === sh.id ? ' on' : ''}${sh.id === 1 ? ' flag' : ''}" transform="translate(${f1(xy[0] + dx)} ${f1(xy[1] + dy)}) scale(${sc})"><g transform="scale(${(K * 1.3).toFixed(2)})"><g class="bob"><g transform="scale(${west ? -1 : 1} 1)">
      ${sh.voyage ? '<path class="wake" d="M-11 5L-22 2.5M-11 6.5L-21 9"/>' : ''}<use href="#${sym}" x="-13" y="-19" width="26" height="27" style="color:${g ? CARGO[g] : '#d64535'}"/></g>${!sh.voyage && docked[sh.at] > 1 ? `<g class="tw-count" transform="translate(11 -15)"><circle r="6.5"/><text>${docked[sh.at]}</text></g>` : ''}</g></g></g>`);
  }
  out.push(compass(K, vb));
  return { under, extra: out.join('') };
}

/* ------------------------------------------------------------------ the side: this month */
const NEWS = (S, n) => {
  const Pn = (i) => esc(PORTS[i].n);
  switch (n.k) {
    case 'wake': return `<li class="tw-n wake"><img class="tw-thumb" src="art/game-tw-port-${PORTS[n.port].band}.webp" alt="" loading="lazy"><span><b>${Pn(n.port)} is lit!</b> ${esc(V.sightsOf(n.port)[0].say)}</span></li>`;
    case 'helped': return `<li class="tw-n help">❤️ <b>${Pn(n.port)}</b> got the ${esc(GOODS[n.good].goodName)} it asked for.</li>`;
    case 'ask': return `<li class="tw-n ask">🙏 A lean season in <b>${Pn(n.port)}</b>: ten crates of ${goodTag(n.good)} within six months.</li>`;
    case 'arrive': return `<li class="tw-n">⚓ The ${esc(S.ships.find((s) => s.id === n.ship).name)} reached ${Pn(n.port)}.</li>`;
    case 'job': return `<li class="tw-n help">📜 A job done in ${Pn(n.job.to)}: ${cash(n.job.coin)}${n.job.forged ? '' : ` · +${n.job.xp} XP`}.</li>`;
    case 'jobfail': return `<li class="tw-n">⌛ A job for ${Pn(n.job.to)} ran out of time.</li>`;
    case 'forged': return `<li class="tw-n">🕯️ That letter was a forgery. Both crowns are angry.</li>`;
    case 'gift': { const g = GIFTS.find((x) => x.id === n.id); return `<li class="tw-n era">${g.glyph} <b>A Keeper’s Gift: ${esc(g.name)}.</b> ${esc(g.does)}</li>`; }
    case 'earned': { const e = EARNED.find((x) => x.id === n.id); return `<li class="tw-n era">🎖️ <b>Earned: ${esc(e.name)}</b> (${esc(MARKS.find((m) => m.id === e.mark).name)} +${e.plus}).</li>`; }
    case 'crew': return `<li class="tw-n">${CREW[n.id].glyph} ${n.away ? `<b>${esc(CREW[n.id].name)}</b> has gone home for a while.` : `<b>${esc(CREW[n.id].name)}</b> is aboard.`}</li>`;
    case 'invention': return `<li class="tw-n">🔧 New on the fleet: ${esc(INVENTIONS.find((u) => u.id === n.id).name)}.</li>`;
    case 'ship': return `<li class="tw-n">⛵ A new ship: the ${esc(S.ships.find((s) => s.id === n.id).name)}.</li>`;
    case 'towed': return `<li class="tw-n">🛟 The ${esc(S.ships.find((s) => s.id === n.ship).name)} was towed into ${Pn(n.port)}. Every sailor is safe.</li>`;
    case 'war': return `<li class="tw-n ask">🚫 War between Varn and Ostery: the Gate of Grief is closed. It cannot be joined — only talked to an end.</li>`;
    case 'peace': return `<li class="tw-n help">🕊️ The war at the Gate is over.</li>`;
    case 'sealed': return `<li class="tw-n era">🏅 <b>Expedition sealed:</b> ${esc(EXPEDITIONS.find((e) => e.id === n.id).name)}.</li>`;
    case 'rank': return `<li class="tw-n era">⭐ Shelby is now <b>${esc(RANKS.find((r) => r.id === n.id).name)}</b>.</li>`;
    case 'log': return `<li class="tw-n">📖 A Ship’s Log card: <b>${esc(LOG[n.id].t)}</b>.</li>`;
    case 'years': return `<li class="tw-n">⏳ Years pass at sea: ${n.from} … ${n.to}.</li>`;
    case 'era': return `<li class="tw-n era"><img class="tw-thumb" src="art/game-tw-era-${ERAS[n.era].id}.webp" alt="" loading="lazy"><span><b>${esc(ERAS[n.era].name)}</b> — ${esc(ERAS[n.era].card)}</span></li>`;
    default: return '';
  }
};
function newsCard(S) {
  const items = (S.news || []).filter((n) => n.k !== 'xp' && n.k !== 'beat').map((n) => NEWS(S, n)).filter(Boolean);
  if (!items.length) return '';
  return `<div class="card tw-news"><p class="kicker">This month</p><ul>${items.slice(0, 8).join('')}</ul></div>`;
}

/* ------------------------------------------------------------------ ashore: the port card */
const markBar = (m, v) => `<span class="tw-mk" title="${esc(m.name)}: ${esc(m.says)}"><i>${m.glyph}</i><b>${esc(m.name)}</b><span class="tw-mk-bar"><span style="width:${v * 10}%"></span></span><em>${v}</em></span>`;
const holdLine = (S, sh) => { const parts = Object.keys(GOODS).map((g) => [g, V.holdOf(sh, g)]).filter(([, n]) => n).map(([g, n]) => `${GOODS[g].glyph} ${n}`); const jobs = sh.jobs.filter((j) => j.n).reduce((a, j) => a + j.n, 0);
  return `${parts.join(' · ') || 'empty'}${jobs ? ` · 📜 ${jobs} for jobs` : ''} <span class="muted">(${V.holdCount(sh)}/${V.capacity(S, sh)} crates)</span>`; };
function jobLine(S, j) {
  const to = esc(PORTS[j.to].n), left = Math.max(0, j.due - S.turn);
  const what = j.kind === 'cargo' ? `${j.n} crates of ${goodTag(j.g)} to <b>${to}</b>` : j.kind === 'letter' ? `A letter for <b>${to}</b>` : j.kind === 'passenger' ? `A passenger to <b>${to}</b>`
    : j.kind === 'peace' ? `<b>The true letter</b> — Queen Isolde’s own — to the fleets at <b>${to}</b>. It ends the war.` : j.kind === 'whales' ? `🐋 The Long Singers ask: carry word of the grey boats to the keeper at <b>${to}</b>` : `🛳️ Lead ten merchant ships to <b>${to}</b> through dark water (guard 6 and the wireless)`;
  return `${what} · ${left} months · ${j.coin ? cash(j.coin) + ' · ' : ''}+${j.xp} XP`;
}
function quizCard(S) {
  const id = S.quiz; if (!id || !LOG[id]) return '';
  const c = LOG[id], opts = shuffle([c.a, ...c.w], seeded(S.seed + id + S.turn));
  return `<div class="tw-sec tw-quiz"><p class="kicker">📖 From your Ship’s Log</p><p><b>${esc(c.q)}</b></p><div class="tw-opts">${opts.map((o) => `<button class="btn small" ${L('quiz|' + encodeURIComponent(o))}>${esc(o)}</button>`).join('')}</div></div>`;
}
function portPanel(S, ui) {
  const i = ui.sel != null ? ui.sel : (S.ships[0].at != null ? S.ships[0].at : S.home), Pt = PORTS[i], st = S.ports[i], band = BANDS.find((b) => b.id === Pt.band);
  const docked = S.ships.filter((x) => x.at === i && !x.voyage), sh = docked.find((x) => x.id === ui.ship) || docked[0] || null;
  const ask = S.asks.find((x) => x.port === i && !x.done);
  let h = `<div class="card tw-port-card${st.lit ? ' lit' : ' dim'}">
    <div class="tw-banner" style="background-image:url(art/game-tw-port-${Pt.band}.webp)"><div><p class="kicker">${esc(OCEANS[Pt.ocean])} · ${esc(Pt.country)}${V.isYard(i) ? ' · shipyard' : ''}</p><h3>${ico(st.lit ? 'sun' : 'moon')} ${esc(Pt.n)}${i === S.home ? ' <span class="chip">home</span>' : ''}</h3></div></div>
    <p class="small">${band.glyph} ${esc(band.name)}: grows <b>${esc(band.goodName)}</b>. ${st.lit ? `Its lamp is lit.` : `<b>Dark.</b> Sell it anything but ${esc(band.goodName)} and its lamp is lit again.`}</p>
    ${ask ? `<p class="small tw-askline">🙏 Asks for ten crates of ${goodTag(ask.good)} — ${ask.until - S.turn} months left.</p>` : ''}`;
  if (!sh) { h += `<p class="muted small">No ship of yours is here. ${S.ships.some((x) => !x.voyage) ? 'Choose a ship in the Fleet tab, or tap a port where one is waiting.' : ''}</p></div>`; return h; }
  if (docked.length > 1) h += `<div class="tw-docked">${docked.map((x) => `<button class="btn small${x.id === sh.id ? ' primary-o' : ''}" ${L('ship|' + x.id)}>${ico('ship')} ${esc(x.name)}</button>`).join('')}</div>`;
  const m = V.marks(S, sh);
  h += `<p class="small"><b>${esc(sh.name)}</b> · ${esc(V.classOf(sh).name)}${sh.hull < 10 ? ` · hull ${sh.hull}/10` : ''}${sh.mast ? ' · a mast down' : ''}</p>
    <div class="tw-marks">${MARKS.map((x) => markBar(x, m[x.id])).join('')}</div>
    <p class="small">Hold: ${holdLine(S, sh)}</p>
    <div class="row gap wrap"><button class="btn primary" ${L('plan|' + sh.id)}>${ico('ship')} Plan a voyage</button></div>`;
  /* the market */
  const g = Pt.good, bp = V.buyPrice(S, i), sells = Object.keys(GOODS).filter((x) => V.holdOf(sh, x));
  h += `<div class="tw-sec"><p class="kicker">🏪 Market</p>
    ${st.lit ? `<p class="small">Buy ${goodTag(g)} at ${cash(bp)} a crate · ${st.stock} in the market.</p><div class="tw-opts">${[1, 4].map((n) => `<button class="btn small" ${L('buy|' + n)}>Buy ${n}</button>`).join('')}<button class="btn small" ${L('buy|999')}>Fill the hold</button></div>` : '<p class="small muted">A dark port sells nothing — but it will buy.</p>'}
    ${sells.map((x) => `<p class="small">${goodTag(x)} ×${V.holdOf(sh, x)} sells here at ${cash(V.sellPrice(S, i, x))}${x === g ? ' (they grow it here — cheap)' : !st.lit ? ' — <b>and lights the port</b>' : ''}. <button class="btn small" ${L('sell|' + x)}>Sell all</button></p>`).join('')}
    <p class="tiny muted">A crate of what a port cannot grow is worth more the farther its climate — until many ships bring the same.</p></div>`;
  /* sights */
  const sights = V.sightsOf(i).filter((s) => (s.era || 0) <= S.era);
  h += `<div class="tw-sec"><p class="kicker">🧭 Ashore</p>${sights.map((s) => st.seen[s.id] != null ? `<details class="tw-sight"><summary>✓ ${esc(s.t)}</summary><p class="small">${esc(s.say)}</p></details>` : `<button class="btn small tw-sight-b" ${L('sight|' + s.id)}>${esc(s.t)} · +15 XP</button>`).join('')}</div>`;
  /* the board */
  const jobs = V.board(S, i);
  if (jobs.length) h += `<div class="tw-sec"><p class="kicker">📜 Assignment board</p><ul class="tw-jobs">${jobs.map((j) => `<li${(S.lit || {})[j.key] && j.forged ? ' class="glow"' : ''}><span class="small">${jobLine(S, j)}${(S.lit || {})[j.key] ? (j.forged ? ' — <b>it glows: a forgery</b>' : ' — true') : ''}</span>
      <span class="tw-opts"><button class="btn small" ${L('sign|' + j.key)}>Sign</button>${j.kind === 'letter' && V.hasGift(S, 'truthlight') && !(S.lit || {})[j.key] ? `<button class="btn small" ${L('truth|' + j.key)}>🔦 Truthlight</button>` : ''}${(S.lit || {})[j.key] && j.forged ? `<button class="btn small" ${L('refuse|' + j.key)}>Refuse it</button>` : ''}</span></li>`).join('')}</ul></div>`;
  if (sh.jobs.length) h += `<p class="small">Signed: ${sh.jobs.map((j) => jobLine(S, j)).join('<br>')}</p>`;
  if (V.canRelight(S) && Pt.n === 'Aden') h += `<div class="tw-sec"><p class="kicker">🕯️ Saltreach</p><p class="small">The bare rock in the strait has been dark for twenty-five years. Lamp, glass and oil: ${cash(150)}.</p><button class="btn small primary-o" ${L('relight')}>Relight Saltreach</button></div>`;
  /* the shipyard */
  if (V.isYard(i)) {
    const ups = INVENTIONS.filter((u) => u.era <= S.era), cls = CLASSES.filter((c) => c.era <= S.era), rc = V.repairCost(sh);
    h += `<div class="tw-sec"><p class="kicker">🔨 Shipyard</p>${rc ? `<p class="small">Mend the ${esc(sh.name)}: ${cash(rc)} <button class="btn small" ${L('repair')}>Mend</button></p>` : ''}
      <p class="small"><b>Inventions</b> for the ${esc(sh.name)}:</p><ul class="tw-buy">${ups.map((u) => { const no = V.canUpgrade(S, sh, u.id); return `<li><span class="small"><b>${esc(u.name)}</b> — ${esc(MARKS.find((x) => x.id === u.mark).name)} +${u.plus}. ${esc(u.says)}</span>${sh.ups.includes(u.id) ? '<span class="chip">fitted</span>' : `<button class="btn small" ${L('upgrade|' + u.id)} ${no ? `aria-disabled="true" title="${esc(no)}"` : ''}>${cash(u.price)}</button>`}</li>`; }).join('')}</ul>
      <p class="small"><b>Ships</b> (${S.ships.length} of 10):</p><ul class="tw-buy">${cls.map((c) => { const no = V.canBuyShip(S, i, c.id); return `<li><span class="small"><b>${esc(c.name)}</b> — ${MARKS.map((x) => `${x.glyph}${c.m[x.id]}`).join(' ')}. ${esc(c.says)}</span><button class="btn small" ${L('buyship|' + c.id)} ${no ? `aria-disabled="true" title="${esc(no)}"` : ''}>${cash(c.price)}</button></li>`; }).join('')}</ul></div>`;
  }
  h += quizCard(S) + '</div>';
  return h;
}
function planCard(S, ui) {
  const sh = S.ships.find((x) => x.id === ui.ship); if (!sh || sh.at == null) return '';
  const from = sh.at, cargo = firstGood(sh), jobsTo = new Set(sh.jobs.map((j) => j.to));
  const cands = PORTS.map((P) => P.i).filter((j) => j !== from).map((j) => ({ j, km: haversine(PORTS[from].at, PORTS[j].at) })).sort((a, b) => a.km - b.km).slice(0, 30);
  const opts = cands.map((x) => ({ ...x, p: V.planFor(S, sh.id, from, x.j) })).filter((x) => x.p).map((x) => {
    const dark = !S.ports[x.j].lit, lightIt = dark && cargo && PORTS[x.j].good !== cargo, ask = S.asks.some((a) => a.port === x.j && !a.done && cargo === a.good), job = jobsTo.has(x.j);
    return { ...x, dark, lightIt, ask, job, rank: (job ? 0 : ask ? 1 : lightIt ? 2 : dark ? 4 : 3) * 100 + x.p.months };
  }).sort((a, b) => a.rank - b.rank).slice(0, 12);
  const P = ui.plan, D = ui.dest != null ? PORTS[ui.dest] : null, r = P && P.risk;
  const tavi = S.crew.tavi === 'aboard';
  return `<div class="card tw-plan-card">
    <p class="kicker">The ${esc(sh.name)} from ${esc(PORTS[from].n)} · ${holdLine(S, sh)}</p>
    ${P ? `<h3>To ${esc(D.n)}: ${P.months} ${P.months === 1 ? 'month' : 'months'}</h3>
      <p class="small">${fmtKm(P.km)}${P.via.length ? ` · by way of ${P.via.map((v) => esc(PORTS[v].n)).join(', ')}` : ''}.</p>
      ${Object.keys(P.help).length ? `<p class="small tw-good">💨 With ${Object.keys(P.help).map((k) => WINDNAME[k]).join(' and ')} behind you.</p>` : ''}
      ${Object.keys(P.against).length ? `<p class="small tw-bad">🌬️ Against ${Object.keys(P.against).map((k) => WINDNAME[k]).join(' and ')}.</p>` : ''}
      ${P.pass.length ? `<p class="small">🧭 Through ${P.pass.map((id) => esc(PASS[id].name)).join(', ')}.</p>` : ''}
      <ul class="tw-risks small">${tavi ? `<li>🏴 Dark water: ${Math.round(r.dark * 100)}% of the way · pirates ${Math.round(r.pirates * 100)}% likely <span class="muted">(Tavi’s gossip)</span></li>` : ''}
        ${r.cyclone ? `<li>🌀 Cyclone season on the way${S.crew.farida === 'aboard' ? ' — Farida says: wait' : ''}</li>` : ''}${r.mega.length ? '<li>🌊 Great-wave waters</li>' : ''}${r.bergs ? '<li>🧊 Spring icebergs</li>' : ''}${r.fog.length ? '<li>🌫️ Fog likely</li>' : ''}
        ${!r.cyclone && !r.mega.length && !r.bergs && !r.fog.length && r.pirates < 0.1 ? '<li>☀️ A quiet sea, as far as anyone can tell</li>' : ''}</ul>
      <p class="small">${!cargo ? 'You sail empty — buy before you go, or carry jobs.' : PORTS[D.i].good === cargo ? `${esc(D.n)} grows its own ${esc(GOODS[cargo].goodName)} — it will pay little.` : !S.ports[D.i].lit ? `<b>Sell your ${esc(GOODS[cargo].goodName)} there and ${esc(D.n)} is lit.</b>` : `${esc(D.n)} will pay ${cash(V.sellPrice(S, D.i, cargo))} a crate today.`}</p>
      ${V.rankAt(S, 'commodore') && sh.id !== 1 ? `<label class="small tw-route"><input type="checkbox" ${L('routeset')} ${ui.route ? 'checked' : ''}> Make it a standing route: buy, sail, sell, and back — by itself</label>` : ''}
      <div class="row gap wrap"><button class="btn primary" ${L('go')}>${ico('ship')} Set sail <kbd>Enter</kbd></button><button class="btn ghost" ${L('cancel')}>Cancel <kbd>Esc</kbd></button></div>`
    : '<p class="small">Where to? Tap a port on the chart, or pick one:</p>'}
    <ul class="tw-dests">${opts.map((o) => `<li><button class="${o.j === ui.dest ? 'on' : ''}" ${L('dest|' + o.j)}>${ico(o.job ? 'flag' : o.ask ? 'heart' : o.lightIt ? 'sparkle' : o.dark ? 'moon' : 'sun')} <b>${esc(PORTS[o.j].n)}</b> <span>${o.p.months} mo${o.job ? ' · your job' : o.ask ? ' · asked for it' : o.lightIt ? ' · will light' : ''}</span></button></li>`).join('')}</ul>
  </div>`;
}

/* ------------------------------------------------------------------ the fleet, the captain, the log */
function fleetPanel(S, ui) {
  return `<div class="card tw-fleet-card"><p class="kicker">The fleet · ${S.ships.length} of 10</p>${S.ships.map((sh) => { const m = V.marks(S, sh);
    return `<div class="tw-shiprow${ui.ship === sh.id ? ' on' : ''}"><p><b>${sh.id === 1 ? '🐢 ' : ''}${esc(sh.name)}</b> · ${esc(V.classOf(sh).name)}${sh.route ? ` · ⇄ ${esc(PORTS[sh.route[0]].n)}–${esc(PORTS[sh.route[1]].n)}` : ''}</p>
      <p class="small">${sh.voyage ? `At sea for ${esc(PORTS[sh.voyage.to].n)} — ${sh.voyage.left} ${sh.voyage.left === 1 ? 'month' : 'months'}` : `In <button class="linkish" ${L('sel|' + sh.at)}>${esc(PORTS[sh.at].n)}</button>`} · ${holdLine(S, sh)}${sh.hull < 10 ? ` · hull ${sh.hull}/10` : ''}</p>
      <div class="tw-marks">${MARKS.map((x) => markBar(x, m[x.id])).join('')}</div>${sh.ups.length ? `<p class="tiny muted">${sh.ups.map((u) => esc(INVENTIONS.find((x) => x.id === u).name)).join(' · ')}</p>` : ''}</div>`; }).join('')}
    <p class="tiny muted">Shelly sails in the ${esc(S.ships[0].name)} (🐢): her gifts work on that ship.</p></div>`;
}
function captainPanel(S) {
  const rk = V.rankOf(S), ri = RANKS.indexOf(rk), nx = RANKS[ri + 1], pr = V.progress(S), book = BOOKS[Math.max(0, ...Object.keys(S.beats).map((b) => (BEATS[b] ? BEATS[b].book : 1))) - 1];
  const done = (a, b) => (a >= b ? '✓' : `${a}/${b}`);
  return `<div class="card tw-cap"><p class="kicker">${esc(book.name)} · Book ${book.n} of 5</p><h3>Shelby, ${esc(rk.name)}</h3>
    <p class="small">${S.xp.toLocaleString('en-US')} XP${nx ? ` · next: <b>${esc(nx.name)}</b> at ${nx.xp.toLocaleString('en-US')} XP and ${nx.ships} ${nx.ships === 1 ? 'ship' : 'ships'}` : ''}.</p>
    ${nx ? `<span class="tw-meter"><i style="width:${Math.min(100, Math.round((S.xp / nx.xp) * 100))}%"></i></span>` : ''}
    <ul class="tw-goal small"><li>🏮 Ports lit ${done(pr.lit, pr.ports)}</li><li>🏅 Expeditions ${done(pr.sealed, 10)}</li><li>🔧 Inventions ${done(pr.inv, pr.invAll)}</li><li>⛵ Ships ${done(pr.ships, 10)}</li></ul>
    <p class="kicker">Keeper’s Gifts</p><ul class="tw-gifts">${GIFTS.map((g) => `<li class="${S.gifts[g.id] != null ? 'on' : ''}"><span>${g.glyph}</span><span class="small"><b>${esc(g.name)}</b> — ${S.gifts[g.id] != null ? `${esc(g.does)} <i>${esc(g.cost)}</i>` : `wakes: ${esc(g.when)}`}</span></li>`).join('')}</ul>
    ${S.rest > S.turn ? '<p class="small tw-bad">Shelly is resting: no gift works until next month.</p>' : ''}
    <p class="kicker">The crew</p><ul class="tw-crew">${Object.entries(CREW).map(([id, c]) => `<li class="${S.crew[id] === 'aboard' ? 'on' : ''}"><span>${c.glyph}</span><span class="small"><b>${esc(c.name)}</b> · ${esc(c.role)} — ${S.crew[id] === 'aboard' ? esc(c.does) : S.crew[id] === 'away' ? 'gone home for a while' : S.crew[id] === 'ashore' ? 'ashore now; the knot stays with Shelby' : 'not met yet'}</span></li>`).join('')}</ul>
    <p class="kicker">Expeditions ${V.rankAt(S, 'captain') ? '' : '<span class="muted">— they open when Shelby is a Captain</span>'}</p>
    <ul class="tw-exps">${EXPEDITIONS.map((e) => { const [a, b] = V.expProgress(S, e.id); return `<li class="${S.ex[e.id] != null ? 'on' : ''}"><span class="small"><b>${S.ex[e.id] != null ? '🏅' : '○'} ${esc(e.name)}</b> — ${esc(e.goal)}${b > 1 && S.ex[e.id] == null ? ` (${a}/${b})` : ''}</span></li>`; }).join('')}</ul>
    <p class="kicker">Earned, never sold</p><ul class="tw-earned small">${EARNED.map((e) => `<li class="${S.earned[e.id] != null ? 'on' : ''}">${S.earned[e.id] != null ? '🎖️' : '○'} <b>${esc(e.name)}</b> — ${esc(MARKS.find((m) => m.id === e.mark).name)} +${e.plus}. ${esc(e.how)}</li>`).join('')}</ul></div>`;
}
function logPanel(S) {
  const ids = Object.keys(S.logs);
  return `<div class="card tw-logs"><p class="kicker">The Ship’s Log · ${ids.length} of ${Object.keys(LOG).length} cards</p>
    ${ids.length ? `<ul>${ids.map((id) => `<li><b>${esc(LOG[id].t)}</b><p class="small">${esc(LOG[id].fact)}</p><p class="tiny muted">${esc(LOG[id].src)}</p></li>`).join('')}</ul>` : '<p class="small muted">A card is written when the thing happens at sea or ashore.</p>'}
    <details class="tw-log"><summary>What happened</summary><ul>${S.log.slice(0, 20).map((l) => `<li class="small">${esc(l)}</li>`).join('')}</ul></details></div>`;
}

/* ------------------------------------------------------------------ cards over the chart */
function dangerPop(S) {
  const c = V.dangerCard(S); if (!c) return '';
  const sh = S.ships.find((x) => x.id === S.pending[0].ship);
  return `<div class="tw-pop" role="dialog" aria-label="${esc(c.title)}"><div class="tw-pop-card tw-danger"><div class="tw-pop-body">
    <p class="kicker">Danger · the ${esc(sh.name)} · the clock has stopped</p><h2>${esc(c.title)}</h2><p id="tw-d-t">${esc(c.text)}</p>
    ${c.log ? `<p class="small tw-logline">📖 ${esc(LOG[c.log].fact)}</p>` : ''}
    <ol class="tw-choices">${c.choices.map((x, k) => `<li><button class="btn${k ? '' : ' primary-o'}" ${L('choose|' + x.id)}><kbd>${k + 1}</kbd> <b>${esc(x.label)}</b><span class="small">${esc(x.cost)}</span></button></li>`).join('')}</ol>
    <p class="tiny muted">The crew always comes home. A ship can lose cargo, time, a mast or coin — never a sailor.</p>${readBtn('#tw-d-t')}</div></div></div>`;
}
function beatPop(id) {
  const b = BEATS[id]; if (!b) return '';
  return `<div class="tw-pop" role="dialog" aria-label="${esc(b.title)}"><div class="tw-pop-card tw-beat"><div class="tw-pop-shelly">${shelly(id === 'longlight' ? 'cheer' : 'wave', 96)}</div><div class="tw-pop-body">
    <p class="kicker">Book ${b.book} · ${esc(BOOKS[b.book - 1].name)}</p><h2>${esc(b.title)}</h2><p id="tw-b-t">${esc(b.text)}</p>
    ${b.log ? `<p class="small tw-logline">📖 <b>${esc(LOG[b.log].t)}:</b> ${esc(LOG[b.log].fact)}</p>` : ''}
    <div class="row gap wrap">${readBtn('#tw-b-t')}<button class="btn primary big" ${L('beatok')}>Sail on ${ico('next')} <kbd>Enter</kbd></button></div>
    <p class="tiny muted">A story: the people, the crowns, Saltreach and the Grey Gulls are made up. The places and every Ship’s Log card are real.</p></div></div></div>`;
}

/* ------------------------------------------------------------------ the screen */
export function view(ctx) {
  const S = S_(ctx), ui = ctx.ui, d = ctx.data;
  if (!S || ui.title) {
    return `<div class="gm-title card tw-title">
      <div class="gm-art" style="background-image:url(art/${TOOL.art}.webp)"><span class="gm-glyph" aria-hidden="true">${ico('ship')}</span></div>
      <div class="gm-body"><h2>${esc(TOOL.name)}: The Long Voyage</h2>
        <ol class="gm-how" id="gm-how"><li><b>1</b><span>Mumbai, 1800. Shelby has one small boat, a bosun, a stowaway — and Shelly. Sixty lights on the Lantern Road are dark.</span></li>
          <li><b>2</b><span>Go ashore: buy what a port grows, sell it where the climate cannot grow it. A dark port you sell to is <b>lit</b>. See the sights, sign assignments.</span></li>
          <li><b>3</b><span>Meet the sea: winds and monsoons, cyclones, great waves, ice, fog — and the Grey Gulls in the dark water. Choose well; the crew always comes home.</span></li>
          <li><b>4</b><span>Grow: inventions for your ships, Keeper’s Gifts for Shelly, ten expeditions, ten ships — across a century, from sail to steam to the canals.</span></li></ol>
        ${readBtn('#gm-how', 'Read how to play')}
        <ul class="tw-ages" aria-label="Four ages to sail through">${ERAS.map((e) => `<li><img src="art/game-tw-era-${e.id}.webp" alt=""><b>${esc(e.name.replace(/^The /, ''))}</b><small>${e.year}</small></li>`).join('')}</ul>
        ${S && !S.won ? `<div class="row gap wrap gm-starts"><button class="btn big primary" ${L('resume')}>${ico('ship')} Carry on — ${MONTHS[S.month]} ${S.year}, ${V.litCount(S)} of ${PORTS.length} lit</button></div><p class="muted small">Or begin again:</p>` : ''}
        <div class="row gap wrap gm-starts"><button class="btn big${S && !S.won ? '' : ' primary'}" ${L('new')}>Begin the voyage from Mumbai</button></div>
        ${d.best ? `<p class="muted small">Your best voyage: ${esc(d.best)}.</p>` : ''}
        <details class="src"><summary>How this game is made — and where it simplifies</summary>
          <p class="small">The sea lanes were measured from this app’s own map. Winds, storms, ice and fog are simplified to bands of latitude, boxes of sea and months; each port trades one cargo for its climate band; a turn is a month, and when a new age opens the calendar jumps to the year it really began. Which ports have shipyards is a game simplification. The story’s people, its two crowns, Saltreach and the Grey Gulls are invented; the places, the ages and every Ship’s Log card are real, with their sources below.</p>
          <ul>${[...PORT_SRC, ...STRAITS_SRC, ...ERAS_SRC, ...WIND_SRC, ...LOG_SRC].map((s) => `<li>${esc(s)}</li>`).join('')}</ul></details>
        ${TRADEWINDS_NEEDS_REVIEW ? '<p class="t-review">✎ Awaiting a second reader: the winds, seasons, dates and Ship’s Log are checked against the sources, but not yet by a second person.</p>' : ''}
      </div></div>`;
  }
  if (S.won && !ui.stay) {
    return `<div class="card end-card gm-end tw-end">${shelly('cheer', 120)}<p class="kicker">Sixty lights · the Long Light</p>
      <h2>Captain of the Fleet</h2>
      <p>Every port lit, all ten expeditions sealed, every invention fitted, ten ships — from ${ERAS[0].year} to ${S.year}.</p>
      <p>${S.stats.voyages} voyages · ${fmtKm(S.stats.km)} sailed · ${S.stats.dangers} dangers met well · ${Object.keys(S.logs).length} Ship’s Log cards.</p>
      <div class="row gap center"><button class="btn primary big" ${L('title')}>Sail again</button><button class="btn big" ${L('stay')}>Look at my world</button></div></div>`;
  }
  const E = ERAS[S.era], nx = ERAS[S.era + 1], K = markScale(), vb = phoneView(S, ui), Ly = layers(S, ui, K, vb), lit = V.litCount(S), rk = V.rankOf(S);
  const toNext = nx ? Math.min(100, Math.round(((S.goodwill - E.need) / (nx.need - E.need)) * 100)) : 100;
  const fill = {}; PORTS.forEach((P, i) => { if (S.ports[i].lit) fill[P.cc] = 'twlit'; });
  const season = HAZARDS.cyclones.north.includes(S.month) || HAZARDS.cyclones.south.includes(S.month);
  const tab = ui.tab || 'port', beat = (ui.beats || [])[0];
  const pop = S.pending.length ? dangerPop(S) : beat ? beatPop(beat) : ui.eraShow != null ? `<div class="tw-pop" role="dialog" aria-label="${esc(ERAS[ui.eraShow].name)}"><div class="tw-pop-card"><div class="tw-pop-art" style="background-image:url(art/game-tw-era-${ERAS[ui.eraShow].id}.webp)"></div>
      <div class="tw-pop-body"><p class="kicker">A new age · ${ERAS[ui.eraShow].year}</p><h2>${esc(ERAS[ui.eraShow].name)}</h2><p id="tw-pop-t">${esc(ERAS[ui.eraShow].card)}</p>
      <div class="row gap wrap">${readBtn('#tw-pop-t')}<button class="btn primary big" ${L('eraok')}>Sail on ${ico('next')} <kbd>Enter</kbd></button></div></div></div></div>` : '';
  return `<div class="tw tw-e-${E.id}">
    <div class="tw-bar">
      <div class="tw-when"><span class="tw-m">${MONTHS[S.month]}</span><span class="tw-y">${S.year}</span></div>
      <div class="tw-era"><img src="art/game-tw-era-${E.id}.webp" alt=""><div><b>${esc(E.name)}</b>
        <span class="tw-meter" title="Goodwill: from lighting ports, trading, jobs and helping" role="img" aria-label="Goodwill ${S.goodwill}${nx ? ` of ${nx.need} for ${esc(nx.name)}` : ''}"><i style="width:${toNext}%"></i></span>
        <small>${ico('hands')} ${S.goodwill}${nx ? ` · ${nx.need} for ${esc(nx.name)}` : ' goodwill'}</small></div></div>
      <div class="tw-lit"><b>${lit}</b><small>of ${PORTS.length} lit</small><span class="tw-meter gold"><i style="width:${Math.round((lit / PORTS.length) * 100)}%"></i></span></div>
      <div class="tw-fleet">${cash(S.coin)} · ⭐ ${esc(rk.name)} · ${S.xp.toLocaleString('en-US')} XP</div>
    </div>
    <div class="tw-main">
      <div class="tw-map" style="${shipVars(ctx.kid)}">${worldSVG({ key: 'tw', tap: true, grat: false, fill, view: vb, under: Ly.under, extra: Ly.extra, label: 'Trade Winds chart: tap a port' })}
        <div class="tw-zoom">${[['in', 'plus', 'Zoom in'], ['out', 'minus', 'Zoom out'], ['home', 'reset', 'Back to the start view']].map(([h, i, l]) => `<button class="btn small" data-act="mapZoom" data-arg="tw|${h}" aria-label="${l}">${ico(i)}</button>`).join('')}</div>
        <p class="tw-legend small"><span class="tw-lg w"><svg viewBox="-18 -6 34 12" width="30" height="11"><path d="M-16 0C-10 -3.5 -4 3.5 2 0S10 -2.5 13 0M9 -3.2L13.5 0L9 3.2" fill="none" stroke="currentColor" stroke-width="2"/></svg> this month’s winds</span>${MONSOON.sw.includes(S.month) ? '<span class="tw-lg m">summer monsoon blows north-east</span>' : MONSOON.ne.includes(S.month) ? '<span class="tw-lg m">winter monsoon blows south-west</span>' : ''}${season ? '<span class="tw-lg s">cyclone season</span>' : ''}${HAZARDS.ice.north.includes(S.month) || HAZARDS.ice.south.includes(S.month) ? '<span class="tw-lg i">sea ice</span>' : ''}<span class="tw-lg p">lit port</span>${V.hasGift(S, 'deepspeech') ? '<span class="tw-lg z">light round the lit ports — beyond it, dark water</span>' : ''}</p>
        ${pop}</div>
      <aside class="tw-side">
        ${newsCard(S)}
        <div class="seg tw-tabs" role="tablist" aria-label="Trade Winds">${[['port', 'Ashore', 'anchor'], ['fleet', 'Fleet', 'ship'], ['captain', 'Captain', 'star'], ['log', 'Log', 'book']].map(([id, l, i]) => `<button role="tab" aria-selected="${tab === id}" class="${tab === id ? 'on' : ''}" ${L('tab|' + id)}>${ico(i)} ${l}</button>`).join('')}</div>
        ${tab === 'port' ? (ui.planning && ui.ship ? planCard(S, ui) : portPanel(S, ui)) : tab === 'fleet' ? fleetPanel(S, ui) : tab === 'captain' ? captainPanel(S) : logPanel(S)}
        <div class="row gap wrap tw-actions"><button class="btn ${ui.planning ? '' : 'primary '}big" ${L('next')} ${S.pending.length ? 'disabled' : ''}>Next month ${ico('next')} <kbd>N</kbd></button><button class="btn ghost" ${L('title')}>${ico('menu')} Menu</button></div>
      </aside></div></div>`;
}

/* ------------------------------------------------------------------ actions */
function nearestPort(at) { let best = null, bd = 700; for (const P of PORTS) { const k = haversine(at, P.at); if (k < bd) { bd = k; best = P.i; } } return best; }
function setDest(S, ui, j) { const sh = S.ships.find((x) => x.id === ui.ship); if (!sh || sh.at == null || j === sh.at) return; ui.dest = j; ui.plan = V.planFor(S, sh.id, sh.at, j); }
function selPort(S, ui, j) { ui.sel = j; ui.dest = null; ui.plan = null; ui.planning = false; ui.tab = 'port'; const f = S.ships.find((x) => x.at === j && !x.voyage); ui.ship = f ? f.id : ui.ship; }
/* what the month (or a sale) brought: the family's rewards, and the story's cards, once each */
function take(S, ctx, from) {
  const ui = ctx.ui, d = ctx.data, fresh = S.news.slice(from);
  for (const n of fresh) {
    if (n.k === 'wake') { ctx.tick(true); if (ctx.earn) ctx.earn('stop'); d.lit = Math.max(d.lit || 0, V.litCount(S)); ctx.confetti(14); ctx.sfx.good(); }
    if (n.k === 'job' && !n.job.forged) ctx.tick(true);
    if (n.k === 'sealed') { if (ctx.earn) ctx.earn('mastered'); ctx.confetti(40); ctx.sfx.level(); d.sealed = Object.keys(S.ex).length; }
    if (n.k === 'era') { ui.eraShow = n.era; ctx.sfx.level(); ctx.confetti(30); d.era = Math.max(d.era || 0, S.era); if (ctx.earn) ctx.earn('mastered'); }
    if (n.k === 'beat') (ui.beats = ui.beats || []).push(n.id);
    if (n.k === 'won') { d.wins = (d.wins || 0) + 1; d.best = `${S.year} — every light lit`; if (ctx.session) ctx.session(); if (ctx.earn) ctx.earn('contest'); }
  }
}
export function act(name, arg, ctx) {
  const ui = ctx.ui, d = ctx.data;
  if (name === 'new') { d.save = V.newGame('lv' + Date.now()); d.plays = (d.plays || 0) + 1; const S = d.save; Object.assign(ui, { title: false, sel: S.home, ship: 1, dest: null, plan: null, planning: false, stay: false, eraShow: null, tab: 'port', beats: [] }); take(S, ctx, 0); ctx.sfx.click(); ctx.save(); return; }
  if (name === 'resume') { ui.title = false; ui.eraShow = null; return; }
  if (name === 'title') { ui.title = true; ui.ship = null; ui.plan = null; ui.dest = null; ui.planning = false; return; }
  if (name === 'stay') { ui.stay = true; return; }
  if (name === 'eraok') { ui.eraShow = null; ctx.sfx.click(); return; }
  if (name === 'beatok') { (ui.beats || []).shift(); ctx.sfx.click(); return; }
  if (name === 'tab') { ui.tab = arg; ui.planning = false; ui.plan = null; ui.dest = null; return; }
  const S = S_(ctx); if (!S) return;
  const n0 = S.news.length, fail = (r) => { if (r && r.error) { ctx.toast(r.error); return true; } return false; };
  const shNow = () => S.ships.find((x) => x.id === ui.ship && !x.voyage) || S.ships.find((x) => x.at === ui.sel && !x.voyage);
  if (name === 'sel') selPort(S, ui, +arg);
  else if (name === 'ship') { ui.ship = +arg; ui.dest = null; ui.plan = null; }
  else if (name === 'plan') { ui.ship = +arg; ui.planning = true; ui.dest = null; ui.plan = null; ui.route = false; }
  else if (name === 'dest') setDest(S, ui, +arg);
  else if (name === 'cancel') { ui.planning = false; ui.dest = null; ui.plan = null; }
  else if (name === 'routeset') ui.route = !ui.route;
  else if (name === 'tap') {
    const t = JSON.parse(arg); if (t.lat == null || ui.eraShow != null || S.pending.length || (ui.beats || []).length) return;
    const j = nearestPort([t.lat, t.lng]); if (j == null) return;
    if (ui.planning && ui.ship) setDest(S, ui, j); else selPort(S, ui, j);
  } else if (name === 'go' && ui.ship && ui.dest != null) {
    const sh = S.ships.find((x) => x.id === ui.ship), from = sh && sh.at, to = ui.dest;
    const r = V.sail(S, ui.ship, to); if (fail(r)) return;
    if (ui.route && from != null) { sh.voyage = sh.voyage; sh.route = [from, to]; }
    ctx.sfx.click(); ui.planning = false; ui.plan = null; ui.dest = null; d.voyages = (d.voyages || 0) + 1;
  } else if (name === 'next') {
    S.news = []; const r = V.nextMonth(S); if (fail(r)) return;
    ui.plan = null; ui.dest = null; ui.planning = false;
    take(S, ctx, 0); if (!S.news.some((n) => n.k === 'wake')) ctx.sfx.click();
    if (ui.sel == null || !S.ships.some((x) => x.at === ui.sel)) { const a = S.news.find((n) => n.k === 'arrive'); if (a) selPort(S, ui, a.port); }
    ctx.save(); return;
  } else if (name === 'buy') { const sh = shNow(); if (!sh) return; const r = V.buy(S, sh.id, +arg); if (!fail(r)) ctx.sfx.coin ? ctx.sfx.coin() : ctx.sfx.click(); }
  else if (name === 'sell') { const sh = shNow(); if (!sh) return; const r = V.sell(S, sh.id, arg); if (!fail(r)) ctx.sfx.click(); }
  else if (name === 'sight') { const r = V.visitSight(S, ui.sel, arg); if (!fail(r)) { ctx.tick(true); ctx.sfx.good(); } }
  else if (name === 'sign') { const sh = shNow(); if (!sh) return; const r = V.accept(S, sh.id, arg); if (!fail(r)) { ctx.sfx.click(); ctx.toast('Signed. The job sails with the ' + sh.name + '.'); } }
  else if (name === 'truth') { const r = V.truthlight(S, ui.sel, arg); if (!fail(r)) ctx.toast(r.forged ? 'It glows: a forgery.' : 'The letter is true.'); }
  else if (name === 'refuse') { V.decline(S, ui.sel, arg, 'forged'); ctx.toast('You refuse the forged letter — and both crowns hear of it.'); }
  else if (name === 'upgrade') { const sh = shNow(); if (!sh) return; if (!fail(V.upgrade(S, sh.id, arg))) ctx.sfx.good(); }
  else if (name === 'buyship') { const r = V.buyShip(S, ui.sel, arg); if (!fail(r)) { ctx.sfx.level(); ctx.confetti(20); ui.ship = r.ship.id; } }
  else if (name === 'repair') { const sh = shNow(); if (sh) fail(V.repair(S, sh.id)); }
  else if (name === 'relight') { fail(V.relight(S)); }
  else if (name === 'quiz') { const right = V.answerQuiz(S, S.quiz, decodeURIComponent(arg)); if (right) { ctx.tick(true); ctx.sfx.good(); ctx.toast('Right — +10 XP.'); } else { ctx.sfx.bad(); ctx.toast('Not this time — it is in your Log.'); } }
  else if (name === 'choose') { const r = V.resolve(S, arg); if (fail(r)) return; r.averted ? ctx.sfx.good() : ctx.sfx.bad(); if (r.out) ctx.toast(r.out); }
  take(S, ctx, n0);
  ctx.save();
}
export function key(e, ctx) {
  const S = S_(ctx), ui = ctx.ui; if (!S || ui.title || (S.won && !ui.stay)) return false;
  if (S.pending.length) { const c = V.dangerCard(S), k = +e.key; if (k >= 1 && k <= c.choices.length) { act('choose', c.choices[k - 1].id, ctx); return true; } return false; }
  if ((ui.beats || []).length) { if (e.key === 'Enter' || e.key === 'Escape') { act('beatok', '', ctx); return true; } return false; }
  if (ui.eraShow != null) { if (e.key === 'Enter' || e.key === 'Escape') { act('eraok', '', ctx); return true; } return false; }
  if (e.key === 'n' || e.key === 'N') { act('next', '', ctx); return true; }
  if (e.key === 'Escape' && ui.planning) { act('cancel', '', ctx); return true; }
  if (e.key === 'Enter' && ui.plan) { act('go', '', ctx); return true; }
  return false;
}
export function selftest(ok) {
  ok(PORTS.length === 60 && PORTS.every((P) => P.at && P.good), `sixty ports, each with a place and a cargo (${PORTS.length})`);
  ok(new Set(PORTS.map((P) => P.band)).size === 4, 'all four climate bands have ports');
  const S = V.newGame('selftest');
  ok(S.ships.length === 1 && S.ships[0].name === 'Small Hope' && V.marks(S, S.ships[0]).cargo === 2 && V.capacity(S, S.ships[0]) === 8, 'the voyage begins with the Small Hope: cargo 2, eight crates');
  ok(Object.values(BEATS).every((b) => b.book >= 1 && b.book <= 5 && b.text.length > 40 && (!b.log || LOG[b.log])), 'every story beat has its book, its words, and a real Log card');
  ok(Object.values(LOG).every((c) => c.src && c.w.length >= 3 && !c.w.includes(c.a) && !c.q.toLowerCase().includes(c.a.toLowerCase())), 'every Log card has a source, and a question that does not give its answer');
  ok(!/\b(dies|died|killed|drowned|blood)\b/i.test(JSON.stringify(BEATS)), 'the story beats keep harm elliptical');
}
