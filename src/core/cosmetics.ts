// Lógica de cosméticos: desbloquear, ponérselos y calcular el aspecto. Las estadísticas nunca cambian.
import { COSMETICS, ELITE_COSMETICS, type CosmeticDef, type CosmeticSlot } from './data/cosmetics';
import { getItem } from './data/items';
import type { Rng } from './rng';
import type { Equipment, Profile } from './types';

/** Probabilidad de que un relicario de jefe suelte un aspecto (el primero de cada zona es seguro). */
export const RELIQUARY_CHANCE = 0.35;
/** Probabilidad de que un élite suelte su aspecto. */
export const ELITE_COSMETIC_CHANCE = 0.1;

export function getCosmetic(id: string): CosmeticDef {
  const d = COSMETICS[id];
  if (!d) throw new Error(`Aspecto desconocido: ${id}`);
  return d;
}

export function owns(p: Profile, id: string): boolean {
  return p.cosmetics.includes(id);
}

export function unlock(p: Profile, id: string): { profile: Profile; isNew: boolean } {
  if (!COSMETICS[id] || COSMETICS[id].source === 'shop' || owns(p, id)) return { profile: p, isNew: false };
  return { profile: { ...p, cosmetics: [...p.cosmetics, id] }, isNew: true };
}

/** ¿Se puede aplicar este aspecto sobre lo que llevas en esa ranura? */
export function fits(cos: CosmeticDef, eq: Equipment): boolean {
  const it = eq[cos.slot];
  if (!it) return false;
  if (!cos.family) return true;
  return getItem(it.itemId).family === cos.family;
}

/** El equipo «vestido»: cada ranura con aspecto elegido (y compatible) se dibuja con ese aspecto. */
export function dressed(eq: Equipment, wardrobe: Partial<Record<CosmeticSlot, string>> | undefined): Equipment {
  if (!wardrobe) return eq;
  let out: Equipment | null = null;
  for (const [slot, id] of Object.entries(wardrobe) as [CosmeticSlot, string][]) {
    const cos = id ? COSMETICS[id] : null;
    if (!cos || cos.slot !== slot || !fits(cos, eq)) continue;
    out = out ?? { ...eq };
    out[slot] = { ...eq[slot]!, itemId: cos.id };
  }
  return out ?? eq;
}

export function wear(p: Profile, slot: CosmeticSlot, id: string | null): Profile {
  if (id && (!owns(p, id) || COSMETICS[id]?.slot !== slot)) return p;
  const wardrobe = { ...p.wardrobe };
  if (id) wardrobe[slot] = id; else delete wardrobe[slot];
  return { ...p, wardrobe };
}

/** Relicario de jefe: el primero de cada zona siempre da un aspecto; después, a veces. */
export function rollReliquary(p: Profile, zone: string, rng: Rng): string | null {
  const pool = Object.values(COSMETICS).filter((c) => c.source === 'reliquary' && c.zone === zone);
  const missing = pool.filter((c) => !owns(p, c.id));
  if (!missing.length) return null;
  const first = missing.length === pool.length;
  if (!first && !rng.chance(RELIQUARY_CHANCE)) return null;
  return rng.pick(missing).id;
}

export function rollEliteDrop(p: Profile, enemyId: string, rng: Rng): string | null {
  const id = ELITE_COSMETICS[enemyId];
  if (!id || owns(p, id)) return null;
  return rng.chance(ELITE_COSMETIC_CHANCE) ? id : null;
}

export function legendCosmetic(vendor: string): string | null {
  return Object.values(COSMETICS).find((c) => c.source === 'legend' && c.vendor === vendor)?.id ?? null;
}
