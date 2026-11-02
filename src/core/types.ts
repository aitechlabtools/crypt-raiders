// Tipos compartidos del núcleo de DREADBOUND.
// El núcleo es TypeScript puro: sin Phaser, sin React, sin DOM.
// Así se puede probar con tests y reutilizar en un futuro servidor autoritativo.

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ItemCategory =
  | 'weapon' | 'shield' | 'helmet' | 'armor' | 'gloves' | 'boots' | 'ring' | 'amulet'
  | 'potion' | 'material' | 'relic' | 'jewel' | 'key' | 'quest' | 'coin';

export type EquipSlot = 'mainHand' | 'offHand' | 'helmet' | 'armor' | 'gloves' | 'boots' | 'ring' | 'amulet';

export const EQUIP_SLOTS: EquipSlot[] = ['mainHand', 'offHand', 'helmet', 'armor', 'gloves', 'boots', 'ring', 'amulet'];

export type StatKey = 'maxHp' | 'maxMp' | 'atk' | 'def' | 'mag' | 'res' | 'spd' | 'crit' | 'eva';
export type Stats = Record<StatKey, number>;

export const STAT_KEYS: StatKey[] = ['maxHp', 'maxMp', 'atk', 'def', 'mag', 'res', 'spd', 'crit', 'eva'];

export type ClassId = 'warrior' | 'mage' | 'rogue' | 'cleric';

export type ItemEffect =
  | { kind: 'heal'; amount: number }
  | { kind: 'mana'; amount: number }
  | { kind: 'cleanse' };

export interface ItemDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ItemCategory;
  rarity: Rarity;
  value: number;
  slot?: EquipSlot;
  stats?: Partial<Stats>;
  classes?: ClassId[];
  levelReq?: number;
  /** Tamaño máximo de pila. 1 = no apilable. */
  stack?: number;
  /** Preparado para inventarios con objetos de varias casillas. En la demo todo ocupa 1x1. */
  size?: { w: number; h: number };
  use?: ItemEffect;
}

export interface ItemStack {
  uid: string;
  itemId: string;
  qty: number;
}

export type Grid = (ItemStack | null)[];
export type Equipment = Record<EquipSlot, ItemStack | null>;

export type StatusId = 'poison' | 'burn' | 'freeze' | 'stun' | 'bleed' | 'protect' | 'regen';

export interface StatusInstance {
  id: StatusId;
  turns: number;
}

export type DamageKind = 'physical' | 'magical';

export interface StatusApplication {
  status: StatusId;
  chance: number; // 0..1
  turns: number;
  /** Si es true se aplica al lanzador en vez de al objetivo. */
  self?: boolean;
}

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  cost: number;
  target: 'enemy' | 'self';
  kind?: DamageKind;
  power?: number;
  /** Curación como fracción de la vida máxima del lanzador. */
  healPct?: number;
  applies?: StatusApplication[];
  /** Daño extra contra no-muertos (para el Clérigo). */
  bonusVsUndead?: number;
  ignoresEvasion?: boolean;
  fx: 'slash' | 'fire' | 'frost' | 'shield' | 'poison' | 'holy' | 'dark' | 'bite' | 'smash';
}

export interface Appearance {
  cloak: number;
  skin: number;
}

export interface CharacterData {
  name: string;
  classId: ClassId;
  appearance: Appearance;
  level: number;
  xp: number;
}

export interface QuestProgress {
  id: string;
  progress: number;
  claimed: boolean;
}

export interface ProfileStats {
  expeditions: number;
  extractions: number;
  deaths: number;
  kills: number;
}

export interface Settings {
  volume: number; // 0..1
  music: boolean;
}

export interface Profile {
  version: 1;
  character: CharacterData;
  gold: number;
  backpack: Grid;
  stash: Grid;
  equipment: Equipment;
  quests: QuestProgress[];
  stats: ProfileStats;
  /** Marca de expedición en curso, para detectar recargas a mitad de partida. */
  activeExpedition: { startedAt: number } | null;
  tutorialSeen: { lobby: boolean; dungeon: boolean };
  settings: Settings;
  createdAt: number;
}
