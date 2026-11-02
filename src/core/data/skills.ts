import type { SkillDef } from '../types';

export const SKILLS: Record<string, SkillDef> = {
  // Guerrero
  rending_slash: { id: 'rending_slash', name: 'Tajo desgarrador', description: 'Golpe potente (x1.4) que provoca sangrado durante 3 turnos.', cost: 5, target: 'enemy', kind: 'physical', power: 1.4, applies: [{ status: 'bleed', chance: 0.8, turns: 3 }], fx: 'slash' },
  iron_wall: { id: 'iron_wall', name: 'Muro de hierro', description: 'Te proteges (-40% de daño) y regeneras vida durante 3 turnos.', cost: 4, target: 'self', applies: [{ status: 'protect', chance: 1, turns: 3, self: true }, { status: 'regen', chance: 1, turns: 3, self: true }], fx: 'shield' },
  // Mago
  fireball: { id: 'fireball', name: 'Bola de fuego', description: 'Daño mágico alto (x1.7). 50% de quemar durante 3 turnos.', cost: 7, target: 'enemy', kind: 'magical', power: 1.7, applies: [{ status: 'burn', chance: 0.5, turns: 3 }], fx: 'fire' },
  frost_lance: { id: 'frost_lance', name: 'Lanza de escarcha', description: 'Daño mágico (x1.2). 40% de congelar al objetivo un turno.', cost: 5, target: 'enemy', kind: 'magical', power: 1.2, applies: [{ status: 'freeze', chance: 0.4, turns: 1 }], fx: 'frost' },
  // Pícaro (preparado para próximas versiones; también lo usa el aventurero rival)
  venom_strike: { id: 'venom_strike', name: 'Estocada venenosa', description: 'Ataque (x1.1) con 70% de envenenar durante 3 turnos.', cost: 4, target: 'enemy', kind: 'physical', power: 1.1, applies: [{ status: 'poison', chance: 0.7, turns: 3 }], fx: 'poison' },
  backstab: { id: 'backstab', name: 'Puñalada traicionera', description: 'Golpe preciso (x1.7) que ignora la evasión.', cost: 6, target: 'enemy', kind: 'physical', power: 1.7, ignoresEvasion: true, fx: 'slash' },
  // Clérigo (preparado)
  holy_light: { id: 'holy_light', name: 'Luz sagrada', description: 'Daño mágico (x1.2), el doble contra no-muertos.', cost: 5, target: 'enemy', kind: 'magical', power: 1.2, bonusVsUndead: 2, fx: 'holy' },
  sanctuary: { id: 'sanctuary', name: 'Santuario', description: 'Cura un 30% de tu vida y te protege 2 turnos.', cost: 6, target: 'self', healPct: 0.3, applies: [{ status: 'protect', chance: 1, turns: 2, self: true }], fx: 'holy' },
  // Criaturas
  bone_bash: { id: 'bone_bash', name: 'Golpe óseo', description: 'Golpe contundente con 25% de aturdir.', cost: 0, target: 'enemy', kind: 'physical', power: 1.3, applies: [{ status: 'stun', chance: 0.25, turns: 1 }], fx: 'smash' },
  leech_bite: { id: 'leech_bite', name: 'Mordisco sangrante', description: 'Mordisco con 50% de sangrado.', cost: 0, target: 'enemy', kind: 'physical', power: 0.9, applies: [{ status: 'bleed', chance: 0.5, turns: 2 }], fx: 'bite' },
  grave_slam: { id: 'grave_slam', name: 'Losa funeraria', description: 'Golpe devastador con 30% de aturdir.', cost: 0, target: 'enemy', kind: 'physical', power: 1.6, applies: [{ status: 'stun', chance: 0.3, turns: 1 }], fx: 'smash' },
  necrotic_wave: { id: 'necrotic_wave', name: 'Onda necrótica', description: 'Magia oscura con 60% de veneno.', cost: 0, target: 'enemy', kind: 'magical', power: 1.2, applies: [{ status: 'poison', chance: 0.6, turns: 3 }], fx: 'dark' },
  bone_shield: { id: 'bone_shield', name: 'Escudo de huesos', description: 'Se protege durante 2 turnos.', cost: 0, target: 'self', applies: [{ status: 'protect', chance: 1, turns: 2, self: true }], fx: 'shield' },
};

export function getSkill(id: string): SkillDef {
  const s = SKILLS[id];
  if (!s) throw new Error(`Habilidad desconocida: ${id}`);
  return s;
}
