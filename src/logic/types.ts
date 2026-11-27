import type { DayKey } from './date.ts';

export type Rhythm = { kind: 'daily' } | { kind: 'weekdays'; days: number[] }; // 0 = So … 6 = Sa

export interface Habit {
  id: string;
  name: string;
  icon: string; // Name eines Symbols (MaterialCommunityIcons)
  rhythm: Rhythm;
  start: DayKey;
  paused: boolean;
  archived: boolean;
  createdAt: number;
  mt: number; // Änderungszeit
}

/** Genau ein Eintrag je Habit und Tag: Schlüssel `${habitId}|${tag}` → Zeitpunkt des Abhakens. */
export type DoneMap = Record<string, number>;

export type Jar = 'save' | 'spend' | 'share';

export interface Split {
  save: number;
  spend: number;
  share: number;
} // Prozent, Summe 100

export type MoneyEntry =
  | { id: string; kind: 'allowance'; cents: number; day: DayKey; note: string; parts: Record<Jar, number>; at: number }
  | { id: string; kind: 'spend'; cents: number; day: DayKey; note: string; need: 'want' | 'need' | null; at: number }
  | { id: string; kind: 'share'; cents: number; day: DayKey; note: string; at: number }
  | { id: string; kind: 'move'; cents: number; day: DayKey; note: string; from: Jar; to: Jar; at: number }
  | { id: string; kind: 'savebuy'; cents: number; day: DayKey; note: string; goalId: string; at: number };

export interface SavingsGoal {
  id: string;
  name: string;
  icon: string;
  cents: number;
  createdAt: number;
  reachedAt: number | null; // Sparglas hat genug für dieses Ziel
  boughtAt: number | null; // gekauft / erfüllt – das Geld ist aus dem Sparglas raus
  mt: number;
}

export interface Wish {
  id: string;
  name: string;
  cents: number;
  addedAt: number;
  waitUntil: DayKey; // eine Woche warten
  answer: 'buy' | 'goal' | 'no' | null;
  answeredAt: number | null;
  mt: number;
}

export interface AppState {
  version: 1;
  profileName: string;
  habits: Habit[];
  done: DoneMap;
  money: {
    split: Split;
    entries: MoneyEntry[];
    goals: SavingsGoal[];
    wishes: Wish[];
  };
  /** Erstes Erreichen (Bestandsschutz): Trophäe/Wolf-Stufe → Zeitpunkt */
  firsts: Record<string, number>;
  /** Tagebuch: ein Eintrag je Tag (privat, wird nie mit Eltern geteilt) */
  journal: Record<DayKey, JournalEntry>;
  goals: Goal[];
  /** Wochenrückblick: Schlüssel = Montag der Woche */
  weeks: Record<DayKey, WeekNote>;
  /** Testphase: Premium-Funktionen an/aus (später über das Abo) */
  premium: boolean;
  /** Testphase: Kinder-Modus ansehen, ohne ein Kinderprofil zu sein */
  kidPreview: boolean;
  /** Das eigene Tagebuch: geführt (Fragen) oder leer (freie Seiten), Hoch- oder Querformat (Einstellungs-Block, `sMt`) */
  diary?: DiaryInfo | null;
  /** Änderungszeit des Einstellungs-Blocks (Name, Premium, Aufteilung, Sparziel) */
  sMt: number;
  /** Grabsteine: 'h:'/'g:'/'m:' + id, 'd:' + Haken-Schlüssel → Zeitpunkt des Löschens */
  deleted: Record<string, number>;
  /** Familienkonto (Eltern: Schlüsselpaar und Kinderprofile; Kind: Verbindung und Freigaben) */
  family: FamilyInfo | null;
  fMt: number;
  /** Eingang vom Familienkonto: Vorschläge, Lob, Taschengeld-Hinweise (bis das Kind sie annimmt oder wegtippt) */
  inbox: InboxItem[];
  /** Gelesene Geld-Lektionen der Mentorin → Zeitpunkt */
  lessons: Record<string, number>;
  /** Gelesene Teile der Geschichte (`src/logic/story.ts`, z. B. 'b1-2', 's3-1') → Zeitpunkt */
  story?: Record<string, number>;
  /** Wer im Vordergrund steht und was Lyra und Kael tragen (Einstellungs-Block, `sMt`) */
  hero: 'lyra' | 'kael';
  outfits: { lyra: string; kael: string };
  /** Von der Mentorin schon verkündete Ereignisse (Schlüssel wie in `firsts`) */
  celebrated: Record<string, number>;
  /** Besuche im Hexenhaus: Tag → erster Besuch an dem Tag (je Besuchstag öffnet sich eine Geschichte der Mentorin) */
  visits: Record<DayKey, number>;
  /** Erster Start der App (für „Was davor geschah“: jeden Tag ein Stück) */
  startedAt?: number;
}

export interface InboxItem {
  id: string;
  at: number;
  from: string; // Name des Elternteils
  kind: 'suggest' | 'praise' | 'allowance';
  habit?: { name: string; icon: string; days: number[] };
  sticker?: string;
  text?: string;
  cents?: number;
  /** Spar-Bonus der Eltern zum Taschengeld (geht ganz ins Sparglas) */
  bonus?: number;
}

/** Was Eltern dem Kind schicken (verschlüsselt im Eingang). */
export type ParentMessage =
  | { type: 'suggest'; from: string; habit: { name: string; icon: string; days: number[] } }
  | { type: 'praise'; from: string; sticker: string; text: string }
  | { type: 'allowance'; from: string; cents: number; note: string; bonus?: number }
  /** Premium gilt für die ganze Familie: die Eltern schicken ihren Stand an die Kindergeräte */
  | { type: 'premium'; from: string; on: boolean };

export type Avatar = 'lyra' | 'kael';

export interface ChildProfile {
  memberId: string;
  name: string;
  birthYear: number;
  avatar: Avatar;
  addedAt: number;
  /** Premium-Stand, der diesem Kind zuletzt geschickt wurde */
  prem?: boolean;
  /** Wiederherstellungs-Code des Kindes, vom Kindergerät verschlüsselt übermittelt (für neue Geräte ohne Code-Eingabe) */
  rc?: string;
}

export interface Shares {
  habits: boolean;
  goals: boolean;
  money: boolean;
}

export type FamilyInfo =
  | { role: 'parent'; familyId: string; pub: JsonWebKey; priv: JsonWebKey; children: ChildProfile[] }
  | { role: 'child'; familyId: string; memberId: string; name: string; birthYear: number; avatar: Avatar; parents: { id: string; pub: JsonWebKey }[]; shares: Shares; pub: JsonWebKey; priv: JsonWebKey };

export type AgeStage = 'kind' | 'jugend' | 'erwachsen';

export function ageStage(birthYear: number | null | undefined, year = new Date().getFullYear()): AgeStage {
  if (!birthYear) return 'erwachsen';
  const age = year - birthYear;
  return age < 12 ? 'kind' : age < 16 ? 'jugend' : 'erwachsen';
}

/** Voreinstellung der Freigaben nach Alter (Master-Prompt Abschnitt 21). Das Tagebuch gibt es hier bewusst nicht. */
export function defaultShares(stage: AgeStage): Shares {
  return { habits: true, goals: true, money: stage === 'kind' };
}

export type Mood = 1 | 2 | 3 | 4 | 5;

export interface JournalEntry {
  day: DayKey;
  mood: Mood | null;
  win: string; // Mein größter Erfolg
  hard: string; // Was war schwer?
  thanks: string; // Dafür bin ich dankbar
  tomorrow: string; // Was möchte ich morgen besser machen?
  free: string; // Freier Text
  /** Sticker auf der Seite, Lage in Prozent der Seite */
  stickers?: { id: string; k: string; x: number; y: number }[];
  mt: number;
}

export interface DiaryInfo {
  kind: 'guided' | 'free';
  format: 'p' | 'l';
  since: number;
}

export const LIFE_AREAS = ['school', 'friends', 'family', 'health', 'joy', 'money'] as const;
export type LifeArea = (typeof LIFE_AREAS)[number];

export interface GoalStep {
  id: string;
  text: string;
  done: boolean;
}

export interface Goal {
  id: string;
  title: string;
  area: LifeArea;
  why: string;
  steps: GoalStep[];
  due: DayKey | null;
  reachedAt: number | null;
  createdAt: number;
  mt: number;
}

export interface WeekNote {
  proud: string;
  mt: number;
}

export const FREE_HABIT_LIMIT = 3;
export const PREMIUM_HABIT_LIMIT = 12;
/** Wie viele aktive Gewohnheiten gehen (kostenlos 3, mit Premium 12). */
export function habitLimit(premium: boolean): number {
  return premium ? PREMIUM_HABIT_LIMIT : FREE_HABIT_LIMIT;
}
/** Test-Code für Premium (Testphase, bis das Abo kommt). */
export const PREMIUM_TEST_CODE = 'HABIVALE-PRO';
export const FREE_SAVINGS_GOALS = 1;
export const MAX_SAVINGS_GOALS = 5;
