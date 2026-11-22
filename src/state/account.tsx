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
import { ageStage, defaultShares, type AppState, type Avatar, type ChildProfile, type FamilyInfo } from '../logic/types.ts';
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
  snapshot: Snapshot | null;
  updatedAt: string | null;
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
  // Familie – Kind
  joinFamily: (code: string) => Promise<{ recovery: string | null; needsRecovery: boolean }>;
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

  /** Kind: Freigaben für jeden Elternteil verschlüsselt hochladen (nur bei Änderung). */
  const pushShares = useCallback(async (s: api.Session) => {
    const f = stateRef.current.family;
    if (!f || f.role !== 'child') return;
    const on = f.shares.habits || f.shares.goals || f.shares.money;
    const snap = buildSnapshot(stateRef.current, dayKey(), f.shares);
    const key = on ? snapshotKey(snap) + JSON.stringify(f.parents.map((p) => p.id)) : 'off';
    if (key === lastShare.current) return;
    if (!on) await api.deleteShares(s, f.memberId);
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
      return;
    }
    throw new Error('Abgleich gerade nicht möglich. Bitte später noch einmal.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fresh, pushShares]);

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
    const payload = await cr.sealWithCode(code, JSON.stringify({ name: child.name, birthYear: child.birthYear, avatar: child.avatar }));
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
          if (!m) continue; // auf einem anderen Gerät entfernt
          const sh = shares.find((x) => x.child_id === c.memberId);
          let snapshot: Snapshot | null = null;
          if (sh) {
            try {
              snapshot = JSON.parse(await cr.openSealed(f.priv, sh.data as cr.SealedFor));
            } catch {
              snapshot = null;
            }
          }
          out.push({ profile: c, connected: !!m.user_id, snapshot, updatedAt: sh?.updated_at ?? null });
        }
        return out;
      },
      removeChild: async (child) => {
        const s = await fresh();
        await api.rpc(s, 'family_remove_child', { p_member: child.memberId });
        const cur = stateRef.current;
        const f = cur.family;
        if (f?.role === 'parent') {
          const now = Date.now();
          applyRef.current({ ...cur, family: { ...f, children: f.children.filter((c) => c.memberId !== child.memberId) }, fMt: now, deleted: { ...cur.deleted, ['k:' + child.memberId]: now } });
        }
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
        const info = JSON.parse(await cr.openWithCode(code, res.payload)) as { name: string; birthYear: number; avatar: Avatar };
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
          // Dieses Profil hatte schon ein Gerät: Daten mit dem Wiederherstellungs-Code öffnen
          setStatus('locked');
          return { recovery: null, needsRecovery: true };
        }
        const recovery = await createPackage(s, st, cr.randomSecret());
        setStatus('idle');
        setLastSync(Date.now());
        await pushShares(s);
        return { recovery, needsRecovery: false };
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
