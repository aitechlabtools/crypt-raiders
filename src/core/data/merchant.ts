// Existencias básicas de Orvel (sin reputación). La mercancía completa de cada vendedor está en data/vendors.ts.
// Precio de compra = valor (menos el descuento de reputación); venta = 40% del valor.
export const MERCHANT_STOCK: string[] = [
  'health_potion', 'mana_potion', 'antidote', 'iron_key',
  // Guerrero
  'rusty_sword', 'iron_sword', 'battle_axe', 'wooden_shield', 'iron_shield', 'iron_helm', 'chainmail', 'gauntlets',
  // Mago
  'apprentice_staff', 'ember_staff', 'arcane_tome', 'wizard_hat', 'linen_robe',
  // Para todos
  'leather_hood', 'padded_tunic', 'leather_gloves', 'worn_boots', 'copper_ring', 'bone_amulet',
];
export const SELL_RATIO = 0.4;
