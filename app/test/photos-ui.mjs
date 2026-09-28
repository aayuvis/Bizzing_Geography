/* photos-ui.mjs — real photos in GeoGuesser, driven in Chromium.
   Builds the app WITH a stand-in Maps key into .build-key/, and answers
   Google's image requests locally (a real key never enters a test). Proves:
     · with the key built in but the switch off, no request goes to Google;
     · a grown-up's switch turns real photos on;
     · a round of photos plays: look around, tap, guess, reveal;
     · a place with no imagery (404) is swapped for another, uncounted. */
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
const port = 8000 + Math.floor(Math.random() * 900);
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
  await page.fill('#kname', 'Ahana'); await page.click('[data-act=draftBand][data-arg="11-14"]'); await page.click('[data-act=createKid]');
  await page.waitForSelector('.home');
  await page.evaluate(() => window.__bzg.go('lib', 'geoguess')); await page.waitForSelector('.t-geo-intro');
  ok(await page.locator('[data-arg="geoguess|start|photo"]').count() === 0, 'real photos are off until a grown-up switches them on');
  await page.click('[data-arg="geoguess|start|painted"]'); await page.waitForSelector('.t-geo-card');
  await page.waitForTimeout(300);
  ok(google.length === 0, 'with the switch off, nothing is asked of Google');

  await page.evaluate(() => window.__bzg.go('grownups'));
  await page.fill('#pin', '1234'); await page.click('[data-act=gate]'); await page.waitForSelector('[data-act=streetview]');
  ok(!(await page.locator('[data-act=streetview]').isDisabled()), 'with a key built in, the switch can be used');
  await page.click('[data-act=streetview]');
  ok(await page.evaluate(() => window.__bzg.R.h.parent.streetview) === true, 'the switch turns real photos on');

  await page.evaluate(() => window.__bzg.go('lib', 'geoguess')); await page.waitForSelector('[data-arg="geoguess|start|photo"]');
  await page.screenshot({ path: `${SHOTS}/photo-00-intro.png` });
  await page.click('[data-arg="geoguess|start|photo"]'); await page.waitForSelector('.t-geo-card.photo img');
  await page.waitForTimeout(800);
  const g = await page.evaluate(() => window.__bzg.R.ui.lib.geoguess.g);
  ok(g.ids.length === 5 && g.spare.length >= 5, 'a photo round is five places with spares');
  ok(google.length >= 2, 'the first place had no imagery and a second was asked for');
  ok(await page.evaluate(() => { const i = document.querySelector('.t-geo-card.photo img'); return i.complete && i.naturalWidth > 0; }), 'the swapped-in photo shows');
  const h0 = g.heading; await page.click('[data-arg="geoguess|turn|90"]');
  ok(await page.evaluate(() => window.__bzg.R.ui.lib.geoguess.g.heading) === (h0 + 90) % 360, '▶ looks round 90°');
  await page.keyboard.press(']');
  ok(await page.evaluate(() => window.__bzg.R.ui.lib.geoguess.g.heading) === (h0 + 180) % 360, '] looks round by keyboard');
  ok(google.some((u) => u.includes('heading=180')), 'looking round asks for that view');
  const box = await page.locator('.t-geo-map .gmap').boundingBox();
  await page.mouse.click(box.x + box.width * 0.55, box.y + box.height * 0.35);
  await page.keyboard.press('g'); await page.waitForSelector('.t-geo-res');
  await page.screenshot({ path: `${SHOTS}/photo-01-reveal.png` });
  ok((await page.locator('.t-geo-res').innerText()).includes('About this place'), 'the reveal names the place and why');
  ok((await page.locator('.t-geo-card figcaption').innerText()).includes('Imagery © Google'), 'Google is credited on the photo');
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Enter'); await page.waitForTimeout(400);
    const b = await page.locator('.t-geo-map .gmap').boundingBox(); if (!b) break;
    await page.mouse.click(b.x + b.width * 0.4, b.y + b.height * 0.5); await page.keyboard.press('g'); await page.waitForSelector('.t-geo-res');
  }
  await page.keyboard.press('Enter'); await page.waitForSelector('.end-card');
  ok(await page.evaluate(() => window.__bzg.R.h.kids[0].lib.geoguess.rounds) === 1, 'a finished photo round is recorded');
  await page.screenshot({ path: `${SHOTS}/photo-02-end.png` });
} finally { await browser.close(); srv.kill(); rmSync(SITE, { recursive: true, force: true }); }
for (const e of errors) { fails++; console.error('  ✗ ' + e); }
console.log(`${fails ? '✗' : '✓'} photos: off by default, switched on by a grown-up, a round with a skipped place${fails ? `, ${fails} failures` : ''}`);
process.exit(fails ? 1 : 0);
