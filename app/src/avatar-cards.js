/* avatar-cards.js — the deck (Bizzing Bee's, the owner: "tap the avatar in the hello card"): every face is
   a trading card — an overall and four stats, its rank among all 96 and among the child's own, a title, a
   line of story, a power, one true fact, and its HISTORY with this child (free from day one, bought on a
   date, waiting for a medal). Tapping the avatar on Home fans out the cards the child owns; ‹ › / ← → /
   a swipe flip them, and "Wear this" puts one on.

   The numbers are Bee's own arithmetic (a stable hash of the id and its tier), so a face that lives in
   both apps has the same card in both. Nothing here is random at play time, nothing is bought blind, and
   no stat changes what a child can do — a card is a thing to know, not a thing to grind. */

import { CATALOGUE, PACKS, TIERS, byAvatar } from './avatars.js';
import { LORE, CARDS_NEED_REVIEW } from './data/avatar-lore.js';
import { esc } from './ui.js';

const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const rnd = (seed) => { const x = Math.sin(seed) * 10000; return x - Math.floor(x); };
/* Bee's tiers (its "free" is our Common) and Bee's four stats, labelled as Bee labels them */
const TIER_STAT = { common: { base: 52, spread: 16 }, rare: { base: 62, spread: 18 }, epic: { base: 72, spread: 18 }, legendary: { base: 84, spread: 14 } };
export const STATS = [['spark', '⚡', 'Stamina'], ['wisdom', '🧠', 'Wisdom'], ['speed', '💨', 'Speed'], ['grit', '😎', 'Coolness']];
const RANK = { common: 'Rookie', rare: 'Explorer', epic: 'Pathfinder', legendary: 'Legend' };
const PACK_TITLE = { kit: 'of the Map Room', continents: 'of the Seven Continents', ocean: 'of the Open Ocean', deep: 'of the Deep', forest: 'of Forest and River',
  canopy: 'of the Canopy', oasis: 'of the Oasis', earth: 'of the Wild Earth', ice: 'of the Ice Floe', peaks: 'of the High Peaks', elements: 'of the Elements', beasts: 'of the Big Beasts' };
const PACK_COL = { kit: ['#8a5a2b', '#f2c14e'], continents: ['#2f8f5b', '#f4a62a'], ocean: ['#1f6fa8', '#5ad1e6'], deep: ['#23305e', '#7f6cf0'], forest: ['#2f7a3d', '#a3d977'],
  canopy: ['#1d6b4f', '#f05a5a'], oasis: ['#c0862d', '#f6d27a'], earth: ['#b2452c', '#f2a03d'], ice: ['#3a7bbf', '#cfe9ff'], peaks: ['#5b6b7a', '#e2c38b'], elements: ['#6c4fe0', '#ffc23d'], beasts: ['#4a3b2a', '#c9a227'] };
const POWER_BY_TOP = { spark: ['Endless Engine', 'Second Wind', 'Power Core'], wisdom: ['Big Brain', 'Mind Palace', 'Deep Knowing'], speed: ['Quick Draw', 'Blink Step', 'Fast Forward'], grit: ['Ice Cool', 'Unflappable', 'Steady Nerve'] };

function statsFor(id, tier) {
  const t = TIER_STAT[tier] || TIER_STAT.common, out = {};
  STATS.forEach(([k], i) => { const v = t.base + Math.round((rnd((hash(id + ':' + k) % 100000) + i) * 2 - 1) * t.spread); out[k] = Math.max(28, Math.min(99, v)); });
  return out;
}
const packOf = (a) => PACKS.find((p) => p.pack === a.pack);
export function card(id) {
  const a = byAvatar[id]; if (!a) return null;
  const p = packOf(a), stats = statsFor(id, a.tier), overall = Math.round((stats.spark + stats.wisdom + stats.speed + stats.grit) / 4);
  let top = 'spark'; for (const [k] of STATS) if (stats[k] > stats[top]) top = k;
  const pool = POWER_BY_TOP[top], L = LORE[id] || { lore: `${a.name}, ${p.blurb}`, fact: '' };
  const [c1, c2] = PACK_COL[p.id] || ['#6C4FE0', '#FFC23D'];
  return { id, name: a.name, tier: a.tier, tierLabel: TIERS[a.tier].label, rc: TIERS[a.tier].colour, pack: p.id, packLabel: p.name, c1, c2,
    title: `${RANK[a.tier]} ${PACK_TITLE[p.id] || ''}`.trim(), lore: L.lore, fact: L.fact, stats, overall, power: pool[hash(id + 'pw') % pool.length], top };
}
/* the ranking: all 96 by overall (a tie keeps catalogue order), and the child's own */
const ALL = CATALOGUE.map((a) => card(a.id)).sort((x, y) => y.overall - x.overall || CATALOGUE.findIndex((a) => a.id === x.id) - CATALOGUE.findIndex((a) => a.id === y.id));
export const rankOf = (id) => ALL.findIndex((c) => c.id === id) + 1;

/* the card's history with this child, from what the app already keeps: the free Commons, the wallet's
   own line for a purchase, the medal a Legendary waited for */
export function historyOf(id, { owned, ledger = [], wearing, milestone }) {
  const a = byAvatar[id], buy = ledger.find((x) => x.why === 'avatar:' + id);
  const date = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const lines = [];
  if (!owned) lines.push(a.tier === 'legendary' && milestone ? `Waits for a medal: ${milestone}, then its coins.` : `Not yours yet — ${TIERS[a.tier].price ? `${TIERS[a.tier].price} Bizzing coins in the Shop` : 'free'}.`);
  else if (buy) lines.push(`Joined your team on ${date(buy.t)} — ${Math.abs(buy.n)} Bizzing coins you earned by learning.`);
  else lines.push(a.tier === 'common' ? 'With you from your first day — a free Common.' : 'Yours from before the Shop opened.');
  if (owned && a.tier === 'legendary' && milestone) lines.push(`Unlocked by learning: ${milestone}.`);
  if (wearing) lines.push('You are wearing it now.');
  return lines;
}

export function cardHTML(id, { owned = true, history = [], mine = null } = {}) {
  const d = card(id); if (!d) return '';
  const bars = STATS.map(([k, g, l]) => { const v = d.stats[k], col = v >= 85 ? '#2FA35C' : v >= 68 ? '#3D7DF0' : v >= 50 ? '#E0922E' : '#9A8F7C';
    return `<div class="avc-stat"><span class="avc-stat-l">${g} ${l}</span><span class="avc-stat-bar"><i style="width:${Math.round((v / 99) * 100)}%;background:${col}"></i></span><b class="avc-stat-v">${v}</b></div>`; }).join('');
  return `<div class="avc-card avc-${d.tier}" style="--c1:${d.c1};--c2:${d.c2};--rc:${d.rc}">
    <div class="avc-foil" aria-hidden="true"></div>
    <div class="avc-top"><span class="avc-ovr"><b>${d.overall}</b><i>OVR</i></span>
      <span class="avc-badges"><span class="avc-rar">${esc(d.tierLabel)}</span><span class="avc-rank" title="Ranked by overall among all ninety-six">#${rankOf(id)} of 96${mine ? ` · #${mine[0]} of your ${mine[1]}` : ''}</span></span></div>
    <div class="avc-art${owned ? '' : ' locked'}">${owned ? `<img src="${esc(byAvatar[id].art)}" alt="" width="150" height="150">` : '<span class="avc-lock">🔒</span>'}</div>
    <div class="avc-name">${esc(d.name)}</div><div class="avc-title">${esc(d.title)}</div>
    <div class="avc-lore">${esc(d.lore)}</div>
    <div class="avc-stats">${bars}</div>
    <div class="avc-power"><b>⚡ ${esc(d.power)}</b> — its best is ${esc(STATS.find(([k]) => k === d.top)[2].toLowerCase())}.</div>
    ${d.fact ? `<div class="avc-fact"><span class="avc-fact-h">💡 Inspired by</span>${esc(d.fact)}</div>` : ''}
    ${history.length ? `<div class="avc-hist"><span class="avc-fact-h">📜 Its story with you</span>${history.map((h) => `<span>${esc(h)}</span>`).join('')}</div>` : ''}
    <div class="avc-pack"><span class="avc-dot"></span>${esc(d.packLabel)}</div></div>`;
}

/* the deck over the app: the cards the child owns, the one they wear first */
export function deckHTML(ids, i, ctx) {
  const id = ids[i], multi = ids.length > 1, wearing = ctx.wearing === id, owned = ctx.owned.includes(id);
  const mine = ctx.owned.slice().sort((x, y) => card(y).overall - card(x).overall);
  return `<div class="avc-ov avdeck-ov" role="dialog" aria-label="Your avatar cards" data-deck>
    <div class="avdeck-stage">
      ${multi ? '<div class="avd-ghost avd-g2" aria-hidden="true"></div><div class="avd-ghost avd-g1" aria-hidden="true"></div>' : ''}
      <div class="avc-wrap avd-live">${cardHTML(id, { owned, history: historyOf(id, { owned, ledger: ctx.ledger, wearing, milestone: ctx.milestone(id) }), mine: owned ? [mine.indexOf(id) + 1, mine.length] : null })}</div>
      ${multi ? '<button class="avd-nav avd-prev" data-act="deckGo" data-arg="-1" aria-label="Previous card">‹</button><button class="avd-nav avd-next" data-act="deckGo" data-arg="1" aria-label="Next card">›</button>' : ''}
    </div>
    <div class="avd-bar">${multi ? `<span class="avd-count">${i + 1} / ${ids.length}${ctx.all ? '' : ' owned'}</span>` : ''}
      ${wearing ? '<span class="avc-worn">Wearing ✓</span>' : owned ? `<button class="btn primary" data-act="deckWear" data-arg="${esc(id)}">Wear this avatar</button>` : '<button class="btn" data-act="nav" data-arg="shop">See it in the Shop</button>'}
      ${ctx.all ? '' : '<button class="btn" data-act="deckAll">All 96 cards</button>'}
      <button class="btn ghost" data-act="deckClose">Close <kbd>Esc</kbd></button></div>
    ${CARDS_NEED_REVIEW ? '<p class="avd-note">The stories are made up; each “Inspired by” fact is real, and awaits a second reader.</p>' : ''}
  </div>`;
}
