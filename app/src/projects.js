/* projects.js — the things a child MAKES inside a course, and the checks that
   know when it is made. Five builders, each with a live checklist that ticks as
   the child builds, so "done" is something the app can see, not a tap of honesty:

     mapmaker  paint a map on a grid — land, sea, lakes, rivers, mountains — and
               place symbols; the key draws itself. Checks count tiles, find a
               lake with land all round, trace a river from a mountain to the sea.
     route     plan a journey on the REAL map: tap countries in order. Checks come
               from the data — each country must border the last (COUNTRIES
               .borders), start landlocked, end on a coast, one per continent.
     order     put cards in order (the Earth's layers, a river from source to sea,
               the Earth's great events — from EARTH, in its own order).
     sort      put things in their bins: landlocked or coast, built or natural,
               north or south of the Equator — all decided by the data.
     flag      design a flag and say what each colour means.

   Every engine: init(cfg, r) → a fresh state · view(cfg, st) · act(cfg, st, name, arg)
   → a message or null · goals(cfg, st) → [{t, ok}] · thumb(cfg, st) · solve(cfg) → a
   state that meets every goal (test/courses.mjs proves each project can be finished).
   Everything is keyboard AND touch: every control is a button; the map-maker has an
   arrow-key cursor. Nothing a child makes leaves the device. */
import { gi, ico } from './icons.js';
import { byCc, QUIZ, CONTINENTS } from './geo.js';
import { worldSVG } from './map.js';
import { LANDMARKS } from './data/landmarks.js';
import { seeded, shuffle } from './rand.js';
import { esc } from './ui.js';

const A = (name, arg = '') => `data-act="proj" data-arg="${esc(name)}|${esc(String(arg))}"`;

/* ================================================================== map-maker */
export const TILES = {
  sea: { n: 'Sea', c: '#4F9ED8' }, land: { n: 'Land', c: '#9BD17A' }, sand: { n: 'Beach', c: '#F2D38B' },
  forest: { n: 'Forest', c: '#3E8E4E' }, mountain: { n: 'Mountain', c: '#8E7F6C' }, lake: { n: 'Lake', c: '#7FD0F2' },
  river: { n: 'River', c: '#2F86D6' }, desert: { n: 'Desert', c: '#E9C46A' }, ice: { n: 'Ice', c: '#EAF6FD' },
  grass: { n: 'Grassland', c: '#C5D86D' }, plateau: { n: 'Plateau', c: '#B99A6B' }, valley: { n: 'Valley', c: '#6FBF6A' },
  floor: { n: 'Floor', c: '#F1E3C8' }, wall: { n: 'Wall', c: '#8C6A4A' }, rug: { n: 'Rug', c: '#E07A5F' },
  bed: { n: 'Bed', c: '#7FA7D9' }, table: { n: 'Table', c: '#B08968' }, door: { n: 'Door', c: '#5D4037' },
  road: { n: 'Road', c: '#C9A66B' },
};
export const SYMS = {
  house: { n: 'House', g: '🏠' }, tree: { n: 'Tree', g: '🌳' }, treasure: { n: 'Treasure', g: '❌' }, camp: { n: 'Camp', g: '⛺' },
  port: { n: 'Port', g: '⚓' }, capital: { n: 'Capital city', g: '⭐' }, bridge: { n: 'Bridge', g: '🌉' }, tower: { n: 'Lookout', g: '🗼' },
  camel: { n: 'Camel', g: '🐪' }, monkey: { n: 'Monkey', g: '🐒' }, parrot: { n: 'Parrot', g: '🦜' }, penguin: { n: 'Penguin', g: '🐧' },
  lion: { n: 'Lion', g: '🦁' }, zebra: { n: 'Zebra', g: '🦓' }, seal: { n: 'Seal', g: '🦭' }, scorpion: { n: 'Scorpion', g: '🦂' },
  volcano: { n: 'Volcano', g: '🌋' }, north: { n: 'North arrow', g: '⬆️' },
};
const COLS = 'ABCDEFGHIJKLMNOP';
const at = (cfg, st, x, y) => st.t[y * cfg.w + x];
const nb4 = (cfg, i) => { const x = i % cfg.w, y = Math.floor(i / cfg.w), o = []; if (x) o.push(i - 1); if (x < cfg.w - 1) o.push(i + 1); if (y) o.push(i - cfg.w); if (y < cfg.h - 1) o.push(i + cfg.w); return o; };
const MAPGOAL = {
  count: (cfg, st, g) => st.t.filter((x) => x === g.tile).length >= g.min,
  exact: (cfg, st, g) => st.t.filter((x) => x === g.tile).length === g.n,
  row: (cfg, st, g) => { const y = g.row < 0 ? cfg.h + g.row : g.row; return st.t.slice(y * cfg.w, (y + 1) * cfg.w).every((x) => x === g.tile); },
  rowAny: (cfg, st, g) => { const y = g.row < 0 ? cfg.h + g.row : g.row; return st.t.slice(y * cfg.w, (y + 1) * cfg.w).every((x) => g.tiles.includes(x)); },
  sym: (cfg, st, g) => Object.values(st.s).filter((x) => x === g.sym).length >= (g.min || 1),
  anySym: (cfg, st, g) => Object.values(st.s).filter((x) => g.syms.includes(x)).length >= (g.min || 1),
  kinds: (cfg, st, g) => new Set(st.t.filter((x) => g.of.includes(x))).size >= g.min,
  edge: (cfg, st, g) => st.t.every((x, i) => { const X = i % cfg.w, Y = Math.floor(i / cfg.w); return !(X === 0 || Y === 0 || X === cfg.w - 1 || Y === cfg.h - 1) || x === g.tile; }),
  /* a lake is lake water whose every neighbour is lake or land — it touches no sea */
  lake: (cfg, st) => { const L = st.t.map((x, i) => (x === 'lake' ? i : -1)).filter((i) => i >= 0); return L.length > 0 && L.every((i) => nb4(cfg, i).every((j) => st.t[j] !== 'sea')); },
  /* a river: river tiles joined up, one end beside a mountain, the other beside the sea */
  river: (cfg, st, g) => {
    const R = new Set(st.t.map((x, i) => (x === 'river' ? i : -1)).filter((i) => i >= 0));
    if (R.size < (g.min || 3)) return false;
    const starts = [...R].filter((i) => nb4(cfg, i).some((j) => st.t[j] === 'mountain'));
    for (const s of starts) {
      const seen = new Set([s]), q = [s];
      while (q.length) { const i = q.shift(); if (nb4(cfg, i).some((j) => st.t[j] === 'sea')) return true; for (const j of nb4(cfg, i)) if (R.has(j) && !seen.has(j)) { seen.add(j); q.push(j); } }
    }
    return false;
  },
  /* a symbol on the right ground: a port on land beside the sea, a camel on the desert… */
  on: (cfg, st, g) => Object.entries(st.s).some(([i, s]) => s === g.sym && g.tiles.includes(st.t[+i]) && (!g.beside || nb4(cfg, +i).some((j) => st.t[j] === g.beside))),
  /* a symbol on a tile the child must name by its grid square */
  gridAnswer: (cfg, st) => { const i = Object.keys(st.s).find((k) => st.s[k] === 'treasure'); return i != null && st.ans === `${COLS[+i % cfg.w]}${Math.floor(+i / cfg.w) + 1}`; },
};
const mapmaker = {
  init: (cfg) => ({ t: Array(cfg.w * cfg.h).fill(cfg.base || 'sea'), s: {}, tool: cfg.tiles[1] || cfg.tiles[0], cur: 0, fill: false, ans: '' }),
  view(cfg, st) {
    const W = cfg.w, H = cfg.h, cell = 40, used = [...new Set(Object.values(st.s))];
    const tileBtns = cfg.tiles.map((t, i) => `<button class="pj-sw${st.tool === t ? ' on' : ''}" ${A('tool', t)} aria-pressed="${st.tool === t}" title="${TILES[t].n} (${i + 1})"><i style="background:${TILES[t].c}"></i>${TILES[t].n}</button>`).join('');
    const symBtns = (cfg.syms || []).map((s) => `<button class="pj-sw${st.tool === 's:' + s ? ' on' : ''}" ${A('tool', 's:' + s)} aria-pressed="${st.tool === 's:' + s}">${gi(SYMS[s].g)} ${SYMS[s].n}</button>`).join('');
    const svg = `<svg class="pj-map" viewBox="${cfg.grid ? -26 : 0} ${cfg.grid ? -26 : 0} ${W * cell + (cfg.grid ? 26 : 0)} ${H * cell + (cfg.grid ? 26 : 0)}" role="grid" aria-label="Your map. Arrow keys move the square, Space paints, F fills.">
      ${st.t.map((t, i) => `<rect x="${(i % W) * cell}" y="${Math.floor(i / W) * cell}" width="${cell}" height="${cell}" fill="${TILES[t].c}" ${A('paint', i)} class="pj-cell"/>`).join('')}
      ${Object.entries(st.s).map(([i, s]) => `<text x="${(+i % W) * cell + cell / 2}" y="${Math.floor(+i / W) * cell + cell / 2 + 8}" text-anchor="middle" font-size="24" pointer-events="none">${SYMS[s].g}</text>`).join('')}
      <rect x="${(st.cur % W) * cell + 2}" y="${Math.floor(st.cur / W) * cell + 2}" width="${cell - 4}" height="${cell - 4}" class="pj-cur"/>
      ${cfg.grid ? Array.from({ length: W }, (_, x) => `<text x="${x * cell + cell / 2}" y="-8" text-anchor="middle" class="pj-gl">${COLS[x]}</text>`).join('') + Array.from({ length: H }, (_, y) => `<text x="-13" y="${y * cell + cell / 2 + 5}" text-anchor="middle" class="pj-gl">${y + 1}</text>`).join('') : ''}
      ${cfg.grid ? Array.from({ length: W + 1 }, (_, x) => `<line x1="${x * cell}" y1="0" x2="${x * cell}" y2="${H * cell}" class="pj-gridl"/>`).join('') + Array.from({ length: H + 1 }, (_, y) => `<line x1="0" y1="${y * cell}" x2="${W * cell}" y2="${y * cell}" class="pj-gridl"/>`).join('') : ''}
    </svg>`;
    const ask = cfg.goals.some((g) => g.k === 'gridAnswer') ? `<label class="pj-ask">Which square is your treasure in? <input class="inp" id="pj-ans" data-proj-input="ans" value="${esc(st.ans || '')}" maxlength="3" placeholder="e.g. C4" autocomplete="off"></label>` : '';
    return `<div class="pj-mm">
      <div class="pj-tools" role="toolbar" aria-label="Paint with">${tileBtns}${symBtns}<button class="pj-sw${st.tool === 'erase' ? ' on' : ''}" ${A('tool', 'erase')}>${ico('cross')} Rub out symbol</button>
        <button class="pj-sw${st.fill ? ' on' : ''}" ${A('fill')} aria-pressed="${st.fill}" title="Fill (F)">${ico('drop')} Fill</button><button class="pj-sw" ${A('reset')}>↺ Start again</button></div>
      <div class="pj-stage" id="pj-stage" tabindex="0" data-proj-keys="mm">${svg}</div>
      ${used.length ? `<div class="pj-key"><b>Key</b>${used.map((s) => `<span>${SYMS[s].g} ${SYMS[s].n}</span>`).join('')}</div>` : ''}
      ${ask}
    </div>`;
  },
  act(cfg, st, name, arg) {
    if (name === 'tool') { st.tool = arg; return null; }
    if (name === 'fill') { st.fill = !st.fill; return null; }
    if (name === 'reset') { Object.assign(st, mapmaker.init(cfg), { tool: st.tool }); return null; }
    if (name === 'key') {
      const W = cfg.w, H = cfg.h, x = st.cur % W, y = Math.floor(st.cur / W);
      if (arg === 'ArrowLeft' && x) st.cur--; else if (arg === 'ArrowRight' && x < W - 1) st.cur++;
      else if (arg === 'ArrowUp' && y) st.cur -= W; else if (arg === 'ArrowDown' && y < H - 1) st.cur += W;
      else if (arg === ' ' || arg === 'Enter') return mapmaker.act(cfg, st, 'paint', st.cur);
      else if (arg === 'f' || arg === 'F') { st.fill = !st.fill; }
      else if (/^[1-9]$/.test(arg) && cfg.tiles[+arg - 1]) st.tool = cfg.tiles[+arg - 1];
      return null;
    }
    if (name === 'paint') {
      const i = +arg; st.cur = i;
      if (st.tool === 'erase') { delete st.s[i]; return null; }
      if (st.tool.startsWith('s:')) { const s = st.tool.slice(2); if (st.s[i] === s) delete st.s[i]; else st.s[i] = s; return null; }
      if (st.fill) { const from = st.t[i]; if (from === st.tool) return null; const q = [i]; st.t[i] = st.tool; while (q.length) { const j = q.pop(); for (const n of nb4(cfg, j)) if (st.t[n] === from) { st.t[n] = st.tool; q.push(n); } } return null; }
      st.t[i] = st.tool; return null;
    }
    if (name === 'ans') { st.ans = String(arg).toUpperCase().replace(/\s/g, ''); return null; }
    return null;
  },
  goals: (cfg, st) => cfg.goals.map((g) => ({ t: g.t, ok: !!MAPGOAL[g.k](cfg, st, g) })),
  thumb(cfg, st) { const W = cfg.w, c = 6; return `<svg viewBox="0 0 ${W * c} ${cfg.h * c}" class="pj-thumb">${st.t.map((t, i) => `<rect x="${(i % W) * c}" y="${Math.floor(i / W) * c}" width="${c}" height="${c}" fill="${TILES[t].c}"/>`).join('')}</svg>`; },
  /* a state that meets the goals — built from the goals themselves, for the tests */
  solve(cfg) {
    const st = mapmaker.init(cfg), W = cfg.w, H = cfg.h, idx = (x, y) => y * W + x;
    const edge = cfg.goals.find((g) => g.k === 'edge'), sea = edge ? edge.tile : 'sea';
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) st.t[idx(x, y)] = cfg.base === 'floor' ? 'floor' : 'land';
    if (cfg.base !== 'floor' && !edge && !cfg.goals.some((g) => g.k === 'river' || g.k === 'on')) for (let i = 0; i < st.t.length; i++) st.t[i] = 'land';
    let cx = 1, cy = 1;
    const put = (t, n) => { for (let k = 0; k < n; k++) { st.t[idx(cx, cy)] = t; cx++; if (cx >= W - 1) { cx = 1; cy++; } } };
    for (const g of cfg.goals) {
      if (g.k === 'river') { const y = H - 2; st.t[idx(1, y)] = 'mountain'; for (let x = 2; x < W - 1; x++) st.t[idx(x, y)] = 'river'; st.t[idx(W - 1, y)] = 'sea'; }
      if (g.k === 'lake') { st.t[idx(Math.floor(W / 2), Math.floor(H / 2))] = 'lake'; }
    }
    for (const g of cfg.goals) {
      if (g.k === 'count') put(g.tile, g.min);
      if (g.k === 'kinds') g.of.slice(0, g.min).forEach((t) => put(t, 1));
    }
    let si = idx(Math.floor(W / 2) - 2, 2), onN = 0;
    for (const g of cfg.goals) {
      if (g.k === 'sym') for (let k = 0; k < (g.min || 1); k++) st.s[si++] = g.sym;
      if (g.k === 'anySym') for (let k = 0; k < (g.min || 1); k++) st.s[si++] = g.syms[0];
      if (g.k === 'on') { const y = H - 3 - onN * 2; onN++; const i = idx(W - 3, y); st.t[i] = g.tiles[0]; if (g.beside) { st.t[idx(W - 2, y)] = g.beside; if (g.beside === 'sea') st.t[idx(W - 1, y)] = 'sea'; } st.s[i] = g.sym; }
      if (g.k === 'gridAnswer') { const i = idx(2, 2); st.s[i] = 'treasure'; st.ans = `${COLS[2]}3`; }
    }
    if (edge) for (let i = 0; i < st.t.length; i++) { const X = i % W, Y = Math.floor(i / W); if (X === 0 || Y === 0 || X === W - 1 || Y === H - 1) st.t[i] = sea; }
    for (const g of cfg.goals) {
      if (g.k === 'exact') { for (let i = 0; i < st.t.length; i++) if (st.t[i] === g.tile) st.t[i] = cfg.base || 'land'; for (let k = 0; k < g.n; k++) st.t[idx(1 + (k % (W - 2)), H - 2 - Math.floor(k / (W - 2)))] = g.tile; }
      if (g.k === 'row' || g.k === 'rowAny') { const y = g.row < 0 ? H + g.row : g.row; for (let x = 0; x < W; x++) st.t[idx(x, y)] = g.tile || g.tiles[0]; }
    }
    return st;
  },
};

/* ================================================================== route */
const ROUTEGOAL = {
  len: (cfg, st, g) => st.p.length >= g.min,
  landlockedStart: (cfg, st) => st.p.length > 0 && byCc[st.p[0]].landlocked,
  coastEnd: (cfg, st) => st.p.length > 1 && !byCc[st.p[st.p.length - 1]].landlocked,
  continents: (cfg, st, g) => new Set(st.p.map((c) => byCc[c].cont)).size >= g.min,
  inCont: (cfg, st, g) => st.p.length > 0 && st.p.every((c) => byCc[c].cont === g.cont),
  bigger: (cfg, st, g) => st.p.length >= g.min && st.p.every((c, i) => !i || byCc[c].area < byCc[st.p[i - 1]].area),
  quadrants: (cfg, st) => new Set(st.p.map((c) => (byCc[c].at[0] >= 0 ? 'N' : 'S') + (byCc[c].at[1] >= 0 ? 'E' : 'W'))).size === 4,
};
const route = {
  init: () => ({ p: [] }),
  view(cfg, st) {
    const fill = Object.fromEntries(st.p.map((c) => [c, 'hl']));
    const pins = st.p.map((c, i) => ({ at: byCc[c].at, cls: 'red', r: 8, label: String(i + 1) }));
    const cont = cfg.cont ? CONTINENTS.find((c) => c.id === cfg.cont) : null;
    return `<div class="pj-route">
      ${worldSVG({ key: 'proj-route', tap: true, fill, pins, arcs: st.p.slice(1).map((c, i) => [byCc[st.p[i]].at, byCc[c].at]), label: 'Tap countries to add them to your plan' })}
      <ol class="pj-chips">${st.p.map((c, i) => `<li>${i + 1}. ${byCc[c].flag || ''} ${esc(byCc[c].name)}</li>`).join('') || '<li class="muted">Tap a country on the map to begin.</li>'}</ol>
      <div class="row gap">${st.p.length ? `<button class="btn" ${A('undo')}>↶ Take back the last one</button>` : ''}${st.p.length ? `<button class="btn" ${A('reset')}>↺ Start again</button>` : ''}</div>
      ${cont ? '' : ''}</div>`;
  },
  act(cfg, st, name, arg) {
    if (name === 'undo') { st.p.pop(); return null; }
    if (name === 'reset') { st.p = []; return null; }
    if (name === 'tap') {
      const t = JSON.parse(arg), c = byCc[t.cc];
      if (!c || !c.quiz) return 'That is not one of the 195 countries — try another.';
      if (st.p.includes(c.cc)) return `${c.name} is already on your plan.`;
      if (cfg.rule === 'neighbours' && st.p.length && !byCc[st.p[st.p.length - 1]].borders.includes(c.cc)) return `${c.name} does not share a border with ${byCc[st.p[st.p.length - 1]].name}. Pick a neighbour.`;
      if (cfg.cont && c.cont !== cfg.cont) return `${c.name} is not in ${cfg.cont}.`;
      if (cfg.max && st.p.length >= cfg.max) return `Your plan is full (${cfg.max}). Take one back first.`;
      st.p.push(c.cc); return null;
    }
    return null;
  },
  goals: (cfg, st) => cfg.goals.map((g) => ({ t: g.t, ok: !!ROUTEGOAL[g.k](cfg, st, g) })),
  thumb: (cfg, st) => `<span class="pj-thumbtx">${st.p.map((c) => byCc[c].flag || '🏳️').join(' → ')}</span>`,
  solve(cfg) {
    const need = cfg.goals;
    if (need.some((g) => g.k === 'quadrants')) { const q = (c) => (c.at[0] >= 0 ? 'N' : 'S') + (c.at[1] >= 0 ? 'E' : 'W'); const out = []; for (const k of ['NE', 'NW', 'SE', 'SW']) out.push(QUIZ.find((c) => q(c) === k && !out.includes(c.cc)).cc); const min = (need.find((g) => g.k === 'len') || { min: 0 }).min; for (const c of QUIZ) { if (out.length >= min) break; if (!out.includes(c.cc)) out.push(c.cc); } return { p: out }; }
    if (need.some((g) => g.k === 'continents') && cfg.rule !== 'neighbours') { const out = []; const n = need.find((g) => g.k === 'continents').min; for (const c of ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'].slice(0, n)) out.push(QUIZ.find((x) => x.cont === c).cc); const min = (need.find((g) => g.k === 'len') || { min: 0 }).min; for (const c of QUIZ) { if (out.length >= min) break; if (!out.includes(c.cc)) out.push(c.cc); } return { p: out }; }
    if (need.some((g) => g.k === 'bigger')) { const n = need.find((g) => g.k === 'bigger').min; return { p: [...(cfg.cont ? QUIZ.filter((x) => x.cont === cfg.cont) : QUIZ)].sort((a, b) => b.area - a.area).slice(0, n).map((c) => c.cc) }; }
    if (cfg.rule === 'free') { const min = (need.find((g) => g.k === 'len') || { min: 1 }).min; return { p: QUIZ.filter((c) => !cfg.cont || c.cont === cfg.cont).slice(0, min).map((c) => c.cc) }; }
    /* a neighbour walk: from a landlocked country to the coast if asked, long enough */
    const min = (need.find((g) => g.k === 'len') || { min: 2 }).min;
    const cn = need.find((g) => g.k === 'continents');
    const start = need.some((g) => g.k === 'landlockedStart') ? QUIZ.filter((c) => c.landlocked && (!cfg.cont || c.cont === cfg.cont)) : QUIZ.filter((c) => (!cfg.cont || c.cont === cfg.cont) && (!cn || c.cont === 'North America'));
    for (const s of start) {
      const walk = (p) => { if (p.length > 12) return null; if (p.length >= min && (!need.some((g) => g.k === 'coastEnd') || !byCc[p[p.length - 1]].landlocked) && (!cn || new Set(p.map((c) => byCc[c].cont)).size >= cn.min)) return p; for (const n of byCc[p[p.length - 1]].borders) if (byCc[n] && byCc[n].quiz && !p.includes(n) && (!cfg.cont || byCc[n].cont === cfg.cont)) { const r = walk([...p, n]); if (r) return r; } return null; };
      const r = walk([s.cc]); if (r) return { p: r };
    }
    return { p: [] };
  },
};

/* ================================================================== order */
const order = {
  init: (cfg, r) => { let o = shuffle(cfg.items.map((_, i) => i), r); if (o.every((x, i) => x === i)) o = o.reverse(); return { o, pick: null }; },
  view(cfg, st) {
    return `<div class="pj-order"><p class="muted small">${esc(cfg.label)} — tap a card, then tap where it should go. Or use ↑ and ↓.</p>
      <ol class="pj-ol">${st.o.map((it, i) => `<li><button class="pj-card${st.pick === i ? ' on' : ''}" ${A('pick', i)} aria-pressed="${st.pick === i}"><b>${i + 1}</b> ${esc(cfg.items[it])}</button>
        <span class="pj-ud"><button ${A('up', i)} aria-label="Move up" ${i ? '' : 'disabled'}>↑</button><button ${A('down', i)} aria-label="Move down" ${i < st.o.length - 1 ? '' : 'disabled'}>↓</button></span></li>`).join('')}</ol></div>`;
  },
  act(cfg, st, name, arg) {
    const i = +arg, sw = (a, b) => { [st.o[a], st.o[b]] = [st.o[b], st.o[a]]; };
    if (name === 'pick') { if (st.pick == null) st.pick = i; else { sw(st.pick, i); st.pick = null; } return null; }
    if (name === 'up' && i > 0) sw(i, i - 1);
    if (name === 'down' && i < st.o.length - 1) sw(i, i + 1);
    return null;
  },
  goals: (cfg, st) => [{ t: `Everything in order: ${cfg.label}`, ok: st.o.every((x, i) => x === i) }],
  thumb: (cfg) => `<span class="pj-thumbtx">${cfg.items.slice(0, 3).map(esc).join(' → ')}…</span>`,
  solve: (cfg) => ({ o: cfg.items.map((_, i) => i), pick: null }),
};

/* ================================================================== sort */
/* the bins and the truth come from the data, never typed */
const SORTS = {
  landlocked: { bins: ['Has a coast', 'Landlocked'], pool: () => QUIZ.filter((c) => c.area > 20000), name: (c) => `${c.flag || ''} ${c.name}`, bin: (c) => (c.landlocked ? 1 : 0) },
  hemisphere: { bins: ['North of the Equator', 'South of the Equator'], pool: () => QUIZ.filter((c) => Math.abs(c.at[0]) > 8), name: (c) => `${c.flag || ''} ${c.name}`, bin: (c) => (c.at[0] >= 0 ? 0 : 1) },
  builtNatural: { bins: ['Built by people', 'Natural wonder'], pool: () => LANDMARKS, name: (l) => l.name, bin: (l) => (l.kind === 'natural' ? 1 : 0) },
  continent: { bins: ['Africa', 'Asia', 'Europe', 'Americas', 'Oceania'], pool: () => QUIZ.filter((c) => c.area > 50000), name: (c) => `${c.flag || ''} ${c.name}`, bin: (c) => ({ Africa: 0, Asia: 1, Europe: 2, 'North America': 3, 'South America': 3, Oceania: 4 })[c.cont] },
  bigSmall: { bins: ['Bigger than 1 million km²', 'Smaller'], pool: () => QUIZ.filter((c) => c.area > 100000), name: (c) => `${c.flag || ''} ${c.name}`, bin: (c) => (c.area >= 1e6 ? 0 : 1) },
};
const sortE = {
  init(cfg, r) {
    const S = SORTS[cfg.kind], pool = shuffle(S.pool(), r), items = [];
    for (let b = 0; b < S.bins.length; b++) items.push(...pool.filter((x) => S.bin(x) === b).slice(0, Math.ceil(cfg.count / S.bins.length)));
    return { items: shuffle(items, r).slice(0, cfg.count).map((x) => ({ n: S.name(x), b: S.bin(x) })), put: {}, checked: false };
  },
  view(cfg, st) {
    const S = SORTS[cfg.kind];
    return `<div class="pj-sort"><p class="muted small">Put each one in its bin — tap the bin under it.</p>
      <ul class="pj-sl">${st.items.map((it, i) => { const p = st.put[i]; const bad = st.checked && p != null && p !== it.b;
        return `<li class="${bad ? 'bad' : p != null ? 'set' : ''}"><span>${esc(it.n)}</span><span class="pj-bins">${S.bins.map((b, j) => `<button class="${p === j ? 'on' : ''}" ${A('put', `${i}:${j}`)} aria-pressed="${p === j}">${esc(b)}</button>`).join('')}</span></li>`; }).join('')}</ul>
      <div class="row gap">${btn2('Check my bins', 'check')}${st.checked ? `<span class="muted small">${st.items.filter((it, i) => st.put[i] !== it.b).length} to move.</span>` : ''}</div></div>`;
  },
  act(cfg, st, name, arg) { if (name === 'put') { const [i, j] = arg.split(':').map(Number); st.put[i] = j; st.checked = false; } if (name === 'check') st.checked = true; return null; },
  goals: (cfg, st) => [{ t: `All ${st.items.length} in the right bins`, ok: st.items.every((it, i) => st.put[i] === it.b) }],
  thumb: (cfg, st) => `<span class="pj-thumbtx">${SORTS[cfg.kind].bins.join(' · ')} — ${st.items.length} sorted</span>`,
  solve(cfg) { const st = sortE.init(cfg, seeded('t')); st.items.forEach((it, i) => { st.put[i] = it.b; }); return st; },
};
const btn2 = (label, name, arg = '') => `<button class="btn" ${A(name, arg)}>${label}</button>`;

/* ================================================================== flag */
const FCOL = ['#D8412F', '#F0B429', '#2E9E5B', '#2F6FD6', '#FFFFFF', '#1B1B1B', '#7B3FB8', '#F07C2A', '#63C5E8'];
const MEANS = ['courage', 'the sea', 'the sun', 'the land and its farms', 'peace', 'the mountains', 'hope', 'our family', 'the forests', 'the sky', 'friendship', 'learning'];
const EMB = { none: '', circle: '<circle cx="45" cy="30" r="11"/>', star: '<path d="M45 17l3.8 8 8.7 1.1-6.4 6 1.7 8.6L45 36.5l-7.8 4.2 1.7-8.6-6.4-6 8.7-1.1z"/>', sun: '<circle cx="45" cy="30" r="8"/><path d="M45 15v6M45 39v6M30 30h6M54 30h6M34 19l4 4M52 37l4 4M34 41l4-4M52 23l4-4" stroke-width="3"/>', leaf: '<path d="M36 38c0-12 8-20 20-20 0 12-8 20-20 20z"/>' };
const LAYOUT = { h2: 'Two stripes', h3: 'Three stripes', v3: 'Three upright', cross: 'A cross', diag: 'Diagonal' };
function flagSVG(st, cls = 'pj-flag') {
  const [a, b, c] = st.c; let body = '';
  if (st.lay === 'h2') body = `<rect width="90" height="30" fill="${a}"/><rect y="30" width="90" height="30" fill="${b}"/>`;
  if (st.lay === 'h3') body = `<rect width="90" height="20" fill="${a}"/><rect y="20" width="90" height="20" fill="${b}"/><rect y="40" width="90" height="20" fill="${c}"/>`;
  if (st.lay === 'v3') body = `<rect width="30" height="60" fill="${a}"/><rect x="30" width="30" height="60" fill="${b}"/><rect x="60" width="30" height="60" fill="${c}"/>`;
  if (st.lay === 'cross') body = `<rect width="90" height="60" fill="${a}"/><rect x="26" width="12" height="60" fill="${b}"/><rect y="24" width="90" height="12" fill="${b}"/>`;
  if (st.lay === 'diag') body = `<rect width="90" height="60" fill="${a}"/><path d="M0 60L90 0v60z" fill="${b}"/>`;
  return `<svg viewBox="0 0 90 60" class="${cls}">${body}<g fill="${st.ec}" stroke="${st.ec}">${EMB[st.emb] || ''}</g><rect width="90" height="60" fill="none" stroke="rgb(0 0 0 / .2)"/></svg>`;
}
const usedCols = (st) => { const n = { h2: 2, h3: 3, v3: 3, cross: 2, diag: 2 }[st.lay]; return [...new Set(st.c.slice(0, n).concat(st.emb !== 'none' ? [st.ec] : []))]; };
const flag = {
  init: () => ({ lay: 'h3', c: ['#D8412F', '#FFFFFF', '#2F6FD6'], emb: 'none', ec: '#F0B429', m: {}, slot: 0 }),
  view(cfg, st) {
    const cols = usedCols(st);
    return `<div class="pj-flagmk"><div class="pj-flagbig">${flagSVG(st)}</div>
      <div class="pj-fctl">
        <p class="lab">Shape</p><div class="row gap wrap">${Object.entries(LAYOUT).map(([k, n]) => `<button class="pj-sw${st.lay === k ? ' on' : ''}" ${A('lay', k)}>${n}</button>`).join('')}</div>
        <p class="lab">Colour — choose a part, then a colour</p><div class="row gap wrap">${['First part', 'Second part', 'Third part', 'Emblem'].map((n, i) => `<button class="pj-sw${st.slot === i ? ' on' : ''}" ${A('slot', i)}>${n}</button>`).join('')}</div>
        <div class="row gap wrap pj-pal">${FCOL.map((c) => `<button class="pj-col" style="background:${c}" ${A('col', c)} aria-label="colour ${c}"></button>`).join('')}</div>
        <p class="lab">Emblem</p><div class="row gap wrap">${Object.keys(EMB).map((k) => `<button class="pj-sw${st.emb === k ? ' on' : ''}" ${A('emb', k)}>${k === 'none' ? 'None' : k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div>
        <p class="lab">What does each colour mean?</p>${cols.map((c) => `<div class="pj-mean"><i style="background:${c}"></i><span class="row gap wrap">${MEANS.map((m) => `<button class="pj-sw small${st.m[c] === m ? ' on' : ''}" ${A('mean', `${c}|${m}`)}>${m}</button>`).join('')}</span></div>`).join('')}
      </div></div>`;
  },
  act(cfg, st, name, arg) {
    if (name === 'lay') st.lay = arg;
    if (name === 'slot') st.slot = +arg;
    if (name === 'col') { if (st.slot === 3) st.ec = arg; else st.c[st.slot] = arg; }
    if (name === 'emb') st.emb = arg;
    if (name === 'mean') { const [c, m] = arg.split('|'); st.m[c] = m; }
    return null;
  },
  goals: (cfg, st) => { const cols = usedCols(st); return [
    { t: `At least ${cfg.colours || 2} different colours`, ok: cols.length >= (cfg.colours || 2) },
    ...(cfg.emblem ? [{ t: 'An emblem in the middle', ok: st.emb !== 'none' }] : []),
    { t: 'Every colour has a meaning', ok: cols.every((c) => st.m[c]) }]; },
  thumb: (cfg, st) => flagSVG(st, 'pj-thumb'),
  solve(cfg) { const st = flag.init(); if (cfg.emblem) st.emb = 'star'; usedCols(st).forEach((c, i) => { st.m[c] = MEANS[i]; }); return st; },
};

export const ENGINES = { mapmaker, route, order, sort: sortE, flag };
export const ENGINE_NAME = { mapmaker: 'Map-maker', route: 'Journey planner', order: 'Put in order', sort: 'Sorting bins', flag: 'Flag designer' };
