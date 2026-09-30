/* views.js — every screen, as a function from state to a string.
   Views never compute progress; model.js does. */

import { R } from './runtime.js';
import { esc, cls } from './ui.js';
import { WORLDS, STOPS, byId, worldOf, stopsIn } from './stops.js';
import { LEVELS, ageOf, firstLevel } from './levels.js';
import { THEMES, themeOf, themePicker } from './themes.js';
import { Store } from './store.js';
import { BANDS, AVATARS, AVATAR_PACKS, AVATAR_NAME, avatarFile, RANKS, RANK_SRC, rankOf, kid, stopRec, road, stopOpen, lvFor, starsTotal, maxStars, levelOf } from './model.js';
import { worldSVG, regionSVG, viewFor } from './map.js';
import { POSTCARDS } from './data/postcards.js';
import { dayKey, seeded, pick } from './rand.js';
import { SHELF } from './library/index.js';
import { GKEY } from './photos.js';

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
  `<button class="back" data-act="${act}"${arg ? ` data-arg="${esc(arg)}"` : ''} aria-label="${esc(label)}"><span aria-hidden="true">←</span> ${esc(label)}</button>`;
export function pageHead(title, sub = '', backBtn = '', right = '') {
  return `<header class="phead">${backBtn || '<span></span>'}<div class="phead-t"><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="phead-r">${right}</div></header>`;
}
export const srcList = (src) => (src && src.length ? `<details class="src"><summary>Where this is checked</summary><ul>${src.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></details>` : '');

/* ------------------------------------------------------------- the shell */

export const TABS = [
  { k: 'home', n: 'Home', icon: 'home' },
  { k: 'atlas', n: 'Atlas', icon: 'map' },
  { k: 'road', n: 'My road', icon: 'road' },
  { k: 'library', n: 'Library', icon: 'book' },
];
const NAV_OF = { lib: 'library', stop: 'atlas', world: 'atlas', run: null, me: 'home', grownups: null, privacy: null };

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
  }[k] || '';
  return `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
}

export function shell(body) {
  const h = R.h, k = kid(h);
  const nav = NAV_OF[R.ui.nav] !== undefined ? NAV_OF[R.ui.nav] : R.ui.nav;
  const rk = k ? rankOf(k.xp) : null;
  const tabs = (cl) => TABS.map((t) => `<button class="${cl}${nav === t.k ? ' on' : ''}" data-act="nav" data-arg="${t.k}" ${nav === t.k ? 'aria-current="page"' : ''}>${icon(t.icon)}<span>${t.n}</span></button>`).join('');
  return `
  <a class="skip" href="#main">Skip to the content</a>
  <header class="top">
    <button class="brand" data-act="nav" data-arg="home" aria-label="Bizzing Geography — home">
      <svg viewBox="0 0 40 40" class="brand-mark" aria-hidden="true"><rect width="40" height="40" rx="11" class="bm-bg"/><circle cx="20" cy="20" r="11.5" class="bm-globe"/><path d="M8.5 20h23M20 8.5c-5 6-5 17 0 23M20 8.5c5 6 5 17 0 23" class="bm-lines"/><path d="M28 7l3 5-5 1z" class="bm-star"/></svg>
      <span class="brand-t">Bizzing <em>Geography</em></span>
    </button>
    ${k ? `<nav class="tabs" aria-label="Main">${tabs('tab')}</nav>` : '<span class="grow"></span>'}
    <div class="tools">
      ${k ? `<button class="rank-pill" data-act="nav" data-arg="me" aria-label="Your rank: ${rk.n}. ${k.xp} points.">
        <span class="rp-ico" aria-hidden="true">${rk.i + 1}</span><span class="rp-t"><b>${esc(rk.n)}</b><i style="--p:${rk.pct}%"></i></span></button>
        <button class="who" data-act="nav" data-arg="me" aria-label="${esc(k.name)}'s page">${av(k.avatar, 34, '')}</button>` : ''}
      <button class="tool" data-act="sound" aria-label="Sound ${R.sound ? 'on' : 'off'}">${icon(R.sound ? 'sound' : 'mute')}</button>
      <button class="tool" data-act="mode" aria-label="Light or dark">${icon('moon')}</button>
      <button class="tool" data-act="nav" data-arg="grownups" aria-label="Grown-ups" title="Grown-ups">${icon('lock')}</button>
    </div>
  </header>
  ${h.parent.tester ? '<div class="tester" role="note">TESTER MODE — every stop is open. Nothing about the child changes. <button data-act="testerOff">Turn off</button></div>' : ''}
  <main id="main" class="content" tabindex="-1">${body}</main>
  ${k ? `<nav class="tabbar" aria-label="Main">${tabs('tb')}</nav>` : ''}
  <footer class="foot">Bizzing Geography · part of the Bizzing family with
    <a href="https://www.bizzingbee.com/" rel="noopener">Bizzing Bee</a>,
    <a href="https://aayuvis.github.io/bizzingindia.com/" rel="noopener">Bizzing India</a>,
    <a href="https://aayuvis.github.io/bizzingfinance/" rel="noopener">Bizzing Finance</a> and
    <a href="https://aayuvis.github.io/Bizzing-Maths/" rel="noopener">Bizzing Maths</a>
    · No ads, no tracking, no accounts. ${GKEY && R.h.parent.streetview ? 'GeoGuesser’s real photos load from Google Street View (a grown-up can switch them off); nothing about your child is sent.' : 'Nothing leaves this device.'} Maps: Natural Earth (India’s depiction). <button class="linkish" data-act="nav" data-arg="privacy">Privacy</button></footer>`;
}

/* ------------------------------------------------------------- welcome */

export function viewWelcome() {
  const d = R.ui.draft || (R.ui.draft = { name: '', band: '', avatar: AVATARS[0] });
  const first = !R.h.kids.length;
  return `<section class="welcome">
    <div class="wel-hero geo-hero" style="background-image:url(art/home-hero.webp)">
      <div class="wel-tx">
        <p class="kicker">${first ? 'Welcome to Bizzing Geography' : 'Add an explorer'}</p>
        <h1 class="display">Know the world — <em>and know how you know.</em></h1>
        <p class="lead">Maps and compasses, continents and capitals, rivers, weather and the restless Earth — then GeoGuesser, flags and landmarks in the Library. For ages 6 to 14.</p>
      </div>
    </div>
    <div class="card form">
      <label class="lab" for="kname">First name or nickname</label>
      <input id="kname" class="inp" data-draft="name" value="${esc(d.name)}" maxlength="20" autocomplete="off" autocapitalize="words" placeholder="e.g. Ahana">
      <p class="hint">Just a first name. We never ask for a surname, a birthday, a photo, an email or where you live — and nothing you type leaves this device.</p>
      <p class="lab">Age</p>
      <div class="chips" role="radiogroup" aria-label="Age">
        ${BANDS.map((b) => `<button class="chip-btn${d.band === b.id ? ' on' : ''}" role="radio" aria-checked="${d.band === b.id}" data-act="draftBand" data-arg="${b.id}"><b>${b.label}</b><span>${b.blurb}</span></button>`).join('')}
      </div>
      <p class="lab">Pick a face</p>
      ${avatarPicker(d.avatar, 'draftAv', 'new')}
      <div class="row gap end">
        ${!first ? btn('Cancel', 'nav', 'home') : ''}
        ${btn('Start exploring', 'createKid', '', 'primary big', d.name.trim() && d.band ? '' : 'disabled')}
      </div>
    </div>
  </section>`;
}

/* ------------------------------------------------------------- home */

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
export const todaysCard = () => pick(POSTCARDS, seeded('pc' + dayKey()));

export function viewHome() {
  const k = kid(R.h), rd = road(k), rk = rankOf(k.xp);
  const nx = rd.next ? byId[rd.next.stop] : null;
  const pc = todaysCard(), gd = (k.lib.geoguess || {}).daily || {};
  const doneToday = gd[dayKey()];
  return `<section class="home">
    <div class="hello">
      ${av(k.avatar, 64, '')}
      <div><p class="kicker">${greet()}, ${esc(k.name)}</p><h1>Where shall we explore today?</h1>
        <button class="theme-chip" data-act="themes" aria-label="Choose a theme"><i aria-hidden="true"></i>Theme: ${esc(THEMES.find((t) => t.id === themeOf(k)).name)}</button></div>
    </div>
    <div class="home-grid">
      <button class="card next-card" data-act="${nx ? 'openStop' : 'nav'}" data-arg="${nx ? nx.id : 'road'}">
        <span class="kicker">Level ${rd.L.n} · ${esc(rd.L.name)} · ${rd.done} of ${rd.steps.length} stations</span>
        ${nx ? `<b class="nc-t">${nx.glyph} ${esc(nx.title)}</b><span class="muted">${esc(nx.hook)}</span><span class="btn primary">Go to station ${rd.next.n} →</span>`
          : `<b class="nc-t">🏁 Road complete</b><span class="muted">Every station on Level ${rd.L.n} is done. Take the level check to open Level ${rd.L.n + 1}.</span><span class="btn primary">Take the level check</span>`}
      </button>
      <button class="card pc-card" data-act="openTool" data-arg="geoguess">
        <img src="art/${pc.id}.webp" alt="" loading="lazy" width="1280" height="720">
        <span class="pc-t"><span class="kicker">Today’s postcard</span><b>Where in the world is this?</b><span class="muted">${doneToday ? `You scored ${doneToday.toLocaleString('en-US')} points today. Come back tomorrow for a new one.` : 'One painted place a day. Tap the map where you think it is.'}</span></span>
      </button>
    </div>
    <div class="card rank-card">
      <div class="row gap"><span class="rank-badge">${rk.i + 1}</span><div class="grow"><p class="kicker">Your rank</p><h3>${esc(rk.n)}</h3><p class="muted small">${esc(rk.why)}</p></div>
        <div class="gold-line">★ ${starsTotal(k)} <span class="muted">stars</span></div></div>
      ${rk.next ? `<div class="meter"><i style="width:${rk.pct}%"></i></div><p class="muted small">${rk.next.xp - k.xp} more right answers to ${esc(rk.next.n)}.</p>` : '<p class="muted small">The top rank. Every right answer still counts.</p>'}
    </div>
    <h2 class="sec-h">The Library</h2>
    <div class="lib-grid mini">${SHELF.slice(0, 4).map(libTile).join('')}</div>
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

export function viewAtlas() {
  const h = R.h, k = kid(h);
  return `<section>
    ${pageHead('The Explorer’s Atlas', 'Ten places on one island, each with its own lessons. Tap a place to travel there.', '', `<span class="chip gold">★ ${starsTotal(k)} / ${maxStars()}</span>`)}
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
    <div class="card learn">
      <p class="ns-hook">${esc(s.hook)}</p>
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
    return `${q.html || ''}<p class="long-q" aria-live="polite">${esc(q.text)}</p>${map}
      ${fb ? '' : `<div class="row gap center map-ctl">${btn('＋', 'mapZoom', key + '|in', 'small', 'aria-label="Zoom in"')}${btn('－', 'mapZoom', key + '|out', 'small', 'aria-label="Zoom out"')}${btn('⟲', 'mapZoom', key + '|home', 'small', 'aria-label="Whole map"')}<span class="muted small">Tap a place · or arrows + Enter</span></div>`}`;
  }
  return `${q.html ? `<div class="q-fig">${q.html}</div>` : ''}<p class="long-q" aria-live="polite">${esc(q.text)}</p>
    <div class="choice-row${q.opts.length <= 2 ? ' two' : ''}">${q.opts.map((c, i) => `<button class="btn big opt${fb && c === q.ans ? ' right' : ''}${fb && !fb.right && c === fb.given ? ' wrong' : ''}" data-act="choose" data-arg="${esc(c)}" ${fb ? 'disabled' : ''}><span>${esc(c)}</span> <kbd>${i + 1}</kbd></button>`).join('')}</div>`;
}

export function feedback(q, fb) {
  const name = q.kind === 'map' ? (fb.givenName || '') : '';
  if (fb.right) return `<p class="fb good">Right.</p>${q.why ? `<p class="why-chip">${esc(q.why)}</p>` : ''}`;
  const ans = q.kind === 'map' ? (q.targetName || q.target || 'the place in green') : q.ans;
  return `<p class="fb bad">${name ? `That’s ${esc(name)}. ` : 'Not this time. '}The answer is <b>${esc(ans)}</b>${q.kind === 'map' ? ', shown in green' : ''}.</p>${q.why ? `<p class="why-chip">${esc(q.why)}</p>` : ''}`;
}

export function viewRun() {
  const run = R.run;
  if (run.over) return viewRunEnd(run);
  const q = run.items[run.i], fb = run.fb;
  return `<section class="runner narrow ${fb ? (fb.right ? 'is-right' : 'is-wrong') : ''}">
    ${pageHead(esc(run.title), esc(run.sub || ''), back('quitRun', 'Stop'))}
    <div class="dots" aria-label="Question ${run.i + 1} of ${run.items.length}">${run.items.map((_, i) => `<i class="${i < run.results.length ? (run.results[i].right ? 'r' : 'w') : i === run.i ? 'c' : ''}"></i>`).join('')}</div>
    <div class="card qcard">
      ${questionBody(q, fb, 'q' + run.i)}
      ${fb ? feedback(q, fb) : ''}
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
  return `<section class="narrow">
    ${pageHead('My road', `Level ${L.n} · ${esc(L.name)} · ${ageOf(L.n)}`)}
    <div class="seg lv-seg" role="tablist" aria-label="Level">${LEVELS.map((x) => `<button role="tab" aria-selected="${x.n === L.n}" class="${x.n === L.n ? 'on' : ''}${x.n === k.road.level ? ' mine' : ''}${k.road.finished.includes(x.n) ? ' fin' : ''}" data-act="lvShow" data-arg="${x.n}">${x.n}</button>`).join('')}</div>
    <p class="lead center-t">${esc(L.blurb)}</p>
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
  </section>`;
}

/* ------------------------------------------------------------- me */

export function viewMe() {
  const k = kid(R.h), rk = rankOf(k.xp);
  return `<section class="narrow">
    ${pageHead(esc(k.name), `${BANDS.find((b) => b.id === k.band).label} · Level ${k.road.level}`)}
    <div class="card ladder-card">
      <h3>Explorer ranks</h3>
      <ol class="ladder">${RANKS.map((r, i) => `<li class="${i <= rk.i ? 'got' : ''}${i === rk.i ? ' now' : ''}"><b>${i + 1}. ${esc(r.n)}</b> <span class="muted small">${r.xp} right answers — ${esc(r.why)}</span></li>`).join('')}</ol>
      ${srcList(RANK_SRC)}
    </div>
    ${themePicker(k)}
    <div class="card row gap wrap"><div style="flex:1;min-width:200px"><h3>Moving background</h3><p class="muted small">The world behind the page moves. Switch it to a still picture on this device if it distracts. It always holds still during a quiz.</p></div>
      <button class="btn" data-act="still" aria-pressed="${Store.loadDevice('still', false)}">${Store.loadDevice('still', false) ? '▶ Let it move' : '⏸ Hold it still'}</button></div>
    <div class="card"><h3>Change your face</h3>${avatarPicker(k.avatar, 'setAv', 'me')}</div>
    <div class="card">
      <h3>Explorers on this device</h3>
      <div class="who-list">${R.h.kids.map((x) => `<button class="who-row${x.id === k.id ? ' on' : ''}" data-act="switchKid" data-arg="${x.id}">${av(x.avatar, 40)} <b>${esc(x.name)}</b></button>`).join('')}
        <button class="btn" data-act="nav" data-arg="welcome">+ Add an explorer</button></div>
    </div>
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
        <p>Capitals known in the Library: ${Object.values((k.lib.capitals || {}).box || {}).filter((b) => b >= 2).length} of 195 countries, ${Object.values((k.lib.states || {}).box || {}).filter((b) => b >= 2).length} states and provinces.</p></div>`;
    }).join('')}
    <div class="card"><h3>Settings</h3>
      <label class="tog"><input type="checkbox" data-act="tester" ${h.parent.tester ? 'checked' : ''}> Tester mode — opens every stop and level for a grown-up to look round. Changes nothing about a child.</label>
      <label class="tog${GKEY ? '' : ' off'}"><input type="checkbox" data-act="streetview" ${h.parent.streetview ? 'checked' : ''} ${GKEY ? '' : 'disabled'}> Real photos in GeoGuesser — Google Street View of real places. <b>This is the one thing in the app that contacts another company:</b> while it is on, GeoGuesser loads each photo from Google, so Google sees this device’s internet address and which photo was shown. It sends nothing about your child — no name, no age, no answers, no location. On by default; untick to use paintings only.${GKEY ? '' : ' (Not set up in this copy of the app.)'}</label>
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
      <p><b>One exception: real photos in GeoGuesser.</b> Each photo is loaded from Google Street View, so Google sees this device’s internet address and which photo was requested (Google’s privacy policy applies to that). Nothing about the child is sent — no name, age, answers or location. Real photos are on by default; a grown-up can switch them off in the grown-ups’ page, and then the app contacts no one.</p>
      <p>For each child it keeps a first name or nickname, an age band (never a birthday), a chosen face, and their answers — in this browser’s own storage, on this device only.</p>
      <p>It never asks where anyone lives, and GeoGuesser never uses the device’s location.</p>
      <p>A grown-up can back this up to a file, restore it, or delete it all from the grown-ups’ page.</p>
    </div></section>`;
}
