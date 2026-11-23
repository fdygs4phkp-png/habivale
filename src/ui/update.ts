// Prüft im Browser, ob eine neuere Version veröffentlicht ist (docs/version.json, beim Bauen geschrieben).
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { APP_VERSION } from '../version';

function newer(a: string, b: string): boolean {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  return false;
}

export function useUpdate(): { latest: string | null; reload: () => void } {
  const [latest, setLatest] = useState<string | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const check = () =>
      fetch(window.location.origin + '/habivale/version.json?t=' + Date.now(), { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => j?.version && newer(j.version, APP_VERSION) && setLatest(j.version))
        .catch(() => {});
    check();
    const t = setInterval(check, 10 * 60 * 1000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, []);
  return {
    latest,
    reload: () => {
      if (typeof window !== 'undefined') window.location.replace(window.location.origin + '/habivale/?v=' + (latest || Date.now()));
    },
  };
}

/** Sofort neu laden: Zwischenspeicher des Browsers leeren (falls vorhanden) und die Seite mit neuer Adresse holen. */
export async function forceReload(): Promise<void> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  try {
    const nav = navigator as Navigator & { serviceWorker?: ServiceWorkerContainer };
    if (nav.serviceWorker?.getRegistrations) for (const r of await nav.serviceWorker.getRegistrations()) await r.unregister();
    if (typeof caches !== 'undefined') for (const k of await caches.keys()) await caches.delete(k);
  } catch {
    // egal – neu laden geht trotzdem
  }
  window.location.replace(window.location.origin + '/habivale/?v=' + Date.now());
}
