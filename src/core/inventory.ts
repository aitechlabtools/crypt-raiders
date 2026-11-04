import { POCKETABLE } from './data/chests';
import type { ClassId, EquipSlot, Equipment, Grid, ItemStack } from './types';
import { EQUIP_SLOTS } from './types';
import { isTwoHanded } from './data/weapons';
import { getItem, maxStack, RARITY_INFO } from './data/items';
import { makeUid } from './rng';

export const BACKPACK_SIZE = 24; // 6 x 4
export const STASH_SIZE = 40; // 8 x 5

export function emptyGrid(size: number): Grid {
  return Array.from({ length: size }, () => null);
}

export function emptyEquipment(): Equipment {
  return Object.fromEntries(EQUIP_SLOTS.map((s) => [s, null])) as Equipment;
}

export function cloneGrid(g: Grid): Grid {
  return g.map((s) => (s ? { ...s } : null));
}

/** Añade una pila al inventario: primero rellena pilas compatibles, luego casillas libres. */
export function addToGrid(grid: Grid, stack: ItemStack): { grid: Grid; leftover: ItemStack | null } {
  const g = cloneGrid(grid);
  let qty = stack.qty;
  const max = maxStack(stack.itemId);
  if (max > 1) {
    for (const s of g) {
      if (qty <= 0) break;
      if (s && s.itemId === stack.itemId && s.qty < max) {
        const add = Math.min(max - s.qty, qty);
        s.qty += add;
        qty -= add;
      }
    }
  }
  for (let i = 0; i < g.length && qty > 0; i++) {
    if (!g[i]) {
      const add = Math.min(max, qty);
      g[i] = { ...stack, uid: qty === stack.qty ? stack.uid : makeUid(), qty: add };
      qty -= add;
    }
  }
  return { grid: g, leftover: qty > 0 ? { ...stack, qty } : null };
}

export function addManyToGrid(grid: Grid, stacks: ItemStack[]): { grid: Grid; leftovers: ItemStack[] } {
  let g = grid;
  const leftovers: ItemStack[] = [];
  for (const s of stacks) {
    const r = addToGrid(g, s);
    g = r.grid;
    if (r.leftover) leftovers.push(r.leftover);
  }
  return { grid: g, leftovers };
}

export function countItem(grid: Grid, itemId: string): number {
  return grid.reduce((n, s) => n + (s && s.itemId === itemId ? s.qty : 0), 0);
}

/** Quita `qty` unidades de un objeto (de las pilas que haga falta). */
export function removeItem(grid: Grid, itemId: string, qty = 1): Grid | null {
  if (countItem(grid, itemId) < qty) return null;
  const g = cloneGrid(grid);
  let left = qty;
  for (let i = g.length - 1; i >= 0 && left > 0; i--) {
    const s = g[i];
    if (s && s.itemId === itemId) {
      const take = Math.min(s.qty, left);
      s.qty -= take;
      left -= take;
      if (s.qty <= 0) g[i] = null;
    }
  }
  return g;
}

export function gridValue(grid: Grid): number {
  return grid.reduce((n, s) => n + (s ? getItem(s.itemId).value * s.qty : 0), 0);
}

export function freeSlots(grid: Grid): number {
  return grid.filter((s) => !s).length;
}

const CATEGORY_ORDER = ['weapon', 'shield', 'helmet', 'armor', 'gloves', 'boots', 'ring', 'amulet', 'jewel', 'relic', 'potion', 'tool', 'key', 'coin', 'material', 'quest'];

/** Ordena: fusiona pilas y ordena por categoría, rareza y nombre. */
export function sortGrid(grid: Grid): Grid {
  let merged: Grid = emptyGrid(grid.length);
  for (const s of grid) if (s) merged = addToGrid(merged, s).grid;
  const items = merged.filter((s): s is ItemStack => !!s);
  items.sort((a, b) => {
    const da = getItem(a.itemId);
    const db = getItem(b.itemId);
    const ca = CATEGORY_ORDER.indexOf(da.category === 'jewel' && da.slot ? da.slot : da.category);
    const cb = CATEGORY_ORDER.indexOf(db.category === 'jewel' && db.slot ? db.slot : db.category);
    if (ca !== cb) return ca - cb;
    const ra = RARITY_INFO[da.rarity].order;
    const rb = RARITY_INFO[db.rarity].order;
    if (ra !== rb) return rb - ra;
    return da.name.localeCompare(db.name);
  });
  const out = emptyGrid(grid.length);
  items.forEach((s, i) => (out[i] = s));
  return out;
}

// ── Transferencias entre contenedores (mochila, almacén, equipo) ──

export type ContainerId = 'backpack' | 'stash' | 'loot' | 'pocket';
export type Loc = { kind: 'grid'; container: ContainerId; index: number } | { kind: 'equip'; slot: EquipSlot };

export interface Containers {
  backpack: Grid;
  stash: Grid;
  loot: Grid;
  /** Bolsillo seguro: no se pierde al morir. Solo objetos pequeños. */
  pocket: Grid;
  equipment: Equipment;
}

export const POCKET_ERROR = 'En el bolsillo seguro solo caben objetos pequeños: llaves, joyas, monedas, pociones y materiales.';
export function canPocket(itemId: string): boolean {
  return POCKETABLE.includes(getItem(itemId).category);
}

export interface EquipContext {
  classId: ClassId;
  level: number;
}

export function canEquip(itemId: string, slot: EquipSlot, ctx: EquipContext): string | null {
  const def = getItem(itemId);
  if (def.slot !== slot) return 'Este objeto no va en esa ranura.';
  if (def.classes && !def.classes.includes(ctx.classId)) return 'Tu clase no puede usar este objeto.';
  if (def.levelReq && ctx.level < def.levelReq) return `Necesitas nivel ${def.levelReq}.`;
  return null;
}

function getAt(c: Containers, loc: Loc): ItemStack | null {
  return loc.kind === 'equip' ? c.equipment[loc.slot] : c[loc.container][loc.index] ?? null;
}

function setAt(c: Containers, loc: Loc, s: ItemStack | null) {
  if (loc.kind === 'equip') c.equipment[loc.slot] = s;
  else c[loc.container][loc.index] = s;
}

function cloneContainers(c: Containers): Containers {
  return { backpack: cloneGrid(c.backpack), stash: cloneGrid(c.stash), loot: cloneGrid(c.loot), pocket: cloneGrid(c.pocket), equipment: { ...c.equipment } };
}

export type TransferResult = { ok: true; containers: Containers } | { ok: false; error: string };

/**
 * Mueve un objeto de una ubicación a otra. Si el destino tiene el mismo objeto apilable, fusiona;
 * si tiene otro objeto, intercambia (validando que el intercambio sea legal en ambas direcciones).
 */
export function transfer(c: Containers, from: Loc, to: Loc, ctx: EquipContext): TransferResult {
  if (JSON.stringify(from) === JSON.stringify(to)) return { ok: true, containers: c };
  const src = getAt(c, from);
  if (!src) return { ok: false, error: 'No hay nada que mover.' };
  const dst = getAt(c, to);

  if (to.kind === 'grid' && to.container === 'pocket' && !canPocket(src.itemId)) return { ok: false, error: POCKET_ERROR };
  if (from.kind === 'grid' && from.container === 'pocket' && dst && !canPocket(dst.itemId)) return { ok: false, error: POCKET_ERROR };
  if (to.kind === 'equip') {
    const err = canEquip(src.itemId, to.slot, ctx);
    if (err) return { ok: false, error: err };
  }
  if (from.kind === 'equip' && dst) {
    const err = canEquip(dst.itemId, from.slot, ctx);
    if (err) return { ok: false, error: 'No se puede intercambiar: ' + err.toLowerCase() };
  }

  const n = cloneContainers(c);
  if (dst && dst.itemId === src.itemId && maxStack(src.itemId) > 1 && to.kind === 'grid') {
    const max = maxStack(src.itemId);
    const move = Math.min(max - dst.qty, src.qty);
    if (move <= 0) {
      setAt(n, to, { ...src });
      setAt(n, from, { ...dst });
    } else {
      setAt(n, to, { ...dst, qty: dst.qty + move });
      setAt(n, from, src.qty - move > 0 ? { ...src, qty: src.qty - move } : null);
    }
    return { ok: true, containers: n };
  }
  setAt(n, to, { ...src });
  setAt(n, from, dst ? { ...dst } : null);
  if (to.kind === 'equip' && (to.slot === 'mainHand' || to.slot === 'offHand')) return fixHands(n, to.slot);
  return { ok: true, containers: n };
}

/** Un arma a dos manos no deja llevar nada en la izquierda: lo que sobre va a la mochila (o al almacén si no cabe). */
function fixHands(n: Containers, placed: 'mainHand' | 'offHand'): TransferResult {
  const main = n.equipment.mainHand;
  if (!main || !n.equipment.offHand || !isTwoHanded(getItem(main.itemId))) return { ok: true, containers: n };
  const freeSlot = placed === 'mainHand' ? 'offHand' : 'mainHand';
  const out = n.equipment[freeSlot]!;
  for (const g of ['backpack', 'stash'] as const) {
    const r = addToGrid(n[g], out);
    if (!r.leftover) {
      n[g] = r.grid;
      n.equipment[freeSlot] = null;
      return { ok: true, containers: n };
    }
  }
  return { ok: false, error: 'Es un arma a dos manos: haz sitio en la mochila para lo que llevas en la otra mano.' };
}

/** Equipa desde una casilla del inventario a su ranura natural. */
export function quickEquip(c: Containers, from: Loc, ctx: EquipContext): TransferResult {
  const src = getAt(c, from);
  if (!src) return { ok: false, error: 'No hay nada que equipar.' };
  const def = getItem(src.itemId);
  if (!def.slot) return { ok: false, error: 'Este objeto no se puede equipar.' };
  return transfer(c, from, { kind: 'equip', slot: def.slot }, ctx);
}

/** Mueve a la primera casilla libre (o pila compatible) de otro contenedor. */
export function quickMove(c: Containers, from: Loc, target: ContainerId): TransferResult {
  const src = getAt(c, from);
  if (!src) return { ok: false, error: 'No hay nada que mover.' };
  if (target === 'pocket' && !canPocket(src.itemId)) return { ok: false, error: POCKET_ERROR };
  const r = addToGrid(c[target], src);
  if (r.leftover && r.leftover.qty === src.qty) return { ok: false, error: 'No hay espacio.' };
  const n = cloneContainers(c);
  n[target] = r.grid;
  setAt(n, from, r.leftover);
  return { ok: true, containers: n };
}

export function stackAt(c: Containers, loc: Loc): ItemStack | null {
  return getAt(c, loc);
}

export function clearAt(c: Containers, loc: Loc): Containers {
  const n = cloneContainers(c);
  setAt(n, loc, null);
  return n;
}

export function equippedValue(eq: Equipment): number {
  return Object.values(eq).reduce((n, s) => n + (s ? getItem(s.itemId).value * s.qty : 0), 0);
}
