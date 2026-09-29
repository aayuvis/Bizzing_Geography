/* test/ui.mjs — drive the BUILT app in a real browser, the way a child would.
   Serves build/ under /Bizzing_Geography/ (the GitHub Pages sub-path), then
   walks: onboarding → home → Atlas → a world → a stop → a drill (multiple
   choice by keyboard, map taps by touch AND by the keyboard cross) → My road
   → every Library tool → GeoGuesser → state capitals → grown-ups. Any page
   error, 404 or sideways scroll on a phone fails it. Screenshots in .shots/. */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, symlinkSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || '/opt/node22/lib/node_modules/playwright');

const HERE = resolve(import.meta.dirname, '..');
const SHOTS = process.env.SHOTS || resolve(HERE, '.shots');
const SITE = resolve(HERE, '.site');
rmSync(SITE, { recursive: true, force: true }); mkdirSync(SITE, { recursive: true }); mkdirSync(SHOTS, { recursive: true });
symlinkSync(resolve(HERE, 'build'), resolve(SITE, 'Bizzing_Geography'));
const port = 8000 + Math.floor(Math.random() * 900);
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
  page.on('pageerror', (e) => errors.push(`${tag}: ${e.message}`));
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`${tag} ${r.status()}: ${r.url()}`); });
  page.on('request', (r) => { if (!r.url().startsWith(`http://127.0.0.1:${port}/`) && !r.url().startsWith('data:')) errors.push(`${tag} third-party request: ${r.url()}`); });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${tag} console: ${m.text()}`); });
  const shot = (n) => page.screenshot({ path: `${SHOTS}/${tag}-${n}.png` });
  const S = () => page.evaluate(() => { const r = window.__bzg.R, q = r.run && r.run.items[r.run.i]; return { nav: r.ui.nav, run: r.run && { kind: r.run.kind, i: r.run.i, n: r.run.items.length, over: r.run.over, fb: r.run.fb, q } }; });
  const phone = vp.width < 760;
  const nav = (k) => page.click(phone ? `.tb[data-arg=${k}]` : `.tab[data-arg=${k}]`);
  const noSideways = async (where) => ok(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${where}: no sideways scroll`);

  await page.goto(`http://127.0.0.1:${port}/Bizzing_Geography/`);
  await page.waitForSelector('.welcome');
  await shot('01-welcome');
  ok(await page.locator('[data-act=createKid]').isDisabled(), 'create is disabled until name and age');
  await page.fill('#kname', 'Ahana');
  await page.click('[data-act=draftBand][data-arg="8-10"]');
  await page.click('[data-act=draftAv][data-arg="panda"]');
  await page.click('[data-act=createKid]');
  await page.waitForSelector('.home');
  await page.waitForTimeout(300); await shot('02-home'); await noSideways('home');
  ok(await page.evaluate(() => window.__bzg.R.h.kids[0].road.level) === 3, 'an 8–10 starts on Level 3');

  await nav('atlas'); await page.waitForSelector('.map-board');
  await page.waitForTimeout(400); await shot('03-atlas'); await noSideways('atlas');
  ok(await page.locator('.map-pin').count() === 10, 'ten places on the atlas');
  await page.click('.map-pin[data-arg=compass]'); await page.waitForSelector('.world-page');
  await page.waitForTimeout(300); await shot('04-world');
  await page.click('[data-act=openStop]'); await page.waitForSelector('.stop-page');
  await shot('05-stop');
  await page.click('[data-act=learned]');
  ok(await page.evaluate(() => window.__bzg.R.h.kids[0].stops['eight-points'].stars) === 1, 'reading the lesson earns the first star');

  // a drill, answered right by keyboard: ★★★ and station 1 done
  await page.click('[data-act=startDrill]'); await page.waitForSelector('.qcard');
  for (let i = 0; i < 12; i++) {
    const s = await S(); if (!s.run || s.run.over) break;
    if (i === 0) await shot('06-question');
    if (s.run.q.kind === 'mc') await page.keyboard.press(String(s.run.q.opts.indexOf(s.run.q.ans) + 1));
    await page.waitForTimeout(1700);
  }
  ok((await S()).run.over, 'the drill finishes');
  ok(await page.evaluate(() => window.__bzg.R.h.kids[0].stops['eight-points'].stars) === 3, 'ten right earns three stars');
  await shot('07-end');
  await page.keyboard.press('Enter');

  // a map question: find a country, by a real tap on its shape
  await page.evaluate(() => { const { R, go } = window.__bzg; R.run = null; });
  await page.evaluate(() => window.__bzg.fire('openStop', 'cap-europe'));
  await page.waitForSelector('.stop-page');
  await page.evaluate(() => { const R = window.__bzg.R; R.h.parent.tester = false; });
  await page.evaluate(() => { const R = window.__bzg.R; R.run = { kind: 'drill', title: 'Map test', items: [{ kind: 'map', text: 'Tap France on the map.', ok: ['FR'], view: [-25, 34, 45, 72], why: '', target: 'FR', stop: 'cap-europe', lv: 2 }, { kind: 'map', text: 'Tap Spain on the map.', ok: ['ES'], view: [-25, 34, 45, 72], why: '', target: 'ES', stop: 'cap-europe', lv: 2 }], i: 0, results: [], fb: null, over: false, stop: 'cap-europe', lv: 2 }; window.__bzg.go('run'); });
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
  // Dictionary: a topic, then a quiz
  await page.evaluate(() => window.__bzg.go('lib', 'dictionary')); await page.waitForSelector('.t-dict');
  ok(await page.locator('.t-dict dt').count() >= 300, 'the dictionary lists at least 300 words');
  await page.click('[data-arg="dictionary|topic|water"]'); await page.waitForTimeout(150);
  await shot('18-dictionary-water');
  await page.click('[data-arg="dictionary|quiz"]'); await page.waitForSelector('.qcard');
  ok(await page.evaluate(() => window.__bzg.R.run.items.length) === 10, 'the dictionary quiz asks ten');
  await page.evaluate(() => { window.__bzg.R.run = null; });

  // GeoGuesser: a round, a guess, the reveal
  await page.evaluate(() => window.__bzg.go('lib', 'geoguess'));
  await page.click('[data-arg="geoguess|start"]'); await page.waitForSelector('.t-geo-card');
  ok(await page.evaluate(() => window.__bzg.R.ui.lib.geoguess.g.cards.every((c) => c.k === 'painted')), 'with no Maps key built in, a round is all paintings');
  const g = await page.locator('.t-geo-map .gmap').boundingBox();
  if (phone) await page.touchscreen.tap(g.x + g.width * 0.6, g.y + g.height * 0.4); else await page.mouse.click(g.x + g.width * 0.6, g.y + g.height * 0.4);
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => !!window.__bzg.R.ui.lib.geoguess.g.guess), 'a tap drops the GeoGuesser pin');
  await page.keyboard.press('g'); await page.waitForTimeout(300);
  ok(await page.locator('.t-geo-res').count() === 1, 'G guesses and shows the answer and clues');
  await shot('12-geoguess');
  // State capitals: India's map is the Survey of India depiction from Bizzing India; tap a state
  await page.evaluate(() => window.__bzg.go('lib', 'states'));
  await page.click('[data-arg="states|c|IN"]'); await page.waitForSelector('.reg-IN');
  const rj = await inside(page, '.reg-IN path[data-cc="IN-RJ"]');
  if (phone) await page.touchscreen.tap(rj[0], rj[1]); else await page.mouse.click(rj[0], rj[1]);
  await page.waitForTimeout(200);
  ok(await page.evaluate(() => window.__bzg.R.ui.lib.states.sel) === 'IN-RJ', 'tapping Rajasthan selects it');
  await page.waitForSelector('#t-states-ans');
  ok(!(await page.locator('.t-ask').innerText()).includes('Jaipur'), 'the capital is not shown before the child answers');
  await page.fill('#t-states-ans', 'jaipur'); await page.press('#t-states-ans', 'Enter');
  await page.waitForTimeout(150);
  ok(await page.evaluate(() => window.__bzg.R.ui.lib.states.ask.state) === 'right', 'typing “jaipur” + Enter is right');
  ok(await page.evaluate(() => (window.__bzg.R.h.kids[0].lib.states.box || {})['IN-RJ']) === 1, 'a right state capital climbs its box');
  ok(/\b0\s+of 36 capitals known/.test(await page.locator('.t-cap-bar').innerText()), 'State Capitals shows a known count (one right answer is not yet known)');
  await shot('13-states-india');
  ok(await page.locator('.reg-IN path.ct').count() === 36, 'India draws 36 states and union territories');

  // the four newer countries: each draws every state, and a tap asks for its capital
  for (const [c, n, id, cap] of [['BR', 27, 'BR-BA', 'Salvador'], ['MX', 32, 'MX-JAL', 'Guadalajara'], ['DE', 16, 'DE-BY', 'Munich'], ['NG', 37, 'NG-KN', 'Kano']]) {
    await page.click(`[data-arg="states|c|${c}"]`); await page.waitForSelector(`.reg-${c}`);
    ok(await page.locator(`.reg-${c} path.ct`).count() === n, `${c} draws ${n} states`);
    const pt = await inside(page, `.reg-${c} path[data-cc="${id}"]`);
    if (phone) await page.touchscreen.tap(pt[0], pt[1]); else await page.mouse.click(pt[0], pt[1]);
    await page.waitForSelector('#t-states-ans');
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
  await page.fill('#t-capitals-ans', 'Rio'); await page.press('#t-capitals-ans', 'Enter'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => window.__bzg.R.ui.lib.capitals.ask.state) === 'wrong' && !(await page.locator('.t-ask').innerText()).includes('Brasília'), 'a wrong answer holds without giving it away');
  await page.click('[data-arg="capitals|four"]'); await page.waitForSelector('.t-ask-opts');
  ok(await page.locator('.t-ask-opts .opt').count() === 4, 'four choices appear');
  await shot('15-capitals-ask');
  await page.click('[data-arg="capitals|reveal"]'); await page.waitForTimeout(150);
  ok((await page.locator('.t-ask').innerText()).includes('Brasília'), 'reveal shows the answer');
  ok(await page.evaluate(() => (window.__bzg.R.h.kids[0].lib.capitals.box || {}).BR) === 0, 'a revealed capital is not counted as known');
  await noSideways('capitals ask');
  // a right pick from the four choices counts toward "known"
  const ar = await inside(page, '.gmap path[data-cc=AR]');
  if (phone) await page.touchscreen.tap(ar[0], ar[1]); else await page.mouse.click(ar[0], ar[1]);
  await page.waitForSelector('#t-capitals-ans');
  await page.click('[data-arg="capitals|four"]'); await page.waitForSelector('.t-ask-opts');
  await page.click('.t-ask-opts .opt:has-text("Buenos Aires")'); await page.waitForTimeout(150);
  ok(await page.evaluate(() => window.__bzg.R.ui.lib.capitals.ask.state) === 'picked', 'picking Buenos Aires is right');
  ok(await page.evaluate(() => (window.__bzg.R.h.kids[0].lib.capitals.box || {}).AR) === 1, 'a right pick climbs the capital’s box');

  // grown-ups
  await page.evaluate(() => window.__bzg.go('grownups'));
  await page.fill('#pin', '1234'); await page.click('[data-act=gate]'); await page.waitForSelector('.report');
  await shot('14-grownups');
  ok((await page.locator('.report').innerText()).includes('Ahana'), 'the grown-ups page reports the child');
  await page.close();
}

try {
  await run({ width: 1280, height: 860 }, 'desk');
  await run({ width: 390, height: 844 }, 'phone');
} finally { await browser.close(); srv.kill(); }
for (const e of errors) { fails++; console.error('  ✗ ' + e); }
console.log(`${fails ? '✗' : '✓'} ui: desktop + phone${fails ? `, ${fails} failures` : ''}`);
process.exit(fails ? 1 : 0);
