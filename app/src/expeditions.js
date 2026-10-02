/* expeditions.js — the engine for the ten EXPEDITIONS (data/expeditions.js): learning
   journeys of 20–30 days, Bizzing India's Paathshala in a geographer's clothes.
   Bizzing India's paath.js is the model, and its one large idea holds here:

   TEACHING AND ASSESSMENT ARE DIFFERENT THINGS. Two records, never confused:
     seen{}   a day was done (a lesson opened, a practice finished, a project made).
              It is not learning.
     m{}      per MODULE OBJECTIVE, and only a CHECK may write it — and only when the
              check is 8 of 10 right on a LATER DAY than that module's teaching.
              The same day is attention; another day is memory. The screen says so.

   `ledger` is the only door into the record, as sim.js is in Bizzing Finance. A view
   reads; nothing else writes. A day is a session, not a date: there is no calendar,
   no streak, and a missed day costs nothing — the next one simply waits.

   The record lives on the child: k.exp[expeditionId] = { at, seen:{key:day}, m:{modId:{on,tries,best}} }.
   Grown-ups are shown objectives mastered, never minutes. */
import { EXPEDITIONS, expeditionById, daysOf, EXPEDITIONS_INTRO, EXPEDITIONS_PARENT } from './data/expeditions.js';
import { byId, drill } from './stops.js';
import { dayKey, shuffle, rnd } from './rand.js';
import { esc } from './ui.js';
import { ENGINES, ENGINE_NAME } from './projects.js';

export const CHECK_RIGHT = 8;          // of 10
const TOOLN = { geoguess: 'Where on Earth?', capitals: 'Country Capitals', states: 'State Capitals', landmarks: 'Famous Landmarks', time: 'Earth Through Time', flags: 'Flags', explorer: 'Map Explorer', dictionary: 'Dictionary' };
export const KIND = { t: 'Learn', p: 'Practise', c: 'Test', m: 'Make', f: 'Final test' };
export const GLYPH = { t: '📖', p: '🎯', c: '📝', m: '🛠️', f: '🏅' };

/* ------------------------------------------------------------------ the record */
/* k.exp[courseId] = { at, seen:{key:day}, m:{partId:{on,tries,best}}, fin:{on,tries,best}, art:{key:state}, work:{key:state} } */
function rec(k, eid) {
  k.exp = k.exp || {};
  const r = k.exp[eid] || (k.exp[eid] = { at: dayKey(), seen: {}, m: {} });
  r.seen = r.seen || {}; r.m = r.m || {}; r.art = r.art || {}; r.work = r.work || {};
  return r;
}
const taughtOn = (e, r, modId) => daysOf(e).filter((d) => (modId === 'final' ? d.mod !== 'final' : d.mod === modId) && (d.k === 't' || (modId === 'final' && d.k === 'c'))).map((d) => (d.k === 'c' ? (r.m[d.mod] || {}).on : r.seen[d.key])).filter(Boolean).sort().pop() || null;
export const ledger = {
  /* a day was done: a lesson opened, a practice finished */
  did(k, eid, key, day = dayKey()) { const r = rec(k, eid); if (!r.seen[key]) r.seen[key] = day; },
  undo(k, eid, key) { delete rec(k, eid).seen[key]; },
  /* a project is MADE only when its builder's goals are all met — the host checks, then calls this */
  made(k, eid, key, state, day = dayKey()) { const r = rec(k, eid); r.art[key] = JSON.parse(JSON.stringify(state)); if (!r.seen[key]) r.seen[key] = day; },
  /* a test was taken. Whether it is learning depends on the score AND the day rule:
     8 of 10 on a LATER day than the part's lessons (the course test: later than the
     last part's test). The same day is attention; another day is memory. */
  checked(k, eid, modId, right, total, day = dayKey()) {
    const e = expeditionById[eid], r = rec(k, eid);
    const m = modId === 'final' ? (r.fin || (r.fin = { on: null, tries: 0, best: 0 })) : (r.m[modId] || (r.m[modId] = { on: null, tries: 0, best: 0 }));
    m.tries++; m.best = Math.max(m.best, right);
    const taught = taughtOn(e, r, modId);
    const good = right >= Math.round((CHECK_RIGHT / 10) * total);
    const mastered = good && !!taught && day > taught;
    if (mastered && !m.on) m.on = day;
    return { good, mastered, sameDay: good && taught === day, untaught: good && !taught };
  },
};

/* ------------------------------------------------------------------ reading it */
export function dayState(k, e, d) {
  const r = (k.exp || {})[e.id] || { seen: {}, m: {} };
  if (d.k === 'c') { const m = r.m[d.mod]; return m && m.on ? 'done' : m && m.tries ? 'tried' : 'todo'; }
  if (d.k === 'f') { const m = r.fin; return m && m.on ? 'done' : m && m.tries ? 'tried' : 'todo'; }
  return r.seen[d.key] ? 'done' : 'todo';
}
export function stats(k, e) {
  const days = daysOf(e), r = (k.exp || {})[e.id] || { m: {} }, done = days.filter((d) => dayState(k, e, d) === 'done').length;
  const learned = e.modules.filter((m) => (r.m[m.id] || {}).on).length;
  const made = days.filter((d) => d.k === 'm' && dayState(k, e, d) === 'done').length;
  const next = days.find((d) => dayState(k, e, d) !== 'done') || null;
  return { days: days.length, done, learned, mods: e.modules.length, made, projects: days.filter((d) => d.k === 'm').length, next, started: !!(k.exp || {})[e.id], complete: done === days.length };
}
export function expAllows(k, stopId) {
  for (const e of EXPEDITIONS) {
    const r = (k.exp || {})[e.id]; if (!r) continue;
    if (daysOf(e).some((d) => d.k === 't' && d.stop === stopId && r.seen[d.key])) return true;
  }
  return false;
}
export function learnedList(k) {
  const out = [];
  for (const e of EXPEDITIONS) for (const m of e.modules) { const x = (((k.exp || {})[e.id] || {}).m || {})[m.id]; if (x && x.on) out.push({ e, m, on: x.on }); }
  return out;
}

export function reviewStops(e, d) {
  const before = daysOf(e).filter((x) => x.n < d.n && x.mod !== d.mod);
  return [...new Set(before.flatMap((x) => (x.stop ? [x.stop] : x.stops || [])))].filter((s) => !d.stops.includes(s));
}
export function quizFor(d, r = rnd, n = 10, review = []) {
  const lvs = [d.lv, ...[3, 2, 1].filter((x) => x < d.lv), ...[1, 2, 3].filter((x) => x > d.lv)];
  const seen = new Set(), out = [];
  const take = (qs) => { for (const q of shuffle(qs, r)) { const key = q.text + '|' + (q.ans || (q.ok || []).join()); if (seen.has(key)) continue; seen.add(key); out.push(q); if (out.length === n) break; } };
  take(d.stops.flatMap((id) => lvs.flatMap((lv) => drill(byId[id], lv, n, r))));
  if (out.length < n && review.length) take(review.flatMap((id) => drill(byId[id], d.lv, 4, r)).map((q) => ({ ...q, review: true })));
  return shuffle(out, r);
}

/* ------------------------------------------------------------------ views */
/* THE ATLAS'S GRAMMAR (views.js viewWorld): a painted plate, a road across it, and one
   camp per part — tap a camp and its card opens below, with the next thing to do as
   the one big button. A course is a journey you can SEE, not a list of rows. */
const ageStr = (e) => `ages ${e.ages[0]}–${e.ages[1]}`;
export function dayTitle(d) {
  if (d.k === 'm') return esc(d.name);
  if (d.tool) return esc(d.name);
  if (d.stop) return esc(byId[d.stop].title);
  if (d.k === 'c') return 'Part test';
  if (d.k === 'f') return 'The final test';
  return `Practice · ${d.stops.map((s) => byId[s].title).join(' · ')}`;
}
const RY = (x) => 72 + 9 * Math.sin((x / 100) * Math.PI * 2 * 1.1 + 0.4);
const camps = (e) => [...e.modules.map((m, i) => ({ id: m.id, n: i + 1, name: m.name })), { id: 'final', n: '🏁', name: 'The finish' }];

export function viewHub(k, pageHead) {
  const all = EXPEDITIONS.map((e) => stats(k, e));
  const tot = (f) => all.reduce((a, s) => a + s[f], 0);
  return `<section class="crs-hub">
    ${pageHead('Expeditions')}
    <div class="crs-mast"><ul class="crs-tally"><li><b>${EXPEDITIONS.length}</b>expeditions</li><li><b>${tot('days')}</b>days</li><li><b>${tot('projects')}</b>things to make</li>${tot('learned') ? `<li><b>${tot('learned')}</b>parts learned</li>` : ''}</ul></div>
    <div class="crs-grid">${EXPEDITIONS.map((e, i) => {
      const s = all[i], pct = Math.round((100 * s.done) / s.days);
      return `<button class="crs-card" data-act="expOpen" data-arg="${e.id}" style="--ec:${e.colour}">
        <span class="crs-fig" style="background-image:url(art/crs-${e.id}.webp)"><span class="crs-g">${e.glyph}</span>${s.complete ? '<span class="crs-done">🏅 Complete</span>' : s.started ? `<span class="crs-day">Day ${s.next ? s.next.n : s.days} of ${s.days}</span>` : ''}</span>
        <span class="crs-body"><span class="crs-sub">${esc(e.sub)}</span><b>${esc(e.name)}</b>
          <span class="crs-meta">${s.days} days · ${e.modules.length} parts · ${s.projects} projects · ${ageStr(e)}</span>
          ${pct ? `<span class="crs-bar"><i style="width:${pct}%"></i></span>` : ''}</span></button>`;
    }).join('')}</div>
    <p class="muted small crs-colophon">${esc(EXPEDITIONS_INTRO)} ${esc(EXPEDITIONS_PARENT)}</p>
  </section>`;
}

export function viewExpedition(k, eid, { pageHead, back, btn }, ui = {}) {
  const e = expeditionById[eid]; if (!e) return viewHub(k, pageHead);
  const s = stats(k, e), days = daysOf(e), r = (k.exp || {})[e.id] || { seen: {}, m: {}, art: {} };
  const C = camps(e);
  const nxCamp = s.next ? C.findIndex((c) => c.id === s.next.mod) : C.length - 1;
  const sel = ui.part != null && C[ui.part] ? ui.part : Math.max(0, nxCamp);
  const cp = C[sel], md = days.filter((d) => d.mod === cp.id);
  const partDone = (c) => (c.id === 'final' ? s.complete : (r.m[c.id] || {}).on && dayState(k, e, days.find((d) => d.key === `${c.id}.project`)) === 'done');
  const xs = C.map((_, j) => 7 + (86 * j) / (C.length - 1));
  let path = ''; for (let x = 0; x <= 100; x += 2) path += `${x ? 'L' : 'M'}${x},${RY(x).toFixed(2)} `;
  const nextHere = md.find((d) => dayState(k, e, d) !== 'done');
  const today = dayKey();
  const sameDay = nextHere && (nextHere.k === 'c' || nextHere.k === 'f') && taughtOn(e, r, cp.id === 'final' ? 'final' : cp.id) === today;
  const m = e.modules.find((x) => x.id === cp.id);
  const proj = md.find((d) => d.k === 'm'), art = proj && r.art[proj.key];
  return `<section class="crs-one" style="--ec:${e.colour}">
    ${pageHead(`${e.glyph} ${esc(e.name)}`, '', back('nav', 'Expeditions', 'exp'), `<span class="chip">${s.done}/${s.days} days</span>`)}
    <div class="board-scroll"><div class="board crs-board">
      <img src="art/crs-${e.id}.webp" alt="" width="1920" height="823">
      <svg class="road" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" class="rd-edge"/><path d="${path}" class="rd"/></svg>
      ${C.map((c, j) => `<button class="bpin crs-camp${partDone(c) ? ' done' : ''}${j === sel ? ' sel' : ''}${j === nxCamp ? ' here' : ''}" style="left:${xs[j]}%;top:${RY(xs[j])}%" data-act="expPart" data-arg="${j}" aria-label="${c.id === 'final' ? 'The finish' : `Part ${c.n}: ${esc(c.name)}`}${partDone(c) ? ', done' : ''}">
        <span>${partDone(c) ? '✓' : c.n}</span><em>${esc(c.name)}</em></button>`).join('')}
    </div></div>
    <div class="card pick-card crs-part">
      <p class="kicker">${cp.id === 'final' ? 'The finish' : `Part ${cp.n} of ${e.modules.length}`} · ${md.filter((d) => dayState(k, e, d) === 'done').length} of ${md.length} done</p>
      <h2>${esc(cp.id === 'final' ? 'Final test and final project' : m.name)}</h2>
      <p class="crs-obj">${cp.id === 'final' ? 'Everything this expedition taught, mixed and cold — then one big thing to make.' : `After this part you can <b>${esc(m.objective)}</b>.${(r.m[m.id] || {}).on ? ' <span class="chip ok">learned ✓</span>' : ''}`}</p>
      <ol class="crs-steps">${md.map((d) => { const st = dayState(k, e, d);
        return `<li><button class="crs-step ${d.k} ${st}${nextHere && nextHere.key === d.key ? ' cur' : ''}" data-act="expDay" data-arg="${e.id}|${d.n}">
          <span class="cs-g">${st === 'done' ? '✓' : GLYPH[d.k]}</span><span class="cs-k">${KIND[d.k]}</span><b>${dayTitle(d)}</b><i>${d.k === 'm' ? ENGINE_NAME[d.engine] : `${d.m} min`}</i></button></li>`; }).join('')}</ol>
      ${nextHere ? `<div class="crs-go">${sameDay ? '<p class="muted small">You learned this part today. The test counts as learned from tomorrow — practise now, or come back then.</p>' : ''}
        ${btn(`${GLYPH[nextHere.k]} ${KIND[nextHere.k]}: ${nextHere.k === 'm' || nextHere.k === 'f' || nextHere.k === 'c' ? dayTitle(nextHere) : dayTitle(nextHere)} →`, 'expDay', `${e.id}|${nextHere.n}`, 'primary big')}</div>`
        : cp.id === 'final' ? certificate(k, e) : `<p class="crs-donep">✓ Part done — ${sel < C.length - 1 ? btn('Next part →', 'expPart', String(sel + 1), 'small') : ''}</p>`}
      ${art ? `<div class="crs-art"><span class="pj-thumbwrap">${ENGINES[proj.engine].thumb(proj, art)}</span><span><span class="kicker">You made</span><b>${esc(proj.made)}</b></span>${btn('Open it', 'expDay', `${e.id}|${proj.n}`, 'small')}</div>` : ''}
    </div>
    ${gallery(k, e)}
  </section>`;
}
function gallery(k, e) {
  const r = (k.exp || {})[e.id] || {}, made = daysOf(e).filter((d) => d.k === 'm' && (r.art || {})[d.key]);
  if (!made.length) return '';
  return `<div class="card crs-gal"><h3>Things you made</h3><div class="crs-galg">${made.map((d) => `<button class="crs-gi" data-act="expDay" data-arg="${e.id}|${d.n}"><span class="pj-thumbwrap">${ENGINES[d.engine].thumb(d, r.art[d.key])}</span><b>${esc(d.name)}</b></button>`).join('')}</div></div>`;
}
function certificate(k, e) {
  return `<div class="crs-cert"><span class="crs-medal">🏅</span><p class="kicker">Expedition complete</p><h3>${esc(k.name)} finished ${esc(e.name)}</h3>
    <ul>${e.modules.map((m) => `<li>✓ can ${esc(m.objective)}</li>`).join('')}</ul>
    <button class="btn" onclick="window.print()">Print the certificate</button></div>`;
}

/* ------------------------------------------------------------------ a project, built in the app */
export function projOf(eid, key) { const e = expeditionById[eid]; const d = e && daysOf(e).find((x) => x.key === key); return d && d.k === 'm' ? { e, d } : null; }
export function projState(k, e, d) {
  const r = rec(k, e.id);
  if (!r.work[d.key]) r.work[d.key] = r.art[d.key] ? JSON.parse(JSON.stringify(r.art[d.key])) : ENGINES[d.engine].init(d, seededFor(k, d));
  return r.work[d.key];
}
const seededFor = (k, d) => { let a = 0; for (const c of k.id + d.key) a = (a * 31 + c.charCodeAt(0)) >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; };
export function viewProject(k, arg, { pageHead, back, btn }) {
  const [eid, key] = String(arg).split('|'), P = projOf(eid, key); if (!P) return '';
  const { e, d } = P, E = ENGINES[d.engine], st = projState(k, e, d), goals = E.goals(d, st), all = goals.every((g) => g.ok);
  const made = !!((k.exp[e.id] || {}).art || {})[d.key];
  return `<section class="pj-page" style="--ec:${e.colour}">
    ${pageHead(`🛠️ ${esc(d.name)}`, '', back('expOpen', e.name, e.id), `<span class="chip">${ENGINE_NAME[d.engine]}</span>`)}
    <div class="pj-grid">
      <div class="card pj-build">${E.view(d, st)}</div>
      <aside class="card pj-side">
        <p class="kicker">${d.mod === 'final' ? 'Final project' : `Part ${e.modules.findIndex((m) => m.id === d.mod) + 1} project`}</p>
        <p class="pj-brief">${esc(d.brief)}</p>
        <h3>Your checklist</h3>
        <ul class="pj-goals">${goals.map((g) => `<li class="${g.ok ? 'ok' : ''}"><span>${g.ok ? '✓' : '○'}</span>${esc(g.t)}</li>`).join('')}</ul>
        ${btn(made && all ? 'Save my changes ✓' : all ? 'Finish project 🎉' : `${goals.filter((g) => !g.ok).length} to go`, 'projDone', '', all ? 'primary big wide' : 'big wide', all ? '' : 'disabled')}
        ${made ? `<p class="muted small center-t">Made on ${esc(k.exp[e.id].seen[d.key] || '')}. You can keep changing it.</p>` : ''}
      </aside>
    </div>
  </section>`;
}
/* one door for every builder action; returns a message to show, if any */
export function projAct(k, arg, name, val) {
  const [eid, key] = String(arg).split('|'), P = projOf(eid, key); if (!P) return null;
  const st = projState(k, P.e, P.d);
  if (name === 'done') { if (!ENGINES[P.d.engine].goals(P.d, st).every((g) => g.ok)) return 'Not finished yet — look at the checklist.'; ledger.made(k, eid, key, st); return 'made'; }
  return ENGINES[P.d.engine].act(P.d, st, name, val);
}

/* ------------------------------------------------------------------ doing a day */
/* returns what the host should do: { go:[nav,arg] } | { run:{title, items, extra} } | { toast } */
export function doDay(k, eid, n) {
  const e = expeditionById[eid]; if (!e) return null;
  const d = daysOf(e).find((x) => x.n === +n); if (!d) return null;
  if (d.k === 't') { ledger.did(k, eid, d.key); return d.tool ? { go: ['lib', d.tool], toast: d.how } : { go: ['stop', d.stop] }; }
  if (d.k === 'm') { rec(k, eid); return { go: ['proj', `${eid}|${d.key}`] }; }
  const items = quizFor(d, rnd, d.k === 'f' ? 15 : 10, reviewStops(e, d));
  return { run: { title: `${e.name} · ${KIND[d.k]}`, items, extra: { exp: eid, day: d.n, mod: d.mod, check: d.k === 'c' || d.k === 'f', key: d.key, sub: `${GLYPH[d.k]} ${KIND[d.k]}` } } };
}
export function finishDay(k, run, right, n) {
  const e = expeditionById[run.exp];
  if (!run.check) { ledger.did(k, run.exp, run.key); return { stars: right >= 9 ? 3 : right >= 7 ? 2 : 1, lines: [`Practice done: ${right} of ${n}.`] }; }
  const res = ledger.checked(k, run.exp, run.mod, right, n);
  const obj = run.mod === 'final' ? `finish ${e.name}` : `now ${e.modules.find((m) => m.id === run.mod).objective}`;
  if (res.mastered) return { stars: 3, lines: [run.mod === 'final' ? 'Final test passed! Make the final project to finish the expedition.' : `Learned: you can ${e.modules.find((m) => m.id === run.mod).objective}.`, 'Next: the project for this part.'], big: true };
  if (res.sameDay) return { stars: 2, lines: [`${right} of ${n} — well done. You learned this today, so it counts as practice.`, 'Take the test again on another day and it counts as learned.'] };
  if (res.untaught) return { stars: 2, lines: [`${right} of ${n}! Do the lessons first; then the test can count.`] };
  return { stars: right >= Math.round(n * 0.6) ? 1 : 0, lines: [`${right} of ${n}. ${Math.round(n * 0.8)} right counts as learned. Look at the lessons again and try another day.`] };
}

export function selftest(ok) {
  ok(EXPEDITIONS.length === 10, `ten courses (${EXPEDITIONS.length})`);
  const ids = new Set();
  for (const e of EXPEDITIONS) {
    const days = daysOf(e);
    ok(days.length >= 20 && days.length <= 30, `${e.id}: 20–30 days (${days.length})`);
    ok(!ids.has(e.id), `${e.id} unique`); ids.add(e.id);
    ok(e.final && ENGINES[e.final.engine], `${e.id}: has a final project`);
    ok(days.filter((d) => d.k === 'f').length === 1 && days[days.length - 1].k === 'm' && days[days.length - 2].k === 'f', `${e.id}: ends with the course test, then the final project`);
    for (const m of e.modules) {
      ok(m.days.filter((d) => d.k === 't').length >= 1 && m.days.filter((d) => d.k === 'c').length === 1, `${m.id}: teaches and has one test`);
      ok(m.days[m.days.length - 1].k === 'c', `${m.id}: the test comes after the lessons`);
      ok(m.project && ENGINES[m.project.engine] && m.project.brief && m.project.made, `${m.id}: has an in-app project`);
      ok(/^[a-z]/.test(m.objective), `${m.id}: objective reads as "I can …"`);
      const check = m.days.find((d) => d.k === 'c');
      for (const st of check.stops) ok(e.modules.some((x) => x.days.some((d) => (d.k === 't' && d.stop === st) || (d.k === 'p' && d.stops.includes(st)))), `${m.id}: tests ${st}, which the course teaches or practises`);
    }
    for (const d of days) {
      if (d.stop) ok(byId[d.stop], `${e.id}: stop ${d.stop} exists`);
      if (d.tool) ok(TOOLN[d.tool] && d.how, `${e.id}: tool ${d.tool} exists and says what to do`);
      if (d.stops) for (const st of d.stops) ok(byId[st], `${e.id}: stop ${st} exists`);
      /* every project can be finished, and none is finished before it is started */
      if (d.k === 'm' && d.engine === 'sort') ok(ENGINES.sort.init(d, () => 0.3).items.length === d.count, `${e.id} ${d.key}: sorts exactly ${d.count} (a day's fields must never overwrite a project's)`);
      if (d.k === 'm') { const E = ENGINES[d.engine]; ok(E.goals(d, E.solve(d)).every((g) => g.ok), `${e.id} ${d.key}: can be finished`); ok(!E.goals(d, E.init(d, () => 0.5)).every((g) => g.ok), `${e.id} ${d.key}: is not done before it starts`); }
    }
  }
}
