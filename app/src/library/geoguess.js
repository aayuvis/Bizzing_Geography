/* GeoGuesser — look at a painted place, tap where in the world you think it
   is. The score is the distance, and the reason is shown after: the clues an
   explorer could have read in the land, the weather and the buildings.

   The scenes are PAINTINGS (tools/art/gen.py), and the game says so. No
   photograph of anyone's street, no device location, nothing fetched from a
   map service: a child's tap never leaves the device. (A Street View mode
   would need exactly that, which is why it is not here — see CLAUDE.md.)

   Scoring is by distance only. It rewards reading the picture, not luck, and
   there is nothing to buy, spin or win back. */
import { POSTCARDS, postcardById } from '../data/postcards.js';
import { worldSVG, nearCountry } from '../map.js';
import { haversine, fmtKm, byCc } from '../geo.js';
import { seeded, shuffle, dayKey } from '../rand.js';

export const TOOL = { id: 'geoguess', name: 'GeoGuesser', glyph: '🌍', art: 'lib-geoguess', blurb: 'A painted postcard from somewhere on Earth. Read the land and tap where you think it is.' };

const ROUND = 5;
/* 5,000 for a perfect tap, halving about every 1,400 km. */
export const points = (km) => Math.round(5000 * Math.exp(-km / 2000));
const bandOK = (p, band) => ['6-7', '8-10', '11-14'].indexOf(p.band) <= ['6-7', '8-10', '11-14'].indexOf(band);

function newRound(ctx, daily) {
  const pool = POSTCARDS.filter((p) => bandOK(p, ctx.band));
  const ids = daily ? [shuffle(POSTCARDS, seeded('pc' + dayKey()))[0].id]
    : shuffle(pool, seeded(Date.now() + ':' + (ctx.data.rounds || 0))).slice(0, ROUND).map((p) => p.id);
  ctx.ui.g = { ids, i: 0, guess: null, done: [], daily };
}

export function view(ctx) {
  const g = ctx.ui.g, d = ctx.data;
  if (!g) {
    const today = (d.daily || {})[dayKey()];
    return `<div class="card t-geo-intro">
      <p class="lead">Each postcard is a painting of a real kind of place. Look at the land, the plants, the weather and the buildings — then tap the map where you think it is. The closer you are, the more points: up to 5,000 a card.</p>
      <p class="muted small">These are paintings made with an AI image model, not photographs. Every one is of a place you could visit.</p>
      <div class="row gap wrap">
        <button class="btn primary big" data-act="lib" data-arg="geoguess|start">Play a round of ${ROUND}</button>
        <button class="btn big" data-act="lib" data-arg="geoguess|daily" ${today != null ? 'disabled' : ''}>${today != null ? `Today’s postcard: ${today.toLocaleString('en-US')} points` : 'Today’s postcard'}</button>
      </div>
      ${d.best ? `<p class="muted">Your best round: <b>${d.best.toLocaleString('en-US')}</b> of ${(ROUND * 5000).toLocaleString('en-US')}. Rounds played: ${d.rounds || 0}.</p>` : ''}
    </div>`;
  }
  if (g.i >= g.ids.length) {
    const tot = g.done.reduce((a, x) => a + x.pts, 0);
    return `<div class="card end-card"><p class="kicker">${g.daily ? 'Today’s postcard' : 'Round complete'}</p><h2>${tot.toLocaleString('en-US')} points</h2>
      <ul class="t-geo-sum">${g.done.map((x) => `<li><b>${esc(postcardById[x.id].place)}</b> — ${fmtKm(x.km)} away, ${x.pts.toLocaleString('en-US')} points</li>`).join('')}</ul>
      <div class="row gap center"><button class="btn primary big" data-act="lib" data-arg="geoguess|start">Play again</button><button class="btn big" data-act="lib" data-arg="geoguess|home">Done</button></div></div>`;
  }
  const p = postcardById[g.ids[g.i]], last = g.done[g.i];
  const pins = [];
  if (g.guess) pins.push({ at: g.guess, cls: 'guess', r: 7 });
  if (last) pins.push({ at: p.at, cls: 'good', r: 8, label: p.place.split(',')[0] });
  const fill = last ? { [p.cc]: 'ok' } : {};
  return `<div class="t-geo">
    <figure class="t-geo-card"><img src="art/${p.id}.webp" alt="A painted scene. Where in the world is it?" width="1280" height="720"><figcaption>Card ${g.i + 1} of ${g.ids.length} · a painting, not a photo</figcaption></figure>
    <div class="t-geo-map">
      ${worldSVG({ key: 'geo' + g.i, tap: !last, pins, fill, arcs: last && g.guess ? [[g.guess, p.at]] : [], label: 'Tap where you think this is' })}
      ${last ? `<div class="card t-geo-res"><p class="kicker">${fmtKm(last.km)} away · ${last.pts.toLocaleString('en-US')} points</p><h3>${esc(p.place)}</h3>
          <p class="muted">What gave it away:</p><ul>${p.clues.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
          <button class="btn primary big" data-act="lib" data-arg="geoguess|next">${g.i + 1 < g.ids.length ? 'Next postcard' : 'See the score'} <kbd>Enter</kbd></button></div>`
        : `<div class="row gap center map-ctl"><button class="btn small" data-act="mapZoom" data-arg="geo${g.i}|in" aria-label="Zoom in">＋</button><button class="btn small" data-act="mapZoom" data-arg="geo${g.i}|out" aria-label="Zoom out">－</button><button class="btn small" data-act="mapZoom" data-arg="geo${g.i}|home" aria-label="Whole map">⟲</button>
          <button class="btn primary" data-act="lib" data-arg="geoguess|guess" ${g.guess ? '' : 'disabled'}>Guess here <kbd>G</kbd></button></div>
          <p class="muted small center-t">${g.guess ? 'Move the pin with another tap, or press Guess.' : 'Tap the map to drop your pin — or use the arrow keys and Enter.'}</p>`}
    </div></div>`;
}
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function act(name, arg, ctx) {
  const g = ctx.ui.g;
  if (name === 'start') { newRound(ctx, false); ctx.sfx.click(); }
  else if (name === 'daily') newRound(ctx, true);
  else if (name === 'home') ctx.ui.g = null;
  else if (name === 'tap' && g && !g.done[g.i]) { const t = JSON.parse(arg); if (t.lat != null) g.guess = [t.lat, t.lng]; }
  else if (name === 'guess' && g && g.guess && !g.done[g.i]) {
    const p = postcardById[g.ids[g.i]], km = haversine(g.guess, p.at), pts = points(km);
    g.done[g.i] = { id: p.id, km, pts };
    if (pts >= 2500) { ctx.sfx.good(); ctx.tick(true, pts >= 4500 ? 3 : pts >= 3500 ? 2 : 1); } else ctx.sfx.bad();
  } else if (name === 'next' && g && g.done[g.i]) {
    g.i++; g.guess = null;
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
  return false;
}
export function selftest(ok) {
  ok(points(0) === 5000, 'a perfect guess scores 5000');
  ok(points(20000) < 50, 'the far side of the world scores almost nothing');
  ok(points(500) > points(1500), 'closer is better');
  for (const p of POSTCARDS) {
    ok(byCc[p.cc] || p.cc === 'AQ', `${p.id}: country ${p.cc} exists`);
    ok(nearCountry(p.at, p.cc, p.small ? 150 : 25), `${p.id}: ${p.place} is inside ${p.cc} on the map`);
    ok(p.clues.length >= 2, `${p.id} has clues`);
  }
}
