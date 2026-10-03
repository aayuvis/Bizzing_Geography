/* music.js — music composed IN CODE for Bizzing Geography (family standard v2 §11).
   No audio files, so nothing to license and nothing in the first download: each loop
   is a small score (a scale, a chord progression, a bass line and a tune grown from a
   seeded motif) played by WebAudio voices. One calm loop per world, one for home and
   one for games; 24 bars each, so a loop lasts 60–90 seconds and wraps without a seam.

     · default volume 40%, one master slider (Settings → Sound & music);
     · ducks under every sound effect and under read-aloud;
     · pauses the moment the page is hidden, and resumes when it comes back;
     · off in Calm mode, and off when the Music switch is off;
     · starts only after the child's first tap or key (browsers forbid autoplay anyway).

   music/CREDITS.md says the same: composed in code for Bizzing. */

const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

/* scale: semitones from the root; prog: chord roots as scale degrees (0-based), one per bar,
   8 bars, played three times (A · B · A′) = 24 bars; voice: the lead's timbre */
export const LOOPS = {
  home:   { root: 55, bpm: 80, scale: [0, 2, 4, 7, 9], full: [0, 2, 4, 5, 7, 9, 11], prog: [0, 5, 3, 4, 0, 5, 1, 4], lead: 'triangle', pad: 'sine', bell: false, hat: false, seed: 11 },
  game:   { root: 60, bpm: 108, scale: [0, 2, 4, 7, 9], full: [0, 2, 4, 5, 7, 9, 11], prog: [0, 3, 4, 0, 5, 3, 1, 4], lead: 'square', pad: 'triangle', bell: false, hat: true, seed: 23 },
  atlas:  { root: 50, bpm: 84, scale: [0, 2, 4, 7, 9], full: [0, 2, 4, 5, 7, 9, 11], prog: [0, 4, 5, 3, 0, 4, 3, 4], lead: 'triangle', pad: 'sawtooth', bell: false, hat: false, seed: 31 },
  ocean:  { root: 57, bpm: 70, scale: [0, 3, 5, 7, 10], full: [0, 2, 3, 5, 7, 9, 10], prog: [0, 3, 6, 4, 0, 3, 5, 4], lead: 'sine', pad: 'sine', bell: true, hat: false, echo: 0.38, seed: 41 },
  jungle: { root: 52, bpm: 92, scale: [0, 2, 3, 7, 9], full: [0, 2, 3, 5, 7, 9, 10], prog: [0, 3, 0, 6, 0, 3, 4, 6], lead: 'marimba', pad: 'triangle', bell: false, hat: true, seed: 53 },
  desert: { root: 50, bpm: 76, scale: [0, 1, 4, 5, 7, 8, 10], full: [0, 1, 4, 5, 7, 8, 10], prog: [0, 1, 0, 6, 0, 1, 3, 0], lead: 'pluck', pad: 'sawtooth', bell: false, hat: false, drone: true, seed: 67 },
  aurora: { root: 53, bpm: 64, scale: [0, 2, 4, 6, 7, 9, 11], full: [0, 2, 4, 6, 7, 9, 11], prog: [0, 1, 4, 3, 0, 1, 5, 4], lead: 'sine', pad: 'sine', bell: true, hat: false, echo: 0.45, seed: 79 },
  orbit:  { root: 48, bpm: 88, scale: [0, 3, 5, 7, 10], full: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 3, 6, 0, 5, 4, 4], lead: 'square', pad: 'sawtooth', bell: false, hat: false, arp: true, echo: 0.3, seed: 89 },
};
export const BARS = 24;
export const loopSeconds = (id) => (BARS * 4 * 60) / LOOPS[id].bpm;

/* the score: a deterministic list of notes { t (beats), d (beats), m (midi), v, part } */
export function score(id) {
  const L = LOOPS[id], R = rng(L.seed), notes = [];
  const deg = (d, oct = 0) => L.root + L.full[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + oct);
  /* a motif of 8 eighth-note steps over the pentatonic, varied for the B section */
  const motif = Array.from({ length: 8 }, () => (R() < 0.28 ? null : Math.floor(R() * L.scale.length)));
  const motifB = motif.map((x, i) => (x == null ? (R() < 0.5 ? Math.floor(R() * L.scale.length) : null) : (x + (i % 3 === 0 ? 1 : 0)) % L.scale.length));
  for (let bar = 0; bar < BARS; bar++) {
    const sec = Math.floor(bar / 8), c = L.prog[bar % 8], t0 = bar * 4;
    /* pad: the chord, the whole bar */
    for (const off of [0, 2, 4]) notes.push({ t: t0, d: 4, m: deg(c + off, 0), v: 0.05, part: 'pad' });
    if (L.drone) notes.push({ t: t0, d: 4, m: L.root - 12, v: 0.05, part: 'pad' });
    /* bass: beats 1 and 3 (and a walk up on 4 at phrase ends) */
    notes.push({ t: t0, d: 1.6, m: deg(c, -1), v: 0.13, part: 'bass' });
    notes.push({ t: t0 + 2, d: 1.6, m: deg(c + (bar % 2 ? 4 : 0), -1), v: 0.1, part: 'bass' });
    if (bar % 4 === 3) notes.push({ t: t0 + 3.5, d: 0.4, m: deg(L.prog[(bar + 1) % 8] - 1, -1), v: 0.08, part: 'bass' });
    /* the tune: the motif on the chord, eighth notes; the last bar of each 8 breathes */
    const mot = sec === 1 ? motifB : motif;
    if (bar % 8 !== 7) mot.forEach((x, i) => {
      if (x == null || (bar % 2 === 1 && i > 5)) return;
      const m = L.root + 12 + L.scale[x] + (L.scale[x] < L.full[c % 7] - 2 ? 12 : 0);
      notes.push({ t: t0 + i * 0.5, d: 0.45, m, v: sec === 2 && i === 0 ? 0.09 : 0.07, part: 'lead' });
    });
    else notes.push({ t: t0, d: 2.5, m: deg(c, 1), v: 0.07, part: 'lead' });
    if (L.arp) for (let i = 0; i < 8; i++) notes.push({ t: t0 + i * 0.5, d: 0.3, m: deg(c + [0, 2, 4, 7][i % 4], 1), v: 0.025, part: 'arp' });
    if (L.hat) for (let i = 0; i < 8; i++) if (i % 2 || R() < 0.3) notes.push({ t: t0 + i * 0.5, d: 0.05, m: 0, v: i % 2 ? 0.035 : 0.02, part: 'hat' });
    if (L.bell && bar % 2 === 0) notes.push({ t: t0 + 3, d: 2, m: deg(c + 4, 1), v: 0.035, part: 'bell' });
  }
  return notes;
}

/* ------------------------------------------------------------------ the player */
let AC = null, master = null, musicBus = null, duckG = null, noise = null, echoIn = null;
let cur = null, notes = [], startAt = 0, nextIdx = 0, loopN = 0, timer = null;
let state = { on: true, vol: 40, calm: false, want: null, unlocked: false, hidden: false };
export const musicState = () => ({ ...state, playing: !!cur && !!timer, loop: cur });

export function attach(ctxGetter) { getAC = ctxGetter; }
let getAC = () => null;
function bus() {
  if (AC) return AC;
  AC = getAC(); if (!AC) return null;
  master = AC.createGain(); duckG = AC.createGain(); musicBus = AC.createGain();
  musicBus.connect(duckG); duckG.connect(master); master.connect(AC.destination);
  /* a gentle echo for the airy worlds */
  const d = AC.createDelay(1.5), fb = AC.createGain(), lp = AC.createBiquadFilter();
  d.delayTime.value = 0.42; fb.gain.value = 0.32; lp.type = 'lowpass'; lp.frequency.value = 2400;
  echoIn = AC.createGain(); echoIn.gain.value = 0;
  echoIn.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(musicBus);
  const len = AC.sampleRate * 0.2, b = AC.createBuffer(1, len, AC.sampleRate), ch = b.getChannelData(0); const R = rng(5);
  for (let i = 0; i < len; i++) ch[i] = (R() * 2 - 1) * (1 - i / len);
  noise = b;
  setVolume(state.vol);
  return AC;
}
export function setVolume(v) {
  state.vol = Math.max(0, Math.min(100, Math.round(+v || 0)));
  if (master && AC) master.gain.setTargetAtTime((state.vol / 100) * 0.9, AC.currentTime, 0.05);
}
/* every sound effect and every read-aloud ducks the music for a moment */
export function duck(secs = 0.9) {
  if (!duckG || !AC) return;
  const t = AC.currentTime; duckG.gain.cancelScheduledValues(t); duckG.gain.setTargetAtTime(0.3, t, 0.03); duckG.gain.setTargetAtTime(1, t + secs, 0.25);
}

function voice(n, when, L) {
  const dur = (n.d * 60) / L.bpm, end = when + dur;
  const g = AC.createGain(); g.connect(musicBus);
  if (L.echo && (n.part === 'lead' || n.part === 'bell')) { const e = AC.createGain(); e.gain.value = L.echo; g.connect(e); e.connect(echoIn); echoIn.gain.value = 1; }
  if (n.part === 'hat') {
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(); s.buffer = noise; f.type = 'highpass'; f.frequency.value = 7000;
    s.connect(f); f.connect(g); g.gain.setValueAtTime(n.v, when); g.gain.exponentialRampToValueAtTime(0.0001, when + 0.06); s.start(when); s.stop(when + 0.08); return;
  }
  const f = midi(n.m), o = AC.createOscillator(), flt = AC.createBiquadFilter(); flt.type = 'lowpass';
  let type = n.part === 'pad' ? L.pad : n.part === 'bass' ? 'triangle' : n.part === 'bell' ? 'sine' : n.part === 'arp' ? 'triangle' : L.lead;
  let atk = 0.02, rel = 0.18, cut = 2600;
  if (n.part === 'pad') { atk = 0.6; rel = 0.8; cut = 900; }
  if (n.part === 'bass') { cut = 600; }
  if (type === 'marimba' || type === 'pluck') { cut = type === 'pluck' ? 1800 : 3200; rel = 0.05; type = type === 'pluck' ? 'sawtooth' : 'sine'; }
  o.type = type; o.frequency.value = f; flt.frequency.value = cut; o.connect(flt); flt.connect(g);
  const peak = n.v * (state.calm ? 0.6 : 1);
  g.gain.setValueAtTime(0.0001, when);
  if (L.lead === 'marimba' && n.part === 'lead' || L.lead === 'pluck' && n.part === 'lead' || n.part === 'bell') {
    g.gain.exponentialRampToValueAtTime(peak, when + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, when + (n.part === 'bell' ? 2.2 : 0.55));
    if (n.part === 'bell' || L.lead === 'marimba') { const o2 = AC.createOscillator(), g2 = AC.createGain(); o2.type = 'sine'; o2.frequency.value = f * (n.part === 'bell' ? 2.76 : 4); g2.gain.value = 0.25; o2.connect(g2); g2.connect(flt); o2.start(when); o2.stop(when + 2.3); }
    o.start(when); o.stop(when + (n.part === 'bell' ? 2.3 : 0.6)); return;
  }
  g.gain.linearRampToValueAtTime(peak, when + atk);
  g.gain.setValueAtTime(peak, Math.max(when + atk, end - rel));
  g.gain.linearRampToValueAtTime(0.0001, end + rel * 0.5);
  if (n.part === 'pad') { const o2 = AC.createOscillator(); o2.type = type; o2.frequency.value = f * 1.004; o2.connect(flt); o2.start(when); o2.stop(end + rel); }
  o.start(when); o.stop(end + rel);
}
function pump() {
  if (!cur || !AC) return;
  const L = LOOPS[cur], beat = 60 / L.bpm, loopLen = BARS * 4 * beat, ahead = AC.currentTime + 0.35;
  for (;;) {
    if (nextIdx >= notes.length) { nextIdx = 0; loopN++; }
    const n = notes[nextIdx], when = startAt + loopN * loopLen + n.t * beat;
    if (when > ahead) break;
    if (when >= AC.currentTime - 0.05) voice(n, when, L);
    nextIdx++;
  }
}
function stopLoop(fade = 0.6) {
  clearInterval(timer); timer = null;
  if (musicBus && AC) { const t = AC.currentTime; musicBus.gain.cancelScheduledValues(t); musicBus.gain.setTargetAtTime(0, t, fade / 4); }
  cur = null;
}
function startLoop(id, sting) {
  if (!bus()) return;
  if (AC.state === 'suspended') AC.resume();
  stopLoop(0.3);
  cur = id; notes = score(id).sort((a, b) => a.t - b.t); nextIdx = 0; loopN = 0; startAt = AC.currentTime + 0.12;
  const t = AC.currentTime; musicBus.gain.cancelScheduledValues(t); musicBus.gain.setValueAtTime(0.0001, t); musicBus.gain.linearRampToValueAtTime(1, t + 1.8);
  echoIn.gain.value = LOOPS[id].echo ? 1 : 0;
  if (sting) entrySting(id);
  pump(); timer = setInterval(pump, 120);
}
/* a world's entry sting: its scale, rising, once */
export function entrySting(id) {
  if (!bus() || !LOOPS[id]) return;
  const L = LOOPS[id], t = AC.currentTime + 0.05;
  [0, 1, 2, 4].forEach((i, j) => voice({ t: 0, d: 0.5, m: L.root + 12 + L.scale[i % L.scale.length] + (i >= L.scale.length ? 12 : 0), v: 0.08, part: 'bell' }, t + j * 0.11, { ...L, echo: 0.3 }));
}
/* each Atlas world has its own entry sting (audit M4): a five-note motif with a shape that says
   the place — the valley falls then rises, the tower climbs, the restless Earth rumbles low,
   the rivers run down. Semitones from a root, the part that plays it, and its tempo. Played
   once, on entering the world, over the loop; never in Calm mode or with music off. */
export const WORLD_STINGS = {
  home:       { root: 72, m: [0, 4, 7, 12, 7], part: 'bell', bpm: 150 },
  landwater:  { root: 67, m: [12, 7, 4, 7, 12], part: 'lead', lead: 'marimba', bpm: 160 },
  continents: { root: 65, m: [0, 5, 7, 12, 17], part: 'lead', lead: 'triangle', bpm: 140 },
  compass:    { root: 69, m: [0, 7, 0, 12, 7], part: 'lead', lead: 'square', bpm: 170 },
  capitals:   { root: 70, m: [0, 4, 7, 9, 12], part: 'lead', lead: 'pluck', bpm: 180 },
  weather:    { root: 74, m: [12, 10, 7, 5, 0], part: 'bell', bpm: 170 },
  rivers:     { root: 64, m: [12, 9, 7, 4, 0], part: 'lead', lead: 'marimba', bpm: 190 },
  globe:      { root: 71, m: [0, 7, 14, 7, 0], part: 'bell', bpm: 130 },
  restless:   { root: 43, m: [0, 1, 0, 6, 0], part: 'lead', lead: 'sawtooth', bpm: 150 },
  people:     { root: 67, m: [0, 2, 4, 2, 7], part: 'lead', lead: 'triangle', bpm: 200 },
};
export const stingNotes = (wid) => { const S = WORLD_STINGS[wid]; return S ? S.m.map((x, i) => ({ t: i * 0.5, d: i === S.m.length - 1 ? 1.5 : 0.5, m: S.root + x, v: 0.09, part: S.part })) : []; };
export function worldSting(wid) {
  const S = WORLD_STINGS[wid];
  if (!S || !state.on || state.calm || !state.unlocked || state.hidden || !bus()) return false;
  const L = { bpm: S.bpm, lead: S.lead || 'triangle', pad: 'sine', echo: 0.3 }, beat = 60 / S.bpm, t0 = AC.currentTime + 0.08;
  for (const n of stingNotes(wid)) voice(n, t0 + n.t * beat, L);
  state.sting = wid; state.stings = (state.stings || 0) + 1;
  return true;
}
/* what should be playing now: decided by the app on every render */
export function want(id, opts = {}) {
  Object.assign(state, { on: opts.on ?? state.on, calm: !!opts.calm, want: id });
  if (opts.vol != null) setVolume(opts.vol);
  const go = state.on && !state.calm && state.unlocked && !state.hidden && id && LOOPS[id];
  if (!go) { if (cur) stopLoop(); return; }
  if (cur !== id) startLoop(id, !!opts.sting && cur != null);
}
export function unlock() { if (state.unlocked) return; state.unlocked = true; want(state.want, { on: state.on, calm: state.calm }); }
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    state.hidden = document.hidden;
    if (document.hidden) { if (cur) { const w = state.want; stopLoop(0.1); state.want = w; } }
    else want(state.want, { on: state.on, calm: state.calm });
  });
  const first = () => { unlock(); removeEventListener('pointerdown', first, true); removeEventListener('keydown', first, true); };
  addEventListener('pointerdown', first, true); addEventListener('keydown', first, true);
}
