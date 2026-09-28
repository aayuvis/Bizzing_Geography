#!/usr/bin/env node
/* build.mjs — make the app's map and country data from open sources.

   Every boundary, capital and neighbour the app shows comes out of here, and
   nothing in app/src/data/{world.json,countries.js,regions.json,india.js} is
   edited by hand: change a source or a rule below, and rebuild.

   SOURCES
   · Natural Earth 1:10m Admin 0 — Countries, the **India point-of-view**
     edition (ne_10m_admin_0_countries_ind). Public domain. The Bizzing family
     uses the Survey of India depiction everywhere, for every user, in every
     locale (Bizzing India docs/07 §7): Jammu & Kashmir whole. Natural Earth
     publishes exactly that worldview, so the world map needs no surgery.
     test/data.mjs checks it — Gilgit, Muzaffarabad and Aksai Chin fall inside
     India's shape — so a rebuild from the wrong file fails, not ships.
   · Natural Earth 1:10m Admin 1 — States and Provinces: the United States,
     Canada and Australia.
   · Natural Earth 1:10m Populated Places: capital coordinates.
   · mledoze/countries (npm world-countries, ODbL): names, capitals, region,
     neighbours, area, landlocked.
   · flag-icons (npm, MIT): flag SVGs.
   · Bizzing India's own India map (app/map-data.js + app/data-geo.js), for
     India's states: the family's ONE India, already signed off, with its
     capitals placed. Read from a sibling checkout ($BIZZING_INDIA, default
     ../bizzingindia.com) — never vendored by hand. Two corrections are
     applied here and noted in the output, because India's data predates them:
     Jammu & Kashmir is a union territory (2019), and Dadra & Nagar Haveli and
     Daman & Diu are one union territory (2020).

   RUN
     cd tools/geo && npm install
     NE=/path/to/natural-earth node build.mjs      # $NE holds the three files above
*/
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT = path.join(ROOT, 'app', 'src', 'data');
const NE = process.env.NE || path.join(HERE, 'ne');
const INDIA = process.env.BIZZING_INDIA || path.resolve(ROOT, '..', 'bizzingindia.com');
const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'geo-'));
const mapshaper = (...a) => execFileSync(path.join(HERE, 'node_modules', '.bin', 'mapshaper'), a, { stdio: ['ignore', 'ignore', 'inherit'] });
const note = [];

/* ------------------------------------------------------------ countries */
const WC = require('world-countries');

/* The quiz pool: the 193 UN members plus the two UN observer states — the
   usual "195 countries". Everything else on the map (Greenland, Taiwan,
   Western Sahara, Antarctica…) is drawn and can be tapped for its name, but
   is never quizzed as a country and never called one. */
const OBSERVERS = new Set(['VA', 'PS']);
const isQuizzed = (c) => c.unMember || OBSERVERS.has(c.cca2);

/* The seven-continent model most schools teach. world-countries says
   "Americas"; its subregion splits North (with Central America and the
   Caribbean) from South. */
function continentOf(c) {
  if (c.region === 'Americas') return c.subregion === 'South America' ? 'South America' : 'North America';
  if (c.region === 'Antarctic') return 'Antarctica';
  return { Africa: 'Africa', Asia: 'Asia', Europe: 'Europe', Oceania: 'Oceania' }[c.region] || c.region;
}

/* capitals: Natural Earth's own capital points, matched by country + name */
const places = JSON.parse(fs.readFileSync(path.join(NE, 'ne_10m_populated_places_simple.geojson'))).features.map((f) => f.properties);
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
/* Names that differ between the two sources, checked by hand. */
const ALIAS = { 'washingtondc': 'washington', 'cityofvictoria': 'victoria', 'kyiv': 'kiev', 'nuku': 'nukualofa',
  'sritjayawardenepurakotte': 'srijawewardenepurakotte', 'nuuk': 'godthab', 'andorralavella': 'andorra', 'copenhagen': 'kobenhavn',
  'stgeorges': 'saintgeorges', 'southtarawa': 'tarawa', 'cityofsanmarino': 'sanmarino' };
function capAt(c, name) {
  const want = [norm(name), ALIAS[norm(name)]].filter(Boolean);
  const hit = places.find((p) => p.iso_a2 === c.cca2 && want.includes(norm(p.name)) && /capital/i.test(p.featurecla))
    || places.find((p) => p.iso_a2 === c.cca2 && want.includes(norm(p.name)))
    || places.find((p) => p.adm0_a3 === c.cca3 && want.includes(norm(p.nameascii)))
    || places.find((p) => want.includes(norm(p.name)) && /Admin-0 cap/.test(p.featurecla));
  return hit ? [+hit.latitude.toFixed(3), +hit.longitude.toFixed(3)] : null;
}
/* Capitals Natural Earth does not carry, from the capital's own government
   or Britannica, checked by hand. */
const CAP_FIX = { 'Yaren': [-0.547, 166.921], 'Ngerulmud': [7.500, 134.624], 'Sri Jayawardenepura Kotte': [6.890, 79.918], 'Palikir': [6.917, 158.158] };

/* world-countries' capital list, with the choices a school atlas makes */
const CAP_NAME = {
  /* Bolivia: Sucre is the constitutional capital, La Paz the seat of government — both taught. */
  BO: ['Sucre', 'La Paz'],
  /* South Africa has three: executive, legislative, judicial. */
  ZA: ['Pretoria', 'Cape Town', 'Bloemfontein'],
  /* Israel: shown as the country designates it, with the note most atlases carry. */
  IL: ['Jerusalem'],
  PS: ['Ramallah'],
  /* the spelling most atlases now use */
  MN: ['Ulaanbaatar'],
};
const CAP_NOTE = {
  BO: 'Bolivia has two: Sucre, the capital in the constitution, and La Paz, where the government sits.',
  ZA: 'South Africa has three capitals: Pretoria (government), Cape Town (parliament) and Bloemfontein (courts).',
  IL: 'Israel designates Jerusalem as its capital; many countries keep their embassies in Tel Aviv.',
  PS: 'Ramallah is where the Palestinian government sits; Palestine designates East Jerusalem as its capital.',
  NL: 'Amsterdam is the capital in the constitution; the government sits in The Hague.',
  MY: 'Kuala Lumpur is the capital; the government has moved much of its work to Putrajaya.',
  CI: 'Yamoussoukro is the official capital; Abidjan is the biggest city and where most government work happens.',
};

const byCca3 = Object.fromEntries(WC.map((c) => [c.cca3, c]));
const countries = [];
const missing = [];
for (const c of WC) {
  if (!c.cca2 || c.cca2 === 'XK' && !c.independent) continue;
  const caps = CAP_NAME[c.cca2] || c.capital || [];
  const at = caps.map((n) => capAt(c, n) || CAP_FIX[n] || null);
  if (isQuizzed(c)) caps.forEach((n, i) => { if (!at[i]) missing.push(`${c.cca2} ${n}`); });
  countries.push({
    cc: c.cca2, c3: c.cca3, name: c.name.common, official: c.name.official,
    cap: caps, capAt: at, capNote: CAP_NOTE[c.cca2] || null,
    cont: continentOf(c), sub: c.subregion || '',
    at: c.latlng ? [+c.latlng[0].toFixed(2), +c.latlng[1].toFixed(2)] : null,
    area: Math.round(c.area || 0), landlocked: !!c.landlocked,
    borders: (c.borders || []).map((b) => byCca3[b] && byCca3[b].cca2).filter(Boolean),
    flag: c.flag, quiz: isQuizzed(c),
  });
}
if (missing.length) { console.error('capitals with no coordinates:', missing.join(', ')); process.exit(1); }
countries.sort((a, b) => a.name.localeCompare(b.name));
const quizN = countries.filter((c) => c.quiz).length;
if (quizN !== 195) { console.error(`expected 195 quizzed countries, got ${quizN}`); process.exit(1); }

/* ------------------------------------------------------------ world map */
/* Simplified hard (the app draws the whole world in a phone's width) but
   keep-shapes, so no small island state vanishes from a quiz that asks for it. */
const worldTopo = path.join(TMP, 'world.json');
mapshaper('-i', path.join(NE, 'ne_10m_admin_0_countries_ind.shp'),
  '-each', 'cc = ISO_A2_EH == "-99" ? (ADMIN == "Kosovo" ? "XK" : ADM0_A3) : ISO_A2_EH, n = ADMIN',
  '-filter-fields', 'cc,n', '-simplify', 'interval=6000', 'keep-shapes',
  '-o', 'format=topojson', 'quantization=20000', 'id-field=cc', worldTopo);


/* every quizzed country must have a shape to tap */
const topo = JSON.parse(fs.readFileSync(worldTopo));
const ids = new Set(Object.values(topo.objects)[0].geometries.map((g) => g.id));
const noShape = countries.filter((c) => c.quiz && !ids.has(c.cc)).map((c) => c.cc);
if (noShape.length) { console.error('quizzed countries with no shape on the map:', noShape.join(' ')); process.exit(1); }
for (const c of countries) c.shape = ids.has(c.cc);

/* ------------------------------------------------------------ states */
/* The United States (50 states + DC), Canada (13) and Australia (6 states,
   2 mainland territories). The tiny Australian external territories are
   dropped; they are not what a child means by "the states of Australia". */
const KEEP_AU = new Set(['Western Australia', 'Northern Territory', 'South Australia', 'Queensland', 'New South Wales', 'Victoria', 'Tasmania', 'Australian Capital Territory']);
const admin1 = path.join(NE, 'ne_10m_admin_1_states_provinces.geojson');
const regionsTopo = path.join(TMP, 'regions.json');
mapshaper('-i', admin1,
  '-filter', `(iso_a2 == "US") || (iso_a2 == "CA") || (iso_a2 == "AU" && ${JSON.stringify([...KEEP_AU])}.indexOf(name) > -1)` +
    ` || ((iso_a2 == "BR" || iso_a2 == "MX" || iso_a2 == "DE" || iso_a2 == "NG") && iso_3166_2.indexOf('~') < 0)`,
  '-each', 'id = iso_3166_2, c = iso_a2, n = name', '-filter-fields', 'id,c,n',
  '-simplify', '6%', 'keep-shapes', 'planar',
  '-split', 'c', '-o', 'format=topojson', 'quantization=20000', 'id-field=id', regionsTopo);


/* State capitals — the list every school atlas prints, checked against each
   country's own government. Coordinates come from Natural Earth's places. */
const STATE_CAPS = {
  US: { AL: 'Montgomery', AK: 'Juneau', AZ: 'Phoenix', AR: 'Little Rock', CA: 'Sacramento', CO: 'Denver', CT: 'Hartford', DE: 'Dover',
    FL: 'Tallahassee', GA: 'Atlanta', HI: 'Honolulu', ID: 'Boise', IL: 'Springfield', IN: 'Indianapolis', IA: 'Des Moines', KS: 'Topeka',
    KY: 'Frankfort', LA: 'Baton Rouge', ME: 'Augusta', MD: 'Annapolis', MA: 'Boston', MI: 'Lansing', MN: 'Saint Paul', MS: 'Jackson',
    MO: 'Jefferson City', MT: 'Helena', NE: 'Lincoln', NV: 'Carson City', NH: 'Concord', NJ: 'Trenton', NM: 'Santa Fe', NY: 'Albany',
    NC: 'Raleigh', ND: 'Bismarck', OH: 'Columbus', OK: 'Oklahoma City', OR: 'Salem', PA: 'Harrisburg', RI: 'Providence', SC: 'Columbia',
    SD: 'Pierre', TN: 'Nashville', TX: 'Austin', UT: 'Salt Lake City', VT: 'Montpelier', VA: 'Richmond', WA: 'Olympia', WV: 'Charleston',
    WI: 'Madison', WY: 'Cheyenne', DC: 'Washington' },
  CA: { BC: 'Victoria', AB: 'Edmonton', SK: 'Regina', MB: 'Winnipeg', ON: 'Toronto', QC: 'Québec', NB: 'Fredericton', NS: 'Halifax',
    PE: 'Charlottetown', NL: "St. John's", YT: 'Whitehorse', NT: 'Yellowknife', NU: 'Iqaluit' },
  AU: { NSW: 'Sydney', VIC: 'Melbourne', QLD: 'Brisbane', WA: 'Perth', SA: 'Adelaide', TAS: 'Hobart', NT: 'Darwin', ACT: 'Canberra' },
  BR: { AC: 'Rio Branco', AL: 'Maceió', AP: 'Macapá', AM: 'Manaus', BA: 'Salvador', CE: 'Fortaleza', DF: 'Brasília', ES: 'Vitória',
    GO: 'Goiânia', MA: 'São Luís', MT: 'Cuiabá', MS: 'Campo Grande', MG: 'Belo Horizonte', PA: 'Belém', PB: 'João Pessoa', PR: 'Curitiba',
    PE: 'Recife', PI: 'Teresina', RJ: 'Rio de Janeiro', RN: 'Natal', RS: 'Porto Alegre', RO: 'Porto Velho', RR: 'Boa Vista',
    SC: 'Florianópolis', SP: 'São Paulo', SE: 'Aracaju', TO: 'Palmas' },
  MX: { AGU: 'Aguascalientes', BCN: 'Mexicali', BCS: 'La Paz', CAM: 'Campeche', CHP: 'Tuxtla Gutiérrez', CHH: 'Chihuahua', COA: 'Saltillo',
    COL: 'Colima', DUR: 'Durango', GUA: 'Guanajuato', GRO: 'Chilpancingo', HID: 'Pachuca', JAL: 'Guadalajara', MEX: 'Toluca',
    MIC: 'Morelia', MOR: 'Cuernavaca', NAY: 'Tepic', NLE: 'Monterrey', OAX: 'Oaxaca', PUE: 'Puebla', QUE: 'Querétaro', ROO: 'Chetumal',
    SLP: 'San Luis Potosí', SIN: 'Culiacán', SON: 'Hermosillo', TAB: 'Villahermosa', TAM: 'Ciudad Victoria', TLA: 'Tlaxcala',
    VER: 'Xalapa', YUC: 'Mérida', ZAC: 'Zacatecas', DIF: 'Mexico City' },
  DE: { BW: 'Stuttgart', BY: 'Munich', BE: 'Berlin', BB: 'Potsdam', HB: 'Bremen', HH: 'Hamburg', HE: 'Wiesbaden', MV: 'Schwerin',
    NI: 'Hanover', NW: 'Düsseldorf', RP: 'Mainz', SL: 'Saarbrücken', SN: 'Dresden', ST: 'Magdeburg', SH: 'Kiel', TH: 'Erfurt' },
  NG: { AB: 'Umuahia', AD: 'Yola', AK: 'Uyo', AN: 'Awka', BA: 'Bauchi', BY: 'Yenagoa', BE: 'Makurdi', BO: 'Maiduguri', CR: 'Calabar',
    DE: 'Asaba', EB: 'Abakaliki', ED: 'Benin City', EK: 'Ado-Ekiti', EN: 'Enugu', GO: 'Gombe', IM: 'Owerri', JI: 'Dutse', KD: 'Kaduna',
    KN: 'Kano', KT: 'Katsina', KE: 'Birnin Kebbi', KO: 'Lokoja', KW: 'Ilorin', LA: 'Ikeja', NA: 'Lafia', NI: 'Minna', OG: 'Abeokuta',
    ON: 'Akure', OS: 'Osogbo', OY: 'Ibadan', PL: 'Jos', RI: 'Port Harcourt', SO: 'Sokoto', TA: 'Jalingo', YO: 'Damaturu', ZA: 'Gusau',
    FC: 'Abuja' },
};
/* Names a child reads in English, and names that have changed since the data
   was drawn: Mexico's Distrito Federal became Mexico City (CDMX) in 2016;
   Nasarawa's official spelling. */
/* Capitals Natural Earth's places do not carry, from each city's own coordinates (checked
   to lie inside their state below, like every other capital). */
const CAP_AT = { 'NG-LA': [6.602, 3.351], 'NG-BY': [4.927, 6.267], 'NG-DE': [6.198, 6.733], 'NG-EB': [6.325, 8.113], 'NG-OS': [7.771, 4.557] };
const STATE_NAME = {
  'DE-BY': 'Bavaria', 'DE-SN': 'Saxony', 'DE-NI': 'Lower Saxony', 'DE-NW': 'North Rhine-Westphalia', 'DE-RP': 'Rhineland-Palatinate',
  'DE-HE': 'Hesse', 'DE-TH': 'Thuringia', 'DE-ST': 'Saxony-Anhalt', 'DE-MV': 'Mecklenburg-Western Pomerania',
  'MX-DIF': 'Mexico City', 'MX-MEX': 'State of Mexico', 'NG-NA': 'Nasarawa', 'NG-FC': 'Federal Capital Territory', 'BR-DF': 'Federal District',
};
const rTopo = JSON.parse(fs.readFileSync(regionsTopo));
const { feature: topoFeature } = require(path.join(ROOT, 'app/node_modules/topojson-client'));
const { geoContains } = await import(path.join(ROOT, 'app/node_modules/d3-geo/src/index.js'));
const rFeat = {};
for (const obj of Object.values(rTopo.objects)) for (const f of topoFeature(rTopo, obj).features) rFeat[f.id] = f;
const states = [];
for (const [c, obj] of Object.entries(rTopo.objects)) {
  for (const g of obj.geometries) {
    const code = g.id.split('-')[1];
    const cap = STATE_CAPS[c] && STATE_CAPS[c][code];
    if (!cap) { console.error(`no capital for ${g.id} ${g.properties.n}`); process.exit(1); }
    /* the capital point Natural Earth files under this state, whose name is the capital's */
    const same = (x) => [norm(x.name), norm(x.nameascii)].some((n) => n === norm(cap) || n.replace(/^st/, 'saint') === norm(cap));
    const inState = (x) => x.iso_a2 === c && (norm(x.adm1name) === norm(g.properties.n) || (code === 'DC' && /district/i.test(x.adm1name)));
    /* or, when the data spells the state differently: a place of that name that lies inside the state's shape */
    const f = rFeat[g.id], inShape = (x) => x.iso_a2 === c && geoContains(f, [x.longitude, x.latitude]);
    const p = places.find((x) => inState(x) && same(x) && /capital/i.test(x.featurecla)) || places.find((x) => inState(x) && same(x))
      || places.find((x) => inShape(x) && same(x))
      || (code === 'DC' && places.find((x) => x.iso_a2 === 'US' && /Admin-0 capital/.test(x.featurecla)));
    const at = p ? [+p.latitude.toFixed(3), +p.longitude.toFixed(3)] : CAP_AT[g.id];
    if (!at) { console.error(`no coordinates for ${cap}, ${g.id}`); process.exit(1); }
    states.push({ id: g.id, c, code, name: STATE_NAME[g.id] || g.properties.n, cap, capAt: at });
  }
}
const want = { US: 51, CA: 13, AU: 8, BR: 27, MX: 32, DE: 16, NG: 37 };
for (const [c, n] of Object.entries(want)) {
  const got = states.filter((s) => s.c === c).length;
  if (got !== n) { console.error(`${c}: expected ${n} regions, got ${got}`); process.exit(1); }
}

/* ------------------------------------------------------------ India */
const win = {};
new Function('window', fs.readFileSync(path.join(INDIA, 'app', 'map-data.js'), 'utf8'))(win);
new Function('window', fs.readFileSync(path.join(INDIA, 'app', 'data-geo.js'), 'utf8'))(win);
const IM = win.IND_MAP, IG = win.IND_GEO.states;
const india = { viewBox: IM.viewBox, outline: IM.outline, states: [] };
for (const [code, d] of Object.entries(IM.paths)) {
  const g = IG[code]; if (!g) continue;
  india.states.push({ id: 'IN-' + code, code, name: g.name, type: g.type === 'ut' ? 'ut' : 'state', cap: g.capital, d,
    capXY: IM.capitals[code] ? IM.capitals[code].slice(0, 2) : null, anchor: IM.anchors[code] || null });
}
const S = (code) => india.states.find((s) => s.code === code);
/* 2019: the Jammu and Kashmir Reorganisation Act made J&K a union territory. */
if (S('JK') && S('JK').type !== 'ut') { S('JK').type = 'ut'; note.push('India: Jammu & Kashmir set to union territory (2019 reorganisation).'); }
/* 2020: Dadra & Nagar Haveli and Daman & Diu merged into one union territory, capital Daman. */
if (S('DN') && S('DD')) {
  const dn = S('DN'), dd = S('DD');
  india.states = india.states.filter((s) => s !== dn && s !== dd);
  india.states.push({ id: 'IN-DH', code: 'DH', name: 'Dadra & Nagar Haveli and Daman & Diu', type: 'ut', cap: 'Daman',
    d: dn.d + dd.d, capXY: [dd.anchor[0] + 8, dd.anchor[1]], anchor: dn.anchor });
  note.push('India: Dadra & Nagar Haveli and Daman & Diu merged (2020), capital Daman.');
}
/* Lakshadweep: map-data.js places its capital but carries no island paths
   (its header says it does — it does not). Until it does, draw the chain as
   small island dots along the line from its anchor to Kavaratti, and say so. */
if (!S('LD') && IG.LD && IM.capitals.LD) {
  const [x0, y0] = IM.anchors.LD || [150, 885], [x1, y1] = IM.capitals.LD;
  const dot = (x, y, r) => `M${(x - r).toFixed(1)},${y.toFixed(1)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
  let d = ''; for (let i = 0; i <= 6; i++) { const t = i / 6; d += dot(x0 + (x1 - x0) * t + (i % 2 ? 6 : -4), y0 + (y1 - y0) * t, 2.6); }
  india.states.push({ id: 'IN-LD', code: 'LD', name: IG.LD.name, type: 'ut', cap: IG.LD.capital, d, capXY: IM.capitals.LD.slice(0, 2), anchor: [x0, y0] });
  note.push('India: Lakshadweep has no island geometry in map-data.js; drawn as a chain of island dots (schematic).');
}
if (S('JK')) S('JK').cap = 'Srinagar (summer), Jammu (winter)';
const nSt = india.states.filter((s) => s.type === 'state').length, nUt = india.states.filter((s) => s.type === 'ut').length;
if (nSt !== 28 || nUt !== 8) { console.error(`India: expected 28 states + 8 UTs, got ${nSt} + ${nUt}`); process.exit(1); }
india.states.sort((a, b) => a.name.localeCompare(b.name));
const indiaSrc = execFileSync('git', ['-C', INDIA, 'rev-parse', '--short', 'HEAD']).toString().trim();

/* ------------------------------------------------------------ flags */
const FLAGS = path.join(ROOT, 'app', 'public', 'flags');
fs.mkdirSync(FLAGS, { recursive: true });
const FI = path.join(HERE, 'node_modules', 'flag-icons', 'flags', '4x3');
let nf = 0;
for (const c of countries) {
  const f = path.join(FI, c.cc.toLowerCase() + '.svg');
  if (fs.existsSync(f)) { fs.copyFileSync(f, path.join(FLAGS, c.cc.toLowerCase() + '.svg')); nf++; c.hasFlag = true; }
  else if (c.quiz) { console.error('no flag for', c.cc); process.exit(1); }
}

/* ------------------------------------------------------------ write */
const HEAD = (what) => `/* ${what} — GENERATED by tools/geo/build.mjs. Do not edit; change the build and rerun. */\n`;
fs.writeFileSync(path.join(OUT, 'world.js'), HEAD('world.js — TopoJSON, Natural Earth 1:10m, India point of view') + `export const WORLD = ${fs.readFileSync(worldTopo, 'utf8')};\n`);
fs.writeFileSync(path.join(OUT, 'regions.js'), HEAD('regions.js — TopoJSON, Natural Earth 1:10m admin-1: US, CA, AU') + `export const REGIONS = ${fs.readFileSync(regionsTopo, 'utf8')};\n`);
fs.writeFileSync(path.join(OUT, 'countries.js'), HEAD('countries.js') +
  `export const COUNTRIES = ${JSON.stringify(countries)};\n`);
fs.writeFileSync(path.join(OUT, 'states.js'), HEAD('states.js') +
  `export const STATES = ${JSON.stringify(states)};\n`);
fs.writeFileSync(path.join(OUT, 'india.js'), HEAD(`india.js — from Bizzing India app/map-data.js + data-geo.js @ ${indiaSrc}; Survey of India depiction, J&K whole`) +
  note.map((n) => `/* ${n} */\n`).join('') + `export const INDIA = ${JSON.stringify(india)};\n`);

const kb = (f) => Math.round(fs.statSync(path.join(OUT, f)).size / 1024);
console.log(`countries: ${countries.length} (${quizN} quizzed), world.js ${kb('world.js')} KB, countries.js ${kb('countries.js')} KB`);
console.log(`states: ${states.length}, regions.js ${kb('regions.js')} KB; India ${nSt} states + ${nUt} UTs, india.js ${kb('india.js')} KB; flags ${nf}`);
for (const n of note) console.log('note:', n);
