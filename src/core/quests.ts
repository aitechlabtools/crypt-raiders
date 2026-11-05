import type { Grid, Profile, QuestProgress } from './types';
import { MAX_ACTIVE_QUESTS, OLD_QUEST_GAP, QUESTS, type QuestDef } from './data/quests';
import type { VendorId } from './data/vendors';
import { countItem } from './inventory';

export function initialQuests(): QuestProgress[] {
  return QUESTS.map((q) => ({ id: q.id, progress: 0, claimed: false, accepted: false }));
}

export interface ExpeditionOutcomeForQuests {
  extracted: boolean;
  kills: Record<string, number>;
  extractedValue: number;
  /** Zona de la expedición (para «extrae desde…»). */
  zone?: string;
  /** Cofres abiertos por tipo de tabla (para «abre N cofres de…»). */
  chestsOpened?: Record<string, number>;
  veinsMined?: number;
}

export function questDef(id: string): QuestDef {
  const q = QUESTS.find((x) => x.id === id);
  if (!q) throw new Error(`Misión desconocida: ${id}`);
  return q;
}

/** Progreso actual. Las entregas se miden con lo que tienes en la mochila y el almacén. */
export function questProgress(p: QuestProgress, inv?: { backpack: Grid; stash: Grid }): number {
  const q = questDef(p.id);
  if (q.type === 'deliver') return inv ? Math.min(q.count, countItem(inv.backpack, q.target!) + countItem(inv.stash, q.target!)) : 0;
  return p.progress;
}

export function isComplete(p: QuestProgress, inv?: { backpack: Grid; stash: Grid }): boolean {
  return questProgress(p, inv) >= questDef(p.id).count;
}

/** Actualiza el progreso al terminar una expedición. Las muertes también cuentan para las misiones de caza y de cofres. */
export function updateQuests(list: QuestProgress[], o: ExpeditionOutcomeForQuests): QuestProgress[] {
  return list.map((p) => {
    // Solo avanzan las que has aceptado
    if (p.claimed || !p.accepted) return p;
    const q = questDef(p.id);
    let progress = p.progress;
    if (q.type === 'kill' || q.type === 'kill_boss') progress += o.kills[q.target!] ?? 0;
    if (q.type === 'extract' && o.extracted) progress += 1;
    if (q.type === 'extract_value' && o.extracted) progress = Math.max(progress, o.extractedValue);
    if (q.type === 'extract_zone' && o.extracted && (o.zone ?? 'mazmorra') === q.target) progress += 1;
    if (q.type === 'open_chest') progress += o.chestsOpened?.[q.target!] ?? 0;
    if (q.type === 'mine') progress += o.veinsMined ?? 0;
    return { ...p, progress: Math.min(progress, q.count) };
  });
}

// ── Tablón y misiones aceptadas ──
// Cada mercader enseña en su tablón todas las misiones de tu nivel que no has cobrado ni aceptado (primero las de tu zona).
// Aceptas hasta MAX_ACTIVE_QUESTS; solo avanzan las aceptadas. Dejar una la devuelve al tablón y pierde lo hecho.

/** Nivel de la zona de una misión (1 Mazmorra, 30 Cripta, 60 Infierno). */
export function questTier(id: string): number {
  return questDef(id).minLevel ?? 1;
}

/** De una zona muy por debajo de tu nivel: va a «Encargos antiguos». */
export function isOldQuest(id: string, level: number): boolean {
  return level - questTier(id) > OLD_QUEST_GAP;
}

const entry = (profile: Profile, id: string): QuestProgress => profile.quests.find((x) => x.id === id) ?? { id, progress: 0, claimed: false };

/** Misiones aceptadas sin cobrar (todas o de un mercader). */
export function activeQuests(profile: Profile, vendor?: VendorId): QuestProgress[] {
  return QUESTS.filter((q) => !vendor || q.vendor === vendor).map((q) => entry(profile, q.id)).filter((p) => p.accepted && !p.claimed);
}

/** Tablón de un mercader: las de tu nivel no cobradas ni aceptadas, primero las de tu zona (las más altas que alcanzas). */
export function boardQuests(profile: Profile, vendor: VendorId): QuestProgress[] {
  const lv = profile.character.level;
  return QUESTS.filter((q) => q.vendor === vendor && (q.minLevel ?? 1) <= lv)
    .map((q) => entry(profile, q.id))
    .filter((p) => !p.claimed && !p.accepted)
    .sort((a, b) => questTier(b.id) - questTier(a.id));
}

/** Por qué no puedes aceptar más (o null). */
export function acceptBlock(profile: Profile): string | null {
  return activeQuests(profile).length >= MAX_ACTIVE_QUESTS ? `Ya llevas ${MAX_ACTIVE_QUESTS} misiones. Cobra o deja alguna para aceptar otra.` : null;
}

const patch = (profile: Profile, id: string, f: (q: QuestProgress) => QuestProgress): Profile => {
  const has = profile.quests.some((x) => x.id === id);
  const list = has ? profile.quests : [...profile.quests, { id, progress: 0, claimed: false }];
  return { ...profile, quests: list.map((x) => (x.id === id ? f(x) : x)) };
};

export function acceptQuest(profile: Profile, id: string): { ok: true; profile: Profile } | { ok: false; error: string } {
  const q = entry(profile, id);
  const def = questDef(id);
  if (q.claimed || q.accepted) return { ok: false, error: 'Esa misión no está en el tablón.' };
  if ((def.minLevel ?? 1) > profile.character.level) return { ok: false, error: `Necesitas nivel ${def.minLevel}.` };
  const block = acceptBlock(profile);
  if (block) return { ok: false, error: block };
  return { ok: true, profile: patch(profile, id, (x) => ({ ...x, accepted: true, progress: 0 })) };
}

/** Dejar una misión: vuelve al tablón y pierde lo que llevabas. */
export function abandonQuest(profile: Profile, id: string): Profile {
  return patch(profile, id, (x) => ({ ...x, accepted: false, pinned: false, progress: 0 }));
}

export function togglePin(profile: Profile, id: string): Profile {
  return patch(profile, id, (x) => ({ ...x, pinned: x.accepted ? !x.pinned : false }));
}

/** Tras cobrarla: las repetibles vuelven al tablón desde cero; las demás quedan cobradas. */
export function afterClaim(profile: Profile, id: string): Profile {
  const rep = !!questDef(id).repeatable;
  return patch(profile, id, (x) => (rep ? { ...x, progress: 0, accepted: false, pinned: false } : { ...x, claimed: true, accepted: false, pinned: false }));
}

/** Misiones listas para cobrar (aceptadas y completas), todas o de un mercader. */
export function readyQuestCount(profile: Profile, vendor?: VendorId): number {
  return activeQuests(profile, vendor).filter((q) => isComplete(q, profile)).length;
}

/** Fijadas, para el recordatorio en Jugar y en la mazmorra. */
export function pinnedQuests(profile: Profile): QuestProgress[] {
  return activeQuests(profile).filter((q) => q.pinned);
}

/**
 * Partidas de antes del tablón: las misiones con progreso pasan a aceptadas (aunque sean más de 5) y conservan lo hecho.
 * Solo se hace una vez (si ninguna tiene aún el campo `accepted`).
 */
export function migrateQuests(list: QuestProgress[]): QuestProgress[] {
  if (list.some((q) => q.accepted !== undefined)) return list;
  return list.map((q) => ({ ...q, accepted: !q.claimed && q.progress > 0 }));
}
