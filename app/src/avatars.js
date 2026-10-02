/* avatars.js — the 96 (family standard v2 §8): twelve packs of eight, two packs to each
   of the six living worlds, every pack shaped 2 Common · 3 Rare · 2 Epic · 1 Legendary.
   The engine (tiers, prices, what a card says, how it is bought) is the family's own,
   vendored byte for byte in bizzing-avatars.js; this file is only Geography's catalogue.

   Five packs were painted for this app first (Explorer's Kit … Forest & River); Big
   Beasts and Elements came over from Bizzing Bee; five more were painted for the
   worlds (Deep Sea, Canopy, Oasis, Ice Floe, High Peaks). Creatures only — never a
   person or a deity — and no real map on any of them.

   A Legendary waits for a named piece of LEARNING (a medal id, from rewards.js), then
   its coins. Nothing is random, nothing is drawn blind. */

import { stateOf as famState, worldOf, worldOpen, TIERS } from './bizzing-avatars.js';
export { TIERS, worldOf, worldOpen };

/* the worlds are the six themes, in order (themes.js): 1 Old Atlas … 6 Satellite */
export const WORLD_IDS = ['atlas', 'ocean', 'jungle', 'desert', 'aurora', 'orbit'];
export const worldNo = (themeId) => WORLD_IDS.indexOf(themeId) + 1;

const P = (pack, id, name, blurb, faces) => ({ pack, id, name, blurb, faces });
/* faces: [id, name] × 8 in tier order: common, common, rare, rare, rare, epic, epic, legendary */
export const PACKS = [
  P(1, 'kit', 'Explorer’s Kit', 'Built from a geographer’s tools.', [['compowl', 'Compass Owl'], ['backpackbear', 'Backpack Bear'], ['scrollfox', 'Map-scroll Fox'], ['telescrane', 'Spyglass Crane'], ['binobat', 'Binocular Bat'], ['lanternbug', 'Lantern Firefly'], ['pinguin', 'Map-pin Penguin'], ['globetortle', 'Globe Turtle']]),
  P(2, 'continents', 'Seven Continents', 'A friend from every continent — and the desert.', [['savannalion', 'Savanna Lion (Africa)'], ['hedgehog', 'Hedgehog (Europe)'], ['bison', 'Bison (North America)'], ['llama', 'Llama (South America)'], ['kangaroo', 'Kangaroo (Oceania)'], ['snowleopard', 'Snow Leopard (Asia)'], ['camel', 'Bactrian Camel (the desert)'], ['emperor', 'Emperor Penguin (Antarctica)']]),
  P(3, 'ocean', 'Ocean Crew', 'From the reef to the Arctic Ocean.', [['dolphin', 'Dolphin'], ['clownfish', 'Clownfish'], ['seaturtle', 'Sea Turtle'], ['octopus', 'Octopus'], ['seahorse', 'Seahorse'], ['manta', 'Manta Ray'], ['walrus', 'Walrus'], ['whale', 'Blue Whale Calf']]),
  P(4, 'deep', 'Deep Sea', 'Down where the light runs out.', [['seastar', 'Sea Star'], ['puffer', 'Pufferfish'], ['hermit', 'Hermit Crab'], ['jelly', 'Moon Jellyfish'], ['angler', 'Anglerfish'], ['squid', 'Squid'], ['seadragon', 'Leafy Seadragon'], ['orca', 'Orca']]),
  P(5, 'forest', 'Forest & River', 'Rainforests, woodlands and rivers.', [['toucan', 'Toucan'], ['riverotter', 'River Otter'], ['sloth', 'Sloth'], ['koala', 'Koala'], ['beaver', 'Beaver'], ['treefrog', 'Tree Frog'], ['hippo', 'Pygmy Hippo'], ['jaguar', 'Jaguar']]),
  P(6, 'canopy', 'Canopy', 'High in the rainforest roof.', [['macaw', 'Scarlet Macaw'], ['dartfrog', 'Poison Dart Frog'], ['tapir', 'Malayan Tapir'], ['tarsier', 'Tarsier'], ['morpho', 'Blue Morpho'], ['okapi', 'Okapi'], ['hornbill', 'Great Hornbill'], ['orangutan', 'Orangutan']]),
  P(7, 'oasis', 'Oasis', 'Creatures that live where water is rare.', [['meerkat', 'Meerkat'], ['jerboa', 'Jerboa'], ['armadillo', 'Armadillo'], ['roadrunner', 'Roadrunner'], ['scarab', 'Scarab Beetle'], ['sandcat', 'Sand Cat'], ['thornydevil', 'Thorny Devil'], ['oryx', 'Arabian Oryx']]),
  P(8, 'earth', 'Wild Earth', 'Volcanoes, clouds, glaciers, dunes and storms.', [['volcadrake', 'Volcano Dragon'], ['cloudlamb', 'Cloud Lamb'], ['fennec', 'Dune Fennec'], ['mountaingoat', 'Mountain Goat'], ['coralcrab', 'Coral Crab'], ['rainbowleon', 'Rainbow Chameleon'], ['stormcat', 'Storm Cat'], ['glacieryak', 'Glacier Yak']]),
  P(9, 'ice', 'Ice Floe', 'The far north and the far south.', [['puffin', 'Puffin'], ['harpseal', 'Harp Seal'], ['arcticfox', 'Arctic Fox'], ['reindeer', 'Reindeer'], ['beluga', 'Beluga'], ['snowyowl', 'Snowy Owl'], ['polarbear', 'Polar Bear'], ['narwhal', 'Narwhal']]),
  P(10, 'peaks', 'High Peaks', 'From the Andes to the Himalaya.', [['pika', 'Pika'], ['marmot', 'Marmot'], ['ibex', 'Alpine Ibex'], ['chinchilla', 'Chinchilla'], ['takin', 'Golden Takin'], ['condor', 'Andean Condor'], ['eagle', 'Golden Eagle'], ['monal', 'Himalayan Monal']]),
  P(11, 'elements', 'Elements', 'Wind, water, fire and earth (from Bizzing Bee).', [['pebble', 'Pebble'], ['breeze', 'Breeze'], ['droplet', 'Droplet'], ['ember', 'Ember'], ['leafy', 'Leafy'], ['wave', 'Big Wave'], ['zappy', 'Zappy'], ['elemental', 'Elemental Prime']]),
  P(12, 'beasts', 'Big Beasts', 'Giants of the past and of the sea (from Bizzing Bee).', [['mammoth', 'Mammoth'], ['argentavis', 'Argentavis'], ['titanoboa', 'Titanoboa'], ['megalodon', 'Megalodon'], ['vasuki', 'Vasuki (a giant snake from India’s fossils)'], ['livyatan', 'Livyatan'], ['dunkleo', 'Dunkleosteus'], ['bluewhale', 'Blue Whale, the biggest ever']]),
];

/* each Legendary's named milestone: a medal (rewards.js MEDALS), so it is learning, never time */
export const LEGEND_MILESTONE = {
  1: { id: 'world-home', label: 'walk every stop in Home Street' },
  2: { id: 'world-continents', label: 'walk every stop in Continent Harbour' },
  3: { id: 'world-landwater', label: 'walk every stop in Land & Water Valley' },
  4: { id: 'world-rivers', label: 'walk every stop in River Delta' },
  5: { id: 'world-weather', label: 'walk every stop in Weather Ridge' },
  6: { id: 'caps-25', label: 'know 25 capitals' },
  7: { id: 'world-people', label: 'walk every stop in Crossroads City' },
  8: { id: 'world-restless', label: 'walk every stop in The Restless Earth' },
  9: { id: 'world-globe', label: 'walk every stop in Latitude Lighthouse' },
  10: { id: 'world-compass', label: 'walk every stop in Compass Tower' },
  11: { id: 'world-capitals', label: 'walk every stop in Capital Bazaar' },
  12: { id: 'ten-aced', label: 'ace ten stops' },
};
const TIER_AT = ['common', 'common', 'rare', 'rare', 'rare', 'epic', 'epic', 'legendary'];

export const CATALOGUE = PACKS.flatMap((p) => p.faces.map(([id, name], i) => ({
  id, name, pack: p.pack, tier: TIER_AT[i], art: `avatars/${id}.webp`,
  ...(TIER_AT[i] === 'legendary' ? { milestone: LEGEND_MILESTONE[p.pack] } : {}),
})));
export const byAvatar = Object.fromEntries(CATALOGUE.map((a) => [a.id, a]));
export const AVATAR_IDS = CATALOGUE.map((a) => a.id);
export const COMMONS = CATALOGUE.filter((a) => a.tier === 'common').map((a) => a.id);
export const packOf = (id) => PACKS.find((p) => p.pack === (byAvatar[id] || {}).pack);

/* what the engine needs to know about a child (and their household's plan) */
export function avCtx(h, k, milestones = []) {
  return { owned: (k && k.owned) || [], worlds: (k && k.worlds) || [], plan: h && h.parent && h.parent.plan === 'family' ? 'family' : 'free', milestones, who: k ? k.name : '' };
}
export const stateOf = (id, ctx) => famState(byAvatar[id], ctx);
export const canWear = (id, ctx) => !!byAvatar[id] && famState(byAvatar[id], ctx).state === 'owned';
