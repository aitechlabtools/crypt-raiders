// Cartera: el oro de un personaje son las monedas de sus páginas propias del almacén (no las de «Compartido»).
// `profile.gold` es solo un reflejo de esa suma (lo pone al día el juego después de cada cambio).
// Pagar: primero monedas sueltas, luego saquitos y por último sacos. Cobrar: primero en los sacos con hueco, luego sueltas.
import type { Grid, ItemStack, Profile } from './types';
import { addToGrid, cloneGrid, isCover } from './inventory';
import { capacityOf, coins, gridGold, isCoins } from './gold';
import { makeUid } from './rng';
import { getItem } from './data/items';
import { COIN_STACK, CONTAINER_CAPACITY, GOLD_SCALE } from '../config/gold';

export const walletGold = (p: Pick<Profile, 'stash'>): number => gridGold(p.stash);
export function syncGold<T extends Profile>(p: T): T { const g = gridGold(p.stash); return p.gold === g ? p : { ...p, gold: g }; }

/** Quita `amount` monedas de la rejilla. Devuelve null si no hay bastante. */
export function takeCoins(grid: Grid, amount: number): Grid | null {
  if (amount <= 0) return grid;
  if (gridGold(grid) < amount) return null;
  const g = cloneGrid(grid);
  let left = amount;
  // 1 · monedas sueltas (de los montones más pequeños a los más grandes, para liberar casillas)
  const loose = g.map((s, i) => [s, i] as const).filter(([s]) => isCoins(s)).sort((a, b) => a[0]!.qty - b[0]!.qty);
  for (const [s, i] of loose) { if (!left) break; const n = Math.min(left, s!.qty); left -= n; g[i] = s!.qty - n ? { ...s!, qty: s!.qty - n } : null; }
  // 2 · saquitos y 3 · sacos (de menos capacidad a más)
  const bags = g.map((s, i) => [s, i] as const).filter(([s]) => capacityOf(s) > 0 && (s!.gold ?? 0) > 0).sort((a, b) => capacityOf(a[0]) - capacityOf(b[0]) || (a[0]!.gold ?? 0) - (b[0]!.gold ?? 0));
  for (const [s, i] of bags) { if (!left) break; const n = Math.min(left, s!.gold ?? 0); left -= n; g[i] = { ...s!, gold: (s!.gold ?? 0) - n }; }
  return left ? null : g;
}

/** Mete `amount` monedas en la rejilla: primero en los sacos con hueco (los más llenos antes) y luego sueltas. Null si no caben. */
export function putCoins(grid: Grid, amount: number): Grid | null {
  if (amount <= 0) return grid;
  let g = cloneGrid(grid);
  let left = amount;
  const bags = g.map((s, i) => [s, i] as const).filter(([s]) => capacityOf(s) > (s?.gold ?? 0)).sort((a, b) => (b[0]!.gold ?? 0) - (a[0]!.gold ?? 0));
  for (const [s, i] of bags) { if (!left) break; const n = Math.min(left, capacityOf(s) - (s!.gold ?? 0)); left -= n; g[i] = { ...s!, gold: (s!.gold ?? 0) + n }; }
  if (left) { const r = addToGrid(g, coins(left)); if (r.leftover) return null; g = r.grid; }
  return g;
}

export type WalletResult = { ok: true; profile: Profile } | { ok: false; error: string };
export const NOT_ENOUGH = 'Oro insuficiente.';
export const NO_ROOM_FOR_GOLD = 'No hay sitio en tu almacén para el oro: pulsa «Agrupar oro», compra un saquito o libera alguna casilla.';

export function spendGold(p: Profile, amount: number): WalletResult {
  const stash = takeCoins(p.stash, amount);
  if (!stash) return { ok: false, error: NOT_ENOUGH };
  return { ok: true, profile: syncGold({ ...p, stash }) };
}
export function earnGold(p: Profile, amount: number): WalletResult {
  const stash = putCoins(p.stash, amount);
  if (!stash) return { ok: false, error: NO_ROOM_FOR_GOLD };
  return { ok: true, profile: syncGold({ ...p, stash }) };
}
/** Cobrar sin poder fallar (recompensas): si no cabe en el almacén, lo que sobre va a la mochila; nunca se pierde. */
export function earnGoldSafe(p: Profile, amount: number): Profile {
  const r = earnGold(p, amount);
  if (r.ok) return r.profile;
  const bp = putCoins(p.backpack, amount);
  if (bp) return syncGold({ ...p, backpack: bp });
  // Último recurso: una página más llena de monedas (no ocurre en la práctica)
  return syncGold({ ...p, stash: [...p.stash, ...giftGold(amount, 120)] });
}

/**
 * Convierte una cantidad de monedas en objetos que ocupen poco: sacos llenos (250, 2×2), saquitos (50) y monedas sueltas.
 * Devuelve las pilas (sin colocar).
 */
export function goldAsStacks(amount: number): ItemStack[] {
  const out: ItemStack[] = [];
  let left = Math.max(0, Math.floor(amount));
  const sackCap = CONTAINER_CAPACITY.gold_sack, pouchCap = CONTAINER_CAPACITY.gold_pouch;
  while (left >= sackCap) { out.push({ uid: makeUid(), itemId: 'gold_sack', qty: 1, gold: sackCap }); left -= sackCap; }
  // Si sobran más de dos saquitos, mejor otro saco (ocupa 4 casillas en lugar de 3 o 4 saquitos)
  if (left > pouchCap * 3) { out.push({ uid: makeUid(), itemId: 'gold_sack', qty: 1, gold: left }); left = 0; }
  while (left >= pouchCap) { out.push({ uid: makeUid(), itemId: 'gold_pouch', qty: 1, gold: pouchCap }); left -= pouchCap; }
  if (left > COIN_STACK) { out.push({ uid: makeUid(), itemId: 'gold_pouch', qty: 1, gold: left }); left = 0; }
  if (left > 0) out.push(coins(left));
  return out;
}
/** Rejilla nueva con el oro en sacos (para el último recurso de earnGoldSafe). */
function giftGold(amount: number, size: number): Grid {
  let g: Grid = Array.from({ length: size }, () => null);
  for (const s of goldAsStacks(amount)) g = addToGrid(g, s, { cols: 8, blockRows: 15 }).grid;
  return g;
}

// ── Escala de la economía (÷10) ──
/** Precio o coste fijo en la escala nueva (mínimo 1). */
export const scaleCost = (old: number): number => Math.max(1, Math.round(old * GOLD_SCALE));
/** Botín: se divide con un redondeo al azar que conserva la media (7 → 0 o 1 con 70 %). */
export function scaleLoot(old: number, rnd: () => number = Math.random): number {
  const x = old * GOLD_SCALE;
  const base = Math.floor(x);
  return base + (rnd() < x - base ? 1 : 0);
}
/** Valor en monedas de una casilla (para «extraer botín por valor de…» y el oro en riesgo). */
export function stackGoldValue(s: ItemStack | null): number {
  if (!s || isCover(s)) return 0;
  if (isCoins(s)) return s.qty;
  return (s.gold ?? 0) + getItem(s.itemId).value * GOLD_SCALE * s.qty;
}

/** Solo para pruebas y modo ?debug: deja al personaje con exactamente `amount` monedas en su almacén (en sacos). */
export function setGoldExactly(p: Profile, amount: number): Profile {
  let stash: Grid = p.stash.map((x) => (x && (isCoins(x) || capacityOf(x) > 0) ? null : x));
  stash = stash.map((x) => (x && isCover(x) && !stash.some((y) => y && 'cover:' + y.uid === x.uid) ? null : x));
  for (const st of goldAsStacks(amount)) {
    let r = addToGrid(stash, st, { cols: 8, blockRows: 15 });
    while (r.leftover) { stash = [...stash, ...Array.from({ length: 120 }, () => null)]; r = addToGrid(stash, st, { cols: 8, blockRows: 15 }); }
    stash = r.grid;
  }
  return syncGold({ ...p, stash });
}

/** Mete hasta `amount` monedas (sacos con hueco primero, luego sueltas). Devuelve la rejilla y las que no cupieron. */
export function putCoinsPartial(grid: Grid, amount: number): { grid: Grid; left: number } {
  let lo = 0, hi = amount, best: Grid = grid;
  // Búsqueda de la mayor cantidad que cabe (las rejillas son pequeñas: basta con probar)
  while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); const g = putCoins(grid, mid); if (g) { lo = mid; best = g; } else hi = mid - 1; }
  return { grid: lo ? best : grid, left: amount - lo };
}
