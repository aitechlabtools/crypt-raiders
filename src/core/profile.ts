import { MERCENARIES } from './data/mercenaries';
import { SKINS } from './data/skins';
import type { Appearance, ClassId, Profile } from './types';
import { CLASSES } from './data/classes';
import { addToGrid, BACKPACK_SIZE, emptyEquipment, emptyGrid, STASH_SIZE } from './inventory';
import { getItem } from './data/items';
import { initialQuests } from './quests';
import { makeUid } from './rng';
import { POCKET_SIZE } from './data/chests';
import { legacyLevelToNew } from '../config/progression';
import { xpForNextLevel } from './stats';

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
    version: 2,
    character: { name: name.trim().slice(0, 18) || 'Sin nombre', classId, appearance, level: 1, xp: 0 },
    gold: STARTING_GOLD,
    backpack,
    stash: emptyGrid(STASH_SIZE),
    equipment,
    quests: initialQuests(),
    stats: { expeditions: 0, extractions: 0, deaths: 0, kills: 0 },
    bossesDefeated: [],
    contract: null,
    skins: { owned: [], equipped: null },
    mercsRescued: [],
    mercDiscounts: [],
    bestiary: {},
    reputation: {},
    pocket: emptyGrid(POCKET_SIZE),
    activeExpedition: null,
    tutorialSeen: { lobby: false, dungeon: false },
    settings: { volume: 0.6, music: true },
    createdAt: Date.now(),
  };
}

/** Lleva un perfil guardado con una versión antigua al formato actual sin que el jugador pierda nada. */
export function migrateProfile(p: Profile): Profile {
  const v = (p as { version?: number }).version;
  if (v === 1 && p.character) {
    // v1 → v2: niveles 1–10 pasan a la escala 1–100; se conserva la proporción de experiencia hacia el siguiente nivel
    const oldLevel = p.character.level;
    const oldNeed = Math.round(100 * Math.pow(oldLevel, 1.4));
    const frac = oldNeed > 0 ? Math.min(0.99, Math.max(0, p.character.xp / oldNeed)) : 0;
    const level = legacyLevelToNew(oldLevel);
    p.character = { ...p.character, level, xp: Math.floor(frac * xpForNextLevel(level)) };
    (p as { version: number }).version = 2;
  }
  return p;
}

/** Valida y repara un perfil cargado del almacenamiento (por si cambia el formato entre versiones). */
export function sanitizeProfile(raw: unknown): Profile | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = migrateProfile(raw as Profile);
  if (p.version !== 2 || !p.character || !Array.isArray(p.backpack) || !Array.isArray(p.stash)) return null;
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
  // Partidas de antes de las zonas: si ya cobraste «El trono vacío», el Señor del Osario cuenta como derrotado
  if (!Array.isArray(p.bossesDefeated)) p.bossesDefeated = p.quests.some((q) => q.id === 'q_lord' && q.progress >= 1) ? ['ossuary_lord'] : [];
  if (!p.contract || typeof p.contract !== 'object' || !MERCENARIES[p.contract.mercId] || !(p.contract.left > 0)) p.contract = null;
  // El antiguo Vestuario (aspectos por pieza) desaparece: sus datos se descartan sin más (nadie los compró).
  delete (p as { cosmetics?: unknown }).cosmetics;
  delete (p as { wardrobe?: unknown }).wardrobe;
  // Atuendos: solo los que existen; el puesto tiene que ser uno de los tuyos.
  const sk = (p.skins ?? {}) as Partial<Profile['skins']>;
  const owned = Array.isArray(sk.owned) ? [...new Set(sk.owned.filter((id) => typeof id === 'string' && SKINS[id]))] : [];
  p.skins = { owned, equipped: sk.equipped && owned.includes(sk.equipped) ? sk.equipped : null };
  if (!Array.isArray(p.mercsRescued)) p.mercsRescued = [];
  p.mercsRescued = p.mercsRescued.filter((id) => MERCENARIES[id]);
  if (!Array.isArray(p.mercDiscounts)) p.mercDiscounts = [];
  if (!p.reputation || typeof p.reputation !== 'object') p.reputation = {};
  if (!p.bestiary || typeof p.bestiary !== 'object') p.bestiary = {};
  if (!Array.isArray(p.pocket)) p.pocket = emptyGrid(POCKET_SIZE);
  p.pocket = p.pocket.map(known) as Profile['pocket'];
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
