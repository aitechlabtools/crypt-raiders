// Las tres zonas, de la más alta a la más profunda.
import { MAZMORRA } from './mazmorra';
import { CRIPTA } from './cripta';
import { INFIERNO } from './infierno';
import type { ZoneDef, ZoneId } from './types';

export type { ZoneDef, ZoneId } from './types';
export const ZONES: Record<ZoneId, ZoneDef> = { mazmorra: MAZMORRA, cripta: CRIPTA, infierno: INFIERNO };
export const ZONE_ORDER: ZoneId[] = ['mazmorra', 'cripta', 'infierno'];

export function getZone(id: ZoneId | undefined): ZoneDef {
  return ZONES[id ?? 'mazmorra'] ?? MAZMORRA;
}

/** Nivel de las criaturas: el tuyo, pero dentro del rango de la zona. */
export function zoneEnemyLevel(zone: ZoneDef, playerLevel: number): number {
  return Math.max(zone.levels[0], Math.min(zone.levels[1], playerLevel));
}

/** ¿Puede bajar el jugador a esta zona? Devuelve null si sí, o el motivo si no. */
export function zoneLock(zone: ZoneDef, level: number, bossesDefeated: string[]): string | null {
  const needBoss = zone.access.bossOf ? ZONES[zone.access.bossOf].boss : null;
  const lacksLevel = level < zone.access.level;
  const lacksBoss = needBoss && !bossesDefeated.includes(needBoss);
  if (lacksLevel && lacksBoss) return `Necesitas nivel ${zone.access.level} y derrotar al jefe de ${ZONES[zone.access.bossOf!].name}.`;
  if (lacksLevel) return `Necesitas nivel ${zone.access.level}.`;
  if (lacksBoss) return `Derrota antes al jefe de ${ZONES[zone.access.bossOf!].name}.`;
  return null;
}
