// Generador pseudoaleatorio con semilla (mulberry32).
// Todo lo que dependa del azar en combate y botín usa esto: los resultados son reproducibles.

export interface Rng {
  state: number;
  next(): number; // [0, 1)
  int(min: number, max: number): number; // ambos inclusive
  chance(p: number): boolean;
  pick<T>(arr: readonly T[]): T;
}

export function makeRng(seed: number): Rng {
  const rng: Rng = {
    state: seed >>> 0,
    next() {
      rng.state = (rng.state + 0x6d2b79f5) >>> 0;
      let t = rng.state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(min, max) {
      return min + Math.floor(rng.next() * (max - min + 1));
    },
    chance(p) {
      return rng.next() < p;
    },
    pick(arr) {
      return arr[Math.floor(rng.next() * arr.length)];
    },
  };
  return rng;
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

let uidCounter = 0;
export function makeUid(prefix = 'it'): string {
  uidCounter += 1;
  const rand = Math.floor(Math.random() * 0xffffff).toString(36);
  return `${prefix}_${Date.now().toString(36)}_${uidCounter.toString(36)}_${rand}`;
}
