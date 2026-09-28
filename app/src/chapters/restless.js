/* The Restless Earth — inside the Earth, moving plates, volcanoes and
   earthquakes, rocks, and the supercontinent. Ages 11–14. */
import { mc, bank } from './kit.js';
import { layers, boundary } from '../figs.js';

export const WORLD = { id: 'restless', name: 'The Restless Earth', short: 'Restless Earth', glyph: '🌋', band: '11-14', ink: '#A33A1C', tint: '#FBE6DE',
  blurb: 'The layers inside the Earth, the plates that carry the continents, volcanoes and earthquakes, the rock cycle, and Pangaea.' };

const USGS = 'US Geological Survey — “This Dynamic Earth”';

export const STOPS = [
  { id: 'earth-layers', title: 'Inside the Earth', glyph: '🥚', band: '11-14',
    hook: 'If the Earth were an egg, the crust we live on would be thinner than its shell.',
    idea: [`<span class="fig-c">${layers()}</span>`, 'The <b>crust</b> is the thin rocky outside. Below it is the <b>mantle</b>: hot rock that flows very slowly.', 'At the centre is the <b>core</b>, mostly iron and nickel. The <b>outer core</b> is liquid; the <b>inner core</b> is solid, squeezed by the weight above it.', 'The moving liquid iron of the outer core makes Earth’s magnetic field — what a compass needle feels.'],
    why: 'The slow flow of the mantle is what moves the continents.',
    src: [USGS, 'Encyclopaedia Britannica — “Earth: the interior”'],
    gen: bank([
      { lv: 1, q: 'Which layer of the Earth do we live on?', a: 'the crust', w: ['the mantle', 'the outer core', 'the inner core'], html: layers },
      { lv: 1, q: 'What is at the very centre of the Earth?', a: 'the inner core', w: ['the crust', 'the mantle', 'the ocean'] },
      { lv: 2, q: 'Which part of the core is liquid?', a: 'the outer core', w: ['the inner core', 'the crust', 'none of it'] },
      { lv: 2, q: 'The core is made mostly of…', a: 'iron and nickel', w: ['water and ice', 'sand and clay', 'gold and silver'] },
      { lv: 2, q: 'The thickest layer of the Earth is…', a: 'the mantle', w: ['the crust', 'the inner core', 'the atmosphere'] },
      { lv: 3, q: 'Why is the inner core solid even though it is hotter than the outer core?', a: 'the pressure there is enormous', w: ['it is made of ice', 'it is cooler than the surface', 'the Sun freezes it'] },
      { lv: 3, q: 'What makes Earth’s magnetic field?', a: 'liquid iron moving in the outer core', w: ['the Moon', 'magnets in the crust', 'the oceans'] },
    ]) },
  { id: 'plates', title: 'Moving plates', glyph: '🧩', band: '11-14',
    hook: 'The Atlantic Ocean gets wider every year — about as fast as your fingernails grow.',
    idea: ['The crust is broken into huge pieces called <b>tectonic plates</b>. They float on the mantle and move a few centimetres a year.', `Where plates <b>pull apart</b> (divergent), new crust forms — like the Mid-Atlantic Ridge.<span class="fig-row">${boundary('divergent')}</span>`, `Where they <b>push together</b> (convergent), mountains rise or one plate sinks under another — the Himalaya formed where India pushed into Asia.<span class="fig-row">${boundary('convergent')}</span>`, `Where they <b>slide past</b> (transform), the ground shakes — like the San Andreas Fault in California.<span class="fig-row">${boundary('transform')}</span>`],
    why: 'Plates explain earthquakes, volcanoes, mountains and ocean trenches — with one idea.',
    src: [USGS],
    gen: bank([
      { lv: 1, q: 'The huge pieces the Earth’s crust is broken into are called…', a: 'tectonic plates', w: ['continents', 'hemispheres', 'layers'] },
      { lv: 1, q: 'About how fast do plates move?', a: 'a few centimetres a year', w: ['a few kilometres a day', 'they never move', 'a metre every minute'] },
      { lv: 2, q: 'Plates pulling apart make a…', a: 'divergent boundary', w: ['convergent boundary', 'transform boundary', 'tropic'], html: () => boundary('divergent') },
      { lv: 2, q: 'Plates pushing together make a…', a: 'convergent boundary', w: ['divergent boundary', 'transform boundary', 'meridian'], html: () => boundary('convergent') },
      { lv: 2, q: 'Plates sliding past each other make a…', a: 'transform boundary', w: ['divergent boundary', 'convergent boundary', 'delta'], html: () => boundary('transform') },
      { lv: 3, q: 'The Himalaya was made when India’s plate…', a: 'pushed into Asia', w: ['pulled away from Africa', 'sank into the ocean', 'slid past Australia'] },
      { lv: 3, q: 'The Mid-Atlantic Ridge is where plates are…', a: 'pulling apart', w: ['pushing together', 'sliding past', 'not moving'] },
      { lv: 3, q: 'The San Andreas Fault in California is a…', a: 'transform boundary', w: ['divergent boundary', 'convergent boundary', 'volcano'] },
    ]) },
  { id: 'volcanoes-quakes', title: 'Volcanoes and earthquakes', glyph: '🌋', band: '11-14',
    hook: 'Around the edge of the Pacific is a ring where most of the world’s earthquakes and volcanoes happen.',
    idea: ['Melted rock underground is <b>magma</b>. When it comes out of a volcano it is called <b>lava</b>.', 'An <b>earthquake</b> is the ground shaking when rocks along a fault suddenly slip. Its strength is its <b>magnitude</b>.', 'An earthquake under the sea can push up a huge wave: a <b>tsunami</b>.', 'The <b>Ring of Fire</b> around the Pacific Ocean is where plates meet — Japan, Indonesia, the Andes and the west coast of the Americas are on it.'],
    why: 'Knowing where the plates meet tells people where to build carefully.',
    src: [USGS, 'US Geological Survey — “Ring of Fire”'],
    gen: bank([
      { lv: 1, q: 'Melted rock that comes out of a volcano is called…', a: 'lava', w: ['magma', 'basalt', 'ash'] },
      { lv: 1, q: 'Melted rock still under the ground is called…', a: 'magma', w: ['lava', 'granite', 'mud'] },
      { lv: 2, q: 'A giant sea wave caused by an earthquake under the sea is a…', a: 'tsunami', w: ['monsoon', 'hurricane', 'tide'] },
      { lv: 2, q: 'The ring of volcanoes and earthquakes around the Pacific is called…', a: 'the Ring of Fire', w: ['the Tropic of Cancer', 'the Equator', 'the Mid-Atlantic Ridge'] },
      { lv: 2, q: 'Which of these countries is on the Ring of Fire?', a: 'Japan', w: ['Egypt', 'Poland', 'Mongolia'] },
      { lv: 3, q: 'Most earthquakes happen…', a: 'where plates meet', w: ['in the middle of plates', 'only at the poles', 'only under deserts'] },
      { lv: 3, q: 'The strength of an earthquake is called its…', a: 'magnitude', w: ['latitude', 'altitude', 'longitude'] },
    ]) },
  { id: 'rocks', title: 'The rock cycle', glyph: '🪨', band: '11-14',
    hook: 'The marble of the Taj Mahal was once limestone — changed by heat and pressure deep underground.',
    idea: ['<b>Igneous</b> rock forms when magma or lava cools: granite, basalt.', '<b>Sedimentary</b> rock forms from layers of sand, mud or shells pressed together: sandstone, limestone. Fossils are found here.', '<b>Metamorphic</b> rock is rock changed by heat and pressure: limestone becomes marble, mudstone becomes slate.', 'Over millions of years every rock can become every other kind — the <b>rock cycle</b>.'],
    why: 'Rocks are the record of Earth’s history, written in layers.',
    src: ['US Geological Survey — “Rock types”', 'Encyclopaedia Britannica — “Rock cycle”'],
    gen: bank([
      { lv: 1, q: 'Rock made when lava cools is…', a: 'igneous', w: ['sedimentary', 'metamorphic'] },
      { lv: 1, q: 'Rock made from layers of sand pressed together is…', a: 'sedimentary', w: ['igneous', 'metamorphic'] },
      { lv: 1, q: 'Rock changed by heat and pressure is…', a: 'metamorphic', w: ['igneous', 'sedimentary'] },
      { lv: 2, q: 'Marble is made from…', a: 'limestone', w: ['granite', 'basalt', 'coal'] },
      { lv: 2, q: 'In which kind of rock are fossils usually found?', a: 'sedimentary', w: ['igneous', 'metamorphic'] },
      { lv: 2, q: 'Granite is…', a: 'igneous', w: ['sedimentary', 'metamorphic'] },
      { lv: 3, q: 'Slate is made from…', a: 'mudstone or shale', w: ['granite', 'sandstone', 'marble'] },
      { lv: 3, q: 'Basalt forms from…', a: 'lava cooling quickly', w: ['shells pressed together', 'sand in a river', 'marble melting'] },
    ]) },
  { id: 'pangaea', title: 'When the continents were one', glyph: '🧭', band: '11-14',
    hook: 'Look at the coasts of South America and Africa. They fit together like puzzle pieces.',
    idea: ['About 300 million years ago almost all the land was joined in one supercontinent, <b>Pangaea</b>.', 'Alfred <b>Wegener</b> proposed in 1912 that continents drift. His clues: coasts that fit, the same fossils on continents now oceans apart, and matching rocks.', 'Few believed him until the 1960s, when maps of the sea floor showed it spreading. Now it is the theory of <b>plate tectonics</b>.', 'Walk the whole story in the Library: <b>Earth Through Time</b>.'],
    why: 'It is one of the great “how do we know?” stories in science — a good idea that waited fifty years for its evidence.',
    src: [USGS, 'Encyclopaedia Britannica — “Alfred Wegener”'],
    gen: bank([
      { lv: 1, q: 'The supercontinent that joined almost all the land was called…', a: 'Pangaea', w: ['Atlantis', 'Eurasia', 'Oceania'] },
      { lv: 2, q: 'Who proposed that the continents drift?', a: 'Alfred Wegener', w: ['Gerardus Mercator', 'Charles Darwin', 'Isaac Newton'] },
      { lv: 2, q: 'Which two continents’ coasts fit together best?', a: 'South America and Africa', w: ['Europe and Australia', 'Asia and Antarctica', 'North America and India'] },
      { lv: 2, tf: true, q: 'The same kinds of fossils are found on continents that are now oceans apart.' },
      { lv: 3, q: 'What finally convinced scientists that continents move?', a: 'evidence that the sea floor is spreading', w: ['a photo from space', 'a vote', 'finding Pangaea on an old map'] },
      { lv: 3, q: 'About when was Pangaea joined together?', a: 'about 300 million years ago', w: ['about 3,000 years ago', 'about 30 years ago', 'about 3 billion years ago'] },
    ]) },
];
