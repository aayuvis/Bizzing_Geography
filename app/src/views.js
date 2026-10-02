/* views.js — every screen, as a function from state to a string.
   Views never compute progress; model.js does. */

import { R } from './runtime.js';
import { esc, cls, plural } from './ui.js';
import { ico, gi } from './icons.js';
import { shelly, says, empty } from './mascot.js';
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
import { reviewDue } from './model.js';
import { BANDS, AVATARS, AVATAR_PACKS, AVATAR_NAME, avatarFile, RANKS, RANK_SRC, rankOf, kid, stopRec, road, stopOpen, lvFor, starsTotal, maxStars, levelOf } from './model.js';
import { worldSVG, regionSVG, viewFor } from './map.js';
import { POSTCARDS } from './data/postcards.js';
import { dayKey, seeded, pick, shuffle } from './rand.js';
import { SHELF } from './library/index.js';
import { GKEY } from './photos.js';
import { byCc, CONTINENTS, QUIZ as COUNTRIES_Q } from './geo.js';
import { regionsOf } from './library/states.js';
import { listOptions } from './listmode.js';
import { HIVE, balance, ledger as walletLedger, APP, activityRows } from './family.js';
import { MEDALS, earned, medallion, SHOP, shopOf, PIN_PATH, TIER } from './rewards.js';
import { nextStep, homeExpedition } from './next.js';
import { missDue, missCount } from './mistakes.js';
import { certificatesOf } from './certificate.js';

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
export const readBtn = (sel, label = 'Read it to me') => `<button class="read-btn" data-act="read" data-arg="${esc(sel)}" aria-label="${esc(label)}" title="${esc(label)}">${ico('sound')}</button>`;
export const srcList = (src) => (src && src.length ? `<details class="src"><summary>Where this is checked</summary><ul>${src.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></details>` : '');

/* ------------------------------------------------------------- the shell: chrome.js */
export const icon = (k) => ico(k);

/* ------------------------------------------------------------- welcome */

/* The welcome, one question at a time (Bizzing Finance's onboarding): a first visit
   gets a landing page, then a guide asks for a name, an age, a face and a world.
   Five faces and two worlds to START — one from each pack, the two calmest worlds —
   so a six-year-old is not choosing from forty. The rest are on the child's own
   page from the first minute, all free: nothing here is locked or earned. */
export const STARTER_AVATARS = ['compowl', 'savannalion', 'dolphin', 'volcadrake', 'toucan'];
export const STARTER_THEMES = ['atlas', 'ocean'];
const guide = (text, pose = 'wave') => `<div class="ob-say">${shelly(pose, 96)}<p>${text}</p></div>`;
export function viewWelcome() {
  const first = !R.h.kids.length;
  const d = R.ui.draft || (R.ui.draft = { step: first ? 'land' : 0, name: '', band: '', avatar: STARTER_AVATARS[0], theme: 'atlas' });
  const shell = (body, n) => `<section class="welcome ob">${n != null ? `<div class="ob-top">${n ? `<button class="back" data-act="obBack" aria-label="Back"><span aria-hidden="true">←</span></button>` : first ? '' : back('nav', 'Cancel', 'home')}<ol class="ob-dots" aria-label="Step ${n + 1} of 4">${[0, 1, 2, 3].map((i) => `<li class="${i <= n ? 'on' : ''}"></li>`).join('')}</ol></div>` : ''}${body}</section>`;
  if (d.step === 'land') return shell(`<div class="ob-land">
      <div class="ob-hero" style="background-image:url(art/home-hero.webp)">${shelly('wave', 150, 'ob-shelly')}</div>
      <p class="kicker">Bizzing Geography</p>
      <h1 class="display">Know the world — <em>and know how you know.</em></h1>
      <p class="lead">Maps and compasses, continents and capitals, rivers, weather and the restless Earth — for explorers aged 6 to 14.</p>
      ${btn(`Start exploring ${ico('next')}`, 'obStart', '', 'primary big wide')}
      ${btn('Try one question first', 'trial', '', 'big wide ghost')}
      <div class="ob-counts">${[[STOPS.length, 'stops on the Atlas'], [EXPEDITIONS.length, 'expeditions'], [195, 'countries'], [SHELF.length, 'Library tools']].map(([n, l]) => `<div><b>${n}</b><span>${l}</span></div>`).join('')}</div>
      <div class="card ob-promises">${[['map', 'One map, drawn with care', 'Every map is drawn by the app from open data — never by an AI.'], ['lock', 'Nothing about your child leaves this device', 'A first name and an age band. No email, no photo, no tracking, no ads.'], ['book', 'Every fact says where it is checked', 'And a grown-up’s page that reports what was learned, not how long.']].map(([g, t, x]) => `<div><span>${ico(g)}</span><p><b>${t}</b><br><span class="muted small">${x}</span></p></div>`).join('')}</div>
      <p class="muted small center-t">Part of the Bizzing family, with Bizzing Bee, India, Finance and Maths.</p></div>`);
  if (d.step === 0) return shell(`${guide(first ? 'Hello, explorer! I am Shelly. My shell is a globe, and I know the way round it. What shall I call you?' : 'Another explorer! What shall I call this one?')}
    <div class="card ob-card"><label class="lab" for="kname">First name or nickname</label>
      <input id="kname" class="inp big" data-draft="name" value="${esc(d.name)}" maxlength="20" autocomplete="off" autocapitalize="words" placeholder="e.g. Ahana">
      <p class="hint">Just a first name — never a surname, a birthday, a photo or where you live.</p>
      ${btn('Next →', 'obNext', '', 'primary big wide', d.name.trim() ? '' : 'disabled')}</div>`, 0);
  if (d.step === 1) return shell(`${guide(`Good to meet you, <b>${esc(d.name)}</b>! How old are you? It decides where your journey starts.`)}
    <div class="card ob-card ob-opts">${BANDS.map((b) => `<button class="ob-opt${d.band === b.id ? ' on' : ''}" data-act="draftBand" data-arg="${b.id}"><b>${b.label}</b><span>${b.blurb} — you start on Level ${levelOf(START[b.id]).n}, ${esc(levelOf(START[b.id]).name)}.</span></button>`).join('')}</div>`, 1);
  if (d.step === 2) return shell(`${guide('Every explorer needs a face of their own. Which one is yours? There are ninety-six to find.', 'point')}
    <div class="card ob-card"><div class="ob-avs" role="radiogroup" aria-label="Your companion">${STARTER_AVATARS.map((a) => `<button id="av-ob-${a}" class="av-pick${d.avatar === a ? ' on' : ''}" role="radio" aria-checked="${d.avatar === a}" data-act="draftAv" data-arg="${a}" aria-label="${esc(AVATAR_NAME[a])}">${av(a, 96)}<span>${esc(AVATAR_NAME[a].replace(/ \(.*\)/, ''))}</span></button>`).join('')}</div>
      <p class="hint center-t">${AVATARS.length - STARTER_AVATARS.length} more faces wait in your Collection — some free, some to earn with Bizzing coins.</p>
      ${btn('Next →', 'obNext', '', 'primary big wide')}</div>`, 2);
  return shell(`${guide('Last one! Which world would you like to explore in? It changes the colours, the letters, the living picture and the music.', 'think')}
    <div class="card ob-card"><div class="themes ob-themes" role="radiogroup" aria-label="Your world">${THEMES.filter((t) => STARTER_THEMES.includes(t.id)).map((t) => `<button class="theme-card" id="theme-ob-${t.id}" data-theme="${t.id}" data-act="draftTheme" data-arg="${t.id}" role="radio" aria-checked="${d.theme === t.id}">
        <span class="tc-sw" aria-hidden="true"><svg class="tc-map" viewBox="0 0 120 60"><rect width="120" height="60" class="tc-sea"/><path class="tc-land" d="M8 14c10-6 22-4 28 4s2 16-6 20-18 8-22 0-6-18 0-24zM52 8c14-4 30 0 36 8s14 4 22 10-2 18-14 18-16-6-26-4-22-2-22-12 0-16 4-20z"/><path class="tc-hl" d="M64 22c6-2 12 2 10 8s-10 6-13 2-3-8 3-10z"/></svg><span class="tc-aa">Aa</span>${d.theme === t.id ? '<span class="tc-on">On</span>' : ''}</span>
        <span class="tc-t"><b>${t.name}</b><span>${t.blurb}</span></span></button>`).join('')}</div>
      <p class="hint center-t">Four more worlds — rainforest, desert, aurora and space — open later with Bizzing coins or the family plan.</p>
      ${btn(`Start exploring ${ico('next')}`, 'createKid', '', 'primary big wide')}</div>`, 3);
}

/* ------------------------------------------------------------- home */

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
/* the place of the HOUR: one postcard per hour, the same in every house */
export const todaysCard = (t = new Date()) => pick(POSTCARDS, seeded('pc' + dayKey(t) + ':' + t.getHours()));

/* What Shelly says (B5): a line BUILT from what this child last did — the stop, the score,
   the misses waiting — chosen once per sitting and never the same line twice in a row. */
const SAY = ['Which way today, {n}? I have the whole globe on my back.', 'Every explorer starts with one step, {n}.', 'Seven continents, {n} — which one first?',
  'The sea covers most of the planet, {n}. Dive in!', 'Mountains, rivers, storms — pick one, {n}!', 'So many places to see, {n}. Where to?'];
export function greetLines(k) {
  const L = k.last, n = esc(k.name), out = [];
  if (L && Date.now() - L.at < 7 * 864e5) {
    const t = esc(L.title);
    out.push({ stop: `Last time you passed “${t}”. The next stop is ready, ${n}.`, try: `You had a go at “${t}”. Shall we try it again, ${n}?`,
      exp: `Day done on ${t}! The next day is waiting.`, geo: `You pinned places all over the world, ${n}. Your best round is ${L.n ? L.n.toLocaleString('en-US') : ''} points.`,
      made: `You made “${t}”. It is in your gallery.`, check: `Level check done — welcome to a new road, ${n}!`, mist: `You went back over your misses, ${n}. That is how places stick.` }[L.k] || '');
    if (L.right != null && L.n) out.push(`${L.right} of ${L.n} right on “${t}” last time${L.right >= L.n - 1 ? ' — nearly all of them' : ''}. Ready for more, ${n}?`);
  }
  const due = missDue(k).length;
  if (due) out.push(`${due === 1 ? 'One of your misses is' : `${due} of your misses are`} ready to try again, ${n}. They stick better after a gap.`);
  const known = Object.values((k.lib.capitals || {}).box || {}).filter((b) => b >= 2).length;
  if (known) out.push(`You know ${known === 1 ? 'one capital' : known + ' capitals'} for sure now, ${n}. Shall we add one more?`);
  if (!out.filter(Boolean).length) out.push(...SAY.map((x) => x.replace('{n}', n)));
  return out.filter(Boolean);
}
function greetLine(k) {
  const key = ((k.last || {}).at || 0) + '|' + dayKey();
  if (k.greet && k.greet.key === key) return k.greet.line;
  const lines = greetLines(k), prev = k.greet && k.greet.line;
  const pool = lines.length > 1 ? lines.filter((l) => l !== prev) : [...lines, ...SAY.map((x) => x.replace('{n}', esc(k.name)))].filter((l) => l !== prev);
  const line = pool[Math.floor(seeded('say' + key + k.id)() * pool.length)];
  k.greet = { key, line };
  return line;
}
const ring = (n, goal) => { const r = 34, c = 2 * Math.PI * r, f = Math.min(1, n / goal);
  return `<svg class="h-ring-svg" viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="${r}" class="rb"/><circle cx="40" cy="40" r="${r}" class="rf" stroke-dasharray="${(f * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 40 40)"/></svg>`; };

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
      <div class="hm-me">${shelly('wave', 104, 'hm-shelly')}<div class="hm-say"><p class="muted small hm-who">${av(k.avatar, 28, '')} ${greet()}, <b>${esc(k.name)}</b></p><p class="hm-bub">${greetLine(k)}</p></div></div>
      <div class="hm-ring" role="group" aria-label="Today’s ring: ${done} of ${goal}">
        <div class="h-ring-c">${ring(done, goal)}<span><b>${done}/${goal}</b><i>today</i></span></div>
        <div><p class="small"><b>Today’s ring</b><br><span class="muted">each finished quiz, day or round fills a notch</span></p>
          <span class="h-goal" role="group" aria-label="How many a day">${GOALS.map((g) => `<button class="${g === goal ? 'on' : ''}" data-act="goal" data-arg="${g}" aria-pressed="${g === goal}">${g}</button>`).join('')}<i>a day</i></span></div>
      </div>
    </div>
    <div class="card hm-go">
      <div class="hm-art" style="background-image:url(art/${n.art}.webp)"><span class="h-badge">${gi(n.glyph)}</span></div>
      <div class="hm-body">
        <p class="kicker">Next on your journey · ${esc(n.kicker)}</p>
        <h2>${n.html ? n.title : esc(n.title)}</h2>
        <p class="muted small hm-sub">${esc(n.sub)}</p>
        <div class="hm-prog">
          <span class="hm-bar" aria-label="Level ${n.level}: ${n.done} of ${n.total} stops"><i style="width:${Math.round((100 * n.done) / Math.max(1, n.total))}%"></i></span>
          <span class="small"><b>Level ${n.level}</b> · ${n.done} of ${n.total} stops · <span title="${esc(rk.why)}">${esc(rk.n)}</span>${rk.next ? ` <span class="hm-rk"><i style="width:${rk.pct}%"></i></span>` : ''}</span>
        </div>
        <button class="btn primary big hm-cta" data-act="${n.act}" data-arg="${esc(n.arg)}">Continue ${ico('next')}</button>
      </div>
    </div>
    <div class="card hm-exp">
      <div class="hm-exp-art" style="background-image:url(art/crs-${e.id}.webp)"><span class="h-badge">${gi(e.glyph)}</span></div>
      <div><p class="kicker">${es.started ? 'Your expedition' : 'An expedition for you'} · ${es.started ? `day ${ed ? ed.n : es.days} of ${es.days}` : `${es.days} days`}</p>
        <h3>${esc(e.name)}</h3><span class="hm-bar thin"><i style="width:${Math.round((100 * es.done) / es.days)}%"></i></span>
        <div class="row gap wrap">${btn(es.started ? 'Open the expedition' : 'Have a look', 'expOpen', e.id, 'small')}${btn('All expeditions', 'nav', 'exp', 'small ghost')}</div></div>
    </div>
    <div class="hm-three" aria-label="Today’s three">
      <button class="card hm-t" data-act="trip"><span class="hm-tg">${ico('timer')}</span><span><span class="kicker">5-minute trip</span><b>${trip ? `Done today — ${trip.right} of ${trip.n}` : 'Review, one new thing, one map'}</b><span class="muted small">${trip ? 'Another one any time.' : 'Ends by itself. Nothing lost for skipping.'}</span></span></button>
      <button class="card hm-t" data-act="openPlace" data-arg="${pc.id}"><img src="art/${pc.id}.webp" alt="" loading="lazy" width="1280" height="720"><span><span class="kicker">Place of the hour</span><b>Where on Earth is this?</b><span class="muted small">${doneToday ? `You scored ${doneToday.toLocaleString('en-US')} today.` : 'Pin it on the map.'}</span></span></button>
      <button class="card hm-t" data-act="openLandmark" data-arg="${lm.id}"><img src="art/lm-${lm.id}.webp" alt="" loading="lazy" width="960" height="720"><span><span class="kicker">Landmark of the day</span><b>${esc(lm.name)}</b><span class="muted small">${esc(lm.where)}</span></span></button>
    </div>
    <nav class="hm-ways" aria-label="Ways in">
      <button class="hm-w" data-act="nav" data-arg="atlas"><span>${ico('map')}</span><b>Atlas</b><i>${ico('star')} ${starsTotal(k)} / ${maxStars()}</i></button>
      <button class="hm-w" data-act="nav" data-arg="mistakes"><span>${ico('retry')}</span><b>My mistakes</b><i>${missDue(k).length ? missDue(k).length + ' ready' : missCount(k) ? 'waiting for a gap' : 'none yet'}</i></button>
      <button class="hm-w" data-act="nav" data-arg="library"><span>${ico('book')}</span><b>Library</b><i>${SHELF.length} tools</i></button>
      <button class="hm-w hm-known" data-act="openTool" data-arg="capitals" aria-label="Countries you know: ${known.length} of 195">${worldSVG({ key: 'home-known', fill: Object.fromEntries(known.map((c) => [c, 'kn'])), grat: false, label: 'Countries whose capitals you know' })}<b>Countries you know</b><i>${known.length} of 195</i></button>
      <button class="hm-w" data-act="nav" data-arg="me"><span>${ico('medal')}</span><b>My page</b><i>${ico('coin')} ${coins} · medals</i></button>
      <button class="hm-w" data-act="openWord" data-arg="${esc(tw)}"><span>${ico('book2')}</span><b>${esc(tw)}</b><i>word of the day</i></button>
    </nav>
  </section>`;
}
export const libTile = (t) => `<button class="lib-tile" data-act="openTool" data-arg="${t.id}">
      <span class="lib-art" style="background-image:url(art/${t.art}.webp)"></span>
      <span class="lib-t"><b>${gi(t.glyph)} ${esc(t.name)}</b><span>${esc(t.blurb)}</span></span></button>`;

/* ------------------------------------------------------------- the atlas */

/* Where each world sits on the painted island, MEASURED against atlas.webp
   in its own 0–100 space. Regenerating the map means re-measuring. */
export const MAP_PINS = {
  home: { x: 26, y: 74 }, landwater: { x: 30, y: 50 }, continents: { x: 30, y: 25 }, compass: { x: 42, y: 13 },
  capitals: { x: 55, y: 27, side: 'l' }, weather: { x: 69, y: 21 }, rivers: { x: 81, y: 47 }, globe: { x: 74.5, y: 64 },
  restless: { x: 57, y: 76 }, people: { x: 51, y: 47 },
};
const worldStars = (k, w) => stopsIn(w.id).reduce((a, s) => a + ((k.stops[s.id] || {}).stars || 0), 0);

/* The Atlas has two faces of one island: the MAP (where the places are) and
   YOUR JOURNEY (the order you will walk them, level by level). They were two
   tabs once — "Atlas" and "My road" — but the road only ever explains the map. */
const atlasTabs = (on) => `<div class="seg atlas-seg" role="tablist" aria-label="The Atlas">
  <button role="tab" aria-selected="${on === 'map'}" class="${on === 'map' ? 'on' : ''}" data-act="nav" data-arg="atlas">${ico('map')} The map</button>
  <button role="tab" aria-selected="${on === 'road'}" class="${on === 'road' ? 'on' : ''}" data-act="nav" data-arg="road">${ico('road')} Your journey</button></div>`;
export function viewAtlas() {
  const h = R.h, k = kid(h), nx = road(k).next, here = nx ? byId[nx.stop].world : null;   // the child's own face marks where they are (J6)
  return `<section>
    ${pageHead('The Explorer’s Atlas', '', '', `<span class="chip gold">★ ${starsTotal(k)} / ${maxStars()}</span>`)}
    ${atlasTabs('map')}
    <div class="atlas-scroll" data-center><div class="map-board">
      <img src="art/atlas.webp" alt="A painted map of the Explorer’s Island." width="1920" height="1072">
      ${WORLDS.map((w) => {
        const p = MAP_PINS[w.id], open = stopsIn(w.id).some((s) => stopOpen(h, k, s.id));
        const onroad = road(k).steps.filter((s) => !s.done && byId[s.stop].world === w.id).length;
        return `<button class="map-pin${open ? '' : ' shut'}${p.side === 'l' ? ' lab-l' : ''}" style="left:${p.x}%;top:${p.y}%;--wi:${w.ink};--wt:${w.tint}" data-act="openWorld" data-arg="${w.id}" aria-label="${esc(w.name)}${open ? '' : ', later levels'}">
          <span class="mp-g">${gi(w.glyph)}${here === w.id ? `<img class="mp-me" src="avatars/${esc(avatarFile(k.avatar))}.webp" alt="" width="30" height="30">` : ''}</span><span class="mp-t"><b>${esc(w.short)}</b>${onroad ? `<i class="mp-road">${onroad} on your road</i>` : open ? '' : '<i>Later levels</i>'}</span></button>`;
      }).join('')}
    </div></div>
    <div class="world-list">
      ${WORLDS.map((w) => {
        const ss = stopsIn(w.id), open = ss.some((s) => stopOpen(h, k, s.id));
        return `<button class="wl${open ? '' : ' shut'}" data-act="openWorld" data-arg="${w.id}" style="--wt:${w.tint};--wi:${w.ink}">
          <img src="art/w-${w.id}.webp" alt="" loading="lazy" width="1920" height="815">
          <span class="wl-t"><span class="kicker">${gi(w.glyph)} ${ss.length} stops · from age ${esc(w.band.split('-')[0])}</span><b>${esc(w.name)}</b><span>${esc(w.blurb)}</span><span class="wl-s">★ ${worldStars(k, w)} of ${ss.length * 3}</span></span></button>`;
      }).join('')}
    </div>
  </section>`;
}

/* A stop's level badge: "L3 · 5" for station 5 on the child's own road, a
   plain "L2" for an earlier level, a locked "L7" for a later one. */
function lvBadge(k, id) {
  const f = firstLevel(id), L = k.road.level;
  const st = road(k).steps.find((s) => s.stop === id);
  if (st) return `<b class="lvb road${st.done ? ' ok' : ''}" title="Stop ${st.n} on your Level ${L} road">L${L} · ${st.done ? '✓' : st.n}</b>`;
  return f < L ? `<b class="lvb past">L${f}</b>` : `<b class="lvb later">${ico('lock')} L${f}</b>`;
}

const ROADY = (x) => 76 + 6 * Math.sin((x / 100) * Math.PI * 2 * 1.2 + 0.6);
export function viewWorld(wid) {
  const w = worldOf(wid), h = R.h, k = kid(h), ss = stopsIn(wid);
  const xs = ss.map((_, j) => 9 + (82 * j) / Math.max(1, ss.length - 1));
  let path = ''; for (let x = 0; x <= 100; x += 2) path += `${x ? 'L' : 'M'}${x},${ROADY(x).toFixed(2)} `;
  const sel = R.ui.pick && ss.find((s) => s.id === R.ui.pick) ? R.ui.pick : (ss.find((s) => stopOpen(h, k, s.id) && (k.stops[s.id] || {}).stars < 2) || ss[0]).id;
  const s = byId[sel], open = stopOpen(h, k, sel), rec = k.stops[sel] || {};
  return `<section class="world-page" style="--wt:${w.tint};--wi:${w.ink}">
    ${pageHead(`${gi(w.glyph)} ${esc(w.name)}`, esc(w.blurb), back('nav', 'Atlas', 'atlas'))}
    <div class="board-scroll">
      <div class="board">
        <img src="art/w-${w.id}.webp" alt="" width="1920" height="815">
        <svg class="road" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${path}" class="rd-edge"/><path d="${path}" class="rd"/></svg>
        ${ss.map((st, j) => {
          const o = stopOpen(h, k, st.id), stars = (k.stops[st.id] || {}).stars || 0;
          return `<button class="bpin${cls(stars >= 2 && ' done', !o && ' shut', sel === st.id && ' sel')}" style="left:${xs[j]}%;top:${ROADY(xs[j])}%" data-act="pickStop" data-arg="${st.id}" aria-label="${esc(st.title)}${o ? '' : ', a later level'}">
            <span>${o ? gi(st.glyph) : ico('lock')}</span>${stars ? `<em>${'★'.repeat(stars)}</em>` : ''}${reviewDue(k.stops[st.id]) ? '<i class="rv-due">review</i>' : ''}${lvBadge(k, st.id)}</button>`;
        }).join('')}
      </div>
    </div>
    <div class="card pick-card">
      <span class="pick-shelly" aria-hidden="true">${shelly('point', 88)}</span>
      <p class="kicker">Stop ${ss.indexOf(s) + 1} of ${ss.length} · ${open ? starRow(rec.stars || 0) : 'opens on Level ' + firstLevel(sel)}${reviewDue(rec) ? ' · <b class="rv-due">time to review</b>' : ''}</p>
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
    ${pageHead(`${gi(s.glyph)} ${esc(s.title)}`, `${gi(w.glyph)} ${esc(w.name)}`, back('openWorld', w.short, w.id), starRow(rec.stars))}
    <div class="card learn" id="lesson">
      <div class="q-head"><p class="ns-hook">${esc(s.hook)}</p>${readBtn('#lesson .ns-hook, #lesson .idea, #lesson .why-line', 'Read the lesson to me')}</div>
      <div class="idea">${s.idea.map((p) => `<p>${p}</p>`).join('')}</div>
      <p class="why-line"><b>Why it matters:</b> ${esc(s.why)}</p>
      ${srcList(s.src)}
    </div>
    <div class="card drill-card">
      <p class="kicker">Practice · ${lvName}${onRoad ? ` · stop ${onRoad.n} on your Level ${k.road.level} road` : ''}</p>
      <h3>Ten questions</h3>
      <p class="muted">Seven right earns ★★ and passes this stop; nine right earns ★★★. Best so far: ${rec.best || 0}%.</p>
      ${btn('Start practice', 'startDrill', id, 'primary big')}
    </div>
  </section>`;
}

/* ------------------------------------------------------------- the runner */

/* LIST MODE (L5): the same map question as four named places — one right, three that
   are not (src/listmode.js, tested on every map question the stops make). */
function mapList(q) {
  const { ids, names } = listOptions(q);
  return `<p class="muted small list-say">Choose one place from the list.</p><div class="choice-row map-list" role="group" aria-label="Choose a place">${ids.map((id, i) => `<button class="btn big opt" data-act="choose" data-arg="${esc(id)}"><span>${esc(names[id])}</span> <kbd>${i + 1}</kbd></button>`).join('')}</div>`;
}
const qHead = (q, read, hint, hintBtn) => `<div class="q-head"><p class="long-q" id="q-text" aria-live="polite">${esc(q.text)}</p>${hintBtn || ''}${readBtn(read, 'Read the question to me')}</div>${hint && hint.say ? `<p class="hint-say" role="status">${ico('hint')} ${esc(hint.say)} <span class="muted small">A right answer after a hint pays no coin.</span></p>` : ''}`;
export function questionBody(q, fb, key = 'q', hint = null, hintBtn = '') {
  if (q.kind === 'type') {
    const val = (R.run && R.run.typed) || '';
    return `${q.html ? `<div class="q-fig">${q.html}</div>` : ''}${qHead(q, '#q-text', hint, hintBtn)}
      <div class="type-row"><input id="type-in" class="inp big${fb ? (fb.right ? ' right' : ' wrong') : ''}" data-typed value="${esc(fb ? fb.given : val)}" ${fb ? 'disabled' : 'autofocus'} autocomplete="off" autocapitalize="words" spellcheck="false" aria-label="Your answer" placeholder="Type it here">
      ${fb ? '' : `<button class="btn big primary-o" data-act="typeGo" aria-label="Check my answer">${ico('check')} Check <kbd>Enter</kbd></button>`}</div>`;
  }
  if (q.kind === 'order') {
    const got = (R.run && R.run.order) || [], left = q.items.filter((x) => !got.includes(x));
    const shown = fb ? String(fb.given).split('|') : got, want = q.ans.split('|');
    return `${qHead(q, '#q-text, .order-pool', hint, hintBtn)}
      <ol class="order-got" aria-label="Your order">${q.items.map((_, i) => { const x = shown[i]; return `<li class="${x ? 'set' : ''}${fb ? (x === want[i] ? ' ok' : ' bad') : ''}"><span class="o-n">${i + 1}</span>${x ? esc(x) : '<i>…</i>'}${fb && !fb.right ? `<em>${esc(want[i])}</em>` : ''}</li>`; }).join('')}</ol>
      ${fb ? '' : `<div class="choice-row order-pool" role="group" aria-label="Tap them in order">${left.map((x) => `<button class="btn big opt" data-act="orderPick" data-arg="${esc(x)}"><span>${esc(x)}</span> <kbd>${q.items.indexOf(x) + 1}</kbd></button>`).join('')}</div>
      ${got.length ? `<div class="row center">${btn(`${ico('back')} Undo`, 'orderUndo', '', 'small ghost')}</div>` : ''}`}`;
  }
  if (q.kind === 'map') {
    const pinsFb = fb && !fb.right && q.showAt ? [{ at: q.showAt, cls: 'good', r: 7 }] : [];
    const fill = {};
    if (fb) { if (fb.given) fill[fb.given] = fb.right ? 'ok' : 'bad'; if (!fb.right) for (const c of q.ok.slice(0, 60)) fill[c] = fill[c] || 'ok'; }
    else if (R.ui.mapPick) fill[R.ui.mapPick] = 'pick';
    /* on a phone a whole-world map is ~360px wide — too small to tap Belgium. A
       find-one-country question starts zoomed to that country's continent (the child
       still has to find the country; pinch and ⟲ show the whole world). */
    const phone = typeof matchMedia !== 'undefined' && matchMedia('(max-width: 760px)').matches;
    const cont = !q.view && phone && q.ok && q.ok.length === 1 && byCc[q.ok[0]] && CONTINENTS.find((c) => c.id === byCc[q.ok[0]].cont && c.id !== 'Antarctica');
    const map = q.region ? regionSVG(q.region, { fill, key, tap: !fb, label: q.text })
      : worldSVG({ fill, key, tap: !fb, view: hint && hint.view ? viewFor(hint.view, 0.08) : q.view ? viewFor(q.view) : cont ? viewFor(cont.view, 0.08) : null, label: q.text, pins: pinsFb });
    const list = Store.loadDevice('listMode', false);
    return `${q.html || ''}${qHead(q, '#q-text', hint, hintBtn)}${list && !fb ? mapList(q) : map}
      ${fb ? '' : `<div class="row gap center map-ctl">${list ? '' : `${btn(ico('plus'), 'mapZoom', key + '|in', 'small', 'aria-label="Zoom in"')}${btn(ico('minus'), 'mapZoom', key + '|out', 'small', 'aria-label="Zoom out"')}${btn(ico('reset'), 'mapZoom', key + '|home', 'small', 'aria-label="Whole map"')}`}<button class="btn small" data-act="listMode" aria-pressed="${list}">${list ? `${ico('map')} Show the map` : `${ico('list')} Choose from a list`}</button></div>`}`;
  }
  const struck = hint && hint.kind === 'strike' ? hint.opt : null;
  return `${q.html ? `<div class="q-fig">${q.html}</div>` : ''}${qHead(q, '#q-text, .choice-row', hint, hintBtn)}
    <div class="choice-row${q.opts.length <= 2 ? ' two' : ''}">${q.opts.map((c, i) => `<button class="btn big opt${fb && c === q.ans ? ' right' : ''}${fb && !fb.right && c === fb.given ? ' wrong' : ''}${c === struck ? ' struck' : ''}" data-act="choose" data-arg="${esc(c)}" ${fb || c === struck ? 'disabled' : ''}${c === struck ? ' aria-label="' + esc(c) + ' — taken away by the hint"' : ''}><span>${esc(c)}</span> <kbd>${i + 1}</kbd></button>`).join('')}</div>`;
}

/* Praise names what was done (J1): the place found, the answer, a run of right
   ones in THIS quiz — never a comparison with anyone. */
export function praise(q, run) {
  let n = 0; for (let i = (run ? run.results.length : 0) - 1; i >= 0 && run.results[i].right; i--) n++;
  const what = q.kind === 'map' ? `Right — you found ${esc(q.targetName || 'it')} on the map.` : q.kind === 'order' ? 'Right — every one in its place.' : `Right — <b>${esc(q.ans)}</b>.`;
  const more = n >= 5 ? ` That is ${n} in a row.` : n === 3 ? ' Three in a row.' : '';
  return what + more;
}
export function feedback(q, fb, run) {
  const name = q.kind === 'map' ? (fb.givenName || '') : '';
  if (fb.right) return `<p class="fb good" id="fb-text">${praise(q, run)}</p>${q.why ? `<p class="why-chip">${esc(q.why)}</p>` : ''}`;
  const ans = q.kind === 'map' ? (q.targetName || q.target || 'the place in green') : q.kind === 'order' ? q.ans.split('|').join(' → ') : q.ans;
  return `<p class="fb bad" id="fb-text">${name ? `That’s ${esc(name)}. ` : 'Not this time. '}The answer is <b>${esc(ans)}</b>${q.kind === 'map' ? ', shown in green' : ''}.</p>${q.why ? `<p class="why-chip">${esc(q.why)}</p>` : ''}`;
}

/* G6: a run of right answers in THIS quiz, shown as it grows — never a comparison with anyone */
const streakOf = (run) => { let n = 0; for (let i = run.results.length - 1; i >= 0 && run.results[i].right; i--) n++; return n; };
export function viewRun() {
  const run = R.run;
  if (run.over) return viewRunEnd(run);
  const q = run.items[run.i], fb = run.fb, hint = (run.hints || {})[run.i] || null, st = streakOf(run);
  const hintBtn = fb || hint || run.kind === 'trial' ? '' : `<button class="read-btn hint-btn" data-act="hint" aria-label="A hint (a right answer after it pays no coin)" title="A hint">${ico('hint')}</button>`;
  const stop = byId[run.stop];
  return `<section class="runner narrow ${fb ? (fb.right ? 'is-right' : 'is-wrong') : ''}">
    ${pageHead(esc(run.title), esc(run.sub || ''), back('quitRun', 'Stop'))}
    <div class="run-bar"><div class="dots" aria-label="Question ${run.i + 1} of ${run.items.length}">${run.items.map((_, i) => `<i class="${i < run.results.length ? (run.results[i].right ? 'r' : 'w') : i === run.i ? 'c' : ''}"></i>`).join('')}</div>
      ${st >= 2 ? `<span class="combo${fb && fb.right ? ' pop' : ''}" aria-label="${st} right in a row">${ico('star')} ${st} in a row</span>` : ''}</div>
    ${run.intro && run.i === 0 && stop ? `<details class="card why-card" id="why" open><summary><b>${gi(stop.glyph)} First, the idea</b> <span class="muted small">— ${esc(stop.title)}</span> ${readBtn('#why p', 'Read the idea to me')}</summary>
      <p class="ns-hook">${esc(stop.hook)}</p>${stop.idea.slice(0, 2).map((x) => `<p>${x}</p>`).join('')}<p class="why-line"><b>Why it matters:</b> ${esc(stop.why)}</p></details>` : ''}
    <div class="card qcard">
      ${questionBody(q, fb, 'q' + run.i, hint, hintBtn)}
      ${fb ? feedback(q, fb, run) : ''}
      ${fb ? `<span class="q-shelly" aria-hidden="true">${shelly(fb.right ? 'cheer' : 'oops', 72)}</span>` : ''}
    </div>
    ${fb && !fb.right ? `<div class="row center">${btn('Next <kbd>Enter</kbd>', 'nextQ', '', 'primary big')}</div>` : ''}
  </section>`;
}

/* G6: the round's places, revealed one by one on a small map — by their fill, never a border */
function revealMap(run) {
  const map = run.items.map((q, i) => ({ q, r: run.results[i] })).filter((x) => x.q.kind === 'map' && !x.q.region && x.r);
  if (!map.length) return '';
  const fill = {};
  map.forEach(({ q, r }, i) => { for (const c of (q.ok || []).slice(0, 60)) fill[c] = (r.right ? 'ok' : 'bad') + ' rv rv' + Math.min(i, 9); });
  return `<div class="card reveal-map"><p class="kicker">This round on the map</p>${worldSVG({ key: 'reveal', fill, grat: false, label: 'The places in this round: green found, coral missed' })}</div>`;
}
const mmss = (secs) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
function viewRunEnd(run) {
  const right = run.results.filter((r) => r.right).length, n = run.results.length, s = run.summary || {}, k = kid(R.h);
  const good = right / Math.max(1, n) >= 0.7;
  const ansOf = (q) => q.kind === 'map' ? q.targetName || '' : q.kind === 'order' ? q.ans.split('|').join(' → ') : q.ans;
  return `<section class="narrow">
    ${pageHead(esc(run.title), '', back('endRun', 'Done'))}
    <div class="card end-card${good ? ' good' : ''}">
      <div class="end-cast">${shelly(good ? 'cheer' : 'think', 120, 'end-shelly')}${k ? av(k.avatar, 72, '') : ''}</div>
      ${s.stars != null ? starRow(s.stars, 3, true) : ''}
      <h2>${right} of ${n} right</h2>
      ${(s.lines || []).map((l) => `<p>${l}</p>`).join('')}
      <ul class="end-facts">
        ${s.practised && s.practised.length ? `<li>${ico('book')}<span><b>Practised</b> ${s.practised.map(esc).join(' · ')}</span></li>` : ''}
        ${s.secs != null ? `<li>${ico('timer')}<span><b>Time</b> ${mmss(s.secs)}</span></li>` : ''}
        ${s.starsUp ? `<li>${ico('star')}<span><b>Stars</b> +${s.starsUp}</span></li>` : ''}
        ${s.coins != null && k ? `<li>${ico('coin')}<span><b>Bizzing coins</b> ${s.coins ? '+' + s.coins : 'none this time'}${Object.keys(run.hints || {}).length ? ' (hinted answers pay none)' : ''}</span></li>` : ''}
        ${s.next && s.next.title ? `<li>${ico('next')}<span><b>Next</b> ${esc(s.next.title)}</span></li>` : ''}
      </ul>
      <div class="row gap center wrap">${(s.buttons || []).join('')}${btn('Done', 'endRun', '', 'primary big')}</div>
    </div>
    ${revealMap(run)}
    ${run.results.some((r) => !r.right) ? `<div class="card"><h3>To look at again</h3><p class="muted small">Each one is in <button class="linkish" data-act="nav" data-arg="mistakes">My mistakes</button> and comes back after a gap.</p><ul class="missed">${run.results.map((r, i) => (r.right ? '' : `<li>${run.items[i].html && /<img/.test(run.items[i].html) ? `<span class="mfig">${run.items[i].html}</span>` : ''}<span>${esc(run.items[i].text)} — <b>${esc(ansOf(run.items[i]))}</b></span></li>`)).join('')}</ul></div>` : ''}
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
    <h2 class="jl-h">Level ${L.n} · ${esc(L.name)} <span class="muted small">${ageOf(L.n)} · ${L.steps.length} stops${L.n === mine ? ' · you are here' : ''}</span></h2>
    <p class="muted center-t jl-b">${esc(L.blurb)}</p>
    <ol class="jsteps">${steps.map((s) => {
      const st = byId[s.stop], w = worldOf(st.world);
      return `<li><button class="jstep${s.done ? ' done' : ''}${s.open ? '' : ' shut'}${!show && rd.next && rd.next.stop === s.stop ? ' cur' : ''}" data-act="${s.open ? 'openStop' : 'noop'}" data-arg="${s.stop}" style="--wi:${w.ink};--wt:${w.tint}" ${s.open ? '' : 'aria-disabled="true"'}>
        <span class="js-n">${s.done ? '✓' : s.open ? s.n : ico('lock')}</span><span class="js-t"><b>${gi(st.glyph)} ${esc(st.title)}</b><span>${esc(w.short)} · ${['', 'first look', 'deeper', 'stretch'][s.lv]}</span></span></button></li>`;
    }).join('')}</ol>
    ${show ? '' : `<div class="card center-card">
      <p class="kicker">Level check</p>
      <h3>${rd.all ? `Ready for Level ${L.n + 1}` : 'Already know this?'}</h3>
      <p class="muted">Twelve questions from this road. Ten right opens Level ${Math.min(10, L.n + 1)}${rd.all ? '' : ' — even before you have walked every stop'}.</p>
      ${L.n < 10 || !k.road.finished.includes(10) ? btn('Take the level check', 'levelCheck', '', rd.all ? 'primary big' : 'big') : ''}
    </div>`}
    </div>
  </section>`;
}

/* ------------------------------------------------------------- me */

export const autoRead = (k) => (k.prefs || {}).readAuto ?? k.band === '6-7';
/* ------------------------------------------------------------- grown-ups */

/* THE REPORT CARD (family standard §7): Time · Progress · Mastery, the same three
   measures in every Bizzing app so the Hive can lay them side by side. Time is
   ACTIVE minutes from the family feed; Progress is position on the path; Mastery is
   only what the evidence says the child can now do. Never usage dressed as learning. */
const weekDays = (n = 7) => Array.from({ length: n }, (_, i) => { const d = new Date(Date.now() - i * 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
function reportCard(k) {
  const wk = new Set(weekDays(7));
  const mins = activityRows().filter((x) => x.a === APP && !x.ev && wk.has(x.d) && (x.who || '').toLowerCase() === k.name.toLowerCase()).reduce((a, x) => a + x.m, 0);
  const days7 = [...wk].filter((d) => (k.days[d] || {}).q).length;
  const q7 = [...wk].reduce((a, d) => a + ((k.days[d] || {}).q || 0), 0), ok7 = [...wk].reduce((a, d) => a + ((k.days[d] || {}).ok || 0), 0);
  /* four weeks of right answers, oldest first */
  const weeks = [3, 2, 1, 0].map((w) => weekDays(28).slice(w * 7, w * 7 + 7).reduce((a, d) => a + ((k.days[d] || {}).ok || 0), 0));
  const top = Math.max(1, ...weeks);
  const rd = road(k), passed = Object.values(k.stops).filter((r) => r.stars >= 2).length;
  const capK = Object.values((k.lib.capitals || {}).box || {}).filter((b) => b >= 2).length, flagK = Object.values((k.lib.flags || {}).box || {}).filter((b) => b >= 2).length;
  const stK = Object.values((k.lib.states || {}).box || {}).filter((b) => b >= 2).length;
  const L = learnedList(k), on = EXPEDITIONS.filter((e) => (k.exp || {})[e.id]);
  const worlds = WORLDS.map((w) => { const ss = stopsIn(w.id), p = ss.filter((x) => (k.stops[x.id] || {}).stars >= 2).length; return { w, p, n: ss.length }; });
  const slipping = Object.entries((k.lib.capitals || {}).box || {}).filter(([cc, b]) => b === 1 && ((k.lib.capitals || {}).last || {})[cc]).length;
  return `<div class="card report"><div class="row gap">${av(k.avatar, 44)}<div><h3>${esc(k.name)}</h3><p class="muted small">${BANDS.find((b) => b.id === k.band).label} · Level ${k.road.level} · ${rankOf(k.xp).n} · ${plural(earned(k).length, 'medal')}</p></div></div>
    <div class="rc3">
      <section><h4>${ico('timer')} Time</h4><p class="rc-big">${mins} <span>active minutes this week</span></p><p class="muted small">On ${days7} of the last 7 days. Active means on screen and touched in the last two minutes.</p>
        <div class="rc-trend" aria-label="Right answers each week, four weeks">${weeks.map((n, i) => `<span style="--h:${Math.round((100 * n) / top)}%" title="${n} right"><i></i><b>${n}</b><em>${['3 wks ago', '2 wks ago', 'last wk', 'this wk'][i]}</em></span>`).join('')}</div></section>
      <section><h4>${ico('road')} Progress</h4><p class="rc-big">Level ${rd.L.n} <span>of 10 · ${rd.done} of ${rd.steps.length} stops on this road</span></p>
        <span class="hm-bar"><i style="width:${Math.round((100 * rd.done) / rd.steps.length)}%"></i></span>
        <p class="muted small">${on.length ? on.map((e) => `${gi(e.glyph)} ${esc(e.name)}: day ${expStats(k, e).done} of ${expStats(k, e).days}`).join(' · ') : 'No expedition started yet.'}</p>
        <p class="muted small">This week: ${plural(q7, 'question')}, ${ok7} right${q7 ? ` (${Math.round((100 * ok7) / q7)}%)` : ''}.</p></section>
      <section><h4>${ico('brain')} Mastery</h4><p class="rc-big">${passed} <span>stops passed · ${capK} capitals · ${flagK} flags · ${stK} state capitals known</span></p>
        <ul class="rc-worlds">${worlds.map(({ w, p, n }) => `<li><span>${gi(w.glyph)} ${esc(w.short)}</span><span class="hm-bar thin"><i style="width:${Math.round((100 * p) / n)}%"></i></span><b>${p}/${n}</b></li>`).join('')}</ul>
        ${slipping ? `<p class="muted small">${slipping} capital${slipping > 1 ? 's' : ''} slipped after a miss — they come back in the capitals quiz.</p>` : ''}</section>
    </div>
    ${L.length ? `<h4>What ${esc(k.name)} can do now</h4><ul class="learned">${L.map((x) => `<li>✓ ${esc(k.name)} can ${esc(x.m.objective)} <span class="muted small">(${esc(x.e.name)}, ${x.on})</span></li>`).join('')}</ul>` : ''}
    <p class="hint">${esc(EXPEDITIONS_PARENT)}</p>
    ${(() => { const cs = certificatesOf(k); return `<details class="rc-set rc-certs"${cs.length ? '' : ''}><summary>Certificates for ${esc(k.name)} (${cs.length})</summary>
      ${cs.length ? `<p class="muted small">Each is a picture made on this device — nothing is uploaded. Share or save it from here.</p><ul class="certs">${cs.map((c) => `<li><span><b>${esc(c.title)}</b><span class="muted small">${esc(k.name)} ${esc(c.what)}</span></span>${btn(`${ico('share')} Make the picture`, 'cert', k.id + '|' + c.id, 'small')}</li>`).join('')}</ul>` : `<p class="muted small">The first one comes with a finished level, a world walked or an expedition done.</p>`}</details>`; })()}
    <details class="rc-set"><summary>Settings for ${esc(k.name)}</summary>
      <div class="row gap wrap"><span>Today’s ring:</span>${GOALS.map((g) => `<button class="btn small${goalOf(k) === g ? ' primary-o' : ''}" data-act="kidGoal" data-arg="${k.id}|${g}" aria-pressed="${goalOf(k) === g}">${g} a day</button>`).join('')}</div>
      <div class="row gap wrap"><span>Read questions aloud by itself:</span><button class="btn small" data-act="kidRead" data-arg="${k.id}" aria-pressed="${autoRead(k)}">${autoRead(k) ? 'On' : 'Off'}</button></div>
      <div class="row gap wrap">${btn(`Delete ${esc(k.name)}’s progress`, 'delKid', k.id, 'danger small')}</div>
      ${R.ui.confirm === 'del:' + k.id ? `<p class="fb bad">This deletes everything ${esc(k.name)} has done on this device. ${btn(`Yes, delete ${esc(k.name)}`, 'delKidYes', k.id, 'danger small')}</p>` : ''}
    </details>
  </div>`;
}

export function viewGrownups() {
  const h = R.h;
  if (!R.ui.gate) {
    return `<section class="narrow">${pageHead('For grown-ups', '', back('nav', 'Back', 'home'))}
      <div class="card center-card"><p>${h.parent.pinHash ? 'Enter your four-digit PIN.' : 'Set a four-digit PIN for this page.'}</p>
        <input id="pin" class="inp pin" inputmode="numeric" maxlength="4" data-draft="pin" value="${esc(R.ui.gateIn)}" aria-label="PIN" autocomplete="off">
        <div class="row center">${btn(h.parent.pinHash ? 'Open' : 'Set PIN', 'gate', '', 'primary')}</div>
        <p class="hint">The PIN is a deterrent, not security — anyone who can clear this browser’s storage can reset it.</p></div></section>`;
  }
  return `<section class="narrow">${pageHead('For grown-ups', 'What each child has done, measured from their answers.', back('nav', 'Back', 'home'))}
    <p class="muted small center-t">The family-wide view, across every Bizzing app, is on <a href="${HIVE}#/grownups">the Hive’s grown-ups page</a>.</p>
    ${h.kids.map(reportCard).join('')}
    <div class="card"><h3>Settings</h3>
      <label class="set-row"><input type="checkbox" data-act="plan" ${h.parent.plan === 'family' ? 'checked' : ''}><span>Family plan — opens all six worlds and their faces for every child here. Until the family’s own server is built this is a switch a grown-up sets; no payment is ever asked for on a child’s screen.</span></label>
      <label class="set-row"><input type="checkbox" data-act="tester" ${h.parent.tester ? 'checked' : ''}><span>Tester mode — opens every stop and level for a grown-up to look round. Changes nothing about a child.</span></label>
      <label class="set-row${GKEY ? '' : ' off'}"><input type="checkbox" data-act="streetview" ${h.parent.streetview ? 'checked' : ''} ${GKEY ? '' : 'disabled'}><span>Real photos in Where on Earth? — Google Street View of real places. <b>This is the one thing in the app that contacts another company:</b> while it is on, Where on Earth? loads each photo from Google, so Google sees this device’s internet address and which photo was shown. It sends nothing about your child — no name, no age, no answers, no location. On by default; untick to use paintings only.${GKEY ? '' : ' (Not set up in this copy of the app.)'}</span></label>
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

/* ------------------------------------------------------------- the mistakes deck (F3) */
export function viewMistakes() {
  const k = kid(R.h), due = missDue(k), all = Object.entries(k.miss || {}).map(([key, m]) => ({ key, ...m })).sort((a, b) => b.at - a.at);
  const waitFor = (m) => { const ms = m.at + [20 * 3600e3, 3 * 864e5][Math.min(m.box, 1)] - Date.now(); return ms <= 0 ? 'ready now' : ms < 864e5 ? 'back tomorrow' : `back in ${Math.ceil(ms / 864e5)} days`; };
  const ansOf = (q) => q.kind === 'map' ? (q.targetName || '') : q.kind === 'order' ? (q.ans || '').split('|').join(' → ') : q.ans;
  if (!all.length) return `<section class="narrow">${pageHead('My mistakes')}${empty('No mistakes kept yet. When you miss a question it waits here, and comes back a day later — that is how places stick.', btn('Back to my journey', 'nav', 'home', 'big'))}</section>`;
  return `<section class="narrow mistakes">
    ${pageHead('My mistakes', `${plural(all.length, 'card')} · ${due.length} ready`)}
    <div class="card mist-go">${says(due.length ? 'point' : 'sleep', due.length ? `${due.length === 1 ? 'One card is' : `${due.length} cards are`} ready. Right after a gap moves a card up; two steps up and it is yours, and it leaves the deck.` : 'Nothing is ready yet. Each card comes back after a gap — a day, then three days — because remembering later is what learning is.')}
      ${due.length ? btn(`Practise my misses (${Math.min(10, due.length)})`, 'practiseMisses', '', 'primary big') : ''}</div>
    <ul class="mist-list">${all.map((m) => `<li class="card mist"><div class="mist-fig">${m.q.html && !/<button/.test(m.q.html) ? m.q.html : ''}</div><div><p class="kicker">${esc(m.from || '')} · ${['step 1 of 2', 'step 2 of 2'][Math.min(m.box, 1)]} · ${waitFor(m)}</p><p>${esc(m.q.text)}</p><p class="muted small">The answer: <b>${esc(ansOf(m.q))}</b>${m.n > 1 ? ` · missed ${m.n} times` : ''}</p></div></li>`).join('')}</ul>
  </section>`;
}
