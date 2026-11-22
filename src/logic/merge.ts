// Zwei Stände zusammenführen (Gerät ↔ Cloud). Grundsatz wie bei eWolfe: nichts geht verloren,
// außer es wurde ausdrücklich gelöscht (Grabstein in `deleted` mit Zeitpunkt).
// Je Eintrag gewinnt die neuere Fassung (`mt`). Haken: Zeitpunkt des Abhakens gegen Zeitpunkt des Wegnehmens.

import type { AppState } from './types.ts';

type WithMt = { id: string; mt: number };

function maxMap(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) if (out[k] === undefined || v > out[k]) out[k] = v;
  return out;
}

function byId<T extends WithMt>(a: T[], b: T[], tomb: Record<string, number>, prefix: string): T[] {
  const m = new Map<string, T>();
  for (const x of [...a, ...b]) {
    const old = m.get(x.id);
    if (!old || x.mt > old.mt) m.set(x.id, x);
  }
  return [...m.values()].filter((x) => tomb[prefix + x.id] === undefined).sort((x, y) => idOrder(a, b, x.id) - idOrder(a, b, y.id));
}

/** Reihenfolge stabil halten: erst wie im lokalen Stand, Neues hinten. */
function idOrder<T extends { id: string }>(a: T[], b: T[], id: string): number {
  const i = a.findIndex((x) => x.id === id);
  if (i >= 0) return i;
  return a.length + b.findIndex((x) => x.id === id);
}

function byKeyMt<T extends { mt: number }>(a: Record<string, T>, b: Record<string, T>): Record<string, T> {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) if (!out[k] || v.mt > out[k].mt) out[k] = v;
  return out;
}

export function mergeState(local: AppState, remote: AppState): AppState {
  const deleted = maxMap(local.deleted, remote.deleted);

  // Haken: Vereinigung, jeweils der spätere Zeitpunkt; ein späterer Grabstein ('d:' + Schlüssel) nimmt den Haken weg
  const done: AppState['done'] = {};
  const all = maxMap(local.done, remote.done);
  for (const [k, ts] of Object.entries(all)) {
    const t = deleted['d:' + k];
    if (t === undefined || ts > t) done[k] = ts;
  }

  // Einstellungen (Name, Aufteilung, Sparziel, Premium): der neuere Block gewinnt
  const s = remote.sMt > local.sMt ? remote : local;

  // Trophäen: das früheste erste Erreichen zählt
  const firsts = { ...local.firsts };
  for (const [k, v] of Object.entries(remote.firsts)) if (firsts[k] === undefined || v < firsts[k]) firsts[k] = v;

  return {
    ...local,
    profileName: s.profileName,
    premium: s.premium,
    sMt: Math.max(local.sMt, remote.sMt),
    habits: byId(local.habits, remote.habits, deleted, 'h:'),
    goals: byId(local.goals, remote.goals, deleted, 'g:'),
    done,
    money: {
      split: s.money.split,
      goal: s.money.goal,
      entries: byId(
        local.money.entries.map((e) => ({ ...e, mt: e.at })),
        remote.money.entries.map((e) => ({ ...e, mt: e.at })),
        deleted,
        'm:',
      )
        .map(({ mt: _mt, ...e }) => e as AppState['money']['entries'][number])
        .sort((x, y) => x.at - y.at),
    },
    journal: byKeyMt(local.journal, remote.journal),
    weeks: byKeyMt(local.weeks, remote.weeks),
    firsts,
    deleted,
    family: mergeFamily(local, remote),
    fMt: Math.max(local.fMt, remote.fMt),
  };
}

/** Familie: der neuere Block gewinnt; bei Eltern gehen Kinderprofile von zwei Geräten nicht verloren. */
function mergeFamily(local: AppState, remote: AppState): AppState['family'] {
  const win = remote.fMt > local.fMt ? remote.family : local.family;
  const other = win === remote.family ? local.family : remote.family;
  if (win?.role === 'parent' && other?.role === 'parent' && other.familyId === win.familyId) {
    const ids = new Set(win.children.map((c) => c.memberId));
    const removed = (id: string) => (local.deleted['k:' + id] ?? remote.deleted['k:' + id]) !== undefined;
    return { ...win, children: [...win.children, ...other.children.filter((c) => !ids.has(c.memberId))].filter((c) => !removed(c.memberId)) };
  }
  return win;
}

/** Hat der Stand eigene Inhalte? (Ein leeres Gerät lädt nur herunter.) */
export function hasContent(s: AppState): boolean {
  return s.habits.length > 0 || s.money.entries.length > 0 || s.goals.length > 0 || Object.keys(s.journal).length > 0 || !!s.profileName;
}
