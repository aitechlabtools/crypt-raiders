// Almacén por páginas. Las páginas propias de un personaje van seguidas en `profile.stash`
// (página k = casillas k·120 … k·120+119): así contar, gastar o entregar objetos sigue mirando todo el almacén.
// La página «Compartido» es de la cuenta y va aparte (`profile.shared`), como su propio contenedor.
import type { Grid, ItemStack, Profile } from './types';
import { addToGrid, emptyGrid, LAYOUTS, sortGrid } from './inventory';
import { spendGold } from './wallet';
import { LEGACY_STASH_ROW, LEGACY_STASH_SIZE, LEGACY_STASH_UPGRADE_COSTS, SHARED_PAGE_COST, STASH_MAX_PAGES, STASH_PAGE_COSTS, STASH_PAGE_SIZE } from '../config/stash';

export type StashPage = number | 'shared';

export const pageCount = (stash: Grid) => Math.max(1, Math.ceil(stash.length / STASH_PAGE_SIZE));
export const pageStart = (page: number) => page * STASH_PAGE_SIZE;
export function pageSlice(stash: Grid, page: number): Grid { return stash.slice(pageStart(page), pageStart(page) + STASH_PAGE_SIZE); }
export function splitPages(stash: Grid): Grid[] {
  return Array.from({ length: pageCount(stash) }, (_, k) => padPage(pageSlice(stash, k)));
}
export function joinPages(pages: Grid[]): Grid { return (pages.length ? pages : [[]]).flatMap(padPage); }
function padPage(g: Grid): Grid { return g.length >= STASH_PAGE_SIZE ? g.slice(0, STASH_PAGE_SIZE) : [...g, ...emptyGrid(STASH_PAGE_SIZE - g.length)]; }

/** Precio de la siguiente página propia, o null si ya tiene todas. */
export function nextPageCost(stash: Grid): number | null {
  const n = pageCount(stash);
  return n >= STASH_MAX_PAGES ? null : STASH_PAGE_COSTS[n - 1];
}

export type PageResult = { ok: true; profile: Profile } | { ok: false; error: string };

export function buyStashPage(p: Profile): PageResult {
  const cost = nextPageCost(p.stash);
  if (cost === null) return { ok: false, error: 'Ya tienes todas las páginas del almacén.' };
  const paid = spendGold(p, cost);
  if (!paid.ok) return paid;
  return { ok: true, profile: { ...paid.profile, stash: [...paid.profile.stash, ...emptyGrid(STASH_PAGE_SIZE)] } };
}

export function buySharedPage(p: Profile): PageResult {
  if (p.shared) return { ok: false, error: 'Ya tienes la página «Compartido».' };
  const paid = spendGold(p, SHARED_PAGE_COST);
  if (!paid.ok) return paid;
  return { ok: true, profile: { ...paid.profile, shared: emptyGrid(STASH_PAGE_SIZE) } };
}

/** Mete un objeto en una página concreta del almacén (apilando primero). Devuelve el almacén y lo que no cupo. */
export function addToPage(stash: Grid, page: number, s: ItemStack): { stash: Grid; leftover: ItemStack | null } {
  const r = addToGrid(pageSlice(stash, page), s, LAYOUTS.stash);
  const out = [...stash];
  r.grid.forEach((x, i) => (out[pageStart(page) + i] = x));
  return { stash: out, leftover: r.leftover };
}

/** «Ordenar» solo ordena la página que se está viendo. */
export function sortPage(stash: Grid, page: number): Grid {
  const sorted = sortGrid(pageSlice(stash, page), LAYOUTS.stash);
  const out = [...stash];
  sorted.forEach((x, i) => (out[pageStart(page) + i] = x));
  return out;
}

/**
 * Almacén antiguo (40 casillas + filas de «Ampliar (+8)») → página 1 de 120. Todo cabe (el máximo era 72)
 * y se devuelve el oro pagado por las ampliaciones. Si ya está en páginas, no cambia nada.
 */
export function migrateLegacyStash(stash: Grid): { stash: Grid; refund: number } {
  if (stash.length && stash.length % STASH_PAGE_SIZE === 0) return { stash, refund: 0 };
  const upgrades = Math.max(0, Math.min(LEGACY_STASH_UPGRADE_COSTS.length, Math.round((stash.length - LEGACY_STASH_SIZE) / LEGACY_STASH_ROW)));
  const refund = LEGACY_STASH_UPGRADE_COSTS.slice(0, upgrades).reduce((a, b) => a + b, 0);
  const items = stash.filter((x): x is ItemStack => !!x);
  const pages = Math.max(1, Math.ceil(items.length / STASH_PAGE_SIZE));
  const out = emptyGrid(pages * STASH_PAGE_SIZE);
  // Se respeta la posición de cada objeto (el almacén antiguo cabe entero en la primera página)
  if (stash.length <= STASH_PAGE_SIZE) stash.forEach((x, i) => (out[i] = x));
  else items.forEach((x, i) => (out[i] = x));
  return { stash: out, refund };
}
