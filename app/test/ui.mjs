/* test/ui.mjs — drive the BUILT app in a real browser, the way a child would.
   Serves build/ under /Bizzing_Geography/ (the GitHub Pages sub-path), then
   walks: onboarding → home → Atlas → a world → a stop → a drill (multiple
   choice by keyboard, map taps by touch AND by the keyboard cross) → My road
   → every Library tool → Where on Earth? → state capitals → grown-ups. Any page
   error, 404 or sideways scroll on a phone fails it. Screenshots in .shots/. */
import { createRequire } from 'node:module';
import { gzipSync } from 'node:zlib';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, symlinkSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkShell } from './shell-check.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || '/opt/node22/lib/node_modules/playwright');

const HERE = resolve(import.meta.dirname, '..');
const SHOTS = process.env.SHOTS || resolve(HERE, '.shots');
const SITE = resolve(HERE, '.site');
rmSync(SITE, { recursive: true, force: true }); mkdirSync(SITE, { recursive: true }); mkdirSync(SHOTS, { recursive: true });
symlinkSync(resolve(HERE, 'build'), resolve(SITE, 'Bizzing_Geography'));
const port = +(process.env.PORT || 8000 + Math.floor(Math.random() * 900));
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: SITE, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));

let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.error('  ✗ ' + m); } else if (process.env.V) console.log('  ✓ ' + m); };
const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined });
const errors = [];

/* a screen point inside a shape (the biggest path with that id), found by
   probing — a bounding-box centre can be sea (Spain with the Canaries) */
const inside = (page, sel) => page.evaluate((sel) => {
  const els = [...document.querySelectorAll(sel)]; if (!els.length) return null;
  const el = els.sort((a, b) => b.getBBox().width * b.getBBox().height - a.getBBox().width * a.getBBox().height)[0];
  const r = el.getBoundingClientRect(), hits = [];
  for (let i = 1; i < 30; i++) for (let j = 1; j < 30; j++) {
    const x = r.left + (r.width * i) / 30, y = r.top + (r.height * j) / 30;
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
    if (document.elementFromPoint(x, y) === el) hits.push([x, y]);
  }
  if (!hits.length) return null;
  const cx = hits.reduce((a, h) => a + h[0], 0) / hits.length, cy = hits.reduce((a, h) => a + h[1], 0) / hits.length;
  return hits.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cy) - Math.hypot(b[0] - cx, b[1] - cy))[0];
}, sel);

async function run(vp, tag) {
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1, hasTouch: vp.width < 760 });
  await page.clock.install();   // time still flows; the family's activity tracker can be fast-forwarded below
  /* the device voice, stubbed: what would be spoken is kept in window.__spoken */
  await page.addInitScript(() => { window.__spoken = []; try { window.speechSynthesis.speak = (u) => { window.__spoken.push(u.text); setTimeout(() => u.onend && u.onend(), 10); }; window.speechSynthesis.cancel = () => {}; } catch (_) {} });
  page.on('pageerror', (e) => errors.push(`${tag}: ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`${tag} ${r.status()}: ${r.url()}`); });
  page.on('request', (r) => { if (!r.url().startsWith(`http://127.0.0.1:${port}/`) && !r.url().startsWith('data:')) errors.push(`${tag} third-party request: ${r.url()}`); });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${tag} console: ${m.text()}`); });
  /* every screen shot is also a check: no markup ever reaches the child as text ("<svg class=ico…" was the
     drill header's subtitle on every stop) */
  const shot = async (n) => {
    const raw = await page.evaluate(() => { const t = document.body.innerText; const m = /<\/?(svg|span|div|b|i|button|path|img)\b|&lt;|&gt;|&amp;[a-z]/i.exec(t); return m ? t.slice(Math.max(0, m.index - 30), m.index + 40) : null; });
    ok(!raw, `${tag} ${n}: no raw markup in the visible text (${raw})`);
    return page.screenshot({ path: `${SHOTS}/${tag}-${n}.png` });
  };
  const S = () => page.evaluate(() => { const r = window.__bzg.R, q = r.run && r.run.items[r.run.i]; return { nav: r.ui.nav, run: r.run && { kind: r.run.kind, i: r.run.i, n: r.run.items.length, over: r.run.over, fb: r.run.fb, q } }; });
  const phone = vp.width < 760;
  const nav = async (k) => { await page.evaluate(() => { window.__bzg.R.ui.medalPop = []; }); return page.click(phone ? `[data-bz=tabbar] a[href="#/${k}"]` : `[data-bz=tabs] a[href="#/${k}"]`); };
  /* measured against the viewport WE set: Chromium widens innerWidth/clientWidth to fit overflow under
     mobile emulation, so a check against them passes on a broken page */
  const W = vp.width;
  const noSideways = async (where) => {
    const bad = await page.evaluate((W) => {
      if (document.documentElement.scrollWidth > W + 1) return `page is ${document.documentElement.scrollWidth}px wide`;
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect(); if (!r.width || r.right <= W + 1) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.position === 'fixed' && r.left >= W) continue;
        let a = el.parentElement, clipped = false;
        while (a && a !== document.body) { const o = getComputedStyle(a).overflowX; if (o !== 'visible' && a.getBoundingClientRect().right <= W + 1) { clipped = true; break; } a = a.parentElement; }
        if (!clipped && !el.closest('.scene')) return `${el.tagName.toLowerCase()}.${[...el.classList].join('.')} ends at ${Math.round(r.right)}`;
      }
      return '';
    }, W);
    ok(!bad, `${where}: nothing past the ${W}px device width${bad ? ' — ' + bad : ''}`);
    /* N12 grammar, and §16: never "1 points", "[object Object]", "undefined" or a {placeholder} on screen */
    const txt = await page.evaluate(() => document.body.innerText);
    const g = /\b1 (points|stars|coins|questions|medals|stations|places|days|countries|capitals|words|stops|answers)\b/.exec(txt) || /\[object Object\]|\bundefined\b|\bNaN\b|\{[a-zA-Z_]+\}/.exec(txt);
    ok(!g, `${where}: no broken words on screen${g ? ' — "' + g[0] + '"' : ''}`);
    /* §9/§22: zero emoji in controls and headings; every icon-only button is named (P6) */
    const em = await page.evaluate(() => { const re = /\p{Extended_Pictographic}|\u20E3/u; return [...document.querySelectorAll('#app button, #app [role=tab], #app nav, #app h1, #app h2, #app h3, #app .chip')].filter((e) => e.offsetParent && re.test(e.innerText || '')).map((e) => (e.innerText || '').trim().slice(0, 30)); });
    ok(!em.length, `${where}: no emoji in controls or headings${em.length ? ' — ' + em.slice(0, 3).join(' | ') : ''}`);
    const unnamed = await page.evaluate(() => [...document.querySelectorAll('#app button, #app a')].filter((b) => b.checkVisibility() && !(b.innerText || '').trim() && !b.getAttribute('aria-label') && !b.querySelector('img[alt]:not([alt=""])')).map((b) => b.outerHTML.slice(0, 60)));
    ok(!unnamed.length, `${where}: every icon button has a name${unnamed.length ? ' — ' + unnamed[0] : ''}`);
  };

  const T0 = Date.now();
  /* P3: every tap target at least 44px — measured, not trusted */
  const targets = async (where) => {
    const small = await page.evaluate(() => [...document.querySelectorAll('#app button, #app [role=tab], #app a.btn, #app input[type=range], #app summary')].filter((b) => b.offsetParent && !b.closest('.foot, .demo-bar, .prose p, .muted, .src, [data-bz=bar]') && !b.classList.contains('linkish')).map((b) => [b, b.getBoundingClientRect()]).filter(([, r]) => r.height < 43.5 || r.width < 43.5).map(([b, r]) => `${(b.innerText || b.getAttribute('aria-label') || b.className).trim().slice(0, 24)} ${Math.round(r.width)}×${Math.round(r.height)}`));
    ok(!small.length, `${where}: every target is at least 44px${small.length ? ' — ' + small.slice(0, 4).join(', ') : ''}`);
  };
  await page.goto(`http://127.0.0.1:${port}/Bizzing_Geography/`);
  await page.waitForSelector('.welcome');
  await shot('01-welcome'); await noSideways('landing');
  /* A5: try one question before any explorer exists; nothing is saved until sign-up */
  await page.click('[data-act=trial]'); await page.waitForSelector('.qcard');
  await page.evaluate(() => { const q = window.__bzg.R.run.items[0]; window.__bzg.fire('choose', q.kind === 'map' ? q.ok[0] : q.ans); });
  await page.waitForTimeout(1700); await page.evaluate(() => { const r = window.__bzg.R.run; if (r && !r.over) window.__bzg.fire('nextQ'); });
  ok(await page.evaluate(() => window.__bzg.R.run && window.__bzg.R.run.over && window.__bzg.R.h.kids.length === 0), 'a question can be tried before making an explorer, and makes none');
  ok(await page.evaluate(() => !(JSON.parse(localStorage.getItem('bzg_household') || '{}').kids || []).length), 'trying first saves no child');
  await page.click('[data-act=endRun]'); await page.waitForSelector('#kname');
  ok(await page.locator('[data-act=obNext]').isDisabled(), 'Next waits for a name');
  await page.fill('#kname', 'Ahana'); await page.press('#kname', 'Enter');
  await page.waitForSelector('[data-act=draftBand]'); await shot('01b-age');
  await page.click('[data-act=draftBand][data-arg="8-10"]');
  ok(await page.locator('.ob-avs .av-pick').count() === 5, 'the welcome offers five companions, not forty');
  await page.click('[data-act=draftAv][data-arg="dolphin"]'); await page.click('[data-act=obNext]');
  ok(await page.locator('.ob-themes .theme-card').count() === 2, 'and two worlds');
  await page.click('[data-act=draftTheme][data-arg="ocean"]');
  ok(await page.evaluate(() => document.documentElement.dataset.theme) === 'ocean', 'choosing a world shows it straight away');
  await shot('01c-world'); await noSideways('welcome');
  await page.click('[data-act=draftTheme][data-arg="atlas"]');
  await page.click('[data-act=createKid]');
  /* A8: the welcome ends IN an easy first question on the whole map; its right answer is celebrated (not the sign-up) */
  await page.waitForSelector('.runner .qcard');
  ok(await page.evaluate(() => window.__bzg.R.run.kind === 'warm' && window.__bzg.R.run.items[0].kind === 'map') && await page.locator('.conf').count() === 0, 'the first question arrives with zero taps after setup — an easy map question, and no confetti before any answer');
  await page.evaluate(() => { const q = window.__bzg.R.run.items[0]; window.__bzg.fire('choose', q.ok[0]); });
  await page.waitForSelector('.first-pop');
  ok(Date.now() - T0 < 120000 && /first right answer/i.test(await page.locator('.first-pop').innerText()), `A8: a new child has a right answer and a celebration inside two minutes (${Math.round((Date.now() - T0) / 1000)}s, scripted)`);
  await shot('01d-first-right');
  await page.click('[data-act=firstOk]'); await page.waitForSelector('[data-act=warmNext]', { timeout: 5000 });
  await page.click('[data-act=warmNext]'); await page.waitForSelector('.runner .qcard');
  ok(await page.locator('.why-card').count() === 1 && await page.evaluate(() => window.__bzg.R.run.kind === 'drill'), 'then straight into the first stop, its "why" above the first question');
  ok(await page.evaluate(() => { const h = document.querySelector('.runner .phead'); return !!h && !/</.test(h.innerText) && !!h.querySelector('.phead-t p svg'); }), 'the drill header shows the stop’s glyph as a picture, never as "<svg…" text');
  ok(await page.evaluate(() => { const b = document.querySelector('.runner .phead .back'); return !!b && b.getAttribute('aria-label') === window.__bzg.R.run.back && window.__bzg.R.run.back !== 'Stop'; }), 'the drill’s back pill names where it goes (its stop), not a bare "Stop"');
  ok(await page.evaluate(() => window.__bzg.R.h.kids[0].days && Object.values(window.__bzg.R.h.kids[0].days).some((d) => d.q >= 1)), 'the question tried first is counted on the new explorer');
  await page.click('[data-act=quitRun]'); await page.evaluate(() => window.__bzg.go('home'));
  await page.waitForSelector('[data-bz=home]');
  await page.waitForTimeout(300); await shot('02-home'); await noSideways('home'); await targets('home');
  ok(await page.evaluate(() => window.__bzg.R.h.kids[0].road.level) === 3, 'an 8–10 starts on Level 3');
  /* B2: exactly one filled primary button on home — the Continue card, chosen by next.js */
  /* the family shell: Bee's chrome and home, MEASURED (integration/shell-check.mjs), light and dark */
  for (const mode of ['light', 'dark']) {
    await page.evaluate((m) => { document.documentElement.setAttribute('data-mode', m); window.__bzg.R.ui.medalPop = []; window.__bzg.go('home'); }, mode); await page.waitForTimeout(250);
    /* measured like for like: Bee's numbers were taken with a 40-coin chip, and the chip's width is its digits */
    await page.evaluate(() => { const w = JSON.parse(localStorage.getItem('bizzing.wallet') || '{"v":1,"kids":{}}'); w.kids.ahana = w.kids.ahana || { coins: 0, ledger: [] }; window.__coins0 = w.kids.ahana.coins; w.kids.ahana.coins = 40; localStorage.setItem('bizzing.wallet', JSON.stringify(w)); window.__bzg.R.render(); });
    const sf = await checkShell(page, { phone });
    await page.evaluate(() => { const w = JSON.parse(localStorage.getItem('bizzing.wallet')); w.kids.ahana.coins = window.__coins0; localStorage.setItem('bizzing.wallet', JSON.stringify(w)); window.__bzg.R.render(); }); console.log(`  checkShell ${tag} ${mode}: ${JSON.stringify(sf)}`);
    ok(!sf.length, `checkShell (${mode}): Bee's top bar, tabs, home and drawer — ${sf.join('; ')}`);
    if (mode === 'dark') await shot('02b-home-dark');
  }
  await page.evaluate(() => { document.documentElement.setAttribute('data-mode', 'light'); window.__bzg.R.render(); });
  ok(await page.evaluate(() => [...document.querySelectorAll('.btn.primary, .bz-btn:not(.out)')].filter((b) => b.offsetParent).length) === 1, 'home has exactly one primary button');
  ok(await page.evaluate(() => { const b = document.querySelector('[data-bz=continue]'); return b && b.getBoundingClientRect().bottom <= innerHeight; }), 'Continue is above the fold');
  ok(await page.evaluate(() => { const b = document.querySelector('[data-bz=continue]'); return b.getAttribute('href') === '#/continue'; }), 'Continue opens the next station');
  ok(await page.locator('.hm-ways, .hm-three').count() === 0 && await page.evaluate(() => ['greet', 'ring', 'hour', 'next', 'second', 'tip', 'quote'].every((x) => document.querySelector(`[data-bz=home] [data-bz=${x}]`)) && document.querySelectorAll('[data-bz=home] .bz-card, [data-bz=home] .bz-journey').length === 7), 'home is Bee’s three rows: greeting · ring · hour, two journeys, tip · quote — nothing else');
  ok(await page.locator('[data-bz=hive]').getAttribute('href') === 'https://aayuvis.github.io/Bizzing_Schedule/', 'the top bar goes back to the Hive');
  /* the activity feed (O3): an active minute is written for this child */
  for (let i = 0; i < 6; i++) { await page.keyboard.press('Shift'); await page.clock.runFor(15000); }
  ok(await page.evaluate(() => { const f = JSON.parse(localStorage.getItem('bizzing.activity') || '{}'); return (f.s || []).some((x) => x.a === 'geography' && x.who === 'Ahana' && x.m >= 1); }), 'bizzing.activity gets an active minute for this child');

  await nav('atlas'); await page.waitForSelector('.map-board');
  await page.waitForTimeout(400); await shot('03-atlas'); await noSideways('atlas');
  ok(await page.locator('.map-pin').count() === 10, 'ten places on the atlas');
  /* N12: no two pins or names on the island touch (the phone's labels once read "als", "ers") */
  ok(await page.evaluate(() => { const rs = [...document.querySelectorAll('.map-pin .mp-g, .map-pin .mp-t')].filter((e) => e.offsetParent && getComputedStyle(e).display !== 'none').map((e) => ({ e, r: e.getBoundingClientRect() }));
    const hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
    const board = document.querySelector('.map-board').getBoundingClientRect();
    for (let i = 0; i < rs.length; i++) { if (rs[i].r.left < board.left - 1 || rs[i].r.right > board.right + 1) return false; for (let j = i + 1; j < rs.length; j++) if (rs[i].e.closest('.map-pin') !== rs[j].e.closest('.map-pin') && hit(rs[i].r, rs[j].r)) return false; }
    return rs.length >= 10; }), 'atlas: no pin or name overlaps another, and none is cut off by the map’s edge');
  ok(await page.evaluate(() => { const b = document.querySelector('.map-board').getBoundingClientRect(); return b.left >= -1 && b.right <= innerWidth + 1 && [...document.querySelectorAll('.map-pin .mp-g')].every((g) => { const r = g.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; }); }), 'atlas: the whole island is on screen — no pin cut off at the screen’s edge (the audit’s "ne Street", "Latitu")');
  await page.click('.map-pin[data-arg=compass]'); await page.waitForSelector('.world-page');
  await page.waitForTimeout(300); await shot('04-world');
  await page.click('[data-act=openStop]'); await page.waitForSelector('.stop-page');
  await shot('05-stop');
  ok(await page.locator('[data-act=learned]').count() === 0, 'E9: no star for saying "I’ve read it" — stars come only from answers');

  // a drill, answered right by keyboard: ★★★ and station 1 done
  await page.click('[data-act=startDrill]'); await page.waitForSelector('.qcard');
  for (let i = 0; i < 12; i++) {
    const s = await S(); if (!s.run || s.run.over) break;
    if (i === 0) {
      await shot('06-question');
      ok(await page.locator('.qcard .read-btn[data-act=read]').count() === 1, 'every question has a 🔊 read-it-to-me button');
      await page.click('.qcard .read-btn[data-act=read]'); await page.waitForTimeout(80);
      const said = await page.evaluate(() => window.__spoken.at(-1) || '');
      ok(said.includes(s.run.q.text) && !said.includes('🔊') && (s.run.q.kind !== 'mc' || said.includes(s.run.q.opts[0])), `🔊 reads the question${s.run.q.kind === 'mc' ? ' and its answers' : ''} in the device voice`);
    }
    if (s.run.q.kind === 'mc') await page.keyboard.press(String(s.run.q.opts.indexOf(s.run.q.ans) + 1));
    await page.waitForTimeout(1700);
  }
  ok((await S()).run.over, 'the drill finishes');
  ok(await page.evaluate(() => window.__bzg.R.h.kids[0].stops['eight-points'].stars) === 3, 'ten right earns three stars');
  await shot('07-end');
  /* I4/J1: the first medal spins in once, with what earned it; coins only from the standard events */
  ok(await page.locator('.mp-card').count() === 1 && (await page.locator('.mp-card').innerText()).includes('First stop'), 'passing a first stop celebrates the "First stop" medal');
  await shot('07b-medal');
  await page.keyboard.press('Enter'); await page.waitForTimeout(150);
  ok(await page.locator('.mp-card').count() === 0, 'Enter puts the medal on the shelf');
  ok(await page.evaluate(() => { const w = JSON.parse(localStorage.getItem('bizzing.wallet') || '{}'), me = (w.kids || {}).ahana; return me && me.coins > 0 && me.ledger.every((x) => x.a === 'geography' && ['answer', 'stop', 'mastery', 'contest'].includes(x.why) && [1, 5, 10, 20].includes(x.n)); }), 'coins are earned only by the standard events, at the standard amounts');
  await page.keyboard.press('Enter');

  // a map question: find a country, by a real tap on its shape
  await page.evaluate(() => { const { R, go } = window.__bzg; R.run = null; });
  await page.evaluate(() => window.__bzg.fire('openStop', 'cap-europe'));
  await page.waitForSelector('.stop-page');
  await page.evaluate(() => { const R = window.__bzg.R; R.h.parent.tester = false; });
  await page.evaluate(() => { const R = window.__bzg.R; R.run = { kind: 'drill', title: 'Map test', items: [{ kind: 'map', text: 'Tap France on the map.', ok: ['FR'], view: [-25, 34, 45, 72], why: '', target: 'FR', stop: 'cap-europe', lv: 2 }, { kind: 'map', text: 'Tap Spain on the map.', ok: ['ES'], view: [-25, 34, 45, 72], why: '', target: 'ES', stop: 'cap-europe', lv: 2 }], i: 0, results: [], fb: null, over: false, stop: 'cap-europe', lv: 2 }; window.__bzg.go('run'); });
  ok(await page.evaluate(() => document.documentElement.classList.contains('sc-calm')), 'a quiz run holds the scene still (calm)');
  await page.waitForSelector('.gmap.tap');
  await page.waitForTimeout(300); await shot('08-mapq');
  // France's shape includes overseas parts; tap inside the European part via the projection
  const pt = await inside(page, '.gmap path[data-cc=FR]');
  ok(pt, 'France is on screen and tappable');
  if (pt) { if (phone) await page.touchscreen.tap(pt[0], pt[1]); else await page.mouse.click(pt[0], pt[1]); }
  await page.waitForTimeout(200);
  let s = await S();
  ok(s.run.fb && s.run.fb.right && s.run.fb.given === 'FR', `a tap on France answers France (got ${s.run.fb && s.run.fb.given})`);
  await page.waitForTimeout(1200);
  // the same by keyboard: focus the map, move the cross onto Spain, Enter
  await page.focus('.gmap.tap');
  const es = await inside(page, '.gmap path[data-cc=ES]');
  const kb = await page.evaluate(([sx, sy]) => {
    const svg = document.querySelector('.gmap svg'), [x, y, w, h] = svg.getAttribute('viewBox').split(' ').map(Number);
    const p = svg.createSVGPoint(); p.x = sx; p.y = sy; const q = p.matrixTransform(svg.getScreenCTM().inverse());
    return { cx: x + w / 2, cy: y + h / 2, tx: q.x, ty: q.y, step: 0.025 * w };
  }, es);
  const nx = Math.round((kb.tx - kb.cx) / kb.step), ny = Math.round((kb.ty - kb.cy) / kb.step);
  for (let i = 0; i < Math.abs(nx); i++) await page.keyboard.press(nx > 0 ? 'ArrowRight' : 'ArrowLeft');
  for (let i = 0; i < Math.abs(ny); i++) await page.keyboard.press(ny > 0 ? 'ArrowDown' : 'ArrowUp');
  await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  s = await S();
  ok(s.run.fb && s.run.fb.given === 'ES', `the keyboard cross + Enter answers Spain (got ${s.run.fb && s.run.fb.given})`);
  await page.waitForTimeout(1600);
  await page.evaluate(() => { window.__bzg.R.run = null; window.__bzg.go('road'); });

  await page.waitForSelector('.jsteps'); await shot('09-road'); await noSideways('road');
  ok(await page.locator('.jstep.done').count() >= 1, 'the road shows station 1 done');
  ok(await page.locator('.jglance .jg').count() === 10 && (await page.locator('.atlas-seg [aria-selected=true]').innerText()).trim() === 'Your journey', 'Your journey is a tab of the Atlas, with all ten levels at a glance');
  ok(await page.locator(phone ? '[data-bz=tabbar] [aria-current=page]' : '[data-bz=tabs] [aria-current=page]').getAttribute('href') === '#/atlas', 'the Atlas tab stays lit on the journey');
  // Expeditions: ten, each a painted board with a camp per part; a part's steps; a project built IN the app
  await nav('exp'); await page.waitForSelector('.crs-grid');
  ok(await page.locator('.crs-card').count() === 10, 'Expeditions offers ten');
  await shot('23-expeditions'); await noSideways('expeditions');
  await page.click('[data-act=expOpen][data-arg="first-maps"]'); await page.waitForSelector('.crs-board');
  ok(await page.locator('.crs-camp').count() === 6, 'the board has a camp for each part and the finish');
  ok(await page.locator('.crs-step').count() === 5, 'a part shows its five steps: learn, learn, practise, test, make');
  await shot('24-expedition'); await noSideways('expedition');
  await page.click('.crs-go [data-act=expDay]'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => window.__bzg.R.ui.nav) === 'stop', 'day 1 opens its lesson');
  await page.evaluate(() => window.__bzg.go('expd', 'first-maps')); await page.waitForSelector('.crs-steps');
  ok(await page.locator('.crs-step.done').count() === 1, 'and is ticked');
  await page.click('[data-act=expDay][data-arg="first-maps|3"]'); await page.waitForSelector('.qcard');
  ok(await page.evaluate(() => window.__bzg.R.run.kind) === 'sprint', 'a practice day is a quiz run');
  await page.evaluate(() => { window.__bzg.R.run = null; window.__bzg.go('expd', 'first-maps'); });
  await page.waitForSelector('.crs-steps');
  await page.click('[data-act=expDay][data-arg="first-maps|5"]'); await page.waitForSelector('.pj-page');
  ok(await page.locator('[data-act=projDone]').isDisabled(), 'an empty project cannot be finished');
  // build the room by KEYBOARD: 2 = wall along the top row, 3 = bed, 4 = table, then a door by TOUCH
  await page.focus('.pj-stage');
  await page.keyboard.press('2');
  for (let x = 0; x < 10; x++) { await page.keyboard.press(' '); await page.keyboard.press('ArrowRight'); }
  await page.keyboard.press('ArrowDown'); await page.keyboard.press(' '); await page.keyboard.press('ArrowLeft'); await page.keyboard.press(' ');
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('3'); await page.keyboard.press(' '); await page.keyboard.press('ArrowLeft'); await page.keyboard.press(' ');
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('4'); await page.keyboard.press(' ');
  await page.click('.pj-tools [data-arg="tool|door"]');
  const cell = await page.locator('.pj-cell').nth(40).boundingBox();
  if (phone) await page.touchscreen.tap(cell.x + cell.width / 2, cell.y + cell.height / 2); else await page.mouse.click(cell.x + cell.width / 2, cell.y + cell.height / 2);
  await page.waitForTimeout(150);
  ok(await page.locator('.pj-goals li.ok').count() === 4, `the checklist ticks itself as the room is built (${await page.locator('.pj-goals li.ok').count()} of 4)`);
  await shot('25-project'); await noSideways('project');
  await page.click('[data-act=projDone]'); await page.waitForSelector('.crs-board');
  ok(await page.evaluate(() => !!window.__bzg.R.h.kids[0].exp['first-maps'].art['fm1.project']), 'finishing saves what was made');
  ok(await page.locator('.crs-gal .crs-gi').count() === 1, 'and it appears in the gallery');
  ok((await page.locator('.mp-card').innerText().catch(() => '')).includes('Maker'), 'the first thing made earns the Maker medal');
  await page.click('[data-act=medalOk]');
  await page.evaluate(() => { window.__bzg.R.run = null; window.__bzg.go('home'); });

  /* L4: on a phone a find-one-country question starts on that country's continent. L5: the same
     question as a list of six named places, answerable by number keys */
  await page.evaluate(() => { const R = window.__bzg.R; R.run = { kind: 'drill', title: 'List test', items: [{ kind: 'map', text: 'Tap Belgium on the map.', ok: ['BE'], why: '', target: 'BE', stop: 'cap-europe', lv: 2 }], i: 0, results: [], fb: null, over: false, stop: 'cap-europe', lv: 2 }; window.__bzg.go('run'); });
  await page.waitForSelector('.gmap.tap');
  const vbw = await page.evaluate(() => +document.querySelector('.qcard .gmap svg').getAttribute('viewBox').split(' ')[2]);
  ok(phone ? vbw < 500 : vbw >= 990, phone ? `on a phone the map opens on Europe, not the whole world (${Math.round(vbw)} of 1000 wide)` : 'on a desktop the whole world shows');
  await page.click('[data-act=listMode]'); await page.waitForSelector('.map-list');
  const names = await page.locator('.map-list .opt span').allInnerTexts();
  ok(names.length === 4 && names.filter((n) => n === 'Belgium').length === 1 && new Set(names).size === 4, `list mode offers four places, Belgium once (${names.join(', ')})`);
  await page.keyboard.press(String(names.indexOf('Belgium') + 1)); await page.waitForTimeout(150);
  ok(await page.evaluate(() => window.__bzg.R.run.fb && window.__bzg.R.run.fb.right), 'a number key answers from the list');
  /* E11: a continent question ("Tap Africa": every African country is right) once listed ONE option — the answer */
  await page.evaluate(() => { const R = window.__bzg.R, af = ['DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CD', 'CG', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'ZM', 'ZW'];
    R.run = { kind: 'drill', title: 'List test', items: [{ kind: 'map', text: 'Tap Africa on the map.', ok: af, why: '', stop: 'find-continent', lv: 1 }], i: 0, results: [], fb: null, over: false, stop: 'find-continent', lv: 1 }; window.__bzg.go('run'); });
  await page.waitForSelector('.map-list');
  const contList = await page.evaluate(() => [...document.querySelectorAll('.map-list .opt')].map((b) => b.dataset.arg));
  ok(contList.length === 4 && await page.evaluate((ids) => ids.filter((id) => window.__bzg.R.run.items[0].ok.includes(id)).length, contList) === 1, `list mode on "Tap Africa": four places, exactly one of them in Africa (${contList.join(', ')})`);
  await page.evaluate(() => { window.__bzg.R.run = null; localStorage.setItem('bzg_device', JSON.stringify({ ...JSON.parse(localStorage.getItem('bzg_device') || '{}'), listMode: false })); });

  /* N12: the compass rose beside a plan is whole — it was drawn off its centre and lost NE, E and SE */
  let roseOk = null;
  for (let t = 0; t < 8 && roseOk == null; t++) {
    await page.evaluate(() => { window.__bzg.R.run = null; window.__bzg.fire('startDrill', 'eight-points'); });
    roseOk = await page.evaluate(() => { const R = window.__bzg.R, i = R.run.items.findIndex((q) => (q.html || '').includes('plan-rose')); if (i < 0) return null; R.run.i = i; R.render();
      const g = document.querySelector('.plan-rose'), sv = g && g.closest('svg'); if (!g) return false; const a = g.getBoundingClientRect(), b = sv.getBoundingClientRect();
      return a.width > 40 && a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1; });
  }
  ok(roseOk === true, 'compass drills: the rose beside the plan is whole inside its drawing');
  await page.evaluate(() => { window.__bzg.R.run = null; window.__bzg.go('home'); });
  /* Home: the place of the hour shows its painting; today's place is asked right here, once an hour */
  ok(await page.evaluate(async () => { const m = /url\("?([^")]+art\/pc-[^")]+)/.exec(getComputedStyle(document.querySelector('[data-bz=hour]')).backgroundImage); if (!m) return false; const r = await fetch(m[1]); return r.ok && (r.headers.get('content-type') || '').includes('image'); }), 'the place-of-the-hour card shows its painting (and the picture is really there)');
  ok(await page.locator('.hourq img.hourq-art').count() === 1 && await page.locator('.hourq .opt').count() === 4, 'today’s place is a question on Home: the painting and four countries');
  ok(/stars · \d+ capitals known/.test(await page.locator('.h-prog').innerText()), 'the ring card says stars and capitals known');
  { const right = await page.evaluate(() => window.__bzg.hourRight());
    await page.click(`.hourq .opt[data-arg="${right}"]`); await page.waitForSelector('.hourq .fb.good');
    ok(await page.locator('.hourq .opt[disabled]').count() === 4, 'a right answer holds, says the place, and the question is answered for the hour'); }
  /* the place of the hour opens THAT place (it opened the game's menu) */
  await page.waitForSelector('[data-bz=hour]');
  const placeId = (await page.locator('[data-bz=hour]').getAttribute('href')).split('/').pop();
  await page.click('[data-bz=hour]'); await page.waitForSelector('.wo-hud');
  ok(await page.evaluate((id) => { const g = window.__bzg.R.ui.lib.geoguess.g; return !!g && g.place && g.cards.length === 1 && g.cards[0].id === id; }, placeId), 'the place-of-the-hour card opens that very place');
  await page.evaluate(() => { window.__bzg.R.ui.lib.geoguess.g = null; });
  /* a link to a tool that does not exist lands on the Library and the address says so */
  await page.evaluate(() => { location.hash = '#/lib/nope'; }); await page.waitForTimeout(200);
  ok(await page.evaluate(() => location.hash === '#/library' && window.__bzg.R.ui.nav === 'library'), '#/lib/<unknown> becomes #/library, not a bad URL on a good page');

  // every Library tool renders
  await nav('library'); await page.waitForSelector('.lib-grid');
  await page.waitForTimeout(300); await shot('10-library');
  for (const id of ['geoguess', 'capitals', 'states', 'landmarks', 'time', 'flags', 'explorer', 'dictionary']) {
    await page.evaluate((id) => window.__bzg.go('lib', id), id);
    await page.waitForSelector(`.tool-${id}`); await page.waitForTimeout(250);
    ok(!(await page.locator('.tool-page').innerText()).includes('Something went wrong'), `${id} renders`);
    await shot(`11-lib-${id}`); await noSideways(`library ${id}`);
  }
  // Landmarks: filter by continent, tap a country to see only its landmarks
  await page.evaluate(() => window.__bzg.go('lib', 'landmarks')); await page.waitForSelector('.t-lm-grid');
  ok(await page.locator('.t-lm-tile').count() >= 120, 'the Landmarks shelf shows at least 120 landmarks');
  await page.click('[data-arg="landmarks|cont|Asia"]'); await page.waitForTimeout(200);
  const inA = await inside(page, '.tool-landmarks .gmap path[data-cc=IN]');
  if (phone) await page.touchscreen.tap(inA[0], inA[1]); else await page.mouse.click(inA[0], inA[1]);
  await page.waitForTimeout(200);
  const lmNames = await page.locator('.t-lm-tile i').allInnerTexts();
  ok(lmNames.length >= 10 && lmNames.every((t) => t.startsWith('India')), `tapping India shows only India’s landmarks (${lmNames.length})`);
  await shot('17-landmarks-india'); await noSideways('landmarks filtered');
  // Earth Through Time: a continent road draws soft zones (no borders) until "today"; a dot is a place to visit
  await page.evaluate(() => window.__bzg.go('lib', 'time'));
  await page.click('[data-arg="time|t|Asia"]'); await page.waitForSelector('.tool-time .gmap .zone');
  await page.evaluate(() => window.__bzg.fire('lib', 'time|i|3')); await page.waitForTimeout(150);
  ok(await page.locator('.tool-time .gmap.noborders').count() === 1, 'an ancient age draws no modern borders');
  ok(await page.locator('.tool-time .gmap .zone').count() >= 3, 'the age of empires shows its soft zones');
  await page.locator('.tool-time .gmap').scrollIntoViewIfNeeded();
  const site = await page.locator('.tool-time .gmap .pin.site').first().boundingBox();
  if (phone) await page.touchscreen.tap(site.x + site.width / 2, site.y + site.height / 2); else await page.mouse.click(site.x + site.width / 2, site.y + site.height / 2);
  await page.waitForTimeout(150);
  ok(await page.locator('.t-hist-site').count() === 1, 'tapping a dot opens that place');
  await shot('19-time-asia'); await noSideways('time asia');
  await page.click('[data-arg="time|t|Oceania"]'); await page.evaluate(() => window.__bzg.fire('lib', 'time|i|3')); await page.waitForTimeout(150);
  ok(await page.locator('.tool-time .gmap[data-rot]').count() === 1, 'Oceania’s map is centred on the Pacific');
  await page.locator('.tool-time .gmap').scrollIntoViewIfNeeded(); await shot('20-time-oceania');
  const last = await page.locator('.t-dots button').count();
  await page.evaluate((n) => window.__bzg.fire('lib', `time|i|${n}`), last - 1); await page.waitForTimeout(150);
  ok(await page.locator('.tool-time .gmap.noborders').count() === 0 && await page.locator('.tool-time .gmap .zone').count() === 0, 'today shows real borders and no zones');
  await page.click('[data-arg="time|where"]'); await page.waitForSelector('.qcard');
  ok(await page.evaluate(() => window.__bzg.R.run.items.length) === 10, 'the which-continent quiz asks ten');
  await page.evaluate(() => { window.__bzg.R.run = null; });
  // Dictionary: a topic, then a quiz
  await page.evaluate(() => window.__bzg.go('lib', 'dictionary')); await page.waitForSelector('.t-dict');
  ok(await page.locator('.t-dict dt').count() >= 300, 'the dictionary lists at least 300 words');
  /* N12: the words sit on a card, never on the moving scene, and read at AA */
  ok(await page.evaluate(() => { const dd = document.querySelector('.t-dict dd'), card = dd && dd.closest('.card'); if (!card) return false;
    const rgb = (c) => (c.match(/[\d.]+/g) || []).map(Number), lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const bg = rgb(getComputedStyle(card).backgroundColor); if (bg.length > 3 && bg[3] < 0.95) return false;
    const a = lum(rgb(getComputedStyle(dd).color)), b = lum(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 4.5; }), 'dictionary: the words are on an opaque card and pass AA');
  await page.click('[data-arg="dictionary|topic|water"]'); await page.waitForTimeout(150);
  await shot('18-dictionary-water');
  await page.click('[data-arg="dictionary|quiz"]'); await page.waitForSelector('.qcard');
  ok(await page.evaluate(() => window.__bzg.R.run.items.length) === 10, 'the dictionary quiz asks ten');
  await page.evaluate(() => { window.__bzg.R.run = null; });

  // Where on Earth?: the picture fills the stage, the map is an inset; open it, pin by tap and by drag, confirm
  await page.evaluate(() => window.__bzg.go('lib', 'geoguess'));
  await page.click('[data-arg="geoguess|start"]'); await page.waitForSelector('.wo');
  ok(await page.evaluate(() => window.__bzg.R.ui.lib.geoguess.g.cards.every((c) => c.k === 'painted')), 'with no Maps key built in, a round is all paintings');
  { const st = await page.locator('.wo').boundingBox(), m = await page.locator('.wo-map .gmap').boundingBox();
    ok(m.width * m.height < st.width * st.height * 0.2, `the map starts as a small inset (${Math.round(m.width)}×${Math.round(m.height)} on a ${Math.round(st.width)}×${Math.round(st.height)} picture)`);
    const vh = await page.evaluate(() => innerHeight);
    ok(st.y + st.height <= vh + 2 && st.height >= vh * 0.4, `the picture is the screen and fits on it (${Math.round(st.y)}+${Math.round(st.height)} of ${vh})`); }
  await page.waitForTimeout(300); await shot('12a-where-stage');
  await page.click('.wo-open'); await page.waitForSelector('.wo.big .gmap.tap');
  ok(await page.evaluate(() => document.activeElement && document.activeElement.classList.contains('gmap')), 'opening the map puts the keyboard on it');
  ok(await page.locator('.wo-guess').isDisabled(), 'Guess waits for a pin');
  const g = await page.locator('.wo-map .gmap').boundingBox();
  if (phone) await page.touchscreen.tap(g.x + g.width * 0.6, g.y + g.height * 0.4); else await page.mouse.click(g.x + g.width * 0.6, g.y + g.height * 0.4);
  await page.waitForTimeout(200);
  const p1 = await page.evaluate(() => window.__bzg.R.ui.lib.geoguess.g.guess);
  ok(!!p1, 'a tap drops the pin');
  if (!phone) {   // drag the pin somewhere else
    const pin = await page.locator('.wo-map .pin.guess').boundingBox();
    await page.mouse.move(pin.x + pin.width / 2, pin.y + pin.height / 2); await page.mouse.down();
    await page.mouse.move(g.x + g.width * 0.3, g.y + g.height * 0.6, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(200);
    const p2 = await page.evaluate(() => window.__bzg.R.ui.lib.geoguess.g.guess);
    ok(p2 && Math.abs(p2[1] - p1[1]) > 20, `dragging the pin moves it (${p1.map(Math.round)} → ${p2 && p2.map(Math.round)})`);
  }
  ok(!(await page.locator('.wo-guess').isDisabled()), 'with a pin, Guess is ready');
  await shot('12b-where-map');
  await page.keyboard.press('g'); await page.waitForTimeout(300);
  ok(await page.locator('.t-geo-res').count() === 1, 'G guesses and shows the answer and clues');
  await shot('12-geoguess');
  /* E2: against the clock — the pin on the map is the guess when time runs out, or the card scores nothing */
  await page.evaluate(() => { window.__bzg.R.ui.lib.geoguess.g = null; window.__bzg.fire('lib', 'geoguess|timed'); });
  await page.waitForSelector('.wo-clock');
  ok(/\d+s/.test(await page.locator('.wo-clock').innerText()), 'a timed round shows its clock');
  await page.evaluate(() => { window.__bzg.R.ui.lib.geoguess.g.deadline = Date.now() - 1; });
  await page.waitForTimeout(900);
  ok(await page.evaluate(() => { const g = window.__bzg.R.ui.lib.geoguess.g; return !!g.done[0] && g.done[0].late && g.done[0].pts === 0; }), 'time out with no pin scores nothing — never a random guess');
  ok(await page.locator('.wo-res [data-count]').count() === 1, 'the score counts up');
  await page.evaluate(() => { window.__bzg.R.ui.lib.geoguess.g = null; });
  // State capitals: India's map is the Survey of India depiction from Bizzing India; tap a state
  await page.evaluate(() => window.__bzg.go('lib', 'states'));
  await page.click('[data-arg="states|c|IN"]'); await page.waitForSelector('.reg-IN');
  const rj = await inside(page, '.reg-IN path[data-cc="IN-RJ"]');
  if (phone) await page.touchscreen.tap(rj[0], rj[1]); else await page.mouse.click(rj[0], rj[1]);
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => window.__bzg.R.ui.lib.states.sel) === 'IN-RJ', 'tapping Rajasthan selects it');
  await page.waitForSelector('#t-states-ans');
  ok(await page.evaluate(() => { const b = document.querySelector('.t-ask.pop').getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight && Math.abs((b.top + b.bottom) / 2 - innerHeight / 2) < 24 && Math.abs((b.left + b.right) / 2 - innerWidth / 2) < 24; }), 'the capital card pops up centred on the screen, not below the fold');
  ok(!(await page.locator('.t-ask').innerText()).includes('Jaipur'), 'the capital is not shown before the child answers');
  await page.fill('#t-states-ans', 'jaipur'); await page.press('#t-states-ans', 'Enter');
  await page.waitForTimeout(150);
  ok(await page.evaluate(() => window.__bzg.R.ui.lib.states.ask.state) === 'right', 'typing “jaipur” + Enter is right');
  ok(await page.evaluate(() => (window.__bzg.R.h.kids[0].lib.states.box || {})['IN-RJ']) === 1, 'a right state capital climbs its box');
  ok(/\b0\s*\/ 36 known/.test(await page.locator('.t-cap-bar').innerText()), 'State Capitals shows a known count (one right answer is not yet known)');
  await shot('13-states-india');
  ok(await page.locator('.reg-IN path.ct').count() === 36, 'India draws 36 states and union territories');

  // the four newer countries: each draws every state, and a tap asks for its capital
  for (const [c, n, id, cap] of [['BR', 27, 'BR-BA', 'Salvador'], ['MX', 32, 'MX-JAL', 'Guadalajara'], ['DE', 16, 'DE-BY', 'Munich'], ['NG', 37, 'NG-KN', 'Kano']]) {
    if (await page.locator('.t-ask.pop').count()) { await page.keyboard.press('Escape'); await page.waitForTimeout(100); }   // the centred card covers the map's middle: close it, as a child would
    await page.click(`[data-arg="states|c|${c}"]`); await page.waitForSelector(`.reg-${c}`);
    ok(await page.locator(`.reg-${c} path.ct`).count() === n, `${c} draws ${n} states`);
    const pt = await inside(page, `.reg-${c} path[data-cc="${id}"]`);
    if (phone) await page.touchscreen.tap(pt[0], pt[1]); else await page.mouse.click(pt[0], pt[1]);
    await page.waitForSelector('#t-states-ans');
    ok(await page.evaluate(() => (window.__bzg.R.ui.lib.states.ask || {}).state == null), `${c}: the tap that opens the card does not also press a button on it (a phone's follow-up click)`);
    await page.fill('#t-states-ans', cap); await page.press('#t-states-ans', 'Enter'); await page.waitForTimeout(120);
    ok(await page.evaluate(() => window.__bzg.R.ui.lib.states.ask.state) === 'right', `${c}: ${cap} is right for ${id}`);
    await shot(`16-states-${c}`); await noSideways(`states ${c}`);
  }

  // Country Capitals: tap a country → a typing box; wrong holds; 4 choices; reveal
  await page.evaluate(() => window.__bzg.go('lib', 'capitals'));
  await page.click('[data-arg="capitals|cont|South America"]'); await page.waitForTimeout(200);
  const br = await inside(page, '.gmap path[data-cc=BR]');
  if (phone) await page.touchscreen.tap(br[0], br[1]); else await page.mouse.click(br[0], br[1]);
  await page.waitForSelector('#t-capitals-ans');
  ok(await page.evaluate(() => window.__bzg.R.ui.lib.capitals.sel) === 'BR', 'tapping Brazil asks for its capital');
  ok(await page.evaluate(() => { const b = document.querySelector('.t-ask.pop').getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight && Math.abs((b.top + b.bottom) / 2 - innerHeight / 2) < 24 && Math.abs((b.left + b.right) / 2 - innerWidth / 2) < 24; }), 'the capital card pops up centred on the screen, not below the fold');
  await page.fill('#t-capitals-ans', 'Rio'); await page.press('#t-capitals-ans', 'Enter'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => window.__bzg.R.ui.lib.capitals.ask.state) === 'wrong' && !(await page.locator('.t-ask').innerText()).includes('Brasília'), 'a wrong answer holds without giving it away');
  await page.waitForTimeout(400);   // a person's pause: the card's buttons ignore the first 0.4 s (a phone's ghost click)
  await page.click('[data-arg="capitals|four"]'); await page.waitForSelector('.t-ask-opts');
  ok(await page.locator('.t-ask-opts .opt').count() === 4, 'four choices appear');
  await shot('15-capitals-ask');
  await page.click('[data-arg="capitals|reveal"]'); await page.waitForTimeout(150);
  ok((await page.locator('.t-ask').innerText()).includes('Brasília'), 'reveal shows the answer');
  ok(await page.evaluate(() => (window.__bzg.R.h.kids[0].lib.capitals.box || {}).BR) === 0, 'a revealed capital is not counted as known');
  await noSideways('capitals ask');
  await page.keyboard.press('Escape'); await page.waitForTimeout(120);
  ok(await page.locator('.t-ask.pop').count() === 0, 'Esc closes the card');
  // a right pick from the four choices counts toward "known"
  const ar = await inside(page, '.gmap path[data-cc=AR]');
  if (phone) await page.touchscreen.tap(ar[0], ar[1]); else await page.mouse.click(ar[0], ar[1]);
  await page.waitForSelector('#t-capitals-ans'); await page.waitForTimeout(400);
  await page.click('[data-arg="capitals|four"]'); await page.waitForSelector('.t-ask-opts');
  await page.click('.t-ask-opts .opt:has-text("Buenos Aires")'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => window.__bzg.R.ui.lib.capitals.ask.state) === 'picked', 'picking Buenos Aires is right');
  ok(await page.evaluate(() => (window.__bzg.R.h.kids[0].lib.capitals.box || {}).AR) === 1, 'a right pick climbs the capital’s box');

  // WORLDS (§7): Settings → Look; worlds 1–2 open, 3–6 locked until coins or the family plan; a choice restyles page AND map
  await page.evaluate(() => window.__bzg.go('home')); await page.waitForSelector('[data-bz=menu]');
  ok(await page.evaluate(() => document.documentElement.dataset.theme) === 'atlas', 'a new child starts in Old Atlas');
  ok(await page.locator('#scene .scn').count() >= 40 && !(await page.evaluate(() => document.documentElement.classList.contains('sc-calm'))), 'home shows a full, moving scene');
  await page.evaluate(() => window.__bzg.go('settings')); await page.waitForSelector('.world-thumb[aria-checked="true"]');
  ok(await page.locator('.world-thumb').count() === 6 && await page.locator('.world-thumb.locked').count() === 4, 'six worlds: two open to everyone, four locked');
  ok(await page.evaluate(() => [...document.querySelectorAll('.set-sec h2')].map((h) => h.innerText.trim()).join('|')) === 'Me|Sound & music|Look|Comfort|Grown-ups', 'Settings has the five sections in the family order');
  await shot('29-settings'); await noSideways('settings'); await targets('settings');
  const seaBefore = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--sea').trim());
  await page.click('#theme-ocean'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.documentElement.dataset.theme) === 'ocean' && await page.evaluate(() => window.__bzg.R.h.kids[0].prefs.theme) === 'ocean', 'tapping Ocean Deep applies it and saves it on the child');
  ok(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--sea').trim()) !== seaBefore, 'the map’s sea takes the world’s colour');
  await page.focus('#theme-ocean'); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => document.documentElement.dataset.theme) === 'atlas', 'the arrow keys move between the OPEN worlds (keyboard)');
  await page.evaluate(() => window.__bzg.fire('theme', 'jungle')); await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.documentElement.dataset.theme) === 'atlas', 'a locked world cannot be chosen');
  /* a world opened with 240 Bizzing coins, through the family engine */
  await page.evaluate(() => { const w = JSON.parse(localStorage.getItem('bizzing.wallet')); w.kids.ahana.coins = 250; localStorage.setItem('bizzing.wallet', JSON.stringify(w)); window.__bzg.R.ui.shopTab = 'worlds'; window.__bzg.go('shop'); });
  await page.click('[data-act=buyWorld][data-arg="3"]'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => window.__bzg.R.h.kids[0].worlds.includes(3) && JSON.parse(localStorage.getItem('bizzing.wallet')).kids.ahana.coins === 10), 'opening world 3 costs exactly 240 coins and is recorded on the child');
  await page.evaluate(() => window.__bzg.fire('theme', 'jungle')); await page.waitForTimeout(250);
  ok(await page.locator('#scene .sc-jungle').count() === 1 && await page.locator('#scene .s-plate').count() === 1 && await page.locator('#scene .s-shellyloop').count() === 1, 'the scene follows the world: its painted plate and Shelly’s idle loop (Rainforest now)');
  /* the family plan (a grown-up's flag until the family server) opens the rest */
  await page.evaluate(() => { window.__bzg.R.h.parent.plan = 'family'; window.__bzg.go('home'); });
  for (const t of ['atlas', 'ocean', 'jungle', 'desert', 'aurora', 'orbit']) for (const mode of ['light', 'dark']) {
    await page.evaluate(([t, m]) => { document.documentElement.setAttribute('data-mode', m); window.__bzg.fire('theme', t); scrollTo(0, 0); }, [t, mode]); await page.waitForTimeout(200);
    ok(await page.evaluate((t) => document.documentElement.dataset.theme === t, t), `world ${t} opens with the family plan`);
    const plate = await page.evaluate((m) => { const d = document.querySelector(m === 'dark' ? '.s-plate-night' : '.s-plate-day'); return d && getComputedStyle(d).display !== 'none' ? d.style.backgroundImage : ''; }, mode);
    ok(plate.includes(mode === 'dark' ? '/wn-' : '/wd-'), `${t} ${mode}: a ${mode === 'dark' ? 'night' : 'day'} painting, never a daylight plate on a dark page (${plate})`);
    /* AA on the words over the plate: the page head's pill */
    await page.evaluate(() => window.__bzg.go('atlas')); await page.waitForTimeout(120);
    const cr = await page.evaluate(() => { const h = document.querySelector('.phead h1'), p = h.closest('.phead-t'); const rgb = (c) => (c.match(/[\d.]+/g) || []).map(Number);
      const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const paper = rgb(getComputedStyle(document.documentElement).getPropertyValue('--paper').trim().replace(/^#(..)(..)(..)$/, (_, a, b, c) => `rgb(${parseInt(a, 16)},${parseInt(b, 16)},${parseInt(c, 16)})`));
      const bgA = rgb(getComputedStyle(p).backgroundColor)[3] ?? 1, a = lum(rgb(getComputedStyle(h).color)), b = lum(paper);
      return { r: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), bgA }; });
    ok(cr.r >= 4.5 && cr.bgA >= 0.8, `${t} ${mode}: the heading over the living world passes AA (${cr.r.toFixed(1)}:1 on a ${Math.round(cr.bgA * 100)}% paper pill)`);
    if (['desert', 'aurora', 'orbit'].includes(t) || mode === 'dark') await shot(`21-world-${t}-${mode}`);
    await page.evaluate(() => window.__bzg.go('home'));
  }
  await page.evaluate(() => { document.documentElement.setAttribute('data-mode', 'light'); window.__bzg.R.h.parent.plan = 'free'; window.__bzg.fire('theme', 'atlas'); });
  /* §7: the world's life pauses when the page is hidden, and its music with it */
  await page.mouse.click(5, 5);
  ok(await page.evaluate(() => window.__bzg.music().playing && window.__bzg.music().loop === 'home'), 'music: home has its own loop, playing after a tap');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  ok(await page.evaluate(() => document.documentElement.classList.contains('bz-hidden') && getComputedStyle(document.querySelector('#scene .scn.a-drift, #scene [class*="a-"]')).animationPlayState === 'paused' && !window.__bzg.music().playing), 'hidden: the scene pauses and the music stops');
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  ok(await page.evaluate(() => window.__bzg.music().playing), 'visible again: the music comes back');
  await page.evaluate(() => { window.__bzg.fire('motion'); });
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('#scene [class*="a-"]')).animationPlayState === 'paused'), 'Reduce motion freezes the living world');
  await page.evaluate(() => { window.__bzg.fire('motion'); window.__bzg.fire('calm'); });
  ok(await page.evaluate(() => !window.__bzg.music().playing), 'Calm mode turns the music off');
  await page.evaluate(() => { window.__bzg.fire('calm'); window.__bzg.go('collection'); });
  /* §8: the Collection — all 96 by pack, each card says how it is got; a Rare bought with coins */
  await page.waitForSelector('.bz-av');
  ok(await page.locator('.bz-av').count() === 96 && await page.locator('.col-world').count() === 6, 'the Collection shows all 96, world by world');
  ok(await page.evaluate(() => [...document.querySelectorAll('.bz-av')].every((f) => (f.querySelector('.av-say') || {}).innerText)), 'every card says how it is got, in plain words');
  ok(await page.evaluate(() => ['common', 'rare', 'epic', 'legendary'].every((t) => document.querySelector(`.bz-av[data-tier="${t}"]`))), 'Common · Rare · Epic · Legendary on the cards');
  await page.evaluate(() => { const w = JSON.parse(localStorage.getItem('bizzing.wallet')); w.kids.ahana.coins = 130; localStorage.setItem('bizzing.wallet', JSON.stringify(w)); window.__bzg.R.render(); });
  await page.click('[data-act=buyAv][data-arg="scrollfox"]'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => { const k = window.__bzg.R.h.kids[0]; return k.owned.includes('scrollfox') && k.avatar === 'scrollfox' && JSON.parse(localStorage.getItem('bizzing.wallet')).kids.ahana.coins === 10; }), 'a Rare costs its printed 120 coins, and is worn');
  await page.evaluate(() => window.__bzg.fire('setAv', 'jaguar')); await page.waitForTimeout(80);
  ok(await page.evaluate(() => window.__bzg.R.h.kids[0].avatar) === 'scrollfox', 'a face that is not yours cannot be worn');
  await shot('30-collection'); await noSideways('collection');
  await page.evaluate(() => { document.documentElement.setAttribute('data-mode', 'dark'); window.__bzg.R.render(); });
  ok(await page.evaluate(() => document.documentElement.hasAttribute('data-bz-dark') && getComputedStyle(document.querySelector('.bz-av[data-tier="rare"]')).boxShadow !== 'none'), 'in the dark the tiers glow (data-bz-dark)');
  await shot('30b-collection-dark');
  await page.evaluate(() => { document.documentElement.setAttribute('data-mode', 'light'); window.__bzg.go('medals'); });
  await page.waitForSelector('.medal-shelf');
  ok(await page.locator('.medal-shelf li').count() >= 30 && await page.locator('.medal-shelf li.got').count() >= 1, 'the medal shelf shows every medal and what earned it');
  ok(await page.evaluate(() => Object.keys(window.__bzg.R.h.kids[0].medals).filter((m) => m === 'first-station').length) === 1, 'a medal is recorded once');
  /* the Shop's Extras: a printed price from the family wallet; a look, never rank */
  const xp0 = await page.evaluate(() => window.__bzg.R.h.kids[0].xp);
  await page.evaluate(() => { const w = JSON.parse(localStorage.getItem('bizzing.wallet')); w.kids.ahana.coins = 60; localStorage.setItem('bizzing.wallet', JSON.stringify(w)); window.__bzg.R.ui.shopTab = 'extras'; window.__bzg.go('shop'); });
  ok(await page.evaluate(() => [...document.querySelectorAll('.shop-tabs [role=tab]')].map((b) => b.innerText.trim()).join('|')) === 'Avatars|Worlds|Extras', 'the Shop has Avatars · Worlds · Extras');
  await page.click('[data-act=buy][data-arg="pin:star"]'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => { const k = window.__bzg.R.h.kids[0]; return k.shop.owned.includes('pin:star') && k.shop.pin === 'star' && JSON.parse(localStorage.getItem('bizzing.wallet')).kids.ahana.coins === 40; }), 'buying the star pin costs its printed 20 coins and puts it in use');
  ok(await page.evaluate(() => window.__bzg.R.h.kids[0].xp) === xp0, 'buying never moves rank');
  await page.click('[data-act=buy][data-arg="frame:wood"]', { force: true }); await page.waitForTimeout(150);
  ok(await page.evaluate(() => !window.__bzg.R.h.kids[0].shop.owned.includes('frame:wood')), 'a look the wallet cannot pay for is refused');
  ok(await page.locator('.ledger li').count() >= 3, 'the Shop ends with the wallet history');
  await shot('28-shop'); await noSideways('shop');
  /* K9: the coin chip opens the wallet history; Escape closes it */
  await page.click('[data-bz=coins]'); await page.waitForSelector('#wallet-sheet');
  ok(/bought|right answer|stop/.test(await page.locator('#wallet-sheet .ledger').innerText()) && await page.locator('#wallet-sheet .ledger li').count() <= 30, 'the coin chip opens the last 30 coins, in words');
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  ok(await page.locator('#wallet-sheet').count() === 0, 'Escape closes the wallet');
  /* §3: the ☰ drawer opens and closes by keyboard, in the family order, focus kept inside */
  await page.focus('[data-bz=menu]'); await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  ok(await page.evaluate(() => !document.querySelector('[data-bz=drawer]').hidden), '☰ opens by keyboard');
  for (let i = 0; i < 25; i++) await page.keyboard.press('Tab');
  ok(await page.evaluate(() => !!document.activeElement.closest('[data-bz=drawer]')), 'focus stays inside the open drawer');
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  ok(await page.evaluate(() => document.querySelector('[data-bz=drawer]').hidden && document.activeElement === document.querySelector('[data-bz=menu]')), 'Escape closes the drawer and focus goes back to ☰');
  await page.click('[data-bz=menu]'); await page.click('[data-bz=drawer] [data-bz-act=sound]'); await page.waitForTimeout(80);
  ok(await page.evaluate(() => window.__bzg.R.sound === false), 'mute is one tap from ☰'); await page.evaluate(() => { window.__bzg.fire('sound'); });
  /* C4: one search finds a stop, a country and a word */
  await page.evaluate(() => window.__bzg.go('search')); await page.waitForSelector('#search-q');
  for (const [q, want] of [['compass', 'Eight compass points'], ['canberra', 'Australia'], ['delta', 'delta']]) {
    await page.fill('#search-q', q); await page.waitForTimeout(350);
    ok((await page.locator('.search-res .sr b').allInnerTexts()).includes(want), `search "${q}" finds ${want}`);
  }
  await page.click('.search-res .sr >> nth=0'); await page.waitForTimeout(200);
  ok(await page.evaluate(() => window.__bzg.R.ui.nav !== 'search'), 'a search result opens what it found');
  /* a link to nowhere lands on Home AND says so in the address (it kept #/qqq) */
  await page.evaluate(() => { location.hash = '#/qqq'; }); await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__bzg.R.ui.nav === 'home' && location.hash === '#/home'), 'an unknown address (#/qqq) lands on Home and the address is corrected');
  /* a Library quiz's back pill names its tool */
  await page.evaluate(() => window.__bzg.fire('openTool', 'flags')); await page.waitForTimeout(400);
  await page.evaluate(() => window.__bzg.fire('lib', 'flags|quiz')); await page.waitForTimeout(400);
  ok(await page.evaluate(() => { const b = document.querySelector('.runner .phead .back'); return !!b && /Flags/.test(b.getAttribute('aria-label')); }), 'a Library quiz’s back pill says “Flags of the World”, not "Stop"');
  ok(await page.evaluate(() => { const ks = window.__bzg.R.run.items.map((q) => q.kind); return ks.length === 10 && ks.filter((k) => k !== 'mc').length >= 2; }), 'a Library quiz is a mixed set: some questions are answered on the map or typed, not all choosing (E4)');
  await page.evaluate(() => { window.__bzg.R.run = null; window.__bzg.go('home'); }); await page.waitForTimeout(200);
  /* deep links (the feed's cards): a link to ONE thing opens that thing, not the shelf */
  for (const [h, want, msg] of [
    ['#/lib/capitals/FR', () => window.__bzg.R.ui.arg === 'capitals' && window.__bzg.R.ui.lib.capitals.sel === 'FR' && !!document.querySelector('.t-ask.pop'), 'a capital link opens France’s capital card'],
    ['#/lib/states/US-CA', () => window.__bzg.R.ui.arg === 'states' && window.__bzg.R.ui.lib.states.sel === 'US-CA' && !!document.querySelector('.t-ask.pop'), 'a state link opens California in State Capitals'],
    ['#/lib/explorer/AR', () => window.__bzg.R.ui.arg === 'explorer' && window.__bzg.R.ui.lib.explorer.sel === 'AR' && /Argentina/.test(document.querySelector('.t-cap-side').innerText), 'a country link opens Argentina in the Map Explorer'],
    ['#/lib/flags/JP', () => window.__bzg.R.ui.arg === 'flags' && window.__bzg.R.ui.lib.flags.sel === 'JP', 'a flag link opens Japan’s flag'],
    ['#/expd/compass-grid/cg2.1', () => window.__bzg.R.ui.nav === 'expd' && document.querySelector('.crs-step.focus')?.dataset.key === 'cg2.1', 'a day link opens that expedition on that day, lit'],
  ]) {
    await page.evaluate((h) => { location.hash = h; }, h);
    await page.waitForFunction(want, null, { timeout: 5000 }).catch(() => {});
    ok(await page.evaluate(want), msg);
    if (await page.locator('.t-ask.pop').count()) await page.keyboard.press('Escape');
  }
  /* a state capital opens State Capitals on its state; a city opens the Map Explorer with a pin on it */
  await page.evaluate(() => window.__bzg.go('search')); await page.waitForSelector('#search-q');
  await page.fill('#search-q', 'sacramento'); await page.waitForTimeout(400);
  await page.click('.search-res .sr >> nth=0'); await page.waitForSelector('.t-cap-wide');
  ok(await page.evaluate(() => window.__bzg.R.ui.arg === 'states' && window.__bzg.R.ui.lib.states.sel === 'US-CA'), 'search "sacramento" opens State Capitals on California');
  await page.evaluate(() => window.__bzg.go('search')); await page.waitForSelector('#search-q');
  await page.fill('#search-q', 'houston'); await page.waitForFunction(() => [...document.querySelectorAll('.search-res .kicker')].some((k) => k.textContent === 'City'), null, { timeout: 5000 }).catch(() => {});
  await page.click('.search-res .sr >> nth=0'); await page.waitForTimeout(400);
  await page.waitForFunction(() => window.__bzg.R.ui.arg === 'explorer' && /Houston/.test((document.querySelector('.t-ex-pin') || {}).innerText || ''), null, { timeout: 5000 }).catch(() => {});
  ok(await page.evaluate(() => window.__bzg.R.ui.arg === 'explorer' && window.__bzg.R.ui.lib.explorer.sel === 'US' && (window.__bzg.R.ui.lib.explorer.pin || {}).n === 'Houston') && (await page.locator('.t-ex-pin').innerText()).includes('Houston'), 'search "houston" opens the Map Explorer with a pin on Houston');
  /* E6 + E4 + F3: a hint, a typed answer, a put-in-order answer, and the mistakes deck */
  await page.evaluate(() => { const R = window.__bzg.R; R.run = null; window.__bzg.fire('startDrill', 'eight-points'); const r = R.run; r.items = r.items.filter((q) => q.kind === 'mc' && q.opts.length >= 3).slice(0, 2); window.__bzg.go('run'); });
  await page.click('[data-act=hint]'); await page.waitForTimeout(100);
  ok(await page.locator('.opt.struck').count() === 1 && await page.evaluate(() => { const r = window.__bzg.R.run, q = r.items[r.i]; return r.hints[r.i].opt !== q.ans; }), 'E6: a hint takes away one WRONG choice');
  const c0 = await page.evaluate(() => JSON.parse(localStorage.getItem('bizzing.wallet')).kids.ahana.coins);
  await page.evaluate(() => { const r = window.__bzg.R.run; window.__bzg.fire('choose', r.items[r.i].ans); });
  ok(await page.evaluate(() => JSON.parse(localStorage.getItem('bizzing.wallet')).kids.ahana.coins) === c0, 'a right answer after a hint pays no coin');
  await page.evaluate(() => { const R = window.__bzg.R; R.run = { kind: 'drill', title: 'Kinds', items: [{ kind: 'type', text: 'Type the capital of Peru.', ans: 'Lima', accept: ['Lima'], stop: 'cap-americas', lv: 3 }, { kind: 'order', text: 'Put these countries in order of size, biggest first: tap them one by one.', items: ['Peru', 'Brazil', 'Chile'], ans: 'Brazil|Peru|Chile', stop: 'cap-americas', lv: 3 }], i: 0, results: [], fb: null, over: false, hints: {}, t0: Date.now(), bal0: 0, stop: 'cap-americas', lv: 3 }; window.__bzg.go('run'); });
  await page.waitForSelector('#type-in'); await page.fill('#type-in', 'lima'); await page.press('#type-in', 'Enter'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => window.__bzg.R.run.fb && window.__bzg.R.run.fb.right), 'E4: a typed answer, by keyboard, forgiving of case');
  await page.waitForSelector('.order-pool', { timeout: 4000 });
  await shot('31-order'); await page.click('.order-pool [data-arg="Brazil"]');
  await page.keyboard.press('1'); await page.waitForTimeout(80);   // Peru is item 1
  if (phone) await page.tap('.order-pool [data-arg="Chile"]'); else await page.click('.order-pool [data-arg="Chile"]');
  await page.waitForTimeout(150);
  ok(await page.evaluate(() => window.__bzg.R.run.fb && window.__bzg.R.run.fb.right), 'E4: put in order by tap and by number key');
  await page.evaluate(() => { const R = window.__bzg.R; R.run = null; const k = R.h.kids[0]; k.miss = {}; k.miss['Tap Spain on the map.|ES'] = { q: { kind: 'map', text: 'Tap Spain on the map.', ok: ['ES'], targetName: 'Spain' }, at: Date.now() - 2 * 864e5, box: 0, from: 'Capitals of Europe', n: 1 }; window.__bzg.go('mistakes'); });
  await page.waitForSelector('[data-act=practiseMisses]'); await shot('32-mistakes'); await noSideways('mistakes');
  await page.click('[data-act=practiseMisses]'); await page.waitForSelector('.qcard');
  await page.evaluate(() => window.__bzg.fire('choose', 'ES')); await page.waitForTimeout(150);
  ok(await page.evaluate(() => window.__bzg.R.h.kids[0].miss['Tap Spain on the map.|ES'].box === 1), 'F3: a missed card came back after a gap; right moves it up a step');
  await page.evaluate(() => { window.__bzg.R.run = null; window.__bzg.go('home'); });
  // above the fold: on every key screen the core content starts in the top half of the first screen
  for (const [nav, arg, sel, what] of [['home', null, '[data-bz=next]', 'the Continue card'], ['atlas', null, '.map-board', 'the island map'], ['road', null, '.jsteps', 'the road'],
    ['exp', null, '.crs-card', 'the first expedition'], ['expd', 'capitals', '.crs-board', 'the expedition board'], ['library', null, '.lib-tile', 'the first tool'], ['lib', 'capitals', '.gmap', 'the map'], ['lib', 'time', '.t-stage', 'the painting'], ['lib', 'geoguess', '.t-geo-intro .btn, .wo', 'Play or the game'], ['lib', 'dictionary', '#t-dictionary-q', 'the search box']]) {
    await page.evaluate(([n, a]) => { window.__bzg.go(n, a); scrollTo(0, 0); }, [nav, arg]); await page.waitForTimeout(120);
    const top = await page.evaluate((sel) => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect().top : 1e9; }, sel);
    const h = await page.evaluate(() => innerHeight);
    ok(top < h * (phone ? 0.62 : 0.5), `${nav}${arg ? ' ' + arg : ''}: ${what} starts above the fold (${Math.round(top)} of ${h})`);
  }
  await page.evaluate(() => { window.__bzg.go('lib', 'time'); scrollTo(0, 0); }); await page.waitForTimeout(150);
  ok(await page.evaluate(() => { const b = document.querySelector('.t-ov h2').getBoundingClientRect(); return b.bottom <= innerHeight; }), 'Earth Through Time: the step’s title is on screen without scrolling');
  if (!phone) ok(await page.evaluate(() => { const b = document.querySelector('.t-split').getBoundingClientRect(); return b.bottom <= innerHeight + 1; }), 'Earth Through Time: on a desktop the painting and its card fit one screen');
  /* ---------------- PLAY: the tab, every game played by touch and keyboard ---------------- */
  const tapXY = async (x, y) => { if (phone) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await page.waitForTimeout(150); };
  const tapLL = async (lat, lng) => {   // a real tap on the map at a latitude/longitude (a medal pop-up is closed first)
    if (await page.locator('.mp-card').count()) { await page.click('[data-act=medalOk]'); await page.waitForTimeout(100); }
    await page.evaluate(() => document.querySelector('main .gmap svg').scrollIntoView({ block: 'center' })); await page.waitForTimeout(60);
    const xy = await page.evaluate(([lat, lng]) => { const svg = document.querySelector('main .gmap svg'), b = svg.getBoundingClientRect(), [vx, vy, vw, vh] = svg.getAttribute('viewBox').split(' ').map(Number);
      const s = Math.min(b.width / vw, b.height / vh), ox = b.left + (b.width - vw * s) / 2, oy = b.top + (b.height - vh * s) / 2;
      const p = window.__bzg.project([lat, lng]); return p ? [ox + (p[0] - vx) * s, oy + (p[1] - vy) * s] : null; }, [lat, lng]);
    if (xy) await tapXY(xy[0], xy[1]); return xy;
  };
  await page.evaluate(() => { window.__bzg.R.ui.medalPop = []; }); await nav('play'); await page.waitForSelector('.play-hero');
  ok(await page.locator('.play-card').count() === 6 && (await page.locator('.play-hero').innerText()).includes('Trade Winds'), 'the Play tab: Trade Winds as the big card, then six games');
  ok(await page.locator(phone ? '[data-bz=tabbar] a[href="#/play"][aria-current=page]' : '[data-bz=tabs] a[href="#/play"][aria-current=page]').count() === 1, 'the Play tab is lit');
  await page.waitForTimeout(300); await shot('30-play'); await noSideways('play');
  ok(!(await page.evaluate(() => window.__bzg.SHELF.map((t) => t.id))).includes('geoguess'), 'Where on Earth? has moved off the Library shelf…');
  await page.evaluate(() => window.__bzg.go('lib', 'geoguess')); await page.waitForTimeout(300);
  ok(await page.evaluate(() => window.__bzg.R.ui.nav === 'game' && location.hash === '#/game/geoguess'), '…and an old link to it lands on Play');

  // Neighbour Chain: tap a real neighbour, a wrong country holds, Undo, finish by keyboard (the hint list)
  await page.evaluate(() => window.__bzg.go('play')); await page.waitForSelector('.play-card');
  await page.click('.play-card[data-arg=chain]'); await page.waitForSelector('[data-arg="chain|start"]'); await shot('31-chain-title');
  await page.click('[data-arg="chain|start"]'); await page.waitForSelector('.gm-chain');
  const P = await page.evaluate(() => window.__bzg.R.ui.lib.chain.g.list[0]);
  const far = P.b;   // the goal is always in view and never touches the start (the shortest chain is 2+)
  if (far) { await tapLL(...(await page.evaluate((c) => window.__bzg.byCc[c].at, far))); ok((await page.locator('.fb.bad').count()) === 1 && await page.evaluate(() => window.__bzg.R.ui.lib.chain.g.chain.length) === 1, 'a country that does not touch the chain is held, and explained'); }
  /* tap a point INSIDE the neighbour's drawn shape (a country's listed point can sit on its neighbour's land) */
  const nb = P.path[1]; await page.evaluate(() => document.querySelector('main .gmap svg').scrollIntoView({ block: 'center' }));
  const nbXY = await inside(page, `main .gmap path[data-cc="${nb}"]`); await tapXY(nbXY[0], nbXY[1]);
  ok(await page.evaluate((nb) => window.__bzg.R.ui.lib.chain.g.chain[1] === nb, nb), 'tapping a real neighbour adds it to the chain');
  await shot('32-chain');
  await page.keyboard.press('u'); ok(await page.evaluate(() => window.__bzg.R.ui.lib.chain.g.chain.length) === 1, 'U undoes a step');
  await page.keyboard.press('h'); await page.waitForSelector('.gm-nb');
  for (const c of P.path.slice(1)) { const i = await page.evaluate((c) => { const g = window.__bzg.R.ui.lib.chain.g; return window.__bzg.NB(g.chain[g.chain.length - 1]).indexOf(c); }, c); if (i >= 9 || i < 0) await page.evaluate((c) => window.__bzg.fire('lib', 'chain|step|' + c), c); else { await page.keyboard.press('h'); await page.keyboard.press(String(i + 1)); } }
  ok(await page.evaluate(() => { const g = window.__bzg.R.ui.lib.chain.g; return g.done[0] && g.done[0].stars === 3; }), 'walking the shortest chain earns ★★★');
  await page.keyboard.press('Enter');
  await page.evaluate(() => { window.__bzg.R.ui.lib.chain.g = null; });

  // Hot & Cold Compass: a guess far away tells distance and a direction; a tap on the capital finds it
  await page.evaluate(() => window.__bzg.go('game', 'compass')); await page.click('[data-arg="compass|start"]'); await page.waitForSelector('.gmap.tap');
  const cc0 = await page.evaluate(() => window.__bzg.R.ui.lib.compass.g.list[0]), cap = await page.evaluate((c) => window.__bzg.byCc[c].capAt[0], cc0);
  await tapLL(cap[0] > 0 ? cap[0] - 25 : cap[0] + 25, cap[1]);
  const g1 = await page.evaluate(() => window.__bzg.R.ui.lib.compass.g.guesses[0]);
  ok(g1 && g1.km > 1000 && ['north', 'north-east', 'north-west', 'south', 'south-east', 'south-west'].includes(['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][g1.p]) && /km away, to the/.test(await page.locator('#gm-q').innerText()), `a guess south of the capital is told “${['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][g1 && g1.p]}”, and how far`);
  await shot('33-compass');
  await tapLL(cap[0], cap[1]);
  ok(await page.evaluate(() => !!(window.__bzg.R.ui.lib.compass.g.done[0] || {}).found), 'a tap on the capital finds it');
  await page.evaluate(() => { window.__bzg.R.ui.lib.compass.g = null; });

  // Bigger or Smaller?: keys 1/2 answer; the reveal draws both at one true scale
  await page.evaluate(() => window.__bzg.go('game', 'bigger')); await page.click('[data-arg="bigger|start"]'); await page.waitForSelector('.bg-pick');
  await page.keyboard.press('1'); await page.waitForSelector('.gm-res');
  ok(await page.locator('.bg-pick svg.shape').count() === 2, 'after an answer both countries are drawn at one true scale');
  await shot('34-bigger'); await noSideways('bigger');
  await page.evaluate(() => { window.__bzg.R.ui.lib.bigger.g = null; });

  // Shape Detective: a clue costs a point; a wrong pick holds; the right one by number key
  await page.evaluate(() => window.__bzg.go('game', 'shape')); await page.click('[data-arg="shape|start"]'); await page.waitForSelector('.sd-shape svg');
  await page.keyboard.press('c'); ok(await page.locator('.sd-clues li').count() === 1, 'C shows a clue');
  const sp = await page.evaluate(() => { const P = window.__bzg.R.ui.lib.shape.g.list[0]; return { ans: P.opts.indexOf(P.cc), wrong: P.opts.findIndex((x) => x !== P.cc) }; });
  await page.keyboard.press(String(sp.wrong + 1)); ok(await page.locator('.sd-opts .opt.wrong').count() === 1, 'a wrong pick holds');
  await page.keyboard.press(String(sp.ans + 1)); await page.waitForSelector('.gm-res');
  ok(await page.evaluate(() => window.__bzg.R.ui.lib.shape.g.done[0].pts) === 3, 'one clue and one wrong pick: 5 − 2 = 3 points');
  await shot('35-shape');
  await page.evaluate(() => { window.__bzg.R.ui.lib.shape.g = null; });

  // Sun Clock: a tap question answered on the right longitude; night is drawn only after
  await page.evaluate(() => window.__bzg.go('game', 'sunclock')); await page.click('[data-arg="sunclock|start"]'); await page.waitForSelector('#gm-q');
  await page.evaluate(() => { const g = window.__bzg.R.ui.lib.sunclock.g; g.list[0] = { k: 'rise', A: { n: 'New Delhi', at: [28.6, 77.2] }, target: -12.8 }; window.__bzg.R.render(); });
  ok(await page.locator('.sc-night').count() === 0, 'night is not drawn before the answer');
  await tapLL(10, -13);
  ok(await page.evaluate(() => window.__bzg.R.ui.lib.sunclock.g.done[0].right) && await page.locator('.sc-night').count() === 1, 'sunrise when it is noon in Delhi: 90° west, near 13° W — then night is drawn');
  await shot('36-sunclock');
  await page.evaluate(() => { window.__bzg.R.ui.lib.sunclock.g = null; });

  // Shelly's Trade Winds: start from Mumbai, plan by tapping, set sail by Enter, N months on, a port wakes
  await page.evaluate(() => window.__bzg.go('game', 'tradewinds')); await page.waitForSelector('[data-arg="tradewinds|new|indian"]'); await shot('37-tw-title');
  await page.click('[data-arg="tradewinds|new|indian"]'); await page.waitForSelector('.tw-map .gmap');
  ok(await page.locator('.tw-pop').count() === 1 && /Age of Sail/.test(await page.locator('.tw-pop').innerText()), 'the voyage opens on its age: a painting and the history');
  await page.waitForTimeout(300); await shot('37b-tw-age');
  await page.keyboard.press('Enter'); await page.waitForSelector('.tw-pop', { state: 'detached' });
  ok(await page.locator('.tw-port').count() === 60 && await page.locator('.tw-port.awake').count() === 1 && await page.locator('.tw-ship').count() === 1 && (await page.locator('.tw-count').textContent()) === '3', 'sixty ports, one awake, three ships at home (drawn as one, counted)');
  ok(await page.evaluate(() => { const r = document.querySelector('.tw-ship use').getBoundingClientRect(); return r.width >= 14; }), 'a ship is big enough to see on this screen');
  ok(await page.locator('.tw-wind').count() > 20, 'this month’s winds are drawn');
  const tw = await page.evaluate(() => { const S = window.__bzg.R.ui.lib, d = window.__bzg.R.h.kids[0].lib.tradewinds.save; return { ship: window.__bzg.R.ui.lib.tradewinds.ship, home: d.home }; });
  ok(!!tw.ship, 'a ship is chosen in the home port');
  const tgt = await page.evaluate(() => window.__bzg.TW.PORTS.find((p) => p.n === 'Karachi').at);
  await tapLL(tgt[0], tgt[1]);
  await page.waitForFunction(() => { const u = window.__bzg.R.ui.lib.tradewinds; return u.dest != null && !!u.plan; }, null, { timeout: 5000 }).catch(() => {});
  ok(await page.evaluate(() => { const u = window.__bzg.R.ui.lib.tradewinds; return u.dest != null && !!u.plan && window.__bzg.TW.PORTS[u.dest].n === 'Karachi'; }), 'a tap on Karachi plans the voyage');
  ok(/will wake/.test(await page.locator('.tw-plan-card').innerText()), 'the plan says Karachi will wake (it does not grow tropical fruit)');
  await shot('38-tw-plan'); await noSideways('trade winds');
  await page.evaluate(() => document.activeElement && document.activeElement.blur());   // focus on the map, Enter means "choose here"
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__bzg.R.h.kids[0].lib.tradewinds.save.ships.some((s) => s.voyage), null, { timeout: 5000 }).catch(() => {});
  ok(await page.evaluate(() => window.__bzg.R.h.kids[0].lib.tradewinds.save.ships.some((s) => s.voyage)), 'Enter sets sail');
  for (let i = 0; i < 4 && !(await page.evaluate(() => window.__bzg.R.h.kids[0].lib.tradewinds.save.ports.some((p, j) => p.awake && j !== window.__bzg.R.h.kids[0].lib.tradewinds.save.home))); i++) { await page.keyboard.press('n'); await page.waitForTimeout(700); }
  ok(await page.evaluate(() => { const S = window.__bzg.R.h.kids[0].lib.tradewinds.save; return S.ports.filter((p) => p.awake).length === 2; }), 'N moves the months on, and Karachi wakes');
  ok(/wakes!/.test(await page.locator('.tw-news').innerText()), 'Shelly brings the news, with the port’s own fact');
  await page.waitForTimeout(300); await shot('39-tw-wake');

  /* B6: the back button never leaves the app */
  await page.evaluate(() => window.__bzg.go('home')); await nav('atlas'); await page.waitForSelector('.map-board');
  await nav('library'); await page.waitForSelector('.lib-grid');
  await page.goBack(); await page.waitForTimeout(200);
  ok(page.url().includes('/Bizzing_Geography/') && await page.evaluate(() => window.__bzg.R.ui.nav) === 'atlas', 'back returns to the previous screen inside the app');
  // grown-ups: behind the PIN
  await page.evaluate(() => window.__bzg.go('grownups'));
  ok(await page.locator('#pin').count() === 1 && await page.locator('.report').count() === 0, 'the grown-ups area asks for the PIN first');

  await page.fill('#pin', '1234'); await page.click('[data-act=gate]'); await page.waitForSelector('.report');
  await shot('14-grownups'); await noSideways('grown-ups');
  ok(await page.evaluate(() => [...document.querySelectorAll('[data-act=tester], [data-act=streetview]')].map((i) => i.closest('label')).every((l) => l && l.getBoundingClientRect().width > 240)), 'grown-ups settings: every switch label has room to read (was squeezed into 50px)');
  ok(await page.evaluate(() => [...document.querySelectorAll('[data-act=tester], [data-act=streetview]')].map((i) => i.closest('label')).every((l) => { const t = l.querySelector(':scope > span'); return t && l.children.length === 2 && t.getBoundingClientRect().width > 0.75 * l.getBoundingClientRect().width; })), 'grown-ups settings: each label is one block of words, not split into columns');
  ok(await page.evaluate((W) => [...document.querySelectorAll('[data-bz=bar] button, [data-bz=bar] a')].filter((b) => b.offsetParent).every((b) => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= W; }), W), 'the top bar fits the device: every button, the lock included, is whole on screen');
  ok((await page.locator('.report').innerText()).includes('Ahana'), 'the grown-ups page reports the child');
  ok(await page.locator('.report .rc3 section').count() === 3 && /Time[\s\S]*Progress[\s\S]*Mastery/.test(await page.locator('.report .rc3').innerText()), 'the report card is Time · Progress · Mastery');
  ok(/\d+\s+active minutes this week/.test(await page.locator('.report').innerText()), 'Time is active minutes from the family feed');
  ok(await page.locator('.report .rc-worlds li').count() === 10, 'Mastery shows every world, from passed stations');
  /* B7: a second explorer, switched from the top bar; switching never mixes their data */
  await page.evaluate(() => window.__bzg.go('welcome')); await page.waitForSelector('#kname');
  await page.fill('#kname', 'Kabir'); await page.press('#kname', 'Enter'); await page.click('[data-act=draftBand][data-arg="6-7"]');
  await page.evaluate(() => { window.__spoken = []; });
  await page.click('[data-act=obNext]'); await page.click('[data-act=createKid]'); await page.waitForSelector('.runner'); await page.waitForTimeout(600);
  ok(await page.evaluate(() => window.__spoken.length >= 1 && window.__spoken[0].includes(window.__bzg.R.run.items[0].text)), 'for a 6–7 explorer each question reads itself aloud');
  await page.click('[data-act=quitRun]'); await page.evaluate(() => window.__bzg.go('home')); await page.waitForSelector('[data-bz=home]');
  await page.click('[data-bz=kid]'); await page.waitForSelector('.who-menu');
  ok(await page.locator('.who-menu .wm-kid').count() === 2, 'the top bar menu lists both explorers');
  ok(await page.evaluate(() => { const t = document.querySelector('.who-menu').innerText; return /My page — avatar, badges, collection/.test(t) && /Settings/.test(t) && /\+ Add a child/.test(t) && /grown-ups/.test(t) && document.querySelectorAll('.who-menu .wm-kid.on .ico, .who-menu .wm-kid.on svg').length >= 1; }), 'the avatar menu: every child (the current one ticked), My page, Settings, + Add a child for grown-ups');
  await shot('26-who-menu'); await noSideways('who menu');
  const xpA = await page.evaluate(() => window.__bzg.R.h.kids.find((k) => k.name === 'Ahana').xp);
  await page.click('.who-menu .wm-kid:has-text("Ahana")'); await page.waitForSelector('[data-bz=home]');
  ok(await page.evaluate(() => { const R = window.__bzg.R; return R.h.kids.find((k) => k.id === R.h.active).name; }) === 'Ahana', 'one tap switches explorer');
  ok(await page.evaluate(() => window.__bzg.R.h.kids.find((k) => k.name === 'Kabir').xp) <= 1 && xpA > 1 && (await page.locator('[data-bz=greet]').innerText()).includes('Ahana'), 'switching never mixes their progress');
  await page.keyboard.press('Escape');
  /* M3: one child deleted, behind the PIN and a confirm; the other untouched */
  await page.evaluate(() => window.__bzg.go('grownups'));
  await page.fill('#pin', '9999'); await page.click('[data-act=gate]'); await page.waitForTimeout(150);
  ok(await page.locator('.report').count() === 0, 'a wrong PIN does not open the grown-ups area');
  await page.fill('#pin', '1234'); await page.click('[data-act=gate]'); await page.waitForSelector('.report');
  const kab = await page.evaluate(() => window.__bzg.R.h.kids.find((k) => k.name === 'Kabir').id);
  await page.evaluate((id) => { document.querySelectorAll('.rc-set').forEach((d) => { d.open = true; }); window.__bzg.fire('delKid', id); }, kab);
  ok(await page.evaluate(() => window.__bzg.R.h.kids.length) === 2, 'delete asks first');
  await page.evaluate((id) => window.__bzg.fire('delKidYes', id), kab);
  ok(await page.evaluate(() => window.__bzg.R.h.kids.length === 1 && window.__bzg.R.h.kids[0].name === 'Ahana' && window.__bzg.R.h.kids[0].xp > 1), 'deleting Kabir leaves Ahana exactly as she was');
  await page.evaluate(() => window.__bzg.go('home'));
  /* #/continue from the Hive goes straight to the Continue target */
  const want = await page.evaluate(() => { const k = window.__bzg.R.h.kids[0]; return window.__bzg.next(k).arg; });
  await page.goto(`http://127.0.0.1:${port}/Bizzing_Geography/?from=hive#/continue`); await page.waitForSelector('[data-bz=content]');
  ok(await page.evaluate((w) => window.__bzg.R.ui.nav === 'stop' && window.__bzg.R.ui.arg === w, want), '#/continue opens the Continue card’s target');
  ok(await page.locator('.hive-chip').count() === 1, '?from=hive shows “back to my day”');
  /* ?demo: a labelled sample with weeks of progress that never touches the real household or the shared feeds */
  const before = await page.evaluate(() => [localStorage.getItem('bzg_household'), localStorage.getItem('bizzing.activity'), localStorage.getItem('bizzing.wallet')]);
  await page.goto(`http://127.0.0.1:${port}/Bizzing_Geography/?demo`); await page.waitForSelector('[data-bz=home]');
  ok(await page.locator('.demo-bar').count() === 1 && (await page.locator('[data-bz=greet]').innerText()).includes('Sample'), '?demo opens a labelled sample explorer');
  ok(await page.evaluate(() => Object.keys(window.__bzg.R.h.kids[0].days).length >= 10 && window.__bzg.R.h.kids[0].xp > 50), 'the sample has weeks of progress');
  /* N2 — the first-screen budget (family standard §11): what the home pulls before anything is
     tapped, with JS and CSS counted gzipped as GitHub Pages serves them */
  if (phone) {
    const got = await page.evaluate(() => [...performance.getEntriesByType('navigation'), ...performance.getEntriesByType('resource')].map((e) => ({ u: e.name, n: e.decodedBodySize || 0 })));
    let js = 0, total = 0;
    for (const { u, n } of got) {
      if (!u.startsWith(`http://127.0.0.1:${port}/`)) continue;
      if (/\.(js|css|html)(\?|$)|\/$|\?demo$/.test(u)) { const body = Buffer.from(await (await fetch(u)).arrayBuffer()); const gz = gzipSync(body).length; total += gz; if (/\.js(\?|$)/.test(u)) js += gz; }
      else total += n;
    }
    ok(js <= 400 * 1024, `initial JavaScript ≤ 400 KB gzipped (${Math.round(js / 1024)} KB)`);
    ok(total <= 1.5 * 1024 * 1024, `first screen ≤ 1.5 MB on a phone (${(total / 1048576).toFixed(2)} MB)`);
    ok(!got.some((x) => /geoguess-|time-/.test(x.u)), 'the heavy tools are not in the first screen');
  }
  await shot('27-demo');
  await page.evaluate(() => { window.__bzg.fire('goal', '5'); }); for (let i = 0; i < 6; i++) { await page.keyboard.press('Shift'); await page.clock.runFor(15000); } await page.waitForTimeout(1200);   // the store writes on a short delay
  ok(JSON.stringify(await page.evaluate(() => [localStorage.getItem('bzg_household'), localStorage.getItem('bizzing.activity'), localStorage.getItem('bizzing.wallet')])) === JSON.stringify(before), 'the sample saves nothing and writes no shared feed');
  await page.close();
}

try {
  await run({ width: 1280, height: 860 }, 'desk');
  await run({ width: 390, height: 844 }, 'phone');
} finally { await browser.close(); srv.kill(); }
for (const e of errors) { fails++; console.error('  ✗ ' + e); }
console.log(`${fails ? '✗' : '✓'} ui: desktop + phone${fails ? `, ${fails} failures` : ''}`);
process.exit(fails ? 1 : 0);
