/* Shape Detective — a country's true outline and a trail of clues.

   The outline is drawn from the data in an equal-area projection centred on the country
   (map.js shapeSVG), so no shape is stretched. Six names to choose from, all of a similar
   size so size gives nothing away. Each clue comes from the data — continent, coast or
   landlocked, how many countries it touches, one neighbour's name — and costs a point; a
   wrong pick holds, costs a point and says why it is not that one. */
import { GAME_META } from './meta.js';
import { QUIZ, byCc } from '../geo.js';
import { shapeSVG, hasShape } from '../map.js';
import { FAMOUS } from '../chapters/kit.js';
import { seeded, shuffle, dayKey } from '../rand.js';
import { readBtn, ico, titleCard, finishCard, hud, esc } from './kit.js';
import { NB } from './chain.js';

export const TOOL = GAME_META.shape;
const ROUND = 8, START = 5;
const pool = (band) => QUIZ.filter((c) => hasShape(c.cc) && c.area >= (band === '11-14' ? 5000 : 40000) && (band !== '6-7' || FAMOUS.has(c.cc)));
export function clues(c) {
  const nb = NB[c.cc] || [];
  return [
    `It is in <b>${esc(c.cont)}</b>.`,
    c.landlocked ? 'It has <b>no coast</b> — it is landlocked.' : 'It has a <b>coast</b> on the sea.',
    nb.length ? `It shares a land border with <b>${nb.length}</b> ${nb.length === 1 ? 'country' : 'countries'}.` : 'It shares a land border with <b>no</b> other country.',
    nb.length ? `One of its neighbours is <b>${esc(byCc[nb[0]].name)}</b>.` : 'It is an island country, or a set of islands.',
  ];
}
/* six choices: the answer and five of a similar size (within ×3), from anywhere */
export function choices(c, r, band) {
  const near = shuffle(pool(band === '6-7' ? '8-10' : band).filter((x) => x.cc !== c.cc && x.area >= c.area / 3 && x.area <= c.area * 3), r).slice(0, 5);
  return shuffle([c.cc, ...near.map((x) => x.cc)], r);
}
function newRound(ctx, daily) {
  const r = seeded(daily ? 'shape' + dayKey() : 'shape' + Date.now()), band = daily ? '8-10' : ctx.band;
  const list = shuffle(pool(band), r).slice(0, daily ? 3 : ROUND).map((c) => ({ cc: c.cc, opts: choices(c, r, band) }));
  ctx.ui.g = { list, i: 0, shown: 0, wrong: [], done: [], daily };
}

export function view(ctx) {
  const g = ctx.ui.g, d = ctx.data;
  if (!g) return titleCard(TOOL, {
    how: ['A country’s outline, drawn true — not stretched.', 'Pick its name from six. Stuck? Ask for a clue: its continent, its coast, its neighbours.', `Every clue or wrong guess costs a point — start with ${START}.`],
    starts: [['shape|start', `Solve ${ROUND} shapes`], ['shape|daily', (d.daily || {})[dayKey()] != null ? 'Today’s three ✓' : 'Today’s three']],
    best: d.best ? `Best round: ${d.best} points · ${d.plays || 0} played` : '',
  });
  if (g.over) {
    const tot = g.done.reduce((a, x) => a + x.pts, 0);
    return finishCard({ kicker: g.daily ? 'Today’s three' : 'Case closed', count: tot, title: `of ${g.list.length * START} points`,
      lines: [`You named ${g.done.filter((x) => x.pts === START).length} with no clue at all.`, 'You practised: the shapes of countries, and reasoning from clues.'],
      again: ['shape|start', 'Play again'], home: 'shape|home' });
  }
  const P = g.list[g.i], c = byCc[P.cc], done = g.done[g.i], cl = clues(c), pts = Math.max(1, START - g.shown - g.wrong.length);
  return `${hud([`Shape ${g.i + 1} of ${g.list.length}`, done ? '' : `Worth: <b>${pts}</b>`, `Score: ${g.done.reduce((a, x) => a + x.pts, 0)}`])}
    <div class="sd-board">
      <div class="card sd-shape">${shapeSVG(P.cc, 320, 'shape big')}</div>
      <div class="sd-side">
        <ol class="sd-clues" id="sd-clues" aria-live="polite">${cl.slice(0, done ? 4 : g.shown).map((x) => `<li>${x}</li>`).join('') || '<li class="muted">No clues yet — do you know it already?</li>'}</ol>
        ${done || g.shown >= 4 ? '' : `<button class="btn" data-act="lib" data-arg="shape|clue">${ico('lens')} A clue (−1) <kbd>C</kbd></button>`}
        ${g.wrong.length && !done ? `<p class="fb bad">${g.wrong.map((w) => `Not ${esc(byCc[w].name)}.`).join(' ')}</p>` : ''}
      </div>
    </div>
    <div class="choice-row sd-opts">${P.opts.map((x, j) => `<button class="btn big opt${done && x === P.cc ? ' right' : ''}${g.wrong.includes(x) ? ' wrong' : ''}" data-act="lib" data-arg="shape|pick|${x}" ${done || g.wrong.includes(x) ? 'disabled' : ''}><span>${esc(byCc[x].name)}</span> <kbd>${j + 1}</kbd></button>`).join('')}</div>
    ${done ? `<div class="card gm-res"><p class="fb good">It is <b>${esc(c.name)}</b> — ${done.pts} ${done.pts === 1 ? 'point' : 'points'}.</p>
      <button class="btn primary big" data-act="lib" data-arg="shape|next">${g.i + 1 < g.list.length ? 'Next shape' : 'See your score'} <kbd>Enter</kbd></button></div>` : ''}`;
}

export function act(name, arg, ctx) {
  const g = ctx.ui.g;
  if (name === 'start') { newRound(ctx, false); ctx.sfx.click(); }
  else if (name === 'daily') newRound(ctx, true);
  else if (name === 'home') ctx.ui.g = null;
  else if (!g || g.over || g.done[g.i] && name !== 'next') return;
  else if (name === 'clue' && g.shown < 4) { g.shown++; ctx.sfx.click(); }
  else if (name === 'pick') {
    const P = g.list[g.i];
    if (arg === P.cc) { const pts = Math.max(1, START - g.shown - g.wrong.length); g.done[g.i] = { pts }; ctx.tick(g.wrong.length === 0); ctx.sfx.good(); if (pts === START) ctx.confetti(18); }
    else if (!g.wrong.includes(arg)) { g.wrong.push(arg); ctx.sfx.bad(); }
  } else if (name === 'next' && g.done[g.i]) {
    g.i++; g.shown = 0; g.wrong = [];
    if (g.i >= g.list.length) {
      g.over = true; const d = ctx.data, tot = g.done.reduce((a, x) => a + x.pts, 0);
      d.plays = (d.plays || 0) + 1;
      if (g.daily) { d.daily = d.daily || {}; d.daily[dayKey()] = tot; } else if (tot > (d.best || 0)) d.best = tot;
      d.noClue = (d.noClue || 0) + g.done.filter((x) => x.pts === START).length;
      if (ctx.session) ctx.session(); if (ctx.earn) ctx.earn('stop'); ctx.save();
    }
  }
}
export function key(e, ctx) {
  const g = ctx.ui.g; if (!g || g.over) return false;
  if (g.done[g.i]) { if (e.key === 'Enter') { act('next', '', ctx); return true; } return false; }
  if (e.key === 'c' || e.key === 'C') { act('clue', '', ctx); return true; }
  const n = parseInt(e.key, 10), o = g.list[g.i].opts;
  if (n >= 1 && n <= o.length) { act('pick', o[n - 1], ctx); return true; }
  return false;
}
export function selftest(ok) {
  for (const band of ['6-7', '8-10', '11-14']) {
    ok(pool(band).length >= 20, `${band}: enough shapes (${pool(band).length})`);
    for (const c of pool(band)) {
      const o = choices(c, seeded(band + c.cc), band);
      ok(o.length >= 4 && new Set(o).size === o.length && o.filter((x) => x === c.cc).length === 1, `${band} ${c.cc}: distinct choices, the answer once`);
      ok(clues(c).every((x) => !x.toLowerCase().includes(c.name.toLowerCase())), `${c.cc}: no clue names the answer`);
    }
  }
  ok(shapeSVG('IN').includes('<path d="M'), 'a shape draws');
}
