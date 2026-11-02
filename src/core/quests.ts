import type { QuestProgress } from './types';
import { QUESTS, type QuestDef } from './data/quests';

export function initialQuests(): QuestProgress[] {
  return QUESTS.map((q) => ({ id: q.id, progress: 0, claimed: false }));
}

export interface ExpeditionOutcomeForQuests {
  extracted: boolean;
  kills: Record<string, number>;
  extractedValue: number;
}

export function questDef(id: string): QuestDef {
  const q = QUESTS.find((x) => x.id === id);
  if (!q) throw new Error(`Misión desconocida: ${id}`);
  return q;
}

export function isComplete(p: QuestProgress): boolean {
  return p.progress >= questDef(p.id).count;
}

/** Actualiza el progreso al terminar una expedición. Las muertes también cuentan para las misiones de caza. */
export function updateQuests(list: QuestProgress[], o: ExpeditionOutcomeForQuests): QuestProgress[] {
  return list.map((p) => {
    if (p.claimed) return p;
    const q = questDef(p.id);
    let progress = p.progress;
    if (q.type === 'kill' || q.type === 'kill_boss') progress += o.kills[q.target!] ?? 0;
    if (q.type === 'extract' && o.extracted) progress += 1;
    if (q.type === 'extract_value' && o.extracted) progress = Math.max(progress, o.extractedValue);
    return { ...p, progress: Math.min(progress, q.count) };
  });
}
