/* kit.js — how a chapter builds a question. One shape for every stop:

   { kind: 'mc',  text, ans, opts[], why, html }     tap one of the options
   { kind: 'map', text, ok[], view, why, target }    tap a place on the world map

   Rules every generator keeps (test/stops.mjs checks them on thousands of
   generated questions):
     · exactly one option is right, and options are distinct;
     · the answer is never in the question's text;
     · option order comes from the question itself (seeded), so a right answer
       has no favourite slot — Finance learned that by hand-authoring 11 of 12
       answers into slot B. */

import { seeded, shuffle, pick } from '../rand.js';

export function mc(r, text, ans, wrongs, why = '', html = '', n = 3) {
  const pool = [...new Set(wrongs.map(String))].filter((w) => w !== String(ans));
  const picked = shuffle(pool, r).slice(0, n);
  return { kind: 'mc', text, ans: String(ans), opts: shuffle([String(ans), ...picked], seeded(text + '|' + ans)), why, html };
}
export const tf = (r, text, truth, why = '', html = '') =>
  ({ kind: 'mc', text, ans: truth ? 'True' : 'False', opts: ['True', 'False'], why, html });

export function mapQ(text, ok, view, why = '', target = null) {
  return { kind: 'map', text, ok: [].concat(ok), view, why, target };
}

/* A hand-written bank: [{ lv, q, a, w: [...], why, html }]. A question at
   level lv draws from items at lv or below, leaning on its own level. */
export function bank(items) {
  return (r, lv) => {
    const at = items.filter((x) => (x.lv || 1) === lv);
    const below = items.filter((x) => (x.lv || 1) < lv);
    const pool = at.length && (r() < 0.7 || !below.length) ? at : below.length ? below : items;
    const it = pick(pool, r);
    if (it.tf !== undefined) return tf(r, it.q, it.tf, it.why || '', it.html || '');
    return mc(r, it.q, it.a, it.w, it.why || '', typeof it.html === 'function' ? it.html() : it.html || '');
  };
}

/* Mix several generators. */
export const mix = (...gens) => (r, lv) => pick(gens, r)(r, lv);

/* Countries a six-year-old has probably heard of. Level 1 of any country
   question draws only from here; higher levels open the whole list. */
export const FAMOUS = new Set(('IN CN JP US CA MX BR AR GB FR DE IT ES RU AU NZ EG ZA KE NG SA TR KR ID PK BD NP LK TH VN PE CL CO ' +
  'GR PT NL SE NO IE MA ET GH IR IQ AE PH MY SG CH PL UA FI DK AT BE CU JM VE BO EC ' +
  'TZ UG DZ LY SD CD AO ZW MG AF MN KZ IL JO KH MM PG FJ IS').split(' '));

/* Countries that sit across two continents: never asked "which continent?" */
export const TWO_CONTINENTS = new Set(['RU', 'TR', 'EG', 'KZ', 'GE', 'AZ', 'AM', 'CY', 'ID', 'PA', 'TL']);
