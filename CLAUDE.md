# CLAUDE.md — Bizzing Geography

Read this first, then [CONCEPT.md](CONCEPT.md), then [app/README.md](app/README.md).

## What this is

**Bizzing Geography** — a map-first web app for kids **6–14**: maps and compasses, landforms,
continents and oceans, countries and capitals, weather and climate, rivers and mountains,
latitude and time, the restless Earth, and people and places — ending in a Library of
GeoGuesser, Country Capitals, State Capitals, Famous Landmarks, Earth Through Time, Flags,
a Map Explorer and a Dictionary. Sixth app in the Bizzing family (Bee, India, Finance, Maths,
Schedule), built on **Bizzing Maths's architecture**: an Atlas of painted worlds, ten
levelled roads, a Library of one-file tools.

The promise: *know the world — and know how you know.*

**Live:** <https://aayuvis.github.io/Bizzing_Geography/> — served from the root of `gh-pages`.

## Working style (the user's pace)

Inherited from the family, and it holds here:

- **Work autonomously.** Stop only for a real fork, a destructive or outward-facing action, or
  missing information you genuinely can't infer.
- **Multitask.** Background long jobs; make independent edits and searches in parallel.
- **Bias to action, then verify.** `npm test` and `npm run check` rather than asking.
- **Batch and ship.** Group related edits into one commit with a clear message.

## Hard rules

### Maps (the ones specific to this app)

1. **One depiction, India's, everywhere.** The family rule (Bizzing India docs/07 §7): the
   Survey of India depiction for every user in every locale — Jammu & Kashmir whole. The
   world map is Natural Earth's **India point-of-view** edition; India's states are
   **Bizzing India's own signed-off map**, generated from its checkout, never redrawn here.
   `test/data.mjs` proves Gilgit, Muzaffarabad and Aksai Chin fall inside India's shape — a
   rebuild from the wrong file fails, it does not ship.
2. **Never animate or gamify a boundary.** No border draws itself, pulses, gets captured or
   moves as a reward. Highlight a country by its fill.
3. **Nothing about a real place is typed from memory.** Capitals, neighbours, areas,
   landlocked, which lines cross which countries — all come from the data
   (`tools/geo/build.mjs`) or are **measured from the map** (`globe.js crossedBy`). Where a
   sentence states a fact that is not in the data, it names its source (`src`), and the
   Landmarks and Earth Through Time shelves say on screen they await a second reader.
4. **A place is where its data says.** Every capital lies inside its own country's shape
   (five atolls/micro-states below the map's resolution are named in the test output), every
   state capital inside its state, every postcard and landmark inside the country it claims.
5. **Only the 195 are quizzed as countries** (UN members + the two observer states).
   Greenland, Taiwan, Western Sahara, Antarctica… are drawn and tappable, and never called a
   country or asked as one.
6. **Every question has one right answer that is not in its text.** `test/stops.mjs` runs
   ~34,000 generated questions: one right option, distinct options, no answer in the text
   (unless the text names every option), no favourite answer slot. It caught Singapore,
   Kuwait City, Guinea-Bissau, South Sudan, "North Korea — which way?" and "north is at the
   top… north". **Never loosen it** — fix the generator.
7. **A question you cannot answer fairly is not asked.** Countries on two continents are
   never asked "which continent?"; directions only within 15° of a compass point and under
   3,000 km; seasons only where |latitude| ≥ 30°; capitals that carry the country's name are
   never asked.

### Art

- **Painted plates, drawn structure** (the Videos/Maths doctrine). `tools/art/gen.py` paints
  PLACES only — no people, no lettering (a sign would give a GeoGuesser answer away). A model
  **never draws a real map**: a wrong coastline in a geography app teaches the error. Every
  map, pin, road and compass letter is drawn by the app.
- **Every painting says it is a painting.** GeoGuesser: "a painting, not a photo". Landmarks:
  "made with an AI image model — not a photograph". Earth Through Time: "an artist's
  impression — not a map".
- **Prompts live with their facts** (`app/src/data/{postcards,landmarks,eras}.js` `paint`),
  so a fact and its picture cannot drift. Look at every raw plate (`tools/art/raw/`,
  gitignored) before `tools/art/process.py` (which also trims painted paper borders).
- Places of worship are painted from outside, still, never as a prize. Sites a community has
  asked the world not to treat as an attraction (Uluru) are not on the shelf.
- The Gemini key lives at `/root/.gkey` (mode 600, `GKEY_FILE` overrides). **Never in the repo.**

### Product & code (inherited from the family, non-negotiable)

- **Every interaction works by keyboard AND touch.** Maps: tap, drag, pinch — or focus, arrows
  move a cross (Shift faster), +/− zoom, Enter chooses (`src/mapui.js`). `test/ui.mjs` answers
  a map question both ways.
- **A wrong answer holds until dismissed; a right one auto-advances.**
- **Child data is minimal by construction**: first name, age band, avatar. Never a birthdate,
  surname, school, photo or **location** — GeoGuesser never uses the device's position.
  **Nothing is transmitted**: no accounts, analytics, ads or third-party requests
  (`test/ui.mjs` fails on any). The privacy page says so and must stay true.
- **No ads, no streaks, no loot.** Rank moves only with right answers.
- **All storage behind the `Store` seam** (`src/store.js`), versioned — add a `vN_to_vN+1`
  step, never edit an old one.
- **State is a household.** A second child never inherits the first's anything.
- **Tester mode opens gates; it never rewrites the child.**
- **Never** put a real model identifier in commits, PRs, code, or any pushed artefact.

## Google Maps / Street View — deliberately not used

A Street View GeoGuesser would need the child's browser to call Google with an API key that
ships in public JavaScript, and Google's terms forbid storing the images so they cannot be
bundled. That breaks "nothing is transmitted". If it is ever wanted, it must be a
grown-up-enabled, clearly labelled mode, the privacy page updated **first**, the key
restricted by HTTP referrer to `aayuvis.github.io` — and a decision by the owner, not a
default. Freely licensed photos (Wikimedia Commons, credited) would fit the rules better;
this environment's network policy currently blocks Wikimedia.

## Verify

```bash
cd app && npm install
npm test                         # data, 34k questions, levels, model, library self-tests
npm run build && npm run check   # the BUILT app in Chromium under /Bizzing_Geography/, desktop + phone
```

**Prove an assertion by breaking it.** The leak test, the capital-in-country test and the
depiction test were each watched to fail before they passed.

## Rebuild the map data

```bash
cd tools/geo && npm install      # mapshaper, world-countries, flag-icons
NE=/path/to/natural-earth BIZZING_INDIA=../../../bizzingindia.com node build.mjs
```

`$NE` holds `ne_10m_admin_0_countries_ind.*`, `ne_10m_admin_1_states_provinces.geojson`,
`ne_10m_populated_places_simple.geojson` (from `nvkelso/natural-earth-vector`). The build
fails loudly on any missing capital, shape, flag, or state count.

**Known gaps in Bizzing India's `map-data.js`**, handled in the build and worth fixing at the
source: Jammu & Kashmir is typed as a state (a UT since 2019); Dadra & Nagar Haveli and Daman &
Diu are still separate (one UT since 2020); Lakshadweep has no island paths though the header
says it does (drawn here as a schematic chain of dots).

## Ship

Commit first, then `cd app && ./deploy.sh`. It runs the tests, builds, replaces `gh-pages`
wholesale and refuses to publish if the staged file count differs from the build.

## Where to pick up

1. **A second reader for Landmarks and Earth Through Time** — then set `LANDMARK_NEEDS_REVIEW`
   / `ERAS_NEED_REVIEW` false.
2. **Real photos**, if the owner wants them: Wikimedia Commons (network policy) or an opt-in
   Street View mode (above) — the owner's call.
3. **More postcards** per continent (Africa and South America are thinnest), and more states
   (Brazil, China, Germany) — each needs a capital list checked against its government.
4. **Wire the Schedule writer** (`Bizzing_Schedule/integration/bizzing-activity.js`).

## Branch

Development happens on `claude/festive-johnson-r5be1n` unless told otherwise.

## Commit trailer

```
Co-Authored-By: Claude <noreply@anthropic.com>
```
