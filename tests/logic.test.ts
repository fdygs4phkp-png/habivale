// Prüfungen der Logik ohne App: `npm test`
import assert from 'node:assert/strict';
import { addDays, dayKey, weekday } from '../src/logic/date.ts';
import { currentStreak, longestStreak, successRate, toggleDone, isDue, activeDays } from '../src/logic/habits.ts';
import { totalXp, xpToday, levelInfo, wolfStage, xpForLevel } from '../src/logic/progress.ts';
import { splitCents, balances, parseEuro, formatEuro, fillLevel, DEFAULT_SPLIT } from '../src/logic/money.ts';
import type { AppState, Habit, MoneyEntry } from '../src/logic/types.ts';
import { weekStart, weekSummary, goalProgress, looksLikeBackup, entryHasContent, emptyEntry } from '../src/logic/journal.ts';

let n = 0;
const ok = (name: string, f: () => void) => { f(); n++; console.log('✓', name); };

const T = '2026-11-22'; // Sonntag
const h = (id: string, extra: Partial<Habit> = {}): Habit => ({ id, name: id, icon: 'star', rhythm: { kind: 'daily' }, start: '2026-11-01', paused: false, archived: false, createdAt: 0, mt: 0, ...extra });

ok('Datum: Monatswechsel und Sommerzeit', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-03-28', 2), '2026-03-30'); // Zeitumstellung 29.3.
  assert.equal(addDays('2026-10-24', 2), '2026-10-26');
  assert.equal(weekday(T), 0);
  assert.equal(dayKey(new Date(2026, 0, 5)), '2026-01-05');
});

ok('Abhaken und Rückgängig: nie doppelt', () => {
  let d = toggleDone({}, 'a', T);
  d = toggleDone(d, 'a', T);
  assert.deepEqual(d, {});
  d = toggleDone(toggleDone({}, 'a', T), 'a', T);
  assert.equal(Object.keys(d).length, 0);
});

ok('Streak: heute offen bricht nicht, gestern offen bricht', () => {
  const a = h('a');
  let d = {};
  for (let i = 1; i <= 3; i++) d = toggleDone(d, 'a', addDays(T, -i));
  assert.equal(currentStreak(a, d, T), 3);
  d = toggleDone(d, 'a', T);
  assert.equal(currentStreak(a, d, T), 4);
  d = toggleDone(d, 'a', addDays(T, -2));
  assert.equal(currentStreak(a, d, T), 2);
  assert.equal(longestStreak(a, d, T), 2);
});

ok('Wochentage: nicht fällige Tage brechen keine Streak', () => {
  const a = h('a', { rhythm: { kind: 'weekdays', days: [1, 3, 5] } }); // Mo Mi Fr
  assert.equal(isDue(a, T), false);
  let d = {};
  for (const k of ['2026-11-16', '2026-11-18', '2026-11-20']) d = toggleDone(d, 'a', k);
  assert.equal(currentStreak(a, d, T), 3);
  assert.ok(Math.abs((successRate(a, d, T) ?? 0) - 3 / 9) < 1e-9); // 9 fällige Tage seit 1.11.
});

ok('XP: höchstens 5 Haken am Tag, Tagesbonus fair', () => {
  const one = [h('a')];
  assert.equal(xpToday(one, toggleDone({}, 'a', T), T), 30); // 10 + Bonus 20
  const eight = 'abcdefgh'.split('').map((x) => h(x));
  let d = {};
  for (const x of 'abcdefgh') d = toggleDone(d, x, T);
  assert.equal(xpToday(eight, d, T), 70); // 5 × 10 + 20
  assert.equal(totalXp(eight, d), 70);
});

ok('Level-Kurve', () => {
  assert.equal(xpForLevel(2), 300);
  assert.equal(xpForLevel(10), 5500);
  assert.equal(levelInfo(0).level, 1);
  assert.equal(levelInfo(299).level, 1);
  assert.equal(levelInfo(300).level, 2);
});

ok('Wolf: aktive Tage, nie zurück', () => {
  const a = [h('a', { start: '2025-01-01' })];
  let d = {};
  for (let i = 0; i < 30; i++) d = toggleDone(d, 'a', addDays(T, -i));
  assert.equal(activeDays(a, d).length, 30);
  assert.equal(wolfStage(a, d).index, 1);
  assert.equal(wolfStage(a, {}, 1).index, 1);
});

ok('Taschengeld: Aufteilung, Rest ins Sparglas', () => {
  assert.deepEqual(splitCents(500, DEFAULT_SPLIT), { save: 250, spend: 200, share: 50 });
  assert.deepEqual(splitCents(333, DEFAULT_SPLIT), { save: 167, spend: 133, share: 33 });
  const e: MoneyEntry[] = [
    { id: '1', kind: 'allowance', cents: 500, day: T, note: '', parts: splitCents(500, DEFAULT_SPLIT), at: 1 },
    { id: '2', kind: 'spend', cents: 120, day: T, note: 'Eis', need: 'want', at: 2 },
    { id: '3', kind: 'move', cents: 50, day: T, note: '', from: 'save', to: 'share', at: 3 },
  ];
  assert.deepEqual(balances(e), { save: 200, spend: 80, share: 100 });
  assert.equal(fillLevel('save', e, 800), 1);
  assert.equal(fillLevel('save', e, 200), 4);
});

ok('Euro lesen und schreiben', () => {
  assert.equal(parseEuro('2,50'), 250);
  assert.equal(parseEuro('3'), 300);
  assert.equal(parseEuro('0'), null);
  assert.equal(parseEuro('abc'), null);
  assert.equal(formatEuro(205), '2,05 €');
});

ok('Woche beginnt am Montag', () => {
  assert.equal(weekStart('2026-11-22'), '2026-11-16'); // Sonntag → Montag davor
  assert.equal(weekStart('2026-11-16'), '2026-11-16');
  assert.equal(weekStart('2026-11-18'), '2026-11-16');
});

ok('Wochenrückblick zählt nur bis heute', () => {
  const s = { habits: [h('a')], done: toggleDone(toggleDone({}, 'a', '2026-11-16'), 'a', '2026-11-17'), journal: { '2026-11-17': { ...emptyEntry('2026-11-17'), mood: 4 } }, goals: [] } as unknown as AppState;
  const w = weekSummary(s, '2026-11-16', '2026-11-18');
  assert.equal(w.due, 3);
  assert.equal(w.done, 2);
  assert.equal(w.activeDays, 2);
  assert.equal(w.moodAvg, 4);
  assert.equal(w.journalDays, 1);
});

ok('Tagebuch leer/gefüllt, Ziel-Fortschritt, Backup erkennen', () => {
  assert.equal(entryHasContent(emptyEntry(T)), false);
  assert.equal(entryHasContent({ ...emptyEntry(T), win: ' ' }), false);
  assert.equal(entryHasContent({ ...emptyEntry(T), thanks: 'Oma' }), true);
  const g = { id: 'g', title: 'x', area: 'school', why: '', steps: [{ id: '1', text: 'a', done: true }, { id: '2', text: 'b', done: false }], due: null, reachedAt: null, createdAt: 0, mt: 0 } as const;
  assert.equal(goalProgress({ ...g, steps: [...g.steps] }), 0.5);
  assert.equal(looksLikeBackup({ app: 'habivale', state: { habits: [], done: {} } }), true);
  assert.equal(looksLikeBackup({ app: 'ewolfe', state: { habits: [], done: {} } }), false);
});

console.log(n + ' Prüfungen bestanden');
