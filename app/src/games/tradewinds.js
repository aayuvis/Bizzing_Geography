/* Shelly's Trade Winds — the screen. The rules are in tw-engine.js; the facts in tw-data.js.

   One big map: this month's winds as faint arrows (the monsoon turns round with the season),
   the season's storm and ice bands, the lanes the world has woken, ships at sea, and ports —
   asleep (grey) or awake (a lit lantern). A side panel: what this month brought, the port or
   the voyage being planned, the asks for help, the ships, the log.

   Keyboard and touch, both all the way: tap a port or pick it from a list; N = next month,
   Enter = set sail, Esc = cancel. Nothing moves until "Next month" (Sabhyata's Sochna). */
import { GAME_META } from './meta.js';
import { worldSVG, worldPath, project, countryAt, viewFor } from '../map.js';
import { geoArea, geoGraticule10 } from 'd3-geo';
import { haversine, fmtKm } from '../geo.js';
import { shelly } from '../mascot.js';
import { esc, ico, readBtn } from './kit.js';
import { shipVars } from '../rewards.js';
import { PORTS, HOMES, OCEANS, GOODS, newGame, plan, sail, nextMonth, wants, awakeCount, portFact, windAt } from './tw-engine.js';
import { ERAS, BANDS, MONTHS, STRAITS, CANALS, HAZARDS, MONSOON, TRADEWINDS_NEEDS_REVIEW, PORT_SRC, STRAITS_SRC, ERAS_SRC, WIND_SRC } from './tw-data.js';

export const TOOL = GAME_META.tradewinds;
export { PORTS };
const S_ = (ctx) => ctx.data.save || null;
const goodTag = (g) => (g ? `${GOODS[g].glyph} ${esc(GOODS[g].goodName)}` : 'nothing');
const PASS = { ...Object.fromEntries(STRAITS.map((s) => [s.id, s])), ...Object.fromEntries(Object.entries(CANALS).map(([id, c]) => [id, c])) };
const WINDNAME = { trades: 'the trade winds', westerlies: 'the westerlies', polar: 'the polar easterlies', monsoon: 'the monsoon' };

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
const portPin = (P, st, cls, label, K, sc) => { const xy = project(P.at); if (!xy) return '';
  return `<g class="pin tw-port ${cls}" transform="translate(${f1(xy[0])} ${f1(xy[1])}) scale(${sc})"><g transform="scale(${K})">
    ${st.awake ? '<circle class="halo" r="14"/>' : ''}<circle class="ring" r="9"/><circle class="core" r="${st.awake ? 4.6 : 3.4}"/>
    ${label ? `<text y="-12">${esc(label)}</text>` : ''}</g></g>`; };

function layers(S, ui, K, vb) {
  const sc = vb ? vb[2] / 1000 : 1, KS = K * sc;
  const under = [DEFS, `<path class="tw-sea" d="${worldPath({ type: 'Sphere' })}"/>`, `<path class="tw-waves" d="${worldPath({ type: 'Sphere' })}"/>`,
    `<path class="tw-grat" d="${worldPath(geoGraticule10())}"/>`, bandLayer(), hazardLayer(S.month, KS), `<g class="tw-winds">${windLayer(S.month, KS)}</g>`].join('');
  const out = [];
  for (const sh of S.ships) if (sh.voyage) out.push(`<path class="tw-voy" d="${worldPath(ll(sh.voyage.path))}"/>`);
  if (ui.plan) out.push(`<path class="tw-plan-glow" d="${worldPath(ll(ui.plan.path))}"/><path class="tw-plan" d="${worldPath(ll(ui.plan.path))}"/>`);
  PORTS.forEach((P, i) => {
    const st = S.ports[i], cls = [st.awake ? 'awake' : 'sleep', i === S.home ? 'home' : '', i === ui.sel ? 'sel' : '', i === ui.dest ? 'dest' : '', S.asks.some((x) => x.port === i && !x.done) ? 'asks' : ''].join(' ');
    out.push(portPin(P, st, cls, (st.awake && KS < 1.5) || i === ui.sel || i === ui.dest || i === S.home ? P.n : '', K, sc));
  });
  const docked = {}, sym = S.era >= 1 ? 'tw-steam' : 'tw-sail';
  for (const sh of S.ships) {
    let pos, west = false, dx = 0, dy = 0;
    if (sh.voyage) {
      const v = sh.voyage, f = (v.months - v.left + 0.5) / v.months; pos = alongPath(v.path, f);
      const a = project(alongPath(v.path, Math.max(0, f - 0.04))), b = project(alongPath(v.path, Math.min(1, f + 0.04))); west = a && b && b[0] < a[0];
    } else {          // ships in one port are drawn as one, with a count
      if (docked[sh.at] != null) continue;
      docked[sh.at] = S.ships.filter((x) => !x.voyage && x.at === sh.at).length; pos = PORTS[sh.at].at; dx = 13 * K * sc; dy = 8 * K * sc;
    }
    const xy = project(pos); if (!xy) continue;
    const cargo = sh.voyage ? sh.voyage.cargo : sh.cargo;
    out.push(`<g class="pin tw-ship${sh.voyage ? ' sea' : ' dock'}${ui.ship === sh.id ? ' on' : ''}" transform="translate(${f1(xy[0] + dx)} ${f1(xy[1] + dy)}) scale(${sc})"><g transform="scale(${(K * 1.3).toFixed(2)})"><g class="bob"><g transform="scale(${west ? -1 : 1} 1)">
      ${sh.voyage ? '<path class="wake" d="M-11 5L-22 2.5M-11 6.5L-21 9"/>' : ''}<use href="#${sym}" x="-13" y="-19" width="26" height="27" style="color:${cargo ? CARGO[cargo] : '#d64535'}"/></g>${!sh.voyage && docked[sh.at] > 1 ? `<g class="tw-count" transform="translate(11 -15)"><circle r="6.5"/><text>${docked[sh.at]}</text></g>` : ''}</g></g></g>`);
  }
  out.push(compass(K, vb));
  return { under, extra: out.join('') };
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

/* ------------------------------------------------------------------ the side panel */
function newsCard(news) {
  if (!news || !news.length) return '';
  const line = (n) => n.k === 'wake' ? `<li class="tw-n wake"><img class="tw-thumb" src="art/game-tw-port-${PORTS[n.port].band}.webp" alt="" loading="lazy"><span><b>${esc(PORTS[n.port].n)} wakes!</b> ${esc(portFact(n.port))}</span></li>`
    : n.k === 'helped' ? `<li class="tw-n help">❤️ <b>${esc(PORTS[n.port].n)}</b> got the ${esc(GOODS[n.good].goodName)} it asked for. +4 goodwill.</li>`
    : n.k === 'trade' ? `<li class="tw-n">🤝 ${esc(PORTS[n.port].n)} traded for your ${esc(GOODS[n.good].goodName)}.</li>`
    : n.k === 'arrive' ? `<li class="tw-n">⚓ A ship reached ${esc(PORTS[n.port].n)}${n.cargo ? ` — but ${esc(PORTS[n.port].n)} grows its own ${esc(GOODS[n.cargo].goodName)}, so the ship keeps it` : ''}.</li>`
    : n.k === 'ask' ? `<li class="tw-n ask">🙏 A lean season in <b>${esc(PORTS[n.port].n)}</b>: they ask for ${goodTag(n.good)} within six months.</li>`
    : n.k === 'ship' ? `<li class="tw-n">⛵ A new ship is ready at home.</li>`
    : n.k === 'pass' ? `<li class="tw-n pass">🧭 You sailed through the <b>${esc(PASS[n.id].name)}</b>, which joins ${esc(PASS[n.id].joins)}.</li>`
    : n.k === 'era' ? `<li class="tw-n era"><img class="tw-thumb" src="art/game-tw-era-${ERAS[n.era].id}.webp" alt="" loading="lazy"><span><b>${esc(ERAS[n.era].name)}</b> — ${esc(ERAS[n.era].card)}</span></li>` : '';
  const big = news.some((n) => n.k === 'wake' || n.k === 'era');
  return `<div class="card tw-news">${big ? `<div class="tw-shelly">${shelly(news.some((n) => n.k === 'era') ? 'cheer' : 'wave', 64)}</div>` : ''}<p class="kicker">This month</p><ul>${news.map(line).join('')}</ul></div>`;
}
function portCard(S, ui) {
  const i = ui.sel; if (i == null) return `<div class="card tw-help"><p>${shelly('point', 64)} <b>Tap a lit port</b> to send a ship. A sleeping port wakes when a ship brings it something its own climate cannot grow.</p></div>`;
  const P = PORTS[i], st = S.ports[i], docked = S.ships.filter((x) => x.at === i && !x.voyage), band = BANDS.find((b) => b.id === P.band);
  const ask = S.asks.find((x) => x.port === i && !x.done);
  return `<div class="card tw-port-card${st.awake ? ' lit' : ' dim'}">
    <div class="tw-banner" style="background-image:url(art/game-tw-port-${P.band}.webp)"><div><p class="kicker">${esc(OCEANS[P.ocean])} · ${esc(P.country)}</p><h3>${ico(st.awake ? 'sun' : 'moon')} ${esc(P.n)}${i === S.home ? ' <span class="chip">home</span>' : ''}</h3></div></div>
    <p class="small">${band.glyph} ${esc(band.name)}: grows <b>${esc(band.goodName)}</b>. ${st.awake ? `In store: <b>${st.stock}</b>.` : `Asleep — wants anything <b>but</b> ${esc(band.goodName)}.`}</p>
    ${ask ? `<p class="small tw-askline">🙏 Asks for ${goodTag(ask.good)} — ${ask.until - S.turn} months left.</p>` : ''}
    ${docked.length ? `<div class="tw-docked">${docked.map((sh) => `<button class="btn${ui.ship === sh.id ? ' primary-o' : ''}" data-act="lib" data-arg="tradewinds|ship|${sh.id}">${ico('ship')} Ship ${sh.id} · ${sh.cargo ? goodTag(sh.cargo) : st.awake && st.stock ? `will load ${goodTag(P.good)}` : 'empty'}</button>`).join('')}</div>
      <p class="muted small">${ui.ship ? 'Now tap where to sail — or choose below.' : 'Choose a ship, then where to send it.'}</p>` : st.awake ? '<p class="muted small">No ship in port.</p>' : ''}
  </div>`;
}
function planCard(S, ui) {
  const sh = S.ships.find((x) => x.id === ui.ship); if (!sh || sh.at == null) return '';
  const from = sh.at, st = S.ports[from], cargo = sh.cargo || (st.awake && st.stock > 0 ? PORTS[from].good : null);
  /* destinations, quickest first, with what would happen there */
  const opts = PORTS.map((P) => P.i).filter((j) => j !== from).map((j) => ({ j, p: plan(S, from, j) })).filter((x) => x.p).map((x) => {
    const sleep = !S.ports[x.j].awake, wantIt = cargo && wants(x.j, cargo), ask = cargo && S.asks.some((a) => a.port === x.j && a.good === cargo && !a.done);
    return { ...x, sleep, wantIt, ask, rank: (ask ? 0 : sleep && wantIt ? 1 : wantIt ? 2 : 3) * 100 + x.p.months };
  }).sort((a, b) => a.rank - b.rank).slice(0, 12);
  const P = ui.plan, D = ui.dest != null ? PORTS[ui.dest] : null;
  const outcome = !D ? '' : !cargo ? `Sails empty — at ${esc(D.n)} it can load ${goodTag(D.good)}${S.ports[D.i].awake ? '' : ' once the port is awake'}.`
    : !wants(D.i, cargo) ? `${esc(D.n)} grows its own ${esc(GOODS[cargo].goodName)} — no one there will want it.`
    : !S.ports[D.i].awake ? `<b>${esc(D.n)} will wake</b> when the ${esc(GOODS[cargo].goodName)} arrives!`
    : S.asks.some((a) => a.port === D.i && a.good === cargo && !a.done) ? `<b>${esc(D.n)} asked for this</b> — the best thing you can do.` : `${esc(D.n)} will trade for it, and give you its ${esc(GOODS[D.good].goodName)}.`;
  return `<div class="card tw-plan-card">
    <p class="kicker">Ship ${sh.id} from ${esc(PORTS[from].n)} · carrying ${goodTag(cargo)}</p>
    ${P ? `<h3>To ${esc(D.n)}: ${P.months} ${P.months === 1 ? 'month' : 'months'}</h3>
      <p class="small">${fmtKm(P.km)}${P.via.length ? ` · by way of ${P.via.map((v) => esc(PORTS[v].n)).join(', ')}` : ''}.</p>
      ${Object.keys(P.help).length ? `<p class="small tw-good">💨 With ${Object.keys(P.help).map((k) => WINDNAME[k]).join(' and ')} behind you.</p>` : ''}
      ${Object.keys(P.against).length ? `<p class="small tw-bad">🌬️ Against ${Object.keys(P.against).map((k) => WINDNAME[k]).join(' and ')} — slower.</p>` : ''}
      ${P.cyclone ? `<p class="small tw-bad">🌀 Cyclone season on the way: the ship waits a month in port to be safe.</p>` : ''}
      ${P.pass.length ? `<p class="small">🧭 Through ${P.pass.map((id) => esc(PASS[id].name)).join(', ')}.</p>` : ''}
      <p class="small">${outcome}</p>
      <div class="row gap wrap"><button class="btn primary" data-act="lib" data-arg="tradewinds|go">${ico('ship')} Set sail <kbd>Enter</kbd></button><button class="btn ghost" data-act="lib" data-arg="tradewinds|cancel">Cancel <kbd>Esc</kbd></button></div>` : '<p class="small">Where to? Tap a port on the map, or pick one:</p>'}
    <ul class="tw-dests">${opts.map((o) => `<li><button class="${o.j === ui.dest ? 'on' : ''}" data-act="lib" data-arg="tradewinds|dest|${o.j}">${ico(o.ask ? 'heart' : o.sleep ? (o.wantIt ? 'sparkle' : 'moon') : 'sun')} <b>${esc(PORTS[o.j].n)}</b> <span>${o.p.months} mo${o.ask ? ' · asked for it' : o.sleep && o.wantIt ? ' · will wake' : ''}</span></button></li>`).join('')}</ul>
  </div>`;
}
const shipsCard = (S) => `<details class="card tw-ships" open><summary><b>Your ships</b> (${S.ships.length})</summary><ul>${S.ships.map((sh) => `<li>⛵ ${sh.id}: ${sh.voyage ? `to ${esc(PORTS[sh.voyage.to].n)} with ${goodTag(sh.voyage.cargo)} — ${sh.voyage.left} ${sh.voyage.left === 1 ? 'month' : 'months'}` : `in <button class="linkish" data-act="lib" data-arg="tradewinds|sel|${sh.at}">${esc(PORTS[sh.at].n)}</button>${sh.cargo ? ` with ${goodTag(sh.cargo)}` : ''}`}</li>`).join('')}</ul></details>`;
const asksCard = (S) => { const a = S.asks.filter((x) => !x.done); return a.length ? `<div class="card tw-asks"><p class="kicker">Asking for help</p><ul>${a.map((x) => `<li><button class="linkish" data-act="lib" data-arg="tradewinds|sel|${x.port}">${esc(PORTS[x.port].n)}</button> needs ${goodTag(x.good)} · ${x.until - S.turn} months</li>`).join('')}</ul></div>` : ''; };

/* ------------------------------------------------------------------ the screen */
export function view(ctx) {
  const S = S_(ctx), ui = ctx.ui, d = ctx.data;
  if (!S || ui.title) {
    return `<div class="gm-title card tw-title">
      <div class="gm-art" style="background-image:url(art/${TOOL.art}.webp)"><span class="gm-glyph" aria-hidden="true">${ico('ship')}</span></div>
      <div class="gm-body"><h2>${esc(TOOL.name)}</h2>
        <ol class="gm-how" id="gm-how"><li><b>1</b><span>Sixty real ports sleep round the world. Each grows what its <b>climate</b> grows — fruit in the tropics, grain in temperate lands…</span></li>
          <li><b>2</b><span>Send ships. A sleeping port <b>wakes</b> when a ship brings it something its own climate cannot grow.</span></li>
          <li><b>3</b><span>Ride the <b>winds</b> — trade winds, westerlies, the monsoon — keep out of storm season, and help ports that ask. Light every port.</span></li></ol>
        ${readBtn('#gm-how', 'Read how to play')}
        <ul class="tw-ages" aria-label="Four ages to sail through">${ERAS.map((e) => `<li><img src="art/game-tw-era-${e.id}.webp" alt=""><b>${esc(e.name.replace(/^The /, ''))}</b><small>${e.year}</small></li>`).join('')}</ul>
        ${S && !S.won ? `<div class="row gap wrap gm-starts"><button class="btn big primary" data-act="lib" data-arg="tradewinds|resume">${ico('ship')} Carry on — ${MONTHS[S.month]} ${S.year}, ${awakeCount(S)} of ${PORTS.length} ports lit</button></div><p class="muted small">Or start again from:</p>` : '<p class="muted small">Where does your voyage begin?</p>'}
        <div class="row gap wrap gm-starts">${HOMES.map((h, j) => `<button class="btn big${!S || S.won ? (j ? '' : ' primary') : ''}" data-act="lib" data-arg="tradewinds|new|${h.id}">${esc(h.say[0].toUpperCase() + h.say.slice(1))}</button>`).join('')}</div>
        ${d.best ? `<p class="muted small">Best: every port lit in ${esc(d.best)}.</p>` : ''}
        <details class="src"><summary>How this game is made — and where it simplifies</summary>
          <p class="small">The sea lanes were measured from this app’s own map: the shortest way round the land, through the straits. Winds, storms and ice are simplified to bands of latitude and months; each port trades one cargo for its climate band; a turn is a month. Where it says a fact, it comes from the map’s data or the sources below.</p>
          <ul>${[...PORT_SRC, ...STRAITS_SRC, ...ERAS_SRC, ...WIND_SRC].map((s) => `<li>${esc(s)}</li>`).join('')}</ul></details>
        ${TRADEWINDS_NEEDS_REVIEW ? '<p class="t-review">✎ Awaiting a second reader: the winds, seasons and dates are checked against the sources, but not yet by a second person.</p>' : ''}
      </div></div>`;
  }
  if (S.won && !ui.stay) {
    const w = S.stats.wind, top = Object.entries(w).sort((a, b) => b[1] - a[1]).map(([k]) => WINDNAME[k]);
    return `<div class="card end-card gm-end tw-end">${shelly('cheer', 120)}<p class="kicker">The world is connected</p>
      <h2>Every port lit in <span data-count="${S.turn}">${S.turn}</span> months</h2>
      <p>${S.stats.voyages} voyages · ${fmtKm(S.stats.km)} sailed · ${S.stats.helped} ports helped in a lean season.</p>
      <p>The winds that helped you most: ${top.slice(0, 3).join(', ') || 'none — you sailed by engine'}. You passed through ${Object.keys(S.stats.pass).map((id) => esc(PASS[id].name)).join(', ') || 'no strait'}.</p>
      <p>You practised: oceans and straits, climate bands, the planet’s wind belts and the monsoon — and why trade happens at all.</p>
      <div class="row gap center"><button class="btn primary big" data-act="lib" data-arg="tradewinds|title">Sail again</button><button class="btn big" data-act="lib" data-arg="tradewinds|stay">Look at my world</button></div></div>`;
  }
  const E = ERAS[S.era], nx = ERAS[S.era + 1], pv = ERAS[S.era], K = markScale(), vb = phoneView(S, ui), L = layers(S, ui, K, vb), lit = awakeCount(S);
  const toNext = nx ? Math.min(100, Math.round(((S.goodwill - pv.need) / (nx.need - pv.need)) * 100)) : 100;
  const fill = {}; PORTS.forEach((P, i) => { if (S.ports[i].awake) fill[P.cc] = 'twlit'; });
  const season = HAZARDS.cyclones.north.includes(S.month) || HAZARDS.cyclones.south.includes(S.month);
  const pop = ui.eraShow != null ? ERAS[ui.eraShow] : null;
  return `<div class="tw tw-e-${E.id}">
    <div class="tw-bar">
      <div class="tw-when"><span class="tw-m">${MONTHS[S.month]}</span><span class="tw-y">${S.year}</span></div>
      <div class="tw-era"><img src="art/game-tw-era-${E.id}.webp" alt=""><div><b>${esc(E.name)}</b>
        <span class="tw-meter" title="Goodwill: from waking ports, trading and helping" role="img" aria-label="Goodwill ${S.goodwill}${nx ? ` of ${nx.need} for ${esc(nx.name)}` : ''}"><i style="width:${toNext}%"></i></span>
        <small>${ico('hands')} ${S.goodwill}${nx ? ` · ${nx.need} for ${esc(nx.name)}` : ' goodwill'}</small></div></div>
      <div class="tw-lit"><b>${lit}</b><small>of ${PORTS.length} ports lit</small><span class="tw-meter gold"><i style="width:${Math.round((lit / PORTS.length) * 100)}%"></i></span></div>
      <div class="tw-fleet">${ico('ship')} <b>${S.ships.filter((x) => !x.voyage).length}</b> in port · <b>${S.ships.filter((x) => x.voyage).length}</b> at sea</div>
    </div>
    <div class="tw-main">
      <div class="tw-map" style="${shipVars(ctx.kid)}">${worldSVG({ key: 'tw', tap: true, grat: false, fill, view: vb, under: L.under, extra: L.extra, label: 'Trade Winds world map: tap a port' })}
        <div class="tw-zoom">${[['in', 'plus', 'Zoom in'], ['out', 'minus', 'Zoom out'], ['home', 'reset', 'Back to the start view']].map(([h, i, l]) => `<button class="btn small" data-act="mapZoom" data-arg="tw|${h}" aria-label="${l}">${ico(i)}</button>`).join('')}</div>
        <p class="tw-legend small"><span class="tw-lg w"><svg viewBox="-18 -6 34 12" width="30" height="11"><path d="M-16 0C-10 -3.5 -4 3.5 2 0S10 -2.5 13 0M9 -3.2L13.5 0L9 3.2" fill="none" stroke="currentColor" stroke-width="2"/></svg> this month’s winds</span>${MONSOON.sw.includes(S.month) ? '<span class="tw-lg m">summer monsoon blows north-east</span>' : MONSOON.ne.includes(S.month) ? '<span class="tw-lg m">winter monsoon blows south-west</span>' : ''}${season ? '<span class="tw-lg s">cyclone season</span>' : ''}${HAZARDS.ice.north.includes(S.month) || HAZARDS.ice.south.includes(S.month) ? '<span class="tw-lg i">sea ice</span>' : ''}<span class="tw-lg p">lit port</span></p>
        ${pop ? `<div class="tw-pop" role="dialog" aria-label="${esc(pop.name)}"><div class="tw-pop-card"><div class="tw-pop-art" style="background-image:url(art/game-tw-era-${pop.id}.webp)"></div>
          <div class="tw-pop-body"><p class="kicker">${ui.eraShow ? 'A new age' : 'Your voyage begins'} · ${pop.year}</p><h2>${esc(pop.name)}</h2><p id="tw-pop-t">${esc(pop.card)}</p>
          ${ui.eraShow ? '' : '<p class="small muted">Tap a sleeping port that does not grow what your ship carries. Then press <b>Next month</b> and watch the winds carry you.</p>'}
          <div class="row gap wrap">${readBtn('#tw-pop-t')}<button class="btn primary big" data-act="lib" data-arg="tradewinds|eraok">Sail on ${ico('next')} <kbd>Enter</kbd></button></div></div></div></div>` : ''}</div>
      <aside class="tw-side">
        ${newsCard(S.news)}
        ${ui.ship ? planCard(S, ui) : portCard(S, ui)}
        ${asksCard(S)}
        ${shipsCard(S)}
        <div class="row gap wrap tw-actions"><button class="btn ${ui.ship ? '' : 'primary '}big" data-act="lib" data-arg="tradewinds|next">Next month ${ico('next')} <kbd>N</kbd></button><button class="btn ghost" data-act="lib" data-arg="tradewinds|title">${ico('menu')} Menu</button></div>
        <details class="tw-log"><summary>The ship’s log</summary><ul>${S.log.slice(0, 12).map((l) => `<li>${esc(l)}</li>`).join('')}</ul></details>
      </aside></div></div>`;
}

/* ------------------------------------------------------------------ actions */
function nearestPort(at) { let best = null, bd = 700; for (const P of PORTS) { const k = haversine(at, P.at); if (k < bd) { bd = k; best = P.i; } } return best; }
function setDest(S, ui, j) { const sh = S.ships.find((x) => x.id === ui.ship); if (!sh || sh.at == null || j === sh.at) return; ui.dest = j; ui.plan = plan(S, sh.at, j); }
export function act(name, arg, ctx) {
  const ui = ctx.ui, d = ctx.data;
  /* a new game starts with a ship ready in the home port: the first tap picks where to send it */
  if (name === 'new') { d.save = newGame(arg, 'tw' + Date.now()); d.plays = (d.plays || 0) + 1; Object.assign(ui, { title: false, sel: d.save.home, ship: d.save.ships[0].id, dest: null, plan: null, stay: false, eraShow: 0 }); ctx.sfx.click(); ctx.save(); return; }
  if (name === 'resume') { ui.title = false; ui.eraShow = null; return; }
  if (name === 'title') { ui.title = true; ui.ship = null; ui.plan = null; ui.dest = null; return; }
  if (name === 'stay') { ui.stay = true; return; }
  if (name === 'eraok') { ui.eraShow = null; ctx.sfx.click(); return; }
  const S = S_(ctx); if (!S) return;
  if (name === 'sel') { ui.sel = +arg; ui.dest = null; ui.plan = null; const first = S.ships.find((x) => x.at === +arg && !x.voyage); ui.ship = first ? first.id : null; }
  else if (name === 'ship') { ui.ship = +arg; ui.dest = null; ui.plan = null; }
  else if (name === 'dest') setDest(S, ui, +arg);
  else if (name === 'cancel') { ui.ship = null; ui.dest = null; ui.plan = null; }
  else if (name === 'tap') {
    const t = JSON.parse(arg); if (t.lat == null || ui.eraShow != null) return;
    const j = nearestPort([t.lat, t.lng]); if (j == null) return;
    /* first tap: a port (a lit one with a ship in it goes straight to planning); second tap: where to */
    if (ui.ship) setDest(S, ui, j);
    else { ui.sel = j; ui.dest = null; ui.plan = null; const first = S.ships.find((x) => x.at === j && !x.voyage); ui.ship = first ? first.id : null; }
  } else if (name === 'go' && ui.ship && ui.dest != null) {
    const r = sail(S, ui.ship, ui.dest);
    if (r.error) { ctx.toast(r.error); return; }
    ctx.sfx.click(); ui.ship = null; ui.plan = null; ui.dest = null; ctx.save();
  } else if (name === 'next') {
    const prevEra = S.era, news = nextMonth(S);
    ui.plan = null; ui.ship = null; ui.dest = null;
    for (const n of news) {
      if (n.k === 'wake') { ctx.tick(true); if (ctx.earn) ctx.earn('stop'); d.woke = (d.woke || 0) + 1; }
      if (n.k === 'helped') { ctx.tick(true); if (ctx.earn) ctx.earn('stop'); d.helped = (d.helped || 0) + 1; }
      if (n.k === 'trade') ctx.tick(true);
    }
    if (news.some((n) => n.k === 'wake' || n.k === 'helped')) { ctx.sfx.good(); ctx.confetti(14); } else ctx.sfx.click();
    if (S.era > prevEra) { ui.eraShow = S.era; ctx.sfx.level(); ctx.confetti(40); d.era = Math.max(d.era || 0, S.era); if (ctx.earn) ctx.earn('mastered'); }
    /* an ocean lit: every port of it awake */
    d.oceans = d.oceans || {};
    for (const o of Object.keys(OCEANS)) if (!d.oceans[o] && PORTS.filter((P) => P.ocean === o).every((P) => S.ports[P.i].awake)) { d.oceans[o] = S.turn; ctx.confetti(30); }
    if (S.won && !d.wonAt) d.wonAt = S.turn;
    if (S.won) { d.wins = (d.wins || 0) + 1; if (!d.bestMonths || S.turn < d.bestMonths) { d.bestMonths = S.turn; d.best = `${S.turn} months`; } if (ctx.session) ctx.session(); if (ctx.earn) ctx.earn('contest'); }
    ctx.save();
  }
}
export function key(e, ctx) {
  const S = S_(ctx), ui = ctx.ui; if (!S || ui.title || S.won) return false;
  if (ui.eraShow != null) { if (e.key === 'Enter' || e.key === 'Escape') { act('eraok', '', ctx); return true; } return false; }
  if (e.key === 'n' || e.key === 'N') { act('next', '', ctx); return true; }
  if (e.key === 'Escape' && ui.ship) { act('cancel', '', ctx); return true; }
  if (e.key === 'Enter' && ui.plan) { act('go', '', ctx); return true; }
  return false;
}
/* the live game is "in play" for the top bar (inGame) only while a voyage is open on screen */
export function selftest(ok) {
  ok(PORTS.length === 60 && PORTS.every((P) => P.at && P.good), `sixty ports, each with a place and a cargo (${PORTS.length})`);
  ok(new Set(PORTS.map((P) => P.band)).size === 4, 'all four climate bands have ports');
}
