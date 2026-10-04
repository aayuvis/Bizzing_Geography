/* tw-voyage.js — Shelly's Trade Winds: The Long Voyage. The rules, no DOM: test/games.mjs sails
   whole careers with them.

   One loop over a century of game time: SAIL, MEET THE SEA, GO ASHORE, GROW.
     · The sea is the old engine's (tw-engine.js): lanes measured from the app's own map, the wind
       belts and the monsoon, cyclone season and sea ice, four ages with their canals.
     · Shelby starts with one small boat, two crew and a turtle in Mumbai. Ports are dark; a port is
       LIT when a ship sells it something its own climate cannot grow.
     · Ashore: a market (prices move with supply), sights (true things, XP once), an assignment board,
       and in the bigger ports a shipyard. Coin is the game's trade money; XP never comes from time.
     · Every ship is four marks, 1–10: speed, cargo, strength, guard. Inventions are bought in a
       shipyard as their age arrives; some things are only ever earned.
     · Danger is real and the clock stops for it: pirates, a war at a strait, cyclones, great waves,
       icebergs, fog. Every card shows its choices and what each costs. The crew always comes home.
     · Keeper's Gifts wake at story moments, each with a cooldown and a cost.
     · The end: all sixty ports lit, all ten expeditions sealed, every invention, ten ships.

   Randomness is seeded from the game's seed and the month — never a dice roll for a reward. */
import { PORTS, GOODS, HOMES, lanesIn, legTime, passages, portFact } from './tw-engine.js';
import { ERAS, BANDS, HAZARDS, MONTHS } from './tw-data.js';
import { byCc, haversine } from '../geo.js';
import { seeded, int } from '../rand.js';
import { RANKS, CLASSES, SHIP_NAMES, INVENTIONS, EARNED, CREW, GIFTS, EXPEDITIONS, MEGA, FOG, BERGS, CAPE, HORN, PIRATE_SPEED, BEATS, LOG, CRATES_PER } from './tw-story.js';

export { PORTS, GOODS, HOMES };
const P = (n) => PORTS.findIndex((x) => x.n === n);
export const HOME = P('Mumbai');
const inBox = (at, b) => at[0] >= b[0] && at[0] <= b[2] && (b[1] <= b[3] ? at[1] >= b[1] && at[1] <= b[3] : at[1] >= b[1] || at[1] <= b[3]);
const pathIn = (path, box) => path.some((p) => inBox(p, box));

/* ------------------------------------------------------------------ the ports' own facts (from the data) */
/* the yards: the larger ports of the game (a game simplification, said so on screen) */
export const YARDS = ['Mumbai', 'Kolkata', 'Colombo', 'Singapore', 'Shanghai', 'Tokyo', 'Sydney', 'San Francisco', 'New York', 'Halifax', 'London', 'Rotterdam', 'Lisbon', 'Marseille', 'Genoa', 'Istanbul', 'Alexandria', 'Cape Town', 'Buenos Aires', 'Rio de Janeiro'].map(P);
/* the Pacific's island ports: a port in the Pacific whose country has no land border (from the data) */
export const PACIFIC_ISLANDS = PORTS.filter((p) => p.ocean === 'pacific' && byCc[p.cc] && !(byCc[p.cc].borders || []).length).map((p) => p.i);
const BAND_I = Object.fromEntries(BANDS.map((b, i) => [b.id, i]));
const GOOD_BAND = Object.fromEntries(BANDS.map((b) => [b.good, b.id]));
export const BASE = { fruit: 12, cotton: 14, grain: 10, timber: 16 };
/* sights: what the data says about the port and its country; a few story ports add a sourced sight */
const STORY_SIGHT = {
  Muscat: { t: 'The forts above the harbour', log: 'albatross' }, Mombasa: { t: 'The whale road off the reef', log: 'humpback' },
  'Cape Town': { t: 'Table Mountain and its tablecloth', log: 'tablecloth' }, Alexandria: { t: 'Where the Pharos stood', log: 'pharos' },
  Halifax: { t: 'The fog bank offshore', log: 'fog' }, 'Colón': { t: 'The canal locks', log: 'locks', era: 3 }, 'Panama City': { t: 'The canal locks', log: 'locks', era: 3 },
  Reykjavík: { t: 'Ice on the horizon', log: 'iceberg' }, Mumbai: { t: 'The shipyard slipways', log: 'float' }, Karachi: { t: 'The cyclone signals on the harbour wall', log: 'cyclone' },
};
export function sightsOf(i) {
  const p = PORTS[i], c = byCc[p.cc], out = [{ id: 'climate', t: 'The weather and the winds', say: portFact(i) }];
  if (c) out.push({ id: 'country', t: `${c.name} from the quay`, say: `${p.n} is a port of ${c.name}, in ${c.cont}. Its capital is ${c.cap.join(' and ')}. ${(c.borders || []).length ? `It shares a land border with ${c.borders.length} ${c.borders.length === 1 ? 'country' : 'countries'}.` : 'It has no land border at all: an island country.'}` });
  const s = STORY_SIGHT[p.n]; if (s) out.push({ id: 'story', t: s.t, say: LOG[s.log].fact, log: s.log, era: s.era || 0 });
  return out;
}

/* ------------------------------------------------------------------ the lanes, with the straits each passes */
const LANES = {};
const lanesFor = (canals) => LANES[canals] || (LANES[canals] = lanesIn(canals).map((L) => ({ ...L, pass: passages(L.path) })));

/* ------------------------------------------------------------------ marks */
export const classOf = (sh) => CLASSES.find((c) => c.id === sh.cls);
export function marks(S, sh) {
  const m = { ...classOf(sh).m };
  for (const id of sh.ups || []) { const u = INVENTIONS.find((x) => x.id === id); if (u) m[u.mark] += u.plus; }
  for (const e of EARNED) if (S.earned[e.id]) m[e.mark] += e.plus;
  if (sh.id === 1 && S.crew.pereira === 'aboard') m.strength += 1;
  if (sh.mast) m.speed -= 1;
  for (const k of Object.keys(m)) m[k] = Math.max(1, Math.min(10, m[k]));
  return m;
}
export const capacity = (S, sh) => marks(S, sh).cargo * CRATES_PER;
export const holdCount = (sh) => (sh.hold || []).reduce((a, l) => a + l.n, 0) + (sh.jobs || []).reduce((a, j) => a + (j.n || 0), 0);
export const holdOf = (sh, g) => (sh.hold || []).filter((l) => l.g === g).reduce((a, l) => a + l.n, 0);
const speedF = (sp) => Math.max(0.55, Math.min(1.2, 1.15 - 0.07 * (sp - 2)));
const giftsAwake = (S) => !(S.rest > S.turn);
export const hasGift = (S, id) => !!S.gifts[id];

/* ------------------------------------------------------------------ the planner */
/* the sea this month, as a graph — the same for every ship, so kept (a war's strait is closed) */
const ADJ = new Map();
function adjacency(era, month, shut) {
  const key = `${era}|${month}|${shut || ''}`; if (ADJ.has(key)) return ADJ.get(key);
  const adj = PORTS.map(() => []);
  for (const L of lanesFor(ERAS[era].canals)) {
    if (shut && L.pass.includes(shut)) continue;
    const fw = legTime(L.path, L.km, month, era), bw = legTime([...L.path].reverse(), L.km, month, era);
    if (!fw.ice) adj[L.a].push({ to: L.b, L, path: L.path, w: fw });
    if (!bw.ice) adj[L.b].push({ to: L.a, L, path: [...L.path].reverse(), w: bw });
  }
  ADJ.set(key, adj); return adj;
}
/* the quickest way from a to b for THIS ship this month */
export function planFor(S, shipId, a, b) {
  if (a === b) return null;
  const sh = S.ships.find((x) => x.id === shipId), era = S.era, month = S.month;
  const shut = S.war && S.war.until > S.turn ? S.war.strait : null, adj = adjacency(era, month, shut);
  const dist = PORTS.map(() => Infinity), prev = PORTS.map(() => null), done = new Set(); dist[a] = 0;
  for (;;) {
    let u = -1; for (let i = 0; i < PORTS.length; i++) if (!done.has(i) && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] === Infinity) break; done.add(u); if (u === b) break;
    for (const e of adj[u]) { const nd = dist[u] + e.w.t + 0.05; if (nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = { from: u, e }; } }
  }
  if (dist[b] === Infinity) return null;
  const legs = []; for (let x = b; x !== a; x = prev[x].from) legs.unshift(prev[x].e);
  const path = legs.flatMap((e, i) => (i ? e.path.slice(1) : e.path));
  const help = {}, against = {}; let km = 0, cyclone = false;
  for (const e of legs) { km += e.L.km; cyclone = cyclone || e.w.cyclone; for (const [k, v] of Object.entries(e.w.help)) help[k] = (help[k] || 0) + v; for (const [k, v] of Object.entries(e.w.against)) against[k] = (against[k] || 0) + v; }
  const base = dist[b] - 0.05 * legs.length;
  let f = speedF(marks(S, sh).speed);
  if (shipId === 1 && hasGift(S, 'tidesense') && giftsAwake(S)) f *= 0.9;              // Tidesense: Shelly rides the currents
  if (shipId === 1 && S.crew.ama === 'aboard' && base >= 3) f *= 0.9;                    // Ama reads the long winds
  const months = Math.max(1, Math.ceil(base * f - 0.01));
  const pass = [...new Set(legs.flatMap((e) => e.L.pass))];
  return { a, b, path, km: Math.round(km), months, via: legs.slice(0, -1).map((e) => e.to), help, against, cyclone, pass, risk: risks(S, sh, path, cyclone) };
}
/* what the sea holds on this path, foreseen as far as the crew and the gifts can see */
export function darkness(S, path) {
  const lit = PORTS.filter((p) => S.ports[p.i].lit).map((p) => p.at);
  if (!path.length) return 0;
  let dark = 0; for (const q of path) if (!lit.some((l) => haversine(l, q) < 1000)) dark++;
  return dark / path.length;
}
export function risks(S, sh, path, cyclone) {
  const g = marks(S, sh).guard, dark = darkness(S, path);
  return {
    pirates: Math.round(Math.min(0.9, dark * 0.85 * Math.max(0.1, 1 - g / 10)) * 100) / 100, dark,
    cyclone, mega: MEGA.filter((m) => pathIn(path, m.box)).map((m) => m.id), fog: FOG.filter((m) => pathIn(path, m.box)).map((m) => m.id),
    bergs: pathIn(path, BERGS.box) && BERGS.months.includes(S.month),
  };
}

/* ------------------------------------------------------------------ a new game */
export function newGame(seed = 'lv' + Date.now()) {
  const S = { v: 2, seed, month: 0, year: ERAS[0].year, turn: 0, era: 0, goodwill: 0, coin: 150, xp: 0, home: HOME,
    ports: PORTS.map((p) => ({ lit: p.i === HOME, stock: p.i === HOME ? 60 : 0, glut: {}, seen: {}, st: 0 })),
    ships: [], crew: { pereira: 'aboard', tavi: 'aboard' }, gifts: {}, earned: {}, inv: {}, stand: { varn: 0, ostery: 0 },
    jobs: [], taken: {}, done: 0, asks: [], war: null, warEnded: null, ex: {}, exp: { cinnamon: 0, northice: {}, cold: 0, convoy: 0, lean: {} },
    beats: {}, logs: {}, pending: [], news: [], log: [], rest: 0, still: -99, quiz: null, stats: { voyages: 0, km: 0, lit: 1, dangers: 0 }, won: false };
  addShip(S, 'dhow', HOME, 'Small Hope');
  beat(S, 'start');
  S.log.unshift(`${MONTHS[0]} ${S.year}: the Small Hope waits in Mumbai. Every other light on the Lantern Road is dark.`);
  return S;
}
function addShip(S, cls, at, name) {
  const id = S.ships.length + 1, used = new Set(S.ships.map((s) => s.name));
  S.ships.push({ id, cls, name: name || SHIP_NAMES.find((n) => !used.has(n)) || `Ship ${id}`, at, voyage: null, hold: [], jobs: [], ups: [], hull: 10, mast: false, route: null });
  return S.ships[S.ships.length - 1];
}
const say = (S, line) => { S.log.unshift(`${MONTHS[S.month]} ${S.year}: ${line}`); S.log = S.log.slice(0, 60); };
const news = (S, n) => S.news.push(n);
function amaReturns(S) { S.crew.ama = 'aboard'; news(S, { k: 'crew', id: 'ama' }); beat(S, 'amareturns'); gift(S, 'stormsight'); }
function beat(S, id) { if (S.beats[id] || !BEATS[id]) return; S.beats[id] = S.turn; news(S, { k: 'beat', id }); if (BEATS[id].log) addLog(S, BEATS[id].log); }
export function addLog(S, id) { if (!LOG[id] || S.logs[id] != null) return; S.logs[id] = S.turn; news(S, { k: 'log', id }); }
function gift(S, id) { if (S.gifts[id]) return; S.gifts[id] = S.turn; news(S, { k: 'gift', id }); say(S, `A Keeper’s Gift wakes: ${GIFTS.find((g) => g.id === id).name}.`); }
function earn(S, id) { if (S.earned[id]) return; S.earned[id] = S.turn; news(S, { k: 'earned', id }); }
function xp(S, n, why) { S.xp += n; if (why) news(S, { k: 'xp', n, why }); }

/* ------------------------------------------------------------------ the career */
export function rankOf(S) { let r = RANKS[0]; for (const x of RANKS) if (S.xp >= x.xp && S.ships.length >= x.ships) r = x; return r; }
export const rankAt = (S, id) => RANKS.findIndex((x) => x.id === rankOf(S).id) >= RANKS.findIndex((x) => x.id === id);
export const litCount = (S) => S.ports.filter((p) => p.lit).length;

/* ------------------------------------------------------------------ the market */
const warNear = (S, i) => S.war && S.war.until > S.turn && haversine(PORTS[i].at, S.war.at) < 1600;
export function buyPrice(S, i) { const g = PORTS[i].good; return Math.max(1, Math.round(BASE[g] * 0.6 * (warNear(S, i) ? 1.3 : 1))); }
export function sellPrice(S, i, g) {
  if (g === PORTS[i].good) return Math.max(1, Math.round(BASE[g] * 0.5));
  const far = Math.abs(BAND_I[PORTS[i].band] - BAND_I[GOOD_BAND[g]]), glut = (S.ports[i].glut[g] || 0);
  const v = BASE[g] * (1 + 0.3 * far) * (100 / (100 + glut)) * (warNear(S, i) ? 1.3 : 1) * (S.ports[i].lit ? 1 : 1.5);
  return Math.max(1, Math.round(v));
}
export function buy(S, shipId, n) {
  const sh = S.ships.find((x) => x.id === shipId); if (!sh || sh.voyage) return { error: 'That ship is at sea.' };
  const i = sh.at, st = S.ports[i], g = PORTS[i].good, pr = buyPrice(S, i);
  if (!st.lit) return { error: 'This port is still dark — nothing is sold here until it is lit.' };
  n = Math.min(n, st.stock, capacity(S, sh) - holdCount(sh), Math.floor(S.coin / pr));
  if (n <= 0) return { error: st.stock <= 0 ? 'The market is sold out this month.' : capacity(S, sh) <= holdCount(sh) ? 'The hold is full.' : 'Not enough coin.' };
  st.stock -= n; S.coin -= n * pr;
  const lot = sh.hold.find((l) => l.g === g && l.from === i && l.clean); if (lot) lot.n += n; else sh.hold.push({ g, n, from: i, clean: true });
  addLog(S, 'supply');
  return { ok: true, n, cost: n * pr };
}
export function sell(S, shipId, g, n = Infinity) {
  const sh = S.ships.find((x) => x.id === shipId); if (!sh || sh.voyage) return { error: 'That ship is at sea.' };
  const i = sh.at, st = S.ports[i], have = holdOf(sh, g); n = Math.min(n, have);
  if (n <= 0) return { error: 'Nothing of that in the hold.' };
  const pr = sellPrice(S, i, g); let left = n;
  const out = { g, n, coin: n * pr, from: {} };
  for (const l of sh.hold.filter((x) => x.g === g)) { const k = Math.min(l.n, left); l.n -= k; left -= k; out.from[l.from] = (out.from[l.from] || 0) + (l.clean ? k : 0); out.dirty = (out.dirty || 0) + (l.clean ? 0 : k); if (!left) break; }
  sh.hold = sh.hold.filter((l) => l.n > 0);
  S.coin += out.coin; st.glut[g] = (st.glut[g] || 0) + n;
  const foreign = g !== PORTS[i].good;
  if (foreign && !st.lit) light(S, i, g, sh);
  else if (foreign && st.soldAt !== S.turn) { st.soldAt = S.turn; S.goodwill += 1; }
  /* an ask answered: ten crates of what was asked for */
  const ask = S.asks.find((x) => x.port === i && x.good === g && !x.done && x.until >= S.turn);
  if (ask && n >= 10) { ask.done = true; S.goodwill += 4; xp(S, 40, `${PORTS[i].n} got the ${GOODS[g].goodName} it asked for`); S.exp.lean[S.year] = S.exp.lean[S.year] || { asked: 0, answered: 0 }; S.exp.lean[S.year].answered++; news(S, { k: 'helped', port: i, good: g }); }
  /* expeditions counted on a sale */
  if (rankAt(S, 'captain')) {
    if (PORTS[i].n === 'Cape Town') S.exp.cinnamon += out.from[P('Colombo')] || 0;
    if (PORTS[i].n === 'Reykjavík' && [5, 6, 7].includes(S.month)) S.exp.northice[S.year] = (S.exp.northice[S.year] || 0) + n;
    if (g === 'timber' && PORTS[i].band === 'trop') S.exp.cold += Object.entries(out.from).filter(([f]) => PORTS[+f].band === 'cold').reduce((a, [, k]) => a + k, 0);
  }
  checkExpeditions(S);
  return { ok: true, ...out };
}
function light(S, i, g, sh) {
  const st = S.ports[i]; st.lit = true; st.stock = 20; S.goodwill += 2; S.stats.lit++;
  xp(S, 60, `${PORTS[i].n} is lit`); news(S, { k: 'wake', port: i, good: g, ship: sh && sh.id });
  say(S, `${PORTS[i].n} is lit! Its lamp burns again — the ${GOODS[g].goodName} did it.`);
  const n = litCount(S);
  if (n >= 2) gift(S, 'tidesense');
  if (n >= 5) gift(S, 'deepspeech');
  if (n >= 10) earn(S, 'starcharts');
  const name = PORTS[i].n;
  if (BEATS[name] && !['Halifax'].includes(name)) beat(S, name);
  if (name === 'Muscat' && !S.crew.ama) { S.crew.ama = 'aboard'; news(S, { k: 'crew', id: 'ama' }); }
  if (name === 'Karachi' && !S.crew.farida) { S.crew.farida = 'aboard'; news(S, { k: 'crew', id: 'farida' }); }
  if (name === 'Mombasa') earn(S, 'signalgun');
  if (name === 'Halifax' && S.era >= 2 && S.crew.pereira === 'aboard') { S.crew.pereira = 'ashore'; earn(S, 'bowline'); beat(S, 'Halifax'); }
  if (name === 'Cape Town' && S.crew.ama === 'aboard') { S.crew.ama = 'away'; S.amaGone = S.turn; news(S, { k: 'crew', id: 'ama', away: true }); }
  if (n === PORTS.length) { gift(S, 'longlight'); beat(S, 'longlight'); }
  checkExpeditions(S);
}

/* ------------------------------------------------------------------ sights and the quick question */
export function visitSight(S, i, id) {
  const st = S.ports[i]; if (!S.ships.some((x) => x.at === i && !x.voyage)) return { error: 'Only a ship in port can go ashore.' };
  const s = sightsOf(i).find((x) => x.id === id); if (!s || st.seen[id] || (s.era || 0) > S.era) return { error: 'Seen already.' };
  st.seen[id] = S.turn; xp(S, 15, `a sight in ${PORTS[i].n}`); if (s.log) addLog(S, s.log);
  return { ok: true, sight: s };
}
/* a Ship's Log card collected at least a month ago comes back as a question in port */
export function quizFor(S) { const ids = Object.entries(S.logs).filter(([, t]) => S.turn - t >= 1).map(([id]) => id).filter((id) => !(S.quizzed || {})[id] || S.turn - S.quizzed[id] >= 12); return ids.length ? ids[int(0, ids.length - 1, seeded(S.seed + ':q' + S.turn))] : null; }
export function answerQuiz(S, id, a) { S.quizzed = S.quizzed || {}; S.quizzed[id] = S.turn; const right = LOG[id] && a === LOG[id].a; if (right) xp(S, 10, 'a Ship’s Log question'); S.quiz = null; return right; }

/* ------------------------------------------------------------------ the assignment board */
const season = (S) => Math.floor(S.turn / 3);
export function board(S, i) {
  if (!S.ports[i].lit) return [];
  const r = seeded(`${S.seed}:b${i}:${season(S)}`), master = rankAt(S, 'master'), out = [];
  const dests = PORTS.map((p) => p.i).filter((j) => j !== i).map((j) => ({ j, km: haversine(PORTS[i].at, PORTS[j].at) })).filter((x) => x.km > 1500 && x.km < (master ? 14000 : 7000)).sort((a, b) => a.km - b.km);
  const n = 3 + (S.ports[i].st >= 3 ? 1 : 0);
  for (let k = 0; k < n && dests.length; k++) {
    const d = dests[int(0, dests.length - 1, r)], months = Math.ceil(d.km / ERAS[S.era].speed) + 3, kind = ['cargo', 'letter', 'passenger', 'cargo'][k % 4];
    const key = `${i}:${season(S)}:${k}`;
    if (S.taken[key]) continue;
    const job = { key, kind, from: i, to: d.j, due: S.turn + months, months };
    if (kind === 'cargo') { job.g = PORTS[i].good; job.n = (master ? [6, 10, 16, 24] : [6, 10])[int(0, master ? 3 : 1, r)]; job.coin = Math.round(job.n * BASE[job.g] * 1.4 + 20); job.xp = 30 + job.n; }
    else if (kind === 'letter') { job.coin = 40 + Math.round(d.km / 200); job.xp = 25; job.forged = S.beats.master != null && r() < 0.3; }
    else { job.coin = 60 + Math.round(d.km / 150); job.xp = 30; }
    out.push(job);
  }
  /* the war's own job: a letter between the fleets, once both crowns will hear you */
  /* (only by Truthlight's evidence: the forged letter exposed, the true one carried — the story's way) */
  if (S.war && S.war.until > S.turn && hasGift(S, 'truthlight') && PORTS[i].n === 'Aden' && !S.taken['peace:' + S.war.n]) out.unshift({ key: 'peace:' + S.war.n, kind: 'peace', from: i, to: P('Jeddah'), due: S.turn + 4, months: 4, coin: 100, xp: 150 });
  /* the whales' favour */
  if (S.whales && S.whales.port === i && !S.taken['whales:' + S.whales.season]) out.unshift({ key: 'whales:' + S.whales.season, kind: 'whales', from: i, to: S.whales.to, due: S.turn + 6, months: 6, coin: 0, xp: 40 });
  /* convoy jobs in the last age, for a captain with the wireless */
  if (S.era >= 3 && rankAt(S, 'captain') && S.ports[i].lit && YARDS.includes(i) && !S.taken[`convoy:${i}:${season(S)}`]) {
    const far = dests.filter((x) => x.km > 4000); if (far.length) { const d = far[int(0, far.length - 1, r)]; out.push({ key: `convoy:${i}:${season(S)}`, kind: 'convoy', from: i, to: d.j, due: S.turn + Math.ceil(d.km / ERAS[S.era].speed) + 4, months: 0, coin: 300, xp: 120, needGuard: 6 }); }
  }
  return out;
}
export function accept(S, shipId, key) {
  const sh = S.ships.find((x) => x.id === shipId); if (!sh || sh.voyage) return { error: 'Only a ship in port can sign.' };
  const job = board(S, sh.at).find((j) => j.key === key); if (!job) return { error: 'That job has gone.' };
  if (job.kind === 'cargo' && capacity(S, sh) - holdCount(sh) < job.n) return { error: `The hold needs room for ${job.n} crates.` };
  if (job.kind === 'passenger' && sh.jobs.some((j) => j.kind === 'passenger')) return { error: 'One passenger a ship.' };
  if (job.kind === 'convoy' && (marks(S, sh).guard < 6 || !sh.ups.includes('wireless'))) return { error: 'A convoy needs a guard of 6 and the wireless.' };
  S.taken[key] = S.turn; sh.jobs.push({ ...job, ship: sh.id });
  return { ok: true, job };
}
export function decline(S, i, key, why) { S.taken[key] = S.turn; if (why === 'forged') { xp(S, 15, 'a forgery refused'); S.stand.varn++; S.stand.ostery++; } }
/* Truthlight on a letter: a forgery glows. Costs lamp oil. */
export function truthlight(S, i, key) {
  if (!hasGift(S, 'truthlight')) return { error: 'Truthlight has not woken yet.' };
  if (!giftsAwake(S)) return { error: 'Shelly is resting — no gift works until next month.' };
  if (S.coin < 20) return { error: 'Lamp oil costs 20 coin.' };
  const job = board(S, i).find((j) => j.key === key); if (!job || job.kind !== 'letter') return { error: 'Only a letter can be read by the light.' };
  S.coin -= 20; S.lit = S.lit || {}; S.lit[key] = true;
  return { ok: true, forged: !!job.forged };
}
function deliver(S, sh) {
  const i = sh.at;
  for (const j of sh.jobs.filter((x) => x.to === i)) {
    S.coin += j.coin; S.done++; S.ports[j.from].st++; S.goodwill += 1;
    if (j.forged) { xp(S, 0); S.stand.varn -= 2; S.stand.ostery -= 2; news(S, { k: 'forged', job: j }); say(S, `The letter to ${PORTS[i].n} was a forgery — Master Murrow’s work. Both crowns are angry.`); }
    else xp(S, j.xp, `a job done in ${PORTS[i].n}`);
    if (j.kind === 'peace' && S.war) { S.war.until = S.turn; S.warEnded = S.turn; S.stand.varn += 2; S.stand.ostery += 2; news(S, { k: 'peace' }); say(S, 'The letter between the fleets is read. The war at the Gate ends.'); }
    if (j.kind === 'convoy' && !j.lost && rankAt(S, 'captain')) S.exp.convoy++;
    news(S, { k: 'job', job: j });
  }
  sh.jobs = sh.jobs.filter((x) => x.to !== i);
  if (S.done >= 10) earn(S, 'charter');
  checkExpeditions(S);
}

/* ------------------------------------------------------------------ the shipyard */
export const isYard = (i) => YARDS.includes(i);
export function canBuyShip(S, i, cls) {
  const c = CLASSES.find((x) => x.id === cls); if (!c) return 'No such ship.';
  if (!isYard(i)) return 'Only a shipyard sells ships.';
  if (!S.ports[i].lit) return 'The yard is dark.';
  if (c.era > S.era) return `Not built until ${ERAS[c.era].name}.`;
  if (S.ships.length >= 10) return 'Ten ships is the whole fleet.';
  if (S.ships.length >= 1 && !rankAt(S, 'master')) return 'A shipyard sells a second ship only to a Master.';
  if (S.coin < c.price) return `${c.price} coin needed.`;
  return null;
}
export function buyShip(S, i, cls) { const no = canBuyShip(S, i, cls); if (no) return { error: no }; const c = CLASSES.find((x) => x.id === cls); S.coin -= c.price; const sh = addShip(S, cls, i); news(S, { k: 'ship', id: sh.id }); say(S, `The ${sh.name}, a ${c.name.toLowerCase()}, is launched in ${PORTS[i].n}.`); return { ok: true, ship: sh }; }
export function canUpgrade(S, sh, id) {
  const u = INVENTIONS.find((x) => x.id === id); if (!u) return 'No such invention.';
  if (sh.voyage || !isYard(sh.at)) return 'Only in a shipyard.';
  if (u.era > S.era) return `Not invented until ${ERAS[u.era].name}.`;
  if (u.needs && S.crew[u.needs] !== 'aboard') return `${CREW[u.needs].name} must be aboard to fit it.`;
  if (sh.ups.includes(id)) return 'Fitted already.';
  if (S.coin < u.price) return `${u.price} coin needed.`;
  return null;
}
export function upgrade(S, shipId, id) { const sh = S.ships.find((x) => x.id === shipId), no = sh ? canUpgrade(S, sh, id) : 'No ship.'; if (no) return { error: no }; const u = INVENTIONS.find((x) => x.id === id); S.coin -= u.price; sh.ups.push(id); if (!S.inv[id]) { S.inv[id] = S.turn; news(S, { k: 'invention', id }); } checkExpeditions(S); return { ok: true }; }
export const repairCost = (sh) => (10 - sh.hull) * 12 + (sh.mast ? 60 : 0);
export function repair(S, shipId) { const sh = S.ships.find((x) => x.id === shipId); if (!sh || sh.voyage || !isYard(sh.at)) return { error: 'Only in a shipyard.' }; const c = repairCost(sh); if (!c) return { error: 'Nothing to mend.' }; if (S.coin < c) return { error: `${c} coin needed.` }; S.coin -= c; sh.hull = 10; sh.mast = false; return { ok: true, cost: c }; }
/* Saltreach: once a Master has lit Aden, the old rock's lamp can be relit — Truthlight */
export function canRelight(S) { return !S.gifts.truthlight && S.beats.master != null && S.ports[P('Aden')].lit; }
export function relight(S) { if (!canRelight(S)) return { error: 'Not yet.' }; if (S.coin < 150) return { error: 'Lamp, glass and oil: 150 coin.' }; S.coin -= 150; xp(S, 80, 'Saltreach relit'); beat(S, 'saltreach'); gift(S, 'truthlight'); return { ok: true }; }

/* ------------------------------------------------------------------ setting sail, and the dangers */
export function sail(S, shipId, b) {
  const sh = S.ships.find((x) => x.id === shipId); if (!sh || sh.voyage || sh.at == null) return { error: 'That ship is not in port.' };
  if (S.pending.length) return { error: 'Deal with the danger first.' };
  const pl = planFor(S, shipId, sh.at, b); if (!pl) return { error: S.war && S.war.until > S.turn ? 'The war has closed the strait — there is no way round this month.' : 'The sea will not allow that voyage this month.' };
  const r = seeded(`${S.seed}:v${S.turn}:${sh.id}:${b}`), ev = [], M = pl.months, rk = pl.risk;
  const mid = () => Math.max(1, Math.min(M, 1 + int(0, Math.max(0, M - 1), r)));
  const convoy = sh.jobs.some((j) => j.kind === 'convoy');
  if (convoy || r() < rk.pirates) ev.push({ k: 'pirates', at: mid() });
  if (pl.cyclone) ev.push({ k: 'cyclone', at: 0 });
  for (const m of rk.mega) if (r() < 0.5 || (S.era >= 1 && !S.beats.whitewall && m === 'agulhas')) { ev.push({ k: 'mega', at: mid(), where: m }); break; }
  if (rk.bergs) ev.push({ k: 'bergs', at: 0 });
  if (rk.fog.length && r() < 0.6) ev.push({ k: 'fog', at: mid(), where: rk.fog[0] });
  sh.voyage = { from: sh.at, to: b, path: pl.path, months: M, left: M, elapsed: 0, km: pl.km, pass: pl.pass, ev, met: [], gun: false, sail: !sh.ups.includes('engine') && classOf(sh).era === 0 };
  sh.at = null; S.stats.voyages++; S.stats.km += pl.km;
  if (!S.logs.knots) addLog(S, 'knots');
  if (!S.logs.monsoon && Object.keys(pl.help).includes('monsoon')) addLog(S, 'monsoon');
  say(S, `The ${sh.name} sails from ${PORTS[sh.voyage.from].n} for ${PORTS[b].n} — ${M} ${M === 1 ? 'month' : 'months'}.`);
  dueEvents(S, sh);
  return { ok: true, plan: pl };
}
function dueEvents(S, sh) {
  const v = sh.voyage; if (!v) return false;
  const due = v.ev.filter((e) => !e.done && e.at <= v.elapsed);
  for (const e of due) { e.done = true; S.pending.push({ ...e, ship: sh.id }); }
  return due.length > 0;
}
/* the card for the danger at the head of the queue: what happened, and what each choice costs */
export function dangerCard(S) {
  const d = S.pending[0]; if (!d) return null;
  const sh = S.ships.find((x) => x.id === d.ship), m = marks(S, sh), g = giftsAwake(S), still = hasGift(S, 'stillwater') && g && S.turn - S.still >= 3;
  const ps = PIRATE_SPEED[S.era], first = !S.beats.whitewall && S.era >= 1 && d.k === 'mega';
  const C = (id, label, cost, extra = {}) => ({ id, label, cost, ...extra });
  if (d.k === 'pirates') return { k: d.k, title: 'Grey sails astern', text: `Four low grey boats with no flag: the Grey Gulls. They hunt the dark water between lit ports. They take cargo, not lives — and they are never sunk.`, choices: [
    C('run', 'Run for it', m.speed >= ps ? `Your speed ${m.speed} beats theirs (${ps}): you get away.` : `Your speed ${m.speed} is less than theirs (${ps}): you lose a quarter of the cargo and a month.`),
    C('parley', 'Parley — pay the toll', 'One crate in twenty, the way old Bahar does. Nobody is hurt.'),
    C('stand', 'Stand and ring the bell', m.guard >= 5 ? `Your guard ${m.guard} is enough: they turn away.` : `Your guard ${m.guard} is not enough (5): they take a quarter of the cargo.`),
    ...(S.earned.signalgun && !sh.voyage.gun ? [C('gun', 'Fire Bahar’s signal gun', 'Friendly ships come. Once a voyage.')] : []),
  ] };
  if (d.k === 'cyclone') return { k: d.k, title: 'The barometer is falling', text: `It is cyclone season on this route. ${S.crew.farida === 'aboard' ? 'Farida says what the captain does not want to hear: wait.' : ''}`, log: 'cyclone', choices: [
    C('wait', 'Wait in port a month', 'The voyage starts a month later. Nothing lost.'),
    C('sail', 'Sail with the warning', m.strength >= 6 ? `Strength ${m.strength}: the hull rides it out.` : `Strength ${m.strength} is under 6: the hull takes damage${noWash(S, sh) ? '' : ' and a fifth of the cargo is washed out'}.`),
    ...(hasGift(S, 'stormsight') && g ? [C('stormsight', 'Stormsight: steer round its path', 'No time lost. Shelly rests the rest of the month.')] : []),
    ...(still ? [C('stillwater', 'Stillwater', 'No damage. Once a season; Shelly sleeps until next month.')] : []),
  ] };
  if (d.k === 'mega') return { k: d.k, title: first ? 'The White Wall' : 'A great wave', text: `In ${MEGA.find((x) => x.id === d.where).name} a wave far taller than the others stands up out of the sea.`, log: 'roguewave', choices: [
    C('bow', 'Meet it bow-first', m.strength >= 5 ? `Strength ${m.strength}: you climb it. A few days lost, no more.` : `Strength ${m.strength} is under 5: a month lost and hull damage.`),
    C('side', 'Take it on the side', m.strength >= 7 ? `Strength ${m.strength}: she rolls and rights herself.` : `Strength ${m.strength} is under 7: a mast goes (speed −1 until a yard mends it)${noWash(S, sh) ? '' : ', and deck cargo is lost'}.`),
    ...(first ? [C('stillwater', 'Shelly stirs…', 'Something she has never done. The water goes still. Then she sleeps.')] : still ? [C('stillwater', 'Stillwater', 'No damage. Once a season; Shelly sleeps until next month.')] : []),
  ] };
  if (d.k === 'bergs') return { k: d.k, title: 'Ice in the spring', text: 'Icebergs drift south over the Grand Banks in spring. Most of an iceberg is under the water.', log: 'iceberg', choices: [
    C('round', 'Route round the ice', 'A month longer.'), C('wait', 'Wait in port', 'The voyage starts next month.'),
  ] };
  if (d.k === 'fog') return { k: d.k, title: 'Fog', text: `Thick fog in ${FOG.find((x) => x.id === d.where).name}, where warm air meets cold water.`, log: 'fog', choices: [
    C('slow', 'Slow down and ring the bell', sh.ups.includes('bell') ? 'The lookout bell: no time lost.' : 'A month lost.'),
    C('hold', 'Hold your speed', m.strength >= 5 ? `Strength ${m.strength}: you scrape a sandbar and carry on.` : `Strength ${m.strength} is under 5: you hit something in the fog — hull damage.`),
  ] };
  return null;
}
const noWash = (S, sh) => !!S.earned.bowline || (sh.id === 1 && S.crew.pereira === 'aboard');
function loseCargo(S, sh, frac) {
  if (noWash(S, sh) && frac < 1) return 0;
  let lost = 0; for (const l of sh.hold) { const k = Math.ceil(l.n * frac); l.n -= k; lost += k; l.clean = false; } sh.hold = sh.hold.filter((l) => l.n > 0);
  for (const j of sh.jobs) if (j.kind === 'convoy') j.lost = true;
  return lost;
}
function hurt(S, sh, n) { sh.hull -= n; if (sh.hull > 0) return; /* the crew always comes home: towed to the nearest yard */
  const at = sh.voyage ? sh.voyage.path[Math.min(sh.voyage.path.length - 1, Math.floor(sh.voyage.path.length * sh.voyage.elapsed / Math.max(1, sh.voyage.months)))] : PORTS[sh.at].at;
  const y = YARDS.slice().sort((a, b) => haversine(PORTS[a].at, at) - haversine(PORTS[b].at, at))[0];
  for (const j of sh.jobs) S.taken[j.key] = S.turn; sh.jobs = []; sh.hold = []; sh.voyage = null; sh.at = y; sh.hull = 3; S.coin = Math.max(0, S.coin - 80);
  news(S, { k: 'towed', ship: sh.id, port: y }); say(S, `The ${sh.name} is towed into ${PORTS[y].n}. Every sailor is safe; the cargo is gone.`); }
export function resolve(S, choice) {
  const d = S.pending[0]; if (!d) return { error: 'Nothing to decide.' };
  const card = dangerCard(S); if (!card.choices.some((c) => c.id === choice)) return { error: 'Not a choice here.' };
  const sh = S.ships.find((x) => x.id === d.ship), v = sh.voyage, m = marks(S, sh); let averted = false, out = '';
  if (card.log) addLog(S, card.log);
  if (d.k === 'pirates') {
    if (choice === 'run') { if (m.speed >= PIRATE_SPEED[S.era]) averted = true; else { loseCargo(S, sh, 0.25); v.left++; out = 'They caught you.'; } }
    else if (choice === 'parley') { for (const l of sh.hold) l.n -= Math.ceil(l.n / 20); sh.hold = sh.hold.filter((l) => l.n > 0); out = 'The toll is paid.'; }
    else if (choice === 'stand') { if (m.guard >= 5) averted = true; else { loseCargo(S, sh, 0.25); out = 'They took a quarter.'; } }
    else if (choice === 'gun') { v.gun = true; averted = true; }
    if (averted && S.era >= 3 && S.beats.panama) out = 'Corvax’s old crews are pilots now — but not all of the Gulls.';
  } else if (d.k === 'cyclone') {
    if (choice === 'wait') { v.left++; averted = true; if (!S.crew.farida) { S.crew.farida = 'aboard'; news(S, { k: 'crew', id: 'farida' }); } }
    else if (choice === 'sail') { if (m.strength >= 6) averted = true; else { hurt(S, sh, 3); if (sh.voyage) loseCargo(S, sh, 0.2); } }
    else if (choice === 'stormsight') { S.rest = S.turn + 1; averted = true; }
    else if (choice === 'stillwater') { S.still = S.turn; S.rest = S.turn + 1; averted = true; }
  } else if (d.k === 'mega') {
    if (choice === 'bow') { if (m.strength >= 5) averted = true; else { v.left++; hurt(S, sh, 2); } }
    else if (choice === 'side') { if (m.strength >= 7) averted = true; else { sh.mast = true; loseCargo(S, sh, 0.15); } }
    else if (choice === 'stillwater') { S.still = S.turn; S.rest = S.turn + 1; averted = true; if (!S.gifts.stillwater) gift(S, 'stillwater'); }
    if (S.era >= 1) beat(S, 'whitewall');
  } else if (d.k === 'bergs') { v.left++; averted = true; v.met.push('ice'); }
  if ((d.k === 'fog' || d.k === 'bergs') && sh.id === 1 && S.crew.ama === 'away' && S.era >= 2) amaReturns(S);
  if (d.k === 'fog') { v.met.push('fog'); if (choice === 'slow') { if (!sh.ups.includes('bell')) v.left++; averted = true; } else if (m.strength >= 5) averted = true; else hurt(S, sh, 2); }
  if (averted) { S.stats.dangers++; xp(S, 20, 'a danger met well'); }
  S.pending.shift();
  return { ok: true, averted, out };
}

/* ------------------------------------------------------------------ standing routes (a Commodore's) */
export function setRoute(S, shipId, b) {
  const sh = S.ships.find((x) => x.id === shipId); if (!sh || sh.voyage) return { error: 'Only a ship in port.' };
  if (!rankAt(S, 'commodore')) return { error: 'Standing routes open for a Commodore.' };
  if (shipId === 1) return { error: 'Shelly’s own ship sails where you send her.' };
  if (b == null) { sh.route = null; return { ok: true }; }
  if (!planFor(S, shipId, sh.at, b)) return { error: 'No way there this month.' };
  sh.route = [sh.at, b]; return { ok: true };
}
function runRoute(S, sh) {
  const i = sh.at, other = sh.route[0] === i ? sh.route[1] : sh.route[0];
  for (const g of Object.keys(GOODS)) if (g !== PORTS[i].good && holdOf(sh, g)) sell(S, sh.id, g);
  if (S.ports[i].lit && S.coin > 200) buy(S, sh.id, Math.min(capacity(S, sh) - holdCount(sh), Math.floor((S.coin - 200) / buyPrice(S, i))));
  const r = sail(S, sh.id, other);
  /* a standing route meets danger the safe way, and says so */
  if (r.ok) while (S.pending.length && S.pending[S.pending.length - 1].ship === sh.id) { const d = S.pending[S.pending.length - 1]; S.pending.splice(S.pending.length - 1, 1); S.pending.unshift(d); resolve(S, { pirates: 'parley', cyclone: 'wait', mega: 'bow', bergs: 'round', fog: 'slow' }[d.k]); }
}

/* ------------------------------------------------------------------ the month turns */
export function nextMonth(S) {
  if (S.pending.length) return { error: 'Deal with the danger first.' };
  S.news = [];
  S.turn++; S.month = (S.month + 1) % 12; if (S.month === 0) S.year++;
  S.ports.forEach((p, i) => { if (p.lit) p.stock = Math.min(150, p.stock + 30); for (const g of Object.keys(p.glut)) p.glut[g] = Math.floor(p.glut[g] * 0.6); /* a market recovers: most of a glut is eaten in a month */ });
  for (const sh of S.ships) {
    const v = sh.voyage; if (!v) continue;
    v.elapsed++;
    if (dueEvents(S, sh)) continue;                      // the clock stops for a danger: it is met before the ship moves on
    v.left--; if (S.crew.vasant === 'aboard' && sh.hull < 10 && sh.id === 1) sh.hull++;
    if (v.left > 0) continue;
    arrive(S, sh);
  }
  for (const sh of S.ships) if (!sh.voyage && sh.route && !S.pending.length) runRoute(S, sh);
  /* jobs out of time */
  for (const sh of S.ships) for (const j of sh.jobs.filter((x) => x.due < S.turn)) { S.ports[j.from].st--; news(S, { k: 'jobfail', job: j }); say(S, `A job for ${PORTS[j.to].n} ran out of time.`); }
  for (const sh of S.ships) sh.jobs = sh.jobs.filter((x) => x.due >= S.turn);
  /* asks in a lean season, every fourth month */
  S.asks = S.asks.filter((x) => !x.done && x.until >= S.turn);
  if (S.turn % 4 === 0) {
    const r = seeded(S.seed + ':a' + S.turn), lit = S.ports.map((p, i) => i).filter((i) => S.ports[i].lit && i !== S.home);
    if (lit.length) { const i = lit[int(0, lit.length - 1, r)], goods = Object.keys(GOODS).filter((g) => g !== PORTS[i].good), ask = { port: i, good: goods[int(0, goods.length - 1, r)], until: S.turn + 6, done: false, year: S.year };
      S.asks.push(ask); S.exp.lean[S.year] = S.exp.lean[S.year] || { asked: 0, answered: 0 }; S.exp.lean[S.year].asked++; news(S, { k: 'ask', ...ask }); }
  }
  /* the war at the Gate: Book Two, once Shelby is a Master and Aden is lit */
  if (rankAt(S, 'master') && !S.beats.master) beat(S, 'master');
  if (S.beats.master != null && !S.war && S.ports[P('Aden')].lit) { S.war = { n: 1, strait: 'babelmandeb', at: [12.6, 43.3], until: S.turn + 18 }; news(S, { k: 'war' }); say(S, 'War between Varn and Ostery: the Gate of Grief is closed.'); }
  if (S.war && S.war.until === S.turn && !S.warEnded) { S.warEnded = S.turn; news(S, { k: 'peace' }); }
  /* Deepspeech: each season the whales report — and ask a favour */
  if (hasGift(S, 'deepspeech') && S.turn % 3 === 0) { const r = seeded(S.seed + ':w' + S.turn), lit = S.ports.map((p, i) => i).filter((i) => S.ports[i].lit); if (lit.length >= 2) S.whales = { season: season(S), port: lit[int(0, lit.length - 1, r)], to: lit[int(0, lit.length - 1, r)] }; if (S.whales && S.whales.port === S.whales.to) S.whales.to = lit.find((x) => x !== S.whales.port); }
  /* the crew through the ages */
  if (S.era >= 1 && !S.crew.vasant) { S.crew.vasant = 'aboard'; news(S, { k: 'crew', id: 'vasant' }); beat(S, 'steam'); }
  if (S.era >= 2) beat(S, 'suez');
  /* Ama, gone home from Cape Town, comes back in the northern fog (or after two years at sea without her) — and stays */
  if (S.crew.ama === 'away' && S.era >= 2 && S.amaGone != null && S.turn - S.amaGone >= 24) amaReturns(S);
  if (S.era >= 3) beat(S, 'panama');
  /* a new age, when the goodwill is there */
  const nx = ERAS[S.era + 1];
  /* the calendar jumps to the year the age really began (steam 1840, Suez 1869, Panama 1914): years pass at sea */
  if (nx && S.goodwill >= nx.need) { S.era++; if (S.year < nx.year) { news(S, { k: 'years', from: S.year, to: nx.year }); S.year = nx.year; } news(S, { k: 'era', era: S.era }); say(S, `${nx.name}!`); }
  /* a quick question from the Ship's Log, in a port with a ship */
  if (!S.quiz && S.turn % 2 === 0) S.quiz = quizFor(S);
  checkExpeditions(S);
  return { ok: true, news: S.news };
}
function arrive(S, sh) {
  const v = sh.voyage; sh.voyage = null; sh.at = v.to;
  news(S, { k: 'arrive', ship: sh.id, port: v.to }); say(S, `The ${sh.name} reaches ${PORTS[v.to].n}.`);
  for (const l of sh.hold) if (l.clean === undefined) l.clean = true;
  deliver(S, sh);
  /* expeditions that are voyages */
  if (rankAt(S, 'captain')) {
    const A = PORTS[v.from].n, B = PORTS[v.to].n;
    if (B === 'Halifax' && (v.met.includes('fog') || v.met.includes('ice'))) seal(S, 'banks');
    if (A === 'Lisbon' && B === 'Mumbai' && v.sail && pathIn(v.path, CAPE.box)) seal(S, 'longway');
    if (A === 'Buenos Aires' && B === 'Valparaíso' && S.era < 3 && pathIn(v.path, HORN.box)) seal(S, 'horn');
  }
  if (PORTS[v.to].n === 'Halifax' && S.ports[v.to].lit && S.era >= 2 && S.crew.pereira === 'aboard') { S.crew.pereira = 'ashore'; earn(S, 'bowline'); beat(S, 'Halifax'); }
}

/* ------------------------------------------------------------------ expeditions and the end */
function seal(S, id) { if (S.ex[id] || !rankAt(S, 'captain')) return; S.ex[id] = S.turn; xp(S, 400, EXPEDITIONS.find((e) => e.id === id).name); news(S, { k: 'sealed', id }); say(S, `Expedition sealed: ${EXPEDITIONS.find((e) => e.id === id).name}.`);
  if (id === 'gate') earn(S, 'pennant'); if (id === 'convoy') earn(S, 'convoyflag'); }
export function expProgress(S, id) {
  switch (id) {
    case 'cinnamon': return [Math.min(120, S.exp.cinnamon), 120];
    case 'gate': return S.warEnded != null ? [Math.min(12, S.turn - S.warEnded), 12] : [0, 12];
    case 'northice': return [Math.min(40, Math.max(0, ...Object.values(S.exp.northice))), 40];
    case 'lean': { const y = Object.values(S.exp.lean).map((x) => (x.asked >= 3 && x.answered >= x.asked ? 1 : 0)); return [Math.max(0, ...y), 1]; }
    case 'lanterns': return [PACIFIC_ISLANDS.filter((i) => S.ports[i].lit).length, PACIFIC_ISLANDS.length];
    case 'coldcoasts': return [Math.min(100, S.exp.cold), 100];
    case 'convoy': return [Math.min(4, S.exp.convoy), 4];
    default: return [S.ex[id] ? 1 : 0, 1];
  }
}
export function checkExpeditions(S) {
  if (rankAt(S, 'captain')) {
    for (const id of ['cinnamon', 'northice', 'lanterns', 'coldcoasts', 'convoy']) { const [a, b] = expProgress(S, id); if (a >= b) seal(S, id); }
    if (S.warEnded != null && S.turn - S.warEnded >= 12 && !(S.war && S.war.until > S.turn)) seal(S, 'gate');
    const lastYear = S.exp.lean[S.year - 1]; if (lastYear && lastYear.asked >= 3 && lastYear.answered >= lastYear.asked) seal(S, 'lean');
  }
  const prev = S.rank; S.rank = rankOf(S).id; if (prev && prev !== S.rank) news(S, { k: 'rank', id: S.rank });
  if (!S.won && litCount(S) === PORTS.length && EXPEDITIONS.every((e) => S.ex[e.id]) && INVENTIONS.every((u) => S.inv[u.id]) && S.ships.length >= 10) { S.won = true; news(S, { k: 'won' }); }
}
export const progress = (S) => ({ lit: litCount(S), ports: PORTS.length, sealed: EXPEDITIONS.filter((e) => S.ex[e.id]).length, inv: INVENTIONS.filter((u) => S.inv[u.id]).length, invAll: INVENTIONS.length, ships: S.ships.length });

/* ------------------------------------------------------------------ a test captain
   Plays the whole career with plain rules: sell what a port lacks, buy what it grows, light the
   nearest dark port that wants the cargo, meet danger the safe way, buy ships and inventions when
   the coin allows. It proves the world can be lit and the fleet can be built in every age. */
export function autoplay(S, maxTurns = 900) {
  const safe = { pirates: 'parley', cyclone: 'wait', mega: 'bow', bergs: 'round', fog: 'slow' };
  while (S.turn < maxTurns && !(litCount(S) === PORTS.length && S.ships.length >= 10 && INVENTIONS.every((u) => S.inv[u.id]))) {
    while (S.pending.length) { const d = S.pending[0], c = dangerCard(S); resolve(S, c.choices.some((x) => x.id === 'gun') ? 'gun' : c.choices.some((x) => x.id === 'stormsight') ? 'stormsight' : safe[d.k]); }
    for (const sh of S.ships) {
      if (sh.voyage || sh.route) continue;
      const i = sh.at;
      for (const g of Object.keys(GOODS)) if (g !== PORTS[i].good && holdOf(sh, g)) sell(S, sh.id, g);
      if (isYard(i)) {
        if (sh.hull < 10 || sh.mast) repair(S, sh.id);
        for (const u of INVENTIONS) if ((!S.inv[u.id] || sh.id === 1) && !canUpgrade(S, sh, u.id) && S.coin > u.price + 150) upgrade(S, sh.id, u.id);
        const best = CLASSES.filter((c) => c.era <= S.era).sort((a, b) => b.era - a.era)[0];
        if (S.ships.length < 10 && !canBuyShip(S, i, best.id) && S.coin > best.price + 250) buyShip(S, i, best.id);
      }
      if (S.ports[i].lit) buy(S, sh.id, capacity(S, sh) - holdCount(sh));
      const cargo = Object.keys(GOODS).find((g) => holdOf(sh, g));
      const dark = PORTS.map((p) => p.i).filter((j) => j !== i && !S.ports[j].lit && cargo && PORTS[j].good !== cargo && !S.ships.some((o) => o.voyage && o.voyage.to === j));
      const sale = PORTS.map((p) => p.i).filter((j) => j !== i && S.ports[j].lit && cargo && PORTS[j].good !== cargo);
      const near = (ts) => ts.map((t) => ({ t, k: haversine(PORTS[i].at, PORTS[t].at) })).sort((a, b) => a.k - b.k).slice(0, 6).map((x) => ({ t: x.t, p: planFor(S, sh.id, i, x.t) })).filter((x) => x.p).sort((a, b) => a.p.months - b.p.months)[0];
      const yard = !isYard(i) && S.coin > 1500 ? near(YARDS.filter((y) => S.ports[y].lit && y !== i)) : null;
      const best = (ts) => ts.map((t) => ({ t, k: haversine(PORTS[i].at, PORTS[t].at) })).sort((a, b) => a.k - b.k).slice(0, 10).map((x) => ({ t: x.t, p: planFor(S, sh.id, i, x.t) })).filter((x) => x.p).sort((a, b) => sellPrice(S, b.t, cargo) / b.p.months - sellPrice(S, a.t, cargo) / a.p.months)[0];
      const go = near(dark) || yard || (cargo && best(sale)) || near(YARDS.filter((y) => y !== i && S.ports[y].lit));
      if (go) sail(S, sh.id, go.t);
      while (S.pending.length) { const d = S.pending[0]; resolve(S, safe[d.k]); }
    }
    nextMonth(S);
  }
  return S;
}
