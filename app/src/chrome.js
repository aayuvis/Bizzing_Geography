/* chrome.js — the family layer every Bizzing app shares (standard v2 §1, §3–§5, §8):
   the top bar, the ☰ drawer, the tabs, the coin chip's wallet history, Settings in its
   five sections, the Shop (Avatars · Worlds · Extras), the Collection of 96, the medal
   shelf, My page and Help. Views here are `state → string`, like every other screen. */

import { R } from './runtime.js';
import { esc, plural } from './ui.js';
import { ico, gi } from './icons.js';
import { shelly, shellyHead, empty } from './mascot.js';
import { Store } from './store.js';
import { kid, BANDS, rankOf, RANKS, RANK_SRC, starsTotal, maxStars } from './model.js';
import { THEMES, themeOf } from './themes.js';
import { HIVE, APP, balance, ledger as walletLedger, ledgerWords } from './family.js';
import { PACKS, CATALOGUE, byAvatar, avCtx, stateOf, WORLD_IDS, worldNo, TIERS } from './avatars.js';
import { worldOpen, WORLD_PRICE, FREE_WORLDS } from './bizzing-avatars.js';
import { MEDALS, earned, medallion, SHOP, shopOf, PIN_PATH } from './rewards.js';
import { worldSVG } from './map.js';
import { GKEY } from './photos.js';
import { missDue, missCount } from './mistakes.js';
import { shell as famShell } from './bizzing-shell.js';

export const VERSION = '2.0';
const av = (id, size = 48, alt = '') => `<img class="av" src="avatars/${esc(id)}.webp" width="${size}" height="${size}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
const dark = () => document.documentElement.getAttribute('data-mode') === 'dark';
export const ctxOf = (k) => avCtx(R.h, k, Object.keys((k && k.medals) || {}));

/* ------------------------------------------------------------------ tabs */
export const TABS = [
  { k: 'home', n: 'Home', icon: 'home' },
  { k: 'atlas', n: 'Atlas', icon: 'map' },
  { k: 'exp', n: 'Expeditions', icon: 'flag' },
  { k: 'library', n: 'Library', icon: 'book' },
  { k: 'play', n: 'Play', icon: 'play' },
];
const NAV_OF = { lib: 'library', game: 'play', stop: 'atlas', world: 'atlas', road: 'atlas', expd: 'exp', proj: 'exp', run: null, me: null, grownups: null, privacy: null, settings: null, shop: null, collection: null, medals: null, help: null, search: null, mistakes: null };

/* ------------------------------------------------------------------ the top bar (§3) */
const HEX = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3l11.3 6.5v13L16 29 4.7 22.5v-13z" class="hx"/><path d="M16 10.5l5 2.9v5.8l-5 2.9-5-2.9v-5.8z" class="hx2"/></svg>';
export function topBar(k) {
  const inRun = inGame();
  const coins = k ? balance(k.name) : 0;
  return `<header class="top">
    ${inRun ? '' : `<a class="hive" href="${HIVE}" aria-label="Back to the Bizzing Hive" title="The Bizzing Hive — your day">${HEX}</a>`}
    <button class="tool burger" data-act="drawer" aria-label="Menu" aria-haspopup="dialog" aria-expanded="${!!R.ui.drawer}">${ico('menu')}</button>
    <button class="brand" data-act="nav" data-arg="home" aria-label="Bizzing Geography — home">${shellyHead(28)}<span class="brand-t"><span class="bz">Bizzing</span> <em>Geography</em></span></button>
    <span class="grow"></span>
    ${k ? `<button class="search-pill" data-act="nav" data-arg="search" aria-label="Search places, stops and words">${ico('search')}<span>Search places, stops, words…</span></button>` : ''}
    ${k ? `<button class="coin-chip" data-act="wallet" aria-label="${coins} Bizzing coins — your wallet">${ico('coin')}<b>${coins.toLocaleString('en-US')}</b></button>` : ''}
    <button class="tool t-mode" data-act="mode" data-hold="look" aria-label="${dark() ? 'Dark — switch to light' : 'Light — switch to dark'} (hold for worlds)" title="Light or dark · hold for worlds">${ico(dark() ? 'moon' : 'sun')}</button>
    <button class="tool t-lock" data-act="nav" data-arg="grownups" aria-label="Grown-ups" title="Grown-ups">${ico('lock')}</button>
    ${k ? `<button class="who" data-act="menu" aria-haspopup="menu" aria-expanded="${!!R.ui.menu}" aria-label="${esc(k.name)} — switch explorer">${av(k.avatar, 34, '')}<span class="who-v" aria-hidden="true">▾</span></button>` : ''}
  </header>`;
}
export function tabs(cl) {
  const nav = NAV_OF[R.ui.nav] !== undefined ? NAV_OF[R.ui.nav] : R.ui.nav;
  return TABS.map((t) => `<button class="${cl}${nav === t.k ? ' on' : ''}" data-act="nav" data-arg="${t.k}" ${nav === t.k ? 'aria-current="page"' : ''}>${ico(t.icon)}<span>${t.n}</span></button>`).join('');
}

/* The avatar menu (§3): every child, and "Add a child" for grown-ups. Switching never mixes data. */
export function whoMenu(k) {
  return `<div class="who-menu" role="menu" aria-label="Explorers">
    <p class="wm-h">Who is exploring?</p>
    ${R.h.kids.map((x) => `<button role="menuitemradio" aria-checked="${x.id === k.id}" class="wm-kid${x.id === k.id ? ' on' : ''}" data-act="switchKid" data-arg="${x.id}">${av(x.avatar, 32)}<b>${esc(x.name)}</b>${x.id === k.id ? ico('check') : ''}</button>`).join('')}
    ${R.demo ? '' : `<button role="menuitem" class="wm-i" data-act="nav" data-arg="welcome">${ico('plus')} Add an explorer</button>`}
    <hr><button role="menuitem" class="wm-i" data-act="nav" data-arg="me">${ico('user')} ${esc(k.name)}’s page</button>
  </div>`;
}

/* ------------------------------------------------------------------ the ☰ drawer (§3) */
export function drawer(k) {
  const due = k ? missDue(k).length : 0, nMiss = k ? missCount(k) : 0;
  const it = (act, arg, icon, label, extra = '') => `<button class="dr-i" data-act="${act}"${arg ? ` data-arg="${arg}"` : ''}>${ico(icon)}<span>${label}</span>${extra}</button>`;
  return `<div class="dr-scrim" data-act="drawer" aria-hidden="true"></div>
  <aside class="drawer" role="dialog" aria-modal="true" aria-label="Menu" id="drawer">
    <div class="dr-head">${shellyHead(36)}<b>Bizzing <em>Geography</em></b><button class="tool dr-x" data-act="drawer" aria-label="Close the menu">${ico('close')}</button></div>
    <nav class="dr-list" aria-label="Everything">
      ${k ? `${it('nav', 'me', 'user', 'My page')}${it('nav', 'shop', 'bag', 'Shop')}${it('nav', 'collection', 'cards', 'Collection', `<i>${CATALOGUE.filter((a) => stateOf(a.id, ctxOf(k)).state === 'owned').length}/96</i>`)}${it('nav', 'medals', 'medal', 'Medals', `<i>${earned(k).length}</i>`)}
      <hr>
      ${it('nav', 'road', 'road', 'Your journey')}${it('nav', 'mistakes', 'retry', 'My mistakes', nMiss ? `<i>${due ? due + ' ready' : nMiss}</i>` : '')}${it('nav', 'search', 'search', 'Search')}${it('openTool', 'geoguess', 'globe', 'Where on Earth?')}
      <hr>` : ''}
      ${it('nav', 'settings', 'gear', 'Settings')}${it('nav', 'grownups', 'lock', 'Grown-ups')}${it('nav', 'help', 'help', 'Help')}${it('nav', 'privacy', 'shield', 'Privacy')}
      <a class="dr-i" href="${HIVE}">${ico('hex')}<span>Back to the Hive</span></a>
    </nav>
    <div class="dr-quick">
      <button class="dr-q" data-act="sound" role="switch" aria-checked="${R.sound}">${ico(R.sound ? 'sound' : 'mute')}<span>${R.sound ? 'Sound on' : 'Sound off'}</span></button>
      <button class="dr-q" data-act="mode" role="switch" aria-checked="${dark()}">${ico(dark() ? 'moon' : 'sun')}<span>${dark() ? 'Dark' : 'Light'}</span></button>
    </div>
  </aside>`;
}

/* ------------------------------------------------------------------ the wallet history (§1.1) */
const nameOf = (id) => (byAvatar[id] ? byAvatar[id].name : id);
export function walletLines(k, n = 30) {
  const rows = walletLedger(k.name).slice(-n).reverse().map((x) => ledgerWords(x, nameOf));
  if (!rows.length) return `<p class="muted small">No coins yet. Every right answer pays one.</p>`;
  return `<ol class="ledger">${rows.map((x) => `<li class="${x.n > 0 ? 'in' : 'out'}"><b>${x.sign}${Math.abs(x.n)}</b><span>${esc(x.what)}</span><i class="app-${esc(x.a)}" title="Bizzing ${esc(x.app)}">${x.a === APP ? shellyHead(18) : `<span class="app-dot">${esc(x.app[0])}</span>`} ${esc(x.app)}</i></li>`).join('')}</ol>`;
}
export function walletSheet(k) {
  const c = balance(k.name);
  return `<div class="sheet-veil" data-act="wallet" aria-hidden="true"></div>
  <div class="sheet" role="dialog" aria-modal="true" aria-label="Your wallet" id="wallet-sheet">
    <div class="sheet-h"><h2>${ico('coin')} ${plural(c, 'Bizzing coin')}</h2><button class="tool" data-act="wallet" aria-label="Close the wallet">${ico('close')}</button></div>
    <p class="muted small">Bizzing coins are earned for learning in every Bizzing app — one for a right answer, five for a stop finished — and spent in the Shop at printed prices. Never bought, never by chance.</p>
    ${walletLines(k)}
    <div class="row gap center"><button class="btn primary" data-act="nav" data-arg="shop">${ico('bag')} Open the Shop</button></div>
  </div>`;
}

/* ------------------------------------------------------------------ Settings (§5) */
const sw = (act, on, label, sub = '') => `<div class="set-r"><span><b>${label}</b>${sub ? `<i>${sub}</i>` : ''}</span><button class="switch" role="switch" aria-checked="${!!on}" data-act="${act}" aria-label="${esc(label)}"><i></i></button></div>`;
const seg = (act, cur, opts, label) => `<div class="set-r"><span><b>${label}</b></span><div class="segp" role="radiogroup" aria-label="${esc(label)}">${opts.map(([v, l]) => `<button role="radio" aria-checked="${cur === v}" class="${cur === v ? 'on' : ''}" data-act="${act}" data-arg="${v}">${l}</button>`).join('')}</div></div>`;
export function worldCard(t, k, act = 'theme') {
  const n = worldNo(t.id), open = worldOpen(n, ctxOf(k)), on = themeOf(k) === t.id;
  return `<button class="world-thumb${on ? ' on' : ''}${open ? '' : ' locked'}" data-act="${open ? act : 'nav'}" data-arg="${open ? t.id : 'shop'}" role="radio" aria-checked="${on}" id="theme-${t.id}" aria-label="${esc(t.name)}${open ? '' : ' — opens with the family plan or 240 coins'}">
    <span class="wt-art" style="background-image:url(art/w${dark() ? 'n' : 'd'}-${t.id}-s.webp)">${open ? '' : ico('lock')}</span>
    <span class="wt-t"><b>${esc(t.name)}</b><i>${on ? 'Yours now' : open ? (n <= FREE_WORLDS ? 'Open to everyone' : 'Opened') : `Opens with the family plan or ${WORLD_PRICE} coins`}</i></span></button>`;
}
export function viewSettings() {
  const k = kid(R.h), dv = (key, fb) => Store.loadDevice(key, fb);
  const mode = dv('mode', null) || 'auto', text = dv('text', 'm'), vol = dv('vol', 40);
  const sec = (n, title, body) => `<section class="card set-sec" aria-labelledby="set-${n}"><h2 id="set-${n}">${title}</h2>${body}</section>`;
  return `<section class="settings-sheet">
    <header class="set-head">${R.ui.prev ? `<button class="back" data-act="back" aria-label="Back">${ico('back')} <span class="back-l">Back</span></button>` : '<span></span>'}<h1>${ico('gear')} Settings</h1><button class="tool" data-act="nav" data-arg="home" aria-label="Close settings">${ico('close')}</button></header>
    ${k ? sec(1, 'Me', `<label class="set-r"><span><b>Display name</b><i>A first name or nickname — nothing more.</i></span><input class="inp" id="set-name" data-set="name" value="${esc(k.name)}" maxlength="20" autocomplete="off"></label>
      <div class="set-r"><span><b>Avatar</b><i>${esc((byAvatar[k.avatar] || {}).name || '')}</i></span><button class="btn" data-act="nav" data-arg="collection">${av(k.avatar, 32)} Collection</button></div>
      ${R.h.kids.length > 1 ? `<div class="set-r"><span><b>Switch explorer</b></span><div class="row gap wrap">${R.h.kids.map((x) => `<button class="btn small${x.id === k.id ? ' primary-o' : ''}" data-act="switchKid" data-arg="${x.id}" aria-pressed="${x.id === k.id}">${av(x.avatar, 24)} ${esc(x.name)}</button>`).join('')}</div></div>` : ''}`) : ''}
    ${sec(2, 'Sound &amp; music', `${sw('sound', R.sound, 'Sound effects', 'Soft chimes for right, wrong, coins and medals.')}
      ${sw('music', dv('music', true), 'Music', 'A calm loop for each world, for home and for games — composed for Bizzing.')}
      <label class="set-r"><span><b>Volume</b><i>${vol}%</i></span><input type="range" min="0" max="100" step="5" value="${vol}" data-set="vol" aria-label="Volume" class="slider"></label>
      ${k ? sw('readAuto', autoReadOf(k), 'Read aloud', 'Each new question reads itself, in this device’s own voice. The speaker button is on every question.') : ''}
      ${k ? seg('rate', (k.prefs || {}).rate === 0.85 ? 'slow' : 'normal', [['slow', 'Slower'], ['normal', 'Normal']], 'Reading speed') : ''}`)}
    ${sec(3, 'Look', `${k ? `<p class="muted small">Your world: its colours, its letters, its living picture and its music. Worlds 1 and 2 are open to everyone; the others open with the family plan, or one at a time for ${WORLD_PRICE} Bizzing coins.</p>
      <div class="world-grid" role="radiogroup" aria-label="Your world">${THEMES.map((t) => worldCard(t, k)).join('')}</div>` : ''}
      ${seg('setMode', mode, [['light', 'Light'], ['dark', 'Dark'], ['auto', 'Match device']], 'Light or dark')}
      ${seg('setText', text, [['s', 'S'], ['m', 'M'], ['l', 'L']], 'Text size')}`)}
    ${sec(4, 'Comfort', `${sw('motion', dv('motion', false), 'Reduce motion', 'The living world holds still; no confetti, no spins.')}
      ${sw('calm', dv('calm', false), 'Calm mode', 'Music off, softer sounds, no confetti.')}`)}
    ${sec(5, 'Grown-ups', `<div class="set-r"><span><b>Grown-ups’ page</b><i>Age band, daily ring, plan, backup, restore, erase, tester mode — behind the PIN.</i></span><button class="btn" data-act="nav" data-arg="grownups">${ico('lock')} Open</button></div>`)}
    <footer class="set-foot"><button class="linkish" data-act="nav" data-arg="privacy">Privacy</button> · <button class="linkish" data-act="nav" data-arg="help">About</button> · Bizzing Geography ${VERSION}</footer>
  </section>`;
}
export const autoReadOf = (k) => (k.prefs || {}).readAuto ?? k.band === '6-7';

/* ------------------------------------------------------------------ the Collection (§8) */
export function avCard(a, k, ctx) {
  const st = stateOf(a.id, ctx), wearing = k.avatar === a.id;
  const btn = st.state === 'owned' ? (wearing ? '<span class="chip">Wearing</span>' : `<button class="btn small" data-act="setAv" data-arg="${a.id}">Wear</button>`)
    : st.state === 'buy' ? `<button class="btn small${st.short ? '' : ' primary-o'}" data-act="buyAv" data-arg="${a.id}" ${st.short ? 'aria-disabled="true"' : ''}>${ico('coin')} ${TIERS[a.tier].price}</button>` : '';
  return `<figure class="bz-av${wearing ? ' wearing' : ''}" data-tier="${a.tier}" data-state="${st.state}" id="av-${a.id}">
    <img src="${a.art}" alt="${esc(a.name)}" loading="lazy" decoding="async" width="96" height="96">
    <figcaption>${esc(a.name)} <b>${TIERS[a.tier].label}</b></figcaption><p class="av-say">${esc(st.say)}</p>${btn}</figure>`;
}
export function viewCollection() {
  const k = kid(R.h), ctx = ctxOf(k), mine = CATALOGUE.filter((a) => stateOf(a.id, ctx).state === 'owned').length;
  return `<section class="collection">
    ${head('Collection', `${mine} of 96 yours`)}
    <p class="card muted center-t small col-intro">Two packs live in each world. Commons are free to everyone; the others are bought with Bizzing coins once their world is open, and each Legendary first asks for a piece of learning. Nothing is ever drawn by chance.</p>
    ${THEMES.map((t, i) => { const n = i + 1, open = worldOpen(n, ctx);
      return `<div class="col-world card"><h2>${esc(t.name)} <span class="chip${open ? '' : ' locked'}">${open ? (n <= FREE_WORLDS ? 'Open to everyone' : 'Open') : `Opens with its world · ${WORLD_PRICE} coins`}</span></h2>
        ${PACKS.filter((p) => Math.ceil(p.pack / 2) === n).map((p) => `<div class="col-pack"><p class="av-pack-h"><b>${esc(p.name)}</b> <span>${esc(p.blurb)}</span></p>
          <div class="bz-grid">${CATALOGUE.filter((a) => a.pack === p.pack).map((a) => avCard(a, k, ctx)).join('')}</div></div>`).join('')}</div>`; }).join('')}
  </section>`;
}
const head = (title, sub = '') => `<header class="phead"><span></span><div class="phead-t"><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="phead-r"></div></header>`;

/* ------------------------------------------------------------------ the Shop (§1) */
export function viewShop() {
  const k = kid(R.h), ctx = ctxOf(k), tab = R.ui.shopTab || 'avatars', c = balance(k.name);
  const tb = (id, label, icon) => `<button role="tab" aria-selected="${tab === id}" class="${tab === id ? 'on' : ''}" data-act="shopTab" data-arg="${id}">${ico(icon)} ${label}</button>`;
  let body = '';
  if (tab === 'avatars') {
    const ready = CATALOGUE.filter((a) => ['buy', 'milestone'].includes(stateOf(a.id, ctx).state));
    const shut = CATALOGUE.filter((a) => stateOf(a.id, ctx).state === 'world').length;
    body = ready.length ? `<div class="bz-grid">${ready.map((a) => avCard(a, k, ctx)).join('')}</div>${shut ? `<p class="muted small center-t">${shut} more open with their worlds — see Worlds.</p>` : ''}`
      : empty('Every face in your open worlds is yours already. Open a new world to meet more.', `<button class="btn" data-act="shopTab" data-arg="worlds">See the worlds</button>`);
  } else if (tab === 'worlds') {
    body = `<div class="world-grid">${THEMES.map((t, i) => { const n = i + 1, open = worldOpen(n, ctx), short = Math.max(0, WORLD_PRICE - c);
      return `<div class="card world-buy${open ? ' open' : ''}"><span class="wt-art" style="background-image:url(art/w${dark() ? 'n' : 'd'}-${t.id}-s.webp)"></span><b>${esc(t.name)}</b><span class="muted small">${esc(t.blurb)}</span>
        ${open ? `<span class="chip">${n <= FREE_WORLDS ? 'Open to everyone' : 'Yours'}</span>` : `<span class="muted small">${short ? `${WORLD_PRICE} coins · ${short} more to go` : `${WORLD_PRICE} coins`} · or the family plan</span><button class="btn small${short ? '' : ' primary-o'}" data-act="buyWorld" data-arg="${n}" ${short ? 'aria-disabled="true"' : ''}>${ico('unlock')} Open for ${WORLD_PRICE}</button>`}</div>`; }).join('')}</div>`;
  } else {
    const sh = shopOf(k);
    body = `<p class="muted small">Looks for your maps: the pin you drop in Where on Earth? and the frame round every map. Nothing here changes your rank or opens a lesson — every lesson is already yours.</p>
      <ul class="shop">${SHOP.map((it) => { const id2 = it.id.split(':')[1], own = sh.owned.includes(it.id), use = sh[it.kind] === id2;
        return `<li class="shop-i${use ? ' on' : ''}"><span class="shop-look ${it.kind}" data-look="${id2}">${it.kind === 'pin' ? pinSwatch(id2) : ''}</span><b>${esc(it.name)}</b><span class="muted small">${esc(it.blurb)}</span>
        ${use ? '<span class="chip">In use</span>' : own ? `<button class="btn small" data-act="use" data-arg="${it.id}">Use</button>` : `<button class="btn small" data-act="buy" data-arg="${it.id}" ${c < it.price ? 'aria-disabled="true"' : ''}>${ico('coin')} ${it.price}</button>`}</li>`; }).join('')}</ul>`;
  }
  return `<section class="shop-page">
    ${head('Shop', `${ico('coin')} ${plural(c, 'Bizzing coin')}`)}
    <div class="seg shop-tabs" role="tablist" aria-label="The Shop">${tb('avatars', 'Avatars', 'cards')}${tb('worlds', 'Worlds', 'globe')}${tb('extras', 'Extras', 'pin')}</div>
    <div class="shop-body card">${body}</div>
    <div class="card"><h2>Wallet history</h2>${walletLines(k)}</div>
  </section>`;
}
export const pinSwatch = (shape) => `<svg viewBox="-12 -12 24 24" width="34" height="34" aria-hidden="true">${PIN_PATH[shape] ? `<path d="${PIN_PATH[shape]}" class="pin-shape"/>` : '<circle r="7" class="pin-shape"/>'}</svg>`;

/* ------------------------------------------------------------------ Medals */
export function medalShelf(k) {
  const got = earned(k).length;
  return `<div class="card" id="medals"><div class="row between wrap"><h2>Medals <span class="muted small">${got} of ${MEDALS.length}</span></h2><span class="muted small">Each one is earned by what you did — never by luck, never by days in a row.</span></div>
    <ol class="medal-shelf">${MEDALS.map((m) => { const on = (k.medals || {})[m.id]; return `<li class="${on ? 'got' : ''}" title="${esc(m.how)}">${medallion(m, 64, !!on)}<b>${esc(m.name)}</b><span>${on ? `Earned ${esc(on)}` : esc(m.how)}</span></li>`; }).join('')}</ol></div>`;
}
export const viewMedals = () => `<section class="narrow">${head('Medals')}${medalShelf(kid(R.h))}</section>`;

/* ------------------------------------------------------------------ My page: the explorer card (J7) */
export function viewMe() {
  const k = kid(R.h), rk = rankOf(k.xp), ctx = ctxOf(k);
  const known = Object.entries((k.lib.capitals || {}).box || {}).filter(([, b]) => b >= 2).map(([cc]) => cc);
  const top = earned(k).sort((a, b) => b.tier - a.tier).slice(0, 4);
  const mine = CATALOGUE.filter((a) => stateOf(a.id, ctx).state === 'owned').length;
  const a = byAvatar[k.avatar];
  return `<section class="narrow">
    ${head(esc(k.name), `${BANDS.find((b) => b.id === k.band).label} · Level ${k.road.level}`)}
    <div class="card explorer-card" data-tier="${a ? a.tier : 'common'}">
      <div class="ec-face">${av(k.avatar, 132, '')}${a ? `<span class="ec-tier">${TIERS[a.tier].label}</span>` : ''}</div>
      <div class="ec-body"><p class="kicker">Explorer card</p><h2>${esc(k.name)}</h2>
        <p class="ec-rank"><b>${esc(rk.n)}</b> · ${plural(starsTotal(k), 'star')} of ${maxStars()}</p>
        <p class="muted small">${esc(rk.why)}</p>
        <div class="ec-medals">${top.length ? top.map((m) => medallion(m, 48, true)).join('') : '<span class="muted small">Your first medal is one stop away.</span>'}</div></div>
      <div class="ec-map">${worldSVG({ key: 'me-known', fill: Object.fromEntries(known.map((c) => [c, 'kn'])), grat: false, label: 'Countries whose capitals you know' })}<p class="small"><b>${known.length}</b> of 195 capitals known</p></div>
    </div>
    <div class="me-links">
      <button class="card me-l" data-act="nav" data-arg="collection">${ico('cards')}<b>Collection</b><i>${mine} of 96</i></button>
      <button class="card me-l" data-act="nav" data-arg="medals">${ico('medal')}<b>Medals</b><i>${earned(k).length} of ${MEDALS.length}</i></button>
      <button class="card me-l" data-act="nav" data-arg="shop">${ico('bag')}<b>Shop</b><i>${plural(balance(k.name), 'coin')}</i></button>
      <button class="card me-l" data-act="nav" data-arg="mistakes">${ico('retry')}<b>My mistakes</b><i>${missDue(k).length} ready</i></button>
    </div>
    <details class="card ladder-card"><summary><h3>Explorer ranks</h3> <span class="muted small">— you are ${esc(rk.n)}</span></summary>
      <ol class="ladder">${RANKS.map((r, i) => `<li class="${i <= rk.i ? 'got' : ''}${i === rk.i ? ' now' : ''}"><b>${i + 1}. ${esc(r.n)}</b> <span class="muted small">${r.xp} right answers — ${esc(r.why)}</span></li>`).join('')}</ol>
      <details class="src"><summary>Where this is checked</summary><ul>${RANK_SRC.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></details>
    </details>
    <div class="card"><h3>Explorers on this device</h3>
      <div class="who-list">${R.h.kids.map((x) => `<button class="who-row${x.id === k.id ? ' on' : ''}" data-act="switchKid" data-arg="${x.id}">${av(x.avatar, 40)} <b>${esc(x.name)}</b></button>`).join('')}
        ${R.demo ? '' : `<button class="btn" data-act="nav" data-arg="welcome">${ico('plus')} Add an explorer</button>`}</div></div>
  </section>`;
}

/* ------------------------------------------------------------------ Help */
export const viewHelp = () => `<section class="narrow prose">${head('Help')}
  <div class="card">${shelly('point', 110, 'help-shelly')}
    <p><b>Hello — I’m Shelly.</b> My shell is a globe, and I know the way round it. Here is how Bizzing Geography works.</p>
    <p><b>Continue</b> on Home always takes you to the next stop on your journey. A <b>stop</b> is one small idea with ten questions; seven right passes it.</p>
    <p><b>The Atlas</b> is the island of ten places; <b>Expeditions</b> are 20–30 day journeys where you make things; <b>the Library</b> has capitals, flags, landmarks, Earth Through Time and more; <b>Play</b> has the games — Shelly’s Trade Winds, Where on Earth? and five more.</p>
    <p><b>Bizzing coins</b> are earned for learning — the same coins in every Bizzing app — and spent in the <b>Shop</b> at printed prices on avatars, worlds and map looks. Nothing is ever random.</p>
    <p><b>Hints</b> (the bulb on a question) take one wrong choice away or name the continent; a right answer after a hint pays no coin. <b>My mistakes</b> brings back what you missed, a day or more later.</p>
    <p>Every map is drawn by the app from open data, with India’s official depiction. Every painting says it is a painting.</p>
  </div></section>`;

/* ------------------------------------------------------------------ the shell */
/* A medal, celebrated once: it spins in with what earned it — never compared with anyone. */
function medalPop(m) {
  return `<div class="mp-veil" role="dialog" aria-modal="true" aria-label="New medal: ${esc(m.name)}"><div class="card mp-card">
    ${shelly('cheer', 96, 'mp-shelly')}<p class="kicker">New medal</p><div class="mp-spin">${medallion(m, 132)}</div><h2>${esc(m.name)}</h2><p class="muted">${esc(m.how)}</p>
    <button class="btn primary big" data-act="medalOk" autofocus>Put it on my shelf</button></div></div>`;
}
/* the first right answer a new explorer ever gives is celebrated (A8) — not the sign-up */
function firstPop(k) {
  return `<div class="mp-veil" role="dialog" aria-modal="true" aria-label="Your first right answer"><div class="card mp-card first-pop">
    ${shelly('cheer', 150, 'mp-shelly')}<p class="kicker">Your first right answer</p><h2>That’s it, ${esc(k.name)}!</h2><p>${esc(R.ui.firstPop)}</p>
    <button class="btn primary big" data-act="firstOk" autofocus>Keep exploring</button></div></div>`;
}
/* The chrome is Bizzing Bee's, as the family's measured drop-in (bizzing-shell.js, vendored
   byte for byte): top bar, tab row, phone tab bar and ☰ drawer. This app gives it its words,
   its mascot, its tabs and its routes — never its geometry. */
const NAV_ACTIVE = (n) => (NAV_OF[n] !== undefined ? NAV_OF[n] : n) || '';
/* in a game: a quiz run, or any Play game (and the Library's tools that play) between its title and finish cards.
   Every game keeps its live state in ui.g and marks it over (or runs past its last card) at the end. */
export function inGame() {
  if (R.ui.nav === 'run') return true;
  if (R.ui.nav !== 'lib' && R.ui.nav !== 'game') return false;
  const g = ((R.ui.lib || {})[R.ui.arg] || {}).g;
  return !!g && !g.over && !(g.cards && g.i >= g.cards.length);
}
export const FOOT = () => `Bizzing Geography · part of the Bizzing family with
    <a href="https://www.bizzingbee.com/" rel="noopener">Bizzing Bee</a>,
    <a href="https://aayuvis.github.io/bizzingindia.com/" rel="noopener">Bizzing India</a>,
    <a href="https://aayuvis.github.io/bizzingfinance/" rel="noopener">Bizzing Finance</a> and
    <a href="https://aayuvis.github.io/Bizzing-Maths/" rel="noopener">Bizzing Maths</a>
    · No ads, no tracking, no accounts. ${GKEY && R.h.parent.streetview ? 'Where on Earth?’s real photos load from Google Street View (a grown-up can switch them off); nothing about your child is sent.' : 'Nothing leaves this device.'} Maps: Natural Earth (India’s depiction). Music composed in code for Bizzing. <a href="#/privacy">Privacy</a>`;
export function shell(body, { home = false } = {}) {
  const h = R.h, k = kid(h), run = inGame();
  const pre = `${R.demo ? '<div class="demo-bar" role="note"><b>Sample explorer</b> — a few weeks of made-up progress to look round. Nothing here is saved. <a href="./">Leave the sample</a></div>' : ''}
  ${R.fromHive && !run ? `<a class="hive-chip" href="${HIVE}">← back to my day</a>` : ''}
  ${h.parent.tester ? '<div class="tester" role="note">TESTER MODE — every stop is open. Nothing about the child changes. <button data-act="testerOff">Turn off</button></div>' : ''}`;
  const due = k ? missDue(k).length : 0;
  const out = famShell({
    app: 'geography', name: 'Geography', mascot: 'mascot/shelly-head.webp', search: 'Search places, stops, words',
    tabs: [{ id: 'home', label: 'Home', icon: 'home', href: '#/home' }, { id: 'atlas', label: 'Atlas', icon: 'map', href: '#/atlas' },
      { id: 'exp', label: 'Expeditions', icon: 'compass', href: '#/exp' }, { id: 'library', label: 'Library', icon: 'book', href: '#/library' },
      { id: 'play', label: 'Play', icon: 'play', href: '#/play' }],
    active: NAV_ACTIVE(R.ui.nav), coins: k ? balance(k.name) : 0, dark: dark(), query: R.ui.nav === 'search' ? (R.ui.q || '') : '',
    kid: k ? { name: k.name, avatar: `avatars/${k.avatar}.webp` } : { name: 'Explorer' }, inRun: run,
    drawer: { sub: k ? `Level ${k.road.level} · ${rankOf(k.xp).n}` : 'Welcome',
      app: [{ icon: 'path', label: 'Your journey', sub: 'the ten levels, stop by stop', href: '#/road' },
        { icon: 'star', label: 'My mistakes', sub: due ? `${due} ready to try again` : 'misses come back after a gap', href: '#/mistakes' },
        { icon: 'play', label: 'Shelly’s Trade Winds', sub: 'sail the real winds, wake the world’s ports', href: '#/game/tradewinds' },
        { icon: 'globe', label: 'Where on Earth?', sub: 'pin a real place on the map', href: '#/game/geoguess' },
        { icon: 'search', label: 'Search', sub: 'places, stops, words and tools', href: '#/search' }] },
    content: `${pre}${body}${home ? '' : `<footer class="foot">${FOOT()}</footer>`}`,
  });
  return `<a class="skip" href="#main">Skip to the content</a>
  ${out}
  ${k && R.ui.menu ? whoMenu(k) : ''}
  ${k && R.ui.sheet === 'wallet' ? walletSheet(k) : ''}
  ${k && R.ui.firstPop ? firstPop(k) : k && (R.ui.medalPop || []).length ? medalPop(R.ui.medalPop[0]) : ''}`;
}
