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

export const STOPS = [
  { id: 'weather-climate', title: 'Weather or climate?', glyph: '🌡️', band: '8-10',
    hook: 'It might rain today in the desert. That is weather. It hardly ever rains there. That is climate.',
    idea: ['<b>Weather</b> is what the air is doing today: sun, rain, wind, heat, cold.', '<b>Climate</b> is the usual weather of a place over many years.', 'A saying: climate is what you expect; weather is what you get.'],
    why: 'Climate decides what grows, what people build and what they wear.',
    gen: bank([
      { lv: 1, q: '“It is raining in our town today.” Is that weather or climate?', a: 'weather', w: ['climate'] },
      { lv: 1, q: '“Summers here are usually hot and dry.” Is that weather or climate?', a: 'climate', w: ['weather'] },
      { lv: 1, q: 'Which tool measures how hot or cold the air is?', a: 'thermometer', w: ['rain gauge', 'wind vane', 'compass'] },
      { lv: 2, q: 'Which tool shows which way the wind is blowing?', a: 'wind vane', w: ['thermometer', 'rain gauge', 'ruler'] },
      { lv: 2, q: 'Which tool measures how much rain has fallen?', a: 'rain gauge', w: ['thermometer', 'wind vane', 'barometer'] },
      { lv: 2, q: 'A wind called a westerly blows…', a: 'from the west', w: ['towards the west', 'only at night', 'from the sea'], why: 'Winds are named for where they come from.' },
      { lv: 3, q: 'Climate is the weather of a place…', a: 'averaged over many years', w: ['this afternoon', 'on one day each year', 'only in summer'] },
      { lv: 3, q: 'Places near the equator are usually…', a: 'hot all year', w: ['cold all year', 'snowy in winter', 'dry and cold'] },
    ]) },
  { id: 'water-cycle', title: 'The water cycle', glyph: '💧', band: '8-10',
    hook: 'The water in your glass may once have been rain in a rainforest, or ice at the South Pole.',
    idea: ['The Sun warms water in seas and lakes and it rises as vapour: <b>evaporation</b>.', 'High up, the vapour cools and forms clouds of tiny droplets: <b>condensation</b>.', 'The droplets join and fall as rain, snow or hail: <b>precipitation</b>. It runs back to rivers and the sea: <b>collection</b>. And round again.', `<span class="fig-c">${waterCycle()}</span>`],
    why: 'It is how fresh water reaches every river, field and tap.',
    src: ['US Geological Survey — “The Water Cycle”'],
    gen: bank([
      { lv: 1, q: 'Water warmed by the Sun rising into the air is called…', a: 'evaporation', w: ['precipitation', 'condensation', 'collection'] },
      { lv: 1, q: 'Rain, snow and hail are all kinds of…', a: 'precipitation', w: ['evaporation', 'condensation', 'erosion'] },
      { lv: 2, q: 'Water vapour cooling into cloud droplets is called…', a: 'condensation', w: ['evaporation', 'precipitation', 'irrigation'] },
      { lv: 2, q: 'What gives the water cycle its energy?', a: 'the Sun', w: ['the Moon', 'the wind', 'the sea'] },
      { lv: 2, tf: true, q: 'The same water goes round the cycle again and again.' },
      { lv: 3, q: 'Water on the ground flowing into rivers and the sea is part of…', a: 'collection', w: ['condensation', 'evaporation', 'precipitation'] },
      { lv: 3, q: 'Why do clouds form high up?', a: 'the air there is cooler', w: ['the air there is hotter', 'the Sun is closer', 'there is less water'] },
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
      { lv: 2, q: 'The zones with four clear seasons are called…', a: 'temperate', w: ['tropical', 'polar', 'equatorial'] },
      { lv: 2, q: 'Why is it cold near the poles?', a: 'the Sun’s light arrives at a low slant', w: ['the poles are farther from the Sun', 'there is no air there', 'the poles are high mountains'] },
      { lv: 3, q: 'Mountains near the equator can still have snow on top because…', a: 'air gets colder the higher you go', w: ['the Sun never reaches them', 'they are near the poles', 'snow falls up'] },
    ]) },
  { id: 'biomes', title: 'Biomes', glyph: '🌴', band: '8-10',
    hook: 'A rainforest and a desert can be at the same distance from the equator. Rain makes the difference.',
    idea: ['A <b>biome</b> is a big area with its own climate, plants and animals.', ...BIOMES.map(([n, d, e]) => `<b>${n[0].toUpperCase() + n.slice(1)}</b>: ${d} — like ${e}.`)],
    why: 'Biomes tell you what a place looks like before you get there — the best clue in GeoGuesser.',
    gen: (r, lv) => {
      const [n, d, e] = pick(lv === 1 ? BIOMES.slice(0, 4) : BIOMES, r);
      if (lv >= 2 && r() < 0.5) return mc(r, `Which biome is ${e}?`, n, BIOMES.map((b) => b[0]), `${e[0].toUpperCase() + e.slice(1)} is ${n}: ${d}.`);
      return mc(r, `Which biome is ${d}?`, n, BIOMES.map((b) => b[0]), `That is the ${n}.`);
    } },
];
