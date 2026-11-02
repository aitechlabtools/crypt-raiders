import { describe, expect, it } from 'vitest';
import { applyXp, xpForNextLevel, computeStats, MAX_LEVEL } from '../src/core/stats';
import { migrateProfile, sanitizeProfile, createProfile } from '../src/core/profile';
import { enemyXp } from '../src/core/combatants';
import { legacyLevelToNew } from '../src/config/progression';
import type { Profile } from '../src/core/types';

describe('Progresión hasta el nivel 100', () => {
  it('el nivel máximo es 100 y no se pasa de ahí', () => {
    expect(MAX_LEVEL).toBe(100);
    const r = applyXp(99, 0, 10_000_000);
    expect(r.level).toBe(100);
    expect(r.xp).toBe(0);
  });
  it('cada nivel pide más experiencia que el anterior', () => {
    for (let l = 1; l < 100; l++) expect(xpForNextLevel(l + 1)).toBeGreaterThan(xpForNextLevel(l));
  });
  it('el ritmo de subida es el buscado: ~1 expedición por nivel al principio, ~4 en el 30, ~6 en el 60, ~8 cerca del 100', () => {
    // Expedición tipo: 6 criaturas de 38 XP base del nivel del jugador (sin contar jefe ni misiones)
    const per = (l: number) => xpForNextLevel(l) / (6 * enemyXp(38, l));
    expect(per(5)).toBeLessThan(1.5);
    expect(per(30)).toBeGreaterThan(3); expect(per(30)).toBeLessThan(5);
    expect(per(60)).toBeGreaterThan(5); expect(per(60)).toBeLessThan(7.5);
    expect(per(95)).toBeGreaterThan(6.5); expect(per(95)).toBeLessThan(9.5);
  });
  it('el nivel 30 tiene la fuerza del antiguo nivel 10', () => {
    const s30 = computeStats('warrior', 30, {} as never);
    expect(s30.maxHp).toBeGreaterThan(computeStats('warrior', 1, {} as never).maxHp);
  });
});

describe('Migración de partidas guardadas (v1 → v2)', () => {
  const v1 = (level: number, xp: number): Profile => {
    const p = createProfile('Viejo', 'warrior', { cloak: 0, skin: 0 });
    (p as unknown as { version: number }).version = 1; p.character.level = level; p.character.xp = xp;
    return p;
  };
  it('convierte el nivel a la escala nueva y conserva el progreso', () => {
    const old = Math.round(100 * Math.pow(5, 1.4));
    const p = migrateProfile(v1(5, Math.floor(old / 2)));
    expect(p.version).toBe(2);
    expect(p.character.level).toBe(legacyLevelToNew(5));
    expect(p.character.xp / xpForNextLevel(p.character.level)).toBeCloseTo(0.5, 1);
  });
  it('los niveles de los objetos y del jugador se convierten igual', () => {
    expect(legacyLevelToNew(1)).toBe(1);
    expect(legacyLevelToNew(3)).toBe(7);
    expect(legacyLevelToNew(5)).toBe(14);
    expect(legacyLevelToNew(8)).toBe(24);
    expect(legacyLevelToNew(10)).toBe(30);
  });
  it('un perfil antiguo se carga sin perder objetos ni oro', () => {
    const before = v1(8, 0);
    const gold = before.gold, items = before.backpack.filter(Boolean).length;
    const p = sanitizeProfile(JSON.parse(JSON.stringify(before)))!;
    expect(p).not.toBeNull();
    expect(p.gold).toBe(gold);
    expect(p.backpack.filter(Boolean).length).toBe(items);
    expect(p.character.level).toBe(24);
  });
});
