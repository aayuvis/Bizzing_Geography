/* main.js — the shell: boot, hash routing, the question runner, keys, and
   every data-act in one table. */

import { R } from './runtime.js';
import { Store } from './store.js';
import { on, fire, bindRoot, sfx, setSound, toast, confetti, say, hush } from './ui.js';
import { byId, drill, correct, worldOf, STOPS } from './stops.js';
import { newHousehold, newKid, kid, AVATARS, tick, session, GOALS, stopRec, scoreRun, road, stopOpen, lvFor, passLevel, levelOf, CHECK_PASS } from './model.js';
import { byCc } from './geo.js';
import { shuffle, rnd } from './rand.js';
import * as V from './views.js';
import { toolById, SHELF, loadTool } from './library/index.js';
import { bindMaps, restoreMaps, zoomMap, resetMap } from './mapui.js';
import { shapeName } from './map.js';
import { regionsOf } from './library/states.js';
import { GKEY, photosOn } from './photos.js';
import { THEMES, themeOf, isTheme, applyTheme, syncThemeColor } from './themes.js';
import { syncScene } from './scenes.js';
import * as X from './expeditions.js';
import { APP, trackActivity, trackMilestone, familyOff, earn as famEarn, spend } from './family.js';
import { xpFor, bonus, newMedals, SHOP, shopOf } from './rewards.js';
import { nextStep } from './next.js';
import { demoHousehold } from './demo.js';
import { expeditionById } from './data/expeditions.js';
import { dayKey } from './rand.js';

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
  const m = /^#\/([a-z]+)(?:\/(.+))?$/.exec(location.hash || '');
  if (m) go(m[1], m[2] ? decodeURIComponent(m[2]) : null, true); else render();
}
addEventListener('hashchange', () => { if (selfHash) { selfHash = false; return; } readHash(); });

function go(nav, arg = null, fromHash = false) {
  if (nav === 'run' && !R.run) nav = 'home';
  if (nav !== 'run' && R.run) R.run = null;
  if (nav === 'stop' && !byId[arg]) nav = 'atlas';
  if (nav === 'grownups' && R.ui.nav !== 'grownups') { R.ui.gate = false; R.ui.gateIn = ''; }
  R.ui.nav = nav; R.ui.arg = arg; R.ui.confirm = null; R.ui.menu = false;
  hush();
  if (!fromHash) writeHash();
  render();
  if (!fromHash) scrollTo(0, 0);
}

/* ------------------------------------------------------------- render */

function screen() {
  const k = kid(R.h), n = R.ui.nav;
  if (n === 'privacy') return V.viewPrivacy();
  if (n === 'grownups') return V.viewGrownups();
  if (n === 'run' && R.run) return V.viewRun();
  if (!k || n === 'welcome') return V.viewWelcome();
  switch (n) {
    case 'atlas': return V.viewAtlas();
    case 'world': return worldOf(R.ui.arg) ? V.viewWorld(R.ui.arg) : V.viewAtlas();
    case 'stop': return stopOpen(R.h, k, R.ui.arg) || X.expAllows(k, R.ui.arg) ? V.viewStop(R.ui.arg) : V.viewWorld(byId[R.ui.arg].world);
    case 'road': return V.viewRoad();
    case 'exp': return X.viewHub(k, V.pageHead);
    case 'expd': return X.viewExpedition(k, R.ui.arg, V, { part: R.ui.part });
    case 'proj': return X.viewProject(k, R.ui.arg, V);
    case 'library': return libraryView();
    case 'lib': {
      if (toolById[R.ui.arg]) return toolView(toolById[R.ui.arg]);
      const meta = SHELF.find((t) => t.id === R.ui.arg); if (!meta) return libraryView();
      loadTool(meta.id).then(() => { if (R.ui.nav === 'lib' && R.ui.arg === meta.id) render(); });
      return `<section class="tool-page">${V.pageHead(`${meta.glyph} ${meta.name}`, '', V.back('nav', 'Library', 'library'))}<div class="card center-card"><p class="muted">Opening ${V.esc(meta.name)}…</p></div></section>`;
    }
    case 'me': return V.viewMe();
    default: return V.viewHome();
  }
}
const libraryView = () => `<section>${V.pageHead('The Explorer’s Library')}
  <div class="lib-grid">${SHELF.map(V.libTile).join('')}</div></section>`;
function toolView(tool) {
  let body;
  try { body = tool.view(libCtx(tool.TOOL.id)); } catch (e) { console.error(e); body = '<div class="card center-card"><p>Something went wrong in this tool.</p></div>'; }
  return `<section class="tool-page tool-${tool.TOOL.id}">${V.pageHead(`${tool.TOOL.glyph} ${tool.TOOL.name}`, '', V.back('nav', 'Library', 'library'))}${body}</section>`;
}

let focusId = null, woPic = {}, autoReadAt = '';
function render() {
  const a = document.activeElement;
  focusId = a && a.id ? a.id : null;
  const caret = a && a.selectionStart != null ? a.selectionStart : null;
  /* the active child's theme; on the welcome's last step, the world being chosen */
  const th = (!kid(R.h) || R.ui.nav === 'welcome') && R.ui.draft && R.ui.draft.step === 3 ? R.ui.draft.theme : themeOf(kid(R.h));
  applyTheme(th);
  const kk = kid(R.h); document.documentElement.setAttribute('data-frame', kk ? shopOf(kk).frame : 'plain');
  if (R.ui.coinToast) { const c = R.ui.coinToast; R.ui.coinToast = 0; setTimeout(() => toast(`+${c} 🪙 for learning`), 0); }
  syncScene(th, R.ui.nav === 'run' || Store.loadDevice('still', false));   // a quiz run gets a still, faded scene
  root.innerHTML = V.shell(screen());
  restoreMaps(root);
  root.querySelectorAll('.wo-view').forEach((v) => {   // a new picture starts in the middle; a re-render keeps where the child looked
    const src = (v.querySelector('img:not(.wo-bg)') || {}).src;
    if (v.scrollWidth > v.clientWidth) v.scrollLeft = src === woPic.src ? woPic.x : (v.scrollWidth - v.clientWidth) / 2;
    v.addEventListener('scroll', () => { woPic = { src, x: v.scrollLeft }; }, { passive: true });
    woPic = { src, x: v.scrollLeft };
  });
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

/* ------------------------------------------------------------- the runner */

function startRun(kind, title, items, extra = {}) {
  if (!items.length) { toast('Nothing to ask here yet.'); return; }
  R.run = { kind, title, items, i: 0, results: [], fb: null, over: false, ...extra };
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
  if (k && run.kind !== 'trial') {
    const src = run.kind === 'drill' ? run.stop : run.kind === 'lib' ? run.lib : run.kind === 'sprint' ? 'exp:' + run.exp : run.kind;
    tick(k, right, right ? xpFor(k, src, run.kind === 'drill' ? { stop: run.stop, lv: run.lv } : {}) : 0);
    if (right) earn('right', true);
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
  run.fb = null; run.i++;
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
    if (res.passed && rd.next) run.summary.buttons = [V.btn(`Next station: ${byId[rd.next.stop].title} →`, 'openStop', rd.next.stop, 'big')];
    if (res.passed && rd.all) run.summary.lines.push(`Every station on Level ${rd.L.n} is done. Take the level check to open the next level.`);
    if (res.gained) { sfx.level(); confetti(30); }
    k.last = { k: res.passed ? 'stop' : 'try', title: byId[run.stop].title, at: Date.now() };
    if (res.passed && res.firstPass) { bonus(k, 'stop'); earn('stop'); }
    if (res.passed && res.gained) trackMilestone(APP, k.name, 'stop', `Passed ${byId[run.stop].title}`);
  } else if (run.kind === 'check') {
    const pass = right / n >= CHECK_PASS;
    earn('contest');
    if (pass) { bonus(k, 'level'); earn('mastered'); const L = passLevel(k); k.last = { k: 'check', title: `Level ${L}`, at: Date.now() }; trackMilestone(APP, k.name, 'band', `Reached Level ${L}: ${levelOf(L).name}`); run.summary = { stars: 3, lines: [`Level check passed. Welcome to Level ${L}: ${levelOf(L).name}.`] }; sfx.level(); confetti(60); }
    else run.summary = { stars: right / n >= 0.6 ? 1 : 0, lines: [`Ten right opens the next level. Walk a few more stations on your road, then try again.`] };
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
  } else if (run.kind === 'lib') {
    const t = toolById[run.lib];
    run.summary = t && t.done ? t.done(run, libCtx(run.lib)) : null;
  }
  save();
}

/* ------------------------------------------------------------- actions */

on('nav', (a) => go(a || 'home'));
on('openWorld', (w) => { R.ui.pick = null; go('world', w); });
on('pickStop', (id) => { R.ui.pick = id; render(); });
on('openStop', (id) => { if (!stopOpen(R.h, kid(R.h), id) && !X.expAllows(kid(R.h), id)) { toast('That stop opens on a later level.'); return; } go('stop', id); });
on('openTool', (id) => go('lib', id));
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
function startDrill(id, extra = {}) { const s = byId[id], k = kid(R.h), lv = lvFor(k, id); startRun('drill', s.title, drill(s, lv, 10), { stop: id, lv, sub: `${s.glyph} ${['', 'First look', 'Deeper', 'Stretch'][lv]}`, ...extra }); }
on('startDrill', (id) => startDrill(id));
/* try one question before making an explorer (A5): nothing is saved until sign-up */
on('trial', () => startRun('trial', 'Try one question', drill(byId['find-continent'], 1, 1), { sub: '🌍 No explorer needed yet' }));
/* the timed round of Where on Earth? (E2): a clock per card, ticking on screen only */
setInterval(() => {
  const g = R.ui.nav === 'lib' && R.ui.arg === 'geoguess' && ((R.ui.lib || {}).geoguess || {}).g;
  if (!g || !g.timed || g.i >= g.cards.length || g.done[g.i]) return;
  const left = Math.max(0, Math.ceil((g.deadline - Date.now()) / 1000)), el = root.querySelector('.wo-clock');
  if (el) { el.textContent = `⏱ ${left}s`; el.classList.toggle('low', left <= 10); }
  if (left <= 0) { fire('lib', 'geoguess|timeout'); buzz(30); }
}, 500);
/* the 5-minute trip (E1): three from what you have passed, one new, one on the map — then it ends */
on('trip', () => {
  const k = kid(R.h), passed = shuffle(Object.keys(k.stops).filter((id) => byId[id] && k.stops[id].stars >= 2), rnd), rd = road(k), items = [];
  const tag = (qs, id) => qs.map((q) => ({ ...q, from: byId[id].title }));
  for (const id of passed.slice(0, 3)) items.push(...tag(drill(byId[id], lvFor(k, id), 1), id));
  const nx = rd.next ? rd.next.stop : rd.steps[0].stop;
  items.push(...tag(drill(byId[nx], lvFor(k, nx), 1), nx));
  const mapStop = shuffle([...passed, nx], rnd).find((id) => drill(byId[id], lvFor(k, id), 6).some((q) => q.kind === 'map'));
  if (mapStop) { const q = drill(byId[mapStop], lvFor(k, mapStop), 12).find((x) => x.kind === 'map'); if (q) items.push({ ...q, from: byId[mapStop].title }); }
  while (items.length < 5) items.push(...tag(drill(byId[nx], lvFor(k, nx), 1), nx));
  startRun('trip', '5-minute trip', items.slice(0, 5), { sub: '⏱️ Review · one new · one map' });
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
  const k = kid(R.h), L = levelOf(k.road.level), items = [];
  for (const s of shuffle(L.steps, rnd)) items.push(...drill(byId[s.stop], s.lv, 1));
  while (items.length < 12) { const s = L.steps[items.length % L.steps.length]; items.push(...drill(byId[s.stop], s.lv, 1)); }
  startRun('check', `Level ${L.n} check`, shuffle(items, rnd).slice(0, 12), { sub: L.name });
});
on('lvShow', (n) => { R.ui.lvShow = +n; render(); });
on('choose', (a) => answer(a));
on('nextQ', () => nextQ());
on('quitRun', () => { const r = R.run; R.run = null; if (r && r.kind === 'trial') return go('welcome'); if (r && r.kind === 'sprint') return go('expd', r.exp); if (r && r.kind === 'lib') return go('lib', r.lib); if (r && r.kind === 'drill') return go('stop', r.stop); go(r && r.kind === 'check' ? 'road' : 'home'); });
on('endRun', () => { const r = R.run; R.run = null; if (r && r.kind === 'trial') { R.ui.draft = { step: 0, name: '', band: '', avatar: V.STARTER_AVATARS[0], theme: 'atlas' }; return go('welcome'); } if (r && r.kind === 'sprint') return go('expd', r.exp); if (r && r.kind === 'lib') return go('lib', r.lib); if (r && r.kind === 'drill') return go('stop', r.stop); go(r && r.kind === 'check' ? 'road' : 'home'); });
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
  if (R.ui.nav === 'lib' && toolById[R.ui.arg]) { toolById[R.ui.arg].act('tap', JSON.stringify(t), libCtx(R.ui.arg)); buzz(12); render(); }
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
  save(); sfx.level(); confetti(40);
  /* the welcome ends IN the first station's first question (A3), with its lesson as a why-card above it */
  const st = road(k).next; if (st) return startDrill(st.stop, { intro: true });
  go('home');
});
on('switchKid', (id) => { if (!R.h.kids.some((x) => x.id === id)) return; R.h.active = id; R.ui.lib = {}; R.ui.menu = false; save(); go('home'); });
on('setAv', (a) => { if (AVATARS.includes(a)) { kid(R.h).avatar = a; save(); render(); } });
on('goal', (n) => { const k = kid(R.h); if (GOALS.includes(+n)) { k.prefs.goal = +n; save(); render(); } });
on('still', () => { Store.saveDevice('still', !Store.loadDevice('still', false)); render(); });
/* themes belong to the child: chosen on their page, applied at once */
on('theme', (id) => {
  const k = kid(R.h); if (!k || !isTheme(id)) return;
  k.prefs = k.prefs || {}; k.prefs.theme = id; save(); render();
  const el = document.getElementById('theme-' + id); if (el) el.focus();
});
on('themes', () => {
  go('me');
  const el = document.getElementById('themes'); if (el) el.scrollIntoView({ block: 'start' });
  const on1 = document.querySelector('.theme-card[aria-checked="true"]'); if (on1) on1.focus({ preventScroll: true });
});

/* chrome */
on('sound', () => { R.sound = !R.sound; setSound(R.sound); Store.saveDevice('sound', R.sound); render(); });
/* the menu closes on a tap outside it, or Escape */
root.addEventListener('click', (e) => { if (R.ui.menu && !e.target.closest('.who-menu, .who')) { R.ui.menu = false; render(); } }, true);
on('mode', () => {
  const m = document.documentElement.getAttribute('data-mode') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-mode', m); Store.saveDevice('mode', m); syncThemeColor();
});

/* grown-ups */
on('gate', () => {
  const pin = (R.ui.gateIn || '').replace(/\D/g, '');
  if (pin.length !== 4) { toast('Four digits, please.'); return; }
  if (!R.h.parent.pin) { R.h.parent.pin = pin; save(); R.ui.gate = true; }
  else if (pin === R.h.parent.pin) R.ui.gate = true;
  else { toast('That PIN is not right.'); R.ui.gateIn = ''; }
  render();
});
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
  if (t.dataset.libQuiet) { libCtx(R.ui.arg).ui[t.dataset.libQuiet] = t.value; return; }   // kept, never re-rendered while typing
  if (t.dataset.libInput) { const ctx = libCtx(R.ui.arg); ctx.ui[t.dataset.libInput] = t.value; clearTimeout(inT); inT = setTimeout(render, 90); }
  if (t.dataset.libRange) { const tool = toolById[t.dataset.libRange]; tool.act('range', t.value, libCtx(t.dataset.libRange)); render(); }
});
root.addEventListener('change', (e) => { if (e.target.dataset.act === 'tester') { /* handled by click */ } });

addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if ((R.ui.medalPop || []).length && (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ')) { e.preventDefault(); fire('medalOk'); return; }
  if (R.ui.menu && e.key === 'Escape') { R.ui.menu = false; render(); const w = root.querySelector('.who'); if (w) w.focus(); return; }
  const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
  if (R.ui.nav === 'grownups' && e.key === 'Enter' && e.target.id === 'pin') { fire('gate'); return; }
  if (e.key === 'Enter' && e.target.id === 'kname') { fire('obNext'); return; }
  if (e.target && e.target.dataset && e.target.dataset.projKeys && /^(Arrow(Up|Down|Left|Right)|Enter| |[1-9]|f|F)$/.test(e.key)) { e.preventDefault(); fire('proj', 'key|' + e.key); return; }
  if (R.run && !R.run.over) {
    const q = R.run.items[R.run.i];
    if (R.run.fb) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); nextQ(); } return; }
    if (q.kind === 'mc' && !typing) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= q.opts.length) { e.preventDefault(); answer(q.opts[n - 1]); }
    }
    if (q.kind === 'map' && !typing) {          // list mode: 1–6 choose, as for any list
      const n = parseInt(e.key, 10), b = root.querySelectorAll('.map-list .opt')[n - 1];
      if (b) { e.preventDefault(); answer(b.dataset.arg); }
    }
    return;
  }
  if (R.run && R.run.over && e.key === 'Enter' && !typing) { e.preventDefault(); fire('endRun'); return; }
  if (R.ui.nav === 'lib' && toolById[R.ui.arg] && toolById[R.ui.arg].key) {
    if ((!typing || e.key === 'Enter' || e.key === 'Escape') && toolById[R.ui.arg].key(e, libCtx(R.ui.arg))) { e.preventDefault(); render(); }
  }
});
/* avatar grid: arrow keys move through the faces */
/* the theme picker is a radio group: arrows move the choice and apply it */
root.addEventListener('keydown', (e) => {
  const t = e.target;
  if (!(t && t.classList && t.classList.contains('theme-card') && /^Arrow(Left|Right|Up|Down)$/.test(e.key))) return;
  e.preventDefault(); e.stopPropagation();
  const i = THEMES.findIndex((x) => x.id === t.dataset.arg), d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
  fire('theme', THEMES[(i + d + THEMES.length) % THEMES.length].id);
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
window.__bzg = { R, go, fire, activityTick: act.tick };   // for test/ui.mjs, which drives the built app
/* the tools kept out of the first download arrive once the app is idle, so they work offline too */
setTimeout(() => (window.requestIdleCallback || ((f) => setTimeout(f, 1)))(() => { loadTool('geoguess'); loadTool('time'); }), 4000);
R.ui.nav = kid(R.h) ? 'home' : 'welcome';
if (location.hash) readHash(); else render();
