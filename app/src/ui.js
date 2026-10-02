/* ui.js — the small vocabulary every view speaks. Taken from Bizzing Finance.
   Rendering is `state -> render()` returning a string; clicks dispatch by
   [data-act]. Inherited from Bizzing Bee because the team is fluent in it. */

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
export function cls(...a) { return a.filter(Boolean).join(' '); }

/* ---- action dispatch ---------------------------------------------------- */
const acts = Object.create(null);
export function on(name, fn) { acts[name] = fn; }
export function fire(name, arg, ev) {
  const fn = acts[name];
  if (fn) fn(arg, ev);
  else console.warn('no action:', name);
}
export function bindRoot(root) {
  const go = (ev) => {
    const el = ev.target.closest('[data-act]');
    if (!el || !root.contains(el)) return;
    const act = el.getAttribute('data-act');
    if (act === 'noop') { ev.stopPropagation(); return; }
    ev.preventDefault();
    fire(act, el.getAttribute('data-arg'), ev);
  };
  root.addEventListener('click', go);
  root.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    const el = ev.target.closest('[data-act]');
    if (el && el.tagName !== 'BUTTON' && el.tagName !== 'INPUT') { go(ev); }
  });
}

/* ---- the sound kit (M3): right · wrong · finish · medal · coin · unlock, designed
   in code — soft bell partials, never a buzzer. Every effect ducks the music. */
let AC = null, soundOn = true, calm = false, onSfx = () => {};
export function setSound(v) { soundOn = !!v; }
export function setCalm(v) { calm = !!v; }
export function onSound(fn) { onSfx = fn; }
export function ac() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = false; } }
  if (AC && AC.state === 'suspended') AC.resume();
  return AC;
}
/* one bell-ish note: a sine with a soft inharmonic partial, a quick attack and a long tail */
function tone(freq, dur, type, vol, delay, partial = 0) {
  const c = ac(); if (!c || !soundOn) return;
  const t = c.currentTime + (delay || 0), v = (vol == null ? 0.14 : vol) * (calm ? 0.5 : 1);
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(v, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t); o.stop(t + dur + 0.02);
  if (partial) { const o2 = c.createOscillator(), g2 = c.createGain(); o2.frequency.value = freq * partial; g2.gain.setValueAtTime(v * 0.25, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.6); o2.connect(g2); g2.connect(c.destination); o2.start(t); o2.stop(t + dur); }
}
const play = (fn, secs) => { if (!soundOn) return; onSfx(secs); fn(); };
export const sfx = {
  click() { play(() => tone(660, 0.06, 'triangle', 0.04), 0.2); },
  coin() { play(() => { tone(1318, 0.14, 'sine', 0.08, 0, 2.76); tone(1760, 0.22, 'sine', 0.07, 0.07, 2.76); }, 0.5); },
  good() { play(() => { tone(784, 0.28, 'sine', 0.11, 0, 2.76); tone(1175, 0.42, 'sine', 0.09, 0.09, 2.76); }, 0.7); },
  bad() { play(() => { tone(330, 0.22, 'triangle', 0.07); tone(262, 0.32, 'triangle', 0.06, 0.1); }, 0.6); },
  finish() { play(() => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'sine', 0.09, i * 0.08, 2)), 1.2); },
  level() { play(() => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.6, 'triangle', 0.08, i * 0.09, 2.76)), 1.4); },
  medal() { play(() => { [784, 988, 1175].forEach((f) => tone(f, 1.4, 'sine', 0.07, 0, 2.76)); [1568, 2093, 2637].forEach((f, i) => tone(f, 0.5, 'sine', 0.03, 0.25 + i * 0.07)); }, 1.8); },
  unlock() { play(() => { const c = ac(); if (!c) return; const t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(392, t); o.frequency.exponentialRampToValueAtTime(1175, t + 0.35); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.07 * (calm ? 0.5 : 1), t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.62); tone(1568, 0.6, 'sine', 0.06, 0.32, 2.76); }, 0.9); },
  bell() { play(() => [784, 1175].forEach((f, i) => tone(f, 0.8, 'sine', 0.1, i * 0.14, 2.76)), 1.2); },
};

/* ---- transient chrome --------------------------------------------------- */
let toastT = null;
export function toast(msg) {
  document.querySelectorAll('.toast').forEach((n) => n.remove());
  const d = document.createElement('div');
  d.className = 'toast'; d.textContent = msg; d.setAttribute('role', 'status');
  document.body.appendChild(d);
  clearTimeout(toastT);
  toastT = setTimeout(() => d.remove(), 2400);
}
const CONF = ['#F0B429', '#2D5BD8', '#178A4C', '#E0673A', '#8A5BD6', '#2E7FA8'];
export function confetti(n) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.getAttribute('data-motion') === 'reduced' || calm) return;
  const wrap = document.createElement('div');
  wrap.className = 'conf'; wrap.setAttribute('aria-hidden', 'true');
  let html = '';
  for (let i = 0; i < (n || 40); i++) {
    const dur = (2.4 + (i % 6) * 0.35).toFixed(2);
    html += `<i style="left:${(i * 37) % 100}%;background:${CONF[i % 6]};animation-duration:${dur}s;animation-delay:${((i * 0.13) % 1.2).toFixed(2)}s"></i>`;
  }
  wrap.innerHTML = html;
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 4200);
}

/* ---- number helpers used all over the UI -------------------------------- */
export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function sum(a) { return a.reduce((x, y) => x + y, 0); }

/* Small counts read better as words in a sentence a child reads aloud —
   "all three done", not "all 3 done". Above twelve the digit is clearer. */
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight',
  'nine', 'ten', 'eleven', 'twelve'];
/* "1 medal", "2 medals" — never "1 points" (the audit's N12) */
export const plural = (n, one, many = one + 's') => `${typeof n === 'number' ? n.toLocaleString('en-US') : n} ${n === 1 ? one : many}`;
export function nWord(n) { return WORDS[n] !== undefined ? WORDS[n] : String(n); }


/* ── read to me ───────────────────────────────────────────────────────────
   Questions can be read aloud for a child who reads slower than they
   calculate — a six-year-old should not lose a fact to the word "sixty".
   There are no recorded clips here, so the device voice IS the reader. An Indian English
   voice first, then any English. Rate follows the narration-speed setting. */
let sayRate = 1;
export function setSayRate(r) { sayRate = r || 1; }
export function canSay() { return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined'; }
function pickVoice() {
  const vs = speechSynthesis.getVoices() || [];
  return vs.find((v) => /en[-_]IN/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang) && /natural|neural|premium|enhanced/i.test(v.name)) || vs.find((v) => /^en/i.test(v.lang)) || null;
}
/* `onend` makes the voice the clock: a story beat advances when its line has
   been SPOKEN, not on a timer hoping to match (the family's production rule). */
export function say(text, onend) {
  if (!canSay() || !text) return false;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text).replace(/\s+/g, ' ').trim());
    const v = pickVoice(); if (v) u.voice = v;
    u.lang = (v && v.lang) || 'en-IN'; u.rate = sayRate; u.pitch = 1;
    u.onend = () => { onSfx(0); if (onend) onend(); };
    onSfx(30); speechSynthesis.speak(u);
    return true;
  } catch (e) { return false; }
}
export function hush() { try { if (canSay()) speechSynthesis.cancel(); } catch (e) {} }
