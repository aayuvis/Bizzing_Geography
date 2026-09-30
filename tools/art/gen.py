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
for c, L in data('history', 'CONTINENT_HISTORY').items():
    for e in L: JOBS['hist-' + e['id']] = (e['paint'] + ' No people, no figures, no lettering. ' + STYLE, '16:9')

# The avatar picker (model.js AVATAR_PACKS): five packs of eight, all painted for
# this app in the family's sticker style (Bizzing Maths' AV_STYLE, which was
# written from looking at Bizzing Bee's set). Every one is a CREATURE, never a
# person; every body carries a piece of geography — a tool, a continent's animal,
# an ocean, a landform or weather, a forest or a river. Flat magenta ground so
# process.py --avatars keys it to alpha; so no pink or magenta on the creature.
AV_STYLE = (
    "A cute chibi kawaii collectible sticker character for a children's geography app, in exactly the style of a "
    "premium mobile-game avatar set: ONE single character, full body, centred, facing the viewer, the whole "
    "character inside the frame with a comfortable margin all round. A smooth, even, medium-thick dark navy-brown "
    "outline around every shape. Glossy soft cel shading with gentle gradients and a small white specular "
    "highlight. Huge glossy dark eyes with two bright white star-shaped glints, soft peach blush ovals on the "
    "cheeks, a small happy smile. Stubby rounded little limbs, exactly the right number of them. Bright, friendly, "
    "saturated colours. A few tiny sparkles near the character. "
    "THE ENTIRE BACKGROUND IS FLAT PURE MAGENTA (hex FF00FF), one solid uniform field with nothing in it: no "
    "ground, no shadow, no scenery, no glow, no border, no vignette, and no magenta or hot pink on the character "
    "itself. ABSOLUTELY NO TEXT: no letters, no words, no numbers, no digits, no compass letters, no map labels, "
    "no writing of any kind anywhere in the image. No real map, no real coastline. Not a person, no human features "
    "beyond the cute face."
)
AVATAR = {
    # Explorer's Kit — bodies built from a geographer's tools
    'compowl':    "An owl whose round body IS a brass magnetic compass: a round glass face on its tummy with a plain red-and-white needle and plain tick marks only (no letters), brass rim, small brown wings, tufted ears.",
    'globetortle':"A turtle whose domed shell is a toy globe: a smooth blue shell with a few ROUND polka-dot spots of green (simple circles, NOT continents, NOT any map of Earth), a thin brass ring round the shell like a globe's meridian, green head and four stubby legs.",
    'scrollfox':  "A fox whose big fluffy tail is a rolled-up parchment map scroll with faint dotted paths and tiny tree doodles (no words), orange and cream fur.",
    'telescrane': "A small crane bird holding a brass spyglass telescope to one eye with its wing, white and slate-grey feathers, long legs, a red crown patch.",
    'backpackbear':"A little brown bear wearing a green explorer's backpack with a rolled sleeping mat on top and a canteen at its side, a khaki sun hat on its head.",
    'lanternbug': "A glowing firefly whose round tail is a warm golden camping lantern, tiny clear wings, a dark green body, holding a tiny walking stick.",
    'binobat':    "A tiny fruit bat with soft brown fur and wide wings, wearing a pair of black binoculars on a strap round its neck, big pointed ears.",
    'pinguin':    "A penguin whose body is shaped like a round red map-pin marker (the teardrop pin shape, with a white circle on its tummy), black flippers, orange feet.",
    # Seven Continents — one creature from every continent
    'savannalion':"A young lion cub from the African savanna with a small fluffy golden mane, sitting beside a tiny acacia tree sprout.",
    'snowleopard':"A snow leopard cub from the mountains of Asia, pale grey fur with dark rosettes, a very long thick fluffy tail curled round, a sprinkle of snowflakes.",
    'hedgehog':   "A European hedgehog with brown spines and a cream face, carrying a small red-capped mushroom and an acorn.",
    'bison':      "A North American bison calf, shaggy dark brown woolly shoulders, small curved horns, a sprig of prairie grass in its mouth.",
    'llama':      "A llama from the Andes of South America with fluffy cream wool, wearing a woven wool blanket in bright orange, yellow and teal stripes.",
    'kangaroo':   "A kangaroo from Australia in Oceania, sandy orange-brown fur, a tiny joey peeking out of its pouch, big feet.",
    'emperor':    "An emperor penguin chick from Antarctica, fluffy silver-grey down, black cap with white cheeks, standing on a tiny ice floe.",
    'camel':      "A two-humped Bactrian camel of the desert, fluffy sandy-brown coat, a small woven saddle blanket, long eyelashes.",
    # Ocean Crew — the five oceans' friends
    'whale':      "A blue whale calf, smooth blue-grey body with a pale grooved throat, a little water spout above its head making a tiny rainbow.",
    'seaturtle':  "A green sea turtle swimming, a patterned olive-green shell, flipper legs, a few bubbles.",
    'dolphin':    "A bottlenose dolphin leaping in a small arc, grey with a pale belly, a splash of water drops.",
    'octopus':    "A friendly orange octopus with exactly eight curly arms, round head, holding a small seashell.",
    'clownfish':  "A clownfish, bright orange with three white stripes edged in black, peeking out of a green sea anemone.",
    'seahorse':   "A golden-yellow seahorse with a curled tail, a little crown-like crest, a few bubbles.",
    'manta':      "A manta ray gliding, dark navy top with white underside visible at the wing tips, wide wing fins, two small head fins.",
    'walrus':     "A walrus pup from the Arctic Ocean, plump cinnamon-brown body, short white tusks, bristly whiskers, flippers.",
    # Wild Earth — landforms and weather as creatures
    'volcadrake': "A small friendly dragon whose body is a little volcano mountain of dark grey rock, a gentle puff of white steam from the top, warm orange glow in the cracks, stubby legs, tiny wings, no teeth showing.",
    'cloudlamb':  "A lamb made of a soft white fluffy cumulus cloud, a few tiny raindrops falling below it, small grey hooves and face.",
    'rainbowleon':"A chameleon whose body has bands of rainbow colours (red, orange, yellow, green, blue, violet), a curled tail, standing on a small twig.",
    'glacieryak': "A yak whose shaggy coat is pale icy blue and white like a glacier, with a little snow cap on its horns, icicle fringe.",
    'fennec':     "A fennec fox of the Sahara, pale sandy fur, huge ears, sitting on a small sand dune ripple.",
    'mountaingoat':"A white mountain goat with small black horns and a beard, standing on a tiny rocky peak with a patch of snow.",
    'stormcat':   "A calm, friendly cat whose fur is a soft grey rain cloud, with a small yellow lightning-bolt shaped tail tip, sitting neatly.",
    'coralcrab':  "A little crab whose shell is a piece of colourful coral reef in orange, yellow and teal, two small claws, six legs.",
    # Forest & River — rainforests, woodlands and rivers
    'toucan':     "A toucan with a huge bright orange-yellow beak, black body, white throat, perched on a short branch.",
    'sloth':      "A three-toed sloth hanging from a short green vine by its arms, shaggy tan fur, a sleepy smile, a tiny leaf on its head.",
    'koala':      "A koala hugging a eucalyptus branch with blue-green leaves, fluffy grey fur, big round ears, a large dark nose.",
    'beaver':     "A beaver with brown fur and a flat paddle tail, holding a small stick, two front teeth showing in a friendly grin.",
    'jaguar':     "A jaguar cub with golden fur and black rosettes, round ears, a long spotted tail.",
    'hippo':      "A pygmy hippo, smooth purple-grey skin (not pink), sitting in a small puddle of river water with a lily pad on its head.",
    'treefrog':   "A red-eyed tree frog, bright green body with blue and orange sides, big red eyes, clinging to a leaf.",
    'riverotter': "A river otter floating on its back holding a smooth pebble, glossy brown fur, cream chin, a few water ripples.",
}
for k, v in AVATAR.items(): JOBS['av-' + k] = (v + ' ' + AV_STYLE, '1:1')
for e in data('expeditions', 'EXPEDITIONS'): JOBS['crs-' + e['id']] = (e['paint'] + '. No people, no lettering, no real map. ' + STYLE + ' Very wide landscape composition.', '21:9')

GROUPS = {'postcards': 'pc-', 'landmarks': 'lm-', 'eras': 'era-', 'history': 'hist-', 'avatars': 'av-', 'courses': 'crs-', 'worlds': 'w-', 'library': 'lib-'}


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
