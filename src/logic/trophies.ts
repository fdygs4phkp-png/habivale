// Basistrophäen (Free). Aus den Daten berechnet; das erste Erreichen wird in `firsts` gemerkt,
// damit eine Trophäe nie wieder verschwindet (Bestandsschutz).

import { activeDays, doneByDay } from './habits.ts';
import type { AppState } from './types.ts';

export interface TrophyDef {
  id: string;
  name: string;
  text: string;
  icon: string;
  reached: (s: AppState) => boolean;
}

const doneCount = (s: AppState) => [...doneByDay(s.habits, s.done).values()].reduce((n, l) => n + l.length, 0);

export const TROPHIES: TrophyDef[] = [
  { id: 'first-step', name: 'Der erste Schritt', text: 'Du hast dein erstes Habit erledigt.', icon: 'shoe-print', reached: (s) => doneCount(s) >= 1 },
  { id: 'days-7', name: 'Sieben Tage Beständigkeit', text: 'An 7 Tagen hast du etwas geschafft.', icon: 'star-four-points', reached: (s) => activeDays(s.habits, s.done).length >= 7 },
  { id: 'days-30', name: '30 erfolgreiche Tage', text: 'An 30 Tagen warst du dabei.', icon: 'medal', reached: (s) => activeDays(s.habits, s.done).length >= 30 },
  { id: 'done-100', name: '100 erledigte Habits', text: 'Hundert Mal abgehakt.', icon: 'diamond-stone', reached: (s) => doneCount(s) >= 100 },
  { id: 'money-first', name: 'Das erste Taschengeld', text: 'Du hast dein erstes Taschengeld in die Gläser verteilt.', icon: 'cup', reached: (s) => s.money.entries.some((e) => e.kind === 'allowance') },
  { id: 'money-share', name: 'Erstes Mal geteilt', text: 'Du hast aus dem Teilen-Glas etwas weitergegeben.', icon: 'hand-heart', reached: (s) => s.money.entries.some((e) => e.kind === 'share') },
  { id: 'goal-reached', name: 'Sparziel erreicht', text: 'Dein Sparglas hat dein Ziel erreicht.', icon: 'piggy-bank', reached: (s) => !!s.money.goal?.reachedAt },
];

/** Neue erste Erreichungen eintragen. Gibt `null` zurück, wenn sich nichts ändert. */
export function updateFirsts(s: AppState, now = Date.now()): Record<string, number> | null {
  let changed = false;
  const f = { ...s.firsts };
  for (const t of TROPHIES) {
    if (f['t:' + t.id] === undefined && t.reached(s)) {
      f['t:' + t.id] = now;
      changed = true;
    }
  }
  return changed ? f : null;
}
