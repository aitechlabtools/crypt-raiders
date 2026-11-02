import { ENEMY_SCALE_PER_LEVEL, ENEMY_XP_PER_LEVEL } from '../config/progression';
import type { CharacterData, Equipment, Stats } from './types';
import type { Combatant, Side } from './combat';
import { CLASSES } from './data/classes';
import { getEnemy } from './data/enemies';
import { computeStats } from './stats';
import { combatLoadout } from './loadout';

export function playerCombatant(ch: CharacterData, equipment: Equipment, hp: number, mp: number): Combatant {
  const cls = CLASSES[ch.classId];
  const stats = computeStats(ch.classId, ch.level, equipment);
  const kit = combatLoadout(ch.classId, equipment);
  return {
    id: 'player', name: ch.name, side: 'A', sprite: `hero_${ch.classId}`,
    stats, hp: Math.min(hp, stats.maxHp), mp: Math.min(mp, stats.maxMp),
    resourceName: cls.resourceName, resourceRegen: cls.resourceRegen,
    statuses: [], skills: kit.skills, basicAttack: kit.basicAttack,
    control: 'player', skillChance: 0, undead: false, defending: false, potions: 0,
  };
}

/** Las criaturas se hacen más duras según su nivel (ver config/progression.ts). */
export function levelScale(level: number): number {
  return 1 + ENEMY_SCALE_PER_LEVEL * (Math.max(1, level) - 1);
}

/** Experiencia que da una criatura de cierto nivel. */
export function enemyXp(baseXp: number, level: number): number {
  return Math.round(baseXp * (1 + ENEMY_XP_PER_LEVEL * (Math.max(1, level) - 1)));
}

export function enemyCombatant(enemyId: string, instanceId: string, side: Side = 'B', level = 1): Combatant {
  const e = getEnemy(enemyId);
  const k = levelScale(level);
  const stats = { ...e.stats };
  for (const key of ['maxHp', 'atk', 'def', 'mag', 'res'] as const) stats[key] = Math.round(stats[key] * k);
  return {
    id: instanceId, name: e.name, side, sprite: e.sprite,
    stats, hp: stats.maxHp, mp: 0,
    resourceName: '—', resourceRegen: 0, statuses: [], skills: [...e.skills],
    basicAttack: e.basicAttack, control: 'ai', skillChance: e.skillChance,
    undead: e.undead, defending: false, potions: 0, boss: e.boss, ref: enemyId,
  };
}

/** Vida de Kael tras un combate, de vuelta a su escala base. */
export function rivalHpBack(hp: number, level = 1): number {
  return hp <= 0 ? 0 : Math.max(1, Math.round(hp / levelScale(level)));
}

// ── Aventurero rival controlado por IA (Kael) ──
export const RIVAL_STATS: Stats = { maxHp: 105, maxMp: 30, atk: 17, def: 9, mag: 4, res: 8, spd: 14, crit: 12, eva: 10 };
export const RIVAL_NAME = 'Kael el Errante';

/** Kael crece con la zona igual que las criaturas. Su vida se guarda en la escala base (máx. 105) y se convierte al entrar en combate. */
export function rivalCombatant(hp: number, side: Side, potions: number, level = 1): Combatant {
  const k = levelScale(level);
  const stats = { ...RIVAL_STATS };
  for (const key of ['maxHp', 'atk', 'def', 'mag', 'res'] as const) stats[key] = Math.round(stats[key] * k);
  return {
    id: 'rival', name: RIVAL_NAME, side, sprite: 'rival',
    stats, hp: Math.max(1, Math.min(Math.round(hp * k), stats.maxHp)), mp: 20,
    resourceName: 'Energía', resourceRegen: 3, statuses: [], skills: ['venom_strike', 'backstab'],
    basicAttack: { name: 'Cuchillada', kind: 'physical', power: 1, fx: 'slash' },
    control: 'ai', skillChance: 0.45, undead: false, defending: false, potions, ref: 'rival',
  };
}
