// Die Geschichte in Tagesteilen (Wunsch der Nutzerin, 24.11.2026): jedes Kapitel ist in Teile geteilt.
// Jeden Tag geht höchstens ein neuer Teil auf. Seit 0.19.0 ist jedes Kapitel ein Teil (= ein Kapitel je Tag) und der Rückblick leer.
// Gelesene Teile bleiben offen. Wer ein paar Tage nicht da war, verpasst nichts: es geht mit dem nächsten ungelesenen Teil weiter.

import { BACKSTORY, ruleMet, STORY_CHAPTERS, type Chapter } from './world.ts';
import type { DayKey } from './date.ts';
import type { AppState } from './types.ts';

export type Lane = 'b' | 's';

export interface PartRef {
  lane: Lane;
  ch: number;
  part: number;
  id: string;
}

export function partId(lane: Lane, ch: number, part: number): string {
  return `${lane}${ch + 1}-${part + 1}`;
}

/** Alle Teile einer Spur, deren Kapitel schon offen sind – der Reihe nach, bis zum ersten verschlossenen Kapitel. */
export function availableParts(s: AppState, lane: Lane, today: DayKey): PartRef[] {
  const list: Chapter[] = lane === 'b' ? BACKSTORY : STORY_CHAPTERS;
  const out: PartRef[] = [];
  for (let c = 0; c < list.length; c++) {
    if (!ruleMet(s, list[c].rule, today)) break;
    list[c].parts.forEach((_, p) => out.push({ lane, ch: c, part: p, id: partId(lane, c, p) }));
  }
  return out;
}

/** Offene Teile, ob heute schon ein neuer dazukam, und welcher Teil heute neu ist (falls einer). */
export function storyOpen(s: AppState, today: DayKey, dayOf: (ts: number) => string): { open: Set<string>; readToday: boolean; next: PartRef | null } {
  const read = s.story || {};
  const open = new Set(Object.keys(read));
  const readToday = Object.values(read).some((ts) => dayOf(ts) === today);
  if (readToday) return { open, readToday, next: null };
  const cand = (['s', 'b'] as Lane[])
    .map((lane) => ({ lane, ref: availableParts(s, lane, today).find((p) => read[p.id] === undefined) ?? null, last: Math.max(-1, ...Object.entries(read).filter(([k]) => k[0] === lane).map(([, v]) => v)) }))
    .filter((x) => x.ref);
  if (!cand.length) return { open, readToday, next: null };
  // Die Spur, aus der am längsten nichts Neues kam; bei Gleichstand die Geschichte (sie beginnt mittendrin)
  cand.sort((a, b) => a.last - b.last);
  const next = cand[0].ref!;
  open.add(next.id);
  return { open, readToday, next };
}
