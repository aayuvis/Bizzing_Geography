/* meta.js — the Play shelf's labels. Every game loads on demand (family standard §11);
   the shelf needs only these. Order is the shelf's: the flagship first. */
export const GAME_META = {
  tradewinds: { id: 'tradewinds', name: 'Shelly’s Trade Winds', glyph: '⛵', art: 'game-tradewinds', flagship: true,
    blurb: 'Sail the real oceans with the real winds. Wake sleeping ports, carry what each climate grows, ride the monsoon — and connect the whole world.' },
  geoguess: { id: 'geoguess', name: 'Where on Earth?', glyph: '🌍', art: 'lib-geoguess', blurb: 'A real place somewhere on Earth. Read the land, the roads and the buildings — then pin where you think it is.' },
  chain: { id: 'chain', name: 'Neighbour Chain', glyph: '🔗', art: 'game-chain', blurb: 'From one country to another, one land border at a time — in as few steps as you can.' },
  compass: { id: 'compass', name: 'Hot & Cold Compass', glyph: '🧭', art: 'game-compass', blurb: 'A hidden capital. Every guess tells you how far, and which way. Find it in as few guesses as you can.' },
  bigger: { id: 'bigger', name: 'Bigger or Smaller?', glyph: '⚖️', art: 'game-bigger', blurb: 'Two countries: which has more land? Your eyes can be fooled — the map is flat, the Earth is not.' },
  shape: { id: 'shape', name: 'Shape Detective', glyph: '🔍', art: 'game-shape', blurb: 'A country’s outline and a trail of clues. Name it with as few clues as you can.' },
  geobee: { id: 'geobee', name: 'Geo Bee', glyph: '🏆', art: 'atlas', blurb: 'This month’s mock contest: you and the same ten rivals as the Bee. One question each, every round. Miss and you sit down.' },
  flagsprint: { id: 'flagsprint', name: 'Flag Sprint', glyph: '🚩', art: 'lib-flags', blurb: 'Sixty seconds. How many flags of the world can you name?' },
  sunclock: { id: 'sunclock', name: 'Sun Clock', glyph: '☀️', art: 'game-sunclock', blurb: 'It is noon in Delhi. Where is the sun just rising? The Earth turns 15° every hour — use it.' },
};
export const GAME_ORDER = ['tradewinds', 'geoguess', 'chain', 'compass', 'bigger', 'shape', 'sunclock', 'geobee', 'flagsprint'];
