// Oro físico: monedas sueltas (de 10 en 10) y contenedores (saquito 1×1 de 50, saco 2×2 de 250).
// Las monedas de un contenedor van en su campo `gold`. Todo opera sobre una rejilla con su forma (LAYOUTS).
import type { Grid, ItemStack } from './types';
import { addToGrid, anchorIndex, cloneGrid, isCover, type GridLayout } from './inventory';
import { COIN_ID, COIN_STACK, CONTAINER_CAPACITY } from '../config/gold';
import { makeUid } from './rng';

export const isCoins = (s: ItemStack | null | undefined): boolean => !!s && s.itemId === COIN_ID;
export const capacityOf = (s: ItemStack | null | undefined): number => (s ? CONTAINER_CAPACITY[s.itemId] ?? 0 : 0);
export const isGoldContainer = (s: ItemStack | null | undefined): boolean => capacityOf(s) > 0;
/** Oro que lleva una casilla (monedas o contenido de un saco). */
export function goldOf(s: ItemStack | null | undefined): number {
  if (!s || isCover(s)) return 0;
  if (isCoins(s)) return s.qty;
  return isGoldContainer(s) ? s.gold ?? 0 : 0;
}
export function gridGold(g: Grid): number { return g.reduce((n, s) => n + goldOf(s), 0); }
export const coins = (qty: number): ItemStack => ({ uid: makeUid(), itemId: COIN_ID, qty });

export type GoldResult = { ok: true; grid: Grid; moved: number } | { ok: false; error: string };

/** Mete en un contenedor (casilla `to`) las monedas de la casilla `from` de la misma rejilla. Lo que no cabe se queda. */
export function depositCoins(g0: Grid, from: number, to: number): GoldResult {
  const g = cloneGrid(g0);
  const ti = anchorIndex(g, to);
  const src = g[from], dst = ti >= 0 ? g[ti] : null;
  if (!isCoins(src) || !isGoldContainer(dst)) return { ok: false, error: 'Eso no se puede meter ahí.' };
  const room = capacityOf(dst) - (dst!.gold ?? 0);
  if (room <= 0) return { ok: false, error: 'Ese saco ya está lleno.' };
  const n = Math.min(room, src!.qty);
  g[ti] = { ...dst!, gold: (dst!.gold ?? 0) + n };
  g[from] = src!.qty - n > 0 ? { ...src!, qty: src!.qty - n } : null;
  return { ok: true, grid: g, moved: n };
}

/** Saca `n` monedas de un contenedor a la rejilla (apilando de 10 en 10). Lo que no quepa se queda dentro. */
export function withdrawCoins(g0: Grid, at: number, n: number, layout?: GridLayout): GoldResult {
  const g = cloneGrid(g0);
  const i = anchorIndex(g, at);
  const c = i >= 0 ? g[i] : null;
  if (!isGoldContainer(c)) return { ok: false, error: 'Ahí no hay ningún saco.' };
  const take = Math.max(0, Math.min(Math.floor(n), c!.gold ?? 0));
  if (!take) return { ok: false, error: 'El saco está vacío.' };
  const r = addToGrid(g, coins(take), layout);
  const left = r.leftover?.qty ?? 0;
  if (left === take) return { ok: false, error: 'No hay sitio para las monedas.' };
  const out = r.grid;
  out[i] = { ...c!, gold: (c!.gold ?? 0) - (take - left) };
  return { ok: true, grid: out, moved: take - left };
}

/** Separa `n` monedas de un montón a una casilla libre (la más cercana por delante). */
export function splitCoins(g0: Grid, at: number, n: number): GoldResult {
  const g = cloneGrid(g0);
  const s = g[at];
  if (!isCoins(s) || n <= 0 || n >= s!.qty) return { ok: false, error: 'No se puede dividir así.' };
  let free = -1;
  for (let k = 1; k < g.length && free < 0; k++) { const a = at + k, b = at - k; if (a < g.length && !g[a]) free = a; else if (b >= 0 && !g[b]) free = b; }
  if (free < 0) return { ok: false, error: 'No hay una casilla libre para separar las monedas.' };
  g[at] = { ...s!, qty: s!.qty - n };
  g[free] = coins(n);
  return { ok: true, grid: g, moved: n };
}

/**
 * «Agrupar oro»: mete las monedas sueltas en los sacos con hueco (primero los más llenos) y junta las que sobren
 * en montones de 10. No mueve ni toca nada más.
 */
export function groupGold(g0: Grid): { grid: Grid; moved: number } {
  const g = cloneGrid(g0);
  let loose = 0;
  const looseAt: number[] = [];
  g.forEach((s, i) => { if (isCoins(s)) { loose += s!.qty; looseAt.push(i); } });
  if (!loose) return { grid: g, moved: 0 };
  const before = loose;
  const bags = g.map((s, i) => [s, i] as const).filter(([s]) => isGoldContainer(s) && (s!.gold ?? 0) < capacityOf(s)).sort((a, b) => (b[0]!.gold ?? 0) - (a[0]!.gold ?? 0));
  for (const [s, i] of bags) {
    if (!loose) break;
    const n = Math.min(loose, capacityOf(s) - (s!.gold ?? 0));
    g[i] = { ...s!, gold: (s!.gold ?? 0) + n };
    loose -= n;
  }
  // Lo que sobra, en montones de 10 en las casillas donde ya había monedas (por orden)
  for (const i of looseAt) {
    const n = Math.min(COIN_STACK, loose);
    g[i] = n > 0 ? { ...g0[i]!, qty: n } : null;
    loose -= n;
  }
  return { grid: g, moved: before - loose };
}
