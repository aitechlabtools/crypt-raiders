// Copias de seguridad: la partida entera (cuenta y personajes) en un archivo .json o en un código de texto corto.
// Llevan la versión del formato y una firma de comprobación: si alguien edita la copia a mano, se rechaza.
// (No es a prueba de expertos: solo frena la edición sencilla.) Nada sale del dispositivo: lo guarda el jugador.
import { strFromU8, strToU8, deflateSync, inflateSync } from 'fflate';
import { sanitizeSave, type SaveData } from './save';
import { CLASSES } from './data/classes';

export const BACKUP_FORMAT = 'gravevow-backup';
/** Copias hechas cuando el juego se llamaba Gravevow: se siguen aceptando. */
const OLD_BACKUP_FORMAT = 'cryptraiders-backup';
export const BACKUP_VERSION = 1;
/** Versión del juego que hizo la copia (informativa). */
export const GAME_VERSION = 'alpha-0.3';
/** Prefijo del código de texto (GV = Gravevow, 1 = formato del código). */
export const CODE_PREFIX = 'GV1.';
const OLD_CODE_PREFIX = 'CR1.';
const SALT = 'Vark·Hollow·ceniza·7f3a';

export interface BackupSummaryEntry { name: string; classId: string; className: string; level: number; gold: number }
export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  v: number;
  game: string;
  exportedAt: number;
  summary: BackupSummaryEntry[];
  data: SaveData;
  sig: string;
}

/** Resumen (hash) de 64 bits en hexadecimal: cyrb53 aplicado dos veces con semillas distintas. */
function hash(str: string): string {
  const h = (seed: number) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
  };
  return h(1) + h(2);
}

function signature(b: Omit<BackupFile, 'sig'>): string {
  return hash(SALT + JSON.stringify([b.format, b.v, b.game, b.exportedAt, b.data]));
}

export function summarize(save: SaveData): BackupSummaryEntry[] {
  return (Array.isArray(save.characters) ? save.characters : []).map((c) => ({ name: c.character.name, classId: c.character.classId, className: CLASSES[c.character.classId]?.name ?? c.character.classId, level: c.character.level, gold: c.gold }));
}

export function buildBackup(save: SaveData, now = Date.now()): BackupFile {
  const data = JSON.parse(JSON.stringify(save)) as SaveData;
  const base = { format: BACKUP_FORMAT, v: BACKUP_VERSION, game: GAME_VERSION, exportedAt: now, summary: summarize(save), data } as const;
  return { ...base, sig: signature(base) };
}

export function backupToJson(b: BackupFile): string {
  return JSON.stringify(b);
}

/** Código de texto: prefijo + JSON comprimido (deflate) en base64url, para pegarlo en un mensaje. */
export function backupToCode(b: BackupFile): string {
  return CODE_PREFIX + toBase64Url(deflateSync(strToU8(JSON.stringify(b)), { level: 9 }));
}

export function backupFileName(now = Date.now()): string {
  const d = new Date(now);
  const p = (n: number) => String(n).padStart(2, '0');
  return `gravevow-copia-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

export type ParsedBackup = { ok: true; backup: BackupFile; save: SaveData } | { ok: false; error: string };

export const ERR_NOT_BACKUP = 'Esto no parece una copia de Gravevow. Comprueba que has elegido el archivo o pegado el código completo.';
export const ERR_TAMPERED = 'La copia está dañada o se ha modificado a mano, así que no se puede cargar.';
export const ERR_NEWER = 'Esta copia es de una versión más nueva del juego. Recarga la página para tener la última versión y vuelve a probar.';

/** Lee un archivo o un código de copia, comprueba la firma y deja la partida lista (migrada al formato actual). */
export function parseBackup(text: string): ParsedBackup {
  const trimmed = (text ?? '').trim();
  // Un código pegado puede llegar partido en líneas o con espacios: se quitan. Un archivo .json se lee tal cual.
  const t0 = trimmed.startsWith('{') ? trimmed : trimmed.replace(/\s+/g, '');
  const t = t0.startsWith(OLD_CODE_PREFIX) ? CODE_PREFIX + t0.slice(OLD_CODE_PREFIX.length) : t0;
  let raw: unknown;
  try {
    if (t.startsWith(CODE_PREFIX)) raw = JSON.parse(strFromU8(inflateSync(fromBase64Url(t.slice(CODE_PREFIX.length)))));
    else if (t.startsWith('{')) raw = JSON.parse(t);
    else return { ok: false, error: ERR_NOT_BACKUP };
  } catch {
    return { ok: false, error: t.startsWith(CODE_PREFIX) ? ERR_TAMPERED + ' (¿Falta algún trozo del código?)' : ERR_NOT_BACKUP };
  }
  const b = raw as Partial<BackupFile>;
  if (!b || typeof b !== 'object' || (b.format !== BACKUP_FORMAT && b.format !== OLD_BACKUP_FORMAT) || typeof b.v !== 'number') return { ok: false, error: ERR_NOT_BACKUP };
  if (b.v > BACKUP_VERSION) return { ok: false, error: ERR_NEWER };
  const { sig, ...rest } = b as BackupFile;
  if (typeof sig !== 'string' || sig !== signature(rest)) return { ok: false, error: ERR_TAMPERED };
  // Los datos pasan por la misma migración que al cargar del navegador: las copias antiguas se ponen al día
  const save = sanitizeSave(b.data);
  if (!save) return { ok: false, error: ERR_NEWER };
  return { ok: true, backup: b as BackupFile, save };
}


// ── base64url sin dependencias del navegador (funciona igual en los tests) ──
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function toBase64Url(u8: Uint8Array): string {
  let out = '';
  for (let i = 0; i < u8.length; i += 3) {
    const n = (u8[i] << 16) | ((u8[i + 1] ?? 0) << 8) | (u8[i + 2] ?? 0);
    out += ABC[(n >> 18) & 63] + ABC[(n >> 12) & 63];
    if (i + 1 < u8.length) out += ABC[(n >> 6) & 63];
    if (i + 2 < u8.length) out += ABC[n & 63];
  }
  return out;
}
function fromBase64Url(s: string): Uint8Array {
  const clean = s.replace(/[^A-Za-z0-9\-_]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const v = [0, 1, 2, 3].map((k) => (i + k < clean.length ? ABC.indexOf(clean[i + k]) : 0));
    if (v.some((x) => x < 0)) throw new Error('código no válido');
    const n = (v[0] << 18) | (v[1] << 12) | (v[2] << 6) | v[3];
    if (o < out.length) out[o++] = (n >> 16) & 255;
    if (o < out.length) out[o++] = (n >> 8) & 255;
    if (o < out.length) out[o++] = n & 255;
  }
  return out;
}

// ── Recordatorio ──
export const BACKUP_REMIND_DAYS = 7;
export const BACKUP_REMIND_EXPEDITIONS = 10;

/** Expediciones hechas entre todos los personajes (para saber cuántas van desde la última copia). */
export function totalExpeditions(save: SaveData): number {
  return save.characters.reduce((a, c) => a + (c.stats?.expeditions ?? 0), 0);
}

export interface BackupStatus { lastAt: number | null; days: number | null; expeditionsSince: number; remind: boolean }

export function backupStatus(save: SaveData, now = Date.now()): BackupStatus {
  const b = save.account.backup;
  const total = totalExpeditions(save);
  const since = Math.max(0, total - (b.expeditionsAt ?? 0));
  const days = b.lastAt ? Math.floor((now - b.lastAt) / 86400000) : null;
  // Sin ninguna copia: se recuerda cuando ya hay algo que perder (alguna expedición hecha)
  const remind = b.lastAt === null ? total >= 1 : days! >= BACKUP_REMIND_DAYS || since >= BACKUP_REMIND_EXPEDITIONS;
  return { lastAt: b.lastAt, days, expeditionsSince: since, remind };
}

export function backupAgoLabel(st: BackupStatus): string {
  if (st.lastAt === null) return 'Aún no has hecho ninguna copia';
  if (st.days === 0) return 'Última copia: hoy';
  if (st.days === 1) return 'Última copia: ayer';
  return `Última copia: hace ${st.days} días`;
}
