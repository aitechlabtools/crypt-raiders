export interface QuestDef {
  id: string;
  name: string;
  description: string;
  type: 'kill' | 'extract' | 'extract_value' | 'kill_boss';
  target?: string;
  count: number;
  reward: { gold: number; xp: number };
}

export const QUESTS: QuestDef[] = [
  { id: 'q_bones', name: 'Polvo eres', description: 'Derrota a 3 esqueletos guerreros.', type: 'kill', target: 'skeleton', count: 3, reward: { gold: 40, xp: 40 } },
  { id: 'q_first_escape', name: 'Volver para contarlo', description: 'Extrae con vida de una expedición.', type: 'extract', count: 1, reward: { gold: 30, xp: 30 } },
  { id: 'q_treasure', name: 'Ojos de urraca', description: 'Extrae botín por valor de 250 de oro o más en una expedición.', type: 'extract_value', count: 250, reward: { gold: 60, xp: 50 } },
  { id: 'q_lord', name: 'El trono vacío', description: 'Derrota al Señor del Osario.', type: 'kill_boss', target: 'ossuary_lord', count: 1, reward: { gold: 120, xp: 100 } },
];
