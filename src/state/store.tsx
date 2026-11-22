// Der ganze App-Stand liegt in einem Objekt und wird nach jeder Änderung auf dem Gerät gespeichert
// (iPhone/Android: AsyncStorage, im Browser: localStorage). Cloud-Abgleich kommt in Phase 3.

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { dayKey } from '../logic/date.ts';
import { toggleDone } from '../logic/habits.ts';
import { DEFAULT_SPLIT, balances, splitCents } from '../logic/money.ts';
import { updateFirsts } from '../logic/trophies.ts';
import type { AppState, Habit, Jar, MoneyEntry, SavingsGoal, Split } from '../logic/types.ts';

const KEY = 'habivale_state_v1';

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function emptyState(): AppState {
  return { version: 1, profileName: '', habits: [], done: {}, money: { split: { ...DEFAULT_SPLIT }, entries: [], goal: null }, firsts: {} };
}

function normalize(raw: unknown): AppState {
  const s = emptyState();
  if (!raw || typeof raw !== 'object') return s;
  const r = raw as Partial<AppState>;
  return {
    ...s,
    ...r,
    money: { ...s.money, ...(r.money || {}) },
    done: r.done || {},
    habits: r.habits || [],
    firsts: r.firsts || {},
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
  setGoal: (g: SavingsGoal | null) => void;
  resetAll: () => void;
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
        if (j) setState(normalize(JSON.parse(j)));
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
      const g = next.money.goal;
      if (g && !g.reachedAt && balances(next.money.entries).save >= g.cents) {
        next = { ...next, money: { ...next.money, goal: { ...g, reachedAt: Date.now() } } };
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
      setName: (n) => update((s) => ({ ...s, profileName: n.trim().slice(0, 30) })),
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
          return { ...s, habits: s.habits.filter((h) => h.id !== id), done };
        }),
      toggle: (habitId, day) => update((s) => ({ ...s, done: toggleDone(s.done, habitId, day) })),
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
      deleteEntry: (id) => money((m) => ({ ...m, entries: m.entries.filter((e) => e.id !== id) })),
      setSplit: (sp) => money((m) => ({ ...m, split: sp })),
      setGoal: (g) => money((m) => ({ ...m, goal: g })),
      resetAll: () => update(() => emptyState()),
    };
  }, [state, ready, today, update]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider fehlt');
  return s;
}
