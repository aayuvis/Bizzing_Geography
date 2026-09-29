/* themes.js — the six looks, and which one is on (Bizzing Maths' system).

   A theme belongs to the child (k.prefs.theme), so two children on one
   tablet each keep their own; light/dark stays a device setting. Colours,
   faces, the map's own sea and land, and a moving geography motif live in
   styles/themes.css, keyed by data-theme on <html>. This file is the list the
   picker shows and the one place that decides what an unknown or missing
   value means: Old Atlas, the look the app had before themes. */

export const THEMES = [
  { id: 'atlas', name: 'Old Atlas', blurb: 'Parchment and terracotta. A compass rose turns.',
    display: 'Baloo 2', ui: 'Nunito', mono: 'Sono' },
  { id: 'ocean', name: 'Ocean Deep', blurb: 'Teal water and coral. Waves roll, bubbles rise.',
    display: 'Space Grotesk', ui: 'Lexend', mono: 'JetBrains Mono' },
  { id: 'jungle', name: 'Rainforest', blurb: 'Deep greens and toucan orange. Leaves sway.',
    display: 'Kalam', ui: 'Atkinson Hyperlegible Next', mono: 'Atkinson Hyperlegible Mono' },
  { id: 'desert', name: 'Desert Dunes', blurb: 'Sand, sun and indigo night. The dunes drift.',
    display: 'Yatra One', ui: 'Mukta', mono: 'Red Hat Mono' },
  { id: 'aurora', name: 'Polar Aurora', blurb: 'Ice and violet. The northern lights ripple.',
    display: 'Exo 2', ui: 'Archivo', mono: 'Azeret Mono' },
  { id: 'orbit', name: 'Satellite', blurb: 'Earth from orbit. A satellite circles the globe.',
    display: 'Orbitron', ui: 'Exo 2', mono: 'Kode Mono' },
];

export const DEFAULT_THEME = 'atlas';
const IDS = new Set(THEMES.map((t) => t.id));

/* A child from before themes existed has no prefs.theme: they get the default. */
export function themeOf(k) {
  const t = k && k.prefs && k.prefs.theme;
  return IDS.has(t) ? t : DEFAULT_THEME;
}
export const isTheme = (id) => IDS.has(id);

/* Put a theme on the page. Cheap on every render: it touches the DOM only when the theme changes. */
export function applyTheme(id) {
  const el = document.documentElement;
  if (el.getAttribute('data-theme') === id) return;
  el.setAttribute('data-theme', id);
  syncThemeColor();
}

/* the browser's own chrome (a phone's status bar) follows the page */
export function syncThemeColor() {
  const m = document.querySelector('meta[name="theme-color"]');
  if (!m) return;
  const c = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
  if (c) m.setAttribute('content', c);
}

/* The picker on the child's page: one card per theme, each wearing its own
   theme (data-theme on the card scopes that theme's colours and faces to it),
   with a little sea-and-land swatch so the child sees the map's colours too.
   A radio group: the chosen card is the one tab stop, arrows move the choice. */
export function themePicker(k) {
  const cur = themeOf(k);
  return `<div class="card" id="themes">
    <h3>Your theme</h3>
    <p class="muted small">Colours, letters, map colours and a moving picture behind everything. Yours alone — nobody else on this device gets it.</p>
    <div class="themes" role="radiogroup" aria-label="Theme">${THEMES.map((t) => {
      const on = t.id === cur;
      return `<button class="theme-card" id="theme-${t.id}" data-theme="${t.id}" data-act="theme" data-arg="${t.id}" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}">
        <span class="tc-sw" aria-hidden="true"><svg class="tc-map" viewBox="0 0 120 60"><rect width="120" height="60" class="tc-sea"/><path class="tc-land" d="M8 14c10-6 22-4 28 4s2 16-6 20-18 8-22 0-6-18 0-24zM52 8c14-4 30 0 36 8s14 4 22 10-2 18-14 18-16-6-26-4-22-2-22-12 0-16 4-20z"/><path class="tc-hl" d="M64 22c6-2 12 2 10 8s-10 6-13 2-3-8 3-10z"/></svg><i style="--c:var(--action)"></i><i style="--c:var(--sw2)"></i><i style="--c:var(--treasure)"></i><span class="tc-aa">Aa</span>${on ? '<span class="tc-on">On</span>' : ''}</span>
        <span class="tc-t"><b>${t.name}</b><span class="tc-n" aria-hidden="true">23.5° N · 0° E</span><span>${t.blurb}</span><span>${t.display} · ${t.ui} · ${t.mono}</span></span>
      </button>`;
    }).join('')}</div>
  </div>`;
}
