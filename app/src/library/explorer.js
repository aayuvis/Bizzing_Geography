/* Map Explorer — the whole world to wander. Tap any country (or find it by
   name) for its flag, capital, continent, size, neighbours and hemispheres.
   Switch on the Equator, the Tropics and the Prime Meridian. Everything shown
   is read from the data; nothing is typed here. */
import { COUNTRIES, QUIZ, byCc, capsText, fmtArea, fmtLat, fmtLng, hemiNS, hemiEW } from '../geo.js';
import { worldSVG, viewOfCountry, shapeName } from '../map.js';
import { nbrs } from '../chapters/capitals.js';
import { ico } from '../icons.js';

export const TOOL = { id: 'explorer', name: 'Map Explorer', glyph: '🔎', art: 'lib-explorer', blurb: 'Tap anywhere on the world map: flag, capital, neighbours, size — and the lines that circle the globe.' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LINES = [['equator', 'Equator'], ['cancer', 'Tropic of Cancer'], ['capricorn', 'Tropic of Capricorn'], ['arctic', 'Arctic Circle'], ['antarctic', 'Antarctic Circle'], ['prime', 'Prime Meridian']];

export function view(ctx) {
  const u = ctx.ui, lines = u.lines || [], sel = u.sel ? byCc[u.sel] : null;
  const q = (u.q || '').trim().toLowerCase();
  const hits = q.length >= 2 ? COUNTRIES.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8) : [];
  const fill = sel ? { [sel.cc]: 'hl', ...Object.fromEntries(nbrs(sel).map((b) => [b, 'hl2'])) } : u.sel ? { [u.sel]: 'hl' } : {};
  return `<div class="row gap wrap t-ex-bar">
      <input id="t-explorer-q" class="inp" data-lib-input="q" value="${esc(u.q || '')}" placeholder="Find a country…" aria-label="Find a country" autocomplete="off">
      ${LINES.map(([k, n]) => `<button class="chip-btn small${lines.includes(k) ? ' on' : ''}" aria-pressed="${lines.includes(k)}" data-act="lib" data-arg="explorer|line|${k}">${esc(n)}</button>`).join('')}
    </div>
    ${hits.length ? `<div class="row gap wrap">${hits.map((c) => `<button class="btn small" data-act="lib" data-arg="explorer|sel|${c.cc}">${esc(c.name)}</button>`).join('')}</div>` : ''}
    <div class="t-cap">
      <div>${worldSVG({ key: 'ex', tap: true, lines, fill, view: sel && u.zoom ? viewOfCountry(sel.cc, 1) : null, pins: [...(sel && sel.capAt[0] ? [{ at: sel.capAt[0], cls: 'red', r: 5, label: sel.cap[0] }] : []), ...(u.pin && u.pin.cc === u.sel ? [{ at: u.pin.at, cls: 'good', r: 6, label: u.pin.n }] : [])], label: 'World map' })}</div>
      <div class="card t-cap-side">${sel ? card(sel, u) : u.sel ? `<h3>${esc(shapeName(u.sel))}</h3><p class="muted">Not one of the 195 countries the app quizzes — a territory or area with its own shape on the map.</p>` : '<p class="muted">Tap any country. Its neighbours light up too.</p>'}</div>
    </div>`;
}
function card(c, u) {
  const at = c.capAt[0];
  return `<div class="t-cap-sel"><img src="flags/${c.cc.toLowerCase()}.svg" alt="" width="72" height="54"><div><p class="kicker">${esc(c.cont)} · ${esc(c.sub)}</p><h3>${esc(c.name)}</h3></div></div>
    ${u.pin && u.pin.cc === c.cc && !c.cap.includes(u.pin.n) ? `<p class="t-ex-pin">${ico('pin')} <b>${esc(u.pin.n)}</b> — a city in ${esc(c.name)}, at ${fmtLat(u.pin.at[0])}, ${fmtLng(u.pin.at[1])}.</p>` : ''}
    <dl class="t-ex-dl">
      <dt>Capital</dt><dd>${esc(capsText(c))}${at ? ` <span class="muted small">(${fmtLat(at[0])}, ${fmtLng(at[1])})</span>` : ''}</dd>
      <dt>Area</dt><dd>${fmtArea(c.area)} — ${QUIZ.slice().sort((a, b) => b.area - a.area).indexOf(c) + 1}${ord(QUIZ.slice().sort((a, b) => b.area - a.area).indexOf(c) + 1)} largest</dd>
      <dt>Coast</dt><dd>${c.landlocked ? 'None — landlocked' : 'Yes'}</dd>
      <dt>Neighbours</dt><dd>${nbrs(c).length ? nbrs(c).map((b) => `<button class="linkish" data-act="lib" data-arg="explorer|sel|${b}">${esc(byCc[b].name)}</button>`).join(', ') : 'None by land'}</dd>
      ${at ? `<dt>Hemispheres</dt><dd>${hemiNS(at[0])} and ${hemiEW(at[1])} (by the capital)</dd>` : ''}
    </dl>
    ${c.capNote ? `<p class="muted small">${esc(c.capNote)}</p>` : ''}
    <button class="btn small" data-act="lib" data-arg="explorer|zoom">${u.zoom ? 'Whole world' : 'Zoom to ' + esc(c.name)}</button>`;
}
const ord = (n) => (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');

export function act(name, arg, ctx) {
  const u = ctx.ui;
  if (name === 'sel') { u.sel = arg; u.q = ''; u.pin = null; }
  else if (name === 'place') { const p = JSON.parse(arg); u.sel = p.cc; u.pin = p; u.zoom = true; u.q = ''; }
  else if (name === 'tap') { const t = JSON.parse(arg); if (t.cc) { u.sel = t.cc; u.pin = null; } }
  else if (name === 'zoom') u.zoom = !u.zoom;
  else if (name === 'line') { u.lines = u.lines || []; u.lines = u.lines.includes(arg) ? u.lines.filter((x) => x !== arg) : [...u.lines, arg]; }
}
export function key(e, ctx) {
  if (e.key === 'Enter' && ctx.ui.q) { const c = COUNTRIES.find((x) => x.name.toLowerCase().includes(ctx.ui.q.trim().toLowerCase())); if (c) { act('sel', c.cc, ctx); return true; } }
  return false;
}
export function selftest(ok) {
  ok(ord(1) === 'st' && ord(2) === 'nd' && ord(11) === 'th' && ord(23) === 'rd', 'ordinals');
  ok(byCc.IN && nbrs(byCc.IN).includes('NP'), 'India borders Nepal');
}
