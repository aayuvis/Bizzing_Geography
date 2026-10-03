/* Continent Harbour — the seven continents and five oceans. Ages 6–8. */
import { mc, mapQ, bank, mix, FAMOUS, TWO_CONTINENTS } from './kit.js';
import { pick, shuffle } from '../rand.js';
import { QUIZ, CONTINENTS, OCEANS, OCEAN_SRC, inCont, byCc, COUNTRIES } from '../geo.js';
import { worldSVG } from '../map.js';

export const WORLD = { id: 'continents', name: 'Continent Harbour', short: 'Continents', glyph: '🌍', band: '6-7', ink: '#1F5F99', tint: '#E1ECF8',
  blurb: 'Seven continents, five oceans, and which country sits on which.' };

const CONT = CONTINENTS.map((c) => c.id);
/* Counted from the data, never typed: the continent with the most countries. */
const counts = Object.fromEntries(CONT.map((c) => [c, inCont(c).length]));
export const MOST = CONT.reduce((a, b) => (counts[b] > counts[a] ? b : a));

function whichContinent(r, lv) {
  const pool = QUIZ.filter((c) => !TWO_CONTINENTS.has(c.cc) && !c.name.includes(c.cont.split(' ')[0]) && (lv >= 3 || FAMOUS.has(c.cc)) && (lv >= 2 || c.area > 250000));
  const c = pick(pool, r);
  return mc(r, `Which continent is ${c.name} in?`, c.cont, CONT, `${c.name} is in ${c.cont}.`);
}
function findContinent(r, lv) {
  const c = pick(CONT.filter((x) => x !== 'Antarctica' || lv >= 2), r);
  const ok = COUNTRIES.filter((x) => x.cont === c).map((x) => x.cc);
  if (c === 'Antarctica') ok.push('AQ');
  return mapQ(`Tap ${c} on the map.`, ok, null, `That’s ${c}.`, c);
}
/* Seven continents cannot fill a round alone, so the stop also asks for the continent a
   well-known country sits on — the same tap, the continent drawn from the country data.
   Countries on two continents, and names that carry their continent, are left out. */
function findContinentOf(r, lv) {
  const pool = QUIZ.filter((c) => !TWO_CONTINENTS.has(c.cc) && !c.name.includes(c.cont.split(' ')[0]) && (lv >= 3 || FAMOUS.has(c.cc)) && (lv >= 2 || c.area > 250000));
  const c = pick(pool, r);
  const ok = COUNTRIES.filter((x) => x.cont === c.cont).map((x) => x.cc);
  return mapQ(`${c.name} is on one continent. Tap that continent on the map.`, ok, null, `${c.name} is in ${c.cont}.`, c.cont);
}
function oceanMarked(r, lv) {
  const o = pick(lv === 1 ? OCEANS.slice(0, 3) : OCEANS, r);
  return mc(r, 'Which ocean has the red pin in it?', o.id + ' Ocean', OCEANS.map((x) => x.id + ' Ocean'), o.blurb,
    worldSVG({ pins: [{ at: o.at, cls: 'red', r: 9 }], key: 'ocean-q', grat: false }));
}

export const STOPS = [
  { id: 'seven-continents', title: 'Seven continents', glyph: '🗺️', band: '6-7',
    hook: 'All the land on Earth is gathered into seven great pieces, with ocean in between.',
    idea: ['The seven <b>continents</b> are Africa, Antarctica, Asia, Europe, North America, Oceania and South America.', '<b>Asia</b> is the biggest — by land and by people. <b>Oceania</b> (Australia and the Pacific islands) is the smallest. <b>Antarctica</b>, around the South Pole, has no countries at all.', `<b>${MOST}</b> has the most countries: ${counts[MOST]} of them.`, 'Some atlases count the continents a little differently — some call Oceania “Australia”, and some join the two Americas. Ask what your school uses.'],
    why: 'The continents are the biggest boxes on the map. Everything else fits inside one.',
    src: ['National Geographic — “Continent”', 'UN member states, from the app’s country data'],
    gen: mix(bank([
      { lv: 1, q: 'How many continents are there?', a: '7', w: ['5', '10', '3'] },
      { lv: 1, q: 'Which is the biggest continent?', a: 'Asia', w: ['Africa', 'Europe', 'Oceania'] },
      { lv: 1, q: 'Which continent is around the South Pole?', a: 'Antarctica', w: ['Africa', 'Oceania', 'South America'] },
      { lv: 2, q: 'Which continent has no countries at all?', a: 'Antarctica', w: ['Oceania', 'Europe', 'Asia'] },
      { lv: 2, q: 'Which continent has the most countries?', a: MOST, w: CONT },
      { lv: 2, q: 'Which is the smallest continent?', a: 'Oceania', w: ['Europe', 'Antarctica', 'South America'] },
      { lv: 3, q: 'Which two continents are joined by a thin strip of land?', a: 'North and South America', w: ['Africa and Oceania', 'Europe and Antarctica', 'Asia and South America'] },
    ]), findContinent) },
  { id: 'five-oceans', title: 'Five oceans', glyph: '🐋', band: '6-7',
    hook: 'The Pacific is so big that all the land on Earth would fit inside it — with room to spare.',
    idea: ['There are five <b>oceans</b>: the <b>Pacific</b>, the <b>Atlantic</b>, the <b>Indian</b>, the <b>Southern</b> and the <b>Arctic</b>.', 'They are really one world ocean, all joined up. We give its parts names so we can talk about them.', 'The Pacific is the biggest and deepest. The Arctic is the smallest.'],
    why: 'The oceans move heat around the world and make much of our weather.',
    src: OCEAN_SRC,
    gen: mix(oceanMarked, bank([
      { lv: 1, q: 'Which is the biggest ocean?', a: 'Pacific', w: ['Atlantic', 'Indian', 'Arctic'] },
      { lv: 1, q: 'How many oceans are there?', a: '5', w: ['7', '3', '12'] },
      { lv: 2, q: 'Which is the smallest ocean?', a: 'Arctic', w: ['Pacific', 'Indian', 'Atlantic'] },
      { lv: 2, q: 'Which ocean lies between Africa and Australia?', a: 'Indian', w: ['Atlantic', 'Arctic', 'Pacific'] },
      { lv: 2, q: 'Which ocean lies between the Americas and Europe?', a: 'Atlantic', w: ['Pacific', 'Indian', 'Southern'] },
      { lv: 3, q: 'Which ocean circles Antarctica?', a: 'Southern', w: ['Arctic', 'Indian', 'Atlantic'] },
      { lv: 3, q: 'Which ocean lies between Asia and the Americas?', a: 'Pacific', w: ['Atlantic', 'Indian', 'Arctic'] },
    ])) },
  { id: 'which-continent', title: 'Which continent?', glyph: '📍', band: '6-7',
    hook: 'Kenya and Egypt are both in Africa. Peru and Brazil are both in South America.',
    idea: ['Every country is on a continent.', 'A few are on two at once: most of Russia is in Asia, but most of its people live in Europe; Türkiye and Egypt each reach across into another continent. We leave those out of the quiz — they have two right answers.'],
    why: 'Knowing the continent is the first step to finding any country on a map.',
    gen: whichContinent },
  { id: 'find-continent', title: 'Find it on the map', glyph: '👆', band: '6-7',
    hook: 'Turn the map in your head: Africa is below Europe; the two Americas are on the left.',
    idea: ['On most world maps, the <b>Americas</b> are on the left, <b>Europe and Africa</b> are in the middle, <b>Asia</b> is on the right and <b>Oceania</b> is at the bottom right.', 'This map is drawn so that no continent looks much too big or too small.'],
    why: 'A picture of the world in your head helps with every other map you will ever read.',
    gen: mix(findContinent, findContinentOf) },
];
