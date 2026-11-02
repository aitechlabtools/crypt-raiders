// Rangos de reputación con cada vendedor. Editable: reputación necesaria y descuento de cada rango.
export interface RepRank { name: string; rep: number; discount: number }

export const REP_RANKS: RepRank[] = [
  { name: 'Desconocido', rep: 0, discount: 0 },
  { name: 'Conocido', rep: 100, discount: 0.05 },
  { name: 'De confianza', rep: 300, discount: 0.1 },
  { name: 'Aliado', rep: 700, discount: 0.15 },
  { name: 'Leyenda', rep: 1500, discount: 0.2 },
];

/** Rango (índice en REP_RANKS) para una cantidad de reputación. */
export function rankOf(rep: number): number {
  let r = 0;
  REP_RANKS.forEach((k, i) => { if (rep >= k.rep) r = i; });
  return r;
}
