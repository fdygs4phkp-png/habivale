// Konto und verschlüsselter Abgleich. Ohne Konto funktioniert die App wie bisher nur auf dem Gerät.
// Regeln wie in eWolfe: jeder Schreibvorgang nennt die Revision, auf der er beruht; bei Abweichung erst holen und
// zusammenführen. Zusammenführen verliert nichts (siehe src/logic/merge.ts).

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState as RNAppState } from 'react-native';
import { hasContent, mergeState } from '../logic/merge.ts';
import type { AppState } from '../logic/types.ts';
import { b64, createEnvelope, cryptoAvailable, isEnvelope, newDataKey, newRecoveryCode, openCode, openData, reseal, unb64, unlockWithCode, unlockWithPassword, type Envelope } from '../sync/crypto';
import * as api from '../sync/supabase';
import { normalize, useStore } from './store';

const K_SESSION = 'habivale_session_v1';
const K_KEY = 'habivale_datakey_v1';

export type SyncStatus = 'none' | 'locked' | 'idle' | 'syncing' | 'offline' | 'error';

type Account = {
  status: SyncStatus;
  email: string | null;
  lastSync: number | null;
  error: string | null;
  available: boolean;
  register: (email: string, password: string) => Promise<string>; // gibt den Wiederherstellungs-Code zurück
  login: (email: string, password: string) => Promise<string | null>; // Code, wenn ein neues Konto-Paket entstand
  unlockWithRecovery: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  syncNow: () => Promise<void>;
  recoveryCode: () => Promise<string | null>;
  deleteAccount: () => Promise<void>;
};

const Ctx = createContext<Account | null>(null);

export function errorText(e: unknown): string {
  if (e instanceof api.ApiError) {
    if (e.code === 'offline') return 'Keine Internetverbindung.';
    if (e.code === 'invalid_credentials' || e.status === 400) return 'E-Mail oder Passwort stimmt nicht.';
    if (e.code === 'user_already_exists') return 'Mit dieser E-Mail gibt es schon ein Konto. Bitte anmelden.';
    if (e.code === 'weak_password') return 'Das Passwort ist zu schwach.';
    if (e.code === 'email_not_confirmed') return 'Bitte bestätige zuerst deine E-Mail-Adresse.';
    if (e.code === 'over_email_send_rate_limit' || e.status === 429) return 'Zu viele Versuche. Bitte warte ein paar Minuten.';
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
  const [status, setStatus] = useState<SyncStatus>('none');
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const envRef = useRef<Envelope | null>(null);
  const sessionRef = useRef<api.Session | null>(null);
  sessionRef.current = session;
  const keyRef = useRef<Uint8Array | null>(null);
  keyRef.current = dataKey;
  const busy = useRef(false);
  const again = useRef(false);
  const lastUploaded = useRef<string>('');

  // Gespeicherte Sitzung und Schlüssel laden
  useEffect(() => {
    (async () => {
      const [s, k] = await Promise.all([AsyncStorage.getItem(K_SESSION), AsyncStorage.getItem(K_KEY)]);
      if (s) {
        setSession(JSON.parse(s));
        if (k) {
          setDataKey(unb64(k));
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
    if (k) await AsyncStorage.setItem(K_KEY, b64(k));
    else await AsyncStorage.removeItem(K_KEY);
  };

  /** Gültige Sitzung (erneuert sie kurz vor Ablauf). */
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

  /** Ein Abgleich: holen, zusammenführen, übernehmen, hochladen (mit Revision). */
  const syncOnce = useCallback(async () => {
    const key = keyRef.current;
    if (!key || !sessionRef.current) return;
    for (let attempt = 0; attempt < 3; attempt++) {
      const s = await fresh();
      const row = await api.getRow(s);
      if (!row || !isEnvelope(row.data)) throw new Error('Keine Daten im Konto gefunden.');
      envRef.current = row.data;
      const remote = normalize(JSON.parse(await openData(row.data, key)));
      const local = stateRef.current;
      const merged = hasContent(local) ? mergeState(local, remote) : mergeState(remote, local);
      const mergedJson = JSON.stringify(merged);
      if (mergedJson !== JSON.stringify(local)) {
        applyRef.current(merged);
        stateRef.current = merged;
      }
      if (mergedJson === JSON.stringify(remote)) {
        lastUploaded.current = mergedJson;
        return;
      }
      const updated = await api.updateRow(s, await reseal(row.data, key, mergedJson), row.revision);
      if (updated) {
        lastUploaded.current = mergedJson;
        return;
      }
      // jemand anders hat inzwischen geschrieben → noch einmal holen und zusammenführen
    }
    throw new Error('Abgleich gerade nicht möglich. Bitte später noch einmal.');
  }, [fresh]);

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

  // Nach Änderungen kurz warten, dann abgleichen; außerdem regelmäßig und beim Zurückkehren in die App
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

  /** Neues verschlüsseltes Paket für dieses Konto anlegen. */
  const createPackage = async (s: api.Session, password: string): Promise<string> => {
    const key = newDataKey();
    const code = newRecoveryCode();
    const json = JSON.stringify(stateRef.current);
    const env = await createEnvelope(key, password, code, json);
    await api.insertRow(s, env);
    envRef.current = env;
    lastUploaded.current = json;
    await saveKey(key);
    return code;
  };

  const account = useMemo<Account>(
    () => ({
      status,
      email: session?.user.email ?? null,
      lastSync,
      error,
      available: cryptoAvailable(),
      register: async (email, password) => {
        const s = await api.signUp(email.trim(), password);
        if (!s) throw new Error('Bitte bestätige zuerst deine E-Mail-Adresse (Link in der E-Mail), dann melde dich an.');
        await saveSession(s);
        const existing = await api.getRow(s);
        if (existing) throw new Error('Für dieses Konto gibt es schon Daten. Bitte anmelden.');
        const code = await createPackage(s, password);
        setStatus('idle');
        setLastSync(Date.now());
        return code;
      },
      login: async (email, password) => {
        const s = await api.signIn(email.trim(), password);
        await saveSession(s);
        const row = await api.getRow(s);
        if (!row) {
          const code = await createPackage(s, password);
          setStatus('idle');
          return code;
        }
        if (!isEnvelope(row.data)) throw new Error('Die Daten im Konto sind nicht lesbar.');
        try {
          await saveKey(await unlockWithPassword(row.data, password));
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
        const row = await api.getRow(s);
        if (!row || !isEnvelope(row.data)) throw new Error('Keine Daten im Konto gefunden.');
        try {
          await saveKey(await unlockWithCode(row.data, code));
        } catch {
          throw new Error('Der Code stimmt nicht.');
        }
        setStatus('idle');
        await syncNow();
      },
      logout: async () => {
        if (sessionRef.current) await api.signOut(sessionRef.current);
        await saveSession(null);
        await saveKey(null);
        envRef.current = null;
        lastUploaded.current = '';
        setStatus('none');
        setLastSync(null);
        setError(null);
      },
      syncNow,
      recoveryCode: async () => {
        const key = keyRef.current;
        if (!key) return null;
        let env = envRef.current;
        if (!env) {
          const row = await api.getRow(await fresh());
          env = row && isEnvelope(row.data) ? row.data : null;
        }
        return env ? openCode(env, key) : null;
      },
      deleteAccount: async () => {
        await api.deleteAccount(await fresh());
        await saveSession(null);
        await saveKey(null);
        envRef.current = null;
        setStatus('none');
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [status, session, lastSync, error, syncNow, fresh],
  );

  return <Ctx.Provider value={account}>{children}</Ctx.Provider>;
}

export function useAccount(): Account {
  const a = useContext(Ctx);
  if (!a) throw new Error('AccountProvider fehlt');
  return a;
}
