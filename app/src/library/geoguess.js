/* Where on Earth? — look at a place, pin where in the world you think it is. The
   score is the distance; the reason is shown after.

   One journey, two kinds of card, mixed in every round (3 photos, 2 paintings):
   · REAL PHOTOS — Google Street View of 1,500+ real places (data/places.js,
     verified Google-shot panoramas in data/sv-ok.js). Loaded live from
     Google: on by default wherever a key is built in, and a grown-up can
     switch them off (photos.js; the privacy page says so). A place with no
     imagery answers 404 and is swapped for another, never counted. Look
     around by dragging the picture, ‹ › or [ ]. Credited "Imagery © Google".
   · PAINTED POSTCARDS — 42 paintings (tools/art/gen.py), no request to
     anyone, labelled "a painting, not a photo". Without photos, a round is
     all paintings.

   Never the device's location. Scoring is by distance only — it rewards
   reading the picture, and there is nothing to buy, spin or win back. */
import { POSTCARDS, postcardById } from '../data/postcards.js';
import { PLACES } from '../data/places.js';
import { SV_OK, SV_PANO } from '../data/sv-ok.js';
import { worldSVG, nearCountry } from '../map.js';
import { haversine, fmtKm, byCc, capOf, hemiNS, hemiEW } from '../geo.js';
import { FAMOUS } from '../chapters/kit.js';
import { seeded, shuffle, dayKey } from '../rand.js';
import { svUrl, GKEY } from '../photos.js';
import { PIN_PATH } from '../rewards.js';

import { GEOGUESS } from './meta.js';
export const TOOL = GEOGUESS;

const ROUND = 5;
/* 5,000 for a perfect tap, halving about every 1,400 km. */
/* "1 point", "2 points": the audit found "1 points" on a results card */
export const pts = (n) => `${n.toLocaleString('en-US')} ${n === 1 ? 'point' : 'points'}`;
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

/* ONE journey: every round mixes real photos and painted postcards (three
   and two), all in different countries. With photos off, it is all paintings.
   Today's place is one card for everyone, chosen by the date. */
export const PHOTOS_PER_ROUND = 3;
export function buildRound(band, photos, r, daily = false) {
  const paint = shuffle(POSTCARDS.filter((p) => bandOK(p, band)), r);
  if (daily) {
    const dr = seeded('geo' + dayKey());
    return photos ? { cards: [{ k: 'photo', id: pickPhotos(band, dr)[0] }], spare: pickPhotos(band, dr).slice(1) }
      : { cards: [{ k: 'painted', id: shuffle(POSTCARDS, dr)[0].id }], spare: [] };
  }
  if (!photos) return { cards: paint.slice(0, ROUND).map((p) => ({ k: 'painted', id: p.id })), spare: [] };
  const nPaint = ROUND - PHOTOS_PER_ROUND, painted = [], used = new Set();
  for (const p of paint) { if (painted.length >= nPaint) break; if (used.has(p.cc)) continue; used.add(p.cc); painted.push({ k: 'painted', id: p.id }); }
  const ph = pickPhotos(band, r).filter((id) => !used.has(placeById[id].cc));
  const cards = shuffle([...ph.slice(0, PHOTOS_PER_ROUND).map((id) => ({ k: 'photo', id })), ...painted], r);
  return { cards, spare: ph.slice(PHOTOS_PER_ROUND) };
}
/* A timed round gives each card TIMED seconds (more for the youngest); when the clock
   runs out the pin on the map is the guess — or, with no pin, the card scores nothing.
   The score is still the distance: the clock adds pace, never luck. */
export const TIMED = { '6-7': 75, '8-10': 60, '11-14': 45 };
function newRound(ctx, daily, timed = false) {
  const r = seeded(Date.now() + ':' + (ctx.data.rounds || 0));
  ctx.ui.g = { ...buildRound(ctx.band, !!ctx.photos, r, daily), i: 0, guess: null, done: [], heading: 0, daily, timed, secs: TIMED[ctx.band] || 60 };
  if (timed) ctx.ui.g.deadline = Date.now() + ctx.ui.g.secs * 1000;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* One card's facts, whichever deck it came from. */
function card(g) {
  const { k, id } = g.cards[g.i];
  if (k === 'photo') {
    const p = placeById[id], c = byCc[p.cc];
    return { k, id, cc: p.cc, at: p.at, place: `${p.n}, ${c.name}`, short: p.n,
      clues: [`${c.name} is in ${c.cont}${c.sub && c.sub !== c.cont ? ` (${c.sub})` : ''}.`, `Its capital is ${capOf(c)}.`,
        `${p.n} is in the ${hemiNS(p.at[0])} and ${hemiEW(p.at[1])} hemispheres.`, c.landlocked ? `${c.name} has no coast at all.` : `${c.name} has a coastline.`] };
  }
  const p = postcardById[id];
  return { k, id, cc: p.cc, at: p.at, place: p.place, short: p.place.split(',')[0], clues: p.clues };
}

/* The play screen is the picture (GeoGuessr's lesson): the place fills the
   stage, the map waits as a small inset in the corner. Click it (or M) and it
   opens; tap or drag to drop a pin; Guess confirms. A photo is two Street
   View views side by side — 180° of the place, sharp at full width — and
   dragging the picture looks around. */
const MAPK = (g) => 'geo' + (g.daily ? 'd' : 'r') + g.i;
function stagePic(c, g) {
  if (c.k === 'photo') {
    const h = g.heading || 0, pano = SV_PANO[c.id];
    const img = (hd, side) => `<img data-sv="${esc(c.id)}" src="${esc(svUrl(c.at, (hd + 360) % 360, GKEY, pano))}" alt="${side ? '' : 'A Street View photo. Where in the world is it?'}" width="640" height="400" referrerpolicy="origin" draggable="false">`;
    return `<div class="wo-view photo" data-wo-drag="1">${img(h - 45, 0)}${img(h + 45, 1)}</div>
      <button class="wo-turn l" data-act="lib" data-arg="geoguess|turn|-45" aria-label="Look left">‹</button>
      <button class="wo-turn r" data-act="lib" data-arg="geoguess|turn|45" aria-label="Look right">›</button>`;
  }
  return `<div class="wo-view painted"><img class="wo-bg" src="art/${c.id}.webp" alt="" draggable="false"><img src="art/${c.id}.webp" alt="A painted scene. Where in the world is it?" width="1280" height="720" draggable="false"></div>`;
}
export function view(ctx) {
  const g = ctx.ui.g, d = ctx.data, on = !!ctx.photos;
  if (!g) {
    const today = (d.daily || {})[dayKey()];
    return `<div class="card t-geo-intro">
      <div class="row gap wrap">
        <button class="btn primary big" data-act="lib" data-arg="geoguess|start">Play a round of ${ROUND}</button>
        <button class="btn big" data-act="lib" data-arg="geoguess|timed">⏱ Against the clock</button>
        <button class="btn big" data-act="lib" data-arg="geoguess|daily" ${today != null ? 'disabled' : ''}>${today != null ? `Today’s place: ${pts(today)}` : 'Today’s place'}</button>
        ${d.best ? `<span class="muted small">Best round <b>${d.best.toLocaleString('en-US')}</b> · ${d.rounds || 0} played</span>` : ''}
      </div>
      <div class="wo-how" id="wo-how" aria-label="How to play"><button class="read-btn" data-act="read" data-arg="#wo-how" aria-label="Read how to play" title="Read how to play">🔊</button><span>👀 <b>Look</b> at the place</span><span>🗺️ <b>Open</b> the map</span><span>📍 <b>Pin</b> it, then Guess</span></div>
      <p class="muted small">Look at the place, open the map in the corner and drop your pin where you think it is — up to 5,000 points a card. ${on ? `Rounds mix <b>real Street View photos</b> (${photoPool('11-14').length.toLocaleString('en-US')} places in ${new Set(photoPool('11-14').map((p) => p.cc)).size} countries, shot by Google) with <b>painted postcards</b> made with an AI image model; every card says which it is.`
        : `${POSTCARDS.length} painted postcards of real kinds of places, made with an AI image model.${ctx.photosReady ? ' Real photos are switched off on this device (grown-ups’ page).' : ''}`}</p>
    </div>`;
  }
  if (g.i >= g.cards.length) {
    const tot = g.done.reduce((a, x) => a + x.pts, 0);
    const near = g.done.filter((x) => x.km != null && x.km < 1000).length;
    return `<div class="card end-card"><p class="kicker">${g.daily ? 'Today’s place' : g.timed ? 'Timed round complete' : 'Round complete'}</p><h2><span data-count="${tot}">${tot.toLocaleString('en-US')}</span> ${tot === 1 ? 'point' : 'points'}</h2>
      <p>You read ${g.done.length} ${g.done.length === 1 ? 'place' : 'places'} in ${g.done.length} countries${near ? ` — ${near} within 1,000 km` : ''}. The land, the plants and the buildings were your clues.</p>
      <ul class="t-geo-sum">${g.done.map((x) => `<li><b>${esc(x.place)}</b> — ${x.late ? "time ran out" : fmtKm(x.km) + " away"}, ${pts(x.pts)}</li>`).join('')}</ul>
      <div class="row gap center"><button class="btn primary big" data-act="lib" data-arg="geoguess|start">Play again</button><button class="btn big" data-act="lib" data-arg="geoguess|home">Done</button></div></div>`;
  }
  const c = card(g), last = g.done[g.i], key = MAPK(g), big = !!(g.big || last);
  const so = g.done.reduce((a, x) => a + (x ? x.pts : 0), 0);
  const pins = [];
  const skin = ((ctx.kid && ctx.kid.shop) || {}).pin;
  if (g.guess) pins.push({ at: g.guess, cls: 'guess', r: 7, shape: PIN_PATH[skin] || null });
  if (last) pins.push({ at: c.at, cls: 'good', r: 8, label: c.short });
  const focus = g.focusMap; g.focusMap = false;   // focus the map once, when it opens
  return `<div class="wo${big ? ' big' : ''}${last ? ' res' : ''}">
    ${stagePic(c, g)}
    <div class="wo-hud"><span class="wo-chip">${g.daily ? 'Today’s place' : `Card ${g.i + 1} of ${g.cards.length}`} · ${c.k === 'photo' ? 'a real photo · Imagery © Google' : 'a painting, not a photo'}</span>
      <span class="row gap">${g.timed && !last ? `<span class="wo-chip wo-clock" role="timer" aria-live="off">⏱ ${Math.max(0, Math.ceil((g.deadline - Date.now()) / 1000))}s</span>` : ''}${g.daily ? '' : `<span class="wo-chip wo-score">${pts(so)}</span>`}</span></div>
    <div class="wo-map"${focus ? ' data-autofocus="1"' : ''}>
      ${big && !last ? `<div class="wo-bar"><button class="btn small" data-act="mapZoom" data-arg="${key}|in" aria-label="Zoom in">＋</button><button class="btn small" data-act="mapZoom" data-arg="${key}|out" aria-label="Zoom out">－</button><button class="btn small" data-act="mapZoom" data-arg="${key}|home" aria-label="Whole map">⟲</button>
        <span class="wo-tip">${g.guess ? 'Drag the pin, or tap somewhere else' : 'Tap or drag to drop your pin'}</span><button class="btn small" data-act="lib" data-arg="geoguess|map|0" aria-label="Close the map (Esc)">✕</button></div>` : ''}
      ${worldSVG({ key, tap: big && !last, drag: big && !last, pins, fill: last ? { [c.cc]: 'ok' } : {}, arcs: last && g.guess ? [[g.guess, c.at]] : [], label: 'Drop your pin where you think this is' })}
      ${big ? '' : `<button class="wo-open" data-act="lib" data-arg="geoguess|map|1" aria-label="Open the map (M)"><span>🗺️ ${g.guess ? 'Your pin' : 'Open the map'} <kbd>M</kbd></span></button>`}
      ${last ? '' : `<button class="btn primary wo-guess" data-act="lib" data-arg="geoguess|guess" ${g.guess ? '' : 'disabled'}>${g.guess ? 'Guess' : 'Place your pin on the map'} <kbd>G</kbd></button>`}
    </div>
    ${last ? `<div class="card t-geo-res wo-res"><p class="kicker">${last.late ? 'Time ran out — no pin' : `${fmtKm(last.km)} away`} · <b data-count="${last.pts}">${last.pts.toLocaleString('en-US')}</b> ${last.pts === 1 ? 'point' : 'points'}</p><h3>${esc(c.place)}</h3>
        <p class="muted small">${c.k === 'photo' ? 'About this place:' : 'What gave it away:'}</p><ul>${c.clues.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <button class="btn primary big" data-act="lib" data-arg="geoguess|next">${g.i + 1 < g.cards.length ? 'Next place' : 'See the score'} <kbd>Enter</kbd></button></div>` : ''}
  </div>`;
}

export function act(name, arg, ctx) {
  const g = ctx.ui.g;
  if (name === 'start') { newRound(ctx, false); ctx.sfx.click(); }
  else if (name === 'daily') newRound(ctx, true);
  /* the home's "Place of the hour" card opens THAT place, one card (the audit's broken link) */
  else if (name === 'place' && postcardById[arg]) ctx.ui.g = { cards: [{ k: 'painted', id: arg }], spare: [], i: 0, guess: null, done: [], heading: 0, daily: false, place: true, timed: false };
  else if (name === 'timed') { newRound(ctx, false, true); ctx.sfx.click(); }
  else if (name === 'timeout' && g && g.timed && !g.done[g.i]) {
    if (g.guess) return act('guess', '', ctx);
    const c = card(g); g.done[g.i] = { id: c.id, place: c.place, km: null, pts: 0, late: true }; g.big = false; ctx.sfx.bad();
  }
  else if (name === 'home') ctx.ui.g = null;
  else if (name === 'turn' && g && g.cards[g.i] && g.cards[g.i].k === 'photo') g.heading = ((g.heading || 0) + Number(arg) + 360) % 360;
  else if (name === 'map' && g && !g.done[g.i]) { g.big = arg === '1'; g.focusMap = g.big; }
  /* no imagery here: swap in a spare, never counted */
  else if (name === 'skip' && g && g.cards[g.i] && g.cards[g.i].k === 'photo' && !g.done[g.i] && (!arg || arg === g.cards[g.i].id)) {
    const used = new Set(g.cards.map((x) => (x.k === 'photo' ? placeById[x.id].cc : postcardById[x.id].cc)));
    const nx = g.spare.findIndex((id) => !used.has(placeById[id].cc));
    if (nx >= 0) { g.cards[g.i] = { k: 'photo', id: g.spare.splice(nx, 1)[0] }; g.heading = 0; }
    else if (g.spare.length) { g.cards[g.i] = { k: 'photo', id: g.spare.shift() }; g.heading = 0; }
  }
  else if (name === 'tap' && g && !g.done[g.i]) { const t = JSON.parse(arg); if (t.lat != null) g.guess = [t.lat, t.lng]; }
  else if (name === 'guess' && g && g.guess && !g.done[g.i]) {
    const c = card(g), km = haversine(g.guess, c.at), pts = points(km);
    g.done[g.i] = { id: c.id, place: c.place, km, pts }; g.big = false;
    ctx.data.bestKm = Math.min(ctx.data.bestKm ?? 1e9, Math.round(km));
    if (pts >= 2500) { ctx.sfx.good(); ctx.tick(true, pts >= 4500 ? 3 : pts >= 3500 ? 2 : 1); } else ctx.sfx.bad();
  } else if (name === 'next' && g && g.done[g.i]) {
    g.i++; g.guess = null; g.heading = 0; g.big = false;
    if (g.timed) g.deadline = Date.now() + g.secs * 1000;
    if (g.i >= g.cards.length) {
      const tot = g.done.reduce((a, x) => a + x.pts, 0), d = ctx.data;
      if (ctx.session && !g.place) ctx.session();   // a round is one notch on Today’s ring
      if (ctx.earn && !g.place) ctx.earn('stop');   // a round finished: the standard 5 (one place of the hour is not a round)
      if (ctx.kid) ctx.kid.last = { k: 'geo', title: 'Where on Earth?', n: Math.max(tot, d.best || 0), at: Date.now() };
      if (g.daily) { d.daily = d.daily || {}; d.daily[dayKey()] = tot; const ks = Object.keys(d.daily).sort(); while (ks.length > 30) delete d.daily[ks.shift()]; }
      else if (!g.place) { d.rounds = (d.rounds || 0) + 1; if (tot > (d.best || 0)) { d.best = tot; ctx.confetti(40); ctx.sfx.level(); } }
      ctx.save();
    }
  }
}
export function key(e, ctx) {
  const g = ctx.ui.g; if (!g) return false;
  if ((e.key === 'g' || e.key === 'G') && g.guess && !g.done[g.i]) { act('guess', '', ctx); return true; }
  if (e.key === 'Enter' && g.done[g.i]) { act('next', '', ctx); return true; }
  if ((e.key === 'm' || e.key === 'M') && g.i < g.cards.length && !g.done[g.i]) { act('map', g.big ? '0' : '1', ctx); return true; }
  if (e.key === 'Escape' && g.big && !g.done[g.i]) { act('map', '0', ctx); return true; }
  if (g.cards[g.i] && g.cards[g.i].k === 'photo' && !g.done[g.i] && (e.key === '[' || e.key === ']')) { act('turn', e.key === '[' ? '-45' : '45', ctx); return true; }
  return false;
}
export function selftest(ok) {
  ok(points(0) === 5000, 'a perfect guess scores 5000');
  ok(pts(1) === '1 point' && pts(2) === '2 points' && pts(5000) === '5,000 points', 'one point is "1 point", never "1 points"');
  ok(points(20000) < 50, 'the far side of the world scores almost nothing');
  ok(points(500) > points(1500), 'closer is better');
  ok(PLACES.length >= 1000, `at least 1,000 real places (${PLACES.length})`);
  ok(new Set(PLACES.map((p) => p.cc)).size >= 150, 'places in at least 150 countries');
  ok(new Set(PLACES.map((p) => p.id)).size === PLACES.length, 'place ids are unique');
  ok(SV_OK.every((id) => placeById[id]), 'every verified id is a place');
  if (SV_OK.length) {
    ok(SV_OK.length >= 1000, `at least 1,000 places with verified Google imagery (${SV_OK.length})`);
    ok(new Set(SV_OK.map((id) => placeById[id].cc)).size >= 100, 'verified places in at least 100 countries');
    ok(SV_OK.every((id) => typeof SV_PANO[id] === 'string' && SV_PANO[id].length > 10), 'every verified place is pinned to a Google panorama');
    ok(svUrl([1, 2], 0, 'K', 'PANO1').includes('pano=PANO1') && !svUrl([1, 2], 0, 'K', 'PANO1').includes('location='), 'a pinned place asks for its panorama, not the nearest');
  }
  for (const p of PLACES) ok(byCc[p.cc] && byCc[p.cc].quiz && nearCountry(p.at, p.cc), `${p.id}: ${p.n} lies inside ${p.cc}`);
  for (const band of BANDS) {
    const ids = pickPhotos(band, seeded(band));
    ok(ids.length >= ROUND + 5 && new Set(ids.map((i) => placeById[i].cc)).size === ids.length, `${band}: a round is ${ROUND} different countries, with spares`);
  }
  for (const band of BANDS) for (const on of [true, false]) {
    const R = buildRound(band, on, seeded(band + on));
    const ccs = R.cards.map((x) => (x.k === 'photo' ? placeById[x.id].cc : postcardById[x.id].cc));
    ok(R.cards.length === ROUND, `${band} ${on ? 'with' : 'without'} photos: ${ROUND} cards`);
    ok(new Set(ccs).size === ROUND, `${band}: five different countries in one round`);
    ok(R.cards.filter((x) => x.k === 'photo').length === (on ? PHOTOS_PER_ROUND : 0), `${band}: ${on ? 'photos and paintings mixed' : 'no photo without the switch'}`);
  }
  ok(svUrl([1, 2], 90, 'K').includes('return_error_code=true') && svUrl([1, 2], 90, 'K').includes('heading=90'), 'a missing photo answers 404, so it can be skipped');
  for (const p of POSTCARDS) {
    ok(byCc[p.cc] || p.cc === 'AQ', `${p.id}: country ${p.cc} exists`);
    ok(nearCountry(p.at, p.cc, p.small ? 150 : 25), `${p.id}: ${p.place} is inside ${p.cc} on the map`);
    ok(p.clues.length >= 2, `${p.id} has clues`);
  }
}
