/* build-feed.mjs — My Feed's cards, cut from this app's own corpus at build time
   (FAMILY-STANDARD §6a; Bizzing India's tools/build-feed.js is the model).

     node tools/build-feed.mjs        → app/src/data/feed/index.js (what the engine ranks) and
                                        g-L1 … g-L10.js, g-any.js (the cards' words, one group per road)
                                        — loaded by #/feed only, and only the groups a session uses;
                                        tools/feed-manifest.json (counts by kind and by level)

   No upper limit (owner, UPDATE 3): every honest angle on an object is its own kind and its own src
   path — a word's meaning, its example and its question; a country's facts, its neighbours, its
   capital and its flag; a stop's hook, ideas, why and every question its generator can ask. What
   binds is that nothing is said twice: a card whose words are ≥ 80% another's is let go.

   NOTHING HERE IS TYPED. Every card names the object it was cut from (`src`), and
   app/test/feed-content.mjs resolves each one and finds the card's words in it:

     country / capital / flag   the 195 in data/countries.js (Natural Earth, India's depiction)
     quiz / map                 the stops' own generators, seeded, so the same question regenerates
     stop / idea / why / world  the Atlas's chapters, their own words
     exp                        the expeditions: each one, each part's objective, each project, each
                                Library day's instruction
     continent / island         the which-continent and island-nations stops' own answers
     neighbours                 each country's land neighbours, from the data
     day                        each expedition day's own aim
     word / example / wordq     the Dictionary: meaning, example, and its quiz's own question
     state / stateq             the State Capitals shelf, from the data
     rank / ocean               the explorer ranks' and the oceans' checked facts, with their sources
     where                      the painted postcards of Where on Earth? — the painting, never a photo

   Every card carries `level` — the road (levels.js) on which the child first meets it:
     a stop's card: the first road the stop is on; a quiz: the road whose step generated it;
     a capital or flag: the first road whose step at its depth (lv 1 famous countries, lv 2 also the
     big ones, lv 3 every one) asks for that country — the chapters' own levelPool rule;
     an expedition: the road for its youngest age (Level n is geography age n + 5).
   Level-agnostic (no `level`): the Dictionary, State Capitals, ranks, oceans and the Where on Earth? postcards
   — none of them is on a road.

   HELD BACK, on purpose: Landmarks (LANDMARK_NEEDS_REVIEW), Earth Through Time's steps and maps
   (ERAS_NEED_REVIEW) and the continent histories (HISTORY_NEEDS_REVIEW) — all awaiting a second
   reader; this build refuses to run if one is cut while its flag is up. Street View places (a
   third-party request); any question whose answer is a figure (it needs the picture); any map
   question whose list names its own answer in the text. */

import { writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const APP = resolve(import.meta.dirname, '../app');
const I = (p) => import(resolve(APP, 'src', p));

const { STOPS, WORLDS, byId, drill } = await I('stops.js');
const { LEVELS, firstLevel, START } = await I('levels.js');
const { seeded, shuffle } = await I('rand.js');
const { QUIZ, byCc, capOf, capsText, fmtArea, OCEANS, OCEAN_SRC, hemiNS, hemiEW } = await I('geo.js');
const { RANKS, RANK_SRC } = await I('model.js');
const { regionsOf, COUNTRY: REGION_COUNTRIES } = await I('library/states.js');
const { dayTitle, KIND } = await I('expeditions.js');
const { FAMOUS, TWO_CONTINENTS } = await I('chapters/kit.js');
const { givesAway, nbrs } = await I('chapters/capitals.js');
const { ISLANDS } = await I('chapters/landwater.js');
const { listOptions } = await I('listmode.js');
const { allTools } = await I('library/index.js');
const TOOL_NAME = Object.fromEntries((await allTools()).map((t) => [t.TOOL.id, t.TOOL.name]));
const { WORDS, TOPICS } = await I('library/dictionary.js');
const { POSTCARDS } = await I('data/postcards.js');
const { EXPEDITIONS, daysOf } = await I('data/expeditions.js');
const { LANDMARK_NEEDS_REVIEW } = await I('data/landmarks.js');
const { ERAS_NEED_REVIEW } = await I('data/eras.js');
const { HISTORY_NEEDS_REVIEW } = await I('data/history.js');

export const MAX = 2000, PER_LEVEL = 100, AGNOSTIC = 300, QUIZ_PER_STEP = Infinity, TOP_UP = 110, NEAR = 0.8;
const BANDS = ['6-7', '8-10', '11-14'];
export const bandOfLevel = (n) => (n <= 2 ? '6-7' : n <= 5 ? '8-10' : '11-14');
const bandsFrom = (b) => BANDS.slice(BANDS.indexOf(b));
export const plain = (s) => String(s ?? '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const art = (p) => (existsSync(resolve(APP, 'public', p)) ? p : undefined);
const flagArt = (cc) => art(`flags/${cc.toLowerCase()}.svg`);
/* every card says what it is (the engine's badge), and a card about ONE thing links to that thing
   (#/lib/<tool>/<item>, #/expd/<id>/<day>) — the owner: never the generic tool. test/feed.mjs holds both. */
const B = (label) => ({ id: label.toLowerCase().replace(/[^a-z]+/g, '-'), label });
const ord = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const AREA_RANK = Object.fromEntries(QUIZ.filter((c) => c.area).sort((a, b) => b.area - a.area).map((c, i) => [c.cc, i + 1]));
const list = (xs) => (xs.length === 1 ? xs[0] : xs.slice(0, -1).join(', ') + ' and ' + xs.at(-1));

/* the chapters' levelPool rule: which countries a step at depth lv asks about */
export const inPool = (c, lv) => (lv >= 3 ? true : lv === 2 ? FAMOUS.has(c.cc) || c.area > 100000 : FAMOUS.has(c.cc));
export const GROUP = { Europe: 'europe', Asia: 'asia', Africa: 'africa', 'North America': 'americas', 'South America': 'americas', Oceania: 'oceania' };
/* the first road whose step for `stop` asks about country c */
export function levelFor(stop, c) {
  for (const L of LEVELS) for (const s of L.steps) if (s.stop === stop && inPool(c, s.lv)) return L.n;
  return null;
}
export const QSEED = (L, stop, lv) => `feed|${L}|${stop}|${lv}`;
export const QN = 400;
/* a question a card can ask without its picture, with its answer nowhere in its words */
export const fairMc = (q) => q.kind === 'mc' && !q.html && !/[<>]/.test(q.text) && q.opts.length >= 2 && q.opts.filter((o) => o === q.ans).length === 1 &&
  !leaks(q.text, q.ans, q.opts);
/* test/stops.mjs's rule: the answer is not in the text, unless the text names every option */
export function leaks(text, ans, opts) {
  const low = text.toLowerCase(), named = (o) => low.includes(String(o).toLowerCase());
  return !['True', 'False'].includes(ans) && ans.length > 2 && named(ans) && !opts.every(named);
}

export function build() {
  if (LANDMARK_NEEDS_REVIEW === undefined || ERAS_NEED_REVIEW === undefined || HISTORY_NEEDS_REVIEW === undefined) throw new Error('a review flag is missing');
  const cards = [];
  const add = (c) => {
    /* a card whose words are fewer than three is not worth reading on its own: a figure's letters ("NESW"),
       a bare example ("Pangaea.") — the auditor found both */
    if (c.body && !c.play && plain(c.body).split(/\s+/).filter((w) => /[a-z]/i.test(w)).length < 3) return;
    const lv = c.level;
    cards.push({ ...c, bands: c.bands || (lv ? bandsFrom(bandOfLevel(lv)) : BANDS) });
  };

  /* ---- the Atlas: worlds, stops, their ideas and their why (the chapters' own words) */
  for (const w of WORLDS) {
    const lv = Math.min(...STOPS.filter((s) => s.world === w.id).map((s) => firstLevel(s.id)).filter(Boolean));
    add({ id: 'w-' + w.id, kind: 'world', level: lv, topics: ['world:' + w.id], src: 'world:' + w.id, title: w.name, badge: B('Atlas place'), body: plain(w.blurb), art: art(`art/w-${w.id}.webp`), route: '#/world/' + w.id, cta: 'Visit ' + w.short });
  }
  for (const s of STOPS) {
    const lv = firstLevel(s.id); if (!lv) continue;
    const t = ['stop:' + s.id, 'world:' + s.world], route = '#/stop/' + s.id, wart = art(`art/w-${s.world}.webp`), cta = 'Open “' + s.title + '”';
    add({ id: 's-' + s.id, kind: 'stop', level: lv, topics: t, stop: s.id, src: 'stop:' + s.id + ':hook', title: s.title, badge: B('Stop'), body: plain(s.hook), art: wart, route, cta });
    (s.idea || []).forEach((x, i) => add({ id: `i-${s.id}-${i}`, kind: 'idea', level: lv, topics: t, stop: s.id, src: `stop:${s.id}:idea:${i}`, title: s.title, badge: B('Big idea'), body: plain(x), art: wart, route, cta }));
    if (s.why) add({ id: 'y-' + s.id, kind: 'why', level: lv, topics: t, stop: s.id, src: `stop:${s.id}:why`, title: 'Why it matters: ' + s.title, badge: B('Why it matters'), body: plain(s.why), art: wart, route, cta });
  }

  /* ---- the stops' own questions, road by road (seeded, so each regenerates exactly). Each step gives
     up to QUIZ_PER_STEP; a road still short of TOP_UP cards then takes more from its own steps, in
     turn, as long as they have new questions — never a card from another road. */
  const seenQ = new Set(), gen = {};
  const nextQ = (L, st) => {
    const k = L.n + '|' + st.stop + '|' + st.lv, s = byId[st.stop];
    const g = gen[k] || (gen[k] = { qs: drill(s, st.lv, QN, seeded(QSEED(L.n, st.stop, st.lv))), i: 0, n: 0 });
    while (g.i < g.qs.length) {
      const q = g.qs[g.i++], key = q.text + '|' + (q.ans ?? (q.ok || []).join());
      if (seenQ.has(key)) continue;
      /* the card's title is its stop's — or its world's where the stop's name would give the answer away */
      const title = [s.title, WORLDS.find((w) => w.id === s.world).name, 'A question'].find((t) => q.kind !== 'mc' || !leaks(t, q.ans, q.opts));
      const base = { level: L.n, topics: ['stop:' + s.id, 'world:' + s.world], stop: s.id, route: '#/stop/' + s.id, cta: 'Practise in “' + s.title + '”', src: `quiz:${s.id}:${st.lv}:${L.n}`, title, badge: B('Quiz'), art: art(`art/w-${s.world}.webp`) };
      if (fairMc(q)) {
        seenQ.add(key); g.n++;
        return { ...base, id: `q-${s.id}-${L.n}-${g.n}`, kind: 'quiz', play: { q: q.text, opts: [q.ans, ...q.opts.filter((o) => o !== q.ans)], after: plain(q.why) } };
      }
      if (q.kind === 'map') {
        const { ids, right, names } = listOptions(q), nm = ids.map((x) => names[x]);
        if (ids.length < 3 || nm.some((x) => !x || q.text.toLowerCase().includes(x.toLowerCase()))) continue;
        seenQ.add(key); g.n++;
        return { ...base, id: `m-${s.id}-${L.n}-${g.n}`, kind: 'map', mapText: q.text, play: { q: q.text.replace(/^Tap /, 'Which of these is in ').replace(/ on the map\.$/, '?'), opts: [names[right], ...ids.filter((x) => x !== right).map((x) => names[x])], after: plain(q.why) } };
      }
    }
    return null;
  };
  for (const L of LEVELS) for (const st of L.steps) for (let i = 0; i < QUIZ_PER_STEP; i++) { const c = nextQ(L, st); if (!c) break; add(c); }

  /* ---- the 195: capital, flag and the country itself, each on the road that first asks it */
  for (const c of QUIZ) {
    const g = GROUP[c.cont]; if (!g) continue;
    const lvCap = levelFor('cap-' + g, c), lvFlag = levelFor('flags', c);
    const near = shuffle(QUIZ.filter((x) => x !== c && x.cont === c.cont && !givesAway(x)), seeded('feedcap|' + c.cc));
    if (lvCap) {
      const lines = [];
      if (!TWO_CONTINENTS.has(c.cc)) lines.push(`${c.name} is in ${c.cont}.`);
      lines.push(c.cap.length > 1 ? `Its capitals: ${capsText(c)}.` : `Its capital is ${capOf(c)}.`);
      const nb = nbrs(c).map((b) => byCc[b].name);
      if (!nb.length) lines.push('It has no land neighbours.');
      else lines.push(nb.length <= 3 ? `It shares land borders with ${list(nb)}.` : `It shares land borders with ${nb.length} countries, among them ${list(nb.slice(0, 3))}.`);
      lines.push(c.landlocked ? 'It has no coast — it is landlocked.' : 'It has a coast on the sea.');
      if (c.area) lines.push(`Area: ${fmtArea(c.area)} — the ${ord(AREA_RANK[c.cc])} largest of the 195 countries.`);
      if (c.capAt && c.capAt[0]) lines.push(`Its capital is in the ${hemiNS(c.capAt[0][0])} and ${hemiEW(c.capAt[0][1])} hemispheres.`);
      add({ id: 'c-' + c.cc, kind: 'country', level: lvCap, topics: ['cont:' + c.cont, 'tool:explorer', 'cc:' + c.cc], src: 'country:' + c.cc, title: c.name, badge: B('Country'), art: flagArt(c.cc), body: lines.join(' '), source: 'From Natural Earth’s map data (India’s depiction)', route: '#/lib/explorer/' + c.cc, cta: `Open ${c.name} on the map` });
      if (nb.length) add({ id: 'n-' + c.cc, kind: 'neighbours', level: levelFor('neighbours', c) || lvCap, topics: ['stop:neighbours', 'cont:' + c.cont, 'cc:' + c.cc], src: 'neighbours:' + c.cc, title: `${c.name}’s neighbours`, badge: B('Neighbours'), art: flagArt(c.cc),
        body: `${c.name} shares a land border with ${list(nb)} — ${nb.length === 1 ? 'one country' : nb.length + ' countries'} in all.`, source: 'From Natural Earth’s map data (India’s depiction)', route: '#/lib/explorer/' + c.cc, cta: `See ${c.name} and its neighbours` });
      if (!givesAway(c)) {
        const wrong = []; for (const x of near) { if (wrong.length >= 3) break; const cap = capOf(x); if (!c.cap.includes(cap) && !wrong.includes(cap)) wrong.push(cap); }
        if (wrong.length >= 2) add({ id: 'k-' + c.cc, kind: 'capital', level: lvCap, key: 'ans:' + capOf(c), topics: ['stop:cap-' + g, 'cont:' + c.cont, 'tool:capitals', 'cc:' + c.cc], src: 'capital:' + c.cc, title: 'Capitals of ' + c.cont,
          badge: B('Capital'), art: flagArt(c.cc), play: { q: `What is the capital of ${c.name}?`, opts: [capOf(c), ...wrong], after: `The capital of ${c.name} is ${capOf(c)}.${c.capNote ? ' ' + c.capNote : ''}${TWO_CONTINENTS.has(c.cc) ? '' : ` ${c.name} is in ${c.cont}.`}` }, route: '#/lib/capitals/' + c.cc, cta: `Find ${c.name}’s capital on the map` });
      }
    }
    if (lvFlag && c.hasFlag) {
      const wrong = near.slice(0, 3).map((x) => x.name);
      add({ id: 'f-' + c.cc, kind: 'flag', level: lvFlag, key: 'ans:' + c.name, topics: ['stop:flags', 'cont:' + c.cont, 'tool:flags', 'cc:' + c.cc], src: 'flag:' + c.cc, title: 'A flag of ' + c.cont, art: art(`flags/${c.cc.toLowerCase()}.svg`),
        badge: B('Flag'), play: { q: 'Whose flag is this?', opts: [c.name, ...wrong], after: `This is the flag of ${c.name}. Its capital is ${capOf(c)}.` }, route: '#/lib/flags/' + c.cc, cta: 'Open this flag in Flags of the World' });
    }
  }

  /* ---- which continent, and which countries are islands — the generators' own answers ("why"),
     on the road whose step first asks them (which-continent: lv 1 the big famous ones, lv 2 every famous one) */
  const contPool = (lv) => QUIZ.filter((c) => !TWO_CONTINENTS.has(c.cc) && !c.name.includes(c.cont.split(' ')[0]) && (lv >= 3 || FAMOUS.has(c.cc)) && (lv >= 2 || c.area > 250000));
  for (const c of contPool(3)) {
    let lv = null; for (const L of LEVELS) for (const st of L.steps) if (!lv && st.stop === 'which-continent' && contPool(st.lv).includes(c)) lv = L.n;
    if (lv) add({ id: 'ct-' + c.cc, kind: 'continent', level: lv, topics: ['stop:which-continent', 'cont:' + c.cont, 'cc:' + c.cc], stop: 'which-continent', src: 'continent:' + c.cc, title: 'Which continent?', badge: B('Continent'), art: flagArt(c.cc), body: `${c.name} is in ${c.cont}.`, route: '#/stop/which-continent', cta: 'Open “Which continent?”' });
  }
  for (const cc of ISLANDS) { const c = byCc[cc];
    add({ id: 'is-' + cc, kind: 'island', level: firstLevel('island-nations'), topics: ['stop:island-nations', 'cc:' + cc], stop: 'island-nations', src: 'island:' + cc, title: 'Island countries', badge: B('Island country'), art: flagArt(cc), body: `${c.name} is an island country: you cannot walk to it from any other country.`, route: '#/stop/island-nations', cta: 'Open the stop' }); }

  /* ---- the expeditions: each one, each part's objective, each project, each Library day */
  for (const e of EXPEDITIONS) {
    const lv = Math.max(1, Math.min(10, e.ages[0] - 5)), route = '#/expd/' + e.id, t = ['exp:' + e.id], eart = art(`art/crs-${e.id}.webp`), all = daysOf(e);
    const dayRoute = (key) => route + '/' + key, dayN = (key) => all.find((x) => x.key === key).n;
    /* what a day is about, in the app's own names: its stop(s), or its Library tool */
    const covers = (d) => { const ids = d.stop ? [d.stop] : d.stops || []; const t = ids.map((x) => byId[x] && `“${byId[x].title}”`).filter(Boolean); return t.length ? (t.length > 3 ? `${t.length} stops` : list(t)) : d.tool && TOOL_NAME[d.tool] ? TOOL_NAME[d.tool] : ''; };
    add({ id: 'e-' + e.id, kind: 'exp', level: lv, topics: t, src: 'exp:' + e.id, title: e.name, badge: B('Expedition'), body: `${plain(e.blurb)} ${all.length} days in ${e.modules.length} parts, then a final test and a final project.`, art: eart, route, cta: 'Open the expedition' });
    for (const m of e.modules) {
      const tm = [...t, ...m.days.flatMap((d) => (d.stop ? ['stop:' + d.stop] : (d.stops || []).map((x) => 'stop:' + x)))];
      add({ id: `e-${e.id}-${m.id}`, kind: 'exp', level: lv, topics: tm, src: `exp:${e.id}:${m.id}`, exp: e.id, title: `${e.name} · ${m.name}`, badge: B('Expedition part'), art: eart, body: `In this part you learn to ${plain(m.objective)}. ${m.days.length} days, then you make ${plain(m.project.name)}.`, route: dayRoute(`${m.id}.0`), cta: 'Open this part' });
      add({ id: `e-${e.id}-${m.id}-p`, kind: 'exp', level: lv, topics: tm, src: `exp:${e.id}:${m.id}:project`, exp: e.id, day: `${m.id}.project`, title: 'Make: ' + m.project.name, badge: B('Make'), art: eart, body: `${plain(m.project.brief)} (${e.name}, part: ${m.name}.)`, route: dayRoute(`${m.id}.project`), cta: `Open day ${dayN(`${m.id}.project`)}` });
      m.days.forEach((d, i) => { if (d.tool && d.how) add({ id: `e-${e.id}-${m.id}-${i}`, kind: 'exp', level: lv, topics: [...t, 'tool:' + d.tool], src: `exp:${e.id}:${m.id}.${i}`, exp: e.id, day: `${m.id}.${i}`, title: d.name, badge: B('Expedition day'), art: eart, body: `${plain(d.how)} (${e.name}, part: ${m.name}.)`, route: dayRoute(`${m.id}.${i}`), cta: `Open day ${dayN(`${m.id}.${i}`)}` }); });
    }
    /* no card per expedition day: "Day 3 of 27: a practise day… Today’s aim: ten." was a template, not news
       (audit v4). The parts, the makes and the days with a tool to open carry the expedition. */
    add({ id: `e-${e.id}-final`, kind: 'exp', level: lv, topics: t, src: `exp:${e.id}:final`, exp: e.id, day: 'final.project', title: 'Make: ' + e.final.name, badge: B('Make'), art: eart, body: `${plain(e.final.brief)} The last day of ${e.name}.`, route: dayRoute('final.project'), cta: `Open day ${dayN('final.project')}` });
  }

  /* ---- level-agnostic: the Dictionary, and the painted postcards of Where on Earth? */
  /* a word: its meaning; its example (where the Dictionary gives one); and the Dictionary quiz's own
     question — four words from its topic, none spelled out in the meaning */
  const inDef = (w, d) => d.toLowerCase().includes(w.toLowerCase());
  for (const [w, d, t, ex] of WORDS) {
    const slug = w.toLowerCase().replace(/[^a-z0-9]+/g, '-'), base = { topics: ['tool:dictionary', 'dict:' + t], source: 'Geography Dictionary · ' + TOPICS.find((x) => x.id === t).name, route: '#/word/' + encodeURIComponent(w), cta: `Open “${w}” in the Dictionary`, badge: B('Word') };
    add({ ...base, id: 'd-' + slug, kind: 'word', src: 'word:' + w, title: w, body: d.charAt(0).toUpperCase() + d.slice(1) + '.' });
    if (ex) add({ ...base, id: 'dx-' + slug, kind: 'example', src: 'word:' + w + ':example', title: 'Where to see it: ' + w, body: ex.charAt(0).toUpperCase() + ex.slice(1) + '.' });
    const same = shuffle(WORDS.filter(([x, , tt]) => tt === t && x !== w && !inDef(x, d)).map((x) => x[0]), seeded('feedword|' + w)).slice(0, 3);
    if (same.length === 3) add({ ...base, id: 'dq-' + slug, kind: 'wordq', key: 'ans:' + w, src: 'word:' + w + ':quiz', title: 'Which word is it?', play: { q: `Which word means: “${d}”?`, opts: [w, ...same], after: `${w}: ${d}.` } });
  }
  /* the State Capitals shelf: each state's capital, and its question (never one whose capital is its own name) */
  const fairState = (s) => !s.cap.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]) && !s.name.toLowerCase().includes(s.cap.toLowerCase().split(' ')[0]);
  for (const C of REGION_COUNTRIES) {
    const regs = regionsOf(C.c);
    for (const r of regs) {
      const base = { topics: ['tool:states', 'cc:' + C.c], bands: ['8-10', '11-14'], route: '#/lib/states/' + r.id, cta: `Open ${r.name} in State Capitals`, title: `${C.name}: ${r.name}`, art: flagArt(C.c) };
      add({ ...base, id: 'st-' + r.id, kind: 'state', badge: B('State'), src: `state:${C.c}:${r.id}`, body: `${r.name} is a ${r.type === 'ut' ? 'union territory' : C.unit.split(' ')[0]} of ${/^United /.test(C.name) ? 'the ' : ''}${C.name}. Its capital: ${r.capFull}.` });
      if (fairState(r)) {
        const wrong = shuffle(regs.filter((x) => x !== r && x.cap !== r.cap).map((x) => x.cap), seeded('feedst|' + r.id)).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);
        add({ ...base, id: 'sq-' + r.id, kind: 'stateq', badge: B('State capital'), key: 'ans:' + r.cap, src: `state:${C.c}:${r.id}:quiz`, title: `Capitals of ${C.name}`, play: { q: `What is the capital of ${r.name}?`, opts: [r.cap, ...wrong], after: `The capital of ${r.name} is ${r.capFull}.` } });
      }
    }
  }
  /* the explorer ranks' checked facts, and the oceans' — each with the sources the app names */
  RANKS.forEach((r, i) => add({ id: 'r-' + i, kind: 'rank', topics: ['rank'], src: 'rank:' + i, title: `Explorer rank ${i + 1}: ${r.n}`, badge: B('Explorer rank'), body: r.why, source: 'Checked in: ' + RANK_SRC.join(' · '), route: '#/me', cta: 'My explorer card' }));
  for (const o of OCEANS) add({ id: 'o-' + o.id.toLowerCase(), kind: 'ocean', topics: ['stop:five-oceans'], src: 'ocean:' + o.id, title: `The ${o.id} Ocean`, badge: B('Ocean'), body: o.blurb, source: 'Checked in: ' + OCEAN_SRC.join(' · '), route: '#/stop/five-oceans', cta: 'Open “Five oceans”' });
  for (const p of POSTCARDS) {
    const c = byCc[p.cc]; if (!c) continue;
    const wrong = shuffle(QUIZ.filter((x) => x.cont !== c.cont && FAMOUS.has(x.cc)), seeded('feedpc|' + p.id)).slice(0, 3).map((x) => x.name);
    add({ id: 'p-' + p.id, kind: 'where', bands: bandsFrom(p.band), topics: ['tool:geoguess', 'cont:' + c.cont, 'cc:' + c.cc], src: 'postcard:' + p.id, title: 'Where on Earth is this?', badge: B('Where on Earth?'), body: 'A painting, not a photo.', art: art(`art/${p.id}.webp`),
      play: { q: 'Which country is this painting of?', opts: [c.name, ...wrong], after: `${p.place}. The clues: ${p.clues.join('; ')}.` }, route: '#/place/' + p.id, cta: 'Pin it on the map' });
  }

  /* the top-up: a road short of TOP_UP takes more of its OWN steps' questions, step by step in turn */
  for (const L of LEVELS) {
    let have = cards.filter((c) => c.level === L.n).length, live = L.steps.slice();
    while (have < TOP_UP && live.length) live = live.filter((st) => { if (have >= TOP_UP) return true; const c = nextQ(L, st); if (!c) return false; add(c); have++; return true; });
  }

  /* distinct: never two cards with the same source, kind and words */
  const seen = new Set(), out = [];
  for (const c of cards) { const k = c.src + '|' + c.kind + '|' + c.title + '|' + (c.body || '') + '|' + (c.play ? c.play.q + '|' + c.play.opts.join('|') : ''); if (seen.has(k)) continue; seen.add(k); out.push(c); }
  return nearDups(out).kept;
}

/* NEAR-DUPLICATES (owner): two cards whose words are ≥ 80% the same are one card said twice; the
   later is let go. Words = the body, the question and its options (a title is a label). */
export const words = (c) => new Set(`${c.body || ''} ${c.play ? c.play.q + ' ' + c.play.opts.join(' ') : ''}`.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean));
export const jaccard = (a, b) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n / (a.size + b.size - n || 1); };
export function nearDups(cards, near = NEAR) {
  const kept = [], dropped = [], W = [];
  for (const c of cards) {
    const w = words(c); let hit = null;
    for (let i = 0; i < kept.length && !hit; i++) {
      const v = W[i]; if (Math.min(v.size, w.size) < near * Math.max(v.size, w.size)) continue;
      if (jaccard(v, w) >= near) hit = kept[i];
    }
    if (hit) dropped.push([c.id, hit.id]); else { kept.push(c); W.push(w); }
  }
  return { kept, dropped };
}

/* the lazy groups: an index (what the engine ranks) and the cards' words, one group per road
   and one for the level-agnostic cards — a session loads only the groups its cards are in */
export const groupOf = (c) => (c.level == null ? 'any' : 'L' + c.level);
const META = ['id', 'kind', 'level', 'bands', 'topics', 'key', 'stop', 'exp', 'day'];
export const metaOf = (c) => Object.fromEntries(META.filter((f) => c[f] !== undefined).map((f) => [f, c[f]]).concat(c.play ? [['play', c.play.opts.length === 2 ? 2 : 1]] : []));   // play: 2 marks a two-option (true/false) question, which a session caps

export function manifest(cards) {
  const by = (f) => cards.reduce((a, c) => ((a[f(c)] = (a[f(c)] || 0) + 1), a), {});
  return { total: cards.length, byKind: by((c) => c.kind), byLevel: by((c) => c.level ?? 'any'),
    heldBack: ['Landmarks (awaiting a second reader)', 'Earth Through Time (awaiting a second reader)', 'Continent histories (awaiting a second reader)', 'Street View places (third-party photos)', 'questions answered by a figure', 'map questions whose list names the answer'] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cards = build(), m = manifest(cards);
  const thin = Object.entries(m.byLevel).filter(([k, n]) => k !== 'any' && n < PER_LEVEL);
  const dir = resolve(APP, 'src/data/feed'); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const head = '/* GENERATED by tools/build-feed.mjs from the app\'s own corpus. Do not edit; rerun it. */\n';
  writeFileSync(resolve(dir, 'index.js'), head + `export const INDEX = ${JSON.stringify(cards.map((c) => ({ ...metaOf(c), g: groupOf(c) })))};\n`);
  const groups = {}; for (const c of cards) (groups[groupOf(c)] = groups[groupOf(c)] || {})[c.id] = c;
  for (const [g, o] of Object.entries(groups)) writeFileSync(resolve(dir, `g-${g}.js`), head + `export const CARDS = ${JSON.stringify(o)};\n`);
  writeFileSync(resolve(import.meta.dirname, 'feed-manifest.json'), JSON.stringify(m, null, 1) + '\n');
  console.log(JSON.stringify(m));
  if (thin.length) console.log('THIN LEVELS:', thin);
}
