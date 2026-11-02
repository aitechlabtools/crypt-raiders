// ════════════════════════════════════════════════════════════════════
// ZONA 3 · EL INFIERNO (niveles 60–100)
// Obsidiana, ríos de lava y cadenas. Lo más hondo. Todo es editable.
// ════════════════════════════════════════════════════════════════════
import type { ItemDef } from '../../types';
import type { EnemyDef } from '../enemies';
import type { LootTable } from '../../loot';
import { SLASH, CHOP, BOLT } from '../attacks';
import { rarityTable, type ZoneDef } from './types';

const W = ['warrior'] as const;
const M = ['mage'] as const;

export const INFIERNO_ITEMS: ItemDef[] = [
  // Armas
  { id: 'obsidian_sword', name: 'Espada de obsidiana', description: 'Corta y no se mella. Nunca.', icon: 'sword_dread', category: 'weapon', slot: 'mainHand', family: 'sword', rarity: 'uncommon', value: 700, levelReq: 60, stats: { atk: 34, crit: 5 }, classes: [...W], attack: SLASH, grants: ['rending_slash', 'thrust', 'pommel_strike'] },
  { id: 'hellforged_blade', name: 'Hoja forjada en el abismo', description: 'Aún humea cuando la desenvainas.', icon: 'sword_dread', category: 'weapon', slot: 'mainHand', family: 'sword', rarity: 'epic', value: 2400, levelReq: 82, stats: { atk: 50, crit: 8, def: 4 }, classes: [...W], attack: SLASH, grants: ['rending_slash', 'pommel_strike', 'dread_cut'] },
  { id: 'chain_axe', name: 'Hacha de cadenas', description: 'La hoja va unida al mango por eslabones al rojo.', icon: 'axe_exec', category: 'weapon', slot: 'mainHand', family: 'axe', rarity: 'rare', value: 1300, levelReq: 70, stats: { atk: 44, crit: 6, spd: -1 }, classes: [...W], attack: CHOP, grants: ['brutal_blow', 'skull_splitter', 'reaping'] },
  { id: 'sulfur_staff', name: 'Báculo de azufre', description: 'Apesta. Y quema.', icon: 'staff_fire', category: 'weapon', slot: 'mainHand', family: 'staff', rarity: 'uncommon', value: 700, levelReq: 60, stats: { mag: 33, maxMp: 22 }, classes: [...M], attack: BOLT, grants: ['fireball', 'ember_rain', 'spark'] },
  { id: 'abyss_scepter', name: 'Cetro del abismo', description: 'En su punta gira una brasa que no se apaga.', icon: 'staff_rune', category: 'weapon', slot: 'mainHand', family: 'staff', rarity: 'epic', value: 2400, levelReq: 82, stats: { mag: 50, maxMp: 34, crit: 7 }, classes: [...M], attack: BOLT, grants: ['fireball', 'blizzard', 'dark_nova'] },
  // Secundarias
  { id: 'demonscale_shield', name: 'Escudo de escama demoníaca', description: 'La escama aún late.', icon: 'shield_iron', category: 'shield', slot: 'offHand', family: 'shield', rarity: 'rare', value: 1200, levelReq: 68, stats: { def: 23, res: 10, maxHp: 44 }, classes: ['warrior', 'cleric'], grants: ['block', 'shield_bash', 'iron_wall'] },
  { id: 'burning_tome', name: 'Tomo ardiente', description: 'Las páginas arden y vuelven a escribirse.', icon: 'tome_dark', category: 'relic', slot: 'offHand', family: 'tome', rarity: 'rare', value: 1200, levelReq: 68, stats: { mag: 17, maxMp: 40, res: 10, maxHp: 30 }, classes: ['mage'], grants: ['arcane_barrier', 'mana_siphon'] },
  // Armaduras
  { id: 'hellsteel_helm', name: 'Yelmo de acero infernal', description: 'Con cuernos. Por si había dudas.', icon: 'helm_knight', category: 'helmet', slot: 'helmet', rarity: 'rare', value: 1100, levelReq: 66, stats: { def: 17, maxHp: 58, res: 8 }, classes: ['warrior'] },
  { id: 'ash_cowl', name: 'Capucha de ceniza', description: 'Te protege del calor. Del resto, no.', icon: 'hood', category: 'helmet', slot: 'helmet', rarity: 'uncommon', value: 620, levelReq: 62, stats: { mag: 12, res: 13, maxHp: 32, def: 5 }, classes: ['mage'] },
  { id: 'hellsteel_plate', name: 'Armadura de acero infernal', description: 'Forjada para un caballero que no volvió a ser humano.', icon: 'plate', category: 'armor', slot: 'armor', rarity: 'epic', value: 2300, levelReq: 80, stats: { def: 31, maxHp: 90, res: 13, spd: -1 }, classes: ['warrior'] },
  { id: 'ash_robe', name: 'Túnica de ceniza', description: 'Tejida con el humo de mil hogueras.', icon: 'robe_gold', category: 'armor', slot: 'armor', rarity: 'rare', value: 1150, levelReq: 70, stats: { def: 19, res: 26, mag: 17, maxMp: 30, maxHp: 75 }, classes: ['mage'] },
  { id: 'demon_gauntlets', name: 'Garras del demonio', description: 'Guanteletes con uñas que no son de metal.', icon: 'gauntlets', category: 'gloves', slot: 'gloves', rarity: 'rare', value: 980, levelReq: 66, stats: { atk: 9, def: 7, crit: 3 }, classes: ['warrior', 'cleric'] },
  { id: 'cinder_boots', name: 'Botas de brasa', description: 'Dejan huellas humeantes.', icon: 'boots_swift', category: 'boots', slot: 'boots', rarity: 'rare', value: 980, levelReq: 68, stats: { spd: 7, eva: 7, def: 5 } },
  { id: 'ember_ring', name: 'Anillo de brasa', description: 'Nunca se enfría. Tu dedo, tampoco.', icon: 'ring_red', category: 'jewel', slot: 'ring', rarity: 'rare', value: 1100, levelReq: 72, stats: { atk: 8, mag: 8, crit: 5 } },
  { id: 'heart_of_belzar', name: 'Corazón de Belzar', description: 'Arde dentro de su jaula de cadenas.', icon: 'amulet_heart', category: 'jewel', slot: 'amulet', rarity: 'legendary', value: 4000, levelReq: 88, stats: { maxHp: 80, atk: 14, mag: 14, res: 12, def: 8 } },
  // Materiales y tesoros
  { id: 'obsidian_shard', name: 'Esquirla de obsidiana', description: 'Cristal volcánico, afilado como una mala noticia.', icon: 'gem_red', category: 'material', rarity: 'uncommon', value: 60, stack: 10 },
  { id: 'sulfur', name: 'Azufre', description: 'Amarillo, apestoso y muy útil en la forja.', icon: 'dust', category: 'material', rarity: 'common', value: 40, stack: 10 },
  { id: 'demon_blood', name: 'Sangre de demonio', description: 'Hierve dentro del frasco.', icon: 'potion_red', category: 'material', rarity: 'rare', value: 110, stack: 10 },
  { id: 'infernal_crown_shard', name: 'Fragmento de corona infernal', description: 'Oro fundido y vuelto a solidificar en el dolor.', icon: 'chalice', category: 'relic', rarity: 'epic', value: 1200, stack: 1 },
];

const gear = INFIERNO_ITEMS.filter((i) => i.slot);

export const INFIERNO_ENEMIES: Record<string, EnemyDef> = {
  ember_imp: {
    id: 'ember_imp', name: 'Diablillo de brasas', sprite: 'imp', role: 'Rápido',
    stats: { maxHp: 50, maxMp: 0, atk: 14, def: 6, mag: 17, res: 8, spd: 18, crit: 9, eva: 16 },
    skills: ['ember_spit'], skillChance: 0.5,
    basicAttack: { name: 'Zarpazo ardiente', kind: 'physical', power: 0.9, fx: 'fire' },
    xp: 40, undead: false,
    loot: { rolls: 1, gold: [20, 50], entries: [{ itemId: 'sulfur', weight: 55, min: 1, max: 2 }, { itemId: 'nothing', weight: 45 }] },
    wander: { speed: 2.4, aggroRange: 4.5 },
  },
  abyss_hound: {
    id: 'abyss_hound', name: 'Can del abismo', sprite: 'hound', role: 'Bestia',
    stats: { maxHp: 78, maxMp: 0, atk: 21, def: 8, mag: 0, res: 7, spd: 15, crit: 10, eva: 8 },
    skills: ['savage_maul'], skillChance: 0.4,
    basicAttack: { name: 'Mordisco', kind: 'physical', power: 1, fx: 'bite' },
    xp: 48, undead: false,
    loot: { rolls: 1, gold: [20, 50], entries: [{ itemId: 'demon_blood', weight: 25 }, { itemId: 'sulfur', weight: 30 }, { itemId: 'nothing', weight: 45 }] },
    wander: { speed: 2.2, aggroRange: 4.5 },
  },
  pit_temptress: {
    id: 'pit_temptress', name: 'Tentadora del pozo', sprite: 'temptress', role: 'Control',
    stats: { maxHp: 64, maxMp: 0, atk: 9, def: 7, mag: 21, res: 14, spd: 12, crit: 6, eva: 10 },
    skills: ['mesmerize', 'brimstone'], skillChance: 0.55,
    basicAttack: { name: 'Látigo', kind: 'physical', power: 0.9, fx: 'slash' },
    xp: 52, undead: false,
    loot: { rolls: 1, gold: [24, 60], entries: [{ itemId: 'demon_blood', weight: 30 }, { itemId: 'mana_potion', weight: 20 }, { itemId: 'nothing', weight: 50 }] },
    wander: { speed: 1.5, aggroRange: 4 },
  },
  hell_knight: {
    id: 'hell_knight', name: 'Caballero infernal', sprite: 'hell_knight', role: 'Tanque',
    stats: { maxHp: 116, maxMp: 0, atk: 20, def: 17, mag: 0, res: 11, spd: 6, crit: 6, eva: 1 },
    skills: ['hell_cleave', 'block'], skillChance: 0.4,
    basicAttack: { name: 'Espadón al rojo', kind: 'physical', power: 1, fx: 'slash' },
    xp: 62, undead: false,
    loot: { rolls: 1, gold: [26, 64], entries: [{ itemId: 'obsidian_shard', weight: 40, min: 1, max: 2 }, { itemId: 'nothing', weight: 60 }] },
    wander: { speed: 0.9, aggroRange: 3 },
  },
  sulfur_caller: {
    id: 'sulfur_caller', name: 'Invocador de azufre', sprite: 'sulfur_caller', role: 'Lanzador',
    stats: { maxHp: 60, maxMp: 0, atk: 8, def: 6, mag: 22, res: 12, spd: 9, crit: 6, eva: 5 },
    skills: ['brimstone', 'dark_mend'], skillChance: 0.55,
    basicAttack: { name: 'Chispa de azufre', kind: 'magical', power: 0.9, fx: 'fire' },
    xp: 54, undead: false,
    loot: { rolls: 1, gold: [24, 60], entries: [{ itemId: 'sulfur', weight: 45, min: 1, max: 3 }, { itemId: 'mana_potion', weight: 15 }, { itemId: 'sulfur_key', weight: 4 }, { itemId: 'nothing', weight: 36 }] },
    wander: { speed: 1.1, aggroRange: 3.5 },
  },
  chain_warden: {
    id: 'chain_warden', name: 'Carcelero de cadenas', sprite: 'chain_warden', role: 'Élite', elite: true,
    stats: { maxHp: 160, maxMp: 0, atk: 23, def: 15, mag: 10, res: 12, spd: 8, crit: 8, eva: 3 },
    skills: ['chain_bind', 'hell_cleave', 'abyssal_rage'], skillChance: 0.5,
    basicAttack: { name: 'Mangual', kind: 'physical', power: 1.05, fx: 'smash' },
    xp: 140, undead: false,
    loot: { rolls: 2, gold: [60, 140], always: [{ itemId: 'sulfur_key' }], entries: [{ itemId: 'obsidian_shard', weight: 25, min: 2, max: 3 }, { itemId: 'demon_blood', weight: 20 }, ...gear.filter((g) => g.rarity === 'rare').map((g) => ({ itemId: g.id, weight: 6 }))] },
    wander: { speed: 0.9, aggroRange: 3 },
  },
  belzar: {
    id: 'belzar', name: 'Belzar, Señor de las Cadenas', sprite: 'belzar', boss: true, role: 'Jefe',
    stats: { maxHp: 320, maxMp: 0, atk: 26, def: 15, mag: 24, res: 15, spd: 9, crit: 9, eva: 3 },
    skills: ['chain_bind', 'hellfire', 'abyssal_rage'], skillChance: 0.55,
    basicAttack: { name: 'Cadena ardiente', kind: 'physical', power: 1.05, fx: 'smash' },
    xp: 900, undead: false,
    loot: { rolls: 2, gold: [260, 480], always: [{ itemId: 'relic_key' }], entries: [{ itemId: 'infernal_crown_shard', weight: 25 }, { itemId: 'heart_of_belzar', weight: 5 }, ...gear.filter((g) => g.rarity === 'epic' || g.rarity === 'rare').map((g) => ({ itemId: g.id, weight: 8 }))] },
    wander: { speed: 0.7, aggroRange: 3 },
  },
};

export const INFIERNO: ZoneDef = {
  id: 'infierno', name: 'El Infierno', tagline: 'Obsidiana, lava y cadenas. Lo que vive aquí nunca fue humano.',
  levels: [60, 100], access: { level: 60, bossOf: 'cripta' },
  enemies: [{ id: 'ember_imp', weight: 30 }, { id: 'abyss_hound', weight: 25 }, { id: 'pit_temptress', weight: 15, minDepth: 1 }, { id: 'hell_knight', weight: 15, minDepth: 2 }, { id: 'sulfur_caller', weight: 15, minDepth: 2 }],
  elite: 'chain_warden', boss: 'belzar',
  roomNames: ['Pozo de Brasas', 'Puente de Obsidiana', 'Fragua del Abismo', 'Sala de las Cadenas', 'Lago de Lava', 'Galería de Azufre', 'Cámara del Tormento', 'Ruinas Calcinadas', 'Garganta de Fuego', 'Altar Profanado'],
  dungeonNames: ['Las Fauces del Abismo', 'El Pozo de las Cadenas', 'La Fragua de Belzar'],
  bossRoom: 'Trono de las Cadenas',
  chests: { common: 'infierno:common', rich: 'infierno:rich', boss: 'infierno:boss' },
  rarity: { common: 20, uncommon: 30, rare: 30, epic: 16, legendary: 4 },
  tint: [1.35, 0.7, 0.52],
  backdrops: ['infierno', 'infierno'],
};

export const INFIERNO_CHESTS: Record<string, LootTable> = {
  'infierno:common': rarityTable(gear, { ...INFIERNO.rarity, epic: 4, legendary: 0 }, { rolls: 2, gold: [70, 150] }, [
    { itemId: 'health_potion', weight: 22 }, { itemId: 'mana_potion', weight: 12 }, { itemId: 'antidote', weight: 8 }, { itemId: 'sulfur', weight: 18, min: 1, max: 3 }, { itemId: 'obsidian_shard', weight: 10 }, { itemId: 'sulfur_key', weight: 3 }, { itemId: 'bone_key', weight: 5 },
  ], 45),
  'infierno:rich': rarityTable(gear, INFIERNO.rarity, { rolls: 3, gold: [140, 260] }, [
    { itemId: 'infernal_crown_shard', weight: 6 }, { itemId: 'demon_blood', weight: 12, min: 1, max: 2 }, { itemId: 'health_potion', weight: 14 },
  ], 75),
  'infierno:boss': rarityTable(gear, { common: 0, uncommon: 0, rare: 45, epic: 40, legendary: 15 }, { rolls: 3, gold: [380, 640] }, [
    { itemId: 'infernal_crown_shard', weight: 20 }, { itemId: 'demon_blood', weight: 12, min: 2, max: 4 },
  ], 80),
};
