// ════════════════════════════════════════════════════════════════════
// Apariencia del equipo: cómo se ve cada objeto equipado sobre el personaje.
// Es solo datos (sin DOM). Añadir un objeto visible = añadir una entrada aquí.
// ════════════════════════════════════════════════════════════════════
import type { ClassId, EquipSlot, Equipment } from '../core/types';
import { EQUIP_SLOTS } from '../core/types';
import { CLASSES } from '../core/data/classes';
import { getItem } from '../core/data/items';
import { PAL } from './palette';

export type GearLook =
  | { slot: 'mainHand'; shape: 'sword' | 'axe' | 'staff' | 'dagger' | 'mace'; color: string; orb?: string }
  | { slot: 'offHand'; shape: 'shield'; color: string; rim: string; emblem: string }
  | { slot: 'offHand'; shape: 'tome'; color: string }
  | { slot: 'helmet'; shape: 'hood' | 'helmet' | 'wizard'; color: string; trim?: string }
  | { slot: 'armor'; style: 'tunic' | 'mail' | 'robe'; color: string; trim: string }
  | { slot: 'gloves'; color: string }
  | { slot: 'boots'; color: string }
  | { slot: 'amulet'; color: string }
  | { slot: 'ring' };

export const GEAR_LOOKS: Record<string, GearLook> = {
  // Armas
  rusty_sword: { slot: 'mainHand', shape: 'sword', color: '#9a8a78' },
  iron_sword: { slot: 'mainHand', shape: 'sword', color: PAL.steel2 },
  executioner_axe: { slot: 'mainHand', shape: 'axe', color: PAL.steel3 },
  apprentice_staff: { slot: 'mainHand', shape: 'staff', color: PAL.earth2, orb: PAL.ice },
  ember_staff: { slot: 'mainHand', shape: 'staff', color: PAL.earth1, orb: PAL.fire1 },
  runic_staff: { slot: 'mainHand', shape: 'staff', color: PAL.magic0, orb: PAL.magic2 },
  bone_dagger: { slot: 'mainHand', shape: 'dagger', color: PAL.bone2 },
  knight_sword: { slot: 'mainHand', shape: 'sword', color: PAL.steel3 },
  dread_blade: { slot: 'mainHand', shape: 'sword', color: PAL.threat2 },
  battle_axe: { slot: 'mainHand', shape: 'axe', color: PAL.steel2 },
  bonereaver: { slot: 'mainHand', shape: 'axe', color: PAL.bone2 },
  frost_staff: { slot: 'mainHand', shape: 'staff', color: '#5a7fa8', orb: '#ffffff' },
  blessed_mace: { slot: 'mainHand', shape: 'mace', color: PAL.gold2 },
  iron_shield: { slot: 'offHand', shape: 'shield', color: PAL.steel2, rim: PAL.steel1, emblem: PAL.steel0 },
  eclipse_grimoire: { slot: 'offHand', shape: 'tome', color: PAL.magic0 },
  knight_helm: { slot: 'helmet', shape: 'helmet', color: PAL.steel3 },
  bastion_plate: { slot: 'armor', style: 'mail', color: PAL.steel2, trim: PAL.gold2 },
  archmage_robe: { slot: 'armor', style: 'robe', color: PAL.night1, trim: PAL.gold2 },
  // Secundarias
  wooden_shield: { slot: 'offHand', shape: 'shield', color: PAL.earth2, rim: PAL.steel1, emblem: PAL.earth3 },
  bastion_shield: { slot: 'offHand', shape: 'shield', color: PAL.steel1, rim: PAL.steel2, emblem: PAL.gold2 },
  arcane_tome: { slot: 'offHand', shape: 'tome', color: PAL.magic1 },
  // Cabeza
  leather_hood: { slot: 'helmet', shape: 'hood', color: PAL.earth2 },
  iron_helm: { slot: 'helmet', shape: 'helmet', color: PAL.steel2 },
  wizard_hat: { slot: 'helmet', shape: 'wizard', color: PAL.night2, trim: PAL.gold2 },
  // Torso
  padded_tunic: { slot: 'armor', style: 'tunic', color: PAL.earth3, trim: PAL.earth1 },
  chainmail: { slot: 'armor', style: 'mail', color: PAL.steel1, trim: PAL.steel2 },
  linen_robe: { slot: 'armor', style: 'robe', color: PAL.bone1, trim: PAL.night2 },
  shadow_robe: { slot: 'armor', style: 'robe', color: PAL.magic1, trim: PAL.magic3 },
  // Manos y pies
  leather_gloves: { slot: 'gloves', color: PAL.earth3 },
  gauntlets: { slot: 'gloves', color: PAL.steel2 },
  worn_boots: { slot: 'boots', color: PAL.earth1 },
  swift_boots: { slot: 'boots', color: PAL.night2 },
  // Joyería
  copper_ring: { slot: 'ring' },
  ring_of_embers: { slot: 'ring' },
  bone_amulet: { slot: 'amulet', color: PAL.bone2 },
  heart_of_umbravel: { slot: 'amulet', color: PAL.threat2 },
};

export function lookOf(itemId: string): GearLook | null {
  return GEAR_LOOKS[itemId] ?? null;
}

/** Equipo inicial de la clase como «equipo» (para la creación de personaje y la web). */
export function starterEquipment(classId: ClassId): Equipment {
  const eq = Object.fromEntries(EQUIP_SLOTS.map((s) => [s, null])) as Equipment;
  for (const k of CLASSES[classId].starterKit) {
    const slot = getItem(k.itemId).slot;
    if (slot && !eq[slot]) eq[slot] = { uid: `starter-${k.itemId}`, itemId: k.itemId, qty: 1 };
  }
  return eq;
}

/** Firma corta del aspecto: cambia solo cuando cambia algo visible. Sirve como clave de caché. */
export function lookSignature(equipment: Equipment): string {
  return EQUIP_SLOTS.map((s: EquipSlot) => {
    const it = equipment[s];
    return it && GEAR_LOOKS[it.itemId] && GEAR_LOOKS[it.itemId].slot !== 'ring' ? it.itemId : '-';
  }).join('|');
}

function gear(items: Partial<Record<EquipSlot, string>>): Equipment {
  const eq = Object.fromEntries(EQUIP_SLOTS.map((s) => [s, null])) as Equipment;
  for (const [slot, id] of Object.entries(items)) eq[slot as EquipSlot] = { uid: `show-${id}`, itemId: id!, qty: 1 };
  return eq;
}

/** Equipo representativo de cada clase para la web (no el de recluta). */
export const SHOWCASE_GEAR: Record<ClassId, Equipment> = {
  warrior: gear({ mainHand: 'iron_sword', offHand: 'wooden_shield', helmet: 'iron_helm', armor: 'chainmail', gloves: 'gauntlets', boots: 'worn_boots' }),
  mage: gear({ mainHand: 'ember_staff', offHand: 'arcane_tome', helmet: 'wizard_hat', armor: 'linen_robe', boots: 'worn_boots' }),
  rogue: gear({ mainHand: 'bone_dagger', helmet: 'leather_hood', armor: 'padded_tunic', gloves: 'leather_gloves', boots: 'swift_boots' }),
  cleric: gear({ mainHand: 'blessed_mace', offHand: 'bastion_shield', armor: 'linen_robe', gloves: 'leather_gloves', boots: 'worn_boots', amulet: 'bone_amulet' }),
};
