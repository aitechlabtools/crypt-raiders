import { describe, expect, it } from 'vitest';
import { emptyGrid } from '../src/core/inventory';
import { goldAsStacks, putCoins, takeCoins, earnGold, spendGold } from '../src/core/wallet';
import { gridGold } from '../src/core/gold';
import { createProfile } from '../src/core/profile';
import { sell } from '../src/core/economy';
import { migrateProfileToSave, composeProfile } from '../src/core/save';
import { withGold } from './helpers';

const g = (...cells: (object | null)[]) => [...cells, ...emptyGrid(8 - cells.length)] as never;

describe('Pagar y cobrar con monedas', () => {
  it('se paga primero con monedas sueltas, luego saquitos y por último sacos', () => {
    const grid = g({ uid: 'c', itemId: 'gold_coins', qty: 4 }, { uid: 'p', itemId: 'gold_pouch', qty: 1, gold: 20 }, { uid: 's', itemId: 'gold_sack', qty: 1, gold: 100 });
    const out = takeCoins(grid, 30)!;
    expect(out[0]).toBeNull(); // las 4 sueltas
    expect(out[1]?.gold).toBe(0); // 20 del saquito
    expect(out[2]?.gold).toBe(94); // y 6 del saco
    expect(gridGold(out)).toBe(94);
    expect(takeCoins(grid, 999)).toBeNull();
  });
  it('se cobra primero en los sacos con hueco y luego en monedas sueltas de 10 en 10', () => {
    const grid = g({ uid: 'p', itemId: 'gold_pouch', qty: 1, gold: 45 });
    const out = putCoins(grid, 27)!;
    expect(out[0]?.gold).toBe(50);
    expect(out.filter((x) => x?.itemId === 'gold_coins').map((x) => x!.qty)).toEqual([10, 10, 2]);
  });
  it('sin oro suficiente no se paga; sin sitio en el almacén no se vende', () => {
    const p = withGold(createProfile('A', 'warrior', { cloak: 0, skin: 0 }), 10);
    expect(spendGold(p, 11).ok).toBe(false);
    const full = { ...p, stash: p.stash.map((x) => x ?? { uid: Math.random().toString(), itemId: 'iron_sword', qty: 1 }) };
    const bp = emptyGrid(24); bp[0] = { uid: 'v', itemId: 'iron_sword', qty: 1 };
    const r = sell({ ...full, stash: full.stash.map((x) => (x?.itemId === 'gold_coins' ? { uid: 'z', itemId: 'iron_sword', qty: 1 } : x)), backpack: bp }, 'backpack', 0);
    expect(r.ok).toBe(false);
    expect(earnGold(p, 5).ok).toBe(true);
  });
  it('un oro grande se guarda en sacos llenos, saquitos y monedas', () => {
    const st = goldAsStacks(1248);
    expect(st.filter((x) => x.itemId === 'gold_sack').map((x) => x.gold)).toEqual([250, 250, 250, 250, 248]); // lo que sobra, si pasa de 3 saquitos, en otro saco
    expect(st.reduce((n, x) => n + (x.gold ?? x.qty), 0)).toBe(1248);
  });
  it('migración: el oro antiguo pasa a monedas ÷10 (redondeando a favor) en sacos del almacén, una sola vez', () => {
    const old = createProfile('Aldric', 'warrior', { cloak: 0, skin: 0 });
    old.gold = 12485; old.stash = old.stash.map(() => null);
    delete (old as { goldPhysical?: boolean }).goldPhysical;
    const s = migrateProfileToSave(JSON.parse(JSON.stringify(old)))!;
    const p = composeProfile(s, s.characters[0].id)!;
    expect(p.gold).toBe(1249);
    expect(p.goldPhysical).toBe(true);
    expect(p.stash.filter((x) => x?.itemId === 'gold_sack')).toHaveLength(5);
    expect(s.account.notes.some((n) => /El oro ahora pesa/.test(n))).toBe(true);
  });
});
