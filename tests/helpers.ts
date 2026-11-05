// Ayudas para los tests: dar a un perfil una cantidad exacta de oro (monedas de verdad en su almacén).
import type { Profile } from '../src/core/types';
import { addToGrid, emptyGrid, LAYOUTS } from '../src/core/inventory';
import { goldOf } from '../src/core/gold';
import { goldAsStacks, syncGold } from '../src/core/wallet';

export function withGold<T extends Profile>(p: T, amount: number): T {
  let stash = p.stash.map((x) => (goldOf(x) > 0 || x?.itemId === 'gold_coins' ? null : x));
  stash = stash.map((x) => (x?.itemId === 'cover' && !stash.some((y) => y && 'cover:' + y.uid === x.uid) ? null : x));
  for (const s of goldAsStacks(amount)) {
    let r = addToGrid(stash, s, LAYOUTS.stash);
    while (r.leftover) { stash = [...stash, ...emptyGrid(120)]; r = addToGrid(stash, s, LAYOUTS.stash); }
    stash = r.grid;
  }
  return syncGold({ ...p, stash });
}
