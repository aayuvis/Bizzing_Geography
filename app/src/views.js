/* views.js — every screen, as a function from state to a string.
   Views never compute progress; model.js does. */

import { R } from './runtime.js';
import { esc, cls } from './ui.js';
export { esc };
import { WORLDS, STOPS, byId, worldOf, stopsIn } from './stops.js';
import { LEVELS, ageOf, firstLevel, START } from './levels.js';
import { THEMES, themeOf, themePicker } from './themes.js';
import { Store } from './store.js';
import { EXPEDITIONS, EXPEDITIONS_PARENT } from './data/expeditions.js';
import { learnedList, stats as expStats } from './expeditions.js';
import { GOALS, goalOf, sessionsToday } from './model.js';
import { todaysWord } from './library/dictionary.js';
import { LANDMARKS } from './data/landmarks.js';
import { BANDS, AVATARS, AVATAR_PACKS, AVATAR_NAME, avatarFile, RANKS, RANK_SRC, rankOf, kid, stopRec, road, stopOpen, lvFor, starsTotal, maxStars, levelOf } from './model.js';
import { worldSVG, regionSVG, viewFor } from './map.js';
import { POSTCARDS } from './data/postcards.js';
import { dayKey, seeded, pick } from './rand.js';
import { SHELF } from './library/index.js';
import { GKEY } from './photos.js';
import { HIVE, balance, ledger as walletLedger, APP } from './family.js';
import { MEDALS, earned, medallion, SHOP, shopOf, PIN_PATH, TIER } from './rewards.js';
import { nextStep, homeExpedition } from './next.js';

/* ------------------------------------------------------------- helpers */

export const av = (id, size = 48, alt = '') =>
  `<img class="av" src="avatars/${esc(avatarFile(id))}.webp" width="${size}" height="${size}" alt="${esc(alt)}" loading="lazy" decoding="async">`;

export function avatarPicker(cur, act, where) {
  const on = AVATARS.includes(cur) ? cur : AVATARS[0];
  return `<div class="av-packs" data-avgrid>${AVATAR_PACKS.map((p) => `
    <div class="av-pack" role="radiogroup" aria-labelledby="avp-${where}-${p.id}">
      <p class="av-pack-h" id="avp-${where}-${p.id}"><b>${esc(p.name)}</b> <span>${esc(p.blurb)}</span></p>
      <div class="avs">${p.avatars.map((a) => `<button id="av-${where}-${a}" class="av-pick${cur === a ? ' on' : ''}" role="radio" aria-checked="${cur === a}" tabindex="${on === a ? 0 : -1}" data-act="${act}" data-arg="${a}" aria-label="${esc(AVATAR_NAME[a] || a)}" title="${esc(AVATAR_NAME[a] || a)}">${av(a, 64)}</button>`).join('')}</div>
    </div>`).join('')}</div>`;
}

export const starRow = (n, max = 3, big = false) =>
  `<span class="stars${big ? ' big' : ''}" aria-label="${n} of ${max} stars">${Array.from({ length: max }, (_, i) => `<span class="${i < n ? 'on' : ''}">★</span>`).join('')}</span>`;
export const btn = (label, act, arg = '', kind = '', extra = '') =>
  `<button class="btn ${kind}" data-act="${act}"${arg !== '' ? ` data-arg="${esc(arg)}"` : ''} ${extra}>${label}</button>`;
export const back = (act, label = 'Back', arg = '') =>
  `<button class="back" data-act="${act}"${arg ? ` data-arg="${esc(arg)}"` : ''} aria-label="${esc(label)}"><span aria-hidden="true">←</span> <span class="back-l">${esc(label)}</span></button>`;
export function pageHead(title, sub = '', backBtn = '', right = '') {
  return `<header class="phead">${backBtn || '<span></span>'}<div class="phead-t"><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="phead-r">${right}</div></header>`;
}
/* 🔊 read it to me (K1): the device's own voice, an Indian English one first. The
   button names WHAT it reads; main.js reads that element's text. */
export const readBtn = (sel, label = 'Read it to me') => `<button class="read-btn" data-act="read" data-arg="${esc(sel)}" aria-label="${esc(label)}" title="${esc(label)}">🔊</button>`;
export const srcList = (src) => (src && src.length ? `<details class="src"><summary>Where this is checked</summary><ul>${src.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></details>` : '');

/* ------------------------------------------------------------- the shell */

export const TABS = [
  { k: 'home', n: 'Home', icon: 'home' },
  { k: 'atlas', n: 'Atlas', icon: 'map' },
  { k: 'exp', n: 'Expeditions', icon: 'flag' },
  { k: 'library', n: 'Library', icon: 'book' },
];
const NAV_OF = { lib: 'library', stop: 'atlas', world: 'atlas', road: 'atlas', expd: 'exp', proj: 'exp', run: null, me: 'home', grownups: null, privacy: null };

export function icon(k) {
  const p = {
    home: '<path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"/>',
    map: '<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z"/><path d="M9 4v14M15 6v14" class="i2"/>',
    road: '<circle cx="6" cy="18" r="2.6"/><circle cx="18" cy="6" r="2.6"/><path d="M8.4 17c5-1 1.5-8.5 7.2-10" class="i2"/>',
    book: '<path d="M4 5.5A2 2 0 0 1 6 4h5v15H6a2 2 0 0 0-2 1.5z"/><path d="M20 5.5A2 2 0 0 0 18 4h-5v15h5a2 2 0 0 1 2 1.5z" class="i2"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" class="i2"/>',
    sound: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" class="i2"/>',
    mute: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5" class="i2"/>',
    moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-1.8 0-1.3-1.2-1.6-1.2-2.8 0-1 .8-1.6 1.9-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.4" class="i2"/><circle cx="10.5" cy="7" r="1.4" class="i2"/><circle cx="15" cy="7.5" r="1.4" class="i2"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9z"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4.5c4-2 7 2 11 0l3-1v10l-3 1c-4 2-7-2-11 0" class="i2"/>',
  }[k] || '';
  return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
}

const HEX = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3l11.3 6.5v13L16 29 4.7 22.5v-13z" class="hx"/><path d="M16 10.5l5 2.9v5.8l-5 2.9-5-2.9v-5.8z" class="hx2"/></svg>';
/* The avatar menu (family standard §3): every child in the household, their own
   page, and the device's sound and light. Switching never mixes data. */
function whoMenu(k) {
  const dark = document.documentElement.getAttribute('data-mode') === 'dark';
  return `<div class="who-menu" role="menu" aria-label="Explorers and settings">
    <p class="wm-h">Who is exploring?</p>
    ${R.h.kids.map((x) => `<button role="menuitemradio" aria-checked="${x.id === k.id}" class="wm-kid${x.id === k.id ? ' on' : ''}" data-act="switchKid" data-arg="${x.id}">${av(x.avatar, 32)}<b>${esc(x.name)}</b>${x.id === k.id ? '<i>✓</i>' : ''}</button>`).join('')}
    ${R.demo ? '' : '<button role="menuitem" class="wm-i" data-act="nav" data-arg="welcome">＋ Add an explorer</button>'}
    <hr>
    <button role="menuitem" class="wm-i" data-act="nav" data-arg="me">${icon('star')} ${esc(k.name)}’s page — faces, medals, worlds</button>
    <button role="menuitemcheckbox" aria-checked="${R.sound}" class="wm-i" data-act="sound">${icon(R.sound ? 'sound' : 'mute')} Sound ${R.sound ? 'on' : 'off'}</button>
    <button role="menuitemcheckbox" aria-checked="${dark}" class="wm-i" data-act="mode">${icon('moon')} ${dark ? 'Dark' : 'Light'} — switch</button>
  </div>`;
}

/* A medal, celebrated once: it spins in with what earned it — never compared with anyone. */
function medalPop(m) {
  return `<div class="mp-veil" role="dialog" aria-modal="true" aria-label="New medal: ${esc(m.name)}"><div class="card mp-card">
    <p class="kicker">New medal</p><div class="mp-spin">${medallion(m, 132)}</div><h2>${esc(m.name)}</h2><p class="muted">${esc(m.how)}</p>
    <button class="btn primary big" data-act="medalOk" autofocus>Put it on my shelf</button></div></div>`;
}

export function shell(body) {
  const h = R.h, k = kid(h);
  const nav = NAV_OF[R.ui.nav] !== undefined ? NAV_OF[R.ui.nav] : R.ui.nav;
  const tabs = (cl) => TABS.map((t) => `<button class="${cl}${nav === t.k ? ' on' : ''}" data-act="nav" data-arg="${t.k}" ${nav === t.k ? 'aria-current="page"' : ''}>${icon(t.icon)}<span>${t.n}</span></button>`).join('');
  const inRun = R.ui.nav === 'run';
  return `
  <a class="skip" href="#main">Skip to the content</a>
  <header class="top">
    ${inRun ? '' : `<a class="hive" href="${HIVE}" aria-label="Back to Bizzing Hive" title="Bizzing Hive — the family’s day planner">${HEX}</a>`}
    <button class="brand" data-act="nav" data-arg="home" aria-label="Bizzing Geography — home">
      <svg viewBox="0 0 40 40" class="brand-mark" aria-hidden="true"><rect width="40" height="40" rx="11" class="bm-bg"/><circle cx="20" cy="20" r="11.5" class="bm-globe"/><path d="M8.5 20h23M20 8.5c-5 6-5 17 0 23M20 8.5c5 6 5 17 0 23" class="bm-lines"/><path d="M28 7l3 5-5 1z" class="bm-star"/></svg>
      <span class="brand-t">Bizzing <em>Geography</em></span>
    </button>
    ${k ? `<nav class="tabs" aria-label="Main">${tabs('tab')}</nav>` : '<span class="grow"></span>'}
    <div class="tools">
      ${k ? `<button class="tool" data-act="themes" aria-label="Theme: ${esc(THEMES.find((t) => t.id === themeOf(k)).name)}" title="Your world">${icon('palette')}</button>` : `<button class="tool" data-act="mode" aria-label="Light or dark">${icon('moon')}</button>`}
      <button class="tool" data-act="nav" data-arg="grownups" aria-label="Grown-ups" title="Grown-ups">${icon('lock')}</button>
      ${k ? `<button class="who" data-act="menu" aria-haspopup="menu" aria-expanded="${!!R.ui.menu}" aria-label="${esc(k.name)} — switch explorer, your page, sound">${av(k.avatar, 34, '')}<span class="who-v" aria-hidden="true">▾</span></button>` : ''}
    </div>
  </header>
  ${k && R.ui.menu ? whoMenu(k) : ''}
  ${R.demo ? '<div class="demo-bar" role="note"><b>Sample explorer</b> — a few weeks of made-up progress to look round. Nothing here is saved. <a href="./">Leave the sample</a></div>' : ''}
  ${R.fromHive && !inRun ? `<a class="hive-chip" href="${HIVE}">← back to my day</a>` : ''}
  ${h.parent.tester ? '<div class="tester" role="note">TESTER MODE — every stop is open. Nothing about the child changes. <button data-act="testerOff">Turn off</button></div>' : ''}
  <main id="main" class="content" tabindex="-1">${body}</main>
  ${k && (R.ui.medalPop || []).length ? medalPop(R.ui.medalPop[0]) : ''}
  ${k ? `<nav class="tabbar" aria-label="Main">${tabs('tb')}</nav>` : ''}
  <footer class="foot">Bizzing Geography · part of the Bizzing family with
    <a href="https://www.bizzingbee.com/" rel="noopener">Bizzing Bee</a>,
    <a href="https://aayuvis.github.io/bizzingindia.com/" rel="noopener">Bizzing India</a>,
    <a href="https://aayuvis.github.io/bizzingfinance/" rel="noopener">Bizzing Finance</a> and
    <a href="https://aayuvis.github.io/Bizzing-Maths/" rel="noopener">Bizzing Maths</a>
    · No ads, no tracking, no accounts. ${GKEY && R.h.parent.streetview ? 'Where on Earth?’s real photos load from Google Street View (a grown-up can switch them off); nothing about your child is sent.' : 'Nothing leaves this device.'} Maps: Natural Earth (India’s depiction). <button class="linkish" data-act="nav" data-arg="privacy">Privacy</button></footer>`;
}

/* ------------------------------------------------------------- welcome */

/* The welcome, one question at a time (Bizzing Finance's onboarding): a first visit
   gets a landing page, then a guide asks for a name, an age, a face and a world.
   Five faces and two worlds to START — one from each pack, the two calmest worlds —
   so a six-year-old is not choosing from forty. The rest are on the child's own
   page from the first minute, all free: nothing here is locked or earned. */
export const STARTER_AVATARS = ['compowl', 'savannalion', 'dolphin', 'volcadrake', 'toucan'];
export const STARTER_THEMES = ['atlas', 'ocean'];
const guide = (text) => `<div class="ob-say">${av('compowl', 84, '')}<p>${text}</p></div>`;
export function viewWelcome() {
  const first = !R.h.kids.length;
  const d = R.ui.draft || (R.ui.draft = { step: first ? 'land' : 0, name: '', band: '', avatar: STARTER_AVATARS[0], theme: 'atlas' });
  const shell = (body, n) => `<section class="welcome ob">${n != null ? `<div class="ob-top">${n ? `<button class="back" data-act="obBack" aria-label="Back"><span aria-hidden="true">←</span></button>` : first ? '' : back('nav', 'Cancel', 'home')}<ol class="ob-dots" aria-label="Step ${n + 1} of 4">${[0, 1, 2, 3].map((i) => `<li class="${i <= n ? 'on' : ''}"></li>`).join('')}</ol></div>` : ''}${body}</section>`;
  if (d.step === 'land') return shell(`<div class="ob-land">
      <div class="ob-hero" style="background-image:url(art/home-hero.webp)"></div>
      <p class="kicker">Bizzing Geography</p>
      <h1 class="display">Know the world — <em>and know how you know.</em></h1>
      <p class="lead">Maps and compasses, continents and capitals, rivers, weather and the restless Earth — for explorers aged 6 to 14.</p>
      ${btn('Start exploring →', 'obStart', '', 'primary big wide')}
      ${btn('Try one question first', 'trial', '', 'big wide ghost')}
      <div class="ob-counts">${[[STOPS.length, 'stops on the Atlas'], [EXPEDITIONS.length, 'expeditions'], [195, 'countries'], [SHELF.length, 'Library tools']].map(([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`).join('')}</div>
      <div class="card ob-promises">${[['🗺️', 'One map, drawn with care', 'Every map is drawn by the app from open data — never by an AI.'], ['🔒', 'Nothing about your child leaves this device', 'A first name and an age band. No email, no photo, no tracking, no ads.'], ['📚', 'Every fact says where it is checked', 'And a grown-up’s page that reports what was learned, not how long.']].map(([g, t, x]) => `<div><span>${g}</span><p><b>${t}</b><br><span class="muted small">${x}</span></p></div>`).join('')}</div>
      <p class="muted small center-t">Part of the Bizzing family, with Bizzing Bee, India, Finance and Maths.</p></div>`);
  if (d.step === 0) return shell(`${guide(first ? 'Hello, explorer! I am Compass Owl, and I know the way to everywhere. What shall I call you?' : 'Another explorer! What shall I call this one?')}
    <div class="card ob-card"><label class="lab" for="kname">First name or nickname</label>
      <input id="kname" class="inp big" data-draft="name" value="${esc(d.name)}" maxlength="20" autocomplete="off" autocapitalize="words" placeholder="e.g. Ahana">
      <p class="hint">Just a first name — never a surname, a birthday, a photo or where you live.</p>
      ${btn('Next →', 'obNext', '', 'primary big wide', d.name.trim() ? '' : 'disabled')}</div>`, 0);
  if (d.step === 1) return shell(`${guide(`Good to meet you, <b>${esc(d.name)}</b>! How old are you? It decides where your journey starts.`)}
    <div class="card ob-card ob-opts">${BANDS.map((b) => `<button class="ob-opt${d.band === b.id ? ' on' : ''}" data-act="draftBand" data-arg="${b.id}"><b>${b.label}</b><span>${b.blurb} — you start on Level ${levelOf(START[b.id]).n}, ${esc(levelOf(START[b.id]).name)}.</span></button>`).join('')}</div>`, 1);
  if (d.step === 2) return shell(`${guide('Every explorer needs a travelling companion. Which one is yours?')}
    <div class="card ob-card"><div class="ob-avs" role="radiogroup" aria-label="Your companion">${STARTER_AVATARS.map((a) => `<button id="av-ob-${a}" class="av-pick${d.avatar === a ? ' on' : ''}" role="radio" aria-checked="${d.avatar === a}" data-act="draftAv" data-arg="${a}" aria-label="${esc(AVATAR_NAME[a])}">${av(a, 96)}<span>${esc(AVATAR_NAME[a].replace(/ \(.*\)/, ''))}</span></button>`).join('')}</div>
      <p class="hint center-t">${AVATARS.length - STARTER_AVATARS.length} more companions wait on your own page — change any time.</p>
      ${btn('Next →', 'obNext', '', 'primary big wide')}</div>`, 2);
  return shell(`${guide('Last one! Which world would you like to explore in? It changes the colours, the letters and the living picture behind everything.')}
    <div class="card ob-card"><div class="themes ob-themes" role="radiogroup" aria-label="Your world">${THEMES.filter((t) => STARTER_THEMES.includes(t.id)).map((t) => `<button class="theme-card" id="theme-ob-${t.id}" data-theme="${t.id}" data-act="draftTheme" data-arg="${t.id}" role="radio" aria-checked="${d.theme === t.id}">
        <span class="tc-sw" aria-hidden="true"><svg class="tc-map" viewBox="0 0 120 60"><rect width="120" height="60" class="tc-sea"/><path class="tc-land" d="M8 14c10-6 22-4 28 4s2 16-6 20-18 8-22 0-6-18 0-24zM52 8c14-4 30 0 36 8s14 4 22 10-2 18-14 18-16-6-26-4-22-2-22-12 0-16 4-20z"/><path class="tc-hl" d="M64 22c6-2 12 2 10 8s-10 6-13 2-3-8 3-10z"/></svg><span class="tc-aa">Aa</span>${d.theme === t.id ? '<span class="tc-on">On</span>' : ''}</span>
        <span class="tc-t"><b>${t.name}</b><span>${t.blurb}</span></span></button>`).join('')}</div>
      <p class="hint center-t">Four more worlds on your page — desert, rainforest, aurora and space.</p>
      ${btn('Start exploring 🚀', 'createKid', '', 'primary big wide')}</div>`, 3);
}

/* ------------------------------------------------------------- home */

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
export const todaysCard = () => pick(POSTCARDS, seeded('pc' + dayKey()));

/* What your avatar says (Bizzing Bee's avatar greetings): a line per pack, turned by the day. */
const SAY = {
  kit: ['Compass ready. Which way today, {n}?', 'I packed the map. You bring the questions, {n}!', 'Every explorer starts with one step, {n}.'],
  continents: ['I came a long way to explore with you, {n}!', 'Seven continents, {n} — which one first?', 'My home is on the map somewhere. Can you find it, {n}?'],
  ocean: ['The sea covers most of the planet, {n}. Dive in!', 'Swim with me to somewhere new, {n}.', 'Which ocean shall we cross today, {n}?'],
  earth: ['The Earth is always moving, {n}. Let’s keep up!', 'Mountains, rivers, storms — pick one, {n}!', 'Ready for an adventure, {n}?'],
  forest: ['The forest is waking up, {n}. Let’s explore!', 'Follow the river with me, {n}.', 'So many places to see, {n}. Where to?'],
};
function sayLine(k) {
  const pack = (AVATAR_PACKS.find((p) => p.avatars.includes(k.avatar)) || { id: 'kit' }).id;
  const L = SAY[pack] || SAY.kit;
  return L[Math.floor(seeded('say' + dayKey() + k.id)() * L.length)].replace('{n}', k.name);
}
const ring = (n, goal) => { const r = 34, c = 2 * Math.PI * r, f = Math.min(1, n / goal);
  return `<svg class="h-ring-svg" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="${r}" class="rb"/><circle cx="40" cy="40" r="${r}" class="rf" stroke-dasharray="${(f * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 40 40)"/></svg>`; };

/* What the companion says: about the last thing this child actually did, when
   there is one (k.last, written when a station, day, round or project ends). */
function greetLine(k) {
  const L = k.last;
  if (L && Date.now() - L.at < 7 * 864e5) {
    const t = esc(L.title);
    return { stop: `Last time you passed “${t}”. The next station is ready, ${esc(k.name)}.`, try: `You had a go at “${t}”. Shall we try it again, ${esc(k.name)}?`,
      exp: `Day done on ${t}! The next day is waiting.`, geo: `You pinned five places, ${esc(k.name)}. Your best is ${L.n ? L.n.toLocaleString('en-US') : ''} points.`,
      made: `You made “${t}”. It is in your gallery.`, check: `Level check done — welcome to a new road, ${esc(k.name)}!` }[L.k] || esc(sayLine(k));
  }
  return esc(sayLine(k));
}

/* THE HOME (family standard §2, Bizzing Bee's template): greeting with the daily
   ring and the place of the hour; ONE Continue card — the only filled button on
   the screen, chosen by next.js; the expedition as a second, outline card;
   today's three; ways in. On a phone it reaches Continue above the fold. */
export function viewHome() {
  const k = kid(R.h), n = nextStep(k), rk = n.rank;
  const pc = todaysCard(), gd = (k.lib.geoguess || {}).daily || {}, doneToday = gd[dayKey()];
  const done = sessionsToday(k), goal = goalOf(k);
  const [tw, td] = todaysWord();
  const e = homeExpedition(k), es = expStats(k, e), ed = es.next;
  const lm = pick(LANDMARKS, seeded('lm' + dayKey()));
  const known = Object.entries((k.lib.capitals || {}).box || {}).filter(([, b]) => b >= 2).map(([cc]) => cc);
  const coins = balance(k.name);
  const trip = (k.trips || {})[dayKey()];
  return `<section class="home hm">
    <div class="card hm-hello">
      <div class="hm-me">${av(k.avatar, 96, '')}<div class="hm-say"><p class="muted small">${greet()}, <b>${esc(k.name)}</b></p><p class="hm-bub">${greetLine(k)}</p></div></div>
      <div class="hm-ring" role="group" aria-label="Today’s ring: ${done} of ${goal}">
        <div class="h-ring-c">${ring(done, goal)}<span><b>${done}/${goal}</b><i>today</i></span></div>
        <div><p class="small"><b>Today’s ring</b><br><span class="muted">each finished quiz, day or round fills a notch</span></p>
          <span class="h-goal" role="group" aria-label="How many a day">${GOALS.map((g) => `<button class="${g === goal ? 'on' : ''}" data-act="goal" data-arg="${g}" aria-pressed="${g === goal}">${g}</button>`).join('')}<i>a day</i></span></div>
      </div>
    </div>
    <div class="card hm-go">
      <div class="hm-art" style="background-image:url(art/${n.art}.webp)"><span class="h-badge">${n.glyph}</span></div>
      <div class="hm-body">
        <p class="kicker">Next on your journey · ${esc(n.kicker)}</p>
        <h2>${n.html ? n.title : esc(n.title)}</h2>
        <p class="muted small hm-sub">${esc(n.sub)}</p>
        <div class="hm-prog">
          <span class="hm-bar" aria-label="Level ${n.level}: ${n.done} of ${n.total} stations"><i style="width:${Math.round((100 * n.done) / Math.max(1, n.total))}%"></i></span>
          <span class="small"><b>Level ${n.level}</b> · ${n.done} of ${n.total} stations · <span title="${esc(rk.why)}">${esc(rk.n)}</span>${rk.next ? ` <span class="hm-rk"><i style="width:${rk.pct}%"></i></span>` : ''}</span>
        </div>
        <button class="btn primary big hm-cta" data-act="${n.act}" data-arg="${esc(n.arg)}">Continue ▶</button>
      </div>
    </div>
    <div class="card hm-exp">
      <div class="hm-exp-art" style="background-image:url(art/crs-${e.id}.webp)"><span class="h-badge">${e.glyph}</span></div>
      <div><p class="kicker">${es.started ? 'Your expedition' : 'An expedition for you'} · ${es.started ? `day ${ed ? ed.n : es.days} of ${es.days}` : `${es.days} days`}</p>
        <h3>${esc(e.name)}</h3><span class="hm-bar thin"><i style="width:${Math.round((100 * es.done) / es.days)}%"></i></span>
        <div class="row gap wrap">${btn(es.started ? 'Open the expedition' : 'Have a look', 'expOpen', e.id, 'small')}${btn('All expeditions', 'nav', 'exp', 'small ghost')}</div></div>
    </div>
    <div class="hm-three" aria-label="Today’s three">
      <button class="card hm-t" data-act="trip"><span class="hm-tg">⏱️</span><span><span class="kicker">5-minute trip</span><b>${trip ? `Done today — ${trip.right} of ${trip.n}` : 'Review, one new thing, one map'}</b><span class="muted small">${trip ? 'Another one any time.' : 'Ends by itself. Nothing lost for skipping.'}</span></span></button>
      <button class="card hm-t" data-act="openTool" data-arg="geoguess"><img src="art/${pc.id}.webp" alt="" loading="lazy" width="1280" height="720"><span><span class="kicker">Place of the hour</span><b>Where on Earth is this?</b><span class="muted small">${doneToday ? `You scored ${doneToday.toLocaleString('en-US')} today.` : 'Pin it on the map.'}</span></span></button>
      <button class="card hm-t" data-act="openLandmark" data-arg="${lm.id}"><img src="art/lm-${lm.id}.webp" alt="" loading="lazy" width="960" height="720"><span><span class="kicker">Landmark of the day</span><b>${esc(lm.name)}</b><span class="muted small">${esc(lm.where)}</span></span></button>
    </div>
    <nav class="hm-ways" aria-label="Ways in">
      <button class="hm-w" data-act="nav" data-arg="atlas"><span>🗺️</span><b>Atlas</b><i>★ ${starsTotal(k)} / ${maxStars()}</i></button>
      <button class="hm-w" data-act="nav" data-arg="exp"><span>🧭</span><b>Expeditions</b><i>${EXPEDITIONS.length} journeys</i></button>
      <button class="hm-w" data-act="nav" data-arg="library"><span>📚</span><b>Library</b><i>${SHELF.length} tools</i></button>
      <button class="hm-w hm-known" data-act="openTool" data-arg="capitals" aria-label="Countries you know: ${known.length} of 195">${worldSVG({ key: 'home-known', fill: Object.fromEntries(known.map((c) => [c, 'kn'])), grat: false, label: 'Countries whose capitals you know' })}<b>Countries you know</b><i>${known.length} of 195</i></button>
      <button class="hm-w" data-act="nav" data-arg="me"><span>🏅</span><b>My page</b><i>🪙 ${coins} · medals</i></button>
      <button class="hm-w" data-act="openWord" data-arg="${esc(tw)}"><span>📖</span><b>${esc(tw)}</b><i>word of the day</i></button>
    </nav>
  </section>`;
}
export const libTile = (t) => `<button class="lib-tile" data-act="openTool" data-arg="${t.id}">
      <span class="lib-art" style="background-image:url(art/${t.art}.webp)"></span>
      <span class="lib-t"><b>${t.glyph || ''} ${esc(t.name)}</b><span>${esc(t.blurb)}</span></span></button>`;

/* ------------------------------------------------------------- the atlas */

/* Where each world sits on the painted island, MEASURED against atlas.webp
   in its own 0–100 space. Regenerating the map means re-measuring. */
export const MAP_PINS = {
  home: { x: 26, y: 74 }, landwater: { x: 30, y: 50 }, continents: { x: 30, y: 25 }, compass: { x: 42, y: 13 },
  capitals: { x: 55, y: 27 }, weather: { x: 69, y: 21 }, rivers: { x: 81, y: 47 }, globe: { x: 74.5, y: 64 },
  restless: { x: 57, y: 76 }, people: { x: 51, y: 47 },
};
const worldStars = (k, w) => stopsIn(w.id).reduce((a, s) => a + ((k.stops[s.id] || {}).stars || 0), 0);

/* The Atlas has two faces of one island: the MAP (where the places are) and
   YOUR JOURNEY (the order you will walk them, level by level). They were two
   tabs once — "Atlas" and "My road" — but the road only ever explains the map. */
const atlasTabs = (on) => `<div class="seg atlas-seg" role="tablist" aria-label="The Atlas">
  <button role="tab" aria-selected="${on === 'map'}" class="${on === 'map' ? 'on' : ''}" data-act="nav" data-arg="atlas">🗺️ The map</button>
  <button role="tab" aria-selected="${on === 'road'}" class="${on === 'road' ? 'on' : ''}" data-act="nav" data-arg="road">🛤️ Your journey</button></div>`;
export function viewAtlas() {
  const h = R.h, k = kid(h);
  return `<section>
    ${pageHead('The Explorer’s Atlas', '', '', `<span class="chip gold">★ ${starsTotal(k)} / ${maxStars()}</span>`)}
    ${atlasTabs('map')}
    <div class="map-board">
      <img src="art/atlas.webp" alt="A painted map of the Explorer’s Island." width="1920" height="1072">
      ${WORLDS.map((w) => {
        const p = MAP_PINS[w.id], open = stopsIn(w.id).some((s) => stopOpen(h, k, s.id));
        const onroad = road(k).steps.filter((s) => !s.done && byId[s.stop].world === w.id).length;
        return `<button class="map-pin${open ? '' : ' shut'}" style="left:${p.x}%;top:${p.y}%;--wi:${w.ink};--wt:${w.tint}" data-act="openWorld" data-arg="${w.id}" aria-label="${esc(w.name)}${open ? '' : ', later levels'}">
          <span class="mp-g">${w.glyph}</span><span class="mp-t"><b>${esc(w.short)}</b>${onroad ? `<i class="mp-road">${onroad} on your road</i>` : open ? '' : '<i>Later levels</i>'}</span></button>`;
      }).join('')}
    </div>
    <div class="world-list">
      ${WORLDS.map((w) => {
        const ss = stopsIn(w.id), open = ss.some((s) => stopOpen(h, k, s.id));
        return `<button class="wl${open ? '' : ' shut'}" data-act="openWorld" data-arg="${w.id}" style="--wt:${w.tint};--wi:${w.ink}">
          <img src="art/w-${w.id}.webp" alt="" loading="lazy" width="1920" height="815">
          <span class="wl-t"><span class="kicker">${w.glyph} ${ss.length} stops · from age ${esc(w.band.split('-')[0])}</span><b>${esc(w.name)}</b><span>${esc(w.blurb)}</span><span class="wl-s">★ ${worldStars(k, w)} of ${ss.length * 3}</span></span></button>`;
      }).join('')}
    </div>
  </section>`;
}

/* A stop's level badge: "L3 · 5" for station 5 on the child's own road, a
   plain "L2" for an earlier level, a locked "L7" for a later one. */
function lvBadge(k, id) {
  const f = firstLevel(id), L = k.road.level;
  const st = road(k).steps.find((s) => s.stop === id);
  if (st) return `<b class="lvb road${st.done ? ' ok' : ''}" title="Station ${st.n} on your Level ${L} road">L${L} · ${st.done ? '✓' : st.n}</b>`;
  return f < L ? `<b class="lvb past">L${f}</b>` : `<b class="lvb later">🔒 L${f}</b>`;
}

const ROADY = (x) => 76 + 6 * Math.sin((x / 100) * Math.PI * 2 * 1.2 + 0.6);
export function viewWorld(wid) {
  const w = worldOf(wid), h = R.h, k = kid(h), ss = stopsIn(wid);
  const xs = ss.map((_, j) => 9 + (82 * j) / Math.max(1, ss.length - 1));
  let path = ''; for (let x = 0; x <= 100; x += 2) path += `${x ? 'L' : 'M'}${x},${ROADY(x).toFixed(2)} `;
  const sel = R.ui.pick && ss.find((s) => s.id === R.ui.pick) ? R.ui.pick : (ss.find((s) => stopOpen(h, k, s.id) && (k.stops[s.id] || {}).stars < 2) || ss[0]).id;
  const s = byId[sel], open = stopOpen(h, k, sel), rec = k.stops[sel] || {};
  return `<section class="world-page" style="--wt:${w.tint};--wi:${w.ink}">
    ${pageHead(`${w.glyph} ${esc(w.name)}`, esc(w.blurb), back('nav', 'Atlas', 'atlas'))}
    <div class="board-scroll">
      <div class="board">
        <img src="art/w-${w.id}.webp" alt="" width="1920" height="815">
        <svg class="road" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" class="rd-edge"/><path d="${path}" class="rd"/></svg>
        ${ss.map((st, j) => {
          const o = stopOpen(h, k, st.id), stars = (k.stops[st.id] || {}).stars || 0;
          return `<button class="bpin${cls(stars >= 2 && ' done', !o && ' shut', sel === st.id && ' sel')}" style="left:${xs[j]}%;top:${ROADY(xs[j])}%" data-act="pickStop" data-arg="${st.id}" aria-label="${esc(st.title)}${o ? '' : ', a later level'}">
            <span>${o ? st.glyph : '🔒'}</span>${stars ? `<em>${'★'.repeat(stars)}</em>` : ''}${lvBadge(k, st.id)}</button>`;
        }).join('')}
      </div>
    </div>
    <div class="card pick-card">
      <p class="kicker">${s.glyph} Stop ${ss.indexOf(s) + 1} of ${ss.length} · ${open ? starRow(rec.stars || 0) : 'opens on Level ' + firstLevel(sel)}</p>
      <h2>${esc(s.title)}</h2>
      <p class="lead">${esc(s.hook)}</p>
      <div class="row gap">${open ? btn('Open this stop', 'openStop', s.id, 'primary big') : `<span class="muted">This stop is on the Level ${firstLevel(sel)} road. Keep going on your own road — it will open.</span>`}</div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------- a stop */

export function viewStop(id) {
  const s = byId[id], k = kid(R.h), w = worldOf(s.world), rec = stopRec(k, id), lv = lvFor(k, id);
  const onRoad = road(k).steps.find((x) => x.stop === id);
  const lvName = ['', 'first look', 'deeper', 'stretch'][lv];
  return `<section class="stop-page narrow" style="--wt:${w.tint};--wi:${w.ink}">
    ${pageHead(`${s.glyph} ${esc(s.title)}`, `${w.glyph} ${esc(w.name)}`, back('openWorld', w.short, w.id), starRow(rec.stars))}
    <div class="card learn" id="lesson">
      <div class="q-head"><p class="ns-hook">${esc(s.hook)}</p>${readBtn('#lesson .ns-hook, #lesson .idea, #lesson .why-line', 'Read the lesson to me')}</div>
      <div class="idea">${s.idea.map((p) => `<p>${p}</p>`).join('')}</div>
      <p class="why-line"><b>Why it matters:</b> ${esc(s.why)}</p>
      ${srcList(s.src)}
      ${rec.learned ? '' : `<div class="row end">${btn('I’ve read it ★', 'learned', id, '')}</div>`}
    </div>
    <div class="card drill-card">
      <p class="kicker">Practice · ${lvName}${onRoad ? ` · station ${onRoad.n} on your Level ${k.road.level} road` : ''}</p>
      <h3>Ten questions</h3>
      <p class="muted">Seven right earns ★★ and passes this station; nine right earns ★★★. Best so far: ${rec.best || 0}%.</p>
      ${btn('Start practice', 'startDrill', id, 'primary big')}
    </div>
  </section>`;
}

/* ------------------------------------------------------------- the runner */

export function questionBody(q, fb, key = 'q') {
  if (q.kind === 'map') {
    const pinsFb = fb && !fb.right && q.showAt ? [{ at: q.showAt, cls: 'good', r: 7 }] : [];
    const fill = {};
    if (fb) { if (fb.given) fill[fb.given] = fb.right ? 'ok' : 'bad'; if (!fb.right) for (const c of q.ok.slice(0, 60)) fill[c] = fill[c] || 'ok'; }
    else if (R.ui.mapPick) fill[R.ui.mapPick] = 'pick';
    const map = q.region ? regionSVG(q.region, { fill, key, tap: !fb, label: q.text })
      : worldSVG({ fill, key, tap: !fb, view: q.view ? viewFor(q.view) : null, label: q.text, pins: pinsFb });
    return `${q.html || ''}<div class="q-head"><p class="long-q" id="q-text" aria-live="polite">${esc(q.text)}</p>${readBtn('#q-text', 'Read the question to me')}</div>${map}
      ${fb ? '' : `<div class="row gap center map-ctl">${btn('＋', 'mapZoom', key + '|in', 'small', 'aria-label="Zoom in"')}${btn('－', 'mapZoom', key + '|out', 'small', 'aria-label="Zoom out"')}${btn('⟲', 'mapZoom', key + '|home', 'small', 'aria-label="Whole map"')}<span class="muted small">Tap a place · or arrows + Enter</span></div>`}`;
  }
  return `${q.html ? `<div class="q-fig">${q.html}</div>` : ''}<div class="q-head"><p class="long-q" id="q-text" aria-live="polite">${esc(q.text)}</p>${readBtn('#q-text, .choice-row', 'Read the question and the answers to me')}</div>
    <div class="choice-row${q.opts.length <= 2 ? ' two' : ''}">${q.opts.map((c, i) => `<button class="btn big opt${fb && c === q.ans ? ' right' : ''}${fb && !fb.right && c === fb.given ? ' wrong' : ''}" data-act="choose" data-arg="${esc(c)}" ${fb ? 'disabled' : ''}><span>${esc(c)}</span> <kbd>${i + 1}</kbd></button>`).join('')}</div>`;
}

/* Praise names what was done (J1): the place found, the answer, a run of right
   ones in THIS quiz — never a comparison with anyone. */
export function praise(q, run) {
  let n = 0; for (let i = (run ? run.results.length : 0) - 1; i >= 0 && run.results[i].right; i--) n++;
  const what = q.kind === 'map' ? `Right — you found ${esc(q.targetName || 'it')} on the map.` : `Right — <b>${esc(q.ans)}</b>.`;
  const more = n >= 5 ? ` That is ${n} in a row.` : n === 3 ? ' Three in a row.' : '';
  return what + more;
}
export function feedback(q, fb, run) {
  const name = q.kind === 'map' ? (fb.givenName || '') : '';
  if (fb.right) return `<p class="fb good" id="fb-text">${praise(q, run)}</p>${q.why ? `<p class="why-chip">${esc(q.why)}</p>` : ''}`;
  const ans = q.kind === 'map' ? (q.targetName || q.target || 'the place in green') : q.ans;
  return `<p class="fb bad" id="fb-text">${name ? `That’s ${esc(name)}. ` : 'Not this time. '}The answer is <b>${esc(ans)}</b>${q.kind === 'map' ? ', shown in green' : ''}.</p>${q.why ? `<p class="why-chip">${esc(q.why)}</p>` : ''}`;
}

export function viewRun() {
  const run = R.run;
  if (run.over) return viewRunEnd(run);
  const q = run.items[run.i], fb = run.fb;
  return `<section class="runner narrow ${fb ? (fb.right ? 'is-right' : 'is-wrong') : ''}">
    ${pageHead(esc(run.title), esc(run.sub || ''), back('quitRun', 'Stop'))}
    <div class="dots" aria-label="Question ${run.i + 1} of ${run.items.length}">${run.items.map((_, i) => `<i class="${i < run.results.length ? (run.results[i].right ? 'r' : 'w') : i === run.i ? 'c' : ''}"></i>`).join('')}</div>
    ${run.intro && run.i === 0 && byId[run.stop] ? `<details class="card why-card" id="why" open><summary><b>${byId[run.stop].glyph} First, the idea</b> <span class="muted small">— ${esc(byId[run.stop].title)}</span> ${readBtn('#why p', 'Read the idea to me')}</summary>
      <p class="ns-hook">${esc(byId[run.stop].hook)}</p>${byId[run.stop].idea.slice(0, 2).map((x) => `<p>${x}</p>`).join('')}<p class="why-line"><b>Why it matters:</b> ${esc(byId[run.stop].why)}</p></details>` : ''}
    <div class="card qcard">
      ${questionBody(q, fb, 'q' + run.i)}
      ${fb ? feedback(q, fb, run) : ''}
    </div>
    ${fb && !fb.right ? `<div class="row center">${btn('Next <kbd>Enter</kbd>', 'nextQ', '', 'primary big')}</div>` : ''}
  </section>`;
}

function viewRunEnd(run) {
  const right = run.results.filter((r) => r.right).length, n = run.results.length, s = run.summary || {};
  return `<section class="narrow">
    ${pageHead(esc(run.title), '', back('endRun', 'Done'))}
    <div class="card end-card">
      ${s.stars != null ? starRow(s.stars, 3, true) : ''}
      <h2>${right} of ${n} right</h2>
      ${(s.lines || []).map((l) => `<p>${l}</p>`).join('')}
      <div class="row gap center">${(s.buttons || []).join('')}${btn('Done', 'endRun', '', 'primary big')}</div>
    </div>
    ${run.results.some((r) => !r.right) ? `<div class="card"><h3>To look at again</h3><ul class="missed">${run.results.map((r, i) => (r.right ? '' : `<li>${esc(run.items[i].text)} — <b>${esc(run.items[i].kind === 'map' ? run.items[i].targetName || '' : run.items[i].ans)}</b></li>`)).join('')}</ul></div>` : ''}
  </section>`;
}

/* ------------------------------------------------------------- my road */

export function viewRoad() {
  const k = kid(R.h), rd = road(k);
  const show = R.ui.lvShow && R.ui.lvShow !== rd.L.n ? levelOf(R.ui.lvShow) : null;
  const L = show || rd.L;
  const steps = show ? L.steps.map((s, i) => ({ ...s, n: i + 1, done: !!((k.stops[s.stop] || {}).lv || {})[s.lv], open: L.n < k.road.level || R.h.parent.tester })) : rd.steps;
  const mine = k.road.level;
  /* the ten levels as one strip: what is done, where you are, what comes — tap one to see its road */
  const glance = `<ol class="jglance" aria-label="Your journey: ten levels">${LEVELS.map((x) => {
      const state = k.road.finished.includes(x.n) || x.n < mine ? 'fin' : x.n === mine ? 'now' : 'ahead';
      const worlds = [...new Set(x.steps.map((s) => byId[s.stop].world))].map(worldOf);
      return `<li><button class="jg ${state}${x.n === L.n ? ' shown' : ''}" data-act="lvShow" data-arg="${x.n}" aria-label="Level ${x.n}: ${esc(x.name)}${state === 'now' ? ', you are here' : ''}" title="${esc(x.name)} · ${x.steps.length} stations · ${worlds.map((w) => w.short).join(', ')}">
        <span class="jg-n">${state === 'fin' ? '✓' : x.n}</span><span class="jg-t">${esc(x.name)}</span></button></li>`;
    }).join('')}</ol>`;
  return `<section>
    ${pageHead('The Explorer’s Atlas', '', '', `<span class="chip gold">★ ${starsTotal(k)} / ${maxStars()}</span>`)}
    ${atlasTabs('road')}
    ${glance}
    <div class="narrow">
    <h2 class="jl-h">Level ${L.n} · ${esc(L.name)} <span class="muted small">${ageOf(L.n)} · ${L.steps.length} stations${L.n === mine ? ' · you are here' : ''}</span></h2>
    <p class="muted center-t jl-b">${esc(L.blurb)}</p>
    <ol class="jsteps">${steps.map((s) => {
      const st = byId[s.stop], w = worldOf(st.world);
      return `<li><button class="jstep${s.done ? ' done' : ''}${s.open ? '' : ' shut'}${!show && rd.next && rd.next.stop === s.stop ? ' cur' : ''}" data-act="${s.open ? 'openStop' : 'noop'}" data-arg="${s.stop}" style="--wi:${w.ink};--wt:${w.tint}" ${s.open ? '' : 'aria-disabled="true"'}>
        <span class="js-n">${s.done ? '✓' : s.open ? s.n : '🔒'}</span><span class="js-t"><b>${st.glyph} ${esc(st.title)}</b><span>${esc(w.short)} · ${['', 'first look', 'deeper', 'stretch'][s.lv]}</span></span></button></li>`;
    }).join('')}</ol>
    ${show ? '' : `<div class="card center-card">
      <p class="kicker">Level check</p>
      <h3>${rd.all ? `Ready for Level ${L.n + 1}` : 'Already know this?'}</h3>
      <p class="muted">Twelve questions from this road. Ten right opens Level ${Math.min(10, L.n + 1)}${rd.all ? '' : ' — even before you have walked every station'}.</p>
      ${L.n < 10 || !k.road.finished.includes(10) ? btn('Take the level check', 'levelCheck', '', rd.all ? 'primary big' : 'big') : ''}
    </div>`}
    </div>
  </section>`;
}

/* ------------------------------------------------------------- me */

function medalShelf(k) {
  const got = earned(k).length;
  return `<div class="card" id="medals"><div class="row between wrap"><h3>Medals <span class="muted small">${got} of ${MEDALS.length}</span></h3><span class="muted small">Each one is earned by what you did — never by luck, never by days in a row.</span></div>
    <ol class="medal-shelf">${MEDALS.map((m) => { const on = (k.medals || {})[m.id]; return `<li class="${on ? 'got' : ''}" title="${esc(m.how)}">${medallion(m, 64, !!on)}<b>${esc(m.name)}</b><span>${on ? `Earned ${esc(on)}` : esc(m.how)}</span></li>`; }).join('')}</ol></div>`;
}
function walletCard(k) {
  const sh = shopOf(k), c = balance(k.name), recent = walletLedger(k.name).filter((x) => x.a === APP).slice(-5).reverse();
  const WHY = { right: 'right answers', stop: 'a station, day or round finished', mastered: 'something mastered', contest: 'a level check' };
  const item = (it) => { const own = sh.owned.includes(it.id), use = sh[it.kind] === it.id.split(':')[1];
    return `<li class="shop-i${use ? ' on' : ''}"><span class="shop-look ${it.kind}" data-look="${it.id.split(':')[1]}">${it.kind === 'pin' ? pinSwatch(it.id.split(':')[1]) : ''}</span><b>${esc(it.name)}</b><span class="muted small">${esc(it.blurb)}</span>
      ${use ? '<span class="chip">In use</span>' : own ? btn('Use', 'use', it.id, 'small') : btn(`🪙 ${it.price}`, 'buy', it.id, 'small', c < it.price ? 'aria-disabled="true"' : '')}</li>`; };
  return `<div class="card" id="wallet"><div class="row between wrap"><h3>🪙 ${c} Bizzing coins</h3><span class="muted small">Earned for learning — the same coins in every Bizzing app. Never bought, never by chance.</span></div>
    ${recent.length ? `<p class="muted small">Lately: ${recent.map((x) => `${x.n > 0 ? '+' : ''}${x.n} ${x.n > 0 ? (WHY[x.why] || x.why) : 'spent'}`).join(' · ')}</p>` : ''}
    <h4>The map shop</h4><p class="muted small">Looks for your maps at printed prices. Nothing here changes your rank or opens a lesson — every lesson is already yours.</p>
    <ul class="shop">${SHOP.map(item).join('')}</ul></div>`;
}
export const pinSwatch = (shape) => `<svg viewBox="-12 -12 24 24" width="34" height="34" aria-hidden="true">${PIN_PATH[shape] ? `<path d="${PIN_PATH[shape]}" class="pin-shape"/>` : '<circle r="7" class="pin-shape"/>'}</svg>`;

export const autoRead = (k) => (k.prefs || {}).readAuto ?? k.band === '6-7';
export function viewMe() {
  const k = kid(R.h), rk = rankOf(k.xp);
  return `<section class="narrow">
    ${pageHead(esc(k.name), `${BANDS.find((b) => b.id === k.band).label} · Level ${k.road.level}`)}
    ${medalShelf(k)}
    ${walletCard(k)}
    <div class="card"><h3>Change your face</h3>${avatarPicker(k.avatar, 'setAv', 'me')}</div>
    ${themePicker(k)}
    <div class="card row gap wrap"><div style="flex:1;min-width:200px"><h3>Read aloud</h3><p class="muted small">Every question and lesson has a 🔊 button. ${k.band === '6-7' ? 'For explorers aged 6–7 each question is also read out by itself.' : 'Tap it whenever you like.'}</p></div>
      <button class="btn" data-act="readAuto" aria-pressed="${autoRead(k)}">${autoRead(k) ? '🔊 Reading questions by itself' : '🔈 Only when I tap 🔊'}</button></div>
    <div class="card row gap wrap"><div style="flex:1;min-width:200px"><h3>Moving background</h3><p class="muted small">The world behind the page moves. Switch it to a still picture on this device if it distracts. It always holds still during a quiz.</p></div>
      <button class="btn" data-act="still" aria-pressed="${Store.loadDevice('still', false)}">${Store.loadDevice('still', false) ? '▶ Let it move' : '⏸ Hold it still'}</button></div>
    <div class="card">
      <h3>Explorers on this device</h3>
      <div class="who-list">${R.h.kids.map((x) => `<button class="who-row${x.id === k.id ? ' on' : ''}" data-act="switchKid" data-arg="${x.id}">${av(x.avatar, 40)} <b>${esc(x.name)}</b></button>`).join('')}
        <button class="btn" data-act="nav" data-arg="welcome">+ Add an explorer</button></div>
    </div>
    <details class="card ladder-card"><summary><h3>Explorer ranks</h3> <span class="muted small">— you are ${esc(rk.n)}</span></summary>
      <ol class="ladder">${RANKS.map((r, i) => `<li class="${i <= rk.i ? 'got' : ''}${i === rk.i ? ' now' : ''}"><b>${i + 1}. ${esc(r.n)}</b> <span class="muted small">${r.xp} right answers — ${esc(r.why)}</span></li>`).join('')}</ol>
      ${srcList(RANK_SRC)}
    </details>

  </section>`;
}

/* ------------------------------------------------------------- grown-ups */

export function viewGrownups() {
  const h = R.h;
  if (!R.ui.gate) {
    return `<section class="narrow">${pageHead('For grown-ups', '', back('nav', 'Back', 'home'))}
      <div class="card center-card"><p>${h.parent.pin ? 'Enter your four-digit PIN.' : 'Set a four-digit PIN for this page.'}</p>
        <input id="pin" class="inp pin" inputmode="numeric" maxlength="4" data-draft="pin" value="${esc(R.ui.gateIn)}" aria-label="PIN" autocomplete="off">
        <div class="row center">${btn(h.parent.pin ? 'Open' : 'Set PIN', 'gate', '', 'primary')}</div>
        <p class="hint">The PIN is a deterrent, not security — anyone who can clear this browser’s storage can reset it.</p></div></section>`;
  }
  return `<section class="narrow">${pageHead('For grown-ups', 'What each child has done, measured from their answers.', back('nav', 'Back', 'home'))}
    ${h.kids.map((k) => {
      const days = Object.entries(k.days).sort().slice(-7);
      const q = days.reduce((a, [, d]) => a + d.q, 0), ok = days.reduce((a, [, d]) => a + d.ok, 0);
      const passed = Object.entries(k.stops).filter(([, r]) => r.stars >= 2).map(([id]) => byId[id]).filter(Boolean);
      return `<div class="card report"><div class="row gap">${av(k.avatar, 44)}<div><h3>${esc(k.name)}</h3><p class="muted small">Level ${k.road.level} · ${rankOf(k.xp).n}</p></div></div>
        <p>Last seven days: <b>${q}</b> questions, <b>${ok}</b> right.</p>
        <p>Stops passed (★★ or better): ${passed.length ? passed.map((s) => esc(s.title)).join(', ') : 'none yet'}.</p>
        <p>Capitals known in the Library: ${Object.values((k.lib.capitals || {}).box || {}).filter((b) => b >= 2).length} of 195 countries, ${Object.values((k.lib.states || {}).box || {}).filter((b) => b >= 2).length} states and provinces.</p>
        ${(() => { const L = learnedList(k), on = EXPEDITIONS.filter((e) => (k.exp || {})[e.id]);
          return `<h4>Expeditions</h4>${on.length ? `<p class="muted small">${on.map((e) => `${e.glyph} ${esc(e.name)}: ${expStats(k, e).learned} of ${e.modules.length} parts learned`).join(' · ')}</p>` : '<p class="muted small">None started yet.</p>'}
          ${L.length ? `<ul class="learned">${L.map((x) => `<li>✓ ${esc(k.name)} can ${esc(x.m.objective)} <span class="muted small">(${esc(x.e.name)}, ${x.on})</span></li>`).join('')}</ul>` : ''}
          <p class="hint">${esc(EXPEDITIONS_PARENT)}</p>`; })()}</div>`;
    }).join('')}
    <div class="card"><h3>Settings</h3>
      <label class="set-row"><input type="checkbox" data-act="tester" ${h.parent.tester ? 'checked' : ''}> Tester mode — opens every stop and level for a grown-up to look round. Changes nothing about a child.</label>
      <label class="set-row${GKEY ? '' : ' off'}"><input type="checkbox" data-act="streetview" ${h.parent.streetview ? 'checked' : ''} ${GKEY ? '' : 'disabled'}> Real photos in Where on Earth? — Google Street View of real places. <b>This is the one thing in the app that contacts another company:</b> while it is on, Where on Earth? loads each photo from Google, so Google sees this device’s internet address and which photo was shown. It sends nothing about your child — no name, no age, no answers, no location. On by default; untick to use paintings only.${GKEY ? '' : ' (Not set up in this copy of the app.)'}</label>
      <div class="row gap wrap">${btn('Back up to a file', 'backup')}${btn('Restore from a file', 'restore')}${btn('Delete everything on this device', 'wipe', '', 'danger')}</div>
      ${R.ui.confirm === 'wipe' ? `<p class="fb bad">This deletes every child’s progress on this device. ${btn('Yes, delete everything', 'wipeYes', '', 'danger small')}</p>` : ''}
    </div>
    <div class="card"><h3>How this app is made</h3>
      <p>Every map is drawn by the app from Natural Earth’s open data, using <b>India’s official depiction</b> of its borders (the Survey of India’s), for every user everywhere — the same single depiction the whole Bizzing family uses. India’s states come from Bizzing India’s own map. Borders are background: they never animate or move as a reward.</p>
      <p>The paintings — the Atlas, the postcards, the landmarks and the scenes from Earth’s past — were <b>made with an AI image model</b> and are illustrations, not photographs. Each landmark card says so. No real person is ever painted.</p>
      <p>Facts about real places name where they are checked. The landmark and Earth-history shelves are marked “awaiting a second reader” until someone other than the author has checked them.</p>
    </div>
  </section>`;
}

export function viewPrivacy() {
  return `<section class="narrow prose">${pageHead('Privacy', '', back('nav', 'Back', 'home'))}
    <div class="card">
      <p><b>Nothing leaves this device.</b> Bizzing Geography has no accounts, no analytics, no ads and no third-party scripts. Maps, pictures and fonts are served from the app’s own address.</p>
      <p><b>One exception: real photos in Where on Earth?</b> Each photo is loaded from Google Street View, so Google sees this device’s internet address and which photo was requested (Google’s privacy policy applies to that). Nothing about the child is sent — no name, age, answers or location. Real photos are on by default; a grown-up can switch them off in the grown-ups’ page, and then the app contacts no one.</p>
      <p>For each child it keeps a first name or nickname, an age band (never a birthday), a chosen face, and their answers — in this browser’s own storage, on this device only.</p>
      <p>It never asks where anyone lives, and Where on Earth? never uses the device’s location.</p>
      <p>A grown-up can back this up to a file, restore it, or delete it all from the grown-ups’ page.</p>
    </div></section>`;
}
