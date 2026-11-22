// Taschengeld nach der 3-Gläser-Methode. Alle Beträge in Cent (ganze Zahlen).
// Kein echtes Geld, nie mit Spielwährung vermischt.

import { addDays, daysBetween, type DayKey } from './date.ts';
import type { AppState, Jar, MoneyEntry, SavingsGoal, Split, Wish } from './types.ts';

export const JARS: Jar[] = ['save', 'spend', 'share'];
export const DEFAULT_SPLIT: Split = { save: 50, spend: 40, share: 10 };

/** Teilt einen Betrag nach Prozent auf. Übrige Cent gehen ins Sparglas. */
export function splitCents(cents: number, s: Split): Record<Jar, number> {
  const spend = Math.floor((cents * s.spend) / 100);
  const share = Math.floor((cents * s.share) / 100);
  return { save: cents - spend - share, spend, share };
}

export function balances(entries: MoneyEntry[]): Record<Jar, number> {
  const b: Record<Jar, number> = { save: 0, spend: 0, share: 0 };
  for (const e of entries) {
    if (e.kind === 'allowance') for (const j of JARS) b[j] += e.parts[j];
    else if (e.kind === 'spend') b.spend -= e.cents;
    else if (e.kind === 'share') b.share -= e.cents;
    else if (e.kind === 'move') {
      b[e.from] -= e.cents;
      b[e.to] += e.cents;
    } else if (e.kind === 'savebuy') b.save -= e.cents;
  }
  return b;
}

/**
 * Füllstand 0, 1, 2, 3, 4 (leer, ¼, ½, ¾, voll).
 * Sparglas: gemessen am Sparziel. Die anderen: am Anteil der letzten vier Taschengelder –
 * so sieht ein Glas bei 2 € genauso voll aus wie bei 20 €.
 */
export function fillLevel(jar: Jar, entries: MoneyEntry[], goalCents: number | null): number {
  const bal = balances(entries)[jar];
  if (bal <= 0) return 0;
  let ref: number;
  if (jar === 'save' && goalCents && goalCents > 0) ref = goalCents;
  else {
    const last = entries.filter((e) => e.kind === 'allowance').slice(-4);
    ref = last.reduce((s, e) => s + (e.kind === 'allowance' ? e.parts[jar] : 0), 0);
    if (ref <= 0) ref = bal;
  }
  return Math.max(1, Math.min(4, Math.round((bal / ref) * 4)));
}

/** „2,50“, „2.5“, „3“ → Cent. Ungültig → null. */
export function parseEuro(text: string): number | null {
  const t = text.trim().replace(/\s|€/g, '').replace(',', '.');
  if (!/^\d{1,5}(\.\d{0,2})?$/.test(t)) return null;
  const c = Math.round(parseFloat(t) * 100);
  return c > 0 ? c : null;
}

export function formatEuro(cents: number): string {
  const neg = cents < 0;
  const a = Math.abs(cents);
  return (neg ? '−' : '') + Math.floor(a / 100) + ',' + String(a % 100).padStart(2, '0') + ' €';
}

export function isValidSplit(s: Split): boolean {
  return s.save + s.spend + s.share === 100 && JARS.every((j) => s[j] >= 0);
}

/** Offene Sparziele (noch nicht gekauft), in der Reihenfolge, in der sie angelegt wurden. */
export function openGoals(goals: SavingsGoal[]): SavingsGoal[] {
  return goals.filter((g) => !g.boughtAt).sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Das Sparglas füllt die Sparziele der Reihe nach: erst das älteste, dann das nächste.
 * So versteht es auch ein Kind: „Erst das Fahrrad, dann das Buch.“
 */
export function allocate(saveCents: number, goals: SavingsGoal[]): Record<string, number> {
  const out: Record<string, number> = {};
  let rest = Math.max(0, saveCents);
  for (const g of openGoals(goals)) {
    const take = Math.min(rest, g.cents);
    out[g.id] = take;
    rest -= take;
  }
  return out;
}

export const WAIT_DAYS = 7;

export function wishDue(w: Wish, today: DayKey): boolean {
  return !w.answer && w.waitUntil <= today;
}

export function wishDaysLeft(w: Wish, today: DayKey): number {
  return Math.max(0, daysBetween(today, w.waitUntil));
}

export function newWaitUntil(today: DayKey): DayKey {
  return addDays(today, WAIT_DAYS);
}

export interface MonthSummary {
  income: number;
  spent: number;
  spentWant: number;
  spentNeed: number;
  shared: number;
  goalsBought: number;
  count: number;
}

/** Monatsübersicht aus den Buchungen ('JJJJ-MM'). */
export function monthSummary(entries: MoneyEntry[], month: string): MonthSummary {
  const m: MonthSummary = { income: 0, spent: 0, spentWant: 0, spentNeed: 0, shared: 0, goalsBought: 0, count: 0 };
  for (const e of entries) {
    if (!e.day.startsWith(month)) continue;
    m.count++;
    if (e.kind === 'allowance') m.income += e.cents;
    else if (e.kind === 'spend') {
      m.spent += e.cents;
      if (e.need === 'want') m.spentWant += e.cents;
      if (e.need === 'need') m.spentNeed += e.cents;
    } else if (e.kind === 'share') m.shared += e.cents;
    else if (e.kind === 'savebuy') m.goalsBought += e.cents;
  }
  return m;
}

/**
 * XP für gutes Verhalten mit Geld – nie nach der Höhe des Betrags (Master-Prompt Abschnitt 20):
 * Eintragen 5 XP (höchstens einmal am Tag), Teilen 10 XP (einmal am Tag), Sparziel erreicht 50 XP, eine Woche gewartet 15 XP.
 */
export function moneyXp(s: Pick<AppState, 'money'>): number {
  const allowDays = new Set(s.money.entries.filter((e) => e.kind === 'allowance').map((e) => e.day));
  const shareDays = new Set(s.money.entries.filter((e) => e.kind === 'share').map((e) => e.day));
  const reached = s.money.goals.filter((g) => g.reachedAt).length;
  const waited = s.money.wishes.filter((w) => w.answer && w.answeredAt && w.answeredAt >= Date.parse(w.waitUntil)).length;
  return allowDays.size * 5 + shareDays.size * 10 + reached * 50 + waited * 15;
}
