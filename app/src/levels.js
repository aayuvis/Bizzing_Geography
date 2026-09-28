/* levels.js — ten roads, by geography age.

   The Atlas is a map of places; a LEVEL is a road through them for one age.
   Level n is for about age n + 5: Level 1 is age 6, Level 10 is 15 and over —
   the Bizzing Maths shape, kept so a family with both apps meets one idea.

   A step is a stop at a difficulty (`lv` 1 first meeting, 2 deeper, 3
   stretch). A stop may come back in a later level at a higher lv — the
   spiral — but never lower, never twice in one level, and never at lv 3 the
   first time a child meets it. A stop never appears before its own age band.
   test/levels.mjs holds every rule here to account. */

const S = (list) => list.trim().split(/\s*,\s*/).map((p) => { const [stop, lv] = p.split(/\s+/); return { stop, lv: Number(lv) }; });

export const LEVELS = [
  { n: 1, age: '6', name: 'First Maps',
    blurb: 'What a map is, symbols and the key, north-south-east-west, landforms and water, and the seven continents.',
    steps: S(`birds-eye 1, map-symbols 1, four-points 1, nested-places 1, landforms 1, water-bodies 1, land-or-water 1,
      seven-continents 1, five-oceans 1`) },
  { n: 2, age: '7', name: 'Land, Sea and Continents',
    blurb: 'More symbols and directions, island countries, which continent a country is on, and finding the continents on a map.',
    steps: S(`map-symbols 2, four-points 2, nested-places 2, landforms 2, water-bodies 2, land-or-water 2, island-nations 1,
      which-continent 1, find-continent 1, seven-continents 2`) },
  { n: 3, age: '8', name: 'The Compass Road',
    blurb: 'Eight compass points, grid squares, map scale, the oceans, first capitals, the water cycle, rivers and deserts.',
    steps: S(`eight-points 1, grid-refs 1, map-scale 1, five-oceans 2, which-continent 2, cap-europe 1, cap-americas 1,
      weather-climate 1, water-cycle 1, river-parts 1, deserts 1`) },
  { n: 4, age: '9', name: 'Capitals and Climates',
    blurb: 'Capitals of Asia, Africa and Oceania, flags, seasons, climate zones, biomes, great rivers and the highest mountains.',
    steps: S(`cap-asia 1, cap-africa 1, cap-oceania 1, flags 1, seasons 1, climate-zones 1, biomes 1, great-rivers 1,
      high-mountains 1, find-continent 2, grid-refs 2`) },
  { n: 5, age: '10', name: 'Across the World',
    blurb: 'Which way one country is from another, harder scales and capitals, neighbours, and every biome.',
    steps: S(`world-way 1, map-scale 2, cap-europe 2, cap-americas 2, neighbours 1, flags 2, biomes 2, river-parts 2,
      weather-climate 2, water-cycle 2, island-nations 2`) },
  { n: 6, age: '11', name: 'Lines on the Globe',
    blurb: 'Latitude and longitude, the hemispheres, the tropics, time round the world, inside the Earth, and settlements.',
    steps: S(`lat-long 1, hemispheres 1, special-lines 1, sun-time 1, earth-layers 1, settlements 1, cap-asia 2, cap-africa 2,
      great-rivers 2, deserts 2`) },
  { n: 7, age: '12', name: 'The Moving Earth',
    blurb: 'Plates, volcanoes and earthquakes, the rock cycle, Pangaea, the biggest countries and the landlocked ones.',
    steps: S(`plates 1, volcanoes-quakes 1, rocks 1, pangaea 1, big-countries 1, landlocked 1, seasons 2, climate-zones 2,
      neighbours 2, eight-points 2`) },
  { n: 8, age: '13', name: 'Coordinates and Resources',
    blurb: 'Resources and energy, and a second, deeper pass at latitude, hemispheres, the tropics, time zones and plates.',
    steps: S(`resources 1, lat-long 2, hemispheres 2, special-lines 2, sun-time 2, earth-layers 2, plates 2, world-way 2,
      cap-oceania 2, high-mountains 2`) },
  { n: 9, age: '14', name: 'The Explorer’s Road',
    blurb: 'The restless Earth in depth, people and places, and every capital and flag of the world.',
    steps: S(`volcanoes-quakes 2, rocks 2, pangaea 2, big-countries 2, landlocked 2, settlements 2, resources 2, flags 3,
      neighbours 3, cap-europe 3, cap-asia 3`) },
  { n: 10, age: '15+', name: 'The Stretch',
    blurb: 'Every strand at its hardest: scale ratios, direction across the world, coordinates, time, plates and every capital.',
    steps: S(`map-scale 3, world-way 3, lat-long 3, special-lines 3, sun-time 3, plates 3, cap-africa 3, cap-americas 3,
      cap-oceania 3, landlocked 3, big-countries 3, biomes 3, great-rivers 3`) },
];

export const ageOf = (n) => `geography age ${n >= 10 ? '15+' : n + 5}`;
/* Where a new child starts, by age band. The level check can move them up. */
export const START = { '6-7': 1, '8-10': 3, '11-14': 6 };

const FIRST = {};
for (const L of LEVELS) for (const s of L.steps) if (!(s.stop in FIRST)) FIRST[s.stop] = L.n;
export const firstLevel = (id) => FIRST[id];
