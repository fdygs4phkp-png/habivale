// Was ein Kind mit seinen Eltern teilt – nur, was eingeschaltet ist. Das Tagebuch ist nie dabei.

import { addDays, type DayKey } from './date.ts';
import { activeHabits, currentStreak, isDone, isDue } from './habits.ts';
import { goalProgress } from './journal.ts';
import { allocate, balances, openGoals } from './money.ts';
import type { AppState, Jar, LifeArea, Shares } from './types.ts';

export interface Snapshot {
  name: string;
  at: number;
  shares: Shares;
  habits?: { name: string; icon: string; streak: number; days: (0 | 1 | null)[] }[]; // letzte 14 Tage, null = nicht fällig
  goals?: { title: string; area: LifeArea; progress: number; reached: boolean }[];
  money?: { balances: Record<Jar, number>; goals: { name: string; cents: number; saved: number }[] };
  /** Wiederherstellungs-Code des Kindes (die Eltern haben ihn ohnehin auf ihrer Karte). Damit kann ein neues Kindergerät
   *  sich allein mit dem Einladungscode entsperren. Nur verschlüsselt für die Eltern. */
  rc?: string;
}

export function buildSnapshot(s: AppState, today: DayKey, shares: Shares, now = Date.now()): Snapshot {
  const snap: Snapshot = { name: s.profileName, at: now, shares };
  if (shares.habits) {
    snap.habits = activeHabits(s.habits).map((h) => ({
      name: h.name,
      icon: h.icon,
      streak: currentStreak(h, s.done, today),
      days: Array.from({ length: 14 }, (_, i) => {
        const d = addDays(today, i - 13);
        return isDue(h, d) ? (isDone(s.done, h.id, d) ? 1 : 0) : null;
      }),
    }));
  }
  if (shares.goals) {
    snap.goals = s.goals.map((g) => ({ title: g.title, area: g.area, progress: goalProgress(g), reached: !!g.reachedAt }));
  }
  if (shares.money) {
    const b = balances(s.money.entries);
    const alloc = allocate(b.save, s.money.goals);
    snap.money = { balances: b, goals: openGoals(s.money.goals).map((g) => ({ name: g.name, cents: g.cents, saved: alloc[g.id] ?? 0 })) };
  }
  return snap;
}

/** Ohne Zeitstempel vergleichen, damit nur echte Änderungen hochgeladen werden. */
export function snapshotKey(s: Snapshot): string {
  const { at: _at, ...rest } = s;
  return JSON.stringify(rest);
}
