import { describe, expect, it } from 'vitest';
import { generateDungeon, validateDungeon } from '../src/core/dungeonGen';
import { CRYPTS_OF_UMBRAVEL } from '../src/core/dungeon';

describe('Generador procedural de mazmorras', () => {
  it('genera mapas válidos y completos para muchas semillas', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const d = generateDungeon(seed * 104729);
      const v = validateDungeon(d);
      expect(v.problems, `semilla ${seed}`).toEqual([]);
      const kinds = d.entities.map((e) => e.kind);
      expect(kinds.filter((k) => k === 'spawn').length).toBe(1);
      expect(kinds.filter((k) => k === 'portal').length).toBe(1);
      expect(kinds.filter((k) => k === 'rival').length).toBe(1);
      expect(d.entities.some((e) => e.kind === 'enemy' && e.enemyId === 'ossuary_lord')).toBe(true);
      expect(d.entities.filter((e) => e.kind === 'chest').length).toBeGreaterThanOrEqual(3);
      expect(d.entities.filter((e) => e.kind === 'enemy').length).toBeGreaterThanOrEqual(4);
      expect(d.rooms.length).toBeGreaterThanOrEqual(6);
    }
  });
  it('es determinista: la misma semilla da el mismo mapa', () => {
    expect(generateDungeon(4242)).toEqual(generateDungeon(4242));
    expect(generateDungeon(4242)).not.toEqual(generateDungeon(4243));
  });
  it('la mazmorra diseñada a mano también pasa la validación', () => {
    expect(validateDungeon(CRYPTS_OF_UMBRAVEL).problems).toEqual([]);
  });
});
