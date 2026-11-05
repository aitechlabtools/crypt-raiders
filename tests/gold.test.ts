import { describe, expect, it } from 'vitest';
import { addToGrid, canPocket, emptyGrid, emptyEquipment, LAYOUTS, transfer, type Containers } from '../src/core/inventory';
import { depositCoins, goldOf, gridGold, groupGold, splitCoins, withdrawCoins } from '../src/core/gold';
import { sell } from '../src/core/economy';
import { createProfile } from '../src/core/profile';

const coins = (uid: string, qty: number) => ({ uid, itemId: 'gold_coins', qty });
const pouch = (uid: string, gold = 0) => ({ uid, itemId: 'gold_pouch', qty: 1, gold });
const sack = (uid: string, gold = 0) => ({ uid, itemId: 'gold_sack', qty: 1, gold });
const ctx = { classId: 'warrior' as const, level: 10 };
const cont = (bp: ReturnType<typeof emptyGrid>, st = emptyGrid(120)): Containers => ({ backpack: bp, stash: st, shared: emptyGrid(0), loot: emptyGrid(4), pocket: emptyGrid(3), equipment: emptyEquipment() });

describe('Monedas de oro', () => {
  it('se apilan de 10 en 10', () => {
    const r = addToGrid(emptyGrid(24), coins('a', 23));
    expect(r.grid.slice(0, 3).map((x) => x?.qty)).toEqual([10, 10, 3]);
    expect(gridGold(r.grid)).toBe(23);
  });
  it('dividir un montón y juntarlo de nuevo soltándolo encima', () => {
    const g = emptyGrid(6); g[0] = coins('a', 9);
    const r = splitCoins(g, 0, 4);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.grid[0]?.qty).toBe(5); expect(r.grid[1]?.qty).toBe(4);
    const t = transfer(cont([...r.grid, ...emptyGrid(18)]), { kind: 'grid', container: 'backpack', index: 1 }, { kind: 'grid', container: 'backpack', index: 0 }, ctx);
    expect(t.ok && t.containers.backpack[0]?.qty).toBe(9);
  });
});

describe('Saquito y saco', () => {
  it('soltar monedas sobre un saco las mete (las que quepan)', () => {
    const bp = emptyGrid(24); bp[0] = coins('a', 10); bp[1] = pouch('p', 45);
    const t = transfer(cont(bp), { kind: 'grid', container: 'backpack', index: 0 }, { kind: 'grid', container: 'backpack', index: 1 }, ctx);
    expect(t.ok).toBe(true);
    if (!t.ok) return;
    expect(t.containers.backpack[1]?.gold).toBe(50);
    expect(t.containers.backpack[0]?.qty).toBe(5); // no caben: se quedan fuera
  });
  it('también entre la mochila y el almacén, y sobre cualquier casilla del saco grande', () => {
    const st = addToGrid(emptyGrid(120), sack('S', 100), LAYOUTS.stash).grid;
    const bp = emptyGrid(24); bp[0] = coins('a', 10);
    const t = transfer(cont(bp, st), { kind: 'grid', container: 'backpack', index: 0 }, { kind: 'grid', container: 'stash', index: 9 }, ctx);
    expect(t.ok && t.containers.stash[0]?.gold).toBe(110);
    expect(t.ok && t.containers.backpack[0]).toBeNull();
  });
  it('sacar monedas de un saco con el selector', () => {
    const g = emptyGrid(24); g[0] = pouch('p', 37);
    const r = withdrawCoins(g, 0, 25, LAYOUTS.backpack);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.grid[0]?.gold).toBe(12);
    expect(gridGold(r.grid)).toBe(37);
    expect(r.grid.filter((x) => x?.itemId === 'gold_coins').map((x) => x!.qty)).toEqual([10, 10, 5]);
  });
  it('sin sitio, las monedas se quedan dentro', () => {
    const g = [pouch('p', 30)];
    const r = withdrawCoins(g, 0, 20);
    expect(r.ok).toBe(false);
  });
  it('«Agrupar oro» llena los sacos (los más llenos primero) y junta lo que sobra de 10 en 10', () => {
    const g = emptyGrid(12);
    g[0] = coins('a', 7); g[1] = coins('b', 7); g[2] = pouch('p1', 40); g[3] = pouch('p2', 0); g[4] = coins('c', 9);
    const r = groupGold(g);
    expect(r.grid[2]?.gold).toBe(50); // 40 + 10
    expect(r.grid[3]?.gold).toBe(13); // el resto
    expect(gridGold(r.grid)).toBe(23 + 40);
    expect(r.grid.filter((x) => x?.itemId === 'gold_coins')).toHaveLength(0);
  });
  it('en el bolsillo seguro caben monedas y saquitos, pero no el saco grande', () => {
    expect(canPocket('gold_coins')).toBe(true);
    expect(canPocket('gold_pouch')).toBe(true);
    expect(canPocket('gold_sack')).toBe(false);
  });
  it('no se venden monedas ni sacos con oro; un saco vacío sí', () => {
    const p = createProfile('A', 'warrior', { cloak: 0, skin: 0 });
    const bp = emptyGrid(24); bp[0] = coins('a', 5); bp[1] = pouch('p', 3); bp[2] = pouch('q', 0);
    const q = { ...p, backpack: bp };
    expect(sell(q, 'backpack', 0).ok).toBe(false);
    expect(sell(q, 'backpack', 1).ok).toBe(false);
    expect(sell(q, 'backpack', 2).ok).toBe(true);
    expect(goldOf(bp[1])).toBe(3);
  });
  it('meter monedas en un saco lleno avisa', () => {
    const g = emptyGrid(4); g[0] = coins('a', 3); g[1] = pouch('p', 50);
    expect(depositCoins(g, 0, 1).ok).toBe(false);
  });
});
