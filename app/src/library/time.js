/* Earth Through Time — how the planet changed, and how our maps of it
   changed. Two roads, one slider each. A plate is a painting of what a place
   might have LOOKED like, never a map of old coastlines (a model cannot draw
   Pangaea correctly, and a wrong map would teach the error). */
import { EARTH, MAPS, ERAS_NEED_REVIEW } from '../data/eras.js';
import { mc } from '../chapters/kit.js';
import { shuffle, rnd } from '../rand.js';

export const TOOL = { id: 'time', name: 'Earth Through Time', glyph: '⏳', art: 'lib-time', blurb: 'From a molten young planet to Pangaea to today — and from clay-tablet maps to satellites.' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const TRACKS = { earth: { name: 'The Earth', list: EARTH }, maps: { name: 'Our maps', list: MAPS } };

export function view(ctx) {
  const u = ctx.ui, t = u.t || 'earth', T = TRACKS[t], i = Math.min(u.i || 0, T.list.length - 1), e = T.list[i];
  return `<div class="seg" role="tablist" aria-label="Which story">${Object.entries(TRACKS).map(([k, x]) => `<button role="tab" aria-selected="${k === t}" class="${k === t ? 'on' : ''}" data-act="lib" data-arg="time|t|${k}">${esc(x.name)}</button>`).join('')}</div>
    <div class="t-time-rail" role="group" aria-label="Timeline">
      <button class="btn small" data-act="lib" data-arg="time|step|-1" ${i ? '' : 'disabled'} aria-label="Earlier">←</button>
      <input type="range" min="0" max="${T.list.length - 1}" value="${i}" data-lib-range="time" aria-label="Move through time" aria-valuetext="${esc(e.when)}">
      <button class="btn small" data-act="lib" data-arg="time|step|1" ${i < T.list.length - 1 ? '' : 'disabled'} aria-label="Later">→</button>
    </div>
    <ol class="t-time-ticks">${T.list.map((x, j) => `<li class="${j === i ? 'on' : j < i ? 'past' : ''}"><button data-act="lib" data-arg="time|i|${j}" aria-label="${esc(x.when)}: ${esc(x.title)}">${j + 1}</button></li>`).join('')}</ol>
    <div class="t-time-card card">
      ${t === 'earth' ? `<figure><img src="art/era-${e.id.slice(2)}.webp" alt="A painting imagining ${esc(e.title.toLowerCase())}" width="1280" height="720"><figcaption>An artist’s impression, made with an AI image model — not a map.</figcaption></figure>` : ''}
      <p class="kicker">${esc(e.when)}</p><h2>${esc(e.title)}</h2><p class="lead">${esc(e.body)}</p>${e.look ? `<p class="why-line">${esc(e.look)}</p>` : ''}
      <details class="src"><summary>Where this is checked</summary><ul>${e.src.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></details>
      ${ERAS_NEED_REVIEW ? '<p class="t-review">✎ Awaiting a second reader. Dates this old are scientists’ best estimates, and they get revised.</p>' : ''}
    </div>
    <div class="row center"><button class="btn primary" data-act="lib" data-arg="time|quiz">Quiz: which came first?</button></div>`;
}
/* "Which came first?" — pairs far enough apart that the order is not in doubt */
export function orderQuiz(r = rnd) {
  const all = [...EARTH, ...MAPS], out = [];
  for (let t = 0; out.length < 10 && t < 400; t++) {
    const [a, b] = shuffle(all, r).slice(0, 2);
    if (a.ago === b.ago || Math.max(a.ago, b.ago) / Math.max(1, Math.min(a.ago, b.ago)) < 1.5) continue;
    const first = a.ago > b.ago ? a : b;
    const text = `Which came first: “${a.title}” or “${b.title}”?`;
    if (out.some((q) => q.text === text)) continue;
    out.push({ ...mc(r, 'Which came first?', first.title, [a.title, b.title].filter((x) => x !== first.title), `${first.title}: ${first.when}. ${(first === a ? b : a).title}: ${(first === a ? b : a).when}.`), text: 'Which came first?', html: '' });
  }
  return out;
}
export function act(name, arg, ctx) {
  const T = TRACKS[ctx.ui.t || 'earth'];
  if (name === 't') { ctx.ui.t = arg; ctx.ui.i = 0; }
  else if (name === 'i') ctx.ui.i = +arg;
  else if (name === 'step') ctx.ui.i = Math.max(0, Math.min(T.list.length - 1, (ctx.ui.i || 0) + +arg));
  else if (name === 'range') ctx.ui.i = +arg;
  else if (name === 'quiz') ctx.startRun('Earth Through Time', orderQuiz());
}
export function key(e, ctx) {
  if (e.key === 'ArrowRight') { act('step', '1', ctx); return true; }
  if (e.key === 'ArrowLeft') { act('step', '-1', ctx); return true; }
  return false;
}
export function done(run) { const right = run.results.filter((x) => x.right).length; return { stars: right >= 9 ? 3 : right >= 7 ? 2 : 1, lines: [] }; }
export function selftest(ok) {
  for (const L of [EARTH, MAPS]) for (let i = 1; i < L.length; i++) ok(L[i].ago < L[i - 1].ago, `${L[i].id} comes after ${L[i - 1].id}`);
  for (const e of [...EARTH, ...MAPS]) ok(e.src && e.src.length, `${e.id} names a source`);
  const q = orderQuiz();
  ok(q.length === 10 && q.every((x) => x.opts.length === 2 && x.opts.includes(x.ans)), 'order quiz: ten two-way questions');
}
