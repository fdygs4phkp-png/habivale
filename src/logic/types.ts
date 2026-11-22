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
