/* Crossroads City — where people live and why, size and shape of countries,
   and what the Earth gives us. Ages 11–14. Figures come from the data or name
   their source. */
import { mc, bank, FAMOUS } from './kit.js';
import { pick, shuffle } from '../rand.js';
import { QUIZ, fmtArea } from '../geo.js';

export const WORLD = { id: 'people', name: 'Crossroads City', short: 'Crossroads', glyph: '🏙️', band: '11-14', ink: '#5A5F6E', tint: '#ECEDF2',
  blurb: 'Villages, towns and megacities; the biggest countries and the ones with no coast; what the Earth gives us, and what runs out.' };

const byArea = QUIZ.slice().sort((a, b) => b.area - a.area);
function biggerQ(r, lv) {
  const pool = QUIZ.filter((c) => c.area && (lv >= 3 || FAMOUS.has(c.cc)));
  for (let t = 0; t < 100; t++) {
    const [a, b] = shuffle(pool, r).slice(0, 2);
    const ratio = Math.max(a.area, b.area) / Math.min(a.area, b.area);
    if (ratio < (lv === 1 ? 3 : 1.4)) continue;
    const win = a.area > b.area ? a : b;
    return { kind: 'mc', text: 'Which country covers more land?', ans: win.name, opts: [a.name, b.name].sort(), html: '',
      why: `${a.name}: ${fmtArea(a.area)}. ${b.name}: ${fmtArea(b.area)}.` };
  }
  return mc(r, 'Which is the largest country in the world by area?', byArea[0].name, byArea.slice(1, 8).map((c) => c.name));
}
function landlockedQ(r, lv) {
  const ll = QUIZ.filter((c) => c.landlocked && (lv >= 2 || FAMOUS.has(c.cc) || c.area > 400000));
  const c = pick(ll, r);
  const coast = QUIZ.filter((x) => !x.landlocked && x.cont === c.cont && (lv >= 3 || FAMOUS.has(x.cc)));
  return mc(r, 'Which of these countries has no coastline at all?', c.name, coast.map((x) => x.name),
    `${c.name} is landlocked: to reach the sea, its ships and trade must cross another country.`);
}

const NLL = QUIZ.filter((c) => c.landlocked).length;

export const STOPS = [
  { id: 'settlements', title: 'Villages, towns and cities', glyph: '🏘️', band: '11-14',
    hook: 'Every city started as a few houses, somewhere with water, food and a reason to stay.',
    idea: ['A <b>settlement</b> is any place people live: a <b>hamlet</b> (a few homes), a <b>village</b>, a <b>town</b>, a <b>city</b>. A city of more than ten million people is often called a <b>megacity</b>.', 'People settled near <b>fresh water</b>, on <b>flat land</b> good for farming, at <b>river crossings</b> and <b>harbours</b> for trade, and on hills that were easy to defend.', 'Today more than half of all the people on Earth live in towns and cities.'],
    why: 'Look at any city on a map and ask: why here? There is always a reason.',
    src: ['United Nations, Department of Economic and Social Affairs — World Urbanization Prospects'],
    gen: bank([
      { lv: 1, q: 'Which is the smallest kind of settlement?', a: 'a hamlet', w: ['a village', 'a town', 'a city'] },
      { lv: 1, q: 'Which is the biggest kind of settlement?', a: 'a megacity', w: ['a hamlet', 'a village', 'a town'] },
      { lv: 1, q: 'Why did early people settle beside rivers?', a: 'fresh water, fish and good farmland', w: ['rivers are always warm', 'there were no hills anywhere', 'rivers kept away all rain'] },
      { lv: 2, tf: true, q: 'Today more than half of all people live in towns and cities.' },
      { lv: 2, q: 'A place where a road crosses a river often grew into…', a: 'a market town', w: ['a desert', 'a glacier', 'an island'] },
      { lv: 3, q: 'People moving from the countryside into cities is called…', a: 'urbanisation', w: ['evaporation', 'erosion', 'irrigation'] },
      { lv: 3, q: 'A hilltop was a good place for an old town because it was…', a: 'easy to defend', w: ['easy to flood', 'always warmer', 'close to the sea bed'] },
    ]) },
  { id: 'big-countries', title: 'Big and small countries', glyph: '📏', band: '11-14',
    hook: `${byArea[0].name} is the largest country on Earth. ${byArea.at(-1).name}, the smallest, would fit inside a city park or two.`,
    idea: [`The largest countries by land: ${byArea.slice(0, 5).map((c, i) => `${i + 1}. <b>${c.name}</b>`).join(', ')}.`, `The smallest: <b>${byArea.at(-1).name}</b>, then ${byArea.at(-2).name} and ${byArea.at(-3).name}.`, 'Remember that many world maps stretch places near the poles — Greenland and Russia look even bigger than they are.'],
    why: 'Size is one clue to a country’s climate, its variety and how many neighbours it has.',
    src: ['Area figures from the app’s country data (mledoze/countries)'],
    gen: biggerQ },
  { id: 'landlocked', title: 'No coast at all', glyph: '🚫🌊', band: '11-14',
    hook: 'Nepal, Bolivia and Switzerland have no coast. Their trade must travel through a neighbour to reach the sea.',
    idea: [`<b>${NLL}</b> countries are <b>landlocked</b> — no coastline at all.`, `The biggest of them: ${QUIZ.filter((c) => c.landlocked).sort((a, b) => b.area - a.area).slice(0, 7).map((c) => c.name).join(', ')}.`],
    why: 'Being landlocked shapes a country’s trade, its friendships and its food.',
    gen: landlockedQ },
  { id: 'resources', title: 'What the Earth gives us', glyph: '♻️', band: '11-14',
    hook: 'Sunlight arrives every morning. Coal took millions of years to make — and it will not come back.',
    idea: ['<b>Renewable</b> resources come back or never run out: sunlight, wind, flowing water, forests if they are replanted.', '<b>Non-renewable</b> resources took millions of years to form and are used up: coal, oil, natural gas, metal ores.', 'Burning coal, oil and gas releases carbon dioxide, which traps heat and is warming the climate. That is why so many countries are building wind and solar power.'],
    why: 'Choosing well between the two is one of the big jobs of the century you will grow up in.',
    src: ['NASA — “Climate change: evidence”', 'US Energy Information Administration — “Renewable energy explained”'],
    gen: bank([
      { lv: 1, q: 'Which of these is renewable?', a: 'wind', w: ['coal', 'oil', 'natural gas'] },
      { lv: 1, q: 'Which of these is non-renewable?', a: 'coal', w: ['sunlight', 'wind', 'flowing water'] },
      { lv: 2, q: 'Coal, oil and gas are called fossil fuels because they formed from…', a: 'plants and animals that lived long ago', w: ['volcano ash', 'sea salt', 'melted ice'] },
      { lv: 2, q: 'Burning fossil fuels releases a gas that warms the climate. Which?', a: 'carbon dioxide', w: ['oxygen', 'nitrogen', 'helium'] },
      { lv: 2, tf: true, q: 'A forest can be a renewable resource if new trees are planted as old ones are cut.' },
      { lv: 3, q: 'Electricity from a river’s flowing water is called…', a: 'hydroelectric power', w: ['solar power', 'geothermal power', 'nuclear power'] },
      { lv: 3, q: 'Heat from inside the Earth used for power is called…', a: 'geothermal energy', w: ['hydroelectric energy', 'tidal energy', 'wind energy'] },
    ]) },
];
