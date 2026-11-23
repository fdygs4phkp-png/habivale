// Der ganze App-Stand liegt in einem Objekt und wird nach jeder Änderung auf dem Gerät gespeichert
// (iPhone/Android: AsyncStorage, im Browser: localStorage). Cloud-Abgleich kommt in Phase 3.

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { dayKey } from '../logic/date.ts';
import { toggleDone } from '../logic/habits.ts';
import { DEFAULT_SPLIT, allocate, balances, newWaitUntil, splitCents } from '../logic/money.ts';
import { updateFirsts } from '../logic/trophies.ts';
import { emptyEntry, looksLikeBackup } from '../logic/journal.ts';
import { habitLimit } from '../logic/types.ts';
import type { AppState, DiaryInfo, Goal, Habit, Jar, JournalEntry, MoneyEntry, Split } from '../logic/types.ts';

const KEY = 'habivale_state_v1';

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export { normalize };

/** Früher gab es nur ein Sparziel (`money.goal`) – es wird zum ersten Eintrag der Liste. */
function migrateMoney(m: AppState['money'] & { goal?: { name: string; icon: string; cents: number; reachedAt: number | null } | null }): AppState['money'] {
  const { goal, ...rest } = m;
  const goals = rest.goals || [];
  if (goal && !goals.length) goals.push({ id: 'sg-alt', name: goal.name, icon: goal.icon || 'piggy-bank', cents: goal.cents, createdAt: 0, reachedAt: goal.reachedAt, boughtAt: null, mt: 1 });
  return { split: rest.split, entries: rest.entries || [], goals, wishes: rest.wishes || [] };
}

export function emptyState(): AppState {
  return { version: 1, profileName: '', habits: [], done: {}, money: { split: { ...DEFAULT_SPLIT }, entries: [], goals: [], wishes: [] }, firsts: {}, journal: {}, goals: [], weeks: {}, premium: false, kidPreview: false, sMt: 0, deleted: {}, family: null, fMt: 0, inbox: [], lessons: {}, hero: 'lyra', outfits: { lyra: 'lyra-start', kael: 'kael-start' }, celebrated: {}, visits: {} };
}

function normalize(raw: unknown): AppState {
  const s = emptyState();
  if (!raw || typeof raw !== 'object') return s;
  const r = raw as Partial<AppState>;
  return {
    ...s,
    ...r,
    money: migrateMoney({ ...s.money, ...(r.money || {}) }),
    done: r.done || {},
    habits: r.habits || [],
    firsts: r.firsts || {},
    journal: r.journal || {},
    goals: r.goals || [],
    weeks: r.weeks || {},
    premium: r.premium ?? true,
    kidPreview: r.kidPreview ?? false,
    diary: r.diary ?? null,
    sMt: r.sMt ?? 0,
    deleted: r.deleted || {},
    family: r.family ?? null,
    fMt: r.fMt ?? 0,
    inbox: r.inbox || [],
    lessons: r.lessons || {},
    hero: r.hero === 'kael' ? 'kael' : 'lyra',
    outfits: { lyra: r.outfits?.lyra || 'lyra-start', kael: r.outfits?.kael || 'kael-start' },
    // Beim ersten Start mit dieser Version: alles schon Erreichte gilt als verkündet (keine Flut von Meldungen)
    celebrated: r.celebrated || { ...(r.firsts || {}) },
    visits: r.visits || {},
  } as AppState;
}

type Store = {
  ready: boolean;
  state: AppState;
  today: string;
  setName: (n: string) => void;
  saveHabit: (h: Omit<Habit, 'id' | 'createdAt' | 'mt'> & { id?: string }) => void;
  deleteHabit: (id: string) => void;
  toggle: (habitId: string, day: string) => void;
  addAllowance: (cents: number, note: string) => void;
  addSpend: (cents: number, note: string, need: 'want' | 'need' | null) => boolean;
  addShare: (cents: number, note: string) => boolean;
  move: (cents: number, from: Jar, to: Jar, note: string) => boolean;
  deleteEntry: (id: string) => void;
  setSplit: (s: Split) => void;
  saveSavingsGoal: (g: { id?: string; name: string; icon: string; cents: number }) => void;
  deleteSavingsGoal: (id: string) => void;
  buySavingsGoal: (id: string) => boolean;
  addWish: (name: string, cents: number) => void;
  answerWish: (id: string, answer: 'buy' | 'goal' | 'no') => void;
  markLesson: (id: string) => void;
  setHero: (h: 'lyra' | 'kael') => void;
  wearOutfit: (hero: 'lyra' | 'kael', id: string) => void;
  celebrate: (key: string) => void;
  visit: (day: string) => void;
  resetAll: () => void;
  setEntry: (day: string, patch: Partial<Omit<JournalEntry, 'day' | 'mt'>>) => void;
  saveGoal: (g: Omit<Goal, 'id' | 'createdAt' | 'mt' | 'reachedAt'> & { id?: string }) => void;
  toggleStep: (goalId: string, stepId: string) => void;
  setGoalReached: (goalId: string, reached: boolean) => void;
  deleteGoal: (goalId: string) => void;
  setWeekNote: (monday: string, proud: string) => void;
  setPremium: (on: boolean) => void;
  setKidPreview: (on: boolean) => void;
  setDiary: (d: DiaryInfo | null) => void;
  exportJson: () => string;
  importJson: (json: string) => boolean;
  /** Abgleich: zusammengeführten Stand übernehmen (ohne Änderungsstempel zu setzen) */
  applyMerged: (s: AppState) => void;
  setFamily: (f: AppState['family']) => void;
  inboxDone: (id: string) => void;
  acceptSuggestion: (id: string) => boolean;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState(dayKey());
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((j) => {
        if (!j) return;
        // Beim Öffnen nachtragen, was schon erreicht ist (z. B. eine neue Refugium-Stufe nach einem Update)
        const st = normalize(JSON.parse(j));
        const f = updateFirsts(st);
        setState(f ? { ...st, firsts: f } : st);
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
    // Tageswechsel bemerken (App bleibt über Mitternacht offen)
    const t = setInterval(() => setToday(dayKey()), 30000);
    return () => clearInterval(t);
  }, []);

  /** Jede Änderung: Trophäen-Erstmalig nachtragen, Sparziel prüfen, speichern. */
  const update = useCallback((f: (s: AppState) => AppState) => {
    setState((prev) => {
      let next = f(prev);
      // Sparziele, die das Sparglas jetzt füllt, als erreicht markieren (bleibt erreicht – Bestandsschutz)
      const alloc = allocate(balances(next.money.entries).save, next.money.goals);
      if (next.money.goals.some((g) => !g.reachedAt && !g.boughtAt && (alloc[g.id] ?? 0) >= g.cents)) {
        const now = Date.now();
        next = { ...next, money: { ...next.money, goals: next.money.goals.map((g) => (!g.reachedAt && !g.boughtAt && (alloc[g.id] ?? 0) >= g.cents ? { ...g, reachedAt: now, mt: now } : g)) } };
      }
      const firsts = updateFirsts(next);
      if (firsts) next = { ...next, firsts };
      if (loaded.current) AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const store = useMemo<Store>(() => {
    const money = (fn: (m: AppState['money']) => AppState['money']) => update((s) => ({ ...s, money: fn(s.money) }));
    const entry = (e: MoneyEntry) => money((m) => ({ ...m, entries: [...m.entries, e] }));
    const base = () => ({ id: newId(), day: dayKey(), at: Date.now() });
    return {
      ready,
      state,
      today,
      setName: (n) => update((s) => ({ ...s, profileName: n.trim().slice(0, 30), sMt: Date.now() })),
      saveHabit: (h) =>
        update((s) => {
          const now = Date.now();
          if (h.id) return { ...s, habits: s.habits.map((x) => (x.id === h.id ? { ...x, ...h, id: x.id, mt: now } : x)) };
          return { ...s, habits: [...s.habits, { ...h, id: newId(), createdAt: now, mt: now }] };
        }),
      deleteHabit: (id) =>
        update((s) => {
          const done = { ...s.done };
          for (const k of Object.keys(done)) if (k.startsWith(id + '|')) delete done[k];
          return { ...s, habits: s.habits.filter((h) => h.id !== id), done, deleted: { ...s.deleted, ['h:' + id]: Date.now() } };
        }),
      toggle: (habitId, day) =>
        update((s) => {
          const now = Date.now();
          const key = habitId + '|' + day;
          const removing = s.done[key] !== undefined;
          return { ...s, done: toggleDone(s.done, habitId, day, now), deleted: removing ? { ...s.deleted, ['d:' + key]: now } : s.deleted };
        }),
      addAllowance: (cents, note) => entry({ ...base(), kind: 'allowance', cents, note, parts: splitCents(cents, state.money.split) }),
      addSpend: (cents, note, need) => {
        if (balances(state.money.entries).spend < cents) return false;
        entry({ ...base(), kind: 'spend', cents, note, need });
        return true;
      },
      addShare: (cents, note) => {
        if (balances(state.money.entries).share < cents) return false;
        entry({ ...base(), kind: 'share', cents, note });
        return true;
      },
      move: (cents, from, to, note) => {
        if (from === to || balances(state.money.entries)[from] < cents) return false;
        entry({ ...base(), kind: 'move', cents, from, to, note });
        return true;
      },
      deleteEntry: (id) => update((s) => ({ ...s, money: { ...s.money, entries: s.money.entries.filter((e) => e.id !== id) }, deleted: { ...s.deleted, ['m:' + id]: Date.now() } })),
      setSplit: (sp) => update((s) => ({ ...s, money: { ...s.money, split: sp }, sMt: Date.now() })),
      saveSavingsGoal: (g) =>
        update((s) => {
          const now = Date.now();
          const goals = g.id
            ? s.money.goals.map((x) => (x.id === g.id ? { ...x, name: g.name, icon: g.icon, cents: g.cents, reachedAt: g.cents > x.cents ? null : x.reachedAt, mt: now } : x))
            : [...s.money.goals, { id: newId(), name: g.name, icon: g.icon, cents: g.cents, createdAt: now, reachedAt: null, boughtAt: null, mt: now }];
          return { ...s, money: { ...s.money, goals } };
        }),
      deleteSavingsGoal: (id) => update((s) => ({ ...s, money: { ...s.money, goals: s.money.goals.filter((g) => g.id !== id) }, deleted: { ...s.deleted, ['sg:' + id]: Date.now() } })),
      buySavingsGoal: (id) => {
        const g = state.money.goals.find((x) => x.id === id);
        if (!g || g.boughtAt || balances(state.money.entries).save < g.cents) return false;
        const now = Date.now();
        update((s) => ({
          ...s,
          money: {
            ...s.money,
            entries: [...s.money.entries, { id: newId(), kind: 'savebuy', cents: g.cents, day: dayKey(), note: g.name, goalId: g.id, at: now }],
            goals: s.money.goals.map((x) => (x.id === id ? { ...x, boughtAt: now, reachedAt: x.reachedAt ?? now, mt: now } : x)),
          },
        }));
        return true;
      },
      addWish: (name, cents) => {
        const now = Date.now();
        update((s) => ({ ...s, money: { ...s.money, wishes: [...s.money.wishes, { id: newId(), name: name.slice(0, 40), cents, addedAt: now, waitUntil: newWaitUntil(dayKey()), answer: null, answeredAt: null, mt: now }] } }));
      },
      answerWish: (id, answer) => {
        const now = Date.now();
        update((s) => ({ ...s, money: { ...s.money, wishes: s.money.wishes.map((w) => (w.id === id ? { ...w, answer, answeredAt: now, mt: now } : w)) } }));
      },
      setHero: (h) => update((s) => ({ ...s, hero: h, sMt: Date.now() })),
      wearOutfit: (hero, id) => update((s) => ({ ...s, outfits: { ...s.outfits, [hero]: id }, sMt: Date.now() })),
      celebrate: (key) =>
        update((s) => {
          const now = Date.now();
          const c = { ...s.celebrated, [key]: now };
          // Level: alle kleineren gleich mit
          if (key.startsWith('lv:')) for (const k of Object.keys(s.firsts)) if (k.startsWith('lv:') && Number(k.slice(3)) <= Number(key.slice(3))) c[k] = c[k] ?? now;
          return { ...s, celebrated: c };
        }),
      visit: (day) => {
        if (state.visits[day] !== undefined) return;
        update((s) => (s.visits[day] !== undefined ? s : { ...s, visits: { ...s.visits, [day]: Date.now() } }));
      },
      markLesson: (id) => update((s) => ({ ...s, lessons: { ...s.lessons, [id]: s.lessons[id] ?? Date.now() } })),
      resetAll: () => update(() => emptyState()),
      setEntry: (day, patch) =>
        update((s) => ({ ...s, journal: { ...s.journal, [day]: { ...(s.journal[day] || emptyEntry(day)), ...patch, day, mt: Date.now() } } })),
      saveGoal: (g) =>
        update((s) => {
          const now = Date.now();
          if (g.id) return { ...s, goals: s.goals.map((x) => (x.id === g.id ? { ...x, ...g, id: x.id, mt: now } : x)) };
          return { ...s, goals: [...s.goals, { ...g, id: newId(), createdAt: now, mt: now, reachedAt: null }] };
        }),
      toggleStep: (goalId, stepId) =>
        update((s) => ({
          ...s,
          goals: s.goals.map((g) => (g.id !== goalId ? g : { ...g, mt: Date.now(), steps: g.steps.map((x) => (x.id === stepId ? { ...x, done: !x.done } : x)) })),
        })),
      setGoalReached: (goalId, reached) =>
        update((s) => ({ ...s, goals: s.goals.map((g) => (g.id === goalId ? { ...g, reachedAt: reached ? Date.now() : null, mt: Date.now() } : g)) })),
      deleteGoal: (goalId) => update((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== goalId), deleted: { ...s.deleted, ['g:' + goalId]: Date.now() } })),
      setWeekNote: (monday, proud) => update((s) => ({ ...s, weeks: { ...s.weeks, [monday]: { proud, mt: Date.now() } } })),
      setPremium: (on) => update((s) => ({ ...s, premium: on, sMt: Date.now() })),
      setKidPreview: (on) => update((s) => ({ ...s, kidPreview: on, sMt: Date.now() })),
      setDiary: (d) => update((s) => ({ ...s, diary: d, sMt: Date.now() })),
      applyMerged: (next) => update(() => next),
      setFamily: (f) => update((s) => ({ ...s, family: f, fMt: Date.now() })),
      inboxDone: (id) => update((s) => ({ ...s, inbox: s.inbox.filter((x) => x.id !== id), deleted: { ...s.deleted, ['i:' + id]: Date.now() } })),
      acceptSuggestion: (id) => {
        const it = state.inbox.find((x) => x.id === id);
        if (!it?.habit) return false;
        if (state.habits.filter((h) => !h.archived && !h.paused).length >= habitLimit(state.premium)) return false;
        const now = Date.now();
        const days = it.habit.days.length ? it.habit.days : [0, 1, 2, 3, 4, 5, 6];
        update((s) => ({
          ...s,
          habits: [...s.habits, { id: newId(), name: it.habit!.name, icon: it.habit!.icon, rhythm: days.length === 7 ? { kind: 'daily' } : { kind: 'weekdays', days }, start: dayKey(), paused: false, archived: false, createdAt: now, mt: now }],
          inbox: s.inbox.filter((x) => x.id !== id),
          deleted: { ...s.deleted, ['i:' + id]: now },
        }));
        return true;
      },
      exportJson: () => JSON.stringify({ app: 'habivale', version: 1, exportedAt: new Date().toISOString(), state }, null, 1),
      importJson: (json) => {
        try {
          const o = JSON.parse(json);
          if (!looksLikeBackup(o)) return false;
          update(() => normalize(o.state));
          return true;
        } catch {
          return false;
        }
      },
    };
  }, [state, ready, today, update]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider fehlt');
  return s;
}
