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
import { panel, handle, judge } from './ask.js';

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

const askOf = (c, list) => ({ name: c.name, answers: c.cap, display: capsText(c), note: c.capNote, flag: c.cc.toLowerCase(), kicker: c.cont, unit: 'country',
  others: list.filter((x) => x !== c && x.cont === c.cont).flatMap((x) => x.cap) });

export function view(ctx) {
  const u = ctx.ui, d = ctx.data, cont = u.cont || 'All', list = listFor(cont);
  const sel = u.sel && byCc[u.sel] ? byCc[u.sel] : null, st = u.ask || {};
  const answered = st.state === 'right' || st.state === 'picked' || st.state === 'revealed';
  const view = cont === 'All' ? null : viewFor(CONTINENTS.find((c) => c.id === cont).view);
  const pins = list.map((c) => ({ at: c.capAt[0], cls: known(d, c.cc) ? 'known' : 'cap', r: 3.2 }));
  if (sel && answered) pins.push({ at: sel.capAt[0], cls: 'red', r: 6, label: capOf(sel) });
  const nk = list.filter((c) => known(d, c.cc)).length;
  return `<div class="seg" role="tablist" aria-label="Continent">${CONTS.map((c) => `<button role="tab" aria-selected="${c === cont}" class="${c === cont ? 'on' : ''}" data-act="lib" data-arg="capitals|cont|${c}">${esc(c)}</button>`).join('')}</div>
    <div class="t-cap-bar"><span><b class="t-cap-n">${nk}</b> <span class="muted" title="Known = right on two different days, typed or picked">/ ${list.length} known</span></span>
      <button class="btn primary" data-act="lib" data-arg="capitals|quiz">Quiz me on ${cont === 'All' ? 'the world' : esc(cont)}</button></div>
    <div class="t-cap-wide">
      ${worldSVG({ key: 'cap-' + cont, tap: true, view, pins, fill: sel ? { [sel.cc]: 'hl' } : {}, label: 'Tap a country, then type its capital' })}
      <div class="row gap center map-ctl"><button class="btn small" data-act="mapZoom" data-arg="cap-${cont}|in" aria-label="Zoom in">＋</button><button class="btn small" data-act="mapZoom" data-arg="cap-${cont}|out" aria-label="Zoom out">－</button><button class="btn small" data-act="mapZoom" data-arg="cap-${cont}|home" aria-label="Whole map">⟲</button><span class="muted small">Tap a country</span></div>
    </div>
    ${sel ? panel('capitals', askOf(sel, QUIZ), st) : ''}
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
  const choose = (cc) => { if (ctx.ui.sel !== cc) { ctx.ui.sel = cc; ctx.ui.ask = {}; setTimeout(() => { const i = document.getElementById('t-capitals-ans'); if (i) i.focus({ preventScroll: true }); }, 30); } };
  if (name === 'cont') { ctx.ui.cont = arg; ctx.ui.sel = null; ctx.ui.ask = {}; }
  else if (name === 'sel') choose(arg);
  else if (name === 'close') { ctx.ui.sel = null; ctx.ui.ask = {}; }
  else if (name === 'tap') { const t = JSON.parse(arg); if (t.cc && byCc[t.cc] && byCc[t.cc].quiz) choose(t.cc); }
  else if (['check', 'four', 'pick', 'reveal'].includes(name) && ctx.ui.sel) {
    const c = byCc[ctx.ui.sel], st = ctx.ui.ask || (ctx.ui.ask = {});
    const how = handle(name, arg, askOf(c, QUIZ), st, name === 'check' ? ctx.ui.ans : null);
    const b0 = (ctx.data.box || {})[c.cc] || 0;
    if (how === 'typed') { record(ctx.data, c.cc, true); ctx.tick(true, 2); ctx.sfx.good(); ctx.save(); }
    else if (how === 'picked') { record(ctx.data, c.cc, true); ctx.tick(true, 1); ctx.sfx.good(); ctx.save(); }
    else if (how === 'revealed') { record(ctx.data, c.cc, false); ctx.save(); }
    else if (name === 'check' || name === 'pick') ctx.sfx.bad();
    if (b0 < 2 && ((ctx.data.box || {})[c.cc] || 0) >= 2 && ctx.known) ctx.known();
    if (how) ctx.ui.ans = '';
  }
  else if (name === 'quiz') ctx.startRun(`Capitals · ${ctx.ui.cont || 'All'}`, quiz(ctx.data, ctx.ui.cont || 'All', ctx.band));
}
/* after each answer in a run the host calls answered(q, right, ctx) */
export function key(e, ctx) {
  const st = ctx.ui.ask || {};
  if (e.key === 'Escape' && ctx.ui.sel) { act('close', '', ctx); return true; }
  if (!ctx.ui.sel || ['right', 'picked', 'revealed'].includes(st.state)) return false;
  if (e.key === 'Enter' && e.target && e.target.id === 't-capitals-ans') { ctx.ui.ans = e.target.value; act('check', '', ctx); return true; }
  const n = parseInt(e.key, 10);
  if (st.opts && n >= 1 && n <= st.opts.length && !(e.target && e.target.tagName === 'INPUT')) { act('pick', st.opts[n - 1], ctx); return true; }
  return false;
}
export function answered(q, right, ctx) { if (q.cc) { const b0 = (ctx.data.box || {})[q.cc] || 0; record(ctx.data, q.cc, right); if (b0 < 2 && ctx.data.box[q.cc] >= 2 && ctx.known) ctx.known(); ctx.save(); } }
export function done(run, ctx) {
  const right = run.results.filter((x) => x.right).length;
  return { stars: right >= 9 ? 3 : right >= 7 ? 2 : 1, lines: [`You now know ${QUIZ.filter((c) => known(ctx.data, c.cc)).length} of 195 capitals.`] };
}
export function selftest(ok) {
  ok(judge('new delhi', ['New Delhi']) === 'exact' && judge('  NEW-DELHI ', ['New Delhi']) === 'exact', 'case, spaces and punctuation do not matter');
  ok(judge('Bogota', ['Bogotá']) === 'exact' && judge('Brasilia', ['Brasília']) === 'exact', 'accents do not matter');
  ok(judge('Kathmandou', ['Kathmandu']) === 'close' && !judge('Kathmandooo', ['Kathmandu']), 'one slip in a long name is accepted, and flagged');
  ok(!judge('Rome', ['Roma']) || judge('Rome', ['Roma']) === false, 'a short name must be exact');
  ok(!judge('Sydney', ['Canberra']) && !judge('', ['Canberra']), 'a wrong or empty answer is wrong');
  ok(judge('Washington', ['Washington, D.C.']) === 'exact', 'Washington is Washington, D.C.');
  ok(judge('La Paz', ['Sucre', 'La Paz']) === 'exact', 'any of a country’s capitals is right');
  { const st = {}, q = { name: 'France', answers: ['Paris'], display: 'Paris', others: ['Berlin', 'Madrid', 'Rome', 'Lisbon', 'Paris'] };
    handle('four', '', q, st); ok(st.opts.length === 4 && st.opts.filter((o) => o === 'Paris').length === 1, 'four choices, exactly one right');
    ok(handle('pick', 'Berlin', q, st) === null && st.wrongPick === 'Berlin', 'a wrong pick holds');
    ok(handle('pick', 'Paris', q, st) === 'picked', 'a right pick is a pick, not a typed answer');
    const s2 = {}; ok(handle('check', '', q, s2, 'Lyon') === null && s2.state === 'wrong', 'a wrong typed answer holds');
    ok(handle('reveal', '', q, s2) === 'revealed', 'reveal shows it'); }
  const d = {};
  record(d, 'FR', true, '2026-01-01'); record(d, 'FR', true, '2026-01-01');
  ok(d.box.FR === 1, 'two right answers on one day climb one box');
  record(d, 'FR', true, '2026-01-02'); ok(known(d, 'FR'), 'right on two days is known');
  record(d, 'FR', false, '2026-01-03'); ok(d.box.FR === 1 && !known(d, 'FR'), 'a miss drops one box, not to zero');
  const qs = quiz({}, 'Europe', '8-10', seeded('t'));
  ok(qs.length === 10 && new Set(qs.map((q) => q.cc)).size === 10, 'a quiz is ten different countries');
  ok(qs.every((q) => q.opts.filter((o) => o === q.ans).length === 1), 'one right option each');
}
