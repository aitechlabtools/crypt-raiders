// ════════════════════════════════════════════════════════════════════
// Tipos de cofre y sus llaves. Cada tabla de botín (loot.ts → CHEST_TABLES) tiene aquí su aspecto
// y la llave que la abre (null = no necesita llave). Todo es editable.
// ════════════════════════════════════════════════════════════════════

export interface ChestType {
  name: string;
  /** Objeto llave que se gasta al abrirlo; null si se abre sin llave. */
  key: string | null;
  /** Textura del cofre en el mapa (chest_common, chest_rich o chest_boss). */
  look: 'common' | 'rich' | 'boss';
}

export const CHEST_TYPES: Record<string, ChestType> = {
  common: { name: 'Baúl podrido', key: null, look: 'common' },
  rich: { name: 'Cofre de hierro', key: 'iron_key', look: 'rich' },
  boss: { name: 'Relicario sellado', key: 'relic_key', look: 'boss' },
  'cripta:common': { name: 'Baúl podrido', key: null, look: 'common' },
  'cripta:rich': { name: 'Arca sepulcral', key: 'bone_key', look: 'rich' },
  'cripta:boss': { name: 'Relicario sellado', key: 'relic_key', look: 'boss' },
  'infierno:common': { name: 'Baúl calcinado', key: null, look: 'common' },
  'infierno:rich': { name: 'Cofre infernal', key: 'sulfur_key', look: 'rich' },
  'infierno:boss': { name: 'Relicario sellado', key: 'relic_key', look: 'boss' },
  // Tutorial
  'tut:box': { name: 'Baúl abandonado', key: null, look: 'common' },
  'tut:rich': { name: 'Cofre de hierro', key: 'iron_key', look: 'rich' },
};

export function chestType(table: string): ChestType {
  return CHEST_TYPES[table] ?? CHEST_TYPES.common;
}

/** Tamaño del bolsillo seguro: lo que guardes ahí no se pierde al morir. */
export const POCKET_SIZE = 3;
/** Categorías que caben en el bolsillo seguro (objetos pequeños). */
export const POCKETABLE = ['key', 'jewel', 'coin', 'potion', 'material'];
