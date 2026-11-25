import { lessonsFor, lessonsOpen } from '../src/logic/lessons.ts';
import { storyOpen } from '../src/logic/story.ts';
// Prüfungen der Logik ohne App: `npm test`
import assert from 'node:assert/strict';
import { addDays, dayKey, weekday } from '../src/logic/date.ts';
import { currentStreak, longestStreak, successRate, toggleDone, isDue, activeDays } from '../src/logic/habits.ts';
import { totalXp, xpToday, levelInfo, wolfStage, xpForLevel } from '../src/logic/progress.ts';
import { splitCents, balances, parseEuro, formatEuro, fillLevel, DEFAULT_SPLIT, allocate, monthSummary, moneyXp, wishDue, newWaitUntil } from '../src/logic/money.ts';
import type { AppState, Habit, MoneyEntry } from '../src/logic/types.ts';
import { mergeState, hasContent } from '../src/logic/merge.ts';
import { updateFirsts, pendingEvents, keptWolf } from '../src/logic/trophies.ts';
import { ruleMet, unlockedOutfits, unlockedDecor, STORY_CHAPTERS, BACKSTORY } from '../src/logic/world.ts';
import { adviceFor, talesOpen, taleOfDay, TALES } from '../src/logic/mentor.ts';
import { refugeStage, seasonOf, sceneOf, isChristmasTime } from '../src/logic/refuge.ts';
import { buildSnapshot } from '../src/logic/share.ts';
import { ageStage, defaultShares } from '../src/logic/types.ts';
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
  assert.equal(wolfStage(a, d).index, 0); // seit 0.16.0 nach 30 Tagen noch ein Welpe
  for (let i = 30; i < 45; i++) d = toggleDone(d, 'a', addDays(T, -i));
  assert.equal(wolfStage(a, d).index, 1); // großer Welpe ab 45
  assert.equal(wolfStage(a, {}, 2).index, 2);
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
  assert.equal(fillLevel('save', e, 800), 2); // 25 % vom Ziel
  assert.equal(fillLevel('save', e, 200), 6);
  // Langsam füllen: 1–2 Taschengelder Stufe 1, 3–5 Stufe 2, 6–9 Stufe 3, ab 10 voll
  const n = (k: number): MoneyEntry[] => Array.from({ length: k }, (_, i) => ({ id: 'a' + i, kind: 'allowance' as const, cents: 500, day: T, note: '', parts: splitCents(500, DEFAULT_SPLIT), at: i }));
  assert.deepEqual([1, 2, 3, 4, 5, 7, 8, 10, 11, 15, 16].map((k) => fillLevel('spend', n(k), null)), [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6]);
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

const base = (): AppState => ({ version: 1, profileName: '', habits: [], done: {}, money: { split: { save: 50, spend: 40, share: 10 }, entries: [], goals: [], wishes: [] }, firsts: {}, journal: {}, goals: [], weeks: {}, premium: true, kidPreview: false, sMt: 0, deleted: {}, family: null, fMt: 0, inbox: [], lessons: {}, hero: 'lyra', outfits: { lyra: 'lyra-start', kael: 'kael-start' }, celebrated: {}, visits: {} });

ok('Abgleich: Vereinigung, neuere Fassung gewinnt', () => {
  const a = { ...base(), habits: [h('x', { name: 'alt', mt: 1 })], done: { 'x|2026-11-20': 5 } };
  const b = { ...base(), habits: [h('x', { name: 'neu', mt: 2 }), h('y', { mt: 1 })], done: { 'x|2026-11-21': 6 } };
  const m = mergeState(a, b);
  assert.deepEqual(m.habits.map((x) => x.name), ['neu', 'y']);
  assert.equal(Object.keys(m.done).length, 2);
});

ok('Abgleich: Löschen reist mit, Haken wegnehmen auch', () => {
  const a = { ...base(), habits: [h('x', { mt: 1 })], done: { 'x|2026-11-20': 5 } };
  const b = { ...base(), deleted: { 'h:x': 9, 'd:x|2026-11-20': 7 } };
  const m = mergeState(a, b);
  assert.equal(m.habits.length, 0);
  assert.equal(Object.keys(m.done).length, 0);
  // später wieder abgehakt → bleibt
  const c = mergeState({ ...base(), done: { 'x|2026-11-20': 8 } }, { ...base(), deleted: { 'd:x|2026-11-20': 7 } });
  assert.equal(c.done['x|2026-11-20'], 8);
});

ok('Abgleich: Tagebuch je Tag, Einstellungen, Trophäen, Geld', () => {
  const e1 = { day: T, mood: 3, win: 'a', hard: '', thanks: '', tomorrow: '', free: '', mt: 1 } as const;
  const e2 = { ...e1, win: 'b', mt: 2 };
  const a = { ...base(), profileName: 'Lena', sMt: 5, journal: { [T]: e1 }, firsts: { 't:x': 10 }, money: { ...base().money, entries: [{ id: 'm1', kind: 'share', cents: 50, day: T, note: '', at: 1 } as MoneyEntry] } };
  const b = { ...base(), profileName: 'Lenchen', sMt: 3, journal: { [T]: e2 }, firsts: { 't:x': 4 }, money: { ...base().money, entries: [{ id: 'm2', kind: 'share', cents: 20, day: T, note: '', at: 2 } as MoneyEntry] } };
  const m = mergeState(a, b);
  assert.equal(m.journal[T].win, 'b');
  assert.equal(m.profileName, 'Lena');
  assert.equal(m.firsts['t:x'], 4);
  assert.deepEqual(m.money.entries.map((e) => e.id), ['m1', 'm2']);
  assert.deepEqual(mergeState(m, m), m);
  assert.equal(hasContent(base()), false);
});

ok('Familie: Altersstufen, Voreinstellung, Freigabe ohne Tagebuch', () => {
  assert.equal(ageStage(2017, 2026), 'kind');
  assert.equal(ageStage(2012, 2026), 'jugend');
  assert.equal(ageStage(2010, 2026), 'erwachsen');
  assert.deepEqual(defaultShares('kind'), { habits: true, goals: true, money: true });
  assert.equal(defaultShares('jugend').money, false);
  const st = { ...base(), profileName: 'Lena', habits: [h('a', { start: '2026-11-01' })], done: { 'a|2026-11-22': 1 }, journal: { [T]: { day: T, mood: 5, win: 'GEHEIM', hard: '', thanks: '', tomorrow: '', free: '', mt: 1 } } };
  const snap = buildSnapshot(st, T, { habits: true, goals: false, money: false });
  assert.equal(snap.habits![0].days[13], 1);
  assert.equal(snap.goals, undefined);
  assert.equal(snap.money, undefined);
  assert.ok(!JSON.stringify(snap).includes('GEHEIM'));
});

ok('Sparziele der Reihe nach, Monatsübersicht, Geld-XP', () => {
  const g = (id: string, cents: number, createdAt: number, boughtAt: number | null = null) => ({ id, name: id, icon: 'x', cents, createdAt, reachedAt: null, boughtAt, mt: 0 });
  assert.deepEqual(allocate(700, [g('rad', 500, 1), g('buch', 400, 2), g('alt', 100, 0, 5)]), { rad: 500, buch: 200 });
  const e: MoneyEntry[] = [
    { id: '1', kind: 'allowance', cents: 500, day: '2026-11-01', note: '', parts: splitCents(500, DEFAULT_SPLIT), at: 1 },
    { id: '2', kind: 'allowance', cents: 500, day: '2026-11-01', note: '', parts: splitCents(500, DEFAULT_SPLIT), at: 2 },
    { id: '3', kind: 'spend', cents: 120, day: '2026-11-03', note: 'Eis', need: 'want', at: 3 },
    { id: '4', kind: 'share', cents: 50, day: '2026-11-04', note: '', at: 4 },
    { id: '5', kind: 'savebuy', cents: 300, day: '2026-11-05', note: 'Buch', goalId: 'b', at: 5 },
    { id: '6', kind: 'allowance', cents: 500, day: '2026-12-01', note: '', parts: splitCents(500, DEFAULT_SPLIT), at: 6 },
  ];
  const ms = monthSummary(e, '2026-11');
  assert.equal(ms.income, 1000); assert.equal(ms.spentWant, 120); assert.equal(ms.shared, 50); assert.equal(ms.goalsBought, 300);
  assert.equal(balances(e).save, 750 - 300);
  // XP: 2 Tage Taschengeld (5), 1 Tag Teilen (10) – nie nach Betrag
  assert.equal(moneyXp({ money: { split: DEFAULT_SPLIT, entries: e, goals: [], wishes: [] } }), 2 * 5 + 10);
  const w = { id: 'w', name: 'x', cents: 1, addedAt: 0, waitUntil: newWaitUntil('2026-11-22'), answer: null, answeredAt: null, mt: 0 };
  assert.equal(w.waitUntil, '2026-11-29'); assert.equal(wishDue(w, '2026-11-28'), false); assert.equal(wishDue(w, '2026-11-29'), true);
});

ok('Phase 4: Level/Wolf als Ereignisse, nur höchstes Level, Bestandsschutz, Kleidung freischalten', () => {
  let st = { ...base(), habits: [h('a', { start: '2025-01-01' })] } as AppState;
  let d = {};
  for (let i = 0; i < 46; i++) d = toggleDone(d, 'a', addDays(T, -i));
  st = { ...st, done: d };
  const f = updateFirsts(st, 1000, T)!;
  assert.ok(f['t:first-step'] && f['t:days-30'] && f['wolf:1'] && f['lv:2']);
  st = { ...st, firsts: f };
  const ev = pendingEvents(st);
  assert.equal(ev.filter((e) => e.kind === 'level').length, 1);
  assert.ok(ev.some((e) => e.kind === 'wolf' && e.wolf === 1));
  // Haken weg: der Wolf bleibt (Bestandsschutz über firsts)
  assert.equal(keptWolf({ ...st, done: {} }), 1);
  assert.equal(ruleMet(st, { kind: 'days', n: 30 }, T), true);
  assert.ok(unlockedOutfits(st, T).has('lyra-winter'));
  assert.ok(!unlockedOutfits(st, T).has('lyra-starnight'));
});

ok('Phase 5: Jahreszeiten, Kranz nur in der Weihnachtszeit, Ausbaustufen mit Bestandsschutz', () => {
  assert.equal(seasonOf('2026-03-01'), 'spring'); assert.equal(seasonOf('2026-05-31'), 'spring');
  assert.equal(seasonOf('2026-06-01'), 'summer'); assert.equal(seasonOf('2026-11-30'), 'autumn');
  assert.equal(seasonOf('2027-02-28'), 'winter');
  assert.equal(sceneOf('2026-11-30'), 'autumn'); assert.equal(sceneOf('2026-12-01'), 'xmas');
  assert.equal(sceneOf('2027-01-06'), 'xmas'); assert.equal(sceneOf('2027-01-07'), 'winter');
  assert.equal(isChristmasTime('2027-02-14'), false);
  let st = { ...base(), habits: [h('a', { start: '2025-01-01' })] } as AppState;
  assert.equal(refugeStage(st).n, 1);
  let d = {};
  for (let i = 0; i < 21; i++) d = toggleDone(d, 'a', addDays(T, -i));
  st = { ...st, done: d };
  const r = refugeStage(st);
  assert.equal(r.n, 2); assert.equal(r.toNext, 69);
  const f = updateFirsts(st, 1000, T)!;
  assert.ok(f['ref:2'] && !f['ref:3']);
  st = { ...st, firsts: f };
  assert.ok(pendingEvents(st).some((e) => e.kind === 'refuge' && e.refuge === 2));
  // Haken weg: das Haus bleibt
  assert.equal(refugeStage({ ...st, done: {} }).n, 2);
  assert.ok(unlockedDecor(st, T).has('windowbench'));
  assert.ok(!unlockedDecor(st, T).has('wisteria'));
  assert.equal(ruleMet(st, { kind: 'refuge', n: 2 }, T), true);
  assert.equal(ruleMet(st, { kind: 'days', n: 250 }, T), false);
});

ok('Hexenhaus: eine Geschichte je Besuchstag, Rat passt zur Lage, Besuche werden zusammengeführt', () => {
  let st = { ...base(), visits: {} } as AppState;
  assert.equal(adviceFor(st, T).title, 'Fang klein an');
  st = { ...st, habits: [h('a')] };
  st = { ...st, done: toggleDone({}, 'a', T) };
  assert.equal(adviceFor(st, T).title, 'Heute alles geschafft!');
  st = { ...st, done: toggleDone({}, 'a', addDays(T, -4)) };
  assert.equal(adviceFor(st, T).title, 'Schön, dass du wieder da bist');
  // gleicher Tag = gleicher Rat
  assert.deepEqual(adviceFor(st, T), adviceFor(st, T));
  st = { ...st, visits: { [addDays(T, -2)]: 1, [T]: 2 } };
  assert.equal(talesOpen(st), 2); assert.equal(taleOfDay(st, T), 1); assert.equal(taleOfDay(st, addDays(T, -1)), null);
  const many: Record<string, number> = {};
  for (let i = 0; i < 20; i++) many[addDays(T, -i)] = i;
  assert.equal(talesOpen({ ...st, visits: many }), TALES.length);
  assert.equal(taleOfDay({ ...st, visits: many }, T), null); // nach Geschichte 12 kommt keine neue mehr
  const m = mergeState({ ...st, visits: { [T]: 5 } }, { ...st, visits: { [T]: 3, [addDays(T, -9)]: 1 } });
  assert.deepEqual(m.visits, { [T]: 3, [addDays(T, -9)]: 1 });
});

console.log(n + ' Prüfungen bestanden');

ok('Geld-Lektionen: alle zwei Tage eine neue, gelesene bleiben offen', () => {
  const list = lessonsFor('kind');
  const day = (ts: number) => (ts < 100 ? '2026-11-21' : ts < 1000 ? '2026-11-22' : '2026-11-23');
  let r = lessonsOpen(list, {}, '2026-11-23', day);
  assert.equal(r.open.size, 1); assert.equal(r.waitDays, 0);
  r = lessonsOpen(list, { [list[0].id]: 2000 }, '2026-11-23', day);
  assert.equal(r.open.size, 1); assert.equal(r.readToday, true); assert.equal(r.waitDays, 2);
  r = lessonsOpen(list, { [list[0].id]: 500 }, '2026-11-23', day);
  assert.equal(r.open.size, 1); assert.equal(r.waitDays, 1);
  r = lessonsOpen(list, { [list[0].id]: 50 }, '2026-11-23', day);
  assert.equal(r.open.size, 2); assert.ok(r.open.has(list[1].id));
});

ok('Geschichte: ein neues Kapitel je Tag, kein Rückblick mehr', () => {
  const day = (ts: number) => dayKey(new Date(ts));
  const st = { ...base(), story: {} } as AppState;
  let r = storyOpen(st, '2026-11-20', day);
  assert.equal(r.next?.id, 's1-1');
  st.story = { 's1-1': new Date(2026, 10, 20, 9).getTime() };
  r = storyOpen(st, '2026-11-20', day);
  assert.equal(r.next, null); assert.equal(r.readToday, true);
  r = storyOpen(st, '2026-11-21', day);
  assert.equal(r.next?.id, 's2-1');
  assert.equal(BACKSTORY.length, 0);
  assert.ok(STORY_CHAPTERS.length >= 5 && STORY_CHAPTERS.every((c) => c.parts.length === 1));
  assert.equal(ruleMet(st, STORY_CHAPTERS[0].rule, '2026-11-20'), true);
});
