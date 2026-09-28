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
  const id = pick(lv === 1 ? ['tree', 'river', 'lake', 'rail', 'school', 'park'] : SYMS, r);
  const others = SYMS.filter((s) => s !== id).map((s) => SYMBOLS[s].name);
  if (lv >= 2 && r() < 0.4) {
    const ids = shuffle(SYMS.filter((s) => s !== id), r).slice(0, 3);
    const opts = shuffle([id, ...ids], r);
    return { kind: 'mc', text: `Which symbol means “${SYMBOLS[id].name}”? (A, B, C or D)`, ans: 'ABCD'[opts.indexOf(id)], opts: ['A', 'B', 'C', 'D'],
      why: 'A map key tells you what each symbol means.', html: `<div class="sym-row">${opts.map((s, i) => `<figure><b>${'ABCD'[i]}</b>${symbol(s, 56)}</figure>`).join('')}</div>` };
  }
  return mc(r, 'What does this map symbol mean?', SYMBOLS[id].name, others, 'Maps use small symbols instead of pictures, so there is room for everything. The key says what each one means.', `<div class="sym-one">${symbol(id, 96)}</div>`);
}

const NEST = ['a house', 'a street', 'a town or city', 'a state or province', 'a country', 'a continent', 'the planet Earth'];
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
    ]) },
  { id: 'map-symbols', title: 'Symbols and the key', glyph: '🔣', band: '6-7',
    hook: 'A whole forest would never fit on a page. So a map draws a tiny tree — and tells you what it means.',
    idea: ['Maps use small <b>symbols</b>: a blue line for a river, a little tree for woodland, a line with ties for a railway.', 'The <b>key</b> (or legend) is the list that says what each symbol means. Always read the key first.', `<span class="sym-strip">${['tree', 'river', 'rail', 'lake', 'bridge', 'station'].map((s) => `<figure>${symbol(s, 54)}<figcaption>${SYMBOLS[s].name}</figcaption></figure>`).join('')}</span>`],
    why: 'Every map in the world uses a key. Once you can read one, you can read them all.',
    gen: symbols },
  { id: 'four-points', title: 'North, east, south, west', glyph: '🧭', band: '6-7',
    hook: 'A compass needle always swings to point north — wherever you stand on Earth.',
    idea: ['The four <b>compass points</b> are north, east, south and west. Going clockwise: <b>N</b>ever <b>E</b>at <b>S</b>oggy <b>W</b>affles.', 'On most maps, <b>north is at the top</b>. So south is at the bottom, east is on the right and west is on the left.', `<span class="fig-c">${rose(4, 150)}</span>`],
    why: 'Directions let you say where something is without pointing — and anyone, anywhere, understands you.',
    gen: (r, lv) => directions(r, lv, false) },
  { id: 'nested-places', title: 'Where in the world am I?', glyph: '📮', band: '6-7',
    hook: 'You could write an address all the way out: house, street, town, state, country, continent — planet Earth.',
    idea: ['Places fit inside each other, like boxes inside boxes.', 'Your <b>house</b> is on a <b>street</b>, in a <b>town or city</b>, in a <b>state or province</b>, in a <b>country</b>, on a <b>continent</b>, on <b>planet Earth</b>.', 'Every family lives somewhere different — ask your family to say your own boxes, from the smallest to the biggest.'],
    why: 'Knowing which box is inside which is how you understand any map — from a street plan to a globe.',
    gen: nested },
];
