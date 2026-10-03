/* stories.js — Shelly's travel tales: one per world of the Atlas, for the youngest explorers
   (the owner's audit, I1/M6: "a short travel tale per world would carry the 6–7 band").

   A story is labelled as a story, on screen: the adventure is made up, and every FACT in it is
   a real, general one the world's own stops teach (no number, no name of a place that the app
   does not already teach, nothing typed from memory beyond what the stops say). Each page is a
   few short sentences and one of Shelly's six poses; the last page points to the world's first
   stop. test/learning.mjs holds every world to one story and every page to its rules. */

export const STORY_NOTE = 'A Shelly story: the adventure is made up — every fact in it is true.';

export const STORIES = {
  home: { title: 'Shelly and the Map of the Garden', pages: [
    ['wave', 'One sunny morning, Shelly the sea turtle wanted to draw her garden. “But how?” she wondered. “It is far too big for my paper!”'],
    ['think', 'A seagull landed beside her. “Look at it from above, like a bird,” said the gull. “From up high, a roof looks like a square and a pond looks like a circle.”'],
    ['point', 'So Shelly drew everything small, as if she were flying: a square for the shed, a blue circle for the pond, and little round blobs for the trees.'],
    ['think', '“How will anyone know the blobs are trees?” asked the gull. Shelly drew a box in the corner and wrote what each symbol meant. That box is called the key.'],
    ['point', 'Last, she drew an arrow pointing to the top of the page. “North is up,” she said. “Now east is on the right, south at the bottom, and west on the left.”'],
    ['cheer', '“My first map!” cried Shelly. A map shows where things are, seen from above. Want to make one too? Start with A bird’s-eye view.'],
  ] },
  landwater: { title: 'Shelly Floats Down the Valley', pages: [
    ['wave', 'High in the mountains, Shelly found a tiny stream of cold, clear water. “Where are you going?” she asked. The stream just bubbled downhill.'],
    ['think', 'Shelly followed it. Other streams joined in, and soon it was a river, curling through a wide, flat plain. A plain is flat land, good for farms.'],
    ['point', 'The river filled a lake — water with land all the way round it. Then it flowed on, out of the lake, towards the sea.'],
    ['think', 'Near the coast, Shelly saw a bay: the sea reaching into the land, like a big bite out of a cookie. Out in the water sat an island, with sea all round it.'],
    ['cheer', '“Mountains, plains, lakes, bays and islands,” said Shelly. “The Earth has so many shapes!” Learn their names in Shapes of the land.'],
  ] },
  continents: { title: 'Shelly Sails Round the World', pages: [
    ['wave', 'Shelly packed a sandwich and set off from the harbour. “I will visit every continent!” she said. There are seven of them.'],
    ['point', 'She swam past Africa, then Europe, then Asia — the biggest continent of all. Asia has more people than any other.'],
    ['think', 'Crossing the Pacific took a long, long time. It is the biggest ocean on Earth, bigger than all the land put together.'],
    ['point', 'She waved at Oceania, then at North America and South America. Far in the south lay Antarctica, covered in ice, where penguins live.'],
    ['sleep', 'Five oceans and seven continents later, Shelly was very tired. She floated home and dreamed of maps.'],
    ['cheer', 'Can you name all seven continents? Shelly will help you in Seven continents.'],
  ] },
  compass: { title: 'Shelly and the Lost Lighthouse Key', pages: [
    ['oops', 'Oh no! The lighthouse keeper had lost his key. “I buried it,” he said, “but I only remember the directions!”'],
    ['think', '“Start at the big rock,” he said. “Walk north-east to the old tree.” North-east is halfway between north and east.'],
    ['point', 'Shelly held up her compass. The needle swung round to point north. She turned a little to the right of it, and walked to the tree.'],
    ['think', '“Now go south from the tree, ten steps.” Shelly counted carefully. On a map, a scale tells you how far each step really is.'],
    ['cheer', 'Dig, dig, dig — the key! “Thank you, Shelly!” Want to find your way with eight compass points? Try Eight compass points.'],
  ] },
  capitals: { title: 'Shelly at the Capital Bazaar', pages: [
    ['wave', 'The Capital Bazaar was busy! There were flags of every colour flapping above the stalls.'],
    ['think', 'Each country has a capital city, where its government meets. “Paris is the capital of France,” said a stall-keeper, selling bread.'],
    ['point', '“And New Delhi is the capital of India,” said another, with a smile. “Tokyo is the capital of Japan,” said a third.'],
    ['think', 'Some countries share a border, like neighbours over a garden fence. France and Spain are neighbours. So are India and Nepal.'],
    ['cheer', 'Shelly bought a little flag to take home. How many capitals do you know? Start with Capitals of Europe.'],
  ] },
  weather: { title: 'Shelly and the Rain Cloud', pages: [
    ['wave', 'On a hot day, Shelly watched the sea sparkle. “Where does the rain come from?” she asked the Sun.'],
    ['think', '“I warm the sea,” said the Sun, “and some of the water rises into the air as invisible vapour. That is called evaporation.”'],
    ['point', 'High up, where it is colder, the vapour turned into tiny drops, and the drops made a cloud. That is condensation.'],
    ['oops', 'The cloud grew heavy and grey — and down came the rain, splash! Rain, snow and hail are all called precipitation.'],
    ['cheer', 'The rain ran into rivers, and the rivers ran back to the sea. “Round and round!” laughed Shelly. That is the water cycle. Begin Weather Ridge with Weather or climate?'],
  ] },
  rivers: { title: 'Shelly’s Long River Journey', pages: [
    ['wave', 'Every river has a beginning, called its source. Shelly found one: a spring of water bubbling out of a hillside.'],
    ['point', 'Smaller rivers kept joining in. A river that joins a bigger one is called a tributary. The river grew wider and wider.'],
    ['think', 'Shelly saw towns and cities on the banks. People have always built near rivers, for water, for farms, and for boats.'],
    ['point', 'At last the river reached the sea and spread out into many little channels. That fan of land at a river’s mouth is a delta.'],
    ['cheer', '“From source to sea!” said Shelly. Follow a river all the way in A river from source to sea.'],
  ] },
  globe: { title: 'Shelly and the Invisible Lines', pages: [
    ['think', '“Where exactly am I?” wondered Shelly, floating in the middle of the ocean. There were no signs, and no roads.'],
    ['point', 'Her friend the lighthouse knew. “Imagine lines around the Earth,” it said. “The equator goes round the middle, halfway between the poles.”'],
    ['point', '“Lines going east and west are lines of latitude. Lines from pole to pole are lines of longitude. Together they can find any place on Earth.”'],
    ['think', 'Shelly looked at the Sun. “When it is morning here, is it morning everywhere?” “No,” said the lighthouse. “The Earth turns, so it is day on one side and night on the other.”'],
    ['cheer', '“Invisible lines!” said Shelly. Find them for yourself in Latitude and longitude.'],
  ] },
  restless: { title: 'Shelly and the Rumbling Island', pages: [
    ['oops', 'Rumble, rumble! The island under Shelly’s feet began to shake. “What is happening?” she cried.'],
    ['think', '“Don’t worry,” said a wise old crab. “The Earth’s outside is made of huge pieces called plates. They move very, very slowly — and sometimes they bump.”'],
    ['point', 'Far away, a mountain puffed out smoke. It was a volcano, where melted rock from deep inside the Earth comes up to the surface.'],
    ['think', 'Long, long ago, said the crab, the continents were joined together as one big piece of land called Pangaea. The plates slowly pulled them apart.'],
    ['cheer', '“Our Earth is restless!” said Shelly, holding on tight. Look inside the Earth in Inside the Earth.'],
  ] },
  people: { title: 'Shelly Visits the Big City', pages: [
    ['wave', 'Shelly went exploring on land. First she found a village: a few houses, some fields, and a little shop.'],
    ['point', 'Further on was a town, with a school, a market and a busy street. Then a city, with tall buildings and crowds of people.'],
    ['think', 'Some cities are so big that more than ten million people live in them. They are called megacities.'],
    ['point', 'The city needed water, food and power. “The Earth gives us all of these,” said Shelly. “Some things, like sunlight and wind, never run out.”'],
    ['cheer', 'Villages, towns and cities — people live in all of them. Explore them in Villages, towns and cities.'],
  ] },
};
