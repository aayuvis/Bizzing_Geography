/* expeditions.js — the engine for the ten learning sprints (data/expeditions.js).
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

export const CHECK_RIGHT = 8;          // of 10
const TOOLN = { geoguess: 'GeoGuesser', capitals: 'Country Capitals', states: 'State Capitals', landmarks: 'Famous Landmarks', time: 'Earth Through Time', flags: 'Flags', explorer: 'Map Explorer', dictionary: 'Dictionary' };
const KIND = { t: 'Learn', p: 'Practise', c: 'Check', m: 'Make' };
const GLYPH = { t: '📖', p: '🎯', c: '✅', m: '✂️' };

/* ------------------------------------------------------------------ the record */
function rec(k, eid) {
  k.exp = k.exp || {};
  const r = k.exp[eid] || (k.exp[eid] = { at: dayKey(), seen: {}, m: {} });
  r.seen = r.seen || {}; r.m = r.m || {};
  return r;
}
export const ledger = {
  /* a day was done: a lesson opened, a practice finished, a project made */
  did(k, eid, key, day = dayKey()) { const r = rec(k, eid); if (!r.seen[key]) r.seen[key] = day; },
  undo(k, eid, key) { delete rec(k, eid).seen[key]; },
  /* a check was taken. Whether it is learning depends on the score AND the day rule. */
  checked(k, eid, modId, right, total, day = dayKey()) {
    const e = expeditionById[eid], r = rec(k, eid), m = r.m[modId] || (r.m[modId] = { on: null, tries: 0, best: 0 });
    m.tries++; m.best = Math.max(m.best, right);
    const taught = daysOf(e).filter((d) => d.mod === modId && d.k === 't').map((d) => r.seen[d.key]).filter(Boolean).sort().pop() || null;
    const good = right >= Math.round((CHECK_RIGHT / 10) * total);
    const mastered = good && !!taught && day > taught;
    if (mastered && !m.on) m.on = day;
    if (mastered || good) r.seen[`${modId}.check`] = r.seen[`${modId}.check`] || day;
    return { good, mastered, sameDay: good && taught === day, untaught: good && !taught };
  },
};

/* ------------------------------------------------------------------ reading it */
export function dayState(k, e, d) {
  const r = (k.exp || {})[e.id] || { seen: {}, m: {} };
  if (d.k === 'c') { const m = r.m[d.mod]; return m && m.on ? 'done' : m && m.tries ? 'tried' : 'todo'; }
  return r.seen[d.key] ? 'done' : 'todo';
}
export function stats(k, e) {
  const days = daysOf(e), done = days.filter((d) => dayState(k, e, d) === 'done').length;
  const learned = e.modules.filter((m) => (((k.exp || {})[e.id] || {}).m || {})[m.id] && k.exp[e.id].m[m.id].on).length;
  const next = days.find((d) => dayState(k, e, d) !== 'done') || null;
  return { days: days.length, done, learned, mods: e.modules.length, next, started: !!(k.exp || {})[e.id] };
}
/* a stop may be opened from an expedition day the child has reached, even before the road gets there */
export function expAllows(k, stopId) {
  for (const e of EXPEDITIONS) {
    const r = (k.exp || {})[e.id]; if (!r) continue;
    if (daysOf(e).some((d) => d.k === 't' && d.stop === stopId && r.seen[d.key])) return true;
  }
  return false;
}
/* the objectives a grown-up is shown: learned ones only, in the child's words */
export function learnedList(k) {
  const out = [];
  for (const e of EXPEDITIONS) for (const m of e.modules) { const x = (((k.exp || {})[e.id] || {}).m || {})[m.id]; if (x && x.on) out.push({ e, m, on: x.on }); }
  return out;
}

/* the questions for a practice or a check: ten, mixed across the day's stops.
   A stop whose bank is thin at the day's level lends from the levels below it, then
   the one above. If the day's stops are still short of ten (some hold only five to
   nine questions in all), the rest are REVIEW from stops this expedition taught
   earlier — interleaved retrieval, which is the point of a check — never a repeat. */
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
const ageStr = (e) => `ages ${e.ages[0]}–${e.ages[1]}`;
function dayTitle(d) {
  if (d.k === 'm') return d.name ? `Project: ${esc(d.name)}` : 'Project';
  if (d.tool) return esc(d.name);
  if (d.stop) return esc(`${byId[d.stop].glyph} ${byId[d.stop].title}`);
  return d.k === 'c' ? 'The check' : `Practice: ${d.stops.map((s) => byId[s].title).join(' · ')}`;
}

export function viewHub(k, pageHead) {
  return `<section class="exp-hub">
    ${pageHead('Expeditions', esc(EXPEDITIONS_INTRO))}
    <div class="exp-grid">${EXPEDITIONS.map((e) => {
      const s = stats(k, e), pct = Math.round((100 * s.done) / s.days);
      return `<button class="card exp-card" data-act="expOpen" data-arg="${e.id}" style="--ec:${e.colour}">
        <span class="exp-g" aria-hidden="true">${e.glyph}</span>
        <span class="exp-t"><span class="kicker">${s.days} days · ${e.modules.length} parts · ${ageStr(e)}</span><b>${esc(e.name)}</b><span class="muted">${esc(e.sub)}</span>
          <span class="exp-bar" aria-hidden="true"><i style="width:${pct}%"></i></span>
          <span class="exp-s">${s.started ? `Day ${s.next ? s.next.n : s.days} of ${s.days} · ${s.learned} of ${s.mods} learned` : 'Not started — any day is a good day'}</span></span></button>`;
    }).join('')}</div>
    <p class="muted small center-t exp-note">No streaks, no timers. A missed day costs nothing — the next day simply waits for you.</p>
  </section>`;
}

export function viewExpedition(k, eid, { pageHead, back, btn }) {
  const e = expeditionById[eid]; if (!e) return viewHub(k, pageHead);
  const s = stats(k, e), days = daysOf(e);
  const r = (k.exp || {})[e.id] || { seen: {}, m: {} };
  const today = dayKey();
  const nx = s.next;
  const nxHint = nx && nx.k === 'c' && (() => { const taught = days.filter((d) => d.mod === nx.mod && d.k === 't').map((d) => r.seen[d.key]).filter(Boolean).sort().pop(); return taught === today; })();
  return `<section class="exp-one" style="--ec:${e.colour}">
    ${pageHead(`${e.glyph} ${esc(e.name)}`, esc(e.blurb), back('nav', 'Expeditions', 'exp'))}
    <div class="card exp-top">
      <div class="exp-top-t"><p class="kicker">${s.days} days · ${e.modules.length} parts · ${ageStr(e)}</p>
        <p><b>${s.done}</b> of ${s.days} days done · <b>${s.learned}</b> of ${s.mods} parts learned</p>
        <span class="exp-bar big" aria-hidden="true"><i style="width:${Math.round((100 * s.done) / s.days)}%"></i></span></div>
      ${nx ? `<div class="exp-next"><span class="kicker">Next · Day ${nx.n}</span><b>${GLYPH[nx.k]} ${dayTitle(nx)}</b>
        ${nxHint ? '<span class="muted small">You learned this part today. The check counts as learned from tomorrow — come back then, or practise now.</span>' : ''}
        ${btn(nx.k === 'm' ? 'I made it ✓' : `Start day ${nx.n} →`, 'expDay', `${e.id}|${nx.n}`, 'primary big')}</div>`
        : '<div class="exp-next"><b>🏁 Every day done.</b><span class="muted">Everything you learned stays in your record. Any part can be done again.</span></div>'}
    </div>
    ${e.modules.map((m, mi) => {
      const md = days.filter((d) => d.mod === m.id), learned = r.m[m.id] && r.m[m.id].on;
      return `<div class="card exp-mod${learned ? ' learned' : ''}">
        <p class="kicker">Part ${mi + 1} · ${learned ? '✓ learned' : 'you will be able to'}</p>
        <h3>${esc(m.name)}</h3><p class="exp-obj">I can ${esc(m.objective)}.</p>
        <ol class="exp-days">${md.map((d) => {
          const st = dayState(k, e, d);
          return `<li><button class="exp-day ${st}${nx && nx.n === d.n ? ' cur' : ''}" data-act="expDay" data-arg="${e.id}|${d.n}">
            <span class="ed-n">${st === 'done' ? '✓' : d.n}</span>
            <span class="ed-t"><span class="ed-k">${GLYPH[d.k]} ${KIND[d.k]} · about ${d.m} min${d.tool ? ` · ${TOOLN[d.tool]}` : ''}</span><b>${dayTitle(d)}</b>
            <span>${d.k === 'm' ? esc(d.brief) : d.how ? esc(d.how) : d.o ? `Afterwards: ${esc(d.o)}.` : ''}</span>
            ${d.k === 'c' && st === 'tried' ? `<span class="ed-warn">Practised — best ${r.m[d.mod].best} of 10. It counts as learned at ${CHECK_RIGHT} right, on a later day than the lessons.</span>` : ''}
            ${d.k === 'm' && st === 'done' ? `<span class="ed-made">Made: ${esc(d.made)}</span>` : ''}</span></button></li>`;
        }).join('')}</ol></div>`;
    }).join('')}
    <p class="muted small center-t">Every lesson and question here comes from the Atlas and the Library — the same stops, checked the same way.</p>
  </section>`;
}

/* ------------------------------------------------------------------ doing a day */
/* returns what the host should do: { go:[nav,arg] } | { run:{title, items, extra} } | { toast } */
export function doDay(k, eid, n) {
  const e = expeditionById[eid]; if (!e) return null;
  const d = daysOf(e).find((x) => x.n === +n); if (!d) return null;
  if (d.k === 't') { ledger.did(k, eid, d.key); return d.tool ? { go: ['lib', d.tool], toast: d.how } : { go: ['stop', d.stop] }; }
  if (d.k === 'm') {
    if (rec(k, eid).seen[d.key]) { ledger.undo(k, eid, d.key); return { toast: 'Marked as not made yet.' }; }
    ledger.did(k, eid, d.key); return { toast: `Made: ${d.made}. Well done.` };
  }
  const items = quizFor(d, rnd, 10, reviewStops(e, d));
  return { run: { title: `${e.name} · Day ${d.n}`, items, extra: { exp: eid, day: d.n, mod: d.mod, check: d.k === 'c', key: d.key, sub: `${GLYPH[d.k]} ${KIND[d.k]}` } } };
}
/* called by the runner when a practice or a check ends */
export function finishDay(k, run, right, n) {
  const e = expeditionById[run.exp];
  if (!run.check) { ledger.did(k, run.exp, run.key); return { stars: right >= 9 ? 3 : right >= 7 ? 2 : 1, lines: [`Practice done: ${right} of ${n}. Day ${run.day} of ${daysOf(e).length} is ticked.`] }; }
  const res = ledger.checked(k, run.exp, run.mod, right, n);
  const obj = e.modules.find((m) => m.id === run.mod).objective;
  if (res.mastered) return { stars: 3, lines: [`Learned: you can ${obj}.`, 'That goes in your record — and on the grown-ups’ page.'], big: true };
  if (res.sameDay) return { stars: 2, lines: [`${right} of ${n} — well done. You learned this part today, so this counts as practice.`, 'Take the check again on another day and it counts as learned.'] };
  if (res.untaught) return { stars: 2, lines: [`${right} of ${n}! Do this part’s lessons first; then the check can count.`] };
  return { stars: right >= 6 ? 1 : 0, lines: [`${right} of ${n}. ${CHECK_RIGHT} right counts as learned. Look at the lessons again and try another day.`] };
}

export function selftest(ok) {
  ok(EXPEDITIONS.length === 10, `ten expeditions (${EXPEDITIONS.length})`);
  const ids = new Set();
  for (const e of EXPEDITIONS) {
    const days = daysOf(e);
    ok(days.length >= 20 && days.length <= 30, `${e.id}: 20–30 days (${days.length})`);
    ok(!ids.has(e.id), `${e.id} unique`); ids.add(e.id);
    for (const m of e.modules) {
      ok(m.days.filter((d) => d.k === 't').length >= 1 && m.days.filter((d) => d.k === 'c').length === 1, `${m.id}: teaches and has one check`);
      ok(m.days[m.days.length - 1].k === 'c', `${m.id}: the check comes last`);
      ok(m.project && m.project.brief && m.project.made, `${m.id}: has a project`);
      ok(/^[a-z]/.test(m.objective), `${m.id}: objective reads as "I can …"`);
      const check = m.days.find((d) => d.k === 'c');
      const taughtStops = new Set(e.modules.flatMap((x) => x.days.filter((d) => d.k === 't' && d.stop).map((d) => d.stop)));
      for (const s of check.stops) ok(taughtStops.has(s) || e.modules.some((x) => x.days.some((d) => d.k === 'p' && d.stops.includes(s))), `${m.id}: checks ${s}, which the expedition teaches or practises`);
    }
    for (const d of days) {
      if (d.stop) ok(byId[d.stop], `${e.id}: stop ${d.stop} exists`);
      if (d.tool) ok(TOOLN[d.tool] && d.how, `${e.id}: tool ${d.tool} exists and says what to do`);
      if (d.stops) for (const s of d.stops) ok(byId[s], `${e.id}: stop ${s} exists`);
    }
  }
}
