/* mistakes.js — the mistakes deck (F3, family standard §12): every question a child gets
   wrong, in any stop, check, trip, expedition day or Library quiz, is kept — with its
   picture or flag — and comes back AFTER A GAP, never straight away (straight away is
   repetition, not memory). Right after a gap climbs a step; two steps and it is learned
   and leaves the deck. A miss in the deck drops ONE step and says so — never hidden,
   never a reset to nothing. Per child, in the Store, at most MAX cards. */

export const GAP = [20 * 3600e3, 3 * 864e5];   // step 0: the next day · step 1: three days later
export const MAX = 60;
export const keyOf = (q) => String(q.text) + '|' + (q.ans != null ? q.ans : (q.ok || []).join());
const SLIM = ['kind', 'text', 'ans', 'opts', 'ok', 'html', 'why', 'view', 'region', 'target', 'targetName', 'stop', 'lv', 'from', 'accept', 'items', 'hint', 'cont'];
const slim = (q) => Object.fromEntries(SLIM.filter((f) => q[f] !== undefined).map((f) => [f, q[f]]));

const deck = (k) => (k.miss = k.miss || {});
export function missAdd(k, q, from = '', now = Date.now()) {
  const d = deck(k), key = keyOf(q), was = d[key];
  d[key] = { q: slim(q), at: now, box: 0, from: from || (was && was.from) || '', n: ((was && was.n) || 0) + 1 };
  const keys = Object.keys(d).sort((a, b) => d[a].at - d[b].at);
  while (keys.length > MAX) delete d[keys.shift()];
  return d[key];
}
export const missDue = (k, now = Date.now()) => Object.entries(deck(k)).filter(([, m]) => now - m.at >= GAP[Math.min(m.box, GAP.length - 1)]).map(([key, m]) => ({ key, ...m }));
export const missCount = (k) => Object.keys(deck(k)).length;
/* right in the deck: one step up; at the top it is learned and leaves → 'learned' | 'up' */
export function missRight(k, key, now = Date.now()) {
  const m = deck(k)[key]; if (!m) return null;
  m.box++; m.at = now;
  if (m.box >= GAP.length) { delete deck(k)[key]; return 'learned'; }
  return 'up';
}
/* wrong in the deck: ONE step down, and the gap starts again */
export function missWrong(k, key, now = Date.now()) {
  const m = deck(k)[key]; if (!m) return null;
  m.box = Math.max(0, m.box - 1); m.at = now; m.n = (m.n || 0) + 1;
  return 'down';
}
