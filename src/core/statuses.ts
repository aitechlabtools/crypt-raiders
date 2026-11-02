import type { StatusId } from './types';

export interface StatusDef {
  id: StatusId;
  name: string;
  description: string;
  color: string;
  /** Daño por turno como fracción de la vida máxima. */
  dotPct?: number;
  /** Curación por turno como fracción de la vida máxima. */
  regenPct?: number;
  skipsTurn?: boolean;
  /** Multiplicador del daño recibido. */
  damageTakenMult?: number;
  /** Multiplicador del daño causado. */
  damageDealtMult?: number;
  /** Se consume al recibir un golpe. */
  consumedOnHit?: boolean;
  harmful: boolean;
}

export const STATUSES: Record<StatusId, StatusDef> = {
  poison: { id: 'poison', name: 'Veneno', description: 'Pierde un 7% de su vida máxima al final de cada turno.', color: '#7bc043', dotPct: 0.07, harmful: true },
  burn: { id: 'burn', name: 'Quemadura', description: 'Pierde un 6% de su vida máxima al final de cada turno.', color: '#e8752b', dotPct: 0.06, harmful: true },
  bleed: { id: 'bleed', name: 'Sangrado', description: 'Pierde un 5% de su vida máxima al final de cada turno.', color: '#c4283b', dotPct: 0.05, harmful: true },
  freeze: { id: 'freeze', name: 'Congelación', description: 'Pierde su próximo turno.', color: '#7fd4f0', skipsTurn: true, harmful: true },
  stun: { id: 'stun', name: 'Aturdimiento', description: 'Pierde su próximo turno.', color: '#e8d24a', skipsTurn: true, harmful: true },
  protect: { id: 'protect', name: 'Protección', description: 'Recibe un 40% menos de daño.', color: '#8fa8c8', damageTakenMult: 0.6, harmful: false },
  empower: { id: 'empower', name: 'Furia', description: 'Causa un 30% más de daño.', color: '#ff8a3a', damageDealtMult: 1.3, harmful: false },
  block: { id: 'block', name: 'Bloqueo', description: 'El próximo golpe recibido se reduce un 85%.', color: '#d9d3c1', damageTakenMult: 0.15, consumedOnHit: true, harmful: false },
  regen: { id: 'regen', name: 'Regeneración', description: 'Recupera un 6% de su vida máxima al final de cada turno.', color: '#5fd19a', regenPct: 0.06, harmful: false },
};
