// Valores de progresión del personaje. Todo lo que afecta al ritmo de subida está aquí, fuera de la lógica.

/** Nivel máximo del personaje. */
export const MAX_LEVEL = 100;

/** Experiencia para pasar del nivel N al N+1 = XP_BASE × N^XP_EXPONENT.
 *  Ritmo buscado (expediciones completas por nivel): ~1 al principio, ~4 en el nivel 30, ~6 en el 60, ~8 cerca del 100. */
export const XP_BASE = 32;
export const XP_EXPONENT = 1.4;

/** Crecimiento de las estadísticas del personaje por nivel, como fracción del valor por nivel de su clase
 *  (classes.ts → perLevel). Con 0.31, el nivel 30 equivale en fuerza al antiguo nivel 10. */
export const STAT_GROWTH_PER_LEVEL = 9 / 29;

/** Las criaturas se endurecen un +X por nivel (vida, ataque, defensa, magia y resistencia). */
export const ENEMY_SCALE_PER_LEVEL = 0.15 * (9 / 29);

/** Experiencia que da una criatura: su XP base × (1 + ENEMY_XP_PER_LEVEL × (nivel − 1)). */
export const ENEMY_XP_PER_LEVEL = 0.1;

/** Conversión de la escala antigua (niveles 1–10) a la nueva (1–100): usada para migrar partidas guardadas. */
export function legacyLevelToNew(oldLevel: number): number {
  return Math.round(1 + (Math.max(1, oldLevel) - 1) * (29 / 9));
}

/** Las pociones curan su cantidad fija o este porcentaje del máximo, lo que sea mayor (así siguen sirviendo a nivel alto). */
export const POTION_MIN_PCT = 0.18;
export function potionAmount(amount: number, max: number): number {
  return Math.max(amount, Math.round(max * POTION_MIN_PCT));
}

// ── Ímpetu y maná ──
// Los costes de las habilidades crecen con el recurso máximo: así subir de nivel no lo vuelve infinito.
// Hasta la referencia cuestan lo que dice la habilidad; con el doble de máximo, el doble.
// El maná parte de más alto (un mago de nivel 1 tiene 45), así que su referencia también es mayor.
export const RESOURCE_COST_REF = { impetus: 25, mana: 50 } as const;
export function skillCost(base: number, maxMp: number, resource: 'impetus' | 'mana' = 'impetus'): number {
  const ref = RESOURCE_COST_REF[resource];
  if (base <= 0 || maxMp <= ref) return base;
  return Math.round(base * (maxMp / ref));
}
// Lo que recuperan Meditación y compañía crece igual (referencia: el maná de un mago de nivel 1).
export const RESOURCE_GAIN_REF = 45;
export function resourceGain(base: number, maxMp: number): number {
  return Math.max(base, Math.round(base * (maxMp / RESOURCE_GAIN_REF)));
}
/** Maná que se recupera solo al final de cada turno: crece con el máximo (un 3% aprox., mínimo lo que diga la clase). */
export function turnRegen(base: number, maxMp: number): number {
  return Math.max(base, Math.round(maxMp * 0.03));
}
/** El ímpetu no se recupera solo: se gana golpeando con el arma y encajando golpes. */
export const IMPETUS_ON_HIT = 3;
export const IMPETUS_WHEN_HIT = 1;
/** Tónicos y pociones de maná: su cantidad fija o este porcentaje del máximo, lo que sea mayor. */
export const RESOURCE_POTION_PCT = 0.35;
export function resourcePotionAmount(amount: number, max: number): number {
  return Math.max(amount, Math.round(max * RESOURCE_POTION_PCT));
}

/** Niveles en los que se gana un desbloqueo de habilidad de clase (el jugador elige cuál). */
export const CLASS_UNLOCK_LEVELS = [20, 40, 60, 80];
