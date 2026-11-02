// ════════════════════════════════════════════════════════════════════
// Sistema social con el aventurero rival (Kael).
// Confianza y codicia son valores visibles a través del diálogo, nunca un azar oculto:
// la traición es una consecuencia comprensible de cómo te comportas.
// ════════════════════════════════════════════════════════════════════

export type Disposition = 'neutral' | 'allied' | 'hostile' | 'departed' | 'dead';

export interface RivalState {
  disposition: Disposition;
  trust: number; // 0..100
  greed: number; // 0..100
  hp: number;
  potions: number;
  talkedTimes: number;
  /** Objetos que Kael ha recibido (o lleva). Se pueden saquear si cae. */
  bagItemIds: string[];
  /** Oro que lleva encima. */
  gold: number;
  warned: boolean;
  betrayed: boolean;
  /** Quién rompió la alianza, si alguien lo hizo. */
  betrayedBy: 'player' | 'rival' | null;
}

/** Equipo que lleva Kael y que deja al morir (más lo que haya recibido en los repartos). */
export const RIVAL_GEAR = ['bone_dagger', 'leather_hood', 'swift_boots', 'old_coin', 'health_potion'];

export function initialRival(): RivalState {
  return {
    disposition: 'neutral', trust: 35, greed: 30, hp: 105, potions: 1, talkedTimes: 0,
    bagItemIds: [...RIVAL_GEAR], gold: 45, warned: false, betrayed: false, betrayedBy: null,
  };
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export const TALK_LINES = [
  'Kael: «Tranquilo, no busco pelea. No todavía. Dicen que el Señor del Osario guarda un cofre en la sala del este.»',
  'Kael: «El portal está al sur, pasada la sala de los pilares. Si el reloj llega a cero, aquí abajo te quedas.»',
  'Kael: «Los murciélagos esquivan mucho. Los esqueletos pegan fuerte, pero son lentos.»',
  'Kael: «Ya te he contado bastante. ¿Vamos juntos o cada uno por su lado?»',
];

export function talk(r: RivalState): { rival: RivalState; line: string } {
  const line = TALK_LINES[Math.min(r.talkedTimes, TALK_LINES.length - 1)];
  const trustGain = r.talkedTimes < 3 ? 10 : 0;
  return { rival: { ...r, talkedTimes: r.talkedTimes + 1, trust: clamp(r.trust + trustGain) }, line };
}

export function proposeAlliance(r: RivalState): { rival: RivalState; accepted: boolean; line: string } {
  if (r.disposition !== 'neutral') return { rival: r, accepted: false, line: 'Kael no parece dispuesto a escucharte.' };
  if (r.trust >= 40) {
    return { rival: { ...r, disposition: 'allied', trust: clamp(r.trust + 10) }, accepted: true, line: 'Kael: «Trato hecho. Repartimos lo que encontremos. Tú vigila mi espalda y yo la tuya.»' };
  }
  return { rival: { ...r, trust: clamp(r.trust + 5) }, accepted: false, line: 'Kael: «¿Aliarme con alguien de quien no sé nada? Háblame un poco antes.»' };
}

export function rejectRival(r: RivalState): { rival: RivalState; line: string } {
  return { rival: { ...r, disposition: 'departed', greed: clamp(r.greed + 10) }, line: 'Kael: «Como quieras. Que la cripta te sea leve.» Kael se aleja entre las sombras.' };
}

export function leaveAlliance(r: RivalState): { rival: RivalState; line: string } {
  return { rival: { ...r, disposition: 'departed', trust: clamp(r.trust - 20) }, line: 'Kael: «Así que aquí se separan nuestros caminos. Bien.»' };
}

/** Reparto del botín de un cofre abierto estando aliados. */
export function shareLoot(r: RivalState, given: string[], chestItemCount: number): { rival: RivalState; line: string | null } {
  if (r.disposition !== 'allied' || chestItemCount < 2) return { rival: r, line: null };
  if (given.length > 0) {
    return { rival: { ...r, trust: clamp(r.trust + 15), greed: clamp(r.greed - 10), bagItemIds: [...r.bagItemIds, ...given] }, line: 'Kael: «Justo y honrado. Así da gusto.»' };
  }
  return { rival: { ...r, trust: clamp(r.trust - 15), greed: clamp(r.greed + 20) }, line: 'Kael: «Ya veo cómo funciona esto...» Kael te mira en silencio.' };
}

export interface BetrayalContext {
  playerHpPct: number;
  /** Valor del botín que lleva el jugador. */
  playerLootValue: number;
  nearPortal: boolean;
}

/** Puntuación de traición. >= 60 ataca. >= 40 da señales de aviso. */
export function betrayalScore(r: RivalState, ctx: BetrayalContext): number {
  let score = r.greed + Math.min(40, ctx.playerLootValue / 15) - r.trust / 2;
  if (ctx.playerHpPct < 0.4) score += 25;
  if (ctx.nearPortal) score += 20;
  return Math.round(score);
}

export const BETRAYAL_THRESHOLD = 60;
export const WARNING_THRESHOLD = 40;

export function evaluateBetrayal(r: RivalState, ctx: BetrayalContext): { rival: RivalState; action: 'none' | 'warn' | 'betray'; line: string | null } {
  if (r.disposition !== 'allied' || r.betrayed) return { rival: r, action: 'none', line: null };
  const score = betrayalScore(r, ctx);
  if (score >= BETRAYAL_THRESHOLD) {
    return { rival: { ...r, disposition: 'hostile', betrayed: true, betrayedBy: 'rival' }, action: 'betray', line: 'Kael: «Nada personal. Es que tu mochila pesa demasiado para ti.» ¡Kael te traiciona!' };
  }
  if (score >= WARNING_THRESHOLD && !r.warned) {
    return { rival: { ...r, warned: true }, action: 'warn', line: 'Kael mira tu mochila con demasiado interés. Su mano descansa sobre la daga.' };
  }
  return { rival: r, action: 'none', line: null };
}

/** El jugador rompe la alianza y ataca. */
export function playerBetrays(r: RivalState): RivalState {
  return { ...r, disposition: 'hostile', betrayed: true, betrayedBy: 'player', trust: 0 };
}

export function playerAttacksNeutral(r: RivalState): RivalState {
  return { ...r, disposition: 'hostile', trust: 0 };
}
