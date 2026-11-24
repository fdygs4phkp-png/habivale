// Alle Bilder an einer Stelle. `leih/…` = Übergangsbilder aus der Lebensrad-App (A Mystery World),
// bis die eigenen Habivale-Bilder da sind.
/* eslint-disable @typescript-eslint/no-require-imports */

export const IMG = {
  keyArt: [
    require('../../assets/img/scene/key-1.webp'), // Welpe
    require('../../assets/img/scene/key-1.webp'), // Großer Welpe – eigenes Bild folgt
    require('../../assets/img/scene/hauptbild-2-jungwolf.webp'),
    require('../../assets/img/scene/key-3.webp'),
    require('../../assets/img/scene/key-4.webp'),
  ],
  keyArtMissing: [false, true, false, false, false],
  wolfSit: [
    require('../../assets/img/wolf/sit-1.webp'),
    require('../../assets/img/wolf/sit-g.webp'), // Großer Welpe (24.11.2026, Warzen/Punkte wegretuschiert)
    require('../../assets/img/wolf/sit-2.webp'),
    require('../../assets/img/wolf/sit-3.webp'),
    require('../../assets/img/wolf/sit-4.webp'),
  ],
  wolfHead: [
    require('../../assets/img/wolf/head-1.webp'),
    require('../../assets/img/wolf/head-g.webp'), // Großer Welpe (24.11.2026, Warzen/Punkte wegretuschiert)
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
  story: [
    require('../../assets/img/scene/story-1-aufbruch.webp'),
    require('../../assets/img/scene/story-2-ankunft-hexenhaus.webp'),
    require('../../assets/img/scene/story-3-welpe.webp'),
    require('../../assets/img/scene/story-4-einzug.webp'),
  ],
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
  'money-first': require('../../assets/img/trophy/s2-1-geldbeutel.webp'),
  'money-share': require('../../assets/img/trophy/s2-2-herz.webp'),
  waited: require('../../assets/img/trophy/s2-6-sanduhr.webp'),
  'journal-first': require('../../assets/img/trophy/s2-3-buch.webp'),
  'journal-7': require('../../assets/img/trophy/s2-4-tagebuch.webp'),
  'goal-first': require('../../assets/img/trophy/s2-5-gipfel.webp'),
  'lesson-first': require('../../assets/img/trophy/s2-7-schriftrolle.webp'),
  'money-month': require('../../assets/img/trophy/s2-8-muenzen.webp'),
  'wish-fulfilled': require('../../assets/img/trophy/s2-9-geschenk.webp'),
};
/** Diese Trophäen zeigen noch ein geliehenes Bild (Serie 2 ist bestellt). */
export const TROPHY_BORROWED = new Set<string>();

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
  // Übergang: diese Outfits werden neu gezeichnet (Haltung gerader, Gürtel logisch) – dann nur die Dateien ersetzen
  'lyra-ranger': require('../../assets/img/outfits/lyra-ranger.webp'),
  'lyra-winter': require('../../assets/img/outfits/lyra-winter.webp'),
  'lyra-bluegold': require('../../assets/img/outfits/lyra-bluegold.webp'),
  'lyra-festive': require('../../assets/img/outfits/lyra-festive.webp'),
  'lyra-starnight': require('../../assets/img/outfits/lyra-starnight.webp'),
  'kael-ranger': require('../../assets/img/outfits/kael-ranger.webp'),
  'kael-scout': require('../../assets/img/outfits/kael-scout.webp'),
  'kael-winter': require('../../assets/img/outfits/kael-winter.webp'),
  'kael-festive': require('../../assets/img/outfits/kael-festive.webp'),
  'kael-moonwarden': require('../../assets/img/outfits/kael-moonwarden.webp'),
};

/** Magische Gegenstände (Ids wie in ITEMS). */
export const ITEM_IMG: Record<string, number> = {
  crystal: require('../../assets/img/items/crystal.webp'),
  moon: require('../../assets/img/items/moon.webp'),
  ring: require('../../assets/img/items/ring.webp'),
  stardust: require('../../assets/img/items/stardust.webp'),
  quill: require('../../assets/img/items/quill.webp'),
  compass: require('../../assets/img/items/compass.webp'),
  map: require('../../assets/img/items/map.webp'),
  ball: require('../../assets/img/items/ball.webp'),
  rune: require('../../assets/img/items/rune.webp'),
  lantern: require('../../assets/img/items/lantern.webp'),
  book: require('../../assets/img/items/book.webp'),
  potion: require('../../assets/img/items/potion.webp'),
  bracelet: require('../../assets/img/items/bracelet.webp'),
  figurine: require('../../assets/img/items/figurine.webp'),
  lavender: require('../../assets/img/items/lavender.webp'),
  hourglass: require('../../assets/img/items/hourglass.webp'),
  key: require('../../assets/img/items/key.webp'),
  shell: require('../../assets/img/items/shell.webp'),
};

/** Die Mentorin in drei Gesten, Lyra und Kael jubeln, der Wolf freut sich (je Stufe). */
export const MENTOR_POSE = {
  explain: require('../../assets/img/chars/mentor-erklaert.webp'),
  gift: require('../../assets/img/chars/mentor-geschenk.webp'),
  joy: require('../../assets/img/chars/mentor-freut-sich.webp'),
};
export const CHEER = require('../../assets/img/chars/cheer.webp');
export const WOLF_HAPPY = [
  require('../../assets/img/wolf/happy-1.webp'),
  require('../../assets/img/wolf/happy-g.webp'), // Großer Welpe (24.11.2026, Warzen/Punkte wegretuschiert)
  require('../../assets/img/wolf/happy-2.webp'),
  require('../../assets/img/wolf/happy-3.webp'),
  require('../../assets/img/wolf/happy-4.webp'),
];

/** Stimmungen als Wolfsgesichter (1 traurig … 5 super) für das Kinder-Tagebuch. */
export const MOOD_IMG = [
  require('../../assets/img/mood/mood-1.webp'),
  require('../../assets/img/mood/mood-2.webp'),
  require('../../assets/img/mood/mood-3.webp'),
  require('../../assets/img/mood/mood-4.webp'),
  require('../../assets/img/mood/mood-5.webp'),
];

/** Sparziel-Bilder, Schlüssel = Symbolname des Sparziels. */
export const GOAL_IMG: Record<string, number> = {
  'piggy-bank-outline': require('../../assets/img/goals/piggy.webp'),
  'piggy-bank': require('../../assets/img/goals/piggy.webp'),
  bike: require('../../assets/img/goals/bike.webp'),
  'book-open-variant': require('../../assets/img/goals/books.webp'),
  'gamepad-variant-outline': require('../../assets/img/goals/controller.webp'),
  'teddy-bear': require('../../assets/img/goals/teddy.webp'),
  music: require('../../assets/img/goals/guitar.webp'),
  soccer: require('../../assets/img/goals/ball.webp'),
  'palette-outline': require('../../assets/img/goals/palette.webp'),
  headphones: require('../../assets/img/goals/headphones.webp'),
  'gift-outline': require('../../assets/img/goals/gift.webp'),
};

/** Bilder für Gewohnheiten, Schlüssel = Symbolname (passt zu den Vorlagen). */
export const HABIT_IMG: Record<string, number> = {
  toothbrush: require('../../assets/img/habits/toothbrush.webp'),
  'book-open-variant': require('../../assets/img/habits/book.webp'),
  broom: require('../../assets/img/habits/broom.webp'),
  'cup-water': require('../../assets/img/habits/water.webp'),
  pencil: require('../../assets/img/habits/homework.webp'),
  run: require('../../assets/img/habits/shoes.webp'),
  bed: require('../../assets/img/habits/bed.webp'),
  'music-note': require('../../assets/img/habits/music.webp'),
  dog: require('../../assets/img/habits/dogbowl.webp'),
  'food-apple': require('../../assets/img/habits/apple.webp'),
  bike: require('../../assets/img/habits/bike.webp'),
  'hand-heart-outline': require('../../assets/img/habits/heart.webp'),
};

/** Refugium außen je Bild-Jahreszeit und Stufe (1–3). Winter ohne Kranz fehlt noch – bis dahin das Weihnachtsbild mit Hinweis. */
export const REFUGE_OUT: Record<'spring' | 'summer' | 'autumn' | 'xmas', number[]> = {
  spring: [require('../../assets/img/refuge/out-spring-1.webp'), require('../../assets/img/refuge/out-spring-2.webp'), require('../../assets/img/refuge/out-spring-3.webp')],
  summer: [require('../../assets/img/refuge/out-summer-1.webp'), require('../../assets/img/refuge/out-summer-2.webp'), require('../../assets/img/refuge/out-summer-3.webp')],
  autumn: [require('../../assets/img/refuge/out-autumn-1.webp'), require('../../assets/img/refuge/out-autumn-2.webp'), require('../../assets/img/refuge/out-autumn-3.webp')],
  xmas: [require('../../assets/img/refuge/out-xmas-1.webp'), require('../../assets/img/refuge/out-xmas-2.webp'), require('../../assets/img/refuge/out-xmas-3.webp')],
};
/** Fehlende Bilder: Winter ohne Weihnachtsschmuck (Prompts Teil 4). Sobald da: Dateien `out-winter-1…3` und hier eintragen. */
export const REFUGE_WINTER_PLAIN: number[] | null = null;
/** Innenräume je Stufe. Stufe 2 hat innen noch ein rundes Fenster (außen eckig) – neues Bild bestellt. */
export const REFUGE_IN = [
  require('../../assets/img/refuge/in-1.webp'),
  require('../../assets/img/refuge/in-2.webp'),
  require('../../assets/img/refuge/in-3.webp'),
];
/** Eigene Zimmer im großen Haus (Stufe 3, oben), Bilder der Nutzer vom 24.11.2026. */
export const ROOM_IMG: { lyra: number | null; kael: number | null } = {
  lyra: require('../../assets/img/refuge/room-lyra.webp'),
  kael: require('../../assets/img/refuge/room-kael.webp'), // mit der Bratsche an der Wand
};

export const WITCH_IMG = {
  outside: require('../../assets/img/refuge/witch-aussen.webp'),
  garden: require('../../assets/img/refuge/witch-aussen-b.webp'),
  inside: require('../../assets/img/refuge/witch-innen.webp'),
};

/** Einrichtung des Refugiums (Ids wie in DECOR). */
export const DECOR_IMG: Record<string, number> = {
  rug: require('../../assets/img/decor/rug.webp'),
  wolfbed: require('../../assets/img/decor/wolfbed.webp'),
  bookshelf: require('../../assets/img/decor/bookshelf.webp'),
  ivy: require('../../assets/img/decor/ivy.webp'),
  lantern: require('../../assets/img/decor/lantern.webp'),
  desk: require('../../assets/img/decor/desk.webp'),
  windowbench: require('../../assets/img/decor/windowbench.webp'),
  firewood: require('../../assets/img/decor/firewood.webp'),
  crystals: require('../../assets/img/decor/crystals.webp'),
  painting: require('../../assets/img/decor/painting.webp'),
  wisteria: require('../../assets/img/decor/wisteria.webp'),
  trophyshelf: require('../../assets/img/decor/trophyshelf.webp'),
};
/** Übergang: im Bücherregal steht eine Kerze (soll weg, Prompts Teil 4). */
export const DECOR_REDO = new Set(['bookshelf']);

/** Kapitelbilder der Geschichte (Index wie STORY_CHAPTERS). Fehlende Bilder (Prompts „Alle offenen Bild-Prompts 24.11.2026“, Teil F) = Übergang. */
export const BACKSTORY_IMG = [
  require('../../assets/img/scene/story-1-aufbruch.webp'),
  require('../../assets/img/scene/story-1-aufbruch.webp'),
  require('../../assets/img/scene/story-1-aufbruch.webp'),
  require('../../assets/img/scene/story-1-aufbruch.webp'),
  require('../../assets/img/scene/story-2-ankunft-hexenhaus.webp'),
  require('../../assets/img/scene/story-3-welpe.webp'),
];
export const BACKSTORY_IMG_MISSING = [true, true, true, false, false, false];
export const STORY_IMG = [
  require('../../assets/img/scene/story-4-einzug.webp'),
  require('../../assets/img/scene/story-4-einzug.webp'),
  require('../../assets/img/refuge/out-summer-2.webp'),
  require('../../assets/img/scene/key-1.webp'),
  require('../../assets/img/refuge/out-xmas-2.webp'),
  require('../../assets/img/scene/hauptbild-2-jungwolf.webp'),
  require('../../assets/img/refuge/witch-innen.webp'),
  require('../../assets/img/refuge/out-summer-3.webp'),
  require('../../assets/img/scene/key-3.webp'),
  require('../../assets/img/scene/key-4.webp'),
];
export const STORY_IMG_MISSING = [false, true, false, true, true, false, true, false, false, true];

/** Leisten-Symbole (goldene Bilder der Nutzer, Prompts Teil 2 Nr. 13). */
export const NAV_IMG: Record<string, number> = {
  index: require('../../assets/img/nav/heute.webp'),
  abenteuer: require('../../assets/img/nav/abenteuer.webp'),
  refugium: require('../../assets/img/nav/refugium.webp'),
  tagebuch: require('../../assets/img/nav/tagebuch.webp'),
  sammlung: require('../../assets/img/nav/sammlung.webp'),
};

/** Die drei Gläser (Bilder der Nutzer, sieben Füllstände 0–6, seit 0.18.0). */
export const JAR_IMG: Record<'save' | 'spend' | 'share', number[]> = {
  save: [require('../../assets/img/jars/jar-save-7-0.webp'), require('../../assets/img/jars/jar-save-7-1.webp'), require('../../assets/img/jars/jar-save-7-2.webp'), require('../../assets/img/jars/jar-save-7-3.webp'), require('../../assets/img/jars/jar-save-7-4.webp'), require('../../assets/img/jars/jar-save-7-5.webp'), require('../../assets/img/jars/jar-save-7-6.webp')],
  spend: [require('../../assets/img/jars/jar-spend-7-0.webp'), require('../../assets/img/jars/jar-spend-7-1.webp'), require('../../assets/img/jars/jar-spend-7-2.webp'), require('../../assets/img/jars/jar-spend-7-3.webp'), require('../../assets/img/jars/jar-spend-7-4.webp'), require('../../assets/img/jars/jar-spend-7-5.webp'), require('../../assets/img/jars/jar-spend-7-6.webp')],
  share: [require('../../assets/img/jars/jar-share-7-0.webp'), require('../../assets/img/jars/jar-share-7-1.webp'), require('../../assets/img/jars/jar-share-7-2.webp'), require('../../assets/img/jars/jar-share-7-3.webp'), require('../../assets/img/jars/jar-share-7-4.webp'), require('../../assets/img/jars/jar-share-7-5.webp'), require('../../assets/img/jars/jar-share-7-6.webp')],
};

/** Tagebuch-Cover (vorerst aus A Mystery World der Lebensrad-App geliehen: blau-lila Low-Poly mit Lotus). */
export const DIARY_COVER = {
  p: require('../../assets/img/leih/covers-navy-p.webp'),
  l: require('../../assets/img/leih/covers-navy-l.webp'),
};

/** Sticker fürs Tagebuch. */
export const DIARY_STICKERS: Record<string, number> = {
  ...STICKERS,
  leaf: require('../../assets/img/leih/stickers-leaf.webp'),
  treasure: require('../../assets/img/leih/stickers-treasure.webp'),
  crystal: require('../../assets/img/items/crystal.webp'),
  lantern: require('../../assets/img/items/lantern.webp'),
  key: require('../../assets/img/items/key.webp'),
  compass: require('../../assets/img/items/compass.webp'),
  quill: require('../../assets/img/items/quill.webp'),
  lavender: require('../../assets/img/items/lavender.webp'),
  shell: require('../../assets/img/items/shell.webp'),
  potion: require('../../assets/img/items/potion.webp'),
};

/** Bild für Füllstand 0–6. Solange es je Glas nur fünf Bilder gibt, teilen sich Stufen ein Bild. */
export function jarPic(jar: 'save' | 'spend' | 'share', level: number): number {
  const imgs = JAR_IMG[jar];
  if (imgs.length >= 7) return imgs[Math.max(0, Math.min(6, level))];
  return imgs[[0, 1, 1, 2, 2, 3, 4][Math.max(0, Math.min(6, level))]];
}
