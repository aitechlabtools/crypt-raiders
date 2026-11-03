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

async function idbGet<T>(key: string, name = DB_NAME): Promise<T | undefined> {
  const db = await openDb(name);
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

async function idbDel(key: string, name = DB_NAME): Promise<void> {
  const db = await openDb(name);
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
      const old = await idbGet<Profile>(KEY, OLD_DB_NAME);
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
    if (hasIdb()) { await idbDel(KEY); await idbDel(KEY, OLD_DB_NAME); }
  } catch { /* ignorar */ }
  try { localStorage.removeItem(LS_PREFIX + KEY); localStorage.removeItem(OLD_LS_PREFIX + KEY); } catch { /* ignorar */ }
}
