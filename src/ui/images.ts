// Alle Bilder an einer Stelle. `leih/…` = Übergangsbilder aus der Lebensrad-App (A Mystery World),
// bis die eigenen Habivale-Bilder da sind.
/* eslint-disable @typescript-eslint/no-require-imports */

export const IMG = {
  keyArt: [
    require('../../assets/img/scene/key-1.webp'), // Welpe
    require('../../assets/img/scene/hauptbild-2-jungwolf.webp'),
    require('../../assets/img/scene/key-3.webp'),
    require('../../assets/img/scene/key-4.webp'),
  ],
  keyArtMissing: [false, false, false, false],
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
  avatar: {
    lyra: require('../../assets/img/chars/lyra-avatar.webp'),
    kael: require('../../assets/img/chars/kael-avatar.webp'),
    mentor: require('../../assets/img/chars/mentor-avatar.webp'),
  },
  mentorScene: require('../../assets/img/scene/mentorin-ueberreicht.webp'),
  covers: [
    require('../../assets/img/leih/covers-navy-p.webp'),
    require('../../assets/img/leih/covers-violet-p.webp'),
    require('../../assets/img/leih/covers-green-p.webp'),
  ],
};

/** Trophäen-Bilder: Habivale-eigene (Serie 1, Spar-Trophäen) und vorerst aus der Lebensrad-App geliehene. */
export const TROPHY_IMG: Record<string, number> = {
  'first-step': require('../../assets/img/trophy/01-erster-schritt-pfote.webp'),
  'days-7': require('../../assets/img/trophy/02-sieben-tage-stern.webp'),
  'way-begins': require('../../assets/img/trophy/03-der-weg-beginnt-laterne.webp'),
  'days-30': require('../../assets/img/trophy/04-dreissig-tage-medaille.webp'),
  master: require('../../assets/img/trophy/05-meister-pokal-baum.webp'),
  'done-100': require('../../assets/img/trophy/06-hundert-habits-obelisk.webp'),
  'one-year': require('../../assets/img/trophy/07-ein-jahr-sonne-mond.webp'),
  comeback: require('../../assets/img/trophy/08-rueckkehr-kompass.webp'),
  legend: require('../../assets/img/trophy/09-legendaerer-begleiter-wolf.webp'),
  'goal-reached': require('../../assets/img/trophy/spar-1-schwein.webp'),
  'goals-3': require('../../assets/img/trophy/spar-2-silbertruhe.webp'),
  'money-year': require('../../assets/img/trophy/spar-3-goldtruhe.webp'),
  'money-first': require('../../assets/img/trophy/spar-4-kristallglas.webp'),
  'money-share': require('../../assets/img/leih/stickers-heart-red.webp'),
  waited: require('../../assets/img/leih/trophy-n-watch.webp'),
  'journal-first': require('../../assets/img/leih/trophy-n-books-1.webp'),
  'journal-7': require('../../assets/img/leih/stickers-leaf.webp'),
  'goal-first': require('../../assets/img/leih/trophy-n-telescope.webp'),
};
/** Diese Trophäen zeigen noch ein geliehenes Bild (Serie 2 ist bestellt). */
export const TROPHY_BORROWED = new Set(['money-share', 'waited', 'journal-first', 'journal-7', 'goal-first']);

/** Sticker fürs Lob der Eltern (vorerst aus der Lebensrad-App geliehen). */
export const STICKERS: Record<string, number> = {
  star: require('../../assets/img/leih/stickers-star.webp'),
  moon: require('../../assets/img/leih/stickers-moon.webp'),
  heart: require('../../assets/img/leih/stickers-heart-red.webp'),
  sun: require('../../assets/img/leih/stickers-sun.webp'),
  rainbow: require('../../assets/img/leih/stickers-rainbow.webp'),
  rose: require('../../assets/img/leih/stickers-rose.webp'),
};
export const PRAISE_TEXTS = [
  'Super gemacht!',
  'Ich bin stolz auf dich.',
  'Du bleibst dran – toll!',
  'Danke für deine Hilfe.',
  'Weiter so, kleiner Schritt für kleiner Schritt.',
  'Du hast heute etwas Schweres geschafft.',
];

/** Outfit-Bilder (ganze Figur, Vorderansicht). Bisher nur die Grundausstattung – die übrigen sind bestellt (Prompts Teil 2, Nr. 1 und 2). */
export const OUTFIT_IMG: Record<string, number> = {
  'lyra-start': require('../../assets/img/chars/lyra-front.webp'),
  'kael-start': require('../../assets/img/chars/kael-front.webp'),
};
