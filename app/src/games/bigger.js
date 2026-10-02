/* Bigger or Smaller? — two countries: which has more land?

   The areas are the data's (countries.js area, km²). After each answer both shapes are
   drawn AT ONE TRUE SCALE (map.js shapesAtOneScale, an equal-area projection) — so a
   child SEES how big each really is. Some pairs are chosen because a flat world map
   fools the eye: the one further from the equator is drawn bigger than it is. Fair pairs
   only: the bigger is at least 15% bigger, never more than 8 times (no one guesses
   Russia against Monaco). */
import { GAME_META } from './meta.js';
import { QUIZ, byCc, fmtArea } from '../geo.js';
import { worldSVG, shapesAtOneScale, hasShape, drawnArea } from '../map.js';
import { FAMOUS } from '../chapters/kit.js';
import { seeded, shuffle, dayKey } from '../rand.js';
import { readBtn, ico, titleCard, finishCard, hud, esc } from './kit.js';

export const TOOL = GAME_META.bigger;
const ROUND = 10;
const pool = (band) => QUIZ.filter((c) => c.area >= 30000 && hasShape(c.cc) && (band !== '6-7' || FAMOUS.has(c.cc)));
/* a "fooler": the country further from the equator has LESS land, yet is drawn at least as
   big on this app's flat world map — measured from the map itself, never assumed */
export const fooler = (a, b) => { const hi = Math.abs(a.at[0]) > Math.abs(b.at[0]) ? a : b, lo = hi === a ? b : a; return Math.abs(hi.at[0]) - Math.abs(lo.at[0]) >= 15 && hi.area < lo.area && drawnArea(hi.cc) >= drawnArea(lo.cc); };
export function makePairs(r, band, n = ROUND) {
  const P = shuffle(pool(band), r), out = [], used = new Set();
  for (let i = 0; i < P.length && out.length < n; i++) for (let j = i + 1; j < P.length && out.length < n; j++) {
    const a = P[i], b = P[j]; if (used.has(a.cc) || used.has(b.cc)) continue;
    const ratio = Math.max(a.area, b.area) / Math.min(a.area, b.area);
    if (ratio < 1.15 || ratio > 8) continue;
    /* every third pair, prefer one that fools the eye */
    if (out.length % 3 === 2 && !fooler(a, b) && j < P.length - 1) continue;
    out.push(r() < 0.5 ? [a.cc, b.cc] : [b.cc, a.cc]); used.add(a.cc); used.add(b.cc); break;
  }
  return out;
}
function newRound(ctx, daily) { const r = seeded(daily ? 'bigger' + dayKey() : 'bigger' + Date.now()); ctx.ui.g = { pairs: makePairs(r, daily ? '8-10' : ctx.band, daily ? 5 : ROUND), i: 0, done: [], daily }; }
const times = (x) => (x < 1.95 ? `${Math.round((x - 1) * 100)}% more` : `about ${Math.round(x)} times as much`);

export function view(ctx) {
  const g = ctx.ui.g, d = ctx.data;
  if (!g) return titleCard(TOOL, {
    how: ['Two countries appear on the map.', 'Tap the one with <b>more land</b>.', 'Then see them side by side at their true size. Careful — far from the equator, a flat map makes land look bigger than it is.'],
    starts: [['bigger|start', `Play ${ROUND} pairs`], ['bigger|daily', (d.daily || {})[dayKey()] != null ? 'Today’s five ✓' : 'Today’s five']],
    best: d.best ? `Best round: ${d.best} of ${ROUND} · ${d.plays || 0} played` : '',
  });
  if (g.over) {
    const right = g.done.filter((x) => x.right).length;
    return finishCard({ kicker: g.daily ? 'Today’s five' : 'Round complete', count: right, title: `of ${g.pairs.length} right`,
      lines: [g.done.some((x) => x.fool) ? 'Some of those pairs were chosen to fool your eyes: a flat map stretches the land near the poles.' : '', 'You practised: comparing the size of countries, and reading a map with care.'],
      again: ['bigger|start', 'Play again'], home: 'bigger|home' });
  }
  const [a, b] = g.pairs[g.i].map((c) => byCc[c]), done = g.done[g.i], big = a.area > b.area ? a : b;
  const fill = { [a.cc]: done ? (big === a ? 'ok' : 'bad') : 'pick', [b.cc]: done ? (big === b ? 'ok' : 'bad') : 'goal' };
  const shapes = done ? shapesAtOneScale([a.cc, b.cc]) : null;
  const card = (c, n) => `<button class="card bg-pick${done ? (c === big ? ' right' : done.pick === c.cc ? ' wrong' : '') : ''}" data-act="lib" data-arg="bigger|pick|${c.cc}" ${done ? 'disabled' : ''}>
      ${done ? shapes[n] : `<img src="flags/${c.cc.toLowerCase()}.svg" alt="" width="72" height="54">`}<b>${esc(c.name)}</b>${done ? `<span>${fmtArea(c.area)}</span>` : `<kbd>${n + 1}</kbd>`}</button>`;
  return `${hud([`Pair ${g.i + 1} of ${g.pairs.length}`, `Right: <b>${g.done.filter((x) => x.right).length}</b>`])}
    <div class="gm-prompt"><p class="long-q" id="gm-q">Which has more land: <b class="c-start">${esc(a.name)}</b> or <b class="c-goal">${esc(b.name)}</b>?</p>
      ${readBtn('#gm-q')}</div>
    <div class="bg-row">${card(a, 0)}${card(b, 1)}</div>
    ${done ? `<div class="card gm-res"><p class="fb ${done.right ? 'good' : 'bad'}">${done.right ? 'Right — ' : 'Not this time. '}<b>${esc(big.name)}</b> has ${times(Math.max(a.area, b.area) / Math.min(a.area, b.area))} land.</p>
        <p class="muted small">Above, both are drawn at one scale — the size you see is the size on Earth.${done.fool ? ' On the flat map below, the one nearer the pole looked bigger than it really is.' : ''}</p>
        <button class="btn primary big" data-act="lib" data-arg="bigger|next">${g.i + 1 < g.pairs.length ? 'Next pair' : 'See your score'} <kbd>Enter</kbd></button></div>` : ''}
    ${worldSVG({ key: 'bg' + g.i, fill, label: `${a.name} and ${b.name} on the world map` })}`;
}

export function act(name, arg, ctx) {
  const g = ctx.ui.g;
  if (name === 'start') { newRound(ctx, false); ctx.sfx.click(); }
  else if (name === 'daily') newRound(ctx, true);
  else if (name === 'home') ctx.ui.g = null;
  else if (!g || g.over) return;
  else if (name === 'pick' && !g.done[g.i]) {
    const [a, b] = g.pairs[g.i].map((c) => byCc[c]), big = a.area > b.area ? a : b, right = arg === big.cc;
    g.done[g.i] = { right, pick: arg, fool: fooler(a, b) }; ctx.tick(right); right ? ctx.sfx.good() : ctx.sfx.bad();
  } else if (name === 'next' && g.done[g.i]) {
    g.i++;
    if (g.i >= g.pairs.length) {
      g.over = true; const d = ctx.data, right = g.done.filter((x) => x.right).length;
      d.plays = (d.plays || 0) + 1;
      if (g.daily) { d.daily = d.daily || {}; d.daily[dayKey()] = right; } else if (right > (d.best || 0)) d.best = right;
      d.foolsBeaten = (d.foolsBeaten || 0) + g.done.filter((x) => x.fool && x.right).length;
      if (ctx.session) ctx.session(); if (ctx.earn) ctx.earn('stop'); ctx.save();
    }
  }
}
export function key(e, ctx) {
  const g = ctx.ui.g; if (!g || g.over) return false;
  if (g.done[g.i]) { if (e.key === 'Enter') { act('next', '', ctx); return true; } return false; }
  if (e.key === '1' || e.key === '2') { act('pick', g.pairs[g.i][+e.key - 1], ctx); return true; }
  return false;
}
export function selftest(ok) {
  for (const band of ['6-7', '8-10', '11-14']) for (let i = 0; i < 20; i++) {
    const ps = makePairs(seeded(band + i), band);
    ok(ps.length >= 8, `${band}: a round has enough fair pairs (${ps.length})`);
    ok(ps.every(([x, y]) => { const r = Math.max(byCc[x].area, byCc[y].area) / Math.min(byCc[x].area, byCc[y].area); return r >= 1.15 && r <= 8; }), `${band}: every pair is fair — 15% to 8× apart`);
    ok(new Set(ps.flat()).size === ps.length * 2, `${band}: no country twice in a round`);
  }
  ok(byCc.BR.area > byCc.IN.area && byCc.IN.area > byCc.FR.area, 'the data: Brazil > India > France');
  ok(QUIZ.some((a) => QUIZ.some((b) => fooler(a, b))), 'some pairs really do fool the eye');
}
