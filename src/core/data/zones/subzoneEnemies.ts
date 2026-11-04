// ════════════════════════════════════════════════════════════════════
// Criaturas nuevas de las subzonas (plan-subzonas.md, sección 2). Todas están diseñadas a la escala de la Mazmorra
// (una común «media» tiene ~45 de vida y ~14 de ataque a nivel 1); el nivel de la subzona las hace crecer.
// El aspecto provisional está en shared/art.ts (MONSTER_SPECS, BEAST_SPECS y FLYER_SPECS) con la misma clave que `sprite`.
// Todo es editable.
// ════════════════════════════════════════════════════════════════════
import type { EnemyDef } from '../enemies';
import type { LootTable } from '../../loot';
import { CRIPTA_ITEMS } from './cripta';
import { INFIERNO_ITEMS } from './infierno';

const st = (maxHp: number, atk: number, def: number, mag: number, res: number, spd: number, crit = 7, eva = 6) => ({ maxHp, maxMp: 0, atk, def, mag, res, spd, crit, eva });

/** Botín de una común según su zona: materiales de la zona, alguna poción y, a veces, la llave de los cofres. */
function commonLoot(zone: 'mazmorra' | 'cripta' | 'infierno', extra: LootTable['entries'] = []): LootTable {
  const z = {
    mazmorra: { gold: [4, 16] as [number, number], mats: [{ itemId: 'old_coin', weight: 25, min: 1, max: 2 }, { itemId: 'bone_dust', weight: 20, min: 1, max: 2 }], key: 'iron_key' },
    cripta: { gold: [10, 26] as [number, number], mats: [{ itemId: 'ancient_bone', weight: 25, min: 1, max: 2 }, { itemId: 'ectoplasm', weight: 15 }, { itemId: 'blessed_silver', weight: 8 }], key: 'bone_key' },
    infierno: { gold: [18, 40] as [number, number], mats: [{ itemId: 'obsidian_shard', weight: 22, min: 1, max: 2 }, { itemId: 'demon_blood', weight: 12 }], key: 'sulfur_key' },
  }[zone];
  return { rolls: 1, gold: z.gold, entries: [...z.mats, ...extra, { itemId: 'health_potion', weight: 12 }, { itemId: z.key, weight: 4 }, { itemId: 'nothing', weight: 30 }] };
}

const gearOf = (items: { id: string; rarity: string; slot?: string }[], rar: string[]) => items.filter((i) => i.slot && rar.includes(i.rarity)).map((i) => ({ itemId: i.id, weight: 6 }));
const MAZ_GEAR = [{ itemId: 'knight_sword', weight: 8 }, { itemId: 'iron_shield', weight: 8 }, { itemId: 'frost_staff', weight: 6 }, { itemId: 'executioner_axe', weight: 6 }, { itemId: 'bone_amulet', weight: 8 }];

function eliteLoot(zone: 'mazmorra' | 'cripta' | 'infierno'): LootTable {
  if (zone === 'mazmorra') return { rolls: 2, gold: [30, 70], always: [{ itemId: 'iron_key' }], entries: [{ itemId: 'golden_chalice', weight: 16 }, { itemId: 'old_coin', weight: 20, min: 2, max: 4 }, ...MAZ_GEAR] };
  if (zone === 'cripta') return { rolls: 2, gold: [40, 90], always: [{ itemId: 'bone_key' }], entries: [{ itemId: 'blessed_silver', weight: 28, min: 2, max: 3 }, { itemId: 'gilded_skull', weight: 14 }, ...gearOf(CRIPTA_ITEMS, ['rare'])] };
  return { rolls: 2, gold: [70, 150], always: [{ itemId: 'sulfur_key' }], entries: [{ itemId: 'obsidian_shard', weight: 24, min: 2, max: 3 }, { itemId: 'demon_blood', weight: 18 }, ...gearOf(INFIERNO_ITEMS, ['rare'])] };
}

function bossLoot(zone: 'mazmorra' | 'cripta' | 'infierno', gold: [number, number]): LootTable {
  if (zone === 'mazmorra') return { rolls: 2, gold, always: [{ itemId: 'relic_key' }], entries: [{ itemId: 'golden_chalice', weight: 26 }, { itemId: 'blood_gem', weight: 18 }, ...MAZ_GEAR] };
  if (zone === 'cripta') return { rolls: 2, gold, always: [{ itemId: 'relic_key' }], entries: [{ itemId: 'gilded_skull', weight: 25 }, ...gearOf(CRIPTA_ITEMS, ['rare', 'epic'])] };
  return { rolls: 2, gold, always: [{ itemId: 'relic_key' }], entries: [{ itemId: 'infernal_crown_shard', weight: 20 }, ...gearOf(INFIERNO_ITEMS, ['rare', 'epic'])] };
}

const walk = (speed: number, aggroRange: number) => ({ speed, aggroRange });

export const SUBZONE_ENEMIES: Record<string, EnemyDef> = {
  // ═══ 1 · Afueras del castillo ═══
  starving_wolf: { id: 'starving_wolf', name: 'Lobo famélico', sprite: 'starving_wolf', role: 'Bestia', stats: st(44, 15, 4, 0, 4, 16, 9, 12), skills: ['leech_bite'], skillChance: 0.4, basicAttack: { name: 'Dentellada', kind: 'physical', power: 1, fx: 'bite' }, xp: 34, undead: false, loot: commonLoot('mazmorra', [{ itemId: 'bat_wing', weight: 10 }]), wander: walk(2.4, 4.5) },
  carrion_crow: { id: 'carrion_crow', name: 'Cuervo carroñero', sprite: 'carrion_crow', role: 'Rápido', stats: st(28, 11, 3, 0, 4, 19, 10, 20), skills: ['leech_bite'], skillChance: 0.35, basicAttack: { name: 'Picotazo', kind: 'physical', power: 0.9, fx: 'bite' }, xp: 26, undead: false, loot: commonLoot('mazmorra'), wander: walk(2.6, 4) },
  mordrek: {
    id: 'mordrek', name: 'Mordrek el Desertor', sprite: 'mordrek', role: 'Jefe', boss: true,
    stats: st(260, 26, 12, 0, 10, 10, 10, 4), skills: ['dirty_cut', 'rally_cry', 'shield_bash'], skillChance: 0.45,
    basicAttack: { name: 'Sable de la Guardia', kind: 'physical', power: 1.05, fx: 'slash' }, xp: 220, undead: false,
    phase2: { skills: ['rending_slash', 'rally_cry', 'brutal_blow'], line: 'Mordrek arroja el escudo: «¡A mí la banda! ¡Nadie sale de mi muralla!»', skillChance: 0.55 },
    loot: bossLoot('mazmorra', [40, 80]), wander: walk(1, 3),
  },
  // ═══ 2 · El castillo ═══
  hollow_armor: { id: 'hollow_armor', name: 'Armadura hueca', sprite: 'hollow_armor', role: 'Tanque', stats: st(70, 13, 12, 0, 8, 6, 5, 2), skills: ['block', 'bone_bash'], skillChance: 0.35, basicAttack: { name: 'Espadazo', kind: 'physical', power: 1, fx: 'slash' }, xp: 44, undead: true, loot: commonLoot('mazmorra', [{ itemId: 'rusty_sword', weight: 8 }]), wander: walk(0.8, 3) },
  hanged_servant: { id: 'hanged_servant', name: 'Criado ahorcado', sprite: 'hanged_servant', role: 'Cuerpo a cuerpo', stats: st(50, 15, 5, 0, 5, 10), skills: ['rotting_claw'], skillChance: 0.4, basicAttack: { name: 'Zarpazo', kind: 'physical', power: 1, fx: 'bite' }, xp: 38, undead: true, loot: commonLoot('mazmorra'), wander: walk(1.4, 3.5) },
  fallen_guard_knight: {
    id: 'fallen_guard_knight', name: 'Caballero de la guardia caída', sprite: 'fallen_guard_knight', role: 'Élite', elite: true,
    stats: st(200, 27, 14, 0, 10, 8, 8, 3), skills: ['rending_slash', 'block', 'war_cry'], skillChance: 0.45,
    basicAttack: { name: 'Mandoble', kind: 'physical', power: 1.05, fx: 'slash' }, xp: 120, undead: true, loot: eliteLoot('mazmorra'), wander: walk(0.9, 3),
  },
  burned_seneschal: {
    id: 'burned_seneschal', name: 'El Senescal Quemado', sprite: 'burned_seneschal', role: 'Jefe', boss: true,
    stats: st(260, 20, 13, 20, 12, 8, 8, 2), skills: ['ember_spit', 'bone_bash', 'dark_mend'], skillChance: 0.5,
    basicAttack: { name: 'Maza ardiente', kind: 'physical', power: 1, fx: 'fire' }, xp: 250, undead: true,
    phase2: { skills: ['ember_rain', 'grave_slam', 'dark_mend'], line: 'El Senescal arde entero: «El castillo cayó. Yo no.»', skillChance: 0.55 },
    loot: bossLoot('mazmorra', [50, 95]), wander: walk(0.8, 3),
  },
  // ═══ 3 · Las mazmorras del castillo ═══
  torturer: { id: 'torturer', name: 'Torturador', sprite: 'torturer', role: 'Cuerpo a cuerpo', stats: st(58, 17, 6, 0, 5, 8, 8, 4), skills: ['dirty_cut', 'skull_splitter'], skillChance: 0.4, basicAttack: { name: 'Mazazo', kind: 'physical', power: 1, fx: 'smash' }, xp: 46, undead: false, loot: commonLoot('mazmorra', [{ itemId: 'iron_key', weight: 6 }]), wander: walk(1.1, 3) },
  mad_prisoner: { id: 'mad_prisoner', name: 'Preso enloquecido', sprite: 'mad_prisoner', role: 'Rápido', stats: st(40, 16, 3, 0, 3, 14, 12, 12), skills: ['low_blow', 'leech_bite'], skillChance: 0.45, basicAttack: { name: 'Uñas', kind: 'physical', power: 0.95, fx: 'bite' }, xp: 36, undead: false, loot: commonLoot('mazmorra'), wander: walk(2, 4) },
  pit_worm: { id: 'pit_worm', name: 'Gusano de pozo', sprite: 'pit_worm', role: 'Bestia', stats: st(60, 13, 5, 0, 6, 9, 5, 4), skills: ['plague_bite'], skillChance: 0.45, basicAttack: { name: 'Succión', kind: 'physical', power: 1, fx: 'bite' }, xp: 40, undead: false, loot: commonLoot('mazmorra'), wander: walk(1.2, 3) },
  executioner: {
    id: 'executioner', name: 'El Verdugo', sprite: 'executioner', role: 'Élite', elite: true,
    stats: st(180, 25, 10, 0, 9, 8, 10, 2), skills: ['reaping', 'skull_splitter'], skillChance: 0.35,
    basicAttack: { name: 'Hacha del verdugo', kind: 'physical', power: 1.1, fx: 'slash' }, xp: 130, undead: false, loot: eliteLoot('mazmorra'), wander: walk(0.9, 3),
  },
  // ═══ 4 · El Osario de Umbravel ═══
  bone_colossus: { id: 'bone_colossus', name: 'Coloso de huesos', sprite: 'bone_colossus', role: 'Tanque', stats: st(80, 14, 12, 0, 8, 5, 5, 2), skills: ['bone_shield', 'bone_bash'], skillChance: 0.35, basicAttack: { name: 'Fémur', kind: 'physical', power: 1, fx: 'smash' }, xp: 48, undead: true, loot: commonLoot('cripta'), wander: walk(0.7, 3) },
  ossuary_monk: { id: 'ossuary_monk', name: 'Monje del osario', sprite: 'ossuary_monk', role: 'Lanzador', stats: st(46, 7, 5, 17, 10, 9), skills: ['grave_bolt', 'dark_mend'], skillChance: 0.55, basicAttack: { name: 'Bastón', kind: 'magical', power: 0.9, fx: 'dark' }, xp: 46, undead: true, loot: commonLoot('cripta'), wander: walk(1, 4) },
  bone_abbot: {
    id: 'bone_abbot', name: 'El Abad de los Huesos', sprite: 'bone_abbot', role: 'Jefe', boss: true,
    stats: st(290, 18, 13, 24, 14, 8, 8, 2), skills: ['grave_bolt', 'necrotic_wave', 'bone_shield'], skillChance: 0.55,
    basicAttack: { name: 'Báculo de vértebras', kind: 'magical', power: 1, fx: 'dark' }, xp: 300, undead: true,
    phase2: { skills: ['dark_nova', 'necrotic_wave', 'dark_mend'], line: 'Los huesos de los monjes se cierran sobre el Abad: «Rezad conmigo… para siempre.»', skillChance: 0.6 },
    loot: bossLoot('cripta', [110, 200]), wander: walk(0.8, 3),
  },
  // ═══ 5 · Las Catacumbas Ahogadas ═══
  drowned: { id: 'drowned', name: 'Ahogado', sprite: 'drowned', role: 'Cuerpo a cuerpo', stats: st(56, 15, 5, 0, 6, 9), skills: ['rotting_claw', 'wail'], skillChance: 0.4, basicAttack: { name: 'Abrazo frío', kind: 'physical', power: 1, fx: 'frost' }, xp: 48, undead: true, loot: commonLoot('cripta'), wander: walk(1.1, 3.5) },
  crypt_leech: { id: 'crypt_leech', name: 'Sanguijuela de cripta', sprite: 'crypt_leech', role: 'Rápido', stats: st(34, 12, 3, 0, 4, 15, 8, 14), skills: ['leech_bite'], skillChance: 0.5, basicAttack: { name: 'Ventosa', kind: 'physical', power: 0.9, fx: 'bite' }, xp: 36, undead: false, loot: commonLoot('cripta'), wander: walk(2, 4) },
  mourner: { id: 'mourner', name: 'Plañidera', sprite: 'mourner', role: 'Control', stats: st(44, 7, 5, 16, 11, 11), skills: ['wail', 'mesmerize'], skillChance: 0.55, basicAttack: { name: 'Lamento', kind: 'magical', power: 0.9, fx: 'frost' }, xp: 46, undead: true, loot: commonLoot('cripta'), wander: walk(1, 4) },
  water_lady: {
    id: 'water_lady', name: 'La Dama del Agua', sprite: 'water_lady', role: 'Élite', elite: true,
    stats: st(180, 14, 10, 26, 14, 10, 8, 6), skills: ['frost_lance', 'veil', 'ice_prison'], skillChance: 0.55,
    basicAttack: { name: 'Ola negra', kind: 'magical', power: 1, fx: 'frost' }, xp: 150, undead: true, loot: eliteLoot('cripta'), wander: walk(0.9, 3.5),
  },
  black_ferryman: {
    id: 'black_ferryman', name: 'El Barquero de las Aguas Negras', sprite: 'black_ferryman', role: 'Jefe', boss: true,
    stats: st(310, 22, 12, 18, 13, 8, 9, 3), skills: ['wail', 'reaping', 'veil'], skillChance: 0.5,
    basicAttack: { name: 'Remo de hueso', kind: 'physical', power: 1.05, fx: 'smash' }, xp: 330, undead: true,
    phase2: { skills: ['lament', 'reaping', 'ice_prison'], line: 'El Barquero hunde el remo en el agua: «Se acabó el viaje. Paga.»', skillChance: 0.55 },
    loot: bossLoot('cripta', [130, 230]), wander: walk(0.8, 3),
  },
  // ═══ 6 · El Panteón de los Nobles ═══
  embalmed_noble: { id: 'embalmed_noble', name: 'Noble embalsamado', sprite: 'embalmed_noble', role: 'Cuerpo a cuerpo', stats: st(60, 16, 6, 0, 7, 9, 10, 4), skills: ['rending_slash', 'thrust'], skillChance: 0.4, basicAttack: { name: 'Estoque dorado', kind: 'physical', power: 1, fx: 'slash' }, xp: 50, undead: true, loot: commonLoot('cripta', [{ itemId: 'gilded_skull', weight: 3 }]), wander: walk(1, 3) },
  marble_gargoyle: { id: 'marble_gargoyle', name: 'Gárgola de mármol', sprite: 'marble_gargoyle', role: 'Tanque', stats: st(82, 15, 14, 0, 10, 4, 5, 1), skills: ['block', 'bone_bash'], skillChance: 0.35, basicAttack: { name: 'Garra de piedra', kind: 'physical', power: 1, fx: 'smash' }, xp: 52, undead: false, loot: commonLoot('cripta'), wander: walk(0.6, 2.5) },
  spectral_duelist: {
    id: 'spectral_duelist', name: 'Duelista espectral', sprite: 'spectral_duelist', role: 'Élite', elite: true,
    stats: st(175, 29, 9, 0, 12, 14, 16, 12), skills: ['thrust', 'backstab', 'venom_strike'], skillChance: 0.5,
    basicAttack: { name: 'Estocada', kind: 'physical', power: 1.05, fx: 'slash' }, xp: 160, undead: true, loot: eliteLoot('cripta'), wander: walk(1.4, 3.5),
  },
  // ═══ 7 · La Cripta Carmesí ═══
  flame_cultist: { id: 'flame_cultist', name: 'Cultista de la Llama', sprite: 'flame_cultist', role: 'Lanzador', stats: st(46, 7, 5, 17, 9, 11), skills: ['ember_spit', 'dark_mend'], skillChance: 0.55, basicAttack: { name: 'Daga ritual', kind: 'magical', power: 0.9, fx: 'fire' }, xp: 52, undead: false, loot: commonLoot('infierno'), wander: walk(1.2, 4) },
  bleeding_ghoul: { id: 'bleeding_ghoul', name: 'Necrófago sangrante', sprite: 'bleeding_ghoul', role: 'Cuerpo a cuerpo', stats: st(58, 16, 6, 0, 6, 10), skills: ['leech_bite', 'rotting_claw'], skillChance: 0.45, basicAttack: { name: 'Zarpazo', kind: 'physical', power: 1, fx: 'bite' }, xp: 52, undead: true, loot: commonLoot('infierno'), wander: walk(1.3, 3.5) },
  flayed_penitent: { id: 'flayed_penitent', name: 'Penitente desollado', sprite: 'flayed_penitent', role: 'Furia', stats: st(52, 17, 4, 0, 5, 11, 12, 6), skills: ['dirty_cut', 'war_cry'], skillChance: 0.45, basicAttack: { name: 'Látigo', kind: 'physical', power: 1, fx: 'slash' }, xp: 50, undead: false, loot: commonLoot('infierno'), wander: walk(1.5, 4) },
  umbral_priest: {
    id: 'umbral_priest', name: 'Sumo sacerdote del Umbral', sprite: 'umbral_priest', role: 'Élite', elite: true,
    stats: st(170, 12, 9, 27, 14, 10, 8, 5), skills: ['necrotic_wave', 'hellfire', 'dark_mend'], skillChance: 0.6,
    basicAttack: { name: 'Cetro de sangre', kind: 'magical', power: 1, fx: 'fire' }, xp: 180, undead: false, loot: eliteLoot('infierno'), wander: walk(0.9, 3.5),
  },
  vharok: {
    id: 'vharok', name: 'Vharok, Guardián del Umbral', sprite: 'vharok', role: 'Jefe', boss: true,
    stats: st(410, 32, 15, 12, 13, 8, 9, 2), skills: ['hell_cleave', 'block', 'chain_bind'], skillChance: 0.5,
    basicAttack: { name: 'Espadón del Umbral', kind: 'physical', power: 1.05, fx: 'slash' }, xp: 380, undead: false,
    phase2: { skills: ['abyssal_rage', 'hellfire', 'hell_cleave'], line: 'La puerta tras Vharok se abre y el fuego lo envuelve: «Nadie cruza.»', skillChance: 0.55 },
    loot: bossLoot('infierno', [220, 380]), wander: walk(0.8, 3),
  },
  // ═══ 8 · Las Puertas del Abismo ═══
  magma_elemental: { id: 'magma_elemental', name: 'Elemental de magma', sprite: 'magma_elemental', role: 'Tanque', stats: st(78, 15, 12, 15, 10, 5, 5, 2), skills: ['ember_spit', 'block'], skillChance: 0.4, basicAttack: { name: 'Puño de lava', kind: 'physical', power: 1, fx: 'fire' }, xp: 56, undead: false, loot: commonLoot('infierno'), wander: walk(0.7, 3) },
  obsidian_gargoyle: { id: 'obsidian_gargoyle', name: 'Gárgola de obsidiana', sprite: 'obsidian_gargoyle', role: 'Tanque', stats: st(80, 16, 15, 0, 10, 5, 6, 1), skills: ['block', 'hell_cleave'], skillChance: 0.35, basicAttack: { name: 'Garra de obsidiana', kind: 'physical', power: 1, fx: 'smash' }, xp: 56, undead: false, loot: commonLoot('infierno'), wander: walk(0.6, 2.5) },
  hound_master: {
    id: 'hound_master', name: 'Domador de canes', sprite: 'hound_master', role: 'Élite', elite: true,
    stats: st(200, 28, 12, 0, 10, 11, 10, 6), skills: ['rally_cry', 'chain_bind', 'hell_cleave'], skillChance: 0.5,
    basicAttack: { name: 'Látigo de cadenas', kind: 'physical', power: 1.05, fx: 'slash' }, xp: 190, undead: false, loot: eliteLoot('infierno'), wander: walk(1.1, 3.5),
  },
  ignaroth: {
    id: 'ignaroth', name: 'Ignaroth, Señor de la Fragua', sprite: 'ignaroth', role: 'Jefe', boss: true,
    stats: st(390, 29, 14, 20, 13, 8, 9, 2), skills: ['chain_bind', 'brimstone', 'hell_cleave'], skillChance: 0.5,
    basicAttack: { name: 'Martillo de la fragua', kind: 'physical', power: 1.05, fx: 'smash' }, xp: 420, undead: false,
    phase2: { skills: ['hellfire', 'hell_cleave', 'abyssal_rage'], line: 'Ignaroth hunde el martillo en la lava: «Te forjaré unas cadenas a tu medida.»', skillChance: 0.55 },
    loot: bossLoot('infierno', [260, 440]), wander: walk(0.8, 3),
  },
  // ═══ 9 · Los Ríos de Fuego ═══
  flayer: { id: 'flayer', name: 'Desollador', sprite: 'flayer', role: 'Cuerpo a cuerpo', stats: st(56, 19, 6, 0, 6, 11, 12, 5), skills: ['rending_slash', 'dirty_cut'], skillChance: 0.45, basicAttack: { name: 'Gancho', kind: 'physical', power: 1, fx: 'slash' }, xp: 58, undead: false, loot: commonLoot('infierno'), wander: walk(1.4, 3.5) },
  burning_soul: { id: 'burning_soul', name: 'Alma ardiente', sprite: 'burning_soul', role: 'Rápido', stats: st(38, 6, 3, 18, 8, 17, 8, 15), skills: ['ember_spit', 'brimstone'], skillChance: 0.55, basicAttack: { name: 'Toque abrasador', kind: 'magical', power: 0.9, fx: 'fire' }, xp: 50, undead: true, loot: commonLoot('infierno'), wander: walk(2, 4.5) },
  sulfur_beast: {
    id: 'sulfur_beast', name: 'La Bestia de Azufre', sprite: 'sulfur_beast', role: 'Jefe', boss: true,
    stats: st(410, 30, 13, 18, 12, 11, 10, 4), skills: ['savage_maul', 'brimstone'], skillChance: 0.5,
    basicAttack: { name: 'Zarpazo humeante', kind: 'physical', power: 1.05, fx: 'bite' }, xp: 460, undead: false,
    phase2: { skills: ['savage_maul', 'hellfire', 'abyssal_rage'], line: 'La Bestia ruge y el azufre de su lomo se incendia.', skillChance: 0.55 },
    loot: bossLoot('infierno', [300, 500]), wander: walk(1, 3),
  },
  // ═══ 10 · El Trono de las Cadenas ═══
  pit_lord: { id: 'pit_lord', name: 'Señor del foso', sprite: 'pit_lord', role: 'Tanque', stats: st(84, 18, 13, 0, 10, 6, 6, 2), skills: ['hell_cleave', 'abyssal_rage'], skillChance: 0.4, basicAttack: { name: 'Hacha del foso', kind: 'physical', power: 1, fx: 'slash' }, xp: 62, undead: false, loot: commonLoot('infierno'), wander: walk(0.8, 3) },
  chained_herald: { id: 'chained_herald', name: 'Heraldo encadenado', sprite: 'chained_herald', role: 'Control', stats: st(62, 16, 8, 0, 8, 9), skills: ['chain_bind'], skillChance: 0.45, basicAttack: { name: 'Cadenazo', kind: 'physical', power: 1, fx: 'smash' }, xp: 58, undead: false, loot: commonLoot('infierno'), wander: walk(1, 3.5) },
  abyss_spawn: { id: 'abyss_spawn', name: 'Engendro del abismo', sprite: 'abyss_spawn', role: 'Bestia', stats: st(66, 18, 6, 0, 7, 14, 10, 8), skills: ['savage_maul'], skillChance: 0.4, basicAttack: { name: 'Mordisco', kind: 'physical', power: 1, fx: 'bite' }, xp: 60, undead: false, loot: commonLoot('infierno'), wander: walk(2, 4.5) },
  soul_devourer: { id: 'soul_devourer', name: 'Devorador de almas', sprite: 'soul_devourer', role: 'Lanzador', stats: st(54, 7, 6, 20, 12, 10), skills: ['brimstone', 'dark_mend', 'mesmerize'], skillChance: 0.55, basicAttack: { name: 'Hambre', kind: 'magical', power: 1, fx: 'dark' }, xp: 62, undead: true, loot: commonLoot('infierno'), wander: walk(1, 4) },
  belzar_herald: {
    id: 'belzar_herald', name: 'Heraldo de Belzar', sprite: 'belzar_herald', role: 'Élite', elite: true,
    stats: st(220, 30, 14, 0, 12, 9, 10, 3), skills: ['hell_cleave', 'chain_bind', 'abyssal_rage'], skillChance: 0.5,
    basicAttack: { name: 'Espada de cadenas', kind: 'physical', power: 1.1, fx: 'slash' }, xp: 220, undead: false, loot: eliteLoot('infierno'), wander: walk(0.9, 3),
  },
};

/** Segunda fase de los tres jefes que ya existían. */
export const EXISTING_BOSS_PHASES: Record<string, EnemyDef['phase2']> = {
  ossuary_lord: { skills: ['necrotic_wave', 'bone_shield', 'bone_bash'], line: 'El Señor del Osario se arranca la corona: «¡Levantaos, hermanos!»', skillChance: 0.55 },
  veiled_queen: { skills: ['lament', 'wail', 'veil'], line: 'La Reina Velada se levanta el velo. Nadie debería ver lo que hay debajo.', skillChance: 0.5 },
  belzar: { skills: ['brimstone', 'hell_cleave', 'chain_bind'], line: 'Belzar rompe sus propias cadenas: «Ahora sí. Ahora ardes.»', skillChance: 0.5 },
};
