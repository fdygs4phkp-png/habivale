// Refugium (Phase 5): Ausbaustufe nach aktiven Tagen, Jahreszeit nach Datum.
// Wie alles andere berechnet, nie hochgezählt. Erreichte Stufen stehen in `firsts` ('ref:2', 'ref:3') – das Haus wird nie wieder kleiner.

import { activeDays } from './habits.ts';
import { fromKey, type DayKey } from './date.ts';
import type { AppState } from './types.ts';

export const REFUGE_STAGES = [
  { n: 1, days: 0, name: 'Die alte Hütte', text: 'Klein und einfach – aber euer erstes eigenes Zuhause im Zauberwald.' },
  { n: 2, days: 21, name: 'Das Häuschen', text: 'Ein Schornstein, ein Gärtchen, mehr Platz für euch und den Wolf.' },
  { n: 3, days: 90, name: 'Das große Haus', text: 'Zwei Stockwerke, ein Balkon und eine eigene Hütte für den Wolf. Oben hat jeder ein eigenes Zimmer.' },
] as const;

/** Höchste je erreichte Stufe (Bestandsschutz). */
export function keptRefuge(s: AppState): number {
  let k = 1;
  for (const st of REFUGE_STAGES) if (st.n > 1 && s.firsts['ref:' + st.n] !== undefined) k = st.n;
  return k;
}

/** Stufe aus den aktiven Tagen (ohne Bestandsschutz, für `updateFirsts`). */
export function refugeStageByDays(s: AppState): number {
  const days = activeDays(s.habits, s.done).length;
  let n = 1;
  for (const st of REFUGE_STAGES) if (days >= st.days) n = st.n;
  return n;
}

export function refugeStage(s: AppState) {
  const days = activeDays(s.habits, s.done).length;
  const n = Math.max(refugeStageByDays(s), keptRefuge(s));
  const stage = REFUGE_STAGES[n - 1];
  const next = REFUGE_STAGES[n];
  return { n, stage, days, next, toNext: next ? Math.max(0, next.days - days) : 0 };
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
/** Was draußen zu sehen ist: Winter ohne Schmuck oder die Weihnachtszeit mit Kranz. */
export type Scene = Season | 'xmas';

export const SCENE_NAME: Record<Scene, string> = { spring: 'Frühling', summer: 'Sommer', autumn: 'Herbst', winter: 'Winter', xmas: 'Weihnachtszeit' };
export const SCENES: Scene[] = ['spring', 'summer', 'autumn', 'winter', 'xmas'];

/** Meteorologische Jahreszeiten: Frühling März–Mai, Sommer Juni–August, Herbst September–November, Winter Dezember–Februar. */
export function seasonOf(k: DayKey): Season {
  const m = fromKey(k).getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

/** Weihnachtszeit: 1. Dezember bis 6. Januar (Advent bis Dreikönig). Nur dann hängt ein Kranz an der Tür. */
export function isChristmasTime(k: DayKey): boolean {
  const d = fromKey(k);
  const m = d.getMonth() + 1;
  return m === 12 || (m === 1 && d.getDate() <= 6);
}

export function sceneOf(k: DayKey): Scene {
  return isChristmasTime(k) ? 'xmas' : seasonOf(k);
}
