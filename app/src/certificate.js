/* certificate.js — certificates (family standard §13, T9): when a level, a world or an
   expedition is finished, a certificate with the child's first name, their avatar, Shelly
   and what was mastered — drawn as a PNG ON THE DEVICE (a canvas; nothing is uploaded) and
   shared only from the grown-ups' area, behind the PIN. */

import { WORLDS } from './stops.js';
import { LEVELS } from './levels.js';
import { EXPEDITIONS } from './data/expeditions.js';
import { stats as expStats } from './expeditions.js';

/* every certificate this child has earned, from evidence */
export function certificatesOf(k) {
  const out = [];
  for (const n of (k.road.finished || []).slice().sort((a, b) => a - b)) { const L = LEVELS.find((x) => x.n === n); if (L) out.push({ id: 'level-' + n, title: `Level ${n}: ${L.name}`, what: `passed the Level ${n} check — ${L.steps.length} stops of the journey` }); }
  for (const w of WORLDS) if ((k.medals || {})['world-' + w.id]) out.push({ id: 'world-' + w.id, title: w.name, what: `walked every stop in ${w.name}` });
  for (const e of EXPEDITIONS) { try { if (expStats(k, e).complete) out.push({ id: 'exp-' + e.id, title: e.name, what: `finished the ${e.name} expedition, its final project included` }); } catch (_) {} }
  return out;
}
const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
export async function drawCertificate(k, cert) {
  const W = 1600, H = 1131, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#FFFDF5'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#0E6E74'; g.lineWidth = 28; g.strokeRect(36, 36, W - 72, H - 72);
  g.strokeStyle = '#F0B429'; g.lineWidth = 6; g.strokeRect(78, 78, W - 156, H - 156);
  /* map contours, the app icon's motif, very faint */
  g.strokeStyle = 'rgba(14,110,116,.08)'; g.lineWidth = 3;
  for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(W * 0.82, H * 0.78, 90 + i * 60, 50 + i * 38, -0.3, 0, Math.PI * 2); g.stroke(); }
  const [sh, av] = await Promise.all([load('mascot/shelly-cheer.webp'), load(`avatars/${k.avatar}.webp`)]);
  if (sh) g.drawImage(sh, 120, H - 470, 380, 380);
  if (av) g.drawImage(av, W - 420, 150, 260, 260);
  g.fillStyle = '#3A2A5C'; g.textAlign = 'center';
  g.font = '800 46px Fraunces, Georgia, serif'; g.fillText('Bizzing Geography', W / 2, 200);
  g.font = '600 34px "Hanken Grotesk", system-ui, sans-serif'; g.fillStyle = '#6E6153'; g.fillText('This certificate is for', W / 2, 330);
  g.font = '800 120px Fraunces, Georgia, serif'; g.fillStyle = '#0E6E74'; g.fillText(k.name, W / 2, 470);
  g.font = '600 38px "Hanken Grotesk", system-ui, sans-serif'; g.fillStyle = '#2A2118';
  const what = `who ${cert.what}.`, words = what.split(' '); let line = '', y = 580;
  for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > W - 520) { g.fillText(line, W / 2, y); line = w; y += 54; } else line = t; }
  g.fillText(line, W / 2, y);
  g.font = '800 64px Fraunces, Georgia, serif'; g.fillStyle = '#A94A1C'; g.fillText(cert.title, W / 2, y + 120);
  g.font = '500 28px "Hanken Grotesk", system-ui, sans-serif'; g.fillStyle = '#6E6153';
  g.fillText(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + ' · measured from answers, never from minutes', W / 2, H - 140);
  return c;
}
export async function shareCertificate(k, cert) {
  const c = await drawCertificate(k, cert);
  const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
  const name = `bizzing-geography-${k.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${cert.id}.png`;
  const file = typeof File !== 'undefined' ? new File([blob], name, { type: 'image/png' }) : null;
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: cert.title }); return 'shared'; } catch (_) {} }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  return 'saved';
}
