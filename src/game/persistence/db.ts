// Persistencia local con IndexedDB (con respaldo en localStorage si no está disponible).
import type { Profile } from '../../core/types';
import { sanitizeProfile } from '../../core/profile';

const DB_NAME = 'cryptraiders';
const LS_PREFIX = 'cryptraiders.';
/** El juego se llamaba DREADBOUND: las partidas guardadas con ese nombre se copian al nuevo la primera vez. */
const OLD_DB_NAME = 'dreadbound';
const OLD_LS_PREFIX = 'dreadbound.';
const STORE = 'save';
const KEY = 'profile';

function openDb(name = DB_NAME): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Abre la base antigua solo si ya existe: mirar si hay partida de DREADBOUND no debe crear una base vacía. */
function openOldDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    const req = indexedDB.open(OLD_DB_NAME, 1);
    req.onupgradeneeded = () => req.transaction?.abort(); // no existía: se cancela y no se crea
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function oldGet<T>(key: string): Promise<T | undefined> {
  const db = await openOldDb();
  if (!db) return undefined;
  try {
    if (!db.objectStoreNames.contains(STORE)) return undefined;
    return await new Promise((resolve, reject) => {
      const r = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      r.onsuccess = () => resolve(r.result as T | undefined);
      r.onerror = () => reject(r.error);
    });
  } finally { db.close(); }
}

async function oldDel(key: string): Promise<void> {
  const db = await openOldDb();
  if (!db) return;
  try {
    if (!db.objectStoreNames.contains(STORE)) return;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const r = tx.objectStore(STORE).get(key);
    r.onsuccess = () => resolve(r.result as T | undefined);
    r.onerror = () => reject(r.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDel(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const hasIdb = () => typeof indexedDB !== 'undefined';

export async function loadProfile(): Promise<Profile | null> {
  try {
    if (hasIdb()) {
      const now = await idbGet<Profile>(KEY);
      if (now) return sanitizeProfile(now);
      // Partida guardada con el nombre antiguo del juego: se copia al nuevo (la antigua no se borra).
      const old = await oldGet<Profile>(KEY);
      if (old) { await idbSet(KEY, old); return sanitizeProfile(old); }
      return sanitizeProfile(undefined);
    }
  } catch (e) {
    console.warn('IndexedDB no disponible, usando localStorage', e);
  }
  try {
    const raw = localStorage.getItem(LS_PREFIX + KEY) ?? localStorage.getItem(OLD_LS_PREFIX + KEY);
    return raw ? sanitizeProfile(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export async function saveProfile(p: Profile): Promise<void> {
  const data = JSON.parse(JSON.stringify(p));
  try {
    if (hasIdb()) return await idbSet(KEY, data);
  } catch (e) {
    console.warn('No se pudo guardar en IndexedDB', e);
  }
  try {
    localStorage.setItem(LS_PREFIX + KEY, JSON.stringify(data));
  } catch {
    /* sin almacenamiento disponible */
  }
}

export async function deleteProfile(): Promise<void> {
  // También la copia con el nombre antiguo: si no, volvería a aparecer al recargar.
  try {
    if (hasIdb()) { await idbDel(KEY); await oldDel(KEY); }
  } catch { /* ignorar */ }
  try { localStorage.removeItem(LS_PREFIX + KEY); localStorage.removeItem(OLD_LS_PREFIX + KEY); } catch { /* ignorar */ }
}
