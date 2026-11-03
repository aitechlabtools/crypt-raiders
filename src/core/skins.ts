// Lógica de los atuendos: tenerlos, comprarlos con oro y ponérselos. Nunca tocan las estadísticas.
import { SKINS } from './data/skins';
import type { Profile } from './types';

export function ownsSkin(p: Profile, id: string): boolean {
  return p.skins.owned.includes(id);
}

/** ¿Por qué no se puede comprar? null si se puede. */
export function buyBlock(p: Profile, id: string): string | null {
  const s = SKINS[id];
  if (!s) return 'Ese atuendo no existe.';
  if (ownsSkin(p, id)) return 'Ya es tuyo.';
  if (s.price.currency !== 'gold') return 'Este atuendo aún no está a la venta.';
  if (p.gold < s.price.amount) return `Te faltan ${s.price.amount - p.gold} de oro.`;
  return null;
}

export function buySkin(p: Profile, id: string): { ok: true; profile: Profile } | { ok: false; error: string } {
  const block = buyBlock(p, id);
  if (block) return { ok: false, error: block };
  const s = SKINS[id];
  return { ok: true, profile: { ...p, gold: p.gold - s.price.amount, skins: { ...p.skins, owned: [...p.skins.owned, id] } } };
}

/** Ponerse un atuendo (o quitárselo con null). Solo los que tienes. */
export function equipSkin(p: Profile, id: string | null): Profile {
  if (id && !ownsSkin(p, id)) return p;
  return { ...p, skins: { ...p.skins, equipped: id } };
}

/** Atuendo que se ve ahora (null si no lleva o si ya no existe). */
export function wornSkin(p: Profile | null | undefined): string | null {
  const id = p?.skins?.equipped ?? null;
  return id && SKINS[id] && p!.skins.owned.includes(id) ? id : null;
}
