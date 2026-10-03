/* Land & Water Valley — the shapes of the land and the water. Ages 6–7. */
import { mc, bank } from './kit.js';
import { pick } from '../rand.js';
import { byCc } from '../geo.js';

export const WORLD = { id: 'landwater', name: 'Land & Water Valley', short: 'Land & Water', glyph: '⛰️', band: '6-7', ink: '#2D6A7A', tint: '#E0F1F4',
  blurb: 'Mountains, valleys, plains and islands; oceans, lakes, rivers and bays — the words for what the Earth is made of.' };

const LAND = [
  ['mountain', 'a very high, steep piece of land that rises far above what is around it'],
  ['hill', 'raised land that is lower and gentler than a mountain'],
  ['valley', 'low land between hills or mountains, often with a river in it'],
  ['plain', 'a wide, flat area of land'],
  ['plateau', 'a high area of land that is flat on top'],
  ['desert', 'a place that gets very little rain'],
  ['island', 'land with water all the way round it'],
  ['peninsula', 'land with water on three sides'],
  ['volcano', 'an opening in the Earth where hot melted rock comes out'],
  ['cliff', 'a steep wall of rock, often by the sea'],
  ['cave', 'a hollow space under the ground or in a cliff'],
  ['coast', 'where the land meets the sea'],
];
const WATER = [
  ['ocean', 'a huge body of salt water — there are five on Earth'],
  ['sea', 'a large area of salt water, smaller than an ocean and partly closed in by land'],
  ['lake', 'a large body of water with land all the way round it'],
  ['river', 'fresh water flowing downhill in a channel towards the sea'],
  ['pond', 'a small, still body of water'],
  ['bay', 'part of the sea that curves into the land'],
  ['strait', 'a narrow strip of sea joining two larger seas'],
  ['waterfall', 'where a river drops over a steep edge'],
  ['glacier', 'a huge, slow river of ice'],
  ['stream', 'a small, narrow river'],
];
const defQ = (list, kind) => (r, lv) => {
  const [word, def] = pick(lv === 1 ? list.slice(0, 7) : list, r);
  if (r() < 0.5) return mc(r, `What do we call ${def}?`, word, list.map((x) => x[0]), `${word[0].toUpperCase() + word.slice(1)}: ${def}.`);
  return mc(r, `What is a ${word}?`, def, list.map((x) => x[1]), `A ${word} is ${def}.`);
};

/* Real examples, each checked in the data where the data can say it. */
export const ISLANDS = ['IS', 'JP', 'MG', 'LK', 'NZ', 'CU', 'JM', 'IE', 'MT', 'CY', 'SG', 'MV', 'FJ', 'BH'];
const NOT_ISLANDS = ['FR', 'DE', 'BR', 'KE', 'IN', 'CN', 'EG', 'MX', 'PE', 'PL', 'NG', 'AR', 'TH', 'CA'];
function islandQ(r, lv) {
  const isl = byCc[pick(ISLANDS, r)];
  return mc(r, 'Which of these countries is made of islands only — with sea all the way round?', isl.name, NOT_ISLANDS.map((c) => byCc[c].name),
    `${isl.name} is an island country: you cannot walk to it from any other country.`);
}

export const STOPS = [
  { id: 'landforms', title: 'Shapes of the land', glyph: '🏔️', band: '6-7',
    hook: 'If you could walk from the top of a mountain down to the sea, you would cross a valley, a plain and a coast.',
    idea: ['A <b>landform</b> is a natural shape of the land.', 'High ones: <b>mountains</b>, <b>hills</b>, <b>plateaus</b> (high and flat on top). Low ones: <b>valleys</b> and <b>plains</b>.', 'Where land meets water: <b>coasts</b>, <b>cliffs</b>, <b>islands</b> (water all round) and <b>peninsulas</b> (water on three sides).'],
    why: 'Landforms decide where rivers run, where people farm and where towns grow.',
    gen: defQ(LAND, 'land') },
  { id: 'water-bodies', title: 'Oceans, lakes and rivers', glyph: '🌊', band: '6-7',
    hook: 'Almost all the water on Earth is salty. The fresh water we drink is a tiny part of it.',
    idea: ['<b>Oceans</b> and <b>seas</b> are salt water. Most <b>lakes</b>, <b>rivers</b> and <b>streams</b> are fresh water.', 'A <b>bay</b> is sea curving into the land. A <b>strait</b> is a narrow strip of sea between two pieces of land.', 'A <b>glacier</b> is a slow river of ice. Glaciers and ice sheets hold most of Earth’s fresh water.'],
    why: 'People have always lived near fresh water — every great early city grew beside a river.',
    src: ['US Geological Survey — “Where is Earth’s water?”'],
    gen: defQ(WATER, 'water') },
  { id: 'land-or-water', title: 'Land or water?', glyph: '🏝️', band: '6-7',
    hook: 'An island and a lake are opposites: one is land in water, the other is water in land.',
    idea: ['Some words come in opposite pairs.', 'An <b>island</b> is land surrounded by water; a <b>lake</b> is water surrounded by land.', 'A <b>peninsula</b> is land poking into the water; a <b>bay</b> is water poking into the land.'],
    why: 'Pairs like these make the words easy to remember for ever.',
    gen: bank([
      { lv: 1, q: 'Land with water all the way round it is…', a: 'an island', w: ['a lake', 'a bay', 'a valley'] },
      { lv: 1, q: 'Water with land all the way round it is…', a: 'a lake', w: ['an island', 'an ocean', 'a peninsula'] },
      { lv: 1, tf: true, q: 'A peninsula has water on three sides.' },
      { lv: 1, tf: false, q: 'Oceans are made of fresh water.', why: 'Oceans are salt water. Most lakes and rivers are fresh.' },
      { lv: 2, q: 'The sea curving into the land is…', a: 'a bay', w: ['a peninsula', 'a plateau', 'a cliff'] },
      { lv: 2, q: 'The land poking out into the sea is…', a: 'a peninsula', w: ['a bay', 'a lake', 'a strait'] },
      { lv: 2, q: 'Which one is water?', a: 'a strait', w: ['a plateau', 'a valley', 'a peninsula'] },
      { lv: 2, q: 'Which one is land?', a: 'a plateau', w: ['a strait', 'a bay', 'a lagoon'] },
      { lv: 3, q: 'India, Italy and Korea are each mostly a…', a: 'peninsula', w: ['island', 'lake', 'plateau'], why: 'Each sticks out into the sea with water on three sides.' },
    ]) },
  { id: 'island-nations', title: 'Island countries', glyph: '🗾', band: '6-7',
    hook: 'You cannot drive to Japan or to Iceland. You have to sail or fly.',
    idea: ['Some countries are made only of islands: <b>Japan</b>, <b>Iceland</b>, <b>New Zealand</b>, <b>Sri Lanka</b>, <b>Madagascar</b>.', 'Some islands are shared: the island of Ireland has two countries on it.', 'Island people have always been sailors, fishers and traders.'],
    why: 'Being an island shapes a country’s food, its weather and how it meets the rest of the world.',
    gen: islandQ },
];
