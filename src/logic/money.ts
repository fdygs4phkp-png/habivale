// Taschengeld nach der 3-Gläser-Methode. Alle Beträge in Cent (ganze Zahlen).
// Kein echtes Geld, nie mit Spielwährung vermischt.

import type { Jar, MoneyEntry, Split } from './types.ts';

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
    }
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
