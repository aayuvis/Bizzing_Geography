/* friends.js — Shelly's three creature friends, who turn up across both sets of stories
   (the owner's audit, I5/D5). Creatures only — never a person, never a deity — and each
   one belongs to a piece of geography: the open ocean's winds, the deserts, the rivers.

   Each is painted as a sticker in three poses on a magenta ground (tools/art/gen.py
   FRIEND_ART, keyed by process.py --friends) and composited by the app in front of a
   story page's painted scene: app/public/friends/<id>-<pose>.webp. A story page names
   one as its fourth element, { id, pose }; test/learning.mjs resolves every one to its
   sprite. */

export const FRIENDS = {
  ama: {
    name: 'Ama', kind: 'a wandering albatross',
    line: 'She rides the ocean winds for days without landing, and she has seen most of the sea from above — patient, far-sighted, and glad to share the view.',
    poses: ['glide', 'stand', 'point'],
  },
  dunya: {
    name: 'Dunya', kind: 'a Bactrian camel',
    line: 'She has crossed deserts both hot and cold at her own steady pace; she is never in a hurry, and she never misses where the water is.',
    poses: ['stand', 'walk', 'rest'],
  },
  miro: {
    name: 'Miro', kind: 'a river otter',
    line: 'He knows every bend of his river from the spring to the sea, asks the questions everyone else was wondering, and is first into the water.',
    poses: ['swim', 'stand', 'point'],
  },
};

/* a friend's sprite, composited in front of a story scene (decorative: the text names them) */
export const friendSprite = (f, cls = '') => {
  const F = f && FRIENDS[f.id];
  if (!F) return '';
  const pose = F.poses.includes(f.pose) ? f.pose : F.poses[0];
  return `<img class="friend fr-${f.id} fp-${pose}${cls ? ' ' + cls : ''}" src="friends/${f.id}-${pose}.webp" width="160" height="160" alt="" decoding="async">`;
};
