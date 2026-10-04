/* tw-story.js — the Long Voyage's tables: ranks, ships, inventions, earned things, the crew, the
   Keeper's Gifts, the ten expeditions, the dangers, Mira's notes and the Ship's Log cards.

   The story is the owner's ("Shelly's Trade Winds: The Long Voyage"). What it invents, it invents on
   purpose and says so on screen: Saltreach, the two crowns of Varn and Ostery, the Grey Gulls and
   their captain Corvax. Nothing invented is ever cast on a real country or people: the crowns are
   fleets at sea, the pirates are a band of sailors, and no real port belongs to either.

   Rules the tables keep (the owner's design, "What this changes in today's rules"):
     · people can be a danger, but never an enemy you defeat — wars cannot be joined, pirates are
       never sunk, and the best ending for a pirate is honest work;
     · the crew always comes home — a ship can lose cargo, time, a mast and coin, never a sailor;
     · no loot, no paid chance: an upgrade marked earned is never for sale;
     · every true thing a card says carries its source (LOG_SRC), and the whole file waits for a
       second reader (TRADEWINDS_NEEDS_REVIEW in tw-data.js). */

/* ------------------------------------------------------------------ the career */
export const RANKS = [
  { id: 'sailor', name: 'Sailor', xp: 0, ships: 1, opens: 'Markets, sights and small assignments' },
  { id: 'master', name: 'Master', xp: 600, ships: 1, opens: 'A shipyard will sell you a second ship; larger assignments; Book Two' },
  { id: 'captain', name: 'Captain', xp: 1500, ships: 2, opens: 'Expeditions, and a second captain' },
  { id: 'commodore', name: 'Commodore', xp: 3500, ships: 5, opens: 'Standing routes that sail themselves' },
  { id: 'fleet', name: 'Captain of the Fleet', xp: 6000, ships: 10, opens: 'The end of the game' },
];

/* ------------------------------------------------------------------ the four marks (1–10) */
export const MARKS = [
  { id: 'speed', name: 'Speed', glyph: '💨', says: 'months per voyage, and whether you can outrun trouble' },
  { id: 'cargo', name: 'Cargo', glyph: '📦', says: 'crates in the hold — four for every point' },
  { id: 'strength', name: 'Strength', glyph: '🛡️', says: 'what storms, great waves and ice can do to the hull' },
  { id: 'guard', name: 'Guard', glyph: '🔔', says: 'whether pirates try you, and how a standoff ends — it never sinks anyone' },
];
export const CRATES_PER = 4;   // the story's arithmetic: the Small Hope's Cargo 2 is four crates… the Wakeful's 5 is twenty

/* ships by age (era index from tw-data ERAS: 0 sail, 1 steam, 2 Suez, 3 Panama). The story's own: the Small Hope
   (Speed 2, Cargo 2 — four crates — Strength 1, Guard 1), the Wakeful (a two-masted teak brig), the Ember (a paddle
   steamer with red wheels), and the screw steamers Noor, Kesar and Bahar. */
export const CLASSES = [
  { id: 'dhow', name: 'Dhow', era: 0, price: 300, m: { speed: 2, cargo: 2, strength: 1, guard: 1 }, says: 'A small wooden boat with one patched lateen-shaped sail — the Small Hope is one.' },
  { id: 'brig', name: 'Teak brig', era: 0, price: 700, m: { speed: 4, cargo: 5, strength: 4, guard: 2 }, says: 'Two masts, a teak hull from a Mumbai yard — the Wakeful is one.' },
  { id: 'clipper', name: 'Clipper', era: 0, price: 950, m: { speed: 5, cargo: 4, strength: 3, guard: 2 }, says: 'A narrow ship with a cloud of sail, built to race.' },
  { id: 'paddle', name: 'Paddle steamer', era: 1, price: 1200, m: { speed: 4, cargo: 5, strength: 4, guard: 2 }, says: 'An engine turns two great paddle wheels; sails still help. The Ember is one.' },
  { id: 'screw', name: 'Screw steamer', era: 2, price: 1800, m: { speed: 6, cargo: 6, strength: 6, guard: 3 }, says: 'An iron hull pushed by a propeller under the stern — the Noor, the Kesar and the Bahar.' },
  { id: 'steel', name: 'Steel steamship', era: 3, price: 2600, m: { speed: 7, cargo: 8, strength: 8, guard: 4 }, says: 'A steel hull, a big engine and a wireless mast.' },
];
export const SHIP_NAMES = ['Small Hope', 'Wakeful', 'Ember', 'Noor', 'Kesar', 'Bahar', 'Halima', 'Long Singer', 'Senna', 'Lantern', 'Bowline', 'Tidewater'];

/* the inventions: bought in a shipyard, once per ship; "every invention" = each bought once */
export const INVENTIONS = [
  { id: 'lateen', name: 'Lateen sail', era: 0, mark: 'speed', plus: 1, price: 120, says: 'A triangular sail that can sail closer to the wind.' },
  { id: 'copper', name: 'Copper sheathing', era: 0, mark: 'strength', plus: 1, price: 150, says: 'Copper sheets on the hull below the water keep out shipworm and weed.' },
  { id: 'bell', name: 'Lookout bell', era: 0, mark: 'guard', plus: 1, price: 80, says: 'A bell to ring in fog and to call all hands. Fog costs this ship no time.' },
  { id: 'engine', name: 'Steam engine', era: 1, mark: 'speed', plus: 2, price: 420, needs: 'vasant', says: 'Coal boils water; the steam pushes the engine; the ship goes against the wind.' },
  { id: 'iron', name: 'Iron plating', era: 1, mark: 'strength', plus: 2, price: 360, says: 'Iron plates over the timbers.' },
  { id: 'coaling', name: 'Coaling-station pass', era: 1, mark: 'speed', plus: 1, price: 250, says: 'Coal waiting in ports along the way: no detours to find fuel.' },
  { id: 'condenser', name: 'Condenser', era: 1, mark: 'cargo', plus: 1, price: 200, says: 'Makes fresh water from sea water, so fewer water casks fill the hold.' },
  { id: 'screwprop', name: 'Screw propeller', era: 2, mark: 'speed', plus: 1, price: 300, says: 'A propeller under the stern pushes better than paddle wheels in a rough sea.' },
  { id: 'telegraph', name: 'Telegraph office', era: 2, mark: 'guard', plus: 1, price: 260, says: 'Messages by wire: you see prices in every lit port before you sail.' },
  { id: 'steelhull', name: 'Steel hull', era: 2, mark: 'strength', plus: 2, price: 460, says: 'Steel is stronger and lighter than iron.' },
  { id: 'reefer', name: 'Refrigerated hold', era: 2, mark: 'cargo', plus: 2, price: 500, says: 'A cold hold: fruit and meat cross oceans without spoiling.' },
  { id: 'wireless', name: 'Wireless', era: 3, mark: 'guard', plus: 2, price: 520, says: 'Radio: every ship of the fleet hears every warning.' },
];
/* earned, never sold — the fleet carries them */
export const EARNED = [
  { id: 'starcharts', name: 'A navigator’s star charts', mark: 'speed', plus: 1, how: 'Light ten ports.' },
  { id: 'charter', name: 'A merchant guild’s charter', mark: 'cargo', plus: 2, how: 'Finish ten assignments.' },
  { id: 'bowline', name: 'Pereira’s bowline', mark: 'strength', plus: 1, how: 'Pereira’s last voyage ends at Halifax; his knot stays with Shelby. Cargo is never washed from a hold.' },
  { id: 'signalgun', name: 'Bahar’s signal gun', mark: 'guard', plus: 1, how: 'Light Mombasa. Once a voyage it calls friendly ships to a standoff.' },
  { id: 'pennant', name: 'The free ports’ pennant', mark: 'guard', plus: 1, how: 'Seal the Gate of Grief.' },
  { id: 'convoyflag', name: 'A convoy flag', mark: 'guard', plus: 1, how: 'Seal the Great Convoy.' },
];

/* ------------------------------------------------------------------ the crew (people are never drawn: names and roles only) */
export const CREW = {
  pereira: { name: 'Tomás Pereira', role: 'Bosun', glyph: '⚓', does: 'Strength +1 on Shelly’s ship; with him aboard, cargo is never washed from the hold.' },
  tavi: { name: 'Tavi', role: 'Deckhand, then captain, then radio operator', glyph: '🧭', does: 'Reads a port’s gossip: shows how dark the water is on every voyage you plan.' },
  farida: { name: 'Farida', role: 'Cook and healer', glyph: '🍲', does: 'No sickness on long passages, and a warning before a reckless sailing.' },
  ama: { name: 'Ama', role: 'Wandering albatross', glyph: '🪶', does: 'Long passages run faster. She leaves at Cape Town; her choice to come back and stay wakes Stormsight.' },
  vasant: { name: 'Vasant', role: 'Chief engineer', glyph: '⚙️', does: 'Opens the steam engine, and mends the hull at sea.' },
};

/* ------------------------------------------------------------------ the Keeper's Gifts */
export const GIFTS = [
  { id: 'tidesense', name: 'Tidesense', glyph: '🌊', when: 'The first light', does: 'Shelly feels the currents: her own ship’s voyages run a tenth faster.', cost: 'Works only on the ship Shelly sails in.' },
  { id: 'deepspeech', name: 'Deepspeech', glyph: '🐋', when: 'Five lights', does: 'The Long Singers mark the dark water where the Grey Gulls hunt — shown on the chart.', cost: 'Each season the whales ask a favour: an errand to a port.' },
  { id: 'truthlight', name: 'Truthlight', glyph: '🔦', when: 'Saltreach relit', does: 'Shine it on a letter on an assignment board: a forgery glows.', cost: '20 coin of lamp oil each time.' },
  { id: 'stillwater', name: 'Stillwater', glyph: '🫧', when: 'The White Wall', does: 'One great wave or storm passes with no damage.', cost: 'Once a season, and Shelly sleeps: no gift works until next month.' },
  { id: 'stormsight', name: 'Stormsight', glyph: '🌀', when: 'Ama chooses to stay', does: 'A storm’s path shows early: steer round it for nothing.', cost: 'Each use, Shelly rests: no other gift until next month.' },
  { id: 'longlight', name: 'The Long Light', glyph: '🏮', when: 'All sixty lights lit', does: 'Every port and every ship on the chart at once.', cost: 'Shelby becomes the road’s keeper — the end of the voyage.' },
];

/* ------------------------------------------------------------------ the ten expeditions */
export const EXPEDITIONS = [
  { id: 'cinnamon', name: 'The Cinnamon Road', goal: 'Carry 120 crates from Colombo to Cape Town, none lost.' },
  { id: 'gate', name: 'The Gate of Grief', goal: 'Keep the Red Sea open for a year with no war.' },
  { id: 'northice', name: 'The Northern Ice', goal: 'Bring 40 crates to Reykjavík in one short summer (June to August).' },
  { id: 'banks', name: 'The Grand Banks', goal: 'Reach Halifax through fog or spring ice.' },
  { id: 'lean', name: 'The Lean Season', goal: 'Answer every call for help in one year (at least three).' },
  { id: 'lanterns', name: 'The Pacific Lanterns', goal: 'Light every island port of the Pacific.' },
  { id: 'longway', name: 'The Long Way Round', goal: 'Lisbon to Mumbai round the Cape of Good Hope, under sail.' },
  { id: 'coldcoasts', name: 'The Cold Coasts', goal: 'Carry 100 crates of timber from the cold lands to the tropics.' },
  { id: 'horn', name: 'Round the Horn', goal: 'Buenos Aires to Valparaíso round Cape Horn, before Panama opens.' },
  { id: 'convoy', name: 'The Great Convoy', goal: 'Bring forty merchant ships safely through dark water: four convoy jobs.' },
];

/* ------------------------------------------------------------------ the dangers (regions are bands of the sea, said so on screen) */
export const MEGA = [   // where great waves are met, simplified to boxes [lat0, lng0, lat1, lng1]
  { id: 'agulhas', name: 'the Agulhas Current', box: [-40, 15, -30, 35] },
  { id: 'southern', name: 'the Southern Ocean', box: [-70, -180, -45, 180] },
  { id: 'horn', name: 'Cape Horn', box: [-60, -76, -53, -60] },
];
export const FOG = [
  { id: 'banks', name: 'the Grand Banks', box: [40, -62, 52, -40] },
  { id: 'kuril', name: 'the cold seas off north-east Asia', box: [40, 140, 55, 165] },
];
export const BERGS = { id: 'banks', name: 'the Grand Banks', box: [40, -62, 52, -40], months: [2, 3, 4, 5] };
export const CAPE = { name: 'the Cape of Good Hope', box: [-45, 10, -33, 30] };
export const HORN = { name: 'Cape Horn', box: [-62, -80, -52, -60] };
export const PIRATE_SPEED = [3, 4, 5, 6];   // how fast the Grey Gulls' boats are, by age

/* ------------------------------------------------------------------ the story: five books, Mira's notes */
export const BOOKS = [
  { n: 1, name: 'The Monsoon Sea', opens: 'from the start' },
  { n: 2, name: 'The Gate of Grief', opens: 'when Shelby is a Master' },
  { n: 3, name: 'Smoke on the Horizon', opens: 'with the Age of Steam' },
  { n: 4, name: 'Cut Through the Desert', opens: 'with the Suez Canal' },
  { n: 5, name: 'The Long Light', opens: 'with the Panama Canal' },
];
/* a beat is shown once, when its moment comes; `port` beats wait for that port to be lit */
export const BEATS = {
  start: { book: 1, title: 'The girl who counted waves', text: 'Mumbai, 1800. Shelby is fifteen. On the table Mira left: a chart of sixty dark lights, a cold brass lantern, and a letter — “Do not follow me.” And a boat, the Small Hope. Pereira, a Goan bosun missing two fingers, was paid to sail with her. Tavi, twelve, stowed away. And Shelly, a green sea turtle with a pale crescent on her shell, talks to no one but her.', log: 'float' },
  Muscat: { book: 1, title: 'Mira’s first note', text: 'Noor, the harbourmistress, knows the lantern. In the keeper’s book, in Mira’s hand: “Then at least do it properly. Learn every port. — M.” The first light catches, and Shelby feels the currents for the first time: Tidesense. On the beach, an albatross with a broken wing. Splinted with two oars and a bowline, Ama says: “I thought they were all dead.”', log: 'albatross' },
  Karachi: { book: 1, title: 'Farida comes aboard', text: 'Farida, a cook and healer from Karachi, brings limes against scurvy, knows the monsoon from her grandmother, and will say no when the captain needs to hear it.', log: 'monsoon' },
  Mombasa: { book: 1, title: 'Bahar and the Long Singers', text: 'Under Fort Jesus, Halima has kept her father’s tower clean for somebody to come. Mira’s second note names a young merchant: Bahar. Old Bahar pays the Grey Gulls one part in twenty; he gives Shelby his signal gun anyway — “a loan against the better thing you will show me.” At the fifth light the humpbacks sing, and Shelby understands them: Deepspeech.', log: 'humpback' },
  master: { book: 2, title: 'Aden in the crater', text: 'Shelby is twenty now, with a ship of her own. At Aden, in the crater of an old volcano, two fleets ride at anchor: Queen Isolde of Varn’s Heron’s Patience and King Brannoch of Ostery’s Golden Tide — two invented crowns, each wanting the lights for itself. A letter has gone from the Queen’s strongbox. By dawn the Gate of Grief is closed by war. It cannot be joined. It can only be talked to an end.' },
  saltreach: { book: 2, title: 'A letter between fleets', text: 'On the bare rock of Saltreach, dark for twenty-five years, the lamp is lit with coconut oil. In its light the forged letter glows: a cast seam on the seal, an anchor in a ring in the paper — Master Murrow’s paper. That is Truthlight. Carry the true letter to the fleets, and the war ends.' },
  steam: { book: 3, title: 'Smoke on the horizon', text: '1840. A paddle steamer passes Mumbai with no sail at all. Vasant, a stoker from the Mazagon yard — “that is how I know where the fire is” — comes aboard. Shelby is fifty-five and looks twenty: a keeper ages slowly while her turtle lives, and her crew age a year in three.', log: 'steam' },
  whitewall: { book: 3, title: 'The White Wall', text: 'Off the Wild Coast, where the Agulhas Current runs against the swell, Captain Eirik Hask — a leg of brass and oak — is hunting the wave that took his ship. It comes: a wall of white. Shelby turns bow-on and reaches through Shelly: “Be still.” A ring of calm opens round the ship. Then Shelly sleeps for nine days. Once a season. Never twice.', log: 'roguewave' },
  'Cape Town': { book: 3, title: 'The tablecloth', text: 'Cloud pours over Table Mountain like a white cloth. Mira’s third note: the oldest book “will not open for fewer than sixty lights… I will wait.” Yasmin, Bahar’s first captain, brings his last letter: “You did it. That was the better thing.” The House of Bahar’s ships will carry oil and letters free, and come when the flare goes up. And Ama, thin and old, flies home to her island: “Let me choose again.”', log: 'tablecloth' },
  suez: { book: 4, title: 'Cut through the desert', text: 'November 1869: the Suez Canal opens, with no locks at all — “a very long, very salty ditch,” says Shelly. At the Suez telegraph Shelby sends her count of lights home. The reply comes from a queen: “STILL WATCHING. LIRIEN.”', log: 'suez' },
  Alexandria: { book: 4, title: 'Senna and the Pharos', text: 'Under the fort where the Pharos once stood, Senna the ibis keeps the shelf of copied keepers’ books. “You are late.” Mira’s fourth note: the oldest book is kept “where the day begins” — the line half a world from the first.', log: 'pharos' },
  amareturns: { book: 4, title: 'Ama stays', text: 'In the fog of the Grand Banks, a long white shape comes out of the grey and lands on the yard-arm. “This is home. I’m staying.” Through her eyes, Shelly sees storms a day before they come: Stormsight.', log: 'iceberg' },
  Halifax: { book: 4, title: 'Pereira’s last voyage', text: 'Pereira wanted to see an iceberg, and he does. At Halifax he teaches a boy on the quay the bowline. In the morning the knot is in Shelby’s hand, and Pereira’s voyages are over. She keeps the knot.', log: 'fog' },
  panama: { book: 5, title: 'The Long Light', text: 'Tavi, grown, sits at the wireless and hears every ship on the sea. Murrow’s grandsons pay the Grey Gulls to light false lamps on the reefs — and Corvax, who lost his cormorant Ink at Saltreach long ago, lights his old green lantern instead and leads the ships in. A young cormorant follows his launch now. The Gulls are pilots for hire: honest work at last.', log: 'locks' },
  Suva: { book: 5, title: 'Where the day begins', text: 'At Suva, near the line where the day begins, Mira is waiting with the oldest book. “You took your time,” she says, and laughs.' },
  longlight: { book: 5, title: 'Sixty lights', text: 'The sixtieth lamp catches and the oldest book’s clasp clicks open: the Long Light. Every port and every ship at once — and, here and there, new keepers: the sea has begun to choose again. In the morning Mira and her leatherback have gone out to the deep water together, gently, the way a lamp goes out when someone has finished reading. At home, on the March new moon, the hatchlings run for the sea, and not one turns the wrong way.' },
};

/* ------------------------------------------------------------------ the Ship's Log: true things, with sources */
export const LOG = {
  monsoon: { t: 'The monsoon turns', fact: 'Over the northern Indian Ocean the wind blows from the south-west in summer and from the north-east in winter. For two thousand years it set the calendar of the ocean’s trade.', q: 'In summer, the monsoon over the northern Indian Ocean blows from the…', a: 'south-west', w: ['north-east', 'north', 'east'], src: 'India Meteorological Department — “Monsoon”' },
  knots: { t: 'Knots', fact: 'A ship’s speed is measured in knots: one knot is one nautical mile an hour. Sailors once counted knots on a line paid out behind the ship.', q: 'One knot is one nautical mile…', a: 'an hour', w: ['a day', 'a minute', 'a week'], src: 'Encyclopaedia Britannica — “knot (unit of measurement)”' },
  polestar: { t: 'The Pole Star', fact: 'In the northern sky the Pole Star stays almost still. Its height above the horizon is close to your latitude.', q: 'The Pole Star’s height above the horizon tells you your…', a: 'latitude', w: ['longitude', 'speed', 'depth'], src: 'Encyclopaedia Britannica — “Polaris”' },
  albatross: { t: 'The albatross', fact: 'Albatrosses glide for hours on long, narrow wings, hardly flapping, riding the wind over the waves.', q: 'An albatross crosses oceans mostly by…', a: 'gliding on the wind', w: ['flapping all day', 'swimming', 'riding ships'], src: 'Encyclopaedia Britannica — “albatross”' },
  humpback: { t: 'Whale song', fact: 'Male humpback whales sing long songs. Whales in one population share a song, and it slowly changes from year to year.', q: 'Humpback whales in one population…', a: 'share a song that slowly changes', w: ['never sing', 'each sing a different song forever', 'only sing once'], src: 'NOAA Fisheries — “Humpback whale”' },
  cyclone: { t: 'Cyclones', fact: 'A tropical cyclone is a great spinning storm that forms over warm sea. In the Indian Ocean they are called cyclones; in the Atlantic, hurricanes; in the north-west Pacific, typhoons.', q: 'A typhoon and a hurricane are…', a: 'the same kind of storm', w: ['a wave and a wind', 'two kinds of fog', 'a current and a tide'], src: 'NOAA — “What is the difference between a hurricane and a typhoon?”' },
  steam: { t: 'Steam', fact: 'Burning coal boils water; the steam pushes pistons that turn a paddle wheel or a propeller. A steamship can go against the wind.', q: 'In a ship’s engine, what does burning coal turn the water into?', a: 'steam', w: ['ice', 'salt', 'oil'], src: 'Encyclopaedia Britannica — “steam engine”' },
  roguewave: { t: 'Rogue waves', fact: 'A rogue wave is far taller than the waves around it. They are met where a strong current runs against the swell — as the Agulhas Current does off South Africa.', q: 'Off South Africa, great waves rise where the Agulhas Current runs…', a: 'against the swell', w: ['under the ice', 'into a river', 'round a lake'], src: 'NOAA — “What is a rogue wave?”' },
  tablecloth: { t: 'The tablecloth', fact: 'When moist wind is pushed up over Table Mountain it cools and makes cloud, which pours over the top like a white tablecloth.', q: 'Air pushed up a mountain cools and makes…', a: 'cloud', w: ['ice', 'sand', 'thunder'], src: 'Encyclopaedia Britannica — “Table Mountain”' },
  suez: { t: 'The Suez Canal', fact: 'The Suez Canal opened in 1869 between the Mediterranean and the Red Sea. It has no locks: both seas are at almost the same level.', q: 'The Suez Canal joins the Mediterranean and the…', a: 'Red Sea', w: ['Black Sea', 'Caribbean Sea', 'North Sea'], src: 'Encyclopaedia Britannica — “Suez Canal”' },
  pharos: { t: 'The Pharos', fact: 'The Pharos of Alexandria was a great lighthouse of the ancient world, counted among the Seven Wonders.', q: 'The Pharos of Alexandria was a…', a: 'lighthouse', w: ['library', 'pyramid', 'canal'], src: 'Encyclopaedia Britannica — “Pharos of Alexandria”' },
  fog: { t: 'Sea fog', fact: 'On the Grand Banks, warm, wet air over the Gulf Stream meets the cold Labrador Current, cools, and turns to thick fog.', q: 'Fog on the Grand Banks forms where warm air meets…', a: 'cold water', w: ['a desert', 'a volcano', 'a river mouth'], src: 'NOAA — “Grand Banks”; Encyclopaedia Britannica — “Grand Banks”' },
  iceberg: { t: 'Icebergs', fact: 'Most of an iceberg is under the water — about nine tenths of it.', q: 'About how much of an iceberg is under the water?', a: 'nine tenths', w: ['one tenth', 'half', 'none'], src: 'NOAA — “How much of an iceberg is below the water?”' },
  locks: { t: 'Canal locks', fact: 'The Panama Canal lifts ships with locks: a ship sails into a chamber, the gates close, water fills it, and the ship rises to the next level.', q: 'The Panama Canal lifts ships with…', a: 'locks', w: ['cranes', 'balloons', 'tides'], src: 'Encyclopaedia Britannica — “Panama Canal”' },
  float: { t: 'Why a ship floats', fact: 'A ship floats because it pushes aside water that weighs as much as the ship. Load it, and it sits deeper.', q: 'A loaded ship sits…', a: 'deeper in the water', w: ['higher in the water', 'exactly the same', 'on the sea floor'], src: 'Encyclopaedia Britannica — “buoyancy”' },
  supply: { t: 'Supply and demand', fact: 'A thing that is plentiful sells cheap; a thing that is scarce sells dear. Bring a port what it cannot grow, and it pays well — until many ships bring the same.', q: 'When many ships bring the same cargo to a port, its price…', a: 'falls', w: ['rises', 'stays the same', 'doubles'], src: 'Encyclopaedia Britannica — “supply and demand”' },
};
export const LOG_SRC = [...new Set(Object.values(LOG).map((x) => x.src))];
