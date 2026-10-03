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
# Five more packs (family standard v2 §8.1): one per living world — ocean, rainforest,
# desert, polar, mountains — so the catalogue reaches 96 with Bee's Big Beasts and
# Elements. Same sticker style, same rules: creatures only, a piece of geography each.
AVATAR2 = {
    # Deep Sea (Ocean Deep)
    'angler':     "A deep-sea anglerfish, round dark-teal body, a small glowing golden lure bobbing on a stalk above its head, a friendly closed-mouth smile with NO teeth showing.",
    'puffer':     "A pufferfish puffed up into a round ball, pale yellow with soft rounded spines and brown spots, tiny fins, cheeks round.",
    'seastar':    "A five-armed sea star, warm orange with tiny cream bumps in rows along each arm, standing on two of its arms.",
    'jelly':      "A moon jellyfish, a translucent pale-blue bell with four soft violet rings on top, short wavy frilly tentacles below.",
    'hermit':     "A hermit crab peeking out of a spiral seashell, red-orange claws, little stalk eyes, the shell cream with brown bands.",
    'seadragon':  "A leafy seadragon, a golden-yellow seahorse-like body covered in leafy frond-shaped fins in olive and orange, long snout, curled tail.",
    'squid':      "A small friendly squid, soft sky-blue body with a pointed fin-hood, eight short arms and two longer ones, holding a tiny pearl.",
    'orca':       "An orca calf, glossy black and white with the white eye patch, a tall rounded dorsal fin, a small splash of water.",
    # Canopy (Rainforest)
    'macaw':      "A scarlet macaw parrot, bright red body, yellow and blue wing feathers, a pale curved beak, perched on a short vine.",
    'tapir':      "A Malayan tapir calf, black front and back with a white middle like a saddle blanket, a short soft trunk-like nose.",
    'okapi':      "An okapi of the Congo rainforest, a dark chocolate-brown body with white zebra-like stripes on its legs, big ears.",
    'tarsier':    "A tarsier, a tiny tan furry animal with enormous round golden eyes, long thin fingers hugging a twig.",
    'dartfrog':   "A blue poison dart frog, bright cobalt blue with small black spots, sitting on a green leaf.",
    'orangutan':  "A baby orangutan with shaggy orange-red fur and long arms, hugging a big green leaf like an umbrella.",
    'morpho':     "A blue morpho butterfly with huge shimmering electric-blue wings edged in black with white dots, a small round body.",
    'hornbill':   "A great hornbill bird with a big curved yellow beak and casque on top, black and white feathers, perched on a branch.",
    # Oasis (Desert Dunes)
    'meerkat':    "A meerkat standing up tall on its back legs on lookout, sandy fur, dark eye patches, a thin tail for balance.",
    'jerboa':     "A desert jerboa, a tiny sandy mouse-like animal with huge ears, long back legs for hopping and a very long tail with a white tuft.",
    'sandcat':    "A sand cat kitten of the Sahara, pale sandy fur, wide flat head with big low ears, faint stripes on its legs.",
    'thornydevil':"A thorny devil lizard of the Australian desert, orange and tan with many soft rounded cone spikes, a little bump on its neck, smiling.",
    'roadrunner': "A roadrunner bird mid-stride, streaky brown and white feathers, a shaggy crest, a long tail held up.",
    'armadillo':  "An armadillo with a banded grey-tan shell, small pointed ears, a long nose, standing on four little legs.",
    'scarab':     "A friendly scarab beetle with a shiny green-and-gold shell, six short legs, pushing a small ball of sand.",
    'oryx':       "An Arabian oryx, a white antelope with long straight thin horns, dark brown legs and a dark face mask, standing on a sand ripple.",
    # Ice Floe (Polar Aurora)
    'polarbear':  "A polar bear cub with thick creamy-white fur, a black nose, sitting on a small ice floe.",
    'arcticfox':  "An arctic fox in its white winter coat, a huge fluffy tail wrapped around its feet, a dusting of snowflakes.",
    'puffin':     "An Atlantic puffin, black back, white face and belly, a bright orange-red-and-yellow striped beak, orange feet.",
    'snowyowl':   "A snowy owl chick, fluffy white feathers with a few small dark flecks, round yellow eyes, perched on a tiny snow mound.",
    'harpseal':   "A harp seal pup with fluffy white fur, big round dark eyes, small flippers, lying on the ice.",
    'beluga':     "A beluga whale, smooth pure white body with a rounded bulging forehead, a gentle smile, a few bubbles.",
    'reindeer':   "A reindeer calf with soft brown fur, a pale neck ruff, small branching antlers, a dark nose.",
    'narwhal':    "A narwhal, a speckled grey-blue whale with one long spiral tusk pointing up from its head, a little splash.",
    # High Peaks (mountains)
    'pika':       "A pika, a tiny round grey-brown furry animal with round ears and no visible tail, holding a sprig of alpine flowers.",
    'marmot':     "A marmot standing up on its back legs, chubby golden-brown fur, small round ears, sunning itself on a rock.",
    'ibex':       "An Alpine ibex kid with tan-grey fur and long curved ridged horns, standing on a small rocky ledge.",
    'chinchilla': "A chinchilla from the Andes, very soft dense blue-grey fur, big round ears, a bushy tail, holding a seed.",
    'condor':     "An Andean condor chick, black feathers with a white ruff around the neck, a small grey head, wings spread a little.",
    'takin':      "A golden takin calf of the Himalaya, shaggy golden fur, a big rounded moose-like nose, small curved horns.",
    'eagle':      "A golden eagle, dark brown feathers with a golden nape, a yellow hooked beak, perched on a rocky peak with a patch of snow.",
    'monal':      "A Himalayan monal pheasant with iridescent feathers of shimmering green, blue, purple and copper, a small crest on its head.",
}
for k, v in AVATAR2.items(): JOBS['av-' + k] = (v + ' ' + AV_STYLE, '1:1')

# SHELLY, the app's mascot (family standard v2 §2): a sea turtle whose shell is a globe.
# The doctrine wins over the concept sheet: a model never draws a real map, so her
# globe carries only latitude and longitude lines and soft sea colours — no continents.
SHELLY = ("Shelly, a cheerful young green sea turtle mascot standing upright on her back flippers like a cartoon character, "
          "a round friendly green head and face, a small brown explorer neckerchief. Her domed shell is a toy globe: smooth "
          "ocean-blue with thin pale curved lines of latitude and longitude only — NO continents, NO land shapes, NO map, "
          "just the blue globe and its grid lines, and a thin brass ring round it like a globe's meridian. ")
MASCOT_STYLE = ("Children's app mascot in the Bizzing family sticker style: chubby rounded body, big glossy dark eyes with two white "
                "catch-lights, small rosy cheeks, thick clean dark-plum outline, soft cel shading with one highlight, bright warm "
                "colours, friendly and huggable. ONE single character, full body, centred, the whole character inside the frame with "
                "a comfortable margin. THE ENTIRE BACKGROUND IS FLAT PURE MAGENTA (hex FF00FF), one solid uniform field: no ground, "
                "no shadow, no scenery, no border, no magenta or hot pink on the character. ABSOLUTELY NO TEXT, no letters, no digits, "
                "no numbers, no logo, no watermark.")
POSES = {
    'wave':  "She is waving hello with one front flipper raised high, a warm open smile.",
    'cheer': "She is cheering with both front flippers thrown up in the air, eyes happy, mouth open in delight, a few tiny sparkles.",
    'think': "She is thinking, one front flipper on her chin, eyes looking up and to the side, a small curious smile.",
    'point': "She is pointing to the right with one front flipper stretched out, looking that way, an encouraging smile.",
    'sleep': "She is asleep sitting down, eyes closed in two gentle curves, head tilted, a peaceful smile, a tiny bubble near her mouth.",
    'oops':  "She looks a little surprised and sheepish, one flipper scratching the back of her head, a small embarrassed smile, a single sweat drop.",
}
for k, v in POSES.items(): JOBS['mascot-' + k] = (SHELLY + v + ' ' + MASCOT_STYLE, '1:1', 'mascot-wave' if k != 'wave' else None)
JOBS['icon'] = ("Square mobile app icon, full-bleed square tile, Shelly the mascot large and centred, her head and upper body filling "
                "70% of the tile, on a solid deep teal (#0E6E74) background with a subtle tone-on-tone pattern of TOPOGRAPHIC CONTOUR "
                "LINES (wavy concentric height lines like on a hiking map — NOT a world map, no countries, no coastlines), a soft glow "
                "behind her. Readable at 48 pixels. " + SHELLY + "Bizzing family sticker style: thick clean dark-plum outline, soft cel "
                "shading, big glossy eyes, rosy cheeks. ABSOLUTELY NO TEXT, no letters, no digits, no logo.", '1:1', 'mascot-wave')

# The six living worlds (styles/themes.css, src/scenes.js) get a painted far plane,
# by day and — repainted from the day plate so it is the same place — by night.
WORLDP = {
    'atlas':  "An old chart-sea seen from a sandy shore: calm turquoise sea to a far horizon, two small palm islands, a distant sailing ship, puffy clouds, a lighthouse on a far headland, gulls.",
    'ocean':  "Under the sea, looking across a sunlit coral reef: shafts of light from the surface, coral of many colours, swaying kelp, sea fans, sandy floor, small fish far away.",
    'jungle': "Deep in a tropical rainforest: tall buttress-root trees, hanging vines, giant leaves, a misty waterfall into a green pool, shafts of light through the canopy.",
    'desert': "Golden desert dunes rolling to the horizon, an oasis of palm trees by a blue pool, distant flat-topped rock mesas, a clear sky.",
    'aurora': "A polar landscape: snowy mountains, an ice shelf, icebergs floating in a dark-blue sea, a small cosy wooden research hut with a round window.",
    'orbit':  "Space seen from a small rocky moon: the curve of a big blue planet in the sky with soft clouds and NO continents (only swirls of cloud over blue ocean), stars, a distant satellite, a small lander on the moon's surface.",
}
FRIEZE = ("Wide painted backdrop frieze for a children's app, in a warm hand-painted storybook style: soft gouache textures, "
          "gentle light, clean calm shapes, an uncluttered open sky. " + NOTEXT +
          " Very wide landscape composition.")
NIGHT = ("Repaint THIS EXACT SAME scene, same composition, same places, same viewpoint, at NIGHT: a deep blue-violet night sky full of "
         "stars and a moon, warm lamps and windows glowing, soft moonlight on the shapes, cosy and calm, never scary. Keep the "
         "storybook gouache style. " + NOTEXT)
for k, v in WORLDP.items():
    JOBS['wd-' + k] = (v + ' ' + FRIEZE, '21:9')
    JOBS['wn-' + k] = (NIGHT + ' The scene: ' + v, '21:9', 'wd-' + k)

for e in data('expeditions', 'EXPEDITIONS'): JOBS['crs-' + e['id']] = (e['paint'] + '. No people, no lettering, no real map. ' + STYLE + ' Very wide landscape composition.', '21:9')

# the Play tab's covers — places and things only, no lettering, no digits, no real map (a globe or chart would draw one)
GAMES = {
    'game-tradewinds': ("A tall three-masted sailing ship running before the wind across a sparkling turquoise open ocean at golden hour, every sail full and bellied, "
                        "white wake behind, flying fish leaping, seabirds, towering puffy trade-wind clouds and a distant palm-fringed island on the horizon. In the water "
                        "beside the bow swims the attached mascot, Shelly the cheerful sea turtle, exactly as in the reference — her round shell patterned only with "
                        "curved latitude and longitude lines on plain ocean blue — no green patches, no land shapes, no continents at all. No people visible on deck, no flags, no lettering, no map.", '16:9', 'mascot-wave'),
    'game-chain': ("A trail of big round stepping stones winding from a flowery green meadow, across a sparkling stream, through a pine forest, over golden dry hills "
                   "and on towards a distant snowy mountain — one journey through many different landscapes, seen from a gentle bird's-eye angle. No people, no signs, no lettering.", '4:3'),
    'game-compass': ("A large antique brass compass with a glowing needle lying open on a weathered wooden explorer's table, beside a magnifying glass, a brass spyglass "
                     "and a small oil lantern, warm lamplight and a few scattered leaves. The compass face shows only a decorative star rose — no letters, no numbers. No map.", '4:3'),
    'game-bigger': ("An old brass balance scale on an explorer's desk, one pan holding a big heap of terracotta-coloured clay and the other a smaller heap of "
                    "sea-green clay, a measuring tape curled beside it, warm window light. No globe, no map, no lettering, no numbers.", '4:3'),
    'game-shape': ("A detective's magnifying glass resting over a scatter of brightly coloured, oddly shaped jigsaw puzzle pieces on a wooden desk, a leather notebook "
                   "and a pencil beside them, warm lamplight. The pieces are abstract shapes, not any map. No lettering.", '4:3'),
    'game-sunclock': ("A stone sundial in a garden at sunset casting a long shadow, the sun low on the horizon on one side while the other half of the sky turns deep "
                      "blue with the first stars and a thin crescent moon — day and night meeting in one sky. The sundial face is plain, no numbers, no lettering.", '4:3'),
}
# Trade Winds: an age's card and a port's view, one per climate band — places and ships, no people, no flags, no lettering
GAMES.update({
    'game-tw-era-sail': ("A great wooden sailing ship with every sail set, heeling in a strong steady wind on a deep blue ocean, foam at the bow, "
                         "a long line of puffy trade-wind clouds marching across the sky. No people visible, no flags, no lettering.", '16:9'),
    'game-tw-era-steam': ("A handsome early steamship with a tall smoking funnel and paddle wheels, also carrying some sails, crossing a grey-green ocean "
                          "against the wind with a white wake, a trail of dark smoke. No people visible, no flags, no lettering.", '16:9'),
    'game-tw-era-suez': ("A long straight canal cutting through golden desert sand, a steamship gliding along it so it seems to sail across the dunes, "
                         "palm trees and a low town in the far distance, clear blue sky. No people visible, no flags, no lettering, no signs.", '16:9'),
    'game-tw-era-panama': ("Great canal locks with high concrete walls and giant steel gates stepping a ship up through green tropical jungle hills, "
                           "water pouring between the chambers, misty rainforest beyond. No people visible, no flags, no lettering, no signs.", '16:9'),
    'game-tw-port-trop': ("A sleepy tropical harbour at dawn: wooden jetties, small sailing boats, palm trees, piles of pineapples, bananas and mangoes in "
                          "baskets on the quay, warm turquoise water, a lantern on a post just lit. No people, no lettering.", '16:9'),
    'game-tw-port-sub': ("A warm, dry harbour town of whitewashed flat-roofed houses by a calm blue sea, bales of soft white cotton stacked on the stone "
                         "quay, a few palm trees, a lantern on the harbour wall just lit. No people, no lettering, no signs.", '16:9'),
    'game-tw-port-temp': ("A green temperate harbour with stone warehouses and a lighthouse, sacks of golden grain and wheat sheaves on the quay, "
                          "rolling fields of wheat on the hills behind, a soft cloudy sky, a lantern just lit. No people, no lettering, no signs.", '16:9'),
    'game-tw-port-cold': ("A cold northern harbour among pine-covered mountains with a little snow, stacks of cut timber logs on a wooden quay, a sturdy "
                          "sailing ship at anchor in dark blue water, a lantern glowing warm. No people, no lettering, no signs.", '16:9'),
})
for k, v in GAMES.items(): JOBS[k] = (v[0] + ' ' + STYLE + (' Wide landscape composition.' if v[1] == '16:9' else ' Landscape tile composition.'), v[1], *v[2:])
# The medals (the owner's audit: "a single bronze disc and 40 grey placeholders"): one painted
# medallion each, in its tier's metal, on pure magenta (keyed to alpha by process.py --medals).
# No lettering or digits; no real map (a globe shows only latitude and longitude lines); no person.
MD_STYLE = ("A single round medal for a children's geography app, seen straight on, centred, the whole medal inside "
    "the frame with a margin all round, a short ribbon of two folded tabs at the top. Polished {metal} rim with a few "
    "small embossed dots around it; inside the rim a glossy enamel picture: {subject}. Soft cel shading, gentle "
    "highlights, a clean dark outline, cheerful and collectible, like a premium mobile-game badge. Absolutely no "
    "letters, numbers, words or symbols of writing anywhere, and no pink or magenta anywhere on the medal itself. "
    "The background is a perfectly flat, even, pure magenta (#FF00FF) filling every corner, with no shadow, no "
    "vignette, no gradient and no texture.")
METAL = {1: 'bronze', 2: 'silver', 3: 'gold'}
MEDAL_ART = {
    'first-station': (1, 'a small red pennant flag planted on a green grassy hill under a blue sky'),
    'ten-aced': (2, 'three golden stars in an arc above a winding path through green fields — no globe, no planet, no map'),
    'world-home': (2, 'a cosy little house with a red roof on a quiet street with a tree'),
    'world-landwater': (2, 'a mountain beside a blue lake with a small island'),
    'world-continents': (2, 'a sailing boat in a harbour with a lighthouse'),
    'world-compass': (2, 'a brass compass rose with a red north needle'),
    'world-capitals': (2, 'a grand domed building with columns and a little flag on top'),
    'world-weather': (2, 'a sun peeking out from behind a rain cloud with a rainbow'),
    'world-rivers': (2, 'a river winding through green hills to the sea'),
    'world-globe': (2, 'a lighthouse beam crossing a night sky with curved latitude lines'),
    'world-restless': (2, 'a small volcano puffing smoke above layered rock'),
    'world-people': (2, 'a crossroads with tiny colourful houses and a market awning'),
    'level-2': (2, 'a road with two milestones winding up a gentle green hill'),
    'level-4': (2, 'a road with four milestones climbing through a forest'),
    'level-6': (2, 'a road climbing a rocky mountain pass with six milestones'),
    'level-8': (3, 'a road over a high snowy pass with a little cairn of stones at the top'),
    'level-10': (3, 'a road reaching a sunlit summit with a pennant flag, clouds below'),
    'caps-25': (1, 'a small pillared capitol building with a little red flag'),
    'caps-100': (2, 'a row of four pillared capitol buildings, each with a little red flag'),
    'caps-africa': (3, 'a proud lion standing on a savanna rock at sunset'),
    'caps-asia': (3, 'a panda sitting among green bamboo'),
    'caps-europe': (3, 'a little fairytale castle on a green hill'),
    'caps-north-america': (3, 'a bald eagle soaring over pine trees and a mountain'),
    'caps-south-america': (3, 'a llama standing in high mountains'),
    'caps-oceania': (3, 'a kangaroo hopping past a eucalyptus tree'),
    'flags-50': (2, 'a fan of five plain coloured pennant flags on poles, red, blue, green, yellow and white, no symbols'),
    'states-india': (2, 'a peacock with its tail spread beside a lotus flower'),
    'close-pin': (2, 'a bold solid bright-red map pin standing in the centre of a solid blue and white bullseye target, strong saturated colours, nothing see-through'),
    'big-round': (3, 'a brass telescope on a tripod pointed at a starry night sky with a shooting star — no globe, no planet, no map'),
    'first-made': (1, 'a paintbrush, a pencil and a small hammer crossed together on a plain cream background — no globe, no map'),
    'part-learned': (2, 'an open book with a glowing lightbulb above it'),
    'tw-five': (1, 'a glowing lantern on a wooden harbour post at dusk'),
    'tw-steam': (1, 'a small steamship with a red funnel puffing smoke on the sea'),
    'tw-ocean': (2, 'a great curling ocean wave with a little sailing ship on top'),
    'tw-world': (3, 'a round globe with only latitude and longitude lines, ringed by tiny sailing ships and glowing lanterns'),
    'chain-ten': (2, 'a chain of four colourful links forming a bridge'),
    'compass-two': (2, 'a magnifying glass over a brass compass with a red needle, on opaque cream enamel that fills the whole inside of the rim, no glass reflections — no globe, no planet, no map'),
    'bigger-fools': (2, 'a balance scale with a big stone on one side and a small stone on the other, perfectly level'),
    'shape-ten': (2, 'a magnifying glass over a single plain orange jigsaw puzzle piece — no map, no land shapes'),
    'sun-full': (2, 'a smiling sun over a sundial'),
    'exp-first-maps': (3, 'a treasure map scroll with a dotted path and an X, made-up land shapes only'),
    'exp-continents-oceans': (3, 'a ship sailing between two made-up islands under a big sky'),
    'exp-compass-grid': (3, 'a compass resting on a square grid of paper'),
    'exp-capitals': (3, 'a golden key in front of a domed capitol building'),
    'exp-flags-neighbours': (3, 'two plain pennant flags, red and blue, crossed over a fence between two gardens'),
    'exp-weather-climate': (3, 'a weathervane on a roof with sun, cloud and snowflake around it'),
    'exp-rivers-mountains': (3, 'a snowy mountain with a river running down to a sand dune'),
    'exp-latitude-time': (3, 'an hourglass in front of a globe with only latitude and longitude lines'),
    'exp-restless-earth': (3, 'an erupting volcano beside cracked rock plates'),
    'exp-world-detective': (3, 'a detective hat and a magnifying glass on a pile of postcards'),
}
for k, (tier, subject) in MEDAL_ART.items(): JOBS['md-' + k] = (MD_STYLE.format(metal=METAL[tier], subject=subject), '1:1')

GROUPS = {'medals': 'md-', 'games': 'game-', 'mascot': 'mascot-', 'day': 'wd-', 'night': 'wn-', 'postcards': 'pc-', 'landmarks': 'lm-', 'eras': 'era-', 'history': 'hist-', 'avatars': 'av-', 'courses': 'crs-', 'worlds': 'w-', 'library': 'lib-'}


def call(model, prompt, ratio, ref=None):
    parts = [{"text": prompt}]
    if ref:   # a picture to keep the same: the day plate for its night, the first pose for the rest
        parts.insert(0, {"inlineData": {"mimeType": "image/png", "data": base64.b64encode(open(os.path.join(RAW, ref + '.png'), 'rb').read()).decode()}})
    body = {"contents": [{"parts": parts}],
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
    prompt, ratio, ref = (JOBS[name] + (None,))[:3]
    if ref and not os.path.exists(os.path.join(RAW, ref + '.png')): return f'{name}: waits for {ref}'
    out = os.path.join(RAW, name + '.png')
    msg = ''
    for attempt in range(6):
        model = MODELS[attempt % len(MODELS)]
        try:
            img = call(model, prompt, ratio, ref)
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
