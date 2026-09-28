/* GeoGuesser — look at a place, tap where in the world you think it is. The
   score is the distance; the reason is shown after.

   Two decks:
   · REAL PHOTOS — Google Street View of 1,000+ real places (data/places.js,
     generated from Natural Earth, each checked to lie inside its country).
     Loaded live from Google, so it runs only when a key is built in AND a
     grown-up has switched it on (photos.js; the privacy page says so). A
     place with no imagery answers 404 and is quietly swapped for another —
     never counted, never shown as a grey square. Look around with ◀ ▶.
   · PAINTED POSTCARDS — 42 paintings (tools/art/gen.py), always available,
     no request to anyone, labelled "a painting, not a photo".

   Never the device's location. Scoring is by distance only — it rewards
   reading the picture, and there is nothing to buy, spin or win back. */
import { POSTCARDS, postcardById } from '../data/postcards.js';
import { PLACES } from '../data/places.js';
import { SV_OK } from '../data/sv-ok.js';
import { worldSVG, nearCountry } from '../map.js';
import { haversine, fmtKm, byCc, capOf, hemiNS, hemiEW } from '../geo.js';
import { FAMOUS } from '../chapters/kit.js';
import { seeded, shuffle, dayKey } from '../rand.js';
import { svUrl } from '../photos.js';

export const TOOL = { id: 'geoguess', name: 'GeoGuesser', glyph: '🌍', art: 'lib-geoguess', blurb: 'A real place somewhere on Earth. Read the land, the roads and the buildings — then tap where you think it is.' };

const ROUND = 5;
/* 5,000 for a perfect tap, halving about every 1,400 km. */
export const points = (km) => Math.round(5000 * Math.exp(-km / 2000));
const BANDS = ['6-7', '8-10', '11-14'];
const bandOK = (p, band) => BANDS.indexOf(p.band) <= BANDS.indexOf(band);
const placeById = Object.fromEntries(PLACES.map((p) => [p.id, p]));
const OK = new Set(SV_OK);

/* The photo deck for a child: verified places if the verifier has run; big
   cities in well-known countries for the youngest, everything by 11. */
export function photoPool(band) {
  const base = OK.size ? PLACES.filter((p) => OK.has(p.id)) : PLACES;
  if (band === '11-14') return base;
  const f = band === '6-7' ? (p) => p.big && FAMOUS.has(p.cc) : (p) => FAMOUS.has(p.cc) || p.big;
  const pool = base.filter(f);
  return pool.length >= 60 ? pool : base;
}
/* Five places in five different countries, and spares for any with no imagery. */
export function pickPhotos(band, r) {
  const out = [], cc = new Set();
  for (const p of shuffle(photoPool(band), r)) { if (cc.has(p.cc)) continue; cc.add(p.cc); out.push(p.id); if (out.length >= ROUND + 12) break; }
  return out;
}

function newRound(ctx, mode, daily) {
  const r = seeded(Date.now() + ':' + (ctx.data.rounds || 0));
  if (mode === 'photo') {
    const all = pickPhotos(ctx.band, r);
    ctx.ui.g = { mode, ids: all.slice(0, ROUND), spare: all.slice(ROUND), i: 0, guess: null, done: [], heading: 0, daily: false };
  } else {
    const pool = POSTCARDS.filter((p) => bandOK(p, ctx.band));
    const ids = daily ? [shuffle(POSTCARDS, seeded('pc' + dayKey()))[0].id] : shuffle(pool, r).slice(0, ROUND).map((p) => p.id);
    ctx.ui.g = { mode, ids, i: 0, guess: null, done: [], daily };
  }
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* One card's facts, whichever deck it came from. */
function card(g) {
  const id = g.ids[g.i];
  if (g.mode === 'photo') {
    const p = placeById[id], c = byCc[p.cc];
    return { id, cc: p.cc, at: p.at, place: `${p.n}, ${c.name}`, short: p.n,
      clues: [`${c.name} is in ${c.cont}${c.sub && c.sub !== c.cont ? ` (${c.sub})` : ''}.`, `Its capital is ${capOf(c)}.`,
        `${p.n} is in the ${hemiNS(p.at[0])} and ${hemiEW(p.at[1])} hemispheres.`, c.landlocked ? `${c.name} has no coast at all.` : `${c.name} has a coastline.`] };
  }
  const p = postcardById[id];
  return { id, cc: p.cc, at: p.at, place: p.place, short: p.place.split(',')[0], clues: p.clues };
}

export function view(ctx) {
  const g = ctx.ui.g, d = ctx.data, on = !!ctx.photos;
  if (!g) {
    const today = (d.daily || {})[dayKey()];
    return `<div class="card t-geo-intro">
      <p class="lead">Look at the place — the land, the plants, the roads and the buildings — then tap the map where you think it is. The closer you are, the more points: up to 5,000 a card.</p>
      <div class="t-geo-decks">
        <div class="t-geo-deck${on ? '' : ' off'}"><h3>📷 Real photos</h3>
          <p class="muted">Street View photos of <b>${photoPool('11-14').length.toLocaleString('en-US')} real places</b> in ${new Set(photoPool('11-14').map((p) => p.cc)).size} countries. Look around, then guess.</p>
          ${on ? `<button class="btn primary big" data-act="lib" data-arg="geoguess|start|photo">Play a round of ${ROUND}</button>`
            : `<p class="t-review">${ctx.photosReady ? 'A grown-up can switch real photos on in the grown-ups’ page (🔒). They come from Google Street View.' : 'Real photos are not set up in this copy of the app yet.'}</p>`}</div>
        <div class="t-geo-deck"><h3>🎨 Painted postcards</h3>
          <p class="muted">${POSTCARDS.length} paintings of real kinds of places, made with an AI image model — not photographs.</p>
          <div class="row gap wrap"><button class="btn ${on ? '' : 'primary '}big" data-act="lib" data-arg="geoguess|start|painted">Play a round of ${ROUND}</button>
          <button class="btn big" data-act="lib" data-arg="geoguess|daily" ${today != null ? 'disabled' : ''}>${today != null ? `Today: ${today.toLocaleString('en-US')} points` : 'Today’s postcard'}</button></div></div>
      </div>
      ${d.best ? `<p class="muted">Your best round: <b>${d.best.toLocaleString('en-US')}</b> of ${(ROUND * 5000).toLocaleString('en-US')}. Rounds played: ${d.rounds || 0}.</p>` : ''}
    </div>`;
  }
  if (g.i >= g.ids.length) {
    const tot = g.done.reduce((a, x) => a + x.pts, 0);
    return `<div class="card end-card"><p class="kicker">${g.daily ? 'Today’s postcard' : 'Round complete'}</p><h2>${tot.toLocaleString('en-US')} points</h2>
      <ul class="t-geo-sum">${g.done.map((x) => `<li><b>${esc(x.place)}</b> — ${fmtKm(x.km)} away, ${x.pts.toLocaleString('en-US')} points</li>`).join('')}</ul>
      <div class="row gap center"><button class="btn primary big" data-act="lib" data-arg="geoguess|start|${g.mode}">Play again</button><button class="btn big" data-act="lib" data-arg="geoguess|home">Done</button></div></div>`;
  }
  const c = card(g), last = g.done[g.i];
  const pins = [];
  if (g.guess) pins.push({ at: g.guess, cls: 'guess', r: 7 });
  if (last) pins.push({ at: c.at, cls: 'good', r: 8, label: c.short });
  const pic = g.mode === 'photo'
    ? `<figure class="t-geo-card photo"><img data-sv="1" src="${esc(svUrl(c.at, g.heading))}" alt="A Street View photo. Where in the world is it?" width="640" height="400" referrerpolicy="origin">
        <figcaption><span>Card ${g.i + 1} of ${g.ids.length} · a real photo · Imagery © Google</span>
        <span class="row gap"><button class="btn small" data-act="lib" data-arg="geoguess|turn|-90" aria-label="Look left">◀</button><span class="muted small">look around</span><button class="btn small" data-act="lib" data-arg="geoguess|turn|90" aria-label="Look right">▶</button></span></figcaption></figure>`
    : `<figure class="t-geo-card"><img src="art/${c.id}.webp" alt="A painted scene. Where in the world is it?" width="1280" height="720"><figcaption>Card ${g.i + 1} of ${g.ids.length} · a painting, not a photo</figcaption></figure>`;
  return `<div class="t-geo">
    ${pic}
    <div class="t-geo-map">
      ${worldSVG({ key: 'geo' + g.mode + g.i, tap: !last, pins, fill: last ? { [c.cc]: 'ok' } : {}, arcs: last && g.guess ? [[g.guess, c.at]] : [], label: 'Tap where you think this is' })}
      ${last ? `<div class="card t-geo-res"><p class="kicker">${fmtKm(last.km)} away · ${last.pts.toLocaleString('en-US')} points</p><h3>${esc(c.place)}</h3>
          <p class="muted">${g.mode === 'photo' ? 'About this place:' : 'What gave it away:'}</p><ul>${c.clues.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          <button class="btn primary big" data-act="lib" data-arg="geoguess|next">${g.i + 1 < g.ids.length ? 'Next place' : 'See the score'} <kbd>Enter</kbd></button></div>`
        : `<div class="row gap center map-ctl"><button class="btn small" data-act="mapZoom" data-arg="geo${g.mode}${g.i}|in" aria-label="Zoom in">＋</button><button class="btn small" data-act="mapZoom" data-arg="geo${g.mode}${g.i}|out" aria-label="Zoom out">－</button><button class="btn small" data-act="mapZoom" data-arg="geo${g.mode}${g.i}|home" aria-label="Whole map">⟲</button>
          <button class="btn primary" data-act="lib" data-arg="geoguess|guess" ${g.guess ? '' : 'disabled'}>Guess here <kbd>G</kbd></button></div>
          <p class="muted small center-t">${g.guess ? 'Move the pin with another tap, or press Guess.' : `Tap the map to drop your pin — or use the arrow keys and Enter.${g.mode === 'photo' ? ' ◀ ▶ (or [ and ]) look around.' : ''}`}</p>`}
    </div></div>`;
}

export function act(name, arg, ctx) {
  const g = ctx.ui.g;
  if (name === 'start') { if (arg === 'photo' && !ctx.photos) return; newRound(ctx, arg === 'photo' ? 'photo' : 'painted', false); ctx.sfx.click(); }
  else if (name === 'daily') newRound(ctx, 'painted', true);
  else if (name === 'home') ctx.ui.g = null;
  else if (name === 'turn' && g && g.mode === 'photo') g.heading = ((g.heading || 0) + Number(arg) + 360) % 360;
  /* no imagery here: swap in a spare, never counted */
  else if (name === 'skip' && g && g.mode === 'photo' && !g.done[g.i]) { if (g.spare.length) { g.ids[g.i] = g.spare.shift(); g.heading = 0; } }
  else if (name === 'tap' && g && !g.done[g.i]) { const t = JSON.parse(arg); if (t.lat != null) g.guess = [t.lat, t.lng]; }
  else if (name === 'guess' && g && g.guess && !g.done[g.i]) {
    const c = card(g), km = haversine(g.guess, c.at), pts = points(km);
    g.done[g.i] = { id: c.id, place: c.place, km, pts };
    if (pts >= 2500) { ctx.sfx.good(); ctx.tick(true, pts >= 4500 ? 3 : pts >= 3500 ? 2 : 1); } else ctx.sfx.bad();
  } else if (name === 'next' && g && g.done[g.i]) {
    g.i++; g.guess = null; g.heading = 0;
    if (g.i >= g.ids.length) {
      const tot = g.done.reduce((a, x) => a + x.pts, 0), d = ctx.data;
      if (g.daily) { d.daily = d.daily || {}; d.daily[dayKey()] = tot; const ks = Object.keys(d.daily).sort(); while (ks.length > 30) delete d.daily[ks.shift()]; }
      else { d.rounds = (d.rounds || 0) + 1; if (tot > (d.best || 0)) { d.best = tot; ctx.confetti(40); ctx.sfx.level(); } }
      ctx.save();
    }
  }
}
export function key(e, ctx) {
  const g = ctx.ui.g; if (!g) return false;
  if ((e.key === 'g' || e.key === 'G') && g.guess && !g.done[g.i]) { act('guess', '', ctx); return true; }
  if (e.key === 'Enter' && g.done[g.i]) { act('next', '', ctx); return true; }
  if (g.mode === 'photo' && !g.done[g.i] && (e.key === '[' || e.key === ']')) { act('turn', e.key === '[' ? '-90' : '90', ctx); return true; }
  return false;
}
export function selftest(ok) {
  ok(points(0) === 5000, 'a perfect guess scores 5000');
  ok(points(20000) < 50, 'the far side of the world scores almost nothing');
  ok(points(500) > points(1500), 'closer is better');
  ok(PLACES.length >= 1000, `at least 1,000 real places (${PLACES.length})`);
  ok(new Set(PLACES.map((p) => p.cc)).size >= 150, 'places in at least 150 countries');
  ok(new Set(PLACES.map((p) => p.id)).size === PLACES.length, 'place ids are unique');
  ok(SV_OK.every((id) => placeById[id]), 'every verified id is a place');
  if (SV_OK.length) ok(SV_OK.length >= 1000, `at least 1,000 places with verified imagery (${SV_OK.length})`);
  for (const p of PLACES) ok(byCc[p.cc] && byCc[p.cc].quiz && nearCountry(p.at, p.cc), `${p.id}: ${p.n} lies inside ${p.cc}`);
  for (const band of BANDS) {
    const ids = pickPhotos(band, seeded(band));
    ok(ids.length >= ROUND + 5 && new Set(ids.map((i) => placeById[i].cc)).size === ids.length, `${band}: a round is ${ROUND} different countries, with spares`);
  }
  ok(svUrl([1, 2], 90, 'K').includes('return_error_code=true') && svUrl([1, 2], 90, 'K').includes('heading=90'), 'a missing photo answers 404, so it can be skipped');
  for (const p of POSTCARDS) {
    ok(byCc[p.cc] || p.cc === 'AQ', `${p.id}: country ${p.cc} exists`);
    ok(nearCountry(p.at, p.cc, p.small ? 150 : 25), `${p.id}: ${p.place} is inside ${p.cc} on the map`);
    ok(p.clues.length >= 2, `${p.id} has clues`);
  }
}
