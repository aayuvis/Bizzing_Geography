/* River Delta — rivers from source to sea, great rivers, high mountains and
   deserts. Ages 8–11. */
import { mc, bank } from './kit.js';
import { pick } from '../rand.js';

export const WORLD = { id: 'rivers', name: 'River Delta', short: 'Rivers', glyph: '🏞️', band: '8-10', ink: '#1E6E5C', tint: '#DDF2EC',
  blurb: 'A river from its source to the sea, the world’s great rivers and the cities on them, the highest mountains and the driest deserts.' };

const PARTS = [
  ['source', 'where a river begins'],
  ['mouth', 'where a river flows into the sea or a lake'],
  ['tributary', 'a smaller river that joins a bigger one'],
  ['confluence', 'the place where two rivers meet'],
  ['meander', 'a big bend in a river'],
  ['oxbow lake', 'a curved lake left behind when a meander is cut off'],
  ['delta', 'a fan of land and channels where a river drops its mud at the sea'],
  ['floodplain', 'flat land beside a river that floods when the river is high'],
  ['estuary', 'the wide mouth of a river where fresh water meets the tide'],
];

/* Cities and the rivers they stand on — each one on any atlas. */
const CITIES = [
  ['Cairo', 'Nile', 'Egypt'], ['London', 'Thames', 'England'], ['Paris', 'Seine', 'France'], ['Vienna', 'Danube', 'Austria'],
  ['Budapest', 'Danube', 'Hungary'], ['Varanasi', 'Ganga', 'India'], ['Agra', 'Yamuna', 'India'], ['New York', 'Hudson', 'the United States'],
  ['Rome', 'Tiber', 'Italy'], ['Shanghai', 'Yangtze', 'China'], ['New Orleans', 'Mississippi', 'the United States'], ['Bangkok', 'Chao Phraya', 'Thailand'],
  ['Baghdad', 'Tigris', 'Iraq'], ['Khartoum', 'Nile', 'Sudan'], ['Kolkata', 'Hooghly', 'India'], ['Manaus', 'Amazon', 'Brazil'],
  ['Cologne', 'Rhine', 'Germany'], ['Lisbon', 'Tagus', 'Portugal'], ['Montreal', 'St. Lawrence', 'Canada'], ['Phnom Penh', 'Mekong', 'Cambodia'],
];
const RIVERS = [...new Set(CITIES.map((c) => c[1]))];

/* The highest mountain on each continent (the "Seven Summits" list, without
   Oceania, where books disagree on which peak counts). */
const PEAKS = [['Asia', 'Mount Everest'], ['South America', 'Aconcagua'], ['North America', 'Denali'], ['Africa', 'Kilimanjaro'], ['Europe', 'Mount Elbrus'], ['Antarctica', 'Mount Vinson']];
const DESERTS = [['Sahara', 'Africa'], ['Gobi', 'Asia'], ['Thar', 'Asia'], ['Atacama', 'South America'], ['Kalahari', 'Africa'], ['Great Victoria', 'Oceania'], ['Mojave', 'North America'], ['Arabian', 'Asia']];

export const STOPS = [
  { id: 'river-parts', title: 'A river from source to sea', glyph: '〰️', band: '8-10',
    hook: 'Every river starts small — a spring, a melting glacier, a boggy hillside — and grows as it goes.',
    idea: ['A river begins at its <b>source</b> and ends at its <b>mouth</b>. Smaller rivers that join it are <b>tributaries</b>.', 'On flat land it swings in bends called <b>meanders</b>. Cut one off and you get an <b>oxbow lake</b>.', 'At the sea it may spread into a <b>delta</b> — the Ganga and the Brahmaputra make the largest delta on Earth, in India and Bangladesh.'],
    why: 'Rivers carved valleys, fed farms and carried trade long before roads.',
    src: ['Encyclopaedia Britannica — “Ganges-Brahmaputra delta”'],
    gen: (r, lv) => {
      const [w, d] = pick(lv === 1 ? PARTS.slice(0, 5) : PARTS, r);
      return r() < 0.5 ? mc(r, `What do we call ${d}?`, w, PARTS.map((p) => p[0]), `That is the ${w}.`)
        : mc(r, `What is a river’s ${w}?`, d, PARTS.map((p) => p[1]), `The ${w} is ${d}.`);
    } },
  { id: 'great-rivers', title: 'Great rivers and their cities', glyph: '🚢', band: '8-10',
    hook: 'Cairo, Khartoum and the pyramids all stand beside one river: the Nile.',
    idea: ['The <b>Nile</b> in Africa and the <b>Amazon</b> in South America are the two longest rivers. The Amazon carries by far the most water.', 'The <b>Yangtze</b> is the longest river in Asia. The <b>Ganga</b> flows across northern India to the Bay of Bengal.', 'The <b>Danube</b> flows through more countries than any other river in the world.', 'Great cities grew on rivers for water, food, and boats to trade.'],
    why: 'Find the river and you have found the reason a city is where it is.',
    src: ['Encyclopaedia Britannica — “Nile River”, “Amazon River”, “Yangtze River”, “Danube River”'],
    gen: (r, lv) => {
      const [city, river, country] = pick(lv === 1 ? CITIES.slice(0, 8) : CITIES, r);
      if (lv >= 2 && r() < 0.4) {
        const others = CITIES.filter((c) => c[1] !== river).map((c) => c[0]);
        return mc(r, `Which city stands on the ${river}?`, city, others, `${city}, in ${country}, is on the ${river}.`);
      }
      return mc(r, `Which river flows through ${city}, in ${country}?`, river, RIVERS, `${city} stands on the ${river}.`);
    } },
  { id: 'high-mountains', title: 'The highest mountains', glyph: '🏔️', band: '8-10',
    hook: 'Some climbers try to stand on the highest point of every continent.',
    idea: ['The highest mountain on Earth is <b>Mount Everest</b>, in the Himalaya between Nepal and China.', ...PEAKS.slice(1).map(([c, p]) => `Highest in ${c}: <b>${p}</b>.`), 'The <b>Himalaya</b> and the <b>Andes</b> are the great mountain ranges of Asia and South America; the <b>Alps</b> and the <b>Rockies</b> are in Europe and North America.'],
    why: 'Mountains make their own weather, hold glaciers that feed rivers, and divide countries.',
    src: ['Encyclopaedia Britannica — “Seven Summits”'],
    gen: (r, lv) => {
      const [c, p] = pick(lv === 1 ? PEAKS.slice(0, 4) : PEAKS, r);
      if (r() < 0.5) return mc(r, `What is the highest mountain in ${c}?`, p, PEAKS.map((x) => x[1]), `${p} is the highest in ${c}.`);
      return mc(r, `On which continent is ${p}?`, c, PEAKS.map((x) => x[0]).concat(['Oceania']), `${p} is in ${c}.`);
    } },
  { id: 'deserts', title: 'Deserts of the world', glyph: '🏜️', band: '8-10',
    hook: 'The biggest desert on Earth is not hot at all. It is Antarctica.',
    idea: ['A <b>desert</b> is a place with very little rain or snow — not a place that is hot.', 'So the largest desert is <b>Antarctica</b>. The largest <b>hot</b> desert is the <b>Sahara</b> in Africa.', 'The <b>Atacama</b> in Chile is one of the driest places on Earth; the <b>Thar</b> stretches across India and Pakistan; the <b>Gobi</b> across Mongolia and China.'],
    why: 'Deserts cover about a third of the land, and people have learned to live in almost all of them.',
    src: ['Encyclopaedia Britannica — “Desert”', 'US Geological Survey — “Deserts: Geology and Resources”'],
    gen: (r, lv) => {
      if (r() < 0.25) return mc(r, 'Which is the largest desert on Earth, counting cold deserts too?', 'Antarctica', ['Sahara', 'Gobi', 'Thar', 'Arabian'], 'A desert means very little rain or snow — and Antarctica gets almost none.');
      const [d, c] = pick(lv === 1 ? DESERTS.slice(0, 4) : DESERTS, r);
      return mc(r, `On which continent is the ${d} Desert?`, c, ['Africa', 'Asia', 'South America', 'North America', 'Oceania', 'Europe'], `The ${d} is in ${c}.`);
    } },
];
