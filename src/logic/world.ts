// Kleidung und Gegenstände (Phase 4). Alles wird durch Fortschritt verdient – nichts lässt sich kaufen.
// Bilder: ganze Outfits je Figur (wie die Lady-Kleider in eWolfe), Gegenstände als Einzelbilder.

import { activeDays, longestStreak } from './habits.ts';
import { entryHasContent } from './journal.ts';
import { levelInfo, wolfStage } from './progress.ts';
import { refugeStage } from './refuge.ts';
import { xpOf } from './trophies.ts';
import type { DayKey } from './date.ts';
import type { AppState } from './types.ts';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export const RARITY_NAME: Record<Rarity, string> = { common: 'Gewöhnlich', rare: 'Selten', epic: 'Episch', legendary: 'Legendär' };
export const RARITY_COLOR: Record<Rarity, string> = { common: '#C2BBA8', rare: '#8FB8F0', epic: '#C9B3F0', legendary: '#E2BC66' };

export type Rule =
  | { kind: 'start' }
  | { kind: 'level'; n: number }
  | { kind: 'days'; n: number }
  | { kind: 'wolf'; n: number }
  | { kind: 'streak'; n: number }
  | { kind: 'trophies'; n: number }
  | { kind: 'journal'; n: number }
  | { kind: 'goals'; n: number }
  | { kind: 'savings'; n: number }
  | { kind: 'lessons'; n: number }
  | { kind: 'shared'; n: number }
  | { kind: 'refuge'; n: number };

export function ruleText(r: Rule): string {
  switch (r.kind) {
    case 'start': return 'Von Anfang an dabei';
    case 'level': return `Erreiche Level ${r.n}`;
    case 'days': return `Sei an ${r.n} Tagen aktiv`;
    case 'wolf': return ['', 'Euer Wolf wird ein Jungwolf', 'Euer Wolf wird erwachsen', 'Euer Wolf wird legendär'][r.n];
    case 'streak': return `Schaffe eine Gewohnheit ${r.n} Tage in Folge`;
    case 'trophies': return `Sammle ${r.n} Trophäen`;
    case 'journal': return r.n === 1 ? 'Schreib zum ersten Mal ins Tagebuch' : `Schreib an ${r.n} Tagen ins Tagebuch`;
    case 'goals': return r.n === 1 ? 'Erreiche ein Ziel im Tagebuch' : `Erreiche ${r.n} Ziele im Tagebuch`;
    case 'savings': return r.n === 1 ? 'Erreiche ein Sparziel' : `Erreiche ${r.n} Sparziele`;
    case 'lessons': return r.n === 1 ? 'Lies eine Lektion der Mentorin' : `Lies ${r.n} Lektionen der Mentorin`;
    case 'shared': return r.n === 1 ? 'Teile zum ersten Mal aus dem grünen Glas' : `Teile ${r.n}-mal aus dem grünen Glas`;
    case 'refuge': return r.n === 2 ? 'Euer Refugium wird zum Häuschen' : 'Euer Refugium wird zum großen Haus';
  }
}

export function ruleMet(s: AppState, r: Rule, today: DayKey): boolean {
  switch (r.kind) {
    case 'start': return true;
    case 'level': return levelInfo(xpOf(s)).level >= r.n;
    case 'days': return activeDays(s.habits, s.done).length >= r.n;
    case 'wolf': return Math.max(wolfStage(s.habits, s.done).index, ...[1, 2, 3].filter((i) => s.firsts['wolf:' + i] !== undefined)) >= r.n;
    case 'streak': return s.habits.some((h) => longestStreak(h, s.done, today) >= r.n);
    case 'trophies': return Object.keys(s.firsts).filter((k) => k.startsWith('t:')).length >= r.n;
    case 'journal': return Object.values(s.journal).filter(entryHasContent).length >= r.n;
    case 'goals': return s.goals.filter((g) => g.reachedAt).length >= r.n;
    case 'savings': return s.money.goals.filter((g) => g.reachedAt).length >= r.n;
    case 'lessons': return Object.keys(s.lessons).length >= r.n;
    case 'shared': return s.money.entries.filter((e) => e.kind === 'share').length >= r.n;
    case 'refuge': return refugeStage(s).n >= r.n;
  }
}

export type Hero = 'lyra' | 'kael';

export interface Outfit {
  id: string;
  hero: Hero;
  name: string;
  rarity: Rarity;
  rule: Rule;
  text: string;
}

export const OUTFITS: Outfit[] = [
  { id: 'lyra-start', hero: 'lyra', name: 'Reisekleid', rarity: 'common', rule: { kind: 'start' }, text: 'Lyras violettes Kleid mit Tuch und Zöpfen voller Perlen.' },
  { id: 'lyra-ranger', hero: 'lyra', name: 'Waldläuferin', rarity: 'common', rule: { kind: 'level', n: 3 }, text: 'Waldgrün, mit kurzem Moos-Umhang – perfekt für Streifzüge.' },
  { id: 'lyra-bluegold', hero: 'lyra', name: 'Blau und Gold', rarity: 'rare', rule: { kind: 'level', n: 5 }, text: 'Nachtblau mit grünem Unterrock und goldenen Ranken.' },
  { id: 'lyra-winter', hero: 'lyra', name: 'Wintermantel', rarity: 'rare', rule: { kind: 'days', n: 30 }, text: 'Warm, mit weichem Kragen und Schneeflocken-Spange.' },
  { id: 'lyra-festive', hero: 'lyra', name: 'Festtagskleid', rarity: 'epic', rule: { kind: 'level', n: 8 }, text: 'Violett und Gold, für besondere Tage.' },
  { id: 'lyra-starnight', hero: 'lyra', name: 'Sternennacht', rarity: 'legendary', rule: { kind: 'wolf', n: 3 }, text: 'Ein Kleid wie der Nachthimmel, voller kleiner Sterne.' },
  { id: 'kael-start', hero: 'kael', name: 'Reisegewand', rarity: 'common', rule: { kind: 'start' }, text: 'Kaels dunkelblaue Tunika mit Goldstickerei und Umhang.' },
  { id: 'kael-ranger', hero: 'kael', name: 'Waldläufer', rarity: 'common', rule: { kind: 'level', n: 3 }, text: 'Waldgrün mit Lederweste und Karte am Gürtel.' },
  { id: 'kael-scout', hero: 'kael', name: 'Kundschafter', rarity: 'rare', rule: { kind: 'level', n: 5 }, text: 'Lederweste, Kapuzenumhang und eine Schriftrolle für unterwegs.' },
  { id: 'kael-winter', hero: 'kael', name: 'Wintermantel', rarity: 'rare', rule: { kind: 'days', n: 30 }, text: 'Langer Wollmantel mit violettem Schal.' },
  { id: 'kael-festive', hero: 'kael', name: 'Festtagsgewand', rarity: 'epic', rule: { kind: 'level', n: 8 }, text: 'Navy und Gold mit Eichenlaub-Stickerei.' },
  { id: 'kael-moonwarden', hero: 'kael', name: 'Mondwächter', rarity: 'legendary', rule: { kind: 'wolf', n: 3 }, text: 'Mitternachtsblau mit silbernen Monden.' },
];

export interface Item {
  id: string;
  name: string;
  rarity: Rarity;
  rule: Rule;
  icon: string; // Platzhalter-Symbol, bis die Bilder da sind
  text: string;
}

export const ITEMS: Item[] = [
  { id: 'crystal', name: 'Violetter Kristall', rarity: 'common', rule: { kind: 'days', n: 3 }, icon: 'diamond-stone', text: 'Er leuchtet ein wenig heller an guten Tagen.' },
  { id: 'quill', name: 'Goldene Feder', rarity: 'common', rule: { kind: 'journal', n: 1 }, icon: 'feather', text: 'Für deine ersten Tagebuchseiten.' },
  { id: 'lantern', name: 'Kleine Laterne', rarity: 'common', rule: { kind: 'level', n: 2 }, icon: 'lightbulb-on-outline', text: 'Sie zeigt den Weg, Schritt für Schritt.' },
  { id: 'map', name: 'Alte Karte', rarity: 'common', rule: { kind: 'goals', n: 1 }, icon: 'map-legend', text: 'Jedes Ziel ist ein Ort auf der Karte.' },
  { id: 'bracelet', name: 'Freundschaftsband', rarity: 'common', rule: { kind: 'shared', n: 1 }, icon: 'hand-heart-outline', text: 'Für alle, die gern teilen.' },
  { id: 'figurine', name: 'Holzwolf', rarity: 'common', rule: { kind: 'wolf', n: 1 }, icon: 'dog-side', text: 'Ein kleiner geschnitzter Wolf – wie eurer.' },
  { id: 'compass', name: 'Messingkompass', rarity: 'rare', rule: { kind: 'days', n: 14 }, icon: 'compass-outline', text: 'Er findet immer zurück auf den Weg.' },
  { id: 'hourglass', name: 'Sanduhr', rarity: 'rare', rule: { kind: 'savings', n: 1 }, icon: 'timer-sand', text: 'Geduld ist eine Zauberkraft.' },
  { id: 'book', name: 'Zauberbuch', rarity: 'rare', rule: { kind: 'lessons', n: 3 }, icon: 'book-open-page-variant', text: 'Mit den Lektionen der Mentorin.' },
  { id: 'potion', name: 'Grüner Trank', rarity: 'rare', rule: { kind: 'streak', n: 7 }, icon: 'bottle-tonic', text: 'Sieben Tage in Folge – das gibt Kraft.' },
  { id: 'ring', name: 'Amethystring', rarity: 'rare', rule: { kind: 'trophies', n: 5 }, icon: 'ring', text: 'Für fünf gesammelte Trophäen.' },
  { id: 'lavender', name: 'Leuchtender Lavendel', rarity: 'rare', rule: { kind: 'journal', n: 7 }, icon: 'flower', text: 'Er duftet nach ruhigen Abenden.' },
  { id: 'moon', name: 'Mondanhänger', rarity: 'epic', rule: { kind: 'level', n: 6 }, icon: 'moon-waning-crescent', text: 'Ein Geschenk der Mentorin.' },
  { id: 'ball', name: 'Kristallkugel', rarity: 'epic', rule: { kind: 'days', n: 60 }, icon: 'crystal-ball', text: 'Sie zeigt, wie weit du schon gekommen bist.' },
  { id: 'key', name: 'Sternenschlüssel', rarity: 'epic', rule: { kind: 'streak', n: 21 }, icon: 'key-star', text: 'Er öffnet Türen, die Geduld verlangen.' },
  { id: 'rune', name: 'Pfotenrune', rarity: 'epic', rule: { kind: 'wolf', n: 2 }, icon: 'paw', text: 'Euer Wolf ist erwachsen geworden.' },
  { id: 'stardust', name: 'Sternenstaub', rarity: 'legendary', rule: { kind: 'wolf', n: 3 }, icon: 'star-shooting', text: 'Aus dem Fell des legendären Wolfs.' },
  { id: 'shell', name: 'Leuchtende Muschel', rarity: 'legendary', rule: { kind: 'days', n: 300 }, icon: 'shimmer', text: 'Für 300 Tage auf dem Weg.' },
];

export function unlockedOutfits(s: AppState, today: DayKey): Set<string> {
  return new Set(OUTFITS.filter((o) => ruleMet(s, o.rule, today)).map((o) => o.id));
}

export function unlockedItems(s: AppState, today: DayKey): Set<string> {
  return new Set(ITEMS.filter((i) => ruleMet(s, i.rule, today)).map((i) => i.id));
}

/** Einrichtung des Refugiums (Phase 5). Erst einmal eine Sammlung; aufstellen im Raum, sobald es leere Räume gibt (Prompts Teil 4). */
export interface Decor {
  id: string;
  name: string;
  rule: Rule;
  text: string;
}

export const DECOR: Decor[] = [
  { id: 'rug', name: 'Gewebter Teppich', rule: { kind: 'start' }, text: 'Violett und Gold – das Erste, was ins neue Zuhause kommt.' },
  { id: 'firewood', name: 'Holzkorb', rule: { kind: 'days', n: 3 }, text: 'Damit das Feuer im Kamin nie ausgeht.' },
  { id: 'wolfbed', name: 'Wolfsbett', rule: { kind: 'days', n: 7 }, text: 'Ein weiches Bett für euren Wolf, mit Fell und Decke.' },
  { id: 'lantern', name: 'Zauberlaterne', rule: { kind: 'level', n: 3 }, text: 'Ihr violettes Licht macht jeden Abend gemütlich.' },
  { id: 'ivy', name: 'Efeu-Ampel', rule: { kind: 'streak', n: 7 }, text: 'Wächst langsam, aber stetig – wie eine gute Gewohnheit.' },
  { id: 'painting', name: 'Bild vom Mondwald', rule: { kind: 'journal', n: 3 }, text: 'Der Wald bei Nacht, gemalt in Öl.' },
  { id: 'desk', name: 'Schreibtisch', rule: { kind: 'goals', n: 1 }, text: 'Mit Armillarsphäre und Feder – hier plant ihr eure Ziele.' },
  { id: 'bookshelf', name: 'Bücherregal', rule: { kind: 'lessons', n: 2 }, text: 'Für die Bücher und Lektionen der Mentorin.' },
  { id: 'windowbench', name: 'Fensterbank mit Kissen', rule: { kind: 'refuge', n: 2 }, text: 'Der schönste Platz, um in den Mondwald zu schauen.' },
  { id: 'crystals', name: 'Kristallschale', rule: { kind: 'trophies', n: 5 }, text: 'Die Kristalle leuchten für jede eurer Trophäen.' },
  { id: 'wisteria', name: 'Glyzinien-Girlande', rule: { kind: 'days', n: 45 }, text: 'Violette Blüten über dem Kamin.' },
  { id: 'trophyshelf', name: 'Trophäen-Brett', rule: { kind: 'trophies', n: 10 }, text: 'Ein eigener Platz für eure schönsten Auszeichnungen.' },
];

export function unlockedDecor(s: AppState, today: DayKey): Set<string> {
  return new Set(DECOR.filter((d) => ruleMet(s, d.rule, today)).map((d) => d.id));
}

/** Kapitel der Geschichte. Die ersten vier sind die Einführung, die weiteren öffnen sich mit dem Fortschritt. */
export interface Chapter {
  title: string;
  text: string;
  rule: Rule;
}

export const STORY_CHAPTERS: Chapter[] = [
  { title: 'Der Aufbruch', rule: { kind: 'start' }, text: 'Lyra und Kael haben große Träume. Aber im Alltag geht vieles durcheinander: Sie fangen ständig Neues an und bleiben selten dran. Darum machen sie sich auf den Weg zu einer weisen Frau, die tief im Zauberwald lebt.' },
  { title: 'Bei der Mentorin', rule: { kind: 'start' }, text: 'Nach einer langen Reise öffnet die Mentorin ihnen die Tür. „Ein großer Traum ist wie ein ferner Berg“, sagt sie. „Ihr erreicht ihn nicht mit einem Sprung, sondern mit vielen kleinen Schritten.“' },
  { title: 'Der kleine Wolf', rule: { kind: 'start' }, text: 'In einem Korb liegt ein Wolfswelpe. Er hat keine Mutter mehr. „Zieht ihn auf“, sagt die Mentorin. „Er braucht euch – jeden Tag. So lernt ihr, Verantwortung zu tragen und an einer Sache dranzubleiben.“' },
  { title: 'Ein neues Zuhause', rule: { kind: 'start' }, text: 'In einer kleinen, alten Hütte beginnt ihr neues Leben. Jeden Tag kümmern sie sich um den Welpen – und mit jeder Gewohnheit, die sie pflegen, wird er größer und stärker.' },
  { title: 'Ein Schornstein raucht', rule: { kind: 'refuge', n: 2 }, text: 'Drei Wochen sind vergangen. Lyra und Kael haben die Hütte geflickt, einen Schornstein gemauert und ein kleines Gärtchen angelegt. „Seht ihr?“, sagt die Mentorin bei ihrem Besuch. „Ein Zuhause wächst wie ihr – Stein für Stein.“' },
  { title: 'Der Jungwolf', rule: { kind: 'wolf', n: 1 }, text: 'Eines Morgens stolpert der Welpe nicht mehr über seine Pfoten. Er rennt voraus, wartet am Waldrand und schaut sich um, ob ihr nachkommt. Er weiß jetzt: Auf euch ist Verlass.' },
  { title: 'Das große Haus', rule: { kind: 'refuge', n: 3 }, text: 'Aus dem Häuschen ist ein richtiges Haus geworden, mit Balkon, Glyzinien und einer eigenen Hütte für den Wolf. Oben hat jetzt jeder ein eigenes Zimmer. Die Mentorin lächelt: „Ihr habt nicht aufgegeben. Das sieht man.“' },
  { title: 'Erwachsen', rule: { kind: 'wolf', n: 2 }, text: 'Euer Wolf ist erwachsen. Nachts hält er Wache vor dem Haus, tagsüber begleitet er euch auf jedem Weg. Er ist stark geworden – weil ihr jeden Tag für ihn da wart.' },
  { title: 'Die Legende', rule: { kind: 'wolf', n: 3 }, text: 'Im Mondlicht schimmert sein Fell wie Sternenstaub. Im ganzen Zauberwald erzählt man sich von den beiden, die einen Welpen ohne Mutter aufgezogen haben – und davon, was Beständigkeit möglich macht.' },
];
