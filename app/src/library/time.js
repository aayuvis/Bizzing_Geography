/* Earth Through Time — three kinds of road.
     🌍 The Earth: planet formation to today, with a one-day clock.
     🗺️ Our maps: how people drew the world.
     One road per continent, from about 5000 BCE (earlier where its story
     starts earlier) to today — Bizzing India's Itihaas is the model: a river
     of ages, each with a hook, the story, step-by-step moments, places you can
     still stand in, and how we know.

   Empires are SOFT ZONES OF INFLUENCE on the real map — blurred, never a
   line; modern borders appear only in each continent's last age. A plate is
   a painting of a place, never a map of old coastlines or old borders. Hard
   moments (`hard`) show from the 11–14 band, and the age says there is more. */
import { EARTH, MAPS, ERAS_NEED_REVIEW } from '../data/eras.js';
import { CONTINENT_HISTORY, HISTORY_NEEDS_REVIEW } from '../data/history.js';
import { CONTINENTS } from '../geo.js';
import { worldSVG, viewFor, countryAt } from '../map.js';
import { mc } from '../chapters/kit.js';
import { shuffle, rnd } from '../rand.js';

export const TOOL = { id: 'time', name: 'Earth Through Time', glyph: '⏳', art: 'lib-time', blurb: 'From a molten young planet to today — and the story of every continent since the first farmers: civilisations, empires and great events.' };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* each continent's ages in time order, "today" always last */
const HIST = Object.fromEntries(Object.entries(CONTINENT_HISTORY).map(([k, v]) => [k, [...v].sort((a, b) => (a.today - b.today) || a.y - b.y)]));
const CONT = Object.fromEntries(CONTINENTS.map((c) => [c.id, c]));
const TRACKS = {
  earth: { name: '🌍 The Earth', list: EARTH },
  maps: { name: '🗺️ Our maps', list: MAPS },
  ...Object.fromEntries(Object.keys(HIST).map((k) => [k, { name: `${CONT[k].glyph} ${k}`, list: HIST[k], cont: k }])),
};
/* the map frame per continent: Oceania's story spans the Pacific, so its map is centred there */
const FRAME = Object.fromEntries(CONTINENTS.map((c) => [c.id, { box: c.view, rot: 0 }]));
FRAME.Oceania = { box: [110, -50, 255, 28], rot: 170 };
const inBox = ([lat, lng], [w, s, e, n], pad = 12) => { const L = lng < w - pad ? lng + 360 : lng; return lat >= s - pad && lat <= n + pad && L >= w - pad && L <= e + pad; };
const trackOf = (ui) => TRACKS[ui.t] || TRACKS.earth;
const isOlder = (band) => band === '11-14';

/* If Earth's whole history were squeezed into one day, what time would it be? */
export function clock(ago) {
  const s = Math.round(86400 * (1 - ago / 4.54e9));
  if (s >= 86400) return 'midnight — right now';
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const t = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}${h === 23 && m === 59 ? ':' + String(sec).padStart(2, '0') : ''}`;
  return t;
}

/* The year as the sources give it, for a quiz explanation */
const yearWords = (y) => (y < 0 ? `about ${(-y).toLocaleString('en')} BCE` : `about ${y} CE`);

export function view(ctx) {
  const u = ctx.ui, T = trackOf(u), i = Math.min(u.i || 0, T.list.length - 1), e = T.list[i];
  const tabs = `<div class="seg t-time-tabs" role="tablist" aria-label="Which story">${Object.entries(TRACKS).map(([k, x]) => `<button role="tab" aria-selected="${x === T}" class="${x === T ? 'on' : ''}" data-act="lib" data-arg="time|t|${esc(k)}">${esc(x.name)}</button>`).join('')}</div>`;
  return tabs + (T.cont ? continentCard(ctx, T, e, i) : earthCard(T, e, i));
}

/* THE STAGE: the painting IS the page. The step's when, title and story sit on the
   picture in a readable panel; ‹ › ride its edges; a thin row of dots along the top is
   the timeline (each one a button). The slider and the eighteen numbered buttons that
   stood above the picture are gone — they took a screenful and said less. ← → still step,
   and on a touch screen a swipe across the picture does too. On a desktop the painting
   and its card sit side by side so a step fits one screen; on a phone the words sit
   right under the picture as one panel, so nothing is clipped. */
function stage(T, i, img, alt, cap, overlay) {
  const n = T.list.length;
  return `<div class="t-stage${img ? '' : ' noimg'}" data-swipe="time">
    ${img ? `<img src="${img}" alt="${esc(alt)}" width="1280" height="720">` : ''}
    <ol class="t-dots" aria-label="Timeline">${T.list.map((x, j) => `<li><button class="${j === i ? 'on' : j < i ? 'past' : ''}" data-act="lib" data-arg="time|i|${j}" aria-label="${esc(x.when)}: ${esc(x.title)}" title="${esc(x.title)}"></button></li>`).join('')}</ol>
    <button class="t-nav prev" data-act="lib" data-arg="time|step|-1" ${i ? '' : 'disabled'} aria-label="Earlier">‹</button>
    <button class="t-nav next" data-act="lib" data-arg="time|step|1" ${i < n - 1 ? '' : 'disabled'} aria-label="Later">›</button>
    <div class="t-ov" id="t-ov"><button class="read-btn t-ov-read" data-act="read" data-arg="#t-ov h2, #t-ov p" aria-label="Read this to me" title="Read this to me">🔊</button>${overlay}</div>
    ${cap ? `<span class="t-credit">${cap}</span>` : ''}
  </div>`;
}

function earthCard(T, e, i) {
  const earth = T.list === EARTH;
  return `<div class="t-split">${stage(T, i, earth ? `art/era-${e.id.slice(2)}.webp` : '', `A painting imagining ${e.title.toLowerCase()}`, earth ? 'An artist’s impression — not a map' : '',
      `<p class="kicker">${esc(e.when)} · ${i + 1} of ${T.list.length}</p><h2>${esc(e.title)}</h2><p>${esc(e.body)}</p>`)}
    <div class="card t-more">
      ${e.look ? `<p class="why-line">${esc(e.look)}</p>` : ''}
      ${earth ? `<p class="t-clock"><span aria-hidden="true">🕛</span> If all of Earth’s history were <b>one day</b>, this would be at <b>${clock(e.ago)}</b>.${e.ago && e.ago < 1e6 ? ' People arrive in the last few seconds before midnight.' : ''}</p>` : ''}
      <div class="row gap wrap"><button class="btn primary" data-act="lib" data-arg="time|quiz">Quiz: which came first?</button></div>
      <details class="src"><summary>Where this is checked</summary><ul>${e.src.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></details>
      ${ERAS_NEED_REVIEW ? '<p class="t-review">✎ Awaiting a second reader. Dates this old are scientists’ best estimates, and they get revised.</p>' : ''}
    </div></div>`;
}

function continentCard(ctx, T, e, i) {
  const u = ctx.ui, older = isOlder(ctx.band);
  const site = e.sites[u.site ?? -1];
  const zones = e.zones.map(([lat, lng, km, name]) => ({ at: [lat, lng], km, name }));
  const pins = e.sites.map(([name, lat, lng], j) => ({ at: [lat, lng], cls: j === u.site ? 'red' : 'site', r: j === u.site ? 7 : 5, label: j === u.site ? name : '' }));
  const moments = e.moments.filter((m) => older || !m.hard), hidden = e.moments.length - moments.length;
  return `<div class="t-split">${stage(T, i, `art/hist-${e.id}.webp`, `A painting imagining a place in the age of ${e.title.toLowerCase()}`, 'An artist’s impression of a place — not a map',
      `<p class="kicker">${esc(T.cont)} · ${esc(e.when)} · ${i + 1} of ${T.list.length}</p><h2>${esc(e.title)}</h2><p>${esc(e.hook)}</p>
       <details class="t-read"><summary>Read the story</summary><p>${esc(e.kid)}</p></details>`)}
    <div class="card t-hist">
      ${worldSVG({ key: 'hist-' + T.cont.replace(/\s/g, ''), tap: true, view: viewFor(FRAME[T.cont].box, 0.06, FRAME[T.cont].rot), rot: FRAME[T.cont].rot, zones, pins, borders: !!e.today, grat: false, label: `${T.cont}, ${e.when}: ${e.zones.map((z) => z[3]).join(', ') || 'the countries of today'}` })}
      <p class="muted small center-t" title="${e.today ? 'Today’s countries, drawn the one way this app draws them everywhere.' : !e.zones.length ? 'In this age the map was a tangle of empires, colonies and changing lines — too tangled for soft colours.' : 'Soft colours show where a people or an empire held sway. Their edges faded, moved and were argued over, so they are not borders.'}">${e.today ? 'Today’s countries.' : !e.zones.length ? 'Too tangled for soft colours — the dots are places to visit.' : 'Soft colours, not borders — today’s borders did not exist yet.'} Tap a dot to visit.</p>
      ${site ? `<p class="t-hist-site" role="status"><b>📍 ${esc(site[0])}</b> — ${esc(site[3])}</p>` : ''}
      ${e.sites.length ? `<div class="row gap wrap t-hist-sites" aria-label="Places you can still visit">${e.sites.map((s, j) => `<button class="chip-btn small${j === u.site ? ' on' : ''}" aria-pressed="${j === u.site}" data-act="lib" data-arg="time|site|${j}">📍 ${esc(s[0])}</button>`).join('')}</div>` : ''}
      <details class="t-acc" open><summary><h3>What happened</h3></summary>
        <ol class="t-hist-moments">${moments.map((m) => `<li><b>${esc(m.when)}</b> — ${esc(m.what)}</li>`).join('')}</ol>
        ${hidden ? `<p class="muted small">There is more to this age — some of it hard — for older explorers (11–14).</p>` : ''}</details>
      <div class="row gap wrap"><button class="btn primary" data-act="lib" data-arg="time|quiz">Quiz: which came first?</button><button class="btn" data-act="lib" data-arg="time|where">Quiz: which continent?</button></div>
      ${T.cont === 'Asia' ? '<p class="muted small">India’s own story, age by age, is told in depth in Bizzing India’s Itihaas.</p>' : ''}
      <details class="src"><summary>Where this is checked</summary><ul>${e.src.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></details>
      ${HISTORY_NEEDS_REVIEW ? '<p class="t-review">✎ Awaiting a second reader. Dates are approximate, and historians still discuss many of them.</p>' : ''}
    </div></div>`;
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
    out.push({ ...mc(r, 'Which came first?', first.title, [a.title, b.title].filter((x) => x !== first.title), `${first.title}: ${first.when}. ${(first === a ? b : a).title}: ${(first === a ? b : a).when}.`), text });
  }
  return out.map((q) => ({ ...q, text: 'Which came first?' }));
}
/* The same inside one continent: ages whose middles are at least 400 years apart */
export function histOrderQuiz(cont, r = rnd) {
  const L = HIST[cont], out = [];
  for (let t = 0; out.length < 8 && t < 400; t++) {
    const [a, b] = shuffle(L, r).slice(0, 2);
    if (Math.abs(a.y - b.y) < 400) continue;
    const first = a.y < b.y ? a : b, second = first === a ? b : a;
    const text = `${cont}: which came first?`;
    if (out.some((q) => q.opts.includes(a.title) && q.opts.includes(b.title))) continue;
    out.push(mc(r, text, first.title, [second.title], `${first.title}: ${first.when}. ${second.title}: ${second.when}.`));
  }
  return out;
}
/* "Which continent?" — from an age's hook, never from text that names a continent */
/* hooks that fit more than one continent — farming, first cities, colonial trade,
   world wars — are never asked: a question with two right answers is not fair */
const SHARED = new Set(['a-farming', 'a-cities', 'a-colonial', 's-colonial', 'e-wars', 'e-industry', 'o-lapita']);
const CONT_WORDS = /\b(asia|asian|africa|african|europe|european|america|american|americas|oceania|australia|pacific)\b/i;
export function whereQuiz(r = rnd) {
  const all = Object.entries(HIST).flatMap(([c, L]) => L.filter((e) => !e.today && !SHARED.has(e.id) && !CONT_WORDS.test(e.hook) && !CONT_WORDS.test(e.title)).map((e) => ({ c, e })));
  return shuffle(all, r).slice(0, 10).map(({ c, e }) => mc(r, `“${e.hook}” — on which continent?`, c, Object.keys(HIST), `${e.title} (${e.when}) is part of ${c}’s story.`));
}

export function act(name, arg, ctx) {
  const T = trackOf(ctx.ui), u = ctx.ui;
  const go = (i) => { u.i = Math.max(0, Math.min(T.list.length - 1, i)); u.site = null; };
  if (name === 't') { u.t = arg; u.i = 0; u.site = null; }
  else if (name === 'i' || name === 'range') go(+arg);
  else if (name === 'step') go((u.i || 0) + +arg);
  else if (name === 'site') u.site = u.site === +arg ? null : +arg;
  else if (name === 'tap' && T.cont) {
    const t = JSON.parse(arg), e = T.list[Math.min(u.i || 0, T.list.length - 1)];
    const km = (a, b) => Math.hypot(a[0] - b[0], (a[1] - b[1]) * Math.cos((a[0] * Math.PI) / 180)) * 111;
    let best = -1, bd = 400;
    e.sites.forEach((s, j) => { const d = km([t.lat, t.lng], [s[1], s[2]]); if (d < bd) { bd = d; best = j; } });
    if (best >= 0) u.site = best;
    else {
      const z = e.zones.find((z) => km([t.lat, t.lng], [z[0], z[1]]) <= z[2]);
      if (z) ctx.toast(`${z[3]} — about here.`);
      else if (e.today && t.cc) ctx.toast('A country of today — the Capitals tool knows its capital.');
    }
  }
  else if (name === 'quiz') {
    if (T.cont) ctx.startRun(`${T.cont} through time`, histOrderQuiz(T.cont));
    else ctx.startRun('Earth Through Time', orderQuiz());
  }
  else if (name === 'where') ctx.startRun('Which continent?', whereQuiz());
}
export function key(e, ctx) {
  if (e.target && e.target.closest && e.target.closest('.gmap')) return false;   // the map's arrows move its cross
  if (e.key === 'ArrowRight') { act('step', '1', ctx); return true; }
  if (e.key === 'ArrowLeft') { act('step', '-1', ctx); return true; }
  return false;
}
export function done(run) { const n = run.results.length, right = run.results.filter((x) => x.right).length; return { stars: right >= n * 0.9 ? 3 : right >= n * 0.7 ? 2 : 1, lines: [] }; }

/* islands smaller than the map can draw (Rapa Nui is 164 km²) — named, not hidden */
const TINY = new Set(['Rapa Nui']);
/* a coastal site may sit just offshore of the simplified coast */
const onLand = (at) => { if (countryAt(at)) return true; for (let a = 0; a < 360; a += 30) for (const km of [10, 20, 30]) { const d = km / 111; if (countryAt([at[0] + d * Math.cos(a * Math.PI / 180), at[1] + d * Math.sin(a * Math.PI / 180) / Math.cos(at[0] * Math.PI / 180)])) return true; } return false; };
export function selftest(ok) {
  for (const L of [EARTH, MAPS]) for (let i = 1; i < L.length; i++) ok(L[i].ago < L[i - 1].ago, `${L[i].id} comes after ${L[i - 1].id}`);
  for (const e of [...EARTH, ...MAPS]) ok(e.src && e.src.length, `${e.id} names a source`);
  ok(EARTH.length >= 16, `the Earth road has at least 16 steps (${EARTH.length})`);
  ok(EARTH[0].ago >= 4.5e9 && EARTH.at(-1).ago === 0, 'the Earth road runs from the planet forming to today');
  ok(clock(0) === 'midnight — right now' && clock(4.54e9) === '00:00' && clock(3e5).startsWith('23:59:'), 'the one-day clock puts people in the last seconds');
  const q = orderQuiz();
  ok(q.length === 10 && q.every((x) => x.opts.length === 2 && x.opts.includes(x.ans)), 'order quiz: ten two-way questions');

  const ids = new Set();
  for (const [c, L] of Object.entries(HIST)) {
    ok(CONT[c], `${c} is a continent`);
    ok(L.length >= 7, `${c} has at least 7 ages (${L.length})`);
    ok(L.at(-1).today && L.filter((e) => e.today).length === 1, `${c} ends in exactly one “today”`);
    ok(L[0].y <= -2000, `${c} starts in deep time (${yearWords(L[0].y)})`);
    for (const e of L) {
      ok(!ids.has(e.id), `${e.id} is unique`); ids.add(e.id);
      for (const f of ['title', 'when', 'hook', 'kid', 'paint']) ok(e[f], `${e.id} has ${f}`);
      ok(e.src && e.src.length, `${e.id} names a source`);
      ok(e.moments.length >= 2, `${e.id} has moments`);
      ok(!e.today || !e.zones.length, `${e.id}: today uses real borders, no zones`);
      ok(e.today || e.zones.length || e.sites.length >= 2, `${e.id}: the map shows something — a zone or places to visit`);
      ok(e.sites.length >= (e.today ? 0 : 1), `${e.id} names a place you can visit`);
      const box = FRAME[c].box;
      for (const z of e.zones) ok(inBox(z, box) && z[2] > 0 && z[2] <= 4000, `${e.id}: zone ${z[3]} sits on ${c}'s map`);
      for (const st of e.sites) {
        ok(inBox([st[1], st[2]], box), `${e.id}: ${st[0]} is on ${c}'s map`);
        ok(onLand([st[1], st[2]]) || TINY.has(st[0]), `${e.id}: ${st[0]} is on (or at the edge of) land`);
      }
      ok(!/\bnobody\b.*\bbad\b/i.test(e.kid), `${e.id} tells, it does not judge`);
    }
    const hq = histOrderQuiz(c);
    ok(hq.length >= 5 && hq.every((x) => x.opts.length === 2 && x.opts.includes(x.ans)), `${c}: order quiz is fair`);
  }
  const wq = whereQuiz();
  ok(wq.length === 10 && wq.every((x) => !CONT_WORDS.test(x.text) && x.opts.length === 4 && x.opts.includes(x.ans)), 'which-continent quiz never names a continent in the question');
}
