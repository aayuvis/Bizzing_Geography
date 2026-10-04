/* stories.js — Shelly's travel tales: two per world of the Atlas, for the youngest explorers
   (the owner's audit, I1/M6: "a short travel tale per world would carry the 6–7 band"; I2: each
   second tale is a problem the geography solves).

   A story is labelled as a story, on screen: the adventure is made up, and every FACT in it is
   a real, general one the world's own stops teach (no number, no name of a place that the app
   does not already teach, nothing typed from memory beyond what the stops say). Each page is a
   few short sentences and one of Shelly's six poses:

     [pose, text, scene, friend]

   scene   the painted place behind the page: app/public/art/<scene>.webp (tools/art/gen.py
           STORY_SCENES — a place only: no people, no lettering, no map, no turtle, no friend)
   friend  one of Shelly's creature friends (data/friends.js), composited beside her; optional

   The first story's last page points to the world's first stop; the second names its own
   `stop`, a different one in the same world. test/learning.mjs holds every world to two stories
   and every page to its rules. Routes: #/story/<world> and #/story/<world>-2 (storyById). */

export const STORY_NOTE = 'A Shelly story: the adventure is made up — every fact in it is true.';

export const STORIES = {
  home: { title: 'Shelly and the Map of the Garden', pages: [
    ['wave', 'One sunny morning, Shelly the sea turtle wanted to draw her garden. “But how?” she wondered. “It is far too big for my paper!”', 'st-home-1-1'],
    ['think', 'Ama the albatross landed beside her. “Look at it from above, like a bird,” said Ama. “From up high, a roof looks like a square and a pond looks like a circle.”', 'st-home-1-2', { id: 'ama', pose: 'stand' }],
    ['point', 'So Shelly drew everything small, as if she were flying: a square for the shed, a blue circle for the pond, and little round blobs for the trees.', 'st-home-1-3'],
    ['think', '“How will anyone know the blobs are trees?” asked Ama. Shelly drew a box in the corner and wrote what each symbol meant. That box is called the key.', 'st-home-1-4', { id: 'ama', pose: 'point' }],
    ['point', 'Last, she drew an arrow pointing to the top of the page. “North is up,” she said. “Now east is on the right, south at the bottom, and west on the left.”', 'st-home-1-5'],
    ['cheer', '“My first map!” cried Shelly. A map shows where things are, seen from above. Want to make one too? Start with A bird’s-eye view.', 'st-home-1-6'],
  ] },
  landwater: { title: 'Shelly Floats Down the Valley', pages: [
    ['wave', 'High in the mountains, Shelly found a tiny stream of cold, clear water. “Where are you going?” she asked. The stream just bubbled downhill.', 'st-landwater-1-1'],
    ['think', 'Shelly and Miro the otter followed it. Other streams joined in, and soon it was a river, curling through a wide, flat plain. A plain is flat land, good for farms.', 'st-landwater-1-2', { id: 'miro', pose: 'swim' }],
    ['point', 'The river filled a lake — water with land all the way round it. Then it flowed on, out of the lake, towards the sea.', 'st-landwater-1-3'],
    ['think', 'Near the coast, Shelly saw a bay: the sea reaching into the land, like a big bite out of a cookie. Out in the water sat an island, with sea all round it.', 'st-landwater-1-4'],
    ['cheer', '“Mountains, plains, lakes, bays and islands,” said Shelly. “The Earth has so many shapes!” Learn their names in Shapes of the land.', 'st-landwater-1-5'],
  ] },
  continents: { title: 'Shelly Sails Round the World', pages: [
    ['wave', 'Shelly packed a sandwich and set off from the harbour. “I will visit every continent!” she said. There are seven of them. Ama the albatross came too.', 'st-continents-1-1', { id: 'ama', pose: 'glide' }],
    ['point', 'She swam past Africa, then Europe, then Asia — the biggest continent of all. Asia has more people than any other.', 'st-continents-1-2'],
    ['think', 'Crossing the Pacific took a long, long time, even for Ama. It is the biggest ocean on Earth, bigger than all the land put together.', 'st-continents-1-3', { id: 'ama', pose: 'glide' }],
    ['point', 'She waved at Oceania, then at North America and South America. Far in the south lay Antarctica, covered in ice, where penguins live.', 'st-continents-1-4'],
    ['sleep', 'Five oceans and seven continents later, Shelly was very tired. She floated home and dreamed of maps.', 'st-continents-1-5'],
    ['cheer', 'Can you name all seven continents? Shelly will help you in Seven continents.', 'st-continents-1-6'],
  ] },
  compass: { title: 'Shelly and the Lost Lighthouse Key', pages: [
    ['oops', 'Oh no! The lighthouse keeper had lost his key. “I buried it,” he said, “but I only remember the directions!”', 'st-compass-1-1'],
    ['think', '“Start at the big rock,” he said. “Walk north-east to the old tree.” North-east is halfway between north and east.', 'st-compass-1-2'],
    ['point', 'Shelly held up her compass. The needle swung round to point north. She turned a little to the right of it, and walked to the tree.', 'st-compass-1-3'],
    ['think', '“Now go south from the tree, ten steps.” Shelly counted carefully. On a map, a scale tells you how far each step really is.', 'st-compass-1-4'],
    ['cheer', 'Dig, dig, dig — the key! “Thank you, Shelly!” Want to find your way with eight compass points? Try Eight compass points.', 'st-compass-1-5'],
  ] },
  capitals: { title: 'Shelly at the Capital Bazaar', pages: [
    ['wave', 'The Capital Bazaar was busy! There were flags of every colour flapping above the stalls. Dunya the camel had come to shop too.', 'st-capitals-1-1', { id: 'dunya', pose: 'walk' }],
    ['think', 'Each country has a capital city, where its government meets. “Paris is the capital of France,” said a stall-keeper, selling bread.', 'st-capitals-1-2'],
    ['point', '“And New Delhi is the capital of India,” said another, with a smile. “Tokyo is the capital of Japan,” said a third.', 'st-capitals-1-3'],
    ['think', 'Some countries share a border, like neighbours over a garden fence. France and Spain are neighbours. So are India and Nepal.', 'st-capitals-1-4'],
    ['cheer', 'Shelly bought a little flag to take home. How many capitals do you know? Start with Capitals of Europe.', 'st-capitals-1-5'],
  ] },
  weather: { title: 'Shelly and the Rain Cloud', pages: [
    ['wave', 'On a hot day, Shelly watched the sea sparkle. “Where does the rain come from?” she asked the Sun.', 'st-weather-1-1'],
    ['think', '“I warm the sea,” said the Sun, “and some of the water rises into the air as invisible vapour. That is called evaporation.”', 'st-weather-1-2'],
    ['point', 'High up, where it is colder, the vapour turned into tiny drops, and the drops made a cloud. That is condensation.', 'st-weather-1-3'],
    ['oops', 'The cloud grew heavy and grey — and down came the rain, splash! Rain, snow and hail are all called precipitation.', 'st-weather-1-4'],
    ['cheer', 'The rain ran into rivers, and the rivers ran back to the sea. “Round and round!” laughed Shelly. That is the water cycle. Begin Weather Ridge with Weather or climate?', 'st-weather-1-5'],
  ] },
  rivers: { title: 'Shelly’s Long River Journey', pages: [
    ['wave', 'Every river has a beginning, called its source. Shelly and Miro the otter found one: a spring of water bubbling out of a hillside.', 'st-rivers-1-1', { id: 'miro', pose: 'stand' }],
    ['point', 'Smaller rivers kept joining in. A river that joins a bigger one is called a tributary. The river grew wider and wider, and Miro swam faster.', 'st-rivers-1-2', { id: 'miro', pose: 'swim' }],
    ['think', 'Shelly saw towns and cities on the banks. People have always built near rivers, for water, for farms, and for boats.', 'st-rivers-1-3'],
    ['point', 'At last the river reached the sea and spread out into many little channels. That fan of land at a river’s mouth is a delta.', 'st-rivers-1-4'],
    ['cheer', '“From source to sea!” said Shelly. Follow a river all the way in A river from source to sea.', 'st-rivers-1-5'],
  ] },
  globe: { title: 'Shelly and the Invisible Lines', pages: [
    ['think', '“Where exactly am I?” wondered Shelly, floating in the middle of the ocean. There were no signs, and no roads. Even Ama, gliding above, could not say.', 'st-globe-1-1', { id: 'ama', pose: 'glide' }],
    ['point', 'Her friend the lighthouse knew. “Imagine lines around the Earth,” it said. “The equator goes round the middle, halfway between the poles.”', 'st-globe-1-2'],
    ['point', '“Lines going east and west are lines of latitude. Lines from pole to pole are lines of longitude. Together they can find any place on Earth.”', 'st-globe-1-3'],
    ['think', 'Shelly looked at the Sun. “When it is morning here, is it morning everywhere?” “No,” said the lighthouse. “The Earth turns, so it is day on one side and night on the other.”', 'st-globe-1-4'],
    ['cheer', '“Invisible lines!” said Shelly. Find them for yourself in Latitude and longitude.', 'st-globe-1-5'],
  ] },
  restless: { title: 'Shelly and the Rumbling Island', pages: [
    ['oops', 'Rumble, rumble! The island under Shelly’s feet began to shake. “What is happening?” she cried.', 'st-restless-1-1'],
    ['think', '“Don’t worry,” said a wise old crab. “The Earth’s outside is made of huge pieces called plates. They move very, very slowly — and sometimes they bump.”', 'st-restless-1-2'],
    ['point', 'Far away, a mountain puffed out smoke. It was a volcano, where melted rock from deep inside the Earth comes up to the surface.', 'st-restless-1-3'],
    ['think', 'Long, long ago, said the crab, the continents were joined together as one big piece of land called Pangaea. The plates slowly pulled them apart.', 'st-restless-1-4'],
    ['cheer', '“Our Earth is restless!” said Shelly, holding on tight. Look inside the Earth in Inside the Earth.', 'st-restless-1-5'],
  ] },
  people: { title: 'Shelly Visits the Big City', pages: [
    ['wave', 'Shelly went exploring on land. First she found a village: a few houses, some fields, and a little shop.', 'st-people-1-1'],
    ['point', 'Further on was a town, with a school, a market and a busy street. Then a city, with tall buildings and crowds of people.', 'st-people-1-2'],
    ['think', 'Some cities are so big that more than ten million people live in them. They are called megacities.', 'st-people-1-3'],
    ['point', 'The city needed water, food and power. “The Earth gives us all of these,” said Shelly. “Some things, like sunlight and wind, never run out.”', 'st-people-1-4'],
    ['cheer', 'Villages, towns and cities — people live in all of them. Explore them in Villages, towns and cities.', 'st-people-1-5'],
  ] },
};

const A = (pose) => ({ id: 'ama', pose }), D = (pose) => ({ id: 'dunya', pose }), M = (pose) => ({ id: 'miro', pose });

export const STORIES_MORE = {
  home: { title: 'Miro and the Picnic Map', stop: 'map-symbols', pages: [
    ['wave', 'Miro the otter had a map to the picnic by the lake. “But I cannot read it!” he said. “It is full of tiny pictures.”', 'st-home-2-1', M('stand')],
    ['think', '“Those tiny pictures are symbols,” said Shelly. “A map is far too small for real trees, so it draws little ones instead.”', 'st-home-2-2', M('stand')],
    ['point', '“Look in the corner. That box is the key. It says what every symbol means.” A blue line meant a river. A line with little ties meant a railway.', 'st-home-2-3', M('point')],
    ['think', 'So they followed the blue line along the river, crossed the railway at the bridge, and walked past the little trees of the wood.', 'st-home-2-4', M('stand')],
    ['cheer', '“There is the lake — and our picnic!” cried Miro. Always read the key first. Learn the symbols in Symbols and the key.', 'st-home-2-5', M('point')],
  ] },
  landwater: { title: 'Ama Looks for an Island', stop: 'land-or-water', pages: [
    ['wave', 'Ama the albatross landed on a rock, tired from the wind. “I am looking for an island,” she said. “Somewhere quiet to rest.”', 'st-landwater-2-1', A('stand')],
    ['think', 'First they found water with land all round it. “That is a lake,” said Shelly. “An island is the opposite: land with water all round it.”', 'st-landwater-2-2', A('stand')],
    ['point', 'Next they found a long finger of land poking into the sea. “Water on three sides,” said Shelly. “That is a peninsula, not an island.”', 'st-landwater-2-3', A('glide')],
    ['think', 'Beside it, the sea curved into the land. “I know this one,” said Ama. “Water poking into the land is a bay.”', 'st-landwater-2-4', A('point')],
    ['cheer', 'At last: a small green island, with sea all the way round. Ama tucked in her wings. Try the opposites in Land or water?', 'st-landwater-2-5', A('stand')],
  ] },
  continents: { title: 'Ama and the One Big Ocean', stop: 'five-oceans', pages: [
    ['wave', 'Ama the albatross can glide for days over the sea. “Come with me, Shelly!” she called. “Let us visit every ocean.”', 'st-continents-2-1', A('glide')],
    ['point', 'First came the Pacific, the biggest and deepest ocean of all. All the land on Earth would fit inside it.', 'st-continents-2-2', A('glide')],
    ['think', 'Then the Atlantic, and then the Indian Ocean. “Where does one ocean stop?” asked Shelly. “It doesn’t,” said Ama. “They are all joined up.”', 'st-continents-2-3', A('point')],
    ['point', 'Far in the south, the Southern Ocean swirled round icy Antarctica. Far in the north lay the Arctic, the smallest ocean.', 'st-continents-2-4', A('glide')],
    ['sleep', '“One world ocean, with five names,” yawned Shelly. Ama rested on the waves beside her, wings folded.', 'st-continents-2-5', A('stand')],
    ['cheer', 'Can you name all five oceans? Find them in Five oceans.', 'st-continents-2-6'],
  ] },
  compass: { title: 'Meet Me at C3', stop: 'grid-refs', pages: [
    ['wave', 'A message came from Dunya the camel: “Meet me at the well. It is in square C3.” Shelly looked at her map. Where was C3?', 'st-compass-2-1'],
    ['think', 'Her map had a grid: letters along the bottom, numbers up the side. Every square had a letter and a number.', 'st-compass-2-2'],
    ['point', '“Read along first, then up,” said Shelly. “Along the corridor, then up the stairs.” Along to C, then up to 3.', 'st-compass-2-3'],
    ['point', 'In square C3 was a tiny blue circle: the well. Shelly walked there, and Dunya was waiting beside it, resting in the shade.', 'st-compass-2-4', D('rest')],
    ['cheer', '“A letter and a number, and we found each other,” said Dunya. Learn to read a grid in Grid squares.', 'st-compass-2-5', D('stand')],
  ] },
  capitals: { title: 'Miro’s Flag Muddle', stop: 'flags', pages: [
    ['wave', 'Miro the otter kept a flag stall at the Capital Bazaar. But a gust of wind had blown all his flags into one big heap!', 'st-capitals-2-1', M('stand')],
    ['think', '“Every country has a flag,” said Miro. “Its colours and shapes usually stand for something: the land, the sky, the people, a hope.”', 'st-capitals-2-2', M('stand')],
    ['point', 'Shelly picked up a white flag with a red circle. “This one is easy. It is the flag of Japan: the rising sun!”', 'st-capitals-2-3', M('point')],
    ['oops', '“Oops,” said Miro. “These two look almost the same: Chad and Romania. And so do these two: Indonesia and Monaco.”', 'st-capitals-2-4', M('stand')],
    ['cheer', 'They looked very closely, and hung every flag back in its place. Look closely yourself in Flags of the world.', 'st-capitals-2-5', M('point')],
  ] },
  weather: { title: 'Shelly Packs for a Long Trip', stop: 'climate-zones', pages: [
    ['think', 'Shelly was going on a long trip, from the equator to the pole. “What shall I pack?” she wondered. “A sun hat, or a woolly scarf?”', 'st-weather-2-1'],
    ['point', '“Pack both!” said Ama. “Near the equator the Sun is high all year. That is the tropical zone: hot, and often wet.”', 'st-weather-2-2', A('stand')],
    ['think', 'On the way they visited Dunya in her desert. “A desert is a dry climate,” said Dunya. “Deserts are found where little rain falls.”', 'st-weather-2-3', D('stand')],
    ['point', 'Further on came the temperate zone, with four seasons in a year. Shelly watched the leaves turn orange and fall.', 'st-weather-2-4', A('glide')],
    ['oops', 'Near the pole the Sun stayed low in the sky. Brrr! This was the polar zone, cold all year. On went the woolly scarf.', 'st-weather-2-5'],
    ['cheer', '“I packed just right!” said Shelly. Walk from the equator to the pole yourself in Climate zones.', 'st-weather-2-6', A('stand')],
  ] },
  rivers: { title: 'Dunya Looks for Water', stop: 'great-rivers', pages: [
    ['oops', 'Dunya the camel had walked a long way across the Sahara, the largest hot desert. “My water is nearly gone,” she sighed.', 'st-rivers-2-1', D('walk')],
    ['think', '“A desert is a place with very little rain,” said Shelly. “So where will we find water?” Ama glided high above them, looking.', 'st-rivers-2-2', A('glide')],
    ['point', '“I can see a long green ribbon!” called Ama. “A river, with farms along both banks.” It was the Nile, one of the two longest rivers on Earth.', 'st-rivers-2-3', A('glide')],
    ['point', 'Beside the river stood a great city, Cairo, and the pyramids. “Cities grow on rivers,” said Shelly, “for water, for food, and for boats to trade.”', 'st-rivers-2-4', D('stand')],
    ['cheer', 'Dunya drank and drank. “Follow a river, and you find life,” she said. Meet more of them in Great rivers and their cities.', 'st-rivers-2-5', D('rest')],
  ] },
  globe: { title: 'Why Is Ama Asleep?', stop: 'sun-time', pages: [
    ['wave', 'It was lunchtime, and Shelly wanted to tell Ama a joke. But far away across the world, it was night, and Ama was fast asleep!', 'st-globe-2-1'],
    ['think', '“How can it be night for Ama and day for me?” asked Shelly. “The Earth turns,” said the lighthouse. “The side facing the Sun has day.”', 'st-globe-2-2'],
    ['point', '“The Earth turns once every day. The Sun rises in the east, so places further east reach noon first.”', 'st-globe-2-3'],
    ['think', '“So countries set time zones for their clocks,” said the lighthouse. “When it is lunchtime in London, it is the middle of the night in California.”', 'st-globe-2-4'],
    ['cheer', 'Next morning Ama glided in, wide awake, and Shelly told her the joke at last. Find out more in Time round the world.', 'st-globe-2-5', A('glide')],
  ] },
  restless: { title: 'Dunya and the Stone Seashell', stop: 'rocks', pages: [
    ['think', 'High on a dry cliff, Dunya the camel found something strange: a seashell made of stone. “How did a shell get inside a rock?” she asked.', 'st-restless-2-1', D('stand')],
    ['think', 'Shelly looked at the cliff. It was made of stripes, layer on layer, like a giant sandwich.', 'st-restless-2-2', D('stand')],
    ['point', '“This is sedimentary rock,” said Shelly. “It forms from layers of sand, mud or shells, pressed together. Fossils are found in it.”', 'st-restless-2-3', D('rest')],
    ['point', '“Other rocks start as melted rock, called magma, that cools and goes hard. Granite is one of those,” said Shelly. That kind is igneous rock.', 'st-restless-2-4'],
    ['cheer', '“Over millions of years, every rock can become every other kind,” said Shelly. Round and round! Learn how in The rock cycle.', 'st-restless-2-5', D('rest')],
  ] },
  people: { title: 'Ama and the Country with No Coast', stop: 'landlocked', pages: [
    ['oops', 'Ama the albatross had flown far into the mountains of Switzerland. “Where is the sea?” she called. She could not see it anywhere.', 'st-people-2-1', A('glide')],
    ['think', 'Shelly paddled across a mountain lake to meet her. “You will not find the sea here,” she said. “Switzerland has no coast at all.”', 'st-people-2-2', A('stand')],
    ['point', '“Nepal and Bolivia have no coast either,” said Shelly. “A country with no coast is called landlocked.”', 'st-people-2-3', A('stand')],
    ['think', '“Then how do they send things over the sea?” asked Ama. “Their trade travels through a neighbour,” said Shelly, “to reach the sea.”', 'st-people-2-4', A('point')],
    ['cheer', 'Ama flew on, through a neighbour, all the way to the sea. “Home!” she cried. Find more countries like this in No coast at all.', 'st-people-2-5', A('glide')],
  ] },
};

/* a story's route id: '<world>' is the first tale, '<world>-2' the second */
export function storyById(id) {
  const m = /^([a-z]+)(-2)?$/.exec(String(id || ''));
  return m ? ((m[2] ? STORIES_MORE : STORIES)[m[1]] || null) : null;
}
export const storyWorld = (id) => String(id).replace(/-2$/, '');
