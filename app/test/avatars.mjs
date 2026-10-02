/* avatars.mjs — the 96 (family standard v2 §8). The family engine's validate() must
   return [] for the catalogue; every face has a solid file; no real person or deity is
   ever in it (the Bee's denylist); a child who chose a face before the engine keeps it;
   and the family's drop-ins are the family's, byte for byte. */
import { existsSync, statSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const store = {};
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
const { AVATAR_PACKS, AVATARS, AVATAR_NAME, AVATAR_KEPT, avatarFile, newKid } = await import('../src/model.js');
const { CATALOGUE, PACKS, COMMONS, avCtx, stateOf, LEGEND_MILESTONE, worldNo } = await import('../src/avatars.js');
const { validate, buy, buyWorld, sacredSafe, TIERS } = await import('../src/bizzing-avatars.js');
const { MEDALS } = await import('../src/rewards.js');
const { THEMES } = await import('../src/themes.js');
const { migrate } = await import('../src/store.js');
const W = await import('../src/bizzing-wallet.js');

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.error('  ✗ ' + m); } };
const file = (id) => new URL(`../public/avatars/${id}.webp`, import.meta.url);

// Bizzing Bee's people and gods: none may ever be offered here.
const DENY = ['newton', 'mlk', 'gutenberg', 'nightingale', 'qinshihuang', 'curie', 'gandhi', 'aryabhatta', 'buddha', 'einstein',
  'neuhauser', 'pbell', 'lucas', 'brobinson', 'stover', 'bolden', 'samurai',
  'thor', 'poseidon', 'ra', 'athena', 'hades', 'anubis', 'freya', 'loki', 'apollo', 'isis', 'hanuman', 'lakshmi',
  'amaterasu', 'zeus', 'rama', 'odin', 'krishna', 'shiva', 'ganesha', 'durga', 'saraswati'];

const errs = validate(CATALOGUE);
ok(errs.length === 0, `validate(catalogue) returns [] (got: ${errs.slice(0, 5).join('; ')})`);
ok(sacredSafe(CATALOGUE).length === 0, 'no sacred figure in any pack');
ok(AVATARS.length === 96 && new Set(AVATARS).size === 96 && AVATAR_PACKS.length === 12, '96 unique faces in 12 packs');
ok(!AVATARS.some((a) => AVATAR_KEPT.includes(a)), 'a kept face is not also a catalogue face');
/* the worlds: packs 1–12 pair with the six themes, two each, in the themes' order */
ok(THEMES.length === 6 && THEMES.every((t, i) => worldNo(t.id) === i + 1), 'the six themes are worlds 1–6, in order');
ok(Object.keys(LEGEND_MILESTONE).length === 12 && Object.values(LEGEND_MILESTONE).every((m) => MEDALS.some((x) => x.id === m.id)), 'every Legendary waits for a real medal (learning), never time');
for (const a of CATALOGUE) {
  ok(existsSync(file(a.id)) && statSync(file(a.id)).size > 8000, `${a.id}: has a file in public/avatars/`);
  ok(AVATAR_NAME[a.id], `${a.id}: has a name`);
  ok(!DENY.includes(a.id), `${a.id}: is a real person or a deity`);
}
for (const id of AVATAR_KEPT) { ok(existsSync(file(id)), `${id}: a kept face still has its file`); ok(!DENY.includes(id), `${id}: kept face on the denylist`); }

/* what a card says, in plain words, and how it is bought */
const k = newKid('Ahana', '8-10', 'compowl'), h = { parent: { plan: 'free' } };
const ctx = () => avCtx(h, k, []);
const rare1 = CATALOGUE.find((a) => a.tier === 'rare' && a.pack === 1), rare5 = CATALOGUE.find((a) => a.tier === 'rare' && a.pack === 5), leg1 = CATALOGUE.find((a) => a.tier === 'legendary' && a.pack === 1);
ok(stateOf(COMMONS[0], ctx()).say === 'Free for everyone', 'a Common says "Free for everyone"');
ok(/^120 coins · 120 more to go$/.test(stateOf(rare1.id, ctx()).say), `a Rare in an open world says its price and how far (${stateOf(rare1.id, ctx()).say})`);
ok(stateOf(rare5.id, ctx()).say === 'Opens with its world', 'a face in a closed world says so');
ok(/^First: walk every stop in Home Street$/.test(stateOf(leg1.id, ctx()).say), `a Legendary names its milestone first (${stateOf(leg1.id, ctx()).say})`);
ok(!buy('geography', 'Ahana', rare1, ctx()), 'no coins, no face');
W.migrateFrom('geography', 'Ahana', 120);   // (the daily cap stops a test earning 120 in one go)
ok(buy('geography', 'Ahana', rare1, ctx()) && W.balance('Ahana') === 0, 'a Rare costs exactly 120, through the wallet');
ok(!buyWorld('geography', 'Ahana', 3, ctx()), 'a world costs 240: not enough, not opened');
ok(stateOf(rare5.id, { ...ctx(), plan: 'family' }).state !== 'world', 'the family plan opens every world');
ok(newKid('A', '8-10', 'jaguar').avatar === COMMONS[0] && newKid('A', '8-10', 'toucan').avatar === 'toucan', 'a new explorer starts on a Common they chose, never a paid face');
ok(Object.values(TIERS).map((t) => t.price).join() === '0,120,250,500', 'the family prices');

/* a face chosen before tiers is kept: migration grandfathers it, and the world they explore in */
const old = migrate({ v: 5, kids: [{ name: 'Old', avatar: 'jaguar', prefs: { theme: 'desert' } }], parent: { pin: '1234' } });
ok(old.kids[0].owned.includes('jaguar') && old.kids[0].worlds.includes(4) && !old.parent.pin && old.parent.pinHash, 'v6 keeps a child’s face and world, and stores the PIN hashed');
ok(avatarFile('panda') === 'panda', 'an old picker face still draws as itself');
ok(avatarFile('zeus') === AVATARS[0] && avatarFile(undefined) === AVATARS[0], 'an unknown id falls back to the first face');

/* the family's drop-ins, byte for byte (compared with the Hive's checkout when it is here) */
const HIVE = '/home/user/Bizzing_Schedule/integration/';
for (const f of ['bizzing-activity.js', 'bizzing-wallet.js', 'bizzing-avatars.js', 'bizzing-shell.js']) {
  const mine = readFileSync(new URL(`../src/${f}`, import.meta.url));
  if (existsSync(HIVE + f)) ok(createHash('sha256').update(mine).digest('hex') === createHash('sha256').update(readFileSync(HIVE + f)).digest('hex'), `${f} is the family's file, unchanged`);
}
for (const [mine, theirs] of [['../styles/bizzing-shell.css', 'bizzing-shell.css'], ['./shell-check.mjs', 'shell-check.mjs']]) if (existsSync(HIVE + theirs)) ok(readFileSync(new URL(mine, import.meta.url), 'utf8') === readFileSync(HIVE + theirs, 'utf8'), theirs + ' is the family’s, unchanged');
if (existsSync(HIVE + 'bizzing-avatars.css')) ok(readFileSync(new URL('../styles/bizzing-avatars.css', import.meta.url), 'utf8') === readFileSync(HIVE + 'bizzing-avatars.css', 'utf8'), 'bizzing-avatars.css is the family’s, unchanged');

if (fails) { console.error(`✗ avatars: ${fails} failure(s)`); process.exit(1); }
console.log(`✓ avatars: validate() = [] — 96 in 12 packs × 8, tiers 2/3/2/1, ${PACKS.length / 2} worlds × 2 packs, ${AVATAR_KEPT.length} kept faces, none on the denylist`);
