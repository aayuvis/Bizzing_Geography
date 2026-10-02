/* family.js — the Bizzing family layer: what every app does the same way
   (docs: Bizzing_Schedule docs/family/FAMILY-STANDARD.md §1, §13, §14).

   Every Bizzing app is served from aayuvis.github.io, so they share one
   localStorage. Two shared keys live there, and this app writes both:

     bizzing.activity = { v:1, s:[ { a, d, t, m, who } … ] }
       a app id ('geography') · d local date · t start, minutes after midnight
       m ACTIVE minutes (visible and touched in the last two minutes) · who first name
       A milestone is the same row with m:0 and { ev:'band'|'world'|'stop'|'mastery', label }.
     bizzing.wallet   = { v:1, kids:{ "<first name, lower case>": { coins, ledger:[{ a, t, n, why }] } } }

   Nothing here leaves the device. The demo (?demo) never touches either key.
   This is written to the standard's contract; when the family's drop-in
   (Bizzing_Schedule integration/) is vendored here it replaces these bodies,
   and test/family.mjs holds the contract either way. */

export const APP = 'geography';
export const HIVE = 'https://aayuvis.github.io/Bizzing_Schedule/';
const FEED = 'bizzing.activity', WALLET = 'bizzing.wallet';
let off = false;                       // the demo: write nothing shared
export const familyOff = (v) => { off = !!v; };

const ls = () => { try { return globalThis.localStorage || null; } catch (_) { return null; } };
const read = (k, d) => { try { const s = ls(); const v = s && JSON.parse(s.getItem(k)); return v && typeof v === 'object' ? v : d; } catch (_) { return d; } };
const write = (k, v) => { if (off) return; try { const s = ls(); s && s.setItem(k, JSON.stringify(v)); } catch (_) {} };
const pad = (n) => String(n).padStart(2, '0');
const dayOf = (t) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const minOf = (t) => { const d = new Date(t); return d.getHours() * 60 + d.getMinutes(); };

/* ------------------------------------------------------------------ activity */

/* Active minutes: a minute counts when the page was visible and touched in the
   two minutes before it. One row per sitting (a gap of 10+ idle minutes, or a
   new day, or a different child, starts a new one). */
export function trackActivity(app, who, { now = () => Date.now(), win = globalThis } = {}) {
  let last = 0, row = null, wrote = 0;   // row: { d, t, who } of this sitting's line in the feed
  const touch = () => { last = now(); };
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((e) => win.addEventListener && win.addEventListener(e, touch, { passive: true, capture: true }));
  const tickMin = () => {
    const t = now(), name = who() || '';
    if (off || !name || (win.document && win.document.hidden) || t - last > 120000) return;
    const f = read(FEED, { v: 1, s: [] }); if (!Array.isArray(f.s)) f.s = [];
    const d = dayOf(t);
    let r = row && row.d === d && row.who === name && t - wrote <= 600000
      ? f.s.find((x) => x.a === app && !x.ev && x.d === row.d && x.t === row.t && x.who === row.who) : null;
    if (!r) { r = { a: app, d, t: minOf(t - 60000), m: 0, who: name }; f.s.push(r); }   // the sitting began a minute ago
    r.m = Math.min(599, r.m + 1);
    row = { d: r.d, t: r.t, who: r.who }; wrote = t;
    write(FEED, { v: 1, s: f.s.slice(-600) });
  };
  touch();
  const id = setInterval(tickMin, 60000);
  return { tick: tickMin, stop: () => clearInterval(id) };
}

export function trackMilestone(app, who, ev, label, t = Date.now()) {
  if (off || !who) return;
  const f = read(FEED, { v: 1, s: [] }); if (!Array.isArray(f.s)) f.s = [];
  f.s.push({ a: app, d: dayOf(t), t: minOf(t), m: 0, who, ev, label: String(label).slice(0, 80) });
  write(FEED, { v: 1, s: f.s.slice(-600) });
}
export const activityRows = () => (read(FEED, { s: [] }).s || []);

/* ------------------------------------------------------------------ the wallet */

/* The standard amounts. An app may not invent a bigger payout. */
export const EARN = { right: 1, stop: 5, mastered: 20, contest: 10 };
export const DAILY_CAP = 100;
const kidKey = (who) => String(who || '').trim().toLowerCase();
function walletOf(who) {
  const w = read(WALLET, { v: 1, kids: {} }); if (!w.kids) w.kids = {};
  const k = kidKey(who); const me = w.kids[k] || (w.kids[k] = { coins: 0, ledger: [] });
  return { w, me };
}
export function balance(who) { return who ? (read(WALLET, { kids: {} }).kids || {})[kidKey(who)]?.coins || 0 : 0; }
export function ledger(who) { return who ? ((read(WALLET, { kids: {} }).kids || {})[kidKey(who)]?.ledger || []) : []; }
/* Earned today by this app — the cap is per app, per child, per day, and never shown as a target. */
export function earnedToday(who, app = APP, t = Date.now()) {
  const d = dayOf(t);
  return ledger(who).filter((x) => x.a === app && x.n > 0 && dayOf(x.t) === d).reduce((a, x) => a + x.n, 0);
}
/* why ∈ EARN. Returns the coins actually paid (0 at the cap, in the demo, or for an unknown reason). */
export function earn(app, who, why, t = Date.now()) {
  const n = EARN[why]; if (off || !who || !n) return 0;
  const pay = Math.min(n, Math.max(0, DAILY_CAP - earnedToday(who, app, t))); if (!pay) return 0;
  const { w, me } = walletOf(who);
  me.coins += pay; me.ledger.push({ a: app, t, n: pay, why });
  me.ledger = me.ledger.slice(-2000);
  write(WALLET, w);
  return pay;
}
/* A fixed price for a named item; refuses rather than going below zero. */
export function spend(app, who, price, item, t = Date.now()) {
  if (off || !who || !(price > 0)) return false;
  const { w, me } = walletOf(who);
  if (me.coins < price) return false;
  me.coins -= price; me.ledger.push({ a: app, t, n: -price, why: 'buy:' + item });
  me.ledger = me.ledger.slice(-2000);
  write(WALLET, w);
  return true;
}
