# CLAUDE.md — Bizzing Geography

Read this first, then [CONCEPT.md](CONCEPT.md), then [app/README.md](app/README.md).

## What this is

**Bizzing Geography** — a map-first web app for kids **6–14**: maps and compasses, landforms,
continents and oceans, countries and capitals, weather and climate, rivers and mountains,
latitude and time, the restless Earth, and people and places — ending in a Library of
Where on Earth?, Country Capitals, State Capitals, Famous Landmarks, Earth Through Time, Flags,
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
   **History is soft zones, never lines** (Bizzing India's era-map rule). Earth Through
   Time's continent roads (`data/history.js`) draw each people or empire as a blurred circle
   (`worldSVG` `zones`) on a map with **no country lines** (`borders: false`); modern borders
   appear only in each continent's last age, "today". Colonial and war-time ages draw no
   empire zones at all — the dots are places to visit. Oceania's map is centred on the
   Pacific (`rot: 170`) so Polynesia is not torn at the edges. Hard moments (`hard: true`:
   conquest, slavery, colonial cruelty, the Holocaust) show only in the 11–14 band, and the
   age says there is more; told plainly, never graphically.
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
  PLACES only — no people, no lettering (a sign would give a Where on Earth? answer away). A model
  **never draws a real map**: a wrong coastline in a geography app teaches the error. Every
  map, pin, road and compass letter is drawn by the app.
- **Every painting says it is a painting.** Where on Earth?: "a painting, not a photo". Landmarks:
  "made with an AI image model — not a photograph". Earth Through Time: "an artist's
  impression — not a map".
- **Prompts live with their facts** (`app/src/data/{postcards,landmarks,eras}.js` `paint`),
  so a fact and its picture cannot drift. Look at every raw plate (`tools/art/raw/`,
  gitignored) before `tools/art/process.py` (which also trims painted paper borders).
- Places of worship are painted from outside, still, never as a prize. Sites a community has
  asked the world not to treat as an attraction (Uluru) are not on the shelf.
- **Every US national park is on the Landmarks shelf** (all 63 — the owner; `data/landmarks-parks.js`,
  `US_PARKS` in `data/landmarks.js`, held to 63 by the selftest). The two in US territories (American Samoa,
  the Virgin Islands) are filed under the territory with `also: 'US'`. A landmark quiz asks only the 195 as
  countries and takes at most two landmarks from one country (`quizPool`), or sixty-three parks would make
  every answer "the United States". A place below the map's resolution declares how it is checked
  (`offshore: <km>`, or `near: '<shape>'`), with the reason written beside it.
- **Ninety-six avatars, twelve packs of eight** (`src/avatars.js`, family standard v2 §8), through
  the family's own engine, vendored byte for byte (`src/bizzing-avatars.js` + `styles/bizzing-avatars.css`;
  `test/avatars.mjs` holds `validate()` to `[]` and the files to the Hive's). Five packs painted here first
  (Explorer's Kit, Seven Continents, Ocean Crew, Wild Earth, Forest & River), Bee's **Big Beasts** and
  **Elements**, and five painted for the worlds (Deep Sea, Canopy, Oasis, Ice Floe, High Peaks — `gen.py`
  `AVATAR2`). Two packs to each world, 2 Common · 3 Rare · 2 Epic · 1 Legendary; a Legendary waits for a
  named MEDAL (learning), then coins. **The owner overrode "all free"**: Commons are free, the rest are
  bought with Bizzing coins. Store v6 grandfathers the face and world a child already had.
  Creatures only — never a person or a deity — and no real map on any of them.
  `process.py --avatars` **fails on a ghost**: a ground that was not pure magenta keys the
  creature half away; repaint anything it names.
- **Shelly** the sea turtle is the mascot (`src/mascot.js`, six poses in `public/mascot/`, the app icon on
  teal with map contours). Her globe shell carries only latitude and longitude lines — **no continents**:
  the "a model never draws a real map" rule wins over the concept sheet.
- **Worlds** (the six themes) each have a painted far plane by day (`art/wd-*`) and one repainted from it by
  night (`art/wn-*`), drawn as the scene's back layer, with Shelly's idle loop in front.
- The Gemini key lives at `/root/.gkey` (mode 600, `GKEY_FILE` overrides). **Never in the repo.**

### Product & code (inherited from the family, non-negotiable)

- **Every interaction works by keyboard AND touch.** Maps: tap, drag, pinch — or focus, arrows
  move a cross (Shift faster), +/− zoom, Enter chooses (`src/mapui.js`). `test/ui.mjs` answers
  a map question both ways.
- **A wrong answer holds until dismissed; a right one auto-advances.**
- **Child data is minimal by construction**: first name, age band, avatar. Never a birthdate,
  surname, school, photo or **location** — Where on Earth? never uses the device's position.
  **Nothing is transmitted** but Where on Earth?'s Street View photos (below): no accounts,
  analytics, ads or other third-party requests (`test/ui.mjs` fails on any). The privacy page
  and footer say exactly this and must stay true.
- **No ads, no streaks, no loot.** Rank moves only with right answers.
- **All storage behind the `Store` seam** (`src/store.js`), versioned — add a `vN_to_vN+1`
  step, never edit an old one.
- **State is a household.** A second child never inherits the first's anything.
- **Tester mode opens gates; it never rewrites the child.**
- **Six themes, the child's own** (`src/themes.js`, `styles/themes.css` — Bizzing Maths'
  system): Old Atlas (default), Ocean Deep, Rainforest, Desert Dunes, Polar Aurora, Satellite.
  A theme sets every colour token in both modes **including the map's own** (`--sea`, `--land`,
  `--land-hl`…) and three self-hosted faces; its living scene is below. `test/themes.mjs` holds each theme × mode to WCAG and
  to a visible coast: land and sea ≥ 55 apart in colour and the sea the bluer — proven by
  breaking it. Light/dark stays the device's; the theme lives on `k.prefs.theme`.
- **Never** put a real model identifier in commits, PRs, code, or any pushed artefact.

## The shape of the app (the family's, harmonised)

- **Tabs: Home · Atlas · Expeditions · Library · Play · My Feed** (My Feed last, FAMILY-STANDARD §6a; a grown-up can switch it off behind the PIN). "My road" is the Atlas's second tab,
  **Your journey** (the ten levels as a strip, then the level's stations) — the road only ever
  explained the map.
- **Home is Bizzing Bee's and India's shape**: greeting card (avatar + speech bubble), **Today's
  ring** (sessions today against a 2/3/5 goal — `model.js session()`; today only, nothing carries
  over, so it is not a streak), word of the day; two picture journey cards (next station, your
  expedition); today's place and landmark of the day. Rank lives in the header pill and on Me.
- **Expeditions** (`data/expeditions.js`, `src/expeditions.js`, `src/projects.js`) are Bizzing
  India's **Paathshala**, laid out like the Atlas: a painted plate (`art/crs-<id>.webp`), a road,
  a camp per part and a 🏁 final camp, a pick-card below. Ten expeditions of 20–30 days; each part
  = learn, learn, practise, **test**, then **make** — and the making happens **in the app**, never
  "at home". Each expedition ends with a final test (15 questions) and a final project, then a
  certificate and a gallery of what the child made. Every lesson is an existing stop or tool;
  every quiz comes from the stops' own generators. **The day rule**: a test counts as learned only
  at 8/10 on a LATER day than its teaching — `ledger` is the only door, `test/expeditions.mjs`
  proves it both ways. Grown-ups see objectives learned, never minutes.
  **Projects** are five engines in `projects.js` (map-maker grid, route across real neighbours,
  put-in-order, sort, design-a-flag), each `init / view / act / goals / solve`. Goals are a live
  checklist measured from the child's work; "Finish" stays disabled until every goal is met.
  Every fact a goal checks (neighbours, landlocked, hemisphere, continent, east-to-west order)
  comes from the data. `selftest` proves every project is solvable and not done at init. A
  project's size field is `count`, never `n` — `daysOf` numbers days with `n` and overwrote it.
- **Earth Through Time is the painting.** No slider, no numbered buttons: the plate carries
  when, title and the story in an accordion, arrows on its edges and dots along its top. On a
  desktop (≥1000px) the painting and its card (map, sites, moments, quizzes, sources) sit side
  by side in one screen — `test/ui.mjs` asserts it fits. On a phone the words are one dark panel
  right under the picture (never clipped) and a swipe across the painting steps through time.
- **Where on Earth?** (the place-guessing game; never call it by a trademarked game's name —
  the internal id stays `geoguess`, because stored data is keyed by it) is laid out like the
  real thing: the picture is the screen, the map a small inset in the corner. Click it or press
  M to open it; tap, or drag the pin (on the whole-world view a drag anywhere places it),
  then **Guess** confirms. A photo is two Street View views side by side (180°); drag the
  picture, ‹ › or [ ] to look around. On a phone the picture keeps its shape at full height
  and scrolls sideways under the finger.
- **A capital card pops up over the map** (Country and State Capitals, `ask.js` `panel`), never
  below the fold; ✕ or Esc closes it. No explanatory text blocks on those pages — a count
  ("12 / 50 known") and the map.
- **The welcome is Bizzing Finance's**: a landing page, then one question a screen with Shelly as
  guide — name, age, **five** Common faces, **two** open worlds — and then an easy first question on the
  whole map whose right answer is celebrated (A8), then the first stop.
- **Above the fold is for doing.** Page heads are one row (no subtitle on a phone); tool pages
  lead with their controls; filter rows scroll in one line. `test/ui.mjs` asserts each key
  screen's core content starts above the fold, desktop and phone.
- **Living scenes** (`src/scenes.js`, `styles/scenes.css`): Bizzing Bee's worlds4 model, 40–100
  props per theme, calm (paused) during a quiz run and on the device's "Still background" switch;
  the Satellite globe is painted from the app's own map data. Scene classes are prefixed `s-`/`scn`
  because the app already owns `.sky`, `.bubble` and `.sc`.

## Play (the games)

Seven games on the **Play** tab, each a Library-contract file in `src/games/` (`TOOL`, `view`,
`act`, `key`, `selftest`), routed at `#/game/<id>` (an old `#/lib/geoguess` link lands there).
`games/meta.js` names them; `games/kit.js` is the shared title card, finish card and HUD.
Every fact a game asks comes from the data, and each proves its puzzles before showing them:

- **Shelly's Trade Winds** (the flagship; `tradewinds.js` screen, `tw-engine.js` rules,
  `tw-data.js` facts, `TRADEWINDS_NEEDS_REVIEW`): sixty real ports sleep; each grows its
  **climate band's** cargo; a ship that brings a port something it cannot grow wakes it. One
  month a turn, and nothing moves until **Next month** (Sabhyata's Sochna). Wind belts and the
  monsoon change leg times by month; cyclone season makes a ship wait; winter ice closes the
  far north (so Reykjavík is iced in for a January start — by design). Goodwill opens four
  ages (sail 1800, steam, Suez 1869, Panama 1914), each with its painting and history.
  **The sea lanes are measured from the app's own map** (`tools/geo/sealanes.mjs` →
  `data/sealanes.js`: a 0.5° grid, straits carved from sourced coordinates, canals by era,
  and a canal never makes a voyage longer). `test/games.mjs` proves every start can light all
  sixty ports in 1–5 game-years, every port is reachable, and no lane crosses land away from a
  port, strait or canal — each watched to fail first.
  **The chart is drawn, not painted**: `worldSVG`'s `under` layer puts the sea, climate bands,
  storms, ice and winds beneath the land; ports are lanterns, ships are SVG ships of their age
  (sail, then steam). Paintings (`art/game-tw-*`) are places and ships only — never a map.
  On a phone the chart opens on the selected port's ocean (`phoneView`) with zoom buttons.
- **Neighbour Chain** (land borders counted only when BOTH countries list them),
  **Hot & Cold Compass** (found = inside the country or within 150 km of the capital),
  **Bigger or Smaller?** (main-shape area; "foolers" are ≥15° further from the equator),
  **Shape Detective** (true-shape outlines, clues from the data), **Sun Clock** (sun time from
  longitude; the night side drawn only after the answer), and **Where on Earth?**, moved here
  from the Library.
- Medals for play (`rewards.js`) come from what each game recorded, never from time played.

## The family layer (Bizzing_Schedule docs/family/FAMILY-STANDARD.md)

The shared spec every Bizzing app follows. Here it lives in five files:

- **`src/family.js`** — adapts the family's vendored drop-ins (`bizzing-activity.js`, `bizzing-wallet.js`,
  `bizzing-avatars.js`, byte for byte) to this app; the bodies below describe the contract they keep:
  `bizzing.activity` (active minutes `{a,d,t,m,who}` and milestones `{…,m:0,ev,label}`) and
  `bizzing.wallet` (one wallet per child by lower-case first name; `earn` pays only the standard
  amounts — right 1 · station/day/round 5 · mastered 20 · level check 10 — capped at 100 a day per
  app; `spend` at printed prices, never below zero; append-only ledger). `test/family.mjs` holds the
  contract; `test/avatars.mjs` proves the vendored files are the Hive's, byte for byte.
- **`src/next.js`** — THE next step. Home's Continue, `#/continue` and the end of the welcome all ask
  it. Home has exactly one primary button (asserted).
- **`src/rewards.js`** — rank moves only on learning (`xpFor`: 1 per right answer while it is being
  learned, 0 on an aced station, ≤15 a day per source; mastery bonuses on top); 30+ medals computed
  from evidence, each celebrated once (`k.medals`; medals deserved before store v5 are recorded
  quietly); the map shop (pins, frames) — a look, never content, never chance, never rank.
- **`src/demo.js`** — `?demo`: a labelled sample with three weeks of progress, held in memory; it
  saves nothing and writes no shared key (asserted).
- **Top bar** (56px, the family order): ⬡ back to the Hive · name · theme · 🔒 · avatar ▾. Shelly beside the
  name is the whole turtle (`mascot/shelly-brand.webp`), never the cropped head. The avatar ▾ opens Bee's menu
  (`whoMenu`): every child with the current one ticked, then **My page — avatar, badges, collection**,
  **Settings**, **+ Add a child** (marked grown-ups; hidden in the sample). `?from=hive` shows "← back to my day".
- **Read it to me**: 🔊 on every question, lesson and instruction, in the **device's own voice**
  (an Indian English one first). **No recorded clips** (the owner's decision). 6–7 auto-reads.
- **Report card**: Time (active minutes from the feed) · Progress (level, road, expeditions) ·
  Mastery (worlds, capitals, flags, objectives learned). Per child: ring goal, read-aloud, delete.
- **Weight**: Where on Earth? and Earth Through Time load on demand (`library/index.js loadTool`,
  prefetched when idle so they work offline). The browser check holds initial JS ≤ 400 KB gzipped
  and the phone's first screen ≤ 1.5 MB.
- **Tabs: Home · Atlas · Expeditions · Library · Play · My Feed** (the owner kept "Expeditions" and asked for Play; My Feed is last, owner 2 Oct 2026): a tab row under the top bar
  at ≥900px, a bottom bar below. Everything else is in the **☰ drawer** (`src/chrome.js`): My page · Shop ·
  Collection · Medals · Your journey · My mistakes · Where on Earth? · My Feed (Search when the feed is off — the shell takes four app rows) · Settings · Grown-ups · Help ·
  Privacy · Back to the Hive, with a one-tap mute.
- **Top bar** (standard §3): ⬡ Hive · ☰ · Shelly + Bizzing Geography · search · coin chip (opens the wallet
  history) · light/dark · 🔒 · avatar ▾. **Settings** is Bee's sheet in five sections (Me · Sound & music ·
  Look · Comfort · Grown-ups). **Shop**: Avatars · Worlds (240 coins each, or the family plan — a grown-ups'
  flag until the family server) · Extras (map pins and frames), then the wallet history.
- **Music** is composed in code (`src/music.js`, `music/CREDITS.md`): a loop per world, home and games,
  default 40%, ducks under effects and read-aloud, paused when hidden, off in Calm mode. No narration.
- **Learning** (family audit E4/E6/F3/C4): typed and put-in-order items beside multiple choice; one hint per
  question (`src/hints.js`; a hinted right answer pays no coin); the mistakes deck (`src/mistakes.js`) brings
  a miss back after a gap; one search over stops, places, countries, every state and state capital of the eight State Capitals countries, 2,600 cities (loaded on the first search; a city opens the Map Explorer with a pin), landmarks and words (`src/search.js`) — accents, case and punctuation never decide a match ("washington dc").
  Stars come only from answers and fall due for review after four weeks; a miss then drops one star.

## My Feed (FAMILY-STANDARD §6a)

- **Cut, never typed.** `tools/build-feed.mjs` cuts the cards from the corpus into `app/src/data/feed/`
  (`index.js` for the ranking, `g-L1…g-L10.js` and `g-any.js` for the words). Every card names its `src`;
  `test/feed.mjs` resolves each one, finds its words there, refuses near-duplicates (≥ 80% the same words)
  and holds every road to ≥ 100 cards and the level-agnostic ones to ≥ 300. Change a stop, a word, a
  country or an expedition → `node tools/build-feed.mjs`, or the test fails.
- **Held back:** Landmarks, Earth Through Time and the continent histories while their review flags are up;
  Street View places (the feed makes no third-party request — `test/feed-ui.mjs`); questions answered by a
  figure; map questions whose list names the answer.
- **A card about one thing opens that thing** (the owner): `#/lib/<tool>/<item>` opens Map Explorer, Country
  Capitals, Flags or State Capitals ON the country or state (`FOCUS` in main.js), and `#/expd/<id>/<day key>`
  opens the expedition on that day's part with the day lit (`partOfDay`). Every card carries a badge saying
  what it is, and its words are built from the data (neighbours, coast, area rank, hemispheres; a day's part,
  kind and stop). `test/feed.mjs` holds each card to its own link — watched to fail on one generic link.
- **Ranked on the device** by the family engine (`bizzing-feed.js`, vendored) from `src/feed.js`: the child's
  road as `level`, the last stops and expedition, the Library tools opened, the mistakes deck as `due`. A
  right answer pays one coin, once; nothing else in the feed pays or counts as learning.

## Real photos — Google Street View, on by default (the owner's decision)

Where on Earth? is **one journey**: every round mixes 3 real photos and 2 painted postcards, five
different countries (all paintings if photos are off). **1,518 verified real places in 116 countries** — from a pool of
2,641 in 191 countries (`data/places.js`, generated by `tools/geo/places.mjs` from Natural
Earth, each inside its own country on the map) — shown as live Street View photos, and 42
painted postcards. `geoguess.js` selftest fails below 1,000 places or 150 countries in the
pool, and below 1,000 verified places or 100 countries — proven by breaking it.

The photos come from Google, live, into the child's browser: the one third-party request in
the app. So, by rule:
- They load when a key is built in (`VITE_GMAPS_KEY`, from `/root/.gmapskey` via
  `deploy.sh`, never in the repo, **restricted by HTTP referrer to `aayuvis.github.io`** and
  to the Street View Static API) **and** `household.parent.streetview` is on — **on by
  default** (store v3 turned it on for every household: the owner asked for real photos to be
  on). A grown-up can untick it on the grown-ups' page; then the app contacts no one.
- The privacy page and the switch say exactly what Google sees (the device's address and which
  photo) and what it does not (anything about the child).
- **Nothing from Google is stored** — their terms forbid caching imagery. `return_error_code`
  makes a place with no imagery answer 404; the game swaps in a spare, uncounted.
- `tools/geo/verify-streetview.mjs` asks Google's free metadata endpoint, around each place,
  for a panorama **credited to Google** (car-captured, faces and plates blurred) and writes
  `data/sv-ok.js`: place id → panorama id. **User-uploaded photospheres are never used** —
  they can show anyone and anything; the Static API cannot filter them, so every photo is
  pinned to its verified panorama id. First run: 1,518 Google, 857 user-only (skipped), 264 none.
  Re-run it when the pool changes, and now and then (panoramas are retired).
- `test/photos-ui.mjs` builds with a stand-in key and answers Google's requests locally: on by
  default, one mixed round, a 404 place is skipped, and switched off means no request.

Wikimedia Commons photos (freely licensed, bundleable) would need no third party at run time;
this environment's network policy blocks Wikimedia.

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

Run `npm test` and `npm run check`, commit and push, then `cd app && ./deploy.sh` (about a minute). It
builds, replaces `gh-pages` wholesale and refuses to publish if the staged file count differs from the
build. It does **not** rerun the tests (the owner: all deploys from one chat, keep it fast) — so never
deploy a commit whose suite you have not just seen pass.

**The gatekeeper** (`deploy.sh`, before anything is built): every gh-pages commit is stamped "Built from
<sha>", and a deploy **refuses** unless that live commit is already inside HEAD — so no deploy can erase
another's work (two chats deploying from two branches once wiped the Play tab). It also refuses a dirty
`app/` and a HEAD that is not on GitHub, and names any branch whose `app/` work it does not carry. The
fix for a refusal is always the same: merge the live commit, test, commit, push, deploy. **One chat
deploys** (the owner, 3 Oct 2026) — the others push to their branch and leave the deploy to it.

## Where to pick up

1. **A second reader for Landmarks and Earth Through Time** (18 Earth steps, 8 map steps and
   50 continent ages, each with sources) — then set `LANDMARK_NEEDS_REVIEW` /
   `ERAS_NEED_REVIEW` / `HISTORY_NEEDS_REVIEW` false. The continent histories need a
   historian's eye most: especially the colonial, slavery and war ages.
2. **Restrict the Street View key** (in Google Cloud: HTTP referrer `https://aayuvis.github.io/*`,
   API restriction Street View Static API) — it ships in public JavaScript. It lives at
   `/root/.gmapskey` for `deploy.sh` and the verifier; never in the repo.
3. **More postcards** per continent (Africa and South America are thinnest). **State Capitals** has
   US, India, Canada, Australia, Brazil, Mexico, Germany and Nigeria. Ready next in the data: South
   Africa, Argentina, Malaysia, Egypt, Iran, Saudi Arabia, Chile, Peru, Poland, Austria, Switzerland.
   Needs merging first: Italy, Spain, France. **Not** China or Pakistan (their state lines contradict
   the India depiction) nor Nepal, Bangladesh, Kenya, Indonesia, Colombia (Natural Earth's divisions
   are out of date). Each capital list is checked by the build: every capital inside its own state.
4. **The human checks the art**: Shelly's six poses and icon, the 40 new faces and the twelve world plates
   were looked at once by the agent that made them; the owner may still swap the mascot (Kip, Roam).

## Branch

Development happens on `claude/festive-johnson-r5be1n` unless told otherwise.

## Commit trailer

```
Co-Authored-By: Claude <noreply@anthropic.com>
```
