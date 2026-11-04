// Las tres zonas, de la más alta a la más profunda, y sus subzonas (data/subzones.ts).
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

// ── Subzonas ──
import { getSubzone, subzonesOf, type SubzoneDef, type SubzoneId } from '../subzones';
export type { SubzoneDef, SubzoneId } from '../subzones';

/**
 * Lo que necesita el generador de mapas y el combate de una subzona: sus criaturas, nombres, botín y luz,
 * más lo común de su zona (llaves de los cofres). Tiene la forma de un ZoneDef, así que el resto del código no cambia.
 */
export function areaDef(sub: SubzoneId | string | undefined, zone?: ZoneId): ZoneDef {
  // Mapas sin subzona (la cripta a mano de la primera expedición, expediciones guardadas antes del cambio): la zona entera
  if (!sub) return getZone(zone);
  const s = getSubzone(sub);
  const z = ZONES[s.zone];
  return {
    ...z, levels: s.levels, enemies: s.enemies, elite: s.elite, boss: s.boss, roomNames: s.roomNames,
    dungeonNames: s.dungeonNames, bossRoom: s.bossRoom, rarity: s.rarity, tint: s.tint, backdrops: s.backdrops,
    ...(s.decor ? { decor: s.decor } : {}),
  } as ZoneDef;
}

/**
 * ¿Puede bajar a esta subzona? Dentro de una zona basta el nivel; para la primera subzona de la Cripta y del
 * Infierno, además, el jefe de la última subzona de la zona anterior (la regla de siempre entre zonas).
 */
export function subzoneLock(sub: SubzoneDef, level: number, bossesDefeated: string[]): string | null {
  const z = ZONES[sub.zone];
  const first = subzonesOf(sub.zone)[0].id === sub.id;
  if (first) return zoneLock(z, level, bossesDefeated) ?? (level < sub.levels[0] ? `Necesitas nivel ${sub.levels[0]}.` : null);
  const zl = zoneLock(z, level, bossesDefeated);
  if (zl) return zl;
  return level < sub.levels[0] ? `Necesitas nivel ${sub.levels[0]}.` : null;
}

/** Subzona a la que se baja si solo se elige la zona: la más honda abierta que corresponde a tu nivel. */
export function defaultSubzone(zone: ZoneId, level: number, bossesDefeated: string[]): SubzoneDef {
  const open = subzonesOf(zone).filter((s) => !subzoneLock(s, level, bossesDefeated));
  return open[open.length - 1] ?? subzonesOf(zone)[0];
}
