import type { Equipment, Grid, ItemStack, Profile } from './types';
import { cloneGrid, gridValue, equippedValue } from './inventory';
import { computeStats, applyXp } from './stats';
import { updateQuests } from './quests';
import { emptyEquipment, emptyGrid } from './inventory';

// ════════════════════════════════════════════════════════════════════
// Reglas de extracción:
//  · Entras con lo que llevas equipado y en la mochila.
//  · Si extraes: conservas todo lo que llevas (incluido lo encontrado) y el oro recogido.
//  · Si mueres o se agota el tiempo: pierdes TODO lo que llevabas encima y el oro recogido.
//  · El almacén y el oro del banco nunca están en riesgo.
//  · La experiencia se conserva siempre.
// ════════════════════════════════════════════════════════════════════

export const EXPEDITION_DURATION_MS = 12 * 60 * 1000;

export interface ExpeditionState {
  startedAt: number;
  durationMs: number;
  backpack: Grid;
  equipment: Equipment;
  hp: number;
  mp: number;
  goldFound: number;
  xpGained: number;
  kills: Record<string, number>;
  /** Objetos encontrados durante la expedición (para el resumen). */
  found: ItemStack[];
  /** Valor de lo que el jugador llevaba al entrar (lo que arriesga). */
  riskedValue: number;
}

export type EndReason = 'extracted' | 'died' | 'timeout';

export interface ExpeditionSummary {
  reason: EndReason;
  durationMs: number;
  goldGained: number;
  goldLost: number;
  xpGained: number;
  levelsGained: number;
  kills: Record<string, number>;
  kept: ItemStack[];
  lost: ItemStack[];
  found: ItemStack[];
  extractedValue: number;
}

export function startExpedition(p: Profile, now: number): { profile: Profile; expedition: ExpeditionState } {
  const stats = computeStats(p.character.classId, p.character.level, p.equipment);
  const expedition: ExpeditionState = {
    startedAt: now,
    durationMs: EXPEDITION_DURATION_MS,
    backpack: cloneGrid(p.backpack),
    equipment: { ...p.equipment },
    hp: stats.maxHp,
    mp: stats.maxMp,
    goldFound: 0,
    xpGained: 0,
    kills: {},
    found: [],
    riskedValue: gridValue(p.backpack) + equippedValue(p.equipment),
  };
  return {
    profile: { ...p, activeExpedition: { startedAt: now }, stats: { ...p.stats, expeditions: p.stats.expeditions + 1 } },
    expedition,
  };
}

export function timeLeft(e: ExpeditionState, now: number): number {
  return Math.max(0, e.startedAt + e.durationMs - now);
}

function carried(e: ExpeditionState): ItemStack[] {
  return [...Object.values(e.equipment), ...e.backpack].filter((s): s is ItemStack => !!s);
}

export function endExpedition(p: Profile, e: ExpeditionState, reason: EndReason, now: number): { profile: Profile; summary: ExpeditionSummary } {
  const extracted = reason === 'extracted';
  const xp = applyXp(p.character.level, p.character.xp, e.xpGained);
  const totalKills = Object.values(e.kills).reduce((a, b) => a + b, 0);
  const extractedValue = extracted ? gridValue(e.backpack) + equippedValue(e.equipment) : 0;
  const quests = updateQuests(p.quests, { extracted, kills: e.kills, extractedValue: extracted ? gridValue(e.backpack) : 0 });

  const profile: Profile = {
    ...p,
    character: { ...p.character, level: xp.level, xp: xp.xp },
    gold: p.gold + (extracted ? e.goldFound : 0),
    backpack: extracted ? cloneGrid(e.backpack) : emptyGrid(p.backpack.length),
    equipment: extracted ? { ...e.equipment } : emptyEquipment(),
    quests,
    activeExpedition: null,
    stats: {
      ...p.stats,
      extractions: p.stats.extractions + (extracted ? 1 : 0),
      deaths: p.stats.deaths + (extracted ? 0 : 1),
      kills: p.stats.kills + totalKills,
    },
  };
  return {
    profile,
    summary: {
      reason,
      durationMs: Math.min(e.durationMs, now - e.startedAt),
      goldGained: extracted ? e.goldFound : 0,
      goldLost: extracted ? 0 : e.goldFound,
      xpGained: e.xpGained,
      levelsGained: xp.levelsGained,
      kills: { ...e.kills },
      kept: extracted ? carried(e) : [],
      lost: extracted ? [] : carried(e),
      found: e.found.map((s) => ({ ...s })),
      extractedValue,
    },
  };
}

/** Si la página se recargó a mitad de expedición: se anula sin castigo (el equipo de entrada se conserva). */
export function abandonInterruptedExpedition(p: Profile): Profile {
  return { ...p, activeExpedition: null };
}
