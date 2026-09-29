/* avatars.mjs — the picker is five packs of eight geography creatures; every
   face has a file that is solid (not a ghost of a badly keyed background); no
   real person or deity is ever in it (the Bee's rule, which the family keeps);
   and a child who chose a face before this picker keeps it. */
import { existsSync, statSync, readFileSync } from 'node:fs';
import { AVATAR_PACKS, AVATARS, AVATAR_NAME, AVATAR_KEPT, avatarFile, newKid } from '../src/model.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.error('  ✗ ' + m); } };
const file = (id) => new URL(`../public/avatars/${id}.webp`, import.meta.url);

// Bizzing Bee's people and gods: none may ever be offered here.
const DENY = ['newton', 'mlk', 'gutenberg', 'nightingale', 'qinshihuang', 'curie', 'gandhi', 'aryabhatta', 'buddha', 'einstein',
  'neuhauser', 'pbell', 'lucas', 'brobinson', 'stover', 'bolden', 'samurai',
  'thor', 'poseidon', 'ra', 'athena', 'hades', 'anubis', 'freya', 'loki', 'apollo', 'isis', 'hanuman', 'lakshmi',
  'amaterasu', 'zeus', 'rama', 'odin', 'krishna', 'shiva', 'ganesha', 'durga', 'saraswati'];

ok(AVATAR_PACKS.length === 5, `exactly 5 packs (got ${AVATAR_PACKS.length})`);
for (const p of AVATAR_PACKS) {
  ok(p.avatars.length === 8, `${p.id}: 8 avatars (got ${p.avatars.length})`);
  ok(p.id && p.name && p.blurb, `${p.id}: has id, name and blurb`);
  ok(!('price' in p) && !('rarity' in p) && !('locked' in p), `${p.id}: no price, rarity or lock — all free`);
}
ok(AVATARS.length === 40 && new Set(AVATARS).size === 40, `40 unique avatar ids (got ${new Set(AVATARS).size} of ${AVATARS.length})`);
ok(!AVATARS.some((a) => AVATAR_KEPT.includes(a)), 'a kept face is not also a picker face');

/* Solidity (a sticker, not a ghost of a badly keyed ground) is checked where
   the pixels are decoded: tools/art/process.py --avatars fails on it. */
for (const id of AVATARS) {
  ok(existsSync(file(id)) && statSync(file(id)).size > 8000, `${id}: has a file in public/avatars/`);
  ok(AVATAR_NAME[id], `${id}: has a name`);
  ok(!DENY.includes(id), `${id}: is a real person or a deity`);
}
for (const id of AVATAR_KEPT) { ok(existsSync(file(id)), `${id}: a kept face still has its file`); ok(!DENY.includes(id), `${id}: kept face on the denylist`); }

ok(avatarFile('panda') === 'panda', 'an old picker face still draws as itself');
ok(avatarFile('zeus') === AVATARS[0] && avatarFile(undefined) === AVATARS[0], 'an unknown id falls back to the first face');
ok(AVATARS.includes(newKid('A', '8-10').avatar), 'newKid defaults to a picker face');
ok(newKid('A', '8-10', 'fennec').avatar === 'fennec', 'newKid keeps a chosen face');
ok(newKid('A', '8-10', 'shiva').avatar === AVATARS[0], 'newKid refuses a face outside the picker');

if (fails) { console.error(`✗ avatars: ${fails} failure(s)`); process.exit(1); }
console.log(`✓ avatars: ${AVATAR_PACKS.length} packs × 8, ${AVATARS.length} faces with files, ${AVATAR_KEPT.length} kept, none on the denylist`);
