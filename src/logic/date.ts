// Kalendertage als 'JJJJ-MM-TT' in der Zeitzone des Geräts.
// Bewusst ohne Uhrzeit: ein Haken gehört zu einem Tag, egal wann er gesetzt wurde.

export type DayKey = string;

function pad(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

export function dayKey(d: Date = new Date()): DayKey {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

/** Tag aus einem Schlüssel, 12 Uhr mittags (sicher gegen Sommerzeit-Sprünge). */
export function fromKey(k: DayKey): Date {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function addDays(k: DayKey, n: number): DayKey {
  const d = fromKey(k);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

/** 0 = Sonntag … 6 = Samstag */
export function weekday(k: DayKey): number {
  return fromKey(k).getDay();
}

export function daysBetween(a: DayKey, b: DayKey): number {
  return Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86400000);
}

const WD_DE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MO_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
export const WD_SHORT_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export function longDateDe(k: DayKey): string {
  const d = fromKey(k);
  return WD_DE[d.getDay()] + ', ' + d.getDate() + '. ' + MO_DE[d.getMonth()];
}

export function shortDateDe(k: DayKey): string {
  const d = fromKey(k);
  return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear();
}
