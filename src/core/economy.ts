import type { Profile } from './types';
import { getItem } from './data/items';
import { MERCHANT_STOCK, SELL_RATIO } from './data/merchant';
import { addToGrid, cloneGrid } from './inventory';
import { makeUid } from './rng';

export type EconomyResult = { ok: true; profile: Profile } | { ok: false; error: string };

export function buyPrice(itemId: string): number {
  return getItem(itemId).value;
}

export function sellPrice(itemId: string): number {
  return Math.max(1, Math.floor(getItem(itemId).value * SELL_RATIO));
}

export function buy(p: Profile, itemId: string): EconomyResult {
  if (!MERCHANT_STOCK.includes(itemId)) return { ok: false, error: 'El mercader no vende eso.' };
  const price = buyPrice(itemId);
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
  const gain = sellPrice(s.itemId) * qty;
  if (s.qty - qty <= 0) grid[index] = null;
  else grid[index] = { ...s, qty: s.qty - qty };
  return { ok: true, profile: { ...p, gold: p.gold + gain, [container]: grid } };
}
