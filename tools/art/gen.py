#!/usr/bin/env python3
"""gen.py — paint the Atlas, the world boards, and every plate in the Library
with a Gemini image model.

The family doctrine (Bizzing-Videos docs/02; Bizzing Maths tools/art): image
models paint PLACES; everything structural is drawn by the app. So:
  · no people, and no lettering, digits or signs anywhere — a sign would
    give a GeoGuesser answer away, and a model letters badly;
  · the road across a world board, every pin, every map of real countries
    is drawn by the app as SVG. A model never draws a real coastline: a
    wrong map in a geography app would teach the error.

The postcard, landmark and era prompts live WITH their facts, in
app/src/data/*.js (`paint`), and are read from there — one source, so a
fact and its picture cannot drift apart.

    python3 tools/art/gen.py --only w-home,atlas
    python3 tools/art/gen.py --group postcards      # every pc-*
    python3 tools/art/gen.py --force --only lm-taj-mahal

The key is read from $GKEY_FILE or /root/.gkey (never from the repo, never
printed). Output: raw PNGs in tools/art/raw/ (gitignored); then process.py
sizes them into app/public/art/. LOOK at every raw plate before it ships.
"""
import base64, json, os, subprocess, sys, time, urllib.request, concurrent.futures as cf

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
RAW = os.path.join(HERE, 'raw')
os.makedirs(RAW, exist_ok=True)
KEY = open(os.environ.get('GKEY_FILE', '/root/.gkey')).read().strip()
MODELS = os.environ.get('NB_MODELS', 'gemini-3-pro-image,gemini-3.1-flash-image,gemini-2.5-flash-image').split(',')

NOTEXT = ("ABSOLUTELY NO TEXT: no letters, no words, no numbers, no digits, no signs with writing, no labels, "
          "no captions, no map labels, no watermark, no signature. No people, no human figures, no faces. "
          "No frame, no border — one continuous full-bleed scene.")
STYLE = ("Painted illustration for a children's geography app, in a warm hand-painted storybook style: soft gouache "
         "and watercolour textures, gentle directional light, rich natural colour, clean readable shapes, a sense of "
         "wonder and of being somewhere real. " + NOTEXT)
POSTCARD = ("A painted travel postcard view, in a luminous realistic gouache style, true to the real place: its real "
            "plants, landforms, weather, light and building styles, painted accurately and respectfully, never a "
            "cartoon or a stereotype. Eye-level view as if standing there. " + NOTEXT)

WORLD = {
    'w-home':      "A wide panorama of a cheerful little town seen from a gentle hill, as if from above like a map: a park, a school with a playground, a river with a bridge, a railway line, a market square, houses with gardens, a big weathervane with plain arrow arms on a tower. Morning light, fresh greens and warm roofs.",
    'w-landwater': "A wide panorama showing many landforms at once, like a picture dictionary of the land: a snowy mountain, rolling hills, a valley with a winding river running to a lake, a waterfall, a small island in a bay, a sandy peninsula, a sea cliff, a volcano far away. Bright clear day.",
    'w-continents':"A wide panorama of a great harbour of the world at golden hour: sailing ships and cargo boats, a lighthouse, a quay piled with crates and barrels and a large antique globe on a stand, sea stretching to the horizon, gulls far away.",
    'w-compass':   "A wide panorama of a tall old stone compass tower on a green headland, a giant brass compass rose inlaid in the paving of the square in front of it, with plain pointed arms and NO letters, a sundial, a flagpole with a plain pennant, fields laid out in a neat grid below, sea on one side.",
    'w-capitals':  "A wide panorama of a grand bazaar of the world under a great glass dome: stalls under striped awnings of every colour, baskets of spices and fruit, carpets, lanterns, rolled maps and globes on tables, flags that are plain coloured stripes with no symbols. Warm lamplight, no people.",
    'w-weather':   "A wide panorama of a ridge where the weather changes from left to right: sunny meadow, then puffy clouds and a rainbow, then a rain shower over a lake, then a snowy peak with a blizzard. A little weather station with a wind vane, a rain gauge and a windsock on the ridge.",
    'w-rivers':    "A wide panorama following one river from its source to the sea, left to right: a spring in snowy mountains, a waterfall, a gorge, a wide meandering river through green farmland with an oxbow lake, then a fan-shaped delta of many channels into the sea.",
    'w-globe':     "A wide panorama of a lighthouse on a rocky point at twilight, beside a big open-air brass armillary sphere and a large globe on a pedestal, the sky half night with stars and half dusk, the sea calm. Lines of latitude glowing faintly as gentle curves on the globe only.",
    'w-restless':  "A wide panorama of a dramatic volcanic island: a smoking volcano with a glowing lava flow reaching the sea in steam, a crack in the ground across a field, hot springs and geysers, layered cliffs showing rock strata, black sand beach.",
    'w-people':    "A wide panorama of a riverside city growing out into the countryside: a dense centre of towers, bridges and trains, then suburbs, then farms, wind turbines and a solar field, a port with containers, a highway and a railway leading away. Clear late-afternoon light.",
}
ATLAS = ("A storybook fantasy map of ONE imaginary island, seen from above at a gentle angle, painted like the endpapers "
         "of a children's adventure book. The island has TEN clearly different regions around a winding road that makes a "
         "loop: (1) a little town with a park, lower left; (2) a valley of landforms with a river, lake and volcano, "
         "left; (3) a harbour with ships and a giant globe, upper left; (4) a stone compass tower on a headland, top; "
         "(5) a bazaar under a glass dome, upper centre; (6) a weather ridge with a rainbow and a snowy peak, upper "
         "right; (7) a long river delta, right; (8) a lighthouse with an armillary sphere, lower right; (9) a smoking "
         "volcano island region, bottom; (10) a modern city with wind turbines, centre. Blue sea all round with soft "
         "waves and little ships. A plain compass rose with arrow points and NO letters in one corner of the sea. " + NOTEXT)
HERO = ("A wide, joyful storybook panorama for the top of a children's geography app home screen: a hot-air balloon "
        "drifting over a patchwork of the world's landscapes blending into each other from left to right — a green "
        "valley, a desert with dunes, a rainforest, snowy mountains and a blue coast — under a bright morning sky with "
        "soft clouds. The left third is calmer sky. " + NOTEXT)
LIB = {
    'lib-geoguess':  "A stack of painted travel postcards of different landscapes fanned across a wooden table, a magnifying glass, a brass compass and a pushpin.",
    'lib-capitals':  "A grand domed capitol-style building with columns at the end of a wide avenue of trees, flags that are plain coloured stripes, fountains, blue sky.",
    'lib-states':    "A patchwork quilt-like landscape seen from above, fields of many colours stitched together by roads and rivers, like a map of regions.",
    'lib-landmarks': "A traveller's shelf with small models of famous landmarks — a pyramid, a leaning tower, an iron lattice tower, a domed tomb, a suspension bridge — beside a globe.",
    'lib-time':      "A cliff face with many coloured layers of rock like pages of a book, a fossil ammonite in one layer, a small waterfall, a path winding up past the layers.",
    'lib-flags':     "Many plain coloured pennants and banners with simple stripes and no symbols fluttering on a line of flagpoles against a blue sky over a harbour.",
    'lib-explorer':  "An explorer's desk with a large antique globe, a brass telescope, dividers, a spyglass and rolled blank maps, lit by a warm lamp and a round window onto the sea.",
    'lib-dictionary':"A big open book on a lectern with blank pages, surrounded by small painted vignettes floating above it: a mountain, a river, an island, a volcano, a cloud.",
}


def data(module, name):
    """Read an exported array from app/src/data/<module>.js via node — one source for facts and prompts."""
    js = f"import('{ROOT}/app/src/data/{module}.js').then(m => process.stdout.write(JSON.stringify(m.{name})))"
    return json.loads(subprocess.check_output(['node', '-e', js]))


JOBS = {}
for k, v in WORLD.items(): JOBS[k] = (v + ' ' + STYLE + ' Very wide landscape composition.', '21:9')
JOBS['atlas'] = (ATLAS + ' ' + STYLE, '16:9')
JOBS['home-hero'] = (HERO + ' ' + STYLE + ' Very wide banner.', '21:9')
for k, v in LIB.items(): JOBS[k] = (v + ' ' + STYLE + ' Landscape tile composition.', '4:3')
for p in data('postcards', 'POSTCARDS'): JOBS[p['id']] = (p['paint'] + ' ' + POSTCARD, '16:9')
for l in data('landmarks', 'LANDMARKS'): JOBS['lm-' + l['id']] = (l['paint'] + ' ' + POSTCARD, '4:3')
for e in data('eras', 'EARTH'): JOBS['era-' + e['id'][2:]] = (e['paint'] + ' ' + STYLE, '16:9')

GROUPS = {'postcards': 'pc-', 'landmarks': 'lm-', 'eras': 'era-', 'worlds': 'w-', 'library': 'lib-'}


def call(model, prompt, ratio):
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": ratio}}}
    req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                                 data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "x-goog-api-key": KEY})
    with urllib.request.urlopen(req, timeout=240) as r:
        d = json.load(r)
    for c in d.get('candidates', []):
        for p in c.get('content', {}).get('parts', []):
            if 'inlineData' in p: return base64.b64decode(p['inlineData']['data'])
    raise RuntimeError('no image in response: ' + json.dumps(d)[:300])


def run(name):
    prompt, ratio = JOBS[name]
    out = os.path.join(RAW, name + '.png')
    msg = ''
    for attempt in range(6):
        model = MODELS[attempt % len(MODELS)]
        try:
            img = call(model, prompt, ratio)
            open(out, 'wb').write(img)
            return f'{name}: ok ({model}, {len(img)//1024} KB)'
        except Exception as e:
            msg = str(e)[:160]
            time.sleep(4 + attempt * 6)
    return f'{name}: FAILED — {msg}'


if __name__ == '__main__':
    arg = lambda flag: next((a.split('=', 1)[1] if '=' in a else sys.argv[sys.argv.index(a) + 1] for a in sys.argv if a.startswith(flag)), None)
    only, group = arg('--only'), arg('--group')
    if only: names = only.split(',')
    elif group: names = [n for n in JOBS if n.startswith(GROUPS[group])]
    else:
        names = list(JOBS)
        print(f'no --only or --group given: generating EVERYTHING missing ({len(names)} jobs)')
    unknown = [n for n in names if n not in JOBS]
    if unknown: sys.exit('unknown jobs: ' + ', '.join(unknown))
    if '--force' not in sys.argv: names = [n for n in names if not os.path.exists(os.path.join(RAW, n + '.png'))]
    with cf.ThreadPoolExecutor(int(os.environ.get('NB_WORKERS', '6'))) as ex:
        for line in ex.map(run, names): print(line, flush=True)
