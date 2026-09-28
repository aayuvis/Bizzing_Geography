/* Famous Landmarks — forty places the world knows, each a painted plate, a
   pin on the map, and a few checked sentences. Quiz: which country is it in,
   or tap it on the map. The shelf says, on screen, that it awaits a second
   reader — the Maths journeys' rule for anything written about the world. */
import { LANDMARKS, landmarkById, LANDMARK_NEEDS_REVIEW } from '../data/landmarks.js';
import { byCc, QUIZ, CONTINENTS } from '../geo.js';
import { worldSVG, viewOfCountry, nearCountry } from '../map.js';
import { mc, mapQ } from '../chapters/kit.js';
import { shuffle, rnd } from '../rand.js';

export const TOOL = { id: 'landmarks', name: 'Famous Landmarks', glyph: '🗿', art: 'lib-landmarks', blurb: 'The Taj Mahal, the Great Wall, Machu Picchu and more — where they are, and why they matter.' };
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
      <div class="card"><p class="kicker">${l.kind === 'natural' ? '🌿 Natural wonder' : '🏗️ Built by people'} · ${esc(l.where)}</p><h2>${esc(l.name)}</h2>
        <p class="lead">${esc(l.fact)}</p><p><b>${esc(l.when)}.</b></p>
        ${worldSVG({ key: 'lm-' + l.id, view: viewOfCountry(l.cc, 1.2), pins: [{ at: l.at, cls: 'red', r: 7, label: l.name }], fill: { [l.cc]: 'hl', ...(l.also ? { [l.also]: 'hl2' } : {}) }, label: `Where ${l.name} is` })}
        <details class="src"><summary>Where this is checked</summary><ul>${l.src.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></details>
        ${note}
      </div></div>`;
  }
  return `${note}<div class="row gap center wrap"><button class="btn primary" data-act="lib" data-arg="landmarks|quiz">Quiz: which country?</button><button class="btn" data-act="lib" data-arg="landmarks|find">Quiz: find it on the map</button></div>
    <div class="t-lm-grid">${LANDMARKS.map((x) => `<button class="t-lm-tile${seen[x.id] ? ' seen' : ''}" data-act="lib" data-arg="landmarks|sel|${x.id}">
      <img src="art/lm-${x.id}.webp" alt="" loading="lazy" width="960" height="720"><span><b>${esc(x.name)}</b><i>${esc(byCc[x.cc].name)}</i></span></button>`).join('')}</div>`;
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
  if (name === 'sel') { ctx.ui.sel = arg || null; if (arg) { ctx.data.seen = ctx.data.seen || {}; ctx.data.seen[arg] = true; ctx.save(); } }
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
}
