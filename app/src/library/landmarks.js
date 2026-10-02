/* Famous Landmarks — 130+ places the world knows, each a painted plate, a
   pin on the map, and a few checked sentences. Browse by continent, natural
   or built, search, or tap a country on the map to see its landmarks. Quiz:
   which country is it in, or tap it on the map. The shelf says, on screen, that it awaits a second
   reader — the Maths journeys' rule for anything written about the world. */
import { ico } from '../icons.js';
import { LANDMARKS, landmarkById, LANDMARK_NEEDS_REVIEW } from '../data/landmarks.js';
import { byCc, QUIZ, CONTINENTS } from '../geo.js';
import { worldSVG, viewOfCountry, nearCountry, viewFor } from '../map.js';
import { mc, mapQ } from '../chapters/kit.js';
import { shuffle, rnd } from '../rand.js';

export const TOOL = { id: 'landmarks', name: 'Famous Landmarks', glyph: '🗿', art: 'lib-landmarks', blurb: `${LANDMARKS.length} landmarks — the Taj Mahal, the Great Wall, Machu Picchu, the Serengeti… — where they are, and why they matter.` };
const CONTS = ['All', ...CONTINENTS.filter((c) => c.id !== 'Antarctica').map((c) => c.id)];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function view(ctx) {
  const u = ctx.ui, seen = ctx.data.seen || {};
  const l = u.sel ? landmarkById[u.sel] : null;
  const note = LANDMARK_NEEDS_REVIEW ? '<p class="t-review">✎ These facts name their sources and are awaiting a second reader.</p>' : '';
  if (l) {
    const c = byCc[l.cc];
    return `<div class="t-lm-one">
      <button class="back" data-act="lib" data-arg="landmarks|sel|"><span aria-hidden="true">←</span> All landmarks</button>
      <figure class="t-lm-fig"><img src="art/lm-${l.id}.webp" alt="A painting of ${esc(l.name)}" width="960" height="720"><figcaption>A painting, made with an AI image model — not a photograph.</figcaption></figure>
      <div class="card"><p class="kicker">${l.kind === 'natural' ? ico('leaf') + ' Natural wonder' : ico('city') + ' Built by people'} · ${esc(l.where)}</p><h2>${esc(l.name)}</h2>
        <p class="lead">${esc(l.fact)}</p><p><b>${esc(l.when)}.</b></p>
        ${worldSVG({ key: 'lm-' + l.id, view: viewOfCountry(l.cc, 1.2), pins: [{ at: l.at, cls: 'red', r: 7, label: l.name }], fill: { [l.cc]: 'hl', ...(l.also ? { [l.also]: 'hl2' } : {}) }, label: `Where ${l.name} is` })}
        <details class="src"><summary>Where this is checked</summary><ul>${l.src.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></details>
        ${note}
      </div></div>`;
  }
  const q = (u.q || '').trim().toLowerCase(), cont = u.cont || 'All', kind = u.kind || '', cc = u.cc || '';
  const list = LANDMARKS.filter((x) => (cont === 'All' || byCc[x.cc].cont === cont) && (!kind || x.kind === kind) && (!cc || x.cc === cc || x.also === cc)
    && (!q || [x.name, x.where, byCc[x.cc].name, x.fact].some((t) => t.toLowerCase().includes(q))));
  const pins = list.map((x) => ({ at: x.at, cls: seen[x.id] ? 'known' : 'cap', r: 4 }));
  const view = cont === 'All' ? null : viewFor(CONTINENTS.find((c) => c.id === cont).view);
  const nSeen = LANDMARKS.filter((x) => seen[x.id]).length;
  return `<div class="t-cap-bar"><span><b class="t-cap-n">${nSeen}</b> <span class="muted">of ${LANDMARKS.length} landmarks explored</span></span>
      <span class="row gap"><button class="btn primary" data-act="lib" data-arg="landmarks|quiz">Quiz: which country?</button><button class="btn" data-act="lib" data-arg="landmarks|find">Quiz: find it on the map</button></span></div>
    <div class="seg" role="tablist" aria-label="Continent">${CONTS.map((c) => `<button role="tab" aria-selected="${c === cont}" class="${c === cont ? 'on' : ''}" data-act="lib" data-arg="landmarks|cont|${c}">${esc(c)}</button>`).join('')}</div>
    <div class="row gap wrap t-ex-bar">
      <input id="t-landmarks-q" class="inp" data-lib-input="q" value="${esc(u.q || '')}" placeholder="Search landmarks…" aria-label="Search landmarks" autocomplete="off">
      ${[['', 'All'], ['built', ico('city') + ' Built by people'], ['natural', ico('leaf') + ' Natural wonders']].map(([k, n]) => `<button class="chip-btn small${kind === k ? ' on' : ''}" aria-pressed="${kind === k}" data-act="lib" data-arg="landmarks|kind|${k}">${n}</button>`).join('')}
      ${cc ? `<button class="chip-btn small on" data-act="lib" data-arg="landmarks|cc|">${esc(byCc[cc].name)} ✕</button>` : ''}
    </div>
    ${worldSVG({ key: 'lm-all-' + cont, tap: true, view, pins, fill: cc ? { [cc]: 'hl' } : {}, label: 'Landmarks on the map: tap a country to see its landmarks' })}
    <p class="muted small center-t">Each dot is a landmark (green once you have opened it). Tap a country to see only its landmarks.</p>
    <p class="muted small">${list.length} landmark${list.length === 1 ? '' : 's'}</p>
    <div class="t-lm-grid">${list.map((x) => `<button class="t-lm-tile${seen[x.id] ? ' seen' : ''}" data-act="lib" data-arg="landmarks|sel|${x.id}">
      <img src="art/lm-${x.id}.webp" alt="" loading="lazy" width="960" height="720"><span><b>${esc(x.name)}</b><i>${esc(byCc[x.cc].name)} · ${x.kind === 'natural' ? ico('leaf') : ico('city')}</i></span></button>`).join('')}
      ${list.length ? '' : '<p class="muted">No landmarks match — try another filter.</p>'}</div>
    ${note}`;
}

export function countryQuiz(r = rnd) {
  return shuffle(LANDMARKS, r).slice(0, 10).map((l) => {
    const c = byCc[l.cc], near = QUIZ.filter((x) => x.cont === c.cont && x.cc !== l.cc && x.cc !== l.also);
    return { ...mc(r, 'In which country is this landmark?', c.name, near.map((x) => x.name), `This is ${l.name}, in ${l.where}.`, `<img class="t-lm-q" src="art/lm-${l.id}.webp" alt="A painted landmark" width="480" height="360">`), lm: l.id };
  });
}
export function findQuiz(r = rnd) {
  return shuffle(LANDMARKS, r).slice(0, 10).map((l) => {
    const cont = CONTINENTS.find((x) => x.id === byCc[l.cc].cont);
    return { ...mapQ(`Tap the country where ${l.name} is.`, [l.cc, l.also].filter(Boolean), cont.view, `${l.name} is in ${l.where}.`, l.cc), targetName: byCc[l.cc].name, showAt: l.at, lm: l.id };
  });
}
export function act(name, arg, ctx) {
  if (name === 'cont') { ctx.ui.cont = arg; ctx.ui.cc = ''; }
  else if (name === 'kind') ctx.ui.kind = arg;
  else if (name === 'cc') ctx.ui.cc = arg;
  else if (name === 'tap') { const t = JSON.parse(arg); if (t.cc && !ctx.ui.sel) ctx.ui.cc = LANDMARKS.some((x) => x.cc === t.cc || x.also === t.cc) ? t.cc : ''; if (t.cc && !ctx.ui.cc) ctx.toast('No landmarks there yet.'); }
  else if (name === 'sel') { ctx.ui.sel = arg || null; if (arg) { ctx.data.seen = ctx.data.seen || {}; ctx.data.seen[arg] = true; ctx.save(); } }
  else if (name === 'quiz') ctx.startRun('Landmarks: which country?', countryQuiz());
  else if (name === 'find') ctx.startRun('Landmarks: find it', findQuiz());
}
export function done(run) { const right = run.results.filter((x) => x.right).length; return { stars: right >= 9 ? 3 : right >= 7 ? 2 : 1, lines: [] }; }
export function selftest(ok) {
  for (const l of LANDMARKS) {
    ok(byCc[l.cc], `${l.id}: country ${l.cc}`);
    ok(nearCountry(l.at, l.cc, l.offshore ? 150 : 25) || (l.also && nearCountry(l.at, l.also)), `${l.name} sits inside ${l.cc}${l.also ? ' or ' + l.also : ''} on the map`);
    ok(l.src && l.src.length, `${l.name} names a source`);
  }
  ok(new Set(LANDMARKS.map((l) => l.id)).size === LANDMARKS.length, 'ids are unique');
  ok(LANDMARKS.length >= 120, `at least 120 landmarks (${LANDMARKS.length})`);
  for (const c of ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania']) ok(LANDMARKS.filter((l) => byCc[l.cc].cont === c).length >= 8, `${c} has at least 8 landmarks`);
}
