// ════════════════════════════════════════════════════════════════════
// Familias de armas y de objetos de mano izquierda.
// Cada familia define su ataque básico (sin coste ni recarga) y su mano. Los especiales de cada arma
// están en su ficha (`specials`, o los primeros de `grants`). Añadir un arma = añadir datos y su sprite.
// ════════════════════════════════════════════════════════════════════
import type { AttackDef, ItemDef, WeaponFamily } from '../types';

export interface FamilyDef {
  name: string;
  /** Mano en la que se lleva. Las de dos manos ocupan las dos. */
  hand: 'right' | 'left';
  hands: 1 | 2;
  /** Ataque básico (solo familias de la mano derecha). */
  basic?: AttackDef;
}

export const FAMILIES: Record<WeaponFamily, FamilyDef> = {
  sword: { name: 'Espada', hand: 'right', hands: 1, basic: { name: 'Tajo', kind: 'physical', power: 1, fx: 'slash' } },
  axe: { name: 'Hacha', hand: 'right', hands: 1, basic: { name: 'Hachazo', kind: 'physical', power: 1.15, fx: 'smash' } },
  mace: { name: 'Maza', hand: 'right', hands: 1, basic: { name: 'Mazazo', kind: 'physical', power: 1, fx: 'smash' } },
  spear: { name: 'Lanza', hand: 'right', hands: 1, basic: { name: 'Pinchazo', kind: 'physical', power: 0.95, fx: 'slash' } },
  dagger: { name: 'Daga', hand: 'left', hands: 1, basic: { name: 'Cuchillada', kind: 'physical', power: 1, fx: 'slash' } },
  greatsword: { name: 'Mandoble', hand: 'right', hands: 2, basic: { name: 'Tajo pesado', kind: 'physical', power: 1.25, fx: 'slash' } },
  greataxe: { name: 'Gran hacha', hand: 'right', hands: 2, basic: { name: 'Tajo pesado', kind: 'physical', power: 1.25, fx: 'smash' } },
  staff: { name: 'Bastón', hand: 'right', hands: 1, basic: { name: 'Proyectil arcano', kind: 'magical', power: 0.8, fx: 'dark' } },
  wand: { name: 'Varita', hand: 'right', hands: 1, basic: { name: 'Chispazo', kind: 'magical', power: 0.7, fx: 'fire' } },
  scepter: { name: 'Cetro', hand: 'right', hands: 1, basic: { name: 'Proyectil arcano', kind: 'magical', power: 0.85, fx: 'dark' } },
  greatstaff: { name: 'Báculo mayor', hand: 'right', hands: 2, basic: { name: 'Rayo', kind: 'magical', power: 1, fx: 'dark' } },
  shield: { name: 'Escudo', hand: 'left', hands: 1 },
  tome: { name: 'Tomo', hand: 'left', hands: 1 },
  orb: { name: 'Orbe', hand: 'left', hands: 1 },
  torch: { name: 'Antorcha', hand: 'left', hands: 1 },
};

/** Sin nada en la mano derecha: puñetazo y dos golpes sin arma. */
export const FISTS: AttackDef = { name: 'Puñetazo', kind: 'physical', power: 0.6, fx: 'smash' };
export const EMPTY_RIGHT_SPECIALS = ['low_blow', 'wild_swing'];
/** Sin nada en la mano izquierda: dos acciones básicas sin arma. */
export const EMPTY_LEFT_SPECIALS = ['brace', 'shove'];

/** El arma ocupa las dos manos. */
export function isTwoHanded(def: ItemDef): boolean {
  return (def.hands ?? (def.family ? FAMILIES[def.family].hands : 1)) === 2;
}

/** Ataques especiales que da un objeto: 2 (o 4 a dos manos). */
export function itemSpecials(def: ItemDef): string[] {
  const n = isTwoHanded(def) ? 4 : 2;
  if (def.specials) return def.specials.slice(0, n);
  const g = def.grants ?? [];
  // Armas antiguas con más habilidades de las que caben: la primera (la de su familia) y la última (la propia del arma)
  return g.length > n ? [...g.slice(0, n - 1), g[g.length - 1]] : g;
}

/** Ataque básico de un arma de la mano derecha (el suyo propio o el de su familia). */
export function basicAttackOf(def: ItemDef | null): AttackDef {
  if (!def) return FISTS;
  return def.attack ?? (def.family ? FAMILIES[def.family].basic : undefined) ?? FISTS;
}
