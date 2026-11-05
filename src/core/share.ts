// Reparto con el errante aliado: valor de un botín y cómo le pagas su parte en el portal.
// Pagar: primero monedas de la mochila, luego del bolsillo seguro y, si no llega, objetos de la mochila de valor parecido.
import type { Grid, ItemStack } from './types';
import { cloneGrid, isCover, removeAt } from './inventory';
import { gridGold, isGoldContainer } from './gold';
import { stackGoldValue, takeCoins } from './wallet';

/** Valor (en monedas) de lo que hay en un cofre o saco. */
export function lootValue(grid: Grid): number {
  return Math.round(grid.reduce((n, s) => n + stackGoldValue(s), 0));
}

export interface Payment {
  backpack: Grid;
  pocket: Grid;
  /** Monedas pagadas. */
  gold: number;
  /** Objetos que se lleva para completar. */
  items: ItemStack[];
  itemsValue: number;
  /** Ni con todo llega: se lleva lo que hay. */
  short: boolean;
}

/** Calcula el pago de `amount` monedas (sin tocar las rejillas originales). */
export function planPayment(backpack0: Grid, pocket0: Grid, amount: number): Payment {
  let backpack = cloneGrid(backpack0);
  let pocket = cloneGrid(pocket0);
  let left = Math.max(0, Math.round(amount));
  let gold = 0;
  const fromBp = Math.min(left, gridGold(backpack));
  if (fromBp) { backpack = takeCoins(backpack, fromBp) ?? backpack; left -= fromBp; gold += fromBp; }
  const fromPk = Math.min(left, gridGold(pocket));
  if (fromPk) { pocket = takeCoins(pocket, fromPk) ?? pocket; left -= fromPk; gold += fromPk; }
  const items: ItemStack[] = [];
  let itemsValue = 0;
  while (left > 0) {
    const cands = backpack.map((s, i) => [s, i] as const)
      .filter(([s]) => s && !isCover(s) && !isGoldContainer(s) && stackGoldValue(s) > 0)
      .map(([s, i]) => ({ i, v: stackGoldValue(s) }));
    if (!cands.length) break;
    // El objeto más barato que cubre lo que falta; si ninguno llega, el más caro (y se sigue)
    const cover = cands.filter((c) => c.v >= left).sort((a, b) => a.v - b.v)[0];
    const pick = cover ?? cands.sort((a, b) => b.v - a.v)[0];
    const { stack } = removeAt(backpack, pick.i);
    if (!stack) break;
    items.push(stack);
    itemsValue += Math.round(pick.v);
    left -= Math.round(pick.v);
  }
  return { backpack, pocket, gold, items, itemsValue, short: left > 0 };
}
