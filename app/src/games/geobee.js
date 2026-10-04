/* Geo Bee — this month's mock contest (F6). Bizzing Maths' Mock Contest, which is Bizzing
   Bee's mock bee: the same ten rivals, the same rules, geography questions from the stops'
   own generators (geobee-engine.js). One Bee a month — seeded by the year and month, so it
   is the same contest all month for every child of a band — and the child's best finish
   for each month is kept.

   The rivals have no painted faces in this app, and none are painted for it: each is a
   coloured disc with an initial. Rank moves only with right answers (ctx.tick); coins come
   only through the standard wallet events, as every game pays (a right answer, a finished
   round). No streaks, nothing for showing up. */
import { GAME_META } from './meta.js';
import { correct } from '../stops.js';
import { RIVALS, SPECS, SUDDEN_AT, newContest, childQuestion, playRound, championship, runOut, live, bot, monthKey, monthSeed, hardness, leaks } from './geobee-engine.js';
import { readBtn, titleCard, finishCard, hud, esc } from './kit.js';

export const TOOL = GAME_META.geobee;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthName = (d = new Date()) => MONTHS[d.getMonth()];
export const ordinal = (n) => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
const disc = (f, k) => {
  if (f.you) return `<span class="gb-disc you" aria-hidden="true">${esc(((k && k.name) || 'Y')[0].toUpperCase())}</span>`;
  const i = RIVALS.findIndex((b) => b.id === f.id), b = RIVALS[i];
  return `<span class="gb-disc" style="--h:${(i * 36 + 12) % 360}" aria-hidden="true">${esc(b.name[0])}</span>`;
};
const nameOf = (id) => (id === 'you' ? 'You' : bot(id).name);

function ask(g, champ = false) {
  const c = g.c;
  if (champ) c.rq = 1;
  g.q = childQuestion(c); c.rq = 0;
  g.phase = champ ? 'champ' : 'ask'; g.youRight = null;
}
function start(ctx) {
  const c = newContest(ctx.band, monthSeed(ctx.band));
  ctx.ui.g = { c, phase: 'ask', q: null, last: null }; ctx.ui.typed = '';
  ask(ctx.ui.g);
}

export function view(ctx) {
  const g = ctx.ui.g, d = ctx.data, mk = monthKey();
  if (!g) {
    const mine = (d.months || {})[mk];
    return `${titleCard(TOOL, {
      how: ['You and ten rivals. One question each, every round. Miss yours and you sit down — but nobody sits down in round one.',
        'If everybody misses, the round is played again. With two left, the last one standing must get one more to win.',
        `The questions climb the roads of the Atlas. This is <b>${monthName()}’s Bee</b>: the same questions all month.`],
      starts: [['geobee|start', mine ? `${monthName()}’s Bee again` : `Enter ${monthName()}’s Bee`]],
      best: mine ? `This month: ${ordinal(mine)} of 11${d.bestPlace ? ` · best ever ${ordinal(d.bestPlace)}` : ''} · ${d.plays || 0} played` : d.bestPlace ? `Best ever: ${ordinal(d.bestPlace)} of 11` : '',
    })}
    <h2 class="sec-h">The field</h2>
    <p class="muted">The same ten who line up at Bizzing Bee’s mock spelling bee and Bizzing Maths’ contest. Suki is still unshakeable.</p>
    <div class="gb-rivals">${RIVALS.map((b, i) => `<div class="card gb-rival">${disc({ id: b.id })}<div><b>${esc(b.name)}, ${b.age}</b><p>${esc(b.note)}</p><p class="muted small">Tell: ${esc(b.tell)}${b.spec ? ` · here, strongest on ${esc(SPECS[b.spec])}` : ''}</p></div></div>`).join('')}</div>`;
  }
  const c = g.c, k = ctx.kid, you = c.field.find((f) => f.you);
  if (g.phase === 'end') {
    const win = c.winner === 'you', podium = c.field.slice().sort((a, b) => a.place - b.place).slice(0, 3);
    return `${finishCard({ kicker: `${monthName()}’s Bee`, title: win ? 'You won the Bee!' : `You finished ${ordinal(you.place)} of 11.`,
      lines: [win ? `It took ${c.round - 1} rounds.` : `${esc(bot(c.winner).name)} won it, in round ${c.round - 1}.`,
        `<span class="gb-podium">${podium.map((f) => `<span class="gb-pod p${f.place}">${disc(f, k)}<b>${esc(nameOf(f.id))}</b><i>${ordinal(f.place)}</i></span>`).join('')}</span>`,
        `Your best this month: ${ordinal((ctx.data.months || {})[monthKey()] || you.place)} of 11. A new Bee opens on the first of next month.`,
        'You practised: everything on the roads of the Atlas, under a little pressure.'],
      again: ['geobee|start', 'Play this month’s Bee again'], home: 'geobee|home' })}`;
  }
  const r = g.last;
  const field = `<ol class="gb-field" aria-label="The field">${c.field.map((f) => {
    const res = r && r.res[f.id];
    return `<li class="${[f.you && 'you', f.out && 'out', res === true && 'r', res === false && 'w'].filter(Boolean).join(' ')}">${disc(f, k)}<span>${esc(nameOf(f.id))}</span>${f.out ? '<i>out</i>' : ''}</li>`;
  }).join('')}</ol>`;
  const chips = hud([`Round <b>${g.phase === 'round' ? c.round - 1 : c.round}</b>`, `${live(c).length} still standing`, c.round > SUDDEN_AT ? 'Sudden death' : '']);
  if (g.phase === 'ask' || g.phase === 'champ') {
    const q = g.q;
    const answers = q.kind === 'type'
      ? `<div class="row gap gb-type"><input id="gb-in" class="inp big" autofocus data-lib-quiet="typed" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type your answer" aria-label="Your answer"><button class="btn primary big" data-act="lib" data-arg="geobee|typed">Answer <kbd>Enter</kbd></button></div>`
      : `<div class="choice-row gb-opts">${q.opts.map((o, i) => `<button class="btn big opt" data-act="lib" data-arg="geobee|pick|${esc(o)}"><span>${esc(o)}</span> <kbd>${i + 1}</kbd></button>`).join('')}</div>`;
    return `${chips}${field}
      <div class="card gb-q">
        ${g.phase === 'champ' ? '<p class="chip gold">Championship question — get this and you win</p>' : '<p class="kicker">Your question</p>'}
        <div class="gm-prompt"><p class="long-q" id="gm-q">${esc(q.text)}</p>${readBtn('#gm-q')}</div>
        ${q.html ? `<div class="gb-fig">${q.html}</div>` : ''}
        ${answers}
      </div>`;
  }
  /* phase 'round': the round's results */
  const outs = (r.out || []).map(nameOf);
  return `${chips}${field}
    <div class="card gb-round gm-res">
      <p class="fb ${g.youRight ? 'good' : g.youRight === false ? 'bad' : ''}">${g.youRight == null ? '' : g.youRight ? 'You got yours.' : `You missed yours. It was <b>${esc(g.q.ans)}</b>${/[.!?]$/.test(g.q.ans) ? "" : "."}`}</p>
      ${g.youRight === false && g.q.why ? `<p class="muted small">${esc(g.q.why)}</p>` : ''}
      ${r.note ? `<p>${esc(r.note)}</p>` : ''}
      ${outs.length ? `<p><b>Sitting down:</b> ${outs.map(esc).join(', ')}.</p>` : (!r.note ? '<p>Nobody sat down this round.</p>' : '')}
      ${you.out ? '<p class="muted">You are out — the rest is played through to see who wins.</p>' : ''}
      <button class="btn primary big" data-act="lib" data-arg="geobee|next">${you.out || c.over ? 'See the result' : 'Next round'} <kbd>Enter</kbd></button>
    </div>`;
}

function answer(given, ctx) {
  const g = ctx.ui.g;
  const right = given !== '' && correct(g.q, given);
  g.youRight = right; ctx.ui.typed = '';
  ctx.tick(right); right ? ctx.sfx.good() : ctx.sfx.bad();
  if (g.phase === 'champ') { championship(g.c, right); g.last = { ...g.c.log.at(-1), res: { you: right } }; }
  else g.last = playRound(g.c, right);
  g.phase = 'round';
}
function end(ctx) {
  const g = ctx.ui.g, c = g.c, d = ctx.data, mk = monthKey();
  runOut(c); g.phase = 'end';
  const place = c.field.find((f) => f.you).place;
  d.plays = (d.plays || 0) + 1;
  d.months = d.months || {};
  if (!d.months[mk] || place < d.months[mk]) d.months[mk] = place;
  const ks = Object.keys(d.months).sort(); while (ks.length > 24) delete d.months[ks.shift()];   // two years of Bees, no more
  if (!d.bestPlace || place < d.bestPlace) d.bestPlace = place;
  d.best = ordinal(d.bestPlace);                     // the Play shelf's chip reads "Best: 3rd"
  if (c.winner === 'you') { d.wins = (d.wins || 0) + 1; ctx.confetti(80); if (ctx.sfx.level) ctx.sfx.level(); }
  if (ctx.session) ctx.session(); if (ctx.earn) ctx.earn('stop'); ctx.save();
}

export function act(name, arg, ctx) {
  const g = ctx.ui.g;
  if (name === 'start') { start(ctx); ctx.sfx.click(); return; }
  if (name === 'home') { ctx.ui.g = null; return; }
  if (!g || g.phase === 'end') return;
  if ((g.phase === 'ask' || g.phase === 'champ') && name === 'pick' && g.q.kind === 'mc') answer(arg, ctx);
  else if ((g.phase === 'ask' || g.phase === 'champ') && name === 'typed' && g.q.kind === 'type') { const v = String(arg || ctx.ui.typed || '').trim(); if (v) answer(v, ctx); }
  else if (g.phase === 'round' && name === 'next') {
    const you = g.c.field.find((f) => f.you);
    if (you.out || g.c.over) end(ctx);
    else ask(g, !!g.c.champ);
  }
}
export function key(e, ctx) {
  const g = ctx.ui.g; if (!g || g.phase === 'end') return false;
  if (g.phase === 'round') { if (e.key === 'Enter') { act('next', '', ctx); return true; } return false; }
  if (g.q.kind === 'type') { if (e.key === 'Enter') { const el = typeof document !== 'undefined' && document.getElementById('gb-in'); act('typed', el ? el.value : '', ctx); return true; } return false; }
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= g.q.opts.length) { act('pick', g.q.opts[n - 1], ctx); return true; }
  return false;
}

/* The contest proves itself: it always ends, every question is the app's own and leaks
   nothing, and a month asks the same first questions every time. (That the ten are the
   Maths file's ten is proved in test/games.mjs, which can read that file.) */
export function selftest(ok) {
  ok(RIVALS.length === 10 && new Set(RIVALS.map((b) => b.name)).size === 10, 'ten rivals, ten names');
  ok(RIVALS.every((b) => b.spec === null || SPECS[b.spec]), 'every speciality is a geography one');
  const Y = new Date(2026, 9, 4);
  for (const band of ['6-7', '8-10', '11-14']) {
    let qs = 0, bad = 0, endedAll = true, firstBad = '';
    for (let i = 0; i < 12; i++) {
      const c = newContest(band, `test|${band}|${i}`), rr = (() => { let s = i + 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
      let guard = 0;
      while (!c.over && !c.field.find((f) => f.you).out && guard++ < 200) {
        if (c.champ) { c.rq = 1; const q = childQuestion(c); c.rq = 0; qs++; const l = q ? leaks(q) : 'no question'; if (l) { bad++; firstBad = firstBad || l; } championship(c, rr() < 0.6); continue; }
        const q = childQuestion(c); qs++;
        const l = q ? leaks(q) : 'no question'; if (l) { bad++; firstBad = firstBad || `${l}: ${q && q.text}`; }
        if (q && hardness(c) > 1) bad++;
        playRound(c, rr() < 0.8);
      }
      runOut(c);
      const places = c.field.map((f) => f.place);
      if (!c.over || !c.winner || places.some((p) => !(p >= 1 && p <= 11)) || places.filter((p) => p === 1).length !== 1) endedAll = false;
    }
    ok(endedAll, `${band}: every contest ends with one winner and a place for all eleven`);
    ok(qs > 30 && bad === 0, `${band}: ${qs} questions, each with one right answer that is not in its words${firstBad ? ` — ${firstBad}` : ''}`);
    const a = newContest(band, monthSeed(band, Y)), b = newContest(band, monthSeed(band, new Date(2026, 9, 28)));
    const qa = [childQuestion(a), (playRound(a, true), childQuestion(a))], qb = [childQuestion(b), (playRound(b, true), childQuestion(b))];
    ok(qa.every((q, j) => q && qb[j] && q.text === qb[j].text && q.ans === qb[j].ans) && a.field.map((f) => f.id).join() === b.field.map((f) => f.id).join(), `${band}: the 4th and the 28th of one month ask the same first questions`);
  }
  ok(monthSeed('8-10', Y) !== monthSeed('8-10', new Date(2026, 10, 4)), 'a new month is a new Bee');
  /* a rival-only field always finishes: the child out in round two, ten rivals played through */
  const c = newContest('11-14', 'runout'); playRound(c, true); playRound(c, false); runOut(c);
  ok(c.over && c.winner && c.winner !== 'you' && c.field.find((f) => f.you).place >= 2, 'played through without the child, the Bee still ends');
  /* the Bee's rules */
  const r1 = newContest('8-10', 'r1'); const e1 = playRound(r1, false);
  ok(!e1.out.length && live(r1).length === 11, 'round one: nobody sits down');
}
