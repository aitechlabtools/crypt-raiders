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
  common: { rolls: 2, gold: [8, 25], entries: [
    { itemId: 'health_potion', weight: 25 }, { itemId: 'mana_potion', weight: 15 }, { itemId: 'old_coin', weight: 20, min: 1, max: 3 },
    { itemId: 'leather_gloves', weight: 8 }, { itemId: 'worn_boots', weight: 8 }, { itemId: 'leather_hood', weight: 8 },
    { itemId: 'copper_ring', weight: 8 }, { itemId: 'iron_sword', weight: 5 }, { itemId: 'ember_staff', weight: 5 }, { itemId: 'antidote', weight: 8 },
  ] },
  rich: { rolls: 3, gold: [20, 45], entries: [
    { itemId: 'golden_chalice', weight: 14 }, { itemId: 'health_potion', weight: 20 }, { itemId: 'iron_helm', weight: 10 },
    { itemId: 'wizard_hat', weight: 10 }, { itemId: 'chainmail', weight: 8 }, { itemId: 'shadow_robe', weight: 6 },
    { itemId: 'swift_boots', weight: 6 }, { itemId: 'bone_amulet', weight: 10 }, { itemId: 'gauntlets', weight: 8 }, { itemId: 'arcane_tome', weight: 8 },
  ] },
  boss: { rolls: 3, gold: [60, 120], entries: [
    { itemId: 'heart_of_umbravel', weight: 8 }, { itemId: 'blood_gem', weight: 22 }, { itemId: 'golden_chalice', weight: 22 },
    { itemId: 'ring_of_embers', weight: 16 }, { itemId: 'bastion_shield', weight: 16 }, { itemId: 'runic_staff', weight: 8 }, { itemId: 'executioner_axe', weight: 8 },
  ] },
};
