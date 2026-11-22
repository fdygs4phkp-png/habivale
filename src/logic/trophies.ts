// Trophäen, Level und Wolf-Stufen. Alles aus den Daten berechnet; das erste Erreichen steht in `firsts`,
// damit nichts wieder verschwindet (Bestandsschutz): 't:' + Trophäe, 'lv:' + Level, 'wolf:' + Stufe.

import { addDays, daysBetween, type DayKey } from './date.ts';
import { activeDays, doneByDay, longestStreak } from './habits.ts';
import { entryHasContent } from './journal.ts';
import { moneyXp } from './money.ts';
import { levelInfo, totalXp, wolfStage, WOLF_STAGES } from './progress.ts';
import type { AppState } from './types.ts';

export interface TrophyDef {
  id: string;
  name: string;
  text: string;
  /** Wie man sie bekommt – steht bei noch nicht erreichten Trophäen */
  how: string;
  icon: string;
  /** Basistrophäe: auch in der kostenlosen Version */
  free?: boolean;
  reached: (s: AppState, today: DayKey) => boolean;
}

const doneCount = (s: AppState) => [...doneByDay(s.habits, s.done).values()].reduce((n, l) => n + l.length, 0);
const actDays = (s: AppState) => activeDays(s.habits, s.done);

/** Nach einer Pause von mindestens 7 Tagen wieder dabei (vorher mindestens 3 aktive Tage). */
function cameBack(s: AppState): boolean {
  const d = actDays(s);
  for (let i = 3; i < d.length; i++) if (daysBetween(d[i - 1], d[i]) > 7) return true;
  return false;
}

export function xpOf(s: AppState): number {
  return totalXp(s.habits, s.done) + moneyXp(s);
}

export const TROPHIES: TrophyDef[] = [
  { id: 'first-step', name: 'Der erste Schritt', text: 'Du hast dein erstes Habit erledigt.', how: 'Erledige deine erste Gewohnheit.', icon: 'paw', free: true, reached: (s) => doneCount(s) >= 1 },
  { id: 'way-begins', name: 'Der Weg beginnt', text: 'An drei Tagen warst du schon dabei.', how: 'Sei an drei Tagen aktiv.', icon: 'lightbulb-on-outline', free: true, reached: (s) => actDays(s).length >= 3 },
  { id: 'days-7', name: 'Sieben Tage Beständigkeit', text: 'An 7 Tagen hast du etwas geschafft.', how: 'Sei an sieben Tagen aktiv.', icon: 'star-four-points', free: true, reached: (s) => actDays(s).length >= 7 },
  { id: 'days-30', name: '30 erfolgreiche Tage', text: 'An 30 Tagen warst du dabei.', how: 'Sei an 30 Tagen aktiv.', icon: 'medal', reached: (s) => actDays(s).length >= 30 },
  { id: 'master', name: 'Meister der Gewohnheiten', text: 'Eine Gewohnheit 21 Tage in Folge – sie gehört jetzt zu dir.', how: 'Schaffe eine Gewohnheit 21 Tage in Folge.', icon: 'trophy', reached: (s, t) => s.habits.some((h) => longestStreak(h, s.done, t) >= 21) },
  { id: 'done-100', name: '100 erledigte Habits', text: 'Hundert Mal abgehakt.', how: 'Hake 100 Mal eine Gewohnheit ab.', icon: 'diamond-stone', reached: (s) => doneCount(s) >= 100 },
  { id: 'one-year', name: 'Ein Jahr auf dem Weg', text: 'Ein ganzes Jahr bist du schon unterwegs.', how: 'Bleib ein Jahr dabei (mindestens 100 aktive Tage).', icon: 'weather-sunset', reached: (s, t) => { const d = actDays(s); return d.length >= 100 && d[0] <= addDays(t, -365); } },
  { id: 'comeback', name: 'Rückkehr nach einer Pause', text: 'Du hast eine Pause gemacht und bist zurückgekommen. Das ist Stärke.', how: 'Komm nach einer Pause von einer Woche zurück.', icon: 'compass-outline', free: true, reached: (s) => cameBack(s) },
  { id: 'legend', name: 'Der legendäre Begleiter', text: 'Euer Wolf ist legendär geworden.', how: 'Lass euren Wolf zur legendären Stufe wachsen.', icon: 'star-shooting', reached: (s) => wolfStage(s.habits, s.done).index >= 3 },
  { id: 'money-first', name: 'Das erste Taschengeld', text: 'Du hast dein erstes Taschengeld in die Gläser verteilt.', how: 'Trage dein erstes Taschengeld ein.', icon: 'cup', free: true, reached: (s) => s.money.entries.some((e) => e.kind === 'allowance') },
  { id: 'goal-reached', name: 'Sparziel erreicht', text: 'Dein Sparglas hat dein Ziel erreicht.', how: 'Erreiche ein Sparziel.', icon: 'piggy-bank', free: true, reached: (s) => s.money.goals.some((g) => !!g.reachedAt) },
  { id: 'goals-3', name: 'Drei Sparziele', text: 'Du hast drei Sparziele erreicht.', how: 'Erreiche drei Sparziele.', icon: 'treasure-chest', reached: (s) => s.money.goals.filter((g) => !!g.reachedAt).length >= 3 },
  { id: 'money-year', name: 'Ein Jahr Taschengeld-Plan', text: 'In zwölf Monaten hast du dein Taschengeld eingetragen.', how: 'Trage in zwölf verschiedenen Monaten Taschengeld ein.', icon: 'treasure-chest', reached: (s) => new Set(s.money.entries.filter((e) => e.kind === 'allowance').map((e) => e.day.slice(0, 7))).size >= 12 },
  { id: 'money-share', name: 'Erstes Mal geteilt', text: 'Du hast aus dem Teilen-Glas etwas weitergegeben.', how: 'Teile zum ersten Mal etwas aus dem grünen Glas.', icon: 'hand-heart', reached: (s) => s.money.entries.some((e) => e.kind === 'share') },
  { id: 'waited', name: 'Eine Woche gewartet', text: 'Du hast bei einem Wunsch eine Woche gewartet, bevor du entschieden hast.', how: 'Setz einen Wunsch auf die Wunschliste und warte eine Woche.', icon: 'timer-sand', reached: (s) => s.money.wishes.some((w) => !!w.answer) },
  { id: 'journal-first', name: 'Die erste Seite', text: 'Du hast zum ersten Mal in dein Tagebuch geschrieben.', how: 'Schreib zum ersten Mal ins Tagebuch.', icon: 'book-open-variant', reached: (s) => Object.values(s.journal).some(entryHasContent) },
  { id: 'journal-7', name: 'Sieben Seiten', text: 'An sieben Tagen hast du Tagebuch geschrieben.', how: 'Schreib an sieben Tagen ins Tagebuch.', icon: 'book-multiple', reached: (s) => Object.values(s.journal).filter(entryHasContent).length >= 7 },
  { id: 'goal-first', name: 'Das erste Ziel', text: 'Du hast dein erstes Ziel erreicht.', how: 'Erreiche dein erstes Ziel im Tagebuch.', icon: 'flag-checkered', reached: (s) => s.goals.some((g) => !!g.reachedAt) },
];

/** Neue erste Erreichungen (Trophäen, Level, Wolf-Stufen) eintragen. `null`, wenn sich nichts ändert. */
export function updateFirsts(s: AppState, now = Date.now(), today: DayKey = dayKeyOf(now)): Record<string, number> | null {
  let changed = false;
  const f = { ...s.firsts };
  const set = (k: string) => {
    if (f[k] === undefined) {
      f[k] = now;
      changed = true;
    }
  };
  for (const t of TROPHIES) if (f['t:' + t.id] === undefined && t.reached(s, today)) set('t:' + t.id);
  const lv = levelInfo(xpOf(s)).level;
  for (let n = 2; n <= lv; n++) set('lv:' + n);
  const w = wolfStage(s.habits, s.done).index;
  for (let i = 1; i <= w; i++) set('wolf:' + i);
  return changed ? f : null;
}

function dayKeyOf(ts: number): DayKey {
  const d = new Date(ts);
  const p = (n: number) => (n < 10 ? '0' + n : String(n));
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

/** Höchste je erreichte Wolf-Stufe (Bestandsschutz: der Wolf wird nie wieder kleiner). */
export function keptWolf(s: AppState): number {
  let k = 0;
  for (let i = 1; i < WOLF_STAGES.length; i++) if (s.firsts['wolf:' + i] !== undefined) k = i;
  return k;
}

export interface WorldEvent {
  key: string;
  at: number;
  kind: 'trophy' | 'level' | 'wolf';
  title: string;
  text: string;
  trophyId?: string;
  wolf?: number;
}

/** Was die Mentorin noch verkünden möchte: erstes Erreichen, das noch nicht gefeiert wurde (älteste zuerst). */
export function pendingEvents(s: AppState): WorldEvent[] {
  const out: WorldEvent[] = [];
  for (const [key, at] of Object.entries(s.firsts)) {
    if (s.celebrated[key] !== undefined) continue;
    if (key.startsWith('t:')) {
      const t = TROPHIES.find((x) => x.id === key.slice(2));
      if (t) out.push({ key, at, kind: 'trophy', title: 'Eine neue Trophäe: ' + t.name, text: t.text, trophyId: t.id });
    } else if (key.startsWith('lv:')) {
      out.push({ key, at, kind: 'level', title: 'Level ' + key.slice(3) + '!', text: 'Lyra und Kael werden stärker – Schritt für Schritt. Weiter so!' });
    } else if (key.startsWith('wolf:')) {
      const i = Number(key.slice(5));
      out.push({ key, at, kind: 'wolf', title: 'Euer Wolf ist gewachsen!', text: 'Aus eurem Begleiter ist ein ' + WOLF_STAGES[i].name + ' geworden. Er wächst mit eurer Beständigkeit.', wolf: i });
    }
  }
  // Mehrere Level auf einmal: nur das höchste zeigen
  const levels = out.filter((e) => e.kind === 'level').sort((a, b) => Number(b.key.slice(3)) - Number(a.key.slice(3)));
  const top = levels[0];
  return out.filter((e) => e.kind !== 'level' || e === top).sort((a, b) => a.at - b.at || a.key.localeCompare(b.key));
}
