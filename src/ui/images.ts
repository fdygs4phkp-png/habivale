// Alle Bilder an einer Stelle. `leih/…` = Übergangsbilder aus der Lebensrad-App (A Mystery World),
// bis die eigenen Habivale-Bilder da sind.
/* eslint-disable @typescript-eslint/no-require-imports */

export const IMG = {
  keyArt: [
    require('../../assets/img/scene/key-1.webp'), // Welpe
    require('../../assets/img/scene/key-1.webp'), // Jungwolf: Bild fehlt noch (Prompt 4.4) – solange das Welpenbild
    require('../../assets/img/scene/key-3.webp'),
    require('../../assets/img/scene/key-4.webp'),
  ],
  keyArtMissing: [false, true, false, false],
  wolfSit: [
    require('../../assets/img/wolf/sit-1.webp'),
    require('../../assets/img/wolf/sit-2.webp'),
    require('../../assets/img/wolf/sit-3.webp'),
    require('../../assets/img/wolf/sit-4.webp'),
  ],
  wolfHead: [
    require('../../assets/img/wolf/head-1.webp'),
    require('../../assets/img/wolf/head-2.webp'),
    require('../../assets/img/wolf/head-3.webp'),
    require('../../assets/img/wolf/head-4.webp'),
  ],
  lyra: require('../../assets/img/chars/lyra-front.webp'),
  kael: require('../../assets/img/chars/kael-front.webp'),
  mentor: require('../../assets/img/chars/mentor-front.webp'),
  lyraHead: require('../../assets/img/chars/lyra-head.webp'),
  kaelHead: require('../../assets/img/chars/kael-head.webp'),
  mentorHead: require('../../assets/img/chars/mentor-head.webp'),
  covers: [
    require('../../assets/img/leih/covers-navy-p.webp'),
    require('../../assets/img/leih/covers-violet-p.webp'),
    require('../../assets/img/leih/covers-green-p.webp'),
  ],
};

/** Trophäen-Bilder (vorerst aus der Lebensrad-App geliehen). */
export const TROPHY_IMG: Record<string, number> = {
  'first-step': require('../../assets/img/leih/crystal-n-mint.webp'),
  'days-7': require('../../assets/img/leih/crystal-n-1.webp'),
  'days-30': require('../../assets/img/leih/crystal-n-3.webp'),
  'done-100': require('../../assets/img/leih/trophy-n-cup.webp'),
  'money-first': require('../../assets/img/leih/stickers-treasure.webp'),
  'money-share': require('../../assets/img/leih/stickers-heart-red.webp'),
  'journal-first': require('../../assets/img/leih/trophy-n-books-1.webp'),
  'journal-7': require('../../assets/img/leih/stickers-leaf.webp'),
  'goal-first': require('../../assets/img/leih/trophy-n-telescope.webp'),
  'goal-reached': require('../../assets/img/leih/trophy-n-cup-grand.webp'),
};
