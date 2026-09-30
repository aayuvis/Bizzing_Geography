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
import { toolById, SHELF } from './library/index.js';
import { bindMaps, restoreMaps, zoomMap, resetMap } from './mapui.js';
import { shapeName } from './map.js';
import { regionsOf } from './library/states.js';
import { GKEY, photosOn } from './photos.js';
import { THEMES, themeOf, isTheme, applyTheme, syncThemeColor } from './themes.js';
import { syncScene } from './scenes.js';
import * as X from './expeditions.js';

const root = document.getElementById('app');

/* ------------------------------------------------------------- boot */

R.h = Store.loadHousehold() || newHousehold();
R.sound = Store.loadDevice('sound', true); setSound(R.sound);
const mode = Store.loadDevice('mode', null);
const sysDark = matchMedia('(prefers-color-scheme: dark)');
document.documentElement.setAttribute('data-mode', mode || (sysDark.matches ? 'dark' : 'light'));
sysDark.addEventListener && sysDark.addEventListener('change', (e) => { if (!Store.loadDevice('mode', null)) document.documentElement.setAttribute('data-mode', e.matches ? 'dark' : 'light'); });

function save() { Store.saveHousehold(R.h); }

/* The Library's context: everything a tool may touch, and no more. */
function libCtx(id) {
  const k = kid(R.h); R.ui.lib = R.ui.lib || {};
  const ui = R.ui.lib[id] || (R.ui.lib[id] = {});
  const data = k.lib[id] || (k.lib[id] = {});
  return {
    id, kid: k, band: k.band, ui, data, save, render, toast, sfx, confetti, say,
    photos: photosOn(R.h), photosReady: !!GKEY,
    tick: (right, xp = 1) => { tick(k, right, xp); save(); },
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
function readHash() {
  const m = /^#\/([a-z]+)(?:\/(.+))?$/.exec(location.hash || '');
  if (m) go(m[1], m[2] ? decodeURIComponent(m[2]) : null, true); else render();
}
addEventListener('hashchange', () => { if (selfHash) { selfHash = false; return; } readHash(); });

function go(nav, arg = null, fromHash = false) {
  if (nav === 'run' && !R.run) nav = 'home';
  if (nav !== 'run' && R.run) R.run = null;
  if (nav === 'stop' && !byId[arg]) nav = 'atlas';
  if (nav === 'grownups' && R.ui.nav !== 'grownups') { R.ui.gate = false; R.ui.gateIn = ''; }
  R.ui.nav = nav; R.ui.arg = arg; R.ui.confirm = null;
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
  if (!k || n === 'welcome') return V.viewWelcome();
  if (n === 'run' && R.run) return V.viewRun();
  switch (n) {
    case 'atlas': return V.viewAtlas();
    case 'world': return worldOf(R.ui.arg) ? V.viewWorld(R.ui.arg) : V.viewAtlas();
    case 'stop': return stopOpen(R.h, k, R.ui.arg) || X.expAllows(k, R.ui.arg) ? V.viewStop(R.ui.arg) : V.viewWorld(byId[R.ui.arg].world);
    case 'road': return V.viewRoad();
    case 'exp': return X.viewHub(k, V.pageHead);
    case 'expd': return X.viewExpedition(k, R.ui.arg, V, { part: R.ui.part });
    case 'proj': return X.viewProject(k, R.ui.arg, V);
    case 'library': return libraryView();
    case 'lib': return toolById[R.ui.arg] ? toolView(toolById[R.ui.arg]) : libraryView();
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

let focusId = null;
function render() {
  const a = document.activeElement;
  focusId = a && a.id ? a.id : null;
  const caret = a && a.selectionStart != null ? a.selectionStart : null;
  /* the active child's theme; on the welcome's last step, the world being chosen */
  const th = (!kid(R.h) || R.ui.nav === 'welcome') && R.ui.draft && R.ui.draft.step === 3 ? R.ui.draft.theme : themeOf(kid(R.h));
  applyTheme(th);
  syncScene(th, R.ui.nav === 'run' || Store.loadDevice('still', false));   // a quiz run gets a still, faded scene
  root.innerHTML = V.shell(screen());
  restoreMaps(root);
  root.querySelectorAll('.seg .on').forEach((b) => { const s = b.parentElement; if (s.scrollWidth > s.clientWidth) s.scrollLeft = b.offsetLeft - (s.clientWidth - b.offsetWidth) / 2; });
  if (focusId) { const el = document.getElementById(focusId); if (el) { el.focus(); if (caret != null && el.setSelectionRange) try { el.setSelectionRange(caret, caret); } catch (_) {} } }
  document.title = 'Bizzing Geography';
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
  tick(k, right, 1);
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
  if (n) session(k);   // one notch on Today’s ring
  if (run.kind === 'drill') {
    const res = scoreRun(k, run.stop, run.lv, right, n);
    const rd = road(k);
    run.summary = { stars: res.stars, lines: [res.passed ? `Station passed${res.gained ? ` — ${'★'.repeat(res.stars)}` : ''}.` : 'Seven right passes this station. Read the lesson again, then have another go.'] };
    if (res.passed && rd.next) run.summary.buttons = [V.btn(`Next station: ${byId[rd.next.stop].title} →`, 'openStop', rd.next.stop, 'big')];
    if (res.passed && rd.all) run.summary.lines.push(`Every station on Level ${rd.L.n} is done. Take the level check to open the next level.`);
    if (res.gained) { sfx.level(); confetti(30); }
  } else if (run.kind === 'check') {
    const pass = right / n >= CHECK_PASS;
    if (pass) { const L = passLevel(k); run.summary = { stars: 3, lines: [`Level check passed. Welcome to Level ${L}: ${levelOf(L).name}.`] }; sfx.level(); confetti(60); }
    else run.summary = { stars: right / n >= 0.6 ? 1 : 0, lines: [`Ten right opens the next level. Walk a few more stations on your road, then try again.`] };
  } else if (run.kind === 'sprint') {
    run.summary = X.finishDay(k, run, right, n);
    if (run.summary.big) { sfx.level(); confetti(40); }
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
on('openLandmark', (id) => { toolById.landmarks.act('sel', id, libCtx('landmarks')); go('lib', 'landmarks'); });
/* expeditions: the engine decides what a day is; the host only goes, runs or toasts */
on('expOpen', (id) => { R.ui.part = null; go('expd', id); });
on('expPart', (j) => { R.ui.part = +j; render(); });
/* a project's builder: every control is data-act="proj", arg "name|value" */
on('proj', (a) => { const i = String(a).indexOf('|'), msg = X.projAct(kid(R.h), R.ui.arg, a.slice(0, i), a.slice(i + 1)); save(); if (msg) toast(msg); render(); });
on('projDone', () => {
  const k = kid(R.h), msg = X.projAct(k, R.ui.arg, 'done');
  if (msg !== 'made') { toast(msg); return; }
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
on('startDrill', (id) => { const s = byId[id], k = kid(R.h), lv = lvFor(k, id); startRun('drill', s.title, drill(s, lv, 10), { stop: id, lv, sub: `${s.glyph} ${['', 'First look', 'Deeper', 'Stretch'][lv]}` }); });
on('levelCheck', () => {
  const k = kid(R.h), L = levelOf(k.road.level), items = [];
  for (const s of shuffle(L.steps, rnd)) items.push(...drill(byId[s.stop], s.lv, 1));
  while (items.length < 12) { const s = L.steps[items.length % L.steps.length]; items.push(...drill(byId[s.stop], s.lv, 1)); }
  startRun('check', `Level ${L.n} check`, shuffle(items, rnd).slice(0, 12), { sub: L.name });
});
on('lvShow', (n) => { R.ui.lvShow = +n; render(); });
on('choose', (a) => answer(a));
on('nextQ', () => nextQ());
on('quitRun', () => { const r = R.run; R.run = null; if (r && r.kind === 'sprint') return go('expd', r.exp); if (r && r.kind === 'lib') return go('lib', r.lib); if (r && r.kind === 'drill') return go('stop', r.stop); go(r && r.kind === 'check' ? 'road' : 'home'); });
on('endRun', () => { const r = R.run; R.run = null; if (r && r.kind === 'sprint') return go('expd', r.exp); if (r && r.kind === 'lib') return go('lib', r.lib); if (r && r.kind === 'drill') return go('stop', r.stop); go(r && r.kind === 'check' ? 'road' : 'home'); });
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
  if (R.ui.nav === 'lib' && toolById[R.ui.arg]) { toolById[R.ui.arg].act('tap', JSON.stringify(t), libCtx(R.ui.arg)); render(); }
}
bindMaps(root, mapTap);

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
  R.h.kids.push(k); R.h.active = k.id; R.ui.draft = null; save(); sfx.level(); confetti(40); go('home');
});
on('switchKid', (id) => { R.h.active = id; R.ui.lib = {}; save(); go('home'); });
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
on('wipeYes', () => { Store.wipe(); R.h = newHousehold(); R.ui = { nav: 'welcome', arg: null }; go('welcome'); });

/* ------------------------------------------------------------- inputs & keys */

bindRoot(root);
/* a Street View photo with no imagery answers 404: swap in another place, uncounted */
root.addEventListener('error', (e) => {
  const t = e.target;
  if (t && t.tagName === 'IMG' && t.dataset.sv && !t.dataset.gone) { t.dataset.gone = '1'; fire('lib', 'geoguess|skip'); }
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
    return;
  }
  if (R.run && R.run.over && e.key === 'Enter' && !typing) { e.preventDefault(); fire('endRun'); return; }
  if (R.ui.nav === 'lib' && toolById[R.ui.arg] && toolById[R.ui.arg].key) {
    if ((!typing || e.key === 'Enter') && toolById[R.ui.arg].key(e, libCtx(R.ui.arg))) { e.preventDefault(); render(); }
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

window.__bzg = { R, go, fire };   // for test/ui.mjs, which drives the built app
R.ui.nav = kid(R.h) ? 'home' : 'welcome';
if (location.hash) readHash(); else render();
