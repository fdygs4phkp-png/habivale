import { addDays, weekday, type DayKey } from './date.ts';
import type { DoneMap, Habit } from './types.ts';

export function doneKey(habitId: string, day: DayKey): string {
  return habitId + '|' + day;
}

export function isDone(done: DoneMap, habitId: string, day: DayKey): boolean {
  return done[doneKey(habitId, day)] !== undefined;
}

/** Ist das Habit an diesem Tag fällig? Pausierte und archivierte nie, vor dem Start nie. */
export function isDue(h: Habit, day: DayKey): boolean {
  if (h.paused || h.archived) return false;
  if (day < h.start) return false;
  if (h.rhythm.kind === 'daily') return true;
  return h.rhythm.days.includes(weekday(day));
}

export function activeHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => !h.archived && !h.paused);
}

export function dueHabits(habits: Habit[], day: DayKey): Habit[] {
  return habits.filter((h) => isDue(h, day));
}

/** Haken setzen oder wegnehmen. Gibt eine neue Map zurück (nie doppelt: ein Schlüssel je Tag). */
export function toggleDone(done: DoneMap, habitId: string, day: DayKey, now: number = Date.now()): DoneMap {
  const k = doneKey(habitId, day);
  const next = { ...done };
  if (next[k] !== undefined) delete next[k];
  else next[k] = now;
  return next;
}

/**
 * Aktuelle Streak: fällige Tage in Folge, die erledigt sind.
 * Heute zählt mit, wenn erledigt; ist heute noch offen, bricht das die Streak nicht.
 * Nicht fällige Tage (andere Wochentage, Pause) werden übersprungen.
 */
export function currentStreak(h: Habit, done: DoneMap, today: DayKey): number {
  let n = 0;
  let d = today;
  if (isDue(h, d) && !isDone(done, h.id, d)) d = addDays(d, -1);
  for (let guard = 0; guard < 4000 && d >= h.start; guard++) {
    if (isDue(h, d)) {
      if (isDone(done, h.id, d)) n++;
      else break;
    }
    d = addDays(d, -1);
  }
  return n;
}

export function longestStreak(h: Habit, done: DoneMap, today: DayKey): number {
  let best = 0;
  let run = 0;
  for (let d = h.start, guard = 0; d <= today && guard < 4000; d = addDays(d, 1), guard++) {
    if (!isDue(h, d)) continue;
    if (isDone(done, h.id, d)) {
      run++;
      best = Math.max(best, run);
    } else if (d < today) run = 0;
  }
  return best;
}

/** Anteil erledigter fälliger Tage seit dem Start (heute zählt nur, wenn erledigt). */
export function successRate(h: Habit, done: DoneMap, today: DayKey): number | null {
  let due = 0;
  let ok = 0;
  for (let d = h.start, guard = 0; d <= today && guard < 4000; d = addDays(d, 1), guard++) {
    if (!isDue(h, d)) continue;
    const yes = isDone(done, h.id, d);
    if (d === today && !yes) continue;
    due++;
    if (yes) ok++;
  }
  return due ? ok / due : null;
}

/** Erledigungen je Tag (nur Habits, die es noch gibt). */
export function doneByDay(habits: Habit[], done: DoneMap): Map<DayKey, string[]> {
  const ids = new Set(habits.map((h) => h.id));
  const m = new Map<DayKey, string[]>();
  for (const k of Object.keys(done)) {
    const [id, day] = k.split('|');
    if (!ids.has(id)) continue;
    const list = m.get(day) || [];
    list.push(id);
    m.set(day, list);
  }
  return m;
}

/** Aktive Tage: an denen mindestens ein Habit erledigt wurde. */
export function activeDays(habits: Habit[], done: DoneMap): DayKey[] {
  return [...doneByDay(habits, done).keys()].sort();
}
