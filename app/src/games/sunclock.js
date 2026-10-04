/* Sun Clock — the Earth turns 360° a day: 15° of longitude every hour.

   Noon somewhere means the sun stands over that line of longitude; 90° to the west the
   sun is just rising, 90° to the east it is setting, and 180° away it is midnight. Every
   answer here is worked from the cities' own longitudes (the data), as SUN TIME — real
   clocks use time zones, and the screen says so. The night side is drawn only AFTER an
   answer (as the hemisphere facing away from the sun), so it never gives one away. To keep
   it simple the sun is over the equator (as at the equinoxes); the screen says that too. */
import { GAME_META } from './meta.js';
import { QUIZ, byCc, capOf } from '../geo.js';
import { worldSVG, worldPath } from '../map.js';
import { geoCircle } from 'd3-geo';
import { FAMOUS } from '../chapters/kit.js';
import { seeded, shuffle, dayKey, pick } from '../rand.js';
import { readBtn, ico, titleCard, finishCard, hud, esc, todaySeed, todayStart, keepToday } from './kit.js';

export const TOOL = GAME_META.sunclock;
export const SUN_SRC = ['NOAA — “Solar time: the Earth turns 15° of longitude per hour”', 'Encyclopaedia Britannica — “equinox”, “time zone”'];
const ROUND = 8, TOL = 15;
const wrap = (x) => ((((x + 180) % 360) + 360) % 360) - 180;
const CITIES = QUIZ.filter((c) => FAMOUS.has(c.cc) && Math.abs(c.capAt[0][0]) < 60).map((c) => ({ cc: c.cc, n: capOf(c), at: c.capAt[0] }));
/* sun time in B when it is noon in A, to the nearest hour (0–23) */
export const sunHour = (aLng, bLng) => ((Math.round(12 + wrap(bLng - aLng) / 15) % 24) + 24) % 24;
export const sayHour = (h) => (h === 12 ? 'about noon' : h === 0 ? 'about midnight' : `about ${h % 12 || 12} ${h < 5 ? 'at night' : h < 12 ? 'in the morning' : h < 18 ? 'in the afternoon' : 'in the evening'}`);
const isDay = (aLng, bLng) => Math.abs(wrap(bLng - aLng)) < 90;
const TAPS = { rise: { off: -90, say: 'the sun is just rising', glyph: '🌅' }, set: { off: 90, say: 'the sun is setting', glyph: '🌇' }, mid: { off: 180, say: 'it is midnight', glyph: '🌙' } };

/* one question: a city at noon and something to find */
export function makeQ(r, band) {
  const A = pick(CITIES, r);
  const kinds = band === '6-7' ? ['day', 'day', 'mid'] : band === '8-10' ? ['day', 'rise', 'set', 'hour'] : ['rise', 'set', 'mid', 'hour', 'hour'];
  const k = pick(kinds, r);
  if (k === 'day' || k === 'hour') {
    const far = shuffle(CITIES.filter((c) => c.cc !== A.cc && Math.abs(wrap(c.at[1] - A.at[1])) > 20 && Math.abs(Math.abs(wrap(c.at[1] - A.at[1])) - 90) > 12), r);
    const B = far[0]; if (!B) return makeQ(r, band);
    if (k === 'day') return { k, A, B, ans: isDay(A.at[1], B.at[1]) ? 'Day' : 'Night', opts: ['Day', 'Night'] };
    const h = sunHour(A.at[1], B.at[1]), ans = sayHour(h);
    const others = shuffle([3, 6, 9, 15, 18, 21, 0].map((x) => (h + x) % 24).filter((x) => Math.min(Math.abs(x - h), 24 - Math.abs(x - h)) >= 3).map(sayHour), r).filter((x) => x !== ans).slice(0, 3);
    return { k, A, B, ans, opts: shuffle([ans, ...others], r) };
  }
  return { k, A, target: wrap(A.at[1] + TAPS[k].off) };
}
function newRound(ctx, daily) {
  const r = seeded(daily ? todaySeed('sunclock') : 'sun' + Date.now()), band = daily ? '8-10' : ctx.band;
  ctx.ui.g = { list: Array.from({ length: daily ? 3 : ROUND }, () => makeQ(r, band)), i: 0, done: [], daily };
}
const prompt = (q) => q.k === 'day' ? `It is noon in <b>${esc(q.A.n)}</b>. Is it day or night in <b>${esc(q.B.n)}</b>?`
  : q.k === 'hour' ? `It is noon in <b>${esc(q.A.n)}</b>. What is the sun time in <b>${esc(q.B.n)}</b>?`
  : `It is noon in <b>${esc(q.A.n)}</b>. Tap somewhere ${TAPS[q.k].say} ${TAPS[q.k].glyph}`;

export function view(ctx) {
  const g = ctx.ui.g, d = ctx.data;
  if (!g) return titleCard(TOOL, {
    how: ['The Earth turns once a day — <b>15° of longitude every hour</b>.', 'It is noon where the sun is overhead. 90° west it is sunrise, 90° east sunset, 180° away midnight.', 'Answer from the longitudes. Then watch where night falls.'],
    starts: [['sunclock|start', `Play ${ROUND}`], todayStart('sunclock', d)],
    best: d.best ? `Best round: ${d.best} of ${ROUND} · ${d.plays || 0} played` : '',
    note: 'This is SUN time. Real clocks use time zones, so a city’s clock can differ from its sun by an hour or more.',
  });
  if (g.over) {
    const right = g.done.filter((x) => x.right).length;
    return finishCard({ kicker: g.daily ? 'Today’s round' : 'Round complete', count: right, title: `of ${g.list.length} right`,
      lines: ['You practised: longitude, and how the turning Earth makes day and night — 15° to every hour.'],
      again: ['sunclock|start', 'Play again'], home: 'sunclock|home' });
  }
  const q = g.list[g.i], done = g.done[g.i], sunLng = q.A.at[1];
  const night = done ? `<path class="sc-night" d="${worldPath(geoCircle().center([wrap(sunLng + 180), 0]).radius(90)())}"/>` : '';
  const pins = [{ at: q.A.at, cls: 'good', r: 7, label: `☀️ ${q.A.n}` }];
  if (q.B) pins.push({ at: q.B.at, cls: 'goal', r: 6, label: q.B.n });
  if (done && done.at) pins.push({ at: done.at, cls: 'guess', r: 6 });
  const tap = !q.B && !done;
  return `${hud([`Question ${g.i + 1} of ${g.list.length}`, `Right: <b>${g.done.filter((x) => x.right).length}</b>`])}
    <div class="gm-prompt"><p class="long-q" id="gm-q">${prompt(q)}</p>${readBtn('#gm-q')}</div>
    ${worldSVG({ key: 'sun' + g.i, tap, pins, extra: night + (done && !q.B ? `<path class="sc-line" d="${worldPath({ type: 'LineString', coordinates: Array.from({ length: 37 }, (_, i) => [q.target, -90 + i * 5]) })}"/>` : ''), label: 'Sun clock world map' })}
    ${q.B && !done ? `<div class="choice-row${q.opts.length === 2 ? ' two' : ''}">${q.opts.map((o, j) => `<button class="btn big opt" data-act="lib" data-arg="sunclock|pick|${esc(o)}"><span>${esc(o)}</span> <kbd>${j + 1}</kbd></button>`).join('')}</div>` : ''}
    ${done ? `<div class="card gm-res"><p class="fb ${done.right ? 'good' : 'bad'}">${done.right ? 'Right — ' : 'Not this time. '}${explain(q)}</p>
      <p class="muted small">The shaded half is night: the side of the Earth turned away from the sun (drawn as at an equinox).</p>
      <button class="btn primary big" data-act="lib" data-arg="sunclock|next">${g.i + 1 < g.list.length ? 'Next' : 'See your score'} <kbd>Enter</kbd></button></div>` : ''}`;
}
function explain(q) {
  const dl = Math.round(wrap((q.B ? q.B.at[1] : q.target) - q.A.at[1]));
  const dir = dl >= 0 ? 'east' : 'west', hrs = Math.round(Math.abs(dl) / 15);
  if (q.k === 'day') return `${esc(q.B.n)} is ${Math.abs(dl)}° ${dir} of ${esc(q.A.n)} — ${hrs} hours of turning — so it is <b>${q.ans.toLowerCase()}</b> there.`;
  if (q.k === 'hour') return `${esc(q.B.n)} is ${Math.abs(dl)}° ${dir}: ${Math.abs(dl)} ÷ 15 ≈ ${hrs} hours ${dl >= 0 ? 'later' : 'earlier'} — <b>${esc(q.ans)}</b>.`;
  return `${TAPS[q.k].say[0].toUpperCase() + TAPS[q.k].say.slice(1)} along the line ${Math.abs(TAPS[q.k].off)}° ${TAPS[q.k].off < 0 ? 'west' : 'east'} of ${esc(q.A.n)}, at about ${Math.abs(Math.round(q.target))}° ${q.target >= 0 ? 'E' : 'W'}.`;
}

export function act(name, arg, ctx) {
  const g = ctx.ui.g;
  if (name === 'start') { newRound(ctx, false); ctx.sfx.click(); }
  else if (name === 'daily') newRound(ctx, true);
  else if (name === 'home') ctx.ui.g = null;
  else if (!g || g.over) return;
  else if (name === 'pick' && !g.done[g.i] && g.list[g.i].B) { const right = arg === g.list[g.i].ans; g.done[g.i] = { right }; ctx.tick(right); right ? ctx.sfx.good() : ctx.sfx.bad(); }
  else if (name === 'tap' && !g.done[g.i] && !g.list[g.i].B) {
    const t = JSON.parse(arg); if (t.lat == null) return;
    const q = g.list[g.i], right = Math.abs(wrap(t.lng - q.target)) <= TOL && Math.abs(t.lat) <= 66;
    g.done[g.i] = { right, at: [t.lat, t.lng] }; ctx.tick(right); right ? ctx.sfx.good() : ctx.sfx.bad();
  } else if (name === 'next' && g.done[g.i]) {
    g.i++;
    if (g.i >= g.list.length) {
      g.over = true; const d = ctx.data, right = g.done.filter((x) => x.right).length;
      d.plays = (d.plays || 0) + 1;
      if (g.daily) keepToday(d, right); else if (right > (d.best || 0)) d.best = right;
      if (ctx.session) ctx.session(); if (ctx.earn) ctx.earn('stop'); ctx.save();
    }
  }
}
export function key(e, ctx) {
  const g = ctx.ui.g; if (!g || g.over) return false;
  if (g.done[g.i]) { if (e.key === 'Enter') { act('next', '', ctx); return true; } return false; }
  const q = g.list[g.i], n = parseInt(e.key, 10);
  if (q.opts && n >= 1 && n <= q.opts.length) { act('pick', q.opts[n - 1], ctx); return true; }
  return false;
}
export function selftest(ok) {
  ok(CITIES.length >= 30, `enough cities (${CITIES.length})`);
  ok(sunHour(0, 90) === 18 && sunHour(0, -90) === 6 && sunHour(0, 180) === 0 && sunHour(77, 77) === 12, 'noon here: 90° east is 6 pm, 90° west 6 am, 180° midnight');
  ok(sayHour(17) === 'about 5 in the afternoon' && sayHour(3) === 'about 3 at night', 'hours are said in words');
  for (const band of ['6-7', '8-10', '11-14']) for (let i = 0; i < 60; i++) {
    const q = makeQ(seeded(band + i), band);
    if (q.opts) {
      ok(q.opts.filter((o) => o === q.ans).length === 1 && new Set(q.opts).size === q.opts.length, `${band}: one right answer, distinct options`);
      ok(!prompt(q).toLowerCase().includes(q.ans.toLowerCase()) || q.k === 'day', `${band}: the answer is not in the question`);
    } else ok(Math.abs(q.target) <= 180, `${band}: a tap target on the map`);
  }
}
