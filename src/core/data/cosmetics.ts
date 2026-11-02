// ════════════════════════════════════════════════════════════════════
// Cosméticos: cambian el aspecto de una pieza equipada, NUNCA sus estadísticas.
// Se consiguen jugando (misiones, rango Leyenda, relicarios de jefe, élites).
// Los de la tienda son solo una maqueta: «Próximamente», sin pagos.
// ════════════════════════════════════════════════════════════════════
import type { GearLook } from '../../shared/gearLook';
import type { EquipSlot, Rarity } from '../types';
import type { VendorId } from './vendors';

export type CosmeticSource = 'quest' | 'legend' | 'reliquary' | 'drop' | 'shop';
export type CosmeticSlot = Extract<EquipSlot, 'mainHand' | 'offHand' | 'helmet' | 'armor' | 'gloves' | 'boots'>;

export interface CosmeticDef {
  id: string;
  name: string;
  slot: CosmeticSlot;
  /** Para armas y secundarias: solo se aplica sobre esa familia (una espada no puede parecer un báculo). */
  family?: 'sword' | 'axe' | 'dagger' | 'staff' | 'mace' | 'shield' | 'tome';
  look: GearLook;
  rarity: Rarity;
  source: CosmeticSource;
  /** Texto de dónde sale. */
  how: string;
  zone?: 'mazmorra' | 'cripta' | 'infierno';
  vendor?: VendorId;
}

const c = (d: CosmeticDef) => d;

export const COSMETICS: Record<string, CosmeticDef> = Object.fromEntries([
  // ── Misiones ──
  c({ id: 'cos_ossuary_helm', name: 'Yelmo del Osario', slot: 'helmet', look: { slot: 'helmet', shape: 'helmet', color: '#d9d3c1', trim: '#c4283b' }, rarity: 'rare', source: 'quest', how: 'Misión «El trono vacío» (Hermana Vesper)' }),
  c({ id: 'cos_veil_hood', name: 'Velo de la Reina', slot: 'helmet', look: { slot: 'helmet', shape: 'hood', color: '#e8ecf2' }, rarity: 'epic', source: 'quest', how: 'Misión «Levantar el velo» (Hermana Vesper)' }),
  c({ id: 'cos_chainbreaker_plate', name: 'Coraza del Rompecadenas', slot: 'armor', look: { slot: 'armor', style: 'mail', color: '#2a2228', trim: '#ff8a3a' }, rarity: 'legendary', source: 'quest', how: 'Misión «Romper las cadenas» (Hermana Vesper)' }),
  // ── Rango Leyenda ──
  c({ id: 'cos_gilded_boots', name: 'Botas doradas de Orvel', slot: 'boots', look: { slot: 'boots', color: '#e8b33a' }, rarity: 'epic', source: 'legend', vendor: 'orvel', how: 'Rango «Leyenda» con Orvel' }),
  c({ id: 'cos_relic_robe', name: 'Hábito del Relicario', slot: 'armor', look: { slot: 'armor', style: 'robe', color: '#f2ead8', trim: '#e8b33a' }, rarity: 'epic', source: 'legend', vendor: 'vesper', how: 'Rango «Leyenda» con Hermana Vesper' }),
  c({ id: 'cos_redclaw_mail', name: 'Malla de la Garra Roja', slot: 'armor', look: { slot: 'armor', style: 'mail', color: '#8a1c24', trim: '#ff6a5a' }, rarity: 'epic', source: 'legend', vendor: 'garra', how: 'Rango «Leyenda» con Garra Roja' }),
  c({ id: 'cos_forgemaster_gloves', name: 'Guantes del maestro forjador', slot: 'gloves', look: { slot: 'gloves', color: '#ff8a3a' }, rarity: 'epic', source: 'legend', vendor: 'brand', how: 'Rango «Leyenda» con Maese Brand' }),
  // ── Relicarios de jefe ──
  c({ id: 'cos_umbral_blade', name: 'Hoja umbría', slot: 'mainHand', family: 'sword', look: { slot: 'mainHand', shape: 'sword', color: '#7a5ae0' }, rarity: 'rare', source: 'reliquary', zone: 'mazmorra', how: 'Relicario del Señor del Osario' }),
  c({ id: 'cos_umbral_staff', name: 'Báculo umbrío', slot: 'mainHand', family: 'staff', look: { slot: 'mainHand', shape: 'staff', color: '#2a1d2c', orb: '#c86aff' }, rarity: 'rare', source: 'reliquary', zone: 'mazmorra', how: 'Relicario del Señor del Osario' }),
  c({ id: 'cos_umbral_axe', name: 'Hacha umbría', slot: 'mainHand', family: 'axe', look: { slot: 'mainHand', shape: 'axe', color: '#7a5ae0' }, rarity: 'rare', source: 'reliquary', zone: 'mazmorra', how: 'Relicario del Señor del Osario' }),
  c({ id: 'cos_spectral_shield', name: 'Escudo espectral', slot: 'offHand', family: 'shield', look: { slot: 'offHand', shape: 'shield', color: '#8fb8e8', rim: '#e8ecf2', emblem: '#ffffff' }, rarity: 'epic', source: 'reliquary', zone: 'cripta', how: 'Relicario de la Reina Velada' }),
  c({ id: 'cos_spectral_tome', name: 'Grimorio espectral', slot: 'offHand', family: 'tome', look: { slot: 'offHand', shape: 'tome', color: '#5c6b80' }, rarity: 'epic', source: 'reliquary', zone: 'cripta', how: 'Relicario de la Reina Velada' }),
  c({ id: 'cos_spectral_blade', name: 'Espada espectral', slot: 'mainHand', family: 'sword', look: { slot: 'mainHand', shape: 'sword', color: '#bfe0ff' }, rarity: 'epic', source: 'reliquary', zone: 'cripta', how: 'Relicario de la Reina Velada' }),
  c({ id: 'cos_hellfire_axe', name: 'Hacha del fuego eterno', slot: 'mainHand', family: 'axe', look: { slot: 'mainHand', shape: 'axe', color: '#ff6a2a' }, rarity: 'legendary', source: 'reliquary', zone: 'infierno', how: 'Relicario de Belzar' }),
  c({ id: 'cos_hellfire_staff', name: 'Báculo del fuego eterno', slot: 'mainHand', family: 'staff', look: { slot: 'mainHand', shape: 'staff', color: '#1a0a0a', orb: '#ffd36a' }, rarity: 'legendary', source: 'reliquary', zone: 'infierno', how: 'Relicario de Belzar' }),
  c({ id: 'cos_hellfire_helm', name: 'Yelmo de ceniza ardiente', slot: 'helmet', look: { slot: 'helmet', shape: 'helmet', color: '#2a1010', trim: '#ff6a2a' }, rarity: 'legendary', source: 'reliquary', zone: 'infierno', how: 'Relicario de Belzar' }),
  // ── Botín raro de élites ──
  c({ id: 'cos_captain_hood', name: 'Capucha del capitán', slot: 'helmet', look: { slot: 'helmet', shape: 'hood', color: '#8a1c24' }, rarity: 'uncommon', source: 'drop', zone: 'mazmorra', how: 'Botín raro del Capitán bandido' }),
  c({ id: 'cos_tomb_boots', name: 'Grebas del sepulcro', slot: 'boots', look: { slot: 'boots', color: '#8fb8e8' }, rarity: 'rare', source: 'drop', zone: 'cripta', how: 'Botín raro del Caballero del sepulcro' }),
  c({ id: 'cos_warden_gloves', name: 'Puños del carcelero', slot: 'gloves', look: { slot: 'gloves', color: '#4a3a3a' }, rarity: 'rare', source: 'drop', zone: 'infierno', how: 'Botín raro del Carcelero de cadenas' }),
  // ── Tienda (maqueta, no se puede comprar) ──
  c({ id: 'shop_dragon_plate', name: 'Armadura de escamas de dragón', slot: 'armor', look: { slot: 'armor', style: 'mail', color: '#2f6b3a', trim: '#e8b33a' }, rarity: 'legendary', source: 'shop', how: 'Tienda' }),
  c({ id: 'shop_royal_helm', name: 'Corona del rey caído', slot: 'helmet', look: { slot: 'helmet', shape: 'helmet', color: '#e8b33a', trim: '#c4283b' }, rarity: 'legendary', source: 'shop', how: 'Tienda' }),
  c({ id: 'shop_void_staff', name: 'Báculo del vacío', slot: 'mainHand', family: 'staff', look: { slot: 'mainHand', shape: 'staff', color: '#0c0b10', orb: '#5fe0d0' }, rarity: 'legendary', source: 'shop', how: 'Tienda' }),
  c({ id: 'shop_sun_shield', name: 'Escudo del sol naciente', slot: 'offHand', family: 'shield', look: { slot: 'offHand', shape: 'shield', color: '#ffd36a', rim: '#e8913a', emblem: '#ffffff' }, rarity: 'epic', source: 'shop', how: 'Tienda' }),
  c({ id: 'shop_frost_blade', name: 'Filo de escarcha eterna', slot: 'mainHand', family: 'sword', look: { slot: 'mainHand', shape: 'sword', color: '#bfefff' }, rarity: 'epic', source: 'shop', how: 'Tienda' }),
  c({ id: 'shop_shadow_robe', name: 'Túnica de las sombras', slot: 'armor', look: { slot: 'armor', style: 'robe', color: '#1a1424', trim: '#a35ae0' }, rarity: 'epic', source: 'shop', how: 'Tienda' }),
].map((d) => [d.id, d]));

export const COSMETIC_ORDER = Object.keys(COSMETICS);

/** Recompensas de misión en aspecto. */
export const QUEST_COSMETICS: Record<string, string> = {
  q_lord: 'cos_ossuary_helm',
  q_vesper_queen: 'cos_veil_hood',
  q_vesper_belzar: 'cos_chainbreaker_plate',
};

/** Élite → aspecto raro que puede soltar. */
export const ELITE_COSMETICS: Record<string, string> = {
  bandit_captain: 'cos_captain_hood',
  tomb_knight: 'cos_tomb_boots',
  chain_warden: 'cos_warden_gloves',
};
