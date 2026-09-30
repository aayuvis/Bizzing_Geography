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

const T = (stop, lv = 1, o = '') => ({ k: 't', stop, lv, m: 15, o });
const TOOL = (tool, name, o, how) => ({ k: 't', tool, name, m: 15, o, how });
const P = (stops, lv, o) => ({ k: 'p', stops, lv, m: 12, o });
const C = (stops, lv, o) => ({ k: 'c', stops, lv, m: 10, o });
const PR = (name, brief, made) => ({ name, brief, made, m: 40 });

export const EXPEDITIONS_INTRO = 'An expedition is a path through the Atlas and the Library — about fifteen minutes a day, with something to make at the end of every part, and a way to know it stuck.';
export const EXPEDITIONS_PARENT = 'Progress here is what a child can DO, never minutes on a screen. Each part ends with a check on a later day than its teaching, because remembering something a minute later is attention, and remembering it days later is learning. A missed day costs nothing; the next day simply waits.';

export const EXPEDITIONS = [
  /* ============================================================ 1 */
  { id: 'first-maps', name: 'First Maps', glyph: '🗺️', sub: 'From your room to the whole world', ages: [6, 8], colour: '#E4572E',
    blurb: 'What a map is, what its little pictures mean, which way is north, and where you are — from your room to the world.',
    modules: [
      { id: 'fm1', name: 'Looking from above', objective: 'look at a picture from above and say what each shape is',
        days: [T('birds-eye', 1, 'say why a map is a picture from above'), TOOL('explorer', 'Find your own country', 'find a country on the world map', 'Open the Map Explorer and find the country you live in. Tap it, then find one country next to it.'), P(['birds-eye'], 1, 'name what a shape from above is'), C(['birds-eye'], 1, 'do it again cold, on another day')],
        project: PR('Your room from above', 'Draw your bedroom as a bird would see it from the ceiling: the bed is a rectangle, the rug a circle. Ask someone at home to guess what each shape is.', 'a map of a place you know') },
      { id: 'fm2', name: 'Symbols and the key', objective: 'read a map symbol using the key',
        days: [T('map-symbols', 1, 'match symbols to what they stand for'), TOOL('dictionary', 'Map words', 'use five map words', 'Open the Dictionary, choose Maps, and read five words. Say each one aloud in a sentence.'), P(['map-symbols'], 1, 'read ten symbols'), C(['map-symbols', 'birds-eye'], 1, 'read symbols you have not practised today')],
        project: PR('A treasure map with a key', 'Hide a small treasure at home and draw a map to it. Give it a key: a tree, a door, a bed — your own little symbols. Hand it to someone and watch them find it.', 'a map that somebody used') },
      { id: 'fm3', name: 'North, south, east and west', objective: 'point north, south, east and west on a map',
        days: [T('four-points', 1, 'name the four points'), T('four-points', 2, 'use them to say where something is'), P(['four-points'], 1, 'find directions on ten maps'), C(['four-points'], 2, 'do it cold')],
        project: PR('Where does the Sun come up?', 'On a sunny morning, look out of a window and see where the Sun is. That side is roughly east. Stick a paper E there, then a W on the opposite side, then N and S.', 'the four points, stuck up at home') },
      { id: 'fm4', name: 'Where in the world am I?', objective: 'put places inside each other: room, home, town, country, continent, world',
        days: [T('nested-places', 1, 'order places from smallest to biggest'), TOOL('explorer', 'Your continent', 'name your continent', 'In the Map Explorer, tap your country and read which continent it is on.'), P(['nested-places'], 1, 'order ten sets of places'), C(['nested-places', 'four-points'], 1, 'do it cold')],
        project: PR('Boxes inside boxes', 'Draw six boxes, each inside the last: my room, my home, my town, my country, my continent, the world. Write a word in each (no need for your real address).', 'a picture of where you are in the world') },
      { id: 'fm5', name: 'Land and water', objective: 'tell land from water on a map, and name a lake, a river and a sea',
        days: [T('land-or-water', 1, 'tell land from water'), T('water-bodies', 1, 'name kinds of water'), P(['land-or-water', 'water-bodies'], 1, 'sort land and water'), C(['land-or-water', 'water-bodies'], 1, 'do it cold')],
        project: PR('An island in a tray', 'Make an island from play-dough or sand in a tray. Pour a little water round it. Give it a lake, a river running to the sea, and a bay.', 'an island you can touch') },
    ] },

  /* ============================================================ 2 */
  { id: 'continents-oceans', name: 'Seven Continents, Five Oceans', glyph: '🌍', sub: 'The whole world in twelve names', ages: [6, 9], colour: '#2E9CA6',
    blurb: 'Every continent and ocean: where each is, which is which, and the islands between them.',
    modules: [
      { id: 'co1', name: 'The seven continents', objective: 'name the seven continents and point to each',
        days: [T('seven-continents', 1, 'name all seven'), TOOL('explorer', 'Continents on the map', 'tap each continent', 'Open the Map Explorer. Find a country on each of the seven continents — one each.'), P(['seven-continents'], 1, 'find each continent'), C(['seven-continents'], 1, 'name them cold')],
        project: PR('Seven on the wall', 'Draw the world as seven big blobs on one sheet of paper and name each one. Pin it where you eat breakfast.', 'the continents on your wall') },
      { id: 'co2', name: 'The five oceans', objective: 'name the five oceans and say which is the biggest',
        days: [T('five-oceans', 1, 'name all five'), T('five-oceans', 2, 'say which is largest and warmest'), P(['five-oceans'], 1, 'find each ocean'), C(['five-oceans', 'seven-continents'], 1, 'do it cold')],
        project: PR('A paper-plate planet', 'Paint a paper plate blue, stick on seven continent blobs, and write the five oceans’ names in the blue.', 'a planet you made') },
      { id: 'co3', name: 'Which continent?', objective: 'say which continent a country is on',
        days: [T('which-continent', 1, 'place a country on its continent'), T('find-continent', 1, 'find a continent on the map'), P(['which-continent', 'find-continent'], 1, 'place twenty countries'), C(['which-continent', 'find-continent'], 1, 'do it cold')],
        project: PR('Kitchen detectives', 'Look at five packets or tins in your kitchen that say where they came from. Say which continent each country is on.', 'five foods traced to their continent') },
      { id: 'co4', name: 'Islands of the world', objective: 'recognise countries that are islands',
        days: [T('island-nations', 1, 'tell an island country'), TOOL('geoguess', 'Island hopping', 'guess a place from a picture', 'Play one round of GeoGuesser. For every picture, first ask: could this be an island?'), P(['island-nations'], 1, 'spot island countries'), C(['island-nations', 'which-continent'], 1, 'do it cold')],
        project: PR('Design an island country', 'Invent your own island country: draw its shape, give it a name, a flag and a capital. Say which ocean it sits in.', 'a country of your own') },
      { id: 'co5', name: 'A wonder on every continent', objective: 'match a famous landmark to its continent',
        days: [TOOL('landmarks', 'Wonders by continent', 'name a landmark on each continent', 'Open Famous Landmarks. Choose each continent in turn and open one landmark from each.'), TOOL('landmarks', 'Which country?', 'place a landmark in its country', 'In Famous Landmarks, take the quiz "which country?".'), P(['which-continent', 'seven-continents'], 1, 'mixed practice'), C(['find-continent', 'which-continent', 'five-oceans'], 1, 'the whole world, cold')],
        project: PR('A postcard from far away', 'Choose a landmark from a continent you have never been to. Draw a postcard of it, and on the back write three things you would see there.', 'a postcard from somewhere new') },
    ] },

  /* ============================================================ 3 */
  { id: 'compass-grid', name: 'Compass and Grid', glyph: '🧭', sub: 'Find anything, anywhere, on any map', ages: [8, 11], colour: '#A94A1C',
    blurb: 'Eight compass points, grid squares, map scale and the way round the world — the tools every navigator needs.',
    modules: [
      { id: 'cg1', name: 'Eight points of the compass', objective: 'give directions using all eight points',
        days: [T('eight-points', 1, 'name the eight points'), T('eight-points', 2, 'use them between places'), P(['eight-points'], 2, 'twenty directions'), C(['eight-points'], 2, 'do it cold')],
        project: PR('A compass rose of your own', 'Draw a large compass rose with all eight points. Put it on the floor in the right direction (use where the Sun rose to find east).', 'a compass rose that points the right way') },
      { id: 'cg2', name: 'Grid squares', objective: 'find a place from its grid square',
        days: [T('grid-refs', 1, 'read a grid square'), T('grid-refs', 2, 'give one'), P(['grid-refs'], 2, 'find ten squares'), C(['grid-refs', 'eight-points'], 2, 'do it cold')],
        project: PR('Battleships on a map', 'Draw a 5×5 grid over a map you drew, label the columns A–E and the rows 1–5. Play hide-and-find with someone: “the treasure is in C4”.', 'a game with a grid') },
      { id: 'cg3', name: 'Map scale', objective: 'use a map’s scale to say how far apart two places are',
        days: [T('map-scale', 1, 'say what a scale means'), T('map-scale', 2, 'measure with it'), P(['map-scale'], 2, 'ten distances'), C(['map-scale', 'grid-refs'], 2, 'do it cold')],
        project: PR('Your street to scale', 'Pace out your garden, a room or a path (one step ≈ one metre is fine). Draw it on paper with a scale: 1 square = 1 step.', 'a drawing with a real scale') },
      { id: 'cg4', name: 'Which way round the world?', objective: 'say which way you would travel between two countries',
        days: [T('world-way', 1, 'choose a direction between countries'), TOOL('explorer', 'Plan a journey', 'trace a route across countries', 'In the Map Explorer, tap your country, then a country far away. Name the countries you would cross on the way.'), P(['world-way', 'eight-points'], 2, 'mixed'), C(['world-way'], 2, 'do it cold')],
        project: PR('A journey on paper', 'Plan a make-believe journey across three countries. Write the compass direction of each leg: “from here I go north-east…”.', 'a route with directions') },
      { id: 'cg5', name: 'The navigator’s test', objective: 'use compass, grid and scale together',
        days: [TOOL('geoguess', 'Where is this?', 'place a picture on the map', 'Play a GeoGuesser round. Before each guess, say which direction from you the place is.'), P(['eight-points', 'grid-refs'], 2, 'mixed'), P(['map-scale', 'world-way'], 2, 'mixed'), C(['eight-points', 'grid-refs', 'map-scale', 'world-way'], 2, 'all four, cold')],
        project: PR('An orienteering walk', 'With a grown-up, draw a simple map of a park or street before you go. On the walk, follow it: at each corner say which direction you turned.', 'a walk you navigated') },
    ] },

  /* ============================================================ 4 */
  { id: 'capitals', name: 'Capitals of the World', glyph: '🏛️', sub: 'Continent by continent', ages: [8, 12], colour: '#3F51D8',
    blurb: 'The capital cities of every continent — learned by typing them, not just picking them.',
    modules: [
      { id: 'ca1', name: 'Europe', objective: 'name the capitals of Europe’s countries',
        days: [T('cap-europe', 1, 'the big European capitals'), TOOL('capitals', 'Type them', 'type a capital from memory', 'Open Country Capitals, choose Europe, tap ten countries and TYPE each capital.'), P(['cap-europe'], 2, 'twenty capitals'), C(['cap-europe'], 2, 'cold')],
        project: PR('Capital cards', 'Make ten cards: a country on the front, its capital on the back. Test someone at home — then let them test you.', 'a deck of capital cards') },
      { id: 'ca2', name: 'Asia', objective: 'name the capitals of Asia’s countries',
        days: [T('cap-asia', 1, 'the big Asian capitals'), TOOL('capitals', 'Type them', 'type a capital from memory', 'In Country Capitals, choose Asia and type ten capitals.'), P(['cap-asia'], 2, 'twenty capitals'), C(['cap-asia'], 2, 'cold')],
        project: PR('A capitals song', 'Make up a rhyme or a song with five Asian capitals in it. Sing it to your family.', 'a song only you know') },
      { id: 'ca3', name: 'Africa', objective: 'name the capitals of Africa’s countries',
        days: [T('cap-africa', 1, 'African capitals'), TOOL('capitals', 'Type them', 'type a capital from memory', 'In Country Capitals, choose Africa and type ten capitals.'), P(['cap-africa'], 2, 'twenty capitals'), C(['cap-africa'], 2, 'cold')],
        project: PR('Map pins', 'Draw Africa as a big shape and mark five capitals as dots — roughly where they are, then check in the app.', 'a map you checked') },
      { id: 'ca4', name: 'The Americas', objective: 'name the capitals of North and South America',
        days: [T('cap-americas', 1, 'capitals of the Americas'), TOOL('capitals', 'Type them', 'type a capital from memory', 'In Country Capitals, choose North America, then South America; type five of each.'), P(['cap-americas'], 2, 'twenty capitals'), C(['cap-americas'], 2, 'cold')],
        project: PR('A quiz for the grown-ups', 'Write five capital questions and ask them at dinner. Keep score — you are the quizmaster.', 'a quiz you ran') },
      { id: 'ca5', name: 'Oceania', objective: 'name the capitals of Oceania',
        days: [T('cap-oceania', 1, 'Oceania’s capitals'), TOOL('capitals', 'Type them', 'type a capital from memory', 'In Country Capitals, choose Oceania and type every capital.'), P(['cap-oceania'], 2, 'all of Oceania'), C(['cap-oceania'], 2, 'cold')],
        project: PR('Island hopper', 'Plan a make-believe boat trip through five Pacific capitals. Draw the route and number the stops.', 'a voyage on paper') },
      { id: 'ca6', name: 'The whole world', objective: 'name capitals from any continent, mixed',
        days: [TOOL('states', 'State capitals', 'name a state’s capital', 'Open State Capitals, pick India or another country, and type five state capitals.'), P(['cap-europe', 'cap-asia', 'cap-africa'], 2, 'mixed'), P(['cap-americas', 'cap-oceania'], 2, 'mixed'), C(['cap-europe', 'cap-asia', 'cap-africa', 'cap-americas', 'cap-oceania'], 3, 'the world, cold')],
        project: PR('The capitals wall', 'Make a poster of every capital you now know by heart. Count them. Keep it — next month, count again.', 'a count you can beat') },
    ] },

  /* ============================================================ 5 */
  { id: 'flags-neighbours', name: 'Flags and Neighbours', glyph: '🚩', sub: 'Who lives next to whom', ages: [8, 12], colour: '#D8412F',
    blurb: 'The world’s flags, which countries share a border, the biggest countries, and the ones with no sea.',
    modules: [
      { id: 'fn1', name: 'Flags', objective: 'know a country from its flag',
        days: [T('flags', 1, 'flags of the big countries'), TOOL('flags', 'The Flags shelf', 'match flags to countries', 'Open Flags and play one round of its quiz.'), P(['flags'], 2, 'twenty flags'), C(['flags'], 2, 'cold')],
        project: PR('Flag of your family', 'Design a flag for your family: two or three colours and one shape, each meaning something. Explain it to them.', 'a flag with a meaning') },
      { id: 'fn2', name: 'Neighbours', objective: 'name the countries that border a country',
        days: [T('neighbours', 1, 'find a country’s neighbours'), TOOL('explorer', 'Neighbours on the map', 'see every neighbour', 'In the Map Explorer, tap three countries and read their neighbours.'), P(['neighbours'], 2, 'twenty'), C(['neighbours', 'flags'], 2, 'cold')],
        project: PR('Your country’s neighbours', 'List every country that borders yours (or India, if you prefer). Draw their flags in a ring around your own.', 'a ring of neighbours') },
      { id: 'fn3', name: 'Giants', objective: 'name the largest countries in the world',
        days: [T('big-countries', 1, 'the biggest countries'), T('big-countries', 2, 'compare their sizes'), P(['big-countries'], 2, 'mixed'), C(['big-countries'], 2, 'cold')],
        project: PR('Size it up', 'Cut paper squares for the five biggest countries, bigger for bigger. Line them up from largest to smallest.', 'a size line you made') },
      { id: 'fn4', name: 'No coastline', objective: 'recognise a landlocked country',
        days: [T('landlocked', 1, 'what landlocked means'), T('landlocked', 2, 'find landlocked countries'), P(['landlocked', 'neighbours'], 2, 'mixed'), C(['landlocked'], 2, 'cold')],
        project: PR('The long way to the sea', 'Pick a landlocked country. Trace, on a map, the shortest way from it to the sea — which countries would a lorry cross?', 'a route to the sea') },
      { id: 'fn5', name: 'Inside a country', objective: 'name the states of a big country and their capitals',
        days: [TOOL('states', 'State Capitals', 'name a state and its capital', 'Open State Capitals, pick a country, and find its states on the map.'), TOOL('states', 'Type them', 'type state capitals', 'In State Capitals, type the capitals of ten states.'), P(['neighbours', 'big-countries'], 2, 'mixed'), C(['flags', 'neighbours', 'landlocked', 'big-countries'], 3, 'all of it, cold')],
        project: PR('A state postcard', 'Choose one state or province you would like to visit. Draw a postcard of it: its capital on the front, three things to see on the back.', 'a postcard from a state') },
    ] },

  /* ============================================================ 6 */
  { id: 'weather-climate', name: 'Weather and Climate', glyph: '⛅', sub: 'Why the sky does what it does', ages: [8, 12], colour: '#2E7FA8',
    blurb: 'Weather and climate, the water cycle, why we have seasons, climate zones and the world’s biomes.',
    modules: [
      { id: 'wc1', name: 'Weather or climate?', objective: 'tell weather from climate',
        days: [T('weather-climate', 1, 'the difference'), T('weather-climate', 2, 'use both words right'), P(['weather-climate'], 2, 'ten'), C(['weather-climate'], 2, 'cold')],
        project: PR('A week of weather', 'For seven days, draw one weather symbol a day on a calendar: sun, cloud, rain, wind. At the end, is that your climate — or just this week?', 'a week of weather, drawn') },
      { id: 'wc2', name: 'The water cycle', objective: 'explain the water cycle in four steps',
        days: [T('water-cycle', 1, 'the four steps'), T('water-cycle', 2, 'where water goes'), P(['water-cycle'], 2, 'ten'), C(['water-cycle', 'weather-climate'], 2, 'cold')],
        project: PR('Rain in a bag', 'Put a little water in a zip bag, seal it, tape it to a sunny window. Watch it for three days: where does the water go, and how does it come back?', 'a water cycle you watched') },
      { id: 'wc3', name: 'Why we have seasons', objective: 'explain why seasons happen',
        days: [T('seasons', 1, 'the tilted Earth'), T('seasons', 2, 'opposite seasons in each half'), P(['seasons'], 2, 'ten'), C(['seasons'], 2, 'cold')],
        project: PR('A torch and an orange', 'In a dark room, shine a torch on an orange tilted a little. Move the orange round the torch. Where is the light strongest, and when?', 'seasons, with your own hands') },
      { id: 'wc4', name: 'Climate zones', objective: 'name the climate zones and where they are',
        days: [T('climate-zones', 1, 'hot, mild and cold zones'), TOOL('explorer', 'Zones on the map', 'find the tropics', 'In the Map Explorer, switch on the lines and find the Tropics. Name three countries between them.'), P(['climate-zones'], 2, 'ten'), C(['climate-zones', 'seasons'], 2, 'cold')],
        project: PR('Pack a suitcase', 'Pick three places in three different zones. For each, draw what you would pack for a week there.', 'three suitcases, three climates') },
      { id: 'wc5', name: 'Biomes', objective: 'match a biome to its climate and its life',
        days: [T('biomes', 1, 'the world’s biomes'), TOOL('geoguess', 'Read the land', 'guess a place from its plants and sky', 'Play one GeoGuesser round. For each picture, name the biome before you guess.'), P(['biomes', 'climate-zones'], 2, 'mixed'), C(['biomes', 'climate-zones', 'water-cycle', 'weather-climate'], 3, 'all of it, cold')],
        project: PR('A biome in a box', 'Make a shoebox scene of one biome — desert, rainforest, tundra, grassland. Put in the right plants and one animal.', 'a biome you built') },
    ] },

  /* ============================================================ 7 */
  { id: 'rivers-mountains', name: 'Rivers, Mountains and Deserts', glyph: '🏔️', sub: 'The shape of the land', ages: [8, 12], colour: '#3F8A3A',
    blurb: 'Landforms, the parts of a river, the great rivers and mountains of the world, and its deserts.',
    modules: [
      { id: 'rm1', name: 'Landforms', objective: 'name a landform from its shape',
        days: [T('landforms', 1, 'mountains, valleys, plains, plateaus'), T('landforms', 2, 'tell them apart'), P(['landforms'], 2, 'ten'), C(['landforms'], 2, 'cold')],
        project: PR('Landforms in a tray', 'Build a mountain, a valley, a plateau and a plain from sand or dough. Label each with a paper flag.', 'the land, shaped by you') },
      { id: 'rm2', name: 'A river from source to sea', objective: 'name the parts of a river in order',
        days: [T('river-parts', 1, 'source, tributary, mouth'), T('river-parts', 2, 'meanders and deltas'), P(['river-parts'], 2, 'ten'), C(['river-parts', 'landforms'], 2, 'cold')],
        project: PR('Make a river', 'Outside or in a tray, pour water slowly down a slope of sand. Watch it find a path. Where does it bend? Where does the sand pile up?', 'a river you watched grow') },
      { id: 'rm3', name: 'The great rivers', objective: 'name the great rivers and their continents',
        days: [T('great-rivers', 1, 'the longest rivers'), TOOL('landmarks', 'Rivers and wonders', 'find natural wonders', 'In Famous Landmarks, choose “Natural wonders” and open three by water.'), P(['great-rivers'], 2, 'ten'), C(['great-rivers', 'river-parts'], 2, 'cold')],
        project: PR('Your nearest river', 'Find out the name of the river nearest your home. Where does it start, and which sea does it reach? Draw its journey.', 'your own river’s story') },
      { id: 'rm4', name: 'The high mountains', objective: 'name the great mountain ranges and where they are',
        days: [T('high-mountains', 1, 'the highest ranges'), T('high-mountains', 2, 'where and how high'), P(['high-mountains'], 2, 'ten'), C(['high-mountains', 'landforms'], 2, 'cold')],
        project: PR('How high is high?', 'Find the height of the tallest building you know and compare it with Everest (the app tells you how high Everest is). How many buildings tall is it?', 'a sum that shows how high') },
      { id: 'rm5', name: 'Deserts', objective: 'say what makes a desert and name the great ones',
        days: [T('deserts', 1, 'what a desert is'), T('deserts', 2, 'the great deserts'), P(['deserts', 'high-mountains'], 2, 'mixed'), C(['deserts', 'great-rivers', 'high-mountains', 'landforms'], 3, 'all of it, cold')],
        project: PR('Desert survival kit', 'You are crossing a desert for a day. Draw the seven things you would carry and say why for each.', 'a kit with reasons') },
    ] },

  /* ============================================================ 8 */
  { id: 'latitude-time', name: 'Latitude, Longitude and Time', glyph: '🌐', sub: 'The lines that pin down every place', ages: [10, 14], colour: '#6436B5',
    blurb: 'The grid of the globe, the hemispheres, the special lines, and why the time is different in different places.',
    modules: [
      { id: 'lt1', name: 'Latitude and longitude', objective: 'find a place from its coordinates',
        days: [T('lat-long', 2, 'what the numbers mean'), T('lat-long', 3, 'read coordinates'), P(['lat-long'], 3, 'ten'), C(['lat-long'], 3, 'cold')],
        project: PR('Coordinates of home', 'With a grown-up, look up the rough latitude and longitude of your town. Is it north or south of the Equator? East or west of Greenwich?', 'your town, as two numbers') },
      { id: 'lt2', name: 'Hemispheres', objective: 'say which hemispheres a country is in',
        days: [T('hemispheres', 2, 'north, south, east, west'), TOOL('explorer', 'Lines on the map', 'see the Equator and Prime Meridian', 'In the Map Explorer, switch on the lines. Find two countries the Equator crosses.'), P(['hemispheres'], 3, 'ten'), C(['hemispheres', 'lat-long'], 3, 'cold')],
        project: PR('Four quarters of an orange', 'Draw the Equator and a meridian on an orange with a pen. Peel it into four quarters: which quarter do you live on?', 'the hemispheres, peeled') },
      { id: 'lt3', name: 'The special lines', objective: 'name the Tropics and the polar circles and what they mark',
        days: [T('special-lines', 2, 'the five lines'), T('special-lines', 3, 'what each marks'), P(['special-lines'], 3, 'ten'), C(['special-lines', 'hemispheres'], 3, 'cold')],
        project: PR('Shadow at noon', 'On a sunny day, stand a stick in the ground and mark its shadow at about noon. Do it again in a few weeks. Did it get longer or shorter — and why?', 'the Sun measured with a stick') },
      { id: 'lt4', name: 'Sun time', objective: 'work out the time somewhere else from its longitude',
        days: [T('sun-time', 2, 'why time changes'), T('sun-time', 3, 'work out a time'), P(['sun-time', 'lat-long'], 3, 'mixed'), C(['sun-time', 'special-lines', 'lat-long', 'hemispheres'], 3, 'all of it, cold')],
        project: PR('Call a far-away grown-up', 'Pick someone you know in another time zone. Work out what time it is for them before you call or message. Were you right?', 'a time you worked out') },
    ] },

  /* ============================================================ 9 */
  { id: 'restless-earth', name: 'The Restless Earth', glyph: '🌋', sub: 'Plates, volcanoes and deep time', ages: [10, 14], colour: '#C0341C',
    blurb: 'Inside the Earth, the moving plates, volcanoes and earthquakes, the rocks they make, and the supercontinent.',
    modules: [
      { id: 're1', name: 'Inside the Earth', objective: 'name the Earth’s layers in order',
        days: [T('earth-layers', 2, 'crust to core'), T('earth-layers', 3, 'what each is like'), P(['earth-layers'], 3, 'ten'), C(['earth-layers'], 3, 'cold')],
        project: PR('An Earth you can cut', 'Make a ball of four colours of play-dough, one inside the other. Cut it in half: crust, mantle, outer core, inner core.', 'the Earth, cut open') },
      { id: 're2', name: 'The moving plates', objective: 'say what happens where plates meet',
        days: [T('plates', 2, 'the plates'), T('plates', 3, 'what their edges do'), P(['plates'], 3, 'ten'), C(['plates', 'earth-layers'], 3, 'cold')],
        project: PR('Crackers on custard', 'Float two crackers on thick custard or honey and push them together, then apart. What happens at the edges?', 'plate edges you made') },
      { id: 're3', name: 'Volcanoes and earthquakes', objective: 'explain where and why volcanoes and earthquakes happen',
        days: [T('volcanoes-quakes', 2, 'where they happen'), TOOL('time', 'Earth Through Time', 'see how plates built the Himalaya', 'In Earth Through Time, open The Earth and step to “India meets Asia”.'), P(['volcanoes-quakes', 'plates'], 3, 'mixed'), C(['volcanoes-quakes'], 3, 'cold')],
        project: PR('Earthquake-safe tower', 'Build a tower of blocks or cards on a tray. Shake the tray. Change the design until it survives — what worked?', 'a tower that stood') },
      { id: 're4', name: 'Rocks', objective: 'tell the three kinds of rock by how they were made',
        days: [T('rocks', 2, 'igneous, sedimentary, metamorphic'), T('rocks', 3, 'the rock cycle'), P(['rocks'], 3, 'ten'), C(['rocks', 'volcanoes-quakes'], 3, 'cold')],
        project: PR('A rock collection', 'Collect five small stones on a walk. Wash them, look closely, and guess which kind each is. Keep them in an egg box with labels.', 'a collection with your guesses') },
      { id: 're5', name: 'Pangaea and deep time', objective: 'describe how the continents moved over time',
        days: [T('pangaea', 2, 'one supercontinent'), TOOL('time', 'The Earth, step by step', 'order the Earth’s big events', 'In Earth Through Time, walk all eighteen steps of The Earth and take the “which came first?” quiz.'), P(['pangaea', 'plates'], 3, 'mixed'), C(['pangaea', 'plates', 'earth-layers', 'rocks'], 3, 'all of it, cold')],
        project: PR('Puzzle continents', 'Draw the continents on paper, cut them out, and try to fit South America and Africa together like a jigsaw.', 'Pangaea, in pieces') },
    ] },

  /* ============================================================ 10 */
  { id: 'world-detective', name: 'World Detective', glyph: '🕵️', sub: 'Read the clues, name the place', ages: [10, 14], colour: '#2E7D32',
    blurb: 'How people live, where resources come from, how to read a photograph for clues, and the story of the continents.',
    modules: [
      { id: 'wd1', name: 'Where people live', objective: 'explain why towns grow where they do',
        days: [T('settlements', 2, 'why here?'), T('settlements', 3, 'site and situation'), P(['settlements'], 3, 'ten'), C(['settlements'], 3, 'cold')],
        project: PR('Why is your town here?', 'Look at a map of your town. Is there a river, a crossing, a coast or a hill? Write three reasons people might have settled there first.', 'three clues about home') },
      { id: 'wd2', name: 'Resources', objective: 'say where a resource comes from and how it is used',
        days: [T('resources', 2, 'natural resources'), T('resources', 3, 'renewable or not'), P(['resources'], 3, 'ten'), C(['resources', 'settlements'], 3, 'cold')],
        project: PR('Where did it come from?', 'Pick three things in your house — a pencil, a T-shirt, a cup. For each, trace what it was made from and where that came from.', 'three things, traced') },
      { id: 'wd3', name: 'Reading a photograph', objective: 'name a place’s continent from clues in a photo',
        days: [TOOL('geoguess', 'Clue hunting', 'use clues to guess a place', 'Play a GeoGuesser round. Before guessing, name two clues: the side of the road, the plants, the sky.'), TOOL('geoguess', 'A second round', 'guess closer', 'Play another round. Try to beat your first score — by reasoning, not luck.'), P(['which-continent', 'biomes'], 3, 'mixed'), C(['biomes', 'climate-zones', 'which-continent'], 3, 'cold')],
        project: PR('A clue card', 'Make a “clue card” for detectives: five things in a photo that tell you where it was taken, with a drawing for each.', 'a detective’s card') },
      { id: 'wd4', name: 'Famous places', objective: 'place a famous landmark on the map',
        days: [TOOL('landmarks', 'Landmarks on the map', 'find a landmark', 'In Famous Landmarks, take the quiz “find it on the map”.'), TOOL('landmarks', 'Built or natural?', 'sort wonders', 'Open ten landmarks you have not seen and say if each is built by people or natural.'), P(['which-continent', 'big-countries'], 3, 'mixed'), C(['which-continent', 'big-countries'], 3, 'cold')],
        project: PR('A guidebook page', 'Write one page of a guidebook for a landmark you would love to visit: how to get there, what to see, one thing to be careful of.', 'a page of a guidebook') },
      { id: 'wd5', name: 'Stories of the continents', objective: 'put a continent’s great ages in order',
        days: [TOOL('time', 'One continent’s story', 'walk a continent through time', 'In Earth Through Time, choose a continent and walk its ages from first to last.'), TOOL('time', 'Which came first?', 'order the ages', 'In Earth Through Time, take the continent’s “which came first?” quiz, then “which continent?”.'), P(['settlements', 'resources'], 3, 'mixed'), C(['settlements', 'resources', 'which-continent'], 3, 'cold')],
        project: PR('A family timeline', 'Draw a timeline of your family — as far back as anyone at home can remember. Where did each generation live?', 'a timeline of your own') },
      { id: 'wd6', name: 'The final case', objective: 'use everything together to solve a place',
        days: [TOOL('geoguess', 'The detective’s warm-up', 'reason your way to a place', 'Play a GeoGuesser round. For every picture, say the continent, the climate and one clue out loud before you tap.'), P(['landlocked', 'neighbours', 'climate-zones'], 3, 'countries and climates'), P(['settlements', 'resources', 'biomes'], 3, 'people and land'), C(['neighbours', 'landlocked', 'climate-zones', 'settlements', 'resources', 'biomes'], 3, 'the final case, cold')],
        project: PR('Your own mystery', 'Write a mystery for someone at home: five clues about a country, one at a time. How many clues did they need?', 'a mystery someone solved') },
    ] },
];

/* days in order, each with its module and its place in the module */
export function daysOf(e) {
  const out = [];
  e.modules.forEach((m) => {
    m.days.forEach((d, i) => out.push({ ...d, mod: m.id, key: `${m.id}.${i}` }));
    out.push({ k: 'm', ...m.project, mod: m.id, key: `${m.id}.project` });
  });
  return out.map((d, i) => ({ ...d, n: i + 1 }));
}
export const expeditionById = Object.fromEntries(EXPEDITIONS.map((e) => [e.id, e]));
