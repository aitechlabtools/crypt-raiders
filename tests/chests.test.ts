import { describe, expect, it } from 'vitest';
import { CHEST_TYPES, chestType, POCKET_SIZE } from '../src/core/data/chests';
import { CHEST_TABLES, rollLoot } from '../src/core/loot';
import { ITEMS } from '../src/core/data/items';
import { getEnemy } from '../src/core/data/enemies';
import { ZONES, ZONE_ORDER } from '../src/core/data/zones';
import { createProfile } from '../src/core/profile';
import { startExpedition, endExpedition } from '../src/core/expedition';
import { addToGrid, emptyGrid, transfer, quickMove, canPocket } from '../src/core/inventory';
import { makeRng } from '../src/core/rng';

describe('Cofres y llaves', () => {
  it('cada tabla de cofre tiene su tipo, y cada llave existe', () => {
    for (const t of Object.keys(CHEST_TABLES)) expect(CHEST_TYPES[t], t).toBeTruthy();
    for (const c of Object.values(CHEST_TYPES)) if (c.key) expect(ITEMS[c.key]?.category).toBe('key');
  });
  it('los baúles se abren sin llave; los cofres buenos piden la suya', () => {
    expect(chestType('common').key).toBeNull();
    expect(chestType('rich').key).toBe('iron_key');
    expect(chestType('cripta:rich').key).toBe('bone_key');
    expect(chestType('infierno:rich').key).toBe('sulfur_key');
    for (const z of ZONE_ORDER) expect(chestType(ZONES[z].chests.boss).key).toBe('relic_key');
  });
  it('cada jefe suelta siempre la llave de reliquia y cada élite la llave de su zona', () => {
    for (const z of ZONE_ORDER) {
      const boss = rollLoot(getEnemy(ZONES[z].boss).loot, makeRng(1));
      expect(boss.items.some((i) => i.itemId === 'relic_key'), z).toBe(true);
      const elite = rollLoot(getEnemy(ZONES[z].elite).loot, makeRng(2));
      expect(elite.items.some((i) => i.itemId === chestType(ZONES[z].chests.rich).key), z).toBe(true);
    }
  });
});

describe('Bolsillo seguro', () => {
  it('solo admite objetos pequeños', () => {
    expect(canPocket('iron_key')).toBe(true);
    expect(canPocket('health_potion')).toBe(true);
    expect(canPocket('rusty_sword')).toBe(false);
    const p = createProfile('A', 'warrior', { cloak: 0, skin: 0 });
    const c = { backpack: addToGrid(p.backpack, { uid: 'k', itemId: 'iron_key', qty: 1 }).grid, stash: p.stash, shared: [], loot: emptyGrid(0), pocket: emptyGrid(POCKET_SIZE), equipment: p.equipment };
    const sword = c.backpack.findIndex((s) => s?.itemId === 'rusty_sword');
    const key = c.backpack.findIndex((s) => s?.itemId === 'iron_key');
    if (sword >= 0) expect(quickMove(c, { kind: 'grid', container: 'backpack', index: sword }, 'pocket').ok).toBe(false);
    expect(quickMove(c, { kind: 'grid', container: 'backpack', index: key }, 'pocket').ok).toBe(true);
    expect(transfer(c, { kind: 'equip', slot: 'offHand' }, { kind: 'grid', container: 'pocket', index: 0 }, { classId: 'warrior', level: 1 }).ok).toBe(false);
  });
  it('lo que llevas en el bolsillo sobrevive a la muerte', () => {
    const p = createProfile('A', 'warrior', { cloak: 0, skin: 0 });
    p.pocket = addToGrid(emptyGrid(POCKET_SIZE), { uid: 'k', itemId: 'bone_key', qty: 2 }).grid;
    const { profile, expedition } = startExpedition(p, 0);
    const dead = endExpedition(profile, expedition, 'died', 1000).profile;
    expect(dead.backpack.filter(Boolean).length).toBe(0);
    expect(dead.pocket.find((s) => s?.itemId === 'bone_key')?.qty).toBe(2);
  });
});
