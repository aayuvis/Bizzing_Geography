/* Home Street — maps start at your own front door. Ages 6–7. */
import { mc, bank, mix } from './kit.js';
import { symbol, SYMBOLS, plan, rose } from '../figs.js';
import { int, shuffle, pick } from '../rand.js';

export const WORLD = { id: 'home', name: 'Home Street', short: 'Home Street', glyph: '🏡', band: '6-7', ink: '#2E6B3F', tint: '#E3F2E4',
  blurb: 'What a map is, the symbols on it, north-south-east-west, and where your street sits in the world.' };

const DIR4 = [['north', 0, 1], ['east', 1, 0], ['south', 0, -1], ['west', -1, 0]];
const DIR8 = [...DIR4, ['north-east', 1, 1], ['south-east', 1, -1], ['south-west', -1, -1], ['north-west', -1, 1]];
const OPP = { north: 'south', south: 'north', east: 'west', west: 'east', 'north-east': 'south-west', 'south-west': 'north-east', 'south-east': 'north-west', 'north-west': 'south-east' };
const PLACEABLE = ['park', 'lake', 'station', 'camp', 'hill', 'tree', 'lighthouse'];

/* A plan with the school in the middle and things round it; ask where one is. */
export function directions(r, lv, eight = false) {
  const dirs = shuffle(eight ? DIR8 : DIR4, r).slice(0, 4);
  const syms = shuffle(PLACEABLE, r).slice(0, 4);
  const items = dirs.map(([, dx, dy], i) => ({ sym: syms[i], dx: dx * (1 + (i % 2)), dy: dy * (1 + (i % 2)) }));
  const i = int(0, 3, r), [dir] = dirs[i], name = SYMBOLS[syms[i]].name;
  const words = (eight ? DIR8 : DIR4).map((d) => d[0]);
  if (lv >= 3 && r() < 0.5) {
    return mc(r, `Standing at the ${name}, which way is the school?`, OPP[dir], words, `The ${name} is ${dir} of the school, so the school is ${OPP[dir]} of the ${name} — the opposite way.`, plan(items));
  }
  return mc(r, `Look at the compass on the plan. Which way is the ${name} from the school?`, dir, words,
    `North is up, south is down, east is right and west is left. The ${name} is ${dir} of the school.`, plan(items));
}

const SYMS = ['tree', 'river', 'rail', 'bridge', 'lake', 'hill', 'camp', 'station', 'school', 'park', 'lighthouse', 'road'];
function symbols(r, lv) {
  const id = pick(lv === 1 ? ['tree', 'river', 'lake', 'rail', 'school', 'park', 'hill', 'bridge', 'camp', 'lighthouse'] : SYMS, r);
  const others = SYMS.filter((s) => s !== id).map((s) => SYMBOLS[s].name);
  if (lv >= 2 && r() < 0.4) {
    const ids = shuffle(SYMS.filter((s) => s !== id), r).slice(0, 3);
    const opts = shuffle([id, ...ids], r);
    return { kind: 'mc', text: `Which symbol means “${SYMBOLS[id].name}”? (A, B, C or D)`, ans: 'ABCD'[opts.indexOf(id)], opts: ['A', 'B', 'C', 'D'],
      why: 'A map key tells you what each symbol means.', html: `<div class="sym-row">${opts.map((s, i) => `<figure><b>${'ABCD'[i]}</b>${symbol(s, 56)}</figure>`).join('')}</div>` };
  }
  return mc(r, 'What does this map symbol mean?', SYMBOLS[id].name, others, 'Maps use small symbols instead of pictures, so there is room for everything. The key says what each one means.', `<div class="sym-one">${symbol(id, 96)}</div>`);
}

/* The key itself: what symbols, colours and the legend do — no place facts needed. */
const keyBank = bank([
  { lv: 1, q: 'The list that says what each map symbol means is called the…', a: 'key', w: ['lock', 'title', 'page number'] },
  { lv: 1, q: 'On most maps, what colour is water?', a: 'blue', w: ['red', 'black', 'yellow'] },
  { lv: 1, q: 'Green on a map often shows…', a: 'parks and woods', w: ['the sea', 'snow', 'busy roads'] },
  { lv: 1, tf: true, q: 'A map key can also be called a legend.' },
  { lv: 1, tf: true, q: 'It is a good idea to read the key before you use a map.', why: 'The key tells you what everything on the map means.' },
  { lv: 1, tf: false, q: 'Every map uses exactly the same symbols.', why: 'Maps can choose their own symbols — that is why each one has a key.' },
  { lv: 1, tf: false, q: 'A tiny tree symbol means there is only one tree there.', why: 'One small tree can stand for a whole wood.' },
  { lv: 2, q: 'Where is the key usually found on a map?', a: 'in a box near the edge', w: ['in the middle of the sea', 'on a different map', 'nowhere — you guess'] },
  { lv: 2, q: 'Dots that are bigger for bigger towns tell you…', a: 'how big each town is', w: ['how old each town is', 'how hot each town is', 'how far each town is from the sea'] },
  { lv: 2, tf: true, q: 'Map symbols can be little pictures, lines or colours.' },
  { lv: 3, q: 'What kind of symbol best shows a road or a river?', a: 'a line', w: ['a single dot', 'a coloured patch', 'a star'], why: 'Roads and rivers are long and thin, so a line fits them.' },
  { lv: 3, q: 'What kind of symbol best shows a forest or a lake?', a: 'a coloured patch', w: ['a single dot', 'a thin line', 'an arrow'], why: 'A forest or lake covers an area, so a patch of colour shows its shape.' },
  { lv: 3, tf: false, q: 'Colours on a map are only there to make it pretty.', why: 'Colours are symbols too — the key says what each one means.' },
]);

const NEST = ['a house', 'a street', 'a town or city', 'a state or province', 'a country', 'a continent', 'the planet Earth'];
/* Places inside places, without asking the same chain twice. */
const nestBank = bank([
  { lv: 1, q: 'What is the name of the planet we all live on?', a: 'Earth', w: ['the Moon', 'the Sun', 'Mars'] },
  { lv: 1, q: 'What do you write on a letter so it reaches the right house?', a: 'an address', w: ['a recipe', 'a poem', 'a riddle'] },
  { lv: 1, q: 'How many continents are there on Earth?', a: '7', w: ['3', '5', '12'], why: 'The seven continents are Asia, Africa, North America, South America, Antarctica, Europe and Australia.' },
  { lv: 1, q: 'Africa and Asia are both…', a: 'continents', w: ['cities', 'streets', 'oceans'] },
  { lv: 1, q: 'Lots of houses and streets, with shops and a school, make a…', a: 'town', w: ['continent', 'planet', 'ocean'] },
  { lv: 1, q: 'A map of your whole country would show…', a: 'many towns and cities', w: ['only your house', 'only one street', 'the whole planet'] },
  { lv: 1, tf: true, q: 'Two friends can live in the same country but in different towns.' },
  { lv: 1, tf: false, q: 'Everyone in the world lives in the same country.', why: 'The world has many countries, and families live in all of them.' },
  { lv: 1, tf: true, q: 'A big country can have many states or provinces inside it.' },
  { lv: 1, tf: true, q: 'Many countries can be on the same continent.', why: 'A continent is a huge piece of land, with room for many countries.' },
  { lv: 2, q: 'The big blue areas between the continents are…', a: 'oceans', w: ['states', 'towns', 'deserts'] },
  { lv: 2, q: 'The city that is home to a country’s government is called its…', a: 'capital', w: ['border', 'harbour', 'suburb'] },
  { lv: 2, q: 'The line where one country ends and the next begins is called a…', a: 'border', w: ['capital', 'motorway', 'harbour'] },
  { lv: 2, tf: false, q: 'Every country in the world is split into states.', why: 'Some small countries have none, and others use different names, like provinces or regions.' },
]);

function nested(r, lv) {
  if (lv >= 2 && r() < 0.5) {
    const i = int(0, NEST.length - 2, r);
    return mc(r, `Every ${NEST[i].replace(/^an? /, '')} is inside…`, NEST[i + 1], NEST.filter((_, j) => j !== i + 1 && j !== i),
      'Places fit inside each other like boxes: a house on a street, in a town, in a state, in a country, on a continent, on Earth.');
  }
  const idx = shuffle([0, 1, 2, 3, 4, 5, 6], r).slice(0, 4).sort((a, b) => a - b);
  const big = r() < 0.5;
  return mc(r, `Which of these is the ${big ? 'biggest' : 'smallest'}?`, NEST[big ? idx[3] : idx[0]], idx.map((j) => NEST[j]),
    'A house is inside a street, a street is inside a town, and so on up to the whole planet.');
}

export const STOPS = [
  { id: 'birds-eye', title: 'A bird’s-eye view', glyph: '🐦', band: '6-7',
    hook: 'A bird flying over your school does not see the front of the building. It sees the roof.',
    idea: ['A map is a drawing of a place <b>seen from above</b> — a bird’s-eye view.', 'A <b>plan</b> is a map of something small, like a classroom or a garden. A <b>map</b> can show a town, a country, or the whole world.', 'Because it is drawn from above, a map shows where things are compared with each other — which is what you need to find your way.'],
    why: 'A photo shows what a place looks like. A map shows where things are.',
    gen: bank([
      { lv: 1, q: 'A map shows a place as if you were looking…', a: 'down from above', w: ['from the side', 'from underneath', 'from inside a box'] },
      { lv: 1, q: 'A drawing of your classroom from above is called a…', a: 'plan', w: ['poem', 'photo', 'postcard'] },
      { lv: 1, tf: true, q: 'On a map from above, you see the roof of a house, not its front door.' },
      { lv: 1, tf: false, q: 'A map must show everything exactly the size it really is.', why: 'Maps are drawn much smaller than the real place — that is what a scale tells you.' },
      { lv: 2, q: 'What is a map best for?', a: 'finding where things are', w: ['hearing how a place sounds', 'knowing what the weather is today', 'seeing people’s faces'] },
      { lv: 2, q: 'A table seen from above looks like a…', a: 'rectangle', w: ['triangle with legs', 'tall tower', 'circle with a handle'] },
      { lv: 2, tf: true, q: 'A globe is a map of the whole Earth in the shape of a ball.' },
      { lv: 3, q: 'Why do maps use symbols instead of pictures?', a: 'they are small and fit more on the map', w: ['they are prettier', 'pictures are not allowed', 'symbols are always bigger'] },
      { lv: 1, q: 'From high above, a round pond looks like a…', a: 'circle', w: ['square', 'triangle', 'star'] },
      { lv: 1, q: 'From high above, a long road looks like a…', a: 'long strip', w: ['tall tower', 'tiny dot', 'round ball'] },
      { lv: 1, q: 'Who sees your school the way a map shows it?', a: 'a bird flying over it', w: ['a worm under the ground', 'a child at the front gate', 'a fish in the pond'] },
      { lv: 1, tf: true, q: 'You could draw a map of your own bedroom.', why: 'Any place can be mapped — draw it from above and show where things are.' },
      { lv: 1, tf: false, q: 'A map and a photo are exactly the same thing.', why: 'A photo shows what a place looks like. A map is drawn, with symbols, to show where things are.' },
      { lv: 1, tf: false, q: 'A map shows what the people in a place are saying.', why: 'A map shows where things are — not sounds or words people say.' },
      { lv: 1, tf: true, q: 'A map can show a place too big to see all at once.', why: 'You cannot see a whole country from the ground, but a map can show it on one page.' },
      { lv: 2, q: 'A book full of maps is called an…', a: 'atlas', w: ['diary', 'alphabet', 'album'] },
      { lv: 2, q: 'Which map would show each desk in your classroom?', a: 'a plan of the room', w: ['a map of your country', 'a map of the world', 'a globe'], why: 'A plan of something small has room for small things. A map of a big place does not.' },
      { lv: 2, tf: false, q: 'A map of a whole country shows every single house.', why: 'There is no room. A map of a big place shows only big things, like cities, rivers and roads.' },
      { lv: 2, tf: true, q: 'A map can be printed on paper or shown on a screen.', why: 'Paper maps and maps on a phone are both maps — drawings of a place from above.' },
      { lv: 3, q: 'Why is a photo taken from a plane not quite a map?', a: 'it has no key to say what things are', w: ['it is too colourful', 'it is upside down', 'it shows no ground'], why: 'A map is drawn with symbols and a key, so you know what everything is.' },
      { lv: 3, q: 'A map leaves out things that move about, like…', a: 'cars and people', w: ['rivers', 'roads', 'hills'], why: 'Cars and people are somewhere else a minute later, so a map does not draw them.' },
      { lv: 3, q: 'On a plan, why is a stool drawn as a small circle?', a: 'that is its shape from above', w: ['circles are easier to colour', 'to show it is tall', 'stools are always made of rubber'] },
      { lv: 3, tf: false, q: 'A map seen from above shows how tall each building is.', why: 'From above you see only the roof. Height needs extra words or symbols.' },
      { lv: 3, tf: true, q: 'A mapmaker chooses what to leave out, so a map is less busy than the real place.', why: 'Leaving things out is what makes a map easy to read.' },
    ]) },
  { id: 'map-symbols', title: 'Symbols and the key', glyph: '🔣', band: '6-7',
    hook: 'A whole forest would never fit on a page. So a map draws a tiny tree — and tells you what it means.',
    idea: ['Maps use small <b>symbols</b>: a blue line for a river, a little tree for woodland, a line with ties for a railway.', 'The <b>key</b> (or legend) is the list that says what each symbol means. Always read the key first.', `<span class="sym-strip">${['tree', 'river', 'rail', 'lake', 'bridge', 'station'].map((s) => `<figure>${symbol(s, 54)}<figcaption>${SYMBOLS[s].name}</figcaption></figure>`).join('')}</span>`],
    why: 'Every map in the world uses a key. Once you can read one, you can read them all.',
    gen: mix(symbols, keyBank) },
  { id: 'four-points', title: 'North, east, south, west', glyph: '🧭', band: '6-7',
    hook: 'A compass needle always swings to point north — wherever you stand on Earth.',
    idea: ['The four <b>compass points</b> are north, east, south and west. Going clockwise: <b>N</b>ever <b>E</b>at <b>S</b>oggy <b>W</b>affles.', 'On most maps, <b>north is at the top</b>. So south is at the bottom, east is on the right and west is on the left.', `<span class="fig-c">${rose(4, 150)}</span>`],
    why: 'Directions let you say where something is without pointing — and anyone, anywhere, understands you.',
    gen: (r, lv) => directions(r, lv, false) },
  { id: 'nested-places', title: 'Where in the world am I?', glyph: '📮', band: '6-7',
    hook: 'You could write an address all the way out: house, street, town, state, country, continent — planet Earth.',
    idea: ['Places fit inside each other, like boxes inside boxes.', 'Your <b>house</b> is on a <b>street</b>, in a <b>town or city</b>, in a <b>state or province</b>, in a <b>country</b>, on a <b>continent</b>, on <b>planet Earth</b>.', 'Every family lives somewhere different — ask your family to say your own boxes, from the smallest to the biggest.'],
    why: 'Knowing which box is inside which is how you understand any map — from a street plan to a globe.',
    gen: mix(nested, nestBank) },
];
