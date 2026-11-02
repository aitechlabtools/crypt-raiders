import type { CharacterData, Equipment, Stats } from './types';
import type { Combatant, Side } from './combat';
import { CLASSES } from './data/classes';
import { getEnemy } from './data/enemies';
import { computeStats } from './stats';

export function playerCombatant(ch: CharacterData, equipment: Equipment, hp: number, mp: number): Combatant {
  const cls = CLASSES[ch.classId];
  const stats = computeStats(ch.classId, ch.level, equipment);
  return {
    id: 'player', name: ch.name, side: 'A', sprite: `hero_${ch.classId}`,
    stats, hp: Math.min(hp, stats.maxHp), mp: Math.min(mp, stats.maxMp),
    resourceName: cls.resourceName, resourceRegen: cls.resourceRegen,
    statuses: [], skills: [...cls.skills], basicAttack: cls.basicAttack,
    control: 'player', skillChance: 0, undead: false, defending: false, potions: 0,
  };
}

export function enemyCombatant(enemyId: string, instanceId: string, side: Side = 'B'): Combatant {
  const e = getEnemy(enemyId);
  return {
    id: instanceId, name: e.name, side, sprite: e.sprite,
    stats: { ...e.stats }, hp: e.stats.maxHp, mp: 0,
    resourceName: '—', resourceRegen: 0, statuses: [], skills: [...e.skills],
    basicAttack: e.basicAttack, control: 'ai', skillChance: e.skillChance,
    undead: e.undead, defending: false, potions: 0, boss: e.boss, ref: enemyId,
  };
}

// ── Aventurero rival controlado por IA (Kael) ──
export const RIVAL_STATS: Stats = { maxHp: 105, maxMp: 30, atk: 17, def: 9, mag: 4, res: 8, spd: 14, crit: 12, eva: 10 };
export const RIVAL_NAME = 'Kael el Errante';

export function rivalCombatant(hp: number, side: Side, potions: number): Combatant {
  return {
    id: 'rival', name: RIVAL_NAME, side, sprite: 'rival',
    stats: { ...RIVAL_STATS }, hp: Math.max(1, Math.min(hp, RIVAL_STATS.maxHp)), mp: 20,
    resourceName: 'Energía', resourceRegen: 3, statuses: [], skills: ['venom_strike', 'backstab'],
    basicAttack: { name: 'Cuchillada', kind: 'physical', power: 1, fx: 'slash' },
    control: 'ai', skillChance: 0.45, undead: false, defending: false, potions, ref: 'rival',
  };
}
