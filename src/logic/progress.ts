// XP, Level und Wolf werden immer aus den Haken berechnet, nie hochgezählt.
// Dadurch kann man durch An- und Abhaken nichts sammeln, und „Rückgängig“ stimmt immer.

import type { DayKey } from './date.ts';
import { doneByDay, dueHabits, activeDays } from './habits.ts';
import type { DoneMap, Habit } from './types.ts';

export const XP_PER_DONE = 10;
export const XP_MAX_DONE_PER_DAY = 5;
export const XP_DAY_BONUS = 20;

export function xpForDay(habits: Habit[], done: DoneMap, day: DayKey, doneIds: string[]): number {
  const counted = Math.min(doneIds.length, XP_MAX_DONE_PER_DAY) * XP_PER_DONE;
  const due = dueHabits(habits, day);
  const allDone = due.length > 0 && due.every((h) => doneIds.includes(h.id));
  return counted + (allDone ? XP_DAY_BONUS : 0);
}

export function totalXp(habits: Habit[], done: DoneMap): number {
  let xp = 0;
  for (const [day, ids] of doneByDay(habits, done)) xp += xpForDay(habits, done, day, ids);
  return xp;
}

export function xpToday(habits: Habit[], done: DoneMap, today: DayKey): number {
  return xpForDay(habits, done, today, doneByDay(habits, done).get(today) || []);
}

/** Gesamt-XP, die Level n braucht (Level 1 = 0, Level n ≥ 2 = 50 · n · (n + 1)). */
export function xpForLevel(n: number): number {
  return n <= 1 ? 0 : 50 * n * (n + 1);
}

export function levelInfo(xp: number): { level: number; from: number; to: number } {
  let n = 1;
  while (xp >= xpForLevel(n + 1)) n++;
  return { level: n, from: xpForLevel(n), to: xpForLevel(n + 1) };
}

export const WOLF_STAGES = [
  { key: 'pup', days: 0, name: 'Wolfswelpe' },
  { key: 'young', days: 30, name: 'Jungwolf' },
  { key: 'adult', days: 150, name: 'Erwachsener Wolf' },
  { key: 'legend', days: 300, name: 'Legendärer Wolf' },
] as const;

/** Wolf-Stufe nach aktiven Tagen; `kept` = früher schon erreichte Stufe (nie zurück). */
export function wolfStage(habits: Habit[], done: DoneMap, kept = 0) {
  const days = activeDays(habits, done).length;
  let i = 0;
  WOLF_STAGES.forEach((s, j) => {
    if (days >= s.days) i = j;
  });
  i = Math.max(i, kept);
  const next = WOLF_STAGES[i + 1];
  return { index: i, stage: WOLF_STAGES[i], activeDays: days, toNext: next ? Math.max(0, next.days - days) : 0, next };
}
