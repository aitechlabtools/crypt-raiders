// ════════════════════════════════════════════════════════════════════
// ZONA 1 · LA MAZMORRA (niveles 1–30)
// Galerías de piedra y cavernas húmedas. Sus objetos son los de data/items.ts. Todo es editable.
// ════════════════════════════════════════════════════════════════════
import type { EnemyDef } from '../enemies';
import type { ZoneDef } from './types';

/** Criaturas nuevas de la Mazmorra (el esqueleto, el murciélago y el Señor del Osario están en enemies.ts). */
export const MAZMORRA_ENEMIES: Record<string, EnemyDef> = {
  bandit: {
    id: 'bandit', name: 'Bandido saqueador', sprite: 'bandit', role: 'Cuerpo a cuerpo',
    stats: { maxHp: 56, maxMp: 0, atk: 15, def: 6, mag: 0, res: 4, spd: 11, crit: 9, eva: 8 },
    skills: ['dirty_cut', 'low_blow'], skillChance: 0.4,
    basicAttack: { name: 'Cuchillada', kind: 'physical', power: 1, fx: 'slash' },
    xp: 40, undead: false,
    loot: { rolls: 1, gold: [8, 22], entries: [{ itemId: 'old_coin', weight: 35, min: 1, max: 3 }, { itemId: 'health_potion', weight: 15 }, { itemId: 'iron_key', weight: 5 }, { itemId: 'leather_gloves', weight: 6 }, { itemId: 'nothing', weight: 44 }] },
    wander: { speed: 1.7, aggroRange: 3.5 },
  },
  renegade_archer: {
    id: 'renegade_archer', name: 'Arquero renegado', sprite: 'archer', role: 'A distancia',
    stats: { maxHp: 42, maxMp: 0, atk: 16, def: 4, mag: 0, res: 4, spd: 12, crit: 10, eva: 10 },
    skills: ['aimed_shot'], skillChance: 0.45,
    basicAttack: { name: 'Flecha', kind: 'physical', power: 1, fx: 'slash' },
    xp: 38, undead: false,
    loot: { rolls: 1, gold: [5, 18], entries: [{ itemId: 'old_coin', weight: 25 }, { itemId: 'leather_hood', weight: 6 }, { itemId: 'nothing', weight: 69 }] },
    wander: { speed: 1.4, aggroRange: 4.5 },
  },
  ossuary_rat: {
    id: 'ossuary_rat', name: 'Rata de osario', sprite: 'rat', role: 'Enjambre',
    stats: { maxHp: 30, maxMp: 0, atk: 10, def: 3, mag: 0, res: 3, spd: 15, crit: 6, eva: 14 },
    skills: ['plague_bite'], skillChance: 0.45,
    basicAttack: { name: 'Mordisco', kind: 'physical', power: 0.9, fx: 'bite' },
    xp: 24, undead: false,
    loot: { rolls: 1, gold: [0, 6], entries: [{ itemId: 'bone_dust', weight: 40 }, { itemId: 'nothing', weight: 60 }] },
    wander: { speed: 2.2, aggroRange: 4 },
  },
  bandit_captain: {
    id: 'bandit_captain', name: 'Capitán de bandidos', sprite: 'captain', role: 'Élite', elite: true,
    stats: { maxHp: 190, maxMp: 0, atk: 28, def: 13, mag: 0, res: 10, spd: 9, crit: 9, eva: 5 },
    skills: ['rally_cry', 'dirty_cut', 'bone_bash'], skillChance: 0.45,
    basicAttack: { name: 'Sable', kind: 'physical', power: 1.05, fx: 'slash' },
    xp: 110, undead: false,
    loot: { rolls: 2, gold: [25, 60], always: [{ itemId: 'iron_key' }], entries: [{ itemId: 'golden_chalice', weight: 18 }, { itemId: 'old_coin', weight: 25, min: 2, max: 5 }, { itemId: 'knight_sword', weight: 6 }, { itemId: 'iron_shield', weight: 8 }, { itemId: 'chainmail', weight: 8 }, { itemId: 'ring_of_embers', weight: 5 }, { itemId: 'shadow_robe', weight: 6 }, { itemId: 'frost_staff', weight: 6 }] },
    wander: { speed: 1, aggroRange: 3 },
  },
};

export const MAZMORRA: ZoneDef = {
  id: 'mazmorra', name: 'La Mazmorra', tagline: 'Galerías de piedra y cavernas húmedas. Bandidos, bestias y los primeros muertos inquietos.',
  levels: [1, 30], access: { level: 1 },
  enemies: [{ id: 'skeleton', weight: 25 }, { id: 'bat', weight: 22 }, { id: 'ossuary_rat', weight: 18 }, { id: 'bandit', weight: 20, minDepth: 1 }, { id: 'renegade_archer', weight: 15, minDepth: 1 }],
  elite: 'bandit_captain', boss: 'ossuary_lord',
  roomNames: [],
  dungeonNames: [],
  bossRoom: 'Trono del Osario',
  chests: { common: 'common', rich: 'rich', boss: 'boss' },
  rarity: { common: 60, uncommon: 28, rare: 10, epic: 2, legendary: 0 },
  tint: [1, 1, 1],
  backdrops: ['osario', 'cripta', 'cavernas'],
};
