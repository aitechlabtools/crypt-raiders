import type { Appearance, ClassId, Profile } from './types';
import { CLASSES } from './data/classes';
import { addToGrid, BACKPACK_SIZE, emptyEquipment, emptyGrid, STASH_SIZE } from './inventory';
import { getItem } from './data/items';
import { initialQuests } from './quests';
import { makeUid } from './rng';

export const STARTING_GOLD = 60;

export function createProfile(name: string, classId: ClassId, appearance: Appearance): Profile {
  const cls = CLASSES[classId];
  if (!cls.playable) throw new Error('Esa clase todavía no está disponible.');
  const equipment = emptyEquipment();
  let backpack = emptyGrid(BACKPACK_SIZE);
  for (const k of cls.starterKit) {
    const def = getItem(k.itemId);
    const stack = { uid: makeUid(), itemId: k.itemId, qty: k.qty };
    if (def.slot && !equipment[def.slot]) equipment[def.slot] = stack;
    else backpack = addToGrid(backpack, stack).grid;
  }
  return {
    version: 1,
    character: { name: name.trim().slice(0, 18) || 'Sin nombre', classId, appearance, level: 1, xp: 0 },
    gold: STARTING_GOLD,
    backpack,
    stash: emptyGrid(STASH_SIZE),
    equipment,
    quests: initialQuests(),
    stats: { expeditions: 0, extractions: 0, deaths: 0, kills: 0 },
    activeExpedition: null,
    tutorialSeen: { lobby: false, dungeon: false },
    settings: { volume: 0.6, music: true },
    createdAt: Date.now(),
  };
}

/** Valida y repara un perfil cargado del almacenamiento (por si cambia el formato entre versiones). */
export function sanitizeProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Profile;
  if (p.version !== 1 || !p.character || !Array.isArray(p.backpack) || !Array.isArray(p.stash)) return null;
  const known = (s: { itemId: string } | null) => {
    if (!s) return null;
    try { getItem(s.itemId); return s; } catch { return null; }
  };
  p.backpack = p.backpack.map(known) as Profile['backpack'];
  p.stash = p.stash.map(known) as Profile['stash'];
  const eq = { ...emptyEquipment(), ...(p.equipment ?? {}) };
  for (const k of Object.keys(eq) as (keyof typeof eq)[]) eq[k] = known(eq[k]) as typeof eq[typeof k];
  p.equipment = eq;
  p.quests = initialQuests().map((q) => p.quests?.find((x) => x.id === q.id) ?? q);
  p.tutorialSeen = p.tutorialSeen ?? { lobby: true, dungeon: true };
  p.settings = Object.assign({ volume: 0.6, music: true }, p.settings ?? {});
  p.stats = Object.assign({ expeditions: 0, extractions: 0, deaths: 0, kills: 0 }, p.stats ?? {});
  return p;
}

/** Si el jugador no tiene arma en ningún sitio, el intendente le presta una de recluta. */
export function needsRecruitKit(p: Profile): boolean {
  const all = [...p.backpack, ...p.stash, ...Object.values(p.equipment)];
  return !all.some((s) => s && getItem(s.itemId).category === 'weapon');
}

export function grantRecruitKit(p: Profile): Profile {
  const cls = CLASSES[p.character.classId];
  const weapon = cls.starterKit.find((k) => getItem(k.itemId).category === 'weapon')!;
  const armor = cls.starterKit.find((k) => getItem(k.itemId).category === 'armor');
  let backpack = p.backpack;
  const equipment = { ...p.equipment };
  for (const k of [weapon, armor]) {
    if (!k) continue;
    const def = getItem(k.itemId);
    const stack = { uid: makeUid(), itemId: k.itemId, qty: 1 };
    if (def.slot && !equipment[def.slot]) equipment[def.slot] = stack;
    else backpack = addToGrid(backpack, stack).grid;
  }
  backpack = addToGrid(backpack, { uid: makeUid(), itemId: 'health_potion', qty: 1 }).grid;
  return { ...p, backpack, equipment };
}
