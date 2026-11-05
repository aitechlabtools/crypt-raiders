import { withGold } from './helpers';
import { describe, expect, it } from 'vitest';
import { VENDORS, VENDOR_ORDER } from '../src/core/data/vendors';
import { QUESTS } from '../src/core/data/quests';
import { ITEMS } from '../src/core/data/items';
import { ENEMIES } from '../src/core/data/enemies';
import { REP_RANKS, rankOf } from '../src/config/reputation';
import { buy, buyPrice } from '../src/core/economy';
import { createProfile } from '../src/core/profile';
import { offeredQuests, updateQuests, isComplete, initialQuests } from '../src/core/quests';
import { addToGrid } from '../src/core/inventory';

describe('Vendedores y reputación', () => {
  it('toda la mercancía existe y cada vendedor tiene misiones', () => {
    for (const id of VENDOR_ORDER) {
      for (const s of VENDORS[id].stock) expect(ITEMS[s.itemId], `${id} → ${s.itemId}`).toBeTruthy();
      // El Coleccionista no da encargos (solo comercia)
      if (id !== 'coleccionista') expect(QUESTS.filter((q) => q.vendor === id).length, id).toBeGreaterThanOrEqual(4);
    }
  });
  it('las misiones apuntan a criaturas y objetos que existen', () => {
    for (const q of QUESTS) {
      if (q.type === 'kill' || q.type === 'kill_boss') expect(ENEMIES[q.target!], q.id).toBeTruthy();
      if (q.type === 'deliver') expect(ITEMS[q.target!], q.id).toBeTruthy();
    }
  });
  it('los rangos bajan el precio', () => {
    expect(rankOf(0)).toBe(0);
    expect(rankOf(320)).toBe(2);
    expect(buyPrice('iron_sword', 0)).toBe(Math.round(ITEMS.iron_sword.value / 10));
    expect(buyPrice('iron_sword', 1500)).toBe(Math.round(ITEMS.iron_sword.value / 10 * (1 - REP_RANKS[4].discount)));
  });
  it('lo bueno pide rango: sin reputación no te lo venden', () => {
    const p = withGold(createProfile('A', 'warrior', { cloak: 0, skin: 0 }), 10_000);
    expect(buy(p, 'bone_key', 'vesper').ok).toBe(false);
    expect(buy({ ...p, reputation: { vesper: 300 } }, 'bone_key', 'vesper').ok).toBe(true);
    expect(buy(p, 'bone_key', 'orvel').ok).toBe(false);
  });
});

describe('Misiones de los vendedores', () => {
  it('cada vendedor ofrece como mucho 3 de tu nivel', () => {
    const p = createProfile('A', 'warrior', { cloak: 0, skin: 0 });
    for (const id of VENDOR_ORDER) {
      const o = offeredQuests(p, id);
      expect(o.length).toBeLessThanOrEqual(3);
      for (const q of o) expect(QUESTS.find((x) => x.id === q.id)!.minLevel ?? 1).toBeLessThanOrEqual(1);
    }
  });
  it('extraer desde una zona y abrir cofres cuentan', () => {
    let qs = initialQuests();
    qs = updateQuests(qs, { extracted: true, kills: {}, extractedValue: 0, zone: 'cripta', chestsOpened: { rich: 2 } });
    expect(qs.find((q) => q.id === 'q_brand_crypt')!.progress).toBe(1);
    expect(qs.find((q) => q.id === 'q_orvel_iron')!.progress).toBe(2);
  });
  it('las entregas se completan con lo que tienes', () => {
    const p = createProfile('A', 'warrior', { cloak: 0, skin: 0 });
    const q = p.quests.find((x) => x.id === 'q_brand_bone')!;
    expect(isComplete(q, p)).toBe(false);
    const rich = { ...p, stash: addToGrid(p.stash, { uid: 'd', itemId: 'bone_dust', qty: 10 }).grid };
    expect(isComplete(q, rich)).toBe(true);
  });
});

