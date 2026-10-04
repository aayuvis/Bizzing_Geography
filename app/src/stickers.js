/* stickers.js — L7 (the owner, audit v4): one explorer can send another on THIS device a sticker.

   A sticker is one of eight pictures — never a word typed by a child (no free text, the family's child-data
   rule), never a coin, never a reason to come back. It lives in the household on this device and goes nowhere
   else. Three a day from one explorer to another at most, so it stays a hello and not a flood; the newest
   twenty are kept. The sample (?demo) cannot send. */

export const STICKERS = [
  ['globe', '🌍', 'a globe'], ['compass', '🧭', 'a compass'], ['ship', '⛵', 'a ship'], ['peak', '🏔️', 'a mountain'],
  ['volcano', '🌋', 'a volcano'], ['turtle', '🐢', 'a sea turtle'], ['star', '⭐', 'a star'], ['map', '🗺️', 'a map'],
];
export const byStk = Object.fromEntries(STICKERS.map(([id, g, name]) => [id, { id, g, name }]));
export const PER_DAY = 3, KEEP = 20;
const dayOf = (t) => Math.floor(t / 864e5);

export const inbox = (k) => (k.stk = k.stk || []);
export const unseen = (k) => inbox(k).filter((x) => !x.seen);
export function sentToday(from, to, now = Date.now()) { return inbox(to).filter((x) => x.from === from.id && dayOf(x.at) === dayOf(now)).length; }
/* → 'sent' | 'limit' | 'bad' */
export function sendSticker(h, from, toId, s, now = Date.now()) {
  const to = h.kids.find((x) => x.id === toId);
  if (!to || !from || to.id === from.id || !byStk[s]) return 'bad';
  if (sentToday(from, to, now) >= PER_DAY) return 'limit';
  inbox(to).unshift({ from: from.id, name: from.name, s, at: now });
  to.stk = to.stk.slice(0, KEEP);
  return 'sent';
}
export const markSeen = (k) => { for (const x of inbox(k)) x.seen = true; };
