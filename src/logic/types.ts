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
  | { id: string; kind: 'move'; cents: number; day: DayKey; note: string; from: Jar; to: Jar; at: number };

export interface SavingsGoal {
  name: string;
  icon: string;
  cents: number;
  reachedAt: number | null;
}

export interface AppState {
  version: 1;
  profileName: string;
  habits: Habit[];
  done: DoneMap;
  money: {
    split: Split;
    entries: MoneyEntry[];
    goal: SavingsGoal | null;
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
  /** Änderungszeit des Einstellungs-Blocks (Name, Premium, Aufteilung, Sparziel) */
  sMt: number;
  /** Grabsteine: 'h:'/'g:'/'m:' + id, 'd:' + Haken-Schlüssel → Zeitpunkt des Löschens */
  deleted: Record<string, number>;
  /** Familienkonto (Eltern: Schlüsselpaar und Kinderprofile; Kind: Verbindung und Freigaben) */
  family: FamilyInfo | null;
  fMt: number;
  /** Eingang vom Familienkonto: Vorschläge, Lob, Taschengeld-Hinweise (bis das Kind sie annimmt oder wegtippt) */
  inbox: InboxItem[];
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
}

/** Was Eltern dem Kind schicken (verschlüsselt im Eingang). */
export type ParentMessage =
  | { type: 'suggest'; from: string; habit: { name: string; icon: string; days: number[] } }
  | { type: 'praise'; from: string; sticker: string; text: string }
  | { type: 'allowance'; from: string; cents: number; note: string };

export type Avatar = 'lyra' | 'kael';

export interface ChildProfile {
  memberId: string;
  name: string;
  birthYear: number;
  avatar: Avatar;
  addedAt: number;
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
  mt: number;
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
