/* kit.js — what every Bizzing Geography game shares (family standard §10): a title card
   with a three-step how-to, a finish card that names what was practised, and the small
   helpers the five puzzle games use. Scores are built on the DECISION — fewest steps,
   fewest guesses, fewest clues — never on luck. */
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
import { ico, gi } from '../icons.js';
export const readBtn = (sel, label = 'Read it to me') => `<button class="read-btn" data-act="read" data-arg="${esc(sel)}" aria-label="${esc(label)}" title="${esc(label)}">${ico('sound')}</button>`;
export { ico, gi };

/* the title card: art, name, three steps, then the ways to start (the first is primary) */
export function titleCard(T, { how, starts, best = '', note = '' }) {
  return `<div class="gm-title card">
    <div class="gm-art" style="background-image:url(art/${T.art}.webp)"><span class="gm-glyph" aria-hidden="true">${gi(T.glyph)}</span></div>
    <div class="gm-body">
      <h2>${esc(T.name)}</h2>
      <ol class="gm-how" id="gm-how" aria-label="How to play">${how.map((h, i) => `<li><b>${i + 1}</b><span>${h}</span></li>`).join('')}</ol>
      ${readBtn('#gm-how', 'Read how to play')}
      <div class="row gap wrap gm-starts">${starts.map((s, i) => `<button class="btn big${i ? '' : ' primary'}" data-act="lib" data-arg="${s[0]}">${s[1]}</button>`).join('')}</div>
      ${best ? `<p class="muted small">${best}</p>` : ''}${note ? `<p class="muted small">${note}</p>` : ''}
    </div></div>`;
}
/* the finish card: the result, what was practised, and the way back in */
export function finishCard({ kicker, title, count = null, lines = [], again, home }) {
  return `<div class="card end-card gm-end">
    <p class="kicker">${esc(kicker)}</p>
    <h2>${count != null ? `<span data-count="${count}">${count.toLocaleString('en-US')}</span> ` : ''}${title}</h2>
    ${lines.map((l) => `<p>${l}</p>`).join('')}
    <div class="row gap center">${again ? `<button class="btn primary big" data-act="lib" data-arg="${again[0]}">${again[1]}</button>` : ''}${home ? `<button class="btn big" data-act="lib" data-arg="${home}">Done</button>` : ''}</div></div>`;
}
/* a steady HUD row above a game */
export const hud = (items) => `<div class="gm-hud">${items.filter(Boolean).map((x) => `<span class="gm-chip">${x}</span>`).join('')}</div>`;
/* eight compass points from a bearing in degrees */
export const POINTS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
export const ARROWS = ['⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️'];
export const pointOf = (deg) => Math.round((((deg % 360) + 360) % 360) / 45) % 8;
