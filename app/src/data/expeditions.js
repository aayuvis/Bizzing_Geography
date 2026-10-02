/* expeditions.js — ten learning sprints of 20–30 days each.

   The model is Bizzing India's Paathshala (data-paath.js, paath.js), and its
   reason holds here word for word: a corpus is not a curriculum. The Atlas
   holds 45 stops and the Library eight tools; a child can wander them for a
   year and a grown-up still cannot answer "what has she learned?". An
   expedition answers it — as objectives, with assessment kept SEPARATE from
   teaching.

   THE SHAPE. An expedition is modules; a module is four days and a project:
     t  teach     — a stop's lesson, or a Library tool with a job to do
     p  practice  — a mixed quiz from the module's stops (generated, never typed)
     c  check     — the module's objective, asked cold. It counts as LEARNED only
                    when it is right (8 of 10) on a LATER DAY than the teaching:
                    the same day is attention; another day is memory.
     project      — something made or done away from the screen, with the family.
   A day is a SESSION, not a date. There is no calendar, no streak and nothing
   is lost by a missed day: day 7 waits for you, whenever you come back.

   NOTHING NEW IS INVENTED HERE. Every teach day points at an existing stop or
   tool, every quiz is drawn from the stops' own generators, and the projects
   are things to do, not facts to learn. test/expeditions.mjs checks every id,
   runs every quiz, and holds each expedition to 20–30 days. */

import { byCc } from '../geo.js';
import { EARTH } from './eras.js';

const T = (stop, lv = 1, o = '') => ({ k: 't', stop, lv, m: 15, o });
const TOOL = (tool, name, o, how) => ({ k: 't', tool, name, m: 15, o, how });
const P = (stops, lv, o) => ({ k: 'p', stops, lv, m: 12, o });
const C = (stops, lv, o) => ({ k: 'c', stops, lv, m: 10, o });
/* PROJECTS ARE MADE IN THE APP (src/projects.js). Each names its builder and the
   goals the app checks as the child builds; nothing is ticked on trust. */
const MM = (name, brief, made, o) => ({ engine: 'mapmaker', name, brief, made, m: 25, w: 14, h: 9, base: 'sea', ...o });
const ROUTE = (name, brief, made, o) => ({ engine: 'route', name, brief, made, m: 20, ...o });
const ORD = (name, brief, made, items, label) => ({ engine: 'order', name, brief, made, m: 10, items, label });
const SORT = (name, brief, made, kind, count) => ({ engine: 'sort', name, brief, made, m: 15, kind, count });
const FLAG = (name, brief, made, o) => ({ engine: 'flag', name, brief, made, m: 20, ...o });
const WT = ['sea', 'land', 'sand', 'forest', 'mountain', 'lake', 'river'];
const G = {
  count: (tile, min, t) => ({ k: 'count', tile, min, t }), exact: (tile, n, t) => ({ k: 'exact', tile, n, t }),
  sym: (sym, min, t) => ({ k: 'sym', sym, min, t }), any: (syms, min, t) => ({ k: 'anySym', syms, min, t }),
  kinds: (of, min, t) => ({ k: 'kinds', of, min, t }), edge: (tile, t) => ({ k: 'edge', tile, t }),
  lake: (t) => ({ k: 'lake', t }), river: (t) => ({ k: 'river', t, min: 3 }),
  on: (sym, tiles, t, beside) => ({ k: 'on', sym, tiles, t, beside }), gridAnswer: (t) => ({ k: 'gridAnswer', t }),
  row: (row, tile, t) => ({ k: 'row', row, tile, t }), rowAny: (row, tiles, t) => ({ k: 'rowAny', row, tiles, t }),
  len: (min, t) => ({ k: 'len', min, t }), continents: (min, t) => ({ k: 'continents', min, t }),
  bigger: (min, t) => ({ k: 'bigger', min, t }), landlockedStart: (t) => ({ k: 'landlockedStart', t }),
  coastEnd: (t) => ({ k: 'coastEnd', t }), quadrants: (t) => ({ k: 'quadrants', t }),
};
/* the order the morning reaches five countries: MEASURED from their longitudes, never typed */
const EASTWEST = ['JP', 'IN', 'EG', 'BR', 'MX'].map((cc) => byCc[cc]).sort((a, b) => b.at[1] - a.at[1]).map((c) => c.name);
/* n of the Earth's great events, oldest first — taken from Earth Through Time's own list */
const EARTHSEQ = (n) => Array.from({ length: n }, (_, i) => EARTH[Math.round((i * (EARTH.length - 1)) / (n - 1))].title);

export const EXPEDITIONS_INTRO = 'An expedition is a path through the Atlas and the Library — about fifteen minutes a day: learn, practise, a test to show it stuck, then something to make right here in the app.';
export const EXPEDITIONS_PARENT = 'Progress here is what a child can DO, never minutes on a screen. Each part ends with a check on a later day than its teaching, because remembering something a minute later is attention, and remembering it days later is learning. A missed day costs nothing; the next day simply waits.';

export const EXPEDITIONS = [
  /* ============================================================ 1 */
  { id: 'first-maps', paint: 'A cosy explorer’s desk seen from above with a hand-drawn treasure map on parchment, a brass compass, coloured pencils, a toy house and tree, warm morning light, no text', name: 'First Maps', glyph: '🗺️', sub: 'From your room to the whole world', ages: [6, 8], colour: '#E4572E',
    final: MM('Your own island — the whole map', 'Put everything together: an island with a lake, a river from a mountain to the sea, a port, the treasure, a north arrow and at least four symbols in the key.', 'a whole map of your own', { w: 16, h: 10, tiles: WT, syms: ['north', 'treasure', 'house', 'tree', 'port', 'tower', 'camp'], goals: [G.edge('sea', 'sea all round'), G.count('land', 40, '40 squares of land'), G.lake('a lake'), G.river('a river from a mountain to the sea'), G.sym('north', 1, 'a north arrow ⬆️'), G.sym('treasure', 1, 'the treasure'), G.any(['house', 'tree', 'port', 'tower', 'camp'], 4, 'four more symbols')] }),
    blurb: 'What a map is, what its little pictures mean, which way is north, and where you are — from your room to the world.',
    modules: [
      { id: 'fm1', name: 'Looking from above', objective: 'look at a picture from above and say what each shape is',
        days: [T('birds-eye', 1, 'say why a map is a picture from above'), TOOL('explorer', 'Find your own country', 'find a country on the world map', 'Open the Map Explorer and find the country you live in. Tap it, then find one country next to it.'), P(['birds-eye'], 1, 'name what a shape from above is'), C(['birds-eye'], 1, 'do it again cold, on another day')],
        project: MM('Your room from above', 'Draw your bedroom as a bird would see it from the ceiling: walls round the edge, then the bed, a table and the door.', 'a map of a room you know', { base: 'floor', w: 10, h: 8, tiles: ['floor', 'wall', 'bed', 'table', 'rug', 'door'], goals: [G.count('wall', 12, 'walls round the room (12 squares)'), G.count('bed', 2, 'a bed (2 squares)'), G.count('table', 1, 'a table'), G.count('door', 1, 'a door')] }) },
      { id: 'fm2', name: 'Symbols and the key', objective: 'read a map symbol using the key',
        days: [T('map-symbols', 1, 'match symbols to what they stand for'), TOOL('dictionary', 'Map words', 'use five map words', 'Open the Dictionary, choose Maps, and read five words. Say each one aloud in a sentence.'), P(['map-symbols'], 1, 'read ten symbols'), C(['map-symbols', 'birds-eye'], 1, 'read symbols you have not practised today')],
        project: MM('A treasure map with a key', 'Make an island, hide the treasure, and put three more symbols on it. The key draws itself.', 'a treasure map with a key', { tiles: WT, syms: ['treasure', 'house', 'tree', 'tower', 'camp'], goals: [G.count('land', 20, 'an island (20 squares of land)'), G.sym('treasure', 1, 'the treasure, marked ❌'), G.any(['house', 'tree', 'tower', 'camp'], 3, 'three more symbols for the key')] }) },
      { id: 'fm3', name: 'North, south, east and west', objective: 'point north, south, east and west on a map',
        days: [T('four-points', 1, 'name the four points'), T('four-points', 2, 'use them to say where something is'), P(['four-points'], 1, 'find directions on ten maps'), C(['four-points'], 2, 'do it cold')],
        project: ORD('The four points', 'Put the four points of the compass in order, going round clockwise from north.', 'a compass in the right order', ['North', 'East', 'South', 'West'], 'clockwise, starting at north') },
      { id: 'fm4', name: 'Where in the world am I?', objective: 'put places inside each other: room, home, town, country, continent, world',
        days: [T('nested-places', 1, 'order places from smallest to biggest'), TOOL('explorer', 'Your continent', 'name your continent', 'In the Map Explorer, tap your country and read which continent it is on.'), P(['nested-places'], 1, 'order ten sets of places'), C(['nested-places', 'four-points'], 1, 'do it cold')],
        project: ORD('Boxes inside boxes', 'Put the places in order, from the smallest to the biggest.', 'where you are in the world, in order', ['My room', 'My home', 'My street', 'My town or city', 'My country', 'My continent', 'The world'], 'smallest to biggest') },
      { id: 'fm5', name: 'Land and water', objective: 'tell land from water on a map, and name a lake, a river and a sea',
        days: [T('land-or-water', 1, 'tell land from water'), T('water-bodies', 1, 'name kinds of water'), P(['land-or-water', 'water-bodies'], 1, 'sort land and water'), C(['land-or-water', 'water-bodies'], 1, 'do it cold')],
        project: MM('An island with a lake and a river', 'Build an island in the sea. Give it a lake with land all round, a river running from a mountain down to the sea, and a port on the coast.', 'an island with a lake, a river and a port', { tiles: WT, syms: ['port', 'house', 'tree'], goals: [G.edge('sea', 'sea all the way round the edge'), G.count('land', 25, '25 squares of land'), G.lake('a lake with land all round it'), G.river('a river from a mountain to the sea'), G.on('port', ['land', 'sand'], 'a port on the coast ⚓', 'sea')] }) },
    ] },

  /* ============================================================ 2 */
  { id: 'continents-oceans', paint: 'A wide sunlit ocean horizon with a sailing boat, distant green islands, whales spouting and seabirds, a hot-air balloon high above, cheerful storybook colours', name: 'Seven Continents, Five Oceans', glyph: '🌍', sub: 'The whole world in twelve names', ages: [6, 9], colour: '#2E9CA6',
    final: FLAG('A flag for your island country', 'Your island country needs a flag: three colours, an emblem, and a meaning for every colour.', 'a flag for a country you made', { colours: 3, emblem: true }),
    blurb: 'Every continent and ocean: where each is, which is which, and the islands between them.',
    modules: [
      { id: 'co1', name: 'The seven continents', objective: 'name the seven continents and point to each',
        days: [T('seven-continents', 1, 'name all seven'), TOOL('explorer', 'Continents on the map', 'tap each continent', 'Open the Map Explorer. Find a country on each of the seven continents — one each.'), P(['seven-continents'], 1, 'find each continent'), C(['seven-continents'], 1, 'name them cold')],
        project: ROUTE('Six continents', 'Tap one country on each continent that has countries — six of them (Antarctica has none).', 'the world in six countries', { rule: 'free', max: 8, goals: [G.continents(6, 'a country on each of six continents')] }) },
      { id: 'co2', name: 'The five oceans', objective: 'name the five oceans and say which is the biggest',
        days: [T('five-oceans', 1, 'name all five'), T('five-oceans', 2, 'say which is largest and warmest'), P(['five-oceans'], 1, 'find each ocean'), C(['five-oceans', 'seven-continents'], 1, 'do it cold')],
        project: ORD('Five oceans by size', 'Put the five oceans in order, from the biggest to the smallest. The Five Oceans stop tells you.', 'the oceans in order of size', ['Pacific', 'Atlantic', 'Indian', 'Southern', 'Arctic'], 'biggest to smallest') },
      { id: 'co3', name: 'Which continent?', objective: 'say which continent a country is on',
        days: [T('which-continent', 1, 'place a country on its continent'), T('find-continent', 1, 'find a continent on the map'), P(['which-continent', 'find-continent'], 1, 'place twenty countries'), C(['which-continent', 'find-continent'], 1, 'do it cold')],
        project: SORT('Continent bins', 'Sort these countries into their continents.', 'twelve countries sorted', 'continent', 12) },
      { id: 'co4', name: 'Islands of the world', objective: 'recognise countries that are islands',
        days: [T('island-nations', 1, 'tell an island country'), TOOL('geoguess', 'Island hopping', 'guess a place from a picture', 'Play one round of Where on Earth? For every picture, first ask: could this be an island?'), P(['island-nations'], 1, 'spot island countries'), C(['island-nations', 'which-continent'], 1, 'do it cold')],
        project: MM('Design an island country', 'Make an island country: sea all round, a capital city, and a port.', 'a country of your own', { tiles: WT, syms: ['capital', 'port', 'house', 'tree'], goals: [G.edge('sea', 'sea all round — it is an island'), G.count('land', 20, '20 squares of land'), G.on('capital', ['land', 'grass', 'forest'], 'a capital city ⭐ on land'), G.on('port', ['land', 'sand'], 'a port on the coast ⚓', 'sea')] }) },
      { id: 'co5', name: 'A wonder on every continent', objective: 'match a famous landmark to its continent',
        days: [TOOL('landmarks', 'Wonders by continent', 'name a landmark on each continent', 'Open Famous Landmarks. Choose each continent in turn and open one landmark from each.'), TOOL('landmarks', 'Which country?', 'place a landmark in its country', 'In Famous Landmarks, take the quiz "which country?".'), P(['which-continent', 'seven-continents'], 1, 'mixed practice'), C(['find-continent', 'which-continent', 'five-oceans'], 1, 'the whole world, cold')],
        project: SORT('Built or natural?', 'Sort these famous landmarks: built by people, or made by nature?', 'ten wonders sorted', 'builtNatural', 10) },
    ] },

  /* ============================================================ 3 */
  { id: 'compass-grid', paint: 'A hilltop lookout with a giant brass compass rose set into the stone floor, a telescope on a tripod, rolling countryside and a winding path below, clear sky', name: 'Compass and Grid', glyph: '🧭', sub: 'Find anything, anywhere, on any map', ages: [8, 11], colour: '#A94A1C',
    final: MM('An orienteering course', 'Build a course: a north arrow, a road of at least 10 km, a lookout, and the treasure — then name its grid square.', 'an orienteering course', { grid: true, w: 12, h: 8, base: 'land', tiles: ['land', 'road', 'forest', 'lake', 'mountain', 'sea'], syms: ['north', 'tower', 'treasure', 'camp'], goals: [G.sym('north', 1, 'a north arrow'), G.count('road', 10, 'a road of at least 10 km'), G.sym('tower', 1, 'a lookout'), G.gridAnswer('the treasure’s grid square')] }),
    blurb: 'Eight compass points, grid squares, map scale and the way round the world — the tools every navigator needs.',
    modules: [
      { id: 'cg1', name: 'Eight points of the compass', objective: 'give directions using all eight points',
        days: [T('eight-points', 1, 'name the eight points'), T('eight-points', 2, 'use them between places'), P(['eight-points'], 2, 'twenty directions'), C(['eight-points'], 2, 'do it cold')],
        project: ORD('Eight points', 'Put all eight compass points in order, clockwise from north.', 'a full compass rose', ['North', 'North-east', 'East', 'South-east', 'South', 'South-west', 'West', 'North-west'], 'clockwise, starting at north') },
      { id: 'cg2', name: 'Grid squares', objective: 'find a place from its grid square',
        days: [T('grid-refs', 1, 'read a grid square'), T('grid-refs', 2, 'give one'), P(['grid-refs'], 2, 'find ten squares'), C(['grid-refs', 'eight-points'], 2, 'do it cold')],
        project: MM('Hide it in a square', 'Make an island on the grid, hide the treasure, then write the grid square it is in.', 'a map someone can search with a grid', { grid: true, w: 10, h: 7, tiles: WT, syms: ['treasure', 'tree', 'house'], goals: [G.count('land', 15, '15 squares of land'), G.gridAnswer('the treasure’s square, written correctly (like C4)')] }) },
      { id: 'cg3', name: 'Map scale', objective: 'use a map’s scale to say how far apart two places are',
        days: [T('map-scale', 1, 'say what a scale means'), T('map-scale', 2, 'measure with it'), P(['map-scale'], 2, 'ten distances'), C(['map-scale', 'grid-refs'], 2, 'do it cold')],
        project: MM('A road to scale', 'Each square is 1 kilometre. Build a road exactly 8 kilometres long across your land.', 'a road to scale', { grid: true, w: 12, h: 7, base: 'land', tiles: ['land', 'road', 'forest', 'lake', 'mountain'], syms: ['house', 'camp'], goals: [G.exact('road', 8, 'a road exactly 8 km long (8 squares)'), G.sym('house', 1, 'a house at one end'), G.sym('camp', 1, 'a camp at the other')] }) },
      { id: 'cg4', name: 'Which way round the world?', objective: 'say which way you would travel between two countries',
        days: [T('world-way', 1, 'choose a direction between countries'), TOOL('explorer', 'Plan a journey', 'trace a route across countries', 'In the Map Explorer, tap your country, then a country far away. Name the countries you would cross on the way.'), P(['world-way', 'eight-points'], 2, 'mixed'), C(['world-way'], 2, 'do it cold')],
        project: ROUTE('Four countries, one border at a time', 'Plan a journey through four countries, each one sharing a border with the last.', 'a real journey on the map', { rule: 'neighbours', max: 8, goals: [G.len(4, 'four countries, each bordering the last')] }) },
      { id: 'cg5', name: 'The navigator’s test', objective: 'use compass, grid and scale together',
        days: [TOOL('geoguess', 'Where is this?', 'place a picture on the map', 'Play a Where on Earth? round. Before each guess, say which direction from you the place is.'), P(['eight-points', 'grid-refs'], 2, 'mixed'), P(['map-scale', 'world-way'], 2, 'mixed'), C(['eight-points', 'grid-refs', 'map-scale', 'world-way'], 2, 'all four, cold')],
        project: ROUTE('Across a continent', 'Plan a journey across Europe through five countries, each bordering the last.', 'a route across Europe', { rule: 'neighbours', cont: 'Europe', max: 10, goals: [G.len(5, 'five European countries in a chain')] }) },
    ] },

  /* ============================================================ 4 */
  { id: 'capitals', paint: 'A grand avenue of domed and towered buildings from many parts of the world side by side along a river at golden hour, flags without symbols fluttering, no people, no text', name: 'Capitals of the World', glyph: '🏛️', sub: 'Continent by continent', ages: [8, 12], colour: '#3F51D8',
    final: ROUTE('A world tour of capitals', 'Plan a tour that visits a capital on each of six continents.', 'a world tour', { rule: 'free', max: 10, goals: [G.continents(6, 'a capital on each of six continents'), G.len(6, 'six stops or more')] }),
    blurb: 'The capital cities of every continent — learned by typing them, not just picking them.',
    modules: [
      { id: 'ca1', name: 'Europe', objective: 'name the capitals of Europe’s countries',
        days: [T('cap-europe', 1, 'the big European capitals'), TOOL('capitals', 'Type them', 'type a capital from memory', 'Open Country Capitals, choose Europe, tap ten countries and TYPE each capital.'), P(['cap-europe'], 2, 'twenty capitals'), C(['cap-europe'], 2, 'cold')],
        project: ROUTE('A capitals tour of Europe', 'Plan a tour of five European capitals — each country must border the last.', 'a tour of five capitals', { rule: 'neighbours', cont: 'Europe', max: 8, goals: [G.len(5, 'five countries in Europe, each bordering the last')] }) },
      { id: 'ca2', name: 'Asia', objective: 'name the capitals of Asia’s countries',
        days: [T('cap-asia', 1, 'the big Asian capitals'), TOOL('capitals', 'Type them', 'type a capital from memory', 'In Country Capitals, choose Asia and type ten capitals.'), P(['cap-asia'], 2, 'twenty capitals'), C(['cap-asia'], 2, 'cold')],
        project: ROUTE('A capitals tour of Asia', 'Plan a tour of five Asian capitals — each country must border the last.', 'a tour of five capitals', { rule: 'neighbours', cont: 'Asia', max: 8, goals: [G.len(5, 'five countries in Asia, each bordering the last')] }) },
      { id: 'ca3', name: 'Africa', objective: 'name the capitals of Africa’s countries',
        days: [T('cap-africa', 1, 'African capitals'), TOOL('capitals', 'Type them', 'type a capital from memory', 'In Country Capitals, choose Africa and type ten capitals.'), P(['cap-africa'], 2, 'twenty capitals'), C(['cap-africa'], 2, 'cold')],
        project: ROUTE('A capitals tour of Africa', 'Plan a tour of five African capitals — each country must border the last.', 'a tour of five capitals', { rule: 'neighbours', cont: 'Africa', max: 8, goals: [G.len(5, 'five countries in Africa, each bordering the last')] }) },
      { id: 'ca4', name: 'The Americas', objective: 'name the capitals of North and South America',
        days: [T('cap-americas', 1, 'capitals of the Americas'), TOOL('capitals', 'Type them', 'type a capital from memory', 'In Country Capitals, choose North America, then South America; type five of each.'), P(['cap-americas'], 2, 'twenty capitals'), C(['cap-americas'], 2, 'cold')],
        project: ROUTE('Down the Americas', 'Plan a journey from North America into South America, each country bordering the last.', 'a road through two continents', { rule: 'neighbours', max: 12, goals: [G.len(5, 'at least five countries, each bordering the last'), G.continents(2, 'in both North and South America')] }) },
      { id: 'ca5', name: 'Oceania', objective: 'name the capitals of Oceania',
        days: [T('cap-oceania', 1, 'Oceania’s capitals'), TOOL('capitals', 'Type them', 'type a capital from memory', 'In Country Capitals, choose Oceania and type every capital.'), P(['cap-oceania'], 2, 'all of Oceania'), C(['cap-oceania'], 2, 'cold')],
        project: ROUTE('Island hopping', 'Choose four island countries of Oceania to visit by boat.', 'a voyage across the Pacific', { rule: 'free', cont: 'Oceania', max: 6, goals: [G.len(4, 'four countries in Oceania')] }) },
    ] },

  /* ============================================================ 5 */
  { id: 'flags-neighbours', paint: 'A long row of colourful plain fabric banners and bunting strung between hills across a green valley with two neighbouring villages and a bridge between them, no symbols, no text', name: 'Flags and Neighbours', glyph: '🚩', sub: 'Who lives next to whom', ages: [8, 12], colour: '#D8412F',
    final: FLAG('A flag for a friendship of neighbours', 'Some neighbours make a flag together. Design one: three colours, an emblem, a meaning for each colour.', 'a flag of friendship', { colours: 3, emblem: true }),
    blurb: 'The world’s flags, which countries share a border, the biggest countries, and the ones with no sea.',
    modules: [
      { id: 'fn1', name: 'Flags', objective: 'know a country from its flag',
        days: [T('flags', 1, 'flags of the big countries'), TOOL('flags', 'The Flags shelf', 'match flags to countries', 'Open Flags and play one round of its quiz.'), P(['flags'], 2, 'twenty flags'), C(['flags'], 2, 'cold')],
        project: FLAG('A flag for your family', 'Design a flag for your family and say what each colour means.', 'a flag with a meaning', { colours: 2 }) },
      { id: 'fn2', name: 'Neighbours', objective: 'name the countries that border a country',
        days: [T('neighbours', 1, 'find a country’s neighbours'), TOOL('explorer', 'Neighbours on the map', 'see every neighbour', 'In the Map Explorer, tap three countries and read their neighbours.'), P(['neighbours'], 2, 'twenty'), C(['neighbours', 'flags'], 2, 'cold')],
        project: ROUTE('A chain of neighbours', 'Make the longest chain you can: every country must border the one before. Six or more!', 'a chain of neighbours', { rule: 'neighbours', max: 14, goals: [G.len(6, 'six countries, each bordering the last')] }) },
      { id: 'fn3', name: 'Giants', objective: 'name the largest countries in the world',
        days: [T('big-countries', 1, 'the biggest countries'), T('big-countries', 2, 'compare their sizes'), P(['big-countries'], 2, 'mixed'), C(['big-countries'], 2, 'cold')],
        project: ROUTE('Giants in order', 'Tap four countries in order of size — each one smaller than the last.', 'four countries in order of size', { rule: 'free', max: 6, goals: [G.bigger(4, 'four countries, each smaller than the one before')] }) },
      { id: 'fn4', name: 'No coastline', objective: 'recognise a landlocked country',
        days: [T('landlocked', 1, 'what landlocked means'), T('landlocked', 2, 'find landlocked countries'), P(['landlocked', 'neighbours'], 2, 'mixed'), C(['landlocked'], 2, 'cold')],
        project: ROUTE('The long way to the sea', 'Start in a landlocked country and find a way to the sea, crossing borders one at a time.', 'a route from inland to the coast', { rule: 'neighbours', max: 8, goals: [G.landlockedStart('start in a landlocked country'), G.coastEnd('finish in a country with a coast')] }) },
      { id: 'fn5', name: 'Inside a country', objective: 'name the states of a big country and their capitals',
        days: [TOOL('states', 'State Capitals', 'name a state and its capital', 'Open State Capitals, pick a country, and find its states on the map.'), TOOL('states', 'Type them', 'type state capitals', 'In State Capitals, type the capitals of ten states.'), P(['neighbours', 'big-countries'], 2, 'mixed'), C(['flags', 'neighbours', 'landlocked', 'big-countries'], 3, 'all of it, cold')],
        project: SORT('Coast or no coast?', 'Sort these countries: do they have a coast, or are they landlocked?', 'ten countries sorted', 'landlocked', 10) },
    ] },

  /* ============================================================ 6 */
  { id: 'weather-climate', paint: 'A dramatic landscape split into seasons from left to right: snowy winter, spring blossom, summer sun, autumn storm clouds with a rainbow, one continuous valley', name: 'Weather and Climate', glyph: '⛅', sub: 'Why the sky does what it does', ages: [8, 12], colour: '#2E7FA8',
    final: MM('A continent of four biomes', 'Build a continent with four different biomes and an animal living in each.', 'a continent of biomes', { w: 16, h: 10, tiles: ['sea', 'desert', 'forest', 'grass', 'ice', 'mountain', 'lake'], syms: ['camel', 'monkey', 'lion', 'penguin', 'parrot', 'zebra'], goals: [G.edge('sea', 'sea all round'), G.kinds(['desert', 'forest', 'grass', 'ice'], 4, 'four biomes: desert, forest, grassland and ice'), G.any(['camel', 'monkey', 'lion', 'penguin', 'parrot', 'zebra'], 4, 'four animals')] }),
    blurb: 'Weather and climate, the water cycle, why we have seasons, climate zones and the world’s biomes.',
    modules: [
      { id: 'wc1', name: 'Weather or climate?', objective: 'tell weather from climate',
        days: [T('weather-climate', 1, 'the difference'), T('weather-climate', 2, 'use both words right'), P(['weather-climate'], 2, 'ten'), C(['weather-climate'], 2, 'cold')],
        project: ORD('A year in the north', 'Put the seasons in order, starting with January in the northern half of the world.', 'a year of seasons', ['Winter', 'Spring', 'Summer', 'Autumn'], 'starting from January, north of the Equator') },
      { id: 'wc2', name: 'The water cycle', objective: 'explain the water cycle in four steps',
        days: [T('water-cycle', 1, 'the four steps'), T('water-cycle', 2, 'where water goes'), P(['water-cycle'], 2, 'ten'), C(['water-cycle', 'weather-climate'], 2, 'cold')],
        project: ORD('The water cycle', 'Put the four steps of the water cycle in order, starting with the sea.', 'the water cycle, in order', ['Evaporation — water rises as vapour', 'Condensation — vapour makes clouds', 'Precipitation — rain and snow fall', 'Collection — water gathers in rivers and seas'], 'starting at the sea') },
      { id: 'wc3', name: 'Why we have seasons', objective: 'explain why seasons happen',
        days: [T('seasons', 1, 'the tilted Earth'), T('seasons', 2, 'opposite seasons in each half'), P(['seasons'], 2, 'ten'), C(['seasons'], 2, 'cold')],
        project: SORT('North or south?', 'Sort these countries: north or south of the Equator? When it is summer in one bin, it is winter in the other.', 'ten countries sorted by hemisphere', 'hemisphere', 10) },
      { id: 'wc4', name: 'Climate zones', objective: 'name the climate zones and where they are',
        days: [T('climate-zones', 1, 'hot, mild and cold zones'), TOOL('explorer', 'Zones on the map', 'find the tropics', 'In the Map Explorer, switch on the lines and find the Tropics. Name three countries between them.'), P(['climate-zones'], 2, 'ten'), C(['climate-zones', 'seasons'], 2, 'cold')],
        project: MM('Paint the climate zones', 'Paint a planet’s zones: ice along the top and bottom rows, and hot desert or forest across the middle row.', 'a planet in climate zones', { w: 12, h: 7, base: 'land', tiles: ['land', 'ice', 'forest', 'desert', 'grass', 'sea'], goals: [G.row(0, 'ice', 'ice along the top (the Arctic)'), G.row(-1, 'ice', 'ice along the bottom (Antarctica)'), G.rowAny(3, ['desert', 'forest'], 'desert or rainforest across the middle (the Equator)')] }) },
      { id: 'wc5', name: 'Biomes', objective: 'match a biome to its climate and its life',
        days: [T('biomes', 1, 'the world’s biomes'), TOOL('geoguess', 'Read the land', 'guess a place from its plants and sky', 'Play one Where on Earth? round. For each picture, name the biome before you guess.'), P(['biomes', 'climate-zones'], 2, 'mixed'), C(['biomes', 'climate-zones', 'water-cycle', 'weather-climate'], 3, 'all of it, cold')],
        project: MM('A biome in a box', 'Build a desert biome: sand and dunes, an oasis lake, and animals that live there.', 'a desert biome', { base: 'desert', tiles: ['desert', 'sand', 'lake', 'grass', 'mountain'], syms: ['camel', 'scorpion', 'tree', 'camp'], goals: [G.count('desert', 30, '30 squares of desert'), G.lake('an oasis: a lake with land all round'), G.on('camel', ['desert', 'sand'], 'a camel 🐪 on the desert')] }) },
    ] },

  /* ============================================================ 7 */
  { id: 'rivers-mountains', paint: 'A great river winding from snowy mountain peaks through forest and plains to a delta and the sea, a desert edge on one side, bird’s-eye storybook landscape', name: 'Rivers, Mountains and Deserts', glyph: '🏔️', sub: 'The shape of the land', ages: [8, 12], colour: '#3F8A3A',
    final: MM('From the peaks to the sea', 'A whole landscape: mountains, a valley, a plateau, a plain, a lake, and a river from the peaks to the sea.', 'a whole landscape', { w: 16, h: 10, tiles: ['sea', 'land', 'mountain', 'valley', 'plateau', 'grass', 'forest', 'lake', 'river', 'desert'], syms: ['tower', 'bridge', 'house'], goals: [G.edge('sea', 'sea all round'), G.kinds(['mountain', 'valley', 'plateau', 'grass', 'forest'], 5, 'five kinds of land'), G.lake('a lake'), G.river('a river from the peaks to the sea')] }),
    blurb: 'Landforms, the parts of a river, the great rivers and mountains of the world, and its deserts.',
    modules: [
      { id: 'rm1', name: 'Landforms', objective: 'name a landform from its shape',
        days: [T('landforms', 1, 'mountains, valleys, plains, plateaus'), T('landforms', 2, 'tell them apart'), P(['landforms'], 2, 'ten'), C(['landforms'], 2, 'cold')],
        project: MM('Landforms in a tray', 'Build all four landforms: mountains, a valley, a plateau and a plain.', 'four landforms', { base: 'land', tiles: ['land', 'mountain', 'valley', 'plateau', 'grass', 'lake'], goals: [G.count('mountain', 4, 'mountains (4 squares)'), G.count('valley', 4, 'a valley (4 squares)'), G.count('plateau', 4, 'a plateau (4 squares)'), G.count('grass', 6, 'a plain (6 squares)')] }) },
      { id: 'rm2', name: 'A river from source to sea', objective: 'name the parts of a river in order',
        days: [T('river-parts', 1, 'source, tributary, mouth'), T('river-parts', 2, 'meanders and deltas'), P(['river-parts'], 2, 'ten'), C(['river-parts', 'landforms'], 2, 'cold')],
        project: MM('A river from source to sea', 'Draw a river that starts beside a mountain and flows all the way to the sea.', 'a river with a source and a mouth', { tiles: WT, syms: ['bridge', 'house'], goals: [G.count('land', 20, '20 squares of land'), G.river('a river from a mountain (source) to the sea (mouth)'), G.sym('bridge', 1, 'a bridge 🌉 over it')] }) },
      { id: 'rm3', name: 'The great rivers', objective: 'name the great rivers and their continents',
        days: [T('great-rivers', 1, 'the longest rivers'), TOOL('landmarks', 'Rivers and wonders', 'find natural wonders', 'In Famous Landmarks, choose “Natural wonders” and open three by water.'), P(['great-rivers'], 2, 'ten'), C(['great-rivers', 'river-parts'], 2, 'cold')],
        project: MM('A delta', 'Where a great river meets the sea it drops its sand. Draw a river to the sea with a sandy delta at its mouth.', 'a river with a delta', { tiles: ['sea', 'land', 'sand', 'mountain', 'river', 'forest'], goals: [G.river('a river from a mountain to the sea'), G.count('sand', 5, 'a delta of sand (5 squares)')] }) },
      { id: 'rm4', name: 'The high mountains', objective: 'name the great mountain ranges and where they are',
        days: [T('high-mountains', 1, 'the highest ranges'), T('high-mountains', 2, 'where and how high'), P(['high-mountains'], 2, 'ten'), C(['high-mountains', 'landforms'], 2, 'cold')],
        project: MM('A mountain range', 'Build a range of mountains with a valley beside it, and a lookout on a peak.', 'a mountain range', { base: 'land', tiles: ['land', 'mountain', 'valley', 'forest', 'lake', 'ice'], syms: ['tower', 'camp'], goals: [G.count('mountain', 10, 'a range (10 mountain squares)'), G.count('valley', 4, 'a valley'), G.on('tower', ['mountain', 'ice'], 'a lookout 🗼 on a peak')] }) },
      { id: 'rm5', name: 'Deserts', objective: 'say what makes a desert and name the great ones',
        days: [T('deserts', 1, 'what a desert is'), T('deserts', 2, 'the great deserts'), P(['deserts', 'high-mountains'], 2, 'mixed'), C(['deserts', 'great-rivers', 'high-mountains', 'landforms'], 3, 'all of it, cold')],
        project: MM('Crossing the desert', 'Make a great desert with an oasis and a camel caravan camp.', 'a desert crossing', { base: 'desert', tiles: ['desert', 'sand', 'lake', 'mountain', 'grass'], syms: ['camel', 'camp'], goals: [G.count('desert', 30, '30 squares of desert'), G.lake('an oasis'), G.on('camp', ['desert', 'sand'], 'a camp ⛺ on the sand'), G.sym('camel', 2, 'two camels')] }) },
    ] },

  /* ============================================================ 8 */
  { id: 'latitude-time', paint: 'A giant antique brass armillary sphere of rings and an empty glass sphere (no land, no continents, no map drawn on it) standing in a starry observatory, a large window showing the night sky and a sunrise on the horizon, no text or numbers', name: 'Latitude, Longitude and Time', glyph: '🌐', sub: 'The lines that pin down every place', ages: [10, 14], colour: '#6436B5',
    final: ROUTE('Around the globe', 'Visit six countries that together touch all four quarters of the world.', 'a journey round the globe', { rule: 'free', max: 10, goals: [G.quadrants('all four quarters'), G.len(6, 'six countries or more')] }),
    blurb: 'The grid of the globe, the hemispheres, the special lines, and why the time is different in different places.',
    modules: [
      { id: 'lt1', name: 'Latitude and longitude', objective: 'find a place from its coordinates',
        days: [T('lat-long', 2, 'what the numbers mean'), T('lat-long', 3, 'read coordinates'), P(['lat-long'], 3, 'ten'), C(['lat-long'], 3, 'cold')],
        project: SORT('Which hemisphere?', 'Sort these countries: north or south of the Equator?', 'twelve countries sorted', 'hemisphere', 12) },
      { id: 'lt2', name: 'Hemispheres', objective: 'say which hemispheres a country is in',
        days: [T('hemispheres', 2, 'north, south, east, west'), TOOL('explorer', 'Lines on the map', 'see the Equator and Prime Meridian', 'In the Map Explorer, switch on the lines. Find two countries the Equator crosses.'), P(['hemispheres'], 3, 'ten'), C(['hemispheres', 'lat-long'], 3, 'cold')],
        project: ROUTE('Four quarters of the world', 'Tap one country in each quarter of the world: north-east, north-west, south-east and south-west.', 'the four quarters of the world', { rule: 'free', max: 6, goals: [G.quadrants('a country in all four quarters')] }) },
      { id: 'lt3', name: 'The special lines', objective: 'name the Tropics and the polar circles and what they mark',
        days: [T('special-lines', 2, 'the five lines'), T('special-lines', 3, 'what each marks'), P(['special-lines'], 3, 'ten'), C(['special-lines', 'hemispheres'], 3, 'cold')],
        project: MM('The lines on a planet', 'Paint a planet with ice rows at the poles and a hot row along the Equator.', 'a planet with its zones', { w: 12, h: 7, base: 'land', tiles: ['land', 'ice', 'forest', 'desert', 'sea'], goals: [G.row(0, 'ice', 'the Arctic: ice along the top'), G.row(-1, 'ice', 'Antarctica: ice along the bottom'), G.rowAny(3, ['desert', 'forest'], 'the Equator: a hot row in the middle')] }) },
      { id: 'lt4', name: 'Sun time', objective: 'work out the time somewhere else from its longitude',
        days: [T('sun-time', 2, 'why time changes'), T('sun-time', 3, 'work out a time'), P(['sun-time', 'lat-long'], 3, 'mixed'), C(['sun-time', 'special-lines', 'lat-long', 'hemispheres'], 3, 'all of it, cold')],
        project: ORD('The Sun comes round', 'The Sun rises in the east first. Put these countries in the order the day reaches them, east to west.', 'the day’s journey round the world', EASTWEST, 'east to west (as the morning arrives)') },
    ] },

  /* ============================================================ 9 */
  { id: 'restless-earth', paint: 'A smoking volcano beside a crack in the land, layered rock cliffs showing coloured strata, a crystal cave entrance and fossils in the rock, dramatic sky', name: 'The Restless Earth', glyph: '🌋', sub: 'Plates, volcanoes and deep time', ages: [10, 14], colour: '#C0341C',
    final: ORD('The whole of deep time', 'Put eight great events of the Earth’s story in order, oldest first.', 'the Earth’s story', EARTHSEQ(8), 'oldest first'),
    blurb: 'Inside the Earth, the moving plates, volcanoes and earthquakes, the rocks they make, and the supercontinent.',
    modules: [
      { id: 're1', name: 'Inside the Earth', objective: 'name the Earth’s layers in order',
        days: [T('earth-layers', 2, 'crust to core'), T('earth-layers', 3, 'what each is like'), P(['earth-layers'], 3, 'ten'), C(['earth-layers'], 3, 'cold')],
        project: ORD('Inside the Earth', 'Put the Earth’s layers in order, from where you stand to the very centre.', 'the Earth’s layers', ['Crust', 'Mantle', 'Outer core', 'Inner core'], 'from the surface to the centre') },
      { id: 're2', name: 'The moving plates', objective: 'say what happens where plates meet',
        days: [T('plates', 2, 'the plates'), T('plates', 3, 'what their edges do'), P(['plates'], 3, 'ten'), C(['plates', 'earth-layers'], 3, 'cold')],
        project: MM('A volcanic island chain', 'Where plates meet, volcanoes can build islands. Make a chain of three volcanic islands in the sea.', 'a chain of volcanic islands', { tiles: WT, syms: ['volcano', 'house', 'port'], goals: [G.edge('sea', 'sea all round'), G.count('mountain', 3, 'three mountain peaks'), G.on('volcano', ['mountain'], 'a volcano 🌋 on a peak'), G.sym('volcano', 3, 'three volcanoes')] }) },
      { id: 're3', name: 'Volcanoes and earthquakes', objective: 'explain where and why volcanoes and earthquakes happen',
        days: [T('volcanoes-quakes', 2, 'where they happen'), TOOL('time', 'Earth Through Time', 'see how plates built the Himalaya', 'In Earth Through Time, open The Earth and step to “India meets Asia”.'), P(['volcanoes-quakes', 'plates'], 3, 'mixed'), C(['volcanoes-quakes'], 3, 'cold')],
        project: ORD('When the ground shakes', 'Put the earthquake safety steps in order.', 'the steps that keep you safe', ['Drop down low', 'Cover your head under a table', 'Hold on until the shaking stops', 'Go outside carefully to an open space'], 'first to last') },
      { id: 're4', name: 'Rocks', objective: 'tell the three kinds of rock by how they were made',
        days: [T('rocks', 2, 'igneous, sedimentary, metamorphic'), T('rocks', 3, 'the rock cycle'), P(['rocks'], 3, 'ten'), C(['rocks', 'volcanoes-quakes'], 3, 'cold')],
        project: ORD('The rock cycle', 'Put the rock cycle in order, starting with hot melted rock.', 'the rock cycle', ['Magma cools into igneous rock', 'Rock is worn into tiny grains', 'Grains are pressed into sedimentary rock', 'Heat and squeezing make metamorphic rock', 'Deep down, rock melts into magma again'], 'starting with melted rock') },
      { id: 're5', name: 'Pangaea and deep time', objective: 'describe how the continents moved over time',
        days: [T('pangaea', 2, 'one supercontinent'), TOOL('time', 'The Earth, step by step', 'order the Earth’s big events', 'In Earth Through Time, walk all eighteen steps of The Earth and take the “which came first?” quiz.'), P(['pangaea', 'plates'], 3, 'mixed'), C(['pangaea', 'plates', 'earth-layers', 'rocks'], 3, 'all of it, cold')],
        project: ORD('Deep time', 'Put these great events of Earth’s story in order, oldest first.', 'the Earth’s story in order', EARTHSEQ(6), 'oldest first') },
    ] },

  /* ============================================================ 10 */
  { id: 'world-detective', paint: 'A detective’s table with a magnifying glass, painted postcards of faraway places, a camera, footprints on a sandy path leading to a distant city skyline, no text', name: 'World Detective', glyph: '🕵️', sub: 'Read the clues, name the place', ages: [10, 14], colour: '#2E7D32',
    final: ROUTE('The detective’s world case', 'Follow the clues around the world: six countries on six continents.', 'a case solved across the world', { rule: 'free', max: 10, goals: [G.continents(6, 'six continents'), G.len(6, 'six countries')] }),
    blurb: 'How people live, where resources come from, how to read a photograph for clues, and the story of the continents.',
    modules: [
      { id: 'wd1', name: 'Where people live', objective: 'explain why towns grow where they do',
        days: [T('settlements', 2, 'why here?'), T('settlements', 3, 'site and situation'), P(['settlements'], 3, 'ten'), C(['settlements'], 3, 'cold')],
        project: MM('Found a town', 'Choose where to build a town: by a river, near the sea. Put houses beside the river and a port on the coast.', 'a town in a good place', { tiles: WT, syms: ['house', 'port', 'bridge'], goals: [G.river('a river from a mountain to the sea'), G.on('house', ['land', 'grass', 'forest'], 'a house 🏠 beside the river', 'river'), G.on('port', ['land', 'sand'], 'a port on the coast ⚓', 'sea')] }) },
      { id: 'wd2', name: 'Resources', objective: 'say where a resource comes from and how it is used',
        days: [T('resources', 2, 'natural resources'), T('resources', 3, 'renewable or not'), P(['resources'], 3, 'ten'), C(['resources', 'settlements'], 3, 'cold')],
        project: MM('A resource map', 'Map where things come from: forests for wood, a lake for water, mountains for stone — and a town that uses them.', 'a map of resources', { tiles: WT, syms: ['tree', 'house', 'camp'], goals: [G.count('forest', 8, 'a forest for wood'), G.lake('a lake for water'), G.count('mountain', 3, 'mountains for stone'), G.sym('house', 2, 'a town (two houses)')] }) },
      { id: 'wd3', name: 'Reading a photograph', objective: 'name a place’s continent from clues in a photo',
        days: [TOOL('geoguess', 'Clue hunting', 'use clues to guess a place', 'Play a Where on Earth? round. Before guessing, name two clues: the side of the road, the plants, the sky.'), TOOL('geoguess', 'A second round', 'guess closer', 'Play another round. Try to beat your first score — by reasoning, not luck.'), P(['which-continent', 'biomes'], 3, 'mixed'), C(['biomes', 'which-continent'], 3, 'cold')],
        project: SORT('Where in the world?', 'Detective work: sort these countries into their continents.', 'twelve countries placed', 'continent', 12) },
      { id: 'wd4', name: 'Famous places', objective: 'place a famous landmark on the map',
        days: [TOOL('landmarks', 'Landmarks on the map', 'find a landmark', 'In Famous Landmarks, take the quiz “find it on the map”.'), TOOL('landmarks', 'Built or natural?', 'sort wonders', 'Open ten landmarks you have not seen and say if each is built by people or natural.'), P(['which-continent', 'big-countries'], 3, 'mixed'), C(['which-continent', 'big-countries'], 3, 'cold')],
        project: SORT('Built or natural?', 'Sort these landmarks: built by people, or made by nature?', 'twelve wonders sorted', 'builtNatural', 12) },
      { id: 'wd5', name: 'Stories of the continents', objective: 'put a continent’s great ages in order',
        days: [TOOL('time', 'One continent’s story', 'walk a continent through time', 'In Earth Through Time, choose a continent and walk its ages from first to last.'), TOOL('time', 'Which came first?', 'order the ages', 'In Earth Through Time, take the continent’s “which came first?” quiz, then “which continent?”.'), P(['settlements', 'resources'], 3, 'mixed'), C(['settlements', 'resources', 'which-continent'], 3, 'cold')],
        project: ROUTE('An old trade road', 'Trace a trade road across Asia through five countries, each bordering the last.', 'a trade road across Asia', { rule: 'neighbours', cont: 'Asia', max: 10, goals: [G.len(5, 'five countries in Asia, each bordering the last')] }) },
    ] },
];

/* days in order: each part's learn, learn, practise, TEST, then its PROJECT; and at
   the end the COURSE TEST (every part, mixed) and the FINAL PROJECT */
export function daysOf(e) {
  const out = [];
  e.modules.forEach((m) => {
    m.days.forEach((d, i) => out.push({ ...d, mod: m.id, key: `${m.id}.${i}` }));
    out.push({ k: 'm', ...m.project, mod: m.id, key: `${m.id}.project` });
  });
  const stops = [...new Set(e.modules.flatMap((m) => m.days.filter((d) => d.k === 'c').flatMap((d) => d.stops)))];
  out.push({ k: 'f', stops, lv: Math.max(...e.modules.flatMap((m) => m.days.filter((d) => d.k === 'c').map((d) => d.lv))), m: 20, mod: 'final', key: 'final.test', o: 'show everything this course taught, mixed and cold' });
  out.push({ k: 'm', ...e.final, mod: 'final', key: 'final.project' });
  return out.map((d, i) => ({ ...d, n: i + 1 }));
}
export const expeditionById = Object.fromEntries(EXPEDITIONS.map((e) => [e.id, e]));
