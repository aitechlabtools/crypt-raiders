// Persistencia local con IndexedDB (con respaldo en localStorage si no está disponible).
import type { Profile } from '../../core/types';
import { sanitizeProfile } from '../../core/profile';

const DB_NAME = 'dreadbound';
const STORE = 'save';
const KEY = 'profile';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
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
    if (hasIdb()) return sanitizeProfile(await idbGet<Profile>(KEY));
  } catch (e) {
    console.warn('IndexedDB no disponible, usando localStorage', e);
  }
  try {
    const raw = localStorage.getItem('dreadbound.' + KEY);
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
    localStorage.setItem('dreadbound.' + KEY, JSON.stringify(data));
  } catch {
    /* sin almacenamiento disponible */
  }
}

export async function deleteProfile(): Promise<void> {
  try {
    if (hasIdb()) await idbDel(KEY);
  } catch { /* ignorar */ }
  try { localStorage.removeItem('dreadbound.' + KEY); } catch { /* ignorar */ }
}
