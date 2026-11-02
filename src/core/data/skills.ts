import type { SkillDef } from '../types';

// Habilidades del juego. Cada una pertenece a una fuente:
//  · Clase: siempre disponible (1 por clase).
//  · Arma: la concede el arma equipada.
//  · Secundaria: la conceden escudos y tomos (las defensivas solo existen si los llevas).
//  · Criaturas: solo las usan los enemigos.
export const SKILLS: Record<string, SkillDef> = {
  // ── Clase ──
  war_cry: { id: 'war_cry', name: 'Grito de guerra', description: 'Tu rabia sube: causas un 30% más de daño durante 3 turnos.', cost: 4, target: 'self', applies: [{ status: 'empower', chance: 1, turns: 3, self: true }], fx: 'holy' },
  meditation: { id: 'meditation', name: 'Meditación', description: 'Recuperas 18 de maná a cambio del turno.', cost: 0, target: 'self', manaGain: 18, fx: 'holy' },
  shadow_veil: { id: 'shadow_veil', name: 'Velo de sombras', description: 'Te ocultas: recibes un 40% menos de daño durante 2 turnos.', cost: 3, target: 'self', applies: [{ status: 'protect', chance: 1, turns: 2, self: true }], fx: 'dark' },
  prayer: { id: 'prayer', name: 'Plegaria', description: 'Recuperas un 25% de tu vida.', cost: 5, target: 'self', healPct: 0.25, fx: 'holy' },

  // ── Puños (sin arma) ──
  low_blow: { id: 'low_blow', name: 'Golpe bajo', description: 'Golpe sucio (x0.5) con 25% de aturdir.', cost: 2, target: 'enemy', kind: 'physical', power: 0.5, applies: [{ status: 'stun', chance: 0.25, turns: 1 }], fx: 'smash' },

  // ── Espadas ──
  rending_slash: { id: 'rending_slash', name: 'Tajo desgarrador', description: 'Golpe potente (x1.4) que provoca sangrado durante 3 turnos.', cost: 5, target: 'enemy', kind: 'physical', power: 1.4, applies: [{ status: 'bleed', chance: 0.8, turns: 3 }], fx: 'slash' },
  thrust: { id: 'thrust', name: 'Estocada', description: 'Ataque preciso (x1.2) que no se puede esquivar.', cost: 3, target: 'enemy', kind: 'physical', power: 1.2, ignoresEvasion: true, fx: 'slash' },
  pommel_strike: { id: 'pommel_strike', name: 'Golpe de pomo', description: 'Golpe seco (x0.8) con 40% de aturdir.', cost: 4, target: 'enemy', kind: 'physical', power: 0.8, applies: [{ status: 'stun', chance: 0.4, turns: 1 }], fx: 'smash' },
  dread_cut: { id: 'dread_cut', name: 'Corte del pavor', description: 'Tajo terrible (x2.0) que siempre hace sangrar.', cost: 8, target: 'enemy', kind: 'physical', power: 2.0, applies: [{ status: 'bleed', chance: 1, turns: 3 }], fx: 'slash' },

  // ── Hachas ──
  brutal_blow: { id: 'brutal_blow', name: 'Golpe brutal', description: 'Golpe (x1.4) que ignora la mitad de la defensa.', cost: 5, target: 'enemy', kind: 'physical', power: 1.4, armorPierce: 0.5, fx: 'smash' },
  skull_splitter: { id: 'skull_splitter', name: 'Partecráneos', description: 'Golpe (x1.2) con 35% de aturdir.', cost: 6, target: 'enemy', kind: 'physical', power: 1.2, applies: [{ status: 'stun', chance: 0.35, turns: 1 }], fx: 'smash' },
  reaping: { id: 'reaping', name: 'Siega', description: 'Barrido demoledor (x1.8) que ignora parte de la defensa.', cost: 8, target: 'enemy', kind: 'physical', power: 1.8, armorPierce: 0.3, fx: 'slash' },

  // ── Dagas ──
  venom_strike: { id: 'venom_strike', name: 'Estocada venenosa', description: 'Ataque (x1.1) con 70% de envenenar durante 3 turnos.', cost: 4, target: 'enemy', kind: 'physical', power: 1.1, applies: [{ status: 'poison', chance: 0.7, turns: 3 }], fx: 'poison' },
  backstab: { id: 'backstab', name: 'Puñalada traicionera', description: 'Golpe preciso (x1.7) que ignora la evasión.', cost: 6, target: 'enemy', kind: 'physical', power: 1.7, ignoresEvasion: true, fx: 'slash' },

  // ── Báculos ──
  spark: { id: 'spark', name: 'Chispa', description: 'Daño mágico (x1.0) con 25% de quemar.', cost: 3, target: 'enemy', kind: 'magical', power: 1.0, applies: [{ status: 'burn', chance: 0.25, turns: 2 }], fx: 'fire' },
  frost_lance: { id: 'frost_lance', name: 'Lanza de escarcha', description: 'Daño mágico (x1.2). 40% de congelar al objetivo un turno.', cost: 5, target: 'enemy', kind: 'magical', power: 1.2, applies: [{ status: 'freeze', chance: 0.4, turns: 1 }], fx: 'frost' },
  fireball: { id: 'fireball', name: 'Bola de fuego', description: 'Daño mágico alto (x1.7). 50% de quemar durante 3 turnos.', cost: 7, target: 'enemy', kind: 'magical', power: 1.7, applies: [{ status: 'burn', chance: 0.5, turns: 3 }], fx: 'fire' },
  ember_rain: { id: 'ember_rain', name: 'Lluvia de ascuas', description: 'Daño mágico (x1.1) con 80% de quemar durante 3 turnos.', cost: 6, target: 'enemy', kind: 'magical', power: 1.1, applies: [{ status: 'burn', chance: 0.8, turns: 3 }], fx: 'fire' },
  blizzard: { id: 'blizzard', name: 'Ventisca', description: 'Daño mágico alto (x1.6) con 35% de congelar.', cost: 9, target: 'enemy', kind: 'magical', power: 1.6, applies: [{ status: 'freeze', chance: 0.35, turns: 1 }], fx: 'frost' },
  ice_prison: { id: 'ice_prison', name: 'Prisión de hielo', description: 'Poco daño (x0.6), pero 80% de congelar.', cost: 6, target: 'enemy', kind: 'magical', power: 0.6, applies: [{ status: 'freeze', chance: 0.8, turns: 1 }], fx: 'frost' },
  dark_nova: { id: 'dark_nova', name: 'Nova oscura', description: 'Estallido de magia prohibida (x2.2).', cost: 14, target: 'enemy', kind: 'magical', power: 2.2, fx: 'dark' },

  // ── Mazas ──
  holy_light: { id: 'holy_light', name: 'Luz sagrada', description: 'Daño mágico (x1.2), el doble contra no-muertos.', cost: 5, target: 'enemy', kind: 'magical', power: 1.2, bonusVsUndead: 2, fx: 'holy' },

  // ── Escudos ──
  block: { id: 'block', name: 'Bloqueo', description: 'Levantas el escudo: el próximo golpe se reduce un 85%.', cost: 2, target: 'self', applies: [{ status: 'block', chance: 1, turns: 2, self: true }], fx: 'shield' },
  shield_bash: { id: 'shield_bash', name: 'Embestida', description: 'Golpe con el escudo (x0.7) con 40% de aturdir.', cost: 4, target: 'enemy', kind: 'physical', power: 0.7, applies: [{ status: 'stun', chance: 0.4, turns: 1 }], fx: 'smash' },
  iron_wall: { id: 'iron_wall', name: 'Muro de hierro', description: 'Te proteges (-40% de daño) y regeneras vida durante 3 turnos.', cost: 5, target: 'self', applies: [{ status: 'protect', chance: 1, turns: 3, self: true }, { status: 'regen', chance: 1, turns: 3, self: true }], fx: 'shield' },

  // ── Tomos ──
  arcane_barrier: { id: 'arcane_barrier', name: 'Barrera arcana', description: 'Un escudo de luz: -40% de daño durante 3 turnos.', cost: 5, target: 'self', applies: [{ status: 'protect', chance: 1, turns: 3, self: true }], fx: 'shield' },
  mana_siphon: { id: 'mana_siphon', name: 'Sifón de maná', description: 'Daño mágico (x0.9) y recuperas 10 de maná.', cost: 0, target: 'enemy', kind: 'magical', power: 0.9, manaGain: 10, fx: 'dark' },

  // ── Clérigo (preparado) ──
  sanctuary: { id: 'sanctuary', name: 'Santuario', description: 'Cura un 30% de tu vida y te protege 2 turnos.', cost: 6, target: 'self', healPct: 0.3, applies: [{ status: 'protect', chance: 1, turns: 2, self: true }], fx: 'holy' },

  // ── Criaturas ──
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
