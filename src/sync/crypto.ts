// Ende-zu-Ende-Verschlüsselung wie in eWolfe: ein zufälliger Datenschlüssel (AES-256-GCM) je Konto verschlüsselt alles.
// Der Schlüssel liegt im Konto zweimal verschlossen: mit dem Passwort (PBKDF2-SHA256, 600 000 Runden) und mit dem
// Wiederherstellungs-Code. Der Server sieht nur verschlüsselte Daten.
// Läuft mit WebCrypto (Browser). Für die iPhone-/Android-App kommt später eine native Krypto-Bibliothek dazu.

const PBKDF2_ITER = 600000;
const enc = new TextEncoder();
const dec = new TextDecoder();

export function cryptoAvailable(): boolean {
  return typeof globalThis.crypto !== 'undefined' && !!globalThis.crypto.subtle;
}

const subtle = () => globalThis.crypto.subtle;

export function b64(bytes: ArrayBuffer | Uint8Array): string {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
  return btoa(s);
}

export function unb64(s: string): Uint8Array {
  const bin = atob(s);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}

function rand(n: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(n));
}

async function pwKey(secret: string, salt: Uint8Array, iter: number): Promise<CryptoKey> {
  const base = await subtle().importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return subtle().deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: iter, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

async function aesKey(raw: Uint8Array): Promise<CryptoKey> {
  return subtle().importKey('raw', raw as BufferSource, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

type Sealed = { iv: string; ct: string };

async function seal(key: CryptoKey, data: Uint8Array): Promise<Sealed> {
  const iv = rand(12);
  const ct = await subtle().encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, data as BufferSource);
  return { iv: b64(iv), ct: b64(ct) };
}

async function open(key: CryptoKey, s: Sealed): Promise<Uint8Array> {
  const pt = await subtle().decrypt({ name: 'AES-GCM', iv: unb64(s.iv) as BufferSource }, key, unb64(s.ct) as BufferSource);
  return new Uint8Array(pt);
}

export interface Envelope {
  e2e: 1;
  v: 1;
  kdf: { salt: string; iter: number };
  pw: Sealed; // Datenschlüssel, mit dem Passwort verschlossen
  rc: Sealed & { salt: string }; // Datenschlüssel, mit dem Wiederherstellungs-Code verschlossen
  code: Sealed; // der Code selbst, mit dem Datenschlüssel verschlossen (damit jedes entsperrte Gerät ihn zeigen kann)
  data: Sealed; // der App-Stand
}

/** Wiederherstellungs-Code: 24 Zeichen ohne verwechselbare Zeichen, in 4er-Gruppen. */
export function newRecoveryCode(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const r = rand(24);
  let s = '';
  for (let i = 0; i < 24; i++) s += abc[r[i] % abc.length] + (i % 4 === 3 && i < 23 ? '-' : '');
  return s;
}

const normCode = (c: string) => c.toUpperCase().replace(/[^A-Z0-9]/g, '');

export function newDataKey(): Uint8Array {
  return rand(32);
}

/** Neuer Umschlag: verschließt den Datenschlüssel mit Passwort und Code und verschlüsselt den Stand. */
export async function createEnvelope(dataKey: Uint8Array, password: string, code: string, plain: string): Promise<Envelope> {
  const salt = rand(16);
  const rcSalt = rand(16);
  const dk = await aesKey(dataKey);
  return {
    e2e: 1,
    v: 1,
    kdf: { salt: b64(salt), iter: PBKDF2_ITER },
    pw: await seal(await pwKey(password, salt, PBKDF2_ITER), dataKey),
    rc: { ...(await seal(await pwKey(normCode(code), rcSalt, 100000), dataKey)), salt: b64(rcSalt) },
    code: await seal(dk, enc.encode(code)),
    data: await seal(dk, enc.encode(plain)),
  };
}

/** Bestehenden Umschlag mit neuem Inhalt füllen (Schlösser bleiben gleich). */
export async function reseal(env: Envelope, dataKey: Uint8Array, plain: string): Promise<Envelope> {
  return { ...env, data: await seal(await aesKey(dataKey), enc.encode(plain)) };
}

export async function unlockWithPassword(env: Envelope, password: string): Promise<Uint8Array> {
  return open(await pwKey(password, unb64(env.kdf.salt), env.kdf.iter), env.pw);
}

export async function unlockWithCode(env: Envelope, code: string): Promise<Uint8Array> {
  return open(await pwKey(normCode(code), unb64(env.rc.salt), 100000), env.rc);
}

export async function openData(env: Envelope, dataKey: Uint8Array): Promise<string> {
  return dec.decode(await open(await aesKey(dataKey), env.data));
}

export async function openCode(env: Envelope, dataKey: Uint8Array): Promise<string> {
  return dec.decode(await open(await aesKey(dataKey), env.code));
}

/** Neues Passwort: Datenschlüssel neu verschließen (Inhalt und Code bleiben). */
export async function rewrapPassword(env: Envelope, dataKey: Uint8Array, password: string): Promise<Envelope> {
  const salt = rand(16);
  return { ...env, kdf: { salt: b64(salt), iter: PBKDF2_ITER }, pw: await seal(await pwKey(password, salt, PBKDF2_ITER), dataKey) };
}

export function isEnvelope(x: unknown): x is Envelope {
  return !!x && typeof x === 'object' && (x as Envelope).e2e === 1 && !!(x as Envelope).pw && !!(x as Envelope).data;
}

/* ---------- Familienkonto: Schlüsselpaare und Versiegeln für Eltern ---------- */

export interface KeyPair {
  pub: JsonWebKey;
  priv: JsonWebKey;
}

export async function newKeyPair(): Promise<KeyPair> {
  const kp = (await subtle().generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey'])) as CryptoKeyPair;
  return { pub: await subtle().exportKey('jwk', kp.publicKey), priv: await subtle().exportKey('jwk', kp.privateKey) };
}

export interface SealedFor {
  epk: JsonWebKey; // Einmal-Schlüssel des Absenders
  iv: string;
  ct: string;
}

async function ecdhAes(priv: CryptoKey, pub: CryptoKey): Promise<CryptoKey> {
  return subtle().deriveKey({ name: 'ECDH', public: pub }, priv, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

/** Verschlüsselt Text so, dass nur der Besitzer des privaten Schlüssels zu `pub` ihn lesen kann. */
export async function sealFor(pub: JsonWebKey, text: string): Promise<SealedFor> {
  const eph = (await subtle().generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey'])) as CryptoKeyPair;
  const their = await subtle().importKey('jwk', pub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const s = await seal(await ecdhAes(eph.privateKey, their), enc.encode(text));
  return { epk: await subtle().exportKey('jwk', eph.publicKey), ...s };
}

export async function openSealed(priv: JsonWebKey, box: SealedFor): Promise<string> {
  const mine = await subtle().importKey('jwk', priv, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
  const eph = await subtle().importKey('jwk', box.epk, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  return dec.decode(await open(await ecdhAes(mine, eph), box));
}

/* ---------- Einladungs-Codes ---------- */

/** 8 Zeichen, gut abzutippen (keine 0/O, 1/I). */
export function newInviteCode(): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const r = rand(8);
  return Array.from(r, (x) => abc[x % abc.length]).join('');
}

export function normInvite(c: string): string {
  return c.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export async function hashInvite(code: string): Promise<string> {
  const h = await subtle().digest('SHA-256', enc.encode('habivale-invite:' + normInvite(code)));
  return Array.from(new Uint8Array(h), (b) => b.toString(16).padStart(2, '0')).join('');
}

const INVITE_SALT = enc.encode('habivale-invite-payload-v1');

export async function sealWithCode(code: string, text: string): Promise<Sealed> {
  return seal(await pwKey(normInvite(code), INVITE_SALT, 100000), enc.encode(text));
}

export async function openWithCode(code: string, s: Sealed): Promise<string> {
  return dec.decode(await open(await pwKey(normInvite(code), INVITE_SALT, 100000), s));
}

/** Geheimnis, das nur dieses Gerät kennt (für Kinderprofile ohne Passwort). */
export function randomSecret(): string {
  return b64(rand(32));
}
