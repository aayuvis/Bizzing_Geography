/* State Capitals — the states of four countries, each on its own map:
   the United States (50 states and DC), India (28 states and 8 union
   territories, from Bizzing India's own signed-off map — the Survey of India
   depiction), Canada (13) and Australia (8). Tap a state for its name and
   capital; quiz capitals, or find a state on the map. */
import { STATES, INDIA, byCc } from '../geo.js';
import { regionSVG, regionCap } from '../map.js';
import { mc, mapQ } from '../chapters/kit.js';
import { shuffle, seeded, rnd } from '../rand.js';
import { panel, handle } from './ask.js';

export const TOOL = { id: 'states', name: 'State Capitals', glyph: '🗺️', art: 'lib-states', blurb: 'The states and capitals of the United States, India, Canada and Australia — tap, learn, quiz.' };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const COUNTRY = [
  { c: 'US', name: 'United States', unit: 'state', note: '50 states and the District of Columbia, home of the capital, Washington, D.C.' },
  { c: 'IN', name: 'India', unit: 'state or union territory', note: '28 states and 8 union territories. The map is the Survey of India’s depiction, from Bizzing India.' },
  { c: 'CA', name: 'Canada', unit: 'province or territory', note: '10 provinces and 3 territories.' },
  { c: 'AU', name: 'Australia', unit: 'state or territory', note: '6 states and 2 mainland territories.' },
];
export function regionsOf(c) {
  if (c === 'IN') return INDIA.states.map((s) => ({ id: s.id, name: s.name, cap: s.cap.replace(/ \(summer\).*/, ''), capFull: s.cap, type: s.type }));
  return STATES.filter((s) => s.c === c).map((s) => ({ id: s.id, name: s.name, cap: s.cap, capFull: s.cap, at: s.capAt }));
}
/* For a quiz a region whose capital is its own name (Delhi → New Delhi;
   Chandigarh → Chandigarh) answers itself, so it is not asked. */
const fair = (s) => !s.cap.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]) && !s.name.toLowerCase().includes(s.cap.toLowerCase().split(' ')[0]);

/* J&K's capital is "Srinagar (summer), Jammu (winter)": either is right */
const answersOf = (s) => [s.cap, ...s.capFull.split(/,\s*/).map((x) => x.replace(/\s*\(.*?\)/g, ''))];
const askOf = (s, regs, C) => ({ name: s.name, answers: answersOf(s), display: s.capFull, kicker: C.name + (s.type === 'ut' ? ' · union territory' : ''), unit: C.unit.split(' ')[0],
  others: regs.filter((x) => x !== s).map((x) => x.cap) });

export function view(ctx) {
  const u = ctx.ui, c = u.c || 'US', C = COUNTRY.find((x) => x.c === c), regs = regionsOf(c);
  const sel = regs.find((s) => s.id === u.sel) || null, st = u.ask || {};
  const answered = st.state === 'right' || st.state === 'picked' || st.state === 'revealed';
  const pins = sel && answered ? [{ xy: regionCap(c, sel.id, sel.at), cls: 'red', r: 6, label: sel.cap }] : [];
  return `<div class="seg" role="tablist" aria-label="Country">${COUNTRY.map((x) => `<button role="tab" aria-selected="${x.c === c}" class="${x.c === c ? 'on' : ''}" data-act="lib" data-arg="states|c|${x.c}"><img src="flags/${x.c.toLowerCase()}.svg" alt="" width="20" height="15"> ${esc(x.name)}</button>`).join('')}</div>
    <div class="t-cap-bar"><span class="muted">${esc(C.note)}</span>
      <span class="row gap"><button class="btn primary" data-act="lib" data-arg="states|quiz">Quiz: capitals</button><button class="btn" data-act="lib" data-arg="states|find">Quiz: find it on the map</button></span></div>
    <div class="t-cap-wide">
      ${regionSVG(c, { key: 'st-' + c, tap: true, fill: sel ? { [sel.id]: 'hl' } : {}, pins, label: `Map of ${C.name}: tap a ${C.unit}, then type its capital` })}
      <div class="row gap center map-ctl"><button class="btn small" data-act="mapZoom" data-arg="st-${c}|in" aria-label="Zoom in">＋</button><button class="btn small" data-act="mapZoom" data-arg="st-${c}|out" aria-label="Zoom out">－</button><button class="btn small" data-act="mapZoom" data-arg="st-${c}|home" aria-label="Whole map">⟲</button><span class="muted small">Tap a ${esc(C.unit)} — or arrows and Enter — then type its capital.</span></div>
    </div>
    ${sel ? panel('states', askOf(sel, regs, C), st) : `<div class="card t-ask"><p class="muted">Tap a ${esc(C.unit)} on the map. You’ll be asked for its capital.</p></div>`}
    <details class="card"><summary><b>Every ${esc(C.unit)} of ${esc(C.name)}</b></summary><ul class="t-cap-list">${regs.map((s) => `<li><button class="linkish" data-act="lib" data-arg="states|sel|${s.id}">${esc(s.name)}</button> — ${esc(s.capFull)}</li>`).join('')}</ul></details>`;
}

export function capQuiz(c, r = rnd) {
  const regs = regionsOf(c).filter(fair);
  return shuffle(regs, r).slice(0, 10).map((s) => ({ ...mc(r, `What is the capital of ${s.name}?`, s.cap, regs.filter((x) => x !== s).map((x) => x.cap).filter((n) => n !== s.cap), `The capital of ${s.name} is ${s.capFull}.`) }));
}
export function findQuiz(c, r = rnd) {
  const regs = regionsOf(c).filter((s) => s.id !== 'US-DC' && !['IN-LD', 'IN-CH', 'IN-DL', 'IN-PY', 'IN-DH', 'AU-ACT'].includes(s.id));
  return shuffle(regs, r).slice(0, 10).map((s) => ({ ...mapQ(`Tap ${s.name} on the map.`, [s.id], null, `That’s ${s.name}. Its capital is ${s.capFull}.`, s.id), region: c, targetName: s.name }));
}

export function act(name, arg, ctx) {
  const c = ctx.ui.c || 'US', C = COUNTRY.find((x) => x.c === c);
  const choose = (id) => { if (ctx.ui.sel !== id) { ctx.ui.sel = id; ctx.ui.ask = {}; setTimeout(() => { const i = document.getElementById('t-states-ans'); if (i) i.focus({ preventScroll: true }); }, 30); } };
  if (name === 'c') { ctx.ui.c = arg; ctx.ui.sel = null; ctx.ui.ask = {}; }
  else if (name === 'sel') choose(arg);
  else if (name === 'tap') { const t = JSON.parse(arg); if (t.cc && regionsOf(c).some((s) => s.id === t.cc)) choose(t.cc); }
  else if (['check', 'four', 'pick', 'reveal'].includes(name) && ctx.ui.sel) {
    const regs = regionsOf(c), s = regs.find((x) => x.id === ctx.ui.sel), st = ctx.ui.ask || (ctx.ui.ask = {});
    const how = handle(name, arg, askOf(s, regs, C), st, name === 'check' ? ctx.ui.ans : null);
    if (how === 'typed') { ctx.tick(true, 2); ctx.sfx.good(); }
    else if (how === 'picked') { ctx.tick(true, 1); ctx.sfx.good(); }
    else if (!how && (name === 'check' || name === 'pick')) ctx.sfx.bad();
    if (how) ctx.ui.ans = '';
  }
  else if (name === 'quiz') ctx.startRun(`${C.name}: capitals`, capQuiz(c));
  else if (name === 'find') ctx.startRun(`${C.name}: find it`, findQuiz(c));
}
export function key(e, ctx) {
  const st = ctx.ui.ask || {};
  if (!ctx.ui.sel || ['right', 'picked', 'revealed'].includes(st.state)) return false;
  if (e.key === 'Enter' && e.target && e.target.id === 't-states-ans') { ctx.ui.ans = e.target.value; act('check', '', ctx); return true; }
  const n = parseInt(e.key, 10);
  if (st.opts && n >= 1 && n <= st.opts.length && !(e.target && e.target.tagName === 'INPUT')) { act('pick', st.opts[n - 1], ctx); return true; }
  return false;
}
export function done(run) {
  const right = run.results.filter((x) => x.right).length;
  return { stars: right >= 9 ? 3 : right >= 7 ? 2 : 1, lines: [] };
}
export function selftest(ok) {
  ok(regionsOf('US').length === 51, 'US: 50 states + DC');
  ok(regionsOf('IN').filter((s) => s.type === 'state').length === 28 && regionsOf('IN').filter((s) => s.type === 'ut').length === 8, 'India: 28 + 8');
  ok(regionsOf('CA').length === 13 && regionsOf('AU').length === 8, 'Canada 13, Australia 8');
  for (const c of ['US', 'IN', 'CA', 'AU']) {
    for (const q of capQuiz(c, seeded(c))) ok(q.opts.filter((o) => o === q.ans).length === 1 && !q.text.includes(q.ans), `${c}: ${q.text}`);
    for (const s of regionsOf(c)) ok(regionCap(c, s.id, s.at), `${c}: ${s.name} capital has a place on the map`);
  }
  ok(byCc.IN, 'India exists');
}
