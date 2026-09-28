/* Geography Dictionary — every word the Atlas teaches, in one place, in
   plain words, searchable. The entries are the same sentences the lessons
   use, so the dictionary and the lesson can never disagree. */
export const TOOL = { id: 'dictionary', name: 'Geography Dictionary', glyph: '📖', art: 'lib-dictionary', blurb: 'From “archipelago” to “tundra”: every geography word, in plain words.' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const WORDS = [
  ['archipelago', 'a group or chain of islands'], ['bay', 'part of the sea that curves into the land'], ['biome', 'a big area with its own climate, plants and animals'],
  ['canyon', 'a deep, narrow valley with steep sides, often cut by a river'], ['capital', 'the city where a country’s or state’s government works'],
  ['cartographer', 'a person who makes maps'], ['cave', 'a hollow space under the ground or in a cliff'], ['cliff', 'a steep wall of rock, often by the sea'],
  ['climate', 'the usual weather of a place over many years'], ['coast', 'where the land meets the sea'], ['compass', 'a tool whose needle points north'],
  ['condensation', 'water vapour cooling into tiny droplets, as in a cloud'], ['confluence', 'the place where two rivers meet'],
  ['continent', 'one of the seven great areas of land on Earth'], ['core', 'the centre of the Earth, mostly iron and nickel'], ['crust', 'the thin rocky outer layer of the Earth'],
  ['delta', 'a fan of land and channels where a river drops its mud at the sea'], ['desert', 'a place that gets very little rain or snow'],
  ['earthquake', 'the ground shaking when rocks along a fault suddenly slip'], ['equator', 'the line of 0° latitude, halfway between the North and South Poles'],
  ['erosion', 'land being worn away by water, wind or ice'], ['estuary', 'the wide mouth of a river where fresh water meets the tide'],
  ['evaporation', 'water warmed by the Sun rising into the air as vapour'], ['fjord', 'a long, narrow, deep inlet of sea between steep cliffs, carved by a glacier'],
  ['floodplain', 'flat land beside a river that floods when the river is high'], ['glacier', 'a huge, slow river of ice'],
  ['grid reference', 'letters and numbers that pick out one square on a map'], ['hemisphere', 'half of the Earth — northern, southern, eastern or western'],
  ['hill', 'raised land that is lower and gentler than a mountain'], ['island', 'land with water all the way round it'],
  ['isthmus', 'a narrow strip of land joining two larger areas of land'], ['key', 'the list that says what each symbol on a map means (also called a legend)'],
  ['lake', 'a large body of water with land all the way round it'], ['landlocked', 'having no coastline at all'], ['latitude', 'how far north or south of the Equator a place is, in degrees'],
  ['lava', 'melted rock that has come out of a volcano'], ['longitude', 'how far east or west of the Prime Meridian a place is, in degrees'],
  ['magma', 'melted rock under the ground'], ['mantle', 'the thick layer of hot, slowly flowing rock under the crust'],
  ['meander', 'a big bend in a river'], ['megacity', 'a city of more than ten million people'], ['monsoon', 'a seasonal wind that brings a rainy season, as in South Asia'],
  ['mountain', 'a very high, steep piece of land'], ['mouth', 'where a river flows into the sea or a lake'], ['ocean', 'a huge body of salt water — there are five'],
  ['oxbow lake', 'a curved lake left behind when a meander is cut off'], ['peninsula', 'land with water on three sides'], ['plain', 'a wide, flat area of land'],
  ['plate', 'one of the huge pieces the Earth’s crust is broken into'], ['plateau', 'a high area of land that is flat on top'],
  ['population', 'the number of people living in a place'], ['precipitation', 'rain, snow, sleet or hail'], ['Prime Meridian', 'the line of 0° longitude, through Greenwich in London'],
  ['renewable', 'a resource that comes back or never runs out, like sunlight and wind'], ['river', 'fresh water flowing downhill in a channel towards the sea'],
  ['savanna', 'warm grassland with scattered trees and a wet and a dry season'], ['scale', 'how much smaller a map is than the real place'],
  ['sea', 'a large area of salt water, partly closed in by land'], ['settlement', 'any place where people live, from a hamlet to a city'],
  ['source', 'where a river begins'], ['steppe', 'a huge, flat, dry grassland without trees'], ['strait', 'a narrow strip of sea joining two larger seas'],
  ['taiga', 'huge forests of cone-bearing trees with long, cold winters'], ['time zone', 'a region that sets its clocks to the same time'],
  ['tributary', 'a smaller river that joins a bigger one'], ['tropics', 'the warm band of the Earth between the Tropic of Cancer and the Tropic of Capricorn'],
  ['tsunami', 'a giant sea wave caused by an earthquake or landslide under the sea'], ['tundra', 'cold, treeless land with frozen ground below the surface'],
  ['valley', 'low land between hills or mountains, often with a river'], ['volcano', 'an opening in the Earth where hot melted rock comes out'],
  ['waterfall', 'where a river drops over a steep edge'], ['weather', 'what the air is doing today — sun, rain, wind, heat or cold'],
];

export function view(ctx) {
  const q = (ctx.ui.q || '').trim().toLowerCase();
  const list = WORDS.filter(([w, d]) => !q || w.toLowerCase().includes(q) || d.toLowerCase().includes(q));
  let letter = '';
  return `<input id="t-dictionary-q" class="inp" data-lib-input="q" value="${esc(ctx.ui.q || '')}" placeholder="Look up a word…" aria-label="Look up a word" autocomplete="off">
    <p class="muted small">${list.length} of ${WORDS.length} words</p>
    <dl class="t-dict">${list.map(([w, d]) => { const L = w[0].toUpperCase(), head = L !== letter ? `<h3 class="t-dict-l">${(letter = L)}</h3>` : ''; return `${head}<div><dt>${esc(w)}</dt><dd>${esc(d)}</dd></div>`; }).join('')}</dl>`;
}
export function act() {}
export function selftest(ok) {
  const ws = WORDS.map((w) => w[0].toLowerCase());
  ok(new Set(ws).size === ws.length, 'no word twice');
  ok(ws.every((w, i) => !i || ws[i - 1].localeCompare(w) < 0), 'in alphabetical order');
}
