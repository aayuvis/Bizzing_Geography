/* sealanes.mjs — the sea lanes of Shelly's Trade Winds, MEASURED FROM THE APP'S OWN MAP.

   A ship cannot sail across Africa, so a lane is never a straight line: it is the shortest
   path over a half-degree ocean grid whose every cell was classified land or sea by the
   same countryAt() the app uses to answer a tap. The narrow waters the grid is too coarse
   to see (STRAITS) are opened by their own coordinates, each with a source; the two
   canals open only in their era. Run:  node tools/geo/sealanes.mjs  → app/src/data/sealanes.js */
import { writeFileSync } from 'node:fs';
import { countryAt } from '../../app/src/map.js';
import { PLACES } from '../../app/src/data/places.js';
import { PORT_NAMES, STRAITS, CANALS } from '../../app/src/games/tw-data.js';

const STEP = 0.5, NX = 720, NY = 340;            // 0.5°, latitudes −85…+85
const lat0 = -85;
const ix = (lng) => ((Math.round((lng + 180) / STEP) % NX) + NX) % NX;
const iy = (lat) => Math.max(0, Math.min(NY - 1, Math.round((lat - lat0) / STEP)));
const cLat = (y) => lat0 + y * STEP, cLng = (x) => -180 + x * STEP;
const R = 6371, rad = Math.PI / 180;
const hav = (a, b) => { const dLa = (b[0] - a[0]) * rad, dLo = (b[1] - a[1]) * rad; const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };

console.time('grid');
const sea = new Uint8Array(NX * NY);
for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) sea[y * NX + x] = countryAt([cLat(y), cLng(x)]) ? 0 : 1;
console.timeEnd('grid');

/* open a line of cells along a polyline (a strait or a canal), every segment of it */
function carve(grid, line) {
  for (let k = 0; k + 1 < line.length; k++) {
    const a = line[k], b = line[k + 1], n = Math.ceil(hav(a, b) / 15) + 1;
    for (let i = 0; i <= n; i++) { const t = i / n, la = a[0] + (b[0] - a[0]) * t, lo = a[1] + (b[1] - a[1]) * t; grid[iy(la) * NX + ix(lo)] = 1; }
  }
}
for (const s of STRAITS) carve(sea, s.line);
const grids = [sea, sea.slice(), sea.slice()];    // 0: no canals · 1: Suez · 2: Suez + Panama
carve(grids[1], CANALS.suez.line); carve(grids[2], CANALS.suez.line); carve(grids[2], CANALS.panama.line);

/* ports: each joined to the nearest sea cell within 120 km */
const ports = PORT_NAMES.map((nc) => { const [n, cc] = nc.split('|'); const p = PLACES.find((x) => x.n === n && x.cc === cc); if (!p) throw new Error('no place ' + nc); return p; });
function seaCell(grid, at) {
  let best = null, bd = 1e9;
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
    const y = iy(at[0]) + dy, x = (ix(at[1]) + dx + NX) % NX; if (y < 0 || y >= NY || !grid[y * NX + x]) continue;
    const d = hav(at, [cLat(y), cLng(x)]); if (d < bd) { bd = d; best = y * NX + x; }
  }
  if (bd > 120) throw new Error('no sea within 120 km of ' + at);
  return best;
}

/* Dijkstra over 8 neighbours, from one cell, to all */
function dijkstra(grid, src) {
  const dist = new Float64Array(NX * NY).fill(Infinity), prev = new Int32Array(NX * NY).fill(-1);
  const heap = [[0, src]]; dist[src] = 0;
  const push = (d, i) => { heap.push([d, i]); let c = heap.length - 1; while (c) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = 2 * c + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
  while (heap.length) {
    const [d, i] = pop(); if (d > dist[i]) continue;
    const y = Math.floor(i / NX), x = i % NX, here = [cLat(y), cLng(x)];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const ny = y + dy; if (ny < 0 || ny >= NY) continue;
      const nx = (x + dx + NX) % NX, j = ny * NX + nx; if (!grid[j]) continue;
      const nd = d + hav(here, [cLat(ny), cLng(nx)]); if (nd < dist[j]) { dist[j] = nd; prev[j] = i; push(nd, j); }
    }
  }
  return { dist, prev };
}
const pathTo = (prev, j) => { const out = []; for (let i = j; i !== -1; i = prev[i]) out.push(i); return out.reverse(); };
/* Douglas–Peucker on lat/lng, then back to [lat,lng] rounded */
function simplify(pts, tol = 0.6) {
  if (pts.length < 3) return pts;
  const d = (p, a, b) => { const [x, y] = p, [x1, y1] = a, [x2, y2] = b, L = Math.hypot(x2 - x1, y2 - y1) || 1e-9; return Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / L; };
  let m = 0, k = 0; for (let i = 1; i < pts.length - 1; i++) { const v = d(pts[i], pts[0], pts[pts.length - 1]); if (v > m) { m = v; k = i; } }
  return m > tol ? [...simplify(pts.slice(0, k + 1), tol).slice(0, -1), ...simplify(pts.slice(k), tol)] : [pts[0], pts[pts.length - 1]];
}

const K = 8;   // each port's lanes: its K nearest ports by sea
const lanes = {};
console.time('lanes');
grids.forEach((grid, g) => {
  const cells = ports.map((p) => seaCell(grid, p.at));
  ports.forEach((p, a) => {
    const { dist, prev } = dijkstra(grid, cells[a]);
    const near = ports.map((q, b) => ({ b, km: dist[cells[b]] })).filter((x) => x.b !== a && isFinite(x.km)).sort((u, v) => u.km - v.km).slice(0, K);
    for (const { b, km } of near) {
      const key = a < b ? `${a}-${b}` : `${b}-${a}`;
      let cellPath = pathTo(prev, cells[b]); if (a > b) cellPath = cellPath.reverse();
      const pts = simplify(cellPath.map((i) => { const y = Math.floor(i / NX), x = i % NX; return [cLat(y), cLng(x)]; }))
        .map(([la, lo]) => [+la.toFixed(1), +lo.toFixed(1)]);
      const ends = a < b ? [ports[a].at, ports[b].at] : [ports[b].at, ports[a].at];
      const full = [ends[0].map((v) => +v.toFixed(2)), ...pts, ends[1].map((v) => +v.toFixed(2))];
      const L = lanes[key] || (lanes[key] = { a: Math.min(a, b), b: Math.max(a, b), by: [null, null, null] });
      L.by[g] = { km: Math.round(km), path: full };
    }
  });
});
console.timeEnd('lanes');
/* a lane present in an earlier configuration is present in later ones (canals only add) */
/* …and a canal never makes a voyage longer: where the earlier route is shorter (the grid can snap a few km differently once a canal is carved), keep it */
for (const L of Object.values(lanes)) for (let g = 1; g < 3; g++) if (L.by[g - 1] && (!L.by[g] || L.by[g].km > L.by[g - 1].km)) L.by[g] = L.by[g - 1];
const out = Object.values(lanes).map((L) => {
  const same = (u, v) => u && v && JSON.stringify(u.path) === JSON.stringify(v.path);
  return { a: L.a, b: L.b, g: L.by.map((x, i) => (x ? (i && same(x, L.by[i - 1]) ? i - 1 : i) : -1)), km: L.by.map((x) => (x ? x.km : 0)), p: L.by.map((x, i) => (x && !(i && same(x, L.by[i - 1])) ? x.path : null)) };
});
writeFileSync(new URL('../../app/src/data/sealanes.js', import.meta.url),
  `/* GENERATED by tools/geo/sealanes.mjs from the app's own map — never edit by hand.\n   Each lane: a, b (indexes into PORT_NAMES); km and path for [no canals, Suez, Suez + Panama]\n   (p[i] null = the same path as the configuration before; km 0 = no such lane then). */\nexport const LANES = ${JSON.stringify(out)};\n`);
console.log(`${ports.length} ports · ${out.length} lanes`);
