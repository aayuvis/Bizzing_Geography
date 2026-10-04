/* Neighbour Chain — from one country to another, one land border at a time.

   The board is the real map; a move is a country that shares a land border with the
   last one in the chain (byCc.borders, from the data — never typed). Every puzzle is
   PROVED solvable before it is shown, and its shortest chain is known: the score is
   how close the child's chain comes to it (★★★ shortest, ★★ one longer, ★ any other).
   A wrong tap is held and explained ("Peru and Chile do not touch") — it costs nothing. */
import { GAME_META } from './meta.js';
import { QUIZ, byCc, capOf } from '../geo.js';
import { worldSVG, viewFor } from '../map.js';
import { seeded, shuffle, dayKey } from '../rand.js';
import { readBtn, ico, titleCard, finishCard, hud, esc, todaySeed, todayStart, keepToday } from './kit.js';

export const TOOL = GAME_META.chain;
const ROUND = 5;
const Q = new Set(QUIZ.map((c) => c.cc));
/* the land graph, among the 195 only (Western Sahara and the like are drawn, never stepped on).
   A border counts when BOTH countries list it — the data once had Sri Lanka "touching" India,
   from one side only; there is no land border, and the selftest now holds the rule. */
const RAW = Object.fromEntries(QUIZ.map((c) => [c.cc, (c.borders || []).filter((b) => Q.has(b))]));
export const NB = Object.fromEntries(QUIZ.map((c) => [c.cc, RAW[c.cc].filter((b) => (RAW[b] || []).includes(c.cc))]));
export function bfs(a) {
  const d = { [a]: 0 }, prev = {}, q = [a];
  while (q.length) { const x = q.shift(); for (const y of NB[x]) if (d[y] == null) { d[y] = d[x] + 1; prev[y] = x; q.push(y); } }
  return { d, prev };
}
export function shortest(a, b) { const { d, prev } = bfs(a); if (d[b] == null) return null; const p = [b]; while (p[0] !== a) p.unshift(prev[p[0]]); return p; }
const RANGE = { '6-7': [2, 3], '8-10': [3, 5], '11-14': [4, 7] };

/* a puzzle: start, goal, and the shortest chain between them (proved here) */
export function makePuzzle(r, band) {
  const [lo, hi] = RANGE[band] || RANGE['8-10'];
  const starts = shuffle(QUIZ.filter((c) => NB[c.cc].length), r);
  for (const s of starts) {
    const { d } = bfs(s.cc);
    const goals = shuffle(Object.keys(d).filter((x) => d[x] >= lo && d[x] <= hi), r);
    if (goals.length) { const path = shortest(s.cc, goals[0]); return { a: s.cc, b: goals[0], best: path.length - 1, path }; }
  }
  return null;
}
function newRound(ctx, daily) {
  const r = seeded(daily ? todaySeed('chain') : 'chain' + Date.now());
  const n = daily ? 1 : ROUND, list = [];
  while (list.length < n) { const p = makePuzzle(r, daily ? '8-10' : ctx.band); if (p && !list.some((x) => x.a === p.a && x.b === p.b)) list.push(p); }
  ctx.ui.g = { list, i: 0, chain: [list[0].a], done: [], msg: '', daily, hint: false };
}
const name = (cc) => (byCc[cc] || {}).name || cc;
const starsFor = (steps, best) => (steps <= best ? 3 : steps === best + 1 ? 2 : 1);
function bboxOf(ccs) {
  const pts = ccs.map((c) => byCc[c].capAt[0]);
  let w = Math.min(...pts.map((p) => p[1])), e = Math.max(...pts.map((p) => p[1])), s = Math.min(...pts.map((p) => p[0])), n = Math.max(...pts.map((p) => p[0]));
  const padLng = Math.max(12, (e - w) * 0.5), padLat = Math.max(9, (n - s) * 0.5);
  return [w - padLng, s - padLat, e + padLng, n + padLat];
}

export function view(ctx) {
  const g = ctx.ui.g, d = ctx.data;
  if (!g) return titleCard(TOOL, {
    how: ['You start in one country. Your goal is another.', 'Tap a country that shares a <b>land border</b> with the last one in your chain.', 'Reach the goal in as few steps as you can — ★★★ for the shortest chain.'],
    starts: [['chain|start', `Play ${ROUND} chains`], todayStart('chain', d)],
    best: d.best ? `Best round: ${d.best} of ${ROUND * 3} stars · ${d.plays || 0} played` : '',
  });
  if (g.over) {
    const tot = g.done.reduce((a, x) => a + x.stars, 0);
    return finishCard({ kicker: g.daily ? 'Today’s round' : 'Chains complete', count: tot, title: `of ${g.list.length * 3} stars`,
      lines: [g.done.map((x, j) => `<b>${esc(name(g.list[j].a))} → ${esc(name(g.list[j].b))}</b>: you took ${x.steps}, the shortest is ${g.list[j].best} — ${g.list[j].path.map(name).map(esc).join(' → ')}`).join('<br>'),
        'You practised: which countries touch, and finding a way across a continent.'],
      again: ['chain|start', 'Play again'], home: 'chain|home' });
  }
  const P = g.list[g.i], last = g.chain[g.chain.length - 1], steps = g.chain.length - 1, solved = last === P.b;
  const fill = {}; for (const c of g.chain) fill[c] = 'pick'; fill[P.a] = 'start'; fill[P.b] = solved ? 'ok' : 'goal';
  const view = viewFor(bboxOf([P.a, P.b, ...g.chain]));
  return `${hud([`Chain ${g.i + 1} of ${g.list.length}`, `Steps: <b>${steps}</b>`, solved ? '' : 'Shortest possible: ' + P.best])}
    <div class="gm-prompt"><p class="long-q" id="gm-q">From <b class="c-start">${esc(name(P.a))}</b> to <b class="c-goal">${esc(name(P.b))}</b>. ${solved ? '' : `You are in <b>${esc(name(last))}</b>.`}</p>
      ${readBtn('#gm-q')}</div>
    ${worldSVG({ key: 'chain' + g.i, tap: !solved, fill, view, label: `Neighbour Chain: from ${name(P.a)} to ${name(P.b)}` })}
    <ol class="gm-chain" aria-label="Your chain">${g.chain.map((c, j) => `<li class="${j === 0 ? 'start' : c === P.b ? 'goal' : ''}">${esc(name(c))}</li>`).join('')}</ol>
    ${g.msg ? `<p class="fb bad" role="status">${g.msg}</p>` : ''}
    ${solved ? `<div class="card gm-res"><p class="fb good">${'★'.repeat(starsFor(steps, P.best))} You reached ${esc(name(P.b))} in ${steps} ${steps === 1 ? 'step' : 'steps'}${steps <= P.best ? ' — the shortest chain there is!' : `. The shortest is ${P.best}: ${P.path.map(name).map(esc).join(' → ')}.`}</p>
        <button class="btn primary big" data-act="lib" data-arg="chain|next">${g.i + 1 < g.list.length ? 'Next chain' : 'See your stars'} <kbd>Enter</kbd></button></div>`
      : `<div class="row gap wrap center gm-ctl">
        <button class="btn" data-act="lib" data-arg="chain|undo" ${g.chain.length > 1 ? '' : 'disabled'}>${ico('back')} Undo <kbd>U</kbd></button>
        <button class="btn" data-act="lib" data-arg="chain|hint" ${g.hint ? 'disabled' : ''}>${ico('hint')} ${esc(name(last))}’s neighbours <kbd>H</kbd></button>
        <button class="btn ghost" data-act="mapZoom" data-arg="chain${g.i}|home" aria-label="Whole puzzle">⟲</button></div>
        ${g.hint ? `<div class="choice-row gm-nb" role="group" aria-label="${esc(name(last))} touches">${NB[last].map((c, j) => `<button class="btn opt" data-act="lib" data-arg="chain|step|${c}">${esc(name(c))}${j < 9 ? ` <kbd>${j + 1}</kbd>` : ''}</button>`).join('')}</div>` : ''}`}`;
}

export function act(name_, arg, ctx) {
  const g = ctx.ui.g;
  if (name_ === 'start') { newRound(ctx, false); ctx.sfx.click(); }
  else if (name_ === 'daily') newRound(ctx, true);
  else if (name_ === 'home') ctx.ui.g = null;
  else if (!g || g.over) return;
  else if (name_ === 'tap') { const t = JSON.parse(arg); if (t.cc) act('step', t.cc, ctx); }
  else if (name_ === 'step') {
    const P = g.list[g.i], last = g.chain[g.chain.length - 1];
    if (last === P.b) return;
    if (arg === last) return;
    if (!NB[last].includes(arg)) { g.msg = Q.has(arg) ? `${esc(name(arg))} does not share a land border with ${esc(name(last))}. Try a country that touches it.` : 'That is not one of the 195 countries. Try one that touches the last in your chain.'; ctx.sfx.bad(); return; }
    g.msg = ''; g.chain.push(arg); g.hint = false; ctx.sfx.click();
    if (arg === P.b) {
      const steps = g.chain.length - 1, stars = starsFor(steps, P.best);
      g.done[g.i] = { steps, stars }; ctx.tick(stars === 3); ctx.sfx.good(); if (stars === 3) ctx.confetti(20);
    }
  } else if (name_ === 'undo' && g.chain.length > 1 && g.chain[g.chain.length - 1] !== g.list[g.i].b) { g.chain.pop(); g.msg = ''; }
  else if (name_ === 'hint') g.hint = true;
  else if (name_ === 'next' && g.done[g.i]) {
    g.i++; g.hint = false; g.msg = '';
    if (g.i >= g.list.length) {
      g.over = true; const d = ctx.data, tot = g.done.reduce((a, x) => a + x.stars, 0);
      d.plays = (d.plays || 0) + 1;
      if (g.daily) keepToday(d, tot); else if (tot > (d.best || 0)) d.best = tot;
      d.perfect = (d.perfect || 0) + g.done.filter((x) => x.stars === 3).length;
      if (ctx.session) ctx.session(); if (ctx.earn) ctx.earn('stop'); ctx.save();
    } else g.chain = [g.list[g.i].a];
  }
}
export function key(e, ctx) {
  const g = ctx.ui.g; if (!g || g.over) return false;
  const P = g.list[g.i], solved = g.chain[g.chain.length - 1] === P.b;
  if (solved && e.key === 'Enter') { act('next', '', ctx); return true; }
  if (e.key === 'u' || e.key === 'U') { act('undo', '', ctx); return true; }
  if (e.key === 'h' || e.key === 'H') { act('hint', '', ctx); return true; }
  const n = parseInt(e.key, 10), last = g.chain[g.chain.length - 1];
  if (g.hint && n >= 1 && NB[last][n - 1]) { act('step', NB[last][n - 1], ctx); return true; }
  return false;
}
export function selftest(ok) {
  ok(QUIZ.every((c) => NB[c.cc].every((b) => NB[b] && NB[b].includes(c.cc))), 'borders are symmetric: if A touches B, B touches A');
  ok(NB.FR.includes('ES') && NB.IN.includes('NP') && !NB.IN.includes('LK'), 'France touches Spain, India touches Nepal, not Sri Lanka');
  for (const band of ['6-7', '8-10', '11-14']) for (let i = 0; i < 40; i++) {
    const p = makePuzzle(seeded(band + i), band), [lo, hi] = RANGE[band];
    ok(p && p.best >= lo && p.best <= hi, `${band}: a puzzle in range (${p && p.best})`);
    ok(p && p.path[0] === p.a && p.path[p.path.length - 1] === p.b && p.path.every((c, j) => !j || NB[p.path[j - 1]].includes(c)), `${band}: its shortest chain is a real chain of neighbours`);
    ok(p && shortest(p.a, p.b).length - 1 === p.best, `${band}: and it is the shortest`);
  }
}
