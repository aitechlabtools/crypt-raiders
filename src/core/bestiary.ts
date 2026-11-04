// Bestiario: lo que sabes de cada criatura según cuántas veces la has visto y derrotado.
import { ENEMIES } from './data/enemies';
import { ZONE_ORDER, type ZoneId } from './data/zones';
import { subzonesOf } from './data/subzones';
import { BESTIARY_BASIC_KILLS, BESTIARY_FULL_KILLS } from '../config/bestiary';

export type BestiaryRecord = Record<string, { seen: number; kills: number }>;
/** 0 = desconocida, 1 = vista, 2 = derrotada (datos básicos), 3 = estudiada (todo). */
export type Knowledge = 0 | 1 | 2 | 3;

export function knowledge(rec: BestiaryRecord, id: string): Knowledge {
  const r = rec[id];
  if (!r || (!r.seen && !r.kills)) return 0;
  if (r.kills >= BESTIARY_FULL_KILLS) return 3;
  if (r.kills >= BESTIARY_BASIC_KILLS) return 2;
  return 1;
}

/** Criaturas de cada zona, en orden: normales, élite y jefe. */
export function bestiaryByZone(): { zone: ZoneId; ids: string[] }[] {
  // Por subzonas, en el orden en que se encuentran: comunes, élite y jefe de cada una
  return ZONE_ORDER.map((z) => {
    const ids: string[] = [];
    for (const s of subzonesOf(z)) for (const id of [...s.enemies.map((e) => e.id), s.elite, s.boss]) if (ENEMIES[id] && !ids.includes(id)) ids.push(id);
    return { zone: z, ids };
  });
}

export function noteSeen(rec: BestiaryRecord, id: string): BestiaryRecord {
  const r = rec[id] ?? { seen: 0, kills: 0 };
  return { ...rec, [id]: { ...r, seen: r.seen + 1 } };
}
export function noteKill(rec: BestiaryRecord, id: string): BestiaryRecord {
  const r = rec[id] ?? { seen: 1, kills: 0 };
  return { ...rec, [id]: { seen: Math.max(1, r.seen), kills: r.kills + 1 } };
}
export function bestiaryProgress(rec: BestiaryRecord): { known: number; total: number } {
  const all = bestiaryByZone().flatMap((z) => z.ids);
  return { known: all.filter((id) => knowledge(rec, id) > 0).length, total: all.length };
}
