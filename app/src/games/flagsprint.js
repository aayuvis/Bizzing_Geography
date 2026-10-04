/* Flag Sprint (F2) — as many flags as you can name in 60 seconds, four names each.

   Only the 195 are asked (geo.js QUIZ): a territory's flag is drawn elsewhere in the app,
   never asked as a country's. The flags are the app's own files (flags/<cc>.svg, as the
   Flags tool draws them). Wrong names come from the flag's own continent where it has
   enough countries, so the choice is about the flag and not about geography guessed from
   the options — and two flags that are all but identical (Chad and Romania, Indonesia and
   Monaco, the Netherlands and Luxembourg — the Flags stop warns of the first two) are never
   offered against each other. No flag comes twice in one run.

   Score = number right; the best is kept, and today's round is the same 60 seconds of flags
   for everyone (kit.js todaySeed). The clock is injectable (setClock) so a test can run a
   whole minute in no time. */
import { GAME_META } from './meta.js';
import { QUIZ, byCc } from '../geo.js';
import { FAMOUS } from '../chapters/kit.js';
import { seeded, shuffle } from '../rand.js';
import { readBtn, titleCard, finishCard, hud, esc, todaySeed, todayStart, keepToday } from './kit.js';

export const TOOL = GAME_META.flagsprint;
export const SECONDS = 60;
/* The family rule is that a wrong answer holds until it is dismissed. In a sprint against a
   clock that would turn one slip into lost seconds the child never chose to spend, so here a
   wrong answer holds for HOLD ms with the right flag named — long enough to read it — and a
   tap (or Enter) moves on sooner. The right name is always shown before the next flag. */
export const HOLD = 1200;
const TWINS = [['TD', 'RO'], ['ID', 'MC'], ['NL', 'LU']];
const twin = (a, b) => TWINS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));

let clock = () => Date.now();
export const setClock = (fn) => { clock = fn || (() => Date.now()); };

export const POOL = QUIZ.filter((c) => c.hasFlag !== false);
const poolFor = (band) => (band === '6-7' ? POOL.filter((c) => FAMOUS.has(c.cc)) : POOL);
/* four names for one flag: the answer and three from its continent where there are enough */
export function optionsFor(cc, r, pool = POOL) {
  const c = byCc[cc];
  const near = shuffle(pool.filter((x) => x.cc !== cc && x.cont === c.cont && !twin(x.cc, cc)), r);
  const far = shuffle(pool.filter((x) => x.cc !== cc && x.cont !== c.cont && !twin(x.cc, cc)), r);
  const wrong = [...near, ...far].slice(0, 3).map((x) => x.cc);
  return shuffle([cc, ...wrong], seeded('fs|' + cc + '|' + wrong.join()));
}
/* a run: every flag of the pool once, in a seeded order (no one names 195 in a minute) */
export function makeRun(seed, band) {
  const r = seeded(seed), pool = poolFor(band);
  return shuffle(pool, r).map((c) => ({ cc: c.cc, opts: optionsFor(c.cc, r, pool.length >= 40 ? pool : POOL) }));
}
function start(ctx, daily) {
  ctx.ui.g = { run: makeRun(daily ? todaySeed('flagsprint') : 'fs' + Date.now() + Math.random(), daily ? '8-10' : ctx.band), i: 0, right: 0, wrong: [], t0: clock(), hold: null, over: false, daily };
  arm(ctx);
}
const left = (g) => Math.max(0, SECONDS * 1000 - (clock() - g.t0));

/* The clock: a quarter-second beat that writes the seconds into the HUD (no full re-render),
   ends the hold, and ends the run at 0. Exported so a test can drive it by hand. */
let beat = null;
export function step(ctx) {
  const g = ctx.ui.g; if (!g || g.over) return false;
  if (left(g) <= 0) { finish(ctx); return true; }
  if (g.hold && clock() >= g.hold.until) { g.hold = null; g.i++; return true; }
  return false;
}
function arm(ctx) {
  if (typeof window === 'undefined' || typeof setInterval === 'undefined') return;
  clearInterval(beat);
  const g0 = ctx.ui.g;
  beat = setInterval(() => {
    if (ctx.ui.g !== g0 || g0.over) { clearInterval(beat); return; }
    const el = document.getElementById('fs-clock'); if (el) el.textContent = Math.ceil(left(g0) / 1000) + 's';
    if (step(ctx)) { if (g0.over) clearInterval(beat); ctx.render(); }
  }, 250);
}
function finish(ctx) {
  const g = ctx.ui.g, d = ctx.data; if (!g || g.over) return;
  g.over = true; g.hold = null;
  d.plays = (d.plays || 0) + 1;
  if (g.daily) keepToday(d, g.right); else if (g.right > (d.best || 0)) d.best = g.right;
  if (ctx.session) ctx.session(); if (ctx.earn) ctx.earn('stop'); ctx.save();
}

export function view(ctx) {
  const g = ctx.ui.g, d = ctx.data;
  if (!g) return titleCard(TOOL, {
    how: ['A flag appears. Four names. Tap the country it belongs to — or press 1, 2, 3 or 4.', 'Name as many as you can in <b>60 seconds</b>. No flag comes twice.', 'A wrong pick shows the right one for a moment. Tap to move on sooner.'],
    starts: [['flagsprint|start', 'Start the sprint'], todayStart('flagsprint', d, (x) => `${x} flags`)],
    best: d.best ? `Best sprint: ${d.best} flags · ${d.plays || 0} played` : '',
    note: 'Only the 195 countries are asked — the UN’s members and its two observer states.',
  });
  if (g.over) {
    return finishCard({ kicker: g.daily ? 'Today’s round' : 'Time!', count: g.right, title: g.right === 1 ? 'flag in 60 seconds' : 'flags in 60 seconds',
      lines: [g.wrong.length ? `To look at again: ${g.wrong.slice(0, 8).map((cc) => `<span class="fs-mini"><img src="flags/${cc.toLowerCase()}.svg" alt="" width="30" height="22"> ${esc(byCc[cc].name)}</span>`).join(' ')}` : 'Not one wrong.',
        !g.daily && d.best ? `Your best: ${d.best}.` : '', 'You practised: the flags of the world, and looking closely.'],
      again: ['flagsprint|start', 'Sprint again'], home: 'flagsprint|home' });
  }
  const P = g.run[g.i], h = g.hold;
  return `${hud([`<span id="fs-clock" role="timer" aria-live="off">${Math.ceil(left(g) / 1000)}s</span>`, `Right: <b>${g.right}</b>`, g.daily ? 'Today’s round' : ''])}
    <div class="card fs-card${h ? ' held' : ''}" ${h ? 'data-act="lib" data-arg="flagsprint|skip"' : ''}>
      <div class="gm-prompt"><p class="long-q" id="gm-q">${h ? `That is the flag of <b>${esc(byCc[P.cc].name)}</b>.` : 'Whose flag is this?'}</p>${readBtn('#gm-q')}</div>
      <img class="fs-flag" src="flags/${P.cc.toLowerCase()}.svg" alt="A flag" width="240" height="180">
      <div class="choice-row fs-opts">${P.opts.map((x, j) => `<button class="btn big opt${h && x === P.cc ? ' right' : ''}${h && x === h.pick ? ' wrong' : ''}" data-act="lib" data-arg="flagsprint|${h ? 'skip' : 'pick|' + x}"><span>${esc(byCc[x].name)}</span> <kbd>${j + 1}</kbd></button>`).join('')}</div>
      ${h ? '<p class="muted small center-t">Tap, or press Enter, to go on.</p>' : ''}
    </div>`;
}

export function act(name, arg, ctx) {
  const g = ctx.ui.g;
  if (name === 'start') { start(ctx, false); ctx.sfx.click(); return; }
  if (name === 'daily') { start(ctx, true); return; }
  if (name === 'home') { ctx.ui.g = null; return; }
  if (!g || g.over) return;
  if (left(g) <= 0) { finish(ctx); return; }
  if (name === 'skip' && g.hold) { g.hold = null; g.i++; }
  else if (name === 'pick' && !g.hold) {
    const P = g.run[g.i];
    if (!P.opts.includes(arg)) return;
    const right = arg === P.cc; ctx.tick(right);
    if (right) { g.right++; g.i++; ctx.sfx.good(); }
    else { g.wrong.push(P.cc); g.hold = { pick: arg, until: clock() + HOLD }; ctx.sfx.bad(); }
  }
  if (g.i >= g.run.length) finish(ctx);
}
export function key(e, ctx) {
  const g = ctx.ui.g; if (!g || g.over) return false;
  if (g.hold) { if (e.key === 'Enter' || e.key === ' ') { act('skip', '', ctx); return true; } return false; }
  const n = parseInt(e.key, 10), o = g.run[g.i].opts;
  if (n >= 1 && n <= o.length) { act('pick', o[n - 1], ctx); return true; }
  return false;
}

export function selftest(ok) {
  const Q = new Set(QUIZ.map((c) => c.cc));
  ok(POOL.length === 195 && POOL.every((c) => Q.has(c.cc)), `the pool is the 195 (${POOL.length})`);
  for (const band of ['6-7', '8-10', '11-14']) for (let i = 0; i < 6; i++) {
    const run = makeRun('t' + band + i, band);
    ok(new Set(run.map((x) => x.cc)).size === run.length, `${band}: no flag twice in a run`);
    ok(run.every((x) => Q.has(x.cc) && x.opts.every((o) => Q.has(o))), `${band}: no territory is ever asked or offered`);
    ok(run.every((x) => x.opts.length === 4 && new Set(x.opts).size === 4 && x.opts.filter((o) => o === x.cc).length === 1), `${band}: four distinct names, the right one among them once`);
    ok(run.every((x) => !x.opts.some((o) => o !== x.cc && twin(o, x.cc))), `${band}: near-identical flags are never offered against each other`);
    const same = run.filter((x) => x.opts.filter((o) => byCc[o].cont === byCc[x.cc].cont).length === 4).length;
    ok(same / run.length > 0.85, `${band}: options come from the flag's own continent (${same} of ${run.length})`);
  }
  /* a whole minute on a fake clock: right answers count, a wrong one holds then moves on, time ends it */
  let t = 0; setClock(() => t);
  const ctx = { band: '8-10', ui: {}, data: {}, save() {}, render() {}, sfx: { good() {}, bad() {}, click() {} }, tick() {} };
  act('start', '', ctx); const g = ctx.ui.g;
  for (let i = 0; i < 5; i++) { t += 1000; act('pick', g.run[g.i].cc, ctx); }
  t += 1000; act('pick', g.run[g.i].opts.find((o) => o !== g.run[g.i].cc), ctx);
  ok(g.right === 5 && !!g.hold && g.i === 5, 'five right, then a wrong one holds on the same flag');
  t += HOLD - 100; step(ctx); ok(!!g.hold, 'the hold lasts its time…');
  t += 200; step(ctx); ok(!g.hold && g.i === 6, '…then moves on by itself');
  t = SECONDS * 1000 + 1; step(ctx);
  ok(g.over && ctx.data.best === 5 && ctx.data.plays === 1, 'at sixty seconds the sprint ends and the best is kept');
  act('pick', 'XX', ctx); ok(ctx.data.plays === 1, 'nothing counts after the whistle');
  setClock(null);
}
