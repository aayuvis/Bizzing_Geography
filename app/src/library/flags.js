/* Flags of the World — every country's flag (flag-icons, MIT), by
   continent, with a quiz. */
import { QUIZ, CONTINENTS, byCc, capOf } from '../geo.js';
import { flagQ } from '../chapters/capitals.js';
import { FAMOUS } from '../chapters/kit.js';
import { rnd } from '../rand.js';
import { record } from './capitals.js';
const byName = Object.fromEntries(QUIZ.map((c) => [c.name, c.cc]));

export const TOOL = { id: 'flags', name: 'Flags of the World', glyph: '🚩', art: 'lib-flags', blurb: 'All 195 flags, continent by continent, and a quiz to learn them.' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const CONTS = ['All', ...CONTINENTS.filter((c) => c.id !== 'Antarctica').map((c) => c.id)];
const listFor = (cont) => QUIZ.filter((c) => cont === 'All' || c.cont === cont);

export function view(ctx) {
  const u = ctx.ui, cont = u.cont || 'All', sel = u.sel && byCc[u.sel];
  return `<div class="seg" role="tablist" aria-label="Continent">${CONTS.map((c) => `<button role="tab" aria-selected="${c === cont}" class="${c === cont ? 'on' : ''}" data-act="lib" data-arg="flags|cont|${c}">${esc(c)}</button>`).join('')}</div>
    <div class="row center"><button class="btn primary" data-act="lib" data-arg="flags|quiz">Quiz me on ${cont === 'All' ? 'the world' : esc(cont)}</button></div>
    ${sel ? `<div class="card t-flag-sel"><img src="flags/${sel.cc.toLowerCase()}.svg" alt="Flag of ${esc(sel.name)}" width="160" height="120"><div><h3>${esc(sel.name)}</h3><p class="muted">${esc(sel.cont)} · capital ${esc(capOf(sel))}</p></div></div>` : ''}
    <div class="t-flag-grid">${listFor(cont).map((c) => `<button class="t-flag${u.sel === c.cc ? ' on' : ''}" data-act="lib" data-arg="flags|sel|${c.cc}"><img src="flags/${c.cc.toLowerCase()}.svg" alt="" loading="lazy" width="80" height="60"><span>${esc(c.name)}</span></button>`).join('')}</div>`;
}
export function act(name, arg, ctx) {
  if (name === 'cont') { ctx.ui.cont = arg; ctx.ui.sel = null; }
  else if (name === 'sel') ctx.ui.sel = arg;
  else if (name === 'quiz') {
    const list = listFor(ctx.ui.cont || 'All'), lv = ctx.band === '6-7' ? 1 : ctx.band === '8-10' ? 2 : 3, out = [], seen = new Set();
    for (let t = 0; out.length < 10 && t < 300; t++) { const q = flagQ(rnd, list, lv); if (!seen.has(q.ans)) { seen.add(q.ans); out.push(q); } }
    ctx.startRun('Flags', out);
  }
}
/* a flag is KNOWN when it is right on two different days (the capitals' rule) — the 50-flags medal reads this */
export function answered(q, right, ctx) {
  const cc = byName[q.ans]; if (!cc) return;
  const b0 = (ctx.data.box || {})[cc] || 0; record(ctx.data, cc, right);
  if (b0 < 2 && ctx.data.box[cc] >= 2 && ctx.known) ctx.known(); ctx.save();
}
export function done(run) { const right = run.results.filter((x) => x.right).length; return { stars: right >= 9 ? 3 : right >= 7 ? 2 : 1, lines: [] }; }
export function selftest(ok) {
  ok(QUIZ.every((c) => c.hasFlag), 'every country has a flag file');
  ok(FAMOUS.size > 40, 'a starter set exists');
}
