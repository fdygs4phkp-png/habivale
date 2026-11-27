// Konto, verschlüsselter Abgleich und Familienkonto.
// Erwachsene: E-Mail-Konto, Daten in `user_data`. Kinder: anonymes Konto, verbunden über einen Code der Eltern,
// Daten in `child_data` (nur das Kind kann sie lesen). Freigaben an die Eltern liegen verschlüsselt in `family_shares`.
// Regeln wie in eWolfe: jeder Schreibvorgang nennt die Revision, auf der er beruht; Zusammenführen verliert nichts.

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import { dayKey } from '../logic/date.ts';
import { hasContent, mergeState } from '../logic/merge.ts';
import { buildSnapshot, snapshotKey, type Snapshot } from '../logic/share.ts';
import { ageStage, defaultShares, type AppState, type Avatar, type ChildProfile, type FamilyInfo, type InboxItem, type ParentMessage } from '../logic/types.ts';
import { splitCents } from '../logic/money.ts';
import * as cr from '../sync/crypto';
import * as api from '../sync/supabase';
import { normalize, useStore } from './store';

const K_SESSION = 'habivale_session_v1';
const K_KEY = 'habivale_datakey_v1';
const K_TARGET = 'habivale_target_v1';

type Target = { kind: 'adult' } | { kind: 'child'; memberId: string };

export type SyncStatus = 'none' | 'locked' | 'idle' | 'syncing' | 'offline' | 'error';

export interface ChildView {
  profile: ChildProfile;
  connected: boolean;
  pub: JsonWebKey | null;
  snapshot: Snapshot | null;
  updatedAt: string | null;
  /** Das Profil gibt es auf dem Server nicht mehr (eigenes Konto ab 16 oder auf einem anderen Gerät entfernt). */
  left?: boolean;
}

type Account = {
  status: SyncStatus;
  email: string | null;
  isChild: boolean;
  lastSync: number | null;
  error: string | null;
  available: boolean;
  register: (email: string, password: string) => Promise<string>;
  login: (email: string, password: string) => Promise<string | null>;
  unlockWithRecovery: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  syncNow: () => Promise<void>;
  recoveryCode: () => Promise<string | null>;
  deleteAccount: () => Promise<void>;
  // Familie – Eltern
  createFamily: () => Promise<void>;
  addChild: (name: string, birthYear: number, avatar: Avatar) => Promise<{ code: string; expires: string }>;
  newInvite: (child: ChildProfile) => Promise<{ code: string; expires: string }>;
  loadChildren: () => Promise<ChildView[]>;
  removeChild: (child: ChildProfile) => Promise<void>;
  sendToChild: (child: ChildView, msg: ParentMessage) => Promise<void>;
  // Familie – Kind
  joinFamily: (code: string) => Promise<{ recovery: string | null; needsRecovery: boolean }>;
  /** Kind ab 16: eigenes Konto mit E-Mail und Passwort, alle Daten kommen mit, die Eltern sehen danach nichts mehr. */
  becomeOwn: (email: string, password: string) => Promise<{ code: string; leftOk: boolean }>;
};

const Ctx = createContext<Account | null>(null);

export function errorText(e: unknown): string {
  if (e instanceof api.ApiError) {
    if (e.code === 'offline') return 'Keine Internetverbindung.';
    if (e.code === 'invalid_credentials') return 'E-Mail oder Passwort stimmt nicht.';
    if (e.code === 'user_already_exists') return 'Mit dieser E-Mail gibt es schon ein Konto. Bitte anmelden.';
    if (e.code === 'weak_password') return 'Das Passwort ist zu schwach.';
    if (e.code === 'email_not_confirmed') return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
    if (e.code === 'anonymous_provider_disabled') return 'Kindergeräte lassen sich gerade nicht verbinden (bei Supabase ist die anonyme Anmeldung noch aus).';
    if (e.code === 'over_email_send_rate_limit' || e.status === 429) return 'Zu viele Versuche. Bitte warte ein paar Minuten.';
    if (/code_invalid/.test(e.message)) return 'Diesen Code gibt es nicht. Bitte genau abtippen.';
    if (/code_used/.test(e.message)) return 'Dieser Code wurde schon benutzt. Deine Eltern können einen neuen erstellen.';
    if (/code_expired/.test(e.message)) return 'Dieser Code ist abgelaufen. Deine Eltern können einen neuen erstellen.';
    if (/is_parent/.test(e.message)) return 'Auf diesem Gerät ist schon ein Elternkonto angemeldet.';
    if (/adult_only/.test(e.message)) return 'Eine Familie kann nur ein Erwachsenen-Konto gründen.';
    if (/inbox_full/.test(e.message)) return 'Dein Kind hat noch viele ungelesene Nachrichten. Bitte warte, bis es sie angesehen hat.';
    if (/too_many_children/.test(e.message)) return 'Mehr als acht Kinderprofile gehen nicht.';
    if (e.status === 400) return 'E-Mail oder Passwort stimmt nicht.';
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return 'Unbekannter Fehler';
}

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  const stateRef = useRef<AppState>(store.state);
  stateRef.current = store.state;
  const applyRef = useRef(store.applyMerged);
  applyRef.current = store.applyMerged;

  const [session, setSession] = useState<api.Session | null>(null);
  const [dataKey, setDataKey] = useState<Uint8Array | null>(null);
  const [target, setTarget] = useState<Target>({ kind: 'adult' });
  const [status, setStatus] = useState<SyncStatus>('none');
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const envRef = useRef<cr.Envelope | null>(null);
  const sessionRef = useRef<api.Session | null>(null);
  sessionRef.current = session;
  const keyRef = useRef<Uint8Array | null>(null);
  keyRef.current = dataKey;
  const targetRef = useRef<Target>(target);
  targetRef.current = target;
  const busy = useRef(false);
  const again = useRef(false);
  const lastUploaded = useRef<string>('');
  const lastShare = useRef<string>('');

  useEffect(() => {
    (async () => {
      const [s, k, t] = await Promise.all([AsyncStorage.getItem(K_SESSION), AsyncStorage.getItem(K_KEY), AsyncStorage.getItem(K_TARGET)]);
      if (t) setTarget(JSON.parse(t));
      if (s) {
        setSession(JSON.parse(s));
        if (k) {
          setDataKey(cr.unb64(k));
          setStatus('idle');
        } else setStatus('locked');
      }
    })().catch(() => {});
  }, []);

  const saveSession = async (s: api.Session | null) => {
    setSession(s);
    sessionRef.current = s;
    if (s) await AsyncStorage.setItem(K_SESSION, JSON.stringify(s));
    else await AsyncStorage.removeItem(K_SESSION);
  };
  const saveKey = async (k: Uint8Array | null) => {
    setDataKey(k);
    keyRef.current = k;
    if (k) await AsyncStorage.setItem(K_KEY, cr.b64(k));
    else await AsyncStorage.removeItem(K_KEY);
  };
  const saveTarget = async (t: Target) => {
    setTarget(t);
    targetRef.current = t;
    await AsyncStorage.setItem(K_TARGET, JSON.stringify(t));
  };
  const storeOf = (s: api.Session): api.Store => {
    const t = targetRef.current;
    return t.kind === 'child' ? api.childStore(t.memberId) : api.adultStore(s);
  };

  const fresh = useCallback(async (): Promise<api.Session> => {
    const s = sessionRef.current;
    if (!s) throw new Error('Nicht angemeldet');
    if (s.expires_at - Date.now() / 1000 > 120) return s;
    try {
      const n = await api.refresh(s);
      await saveSession(n);
      return n;
    } catch (e) {
      if (e instanceof api.ApiError && e.code !== 'offline') {
        await saveSession(null);
        setStatus('none');
      }
      throw e;
    }
  }, []);

  /** Kind: Nachrichten der Eltern abholen, entschlüsseln, übernehmen und auf dem Server löschen. */
  const pullInbox = useCallback(async (s: api.Session) => {
    const f = stateRef.current.family;
    if (!f || f.role !== 'child') return;
    const rows = await api.getInbox(s, f.memberId);
    if (!rows.length) return;
    let next = stateRef.current;
    for (const r of rows) {
      const id = 'in-' + r.id;
      if (next.deleted['i:' + id] !== undefined || next.inbox.some((x) => x.id === id)) continue;
      let msg: ParentMessage;
      try {
        msg = JSON.parse(await cr.openSealed(f.priv, r.data as cr.SealedFor));
      } catch {
        continue; // mit einem alten Schlüssel verschlüsselt – nicht lesbar
      }
      const at = Date.parse(r.created_at) || Date.now();
      const from = String(msg.from || 'Deine Eltern').slice(0, 30);
      let item: InboxItem | null = null;
      if (msg.type === 'suggest') item = { id, at, from, kind: 'suggest', habit: { name: String(msg.habit.name).slice(0, 40), icon: String(msg.habit.icon), days: (msg.habit.days || []).filter((d) => d >= 0 && d <= 6) } };
      else if (msg.type === 'praise') item = { id, at, from, kind: 'praise', sticker: String(msg.sticker), text: String(msg.text).slice(0, 120) };
      else if (msg.type === 'premium') {
        // Premium der Eltern gilt für die ganze Familie (keine Meldung im Eingang)
        if (next.premium !== !!msg.on) next = { ...next, premium: !!msg.on, sMt: Date.now() };
      } else if (msg.type === 'allowance' && Number.isInteger(msg.cents) && msg.cents > 0 && msg.cents <= 100000) {
        const eid = 'in-' + r.id;
        if (!next.money.entries.some((e) => e.id === eid) && next.deleted['m:' + eid] === undefined) {
          const note = String(msg.note || 'von ' + from).slice(0, 60);
          next = { ...next, money: { ...next.money, entries: [...next.money.entries, { id: eid, kind: 'allowance', cents: msg.cents, day: dayKey(new Date(at)), note, parts: splitCents(msg.cents, next.money.split), at }] } };
        }
        // Spar-Bonus der Eltern: kommt ganz ins Sparglas („wer spart, dessen Geld wächst“)
        const bonus = Number.isInteger(msg.bonus) && msg.bonus! > 0 && msg.bonus! <= 100000 ? msg.bonus! : 0;
        const bid = 'inb-' + r.id;
        if (bonus && !next.money.entries.some((e) => e.id === bid) && next.deleted['m:' + bid] === undefined) {
          next = { ...next, money: { ...next.money, entries: [...next.money.entries, { id: bid, kind: 'allowance', cents: bonus, day: dayKey(new Date(at)), note: 'Spar-Bonus von ' + from, parts: { save: bonus, spend: 0, share: 0 }, at: at + 1 }] } };
        }
        item = { id, at, from, kind: 'allowance', cents: msg.cents, text: String(msg.note || ''), ...(bonus ? { bonus } : {}) };
      }
      if (item) next = { ...next, inbox: [...next.inbox, item] };
    }
    if (next !== stateRef.current) {
      applyRef.current(next);
      stateRef.current = next;
    }
    for (const r of rows) await api.deleteInbox(s, r.id).catch(() => {});
  }, []);

  /** Eltern: Premium-Stand an alle verbundenen Kinder schicken, wenn er sich geändert hat. */
  const pushPremium = useCallback(async (s: api.Session) => {
    const f = stateRef.current.family;
    if (!f || f.role !== 'parent' || !f.children.length) return;
    const on = !!stateRef.current.premium;
    if (f.children.every((c) => c.prem === on)) return;
    const members = await api.familyMembers(s);
    const me = members.find((m) => m.user_id === s.user.id && m.role === 'parent');
    if (!me) return;
    const sent = new Set<string>();
    for (const c of f.children) {
      if (c.prem === on) continue;
      const m = members.find((x) => x.id === c.memberId);
      if (!m?.pub || !m.user_id) continue; // noch kein Gerät verbunden – beim nächsten Mal
      await api.sendInbox(s, c.memberId, me.id, await cr.sealFor(m.pub, JSON.stringify({ type: 'premium', from: 'Eltern', on })));
      sent.add(c.memberId);
    }
    if (!sent.size) return;
    const cur = stateRef.current;
    if (cur.family?.role !== 'parent') return;
    const next: AppState = { ...cur, family: { ...cur.family, children: cur.family.children.map((c) => (sent.has(c.memberId) ? { ...c, prem: on } : c)) }, fMt: Date.now() };
    applyRef.current(next);
    stateRef.current = next;
  }, []);

  /** Kind: Freigaben für jeden Elternteil verschlüsselt hochladen (nur bei Änderung). */
  const pushShares = useCallback(async (s: api.Session) => {
    const f = stateRef.current.family;
    if (!f || f.role !== 'child') return;
    const on = f.shares.habits || f.shares.goals || f.shares.money;
    const snap = buildSnapshot(stateRef.current, dayKey(), f.shares);
    // Der Wiederherstellungs-Code reist immer mit (auch wenn sonst nichts geteilt wird), damit die Eltern ein neues Gerät ohne Code-Eingabe verbinden können
    const env = envRef.current;
    if (env && keyRef.current) snap.rc = await cr.openCode(env, keyRef.current).catch(() => undefined);
    const send = on || !!snap.rc;
    const key = send ? snapshotKey(snap) + JSON.stringify(f.parents.map((p) => p.id)) : 'off';
    if (key === lastShare.current) return;
    if (!send) await api.deleteShares(s, f.memberId);
    else for (const p of f.parents) await api.putShare(s, f.memberId, p.id, await cr.sealFor(p.pub, JSON.stringify(snap)));
    lastShare.current = key;
  }, []);

  const syncOnce = useCallback(async () => {
    const key = keyRef.current;
    if (!key || !sessionRef.current) return;
    for (let attempt = 0; attempt < 3; attempt++) {
      const s = await fresh();
      const st = storeOf(s);
      const row = await api.getRowIn(s, st);
      if (!row || !cr.isEnvelope(row.data)) throw new Error('Keine Daten im Konto gefunden.');
      envRef.current = row.data;
      const remote = normalize(JSON.parse(await cr.openData(row.data, key)));
      const local = stateRef.current;
      const merged = hasContent(local) ? mergeState(local, remote) : mergeState(remote, local);
      const mergedJson = JSON.stringify(merged);
      if (mergedJson !== JSON.stringify(local)) {
        applyRef.current(merged);
        stateRef.current = merged;
      }
      if (mergedJson !== JSON.stringify(remote)) {
        const updated = await api.updateRowIn(s, st, await cr.reseal(row.data, key, mergedJson), row.revision);
        if (!updated) continue; // jemand anders hat inzwischen geschrieben → noch einmal
      }
      lastUploaded.current = mergedJson;
      await pushShares(s);
      await pullInbox(s);
      await pushPremium(s).catch(() => {});
      return;
    }
    throw new Error('Abgleich gerade nicht möglich. Bitte später noch einmal.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fresh, pushShares, pullInbox, pushPremium]);

  const syncNow = useCallback(async () => {
    if (!keyRef.current || !sessionRef.current) return;
    if (busy.current) {
      again.current = true;
      return;
    }
    busy.current = true;
    setStatus('syncing');
    try {
      do {
        again.current = false;
        await syncOnce();
      } while (again.current);
      setStatus('idle');
      setError(null);
      setLastSync(Date.now());
    } catch (e) {
      const off = e instanceof api.ApiError && e.code === 'offline';
      setStatus(sessionRef.current ? (off ? 'offline' : 'error') : 'none');
      setError(errorText(e));
    } finally {
      busy.current = false;
    }
  }, [syncOnce]);

  useEffect(() => {
    if (!store.ready || !dataKey || !session) return;
    if (JSON.stringify(store.state) === lastUploaded.current) return;
    const t = setTimeout(() => void syncNow(), 2500);
    return () => clearTimeout(t);
  }, [store.state, store.ready, dataKey, session, syncNow]);

  useEffect(() => {
    if (!dataKey || !session) return;
    void syncNow();
    const t = setInterval(() => void syncNow(), 60000);
    const sub = RNAppState.addEventListener('change', (st) => st === 'active' && void syncNow());
    return () => {
      clearInterval(t);
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, session?.user.id]);

  /** Neues verschlüsseltes Paket anlegen (Erwachsene: mit Passwort; Kinder: nur Code). */
  const createPackage = async (s: api.Session, st: api.Store, password: string): Promise<string> => {
    const key = cr.newDataKey();
    const code = cr.newRecoveryCode();
    const json = JSON.stringify(stateRef.current);
    const env = await cr.createEnvelope(key, password, code, json);
    await api.insertRowIn(s, st, env);
    envRef.current = env;
    lastUploaded.current = json;
    await saveKey(key);
    return code;
  };

  const clearLocal = async () => {
    await saveSession(null);
    await saveKey(null);
    await saveTarget({ kind: 'adult' });
    envRef.current = null;
    lastUploaded.current = '';
    lastShare.current = '';
    setStatus('none');
    setLastSync(null);
    setError(null);
  };

  /** Eigene Elternrolle auf dem Server (Mitglieds-Id). */
  const myParentId = async (s: api.Session): Promise<string> => {
    const ms = await api.familyMembers(s);
    const me = ms.find((m) => m.user_id === s.user.id && m.role === 'parent');
    if (!me) throw new Error('Keine Familie gefunden.');
    return me.id;
  };

  const inviteFor = async (s: api.Session, child: ChildProfile) => {
    const code = cr.newInviteCode();
    const f = stateRef.current.family;
    const rc = (f?.role === 'parent' ? f.children.find((c) => c.memberId === child.memberId)?.rc : undefined) ?? child.rc;
    const payload = await cr.sealWithCode(code, JSON.stringify({ name: child.name, birthYear: child.birthYear, avatar: child.avatar, ...(rc ? { rc } : {}) }));
    const expires = await api.rpc<string>(s, 'family_invite', { p_member: child.memberId, p_code_hash: await cr.hashInvite(code), p_payload: payload });
    return { code, expires };
  };

  const account = useMemo<Account>(
    () => ({
      status,
      email: session?.user.email ?? null,
      isChild: target.kind === 'child',
      lastSync,
      error,
      available: cr.cryptoAvailable(),
      register: async (email, password) => {
        const s = await api.signUp(email.trim(), password);
        if (!s) throw new Error('Bitte bestätige zuerst deine E-Mail-Adresse (Link in der E-Mail), dann melde dich an.');
        await saveSession(s);
        await saveTarget({ kind: 'adult' });
        if (await api.getRowIn(s, api.adultStore(s))) throw new Error('Für dieses Konto gibt es schon Daten. Bitte anmelden.');
        const code = await createPackage(s, api.adultStore(s), password);
        setStatus('idle');
        setLastSync(Date.now());
        return code;
      },
      login: async (email, password) => {
        const s = await api.signIn(email.trim(), password);
        await saveSession(s);
        await saveTarget({ kind: 'adult' });
        const row = await api.getRowIn(s, api.adultStore(s));
        if (!row) {
          const code = await createPackage(s, api.adultStore(s), password);
          setStatus('idle');
          return code;
        }
        if (!cr.isEnvelope(row.data)) throw new Error('Die Daten im Konto sind nicht lesbar.');
        try {
          await saveKey(await cr.unlockWithPassword(row.data, password));
        } catch {
          setStatus('locked');
          throw new Error('Die Daten ließen sich mit diesem Passwort nicht öffnen. Bitte gib deinen Wiederherstellungs-Code ein.');
        }
        envRef.current = row.data;
        setStatus('idle');
        await syncNow();
        return null;
      },
      unlockWithRecovery: async (code) => {
        const s = await fresh();
        const row = await api.getRowIn(s, storeOf(s));
        if (!row || !cr.isEnvelope(row.data)) throw new Error('Keine Daten im Konto gefunden.');
        try {
          await saveKey(await cr.unlockWithCode(row.data, code));
        } catch {
          throw new Error('Der Code stimmt nicht.');
        }
        setStatus('idle');
        await syncNow();
      },
      logout: async () => {
        if (sessionRef.current) await api.signOut(sessionRef.current);
        await clearLocal();
      },
      syncNow,
      recoveryCode: async () => {
        const key = keyRef.current;
        if (!key) return null;
        let env = envRef.current;
        if (!env) {
          const s = await fresh();
          const row = await api.getRowIn(s, storeOf(s));
          env = row && cr.isEnvelope(row.data) ? row.data : null;
        }
        return env ? cr.openCode(env, key) : null;
      },
      deleteAccount: async () => {
        await api.deleteAccount(await fresh());
        await clearLocal();
      },

      createFamily: async () => {
        const s = await fresh();
        const cur = stateRef.current.family;
        const kp = cur?.role === 'parent' ? { pub: cur.pub, priv: cur.priv } : await cr.newKeyPair();
        const familyId = await api.rpc<string>(s, 'family_create', { p_pub: kp.pub });
        store.setFamily({ role: 'parent', familyId, pub: kp.pub, priv: kp.priv, children: cur?.role === 'parent' ? cur.children : [] });
      },
      addChild: async (name, birthYear, avatar) => {
        const s = await fresh();
        const f = stateRef.current.family;
        if (!f || f.role !== 'parent') throw new Error('Bitte zuerst die Familie gründen.');
        const memberId = await api.rpc<string>(s, 'family_add_child', { p_family: f.familyId });
        const child: ChildProfile = { memberId, name: name.trim().slice(0, 30), birthYear, avatar, addedAt: Date.now() };
        store.setFamily({ ...f, children: [...f.children, child] });
        return inviteFor(s, child);
      },
      newInvite: async (child) => inviteFor(await fresh(), child),
      loadChildren: async () => {
        const s = await fresh();
        const f = stateRef.current.family;
        if (!f || f.role !== 'parent') return [];
        const [members, parentId] = await Promise.all([api.familyMembers(s), myParentId(s)]);
        const shares = await api.sharesForMe(s, parentId);
        const out: ChildView[] = [];
        for (const c of f.children) {
          const m = members.find((x) => x.id === c.memberId);
          if (!m) {
            out.push({ profile: c, connected: false, pub: null, snapshot: null, updatedAt: null, left: true });
            continue;
          }
          const sh = shares.find((x) => x.child_id === c.memberId);
          let snapshot: Snapshot | null = null;
          if (sh) {
            try {
              snapshot = JSON.parse(await cr.openSealed(f.priv, sh.data as cr.SealedFor));
            } catch {
              snapshot = null;
            }
          }
          out.push({ profile: c, connected: !!m.user_id, pub: m.pub, snapshot, updatedAt: sh?.updated_at ?? null });
        }
        // Wiederherstellungs-Codes der Kinder in den eigenen (verschlüsselten) Daten merken
        const codes = new Map(out.filter((v) => v.snapshot?.rc && v.snapshot.rc !== v.profile.rc).map((v) => [v.profile.memberId, v.snapshot!.rc!]));
        const cur = stateRef.current;
        if (codes.size && cur.family?.role === 'parent') {
          const next: AppState = { ...cur, family: { ...cur.family, children: cur.family.children.map((c) => (codes.has(c.memberId) ? { ...c, rc: codes.get(c.memberId) } : c)) }, fMt: Date.now() };
          applyRef.current(next);
          stateRef.current = next;
        }
        return out;
      },
      removeChild: async (child) => {
        const s = await fresh();
        const members = await api.familyMembers(s);
        // Gibt es das Profil auf dem Server noch, dort löschen; sonst nur aus der eigenen Liste nehmen
        if (members.some((m) => m.id === child.memberId)) await api.rpc(s, 'family_remove_child', { p_member: child.memberId });
        const cur = stateRef.current;
        const f = cur.family;
        if (f?.role === 'parent') {
          const now = Date.now();
          applyRef.current({ ...cur, family: { ...f, children: f.children.filter((c) => c.memberId !== child.memberId) }, fMt: now, deleted: { ...cur.deleted, ['k:' + child.memberId]: now } });
        }
      },

      sendToChild: async (child, msg) => {
        if (!child.pub) throw new Error('Das Gerät deines Kindes ist noch nicht verbunden.');
        const s = await fresh();
        const parentId = await myParentId(s);
        await api.sendInbox(s, child.profile.memberId, parentId, await cr.sealFor(child.pub, JSON.stringify(msg)));
      },
      joinFamily: async (rawCode) => {
        const code = cr.normInvite(rawCode);
        if (code.length !== 8) throw new Error('Der Code hat 8 Zeichen.');
        let s = sessionRef.current;
        if (!s) {
          s = await api.signInAnonymously();
          await saveSession(s);
        }
        const kp = await cr.newKeyPair();
        const res = await api.rpc<{ member_id: string; family_id: string; payload: { iv: string; ct: string }; parents: { id: string; pub: JsonWebKey }[] }>(s, 'family_redeem', {
          p_code_hash: await cr.hashInvite(code),
          p_pub: kp.pub,
        });
        const info = JSON.parse(await cr.openWithCode(code, res.payload)) as { name: string; birthYear: number; avatar: Avatar; rc?: string };
        await saveTarget({ kind: 'child', memberId: res.member_id });
        const fam: FamilyInfo = {
          role: 'child',
          familyId: res.family_id,
          memberId: res.member_id,
          name: info.name,
          birthYear: info.birthYear,
          avatar: info.avatar,
          parents: res.parents.filter((p) => p.pub),
          shares: defaultShares(ageStage(info.birthYear)),
          pub: kp.pub,
          priv: kp.priv,
        };
        const st = api.childStore(res.member_id);
        const existing = await api.getRowIn(s, st);
        const next = { ...stateRef.current, profileName: stateRef.current.profileName || info.name, sMt: Date.now(), family: fam, fMt: Date.now() };
        applyRef.current(next);
        stateRef.current = next;
        if (existing) {
          // Dieses Profil hatte schon ein Gerät. Haben die Eltern den Wiederherstellungs-Code mitgeschickt, öffnet es sich von selbst.
          if (info.rc && cr.isEnvelope(existing.data)) {
            try {
              await saveKey(await cr.unlockWithCode(existing.data, info.rc));
              envRef.current = existing.data;
              setStatus('idle');
              await syncNow();
              return { recovery: null, needsRecovery: false };
            } catch {
              // Code passt nicht (mehr) – dann wie bisher von Hand
            }
          }
          setStatus('locked');
          return { recovery: null, needsRecovery: true };
        }
        const recovery = await createPackage(s, st, cr.randomSecret());
        setStatus('idle');
        setLastSync(Date.now());
        await pushShares(s);
        return { recovery, needsRecovery: false };
      },

      becomeOwn: async (email, password) => {
        const f = stateRef.current.family;
        if (!f || f.role !== 'child' || targetRef.current.kind !== 'child') throw new Error('Dieses Gerät ist kein Kinderprofil.');
        if (ageStage(f.birthYear) !== 'erwachsen') throw new Error('Ein eigenes Konto gibt es ab 16 Jahren.');
        if (!keyRef.current) throw new Error('Bitte zuerst die Daten entsperren.');
        // Solange umgezogen wird, gleicht dieses Gerät nichts ab
        while (busy.current) await new Promise((r) => setTimeout(r, 200));
        busy.current = true;
        try {
          const old = await fresh();
          // 1. Neues Konto anlegen und alle Daten (ohne Familie) verschlüsselt hineinlegen – erst dann wird das Kinderprofil gelöst
          const s2 = await api.signUp(email.trim(), password);
          if (!s2) throw new Error('Bitte bestätige zuerst deine E-Mail-Adresse (Link in der E-Mail) und versuche es dann noch einmal.');
          if (await api.getRowIn(s2, api.adultStore(s2))) throw new Error('Mit dieser E-Mail gibt es schon ein Konto mit Daten. Bitte nimm eine andere E-Mail-Adresse.');
          const now = Date.now();
          const next: AppState = { ...stateRef.current, family: null, fMt: now, sMt: now };
          const key = cr.newDataKey();
          const code = cr.newRecoveryCode();
          const json = JSON.stringify(next);
          const env = await cr.createEnvelope(key, password, code, json);
          await api.insertRowIn(s2, api.adultStore(s2), env);
          // 2. Kinderprofil, Freigaben und Nachrichten auf dem Server löschen, das anonyme Kindergerät-Konto ebenso
          let leftOk = true;
          try {
            await api.rpc(old, 'family_child_leave', {});
          } catch {
            leftOk = false;
          }
          // 3. Dieses Gerät auf das neue Konto umstellen
          applyRef.current(next);
          stateRef.current = next;
          await saveSession(s2);
          await saveTarget({ kind: 'adult' });
          await saveKey(key);
          envRef.current = env;
          lastUploaded.current = json;
          lastShare.current = '';
          setStatus('idle');
          setError(null);
          setLastSync(now);
          return { code, leftOk };
        } finally {
          busy.current = false;
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, session, target, lastSync, error, syncNow, fresh],
  );

  return <Ctx.Provider value={account}>{children}</Ctx.Provider>;
}

export function useAccount(): Account {
  const a = useContext(Ctx);
  if (!a) throw new Error('AccountProvider fehlt');
  return a;
}
