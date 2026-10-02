/* tw-engine.js — Shelly's Trade Winds, the rules. No DOM: test/… sails whole games with it.

   THE SHAPE (Bizzing India's Sabhyata, docs/16, carried to the oceans):
     · You win by CONNECTING, never conquering. Ports start asleep; a ship that brings what
       a port's climate cannot grow wakes it. Lanes and lights — nothing is owned, no border
       is coloured, nothing is taken.
     · The adversary is NATURE, never people: storms by season, sea ice by season, winds that
       help one way and hinder the other.
     · Helping is the best move: a port in a lean season asks for one cargo; answering it
       pays the most goodwill, and goodwill is what moves the world into its next age.
     · A turn is a MONTH and nothing happens until "Next month" (Sabhyata's Sochna).

   Every fact a port tells is worked from the data (its country, continent and latitude →
   its climate band and wind belt). Lanes are measured from the map (data/sealanes.js). */
import { PLACES } from '../data/places.js';
import { LANES } from '../data/sealanes.js';
import { byCc, haversine } from '../geo.js';
import { seeded, int } from '../rand.js';
import { PORT_NAMES, ERAS, BANDS, bandOf, BELTS, beltOf, MONSOON, HAZARDS, STRAITS, CANALS, MONTHS } from './tw-data.js';

/* ------------------------------------------------------------------ the ports */
export const PORTS = PORT_NAMES.map((nc, i) => {
  const [n, cc] = nc.split('|'), p = PLACES.find((x) => x.n === n && x.cc === cc), c = byCc[cc];
  const band = bandOf(p.at[0]);
  return { i, n, cc, at: p.at, country: c ? c.name : cc, cont: c ? c.cont : '', band: band.id, good: band.good };
});
const OCEAN_OF = (i) => (i < 16 ? 'indian' : i < 38 ? 'pacific' : 'atlantic');
export const OCEANS = { indian: 'Indian Ocean', pacific: 'Pacific', atlantic: 'Atlantic and its seas' };
PORTS.forEach((p) => { p.ocean = OCEAN_OF(p.i); });
export const GOODS = Object.fromEntries(BANDS.map((b) => [b.good, b]));
export const HOMES = [
  { id: 'indian', port: PORT_NAMES.findIndex((x) => x.startsWith('Mumbai|')), say: 'the Indian Ocean, from Mumbai' },
  { id: 'atlantic', port: PORT_NAMES.findIndex((x) => x.startsWith('Lisbon|')), say: 'the Atlantic, from Lisbon' },
  { id: 'pacific', port: PORT_NAMES.findIndex((x) => x.startsWith('Sydney|')), say: 'the Pacific, from Sydney' },
];

/* ------------------------------------------------------------------ the lanes in an age */
/* LANES p[i] null = same path as configuration i-1 */
const pathOf = (L, g) => { for (let i = g; i >= 0; i--) if (L.p[i]) return L.p[i]; return null; };
export function lanesIn(canals) {
  return LANES.filter((L) => L.km[canals] > 0).map((L) => ({ a: L.a, b: L.b, km: L.km[canals], path: pathOf(L, canals) }));
}

/* ------------------------------------------------------------------ wind and season */
const wrap = (x) => ((((x + 180) % 360) + 360) % 360) - 180;
const inMonsoon = (lat, lng) => lat >= MONSOON.box[0] && lat <= MONSOON.box[2] && lng >= MONSOON.box[1] && lng <= MONSOON.box[3];
/* the wind on one stretch of sea, this month: which belt, and does it push east (+1) or west (−1)? */
export function windAt(lat, lng, month) {
  if (inMonsoon(lat, lng)) { if (MONSOON.sw.includes(month)) return { id: 'monsoon', east: 1, name: 'the summer monsoon' }; if (MONSOON.ne.includes(month)) return { id: 'monsoon', east: -1, name: 'the winter monsoon' }; }
  const b = beltOf(lat); return { id: b.id, east: b.east, name: b.name };
}
/* a leg's time in months, and what the winds did. weight = how much wind matters in this age */
export function legTime(path, km, month, era) {
  const E = ERAS[era]; let t = 0, help = {}, against = {}, cyclone = false, ice = false;
  for (let i = 0; i + 1 < path.length; i++) {
    const a = path[i], b = path[i + 1], seg = haversine(a, b); if (!seg) continue;
    const midLat = (a[0] + b[0]) / 2, midLng = a[1] + wrap(b[1] - a[1]) / 2, dLng = wrap(b[1] - a[1]), dLat = b[0] - a[0];
    const w = windAt(midLat, midLng, month), eastward = Math.sign(dLng), zonal = Math.abs(dLng * Math.cos((midLat * Math.PI) / 180)) > Math.abs(dLat) * 0.6;
    let f = 1;
    if (zonal && eastward === w.east) { f = 0.75; help[w.id] = (help[w.id] || 0) + seg; }
    else if (zonal && eastward === -w.east) { f = 1.35; against[w.id] = (against[w.id] || 0) + seg; }
    t += (seg / E.speed) * (1 + (f - 1) * E.wind);
    const hemi = midLat >= 0 ? 'north' : 'south', al = Math.abs(midLat);
    if (al >= HAZARDS.cyclones.lat[0] && al <= HAZARDS.cyclones.lat[1] && HAZARDS.cyclones[hemi].includes(month)) cyclone = true;
    if (Math.abs(a[0]) >= HAZARDS.ice.lat && HAZARDS.ice[a[0] >= 0 ? 'north' : 'south'].includes(month)) ice = true;
  }
  const scale = km / Math.max(1, path.reduce((s, p, i) => (i ? s + haversine(path[i - 1], p) : s), 0));   // the lane's measured km, not the simplified polyline's
  return { t: t * (isFinite(scale) && scale > 0 ? scale : 1), help, against, cyclone, ice };
}
/* straits and canals a path passes through (within 80 km of their channel) */
export function passages(path) {
  const near = (line) => line.some((q) => path.some((p) => haversine(p, q) < 80));
  return [...STRAITS.filter((s) => near(s.line)).map((s) => s.id), ...Object.entries(CANALS).filter(([, c]) => near(c.line)).map(([id]) => id)];
}

/* ------------------------------------------------------------------ the voyage planner */
/* The quickest way from port a to port b this month, leg by leg; null if the sea will not allow it. */
export function plan(S, a, b) {
  if (a === b) return null;
  const era = S.era, lanes = lanesIn(ERAS[era].canals), month = S.month;
  const adj = PORTS.map(() => []);
  for (const L of lanes) {
    const fw = legTime(L.path, L.km, month, era), bw = legTime([...L.path].reverse(), L.km, month, era);
    if (!fw.ice) adj[L.a].push({ to: L.b, L, path: L.path, w: fw });
    if (!bw.ice) adj[L.b].push({ to: L.a, L, path: [...L.path].reverse(), w: bw });
  }
  const dist = PORTS.map(() => Infinity), prev = PORTS.map(() => null); dist[a] = 0;
  const done = new Set();
  for (;;) {
    let u = -1; for (let i = 0; i < PORTS.length; i++) if (!done.has(i) && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] === Infinity) break; done.add(u); if (u === b) break;
    for (const e of adj[u]) { const nd = dist[u] + e.w.t + (e.w.cyclone ? HAZARDS.cyclones.wait : 0) + 0.05; if (nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = { from: u, e }; } }
  }
  if (dist[b] === Infinity) return null;
  const legs = []; for (let x = b; x !== a; x = prev[x].from) legs.unshift(prev[x].e);
  const path = legs.flatMap((e, i) => (i ? e.path.slice(1) : e.path));
  const help = {}, against = {}; let km = 0, cyclone = false;
  for (const e of legs) { km += e.L.km; cyclone = cyclone || e.w.cyclone; for (const [k, v] of Object.entries(e.w.help)) help[k] = (help[k] || 0) + v; for (const [k, v] of Object.entries(e.w.against)) against[k] = (against[k] || 0) + v; }
  return { a, b, legs: legs.length, via: legs.slice(0, -1).map((e) => e.to), path, km: Math.round(km), months: Math.max(1, Math.ceil(dist[b] - 0.05 * legs.length - 0.01)), help, against, cyclone, pass: passages(path) };
}

/* ------------------------------------------------------------------ the game */
export function newGame(home = 'indian', seed = 'tw' + Date.now()) {
  const H = HOMES.find((h) => h.id === home) || HOMES[0];
  const S = { v: 1, seed, home: H.port, month: 0, year: ERAS[0].year, turn: 0, era: 0, goodwill: 0,
    ports: PORTS.map((p) => ({ awake: p.i === H.port, stock: p.i === H.port ? 3 : 0 })),
    ships: [1, 2, 3].map((id) => ({ id, at: H.port, voyage: null })),
    asks: [], log: [], stats: { voyages: 0, km: 0, wind: {}, against: {}, pass: {}, helped: 0, woke: 1 }, news: [], won: false };
  S.log.unshift(`${MONTHS[0]} ${S.year}: three ships wait in ${PORTS[H.port].n}. Every other port sleeps.`);
  return S;
}
export const awakeCount = (S) => S.ports.filter((p) => p.awake).length;
export const shipsFor = (S) => Math.min(9, 3 + Math.floor((awakeCount(S) - 1) / 5));
/* a port wants any cargo its own climate band does not grow */
export const wants = (portI, good) => PORTS[portI].good !== good;

/* send a docked ship from its port to b, carrying one of the port's cargo if it has any */
export function sail(S, shipId, b) {
  const sh = S.ships.find((x) => x.id === shipId); if (!sh || sh.voyage || sh.at == null) return { error: 'That ship is not in port.' };
  const P = plan(S, sh.at, b); if (!P) return { error: 'The sea will not allow that voyage this month.' };
  /* a ship keeps what it carries until a port wants it; an empty ship loads this port's own cargo */
  const from = sh.at, st = S.ports[from];
  let cargo = sh.cargo || null;
  if (!cargo && st.awake && st.stock > 0) { cargo = PORTS[from].good; st.stock--; }
  sh.cargo = null;
  sh.voyage = { from, to: b, cargo, path: P.path, months: P.months, left: P.months, help: P.help, against: P.against, pass: P.pass, km: P.km };
  sh.at = null;
  S.stats.voyages++; S.stats.km += P.km;
  for (const [k, v] of Object.entries(P.help)) S.stats.wind[k] = (S.stats.wind[k] || 0) + Math.round(v);
  for (const [k, v] of Object.entries(P.against)) S.stats.against[k] = (S.stats.against[k] || 0) + Math.round(v);
  S.log.unshift(`Ship ${shipId} sails from ${PORTS[from].n} for ${PORTS[b].n}${cargo ? ` with ${GOODS[cargo].goodName}` : ', empty'} — ${P.months} ${P.months === 1 ? 'month' : 'months'}.`);
  return { ok: true, plan: P };
}

/* the month turns: ports grow, ships move, ships arrive, asks come and go, the age may change */
export function nextMonth(S) {
  const news = [];
  S.turn++; S.month = (S.month + 1) % 12; if (S.month === 0) S.year++;
  S.ports.forEach((p) => { if (p.awake) p.stock = Math.min(4, p.stock + 2); });
  for (const sh of S.ships) {
    const v = sh.voyage; if (!v) continue;
    v.left--; if (v.left > 0) continue;
    sh.voyage = null; sh.at = v.to;
    for (const id of v.pass) if (!S.stats.pass[id]) { S.stats.pass[id] = S.turn; news.push({ k: 'pass', id }); }
    const port = S.ports[v.to], P = PORTS[v.to];
    if (v.cargo && wants(v.to, v.cargo)) {
      const ask = S.asks.find((x) => x.port === v.to && x.good === v.cargo && !x.done);
      if (!port.awake) { port.awake = true; port.stock = 2; S.goodwill += 2; S.stats.woke++; news.push({ k: 'wake', port: v.to, good: v.cargo }); S.log.unshift(`${P.n} wakes! The ${GOODS[v.cargo].goodName} from ${PORTS[v.from].n} arrived.`); }
      else if (ask) { ask.done = true; S.goodwill += 4; S.stats.helped++; news.push({ k: 'helped', port: v.to, good: v.cargo }); S.log.unshift(`${P.n} thanks you — the ${GOODS[v.cargo].goodName} came when it was needed.`); }
      else { S.goodwill += 1; news.push({ k: 'trade', port: v.to, good: v.cargo }); S.log.unshift(`${P.n} trades for the ${GOODS[v.cargo].goodName}.`); }
    } else { if (v.cargo) sh.cargo = v.cargo; news.push({ k: 'arrive', port: v.to, cargo: v.cargo }); }
    /* TRADE: having delivered, a ship takes on this port's own cargo — fruit to Lisbon comes back as grain */
    if (!sh.cargo && port.awake && port.stock > 0) { sh.cargo = P.good; port.stock--; }
  }
  /* new ships as the world wakes */
  while (S.ships.length < shipsFor(S)) { const id = S.ships.length + 1; S.ships.push({ id, at: S.home, voyage: null }); news.push({ k: 'ship', id }); S.log.unshift(`A new ship is ready in ${PORTS[S.home].n}.`); }
  /* asks: every fourth month an awake port in a lean season asks for one cargo (seeded, never random-for-reward) */
  S.asks = S.asks.filter((x) => !x.done && x.until > S.turn);
  if (S.turn % 4 === 0) {
    const r = seeded(S.seed + ':' + S.turn), awake = S.ports.map((p, i) => i).filter((i) => S.ports[i].awake && i !== S.home);
    if (awake.length) {
      const i = awake[int(0, awake.length - 1, r)], goods = BANDS.map((b) => b.good).filter((g) => wants(i, g));
      const ask = { port: i, good: goods[int(0, goods.length - 1, r)], until: S.turn + 6, done: false };
      S.asks.push(ask); news.push({ k: 'ask', ...ask }); S.log.unshift(`A lean season in ${PORTS[i].n}: they ask for ${GOODS[ask.good].goodName}.`);
    }
  }
  /* a new age, when the goodwill is there */
  const nx = ERAS[S.era + 1];
  if (nx && S.goodwill >= nx.need) { S.era++; news.push({ k: 'era', era: S.era }); S.log.unshift(`${nx.name}!`); }
  if (S.ports.every((p) => p.awake) && !S.won) { S.won = true; news.push({ k: 'won' }); }
  S.log = S.log.slice(0, 40); S.news = news;
  return news;
}

/* what a port tells when it wakes — all of it from the data */
export function portFact(i) {
  const P = PORTS[i], b = BANDS.find((x) => x.id === P.band), belt = beltOf(P.at[0]);
  return `${P.n} is in ${P.country}${P.cont ? `, in ${P.cont}` : ''}, ${Math.abs(P.at[0]).toFixed(0)}° ${P.at[0] >= 0 ? 'north' : 'south'} of the equator — in the ${b.name.toLowerCase()}, where ${belt.name} ${belt.says}.`;
}

/* A test player: always sail every docked ship to the quickest sleeping port that wants its
   cargo (or an ask). It proves a game can be WON — the world is connected in every age. */
export function autoplay(S, maxTurns = 400) {
  while (!S.won && S.turn < maxTurns) {
    for (const sh of S.ships) {
      if (sh.voyage || sh.at == null) continue;
      const from = sh.at, cargo = sh.cargo || (S.ports[from].awake && S.ports[from].stock > 0 ? PORTS[from].good : null);
      const sleepers = PORTS.map((p) => p.i).filter((i) => i !== from && cargo && !S.ports[i].awake && wants(i, cargo) && !S.ships.some((o) => o.voyage && o.voyage.to === i));
      const asks = PORTS.map((p) => p.i).filter((i) => i !== from && cargo && S.asks.some((x) => x.port === i && x.good === cargo && !x.done));
      /* nothing wants this cargo nearby: trade it at an awake port of another band, and take theirs */
      const trade = PORTS.map((p) => p.i).filter((i) => i !== from && S.ports[i].awake && (!cargo || wants(i, cargo)) && S.ports[i].stock > 0);
      const pickFrom = (ts) => ts.map((t) => ({ t, p: plan(S, from, t) })).filter((x) => x.p).sort((x, y) => x.p.months - y.p.months)[0];
      const best = pickFrom([...sleepers, ...asks]) || pickFrom(trade);
      if (best) sail(S, sh.id, best.t);
    }
    nextMonth(S);
  }
  return S;
}
