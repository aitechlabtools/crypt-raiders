// Persistencia local con IndexedDB (con respaldo en localStorage si no está disponible).
import type { Profile } from '../../core/types';
import { sanitizeProfile } from '../../core/profile';
import { migrateProfileToSave, sanitizeSave, type SaveData } from '../../core/save';

const DB_NAME = 'gravevow';
const LS_PREFIX = 'gravevow.';
/** El juego se llamó DREADBOUND y luego Crypt Raiders (en otro dominio: sus partidas no llegan a gravevow.com). Se conserva la copia desde DREADBOUND por si alguien juega en local. */
const OLD_DB_NAME = 'dreadbound';
const OLD_LS_PREFIX = 'dreadbound.';
const STORE = 'save';
const KEY = 'profile';
/** Partida en formato 3 (cuenta + hasta 4 personajes). La clave antigua `profile` se conserva como respaldo de la migración. */
const SAVE_KEY = 'save';
/** Partida que había antes de la última importación de una copia (para poder deshacerla). */
const UNDO_KEY = 'save-undo';

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

// ── Partida en formato 3 ──
async function rawGet<T>(key: string): Promise<T | undefined> {
  try {
    if (hasIdb()) return await idbGet<T>(key);
  } catch (e) { console.warn('IndexedDB no disponible, usando localStorage', e); }
  try { const raw = localStorage.getItem(LS_PREFIX + key); return raw ? (JSON.parse(raw) as T) : undefined; } catch { return undefined; }
}

async function rawSet(key: string, value: unknown): Promise<void> {
  const data = JSON.parse(JSON.stringify(value));
  try {
    if (hasIdb()) return await idbSet(key, data);
  } catch (e) { console.warn('No se pudo guardar en IndexedDB', e); }
  try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(data)); } catch { /* sin almacenamiento disponible */ }
}

async function rawDel(key: string): Promise<void> {
  try { if (hasIdb()) await idbDel(key); } catch { /* ignorar */ }
  try { localStorage.removeItem(LS_PREFIX + key); } catch { /* ignorar */ }
}

/**
 * Carga la partida. Si aún no hay partida en formato 3 pero sí un perfil antiguo (también el de DREADBOUND),
 * lo convierte: el personaje pasa al hueco 1 y la partida nueva se guarda. El perfil antiguo no se borra.
 */
export async function loadSave(): Promise<SaveData | null> {
  const now = await rawGet<unknown>(SAVE_KEY);
  if (now) {
    const s = sanitizeSave(now);
    if (s) return s;
    console.warn('La partida guardada no se reconoce; se intenta con el perfil antiguo.');
  }
  const old = await loadProfile();
  if (!old) return null;
  const migrated = migrateProfileToSave(old);
  if (migrated) await rawSet(SAVE_KEY, migrated);
  return migrated;
}

export async function saveSave(s: SaveData): Promise<void> {
  await rawSet(SAVE_KEY, s);
}

/** Borra la partida entera (todos los personajes y la cuenta) y el perfil antiguo. */
export async function deleteSave(): Promise<void> {
  await rawDel(SAVE_KEY);
  await deleteProfile();
}

export async function saveUndo(s: SaveData): Promise<void> { await rawSet(UNDO_KEY, { at: Date.now(), save: s }); }
export async function loadUndo(): Promise<{ at: number; save: SaveData } | null> {
  const u = await rawGet<{ at: number; save: unknown }>(UNDO_KEY);
  const save = u ? sanitizeSave(u.save) : null;
  return u && save ? { at: u.at, save } : null;
}
export async function clearUndo(): Promise<void> { await rawDel(UNDO_KEY); }
