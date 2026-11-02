// Definición de una zona de la mazmorra. Todo son datos: añadir una zona = añadir un archivo como estos.
import type { LootTable } from '../../loot';
import type { Rarity } from '../../types';

export type ZoneId = 'mazmorra' | 'cripta' | 'infierno';

export interface ZoneDef {
  id: ZoneId;
  name: string;
  /** Texto corto para la tarjeta de selección. */
  tagline: string;
  /** Rango de niveles de la zona: las criaturas toman tu nivel, pero nunca bajan del mínimo ni pasan del máximo. */
  levels: [number, number];
  /** Requisitos para bajar: nivel mínimo y jefe de la zona anterior derrotado al menos una vez. */
  access: { level: number; bossOf?: ZoneId };
  /** Criaturas normales: peso de aparición y desde qué profundidad de sala aparecen (0 = en cualquier sala). */
  enemies: { id: string; weight: number; minDepth?: number }[];
  elite: string;
  boss: string;
  /** Nombres de las salas del mapa procedural. */
  roomNames: string[];
  dungeonNames: string[];
  bossRoom: string;
  /** Cofres de la zona: claves de CHEST_TABLES. */
  chests: { common: string; rich: string; boss: string };
  /** Probabilidad (peso) de cada rareza en el botín de equipo de la zona. */
  rarity: Record<Rarity, number>;
  /** Tinte de la iluminación del mapa (multiplica rojo, verde, azul). */
  tint: [number, number, number];
  /** Escenarios de combate de la zona (ver ui/combatZones.ts). El primero es el del jefe. */
  backdrops: string[];
}

/** Construye una tabla de botín repartiendo el peso de cada rareza entre los objetos de esa rareza. */
export function rarityTable(items: { id: string; rarity: Rarity }[], rarity: Record<Rarity, number>, base: Omit<LootTable, 'entries'>, extras: LootTable['entries'] = [], gearShare = 60): LootTable {
  const byR = new Map<Rarity, string[]>();
  for (const it of items) byR.set(it.rarity, [...(byR.get(it.rarity) ?? []), it.id]);
  const total = Object.entries(rarity).reduce((s, [r, w]) => s + (byR.has(r as Rarity) ? w : 0), 0) || 1;
  const entries: LootTable['entries'] = [...extras];
  for (const [r, ids] of byR) {
    const w = (rarity[r] ?? 0) / total * gearShare;
    if (w <= 0) continue;
    for (const id of ids) entries.push({ itemId: id, weight: Math.round((w / ids.length) * 100) / 100 });
  }
  return { ...base, entries };
}
