/* Land & Water Valley — the shapes of the land and the water. Ages 6–7. */
import { mc, bank, mix } from './kit.js';
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

/* What the shapes do and how they are made — new facts beside the word list, so a round of
   ten never runs out of different questions. */
const LAND_HOW = bank([
  { lv: 1, q: 'What do we call the very top of a mountain?', a: 'the peak', w: ['the base', 'the valley', 'the shore'] },
  { lv: 1, q: 'Which land is best for growing big fields of crops?', a: 'a flat plain', w: ['a steep cliff', 'a rocky mountain top', 'a dry, sandy desert'] },
  { lv: 1, q: 'Where is the air usually coldest?', a: 'on top of a high mountain', w: ['at the bottom of a valley', 'on a low plain', 'on a beach'], why: 'The higher you climb, the colder the air gets.' },
  { lv: 1, tf: true, q: 'Sand dunes are hills of sand, piled up by the wind.' },
  { lv: 1, q: 'A long line of mountains joined together is called…', a: 'a mountain range', w: ['a plain', 'a peninsula', 'a bay'] },
  { lv: 1, tf: false, q: 'Every desert is hot.', why: 'A desert is a place with very little rain. Some are cold — Antarctica is one.' },
  { lv: 1, q: 'Which landform is shaped like a cone, with a hole at the top?', a: 'a volcano', w: ['a valley', 'a cave', 'a plain'] },
  { lv: 2, q: 'Hot melted rock that pours out of a volcano is called…', a: 'lava', w: ['clay', 'sand', 'snow'] },
  { lv: 2, q: 'What slowly wears away a cliff by the sea?', a: 'waves crashing against it', w: ['sunlight shining on it', 'birds nesting on it', 'people looking at it'] },
  { lv: 2, tf: true, q: 'A river can slowly cut a valley into the land.', why: 'Flowing water carries away tiny bits of rock, year after year.' },
  { lv: 2, tf: false, q: 'Mountains are only found on land, never under the sea.', why: 'The ocean floor has mountains too, and some poke out of the sea as islands.' },
  { lv: 2, q: 'A low gap through mountains that people can walk over is called…', a: 'a pass', w: ['a peak', 'a cave', 'a cliff'] },
  { lv: 3, q: 'Flat land at a river’s mouth, built from the mud the river drops, is…', a: 'a delta', w: ['a plateau', 'a canyon', 'a cliff'] },
  { lv: 3, q: 'A very deep valley with steep sides, cut by a river, is…', a: 'a canyon', w: ['a delta', 'a plain', 'a peninsula'] },
  { lv: 3, q: 'Why are there few towns high on steep mountains?', a: 'it is cold, steep and hard to farm', w: ['it is too warm and flat', 'it is always flooded', 'it has too many rivers'] },
]);
const WATER_HOW = bank([
  { lv: 1, tf: true, q: 'Most of the water on Earth is salty.', why: 'Almost all of it is in the oceans.' },
  { lv: 1, q: 'The place where a river starts is called its…', a: 'source', w: ['mouth', 'bank', 'bed'] },
  { lv: 1, q: 'The place where a river flows into the sea is called its…', a: 'mouth', w: ['source', 'bank', 'peak'] },
  { lv: 1, tf: false, q: 'Rain is salty, like the sea.', why: 'Rain is fresh water: when sea water dries up into the air, the salt stays behind.' },
  { lv: 1, q: 'The sea rising and falling along the shore each day is called…', a: 'the tide', w: ['a wave', 'a stream', 'a waterfall'] },
  { lv: 1, tf: true, q: 'Water covers more of the Earth than land does.' },
  { lv: 1, q: 'The land along the side of a river is called its…', a: 'bank', w: ['mouth', 'source', 'peak'] },
  { lv: 1, q: 'In a very cold winter, the top of a lake can freeze into…', a: 'ice', w: ['sand', 'salt', 'steam'] },
  { lv: 2, tf: true, q: 'Most of Earth’s fresh water is frozen in ice sheets and glaciers.' },
  { lv: 2, q: 'A small river that flows into a bigger river is called a…', a: 'tributary', w: ['delta', 'strait', 'bay'] },
  { lv: 2, q: 'A lake made by people, often behind a dam, is called a…', a: 'reservoir', w: ['glacier', 'strait', 'lagoon'] },
  { lv: 2, tf: false, q: 'All lakes are fresh water.', why: 'Most are, but a few are salty — the Dead Sea is really a salt lake.' },
  { lv: 3, q: 'A spring is a place where…', a: 'water comes up out of the ground', w: ['a river meets the sea', 'ice turns into a glacier', 'a lake dries up'] },
  { lv: 3, q: 'Rain that soaks into the ground and fills the gaps in rocks is called…', a: 'groundwater', w: ['a current', 'a tide', 'a glacier'] },
  { lv: 3, q: 'Sea water partly cut off from the ocean by a strip of sand or a reef is…', a: 'a lagoon', w: ['a reservoir', 'a glacier', 'a stream'] },
  { lv: 3, tf: false, q: 'A river carries only water — never sand or mud.', why: 'Rivers carry sand, mud and stones, and drop them further downstream.' },
]);

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
    gen: mix(defQ(LAND, 'land'), LAND_HOW) },
  { id: 'water-bodies', title: 'Oceans, lakes and rivers', glyph: '🌊', band: '6-7',
    hook: 'Almost all the water on Earth is salty. The fresh water we drink is a tiny part of it.',
    idea: ['<b>Oceans</b> and <b>seas</b> are salt water. Most <b>lakes</b>, <b>rivers</b> and <b>streams</b> are fresh water.', 'A <b>bay</b> is sea curving into the land. A <b>strait</b> is a narrow strip of sea between two pieces of land.', 'A <b>glacier</b> is a slow river of ice. Glaciers and ice sheets hold most of Earth’s fresh water.'],
    why: 'People have always lived near fresh water — every great early city grew beside a river.',
    src: ['US Geological Survey — “Where is Earth’s water?”'],
    gen: mix(defQ(WATER, 'water'), WATER_HOW) },
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
      { lv: 1, tf: false, q: 'A river is a kind of land.', why: 'A river is water, flowing in a channel across the land.' },
      { lv: 1, tf: true, q: 'A beach is land beside the water.' },
      { lv: 1, q: 'The opposite of a high mountain peak is a deep…', a: 'valley', w: ['island', 'plateau', 'peninsula'] },
      { lv: 1, q: 'High land is a mountain. Low, flat land is…', a: 'a plain', w: ['a bay', 'a strait', 'a lake'] },
      { lv: 1, q: 'A big flowing river and a small one: the small one is…', a: 'a stream', w: ['an ocean', 'an island', 'a plain'] },
      { lv: 1, q: 'An ocean is huge. A small, still pool of water is…', a: 'a pond', w: ['a sea', 'a plateau', 'a peninsula'] },
      { lv: 2, tf: false, q: 'A bay has land all the way round it.', why: 'A bay is open to the sea on one side.' },
      { lv: 2, tf: true, q: 'A lake can have an island in it.', why: 'Land in water, inside water in land!' },
      { lv: 2, q: 'A desert is very dry land. Land soaked with water, like a swamp, is…', a: 'a wetland', w: ['a plateau', 'a cliff', 'a dune'] },
      { lv: 2, q: 'A lake and a pond both have land all round. The pond is…', a: 'smaller', w: ['saltier', 'higher', 'always frozen'] },
      { lv: 3, q: 'A narrow strip of land joining two bigger pieces of land is…', a: 'an isthmus', w: ['an estuary', 'an oasis', 'a lagoon'] },
      { lv: 3, q: 'A group of islands close together is called…', a: 'an archipelago', w: ['an isthmus', 'an estuary', 'an oasis'] },
      { lv: 3, q: 'Where a river widens and meets the sea, mixing fresh and salt water, is…', a: 'an estuary', w: ['an oasis', 'an isthmus', 'an archipelago'] },
      { lv: 3, q: 'A green, watered spot in the middle of a dry desert is…', a: 'an oasis', w: ['an estuary', 'a glacier', 'a lagoon'] },
      { lv: 3, q: 'India, Italy and Korea are each mostly a…', a: 'peninsula', w: ['island', 'lake', 'plateau'], why: 'Each sticks out into the sea with water on three sides.' },
    ]) },
  { id: 'island-nations', title: 'Island countries', glyph: '🗾', band: '6-7',
    hook: 'You cannot drive to Japan or to Iceland. You have to sail or fly.',
    idea: ['Some countries are made only of islands: <b>Japan</b>, <b>Iceland</b>, <b>New Zealand</b>, <b>Sri Lanka</b>, <b>Madagascar</b>.', 'Some islands are shared: the island of Ireland has two countries on it.', 'Island people have always been sailors, fishers and traders.'],
    why: 'Being an island shapes a country’s food, its weather and how it meets the rest of the world.',
    gen: islandQ },
];
