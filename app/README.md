# app/ — Bizzing Geography

Vanilla ES modules + Vite, `state → render()` returning a string, clicks dispatched by
`[data-act]` — the Bizzing Bee idiom, on Bizzing Maths's architecture. d3-geo and
topojson-client draw the maps; nothing else is a dependency.

## Module map

| file | what it owns |
|---|---|
| `src/data/*.js` | `world.js` `regions.js` `countries.js` `states.js` `india.js` — **generated** by `tools/geo/build.mjs`, never edited. `postcards.js` `landmarks.js` `eras.js` — hand-written facts with sources and the `paint` prompt for each plate. |
| `src/geo.js` | Country lookups, the 195, continents, oceans, haversine, bearings, formatting. |
| `src/map.js` | The world map (Natural Earth projection, 1000×520 frame), region maps (US Albers, Canada, Australia, India from Bizzing India), `countryAt`, `nearCountry`, `viewFor`. |
| `src/mapui.js` | Tap, drag, pinch, wheel — and the keyboard cross. Pan/zoom survive re-renders. |
| `src/chapters/*.js` | One world per file: `WORLD` and `STOPS` (hook, idea, why, src, `gen(r, lv)`). `kit.js` builds questions (`mc`, `tf`, `mapQ`, `bank`). |
| `src/stops.js` | The Atlas aggregate; `drill()`, `correct()`. |
| `src/levels.js` | The ten roads. |
| `src/model.js` | Household, child, ranks, stars, the road, what is open. |
| `src/figs.js` | Lesson drawings: map symbols, compass roses, plans, grids, scale bars, Earth's layers, the water cycle, the globe's lines, plate boundaries. |
| `src/views.js` · `main.js` | Every screen; routing, the runner, actions, keys. |
| `src/library/*.js` | The Library, one tool per file, to [../docs/LIBRARY-CONTRACT.md](../docs/LIBRARY-CONTRACT.md). |
| `src/store.js` | The seam (schema v1). |
| `public/art/` | Painted plates (110). `public/flags/` flag SVGs. `public/avatars/` 40 geography avatars (+ the family faces kept for children who chose them). |
