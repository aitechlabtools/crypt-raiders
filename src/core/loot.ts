import type { ItemStack } from './types';
import type { Rng } from './rng';
import { makeUid } from './rng';

export interface LootEntry { itemId: string | 'nothing'; weight: number; min?: number; max?: number }
export interface LootTable { rolls: number; gold: [number, number]; entries: LootEntry[] }

export interface LootResult { items: ItemStack[]; gold: number }

export function rollLoot(table: LootTable, rng: Rng): LootResult {
  const items: ItemStack[] = [];
  const total = table.entries.reduce((s, e) => s + e.weight, 0);
  for (let r = 0; r < table.rolls; r++) {
    let roll = rng.next() * total;
    for (const e of table.entries) {
      roll -= e.weight;
      if (roll < 0) {
        if (e.itemId !== 'nothing') {
          const qty = rng.int(e.min ?? 1, e.max ?? 1);
          const existing = items.find((i) => i.itemId === e.itemId);
          if (existing) existing.qty += qty;
          else items.push({ uid: makeUid(), itemId: e.itemId, qty });
        }
        break;
      }
    }
  }
  const gold = rng.int(table.gold[0], table.gold[1]);
  return { items, gold };
}

// Tablas de los cofres de la mazmorra.
export const CHEST_TABLES: Record<string, LootTable> = {
  // Niveles 1-3
  common: { rolls: 2, gold: [8, 25], entries: [
    { itemId: 'health_potion', weight: 25 }, { itemId: 'mana_potion', weight: 15 }, { itemId: 'old_coin', weight: 20, min: 1, max: 3 }, { itemId: 'antidote', weight: 8 },
    { itemId: 'leather_gloves', weight: 6 }, { itemId: 'worn_boots', weight: 6 }, { itemId: 'leather_hood', weight: 6 }, { itemId: 'copper_ring', weight: 6 },
    { itemId: 'iron_sword', weight: 4 }, { itemId: 'battle_axe', weight: 3 }, { itemId: 'ember_staff', weight: 4 }, { itemId: 'iron_shield', weight: 3 },
    { itemId: 'iron_helm', weight: 3 }, { itemId: 'wizard_hat', weight: 3 }, { itemId: 'chainmail', weight: 2 }, { itemId: 'gauntlets', weight: 3 }, { itemId: 'bone_amulet', weight: 2 },
  ] },
  // Niveles 3-5
  rich: { rolls: 3, gold: [20, 45], entries: [
    { itemId: 'golden_chalice', weight: 14 }, { itemId: 'health_potion', weight: 20 }, { itemId: 'mana_potion', weight: 8 },
    { itemId: 'iron_helm', weight: 6 }, { itemId: 'wizard_hat', weight: 6 }, { itemId: 'chainmail', weight: 6 }, { itemId: 'gauntlets', weight: 5 }, { itemId: 'arcane_tome', weight: 5 },
    { itemId: 'bone_amulet', weight: 6 }, { itemId: 'iron_shield', weight: 5 }, { itemId: 'battle_axe', weight: 4 },
    { itemId: 'knight_sword', weight: 4 }, { itemId: 'executioner_axe', weight: 3 }, { itemId: 'frost_staff', weight: 4 }, { itemId: 'bastion_shield', weight: 3 },
    { itemId: 'knight_helm', weight: 3 }, { itemId: 'shadow_robe', weight: 3 }, { itemId: 'swift_boots', weight: 3 }, { itemId: 'ring_of_embers', weight: 3 },
  ] },
  // Niveles 5-8
  boss: { rolls: 3, gold: [60, 120], entries: [
    { itemId: 'blood_gem', weight: 18 }, { itemId: 'golden_chalice', weight: 18 },
    { itemId: 'knight_sword', weight: 6 }, { itemId: 'executioner_axe', weight: 6 }, { itemId: 'frost_staff', weight: 6 }, { itemId: 'bastion_shield', weight: 6 },
    { itemId: 'knight_helm', weight: 5 }, { itemId: 'shadow_robe', weight: 5 }, { itemId: 'swift_boots', weight: 5 }, { itemId: 'ring_of_embers', weight: 5 },
    { itemId: 'dread_blade', weight: 3 }, { itemId: 'bonereaver', weight: 3 }, { itemId: 'runic_staff', weight: 3 }, { itemId: 'eclipse_grimoire', weight: 3 },
    { itemId: 'bastion_plate', weight: 3 }, { itemId: 'archmage_robe', weight: 3 }, { itemId: 'heart_of_umbravel', weight: 2 },
  ] },
};
