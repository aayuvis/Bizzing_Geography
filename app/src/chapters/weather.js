/* Weather Ridge — weather and climate, the water cycle, seasons and biomes.
   Ages 8–10. */
import { mc, bank, mix, FAMOUS } from './kit.js';
import { pick } from '../rand.js';
import { QUIZ, capOf } from '../geo.js';
import { waterCycle } from '../figs.js';

export const WORLD = { id: 'weather', name: 'Weather Ridge', short: 'Weather', glyph: '🌦️', band: '8-10', ink: '#3E5BA9', tint: '#E4E9F8',
  blurb: 'Weather and climate, the water cycle, why we have seasons, and the great living zones of the Earth.' };

/* Seasons from the capital's own latitude. Only places clearly outside the
   tropics are asked (|lat| ≥ 30°), where four seasons are what people feel;
   near the equator the year is wet and dry, not summer and winter. */
function seasonQ(r, lv) {
  const pool = QUIZ.filter((c) => c.capAt[0] && Math.abs(c.capAt[0][0]) >= 30 && (lv >= 2 || FAMOUS.has(c.cc)));
  const c = pick(pool, r), north = c.capAt[0][0] > 0, jan = r() < 0.5;
  const ans = (north === jan) ? 'winter' : 'summer';
  return mc(r, `It is ${jan ? 'January' : 'July'}. What season is it in ${capOf(c)}, ${c.name}?`, ans, ['summer', 'winter', 'spring', 'autumn'],
    `${capOf(c)} is in the ${north ? 'northern' : 'southern'} hemisphere. In ${jan ? 'January' : 'July'} the ${ans === 'summer' ? 'Sun is high there and days are long' : 'Sun is low there and days are short'} — it is ${ans}.`);
}

const BIOMES = [
  ['tropical rainforest', 'hot and wet all year, with the most kinds of living things', 'the Amazon in Brazil'],
  ['desert', 'very little rain; can be hot or cold', 'the Sahara in Africa'],
  ['savanna', 'warm grassland with a few scattered trees and a wet and a dry season', 'the Serengeti in Tanzania'],
  ['tundra', 'cold and treeless, with frozen ground below the surface', 'northern Canada'],
  ['taiga', 'huge forests of cone-bearing trees with long, cold winters', 'Siberia in Russia'],
  ['temperate forest', 'trees that drop their leaves in autumn, four clear seasons', 'much of Europe'],
  ['grassland', 'wide grassy plains with hot summers and cold winters', 'the steppe of Mongolia'],
];

/* A biome from its description (and, from level 2, from a place that has it). Every
   question the level allows is made, then one the round has not used is picked. */
function biomeQ(r, lv, seen) {
  const all = (lv === 1 ? BIOMES.slice(0, 4) : BIOMES).flatMap(([n, d, e]) => [
    mc(r, `Which biome is ${d}?`, n, BIOMES.map((b) => b[0]), `That is the ${n}.`),
    ...(lv >= 2 ? [mc(r, `Which biome is ${e}?`, n, BIOMES.map((b) => b[0]), `${e[0].toUpperCase() + e.slice(1)} is ${n}: ${d}.`)] : []),
  ]);
  const fresh = all.filter((q) => !seen || seen.fits(q));
  return pick(fresh.length ? fresh : all, r);
}

export const STOPS = [
  { id: 'weather-climate', title: 'Weather or climate?', glyph: '🌡️', band: '8-10',
    hook: 'It might rain today in the desert. That is weather. It hardly ever rains there. That is climate.',
    idea: ['<b>Weather</b> is what the air is doing today: sun, rain, wind, heat, cold.', '<b>Climate</b> is the usual weather of a place over many years.', 'A saying: climate is what you expect; weather is what you get.'],
    why: 'Climate decides what grows, what people build and what they wear.',
    gen: bank([
      { lv: 1, q: '“It is raining in our town today.” Is that weather or climate?', a: 'weather', w: ['climate'] },
      { lv: 1, q: '“Summers here are usually hot and dry.” That sentence is about the place’s…', a: 'climate', w: ['weather'] },
      { lv: 1, q: 'Which tool measures how hot or cold the air is?', a: 'thermometer', w: ['rain gauge', 'wind vane', 'compass'] },
      { lv: 1, q: 'A weather forecast tells you…', a: 'what the weather will probably be soon', w: ['what the weather was last year', 'how old the Earth is', 'where the rivers flow'] },
      { lv: 1, tf: false, q: 'A place’s climate can change from one hour to the next.', why: 'Weather changes by the hour; climate is the pattern over many years.' },
      { lv: 1, q: 'Which of these is a kind of weather?', a: 'a thunderstorm', w: ['a mountain', 'a river', 'a valley'] },
      { lv: 1, q: 'What is wind?', a: 'moving air', w: ['moving water', 'falling snow', 'sunlight'] },
      { lv: 1, q: 'After a flash of lightning, you hear…', a: 'thunder', w: ['hail', 'an echo of rain', 'a rainbow'] },
      { lv: 1, tf: true, q: 'A rainbow can appear when sunlight shines through raindrops.', why: 'Each drop bends the light and splits it into colours.' },
      { lv: 1, q: 'People who live in a very cold climate usually own…', a: 'warm coats and boots', w: ['only sandals and shorts', 'only swimsuits', 'only sun hats'] },
      { lv: 2, q: 'Which tool shows which way the wind is blowing?', a: 'wind vane', w: ['thermometer', 'rain gauge', 'ruler'] },
      { lv: 2, q: 'Which tool measures how much rain has fallen?', a: 'rain gauge', w: ['thermometer', 'wind vane', 'barometer'] },
      { lv: 2, q: 'Which tool measures air pressure?', a: 'barometer', w: ['thermometer', 'rain gauge', 'wind vane'] },
      { lv: 2, q: 'A scientist who studies and forecasts the weather is called a…', a: 'meteorologist', w: ['geologist', 'astronomer', 'mapmaker'] },
      { lv: 2, q: 'Fog is…', a: 'a cloud at ground level', w: ['smoke from fires', 'frozen rain', 'dust from a desert'] },
      { lv: 2, q: 'Balls of ice that fall from a storm cloud are called…', a: 'hail', w: ['fog', 'dew', 'mist'] },
      { lv: 2, tf: true, q: 'Places by the sea usually have milder winters than places far inland.', why: 'The sea warms up and cools down slowly, so it keeps the coast from getting very cold.' },
      { lv: 2, q: 'A wind called a westerly blows…', a: 'from the west', w: ['towards the west', 'only at night', 'from the sea'], why: 'Winds are named for where they come from.' },
      { lv: 3, q: 'Climate is the weather of a place…', a: 'averaged over many years', w: ['this afternoon', 'on one day each year', 'only in summer'] },
      { lv: 3, q: 'Places near the equator are usually…', a: 'hot all year', w: ['cold all year', 'snowy in winter', 'dry and cold'] },
      { lv: 3, q: 'On a sunny afternoon a cool breeze blows from the sea onto the land. Why?', a: 'the land heats up faster than the sea', w: ['the sea is hotter than the land', 'the Moon pulls the air', 'fish stir up the water'], why: 'Air over the hot land rises, and cooler air from over the sea moves in to take its place.' },
      { lv: 3, q: 'Wind blows from places of high air pressure towards places of…', a: 'low air pressure', w: ['even higher air pressure', 'no air at all', 'deep water'] },
      { lv: 3, tf: false, q: 'Every part of a big country has the same climate.', why: 'A big country can have mountains, coasts, deserts and forests — each with its own climate.' },
    ]) },
  { id: 'water-cycle', title: 'The water cycle', glyph: '💧', band: '8-10',
    hook: 'The water in your glass may once have been rain in a rainforest, or ice at the South Pole.',
    idea: ['The Sun warms water in seas and lakes and it rises as vapour: <b>evaporation</b>.', 'High up, the vapour cools and forms clouds of tiny droplets: <b>condensation</b>.', 'The droplets join and fall as rain, snow or hail: <b>precipitation</b>. It runs back to rivers and the sea: <b>collection</b>. And round again.', `<span class="fig-c">${waterCycle()}</span>`],
    why: 'It is how fresh water reaches every river, field and tap.',
    src: ['US Geological Survey — “The Water Cycle”'],
    gen: bank([
      { lv: 1, q: 'Water warmed by the Sun rising into the air is called…', a: 'evaporation', w: ['precipitation', 'condensation', 'collection'] },
      { lv: 1, q: 'Rain, snow and hail are all kinds of…', a: 'precipitation', w: ['evaporation', 'condensation', 'erosion'] },
      { lv: 1, q: 'Water vapour is water in which form?', a: 'a gas', w: ['a solid', 'a liquid', 'a powder'] },
      { lv: 1, tf: false, q: 'Clouds are made of smoke.', why: 'Clouds are made of tiny drops of water or bits of ice.' },
      { lv: 1, q: 'Most of the water on Earth is in…', a: 'the oceans', w: ['rivers', 'clouds', 'lakes'] },
      { lv: 1, q: 'If the air is freezing cold all the way down from a cloud, what falls?', a: 'snow', w: ['rain', 'dew', 'fog'] },
      { lv: 1, q: 'Drops of water on cold grass early in the morning are called…', a: 'dew', w: ['hail', 'sleet', 'fog'] },
      { lv: 1, q: 'Where does rain fall from?', a: 'clouds', w: ['the Sun', 'the ground', 'the wind'] },
      { lv: 1, tf: true, q: 'Snow melting on mountains can flow down into rivers.', why: 'Melted snow is one way water gets back to rivers and the sea.' },
      { lv: 1, q: 'Ice turning into liquid water is called…', a: 'melting', w: ['freezing', 'boiling', 'evaporating'] },
      { lv: 2, q: 'Water vapour cooling into cloud droplets is called…', a: 'condensation', w: ['evaporation', 'precipitation', 'irrigation'] },
      { lv: 2, q: 'What gives the water cycle its energy?', a: 'the Sun', w: ['the Moon', 'the wind', 'the sea'] },
      { lv: 2, tf: true, q: 'The same water goes round the cycle again and again.' },
      { lv: 2, tf: true, q: 'Rain is fresh water, even when it evaporated from the salty sea.', why: 'Only the water rises as vapour; the salt stays behind in the sea.' },
      { lv: 2, q: 'Plants give water vapour to the air mostly through their…', a: 'leaves', w: ['roots', 'seeds', 'bark'] },
      { lv: 3, q: 'Water on the ground flowing into rivers and the sea is part of…', a: 'collection', w: ['condensation', 'evaporation', 'precipitation'] },
      { lv: 3, q: 'Why do clouds form high up?', a: 'the air there is cooler', w: ['the air there is hotter', 'the Sun is closer', 'there is less water'] },
      { lv: 3, q: 'Rain that soaks into the ground and is stored in rocks below is called…', a: 'groundwater', w: ['sea water', 'water vapour', 'a glacier'] },
      { lv: 3, q: 'Which kind of cloud brings thunderstorms?', a: 'cumulonimbus', w: ['cirrus', 'stratus', 'contrail'] },
      { lv: 3, q: 'Compared with cold air, warm air can hold…', a: 'more water vapour', w: ['less water vapour', 'no water vapour', 'only salt'] },
      { lv: 3, tf: false, q: 'Hail falls only in winter.', why: 'Hail grows inside tall thunderclouds, which are common on hot summer days.' },
    ]) },
  { id: 'seasons', title: 'Why we have seasons', glyph: '🍂', band: '8-10',
    hook: 'When it is summer in India, it is winter in Australia. Same Sun, same day.',
    idea: ['The Earth is <b>tilted</b> — about 23½° — as it goes round the Sun.', 'For half the year the northern half leans towards the Sun: long days and high Sun, so <b>summer</b> in the north. For the other half, the southern half leans in.', 'So the seasons in the two halves are <b>opposite</b>. Near the equator it stays warm all year, and many places have a wet season and a dry season instead.'],
    why: 'It is not about being closer to the Sun — it is about the tilt.',
    src: ['NASA Space Place — “What causes the seasons?”'],
    gen: mix(seasonQ, bank([
      { lv: 1, q: 'Why does Earth have seasons?', a: 'it is tilted as it goes round the Sun', w: ['it gets much closer to the Sun in summer', 'the Moon blocks the Sun in winter', 'the Sun gets hotter and colder'] },
      { lv: 2, tf: true, q: 'When it is summer in the northern half of Earth, it is winter in the southern half.' },
      { lv: 3, q: 'Many places near the equator have, instead of four seasons…', a: 'a wet season and a dry season', w: ['one long winter', 'two summers and two winters', 'no weather at all'] },
    ])) },
  { id: 'climate-zones', title: 'Climate zones', glyph: '🌐', band: '8-10',
    hook: 'Walk from the equator to the pole and you would pass through every kind of climate on Earth.',
    idea: ['Near the equator the Sun is high all year: the <b>tropical</b> zone, hot and often wet.', 'Around the poles the Sun is always low: the <b>polar</b> zones, cold all year.', 'In between are the <b>temperate</b> zones, with four seasons. <b>Dry</b> climates — deserts — are found where little rain falls.'],
    why: 'Zones explain why bananas grow in Kerala and not in Norway.',
    gen: bank([
      { lv: 1, q: 'The hottest zone, around the equator, is called…', a: 'tropical', w: ['polar', 'temperate', 'arctic'] },
      { lv: 1, q: 'The coldest zones, around the poles, are called…', a: 'polar', w: ['tropical', 'temperate', 'dry'] },
      { lv: 1, q: 'What is a climate zone?', a: 'a wide belt of Earth with a similar climate', w: ['the weather in one town today', 'a country’s border', 'a time zone'] },
      { lv: 1, q: 'Moving from the equator towards a pole, the climate usually gets…', a: 'colder', w: ['hotter', 'the same all the way', 'wetter every step'] },
      { lv: 1, q: 'In a polar zone, what covers much of the land and sea for most of the year?', a: 'ice and snow', w: ['sand', 'rainforest', 'grass'] },
      { lv: 1, q: 'Bananas and coconuts grow best in which zone?', a: 'tropical', w: ['polar', 'temperate', 'arctic'] },
      { lv: 1, q: 'A dry climate, with very little rain, is found in…', a: 'deserts', w: ['rainforests', 'swamps', 'lakes'] },
      { lv: 1, q: 'Which animal has thick fur to live in a polar climate?', a: 'an Arctic fox', w: ['a parrot', 'a gecko', 'a flamingo'] },
      { lv: 1, tf: false, q: 'The temperate zones are hot all year round.', why: 'Temperate zones have warm summers and cool or cold winters.' },
      { lv: 1, tf: true, q: 'There are two temperate zones: one north of the tropics and one south.', why: 'Each half of the Earth has its own temperate zone between the tropics and the polar zone.' },
      { lv: 2, q: 'The zones with four clear seasons are called…', a: 'temperate', w: ['tropical', 'polar', 'equatorial'] },
      { lv: 2, q: 'Why is it cold near the poles?', a: 'the Sun’s light arrives at a low slant', w: ['the poles are farther from the Sun', 'there is no air there', 'the poles are high mountains'] },
      { lv: 2, q: 'The tropical zone lies between…', a: 'the Tropic of Cancer and the Tropic of Capricorn', w: ['the Arctic and Antarctic Circles', 'the equator and the North Pole', 'the Prime Meridian and the equator'] },
      { lv: 2, q: 'Which line marks the edge of the northern polar zone?', a: 'the Arctic Circle', w: ['the Tropic of Cancer', 'the equator', 'the Prime Meridian'] },
      { lv: 2, q: 'In the polar zones in summer, the Sun can…', a: 'stay up all day and all night', w: ['never rise at all', 'rise twice a day', 'stand straight overhead'] },
      { lv: 2, tf: true, q: 'The Sun can be straight overhead at midday only in the tropics.', why: 'Outside the tropics, the midday Sun is always at a slant.' },
      { lv: 3, q: 'The side of a mountain range away from the wet wind often gets little rain. This dry area is called a…', a: 'rain shadow', w: ['monsoon', 'delta', 'oasis'] },
      { lv: 3, q: 'A monsoon climate has…', a: 'a season of very heavy rain when the winds change', w: ['snow all year', 'no wind at all', 'the same rain every day of the year'] },
      { lv: 3, tf: false, q: 'Climate zones depend only on how far a place is from the equator.', why: 'Height, the sea, winds and mountains change a place’s climate too.' },
      { lv: 3, q: 'Mountains near the equator can still have snow on top because…', a: 'air gets colder the higher you go', w: ['the Sun never reaches them', 'they are near the poles', 'snow falls up'] },
    ]) },
  { id: 'biomes', title: 'Biomes', glyph: '🌴', band: '8-10',
    hook: 'A rainforest and a desert can be at the same distance from the equator. Rain makes the difference.',
    idea: ['A <b>biome</b> is a big area with its own climate, plants and animals.', ...BIOMES.map(([n, d, e]) => `<b>${n[0].toUpperCase() + n.slice(1)}</b>: ${d} — like ${e}.`)],
    why: 'Biomes tell you what a place looks like before you get there — the best clue in Where on Earth?',
    gen: mix(biomeQ, bank([
      { lv: 1, q: 'A biome is…', a: 'a big area with its own climate, plants and animals', w: ['one kind of animal', 'a single tree', 'a type of rock'] },
      { lv: 1, q: 'Which animal is suited to life in a hot desert?', a: 'a camel', w: ['a polar bear', 'a penguin', 'a walrus'] },
      { lv: 1, q: 'How can a cactus live where it hardly rains?', a: 'it stores water in its thick stem', w: ['it needs no sunlight', 'it drinks sea water', 'it grows only at night'] },
      { lv: 1, q: 'Which of these lives in a tropical rainforest?', a: 'a toucan', w: ['a polar bear', 'a camel', 'a reindeer'] },
      { lv: 1, q: 'Which of these lives on the tundra?', a: 'a reindeer', w: ['a parrot', 'a camel', 'a monkey'] },
      { lv: 1, q: 'Which of these grazes on the savanna?', a: 'a zebra', w: ['a penguin', 'a polar bear', 'a seal'] },
      { lv: 1, tf: false, q: 'Rainforests get very little rain.', why: 'Rainforests are among the wettest places on Earth — that is how they got their name.' },
      { lv: 1, tf: true, q: 'Many animals in cold biomes have thick fur.', why: 'Thick fur keeps the cold out.' },
      { lv: 2, q: 'The top layer of leaves high up in a rainforest is called the…', a: 'canopy', w: ['forest floor', 'roots', 'riverbank'] },
      { lv: 2, q: 'In the savanna’s dry season, many animals…', a: 'travel a long way to find water and grass', w: ['sleep under the snow', 'swim out to sea', 'stay up in the treetops'] },
      { lv: 2, tf: true, q: 'Tundra plants grow low to the ground, out of the cold wind.', why: 'Small, low plants keep warmer and are not torn by the wind.' },
      { lv: 2, tf: false, q: 'A biome stops at the border between two countries.', why: 'Biomes follow climate, not the lines people draw.' },
      { lv: 3, q: 'When a rainforest is cut down for farms, many of its animals…', a: 'lose their homes', w: ['grow bigger', 'move into the sea', 'turn into desert animals'] },
      { lv: 3, q: 'Climbing a high mountain, the plants change as if you were walking…', a: 'towards a pole', w: ['towards the equator', 'into the sea', 'underground'], why: 'It gets colder as you go up, just as it does as you go towards a pole.' },
      { lv: 3, tf: true, q: 'The same biome can be found on different continents.', why: 'Deserts, grasslands and forests each turn up on several continents.' },
    ])) },
];
