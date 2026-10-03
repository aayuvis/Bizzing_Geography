/* feed.mjs — My Feed (FAMILY-STANDARD §6a): the cards are the corpus's own, and the ranking is the
   family engine's, given this child's level and what they did.

   CONTENT  every card's `src` resolves and its words are found there; every route opens a real
            screen; no two cards share src + kind + text; nothing under review, nothing above its
            band; ≥ 100 cards on each of the ten roads and ≥ 300 with no level; every question has
            one right answer that is not in its text.
   RANKING  a younger band never sees an older band's card; a child on level n sees nothing above
            n + 1; moving up changes the "now" cards; what the child did moves its cards up and
            says why; a slipped question comes back first; a session is at most twenty.
   Each was watched failing once (see the commit). */
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readdirSync } from 'node:fs';
import { INDEX } from '../src/data/feed/index.js';
import { STOPS, WORLDS, byId, drill } from '../src/stops.js';
import { LEVELS } from '../src/levels.js';
import { seeded } from '../src/rand.js';
import { byCc, capOf } from '../src/geo.js';
import { nbrs, givesAway } from '../src/chapters/capitals.js';
import { TWO_CONTINENTS } from '../src/chapters/kit.js';
import { listOptions } from '../src/listmode.js';
import { WORDS } from '../src/library/dictionary.js';
import { POSTCARDS } from '../src/data/postcards.js';
import { EXPEDITIONS } from '../src/data/expeditions.js';
import { SHELF } from '../src/library/index.js';
import { LANDMARK_NEEDS_REVIEW } from '../src/data/landmarks.js';
import { ERAS_NEED_REVIEW } from '../src/data/eras.js';
import { HISTORY_NEEDS_REVIEW } from '../src/data/history.js';
import { newHousehold, newKid } from '../src/model.js';
import { feedFor, order, LIMIT } from '../src/bizzing-feed.js';
import { feedOpts, feedSession } from '../src/feed.js';
import { plain, QSEED, QN, bandOfLevel, leaks, words, jaccard, NEAR, nearDups, groupOf, metaOf } from '../../tools/build-feed.mjs';
import { RANKS } from '../src/model.js';
import { OCEANS } from '../src/geo.js';
import { regionsOf, COUNTRY as REGION_COUNTRIES } from '../src/library/states.js';
import { ISLANDS } from '../src/chapters/landwater.js';
import { daysOf } from '../src/data/expeditions.js';

/* the cards: the index the engine ranks, and the words in their road's group */
const GDIR = new URL('../src/data/feed/', import.meta.url).pathname, BODY = {};
for (const f of readdirSync(GDIR).filter((f) => /^g-.*\.js$/.test(f))) Object.assign(BODY, (await import(GDIR + f)).CARDS);
const FEED = INDEX.map((x) => BODY[x.id]);
let fails = 0; const bad = []; const ok = (c, m) => { if (!c) { fails++; if (bad.length < 25) bad.push(m); } };
const BANDS = ['6-7', '8-10', '11-14'], rank = (b) => BANDS.indexOf(b);
const PUB = new URL('../public/', import.meta.url).pathname;
const low = (s) => String(s).toLowerCase();

/* ------------------------------------------------------------ content */
const byLevel = {}; let agnostic = 0;
const keys = new Set();
ok(FEED.every(Boolean) && Object.keys(BODY).length === INDEX.length, 'every card in the index has its words in a group, and no group holds a stray');
INDEX.forEach((x, i) => { const c = FEED[i]; ok(c && x.g === groupOf(c) && JSON.stringify({ ...metaOf(c), g: x.g }) === JSON.stringify(x), `${x.id}: the index says what the card says, and its group is its road`); });
const gens = {};
for (const c of FEED) {
  const where = `${c.id} (${c.src})`;
  ok(c.id && c.kind && c.src && c.title && c.route && c.cta && Array.isArray(c.bands) && c.bands.length && Array.isArray(c.topics), `${where}: every field`);
  if (c.level == null) agnostic++; else { byLevel[c.level] = (byLevel[c.level] || 0) + 1; ok(c.level >= 1 && c.level <= 10 && Number.isInteger(c.level), `${where}: a level on the ten roads`); }
  if (c.level != null) ok(c.bands.every((b) => rank(b) >= rank(bandOfLevel(c.level))), `${where}: no band younger than its road`);
  const k = c.src + '|' + c.kind + '|' + c.title + '|' + (c.body || '') + '|' + (c.play ? c.play.q + '|' + c.play.opts.join('|') : '');
  ok(!keys.has(k), `${where}: a duplicate`); keys.add(k);
  if (c.art) ok(!/^https?:|^\/\//.test(c.art) && existsSync(PUB + c.art), `${where}: its picture is the app's own (${c.art})`);
  ok(!/^(landmark|era|history|streetview|place):/.test(c.src), `${where}: nothing held for review, no Street View place`);
  if (c.play) {
    const o = c.play.opts;
    ok(o.length >= 2 && new Set(o).size === o.length && o.every((x) => String(x).trim()), `${where}: distinct options`);
    ok(!leaks(c.play.q, o[0], o) && !leaks(c.title, o[0], o), `${where}: the answer is not in the words`);
  }
  /* the route opens a real screen */
  const r = /^#\/([a-z]+)(?:\/(.+))?$/.exec(c.route) || [];
  const arg = r[2] ? decodeURIComponent(r[2]) : null;
  /* a deep link (#/lib/<tool>/<item>, #/expd/<id>/<day>) must name a real item of that tool */
  const [a0, item] = arg ? [arg.split('/')[0], arg.split('/').slice(1).join('/') || null] : [null, null];
  const ITEM = { explorer: (x) => byCc[x], capitals: (x) => byCc[x] && byCc[x].quiz, flags: (x) => byCc[x] && byCc[x].quiz, states: (x) => REGION_COUNTRIES.some((C) => regionsOf(C.c).some((g) => g.id === x)) };
  ok({ stop: () => byId[arg], world: () => WORLDS.some((w) => w.id === arg), lib: () => SHELF.some((t) => t.id === a0) && (!item || (ITEM[a0] && ITEM[a0](item))),
    expd: () => { const e = EXPEDITIONS.find((x) => x.id === a0); return e && (!item || daysOf(e).some((d) => d.key === item)); },
    word: () => WORDS.some((w) => w[0] === arg), me: () => !arg, place: () => POSTCARDS.some((p) => p.id === arg) }[r[1]]?.(), `${where}: route ${c.route} opens a real screen`);
  /* the owner: a card about ONE thing opens THAT thing, never the generic tool or collection */
  const one = { country: `#/lib/explorer/${c.src.split(':')[1]}`, neighbours: `#/lib/explorer/${c.src.split(':')[1]}`, capital: `#/lib/capitals/${c.src.split(':')[1]}`, flag: `#/lib/flags/${c.src.split(':')[1]}`,
    state: `#/lib/states/${c.src.split(':')[2]}`, expday: `#/expd/${c.src.split(':')[1]}/${c.src.split(':')[2]}` }[c.src.split(':')[0]];
  if (one) ok(c.route === one, `${where}: opens its own item (${one}), not the shelf (${c.route})`);
  if (c.day && c.exp) ok(c.route === `#/expd/${c.exp}/${c.day}`, `${where}: an expedition day opens that day`);
  ok(c.badge && c.badge.label, `${where}: says what it is (a badge)`);
  /* the src resolves, and the card's words are found in it */
  const [kind, a, b, d] = c.src.split(':');
  const s = byId[a];
  switch (kind) {
    case 'world': { const w = WORLDS.find((x) => x.id === a); ok(w && c.body === plain(w.blurb), `${where}: world words`); break; }
    case 'stop': {
      const want = b === 'hook' ? s?.hook : b === 'why' ? s?.why : b === 'idea' ? (s?.idea || [])[+d] : null;
      ok(s && want && c.body === plain(want) && rank(c.bands[0]) >= rank(s.band), `${where}: the stop's own words, at its band`); break;
    }
    case 'quiz': {
      const L = LEVELS.find((x) => x.n === +d), lv = +b;
      ok(s && L && L.steps.some((st) => st.stop === a && st.lv === lv) && c.level === L.n, `${where}: a step on road ${d}`);
      const g = gens[c.src] || (gens[c.src] = drill(s, lv, QN, seeded(QSEED(+d, a, lv))));
      const hit = g.find((q) => c.kind === 'map' ? q.kind === 'map' && q.text === c.mapText && (() => { const lo = listOptions(q); return lo.names[lo.right] === c.play.opts[0]; })()
        : q.text === c.play.q && q.ans === c.play.opts[0] && q.opts.length === c.play.opts.length && c.play.opts.every((o) => q.opts.includes(o)));
      ok(hit, `${where}: the stop's generator asks exactly this`); break;
    }
    case 'country': { const x = byCc[a]; ok(x && x.quiz && c.body.includes(capOf(x)) && /landlocked/.test(c.body) === !!x.landlocked && (!x.area || c.body.includes(x.area.toLocaleString('en-US'))), `${where}: the country's own data`); break; }
    case 'capital': { const x = byCc[a]; ok(x && !givesAway(x) && c.play.opts[0] === capOf(x) && c.play.opts.slice(1).every((o) => !x.cap.includes(o)), `${where}: its capital, from the data`); break; }
    case 'flag': { const x = byCc[a]; ok(x && c.play.opts[0] === x.name && c.art === `flags/${a.toLowerCase()}.svg`, `${where}: its flag`); break; }
    case 'word': { const w = WORDS.find((x) => x[0] === a);
      ok(w && (b === 'example' ? low(c.body).includes(low(w[3])) && w[3] : b === 'quiz' ? c.play.opts[0] === w[0] && c.play.q.includes(w[1]) && c.play.opts.slice(1).every((o) => !low(w[1]).includes(low(o))) : low(c.body).includes(low(w[1])) && c.title === w[0]), `${where}: the Dictionary's words`); break; }
    case 'postcard': { const p = POSTCARDS.find((x) => x.id === a); ok(p && c.play.opts[0] === byCc[p.cc].name && p.clues.every((cl) => c.play.after.includes(cl)) && c.bands[0] === p.band && /painting, not a photo/.test(c.body), `${where}: the postcard, said to be a painting`); break; }
    case 'exp': {
      const e = EXPEDITIONS.find((x) => x.id === a), m = e && e.modules.find((x) => x.id === (b || '').split('.')[0]);
      const want = !b ? e?.blurb : b === 'final' ? e?.final.brief : d === 'project' ? m?.project.brief : b.includes('.') ? m?.days[+b.split('.')[1]]?.how : m?.objective;
      ok(e && want && low(c.body).includes(low(plain(want))) && c.level === Math.max(1, e.ages[0] - 5), `${where}: the expedition's own words`); break;
    }
    case 'neighbours': { const x = byCc[a]; ok(x && nbrs(x).length && nbrs(x).every((n) => c.body.includes(byCc[n].name)), `${where}: its neighbours, from the data`); break; }
    case 'continent': { const x = byCc[a]; ok(x && c.body === `${x.name} is in ${x.cont}.` && !TWO_CONTINENTS.has(a), `${where}: its continent, from the data`); break; }
    case 'island': ok(ISLANDS.includes(a) && c.body.startsWith(byCc[a].name), `${where}: an island country of the stop's list`); break;
    case 'expday': { const e = EXPEDITIONS.find((x) => x.id === a), d = e && daysOf(e).find((x) => x.key === b); ok(d && d.o && c.body.includes(plain(d.o)), `${where}: the day's own aim`); break; }
    case 'state': { const C = REGION_COUNTRIES.find((x) => x.c === a), r = C && regionsOf(a).find((x) => x.id === b);
      ok(r && (d === 'quiz' ? c.play.opts[0] === r.cap && !c.play.opts.slice(1).includes(r.cap) : c.body.includes(r.capFull) && c.body.includes(r.name)), `${where}: the state's capital, from the data`); break; }
    case 'rank': ok(RANKS[+a] && c.body === RANKS[+a].why, `${where}: the rank's checked fact`); break;
    case 'ocean': { const o = OCEANS.find((x) => x.id === a); ok(o && c.body === o.blurb, `${where}: the ocean's own words`); break; }
    default: ok(false, `${where}: an unknown source`);
  }
}
ok(LANDMARK_NEEDS_REVIEW && ERAS_NEED_REVIEW && HISTORY_NEEDS_REVIEW ? !FEED.some((c) => /^(landmark|era|history)/.test(c.src)) : true, 'nothing under review is cut');
for (const L of LEVELS) ok((byLevel[L.n] || 0) >= 100, `road ${L.n} has ${byLevel[L.n] || 0} cards (100 needed)`);
ok(agnostic >= 300, `${agnostic} level-agnostic cards (300 needed)`);
ok(FEED.length >= 1300, `${FEED.length} cards (100 a road and 300 more at least)`);
/* no near-duplicates: no two cards' words ≥ 80% the same — and the rule itself catches one */
{ const c = FEED.find((x) => x.kind === 'idea'); ok(nearDups([c, { ...c, id: 'copy', body: c.body + ' indeed' }]).dropped.length === 1, 'the near-duplicate rule catches a card said twice'); }
{ const W = FEED.map(words), dup = [];
  for (let i = 0; i < FEED.length; i++) for (let j = 0; j < i; j++) { const a = W[i], b = W[j]; if (Math.min(a.size, b.size) < NEAR * Math.max(a.size, b.size)) continue; if (jaccard(a, b) >= NEAR) dup.push(FEED[i].id + ' ≈ ' + FEED[j].id); }
  ok(!dup.length, `no near-duplicates (${dup.length}: ${dup.slice(0, 3).join(', ')})`); }
/* the built file is today's: rebuilding gives the same bytes */
const { build } = await import('../../tools/build-feed.mjs');
ok(JSON.stringify(build()) === JSON.stringify(FEED), 'data/feed/ is what tools/build-feed.mjs makes now — rerun it');

/* ------------------------------------------------------------ ranking */
const T = Date.UTC(2026, 9, 2, 12);
const child = (band, level) => { const h = newHousehold(), k = newKid('Asha', band, undefined); k.road.level = level; h.kids.push(k); h.active = k.id; return { h, k }; };
const byIdF = Object.fromEntries(FEED.map((c) => [c.id, c]));
for (const band of BANDS) {
  const { h, k } = child(band, { '6-7': 1, '8-10': 3, '11-14': 6 }[band]);
  const list = feedFor(feedOpts(h, k, FEED, T));
  ok(list.length > 0 && list.length <= LIMIT, `${band}: a session of at most ${LIMIT} (${list.length})`);
  ok(list.every((x) => byIdF[x.id].bands.includes(band)), `${band}: never a card above the band`);
}
for (let n = 1; n <= 10; n++) {
  const { h, k } = child('11-14', n); h.parent.tester = true;
  const list = feedFor(feedOpts(h, k, FEED, T));
  ok(list.every((x) => byIdF[x.id].level == null || byIdF[x.id].level <= n + 1), `level ${n}: nothing above level ${n + 1}`);
  const t = (k) => list.filter((x) => x.tier === k).length;
  ok(t('review') <= LIMIT / 4 && t('next') <= 2 && t('any') <= LIMIT / 4 && t('now') >= t('review') && t('now') >= t('any'), `level ${n}: the child's own level leads (now ${t('now')} · review ${t('review')} · next ${t('next')} · any ${t('any')})`);
}
{
  const a = child('8-10', 3), b = child('8-10', 4);
  const now = (c) => new Set(feedFor(feedOpts(c.h, c.k, FEED, T)).filter((x) => x.tier === 'now').map((x) => x.id));
  const A = now(a), B = now(b);
  ok(A.size && B.size && ![...A].some((id) => B.has(id)), 'moving up a level changes the "now" cards');
}
{
  const { h, k } = child('6-7', 1);
  k.stops['landforms'] = { stars: 2, best: 80, learned: true, runs: 1, lv: { 1: true }, at: T - 3600e3 };
  k.last = { k: 'stop', title: byId['landforms'].title, at: T - 3600e3 };
  const list = feedFor(feedOpts(h, k, FEED, T));
  ok(list.slice(0, 5).some((x) => byIdF[x.id].topics.includes('stop:landforms') && x.why.includes(byId['landforms'].title)), 'what the child just did moves its cards up, and says why');
}
{
  const { h, k } = child('6-7', 1);
  const q = drill(byId['water-bodies'], 1, 1, seeded('miss'))[0];
  k.miss = { [q.text + '|' + q.ans]: { q: { ...q }, at: T - 3 * 864e5, box: 0, from: byId['water-bodies'].title, n: 1 } };
  const list = feedFor(feedOpts(h, k, FEED, T));
  ok(/slipped/.test(list[0].why) && byIdF[list[0].id].topics.includes('stop:water-bodies'), `a slipped question comes back first, with its reason (${list[0].why})`);
}
{
  const { h, k } = child('8-10', 3);
  const s1 = feedSession(h, k, FEED, T), s2 = feedSession(h, k, FEED, T + 3600e3);
  ok(JSON.stringify(s1) === JSON.stringify(s2), 'the session is kept for the day');
  k.last = { k: 'stop', title: 'x', at: T + 7200e3 };
  const s3 = feedSession(h, k, FEED, T + 7200e3);
  ok(!s3.some((x) => s1.some((y) => y.id === x.id)), 'something new draws a new session — and what was seen today is not shown again');
}
/* the right option's slot is spread, not written first */
const slots = [0, 0, 0, 0];
for (const c of FEED) if (c.play && c.play.opts.length === 4) slots[order(c.id, 4).indexOf(0)]++;
const tot = slots.reduce((a, b) => a + b, 0);
ok(slots.every((n) => Math.abs(n - tot / 4) < 0.2 * tot / 4), `the right option's slot is even (${slots.join('/')})`);
/* the family's drop-ins, byte for byte */
const HIVE = '/home/user/Bizzing_Schedule/integration/';
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
if (existsSync(HIVE + 'bizzing-feed.js')) ok(sha(new URL('../src/bizzing-feed.js', import.meta.url).pathname) === sha(HIVE + 'bizzing-feed.js'), "bizzing-feed.js is the family's file, unchanged");
if (existsSync(HIVE + 'bizzing-feed.css')) ok(sha(new URL('../styles/bizzing-feed.css', import.meta.url).pathname) === sha(HIVE + 'bizzing-feed.css'), "bizzing-feed.css is the family's file, unchanged");

if (fails) { console.error(bad.map((m) => '✗ feed: ' + m).join('\n')); console.error(`✗ feed: ${fails} failure(s)`); process.exit(1); }
const kinds = FEED.reduce((a, c) => ((a[c.kind] = (a[c.kind] || 0) + 1), a), {});
console.log(`✓ feed: ${FEED.length} cards — ${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(', ')}; by road ${LEVELS.map((L) => `${L.n}:${byLevel[L.n]}`).join(' ')}, no level ${agnostic}; every src resolves, ranking holds`);
