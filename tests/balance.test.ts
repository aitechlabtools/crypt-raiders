import { describe, expect, it } from 'vitest';
import { createCombat, performAction, runAITurn, currentActor, canUseSkill, getCombatant, type CombatState } from '../src/core/combat';
import { enemyCombatant, playerCombatant } from '../src/core/combatants';
import { createProfile } from '../src/core/profile';
import type { ClassId } from '../src/core/types';

// Simulación de balance: un jugador "razonable" contra cada criatura.
function simulate(cls: ClassId, enemyId: string, runs = 300, potions = 2) {
  const p = createProfile('Sim', cls, { cloak: 0, skin: 0 });
  let wins = 0;
  for (let seed = 1; seed <= runs; seed++) {
    let left = potions;
    const pl = playerCombatant(p.character, p.equipment, 999, 999);
    let s: CombatState = createCombat([pl, enemyCombatant(enemyId, 'e')], seed * 7919, { canFlee: false });
    let guard = 0;
    while (!s.outcome && guard++ < 300) {
      const a = currentActor(s)!;
      if (a.control !== 'player') { s = runAITurn(s); continue; }
      const me = getCombatant(s, 'player');
      if (me.hp / me.stats.maxHp < 0.35 && left > 0) { left--; s = performAction(s, { type: 'item', itemId: 'health_potion' }); continue; }
      const sk = me.skills.find((id) => canUseSkill(me, id) && (id !== 'iron_wall' || me.hp / me.stats.maxHp < 0.6));
      s = performAction(s, sk && seed % 2 === 0 ? { type: 'skill', skillId: sk, targetId: 'e' } : sk && me.mp >= me.stats.maxMp - 2 ? { type: 'skill', skillId: sk, targetId: 'e' } : { type: 'attack', targetId: 'e' });
    }
    if (s.outcome === 'victory') wins++;
  }
  return wins / runs;
}

describe('Balance de la demo (nivel 1, equipo inicial)', () => {
  const table: [ClassId, string, number, number][] = [
    ['warrior', 'skeleton', 0.9, 1], ['warrior', 'bat', 0.9, 1], ['mage', 'skeleton', 0.85, 1], ['mage', 'bat', 0.85, 1],
    ['warrior', 'ossuary_lord', 0.15, 0.85], ['mage', 'ossuary_lord', 0.1, 0.85],
  ];
  for (const [cls, en, min, max] of table) {
    it(`${cls} vs ${en}`, () => {
      const r = simulate(cls, en, 200, en === 'ossuary_lord' ? 3 : 2);
      console.log(`${cls} vs ${en}: ${(r * 100).toFixed(0)}% victorias`);
      expect(r).toBeGreaterThanOrEqual(min);
      expect(r).toBeLessThanOrEqual(max);
    });
  }
});
