/* Capital Bazaar — countries, capitals, flags and neighbours, continent by
   continent. Ages 8–10. Every question here is generated from the country
   data; nothing about a country is typed into this file. */
import { mc, mapQ, mix, FAMOUS, typeQ, orderQ } from './kit.js';
import { pick, shuffle } from '../rand.js';
import { QUIZ, CONTINENTS, byCc, capOf } from '../geo.js';

export const WORLD = { id: 'capitals', name: 'Capital Bazaar', short: 'Capitals', glyph: '🏛️', band: '8-10', ink: '#8B2F5C', tint: '#F8E4EE',
  blurb: 'Every country in the world, its capital, its flag and its neighbours — one continent at a time.' };

const inGroup = (g) => QUIZ.filter((c) => g.conts.includes(c.cont));
/* A continent with few famous countries (Oceania has four) cannot fill a first-look round,
   so the first look tops up with the group's biggest countries by area, to at least eight. */
const LV1_MIN = 8;
const levelPool = (list, lv) => {
  const got = list.filter((c) => (lv >= 3 ? true : lv === 2 ? FAMOUS.has(c.cc) || c.area > 100000 : FAMOUS.has(c.cc)));
  if (lv !== 1 || got.length >= LV1_MIN) return got;
  const more = list.filter((c) => !got.includes(c)).sort((a, b) => b.area - a.area);
  return got.concat(more.slice(0, LV1_MIN - got.length));
};

/* A capital that carries its country's name (Singapore, Kuwait City, Tunis in
   Tunisia) answers its own question, so it is never asked. The Capitals shelf
   in the Library still shows it. */
const stem = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(/[ ,]/)[0].slice(0, 5);
export const givesAway = (c) => c.cap.some((n) => stem(n) === stem(c.name) || n.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]) || c.name.toLowerCase().includes(n.toLowerCase()));
export function capitalQ(r, list0, lv) {
  const list = list0.filter((c) => !givesAway(c));
  const pool = levelPool(list, lv).length >= 4 ? levelPool(list, lv) : list;
  const c = pick(pool, r);
  const others = list.filter((x) => x !== c);
  const note = c.capNote ? ' ' + c.capNote : '';
  if (lv >= 2 && r() < 0.4) {
    return mc(r, `${capOf(c)} is the capital of which country?`, c.name, others.map((x) => x.name), `${capOf(c)} is the capital of ${c.name}.${note}`);
  }
  /* the stretch level TYPES the capital: knowing it, not recognising it */
  if (lv >= 3 && r() < 0.35) return typeQ(`Type the capital of ${c.name}.`, capOf(c), c.cap, `The capital of ${c.name} is ${capOf(c)}.${note}`);
  return mc(r, `What is the capital of ${c.name}?`, capOf(c), others.flatMap((x) => x.cap).filter((n) => !c.cap.includes(n)),
    `The capital of ${c.name} is ${capOf(c)}.${note}`);
}
export function findCountry(r, list, lv) {
  const min = lv === 1 ? 250000 : lv === 2 ? 60000 : 15000;
  const pool = list.filter((c) => c.shape && c.area >= min && (lv >= 3 || FAMOUS.has(c.cc)));
  const c = pick(pool.length ? pool : list.filter((x) => x.shape), r);
  const cont = CONTINENTS.find((x) => x.id === c.cont);
  return mapQ(`Tap ${c.name} on the map.`, [c.cc], cont ? cont.view : null, `That’s ${c.name}.`, c.cc);
}
export function flagQ(r, list, lv) {
  const pool = levelPool(list, lv).length >= 4 ? levelPool(list, lv) : list;
  const c = pick(pool, r);
  return mc(r, 'Whose flag is this?', c.name, list.filter((x) => x !== c).map((x) => x.name), `This is the flag of ${c.name}.`,
    `<img class="flag-q" src="flags/${c.cc.toLowerCase()}.svg" alt="A flag" width="192" height="144">`);
}
/* Land neighbours that are themselves countries in the quiz (the data also
   lists territories such as Hong Kong or French Guiana; those are not asked). */
export const nbrs = (c) => c.borders.filter((b) => byCc[b] && byCc[b].quiz);
export function neighbourQ(r, list, lv) {
  /* Sudan and South Sudan: a neighbour whose name is inside the question's gives itself away */
  const fair = (c) => nbrs(c).filter((b) => !c.name.includes(byCc[b].name) && !byCc[b].name.includes(c.name));
  const pool = levelPool(list, lv).filter((c) => fair(c).length);
  const c = pick(pool.length ? pool : list.filter((x) => fair(x).length), r);
  const yes = byCc[pick(fair(c), r)];
  const no = list.filter((x) => x !== c && !c.borders.includes(x.cc));
  return mc(r, `Which of these countries shares a land border with ${c.name}?`, yes.name, no.map((x) => x.name),
    `${c.name}’s neighbours by land: ${nbrs(c).map((b) => byCc[b].name).join(', ')}.`);
}
/* PUT IN ORDER (E4): countries by area, from the data — sizes at least 25% apart, so it is fair */
export function areaOrderQ(r, list, lv) {
  const n = lv >= 3 ? 4 : 3, pool = shuffle(levelPool(list, Math.max(2, lv)).filter((c) => c.area > 0), r), got = [];
  for (const c of pool) { if (got.length >= n) break; if (got.every((g) => Math.max(g.area, c.area) / Math.min(g.area, c.area) >= 1.25)) got.push(c); }
  if (got.length < 3) return capitalQ(r, list, lv);
  const inOrder = got.sort((a, b) => b.area - a.area);
  return orderQ(`Put these countries in order of size, biggest first: tap them one by one.`, inOrder.map((c) => c.name), `Biggest first: ${inOrder.map((c) => `${c.name} (${Math.round(c.area).toLocaleString('en-US')} km²)`).join(', ')}.`);
}
const most = QUIZ.slice().sort((a, b) => nbrs(b).length - nbrs(a).length);

const GROUPS = [
  { id: 'europe', name: 'Europe', conts: ['Europe'], glyph: '🏰', hook: 'Europe is small but crowded with countries — some you can cross in an afternoon.' },
  { id: 'asia', name: 'Asia', conts: ['Asia'], glyph: '🐼', hook: 'Asia runs from Türkiye to Japan, and from the Arctic to the equator.' },
  { id: 'africa', name: 'Africa', conts: ['Africa'], glyph: '🦁', hook: 'Africa has more countries than any other continent.' },
  { id: 'americas', name: 'The Americas', conts: ['North America', 'South America'], glyph: '🦅', hook: 'From Canada in the Arctic to Chile near Antarctica — two continents joined at Panama.' },
  { id: 'oceania', name: 'Oceania', conts: ['Oceania'], glyph: '🦘', hook: 'Australia, New Zealand, and islands scattered across the widest ocean on Earth.' },
];

export const STOPS = [
  ...GROUPS.map((g) => ({
    id: 'cap-' + g.id, title: `Capitals of ${g.name}`, glyph: g.glyph, band: '8-10',
    hook: g.hook,
    idea: [`${g.name}: <b>${inGroup(g).length} countries</b>.`, 'A <b>capital</b> is the city where a country’s government works — its parliament, its leader’s office.', 'It is not always the biggest city: the capital of Australia is Canberra, not Sydney; of Brazil, Brasília, not São Paulo.', 'Start with the countries you have heard of, then add a few each day.'],
    why: 'Capitals are where the news of a country is made — you will hear these names all your life.',
    /* a group short of famous countries also asks "tap it on the map" at the first look */
    gen: (r, lv) => { const x = r(), map = lv >= 2 || inGroup(g).filter((c) => FAMOUS.has(c.cc)).length < LV1_MIN; return lv >= 2 && x < 0.12 ? areaOrderQ(r, inGroup(g), lv) : x < 0.56 ? capitalQ(r, inGroup(g), lv) : map ? findCountry(r, inGroup(g), lv) : capitalQ(r, inGroup(g), lv); },
    group: g.id,
  })),
  { id: 'flags', title: 'Flags of the world', glyph: '🚩', band: '8-10',
    hook: 'Japan’s flag is a red circle on white: the rising sun.',
    idea: ['Every country has a <b>flag</b>. Its colours and shapes usually stand for something — the land, the sky, the people, a hope.', 'Some flags look alike: Chad and Romania are almost the same; so are Indonesia and Monaco. Look closely.'],
    why: 'A flag is the fastest way to recognise a country — at a sports match, an airport or a museum.',
    gen: (r, lv) => flagQ(r, QUIZ, lv) },
  { id: 'neighbours', title: 'Neighbours', glyph: '🤝', band: '8-10',
    hook: `${most[0].name} touches ${nbrs(most[0]).length} other countries by land. An island country touches none.`,
    idea: ['Countries that share a <b>land border</b> are neighbours.', `The most neighbours: ${most.slice(0, 3).map((c) => `${c.name} (${nbrs(c).length})`).join(', ')}. Island countries have no land neighbours at all.`],
    why: 'Neighbours share rivers, trade, food and languages — and sometimes arguments.',
    gen: (r, lv) => neighbourQ(r, QUIZ, lv) },
];
