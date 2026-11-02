import type { Grid, Profile, QuestProgress } from './types';
import { QUESTS, QUESTS_PER_VENDOR, type QuestDef } from './data/quests';
import type { VendorId } from './data/vendors';
import { countItem } from './inventory';

export function initialQuests(): QuestProgress[] {
  return QUESTS.map((q) => ({ id: q.id, progress: 0, claimed: false }));
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
    if (p.claimed) return p;
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

/** Misiones que ofrece ahora un vendedor: las de tu nivel que no hayas cobrado (las repetibles vuelven), hasta QUESTS_PER_VENDOR. */
export function offeredQuests(profile: Profile, vendor: VendorId): QuestProgress[] {
  return QUESTS.filter((q) => q.vendor === vendor && (q.minLevel ?? 1) <= profile.character.level)
    .map((q) => profile.quests.find((x) => x.id === q.id) ?? { id: q.id, progress: 0, claimed: false })
    .filter((p) => !p.claimed)
    .slice(0, QUESTS_PER_VENDOR);
}
