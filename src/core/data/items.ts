import type { ItemDef, Rarity } from '../types';

// Catálogo de objetos basado en datos. Añadir un objeto = añadir una entrada.
export const RARITY_INFO: Record<Rarity, { name: string; color: string; order: number }> = {
  common: { name: 'Común', color: '#9a9a9a', order: 0 },
  uncommon: { name: 'Poco común', color: '#5fbf4a', order: 1 },
  rare: { name: 'Raro', color: '#4a8fe0', order: 2 },
  epic: { name: 'Épico', color: '#a35ae0', order: 3 },
  legendary: { name: 'Legendario', color: '#e8b33a', order: 4 },
};

const list: ItemDef[] = [
  // ── Armas ──────────────────────────────────────────────
  { id: 'rusty_sword', name: 'Espada oxidada', description: 'Ha visto días mejores. Todavía corta.', icon: 'sword', category: 'weapon', slot: 'mainHand', rarity: 'common', value: 12, stats: { atk: 4 }, classes: ['warrior', 'rogue'] },
  { id: 'iron_sword', name: 'Espada de hierro', description: 'Forjada en las fraguas del Bastión.', icon: 'sword', category: 'weapon', slot: 'mainHand', rarity: 'uncommon', value: 45, stats: { atk: 7, crit: 2 }, classes: ['warrior', 'rogue'] },
  { id: 'executioner_axe', name: 'Hacha del verdugo', description: 'Pesada, cruel, definitiva.', icon: 'axe', category: 'weapon', slot: 'mainHand', rarity: 'rare', value: 140, stats: { atk: 12, crit: 5, spd: -1 }, classes: ['warrior'], levelReq: 2 },
  { id: 'apprentice_staff', name: 'Báculo de aprendiz', description: 'Madera de fresno con una runa tímida.', icon: 'staff', category: 'weapon', slot: 'mainHand', rarity: 'common', value: 12, stats: { mag: 4, maxMp: 5 }, classes: ['mage', 'cleric'] },
  { id: 'ember_staff', name: 'Báculo de brasas', description: 'Su punta nunca termina de enfriarse.', icon: 'staff_fire', category: 'weapon', slot: 'mainHand', rarity: 'uncommon', value: 50, stats: { mag: 8, maxMp: 8 }, classes: ['mage'] },
  { id: 'runic_staff', name: 'Bastón rúnico de Umbravel', description: 'Susurra nombres que nadie debería recordar.', icon: 'staff_rune', category: 'weapon', slot: 'mainHand', rarity: 'epic', value: 320, stats: { mag: 15, maxMp: 15, crit: 4 }, classes: ['mage'], levelReq: 2 },
  { id: 'bone_dagger', name: 'Daga de hueso', description: 'Tallada a partir de algo que antes caminaba.', icon: 'dagger', category: 'weapon', slot: 'mainHand', rarity: 'uncommon', value: 40, stats: { atk: 5, crit: 6, spd: 2 }, classes: ['rogue', 'warrior'] },

  // ── Escudos y secundarias ─────────────────────────────
  { id: 'wooden_shield', name: 'Escudo de madera', description: 'Mejor que nada. Por poco.', icon: 'shield', category: 'shield', slot: 'offHand', rarity: 'common', value: 10, stats: { def: 3 }, classes: ['warrior', 'cleric'] },
  { id: 'bastion_shield', name: 'Escudo del Bastión', description: 'Hierro remachado con el emblema de una orden caída.', icon: 'shield_iron', category: 'shield', slot: 'offHand', rarity: 'rare', value: 120, stats: { def: 7, res: 3 }, classes: ['warrior', 'cleric'] },
  { id: 'arcane_tome', name: 'Tomo arcano', description: 'Páginas que se pasan solas.', icon: 'tome', category: 'relic', slot: 'offHand', rarity: 'uncommon', value: 55, stats: { mag: 3, maxMp: 10 }, classes: ['mage', 'cleric'] },

  // ── Cabeza ────────────────────────────────────────────
  { id: 'leather_hood', name: 'Capucha de cuero', description: 'Huele a lluvia y a humo.', icon: 'hood', category: 'helmet', slot: 'helmet', rarity: 'common', value: 8, stats: { def: 1, eva: 2 } },
  { id: 'iron_helm', name: 'Yelmo de hierro', description: 'Abollado, pero entero.', icon: 'helm', category: 'helmet', slot: 'helmet', rarity: 'uncommon', value: 40, stats: { def: 4, maxHp: 10 }, classes: ['warrior', 'cleric'] },
  { id: 'wizard_hat', name: 'Sombrero del erudito', description: 'Bordado con constelaciones olvidadas.', icon: 'hat', category: 'helmet', slot: 'helmet', rarity: 'uncommon', value: 40, stats: { mag: 3, res: 3 }, classes: ['mage'] },

  // ── Torso ─────────────────────────────────────────────
  { id: 'padded_tunic', name: 'Jubón acolchado', description: 'Ropa de recluta.', icon: 'tunic', category: 'armor', slot: 'armor', rarity: 'common', value: 10, stats: { def: 3, maxHp: 5 } },
  { id: 'chainmail', name: 'Cota de malla', description: 'Cada anilla, una promesa.', icon: 'chainmail', category: 'armor', slot: 'armor', rarity: 'uncommon', value: 60, stats: { def: 7, maxHp: 15, spd: -1 }, classes: ['warrior', 'cleric'] },
  { id: 'linen_robe', name: 'Túnica de lino', description: 'Ligera y discreta.', icon: 'robe', category: 'armor', slot: 'armor', rarity: 'common', value: 10, stats: { def: 1, res: 4, maxMp: 5 } },
  { id: 'shadow_robe', name: 'Túnica de las sombras', description: 'La oscuridad se pliega a su alrededor.', icon: 'robe_dark', category: 'armor', slot: 'armor', rarity: 'rare', value: 130, stats: { def: 3, res: 8, mag: 4, maxMp: 10 }, classes: ['mage', 'cleric'] },

  // ── Manos y pies ──────────────────────────────────────
  { id: 'leather_gloves', name: 'Guantes de cuero', description: 'Agarre firme.', icon: 'gloves', category: 'gloves', slot: 'gloves', rarity: 'common', value: 8, stats: { atk: 1, crit: 1 } },
  { id: 'gauntlets', name: 'Guanteletes de acero', description: 'Puños que no se rinden.', icon: 'gauntlets', category: 'gloves', slot: 'gloves', rarity: 'uncommon', value: 35, stats: { atk: 2, def: 2 }, classes: ['warrior', 'cleric'] },
  { id: 'worn_boots', name: 'Botas gastadas', description: 'Conocen muchos caminos.', icon: 'boots', category: 'boots', slot: 'boots', rarity: 'common', value: 8, stats: { spd: 1, def: 1 } },
  { id: 'swift_boots', name: 'Botas del correveidile', description: 'Para quien sabe cuándo huir.', icon: 'boots_swift', category: 'boots', slot: 'boots', rarity: 'rare', value: 110, stats: { spd: 4, eva: 4 } },

  // ── Joyería ───────────────────────────────────────────
  { id: 'copper_ring', name: 'Anillo de cobre', description: 'Deja la piel verde.', icon: 'ring', category: 'jewel', slot: 'ring', rarity: 'common', value: 15, stats: { maxHp: 6 } },
  { id: 'ring_of_embers', name: 'Anillo de ascuas', description: 'Tibio al tacto, siempre.', icon: 'ring_red', category: 'jewel', slot: 'ring', rarity: 'rare', value: 150, stats: { mag: 4, atk: 4, crit: 3 } },
  { id: 'bone_amulet', name: 'Amuleto de hueso', description: 'Protege de lo que viene de abajo.', icon: 'amulet', category: 'jewel', slot: 'amulet', rarity: 'uncommon', value: 45, stats: { res: 4, maxHp: 8 } },
  { id: 'heart_of_umbravel', name: 'Corazón de Umbravel', description: 'Late. Despacio. Contigo.', icon: 'amulet_heart', category: 'jewel', slot: 'amulet', rarity: 'legendary', value: 900, stats: { maxHp: 30, mag: 6, atk: 6, res: 6, def: 4 }, levelReq: 2 },

  // ── Consumibles ───────────────────────────────────────
  { id: 'health_potion', name: 'Poción de vida', description: 'Restaura 45 puntos de vida.', icon: 'potion_red', category: 'potion', rarity: 'common', value: 20, stack: 5, use: { kind: 'heal', amount: 45 } },
  { id: 'mana_potion', name: 'Poción de maná', description: 'Restaura 25 puntos de maná o aguante.', icon: 'potion_blue', category: 'potion', rarity: 'common', value: 20, stack: 5, use: { kind: 'mana', amount: 25 } },
  { id: 'antidote', name: 'Antídoto amargo', description: 'Elimina veneno, quemadura y sangrado.', icon: 'potion_green', category: 'potion', rarity: 'uncommon', value: 25, stack: 5, use: { kind: 'cleanse' } },

  // ── Tesoros y materiales ──────────────────────────────
  { id: 'bone_dust', name: 'Polvo de hueso', description: 'Los alquimistas pagan por él.', icon: 'dust', category: 'material', rarity: 'common', value: 6, stack: 10 },
  { id: 'bat_wing', name: 'Ala de murciélago', description: 'Fina como el pergamino.', icon: 'wing', category: 'material', rarity: 'common', value: 5, stack: 10 },
  { id: 'old_coin', name: 'Moneda antigua', description: 'Acuñada por un reino que ya no existe.', icon: 'coin', category: 'coin', rarity: 'uncommon', value: 15, stack: 20 },
  { id: 'golden_chalice', name: 'Cáliz dorado', description: 'Aún conserva restos de vino oscuro.', icon: 'chalice', category: 'relic', rarity: 'rare', value: 180, stack: 1 },
  { id: 'blood_gem', name: 'Gema de sangre', description: 'Brilla más cuando alguien muere cerca.', icon: 'gem_red', category: 'jewel', rarity: 'epic', value: 260, stack: 1 },
  { id: 'crypt_key', name: 'Llave de la cripta', description: 'Fría y pesada. Abre algo, en algún lugar.', icon: 'key', category: 'key', rarity: 'uncommon', value: 30, stack: 1 },
];

export const ITEMS: Record<string, ItemDef> = Object.fromEntries(list.map((i) => [i.id, i]));

export function getItem(id: string): ItemDef {
  const def = ITEMS[id];
  if (!def) throw new Error(`Objeto desconocido: ${id}`);
  return def;
}

export function maxStack(id: string): number {
  return getItem(id).stack ?? 1;
}
