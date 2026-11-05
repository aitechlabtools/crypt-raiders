// Mochilas: la puesta decide cuántas casillas tiene la mochila (6 columnas). Se cambian en el refugio.
import type { Grid, ItemStack, Profile } from './types';
import { LAYOUTS, anchorIndex, cloneGrid, isCover, removeAt } from './inventory';
import { BAG_SIZES } from '../config/gold';

export const bagSize = (itemId: string | undefined): number => (itemId ? BAG_SIZES[itemId] ?? 24 : 24);
export const isBag = (s: ItemStack | null | undefined): boolean => !!s && !!BAG_SIZES[s.itemId];

export type BagResult = { ok: true; profile: Profile } | { ok: false; error: string };

/**
 * Se pone la mochila de la casilla `index` de `container` (mochila o almacén) y la que llevabas ocupa su sitio.
 * Para cambiar a una más pequeña, las casillas que sobran tienen que estar vacías.
 */
export function equipBag(p: Profile, container: 'backpack' | 'stash' | 'shared', index: number): BagResult {
  const src0 = container === 'shared' ? p.shared : p[container];
  if (!src0) return { ok: false, error: 'No hay nada ahí.' };
  const src = cloneGrid(src0);
  const i = anchorIndex(src, index);
  const s = i >= 0 ? src[i] : null;
  if (!isBag(s) || isCover(s)) return { ok: false, error: 'Eso no es una mochila.' };
  const old = p.bag;
  // La mochila nueva sale de su casilla y la vieja va a ese mismo sitio
  removeAt(src, i);
  src[i] = { ...old };
  let backpack: Grid = container === 'backpack' ? src : cloneGrid(p.backpack);
  const size = bagSize(s!.itemId);
  if (backpack.length > size) {
    if (backpack.slice(size).some(Boolean)) return { ok: false, error: `Esa mochila es más pequeña: vacía las últimas ${backpack.length - size} casillas de la tuya antes de cambiarla.` };
    backpack = backpack.slice(0, size);
  } else if (backpack.length < size) backpack = [...backpack, ...Array(size - backpack.length).fill(null)];
  void LAYOUTS;
  const out: Profile = { ...p, bag: { ...s! }, backpack };
  if (container === 'stash') out.stash = src;
  if (container === 'shared') out.shared = src;
  return { ok: true, profile: out };
}
