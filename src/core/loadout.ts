// ════════════════════════════════════════════════════════════════════
// Habilidades de combate según quién eres y qué llevas:
//  · La clase da 1 habilidad exclusiva, siempre disponible.
//  · El arma da el ataque básico y sus habilidades (sin arma: puños).
//  · La secundaria (escudo, tomo) da las habilidades defensivas.
// ════════════════════════════════════════════════════════════════════
import type { AttackDef, ClassId, Equipment } from './types';
import { CLASSES } from './data/classes';
import { getItem } from './data/items';

export const FISTS: AttackDef = { name: 'Puñetazo', kind: 'physical', power: 0.6, fx: 'smash' };
export const FIST_SKILLS = ['low_blow'];

export interface SkillGroup {
  source: 'class' | 'weapon' | 'offhand';
  label: string;
  skills: string[];
}

export interface Loadout {
  basicAttack: AttackDef;
  groups: SkillGroup[];
  /** Todas las habilidades disponibles, sin repetir. */
  skills: string[];
}

export function combatLoadout(classId: ClassId, equipment: Equipment): Loadout {
  const cls = CLASSES[classId];
  const weapon = equipment.mainHand ? getItem(equipment.mainHand.itemId) : null;
  const off = equipment.offHand ? getItem(equipment.offHand.itemId) : null;
  const groups: SkillGroup[] = [{ source: 'class', label: cls.name, skills: [cls.classSkill] }];
  groups.push(weapon ? { source: 'weapon', label: weapon.name, skills: weapon.grants ?? [] } : { source: 'weapon', label: 'Puños', skills: FIST_SKILLS });
  if (off?.grants?.length) groups.push({ source: 'offhand', label: off.name, skills: off.grants });
  const skills = [...new Set(groups.flatMap((g) => g.skills))];
  return { basicAttack: weapon?.attack ?? FISTS, groups, skills };
}
