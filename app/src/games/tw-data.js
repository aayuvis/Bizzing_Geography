/* tw-data.js — the facts Shelly's Trade Winds is built on. Everything a child is told
   here either comes from the app's data (a port's country, continent, latitude — so its
   climate band and wind belt) or is written below with its source. The game simplifies
   (one cargo per band, a month per turn); every simplification is said on screen.
   TRADEWINDS_NEEDS_REVIEW stays true until a second reader has checked this file. */

export const TRADEWINDS_NEEDS_REVIEW = true;

/* Ports: 'name|country' exactly as data/places.js has them (the build fails on a missing one).
   Chosen to spread round every ocean; that each is a seaport is the only typed claim. */
export const PORT_NAMES = [
  // Indian Ocean
  'Mumbai|IN', 'Kolkata|IN', 'Chennai|IN', 'Colombo|LK', 'Karachi|PK', 'Muscat|OM', 'Aden|YE', 'Jeddah|SA', 'Djibouti|DJ', 'Mombasa|KE', 'Dar es Salaam|TZ', 'Durban|ZA', 'Toamasina|MG', 'Port Louis|MU', 'Perth|AU', 'Yangon|MM',
  // the seas of South-East Asia and the Pacific
  'Singapore|SG', 'Jakarta|ID', 'Bangkok|TH', 'Ho Chi Minh City|VN', 'Manila|PH', 'Shanghai|CN', 'Busan|KR', 'Tokyo|JP', 'Vladivostok|RU', 'Darwin|AU', 'Port Moresby|PG', 'Sydney|AU', 'Auckland|NZ', 'Wellington|NZ', 'Suva|FJ',
  'Vancouver|CA', 'San Francisco|US', 'Acapulco|MX', 'Panama City|PA', 'Guayaquil|EC', 'Lima|PE', 'Valparaíso|CL',
  // the Atlantic and its seas
  'Cape Town|ZA', 'Luanda|AO', 'Lagos|NG', 'Accra|GH', 'Dakar|SN', 'Casablanca|MA', 'Lisbon|PT', 'London|GB', 'Rotterdam|NL', 'Oslo|NO', 'Reykjavík|IS', 'New York|US', 'Halifax|CA', 'Havana|CU', 'Colón|PA',
  'Recife|BR', 'Rio de Janeiro|BR', 'Buenos Aires|AR', 'Marseille|FR', 'Genoa|IT', 'Alexandria|EG', 'Istanbul|TR',
];
export const PORT_SRC = ['Encyclopaedia Britannica — each city’s entry names it a port'];

/* Straits too narrow for a half-degree grid to see: opened along their channel. */
export const STRAITS = [
  { id: 'gibraltar', name: 'Strait of Gibraltar', joins: 'the Atlantic and the Mediterranean', line: [[35.95, -6.1], [36.0, -5.3]] },
  { id: 'bosphorus', name: 'Bosporus', joins: 'the Black Sea and the Sea of Marmara', line: [[41.25, 29.12], [41.0, 29.0]] },
  { id: 'dardanelles', name: 'Dardanelles', joins: 'the Sea of Marmara and the Aegean', line: [[40.45, 26.75], [40.0, 26.15]] },
  { id: 'babelmandeb', name: 'Bab-el-Mandeb', joins: 'the Red Sea and the Gulf of Aden', line: [[13.1, 43.05], [12.35, 43.6]] },
  { id: 'hormuz', name: 'Strait of Hormuz', joins: 'the Persian Gulf and the Gulf of Oman', line: [[26.45, 55.9], [26.1, 57.1]] },
  { id: 'malacca', name: 'Strait of Malacca', joins: 'the Indian Ocean and the South China Sea', line: [[5.5, 98.5], [3.0, 100.7], [1.2, 103.6], [1.25, 104.4]] },
  { id: 'dover', name: 'Strait of Dover', joins: 'the English Channel and the North Sea', line: [[50.8, 1.2], [51.2, 1.7]] },
  { id: 'fuca', name: 'Strait of Juan de Fuca', joins: 'the Pacific and the waters of Vancouver', line: [[48.5, -124.8], [48.25, -123.6], [48.5, -123.2], [49.0, -123.3], [49.25, -123.2]] },
  { id: 'torres', name: 'Torres Strait', joins: 'the Coral Sea and the Arafura Sea', line: [[-10.4, 141.4], [-10.6, 142.9]] },
];
export const STRAITS_SRC = ['Encyclopaedia Britannica — “Strait of Gibraltar”, “Bosporus”, “Dardanelles”, “Bab el-Mandeb”, “Strait of Hormuz”, “Strait of Malacca”, “Strait of Dover”, “Strait of Juan de Fuca”, “Torres Strait”'];

export const CANALS = {
  suez: { name: 'Suez Canal', year: 1869, joins: 'the Mediterranean and the Red Sea', line: [[31.27, 32.3], [30.6, 32.32], [29.95, 32.55], [29.0, 32.9], [27.8, 33.7]] },   // the canal, then the narrow Gulf of Suez to the Red Sea
  panama: { name: 'Panama Canal', year: 1914, joins: 'the Atlantic and the Pacific', line: [[9.36, -79.92], [9.1, -79.7], [8.9, -79.53]] },
};
export const CANALS_SRC = ['Encyclopaedia Britannica — “Suez Canal” (opened 17 November 1869)', 'Encyclopaedia Britannica — “Panama Canal” (opened 15 August 1914)'];

/* The four ages. The years are when each thing became real in history; in the game an
   age opens when the player's own network is ready for it. */
export const ERAS = [
  { id: 'sail', name: 'The Age of Sail', year: 1800, canals: 0, speed: 4500, wind: 1, need: 0,
    card: 'Ships go where the wind lets them. Sail with it and a voyage is quick; against it, slow.' },
  { id: 'steam', name: 'The Age of Steam', year: 1840, canals: 0, speed: 6000, wind: 0.5, need: 14,
    card: 'Steamships began crossing the Atlantic on a timetable in 1838. Engines push against the wind — it matters half as much now.' },
  { id: 'suez', name: 'The Suez Canal', year: 1869, canals: 1, speed: 6000, wind: 0.5, need: 40,
    card: 'In 1869 the Suez Canal opened between the Mediterranean and the Red Sea. Ships from Europe to India no longer had to go round Africa.' },
  { id: 'panama', name: 'The Panama Canal', year: 1914, canals: 2, speed: 7500, wind: 0.4, need: 75,
    card: 'In 1914 the Panama Canal opened across Central America, joining the Atlantic to the Pacific. The long way round South America became a short cut.' },
];
export const ERAS_SRC = ['Encyclopaedia Britannica — “steamship” (the Great Western’s Atlantic crossings, 1838)', ...CANALS_SRC];

/* Climate bands by latitude (what the Atlas teaches at the "climate zones" stop) and the
   cargo each band trades in the game. A simplification, said so on screen. */
export const BANDS = [
  { id: 'trop', max: 23.5, name: 'Tropics', good: 'fruit', glyph: '🍍', goodName: 'tropical fruit' },
  { id: 'sub', max: 35, name: 'Subtropics', good: 'cotton', glyph: '🧶', goodName: 'cotton' },
  { id: 'temp', max: 55, name: 'Temperate lands', good: 'grain', glyph: '🌾', goodName: 'grain' },
  { id: 'cold', max: 90, name: 'Cold lands', good: 'timber', glyph: '🪵', goodName: 'timber' },
];
export const bandOf = (lat) => BANDS.find((b) => Math.abs(lat) < b.max) || BANDS[3];

/* The planet's wind belts. Each blows FROM a direction: a ship going the same way as the
   wind sails fast. `east` = the wind pushes ships eastward. */
export const BELTS = [
  { id: 'trades', name: 'the trade winds', max: 30, east: -1, says: 'blow from the east, pushing ships west' },
  { id: 'westerlies', name: 'the westerlies', max: 60, east: 1, says: 'blow from the west, pushing ships east' },
  { id: 'polar', name: 'the polar easterlies', max: 90, east: -1, says: 'blow from the east, near the poles' },
];
export const beltOf = (lat) => BELTS.find((b) => Math.abs(lat) < b.max) || BELTS[2];
/* The monsoon: over the northern Indian Ocean the wind turns round with the seasons. */
export const MONSOON = { box: [0, 40, 25, 100], sw: [5, 6, 7, 8], ne: [11, 0, 1, 2],   // months 0 = January
  says: { sw: 'the summer monsoon blows from the south-west — ships run north-east', ne: 'the winter monsoon blows from the north-east — ships run south-west' } };
/* Storms and ice, by season. Simplified to bands and months. */
export const HAZARDS = {
  cyclones: { name: 'cyclone season', lat: [5, 30], north: [5, 6, 7, 8, 9, 10], south: [11, 0, 1, 2, 3], wait: 1 },
  ice: { name: 'sea ice', lat: 60, north: [11, 0, 1, 2, 3], south: [5, 6, 7, 8, 9] },
};
export const WIND_SRC = ['NOAA / National Weather Service — “Global circulation: trade winds, westerlies and polar easterlies”', 'India Meteorological Department — “Monsoon” (south-west June–September, north-east winter monsoon)',
  'NOAA — “Hurricane season” (Atlantic and eastern Pacific, 1 June – 30 November; southern hemisphere roughly November–April)', 'NSIDC — “Arctic and Antarctic sea ice: the seasonal cycle”'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
