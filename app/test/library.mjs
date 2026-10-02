/* library.mjs — every Library tool proves its own facts (selftest), and
   renders without throwing for every band. */
import { allTools } from '../src/library/index.js';
const TOOLS = await allTools();
let fails = 0, n = 0;
const makeCtx = (id, band = '8-10') => ({ id, band, kid: { band, lib: {} }, ui: {}, data: {}, save() {}, render() {}, toast() {}, sfx: { good() {}, bad() {}, click() {}, level() {} }, confetti() {}, say() {}, tick() {}, startRun(t, items) { this.run = { t, items }; }, go() {}, openStop() {} });
for (const t of TOOLS) {
  const id = t.TOOL.id;
  for (const f of ['view', 'act', 'selftest']) if (typeof t[f] !== 'function') { fails++; console.error(`✗ ${id}: no ${f}()`); }
  t.selftest((c, m) => { n++; if (!c) { fails++; if (fails < 30) console.error(`✗ ${id}: ${m}`); } }, makeCtx);
  for (const band of ['6-7', '8-10', '11-14']) {
    const ctx = makeCtx(id, band);
    try { const h = t.view(ctx); if (typeof h !== 'string' || h.length < 50) throw new Error('empty view'); } catch (e) { fails++; console.error(`✗ ${id} view (${band}): ${e.message}`); }
  }
}
console.log(`${fails ? '✗' : '✓'} library: ${TOOLS.length} tools, ${n} self-checks${fails ? `, ${fails} failures` : ''}`);
process.exit(fails ? 1 : 0);
