/* map.js — every real map in the app, drawn as SVG from the data.

   The family rule (Bizzing India docs/07 §7) holds here: ONE depiction,
   the Survey of India's, for every user in every locale; boundaries are
   undramatised background — they never draw themselves, pulse, get
   captured or move as a reward. A country is highlighted by its fill, never
   by animating its border.

   Maps are drawn in a fixed 1000-wide frame, so a pin, a tap and a
   crosshair all live in one coordinate space. Paths are computed once and
   kept; a render only chooses classes. */

import { geoNaturalEarth1, geoPath, geoContains, geoGraticule10, geoAlbersUsa, geoConicConformal, geoMercator, geoBounds } from 'd3-geo';
import { feature } from 'topojson-client';
import { WORLD } from './data/world.js';
import { REGIONS } from './data/regions.js';
import { INDIA } from './geo.js';

export const W = 1000, H = 520;

/* rot: the longitude at the map's middle. 0 is the usual world map; the
   Pacific's story (Polynesia, Hawaiʻi, Rapa Nui) needs one centred on the
   Pacific, or it is torn in half at the map's edges. */
const WM = {};
function world(rot = 0) {
  if (WM[rot]) return WM[rot];
  const fc = feature(WORLD, Object.values(WORLD.objects)[0]);
  const proj = geoNaturalEarth1().rotate([-rot, 0]).fitExtent([[6, 6], [W - 6, H - 6]], { type: 'Sphere' });
  const path = geoPath(proj).digits(1);
  /* a shape too small to draw at this scale has no path: it cannot be tapped, so it is not drawn */
  const feats = fc.features.map((f) => ({ id: f.id, n: f.properties.n, d: path(f), f, b: geoBounds(f) })).filter((x) => x.d);
  const line = (lat) => path({ type: 'LineString', coordinates: Array.from({ length: 73 }, (_, i) => [-180 + i * 5, lat]) });
  WM[rot] = {
    proj, path, feats,
    /* a country may have several features (France's overseas parts); its main one is the biggest drawing */
    byId: feats.reduce((m, x) => { if (!m[x.id] || m[x.id].d.length < x.d.length) m[x.id] = x; return m; }, {}),
    sphere: path({ type: 'Sphere' }), grat: path(geoGraticule10()),
    lines: { equator: line(0), cancer: line(23.44), capricorn: line(-23.44), arctic: line(66.56), antarctic: line(-66.56),
      prime: path({ type: 'LineString', coordinates: Array.from({ length: 37 }, (_, i) => [0, -90 + i * 5]) }) },
  };
  return WM[rot];
}

/* [lat, lng] ↔ [x, y] in the world frame */
export const project = ([lat, lng], rot = 0) => world(rot).proj([lng, lat]);
export function invert([x, y], rot = 0) { const p = world(rot).proj.invert([x, y]); return p ? [p[1], p[0]] : null; }

/* Which country is at [lat, lng]? Checks the bounding box first — geoContains is not cheap. */
export function countryAt([lat, lng]) {
  const M = world();
  for (const x of M.feats) {
    const [[w, s], [e, n]] = x.b;
    const inLng = w <= e ? lng >= w && lng <= e : lng >= w || lng <= e;
    if (lat < s || lat > n || !inLng) continue;
    if (geoContains(x.f, [lng, lat])) return x.id;
  }
  return null;
}
/* every drawn feature, for the Satellite theme's spinning globe (fill only, never a line) */
export const worldFeatures = () => world().feats.map((x) => x.f);
export const hasShape = (cc) => !!world().byId[cc];
export const shapeName = (cc) => (world().byId[cc] || {}).n || '';

/* A viewBox that frames a [west, south, east, north] box, padded, at the frame's aspect. */
export function viewFor([w, s, e, n], pad = 0.06, rot = 0) {
  const pts = [];
  for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) {
    const lng = w + ((e - w) * i) / 8, lat = s + ((n - s) * j) / 8;
    const p = world(rot).proj([lng, lat]); if (p) pts.push(p);
  }
  let x0 = Math.min(...pts.map((p) => p[0])), x1 = Math.max(...pts.map((p) => p[0]));
  let y0 = Math.min(...pts.map((p) => p[1])), y1 = Math.max(...pts.map((p) => p[1]));
  const px = (x1 - x0) * pad, py = (y1 - y0) * pad;
  x0 -= px; x1 += px; y0 -= py; y1 += py;
  // keep the frame's aspect so a pin never stretches
  const want = W / H, have = (x1 - x0) / (y1 - y0);
  if (have > want) { const h = (x1 - x0) / want; const c = (y0 + y1) / 2; y0 = c - h / 2; y1 = c + h / 2; }
  else { const w2 = (y1 - y0) * want; const c = (x0 + x1) / 2; x0 = c - w2 / 2; x1 = c + w2 / 2; }
  return [x0, y0, x1 - x0, y1 - y0].map((v) => +v.toFixed(1));
}
/* The box around one country, for zooming to it. */
export function viewOfCountry(cc, pad = 0.35) {
  const x = world().byId[cc]; if (!x) return [0, 0, W, H];
  let [[w, s], [e, n]] = x.b;
  if (e < w) e += 360;                        // crosses the antimeridian
  if (e - w > 200) { w = -180; e = 180; }     // Russia, Fiji, the US with Alaska
  return viewFor([w, s, e, n], pad);
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* The world map.
     fill:   { cc: 'class' }   — a class per country (hl, ok, bad, dim, pick…)
     pins:   [{ at:[lat,lng], cls, label, r }]
     lines:  ['equator', 'cancer', …]
     view:   [x, y, w, h]
     key:    names the map, so its pan/zoom and crosshair survive a re-render
     tap:    true — the map answers taps (main.js mapui)
     zones:  [{ at, km, name, cls }] — a SOFT ZONE of influence, blurred, never a
             line (Bizzing India's rule for anything before modern borders)
     borders: false — no country lines at all, for an age before them */
export function worldSVG({ fill = {}, pins = [], lines = [], view = null, key = 'w', tap = false, grat = true, label = 'World map', arcs = [], zones = [], borders = true, rot = 0, drag = false } = {}) {
  const M = world(rot);
  const vb = (view || [0, 0, W, H]).join(' ');
  const scale = view ? view[2] / W : 1;
  return `<div class="gmap${tap ? ' tap' : ''}${drag ? ' drag' : ''}${borders ? '' : ' noborders'}" data-gmap="${esc(key)}" data-home="${vb}"${rot ? ` data-rot="${rot}"` : ''} ${tap ? 'tabindex="0" role="application"' : ''} aria-label="${esc(label)}${tap ? '. Tap a place, or use the arrow keys to move the cross and Enter to choose.' : ''}">
    <svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet" style="--s:${scale.toFixed(3)}">
      <path class="sea" d="${M.sphere}"/>
      ${grat ? `<path class="grat" d="${M.grat}"/>` : ''}
      <g class="lands">${M.feats.map((x) => `<path class="ct${fill[x.id] ? ' ' + fill[x.id] : ''}" data-cc="${x.id}" d="${x.d}"/>`).join('')}</g>
      ${zones.length ? `<defs><filter id="zblur-${esc(key)}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${(6 * scale).toFixed(2)}"/></filter></defs>
      <g class="zones" filter="url(#zblur-${esc(key)})">${zones.map((z, i) => { const c = zoneCircle(z.at, z.km, rot); return c ? `<circle class="zone z${z.cls ?? i % 6}" cx="${c[0]}" cy="${c[1]}" r="${c[2]}"/>` : ''; }).join('')}</g>
      <g class="zone-names">${zones.map((z) => { const c = zoneCircle(z.at, z.km, rot); return c && z.name ? `<text transform="translate(${c[0]} ${(c[1] - c[2] * 0.55).toFixed(1)}) scale(${scale.toFixed(3)})">${esc(z.name)}</text>` : ''; }).join('')}</g>` : ''}
      ${lines.map((l) => `<path class="gl gl-${l}" d="${M.lines[l]}"/>`).join('')}
      ${arcs.map((a) => `<path class="arc" d="${M.path({ type: 'LineString', coordinates: [[a[0][1], a[0][0]], [a[1][1], a[1][0]]] })}"/>`).join('')}
      ${pins.map((p) => { const xy = M.proj([p.at[1], p.at[0]]); return xy ? `<g class="pin ${p.cls || ''}" transform="translate(${xy[0].toFixed(1)} ${xy[1].toFixed(1)}) scale(${scale.toFixed(3)})"><circle r="${p.r || 6}"/>${p.label ? `<text y="-11">${esc(p.label)}</text>` : ''}</g>` : ''; }).join('')}
      ${tap ? `<g class="cross" transform="translate(-99 -99) scale(${scale.toFixed(3)})"><circle r="9"/><path d="M-15 0H-5M5 0H15M0 -15V-5M0 5V15"/></g>` : ''}
    </svg></div>`;
}

/* A zone's centre and radius in the world frame: the radius is measured by
   projecting a point `km` north (or south, near the pole), so a zone is the
   right size wherever it sits on the map. */
function zoneCircle(at, km, rot = 0) {
  const c = project(at, rot); if (!c) return null;
  const d = km / 111, lat2 = at[0] + d > 85 ? at[0] - d : at[0] + d;
  const e = project([lat2, at[1]], rot); if (!e) return null;
  return [c[0].toFixed(1), c[1].toFixed(1), Math.max(4, Math.hypot(e[0] - c[0], e[1] - c[1])).toFixed(1)];
}

/* ------------------------------------------------------------ regions */

/* A country's states, each in its own projection (the US in Albers with
   Alaska and Hawaii as insets, as every American school map draws it). */
const REG = {};
function region(c) {
  if (REG[c]) return REG[c];
  if (c === 'IN') {
    const [, , w, h] = INDIA.viewBox.split(' ').map(Number);
    REG[c] = { vb: INDIA.viewBox, w, h, outline: INDIA.outline,
      feats: INDIA.states.map((s) => ({ id: s.id, d: s.d })),
      cap: Object.fromEntries(INDIA.states.map((s) => [s.id, s.capXY])) };
    return REG[c];
  }
  const fc = feature(REGIONS, REGIONS.objects[c]);
  const proj = c === 'US' ? geoAlbersUsa() : c === 'CA' ? geoConicConformal().rotate([96, 0]).parallels([49, 77]) : geoMercator();
  proj.fitExtent([[10, 10], [W - 10, (c === 'CA' ? 640 : 600) - 10]], fc);
  const path = geoPath(proj).digits(1);
  const h = c === 'CA' ? 640 : 600;
  REG[c] = { vb: `0 0 ${W} ${h}`, w: W, h, proj, feats: fc.features.map((f) => ({ id: f.id, d: path(f) })), cap: {} };
  return REG[c];
}
export function regionCap(c, id, at) {
  const r = region(c);
  if (c === 'IN') return r.cap[id];
  const p = r.proj([at[1], at[0]]); return p || null;
}
/* fill: { 'US-CA': 'hl' }; pins: [{ xy, cls, label }] in the region's frame */
export function regionSVG(c, { fill = {}, pins = [], key = 'r', tap = false, label = 'Map' } = {}) {
  const r = region(c);
  return `<div class="gmap reg reg-${c}${tap ? ' tap' : ''}" data-gmap="${esc(key)}" data-home="${r.vb}" ${tap ? 'tabindex="0" role="application"' : ''} aria-label="${esc(label)}${tap ? '. Tap a region, or use the arrow keys and Enter.' : ''}">
    <svg viewBox="${r.vb}" preserveAspectRatio="xMidYMid meet" style="--s:1">
      ${r.outline ? `<path class="outline" d="${r.outline}"/>` : ''}
      <g class="lands">${r.feats.map((x) => `<path class="ct${fill[x.id] ? ' ' + fill[x.id] : ''}" data-cc="${x.id}" d="${x.d}"/>`).join('')}</g>
      ${pins.map((p) => p.xy ? `<g class="pin ${p.cls || ''}" transform="translate(${p.xy[0].toFixed(1)} ${p.xy[1].toFixed(1)})"><circle r="${p.r || 6}"/>${p.label ? `<text y="-11">${esc(p.label)}</text>` : ''}</g>` : '').join('')}
      ${tap ? '<g class="cross" transform="translate(-99 -99) scale(1)"><circle r="9"/><path d="M-15 0H-5M5 0H15M0 -15V-5M0 5V15"/></g>' : ''}
    </svg></div>`;
}

/* Is [lat, lng] in country cc, or within ~25 km of it? Coasts and small
   islands are simplified, so a real coastal point can sit just offshore. */
export function nearCountry(at, cc, kmMax = 25) {
  if (countryAt(at) === cc) return true;
  const rings = kmMax <= 25 ? [8, 16, kmMax] : Array.from({ length: Math.ceil(kmMax / 10) }, (_, i) => (i + 1) * 10);
  for (let a = 0; a < 360; a += 30) for (const km of rings) {
    const d = km / 111, p = [at[0] + d * Math.cos((a * Math.PI) / 180), at[1] + (d * Math.sin((a * Math.PI) / 180)) / Math.cos((at[0] * Math.PI) / 180)];
    if (countryAt(p) === cc) return true;
  }
  return false;
}
