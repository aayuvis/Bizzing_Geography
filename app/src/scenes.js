/* scenes.js — the living backdrop behind the whole app, one scene per theme.
   Bizzing Bee's worlds4 is the model: a theme is not an accent colour, it is
   the ROOM the child sits in — a sky, scenery at several depths, creatures
   and vehicles crossing, particles drifting — built here as markup and moved
   by styles/scenes.css.

     Old Atlas    a chart-sea: compass rose, sailing ship, balloon, gulls, whale
     Ocean Deep   under the sea: light rays, fish, a turtle, jellyfish, kelp, bubbles
     Rainforest   canopy, vines, macaws, butterflies, falling leaves, fireflies
     Desert Dunes sun (moon at night), rolling dunes, a caravan, tumbleweeds, a hawk
     Polar Aurora aurora curtains, snowy peaks, icebergs, penguins, snowfall
     Satellite    a spinning Earth (the app's OWN map data, India's depiction),
                  satellites in orbit, the Moon, a rocket, shooting stars

   Rules (the family's, and this app's):
   · shapes only — no letters, no digits; and no invented map: the only land
     outline anywhere is the Satellite globe, painted from data/world.js;
   · decorative and inert: aria-hidden, pointer-events none, outside #app so
     a re-render never restarts it;
   · a working screen (a quiz run) gets CALM: the scene holds still and fades
     back; a device switch ("Still background") does the same everywhere;
     prefers-reduced-motion freezes it;
   · the centre of the page is veiled towards paper, so reading text over the
     scene keeps its contrast — the edges carry the colour.
   `sceneHTML` is pure (seeded) so test/scenes.mjs can count and check it. */

import { geoEquirectangular, geoPath } from 'd3-geo';

export function rng(seed = 7) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/* scene classes are prefixed s- (the app already has .sky, .bubble…); moves stay a-, inner lives sc- */
const E = (cls, style = '', inner = '') => `<div class="scn ${cls.split(' ').map((c) => (/^(a|sc)-/.test(c) ? c : 's-' + c)).join(' ')}" style="${style}">${inner}</div>`;
const f1 = (n) => (+n).toFixed(1);

/* ------------------------------------------------------------------ art */
const BIRD = (c = '#fff', k = '#3A3A4A') => `<svg viewBox="0 0 40 20" width="100%" height="100%"><g class="sc-flap"><path d="M2 12Q10 2 20 10Q30 2 38 12Q30 7 20 13Q10 7 2 12z" fill="${c}" stroke="${k}" stroke-width="1.2"/></g></svg>`;
const CLOUD = (c = '#fff') => `<svg viewBox="0 0 200 70" width="100%" height="100%"><g fill="${c}"><ellipse cx="60" cy="46" rx="52" ry="20"/><ellipse cx="108" cy="32" rx="44" ry="28"/><ellipse cx="150" cy="48" rx="44" ry="17"/></g></svg>`;
const BALLOON = (a, b, c) => `<svg viewBox="0 0 60 92" width="100%" height="100%"><path d="M30 2C14 2 4 14 4 28c0 16 16 26 22 36h8c6-10 22-20 22-36C56 14 46 2 30 2z" fill="${a}"/><path d="M30 2c-8 0-12 12-12 26 0 16 8 26 10 36h4c2-10 10-20 10-36C42 14 38 2 30 2z" fill="${b}"/><path d="M30 2c-3 0-5 12-5 26 0 16 3 26 4 36h2c1-10 4-20 4-36 0-14-2-26-5-26z" fill="${c}"/><path d="M26 64l-3 13M34 64l3 13" stroke="#6B4A2B" stroke-width="1.3"/><rect x="21" y="77" width="18" height="12" rx="2.5" fill="#8B5A2B"/></svg>`;
const SHIP = `<svg viewBox="0 0 120 100" width="100%" height="100%"><path d="M8 68h104l-15 22H24z" fill="#8A4F26"/><path d="M12 68h96" stroke="#5A3418" stroke-width="3"/><path d="M20 76h80" stroke="#F0B429" stroke-width="2"/><rect x="58" y="8" width="3" height="60" fill="#5A3418"/><rect x="33" y="24" width="2.5" height="44" fill="#5A3418"/><rect x="84" y="24" width="2.5" height="44" fill="#5A3418"/><path d="M62 10q24 14 0 30z" fill="#FFF8E6"/><path d="M62 40q26 12 0 26z" fill="#FFF8E6"/><path d="M36 26q17 10 0 22z" fill="#F6EBD2"/><path d="M87 26q17 10 0 22z" fill="#F6EBD2"/><path d="M61 8l15 4-15 4z" fill="#D8412F"/></svg>`;
const ISLAND = `<svg viewBox="0 0 160 84" width="100%" height="100%"><ellipse cx="80" cy="78" rx="76" ry="12" fill="#EBC77A"/><g class="sc-palm"><path d="M82 74q-7-30 4-54" stroke="#7A4A2A" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M86 20q-20-10-38 5q19-3 38-5zM86 20q19-14 40-2q-21 0-40 2zM86 20q-8-19-28-19q15 8 28 19zM86 20q12-19 32-14q-19 4-32 14z" fill="#3E9A4A"/></g></svg>`;
const TAIL = `<svg viewBox="0 0 80 52" width="100%" height="100%"><path d="M40 52q-4-22 0-30q-18 0-35-15q14 21 35 23q21-2 35-23q-17 15-35 15q4 8 0 30z" fill="#35607E"/></svg>`;
function compassRose() {
  let t = '';
  for (let i = 0; i < 72; i++) { const a = (i * Math.PI) / 36, r1 = i % 9 === 0 ? 76 : 82; t += `<line x1="${f1(100 + Math.cos(a) * r1)}" y1="${f1(100 + Math.sin(a) * r1)}" x2="${f1(100 + Math.cos(a) * 88)}" y2="${f1(100 + Math.sin(a) * 88)}"/>`; }
  return `<svg viewBox="0 0 200 200" width="100%" height="100%"><circle cx="100" cy="100" r="94" fill="none" stroke="#A94A1C" stroke-width="3"/><circle cx="100" cy="100" r="88" fill="none" stroke="#2E7F8F" stroke-width="1.5"/><g stroke="#7A2F0E" stroke-width="1.4">${t}</g><circle cx="100" cy="100" r="60" fill="none" stroke="#2E7F8F" stroke-width="1.2" stroke-dasharray="3 5"/><path d="M100 100l30-30-30 12-30-12z" fill="#2E7F8F" transform="rotate(45 100 100)" opacity=".9"/><path d="M100 10l13 78 77 12-77 12-13 78-13-78-77-12 77-12z" fill="#D06A34"/><path d="M100 10l13 78-13 12zM190 100l-77 12-13-12zM100 190l-13-78 13-12zM10 100l77-12 13 12z" fill="#7A2F0E"/><path d="M100 42l7 51 51 7-51 7-7 51-7-51-51-7 51-7z" transform="rotate(45 100 100)" fill="#2E9CA6"/><circle cx="100" cy="100" r="9" fill="#F0B429" stroke="#7A2F0E" stroke-width="2.5"/></svg>`;
}
const wave = (c, foam) => `<svg viewBox="0 0 400 60" preserveAspectRatio="none" width="50%" height="100%"><path d="M0 26Q25 8 50 26T100 26T150 26T200 26T250 26T300 26T350 26T400 26V60H0z" fill="${c}"/><path d="M0 26Q25 8 50 26T100 26T150 26T200 26T250 26T300 26T350 26T400 26" fill="none" stroke="${foam}" stroke-width="3" opacity=".75"/></svg>`;
const strip = (svg) => svg + svg;          // two copies side by side, rolled by -50%

const FISH = (a, b, stripes = false) => `<svg viewBox="0 0 64 32" width="100%" height="100%"><g class="sc-wag"><path d="M46 16l16-11v22z" fill="${b}"/></g><ellipse cx="27" cy="16" rx="23" ry="12.5" fill="${a}"/>${stripes ? `<path d="M20 4.5q6 11.5 0 23M34 5q5 11 0 22" stroke="#fff" stroke-width="4" fill="none"/>` : `<path d="M19 5q6 11 0 22" stroke="${b}" stroke-width="3" fill="none"/>`}<path d="M22 4l8-4 4 6z" fill="${b}"/><circle cx="12" cy="13" r="3.2" fill="#fff"/><circle cx="11.4" cy="13" r="1.7" fill="#123"/></svg>`;
const SCHOOL = (c) => { let o = ''; const R = rng(11); for (let i = 0; i < 14; i++) { const x = 10 + R() * 170, y = 8 + R() * 60; o += `<path transform="translate(${f1(x)} ${f1(y)})" d="M0 5q8-6 14 0q-6 6-14 0zM13 5l6-4v8z" fill="${c}"/>`; } return `<svg viewBox="0 0 200 80" width="100%" height="100%">${o}</svg>`; };
const TURTLE = `<svg viewBox="0 0 110 70" width="100%" height="100%"><g class="sc-paddle"><path d="M34 22q-22-14-30-6q10 8 30 14z" fill="#5FAF6A"/><path d="M34 48q-22 14-30 6q10-8 30-14z" fill="#5FAF6A"/></g><path d="M70 22q18-12 26-2q-12 6-26 10zM70 48q18 12 26 2q-12-6-26-10z" fill="#5FAF6A"/><ellipse cx="94" cy="35" rx="13" ry="10" fill="#6FBF78"/><circle cx="99" cy="32" r="2.2" fill="#123"/><ellipse cx="54" cy="35" rx="32" ry="24" fill="#3C7F4E"/><path d="M54 13l12 10-5 14h-14l-5-14zM38 20l9 3 5 14-10 8-10-8zM70 20l-9 3-5 14 10 8 10-8zM47 51h14l5-8-12-7-12 7z" fill="#5A9E5F" stroke="#2F6B3F" stroke-width="1.2"/></svg>`;
const JELLY = (c) => `<svg viewBox="0 0 44 70" width="100%" height="100%"><g class="sc-pulse"><path d="M4 26q0-22 18-22t18 22q-4 5-9 0q-4 5-9 0q-4 5-9 0q-5 5-9 0z" fill="${c}" opacity=".9"/><path d="M12 14q4-6 10-6" stroke="#fff" stroke-width="2.5" fill="none" opacity=".8" stroke-linecap="round"/></g><path d="M10 28q-3 14 2 26q3 8-1 14M18 28q2 14-2 24q-2 8 2 16M26 28q-2 14 2 24M34 28q3 12-1 22q-2 8 1 14" stroke="${c}" stroke-width="2" fill="none" opacity=".75"/></svg>`;
const KELP = (c, h) => `<svg viewBox="0 0 40 ${h}" width="100%" height="100%" preserveAspectRatio="none"><path d="M20 ${h}C8 ${h * 0.8} 32 ${h * 0.6} 18 ${h * 0.4}S26 ${h * 0.1} 20 0" stroke="${c}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M19 ${h * 0.7}q-14-6-16-18M22 ${h * 0.5}q14-6 16-18M18 ${h * 0.28}q-12-4-14-14" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/></svg>`;
const CORAL = (a, b) => `<svg viewBox="0 0 120 80" width="100%" height="100%"><path d="M30 80V50q0-12-10-20M30 56q10-8 12-22M30 64q-14-4-20-16" stroke="${a}" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="20" cy="29" r="6" fill="${a}"/><circle cx="42" cy="33" r="6" fill="${a}"/><circle cx="10" cy="47" r="5" fill="${a}"/><path d="M78 80q-2-26 10-34q12 8 10 34z" fill="${b}"/><path d="M62 80q0-18 8-24q8 6 8 24z" fill="${b}" opacity=".8"/><circle cx="98" cy="72" r="9" fill="#F6C343"/><circle cx="98" cy="72" r="4" fill="#E88A2E"/></svg>`;

const VINE = (c = '#2E7D32', l = '#4CAF50') => `<svg viewBox="0 0 60 240" width="100%" height="100%" preserveAspectRatio="none"><path d="M30 0q-14 40 4 80q16 36-6 74q-12 26 4 86" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>${[30, 70, 110, 150, 190].map((y, i) => `<path d="M${i % 2 ? 32 : 28} ${y}q${i % 2 ? 18 : -18} -8 ${i % 2 ? 22 : -22} 6q${i % 2 ? -10 : 10} 6 ${i % 2 ? -22 : 22} -6z" fill="${l}"/>`).join('')}</svg>`;
const MONSTERA = (c) => `<svg viewBox="0 0 120 120" width="100%" height="100%"><path d="M60 118Q10 100 8 56Q8 14 56 6q48 2 56 48q2 46-52 64z" fill="${c}"/><path d="M60 118Q58 60 58 10" stroke="#1B5E20" stroke-width="3" fill="none"/><path d="M20 40q20 6 36 18M16 70q20 0 40-6M96 38q-20 6-36 20M102 70q-20 0-42-6" stroke="#E6F4D8" stroke-width="5" fill="none" stroke-linecap="round" opacity=".55"/></svg>`;
const MACAW = (body, wing, tail) => `<svg viewBox="0 0 90 60" width="100%" height="100%"><path d="M30 34q-28 6-28 22q14-6 30-16z" fill="${tail}"/><ellipse cx="46" cy="30" rx="20" ry="11" fill="${body}"/><circle cx="66" cy="24" r="9" fill="${body}"/><path d="M73 22q9 2 8 10q-5-5-9-4z" fill="#2B2B2B"/><circle cx="68" cy="22" r="2" fill="#fff"/><circle cx="68" cy="22" r="1" fill="#111"/><g class="sc-flap"><path d="M40 26q-6-24 20-24q-4 16-12 26z" fill="${wing}"/></g></svg>`;
const BUTTERFLY = (a, b) => `<svg viewBox="0 0 40 30" width="100%" height="100%"><g class="sc-wing"><path d="M20 15Q8 -2 2 8q-2 10 18 7zM20 15Q10 30 4 24q-2-6 16-9z" fill="${a}"/><path d="M20 15Q32 -2 38 8q2 10-18 7zM20 15Q30 30 36 24q2-6-16-9z" fill="${a}"/><circle cx="9" cy="9" r="2.5" fill="${b}"/><circle cx="31" cy="9" r="2.5" fill="${b}"/></g><path d="M20 7v17" stroke="#2B2B2B" stroke-width="2" stroke-linecap="round"/></svg>`;
const LEAF = (c) => `<svg viewBox="0 0 30 20" width="100%" height="100%"><path d="M2 10Q14 -4 28 10Q14 24 2 10z" fill="${c}"/><path d="M2 10h24" stroke="#1B5E20" stroke-width="1"/></svg>`;
const CANOPY = (a, b) => { const R = rng(5); let o = ''; for (let i = 0; i < 18; i++) { const x = i * 24 + R() * 10, r = 18 + R() * 16; o += `<circle cx="${f1(x)}" cy="${f1(60 - r * 0.6)}" r="${f1(r)}"/>`; } return `<svg viewBox="0 0 420 80" preserveAspectRatio="none" width="50%" height="100%"><g fill="${a}">${o}</g><rect y="52" width="420" height="28" fill="${a}"/><path d="M0 62q60-12 120 0t120 0t120 0t60-4V80H0z" fill="${b}"/></svg>`; };

const SUN = `<svg viewBox="0 0 200 200" width="100%" height="100%"><g class="sc-spin-slow">${Array.from({ length: 16 }, (_, i) => `<path d="M100 6l7 30h-14z" fill="#FFB347" transform="rotate(${i * 22.5} 100 100)"/>`).join('')}</g><circle cx="100" cy="100" r="58" fill="#FFC857"/><circle cx="100" cy="100" r="46" fill="#FFD97A"/></svg>`;
const MOON = `<svg viewBox="0 0 100 100" width="100%" height="100%"><circle cx="50" cy="50" r="40" fill="#F4EBD0"/><circle cx="66" cy="40" r="34" style="fill:var(--sky1)"/><circle cx="34" cy="58" r="4" fill="#E0D3AE"/><circle cx="26" cy="40" r="3" fill="#E0D3AE"/></svg>`;
const dune = (c, k) => `<svg viewBox="0 0 400 70" preserveAspectRatio="none" width="50%" height="100%"><path d="M0 70V44C40 14 90 12 130 36S210 56 250 26 340 8 400 44V70z" fill="${c}"/><path d="M130 36C160 50 200 54 250 26" stroke="${k}" stroke-width="2" fill="none" opacity=".6"/></svg>`;
const CAMEL = `<svg viewBox="0 0 100 70" width="100%" height="100%"><g fill="#8C5A2B"><path d="M14 34q2-16 16-14q6-14 16-4q10-10 18 2q10 0 12 10v8H14z"/><path d="M74 30q6-2 8-14q2-10 10-8q4 2 2 6q-4 0-5 4q-2 12-9 16z"/><rect x="20" y="40" width="5" height="26" rx="2" class="sc-leg"/><rect x="30" y="40" width="5" height="26" rx="2" class="sc-leg2"/><rect x="58" y="40" width="5" height="26" rx="2" class="sc-leg"/><rect x="67" y="40" width="5" height="26" rx="2" class="sc-leg2"/></g><path d="M34 22q10-6 20 0" stroke="#D8412F" stroke-width="5" fill="none"/><path d="M36 26h18" stroke="#2E7F8F" stroke-width="3"/></svg>`;
const PYRAMIDS = `<svg viewBox="0 0 300 90" width="100%" height="100%"><path d="M40 90L110 18l70 72z" fill="#E1A95F"/><path d="M110 18l70 72h-40z" fill="#C98A45"/><path d="M160 90l54-52 54 52z" fill="#E7B46E"/><path d="M214 38l54 52h-30z" fill="#CF9450"/></svg>`;
const TUMBLE = `<svg viewBox="0 0 40 40" width="100%" height="100%"><g fill="none" stroke="#9C7A48" stroke-width="2"><circle cx="20" cy="20" r="17"/><path d="M5 14q15 10 30-2M6 28q14-12 28 4M14 4q8 16 2 32M28 6q-10 14-2 30"/></g></svg>`;
const OASIS = `<svg viewBox="0 0 120 90" width="100%" height="100%"><ellipse cx="60" cy="84" rx="54" ry="6" fill="#4FB6C9"/>${[30, 62, 90].map((x, i) => `<g class="sc-palm" style="animation-delay:-${i * 1.3}s"><path d="M${x} 84q-4-${30 + i * 6} 4-${50 + i * 4}" stroke="#7A4A2A" stroke-width="4" fill="none"/><path d="M${x + 4} ${34 - i * 4}q-16-8-28 4q14-2 28-4zM${x + 4} ${34 - i * 4}q15-11 30-1q-16 0-30 1zM${x + 4} ${34 - i * 4}q-6-15-20-14q11 6 20 14zM${x + 4} ${34 - i * 4}q10-14 24-11q-14 3-24 11z" fill="#3E9A4A"/></g>`).join('')}</svg>`;
const HAWK = `<svg viewBox="0 0 60 24" width="100%" height="100%"><g class="sc-flap"><path d="M2 14Q16 2 30 12Q44 2 58 14Q44 10 30 16Q16 10 2 14z" fill="#5A3A22"/></g></svg>`;

const PEAKS = (a, b) => `<svg viewBox="0 0 400 120" preserveAspectRatio="none" width="100%" height="100%"><path d="M0 120L60 40l40 40 60-70 70 80 50-44 60 60 60-30V120z" fill="${a}"/><path d="M60 40l14 20-10-2-8 8zM160 10l20 26-12-4-10 10-8-12zM280 46l16 18-10-2z" fill="#fff"/><path d="M0 120l90-40 70 30 90-50 80 50 70-20V120z" fill="${b}"/></svg>`;
const BERG = `<svg viewBox="0 0 120 70" width="100%" height="100%"><path d="M10 40l20-26 18 10 16-20 26 22 18 14z" fill="#F4FBFF"/><path d="M64 4l26 22-20 4z" fill="#CFE6F7"/><path d="M8 40h104l-14 26H24z" fill="#9CCBEA" opacity=".6"/></svg>`;
const PENGUIN = `<svg viewBox="0 0 30 44" width="100%" height="100%"><g class="sc-waddle"><ellipse cx="15" cy="24" rx="12" ry="17" fill="#1F2533"/><ellipse cx="15" cy="27" rx="8" ry="13" fill="#fff"/><circle cx="15" cy="10" r="8" fill="#1F2533"/><circle cx="12" cy="9" r="1.6" fill="#fff"/><circle cx="18" cy="9" r="1.6" fill="#fff"/><path d="M13 12h4l-2 3z" fill="#F4A340"/><path d="M8 41h6M16 41h6" stroke="#F4A340" stroke-width="3" stroke-linecap="round"/></g></svg>`;
const SPARK = (c) => `<svg viewBox="0 0 20 20" width="100%" height="100%"><path d="M10 0l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="${c}"/></svg>`;

const SATELLITE = `<svg viewBox="0 0 60 30" width="100%" height="100%"><rect x="0" y="9" width="20" height="12" fill="#3F6FD8" stroke="#BFD0FF" stroke-width="1"/><path d="M5 9v12M10 9v12M15 9v12" stroke="#BFD0FF" stroke-width=".8"/><rect x="40" y="9" width="20" height="12" fill="#3F6FD8" stroke="#BFD0FF" stroke-width="1"/><path d="M45 9v12M50 9v12M55 9v12" stroke="#BFD0FF" stroke-width=".8"/><rect x="21" y="7" width="18" height="16" rx="2" fill="#F0B429"/><circle cx="30" cy="4" r="3" fill="#E6E9F5"/><path d="M30 7V4" stroke="#E6E9F5"/></svg>`;
const MOONBALL = `<svg viewBox="0 0 60 60" width="100%" height="100%"><circle cx="30" cy="30" r="28" fill="#D9DCE6"/><circle cx="20" cy="22" r="6" fill="#BFC3D1"/><circle cx="38" cy="36" r="8" fill="#BFC3D1"/><circle cx="36" cy="16" r="3.5" fill="#BFC3D1"/><circle cx="30" cy="30" r="28" fill="url(#mshade)"/><defs><radialGradient id="mshade" cx=".35" cy=".3" r=".8"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient></defs></svg>`;
const ROCKET = `<svg viewBox="0 0 30 80" width="100%" height="100%"><path d="M15 2q12 14 10 44H5Q3 16 15 2z" fill="#F4F6FF"/><circle cx="15" cy="24" r="5" fill="#3F6FD8" stroke="#1D2F7A" stroke-width="1.5"/><path d="M5 38l-5 14 6-3zM25 38l5 14-6-3z" fill="#D8412F"/><rect x="8" y="46" width="14" height="5" fill="#9AA3C4"/><g class="sc-flame"><path d="M9 51q6 26 6 26q0 0 6-26z" fill="#FFB347"/><path d="M12 51q3 14 3 14t3-14z" fill="#FFF3B0"/></g></svg>`;
const ISS = `<svg viewBox="0 0 90 40" width="100%" height="100%"><g fill="#9DB2FF"><rect x="0" y="4" width="14" height="32"/><rect x="16" y="4" width="14" height="32"/><rect x="60" y="4" width="14" height="32"/><rect x="76" y="4" width="14" height="32"/></g><rect x="28" y="17" width="34" height="6" fill="#E6E9F5"/><rect x="38" y="12" width="14" height="16" rx="2" fill="#F0F2FA"/></svg>`;

/* ------------------------------------------------------------------ scenes */
const pick = (R, a) => a[Math.floor(R() * a.length)];
const rn = (R, a, b) => a + R() * (b - a);
/* d = duration, dl = delay (negative: already under way, so a scene is full the moment it appears) */
const T = (R, d0, d1) => `--d:${f1(rn(R, d0, d1))}s;--dl:-${f1(rn(R, 0, d1))}s;`;

function atlas(R) {
  let o = E('sky');
  o += E('a-spin', 'right:-8vmin;top:9vh;width:min(46vmin,420px);aspect-ratio:1;opacity:.8;--d:90s', compassRose());
  for (let i = 0; i < 6; i++) o += E('a-across', `top:${f1(rn(R, 4, 38))}vh;width:${f1(rn(R, 120, 240))}px;aspect-ratio:200/70;opacity:${f1(rn(R, 0.55, 0.95))};${T(R, 70, 130)}`, CLOUD(pick(R, ['#FFFFFF', '#FFF8EC', '#FDF1DC'])));
  o += E('a-across', `top:14vh;width:clamp(46px,6vw,76px);aspect-ratio:60/92;${T(R, 60, 90)}`, E('a-bob', 'inset:0;--d:6s', BALLOON('#E4572E', '#F6C343', '#2E9CA6')));
  o += E('a-acrossR', `top:26vh;width:clamp(34px,4.5vw,56px);aspect-ratio:60/92;${T(R, 80, 120)}`, E('a-bob', 'inset:0;--d:7s', BALLOON('#3F51D8', '#FFFFFF', '#E4572E')));
  for (let i = 0; i < 7; i++) o += E('a-across', `top:${f1(rn(R, 8, 44))}vh;width:${f1(rn(R, 26, 46))}px;aspect-ratio:2;${T(R, 22, 40)}`, E('a-bob', `inset:0;--d:${f1(rn(R, 2.5, 4))}s`, BIRD()));
  o += E('island', 'left:6vw;bottom:15vh;width:clamp(120px,15vw,200px);aspect-ratio:160/84', ISLAND);
  o += E('island', 'right:10vw;bottom:16vh;width:clamp(80px,9vw,130px);aspect-ratio:160/84;opacity:.8', ISLAND);
  o += E('a-dive', 'right:24vw;bottom:6vh;width:70px;aspect-ratio:80/52;--d:16s', TAIL);
  o += E('a-roll', 'bottom:12vh;height:9vh;--d:34s;opacity:.75', strip(wave('#7FC4D8', '#fff')));
  o += E('a-across', 'bottom:10vh;width:clamp(110px,13vw,180px);aspect-ratio:1.2;--d:70s;--dl:-20s', E('a-rock', 'inset:0;--d:5s', SHIP));
  o += E('a-rollR', 'bottom:5vh;height:10vh;--d:26s', strip(wave('#4FA8C4', '#E8F7FB')));
  o += E('a-roll', 'bottom:0;height:9vh;--d:18s', strip(wave('#2E7F8F', '#BFE8EF')));
  for (let i = 0; i < 10; i++) o += E('a-twinkle', `left:${f1(rn(R, 2, 98))}vw;bottom:${f1(rn(R, 1, 16))}vh;width:${f1(rn(R, 8, 14))}px;aspect-ratio:1;${T(R, 2, 5)}`, SPARK('#FFFFFF'));
  return o;
}

function ocean(R) {
  let o = E('sky');
  for (let i = 0; i < 6; i++) o += E('ray a-ray', `left:${f1(8 + i * 16 + rn(R, -4, 4))}vw;width:${f1(rn(R, 6, 12))}vw;${T(R, 8, 14)}`);
  o += E('a-acrossR', `top:20vh;width:clamp(260px,36vw,520px);aspect-ratio:3;opacity:.16;--d:120s;--dl:-40s`, `<svg viewBox="0 0 300 100" width="100%" height="100%"><path d="M10 50q40-40 140-36q90 4 120 30l26-24q-4 30 0 60l-26-24q-40 34-130 30Q40 84 10 50z" fill="#0B3C5D"/></svg>`);
  o += E('a-across', `top:${f1(rn(R, 30, 50))}vh;width:clamp(200px,24vw,340px);aspect-ratio:2.5;opacity:.85;${T(R, 38, 60)}`, E('a-bob', 'inset:0;--d:4s', SCHOOL('#F2C94C')));
  o += E('a-acrossR', `top:${f1(rn(R, 14, 30))}vh;width:clamp(180px,20vw,300px);aspect-ratio:2.5;opacity:.7;${T(R, 44, 70)}`, E('a-bob', 'inset:0;--d:5s', SCHOOL('#9BE7FF')));
  const kinds = [['#FF8A3D', '#E0561B', true], ['#3FB0FF', '#1B6FD8'], ['#FFD23F', '#F29E1F'], ['#7C5CFF', '#4E33D6'], ['#2ED3A0', '#159C74'], ['#FF6B6B', '#C94040']];
  for (let i = 0; i < 12; i++) { const k = pick(R, kinds), right = R() < 0.5, w = rn(R, 34, 70);
    o += E(right ? 'a-across' : 'a-acrossR', `top:${f1(rn(R, 12, 78))}vh;width:${f1(w)}px;aspect-ratio:2;${T(R, 16, 38)}`, E('a-bob', `inset:0;--d:${f1(rn(R, 2, 4))}s`, `<div class="${right ? 'flipx' : ''}" style="width:100%;height:100%">${FISH(...k)}</div>`)); }
  o += E('a-across', `top:58vh;width:clamp(90px,11vw,150px);aspect-ratio:110/70;--d:64s;--dl:-10s`, E('a-bob', 'inset:0;--d:6s', TURTLE));
  for (let i = 0; i < 4; i++) o += E('a-riseslow', `left:${f1(rn(R, 6, 92))}vw;width:${f1(rn(R, 34, 58))}px;aspect-ratio:44/70;${T(R, 30, 50)}`, JELLY(pick(R, ['#B79CF2', '#8FD3FF', '#FFB3A7', '#A6F0C6'])));
  for (let i = 0; i < 22; i++) o += E('a-rise bubble', `left:${f1(rn(R, 1, 99))}vw;width:${f1(rn(R, 6, 22))}px;${T(R, 9, 22)}`);
  o += E('sand');
  for (let i = 0; i < 12; i++) { const h = rn(R, 14, 30); o += E('a-sway', `left:${f1(rn(R, 0, 97))}vw;bottom:0;width:${f1(rn(R, 26, 44))}px;height:${f1(h)}vh;transform-origin:50% 100%;${T(R, 5, 9)}`, KELP(pick(R, ['#2E9D5B', '#46B86B', '#1F7A4A', '#7CC36A']), 200)); }
  for (let i = 0; i < 4; i++) o += E('coral', `left:${f1(i * 26 + rn(R, 0, 10))}vw;bottom:0;width:clamp(100px,13vw,170px);aspect-ratio:1.5`, CORAL(pick(R, ['#FF7F6E', '#FF9F43', '#E86AA6']), pick(R, ['#F6C343', '#7C5CFF', '#2ED3A0'])));
  return o;
}

function jungle(R) {
  let o = E('sky');
  for (let i = 0; i < 4; i++) o += E('beam a-beam', `left:${f1(10 + i * 22 + rn(R, -5, 5))}vw;${T(R, 7, 12)}`);
  o += E('a-roll', 'bottom:0;height:30vh;--d:120s;opacity:.55', strip(CANOPY('#7CB65A', '#5E9E44')));
  o += E('a-rollR', 'bottom:0;height:20vh;--d:90s;opacity:.9', strip(CANOPY('#3F8A3A', '#2E6E2C')));
  for (let i = 0; i < 7; i++) o += E('a-sway', `left:${f1(i * 15 + rn(R, 0, 8))}vw;top:-2vh;width:${f1(rn(R, 34, 56))}px;height:${f1(rn(R, 22, 48))}vh;transform-origin:50% 0;${T(R, 6, 11)}`, VINE(pick(R, ['#2E7D32', '#33691E']), pick(R, ['#4CAF50', '#66BB6A', '#8BC34A'])));
  o += E('a-sway', 'left:-4vw;bottom:-4vh;width:clamp(140px,18vw,240px);aspect-ratio:1;transform-origin:30% 100%;--d:8s', MONSTERA('#2E8B3E'));
  o += E('a-sway', 'right:-5vw;bottom:-3vh;width:clamp(150px,20vw,260px);aspect-ratio:1;transform-origin:70% 100%;--d:9s;--dl:-3s', MONSTERA('#3FA34D'));
  o += E('a-sway', 'right:-3vw;top:-4vh;width:clamp(110px,14vw,190px);aspect-ratio:1;transform-origin:70% 0;rotate:180deg;--d:10s', MONSTERA('#2E8B3E'));
  const birds = [['#E53935', '#1E88E5', '#FDD835'], ['#1E88E5', '#FDD835', '#1565C0'], ['#FDD835', '#43A047', '#1E88E5']];
  for (let i = 0; i < 4; i++) { const b = birds[i % 3], right = i % 2 === 0;
    o += E(right ? 'a-across' : 'a-acrossR', `top:${f1(rn(R, 6, 40))}vh;width:${f1(rn(R, 70, 110))}px;aspect-ratio:1.5;${T(R, 18, 32)}`, E('a-bob', 'inset:0;--d:2.4s', `<div class="${right ? '' : 'flipx'}" style="width:100%;height:100%">${MACAW(...b)}</div>`)); }
  for (let i = 0; i < 8; i++) o += E('a-flutter', `left:${f1(rn(R, 2, 90))}vw;top:${f1(rn(R, 20, 80))}vh;width:${f1(rn(R, 24, 40))}px;aspect-ratio:4/3;${T(R, 14, 26)}`, BUTTERFLY(pick(R, ['#FF9800', '#29B6F6', '#EC407A', '#FFEB3B', '#AB47BC']), '#fff'));
  for (let i = 0; i < 10; i++) o += E('a-fall', `left:${f1(rn(R, 0, 100))}vw;width:${f1(rn(R, 16, 28))}px;aspect-ratio:1.5;${T(R, 14, 26)}`, E('a-sway', 'inset:0;--d:3s;transform-origin:50% 0', LEAF(pick(R, ['#66BB6A', '#9CCC65', '#43A047', '#C0CA33']))));
  for (let i = 0; i < 16; i++) o += E('a-float mote', `left:${f1(rn(R, 2, 98))}vw;top:${f1(rn(R, 10, 90))}vh;${T(R, 6, 14)}`);
  return o;
}

function desert(R) {
  let o = E('sky');
  o += E('sc-day a-breathe', 'right:7vw;top:6vh;width:min(28vmin,260px);aspect-ratio:1;--d:10s', SUN);
  o += E('sc-night a-breathe', 'right:9vw;top:8vh;width:min(16vmin,150px);aspect-ratio:1;--d:12s', MOON);
  for (let i = 0; i < 26; i++) o += E('sc-night a-twinkle', `left:${f1(rn(R, 1, 99))}vw;top:${f1(rn(R, 2, 50))}vh;width:${f1(rn(R, 6, 13))}px;aspect-ratio:1;${T(R, 2, 5)}`, SPARK('#FFF4D6'));
  for (let i = 0; i < 3; i++) o += E('sc-day a-across', `top:${f1(rn(R, 6, 26))}vh;width:${f1(rn(R, 140, 220))}px;aspect-ratio:200/70;opacity:.8;${T(R, 90, 140)}`, CLOUD('#FFF8EC'));
  o += E('pyr', 'left:8vw;bottom:24vh;width:clamp(180px,26vw,360px);aspect-ratio:300/90;opacity:.75', PYRAMIDS);
  o += E('a-circle', 'left:30vw;top:18vh;width:0;height:0;--d:24s', E('hawk', 'left:12vw;top:0;width:54px;aspect-ratio:2.5', HAWK));
  o += E('a-circle', 'left:62vw;top:12vh;width:0;height:0;--d:30s;--dl:-9s', E('hawk', 'left:8vw;top:0;width:42px;aspect-ratio:2.5', HAWK));
  o += E('a-roll', 'bottom:12vh;height:22vh;--d:90s', strip(dune('#F2C98A', '#D9A35F')));
  o += E('oasis', 'right:14vw;bottom:14vh;width:clamp(110px,13vw,180px);aspect-ratio:120/90', OASIS);
  for (let i = 0; i < 4; i++) o += E('a-caravan', `bottom:${f1(15 + (i % 2) * 0.6)}vh;width:clamp(70px,8vw,110px);aspect-ratio:100/70;--d:80s;--dl:-${f1(i * 3.4 + 10)}s`, E('a-bob', 'inset:0;--d:1.2s', CAMEL));
  o += E('a-rollR', 'bottom:4vh;height:16vh;--d:60s', strip(dune('#E9B06A', '#C98A45')));
  o += E('a-roll', 'bottom:0;height:10vh;--d:40s', strip(dune('#D9974F', '#B8763A')));
  o += E('shimmer a-shimmer', '--d:4s');
  for (let i = 0; i < 3; i++) o += E('a-across', `bottom:${f1(rn(R, 2, 9))}vh;width:${f1(rn(R, 28, 44))}px;aspect-ratio:1;${T(R, 14, 24)}`, E('a-spin', 'inset:0;--d:1.8s', TUMBLE));
  for (let i = 0; i < 12; i++) o += E('a-skim wisp', `top:${f1(rn(R, 55, 96))}vh;width:${f1(rn(R, 8, 20))}vw;${T(R, 6, 14)}`);
  return o;
}

function aurora(R) {
  let o = E('sky');
  for (let i = 0; i < 40; i++) o += E('a-twinkle', `left:${f1(rn(R, 1, 99))}vw;top:${f1(rn(R, 1, 55))}vh;width:${f1(rn(R, 5, 12))}px;aspect-ratio:1;${T(R, 2, 6)}`, SPARK(pick(R, ['#FFFFFF', '#CFE4FF', '#E6DAFF'])));
  const cur = ['#3CF0A8', '#9B6BFF', '#45B6FF', '#5CFFC8', '#C77DFF'];
  for (let i = 0; i < 5; i++) o += E('curtain a-curtain', `left:${f1(-12 + i * 22 + rn(R, -4, 4))}vw;--c:${cur[i]};${T(R, 12, 20)}`);
  for (let i = 0; i < 2; i++) o += E('a-shoot', `left:${f1(rn(R, 10, 70))}vw;top:${f1(rn(R, 4, 24))}vh;--d:${f1(rn(R, 9, 15))}s;--dl:-${f1(rn(R, 0, 9))}s`);
  o += E('peaks', 'left:0;right:0;bottom:12vh;height:26vh;opacity:.95', PEAKS('#8FA9D8', '#6E8BC6'));
  o += E('ice', 'left:0;right:0;bottom:0;height:13vh');
  for (let i = 0; i < 3; i++) o += E('a-across', `bottom:${f1(rn(R, 3, 8))}vh;width:${f1(rn(R, 90, 150))}px;aspect-ratio:120/70;${T(R, 90, 140)}`, E('a-bob', 'inset:0;--d:5s', BERG));
  for (let i = 0; i < 5; i++) o += E(i % 2 ? 'a-waddleR' : 'a-waddle', `bottom:${f1(rn(R, 11, 13))}vh;width:${f1(rn(R, 22, 32))}px;aspect-ratio:30/44;--d:${f1(rn(R, 50, 80))}s;--dl:-${f1(rn(R, 0, 60))}s`, `<div class="${i % 2 ? 'flipx' : ''}" style="width:100%;height:100%">${PENGUIN}</div>`);
  for (let i = 0; i < 40; i++) o += E('a-snow flake', `left:${f1(rn(R, 0, 100))}vw;width:${f1(rn(R, 3, 8))}px;${T(R, 10, 22)}`);
  return o;
}

function orbit(R) {
  let o = E('sky');
  for (let i = 0; i < 3; i++) o += E('nebula a-breathe', `left:${f1(rn(R, -10, 70))}vw;top:${f1(rn(R, -10, 50))}vh;--c:${['#7C5CFF', '#FF5AD9', '#22E3FF'][i]};${T(R, 14, 24)}`);
  o += E('a-roll starfield', '--d:160s');
  o += E('a-rollR starfield far', '--d:240s');
  for (let i = 0; i < 36; i++) o += E('a-twinkle', `left:${f1(rn(R, 1, 99))}vw;top:${f1(rn(R, 1, 98))}vh;width:${f1(rn(R, 5, 12))}px;aspect-ratio:1;${T(R, 1.5, 5)}`, SPARK(pick(R, ['#FFFFFF', '#FFE9A8', '#BFD0FF'])));
  /* the Earth: the app's own map, painted into the strip by paintEarth() after mount */
  o += E('earth', '', `<div class="scn a-spinmap s-earthmap" style="--d:90s"></div><div class="scn a-spinmap s-clouds" style="--d:55s"></div><div class="scn s-earthshade"></div>`);
  o += E('orbit-c a-spin', '--d:26s', E('sat', 'left:100%;top:50%;width:54px;aspect-ratio:2', SATELLITE));
  o += E('orbit-c o2 a-spin', '--d:44s;--dl:-12s', E('sat', 'left:100%;top:50%;width:40px;aspect-ratio:2', SATELLITE));
  o += E('orbit-c o3 a-spin', '--d:80s;--dl:-30s', E('sat moon', 'left:100%;top:50%;width:64px;aspect-ratio:1', MOONBALL));
  o += E('a-iss', 'top:10vh;width:88px;aspect-ratio:90/40;--d:36s;--dl:-8s', ISS);
  o += E('a-launch', 'right:7vw;width:34px;aspect-ratio:30/80;--d:28s;--dl:-6s', ROCKET);
  for (let i = 0; i < 3; i++) o += E('a-shoot', `left:${f1(rn(R, 20, 80))}vw;top:${f1(rn(R, 2, 30))}vh;--d:${f1(rn(R, 7, 13))}s;--dl:-${f1(rn(R, 0, 9))}s`);
  return o;
}

const BUILD = { atlas, ocean, jungle, desert, aurora, orbit };
export const SCENE_IDS = Object.keys(BUILD);
export function sceneHTML(theme, seed = 7) {
  const b = BUILD[theme] || BUILD.atlas;
  return `<div class="scene-in sc-${theme in BUILD ? theme : 'atlas'}">${b(rng(seed))}</div>`;
}

/* ------------------------------------------------------------------ the Earth */
let EARTH_URL = null;
export async function paintEarth(root) {
  const el = root.querySelector('.s-earthmap'), cl = root.querySelector('.s-clouds');
  if (!el || typeof document === 'undefined') return;
  if (!EARTH_URL) {
    const { worldFeatures } = await import('./map.js');
    const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), proj = geoEquirectangular().fitSize([W, H], { type: 'Sphere' }), path = geoPath(proj, g);
    const sea = g.createLinearGradient(0, 0, 0, H); sea.addColorStop(0, '#2A6FD6'); sea.addColorStop(0.5, '#1E5BC0'); sea.addColorStop(1, '#2A6FD6');
    g.fillStyle = sea; g.fillRect(0, 0, W, H);
    g.fillStyle = '#4FB06A';
    for (const f of worldFeatures()) { g.beginPath(); path(f); g.fill(); }
    g.fillStyle = 'rgba(245,250,255,.9)'; g.fillRect(0, 0, W, 16); g.fillRect(0, H - 34, W, 34);   // the ice caps
    EARTH_URL = c.toDataURL('image/png');
  }
  el.style.backgroundImage = `url(${EARTH_URL})`;
  if (cl && !cl.dataset.done) {
    const R = rng(3); let s = '';
    for (let i = 0; i < 26; i++) s += `<ellipse cx="${f1(R() * 400)}" cy="${f1(20 + R() * 160)}" rx="${f1(14 + R() * 34)}" ry="${f1(4 + R() * 8)}" fill="#fff" opacity="${f1(0.35 + R() * 0.45)}"/>`;
    cl.innerHTML = `<svg viewBox="0 0 400 200" preserveAspectRatio="none" width="50%" height="100%">${s}</svg><svg viewBox="0 0 400 200" preserveAspectRatio="none" width="50%" height="100%">${s}</svg>`;
    cl.dataset.done = '1';
  }
}

/* ------------------------------------------------------------------ mount */
let CUR = null;
export function syncScene(theme, calm) {
  if (typeof document === 'undefined') return;
  const host = document.getElementById('scene'); if (!host) return;
  document.documentElement.classList.toggle('sc-calm', !!calm);
  if (theme === CUR) return;
  CUR = theme;
  host.innerHTML = sceneHTML(theme, 7);
  if (theme === 'orbit') paintEarth(host).catch(() => {});
}
