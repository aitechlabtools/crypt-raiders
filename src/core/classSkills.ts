// ════════════════════════════════════════════════════════════════════
// Habilidades de clase: una inicial y cuatro más que el jugador elige desbloquear al llegar a los
// niveles de CLASS_UNLOCK_LEVELS. Solo se lleva una equipada; se cambia fuera de combate (Personaje).
// ════════════════════════════════════════════════════════════════════
import type { ClassId, Profile } from './types';
import { CLASSES } from './data/classes';
import { CLASS_UNLOCK_LEVELS } from '../config/progression';

/** Desbloqueos ganados por nivel (sin contar la inicial). */
export function unlocksEarned(level: number): number {
  return CLASS_UNLOCK_LEVELS.filter((l) => level >= l).length;
}

export function initialClassSkills(classId: ClassId): Profile['classSkills'] {
  const first = CLASSES[classId].classSkills[0];
  return { unlocked: [first], equipped: first };
}

/** Desbloqueos pendientes de elegir. */
export function pendingUnlocks(p: Profile): number {
  const total = CLASSES[p.character.classId].classSkills.length;
  const can = Math.min(total, 1 + unlocksEarned(p.character.level));
  return Math.max(0, can - p.classSkills.unlocked.length);
}

/** Las que aún puedes desbloquear (las que no tienes). */
export function lockedClassSkills(p: Profile): string[] {
  return CLASSES[p.character.classId].classSkills.filter((id) => !p.classSkills.unlocked.includes(id));
}

export function unlockClassSkill(p: Profile, id: string): Profile | null {
  if (pendingUnlocks(p) <= 0 || !lockedClassSkills(p).includes(id)) return null;
  return { ...p, classSkills: { ...p.classSkills, unlocked: [...p.classSkills.unlocked, id] } };
}

export function equipClassSkill(p: Profile, id: string): Profile | null {
  if (!p.classSkills.unlocked.includes(id)) return null;
  return { ...p, classSkills: { ...p.classSkills, equipped: id } };
}

/** Repara lo guardado: solo ids de la clase, la inicial siempre, y la equipada tiene que estar desbloqueada. */
export function sanitizeClassSkills(p: Profile): Profile['classSkills'] {
  const all = CLASSES[p.character.classId].classSkills;
  const raw = (p.classSkills ?? {}) as Partial<Profile['classSkills']>;
  const unlocked = [...new Set([all[0], ...(Array.isArray(raw.unlocked) ? raw.unlocked : []).filter((id) => all.includes(id))])]
    .slice(0, 1 + unlocksEarned(p.character.level));
  const equipped = raw.equipped && unlocked.includes(raw.equipped) ? raw.equipped : unlocked[0];
  return { unlocked, equipped };
}
