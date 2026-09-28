/* mapui.js — how a child moves and taps a map, by touch, mouse or keyboard
   (the family's hard rule: every interaction works both ways).

     touch / mouse   drag to pan, pinch or wheel to zoom, tap to choose
     keyboard        focus the map; arrows move the cross (Shift: faster),
                     + and − zoom, 0 resets, Enter or Space chooses

   Pan and zoom only rewrite the SVG's viewBox — no re-render — and are kept
   by the map's key, so a re-render (a tap, a toast) never throws the child
   back to the whole world. A tap fires 'mapTap' with the country or region
   under it and the [lat, lng] of the point, when the map is the world. */

import { invert, countryAt } from './map.js';

const saved = {};           // key → { vb, home, cross:[x,y] }
let fire = () => {};

const vbOf = (svg) => svg.getAttribute('viewBox').split(/\s+/).map(Number);
const setVb = (svg, v) => svg.setAttribute('viewBox', v.map((n) => +n.toFixed(2)).join(' '));
function keep(el) {
  const svg = el.querySelector('svg'), k = el.dataset.gmap;
  saved[k] = { ...(saved[k] || {}), vb: vbOf(svg), home: el.dataset.home };
}
export function resetMap(key) { delete saved[key]; }

/* After every render: put each map back where the child left it. */
export function restoreMaps(root) {
  root.querySelectorAll('[data-gmap]').forEach((el) => {
    const s = saved[el.dataset.gmap], svg = el.querySelector('svg');
    if (s && s.home === el.dataset.home && s.vb) { setVb(svg, s.vb); scaleMarks(svg); }
    if (s && s.cross) placeCross(svg, s.cross);
  });
}

/* Pins, labels and the cross keep their size on screen as the map zooms. */
function scaleMarks(svg) {
  const v = vbOf(svg), home = (svg.parentElement.dataset.home || '').split(' ').map(Number);
  const s = v[2] / 1000;
  svg.style.setProperty('--s', s.toFixed(3));
  svg.querySelectorAll('.pin, .cross').forEach((g) => {
    const t = g.getAttribute('transform') || '';
    g.setAttribute('transform', t.replace(/scale\([^)]*\)/, '') + ` scale(${s.toFixed(3)})`);
  });
}

function toSvg(svg, cx, cy) {
  const p = svg.createSVGPoint(); p.x = cx; p.y = cy;
  const m = svg.getScreenCTM(); if (!m) return null;
  const q = p.matrixTransform(m.inverse()); return [q.x, q.y];
}
function zoomAt(svg, f, at) {
  const [x, y, w, h] = vbOf(svg), home = svg.parentElement.dataset.home.split(' ').map(Number);
  const nw = Math.min(home[2] * 1.02, Math.max(home[2] / 24, w * f)), nh = (nw * h) / w;
  const [ax, ay] = at || [x + w / 2, y + h / 2];
  setVb(svg, [ax - ((ax - x) * nw) / w, ay - ((ay - y) * nh) / h, nw, nh]);
  scaleMarks(svg); keep(svg.parentElement);
}
export function zoomMap(root, key, how) {
  const el = root.querySelector(`[data-gmap="${key}"]`); if (!el) return;
  const svg = el.querySelector('svg');
  if (how === 'home') { setVb(svg, el.dataset.home.split(' ').map(Number)); scaleMarks(svg); keep(el); return; }
  zoomAt(svg, how === 'in' ? 0.6 : 1 / 0.6);
}

function placeCross(svg, [x, y]) {
  const c = svg.querySelector('.cross'); if (!c) return;
  const s = vbOf(svg)[2] / 1000;
  c.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(3)})`);
}

/* What is at this point? The painted shape under the pointer if there is
   one; for the world map, also the country the projection says is there. */
function tapAt(el, x, y, target) {
  const svg = el.querySelector('svg');
  let cc = target && target.dataset && target.dataset.cc ? target.dataset.cc : null;
  let lat = null, lng = null;
  if (!el.classList.contains('reg')) {
    const ll = invert([x, y]);
    if (ll) { [lat, lng] = ll; if (!cc) cc = countryAt(ll); }
  } else if (!cc) {
    const r = svg.getBoundingClientRect(), [vx, vy, vw, vh] = vbOf(svg);
    const hit = document.elementFromPoint(r.left + ((x - vx) / vw) * r.width, r.top + ((y - vy) / vh) * r.height);
    if (hit && hit.dataset && hit.dataset.cc) cc = hit.dataset.cc;
  }
  saved[el.dataset.gmap] = { ...(saved[el.dataset.gmap] || {}), cross: [x, y], vb: vbOf(svg), home: el.dataset.home };
  fire({ key: el.dataset.gmap, cc, lat, lng, x, y });
}

export function bindMaps(root, onTap) {
  fire = onTap;
  const pts = new Map(); let start = null, moved = false, pinch = null;
  root.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.gmap'); if (!el) return;
    const svg = el.querySelector('svg');
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 1) { start = { x: e.clientX, y: e.clientY, vb: vbOf(svg), el, target: e.target }; moved = false; }
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), vb: vbOf(svg) }; }
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
  });
  root.addEventListener('pointermove', (e) => {
    if (!start || !pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    const svg = start.el.querySelector('svg'), r = svg.getBoundingClientRect();
    if (pts.size >= 2 && pinch) {
      const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      setVb(svg, pinch.vb); zoomAt(svg, pinch.d / Math.max(20, d), toSvg(svg, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2));
      moved = true; return;
    }
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) > 6) moved = true;
    if (!moved) return;
    const home = start.el.dataset.home.split(' ').map(Number);
    if (start.vb[2] >= home[2] * 0.99) return;          // the whole map does not pan
    const k = start.vb[2] / r.width;
    setVb(svg, [start.vb[0] - dx * k, start.vb[1] - dy * k, start.vb[2], start.vb[3]]);
  });
  const end = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size) return;
    const s = start; start = null; pinch = null;
    if (!s) return;
    keep(s.el);
    if (!moved && s.el.classList.contains('tap')) {
      const at = toSvg(s.el.querySelector('svg'), e.clientX, e.clientY);
      if (at) tapAt(s.el, at[0], at[1], s.target);
    }
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); start = null; pinch = null; });
  root.addEventListener('wheel', (e) => {
    const el = e.target.closest('.gmap'); if (!el) return;
    e.preventDefault();
    const svg = el.querySelector('svg');
    zoomAt(svg, e.deltaY > 0 ? 1.18 : 1 / 1.18, toSvg(svg, e.clientX, e.clientY));
  }, { passive: false });
  root.addEventListener('keydown', (e) => {
    const el = e.target.closest && e.target.closest('.gmap.tap');
    if (!el || e.target !== el) return;
    const svg = el.querySelector('svg'), [x, y, w, h] = vbOf(svg), k = saved[el.dataset.gmap] || {};
    let c = k.cross || [x + w / 2, y + h / 2];
    const step = (e.shiftKey ? 0.1 : 0.025) * w;
    const mv = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (mv) {
      e.preventDefault(); e.stopPropagation();
      c = [Math.min(x + w, Math.max(x, c[0] + mv[0])), Math.min(y + h, Math.max(y, c[1] + mv[1]))];
      saved[el.dataset.gmap] = { ...k, cross: c, vb: vbOf(svg), home: el.dataset.home };
      placeCross(svg, c);
      // keep the cross in view
      if (c[0] < x + w * 0.1 || c[0] > x + w * 0.9 || c[1] < y + h * 0.1 || c[1] > y + h * 0.9) { setVb(svg, [c[0] - w / 2, c[1] - h / 2, w, h]); keep(el); }
      return;
    }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); e.stopPropagation(); zoomAt(svg, 0.6, c); return; }
    if (e.key === '-' || e.key === '_') { e.preventDefault(); e.stopPropagation(); zoomAt(svg, 1 / 0.6, c); return; }
    if (e.key === '0') { e.preventDefault(); e.stopPropagation(); zoomMap(root, el.dataset.gmap, 'home'); return; }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); tapAt(el, c[0], c[1], null); }
  }, true);
}
