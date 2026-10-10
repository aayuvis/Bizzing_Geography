/* feed-ui.mjs — My Feed in the BUILT app, in Chromium, desktop and phone (FAMILY-STANDARD §6a).

   · checkShell returns [] with the new tab count (My Feed the LAST tab), light and dark;
   · #/feed: about twenty cards then the finished card, nothing sideways at 390px, no third-party
     request (no Street View in the feed), and only the card groups its session uses are loaded;
   · every word on a card passes contrast in all six worlds, by day and by night;
   · a question answers by keyboard AND by touch; a right answer pays one coin, once; a wrong one
     holds, names the right answer, and waits for Continue; j/k move card to card;
   · the grown-ups' switch (behind the PIN) removes the tab and the ☰ row;
   · ?demo writes nothing. */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, symlinkSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { checkShell } from './shell-check.mjs';
import { newHousehold, newKid } from '../src/model.js';
import { INDEX } from '../src/data/feed/index.js';
import { THEMES } from '../src/themes.js';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW || '/opt/node22/lib/node_modules/playwright');

const HERE = resolve(import.meta.dirname, '..'), SITE = resolve(HERE, '.site-feed');
rmSync(SITE, { recursive: true, force: true }); mkdirSync(SITE, { recursive: true });
symlinkSync(resolve(HERE, 'build'), resolve(SITE, 'Bizzing_Geography'));
const port = +(process.env.PORT || 5321), BASE = `http://127.0.0.1:${port}/Bizzing_Geography/`;
const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: SITE, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 700));
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.error('  ✗ ' + m); } else if (process.env.V) console.log('  ✓ ' + m); };
const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined });
const G = Object.fromEntries(INDEX.map((x) => [x.id, x.g]));

const household = () => { const h = newHousehold(), k = newKid('Ahana', '8-10', 'dolphin'); k.worlds = [3, 4, 5, 6]; h.kids.push(k); h.active = k.id; return h; };
const coins = (page) => page.evaluate(() => { const w = JSON.parse(localStorage.getItem('bizzing.wallet') || '{"kids":{}}'); return (w.kids.ahana || {}).coins || 0; });

async function run(vp, tag) {
  const phone = vp.width < 760, errors = [], groups = [];
  const page = await browser.newPage({ viewport: vp, deviceScaleFactor: 1, hasTouch: phone });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => { const u = r.url(); if (!u.startsWith(`http://127.0.0.1:${port}/`) && !u.startsWith('data:')) errors.push('third-party request: ' + u); const m = /assets\/g-(L\d+|any)-/.exec(u); if (m) groups.push(m[1]); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  const h = household();
  await page.addInitScript((h) => { if (!localStorage.getItem('bzg_household')) localStorage.setItem('bzg_household', JSON.stringify(h)); }, h);
  await page.goto(BASE + '#/home'); await page.waitForSelector('[data-bz=home]');

  /* the shell, measured, with six tabs (Play before it) and My Feed last */
  const tabSel = phone ? '[data-bz=tabbar] a' : '[data-bz=tabs] a';
  const hrefs = await page.$$eval(tabSel, (as) => as.map((a) => a.getAttribute('href')));
  ok(hrefs.length === 6 && hrefs.at(-2) === '#/play' && hrefs.at(-1) === '#/feed', `${tag}: six tabs, Play then My Feed last (${hrefs.join(' ')})`);
  ok(await page.locator('[data-bz=drawer] a[href="#/feed"]').count() === 1, `${tag}: a My Feed row in ☰`);
  for (const mode of ['light', 'dark']) {
    await page.evaluate((m) => { document.documentElement.setAttribute('data-mode', m); const w = JSON.parse(localStorage.getItem('bizzing.wallet') || '{"v":1,"kids":{}}'); w.kids.ahana = w.kids.ahana || { coins: 0, ledger: [] }; window.__c0 = w.kids.ahana.coins; w.kids.ahana.coins = 40; localStorage.setItem('bizzing.wallet', JSON.stringify(w)); window.__bzg.R.render(); }, mode);
    await page.waitForTimeout(200);
    const sf = await checkShell(page, { phone });
    console.log(`  checkShell ${tag} ${mode}: ${JSON.stringify(sf)}`);
    ok(!sf.length, `${tag} ${mode}: checkShell — ${sf.join('; ')}`);
    await page.evaluate(() => { const w = JSON.parse(localStorage.getItem('bizzing.wallet')); w.kids.ahana.coins = window.__c0; localStorage.setItem('bizzing.wallet', JSON.stringify(w)); window.__bzg.R.render(); });
  }
  await page.evaluate(() => { document.documentElement.setAttribute('data-mode', 'light'); window.__bzg.R.render(); });

  /* the feed: twenty, then the end; nothing sideways; only the groups its session needs */
  ok(!groups.length, `${tag}: no card group loads before #/feed (${groups.join(',')})`);
  await page.click(`${tabSel}[href="#/feed"]`);
  await page.waitForSelector('.bzf-list [data-bz=feed-end]');
  const n = await page.locator('.bzf-list .bzf-card:not(.bzf-end)').count();
  ok(n >= 15 && n <= 20, `${tag}: a session of about twenty (${n}), then the finished card`);
  ok(await page.locator('.bzf-list .bzf-card').last().getAttribute('data-bz') === 'feed-end' && !/load more|see more/i.test(await page.locator('.bzf-list').innerText()), `${tag}: it ends — nothing loads more`);
  const sess = await page.evaluate(() => window.__bzg.R.h.kids[0].feed.sess.list.map((x) => x.id));
  const need = [...new Set(sess.map((id) => G[id]))].sort();
  ok(JSON.stringify([...new Set(groups)].sort()) === JSON.stringify(need), `${tag}: loads only its session's groups (${[...new Set(groups)].sort()} for ${need})`);
  ok(!(await page.$$eval('.bzf-list img', (im) => im.filter((i) => !i.getAttribute('src').startsWith('art/') && !i.getAttribute('src').startsWith('flags/')).map((i) => i.src))).length, `${tag}: every picture is the app's own painting or flag`);
  const W = vp.width;
  const wide = await page.evaluate((W) => { if (document.documentElement.scrollWidth > W + 1) return 'page ' + document.documentElement.scrollWidth; const el = [...document.querySelectorAll('.feed-page *')].find((e) => e.getBoundingClientRect().right > W + 1); return el ? el.className : ''; }, W);
  ok(!wide, `${tag}: nothing past ${W}px — ${wide}`);
  ok(!/\[object Object\]|\bundefined\b|\bNaN\b/.test(await page.locator('.feed-page').innerText()), `${tag}: no broken words`);

  /* contrast: every word on every card, six worlds × day and night */
  for (const t of THEMES) for (const mode of ['light', 'dark']) {
    await page.evaluate(([id, m]) => { const k = window.__bzg.R.h.kids[0]; k.prefs.theme = id; document.documentElement.setAttribute('data-mode', m); window.__bzg.R.render(); }, [t.id, mode]);
    await page.waitForTimeout(60);
    const low = await page.evaluate(() => {
      const rgb = (s) => { const m = s.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 }; };
      const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
      const bgOf = (el) => { const layers = []; for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.a > 0) { layers.push(c); if (c.a >= 1) break; } }
        let out = { r: 255, g: 255, b: 255 }; for (const c of layers.reverse()) out = { r: c.r * c.a + out.r * (1 - c.a), g: c.g * c.a + out.g * (1 - c.a), b: c.b * c.a + out.b * (1 - c.a) }; return out; };
      const bad = [];
      for (const el of document.querySelectorAll('.bzf-list *')) {
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim()) || !el.checkVisibility()) continue;
        const cs = getComputedStyle(el), fg = rgb(cs.color), bg = bgOf(el);
        const blend = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) };
        const [a, b] = [lum(blend), lum(bg)].sort((x, y) => y - x), ratio = (a + 0.05) / (b + 0.05);
        const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
        if (ratio < (big ? 3 : 4.5)) bad.push(`${el.className || el.tagName} ${ratio.toFixed(2)}`);
      }
      return bad;
    });
    ok(!low.length, `${tag} ${t.id} ${mode}: every word on the feed passes contrast${low.length ? ' — ' + low.slice(0, 3).join(', ') : ''}`);
  }
  await page.evaluate(() => { const k = window.__bzg.R.h.kids[0]; k.prefs.theme = 'atlas'; document.documentElement.setAttribute('data-mode', 'light'); window.__bzg.R.render(); });

  /* j/k move card to card */
  await page.locator('.bzf-card').first().focus(); await page.keyboard.press('j');
  ok(await page.evaluate(() => [...document.querySelectorAll('.bzf-card')].indexOf(document.activeElement) === 1), `${tag}: j moves to the next card`);
  await page.keyboard.press('k');
  ok(await page.evaluate(() => [...document.querySelectorAll('.bzf-card')].indexOf(document.activeElement) === 0), `${tag}: k moves back`);

  /* questions: right by keyboard, wrong by touch (or a click on a desktop) */
  const qids = await page.$$eval('.bzf-card', (cs) => cs.filter((c) => c.querySelector('.bzf-opt')).map((c) => c.dataset.id));
  ok(qids.length >= 2 && qids.length <= 5, `${tag}: between two and five questions (${qids.length})`);
  const card = (id) => `.bzf-card[data-id="${id}"]`;
  const c0 = await coins(page);
  await page.locator(`${card(qids[0])} [data-bzf=ans][data-o="0"]`).focus(); await page.keyboard.press('Enter');
  await page.waitForSelector(`${card(qids[0])} .bzf-after.ok`);
  ok(await coins(page) === c0 + 1, `${tag}: a right answer (by keyboard) pays one coin`);
  const wrong = page.locator(`${card(qids[1])} [data-bzf=ans][data-o="1"]`);
  if (phone) await wrong.tap(); else await wrong.click();
  await page.waitForSelector(`${card(qids[1])} [data-bzf=cont]`);
  ok(/Not this time — it is “/.test(await page.locator(card(qids[1])).innerText()) && await coins(page) === c0 + 1, `${tag}: a wrong answer (by ${phone ? 'touch' : 'click'}) holds and names the right one, and pays nothing`);
  ok(await page.locator(`${card(qids[1])} .bzf-row a`).count() === 0, `${tag}: and waits — no way on but Continue`);
  const cont = page.locator(`${card(qids[1])} [data-bzf=cont]`);
  if (phone) await cont.tap(); else await cont.click();
  ok(await page.locator(`${card(qids[1])} [data-bzf=cont]`).count() === 0 && await page.locator(`${card(qids[1])} .bzf-row a`).count() === 1, `${tag}: Continue lets it go`);
  /* once: the same card answered right again pays nothing */
  await page.evaluate(() => window.__bzg.R.ui.feedPlay = {}); await page.evaluate(() => window.__bzg.R.render());
  await page.locator(`${card(qids[0])} [data-bzf=ans][data-o="0"]`).focus(); await page.keyboard.press('Enter');
  await page.waitForSelector(`${card(qids[0])} .bzf-after.ok`);
  ok(await coins(page) === c0 + 1, `${tag}: a card's question pays once, never twice`);
  const scrolled = await coins(page); await page.mouse.wheel(0, 3000); await page.waitForTimeout(200);
  ok(await coins(page) === scrolled, `${tag}: scrolling earns nothing`);

  /* the grown-ups' switch, behind the PIN */
  await page.evaluate(() => window.__bzg.go('grownups'));
  await page.fill('#pin', '1234'); await page.click('[data-act=gate]'); await page.waitForSelector('[data-act=feedToggle]');
  await page.click('[data-act=feedToggle]');
  ok(await page.locator(`${tabSel}[href="#/feed"]`).count() === 0 && await page.locator(tabSel).count() === 5 && await page.locator('[data-bz=drawer] a[href="#/feed"]').count() === 0, `${tag}: switched off, the tab and the ☰ row are gone`);
  await page.evaluate(() => window.__bzg.go('feed'));
  ok(/switched off/.test(await page.locator('.feed-page').innerText()) && await page.locator('.bzf-card').count() === 0, `${tag}: #/feed says it is switched off`);
  await page.evaluate(() => window.__bzg.go('grownups')); await page.fill('#pin', '1234'); await page.click('[data-act=gate]');
  await page.click('[data-act=feedToggle]');
  ok(await page.locator(`${tabSel}[href="#/feed"]`).count() === 1, `${tag}: and back on`);
  ok(!errors.length, `${tag}: no errors, no third-party requests — ${errors.slice(0, 3).join(' | ')}`);
  await page.close();
}

/* a city card opens the Map Explorer ON that city — its pin and its line, not just its country */
async function cityLink() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const card = INDEX.find((x) => x.kind === 'city'), pid = card.id.replace(/^ci-/, '');
  await page.goto(BASE + '?demo#/lib/explorer/' + pid); await page.waitForSelector('.t-ex-pin', { timeout: 15000 }).catch(() => {});
  const t = await page.locator('.t-ex-pin').innerText().catch(() => '');
  ok(/a city in/.test(t), `a city card's link (#/lib/explorer/${pid}) opens the map on that city: “${t}”`);
  await page.close();
}

async function demo() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await page.goto(BASE + '?demo#/feed'); await page.waitForSelector('.bzf-list [data-bz=feed-end]');
  const before = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));
  const q = page.locator('.bzf-card [data-bzf=ans][data-o="0"]').first(); await q.tap(); await page.waitForTimeout(400);
  const after = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));
  ok(before === after && !/bzg_household|bizzing\.wallet/.test(after), '?demo: the feed writes nothing');
  await page.close();
}

try {
  await run({ width: 1280, height: 800 }, 'desktop');
  await run({ width: 390, height: 844 }, 'phone');
  await demo();
  await cityLink();
} finally { await browser.close(); srv.kill(); rmSync(SITE, { recursive: true, force: true }); }
if (fails) { console.error(`✗ feed-ui: ${fails} failure(s)`); process.exit(1); }
console.log('✓ feed-ui: My Feed the last tab, checkShell [], twenty and then the end, only its own groups, contrast in 6 worlds × 2, keyboard and touch, pays once, the PIN switch, ?demo writes nothing');
