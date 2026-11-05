// Almacén por páginas. Todos los valores son editables.
/** Casillas por página (8 × 15: llena el panel del escritorio sin dejar hueco). */
export const STASH_PAGE_SIZE = 120;
/** Precio de las páginas propias 2, 3, 4 y 5 (la 1 es gratis). Cada una es de un personaje. */
export const STASH_PAGE_COSTS = [250, 600, 1200, 2500];
export const STASH_MAX_PAGES = STASH_PAGE_COSTS.length + 1;
/** Página «Compartido»: se compra una vez y sirve para todos los personajes (la única forma de pasar objetos entre ellos). */
export const SHARED_PAGE_COST = 1500;

// Almacén antiguo (antes de las páginas): 40 casillas y «Ampliar (+8)». Solo se usa para migrar y devolver lo pagado.
export const LEGACY_STASH_SIZE = 40;
export const LEGACY_STASH_ROW = 8;
export const LEGACY_STASH_UPGRADE_COSTS = [500, 1500, 4000, 10000];
