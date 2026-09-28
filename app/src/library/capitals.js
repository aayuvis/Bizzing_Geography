/* Country Capitals — all 195, continent by continent: a map to browse, a
   quiz that asks the ones you don't know yet, and an honest count of the
   ones you do.

   "Know" is measured, never assumed: a capital climbs one box each time it
   is answered right on a different day, and drops one box when it is missed
   (the Maths Leitner rule — a miss is reported, never hidden, never a reset).
   Box 2 or more on two different days is "known". */
import { QUIZ, CONTINENTS, byCc, capOf, capsText } from '../geo.js';
import { worldSVG, viewFor } from '../map.js';
import { mc, FAMOUS } from '../chapters/kit.js';
import { givesAway } from '../chapters/capitals.js';
import { seeded, shuffle, dayKey, rnd } from '../rand.js';

export const TOOL = { id: 'capitals', name: 'Country Capitals', glyph: '🏛️', art: 'lib-capitals', blurb: 'All 195 countries and their capitals, on the map and in a quiz that learns what you know.' };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CONTS = ['All', ...CONTINENTS.filter((c) => c.id !== 'Antarctica').map((c) => c.id)];
const listFor = (cont) => QUIZ.filter((c) => cont === 'All' || c.cont === cont);
export const known = (data, cc) => ((data.box || {})[cc] || 0) >= 2;

/* Leitner: right on a new day climbs one box (max 4); a miss drops one. */
export function record(data, cc, right, day = dayKey()) {
  data.box = data.box || {}; data.last = data.last || {};
  const b = data.box[cc] || 0;
  if (right) { if (data.last[cc] !== day) data.box[cc] = Math.min(4, b + 1); }
  else data.box[cc] = Math.max(0, b - 1);
  data.last[cc] = day;
}

export function view(ctx) {
  const u = ctx.ui, d = ctx.data, cont = u.cont || 'All', list = listFor(cont);
  const sel = u.sel && byCc[u.sel] ? byCc[u.sel] : null;
  const view = cont === 'All' ? null : viewFor(CONTINENTS.find((c) => c.id === cont).view);
  const pins = list.map((c) => ({ at: c.capAt[0], cls: known(d, c.cc) ? 'known' : 'cap', r: 3.2 }));
  if (sel) pins.push({ at: sel.capAt[0], cls: 'red', r: 6, label: capOf(sel) });
  const nk = list.filter((c) => known(d, c.cc)).length;
  return `<div class="seg" role="tablist" aria-label="Continent">${CONTS.map((c) => `<button role="tab" aria-selected="${c === cont}" class="${c === cont ? 'on' : ''}" data-act="lib" data-arg="capitals|cont|${c}">${esc(c)}</button>`).join('')}</div>
    <div class="t-cap">
      <div>${worldSVG({ key: 'cap-' + cont, tap: true, view, pins, fill: sel ? { [sel.cc]: 'hl' } : {}, label: 'Tap a country to see its capital' })}
        <p class="muted small center-t">Tap any country — or use the arrow keys and Enter.</p></div>
      <div class="card t-cap-side">
        ${sel ? `<div class="t-cap-sel"><img src="flags/${sel.cc.toLowerCase()}.svg" alt="" width="72" height="54"><div><p class="kicker">${esc(sel.cont)}</p><h3>${esc(sel.name)}</h3>
            <p>Capital: <b>${esc(capsText(sel))}</b></p>${sel.capNote ? `<p class="muted small">${esc(sel.capNote)}</p>` : ''}</div></div>` : '<p class="muted">Tap a country on the map to see its capital.</p>'}
        <p class="kicker">You know</p><h2>${nk} <span class="muted">of ${list.length}</span></h2>
        <p class="muted small">A capital counts as known when you have got it right on two different days.</p>
        <button class="btn primary big" data-act="lib" data-arg="capitals|quiz">Quiz me on ${cont === 'All' ? 'the world' : esc(cont)}</button>
      </div>
    </div>
    <details class="card"><summary><b>Every capital in ${cont === 'All' ? 'the world' : esc(cont)}</b></summary>
      <ul class="t-cap-list">${list.map((c) => `<li class="${known(d, c.cc) ? 'k' : ''}"><button class="linkish" data-act="lib" data-arg="capitals|sel|${c.cc}">${esc(c.name)}</button> — ${esc(capsText(c))}</li>`).join('')}</ul></details>`;
}

/* Ten questions, weighted to what this child does not know yet. */
export function quiz(data, cont, band, r = rnd) {
  const list = listFor(cont).filter((c) => !givesAway(c));
  const easy = band === '6-7' || band === '8-10';
  const score = (c) => ((data.box || {})[c.cc] || 0) * 2 + (easy && !FAMOUS.has(c.cc) ? 3 : 0) + r();
  const pick = list.slice().sort((a, b) => score(a) - score(b)).slice(0, 10);
  return shuffle(pick, r).map((c) => {
    const same = list.filter((x) => x !== c && x.cont === c.cont);
    const q = mc(r, `What is the capital of ${c.name}?`, capOf(c), same.flatMap((x) => x.cap).filter((n) => !c.cap.includes(n)), `The capital of ${c.name} is ${capOf(c)}.${c.capNote ? ' ' + c.capNote : ''}`);
    return { ...q, cc: c.cc };
  });
}

export function act(name, arg, ctx) {
  if (name === 'cont') { ctx.ui.cont = arg; ctx.ui.sel = null; }
  else if (name === 'sel') ctx.ui.sel = arg;
  else if (name === 'tap') { const t = JSON.parse(arg); if (t.cc && byCc[t.cc]) ctx.ui.sel = t.cc; }
  else if (name === 'quiz') ctx.startRun(`Capitals · ${ctx.ui.cont || 'All'}`, quiz(ctx.data, ctx.ui.cont || 'All', ctx.band));
}
/* after each answer in a run the host calls answered(q, right, ctx) */
export function answered(q, right, ctx) { if (q.cc) { record(ctx.data, q.cc, right); ctx.save(); } }
export function done(run, ctx) {
  const right = run.results.filter((x) => x.right).length;
  return { stars: right >= 9 ? 3 : right >= 7 ? 2 : 1, lines: [`You now know ${QUIZ.filter((c) => known(ctx.data, c.cc)).length} of 195 capitals.`] };
}
export function selftest(ok) {
  const d = {};
  record(d, 'FR', true, '2026-01-01'); record(d, 'FR', true, '2026-01-01');
  ok(d.box.FR === 1, 'two right answers on one day climb one box');
  record(d, 'FR', true, '2026-01-02'); ok(known(d, 'FR'), 'right on two days is known');
  record(d, 'FR', false, '2026-01-03'); ok(d.box.FR === 1 && !known(d, 'FR'), 'a miss drops one box, not to zero');
  const qs = quiz({}, 'Europe', '8-10', seeded('t'));
  ok(qs.length === 10 && new Set(qs.map((q) => q.cc)).size === 10, 'a quiz is ten different countries');
  ok(qs.every((q) => q.opts.filter((o) => o === q.ans).length === 1), 'one right option each');
}
