import { RARITY_RULES } from './data/rarity';
import type { ItemStack } from './types';
import type { Profile } from './types';
import { getItem } from './data/items';
import { SELL_RATIO } from './data/merchant';
import { VENDORS, type VendorId } from './data/vendors';
import { REP_RANKS, rankOf } from '../config/reputation';
import { addToGrid, cloneGrid, STASH_SIZE } from './inventory';
import { STASH_ROW, STASH_UPGRADE_COSTS } from '../config/stash';
import { makeUid } from './rng';

export type EconomyResult = { ok: true; profile: Profile } | { ok: false; error: string };

/** Precio de compra: el valor del objeto, con el descuento del rango de reputación con ese vendedor. */
export function buyPrice(itemId: string, rep = 0): number {
  return Math.max(1, Math.round(getItem(itemId).value * (1 - REP_RANKS[rankOf(rep)].discount)));
}

/** Precio de venta. Un ejemplar de rareza superior a la de su ficha vale más (y uno con atributos, un poco más). */
export function sellPrice(itemId: string, stack?: Pick<ItemStack, 'rarity' | 'affixes'>): number {
  const def = getItem(itemId);
  const k = stack?.rarity ? RARITY_RULES[stack.rarity].statMult / RARITY_RULES[def.rarity].statMult : 1;
  const extra = 1 + 0.1 * (stack?.affixes?.length ?? 0);
  return Math.max(1, Math.floor(def.value * SELL_RATIO * k * k * extra));
}

export function buy(p: Profile, itemId: string, vendorId: VendorId = 'orvel'): EconomyResult {
  const entry = VENDORS[vendorId].stock.find((s) => s.itemId === itemId);
  if (!entry) return { ok: false, error: 'Este vendedor no vende eso.' };
  const rep = p.reputation?.[vendorId] ?? 0;
  if (rankOf(rep) < entry.rank) return { ok: false, error: `Necesitas el rango «${REP_RANKS[entry.rank].name}» con ${VENDORS[vendorId].name}.` };
  const price = buyPrice(itemId, rep);
  if (p.gold < price) return { ok: false, error: 'No tienes oro suficiente.' };
  const r = addToGrid(p.backpack, { uid: makeUid(), itemId, qty: 1 });
  if (r.leftover) return { ok: false, error: 'Tu mochila está llena.' };
  return { ok: true, profile: { ...p, gold: p.gold - price, backpack: r.grid } };
}

/** Vende una unidad (o toda la pila si all=true) desde la mochila o el almacén. */
export function sell(p: Profile, container: 'backpack' | 'stash', index: number, all = false): EconomyResult {
  const grid = cloneGrid(p[container]);
  const s = grid[index];
  if (!s) return { ok: false, error: 'No hay nada que vender.' };
  const qty = all ? s.qty : 1;
  const gain = sellPrice(s.itemId, s) * qty;
  if (s.qty - qty <= 0) grid[index] = null;
  else grid[index] = { ...s, qty: s.qty - qty };
  return { ok: true, profile: { ...p, gold: p.gold + gain, [container]: grid } };
}

/** Ampliaciones del almacén ya compradas (según su tamaño actual). */
export function stashUpgrades(p: Profile): number {
  return Math.max(0, Math.round((p.stash.length - STASH_SIZE) / STASH_ROW));
}

/** Compra una fila más de almacén con oro. */
export function upgradeStash(p: Profile): EconomyResult {
  const n = stashUpgrades(p);
  const cost = STASH_UPGRADE_COSTS[n];
  if (cost === undefined) return { ok: false, error: 'Tu almacén ya tiene el tamaño máximo.' };
  if (p.gold < cost) return { ok: false, error: `Necesitas ${cost} de oro.` };
  return { ok: true, profile: { ...p, gold: p.gold - cost, stash: [...p.stash, ...Array(STASH_ROW).fill(null)] } };
}
