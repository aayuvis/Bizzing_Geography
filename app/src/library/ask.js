/* ask.js — "What is the capital of …?", asked the moment a child taps a
   country or a state on the map. Shared by Country Capitals and State
   Capitals.

   Three ways to answer (the owner's rule: a right answer counts however it
   was given, as it does in the Quiz; only seeing it given away does not):
     · TYPE it   — right climbs the capital's box;
     · 4 CHOICES — a right pick climbs it too;
     · REVEAL    — shown at once, and counted as a miss (drops one box).
   A wrong typed answer holds, says "not quite", and lets the child try again
   or ask for help — it never shows the answer until they choose to see it.

   Typing is forgiving where spelling is not the point: case, accents,
   punctuation, "City"/"D.C." suffixes, and one slip in a long name
   ("Kathmandou") are accepted, and the right spelling is shown. */
import { ico } from '../icons.js';
import { shuffle, seeded } from '../rand.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/\(.*?\)/g, '').replace(/\b(city|d\.?\s?c\.?)\b/g, '').replace(/[^a-z]/g, '');
function lev(a, b) {
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return m[a.length][b.length];
}
/* 'exact' | 'close' (one slip in a name of six letters or more) | false */
export function judge(typed, answers) {
  const t = norm(typed); if (!t) return false;
  for (const a of answers) if (norm(a) === t) return 'exact';
  for (const a of answers) { const n = norm(a); if (n.length >= 6 && lev(n, t) <= 1) return 'close'; }
  return false;
}

/* The panel. q = { key, name, answers[], display, note, others[] (wrong capitals to choose from), flag }
   It pops up over the map the moment a place is tapped — never below the
   fold — and leaves the map tappable around it. ✕ or Esc closes it. */
export function panel(tool, q, st) {
  const done = st.state === 'right' || st.state === 'revealed' || st.state === 'picked';
  const opts = st.opts || [];
  return `<div class="card t-ask pop" role="dialog" aria-label="The capital of ${esc(q.name)}" aria-live="polite">
    <button class="t-ask-x" data-act="lib" data-arg="${tool}|close" aria-label="Close (Esc)">✕</button>
    <button class="read-btn t-ask-read" data-act="read" data-arg="#ask-q" aria-label="Read the question to me" title="Read the question to me">${ico('sound')}</button>
    <div class="t-ask-h">${q.flag ? `<img src="flags/${q.flag}.svg" alt="" width="54" height="40">` : ''}<div><p class="kicker">${esc(q.kicker || '')}</p><h3 id="ask-q">What is the capital of ${esc(q.name)}?</h3></div></div>
    ${done ? `<p class="fb ${st.state === 'revealed' ? '' : 'good'}">${st.state === 'right' ? (st.close ? `Right — it’s spelled <b>${esc(q.display)}</b>.` : `Right — <b>${esc(q.display)}</b>.`) : st.state === 'picked' ? `Right — <b>${esc(q.display)}</b>.` : `The capital is <b>${esc(q.display)}</b>.`}</p>${q.note ? `<p class="muted small">${esc(q.note)}</p>` : ''}
        <p class="muted small">Tap another ${esc(q.unit || 'place')} on the map to keep going.</p>`
      : `<div class="row gap t-ask-row">
          <input id="t-${tool}-ans" class="inp" data-lib-quiet="ans" value="${esc(st.typed || '')}" placeholder="Type the capital…" aria-label="Type the capital of ${esc(q.name)}" autocomplete="off" autocapitalize="words" spellcheck="false">
          <button class="btn primary" data-act="lib" data-arg="${tool}|check">Check <kbd>Enter</kbd></button>
        </div>
        ${st.state === 'wrong' ? `<p class="fb bad">Not quite${st.last ? ` — “${esc(st.last)}” isn’t it` : ''}. Try again, or get some help.</p>` : ''}
        ${opts.length ? `<div class="choice-row t-ask-opts">${opts.map((o, i) => `<button class="btn opt${st.wrongPick === o ? ' wrong' : ''}" data-act="lib" data-arg="${tool}|pick|${esc(o)}" ${st.wrongPick === o ? 'disabled' : ''}><span>${esc(o)}</span> <kbd>${i + 1}</kbd></button>`).join('')}</div>` : ''}
        <div class="row gap wrap t-ask-help">
          ${opts.length ? '' : `<button class="btn" data-act="lib" data-arg="${tool}|four">Give me 4 choices</button>`}
          <button class="btn ghost" data-act="lib" data-arg="${tool}|reveal">Reveal the answer</button>
        </div>`}
  </div>`;
}

/* What happened, for the tool to record: 'typed' | 'picked' | 'revealed' | null */
export function handle(name, arg, q, st, typed) {
  if (name === 'check') {
    const v = typed != null ? typed : st.typed;
    st.typed = v;
    const j = judge(v, q.answers);
    if (j) { st.state = 'right'; st.close = j === 'close'; return 'typed'; }
    if (norm(v)) { st.state = 'wrong'; st.last = v; }
    return null;
  }
  if (name === 'four') {
    const wrong = shuffle([...new Set(q.others.filter((o) => !q.answers.some((a) => norm(a) === norm(o))))], seeded(q.name + 'x')).slice(0, 3);
    st.opts = shuffle([q.display.split(' (')[0], ...wrong], seeded(q.name));
    return null;
  }
  if (name === 'pick') {
    if (q.answers.some((a) => norm(a) === norm(arg)) || norm(q.display) === norm(arg)) { st.state = 'picked'; return 'picked'; }
    st.wrongPick = arg; return null;
  }
  if (name === 'reveal') { st.state = 'revealed'; return 'revealed'; }
  return null;
}
