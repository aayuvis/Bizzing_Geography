/* photos-ui.mjs — real photos in Where on Earth?, driven in Chromium.
   Builds the app WITH a stand-in Maps key into .build-key/, and answers
   Google's image requests locally (a real key never enters a test). Proves:
     · real photos are on by default, and ONE round mixes photos and paintings;
     · a photo round plays: look around, tap, guess, reveal;
     · a place with no imagery (404) is swapped for another, uncounted;
     · a grown-up's switch turns photos off — then nothing is asked of Google. */
import { createRequire } from 'node:module';
import { spawn, execSync } from 'node:child_process';
import { mkdirSync, existsSync, symlinkSync, rmSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || '/opt/node22/lib/node_modules/playwright');

const HERE = resolve(import.meta.dirname, '..');
const OUT = resolve(HERE, '.build-key'), SITE = resolve(HERE, '.site-key'), SHOTS = resolve(HERE, '.shots');
execSync(`npx vite build --outDir ${OUT} --emptyOutDir`, { cwd: HERE, env: { ...process.env, VITE_GMAPS_KEY: 'TESTKEY' }, stdio: 'ignore' });
rmSync(SITE, { recursive: true, force: true }); mkdirSync(SITE, { recursive: true }); mkdirSync(SHOTS, { recursive: true });
symlinkSync(OUT, resolve(SITE, 'Bizzing_Geography'));
const port = +(process.env.PORT || 8000 + Math.floor(Math.random() * 900));
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: SITE, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));

let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.error('  ✗ ' + m); } else if (process.env.V) console.log('  ✓ ' + m); };
const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined });
const errors = [], google = [];
const jpg = readFileSync(resolve(HERE, 'public/art/pc-alps.webp'));
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  page.on('pageerror', (e) => errors.push(e.message));
  let n404 = 1;   // the first photo asked for has "no imagery"
  await page.route('https://maps.googleapis.com/**', (route) => {
    google.push(route.request().url());
    if (n404-- > 0) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ status: 200, contentType: 'image/webp', body: jpg });
  });
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(`http://127.0.0.1:${port}/`) && !u.startsWith('https://maps.googleapis.com/') && !u.startsWith('data:')) errors.push('third-party request: ' + u); });
  await page.goto(`http://127.0.0.1:${port}/Bizzing_Geography/`);
  await page.click('[data-act=obStart]'); await page.fill('#kname', 'Ahana'); await page.click('[data-act=obNext]'); await page.click('[data-act=draftBand][data-arg="11-14"]'); await page.click('[data-act=obNext]'); await page.click('[data-act=createKid]');
  await page.waitForSelector('.runner'); await page.click('[data-act=quitRun]'); await page.evaluate(() => window.__bzg.go('home'));
  await page.waitForSelector('[data-bz=home]');
  ok(await page.evaluate(() => window.__bzg.R.h.parent.streetview) === true, 'real photos are on by default');
  await page.evaluate(() => window.__bzg.go('lib', 'geoguess')); await page.waitForSelector('.t-geo-intro');
  await page.screenshot({ path: `${SHOTS}/photo-00-intro.png` });
  ok(await page.locator('[data-arg="geoguess|start"]').count() === 1, 'one journey: a single Play button');
  await page.click('[data-arg="geoguess|start"]'); await page.waitForSelector('.wo');
  const g = await page.evaluate(() => window.__bzg.R.ui.lib.geoguess.g);
  ok(g.cards.length === 5 && g.cards.filter((c) => c.k === 'photo').length === 3 && g.cards.filter((c) => c.k === 'painted').length === 2, 'a round mixes three photos and two paintings');
  /* play all five; on each photo card, look around once */
  let sawPhoto = false, turned = false;
  for (let i = 0; i < 5; i++) {
    await page.waitForSelector('.wo'); await page.waitForTimeout(700);
    const k = await page.evaluate(() => { const g = window.__bzg.R.ui.lib.geoguess.g; return g.cards[g.i].k; });
    if (k === 'photo') {
      ok(await page.evaluate(() => { const im = [...document.querySelectorAll('.wo-view.photo img')]; return im.length === 2 && im.every((i) => i.complete && i.naturalWidth > 0); }), 'a photo card shows its two halves');
      ok((await page.locator('.wo-hud').innerText()).includes('Imagery © Google'), 'Google is credited on the photo');
      if (!turned) {
        const h0 = await page.evaluate(() => window.__bzg.R.ui.lib.geoguess.g.heading);
        await page.click('[data-arg="geoguess|turn|45"]'); await page.keyboard.press(']');
        ok(await page.evaluate(() => window.__bzg.R.ui.lib.geoguess.g.heading) === (h0 + 90) % 360, '› and ] look around');
        const v = await page.locator('.wo-view.photo').boundingBox();
        await page.mouse.move(v.x + v.width * 0.7, v.y + v.height / 2); await page.mouse.down(); await page.mouse.move(v.x + v.width * 0.2, v.y + v.height / 2, { steps: 6 }); await page.mouse.up(); await page.waitForTimeout(200);
        ok(await page.evaluate(() => window.__bzg.R.ui.lib.geoguess.g.heading) === (h0 + 180) % 360, 'dragging the photo looks around');
        turned = true;
      }
      if (!sawPhoto) { await page.screenshot({ path: `${SHOTS}/photo-01-card.png` }); sawPhoto = true; }
    } else ok((await page.locator('.wo-hud').innerText()).includes('a painting, not a photo'), 'a painted card says it is a painting');
    await page.keyboard.press('m'); await page.waitForSelector('.wo.big .gmap.tap');
    const b = await page.locator('.wo-map .gmap').boundingBox();
    await page.mouse.click(b.x + b.width * 0.5, b.y + b.height * 0.4); await page.click('.wo-guess');
    await page.waitForSelector('.t-geo-res');
    if (i === 0) await page.screenshot({ path: `${SHOTS}/photo-02-reveal.png` });
    await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  }
  await page.waitForSelector('.end-card');
  ok(google.length >= 4, 'the first photo had no imagery and others were asked for');
  ok(await page.evaluate(() => window.__bzg.R.h.kids[0].lib.geoguess.rounds) === 1, 'a finished round is recorded');

  /* a grown-up switches photos off: rounds are all paintings, nothing goes to Google */
  await page.evaluate(() => window.__bzg.go('grownups'));
  await page.fill('#pin', '1234'); await page.click('[data-act=gate]'); await page.waitForSelector('[data-act=streetview]');
  await page.click('[data-act=streetview]');
  ok(await page.evaluate(() => window.__bzg.R.h.parent.streetview) === false, 'the switch turns real photos off');
  const before = google.length;
  await page.evaluate(() => window.__bzg.go('lib', 'geoguess')); await page.click('[data-arg="geoguess|start"]'); await page.waitForSelector('.wo');
  await page.waitForTimeout(500);
  ok(await page.evaluate(() => window.__bzg.R.ui.lib.geoguess.g.cards.every((c) => c.k === 'painted')), 'with photos off, a round is all paintings');
  ok(google.length === before, 'with photos off, nothing is asked of Google');
} finally { await browser.close(); srv.kill(); rmSync(SITE, { recursive: true, force: true }); }
for (const e of errors) { fails++; console.error('  ✗ ' + e); }
console.log(`${fails ? '✗' : '✓'} photos: on by default, one mixed round, a skipped place, switched off by a grown-up${fails ? `, ${fails} failures` : ''}`);
process.exit(fails ? 1 : 0);
