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
}

export const FREE_HABIT_LIMIT = 3;
