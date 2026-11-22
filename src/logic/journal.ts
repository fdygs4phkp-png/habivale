import { addDays, weekday, type DayKey } from './date.ts';
import { dueHabits, isDone } from './habits.ts';
import type { AppState, DoneMap, Goal, Habit, JournalEntry } from './types.ts';

export function emptyEntry(day: DayKey): JournalEntry {
  return { day, mood: null, win: '', hard: '', thanks: '', tomorrow: '', free: '', mt: 0 };
}

export function entryHasContent(e: JournalEntry | undefined): boolean {
  if (!e) return false;
  return e.mood !== null || [e.win, e.hard, e.thanks, e.tomorrow, e.free].some((x) => x.trim().length > 0);
}

/** Montag der Woche (Wochenrückblick wie in Deutschland üblich: Mo–So). */
export function weekStart(day: DayKey): DayKey {
  const wd = weekday(day); // 0 = So
  return addDays(day, wd === 0 ? -6 : 1 - wd);
}

export function weekDays(monday: DayKey): DayKey[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export interface DaySummary {
  day: DayKey;
  due: number;
  done: number;
  mood: number | null;
}

export function daySummary(habits: Habit[], done: DoneMap, journal: AppState['journal'], day: DayKey): DaySummary {
  const due = dueHabits(habits, day);
  return { day, due: due.length, done: due.filter((h) => isDone(done, h.id, day)).length, mood: journal[day]?.mood ?? null };
}

export function weekSummary(s: AppState, monday: DayKey, today: DayKey) {
  const days = weekDays(monday).filter((d) => d <= today).map((d) => daySummary(s.habits, s.done, s.journal, d));
  const due = days.reduce((n, d) => n + d.due, 0);
  const doneN = days.reduce((n, d) => n + d.done, 0);
  const moods = days.map((d) => d.mood).filter((m): m is number => m !== null);
  const goalsReached = s.goals.filter((g) => g.reachedAt && weekStart(dayOf(g.reachedAt)) === monday).length;
  return {
    days,
    due,
    done: doneN,
    activeDays: days.filter((d) => d.done > 0).length,
    moodAvg: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : null,
    journalDays: weekDays(monday).filter((d) => entryHasContent(s.journal[d])).length,
    goalsReached,
  };
}

function dayOf(ts: number): DayKey {
  const d = new Date(ts);
  const p = (n: number) => (n < 10 ? '0' + n : String(n));
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

export function goalProgress(g: Goal): number {
  if (g.reachedAt) return 1;
  if (!g.steps.length) return 0;
  return g.steps.filter((x) => x.done).length / g.steps.length;
}

export const AREA_NAME: Record<Goal['area'], string> = {
  school: 'Schule & Lernen',
  friends: 'Freunde',
  family: 'Familie',
  health: 'Gesundheit',
  joy: 'Freude',
  money: 'Geld',
};

export const AREA_ICON: Record<Goal['area'], string> = {
  school: 'school-outline',
  friends: 'account-group-outline',
  family: 'home-heart',
  health: 'heart-pulse',
  joy: 'white-balance-sunny',
  money: 'piggy-bank-outline',
};

/** Prüft, ob eine Datei wie ein Habivale-Backup aussieht. */
export function looksLikeBackup(x: unknown): x is { app: 'habivale'; state: AppState } {
  if (!x || typeof x !== 'object') return false;
  const o = x as { app?: unknown; state?: { habits?: unknown; done?: unknown } };
  return o.app === 'habivale' && !!o.state && Array.isArray(o.state.habits) && typeof o.state.done === 'object';
}
