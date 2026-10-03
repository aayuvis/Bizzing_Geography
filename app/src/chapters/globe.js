/* Latitude Lighthouse — latitude and longitude, hemispheres, the special
   lines, and time around the world. Ages 11–14. The lines a country sits on
   are MEASURED from the map geometry (map.js), never typed from memory. */
import { mc, bank, mix, FAMOUS } from './kit.js';
import { pick, int, shuffle } from '../rand.js';
import { QUIZ, capOf, fmtLat, fmtLng, byCc } from '../geo.js';
import { countryAt } from '../map.js';
import { globeLines } from '../figs.js';

export const WORLD = { id: 'globe', name: 'Latitude Lighthouse', short: 'Latitude', glyph: '🌐', band: '11-14', ink: '#4B3F99', tint: '#E9E6F8',
  blurb: 'Latitude and longitude, the hemispheres, the equator and the tropics, and why it is morning in Tokyo while it is night in London.' };

/* Which quizzed countries a line of latitude crosses, sampled every ¼°. */
const LINE_CACHE = {};
export function crossedBy(lat) {
  if (LINE_CACHE[lat]) return LINE_CACHE[lat];
  const hit = new Set();
  for (let lng = -180; lng < 180; lng += 0.25) { const c = countryAt([lat, lng]); if (c && byCc[c] && byCc[c].quiz) hit.add(c); }
  return (LINE_CACHE[lat] = [...hit]);
}
const LINES = [['the Equator', 0], ['the Tropic of Cancer', 23.44], ['the Tropic of Capricorn', -23.44], ['the Arctic Circle', 66.56]];
function lineQ(r, lv) {
  const [name, lat] = pick(lv === 1 ? LINES.slice(0, 1) : LINES, r);
  const yes = crossedBy(lat);
  if (!yes.length) return mc(r, 'Which line runs round the middle of the Earth?', 'the Equator', LINES.map((l) => l[0]));
  const c = byCc[pick(yes.filter((x) => lv >= 3 || FAMOUS.has(x)).length ? yes.filter((x) => lv >= 3 || FAMOUS.has(x)) : yes, r)];
  /* wrong answers: countries that are nowhere near the line (at least 8° away at their centre) */
  const no = QUIZ.filter((x) => x.at && !yes.includes(x.cc) && Math.abs(x.at[0] - lat) > 8 && (lv >= 3 || FAMOUS.has(x.cc)));
  return mc(r, `Which of these countries does ${name} pass through?`, c.name, no.map((x) => x.name),
    `${name} (${fmtLat(lat)}) crosses ${c.name}. It also crosses ${yes.filter((x) => x !== c.cc).slice(0, 5).map((x) => byCc[x].name).join(', ')}.`);
}
function hemiQ(r, lv) {
  const pool = QUIZ.filter((c) => c.capAt[0] && Math.abs(c.capAt[0][0]) > 4 && (lv >= 2 || FAMOUS.has(c.cc)));
  const c = pick(pool, r), [lat, lng] = c.capAt[0];
  if (lv >= 2 && r() < 0.5 && Math.abs(lng) > 4 && Math.abs(Math.abs(lng) - 180) > 4) {
    const a = lng >= 0 ? 'Eastern' : 'Western';
    return mc(r, `Is ${capOf(c)}, ${c.name}, in the Eastern or the Western hemisphere?`, a, ['Eastern', 'Western'], `${capOf(c)} is at ${fmtLng(lng)} — ${a.toLowerCase()} of the Prime Meridian.`);
  }
  const a = lat >= 0 ? 'Northern' : 'Southern';
  return mc(r, `Is ${capOf(c)}, ${c.name}, in the Northern or the Southern hemisphere?`, a, ['Northern', 'Southern'], `${capOf(c)} is at ${fmtLat(lat)} — ${a.toLowerCase()} of the Equator.`);
}
function furtherQ(r, lv) {
  const pool = QUIZ.filter((c) => c.capAt[0] && (lv >= 3 || FAMOUS.has(c.cc)));
  for (let t = 0; t < 100; t++) {
    const [a, b] = shuffle(pool, r).slice(0, 2);
    const ns = r() < 0.5, i = ns ? 0 : 1, gap = Math.abs(a.capAt[0][i] - b.capAt[0][i]);
    if (gap < (lv === 1 ? 15 : 7) || (!ns && Math.abs(a.capAt[0][1] - b.capAt[0][1]) > 170)) continue;
    const win = ns ? (a.capAt[0][0] > b.capAt[0][0] ? a : b) : (a.capAt[0][1] > b.capAt[0][1] ? a : b);
    const txt = (c) => `${capOf(c)} (${c.name})`;
    return { kind: 'mc', text: `Which capital is further ${ns ? 'north' : 'east'}?`, ans: txt(win), opts: [txt(a), txt(b)].sort(),
      why: `${capOf(a)} is at ${fmtLat(a.capAt[0][0])}, ${fmtLng(a.capAt[0][1])}; ${capOf(b)} is at ${fmtLat(b.capAt[0][0])}, ${fmtLng(b.capAt[0][1])}.`, html: '' };
  }
  return hemiQ(r, lv);
}
const clock = (h) => { h = ((h % 24) + 24) % 24; return h === 0 ? 'midnight' : h === 12 ? 'noon' : h < 12 ? `${h} am` : `${h - 12} pm`; };
function sunTime(r, lv) {
  const steps = int(1, lv === 1 ? 4 : 8, r) * (r() < 0.5 ? 1 : -1);
  const lng = steps * 15, base = lv >= 3 ? pick([6, 9, 12, 15, 18], r) : 12;
  const ans = clock(base + steps);
  return mc(r, `By the Sun, it is ${clock(base)} at 0° longitude. What time is it by the Sun at ${fmtLng(lng)}?`, ans,
    [clock(base - steps), clock(base + steps + 1), clock(base + steps - 1), clock(base + 2 * steps), clock(base)],
    `The Earth turns 360° in 24 hours — 15° every hour. ${fmtLng(lng)} is ${Math.abs(steps)} × 15°, so ${Math.abs(steps)} hour${Math.abs(steps) > 1 ? 's' : ''} ${steps > 0 ? 'later (the Sun reaches the east first)' : 'earlier'}.`);
}

export const STOPS = [
  { id: 'lat-long', title: 'Latitude and longitude', glyph: '📐', band: '11-14',
    hook: 'Two numbers are enough to find any spot on Earth — a ship in the ocean, or your front door.',
    idea: ['Lines of <b>latitude</b> run east–west round the globe. They measure how far north or south you are of the <b>Equator</b> (0°), up to 90° at each pole.', 'Lines of <b>longitude</b> run from pole to pole. They measure how far east or west you are of the <b>Prime Meridian</b> (0°), which runs through Greenwich in London, up to 180°.', 'Together they make a grid. New Delhi is at about 29° N, 77° E.'],
    why: 'Every GPS, every flight and every ship finds its way with these two numbers.',
    src: ['Encyclopaedia Britannica — “Latitude and longitude”'],
    gen: mix(furtherQ, bank([
      { lv: 1, q: 'Lines of latitude measure how far you are…', a: 'north or south of the Equator', w: ['east or west of Greenwich', 'above sea level', 'from the Sun'] },
      { lv: 1, q: 'What is the latitude of the Equator?', a: '0°', w: ['90°', '180°', '45°'] },
      { lv: 2, q: 'What is the latitude of the North Pole?', a: '90° N', w: ['0°', '180° N', '45° N'] },
      { lv: 2, q: 'The Prime Meridian, 0° longitude, passes through…', a: 'Greenwich, London', w: ['New Delhi', 'the North Pole only', 'the middle of the Pacific'] },
      { lv: 3, q: 'Lines of longitude all meet at…', a: 'the North and South Poles', w: ['the Equator', 'Greenwich only', 'nowhere'] },
    ])) },
  { id: 'hemispheres', title: 'The four hemispheres', glyph: '🌓', band: '11-14',
    hook: 'Ecuador is named after the Equator — the line runs right through it, so the country is in two hemispheres at once.',
    idea: ['The <b>Equator</b> cuts the Earth into the <b>Northern</b> and <b>Southern</b> hemispheres.', 'The <b>Prime Meridian</b> and the 180° line cut it into the <b>Eastern</b> and <b>Western</b> hemispheres.', 'Every place is in one of each: India is Northern and Eastern; Brazil is mostly Southern and Western.'],
    why: 'Hemispheres tell you the season (north or south) and roughly the time of day (east or west).',
    gen: hemiQ },
  { id: 'special-lines', title: 'The Tropics and the Circles', glyph: '➖', band: '11-14',
    hook: 'The Tropic of Cancer crosses India — through eight states, from Gujarat to Mizoram.',
    idea: [`<span class="fig-c">${globeLines()}</span>`, 'The <b>Tropic of Cancer</b> (about 23½° N) and the <b>Tropic of Capricorn</b> (about 23½° S) mark how far from the Equator the Sun can be straight overhead.', 'The <b>Arctic</b> and <b>Antarctic Circles</b> (about 66½°) mark where there is at least one day a year when the Sun never sets — and one when it never rises.', 'Which countries each line crosses is measured here from the map itself.'],
    why: 'These lines come from the tilt of the Earth — the same tilt that gives us seasons.',
    src: ['Encyclopaedia Britannica — “Tropic of Cancer”, “Arctic Circle”', 'Survey of India — the states the Tropic of Cancer crosses'],
    gen: mix(lineQ, bank([
      { lv: 1, q: 'About how far north of the Equator is the Tropic of Cancer?', a: '23½° N', w: ['66½° N', '45° N', '90° N'] },
      { lv: 1, q: 'The Arctic Circle is at about…', a: '66½° N', w: ['23½° N', '0°', '45° N'] },
      { lv: 1, q: 'What gives the Earth its Tropics, its polar Circles and its seasons?', a: 'the tilt of the Earth', w: ['the pull of the Moon', 'the shape of the continents', 'the winds'] },
      { lv: 1, q: 'The warm band of the Earth between the two Tropics is called…', a: 'the tropics', w: ['the temperate zone', 'the polar zone', 'the tundra'] },
      { lv: 1, q: 'At the North Pole in midsummer, the Sun…', a: 'stays up all day and all night', w: ['rises and sets twice', 'never comes up', 'is straight overhead'] },
      { lv: 1, q: 'Which way do the Tropics and the Circles run round the globe?', a: 'east–west', w: ['north–south', 'from pole to pole', 'in a spiral'] },
      { lv: 1, tf: true, q: 'The Sun can be straight overhead at noon on the Equator.', why: 'The Equator lies between the two Tropics, where the Sun can be straight overhead.' },
      { lv: 1, tf: false, q: 'North of the Arctic Circle, the Sun is straight overhead at noon on one day a year.', why: 'The Sun is only ever straight overhead between the two Tropics.' },
      { lv: 1, tf: true, q: 'On at least one day a year, the Sun never sets at the Arctic Circle.', why: 'That is what the Arctic Circle marks: at least one day of midnight sun.' },
      { lv: 1, tf: false, q: 'The Tropic of Capricorn is north of the Equator.', why: 'Capricorn is about 23½° SOUTH; Cancer is the northern one.' },
      { lv: 2, q: 'On about 21 June, the Sun is straight overhead at noon on…', a: 'the Tropic of Cancer', w: ['the Tropic of Capricorn', 'the Arctic Circle', 'the Prime Meridian'], why: 'The June solstice: the Sun reaches its furthest point north.' },
      { lv: 2, q: 'On about 21 December, the Sun is straight overhead at noon on…', a: 'the Tropic of Capricorn', w: ['the Tropic of Cancer', 'the Arctic Circle', 'the Prime Meridian'], why: 'The December solstice: the Sun reaches its furthest point south.' },
      { lv: 2, q: 'Why are the Tropics at about 23½° and not somewhere else?', a: 'the Earth’s axis is tilted by about 23½°', w: ['the Sun is 23½ times bigger', 'the Moon is 23½° away', 'the oceans push them there'] },
      { lv: 2, q: 'Inside the Antarctic Circle on midwinter’s day, the Sun…', a: 'never rises', w: ['never sets', 'is straight overhead', 'rises in the west'] },
      { lv: 2, tf: true, q: 'When it is summer north of the Equator, it is winter south of it.', why: 'The tilt leans one half towards the Sun while the other leans away.' },
      { lv: 2, tf: false, q: 'Near the Equator, summer and winter are more different than near the poles.', why: 'Near the Equator the Sun stays high all year, so the seasons change least there.' },
      { lv: 3, q: 'If the Earth’s axis were not tilted at all, the Tropics would…', a: 'sit on the Equator', w: ['move to the poles', 'stay at 23½°', 'be twice as far apart'], why: 'The Tropics are as far from the Equator as the Earth is tilted.' },
      { lv: 3, q: 'About how many degrees apart are the Tropic of Cancer and the Tropic of Capricorn?', a: 'about 47°', w: ['about 23½°', 'about 66½°', 'about 90°'], why: '23½° north plus 23½° south.' },
      { lv: 3, q: 'The day the Sun is straight overhead on one of the Tropics is called…', a: 'a solstice', w: ['an equinox', 'an eclipse', 'a monsoon'] },
      { lv: 3, q: 'On an equinox, the Sun is straight overhead at noon on…', a: 'the Equator', w: ['the Tropic of Cancer', 'the Arctic Circle', 'the North Pole'], why: 'In March and September the Sun crosses the Equator, and day and night are about equal everywhere.' },
    ])) },
  { id: 'sun-time', title: 'Time round the world', glyph: '🕰️', band: '11-14',
    hook: 'When it is lunchtime in London, it is teatime in Mumbai and the middle of the night in California.',
    idea: ['The Earth turns once in 24 hours — <b>360° ÷ 24 = 15° every hour</b>.', 'The Sun rises in the east, so places further <b>east</b> reach noon <b>first</b>.', 'Countries set <b>time zones</b> for everyone’s clocks. Most are whole hours apart; India uses one zone, 5½ hours ahead of Greenwich.'],
    why: 'It is why a video call with family in another country needs a little arithmetic first.',
    src: ['Royal Observatory Greenwich — “Greenwich Mean Time”', 'National Physical Laboratory of India — Indian Standard Time'],
    gen: mix(sunTime, bank([
      { lv: 1, q: 'How many degrees does the Earth turn in one hour?', a: '15°', w: ['24°', '1°', '60°'], why: '360° ÷ 24 hours = 15° an hour.' },
      { lv: 1, q: 'How long does the Earth take to turn round once?', a: '24 hours', w: ['12 hours', 'one week', '365 days'] },
      { lv: 1, q: 'Where in the sky does the Sun rise?', a: 'in the east', w: ['in the west', 'in the north', 'straight overhead'] },
      { lv: 1, q: 'Why do we have day and night?', a: 'the Earth spins', w: ['the Sun goes round the Earth', 'the Moon covers the Sun', 'clouds hide the Sun'] },
      { lv: 1, q: 'A region where everyone keeps the same clock time is called a…', a: 'time zone', w: ['hemisphere', 'tropic', 'meridian'] },
      { lv: 1, q: 'Indian Standard Time is how far ahead of Greenwich?', a: '5½ hours', w: ['5 hours', '6 hours', '12 hours'], why: 'India uses one zone, UTC + 5:30.' },
      { lv: 1, q: 'Flying east across many time zones, you set your watch…', a: 'forward', w: ['back', 'not at all', 'to midnight'] },
      { lv: 1, tf: true, q: 'When it is day on one side of the Earth, it is night on the other.', why: 'The Sun can light only the half of the Earth facing it.' },
      { lv: 1, tf: false, q: 'At any moment, it is noon by the Sun everywhere on Earth.', why: 'Noon moves round the Earth 15° every hour.' },
      { lv: 1, tf: true, q: 'India uses just one time zone for the whole country.', why: 'Indian Standard Time is used everywhere in India.' },
      { lv: 1, tf: false, q: 'Going west, the time by the Sun gets later.', why: 'Going west it gets EARLIER — the Sun reaches the east first.' },
      { lv: 2, q: 'How long does the Earth take to turn 1°?', a: '4 minutes', w: ['15 minutes', '1 minute', '1 hour'], why: '60 minutes ÷ 15° = 4 minutes for each degree.' },
      { lv: 2, q: 'Which line, near 180° longitude, is where the date changes?', a: 'the International Date Line', w: ['the Prime Meridian', 'the Equator', 'the Tropic of Cancer'] },
      { lv: 2, q: 'At noon by the Sun, where is the Sun in the sky?', a: 'at its highest point of the day', w: ['just rising', 'just setting', 'below the horizon'] },
      { lv: 2, tf: false, q: 'Every time zone is a whole number of hours from Greenwich.', why: 'Some are not — India is 5½ hours ahead.' },
      { lv: 2, tf: true, q: 'A very wide country can stretch across several time zones.', why: 'The further east–west a country reaches, the more hours of sun-time it spans.' },
      { lv: 3, q: 'Crossing the International Date Line going west, the date…', a: 'jumps forward one day', w: ['goes back one day', 'stays the same', 'jumps forward a week'] },
      { lv: 3, q: 'GMT is short for…', a: 'Greenwich Mean Time', w: ['Global Map Time', 'Great Meridian Time', 'General Morning Time'] },
      { lv: 3, q: 'Two places 180° apart in longitude are how far apart by the Sun?', a: '12 hours', w: ['18 hours', '6 hours', '24 hours'], why: '180° ÷ 15° an hour = 12 hours.' },
    ])) },
];
