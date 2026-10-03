/* main.js — the shell: boot, hash routing, the question runner, keys, and
   every data-act in one table. */

import { gi, ico } from './icons.js';
import { R } from './runtime.js';
import { Store, pinHash } from './store.js';
import { on, fire, bindRoot, sfx, setSound, setCalm, onSound, ac, toast, confetti, say, hush, setSayRate } from './ui.js';
import * as C from './chrome.js';
import { bindShell } from './bizzing-shell.js';
import { oops } from './mascot.js';
import * as M from './music.js';
import { viewSearch, placeOf } from './search.js';
import { missAdd, missDue, missRight, missWrong, keyOf } from './mistakes.js';
import { CATALOGUE, byAvatar, worldNo, canWear, stateOf as avState } from './avatars.js';
import { buy as buyAvatar, buyWorld as buyWorldFam, worldOpen } from './bizzing-avatars.js';
import { byId, drill, correct, worldOf, STOPS, newSeen, remember, vary } from './stops.js';
import { newHousehold, newKid, kid, AVATARS, tick, session, GOALS, stopRec, scoreRun, road, stopOpen, lvFor, passLevel, levelOf, CHECK_PASS } from './model.js';
import { byCc } from './geo.js';
import { shuffle, rnd } from './rand.js';
import * as V from './views.js';
import { toolById, SHELF, loadTool, GAMES, GAME_IDS, metaOf } from './library/index.js';
import { bindMaps, restoreMaps, zoomMap, resetMap } from './mapui.js';
import { shapeName, project } from './map.js';
import { regionsOf } from './library/states.js';
import { GKEY, photosOn } from './photos.js';
import { THEMES, themeOf, isTheme, applyTheme, syncThemeColor } from './themes.js';
import { syncScene } from './scenes.js';
import * as X from './expeditions.js';
import { APP, trackActivity, trackMilestone, familyOff, earn as famEarn, spend, balance as famBalance } from './family.js';
import { xpFor, bonus, newMedals, SHOP, shopOf } from './rewards.js';
import { nextStep } from './next.js';
import { demoHousehold } from './demo.js';
import { expeditionById } from './data/expeditions.js';
import { hintFor } from './hints.js';
import { certificatesOf, shareCertificate } from './certificate.js';
import { dayKey } from './rand.js';
import { feedCard, feedEnd, feedHead, bindFeedKeys } from './bizzing-feed.js';
import { feedOn, feedSession, feedRec } from './feed.js';
import { empty } from './mascot.js';

const root = document.getElementById('app');

/* ------------------------------------------------------------- boot */

/* ?demo: a sample explorer with weeks of made-up progress, held in memory only —
   never saved, never written to the family's shared feeds (standard §14).
   ?from=hive: the child came from the Hive; a chip goes back to their day. */
const QS = new URLSearchParams(location.search);
R.demo = QS.has('demo');
try { if (QS.get('from') === 'hive') sessionStorage.setItem('bzg.fromHive', '1'); R.fromHive = sessionStorage.getItem('bzg.fromHive') === '1'; } catch (_) { R.fromHive = QS.get('from') === 'hive'; }
familyOff(R.demo);
R.h = R.demo ? demoHousehold() : Store.loadHousehold() || newHousehold();
R.sound = Store.loadDevice('sound', true); setSound(R.sound);
const mode = Store.loadDevice('mode', null);
const sysDark = matchMedia('(prefers-color-scheme: dark)');
document.documentElement.setAttribute('data-mode', mode || (sysDark.matches ? 'dark' : 'light'));
sysDark.addEventListener && sysDark.addEventListener('change', (e) => { if (!Store.loadDevice('mode', null)) document.documentElement.setAttribute('data-mode', e.matches ? 'dark' : 'light'); });

/* coins only through the family wallet, only for the standard events; a toast says so */
function earn(why, quiet = false) { const k = kid(R.h); if (!k) return 0; const n = famEarn(APP, k.name, why); if (n && !quiet) R.ui.coinToast = (R.ui.coinToast || 0) + n; return n; }
/* every save is a moment to notice a medal: recorded once, so celebrated once */
function checkMedals() {
  const k = kid(R.h); if (!k) return;
  const quiet = k.medalsQuiet; const got = newMedals(k);
  if (quiet) { delete k.medalsQuiet; return; }     // medals earned before medals existed: kept, not re-celebrated
  if (got.length) { R.ui.medalPop = [...(R.ui.medalPop || []), ...got]; for (const m of got) trackMilestone(APP, k.name, m.id.startsWith('world-') ? 'world' : 'mastery', `Medal: ${m.name}`); sfx.level(); confetti(70); }
}
function save() { checkMedals(); if (!R.demo) Store.saveHousehold(R.h); }

/* The Library's context: everything a tool may touch, and no more. */
function libCtx(id) {
  const k = kid(R.h); R.ui.lib = R.ui.lib || {};
  const ui = R.ui.lib[id] || (R.ui.lib[id] = {});
  const data = k.lib[id] || (k.lib[id] = {});
  return {
    id, kid: k, band: k.band, ui, data, save, render, toast, sfx, confetti, say,
    photos: photosOn(R.h), photosReady: !!GKEY,
    tick: (right) => { tick(k, right, right ? xpFor(k, id) : 0); if (right) earn('right'); save(); },
    known: () => bonus(k, 'known'),             // a capital or flag just became known (two different days)
    earn: (why) => earn(why),
    session: () => session(k),
    startRun: (title, items, extra = {}) => startRun('lib', title, items, { ...extra, lib: id }),
    go: (nav, arg) => go(nav, arg), openStop: (sid) => fire('openStop', sid),
  };
}

/* ------------------------------------------------------------- routing */

let selfHash = false;
function writeHash() {
  const { nav, arg } = R.ui;
  const h = '#/' + nav + (arg ? '/' + encodeURIComponent(arg) : '');
  if (location.hash !== h) { selfHash = true; location.hash = h; }
}
/* #/continue (from the Hive): straight to the Continue card's target */
function doContinue() { const k = kid(R.h); if (!k) return go(R.h.kids.length ? 'home' : 'welcome'); const n = nextStep(k); fire(n.act, n.arg); }
function readHash() {
  if (/^#\/continue\b/.test(location.hash || '')) { R.ui.nav = 'home'; return doContinue(); }
  /* the home's links (Bee's home is anchors): a trip, the place of the hour, the word of the hour */
  const hm = /^#\/(trip|place|word)(?:\/(.+))?$/.exec(location.hash || '');
  if (hm && kid(R.h)) { const a = hm[2] ? decodeURIComponent(hm[2]) : ''; if (hm[1] === 'trip') return fire('trip'); if (hm[1] === 'place') return fire('openPlace', a); return fire('openWord', a); }
  const m = /^#\/([a-z]+)(?:\/(.+))?$/.exec(location.hash || '');
  if (m) go(m[1], m[2] ? decodeURIComponent(m[2]) : null, true); else render();
}
addEventListener('hashchange', () => { if (selfHash) { selfHash = false; return; } readHash(); });

/* A link to ONE thing, not its shelf (the owner: "navigation to that specific topic, not the generic
   tool"): #/lib/<tool>/<item> opens the tool ON the item, #/expd/<id>/<day> opens the expedition on that
   day's part with the day lit. FOCUS says what "on the item" means for each tool; test/feed.mjs holds
   every card about one thing to a link like this. */
const FOCUS = {
  explorer: (t, x, cc) => { t.act('sel', cc, x); },
  capitals: (t, x, cc) => { t.act('cont', 'All', x); t.act('sel', cc, x); },
  flags: (t, x, cc) => { t.act('sel', cc, x); },
  states: (t, x, id) => { t.act('c', id.split('-')[0], x); t.act('sel', id, x); },
};
function focusTool(id, item) {
  if (!FOCUS[id]) return;
  loadTool(id).then((t) => { if (!t) return; FOCUS[id](t, libCtx(id), item); if (R.ui.nav === 'lib' && R.ui.arg === id) render(); });
}
const ROUTES = new Set(['home', 'atlas', 'world', 'stop', 'road', 'exp', 'expd', 'proj', 'library', 'play', 'lib', 'game', 'me', 'settings', 'shop', 'collection', 'medals', 'help', 'search', 'mistakes', 'feed', 'run', 'welcome', 'grownups', 'privacy']);
function go(nav, arg = null, fromHash = false) {
  let focus = null;
  if ((nav === 'lib' || nav === 'expd') && arg && arg.includes('/')) { const i = arg.indexOf('/'); focus = arg.slice(i + 1); arg = arg.slice(0, i); }
  if (nav === 'expd' && focus) { const j = X.partOfDay(arg, focus); if (j != null && j >= 0) { R.ui.part = j; R.ui.focusDay = focus; } }
  else if (nav === 'expd') R.ui.focusDay = null;
  if (nav === 'run' && !R.run) nav = 'home';
  if (nav !== 'run' && R.run) R.run = null;
  /* a link to something that is not there lands on its shelf AND says so in the address (#/lib/nope was the audit's trap) */
  const asked = nav;
  if (!ROUTES.has(nav)) { nav = 'home'; arg = null; }          // #/qqq: Home, and the address is corrected (was kept)
  if (nav === 'stop' && !byId[arg]) { nav = 'atlas'; arg = null; }
  if (nav === 'lib' && GAME_IDS.has(arg)) nav = 'game';     // a game is on the Play shelf, wherever it was linked from
  if (nav === 'lib' && !SHELF.some((t) => t.id === arg)) { nav = 'library'; arg = null; }
  if (nav === 'game' && !GAME_IDS.has(arg)) { nav = 'play'; arg = null; }
  if (nav === 'world' && !worldOf(arg)) { nav = 'atlas'; arg = null; }
  if (nav !== asked) fromHash = false;
  if (nav === 'grownups' && R.ui.nav !== 'grownups') { R.ui.gate = false; R.ui.gateIn = ''; }
  if (nav !== R.ui.nav) R.ui.prev = R.ui.nav;
  R.ui.nav = nav; R.ui.arg = arg; R.ui.confirm = null; R.ui.menu = false; R.ui.drawer = false; R.ui.sheet = null;
  hush();
  if (!fromHash) writeHash();
  render();
  if (!fromHash) scrollTo(0, 0);
  if (nav === 'lib' && focus) focusTool(arg, focus);
  if (nav === 'expd' && R.ui.focusDay) requestAnimationFrame(() => { const el = root.querySelector('.crs-step.focus'); if (el) { el.scrollIntoView({ block: 'center' }); el.focus({ preventScroll: true }); } });
}

/* ------------------------------------------------------------- render */

function screen() {
  const k = kid(R.h), n = R.ui.nav;
  if (n === 'privacy') return V.viewPrivacy();
  if (n === 'settings' && !k) return C.viewSettings();
  if (n === 'help') return C.viewHelp();
  if (n === 'grownups') return V.viewGrownups();
  if (n === 'run' && R.run) return V.viewRun();
  if (!k || n === 'welcome') return V.viewWelcome();
  switch (n) {
    case 'atlas': return V.viewAtlas();
    case 'world': return worldOf(R.ui.arg) ? V.viewWorld(R.ui.arg) : V.viewAtlas();
    case 'stop': return stopOpen(R.h, k, R.ui.arg) || X.expAllows(k, R.ui.arg) ? V.viewStop(R.ui.arg) : V.viewWorld(byId[R.ui.arg].world);
    case 'road': return V.viewRoad();
    case 'exp': return X.viewHub(k, V.pageHead);
    case 'expd': return X.viewExpedition(k, R.ui.arg, V, { part: R.ui.part, focus: R.ui.focusDay });
    case 'proj': return X.viewProject(k, R.ui.arg, V);
    case 'library': return libraryView();
    case 'play': return playView();
    case 'lib': case 'game': {
      if (toolById[R.ui.arg]) return toolView(toolById[R.ui.arg]);
      const meta = metaOf(R.ui.arg); if (!meta) return n === 'game' ? playView() : libraryView();
      loadTool(meta.id).then(() => { if (isTool() && R.ui.arg === meta.id) render(); });
      return `<section class="tool-page">${V.pageHead(`${gi(meta.glyph)} ${meta.name}`, '', n === 'game' ? V.back('nav', 'Play', 'play') : V.back('nav', 'Library', 'library'))}<div class="card center-card"><p class="muted">Opening ${V.esc(meta.name)}…</p></div></section>`;
    }
    case 'me': return C.viewMe();
    case 'settings': return C.viewSettings();
    case 'shop': return C.viewShop();
    case 'collection': return C.viewCollection();
    case 'medals': return C.viewMedals();
    case 'help': return C.viewHelp();
    case 'search': return viewSearch(R.ui.q || R.ui.arg || '');
    case 'mistakes': return V.viewMistakes();
    case 'feed': return viewFeed(k);
    default: return V.viewHome();
  }
}
/* the Play tab: the flagship as a big painted card, then every game */
const isTool = () => R.ui.nav === 'lib' || R.ui.nav === 'game';
const playView = () => {
  const k = kid(R.h), best = (id) => { const d = (k.lib || {})[id] || {}; return d.best != null ? `Best: ${typeof d.best === 'number' ? d.best.toLocaleString('en-US') : d.best}` : d.plays ? `${d.plays} played` : 'New'; };
  const [flag, ...rest] = GAMES;
  return `<section class="play-page">${V.pageHead('Play')}
    <button class="card play-hero" data-act="openGame" data-arg="${flag.id}"><span class="play-hero-art" style="background-image:url(art/${flag.art}.webp)"></span>
      <span class="play-hero-t"><span class="kicker">The big game</span><b>${gi(flag.glyph)} ${V.esc(flag.name)}</b><span>${V.esc(flag.blurb)}</span><span class="chip">${best(flag.id)}</span></span></button>
    <div class="play-grid">${rest.map((g) => `<button class="card play-card" data-act="openGame" data-arg="${g.id}"><span class="play-art" style="background-image:url(art/${g.art}.webp)"><span class="play-g" aria-hidden="true">${gi(g.glyph)}</span></span>
      <span class="play-t"><b>${V.esc(g.name)}</b><span>${V.esc(g.blurb)}</span><i class="chip">${best(g.id)}</i></span></button>`).join('')}</div></section>`;
};
/* My Feed (§6a): the index loads with the route, never on the first screen; a card's words load in
   its road's group (data/feed/g-L<n>.js, g-any.js), and only the groups today's session uses */
let FEED = null, feedLoading = false, FEED_BY = {};
const FEED_G = {}, feedGroup = (g) => FEED_G[g] || (FEED_G[g] = import(`./data/feed/g-${g}.js`).then((m) => Object.assign(FEED_BY, m.CARDS)));
function feedItems() {
  if (FEED || feedLoading) return FEED;
  feedLoading = true;
  import('./data/feed/index.js').then((m) => { FEED = m.INDEX; if (R.ui.nav === 'feed') render(); });
  return null;
}
function viewFeed(k) {
  const head = feedHead({ name: 'My Feed' });
  if (!feedOn(R.h)) return `<section class="feed-page">${head}${empty('My Feed is switched off on this device. A grown-up can switch it back on behind the PIN.', btn0('Home', 'home'))}</section>`;
  const items = feedItems(), wait = `<section class="feed-page">${head}<div class="card center-card" role="status"><p class="muted">Opening your feed…</p></div></section>`;
  if (!items) return wait;
  const list = feedSession(R.h, k, items); save();
  const need = [...new Set(list.map((x) => items.find((i) => i.id === x.id).g))];
  if (list.some((x) => !FEED_BY[x.id])) { Promise.all(need.map(feedGroup)).then(() => { if (R.ui.nav === 'feed') render(); }); return wait; }
  const play = R.ui.feedPlay || (R.ui.feedPlay = {});
  return `<section class="feed-page">${head}<div class="bzf-list" data-feed="1">${list.map((x) => feedCard(FEED_BY[x.id], x, play[x.id] || {})).join('')}${feedEnd({ href: '#/continue', label: 'Continue your journey' })}</div></section>`;
}
const btn0 = (label, nav) => `<button class="btn" data-act="nav" data-arg="${nav}">${label}</button>`;
/* a card's question: options in the engine's order; a right answer pays one coin, once; a wrong one
   holds with the right answer named, until Continue */
root.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('[data-bzf]'); if (!b || R.ui.nav !== 'feed') return;
  const id = b.dataset.id, it = FEED_BY[id], k = kid(R.h); if (!it || !it.play || !k) return;
  const play = R.ui.feedPlay || (R.ui.feedPlay = {});
  if (b.dataset.bzf === 'ans') {
    if (play[id] && play[id].st) return;
    const o = +b.dataset.o, f = feedRec(k);
    if (o === 0) { play[id] = { st: 'right', o }; sfx.good(); if (!f.paid[id]) { f.paid[id] = Date.now(); earn('right'); save(); } }
    else { play[id] = { st: 'wrong', o }; sfx.bad(); }
  } else if (b.dataset.bzf === 'cont') play[id] = { st: 'shown', o: (play[id] || {}).o };
  render();
  const card = root.querySelector(`.bzf-card[data-id="${CSS.escape(id)}"]`);
  if (card) (card.querySelector('[data-bzf=cont], .bzf-row a') || card).focus({ preventScroll: true });
});
bindFeedKeys();
const libraryView = () => `<section>${V.pageHead('The Explorer’s Library')}
  <div class="lib-grid">${SHELF.map(V.libTile).join('')}</div></section>`;
on('openGame', (id) => go('game', id));
function toolView(tool) {
  let body;
  try { body = tool.view(libCtx(tool.TOOL.id)); } catch (e) { console.error(e); body = oops('Something went wrong in this tool. It is not your fault — try it again.', `<button class="btn primary" data-act="openTool" data-arg="${tool.TOOL.id}">Try again</button>`); }
  const game = GAME_IDS.has(tool.TOOL.id);
  return `<section class="tool-page tool-${tool.TOOL.id}${game ? ' game-page' : ''}">${V.pageHead(`${gi(tool.TOOL.glyph)} ${tool.TOOL.name}`, '', game ? V.back('nav', 'Play', 'play') : V.back('nav', 'Library', 'library'))}${body}</section>`;
}

let focusId = null, woPic = {}, autoReadAt = '', lastLoopTheme = null;
M.attach(ac); onSound((secs) => M.duck(secs || 0.9));
function render() {
  const a = document.activeElement;
  focusId = a && a.id ? a.id : null;
  const caret = a && a.selectionStart != null ? a.selectionStart : null;
  /* the active child's theme; on the welcome's last step, the world being chosen */
  const th = (!kid(R.h) || R.ui.nav === 'welcome') && R.ui.draft && R.ui.draft.step === 3 ? R.ui.draft.theme : themeOf(kid(R.h));
  applyTheme(th);
  const kk = kid(R.h), html = document.documentElement; html.setAttribute('data-frame', kk ? shopOf(kk).frame : 'plain');
  /* the device's comfort and look settings (standard §5) */
  html.toggleAttribute('data-bz-dark', html.getAttribute('data-mode') === 'dark');
  html.setAttribute('data-text', Store.loadDevice('text', 'm'));
  if (Store.loadDevice('motion', false)) html.setAttribute('data-motion', 'reduced'); else html.removeAttribute('data-motion');
  html.classList.toggle('calm', !!Store.loadDevice('calm', false));
  setCalm(!!Store.loadDevice('calm', false));
  if (kk) setSayRate((kk.prefs || {}).rate || 1);
  /* music: the world's loop, home's, or the games' (a run is a game) */
  const nav = R.ui.nav, loop = nav === 'run' || (isTool() && C.inGame()) ? 'game' : nav === 'home' || nav === 'welcome' ? 'home' : th;
  M.want(loop, { on: !!Store.loadDevice('music', true), calm: !!Store.loadDevice('calm', false), vol: Store.loadDevice('vol', 40), sting: loop === th && lastLoopTheme !== th && lastLoopTheme != null });
  if (loop === th) lastLoopTheme = th;
  if (R.ui.coinToast) { const c = R.ui.coinToast; R.ui.coinToast = 0; setTimeout(() => toast(`+${c} Bizzing ${c === 1 ? 'coin' : 'coins'} for learning`), 0); }
  syncScene(th, R.ui.nav === 'run' || Store.loadDevice('still', false) || Store.loadDevice('motion', false));   // a quiz run gets a still, faded scene
  root.innerHTML = C.shell(screen(), { home: R.ui.nav === 'home' && !!kid(R.h) });
  starsToIcons(root);
  restoreMaps(root);
  root.querySelectorAll('.wo-view').forEach((v) => {   // a new picture starts in the middle; a re-render keeps where the child looked
    const src = (v.querySelector('img:not(.wo-bg)') || {}).src;
    if (v.scrollWidth > v.clientWidth) v.scrollLeft = src === woPic.src ? woPic.x : (v.scrollWidth - v.clientWidth) / 2;
    v.addEventListener('scroll', () => { woPic = { src, x: v.scrollLeft }; }, { passive: true });
    woPic = { src, x: v.scrollLeft };
  });
  root.querySelectorAll('[data-center]').forEach((v) => { if (v.scrollWidth > v.clientWidth && !v.dataset.done) { v.scrollLeft = (v.scrollWidth - v.clientWidth) / 2; v.dataset.done = '1'; } });
  root.querySelectorAll('.seg .on').forEach((b) => { const s = b.parentElement; if (s.scrollWidth > s.clientWidth) s.scrollLeft = b.offsetLeft - (s.clientWidth - b.offsetWidth) / 2; });
  const af = root.querySelector('.mp-card [data-act=medalOk], [data-autofocus] .gmap, [data-autofocus].pop');
  if (af) af.focus({ preventScroll: true });
  else if (focusId) { const el = document.getElementById(focusId); if (el) { el.focus(); if (caret != null && el.setSelectionRange) try { el.setSelectionRange(caret, caret); } catch (_) {} } }
  document.title = 'Bizzing Geography';
  /* a score counts up to itself (F3) */
  root.querySelectorAll('[data-count]').forEach((el) => {
    const to = +el.dataset.count; if (matchMedia('(prefers-reduced-motion: reduce)').matches || !to) return;
    const t0 = performance.now(), fmt = (n) => Math.round(n).toLocaleString('en-US');
    const step = (t) => { const p = Math.min(1, (t - t0) / 700); el.textContent = fmt(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    el.textContent = '0'; requestAnimationFrame(step);
  });
  /* 6–7: each new question reads itself (the child can still tap 🔊 again); older on tap */
  const kr = kid(R.h), rr = R.run;
  if (rr && !rr.over && !rr.fb && kr && V.autoRead(kr) && R.sound && autoReadAt !== rr.items.length + ':' + rr.i + rr.title) { autoReadAt = rr.items.length + ':' + rr.i + rr.title; setTimeout(() => readOut('#q-text, .choice-row'), 250); }
}
R.render = render;
/* ★ is drawn as the family's star icon wherever it sits in a control or heading — some
   systems paint the character as a coloured emoji (§9: no emoji in controls) */
const STAR = '<svg class="ico st" viewBox="0 0 24 24" aria-hidden="true"><path class="d" d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.3-4.1 5.9-.9z"/></svg>';
function starsToIcons(el) {
  for (const host of el.querySelectorAll('button, .chip, h1, h2, h3, [role=tab], nav, .stars')) {
    const w = document.createTreeWalker(host, NodeFilter.SHOW_TEXT), hit = [];
    while (w.nextNode()) if (w.currentNode.nodeValue.includes('★')) hit.push(w.currentNode);
    for (const t of hit) { const sp = document.createElement('span'); sp.className = 'st-txt'; sp.innerHTML = t.nodeValue.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/★/g, STAR); t.replaceWith(sp); }
  }
}

/* ------------------------------------------------------------- the runner */

/* the run's back pill names where it goes (quitRun): never a bare "Stop" */
function backLabel(r) {
  if (r.kind === 'lib') return (toolById[r.lib] && toolById[r.lib].TOOL.name) || 'Library';
  if (r.kind === 'drill') return (byId[r.stop] || {}).title || 'The stop';
  if (r.kind === 'sprint') return (expeditionById[r.exp] || {}).name || 'The expedition';
  if (r.kind === 'mist') return 'My mistakes';
  if (r.kind === 'check') return 'Your journey';
  if (r.kind === 'trial') return 'Back';
  return 'Home';
}
function startRun(kind, title, items, extra = {}) {
  if (!items.length) { toast('Nothing to ask here yet.'); return; }
  /* a mixed set, never all choosing: Library quizzes, the trip and level checks (stops.js vary) */
  if (kind === 'lib' || kind === 'trip' || kind === 'check') items = vary(items, rnd);
  const kk0 = kid(R.h);
  R.run = { kind, title, items, i: 0, results: [], fb: null, over: false, t0: Date.now(), coins: 0, hints: {}, bal0: kk0 ? famBalance(kk0.name) : 0, stars0: extra.stop && kk0 ? ((kk0.stops[extra.stop] || {}).stars || 0) : null, ...extra };
  R.run.back = backLabel(R.run);
  R.ui.mapPick = null;
  go('run');
}
function answer(given) {
  const run = R.run; if (!run || run.fb || run.over) return;
  const q = run.items[run.i], right = correct(q, given), k = kid(R.h);
  const givenName = q.kind !== 'map' ? '' : q.region ? ((regionsOf(q.region).find((s) => s.id === given) || {}).name || '') : byCc[given] ? byCc[given].name : shapeName(given);
  run.fb = { right, given, givenName };
  if (q.kind === 'map' && !q.targetName) q.targetName = byCc[q.target] ? byCc[q.target].name : q.target;
  run.results.push({ right });
  const hinted = !!(run.hints || {})[run.i];
  if (k && run.kind !== 'trial') {
    const src = run.kind === 'drill' ? run.stop : run.kind === 'lib' ? run.lib : run.kind === 'sprint' ? 'exp:' + run.exp : run.kind;
    /* a hint halves the reward: the answer still counts, but a hinted right one pays no coin and no rank */
    tick(k, right, right && !hinted ? xpFor(k, src, run.kind === 'drill' ? { stop: run.stop, lv: run.lv } : {}) : 0);
    if (right && !hinted) run.coins = (run.coins || 0) + earn('right', true);
    /* the mistakes deck (F3): a miss is kept, with its picture, and comes back after a gap */
    if (run.kind === 'mist' && q.missKey) { const r2 = right ? missRight(k, q.missKey) : missWrong(k, q.missKey); run.fb.deck = r2; }
    else if (!right) missAdd(k, q, q.from || (run.kind === 'drill' && byId[run.stop] ? byId[run.stop].title : run.title));
    /* the first right answer this explorer ever gives is a moment (A8) — not the sign-up */
    if (right && !k.firstRight) { k.firstRight = Date.now(); R.ui.firstPop = q.kind === 'map' ? `You found ${q.targetName || 'it'} on the map. Every place you find stays found.` : `“${q.ans}” — right first time. That is how explorers start.`; confetti(60); setTimeout(() => sfx.level(), 350); }
  }
  if (run.kind === 'lib' && toolById[run.lib] && toolById[run.lib].answered) toolById[run.lib].answered(q, right, libCtx(run.lib));
  save();
  right ? sfx.good() : sfx.bad();
  render();
  /* the family rule: a right answer moves on by itself; a wrong one waits */
  if (right) setTimeout(() => { if (R.run === run && run.fb) nextQ(); }, q.why ? 1500 : 900);
}
function nextQ() {
  const run = R.run; if (!run) return;
  run.fb = null; run.i++; run.typed = ''; run.order = [];
  if (run.i >= run.items.length) finish(run);
  render();
}
function finish(run) {
  run.over = true;
  const k = kid(R.h), right = run.results.filter((r) => r.right).length, n = run.results.length;
  if (run.kind === 'trial') { R.trial = { right, n }; run.summary = { lines: [right ? 'That is how it works: read, think, answer. Make your explorer and the journey starts here.' : 'Not this time — that is how you learn. Make your explorer and the journey starts here.'], buttons: [] }; return; }
  if (n) session(k);   // one notch on Today’s ring
  if (run.kind === 'drill') {
    const res = scoreRun(k, run.stop, run.lv, right, n);
    const rd = road(k);
    const best = Math.round((100 * right) / n) >= (stopRec(k, run.stop).best || 0) && res.passed;
    run.summary = { stars: res.stars, lines: [res.passed ? `You ${res.firstPass ? 'passed' : 'walked'} <b>${V.esc(byId[run.stop].title)}</b> with ${right} of ${n}${best && stopRec(k, run.stop).runs > 1 ? ' — your best yet' : ''}${res.gained ? ` · ${'★'.repeat(res.stars)}` : ''}.` : `${right} of ${n} on ${V.esc(byId[run.stop].title)}. Seven right passes it — read the lesson again, then have another go.`] };
    if (res.passed && rd.next) run.summary.buttons = [V.btn(`Next stop: ${byId[rd.next.stop].title} →`, 'openStop', rd.next.stop, 'big')];
    if (res.passed && rd.all) run.summary.lines.push(`Every stop on Level ${rd.L.n} is done. Take the level check to open the next level.`);
    if (res.slipped) run.summary.lines.push(`This stop had not been practised for a few weeks and slipped: ${'★'.repeat(res.stars)} now. One more pass brings it back.`);
    if (res.reviewed) run.summary.lines.push('Reviewed after a few weeks — still yours.');
    if (res.gained) { sfx.level(); confetti(30); }
    k.last = { k: res.passed ? 'stop' : 'try', title: byId[run.stop].title, at: Date.now(), right, n };
    if (res.passed && res.firstPass) { bonus(k, 'stop'); earn('stop'); }
    if (res.passed && res.gained) trackMilestone(APP, k.name, 'stop', `Passed ${byId[run.stop].title}`);
  } else if (run.kind === 'check') {
    const pass = right / n >= CHECK_PASS;
    earn('contest');
    if (pass) { bonus(k, 'level'); earn('mastered'); const L = passLevel(k); k.last = { k: 'check', title: `Level ${L}`, at: Date.now() }; trackMilestone(APP, k.name, 'band', `Reached Level ${L}: ${levelOf(L).name}`); run.summary = { stars: 3, lines: [`Level check passed. Welcome to Level ${L}: ${levelOf(L).name}.`] }; sfx.level(); confetti(60); }
    else run.summary = { stars: right / n >= 0.6 ? 1 : 0, lines: [`Ten right opens the next level. Walk a few more stops on your road, then try again.`] };
  } else if (run.kind === 'sprint') {
    run.summary = X.finishDay(k, run, right, n);
    earn('stop'); if (run.summary.big) { bonus(k, 'part'); earn('mastered'); }
    k.last = { k: 'exp', title: (expeditionById[run.exp] || {}).name || run.title, at: Date.now() };
    if (run.summary.big) { sfx.level(); confetti(40); }
  } else if (run.kind === 'trip') {
    earn('stop');
    k.trips = k.trips || {}; k.trips[dayKey()] = { n, right };
    const ks = Object.keys(k.trips).sort(); while (ks.length > 30) delete k.trips[ks.shift()];
    run.summary = { lines: [`You practised ${[...new Set(run.items.map((q) => q.from).filter(Boolean))].join(', ')}.`, 'That is today’s trip done. Nothing more is needed — and another is always here.'] };
    if (right >= n - 1) { sfx.level(); confetti(25); }
  } else if (run.kind === 'warm') {
    const st = road(k).next;
    run.summary = { lines: [right ? 'You know where that is. Now your journey starts — the first stop is ready.' : 'That is how the map works: tap, and it tells you. Now your journey starts.'], buttons: st ? [V.btn(`First stop: ${V.esc(byId[st.stop].title)} ${'→'}`, 'warmNext', st.stop, 'big')] : [] };
  } else if (run.kind === 'mist') {
    const left = missDue(k).length;
    k.last = { k: 'mist', title: 'My mistakes', at: Date.now(), right, n };
    run.summary = { lines: [`${right} of ${n} came back right after the gap${right === n ? ' — every one' : ''}.`, left ? `${left} more ${left === 1 ? 'is' : 'are'} ready.` : 'The rest come back after their gap.'] };
    if (right) earn('stop');
  } else if (run.kind === 'lib') {
    const t = toolById[run.lib];
    run.summary = t && t.done ? t.done(run, libCtx(run.lib)) : null;
  }
  /* F4: the finish names what was practised, how long it took, what it earned and what is next */
  run.summary = run.summary || {};
  run.summary.secs = Math.round((Date.now() - run.t0) / 1000);
  run.summary.coins = Math.max(0, famBalance(k.name) - run.bal0);
  run.summary.practised = [...new Set(run.items.map((q) => q.from || (q.stop && byId[q.stop] && byId[q.stop].title)).filter(Boolean))].slice(0, 4);
  if (run.stars0 != null && run.summary.stars != null) run.summary.starsUp = Math.max(0, (run.summary.stars || 0) - run.stars0);
  if (!run.summary.next) { const nx = nextStep(k); run.summary.next = { act: nx.act, arg: nx.arg, title: nx.html ? String(nx.title).replace(/<[^>]+>/g, '') : nx.title }; }
  if (right / Math.max(1, n) >= 0.7) sfx.finish();
  save();
}

/* ------------------------------------------------------------- actions */

on('nav', (a) => go(a || 'home'));
on('openWorld', (w) => { R.ui.pick = null; go('world', w); });
on('pickStop', (id) => { R.ui.pick = id; render(); });
on('openStop', (id) => { if (!stopOpen(R.h, kid(R.h), id) && !X.expAllows(kid(R.h), id)) { toast('That stop opens on a later level.'); return; } go('stop', id); });
on('openTool', (id) => go('lib', id));
/* the place of the hour: Where on Earth? opens on THAT postcard, not on its menu */
on('openPlace', (id) => { loadTool('geoguess').then((t) => { t.act('place', id, libCtx('geoguess')); go('lib', 'geoguess'); }); });
on('openLandmark', (id) => { loadTool('landmarks').then((t) => { t.act('sel', id, libCtx('landmarks')); go('lib', 'landmarks'); }); });
/* expeditions: the engine decides what a day is; the host only goes, runs or toasts */
on('expOpen', (id) => { R.ui.part = null; go('expd', id); });
on('expPart', (j) => { R.ui.part = +j; render(); });
/* a project's builder: every control is data-act="proj", arg "name|value" */
on('proj', (a) => { const i = String(a).indexOf('|'), msg = X.projAct(kid(R.h), R.ui.arg, a.slice(0, i), a.slice(i + 1)); save(); if (msg) toast(msg); render(); });
on('projDone', () => {
  const k = kid(R.h), msg = X.projAct(k, R.ui.arg, 'done');
  if (msg !== 'made') { toast(msg); return; }
  k.last = { k: 'made', title: (X.projOf(...String(R.ui.arg).split('|')) || { d: {} }).d.name || 'your project', at: Date.now() };
  bonus(k, 'made'); earn('stop');
  session(k); save(); sfx.level(); confetti(50); toast('Made! It is in your expedition gallery.');
  go('expd', String(R.ui.arg).split('|')[0]);
});
on('expDay', (arg) => {
  const [eid, n] = String(arg).split('|'), k = kid(R.h), r = X.doDay(k, eid, n);
  if (!r) return;
  save();
  if (r.run) return startRun('sprint', r.run.title, r.run.items, r.run.extra);
  if (r.go || /^Made/.test(r.toast || '')) { session(k); save(); }
  if (r.toast) toast(r.toast);
  if (r.go) go(r.go[0], r.go[1]); else render();
});
on('learned', (id) => { const r = stopRec(kid(R.h), id); if (!r.learned) { r.learned = true; r.stars = Math.max(r.stars, 1); save(); sfx.coin(); } render(); });
function startDrill(id, extra = {}) { const s = byId[id], k = kid(R.h), lv = lvFor(k, id); startRun('drill', s.title, drill(s, lv, 10), { stop: id, lv, sub: `${gi(s.glyph)} ${['', 'First look', 'Deeper', 'Stretch'][lv]}`, ...extra }); }
on('startDrill', (id) => startDrill(id));
/* try one question before making an explorer (A5): nothing is saved until sign-up */
on('trial', () => startRun('trial', 'Try one question', drill(byId['find-continent'], 1, 1), { sub: 'No explorer needed yet' }));
/* the timed round of Where on Earth? (E2): a clock per card, ticking on screen only */
setInterval(() => {
  const g = isTool() && R.ui.arg === 'geoguess' && ((R.ui.lib || {}).geoguess || {}).g;
  if (!g || !g.timed || g.i >= g.cards.length || g.done[g.i]) return;
  const left = Math.max(0, Math.ceil((g.deadline - Date.now()) / 1000)), el = root.querySelector('.wo-clock');
  if (el) { el.textContent = `${left}s`; el.classList.toggle('low', left <= 10); }
  if (left <= 0) { fire('lib', 'geoguess|timeout'); buzz(30); }
}, 500);
/* the 5-minute trip (E1): three from what you have passed, one new, one on the map — then it ends */
on('trip', () => {
  const k = kid(R.h), passed = shuffle(Object.keys(k.stops).filter((id) => byId[id] && k.stops[id].stars >= 2), rnd), rd = road(k), items = [], S = newSeen();   // one memory: the trip never repeats itself
  const tag = (qs, id) => qs.map((q) => ({ ...q, from: byId[id].title }));
  for (const id of passed.slice(0, 3)) items.push(...tag(drill(byId[id], lvFor(k, id), 1, rnd, S), id));
  const nx = rd.next ? rd.next.stop : rd.steps[0].stop;
  items.push(...tag(drill(byId[nx], lvFor(k, nx), 1, rnd, S), nx));
  const mapStop = shuffle([...passed, nx], rnd).find((id) => drill(byId[id], lvFor(k, id), 6).some((q) => q.kind === 'map'));
  if (mapStop) { const q = drill(byId[mapStop], lvFor(k, mapStop), 12, rnd, newSeen()).find((x) => x.kind === 'map' && S.fits(x)); if (q) { remember(S, q); items.push({ ...q, from: byId[mapStop].title }); } }
  for (let t = 0; items.length < 5 && t < 20; t++) items.push(...tag(drill(byId[nx], lvFor(k, nx), 1, rnd, S), nx));
  startRun('trip', '5-minute trip', items.slice(0, 5), { sub: 'Review · one new · one map' });
});
/* the shop: printed prices, from the family wallet; a look, never content */
on('buy', (id) => {
  const k = kid(R.h), it = SHOP.find((x) => x.id === id), sh = shopOf(k); if (!it || sh.owned.includes(id)) return;
  if (R.demo) { toast('The sample cannot buy — make your own explorer.'); return; }
  if (!spend(APP, k.name, it.price, id)) { toast(`${it.price} coins needed — earn them by learning.`); return; }
  sh.owned.push(id); sh[it.kind] = id.split(':')[1]; sfx.coin(); toast(`${it.name} is yours — and in use.`); save(); render();
});
on('use', (id) => { const k = kid(R.h), it = SHOP.find((x) => x.id === id), sh = shopOf(k); if (!it || !sh.owned.includes(id)) return; sh[it.kind] = id.split(':')[1]; save(); render(); });
on('medalOk', () => { R.ui.medalPop = (R.ui.medalPop || []).slice(1); render(); });
on('firstOk', () => { R.ui.firstPop = null; render(); });

/* ---- the family chrome (standard §1, §3, §5, §8) */
function focusIn(sel) { const f = root.querySelector(sel); if (f) f.focus(); }
on('drawer', () => { R.ui.drawer = !R.ui.drawer; R.ui.menu = false; render(); if (R.ui.drawer) focusIn('.drawer .dr-x'); else focusIn('.burger'); });
on('wallet', () => { R.ui.sheet = R.ui.sheet === 'wallet' ? null : 'wallet'; R.ui.drawer = false; render(); if (R.ui.sheet) focusIn('#wallet-sheet .tool'); else focusIn('.coin-chip'); });
on('back', () => history.back());
on('shopTab', (t) => { R.ui.shopTab = t; render(); focusIn('.shop-tabs .on'); });
on('buyAv', (id) => {
  const k = kid(R.h), a = byAvatar[id]; if (!k || !a) return;
  if (R.demo) { toast('The sample cannot buy — make your own explorer.'); return; }
  const ctx = C.ctxOf(k);
  if (!buyAvatar(APP, k.name, a, ctx)) { toast(`Not yet: ${avState(id, ctx).say}.`); return; }
  k.owned = [...new Set([...(k.owned || []), id])]; k.avatar = id; sfx.unlock(); confetti(30); save(); render(); toast(`${a.name} is yours — and you are wearing it.`);
});
on('buyWorld', (n) => {
  const k = kid(R.h); n = +n; if (!k) return;
  if (R.demo) { toast('The sample cannot buy — make your own explorer.'); return; }
  if (!buyWorldFam(APP, k.name, n, C.ctxOf(k))) { toast('240 Bizzing coins open a world — earn them by learning.'); return; }
  k.worlds = [...new Set([...(k.worlds || []), n])]; sfx.unlock(); confetti(40); save(); render(); toast('A new world is open — and two more packs of faces with it.');
});
on('music', () => { Store.saveDevice('music', !Store.loadDevice('music', true)); render(); });
on('readAuto', () => { const k = kid(R.h); k.prefs.readAuto = !V.autoRead(k); save(); render(); });
on('rate', (r) => { const k = kid(R.h); k.prefs.rate = r === 'slow' ? 0.85 : 1; setSayRate(k.prefs.rate); save(); render(); });
on('setMode', (m) => {
  if (m === 'auto') { Store.saveDevice('mode', null); document.documentElement.setAttribute('data-mode', sysDark.matches ? 'dark' : 'light'); }
  else { Store.saveDevice('mode', m); document.documentElement.setAttribute('data-mode', m); }
  syncThemeColor(); render();
});
on('setText', (t) => { if (['s', 'm', 'l'].includes(t)) { Store.saveDevice('text', t); render(); } });
on('motion', () => { Store.saveDevice('motion', !Store.loadDevice('motion', false)); render(); });
on('calm', () => { Store.saveDevice('calm', !Store.loadDevice('calm', false)); render(); });
on('plan', () => { if (!R.ui.gate) return; R.h.parent.plan = R.h.parent.plan === 'family' ? 'free' : 'family'; save(); render(); });
on('openState', (a) => { const [c, id] = a.split('|'); loadTool('states').then((t) => { const x = libCtx('states'); t.act('c', c, x); t.act('sel', id, x); go('lib', 'states'); }); });
on('openCity', (id) => { const p = placeOf(id); if (!p) return; loadTool('explorer').then((t) => { t.act('place', JSON.stringify({ cc: p.cc, n: p.n, at: p.at }), libCtx('explorer')); go('lib', 'explorer'); }); });
if (typeof window !== 'undefined') window.addEventListener('bzg-search-ready', () => { if (R.ui.nav === 'search') render(); });
on('openCountry', (cc) => { loadTool('explorer').then((t) => { if (t) t.act('sel', cc, libCtx('explorer')); go('lib', 'explorer'); }); });
on('practiseMisses', () => {
  const k = kid(R.h), due = missDue(k).sort((a, b) => a.at - b.at).slice(0, 10);
  if (!due.length) { toast('Nothing is ready yet — each card waits for a gap.'); return; }
  startRun('mist', 'My mistakes', due.map((m) => ({ ...m.q, missKey: m.key, from: m.from })), { sub: 'Cards that came back after a gap' });
});
/* read it to me: the text of whatever the button points at, in the device's voice */
function readOut(sel) {
  const els = [...root.querySelectorAll(sel)]; if (!els.length) return;
  const plain = (e) => { const c = e.cloneNode(true); c.querySelectorAll('.read-btn, kbd, .chip').forEach((x) => x.remove()); return c.textContent.replace(/\s+/g, ' ').trim(); };
  const text = els.map((e) => e.classList.contains('choice-row') ? 'Is it ' + [...e.querySelectorAll('.opt span')].map((x) => x.textContent).join(', or ') + '?' : plain(e)).filter(Boolean).join('. ');
  els.forEach((e) => e.classList.add('reading'));
  say(text, () => els.forEach((e) => e.classList.remove('reading')));
}
on('read', (sel) => readOut(sel));
on('readAuto', () => { const k = kid(R.h); k.prefs.readAuto = !V.autoRead(k); save(); render(); });
on('listMode', () => { Store.saveDevice('listMode', !Store.loadDevice('listMode', false)); render(); const f = root.querySelector('.map-list .opt'); if (f) f.focus(); });
on('openWord', (w) => { libCtx('dictionary').ui.q = w; go('lib', 'dictionary'); });
on('menu', () => { R.ui.menu = !R.ui.menu; render(); if (R.ui.menu) { const f = root.querySelector('.who-menu button'); if (f) f.focus(); } });
on('levelCheck', () => {
  const k = kid(R.h), L = levelOf(k.road.level), items = [], S = newSeen();   // one memory: the check never repeats itself
  for (const s of shuffle(L.steps, rnd)) items.push(...drill(byId[s.stop], s.lv, 1, rnd, S));
  for (let t = 0; items.length < 12 && t < 60; t++) { const s = L.steps[t % L.steps.length]; items.push(...drill(byId[s.stop], s.lv, 1, rnd, S)); }
  startRun('check', `Level ${L.n} check`, shuffle(items, rnd).slice(0, 12), { sub: L.name });
});
on('lvShow', (n) => { R.ui.lvShow = +n; render(); });
on('choose', (a) => answer(a));
/* E6: one hint per question, recorded on the run so the reward rule can see it */
on('hint', () => { const run = R.run; if (!run || run.fb || run.over) return; const q = run.items[run.i]; run.hints = run.hints || {}; run.hints[run.i] = hintFor(q, byId[q.stop || run.stop]); if (run.hints[run.i].kind === 'first' && !(run.order || []).length) run.order = [run.hints[run.i].first]; sfx.click(); render(); });
/* E4: a typed answer, and a put-in-order answer */
on('typeGo', () => { const run = R.run; if (!run || run.fb) return; const v = (root.querySelector('#type-in') || {}).value || run.typed || ''; if (!v.trim()) return; run.typed = ''; answer(v.trim()); });
on('orderPick', (x) => { const run = R.run; if (!run || run.fb) return; const q = run.items[run.i]; run.order = [...(run.order || []), x].filter((v, i, a) => a.indexOf(v) === i); sfx.click(); if (run.order.length === q.items.length) { const g = run.order.join('|'); run.order = []; answer(g); } else render(); });
on('orderUndo', () => { const run = R.run; if (!run || run.fb) return; run.order = (run.order || []).slice(0, -1); render(); });
on('nextQ', () => nextQ());
on('quitRun', () => { const r = R.run; R.run = null; if (r && r.kind === 'mist') return go('mistakes'); if (r && r.kind === 'trial') return go('welcome'); if (r && r.kind === 'sprint') return go('expd', r.exp); if (r && r.kind === 'lib') return go('lib', r.lib); if (r && r.kind === 'drill') return go('stop', r.stop); go(r && r.kind === 'check' ? 'road' : 'home'); });
on('warmNext', (id) => { R.run = null; startDrill(id, { intro: true }); });
on('endRun', () => { const r = R.run; R.run = null; if (r && r.kind === 'warm') { const st = road(kid(R.h)).next; return st ? startDrill(st.stop, { intro: true }) : go('home'); } if (r && r.kind === 'mist') return go('mistakes'); if (r && r.kind === 'trial') { R.ui.draft = { step: 0, name: '', band: '', avatar: V.STARTER_AVATARS[0], theme: 'atlas' }; return go('welcome'); } if (r && r.kind === 'sprint') return go('expd', r.exp); if (r && r.kind === 'lib') return go('lib', r.lib); if (r && r.kind === 'drill') return go('stop', r.stop); go(r && r.kind === 'check' ? 'road' : 'home'); });
on('mapZoom', (a) => { const [key, how] = a.split('|'); zoomMap(root, key, how); });
on('lib', (a) => {
  const [id, name, ...rest] = a.split('|'), tool = toolById[id];
  if (!tool) return;
  tool.act(name, rest.join('|'), libCtx(id)); render();
});

/* a map tap: an answer in a run, or a tool's own */
function mapTap(t) {
  if (R.run && !R.run.fb && !R.run.over) {
    const q = R.run.items[R.run.i];
    if (q.kind === 'map' && t.cc) answer(t.cc);
    return;
  }
  if (R.ui.nav === 'proj') { fire('proj', 'tap|' + JSON.stringify(t)); return; }
  if (isTool() && toolById[R.ui.arg]) { toolById[R.ui.arg].act('tap', JSON.stringify(t), libCtx(R.ui.arg)); buzz(12); render(); }
}
/* a small, gentle buzz where the device has one (never on a wrong answer) */
const buzz = (ms) => { try { if (R.sound && navigator.vibrate) navigator.vibrate(ms); } catch (_) {} };
bindMaps(root, mapTap);

/* Earth Through Time: a swipe across the painting steps through time */
{
  let sw = null;
  root.addEventListener('pointerdown', (e) => {
    const st = e.target.closest && e.target.closest('[data-swipe]');
    sw = st && e.pointerType !== 'mouse' && !e.target.closest('button, a, summary, details') ? { x: e.clientX, y: e.clientY, id: e.pointerId, k: st.dataset.swipe } : null;
  });
  root.addEventListener('pointerup', (e) => {
    if (!sw || e.pointerId !== sw.id) return;
    const dx = e.clientX - sw.x, dy = e.clientY - sw.y, k = sw.k; sw = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) fire('lib', `${k}|step|${dx < 0 ? 1 : -1}`);
  });
  root.addEventListener('pointercancel', () => { sw = null; });
}

/* Where on Earth: drag the photo to look around (it slides with the finger,
   then turns by as much as it was dragged, in 15° steps) */
{
  let d = null;
  root.addEventListener('pointerdown', (e) => {
    const v = e.target.closest && e.target.closest('[data-wo-drag]'); if (!v || v.scrollWidth > v.clientWidth + 4) return;   // a phone scrolls it natively
    d = { x: e.clientX, v, w: v.getBoundingClientRect().width, id: e.pointerId };
    try { v.setPointerCapture(e.pointerId); } catch (_) {}
  });
  root.addEventListener('pointermove', (e) => { if (d && e.pointerId === d.id) d.v.style.transform = `translateX(${e.clientX - d.x}px)`; });
  const up = (e) => {
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x, turn = Math.round((-dx / d.w) * 180 / 15) * 15; d.v.style.transform = ''; d = null;
    if (turn) fire('lib', 'geoguess|turn|' + turn);
  };
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
}

/* welcome */
on('obStart', () => { R.ui.draft.step = 0; render(); });
on('obNext', () => { const d = R.ui.draft; if (d.step === 0 && !d.name.trim()) return; d.step++; sfx.click && sfx.click(); render(); scrollTo(0, 0); });
on('obBack', () => { const d = R.ui.draft; d.step = Math.max(0, d.step - 1); render(); });
on('draftBand', (b) => { R.ui.draft.band = b; R.ui.draft.step = 2; render(); scrollTo(0, 0); });
on('draftAv', (a) => { R.ui.draft.avatar = a; render(); });
on('draftTheme', (t) => { if (isTheme(t)) { R.ui.draft.theme = t; applyTheme(t); syncScene(t, false); render(); } });
on('createKid', () => {
  const d = R.ui.draft; if (!d || !d.name.trim() || !d.band) return;
  const k = newKid(d.name, d.band, d.avatar);
  if (d.theme) k.prefs.theme = d.theme;
  R.h.kids.push(k); R.h.active = k.id; R.ui.draft = null;
  if (R.trial) { tick(k, R.trial.right > 0, 1); R.trial = null; }   // the question tried first counts
  save(); sfx.click();
  /* A8: the welcome ends IN an easy, confident first question — find a continent on the
     whole map — whose right answer is celebrated; then straight on to the first stop */
  const warm = drill(byId['find-continent'], 1, 6).filter((q) => q.kind === 'map').slice(0, 1);
  if (warm.length) return startRun('warm', 'Your first question', warm, { sub: 'An easy one to start' });
  const st = road(k).next; if (st) return startDrill(st.stop, { intro: true });
  go('home');
});
on('switchKid', (id) => { if (!R.h.kids.some((x) => x.id === id)) return; R.h.active = id; R.ui.lib = {}; R.ui.menu = false; save(); go('home'); });
on('setAv', (a) => { const k = kid(R.h); if (canWear(a, C.ctxOf(k))) { k.avatar = a; sfx.click(); save(); render(); } else toast('That face is not yours yet — its card says how.'); });
on('hourAns', (cc) => {
  const k = kid(R.h); if (!k) return;
  const hk = V.hourKey(), q = V.hourQuestion(V.todaysCard()); k.lib.hourq = k.lib.hourq || {};
  if (k.lib.hourq[hk]) return;
  const right = cc === q.c.cc; k.lib.hourq[hk] = { cc, right };
  for (const key of Object.keys(k.lib.hourq)) if (!key.startsWith(dayKey())) delete k.lib.hourq[key];   // today only
  if (right) { sfx.good(); earn('right'); confetti(14); } else sfx.bad();
  save(); render();
});
on('goal', (n) => { const k = kid(R.h); if (GOALS.includes(+n)) { k.prefs.goal = +n; save(); render(); } });
on('still', () => { Store.saveDevice('still', !Store.loadDevice('still', false)); render(); });
/* themes belong to the child: chosen on their page, applied at once */
on('theme', (id) => {
  const k = kid(R.h); if (!k || !isTheme(id)) return;
  if (!worldOpen(worldNo(id), C.ctxOf(k))) { toast('That world opens with the family plan, or for 240 Bizzing coins in the Shop.'); return; }
  k.prefs = k.prefs || {}; k.prefs.theme = id; save(); render();
  const el = document.getElementById('theme-' + id); if (el) el.focus();
});
on('themes', () => {
  go('settings');
  const on1 = document.querySelector('.world-thumb[aria-checked="true"]'); if (on1) { on1.scrollIntoView({ block: 'center' }); on1.focus({ preventScroll: true }); }
});

/* chrome */
on('sound', () => { R.sound = !R.sound; setSound(R.sound); Store.saveDevice('sound', R.sound); render(); });
/* the menu closes on a tap outside it, or Escape */
root.addEventListener('click', (e) => { if (R.ui.menu && !e.target.closest('.who-menu, .who, [data-bz=kid]')) { R.ui.menu = false; render(); } }, true);
on('mode', () => {
  const m = document.documentElement.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-mode', m); Store.saveDevice('mode', m); syncThemeColor(); render();
});

/* grown-ups */
on('gate', () => {
  const pin = (R.ui.gateIn || '').replace(/\D/g, '');
  if (pin.length !== 4) { toast('Four digits, please.'); return; }
  if (!R.h.parent.pinHash) { R.h.parent.pinHash = pinHash(pin); save(); R.ui.gate = true; }
  else if (pinHash(pin) === R.h.parent.pinHash) R.ui.gate = true;
  else { toast('That PIN is not right.'); R.ui.gateIn = ''; }
  render();
});
on('cert', (a) => { if (!R.ui.gate) return; const [kid1, cid] = String(a).split('|'), k = R.h.kids.find((x) => x.id === kid1); const c = k && certificatesOf(k).find((x) => x.id === cid); if (c) shareCertificate(k, c).then((how) => toast(how === 'shared' ? 'Shared.' : 'Saved as a picture.')); });
on('feedToggle', () => { if (!R.ui.gate) return; R.h.parent.feedOff = !R.h.parent.feedOff; save(); render(); });
on('tester', () => { R.h.parent.tester = !R.h.parent.tester; save(); render(); });
on('streetview', () => { if (!GKEY) return; R.h.parent.streetview = !R.h.parent.streetview; R.ui.lib = {}; save(); render(); });
on('testerOff', () => { R.h.parent.tester = false; save(); render(); });
on('backup', () => {
  const b = new Blob([Store.exportBlob(R.h)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'bizzing-geography-backup.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
});
on('restore', () => {
  const i = document.createElement('input'); i.type = 'file'; i.accept = 'application/json,.json';
  i.onchange = () => { const f = i.files[0]; if (!f) return; f.text().then((t) => { try { R.h = Store.importBlob(t); Store.saveNow(R.h); toast('Restored.'); go('home'); } catch (e) { toast(e.message); } }); };
  i.click();
});
on('wipe', () => { R.ui.confirm = 'wipe'; render(); });
/* per child, behind the PIN: the ring goal, reading aloud, and deleting one child (with a confirm) */
on('kidGoal', (a) => { const [id, n] = String(a).split('|'), k = R.h.kids.find((x) => x.id === id); if (k && GOALS.includes(+n)) { k.prefs.goal = +n; save(); render(); } });
on('kidRead', (id) => { const k = R.h.kids.find((x) => x.id === id); if (k) { k.prefs.readAuto = !V.autoRead(k); save(); render(); } });
on('delKid', (id) => { R.ui.confirm = 'del:' + id; render(); });
on('delKidYes', (id) => {
  if (!R.ui.gate) return;
  R.h.kids = R.h.kids.filter((x) => x.id !== id);
  if (R.h.active === id) R.h.active = R.h.kids[0] ? R.h.kids[0].id : null;
  R.ui.confirm = null; R.ui.lib = {}; save(); toast('Deleted.'); render();
});
on('wipeYes', () => { Store.wipe(); R.h = newHousehold(); R.ui = { nav: 'welcome', arg: null }; go('welcome'); });

/* ------------------------------------------------------------- inputs & keys */

bindRoot(root);
/* the family shell's own buttons, wired once by delegation (bizzing-shell.js) */
bindShell({
  onTheme: () => { if (holdFired) { holdFired = false; return; } fire('mode'); render(); },
  onLock: () => go('grownups'),
  onKid: () => fire('menu'),
  onCoins: () => fire('wallet'),
  onSearch: (q) => { R.ui.q = q; go('search'); },
  onSound: () => fire('sound'),
});
/* long-press the theme button: the worlds (Settings → Look), as Bee does */
let holdT = null, holdFired = false;
addEventListener('pointerdown', (e) => { if (!e.target.closest('[data-bz=theme]')) return; holdT = setTimeout(() => { holdFired = true; fire('themes'); }, 600); }, true);
addEventListener('pointerup', () => clearTimeout(holdT), true);
/* a Street View photo with no imagery answers 404: swap in another place, uncounted */
root.addEventListener('error', (e) => {
  const t = e.target;
  if (t && t.tagName === 'IMG' && t.dataset.sv && !t.dataset.gone) { t.dataset.gone = '1'; fire('lib', 'geoguess|skip|' + t.dataset.sv); }
}, true);
let inT = null;
root.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset.projInput) { X.projAct(kid(R.h), R.ui.arg, t.dataset.projInput, t.value); save(); render(); return; }
  if (t.dataset.draft) {
    if (t.dataset.draft === 'pin') { R.ui.gateIn = t.value.replace(/\D/g, '').slice(0, 4); return; }
    R.ui.draft[t.dataset.draft] = t.value;
    const b = root.querySelector('[data-act=obNext]'); if (b && t.dataset.draft === 'name') b.disabled = !R.ui.draft.name.trim();
    return;
  }
  if (t.dataset.typed != null && R.run) { R.run.typed = t.value; return; }
  if (t.dataset.set === 'name') { const k = kid(R.h), v = t.value.trim().slice(0, 20); if (k && v) { k.name = v; save(); } return; }
  if (t.dataset.set === 'vol') { Store.saveDevice('vol', +t.value); M.setVolume(+t.value); const l = t.closest('.set-r').querySelector('i'); if (l) l.textContent = t.value + '%'; return; }
  if (t.dataset.search != null) { R.ui.q = t.value; clearTimeout(inT); inT = setTimeout(() => { render(); }, 120); return; }
  if (t.dataset.libQuiet) { libCtx(R.ui.arg).ui[t.dataset.libQuiet] = t.value; return; }   // kept, never re-rendered while typing
  if (t.dataset.libInput) { const ctx = libCtx(R.ui.arg); ctx.ui[t.dataset.libInput] = t.value; clearTimeout(inT); inT = setTimeout(render, 90); }
  if (t.dataset.libRange) { const tool = toolById[t.dataset.libRange]; tool.act('range', t.value, libCtx(t.dataset.libRange)); render(); }
});
root.addEventListener('change', (e) => { if (e.target.dataset.act === 'tester') { /* handled by click */ } });

addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if ((R.ui.medalPop || []).length && (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ')) { e.preventDefault(); fire('medalOk'); return; }
  if ((R.ui.drawer || R.ui.sheet) && e.key === 'Escape') { e.preventDefault(); if (R.ui.drawer) fire('drawer'); else fire('wallet'); return; }
  if ((R.ui.drawer || R.ui.sheet) && e.key === 'Tab') {   // focus stays inside the open drawer or sheet
    const box = root.querySelector(R.ui.drawer ? '.drawer' : '.sheet'), f = box ? [...box.querySelectorAll('button, a, input')] : [];
    if (f.length) { const i = f.indexOf(document.activeElement); if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); } else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); f[0].focus(); } }
    return;
  }
  if (R.ui.menu && e.key === 'Escape') { R.ui.menu = false; render(); const w = root.querySelector('.who'); if (w) w.focus(); return; }
  const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
  if (R.ui.nav === 'grownups' && e.key === 'Enter' && e.target.id === 'pin') { fire('gate'); return; }
  if (e.key === 'Enter' && e.target.id === 'kname') { fire('obNext'); return; }
  if (e.target && e.target.dataset && e.target.dataset.projKeys && /^(Arrow(Up|Down|Left|Right)|Enter| |[1-9]|f|F)$/.test(e.key)) { e.preventDefault(); fire('proj', 'key|' + e.key); return; }
  if (R.run && !R.run.over) {
    const q = R.run.items[R.run.i];
    if (R.run.fb) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextQ(); } return; }
    if (q.kind === 'type' && e.key === 'Enter' && e.target.id === 'type-in') { e.preventDefault(); fire('typeGo'); return; }
    if (q.kind === 'order' && !typing) {
      const n = parseInt(e.key, 10); if (n >= 1 && n <= q.items.length && !(R.run.order || []).includes(q.items[n - 1])) { e.preventDefault(); fire('orderPick', q.items[n - 1]); }
      if (e.key === 'Backspace') { e.preventDefault(); fire('orderUndo'); }
    }
    if (q.kind === 'mc' && !typing) {
      const n = parseInt(e.key, 10);
      const hh = (R.run.hints || {})[R.run.i];
      if (n >= 1 && n <= q.opts.length && !(hh && hh.opt === q.opts[n - 1])) { e.preventDefault(); answer(q.opts[n - 1]); }
    }
    if (q.kind === 'map' && !typing) {          // list mode: 1–6 choose, as for any list
      const n = parseInt(e.key, 10), b = root.querySelectorAll('.map-list .opt')[n - 1];
      if (b) { e.preventDefault(); answer(b.dataset.arg); }
    }
    return;
  }
  if (R.run && R.run.over && e.key === 'Enter' && !typing) { e.preventDefault(); fire('endRun'); return; }
  if (isTool() && toolById[R.ui.arg] && toolById[R.ui.arg].key) {
    if ((!typing || e.key === 'Enter' || e.key === 'Escape') && toolById[R.ui.arg].key(e, libCtx(R.ui.arg))) { e.preventDefault(); render(); }
  }
});
/* avatar grid: arrow keys move through the faces */
/* the theme picker is a radio group: arrows move the choice and apply it */
root.addEventListener('keydown', (e) => {
  const t = e.target;
  if (!(t && t.classList && t.classList.contains('world-thumb') && /^Arrow(Left|Right|Up|Down)$/.test(e.key))) return;
  e.preventDefault(); e.stopPropagation();
  const k = kid(R.h), open = THEMES.filter((x) => worldOpen(worldNo(x.id), C.ctxOf(k)));
  const i = open.findIndex((x) => x.id === themeOf(k)), d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
  fire('theme', open[(i + d + open.length) % open.length].id);
});
root.addEventListener('keydown', (e) => {
  const b = e.target.closest && e.target.closest('.av-pick'); if (!b) return;
  const all = [...root.querySelectorAll('[data-avgrid] .av-pick')], i = all.indexOf(b);
  const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 8, ArrowUp: -8 }[e.key];
  if (d == null) return;
  e.preventDefault(); const n = all[Math.max(0, Math.min(all.length - 1, i + d))]; n.focus();
});

/* ------------------------------------------------------------- service worker */

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const w = reg.installing; if (!w) return;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) {
          const bar = document.createElement('div'); bar.className = 'update-bar';
          bar.innerHTML = 'A new version is ready. <button>Update</button>';
          bar.querySelector('button').onclick = () => w.postMessage({ type: 'SKIP_WAITING' });
          document.body.appendChild(bar);
        }
      });
    });
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
}

/* the family's activity feed: active minutes for the Hive, per child, never sent anywhere */
const act = trackActivity(APP, () => (kid(R.h) || {}).name);
window.__bzg = { hourRight: () => V.hourQuestion(V.todaysCard()).c.cc, R, go, fire, music: M.musicState, next: nextStep, project, byCc, SHELF,
  NB: (cc) => toolById.chain.NB[cc], get TW() { return toolById.tradewinds; } };   // for test/ui.mjs, which drives the built app
/* the tools kept out of the first download arrive once the app is idle, so they work offline too */
setTimeout(() => (window.requestIdleCallback || ((f) => setTimeout(f, 1)))(() => { loadTool('geoguess'); loadTool('time'); }), 4000);
R.ui.nav = kid(R.h) ? 'home' : 'welcome';
if (location.hash) readHash(); else render();
