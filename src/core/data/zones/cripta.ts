// ════════════════════════════════════════════════════════════════════
// ZONA 2 · LA CRIPTA (niveles 30–60)
// Necrópolis de sarcófagos y velas frías bajo la Mazmorra. Todo es editable.
// ════════════════════════════════════════════════════════════════════
import type { ItemDef } from '../../types';
import type { EnemyDef } from '../enemies';
import type { LootTable } from '../../loot';
import { SLASH, CHOP, BOLT } from '../attacks';
import { rarityTable, type ZoneDef } from './types';

const W = ['warrior'] as const;
const M = ['mage'] as const;

export const CRIPTA_ITEMS: ItemDef[] = [
  // Armas
  { id: 'sepulchral_sword', name: 'Espada sepulcral', description: 'Acero templado en agua bendita.', icon: 'sword_knight', category: 'weapon', slot: 'mainHand', family: 'sword', rarity: 'uncommon', value: 260, levelReq: 30, stats: { atk: 19, crit: 3 }, classes: [...W], attack: SLASH, grants: ['rending_slash', 'thrust', 'pommel_strike'] },
  { id: 'gravewarden_blade', name: 'Hoja del guardián', description: 'La llevaban quienes vigilaban a los muertos.', icon: 'sword_knight', category: 'weapon', slot: 'mainHand', family: 'sword', rarity: 'rare', value: 520, levelReq: 42, stats: { atk: 25, crit: 5, def: 3 }, classes: [...W], attack: SLASH, grants: ['rending_slash', 'pommel_strike', 'dread_cut'] },
  { id: 'headsman_axe', name: 'Hacha del verdugo real', description: 'Ninguna cabeza la ha hecho dudar.', icon: 'axe_exec', category: 'weapon', slot: 'mainHand', family: 'axe', rarity: 'uncommon', value: 270, levelReq: 32, stats: { atk: 23, crit: 4, spd: -1 }, classes: [...W], attack: CHOP, grants: ['brutal_blow', 'skull_splitter'] },
  { id: 'requiem_axe', name: 'Segur del réquiem', description: 'Canta en voz baja al cortar el aire.', icon: 'axe_bone', category: 'weapon', slot: 'mainHand', family: 'axe', rarity: 'epic', value: 1100, levelReq: 54, stats: { atk: 34, crit: 7, spd: -2 }, classes: [...W], attack: CHOP, grants: ['brutal_blow', 'skull_splitter', 'reaping'] },
  { id: 'ossuary_staff', name: 'Báculo del osario', description: 'Vértebras ensartadas en madera negra.', icon: 'staff', category: 'weapon', slot: 'mainHand', family: 'staff', rarity: 'uncommon', value: 260, levelReq: 30, stats: { mag: 18, maxMp: 14 }, classes: [...M], attack: BOLT, grants: ['frost_lance', 'spark', 'fireball'] },
  { id: 'requiem_staff', name: 'Báculo del réquiem', description: 'Su escarcha no se derrite nunca.', icon: 'staff_frost', category: 'weapon', slot: 'mainHand', family: 'staff', rarity: 'rare', value: 540, levelReq: 44, stats: { mag: 25, maxMp: 18, res: 4 }, classes: [...M], attack: BOLT, grants: ['frost_lance', 'blizzard', 'ice_prison'] },
  { id: 'shroud_staff', name: 'Cetro del sudario', description: 'Envuelto en un lienzo que no es de este mundo.', icon: 'staff_rune', category: 'weapon', slot: 'mainHand', family: 'staff', rarity: 'epic', value: 1100, levelReq: 54, stats: { mag: 33, maxMp: 24, crit: 5 }, classes: [...M], attack: BOLT, grants: ['fireball', 'blizzard', 'dark_nova'] },
  // Secundarias
  { id: 'headstone_shield', name: 'Escudo de lápida', description: 'Aún se lee un nombre en él.', icon: 'shield_iron', category: 'shield', slot: 'offHand', family: 'shield', rarity: 'rare', value: 480, levelReq: 40, stats: { def: 14, res: 6, maxHp: 24 }, classes: ['warrior', 'cleric'], grants: ['block', 'shield_bash', 'iron_wall'] },
  { id: 'funeral_grimoire', name: 'Grimorio fúnebre', description: 'Lista de nombres. Algunos todavía no han muerto.', icon: 'tome_dark', category: 'relic', slot: 'offHand', family: 'tome', rarity: 'rare', value: 480, levelReq: 40, stats: { mag: 10, maxMp: 26, res: 7 }, classes: ['mage'], grants: ['arcane_barrier', 'mana_siphon'] },
  // Armaduras
  { id: 'silver_helm', name: 'Yelmo de plata bendita', description: 'Los espectros apartan la mirada.', icon: 'helm_knight', category: 'helmet', slot: 'helmet', rarity: 'rare', value: 420, levelReq: 38, stats: { def: 10, maxHp: 32, res: 5 }, classes: ['warrior'] },
  { id: 'mourner_hood', name: 'Capucha del plañidero', description: 'Huele a incienso y a tierra removida.', icon: 'hood', category: 'helmet', slot: 'helmet', rarity: 'uncommon', value: 240, levelReq: 32, stats: { mag: 7, res: 8 }, classes: ['mage'] },
  { id: 'silver_plate', name: 'Coraza de plata bendita', description: 'Grabada con salmos contra la podredumbre.', icon: 'plate', category: 'armor', slot: 'armor', rarity: 'epic', value: 1050, levelReq: 52, stats: { def: 19, maxHp: 50, res: 8, spd: -1 }, classes: ['warrior'] },
  { id: 'shroud_robe', name: 'Túnica de sudario', description: 'Fría al tacto, ligera como la ceniza.', icon: 'robe_dark', category: 'armor', slot: 'armor', rarity: 'rare', value: 460, levelReq: 42, stats: { def: 8, res: 16, mag: 10, maxMp: 18, maxHp: 18 }, classes: ['mage'] },
  { id: 'silver_gauntlets', name: 'Guanteletes de plata', description: 'Las articulaciones crujen como huesos.', icon: 'gauntlets', category: 'gloves', slot: 'gloves', rarity: 'uncommon', value: 220, levelReq: 34, stats: { atk: 5, def: 4 }, classes: ['warrior', 'cleric'] },
  { id: 'grave_boots', name: 'Botas del sepulturero', description: 'No hacen ruido sobre la piedra.', icon: 'boots_swift', category: 'boots', slot: 'boots', rarity: 'rare', value: 380, levelReq: 40, stats: { spd: 5, eva: 5, def: 3 } },
  { id: 'reliquary_amulet', name: 'Amuleto relicario', description: 'Dentro hay un dedo. De un santo, dicen.', icon: 'amulet', category: 'jewel', slot: 'amulet', rarity: 'rare', value: 520, levelReq: 44, stats: { res: 8, maxHp: 28, mag: 4, atk: 4 } },
  { id: 'veiled_ring', name: 'Anillo de la Reina Velada', description: 'Quien lo lleva oye un lamento lejano.', icon: 'ring_red', category: 'jewel', slot: 'ring', rarity: 'legendary', value: 1800, levelReq: 56, stats: { atk: 9, mag: 9, crit: 5, maxHp: 22 } },
  // Materiales y tesoros
  { id: 'blessed_silver', name: 'Plata bendita', description: 'Metal consagrado. La forja lo agradecerá.', icon: 'coin', category: 'material', rarity: 'uncommon', value: 30, stack: 10 },
  { id: 'ectoplasm', name: 'Ectoplasma', description: 'Lo que queda cuando un espectro se disipa.', icon: 'dust', category: 'material', rarity: 'uncommon', value: 28, stack: 10 },
  { id: 'ancient_bone', name: 'Hueso antiguo', description: 'Más duro que el hierro, y más viejo.', icon: 'dust', category: 'material', rarity: 'common', value: 18, stack: 10 },
  { id: 'gilded_skull', name: 'Cráneo dorado', description: 'Un noble quiso brillar también muerto.', icon: 'chalice', category: 'relic', rarity: 'rare', value: 420, stack: 1 },
];

const gear = CRIPTA_ITEMS.filter((i) => i.slot);

export const CRIPTA_ENEMIES: Record<string, EnemyDef> = {
  wraith: {
    id: 'wraith', name: 'Espectro lamentador', sprite: 'wraith', role: 'Mágico',
    stats: { maxHp: 58, maxMp: 0, atk: 8, def: 6, mag: 19, res: 12, spd: 12, crit: 6, eva: 14 },
    skills: ['wail'], skillChance: 0.45,
    basicAttack: { name: 'Toque gélido', kind: 'magical', power: 1, fx: 'frost' },
    xp: 42, undead: true,
    loot: { rolls: 1, gold: [10, 30], entries: [{ itemId: 'ectoplasm', weight: 55, min: 1, max: 2 }, { itemId: 'health_potion', weight: 15 }, { itemId: 'nothing', weight: 30 }] },
    wander: { speed: 1.8, aggroRange: 4 },
  },
  ghoul: {
    id: 'ghoul', name: 'Necrófago', sprite: 'ghoul', role: 'Cuerpo a cuerpo',
    stats: { maxHp: 74, maxMp: 0, atk: 18, def: 8, mag: 0, res: 6, spd: 10, crit: 7, eva: 4 },
    skills: ['rotting_claw', 'dark_mend'], skillChance: 0.4,
    basicAttack: { name: 'Zarpazo', kind: 'physical', power: 1, fx: 'bite' },
    xp: 44, undead: true,
    loot: { rolls: 1, gold: [8, 26], entries: [{ itemId: 'ancient_bone', weight: 50, min: 1, max: 3 }, { itemId: 'antidote', weight: 15 }, { itemId: 'nothing', weight: 35 }] },
    wander: { speed: 1.6, aggroRange: 3.5 },
  },
  tomb_guardian: {
    id: 'tomb_guardian', name: 'Guardián de tumbas', sprite: 'tomb_guardian', role: 'Tanque',
    stats: { maxHp: 104, maxMp: 0, atk: 16, def: 15, mag: 0, res: 10, spd: 5, crit: 4, eva: 1 },
    skills: ['block', 'bone_bash'], skillChance: 0.35,
    basicAttack: { name: 'Alabarda', kind: 'physical', power: 1, fx: 'slash' },
    xp: 55, undead: true,
    loot: { rolls: 1, gold: [12, 34], entries: [{ itemId: 'blessed_silver', weight: 40, min: 1, max: 2 }, { itemId: 'ancient_bone', weight: 25, min: 1, max: 2 }, { itemId: 'nothing', weight: 35 }] },
    wander: { speed: 0.9, aggroRange: 3 },
  },
  necro_priest: {
    id: 'necro_priest', name: 'Sacerdote no-muerto', sprite: 'necro_priest', role: 'Lanzador',
    stats: { maxHp: 62, maxMp: 0, atk: 7, def: 6, mag: 20, res: 12, spd: 9, crit: 5, eva: 4 },
    skills: ['grave_bolt', 'dark_mend', 'necrotic_wave'], skillChance: 0.55,
    basicAttack: { name: 'Cetro oscuro', kind: 'magical', power: 0.9, fx: 'dark' },
    xp: 50, undead: true,
    loot: { rolls: 1, gold: [14, 36], entries: [{ itemId: 'ectoplasm', weight: 35 }, { itemId: 'mana_potion', weight: 25 }, { itemId: 'bone_key', weight: 5 }, { itemId: 'nothing', weight: 35 }] },
    wander: { speed: 1.1, aggroRange: 3.5 },
  },
  bone_archer: {
    id: 'bone_archer', name: 'Arquero de hueso', sprite: 'bone_archer', role: 'A distancia',
    stats: { maxHp: 52, maxMp: 0, atk: 19, def: 6, mag: 0, res: 6, spd: 11, crit: 10, eva: 8 },
    skills: ['piercing_shot'], skillChance: 0.45,
    basicAttack: { name: 'Flecha', kind: 'physical', power: 1, fx: 'slash' },
    xp: 44, undead: true,
    loot: { rolls: 1, gold: [8, 26], entries: [{ itemId: 'ancient_bone', weight: 45, min: 1, max: 2 }, { itemId: 'nothing', weight: 55 }] },
    wander: { speed: 1.4, aggroRange: 4.5 },
  },
  tomb_knight: {
    id: 'tomb_knight', name: 'Caballero del sepulcro', sprite: 'tomb_knight', role: 'Élite', elite: true,
    stats: { maxHp: 150, maxMp: 0, atk: 22, def: 14, mag: 0, res: 11, spd: 8, crit: 8, eva: 3 },
    skills: ['grave_slam', 'rally_cry', 'bone_shield'], skillChance: 0.5,
    basicAttack: { name: 'Espadón sepulcral', kind: 'physical', power: 1.05, fx: 'slash' },
    xp: 120, undead: true,
    loot: { rolls: 2, gold: [30, 70], always: [{ itemId: 'bone_key' }], entries: [{ itemId: 'blessed_silver', weight: 30, min: 2, max: 3 }, { itemId: 'gilded_skull', weight: 15 }, ...gear.filter((g) => g.rarity === 'rare').map((g) => ({ itemId: g.id, weight: 6 }))] },
    wander: { speed: 0.9, aggroRange: 3 },
  },
  veiled_queen: {
    id: 'veiled_queen', name: 'La Reina Velada', sprite: 'veiled_queen', boss: true, role: 'Jefe',
    stats: { maxHp: 300, maxMp: 0, atk: 18, def: 13, mag: 27, res: 16, spd: 10, crit: 8, eva: 6 },
    skills: ['lament', 'veil', 'necrotic_wave'], skillChance: 0.55,
    basicAttack: { name: 'Caricia helada', kind: 'magical', power: 1, fx: 'frost' },
    xp: 520, undead: true,
    loot: { rolls: 2, gold: [120, 220], always: [{ itemId: 'relic_key' }], entries: [{ itemId: 'gilded_skull', weight: 25 }, { itemId: 'veiled_ring', weight: 6 }, ...gear.filter((g) => g.rarity === 'epic' || g.rarity === 'rare').map((g) => ({ itemId: g.id, weight: 8 }))] },
    wander: { speed: 0.7, aggroRange: 3 },
  },
};

export const CRIPTA: ZoneDef = {
  id: 'cripta', name: 'La Cripta', tagline: 'Necrópolis de sarcófagos y velas frías. Los muertos aquí no descansan.',
  levels: [30, 60], access: { level: 30, bossOf: 'mazmorra' },
  enemies: [{ id: 'ghoul', weight: 30 }, { id: 'wraith', weight: 25 }, { id: 'bone_archer', weight: 20 }, { id: 'tomb_guardian', weight: 15, minDepth: 2 }, { id: 'necro_priest', weight: 15, minDepth: 2 }],
  elite: 'tomb_knight', boss: 'veiled_queen',
  roomNames: ['Capilla del Silencio', 'Galería de Nichos', 'Sala de los Sarcófagos', 'Cámara de las Velas', 'Osario Mayor', 'Claustro Hundido', 'Panteón Olvidado', 'Cripta de los Abades', 'Sala del Embalsamador', 'Pasillo de los Lamentos'],
  dungeonNames: ['La Necrópolis Velada', 'Los Panteones de Umbravel', 'La Cripta de los Abades'],
  bossRoom: 'Trono Velado',
  chests: { common: 'cripta:common', rich: 'cripta:rich', boss: 'cripta:boss' },
  rarity: { common: 40, uncommon: 32, rare: 20, epic: 7, legendary: 1 },
  tint: [0.68, 0.84, 1.25],
  backdrops: ['necropolis', 'necropolis'],
};

export const CRIPTA_CHESTS: Record<string, LootTable> = {
  'cripta:common': rarityTable(gear, { ...CRIPTA.rarity, epic: 0, legendary: 0 }, { rolls: 2, gold: [30, 70] }, [
    { itemId: 'health_potion', weight: 22 }, { itemId: 'mana_potion', weight: 12 }, { itemId: 'antidote', weight: 8 }, { itemId: 'ancient_bone', weight: 18, min: 1, max: 3 }, { itemId: 'ectoplasm', weight: 12 }, { itemId: 'bone_key', weight: 4 }, { itemId: 'iron_key', weight: 6 },
  ], 40),
  'cripta:rich': rarityTable(gear, CRIPTA.rarity, { rolls: 3, gold: [60, 120] }, [
    { itemId: 'gilded_skull', weight: 10 }, { itemId: 'blessed_silver', weight: 14, min: 1, max: 2 }, { itemId: 'health_potion', weight: 14 },
  ], 70),
  'cripta:boss': rarityTable(gear, { common: 0, uncommon: 10, rare: 50, epic: 32, legendary: 8 }, { rolls: 3, gold: [180, 320] }, [
    { itemId: 'gilded_skull', weight: 20 }, { itemId: 'blessed_silver', weight: 12, min: 2, max: 4 },
  ], 80),
};
