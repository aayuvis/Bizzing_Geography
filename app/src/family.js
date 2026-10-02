/* family.js — the Bizzing family layer: what every app does the same way
   (Bizzing_Schedule docs/family/FAMILY-STANDARD.md v2 §1, §19).

   The family's own drop-ins are vendored byte for byte beside this file —
   bizzing-activity.js (the Hive feed), bizzing-wallet.js (Bizzing coins) and
   bizzing-avatars.js (tiers, prices, worlds). This file only adapts them to this app:

     · the app's own names for the four paying events (a right answer, a stop or
       round finished, something mastered, a level check) → the wallet's events;
     · the demo (?demo): nothing shared is read for writing or written at all;
     · the one reader the Hive's report needs (activityRows).

   Nothing here leaves the device. */

import { trackActivity as famTrack, trackMilestone as famMilestone } from './bizzing-activity.js';
import { earn as famEarn, spend as famSpend, balance as famBalance, ledger as famLedger, DAILY_CAP } from './bizzing-wallet.js';

export const APP = 'geography';
export const HIVE = 'https://aayuvis.github.io/Bizzing_Schedule/';
export { DAILY_CAP };
let off = false;                       // the demo: write nothing shared
export const familyOff = (v) => { off = !!v; };
export const isFamilyOff = () => off;

/* ------------------------------------------------------------------ activity */

/* Active minutes for the Hive, through the family's own tracker. The demo never starts it. */
export function trackActivity(app, who) {
  if (off) return { stop: () => {} };
  const stop = famTrack(app, () => (off ? null : who()));
  return { stop };
}
export function trackMilestone(app, who, ev, label) {
  if (off || !who) return;
  famMilestone(app, who, ev, label);
}
const ls = () => { try { return globalThis.localStorage || null; } catch (_) { return null; } };
export const activityRows = () => { try { const o = JSON.parse((ls() && ls().getItem('bizzing.activity')) || 'null'); return (o && Array.isArray(o.s) && o.s) || []; } catch (_) { return []; } };

/* ------------------------------------------------------------------ the wallet */

/* The app's words for the standard events, and the wallet's. An app may not invent a payout. */
export const EARN = { right: 1, stop: 5, mastered: 20, contest: 10 };
const EVENT = { right: 'answer', stop: 'stop', mastered: 'mastery', contest: 'contest' };
export const balance = (who) => (who ? famBalance(who) : 0);
export const ledger = (who) => (who ? famLedger(who) : []);
const pad = (n) => String(n).padStart(2, '0');
const dayOf = (t) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
/* earned today by this app — the cap is per app, per child, per day, and never shown as a target */
export function earnedToday(who, app = APP, t = Date.now()) {
  const d = dayOf(t);
  return ledger(who).filter((x) => x.a === app && x.n > 0 && dayOf(x.t) === d).reduce((a, x) => a + x.n, 0);
}
/* why ∈ EARN. Returns the coins actually paid (0 at the cap, in the demo, or for an unknown reason). */
export function earn(app, who, why, t = Date.now()) {
  if (off || !who || !EVENT[why]) return 0;
  return famEarn(app, who, EVENT[why], t);
}
/* a fixed price for a named thing ("avatar:jaguar", "world:3", "extra:pin:star"); never below zero */
export function spend(app, who, price, item, t = Date.now()) {
  if (off || !who) return false;
  return famSpend(app, who, price, item, t);
}

/* the ledger as words a child reads (standard §1.1): "+5 · finished a stop · Geography" */
const APP_NAME = { bee: 'Bee', maths: 'Maths', geography: 'Geography', india: 'India', finance: 'Finance' };
const WHY = { answer: 'a right answer', stop: 'finished a stop or round', mastery: 'mastered something', contest: 'a level check', migrated: 'coins from before', right: 'a right answer', mastered: 'mastered something' };
export function ledgerWords(x, name = (id) => id) {
  const w = String(x.why || '');
  let what = WHY[w];
  if (!what && w.startsWith('avatar:')) what = 'bought ' + name(w.slice(7));
  if (!what && w.startsWith('world:')) what = 'opened world ' + w.slice(6);
  if (!what && w.startsWith('refund:')) what = 'given back';
  if (!what && /^(extra:|buy:)/.test(w)) what = 'bought a map look';
  return { n: x.n, sign: x.n > 0 ? '+' : '−', what: what || w, app: APP_NAME[x.a] || x.a, a: x.a, t: x.t };
}
