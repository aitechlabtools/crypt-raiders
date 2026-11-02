import { describe, expect, it } from 'vitest';
import { RECIPES, QUALITIES } from '../src/core/data/forge';
import { ITEMS } from '../src/core/data/items';
import { forge, forgeBlock, qualityStats } from '../src/core/forge';
import { computeStats } from '../src/core/stats';
import { createProfile } from '../src/core/profile';
import { addToGrid, emptyEquipment } from '../src/core/inventory';
import { makeRng } from '../src/core/rng';

const rich = () => {
  const p = createProfile('Brandiano', 'warrior', { cloak: 0, skin: 0 });
  let stash = p.stash;
  for (const [id, q] of [['bone_dust', 20], ['old_coin', 20], ['iron_ore', 20], ['copper_ore', 20], ['silver_ore', 20], ['blessed_silver', 20], ['ancient_bone', 20]] as const) stash = addToGrid(stash, { uid: id, itemId: id, qty: 10 }).grid, stash = addToGrid(stash, { uid: id + '2', itemId: id, qty: q - 10 }).grid;
  return { ...p, stash, gold: 10_000 };
};

describe('Forja', () => {
  it('cada receta fabrica un objeto real con materiales reales', () => {
    for (const r of RECIPES) {
      expect(ITEMS[r.result], r.id).toBeTruthy();
      for (const m of r.materials) expect(ITEMS[m.itemId], `${r.id} → ${m.itemId}`).toBeTruthy();
    }
  });
  it('sin el rango de Brand no se puede; con él, se forja y gasta materiales y oro', () => {
    const p = rich();
    expect(forgeBlock(p, RECIPES.find((r) => r.id === 'r_silver_sword')!, false)).toMatch(/Brand/);
    const r = forge(p, 'r_tempered_sword', false, makeRng(3));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.profile.gold).toBe(p.gold - 120);
    const made = r.profile.backpack.find((s) => s?.itemId === 'tempered_sword')!;
    expect(made.quality).toBe(r.quality);
    expect(made.forgedBy).toBe('Brandiano');
  });
  it('asegurar la calidad nunca da una tosca', () => {
    for (let seed = 1; seed < 40; seed++) {
      const r = forge(rich(), 'r_tempered_sword', true, makeRng(seed));
      expect(r.ok && r.quality >= 1).toBe(true);
    }
  });
  it('la calidad mejora las estadísticas del arma equipada', () => {
    expect(qualityStats({ atk: 10 }, 2).atk).toBe(Math.round(10 * (1 + QUALITIES[2].bonus)));
    const eq = { ...emptyEquipment(), mainHand: { uid: 'a', itemId: 'tempered_sword', qty: 1, quality: 2 } };
    const plain = { ...emptyEquipment(), mainHand: { uid: 'b', itemId: 'tempered_sword', qty: 1 } };
    expect(computeStats('warrior', 12, eq).atk).toBeGreaterThan(computeStats('warrior', 12, plain).atk);
  });
});
