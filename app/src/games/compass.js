/* Hot & Cold Compass — a hidden capital; every guess answers HOW FAR and WHICH WAY.

   A guess is a tap on the map (or the keyboard cross). The reply is measured, never
   typed: the great-circle distance and the compass bearing from the guess to the
   capital (geo.js haversine / bearing), said as one of eight points with an arrow.
   Found = a tap inside the capital's own country, or within 150 km of the capital (a coastal
   capital — Dakar, Reykjavík — can sit just off the drawn coast). Eight guesses; fewer is better. */
import { GAME_META } from './meta.js';
import { QUIZ, byCc, capOf, haversine, bearing, fmtKm } from '../geo.js';
import { worldSVG, countryAt } from '../map.js';
import { FAMOUS } from '../chapters/kit.js';
import { seeded, shuffle, dayKey } from '../rand.js';
import { readBtn, ico, titleCard, finishCard, hud, esc, POINTS, ARROWS, pointOf, todaySeed, todayStart, keepToday } from './kit.js';

export const TOOL = GAME_META.compass;
const ROUND = 5, MAX = 8;
/* hidden places: capitals of countries big enough to tap; the youngest get well-known ones */
const pool = (band) => QUIZ.filter((c) => c.area >= 20000 && (band !== '6-7' || FAMOUS.has(c.cc)));
export const pointsFor = (n) => Math.max(1, MAX + 1 - n);           // found on guess n
function newRound(ctx, daily) {
  const r = seeded(daily ? todaySeed('compass') : 'compass' + Date.now());
  const list = shuffle(pool(daily ? '8-10' : ctx.band), r).slice(0, daily ? 1 : ROUND).map((c) => c.cc);
  ctx.ui.g = { list, i: 0, guesses: [], done: [], daily };
}
/* the reply to one guess */
export function reply(at, cc) {
  const c = byCc[cc], to = c.capAt[0], km = haversine(at, to), deg = bearing(at, to), p = pointOf(deg);
  return { at, km, p, inside: countryAt(at) === cc || km <= 150 };
}

export function view(ctx) {
  const g = ctx.ui.g, d = ctx.data;
  if (!g) return titleCard(TOOL, {
    how: ['A capital city is hidden somewhere in the world.', 'Tap the map. You are told <b>how far</b> it is and <b>which way</b> — north, south-east…', 'Find its country in as few guesses as you can. Eight at most.'],
    starts: [['compass|start', `Hunt ${ROUND} capitals`], todayStart('compass', d)],
    best: d.best ? `Best round: ${d.best} points · ${d.plays || 0} played` : '',
  });
  if (g.over) {
    const tot = g.done.reduce((a, x) => a + x.pts, 0);
    return finishCard({ kicker: g.daily ? 'Today’s round' : 'Hunt complete', count: tot, title: 'points',
      lines: [g.done.map((x, j) => `<b>${esc(capOf(byCc[g.list[j]]))}, ${esc(byCc[g.list[j]].name)}</b> — ${x.found ? `found in ${x.n} ${x.n === 1 ? 'guess' : 'guesses'}` : 'not found this time'}`).join('<br>'),
        'You practised: the eight compass points, and how far apart places really are.'],
      again: ['compass|start', 'Play again'], home: 'compass|home' });
  }
  const cc = g.list[g.i], c = byCc[cc], done = g.done[g.i], last = g.guesses[g.guesses.length - 1];
  const prev = g.guesses[g.guesses.length - 2];
  const temp = last && prev ? (last.km < prev.km - 50 ? '🔥 Warmer' : last.km > prev.km + 50 ? '🧊 Colder' : 'About the same') : '';
  const pins = g.guesses.map((x, j) => ({ at: x.at, cls: j === g.guesses.length - 1 ? 'guess' : 'old', r: 6, label: j === g.guesses.length - 1 && !done ? ARROWS[x.p] : '' }));
  if (done) pins.push({ at: c.capAt[0], cls: 'good', r: 8, label: capOf(c) });
  return `${hud([`Capital ${g.i + 1} of ${g.list.length}`, `Guesses: <b>${g.guesses.length}</b> of ${MAX}`, temp])}
    <div class="gm-prompt"><p class="long-q" id="gm-q" aria-live="polite">${done ? (done.found ? `Found! It is <b>${esc(capOf(c))}</b>, the capital of ${esc(c.name)}.` : `It was <b>${esc(capOf(c))}</b>, the capital of ${esc(c.name)}.`)
      : last ? `From your guess, the capital is <b>${fmtKm(last.km)}</b> away, to the <b>${POINTS[last.p]}</b> ${ARROWS[last.p]}.` : 'Where is the hidden capital? Tap anywhere to make your first guess.'}</p>
      ${readBtn('#gm-q')}</div>
    ${worldSVG({ key: 'cmp' + g.i, tap: !done, pins, fill: done ? { [cc]: 'ok' } : {}, arcs: done && last ? [[last.at, c.capAt[0]]] : [], label: 'Hot and cold: tap to guess where the capital is' })}
    ${g.guesses.length ? `<ol class="gm-trail" aria-label="Your guesses">${g.guesses.map((x, j) => `<li>${j + 1}. ${fmtKm(x.km)} · ${POINTS[x.p]} ${ARROWS[x.p]}</li>`).join('')}</ol>` : ''}
    ${done ? `<div class="card gm-res"><p class="fb ${done.found ? 'good' : ''}">${done.found ? `${done.pts} points — ${done.n} ${done.n === 1 ? 'guess' : 'guesses'}.` : 'No points this time — but now you know where it is.'}</p>
      <button class="btn primary big" data-act="lib" data-arg="compass|next">${g.i + 1 < g.list.length ? 'Next capital' : 'See your points'} <kbd>Enter</kbd></button></div>`
      : `<p class="muted small center-t">Tap the map — or focus it, move the cross with the arrows and press Enter.</p>`}`;
}

export function act(name, arg, ctx) {
  const g = ctx.ui.g;
  if (name === 'start') { newRound(ctx, false); ctx.sfx.click(); }
  else if (name === 'daily') newRound(ctx, true);
  else if (name === 'home') ctx.ui.g = null;
  else if (!g || g.over) return;
  else if (name === 'tap' && !g.done[g.i]) {
    const t = JSON.parse(arg); if (t.lat == null) return;
    const cc = g.list[g.i], r = reply([t.lat, t.lng], cc);
    g.guesses.push(r); ctx.sfx.click();
    if (r.inside) { const pts = pointsFor(g.guesses.length); g.done[g.i] = { found: true, n: g.guesses.length, pts }; ctx.tick(true); ctx.sfx.good(); if (g.guesses.length <= 3) ctx.confetti(20); }
    else if (g.guesses.length >= MAX) { g.done[g.i] = { found: false, n: MAX, pts: 0 }; ctx.tick(false); ctx.sfx.bad(); }
  } else if (name === 'next' && g.done[g.i]) {
    g.i++; g.guesses = [];
    if (g.i >= g.list.length) {
      g.over = true; const d = ctx.data, tot = g.done.reduce((a, x) => a + x.pts, 0);
      d.plays = (d.plays || 0) + 1;
      if (g.daily) keepToday(d, tot); else if (tot > (d.best || 0)) d.best = tot;
      d.quick = Math.max(d.quick || 0, ...g.done.filter((x) => x.found).map((x) => MAX + 1 - x.n));
      if (ctx.session) ctx.session(); if (ctx.earn) ctx.earn('stop'); ctx.save();
    }
  }
}
export function key(e, ctx) {
  const g = ctx.ui.g; if (!g || g.over) return false;
  if (g.done[g.i] && e.key === 'Enter') { act('next', '', ctx); return true; }
  return false;
}
export function selftest(ok) {
  ok(pool('11-14').length > 100 && pool('6-7').length >= 20, 'enough hidden capitals for every age');
  ok(pool('11-14').every((c) => reply(c.capAt[0], c.cc).inside), 'a tap on any hidden capital finds it — coastal capitals included');
  const r1 = reply([28.6, 77.2], 'JP');
  ok(POINTS[r1.p] === 'east' || POINTS[r1.p] === 'north-east', `from Delhi, Tokyo is to the east (${POINTS[r1.p]})`);
  ok(Math.abs(reply([51.5, -0.13], 'FR').km - 344) < 40, 'London to Paris is about 340 km');
  ok(POINTS[reply([0, 0], 'NO').p] === 'north' && POINTS[reply([60, 10], 'ZA').p] === 'south', 'north is north, south is south');
  ok(pointsFor(1) === MAX && pointsFor(MAX) === 1, 'fewer guesses, more points');
}
