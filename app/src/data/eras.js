/* eras.js — Earth Through Time, the "geographical evolution" shelf.

   Two roads: how the EARTH changed (`EARTH`), and how people's MAPS of it
   changed (`MAPS`). Dates in deep time are estimates that scientists revise,
   so each one is given the way the sources give it — "about", "around" —
   and each names where it is checked. `ago` is in years before today and
   drives the slider's order; it is never shown as a false-precise number.

   The plates are paintings of what a place might have LOOKED like, never a
   map of the continents: a model cannot draw Pangaea's coastline
   correctly, and a wrong map in a geography app would teach the error. The
   continents' positions are drawn by the app (`drift`), as simple shapes,
   and labelled "a sketch, not to scale". */

const USGS = 'US Geological Survey — “This Dynamic Earth: The Story of Plate Tectonics”';
const NASA = 'NASA Earth Observatory';
const BRIT = (n) => `Encyclopaedia Britannica — “${n}”`;

export const EARTH = [
  { id: 'e-forms', ago: 4.54e9, when: 'About 4.5 billion years ago', title: 'A new Earth',
    body: 'Earth forms from dust and rock circling the young Sun. Its surface is molten rock, and it is struck again and again by space rocks.',
    look: 'Why it matters: the iron sank to the middle and made the core. That is why Earth has a magnetic field — and why a compass works.',
    src: [BRIT('Earth — origin'), NASA],
    paint: 'A young planet surface of glowing molten lava seas and dark cooling crust, volcanoes erupting, many meteors streaking through a dark reddish sky, no planets or text.' },
  { id: 'e-oceans', ago: 4.0e9, when: 'About 4 billion years ago', title: 'The first oceans',
    body: 'The surface cools enough for rain to fall and stay. Water fills the low places and the first oceans form.',
    look: 'Why it matters: oceans store heat and move it round the planet. They still shape every climate on Earth.',
    src: [BRIT('Ocean — origin of the ocean waters')],
    paint: 'A dark stormy primordial ocean with heavy rain, black volcanic islands steaming, lightning, an orange hazy sky, no plants, no life.' },
  { id: 'e-life', ago: 3.5e9, when: 'About 3.5 billion years ago', title: 'Life in the shallows',
    body: 'Tiny living things build rock mounds called stromatolites in warm shallow seas. Over a very long time they fill the air with oxygen.',
    look: 'Why it matters: the oxygen we breathe was made by living things, very slowly.',
    src: [BRIT('Stromatolite')],
    paint: 'Warm shallow turquoise sea at low tide with many rounded rocky stromatolite mounds, bare rocky land, pale hazy sky, no animals, no plants on land.' },
  { id: 'e-pangaea', ago: 3.0e8, when: 'About 300 million years ago', title: 'Pangaea, one supercontinent',
    body: 'Nearly all the land on Earth is joined in one giant continent, Pangaea, surrounded by one ocean, Panthalassa. The middle of it is very far from the sea, and very dry.',
    look: 'Why it matters: the coasts of South America and Africa still fit together like puzzle pieces — the first clue that continents move.',
    src: [USGS, BRIT('Pangea')],
    paint: 'A vast dry reddish interior landscape of an ancient supercontinent, huge flat plains, strange tall fern-like trees near a braided river, distant mountains, no animals.' },
  { id: 'e-breakup', ago: 1.75e8, when: 'About 175 million years ago', title: 'Pangaea breaks apart',
    body: 'Pangaea begins to split. The Atlantic Ocean opens between the Americas and Europe and Africa — and it is still getting wider today, by a few centimetres a year.',
    look: 'Why it matters: continents move at about the speed your fingernails grow.',
    src: [USGS, BRIT('Continental drift')],
    paint: 'A long rift valley splitting a green prehistoric land, with volcanoes and lava along the crack and the sea just flooding in at one end, conifer and cycad forests.' },
  { id: 'e-himalaya', ago: 5.0e7, when: 'About 50 million years ago', title: 'India meets Asia',
    body: 'The plate carrying India, which had travelled north across the ocean, pushes into Asia. The land crumples upward and the Himalaya begins to rise.',
    look: 'Why it matters: the Himalaya is still rising. Rocks near the top of Everest hold fossils of sea creatures.',
    src: [USGS, BRIT('Himalayas — geology')],
    paint: 'Great folded rock layers being pushed up into young jagged mountains beside an ancient shallow sea, forests at the foot, dramatic clouds.' },
  { id: 'e-ice', ago: 2.0e4, when: 'About 20,000 years ago', title: 'The last Ice Age at its coldest',
    body: 'Great ice sheets cover much of North America and northern Europe. So much water is locked in ice that the sea is far lower, and people and animals can walk from Asia to America across a land bridge called Beringia.',
    look: 'Why it matters: glaciers carved the fjords, the Great Lakes and many valleys you can visit today.',
    src: [NASA, BRIT('Pleistocene Epoch')],
    paint: 'A cold ice age tundra plain of grass and snow in front of a towering wall of glacier ice, woolly mammoths far in the distance, grey sky.' },
  { id: 'e-today', ago: 0, when: 'Today', title: 'The Earth we map now',
    body: 'Seven continents and five oceans — and the plates are still moving. Earthquakes and volcanoes show us where their edges are.',
    look: 'Why it matters: in about 50 million years the map will look different again.',
    src: [USGS],
    paint: 'The planet Earth seen from space, blue oceans, white swirling clouds and green and brown land, the thin blue atmosphere glowing at the edge, black space.' },
];

export const MAPS = [
  { id: 'm-babylon', ago: 2600, when: 'About 2,600 years ago', title: 'A world map on clay',
    body: 'A clay tablet from Babylon shows the world as a flat disc ringed by water. It is one of the oldest known maps of the world.',
    src: ['The British Museum — the Babylonian Map of the World'] },
  { id: 'm-eratosthenes', ago: 2240, when: 'About 240 BCE', title: 'Measuring the Earth with shadows',
    body: 'Eratosthenes, in Egypt, compared the Sun’s shadow in two cities and worked out the size of the whole Earth — remarkably close to the real answer.',
    src: [BRIT('Eratosthenes')] },
  { id: 'm-ptolemy', ago: 1875, when: 'About 150 CE', title: 'Latitude and longitude',
    body: 'Ptolemy, in Alexandria, wrote the Geography: a list of thousands of places with coordinates, so a map could be redrawn by anyone.',
    src: [BRIT('Ptolemy')] },
  { id: 'm-idrisi', ago: 872, when: '1154', title: 'Al-Idrisi’s great map',
    body: 'The geographer al-Idrisi made a great map of the known world for King Roger II of Sicily, gathering reports from travellers. It was drawn with south at the top.',
    src: [BRIT('al-Idrīsī')] },
  { id: 'm-mercator', ago: 457, when: '1569', title: 'Mercator’s map',
    body: 'Gerardus Mercator drew a world map where a straight line is a steady compass course — perfect for sailors. But it makes places near the poles look far too big: Greenland looks as big as Africa, which is about fourteen times larger.',
    src: [BRIT('Mercator projection')] },
  { id: 'm-survey', ago: 224, when: '1802', title: 'The Great Trigonometrical Survey',
    body: 'A survey of the Indian subcontinent began, measuring triangles across the land with great care. It went on for decades and measured the height of the Himalayan peaks.',
    src: [BRIT('Great Trigonometrical Survey')] },
  { id: 'm-satellite', ago: 54, when: '1972', title: 'Maps from space',
    body: 'The first Landsat satellite began photographing the whole Earth from orbit. Satellites have watched our planet ever since.',
    src: ['NASA — Landsat Science'] },
  { id: 'm-gps', ago: 31, when: 'The 1990s', title: 'A map that knows where you are',
    body: 'GPS satellites let a small receiver work out its own latitude and longitude anywhere on Earth, by timing signals from space.',
    src: [BRIT('GPS')] },
];

export const ERAS_NEED_REVIEW = true;
