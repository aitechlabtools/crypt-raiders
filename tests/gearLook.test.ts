import { describe, expect, it } from 'vitest';
import { ITEMS } from '../src/core/data/items';
import { GEAR_LOOKS, lookSignature, starterEquipment, SHOWCASE_GEAR } from '../src/shared/gearLook';
import { emptyEquipment } from '../src/core/inventory';
import { CLASSES } from '../src/core/data/classes';
import type { ClassId } from '../src/core/types';

describe('Apariencia según el equipo', () => {
  it('todos los objetos equipables tienen aspecto definido y en su ranura', () => {
    for (const it of Object.values(ITEMS)) {
      if (!it.slot) continue;
      const look = GEAR_LOOKS[it.id];
      expect(look, it.id).toBeDefined();
      expect(look.slot, it.id).toBe(it.slot);
    }
  });
  it('cambiar una pieza visible cambia el aspecto; el anillo no', () => {
    const base = emptyEquipment();
    const withHelm = { ...base, helmet: { uid: 'h', itemId: 'iron_helm', qty: 1 } };
    const withHood = { ...base, helmet: { uid: 'h', itemId: 'leather_hood', qty: 1 } };
    const withRing = { ...base, ring: { uid: 'r', itemId: 'copper_ring', qty: 1 } };
    expect(lookSignature(withHelm)).not.toBe(lookSignature(base));
    expect(lookSignature(withHelm)).not.toBe(lookSignature(withHood));
    expect(lookSignature(withRing)).toBe(lookSignature(base));
  });
  it('el equipo inicial y el de escaparate solo usan objetos que la clase puede llevar', () => {
    for (const id of Object.keys(CLASSES) as ClassId[]) {
      for (const eq of [starterEquipment(id), SHOWCASE_GEAR[id]]) {
        for (const s of Object.values(eq)) {
          if (!s) continue;
          const def = ITEMS[s.itemId];
          if (def.classes) expect(def.classes, `${id} ${s.itemId}`).toContain(id);
        }
      }
    }
  });
});
