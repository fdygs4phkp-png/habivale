// Kleidung und Gegenstände (Phase 4). Alles wird durch Fortschritt verdient – nichts lässt sich kaufen.
// Bilder: ganze Outfits je Figur (wie die Lady-Kleider in eWolfe), Gegenstände als Einzelbilder.

import { activeDays, longestStreak } from './habits.ts';
import { entryHasContent } from './journal.ts';
import { levelInfo, wolfStage } from './progress.ts';
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
  | { kind: 'shared'; n: number };

export function ruleText(r: Rule): string {
  switch (r.kind) {
    case 'start': return 'Von Anfang an dabei';
    case 'level': return `Erreiche Level ${r.n}`;
    case 'days': return `Sei an ${r.n} Tagen aktiv`;
    case 'wolf': return ['', 'Euer Wolf wird ein Jungwolf', 'Euer Wolf wird erwachsen', 'Euer Wolf wird legendär'][r.n];
    case 'streak': return `Schaffe eine Gewohnheit ${r.n} Tage in Folge`;
    case 'trophies': return `Sammle ${r.n} Trophäen`;
    case 'journal': return `Schreib an ${r.n} Tagen ins Tagebuch`;
    case 'goals': return r.n === 1 ? 'Erreiche ein Ziel im Tagebuch' : `Erreiche ${r.n} Ziele im Tagebuch`;
    case 'savings': return r.n === 1 ? 'Erreiche ein Sparziel' : `Erreiche ${r.n} Sparziele`;
    case 'lessons': return `Lies ${r.n} Lektionen der Mentorin`;
    case 'shared': return `Teile ${r.n}-mal aus dem grünen Glas`;
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
  { id: 'lyra-winter', hero: 'lyra', name: 'Wintermantel', rarity: 'rare', rule: { kind: 'days', n: 30 }, text: 'Warm, mit weichem Kragen und Schneeflocken-Spange.' },
  { id: 'lyra-festive', hero: 'lyra', name: 'Festtagskleid', rarity: 'epic', rule: { kind: 'level', n: 8 }, text: 'Violett und Gold, für besondere Tage.' },
  { id: 'lyra-starnight', hero: 'lyra', name: 'Sternennacht', rarity: 'legendary', rule: { kind: 'wolf', n: 3 }, text: 'Ein Kleid wie der Nachthimmel, voller kleiner Sterne.' },
  { id: 'kael-start', hero: 'kael', name: 'Reisegewand', rarity: 'common', rule: { kind: 'start' }, text: 'Kaels dunkelblaue Tunika mit Goldstickerei und Umhang.' },
  { id: 'kael-ranger', hero: 'kael', name: 'Waldläufer', rarity: 'common', rule: { kind: 'level', n: 3 }, text: 'Waldgrün mit Lederweste und Karte am Gürtel.' },
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
