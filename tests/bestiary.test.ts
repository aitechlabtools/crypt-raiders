import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../src/core/data/enemies';
import { BESTIARY_LORE } from '../src/core/data/bestiaryLore';
import { bestiaryByZone, bestiaryProgress, knowledge, noteKill, noteSeen } from '../src/core/bestiary';

describe('Bestiario', () => {
  it('todas las criaturas tienen texto y están en una zona', () => {
    const inZones = new Set(bestiaryByZone().flatMap((z) => z.ids));
    for (const id of Object.keys(ENEMIES)) {
      expect(BESTIARY_LORE[id], id).toBeTruthy();
      expect(inZones.has(id), id).toBe(true);
    }
    expect(bestiaryProgress({}).total).toBe(21);
  });
  it('se desbloquea al ver, al derrotar y tras 5 victorias', () => {
    let r = {};
    expect(knowledge(r, 'bat')).toBe(0);
    r = noteSeen(r, 'bat');
    expect(knowledge(r, 'bat')).toBe(1);
    r = noteKill(r, 'bat');
    expect(knowledge(r, 'bat')).toBe(2);
    for (let i = 0; i < 4; i++) r = noteKill(r, 'bat');
    expect(knowledge(r, 'bat')).toBe(3);
    expect(bestiaryProgress(r).known).toBe(1);
  });
});
