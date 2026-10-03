/* River Delta — rivers from source to sea, great rivers, high mountains and
   deserts. Ages 8–11. */
import { mc, bank, mix } from './kit.js';
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
    gen: mix((r, lv) => {
      const [w, d] = pick(lv === 1 ? PARTS.slice(0, 5) : PARTS, r);
      return r() < 0.5 ? mc(r, `What do we call ${d}?`, w, PARTS.map((p) => p[0]), `That is the ${w}.`)
        : mc(r, `What is a river’s ${w}?`, d, PARTS.map((p) => p[1]), `The ${w} is ${d}.`);
    }, bank([
      /* how a river works — no place facts */
      { lv: 1, tf: true, q: 'A river always flows downhill.', why: 'Gravity pulls water down, so a river runs from high ground to low ground.' },
      { lv: 1, tf: false, q: 'Every river ends in the sea.', why: 'Some end in a lake, and some dry up in a desert before they reach the sea.' },
      { lv: 1, q: 'Where does the water in a river come from in the end?', a: 'Rain and melting snow', w: ['Sea water flowing uphill', 'Melting rock', 'The wind'], why: 'Rain and snowmelt run off the land and soak through it into streams and rivers.' },
      { lv: 1, q: 'What are the sides of a river called?', a: 'Its banks', w: ['Its bed', 'Its mouth', 'Its delta'], why: 'The banks are the land along each side of the river.' },
      { lv: 1, q: 'What is the bottom of a river called?', a: 'Its bed', w: ['Its banks', 'Its source', 'Its floodplain'], why: 'The riverbed is the ground the water flows over.' },
      { lv: 1, tf: false, q: 'River water is salty, like the sea.', why: 'River water is fresh. The salt is in the sea.' },
      { lv: 1, q: 'What do we call a small, narrow river?', a: 'A stream', w: ['A delta', 'An ocean', 'A bay'], why: 'A stream (or brook) is a small river — many of them join to make a big one.' },
      { lv: 1, q: 'What is a waterfall?', a: 'A river dropping over a steep edge of rock', w: ['A river running into the sea', 'Rain falling on a lake', 'Water bubbling up from underground'], why: 'Where the land drops away suddenly, the river falls over the edge.' },
      { lv: 1, tf: true, q: 'A river carries sand, mud and stones along with it.', why: 'Moving water picks up bits of rock and soil and carries them downstream.' },
      { lv: 1, q: 'What is a dam?', a: 'A wall built across a river to hold back water', w: ['A bend in a river', 'A bridge for trains', 'A sandbank in the sea'], why: 'A dam stores water in a lake behind it, for drinking, farms or electricity.' },
      { lv: 1, tf: false, q: 'A river gets smaller each time a tributary joins it.', why: 'Every tributary adds its water, so the river grows as it goes.' },
      { lv: 2, q: 'What do we call all the land that drains into one river?', a: 'Its basin', w: ['Its delta', 'Its estuary', 'Its meander'], why: 'Rain that falls anywhere in a river’s basin ends up in that river or its tributaries.' },
      { lv: 2, q: 'What is erosion?', a: 'Wearing away rock and soil and carrying it off', w: ['Water turning into vapour', 'Building a wall across a river', 'Rain falling on a mountain'], why: 'Rivers, waves, wind and ice all wear the land away — that is erosion.' },
      { lv: 2, q: 'Why does a river drop its mud when it reaches the sea?', a: 'It slows down', w: ['It speeds up', 'It freezes', 'It flows uphill'], why: 'Slow water cannot carry as much, so the mud settles out.' },
      { lv: 2, tf: true, q: 'Fields on a floodplain are often good for farming.', why: 'Each flood leaves a layer of rich mud on the land.' },
      { lv: 2, tf: false, q: 'A river flows fastest on the inside of a bend.', why: 'It is fastest on the outside — which is why the outside bank wears away.' },
      { lv: 2, q: 'What is a gorge?', a: 'A deep, narrow valley with steep rock sides', w: ['A wide, flat field by a river', 'A lake behind a dam', 'A sandbank at the sea'], why: 'A river cutting down through hard rock can carve a gorge.' },
      { lv: 2, q: 'What shape is a valley that a river carves in the mountains?', a: 'V-shaped', w: ['U-shaped', 'Flat like a table', 'Round like a bowl'], why: 'The river cuts down, and the sides slope in towards it — a V.' },
      { lv: 2, tf: true, q: 'Some rivers flow only after rain and are dry the rest of the year.', why: 'In dry places a riverbed can stay empty until a storm fills it.' },
      { lv: 3, q: 'What shape is a valley that a glacier carves?', a: 'U-shaped', w: ['V-shaped', 'S-shaped', 'Zigzag'], why: 'A glacier is wide and heavy, so it scrapes out a broad valley with steep sides.' },
      { lv: 3, q: 'Where does a waterfall usually form?', a: 'Where hard rock lies over softer rock', w: ['Where the land is flat', 'Where two rivers meet', 'Where the river meets the sea'], why: 'The soft rock wears away faster, leaving a step of hard rock for the water to fall over.' },
      { lv: 3, q: 'What is a levee?', a: 'A raised bank along a river', w: ['A lake left by a bend', 'A pool under a waterfall', 'The highest point of a river'], why: 'Floods drop mud near the river first, building raised banks; people build them higher to stop floods.' },
      { lv: 3, q: 'Which word means how much water flows down a river each second?', a: 'Discharge', w: ['Delta', 'Meander', 'Erosion'], why: 'A river’s discharge is the amount of water passing a point each second.' },
      { lv: 3, tf: true, q: 'Over a very long time, a river can cut a valley through solid rock.', why: 'Water and the stones it carries grind the rock away, little by little.' },
    ])) },
  { id: 'great-rivers', title: 'Great rivers and their cities', glyph: '🚢', band: '8-10',
    hook: 'Cairo, Khartoum and the pyramids all stand beside one river: the Nile.',
    idea: ['The <b>Nile</b> in Africa and the <b>Amazon</b> in South America are the two longest rivers. The Amazon carries by far the most water.', 'The <b>Yangtze</b> is the longest river in Asia. The <b>Ganga</b> flows across northern India to the Bay of Bengal.', 'The <b>Danube</b> flows through more countries than any other river in the world.', 'Great cities grew on rivers for water, food, and boats to trade.'],
    why: 'Find the river and you have found the reason a city is where it is.',
    src: ['Encyclopaedia Britannica — “Nile River”, “Amazon River”, “Yangtze River”, “Danube River”'],
    gen: mix((r, lv) => {
      const [city, river, country] = pick(lv === 1 ? CITIES.slice(0, 8) : CITIES, r);
      if (lv >= 2 && r() < 0.4) {
        const others = CITIES.filter((c) => c[1] !== river).map((c) => c[0]);
        return mc(r, `Which city stands on the ${river}?`, city, others, `${city}, in ${country}, is on the ${river}.`);
      }
      return mc(r, `Which river flows through ${city}, in ${country}?`, river, RIVERS, `${city} stands on the ${river}.`);
    }, bank([
      /* the great rivers themselves — each fact in the idea above or in the Britannica articles */
      { lv: 1, q: 'Which river carries the most water of any river on Earth?', a: 'Amazon', w: ['Nile', 'Ganga', 'Thames'], why: 'The Amazon carries far more water than any other river.' },
      { lv: 1, q: 'Which is the longest river in Asia?', a: 'Yangtze', w: ['Ganga', 'Mekong', 'Tigris'], why: 'The Yangtze, in China, is Asia’s longest river.' },
      { lv: 1, q: 'Which river flows through more countries than any other?', a: 'Danube', w: ['Thames', 'Seine', 'Tiber'], why: 'The Danube crosses or borders more countries than any other river.' },
      { lv: 1, q: 'Where does the Ganga meet the sea?', a: 'The Bay of Bengal', w: ['The Arabian Sea', 'The Red Sea', 'The Mediterranean Sea'], why: 'The Ganga flows east across northern India to the Bay of Bengal.' },
      { lv: 1, tf: false, q: 'The Nile flows through South America.', why: 'The Nile is in Africa. The Amazon is the great river of South America.' },
      { lv: 1, q: 'Why did so many great cities grow up beside rivers?', a: 'For water, food and boats to trade', w: ['Rivers keep cities warm', 'Nobody could live on hills', 'Rivers stop the wind'], why: 'A river gave people water to drink, fish and farmland, and a road for boats.' },
      { lv: 1, q: 'What is a port?', a: 'A place where ships load and unload', w: ['A bridge over a river', 'A wall that holds back a flood', 'A bend in a river'], why: 'Many river cities grew as ports, where goods came on and off boats.' },
      { lv: 2, tf: true, q: 'The Nile and the Amazon are the two longest rivers in the world.', why: 'Experts argue about which of the two is longer, but both are far longer than any other.' },
      { lv: 2, tf: false, q: 'The Ganga and the Brahmaputra reach the sea in Sri Lanka.', why: 'They make one huge delta in India and Bangladesh.' },
      { lv: 2, q: 'What did the Nile’s yearly flood leave on the fields of ancient Egypt?', a: 'Rich black mud for growing crops', w: ['Salt that spoiled the land', 'Sand from the desert', 'Ice from the mountains'], why: 'Each flood left fresh mud, so Egypt’s farms could feed a great civilisation.' },
      { lv: 3, q: 'Into which ocean does the Amazon flow?', a: 'Atlantic', w: ['Pacific', 'Indian', 'Arctic'], why: 'The Amazon crosses South America from west to east and empties into the Atlantic.' },
      { lv: 3, q: 'Into which sea does the Nile flow?', a: 'The Mediterranean Sea', w: ['The Red Sea', 'The Arabian Sea', 'The Black Sea'], why: 'The Nile flows north through Egypt and fans out into a delta on the Mediterranean.' },
      { lv: 3, tf: true, q: 'Many great rivers are shared by several countries, which must agree on how to use the water.', why: 'A dam or a canal upstream changes the river for everyone downstream.' },
    ])) },
  { id: 'high-mountains', title: 'The highest mountains', glyph: '🏔️', band: '8-10',
    hook: 'Some climbers try to stand on the highest point of every continent.',
    idea: ['The highest mountain on Earth is <b>Mount Everest</b>, in the Himalaya between Nepal and China.', ...PEAKS.slice(1).map(([c, p]) => `Highest in ${c}: <b>${p}</b>.`), 'The <b>Himalaya</b> and the <b>Andes</b> are the great mountain ranges of Asia and South America; the <b>Alps</b> and the <b>Rockies</b> are in Europe and North America.'],
    why: 'Mountains make their own weather, hold glaciers that feed rivers, and divide countries.',
    src: ['Encyclopaedia Britannica — “Seven Summits”', 'Encyclopaedia Britannica — “Himalayas”'],
    gen: mix((r, lv) => {
      const [c, p] = pick(lv === 1 ? PEAKS.slice(0, 4) : PEAKS, r);
      if (r() < 0.5) return mc(r, `What is the highest mountain in ${c}?`, p, PEAKS.map((x) => x[1]), `${p} is the highest in ${c}.`);
      return mc(r, `On which continent is ${p}?`, c, PEAKS.map((x) => x[0]).concat(['Oceania']), `${p} is in ${c}.`);
    }, bank([
      /* how mountains work, and the ranges named in the idea above */
      { lv: 1, tf: true, q: 'The higher you climb up a mountain, the colder it gets.', why: 'The air gets thinner as you go up, and thin air holds less heat.' },
      { lv: 1, q: 'What is the very top of a mountain called?', a: 'The summit', w: ['The foot', 'The valley', 'The pass'], why: 'Climbers aim for the summit — the highest point.' },
      { lv: 1, q: 'What is the bottom of a mountain called?', a: 'The foot', w: ['The summit', 'The peak', 'The ridge'], why: 'The foot of a mountain is where it rises from the land around it.' },
      { lv: 1, q: 'What is a long line of mountains joined together called?', a: 'A range', w: ['A plain', 'A delta', 'A plateau'], why: 'The Himalaya, the Andes and the Alps are all mountain ranges.' },
      { lv: 1, tf: false, q: 'There is more air to breathe at the top of a high mountain than at the bottom.', why: 'The air is thinner high up, so each breath holds less oxygen.' },
      { lv: 1, q: 'In which mountain range is Mount Everest?', a: 'The Himalaya', w: ['The Andes', 'The Alps', 'The Rockies'], why: 'Everest is the highest peak of the Himalaya.' },
      { lv: 1, q: 'Which great mountain range is in South America?', a: 'The Andes', w: ['The Alps', 'The Himalaya', 'The Rockies'], why: 'The Andes run the length of South America.' },
      { lv: 1, q: 'Which of these mountain ranges is in Europe?', a: 'The Alps', w: ['The Andes', 'The Himalaya', 'The Rockies'], why: 'The Alps cross France, Switzerland, Italy, Austria and their neighbours.' },
      { lv: 1, q: 'Which of these mountain ranges is in North America?', a: 'The Rockies', w: ['The Andes', 'The Himalaya', 'The Alps'], why: 'The Rocky Mountains run through Canada and the United States.' },
      { lv: 1, tf: false, q: 'Trees grow all the way to the top of the highest mountains.', why: 'High up it is too cold and windy for trees. The line where they stop is the tree line.' },
      { lv: 1, tf: true, q: 'Many great rivers begin as melting snow and ice high in the mountains.', why: 'Mountain glaciers and snow melt slowly and feed rivers all year.' },
      { lv: 2, q: 'How did the Himalaya form?', a: 'India pushed into the rest of Asia and the land crumpled up', w: ['A huge volcano erupted', 'The wind piled up sand', 'Rivers dropped mud there'], why: 'The land carrying India slowly crashed into Asia, folding the rock up into the highest mountains on Earth.' },
      { lv: 2, q: 'Mount Everest stands on the border between Nepal and which country?', a: 'China', w: ['India', 'Bhutan', 'Pakistan'], why: 'The border between Nepal and China runs over Everest’s summit.' },
      { lv: 2, tf: true, q: 'Snow can stay on the top of a high mountain all year, even near the equator.', why: 'High enough up, it is cold all year — Kilimanjaro, near the equator, has snow and ice on top.' },
      { lv: 2, q: 'What is a glacier?', a: 'A huge, slow river of ice', w: ['A frozen pond', 'A cloud on a mountain top', 'A cave of ice'], why: 'Snow piles up, packs into ice, and slowly slides downhill.' },
      { lv: 2, tf: false, q: 'Mountains stay exactly the same height forever.', why: 'Rain, ice and wind wear them down, and some are still being pushed up.' },
      { lv: 2, q: 'What is a mountain pass?', a: 'A low gap where people can cross a range', w: ['The highest peak in a range', 'A lake on a mountain top', 'A tunnel dug by a river'], why: 'For thousands of years traders crossed mountains through passes.' },
      { lv: 2, q: 'What do we call a mountain built by melted rock bursting out of the ground?', a: 'A volcano', w: ['A glacier', 'A plateau', 'A valley'], why: 'Lava and ash pile up around the opening, layer by layer.' },
      { lv: 3, q: 'What is a plateau?', a: 'A high, wide area of flat land', w: ['A deep, narrow valley', 'A sharp mountain peak', 'A low, wet field by a river'], why: 'A plateau is high like a mountain but flat on top, like a table.' },
      { lv: 3, tf: true, q: 'The Himalaya are still growing a little taller.', why: 'India is still pushing into Asia, so the mountains are still being squeezed up.' },
      { lv: 3, q: 'A mountain’s height is usually measured from what?', a: 'The level of the sea', w: ['The ground at its foot', 'The centre of the Earth', 'The nearest river'], why: 'Heights are measured from sea level, so mountains anywhere can be compared.' },
      { lv: 3, tf: false, q: 'Mountains are only found on land, never under the sea.', why: 'The ocean floor has huge mountain ranges too — some islands are their tops.' },
    ])) },
  { id: 'deserts', title: 'Deserts of the world', glyph: '🏜️', band: '8-10',
    hook: 'The biggest desert on Earth is not hot at all. It is Antarctica.',
    idea: ['A <b>desert</b> is a place with very little rain or snow — not a place that is hot.', 'So the largest desert is <b>Antarctica</b>. The largest <b>hot</b> desert is the <b>Sahara</b> in Africa.', 'The <b>Atacama</b> in Chile is one of the driest places on Earth; the <b>Thar</b> stretches across India and Pakistan; the <b>Gobi</b> across Mongolia and China.'],
    why: 'Deserts cover about a third of the land, and people have learned to live in almost all of them.',
    src: ['Encyclopaedia Britannica — “Desert”', 'US Geological Survey — “Deserts: Geology and Resources”'],
    gen: mix((r, lv) => {
      if (r() < 0.25) return mc(r, 'Which is the largest desert on Earth, counting cold deserts too?', 'Antarctica', ['Sahara', 'Gobi', 'Thar', 'Arabian'], 'A desert means very little rain or snow — and Antarctica gets almost none.');
      const [d, c] = pick(lv === 1 ? DESERTS.slice(0, 4) : DESERTS, r);
      return mc(r, `On which continent is the ${d} Desert?`, c, ['Africa', 'Asia', 'South America', 'North America', 'Oceania', 'Europe'], `The ${d} is in ${c}.`);
    }, bank([
      /* how deserts work, and the deserts named in the idea above */
      { lv: 1, q: 'What is an oasis?', a: 'A place in a desert with water, where plants grow', w: ['A tall hill of sand', 'A dry riverbed', 'A desert dust storm'], why: 'Water from underground comes up at an oasis, so palms and crops can grow.' },
      { lv: 1, q: 'What is a sand dune?', a: 'A hill of sand piled up by the wind', w: ['A pool of water in the desert', 'A cave in desert rock', 'A desert plant'], why: 'The wind blows sand along and heaps it into dunes, which slowly move.' },
      { lv: 1, tf: true, q: 'A camel can go for days without drinking.', why: 'Camels lose very little water, so they can cross the desert between wells.' },
      { lv: 1, tf: false, q: 'A camel’s hump is full of water.', why: 'The hump stores fat, which the camel lives on when food is scarce.' },
      { lv: 1, tf: true, q: 'A desert can be cold at night, even after a very hot day.', why: 'Dry, clear air lets the day’s heat escape fast into the sky.' },
      { lv: 1, q: 'How does a cactus survive in the desert?', a: 'It stores water in its thick stem', w: ['It drinks sea water', 'It grows only under the sand', 'It needs no water at all'], why: 'A cactus soaks up rain fast and keeps it in its fat stem for the dry months.' },
      { lv: 1, tf: false, q: 'Every desert is covered in sand.', why: 'Many deserts are rock and gravel — and the coldest are covered in ice.' },
      { lv: 1, q: 'Which is the largest hot desert on Earth?', a: 'Sahara', w: ['Gobi', 'Thar', 'Atacama'], why: 'The Sahara stretches right across northern Africa.' },
      { lv: 1, q: 'The Thar Desert stretches across India and which other country?', a: 'Pakistan', w: ['China', 'Nepal', 'Sri Lanka'], why: 'The Thar lies in north-west India and eastern Pakistan.' },
      { lv: 1, q: 'What do we call people who move from place to place with their animals?', a: 'Nomads', w: ['Sailors', 'Miners', 'Fishers'], why: 'Many desert people have lived as nomads, moving to find water and grass.' },
      { lv: 1, tf: true, q: 'Some desert plants have very long roots to reach water deep underground.', why: 'Long roots find water far below the dry surface.' },
      { lv: 2, q: 'Across which two countries does the Gobi Desert stretch?', a: 'Mongolia and China', w: ['India and Nepal', 'Chile and Peru', 'Egypt and Sudan'], why: 'The Gobi covers southern Mongolia and northern China.' },
      { lv: 2, q: 'In which country is the Atacama Desert?', a: 'Chile', w: ['Brazil', 'Mexico', 'Egypt'], why: 'The Atacama, one of the driest places on Earth, is in northern Chile.' },
      { lv: 2, q: 'What is a rain shadow?', a: 'A dry area on the far side of mountains', w: ['A cloud that never rains', 'A dark sky before a storm', 'Rain that falls at night'], why: 'Wet air drops its rain going up one side of the mountains, so the far side stays dry.' },
      { lv: 2, tf: false, q: 'It never rains in a desert.', why: 'Deserts get very little rain — but it does come, sometimes in sudden storms.' },
      { lv: 2, tf: true, q: 'A sudden storm in a desert can cause a flash flood.', why: 'Hard, dry ground cannot soak the water up fast, so it rushes along the dry valleys.' },
      { lv: 2, q: 'What is a mirage?', a: 'A trick of the light that looks like water far away', w: ['A pool of water under the sand', 'A desert wind', 'A kind of cactus'], why: 'Hot air near the ground bends light from the sky, so it looks like shining water.' },
      { lv: 3, q: 'What do we call it when farmland slowly turns into desert?', a: 'Desertification', w: ['Erosion', 'Irrigation', 'Migration'], why: 'Too little rain, too many animals grazing or too many trees cut can turn land to desert.' },
      { lv: 3, q: 'What is bringing water to dry fields by canals and pipes called?', a: 'Irrigation', w: ['Desertification', 'Erosion', 'Evaporation'], why: 'Irrigation lets farmers grow crops even where little rain falls.' },
      { lv: 3, tf: false, q: 'Deserts are only found near the equator.', why: 'The Gobi is far to the north, and Antarctica is at the South Pole.' },
      { lv: 3, tf: true, q: 'Wind can carve desert rocks into strange shapes by blasting them with sand.', why: 'Sand carried by the wind wears rock away like sandpaper.' },
    ])) },
];
