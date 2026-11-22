// Verbindung zu Supabase ohne Bibliothek, direkt per fetch (wie eWolfe).
// Projekt „habivale“ (Frankfurt). Der Schlüssel unten ist der öffentliche „publishable“ Key – das ist so gewollt.
// Niemals einen geheimen Schlüssel in den Code schreiben.

export const SUPABASE_URL = 'https://ivjcedxmjhnptabnrzjm.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_3XQWfEY5gjdMxoDE5v7q9Q_68UGV7Lz';

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Sekunden
  user: { id: string; email?: string };
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, msg: string) {
    super(msg);
  }
}

async function call(path: string, init: RequestInit & { token?: string } = {}): Promise<unknown> {
  const headers: Record<string, string> = { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', ...((init.headers as Record<string, string>) || {}) };
  if (init.token) headers.Authorization = 'Bearer ' + init.token;
  let res: Response;
  try {
    res = await fetch(SUPABASE_URL + path, { ...init, headers });
  } catch {
    throw new ApiError(0, 'offline', 'Keine Verbindung');
  }
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const code = body?.error_code || body?.code || body?.error || String(res.status);
    throw new ApiError(res.status, code, body?.msg || body?.message || body?.error_description || 'Fehler ' + res.status);
  }
  return body;
}

function toSession(b: any): Session | null {
  if (!b?.access_token) return null;
  return { access_token: b.access_token, refresh_token: b.refresh_token, expires_at: b.expires_at || Math.floor(Date.now() / 1000) + (b.expires_in || 3600), user: { id: b.user.id, email: b.user.email } };
}

export async function signUp(email: string, password: string): Promise<Session | null> {
  return toSession(await call('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email, password }) }));
}

export async function signIn(email: string, password: string): Promise<Session> {
  const s = toSession(await call('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email, password }) }));
  if (!s) throw new ApiError(400, 'no_session', 'Anmeldung fehlgeschlagen');
  return s;
}

export async function refresh(s: Session): Promise<Session> {
  const n = toSession(await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: s.refresh_token }) }));
  if (!n) throw new ApiError(401, 'refresh_failed', 'Sitzung abgelaufen');
  return n;
}

export async function signOut(s: Session): Promise<void> {
  await call('/auth/v1/logout', { method: 'POST', token: s.access_token }).catch(() => {});
}

export interface Row {
  data: unknown;
  revision: number;
}

export async function getRow(s: Session): Promise<Row | null> {
  const rows = (await call(`/rest/v1/user_data?user_id=eq.${s.user.id}&select=data,revision`, { token: s.access_token })) as Row[];
  return rows[0] || null;
}

export async function insertRow(s: Session, data: unknown): Promise<Row> {
  const rows = (await call('/rest/v1/user_data', { method: 'POST', token: s.access_token, headers: { Prefer: 'return=representation' }, body: JSON.stringify({ user_id: s.user.id, data }) })) as Row[];
  return rows[0];
}

/** Schreibt nur, wenn die Revision noch stimmt. `null` = jemand anders hat inzwischen geschrieben. */
export async function updateRow(s: Session, data: unknown, revision: number): Promise<Row | null> {
  const rows = (await call(`/rest/v1/user_data?user_id=eq.${s.user.id}&revision=eq.${revision}`, {
    method: 'PATCH',
    token: s.access_token,
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ data }),
  })) as Row[];
  return rows[0] || null;
}

export async function deleteAccount(s: Session): Promise<void> {
  await call('/rest/v1/rpc/delete_own_account', { method: 'POST', token: s.access_token, body: '{}' });
}
