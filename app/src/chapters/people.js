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
      { lv: 1, q: 'Land in the countryside, away from towns and cities, is called…', a: 'rural', w: ['urban', 'coastal', 'suburban'] },
      { lv: 1, q: 'The areas of homes around the edge of a city are called…', a: 'suburbs', w: ['hamlets', 'harbours', 'deltas'] },
      { lv: 1, q: 'People who move from place to place with their animals, with no fixed home, are…', a: 'nomads', w: ['commuters', 'townspeople', 'miners'] },
      { lv: 1, q: 'A sheltered place on a coast where ships can stop safely is…', a: 'a harbour', w: ['a hamlet', 'a plateau', 'a suburb'] },
      { lv: 1, tf: false, q: 'Every city in the world grew up beside the sea.', why: 'Many grew by rivers, at crossroads or on hills, far inland.' },
      { lv: 1, q: 'Which are you more likely to find in a city than in a hamlet?', a: 'a large hospital', w: ['a farmhouse', 'a field of sheep', 'a single quiet lane'], why: 'Bigger settlements have more services.' },
      { lv: 1, tf: true, q: 'A capital city is usually where a country’s government meets.' },
      { lv: 2, q: 'The busy middle of a city, full of shops and offices, is called the…', a: 'central business district', w: ['suburbs', 'outskirts', 'green belt'] },
      { lv: 2, q: 'Someone who travels into a city to work each day and home again is a…', a: 'commuter', w: ['nomad', 'pilgrim', 'settler'] },
      { lv: 2, q: 'A city spreading out over the countryside around it is called…', a: 'urban sprawl', w: ['erosion', 'irrigation', 'migration'] },
      { lv: 2, q: 'Which is a “pull” that draws people to move to a city?', a: 'more jobs and schools', w: ['crowded streets', 'high rents', 'traffic jams'] },
      { lv: 2, q: 'Why did many ports grow where a river reaches the sea?', a: 'goods could move between river boats and sea ships', w: ['the water there is always fresh', 'there are never storms there', 'ships cannot sail on rivers at all'] },
      { lv: 2, tf: false, q: 'A village usually has more shops and services than a city.', why: 'The bigger the settlement, the more services it has.' },
      { lv: 2, tf: true, q: 'Today more than half of all people live in towns and cities.' },
      { lv: 2, q: 'A place where a road crosses a river often grew into…', a: 'a market town', w: ['a desert', 'a glacier', 'an island'] },
      { lv: 3, q: 'People moving from the countryside into cities is called…', a: 'urbanisation', w: ['evaporation', 'erosion', 'irrigation'] },
      { lv: 3, q: 'Houses strung out in a long line along a road or river make a… settlement.', a: 'linear', w: ['nucleated', 'dispersed', 'circular'] },
      { lv: 3, q: 'Homes built close together around a centre, such as a well or a crossroads, make a… settlement.', a: 'nucleated', w: ['linear', 'dispersed', 'scattered'] },
      { lv: 3, q: 'Cities that grow until they join into one huge built-up area make a…', a: 'conurbation', w: ['hamlet', 'plateau', 'suburb'] },
      { lv: 3, q: 'The ground a settlement is built on — its water, slope and soil — is called its…', a: 'site', w: ['situation', 'climate', 'population'] },
      { lv: 3, tf: true, q: 'Many fast-growing cities have informal settlements, built without planning or official services.' },
      { lv: 3, tf: false, q: 'A megacity is any city with more than one million people.', why: 'A megacity usually means more than ten million.' },
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
      { lv: 1, q: 'Solar panels turn what into electricity?', a: 'sunlight', w: ['wind', 'coal', 'rain'] },
      { lv: 1, q: 'What turns a wind turbine to make electricity?', a: 'moving air', w: ['burning coal', 'sunlight', 'hot rocks'] },
      { lv: 1, q: 'Reusing, mending and recycling things helps because…', a: 'fewer new resources are used up', w: ['things get heavier', 'it makes more coal', 'it uses more oil'] },
      { lv: 1, q: 'Which resource comes from a forest?', a: 'timber', w: ['iron ore', 'natural gas', 'salt'] },
      { lv: 1, q: 'Apart from water and sunlight, what do farmers need most to grow crops?', a: 'fertile soil', w: ['coal', 'natural gas', 'iron ore'] },
      { lv: 1, tf: true, q: 'Paper, glass and many metals can be recycled.' },
      { lv: 1, tf: false, q: 'A wind turbine releases lots of carbon dioxide as it turns.', why: 'It burns no fuel, so it releases none while it runs.' },
      { lv: 1, q: 'Coal, metal ores and gems are dug out of the ground in…', a: 'mines', w: ['dams', 'farms', 'forests'] },
      { lv: 2, q: 'Rock with enough metal in it to be worth digging out is called…', a: 'ore', w: ['fossil', 'lava', 'soil'] },
      { lv: 2, q: 'Cutting down forests faster than they can regrow is called…', a: 'deforestation', w: ['irrigation', 'urbanisation', 'evaporation'] },
      { lv: 2, q: 'Catching fish faster than they can breed to replace themselves is called…', a: 'overfishing', w: ['fish farming', 'deforestation', 'recycling'] },
      { lv: 2, tf: true, q: 'Solar and wind power stop when the sun sets or the wind drops, so they need storage or backup.' },
      { lv: 2, q: 'Bringing water to fields through channels or pipes is called…', a: 'irrigation', w: ['erosion', 'evaporation', 'deforestation'] },
      { lv: 2, q: 'Coal, oil and gas are called fossil fuels because they formed from…', a: 'plants and animals that lived long ago', w: ['volcano ash', 'sea salt', 'melted ice'] },
      { lv: 2, q: 'Burning fossil fuels releases a gas that warms the climate. Which?', a: 'carbon dioxide', w: ['oxygen', 'nitrogen', 'helium'] },
      { lv: 2, tf: true, q: 'A forest can be a renewable resource if new trees are planted as old ones are cut.' },
      { lv: 3, q: 'Electricity from a river’s flowing water is called…', a: 'hydroelectric power', w: ['solar power', 'geothermal power', 'nuclear power'] },
      { lv: 3, q: 'Heat from inside the Earth used for power is called…', a: 'geothermal energy', w: ['hydroelectric energy', 'tidal energy', 'wind energy'] },
      { lv: 3, q: 'Using resources so that enough is left for people in the future is called…', a: 'sustainability', w: ['urbanisation', 'industrialisation', 'deforestation'] },
      { lv: 3, q: 'Power made from the rise and fall of the sea is…', a: 'tidal energy', w: ['geothermal energy', 'solar energy', 'nuclear energy'] },
      { lv: 3, tf: false, q: 'Nuclear power stations burn coal to make their heat.', why: 'They split atoms of uranium — a metal that is mined, and will run out.' },
      { lv: 3, tf: false, q: 'Burning wood releases no carbon dioxide.', why: 'Burning wood, like burning coal or oil, releases carbon dioxide.' },
      { lv: 3, q: 'Most plastic is made from…', a: 'oil and natural gas', w: ['sand', 'wood', 'iron ore'] },
      { lv: 3, tf: true, q: 'Trees take carbon dioxide out of the air as they grow.' },
    ]) },
];
